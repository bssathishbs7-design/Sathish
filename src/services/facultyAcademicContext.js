import { calendarValue, monthStart, monthEnd } from './studentCalendar.js'
import { SUBJECT_CATALOG, liveState, overlaps, localDate } from './facultyModel.js'

export const calendarKey = (batchId, studyYear, calendar) => [batchId, studyYear, calendar?.from, calendar?.to].join('|')
export function contexts(directory, year) {
  return directory.batches.filter(b => b.course === 'MBBS' && b.calendars?.[year]).map(b => ({ batchId: b.id, studyYear: year, fromMonth: b.calendars[year].from, toMonth: b.calendars[year].to, calendarFingerprint: calendarKey(b.id, year, b.calendars[year]) }))
}
/** Resolve current students; unknown restrictions remain explicitly unverified, never inferred from backlog. */
export function resolveRoster(assignment, directory, institutionId) {
  const eligible = [], excluded = []
  const subjects = SUBJECT_CATALOG.find(s => s.id === assignment.subjectId)
  for (const student of directory.students) {
    if (!assignment.calendarRefs.some(c => c.batchId === student.batch)) continue
    const entry = student.entries?.find(e => e.outcome === 'Current')
    const batch = directory.batches.find(b => b.id === student.batch)
    const calendar = batch?.calendars?.[assignment.studyYear]
    const ref = assignment.calendarRefs.find(c => c.batchId === student.batch)
    const reasons = []
    if (student.institutionId && student.institutionId !== institutionId) reasons.push('Different institution')
    if (student.course !== 'MBBS') reasons.push('Different course')
    if (student.status !== 'Active' || student.graduated || !student.tracked) reasons.push('Not an active tracked student')
    if (student.year !== assignment.studyYear || entry?.year !== assignment.studyYear || !entry) reasons.push('No matching current attempt')
    if (!calendar || calendarKey(student.batch, assignment.studyYear, calendar) !== ref.calendarFingerprint || entry?.academicYear !== calendarValue(calendar)) reasons.push('Academic calendar mismatch')
    if (!subjects?.years.includes(assignment.studyYear)) reasons.push('Subject does not belong to study year')
    if (assignment.scopeType === 'SGT' && !assignment.selectedSgtValues.includes(student.section)) reasons.push(student.section === 'N/A' ? 'Students without SGT' : 'Different SGT')
    const restriction = student.teachingRestriction
    if (restriction?.blocked && (!restriction.from || restriction.from <= assignment.endsOn) && (!restriction.to || restriction.to >= assignment.startsOn)) reasons.push(restriction.reason || 'Teaching restriction')
    const member = { studentId: student.id, name: student.name, registrationId: student.registrationId, academicEntryId: entry?.id, teachingBatchId: student.batch, admissionBatchId: student.motherBatch || student.batch, sectionAtAssignment: student.section, syllabusAtAssignment: student.subjectSyllabuses?.[assignment.studyYear + ':' + subjects?.name] || student.syllabus || batch?.subjectSyllabuses?.[assignment.studyYear + ':' + subjects?.name] || batch?.syllabus || 'Not set', sourceRevision: student.revision, sourceAcademicRevision: student.academicRevision, restrictionVerified: Boolean(restriction), validFrom: assignment.startsOn, validTo: assignment.endsOn }
    if (reasons.length) excluded.push({ ...member, reasons })
    else eligible.push(member)
  }
  return { eligible, excluded }
}
export function contextErrors(a, data, directory) {
  const errors = []
  const faculty = data.faculty.find(f => f.id === a.facultyId)
  if (!faculty || faculty.accountStatus !== 'ACTIVE') errors.push('Choose an active faculty member.')
  if (!faculty?.eligibleSubjectIds.includes(a.subjectId) || !SUBJECT_CATALOG.find(s => s.id === a.subjectId)?.years.includes(a.studyYear)) errors.push('Choose a subject eligible for the faculty and study year.')
  if (!a.calendarRefs.length) errors.push('Choose at least one teaching batch.')
  for (const ref of a.calendarRefs) {
    const actual = contexts(directory, a.studyYear).find(c => c.batchId === ref.batchId)
    if (actual?.calendarFingerprint !== ref.calendarFingerprint) errors.push('Batch calendar changed. Select the teaching context again.')
    if (ref.fromMonth !== a.calendarRefs[0].fromMonth || ref.toMonth !== a.calendarRefs[0].toMonth) errors.push('Teaching batches must share exact calendar dates.')
    if (a.startsOn < monthStart(ref.fromMonth) || a.endsOn > monthEnd(ref.toMonth)) errors.push('Assignment dates must be within the academic period.')
  }
  if (a.scopeType === 'SGT' && !a.selectedSgtValues.length) errors.push('Select at least one SGT.')
  return [...new Set(errors)]
}
/** Fingerprint includes relevant source data and all possible conflicting assignments. */
export function previewAssignment(a, data, directory, date = localDate()) {
  const roster = resolveRoster(a, directory, data.institutionId)
  const members = roster.eligible.filter(m => !(a.excludedStudentIds || []).includes(m.studentId))
  const errors = contextErrors(a, data, directory)
  const ids = new Set(members.map(m => m.studentId))
  const primary = data.assignments.find(x => x.id === a.primaryAssignmentId)
  if (a.roleType === 'CO_TEACHER') {
    if (!primary || primary.roleType !== 'PRIMARY' || !['ACTIVE', 'SCHEDULED'].includes(liveState(primary, date)) || primary.facultyId === a.facultyId || primary.subjectId !== a.subjectId || primary.studyYear !== a.studyYear || primary.startsOn > a.startsOn || primary.endsOn < a.endsOn || contextErrors(primary, data, directory).length) errors.push('Choose an active or scheduled primary that covers the subject and dates.')
    else {
      const validPrimary = new Set(resolveRoster(primary, directory, data.institutionId).eligible.map(m => m.studentId))
      if (members.some(m => !primary.members.some(p => p.studentId === m.studentId && p.academicEntryId === m.academicEntryId) || !validPrimary.has(m.studentId))) errors.push('Every co-teacher student must belong to the current primary roster.')
    }
  }
  for (const existing of data.assignments) {
    if (existing.id === a.id || ['DRAFT', 'CANCELLED'].includes(existing.state) || existing.subjectId !== a.subjectId || !overlaps(existing, a)) continue
    const count = existing.members.filter(m => ids.has(m.studentId)).length
    if (count && (existing.facultyId === a.facultyId || (existing.roleType === 'PRIMARY' && a.roleType === 'PRIMARY'))) errors.push(count + ' students already have overlapping responsibility with ' + (data.faculty.find(f => f.id === existing.facultyId)?.name || 'another faculty') + '.')
  }
  const fingerprint = JSON.stringify({ a, source: roster, faculty: data.faculty, assignments: data.assignments, date })
  return { ...roster, members, errors: [...new Set(errors)], fingerprint }
}
export function assignmentChanges(a, data, directory) {
  if (['DRAFT', 'CANCELLED', 'ENDED'].includes(liveState(a))) return { added: [], removed: [], changed: [], errors: [], needsReview: false }
  const preview = previewAssignment(a, data, directory)
  const added = preview.members.filter(m => !a.members.some(old => old.studentId === m.studentId))
  const removed = a.members.filter(m => !preview.members.some(next => next.studentId === m.studentId))
  const changed = preview.members.filter(m => a.members.some(old => old.studentId === m.studentId && ['academicEntryId', 'sectionAtAssignment', 'syllabusAtAssignment', 'sourceAcademicRevision'].some(key => old[key] !== m[key])))
  return { added, removed, changed, errors: preview.errors, needsReview: Boolean(added.length || removed.length || changed.length || preview.errors.length), preview }
}

/** Assignment-scoped live eligibility only; downstream modules must also enforce their own permissions.
 * Scheduled publication cannot activate with unreviewed differences. Saved memberships remain immutable.
 */
export function effectiveFacultyRoster(a, data, directory, date = localDate()) {
  if (liveState(a, date) !== 'ACTIVE') return []
  const preview = previewAssignment(a, data, directory, date)
  if (preview.errors.length) return []
  if (a.state === 'SCHEDULED' && (preview.members.length !== a.members.length || preview.members.some(m => !a.members.some(old => old.studentId === m.studentId && old.academicEntryId === m.academicEntryId && old.sectionAtAssignment === m.sectionAtAssignment && old.syllabusAtAssignment === m.syllabusAtAssignment)))) return []
  return a.members.filter(m => preview.members.some(next => next.studentId === m.studentId && next.academicEntryId === m.academicEntryId))
}

export function assignmentStatus(a, data, directory, date = localDate()) {
  const state = liveState(a, date)
  return state === 'ACTIVE' && a.state === 'SCHEDULED' && !effectiveFacultyRoster(a, data, directory, date).length ? 'BLOCKED' : state
}

