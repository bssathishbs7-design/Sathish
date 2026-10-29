import { queueItems, requestKey, requestStatus } from './approvalQueue.js'
import { plainQuestionText, queueItemId } from './approvalQueuePresentation.js'

/** Normalised word-bigram Dice similarity. Deterministic, advisory wording comparison, not semantic AI. */
export function wordingTokens(question) {
  const words = plainQuestionText(question.questionText || question.question || question.title).normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) || []
  if (!words.length) return new Set()
  return new Set(words.length === 1 ? words : words.slice(1).map((word, index) => `${words[index]} ${word}`))
}
export function wordingSimilarity(a, b) {
  if (!a.size || !b.size) return 0
  let common = 0
  for (const word of a) if (b.has(word)) common++
  return 2 * common / (a.size + b.size)
}
/** Compare against all pending local questions and institution bank records, excluding self/original and lifecycle requests. */
export function findQuestionDuplicates(requests, bank = []) {
  const pending = queueItems(requests).filter(row => row.question && !row.question.changeKind && requestStatus(row) === 'Requests')
  const corpus = [
    ...pending.map(row => ({ key: requestKey(row), question: row.question, id: queueItemId(row), tokens: wordingTokens(row.question) })),
    ...bank.filter(question => !String(question.qid || question.questionBankId || question.bankId || question.medsyQuestionId || '').startsWith('MED-')
      && !/medsy/i.test(question.sourceType || question.source || '') && !question.archivedAt && !question.deletedAt && !/archived|deleted/i.test(question.status || ''))
      .map(question => ({ question, id: queueItemId({ question }), tokens: wordingTokens(question) })),
  ]
  const index = new Map()
  corpus.forEach((entry, i) => { for (const token of entry.tokens) { if (!index.has(token)) index.set(token, new Set()); index.get(token).add(i) } })
  const results = new Map()
  for (const row of pending) {
    const question = row.question, tokens = wordingTokens(question), candidates = new Set()
    for (const token of tokens) for (const i of index.get(token) || []) candidates.add(i)
    const ownIds = new Set([question.id, question.qid, question.questionBankId, question.bankId, question.replaceQuestionId,
      ...(question.replaceQuestionId || question.questionBankEditMode === 'overwrite' ? [question.sourceBankId, question.originalQuestionId, question.sourceQuestionId, question.derivedFrom] : [])].filter(Boolean))
    let best = null
    for (const i of candidates) {
      const candidate = corpus[i]
      if (!candidate.id || candidate.key === requestKey(row) || ownIds.has(candidate.question.id) || ownIds.has(candidate.id)) continue
      const score = wordingSimilarity(tokens, candidate.tokens)
      if (score >= .8 && (!best || score > best.score || score === best.score && candidate.id.localeCompare(best.id) < 0)) best = { id: candidate.id, score }
    }
    if (best) results.set(requestKey(row), best)
  }
  return results
}
export function readInstitutionBank(storage) {
  const records = new Map()
  for (const key of ['vx-question-bank-questions', 'vx-question-bank-published-questions']) {
    try { const rows = JSON.parse(storage.getItem(key) || '[]'); if (Array.isArray(rows)) rows.forEach(row => records.set(row.id || row.qid || row.questionBankId, row)) } catch { /* One invalid cache must not hide the other bank source. */ }
  }
  return [...records.values()].filter(row => row.qid || row.questionBankId || row.bankId)
}
