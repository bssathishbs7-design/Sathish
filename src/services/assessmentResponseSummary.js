/** Resolve the card's type and saved response modes without reading another workflow's draft.
 * @param {Object} record Saved draft, submission, or published assessment.
 * @param {Array<Object>} [questions] Optional current draft questions supplied by the tracker.
 */
export function getAssessmentResponseSummary(record = {}, questions) {
  const setup = {...record, ...record.setup}
  const rows = questions ?? record.questionRows ?? record.previewSections?.flatMap(section => section.questions || []) ?? setup.questionRows
  let hasMcq = false, hasDescriptive = false
  if (Array.isArray(rows) && rows.length) {
    hasMcq = rows.some(row => /mcq|multiple.?choice/i.test(row.type || row.questionType || ''))
    hasDescriptive = rows.some(row => /descriptive|saq|laq|meq|essay|short.?answer|long.?answer/i.test(row.type || row.questionType || ''))
  } else if (!Array.isArray(rows) && Number(record.questionCount) > 0) {
    hasMcq = /mcq|hybrid/i.test(setup.examType || '')
    hasDescriptive = /descriptive|hybrid|saq|laq|meq/i.test(setup.examType || '')
  }
  const offline = String(setup.examDeliveryMode || setup.examMode || '').toLowerCase() === 'offline'
  const details = [['mcq','MCQ',hasMcq],['descriptive','Descriptive',hasDescriptive]].filter(([, ,included])=>included).map(([key,label])=>({label, response: offline ? 'Answers provided offline' : setup[key+'DisplayType'] === 'Read-Only' ? 'Read-only' : 'Online Response'}))
  return {type: hasMcq && hasDescriptive ? 'Hybrid' : hasMcq ? 'MCQ' : hasDescriptive ? 'Descriptive' : 'Not set', details}
}
