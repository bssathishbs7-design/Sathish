import test from 'node:test'
import assert from 'node:assert/strict'
import { nextPendingEvaluationStudent } from './evaluationNavigation.js'

test('next student wraps to earlier unfinished students and skips absent/completed rows', () => {
  const rows = [
    { id: 'pending', isAbsent: false },
    { id: 'absent', isAbsent: true },
    { id: 'finished', markedEvaluated: true, evalStatus: 'Completed' },
    { id: 'current', markedEvaluated: true, evalStatus: 'Completed' },
  ]
  assert.equal(nextPendingEvaluationStudent(rows, 'current')?.id, 'pending')
  assert.equal(nextPendingEvaluationStudent(rows, 'pending'), null)
  rows[0] = { ...rows[0], markedEvaluated: true, evalStatus: 'Completed' }
  assert.equal(nextPendingEvaluationStudent(rows, 'current'), null)
})

test('invalidated evaluation and unconfirmed marking still require completion', () => {
  const rows = [{ id: 'current' }, { id: 'reset', markedEvaluated: true, evalStatus: 'Yet to Start' }]
  assert.equal(nextPendingEvaluationStudent(rows, 'current')?.id, 'reset')
  assert.equal(nextPendingEvaluationStudent([{ id: 'ready', evalStatus: 'Completed' }], 'missing')?.id, 'ready')
  assert.equal(nextPendingEvaluationStudent([], 'missing'), null)
})
