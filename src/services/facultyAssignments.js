import { facultySamples } from './facultySamples.js'
import { contexts, resolveRoster, previewAssignment } from './facultyAcademicContext.js'
import { profileErrors, fail, validDay, localDate, dayBefore, liveState, SGT_VALUES } from './facultyModel.js'
import { monthStart, monthEnd } from './studentCalendar.js'

export function initialFacultyState(institutionId, directory, date = localDate()) {
  const state = { version: 1, institutionId, revision: 0, faculty: facultySamples(institutionId), assignments: [], history: [], requests: {} }
  const context = contexts(directory, 'First Year').find(c => monthStart(c.fromMonth) <= date && monthEnd(c.toMonth) >= date)
  if (context) {
    const assignment = { id: 'sample-anatomy-primary', institutionId, facultyId: 'faculty-anika', roleType: 'PRIMARY', primaryAssignmentId: '', courseId: 'MBBS', studyYear: 'First Year', calendarRefs: [context], subjectId: 'human-anatomy', scopeType: 'WHOLE_BATCH', selectedSgtValues: [], excludedStudentIds: [], exclusionReason: '', startsOn: monthStart(context.fromMonth), endsOn: monthEnd(context.toMonth), state: 'ACTIVE', members: [], rosterHistory: [], revision: 0, rosterRevision: 1, isSample: true }
    assignment.members = resolveRoster(assignment, directory, institutionId).eligible
    if (assignment.members.length) {
      state.assignments.push(assignment)
      state.assignments.push({ ...structuredClone(assignment), id: 'sample-anatomy-coteacher', facultyId: 'faculty-farhan', roleType: 'CO_TEACHER', primaryAssignmentId: assignment.id })
    }
  }
  return state
}

const validAssignment = (a, data, directory, date) => {
  if (!['PRIMARY', 'CO_TEACHER'].includes(a.roleType) || !['SGT', 'WHOLE_BATCH'].includes(a.scopeType)) fail('Choose a teaching role and scope.')
  if (!validDay(a.startsOn) || !validDay(a.endsOn) || a.startsOn > a.endsOn || a.endsOn < date) fail('Choose valid dates in a current or future period.')
  if (a.scopeType === 'SGT' && a.selectedSgtValues.some(s => !SGT_VALUES.includes(s))) fail('Choose SGT A to O.')
  if (a.scopeType === 'WHOLE_BATCH' && (a.excludedStudentIds.length || a.selectedSgtValues.length)) fail('Whole batch includes all eligible students, without SGT exclusions.')
  if (a.excludedStudentIds.length && !a.exclusionReason?.trim()) fail('Explain intentional student exclusions.')
  const preview = previewAssignment(a, data, directory, date)
  if (preview.errors.length) fail(preview.errors.join(' '))
  if (!preview.members.length) fail('Select at least one eligible student.')
  return preview
}
export function normaliseAssignment(input, institutionId) {
  return { id: input.id || '', institutionId, facultyId: input.facultyId || '', courseId: 'MBBS', studyYear: input.studyYear || '', subjectId: input.subjectId || '', roleType: input.roleType || 'PRIMARY', primaryAssignmentId: input.roleType === 'CO_TEACHER' ? input.primaryAssignmentId || '' : '', calendarRefs: structuredClone(input.calendarRefs || []), scopeType: input.scopeType || 'SGT', selectedSgtValues: [...new Set(input.selectedSgtValues || [])], excludedStudentIds: [...new Set(input.excludedStudentIds || [])], exclusionReason: input.exclusionReason || '', startsOn: input.startsOn || '', endsOn: input.endsOn || '' }
}
/** Pure atomic command reducer. Adapter persists this result and audit/request ledger together.
 * @param {object} source Versioned faculty snapshot
 * @param {object} command Command with requestId, expectedRevision, and draft/id/reason
 * @param {object} directory Latest authoritative student snapshot
 * @param {{canEdit:boolean,actor:string,date?:string}} options Trusted by offline mock only
 */
