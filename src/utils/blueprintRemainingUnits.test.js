import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveBlueprintUnits, suggestBlueprintCompetency, changeBlueprintUnitCount } from './blueprintRemainingUnits.js'

const units = [{ id: '1a', marks: 5 }, { id: '1b', marks: 5 }, { id: '2a', marks: 3 }]
test('retains an explicitly selected same-mark part across save and reload', () => {
  const saved = JSON.parse(JSON.stringify({ '1b': 'BC1' }))
  assert.deepEqual(resolveBlueprintUnits({ units, saved, cells: [{ key: 'BC1', count: 1, marks: 5 }] }), { '1b': 'BC1' })
})
test('resolves legacy partial counts without assigning a unit twice', () => {
  const result = resolveBlueprintUnits({ units, cells: [{ key: 'a', count: 1, marks: 5 }, { key: 'b', count: 1, marks: 3 }] })
  assert.equal(Object.keys(result).length, 2)
  assert.equal(result['2a'], 'b')
  assert.equal(Object.values(result).filter(value => value === 'a').length, 1)
})
test('clearing counts returns previously added units to the available pool', () => {
  assert.deepEqual(resolveBlueprintUnits({ units, saved: { '1b': 'a' }, cells: [{ key: 'a', count: 0, marks: 0 }] }), {})
})
test('rejects impossible totals and invalid input', () => {
  for (const cell of [{ key: 'a', count: 2, marks: 4 }, { key: 'a', count: -1, marks: 5 }]) {
    assert.equal(resolveBlueprintUnits({ units, cells: [cell] }), null)
  }
})
test('suggestion fits remaining capacity, and never offers a full or overloaded competency', () => {
  const rows = [{ key: 'a', targetMarks: 10, actual: 11 }, { key: 'b', targetMarks: 10, actual: 5 }, { key: 'c', targetMarks: 10, actual: 0 }]
  assert.equal(suggestBlueprintCompetency(rows, 5).key, 'b')
  assert.equal(suggestBlueprintCompetency(rows, 11), null)
})

test('manual increase preserves other competencies and chooses units within capacity', () => {
  const assignments = { '1b': 'other' }
  const result = changeBlueprintUnitCount({ units, assignments, rowKey: 'active', count: 1, capacity: 3 })
  assert.deepEqual(result.assignments, { '1b': 'other', '2a': 'active' })
  assert.equal(result.marks, 3)
  assert.deepEqual(assignments, { '1b': 'other' })
})
test('manual entry refuses unavailable counts, over-capacity counts and fractions', () => {
  for (const [count, capacity] of [[3, 100], [2, 7], [1.5, 100]]) {
    const result = changeBlueprintUnitCount({ units, assignments: { '1b': 'other' }, rowKey: 'active', count, capacity })
    assert.ok(result.error)
    assert.equal(result.assignments, undefined)
  }
})
test('manual reduction releases exact units and preserves the other competency', () => {
  const result = changeBlueprintUnitCount({ units, assignments: { '1a': 'active', '1b': 'other', '2a': 'active' }, rowKey: 'active', count: 1, capacity: 10 })
  assert.deepEqual(result.assignments, { '1b': 'other', '1a': 'active' })
  assert.equal(result.marks, 5)
})
