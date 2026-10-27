import { reserveBlueprintIdentity } from './blueprintApproval.js'
import { createDraftRecordCode } from '../utils/draftReference.js'
import { isPermanentRecordId, mintRecordId } from '../utils/qid.js'
import { publishAssessmentQuestions } from '../utils/questionLifecycle.js'

/** Internal keys never change when the visible draft ID becomes permanent. */
export async function reserveAssessmentIdentity({ storage = globalThis.localStorage, now = () => new Date(), createId = () => globalThis.crypto.randomUUID() } = {}) {
  const draftCode = createDraftRecordCode('AP')
  const assessmentId = 'assessment-' + createId()
  const blueprint = storage ? await reserveBlueprintIdentity(assessmentId, { storage }) : null
  return { assessmentId, assessmentCode: draftCode, draftCode, blueprintId: blueprint?.blueprintId, createdAt: now().toISOString() }
}
/** Local publication adapter. Production allocation belongs in the server publication transaction. */
export function publishAssessmentIdentity(record, storage = globalThis.localStorage) {
  const setup = record.setup || {}
  const saved = JSON.parse(storage.getItem('vx-assessment-published') || '[]').find(row => (row.setup?.assessmentId || row.id) === (setup.assessmentId || record.id))
  const previous = saved?.setup?.assessmentCode || saved?.assessmentCode || setup.assessmentCode || record.assessmentCode
  const assessmentCode = isPermanentRecordId(previous, 'AP') ? previous : mintRecordId('AP', { storage, existing: [record] })
  const draftCode = setup.draftCode || record.draftCode || (previous?.startsWith('DRF') ? previous : undefined)
  const questionRows = publishAssessmentQuestions((record.questionRows || []).map(question => {
    const prior = saved?.questionRows?.find(row => row.id === question.id)
    return prior?.assessmentQuestionId && !question.assessmentQuestionId ? { ...question, assessmentQuestionId: prior.assessmentQuestionId } : question
  }), storage)
  const byId = new Map(questionRows.map(question => [question.id, question]))
  return { ...record, assessmentCode, draftCode, questionRows,
    previewSections: record.previewSections?.map(section => ({ ...section, questions: section.questions?.map(question => byId.get(question.id) || question) })),
    setup: { ...setup, assessmentCode, draftCode } }
}
