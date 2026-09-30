import test from 'node:test'
import assert from 'node:assert/strict'
import { awaitingRemedial, matchesRemedial } from './logbookPeople.js'
import { collectSkills, certificationTarget } from './logbookProgress.js'
import { skillProgress, saveLogbookEntry, STORAGE_KEY } from './logbook.js'
import { SUBJECTS } from './logbookCatalog.js'
import { inLastDays, latestEntryEvent } from './logbookDates.js'
import { getLogbookScenario } from './logbookScenarios.js'

const parent = { id: 'returned', studentId: 'MC2568', subject: 'General Medicine', cat: 'cert', status: 'Returned', faculty: 'RM', date: '2026-09-20', values: { competency: 'IM1.1', activity: 'Clinical history' }, extra: {} }
const child = { ...parent, id: 'repeat', status: 'Pending', linkedTo: parent.id }
test('a different competency, owner or subject cannot resolve a returned competency', () => {
  for (const patch of [{ values: { competency: 'IM1.2' } }, { studentId: 'MC2569' }, { subject: 'Human Anatomy' }, { cat: 'skill' }]) {
    assert.equal(matchesRemedial(parent, { ...child, ...patch }), false)
    assert.equal(awaitingRemedial(parent, [parent, { ...child, ...patch }]), true)
  }
  assert.equal(awaitingRemedial(parent, [parent, child]), false)
  assert.equal(awaitingRemedial(parent, [parent, { ...child, status: 'Draft' }]), true)
})
test('entry values never redefine catalogue targets for the learner or peers', () => {
  const rows = [{ ...parent, status: 'Draft', values: { competency: 'IM1.1', numReq: '99' } }, { ...child, studentId: 'MC2569', status: 'Approved', values: { competency: 'IM1.1', numReq: '999' } }]
  const subject = SUBJECTS.find(item => item.name === parent.subject)
  assert.equal(collectSkills(parent.subject, rows)[0].required, 3)
  assert.equal(skillProgress(rows.filter(item => item.studentId === 'MC2569'), subject)[0].required, 3)
  assert.equal(certificationTarget(parent.subject, 'UNCONFIGURED'), 0)
})
test('remedial mutation rejects mismatches and saves authoritative targets', async () => {
  const previous = globalThis.window, data = new Map([[STORAGE_KEY, JSON.stringify({ added: [parent], edits: {}, removed: [] })]])
  globalThis.window = { localStorage: { getItem: key => data.get(key), setItem: (key,value) => data.set(key,value) }, dispatchEvent() {} }
  try {
    await assert.rejects(saveLogbookEntry({ ...child, status: 'Draft', values: { competency: 'IM1.2' } }), /original competency/)
    const saved = await saveLogbookEntry({ ...child, status: 'Draft', values: { ...child.values, numReq: '99' } })
    assert.equal(saved.find(item => item.id === child.id).values.numReq, '3')
    assert.equal(saved.find(item => item.id === child.id).requirementsVersion, 'sample-catalogue-v1')
  } finally { globalThis.window = previous }
})
test('calendar windows include six preceding days and recent activity includes comments and reviews', () => {
  const now = new Date(2026, 8, 29, 12)
  assert.equal(inLastDays('2026-09-23', 7, now), true)
  assert.equal(inLastDays('2026-09-22', 7, now), false)
  assert.equal(inLastDays('2026-09-30', 7, now), false)
  assert.equal(latestEntryEvent({ date: '2026-09-20', verifiedAt: '2026-09-25T10:00:00Z', extra: { comments: [{ date: '2026-09-26T10:00:00Z' }] } }), '2026-09-26T10:00:00Z')
})
test('deterministic QA fixtures cover assignments, every approval stage, scale and failure', async () => {
  const handoff = await getLogbookScenario()
  assert.ok(handoff.entries.some(entry => entry.status === 'To do'))
  assert.deepEqual(new Set(Object.values(handoff.workflow.signoffs).map(record => record.status)), new Set(['Ready','Returned','Submitted','Completed']))
  assert.equal((await getLogbookScenario('empty')).entries.length, 0)
  assert.equal((await getLogbookScenario('large')).entries.length, handoff.entries.length + 1000)
  await assert.rejects(getLogbookScenario('error'), /unavailable/)
  handoff.entries.length = 0
  assert.ok((await getLogbookScenario()).entries.length > 0)
})
