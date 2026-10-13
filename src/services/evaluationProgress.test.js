import test from 'node:test'
import assert from 'node:assert/strict'
import { submittedOption, evaluationProgress, submittedDescriptiveCounts } from './evaluationProgress.js'
test('submitted option zero is valid; missing and draft selections are not answers', () => {
 assert.equal(submittedOption({isMcqSubmitted:true,answers:{q:0}},'q',4),0)
 for(const value of [null,undefined,'',-1,4]) assert.equal(submittedOption({isMcqSubmitted:true,answers:{q:value}},'q',4),null)
 assert.equal(submittedOption({answers:{q:1}},'q',4),null)
})
test('parent answer counts and marking progress are independent, including zero marks',()=>{
 const groups=[{keys:['a','b'],answered:1,available:true},{keys:['c'],answered:0,available:true},{keys:['d'],answered:0,available:false}]
 assert.deepEqual(evaluationProgress(groups,{a:{status:'evaluated',marks:0},b:{status:'not-attempted',marks:0}}),{total:3,answered:0,partial:1,unanswered:1,unavailable:1,evaluated:1})
})
test('nested answers stay scoped to their parent',()=>{
 const questions=[{id:'one',subQuestions:[{id:'part'}]},{id:'two',subQuestions:[{id:'part'}]}]
 assert.deepEqual(submittedDescriptiveCounts(questions,{descriptiveAnswers:{'["descriptive","one","part"]':'Submitted text'}}),[1,0])
})
