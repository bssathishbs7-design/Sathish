import test from 'node:test'
import assert from 'node:assert/strict'
import { updateBlueprintOutlineRow, getBlueprintSetupBalance, normalizeBlueprintSetupInputs, clearEmptyBlueprintModes } from './blueprintSetupRows.js'
import { getBlueprintOutlinePercentages } from './blueprintOutlinePercentages.js'
import { getBlueprintCountSuggestions } from './blueprintCountSuggestions.js'
const target={totalMarks:100,hotMarks:78}
const update=(draft,label,field,value,hot)=>updateBlueprintOutlineRow(draft,label,field,value,target,{},[],hot)
test('manual row edits preserve previous allocations and reject rebalancing to match targets',()=>{
 let draft={MCQs:{perQuestionMarks:'1'}}
 draft=update(draft,'MCQs','questionCount','20')
 assert.equal(draft.MCQs.lockedHotCents,1500)
 draft['SAQs (Direct)']={perQuestionMarks:'5',cognitionMode:'lot'}
 draft=update(draft,'SAQs (Direct)','questionCount','4')
 assert.equal(draft.MCQs.lockedHotCents,1500)
 assert.equal(getBlueprintOutlinePercentages(draft,target).ready,false)
 assert.equal(getBlueprintSetupBalance(draft,target,getBlueprintOutlinePercentages(draft,target)).lot,-3)
 assert.match(getBlueprintCountSuggestions(draft,'SAQs (Direct)',target).message,/at most 3/)
 draft=update(draft,'MCQs','questionCount','20',1800)
 assert.equal(draft.MCQs.lockedHotCents,1800)
 assert.equal(draft['SAQs (Direct)'].lockedHotCents,0)
 draft['SAQs (Reasoning)']={perQuestionMarks:'5',cognitionMode:'hot'}
 draft=update(draft,'SAQs (Reasoning)','questionCount','12')
 const preview=getBlueprintOutlinePercentages(draft,target)
 assert.equal(preview.ready,true)
 assert.deepEqual(getBlueprintSetupBalance(draft,target,preview),{total:0,hot:0,lot:0,pending:false})
})
test('card totals match the selected allocation and preserve other row input values',()=>{
 let draft={MCQs:{perQuestionMarks:'1'},'SAQs (Direct)':{perQuestionMarks:'5',questionCount:'4',cognitionMode:'lot',lockedHotCents:0}}
 const card=getBlueprintCountSuggestions(draft,'MCQs',target).cards[0]
 const before=JSON.stringify(draft['SAQs (Direct)'])
 draft=update(draft,'MCQs','questionCount',String(card.count),card.lockedHotCents)
 assert.equal(JSON.stringify(draft['SAQs (Direct)']),before)
 const actual=getBlueprintSetupBalance(draft,target,getBlueprintOutlinePercentages(draft,target))
 assert.equal(actual.hot,card.after.hot)
 assert.equal(actual.lot,card.after.lot)
 assert.equal(actual.total,card.after.total)
})
test('LAQ reserved marks remain fixed across later row edits',()=>{
 let draft={LAQs:{perQuestionMarks:'10'}}
 draft=update(draft,'LAQs','questionCount','2')
 assert.equal(draft.LAQs.lockedHotCents,1560)
 draft.MCQs={perQuestionMarks:'1'}
 draft=update(draft,'MCQs','questionCount','10')
 assert.equal(draft.LAQs.lockedHotCents,1560)
})

test('suggestions explain impossible remainder denominations without changing the setup',()=>{
 const draft={'SAQs (Direct)':{perQuestionMarks:'5',cognitionMode:'lot'},'SAQs (Reasoning)':{perQuestionMarks:'5',cognitionMode:'both'}}
 const card=getBlueprintCountSuggestions(draft,'SAQs (Direct)',target).cards.at(-1)
 assert.match(card.warning,/cannot be filled/)
 assert.equal(card.after.lot,2)
})

test('legacy decimal fields clear without rounding or altering valid rows',()=>{
 const draft={MCQs:{perQuestionMarks:'1',questionCount:'20',lockedHotCents:1500},'SAQs (Application)':{perQuestionMarks:'0.33',questionCount:'6',cognitionMode:'lot',lockedHotCents:0},LAQs:{perQuestionMarks:'5',questionCount:'1.5'}}
 const next=normalizeBlueprintSetupInputs(draft)
 assert.equal(next.MCQs,draft.MCQs)
 assert.equal(next['SAQs (Application)'].perQuestionMarks,'')
 assert.equal(next['SAQs (Application)'].questionCount,'6')
 assert.equal(next['SAQs (Application)'].lockedHotCents,undefined)
 assert.equal(next.LAQs.questionCount,'')
 assert.equal(draft['SAQs (Application)'].perQuestionMarks,'0.33')
 assert.equal(normalizeBlueprintSetupInputs(next),next)
})

test('blank rows have no saved default mode; user can select a mode to begin entering',()=>{
 const label='SAQs (Aetcom)'
 let draft=clearEmptyBlueprintModes({[label]:{perQuestionMarks:'',questionCount:'',cognitionMode:'both'}})
 assert.equal(draft[label].cognitionMode,undefined)
 draft=update(draft,label,'cognitionMode','lot')
 assert.equal(draft[label].cognitionMode,'lot')
 draft=update(draft,label,'perQuestionMarks','5')
 assert.equal(draft[label].cognitionMode,'lot')
 draft=update(draft,label,'perQuestionMarks','')
 assert.equal(draft[label].cognitionMode,undefined)
})
