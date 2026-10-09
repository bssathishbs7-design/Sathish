import test from 'node:test'
import assert from 'node:assert/strict'
import { suggestBlueprintRow } from './blueprintAdjustments.js'
const row = (label, unit, count, hot, cognitionMode = 'both') => ({ label, perQuestionMarks: String(unit), totalMarks: count ? String(unit * count) : '', totalQuestions: count, hotQuestions: hot, lotQuestions: count - hot, hotMarks: unit * hot, lotMarks: unit * (count - hot), cognitionMode, hasValidQuestionTotal: count > 0 })
const target = { totalMarks: 100, hotMarks: 70 }
test('uses remaining assessment targets, not the same percentage in every row', () => {
  const mcq = row('MCQs', 1, 20, 20)
  const other = row('SAQs (Reasoning)', 5, 16, 12)
  const result = suggestBlueprintRow(mcq, [mcq, other], target)
  assert.equal(result.options.length, 1)
  assert.deepEqual([result.options[0].lotQuestions, result.options[0].hotQuestions], [10, 10])
  assert.equal(result.options[0].remainingHot, 0)
  assert.equal(result.options[0].remainingLot, 0)
})
test('blank totals offer bounded allocations for each selected mode', () => {
  for (const mode of ['lot', 'hot', 'both']) {
    const input = row('SAQs (Direct)', 5, 0, 0, mode)
    const result = suggestBlueprintRow(input, [input], target)
    assert.ok(result.options.length)
    for (const option of result.options) {
      assert.ok(option.totalMarks > 0 && option.totalMarks <= 100)
      assert.ok(option.hotMarks <= 70 && option.lotMarks <= 30)
      if (mode === 'lot') assert.equal(option.hotQuestions, 0)
      if (mode === 'hot') assert.equal(option.lotQuestions, 0)
    }
  }
})
test('selection without marks per question prompts for the missing value', () => {
  const input = { ...row('SAQs (Direct)', 5, 0, 0, 'lot'), perQuestionMarks: '' }
  const result = suggestBlueprintRow(input, [input], target)
  assert.equal(result.options.length, 0)
  assert.match(result.message, /Enter valid marks per question/)
})
test('entered total constrains every option', () => {
  const input = row('MCQs', 1, 20, 0)
  assert.ok(suggestBlueprintRow(input, [input], target).options.every(option => option.totalMarks === 20))
})
test('LoT 30 marks can be allocated as 10 MCQs plus four 5-mark SAQs', () => {
  const mcq = row('MCQs', 1, 20, 10)
  const saq = row('SAQs (Direct)', 5, 4, 0, 'lot')
  const result = suggestBlueprintRow(saq, [mcq, saq], target)
  assert.equal(result.options[0].lotQuestions, 4)
  assert.equal(result.options[0].lotMarks, 20)
  assert.equal(result.options[0].remainingLot, 0)
})
test('fixed HoT and LoT selections never generate opposite-level questions', () => {
  for (const mode of ['hot', 'lot']) {
    const input = row('SAQs (Direct)', 5, 2, mode === 'hot' ? 2 : 0, mode)
    const result = suggestBlueprintRow(input, [input], target)
    assert.ok(result.options.length)
    assert.ok(result.options.every(option => mode === 'hot' ? option.lotQuestions === 0 : option.hotQuestions === 0))
  }
})
test('LAQ parts contribute actual marks without treating parts as whole questions', () => {
  const laq = { ...row('LAQs', 10, 1, 0), usesLaqSplit: true, hotQuestions: 2, lotQuestions: 1, hotMarks: 7, lotMarks: 3 }
  const mcq = row('MCQs', 1, 20, 0)
  const result = suggestBlueprintRow(mcq, [mcq, laq], target)
  assert.equal(result.remainingHot, 63)
  assert.equal(result.remainingLot, 27)
  const selected = suggestBlueprintRow(laq, [mcq, laq], target)
  assert.equal(selected.selected.totalQuestions, 1)
  assert.equal(selected.selected.hotQuestions, 2)
  assert.equal(selected.options.length, 0)
})
test('invalid, incomplete or overallocated rows do not produce misleading options', () => {
  const mcq = row('MCQs', 1, 20, 20)
  const invalid = { ...row('SAQs (Direct)', 5, 2, 0), hasValidQuestionTotal: false }
  assert.equal(suggestBlueprintRow(mcq, [mcq, invalid], target).options.length, 0)
  const over = row('SAQs (Direct)', 5, 8, 0, 'lot')
  assert.equal(suggestBlueprintRow(mcq, [mcq, over], target).options.length, 0)
  assert.equal(suggestBlueprintRow({ ...mcq, perQuestionMarks: '3' }, [mcq], target).options.length, 0)
})
test('decimal marks and zero HoT target remain bounded', () => {
  const input = row('MCQs', 0.5, 10, 0)
  const options = suggestBlueprintRow(input, [input], { totalMarks: 5, hotMarks: 0 }).options
  assert.ok(options.every(option => option.hotQuestions === 0 && option.totalMarks <= 5))
})


test('blank total offers only the available LoT budget and shrinks after other allocations', () => {
  const input = row('SAQs (Direct)', 5, 0, 0, 'lot')
  const assessment = { totalMarks: 100, hotMarks: 75, lotPercent: 25, hotPercent: 75 }
  assert.deepEqual(suggestBlueprintRow(input, [input], assessment).options.map(item => item.totalMarks), [25])
  const other = row('MCQs', 1, 15, 0)
  assert.deepEqual(suggestBlueprintRow(input, [input, other], assessment).options.map(item => item.totalMarks), [10])
})
test('one-mark MCQs at 20/80 offer exactly one 100-mark allocation', () => {
  const input = row('MCQs', 1, 0, 0)
  const result = suggestBlueprintRow(input, [input], { totalMarks: 100, hotMarks: 80, lotPercent: 20, hotPercent: 80 })
  assert.equal(result.options.length, 1)
  assert.equal(result.options[0].totalMarks, 100)
  assert.equal(result.options[0].lotQuestions, 20)
  assert.equal(result.options[0].hotQuestions, 80)
})
test('invalid percentages and unset SAQ selection do not produce cards', () => {
  const input = row('SAQs (Direct)', 5, 0, 0, 'lot')
  for (const percentages of [{ lotPercent: 25, hotPercent: 70 }, { lotPercent: -5, hotPercent: 105 }, { lotPercent: NaN, hotPercent: 75 }]) {
    assert.equal(suggestBlueprintRow(input, [input], { ...target, ...percentages }), null)
  }
  assert.equal(suggestBlueprintRow({ ...input, cognitionMode: null }, [input], target), null)
})
test('other rows must have consistent counts, marks and thinking levels', () => {
  const input = row('MCQs', 1, 20, 10)
  const base = row('SAQs (Direct)', 5, 4, 0, 'lot')
  for (const invalid of [{ ...base, lotMarks: 10 }, { ...base, lotQuestions: 3 }, { ...base, cognitionMode: 'hot' }, { ...base, hotMarks: NaN }]) {
    assert.equal(suggestBlueprintRow(input, [input, invalid], target).options.length, 0)
  }
})
test('LAQ allocations exceeding the budget are not shown as selected cards', () => {
  const laq = { ...row('LAQs', 40, 1, 0), usesLaqSplit: true, hotQuestions: 0, lotQuestions: 2, hotMarks: 0, lotMarks: 40 }
  const result = suggestBlueprintRow(laq, [laq], target)
  assert.equal(result.selected, undefined)
  assert.equal(result.options.length, 0)
})
