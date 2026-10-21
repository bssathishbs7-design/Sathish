import { assessmentRoster } from './assessmentRoster.js'
export { assessmentRoster } from './assessmentRoster.js'
import { getAssessmentAutomationConfiguration } from './assessmentAutomation.js'
import { normalizeEvaluationAttendance } from './evaluationAttendance.js'

const read = (storage, key) => { try { return JSON.parse(storage.getItem(key) || '{}') } catch { return {} } }
const studentId = student => String(student.id || student.studentId || student.registerId || '')
function timestamp(date, time, period = '') {
  const parts = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const display = String(date || '').match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  const clock = String(time || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if ((!parts && !display) || !clock) return NaN
  const [year, month, day] = (parts ? parts.slice(1) : display.slice(1).reverse()).map(Number)
  let hour = Number(clock[1]); const minute = Number(clock[2]); const meridiem = (clock[3] || period).toUpperCase()
  if (minute > 59 || hour > (meridiem ? 12 : 23) || (meridiem && hour < 1)) return NaN
  if (meridiem) hour = hour % 12 + (meridiem === 'PM' ? 12 : 0)
  const value = new Date(year, month - 1, day, hour, minute)
  return value.getFullYear() === year && value.getMonth() === month - 1 && value.getDate() === day ? value.getTime() : NaN
}
/** Complete expired present students' saved attempts. Never invent answers or grade absent students.
 * @param {Object} assessment Published assessment with an assigned roster and schedule.
 * @param {Object} attempts Student-id keyed persisted attempts.
 * @param {Storage} storage Exam sessions and extension storage.
 * @param {number} now Current epoch milliseconds.
 * @returns {Object} Updated attempts, retaining all saved responses.
 */
export function closeExpiredPresentAttempts(assessment, attempts, storage, now) {
  const setup = { ...assessment, ...assessment.setup }
  const questions = assessment.questionRows || assessment.questions || setup.questionRows || []
  const policy = getAssessmentAutomationConfiguration(setup, { hasMcq: questions.some(q => q.type === 'MCQ'), hasDescriptive: questions.some(q => q.type !== 'MCQ') })
  if (!policy.rows.length || !policy.rows.every(row => row.evaluation) || setup.examDeliveryMode === 'Offline' || assessment.examMode === 'Offline') return attempts
  const id = assessment.id || setup.assessmentId
  const sessions = read(storage, 'vx-student-exam-session')[id] || {}
  const extensions = read(storage, 'vx-student-exam-time-extensions')[id] || {}
  const practice = /practice/i.test(setup.supervisionType || '')
  const start = timestamp(assessment.startDate || setup.examDate || setup.practiceStartDate, assessment.startTime || setup.startTime || setup.practiceStartTime, setup.startPeriod || setup.practiceStartPeriod)
  const duration = String(assessment.totalDuration || setup.totalDuration || setup.proctoredTotalDuration || '').match(/^(\d+):(\d{2})$/)
  const minutes = duration ? Number(duration[1]) * 60 + Number(duration[2]) : 0
  const practiceEnd = practice ? timestamp(setup.practiceEndDate || assessment.endDate, setup.practiceEndTime || assessment.endTime, setup.practiceEndPeriod) : NaN
  const baseEnd = practice && Number.isFinite(practiceEnd) ? practiceEnd : minutes > 0 ? start + minutes * 60000 : NaN
  if (!Number.isFinite(baseEnd)) return attempts
  const next = { ...attempts }
  for (const student of assessmentRoster(assessment)) {
    const sid = studentId(student)
    const attendance = normalizeEvaluationAttendance(student.attendance || student.attendanceStatus)
    if (!sid || attendance === 'A' || next[sid]?.isAssessmentSubmitted) continue
    if (attendance !== 'P' && !sessions[sid]?.loginTime && !next[sid]?.hasStarted) continue
    const extension = extensions[sid] || {}
    const extra = Math.max(0, Number(extension.extensionMinutes) || 0) + Object.values(extension.sectionExtensions || {}).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0)
    const end = baseEnd + extra * 60000
    if (now < end) continue
    next[sid] = { ...next[sid], answers: next[sid]?.answers || {}, descriptiveAnswers: next[sid]?.descriptiveAnswers || {}, appliedResetVersion: next[sid]?.appliedResetVersion || 0, isAssessmentSubmitted: true, submittedAt: new Date(end).toISOString(), autoSubmittedAt: new Date(now).toISOString(), submissionReason: 'schedule-ended', isMcqSubmitted: questions.some(q => q.type === 'MCQ'), isDescriptiveSubmitted: questions.some(q => q.type !== 'MCQ') }
  }
  return next
}
