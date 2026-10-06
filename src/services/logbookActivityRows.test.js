import test from 'node:test'
import assert from 'node:assert/strict'
import { logbookActivityRows } from './logbookActivityRows.js'
import { latestEntryEvent } from './logbookDates.js'

const row = (attemptNumber, status, patch = {}) => ({ id: `attempt-${attemptNumber}`, source: 'skills', sourceAssignmentId: 'assignment-1', sourceActivityId: 'activity-1', studentId: 'MC2568', subject: 'Pathology', cat: 'cert', attemptNumber, status, date: '2026-10-06', values: { activity: 'Test 1' }, ...patch })

test('Repeat, Repeat, To do becomes one current row without deleting attempt history', () => {
  const entries = [row(1, 'Repeat'), row(2, 'Repeat'), row(3, 'To do')]
  const original = JSON.stringify(entries)
  assert.deepEqual(logbookActivityRows(entries).map(item => [item.id, item.status, item.attemptNumber]), [['attempt-3', 'To do', 3]])
  assert.equal(JSON.stringify(entries), original)
  assert.deepEqual(logbookActivityRows([...entries].reverse()).map(item => item.id), ['attempt-3'])
})
test('group identity keeps students, subjects, assignments and unrelated equal titles separate', () => {
  const entries = [row(1, 'Repeat'), row(2, 'To do'), row(1, 'To do', { id: 'student-2', studentId: 'MC2569' }), row(1, 'To do', { id: 'subject-2', subject: 'Physiology' }), row(1, 'To do', { id: 'assignment-2', sourceAssignmentId: 'assignment-2' }), row(1, 'Pending', { id: 'manual', source: undefined })]
  assert.equal(logbookActivityRows(entries).length, 5)
})
test('latest activity date includes a later correction to a historical attempt while status stays current', () => {
  const grouped = logbookActivityRows([row(1, 'Repeat', { verifiedAt: '2026-10-08T10:00:00Z' }), row(2, 'To do')])
  assert.equal(grouped[0].status, 'To do')
  assert.equal(latestEntryEvent(grouped[0]), '2026-10-08T10:00:00Z')
  assert.equal(grouped.filter(item => item.status === 'Repeat').length, 0)
})
test('replayed attempt records do not add rows and incomplete identities do not merge by title', () => {
  const first = row(1, 'Repeat')
  assert.equal(logbookActivityRows([first, first, row(2, 'To do')]).length, 1)
  assert.equal(logbookActivityRows([row(1, 'To do', { sourceAssignmentId: undefined }), row(2, 'To do', { sourceAssignmentId: undefined })]).length, 2)
})
