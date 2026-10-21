import { assessmentRoster, closeExpiredPresentAttempts } from './assessmentAutoClose.js'
import { normalizeEvaluationAttendance } from './evaluationAttendance.js'
import { appendAssessmentHistory } from './assessmentHistory.js'
import { getAssessmentAutomationConfiguration } from './assessmentAutomation.js'
import { descriptiveInputEnabled, descriptiveResponseItems, normalizeDescriptiveResponses, readAssessmentAttempt } from './descriptiveResponses.js'
import { evaluateDescriptiveAnswer } from './descriptiveGrading.js'
import { hasAnswerContent } from './richAnswers.js'
import { submittedOption } from './evaluationProgress.js'

export const RESULT_PREPARATION_MS = 60000
export const RESULT_RELEASE_EVENT = 'vx-assessment-result-release-changed'
const PUBLISHED_KEY = 'vx-assessment-published'
const read = (storage, key, fallback = {}) => {
  try { return JSON.parse(storage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}
const idOf = assessment => assessment.id || assessment.assessmentId || assessment.setup?.assessmentId
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0
const marksOf = question => {
  const parts = question.descriptiveSections?.length ? question.descriptiveSections : question.subQuestions
  if (parts?.length) return parts.reduce((sum, part) => sum + marksOf(part), 0)
  if (question.children?.length) return question.children.reduce((sum, part) => sum + marksOf(part), 0)
  return number(question.marks) || (question.type === 'MCQ' ? 1 : 0)
}

/** Shared with faculty marking; attempt suffix prevents reusing descriptive marks after a reset. */
export function automatedEvaluationKey(assessment, studentId, attempt) {
  return `vx-assessment-student-question-evaluation:${idOf(assessment)}:${studentId}${descriptiveInputEnabled(assessment) ? `:attempt-${attempt.appliedResetVersion || 0}` : ''}`
}

/**
 * Grade submitted MCQs using saved keys and descriptive responses using the shared
 * practice keyword-coverage rule. Preserve faculty marks and flag unsupported responses.
 * @returns {{evaluation:Object, result:Object}} Student result contains status, marks,
 * section totals, submittedAt, releaseAt and attemptVersion; publication is per student.
 */
export function prepareAssessmentResult(assessment, attempt, previous = {}, evaluation = {}, now = Date.now()) {
  if (!attempt.isAssessmentSubmitted || !Number.isFinite(Date.parse(attempt.submittedAt))) return null
  const setup = { ...assessment, ...assessment.setup }
  setup.examDeliveryMode = setup.examDeliveryMode || setup.examMode || 'Online'
  const questions = assessment.questionRows || assessment.questions || assessment.selectedQuestions || setup.questionRows || []
  if (!questions.length) return null
  const mcqs = questions.filter(q => q.type === 'MCQ')
  const descriptive = questions.filter(q => q.type !== 'MCQ')
  const policy = getAssessmentAutomationConfiguration(setup, { hasMcq: !!mcqs.length, hasDescriptive: !!descriptive.length })
  const sameAttempt = previous.submittedAt === attempt.submittedAt && previous.attemptVersion === (attempt.appliedResetVersion || 0)
  const next = { ...evaluation }
  const items = []
  mcqs.forEach((question, index) => {
    const key = String(question.id || question.questionId || question._id || `mcq-${index + 1}`)
    const options = (question.options || []).filter(option => String(option.label ?? option.text ?? option.value ?? option.title ?? '').replace(/<[^>]*>/g, '').trim())
    const correct = options.map((option, i) => (question.correctOptionIds || []).map(String).includes(String(option.id)) ? i : -1).filter(i => i >= 0)
    const maxMarks = marksOf(question)
    const selected = submittedOption(attempt, String(question.id ?? `mcq-${index}`), options.length)
    if (policy.rows.find(row => row.key === 'mcq')?.evaluation && (correct.length || selected === null) && !next[key]?.manualOverride) {
      next[key] = { status: selected === null ? 'not-attempted' : correct.includes(selected) ? 'correct' : 'wrong', marks: selected !== null && correct.includes(selected) ? maxMarks : 0, autoEvaluated: true }
    }
    items.push({ key, maxMarks, section: 'mcq' })
  })
  const responses = normalizeDescriptiveResponses(descriptive, attempt.descriptiveAnswers)
  const gradeDescriptive = policy.rows.find(row => row.key === 'descriptive')?.evaluation
  descriptive.forEach((question, index) => descriptiveResponseItems(question, index).forEach(({ key, item }) => {
    const maxMarks = marksOf(item)
    items.push({ key, maxMarks, section: 'descriptive' })
    // Never replace faculty marks or a manual validation error during reconciliation.
    const existing = next[key]
    if (!gradeDescriptive || existing?.manualOverride || existing?.error || ['evaluated', 'not-attempted', 'correct', 'wrong'].includes(existing?.status)) return
    const grade = evaluateDescriptiveAnswer(responses[key] ?? '', item.answerKey || item.modelAnswer || item.rationale || item.explanation || '', maxMarks, { strict: true })
    next[key] = {
      status: grade.reviewRequired ? 'pending' : !hasAnswerContent(responses[key] ?? '') ? 'not-attempted' : 'evaluated',
      marks: grade.earnedMarks ?? '', autoEvaluated: !grade.reviewRequired,
      reviewRequired: Boolean(grade.reviewRequired), gradingMethod: 'keyword-coverage-v1',
      coverageRatio: grade.ratio, reviewStatus: grade.status,
      feedback: grade.reason || `Model-answer keyword coverage: ${Math.round(grade.ratio * 100)}%. ${grade.earnedMarks} / ${maxMarks} marks.`,
    }
  }))
  const valid = item => {
    const value = next[item.key]
    return value && !value.error && ['correct', 'wrong', 'not-attempted', 'evaluated'].includes(value.status)
      && String(value.marks ?? '').trim() !== '' && Number.isFinite(Number(value.marks)) && Number(value.marks) >= 0 && Number(value.marks) <= item.maxMarks
  }
  const complete = items.length > 0 && items.every(valid)
  const releaseAt = new Date(Date.parse(attempt.submittedAt) + RESULT_PREPARATION_MS).toISOString()
  const publish = complete && policy.canAutoPublishCombined && now >= Date.parse(releaseAt)
  const alreadyPublished = sameAttempt && previous.status === 'published'
  const sections = Object.fromEntries(['mcq', 'descriptive'].map(section => {
    const rows = items.filter(item => item.section === section)
    return [section, { marks: rows.reduce((sum, item) => sum + (valid(item) ? number(next[item.key].marks) : 0), 0), maxMarks: rows.reduce((sum, item) => sum + item.maxMarks, 0), complete: rows.every(valid) }]
  }))
  return { evaluation: next, result: {
    submittedAt: attempt.submittedAt, attemptVersion: attempt.appliedResetVersion || 0, releaseAt,
    autoPublish: policy.canAutoPublishCombined,
    status: publish || alreadyPublished ? 'published' : complete ? 'evaluated' : 'evaluating',
    publishedAt: alreadyPublished ? previous.publishedAt : publish ? new Date(now).toISOString() : null,
    sections, marks: sections.mcq.marks + sections.descriptive.marks,
    maxMarks: sections.mcq.maxMarks + sections.descriptive.maxMarks,
    message: !complete && descriptive.length && !sections.descriptive.complete
      ? (setup.descriptiveAutoEvaluation === 'Yes' ? 'Descriptive Answers Need Review' : 'Awaiting Faculty Evaluation')
      : !complete ? 'Check Answer Key' : '',
  } }
}

/** Process persisted submissions on app start and while open. Timestamp-based reconciliation
 * catches up after refresh/sleep; a backend should run this same release rule server-side.
 * Returns true when records changed. Writes errors propagate so callers can report/retry.
 */
export function reconcileAssessmentResults(storage = localStorage, now = Date.now()) {
  const assessments = read(storage, PUBLISHED_KEY, [])
  if (!Array.isArray(assessments)) return false
  let changed = false
  const save = (key, value) => {
    const json = JSON.stringify(value)
    if (storage.getItem(key) !== json) { storage.setItem(key, json); changed = true }
  }
  const updated = assessments.map(assessment => {
    const setup = { ...assessment, ...assessment.setup }
    const attemptKey = /practice/i.test(setup.supervisionType || '') ? 'vx-online-practice-exam-attempts' : 'vx-online-proctored-exam-attempts'
    const storedAttempts = read(storage, attemptKey)
    const attempts = closeExpiredPresentAttempts(assessment, storedAttempts[idOf(assessment)] || {}, storage, now)
    if (JSON.stringify(attempts) !== JSON.stringify(storedAttempts[idOf(assessment)] || {})) save(attemptKey, { ...storedAttempts, [idOf(assessment)]: attempts })
    const roster = assessmentRoster(assessment)
    const absentIds = new Set(roster.filter(student => normalizeEvaluationAttendance(student.attendance || student.attendanceStatus) === 'A').map(student => String(student.id || student.studentId || student.registerId)))

    const results = { ...assessment.studentResults }
    const statusKey = `vx-assessment-student-evaluation-status:${idOf(assessment)}`
    const statuses = read(storage, statusKey)
    let processed = false
    for (const [studentId, attempt] of Object.entries(attempts)) {
      if (absentIds.has(studentId)) continue
      if (!attempt.isAssessmentSubmitted) {
        if (results[studentId]) { delete results[studentId]; delete statuses[studentId]; processed = true }
        continue
      }
      const key = automatedEvaluationKey(assessment, studentId, attempt)
      const prepared = prepareAssessmentResult(assessment, attempt, results[studentId], read(storage, key), now)
      if (!prepared) continue
      processed = true
      appendAssessmentHistory(assessment, { id: `submit:${studentId}:${attempt.submittedAt}`, action: 'Student submitted', timestamp: attempt.submittedAt, notes: studentId }, storage)
      if (JSON.stringify(results[studentId]) !== JSON.stringify(prepared.result)) {
        const status = prepared.result.status
        appendAssessmentHistory(assessment, { id: `result:${studentId}:${attempt.submittedAt}:${status}:${prepared.result.marks}`, action: status === 'published' ? 'Result published' : status === 'evaluated' ? 'Evaluation completed' : 'Evaluation in progress', timestamp: status === 'published' ? prepared.result.publishedAt : new Date(now).toISOString(), notes: studentId }, storage)
      }
      results[studentId] = prepared.result
      save(key, prepared.evaluation)
      const completed = prepared.result.status !== 'evaluating'
      statuses[studentId] = { ...statuses[studentId], status: completed ? 'Completed' : 'Yet to Start', markedEvaluated: completed, autoEvaluated: true, resultStatus: prepared.result.status }
    }
    if (!processed) return assessment
    save(statusKey, statuses)
    // A student's release must never publish another student's incomplete result.
    const rosterIds = roster.filter(student => !absentIds.has(String(student.id || student.studentId || student.registerId))).map(student => student.id || student.studentId || student.registerId).filter(Boolean).map(String)
    const allPublished = rosterIds.length > 0 && rosterIds.every(id => results[id]?.status === 'published')
    return { ...assessment, students: roster, studentResults: results, evaluationStatus: allPublished ? 'Published' : assessment.evaluationStatus === 'Published' && !assessment.automatedResultRelease ? 'Published' : 'In Progress',
      ...(allPublished ? { automatedResultRelease: true, resultStatus: 'Published', resultsPublishedAt: assessment.resultsPublishedAt || new Date(now).toISOString() }
        : assessment.automatedResultRelease ? { resultStatus: 'Pending', resultsPublishedAt: null } : {}) }
  })
  save(PUBLISHED_KEY, updated)
  return changed
}

/** A student's automatic result is only visible for the currently submitted attempt. */
export function getStudentReleasedResult(assessment, studentId, storage = localStorage) {
  const result = assessment.studentResults?.[studentId]
  if (!result) return null
  const attempt = readAssessmentAttempt(assessment, studentId, storage)
  return attempt.isAssessmentSubmitted && result.submittedAt === attempt.submittedAt && result.attemptVersion === (attempt.appliedResetVersion || 0) ? result : null
}
