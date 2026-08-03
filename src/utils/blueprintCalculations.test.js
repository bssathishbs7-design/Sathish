import test from 'node:test'
import assert from 'node:assert/strict'
import {
  allocateWeightedMarks,
  calculateComplementaryQuestionSplit,
  calculateCognitionMarks,
  calculateQuestionTotal,
  clampPercentage,
  roundHalfUp,
  summarizeQuestionTypeRows,
  validateCognitionTotals,
} from './blueprintCalculations.js'

test('calculates a read-only question total only for an exact marks division', () => {
  assert.deepEqual(calculateQuestionTotal({ totalMarks: 25, markPerQuestion: 5 }), {
    isValid: true,
    totalQuestions: 5,
  })
  assert.deepEqual(calculateQuestionTotal({ totalMarks: 12, markPerQuestion: 5 }), {
    isValid: false,
    totalQuestions: 0,
  })
})

test('editing either cognition question count updates its complement', () => {
  assert.deepEqual(calculateComplementaryQuestionSplit({
    totalQuestions: 10,
    editedLevel: 'lot',
    editedQuestions: 3,
  }), { hotQuestions: 7, lotQuestions: 3 })
  assert.deepEqual(calculateComplementaryQuestionSplit({
    totalQuestions: 10,
    editedLevel: 'hot',
    editedQuestions: 6,
  }), { hotQuestions: 6, lotQuestions: 4 })
  assert.deepEqual(calculateComplementaryQuestionSplit({
    totalQuestions: 10,
    editedLevel: 'hot',
    editedQuestions: 15,
  }), { hotQuestions: 10, lotQuestions: 0 })
})

test('rounds values below .5 down and values at or above .5 up', () => {
  assert.equal(roundHalfUp(17.2), 17)
  assert.equal(roundHalfUp(17.5), 18)
  assert.equal(roundHalfUp(17.8), 18)
})

test('clamps cognition percentages to the supported range', () => {
  assert.equal(clampPercentage(-5), 0)
  assert.equal(clampPercentage(25), 25)
  assert.equal(clampPercentage(105), 100)
})

test('preserves the total when percentage rounding produces a half mark', () => {
  assert.deepEqual(calculateCognitionMarks({ totalMarks: 50, hotPercentage: 75 }), {
    totalMarks: 50,
    hotMarks: 38,
    lotMarks: 12,
  })
})

test('supports zero and one hundred percent boundary splits', () => {
  assert.deepEqual(calculateCognitionMarks({ totalMarks: 20, hotPercentage: 0 }), {
    totalMarks: 20,
    hotMarks: 0,
    lotMarks: 20,
  })
  assert.deepEqual(calculateCognitionMarks({ totalMarks: 20, hotPercentage: 100 }), {
    totalMarks: 20,
    hotMarks: 20,
    lotMarks: 0,
  })
})

test('validates cognition footer totals against the assessment total', () => {
  assert.equal(validateCognitionTotals({ totalMarks: 50, hotMarks: 38, lotMarks: 12 }).isValid, true)
  assert.equal(validateCognitionTotals({ totalMarks: 50, hotMarks: 38, lotMarks: 13 }).isValid, false)
})

test('allocates weighted competency marks without losing the assessment total', () => {
  assert.deepEqual(allocateWeightedMarks({
    totalMarks: 50,
    rows: [
      { key: 'an1', weight: 3 },
      { key: 'an2', weight: 3 },
      { key: 'an3', weight: 2 },
      { key: 'an4', weight: 2 },
      { key: 'an5', weight: 1 },
      { key: 'an6', weight: 2 },
      { key: 'an7', weight: 1 },
      { key: 'an8', weight: 1 },
    ],
  }), {
    an1: '10',
    an2: '10',
    an3: '7',
    an4: '7',
    an5: '3',
    an6: '7',
    an7: '3',
    an8: '3',
  })
})

test('uses stable row order to resolve equal weighted remainders', () => {
  assert.deepEqual(allocateWeightedMarks({
    totalMarks: 2,
    rows: [
      { key: 'first', weight: 1 },
      { key: 'second', weight: 1 },
      { key: 'third', weight: 1 },
    ],
  }), { first: '1', second: '1', third: '0' })
})

test('summarizes question rows so footer totals use one invariant', () => {
  assert.deepEqual(summarizeQuestionTypeRows([
    { totalMarks: 20, totalQuestions: 20, hotMarks: 15, hotQuestions: 15, lotMarks: 5, lotQuestions: 5 },
    { totalMarksNumber: 30, totalQuestions: 3, hotMarks: 20, hotQuestions: 2, lotMarks: 10, lotQuestions: 1 },
  ]), {
    totalMarks: 50,
    totalQuestions: 23,
    hotMarks: 35,
    hotQuestions: 17,
    lotMarks: 15,
    lotQuestions: 6,
  })
})
