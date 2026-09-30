import { assertSubjectWritable, assertLogbookText, validLogbookText, isLoggedEntry } from './logbookPolicy.js'
import { entryTitle } from './logbookTitles.js'
export { entryTitle } from './logbookTitles.js'
import { getLogbookGroups } from './logbookSchemas.js'
import { CATEGORIES, COHORT_ENTRIES, FACULTY, SAMPLE_ENTRIES, SUBJECTS } from './logbookSample.js'
import { belongsTo, isGraded, eligibleReviewers, matchesRemedial, learnerName } from './logbookPeople.js'
import { collectSkills, certificationTarget, REQUIREMENTS_VERSION } from './logbookProgress.js'

/**
 * @typedef {Object} LogbookEntry
 * @property {string} id
 * @property {string} subject Subject catalogue name.
 * @property {string} cat Category catalogue ID.
 * @property {string} date Local ISO date (YYYY-MM-DD).
 * @property {'Draft'|'Pending'|'Approved'|'Returned'|'To do'} status
 * @property {string} faculty Faculty catalogue ID.
 * @property {string} [linkedTo] Returned parent entry ID.
 * @property {Object<string,string>} values Schema field values.
 * @property {{attempt: 'F'|'R'|'Re', rating: 'M'|'B'|'E', decision: 'C'|'R'|'Re'}} [grading] Opaque institution-supplied grading codes.
 * @property {Object} extra Remarks, notes, notesEdited, facultyRemarks, comments and attachments.
 * @property {string} [submittedAt] Learner acknowledgement timestamp.
 * @property {string} [verifiedAt] Faculty decision timestamp.
 *
 * Attachment shape: {name, kind:'image', dataUrl}; local demo stores bounded image data.
 * Comment shape: {id, by:'learner'|'faculty', who, date, text}.
 * API integration must authenticate actors, enforce signed-record locks, and replace
 * attachment data URLs with durable upload references. Never trust client-side roles.
 */
export const STORAGE_KEY = 'medsy-logbook-app-v4'
export const LEGACY_STORAGE_KEY = 'medsy-logbook-deltas-v3'
const emptyDeltas = () => ({ added: [], edits: {}, removed: [] })
export const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export const facultyName = (id) => FACULTY.find((item) => item.id === id)?.name || 'Not selected'
export const formatDate = (value) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'

export function readDeltas(storage = window.localStorage) {
  const raw = storage.getItem(STORAGE_KEY) || storage.getItem(LEGACY_STORAGE_KEY)
  if (!raw) return emptyDeltas()
  const data = JSON.parse(raw)
  if (!data || !Array.isArray(data.added) || !Array.isArray(data.removed) || !data.edits || typeof data.edits !== 'object' || Array.isArray(data.edits)) {
    throw new Error('Saved Logbook data could not be read. Your saved data has been kept; please contact support.')
  }
  const records = [...data.added, ...Object.values(data.edits)]
  if (data.signoffs || data.chains || records.some(record => record && ('student' in record || 'assigned' in record || 'decided' in record || record.values?.compNo || ['slab','clerk','emerg','spec','jc','prac','vi','hi'].includes(record.cat)))) {
    const error = new Error('HTML prototype data was detected. It has been kept untouched. Start a separate app Logbook to continue; no prototype records will be imported.')
    error.code = 'PROTOTYPE_DATA'
    throw error
  }
  if (data.schemaVersion && data.schemaVersion !== 4) throw new Error('This Logbook data uses an unsupported version. Your saved records have been kept.')
  return data
}

/** Pure reconciliation: tombstones apply to seeds and added entries alike. */
export function applyDeltas(deltas, seeds = [...SAMPLE_ENTRIES, ...COHORT_ENTRIES]) {
  const entries = [...deltas.added, ...seeds.filter((seed) => !deltas.added.some((entry) => entry.id === seed.id))]
  return entries.filter((entry) => !deltas.removed.includes(entry.id)).map((entry) => {
    const edit = deltas.edits[entry.id] || {}
    return { ...entry, ...edit, values: { ...entry.values, ...edit.values }, extra: { ...entry.extra, ...edit.extra } }
  })
}

