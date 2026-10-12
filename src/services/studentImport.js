import { validateStudent, academicYearFor, today } from './studentManagement.js'

export const STUDENT_COLUMNS = ['Student ID', 'Full name', 'Email', 'Phone', 'Section', 'Subject', 'Joining date', 'Academic year']
const keys = ['registrationId', 'name', 'email', 'phone', 'section', 'subject', 'joinedOn', 'academicYear']

/** Converts sheet rows to a preview; all errors are shown before an atomic import. */
export function previewStudentSheet(rows, batch, directory) {
  if (rows.length < 2) throw new Error('The spreadsheet has no student rows.')
  if (rows.length > 1001) throw new Error('Import up to 1,000 students at a time.')
  const headers = rows[0].map(value => String(value || '').trim().toLowerCase())
  const missing = STUDENT_COLUMNS.filter(header => !headers.includes(header.toLowerCase()))
  if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}. Use the sample template.`)
  const seen = { registrationId: new Set(), email: new Set() }
  return rows.slice(1).map((row, index) => ({ row, number: index + 2 })).filter(({ row }) => row.some(value => value !== null && value !== '')).map(({ row, number }) => {
    const draft = { batch }
    keys.forEach((key, index) => {
      const cell = row[headers.indexOf(STUDENT_COLUMNS[index].toLowerCase())]
      draft[key] = cell instanceof Date ? cell.toISOString().slice(0, 10) : String(cell ?? '').trim()
    })
    draft.batchReason = String(row[headers.indexOf('batch reason')] ?? '').trim()
    const errors = Object.values(validateStudent(draft, directory))
    for (const key of ['registrationId', 'email']) {
      const value = draft[key].toLowerCase()
      if (seen[key].has(value)) errors.push(`Duplicate ${key === 'email' ? 'email' : 'student ID'} in this file.`)
      seen[key].add(value)
    }
    return { draft, row: number, errors }
  })
}

export async function readStudentFile(file) {
  if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('Choose an Excel .xlsx file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose a file smaller than 5 MB.')
  const { readSheet } = await import('read-excel-file/browser')
  return readSheet(file)
}

export async function downloadStudentTemplate() {
  const { default: writeExcel } = await import('write-excel-file/browser')
  await writeExcel([[...STUDENT_COLUMNS, 'Batch reason'], ['MC2026999', 'Sample Student', 'sample.student@example.edu', '9876543210', 'A', 'Human Anatomy', today(), academicYearFor(today()), '']]).toFile('StudentsFirstYearSample.xlsx')
}
