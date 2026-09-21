import { getLogbookGroups } from './logbookSchemas.js'
export { getLogbookGroups } from './logbookSchemas.js'
/**
 * Subject and category labels follow the supplied Logbook screenshots.
 * `name` is the persisted subject key; `label` is its display name. Keeping
 * Human Anatomy as the key preserves older local entries without migration.
 * Category schemas and subject restrictions follow the supplied HTML prototype.
 * Competency requirements remain sample data.
 */
const baseCategories = [
  { id: 'skill', name: 'Skill competency', shortName: 'Skill competency', group: 'Skills & procedures' },
  { id: 'cert', name: 'Certifiable skill competency', shortName: 'Certifiable skill', group: 'Skills & procedures' },
  { id: 'simulation', name: 'Skills lab / Simulation session', shortName: 'Simulation', group: 'Skills & procedures' },
  { id: 'proc', name: 'Procedures observed / assisted / performed', shortName: 'Procedure', group: 'Skills & procedures' },
  { id: 'ece', name: 'Early clinical exposure (ECE)', shortName: 'Early clinical exposure', group: 'Teaching-learning' },
  { id: 'aetcom', name: 'Attitude, ethics & communication (AETCOM module)', shortName: 'AETCOM', group: 'Teaching-learning' },
  { id: 'vertical', name: 'Vertical integration', shortName: 'Vertical integration', group: 'Teaching-learning' },
  { id: 'horizontal', name: 'Horizontal integration', shortName: 'Horizontal integration', group: 'Teaching-learning' },
  { id: 'sdl', name: 'Self-directed learning (SDL)', shortName: 'Self-directed learning', group: 'Teaching-learning' },
  { id: 'sgt', name: 'Small group teaching (Tutorial / Seminar / SGD)', shortName: 'Small group teaching', group: 'Teaching-learning' },
  { id: 'journal', name: 'Journal club / CPC / Grand round', shortName: 'Journal club / CPC', group: 'Teaching-learning' },
  { id: 'practical', name: 'Practical / Laboratory exercise', shortName: 'Practical exercise', group: 'Teaching-learning' },
  { id: 'ccp', name: 'Clinical case presentation', shortName: 'Case presentation', group: 'Clinical postings' },
  { id: 'clerkship', name: 'Clinical clerkship', shortName: 'Clinical clerkship', group: 'Clinical postings' },
  { id: 'emergency', name: 'Emergency / Casualty duty', shortName: 'Emergency duty', group: 'Clinical postings' },
  { id: 'museum', subjects: ['Human Anatomy', 'Pathology', 'Microbiology'], name: 'Museum & specimen study (Anatomy / Pathology / Microbiology)', shortName: 'Specimen study', group: 'Department records' },
  { id: 'obg', name: 'Labour room & antenatal record (OBGY)', group: 'Clinical postings', subjects: ['Obstetrics and Gynaecology'] },
  { id: 'imm', name: 'Immunisation & well-baby clinic (Paediatrics)', group: 'Clinical postings', subjects: ['Paediatrics'] },
  { id: 'pm', name: 'Postmortem & medico-legal record (Forensic Medicine)', group: 'Clinical postings', subjects: ['Forensic Medicine and Toxicology'] },
  { id: 'fap', name: 'Family adoption program', group: 'Community medicine', subjects: ['Community Medicine'] },
  { id: 'fvs', name: 'Field visit', group: 'Community medicine', subjects: ['Community Medicine'] },
  { id: 'chs', name: 'Community health activity', group: 'Community medicine', subjects: ['Community Medicine'] },
  { id: 'pharm', name: 'Prescription & pharmacovigilance exercise', group: 'Department records', subjects: ['Pharmacology'] },
  { id: 'ach', name: 'Curricular & co-curricular achievements', group: 'Other' },
  // Existing community records remain readable/editable; this is not a new-entry option.
  { id: 'community', name: 'Community visits', group: 'Previous categories', fields: ['topic', 'village', 'reflection'], legacy: true },
]

export const FIELDS = {
  competency: { label: 'Competency number', required: true, placeholder: 'Enter competency code' },
  activity: { label: 'Activity', required: true, placeholder: 'What did you practise?' },
  participation: { label: 'Participation', type: 'select', options: ['Observed', 'Assisted', 'Performed'] },
  reflection: { label: 'Learning reflection', type: 'textarea', required: true, placeholder: 'What did you learn, and what would you improve?' },
  topic: { label: 'Topic', required: true, placeholder: 'Enter the topic or session title' },
  patientId: { label: 'Patient reference ID', required: true },
  diagnosis: { label: 'Diagnosis', required: true },
  admission: { label: 'Admission date', type: 'date', required: true },
  discharge: { label: 'Discharge date', type: 'date' },
  village: { label: 'Village / community', required: true },
}

