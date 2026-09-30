/** Shared local workflow rules. The API must enforce the same rules using authenticated identities. */
export const LOGBOOK_TEXT_LIMIT = 500
export const isLoggedEntry = entry => ['Pending', 'Approved', 'Returned'].includes(entry.status)
/** Shared entry prerequisites for faculty readiness and learner submission. */
export function signoffEligibility(entries) {
  const pending = entries.filter(entry => ['Pending', 'To do'].includes(entry.status)).length
  const approved = entries.filter(entry => entry.status === 'Approved').length
  return { pending, approved, allowed: !pending && approved > 0, reason: pending ? `Clear pending entries and assigned tasks first (${pending} remaining).` : !approved ? 'At least one approved entry is required before final approval.' : '' }
}
/** A confirmation is valid only for the exact approval round and step reviewed. */
export const signoffVersion = record => JSON.stringify([record?.status || 'Not ready', record?.step, ['Submitted', 'Returned', 'Completed'].includes(record?.status) ? record.chain : null, record?.submittedAt, record?.history || []])
export const entrySubjectLocked = (entry, signoffs = []) => signoffs.some(record => record.studentId === (entry.studentId || 'MC2568') && record.subject === entry.subject && ['Submitted', 'Completed'].includes(record.status))
export const subjectApproval = (state, studentId, subject) => (state?.workflow || state)?.signoffs?.[`${studentId}:${subject}`]
export function subjectWriteBlock(state, studentId, subject) {
  const status = subjectApproval(state, studentId, subject)?.status
  return status === 'Completed' ? 'This subject logbook is signed off. Its records cannot be changed.'
    : status === 'Submitted' ? 'This subject logbook is awaiting final approval. Its records are read-only until it is returned.' : ''
}
export function assertSubjectWritable(state, studentId, subject) {
  const reason = subjectWriteBlock(state, studentId, subject)
  if (reason) throw new Error(reason)
}
/** Existing longer content may remain unchanged or be shortened; new content uses the agreed limit. */
export const textLimitFor = previous => Math.max(LOGBOOK_TEXT_LIMIT, String(previous || '').length)
export const validLogbookText = (value, previous = '') => String(value || '').length <= LOGBOOK_TEXT_LIMIT || (String(value || '').length <= String(previous || '').length && String(previous || '').length > LOGBOOK_TEXT_LIMIT)
export function assertLogbookText(value, label, previous = '') {
  if (!validLogbookText(value, previous)) throw new Error(`${label}: use no more than ${LOGBOOK_TEXT_LIMIT} characters. Existing longer text can be kept or shortened.`)
}
