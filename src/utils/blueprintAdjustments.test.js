import test from 'node:test'
import assert from 'node:assert/strict'
import { suggestBlueprintRow } from './blueprintAdjustments.js'
const row = (label, unit, count, hot, cognitionMode = 'both') => ({ label, perQuestionMarks: String(unit), totalMarks: count ? String(unit * count) : '', totalQuestions: count, hotQuestions: hot, lotQuestions: count - hot, hotMarks: unit * hot, lotMarks: unit * (count - hot), cognitionMode, hasValidQuestionTotal: count > 0 })
const target = { totalMarks: 100, hotMarks: 78, lotPercent: 22, hotPercent: 78 }
test('22/78 on 20 one-mark MCQs recommends 4/16 then 5/15 only', () => {
  const input = row('MCQs', 1, 20, 20)
  const options = suggestBlueprintRow(input, [input], target).options
  assert.deepEqual(options.map(item => [item.lotQuestions, item.hotQuestions]), [[4, 16], [5, 15]])
  assert.equal(options[0].recommended, true)
  assert.equal(options[1].recommended, false)
  assert.ok(options.every(item => item.totalMarks === 20))
})
test('exact percentages have one option with no all-LoT or all-HoT alternatives', () => {
  const input = row('MCQs', 1, 20, 20)
  const options = suggestBlueprintRow(input, [input], { totalMarks: 100, hotMarks: 80 }).options
  assert.deepEqual(options.map(item => [item.lotQuestions, item.hotQuestions]), [[4, 16]])
})
test('blank total uses the assessment budget then entered total uses its percentage split', () => {
  const input = row('MCQs', 1, 0, 0)
  const assessment = { totalMarks: 100, hotMarks: 75, lotPercent: 25, hotPercent: 75 }
  const options = suggestBlueprintRow(input, [input], assessment).options
  assert.deepEqual(options.map(item => [item.totalMarks, item.lotQuestions, item.hotQuestions]), [[100, 25, 75]])
  const entered = { ...input, totalMarks: '20' }
  assert.deepEqual(suggestBlueprintRow(entered, [entered], assessment).options.map(item => [item.totalMarks, item.lotQuestions, item.hotQuestions]), [[20, 5, 15]])
})
test('blank totals subtract other allocations and respect fixed SAQ modes', () => {
  const input = row('MCQs', 1, 0, 0)
  const other = row('SAQs (Direct)', 5, 4, 0, 'lot')
  const options = suggestBlueprintRow(input, [input, other], target).options
  assert.deepEqual(options.map(item => [item.totalMarks, item.lotMarks, item.hotMarks]), [[80, 2, 78]])
  for (const mode of ['lot', 'hot', 'both']) {
    const saq = row('SAQs (Reasoning)', 5, 0, 0, mode)
    const cards = suggestBlueprintRow(saq, [saq], target).options
    assert.equal(cards.length, 1)
    assert.ok(cards[0].hotMarks <= 78 && cards[0].lotMarks <= 22)
    if (mode === 'lot') assert.equal(cards[0].hotQuestions, 0)
    if (mode === 'hot') assert.equal(cards[0].lotQuestions, 0)
  }
})
test('entered totals use the remaining cognition ratio and stay within both budgets', () => {
  const input = row('MCQs', 1, 20, 20)
  const other = row('SAQs (Reasoning)', 3, 21, 21, 'hot')
  const options = suggestBlueprintRow(input, [input, other], target).options
  assert.deepEqual(options.map(item => item.hotQuestions), [8, 9])
  assert.equal(options[0].recommended, true)
  const more = row('SAQs (Reasoning)', 5, 14, 14, 'hot')
  assert.deepEqual(suggestBlueprintRow(input, [input, more], target).options.map(item => item.hotQuestions), [5, 6])
})
test('fixed SAQs keep their selection while Both uses percentage rounding', () => {
  for (const mode of ['hot', 'lot']) {
    const input = row('SAQs (Direct)', 5, 4, mode === 'hot' ? 4 : 0, mode)
    const options = suggestBlueprintRow(input, [input], target).options
    assert.equal(options.length, 1)
    assert.equal(options[0].hotQuestions, mode === 'hot' ? 4 : 0)
  }
  const input = row('SAQs (Reasoning)', 5, 4, 4)
  assert.deepEqual(suggestBlueprintRow(input, [input], target).options.map(item => item.hotQuestions), [3, 4])
})
test('LAQ parts retain actual marks and cannot exceed the budget', () => {
  const laq = { ...row('LAQs', 10, 1, 0), usesLaqSplit: true, hotQuestions: 2, lotQuestions: 1, hotMarks: 7, lotMarks: 3 }
  const result = suggestBlueprintRow(laq, [laq], target)
  assert.equal(result.selected.hotQuestions, 2)
  assert.equal(result.selected.totalQuestions, 1)
  assert.equal(result.options.length, 0)
  const over = { ...laq, totalMarks: '40', perQuestionMarks: '40', hotMarks: 0, lotMarks: 40 }
  assert.equal(suggestBlueprintRow(over, [over], target).selected, undefined)
})
test('invalid current inputs block suggestions but incomplete other rows do not', () => {
  const input = row('MCQs', 1, 20, 20)
  assert.equal(suggestBlueprintRow(input, [input], { ...target, lotPercent: 30 }), null)
  assert.equal(suggestBlueprintRow({ ...input, perQuestionMarks: '3' }, [input], target).options.length, 0)
  const other = { ...row('SAQs (Direct)', 5, 4, 0, 'lot'), lotMarks: 10 }
  assert.equal(suggestBlueprintRow(input, [input, other], target).options.length, 2)
})
test('zero/full cognition percentages and decimal marks are valid', () => {
  for (const hot of [0, 100]) {
    const input = row('MCQs', 0.5, 20, 0)
    const options = suggestBlueprintRow(input, [input], { totalMarks: 100, hotMarks: hot }).options
    assert.equal(options.length, 1)
    assert.equal(options[0].hotQuestions, hot === 0 ? 0 : 20)
  }
})