/** Resolve the same definition for form inputs and saved record labels. */
export function getLogbookField(category, key, subject) {
  return getLogbookGroups(category, subject).flatMap(group => group.fields).find(field => field.key === key) || FIELDS[key]
}
export const CATEGORIES = baseCategories.map(category => ({ ...category,
  fields: category.legacy ? category.fields : getLogbookGroups(category.id).filter(group => !group.locked).flatMap(group => group.fields.map(field => field.key)),
}))
/** Preserve a selected historical category even when it belongs to another subject. */
export function availableLogCategories(subject, selected = '') {
  return CATEGORIES.filter(category => category.id === selected || (!category.legacy && (!subject || !category.subjects || category.subjects.includes(subject))))
}

const subjectRows = [
  ['Human Anatomy', 'Anatomy', 'Phase I', 'AN'],
  ['Physiology', 'Physiology', 'Phase I', 'PY'],
  ['Biochemistry', 'Biochemistry', 'Phase I', 'BI'],
  ['Pathology', 'Pathology', 'Phase II', 'PA'],
  ['Microbiology', 'Microbiology', 'Phase II', 'MI'],
  ['Pharmacology', 'Pharmacology', 'Phase II', 'PH'],
  ['Forensic Medicine and Toxicology', 'Forensic Medicine and Toxicology', 'Phase II', 'FM'],
  ['Community Medicine', 'Community Medicine', 'Phase II', 'CM'],
  ['General Medicine', 'General Medicine', 'Phase III', 'IM'],
  ['General Surgery', 'General Surgery', 'Phase III', 'SU'],
  ['Obstetrics and Gynaecology', 'Obstetrics and Gynaecology', 'Phase III', 'OG'],
  ['Paediatrics', 'Paediatrics', 'Phase III', 'PE'],
  ['Ophthalmology', 'Ophthalmology', 'Phase III', 'OP'],
  ['Otorhinolaryngology (ENT)', 'Otorhinolaryngology (ENT)', 'Phase III', 'EN'],
  ['Orthopaedics', 'Orthopaedics', 'Phase III', 'OR'],
  ['Dermatology, Venereology and Leprosy', 'Dermatology, Venereology and Leprosy', 'Phase III', 'DR'],
  ['Psychiatry', 'Psychiatry', 'Phase III', 'PS'],
  ['Anaesthesiology', 'Anaesthesiology', 'Phase III', 'AS'],
  ['Radiology (Radio-diagnosis)', 'Radiology (Radio-diagnosis)', 'Phase III', 'RD'],
]
const sampleSkills = {
  AN: [{ code: 'AN1.2', name: 'Identify anatomical landmarks', required: 2 }, { code: 'AN1.5', name: 'Demonstrate upper limb anatomy', required: 2 }],
  PY: [{ code: 'PY2.7', name: 'Perform blood group determination', required: 2 }],
  PA: [{ code: 'PA2.1', name: 'Examine a peripheral blood smear', required: 2 }],
  CM: [{ code: 'CM3.1', name: 'Conduct a community health assessment', required: 2 }],
  IM: [{ code: 'IM1.1', name: 'Take a clinical history', required: 3 }, { code: 'IM1.2', name: 'Perform a general examination', required: 2 }],
  SU: [{ code: 'SU1.1', name: 'Demonstrate aseptic technique', required: 2 }],
}
export const SUBJECTS = subjectRows.map(([name, label, phase, code]) => ({
  name, label, phase, code,
  subtitle: { 'Phase I': 'Pre-clinical', 'Phase II': 'Para-clinical', 'Phase III': 'Clinical' }[phase],
  categories: CATEGORIES.filter((category) => (!category.legacy || name === 'Community Medicine') && (!category.subjects || category.subjects.includes(name))).map((category) => category.id),
  skills: sampleSkills[code] || [],
}))
export const subjectLabel = (name) => SUBJECTS.find((subject) => subject.name === name)?.label || name

/** Recent shortcuts come from saved records; never infer a user's selection. */
export function recentLogCategories(entries) {
  const ids = [...entries].sort((a, b) => (b.updatedAt || b.submittedAt || b.date || '').localeCompare(a.updatedAt || a.submittedAt || a.date || '')).map((entry) => entry.cat)
  return [...new Set(ids)].map((id) => CATEGORIES.find((category) => category.id === id && !category.legacy)).filter(Boolean).slice(0, 3)
}

/** Prepare a selection change without mutating form state; report only fields that would lose content. */
export function changeLogSelection(form, key, value) {
  const next = { ...form, [key]: value, fAck: false, values: { ...form.values } }
  const category = CATEGORIES.find((item) => item.id === next.cat)
  const retained = new Set(category?.legacy ? category.fields : getLogbookGroups(next.cat, next.subject).filter(group => !group.locked).flatMap(group => group.fields.map(field => field.key)))
  const removed = []
  for (const field of Object.keys(next.values)) {
    if (!retained.has(field) || (key === 'subject' && field === 'competency' && value !== form.subject)) {
      if (String(next.values[field] || '').trim()) removed.push(getLogbookField(form.cat, field, form.subject)?.label || field)
      delete next.values[field]
    }
  }
  return { form: next, removed }
}
