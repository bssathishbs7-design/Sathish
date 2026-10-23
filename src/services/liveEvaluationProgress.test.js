import test from 'node:test'
import assert from 'node:assert/strict'
import { liveEvaluationProgress } from './liveEvaluationProgress.js'
const assessment={examMode:'Online',setup:{mcqDisplayType:'Answer Input',descriptiveDisplayType:'Answer Input',descriptiveAutoEvaluation:'No'}}
const types={hasMcq:true,hasDescriptive:true}
test('unstarted and active attempts never expose unsent section scores',()=>{
 const empty=liveEvaluationProgress(assessment,{},types)
 assert.equal(empty.status,'Not started');assert.equal(empty.canScore('mcq'),false)
 const started=liveEvaluationProgress(assessment,{hasStarted:true,answers:{q1:0}},types)
 assert.equal(started.status,'In progress');assert.equal(started.waiting,true)
})
test('hybrid submission unlocks only the submitted section',()=>{
 const state=liveEvaluationProgress(assessment,{isMcqSubmitted:true},types)
 assert.equal(state.canScore('mcq'),true);assert.equal(state.canScore('descriptive'),false);assert.equal(state.waiting,true)
})
test('saved evaluation configuration determines submitted status',()=>{
 assert.equal(liveEvaluationProgress(assessment,{isAssessmentSubmitted:true},types).status,'Pending evaluation')
 assert.equal(liveEvaluationProgress({...assessment,setup:{...assessment.setup,descriptiveAutoEvaluation:'Yes'}},{isAssessmentSubmitted:true},types).status,'Submitted')
})
test('offline and read-only retain manual evaluation without online submission',()=>{
 for(const config of [{examDeliveryMode:'Offline'},{mcqDisplayType:'Read-Only',descriptiveDisplayType:'Read-Only'}]){
 const state=liveEvaluationProgress({...assessment,setup:{...assessment.setup,...config}},{},types)
 assert.equal(state.waiting,false);assert.equal(state.status,'Pending evaluation');assert.equal(state.canScore('mcq'),true)
 }
})
