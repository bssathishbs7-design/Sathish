import test from 'node:test'
import assert from 'node:assert/strict'
import { readDeltas, commit, STORAGE_KEY, LEGACY_STORAGE_KEY, startSeparateLogbook, listLogbookEntries, saveLogbookEntry, updateLogbookEntry, searchEntries, skillProgress, validateEntry, today } from './logbook.js'
import { assignEntries, changeSignoff, getLogbookWorkflow, saveApprovalChain, reviewEntries } from './adminLogbook.js'
import { REVIEWERS, awaitingRemedial } from './logbookPeople.js'
import { SUBJECTS } from './logbookCatalog.js'
import { SAMPLE_ENTRIES, COHORT_ENTRIES } from './logbookSample.js'
import { collectSkills } from './logbookProgress.js'
import { activityKey, entryTitle } from './logbookTitles.js'
import { isLoggedEntry, signoffVersion, entrySubjectLocked } from './logbookPolicy.js'

const rm = REVIEWERS.find(person => person.id === 'RM')
const fresh = patch => ({ id: 'comparison-entry', studentId: 'MC2568', subject: 'Human Anatomy', cat: 'skill', date: today(), faculty: 'RM', status: 'Draft', values: { competency: 'AN1.2', activity: 'Identify landmarks' }, extra: {}, fAck: true, ...patch })
async function isolated(run) {
  const previous = globalThis.window, data = new Map()
  globalThis.window = { localStorage: { getItem: key => data.get(key) || null, setItem: (key,value) => data.set(key,value) }, dispatchEvent() {} }
  try { await run(data) } finally { globalThis.window = previous }
}
const current = async id => (await listLogbookEntries()).find(entry => entry.id === id)

test('a returned remedial continues from the latest attempt without branching the original record', () => isolated(async () => {
  const attempt = fresh({ id: 'repeat-one', subject: 'General Medicine', cat: 'cert', linkedTo: 'im-1', values: { competency: 'IM1.1', activity: 'Take a clinical history' } })
  await saveLogbookEntry(attempt, true)
  await reviewEntries([attempt.id], rm, { status: 'Returned', attempt: 'Re', rating: 'B', decision: 'Re', remarks: 'Repeat the chronology.' })
  let rows = await listLogbookEntries()
  assert.equal(awaitingRemedial(rows.find(row => row.id === 'im-1'), rows), false)
  assert.equal(awaitingRemedial(rows.find(row => row.id === attempt.id), rows), true)
  await assert.rejects(saveLogbookEntry({ ...attempt, id: 'parallel-branch' }, true), /already exists/)
  await saveLogbookEntry({ ...attempt, id: 'repeat-two', linkedTo: attempt.id }, true)
  await reviewEntries(['repeat-two'], rm, { status: 'Approved', attempt: 'Re', rating: 'M' })
  rows = await listLogbookEntries()
  assert.equal(rows.filter(row => ['im-1', 'repeat-one', 'repeat-two'].includes(row.id) && awaitingRemedial(row, rows)).length, 0)
  assert.equal(rows.find(row => row.id === 'repeat-two').linkedTo, 'repeat-one')
  assert.equal(rows.find(row => row.id === 'repeat-one').linkedTo, 'im-1')
}))

