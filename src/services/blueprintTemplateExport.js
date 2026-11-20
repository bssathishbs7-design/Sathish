import { calculateCognitionMarks } from '../utils/blueprintCalculations.js'
import { buildBlueprintSampleReport, buildBlueprintSampleWorksheet } from './blueprintSampleReport.js'

/** Build format-independent export sections from the saved template, never live assessment edits.
 * @returns {Array<{name:string,headers:string[],rows:Array<Array<string|number>>}>}
 */
export function buildBlueprintExportSections(template) {
  if (!template?.blueprint || !template.tables) throw new Error('This template has no complete saved blueprint to download.')
  const b = template.blueprint, t = template.tables, draft = b.blueprintDraft
  const num = value => Number(value) || 0
  const cognition = calculateCognitionMarks({ totalMarks: num(draft.totalMark), hotPercentage: num(b.blueprintCognitionWeightage.hot) })
  const sections = [
    { name: 'Overview', headers: ['Field', 'Value'], rows: [
      ['Template', template.name], ['Subject', draft.subject], ['Topics', draft.topics.join(', ')],
      ['Competencies', draft.competencies.join(', ')], ['Total marks', num(draft.totalMark)],
      ['Created by', template.createdBy || ''], ['Saved at (UTC)', template.createdAt || ''],
    ] },
    { name: 'Marks Distribution', headers: ['Code', 'Type', 'Correlation', 'Weightage', 'Distribution', 'Suggested marks'], rows: t.distribution.map(row => [
      row.code || row.key, row.typeLabel || row.type || '', num(row.correlationLevel), num(row.weightageLabel), num(row.distributionLabel), row.markRangeLabel || row.suggestionLabel || row.suggestionMarks || '',
    ]) },
    { name: 'Level of Cognition', headers: ['Total marks', 'LoT percentage', 'HoT percentage', 'LoT marks', 'HoT marks'], rows: [[num(draft.totalMark), num(b.blueprintCognitionWeightage.lot), num(b.blueprintCognitionWeightage.hot), cognition.lotMarks, cognition.hotMarks]] },
    { name: 'Question Breakdown', headers: ['Type', 'Marks per question', 'Total marks', 'Total questions', 'HoT questions or parts', 'HoT marks', 'LoT questions or parts', 'LoT marks'], rows: t.questionTypes.map(row => {
      const parts = (b.blueprintLaqQuestionSplits || []).flatMap(q => q.splits || [])
      const hot = row.label === 'LAQs' ? parts.filter(p => p.level === 'hot').reduce((sum, p) => sum + num(p.marks), 0) : num(row.hotQuestionsValue) * num(row.perQuestionMarks)
      const lot = row.label === 'LAQs' ? parts.filter(p => p.level === 'lot').reduce((sum, p) => sum + num(p.marks), 0) : num(row.lotQuestionsValue) * num(row.perQuestionMarks)
      return [row.label, num(row.perQuestionMarks), num(row.totalMarks), num(row.perQuestionMarks) ? num(row.totalMarks) / num(row.perQuestionMarks) : 0, num(row.hotQuestionsValue), hot, num(row.lotQuestionsValue), lot]
    }) },
    { name: 'LAQ Parts', headers: ['Question', 'Part', 'Cognition', 'Marks'], rows: (b.blueprintLaqQuestionSplits || []).flatMap((q, i) => (q.splits || []).map((part, j) => [i + 1, part.label || String.fromCharCode(97 + j), part.level === 'hot' ? 'HoT' : 'LoT', num(part.marks)])) },
    { name: 'Assessment Blueprint', headers: ['Competency', ...t.columns.flatMap(c => [`${c.group || c.key} ${c.label || ''} count`, `${c.group || c.key} ${c.label || ''} marks`]), 'Target', 'Actual'], rows: t.competencies.map(row => {
      const marks = b.blueprintTestSpecificationMarkDraft?.[row.key] || {}
      return [row.code || row.key, ...t.columns.flatMap(c => [num(b.blueprintTestSpecificationCountDraft?.[row.key]?.[c.key]), num(marks[c.key])]), num(row.targetMarks), t.columns.reduce((sum, c) => sum + num(marks[c.key]), 0)]
    }) },
    { name: 'Allocation Sources', headers: ['Competency', 'Column', 'Count', 'Marks', 'Source'], rows: t.competencies.flatMap(row => t.columns.map(c => {
      const count = num(b.blueprintTestSpecificationCountDraft?.[row.key]?.[c.key])
      return [row.code || row.key, c.key, count, num(b.blueprintTestSpecificationMarkDraft?.[row.key]?.[c.key]), count ? (b.blueprintManualCells?.[row.key]?.[c.key] ? 'Manual' : 'Auto-filled') : '']
    })) },
  ]
  for (const name of ['Marks Distribution', 'Question Breakdown', 'Assessment Blueprint']) {
    const section = sections.find(s => s.name === name)
    section.rows.push(section.headers.map((_, i) => i === 0 ? 'Total' : name === 'Question Breakdown' && i === 1 ? '' : section.rows.every(row => typeof row[i] === 'number') ? Number(section.rows.reduce((sum, row) => sum + row[i], 0).toFixed(6)) : ''))
  }
  return sections
}

