/** Shared question classification and marks rules used by practice scoring and analytics. */
export const getQuestionType = (question = {}) => {
  const type = String(question.type ?? question.questionType ?? '').toLowerCase()
  if (type.includes('mcq') || type.includes('multiple')) return 'MCQ'
  if (type.includes('laq') || type.includes('long')) return 'LAQs'
  if (type.includes('saq') || type.includes('short')) return 'SAQs'
  return question.options?.length ? 'MCQ' : 'Practice'
}

export const parseMarksValue = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const match = String(value ?? '').match(/\d+(\.\d+)?/)
  return match ? Number(match[0]) : 0
}

export const getQuestionMarks = (question = {}) => {
  const directMarks = [
    question.marks,
    question.mark,
    question.totalMarks,
    question.maximumMarks,
    question.marksText,
  ].map(parseMarksValue).find((marks) => marks > 0)

  if (directMarks) return directMarks

  const sectionMarks = Array.isArray(question.descriptiveSections)
    ? question.descriptiveSections.reduce((total, section) => total + parseMarksValue(section?.marks), 0)
    : 0

  if (sectionMarks > 0) return sectionMarks

  const type = getQuestionType(question)
  if (type === 'MCQ') return 1
  if (type === 'SAQs') return 8
  if (type === 'LAQs') return 10
  return 0
}

/**
 * Count top-level questions and available marks by type; parts belong to their parent.
 * @param {{questions?: object[], mcq?: number, saqs?: number, laqs?: number}} session
 * @returns {{mcq: {count: number, total: number}, saqs: {count: number, total: number}, laqs: {count: number, total: number}}}
 */
export function getPracticeQuestionBreakdown(session = {}) {
  const result = { mcq: { count: 0, total: 0 }, saqs: { count: 0, total: 0 }, laqs: { count: 0, total: 0 } }
  for (const question of session.questions ?? []) {
    const entry = result[getQuestionType(question).toLowerCase()]
    if (!entry) continue
    entry.count += 1
    entry.total += getQuestionMarks(question)
  }
  if (!session.questions?.length) {
    for (const [key, type] of [['mcq', 'MCQ'], ['saqs', 'SAQs'], ['laqs', 'LAQs']]) {
      result[key].count = Math.max(0, Number(session[key]) || 0)
      result[key].total = result[key].count * getQuestionMarks({ type })
    }
  }
  return result
}
