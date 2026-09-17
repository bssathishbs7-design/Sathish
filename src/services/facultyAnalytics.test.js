import test from 'node:test'
import assert from 'node:assert/strict'
import { buildFacultyAnalytics, facultyAnalyticsSample, facultyStudentCard, withIdentifiedPracticeResults } from './facultyAnalytics.js'
import { buildCompetencyAnalytics } from './competencyAnalytics.js'
import { practiceSubmissionIdentity } from './practiceSubmissionIdentity.js'
import { getFacultyDisplayAnalytics } from './facultyStudentSamples.js'

test('all-practices preview totals match the displayed students without changing stored results', async () => {
  const { getFacultyAnalytics } = await import('./facultyAnalytics.js')
  const source = card()
  const before = JSON.stringify(source)
  const live = await getFacultyAnalytics(source, 'all', { getItem: () => '[]' })
  const display = getFacultyDisplayAnalytics(live)
  assert.equal(display.assigned, 19)
  assert.equal(display.students.length, 19)
  assert.equal(display.submitted, 15)
  assert.equal(display.pending, 4)
  assert.equal(display.includesPreview, true)
  assert.ok(Number.isFinite(display.average))
  assert.equal(live.assigned, 7)
  assert.equal(JSON.stringify(source), before)
})

test('an obsolete practice filter falls back to all; valid filters still scope preview results', async () => {
  const { getFacultyAnalytics } = await import('./facultyAnalytics.js')
  const source = card()
  source.practiceSessions.push({ ...source.practiceSessions[0], id: 'second', practiceNo: 2 })
  source.facultyAnalytics.students.forEach(student => { student.practiceIds = ['sample'] })
  const storage = { getItem: () => '[]' }
  const fallback = await getFacultyAnalytics(source, 'removed-practice', storage)
  assert.equal(fallback.practiceId, 'all')
  assert.equal(getFacultyDisplayAnalytics(fallback).assigned, 19)
  const selected = getFacultyDisplayAnalytics(await getFacultyAnalytics(source, 'second', storage))
  assert.equal(selected.assigned, 12)
  assert.equal(selected.submitted, 10)
  assert.equal(selected.pending, 2)
  assert.ok(selected.students.flatMap(student => student.attempts).every(attempt => attempt.practiceId === 'second'))
})

test('identified submissions reach faculty analytics without fabricating a cohort roster', async () => {
  const { getFacultyAnalytics } = await import('./facultyAnalytics.js')
  const source = { id: 'real', practiceSessions: [{ id: 'p1', questions: [], practiceAttemptHistory: [
    { id: 'anonymous', status: 'Completed', obtained: 9, total: 10 },
    { id: 'first', ...practiceSubmissionIdentity({ id: 's1', name: 'Test learner', rollNo: 'ID1' }), status: 'Completed', obtained: 0, total: 10, attemptedAt: '2026-09-17T10:00:00Z' },
    { id: 'retake', ...practiceSubmissionIdentity({ id: 's1', name: 'Test learner', rollNo: 'ID1' }), status: 'Completed', obtained: 8, total: 10, attemptedAt: '2026-09-17T11:00:00Z' },
  ] }] }
  const data = await getFacultyAnalytics(source, 'all', { getItem: () => '[]' })
  assert.equal(data.students.length, 1)
  assert.equal(data.students[0].name, 'Test learner')
  assert.equal(data.students[0].rollNo, 'ID1')
  assert.equal(data.students[0].attempts.length, 2)
  assert.equal(data.students[0].latestScore, 80)
  assert.equal(data.submitted, 1)
  assert.equal(data.assigned, null)
  assert.equal(data.pending, null)
  assert.equal(data.isSample, false)
  assert.deepEqual(practiceSubmissionIdentity(null), {})
})

test('identified history honours an explicit roster and preserves authoritative API attempts', async () => {
  const { getFacultyAnalytics } = await import('./facultyAnalytics.js')
  const source = card()
  source.practiceSessions[0].practiceAttemptHistory = [
    { ...source.facultyAnalytics.attempts[0], obtained: 0 },
    { id: 'outsider', studentId: 'unassigned', status: 'Completed', obtained: 1, total: 1 },
  ]
  const data = await getFacultyAnalytics(source, 'all', { getItem: () => '[]' })
  assert.equal(data.assigned, 7)
  assert.equal(data.students[0].latestScore, 100)
  assert.equal(data.students.length, 7)
})

