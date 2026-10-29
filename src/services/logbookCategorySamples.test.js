import test from 'node:test'
import assert from 'node:assert/strict'
import { CATEGORY_SAMPLE_ENTRIES } from './logbookCategorySamples.js'
import { CATEGORIES, SUBJECTS } from './logbookCatalog.js'
import { LEARNERS } from './logbookPeople.js'
import { applyDeltas, validateEntry } from './logbook.js'

test('category examples cover every non-Skills category for all three demo students', () => {
  assert.equal(new Set(CATEGORY_SAMPLE_ENTRIES.map(row => row.id)).size, CATEGORY_SAMPLE_ENTRIES.length)
  for (const category of CATEGORIES.filter(row => !['skill', 'cert'].includes(row.id))) {
    const rows = CATEGORY_SAMPLE_ENTRIES.filter(row => row.cat === category.id)
    assert.deepEqual(rows.map(row => row.studentId), LEARNERS.map(row => row.id))
    for (const row of rows) {
      assert.ok(row.demo && row.extra.notes.includes('Sample data only'))
      assert.ok(SUBJECTS.find(subject => subject.name === row.subject).categories.includes(row.cat))
      assert.deepEqual(validateEntry({ ...row, fAck: true }, true, '2026-10-29'), {}, row.cat)
    }
  }
})

test('sample records are present without storage and persisted changes and removals win', () => {
  const sample = CATEGORY_SAMPLE_ENTRIES[0]
  const empty = { added: [], edits: {}, removed: [] }
  assert.ok(applyDeltas(empty).some(row => row.id === sample.id))
  const edits = { [sample.id]: { extra: { notes: 'Updated note' } } }
  assert.equal(applyDeltas({ ...empty, edits }).find(row => row.id === sample.id).extra.notes, 'Updated note')
  assert.ok(!applyDeltas({ ...empty, removed: [sample.id] }).some(row => row.id === sample.id))
})
