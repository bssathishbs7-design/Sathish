import { questionDisplayId } from '../utils/questionLifecycle.js'
import { assessmentDisplayId } from './assessmentHistory.js'
import { requestType, submittedTime } from './approvalQueue.js'

export const plainQuestionText = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim()
export const queueItemId = row => row.question ? row.question.qid || row.question.questionBankId || row.question.bankId || row.question.draftRef || questionDisplayId(row.question)
  : requestType(row) === 'Blueprint' ? row.blueprintId || row.setup?.blueprintId || row.blueprintSnapshot?.blueprintId || '' : assessmentDisplayId(row)
export function questionOrigin(question, request = {}) {
  const source = question.sourceBankId || question.derivedFrom || question.sourceQuestionId || question.originalQuestionId || ''
  if (question.changeKind) return `${String(question.changeKind).replace(/^./, letter => letter.toUpperCase())} request${source ? ` · ${source}` : ''}`
  if (question.replaceQuestionId || question.questionBankEditMode === 'overwrite') return `Edit of ${source || question.questionBankId || question.qid || 'the original question'} · replaces it under the same ID`
  if (String(source).includes('-AQ-')) return `From ${request.assessmentName || request.activityName || 'assessment'} · ${source}`
  if (String(source).startsWith('MED-')) return `New institution question from Medsy ${source}`
  if (source) return `New question from ${source}${question.sourceAuthorName ? ` by ${question.sourceAuthorName}` : ''} · original unchanged`
  if (/excel|upload/i.test([question.origin, question.source, question.importSource, request.origin].filter(Boolean).join(' '))) return 'Excel upload'
  return question.origin || request.origin || 'My Questions'
}
export function relativeTime(value, now = Date.now()) {
  const time = typeof value === 'number' ? value : Date.parse(value)
  if (!Number.isFinite(time) || time <= 0) return ''
  const minutes = Math.max(0, Math.floor((now - time) / 60000))
  return minutes < 1 ? 'just now' : minutes < 60 ? `${minutes} min ago` : minutes < 1440 ? `${Math.floor(minutes / 60)} h ago` : `${Math.floor(minutes / 1440)} days ago`
}
export function queueTime(value, now = Date.now(), relative = true) {
  const time = typeof value === 'number' ? value : Date.parse(value)
  if (!Number.isFinite(time) || time <= 0) return 'Not recorded'
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(time)
  const clock = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(time)
  return `${date}, ${clock}${relative ? ` · ${relativeTime(time, now)}` : ''}`
}
export function durationLabel(days) {
  if (days === null) return 'Not available'
  const minutes = Math.round(days * 1440)
  return minutes < 1 ? 'Less than a minute' : minutes < 60 ? `${minutes} min` : minutes < 1440 ? `${Math.round(minutes / 60)} h` : `${Number(days.toFixed(1))} days`
}
/** Compare median time using a 20% band; this describes recorded decisions, not reviewer quality. */
export function insightSummary(own, total) {
  if (!own.count) return 'No decisions in the last 90 days yet.'
  const approval = own.percent >= 80 ? 'Usually approved' : own.percent >= 50 ? 'Mostly approved' : 'Often returned'
  if (own.days === null || total.days === null) return approval
  const speed = own.days < total.days * .8 ? 'decided faster than most' : own.days > total.days * 1.2 ? 'takes longer than most' : 'decided in the usual time'
  return `${approval} · ${speed}`
}
export function facultyDates(items) {
  const requests = [...new Map(items.map(row => { const original = row.sourceRequest || row; return [original.id, original] })).values()]
  const dates = requests.flatMap(row => [...(row.previousSubmissions || []), row]).map(submittedTime).filter(Boolean)
  return { count: requests.reduce((count, row) => count + 1 + (row.previousSubmissions?.length || 0), 0), first: Math.min(...dates), last: Math.max(...dates) }
}
