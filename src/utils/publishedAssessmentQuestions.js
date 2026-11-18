/** Resolve questions from a published assessment snapshot without borrowing another exam's draft.
 * @param {Object} assessment Published record, optionally containing previewSections or setup.
 * @param {Storage|null} storage Optional assessment-specific question storage.
 * @returns {Object[]} Saved question rows in their original order.
 */
export function getPublishedQuestionRows(assessment = {}, storage = null) {
  const sections = assessment.previewSections
  const candidates = [
    assessment.questionRows,
    Array.isArray(sections) ? sections.flatMap(section => section.questions || []) : null,
    assessment.questions,
    assessment.selectedQuestions,
    assessment.setup?.questionRows,
  ]
  const snapshot = candidates.find(rows => Array.isArray(rows) && rows.length > 0)
  if (snapshot) return snapshot
  const assessmentId = assessment.setup?.assessmentId || assessment.assessmentId || assessment.id
  if (assessmentId && storage) {
    try {
      const saved = JSON.parse(storage.getItem(`vx-create-assessment-questions:${assessmentId}`) || '[]')
      if (Array.isArray(saved)) return saved
    } catch {
      // Unavailable or malformed storage must not export a different assessment.
    }
  }
  return []
}
