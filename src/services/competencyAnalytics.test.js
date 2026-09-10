import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCompetencyAnalytics, competencyAnalyticsSample, restoreCompletedPracticeHistory } from './competencyAnalytics.js'

test('analytics keeps completed results while a retake draft is unfinished', () => {
  const card = structuredClone(competencyAnalyticsSample)
  card.practiceSessions[0].status = 'In Progress'
  card.practiceSessions[0].practiceSubmitted = false
  card.practiceSessions[0].practiceAnswers = { answer: 'unfinished draft' }
  const result = buildCompetencyAnalytics(card)
  assert.equal(result.practiceCount, 1)
  assert.equal(result.attempts.length, 2)
  assert.equal(result.attempts.at(-1).obtained, 5)
  assert.equal(result.attempts.at(-1).types, 'MCQ, SAQ')
})

test('analytics orders results by submission time and excludes unfinished history', () => {
  const card = structuredClone(competencyAnalyticsSample)
  card.practiceSessions[0].practiceAttemptHistory.reverse()
  card.practiceSessions[0].practiceAttemptHistory.push({ status: 'In Progress', obtained: 6, total: 6 })
  const result = buildCompetencyAnalytics(card)
  assert.deepEqual(result.attempts.map((attempt) => attempt.obtained), [3, 5])
})

test('empty competencies do not inherit sample results', () => {
  assert.deepEqual(buildCompetencyAnalytics({}).attempts, [])
  assert.equal(buildCompetencyAnalytics({}).practiceCount, 0)
})

test('legacy completed zero score becomes one completed analytics attempt', () => {
  const session = { id: 'old', status: 'Completed', totalMarks: 10, mcq: 2, practiceSubmitted: false }
  const card = { practiceSessions: [session] }
  const scoreSession = () => ({ obtained: 0, total: 10, mcq: 0, saqs: 0, laqs: 0 })
  const totalMarks = (item) => item.totalMarks
  const restored = restoreCompletedPracticeHistory(card, [session], scoreSession, totalMarks)
  const result = buildCompetencyAnalytics(restored)
  assert.equal(result.attempts.length, 1)
  assert.equal(result.attempts[0].obtained, 0)
  assert.equal(result.attempts[0].total, 10)
  assert.equal(result.attempts[0].attemptedAt, '')
  const repeated = restoreCompletedPracticeHistory(restored, restored.practiceSessions, scoreSession, totalMarks)
  assert.equal(buildCompetencyAnalytics(repeated).attempts.length, 1)
})

test('restoration preserves nonzero scores and ignores unsubmitted drafts', () => {
  const sessions = [{ id: 'done', practiceSubmitted: true }, { id: 'draft', status: 'In Progress' }]
  const card = restoreCompletedPracticeHistory({}, sessions, () => ({ obtained: 7, total: 10, saqs: 7 }), (_, total) => total)
  const result = buildCompetencyAnalytics(card)
  assert.equal(result.attempts.length, 1)
  assert.equal(result.attempts[0].obtained, 7)
})
