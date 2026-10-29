import { LEARNERS, REVIEWERS } from './logbookPeople.js'
import { getLogbookGroups } from './logbookSchemas.js'
import { assignmentSamples, sourceAssignmentValues } from './logbookAssignmentSamples.js'

/** Completed, fictional demo records for category browsing, not real student attestations.
 * Stable IDs let persisted edits/removals override seeds without duplicating them.
 * Skills and certification continue to come from the existing Skills integration.
 */
const examples = [
  ['simulation', 'Anaesthesiology', { activity: 'Airway positioning on a training mannequin', station: 'Simulation lab airway station', attemptNo: '1' }],
  ['proc', 'General Surgery', { activity: 'Aseptic dressing on a simulation model' }],
  ['ece', 'Human Anatomy', {}],
  ['aetcom', 'Pathology', {}],
  ['vertical', 'Biochemistry', {}],
  ['horizontal', 'Physiology', { competency: 'PY5.6', topic: 'Cardiac function and its anatomical basis', depts: 'Human Anatomy; Physiology' }],
  ['sdl', 'Physiology', {}],
  ['sgt', 'Pathology', { topic: 'Interpreting a simulated peripheral blood smear' }],
  ['journal', 'General Medicine', { topic: 'Critical appraisal of a sample case discussion' }],
  ['practical', 'Biochemistry', { activity: 'Interpretation of a simulated serum protein report', exerciseNo: 'DEMO-BC-01', observation: 'Compared the supplied training report with the reference pattern.' }],
  ['ccp', 'General Medicine', { diagnosis: 'Simulated respiratory case discussion' }],
  ['clerkship', 'General Surgery', { provDx: 'Simulated uncomplicated hernia case', admission: '2026-09-21', discharge: '2026-09-22' }],
  ['emergency', 'General Medicine', { cases: '2', notable: 'Practised structured triage and handover using two fictional scenarios.' }],
  ['museum', 'Human Anatomy', { specimenNo: 'DEMO-AN-01', activity: 'Identification of upper-limb landmarks on a teaching model' }],
  ['obg', 'Obstetrics and Gynaecology', { parity: '26 / G2P1 (fictional)', outcome: 'Simulated antenatal history and examination discussion' }],
  ['imm', 'Paediatrics', { children: '3', vaccines: 'Reviewed fictional vaccination records and identified follow-up questions.' }],
  ['pm', 'Forensic Medicine and Toxicology', { caseNo: 'DEMO-FM-01', findings: 'Discussed documentation and evidence handling using a fictional teaching case.' }],
  ['fap', 'Community Medicine', { place: 'Demo community learning site', families: '2', members: '4, 3', findings: 'Recorded fictional household needs and prepared a sample follow-up plan.' }],
  ['fvs', 'Community Medicine', { day: '1', village: 'Demo training village', place: 'Demo primary health centre', dataCount: '5', analysis: 'Grouped the five fictional survey responses by follow-up need.' }],
  ['chs', 'Community Medicine', { place: 'Demo community classroom', beneficiaries: '12', findings: 'Prepared a sample health-education session and gathered simulated feedback.' }],
  ['pharm', 'Pharmacology', { activity: 'Review of a fictional prescription', summary: 'Checked the teaching prescription for completeness and documented questions for the tutor.' }],
  ['ach', 'Human Anatomy', { activity: 'Student seminar: surface anatomy learning models' }],
  ['community', 'Community Medicine', { topic: 'Sample community learning visit', village: 'Demo training village', reflection: 'Practised respectful communication and identified follow-up priorities in a fictional scenario.' }],
]
const reflection = {
  q1: 'Worked through the teaching scenario and discussed the main observations with the group.',
  q2: 'The discussion highlighted the value of a structured approach and clear communication.',
  q3: 'Comparing observations with peers helped identify gaps in my reasoning.',
  q4: 'I will use the checklist and seek feedback during the next supervised session.',
  r1: 'Reviewed the simulated case and presented the observations to the group.',
  r2: 'Feedback helped me distinguish observations from assumptions.',
  r3: 'I will prepare a structured summary before the next supervised activity.',
}
export const CATEGORY_SAMPLE_ENTRIES = examples.flatMap(([cat, subject, example]) => LEARNERS.map((student, index) => {
  const sources = assignmentSamples(cat, subject)
  const source = sources[index % sources.length]
  const values = { serial: String(index + 1), patientId: `DEMO-${cat.toUpperCase()}-${index + 1}`, ageGender: `${30 + index} / ${index % 2 ? 'M' : 'F'} (fictional)`, ...reflection, ...example, ...(source ? sourceAssignmentValues(source) : {}) }
  const fields = getLogbookGroups(cat, subject).filter(group => !group.locked).flatMap(group => group.fields)
  for (const field of fields) if (field.options && !values[field.key]) values[field.key] = field.options[0]
  const allowed = new Set(fields.map(field => field.key))
  const faculty = REVIEWERS.find(person => person.departments.includes(subject) && person.role === 'Faculty').id
  return {
    id: `category-demo-v1-${cat}-${student.id}`, studentId: student.id, subject, cat,
    date: `2026-09-${22 + index}`, status: 'Approved', faculty, demo: true,
    ...(source ? { catalogueActivityId: source.id } : {}),
    values: Object.fromEntries(Object.entries(values).filter(([key]) => allowed.has(key) && key !== 'date')),
    extra: { notes: 'Sample data only. This fictional, completed teaching record demonstrates the category layout; it is not a real clinical record or faculty attestation.', remarks: '', comments: [], attachments: [] },
  }
}))
