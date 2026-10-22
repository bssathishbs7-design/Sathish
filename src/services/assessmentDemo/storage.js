import { createAssessmentDemoData } from './scenarios.js'
import { descriptiveResponseItems } from '../descriptiveResponses.js'
import { prepareAssessmentResult, automatedEvaluationKey } from '../assessmentResultRelease.js'

export const DEMO_MARKER='vx-assessment-demo-v1'
export const DEMO_QUEUE='vx-assessment-demo-queue'
export const isDemoRecord = row => String(row?.setup?.assessmentId || row?.assessmentId || row?.activityId || row?.id || '').startsWith('demo-assessment-')
const read=(store,key,fallback)=>JSON.parse(store.getItem(key)||'null')??fallback
const localMaps=['vx-online-practice-exam-attempts','vx-online-proctored-exam-attempts','vx-student-exam-session','vx-student-exam-submission-status','vx-student-exam-time-extensions','vx-student-exam-reset-state']

/** Build connected storage payloads; every result comes from the same questions and saved answers.
 * @returns {{local:Object,session:Object}} Serialised storage contract used by current mock adapters.
 */
export function buildDemoPayload(now=new Date()) {
 const data=createAssessmentDemoData(now)
 const local={}, session={}
 const maps=Object.fromEntries(localMaps.map(key=>[key,{}]))
 for(const row of [...data.drafts,...data.queue,...data.published]) {
  const id=row.setup.assessmentId
  local[`vx-assessment-history:${id}`]=[{id:`${id}:created`,action:'Assessment created',timestamp:row.createdAt,actor:'Dr. Arjun Rao'},
   {id:`${id}:stage`,action:row.approvalStatus || (row.status==='Draft'?'Draft saved':'Assessment published'),timestamp:row.updatedAt,actor:'Dr. Meera Nair'}]
 }
 for(const row of data.published){
  const id=row.id, completed=['evaluation','evaluated','results'].includes(row.demoStage)
  const practice=row.supervisionType==='Practice Exam'
  const attemptKey=practice?'vx-online-practice-exam-attempts':'vx-online-proctored-exam-attempts'
  maps[attemptKey][id]={};maps['vx-student-exam-session'][id]={};maps['vx-student-exam-submission-status'][id]={}
  const results={}, statuses={}
  row.students.filter(s=>s.attendance==='P').forEach((student,studentIndex)=>{
   if(!completed){
    if(row.demoStage==='live' && studentIndex>0) maps['vx-student-exam-session'][id][student.id]={loginTime:new Date(now.getTime()-5*60000).toISOString(),studentName:student.name}
    return
   }
   const submittedAt=new Date(now.getTime()-26*3600000).toISOString()
   const attempt={hasStarted:true,examStartedAt:now.getTime()-28*3600000,isAssessmentSubmitted:true,isMcqSubmitted:true,isDescriptiveSubmitted:true,submittedAt,appliedResetVersion:0,answers:{},descriptiveAnswers:{},activeSection:'mcq'}
   const evaluation={}
   row.questionRows.filter(q=>q.type==='MCQ').forEach((q,i)=>{
    const selected=studentIndex===3?null:i%3===0?1:i%3===1?0:q.options.findIndex(o=>q.correctOptionIds.includes(o.id))
    if(selected!==null) attempt.answers[q.id]=selected
    const correct=selected!==null&&q.correctOptionIds.includes(q.options[selected].id)
    evaluation[q.id]={status:selected===null?'not-attempted':correct?'correct':'wrong',marks:correct?q.marks:0,manualOverride:true}
   })
   row.questionRows.filter(q=>q.type!=='MCQ').forEach((q,i)=>descriptiveResponseItems(q,i).forEach(({key,item},part)=>{
    const answered=studentIndex<3 && (i+part)%3!==2
    if(answered) attempt.descriptiveAnswers[key]=item.modelAnswer || q.modelAnswer
    evaluation[key]={status:answered?'evaluated':'not-attempted',marks:answered?Number(item.marks):0,manualOverride:true,feedback:answered?'Reviewed against the model answer.':'No response submitted.'}
   }))
   maps[attemptKey][id][student.id]=attempt
   maps['vx-student-exam-session'][id][student.id]={loginTime:new Date(attempt.examStartedAt).toISOString(),studentName:student.name}
   maps['vx-student-exam-submission-status'][id][student.id]={status:'Manual Submit',updatedAt:submittedAt}
   const pending=row.demoStage==='evaluation'&&studentIndex>0
   const prepared=prepareAssessmentResult(row,attempt,{},pending?{}:evaluation,now.getTime())
   if(!prepared)return
   if(row.demoStage==='results') {prepared.result.status='published';prepared.result.publishedAt=new Date(now.getTime()-20*3600000).toISOString()}
   local[automatedEvaluationKey(row,student.id,attempt)]=prepared.evaluation
   results[student.id]=prepared.result
   const complete=prepared.result.status!=='evaluating'
   statuses[student.id]={status:complete?'Completed':'Yet to Start',markedEvaluated:complete,autoEvaluated:row.setup.descriptiveAutoEvaluation==='Yes',resultStatus:prepared.result.status}
  })
  if(completed){row.studentResults=results;local[`vx-assessment-student-evaluation-status:${id}`]=statuses;if(row.demoStage==='results')row.resultsPublishedAt=new Date(now.getTime()-20*3600000).toISOString()}
  if(row.demoStage==='live') {
   const at=new Date(now.getTime()-60000).toISOString()
   local[`vx-exam-controls-state:${id}`]={MV1253:{overallStatus:'In progress',fullscreenViolationTotal:1,logs:[{id:'demo-warning',time:'Just now',timestamp:at,action:'Warning issued',remarks:'Demo: focus left the exam window.',faculty:'Dr. Meera Nair'}]},MV1254:{overallStatus:'In progress',extensionMinutes:5,logs:[{id:'demo-extension',timestamp:at,action:'Time extended',remarks:'Five additional minutes granted.',faculty:'Dr. Meera Nair'}]}}
   maps['vx-student-exam-time-extensions'][id]={MV1254:{extensionMinutes:5,updatedAt:at}}
   if(['locked','paused'].includes(row.demoScenario)){
    maps['vx-student-exam-session'][id].MC2568={loginTime:at}
    local[`vx-exam-controls-state:${id}`].MC2568={overallStatus:'Locked',fullscreenViolationTotal:2,invigilatorLock:{active:true,lockedAt:at,exitCount:2},logs:[{id:'demo-lock',timestamp:at,action:'Exam locked',remarks:'Demo invigilator lock. Restore access from Exam Controls.',faculty:'Dr. Meera Nair'}]}
   }
   if(row.demoScenario==='locked')local[`vx-exam-controls-state:${id}`].MC2568.accessRequest={active:true,requestedAt:at,requestedBy:'MC2568'}
  }
 }
 Object.assign(local,maps,{'vx-assessment-drafts':data.drafts,'vx-assessment-published':data.published,[DEMO_QUEUE]:data.queue})
 const result=data.published.find(r=>r.demoScenario==='hybrid-result')
 const student={...result.students[0],evaluationStatus:'Completed'}
 Object.assign(session,{'vx-approval-queue-rows':data.queue,'vx-assessment-evaluation-selected':result,'vx-assessment-evaluation-student':student,
 'vx-exam-controls-assessment':data.published.find(r=>r.demoScenario==='proctored-live'),
 'vx-online-practice-exam-assessment':data.published.find(r=>r.demoScenario==='practice-live'),
 'vx-online-proctored-exam-assessment':data.published.find(r=>r.demoScenario==='proctored-live')})
 return {local,session,data}
}