test('each approval stage can return to the learner and restart the full chain', () => isolated(async () => {
  const request = { studentId: 'MC2568', subject: 'Human Anatomy' }
  const chain = ['HOD-AN', 'DEAN', 'DIRECTOR'].map(id => REVIEWERS.find(person => person.id === id))
  const record = async () => (await getLogbookWorkflow()).signoffs['MC2568:Human Anatomy']
  await changeSignoff({ ...request, action: 'ready', actor: rm })
  await assert.rejects(changeSignoff({ ...request, action: 'submit' }), /Only the owner/)
  await assert.rejects(changeSignoff({ ...request, action: 'submit', learnerId: 'MC2569' }), /Only the owner/)
  await assert.rejects(changeSignoff({ ...request, action: 'submit', learnerId: 'MC2568', actor: rm }), /Only the owner/)
  for (let stage = 0; stage < chain.length; stage++) {
    await changeSignoff({ ...request, action: 'submit', learnerId: 'MC2568' })
    assert.equal((await record()).step, 0)
    for (let before = 0; before < stage; before++) await changeSignoff({ ...request, action: 'approve', actor: chain[before] })
    await assert.rejects(changeSignoff({ ...request, action: 'approve', actor: chain[(stage + 1) % 3] }), /signature/)
    await assert.rejects(changeSignoff({ ...request, action: 'return', actor: chain[stage], remarks: ' ' }), /reason/)
    await changeSignoff({ ...request, action: 'return', actor: chain[stage], remarks: `Clarify stage ${stage}` })
    assert.equal((await record()).status, 'Returned')
    await assert.rejects(changeSignoff({ ...request, action: 'approve', actor: chain[stage] }), /signature/)
  }
  await changeSignoff({ ...request, action: 'submit', learnerId: 'MC2568' })
  for (const actor of chain) await changeSignoff({ ...request, action: 'approve', actor })
  assert.equal((await record()).status, 'Completed')
  assert.equal((await record()).history.filter(event => event.action === 'return').length, 3)
  assert.equal((await record()).history.filter(event => event.action === 'submit').length, 4)
  await assert.rejects(changeSignoff({ ...request, action: 'submit', learnerId: 'MC2568' }), /mark the logbook ready/)
}))

test('stale approval confirmations and changed submission chains cannot act on new state', () => isolated(async () => {
  const request = { studentId: 'MC2568', subject: 'Human Anatomy' }
  const record = async () => (await getLogbookWorkflow()).signoffs['MC2568:Human Anatomy']
  const hod = REVIEWERS.find(person => person.id === 'HOD-AN')
  await changeSignoff({ ...request, action: 'ready', actor: rm })
  const readyVersion = signoffVersion(await record())
  await saveApprovalChain(['HOD-AN', 'DIRECTOR'], request.subject, rm)
  await assert.rejects(changeSignoff({ ...request, action: 'submit', learnerId: 'MC2568', expectedVersion: readyVersion, expectedChain: ['HOD-AN', 'DEAN', 'DIRECTOR'] }), /chain changed/)
  await changeSignoff({ ...request, action: 'submit', learnerId: 'MC2568', expectedVersion: readyVersion, expectedChain: ['HOD-AN', 'DIRECTOR'] })
  const oldRound = signoffVersion(await record())
  await changeSignoff({ ...request, action: 'return', actor: hod, remarks: 'Recheck', expectedVersion: oldRound })
  await changeSignoff({ ...request, action: 'submit', learnerId: 'MC2568' })
  await assert.rejects(changeSignoff({ ...request, action: 'approve', actor: hod, expectedVersion: oldRound }), /approval changed/)
  assert.equal((await record()).step, 0)
  await changeSignoff({ ...request, action: 'approve', actor: hod, expectedVersion: signoffVersion(await record()) })
  assert.equal((await record()).step, 1)
}))

test('locked subject work is not actionable while other learners and returned subjects stay editable', () => {
  for (const status of ['Submitted', 'Completed']) assert.equal(entrySubjectLocked(fresh(), [{ studentId: 'MC2568', subject: 'Human Anatomy', status }]), true)
  assert.equal(entrySubjectLocked(fresh(), [{ studentId: 'MC2569', subject: 'Human Anatomy', status: 'Completed' }]), false)
  assert.equal(entrySubjectLocked(fresh(), [{ studentId: 'MC2568', subject: 'Human Anatomy', status: 'Returned' }]), false)
})

