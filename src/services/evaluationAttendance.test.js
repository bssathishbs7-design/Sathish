import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeEvaluationAttendance } from './evaluationAttendance.js'

test('attendance labels and codes produce the same evaluation eligibility', () => {
  for (const value of ['A', 'Absent', ' absent ', 'ABSENT']) {
    assert.equal(normalizeEvaluationAttendance(value), 'A')
  }
  for (const value of ['P', 'Present', ' present ', 'PRESENT']) {
    assert.equal(normalizeEvaluationAttendance(value), 'P')
  }
  for (const value of [null, undefined, '', 'unknown']) {
    assert.equal(normalizeEvaluationAttendance(value), '')
  }
})
