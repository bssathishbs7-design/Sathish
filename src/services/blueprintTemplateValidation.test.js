import test from 'node:test'
import assert from 'node:assert/strict'
import { snapshotCompleteBlueprint, saveBlueprintTemplate } from './blueprintTemplates.js'

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

for (const [name, mutate, message] of [
  ['different competency rows', ({ tables }) => { tables.competencies[0].key = 'AN2.1' }, /same competencies/],
  ['different distribution total', ({ tables }) => { tables.distribution[0].distributionLabel = '9' }, /Distribution marks/],
  ['different cognition targets', ({ planner }) => { planner.blueprintCognitionWeightage = { lot: '50', hot: '50' } }, /cognition targets/],
  ['different allocation counts', ({ planner }) => { planner.blueprintTestSpecificationCountDraft['AN1.1'].mcqHot = '5' }, /counts and marks/],
  ['different allocation marks', ({ planner }) => { planner.blueprintTestSpecificationMarkDraft['AN1.1'] = { mcqLot: 5, mcqHot: 5 } }, /counts and marks/],
  ['fractional question counts', ({ tables }) => { tables.questionTypes[0].lotQuestionsValue = '4.5' }, /whole numbers/],
]) {
  test(`rejects ${name} despite a matched flag`, () => {
    const input = fixture()
    mutate(input)
    assert.throws(() => snapshotCompleteBlueprint(input.planner, input.tables), message)
  })
}

test('revalidates at final save without writing a partial template', async () => {
  const { planner, tables } = fixture()
  const snapshot = snapshotCompleteBlueprint(planner, tables)
  snapshot.blueprint.blueprintTestSpecificationCountDraft['AN1.1'].mcqHot = '9'
  let writes = 0
  await assert.rejects(saveBlueprintTemplate('Invalid', snapshot, { getItem: () => '[]', setItem: () => { writes++ } }), /counts and marks/)
  assert.equal(writes, 0)
})

test('saves all tables and manual allocation sources together', async () => {
  const { planner, tables } = fixture()
  let stored
  const saved = await saveBlueprintTemplate('Complete', snapshotCompleteBlueprint(planner, tables), {
    getItem: () => '[]', setItem: (key, value) => { if (key === 'vx-blueprint-breakdown-templates-v1') stored = JSON.parse(value) },
  })
  assert.deepEqual(stored[0], saved)
  assert.deepEqual(saved.tables, tables)
  assert.deepEqual(saved.blueprint.blueprintManualCells, planner.blueprintManualCells)
})
