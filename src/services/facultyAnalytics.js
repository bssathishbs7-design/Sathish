import { competencyAnalyticsSample } from './competencyAnalytics.js'
import { buildPracticeTagAnalytics, getPracticeTagSnapshot } from './practiceTagAnalytics.js'
import { getPracticeQuestionBreakdown } from './practiceQuestionMetadata.js'

/**
 * API contract: card.facultyAnalytics = { students, attempts }.
 * students: Array<{id: string, name: string, rollNo: string, practiceIds?: string[]}>.
 * Omitted practiceIds means assigned to all practices; [] means none.
 * attempts: Array<{id: string, studentId: string, practiceId: string, status: string,
 * attemptedAt: string, obtained: number, total: number, mcq?: number, saqs?: number, laqs?: number}>.
 * Only identified students and completed/submitted attempts with valid marks contribute to scores.
 * Learner-local history is never inferred to represent the whole cohort.
 */
const percent = attempt => attempt && attempt.total > 0 ? attempt.obtained / attempt.total * 100 : null
const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null

export function readFacultyAnalyticsContext() {
  try { return JSON.parse(sessionStorage.getItem('vx-faculty-analytics-context') || 'null') }
  catch { return null }
}
export function saveFacultyAnalyticsContext(context) {
  try { sessionStorage.setItem('vx-faculty-analytics-context', JSON.stringify(context)) }
  catch { /* In-memory navigation still works if browser storage is unavailable. */ }
}
const completed = record => ['completed', 'complete', 'submitted', 'expired'].includes(String(record.status).toLowerCase())
const validScore = record => record.obtained !== null && record.obtained !== undefined && record.total != null && Number.isFinite(Number(record.obtained)) && Number(record.total) > 0 && Number(record.obtained) >= 0 && Number(record.obtained) <= Number(record.total)

export function buildFacultyAnalytics(card, practiceId = 'all') {
  const practices = (card.practiceSessions ?? []).map((practice, index) => ({ ...practice, id: String(practice.id ?? index), practiceNo: practice.practiceNo ?? index + 1 }))
  const selected = practices.filter(practice => practiceId === 'all' || practice.id === practiceId)
  const ids = new Set(selected.map(practice => practice.id))
  const source = card.facultyAnalytics
  const rosterAvailable = Array.isArray(source?.students) && source.rosterComplete !== false
  const unique = new Map((source?.students ?? []).filter(student => student.id != null).map(student => [String(student.id), student]))
  const students = [...unique.values()].filter(student => !student.practiceIds || student.practiceIds.some(id => ids.has(String(id)))).map(student => {
    const assignedIds = selected.filter(practice => !student.practiceIds || student.practiceIds.map(String).includes(practice.id)).map(practice => practice.id)
    const attempts = [...new Map((source?.attempts ?? []).filter(attempt => String(attempt.studentId) === String(student.id) && assignedIds.includes(String(attempt.practiceId)) && completed(attempt) && validScore(attempt)).map(attempt => [String(attempt.id), { ...attempt, obtained: Number(attempt.obtained), total: Number(attempt.total) }])).values()].sort((a, b) => (Date.parse(a.attemptedAt) || 0) - (Date.parse(b.attemptedAt) || 0))
    const latestByPractice = new Map(attempts.map(attempt => [String(attempt.practiceId), attempt]))
    const latest = [...latestByPractice.values()]
    return { ...student, id: String(student.id), attempts, latest, latestScore: percent(attempts.at(-1)), bestScore: attempts.length ? Math.max(...attempts.map(percent)) : null, average: mean(latest.map(percent)), status: latest.length === assignedIds.length && assignedIds.length ? 'Submitted' : latest.length ? 'In Progress' : 'Pending' }
  })
  const breakdown = ['mcq', 'saqs', 'laqs'].map((key, index) => {
    const count = selected.reduce((sum, practice) => sum + getPracticeQuestionBreakdown(practice)[key].count, 0)
    const scoredStudents = students.map(student => {
      const records = student.latest.filter(attempt => typeof attempt[key] === 'number' && Number.isFinite(attempt[key]))
      if (!records.length) return null
      const total = records.reduce((sum, attempt) => sum + getPracticeQuestionBreakdown(selected.find(practice => practice.id === String(attempt.practiceId)))[key].total, 0)
      const earned = records.reduce((sum, attempt) => sum + attempt[key], 0)
      return total > 0 ? { earned, total, percentage: earned / total * 100 } : null
    }).filter(Boolean)
    return { label: ['MCQ', 'SAQ', 'LAQ'][index], count, obtained: mean(scoredStudents.map(row => row.earned)), total: mean(scoredStudents.map(row => row.total)), percentage: mean(scoredStudents.map(row => row.percentage)) }
  })
  return { practices, students, rosterAvailable, assigned: rosterAvailable ? students.length : null, submitted: students.filter(student => student.attempts.length).length, pending: rosterAvailable ? students.filter(student => student.status !== 'Submitted').length : null, average: mean(students.map(student => student.average).filter(value => value !== null)), breakdown, tagAnalytics: buildPracticeTagAnalytics(selected.map(getPracticeTagSnapshot)) }
}

