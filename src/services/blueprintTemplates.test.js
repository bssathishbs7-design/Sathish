import test from 'node:test'
import assert from 'node:assert/strict'
import { createInstitutionBlueprintTemplates } from './blueprintTemplateSamples.js'
import { BLUEPRINT_TEMPLATES_KEY, deleteBlueprintTemplate, readBlueprintTemplates, resolveTemplateCognition, saveBlueprintTemplate, snapshotBlueprintBreakdown, snapshotCompleteBlueprint, restoreCompleteBlueprint } from './blueprintTemplates.js'
const memory = () => { const data = new Map([[BLUEPRINT_TEMPLATES_KEY, '[]']]); return {getItem:key=>data.get(key) ?? null,setItem:(key,value)=>data.set(key,value)} }
test('institution samples have valid totals and cannot be deleted from personal storage', async () => {
 const templates = createInstitutionBlueprintTemplates()
 assert.equal(templates.length, 2)
 const storage = memory()
 for (const template of templates) {
  assert.equal(template.scope, 'institution')
  assert.equal(Object.values(template.breakdown).reduce((sum, row) => sum + Number(row.totalMarks), 0), template.totalMarks)
  assert.equal(Number(template.cognition.hot) + Number(template.cognition.lot), 100)
  await assert.rejects(deleteBlueprintTemplate(template.id, storage), /Institution templates/)
 }
 assert.deepEqual(readBlueprintTemplates(storage), [])
})
const snapshot = () => snapshotBlueprintBreakdown([{label:'MCQs',perQuestionMarks:'1',totalMarks:'20',hotQuestionsValue:'8',lotQuestionsValue:'12',subject:'must not save'}], [{splitCount:'1',splits:[{marks:'10',level:'hot'}]}], {lot:'60',hot:'40',distribution:'must not save'})

test('editing replaces only the named template and preserves its identity and creation details', async () => {
 const storage = memory()
 const first = await saveBlueprintTemplate('Original', snapshot(), storage, 'Faculty')
 const other = await saveBlueprintTemplate('Other', snapshot(), storage)
 const updated = await saveBlueprintTemplate('Renamed', snapshot(), storage, 'Editor', first.id)
 assert.equal(updated.id, first.id)
 assert.equal(updated.createdAt, first.createdAt)
 assert.equal(updated.createdBy, 'Faculty')
 assert.ok(updated.updatedAt)
 assert.deepEqual(readBlueprintTemplates(storage), [updated, other])
 await assert.rejects(saveBlueprintTemplate('Other', snapshot(), storage, '', first.id), /already exists/)
 await deleteBlueprintTemplate(first.id, storage)
 await assert.rejects(saveBlueprintTemplate('Missing', snapshot(), storage, '', first.id), /no longer available/)
})
test('stores only cognition and breakdown data and keeps an independent copy of LAQ parts', async()=>{
 const storage=memory();const input=snapshot();const saved=await saveBlueprintTemplate('  Anatomy mix  ',input,storage)
 input.cognition.hot='99'
 input.laqParts[0].splits[0].marks='99'
 assert.deepEqual(saved.cognition,{lot:'60',hot:'40'})
 assert.equal(saved.name,'Anatomy mix');assert.equal(saved.laqParts[0].splits[0].marks,'10')
 assert.deepEqual(Object.keys(saved).sort(),['id','name','createdAt','createdBy','cognition','breakdown','laqParts','totalMarks'].sort())
 assert.equal(saved.breakdown.MCQs.subject,undefined);assert.equal(saved.breakdown.MCQs.hotQuestions,'8')
 assert.deepEqual(readBlueprintTemplates(storage),[saved])
})
test('rejects blank, duplicate and reserved names without overwriting',async()=>{
 const storage=memory();await saveBlueprintTemplate('Anatomy mix',snapshot(),storage)
 for(const name of [' ','ANATOMY   MIX','Create Blueprint (Default)']) await assert.rejects(saveBlueprintTemplate(name,snapshot(),storage))
 assert.equal(readBlueprintTemplates(storage).length,1)
})
test('reports storage failure instead of reporting a saved template',async()=>{
 await assert.rejects(saveBlueprintTemplate('New',snapshot(),{getItem:()=>null,setItem:()=>{throw Error('quota')}}),/Unable to save/)
})

