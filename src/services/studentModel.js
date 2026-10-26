/** Academic records are separate from profile revisions. Dates are ISO calendar dates.
 * @typedef {{id:string,year:string,academicYear:string,start:string,end:string|null,outcome:string,section:string}} YearEntry
 * @typedef {{id:string,trackingId:string,registrationId:string,batch:string,entries:YearEntry[],history:Array,academicRevision:number,revision:number}} Student
 */
export const YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Internship']
export const STAGE_TAGS = ['I', 'II', 'III-1', 'III-2', 'CRMI']
export const COURSES = ['MBBS']
export const SUBJECTS = {
  'First Year': ['Human Anatomy', 'Physiology', 'Biochemistry'],
  'Second Year': ['Pathology', 'Pharmacology', 'Microbiology'],
  'Third Year': ['Community Medicine', 'Forensic Medicine', 'Ophthalmology', 'Otorhinolaryngology'],
  'Fourth Year': ['General Medicine', 'General Surgery', 'Paediatrics', 'Obstetrics and Gynaecology'],
  Internship: ['General Medicine', 'General Surgery', 'Community Medicine', 'Paediatrics', 'Obstetrics and Gynaecology'],
}
export const DEPARTMENTS = ['N/A', ...new Set(Object.values(SUBJECTS).flat())]
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
export const academicYearFor = date => `${date.slice(0, 4)}-${Number(date.slice(0, 4)) + 1}`
export const normaliseAcademicYear = value => String(value || '').trim().replace(/\s+/g, '').replace('/', '-')
export const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
export const validYear = value => /^\d{4}-\d{4}$/.test(value || '') && Number(value.slice(5)) === Number(value.slice(0, 4)) + 1
export const withinYear = (date, year) => validDate(date) && validYear(year) && date >= `${year.slice(0, 4)}-01-01` && date <= `${year.slice(5)}-12-31`
export const phoneIdentity = student => (student.code || '+91').replace(/\D/g, '') + String(student.phone || '').replace(/\D/g, '')
export const fail = message => { throw new Error(message) }
export const uid = () => crypto.randomUUID()
export const currentEntry = student => student.entries.find(entry => entry.outcome === 'Current')
export function issueTrackingId(data, batch) {
  data.counters[batch] = (data.counters[batch] || 0) + 1
  return `MDS-${batch}-${String(data.counters[batch]).padStart(4, '0')}`
}
/** Version 1 migration preserves raw audit events. Missing historic attempts are not invented. */
export function migrateDirectory(source) {
  if (![1, 2].includes(source?.version) || !Array.isArray(source.students) || !Array.isArray(source.batches) || !Array.isArray(source.moves)) fail('Saved student data could not be read. Your stored data has not been overwritten.')
  const data = structuredClone(source)
  data.counters ||= {}
  for (const student of data.students) {
    const match = /^MDS-(\d{4})-(\d+)$/.exec(student.trackingId || '')
    if (match) data.counters[match[1]] = Math.max(data.counters[match[1]] || 0, Number(match[2]))
  }
  for (const batch of data.batches) batch.subjectSyllabuses ||= {}
  for (const student of data.students) {
    student.year = student.year === 'Final Year' ? 'Fourth Year' : student.year
    student.course ||= data.batches.find(batch => batch.id === student.batch)?.course || 'MBBS'
    student.department ||= student.subject || 'N/A'
    student.trackingId ||= issueTrackingId(data, student.batch)
    student.academicRevision ||= 0
    student.subjectSyllabuses ||= {}
    student.history ||= []
    student.graduated = student.graduated ?? student.year === 'Graduated'
    if (student.status === 'Graduated') { student.status = 'Active'; student.migrationNote = 'Legacy graduation did not record account status. Active is the migration default; verify this account.' }
    if (!student.entries) {
      student.entries = student.tracked && !student.graduated ? [{ id: `migrated-${student.id}`, year: student.year, academicYear: student.academicYear, start: student.startedAt, end: null, outcome: 'Current', section: student.section }] : []
      student.migrationNote ||= 'Imported legacy record. Earlier year attempts were not reconstructed; original audit events are retained.'
    }
  }
  // Old moves saved full profiles, not academic snapshots. Retain for audit, never unsafe rollback.
  for (const move of data.moves) if (!move.students.every(item => item.beforeAcademic)) move.legacy = true
  data.version = 2
  return data
}
export const academicSnapshot = student => structuredClone(Object.fromEntries(['entries', 'year', 'academicYear', 'startedAt', 'graduated', 'completedOn', 'tracked'].map(key => [key, student[key] ?? null])))
export function syncAcademic(student) {
  const entry = currentEntry(student)
  if (entry) { student.year = entry.year; student.academicYear = entry.academicYear; student.startedAt = entry.start; student.graduated = false; student.completedOn = null }
  else if (student.graduated) student.year = 'Graduated'
}
export function canUndo(student, member, move) { return Boolean(student && !move.legacy && !member.undone && student.academicRevision === member.afterAcademicRevision) }
export function effectiveSyllabus(data, student, subject) { return student.subjectSyllabuses?.[`${student.year}:${subject}`] || student.syllabus || data.batches.find(batch => batch.id === student.batch)?.subjectSyllabuses?.[`${student.year}:${subject}`] || data.batches.find(batch => batch.id === student.batch)?.syllabus || 'CBME 2024' }
/** Shared create validation; edits validate changed profile fields only. */
export function validateStudent(draft, data, original) {
  const errors = {}, changed = key => !original || draft[key] !== original[key]
  if (changed('name') && !/^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,79}$/u.test(draft.name || '')) errors.name = 'Use 2-80 characters: letters, spaces, apostrophes, periods or hyphens.'
  if (changed('registrationId') && !/^[\p{L}\p{N}._/-]{1,40}$/u.test(draft.registrationId || '')) errors.registrationId = 'Use up to 40 letters, numbers or . _ / - separators.'
  if (changed('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email || '')) errors.email = 'Enter a valid email address.'
  if (changed('phone') && !/^\+?[\d ()-]+$/.test(draft.phone || '')) errors.phone = 'Enter a valid phone number.'
  if (changed('code') && !/^\+\d{1,4}$/.test(draft.code || '+91')) errors.code = 'Enter a valid country calling code.'
  const digits = String(draft.phone || '').replace(/\D/g, '')
  if (changed('phone') && (digits.length < 7 || digits.length > 15 || (({ '+91': 10, '+1': 10, '+44': 10, '+61': 9, '+971': 9 }[draft.code || '+91']) && digits.length !== { '+91': 10, '+1': 10, '+44': 10, '+61': 9, '+971': 9 }[draft.code || '+91']))) errors.phone = 'Enter a valid phone number for the country code (India: 10 digits).'
  if (changed('section') && !/^(?:[A-O]|N\/A)$/.test(draft.section || '')) errors.section = 'Choose N/A or SGT A to O.'
  if (changed('department') && !DEPARTMENTS.includes(draft.department || draft.subject)) errors.department = 'Choose a supported department or N/A.'
  for (const key of ['registrationId', 'email', 'phone']) {
    const normalise = value => key === 'phone' ? String(value || '').replace(/\D/g, '') : String(value || '').trim().toLowerCase()
    if ((changed(key) || (key === 'phone' && changed('code'))) && data.students.some(student => student.id !== original?.id && (key === 'phone' ? phoneIdentity(student) === phoneIdentity(draft) : normalise(student[key]) === normalise(draft[key])))) errors[key] = `This ${key === 'registrationId' ? 'student ID' : key} already exists.`
  }
  if (!original) {
    const year = normaliseAcademicYear(draft.academicYear)
    if (!COURSES.includes(draft.course)) errors.course = 'Choose a supported course.'
    if (!validYear(year)) errors.academicYear = 'Use consecutive years, for example 2026-2027.'
    const maxDate = new Date(); maxDate.setFullYear(maxDate.getFullYear() + 1)
    const followsBatchStart = draft.joinedOn === data.batches.find(batch => batch.id === draft.batch && batch.course === draft.course)?.startsOn
    if (!withinYear(draft.joinedOn, year) || (!followsBatchStart && draft.joinedOn > maxDate.toISOString().slice(0, 10))) errors.joinedOn = 'Choose a joining date within the academic year and no more than a year ahead.'
    const cohort = Number(draft.batch), derived = Number(year.slice(0, 4))
    if (!data.batches.some(batch => batch.id === draft.batch && batch.course === draft.course) || cohort < Math.max(2000, derived - 9) || cohort > derived) errors.batch = 'Choose a matching course batch, no more than nine years before the academic year.'
    if (cohort < derived && draft.batchReason === 'Other' && !draft.batchReasonDetail?.trim()) errors.batchReasonDetail = 'Explain the earlier-batch reason.'
    if (cohort < derived && !draft.batchReason?.trim()) errors.batchReason = 'Give a reason for joining an earlier batch.'
  }
  return errors
}
