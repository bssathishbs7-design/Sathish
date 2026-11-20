import { createBlueprintTemplateSamples } from './blueprintTemplateSamples.js'
import { validateCompleteBlueprint } from './blueprintTemplateValidation.js'
import { updateUnreadBlueprintTemplates } from './blueprintTemplateNotifications.js'

/** Browser-backed template adapter. Replace these functions with API calls at integration. */
export const BLUEPRINT_TEMPLATES_KEY = 'vx-blueprint-breakdown-templates-v1'
/** Restore saved percentages, or recover older templates from complete mark allocations.
 * Older templates did not store percentages; their allocations are the only evidence.
 * @returns {{lot:string,hot:string}|null} Null means there is insufficient saved data.
 */
export function resolveTemplateCognition(template) {
  if (!template) return null
  const saved = template.cognition
  if (saved && saved.lot !== '' && saved.hot !== ''
    && Number(saved.lot) >= 0 && Number(saved.hot) >= 0
    && Math.abs(Number(saved.lot) + Number(saved.hot) - 100) < 0.000001) {
    return { lot: String(saved.lot), hot: String(saved.hot) }
  }
  let total = 0
  let hot = 0
  for (const [label, row] of Object.entries(template.breakdown || {})) {
    const marks = Number(row.totalMarks)
    if (!marks) continue
    if (!Number.isFinite(marks) || marks < 0) return null
    let hotMarks
    let lotMarks
    if (label === 'LAQs') {
      const parts = (template.laqParts || []).flatMap(question => question.splits || [])
      if (!parts.length || parts.some(part => !['hot', 'lot'].includes(part.level) || !(Number(part.marks) > 0))) return null
      hotMarks = parts.reduce((sum, part) => sum + (part.level === 'hot' ? Number(part.marks) : 0), 0)
      lotMarks = parts.reduce((sum, part) => sum + (part.level === 'lot' ? Number(part.marks) : 0), 0)
    } else if (label.startsWith('SAQs (') && ['hot', 'lot'].includes(row.cognitionMode)) {
      hotMarks = row.cognitionMode === 'hot' ? marks : 0
      lotMarks = marks - hotMarks
    } else {
      if (row.hotQuestions === '' || row.lotQuestions === '' || !(Number(row.perQuestionMarks) > 0)) return null
      hotMarks = Number(row.hotQuestions) * Number(row.perQuestionMarks)
      lotMarks = Number(row.lotQuestions) * Number(row.perQuestionMarks)
    }
    if (!Number.isFinite(hotMarks + lotMarks) || hotMarks < 0 || lotMarks < 0 || Math.abs(hotMarks + lotMarks - marks) > 0.000001) return null
    total += marks
    hot += hotMarks
  }
  if (!total || Math.abs(total - Number(template.totalMarks)) > 0.000001) return null
  const hotPercent = Number((hot * 100 / total).toFixed(6))
  return { hot: String(hotPercent), lot: String(Number((100 - hotPercent).toFixed(6))) }
}
/** @typedef {{id:string,name:string,createdAt:string,createdBy?:string,cognition?:{lot:string,hot:string},breakdown:Object,laqParts:Array,totalMarks:number,blueprint?:Object,tables?:Object,schemaVersion?:number}} BlueprintTemplate */
export function readBlueprintTemplates(storage = localStorage) {
  const saved = storage.getItem(BLUEPRINT_TEMPLATES_KEY)
  const rows = saved === null ? createBlueprintTemplateSamples() : JSON.parse(saved)
  if (!Array.isArray(rows)) throw new Error('Unable to read saved templates.')
  // Older submissions belong to assessment workflows, not template-specific keys.
  // Index every linked review so each row retains its own status across assessments.
  const legacyApprovals = new Map()
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index)
    if (!key?.startsWith('vx-assessment-blueprint-workflow:') || key.includes(':template-approval:')) continue
    let flow
    try { flow = JSON.parse(storage.getItem(key) || 'null') } catch { continue }
    const templateId = flow?.templateId || flow?.snapshot?.blueprintDraft?.template
    if (flow?.status === 'Approval Rejected') flow.status = 'Rejected'
    if (!templateId || !['Pending Approval', 'Approved', 'Rejected', 'Revision required'].includes(flow.status)) continue
    const previous = legacyApprovals.get(templateId)
    if (!previous || String(flow.reviewedAt || flow.updatedAt || '') >= String(previous.reviewedAt || previous.updatedAt || '')) legacyApprovals.set(templateId, flow)
  }
  return rows.map(row => {
    const direct = JSON.parse(storage.getItem('vx-assessment-blueprint-workflow:template-approval:' + row.id) || 'null')
    const legacy = legacyApprovals.get(row.id)
    const timestamp = flow => Math.max(Date.parse(flow?.reviewedAt || '') || 0, Date.parse(flow?.updatedAt || '') || 0)
    const approval = legacy && timestamp(legacy) > timestamp(direct) ? legacy : direct || legacy
    return approval ? { ...row, blueprintId: approval.blueprintId || approval.snapshot?.blueprintId || row.blueprintId || row.blueprint?.blueprintId, templateApprovalStatus: approval.status === 'Approval Rejected' ? 'Rejected' : approval.status } : row
  })
}
/** Legacy breakdown adapter, retained for existing templates and institution samples. */
export function snapshotBlueprintBreakdown(rows, laqParts, cognition = { lot: '', hot: '' }) {
  const breakdown = Object.fromEntries(rows.map(row => [row.label, {
    perQuestionMarks: row.perQuestionMarks, totalMarks: row.totalMarks,
    hotQuestions: row.hotQuestionsValue, lotQuestions: row.lotQuestionsValue,
    ...(row.cognitionMode ? { cognitionMode: row.cognitionMode } : {}),
  }]))
  return { cognition: { lot: String(cognition.lot), hot: String(cognition.hot) }, breakdown, laqParts: structuredClone(laqParts), totalMarks: rows.reduce((sum, row) => sum + (Number(row.totalMarks) || 0), 0) }
}
/** Complete reusable payload. Inputs and rendered tables are copied together; assessment
 * identities, approvals and nested source templates must never travel with a template.
 * @param {Object} planner Planner input state including all curriculum and allocation fields.
 * @param {{distribution:Array,questionTypes:Array,competencies:Array,columns:Array}} tables Rendered table data.
 * @returns {Object} Versioned, independent template payload suitable for an API body.
 */
