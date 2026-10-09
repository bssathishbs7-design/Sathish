import test from 'node:test'
import assert from 'node:assert/strict'
import { reserveAssessmentIdentity } from './assessmentIdentity.js'

const storageForTest = () => {
  const rows = new Map()
  return { getItem: key => rows.get(key) ?? null, setItem: (key, value) => rows.set(key, value) }
}
const allocate = (storage, date, options = {}) => reserveAssessmentIdentity({ storage, now: () => new Date(date), createId: () => 'test-uuid', locks: null, ...options })

test('allocates padded codes and persists the daily sequence', async () => {
  const storage = storageForTest()
  const first = await allocate(storage, '2026-10-08T08:00:00Z')
  assert.equal(first.assessmentCode, 'ASST1008001')
  assert.equal(first.assessmentId, 'assessment-test-uuid')
  assert.equal(first.createdAt, '2026-10-08T08:00:00.000Z')
  assert.equal((await allocate(storage, '2026-10-08T10:00:00Z')).assessmentCode, 'ASST1008002')
})

test('resets at India midnight and separates sequence storage by year', async () => {
  const storage = storageForTest()
  assert.equal((await allocate(storage, '2026-10-08T18:29:59Z')).assessmentCode, 'ASST1008001')
  assert.equal((await allocate(storage, '2026-10-08T18:30:00Z')).assessmentCode, 'ASST1009001')
  assert.equal((await allocate(storage, '2027-10-08T10:00:00Z')).assessmentCode, 'ASST1008001')
})

test('does not wrap an exhausted or corrupt sequence', async () => {
  const storage = storageForTest()
  storage.setItem('vx-assessment-daily-sequence:2026-10-08', '999')
  await assert.rejects(allocate(storage, '2026-10-08T08:00:00Z'), /999/)
  storage.setItem('vx-assessment-daily-sequence:2026-10-08', 'invalid')
  await assert.rejects(allocate(storage, '2026-10-08T08:00:00Z'), /could not be read/)
})

test('does not return an ID when reservation cannot be persisted', async () => {
  const storage = { getItem: () => null, setItem: () => { throw new Error('Storage full') } }
  await assert.rejects(allocate(storage, '2026-10-08T08:00:00Z'), /Storage full/)
})

test('uses a shared lock for concurrent tab reservations', async () => {
  const storage = storageForTest()
  const names = []
  let tail = Promise.resolve()
  const locks = { request(name, callback) { names.push(name); tail = tail.then(callback); return tail } }
  const rows = await Promise.all(Array.from({ length: 3 }, () => allocate(storage, '2026-10-08T08:00:00Z', { locks })))
  assert.deepEqual(rows.map(row => row.assessmentCode), ['ASST1008001', 'ASST1008002', 'ASST1008003'])
  assert.equal(new Set(names).size, 1)
})