test('completed and in-review subjects reject new entries, edits and assignments; batch skips them', () => isolated(async () => {
  for (const status of ['Completed','Submitted']) {
    commit({ added: [fresh()], edits: {}, removed: [], workflow: { signoffs: { 'MC2568:Human Anatomy': { studentId: 'MC2568', subject: 'Human Anatomy', status, history: [] } } } })
    await assert.rejects(saveLogbookEntry(fresh({ id: 'new' }), true), /signed off|final approval/)
    await assert.rejects(saveLogbookEntry(fresh()), /signed off|final approval/)
    await assert.rejects(updateLogbookEntry('comparison-entry','withdraw',{ studentId: 'MC2568' }), /signed off|final approval/)
    await assert.rejects(assignEntries(rm,{ studentId: 'MC2568', subject: 'Human Anatomy', cat: 'skill', instructions: 'Complete activity' }), /No eligible/)
    const result = await assignEntries(rm,{ studentId: 'all', subject: 'Human Anatomy', cat: 'skill', instructions: 'Complete activity' })
    assert.equal(result.assigned,2); assert.equal(result.skipped,1)
    await updateLogbookEntry('comparison-entry','notes',{ studentId:'MC2568',text:'Additional context' })
    assert.equal((await current('comparison-entry')).extra.notes,'Additional context')
  }
}))

test('pending context is immutable; notes and deletion require the owner', () => isolated(async () => {
  await saveLogbookEntry(fresh(),true)
  const row = await current('comparison-entry')
  await assert.rejects(saveLogbookEntry({ ...row, cat:'cert',fAck:true },true), /original subject and category/)
  await assert.rejects(saveLogbookEntry({ ...row, subject:'General Medicine',fAck:true },true), /original subject and category/)
  await assert.rejects(updateLogbookEntry(row.id,'notes',{studentId:'MC2569',text:'Other owner'}), /Only the owner/)
  await assert.rejects(updateLogbookEntry(row.id,'withdraw',{studentId:'MC2569'}), /Only the owner/)
  await reviewEntries([row.id],rm,{status:'Returned',remarks:'Fix details'})
  await updateLogbookEntry(row.id,'withdraw',{studentId:'MC2568'})
  assert.equal(await current(row.id),undefined)
}))

test('returned records with linked attempts retain their review history', () => isolated(async () => {
  const parent = fresh({status:'Returned',cat:'cert'})
  commit({added:[parent,fresh({id:'child',cat:'cert',linkedTo:parent.id})],edits:{},removed:[]})
  for (const id of [parent.id,'child']) await assert.rejects(updateLogbookEntry(id,'withdraw',{studentId:'MC2568'}), /linked records/)
}))

test('prototype data is detected and isolated without changing the original bytes', () => isolated(async data => {
  const original = JSON.stringify({added:[{id:'html',student:'AK',cat:'skill',values:{compNo:'AN1'}}],edits:{},removed:[],signoffs:{}})
  data.set(LEGACY_STORAGE_KEY,original)
  assert.throws(()=>readDeltas(),/HTML prototype data/)
  assert.equal(data.has(STORAGE_KEY),false)
  await startSeparateLogbook()
  assert.equal(data.get(LEGACY_STORAGE_KEY),original)
  assert.equal((await listLogbookEntries()).some(entry=>entry.id==='html'),false)
  assert.equal(JSON.parse(data.get(STORAGE_KEY)).schemaVersion,4)
}))

test('existing app records in the prior namespace remain available and migrate on app save only', () => isolated(async data => {
  const previous=JSON.stringify({added:[fresh()],edits:{},removed:[]})
  data.set(LEGACY_STORAGE_KEY,previous)
  assert.equal((await current('comparison-entry')).id,'comparison-entry')
  await saveLogbookEntry(await current('comparison-entry'))
  assert.ok(data.has(STORAGE_KEY)); assert.equal(data.get(LEGACY_STORAGE_KEY),previous)
}))