export function snapshotCompleteBlueprint(planner, tables) {
  if (planner.validationStatus !== 'matched' || !planner.blueprintDraft?.subject
    || !planner.blueprintDraft.topics?.length || !planner.blueprintDraft.competencies?.length) {
    throw new Error('Complete a valid blueprint matrix before saving a template.')
  }
  const { subject, topics, competencies, totalMark } = planner.blueprintDraft
  validateCompleteBlueprint(planner, tables)
  const fields = ['blueprintDistributionDraft', 'blueprintCognitionWeightage', 'blueprintQuestionTypeDraft',
    'blueprintLaqQuestionSplits', 'blueprintTestSpecificationCountDraft', 'blueprintTestSpecificationMarkDraft',
    'blueprintUnitAssignments', 'blueprintManualCells', 'blueprintRebalanceMetadata', 'pickerRows']
  const blueprint = structuredClone(Object.fromEntries(fields.map(key => [key, planner[key]])))
  blueprint.blueprintDraft = structuredClone({ subject, topics, competencies, totalMark, referenceRows: tables.distribution })
  blueprint.validationStatus = 'matched'
  blueprint.schemaVersion = 3
  return {
    ...snapshotBlueprintBreakdown(tables.questionTypes, planner.blueprintLaqQuestionSplits, planner.blueprintCognitionWeightage),
    schemaVersion: 2, blueprint, tables: structuredClone(tables),
  }
}

/** Each application receives an independent copy, including deeply nested allocation cells. */
export function restoreCompleteBlueprint(template) {
  return template?.schemaVersion === 2 && template.blueprint ? structuredClone(template.blueprint) : null
}
/** @returns {Promise<BlueprintTemplate>} Validates names and persists before reporting success. */
export async function saveBlueprintTemplate(name, snapshot, storage = localStorage, createdBy = '', existingId = '') {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Enter a blueprint name.')
  if (trimmed.length > 80) throw new Error('Use 80 characters or fewer.')
  if (snapshot.schemaVersion === 2) validateCompleteBlueprint(snapshot.blueprint, snapshot.tables)
  const rows = readBlueprintTemplates(storage)
  const existing = existingId ? rows.find(row => row.id === existingId) : null
  if (existingId && !existing) throw new Error('This template is no longer available. Save it as a new template.')
  if (['Pending Approval', 'Approved'].includes(existing?.templateApprovalStatus)) throw new Error('This template cannot be edited while pending or approved.')
  if (existing && (existing.scope === 'institution' || existing.approved)) throw new Error('This template cannot be edited.')
  const normalise = value => value.trim().replace(/\s+/g, ' ').toLowerCase()
  if (['default', 'create blueprint (default)'].includes(normalise(trimmed)) || rows.some(row => row.id !== existingId && normalise(row.name) === normalise(trimmed))) throw new Error('A template with this name already exists. Choose another name.')
  const template = { id: crypto.randomUUID(), name: trimmed, createdAt: new Date().toISOString(), createdBy, cognition: { lot: snapshot.cognition.lot, hot: snapshot.cognition.hot }, breakdown: structuredClone(snapshot.breakdown), laqParts: structuredClone(snapshot.laqParts), totalMarks: snapshot.totalMarks }
  if (snapshot.schemaVersion === 2 && snapshot.blueprint) {
    template.schemaVersion = 2
    template.blueprint = structuredClone(snapshot.blueprint)
    template.tables = structuredClone(snapshot.tables)
  }
  if (existing) Object.assign(template, { id: existing.id, createdAt: existing.createdAt, createdBy: existing.createdBy, updatedAt: new Date().toISOString() })
  try { storage.setItem(BLUEPRINT_TEMPLATES_KEY, JSON.stringify(existing ? rows.map(row => row.id === existingId ? template : row) : [...rows, template])) }
  catch { throw new Error('Unable to save template. Check browser storage and try again.') }
  if (!existing) updateUnreadBlueprintTemplates({ added: [template.id] }, storage)
  return template
}

/** Remove a reusable template only. Assessment drafts and loaded values are untouched. */
export async function deleteBlueprintTemplate(id, storage = localStorage) {
  if (id.startsWith('institution-blueprint-')) throw new Error('Institution templates cannot be deleted.')
  if (id === 'default') throw new Error('The default option cannot be deleted.')
  const rows = readBlueprintTemplates(storage)
  if (['Pending Approval', 'Approved'].includes(rows.find(row => row.id === id)?.templateApprovalStatus)) throw new Error('This template cannot be deleted while pending or approved.')
  if (rows.find(row => row.id === id)?.scope === 'institution') throw new Error('Institution templates cannot be deleted.')
  if (rows.find(row => row.id === id)?.approved) throw new Error('Approved blueprint templates cannot be deleted.')
  try { storage.setItem(BLUEPRINT_TEMPLATES_KEY, JSON.stringify(rows.filter(row => row.id !== id))) }
  catch { throw new Error('Unable to delete template. Please try again.') }
}
