import { assessmentRoster } from './assessmentRoster.js'

const STUDENT_KEY = 'medsy-assessment-student'

/** Local demo account adapter. Production must supply the authenticated student identity.
 * @param {Array<Object>} assessments Published records with resolved directory rosters.
 * @returns {Array<{id:string,name:string}>} Unique assigned students, retaining legacy identities.
 */
export function assessmentStudentOptions(assessments) {
  const students = new Map()
  for (const assessment of assessments) {
    for (const student of assessmentRoster(assessment)) {
      const id = String(student.id || student.studentId || student.registerId || student.registrationId || '')
      if (id && !students.has(id)) students.set(id, { id, name: student.name || student.studentName || id })
    }
  }
  return [...students.values()]
}

/** Keep the explicitly selected demo account stable across navigation within this tab. */
export function getAssessmentStudentId() {
  try {
    const selected = sessionStorage.getItem(STUDENT_KEY)
    if (selected) return selected
    const assessments = JSON.parse(localStorage.getItem('vx-assessment-published') || '[]')
    return assessmentStudentOptions(Array.isArray(assessments) ? assessments : [])[0]?.id || 'MC2568'
  } catch { return 'MC2568' }
}

/** Persist before navigating so attempts, controls and results use the same student. */
export function selectAssessmentStudent(id) {
  sessionStorage.setItem(STUDENT_KEY, String(id))
}
