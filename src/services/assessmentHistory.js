export const assessmentHistoryId = record => record?.setup?.assessmentId || record?.assessmentId || record?.activityId || record?.id
export const assessmentDisplayId = record => record?.setup?.assessmentCode || record?.assessmentCode || assessmentHistoryId(record) || 'ID unavailable'
const keyOf = record => `vx-assessment-history:${assessmentHistoryId(record)}`
/** Append a persisted lifecycle event. Supply a stable event id for retry-safe automatic events.
 * @param {Object} record Assessment or approval record with a stable assessment identity.
 * @param {{id?:string,action:string,timestamp?:string,actor?:string,notes?:string}} event
 */
export function appendAssessmentHistory(record, event, storage = localStorage) {
  if (!assessmentHistoryId(record)) return
  const rows = JSON.parse(storage.getItem(keyOf(record)) || '[]')
  const next = { ...event, id: event.id || crypto.randomUUID(), timestamp: event.timestamp || new Date().toISOString() }
  if (rows.some(row => row.id === next.id)) return
  storage.setItem(keyOf(record), JSON.stringify([...rows, next]))
}
/** Merge recorded legacy events with the append-only history; never infer missing actions. */
export function readAssessmentHistory(record, storage = localStorage) {
  const rows = JSON.parse(storage.getItem(keyOf(record)) || '[]')
  const setup = record.setup || {}
  const add = (action, timestamp, notes = '', actor = '') => { if (timestamp) rows.push({ id: `${action}:${timestamp}:${notes}`, action, timestamp, notes, actor }) }
  add('Assessment created', setup.createdAt || record.createdAt)
  if ((setup.draftCode || record.draftCode) && !assessmentDisplayId(record).startsWith('DRF-')) add('Permanent assessment ID issued', record.publishedAt, (setup.draftCode || record.draftCode) + ' ? ' + assessmentDisplayId(record))
  add('Sent for approval', record.sentAt, record.approvalFaculty?.note || '', record.senderName || '')
  if (record.approvalStatus === 'Approved' || /reject/i.test(record.approvalStatus || '')) {
    add(record.approvalStatus, record.reviewedAt || record.approvedAt || record.rejectedAt, record.reviewRemarks || '', record.reviewerName || '')
  }
  add('Results published', record.resultsPublishedAt || record.publishedResultAt)
  for (const log of record.publishedLog || []) add(log.remarks || 'Published', log.timestamp, '', log.facultyName || log.facultyId)
  for (const [student, result] of Object.entries(record.studentResults || {})) {
    add('Student submitted', result.submittedAt, student)
    add('Result published', result.publishedAt, student)
  }
  const unique = new Map(rows.map(row => [`${row.action}:${row.timestamp}:${row.notes || ''}`, row]))
  return [...unique.values()].sort((a,b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
}