test('department chains, frozen submission revisions and returned resubmission stay consistent', () => isolated(async () => {
  const dean=REVIEWERS.find(person=>person.id==='DEAN'), hod=REVIEWERS.find(person=>person.id==='HOD-AN')
  await assert.rejects(saveApprovalChain(['DEAN'],'Human Anatomy',dean),/subject department/)
  await assert.rejects(saveApprovalChain(['DEAN'],undefined,rm),/subject department/)
  await assert.rejects(saveApprovalChain(['DEAN'],'General Medicine',hod),/subject department/)
  await saveApprovalChain(['HOD-AN','DEAN'],'Human Anatomy',rm)
  const request={studentId:'MC2568',subject:'Human Anatomy'}
  await changeSignoff({...request,action:'ready',actor:rm})
  await changeSignoff({...request,action:'submit',learnerId:'MC2568'})
  await saveApprovalChain(['DEAN'],'Human Anatomy',rm)
  assert.deepEqual((await getLogbookWorkflow()).signoffs['MC2568:Human Anatomy'].chain,['HOD-AN','DEAN'])
  const deltas=readDeltas(); deltas.edits['an-1']={updatedAt:'2026-09-29T01:00:00Z'};commit(deltas)
  await assert.rejects(changeSignoff({...request,action:'approve',actor:hod}),/record set changed/)
  await changeSignoff({...request,action:'return',actor:hod,remarks:'Review changes'})
  await assert.rejects(changeSignoff({...request,action:'ready',actor:rm}),/already progressed/)
  await changeSignoff({...request,action:'submit',learnerId:'MC2568'})
  await changeSignoff({...request,action:'approve',actor:dean})
  assert.equal((await getLogbookWorkflow()).signoffs['MC2568:Human Anatomy'].status,'Completed')
}))

test('initial comments post exactly once; text limits preserve longer existing notes', () => isolated(async () => {
  await saveLogbookEntry(fresh({extra:{comment:'Please check technique'}}))
  assert.equal((await current('comparison-entry')).extra.comments.length,0)
  await saveLogbookEntry({...await current('comparison-entry'),fAck:true},true)
  assert.equal((await current('comparison-entry')).extra.comments.length,1)
  await saveLogbookEntry({...await current('comparison-entry'),fAck:true},true)
  assert.equal((await current('comparison-entry')).extra.comments.length,1)
  await assert.rejects(updateLogbookEntry('comparison-entry','comment',{text:'x'.repeat(501)}),/500 characters/)
  const deltas=readDeltas();deltas.edits['comparison-entry'].extra.notes='x'.repeat(700);commit(deltas)
  await saveLogbookEntry({...await current('comparison-entry'),fAck:true},true)
  assert.equal((await current('comparison-entry')).extra.notes.length,700)
  await assert.rejects(updateLogbookEntry('comparison-entry','notes',{studentId:'MC2568',text:'x'.repeat(701)}),/500 characters/)
  await assert.rejects(assignEntries(rm,{studentId:'all',subject:'Human Anatomy',cat:'skill',instructions:'x'.repeat(501)}),/500 characters/)
}))

test('search, grouping and progress use submitted records and category-specific context', () => {
  const rows=[fresh({cat:'cert',values:{competency:'CUSTOM',activity:'Draft-only skill'}}),fresh({id:'task',cat:'cert',status:'To do',values:{competency:'TASK',activity:'Assigned skill'}})]
  assert.equal(collectSkills('Human Anatomy',rows).some(skill=>['CUSTOM','TASK'].includes(skill.code)),false)
  assert.equal(skillProgress(rows,SUBJECTS[0]).some(skill=>skill.attempts.length),false)
  assert.equal(rows.filter(isLoggedEntry).length,0)
  const one=fresh({cat:'museum',values:{specimenNo:'S1',activity:'Lung'}}), two={...one,id:'two',values:{...one.values,specimenNo:'S2'}}
  assert.notEqual(activityKey(one),activityKey(two)); assert.match(entryTitle(one),/S1/)
  assert.equal(searchEntries([one],'specimen RM').length,1)
  for(const entry of [...SAMPLE_ENTRIES,...COHORT_ENTRIES].filter(entry=>isLoggedEntry(entry)&&entry.cat!=='community')) assert.deepEqual(validateEntry({...entry,fAck:true},true),{},entry.id)
})
