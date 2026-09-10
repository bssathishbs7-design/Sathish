import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeNewPracticeSessions } from './practiceShareSync.js'

test('sharing adds new sessions while retaining current answers and score history', () => {
  const existing = { id: 'one', practiceAnswers: { q: 'draft' }, practiceAttemptHistory: [{ obtained: 5 }] }
  const current = { id: 'card', practiceSessions: [existing] }
  const incoming = { id: 'card', practiceSessions: [{ id: 'one', practiceAnswers: {} }, { id: 'two' }] }
  const next = mergeNewPracticeSessions(current, incoming)
  assert.equal(next.practiceSessions.length, 2)
  assert.equal(next.practiceSessions[0], existing)
  assert.equal(mergeNewPracticeSessions(next, incoming), next)
})

test('duplicate events and duplicate session IDs do not add duplicate practices', () => {
  const current = { id: 'card', practiceSessions: [] }
  const incoming = { id: 'card', practiceSessions: [{ id: 'one' }, { id: 'one' }] }
  assert.equal(mergeNewPracticeSessions(current, incoming).practiceSessions.length, 1)
})

test('unrelated competency updates leave the selected practice unchanged', () => {
  const current = { id: 'card', competencyCode: 'AN1.1', practiceSessions: [] }
  assert.equal(mergeNewPracticeSessions(current, { id: 'other', competencyCode: 'RD7.5', practiceSessions: [{ id: 'one' }] }), current)
})
