import test from 'node:test'
import assert from 'node:assert/strict'
import { assignEntries, chainFor, getLogbookWorkflow, reassignEntry, reviewEntries, saveApprovalChain } from './adminLogbook.js'
import { listLogbookEntries, resetLogbook, saveLogbookEntry, today, validateEntry } from './logbook.js'
import { awaitingRemedial, belongsTo, REVIEWERS } from './logbookPeople.js'
import { requirementProgress } from './logbookProgress.js'

test('corrections, assignment locks, subject chains and reset preserve the learner handoff', async () => {
  const previous = globalThis.window, data = new Map()
  globalThis.window = { localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }, dispatchEvent() {} }
  const rm = REVIEWERS.find(actor => actor.id === 'RM')
  const find = async id => (await listLogbookEntries()).find(entry => entry.id === id)
  try {
    const entry = { id: 'correction-flow', studentId: 'MC2569', subject: 'Human Anatomy', cat: 'practical', date: today(), faculty: 'RM', values: { exerciseNo: '1', activity: 'Surface anatomy', observation: 'Landmarks identified' }, extra: {}, fAck: true }
    await saveLogbookEntry(entry, true)
    await reviewEntries([entry.id], rm, { status: 'Returned', remarks: 'Add the observed landmarks.' })
    let returned = await find(entry.id)
    await assert.rejects(saveLogbookEntry(returned, false, 'MC2568'), /another student/)
    await saveLogbookEntry({ ...returned, values: { ...returned.values, observation: 'Clavicle and sternum identified.' } })
    assert.equal((await find(entry.id)).status, 'Returned', 'Saving corrections does not silently submit')
    await saveLogbookEntry({ ...await find(entry.id), fAck: true }, true)
    await reviewEntries([entry.id], rm, { status: 'Approved' })
    const approved = await find(entry.id)
    assert.deepEqual(approved.audit.map(event => event.action), ['Returned', 'Resubmitted', 'Approved'])
    assert.equal((await listLogbookEntries()).filter(record => record.id === entry.id).length, 1)

    await assignEntries(rm, { studentId: 'MC2570', subject: 'Human Anatomy', cat: 'practical', values: { activity: 'Required anatomy exercise' } })
    let task = (await listLogbookEntries()).find(record => record.assignment)
    assert.equal(task.assignment.due, '')
    await assert.rejects(saveLogbookEntry({ ...task, values: { activity: 'Changed task' } }), /cannot be changed/)
    await saveLogbookEntry({ ...task, values: { ...task.values, observation: 'Work in progress' } })
    task = await find(task.id)
    assert.equal(task.status, 'To do')
    await saveLogbookEntry({ ...task, values: { ...task.values, exerciseNo: '2' }, fAck: true }, true)
    assert.equal((await find(task.id)).status, 'Pending')
    await reviewEntries([task.id], rm, { status: 'Returned', remarks: 'Add more detail.' })
    await saveLogbookEntry(await find(task.id))
    assert.equal((await find(task.id)).status, 'Returned', 'Saving assigned corrections does not revert to To do')
    await saveLogbookEntry({ ...await find(task.id), fAck: true }, true)
    const staleTask = await find(task.id)
    await reassignEntry(task.id, rm, 'HOD')
    await assert.rejects(saveLogbookEntry({ ...staleTask, fAck: true }, true), /newer faculty decision or reassignment/)

    await saveApprovalChain(['DEAN'], 'Human Anatomy', rm)
    const workflow = await getLogbookWorkflow()
    assert.deepEqual(chainFor(workflow, 'Human Anatomy'), ['DEAN'])
    assert.deepEqual(chainFor(workflow, 'General Medicine'), ['HOD', 'DEAN', 'DIRECTOR'])
    await resetLogbook('MC2569')
    assert.equal(await find(entry.id), undefined)
    assert.equal((await find(task.id)).status, 'Pending', 'Reset leaves other learners untouched')
    assert.deepEqual(chainFor(await getLogbookWorkflow(), 'Human Anatomy'), ['DEAN'])
    assert.ok(belongsTo(await find(task.id), 'MC2570'))
  } finally { globalThis.window = previous }
})

test('draft remedials remain outstanding and category counts distinguish unique logged skills', () => {
  const parent = { id: 'parent', subject: 'General Medicine', cat: 'cert', status: 'Returned', values: { competency: 'IM1.1' } }
  const child = { ...parent, id: 'child', linkedTo: parent.id, status: 'Draft' }
  assert.equal(awaitingRemedial(parent, [parent, child]), true)
  assert.equal(awaitingRemedial(parent, [parent, { ...child, status: 'Pending' }]), false)
  const progress = requirementProgress('General Medicine', [parent, { ...child, status: 'Approved' }])
  assert.equal(progress.find(item => item.cat === 'cert').count, 1)
  assert.equal(validateEntry({ subject: 'General Medicine', cat: 'museum', values: {} }).cat, 'Select a category for this subject.')
})
