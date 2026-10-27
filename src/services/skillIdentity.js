import { createDraftRecordCode } from '../utils/draftReference.js'
import { mintRecordId, formatQid, isPermanentRecordId } from '../utils/qid.js'
const KEY = 'vx-skill-identities'
export const skillIdentityKey = record => {
  const key = String(record.sourceActivityId || record.activityData?.activity?.id || record.activityId || record.id || '')
  if (record.sourceActivityId || record.activityData?.activity?.id) return key
  const assignments = JSON.parse(globalThis.sessionStorage?.getItem('vx-assigned-skill-activities') || '[]')
  const assigned = assignments.find(row => row.id === key)
  return String(assigned?.sourceActivityId || key.replace(/^evaluation-/, ''))
}
export function readSkillIdentity(record, storage = globalThis.localStorage) {
  return JSON.parse(storage.getItem(KEY) || '{}')[skillIdentityKey(record)] || null
}
/** Single registry joins configuration, assignment instances, results and logbook projections by source activity. */
export function ensureSkillIdentity(record, assigned = false, storage = globalThis.localStorage) {
  const key = skillIdentityKey(record)
  if (!key) throw new Error('Activity identity is missing.')
  const rows = JSON.parse(storage.getItem(KEY) || '{}')
  const draftCode = rows[key]?.draftCode || record.draftCode || createDraftRecordCode('SA')
  const previous = rows[key] || { draftCode, code: isPermanentRecordId(record.activityCode, 'SA') ? record.activityCode : draftCode, history: [{ action: 'Activity created', timestamp: record.createdAt || new Date().toISOString(), code: draftCode }] }
  const next = { ...previous }
  if (assigned && next.code.startsWith('DRF-')) {
    const sampleIndex = ['act-4','fy-1','fy-2','sy-1','sy-2','ty-1','ty-2','sample-blood-group','sample-landmarks'].indexOf(key)
    next.code = sampleIndex >= 0 ? formatQid('SA', sampleIndex + 1) : mintRecordId('SA', { storage, existing: Object.values(rows) })
    next.history = [...next.history, { action: 'First assigned', timestamp: record.assignedAt || new Date().toISOString(), code: next.code }]
  }
  if (!rows[key] || next.code !== previous.code) storage.setItem(KEY, JSON.stringify({ ...rows, [key]: next }))
  return next
}

/** Record lifecycle events against the source activity, preserving the draft-to-permanent audit trail. */
export function appendSkillIdentityEvent(record, action, timestamp = new Date().toISOString(), storage = globalThis.localStorage) {
  const identity = ensureSkillIdentity(record, true, storage)
  if (identity.history.some(event => event.action === action && event.timestamp === timestamp)) return identity
  const next = { ...identity, history: [...identity.history, { action, timestamp, code: identity.code }] }
  const rows = JSON.parse(storage.getItem(KEY) || '{}')
  storage.setItem(KEY, JSON.stringify({ ...rows, [skillIdentityKey(record)]: next }))
  return next
}
