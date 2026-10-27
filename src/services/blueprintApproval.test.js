import test from 'node:test'
import assert from 'node:assert/strict'
import { reserveBlueprintIdentity, saveBlueprintWorkflow, readBlueprintWorkflow, reviewBlueprintWorkflow, reviseBlueprintWorkflow, blueprintApprovalLocked, deleteBlueprintWorkflow } from './blueprintApproval.js'
const memory = () => { const values = new Map(); return { getItem: key => values.get(key) || null, setItem: (key,value) => values.set(key,value), removeItem: key => values.delete(key) } }
const snapshot = { blueprintDraft: { subject: 'Anatomy', totalMark: 10 }, pickerRows: [{ type:'saq', count:2, marks:5 }] }
test('sequential IDs persist and are reused by both choices', async () => {
 const storage=memory(), options={ storage }
 const draftId=(await reserveBlueprintIdentity('a',options)).blueprintId;assert.match(draftId,/^DRF-BP-/)
 assert.equal((await reserveBlueprintIdentity('a',options)).blueprintId,draftId)
 assert.notEqual((await reserveBlueprintIdentity('b',options)).blueprintId,draftId)
 const flow=await saveBlueprintWorkflow({id:'a'},snapshot,'continue',null,options)
 assert.equal(flow.blueprintId,draftId); assert.equal(blueprintApprovalLocked(flow),false)
})
test('pending and rejected blueprints block continuation; approval unlocks only matching revision', async () => {
 const storage=memory(), options={storage}, record={id:'a'}
 const flow=await saveBlueprintWorkflow(record,snapshot,'approval',{name:'Reviewer'},options)
 assert.equal(blueprintApprovalLocked(flow),true)
 await assert.rejects(saveBlueprintWorkflow(record,snapshot,'continue',null,options),/awaiting approval/)
 assert.throws(()=>reviewBlueprintWorkflow({setup:{assessmentId:'a'},blueprintRevision:0},'Approved','',storage),/no longer current/)
 const submission={setup:{assessmentId:'a'},blueprintRevision:flow.revision}
 assert.throws(()=>reviewBlueprintWorkflow(submission,'Rejected','',storage),/remarks/)
 reviewBlueprintWorkflow(submission,'Rejected','Fix allocation',storage)
 await assert.rejects(saveBlueprintWorkflow(record,snapshot,'continue',null,options),/revised blueprint/)
 const resubmitted=await saveBlueprintWorkflow(record,{...snapshot,pickerRows:[{type:'mcq',count:10,marks:1}]},'approval',{},options)
 assert.equal(resubmitted.blueprintId,flow.blueprintId); assert.equal(resubmitted.revision,2)
 assert.throws(()=>reviewBlueprintWorkflow(submission,'Approved','',storage),/no longer current/)
 const approved=reviewBlueprintWorkflow({...submission,blueprintRevision:2},'Approved','',storage)
 assert.equal(blueprintApprovalLocked(approved),false)
 assert.equal(blueprintApprovalLocked(reviseBlueprintWorkflow('a',storage)),true)
 assert.equal(readBlueprintWorkflow('a',storage).blueprintId,'SRMC-BP-00013')
})

test('reviewer changes are validated, versioned, and approved without changing blueprint identity', async () => {
 const storage=memory()
 const original={...snapshot,assessmentId:'a',validationStatus:'matched'}
 const flow=await saveBlueprintWorkflow({id:'a'},original,'approval',{}, {storage})
 const record={setup:{assessmentId:'a'},blueprintRevision:flow.revision}
 const edited={...original,pickerRows:[{type:'mcq',count:10,marks:1}]}
 assert.throws(()=>reviewBlueprintWorkflow(record,'Approved','',storage,{...edited,validationStatus:'mismatched'}),/valid blueprint/)
 assert.throws(()=>reviewBlueprintWorkflow(record,'Approved','',storage,{...edited,pickerRows:[{count:9,marks:1}]}),/valid blueprint/)
 assert.equal(readBlueprintWorkflow('a',storage).status,'Pending Approval')
 const approved=reviewBlueprintWorkflow(record,'Approved','Adjusted question mix',storage,edited)
 assert.equal(approved.blueprintId,'SRMC-BP-00013'); assert.equal(approved.draftCode,flow.blueprintId)
 assert.equal(approved.revision,2)
 assert.deepEqual(approved.snapshot,edited)
 assert.equal(blueprintApprovalLocked(approved),false)
 assert.throws(()=>reviewBlueprintWorkflow(record,'Approved','',storage,edited),/no longer current/)
 const history=JSON.parse(storage.getItem('vx-assessment-history:a'))
 assert.ok(history.some(event=>event.action==='Blueprint edited during review'))
})

test('rejection preserves the submitted snapshot and unchanged approval preserves revision', async () => {
 const storage=memory(), original={...snapshot,assessmentId:'a',validationStatus:'matched'}
 const flow=await saveBlueprintWorkflow({id:'a'},original,'approval',{}, {storage})
 const record={setup:{assessmentId:'a'},blueprintRevision:flow.revision}
 const rejected=reviewBlueprintWorkflow(record,'Rejected','Revise',storage,{...original,pickerRows:[]})
 assert.deepEqual(rejected.snapshot,original)
 const next=await saveBlueprintWorkflow({id:'a'},original,'approval',{}, {storage})
 const approved=reviewBlueprintWorkflow({...record,blueprintRevision:next.revision},'Approved','',storage,original)
 assert.equal(approved.revision,next.revision)
})

test('deleting an approved paired blueprint retains its saved template and consumed number', async () => {
 const storage=memory()
 const pending=await saveBlueprintWorkflow({id:'delete-me'},snapshot,'approval',{}, {storage})
 const approved=reviewBlueprintWorkflow({setup:{assessmentId:'delete-me'},blueprintRevision:pending.revision},'Approved','',storage)
 deleteBlueprintWorkflow({id:'delete-me'},storage)
 assert.equal(readBlueprintWorkflow('delete-me',storage),null)
 assert.ok([...JSON.parse(storage.getItem('vx-blueprint-breakdown-templates-v1') || '[]')].some(row=>row.blueprintId===approved.blueprintId))
 const next=await saveBlueprintWorkflow({id:'next'},snapshot,'approval',{}, {storage})
 assert.equal(reviewBlueprintWorkflow({setup:{assessmentId:'next'},blueprintRevision:next.revision},'Approved','',storage).blueprintId,'SRMC-BP-00021')
})
