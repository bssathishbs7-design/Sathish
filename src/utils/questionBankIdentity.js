import { mintQids, parseQid } from './qid.js'
const storedId = question => String(question?.questionBankId || question?.bankId || question?.medsyQuestionId || '').trim()
export const getInstituteQuestionBankId = question => {
  const value = storedId(question), parsed = parseQid(value)
  return parsed?.type === 'QB' && parsed.institution !== 'MED' || /^INS-A01-\d{5}$/i.test(value) ? value : ''
}
/** Approval-only allocator. Own edits preserve their target ID; derived questions get a new bank identity. */
export function assignInstituteQuestionBankIds(questions = [], existingQuestions = [], options = {}) {
  const existingById = new Map(existingQuestions.map(question => [question.id, question]))
  const preserved = questions.map(question => question.replaceQuestionId
    ? getInstituteQuestionBankId(existingById.get(question.replaceQuestionId))
    : getInstituteQuestionBankId(question))
  const ids = mintQids('QB', preserved.filter(value => !value).length, { ...options, existing: [...existingQuestions, ...questions] })
  let index = 0
  return questions.map((question, position) => ({ ...question, history: question.replaceQuestionId ? [...(existingById.get(question.replaceQuestionId)?.history || []), { action: 'Edited: Approved edit replaced the content; the ID is unchanged', timestamp: new Date().toISOString() }] : question.history || [], id: question.replaceQuestionId || question.id,
    idAliases: [...new Set([...(existingById.get(question.replaceQuestionId)?.idAliases || []), existingById.get(question.replaceQuestionId)?.draftCode, ...(question.idAliases || [])].filter(Boolean))], replaceQuestionId: undefined,
    questionBankId: preserved[position] || ids[index++], assessmentQuestionId: undefined, derivedFrom: question.assessmentQuestionId || question.derivedFrom, isInstituteQuestion: true, isInstitute: undefined }))
}
