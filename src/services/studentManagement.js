/** Integration contract (all writes require student_management.edit and institution ownership).
 * Local persistence is a mock adapter, not an authentication or server-authorisation layer.
 * Production mappings:
 * batch/deleteBatch -> POST/DELETE /api/promotion/admin/batch
 * move -> POST /api/promotion/admin/move (student_ids, action, nmc_phase, date, next_start_date, academic_year)
 * undo -> POST /api/promotion/admin/moveUndo (run_id, student_ids)
 * correctDecision -> POST /api/promotion/admin/correctDecision (student_id, entry_id, reason)
 * syllabus -> PUT /api/promotion/admin/subjectSyllabus or /studentSyllabus
 * profile/photo/status/year setup -> authenticated /api/enrollment/admin adapter.
 * Server integration must return row-level import/deletion failures and reject stale academic revisions.
 * @typedef {{version:2,batches:Array,students:import('./studentModel').Student[],moves:Array,counters:Object<string,number>}} Directory
 * @typedef {{type:'move',ids:string[],action:'promote'|'repeat'|'complete',date:string,startsOn?:string,academicYear?:string,expectedAcademicRevisions?:Object<string,number>,note?:string}} MoveCommand
 * @typedef {{type:'correct',id:string,entryId:string,academicRevision:number,startsOn:string,endsOn?:string,section:string,reason:string}} EntryCorrection
 */
import { COURSES, SUBJECTS, YEARS, today, academicYearFor, normaliseAcademicYear, validDate, validateStudent, migrateDirectory, issueTrackingId, currentEntry, fail, uid } from './studentModel.js'
import { sampleDirectory } from './studentSamples.js'
import { applyAcademicCommand } from './studentProgression.js'
export { YEARS, today, academicYearFor, validateStudent, sampleDirectory }
export const DIRECTORY_KEY = 'medsy-student-directory-v1'
export const DIRECTORY_EVENT = 'medsy-students-changed'

