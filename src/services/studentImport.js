import { validateStudent, phoneIdentity, normaliseAcademicYear, academicYearFor } from './studentModel.js'
export const STUDENT_COLUMNS = ['Student ID', 'Student Name', 'Email', 'Code', 'Phone No', 'SGT']
const keys = ['registrationId', 'name', 'email', 'code', 'phone', 'section']
/** Six-column import: five required identity/contact values and optional SGT. Admission details come from the destination batch. */
export function previewStudentSheet(rows, batchId, directory) {
  const batch = directory.batches.find(b => b.id === batchId)
  if (!batch) throw new Error('Choose a destination batch.')
  if (rows.length < 2 || rows.length > 1001) throw new Error('Import between 1 and 1,000 student rows.')
  const headers = rows[0].map(value => String(value || '').trim().toLowerCase().replace('class/sec', 'sgt'))
  const missing = STUDENT_COLUMNS.filter(header => header !== 'SGT' && !headers.includes(header.toLowerCase()))
  if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}. Use the sample template.`)
  const seen = { registrationId: new Set(), email: new Set(), phone: new Set() }
  return rows.slice(1).map((row, index) => ({ row, number: index + 2 })).filter(({ row }) => row.some(value => value !== null && String(value).trim() !== '')).map(({ row, number }) => {
    const draft = { batch: batchId, academicYear: academicYearFor(batchId), course: batch.course, department: 'N/A', joinedOn: batch.startsOn, year: 'First Year' }
    keys.forEach((key, index) => { const value = row[headers.indexOf(STUDENT_COLUMNS[index].toLowerCase())]; draft[key] = value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '').trim() })
    draft.section ||= 'N/A'
    if (draft.code && !draft.code.startsWith('+')) draft.code = '+' + draft.code
    const fieldErrors = validateStudent(draft, directory)
    keys.slice(0, 5).forEach((key, index) => { if (!draft[key]) fieldErrors[key] = STUDENT_COLUMNS[index] + ' is required.' })
    const labels = Object.fromEntries(keys.map((key, index) => [key, STUDENT_COLUMNS[index]]))
    const issues = Object.entries(fieldErrors).map(([field, message]) => ({ field: labels[field] || field, message }))
    const errors = issues.map(issue => issue.message)
    const addIssue = (field, message) => { errors.push(message); issues.push({ field, message }) }
    const explicitYear = row[headers.indexOf('academic year')], stage = row[headers.indexOf('year')]
    if (explicitYear && normaliseAcademicYear(explicitYear) !== draft.academicYear) addIssue('Academic year', 'Academic year conflicts with the selected academic year.')
    if (stage && !['first year', '1', 'i'].includes(String(stage).toLowerCase())) addIssue('Year', 'Only First Year students can be imported.')
    for (const key of Object.keys(seen)) {
      const value = key === 'phone' ? phoneIdentity(draft) : draft[key].toLowerCase()
      if (seen[key].has(value)) addIssue(labels[key], `Duplicate ${key} in this file.`)
      if (value) seen[key].add(value)
    }
    return { draft, row: number, errors, issues, values: STUDENT_COLUMNS.map(column => row[headers.indexOf(column.toLowerCase())] ?? '') }
  })
}
export async function readStudentFile(file) {
  if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('Save the spreadsheet as Excel .xlsx and upload it again.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose a file smaller than 5 MiB.')
  const { default: readWorkbook } = await import('read-excel-file/browser')
  const sheets = await readWorkbook(file)
  const studentSheet = sheets.find(sheet => sheet.sheet.toLowerCase() !== 'errors')
  if (!studentSheet) throw new Error('No student worksheet found. Upload a workbook containing student data.')
  const errorsSheet = sheets.find(sheet => sheet.sheet.toLowerCase() === 'errors')
  const errorHeaders = errorsSheet?.data[0]?.map(value => String(value || '').trim().toLowerCase()) || []
  // Only the full-row correction format is re-importable; older message-only reports are ignored.
  if (!errorHeaders.includes('original row') || !STUDENT_COLUMNS.every(column => errorHeaders.includes(column.toLowerCase()))) return studentSheet.data
  const sourceHeaders = studentSheet.data[0]?.map(value => String(value || '').trim().toLowerCase()) || []
  const validRows = studentSheet.data.slice(1).map(row => STUDENT_COLUMNS.map(column => row[sourceHeaders.indexOf(column.toLowerCase())] ?? ''))
  const correctionRows = errorsSheet.data.slice(1).map(row => STUDENT_COLUMNS.map(column => row[errorHeaders.indexOf(column.toLowerCase())] ?? ''))
  return [STUDENT_COLUMNS, ...validRows, ...correctionRows]
}
export async function downloadStudentTemplate() {
  const { default: writeExcel } = await import('write-excel-file/browser')
  await writeExcel([STUDENT_COLUMNS, ['MC2026999', 'Sample Student', 'sample.student@example.edu', '+91', '9876543210', '']]).toFile('StudentsFirstYearSample.xlsx')
}
/** Download a copy of the original uploaded workbook with a refreshed error report. */
export async function downloadStudentErrors(preview, file) {
  if (!file) throw new Error('Choose the original Excel file again before downloading errors.')
  const { createStudentErrorWorkbook } = await import('./studentErrorWorkbook.js')
  const blob = await createStudentErrorWorkbook(file, preview)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name.replace(/\.xlsx$/i, '').replace(/_with_errors$/i, '') + '_with_errors.xlsx'
  document.body.appendChild(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Read and validate before revealing results, with a cancellable minimum analysis display time. */
export async function analyseStudentFile(file, batchId, directory, { signal, minimumDuration = 30000, readFile = readStudentFile } = {}) {
  const wait = new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Analysis cancelled', 'AbortError')) }
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve() }, minimumDuration)
    if (signal?.aborted) abort()
    else signal?.addEventListener('abort', abort, { once: true })
  })
  const read = Promise.resolve().then(() => readFile(file)).then(sheet => {
    const preview = previewStudentSheet(sheet, batchId, directory)
    if (!preview.length) throw new Error('The spreadsheet has no student rows. Add students and choose the file again.')
    return { sheet }
  }).catch(error => ({ error }))
  const [result] = await Promise.all([read, wait])
  if (signal?.aborted) throw new DOMException('Analysis cancelled', 'AbortError')
  if (result.error) throw result.error
  return result.sheet
}
