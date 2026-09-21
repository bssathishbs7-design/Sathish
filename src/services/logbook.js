import { getLogbookGroups } from './logbookSchemas.js'
import { CATEGORIES, FACULTY, SAMPLE_ENTRIES, SUBJECTS } from './logbookSample.js'

/**
 * @typedef {Object} LogbookEntry
 * @property {string} id
 * @property {string} subject Subject catalogue name.
 * @property {string} cat Category catalogue ID.
 * @property {string} date Local ISO date (YYYY-MM-DD).
 * @property {'Draft'|'Pending'|'Approved'|'Returned'} status
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
export const STORAGE_KEY = 'medsy-logbook-deltas-v3'
const emptyDeltas = () => ({ added: [], edits: {}, removed: [] })
export const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export const facultyName = (id) => FACULTY.find((item) => item.id === id)?.name || 'Not selected'
export const entryTitle = (entry) => entry.values.activity || entry.values.topic || entry.values.diagnosis || entry.values.provDx || entry.values.notable || entry.values.place || CATEGORIES.find(category => category.id === entry.cat)?.shortName || CATEGORIES.find(category => category.id === entry.cat)?.name || 'Untitled entry'
export const formatDate = (value) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'

export function readDeltas(storage = window.localStorage) {
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) return emptyDeltas()
  const data = JSON.parse(raw)
  if (!data || !Array.isArray(data.added) || !Array.isArray(data.removed) || !data.edits || typeof data.edits !== 'object' || Array.isArray(data.edits)) {
    throw new Error('Saved Logbook data could not be read. Your saved data has been kept; please contact support.')
  }
  return data
}

/** Pure reconciliation: tombstones apply to seeds and added entries alike. */
export function applyDeltas(deltas, seeds = SAMPLE_ENTRIES) {
  const entries = [...deltas.added, ...seeds.filter((seed) => !deltas.added.some((entry) => entry.id === seed.id))]
  return entries.filter((entry) => !deltas.removed.includes(entry.id)).map((entry) => {
    const edit = deltas.edits[entry.id] || {}
    return { ...entry, ...edit, values: { ...entry.values, ...edit.values }, extra: { ...entry.extra, ...edit.extra } }
  })
}

export function validateEntry(entry, submit = false, now = today()) {
  const errors = {}
  const subject = SUBJECTS.find((item) => item.name === entry.subject)
  const category = CATEGORIES.find((item) => item.id === entry.cat)
  if (!subject) errors.subject = 'Select a subject.'
  if (!category || (category.legacy && !subject?.categories.includes(entry.cat))) errors.cat = 'Select a category for this subject.'
  const values = entry.values || {}
  const fields = getLogbookGroups(entry.cat, entry.subject, Boolean(entry.linkedTo)).filter(group => !group.locked).flatMap(group => group.fields)
  const valueOf = key => key === 'date' ? entry.date : values[key]
  for (const field of fields) {
    const value = valueOf(field.key)
    if (field.type === 'date' && value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value || value > now)) errors[field.key] = 'Use a valid date that is not in the future.'
    if (submit && field.required && !String(value || '').trim()) errors[field.key] = 'This field is required.'
    if (submit && value && field.type === 'number' && (!/^\d+$/.test(String(value)) || Number(value) < 1)) errors[field.key] = 'Enter a whole number of at least 1.'
    if (submit && value && field.options && !field.options.includes(value)) errors[field.key] = 'Choose one of the listed options.'
  }
  if (fields.some(field => field.key === 'admission') && values.admission && values.discharge && values.admission > values.discharge) errors.discharge = 'Discharge must be on or after admission.'
  if (submit) {
    if (!FACULTY.some((person) => person.id === entry.faculty)) errors.faculty = 'Select a verifying faculty member.'
    if (!entry.fAck) errors.fAck = 'Confirm that this entry is accurate.'
  }
  if ((entry.extra?.remarks || '').length > 500) errors.remarks = 'Use no more than 500 characters.'
  if ((entry.extra?.attachments || []).length > 3) errors.attachments = 'Attach up to three photos.'
  return errors
}

