import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareAssessmentResult, reconcileAssessmentResults, automatedEvaluationKey } from './assessmentResultRelease.js'

const submittedAt = '2026-10-16T10:00:00.000Z'
const start = Date.parse(submittedAt)
const question = { id: 'q1', type: 'MCQ', marks: 2, options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOptionIds: ['a'] }
const assessment = { id: 'exam', setup: { examDeliveryMode: 'Online', supervisionType: 'Practice Exam', mcqDisplayType: 'Answer Input', mcqAutoPublish: 'On' }, questionRows: [question] }
const attempt = { isAssessmentSubmitted: true, submittedAt, answers: { q1: 0 }, descriptiveAnswers: { '["descriptive","d1"]': 'Written response' }, appliedResetVersion: 0 }
const storage = entries => { const data = new Map(Object.entries(entries)); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) } }

test('real MCQ key scores immediately but releases only at two minutes', () => {
  const early = prepareAssessmentResult(assessment, attempt, {}, {}, start + 119999)
  assert.equal(early.result.marks, 2)
  assert.equal(early.result.status, 'evaluated')
  assert.equal(prepareAssessmentResult(assessment, attempt, early.result, early.evaluation, start + 120000).result.status, 'published')
})
test('unanswered and incorrect MCQs score zero; missing answer keys remain pending', () => {
  assert.equal(prepareAssessmentResult(assessment, { ...attempt, answers: {} }, {}, {}, start).evaluation.q1.status, 'not-attempted')
  assert.equal(prepareAssessmentResult(assessment, { ...attempt, answers: { q1: 1 } }, {}, {}, start).result.marks, 0)
  assert.equal(prepareAssessmentResult({ ...assessment, questionRows: [{ ...question, correctOptionIds: [] }] }, attempt, {}, {}, start + 200000).result.status, 'evaluating')
})
test('manual publishing, offline and read-only never auto release', () => {
  for (const patch of [{ mcqAutoPublish: 'Off' }, { examDeliveryMode: 'Offline' }, { mcqDisplayType: 'Read-Only' }]) {
    const value = prepareAssessmentResult({ ...assessment, setup: { ...assessment.setup, ...patch } }, attempt, {}, {}, start + 200000)
    assert.equal(value.result.autoPublish, false)
    assert.notEqual(value.result.status, 'published')
  }
})
test('hybrid waits for real descriptive marks and rejects invalid marks', () => {
  const hybrid = { ...assessment, setup: { ...assessment.setup, descriptiveDisplayType: 'Answer Input', descriptiveAutoEvaluation: 'Yes', descriptiveAutoPublish: 'On' }, questionRows: [question, { id: 'd1', type: 'Descriptive Question', marks: 5 }] }
  const key = JSON.stringify(['descriptive', 'd1'])
  assert.equal(prepareAssessmentResult(hybrid, attempt, {}, {}, start + 200000).result.status, 'evaluating')
  assert.equal(prepareAssessmentResult(hybrid, attempt, {}, { [key]: { status: 'evaluated', marks: 6 } }, start + 200000).result.status, 'evaluating')
  const graded = prepareAssessmentResult(hybrid, attempt, {}, { [key]: { status: 'evaluated', marks: 4 } }, start + 200000)
  assert.equal(graded.result.status, 'published')
  assert.equal(graded.result.marks, 6)
})
test('draft submissions cannot produce results', () => {
  assert.equal(prepareAssessmentResult(assessment, { ...attempt, isAssessmentSubmitted: false }), null)
})
test('refresh does not reset countdown or republish; results stay student-specific', () => {
  const store = storage({ 'vx-assessment-published': JSON.stringify([{ ...assessment, students: [{ id: 'one' }, { id: 'two' }] }]), 'vx-online-practice-exam-attempts': JSON.stringify({ exam: { one: attempt } }) })
  reconcileAssessmentResults(store, start)
  const first = JSON.parse(store.getItem('vx-assessment-published'))[0]
  reconcileAssessmentResults(store, start + 200000)
  const published = JSON.parse(store.getItem('vx-assessment-published'))[0]
  assert.equal(published.studentResults.one.releaseAt, first.studentResults.one.releaseAt)
  assert.equal(published.studentResults.one.status, 'published')
  assert.equal(published.studentResults.two, undefined)
  assert.notEqual(published.resultStatus, 'Published')
  assert.equal(reconcileAssessmentResults(store, start + 210000), false)
  assert.equal(JSON.parse(store.getItem(automatedEvaluationKey(assessment, 'one', attempt))).q1.marks, 2)
})
test('reopened attempt has a new countdown and cannot inherit publication', () => {
  const previous = prepareAssessmentResult(assessment, attempt, {}, {}, start + 200000).result
  const reopened = { ...attempt, submittedAt: new Date(start + 300000).toISOString(), appliedResetVersion: 1 }
  assert.equal(prepareAssessmentResult(assessment, reopened, previous, {}, start + 300000).result.status, 'evaluated')
})
test('failed persistence is reported instead of claiming publication', () => {
  const store = storage({ 'vx-assessment-published': JSON.stringify([assessment]), 'vx-online-practice-exam-attempts': JSON.stringify({ exam: { one: attempt } }) })
  store.setItem = () => { throw new Error('Quota exceeded') }
  assert.throws(() => reconcileAssessmentResults(store, start + 200000), /Quota exceeded/)
})

test('resetting an attempt removes its released result and cohort publication', () => {
  const store = storage({ 'vx-assessment-published': JSON.stringify([{ ...assessment, students: [{ id: 'one' }] }]), 'vx-online-practice-exam-attempts': JSON.stringify({ exam: { one: attempt } }) })
  reconcileAssessmentResults(store, start + 200000)
  assert.equal(JSON.parse(store.getItem('vx-assessment-published'))[0].resultStatus, 'Published')
  store.setItem('vx-online-practice-exam-attempts', JSON.stringify({ exam: { one: { isAssessmentSubmitted: false, appliedResetVersion: 1 } } }))
  reconcileAssessmentResults(store, start + 210000)
  const reset = JSON.parse(store.getItem('vx-assessment-published'))[0]
  assert.equal(reset.studentResults.one, undefined)
  assert.equal(reset.resultStatus, 'Pending')
})

test('MCQ manual reset and corrected marks survive automatic reconciliation', () => {
  const reset = { status: 'pending', marks: '', autoEvaluated: false, manualOverride: true }
  const pending = prepareAssessmentResult(assessment, attempt, {}, { q1: reset }, start + 200000)
  assert.deepEqual(pending.evaluation.q1, reset)
  assert.equal(pending.result.status, 'evaluating')
  const edited = { status: 'wrong', marks: 0, manualOverride: true }
  const saved = prepareAssessmentResult(assessment, attempt, pending.result, { q1: edited }, start + 200000)
  assert.deepEqual(saved.evaluation.q1, edited)
  assert.equal(saved.result.marks, 0)
})
