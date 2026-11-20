import test from 'node:test'
import assert from 'node:assert/strict'
import { readBlueprintTemplates, BLUEPRINT_TEMPLATES_KEY } from './blueprintTemplates.js'
const memory = () => { const data = new Map(); return { get length() { return data.size }, key: i => [...data.keys()][i], getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) } }
test('all three submitted templates show their own status across old and new workflow keys', () => {
  const storage = memory()
  storage.setItem(BLUEPRINT_TEMPLATES_KEY, JSON.stringify(['a','b','c','d'].map(id => ({id}))))
  for (const id of ['a','b','c']) storage.setItem('vx-assessment-blueprint-workflow:' + (id === 'a' ? 'template-approval:a' : 'assessment-' + id), JSON.stringify({status:'Pending Approval', snapshot:{blueprintDraft:{template:id}}}))
  assert.deepEqual(readBlueprintTemplates(storage).map(row => row.templateApprovalStatus), ['Pending Approval','Pending Approval','Pending Approval',undefined])
  storage.setItem('vx-assessment-blueprint-workflow:assessment-b', JSON.stringify({status:'Rejected',snapshot:{blueprintDraft:{template:'b'}}}))
  assert.deepEqual(readBlueprintTemplates(storage).map(row => row.templateApprovalStatus), ['Pending Approval','Rejected','Pending Approval',undefined])
})
test('a current template review takes precedence over an older assessment submission', () => {
  const storage = memory()
  storage.setItem(BLUEPRINT_TEMPLATES_KEY, '[{"id":"a"}]')
  storage.setItem('vx-assessment-blueprint-workflow:assessment-a', JSON.stringify({status:'Pending Approval',snapshot:{blueprintDraft:{template:'a'}}}))
  storage.setItem('vx-assessment-blueprint-workflow:template-approval:a', '{"status":"Approved"}')
  assert.equal(readBlueprintTemplates(storage)[0].templateApprovalStatus, 'Approved')
})

test('a newer rejection supersedes a stale template approval record', () => {
  const storage = memory()
  storage.setItem(BLUEPRINT_TEMPLATES_KEY, '[{"id":"a"}]')
  storage.setItem('vx-assessment-blueprint-workflow:template-approval:a', JSON.stringify({status:'Pending Approval', updatedAt:'2026-11-19T10:00:00Z'}))
  storage.setItem('vx-assessment-blueprint-workflow:assessment-a', JSON.stringify({status:'Rejected', reviewedAt:'2026-11-19T11:00:00Z', snapshot:{blueprintDraft:{template:'a'}}}))
  assert.equal(readBlueprintTemplates(storage)[0].templateApprovalStatus, 'Rejected')
  storage.setItem('vx-assessment-blueprint-workflow:template-approval:a', JSON.stringify({status:'Pending Approval', updatedAt:'2026-11-19T12:00:00Z'}))
  assert.equal(readBlueprintTemplates(storage)[0].templateApprovalStatus, 'Pending Approval')
})
