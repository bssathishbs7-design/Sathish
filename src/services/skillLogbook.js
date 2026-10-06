import { SKILL_SAMPLE_ASSIGNMENTS } from './skillLogbookSample.js'
import { SUBJECTS } from './logbookCatalog.js'
import { LEARNERS } from './logbookPeople.js'

export const SKILL_ASSIGNMENTS_KEY = 'vx-assigned-skill-activities'
export const SKILL_EVALUATIONS_KEY = 'vx-completed-evaluation-rows'
export const isSkillEntry = entry => entry?.source === 'skills'
export const isSkillEntryId = id => String(id).startsWith('skill-log:')
export const skillCertifiable = assignment => Boolean(assignment.certifiable ?? assignment.isCertifiable ?? assignment.examData?.certifiable ?? assignment.examData?.isCertifiable ?? assignment.activityData?.activity?.certifiable ?? assignment.activityData?.activity?.isCertifiable)

/** Assignment roster is explicit. The local demo uses the same named accounts as
 * Logbook; production must supply authenticated cohort membership from its API.
 * @param {Object} assignment
 * @returns {{id:string,registerId:string,name:string}[]}
 */
export function skillStudents(assignment) {
  const roster = assignment.students ?? assignment.studentIds?.map(id => ({ id }))
    ?? (assignment.studentId && !assignment.submittedAt ? [{ id: assignment.studentId, name: assignment.studentName }] : LEARNERS)
  return roster.map(student => typeof student === 'string' ? { id: student, registerId: student, name: student } : { ...student, id: String(student.id ?? student.registerId), registerId: String(student.registerId ?? student.id) })
}

export function normaliseSkillAssignment(assignment) {
  const record = assignment.activityData?.record || {}
  const competency = assignment.competency || record.competency || ''
  const subject = SUBJECTS.find(item => [item.name, item.label].includes(assignment.subject || record.subject))
    || SUBJECTS.find(item => item.code === competency.match(/^[A-Z]+/)?.[0])
  return { ...assignment, subject: subject?.name || assignment.subject || record.subject || '', competency: competency.match(/^[A-Z]+\d+(?:\.\d+)?/)?.[0] || competency,
    students: skillStudents(assignment), studentCount: skillStudents(assignment).length, certifiable: skillCertifiable(assignment),
    assignedAt: assignment.assignedAt || new Date().toISOString(),
    marks: assignment.marks ?? assignment.activityData?.activity?.marks ?? 'Nil' }
}

const decision = row => row?.rowStatus === 'Completed'
  ? ({ 'decision-completed': 'Completed', 'decision-repeat': 'Repeat', 'decision-remedial': 'Remedial' }[row.decisionId]
    || (['Completed', 'Repeat', 'Remedial'].includes(row.resultStatus) ? row.resultStatus : null)) : null
const studentMatches = (row, student) => [student.id, student.registerId].includes(String(row.studentId)) || [student.id, student.registerId].includes(String(row.registerId))

/** Read-only projection: one stable entry per assignment/student/attempt. Repeated
 * reads and duplicate evaluation saves never allocate another attempt.
 * @param {Object[]} assignments Each has id, subject, competency, certifiable,
 * students:[{id,registerId,name}], submissions:[{studentId,attemptNumber,submittedAt}].
 * @param {Object[]} evaluations Each has activityId, studentId, attemptNumber,
 * rowStatus, decisionId, submittedAt, itemSummaries and optional marks/feedback.
 * @returns {Object[]} Logbook records; Skills remains the only writable source.
 */
