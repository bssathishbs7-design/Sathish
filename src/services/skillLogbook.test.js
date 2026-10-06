import test from 'node:test'
import assert from 'node:assert/strict'
import { normaliseSkillAssignment, projectSkillEntries, studentSkillActivities } from './skillLogbook.js'
import { saveLogbookEntry, updateLogbookEntry } from './logbook.js'

const assignment = normaliseSkillAssignment({ id: 'assigned-a', title: 'Blood grouping', subject: 'Physiology', competency: 'PY2.7', certifiable: false, marks: 'Nil', students: [{ id: 'MC2568', name: 'Karthik' }, { id: 'MC2569', name: 'Ananya' }] })
const evaluation = (attemptNumber, result, studentId = 'MC2568') => ({ activityId: assignment.id, studentId, attemptNumber, rowStatus: 'Completed', decisionId: `decision-${result.toLowerCase()}`, submittedAt: '2026-10-06T10:00:00Z', totalMarks: 10, totalObtainedMarks: 0 })

test('toggle alone determines category and each assigned student has one To do attempt', () => {
  for (const certifiable of [true, false]) {
    const rows = projectSkillEntries([{ ...assignment, certifiable }], [])
    assert.equal(rows.length, 2)
    assert.ok(rows.every(row => row.cat === (certifiable ? 'cert' : 'skill') && row.status === 'To do' && row.attemptNumber === 1))
  }
})
test('submission affects only its student and attempt; completion needs a final faculty decision', () => {
  const assigned = { ...assignment, submissions: [{ studentId: 'MC2568', attemptNumber: 1, submittedAt: '2026-10-06T09:30:00Z' }] }
  const rows = projectSkillEntries([assigned], [])
  assert.deepEqual(rows.map(row => row.status), ['Awaiting evaluation', 'To do'])
  assert.equal(studentSkillActivities([assigned], [], 'MC2568')[0].action, 'Awaiting evaluation')
  assert.equal(studentSkillActivities([assigned], [], 'MC2568')[0].tone, 'secondary')
  assert.equal(projectSkillEntries([assigned], [{ ...evaluation(1, 'Completed'), rowStatus: 'Pending' }])[0].status, 'Awaiting evaluation')
})
test('repeat then remedial retains category, history and student isolation without duplicate attempts', () => {
  const evaluations = [evaluation(1, 'Repeat'), evaluation(2, 'Remedial')]
  const rows = projectSkillEntries([assignment], [...evaluations, evaluations[0]])
  const mine = rows.filter(row => row.studentId === 'MC2568')
  assert.deepEqual(mine.map(row => [row.attemptNumber, row.status]), [[1, 'Repeat'], [2, 'Remedial'], [3, 'To do']])
  assert.ok(mine.every(row => row.cat === 'skill'))
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length)
  assert.equal(rows.filter(row => row.studentId === 'MC2569').length, 1)
  assert.equal(studentSkillActivities([assignment], evaluations, 'MC2568')[0].attemptNumber, 3)
  assert.equal(studentSkillActivities([assignment], evaluations, 'MC2568')[0].action, 'Start Activity')
  assert.equal(studentSkillActivities([assignment], evaluations, 'unassigned').length, 0)
})
test('Completed does not create a new attempt and preserves zero marks', () => {
  const rows = projectSkillEntries([{ ...assignment, marks: '10' }], [evaluation(1, 'Completed')])
  assert.equal(rows.filter(row => row.studentId === 'MC2568').length, 1)
  assert.equal(rows[0].status, 'Completed')
  assert.equal(rows[0].performance.totalObtainedMarks, 0)
  assert.equal(rows[0].marksEnabled, true)
})
test('empty rosters stay empty and scheduled repeats retain their schedule gate', () => {
  assert.deepEqual(projectSkillEntries([{ ...assignment, students: [] }], []), [])
  const scheduled = { ...assignment, nextAttemptNumber: 2, nextAttemptStatus: 'scheduled', scheduledAt: '2099-01-01T00:00:00Z' }
  const activity = studentSkillActivities([scheduled], [evaluation(1, 'Repeat')], 'MC2568')[0]
  assert.equal(activity.action, 'Yet to Start')
  assert.equal(activity.attemptNumber, 2)
})
test('submission answers and final feedback remain attached to their original attempt', () => {
  const assigned = { ...assignment, examData: { modules: { checklist: [{ id: 'prepare', text: 'Prepare equipment' }] } }, submissions: [{ studentId: 'MC2568', attemptNumber: 1, submittedAt: '2026-10-06T09:30:00Z', answers: { questions: { prepare: 'Performed under supervision' } } }] }
  const rows = projectSkillEntries([assigned], [{ ...evaluation(1, 'Repeat'), feedback: 'Repeat preparation.' }])
  assert.equal(rows[0].submissionItems[0].answer, 'Performed under supervision')
  assert.equal(rows[0].extra.facultyRemarks, 'Repeat preparation.')
  assert.equal(rows[1].submissionItems.length, 0)
})
test('linked entries reject Logbook writes even with forged source metadata', async () => {
  const previous = globalThis.window
  globalThis.window = { localStorage: { getItem: () => null } }
  try {
    const entry = projectSkillEntries([assignment], [])[0]
    await assert.rejects(saveLogbookEntry({ ...entry, source: undefined }), /read-only/)
    for (const action of ['notes', 'comment', 'withdraw', 'review']) await assert.rejects(updateLogbookEntry(entry.id, action), /read-only/)
  } finally { globalThis.window = previous }
})
