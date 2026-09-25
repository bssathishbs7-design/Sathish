import test from 'node:test'
import assert from 'node:assert/strict'
import { getLaqSplitBreakdowns } from './blueprintLaqBreakdown.js'

test('traces unique LAQ parts and preserves their question and part numbers', () => {
  const parts = [{ question: 1, part: 2, marks: 2 }, { question: 2, part: 1, marks: 3 }]
  assert.deepEqual(getLaqSplitBreakdowns({ parts, cells: [{ key: 'a', count: 1, marks: 2 }, { key: 'b', count: 1, marks: 3 }] }), { a: [parts[0]], b: [parts[1]] })
})
test('does not invent identities for equal-mark parts assigned to different cells', () => {
  const parts = [{ question: 1, part: 1, marks: 2 }, { question: 2, part: 2, marks: 2 }]
  assert.deepEqual(getLaqSplitBreakdowns({ parts, cells: [{ key: 'a', count: 1, marks: 2 }, { key: 'b', count: 1, marks: 2 }] }), { a: null, b: null })
  assert.deepEqual(getLaqSplitBreakdowns({ parts, cells: [{ key: 'a', count: 2, marks: 4 }] }), { a: parts })
})
test('detects alternative mixed-mark combinations and invalid drafts', () => {
  const parts = [1, 2, 3, 4].map((marks, index) => ({ question: 1, part: index + 1, marks }))
  assert.deepEqual(getLaqSplitBreakdowns({ parts, cells: [{ key: 'a', count: 2, marks: 5 }] }), { a: null })
  assert.equal(getLaqSplitBreakdowns({ parts, cells: [{ key: 'a', count: 1, marks: 9 }] }), null)
})
test('supports decimal marks and empty cells', () => {
  const parts = [{ question: 1, part: 1, marks: 1.1 }, { question: 1, part: 2, marks: 2.2 }]
  assert.deepEqual(getLaqSplitBreakdowns({ parts, cells: [{ key: 'a', count: 2, marks: 3.3 }, { key: 'b', count: 0, marks: 0 }] }), { a: parts, b: [] })
})
