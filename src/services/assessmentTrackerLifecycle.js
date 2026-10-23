import { assessmentRoster } from './assessmentRoster.js'
import { readAssessmentAttempt } from './descriptiveResponses.js'

export const parseAssessmentDate = (value) => {
  if (!value) return null
  const normalized = String(value).trim()
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const displayMatch = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/)

  if (isoMatch) return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
  if (displayMatch) return new Date(Number(displayMatch[3]), Number(displayMatch[2]) - 1, Number(displayMatch[1]))

  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const applyAssessmentTime = (date, value) => {
  if (!date) return null
  const nextDate = new Date(date)
  const match = String(value || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i)

  if (!match) {
    nextDate.setHours(0, 0, 0, 0)
    return nextDate
  }

  let hours = Number(match[1])
  const minutes = Number(match[2] || 0)
  const period = String(match[3] || '').toUpperCase()

  if (period === 'PM' && hours < 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  nextDate.setHours(hours, minutes, 0, 0)
  return nextDate
}

const parseAssessmentDurationMs = (value) => {
  const match = String(value || '').trim().match(/^(\d+)(?::(\d{2}))?$/)
  if (!match) return 0
  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  return ((hours * 60) + minutes) * 60 * 1000
}

export const formatAssessmentRemainingTime = (value) => {
  const totalSeconds = Math.max(0, Math.floor((value || 0) / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (item) => String(item).padStart(2, '0')

  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  return `${pad(minutes)}:${pad(seconds)}`
}

const getDayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const getPublishedAssessmentScheduleStatus = (assessment, now = new Date()) => {
  const startDate = parseAssessmentDate(assessment?.startDate)
  if (!startDate) return null

  const startAt = applyAssessmentTime(startDate, assessment?.startTime)
  const durationMs = parseAssessmentDurationMs(assessment?.totalDuration)
  const durationEndAt = durationMs ? new Date(startAt.getTime() + durationMs) : null
  const endDate = parseAssessmentDate(assessment?.endDate)
  const dateEndAt = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null
  const endAt = [durationEndAt, dateEndAt].filter(Boolean).sort((a, b) => a - b)[0] || startAt
  if (now >= endAt) return { type: 'completed', label: 'Exam completed' }
  if (now >= startAt) return { type: 'live', label: 'Assessment Live', remainingMs: endAt.getTime() - now.getTime() }

  const diffMs = startAt.getTime() - now.getTime()
  const minutes = Math.max(1, Math.ceil(diffMs / (60 * 1000)))
  const startDay = getDayStart(startAt)
  const currentDay = getDayStart(now)
  const calendarDays = Math.round((startDay.getTime() - currentDay.getTime()) / (24 * 60 * 60 * 1000))

  if (calendarDays >= 1) {
    return { type: 'upcoming', startsInMs: diffMs, label: `${calendarDays} ${calendarDays === 1 ? 'day' : 'days'} to go` }
  }

  if (minutes > 5 && minutes >= 60) {
    const hours = Math.max(1, Math.floor(minutes / 60))
    return { type: 'upcoming', startsInMs: diffMs, label: `${hours} ${hours === 1 ? 'hour' : 'hours'} to go` }
  }

  return { type: 'upcoming', startsInMs: diffMs, label: `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} to go` }
}

/** Tab projections share records; live exams intentionally appear in both tabs. */
export const hasPublishedResults = assessment => [assessment?.resultStatus, assessment?.evaluationStatus]
  .some(status => String(status || '').toLowerCase() === 'published')
export const splitPublishedAssessmentRows = (rows = [], now = new Date()) => {
  const published = [], evaluation = [], results = []
  rows.forEach(assessment => {
    const stage = getPublishedAssessmentScheduleStatus(assessment, now)?.type
    const released = hasPublishedResults(assessment)
    if (stage === 'live' || (!released && stage !== 'completed')) published.push(assessment)
    if (released || stage === 'live' || stage === 'completed') evaluation.push(assessment)
    if (released) results.push(assessment)
  })
  return { published, evaluation, results }
}

/** Submitted sections can be evaluated without touching sections still being answered. */
export function hasSubmittedResponses(assessment, studentId) {
  const attempt = readAssessmentAttempt(assessment, studentId)
  return Boolean(attempt.isAssessmentSubmitted || attempt.isMcqSubmitted || attempt.isDescriptiveSubmitted)
}

/** Gate live evaluation against the same assigned roster used by the evaluation page. */
export function canStartLiveEvaluation(assessment) {
  return assessmentRoster(assessment).some(student => hasSubmittedResponses(assessment, student.id || student.studentId || student.registerId))
}

