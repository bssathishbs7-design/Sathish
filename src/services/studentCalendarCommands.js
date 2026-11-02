import { STUDY_YEARS, calendarValue, monthStart, monthEnd, validateCalendar, currentCalendar, laterBatches, admissionDestination } from './studentCalendar.js'
import { today, uid, fail, issueTrackingId, validateStudent, currentEntry } from './studentModel.js'

/**
 * @typedef {{from:string,to:string}} AcademicCalendar Inclusive YYYY-MM values.
 * @typedef {{id:string,course:string,calendars:Object<string,AcademicCalendar>,calendarRevision:number}} CalendarBatch
 * @typedef {{id:string,batch:string,year:string,academicYear:string,start:string,end:string|null,outcome:string,section:string,originalCalendar?:Object}} CalendarEntry
 * @typedef {{version:4,batches:CalendarBatch[],students:Object[],moves:Object[],counters:Object<string,number>}} CalendarDirectory
 * @typedef {{type:string,ids?:string[],batch?:string,year?:string,calendar?:AcademicCalendar,targetBatch?:string,reasonType?:'repeat'|'mapping',reason?:string,section?:string,expectedAcademicRevisions?:Object<string,number>}} CalendarCommand
 * Version 4 directory: batch.calendars[studyYear]={from,to}; entries retain batch and calendar identity.
 * Commands are atomic cloned transactions; persistence and server authorisation are adapter responsibilities.
 */
