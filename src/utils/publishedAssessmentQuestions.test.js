import test from 'node:test'
import assert from 'node:assert/strict'
import { getPublishedQuestionRows } from './publishedAssessmentQuestions.js'

test('published rows take precedence over legacy snapshots', () => {
  const rows = [{ id: 'published' }]
  assert.equal(getPublishedQuestionRows({ questionRows: rows, questions: [{ id: 'legacy' }] }), rows)
})

test('preview sections recover missing or empty rows in paper order', () => {
  const previewSections = [{ questions: [{ id: 'mcq' }] }, { questions: [{ id: 'saq' }] }]
  for (const questionRows of [undefined, []]) {
    assert.deepEqual(getPublishedQuestionRows({ questionRows, previewSections }), [{ id: 'mcq' }, { id: 'saq' }])
  }
})

test('legacy question fields are supported without inventing questions from counts', () => {
  const rows = [{ id: 'saved' }]
  for (const record of [{ questions: rows }, { selectedQuestions: rows }, { setup: { questionRows: rows } }]) {
    assert.equal(getPublishedQuestionRows(record), rows)
  }
  assert.deepEqual(getPublishedQuestionRows({ questionCount: 9, questionRows: 'invalid' }), [])
})

test('summary records recover only their own separately saved questions', () => {
  const rows = [{ id: 'own-question' }]
  const storage = { getItem: key => key === 'vx-create-assessment-questions:exam-one' ? JSON.stringify(rows) : null }
  assert.deepEqual(getPublishedQuestionRows({ id: 'exam-one', questionRows: [] }, storage), rows)
  assert.deepEqual(getPublishedQuestionRows({ id: 'exam-two', questionCount: 1 }, storage), [])
  assert.deepEqual(getPublishedQuestionRows({}, storage), [])
  assert.deepEqual(getPublishedQuestionRows({ id: 'exam-one' }, { getItem: () => '{' }), [])
})
