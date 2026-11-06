import { profileErrors, SUBJECT_CATALOG } from './facultyModel.js'
export const FACULTY_COLUMNS = ['Employee ID','Full name','Email','Phone','Department','Designation','Subjects']
/** Faculty-only workbook; semicolon-separated canonical subject names. Valid rows are committed explicitly. */
export function previewFacultyImport(sheet, data) {
  if (!sheet?.length) throw new Error('The workbook is empty.')
  const headers=sheet[0].map(c=>String(c||'').trim().toLowerCase())
  for(const column of FACULTY_COLUMNS.filter(c=>c!=='Phone')) if(!headers.includes(column.toLowerCase())) throw new Error('Missing column: '+column)
  const working=structuredClone(data)
  return sheet.slice(1).filter(row=>row.some(cell=>String(cell??'').trim())).map((row,index)=>{
    const cell=name=>String(row[headers.indexOf(name.toLowerCase())]??'').trim()
    const subjectValues=cell('Subjects').split(';').map(s=>s.trim()).filter(Boolean)
    const eligibleSubjectIds=subjectValues.map(value=>SUBJECT_CATALOG.find(s=>s.name.toLowerCase()===value.toLowerCase()||s.id===value)?.id||value)
    const draft={employeeId:cell('Employee ID'),name:cell('Full name'),email:cell('Email'),phone:cell('Phone'),departmentId:cell('Department'),designationId:cell('Designation'),eligibleSubjectIds}
    const errors=Object.values(profileErrors(draft,working))
    if(!errors.length) working.faculty.push({...draft,id:'import-'+index})
    return {row:index+2,draft,errors}
  })
}
export async function readFacultyWorkbook(file) {
  if(!/\.xlsx$/i.test(file.name)||file.size>5*1024*1024) throw new Error('Choose an .xlsx workbook smaller than 5 MiB.')
  const {default:read}=await import('read-excel-file/browser')
  const sheets=await read(file)
  return sheets[0]?.data||[]
}
export async function downloadFacultyTemplate() {
  const {default:write}=await import('write-excel-file/browser')
  await write([FACULTY_COLUMNS,['FAC-007','Dr Kavya Raman','kavya.raman@example.edu','','Anatomy','Assistant Professor','Human Anatomy']]).toFile('Faculty-template.xlsx')
}

