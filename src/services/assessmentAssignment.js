import { getStudentDirectory } from './studentManagement.js'

/** Strip display prefixes while keeping directory SGT identities intact. */
export const assessmentGroupKey = value => String(value || '').trim().replace(/^SGT(?: Group)?\s+/i, '')

/** Current eligible directory students. Historical entries never determine assignment scope.
 * @param {{students:Array}} directory Student Management snapshot.
 * @param {{assignBatch?:string,assignYear?:string,assignGroups?:string[]}} scope Optional filters.
 * @returns {Array<Object>} Directory records with current batch/year/section projected for selectors.
 */
export function eligibleAssessmentStudents(directory, scope = {}) {
  if (!Array.isArray(directory?.students)) throw new Error('The student directory could not be read. Reload Student Management before assigning the assessment.')
  const groups = (scope.assignGroups || []).map(assessmentGroupKey).filter(Boolean)
  return directory.students.flatMap(student => {
    const entry = student.entries?.find(row => row.outcome === 'Current')
    if (Array.isArray(student.entries) && !entry) return []
    if (student.status !== 'Active' || student.graduated) return []
    const current = { ...student, batch: String(entry?.batch || student.batch || ''), year: entry?.year || student.year, section: entry?.section || student.section }
    return (!scope.assignBatch || current.batch === String(scope.assignBatch))
      && (!scope.assignYear || current.year === scope.assignYear)
      && (!groups.length || groups.includes(assessmentGroupKey(current.section))) ? [current] : []
  })
}

/** Resolve against a fresh directory before publication. Explicit student selection is strict;
 * legacy drafts without assignStudentIds retain their year/group assignment behaviour.
 * @param {{assignBatch?:string,assignYear:string,assignGroup?:string,assignGroups?:string[],assignStudentIds?:string[]}} setup
 * assignStudentIds contains stable directory student IDs, not registration/display names.
 * @param {()=>Promise<{students:Array}>} [loadDirectory] Student directory adapter.
 * @returns {Promise<Array<{id:string,name:string,sourceStudentId:string,registrationId:string}>>}
 */
export async function resolveAssessmentAssignment(setup, loadDirectory) {
  if (!setup.assignYear) throw new Error('Select a student year.')
  const explicit = Object.hasOwn(setup, 'assignStudentIds')
  const groups = (Array.isArray(setup.assignGroups) ? setup.assignGroups : String(setup.assignGroup || '').split(',')).map(assessmentGroupKey).filter(Boolean)
  if (explicit && !setup.assignBatch) throw new Error('Select a batch.')
  if (explicit && !groups.length) throw new Error('Select at least one SGT group.')
  if (explicit && (!Array.isArray(setup.assignStudentIds) || !setup.assignStudentIds.length)) throw new Error('Select at least one student.')
  const directory = await (loadDirectory || getStudentDirectory)()
  const eligible = eligibleAssessmentStudents(directory, { assignBatch: setup.assignBatch, assignYear: setup.assignYear, assignGroups: groups })
  const selected = explicit ? new Set(setup.assignStudentIds) : null
  if (selected && (selected.size !== setup.assignStudentIds.length || [...selected].some(id => eligible.filter(student => student.id === id).length !== 1))) {
    throw new Error('Selected students have changed or no longer match this batch, year and SGT. Refresh the selection and try again.')
  }
  const students = eligible.filter(student => !selected || selected.has(student.id)).map(student => ({ id: student.registrationId || student.id, registrationId: student.registrationId || student.id,
    sourceStudentId: student.id, name: student.name }))
  if (!students.length) throw new Error('No active students match this year and SGT group. Update Student Management or select another assignment.')
  if (students.some(student => !student.id) || new Set(students.map(student => student.id)).size !== students.length) throw new Error('Student identifiers are missing or duplicated. Correct the directory before assigning this assessment.')
  return students
}
