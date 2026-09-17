/**
 * Normalise the current participant in the Learn & Practice student workflow.
 * The shell role does not restrict learning participation. Never infer the owner
 * of an anonymous historical attempt from the current profile.
 * @param {{id?: string, studentId?: string, registerId?: string, rollNo?: string, name?: string}|null} student
 * @returns {{studentId: string, studentName: string, studentRollNo: string}|object}
 */
export function practiceSubmissionIdentity(student) {
  const id = String(student?.studentId ?? student?.id ?? student?.registerId ?? '').trim()
  if (!id) return {}
  return { studentId: id, studentName: String(student.name ?? ''), studentRollNo: String(student.rollNo ?? student.registerId ?? id) }
}
