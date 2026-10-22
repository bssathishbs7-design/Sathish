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
test('fixtures cover tracker stages and connected published results',()=>{
 const {data,local}=buildDemoPayload(now)
 assert.equal(data.drafts.length,3);assert.equal(data.queue.length,4);assert.equal(data.published.length,16)
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
