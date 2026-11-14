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

test('multi-group assignment unions current eligible students and supports legacy drafts', async () => {
  const setup = { assignYear: 'First Year', assignGroups: ['SGT Group A', 'SGT Group B', 'SGT Group A'] }
  assert.deepEqual((await resolveAssessmentAssignment(setup, load)).map(student => student.id), ['MC1', 'MC2'])
  assert.deepEqual((await resolveAssessmentAssignment({ assignYear: 'First Year', assignGroup: 'SGT Group A, SGT Group B' }, load)).map(student => student.id), ['MC1', 'MC2'])
  assert.equal((await resolveAssessmentAssignment({ ...setup, assignGroups: [], assignGroup: 'SGT Group A' }, load)).length, 2)
  await assert.rejects(resolveAssessmentAssignment({ ...setup, assignGroups: ['SGT Group Z'] }, load), /No active students/)
})

const cascadeDirectory = () => ({ batches: [{ id: '2026' }, { id: '2025' }], students: [
  { ...active, batch: '2026', entries: [{ outcome: 'Current', batch: '2026', year: 'First Year', section: 'A' }] },
  { ...active, id: 'internal-2', registrationId: 'MC2', batch: '2026', section: 'B' },
  { ...active, id: 'other-batch', registrationId: 'MC3', batch: '2025' },
  { ...active, id: 'moved', registrationId: 'MC4', batch: '2025', entries: [{ outcome: 'Not promoted', batch: '2025', year: 'First Year', section: 'A' }, { outcome: 'Current', batch: '2026', year: 'Second Year', section: 'C' }] },
  { ...active, id: 'inactive', registrationId: 'MC5', batch: '2026', status: 'Inactive' },
  { ...active, id: 'graduate', registrationId: 'MC6', batch: '2026', graduated: true },
] })
const cascadeScope = { assignBatch: '2026', assignYear: 'First Year', assignGroups: ['SGT Group A', 'SGT Group B'], assignStudentIds: ['internal-2'] }
test('explicit assignment selects only requested students in the batch/year/group intersection', async () => {
  const rows = await resolveAssessmentAssignment(cascadeScope, async () => cascadeDirectory())
  assert.deepEqual(rows.map(row => row.sourceStudentId), ['internal-2'])
  const moved = await resolveAssessmentAssignment({ assignBatch: '2026', assignYear: 'Second Year', assignGroups: ['SGT Group C'], assignStudentIds: ['moved'] }, async () => cascadeDirectory())
  assert.equal(moved[0].registrationId, 'MC4')
})
test('explicit selection rejects missing scope, duplicates, other batches and stale eligibility', async () => {
  for (const change of [{ assignBatch: '' }, { assignGroups: [] }, { assignStudentIds: [] }, { assignStudentIds: ['internal-2', 'internal-2'] },
    { assignStudentIds: ['other-batch'] }, { assignStudentIds: ['inactive'] }, { assignStudentIds: ['graduate'] }, { assignStudentIds: ['missing'] },
    { assignGroups: ['SGT Group A'] }, { assignYear: 'Second Year' }]) {
    await assert.rejects(resolveAssessmentAssignment({ ...cascadeScope, ...change }, async () => cascadeDirectory()))
  }
  const updated = cascadeDirectory(); updated.students[1].section = 'C'
  await assert.rejects(resolveAssessmentAssignment(cascadeScope, async () => updated), /no longer match/)
})


test('optional publication filters include the whole batch/year, ungrouped students, or a selected subset', async () => {
  const directory = cascadeDirectory()
  directory.students.push({ ...active, id: 'ungrouped', registrationId: 'MC7', batch: '2026', section: '' })
  const loadDirectory = async () => directory
  const scope = { assignBatch: '2026', assignYear: 'First Year', assignGroups: [], assignStudentIds: [] }
  const resolve = change => resolveAssessmentAssignment({ ...scope, ...change }, loadDirectory, { optionalFilters: true })
  assert.deepEqual((await resolve({})).map(row => row.id), ['MC1', 'MC2', 'MC7'])
  assert.deepEqual((await resolve({ assignGroups: ['SGT Group B'] })).map(row => row.id), ['MC2'])
  assert.deepEqual((await resolve({ assignStudentIds: ['ungrouped'] })).map(row => row.id), ['MC7'])
  await assert.rejects(resolve({ assignBatch: '' }), /Select a batch/)
  await assert.rejects(resolve({ assignGroups: ['SGT Group Z'] }), /No active students/)
  await assert.rejects(resolve({ assignStudentIds: ['other-batch'] }), /no longer match/)
  await assert.rejects(resolve({ assignStudentIds: ['internal-1', 'internal-1'] }), /no longer match/)
})
