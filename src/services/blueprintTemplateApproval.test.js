import test from 'node:test'
import assert from 'node:assert/strict'
import { submitBlueprintTemplateApproval, detachLegacyTemplateApproval, templateApprovalId } from './blueprintTemplateApproval.js'
const fixture = () => ({
  planner: {
    validationStatus: 'matched',
    blueprintDraft: { subject: 'Anatomy', topics: ['General'], competencies: ['AN1.1'], totalMark: '10' },
    blueprintDistributionDraft: { 'AN1.1': '10' },
    blueprintCognitionWeightage: { lot: '40', hot: '60' },
    blueprintQuestionTypeDraft: { MCQs: { perQuestionMarks: '1', totalMarks: '10', lotQuestions: '4', hotQuestions: '6' } },
    blueprintLaqQuestionSplits: [],
    blueprintTestSpecificationCountDraft: { 'AN1.1': { mcqLot: '4', mcqHot: '6' } },
    blueprintTestSpecificationMarkDraft: { 'AN1.1': { mcqLot: 4, mcqHot: 6 } },
    blueprintManualCells: { 'AN1.1': { mcqLot: true } },
    blueprintUnitAssignments: {}, blueprintRebalanceMetadata: {}, pickerRows: [],
  },
  tables: {
    distribution: [{ key: 'AN1.1', distributionLabel: '10' }],
    questionTypes: [{ label: 'MCQs', perQuestionMarks: '1', totalMarks: '10', lotQuestionsValue: '4', hotQuestionsValue: '6' }],
    competencies: [{ key: 'AN1.1', targetMarks: 10 }],
    columns: [{ key: 'mcqLot' }, { key: 'mcqHot' }],
  },
})

const samples = () => { const {planner, tables} = fixture(); return [{id:'test', name:'Test', totalMarks:10, blueprint:planner, tables}] }

import { readBlueprintWorkflow, reviewBlueprintWorkflow, blueprintApprovalLocked } from './blueprintApproval.js'
import { readBlueprintTemplates } from './blueprintTemplates.js'
const memory = () => { const values = new Map(); return { get length() { return values.size }, key: index => [...values.keys()][index], getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } }

test('template approval updates its status without creating an assessment workflow', async () => {
  const storage = memory(), template = samples()[0]
  storage.setItem('vx-blueprint-breakdown-templates-v1', JSON.stringify([template]))
  storage.setItem('vx-blueprint-breakdown-templates-v1', JSON.stringify([template]))
  let record
  const flow = await submitBlueprintTemplateApproval(template, { assessmentId: 'assessment' }, {}, value => { record = value; return true }, storage)
  assert.equal(readBlueprintWorkflow('assessment', storage), null)
  assert.equal(flow.snapshot.enabled, false)
  assert.equal(readBlueprintTemplates(storage)[0].templateApprovalStatus, 'Pending Approval')
  template.blueprint.blueprintDraft.totalMark = '999'
  assert.notEqual(flow.snapshot.blueprintDraft.totalMark, '999')
  await assert.rejects(submitBlueprintTemplateApproval(samples()[0], {}, {}, () => true, storage), /already pending/)
  reviewBlueprintWorkflow(record, 'Approved', '', storage)
  assert.equal(readBlueprintTemplates(storage)[0].templateApprovalStatus, 'Approved')
  assert.equal(readBlueprintWorkflow('assessment', storage), null)
})

test('failed submission restores the previous template workflow', async () => {
  const storage = memory(), template = samples()[0]
  storage.setItem('vx-blueprint-breakdown-templates-v1', JSON.stringify([template]))
  await assert.rejects(submitBlueprintTemplateApproval(template, {}, {}, () => false, storage), /Unable to send/)
  assert.equal(readBlueprintWorkflow(templateApprovalId(template.id), storage).status, 'Draft')
})

test('legacy pending template review remains reviewable after unlocking the assessment', () => {
  const storage = memory(), template = samples()[0]
  storage.setItem('vx-blueprint-breakdown-templates-v1', JSON.stringify([template]))
  const snapshot = { ...template.blueprint, assessmentId: 'assessment', blueprintDraft: { ...template.blueprint.blueprintDraft, template: template.id } }
  storage.setItem('vx-assessment-blueprint-workflow:assessment', JSON.stringify({ assessmentId: 'assessment', status: 'Pending Approval', approvalRequired: true, revision: 1, snapshot }))
  assert.equal(detachLegacyTemplateApproval('assessment', storage), true)
  assert.equal(blueprintApprovalLocked(readBlueprintWorkflow('assessment', storage)), false)
  assert.equal(readBlueprintWorkflow('assessment', storage).snapshot.enabled, false)
  reviewBlueprintWorkflow({ setup: { assessmentId: 'assessment' }, blueprintSnapshot: snapshot, blueprintRevision: 1 }, 'Rejected', 'Revise', storage)
  assert.equal(readBlueprintTemplates(storage)[0].templateApprovalStatus, 'Rejected')
  assert.equal(blueprintApprovalLocked(readBlueprintWorkflow('assessment', storage)), false)
})
