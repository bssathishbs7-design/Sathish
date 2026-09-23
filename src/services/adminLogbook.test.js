import test from 'node:test'
import assert from 'node:assert/strict'
import { assignEntries, cancelAssignment, changeSignoff, getLogbookWorkflow, reassignEntry, REVIEWERS, reviewEntries, saveApprovalChain } from './adminLogbook.js'
import { listLogbookEntries, readDeltas, saveLogbookEntry, STORAGE_KEY, today } from './logbook.js'

test('faculty review, assignments and sign-off lifecycle enforce ownership and preserve records', async () => {
  const previous = globalThis.window, data = new Map()
  globalThis.window = { localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }, dispatchEvent: () => {} }
  const rm = REVIEWERS[0], as = REVIEWERS[1], pk = REVIEWERS[2], hod = REVIEWERS.find(person => person.id === 'HOD'), dean = REVIEWERS.find(person => person.id === 'DEAN'), director = REVIEWERS.find(person => person.id === 'DIRECTOR')
  try {
    await assert.rejects(reviewEntries(['im-2'], as, { status: 'Approved' }), /assigned/)
    await assert.rejects(reviewEntries(['im-2'], rm, { status: 'Returned' }), /feedback/)
    await assert.rejects(reviewEntries(['cohort-2'], rm, { status: 'Approved' }), /attempt and rating/)
    await assert.rejects(reviewEntries(['im-2', 'cohort-2'], rm, { status: 'Approved' }), /individually/)
    assert.equal((await listLogbookEntries()).find(entry => entry.id === 'im-2').status, 'Pending', 'Failed bulk review is atomic')
    await reassignEntry('im-2', rm, 'PK')
    await assert.rejects(reviewEntries(['im-2'], rm, { status: 'Approved' }), /assigned/)
    await reviewEntries(['im-2'], pk, { status: 'Approved' })
    await reviewEntries(['cohort-2'], rm, { status: 'Returned', attempt: 'F', rating: 'B', remarks: 'Repeat with supervision.', decision: 'Re' })
    const reviewed = (await listLogbookEntries()).find(entry => entry.id === 'cohort-2')
    assert.equal(reviewed.grading.decision, 'Re'); assert.equal(reviewed.audit[0].actor, 'RM')
    const assignment = { studentId: 'MC2568', subject: 'Human Anatomy', cat: 'cert', due: today(), instructions: 'Identify anatomical landmarks.' }
    await assignEntries(rm, assignment)
    let task = (await listLogbookEntries()).find(entry => entry.assignment)
    await assert.rejects(cancelAssignment(task.id, pk), /Only your/)
    await assert.rejects(saveLogbookEntry({ ...task, faculty: 'AS' }), /assigned/)
    await saveLogbookEntry({ ...task, values: { serial: '1', competency: 'AN1.2', activity: 'Identify anatomical landmarks' }, fAck: true }, true)
    task = (await listLogbookEntries()).find(entry => entry.id === task.id)
    assert.equal(task.status, 'Pending'); assert.equal(task.assignment.by, 'RM')
    await assert.rejects(cancelAssignment(task.id, rm), /unsubmitted/)
    await assert.rejects(changeSignoff({ studentId: 'MC2568', subject: 'Human Anatomy', action: 'ready', actor: rm }), /Clear pending/)
    await reviewEntries([task.id], rm, { status: 'Approved', attempt: 'F', rating: 'M' })
    const request = { studentId: 'MC2568', subject: 'Human Anatomy' }
    await changeSignoff({ ...request, action: 'ready', actor: rm })
    await changeSignoff({ ...request, action: 'submit' })
    await saveApprovalChain(['DEAN'])
    let record = (await getLogbookWorkflow()).signoffs['MC2568:Human Anatomy']
    assert.deepEqual(record.chain, ['HOD', 'DEAN', 'DIRECTOR'], 'In-flight chain is retained')
    await assert.rejects(changeSignoff({ ...request, action: 'approve', actor: dean }), /signature/)
    await assert.rejects(changeSignoff({ ...request, action: 'return', actor: hod }), /reason/)
    await changeSignoff({ ...request, action: 'approve', actor: hod })
    await changeSignoff({ ...request, action: 'approve', actor: dean })
    await changeSignoff({ ...request, action: 'return', actor: director, remarks: 'Clarify reflection.' })
    await changeSignoff({ ...request, action: 'submit' })
    await changeSignoff({ ...request, action: 'approve', actor: dean })
    record = (await getLogbookWorkflow()).signoffs['MC2568:Human Anatomy']
    assert.equal(record.status, 'Completed'); assert.equal(record.history.length, 7)
    await assignEntries(rm, { ...assignment, studentId: 'all' })
    assert.equal((await listLogbookEntries()).filter(entry => entry.status === 'To do').length, 3)
    await assert.rejects(assignEntries(rm, { ...assignment, due: '2026-02-30' }), /valid due/)
    await assert.rejects(saveApprovalChain([]), /at least one/)
    assert.ok(readDeltas().workflow); assert.ok(data.has(STORAGE_KEY))
  } finally { globalThis.window = previous }
})
