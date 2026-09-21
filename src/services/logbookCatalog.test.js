import test from 'node:test'
import assert from 'node:assert/strict'
import { CATEGORIES, SUBJECTS, availableLogCategories, changeLogSelection, getLogbookGroups, recentLogCategories, subjectLabel } from './logbookCatalog.js'
import { applyDeltas, validateEntry } from './logbook.js'
const fields = (category, subject='Human Anatomy', remedial=false) => getLogbookGroups(category,subject,remedial).filter(group=>!group.locked).flatMap(group=>group.fields)

test('prototype catalogue and subject restrictions are complete', () => {
 assert.equal(SUBJECTS.length,19)
 assert.equal(CATEGORIES.filter(category=>!category.legacy).length,24)
 assert.equal(subjectLabel('Human Anatomy'),'Anatomy')
 assert.ok(availableLogCategories('Human Anatomy').some(category=>category.id==='museum'))
 assert.ok(!availableLogCategories('General Medicine').some(category=>category.id==='museum'))
 assert.ok(availableLogCategories('Community Medicine').some(category=>category.id==='fap'))
 assert.ok(!availableLogCategories('Human Anatomy').some(category=>category.id==='fap'))
 assert.ok(availableLogCategories('General Medicine','museum').some(category=>category.id==='museum'))
})
test('practical and clinical forms use the actual prototype fields', () => {
 assert.deepEqual(fields('practical').map(field=>field.key),['exerciseNo','activity','date','observation'])
 assert.deepEqual(fields('clerkship').map(field=>field.key),['serial','patientId','ageGender','provDx','admission','discharge'])
 assert.ok(!fields('ccp').some(field=>field.key==='admission'))
 assert.equal(fields('ece').filter(field=>field.type==='textarea').length,4)
 assert.equal(fields('aetcom').filter(field=>field.type==='textarea').length,4)
 assert.equal(fields('ccp').filter(field=>field.type==='textarea').length,3)
 assert.equal(fields('proc').find(field=>field.key==='participation').options.length,4)
})
test('phase, subject and remedial rules match prototype', () => {
 assert.ok(!fields('cert').some(field=>field.key==='numReq'))
 assert.ok(fields('cert','General Medicine').some(field=>field.key==='numReq'))
 assert.ok(!fields('cert','General Medicine',true).some(field=>field.key==='numReq'))
 assert.ok(fields('sdl','Dermatology, Venereology and Leprosy').some(field=>field.key==='week'))
 assert.ok(!fields('sdl','General Medicine').some(field=>field.key==='week'))
 assert.ok(getLogbookGroups('cert','General Medicine').some(group=>group.locked))
})
test('all category and subject schemas submit with their required inputs only', () => {
 for(const subject of SUBJECTS) for(const category of availableLogCategories(subject.name)) {
  const values={}
  for(const field of fields(category.id,subject.name)) if(field.required && field.key!=='date') values[field.key]=field.options?.[0] || (field.type==='number'?'1':field.type==='date'?'2026-01-01':'Test record')
  const record={subject:subject.name,cat:category.id,date:'2026-01-02',values,faculty:'RM',fAck:true}
  assert.deepEqual(validateEntry(record,true,'2026-09-21'),{},subject.name+' '+category.id)
 }
})
test('selection changes protect incompatible content and preserve common fields', () => {
 const original={subject:'Human Anatomy',cat:'practical',values:{exerciseNo:'7',activity:'My exercise',observation:'My results'},extra:{notes:'Keep'},fAck:true}
 const changed=changeLogSelection(original,'cat','simulation')
 assert.deepEqual(changed.removed,['Exercise No.','Observation / result'])
 assert.equal(changed.form.values.activity,'My exercise')
 assert.equal(changed.form.extra,original.extra)
 assert.equal(changed.form.fAck,false)
 assert.equal(original.values.observation,'My results')
})
test('old subject keys and legacy category records are preserved by reconciliation', () => {
  const entries = applyDeltas({ added: [], edits: {}, removed: [] })
  assert.ok(entries.some((entry) => entry.subject === 'Human Anatomy'))
  const community = entries.find((entry) => entry.cat === 'community')
  assert.ok(community)
  assert.deepEqual(validateEntry({ ...community, fAck: true }, true), {})
})

test('recent shortcuts are unique, ordered by last saved time, and exclude legacy categories', () => {
  assert.deepEqual(recentLogCategories([
    { cat: 'cert', date: '2026-01-01', updatedAt: '2026-09-21T09:00:00Z' },
    { cat: 'ccp', date: '2026-09-20' },
    { cat: 'cert', date: '2026-09-19' },
    { cat: 'proc', date: '2026-09-18' },
    { cat: 'sdl', date: '2026-09-17' },
    { cat: 'community', date: '2026-09-22' },
  ]).map((item) => item.id), ['cert', 'ccp', 'proc'])
})
