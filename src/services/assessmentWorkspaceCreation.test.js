import test from 'node:test'
import assert from 'node:assert/strict'
import { createAssessmentWorkspace } from './assessmentWorkspaceCreation.js'

const quota = () => Object.assign(new Error('full'), { name: 'QuotaExceededError' })
function memory(initial = {}) {
  const rows = new Map(Object.entries(initial))
  return { rows, get length() { return rows.size }, key: i => [...rows.keys()][i], getItem: key => rows.get(key) ?? null,
    setItem: (key, value) => rows.set(key, value), removeItem: key => rows.delete(key) }
}
const flowKey = 'vx-assessment-blueprint-workflow:assessment-new'
const setupKey = 'vx-create-assessment-setup'
const tabKey = 'vx-create-assessment-initial-tab'

test('creation saves a connected identity and navigation handoff', async () => {
  const storage = memory()
  const setup = await createAssessmentWorkspace({ assessmentName: '' }, { storage, createId: () => 'new' })
  assert.equal(setup.assessmentId, 'assessment-new')
  assert.equal(JSON.parse(storage.getItem(flowKey)).blueprintId, setup.blueprintId)
  assert.deepEqual(JSON.parse(storage.getItem(setupKey)), setup)
  assert.equal(storage.getItem(tabKey), 'create')
})

test('full storage recovers then retries the same assessment identity', async () => {
  const storage = memory({ 'vx-assessment-published': '[{"id":"keep"}]' })
  const set = storage.setItem
  let full = true, recoveryCalls = 0, idCalls = 0
  storage.setItem = (key, value) => { if (full) throw quota(); set(key, value) }
  await createAssessmentWorkspace({}, { storage, createId: () => { idCalls++; return 'new' }, recover: async () => { recoveryCalls++; full = false } })
  assert.equal(recoveryCalls, 1)
  assert.equal(idCalls, 1)
  assert.equal(storage.getItem('vx-assessment-published'), '[{"id":"keep"}]')
  assert.equal(storage.getItem(tabKey), 'create')
})

test('unrecoverable quota restores the old handoff and leaves no orphan workflow', async () => {
  const initial = { [setupKey]: '{"assessmentId":"old"}', [tabKey]: 'preview', 'vx-assessment-drafts': '[{"id":"keep"}]' }
  const storage = memory(initial), set = storage.setItem
  storage.setItem = (key, value) => { if (key === tabKey && value === 'create') throw quota(); set(key, value) }
  await assert.rejects(createAssessmentWorkspace({}, { storage, createId: () => 'new', recover: async () => {} }), /Browser storage is full/)
  assert.deepEqual(Object.fromEntries(storage.rows), initial)
})

test('real compaction makes room without losing the authoritative blueprint', async () => {
  const snapshot = { assessmentId: 'existing', validationStatus: 'matched', data: 'x'.repeat(3000) }
  const cacheKey = 'vx-create-assessment-blueprint-planner:existing'
  const existingFlow = 'vx-assessment-blueprint-workflow:existing'
  const storage = memory({ [cacheKey]: JSON.stringify(snapshot), [existingFlow]: JSON.stringify({ snapshot }) })
  const capacity = [...storage.rows.values()].reduce((sum, value) => sum + value.length, 0), set = storage.setItem
  storage.setItem = (key, value) => {
    const size = [...storage.rows].reduce((sum, [k, v]) => sum + (k === key ? 0 : v.length), 0) + value.length
    if (size > capacity) throw quota()
    set(key, value)
  }
  await createAssessmentWorkspace({}, { storage, createId: () => 'new' })
  assert.deepEqual(JSON.parse(storage.getItem(existingFlow)).snapshot, snapshot)
  assert.deepEqual(JSON.parse(storage.getItem(cacheKey)), { workflowAssessmentId: 'existing' })
  assert.equal(storage.getItem(tabKey), 'create')
})

test('non-quota failures are not retried and partial writes are reverted', async () => {
  const storage = memory(), set = storage.setItem
  storage.setItem = (key, value) => { if (key === setupKey) throw new Error('denied'); set(key, value) }
  await assert.rejects(createAssessmentWorkspace({}, { storage, createId: () => 'new', recover: async () => assert.fail('must not recover') }), /denied/)
  assert.equal(storage.length, 0)
})
