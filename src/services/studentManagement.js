/** Student-management mock API. Replace these async methods with authenticated API calls.
 * @typedef {{id:string,name:string,email:string,phone:string,batch:string,year:string,section:string,subject:string,status:string,academicYear:string,joinedOn:string,startedAt:string,tracked:boolean,revision:number,history:Array<Object>,syllabus:string}} Student
 * @typedef {{version:number,batches:Array<{id:string,course:string,startsOn:string,syllabus:string}>,students:Student[],moves:Array<Object>}} Directory
 * Internal id is immutable. Student ID is a separate editable registrationId.
 */
export const DIRECTORY_KEY = 'medsy-student-directory-v1'
export const DIRECTORY_EVENT = 'medsy-students-changed'
export const YEARS = ['First Year', 'Second Year', 'Third Year', 'Final Year', 'Internship']
export const today = () => new Date().toISOString().slice(0, 10)
export const academicYearFor = date => `${date.slice(0, 4)}-${Number(date.slice(0, 4)) + 1}`
const clone = value => structuredClone(value)
const fail = message => { throw new Error(message) }
const uid = () => globalThis.crypto.randomUUID()
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value

/** Realistic default data is available without manually populating browser storage. */
export function sampleDirectory() {
  const names = ['Aarav Nair', 'Diya Raman', 'Ishaan Kumar', 'Meera Joseph', 'Ananya Shah', 'Rohan Patel', 'Sara Thomas', 'Vikram Rao']
  return { version: 1, batches: [2026, 2025, 2023, 2021].map(year => ({ id: String(year), course: 'MBBS', startsOn: `${year}-08-01`, syllabus: year < 2024 ? 'CBME 2019' : 'CBME 2024' })), moves: [], students: names.map((name, i) => {
    const year = i < 2 ? YEARS[0] : i < 4 ? YEARS[1] : i < 6 ? YEARS[3] : YEARS[4]
    const batch = i < 2 ? '2026' : i < 4 ? '2025' : i < 6 ? '2023' : '2021'
    return { id: `student-${i + 1}`, registrationId: `MC${batch}${101 + i}`, name, email: name.toLowerCase().replaceAll(' ', '.') + '@example.edu', phone: `98765000${10 + i}`, batch, year, section: 'A', subject: i < 2 ? 'Human Anatomy' : i < 4 ? 'Pathology' : 'General Medicine', status: i === 3 ? 'Inactive' : 'Active', academicYear: '2026-2027', joinedOn: `${batch}-08-01`, startedAt: '2026-08-01', tracked: i !== 7, revision: 0, syllabus: '', history: i === 7 ? [] : [{ id: `enrol-${i}`, action: 'Year record', year, academicYear: '2026-2027', date: '2026-08-01', note: 'Sample enrolment record' }] }
  }) }
}

/** Field errors are shared by manual entry and spreadsheet preview. */
export function validateStudent(draft, data, original) {
  const errors = {}
  for (const [key, label] of Object.entries({ name: 'Name', registrationId: 'Student ID', email: 'Email', phone: 'Phone', batch: 'Batch', section: 'Section', subject: 'Subject' })) {
    if (!String(draft[key] || '').trim()) errors[key] = `${label} is required.`
  }
  if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) errors.email = 'Enter a valid email address.'
  if (draft.phone && (!/^\+?[\d ()-]+$/.test(draft.phone) || !/^\d{7,15}$/.test(draft.phone.replace(/\D/g, '')))) errors.phone = 'Enter a valid phone number with 7–15 digits.'
  if (draft.section && !/^[A-O]$/.test(draft.section)) errors.section = 'Choose a section from A to O.'
  if (!data.batches.some(batch => batch.id === draft.batch)) errors.batch = 'Choose an existing batch.'
  if (!validDate(draft.joinedOn) || draft.joinedOn > today()) errors.joinedOn = 'Choose a valid joining date, no later than today.'
  if (!/^\d{4}-\d{4}$/.test(draft.academicYear || '') || Number(draft.academicYear.slice(5)) !== Number(draft.academicYear.slice(0, 4)) + 1) errors.academicYear = 'Use consecutive years, for example 2026-2027.'
  if (!original && !errors.academicYear && !errors.joinedOn && (draft.joinedOn.slice(0, 4) < draft.academicYear.slice(0, 4) || draft.joinedOn.slice(0, 4) > draft.academicYear.slice(5))) errors.joinedOn = 'Joining date must fall within the academic year.'
  if (!original && Number(draft.batch) > Number(draft.academicYear?.slice(0, 4))) errors.batch = 'Batch cannot be later than the academic year.'
  if (!original && Number(draft.batch) < Number(draft.academicYear?.slice(0, 4)) && !draft.batchReason?.trim()) errors.batchReason = 'Give a reason for joining an earlier batch, such as transfer or rejoining.'
  for (const field of ['registrationId', 'email']) {
    if (data.students.some(student => student.id !== original?.id && String(student[field]).toLowerCase() === String(draft[field] || '').trim().toLowerCase())) errors[field] = `This ${field === 'email' ? 'email' : 'student ID'} already exists.`
  }
  return errors
}