test('completed mismatched assessment offers row-only partial and full corrections', () => {
  const rows = [row('MCQs', 1, 20, 15), row('SAQs (Direct)', 5, 3, 0, 'lot'), row('SAQs (Reasoning)', 5, 4, 3, 'both'), row('SAQs (Aetcom)', 5, 4, 4, 'hot'), row('SAQs (Application)', 5, 5, 0, 'lot')]
  const assessment = { totalMarks: 100, hotMarks: 75, hotPercent: 75, lotPercent: 25 }
  const direct = suggestBlueprintRow(rows[1], rows, assessment).options[0]
  assert.equal(direct.movedMarks, 15)
  assert.equal(direct.remainingMismatch, 10)
  assert.equal(direct.requiresConfirmation, true)
  assert.equal(direct.requiredMode, 'hot')
  const reasoning = suggestBlueprintRow(rows[2], rows, assessment).options[0]
  assert.equal(reasoning.movedMarks, 5)
  assert.equal(reasoning.remainingMismatch, 20)
  assert.equal(reasoning.requiresConfirmation, false)
  assert.equal(suggestBlueprintRow(rows[3], rows, assessment), null)
  const application = suggestBlueprintRow(rows[4], rows, assessment).options[0]
  assert.equal(application.movedMarks, 25)
  assert.equal(application.remainingMismatch, 0)
  assert.equal(application.totalMarks, 25)
  assert.equal(application.hotQuestions, 5)
  assert.equal(application.lotQuestions, 0)
})
test('corrections work in reverse and never overshoot a denomination gap', () => {
  const input = row('SAQs (Direct)', 5, 4, 4, 'hot')
  const other = row('MCQs', 1, 80, 60)
  const result = suggestBlueprintRow(input, [input, other], { totalMarks: 100, hotMarks: 73 }).options[0]
  assert.equal(result.destination, 'LoT')
  assert.equal(result.movedMarks, 5)
  assert.equal(result.remainingMismatch, 2)
  assert.equal(result.requiredMode, 'both')
})

test('three-mark gap gives MCQ exact correction and no five-mark SAQ overshoot', () => {
  const rows = [row('MCQs', 1, 20, 15), row('SAQs (Direct)', 5, 2, 2, 'hot'), row('SAQs (Reasoning)', 5, 3, 3, 'hot'), row('SAQs (Aetcom)', 5, 3, 1), row('SAQs (Application)', 5, 8, 6)]
  const original = structuredClone(rows)
  const option = suggestBlueprintRow(rows[0], rows, target).options[0]
  assert.deepEqual([option.lotQuestions, option.hotQuestions, option.remainingMismatch], [2, 18, 0])
  for (const item of rows.slice(1)) assert.equal(suggestBlueprintRow(item, rows, target), null)
  assert.deepEqual(rows, original)
})

