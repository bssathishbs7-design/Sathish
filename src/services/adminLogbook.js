import { applyDeltas, commit, readDeltas, today } from './logbook.js'
import { CATEGORIES, SUBJECTS } from './logbookSample.js'

/**
 * @typedef {{id:string,name:string,departments:string[],role:string}} FacultyActor
 * @typedef {{actor:string,action:string,remarks:string,at:string}} ReviewEvent
 * @typedef {{studentId:string,subject:string,status:'Not ready'|'Ready'|'Submitted'|'Returned'|'Completed',chain?:string[],step?:number,remarks?:string,completedAt?:string,history:ReviewEvent[]}} SubjectSignoff
 * @typedef {{chain:string[],signoffs:Object<string,SubjectSignoff>}} LogbookWorkflow
 * The mock API stores workflow alongside entry deltas for atomic updates. API integration
 * must derive the actor/student from authentication, enforce department ownership on the
 * server, and use revision checks for concurrent decisions. Browser storage is demo-only.
 */

export { LEARNERS, REVIEWERS, learnerName, actorName, isGraded, belongsTo, visibleTo, actionable } from './logbookPeople.js'
import { LEARNERS, REVIEWERS, actorName, isGraded, belongsTo, actionable } from './logbookPeople.js'
import { getLogbookGroups } from './logbookSchemas.js'
export const DEFAULT_CHAIN = ['HOD', 'DEAN', 'DIRECTOR']
const timestamp = () => new Date().toISOString()
const workflow = deltas => ({ chain: DEFAULT_CHAIN, chains: {}, signoffs: {}, ...deltas.workflow })
export const chainFor = (state, subject) => state.chains?.[subject] || state.chain || DEFAULT_CHAIN
const requireThat = (condition, message) => { if (!condition) throw new Error(message) }
const audit = (entry, actor, action, remarks) => [...(entry.audit || []), { actor: actor.id, action, remarks, at: timestamp() }]

/** @returns {Promise<{chain:string[], signoffs:Object}>} Local API adapter for final approvals. */
export async function getLogbookWorkflow() { return workflow(readDeltas()) }

/** Atomically validate and review every selected record against the latest snapshot.
 * @param {string[]} ids @param {Object} actor @param {{status:string,remarks?:string,attempt?:string,rating?:string,decision?:string}} decision
 */
export async function reviewEntries(ids, actor, decision) {
  const deltas = readDeltas(), entries = applyDeltas(deltas)
  requireThat(ids.length > 0, 'Select at least one entry.')
  requireThat(['Approved', 'Returned'].includes(decision.status), 'Choose a decision.')
  requireThat(decision.status !== 'Returned' || decision.remarks?.trim(), 'Add feedback before returning an entry.')
  for (const id of ids) {
    const entry = entries.find(item => item.id === id)
    requireThat(entry && actionable(entry, actor), 'This entry is no longer assigned to you for review.')
    requireThat(ids.length === 1 || !isGraded(entry), 'Review certifiable skills individually.')
    if (isGraded(entry)) {
      requireThat(['F', 'R', 'Re'].includes(decision.attempt) && ['M', 'B', 'E'].includes(decision.rating), 'Select an attempt and rating.')
      requireThat(!entry.linkedTo || decision.attempt !== 'F', 'A remedial entry must be a repeat or remedial attempt.')
    }
    const remarks = decision.remarks?.trim() || ''
    deltas.edits[id] = { ...deltas.edits[id], status: decision.status, verifiedAt: timestamp(), audit: audit(entry, actor, decision.status, remarks), ...(isGraded(entry) ? { grading: { attempt: decision.attempt, rating: decision.rating, decision: decision.status === 'Approved' ? 'C' : decision.decision === 'Re' ? 'Re' : 'R' } } : {}), extra: { ...entry.extra, facultyRemarks: remarks } }
  }
  return commit(deltas)
}
export async function reassignEntry(id, actor, faculty) {
  const deltas = readDeltas(), entry = applyDeltas(deltas).find(item => item.id === id)
  requireThat(entry && actionable(entry, actor), 'Only your pending entries can be reassigned.')
  requireThat(faculty !== actor.id && REVIEWERS.some(person => person.id === faculty && person.departments.includes(entry.subject)), 'Choose another faculty member from this department.')
  deltas.edits[id] = { ...deltas.edits[id], faculty, audit: audit(entry, actor, 'Reassigned', actorName(faculty)) }
  return commit(deltas)
}
/** Assignment shape: {by, due, instructions, assignedAt}; student completes schema fields. */
export const assignmentFields = (cat, subject) => (getLogbookGroups(cat, subject)[0]?.fields || []).filter(field => ['competency', 'moduleNo', 'topic', 'activity', 'numReq', 'depts', 'recordType', 'sessionType', 'exerciseType', 'activityType', 'exerciseNo', 'specimenNo', 'place', 'village', 'day', 'station', 'week', 'diagnosis', 'provDx'].includes(field.key))
export async function assignEntries(actor, { studentId, subject, cat, due = '', instructions = '', values = {} }) {
  requireThat(actor.departments.includes(subject), 'Choose your department subject.')
  requireThat(CATEGORIES.some(category => category.id === cat) && SUBJECTS.find(item => item.name === subject)?.categories.includes(cat), 'Choose a category for this subject.')
  requireThat(!due || (/^\d{4}-\d{2}-\d{2}$/.test(due) && !Number.isNaN(Date.parse(due)) && new Date(due).toISOString().slice(0, 10) === due && due >= today()), 'Choose a valid due date from today onwards.')
  const fields = assignmentFields(cat, subject)
  const taskValues = Object.fromEntries(fields.filter(field => String(values[field.key] || '').trim()).map(field => [field.key, String(values[field.key]).trim()]))
  for (const field of fields) {
    const value = taskValues[field.key]
    requireThat(!value || field.type !== 'number' || (/^\d+$/.test(value) && Number(value) > 0), `${field.label}: use a positive whole number.`)
    requireThat(!value || !field.options || field.options.includes(value), `${field.label}: choose a listed option.`)
  }
  requireThat(instructions.trim() || Object.keys(taskValues).length, 'Add task details or instructions for the student.')
  const students = studentId === 'all' ? LEARNERS : LEARNERS.filter(person => person.id === studentId)
  requireThat(students.length, 'Choose a student.')
  const deltas = readDeltas()
  students.forEach(person => deltas.added.unshift({ id: crypto.randomUUID(), studentId: person.id, subject, cat, faculty: actor.id, status: 'To do', date: today(), values: taskValues, extra: {}, assignment: { by: actor.id, due, instructions: instructions.trim(), locked: Object.keys(taskValues), assignedAt: timestamp() } }))
  return commit(deltas)
}
export async function cancelAssignment(id, actor) {
  const deltas = readDeltas(), entry = applyDeltas(deltas).find(item => item.id === id)
  requireThat(entry?.status === 'To do' && entry.assignment?.by === actor.id, 'Only your unsubmitted assignments can be cancelled.')
  deltas.removed.push(id); return commit(deltas)
}
export async function saveApprovalChain(chain, subject, actor) {
  requireThat(chain.length && new Set(chain).size === chain.length && chain.every(id => REVIEWERS.some(person => person.id === id)), 'Choose at least one approver without duplicates.')
  requireThat(!subject || actor?.departments.includes(subject) || ['Dean', 'Director'].includes(actor?.role), 'Only authorised faculty can configure this subject chain.')
  const deltas = readDeltas(), state = workflow(deltas)
  deltas.workflow = subject ? { ...state, chains: { ...state.chains, [subject]: chain } } : { ...state, chain }
  return commit(deltas)
}
/** Sign-off is separate from individual decisions; submitted chains are immutable snapshots.
 * @param {{studentId:string,subject:string,action:'ready'|'submit'|'approve'|'return',actor?:Object,remarks?:string}} request
 */