test('restores explicit cognition rather than replacing it with rounded allocation ratios',()=>{
 assert.deepEqual(resolveTemplateCognition({cognition:{lot:'22',hot:'78'}}),{lot:'22',hot:'78'})
})
test('recovers legacy percentages using MCQ counts, SAQ modes and LAQ part marks',()=>{
 const template={totalMarks:50,breakdown:{MCQs:{totalMarks:'20',perQuestionMarks:'1',hotQuestions:'8',lotQuestions:'12'},'SAQs (Direct)':{totalMarks:'20',cognitionMode:'lot'},LAQs:{totalMarks:'10'}},laqParts:[{splits:[{marks:'3',level:'lot'},{marks:'7',level:'hot'}]}]}
 assert.deepEqual(resolveTemplateCognition(template),{lot:'70',hot:'30'})
 assert.equal(template.cognition,undefined)
})
test('does not invent cognition when legacy allocations are incomplete',()=>{
 assert.equal(resolveTemplateCognition({totalMarks:50,breakdown:{MCQs:{totalMarks:'50',perQuestionMarks:'1'}}}),null)
 assert.equal(resolveTemplateCognition({totalMarks:10,breakdown:{LAQs:{totalMarks:'10'}},laqParts:[{splits:[{marks:'5',level:'hot'}]}]}),null)
})
test('supports an entirely HoT or LoT legacy breakdown',()=>{
 assert.deepEqual(resolveTemplateCognition({totalMarks:10,breakdown:{'SAQs (Direct)':{totalMarks:'10',cognitionMode:'lot'}}}),{lot:'100',hot:'0'})
})

test('records creator and deletes only the requested reusable template',async()=>{
 const storage=memory();const loaded=await saveBlueprintTemplate('First',snapshot(),storage,'Faculty One')
 const second=await saveBlueprintTemplate('Second',snapshot(),storage,'Faculty Two')
 storage.setItem('assessment-draft',JSON.stringify(loaded))
 await deleteBlueprintTemplate(loaded.id,storage)
 assert.deepEqual(readBlueprintTemplates(storage),[second])
 assert.equal(JSON.parse(storage.getItem('assessment-draft')).createdBy,'Faculty One')
 assert.equal(loaded.breakdown.MCQs.totalMarks,'20')
 await assert.rejects(deleteBlueprintTemplate('default',storage))
})
test('delete failure leaves templates available',async()=>{
 const storage=memory();await saveBlueprintTemplate('Keep',snapshot(),storage)
 const failing={getItem:storage.getItem,setItem:()=>{throw Error('quota')}}
 await assert.rejects(deleteBlueprintTemplate(readBlueprintTemplates(storage)[0].id,failing),/Unable to delete/)
 assert.equal(readBlueprintTemplates(storage).length,1)
})


test('fresh storage receives four coherent samples without persisting on read', () => {
 const storage = { getItem: () => null }
 const samples = readBlueprintTemplates(storage)
 assert.equal(samples.length, 4)
 assert.deepEqual(samples.map(row => [row.totalMarks, row.cognition.lot]), [[100, '30'], [100, '40'], [100, '25'], [70, '60']])
 for (const sample of samples) {
   assert.equal(Object.values(sample.breakdown).reduce((sum, row) => sum + Number(row.totalMarks), 0), sample.totalMarks)
   assert.deepEqual(resolveTemplateCognition({ ...sample, cognition: undefined }), sample.cognition)
 }
 samples[0].name = 'Changed'
 assert.notEqual(readBlueprintTemplates(storage)[0].name, 'Changed')
})
test('saved data and intentionally empty lists take precedence over samples', async () => {
 const storage = memory()
 assert.deepEqual(readBlueprintTemplates(storage), [])
 const sample = readBlueprintTemplates({ getItem: () => null })[0]
 storage.setItem(BLUEPRINT_TEMPLATES_KEY, JSON.stringify([sample]))
 await deleteBlueprintTemplate(sample.id, storage)
 assert.deepEqual(readBlueprintTemplates(storage), [])
})

