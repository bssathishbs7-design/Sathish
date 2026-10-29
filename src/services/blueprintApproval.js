import { createDraftRecordCode } from '../utils/draftReference.js'
import { isPermanentRecordId, mintRecordId } from '../utils/qid.js'
import { readBlueprintTemplates, BLUEPRINT_TEMPLATES_KEY } from './blueprintTemplates.js'
import { appendAssessmentHistory } from './assessmentHistory.js'
const PREFIX = 'vx-assessment-blueprint-workflow:'
export const BLUEPRINT_WORKFLOW_EVENT = 'vx-blueprint-workflow-changed'
export const readBlueprintWorkflow = (id, storage = localStorage) => JSON.parse(storage.getItem(PREFIX + id) || 'null')
export const blueprintApprovalLocked = flow => Boolean(flow?.approvalRequired && flow.status !== 'Approved')
const notify = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event(BLUEPRINT_WORKFLOW_EVENT)) }
/** Reserve one draft blueprint ID per assessment, serialised across browser tabs. */
export async function reserveBlueprintIdentity(assessmentId, { storage = localStorage, locks = globalThis.navigator?.locks } = {}) {
  if (!assessmentId) throw new Error('Save the assessment identity before creating a blueprint.')
  const reserve = () => {
    const existing = readBlueprintWorkflow(assessmentId, storage)
    if (existing) return existing
    const draftCode = createDraftRecordCode('BP')
    const flow = { assessmentId, blueprintId: draftCode, draftCode, revision: 0, status: 'Draft', approvalRequired: false }
    storage.setItem(PREFIX + assessmentId, JSON.stringify(flow))
    return flow
  }
  return locks ? locks.request('medsy-blueprint-identity', reserve) : reserve()
}
/** Persist the exact snapshot being continued or submitted. Revisions retain their blueprint identity. */
export async function saveBlueprintWorkflow(assessment, snapshot, action, reviewer, options = {}) {
  const storage = options.storage || localStorage
  const id = assessment.setup?.assessmentId || assessment.assessmentId || assessment.id
  const current = await reserveBlueprintIdentity(id, options)
  if (current.status === 'Pending Approval') throw new Error('This blueprint is awaiting approval and cannot be changed.')
  const changed = JSON.stringify(current.snapshot) !== JSON.stringify(snapshot)
  if (action === 'continue' && current.approvalRequired && (current.status !== 'Approved' || changed)) throw new Error('Submit the revised blueprint for approval before continuing.')
  const revision = current.revision + (changed ? 1 : 0)
  const flow = { ...current, revision, snapshot, reviewer: reviewer || current.reviewer,
    approvalRequired: current.approvalRequired || action === 'approval',
    status: action === 'approval' ? 'Pending Approval' : current.approvalRequired ? 'Approved' : 'Not required', updatedAt: new Date().toISOString() }
  storage.setItem(PREFIX + id, JSON.stringify(flow))
  appendAssessmentHistory(assessment, { action: action === 'approval' ? 'Blueprint sent for approval' : 'Blueprint saved', notes: `${flow.blueprintId} / revision ${revision}` }, storage)
  notify()
  return flow
}
/** Stale review records cannot approve newer revisions. */
export function reviewBlueprintWorkflow(record, status, remarks, storage = localStorage, reviewedSnapshot) {
  const id = record.setup?.assessmentId || record.assessmentId
  const flow = readBlueprintWorkflow(id, storage)
  if (!flow || flow.status !== 'Pending Approval' || flow.revision !== record.blueprintRevision) throw new Error('This blueprint review is no longer current. Refresh the approval list.')
  if (status !== 'Approved' && !remarks?.trim()) throw new Error('Add remarks before rejecting the blueprint.')
  const snapshot = status === 'Approved' && reviewedSnapshot ? reviewedSnapshot : flow.snapshot
  const changed = JSON.stringify(snapshot) !== JSON.stringify(flow.snapshot)
  if (reviewedSnapshot && status === 'Approved') {
    const rows = snapshot.pickerRows || []
    const target = Number(snapshot.blueprintDraft?.totalMark)
    if (snapshot.assessmentId !== id || snapshot.validationStatus !== 'matched' || !rows.length || !(target > 0)
      || rows.some(row => !Number.isInteger(row.count) || row.count <= 0 || !(row.marks > 0))
      || Math.abs(rows.reduce((sum, row) => sum + row.count * row.marks, 0) - target) > 0.001) {
      throw new Error('Complete a valid blueprint matrix before approving.')
    }
  }
  const next = { ...flow, snapshot, revision: flow.revision + (changed ? 1 : 0), status: status === 'Approved' ? 'Approved' : 'Rejected', reviewRemarks: remarks || '', reviewedAt: new Date().toISOString() }
  if (status === 'Approved') {
    next.blueprintId = isPermanentRecordId(flow.blueprintId, 'BP') ? flow.blueprintId : mintRecordId('BP', { storage, existing: [flow] })
    const templates = readBlueprintTemplates(storage)
    const template = { id: next.blueprintId, blueprintId: next.blueprintId, name: record.assessmentName || record.activityName || next.blueprintId, approved: true, approvedBy: record.reviewedBy || '', approvedById: record.reviewedById || '',
      createdAt: next.reviewedAt, cognition: snapshot.blueprintCognitionWeightage || {}, breakdown: snapshot.blueprintQuestionTypeDraft || {}, laqParts: snapshot.laqParts || [], totalMarks: Number(snapshot.blueprintDraft?.totalMark) || 0 }
    storage.setItem(BLUEPRINT_TEMPLATES_KEY, JSON.stringify([template, ...templates.filter(row => row.id !== template.id)]))
  }
  storage.setItem(PREFIX + id, JSON.stringify(next))
  if (changed) appendAssessmentHistory(record, { action: 'Blueprint edited during review', notes: `${flow.blueprintId} / revision ${next.revision}`, actor: record.reviewedBy || '' }, storage)
  appendAssessmentHistory(record, { action: `Blueprint ${next.status.toLowerCase()}`, notes: `${flow.blueprintId} to ${next.blueprintId}: ${remarks || ''}`, actor: record.reviewedBy || '' }, storage)
  notify()
  return next
}
export function reviseBlueprintWorkflow(id, storage = localStorage) {
  const flow = readBlueprintWorkflow(id, storage)
  if (!flow || !flow.approvalRequired) return flow
  if (flow.status === 'Pending Approval') throw new Error('Wait for blueprint review before editing.')
  const next = { ...flow, status: 'Revision required' }
  storage.setItem(PREFIX + id, JSON.stringify(next)); notify(); return next
}

/** Delete only the paired workflow; approved reusable templates and ID counters remain intact. */
export function deleteBlueprintWorkflow(record, storage = globalThis.localStorage) {
  const id = record?.setup?.assessmentId || record?.assessmentId || record?.id
  if (!id) return
  storage.removeItem(PREFIX + id)
  notify()
}