export function validateEntry(entry, submit = false, now = today(), previous = null) {
  const errors = {}
  const subject = SUBJECTS.find((item) => item.name === entry.subject)
  const category = CATEGORIES.find((item) => item.id === entry.cat)
  if (!subject) errors.subject = 'Select a subject.'
  if (!category || !subject?.categories.includes(entry.cat)) errors.cat = 'Select a category for this subject.'
  const values = entry.values || {}
  const fields = getLogbookGroups(entry.cat, entry.subject, Boolean(entry.linkedTo)).filter(group => !group.locked).flatMap(group => group.fields)
  const valueOf = key => key === 'date' ? entry.date : values[key]
  for (const field of fields) {
    if (field.key === 'numReq') continue
    const value = valueOf(field.key)
    if (field.type === 'date' && value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value || value > now)) errors[field.key] = 'Use a valid date that is not in the future.'
    if (submit && field.required && !String(value || '').trim()) errors[field.key] = 'This field is required.'
    if (submit && value && field.type === 'number' && (!/^\d+$/.test(String(value)) || Number(value) < 1)) errors[field.key] = 'Enter a whole number of at least 1.'
    if (submit && value && field.options && !field.options.includes(value)) errors[field.key] = 'Choose one of the listed options.'
  }
  if (fields.some(field => field.key === 'admission') && values.admission && values.discharge && values.admission > values.discharge) errors.discharge = 'Discharge must be on or after admission.'
  if (submit) {
    if (!eligibleReviewers(entry.subject).some((person) => person.id === entry.faculty)) errors.faculty = 'Select a faculty member from this subject department.'
    if (!entry.fAck) errors.fAck = 'Confirm that this entry is accurate.'
  }
  for (const key of ['remarks', 'notes', 'comment']) if (!validLogbookText(entry.extra?.[key], previous?.extra?.[key])) errors[key] = 'Use no more than 500 characters. Existing longer text can be kept or shortened.'
  if ((entry.extra?.attachments || []).length > 3) errors.attachments = 'Attach up to three photos.'
  return errors
}

export function skillProgress(entries, subject) {
  return collectSkills(subject.name, entries).map((skill) => {
    const attempts = entries.filter((entry) => entry.subject === subject.name && isLoggedEntry(entry) && isGraded(entry) && (entry.values.competency || entry.values.activity) === skill.code)
    const approved = attempts.filter((entry) => entry.status === 'Approved').length
    return { ...skill, approved, complete: skill.required > 0 && approved >= skill.required, attempts }
  })
}
export function subjectProgress(entries, subject) {
  const skills = skillProgress(entries, subject)
  const required = skills.reduce((sum, skill) => sum + skill.required, 0)
  const approved = skills.reduce((sum, skill) => sum + Math.min(skill.approved, skill.required), 0)
  return { required, approved, percent: required ? Math.round(approved / required * 100) : 0 }
}
export function searchEntries(entries, query) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  return entries.filter((entry) => {
    const text = [entry.subject, entry.status, entry.faculty, facultyName(entry.faculty), entryTitle(entry), CATEGORIES.find(category => category.id === entry.cat)?.name, CATEGORIES.find(category => category.id === entry.cat)?.shortName, ...Object.values(entry.values), entry.extra?.notes, entry.extra?.remarks, entry.extra?.facultyRemarks, ...(entry.extra?.comments || []).map((comment) => comment.text)].join(' ').toLowerCase()
    return terms.every((term) => text.includes(term))
  })
}