/** Install once; explicit refresh replaces only demo-owned records and maps. User-owned IDs are untouched.
 * Transaction rolls back both storage areas on quota/write failure. Never uses storage.clear().
 */
export function installAssessmentDemo(local=localStorage,session=sessionStorage,{now=new Date(),refresh=false}={}) {
 const marker=local.getItem(DEMO_MARKER)
 const payload=buildDemoPayload(now)
 const writes=[]
 if(!marker||refresh){
  // Remove stale demo-only detail state after an explicit restore (for example marks from a previous run).
  for(let index=0;index<local.length;index++) {
   const key=local.key(index)
   if(/^vx-(?:assessment-|exam-controls-|create-assessment-).*:demo-assessment-/.test(key) && !(key in payload.local)) writes.push([local,key,null])
  }
  for(const [key,value] of Object.entries(payload.local)) {
   let next=value
   if(['vx-assessment-drafts','vx-assessment-published'].includes(key)) next=[...read(local,key,[]).filter(row=>!isDemoRecord(row)),...value]
   else if(localMaps.includes(key)) next={...Object.fromEntries(Object.entries(read(local,key,{})).filter(([id])=>!id.startsWith('demo-assessment-'))),...value}
   writes.push([local,key,JSON.stringify(next)])
  }
  writes.push([local,DEMO_MARKER,JSON.stringify({version:1,createdAt:now.toISOString()})])
 }
 const queue=(!marker||refresh)?payload.data.queue:read(local,DEMO_QUEUE,[])
 const currentQueue=read(session,'vx-approval-queue-rows',[])
 if(!session.getItem('vx-approval-queue-rows')||!marker||refresh) writes.push([session,'vx-approval-queue-rows',JSON.stringify([...currentQueue.filter(row=>!isDemoRecord(row)),...queue])])
 for(const [key,value] of Object.entries(payload.session)) {
  if(key==='vx-approval-queue-rows') continue
  const previous=read(session,key,null)
  if(!previous||(refresh&&isDemoRecord(previous))) {
   // On subsequent tabs use persisted records, preserving edits/results and their schedules.
   const rows=read(local,'vx-assessment-published',[])
   const next=marker&&!refresh&&value?.id?rows.find(row=>row.id===value.id):value
   if(next) writes.push([session,key,JSON.stringify(next)])
  }
 }
 // Retire the legacy automatic destructive reset before any page reads the seeded lists.
 writes.push([local,'vx-assessment-tracker-reset-2026-10-21','complete'],[session,'vx-assessment-tracker-reset-2026-10-21','complete'])
 const before=writes.map(([store,key])=>[store,key,store.getItem(key)])
 try{for(const [store,key,value] of writes){if(value===null)store.removeItem(key);else store.setItem(key,value)}}
 catch(error){for(const [store,key,value] of before.reverse()){try{if(value===null)store.removeItem(key);else store.setItem(key,value)}catch{/* Preserve the original storage error. */}}throw error}
 return {installed:!marker||refresh,scenarios:payload.data}
}
