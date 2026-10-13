import test from 'node:test'
import assert from 'node:assert/strict'
import { descriptiveResponseKey, descriptiveResponseItems, descriptiveQuestionProgress, descriptiveProgress, normalizeDescriptiveResponses, allowsDescriptiveTyping, readAssessmentAttempt, persistAssessmentAttempt, descriptiveEvaluationComplete } from './descriptiveResponses.js'

const questions = [{ id: 'q1', marks: 5 }, { id: 'q2', descriptiveSections: [{ id: 'a', marks: 2 }, { id: 'b', children: [{ id: 'a', marks: 3 }, { id: 'b', marks: 4 }] }] }, { id: 'q3', descriptiveSections: [{ id: 'a', marks: 2 }] }]
test('leaf identities isolate repeated part ids across parents and nested sections', () => {
  const items = questions.flatMap(descriptiveResponseItems)
  assert.equal(items.length, 5); assert.equal(new Set(items.map(item => item.key)).size, 5)
  assert.equal(descriptiveResponseKey(questions[1], 1, 0), descriptiveResponseKey(questions[1], 99, 0))
})
test('no-id fallbacks and legacy subQuestions are supported', () => {
  const question = { subQuestions: [{ marks: 2 }, { children: [{ marks: 3 }] }] }
  assert.equal(descriptiveResponseItems(question, 0).length, 2)
  assert.notEqual(descriptiveResponseKey(question, 0, 0), descriptiveResponseKey(question, 1, 0))
})
test('empty text is unanswered; split questions distinguish partial completion', () => {
  const question = questions[1], items = descriptiveResponseItems(question, 1)
  assert.equal(descriptiveQuestionProgress(question, 1, { [items[0].key]: ' \n ' }), 'Unanswered')
  assert.equal(descriptiveQuestionProgress(question, 1, { [items[0].key]: 'One answer' }), 'Partially answered')
  const answers = Object.fromEntries(items.map(item => [item.key, 'Answer']))
  assert.equal(descriptiveQuestionProgress(question, 1, answers), 'Answered')
  assert.deepEqual(descriptiveProgress(questions, answers), { answered: 1, partial: 0, unanswered: 2, total: 3 })
})
test('legacy migration never duplicates an ambiguous response', () => {
  const normalized = normalizeDescriptiveResponses(questions, { q1: 'Legacy answer', a: 'Ambiguous' })
  assert.equal(normalized[descriptiveResponseKey(questions[0], 0)], 'Legacy answer')
  assert.equal(normalized[descriptiveResponseKey(questions[1], 1, 0)], undefined)
})
const textarea = { tagName: 'TEXTAREA', dataset: { descriptiveAnswer: 'true' }, disabled: false, readOnly: false }
test('proctoring permits rich answer descendants without unlocking clipboard or other inputs', () => {
  const editor = { tagName: 'DIV', dataset: { descriptiveAnswer: 'true' }, isContentEditable: true, getAttribute: () => 'false' }
  const target = { closest: () => editor }
  assert.equal(allowsDescriptiveTyping({ target, key: 'a' }, true), true)
  assert.equal(allowsDescriptiveTyping({ target, type: 'beforeinput', inputType: 'formatBold' }, true), true)
  assert.equal(allowsDescriptiveTyping({ target, key: 'v', ctrlKey: true }, true), false)
  assert.equal(allowsDescriptiveTyping({ target, type: 'beforeinput', inputType: 'insertFromPaste' }, true), false)
  assert.equal(allowsDescriptiveTyping({ target, type: 'beforeinput', inputType: 'insertFromDrop' }, true), false)
  assert.equal(allowsDescriptiveTyping({ target: { isContentEditable: true }, key: 'a' }, true), false)
  editor.getAttribute = () => 'true'
  assert.equal(allowsDescriptiveTyping({ target, key: 'a' }, true), false)
})
test('proctoring permits typing, editing and composition only in enabled answer fields', () => {
  for (const key of ['a', 'A', 'Enter', 'Backspace', 'ArrowLeft']) assert.ok(allowsDescriptiveTyping({ target: textarea, key }, true))
  assert.ok(allowsDescriptiveTyping({ target: textarea, type: 'compositionupdate' }, true))
  assert.equal(allowsDescriptiveTyping({ target: textarea, key: 'a' }, false), false)
  assert.equal(allowsDescriptiveTyping({ target: { ...textarea, disabled: true }, key: 'a' }, true), false)
  assert.equal(allowsDescriptiveTyping({ target: { ...textarea, dataset: {} }, key: 'a' }, true), false)
})
test('proctoring still blocks paste, browser shortcuts, escape and function keys', () => {
  for (const key of ['Escape', 'F12', 'PrintScreen', 'Tab']) assert.equal(allowsDescriptiveTyping({ target: textarea, key }, true), false)
  assert.equal(allowsDescriptiveTyping({ target: textarea, key: 'v', ctrlKey: true }, true), false)
  assert.equal(allowsDescriptiveTyping({ target: textarea, type: 'beforeinput', inputType: 'insertFromPaste' }, true), false)
})
const storage = () => { const data = new Map(); return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value) } }
test('faculty reads the correct student and exam mode', () => {
  const store = storage()
  persistAssessmentAttempt('vx-online-practice-exam-attempts', 'exam', 'student', { descriptiveAnswers: { answer: 'Practice response' } }, store)
  persistAssessmentAttempt('vx-online-proctored-exam-attempts', 'exam', 'student', { descriptiveAnswers: { answer: 'Proctored response' } }, store)
  assert.equal(readAssessmentAttempt({ id: 'exam', setup: { supervisionType: 'Practice Exam' } }, 'student', store).descriptiveAnswers.answer, 'Practice response')
  assert.equal(readAssessmentAttempt({ id: 'exam', setup: { supervisionType: 'Proctored Exam' } }, 'student', store).descriptiveAnswers.answer, 'Proctored response')
  assert.deepEqual(readAssessmentAttempt({ id: 'exam' }, 'other', store), {})
})
test('submission snapshot includes final answer, locks and submission time', () => {
  const store = storage(), key = 'vx-online-practice-exam-attempts'
  assert.ok(persistAssessmentAttempt(key, 'exam', 'student', { descriptiveAnswers: { last: 'Final keystroke' }, isAssessmentSubmitted: true, appliedResetVersion: 0 }, store))
  const saved = JSON.parse(store.getItem(key)).exam.student
  assert.equal(saved.descriptiveAnswers.last, 'Final keystroke'); assert.ok(saved.submittedAt)
  persistAssessmentAttempt(key, 'exam', 'student', { appliedResetVersion: 1 }, store)
  const reset = JSON.parse(store.getItem(key)).exam.student
  assert.equal(reset.descriptiveAnswers, undefined); assert.equal(reset.submittedAt, null)
})
test('storage failures cannot report successful submission', () => {
  assert.equal(persistAssessmentAttempt('key', 'exam', 'student', {}, { getItem: () => '{}', setItem: () => { throw new Error('Quota exceeded') } }), false)
})
test('descriptive result release requires completed valid marks for every leaf', () => {
  const items = [{ key: 'a', maxMarks: 5 }, { key: 'b', maxMarks: 2 }]
  assert.equal(descriptiveEvaluationComplete(items, { a: { status: 'evaluated', marks: 3 } }), false)
  assert.equal(descriptiveEvaluationComplete(items, { a: { status: 'evaluated', marks: 3 }, b: { status: 'not-attempted', marks: 0 } }), true)
  assert.equal(descriptiveEvaluationComplete(items, { a: { status: 'evaluated', marks: 6 }, b: { status: 'not-attempted' } }), false)
})
