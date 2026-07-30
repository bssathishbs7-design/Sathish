import test from 'node:test'
import assert from 'node:assert/strict'
import {
  assignInstituteQuestionBankIds,
  getInstituteQuestionBankId,
} from './questionBankIdentity.js'

test('starts institute question IDs at INS-A01-00001', () => {
  const [question] = assignInstituteQuestionBankIds([{ id: 'question-1' }])

  assert.equal(question.questionBankId, 'INS-A01-00001')
  assert.equal(question.isInstituteQuestion, true)
})

test('continues after the highest stored institute ID', () => {
  const questions = assignInstituteQuestionBankIds(
    [{ id: 'question-2' }, { id: 'question-3' }],
    [
      { questionBankId: 'INS-A01-00004' },
      { questionBankId: 'MED-A01-99999' },
    ],
  )

  assert.deepEqual(
    questions.map((question) => question.questionBankId),
    ['INS-A01-00005', 'INS-A01-00006'],
  )
})

test('preserves an existing institute ID when a question is resent', () => {
  const [question] = assignInstituteQuestionBankIds([
    { id: 'question-1', questionBankId: 'INS-A01-00012' },
  ])

  assert.equal(question.questionBankId, 'INS-A01-00012')
  assert.equal(getInstituteQuestionBankId(question), 'INS-A01-00012')
})
