import test from 'node:test'
import assert from 'node:assert/strict'
import { logbookCompetencies } from './logbookCompetencies.js'
import catalogue from '../data/logbookDocumentCatalogue.json' with { type: 'json' }

test('subject competencies include manual catalogue codes across categories with unique codes and retained descriptions', () => {
  const result = logbookCompetencies('Human Anatomy')
  assert.ok(result.length)
  assert.equal(new Set(result.map(row => row.code)).size, result.length)
  assert.ok(result.every(row => row.code.startsWith('AN')))
  for (const row of catalogue.activities.filter(row => row.subject === 'Human Anatomy' && /^AN\d+\.\d+$/.test(row.code))) {
    assert.ok(result.find(option => option.code === row.code)?.name.includes(row.name.trim()), row.code)
  }
  assert.deepEqual(logbookCompetencies('Unknown subject'), [])
  assert.ok(logbookCompetencies('Biochemistry').some(row => row.code.startsWith('BC')))
})
