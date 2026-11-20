import test from 'node:test'
import assert from 'node:assert/strict'
import { buildBlueprintSampleReport, buildBlueprintSampleWorksheet } from './blueprintSampleReport.js'

const template = {
  id: 'template-123', name: 'Anatomy', createdBy: 'Faculty',
  blueprint: { blueprintDraft: { subject: 'Human Anatomy', topics: ['Bones'], totalMark: '10' }, blueprintTestSpecificationMarkDraft: { a: { mcqLot: 2, mcqHot: 3, saqHot: 5 } } },
  tables: { distribution: [{ key: 'a', name: 'Describe the bones' }], competencies: [{ key: 'a', code: 'AN1.1' }] },
}
const sections = [
  { name: 'Marks Distribution', rows: [['AN1.1', 'Non-Clinical', 2, 1, 10, '10 to 11'], ['Total', '', 2, 1, 10, '']] },
  { name: 'Level of Cognition', rows: [[10, 20, 80, 2, 8]] },
  { name: 'Question Breakdown', rows: [['MCQs', 1, 5, 5, 3, 3, 2, 2]] },
  { name: 'LAQ Parts', headers: ['Question', 'Part', 'Cognition', 'Marks'], rows: [] },
]

test('sample report preserves metadata, marks, competency names and grouped matrix totals', () => {
  const report = buildBlueprintSampleReport(template, sections)
  assert.deepEqual(report.map(s => s.name), ['', 'MARKS DISTRIBUTION', 'LEVEL OF COGNITION', 'QUESTION BREAKDOWN', 'ASSESSMENT BLUEPRINT'])
  assert.deepEqual(report[0].rows[0], ['Template ID', 'template-123'])
  assert.equal(report[1].headers.length, 5)
  assert.equal(report[2].newPage, true)
  assert.deepEqual(report[2].rows[0], [10, 20, 80])
  assert.deepEqual(report[4].rows[0], ['Describe the bones', 2, 3, 0, 0, 0, 5, 10])
  assert.deepEqual(report[4].rows[1], ['Total', 2, 3, 0, 0, 0, 5, 10])
  assert.ok(report.every(s => s.widths.reduce((a, b) => a + b, 0) === 24))
})

test('worksheet has merged grouped headers, page break, numeric cells and optional LAQ details', () => {
  const report = buildBlueprintSampleReport(template, sections)
  const sheet = buildBlueprintSampleWorksheet(report)
  assert.equal(sheet.pageBreaks.length, 1)
  const header = sheet.data.find(row => row[0]?.value === 'Competency')
  assert.equal(header[0].rowSpan, 2)
  assert.equal(header[0].columnSpan, 10)
  assert.equal(header[10].value, 'MCQ')
  assert.equal(header[10].columnSpan, 4)
  const row = sheet.data.find(row => row[0]?.value === 'Describe the bones')
  assert.equal(row[22].value, 10)
  assert.equal(row[22].type, Number)
  const withParts = structuredClone(sections)
  withParts[3].rows.push([1, 'a', 'HoT', 5])
  assert.equal(buildBlueprintSampleReport(template, withParts).at(-1).name, 'LAQ PARTS')
})
