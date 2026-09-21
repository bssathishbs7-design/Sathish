import test from 'node:test'
import assert from 'node:assert/strict'
import { applyDeltas, readDeltas, saveLogbookEntry, searchEntries, skillProgress, STORAGE_KEY, subjectProgress, updateLogbookEntry, validateEntry } from './logbook.js'
import { SUBJECTS } from './logbookSample.js'

const entry = (patch = {}) => ({ id: 'test-entry', subject: 'Human Anatomy', cat: 'cert', date: '2026-01-02', status: 'Draft', faculty: 'RM', fAck: true, values: { recordGroup: 'Practical', serial: '1', competency: 'AN1.2', activity: 'Landmarks', reflection: 'Completed independently.' }, extra: { comments: [] }, ...patch })
const empty = () => ({ added: [], edits: {}, removed: [] })

test('drafts permit incomplete fields but reject invalid and future dates', () => {
  assert.deepEqual(validateEntry(entry({ date: '', values: {}, faculty: '' })), {})
  assert.ok(validateEntry(entry({ date: '2026-02-30' })).date)
  assert.ok(validateEntry(entry({ date: '2099-01-01' })).date)
  assert.ok(validateEntry(entry({ cat: 'community' })).cat)
})
test('submission validates serial, dates, competency, faculty and learner acknowledgement', () => {
  assert.deepEqual(validateEntry(entry(), true), {})
  const invalid = entry({ fAck: false, faculty: '', values: { serial: '-1', competency: '', admission: '2026-01-03', discharge: '2026-01-02' } })
  const errors = validateEntry(invalid, true)
  for (const key of ['competency', 'activity', 'faculty', 'fAck']) assert.ok(errors[key], key)
  assert.equal(errors.discharge, undefined, 'Inactive category fields must not block submission')
  assert.ok(validateEntry({ ...invalid, cat: 'clerkship' }, true).discharge)
  assert.ok(validateEntry(entry({ cat: 'clerkship', values: { admission: '2099-01-01' } })).admission)
})
test('reconciliation preserves seed fields, applies nested edits and removes both added and seed IDs', () => {
  const seed = entry()
  const deltas = { added: [entry({ id: 'new' })], edits: { 'test-entry': { values: { activity: 'Updated' }, extra: { notes: 'Retained' } } }, removed: ['new'] }
  const rows = applyDeltas(deltas, [seed])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].values.competency, 'AN1.2')
  assert.equal(rows[0].values.activity, 'Updated')
  assert.equal(rows[0].extra.notes, 'Retained')
})
test('only matching approved competency attempts count and progress caps each requirement', () => {
  const rows = ['Draft', 'Pending', 'Returned', 'Approved', 'Approved', 'Approved'].map((status, index) => entry({ id: String(index), status }))
  rows.push(entry({ id: 'wrong-cat', cat: 'proc', status: 'Approved' }))
  assert.equal(skillProgress(rows, SUBJECTS[0])[0].approved, 3)
  assert.equal(subjectProgress(rows, SUBJECTS[0]).approved, 2)
  assert.equal(subjectProgress(rows, SUBJECTS[0]).percent, 50)
})
test('search indexes faculty, patient references, personal notes and comments', () => {
  const row = entry({ values: { patientId: 'DEMO-042', diagnosis: 'Respiratory' }, extra: { notes: 'Chronology', comments: [{ text: 'Follow up' }] } })
  for (const query of ['menon', 'demo-042', 'chronology', 'follow up', 'respiratory menon']) assert.equal(searchEntries([row], query).length, 1)
  assert.equal(searchEntries([row], 'unmatched').length, 0)
})
test('malformed storage is retained and reported instead of silently resetting', () => {
  assert.throws(() => readDeltas({ getItem: () => '{bad' }))
  assert.throws(() => readDeltas({ getItem: () => '{"added":{}}' }))
})
test('service lifecycle retains links, locks approved records, appends comments and honours withdrawal', async () => {
  const store = new Map()
  const storage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) }
  const previous = globalThis.window
  globalThis.window = { localStorage: storage, dispatchEvent: () => {} }
  try {
    await saveLogbookEntry(entry(), true)
    assert.equal(applyDeltas(readDeltas())[0].status, 'Pending')
    await updateLogbookEntry('test-entry', 'review', { status: 'Returned', remarks: 'Repeat the attempt.' })
    await assert.rejects(saveLogbookEntry(entry(), true), /already been reviewed/)
    await saveLogbookEntry(entry({ id: 'remedial', linkedTo: 'test-entry' }), true)
    await assert.rejects(saveLogbookEntry(entry({ id: 'duplicate', linkedTo: 'test-entry' }), true), /already exists/)
    await updateLogbookEntry('remedial', 'review', { status: 'Approved' })
    await assert.rejects(updateLogbookEntry('remedial', 'withdraw'), /Only drafts/)
    await updateLogbookEntry('remedial', 'notes', { text: 'Independent note' })
    await updateLogbookEntry('remedial', 'comment', { text: 'First' })
    await updateLogbookEntry('remedial', 'comment', { text: 'Second', by: 'faculty' })
    const signed = applyDeltas(readDeltas()).find((row) => row.id === 'remedial')
    assert.equal(signed.extra.comments.length, 2)
    assert.equal(signed.extra.notes, 'Independent note')
    assert.equal(signed.linkedTo, 'test-entry')
    await saveLogbookEntry(entry({ id: 'withdraw-me' }), true)
    await updateLogbookEntry('withdraw-me', 'withdraw')
    assert.ok(!applyDeltas(readDeltas()).some((row) => row.id === 'withdraw-me'))
    await assert.rejects(saveLogbookEntry(entry({ id: 'withdraw-me' }), true), /has been withdrawn/)
    storage.setItem(STORAGE_KEY, JSON.stringify(empty()))
    storage.setItem = () => { throw new Error('quota') }
    await assert.rejects(saveLogbookEntry(entry(), true), /Unable to save/)
  } finally { globalThis.window = previous }
})
