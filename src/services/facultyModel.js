import { SUBJECTS } from './studentModel.js'
import { STUDY_YEARS } from './studentCalendar.js'

/** @typedef {{id:string,institutionId:string,employeeId:string,name:string,email:string,phone:string,departmentId:string,designationId:string,eligibleSubjectIds:string[],accountStatus:'ACTIVE'|'INACTIVE',revision:number}} FacultyRecord
 * @typedef {{id:string,institutionId:string,facultyId:string,roleType:'PRIMARY'|'CO_TEACHER',primaryAssignmentId:string,studyYear:string,calendarRefs:Array,subjectId:string,scopeType:'SGT'|'WHOLE_BATCH',selectedSgtValues:string[],startsOn:string,endsOn:string,state:string,members:Array,rosterHistory:Array,revision:number}} TeachingAssignment
 * All dates are institution-local ISO dates. Browser adapters are offline mocks, not server authorisation.
 */
export const FACULTY_EVENT = 'medsy-faculty-changed'
export const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Senior Resident', 'Tutor']
export const SGT_VALUES = [...'ABCDEFGHIJKLMNO']
export const SUBJECT_CATALOG = [...new Set(STUDY_YEARS.flatMap(year => SUBJECTS[year]))].map(name => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, years: STUDY_YEARS.filter(year => SUBJECTS[year].includes(name)) }))
export const subjectName = id => SUBJECT_CATALOG.find(s => s.id === id)?.name || id
export const localDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
export const fail = message => { throw new Error(message) }
export const unique = values => [...new Set(values)]
export const validDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
export const dayBefore = value => new Date(Date.parse(value + 'T12:00:00Z') - 86400000).toISOString().slice(0, 10)
export const liveState = (a, date = localDate()) => ['DRAFT', 'CANCELLED', 'ENDED'].includes(a.state) ? a.state : a.endsOn < date ? 'ENDED' : a.startsOn > date ? 'SCHEDULED' : 'ACTIVE'
export const overlaps = (a, b) => a.startsOn <= b.endsOn && b.startsOn <= a.endsOn
export function profileErrors(draft, data) {
  const errors = {}
  for (const key of ['employeeId', 'name', 'email', 'departmentId', 'designationId']) if (!draft[key]?.trim()) errors[key] = 'This field is required.'
  if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = 'Enter a valid email address.'
  if (draft.phone && !/^\+?[\d ()-]{7,20}$/.test(draft.phone)) errors.phone = 'Enter a valid phone number, including country code.'
  for (const key of ['employeeId', 'email']) if (data.faculty.some(f => f.id !== draft.id && f[key].trim().toLowerCase() === draft[key]?.trim().toLowerCase())) errors[key] = 'Already used by another faculty member.'
  if (!DESIGNATIONS.includes(draft.designationId)) errors.designationId = 'Choose a designation.'
  if (!draft.eligibleSubjectIds?.length || draft.eligibleSubjectIds.some(id => !SUBJECT_CATALOG.some(s => s.id === id))) errors.eligibleSubjectIds = 'Select at least one teaching subject.'
  return errors
}

