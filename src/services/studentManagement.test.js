import test from 'node:test'
import assert from 'node:assert/strict'
import { sampleDirectory, applyStudentCommand, validateStudent } from './studentManagement.js'
import { STUDENT_COLUMNS, previewStudentSheet } from './studentImport.js'

const seed = () => {
  const data = sampleDirectory()
  data.students.forEach(student => { student.startedAt = '2020-08-01'; student.academicYear = '2020-2021'; student.joinedOn = '2020-08-01' })
  return data
}
const draft = { registrationId: 'NEW001', name: 'New Student', email: 'new@example.edu', phone: '9876543210', batch: '2026', section: 'A', subject: 'Anatomy', academicYear: '2026-2027', joinedOn: '2026-08-01' }
const move = { type: 'move', ids: ['student-1'], action: 'promote', date: '2021-06-01', startsOn: '2021-08-01', academicYear: '2021-2022' }

test('new students enter First Year with immutable identity and audit history', () => {
  const data = applyStudentCommand(seed(), { type: 'save', draft: { ...draft, year: 'Internship', status: 'Graduated' } })
  const student = data.students.at(-1)
  assert.equal(student.year, 'First Year'); assert.equal(student.status, 'Active'); assert.notEqual(student.id, draft.registrationId)
  assert.equal(student.history[0].action, 'Enrolled')
})
test('duplicate IDs and emails are validated case-insensitively', () => {
  const data = seed()
  assert.ok(validateStudent({ ...draft, registrationId: data.students[0].registrationId.toLowerCase() }, data).registrationId)
  assert.ok(validateStudent({ ...draft, email: data.students[0].email.toUpperCase() }, data).email)
})
test('profile edits cannot change progression or status', () => {
  const data = seed(), student = data.students[0]
  const next = applyStudentCommand(data, { type: 'save', draft: { ...student, name: 'Updated Name', batch: '2025', year: 'Internship', status: 'Inactive', history: [] } })
  assert.equal(next.students[0].name, 'Updated Name'); assert.equal(next.students[0].batch, student.batch)
  assert.equal(next.students[0].year, student.year); assert.equal(next.students[0].status, student.status)
  assert.equal(next.students[0].history.length, student.history.length + 1)
})
test('stale forms and read-only mutations are rejected', () => {
  const original = seed(), updated = applyStudentCommand(original, { type: 'status', id: 'student-1', reason: 'Leave' })
  assert.throws(() => applyStudentCommand(updated, { type: 'save', draft: original.students[0] }), /changed since/)
  assert.throws(() => applyStudentCommand(seed(), { type: 'delete', ids: ['student-1'] }, { canEdit: false }), /read-only/)
})
test('promotion advances year and preserves source and history', () => {
  const original = seed(), data = applyStudentCommand(original, move)
  assert.equal(data.students[0].year, 'Second Year'); assert.equal(original.students[0].year, 'First Year')
  assert.equal(data.students[0].history.at(-1).action, 'Promoted'); assert.equal(data.moves.length, 1)
})
test('mixed cohorts, inactive students and missing setup cannot progress', () => {
  for (const ids of [['student-1', 'student-3'], ['student-4'], ['student-8']]) assert.throws(() => applyStudentCommand(seed(), { ...move, ids }))
})
test('invalid progression dates reject the whole change', () => {
  assert.throws(() => applyStudentCommand(seed(), { ...move, startsOn: '2021-05-01' }), /after/)
  assert.throws(() => applyStudentCommand(seed(), { ...move, academicYear: '2020-2021' }), /later/)
  assert.throws(() => applyStudentCommand(seed(), { ...move, date: '2020-02-30' }), /End date/)
})
test('repeat retains study year and records the new academic year', () => {
  const data = applyStudentCommand(seed(), { ...move, action: 'repeat' })
  assert.equal(data.students[0].year, 'First Year'); assert.equal(data.students[0].academicYear, '2021-2022')
})
test('only interns can graduate', () => {
  assert.throws(() => applyStudentCommand(seed(), { ...move, action: 'complete' }), /Only interns/)
  const data = applyStudentCommand(seed(), { ...move, ids: ['student-7'], action: 'complete' })
  assert.equal(data.students[6].status, 'Graduated'); assert.equal(data.students[6].year, 'Graduated')
})
test('undo retains both events; newer edits block unsafe restoration', () => {
  const moved = applyStudentCommand(seed(), move)
  const command = { type: 'undo', moveId: moved.moves[0].id, reason: 'Wrong selection' }
  const data = applyStudentCommand(moved, command)
  assert.equal(data.students[0].year, 'First Year'); assert.equal(data.students[0].history.at(-1).action, 'Progression undone')
  assert.ok(data.students[0].history.some(event => event.action === 'Promoted'))
  assert.throws(() => applyStudentCommand(data, command), /already/)
  const edited = applyStudentCommand(moved, { type: 'status', id: 'student-1', reason: 'Leave' })
  assert.throws(() => applyStudentCommand(edited, command), /newer/)
})
test('Excel preview reports duplicates and missing columns; imports are atomic', () => {
  const row = [draft.registrationId, draft.name, draft.email, draft.phone, draft.section, draft.subject, draft.joinedOn, draft.academicYear]
  const result = previewStudentSheet([STUDENT_COLUMNS, row, row], '2026', seed())
  assert.equal(result[0].errors.length, 0); assert.equal(result[1].errors.length, 2)
  assert.throws(() => previewStudentSheet([['Name'], ['Test']], '2026', seed()), /Missing columns/)
  const data = seed(), before = JSON.stringify(data)
  assert.throws(() => applyStudentCommand(data, { type: 'import', rows: [draft, draft] }), /already exists/)
  assert.equal(JSON.stringify(data), before)
})
test('batch deletion requires exact confirmation', () => {
  assert.throws(() => applyStudentCommand(seed(), { type: 'deleteBatch', batch: '2026', confirm: '2025' }), /confirm/)
  const data = applyStudentCommand(seed(), { type: 'deleteBatch', batch: '2026', confirm: '2026' })
  assert.ok(!data.students.some(student => student.batch === '2026')); assert.ok(!data.batches.some(batch => batch.id === '2026'))
})
test('syllabus and status changes are audited and require a reason', () => {
  const data = applyStudentCommand(seed(), { type: 'syllabus', id: 'student-1', syllabus: 'CBME 2019' })
  assert.equal(data.students[0].syllabus, 'CBME 2019'); assert.equal(data.students[0].history.at(-1).action, 'Syllabus updated')
  assert.throws(() => applyStudentCommand(data, { type: 'status', id: 'student-1', reason: '' }), /reason/)
})