export async function listLogbookEntries() { return applyDeltas(readDeltas()) }
/** Begin a separate app namespace without importing or deleting prototype records. */
export async function startSeparateLogbook() {
  if (window.localStorage.getItem(STORAGE_KEY)) return listLogbookEntries()
  return commit(emptyDeltas())
}
export function commit(deltas) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...deltas, schemaVersion: 4 })) }
  catch { throw new Error('Unable to save Logbook changes. Free some browser storage and try again. Your form is still open.') }
  window.dispatchEvent(new Event('medsy-logbook-changed'))
  return applyDeltas(deltas)
}
/** Merge an entry mutation against the latest storage snapshot; never overwrite signed fields. */
export async function saveLogbookEntry(entry, submit = false, studentId = entry.studentId || 'MC2568') {
  const deltas = readDeltas()
  if (deltas.removed.includes(entry.id)) throw new Error('This entry has been withdrawn. Close this form and create a new entry.')
  const current = applyDeltas(deltas).find((item) => item.id === entry.id)
  if (current && !belongsTo(current, studentId)) throw new Error('This entry belongs to another student.')
  assertSubjectWritable(deltas, studentId, entry.subject)
  if (current) assertSubjectWritable(deltas, studentId, current.subject)
  if (current?.linkedTo && entry.linkedTo !== current.linkedTo) throw new Error('Keep the original remedial link.')
  if (current && !['Draft', 'Pending', 'To do'].includes(current.status) && !(current.status === 'Returned' && !isGraded(current))) throw new Error('This entry has already been reviewed. Reopen it to see the latest decision.')
  if (current && JSON.stringify(current.audit || []) !== JSON.stringify(entry.audit || [])) throw new Error('This entry has a newer faculty decision or reassignment. Reopen it before saving.')
  if (current?.updatedAt && current.updatedAt !== entry.updatedAt) throw new Error('This entry changed in another view. Reopen it before saving.')
  if (['Pending', 'Returned'].includes(current?.status) && (entry.cat !== current.cat || entry.subject !== current.subject)) throw new Error('Keep the original subject and category when correcting an entry.')
  if (current?.assignment && (entry.subject !== current.subject || entry.cat !== current.cat || entry.faculty !== current.faculty)) throw new Error('Keep the assigned subject, category and reviewer.')
  if (current?.assignment?.locked?.some(key => String(entry.values[key] || '') !== String(current.values[key] || ''))) throw new Error('Faculty-supplied task details cannot be changed.')
  if (entry.linkedTo) {
    const all = applyDeltas(deltas)
    const parent = all.find((item) => item.id === entry.linkedTo)
    if (!parent || !belongsTo(parent, studentId) || parent.status !== 'Returned' || !isGraded(parent) || parent.subject !== entry.subject || parent.cat !== entry.cat) throw new Error('The original returned entry is no longer available.')
    if (!matchesRemedial(parent, entry)) throw new Error('Keep the original competency for this remedial attempt.')
    if (!current && all.some((item) => matchesRemedial(parent, item) && item.id !== entry.id)) throw new Error('A remedial attempt already exists. Continue that attempt instead.')
  }
  const errors = validateEntry(entry, submit, today(), current)
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
  const { fAck, ...record } = entry
  record.values = { ...record.values }
  if (isGraded(record)) {
    record.values.numReq = String(certificationTarget(record.subject, record.values.competency || record.values.activity) || '')
    record.requirementsVersion = REQUIREMENTS_VERSION
  }
  const now = new Date().toISOString()
  const resubmitting = current?.status === 'Returned' && submit
  const extra = { ...record.extra, comments: current?.extra?.comments || [] }
  if (submit && extra.comment?.trim()) {
    extra.comments = [...extra.comments, { id: crypto.randomUUID(), authorId: studentId, by: 'learner', who: learnerName(studentId), date: now, text: extra.comment.trim() }]
    extra.comment = ''
  }
  const saved = { ...record, studentId, ...(record.cat === 'clerkship' ? { date: record.values.discharge || record.values.admission || record.date } : {}), updatedAt: now, status: submit ? 'Pending' : current?.status === 'Returned' ? 'Returned' : current?.assignment ? 'To do' : 'Draft', ...(submit && fAck ? { submittedAt: current?.status === 'Pending' ? current.submittedAt || now : now } : {}), ...(resubmitting ? { verifiedAt: null, audit: [...(current.audit || []), { actor: studentId, action: 'Resubmitted', at: now, remarks: '' }] } : {}), extra }
  if (current) deltas.edits[entry.id] = { ...deltas.edits[entry.id], ...saved }
  else deltas.added.unshift(saved)
  return commit(deltas)
}
export async function updateLogbookEntry(id, action, payload = {}) {
  const deltas = readDeltas()
  const entry = applyDeltas(deltas).find((item) => item.id === id)
  if (!entry) throw new Error('This entry is no longer available.')
  if (['notes', 'withdraw'].includes(action) && (!payload.studentId || !belongsTo(entry, payload.studentId))) throw new Error('Only the owner can change this entry.')
  let patch
  if (action === 'notes') { assertLogbookText(payload.text, 'Notes', entry.extra?.notes); patch = { extra: { ...entry.extra, notes: payload.text, notesEdited: new Date().toISOString() } } }
  else if (action === 'comment') {
    assertLogbookText(payload.text, 'Comment')
    if (!payload.text?.trim()) throw new Error('Write a comment before posting.')
    patch = { extra: { ...entry.extra, comments: [...(entry.extra?.comments || []), { id: crypto.randomUUID(), authorId: payload.authorId || '', by: payload.by === 'faculty' ? 'faculty' : 'learner', who: payload.who || 'Learner', date: new Date().toISOString(), text: payload.text.trim() }] } }
  } else if (action === 'withdraw') {
    assertSubjectWritable(deltas, entry.studentId || 'MC2568', entry.subject)
    if (!['Draft', 'Pending', 'Returned'].includes(entry.status)) throw new Error('Only drafts, pending and unlinked returned entries can be withdrawn.')
    if (entry.assignment || entry.linkedTo || applyDeltas(deltas).some(item => item.linkedTo === id)) throw new Error('Assigned or linked records cannot be deleted. Keep the review history intact.')
    deltas.removed.push(id)
  } else if (action === 'review') {
    if (!payload.actor) throw new Error('A faculty reviewer is required.')
    const { reviewEntries } = await import('./adminLogbook.js')
    return reviewEntries([id], payload.actor, payload)
  } else throw new Error('Unknown Logbook action.')
  if (patch) deltas.edits[id] = { ...deltas.edits[id], ...patch }
  return commit(deltas)
}
export async function resetLogbook(studentId) {
  if (!studentId) return commit(emptyDeltas())
  const deltas = readDeltas(), owned = new Set(applyDeltas(deltas).filter(entry => belongsTo(entry, studentId)).map(entry => entry.id))
  const seedIds = new Set([...SAMPLE_ENTRIES, ...COHORT_ENTRIES].filter(entry => belongsTo(entry, studentId)).map(entry => entry.id))
  deltas.added = deltas.added.filter(entry => !belongsTo(entry, studentId))
  deltas.edits = Object.fromEntries(Object.entries(deltas.edits).filter(([id]) => !owned.has(id) && !seedIds.has(id)))
  deltas.removed = deltas.removed.filter(id => !owned.has(id) && !seedIds.has(id))
  if (deltas.workflow) deltas.workflow.signoffs = Object.fromEntries(Object.entries(deltas.workflow.signoffs || {}).filter(([, record]) => record.studentId !== studentId))
  return commit(deltas)
}
