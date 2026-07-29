import test from 'node:test'
import assert from 'node:assert/strict'
import {
  autoFillBlueprintAllocations,
  greatestCommonDivisorOf,
  rebalanceCompetencyTargets,
  reshuffleBlueprintAllocations,
} from './blueprintAllocation.js'

test('calculates the greatest common divisor across active denominations', () => {
  assert.equal(greatestCommonDivisorOf([10, 5, 15, 5]), 5)
  assert.equal(greatestCommonDivisorOf([10, 5, 1]), 1)
})

test('rebalances invalid targets with a zero-sum minimal denomination adjustment', () => {
  const targetMarks = [10, 10, 7, 7, 3, 7, 3, 3]
  const result = rebalanceCompetencyTargets({
    rows: targetMarks.map((marks, index) => ({
      key: `row-${index}`,
      targetMarks: marks,
      fractionalIntent: index / 10,
    })),
    denominations: [5, 10],
    totalMarks: 50,
  })

  assert.equal(result.error, '')
  assert.equal(result.gcd, 5)
  assert.equal(
    result.rows.reduce((total, row) => total + row.targetMarks, 0),
    50,
  )
  assert.ok(result.rows.every((row) => row.targetMarks % 5 === 0))
  assert.equal(
    result.rows.reduce((total, row) => total + row.rebalanceDelta, 0),
    0,
  )
  assert.ok(result.rows.some((row) => row.isRebalanced))
})

test('skips rebalance when a one-mark denomination makes every integer target solvable', () => {
  const result = rebalanceCompetencyTargets({
    rows: [
      { key: 'a', targetMarks: 7 },
      { key: 'b', targetMarks: 3 },
    ],
    denominations: [1, 5, 10],
    totalMarks: 10,
  })

  assert.equal(result.gcd, 1)
  assert.deepEqual(result.rows.map((row) => row.targetMarks), [7, 3])
  assert.ok(result.rows.every((row) => !row.isRebalanced))
})

test('allocates coupled questions first and completes all row and column totals', () => {
  const rows = [
    { key: 'a', code: 'A', targetMarks: 10 },
    { key: 'b', code: 'B', targetMarks: 10 },
  ]
  const columns = [
    { key: 'laqLot', label: 'LAQ LoT', weight: 5, targetQuestionCount: 1 },
    { key: 'laqHot', label: 'LAQ HoT', weight: 5, targetQuestionCount: 1 },
    { key: 'mcqLot', label: 'MCQ LoT', weight: 1, targetQuestionCount: 5 },
    { key: 'mcqHot', label: 'MCQ HoT', weight: 1, targetQuestionCount: 5 },
  ]
  const result = autoFillBlueprintAllocations({
    rows,
    columns,
    coupledGroups: [{
      key: 'laq',
      label: 'LAQ',
      columnKeys: ['laqLot', 'laqHot'],
    }],
  })

  assert.equal(result.error, '')
  assert.deepEqual(result.remainingMarks, { a: 0, b: 0 })
  assert.deepEqual(result.remainingQuestions, {
    laqLot: 0,
    laqHot: 0,
    mcqLot: 0,
    mcqHot: 0,
  })
  const coupledRow = rows.find((row) => result.allocations[row.key].laqLot === 1)
  assert.equal(result.allocations[coupledRow.key].laqHot, 1)
})

test('uses the exact fallback when round-robin reaches a remainder trap', () => {
  const result = autoFillBlueprintAllocations({
    rows: [
      { key: 'six', code: 'SIX', targetMarks: 6 },
      { key: 'four', code: 'FOUR', targetMarks: 4 },
    ],
    columns: [
      { key: 'large', label: 'Large', weight: 4, targetQuestionCount: 1 },
      { key: 'small', label: 'Small', weight: 3, targetQuestionCount: 2 },
    ],
  })

  assert.equal(result.error, '')
  assert.equal(result.allocations.four.large, 1)
  assert.equal(result.allocations.six.small, 2)
})

test('reshuffle preserves every row mark total and column question count', () => {
  const rows = [{ key: 'a' }, { key: 'b' }]
  const columns = [
    { key: 'lot', weight: 1 },
    { key: 'hot', weight: 1 },
  ]
  const allocations = {
    a: { lot: 1, hot: 0 },
    b: { lot: 0, hot: 1 },
  }
  const result = reshuffleBlueprintAllocations({
    allocations,
    rows,
    columns,
    seed: 3,
    cyclesPerTier: 1,
  })

  assert.equal(result.successfulCycles, 1)
  assert.equal(result.allocations.a.lot + result.allocations.a.hot, 1)
  assert.equal(result.allocations.b.lot + result.allocations.b.hot, 1)
  assert.equal(result.allocations.a.lot + result.allocations.b.lot, 1)
  assert.equal(result.allocations.a.hot + result.allocations.b.hot, 1)
  assert.ok(result.changedCells.length > 0)
})