export const blueprintExportFilename = name => `${String(name || 'Blueprint').replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').trim().slice(0, 100) || 'Blueprint'}-Blueprint`

/** One sample-formatted worksheet per section, with portrait print settings. */
async function createBlueprintExcelBlob(template) {
  const report = buildBlueprintSampleReport(template, buildBlueprintExportSections(template))
  const { default: writeExcel } = await import('write-excel-file/browser')
  const names = ['Template Details', 'Marks Distribution', 'Level of Cognition', 'Question Breakdown', 'Assessment Blueprint', 'LAQ Parts']
  const blob = await writeExcel(report.map((section, index) => ({
    sheet: names[index],
    data: buildBlueprintSampleWorksheet([{ ...section, newPage: false }]).data,
    columns: Array.from({ length: 24 }, () => ({ width: 3 })),
    orientation: 'portrait', showGridLines: false,
  }))).toBlob()
  const { unzipSync, zipSync, strFromU8, strToU8 } = await import('fflate')
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()))
  for (let index = 0; index < report.length; index++) {
    const path = `xl/worksheets/sheet${index + 1}.xml`
    let xml = strFromU8(files[path])
    xml = xml.replace(/<pageMargins\b[^>]*\/>/g, '').replace(/<pageSetup\b[^>]*\/>/g, '')
    xml = xml.replace('</worksheet>', '<pageMargins left="1" right="1" top="1" bottom="0.75" header="0.3" footer="0.3"/><pageSetup paperSize="1" orientation="portrait" fitToWidth="1" fitToHeight="0"/></worksheet>')
    const rootEnd = xml.indexOf('>', xml.indexOf('<worksheet')) + 1
    xml = xml.slice(0, rootEnd) + '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' + xml.slice(rootEnd)
    files[path] = strToU8(xml)
  }
  return new Blob([zipSync(files)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

/** Prepare a reusable File for downloads or the operating system's file-share sheet. */
export async function createBlueprintFile(template, format) {
  let blob
  if (format === 'pdf') {
    const { createBlueprintPdf } = await import('./blueprintTemplatePdf.js')
    blob = await createBlueprintPdf(template.name, buildBlueprintSampleReport(template, buildBlueprintExportSections(template)))
  } else if (format === 'excel') blob = await createBlueprintExcelBlob(template)
  else throw new Error('Choose PDF or Excel.')
  return new File([blob], `${blueprintExportFilename(template.name)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`, {
    type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export function downloadBlueprintFile(file) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export async function downloadBlueprintPdf(template) { downloadBlueprintFile(await createBlueprintFile(template, 'pdf')) }
export async function downloadBlueprintExcel(template) { downloadBlueprintFile(await createBlueprintFile(template, 'excel')) }