/** Pure atomic mock transaction. Production must independently enforce institution ownership and edit permission. */
export function applyStudentCommand(source, command, { canEdit = false } = {}) {
  if (!canEdit) fail('You have read-only access to student management.')
  const data = migrateDirectory(source)
  const find = id => data.students.find(student => student.id === id) || fail('This student no longer exists. Refresh and try again.')
  const audit = (student, action, note, date = today()) => { student.history.push({ id: uid(), action, year: student.year, academicYear: student.academicYear, date, at: new Date().toISOString(), note }); student.revision++ }
  if (applyAcademicCommand(data, command, audit)) return data
  if (['save', 'import'].includes(command.type)) {
    const rows = command.type === 'import' ? command.rows : [command.draft]
    if (!rows?.length) fail('Choose students to import.')
    for (const input of rows) {
      const original = command.type === 'save' && input.id ? find(input.id) : null
      if (original && input.revision !== original.revision) fail('This student changed since you opened the form. Reopen it.')
      const draft = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]))
      draft.academicYear = normaliseAcademicYear(draft.academicYear)
      const errors = validateStudent(draft, data, original)
      if (Object.keys(errors).length) fail(`${draft.name || 'Student'}: ${Object.values(errors).join(' ')}`)
      if (original) {
        for (const key of ['name', 'registrationId', 'email', 'code', 'phone', 'section', 'department']) original[key] = draft[key]
        original.subject = draft.department
        if (currentEntry(original)) currentEntry(original).section = draft.section
        audit(original, 'Profile updated', 'Student details updated')
      } else {
        const student = { id: uid(), trackingId: issueTrackingId(data, draft.batch), registrationId: draft.registrationId, name: draft.name, email: draft.email, code: draft.code || '+91', phone: draft.phone, batch: draft.batch, course: draft.course, department: draft.department, subject: draft.department, section: draft.section, joinedOn: draft.joinedOn, academicYear: draft.academicYear, startedAt: draft.joinedOn, year: YEARS[0], status: 'Active', graduated: false, tracked: true, revision: 0, academicRevision: 0, history: [], subjectSyllabuses: {}, syllabus: '', entries: [{ id: uid(), year: YEARS[0], academicYear: draft.academicYear, start: draft.joinedOn, end: null, outcome: 'Current', section: draft.section }] }
        audit(student, 'Enrolled', draft.batchReasonDetail ? `${draft.batchReason}: ${draft.batchReasonDetail}` : draft.batchReason || 'Joined First Year', draft.joinedOn); data.students.push(student)
      }
    }
  } else if (command.type === 'batch') {
    const batch = command.batch
    if (!/^\d{4}$/.test(batch.id) || +batch.id < 2023 || +batch.id > 2035) fail('Enter a batch year from 2023 to 2035.')
    if (data.batches.some(b => b.id === batch.id)) fail('This batch already exists.')
    if (!COURSES.includes(batch.course) || !validDate(batch.startsOn) || batch.startsOn < `${batch.id}-01-01` || batch.startsOn > `${+batch.id + 1}-12-31`) fail('Choose a course and a start date within the batch year or following year.')
    data.batches.push({ ...batch, syllabus: batch.syllabus || 'CBME 2024', subjectSyllabuses: {} })
  } else if (command.type === 'deleteBatch') {
    if (command.emptyOnly && data.students.some(student => student.batch === command.batch)) fail('This batch now contains students and cannot be deleted here. Refresh the batch list.')
    if (!command.emptyOnly && command.confirm !== command.batch) fail('Type the batch year to confirm deletion.')
    if (!data.batches.some(b => b.id === command.batch)) fail('Batch no longer exists.')
    data.students = data.students.filter(s => s.batch !== command.batch); data.moves = data.moves.filter(m => m.batch !== command.batch); data.batches = data.batches.filter(b => b.id !== command.batch)
  } else if (command.type === 'delete') {
    if (!command.acknowledged || !command.ids?.length) fail('Select students and acknowledge permanent deletion.')
    command.ids.forEach(find); data.students = data.students.filter(s => !command.ids.includes(s.id))
  } else if (command.type === 'status') {
    const student = find(command.id)
    if (student.status === 'Discharged') fail('Discharged accounts cannot be reactivated here.')
    if (!command.reason?.trim()) fail('Enter a reason for changing the status.')
    student.status = student.status === 'Active' ? 'Inactive' : 'Active'; audit(student, student.status, command.reason)
  } else if (command.type === 'photo') {
    const student = find(command.id)
    if (command.photo && (!/^data:image\/(jpeg|png|webp);base64,/.test(command.photo) || command.photo.length > 1500000)) fail('Choose a supported, resized photo.')
    student.photo = command.photo || ''; audit(student, 'Photo updated', command.photo ? 'Photo changed' : 'Photo removed')
  } else if (command.type === 'syllabus') {
    const student = command.id ? find(command.id) : null
    const batch = data.batches.find(b => b.id === (student?.batch || command.batch))
    const year = command.year || student?.year
    const subjects = command.subjects || []
    if (!batch || !subjects.length || subjects.some(subject => !(SUBJECTS[year] || []).includes(subject))) fail('Choose subjects for the selected year.')
    if (!['CBME 2019', 'CBME 2024', ...(student ? [''] : [])].includes(command.syllabus)) fail('Choose a supported syllabus.')
    const target = student || batch
    for (const subject of subjects) {
      const key = `${year}:${subject}`
      if (command.syllabus) target.subjectSyllabuses[key] = command.syllabus
      else { delete target.subjectSyllabuses[key]; target.syllabus = '' }
    }
    const affected = student ? [student] : data.students.filter(s => s.batch === batch.id && s.year === year)
    affected.forEach(s => audit(s, 'Subject syllabus updated', `${subjects.join(', ')}: ${command.syllabus || 'Follow batch'}`))
  } else fail('Unsupported student operation.')
  return data
}
export async function getStudentDirectory() {
  const stored = localStorage.getItem(DIRECTORY_KEY)
  if (!stored) return sampleDirectory()
  let parsed
  try { parsed = JSON.parse(stored) } catch { fail('Saved student data could not be read. It has not been overwritten.') }
  return migrateDirectory(parsed)
}
/** API adapter boundary. Lock covers read/validate/write; failed storage writes never report success. */
export async function saveStudentCommand(command, permissions) {
  const commit = async () => {
    const next = applyStudentCommand(await getStudentDirectory(), command, permissions)
    const existing = localStorage.getItem(DIRECTORY_KEY)
    if (existing && JSON.parse(existing).version === 1 && !localStorage.getItem(`${DIRECTORY_KEY}-backup-v1`)) localStorage.setItem(`${DIRECTORY_KEY}-backup-v1`, existing)
    localStorage.setItem(DIRECTORY_KEY, JSON.stringify(next)); window.dispatchEvent(new Event(DIRECTORY_EVENT)); return next
  }
  return navigator.locks ? navigator.locks.request(DIRECTORY_KEY, commit) : commit()
}
/** Independent deletions make partial successes explicit, matching the production contract. */
export async function deleteStudents(ids, permissions, save = saveStudentCommand) {
  const result = { deleted: [], failed: [] }
  for (const id of ids) {
    try { await save({ type: 'delete', ids: [id], acknowledged: true }, permissions); result.deleted.push(id) }
    catch (error) { result.failed.push({ id, message: error.message }) }
  }
  return result
}
