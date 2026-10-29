/**
 * Approval requests retain their original domain payload for existing review editors.
 * @typedef {Object} ApprovalRequest
 * @property {string} id Stable request identity (not the published item ID).
 * @property {string} activityId Source item identity.
 * @property {string} activityType Question Bank, Assessment, Blueprint, or Evaluation.
 * @property {string} senderId Author employee ID.
 * @property {string} reviewerId Selected reviewer employee ID.
 * @property {string} sentAt ISO submission time; changes on resubmission.
 * @property {Object<string,string>} [seenBy] Reviewer ID to the submission timestamp seen.
 * @property {Array<ApprovalRequest>} [previousSubmissions] Immutable earlier submissions.
 */
export const QUEUE_KEY = 'vx-approval-queue-rows'
export const QUEUE_CACHE_KEY = 'medsy-approval-queue-v1'
export const APPROVAL_TYPES = ['All', 'Question', 'Assessment', 'Blueprint', 'Skill Assessment']
export const APPROVAL_STATUSES = ['Requests', 'Approved', 'Returned']
const DAY = 86400000
export const reviewerKey = user => String(user?.id || user?.registerId || user?.employeeId || '')
export const requestKey = row => String(row.itemKey || row.id || `${row.activityType}:${row.activityId}`)
export const submittedTime = row => Date.parse(row.sentAt || row.receivedAt || row.submittedAt || '') || 0
export const requestTitle = row => row.assessmentName || row.activityName || row.title || 'Untitled request'
export const requestType = row => {
  const type = String(row.activityType || '').toLowerCase()
  if (type === 'question bank' || type === 'question') return 'Question'
  if (type === 'blueprint') return 'Blueprint'
  if (type === 'assessment') return 'Assessment'
  return 'Skill Assessment'
}
export const requestStatus = row => {
  const status = String(row.approvalStatus || row.reviewStatus || row.status || '').toLowerCase()
  if (/withdraw/.test(status)) return 'Withdrawn'
  if (/reject|return/.test(status)) return 'Returned'
  if (/approved|published/.test(status)) return 'Approved'
  return 'Requests'
}
export const isWithdrawnQuestion = question => Boolean(question.withdrawnAt || /withdrawn/i.test(question.reviewStatus || question.status || ''))
export const isReturnedQuestion = question => Boolean(question.autoReturnedAt)
export const isInactiveQuestion = question => isWithdrawnQuestion(question) || isReturnedQuestion(question)
export function questionDecision(question, draft = {}) {
  return isWithdrawnQuestion(question) ? 'Withdrawn' : isReturnedQuestion(question) ? 'Returned' : draft.decision || question.reviewStatus || 'Pending'
}
export function questionReviewSummary(questions, drafts = {}) {
  return questions.reduce((counts, question, index) => {
    const decision = questionDecision(question, drafts[question.id ?? `question-${index}`])
    const key = decision.toLowerCase()
    return { ...counts, [key]: (counts[key] || 0) + 1 }
  }, { pending: 0, approved: 0, rejected: 0, withdrawn: 0, returned: 0 })
}
export const submissionVersion = row => row.sentAt || row.receivedAt || row.submittedAt || row.id
export const seenToken = row => `${requestKey(row)}@${submissionVersion(row)}`
export const isNewRequest = (row, user) => requestStatus(row) === 'Requests'
  && (row.seenItemsBy?.[reviewerKey(user)]?.[requestKey(row)] || row.seenBy?.[reviewerKey(user)]) !== submissionVersion(row)
/** Project one item per question without changing the submission reviewed by the existing editor.
 * itemKey identifies a visible item; sourceRequest retains the complete batch and original id.
 */
