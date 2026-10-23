import test from 'node:test'
import assert from 'node:assert/strict'
import { getAssessmentResponseSummary as summary } from './assessmentResponseSummary.js'
test('hybrid uses saved per-section modes',()=>{assert.deepEqual(summary({setup:{mcqDisplayType:'Read-Only',descriptiveDisplayType:'Answer Input'},questionRows:[{type:'MCQ'},{type:'LAQs'}]}),{type:'Hybrid',details:[{label:'MCQ',response:'Read-only'},{label:'Descriptive',response:'Online Response'}]})})
test('offline and missing questions do not imply online inputs or an invented type',()=>{assert.equal(summary({setup:{examDeliveryMode:'Offline'},questionRows:[{type:'MCQ'}]}).details[0].response,'Answers provided offline');assert.equal(summary({examType:'Hybrid',questionRows:[]}).type,'Not set')})
test('draft question override and snapshot sources retain their own types',()=>{assert.equal(summary({questionRows:[{type:'MCQ'}]},[{type:'Descriptive Question'}]).type,'Descriptive');assert.equal(summary({previewSections:[{questions:[{type:'MCQ'}]}]}).type,'MCQ')})
