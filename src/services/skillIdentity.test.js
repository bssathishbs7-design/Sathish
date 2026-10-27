import test from 'node:test'
import assert from 'node:assert/strict'
import { ensureSkillIdentity, appendSkillIdentityEvent } from './skillIdentity.js'

const memory = () => { const rows = new Map(); return { getItem: key => rows.get(key) ?? null, setItem: (key,value) => rows.set(key,value) } }
test('skill assignments and published results retain the creation identity and audit trail', () => {
  const storage = memory(), activity = { id: 'new-skill', createdAt: '2026-10-27T10:00:00Z' }
  const draft = ensureSkillIdentity(activity, false, storage)
  assert.match(draft.code, /^DRF-SA-/)
  const assigned = ensureSkillIdentity({ id: 'assignment-1', sourceActivityId: activity.id }, true, storage)
  assert.equal(assigned.code, 'SRMC-SA-00210')
  assert.equal(assigned.draftCode, draft.code)
  const published = appendSkillIdentityEvent(activity, 'Results published', '2026-10-27T12:00:00Z', storage)
  assert.equal(published.code, assigned.code)
  assert.deepEqual(published.history.map(event => event.action), ['Activity created', 'First assigned', 'Results published'])
  assert.equal(appendSkillIdentityEvent(activity, 'Results published', '2026-10-27T12:00:00Z', storage).history.length, 3)
  assert.equal(ensureSkillIdentity(activity, true, storage).code, assigned.code)
})
test('a persisted permanent skill ID survives an absent projection registry', () => {
  const identity = ensureSkillIdentity({ id: 'existing', activityCode: 'SRMC-SA-00210', draftCode: 'DRF-SA-123ABC' }, true, memory())
  assert.equal(identity.code, 'SRMC-SA-00210')
  assert.equal(identity.draftCode, 'DRF-SA-123ABC')
})
