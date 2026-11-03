import test from 'node:test'
import assert from 'node:assert/strict'
import { publishAssessmentResults, submitAssessmentResults, reviewAssessmentResults, resultSnapshotVersion, RESULT_ASSESSMENTS_KEY } from './assessmentResultWorkflow.js'
import { assessmentRoster } from './assessmentRoster.js'
import { QUEUE_KEY, QUEUE_CACHE_KEY, requestType } from './approvalQueue.js'
import { APPROVAL_REVIEWERS } from './approvalReviewers.js'

class Store {
  constructor(data = {}) { this.data = new Map(Object.entries(data)) }
  getItem(key) { return this.data.get(key) ?? null }
  setItem(key, value) { this.data.set(key, String(value)) }
  removeItem(key) { this.data.delete(key) }
}
const record = { id: 'exam', assessmentName: 'Pharmacology', setup: { assessmentId: 'exam', examDeliveryMode: 'Offline' },
  students: [{ id: 's1', name: 'Aarav', attendance: 'P' }, { id: 's2', name: 'Meera', attendance: 'A' }],
  questionRows: [{ id: 'q1', type: 'MCQ', marks: 2 }] }
const rows = [{ id: 's1', name: 'Aarav', isAbsent: false, evalStatus: 'Completed', scoringSummary: { total: 1, maxMarks: 2, obtainedMarks: 2 } },
  { id: 's2', name: 'Meera', isAbsent: true, evalStatus: 'Absent', scoringSummary: { total: 1, maxMarks: 2, obtainedMarks: 0 } }]
const author = { id: 'author', name: 'Author' }
const reviewer = { registerId: APPROVAL_REVIEWERS[0].employeeId, name: APPROVAL_REVIEWERS[0].facultyName, role: 'Faculty' }
const fixture = () => ({ local: new Store({ [RESULT_ASSESSMENTS_KEY]: JSON.stringify([record]), 'vx-assessment-student-question-evaluation:exam:s1': JSON.stringify({ q1: { marks: 2, status: 'correct' } }) }), session: new Store() })
const read = (storage, key) => JSON.parse(storage.getItem(key))
function submit(local, session, overrides = {}) {
  const request = { id: 'approval-result-exam', activityId: 'result-exam', activityType: 'Assessment Result',
    assessmentRecordId: 'exam', activityName: 'Pharmacology results', approvalStatus: 'Pending Approval', status: 'Pending Approval',
    approvalFaculty: APPROVAL_REVIEWERS[0], reviewerId: reviewer.registerId, senderId: author.id, senderName: author.name,
    sentAt: new Date().toISOString(), resultRows: rows, ...overrides }
  return submitAssessmentResults(request, [request], local, session)
}

