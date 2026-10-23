import { getAssessmentAutomation } from './assessmentAutomation.js'

/** Derive monitoring state without grading responses or changing the saved attempt.
 * @param {Object} assessment Saved assessment and its setup.
 * @param {Object} attempt The student's current attempt, including section submission flags.
 * @param {{hasMcq:boolean,hasDescriptive:boolean}} types Included question types.
 * @param {boolean} started Whether the exam session has started.
 */
export function liveEvaluationProgress(assessment, attempt = {}, types, started = false) {
  const setup = { ...assessment, ...assessment.setup }
  setup.examDeliveryMode ||= setup.examMode || 'Online'
  const policy = getAssessmentAutomation(setup, types)
  const submitted = key => Boolean(attempt.isAssessmentSubmitted || attempt[key === 'mcq' ? 'isMcqSubmitted' : 'isDescriptiveSubmitted'])
  const inputRows = policy.rows.filter(row => row.enabled)
  const waiting = inputRows.some(row => !submitted(row.key))
  return {
    canScore: key => !inputRows.some(row => row.key === key) || submitted(key),
    waiting,
    status: waiting ? (started || attempt.hasStarted || inputRows.some(row => submitted(row.key)) ? 'In progress' : 'Not started')
      : inputRows.length && inputRows.every(row => row.evaluation) ? 'Submitted' : 'Pending evaluation',
  }
}