test('complete templates round-trip every table and allocation without sharing assessment identity or nested references', async () => {
 const storage = memory()
 const planner = {
  assessmentId: 'do-not-copy', approvalStatus: 'Approved', validationStatus: 'matched',
  blueprintDraft: { subject: 'Human Anatomy', topics: ['General anatomy'], competencies: ['AN1.1'], totalMark: '20', template: 'source', templateSnapshot: { name: 'source' } },
  blueprintDistributionDraft: { 'AN1.1': '20' }, blueprintCognitionWeightage: { lot: '50', hot: '50' },
  blueprintQuestionTypeDraft: { MCQs: { perQuestionMarks: '1', totalMarks: '10', hotQuestions: '0', lotQuestions: '10' }, LAQs: { perQuestionMarks: '10', totalMarks: '10' } },
  blueprintLaqQuestionSplits: [{ splitCount: '2', splits: [{ marks: '4', level: 'hot' }, { marks: '6', level: 'hot' }] }],
  blueprintTestSpecificationCountDraft: { 'AN1.1': { mcqLot: '10', laqHot: '2' } },
  blueprintTestSpecificationMarkDraft: { 'AN1.1': { mcqLot: 10, laqHot: 10 } },
  blueprintUnitAssignments: { laqHot: { '1a': 'AN1.1', '1b': 'AN1.1' } },
  blueprintManualCells: { 'AN1.1': { laqHot: true } }, blueprintRebalanceMetadata: { 'AN1.1': { originalTargetMarks: 20 } },
  pickerRows: [{ id: 'AN1.1-mcq', count: 10, marks: 1 }],
 }
 const tables = { distribution: [{ key: 'AN1.1', correlationLevel: '3', distributionLabel: '20', weightageLabel: '1.00' }],
  questionTypes: [{ label: 'MCQs', perQuestionMarks: '1', totalMarks: '10', hotQuestionsValue: '0', lotQuestionsValue: '10' }, { label: 'LAQs', perQuestionMarks: '10', totalMarks: '10', hotQuestionsValue: '2', lotQuestionsValue: '0' }],
  competencies: [{ key: 'AN1.1', targetMarks: 20 }], columns: [{ key: 'mcqLot' }, { key: 'laqHot' }],
 }
 const payload = snapshotCompleteBlueprint(planner, tables)
 const saved = await saveBlueprintTemplate('Full anatomy', payload, storage)
 const reloaded = readBlueprintTemplates(storage)[0]
 assert.deepEqual(reloaded, saved)
 const restored = restoreCompleteBlueprint(reloaded)
 for (const key of Object.keys(planner).filter(key => key.startsWith('blueprint') && key !== 'blueprintDraft')) assert.deepEqual(restored[key], planner[key])
 assert.deepEqual(restored.pickerRows, planner.pickerRows)
 assert.deepEqual(reloaded.tables, tables)
 assert.deepEqual(restored.blueprintDraft.referenceRows, tables.distribution)
 assert.equal(restored.assessmentId, undefined)
 assert.equal(restored.approvalStatus, undefined)
 assert.equal(restored.blueprintDraft.templateSnapshot, undefined)
 restored.blueprintTestSpecificationCountDraft['AN1.1'].mcqLot = '99'
 restored.blueprintLaqQuestionSplits[0].splits[0].marks = '99'
 tables.distribution[0].correlationLevel = '99'
 payload.blueprint.blueprintDraft.subject = 'Changed after saving'
 assert.equal(readBlueprintTemplates(storage)[0].blueprint.blueprintDraft.subject, 'Human Anatomy')
 assert.equal(restoreCompleteBlueprint(reloaded).blueprintTestSpecificationCountDraft['AN1.1'].mcqLot, '10')
 assert.equal(reloaded.blueprint.blueprintLaqQuestionSplits[0].splits[0].marks, '4')
 assert.equal(reloaded.tables.distribution[0].correlationLevel, '3')
})

test('complete template creation rejects incomplete matrices; legacy templates remain explicitly partial', () => {
 assert.throws(() => snapshotCompleteBlueprint({ validationStatus: 'mismatched' }, {}), /valid blueprint matrix/)
 assert.throws(() => snapshotCompleteBlueprint({ validationStatus: 'matched', blueprintDraft: { subject: 'Anatomy', topics: [], competencies: [] } }, {}), /valid blueprint matrix/)
 assert.equal(restoreCompleteBlueprint(snapshot()), null)
})
