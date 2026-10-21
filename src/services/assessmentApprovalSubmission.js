/** Commit an approval submission and withdraw its published version atomically.
 * @param {Object} payload Submission with setup.assessmentId and optional sourcePublishedId.
 * @param {Object[]} rows Updated approval queue.
 * @param {Storage} local Local persistent assessment storage.
 * @param {Storage} session Approval queue storage.
 */
export function commitAssessmentApprovalSubmission(payload, rows, local, session) {
  const writes = [[session, 'vx-approval-queue-rows', JSON.stringify(rows)]]
  if (payload.activityType === 'Assessment' && payload.setup?.assessmentId) {
    const ids = [payload.setup.assessmentId, payload.setup.sourcePublishedId].filter(Boolean)
    for (const key of ['vx-assessment-published', 'vx-assessment-drafts']) {
      const records = JSON.parse(local.getItem(key) || '[]')
      if (!Array.isArray(records)) throw new Error('Assessment storage could not be read. Please try again.')
      writes.push([local, key, JSON.stringify(records.filter(row => !ids.includes(row.id) && !ids.includes(row.setup?.assessmentId)))])
    }
  }
  const backups = writes.map(([storage, key]) => [storage, key, storage.getItem(key)])
  try { for (const [storage, key, value] of writes) storage.setItem(key, value) }
  catch (error) {
    for (const [storage, key, value] of backups.reverse()) {
      if (value === null) storage.removeItem(key)
      else storage.setItem(key, value)
    }
    throw error
  }
}
