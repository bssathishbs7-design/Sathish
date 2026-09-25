import test from 'node:test'
import assert from 'node:assert/strict'
import { redistributeLaqLevels } from './blueprintEditing.js'

test('editing LAQ summary counts preserves marks and changes only necessary classifications', () => {
  const source = [{ splitCount: '3', splits: [{ marks: '2', level: 'lot' }, { marks: '4', level: 'hot' }, { marks: '4', level: 'lot' }] }]
  const result = redistributeLaqLevels(source, 'hot', 2)
  assert.deepEqual(result[0].splits.map(part => part.marks), ['2', '4', '4'])
  assert.deepEqual(result[0].splits.map(part => part.level), ['hot', 'hot', 'lot'])
  assert.equal(source[0].splits[0].level, 'lot')
  assert.equal(redistributeLaqLevels(source, 'lot', 0)[0].splits.filter(part => part.level === 'hot').length, 3)
})

test('LAQ summary count clamps to active parts across questions', () => {
  const source = [{ splitCount: '1', splits: [{ marks: '10', level: 'lot' }] }, { splitCount: '1', splits: [{ marks: '10', level: 'hot' }] }]
  assert.ok(redistributeLaqLevels(source, 'lot', 99).every(question => question.splits[0].level === 'lot'))
})

