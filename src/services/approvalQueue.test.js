import test from 'node:test'
import assert from 'node:assert/strict'
import { hasUnseenDecision, markDecisionsSeen, assertReviewable, assertReviewDecision, canReviewRequest, groupByFaculty, isNewRequest, isWithdrawnQuestion, markRequestsSeen,
  matchesRequest, persistQueueCache, queueInsights, requestStatus, requestType, restoreQueueCache, returnDays, visibleRequests, waitingDays } from './approvalQueue.js'
import { resolveApprovalReviewer } from './approvalReviewers.js'
const user = { registerId: 'EMP1', role: 'Faculty' }
const base = { id: 'r1', activityId: 'a1', activityType: 'Assessment', senderId: 'S1', senderName: 'Zara',
  reviewerId: 'EMP1', approvalStatus: 'Pending Approval', sentAt: '2026-10-01T12:00:00Z' }
test('reviewer visibility is scoped and admin visibility is explicit', () => {
  assert.equal(canReviewRequest(base, user), true)
  assert.equal(canReviewRequest(base, { registerId: 'EMP2', role: 'Faculty' }), false)
  assert.equal(canReviewRequest(base, { registerId: 'EMP2', role: 'Admin' }), true)
  assert.equal(canReviewRequest(base, {}), false)
  assert.deepEqual(visibleRequests([base, { ...base, id: 'other', reviewerId: 'EMP2' }], user), [base])
})
test('seen state is per user and per submission; a resubmission is new again', () => {
  const [seen] = markRequestsSeen([base], ['r1'], user)
  assert.equal(isNewRequest(seen, user), false)
  assert.equal(isNewRequest(seen, { registerId: 'ADMIN', role: 'Admin' }), true)
  assert.equal(isNewRequest({ ...seen, sentAt: '2026-10-02T12:00:00Z' }, user), true)
  assert.equal(base.seenBy, undefined)
  assert.equal(markRequestsSeen([base], ['r1'], { registerId: 'other' })[0], base)
})
test('faculty order uses new, waiting, age, then name and never merges equal names with different IDs', () => {
  const seen = { EMP1: base.sentAt }
  const rows = [{ ...base, senderId: 'old', senderName: 'Same', seenBy: seen },
    { ...base, id: 'r2', senderId: 'new', senderName: 'Same', sentAt: '2026-10-02T12:00:00Z' },
    { ...base, id: 'r3', senderId: 'done', approvalStatus: 'Approved' }]
  assert.deepEqual(groupByFaculty(rows, user).map(group => group.id), ['new', 'old', 'done'])
  assert.deepEqual(groupByFaculty([{ ...base, senderName: 'Z' }, { ...base, id: '2', senderId: 'S2', senderName: 'A' }], user).map(group => group.name), ['A', 'Z'])
})
test('status, type and search support blueprint IDs, question tags and returned records', () => {
  assert.equal(requestStatus({ approvalStatus: 'Approval Rejected' }), 'Returned')
  assert.equal(requestStatus({ approvalStatus: 'Withdrawn' }), 'Withdrawn')
  assert.equal(requestStatus({ approvalStatus: 'Published' }), 'Approved')
  assert.equal(requestType({ activityType: 'Blueprint' }), 'Blueprint')
  assert.equal(requestType({ activityType: 'Evaluation' }), 'Skill Assessment')
  assert.equal(matchesRequest({ ...base, setup: { blueprintId: 'SRMC-BP-25' }, questionRows: [{ tags: ['AN1.1'] }] }, 'bp-25 AN1.1 Zara'), true)
  assert.equal(matchesRequest(base, 'unrelated'), false)
})
test('stale, unauthorised and already completed decisions are blocked', () => {
  assert.doesNotThrow(() => assertReviewable(base, base, user))
  assert.throws(() => assertReviewable({ ...base, sentAt: 'later' }, base, user), /newer submission/)
  assert.throws(() => assertReviewable({ ...base, approvalStatus: 'Approved' }, base, user), /already/)
  assert.throws(() => assertReviewable(base, base, { registerId: 'other' }), /not assigned/)
})
test('insights include previous attempts and exclude decisions outside the 90-day window', () => {
  const rows = [{ ...base, approvalStatus: 'Approved', reviewedAt: '2026-10-03T12:00:00Z', previousSubmissions: [
    { ...base, approvalStatus: 'Approval Rejected', reviewedAt: '2026-10-02T12:00:00Z' },
    { ...base, approvalStatus: 'Approved', reviewedAt: '2025-10-02T12:00:00Z' },
  ] }]
  assert.deepEqual(queueInsights(rows, Date.parse('2026-10-04T00:00:00Z')), { count: 2, percent: 50, days: 1.5, waiting: 0 })
  assert.equal(queueInsights([]).percent, null)
})
test('age indicators need valid timestamps; return deadline is explicit', () => {
  const now = Date.parse('2026-10-12T12:00:00Z')
  assert.equal(waitingDays(base, now), 11)
  assert.equal(returnDays(base, now), null)
  assert.equal(returnDays({ ...base, activityType: 'Question Bank', returnDueAt: '2026-10-15T12:00:00Z' }, now), 3)
  assert.equal(isWithdrawnQuestion({ status: 'Withdrawn' }), true)
  assert.equal(isWithdrawnQuestion({ withdrawnAt: '2026-10-10' }), true)
})
test('cache survives a new session and corrupt storage falls back safely', () => {
  let value = null; const storage = { getItem: () => value, setItem: (key, next) => { value = next } }
  assert.equal(restoreQueueCache(storage), null)
  persistQueueCache([base], storage)
  assert.deepEqual(restoreQueueCache(storage), [base])
  value = '{bad'; assert.equal(restoreQueueCache(storage), null)
})
test('typed mismatched reviewer details cannot be submitted', () => {
  const reviewer = { facultyName: 'Dr. Meera Nair', employeeId: 'EMP1021', designation: 'Professor' }
  assert.ok(resolveApprovalReviewer(reviewer))
  assert.equal(resolveApprovalReviewer({ ...reviewer, employeeId: 'EMP999' }), null)
})
test('all active questions need decisions and every rejected item needs remarks', () => {
  const row = { activityType: 'Question Bank', questionRows: [{ reviewStatus: 'Rejected' }, { status: 'Withdrawn' }] }
  assert.throws(() => assertReviewDecision(row), /remarks/)
  row.questionRows[0].reviewRemarks = 'Please clarify the wording.'
  assert.doesNotThrow(() => assertReviewDecision(row))
  row.questionRows[0].reviewStatus = 'Pending'
  assert.throws(() => assertReviewDecision(row), /Decide every/)
  assert.throws(() => assertReviewDecision({ activityType: 'Evaluation', approvalStatus: 'Approval Rejected' }), /remarks/)
  assert.doesNotThrow(() => assertReviewDecision({ activityType: 'Evaluation', approvalStatus: 'Approval Rejected', reviewRemarks: 'Review marks.' }))
})

test('decision badges persist until viewed and are scoped to viewer and decision version', () => {
  const approved = { ...base, approvalStatus: 'Approved', decisionNoticeVersion: 'decision-1' }
  assert.equal(hasUnseenDecision(base, user), false)
  assert.equal(hasUnseenDecision({ ...approved, decisionNoticeVersion: undefined }, user), false)
  assert.equal(hasUnseenDecision(approved, user), true)
  assert.equal(hasUnseenDecision(JSON.parse(JSON.stringify(approved)), user), true)
  const [seen] = markDecisionsSeen([approved], ['r1'], user)
  assert.equal(hasUnseenDecision(seen, user), false)
  assert.equal(hasUnseenDecision(seen, { registerId: 'OTHER' }), true)
  assert.equal(hasUnseenDecision({ ...seen, decisionNoticeVersion: 'decision-2', approvalStatus: 'Rejected' }, user), true)
  assert.equal(markDecisionsSeen([approved], ['r1'], { registerId: 'OTHER' })[0], approved)
  assert.equal(markDecisionsSeen([approved], [], user)[0], approved)
})
