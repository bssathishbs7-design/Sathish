import test from 'node:test'
import assert from 'node:assert/strict'
import { getPaperTopics, getPaperExamDate } from './assessmentPaperMetadata.js'

test('topics include question and subquestion metadata once, in paper order', () => {
  assert.deepEqual(getPaperTopics([
    { topics: ['Heart', '  Lung  anatomy '], topic: 'heart', descriptiveSections: [{ topics: ['Imaging'], children: [{ topic: 'Lung anatomy' }] }] },
    { topic: 'Clinical examination' },
  ]), ['Heart', 'Lung anatomy', 'Imaging', 'Clinical examination'])
  assert.deepEqual(getPaperTopics([{}]), [])
})

test('scheduled dates retain the calendar day and use DD-MM-YYYY', () => {
  assert.equal(getPaperExamDate({ startDate: '2026-11-17', setup: { examDate: '2026-11-18' } }), '17-11-2026')
  assert.equal(getPaperExamDate({ setup: { examDate: '7/1/2027' } }), '07-01-2027')
  assert.equal(getPaperExamDate({ setup: { supervisionType: 'Practice Exam', practiceStartDate: '2026-11-20' } }), '20-11-2026')
  assert.equal(getPaperExamDate({}), 'Not specified')
})