export function applyFacultyCommand(source, command, directory, { canEdit, actor, date = localDate() }) {
  if (!canEdit) fail('You have read-only access to faculty management.')
  if (!command.requestId) fail('A request identifier is required.')
  const requestBody = JSON.stringify(command)
  if (source.requests[command.requestId]) {
    if (source.requests[command.requestId] !== requestBody) fail('This request was already used for different changes.')
    return source
  }
  if (command.expectedRevision !== source.revision) fail('Faculty data changed. Refresh and review again.')
  const data = structuredClone(source)
  const before = { faculty: source.faculty, assignments: source.assignments }
  const timestamp = new Date().toISOString()
  let entityId = command.id || command.draft?.id || ''
  let message = ''
  const get = () => data.assignments.find(a => a.id === command.id) || fail('Assignment no longer exists.')
  const archive = a => { a.rosterHistory.push({ at: timestamp, actor, reason: command.reason || command.type, facultyId: a.facultyId, startsOn: a.startsOn, endsOn: a.endsOn, members: structuredClone(a.members), rosterRevision: a.rosterRevision }); a.revision++ }
  const closeAssignment = a => {
    archive(a)
    if (a.state === 'DRAFT' || a.startsOn >= date) a.state = 'CANCELLED'
    else { a.endsOn = dayBefore(date); a.state = 'ENDED'; a.members = a.members.map(m => ({ ...m, validTo: a.endsOn })) }
  }
  if (command.type === 'profile' || command.type === 'import') {
    const drafts = command.type === 'import' ? command.rows : [command.draft]
    if (!drafts?.length) fail('Choose valid faculty rows to save.')
    for (const draft of drafts) {
      const errors = profileErrors(draft, data)
      if (Object.keys(errors).length) fail(Object.values(errors).join(' '))
      const previous = data.faculty.find(f => f.id === draft.id)
      if (draft.id && !previous) fail('Faculty profile no longer exists.')
      const record = { id: previous?.id || crypto.randomUUID(), institutionId: data.institutionId, employeeId: draft.employeeId.trim(), name: draft.name.trim(), email: draft.email.trim().toLowerCase(), phone: draft.phone?.trim() || '', departmentId: draft.departmentId.trim(), designationId: draft.designationId, eligibleSubjectIds: [...new Set(draft.eligibleSubjectIds)], accountStatus: previous?.accountStatus || 'ACTIVE', revision: (previous?.revision ?? -1) + 1, createdAt: previous?.createdAt || timestamp, updatedAt: timestamp }
      if (previous) data.faculty = data.faculty.map(f => f.id === record.id ? record : f)
      else data.faculty.push(record)
      entityId = record.id
    }
    message = command.type === 'import' ? drafts.length + ' faculty profiles imported' : 'Faculty profile saved'
  } else if (['draft', 'publish', 'reconcile'].includes(command.type)) {
    const old = command.type === 'reconcile' ? get() : data.assignments.find(a => a.id === command.draft.id)
    if (old && ['CANCELLED', 'ENDED'].includes(liveState(old, date))) fail('Ended assignments are read-only. Copy to a new period.')
    if (command.type === 'draft' && old && old.state !== 'DRAFT') fail('Published assignments cannot be changed back to drafts.')
    const a = normaliseAssignment(command.type === 'reconcile' ? old : command.draft, data.institutionId)
    if (!data.faculty.some(f => f.id === a.facultyId)) fail('Choose a faculty member.')
    if (old) a.id = old.id
    const candidate = previewAssignment(a, data, directory, date)
    if (command.type !== 'draft') {
      if (candidate.fingerprint !== command.fingerprint) fail('The roster or context changed. Review the latest students before publishing.')
      validAssignment(a, data, directory, date)
    }
    const record = { ...a, id: a.id || crypto.randomUUID(), state: command.type === 'draft' ? 'DRAFT' : a.startsOn > date ? 'SCHEDULED' : 'ACTIVE', members: command.type === 'draft' ? [] : candidate.members, rosterHistory: structuredClone(old?.rosterHistory || []), revision: (old?.revision ?? -1) + 1, rosterRevision: (old?.rosterRevision || 0) + (command.type === 'draft' ? 0 : 1), createdAt: old?.createdAt || timestamp, updatedAt: timestamp }
    if (old) record.rosterHistory.push({ at: timestamp, actor, reason: command.reason || 'Assignment revised', facultyId: old.facultyId, members: old.members, startsOn: old.startsOn, endsOn: old.endsOn, rosterRevision: old.rosterRevision })
    data.assignments = old ? data.assignments.map(x => x.id === old.id ? record : x) : [...data.assignments, record]
    for (const child of data.assignments.filter(x => x.primaryAssignmentId === record.id && ['ACTIVE', 'SCHEDULED'].includes(liveState(x, date)))) {
      const result = previewAssignment(child, data, directory, date)
      if (result.errors.length) fail('This change would leave a co-teacher without coverage. End or revise dependent assignments first.')
    }
    entityId = record.id
    message = command.type === 'draft' ? 'Assignment draft saved' : command.type === 'reconcile' ? 'Roster changes reviewed' : 'Teaching assignment published'
  } else if (['end', 'reassign', 'status'].includes(command.type)) {
    if (!command.reason?.trim()) fail('Enter a reason for this change.')
    if (command.type === 'status') {
      const profile = data.faculty.find(f => f.id === command.id) || fail('Faculty no longer exists.')
      if (profile.accountStatus === 'ACTIVE') {
        const owned = data.assignments.filter(a => a.facultyId === profile.id && ['ACTIVE', 'SCHEDULED', 'DRAFT'].includes(liveState(a, date)))
        const affected = data.assignments.filter(a => owned.includes(a) || owned.some(p => a.primaryAssignmentId === p.id))
        affected.filter(a => !['ENDED', 'CANCELLED'].includes(liveState(a, date))).forEach(closeAssignment)
      }
      profile.accountStatus = profile.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      profile.revision++
      message = 'Faculty ' + (profile.accountStatus === 'ACTIVE' ? 'reactivated' : 'deactivated; affected assignments closed')
    } else {
      const a = get()
      if (['ENDED', 'CANCELLED'].includes(liveState(a, date))) fail('This assignment has already ended.')
      if (command.type === 'end') {
        [a, ...data.assignments.filter(child => child.primaryAssignmentId === a.id && ['ACTIVE', 'SCHEDULED', 'DRAFT'].includes(liveState(child, date)))].forEach(closeAssignment)
        message = 'Assignment and dependent co-teaching closed'
      } else {
        if (a.state === 'DRAFT') fail('Edit the draft to change its faculty.')
        const next = { ...normaliseAssignment(a, data.institutionId), id: '', facultyId: command.facultyId, startsOn: a.startsOn > date ? a.startsOn : date }
        if (next.facultyId === a.facultyId) fail('Choose a different faculty member.')
        const dependent = data.assignments.filter(child => child.primaryAssignmentId === a.id && ['ACTIVE', 'SCHEDULED'].includes(liveState(child, date)))
        closeAssignment(a)
        const preview = validAssignment(next, data, directory, date)
        const replacement = { ...next, id: crypto.randomUUID(), state: next.startsOn > date ? 'SCHEDULED' : 'ACTIVE', members: preview.members, rosterHistory: [], revision: 0, rosterRevision: 1 }
        data.assignments.push(replacement)
        for (const child of dependent) {
          const continuation = { ...normaliseAssignment(child, data.institutionId), id: crypto.randomUUID(), primaryAssignmentId: replacement.id, startsOn: child.startsOn > date ? child.startsOn : date, state: child.startsOn > date ? 'SCHEDULED' : 'ACTIVE', rosterHistory: [], revision: 0, rosterRevision: 1 }
          closeAssignment(child)
          const check = previewAssignment(continuation, data, directory, date)
          if (check.errors.length) fail('Replacement would invalidate a dependent co-teacher. End that co-teaching assignment first.')
          continuation.members = check.members
          data.assignments.push(continuation)
        }
        entityId = replacement.id
        message = 'Teaching responsibility reassigned'
      }
    }
  } else fail('Unsupported faculty operation.')
  data.revision++
  data.requests[command.requestId] = requestBody
  data.history.unshift({ id: crypto.randomUUID(), entityId, action: message, actor, at: timestamp, reason: command.reason || '', before, after: { faculty: data.faculty, assignments: data.assignments } })
  return data
}

