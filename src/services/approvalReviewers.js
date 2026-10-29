/** Shared mock reviewer directory. Production should load authorised reviewers from the API. */
export const APPROVAL_REVIEWERS = [
  { facultyName: 'Dr. Meera Nair', employeeId: 'EMP1021', designation: 'Professor' },
  { facultyName: 'Dr. Arun Kumar', employeeId: 'EMP1045', designation: 'Associate Professor' },
  { facultyName: 'Dr. Priya Shah', employeeId: 'EMP1098', designation: 'Assistant Professor' },
  { facultyName: 'Dr. Kavitha Rao', employeeId: 'EMP1120', designation: 'Assistant Professor' },
  { facultyName: 'Dr. Arjun Menon', employeeId: 'EMP1048', designation: 'Associate Professor' },
]
/** Resolve a directory selection, never silently accept mismatched typed fields. */
export function resolveApprovalReviewer(value) {
  return APPROVAL_REVIEWERS.find(person => ['facultyName', 'employeeId', 'designation'].every(key => person[key] === value?.[key])) || null
}
/** @returns {Promise<Array<{facultyName:string,employeeId:string,designation:string}>>} */
export async function listApprovalReviewers() { return APPROVAL_REVIEWERS.map(person => ({ ...person })) }
