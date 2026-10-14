import test from 'node:test'
import assert from 'node:assert/strict'
import { fillAroundManualCells } from './blueprintLockedAllocation.js'

const setup = () => ({
  rows: [{ key: 'a', targetMarks: 10 }, { key: 'b', targetMarks: 10 }],
  unitsByField: { saqHot: [{ id: 'D1', marks: 5 }, { id: 'R1', marks: 5 }], laqLot: [{ id: '1a', marks: 5 }, { id: '1b', marks: 5 }] },
  assignments: { saqHot: { R1: 'a' }, laqLot: { '1b': 'b' } },
  manual: { a: { saqHot: true }, b: { laqLot: true } },
})
test('AutoFill preserves manual counts and exact categories/parts without adding to locked cells', () => {
  const input = setup(), before = structuredClone(input)
  const result = fillAroundManualCells(input)
  assert.equal(result.error, undefined)
  assert.equal(result.assignments.saqHot.R1, 'a')
  assert.equal(result.assignments.laqLot['1b'], 'b')
  assert.equal(result.counts.a.saqHot, '1')
  assert.equal(result.counts.b.laqLot, '1')
  assert.equal(result.assignments.saqHot.D1, 'b')
  assert.equal(result.assignments.laqLot['1a'], 'a')
  assert.deepEqual(input, before)
})
test('repeated fill/reshuffle preserves manual identities', () => {
  for (let seed = 0; seed < 5; seed++) {
    const input = setup()
    const result = fillAroundManualCells({ ...input, seed })
    assert.equal(result.assignments.saqHot.R1, 'a')
    assert.equal(result.assignments.laqLot['1b'], 'b')
  }
})
test('an impossible full allocation still fills available fields without mutating the input', () => {
  const input = setup()
  input.manual.a.laqLot = true
  const before = structuredClone(input)
  const result = fillAroundManualCells(input)
  assert.equal(result.error, undefined)
  assert.equal(result.complete, false)
  assert.equal(result.assignments.saqHot.D1, 'b')
  assert.equal(result.assignments.saqHot.R1, 'a')
  assert.equal(result.assignments.laqLot['1b'], 'b')
  assert.equal(result.unallocated.length, 1)
  assert.equal(result.remainingMarks, 5)
  assert.deepEqual(input, before)
})

test('10-mark LAQs that cannot fit do not block smaller MCQs from filling six-mark targets', () => {
  const input = {
    rows: ['a', 'b', 'c'].map(key => ({ key, targetMarks: 6 })),
    unitsByField: { saqHot: [{ id: 'manual', marks: 5 }], laqHot: [{ id: '1a', marks: 10 }], mcqLot: [0, 1, 2].map(id => ({ id: String(id), marks: 1 })) },
    assignments: { saqHot: { manual: 'a' }, laqHot: {}, mcqLot: {} },
    manual: { a: { saqHot: true } },
  }
  const result = fillAroundManualCells(input)
  assert.equal(result.assignments.saqHot.manual, 'a')
  assert.equal(Object.keys(result.assignments.mcqLot).length, 3)
  assert.equal(result.remainingMarks, 10)
  assert.deepEqual(result.unallocated.map(unit => unit.id), ['1a'])
  const repeated = fillAroundManualCells({ ...input, assignments: result.assignments, seed: 1 })
  assert.equal(repeated.remainingMarks, 10)
  for (const row of input.rows) assert.ok(Object.values(repeated.marks[row.key]).reduce((a, b) => a + b, 0) <= row.targetMarks)
})

test('invalid manual totals still fail safely', () => {
  const input = setup()
  input.rows[0].targetMarks = 4
  assert.ok(fillAroundManualCells(input).error)
})
test('mixed and decimal marks remain exact', () => {
  const result = fillAroundManualCells({ rows: [{ key: 'a', targetMarks: 3.5 }, { key: 'b', targetMarks: 2 }],
    unitsByField: { laqLot: [{ id: '1a', marks: 3.5 }, { id: '1b', marks: 2 }] },
    assignments: { laqLot: { '1a': 'a' } }, manual: { a: { laqLot: true } },
  })
  assert.equal(result.marks.a.laqLot, 3.5)
  assert.equal(result.marks.b.laqLot, 2)
})
test('cleared manual cells can receive new allocations', () => {
  const input = setup()
  input.manual = {}
  const result = fillAroundManualCells(input)
  assert.equal(result.error, undefined)
  assert.equal(Object.values(result.marks.a).reduce((a, b) => a + b), 10)
})