test('an explicit empty roster never becomes demo students, including higher-priority empty assignment', () => {
  assert.deepEqual(assessmentRoster({ students: [], assignedStudents: [{ id: 'unassigned' }] }), [])
  assert.deepEqual(assessmentRoster({}), [])
  assert.equal(assessmentRoster(record).length, 2)
})
test('direct release persists scores, history and navigation only after valid evaluation', () => {
  const { local, session } = fixture()
  const saved = publishAssessmentResults({ assessmentId: 'exam', rows, version: resultSnapshotVersion(record, local) }, local, session)
  assert.equal(saved.resultStatus, 'Published')
  assert.equal(saved.studentResults.s1.marks, 2)
  assert.equal(saved.studentResults.s2, undefined)
  assert.equal(read(session, 'vx-assessment-evaluation-selected').resultStatus, 'Published')
  assert.equal(read(local, 'vx-assessment-history:exam')[0].action, 'Results published')
})
test('late navigation-storage failure rolls back publication and history, then retry succeeds', () => {
  const { local, session } = fixture()
  const before = local.getItem(RESULT_ASSESSMENTS_KEY)
  const write = session.setItem.bind(session)
  session.setItem = () => { throw new Error('quota') }
  const command = { assessmentId: 'exam', rows, version: resultSnapshotVersion(record, local) }
  assert.throws(() => publishAssessmentResults(command, local, session), /not saved/)
  assert.equal(local.getItem(RESULT_ASSESSMENTS_KEY), before)
  assert.equal(local.getItem('vx-assessment-history:exam'), null)
  session.setItem = write
  assert.equal(publishAssessmentResults(command, local, session).resultStatus, 'Published')
})
test('incomplete, altered, out-of-range or stale marks cannot be published', () => {
  for (const value of [{ status: 'pending', marks: '' }, { status: 'evaluated', marks: 3 }, { status: 'correct', marks: 1 }]) {
    const { local, session } = fixture()
    local.setItem('vx-assessment-student-question-evaluation:exam:s1', JSON.stringify({ q1: value }))
    assert.throws(() => publishAssessmentResults({ assessmentId: 'exam', rows, version: resultSnapshotVersion(record, local) }, local, session), /marks/)
  }
  const { local, session } = fixture()
  const version = resultSnapshotVersion(record, local)
  local.setItem('vx-assessment-evaluation-attendance:exam', '{"s1":"A"}')
  assert.throws(() => publishAssessmentResults({ assessmentId: 'exam', rows, version }, local, session), /changed/)
})
test('submission enters a durable result-specific queue without withdrawing the paper', () => {
  const { local, session } = fixture()
  const saved = submit(local, session)
  assert.equal(requestType(saved.queue[0]), 'Assessment Result')
  assert.equal(saved.assessment.resultApproval.status, 'Pending Approval')
  assert.equal(read(local, RESULT_ASSESSMENTS_KEY).length, 1)
  assert.deepEqual(read(local, QUEUE_CACHE_KEY), read(session, QUEUE_KEY))
  assert.throws(() => submit(local, session), /already awaiting/)
  assert.throws(() => publishAssessmentResults({ assessmentId: 'exam', rows, version: resultSnapshotVersion(saved.assessment, local) }, local, session), /approval route/)
})
test('approved review publishes the frozen scores; repeat or unauthorised decisions fail', () => {
  const { local, session } = fixture()
  const request = submit(local, session).queue[0]
  const decision = { ...request, approvalStatus: 'Approved' }
  assert.throws(() => reviewAssessmentResults(decision, { registerId: 'other' }, local, session), /not assigned/)
  const saved = reviewAssessmentResults(decision, reviewer, local, session)
  assert.equal(saved.assessment.resultStatus, 'Published')
  assert.equal(saved.queue[0].approvalStatus, 'Approved')
  assert.equal(saved.assessment.studentResults.s1.marks, 2)
  assert.throws(() => reviewAssessmentResults(decision, reviewer, local, session), /already been reviewed/)
})
test('stale marks prevent approval but permit rejection, correction and resubmission', () => {
  const { local, session } = fixture()
  const request = submit(local, session).queue[0]
  local.setItem('vx-assessment-student-question-evaluation:exam:s1', '{"q1":{"status":"wrong","marks":0}}')
  assert.throws(() => reviewAssessmentResults({ ...request, approvalStatus: 'Approved' }, reviewer, local, session), /changed/)
  assert.throws(() => reviewAssessmentResults({ ...request, approvalStatus: 'Approval Rejected' }, reviewer, local, session), /remarks/)
  const returned = reviewAssessmentResults({ ...request, approvalStatus: 'Approval Rejected', reviewRemarks: 'Check the marks.' }, reviewer, local, session)
  assert.equal(returned.assessment.resultApproval.status, 'Approval Rejected')
  assert.notEqual(returned.assessment.resultStatus, 'Published')
  local.setItem('vx-assessment-student-question-evaluation:exam:s1', '{"q1":{"status":"correct","marks":2}}')
  assert.equal(submit(local, session).assessment.resultApproval.status, 'Pending Approval')
})
test('failed review transaction leaves both approval and results pending', () => {
  const { local, session } = fixture()
  const request = submit(local, session).queue[0]
  const before = new Map(local.data)
  const write = session.setItem.bind(session)
  let fail = true
  session.setItem = (key, value) => { if (fail) { fail = false; throw new Error('quota') } write(key, value) }
  assert.throws(() => reviewAssessmentResults({ ...request, approvalStatus: 'Approved' }, reviewer, local, session), /not saved/)
  assert.deepEqual(local.data, before)
  assert.equal(read(session, QUEUE_KEY)[0].approvalStatus, 'Pending Approval')
})
