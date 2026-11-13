import { resolveAssessmentAssignment } from './assessmentAssignment.js'

/** Revalidate explicit recipients before either immediate or scheduled sharing.
 * @param {{assignBatch:string,assignYear:string,assignGroups:string[],assignStudentIds:string[]}} scope
 * @param {Function} [loadDirectory] Directory API adapter, injectable for tests.
 * @returns {Promise<{batch:string,year:string,sgt:string,groups:string[],studentIds:string[],students:Object[],assignedTo:string}>}
 */
export async function resolveQuestionShareRecipients(scope, loadDirectory) {
  const students = await resolveAssessmentAssignment(scope, loadDirectory)
  return {
    batch: scope.assignBatch,
    year: scope.assignYear,
    sgt: scope.assignGroups.join(', '),
    groups: [...scope.assignGroups],
    studentIds: students.map(student => student.sourceStudentId),
    students,
    assignedTo: `Batch ${scope.assignBatch}, ${scope.assignYear} - ${students.length} student${students.length === 1 ? '' : 's'}`,
  }
}
