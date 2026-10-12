import test from 'node:test'
import assert from 'node:assert/strict'
import { getBlueprintOutlinePercentages } from './blueprintOutlinePercentages.js'
const row = (marks, count, cognitionMode) => ({ perQuestionMarks: String(marks), questionCount: String(count), cognitionMode })
test('preview uses whole-question allocation and marks-weighted section totals without mutation', () => {
 const draft = { MCQs: row(1,20), 'SAQs (Direct)': row(5,4,'lot'), 'SAQs (Reasoning)': row(6,5,'hot'), 'SAQs (Aetcom)': row(5,2,'hot'), 'SAQs (Application)': row(5,4,'hot') }
 const before = JSON.stringify(draft)
 const result = getBlueprintOutlinePercentages(draft, { totalMarks:100, hotMarks:78 })
 assert.equal(result.rows.MCQs.hot,90)
 assert.equal(result.rows['SAQs (Direct)'].lot,100)
 assert.deepEqual(result.saq,{hot:75,lot:25,hotCount:11,lotCount:4})
 assert.deepEqual(result.total,{hot:78,lot:22,hotCount:29,lotCount:6})
 assert.equal(JSON.stringify(draft),before)
})
test('incomplete or impossible flexible allocations stay unknown while fixed modes remain visible', () => {
 const result = getBlueprintOutlinePercentages({MCQs:row(1,20),'SAQs (Direct)':row(5,16,'lot')},{totalMarks:100,hotMarks:78})
 assert.equal(result.rows.MCQs,null)
 assert.equal(result.rows['SAQs (Direct)'].lot,100)
 assert.equal(result.total,null)
 assert.equal(getBlueprintOutlinePercentages({}, {totalMarks:100,hotMarks:78}).saq,null)
})
test('LAQ preview preserves existing parts only when its setup quantities match', () => {
 const draft={MCQs:row(1,10),LAQs:row(5,2)}
 const parts=[{splitCount:'1',splits:[{marks:'5',level:'lot'}]},{splitCount:'1',splits:[{marks:'5',level:'lot'}]}]
 const before=JSON.stringify(parts)
 const result=getBlueprintOutlinePercentages(draft,{totalMarks:20,hotMarks:10},{perQuestionMarks:'5',totalMarks:'10'},parts)
 assert.equal(result.rows.LAQs.lot,100)
 assert.equal(result.rows.MCQs.hot,100)
 assert.equal(JSON.stringify(parts),before)
 const changed=getBlueprintOutlinePercentages(draft,{totalMarks:20,hotMarks:10},{perQuestionMarks:'10',totalMarks:'10'},parts)
 assert.equal(changed.rows.LAQs.hot,20)
})

test('Next readiness requires total marks and an exact cognition allocation, including fixed-only rows', () => {
 const target = { totalMarks: 100, hotMarks: 78 }
 const draft = { MCQs: row(1,21), 'SAQs (Direct)':row(5,4,'lot'), 'SAQs (Reasoning)':row(3,6,'both'), 'SAQs (Aetcom)':row(3,6,'hot'), 'SAQs (Application)':row(3,1,'lot'), LAQs:row(10,2) }
 assert.equal(getBlueprintOutlinePercentages(draft,target).ready,false)
 draft['SAQs (Application)'].cognitionMode='hot'
 assert.equal(getBlueprintOutlinePercentages(draft,target).ready,true)
 draft.MCQs.questionCount='20'
 assert.equal(getBlueprintOutlinePercentages(draft,target).ready,false)
 assert.equal(getBlueprintOutlinePercentages({'SAQs (Direct)':row(1,100,'lot')},target).ready,false)
})

test('partial MCQ preview rounds to whole questions without enabling breakdown', () => {
 const draft={MCQs:row(5,15),'SAQs (Direct)':{cognitionMode:'hot',perQuestionMarks:'5'}}
 const before=JSON.stringify(draft)
 const result=getBlueprintOutlinePercentages(draft,{totalMarks:100,hotMarks:78})
 assert.equal(result.rows.MCQs.hotCount,11)
 assert.equal(result.rows.MCQs.lotCount,4)
 assert.equal(result.rows.MCQs.provisional,true)
 assert.equal(result.rows['SAQs (Direct)'],null)
 assert.equal(result.ready,false)
 assert.equal(JSON.stringify(draft),before)
})
test('partial previews reserve fixed marks and respect both cognition budgets', () => {
 const draft={MCQs:row(5,10),'SAQs (Direct)':row(5,4,'lot')}
 const result=getBlueprintOutlinePercentages(draft,{totalMarks:100,hotMarks:78})
 assert.equal(result.rows.MCQs.hot,100)
 assert.equal(result.rows['SAQs (Direct)'].lot,100)
 assert.equal(result.ready,false)
 const laq=getBlueprintOutlinePercentages({LAQs:row(10,2)},{totalMarks:100,hotMarks:78})
 assert.equal(laq.rows.LAQs.hot,78)
 assert.equal(laq.rows.LAQs.lot,22)
 assert.equal(laq.ready,false)
})
