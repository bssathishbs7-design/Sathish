import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveAssessmentAssignment } from './assessmentAssignment.js'
const active = { id: 'internal-1', registrationId: 'MC1', name: 'Aarav', status: 'Active', year: 'First Year', section: 'A' }
const load = async () => ({ students: [active, { ...active, id: 'internal-2', registrationId: 'MC2', name: 'Meera', section: 'B' },
  { ...active, id: 'inactive', registrationId: 'MC3', status: 'Inactive' },
  { ...active, id: 'promoted', registrationId: 'MC4', entries: [{ outcome: 'Current', year: 'Second Year', section: 'A' }] }] })
test('assignment resolves current year and SGT, retaining registration and directory identities', async () => {
  const students = await resolveAssessmentAssignment({ assignYear: 'First Year', assignGroup: 'SGT Group A' }, load)
  assert.deepEqual(students, [{ id: 'MC1', registrationId: 'MC1', sourceStudentId: 'internal-1', name: 'Aarav' }])
  assert.equal((await resolveAssessmentAssignment({ assignYear: 'First Year' }, load)).length, 2)
  assert.equal((await resolveAssessmentAssignment({ assignYear: 'Second Year' }, load))[0].id, 'MC4')
})
test('empty, invalid and duplicate assignments never publish an invented roster', async () => {
  await assert.rejects(resolveAssessmentAssignment({}, load), /Select a student year/)
  await assert.rejects(resolveAssessmentAssignment({ assignYear: 'Fourth Year' }, load), /No active students/)
  await assert.rejects(resolveAssessmentAssignment({ assignYear: 'First Year' }, async () => ({ students: [active, active] })), /duplicated/)
  await assert.rejects(resolveAssessmentAssignment({ assignYear: 'First Year' }, async () => ({ students: [{ ...active, entries: [] }] })), /No active students/)
  await assert.rejects(resolveAssessmentAssignment({ assignYear: 'First Year' }, async () => ({})), /directory could not be read/)
})
