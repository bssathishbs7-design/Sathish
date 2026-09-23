import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getPracticeOverview } from './practiceOverview.js'

test('separates shared, started, completed and expired practice', () => {
  const card = session => ({ practiceSessions: [session] })
  const result = getPracticeOverview([
    card({ status: 'In Progress', saqs: 2 }),
    card({ status: 'In Progress', mcq: 3, practiceAnswers: {} }),
    card({ status: 'Completed', mcq: 4 }),
    card({ status: 'Expired', mcq: 5 }),
  ])
  assert.deepEqual(result, { available: 4, inProgress: 1, completed: 1, remaining: 5 })
})
test('counts a mixed set once and supports legacy question arrays', () => {
  assert.deepEqual(getPracticeOverview([
    { practiceSessions: [{ status: 'Completed', mcq: 3 }, { status: 'In Progress', laqs: 1, practiceAnswers: {} }] },
    { questions: [{ id: 'q1' }], status: 'In Progress' },
  ]), { available: 2, inProgress: 1, completed: 0, remaining: 2 })
  assert.deepEqual(getPracticeOverview([]), { available: 0, inProgress: 0, completed: 0, remaining: 0 })
})
