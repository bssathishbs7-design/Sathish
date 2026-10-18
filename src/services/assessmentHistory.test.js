import test from 'node:test'
import assert from 'node:assert/strict'
import { appendAssessmentHistory, readAssessmentHistory, assessmentDisplayId } from './assessmentHistory.js'
const storage = () => { const data = new Map(); return { getItem: key => data.get(key) || null, setItem: (key,value) => data.set(key,value) } }
test('assessment identity and history survive approval and publishing record changes', () => {
 const store = storage()
 const draft = { id: 'draft-1', setup: { assessmentId: 'exam-1', assessmentCode: 'ASST1017001' } }
 const approval = { id: 'approval-1', activityId: 'other-id', setup: draft.setup }
 appendAssessmentHistory(draft, { id: 'save', action: 'Draft saved', timestamp: '2026-10-17T09:00:00Z' }, store)
 appendAssessmentHistory(approval, { id: 'approval', action: 'Approved', timestamp: '2026-10-17T10:00:00Z' }, store)
 appendAssessmentHistory(approval, { id: 'approval', action: 'Approved', timestamp: '2026-10-17T10:00:00Z' }, store)
 assert.equal(assessmentDisplayId(approval), 'ASST1017001')
 assert.deepEqual(readAssessmentHistory({ id: 'exam-1' }, store).map(row => row.action), ['Approved','Draft saved'])
 assert.equal(readAssessmentHistory({ id: 'different' }, store).length, 0)
})
test('legacy records show only evidenced events and preserve repeated edits', () => {
 const store = storage(), record = { id: 'exam' }
 assert.deepEqual(readAssessmentHistory(record, store), [])
 for (const id of ['one','two']) appendAssessmentHistory(record, { id, action: 'Evaluation updated', timestamp: id === 'one' ? '2026-10-17T09:00:00Z' : '2026-10-17T10:00:00Z' }, store)
 assert.equal(readAssessmentHistory(record, store).length, 2)
 assert.equal(readAssessmentHistory({ ...record, publishedLog: [{ timestamp:'2026-10-17T11:00:00Z', remarks:'Assessment published' }] }, store)[0].action, 'Assessment published')
})
