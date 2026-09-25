import test from 'node:test'
import assert from 'node:assert/strict'
import { matchesBlueprintBrowseCompetency, orderBlueprintRequirements, acceptBlueprintQuestions, buildBlueprintPickerRows, matchesBlueprintPickerRow, getBlueprintPickerProgress } from './blueprintPicker.js'
const row = { id: 'a', type: 'saq', competency: 'AN1.1', category: 'Reasoning', level: 'hot', count: 2, marks: 5, subject: 'Human Anatomy', topics: ['Bones'] }
const question = { id: '1', type: 'SAQ', competencies: ['AN1.1'], questionCategory: 'Reasoning', thinkingLevel: 'HoT', marks: 5, subject: 'Human Anatomy', topics: ['Bones'] }
test('matches category, marks, subject, topic, competency and thinking level', () => {
  assert.equal(matchesBlueprintPickerRow(question, row), true)
  for (const patch of [{marks: 2}, {questionCategory: 'Direct'}, {thinkingLevel: 'LoT'}, {subject: 'Other'}, {topics: ['Other']}, {competencies: ['AN2.1']}]) assert.equal(matchesBlueprintPickerRow({...question,...patch},row),false)
})
test('duplicates and excess selections do not fill requirements', () => {
  const progress = getBlueprintPickerProgress([row], [question, {...question,id:'imported',originalQuestionId:'1'}, {...question,id:'2'}, {...question,id:'3'}])
  assert.equal(progress.matched,2)
  assert.equal(progress.marks,10)
  assert.equal(progress.unmatched.length,2)
  assert.equal(progress.complete,false)
})
test('allocates stable LAQ identities and counts each complete LAQ once', () => {
  const rows = buildBlueprintPickerRows({competencies:[{key:'a',code:'AN1.1'},{key:'b',code:'AN2.1'}], cells:{'a:laqLot':{count:1,marks:2},'b:laqLot':{count:1,marks:2},'a:laqHot':{count:1,marks:3},'b:laqHot':{count:1,marks:3}}, saqBreakdowns:{}, cards:[0,1].map(questionIndex=>({questionIndex,splits:[{marks:2,level:'lot'},{marks:3,level:'hot'}]})),subject:'Human Anatomy',topics:['Bones'],mcqMarks:1})
  assert.equal(rows.length,2)
  assert.deepEqual(rows[0].parts.map(p=>p.competency),['AN1.1','AN1.1'])
  const questions=rows.map((row,i)=>({...question,id:String(i),type:'LAQ',descriptiveSections:row.parts.map(p=>({marks:p.marks,thinkingLevel:p.level,competencies:[p.competency]}))}))
  assert.equal(getBlueprintPickerProgress(rows,questions).complete,true)
  assert.equal(getBlueprintPickerProgress(rows,questions).matched,2)
  questions[0].descriptiveSections[0].marks=1
  assert.equal(matchesBlueprintPickerRow(questions[0],rows[0]),false)
})

test('selection uses available blueprint requirements rather than a hidden active row', () => {
  const other = { ...row, id: 'direct', category: 'Direct', level: 'lot', count: 1 }
  const direct = { ...question, id: 'direct-question', questionCategory: 'Direct', thinkingLevel: 'LoT' }
  const candidates = [question, { ...question, id: 'wrong-marks', marks: 2 }, direct, { ...question, id: 'duplicate-import', originalQuestionId: '1' }, { ...question, id: '2' }, { ...question, id: 'surplus' }]
  assert.deepEqual(acceptBlueprintQuestions([row, other], [], candidates).map(q => q.id), ['1', 'direct-question', '2'])
  assert.deepEqual(acceptBlueprintQuestions([row], [question, { ...question, id: '2' }], [{ ...question, id: '3' }]), [])
})

test('workflow orders types and SAQ categories without changing saved identities', () => {
  const rows = [{id:'laq',type:'laq'}, {id:'application',type:'saq',category:'Application'}, {id:'direct',type:'saq',category:'Direct'}, {id:'mcq',type:'mcq'}, {id:'aetcom',type:'saq',category:'Aetcom'}, {id:'reasoning',type:'saq',category:'Reasoning'}]
  assert.deepEqual(orderBlueprintRequirements(rows).map(row => row.id), ['mcq','direct','reasoning','aetcom','application','laq'])
  assert.equal(rows[0].id, 'laq')
})

test('LAQ browsing includes any split competency without relaxing exact allocation', () => {
  const question = {type:'LAQ',competencies:['AN1.1'],descriptiveSections:[{children:[{competency:'AN2.4',marks:5,thinkingLevel:'HoT'}]}]}
  assert.equal(matchesBlueprintBrowseCompetency(question,['AN2.4']),true)
  assert.equal(matchesBlueprintBrowseCompetency(question,['AN1.1']),true)
  assert.equal(matchesBlueprintBrowseCompetency(question,['AN2.3']),false)
  assert.equal(matchesBlueprintBrowseCompetency(question,[]),true)
  assert.equal(matchesBlueprintPickerRow(question,{type:'laq',parts:[{competency:'AN2.4',marks:3,level:'hot'}]}),false)
})