const card = () => structuredClone(facultyAnalyticsSample)
test('incomplete observed roster accepts later students and practice assignments on refresh', () => {
  const attempt = (id, studentId) => ({ id, studentId, status: 'Completed', obtained: 1, total: 2 })
  const first = withIdentifiedPracticeResults({ practiceSessions: [
    { id: 'p1', practiceAttemptHistory: [attempt('a1', 's1')] },
  ] })
  first.practiceSessions.push({ id: 'p2', practiceAttemptHistory: [attempt('a2', 's1'), attempt('a3', 's2')] })
  const refreshed = withIdentifiedPracticeResults(first)
  const data = buildFacultyAnalytics(refreshed, 'p2')
  assert.deepEqual(data.students.map(student => student.id), ['s1', 's2'])
  assert.equal(data.submitted, 2)
  assert.equal(data.assigned, null)
  assert.equal(data.pending, null)
  assert.equal(data.average, 50)
  assert.deepEqual(withIdentifiedPracticeResults(refreshed), refreshed)
})
test('counts unique students, submissions and pending separately; includes zero scores', () => {
  const data = buildFacultyAnalytics(card())
  assert.equal(data.assigned, 7)
  assert.equal(data.submitted, 5)
  assert.equal(data.pending, 2)
  assert.equal(data.students[4].latestScore, 0)
  assert.equal(data.average, 60)
})
test('retakes replace previous marks in cohort average rather than adding weight', () => {
  const source = card()
  source.facultyAnalytics.attempts.push({ ...source.facultyAnalytics.attempts[0], id: 'retake', obtained: 0, mcq: 0, saqs: 0, attemptedAt: '2026-09-18T10:00:00Z' })
  const data = buildFacultyAnalytics(source)
  assert.equal(data.average, 40)
  assert.equal(data.students[0].attempts.length, 2)
  assert.equal(data.students[0].bestScore, 100)
  assert.equal(data.students[0].latestScore, 0)
})
test('duplicate roster and attempt records do not inflate totals', () => {
  const source = card()
  source.facultyAnalytics.students.push(source.facultyAnalytics.students[0])
  source.facultyAnalytics.attempts.push(source.facultyAnalytics.attempts[0])
  assert.equal(buildFacultyAnalytics(source).assigned, 7)
  assert.equal(buildFacultyAnalytics(source).students[0].attempts.length, 1)
})
test('practice filters honour student assignments', () => {
  const source = card()
  source.practiceSessions.push({ id: 'second', practiceNo: 2, questions: [] })
  source.facultyAnalytics.students.forEach(student => { student.practiceIds = ['sample'] })
  assert.equal(buildFacultyAnalytics(source, 'second').assigned, 0)
  assert.equal(buildFacultyAnalytics(source, 'second').average, null)
})
test('missing faculty roster never becomes fabricated cohort data from learner history', () => {
  const source = card()
  delete source.facultyAnalytics
  const data = buildFacultyAnalytics(source)
  assert.equal(data.assigned, null)
  assert.equal(data.average, null)
  assert.equal(data.students.length, 0)
  assert.equal(data.breakdown[0].count, 1)
})
test('student view contains only that student and the selected practice', () => {
  const source = card()
  const student = buildFacultyAnalytics(source).students[1]
  const detail = buildCompetencyAnalytics(facultyStudentCard(source, student))
  assert.equal(detail.attempts.length, 1)
  assert.equal(detail.attempts[0].obtained, 5)
})
test('invalid and draft results do not count as submitted', () => {
  const source = card()
  source.facultyAnalytics.attempts[0].status = 'In Progress'
  source.facultyAnalytics.attempts[1].obtained = null
  assert.equal(buildFacultyAnalytics(source).submitted, 3)
})

test('loader fetches latest stored competency rather than the navigation snapshot', async () => {
  const { getFacultyAnalytics } = await import('./facultyAnalytics.js')
  const stale = card()
  const fresh = card()
  fresh.facultyAnalytics.students.push({ id: 'new-student', name: 'New student', rollNo: 'MC2600' })
  const storage = { getItem: () => JSON.stringify([fresh]) }
  assert.equal((await getFacultyAnalytics(stale, 'all', storage)).assigned, 8)
})
test('shared practices without a roster never load sample students', async () => {
  const { getFacultyAnalytics } = await import('./facultyAnalytics.js')
  const source = card()
  delete source.facultyAnalytics
  delete source.isFacultyDemo
  const data = await getFacultyAnalytics(source, 'all', { getItem: () => JSON.stringify([source]) })
  assert.equal(data.isSample, false)
  assert.equal(data.assigned, null)
  assert.equal(data.students.length, 0)
})
test('an explicit empty roster never receives mock students', async () => {
  const { getFacultyAnalytics } = await import('./facultyAnalytics.js')
  const source = card()
  delete source.isFacultyDemo
  source.facultyAnalytics = { students: [], attempts: [] }
  const data = await getFacultyAnalytics(source, 'all', { getItem: () => JSON.stringify([source]) })
  assert.equal(data.assigned, 0)
  assert.equal(data.isSample, false)
})
test('loading missing cohort data never mutates stored records', async () => {
  const { getFacultyAnalytics } = await import('./facultyAnalytics.js')
  const source = card()
  delete source.facultyAnalytics
  const before = JSON.stringify(source)
  await getFacultyAnalytics(source, 'all', { getItem: () => '[]', setItem: () => assert.fail('Must not persist sample records') })
  assert.equal(JSON.stringify(source), before)
})
