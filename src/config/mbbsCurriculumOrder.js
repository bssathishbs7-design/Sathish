/**
 * NMC CBME 2024 subject-goal sequence, grouped by professional phase.
 * Source: Guidelines for CBME Curriculum 2024, curriculum subject goals.
 * https://www.nmc.org.in/ActivitiWebClient/open/getDocument?path=%2FDocuments%2FPublic%2FPortal%2FLatestNews%2Forganized_compressed.pdf
 * This is a question-bank browsing order, not a clinical-posting timetable:
 * longitudinal teaching may span several phases. Aliases preserve legacy imports.
 * @type {Array<{phase: number, code: string, aliases: string[]}>}
 */
export const mbbsSubjectOrder = [
  { phase: 1, code: 'AN', aliases: ['Human Anatomy', 'Anatomy'] },
  { phase: 1, code: 'PY', aliases: ['Physiology'] },
  { phase: 1, code: 'BC', aliases: ['Biochemistry'] },
  { phase: 2, code: 'PA', aliases: ['Pathology'] },
  { phase: 2, code: 'MI', aliases: ['Microbiology'] },
  { phase: 2, code: 'PH', aliases: ['Pharmacology'] },
  { phase: 3, code: 'FM', aliases: ['Forensic Medicine & Toxico', 'Forensic Medicine and Toxicology', 'Forensic Medicine', 'FMT'] },
  { phase: 3, code: 'CM', aliases: ['Community Medicine', 'PSM', 'Preventive and Social Medicine'] },
  { phase: 3, code: 'EN', aliases: ['Otorhinolaryngology (ENT)', 'Otorhinolaryngology', 'Oto-rhinolaryngology', 'ENT'] },
  { phase: 3, code: 'OP', aliases: ['Ophthalmology'] },
  { phase: 4, code: 'IM', aliases: ['General Medicine', 'Internal Medicine', 'Medicine', 'GM'] },
  { phase: 4, code: 'PE', aliases: ['Pediatrics', 'Paediatrics'] },
  { phase: 4, code: 'DR', aliases: ['Dermatology, Venereology & Leprosy', 'Dermatology', 'DVL'] },
  { phase: 4, code: 'PS', aliases: ['Psychiatry'] },
  { phase: 4, code: 'SU', aliases: ['General Surgery', 'Surgery'] },
  { phase: 4, code: 'OG', aliases: ['Obstetrics & Gynaecology', 'Obstetrics and Gynecology', 'OBG', 'OBGYN'] },
  { phase: 4, code: 'OR', aliases: ['Orthopedics', 'Orthopaedics'] },
  { phase: 4, code: 'AS', aliases: ['Anaesthesiology', 'Anesthesiology', 'Anaesthesia', 'Anesthesia'] },
  { phase: 4, code: 'RD', aliases: ['Radiodiagnosis', 'Radio-diagnosis', 'Radiology'] },
]
