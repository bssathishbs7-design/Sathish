import test from 'node:test'
import assert from 'node:assert/strict'
import { buildBlueprintExportSections, blueprintExportFilename } from './blueprintTemplateExport.js'

test('exports every saved row, numeric totals, LAQ parts and manual sources without changing the template', () => {
  const template = {
    name: 'Anatomy', blueprint: {
      blueprintDraft: { subject: 'Anatomy', topics: ['General'], competencies: ['AN1.1'], totalMark: '10' },
      blueprintCognitionWeightage: { hot: '60', lot: '40' },
      blueprintLaqQuestionSplits: [{ splits: [{ marks: '4', level: 'lot' }, { marks: '6', level: 'hot' }] }],
      blueprintTestSpecificationCountDraft: { 'AN1.1': { laqLot: '1', laqHot: '1' } },
      blueprintTestSpecificationMarkDraft: { 'AN1.1': { laqLot: 4, laqHot: 6 } },
      blueprintManualCells: { 'AN1.1': { laqHot: true } },
    }, tables: {
      distribution: [{ code: 'AN1.1', distributionLabel: '10', weightageLabel: '1.00', markRangeLabel: '10 to 11' }],
      questionTypes: [{ label: 'LAQs', perQuestionMarks: '10', totalMarks: '10', hotQuestionsValue: '1', lotQuestionsValue: '1' }],
      competencies: [{ key: 'AN1.1', targetMarks: 10 }], columns: [{ key: 'laqLot' }, { key: 'laqHot' }],
    },
  }
  const before = structuredClone(template)
  const sections = buildBlueprintExportSections(template)
  assert.equal(sections.length, 7)
  assert.deepEqual(sections.find(s => s.name === 'Level of Cognition').rows[0], [10, 40, 60, 4, 6])
  assert.deepEqual(sections.find(s => s.name === 'Question Breakdown').rows[0], ['LAQs', 10, 10, 1, 1, 6, 1, 4])
  assert.equal(sections.find(s => s.name === 'LAQ Parts').rows.length, 2)
  assert.equal(sections.find(s => s.name === 'Allocation Sources').rows[1][4], 'Manual')
  assert.equal(sections.find(s => s.name === 'Marks Distribution').rows[0][5], '10 to 11')
  assert.deepEqual(template, before)
  template.tables.distribution = Array.from({ length: 100 }, (_, i) => ({ code: `AN${i}`, distributionLabel: '1' }))
  assert.equal(buildBlueprintExportSections(template)[1].rows.length, 101)
})

test('rejects partial exports and sanitizes download names', () => {
  assert.throws(() => buildBlueprintExportSections({}), /no complete saved blueprint/)
  assert.equal(blueprintExportFilename('Test/23'), 'Test-23-Blueprint')
})
