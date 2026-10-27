import { parseQid, sameQid } from './qid.js'
import { parseDraftId } from './draftReference.js'
import { questionDisplayId } from './questionLifecycle.js'

const compact = value => String(value || '').toUpperCase().replace(/[\s_-]/g,'')
const distance = (a,b) => {
  if (a.length !== b.length) return Infinity
  const different = [...a].map((char,index) => char === b[index] ? -1 : index).filter(index => index >= 0)
  if (different.length === 1) return 1
  if (different.length === 2 && different[1] === different[0] + 1 && a[different[0]] === b[different[1]] && a[different[1]] === b[different[0]]) return 1
  return different.length
}
/** Exact ID / numeric / draft-alias / paper lookup. No partial match can bypass a failed check digit.
 * @returns {{questions:Object[],messages:string[]}}
 */
export function searchQuestionIds(rows, query, { assessments = [], deleted = [] } = {}) {
  const tokens = String(query || '').split(/[,;\n]/).map(value => value.trim()).filter(Boolean)
  if (!tokens.length) return { questions: rows, messages: [] }
  const found = new Set(), messages = []
  for (const token of tokens) {
    const parsed = parseQid(token), draft = parseDraftId(token), isNumber = /^\d{1,12}$/.test(token)
    const paper = assessments.find(record => [record.assessmentCode,record.setup?.assessmentCode,record.draftCode,record.setup?.draftCode].some(id => id && (sameQid(id,token) || compact(id) === compact(token))))
    if (paper) {
      const questions = paper.questionRows || [], bankIds = questions.filter(question => !question.assessmentQuestionId).map(question => question.originalQuestionId || question.id)
      const matches = rows.filter(question => bankIds.includes(question.id) || questions.some(snapshot => sameQid(questionDisplayId(snapshot),questionDisplayId(question))))
      matches.forEach(question => found.add(question))
      messages.push(`${matches.length} of ${questions.length} questions in ${paper.assessmentName || paper.setup?.assessmentName || 'Assessment'} (${paper.setup?.assessmentCode || paper.assessmentCode}). ${questions.length - matches.length} questions are assessment-owned or unavailable in this bank.`)
      continue
    }
    const matches = rows.filter(question => {
      const values = [questionDisplayId(question),question.draftCode,...(question.idAliases || [])].filter(Boolean)
      return values.some(value => parsed ? sameQid(value,token) : draft ? parseDraftId(value) === draft : isNumber ? parseQid(value)?.number === Number(token) : !parseQid(value) && compact(value) === compact(token))
    })
    matches.forEach(question => {
      found.add(question)
      if (draft && parseQid(questionDisplayId(question))) messages.push(`${draft} was approved as ${questionDisplayId(question)}.`)
    })
    const tombstone = deleted.find(row => sameQid(row.questionBankId,token) || compact(row.questionBankId) === compact(token))
    if (tombstone) messages.push(`${tombstone.questionBankId} was deleted ${tombstone.deletedAt || ''}: ${tombstone.reason || tombstone.deleteReason || 'Reason not recorded'}.`)
    if (!matches.length && !tombstone) {
      const suggestion = rows.map(questionDisplayId).filter(id => parseQid(id)).find(id => distance(compact(token),compact(id)) === 1)
      messages.push(suggestion ? `${token} (did you mean ${suggestion}?)` : `No matching ID: ${token}`)
    }
  }
  return { questions: rows.filter(question => found.has(question)), messages: [...new Set(messages)] }
}