export function skillProgress(entries, subject) {
  return subject.skills.map((skill) => {
    const attempts = entries.filter((entry) => entry.subject === subject.name && entry.cat === 'cert' && entry.values.competency === skill.code)
    const approved = attempts.filter((entry) => entry.status === 'Approved').length
    return { ...skill, approved, complete: approved >= skill.required, attempts }
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
    const text = [entry.subject, entry.status, facultyName(entry.faculty), ...Object.values(entry.values), entry.extra?.notes, entry.extra?.remarks, entry.extra?.facultyRemarks, ...(entry.extra?.comments || []).map((comment) => comment.text)].join(' ').toLowerCase()
    return terms.every((term) => text.includes(term))
  })
}

export async function listLogbookEntries() { return applyDeltas(readDeltas()) }
function commit(deltas) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deltas)) }
  catch { throw new Error('Unable to save Logbook changes. Free some browser storage and try again. Your form is still open.') }
  window.dispatchEvent(new Event('medsy-logbook-changed'))
  return applyDeltas(deltas)
}
/** Merge an entry mutation against the latest storage snapshot; never overwrite signed fields. */
export async function saveLogbookEntry(entry, submit = false) {
  const deltas = readDeltas()
  if (deltas.removed.includes(entry.id)) throw new Error('This entry has been withdrawn. Close this form and create a new entry.')
  const current = applyDeltas(deltas).find((item) => item.id === entry.id)
  if (current && !['Draft', 'Pending'].includes(current.status)) throw new Error('This entry has already been reviewed. Reopen it to see the latest decision.')
  if (current && (current.subject !== entry.subject || current.cat !== entry.cat)) throw new Error('Subject and category cannot change on an existing entry.')
  if (entry.linkedTo) {
    const all = applyDeltas(deltas)
    const parent = all.find((item) => item.id === entry.linkedTo)
    if (!parent || parent.status !== 'Returned' || parent.subject !== entry.subject || parent.cat !== entry.cat) throw new Error('The original returned entry is no longer available.')
    if (all.some((item) => item.linkedTo === parent.id && item.id !== entry.id && item.status !== 'Returned')) throw new Error('A remedial attempt already exists. Continue that attempt instead.')
  }
  const errors = validateEntry(entry, submit)
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
  const { fAck, ...record } = entry
  const saved = { ...record, ...(record.cat === 'clerkship' ? { date: record.values.discharge || record.values.admission || record.date } : {}), updatedAt: new Date().toISOString(), status: submit ? 'Pending' : 'Draft', ...(submit && fAck ? { submittedAt: new Date().toISOString() } : {}), extra: { ...record.extra, comments: current?.extra?.comments || [] } }
  if (current) deltas.edits[entry.id] = { ...deltas.edits[entry.id], ...saved }
  else deltas.added.unshift(saved)
  return commit(deltas)
}
export async function updateLogbookEntry(id, action, payload = {}) {
  const deltas = readDeltas()
  const entry = applyDeltas(deltas).find((item) => item.id === id)
  if (!entry) throw new Error('This entry is no longer available.')
  let patch
  if (action === 'notes') patch = { extra: { ...entry.extra, notes: payload.text, notesEdited: new Date().toISOString() } }
  else if (action === 'comment') {
    if (!payload.text?.trim()) throw new Error('Write a comment before posting.')
    patch = { extra: { ...entry.extra, comments: [...(entry.extra?.comments || []), { id: crypto.randomUUID(), by: payload.by === 'faculty' ? 'faculty' : 'learner', who: payload.who || 'Learner', date: new Date().toISOString(), text: payload.text.trim() }] } }
  } else if (action === 'withdraw') {
    if (!['Draft', 'Pending'].includes(entry.status)) throw new Error('Only drafts and pending entries can be withdrawn.')
    deltas.removed.push(id)
  } else if (action === 'review') {
    if (entry.status !== 'Pending') throw new Error('Only pending entries can be reviewed.')
    if (!['Approved', 'Returned'].includes(payload.status)) throw new Error('Select a valid decision.')
    patch = { status: payload.status, verifiedAt: new Date().toISOString(), extra: { ...entry.extra, facultyRemarks: payload.remarks?.trim() || '' } }
  } else throw new Error('Unknown Logbook action.')
  if (patch) deltas.edits[id] = { ...deltas.edits[id], ...patch }
  return commit(deltas)
}
export async function resetLogbook() { return commit(emptyDeltas()) }
