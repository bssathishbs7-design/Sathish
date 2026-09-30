import { SAMPLE_ENTRIES, COHORT_ENTRIES } from './logbookSample.js'

/** Deterministic fixtures for service/browser QA. They never overwrite user storage.
 * An API test adapter can return this shape directly, including explicit failures.
 * @param {'handoff'|'empty'|'large'|'error'} name
 * @returns {Promise<{entries:Object[],workflow:Object}>}
 */
export async function getLogbookScenario(name = 'handoff') {
  if (name === 'error') throw new Error('The test Logbook service is unavailable. Retry when the connection is restored.')
  const chain = ['HOD', 'DEAN', 'DIRECTOR']
  const workflow = { chain, chains: {}, signoffs: {} }
  if (name === 'empty') return { entries: [], workflow }
  const entries = structuredClone([...SAMPLE_ENTRIES, ...COHORT_ENTRIES])
  entries.push({ id: 'scenario-assignment', studentId: 'MC2568', subject: 'Human Anatomy', cat: 'skill', faculty: 'RM', date: '2026-09-26', status: 'To do', values: { competency: 'AN1.5', activity: 'Identify upper limb landmarks' }, extra: {}, assignment: { by: 'RM', due: '2026-10-15', instructions: 'Identify landmarks under supervision and record your reflection.', locked: ['competency', 'activity'], assignedAt: '2026-09-26T08:00:00Z' } })
  for (const [subject, status, step] of [['Community Medicine','Ready',0], ['Pathology','Returned',0], ['Physiology','Submitted',0], ['General Surgery','Submitted',1], ['Ophthalmology','Submitted',2], ['Biochemistry','Completed',3]]) {
    workflow.signoffs[`MC2568:${subject}`] = { studentId: 'MC2568', subject, status, step, chain: [...chain], history: [{ actor: 'HOD', action: 'ready', at: '2026-09-25T08:00:00Z', remarks: '' }], remarks: status === 'Returned' ? 'Clarify the evidence before resubmitting.' : '', ...(status === 'Completed' ? { completedAt: '2026-09-26T08:00:00Z' } : {}) }
  }
  if (name === 'large') for (let index = 0; index < 1000; index++) entries.push({ ...structuredClone(entries[0]), id: `volume-${index}`, values: { ...entries[0].values, activity: `Clinical evidence record ${index + 1}` } })
  return { entries, workflow }
}
