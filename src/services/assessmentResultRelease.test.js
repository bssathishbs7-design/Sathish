import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareAssessmentResult, reconcileAssessmentResults, automatedEvaluationKey } from './assessmentResultRelease.js'

const submittedAt = '2026-10-16T10:00:00.000Z'
const start = Date.parse(submittedAt)
const question = { id: 'q1', type: 'MCQ', marks: 2, options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOptionIds: ['a'] }
const assessment = { id: 'exam', setup: { examDeliveryMode: 'Online', supervisionType: 'Practice Exam', mcqDisplayType: 'Answer Input', mcqAutoPublish: 'On' }, questionRows: [question] }
const attempt = { isAssessmentSubmitted: true, submittedAt, answers: { q1: 0 }, descriptiveAnswers: { '["descriptive","d1"]': 'Written response' }, appliedResetVersion: 0 }
const storage = entries => { const data = new Map(Object.entries(entries)); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) } }

test('real MCQ key scores immediately but releases only at one minute', () => {
  const early = prepareAssessmentResult(assessment, attempt, {}, {}, start + 59999)
  assert.equal(early.result.marks, 2)
  assert.equal(early.result.status, 'evaluated')
  assert.equal(prepareAssessmentResult(assessment, attempt, early.result, early.evaluation, start + 60000).result.status, 'published')
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

test('after exam end every present student is evaluated; absent students stay excluded', () => {
 const end = new Date(2026, 9, 22, 11, 0).getTime()
 const row = { ...assessment, startDate:'2026-10-22', startTime:'10:00 AM', totalDuration:'01:00',
 students:[{id:'one',attendance:'P'},{id:'two',attendance:'P'},{id:'three',attendance:'P'},{id:'absent',attendance:'A'}] }
 const store = storage({'vx-assessment-published':JSON.stringify([row]),'vx-online-practice-exam-attempts':JSON.stringify({exam:{one:{answers:{q1:0},appliedResetVersion:0}}})})
 reconcileAssessmentResults(store,end-1)
 assert.equal(JSON.parse(store.getItem('vx-assessment-published'))[0].studentResults,undefined)
 reconcileAssessmentResults(store,end)
 const evaluated = JSON.parse(store.getItem('vx-assessment-published'))[0].studentResults
 assert.equal(evaluated.one.marks,2)
 assert.equal(evaluated.two.marks,0)
 assert.equal(evaluated.three.marks,0)
 assert.equal(evaluated.absent,undefined)
 assert.equal(evaluated.two.status,'evaluated')
 reconcileAssessmentResults(store,end+60000)
 assert.equal(JSON.parse(store.getItem('vx-assessment-published'))[0].resultStatus,'Published')
 assert.equal(reconcileAssessmentResults(store,end+61000),false)
})
test('extensions and manual evaluation defer automatic completion', () => {
 const end=new Date(2026,9,22,11,0).getTime()
 const row={...assessment,startDate:'2026-10-22',startTime:'10:00 AM',totalDuration:'01:00',students:[{id:'one',attendance:'P'}]}
 const store=storage({'vx-assessment-published':JSON.stringify([row]),'vx-student-exam-time-extensions':JSON.stringify({exam:{one:{extensionMinutes:10}}})})
 reconcileAssessmentResults(store,end+60000)
 assert.equal(JSON.parse(store.getItem('vx-assessment-published'))[0].studentResults,undefined)
 reconcileAssessmentResults(store,end+600000)
 assert.equal(JSON.parse(store.getItem('vx-assessment-published'))[0].studentResults.one.marks,0)
 const manual={...row,questionRows:[{id:'d',type:'Descriptive Question',marks:3}],setup:{...row.setup,descriptiveAutoEvaluation:'No'}}
 const manualStore=storage({'vx-assessment-published':JSON.stringify([manual])})
 reconcileAssessmentResults(manualStore,end+600000)
 assert.equal(JSON.parse(manualStore.getItem('vx-assessment-published'))[0].studentResults,undefined)
})

test('expired written exams evaluate saved text and give zero to blank present students', () => {
 const end = new Date(2026,9,22,11,0).getTime()
 const written = {id:'d1',type:'Descriptive Question',marks:5,modelAnswer:'The heart pumps blood throughout the body.'}
 const key = JSON.stringify(['descriptive','d1'])
 const row = {...assessment,startDate:'2026-10-22',startTime:'10:00 AM',totalDuration:'01:00',
   setup:{...assessment.setup,descriptiveDisplayType:'Answer Input',descriptiveAutoEvaluation:'Yes',descriptiveAutoPublish:'Off'},
   questionRows:[written], students:[{id:'writer',attendance:'P'},{id:'blank',attendance:'P'},{id:'absent',attendance:'A'}]}
 const store=storage({'vx-assessment-published':JSON.stringify([row]),'vx-online-practice-exam-attempts':JSON.stringify({exam:{writer:{descriptiveAnswers:{[key]:written.modelAnswer},appliedResetVersion:0}}})})
 store.setItem(automatedEvaluationKey(row,'blank',{}),JSON.stringify({[key]:{status:'pending',marks:''}}))
 reconcileAssessmentResults(store,end)
 const results=JSON.parse(store.getItem('vx-assessment-published'))[0].studentResults
 assert.equal(results.writer.status,'evaluated')
 assert.equal(results.writer.marks,5)
 assert.equal(results.blank.status,'evaluated')
 assert.equal(results.blank.marks,0)
 assert.equal(results.absent,undefined)
 const blank=JSON.parse(store.getItem(automatedEvaluationKey(row,'blank',{})))[key]
 assert.equal(blank.status,'not-attempted')
 assert.equal(blank.marks,0)
})
test('ended assessments evaluate the shared fallback roster shown by the table', () => {
 const end = new Date(2026,9,22,11,0).getTime()
 const row = {...assessment,startDate:'2026-10-22',startTime:'10:00 AM',totalDuration:'01:00'}
 const store = storage({'vx-assessment-published':JSON.stringify([row])})
 reconcileAssessmentResults(store,end)
 const saved = JSON.parse(store.getItem('vx-assessment-published'))[0]
 for (const id of ['MV1253','MV1254','MV1255']) {
   assert.equal(saved.studentResults[id].marks,0)
   assert.equal(saved.studentResults[id].status,'evaluated')
   assert.ok(saved.students.some(student => student.id === id))
 }
 assert.equal(saved.studentResults.MV1256,undefined)
})
test('published results update corrected marks without creating another record', () => {
 const row = {...assessment,students:[{id:'one',attendance:'P'}]}
 const store = storage({'vx-assessment-published':JSON.stringify([row]),'vx-online-practice-exam-attempts':JSON.stringify({exam:{one:attempt}})})
 reconcileAssessmentResults(store,start+200000)
 store.setItem(automatedEvaluationKey(row,'one',attempt),JSON.stringify({q1:{status:'wrong',marks:0,manualOverride:true}}))
 reconcileAssessmentResults(store,start+210000)
 const rows=JSON.parse(store.getItem('vx-assessment-published'))
 assert.equal(rows.length,1)
 assert.equal(rows[0].studentResults.one.marks,0)
 assert.equal(rows[0].studentResults.one.status,'published')
 assert.equal(rows[0].resultStatus,'Published')
})
