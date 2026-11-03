import { assessmentRoster } from './assessmentRoster.js'
import { descriptiveInputEnabled, readAssessmentAttempt } from './descriptiveResponses.js'
import { getAssessmentAutomation } from './assessmentAutomation.js'
import { assessmentHistoryId } from './assessmentHistory.js'
import { assertReviewable, assertReviewDecision, QUEUE_KEY, QUEUE_CACHE_KEY } from './approvalQueue.js'
import { resolveApprovalReviewer } from './approvalReviewers.js'
import { getDescriptiveScoringItems, getQuestionKey, getQuestionMarksTotal, isDescriptiveQuestionType } from './assessmentScoringItems.js'
import { liveEvaluationProgress } from './liveEvaluationProgress.js'
import { normalizeEvaluationAttendance } from './evaluationAttendance.js'

export const ASSESSMENT_RESULT_TYPE = 'Assessment Result'
export const RESULT_ASSESSMENTS_KEY = 'vx-assessment-published'
const idOf = row => String(row?.id || row?.assessmentId || row?.setup?.assessmentId || '')
const studentId = row => String(row.id || row.studentId || row.registerId || '')
const read = (storage, key, fallback) => {
  const raw = storage.getItem(key)
  return raw === null ? fallback : JSON.parse(raw)
}
const list = (storage, key) => {
  const value = read(storage, key, [])
  if (!Array.isArray(value)) throw new Error('Saved assessment data could not be read. Please reload and try again.')
  return value
}

/** Local mock transaction. API integration must replace this with a server transaction.
 * @param {Array<[Storage,string,string]>} writes Complete serialised values to persist.
 */
export function commitResultWrites(writes) {
  const before = writes.map(([storage, key]) => [storage, key, storage.getItem(key)])
  const completed = []
  try {
    writes.forEach(([storage, key, value], index) => {
      storage.setItem(key, value)
      completed.push(before[index])
    })
  } catch (error) {
    let rollbackFailed = false
    for (const [storage, key, value] of completed.reverse()) {
      try { if (value === null) storage.removeItem(key); else storage.setItem(key, value) }
      catch { rollbackFailed = true }
    }
    throw new Error(rollbackFailed
      ? 'The save and recovery could not complete. Keep this page open and restore browser storage before retrying.'
      : `Results were not saved. Free browser storage and retry. ${error.message || ''}`)
  }
}

function currentAssessment(id, storage) {
  const records = list(storage, RESULT_ASSESSMENTS_KEY)
  const assessment = records.find(row => idOf(row) === String(id))
  if (!assessment) throw new Error('This assessment is no longer available. Return to the assessment list.')
  return { records, assessment }
}

/** The submitted snapshot is bound to roster, paper, marks, attendance and attempt versions.
 * @param {Object} assessment Published assessment.
 * @param {Storage} storage Local assessment adapter.
 * @returns {string} Opaque local comparison token; this is not an authentication signature.
 */
export function resultSnapshotVersion(assessment, storage) {
  const id = idOf(assessment)
  const snapshot = JSON.stringify({ setup: assessment.setup, questions: assessment.questionRows || assessment.questions,
    roster: assessmentRoster(assessment), attendance: read(storage, `vx-assessment-evaluation-attendance:${id}`, {}),
    students: assessmentRoster(assessment).map(student => {
      const sid = studentId(student)
      const attempt = readAssessmentAttempt(assessment, sid, storage)
      const suffix = descriptiveInputEnabled(assessment) ? `:attempt-${attempt.appliedResetVersion || 0}` : ''
      return { id: sid, attempt, marks: read(storage, `vx-assessment-student-question-evaluation:${id}:${sid}${suffix}`, {}) }
    }) })
  // Compact local change detection avoids duplicating image responses in the queue.
  // This never authorises a request or replaces a server-owned version.
  let first = 2166136261, second = 5381
  for (let i = 0; i < snapshot.length; i++) {
    first = Math.imul(first ^ snapshot.charCodeAt(i), 16777619)
    second = Math.imul(second, 33) ^ snapshot.charCodeAt(i)
  }
  return `local-v1:${snapshot.length}:${first >>> 0}:${second >>> 0}`
}

/** Validate the evaluator's serialisable roster summary before a release command.
 * @param {Array<{id:string,name:string,isAbsent:boolean,evalStatus:string,scoringSummary:{total:number,maxMarks:number,obtainedMarks:number}}>} rows
 */
