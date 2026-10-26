import { YEARS, validDate, withinYear, normaliseAcademicYear, fail, uid, currentEntry, academicSnapshot, syncAcademic, canUndo } from './studentModel.js'

/** Mutates only a cloned transaction; callers persist after all validations succeed. */
export function applyAcademicCommand(data, command, audit) {
  const find = id => data.students.find(student => student.id === id) || fail('Student not found. Refresh and try again.')
  const reason = () => { if ((command.reason || '').trim().length < 5) fail('Enter a reason of at least five characters.') }
  if (command.type === 'move') {
    const students = [...new Set(command.ids || [])].map(find)
    if (!students.length) fail('Select students first.')
    if (command.expectedAcademicRevisions && students.some(s => command.expectedAcademicRevisions[s.id] !== s.academicRevision)) fail('Selected students have newer academic changes. Reopen the progression form.')
    if (!['promote', 'repeat', 'complete'].includes(command.action)) fail('Choose a progression action.')
    const first = students[0], academicYear = normaliseAcademicYear(command.academicYear), startsOn = command.startsOn || command.date
    if (students.some(s => !s.tracked || s.status !== 'Active' || !currentEntry(s) || s.batch !== first.batch || s.year !== first.year)) fail('Select active, tracked students from the same batch and year.')
    if (!validDate(command.date) || students.some(s => command.date <= currentEntry(s).start)) fail('End date must be later than every selected current-year start.')
    if (command.action === 'complete' && first.year !== 'Internship') fail('Only interns can complete the course.')
    if (first.year === 'Internship' && command.action !== 'complete') fail('Use Complete course for interns.')
    if (command.action !== 'complete' && (!withinYear(startsOn, academicYear) || startsOn < command.date || students.some(s => academicYear <= s.academicYear))) fail('Use a later academic year and a start date on or after the end date, within the new academic year.')
    const move = { id: uid(), batch: first.batch, action: command.action, date: command.date, at: new Date().toISOString(), note: command.note || '', students: [] }
    for (const student of students) {
      const entry = currentEntry(student)
      move.students.push({ before: { id: student.id, name: student.name, registrationId: student.registrationId, trackingId: student.trackingId, year: student.year, status: student.status }, beforeAcademic: academicSnapshot(student), afterAcademicRevision: student.academicRevision + 1, undone: false })
      entry.end = command.date; entry.outcome = { promote: 'Promoted', repeat: 'Not promoted', complete: 'Completed' }[command.action]; entry.moveId = move.id
      if (command.action === 'complete') { student.graduated = true; student.completedOn = command.date }
      else student.entries.push({ id: uid(), year: command.action === 'repeat' ? student.year : YEARS[YEARS.indexOf(student.year) + 1], academicYear, start: startsOn, end: null, outcome: 'Current', section: student.section })
      student.academicRevision++; syncAcademic(student); audit(student, entry.outcome, command.note || '', command.date)
      move.students.at(-1).afterAcademic = academicSnapshot(student)
    }
    data.moves.unshift(move)
  } else if (command.type === 'undo') {
    const move = data.moves.find(row => row.id === command.moveId) || fail('This change no longer exists.')
    reason()
    const members = move.students.filter(item => !item.undone && (!command.ids || command.ids.includes(item.before.id)))
    if (!members.length) fail('This change has already been undone.')
    for (const member of members) {
      const student = find(member.before.id)
      if (!canUndo(student, member, move)) fail(`${student.name} has newer academic changes. Undo is unavailable.`)
      Object.assign(student, structuredClone(member.beforeAcademic)); student.academicRevision++
      // The SGT/profile may have changed since this move. Never roll those changes back.
      if (currentEntry(student)) currentEntry(student).section = student.section
      syncAcademic(student); member.undone = true; audit(student, 'Progression undone', command.reason)
    }
  } else if (command.type === 'correctDecision') {
    const student = find(command.id); reason()
    if (command.academicRevision !== student.academicRevision) fail('Year history changed. Reopen the record.')
    const previous = student.entries.at(-2), current = currentEntry(student)
    if (!previous || previous.id !== command.entryId || !current || !['Promoted', 'Not promoted'].includes(previous.outcome)) fail('Only the latest promote or repeat decision can be corrected.')
    previous.outcome = previous.outcome === 'Promoted' ? 'Not promoted' : 'Promoted'
    current.year = previous.outcome === 'Promoted' ? YEARS[YEARS.indexOf(previous.year) + 1] : previous.year
    student.academicRevision++; syncAcademic(student); audit(student, 'Decision corrected', command.reason)
  } else if (command.type === 'correct') {
    const student = find(command.id); reason()
    if (command.academicRevision !== student.academicRevision) fail('Year history changed. Reopen the record.')
    const index = student.entries.findIndex(entry => entry.id === command.entryId), entry = student.entries[index]
    if (!entry) fail('Year entry not found.')
    const before = student.entries[index - 1], after = student.entries[index + 1]
    if (!withinYear(command.startsOn, entry.academicYear) || command.startsOn < student.joinedOn || (before?.end && command.startsOn < before.end)) fail('Start date must respect joining date, academic year and the previous attempt.')
    if (entry.outcome === 'Current' && command.endsOn) fail('A current year cannot have an end date.')
    if (entry.outcome !== 'Current' && (!validDate(command.endsOn) || command.endsOn <= command.startsOn || (after && command.endsOn > after.start))) fail('End date must follow the start and not overlap the next attempt.')
    if (!/^(?:[A-O]|N\/A)$/.test(command.section || '')) fail('Choose N/A or SGT A to O.')
    entry.start = command.startsOn; entry.end = entry.outcome === 'Current' ? null : command.endsOn; entry.section = command.section
    if (entry.outcome === 'Current') student.section = command.section
    if (entry.outcome === 'Completed') student.completedOn = entry.end
    student.academicRevision++; syncAcademic(student); audit(student, 'Year dates / SGT corrected', command.reason)
  } else if (['setup', 'bulkSetup'].includes(command.type)) {
    const students = command.type === 'bulkSetup' ? data.students.filter(s => !s.tracked && s.year === command.year && (!command.batch || s.batch === command.batch)) : [find(command.id)]
    if (!students.length || students.some(s => s.tracked)) fail('No eligible legacy students in this year.')
    const academicYear = normaliseAcademicYear(command.academicYear)
    reason()
    for (const student of students) {
      const joinedOn = command.joinedOn || student.joinedOn, start = command.startsOn || joinedOn
      if (!YEARS.includes(command.year) || !validDate(joinedOn) || !withinYear(start, academicYear) || start < joinedOn || Number(academicYear.slice(0, 4)) < Number(student.batch)) fail('Choose valid joining and current-year dates for this admission batch.')
      if (command.repeating && Number(academicYear.slice(0, 4)) <= Number(joinedOn.slice(0, 4))) fail('A repeating student needs a later current academic year.')
      student.joinedOn = joinedOn; student.entries = []
      if (command.repeating) student.entries.push({ id: uid(), year: command.year, academicYear: `${Number(academicYear.slice(0, 4)) - 1}-${academicYear.slice(0, 4)}`, start: joinedOn, end: start, outcome: 'Not promoted', section: student.section, migrated: true })
      student.entries.push({ id: uid(), year: command.year, academicYear, start, end: null, outcome: 'Current', section: student.section })
      student.tracked = true; student.academicRevision++; syncAcademic(student); audit(student, 'Year tracking set up', command.reason)
    }
  } else return false
  return true
}
