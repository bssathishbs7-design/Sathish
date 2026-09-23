import { SUBJECTS } from './logbookCatalog.js'

/** Local account catalogue. An API adapter must replace this with the authenticated
 * user and authorised memberships; changing a preview account is not authentication. */
export const LEARNERS = [
  { id: 'MC2568', registerId: 'MC2568', name: 'Karthik Subramanian', role: 'Student' },
  { id: 'MC2569', registerId: 'MC2569', name: 'Ananya Rao', role: 'Student' },
  { id: 'MC2570', registerId: 'MC2570', name: 'Arjun Patel', role: 'Student' },
]
const assignedSubjects = ['General Medicine', 'Human Anatomy', 'Physiology', 'Pathology', 'Community Medicine']
export const REVIEWERS = [
  { id: 'RM', name: 'Dr R. Menon', departments: ['General Medicine', 'Human Anatomy'], role: 'Faculty' },
  { id: 'AS', name: 'Dr A. Sharma', departments: ['Physiology', 'Pathology'], role: 'Faculty' },
  { id: 'PK', name: 'Dr P. Kumar', departments: ['Community Medicine', 'General Medicine'], role: 'Faculty' },
  ...SUBJECTS.filter(subject => !assignedSubjects.includes(subject.name)).map(subject => ({ id: `FAC-${subject.code}`, name: `${subject.label} faculty`, departments: [subject.name], role: 'Faculty' })),
  { id: 'HOD', name: 'Head of department', departments: SUBJECTS.map(subject => subject.name), role: 'HoD' },
  { id: 'DEAN', name: 'Dean', departments: [], role: 'Dean' },
  { id: 'DIRECTOR', name: 'Director', departments: [], role: 'Director' },
]
export const belongsTo = (entry, studentId) => (entry.studentId || 'MC2568') === studentId
export const learnerName = id => LEARNERS.find(person => person.id === (id || 'MC2568'))?.name || id
export const actorName = id => REVIEWERS.find(person => person.id === id)?.name || learnerName(id) || id
export const isGraded = entry => ['cert', 'remedial'].includes(entry.cat)
export const visibleTo = entry => entry.status !== 'Draft'
export const actionable = (entry, actor) => Boolean(actor && visibleTo(entry) && entry.status === 'Pending' && entry.faculty === actor.id && actor.departments.includes(entry.subject))
export const eligibleReviewers = subject => REVIEWERS.filter(person => person.departments.includes(subject))
export const awaitingRemedial = (entry, entries) => entry.status === 'Returned' && !entries.some(child => child.linkedTo === entry.id && ['Pending', 'Approved'].includes(child.status))
export const waitingDays = entry => Math.max(0, Math.floor((Date.now() - Date.parse(entry.submittedAt || `${entry.date}T00:00:00`)) / 86400000))
export const overdueEntry = entry => entry.status === 'Pending' && waitingDays(entry) > 7
