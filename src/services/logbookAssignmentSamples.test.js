import test from 'node:test'
import assert from 'node:assert/strict'
import { assignmentSamples, assignmentPhases, assignmentCategories, recommendedAssignmentSamples, LOGBOOK_CATALOGUE, assignmentCategory } from './logbookAssignmentSamples.js'
import { assignEntries, assignSampleEntries, previewSampleAssignments, REVIEWERS, cancelAssignment } from './adminLogbook.js'
import { readDeltas, STORAGE_KEY, saveLogbookEntry, listLogbookEntries, today } from './logbook.js'

const actor = REVIEWERS.find(person => person.id === 'SUPER-ADMIN')
async function withStorage(run) {
  const previous = globalThis.window, data = new Map()
  globalThis.window = { localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }, dispatchEvent: () => {} }
  try { await run(data) } finally { globalThis.window = previous }
}
const sourceRequest = activity => ({ activityId: activity.id, subject: activity.subject, phase: activity.phase, cat: assignmentCategory(activity.category), studentId: 'MC2568', instructions: 'Complete this activity.' })

test('document catalogue retains departmental categories, posting phases and duplicate codes', () => {
  assert.equal(LOGBOOK_CATALOGUE.sources.length, 20)
  assert.equal(new Set(LOGBOOK_CATALOGUE.sources.map(row => row.subject)).size, 18)
  assert.deepEqual(assignmentPhases('Forensic Medicine and Toxicology'), [])
  assert.deepEqual(assignmentPhases('Community Medicine'), ['Phase I', 'Phase II', 'Phase III Part 1'])
  assert.deepEqual(assignmentCategories('Community Medicine', 'Phase I').map(row => row.id), ['fap'])
  assert.equal(assignmentSamples('ece', 'Human Anatomy', 'Phase I').length, 5)
  assert.equal(assignmentSamples('ece', 'Physiology', 'Phase I').length, 3)
  assert.equal(assignmentSamples('ece', 'Biochemistry', 'Phase I').length, 5)
  assert.equal(assignmentSamples('ece', 'General Surgery').length, 0)
  assert.deepEqual(assignmentSamples('aetcom', 'Pathology').map(row => row.code), ['2.4 A', '2.4 B', '2.7'])
  const biochemistry = assignmentSamples('aetcom', 'Biochemistry')
  assert.deepEqual(biochemistry.map(row => row.code), ['1.1', '1.1'])
  assert.equal(new Set(biochemistry.map(row => row.id)).size, 2)
  assert.equal(new Set(LOGBOOK_CATALOGUE.activities.map(row => row.id)).size, LOGBOOK_CATALOGUE.activities.length)
  assert.ok(LOGBOOK_CATALOGUE.activities.every(row => row.sources.length))
  assert.equal(assignmentSamples('clerkship', 'Orthopaedics').length, 2, 'A skills table after a phase heading must not be a clerkship activity')
  assert.equal(assignmentSamples('aetcom', 'Pharmacology').length, 3, 'Reflection tables must not produce extra sample activities')
})

test('source topics without codes and blank templates are distinguished without fabricating codes', () => {
  assert.ok(assignmentSamples('vertical', 'Otorhinolaryngology (ENT)').every(row => !row.code && !row.sample))
  assert.ok(assignmentSamples('sdl', 'General Medicine').every(row => !row.code && row.sample))
  assert.deepEqual(assignmentSamples('skill', 'Human Anatomy'), [])
  assert.deepEqual(assignmentSamples('cert', 'Human Anatomy'), [])
})

test('all assignable document activities save as To do, with stable provenance and no completion data', async () => withStorage(async () => {
  const rows = LOGBOOK_CATALOGUE.activities.filter(row => !['skill', 'cert', 'remedial'].includes(row.category))
  for (const activity of rows) {
    const result = await assignEntries(actor, sourceRequest(activity))
    const entry = result.entries.find(row => row.assignment?.activityId === activity.id)
    assert.equal(entry.status, 'To do')
    assert.equal(entry.date, '', 'A new assignment does not imply a completion date')
    assert.equal(entry.assignment.phase, activity.phase)
    assert.equal(entry.assignment.sourceCategory, activity.category)
    assert.equal(entry.assignment.sample, activity.sample)
    assert.ok(!entry.grading && !entry.verifiedAt && !entry.submittedAt)
    assert.ok(!['date', 'patientId', 'ageGender', 'admission', 'discharge', 'q1', 'r1'].some(key => key in entry.values))
  }
  assert.equal(readDeltas().added.length, rows.length)
}))