export const calendarSnapshot = student => structuredClone(Object.fromEntries(['batch', 'motherBatch', 'trackingId', 'previousTrackingIds', 'entries', 'year', 'academicYear', 'startedAt', 'graduated', 'completedOn', 'tracked', 'lastAcademicChange'].map(k => [k, student[k] ?? null])))
function sync(student) {
  const entry = currentEntry(student)
  if (entry) { student.year = entry.year; student.academicYear = entry.academicYear; student.startedAt = entry.start; student.graduated = false; student.completedOn = null }
  else if (student.graduated) student.year = 'Graduated'
}
function openEntry(student, batch, year) {
  const calendar = batch.calendars[year]
  student.entries.push({ id: uid(), batch: batch.id, year, academicYear: calendarValue(calendar), start: monthStart(calendar.from), end: null, outcome: 'Current', section: student.section })
  student.batch = batch.id; sync(student)
}
export function applyCalendarCommand(source, command, { canEdit = false } = {}) {
  if (!canEdit) fail('You have read-only access to student management.')
  const data = structuredClone(source), date = command.today || today()
  const find = id => data.students.find(s => s.id === id) || fail('Student not found. Refresh and try again.')
  const batchFor = id => data.batches.find(b => b.id === id) || fail('Batch not found.')
  const audit = (s, action, note = '') => { s.history.push({ id: uid(), action, note, year: s.year, academicYear: s.academicYear, date, at: new Date().toISOString() }); s.revision++ }
  const reason = () => { if ((command.reason || '').trim().length < 5) fail('Enter a reason of at least five characters.') }
  const selected = () => { const rows = [...new Set(command.ids || [])].map(find); if (!rows.length) fail('Select students first.'); return rows }
  const setDates = (batch, year, calendar) => {
    const error = validateCalendar(batch, year, calendar); if (error) fail(error)
    for (const student of data.students) for (let i = 0; i < student.entries.length; i++) {
      const entry = student.entries[i]
      if (entry.batch !== batch.id || entry.year !== year || (entry.legacyCalendar && !(command.reconcileLegacy && entry.outcome === 'Current'))) continue
      const previous = student.entries[i - 1], next = student.entries[i + 1]
      if ((previous?.end && previous.end >= monthStart(calendar.from)) || (next && next.start <= monthEnd(calendar.to))) fail(`${student.name}'s years would overlap. Choose dates that keep each year after the previous one.`)
    }
    batch.calendars[year] = { ...calendar }; batch.calendarRevision = (batch.calendarRevision || 0) + 1
    for (const student of data.students) {
      let changed = false
      if (command.reconcileLegacy && student.batch === batch.id && student.year === year && !student.graduated && !student.entries.length) {
        const originalCalendar = { academicYear: student.academicYear, start: student.startedAt, end: null }
        openEntry(student, batch, year)
        currentEntry(student).originalCalendar = originalCalendar
        student.tracked = true
        changed = true
      }
      for (const entry of student.entries) if (entry.batch === batch.id && entry.year === year && (!entry.legacyCalendar || (command.reconcileLegacy && entry.outcome === 'Current'))) {
        if (entry.legacyCalendar) { entry.originalCalendar = { academicYear: entry.academicYear, start: entry.start, end: entry.end }; delete entry.legacyCalendar }
        entry.academicYear = calendarValue(calendar); entry.start = monthStart(calendar.from); if (entry.end) entry.end = monthEnd(calendar.to); changed = true
      }
      if (changed) { student.lastAcademicChange = uid(); student.academicRevision++; sync(student); audit(student, 'Academic year updated', calendarValue(calendar)) }
    }
  }
  if (command.type === 'batch') {
    const b = command.batch
    if (!/^\d{4}$/.test(b.id) || +b.id < 2023 || +b.id > 2035) fail('Enter a batch year from 2023 to 2035.')
    if (data.batches.some(x => x.id === b.id)) fail('This batch already exists.')
    if (b.course !== 'MBBS') fail('Choose a supported course.')
    const error = validateCalendar({ calendars: {} }, b.year, b.calendar); if (error) fail(error)
    data.batches.push({ id: b.id, course: b.course, startsOn: monthStart(b.calendar.from), calendars: { [b.year]: b.calendar }, calendarRevision: 0, syllabus: +b.id < 2024 ? 'CBME 2019' : 'CBME 2024', subjectSyllabuses: {} })
  } else if (command.type === 'calendar') {
    const batch = batchFor(command.batch)
    if (command.calendarRevision !== undefined && command.calendarRevision !== (batch.calendarRevision || 0)) fail('The calendar changed. Reopen the dates form.')
    setDates(batch, command.year, command.calendar)
  } else if (['save', 'import'].includes(command.type)) {
    const rows = command.type === 'import' ? command.rows : [command.draft]
    if (!rows?.length) fail('Choose students to import.')
    for (const raw of rows) {
      const draft = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]))
      const original = draft.id ? find(draft.id) : null
      if (original && draft.revision !== original.revision) fail('This student changed. Reopen the form.')
      const errors = validateStudent(draft, data, original)
      if (Object.keys(errors).length) fail(Object.values(errors).join(' '))
      if (original) {
        for (const key of ['name', 'registrationId', 'email', 'code', 'phone', 'section', 'department']) original[key] = draft[key]
        if (currentEntry(original)) currentEntry(original).section = original.section
        audit(original, 'Profile updated')
      } else {
        const destination = admissionDestination(data, draft, date)
        if (destination.batch !== draft.batch && !draft.batchReason) fail('Choose a reason for joining from an earlier batch.')
        const student = { ...draft, id: uid(), batch: destination.batch, motherBatch: draft.batch, trackingId: issueTrackingId(data, draft.batch), previousTrackingIds: [], status: 'Active', tracked: true, graduated: false, revision: 0, academicRevision: 0, history: [], entries: [], subjectSyllabuses: {}, syllabus: '', lastAcademicChange: uid() }
        openEntry(student, batchFor(destination.batch), draft.year); audit(student, 'Enrolled', draft.batchReason || 'Earlier history not recorded'); data.students.push(student)
      }
    }
  } else if (command.type === 'sgt') {
    if (!/^(N\/A|[A-O])$/.test(command.section || '')) fail('Choose N/A or SGT A to O.')
    for (const student of selected()) {
      if (command.expectedAcademicRevisions && command.expectedAcademicRevisions[student.id] !== student.academicRevision) fail('Students changed. Reopen the form.')
      const entry = command.entryId ? student.entries.find(e => e.id === command.entryId) : currentEntry(student)
      if (!entry) fail('No matching year entry.')
      if (command.entryId) reason()
      const before = entry.section; entry.section = command.section
      if (entry.outcome === 'Current') student.section = command.section
      audit(student, 'SGT updated', `${before} to ${command.section}. ${command.note || command.reason || ''}`)
    }
  } else if (['move', 'changeBatch'].includes(command.type)) {
    const students = selected(), first = students[0], sourceBatch = batchFor(first.batch)
    if (students.some(s => !STUDY_YEARS.includes(s.year) || !currentEntry(s))) fail('Only students studying a year can change batch.')
    if (command.expectedAcademicRevisions && students.some(s => command.expectedAcademicRevisions[s.id] !== s.academicRevision)) fail('Students have newer changes. Reopen the form.')
    if (command.type === 'move' || command.reasonType === 'repeat') {
      if (students.some(s => s.batch !== first.batch || s.year !== first.year)) fail('Select students of one batch and one year.')
      if (students.some(s => s.status !== 'Active')) fail('Activate inactive students from their record first.')
    }
    if (command.type === 'changeBatch' && students.some(s => s.status !== 'Active')) fail('Activate inactive students from their record first.')
    if (command.type === 'changeBatch' && !['repeat', 'mapping'].includes(command.reasonType)) fail('Choose a reason.')
    if (command.reasonType === 'mapping') { reason(); if (students.some(s => s.entries.some(e => ['Promoted', 'Not promoted', 'Completed'].includes(e.outcome)))) fail('Students already have year-end decisions. Undo them first, or use Not promoted.') }
    const nextYear = STUDY_YEARS[STUDY_YEARS.indexOf(first.year) + 1]
    if (command.type === 'move' && nextYear && !sourceBatch.calendars[nextYear] && command.calendar) setDates(sourceBatch, nextYear, command.calendar)
    const move = { id: uid(), batch: first.batch, targetBatch: command.targetBatch, action: command.type === 'changeBatch' ? command.reasonType : nextYear ? 'promote' : 'complete', date, at: new Date().toISOString(), note: command.note || command.reason || '', students: [] }
    for (const student of students) {
      const beforeAcademic = calendarSnapshot(student), entry = currentEntry(student), calendar = currentCalendar(data, student)
      if (!calendar || entry.legacyCalendar) fail('Set the batch calendar and resolve the preserved legacy entry before progression.')
      if (command.type === 'changeBatch' && command.reasonType === 'repeat') {
        if (monthEnd(calendar.to) >= date) fail('This year is still running. Not promoted is available after it ends.')
        const target = laterBatches(data, student).find(b => b.id === command.targetBatch)
        if (!target) fail('Choose a later batch with this year’s dates after the current year.')
        entry.end = monthEnd(calendar.to); entry.outcome = 'Not promoted'; openEntry(student, target, student.year)
      } else if (command.type === 'changeBatch') {
        if (command.targetBatch === student.batch) fail('Choose a different batch.')
        const destination = admissionDestination(data, { ...student, batch: command.targetBatch }, date)
        if (destination.batch !== command.targetBatch && !command.batchReason) fail('Choose a reason for the earlier batch.')
        student.previousTrackingIds = [...(student.previousTrackingIds || []), student.trackingId]
        student.trackingId = issueTrackingId(data, command.targetBatch); student.motherBatch = command.targetBatch
        student.entries = []; openEntry(student, batchFor(destination.batch), student.year)
      } else {
        entry.end = monthEnd(calendar.to); entry.outcome = nextYear ? 'Promoted' : 'Completed'
        if (nextYear) {
          const target = sourceBatch.calendars[nextYear]; if (!target) fail(`Set ${nextYear} dates first.`)
          openEntry(student, sourceBatch, nextYear)
        } else { student.graduated = true; student.completedOn = entry.end; sync(student) }
      }
      student.lastAcademicChange = move.id; student.academicRevision++; audit(student, move.action === 'repeat' ? 'Not promoted' : move.action === 'mapping' ? 'Batch changed' : move.action === 'complete' ? 'Course completed' : 'Promoted', move.note)
      move.students.push({ before: { id: student.id, name: student.name, trackingId: beforeAcademic.trackingId, year: beforeAcademic.year }, beforeAcademic, afterAcademic: calendarSnapshot(student), afterAcademicRevision: student.academicRevision, undone: false })
    }
    data.moves.unshift(move)
  } else if (command.type === 'undo') {
    reason(); const move = data.moves.find(m => m.id === command.moveId) || fail('Change not found.')
    const members = move.students.filter(m => !m.undone && (!command.ids || command.ids.includes(m.before.id)))
    if (!members.length || move.legacy) fail('No eligible students to undo.')
    for (const member of members) {
      const student = find(member.before.id)
      if (student.lastAcademicChange !== move.id) fail(`${student.name} has newer academic changes. Undo them first.`)
      Object.assign(student, structuredClone(member.beforeAcademic)); student.academicRevision++
      if (currentEntry(student)) currentEntry(student).section = student.section
      member.undone = true; audit(student, 'Progression undone', command.reason)
    }
  } else if (command.type === 'correctDecision') {
    reason(); const student = find(command.id), entry = student.entries.at(-2)
    if (!entry || entry.id !== command.entryId || student.academicRevision !== command.academicRevision) fail('Year history changed. Reopen the record.')
    const move = data.moves.find(m => m.id === student.lastAcademicChange)
    if (!move || !['promote', 'repeat'].includes(move.action)) fail('Only the latest promote or not-promoted decision can be corrected.')
    const restored = applyCalendarCommand(data, { type: 'undo', moveId: move.id, ids: [student.id], reason: command.reason, today: date }, { canEdit: true })
    const previous = restored.students.find(s => s.id === student.id)
    const correction = entry.outcome === 'Not promoted' ? { type: 'move', ids: [student.id] } : { type: 'changeBatch', reasonType: 'repeat', targetBatch: laterBatches(restored, previous)[0]?.id, ids: [student.id] }
    return applyCalendarCommand(restored, { ...correction, note: command.reason, today: date }, { canEdit: true })
  } else if (command.type === 'deleteBatch') {
    if (data.students.some(s => (s.batch === command.batch && s.motherBatch !== s.batch) || s.entries.some(e => e.batch === command.batch && s.batch !== command.batch)) || data.moves.some(m => m.targetBatch && (m.batch === command.batch || m.targetBatch === command.batch))) fail('Keep this batch: students have migrated into or out of it.')
    const students = data.students.filter(s => s.batch === command.batch)
    if (students.length && (command.emptyOnly || command.confirm !== command.batch)) fail('Type the batch year to confirm deletion.')
    batchFor(command.batch); data.students = data.students.filter(s => s.batch !== command.batch); data.batches = data.batches.filter(b => b.id !== command.batch); data.moves = data.moves.filter(m => m.batch !== command.batch)
  } else if (['correct', 'setup', 'bulkSetup'].includes(command.type)) fail('Use the batch calendar to update academic dates.')
  else return null
  return data
}
