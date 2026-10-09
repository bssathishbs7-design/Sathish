import test from 'node:test'
import assert from 'node:assert/strict'
import { getSaqCognitionMode } from './saqCognition.js'

test('new SAQ rows have no selected thinking level', () => {
  for (const type of ['Direct', 'Reasoning', 'Aetcom', 'Application']) {
    assert.equal(getSaqCognitionMode(`SAQs (${type})`, {}), null)
  }
})
test('explicit selections persist even in empty rows', () => {
  for (const cognitionMode of ['lot', 'hot', 'both']) {
    assert.equal(getSaqCognitionMode('SAQs (Direct)', { cognitionMode }), cognitionMode)
  }
})
test('populated legacy drafts retain their historical classification', () => {
  assert.equal(getSaqCognitionMode('SAQs (Direct)', { perQuestionMarks: '5', totalMarks: '15' }), 'lot')
  assert.equal(getSaqCognitionMode('SAQs (Reasoning)', { perQuestionMarks: '5', totalMarks: '15' }), 'hot')
  assert.equal(getSaqCognitionMode('MCQs', {}), null)
})
