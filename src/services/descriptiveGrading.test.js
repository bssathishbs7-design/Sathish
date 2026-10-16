import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateDescriptiveAnswer } from './descriptiveGrading.js'
import { prepareAssessmentResult } from './assessmentResultRelease.js'
import { descriptiveResponseKey } from './descriptiveResponses.js'

const strict = { strict: true }
test('practice and assessment share keyword coverage scores', () => {
  for (const answer of ['insulin glucose uptake', 'glucose', 'unrelated', '']) {
    const practice = evaluateDescriptiveAnswer(answer, 'insulin glucose uptake', 9)
    const assessment = evaluateDescriptiveAnswer(answer, 'insulin glucose uptake', 9, strict)
    assert.equal(practice.earnedMarks, assessment.earnedMarks)
  }
  assert.equal(evaluateDescriptiveAnswer('glucose', 'insulin glucose uptake', 9, strict).earnedMarks, 3)
})
test('strict mode requires usable model answers for written responses', () => {
  for (const model of ['', 'Answer guidance will appear here.', 'is a']) {
    const result = evaluateDescriptiveAnswer('Written response', model, 5, strict)
    assert.equal(result.reviewRequired, true)
    assert.equal(result.earnedMarks, null)
  }
  assert.equal(evaluateDescriptiveAnswer('Written response', '', 5).earnedMarks, 5)
})
test('rich text is evaluated but images and invalid marks require review', () => {
  assert.equal(evaluateDescriptiveAnswer({ format: 'html', html: '<p>Insulin&nbsp;glucose</p>' }, 'insulin glucose', 4, strict).earnedMarks, 4)
  assert.equal(evaluateDescriptiveAnswer({ format: 'html', html: '<img src="data:image/png;base64,a">' }, 'insulin', 4, strict).reviewRequired, true)
  assert.equal(evaluateDescriptiveAnswer('insulin', 'insulin', -1, strict).reviewRequired, true)
})

const submittedAt = '2026-10-16T10:00:00Z'
const now = Date.parse(submittedAt)
const root = { id: 'laq', type: 'LAQs', descriptiveSections: [{ id: 'part', children: [
  { id: 'a', marks: 4, modelAnswer: 'insulin glucose' },
  { id: 'b', marks: 6, answerKey: 'oxygen haemoglobin' },
] }] }
const exam = { id: 'exam', setup: { examDeliveryMode: 'Online', descriptiveDisplayType: 'Answer Input', descriptiveAutoEvaluation: 'Yes', descriptiveAutoPublish: 'On' }, questionRows: [root] }
const first = descriptiveResponseKey(root, 0, 0, 0), second = descriptiveResponseKey(root, 0, 0, 1)
const attempt = { isAssessmentSubmitted: true, submittedAt, descriptiveAnswers: { [first]: 'Insulin glucose', [second]: 'oxygen' } }
test('nested parts grade independently and release after the existing deadline', () => {
  const early = prepareAssessmentResult(exam, attempt, {}, {}, now)
  assert.equal(early.evaluation[first].marks, 4)
  assert.equal(early.evaluation[second].marks, 3)
  assert.equal(early.result.marks, 7)
  assert.equal(early.result.status, 'evaluated')
  assert.equal(prepareAssessmentResult(exam, attempt, early.result, early.evaluation, now + 120000).result.status, 'published')
})
test('manual, offline, and read-only settings skip descriptive automatic grading', () => {
  for (const patch of [{ descriptiveAutoEvaluation: 'No' }, { examDeliveryMode: 'Offline' }, { descriptiveDisplayType: 'Read-Only' }]) {
    assert.deepEqual(prepareAssessmentResult({ ...exam, setup: { ...exam.setup, ...patch } }, attempt, {}, {}, now).evaluation, {})
  }
})
test('existing faculty marks remain intact and unanswered text scores zero', () => {
  const faculty = { status: 'evaluated', marks: 1 }
  const result = prepareAssessmentResult(exam, { ...attempt, descriptiveAnswers: { [first]: 'insulin' } }, {}, { [first]: faculty }, now)
  assert.deepEqual(result.evaluation[first], faculty)
  assert.equal(result.evaluation[second].status, 'not-attempted')
  assert.equal(result.evaluation[second].marks, 0)
})
test('unsupported nested answer blocks combined publication', () => {
  const result = prepareAssessmentResult(exam, { ...attempt, descriptiveAnswers: { ...attempt.descriptiveAnswers, [second]: { format: 'html', html: '<img src="https://example.test/answer.png">' } } }, {}, {}, now + 120000)
  assert.equal(result.result.status, 'evaluating')
  assert.equal(result.evaluation[second].reviewRequired, true)
  assert.match(result.evaluation[second].feedback, /faculty review/)
})

test('reset descriptive part stays pending while other automatic grades are preserved', () => {
  const initial = prepareAssessmentResult(exam, attempt, {}, {}, now)
  const reset = { status: 'pending', marks: '', autoEvaluated: false, manualOverride: true }
  const next = prepareAssessmentResult(exam, attempt, initial.result, { ...initial.evaluation, [first]: reset }, now + 120000)
  assert.deepEqual(next.evaluation[first], reset)
  assert.deepEqual(next.evaluation[second], initial.evaluation[second])
  assert.equal(next.result.status, 'evaluating')
  const edited = { status: 'evaluated', marks: 2 }
  const saved = prepareAssessmentResult(exam, attempt, next.result, { ...next.evaluation, [first]: edited }, now + 120000)
  assert.deepEqual(saved.evaluation[first], edited)
  assert.equal(saved.result.marks, 5)
})