export async function changeSignoff({ studentId, subject, action, actor, remarks = '', learnerId }) {
  const deltas = readDeltas(), state = workflow(deltas), key = `${studentId}:${subject}`
  const previous = state.signoffs[key] || { studentId, subject, status: 'Not ready', history: [] }
  const entries = applyDeltas(deltas).filter(entry => belongsTo(entry, studentId) && entry.subject === subject)
  requireThat(LEARNERS.some(person => person.id === studentId) && SUBJECTS.some(item => item.name === subject), 'Choose a valid student and subject.')
  let patch
  if (action === 'ready') {
    requireThat(actor?.departments.includes(subject), 'Only department faculty can mark this logbook ready.')
    requireThat(['Not ready', 'Returned'].includes(previous.status), 'This logbook has already progressed.')
    requireThat(entries.some(entry => entry.status === 'Approved') && !entries.some(entry => ['Pending', 'To do'].includes(entry.status)), 'Clear pending reviews and assignments, and verify at least one entry first.')
    patch = { status: 'Ready' }
  } else if (action === 'submit') {
    requireThat(!learnerId || learnerId === studentId, 'Only the owner can submit this logbook.')
    requireThat(['Ready', 'Returned'].includes(previous.status), 'Faculty must mark the logbook ready first.')
    requireThat(entries.some(entry => entry.status === 'Approved') && !entries.some(entry => ['Pending', 'To do'].includes(entry.status)), 'Complete pending entries and assignments first.')
    patch = { status: 'Submitted', submittedAt: timestamp(), chain: [...chainFor(state, subject)], step: 0 }
  } else {
    requireThat(previous.status === 'Submitted' && previous.chain[previous.step] === actor?.id, 'This logbook is not awaiting your signature.')
    requireThat(['approve', 'return'].includes(action), 'Choose a sign-off decision.')
    requireThat(action !== 'return' || remarks.trim(), 'Give a reason for returning the logbook.')
    patch = action === 'return' ? { status: 'Returned', remarks } : previous.step + 1 === previous.chain.length ? { status: 'Completed', completedAt: timestamp() } : { step: previous.step + 1 }
  }
  const record = { ...previous, ...patch, history: [...previous.history, { action, actor: actor?.id || studentId, remarks, at: timestamp() }] }
  deltas.workflow = { ...state, signoffs: { ...state.signoffs, [key]: record } }; return commit(deltas)
}