export function queueItems(rows) {
  return rows.flatMap(row => {
    if (row.sourceRequest) return [row]
    if (requestType(row) !== 'Question') return [row]
    return (row.questionRows || []).map((question, index) => ({ ...row,
      itemKey: `${requestKey(row)}:question:${question.id || question.qid || question.draftRef || index}`,
      sourceRequest: row, question,
      activityName: question.questionText || question.question || question.title || 'Untitled question',
      assessmentName: undefined,
      approvalStatus: isWithdrawnQuestion(question) ? 'Withdrawn' : isReturnedQuestion(question) ? 'Returned'
        : question.reviewStatus && question.reviewStatus !== 'Pending' ? question.reviewStatus
          : requestStatus(row) === 'Requests' ? 'Pending Approval' : row.approvalStatus || row.status,
      reviewedAt: question.reviewedAt || question.autoReturnedAt || row.reviewedAt,
      reviewRemarks: question.reviewRemarks || '',
      returnDueAt: question.returnDueAt || row.returnDueAt,
    }))
  })
}
/** Frontend filtering only. The API must independently enforce reviewer permissions. */
export function canReviewRequest(row, user) {
  if (!reviewerKey(user)) return false
  if (user.role === 'Admin') return true
  return String(row.reviewerId || row.approvalFaculty?.employeeId || '') === reviewerKey(user)
}
export const visibleRequests = (rows, user) => rows.filter(row => canReviewRequest(row, user))
export function markRequestsSeen(rows, ids, user) {
  const keys = new Set(ids)
  return rows.map(row => {
    if (!canReviewRequest(row, user)) return row
    const items = queueItems([row]).filter(item => keys.has(requestKey(item)) || keys.has(requestKey(row)))
    if (!items.length) return row
    const seen = { ...row.seenItemsBy?.[reviewerKey(user)] }
    items.forEach(item => { seen[requestKey(item)] = submissionVersion(row) })
    return { ...row, seenItemsBy: { ...row.seenItemsBy, [reviewerKey(user)]: seen } }
  })
}
export function matchesRequest(row, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const questions = row.question ? [row.question] : row.questionRows || []
  const text = [requestTitle(row), requestType(row), row.senderName, row.senderId, row.senderDesignation, row.activityId,
    row.assessmentId, row.blueprintId, row.setup?.assessmentId, row.setup?.blueprintId, row.origin,
    row.tags, row.competency, row.activityType, ...questions.flatMap(q => [q.id, q.qid, q.draftRef, q.draftCode, q.questionBankId, q.draftId, q.competency, q.tags, q.question, q.questionText])]
    .map(value => typeof value === 'object' ? JSON.stringify(value) : value || '').join(' ').toLowerCase()
  return words.every(word => text.includes(word))
}
/** Stable author ID groups requests; legacy records without one use their name. */
export function groupByFaculty(rows, user) {
  const groups = new Map()
  for (const row of rows) {
    const id = String(row.senderId || row.senderName || 'unknown')
    if (!groups.has(id)) groups.set(id, { id, name: row.senderName || 'Unknown faculty', designation: row.senderDesignation || '', rows: [] })
    groups.get(id).rows.push(row)
  }
  return [...groups.values()].map(group => {
    const pending = group.rows.filter(row => requestStatus(row) === 'Requests')
    return { ...group, waiting: pending.length, newCount: pending.filter(row => isNewRequest(row, user)).length,
      oldest: Math.min(...pending.map(submittedTime).filter(Boolean), Infinity) }
  }).sort((a, b) => b.newCount - a.newCount || b.waiting - a.waiting || (a.oldest === b.oldest ? 0 : a.oldest - b.oldest) || a.name.localeCompare(b.name))
}
/** Insights count individual submission attempts decided in the last 90 days, including resubmissions. */
export function queueInsights(rows, now = Date.now()) {
  const requests = [...new Map(rows.map(row => { const original = row.sourceRequest || row; return [requestKey(original), original] })).values()]
  const history = queueItems(requests.flatMap(row => [...(row.previousSubmissions || []), row]))
  const decided = history.filter(row => ['Approved', 'Returned'].includes(requestStatus(row))
    && Date.parse(row.reviewedAt) >= now - 90 * DAY && Date.parse(row.reviewedAt) <= now)
  const durations = decided.filter(row => submittedTime(row) > 0).map(row => (Date.parse(row.reviewedAt) - submittedTime(row)) / DAY).filter(value => Number.isFinite(value) && value >= 0)
  durations.sort((a, b) => a - b)
  const middle = Math.floor(durations.length / 2)
  return { count: decided.length, percent: decided.length ? Math.round(decided.filter(row => requestStatus(row) === 'Approved').length / decided.length * 100) : null,
    days: durations.length ? (durations[middle] + durations[Math.floor((durations.length - 1) / 2)]) / 2 : null,
    waiting: queueItems(rows).filter(row => requestStatus(row) === 'Requests').length }
}
export function waitingDays(row, now = Date.now()) { return submittedTime(row) ? Math.max(0, Math.floor((now - submittedTime(row)) / DAY)) : 0 }
/** Section 6: only questions have the 14-day return policy. */
export function questionReturnDeadline(row) {
  if (requestType(row) !== 'Question') return null
  const explicit = Date.parse(row.returnDueAt || '')
  return Number.isFinite(explicit) ? explicit : submittedTime(row) ? submittedTime(row) + 14 * DAY : null
}
export function returnDays(row, now = Date.now()) {
  const deadline = questionReturnDeadline(row)
  return deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / DAY))
}
export function sortQueueItems(rows, status) {
  return [...rows].sort((a, b) => (status === 'Requests' ? submittedTime(a) - submittedTime(b)
    : (Date.parse(b.reviewedAt) || 0) - (Date.parse(a.reviewedAt) || 0)) || requestKey(a).localeCompare(requestKey(b)))
}
/** Save a durable local mock. Production must replace this with a server-owned queue. */
export function persistQueueCache(rows, storage) { storage.setItem(QUEUE_CACHE_KEY, JSON.stringify(rows)) }
export function restoreQueueCache(storage) {
  try { const rows = JSON.parse(storage.getItem(QUEUE_CACHE_KEY) || 'null'); return Array.isArray(rows) ? rows : null } catch { return null }
}
/** Reject stale, already decided, or unauthorised reviews before any domain side effects. */
export function assertReviewable(current, submitted, user) {
  if (!current || !canReviewRequest(current, user)) throw new Error('This request is not assigned to you.')
  if (current.questionRows?.some(question => question.changeKind)) throw new Error('Lifecycle request decisions require the archive, delete and restore workflow integration.')
  if (requestStatus(current) !== 'Requests') throw new Error('This request has already been reviewed or withdrawn. Return to the queue.')
  if (current.id !== submitted.id || current.sentAt !== submitted.sentAt) throw new Error('A newer submission is available. Reopen it from the queue.')
  const inactiveVersions = row => (row.questionRows || []).map(question => [question.id, question.withdrawnAt, question.autoReturnedAt])
  if (JSON.stringify(inactiveVersions(current)) !== JSON.stringify(inactiveVersions(submitted))) throw new Error('The questions have changed. Reopen this request from the queue.')
}
/** Validate the decision payload independently of button enabled states. */
export function assertReviewDecision(record) {
  if (requestType(record) === 'Question') {
    const questions = (record.questionRows || []).filter(question => !isWithdrawnQuestion(question) && !isReturnedQuestion(question))
    if (questions.some(question => !['Approved', 'Rejected'].includes(question.reviewStatus))) throw new Error('Decide every remaining question before submitting.')
    if (questions.some(question => question.reviewStatus === 'Rejected' && !question.reviewRemarks?.trim())) throw new Error('Add remarks to every rejected question.')
  } else if (requestStatus(record) === 'Returned' && !record.reviewRemarks?.trim()) throw new Error('Add remarks before rejecting this request.')
}

/** Persisted decision version and per-viewer acknowledgement; legacy decisions have no badge. */
export const hasUnseenDecision = (row, user) => Boolean(row.decisionNoticeVersion)
  && ['Approved', 'Returned'].includes(requestStatus(row))
  && row.decisionSeenBy?.[reviewerKey(user)]?.[requestKey(row)] !== row.decisionNoticeVersion

/** Acknowledge only the decided items actually opened in the results view. */
export function markDecisionsSeen(rows, ids, user) {
  const keys = new Set(ids)
  return rows.map(row => {
    if (!canReviewRequest(row, user)) return row
    const unseen = queueItems([row]).filter(item => keys.has(requestKey(item)) && hasUnseenDecision(item, user))
    if (!unseen.length) return row
    const seen = { ...row.decisionSeenBy?.[reviewerKey(user)] }
    unseen.forEach(item => { seen[requestKey(item)] = item.decisionNoticeVersion })
    return { ...row, decisionSeenBy: { ...row.decisionSeenBy, [reviewerKey(user)]: seen } }
  })
}
