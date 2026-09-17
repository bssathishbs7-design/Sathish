import { buildFacultyAnalytics } from './facultyAnalytics.js'
import { getPracticeQuestionBreakdown } from './practiceQuestionMetadata.js'

const names = ['Aarav Kumar', 'Diya Raman', 'Ishaan Patel', 'Meera Nair', 'Nikhil Joseph', 'Ananya Rao', 'Rohan Shah', 'Priya Menon', 'Arjun Das', 'Sneha Iyer', 'Vikram Rao', 'Kavya Reddy']

/** Display-only student fixtures for the selected competency. Never persisted or included in live totals.
 * @param {object} card Shared competency with practiceSessions.
 * @param {string} practiceId Selected practice ID, or "all".
 * @returns {object[]} Student table rows compatible with facultyStudentCard.
 */
export function getFacultyStudentSamples(card, practiceId = 'all') {
  const practices = card.practiceSessions ?? []
  if (!practices.length) return []
  const students = names.map((name, index) => ({ id: `faculty-preview-${index}`, name, rollNo: `DEMO-${String(index + 1).padStart(3, '0')}`, isSample: true }))
  const attempts = practices.flatMap(practice => students.slice(0, 10).flatMap((student, index) => {
    const breakdown = getPracticeQuestionBreakdown(practice)
    const total = Object.values(breakdown).reduce((sum, item) => sum + item.total, 0)
    if (!total) return []
    return Array.from({ length: index % 3 + 1 }, (_, attemptIndex) => {
      const ratio = Math.min(1, [0.9, 0.65, 0.75, 0.5, 0.8, 0.4, 1, 0.6, 0, 0.7][index] + attemptIndex * 0.1)
      const marks = Object.fromEntries(Object.entries(breakdown).map(([key, item]) => [key, Math.round(item.total * ratio)]))
      return { id: `${student.id}-${practice.id}-${attemptIndex}`, studentId: student.id, practiceId: String(practice.id), status: 'Completed', attemptedAt: new Date(Date.UTC(2026, 8, 17, 9, index, attemptIndex)).toISOString(), total, obtained: Object.values(marks).reduce((sum, value) => sum + value, 0), ...marks }
    })
  }))
  return buildFacultyAnalytics({ ...card, facultyAnalytics: { students, attempts } }, practiceId).students
}

/** Build consistent preview-inclusive cards and rows without changing stored live data. */
export function getFacultyDisplayAnalytics(data) {
  const practiceId = data.practiceId ?? 'all'
  const previews = getFacultyStudentSamples(data.card, practiceId)
  if (!previews.length) return { ...data, includesPreview: false }
  const students = [...data.students, ...previews]
  const display = buildFacultyAnalytics({
    ...data.card,
    facultyAnalytics: { students, attempts: students.flatMap(student => student.attempts) },
  }, practiceId)
  return { ...data, ...display, includesPreview: true }
}
