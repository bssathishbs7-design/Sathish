import { YEARS, SUBJECTS, migrateDirectory, issueTrackingId } from './studentModel.js'
function legacySamples() {
  const names = ['Aarav Nair', 'Diya Raman', 'Ishaan Kumar', 'Meera Joseph', 'Ananya Shah', 'Rohan Patel', 'Sara Thomas', 'Vikram Rao']
  return { version: 1, batches: [2026, 2025, 2023, 2021].map(year => ({ id: String(year), course: 'MBBS', startsOn: `${year}-08-01`, syllabus: year < 2024 ? 'CBME 2019' : 'CBME 2024' })), moves: [], students: names.map((name, i) => {
    const year = i < 2 ? YEARS[0] : i < 4 ? YEARS[1] : i < 6 ? YEARS[3] : YEARS[4]
    const batch = i < 2 ? '2026' : i < 4 ? '2025' : i < 6 ? '2023' : '2021'
    return { id: `student-${i + 1}`, registrationId: `MC${batch}${101 + i}`, name, email: name.toLowerCase().replaceAll(' ', '.') + '@example.edu', phone: `98765000${10 + i}`, batch, year, section: 'A', subject: i < 2 ? 'Human Anatomy' : i < 4 ? 'Pathology' : 'General Medicine', status: i === 3 ? 'Inactive' : 'Active', academicYear: '2026-2027', joinedOn: `${batch}-08-01`, startedAt: '2026-08-01', tracked: i !== 7, revision: 0, syllabus: '', history: i === 7 ? [] : [{ id: `enrol-${i}`, action: 'Year record', year, academicYear: '2026-2027', date: '2026-08-01', note: 'Sample enrolment record' }] }
  }) }
}


export function sampleDirectory({ complete = true } = {}) {
  const data = migrateDirectory(legacySamples())
  data.students.forEach(student => { delete student.migrationNote; student.code = '+91' })
  const graduate = { ...structuredClone(data.students[6]), id: 'student-graduate', name: 'Nila Menon', registrationId: 'MC2021199', email: 'nila.menon@example.edu', phone: '9876500099', graduated: true, year: 'Graduated', completedOn: '2026-09-30', trackingId: issueTrackingId(data, '2021'), history: [] }
  graduate.entries = YEARS.map((year, index) => ({ id: 'sample-graduate-' + index, year, academicYear: (2021 + index) + '-' + (2022 + index), start: (2021 + index) + '-08-01', end: index === 4 ? '2026-09-30' : (2022 + index) + '-07-31', outcome: index === 4 ? 'Completed' : 'Promoted', section: 'A' }))
  data.students.push(graduate)
  return complete ? populateSampleStages(data) : data
}

/** Fill empty batch/stage views once; existing students and academic records remain intact.
 * Demo histories use each batch's timeline, including future years for newer cohorts.
 * @param {import('./studentManagement.js').Directory} source
 */
export function populateSampleStages(source) {
  const data = migrateDirectory(source)
  const names = ['Arjun Mehta', 'Kavya Iyer', 'Neel Sharma', 'Tara Menon', 'Aditya Rao', 'Anika Das', 'Rishi Kapoor', 'Maya Nair', 'Dev Patel', 'Ira Joseph', 'Varun Shah', 'Leela Raman']
  for (const [batchIndex, batch] of data.batches.entries()) {
    for (const [stageIndex, stage] of [...YEARS, 'Graduated'].entries()) {
      if (data.students.some(student => student.batch === batch.id && student.tracked && student.year === stage)) continue
      for (let index = 0; index < 2; index++) {
        let suffix = batchIndex * 100 + stageIndex * 2 + index + 1
        while (data.students.some(student => student.registrationId === 'DEMO' + batch.id + suffix || student.email === 'student.' + batch.id + '.' + suffix + '@example.edu' || student.phone === String(9000000000 + suffix))) suffix++
        const id = 'demo-' + batch.id + '-' + suffix
        const graduated = stage === 'Graduated', count = graduated ? YEARS.length : stageIndex + 1
        const baseYear = Number(batch.id), section = index ? 'B' : 'N/A'
        const entries = YEARS.slice(0, count).map((year, entryIndex) => ({ id: id + '-year-' + entryIndex, year, academicYear: (baseYear + entryIndex) + '-' + (baseYear + entryIndex + 1), start: entryIndex ? (baseYear + entryIndex) + '-08-01' : batch.startsOn, end: !graduated && entryIndex === count - 1 ? null : (baseYear + entryIndex + 1) + '-07-31', outcome: !graduated && entryIndex === count - 1 ? 'Current' : graduated && entryIndex === count - 1 ? 'Completed' : 'Promoted', section }))
        const current = entries.at(-1), department = (SUBJECTS[stage] || SUBJECTS.Internship)[index]
        data.students.push({ id, trackingId: issueTrackingId(data, batch.id), registrationId: 'DEMO' + batch.id + suffix, name: names[(stageIndex * 2 + index + batchIndex) % names.length], email: 'student.' + batch.id + '.' + suffix + '@example.edu', code: '+91', phone: String(9000000000 + suffix), course: batch.course, batch: batch.id, year: stage, academicYear: current.academicYear, joinedOn: entries[0].start, startedAt: current.start, completedOn: graduated ? current.end : undefined, department, subject: department, section, status: 'Active', tracked: true, graduated, revision: 0, academicRevision: 0, entries, subjectSyllabuses: {}, syllabus: '', isSample: true, history: [{ id: id + '-history', action: 'Sample record', year: stage, academicYear: current.academicYear, date: current.start, note: 'Demonstration student with a sample academic timeline.' }] })
      }
    }
  }
  return data
}
