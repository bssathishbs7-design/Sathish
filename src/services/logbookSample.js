/** Sample curriculum only. Replace catalogues and requirements with institution API data. */
export const FACULTY = [
  { id: 'RM', name: 'Dr R. Menon' },
  { id: 'AS', name: 'Dr A. Sharma' },
  { id: 'PK', name: 'Dr P. Kumar' },
]
export { CATEGORIES, FIELDS, SUBJECTS } from './logbookCatalog.js'
export const STUDENT = { name: 'Karthik Subramanian', registerId: 'MC2568', programme: 'MBBS', batch: '2024–2029', postingEnd: '2026-10-15', posting: 'General Medicine' }

export const SAMPLE_ENTRIES = [
  ['an-1', 'Human Anatomy', 'cert', '2026-09-14', 'Approved', 'RM', { competency: 'AN1.2', activity: 'Identify anatomical landmarks', reflection: 'Identified the major surface landmarks independently.' }],
  ['an-2', 'Human Anatomy', 'cert', '2026-09-16', 'Approved', 'RM', { competency: 'AN1.2', activity: 'Identify anatomical landmarks', reflection: 'Repeated the demonstration with consistent identification.' }],
  ['py-1', 'Physiology', 'cert', '2026-09-17', 'Pending', 'AS', { competency: 'PY2.7', activity: 'Blood group determination', reflection: 'Practised interpreting agglutination results.' }],
  ['im-1', 'General Medicine', 'cert', '2026-09-18', 'Returned', 'RM', { competency: 'IM1.1', activity: 'Take a clinical history', reflection: 'Completed a supervised clinical history.' }],
  ['im-2', 'General Medicine', 'ccp', '2026-09-19', 'Pending', 'RM', { topic: 'Respiratory assessment', patientId: 'DEMO-042', diagnosis: 'Respiratory case discussion', admission: '2026-09-18', reflection: 'Presented the history and examination findings.' }],
  ['su-1', 'General Surgery', 'proc', '2026-09-20', 'Draft', '', { activity: 'Aseptic dressing technique', reflection: '' }],
  ['cm-1', 'Community Medicine', 'community', '2026-09-15', 'Approved', 'PK', { topic: 'Community health visit', village: 'Sample community', reflection: 'Documented household health needs and follow-up priorities.' }],
  ['pa-1', 'Pathology', 'cert', '2026-09-21', 'Pending', 'AS', { competency: 'PA2.1', activity: 'Peripheral blood smear examination', reflection: 'Identified the major cell types under supervision.' }],
].map(([id, subject, cat, date, status, faculty, values], index) => ({
  id, subject, cat, date, status, faculty, values: { recordGroup: 'Practical record', serial: String(index + 1), ...values },
  extra: { notes: '', remarks: '', attachments: [], comments: [], ...(status === 'Returned' ? { facultyRemarks: 'Repeat the history with a clearer chronology and include relevant negative findings.' } : {}) },
}))
