import test from 'node:test'
import assert from 'node:assert/strict'
import { blueprintTableSignatures as signatures, blueprintTableModifications as changes } from './blueprintTableModifications.js'
const snapshot={blueprintDraft:{totalMark:'100'},blueprintDistributionDraft:{a:'5'},blueprintQuestionTypeDraft:{MCQ:{marks:1}},blueprintTestSpecificationCountDraft:{a:{lot:2}}}
const actor={name:'Dr Reviewer',registerId:'faculty-1'}
test('unchanged values and formatting do not mark a table',()=>{
 assert.deepEqual(changes(signatures(snapshot),signatures({...snapshot,blueprintDistributionDraft:{a:5.0},validationStatus:'matched'}),actor),{})
})
test('only the changed table receives the signed-in reviewer attribution',()=>{
 const next={...snapshot,blueprintDistributionDraft:{a:6}}
 const result=changes(signatures(snapshot),signatures(next),actor,{},'2026-10-23T10:00:00Z')
 assert.deepEqual(Object.keys(result),['distribution']);assert.equal(result.distribution.modifiedBy,actor.name)
 assert.equal(result.distribution.reviewerId,actor.registerId)
 assert.deepEqual(changes(signatures(snapshot),signatures(snapshot),actor,result),{})
 assert.deepEqual(changes(signatures(snapshot),signatures(next),actor,result),result)
 assert.deepEqual(JSON.parse(JSON.stringify({tableModifications:result})).tableModifications,result)
})
test('specification and matrix edits are attributed independently',()=>{
 const next={...snapshot,blueprintQuestionTypeDraft:{MCQ:{marks:2}},blueprintTestSpecificationCountDraft:{a:{lot:3}}}
 assert.deepEqual(Object.keys(changes(signatures(snapshot),signatures(next),actor)),['specifications','matrix'])
})
import { saveBlueprintWorkflow, reviewBlueprintWorkflow, readBlueprintWorkflow } from './blueprintApproval.js'
test('approval retains table attribution in the stored blueprint snapshot',async()=>{
 const data=new Map();const storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)}
 const original={...snapshot,assessmentId:'review-test',validationStatus:'matched',blueprintDraft:{totalMark:10},pickerRows:[{count:10,marks:1}]}
 const flow=await saveBlueprintWorkflow({id:'review-test'},original,'approval',actor,{storage})
 const edited={...original,tableModifications:{matrix:{modifiedBy:actor.name,reviewerId:actor.registerId,modifiedAt:'2026-10-23T10:00:00Z'}}}
 reviewBlueprintWorkflow({setup:{assessmentId:'review-test'},blueprintRevision:flow.revision},'Approved','',storage,edited)
 assert.deepEqual(readBlueprintWorkflow('review-test',storage).snapshot.tableModifications,edited.tableModifications)
})
