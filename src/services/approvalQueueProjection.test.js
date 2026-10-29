import test from 'node:test'
import assert from 'node:assert/strict'
import { queueItems, requestStatus, markRequestsSeen, isNewRequest, questionReviewSummary, queueInsights, sortQueueItems, returnDays } from './approvalQueue.js'
import { findQuestionDuplicates } from './approvalDuplicates.js'
import { returnOverdueQuestions, saveAutomaticReturns } from './approvalReturns.js'
const user = { role: 'Admin', id: 'reviewer' }
const batch = { id: 'batch', activityType: 'Question Bank', sentAt: '2026-10-01T12:00:00Z', approvalStatus: 'Pending Approval', questionRows: [
  { id: 'a', draftRef: 'DRF-A', questionText: 'Which muscle controls flexion of the elbow joint?' },
  { id: 'b', draftRef: 'DRF-B', questionText: 'Which muscle controls flexion of the elbow joint?' },
  { id: 'c', status: 'Withdrawn' },
] }
test('mixed decisions project into independent tabs and retain the original submission', () => {
  const source = { ...batch, approvalStatus: 'Approval Rejected', questionRows: [
    { ...batch.questionRows[0], reviewStatus: 'Approved' }, { ...batch.questionRows[1], reviewStatus: 'Rejected' }, batch.questionRows[2],
  ] }
  const items = queueItems([source])
  assert.deepEqual(items.map(requestStatus), ['Approved', 'Returned', 'Withdrawn'])
  assert.equal(items[0].sourceRequest, source)
  assert.equal(questionReviewSummary(source.questionRows).approved, 1)
})
test('marking one question seen does not clear sibling questions or future revisions', () => {
  const items = queueItems([batch])
  const rows = markRequestsSeen([batch], [items[0].itemKey], user)
  assert.deepEqual(queueItems(rows).map(row => isNewRequest(row, user)), [false, true, false])
  assert.equal(isNewRequest(queueItems([{ ...rows[0], sentAt: '2026-10-02' }])[0], user), true)
})
test('decided ordering is newest first and insights use median instead of mean', () => {
  const rows = [1, 2, 12].map((days, i) => ({ id: String(i), activityType: 'Assessment', sentAt: batch.sentAt, reviewedAt: new Date(Date.parse(batch.sentAt) + days * 86400000).toISOString(), approvalStatus: 'Approved' }))
  assert.equal(queueInsights(rows, Date.parse('2026-10-20')).days, 2)
  assert.deepEqual(sortQueueItems(rows, 'Approved').map(row => row.id), ['2', '1', '0'])
})
test('duplicate detection searches pending peers and bank but excludes self, original and lifecycle actions', () => {
  assert.equal(findQuestionDuplicates([batch]).get('batch:question:a').id, 'DRF-B')
  const single = { ...batch, questionRows: [batch.questionRows[0]] }
  assert.equal(findQuestionDuplicates([single]).size, 0)
  const bank = [{ id: 'bank', qid: 'SRMC-QB-1', questionText: batch.questionRows[0].questionText }]
  assert.equal(findQuestionDuplicates([single], bank).get('batch:question:a').score, 1)
  assert.equal(findQuestionDuplicates([{ ...single, questionRows: [{ ...single.questionRows[0], replaceQuestionId: 'bank' }] }], bank).size, 0)
  assert.equal(findQuestionDuplicates([{ ...single, questionRows: [{ ...single.questionRows[0], changeKind: 'delete' }] }], bank).size, 0)
  assert.equal(findQuestionDuplicates([single], [{ ...bank[0], qid: 'MED-QB-1' }]).size, 0)
})
test('14-day return preserves withdrawn and decided questions, returns drafts once, and never returns assessments', () => {
  const rows = [{ ...batch, questionRows: [{ ...batch.questionRows[0], reviewStatus: 'Approved' }, ...batch.questionRows.slice(1)] }, { id: 'assessment', activityType: 'Assessment', sentAt: batch.sentAt }]
  assert.equal(returnDays(queueItems([batch])[0], Date.parse('2026-10-12T12:00:00Z')), 3)
  assert.equal(returnOverdueQuestions(rows, Date.parse('2026-10-15T11:59:59Z')).results.length, 0)
  const result = returnOverdueQuestions(rows, Date.parse('2026-10-15T12:00:00Z'))
  assert.deepEqual(result.results.map(row => [row.questionId, row.status]), [['b', 'Draft']])
  assert.deepEqual(queueItems(result.rows).map(requestStatus), ['Approved', 'Returned', 'Withdrawn', 'Requests'])
  assert.equal(returnOverdueQuestions(result.rows, Date.parse('2026-10-20')).rows, result.rows)
  let saved = '[]'
  const storage = { getItem: () => saved, setItem: (_, value) => { saved = value } }
  saveAutomaticReturns(result.results, storage)
  saveAutomaticReturns(result.results, storage)
  assert.equal(JSON.parse(saved).length, 1)
})
