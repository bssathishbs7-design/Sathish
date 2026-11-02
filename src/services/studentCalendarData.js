import { STUDY_YEARS, monthValue, monthIndex, calendarValue, monthStart, validateCalendar } from './studentCalendar.js'
import { issueTrackingId, migrateDirectory } from './studentModel.js'

/** Upgrade retains conflicting legacy attempts verbatim. Never reset existing user data to demo records. */
export function upgradeStudentCalendars(source) {
  if (source.version === 4) return structuredClone(source)
  const data = migrateDirectory(source)
  data.version = 4
  for (const batch of data.batches) {
    batch.calendars = {}; batch.calendarRevision = 0
    for (const year of STUDY_YEARS) {
      const entries = data.students.filter(s => s.batch === batch.id).flatMap(s => s.entries.filter(e => e.year === year))
      const ranges = entries.filter(e => e.start && e.end).map(e => ({ from: e.start.slice(0, 7), to: e.end.slice(0, 7) }))
      if (ranges.length && ranges.every(r => r.from === ranges[0].from && r.to === ranges[0].to) && !validateCalendar(batch, year, ranges[0])) batch.calendars[year] = ranges[0]
    }
  }
  for (const student of data.students) {
    student.motherBatch = student.batch; student.previousTrackingIds = []; student.lastAcademicChange = null
    const batch = data.batches.find(b => b.id === student.batch)
    for (const entry of student.entries) {
      entry.batch = student.batch
      const c = batch?.calendars[entry.year]
      if (c && entry.start?.slice(0, 7) === c.from && entry.end?.slice(0, 7) === c.to) entry.academicYear = calendarValue(c)
      else entry.legacyCalendar = true
    }
    student.migrationNote = 'Earlier records are preserved. Set batch calendar dates before new progression; legacy dates are not guessed or replaced.'
  }
  data.moves.forEach(move => { move.legacy = true })
  return data
}

/** Realistic offline fixture: 17 students, four batches, two undecided students and seven migrated students. */
export function calendarSampleDirectory() {
  const data = { version: 4, batches: [], students: [], moves: [], counters: {} }
  for (const year of [2023, 2024, 2025, 2026]) {
    const calendars = {}
    const count = 2027 - year
    for (let i = 0; i < count; i++) { const from = `${year + i}-08`; calendars[STUDY_YEARS[i]] = { from, to: monthValue(monthIndex(from) + (i === 3 ? 17 : 11)) } }
    data.batches.push({ id: String(year), course: 'MBBS', startsOn: `${year}-08-01`, calendars, calendarRevision: 0, syllabus: year < 2024 ? 'CBME 2019' : 'CBME 2024', subjectSyllabuses: {} })
  }
  const names = ['Nikhil Varma', 'Sneha Pillai', 'Rajkumar', 'Sathishkumar R', 'Ananya Shah', 'Rohan Patel', 'Diya Menon', 'Aarav Sharma', 'Meera Pillai', 'Kavya Reddy', 'Arjun Nair', 'Priya Menon', 'Aditya Joshi', 'Neha Rao', 'Rahul Nambiar', 'Pooja Deshmukh', 'Tanvi Rao']
  names.forEach((name, i) => {
    const batch = i < 2 ? '2025' : '2026', motherBatch = i >= 10 ? String(2023 + i % 3) : batch
    const c = data.batches.find(b => b.id === batch).calendars['First Year']
    const student = { id: `calendar-student-${i + 1}`, name, registrationId: `MC${motherBatch}${String(i + 1).padStart(3, '0')}`, email: `student${i + 1}@example.edu`, code: '+91', phone: String(9876500000 + i), department: 'N/A', course: 'MBBS', section: 'A', batch, motherBatch, trackingId: issueTrackingId(data, motherBatch), previousTrackingIds: [], year: 'First Year', status: i === 9 ? 'Inactive' : 'Active', tracked: true, graduated: false, joinedOn: `${motherBatch}-08-01`, academicYear: calendarValue(c), startedAt: monthStart(c.from), revision: 0, academicRevision: 0, lastAcademicChange: null, subjectSyllabuses: {}, history: [], entries: [] }
    if (motherBatch !== batch) student.entries.push({ id: `old-${i}`, batch: motherBatch, year: 'First Year', academicYear: `${motherBatch}-08/${+motherBatch + 1}-07`, start: `${motherBatch}-08-01`, end: `${+motherBatch + 1}-07-31`, outcome: 'Not promoted', section: 'A' })
    student.entries.push({ id: `current-${i}`, batch, year: 'First Year', academicYear: calendarValue(c), start: monthStart(c.from), end: null, outcome: 'Current', section: 'A' })
    data.students.push(student)
  })
  return data
}