test('year setup and corrections retain the audit trail', () => {
  const data = sampleDirectory()
  const setup = { type: 'setup', id: 'student-8', batch: '2021', year: 'Internship', academicYear: '2026-2027', startsOn: '2026-08-01', reason: 'Verified enrolment' }
  const tracked = applyStudentCommand(data, setup)
  assert.ok(tracked.students[7].tracked)
  assert.throws(() => applyStudentCommand(tracked, setup), /already complete/)
  const corrected = applyStudentCommand(tracked, { ...setup, type: 'correct', startsOn: '2026-08-02', reason: 'Correct start date' })
  assert.equal(corrected.students[7].history.length, 2)
  assert.equal(corrected.students[7].startedAt, '2026-08-02')
})
test('earlier batches require a reason and phone punctuation is not a number', () => {
  assert.ok(validateStudent({ ...draft, batch: '2025' }, seed()).batchReason)
  assert.ok(validateStudent({ ...draft, phone: '-------' }, seed()).phone)
})
test('batch creation enforces unique identity and a matching start year', () => {
  const batch = { id: '2024', course: 'MBBS', startsOn: '2024-08-01', syllabus: 'CBME 2024' }
  const data = applyStudentCommand(seed(), { type: 'batch', batch })
  assert.equal(data.batches.length, 5)
  assert.throws(() => applyStudentCommand(data, { type: 'batch', batch }), /already exists/)
  assert.throws(() => applyStudentCommand(seed(), { type: 'batch', batch: { ...batch, startsOn: '2025-08-01' } }), /within the batch/)
})
