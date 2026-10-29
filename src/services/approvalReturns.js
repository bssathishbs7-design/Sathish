import { isInactiveQuestion, questionDecision, queueItems, questionReturnDeadline, requestStatus } from './approvalQueue.js'

/** Local deadline simulation. Production must run the same transition in a server job.
 * @returns {{rows: Array<object>, results: Array<object>}} Unchanged rows retain identity.
 */
export function returnOverdueQuestions(rows, now = Date.now()) {
  const results = []
  const next = rows.map(row => {
    if (requestStatus(row) !== 'Requests' || !row.questionRows?.length) return row
    const due = new Map(queueItems([row]).map(item => [item.question, questionReturnDeadline(item)]))
    const questions = row.questionRows.map(question => {
      const deadline = due.get(question)
      if (question.changeKind || isInactiveQuestion(question) || questionDecision(question) !== 'Pending' || deadline == null || deadline > now) return question
      const reviewedAt = new Date(deadline).toISOString()
      const remarks = 'Automatically returned to Draft after 14 days without a decision.'
      const history = [...(question.history || []), { action: 'Automatically returned', actor: 'System', timestamp: reviewedAt, remarks }]
      results.push({ questionId: question.id, status: 'Draft', remarks, reviewedAt, history })
      return { ...question, status: 'Draft', reviewStatus: 'Returned', autoReturnedAt: reviewedAt, reviewedAt, reviewRemarks: remarks, history }
    })
    if (questions.every((question, index) => question === row.questionRows[index])) return row
    const pending = questions.some(question => questionDecision(question) === 'Pending')
    return { ...row, questionRows: questions, ...(pending ? {} : { approvalStatus: 'Returned', status: 'Returned', reviewedAt: new Date(now).toISOString() }) }
  })
  return { rows: results.length ? next : rows, results }
}

/** Queue results before changing the queue; retry safely if browser storage is unavailable. */
export function saveAutomaticReturns(results, storage) {
  const current = JSON.parse(storage.getItem('vx-question-bank-review-results') || '[]')
  const merged = new Map(current.map(result => [result.questionId, result]))
  for (const result of results) {
    const previous = merged.get(result.questionId)
    if (!previous || Date.parse(previous.reviewedAt) <= Date.parse(result.reviewedAt)) merged.set(result.questionId, result)
  }
  storage.setItem('vx-question-bank-review-results', JSON.stringify([...merged.values()]))
}
