import { getStudentDirectory } from './studentManagement.js'

/** Resolve the selected year/SGT group through the existing student-directory adapter.
 * Empty assignments never receive a sample evaluation roster.
 * @param {{assignYear:string,assignGroup?:string}} setup
 * @param {()=>Promise<{students:Array}>} [loadDirectory] Student directory adapter.
 * @returns {Promise<Array<{id:string,name:string,sourceStudentId:string,registrationId:string}>>}
 */
export async function resolveAssessmentAssignment(setup, loadDirectory) {
  if (!setup.assignYear) throw new Error('Select a student year.')
  const load = loadDirectory || getStudentDirectory
  const directory = await load()
  if (!Array.isArray(directory?.students)) throw new Error('The student directory could not be read. Reload Student Management before assigning the assessment.')
  const group = String(setup.assignGroup || '').replace(/^SGT Group\s+/i, '')
  const students = directory.students.filter(student => {
    const entry = student.entries?.find(row => row.outcome === 'Current')
    if (Array.isArray(student.entries) && !entry) return false
    return student.status === 'Active' && !student.graduated && (entry?.year || student.year) === setup.assignYear
      && (!group || (entry?.section || student.section) === group)
  }).map(student => ({ id: student.registrationId || student.id, registrationId: student.registrationId || student.id,
    sourceStudentId: student.id, name: student.name }))
  if (!students.length) throw new Error('No active students match this year and SGT group. Update Student Management or select another assignment.')
  if (students.some(student => !student.id) || new Set(students.map(student => student.id)).size !== students.length) throw new Error('Student identifiers are missing or duplicated. Correct the directory before assigning this assessment.')
  return students
}