function validateRows(assessment, rows, storage) {
  const assigned = assessmentRoster(assessment).map(studentId)
  if (!assigned.length || assigned.some(id => !id) || new Set(assigned).size !== assigned.length) throw new Error('Assign a valid student roster before releasing results.')
  if (!Array.isArray(rows) || rows.length !== assigned.length || new Set(rows.map(studentId)).size !== assigned.length
    || rows.some(row => !assigned.includes(studentId(row)))) throw new Error('The roster changed. Reload evaluation before continuing.')
  const present = rows.filter(row => !row.isAbsent)
  if (!present.length) throw new Error('There are no completed present students to release.')
  if (present.some(row => row.evalStatus !== 'Completed' || !(row.scoringSummary?.total > 0)
    || !(row.scoringSummary?.maxMarks > 0) || !Number.isFinite(row.scoringSummary.obtainedMarks)
    || row.scoringSummary.obtainedMarks < 0 || row.scoringSummary.obtainedMarks > row.scoringSummary.maxMarks)) {
    throw new Error('Complete evaluation for every present student before releasing results.')
  }
  const questions = assessment.questionRows || assessment.questions || assessment.setup?.questionRows || []
  const mcqs = questions.filter(q => !isDescriptiveQuestionType(q.type))
  const descriptive = questions.filter(q => isDescriptiveQuestionType(q.type))
  const items = [...mcqs.map((q, i) => ({ key: getQuestionKey(q, `mcq-${i + 1}`), maxMarks: getQuestionMarksTotal(q) || 1 })),
    ...descriptive.flatMap((q, i) => getDescriptiveScoringItems(q, i, descriptiveInputEnabled(assessment)))]
  const setup = { ...assessment, ...assessment.setup }
  const offline = (setup.examDeliveryMode || assessment.examMode) === 'Offline'
  const attendance = read(storage, `vx-assessment-evaluation-attendance:${idOf(assessment)}`, {})
  for (const row of rows) {
    const student = assessmentRoster(assessment).find(s => studentId(s) === studentId(row))
    const status = normalizeEvaluationAttendance((offline && attendance[row.id]) || student.attendance || student.attendanceStatus)
    if (status === 'A' && !row.isAbsent || status === 'P' && row.isAbsent) throw new Error('Attendance changed. Reload evaluation before continuing.')
    if (row.isAbsent) continue
    const attempt = readAssessmentAttempt(assessment, row.id, storage)
    if (!offline && liveEvaluationProgress(assessment, attempt, { hasMcq: !!mcqs.length, hasDescriptive: !!descriptive.length }).waiting) throw new Error('Wait for every required section to be submitted.')
    const suffix = descriptiveInputEnabled(assessment) ? `:attempt-${attempt.appliedResetVersion || 0}` : ''
    const stored = read(storage, `vx-assessment-student-question-evaluation:${idOf(assessment)}:${row.id}${suffix}`, {})
    const marks = Object.keys(stored).length ? stored : offline ? student.mockEvaluationState || {} : {}
    const valid = items.length > 0 && items.every(item => {
      const value = marks[item.key]
      return value && !value.error && ['correct', 'wrong', 'not-attempted', 'evaluated'].includes(value.status)
        && String(value.marks ?? '').trim() !== '' && Number.isFinite(Number(value.marks)) && Number(value.marks) >= 0 && Number(value.marks) <= item.maxMarks
    })
    const obtained = items.reduce((sum, item) => sum + Number(marks[item.key]?.marks || 0), 0)
    const maximum = items.reduce((sum, item) => sum + item.maxMarks, 0)
    if (!valid || obtained !== row.scoringSummary.obtainedMarks || maximum !== row.scoringSummary.maxMarks || items.length !== row.scoringSummary.total) {
      throw new Error('Saved marks are incomplete or changed. Reload evaluation before continuing.')
    }
  }
  return present
}

const alreadyReleased = assessment => [assessment.resultStatus, assessment.evaluationStatus].includes('Published')
function assertManualRelease(assessment) {
  if (alreadyReleased(assessment)) throw new Error('These results have already been published.')
  const setup = { ...assessment, ...assessment.setup }
  const questions = assessment.questionRows || assessment.questions || []
  if (getAssessmentAutomation(setup, { hasMcq: questions.some(q => q.type === 'MCQ'), hasDescriptive: questions.some(q => q.type !== 'MCQ') }).canAutoPublishCombined) {
    throw new Error('Automatic release is enabled for this assessment.')
  }
}

function historyWrite(assessment, action, actor, notes, storage, now) {
  const key = `vx-assessment-history:${assessmentHistoryId(assessment)}`
  return [storage, key, JSON.stringify([...list(storage, key), { id: crypto.randomUUID(), action, actor, notes, timestamp: now }])]
}
const queueWrites = (rows, local, session) => [[local, QUEUE_CACHE_KEY, JSON.stringify(rows)], [session, QUEUE_KEY, JSON.stringify(rows)]]

/** Submit a frozen evaluation summary through the shared queue. No paper is withdrawn.
 * @param {Object} request Queue metadata plus assessmentRecordId and resultRows.
 * @returns {{assessment:Object,queue:Array}} Persisted pending assessment and queue.
 */
