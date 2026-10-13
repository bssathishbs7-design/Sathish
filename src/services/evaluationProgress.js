import { descriptiveResponseItems, normalizeDescriptiveResponses } from './descriptiveResponses.js'
import { hasAnswerContent } from './richAnswers.js'

/** Reject missing selections before numeric conversion; option zero is a valid answer. */
export function submittedOption(attempt, key, optionCount) {
  if (!attempt.isMcqSubmitted && !attempt.isAssessmentSubmitted) return null
  const value = attempt.answers?.[key]
  if (value === null || value === undefined || value === '') return null
  const index = Number(value)
  return Number.isInteger(index) && index >= 0 && index < optionCount ? index : null
}

/** Parent-question progress, independent of evaluator marking; leaves drive completion.
 * @param {Array<{keys:string[], answered:number, available:boolean}>} groups
 * @param {Object<string,{status:string,marks:number|string,error?:string}>} state
 */
export function evaluationProgress(groups, state) {
  return groups.reduce((total, group) => {
    total.total++
    if (!group.available) total.unavailable++
    else if (!group.answered) total.unanswered++
    else if (group.answered === group.keys.length) total.answered++
    else total.partial++
    if (group.keys.length && group.keys.every(key => {
      const result = state[key] || {}
      return !result.error && (['correct', 'wrong', 'not-attempted', 'evaluated'].includes(result.status))
    })) total.evaluated++
    return total
  }, { total: 0, answered: 0, partial: 0, unanswered: 0, unavailable: 0, evaluated: 0 })
}

/** Count submitted rich responses using the same parent-scoped keys as the exam editor. */
export function submittedDescriptiveCounts(questions, attempt) {
  const answers = normalizeDescriptiveResponses(questions, attempt.descriptiveAnswers)
  return questions.map((question, index) => descriptiveResponseItems(question, index).filter(item => hasAnswerContent(answers[item.key])).length)
}
