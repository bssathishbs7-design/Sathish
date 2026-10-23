import test from 'node:test'
import assert from 'node:assert/strict'
import { readBlueprintPlanner, saveBlueprintPlannerReference } from './blueprintPlannerStorage.js'
const key='vx-create-assessment-blueprint-planner:assessment-a'
const flowKey='vx-assessment-blueprint-workflow:a'
const snapshot={validationStatus:'matched',blueprintDraft:{totalMark:100},pickerRows:[{count:100,marks:1}]}
const store=entries=>{const data=new Map(Object.entries(entries));return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)}}
test('duplicate full snapshot becomes a compact reference and survives reload',()=>{
 const storage=store({[key]:JSON.stringify(snapshot),[flowKey]:JSON.stringify({snapshot})})
 saveBlueprintPlannerReference(key,'a',storage)
 assert.deepEqual(JSON.parse(storage.getItem(key)),{workflowAssessmentId:'a'})
 assert.deepEqual(readBlueprintPlanner(key,'a',storage),snapshot)
})
test('quota failure after workflow save is recoverable without deleting any data',()=>{
 const old={...snapshot,blueprintDraft:{totalMark:50}}
 const storage=store({[key]:JSON.stringify(old),[flowKey]:JSON.stringify({snapshot})})
 storage.setItem=()=>{const e=new Error('full');e.name='QuotaExceededError';throw e}
 assert.equal(saveBlueprintPlannerReference(key,'a',storage),false)
 assert.deepEqual(readBlueprintPlanner(key,'a',storage),snapshot)
 assert.equal(JSON.parse(storage.getItem(key)).blueprintDraft.totalMark,50)
})
test('legacy planners, missing cache and enabled preference remain readable',()=>{
 const legacy=store({[key]:JSON.stringify(snapshot)})
 assert.deepEqual(readBlueprintPlanner(key,'a',legacy),snapshot)
 assert.throws(()=>saveBlueprintPlannerReference(key,'a',legacy),/not been saved/)
 const storage=store({[flowKey]:JSON.stringify({snapshot})})
 assert.deepEqual(readBlueprintPlanner(key,'a',storage),snapshot)
 saveBlueprintPlannerReference(key,'a',storage,false)
 assert.equal(readBlueprintPlanner(key,'a',storage).enabled,false)
})
import { compactDuplicateBlueprintPlanners } from './blueprintPlannerStorage.js'
test('compaction frees only exact duplicate snapshots and keeps distinct edits',()=>{
 const duplicate={...snapshot,assessmentId:'a'}
 const distinctKey=key+'-other'
 const values=new Map([[key,JSON.stringify({...duplicate,savedAt:'now'})],[flowKey,JSON.stringify({snapshot:duplicate})],[distinctKey,JSON.stringify({...duplicate,blueprintDraft:{totalMark:50}})]])
 const storage={get length(){return values.size},key:i=>[...values.keys()][i],getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}
 assert.equal(compactDuplicateBlueprintPlanners(storage),1)
 assert.deepEqual(JSON.parse(storage.getItem(key)),{workflowAssessmentId:'a'})
 assert.equal(JSON.parse(storage.getItem(distinctKey)).blueprintDraft.totalMark,50)
})
