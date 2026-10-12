import test from 'node:test'
import assert from 'node:assert/strict'
import { snapshotBlueprintRow } from './blueprintRowState.js'

test('captures automatic counts before percentage changes without mutating the draft', () => {
  const draft = { perQuestionMarks: '1', totalMarks: '20' }
  const snapshot = snapshotBlueprintRow(draft, { label: 'MCQs', hasValidQuestionTotal: true, hotQuestions: 10, lotQuestions: 10 })
  assert.deepEqual(snapshot, { ...draft, hotQuestions: '10', lotQuestions: '10' })
  assert.deepEqual(draft, { perQuestionMarks: '1', totalMarks: '20' })
})
test('empty and LAQ rows preserve their original fields', () => {
  assert.deepEqual(snapshotBlueprintRow(undefined, { label: 'MCQs', hasValidQuestionTotal: false }), {})
  const laq = { perQuestionMarks: '10', totalMarks: '10' }
  assert.deepEqual(snapshotBlueprintRow(laq, { label: 'LAQs', hasValidQuestionTotal: true, hotQuestions: 2, lotQuestions: 1 }), laq)
})

test('pending row splits remain blank when snapshotting for Undo or percentage changes', () => {
  const draft = { perQuestionMarks: '5', totalMarks: '20', pendingAllocation: true }
  const row = { label: 'SAQs (Direct)', hasValidQuestionTotal: true, pendingAllocation: true, hotQuestions: 0, lotQuestions: 0 }
  assert.deepEqual(snapshotBlueprintRow(draft, row), draft)
})

test('only completed allocations contribute to all summary columns', async () => {
  const { isBlueprintRowAllocated } = await import('./blueprintRowState.js')
  const { summarizeQuestionTypeRows } = await import('./blueprintCalculations.js')
  const complete = { label: 'SAQs (Direct)', cognitionMode: 'both', perQuestionMarks: '5', totalMarks: '30', totalQuestions: 6, hotQuestions: 5, lotQuestions: 1, hotMarks: 25, lotMarks: 5, hasValidQuestionTotal: true }
  const pending = { ...complete, label: 'SAQs (Reasoning)', pendingAllocation: true }
  const laq = { ...complete, label: 'LAQs', usesLaqSplit: false }
  const rows = [complete, pending, laq, { label: 'MCQs', perQuestionMarks: '1' }]
  assert.deepEqual(summarizeQuestionTypeRows(rows.filter(isBlueprintRowAllocated)), { totalMarks: 30, totalQuestions: 6, hotQuestions: 5, lotQuestions: 1, hotMarks: 25, lotMarks: 5 })
})

test('exhausted cognition disables new modes while existing rows reclaim their own allocation', async () => {
  const { getBlueprintModeReasons } = await import('./blueprintRowState.js')
  const direct = { label: 'SAQs (Direct)', cognitionMode: 'lot', perQuestionMarks: '5', totalMarks: '20', hasValidQuestionTotal: true, hotMarks: 0, lotMarks: 20, hotQuestions: 0, lotQuestions: 4 }
  const mcq = { label: 'MCQs', perQuestionMarks: '1', totalMarks: '20', hasValidQuestionTotal: true, hotMarks: 15, lotMarks: 5, hotQuestions: 15, lotQuestions: 5 }
  const empty = { label: 'SAQs (Aetcom)' }
  const rows = [direct, mcq, empty]
  const target = { totalMarks: 100, hotMarks: 75 }
  assert.deepEqual(Object.keys(getBlueprintModeReasons(empty, rows, target)), ['lot', 'both'])
  assert.equal(getBlueprintModeReasons(direct, rows, target).lot, undefined)
  assert.equal(getBlueprintModeReasons(direct, rows, target).both, undefined)
  const largeUnit = { ...empty, perQuestionMarks: '100' }
  assert.ok(getBlueprintModeReasons(largeUnit, rows, target).hot)
  const full = { ...mcq, totalMarks: '100', hotQuestions: 75, lotQuestions: 25, hotMarks: 75, lotMarks: 25 }
  assert.equal(Object.keys(getBlueprintModeReasons(empty, [full, empty], target)).length, 3)
})