test('preview does not save, batch skips duplicates and locked subjects, repeat is idempotent', async () => withStorage(async data => {
  const activities = recommendedAssignmentSamples('Human Anatomy', 'Phase I')
  const request = { activityIds: activities.map(row => row.id), studentId: 'all', due: today(), instructions: 'Complete before the review meeting.' }
  const before = data.get(STORAGE_KEY)
  const preview = await previewSampleAssignments(actor, request)
  assert.equal(preview.assigned, 18)
  assert.equal(data.get(STORAGE_KEY), before)
  // The subject became locked after preview: recheck at commit time.
  data.set(STORAGE_KEY, JSON.stringify({ added: [], edits: {}, removed: [], workflow: { signoffs: { 'MC2568:Human Anatomy': { status: 'Submitted' } } } }))
  const result = await assignSampleEntries(actor, request)
  assert.equal(result.assigned, 12)
  assert.equal(result.skipped, 6)
  assert.equal(readDeltas().added.length, 12)
  assert.ok(readDeltas().added.every(row => row.assignment.due === today() && row.assignment.instructions === request.instructions))
  const repeated = await previewSampleAssignments(actor, request)
  assert.equal(repeated.assigned, 0)
  assert.equal(repeated.skipped, 18)
  await assert.rejects(assignSampleEntries(actor, request), /No new eligible/)
  assert.equal(readDeltas().added.length, 12)
}))

test('invalid or unauthorised batches do not save partial work; source requests cannot cross subject or phase', async () => withStorage(async data => {
  const a = assignmentSamples('ece', 'Human Anatomy')[0], b = assignmentSamples('ece', 'Biochemistry')[0]
  await assert.rejects(assignSampleEntries(REVIEWERS[0], { activityIds: [a.id, b.id], studentId: 'all' }), /department/)
  assert.equal(data.has(STORAGE_KEY), false)
  await assert.rejects(assignEntries(actor, { ...sourceRequest(a), phase: 'Phase II' }), /subject and phase/)
  await assert.rejects(assignEntries(actor, { ...sourceRequest(a), subject: 'Biochemistry' }), /subject and phase/)
  await assert.rejects(assignSampleEntries(actor, { activityIds: [a.id, 'invalid'], studentId: 'all' }), /no longer available/)
  await assert.rejects(assignSampleEntries(actor, { activityIds: [a.id, a.id], studentId: 'all' }), /only once/)
  const skill = LOGBOOK_CATALOGUE.activities.find(row => row.category === 'skill')
  await assert.rejects(assignSampleEntries(actor, { activityIds: [skill.id], studentId: 'all' }), /no longer available/)
  assert.equal(data.has(STORAGE_KEY), false)
}))

test('duplicate-code topics can both be assigned; cancelled tasks may be assigned again', async () => withStorage(async () => {
  const rows = assignmentSamples('aetcom', 'Biochemistry')
  for (const row of rows) await assignEntries(actor, sourceRequest(row))
  assert.equal(readDeltas().added.length, 2)
  await assert.rejects(assignEntries(actor, sourceRequest(rows[0])), /already assigned/)
  const task = readDeltas().added.find(row => row.assignment.activityId === rows[0].id)
  await cancelAssignment(task.id, actor)
  await assignEntries(actor, sourceRequest(rows[0]))
  assert.equal((await listLogbookEntries()).filter(row => row.assignment?.activityId === rows[0].id).length, 1)
}))

test('source code and topic remain locked while a learner completes the assignment', async () => withStorage(async () => {
  const activity = assignmentSamples('ece', 'Human Anatomy')[0]
  await assignEntries(actor, sourceRequest(activity))
  const task = readDeltas().added[0]
  await assert.rejects(saveLogbookEntry({ ...task, values: { ...task.values, topic: 'Changed topic' } }), /locked|assigned|Faculty/i)
  await saveLogbookEntry({ ...task, values: { ...task.values, date: '2026-10-29' }, extra: { notes: 'Learner draft' } })
  assert.equal((await listLogbookEntries()).find(row => row.id === task.id).assignment.activityId, activity.id)
}))
