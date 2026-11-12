import test from 'node:test'
import assert from 'node:assert/strict'
import { assignEntries, assignSampleEntries, previewSampleAssignments, REVIEWERS } from './adminLogbook.js'
import { assignmentSamples, recommendedAssignmentSamples, assignmentCategory } from './logbookAssignmentSamples.js'
import { listLogbookEntries, readDeltas, STORAGE_KEY } from './logbook.js'
import { LEARNERS, learnerName } from './logbookPeople.js'
const actor = REVIEWERS.find(person => person.id === 'SUPER-ADMIN')
const scope = { assignBatch: '2026', assignYear: 'First Year', assignGroups: ['SGT Group A'], assignStudentIds: ['directory-a', 'directory-b'] }
const load = async () => ({ students: ['a', 'b', 'c'].map(id => ({ id: 'directory-' + id, registrationId: 'REG-' + id, name: 'Learner ' + id, batch: id === 'c' ? '2025' : '2026', year: 'First Year', section: 'A', status: 'Active' })) })
async function storage(run) {
  const oldWindow = globalThis.window, data = new Map(), original = [...LEARNERS]
  globalThis.window = { localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }, dispatchEvent() {} }
  try { await run(data) } finally { globalThis.window = oldWindow; LEARNERS.splice(0, LEARNERS.length, ...original) }
}
const activity = assignmentSamples('ece', 'Human Anatomy', 'Phase I')[0]
const request = { recipientScope: scope, subject: activity.subject, phase: activity.phase, activityId: activity.id, cat: assignmentCategory(activity.category), instructions: 'Complete this activity.' }
test('directory assignments preserve stable identity, names and subject-lock exclusions after reload', async () => storage(async data => {
  data.set(STORAGE_KEY, JSON.stringify({ added: [], edits: {}, removed: [], workflow: { signoffs: { 'directory-b:Human Anatomy': { studentId: 'directory-b', subject: 'Human Anatomy', status: 'Completed' } } } }))
  const result = await assignEntries(actor, request, load)
  assert.equal(result.assigned, 1); assert.equal(result.locked, 1)
  const added = readDeltas().added
  assert.equal(added[0].studentId, 'directory-a'); assert.equal(added[0].studentProfile.registerId, 'REG-a')
  LEARNERS.splice(0, LEARNERS.length, ...LEARNERS.filter(person => !person.directoryStudent))
  await listLogbookEntries(); assert.equal(learnerName('directory-a'), 'Learner a')
  assert.ok(LEARNERS.some(person => person.id === 'MC2568'))
}))
test('sample preview is read-only, saves selected IDs atomically and rejects cross-batch/stale requests', async () => storage(async data => {
  const batch = { recipientScope: scope, activityIds: recommendedAssignmentSamples('Human Anatomy', 'Phase I').map(row => row.id) }
  const preview = await previewSampleAssignments(actor, batch, load)
  assert.ok(preview.assigned > 0); assert.equal(data.has(STORAGE_KEY), false)
  await assignSampleEntries(actor, batch, load)
  assert.deepEqual([...new Set(readDeltas().added.map(row => row.studentId))].sort(), ['directory-a','directory-b'])
  const before = data.get(STORAGE_KEY)
  await assert.rejects(assignSampleEntries(actor, { ...batch, recipientScope: { ...scope, assignStudentIds: ['directory-c'] } }, load), /no longer match/)
  assert.equal(data.get(STORAGE_KEY), before)
  await assert.rejects(assignEntries(actor, { ...request, recipientScope: { ...scope, assignStudentIds: [] } }, load), /at least one student/)
  assert.equal(data.get(STORAGE_KEY), before)
  await assert.rejects(assignSampleEntries(actor, batch, load), /No new eligible assignments/)
}))
test('manual tasks support directory recipients without changing legacy sample cohort', async () => storage(async () => {
  const result = await assignEntries(actor, { recipientScope: scope, subject: 'Human Anatomy', cat: 'ece', instructions: 'Read and reflect.' }, load)
  assert.equal(result.assigned, 2)
  const legacy = await assignEntries(actor, { studentId: 'all', subject: 'Human Anatomy', cat: 'ece', instructions: 'Legacy task.' })
  assert.equal(legacy.assigned, 3)
}))
