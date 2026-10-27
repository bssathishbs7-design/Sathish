import test from 'node:test'
import assert from 'node:assert/strict'
import { reserveAssessmentIdentity, publishAssessmentIdentity } from './assessmentIdentity.js'
import { parseQid } from '../utils/qid.js'
const memory=()=>{const rows=new Map();return {getItem:key=>rows.get(key)??null,setItem:(key,value)=>rows.set(key,value)}}
test('assessment creation is temporary and consumes no permanent sequence',async()=>{
 const storage=memory(), first=await reserveAssessmentIdentity({storage,createId:()=> 'stable',now:()=>new Date('2026-10-27T10:00:00Z')})
 assert.match(first.assessmentCode,/^DRF-AP-[0-9A-Z]{6}$/);assert.equal(first.draftCode,first.assessmentCode);assert.equal(first.assessmentId,'assessment-stable');assert.equal(storage.getItem('vx-qid-sequences'),null)
})
test('publication issues AP and authored AQ identities but preserves bank questions and internal keys',async()=>{
 const storage=memory(),setup=await reserveAssessmentIdentity(), bank={id:'bank',questionBankId:'MED-QB-0000013'},own={id:'own',draftCode:'DRF-AQ-3PX8RN'}
 const result=publishAssessmentIdentity({id:setup.assessmentId,setup,questionRows:[bank,own]},storage)
 assert.equal(result.setup.assessmentId,setup.assessmentId);assert.equal(result.draftCode,setup.draftCode);assert.equal(result.assessmentCode,'SRMC-AP-00210');assert.deepEqual(result.questionRows[0],bank);assert.equal(parseQid(result.questionRows[1].assessmentQuestionId).type,'AQ')
 storage.setItem('vx-assessment-published',JSON.stringify([result]));const retry=publishAssessmentIdentity({id:setup.assessmentId,setup,questionRows:[bank,own]},storage)
 assert.equal(retry.assessmentCode,result.assessmentCode);assert.equal(retry.questionRows[1].assessmentQuestionId,result.questionRows[1].assessmentQuestionId)
})
test('older published IDs survive republish without resetting counters',()=>{
 const storage=memory();const result=publishAssessmentIdentity({id:'old',setup:{assessmentId:'old',assessmentCode:'SRMC-AP-26-01'},questionRows:[]},storage)
 assert.equal(result.assessmentCode,'SRMC-AP-26-01');assert.equal(storage.getItem('vx-qid-sequences'),null)
})
test('publication does not succeed if allocation cannot be persisted',()=>{
 assert.throws(()=>publishAssessmentIdentity({id:'a',setup:{assessmentCode:'DRF-AP-7K2M9Q'},questionRows:[]},{getItem:()=>null,setItem:()=>{throw Error('Storage full')}}),/Storage full/)
})