test('LAQ subset correction preserves part marks and finds exact or best non-overshooting move', () => {
  const parts = [1, 2, 7].map((marks, partIndex) => ({ marks, partIndex, questionIndex: 0, level: 'lot' }))
  const laq = { ...row('LAQs', 10, 1, 0), usesLaqSplit: true, hotQuestions: 0, lotQuestions: 3, laqParts: parts }
  const mcq = row('MCQs', 1, 90, 75)
  const original = structuredClone([laq, mcq])
  const option = suggestBlueprintRow(laq, [laq, mcq], target).options[0]
  assert.equal(option.movedMarks, 3)
  assert.equal(option.remainingMismatch, 0)
  assert.deepEqual(option.laqChanges.map(item => item.partIndex), [0, 1])
  assert.equal(option.requiresConfirmation, true)
  const partial = { ...laq, laqParts: [2, 8].map((marks, partIndex) => ({ marks, partIndex, questionIndex: 0, level: 'lot' })), lotQuestions: 2 }
  assert.equal(suggestBlueprintRow(partial, [partial, mcq], target).options[0].remainingMismatch, 1)
  const impossible = { ...laq, laqParts: [{ marks: 10, questionIndex: 0, partIndex: 0, level: 'lot' }], lotQuestions: 1 }
  assert.equal(suggestBlueprintRow(impossible, [impossible, mcq], target), null)
  assert.deepEqual([laq, mcq], original)
})

test('sequential suggestions consume only applied budgets and exclude the edited row', () => {
  const direct = row('SAQs (Direct)', 5, 4, 0, 'lot')
  const mcq = row('MCQs', 1, 0, 0)
  const rows = [direct, mcq]
  const original = structuredClone(rows)
  const available = suggestBlueprintRow(mcq, rows, target).options[0]
  assert.deepEqual([available.totalMarks, available.lotMarks, available.hotMarks], [80, 2, 78])
  const entered = { ...mcq, totalMarks: '20', totalQuestions: 20, hasValidQuestionTotal: true, pendingAllocation: true }
  const suggestions = suggestBlueprintRow(entered, [direct, entered], target).options
  assert.deepEqual(suggestions.map(item => [item.lotQuestions, item.hotQuestions]), [[0, 20], [1, 19]])
  const replacement = suggestBlueprintRow(direct, rows, target).options[0]
  assert.equal(replacement.totalMarks, 20)
  assert.equal(replacement.lotQuestions, 4)
  assert.deepEqual(rows, original)
})

test('pending SAQs and incomplete LAQs leave the completed budget available', () => {
  const direct = row('SAQs (Direct)', 5, 6, 5, 'both')
  const reasoning = { ...row('SAQs (Reasoning)', 5, 5, 0, 'lot'), pendingAllocation: true }
  const aetcom = { ...row('SAQs (Aetcom)', 5, 5, 0, 'hot'), pendingAllocation: true }
  const laq = { ...row('LAQs', 10, 1, 0), usesLaqSplit: false }
  const rows = [direct, reasoning, aetcom, laq]
  const original = structuredClone(rows)
  const assessment = { totalMarks: 100, hotMarks: 75 }
  const reason = suggestBlueprintRow(reasoning, rows, assessment)
  assert.equal(reason.remainingLot, 20)
  assert.equal(reason.remainingHot, 50)
  assert.equal(reason.options[0].requiredMode, 'hot')
  assert.equal(reason.options[0].requiresConfirmation, true)
  const hot = suggestBlueprintRow(aetcom, rows, assessment)
  assert.equal(hot.options[0].hotMarks, 25)
  assert.equal(hot.options[0].remainingHot, 25)
  assert.deepEqual(rows, original)
})

test('a five-mark LoT question with only three marks available offers confirmed HoT fallback', () => {
  const mcq = row('MCQs', 1, 30, 16)
  const direct = row('SAQs (Direct)', 5, 1, 0, 'lot')
  const reasoning = { ...row('SAQs (Reasoning)', 5, 2, 0, 'lot'), pendingAllocation: true }
  const rows = [mcq, direct, reasoning]
  const before = structuredClone(rows)
  const result = suggestBlueprintRow(reasoning, rows, target)
  assert.equal(result.message, '3 LoT marks available. A 5-mark LoT question cannot fit.')
  assert.equal(result.showExplanation, true)
  const alternative = result.options[0]
  assert.deepEqual([alternative.totalMarks, alternative.hotQuestions, alternative.lotQuestions, alternative.requiredMode, alternative.requiresConfirmation], [10, 2, 0, 'hot', true])
  assert.deepEqual(rows, before)
  const oversized = { ...reasoning, totalMarks: '65' }
  assert.equal(suggestBlueprintRow(oversized, [mcq, direct, oversized], target).options.length, 0)
  const indivisible = { ...reasoning, totalMarks: '7' }
  assert.equal(suggestBlueprintRow(indivisible, [mcq, direct, indivisible], target).options.length, 0)
})

test('HoT shortage can offer LoT while retaining the entered total', () => {
  const other = row('MCQs', 1, 77, 77)
  const current = { ...row('SAQs (Direct)', 5, 2, 0, 'hot'), pendingAllocation: true }
  const result = suggestBlueprintRow(current, [other, current], target)
  assert.equal(result.message, '1 HoT marks available. A 5-mark HoT question cannot fit.')
  assert.equal(result.options[0].requiredMode, 'lot')
  assert.equal(result.options[0].totalMarks, 10)
})