/** Pure transaction function: validates the whole operation before changing any records.
 * @param {Directory} source @param {{type:string,[key:string]:any}} command
 * @param {{canEdit?:boolean}} permissions
 */
export function applyStudentCommand(source, command, { canEdit = true } = {}) {
  if (!canEdit) fail('You have read-only access to student management.')
  const data = clone(source)
  const { type } = command
  const at = new Date().toISOString()
  const find = id => data.students.find(student => student.id === id) || fail('This student no longer exists. Refresh and try again.')
  const audit = (student, action, note, date = today()) => {
    student.history.push({ id: uid(), action, year: student.year, academicYear: student.academicYear, date, at, note })
    student.revision += 1
  }
  if (type === 'save' || type === 'import') {
    const drafts = type === 'import' ? command.rows : [command.draft]
    if (!drafts?.length) fail('Choose at least one valid student to import.')
    for (const draft of drafts) {
      const original = type === 'save' && draft.id ? find(draft.id) : null
      if (original && draft.revision !== original.revision) fail('This student changed since you opened the form. Reopen it to save safely.')
      const cleaned = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]))
      const errors = validateStudent(cleaned, data, original)
      if (Object.keys(errors).length) fail(`${cleaned.name || 'Student'}: ${Object.values(errors).join(' ')}`)
      if (original) {
        for (const key of ['name', 'registrationId', 'email', 'phone', 'section', 'subject']) original[key] = cleaned[key]
        audit(original, 'Profile updated', 'Student details updated')
      } else {
        const student = { ...cleaned, id: uid(), year: YEARS[0], status: 'Active', tracked: true, startedAt: cleaned.joinedOn, syllabus: '', revision: 0, history: [] }
        audit(student, 'Enrolled', cleaned.batchReason ? `Joined First Year. Earlier batch: ${cleaned.batchReason}` : 'Joined First Year', cleaned.joinedOn)
        data.students.push(student)
      }
    }
  } else if (type === 'batch') {
    const batch = command.batch
    if (!/^\d{4}$/.test(batch.id) || Number(batch.id) < 2000 || Number(batch.id) > new Date().getFullYear() + 1) fail('Enter a batch year from 2000 to next year.')
    if (data.batches.some(item => item.id === batch.id)) fail('This batch already exists.')
    if (!validDate(batch.startsOn) || batch.startsOn.slice(0, 4) !== batch.id || !batch.course.trim()) fail('Enter the course and a start date within the batch year.')
    data.batches.push(batch)
  } else if (type === 'deleteBatch') {
    if (command.confirm !== command.batch) fail('Type the batch year to confirm deletion.')
    if (!data.batches.some(batch => batch.id === command.batch)) fail('Batch no longer exists.')
    data.students = data.students.filter(student => student.batch !== command.batch)
    data.moves = data.moves.filter(move => move.batch !== command.batch)
    data.batches = data.batches.filter(batch => batch.id !== command.batch)
  } else if (type === 'delete') {
    if (!command.ids?.length) fail('Select students to delete.')
    command.ids.forEach(find)
    data.students = data.students.filter(student => !command.ids.includes(student.id))
  } else if (type === 'move') {
    const rows = [...new Set(command.ids || [])].map(find)
    if (!rows.length) fail('Select students first.')
    if (!['promote', 'repeat', 'complete'].includes(command.action)) fail('Choose a valid progression action.')
    if (rows.some(student => !student.tracked || student.status !== 'Active')) fail('Only active students with completed year setup can progress.')
    if (rows.some(student => student.batch !== rows[0].batch || student.year !== rows[0].year)) fail('Select students from the same batch and year.')
    if (!validDate(command.date) || command.date > today() || rows.some(student => command.date < student.startedAt)) fail('End date must be between the current year start and today.')
    if (command.action === 'complete' && rows[0].year !== 'Internship') fail('Only interns can complete the course.')
    if (command.action === 'promote' && rows[0].year === 'Internship') fail('Use Complete course for interns.')
    if (command.action !== 'complete') {
      if (!validDate(command.startsOn) || command.startsOn <= command.date) fail('The next year must start after the current year ends.')
      if (!/^\d{4}-\d{4}$/.test(command.academicYear || '') || Number(command.academicYear.slice(5)) !== Number(command.academicYear.slice(0, 4)) + 1 || command.academicYear <= rows[0].academicYear) fail('Enter a later academic year using consecutive years.')
      if (command.startsOn.slice(0, 4) < command.academicYear.slice(0, 4) || command.startsOn.slice(0, 4) > command.academicYear.slice(5)) fail('Start date must fall within the new academic year.')
    }
    const move = { id: uid(), batch: rows[0].batch, action: command.action, date: command.date, at, note: command.note || '', students: rows.map(student => ({ before: clone(student), afterRevision: student.revision + 1, undone: false })) }
    for (const student of rows) {
      const action = command.action === 'complete' ? 'Course completed' : command.action === 'repeat' ? 'Not promoted' : 'Promoted'
      if (command.action === 'complete') { student.year = 'Graduated'; student.status = 'Graduated' }
      else {
        if (command.action === 'promote') student.year = YEARS[YEARS.indexOf(student.year) + 1]
        student.academicYear = command.academicYear; student.startedAt = command.startsOn
      }
      audit(student, action, command.note || '', command.date)
    }
    data.moves.unshift(move)
  } else if (type === 'undo') {
    const move = data.moves.find(item => item.id === command.moveId)
    if (!move) fail('This change no longer exists.')
    const targets = move.students.filter(item => !item.undone && (!command.ids || command.ids.includes(item.before.id)))
    if (!targets.length) fail('This change has already been undone.')
    if (!command.reason?.trim()) fail('Enter a reason for the correction.')
    for (const target of targets) {
      const student = find(target.before.id)
      if (student.revision !== target.afterRevision) fail(`${student.name} has newer changes. This move cannot be undone.`)
      const history = student.history
      Object.assign(student, target.before, { history, revision: student.revision })
      audit(student, 'Progression undone', command.reason)
      target.undone = true
    }
  } else if (type === 'status') {
    const student = find(command.id)
    if (!command.reason?.trim()) fail('Enter a reason for changing the status.')
    if (student.year === 'Graduated') fail('A completed course cannot be changed through active status.')
    student.status = student.status === 'Active' ? 'Inactive' : 'Active'
    audit(student, student.status, command.reason)
  } else if (type === 'setup' || type === 'correct') {
    const student = find(command.id)
    if (type === 'setup' && student.tracked) fail('Year setup is already complete.')
    if (!data.batches.some(batch => batch.id === command.batch) || !YEARS.includes(command.year)) fail('Choose a valid batch and year.')
    if (!validDate(command.startsOn) || command.startsOn > today() || command.startsOn < student.joinedOn) fail('Year start must be between the joining date and today.')
    if (!/^\d{4}-\d{4}$/.test(command.academicYear || '') || Number(command.academicYear.slice(5)) !== Number(command.academicYear.slice(0, 4)) + 1 || Number(command.academicYear.slice(0, 4)) < Number(command.batch)) fail('Enter a valid academic year, no earlier than the batch.')
    if (command.startsOn.slice(0, 4) < command.academicYear.slice(0, 4) || command.startsOn.slice(0, 4) > command.academicYear.slice(5)) fail('Start date must fall within the academic year.')
    if (!command.reason?.trim()) fail('Enter a reason to record this change.')
    if (student.year === 'Graduated') fail('Undo course completion before correcting a year record.')
    Object.assign(student, { batch: command.batch, year: command.year, academicYear: command.academicYear, startedAt: command.startsOn, tracked: true })
    audit(student, type === 'setup' ? 'Year tracking set up' : 'Year record corrected', command.reason)
  } else if (type === 'syllabus') {
    if (!['CBME 2019', 'CBME 2024', ''].includes(command.syllabus)) fail('Choose a supported syllabus.')
    if (command.id) { const student = find(command.id); student.syllabus = command.syllabus; audit(student, 'Syllabus updated', command.syllabus || 'Follow batch syllabus') }
    else {
      const batch = data.batches.find(item => item.id === command.batch)
      if (!batch || !command.syllabus) fail('Choose a batch and syllabus.')
      batch.syllabus = command.syllabus
      data.students.filter(student => student.batch === batch.id).forEach(student => audit(student, 'Batch syllabus updated', command.syllabus))
    }
  } else fail('Unsupported student operation.')
  return data
}

export async function getStudentDirectory() {
  const stored = localStorage.getItem(DIRECTORY_KEY)
  if (!stored) return sampleDirectory()
  try {
    const data = JSON.parse(stored)
    if (data.version !== 1 || !Array.isArray(data.students) || !Array.isArray(data.batches) || !Array.isArray(data.moves)) throw new Error()
    return data
  } catch { fail('Saved student data could not be read. Your stored data has not been overwritten.') }
}

/** Persistent mock mutation; backend must enforce the same permissions and validation. */
export async function saveStudentCommand(command, permissions) {
  const commit = async () => {
    const next = applyStudentCommand(await getStudentDirectory(), command, permissions)
    localStorage.setItem(DIRECTORY_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event(DIRECTORY_EVENT))
    return next
  }
  return globalThis.navigator?.locks ? navigator.locks.request(DIRECTORY_KEY, commit) : commit()
}
