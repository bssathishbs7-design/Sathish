import test from 'node:test'
import assert from 'node:assert/strict'
import { detachBankQuestion, publishAssessmentQuestions } from './questionLifecycle.js'
import { questionContentChanged } from './questionContent.js'

const memory = () => { const rows = new Map(); return { getItem: key => rows.get(key) ?? null, setItem: (key,value) => rows.set(key,value) } }
test('bank snapshots stay bank questions until edited, then acquire an independent AQ identity', () => {
  const bank = { id: 'q1', questionBankId: 'MED-QB-0000013', originalQuestionId: 'bank1', questionText: 'Original question' }
  const storage = memory()
  assert.deepEqual(publishAssessmentQuestions([bank], storage), [bank])
  const edited = detachBankQuestion({ ...bank, questionText: 'Changed question' })
  assert.equal(edited.derivedFrom, bank.questionBankId)
  assert.match(edited.draftCode, /^DRF-AQ-/)
  assert.equal(edited.questionBankId, undefined)
  const [published] = publishAssessmentQuestions([edited], storage)
  assert.equal(published.assessmentQuestionId, 'SRMC-AQ-0000013')
  assert.deepEqual(publishAssessmentQuestions([published], storage), [published])
  assert.equal(bank.questionText, 'Original question')
})
test('snapshot comparison ignores metadata but detects answers, images and educational content', () => {
  const original = { questionText: '<p>Which answer?</p>', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOptionIds: ['a'] }
  assert.equal(questionContentChanged(original, { ...original, questionText: 'Which answer?', updatedAt: 'today', version: 2 }), false)
  assert.equal(questionContentChanged(original, { ...original, correctOptionIds: ['b'] }), true)
  assert.equal(questionContentChanged({ questionText: '<img src="one.png">' }, { questionText: '<img src="two.png">' }), true)
})
