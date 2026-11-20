import { reserveBlueprintIdentity, BLUEPRINT_WORKFLOW_EVENT } from './blueprintApproval.js'
import { validateCompleteBlueprint } from './blueprintTemplateValidation.js'
import { readBlueprintTemplates } from './blueprintTemplates.js'

export const templateApprovalId = id => `template-approval:${id}`
const key = id => `vx-assessment-blueprint-workflow:${id}`
/** Submit an immutable template snapshot without changing the author assessment workflow. */
export async function submitBlueprintTemplateApproval(template, setup, reviewer, send, storage = localStorage) {
  if (typeof send !== 'function') throw new Error('Approval service is unavailable.')
  validateCompleteBlueprint(template.blueprint, template.tables)
  const id = templateApprovalId(template.id)
  const current = await reserveBlueprintIdentity(id, { storage })
  const latestStatus = readBlueprintTemplates(storage).find(row => row.id === template.id)?.templateApprovalStatus
    || JSON.parse(storage.getItem(key(id)) || 'null')?.status
  if (latestStatus === 'Approved' || template.approved) throw new Error('This template is already approved.')
  if (latestStatus === 'Pending Approval') throw new Error('This template is already pending approval.')
  const snapshot = { ...structuredClone(template.blueprint), assessmentId: id, enabled: false,
    blueprintDraft: { ...structuredClone(template.blueprint.blueprintDraft), template: template.id } }
  const flow = { ...current, templateId: template.id, revision: current.revision + 1, snapshot, reviewer,
    status: 'Pending Approval', approvalRequired: true, updatedAt: new Date().toISOString() }
  storage.setItem(key(id), JSON.stringify(flow))
  try {
    const result = await send({ activityId: `blueprint-${id}`, activityType: 'Blueprint', activityName: template.name,
      assessmentName: template.name, templateId: template.id, approvalStatus: 'Pending Approval', status: 'Pending Approval',
      blueprintId: flow.blueprintId, blueprintRevision: flow.revision, blueprintSnapshot: snapshot,
      questionRows: [], previewSections: [], setup: { ...setup, draftWorkspace: undefined, reworkReview: undefined, assessmentId: id, assessmentName: template.name, blueprintId: flow.blueprintId },
      approvalFaculty: reviewer, questionCount: (snapshot.pickerRows || []).reduce((sum, row) => sum + row.count, 0), totalMarks: template.totalMarks })
    if (result === false) throw new Error('Unable to send the template for approval. Please try again.')
  } catch (error) { storage.setItem(key(id), JSON.stringify(current)); throw error }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(BLUEPRINT_WORKFLOW_EVENT))
  return flow
}

/** Detach earlier template submissions while keeping their review identity and snapshot intact. */
export function detachLegacyTemplateApproval(assessmentId, storage = localStorage) {
  const current = JSON.parse(storage.getItem(key(assessmentId)) || 'null')
  const templateId = current?.snapshot?.blueprintDraft?.template
  if (!templateId || !assessmentId || assessmentId.startsWith('template-approval:') || current.status !== 'Pending Approval') return false
  const destination = key(templateApprovalId(templateId))
  if (storage.getItem(destination)) return false
  const detached = { ...current, templateId, originalAssessmentId: assessmentId }
  storage.setItem(destination, JSON.stringify(detached))
  try {
    storage.setItem(key(assessmentId), JSON.stringify({ ...current, status: 'Not required', approvalRequired: false,
      snapshot: { ...current.snapshot, enabled: false, blueprintDraft: { ...current.snapshot.blueprintDraft, template: '', templateSnapshot: null } } }))
    for (let index = 0; index < storage.length; index++) {
      const name = storage.key(index)
      if (!name.startsWith('vx-create-assessment-blueprint-planner:')) continue
      const value = JSON.parse(storage.getItem(name) || 'null')
      if (value?.workflowAssessmentId === assessmentId) storage.setItem(name, JSON.stringify({ ...value, enabled: false }))
    }
  } catch (error) { storage.setItem(key(assessmentId), JSON.stringify(current)); storage.removeItem(destination); throw error }
  return true
}
