import test from 'node:test'
import assert from 'node:assert/strict'
import { answerHtml, hasAnswerContent, uploadAnswerImage } from './richAnswers.js'
import { descriptiveQuestionProgress, descriptiveResponseKey, persistAssessmentAttempt, readAssessmentAttempt } from './descriptiveResponses.js'

test('legacy answers remain literal text and preserve line breaks', () => {
  assert.equal(answerHtml('<b>patient</b>\nNext'), '&lt;b&gt;patient&lt;/b&gt;<br>Next')
  assert.equal(hasAnswerContent('  '), false)
})
test('formatting and empty tables are not attempted answers', () => {
  for (const html of ['<p><br></p>', '<b>&nbsp;</b>', '<table><tr><td><br></td></tr></table>', '<script>bad()</script>']) assert.equal(hasAnswerContent({ format: 'html', html }), false)
  assert.equal(hasAnswerContent({ format: 'html', html: '<table><tr><td>Finding</td></tr></table>' }), true)
  assert.equal(hasAnswerContent({ format: 'html', html: '<img src="data:image/png;base64,abc">' }), true)
})
test('rich content contributes to progress without counting empty sibling answers', () => {
  const question = { id: 'q', subQuestions: [{id:'a'}, {id:'b'}] }
  const answers = { [descriptiveResponseKey(question, 0, 0)]: { format: 'html', html: '<b>Response</b>' }, [descriptiveResponseKey(question, 0, 1)]: { format: 'html', html: '<p><br></p>' } }
  assert.equal(descriptiveQuestionProgress(question, 0, answers), 'Partially answered')
})
test('attempt storage preserves rich markup and durable image data for faculty review', () => {
  const map = new Map()
  const storage = { getItem: key => map.get(key), setItem: (key,value) => map.set(key,value) }
  const answer = {format:'html',html:'<b>Finding</b><img src="data:image/png;base64,abc">'}
  assert.equal(persistAssessmentAttempt('vx-online-practice-exam-attempts','exam','student',{descriptiveAnswers:{a:answer},isDescriptiveSubmitted:true},storage),true)
  assert.deepEqual(readAssessmentAttempt({id:'exam',supervisionType:'Practice Exam'},'student',storage).descriptiveAnswers.a,answer)
})
test('invalid and oversized images fail before reading the file', async () => {
  await assert.rejects(uploadAnswerImage({type:'image/svg+xml',size:20}), /PNG, JPEG or WebP/)
  await assert.rejects(uploadAnswerImage({type:'image/png',size:600 * 1024}), /512 KB/)
})