/** Merge explicitly identified learner history with API cohort data, without inferring a full roster.
 * History records carry studentId, studentName and studentRollNo at submission time.
 * Anonymous legacy records stay available in individual analytics only.
 * @param {object} card Shared competency including practiceSessions and optional facultyAnalytics.
 */
export function withIdentifiedPracticeResults(card) {
  const source = card.facultyAnalytics ?? {}
  const hasRoster = Array.isArray(source.students) && source.rosterComplete !== false
  const students = new Map((source.students ?? []).map(student => [String(student.id), { ...student }]))
  const attempts = new Map((source.attempts ?? []).map(attempt => [String(attempt.id), attempt]))
  for (const practice of card.practiceSessions ?? []) {
    for (const attempt of practice.practiceAttemptHistory ?? []) {
      const studentId = String(attempt.studentId ?? '').trim()
      if (!studentId || !attempt.id) continue
      const existing = students.get(studentId)
      // A supplied roster is authoritative; local histories cannot expand its assignments.
      if (hasRoster && !existing) continue
      if (!hasRoster) students.set(studentId, {
        id: studentId, name: attempt.studentName || existing?.name || '',
        rollNo: attempt.studentRollNo || existing?.rollNo || studentId,
        practiceIds: [...new Set([...(existing?.practiceIds ?? []), String(practice.id)])],
      })
      if (!attempts.has(String(attempt.id))) attempts.set(String(attempt.id), { ...attempt, studentId, practiceId: String(practice.id) })
    }
  }
  return { ...card, facultyAnalytics: { ...source, rosterComplete: hasRoster && source.rosterComplete !== false, students: [...students.values()], attempts: [...attempts.values()] } }
}

/** Build the existing individual analytics payload using only the selected student's attempts. */
export function facultyStudentCard(card, student, practiceId = 'all') {
  return { ...card, practiceSessions: (card.practiceSessions ?? []).filter(practice => practiceId === 'all' || String(practice.id) === practiceId).map(practice => ({ ...practice, practiceAttemptHistory: student.attempts.filter(attempt => String(attempt.practiceId) === String(practice.id)).map(attempt => ({ ...attempt, status: 'Completed' })) })) }
}

/** Async API boundary. Reads actual shared records; never fills missing results with samples. */
export async function getFacultyAnalytics(card = {}, practiceId, storage = globalThis.localStorage) {
  let current = card
  try {
    const stored = JSON.parse(storage?.getItem('vx-learn-practice-shared-cards') || '[]')
    if (Array.isArray(stored)) {
      current = stored.find(item => card.id != null && String(item.id) === String(card.id))
        ?? stored.find(item => item.competencyCode && item.competencyCode === card.competencyCode)
        ?? card
    }
  } catch { /* A damaged storage entry does not discard the selected competency. */ }
  const practices = current.practiceSessions?.length ? current.practiceSessions : current.questions?.length ? [{ ...current, id: current.id ?? 'practice-1', practiceNo: 1 }] : []
  current = { ...current, competencyName: current.competencyName || card.competencyName, subject: current.subject || card.subject, practiceSessions: practices.map((practice, index) => ({ ...practice, id: String(practice.id ?? index) })) }
  const resolved = withIdentifiedPracticeResults(current)
  const selectedPracticeId = resolved.practiceSessions.some(practice => practice.id === String(practiceId)) ? String(practiceId) : 'all'
  return { ...buildFacultyAnalytics(resolved, selectedPracticeId), practiceId: selectedPracticeId, card: resolved, isSample: Boolean(resolved.isFacultyDemo) }
}

export const facultyAnalyticsSample = {
  ...competencyAnalyticsSample, id: 'faculty-sample', subject: 'Radiodiagnosis', assignment: { year: 'First Year' }, isFacultyDemo: true,
  facultyAnalytics: {
    students: ['Aarav Kumar', 'Diya Raman', 'Ishaan Patel', 'Meera Nair', 'Nikhil Joseph', 'Ananya Rao', 'Rohan Shah'].map((name, index) => ({ id: `demo-${index}`, name, rollNo: `MC${2501 + index}` })),
    attempts: [0, 1, 2, 3, 4].map(index => ({ id: `demo-attempt-${index}`, studentId: `demo-${index}`, practiceId: 'sample', status: 'Completed', attemptedAt: `2026-09-17T10:0${index}:00Z`, obtained: [6, 5, 4, 3, 0][index], total: 6, mcq: index < 3 ? 1 : 0, saqs: [5, 4, 3, 3, 0][index], laqs: 0 })),
  },
}
