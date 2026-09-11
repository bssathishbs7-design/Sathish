import test from 'node:test'
import assert from 'node:assert/strict'
import { allocateCategoryBreakdown } from './blueprintCategoryBreakdown.js'

test('shows only the categories assigned to the cell and preserves column totals', () => {
  const units = ['Aetcom', 'Application', 'Direct', 'Reasoning'].map((category) => ({ category, marks: 5 }))
  const result = allocateCategoryBreakdown({ units, cells: [
    { key: 'a', count: 2, marks: 10 }, { key: 'b', count: 2, marks: 10 },
  ] })
  assert.deepEqual(result.a, [{ category: 'Aetcom', count: 1 }, { category: 'Application', count: 1 }])
  assert.deepEqual(result.b, [{ category: 'Direct', count: 1 }, { category: 'Reasoning', count: 1 }])
})

test('matches mixed marks across cells, backtracking when a later cell requires a denomination', () => {
  const result = allocateCategoryBreakdown({
    units: [
      { category: 'Direct', marks: 4 }, { category: 'Reasoning', marks: 2 },
      { category: 'Application', marks: 3 }, { category: 'Application', marks: 3 },
    ],
    cells: [{ key: 'a', count: 2, marks: 6 }, { key: 'b', count: 1, marks: 4 }],
  })
  assert.deepEqual(result.a, [{ category: 'Application', count: 2 }])
  assert.deepEqual(result.b, [{ category: 'Direct', count: 1 }])
})

test('recalculates changed cell counts and supports empty or partially allocated columns', () => {
  const units = [{ category: 'Aetcom', marks: 5 }, { category: 'Application', marks: 5 }]
  assert.deepEqual(allocateCategoryBreakdown({ units, cells: [
    { key: 'a', count: 0, marks: 0 }, { key: 'b', count: 1, marks: 5 },
  ] }), { a: [], b: [{ category: 'Aetcom', count: 1 }] })
  assert.deepEqual(allocateCategoryBreakdown({ units: [], cells: [{ key: 'a', count: 0, marks: 0 }] }), { a: [] })
})

test('rejects inconsistent counts or marks instead of inventing a breakdown', () => {
  const units = [{ category: 'Direct', marks: 5 }]
  for (const cell of [{ count: 2, marks: 10 }, { count: 1, marks: 4 }]) {
    assert.equal(allocateCategoryBreakdown({ units, cells: [{ key: 'a', ...cell }] }), null)
  }
})
