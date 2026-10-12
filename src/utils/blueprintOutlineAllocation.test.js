import test from 'node:test'
import assert from 'node:assert/strict'
import { allocateBlueprintOutline } from './blueprintOutlineAllocation.js'
const target = { totalMarks: 100, hotMarks: 75 }
const draft = { MCQs: { perQuestionMarks: '1', questionCount: '20' }, 'SAQs (Direct)': { perQuestionMarks: '5', questionCount: '5', cognitionMode: 'lot' }, 'SAQs (Reasoning)': { perQuestionMarks: '5', questionCount: '11', cognitionMode: 'both' } }
test('Next fits exact targets with fixed modes and does not mutate input', () => {
 const before = structuredClone(draft)
 const result = allocateBlueprintOutline(draft, target)
 assert.equal(result.error, undefined)
 assert.equal(result.draft.MCQs.hotQuestions, '20')
 assert.equal(result.draft['SAQs (Direct)'].lotQuestions, '5')
 assert.equal(result.draft['SAQs (Reasoning)'].hotQuestions, '11')
 assert.deepEqual(draft, before)
})
test('impossible fixed selections and denominations explain the failure', () => {
 assert.match(allocateBlueprintOutline(draft, { ...target, hotMarks: 80 }).error, /Fixed LoT/)
 assert.match(allocateBlueprintOutline({ MCQs: { perQuestionMarks: '5', questionCount: '20' } }, { ...target, hotMarks: 78 }).error, /whole-question/)
})
test('LAQ unfinished parts reserve residual marks; complete parts stay fixed', () => {
 const setup = { MCQs: { perQuestionMarks: '1', questionCount: '90' }, LAQs: { perQuestionMarks: '10', questionCount: '1' } }
 const pending = allocateBlueprintOutline(setup, target)
 assert.equal(Number(pending.draft.MCQs.hotQuestions) + pending.laqTarget.hot, 75)
 const parts = [{ splitCount: '2', splits: [{ marks: '3', level: 'lot' }, { marks: '7', level: 'hot' }] }]
 const before = structuredClone(parts)
 const result = allocateBlueprintOutline(setup, target, parts)
 assert.equal(result.draft.MCQs.hotQuestions, '68')
 assert.deepEqual(result.laqTarget, { hot: 7, lot: 3 })
 assert.deepEqual(parts, before)
})

test('MCQs prefer 75/25 while remaining rows balance the overall 70/30 target',()=>{
 const draft={MCQs:{perQuestionMarks:'1',questionCount:'20'},'SAQs (Direct)':{perQuestionMarks:'5',questionCount:'3',cognitionMode:'lot'},'SAQs (Reasoning)':{perQuestionMarks:'5',questionCount:'4',cognitionMode:'both',lockedHotCents:1500},'SAQs (Aetcom)':{perQuestionMarks:'5',questionCount:'1',cognitionMode:'hot'},'SAQs (Application)':{perQuestionMarks:'5',questionCount:'4',cognitionMode:'both',lockedHotCents:2000},LAQs:{perQuestionMarks:'10',questionCount:'2'}}
 const result=allocateBlueprintOutline(draft,{totalMarks:100,hotMarks:70})
 assert.equal(result.error,undefined)
 assert.equal(result.draft.MCQs.hotQuestions,'15')
 assert.equal(result.draft.MCQs.lotQuestions,'5')
 assert.deepEqual(result.laqTarget,{hot:15,lot:5})
 assert.equal(15+40+result.laqTarget.hot,70)
 assert.equal(5+20+result.laqTarget.lot,30)
})
