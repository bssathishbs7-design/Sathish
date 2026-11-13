import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveQuestionShareRecipients } from './questionShareRecipients.js'

const load = async () => ({ students: [
  { id: 'a', registrationId: 'A01', name: 'Asha', status: 'Active', batch: '2026', year: 'First Year', section: 'A' },
  { id: 'b', registrationId: 'B01', name: 'Bala', status: 'Active', batch: '2026', year: 'First Year', section: 'B' },
] })
const scope = { assignBatch: '2026', assignYear: 'First Year', assignGroups: ['SGT Group A', 'SGT Group B'], assignStudentIds: ['a', 'b'] }

test('sharing preserves explicit directory IDs and all selected groups', async () => {
  const result = await resolveQuestionShareRecipients(scope, load)
  assert.deepEqual(result.studentIds, ['a', 'b'])
  assert.deepEqual(result.groups, scope.assignGroups)
  assert.equal(result.students[0].registrationId, 'A01')
  const narrowed = await resolveQuestionShareRecipients({ ...scope, assignStudentIds: ['b'] }, load)
  assert.deepEqual(narrowed.studentIds, ['b'])
})
test('sharing rejects empty, stale and out-of-group recipients', async () => {
  await assert.rejects(resolveQuestionShareRecipients({ ...scope, assignStudentIds: [] }, load))
  await assert.rejects(resolveQuestionShareRecipients({ ...scope, assignBatch: '2025' }, load))
  await assert.rejects(resolveQuestionShareRecipients({ ...scope, assignGroups: ['SGT A'] }, load))
})
