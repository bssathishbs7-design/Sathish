import test from 'node:test'
import assert from 'node:assert/strict'
import { captureAssessmentStorage, commitAssessmentStorage, upsertAssessmentDraft } from './assessmentDraftStorage.js'
const storageForTest = (values, failKey) => {
  const rows = new Map(Object.entries(values))
  return { getItem: key => rows.get(key) ?? null, removeItem: key => rows.delete(key),
    setItem: (key, value) => { if (key === failKey) throw new Error('Storage full'); rows.set(key, value) } }
}
test('failed draft save restores previous workspace without touching the existing draft', () => {
  const storage = storageForTest({ setup: 'saved setup', drafts: 'saved draft' }, 'drafts')
  assert.throws(() => commitAssessmentStorage({ setup: 'edited', questions: 'new', drafts: 'new draft' }, storage))
  assert.deepEqual(captureAssessmentStorage(['setup', 'questions', 'drafts'], storage), { setup: 'saved setup', questions: null, drafts: 'saved draft' })
})
test('discard restores saved values and removes new workspace keys', () => {
  const storage = storageForTest({ setup: 'edited', questions: 'new' })
  commitAssessmentStorage({ setup: 'original', questions: null }, storage)
  assert.deepEqual(captureAssessmentStorage(['setup', 'questions'], storage), { setup: 'original', questions: null })
})
test('same titles remain separate and repeated saves update only the matching identity', () => {
  const a = { id: 'a', assessmentName: 'Untitled Assessment', setup: { assessmentId: 'a' } }
  const b = { ...a, id: 'b', setup: { assessmentId: 'b' } }
  const rows = upsertAssessmentDraft([a], b)
  assert.equal(rows.length, 2)
  const updated = upsertAssessmentDraft(rows, { ...b, questionCount: 2 })
  assert.equal(updated.length, 2)
  assert.equal(updated[0].questionCount, 2)
  assert.deepEqual(updated[1], a)
})
test('legacy source draft is replaced when its internal identity is introduced', () => {
  const old = { id: 'title-slug', setup: {} }
  const next = { id: 'new', setup: { assessmentId: 'new' } }
  assert.deepEqual(upsertAssessmentDraft([old], next, 'title-slug'), [next])
})
