import test from 'node:test'
import assert from 'node:assert/strict'
import {buildDemoPayload,installAssessmentDemo,DEMO_MARKER} from './assessmentDemo/storage.js'
import {resetAssessmentTrackerOnce} from './assessmentTrackerReset.js'
const now=new Date('2026-10-22T06:00:00Z')
class Store {
 constructor(){this.values=new Map()}
 get length(){return this.values.size}
 key(i){return [...this.values.keys()][i]??null}
 getItem(k){return this.values.get(k)??null}
 setItem(k,v){this.values.set(k,String(v))}
 removeItem(k){this.values.delete(k)}
}
const read=(s,k)=>JSON.parse(s.getItem(k))
test('published fixtures cover all ten delivery combinations with usable questions and split timing',()=>{
 const {data}=buildDemoPayload(now)
 const combinations=new Set(data.published.map(row=>[
  row.examMode,row.supervisionType,row.examType,row.setup.splitProctoredDuration?'split':'standard',
 ].join('|')))
 for(const mode of ['Proctored Exam','Practice Exam','Offline Exam']){
  for(const kind of ['MCQ','Descriptive','Hybrid']){
   const delivery=mode==='Offline Exam'?'Offline':'Online'
   assert.ok(combinations.has(`${delivery}|${mode}|${kind}|standard`))
  }
 }
 assert.ok(combinations.has('Online|Proctored Exam|Hybrid|split'))
 for(const mode of ['Proctored Exam','Practice Exam']){
  assert.ok(data.published.some(row=>row.supervisionType===mode && row.examType==='Descriptive'
   && row.demoStage==='live' && row.setup.descriptiveDisplayType==='Answer Input'))
 }
 const split=data.published.find(row=>row.setup.splitProctoredDuration)
 const minutes=value=>value.split(':').reduce((hours,part)=>hours*60+Number(part),0)
 assert.equal(minutes(split.setup.mcqTimeLimit)+minutes(split.setup.descriptiveTimeLimit),minutes(split.totalDuration))
 assert.equal(new Set(data.published.map(row=>row.id)).size,data.published.length)
 for(const row of data.published){
  assert.equal(row.questionCount,row.questionRows.length)
  assert.ok(row.questionRows.every(q=>row.examType==='Hybrid'||(q.type==='MCQ')===(row.examType==='MCQ')))
 }
})
test('version one upgrade adds missing combinations once without replacing existing work',()=>{
 const local=new Store(),session=new Store()
 installAssessmentDemo(local,session,{now})
 const added=['proctored-descriptive','practice-descriptive','offline-mcq','offline-descriptive']
 const rows=read(local,'vx-assessment-published').filter(row=>!added.includes(row.demoScenario))
 rows[0].assessmentName='Keep my edited assessment'
 local.setItem('vx-assessment-published',JSON.stringify(rows))
 const marker={version:1,createdAt:now.toISOString()}
 local.setItem(DEMO_MARKER,JSON.stringify(marker))
 local.setItem('vx-online-practice-exam-attempts',JSON.stringify({real:{saved:true},[rows[0].id]:{MC2568:{answers:{q:1}}}}))
 const before=JSON.stringify(rows)
 installAssessmentDemo(local,session,{now:new Date(now.getTime()+86400000)})
 const upgraded=read(local,'vx-assessment-published')
 assert.equal(JSON.stringify(upgraded.slice(0,rows.length)),before)
 assert.equal(upgraded.length,20)
 assert.equal(read(local,'vx-online-practice-exam-attempts')[rows[0].id].MC2568.answers.q,1)
 assert.equal(read(local,'vx-online-practice-exam-attempts').real.saved,true)
 assert.deepEqual(read(local,DEMO_MARKER),{...marker,version:2})
 // Deliberately deleted samples stay deleted on later reloads.
 local.setItem('vx-assessment-published',JSON.stringify(upgraded.slice(0,-1)))
 installAssessmentDemo(local,session,{now})
 assert.equal(read(local,'vx-assessment-published').length,19)
})
test('fixtures cover tracker stages and connected published results',()=>{
 const {data,local}=buildDemoPayload(now)
 assert.equal(data.drafts.length,3);assert.equal(data.queue.length,4);assert.equal(data.published.length,20)
 for(const row of [...data.drafts,...data.queue,...data.published]){
  assert.equal(row.totalMarks,row.questionRows.reduce((n,q)=>n+q.marks,0))
  assert.equal(row.students.length,5)
  for(const q of row.questionRows.filter(q=>q.type==='MCQ'))assert.ok(q.correctOptionIds.every(id=>q.options.some(o=>o.id===id)))
 }
 for(const row of data.published.filter(r=>r.demoStage==='results')){
  assert.equal(Object.keys(row.studentResults).length,4)
  assert.ok(Object.values(row.studentResults).every(r=>r.status==='published'))
  assert.equal(row.studentResults.MV1256,undefined)
 }
 const pending=local['vx-assessment-student-evaluation-status:demo-assessment-manual-evaluation']
 assert.equal(pending.MC2568.status,'Completed');assert.equal(pending.MV1253.status,'Yet to Start')
 const long=data.published.find(r=>r.demoScenario==='practice-live').questionRows.filter(q=>q.type!=='MCQ')
 assert.equal(long.length,30)
})
test('first install and refresh preserve non-demo records and attempts',()=>{
 const local=new Store(),session=new Store()
 local.setItem('vx-assessment-drafts',JSON.stringify([{id:'real',assessmentName:'Keep me'}]))
 local.setItem('vx-online-practice-exam-attempts',JSON.stringify({real:{student:{answers:{q:1}}}}))
 session.setItem('vx-approval-queue-rows',JSON.stringify([{id:'real-queue'}]))
 installAssessmentDemo(local,session,{now})
 assert.equal(read(local,'vx-assessment-drafts').length,4)
 installAssessmentDemo(local,session,{now:new Date(now.getTime()+86400000),refresh:true})
 assert.equal(read(local,'vx-assessment-drafts')[0].assessmentName,'Keep me')
 assert.equal(read(local,'vx-online-practice-exam-attempts').real.student.answers.q,1)
 assert.equal(read(session,'vx-approval-queue-rows')[0].id,'real-queue')
})
test('reload preserves edits, deletions and anchored schedules; new tab restores queue',()=>{
 const local=new Store(),session=new Store();installAssessmentDemo(local,session,{now})
 const rows=read(local,'vx-assessment-published');rows[0].assessmentName='Edited';rows.pop();local.setItem('vx-assessment-published',JSON.stringify(rows))
 const stored=local.getItem('vx-assessment-published');const marker=local.getItem(DEMO_MARKER)
 installAssessmentDemo(local,new Store(),{now:new Date(now.getTime()+86400000)})
 assert.equal(local.getItem('vx-assessment-published'),stored);assert.equal(local.getItem(DEMO_MARKER),marker)
 const next=new Store();installAssessmentDemo(local,next,{now});assert.equal(read(next,'vx-approval-queue-rows').length,4)
})
test('write failure rolls back seed across both storage areas',()=>{
 const local=new Store(),session=new Store();local.setItem('sentinel','unchanged')
 const original=session.setItem.bind(session);let failed=false
 session.setItem=(key,value)=>{if(!failed){failed=true;throw Error('quota')}original(key,value)}
 assert.throws(()=>installAssessmentDemo(local,session,{now}),/quota/)
 assert.deepEqual([...local.values],[['sentinel','unchanged']]);assert.equal(session.values.size,0)
})
test('retired tracker migration never deletes saved data',()=>{
 const local=new Store(),session=new Store();local.setItem('vx-assessment-drafts','[{"id":"real"}]');session.setItem('vx-approval-queue-rows','[{"id":"queue"}]')
 resetAssessmentTrackerOnce(local,session)
 assert.equal(read(local,'vx-assessment-drafts')[0].id,'real');assert.equal(read(session,'vx-approval-queue-rows')[0].id,'queue')
})

test('refresh clears stale demo detail state but preserves real detail state',()=>{
 const local=new Store(),session=new Store();installAssessmentDemo(local,session,{now})
 local.setItem('vx-assessment-student-question-evaluation:demo-assessment-practice-mcq:MC2568','{}')
 local.setItem('vx-assessment-student-question-evaluation:real:MC2568','{}')
 installAssessmentDemo(local,session,{now,refresh:true})
 assert.equal(local.getItem('vx-assessment-student-question-evaluation:demo-assessment-practice-mcq:MC2568'),null)
 assert.equal(local.getItem('vx-assessment-student-question-evaluation:real:MC2568'),'{}')
})
