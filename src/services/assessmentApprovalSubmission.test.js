import test from 'node:test'
import assert from 'node:assert/strict'
import { commitAssessmentApprovalSubmission as commit } from './assessmentApprovalSubmission.js'
function storage(initial = {}) { const data = new Map(Object.entries(initial)); return { getItem:key=>data.get(key)??null, setItem:(key,value)=>data.set(key,value), removeItem:key=>data.delete(key) } }
const payload = { activityType:'Assessment', setup:{ assessmentId:'A', sourcePublishedId:'A' } }
test('resubmission withdraws only the matching publication and draft', () => {
 const local=storage({'vx-assessment-published':JSON.stringify([{id:'A'},{id:'B'}]),'vx-assessment-drafts':JSON.stringify([{id:'A'},{id:'C'}])})
 const session=storage()
 commit(payload,[{id:'pending-A'}],local,session)
 assert.deepEqual(JSON.parse(local.getItem('vx-assessment-published')),[{id:'B'}])
 assert.deepEqual(JSON.parse(local.getItem('vx-assessment-drafts')),[{id:'C'}])
 assert.deepEqual(JSON.parse(session.getItem('vx-approval-queue-rows')),[{id:'pending-A'}])
})
test('storage failure restores publication and previous queue', () => {
 const local=storage({'vx-assessment-published':'[{"id":"A"}]'})
 const session=storage({'vx-approval-queue-rows':'[]'})
 const set=local.setItem; let failed=false
 local.setItem=(key,value)=>{if(key==='vx-assessment-drafts'&&!failed){failed=true;throw Error('quota')}set(key,value)}
 assert.throws(()=>commit(payload,[{id:'pending-A'}],local,session))
 assert.equal(local.getItem('vx-assessment-published'),'[{"id":"A"}]')
 assert.equal(session.getItem('vx-approval-queue-rows'),'[]')
})
test('blueprint approval does not withdraw a published assessment', () => {
 const local=storage({'vx-assessment-published':'[{"id":"A"}]'})
 commit({...payload,activityType:'Blueprint'},[],local,storage())
 assert.equal(local.getItem('vx-assessment-published'),'[{"id":"A"}]')
})
