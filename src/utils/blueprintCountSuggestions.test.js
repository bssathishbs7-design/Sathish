import test from 'node:test'
import assert from 'node:assert/strict'
import { getBlueprintCountSuggestions } from './blueprintCountSuggestions.js'
const target={totalMarks:100,hotMarks:78}
test('fixed modes cap counts by remaining cognition marks; unfinished rows do not reserve',()=>{
 const draft={'SAQs (Direct)':{perQuestionMarks:'5',cognitionMode:'lot'},'SAQs (Reasoning)':{perQuestionMarks:'4',cognitionMode:'hot'}}
 const before=JSON.stringify(draft)
 assert.equal(getBlueprintCountSuggestions(draft,'SAQs (Direct)',target).cards.at(-1).count,4)
 assert.equal(getBlueprintCountSuggestions(draft,'SAQs (Reasoning)',target).cards.at(-1).count,19)
 assert.equal(JSON.stringify(draft),before)
 draft['SAQs (Direct)'].questionCount='4'
 assert.equal(getBlueprintCountSuggestions({...draft,'SAQs (Aetcom)':{perQuestionMarks:'5',cognitionMode:'lot'}},'SAQs (Aetcom)',target).cards.length,0)
})
test('mixed cards are whole questions within remaining budgets and deduplicated',()=>{
 const draft={MCQs:{perQuestionMarks:'1'},'SAQs (Direct)':{perQuestionMarks:'5',questionCount:'4',cognitionMode:'lot'}}
 const cards=getBlueprintCountSuggestions(draft,'MCQs',target).cards
 assert.ok(cards.length>0 && cards.length<=3)
 assert.equal(new Set(cards.map(c=>c.count)).size,cards.length)
 for(const card of cards){assert.ok(card.lotMarks<=2 && card.hotMarks<=78 && card.marks<=80);assert.equal(card.hotCount+card.lotCount,card.count)}
})
test('LAQ counts use remaining total; invalid marks and exhausted budgets give no cards',()=>{
 assert.equal(getBlueprintCountSuggestions({LAQs:{perQuestionMarks:'10'}},'LAQs',target).cards[0].count,10)
 assert.equal(getBlueprintCountSuggestions({MCQs:{perQuestionMarks:'0'}},'MCQs',target).cards.length,0)
 assert.equal(getBlueprintCountSuggestions({MCQs:{perQuestionMarks:'5'},'SAQs (Direct)':{perQuestionMarks:'1',questionCount:'100',cognitionMode:'lot'}},'MCQs',target).cards.length,0)
})

test('count-only suggestions keep count fixed and fill marks within budgets',()=>{
 const draft={MCQs:{questionCount:'20'}}
 const result=getBlueprintCountSuggestions(draft,'MCQs',target)
 assert.ok(result.cards.length)
 for(const card of result.cards){
  assert.equal(card.count,20)
  assert.equal(card.field,'perQuestionMarks')
  assert.ok(card.after.hot>=0 && card.after.lot>=0 && card.after.total>=0)
 }
 assert.equal(draft.MCQs.perQuestionMarks,undefined)
})
test('both fields preserve the current allocation and offer nearby exact-ratio counts',()=>{
 const draft={MCQs:{perQuestionMarks:'1',questionCount:'20',lockedHotCents:1500}}
 const result=getBlueprintCountSuggestions(draft,'MCQs',{totalMarks:100,hotMarks:75})
 assert.equal(result.cards.length,3)
 assert.equal(result.cards[1].readOnly,true)
 assert.equal(result.cards[1].count,20)
 assert.equal(result.cards[1].hotCount,15)
 assert.equal(result.cards[1].lotCount,5)
 assert.equal(result.cards[0].marksPerQuestion,1)
 assert.deepEqual(result.cards.map(card=>card.count),[100,20,24])
 assert.equal(result.hasMore,true)
})
test('invalid entered counts do not yield replacement suggestions',()=>{
 assert.equal(getBlueprintCountSuggestions({MCQs:{perQuestionMarks:'1',questionCount:'0'}},'MCQs',target).cards.length,0)
 assert.equal(getBlueprintCountSuggestions({MCQs:{perQuestionMarks:'1',questionCount:'101'}},'MCQs',target).cards.length,0)
})

test('four-question example expands without changing the current draft',()=>{
 const draft={MCQs:{perQuestionMarks:'1',questionCount:'4',lockedHotCents:300}}
 const before=JSON.stringify(draft)
 const target={totalMarks:100,hotMarks:75}
 assert.deepEqual(getBlueprintCountSuggestions(draft,'MCQs',target).cards.map(c=>c.count),[100,4,8])
 const expanded=getBlueprintCountSuggestions(draft,'MCQs',target,undefined,undefined,6)
 assert.deepEqual(expanded.cards.map(c=>c.count),[100,4,8,12,16,20])
 for(const c of expanded.cards){assert.equal(c.hotCount/c.count,.75);assert.ok(c.after.hot>=0 && c.after.lot>=0)}
 assert.equal(JSON.stringify(draft),before)
})

test('decimal marks are rejected and sub-one-mark capacity offers no fractional suggestions',()=>{
 assert.equal(getBlueprintCountSuggestions({MCQs:{perQuestionMarks:'0.33',questionCount:'6'}},'MCQs',target).cards.length,0)
 const draft={'SAQs (Application)':{questionCount:'6',cognitionMode:'lot'}}
 const result=getBlueprintCountSuggestions(draft,'SAQs (Application)',{totalMarks:100,hotMarks:98})
 assert.equal(result.cards.length,0)
 assert.match(result.message,/whole-number/)
})

test('pagination is ascending and opens at the current allocation without changing values',()=>{
 const draft={MCQs:{perQuestionMarks:'1',questionCount:'20',lockedHotCents:1500}}
 const result=getBlueprintCountSuggestions(draft,'MCQs',{totalMarks:20,hotMarks:15})
 assert.equal(result.totalCards,20)
 assert.equal(result.currentIndex,0)
 assert.deepEqual(result.getPage(0,3).map(c=>c.count),[20,1,2])
 assert.deepEqual(result.getPage(6,3).map(c=>c.count),[18,19])
 assert.equal(result.getPage(0,3)[0].readOnly,true)
 assert.equal(result.getPage(0,1)[0].count,20)
})

test('completed suggestions are first for every question type and preserve all options',()=>{
 for(const label of ['MCQs','SAQs (Direct)','SAQs (Reasoning)','SAQs (Aetcom)','SAQs (Application)','LAQs']){
  const row={perQuestionMarks:'1',questionCount:'20',...(label.startsWith('SAQs')?{cognitionMode:'both'}:{})}
  const result=getBlueprintCountSuggestions({[label]:row},label,{totalMarks:20,hotMarks:15})
  const cards=result.getPage(0,result.totalCards)
  assert.equal(result.completedFirst,true)
  assert.equal(cards[0].count,20)
  assert.deepEqual(cards[0].after,{total:0,hot:0,lot:0})
  assert.equal(new Set(cards.map(c=>c.count)).size,result.totalCards)
  assert.deepEqual(cards.slice(1).map(c=>c.count),Array.from({length:19},(_,i)=>i+1))
 }
})
