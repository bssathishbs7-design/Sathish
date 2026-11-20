/** Convert the saved sections into the supplied two-page sample's report layout.
 * Widths use a 24-column grid shared by PDF and Excel. Allocation cells contain
 * marks (not question counts), matching the sample's total-marks matrix.
 * @returns {Array<{name:string,widths:number[],headers:string[],rows:Array,newPage?:boolean,grouped?:boolean}>}
 */
export function buildBlueprintSampleReport(template, sections) {
  const b = template.blueprint, draft = b.blueprintDraft
  const section = name => sections.find(item => item.name === name)
  const keys = ['mcqLot', 'mcqHot', 'laqLot', 'laqHot', 'saqLot', 'saqHot']
  const number = value => Number(value) || 0
  const matrixRows = template.tables.competencies.map(row => {
    const source = template.tables.distribution.find(item => item.key === row.key || item.code === row.code)
    const label = String(row.name || source?.name || row.code || row.key).replace(/<[^>]*>/g, '').trim()
    const marks = keys.map(key => number(b.blueprintTestSpecificationMarkDraft?.[row.key]?.[key]))
    return [label, ...marks, marks.reduce((sum, value) => sum + value, 0)]
  })
  matrixRows.push(['Total', ...keys.map((_, i) => matrixRows.reduce((sum, row) => sum + row[i + 1], 0)), matrixRows.reduce((sum, row) => sum + row[7], 0)])
  const report = [
    { name: '', widths: [5, 19], headers: [], rows: [
      ['Template ID', template.templateId || template.id || 'Not available'],
      ['Template Name', template.name], ['Subject', draft.subject], ['Topics', draft.topics.join(', ')],
      ['Total Marks', number(draft.totalMark)], ['Created by', template.createdBy || 'Not available'],
    ] },
    { name: 'MARKS DISTRIBUTION', widths: [5, 5, 4, 5, 5], headers: ['Code', 'Type', 'Correlation', 'Weightage', 'Distribution'], rows: section('Marks Distribution').rows.map(row => row.slice(0, 5)) },
    { name: 'LEVEL OF COGNITION', newPage: true, widths: [8, 8, 8], headers: ['Total marks', 'LoT percentage', 'HoT percentage'], rows: section('Level of Cognition').rows.map(row => row.slice(0, 3)) },
    { name: 'QUESTION BREAKDOWN', widths: [6, 4, 3, 3, 2, 2, 2, 2], headers: ['Type', 'Per Question Marks', 'Total Marks', 'Total Qus', 'HoT Qus', 'HoT marks', 'LoT Qus', 'LoT marks'], rows: section('Question Breakdown').rows },
    { name: 'ASSESSMENT BLUEPRINT', grouped: true, widths: [10, 2, 2, 2, 2, 2, 2, 2], headers: ['Competency', 'LoT', 'HoT', 'LoT', 'HoT', 'LoT', 'HoT', 'Total'], rows: matrixRows },
  ]
  const parts = section('LAQ Parts')
  if (parts.rows.length) report.push({ name: 'LAQ PARTS', widths: [6, 6, 6, 6], headers: parts.headers, rows: parts.rows })
  return report
}

/** Build a single printable worksheet with merged headers and genuine numeric cells. */
export function buildBlueprintSampleWorksheet(report) {
  const data = [], pageBreaks = []
  const cell = (value, span, bold = false, align = 'center') => ({ value, columnSpan: span, type: typeof value === 'number' ? Number : String, fontFamily: 'Arial', fontSize: 10, fontWeight: bold ? 'bold' : undefined, color: '#000000', backgroundColor: '#FFFFFF', borderColor: '#000000', borderStyle: 'thin', wrap: true, align, alignVertical: 'center' })
  const row = (values, widths, bold, overview = false) => {
    const output = Array(24).fill(null)
    let col = 0
    let height = 15
    values.forEach((value, i) => {
      output[col] = cell(value, widths[i], bold || overview && i === 0, overview || i === 0 && typeof value === 'string' ? 'left' : 'center')
      if (!overview && typeof value === 'number' && widths.length === 5 && i === 3) output[col].format = '0.00'
      height = Math.max(height, Math.ceil(String(value).length / Math.max(5, widths[i] * 3)) * 12 + 4)
      col += widths[i]
    })
    output[0].height = height
    return output
  }
  for (const section of report) {
    if (data.length) data.push([], [])
    if (section.newPage) pageBreaks.push(data.length)
    if (section.name) data.push([{ value: section.name, columnSpan: 24, fontWeight: 'bold', fontSize: 10, height: 22 }, ...Array(23).fill(null)])
    if (section.grouped) {
      const top = row(['Competency', 'MCQ', 'LAQ', 'SAQ', 'Total'], [10, 4, 4, 4, 2], true)
      top[0].rowSpan = 2; top[22].rowSpan = 2
      const sub = row(section.headers, section.widths, true)
      sub[0] = null; sub[22] = null
      data.push(top, sub)
    } else if (section.headers.length) data.push(row(section.headers, section.widths, true).map(value => value ? { ...value, align: 'center' } : null))
    for (const values of section.rows) data.push(row(values, section.widths, values[0] === 'Total', !section.name))
  }
  return { data, pageBreaks }
}
