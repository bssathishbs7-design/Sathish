import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateBlueprintOutline } from './blueprintOutline.js'
test('outline tallies MCQ, individual SAQs and LAQ once and requires exact target', () => {
 const draft = { MCQs: { perQuestionMarks: '1', questionCount: '20' }, 'SAQs (Direct)': { perQuestionMarks: '5', questionCount: '6', cognitionMode: 'both' }, LAQs: { perQuestionMarks: '10', questionCount: '5' } }
 assert.equal(calculateBlueprintOutline(draft, 100).valid, true)
 assert.equal(calculateBlueprintOutline(draft, 100).total, 100)
 assert.equal(calculateBlueprintOutline(draft, 90).valid, false)
 assert.equal(calculateBlueprintOutline(draft, 110).remaining, 10)
})
test('outline rejects partial rows, fractions, zero counts, missing SAQ modes and empty totals', () => {
 for (const item of [{ perQuestionMarks: '5' }, { perQuestionMarks: '5', questionCount: '1.5' }, { perQuestionMarks: '5', questionCount: '0' }, { perQuestionMarks: '5', questionCount: '2' }]) {
  assert.equal(calculateBlueprintOutline({ 'SAQs (Direct)': item }, 10).valid, false)
 }
 assert.equal(calculateBlueprintOutline({}, 100).valid, false)
 assert.equal(calculateBlueprintOutline({ MCQs: { perQuestionMarks: '0.1', questionCount: '3' } }, 0.3).valid, false)
})