export function projectSkillEntries(assignments, evaluations) {
  return assignments.flatMap(assignment => {
    const normal = normaliseSkillAssignment(assignment)
    if (!normal.subject) return []
    return normal.students.flatMap(student => {
      const rows = evaluations.filter(row => String(row.activityId) === String(normal.id) && studentMatches(row, student))
      const byAttempt = new Map()
      for (const row of rows) {
        const number = Math.max(1, Number(row.attemptNumber) || 1)
        const previous = byAttempt.get(number)
        if (!previous || String(row.submittedAt || '') > String(previous.submittedAt || '')) byAttempt.set(number, row)
      }
      const submissions = (normal.submissions || (normal.submittedAt ? [normal] : [])).filter(row => studentMatches(row, student))
      const attempts = new Set([1, ...byAttempt.keys(), ...submissions.map(row => Number(row.attemptNumber) || 1)])
      for (const [number, row] of byAttempt) if (['Repeat', 'Remedial'].includes(decision(row))) attempts.add(number + 1)
      return [...attempts].sort((a, b) => a - b).map(attemptNumber => {
        const evaluation = byAttempt.get(attemptNumber)
        const submission = submissions.find(row => (Number(row.attemptNumber) || 1) === attemptNumber)
        const status = decision(evaluation) || (submission || evaluation ? 'Awaiting evaluation' : 'To do')
        const date = (evaluation?.submittedAt || submission?.submittedAt || normal.assignedAt).slice(0, 10)
        return { id: `skill-log:${normal.id}:${student.id}:${attemptNumber}`, source: 'skills',
          sourceAssignmentId: normal.id, sourceActivityId: normal.sourceActivityId || normal.id,
          studentId: student.id, studentName: student.name, subject: normal.subject,
          cat: normal.certifiable ? 'cert' : 'skill', status, date, attemptNumber,
          faculty: normal.facultyId || '', values: { competency: normal.competency, activity: normal.title, attemptNumber: String(attemptNumber) },
          extra: { facultyRemarks: evaluation?.feedback || evaluation?.remarks || '', comments: [] },
          performance: evaluation || null,
          submissionItems: Object.values(normal.examData?.modules || {}).filter(Array.isArray).flat().flatMap(item => {
            const answer = submission?.answers?.questions?.[item.id] ?? submission?.answers?.scaffolding?.[item.id]
            const responses = (item.responses || []).map(response => ({ label: response.label, answer: submission?.answers?.forms?.[response.id] })).filter(response => response.answer)
            return answer || responses.length ? [{ id: item.id, label: item.text || item.prompt || item.questionText || item.title, answer: answer || responses.map(response => `${response.label}: ${response.answer}`).join('\n') }] : []
          }),
          marksEnabled: !['nil', 'disabled'].includes(String(normal.marks).toLowerCase()),
          submittedAt: submission?.submittedAt, verifiedAt: decision(evaluation) ? evaluation.submittedAt : null,
          assignment: { by: normal.facultyId || '', assignedAt: normal.assignedAt, instructions: 'Managed in Skills. This Logbook record is read-only.' } }
      })
    })
  })
}

/** Local persistence adapter; replace with the Skills API at backend handoff. */
export function readSkillEntries(storage = window.sessionStorage) {
  return projectSkillEntries(JSON.parse(storage?.getItem(SKILL_ASSIGNMENTS_KEY) ?? JSON.stringify(storage ? SKILL_SAMPLE_ASSIGNMENTS : [])), JSON.parse(storage?.getItem(SKILL_EVALUATIONS_KEY) || '[]'))
}

/** Resolve the student's latest attempt for My Skill Activity and exam launch. */
export function studentSkillActivities(assignments, evaluations, studentId) {
  const entries = projectSkillEntries(assignments, evaluations).filter(entry => entry.studentId === studentId)
  return assignments.flatMap(assignment => {
    const latest = entries.filter(entry => entry.sourceAssignmentId === assignment.id).at(-1)
    if (!latest) return []
    const student = skillStudents(assignment).find(item => item.id === studentId)
    const scheduleLocked = Number(assignment.nextAttemptNumber) === latest.attemptNumber
      && (assignment.nextAttemptStatus === 'needs_schedule' || (assignment.nextAttemptStatus === 'scheduled' && Date.parse(assignment.scheduledAt) > Date.now()))
    return [{ ...assignment, studentId, studentName: student?.name, attemptNumber: latest.attemptNumber,
      attemptCount: `${latest.attemptNumber} / ${latest.attemptNumber}`,
      tone: latest.status === 'To do' && !scheduleLocked ? 'primary' : 'secondary',
      status: latest.status === 'To do' ? 'Assigned' : latest.status === 'Awaiting evaluation' ? 'Live Activity' : 'Completed',
      action: latest.status === 'To do' ? scheduleLocked ? 'Yet to Start' : 'Start Activity' : latest.status === 'Awaiting evaluation' ? 'Awaiting evaluation' : 'View Results' }]
  })
}
