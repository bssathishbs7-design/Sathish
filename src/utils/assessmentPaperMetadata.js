/** Collect unique topic labels in paper order, including descriptive subquestions.
 * @param {Object[]} questions Saved paper questions.
 * @returns {string[]}
 */
export function getPaperTopics(questions = []) {
  const topics = new Map()
  const visit = question => {
    const values = [...(Array.isArray(question.topics) ? question.topics : []), question.topic]
    values.forEach(value => {
      const label = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
      if (label && !topics.has(label.toLowerCase())) topics.set(label.toLowerCase(), label)
    })
    ;[...(question.descriptiveSections || []), ...(question.children || [])].forEach(visit)
  }
  questions.forEach(visit)
  return [...topics.values()]
}

/** Format the scheduled calendar date without timezone conversion. */
export function getPaperExamDate(assessment = {}) {
  const setup = assessment.setup || {}
  const value = assessment.startDate || (setup.supervisionType === 'Practice Exam' ? setup.practiceStartDate : setup.examDate)
  const text = String(value || '').trim()
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/)
  if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`
  const local = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  return local ? `${local[1].padStart(2, '0')}-${local[2].padStart(2, '0')}-${local[3]}` : 'Not specified'
}
