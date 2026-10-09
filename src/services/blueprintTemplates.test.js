import test from 'node:test'
import assert from 'node:assert/strict'
import { deleteBlueprintTemplate, readBlueprintTemplates, resolveTemplateCognition, saveBlueprintTemplate, snapshotBlueprintBreakdown } from './blueprintTemplates.js'
const memory = () => { const data = new Map(); return {getItem:key=>data.get(key) ?? null,setItem:(key,value)=>data.set(key,value)} }
const snapshot = () => snapshotBlueprintBreakdown([{label:'MCQs',perQuestionMarks:'1',totalMarks:'20',hotQuestionsValue:'8',lotQuestionsValue:'12',subject:'must not save'}], [{splitCount:'1',splits:[{marks:'10',level:'hot'}]}], {lot:'60',hot:'40',distribution:'must not save'})
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
