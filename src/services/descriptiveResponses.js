import { hasAnswerContent } from './richAnswers.js'

/** Parent-scoped identity is shared by answering, progress and faculty review.
 * An immutable question id is preferred; the source question index is the legacy fallback.
 */
const identity = (item, fallback) => String(item?.id ?? item?.questionId ?? item?._id ?? fallback)
export const descriptiveSections = question => question?.descriptiveSections?.length ? question.descriptiveSections : question?.subQuestions || []
export function descriptiveResponseKey(question, questionIndex, sectionIndex, childIndex) {
  const parts = ['descriptive', identity(question, `question-${questionIndex}`)]
  if (sectionIndex !== undefined) {
    const section = descriptiveSections(question)[sectionIndex]
    parts.push(identity(section, `section-${sectionIndex}`))
    if (childIndex !== undefined) parts.push(identity(section.children[childIndex], `child-${childIndex}`))
  }
  return JSON.stringify(parts)
}

/** @returns {Array<{key:string,item:Object,legacyKey:string}>} Answerable leaves only. */
export function descriptiveResponseItems(question, index) {
  const sections = descriptiveSections(question)
  if (!sections.length) return [{ key: descriptiveResponseKey(question, index), item: question, legacyKey: question.id }]
  return sections.flatMap((section, sectionIndex) => (section.children?.length ? section.children.map((child, childIndex) => ({ key: descriptiveResponseKey(question, index, sectionIndex, childIndex), item: child, legacyKey: child.id ?? `${question.id}-child-${sectionIndex}-${childIndex}` })) : [{ key: descriptiveResponseKey(question, index, sectionIndex), item: section, legacyKey: section.id ?? `${question.id}-section-${sectionIndex}` }]))
}

export function descriptiveQuestionProgress(question, index, answers) {
  const items = descriptiveResponseItems(question, index)
  const answered = items.filter(item => hasAnswerContent(answers[item.key])).length
  return answered === 0 ? 'Unanswered' : answered === items.length ? 'Answered' : 'Partially answered'
}

export function descriptiveProgress(questions, answers) {
  const states = questions.map((question, index) => descriptiveQuestionProgress(question, index, answers))
  return { answered: states.filter(state => state === 'Answered').length, partial: states.filter(state => state === 'Partially answered').length, unanswered: states.filter(state => state === 'Unanswered').length, total: questions.length }
}

/** Legacy id-only responses are read only when their identity is unambiguous. */
export function normalizeDescriptiveResponses(questions, answers = {}) {
  const items = questions.flatMap(descriptiveResponseItems)
  const result = { ...answers }
  for (const item of items) {
    if (result[item.key] === undefined && item.legacyKey !== undefined && items.filter(other => other.legacyKey === item.legacyKey).length === 1 && answers[item.legacyKey] !== undefined) result[item.key] = answers[item.legacyKey]
  }
  return result
}

/** Only ordinary typing/navigation in the enabled answer field is allowed. */
export function allowsDescriptiveTyping(event, enabled) {
  if (!enabled || event.target?.tagName !== 'TEXTAREA' || event.target?.dataset?.descriptiveAnswer !== 'true' || event.target.disabled || event.target.readOnly) return false
  if (event.ctrlKey || event.metaKey || event.altKey || /^(F\d{1,2}|Escape|PrintScreen|Tab)$/.test(event.key || '')) return false
  if (event.type === 'beforeinput' && /paste|drop/i.test(event.inputType || '')) return false
  return true
}

export function descriptiveInputEnabled(assessment) {
  return (assessment?.setup?.descriptiveDisplayType || assessment?.descriptiveDisplayType) === 'Answer Input'
}

/** The assessment's supervision mode selects the store; never mix attempts across modes. */
export function readAssessmentAttempt(assessment, studentId, storage = localStorage) {
  const mode = assessment?.setup?.supervisionType || assessment?.supervisionType || ''
  const key = /practice/i.test(mode) ? 'vx-online-practice-exam-attempts' : 'vx-online-proctored-exam-attempts'
  const id = assessment?.id || assessment?.assessmentId || assessment?.setup?.assessmentId
  try { return JSON.parse(storage.getItem(key) || '{}')?.[id]?.[studentId] || {} } catch { return {} }
}

/** Atomic snapshot write. Failure is reported so callers can retain the editable draft.
 * @param {string} storageKey @param {string} assessmentId @param {string} studentId
 * @param {Object} attempt Includes descriptiveAnswers, section locks and appliedResetVersion.
 */
export function persistAssessmentAttempt(storageKey, assessmentId, studentId, attempt, storage = localStorage) {
  try {
    const attempts = JSON.parse(storage.getItem(storageKey) || '{}') || {}
    const cohort = attempts[assessmentId] || {}
    const previous = cohort[studentId]
    const submittedAt = attempt.isAssessmentSubmitted ? ((previous?.appliedResetVersion === attempt.appliedResetVersion && previous?.submittedAt) || new Date().toISOString()) : null
    storage.setItem(storageKey, JSON.stringify({ ...attempts, [assessmentId]: { ...cohort, [studentId]: { ...attempt, submittedAt, updatedAt: new Date().toISOString() } } }))
    return true
  } catch { return false }
}

export function descriptiveEvaluationComplete(items, state = {}) {
  return items.every(item => {
    const result = state[item.key] || {}
    if (result.error || result.status === 'invalid') return false
    if (result.status === 'not-attempted') return true
    const marks = Number(result.marks)
    return result.status === 'evaluated' && String(result.marks ?? '').trim() !== '' && Number.isFinite(marks) && marks >= 0 && marks <= item.maxMarks
  })
}
