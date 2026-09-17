import { getPracticeQuestionBreakdown } from './practiceQuestionMetadata.js'

/** Shared, explicitly synthetic cohort used by the faculty frontend before API integration. */
export const facultyReportStudents = ['Aarav Kumar', 'Diya Raman', 'Ishaan Patel', 'Meera Nair', 'Nikhil Joseph'].map((name, index) => ({ id: `sample-student-${index}`, name, rollNo: `MC${2501 + index}` }))

/** Construct internally consistent sample marks for the selected practice; never persist as real results. */
export function buildFacultyReportSample(practice = {}) {
  const breakdown = getPracticeQuestionBreakdown(practice)
  const total = Object.values(breakdown).reduce((sum, type) => sum + type.total, 0) || Number(practice.totalMarks || practice.total || 0)
  return facultyReportStudents.map((student, index) => {
    const submitted = !(index === 4 && String(practice.status).toLowerCase() === 'in progress')
    let deduction = index % 3
    const earned = {}
    for (const type of ['laqs', 'saqs', 'mcq']) {
      const lost = Math.min(deduction, breakdown[type].total)
      earned[type] = breakdown[type].total - lost
      deduction -= lost
    }
    const obtained = Math.max(0, total - (index % 3))
    return { ...student, status: submitted ? 'Submitted' : 'In progress', mcqScore: breakdown.mcq.count ? earned.mcq : '-', saqsScore: breakdown.saqs.count ? earned.saqs : '-', laqsScore: breakdown.laqs.count ? earned.laqs : '-', obtainedMarks: submitted ? obtained : '-', totalMarks: total, submittedAt: submitted ? practice.sharedAt || '-' : '-' }
  })
}

/** Return a labelled sample cohort for the same practice report fixtures. */
export function withFacultyReportSample(card) {
  const practices = card.practiceSessions ?? []
  return { ...card, isFacultyDemo: true, facultyAnalytics: {
    students: facultyReportStudents.map(student => ({ ...student, practiceIds: practices.map(practice => String(practice.id)) })),
    attempts: practices.flatMap(practice => buildFacultyReportSample(practice).filter(row => row.status === 'Submitted').map(row => ({ id: `sample-${practice.id}-${row.id}`, studentId: row.id, practiceId: String(practice.id), status: 'Completed', attemptedAt: practice.sharedAt || '', obtained: row.obtainedMarks, total: row.totalMarks, mcq: row.mcqScore === '-' ? 0 : row.mcqScore, saqs: row.saqsScore === '-' ? 0 : row.saqsScore, laqs: row.laqsScore === '-' ? 0 : row.laqsScore }))),
  } }
}