export function submitAssessmentResults(request, rows, local, session) {
  const { assessment, records } = currentAssessment(request.assessmentRecordId, local)
  assertManualRelease(assessment)
  if (assessment.resultApproval?.status === 'Pending Approval') throw new Error('Results are already awaiting approval.')
  if (!resolveApprovalReviewer(request.approvalFaculty)) throw new Error('Select a valid reviewer.')
  validateRows(assessment, request.resultRows, local)
  const snapshot = { rows: request.resultRows, version: resultSnapshotVersion(assessment, local) }
  const { resultRows: _resultRows, ...metadata } = request
  const latestQueue = local.getItem(QUEUE_CACHE_KEY) === null ? rows.filter(row => row.id !== request.id) : list(local, QUEUE_CACHE_KEY)
  const previous = latestQueue.find(row => row.id === request.id)
  const queued = { ...metadata, resultSnapshot: snapshot,
    previousSubmissions: previous ? [...(previous.previousSubmissions || []), { ...previous, previousSubmissions: undefined }] : metadata.previousSubmissions || [] }
  const queue = [queued, ...latestQueue.filter(row => row.id !== request.id)]
  const next = { ...assessment, resultApproval: { requestId: request.id, status: 'Pending Approval', sentAt: request.sentAt } }
  commitResultWrites([
    [local, RESULT_ASSESSMENTS_KEY, JSON.stringify(records.map(row => idOf(row) === idOf(assessment) ? next : row))],
    ...queueWrites(queue, local, session),
    historyWrite(assessment, 'Results sent for approval', request.senderName, request.approvalFaculty.note || '', local, request.sentAt),
  ])
  return { assessment: next, queue }
}

function releasedAssessment(assessment, rows, now) {
  const studentResults = { ...assessment.studentResults }
  rows.filter(row => !row.isAbsent).forEach(row => {
    studentResults[studentId(row)] = { ...studentResults[studentId(row)], status: 'published', publishedAt: now,
      marks: row.scoringSummary.obtainedMarks, maxMarks: row.scoringSummary.maxMarks }
  })
  return { ...assessment, studentResults, automatedResultRelease: false, resultStatus: 'Published', evaluationStatus: 'Published', publishedResultAt: now, resultsPublishedAt: now }
}

/** Direct manual release; success is returned only after paper, history and navigation snapshot persist. */
export function publishAssessmentResults({ assessmentId, rows, version, actor = '' }, local, session, now = new Date().toISOString()) {
  const { assessment, records } = currentAssessment(assessmentId, local)
  assertManualRelease(assessment)
  if (assessment.resultApproval?.requestId) throw new Error('Results submitted for review must be resubmitted through the approval route.')
  if (version !== resultSnapshotVersion(assessment, local)) throw new Error('Marks or attempts changed. Review the latest evaluation before publishing.')
  validateRows(assessment, rows, local)
  const next = releasedAssessment(assessment, rows, now)
  commitResultWrites([
    [local, RESULT_ASSESSMENTS_KEY, JSON.stringify(records.map(row => idOf(row) === idOf(assessment) ? next : row))],
    historyWrite(assessment, 'Results published', actor, 'Direct publication', local, now),
    [session, 'vx-assessment-evaluation-selected', JSON.stringify(next)],
    [local, 'vx-assessment-create-initial-tab', 'results'],
  ])
  return next
}

/** Reviewer permission, submission version and evaluation version are rechecked at commit time.
 * Approval publishes the reviewed results; rejection returns them to faculty with remarks.
 */
export function reviewAssessmentResults(record, user, local, session, now = new Date().toISOString()) {
  const queue = list(local, QUEUE_CACHE_KEY)
  const current = queue.find(row => row.id === record.id)
  assertReviewable(current, record, user)
  assertReviewDecision(record)
  if (!['Approved', 'Approval Rejected'].includes(record.approvalStatus)) throw new Error('Choose approve or reject.')
  const { assessment, records } = currentAssessment(current.assessmentRecordId, local)
  if (assessment.resultApproval?.requestId !== current.id || assessment.resultApproval.status !== 'Pending Approval') throw new Error('This result review is no longer current.')
  if (record.approvalStatus === 'Approved') {
    if (current.resultSnapshot.version !== resultSnapshotVersion(assessment, local)) throw new Error('Marks, roster or attempts changed. Reject this request so faculty can review and resubmit.')
    validateRows(assessment, current.resultSnapshot.rows, local)
  }
  const reviewed = { ...current, approvalStatus: record.approvalStatus, status: record.approvalStatus,
    reviewRemarks: record.reviewRemarks || '', reviewedAt: now, reviewedBy: user.name, reviewedById: user.registerId || user.id,
    decisionNoticeVersion: crypto.randomUUID() }
  const next = { ...(record.approvalStatus === 'Approved' ? releasedAssessment(assessment, current.resultSnapshot.rows, now) : assessment),
    resultApproval: { ...assessment.resultApproval, status: record.approvalStatus, remarks: reviewed.reviewRemarks, reviewedAt: now } }
  const nextQueue = queue.map(row => row.id === current.id ? reviewed : row)
  commitResultWrites([
    [local, RESULT_ASSESSMENTS_KEY, JSON.stringify(records.map(row => idOf(row) === idOf(assessment) ? next : row))],
    ...queueWrites(nextQueue, local, session),
    historyWrite(assessment, record.approvalStatus === 'Approved' ? 'Results approved and published' : 'Results rejected', user.name, reviewed.reviewRemarks, local, now),
  ])
  return { assessment: next, record: reviewed, queue: nextQueue }
}
