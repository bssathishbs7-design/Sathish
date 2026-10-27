import { createDraftRecordCode } from './draftReference.js'
import { parseQid, mintQids } from './qid.js'
export const questionDisplayId = question => question?.assessmentQuestionId || question?.questionBankId || question?.bankId || question?.medsyQuestionId || question?.bankDisplayId || question?.draftCode || ''
export const isBankQuestion = question => Boolean(question.questionBankId || question.bankId || question.medsyQuestionId || question.originalQuestionId || String(question.source || '').toLowerCase() === 'question bank')
/** Preserve unchanged bank snapshots; author-owned questions acquire AQ IDs only at publication. */
export function publishAssessmentQuestions(rows, storage) {
  const needsId = rows.filter(question => !isBankQuestion(question) && !parseQid(question.assessmentQuestionId))
  const ids = mintQids('AQ', needsId.length, { storage, existing: rows })
  let index = 0
  return rows.map(question => needsId.includes(question) ? { ...question, draftCode: question.draftCode || createDraftRecordCode('AQ'), assessmentQuestionId: ids[index++] } : question)
}
/** Editing a bank snapshot creates an independent assessment question. */
export function detachBankQuestion(question) {
  const derivedFrom = questionDisplayId(question)
  return { ...question, questionBankId: undefined, bankId: undefined, bankDisplayId: undefined, medsyQuestionId: undefined, originalQuestionId: undefined,
    sourceQuestionId: undefined, assessmentQuestionId: undefined, source: 'Assessment', derivedFrom, draftCode: createDraftRecordCode('AQ') }
}
