import test from 'node:test'
import assert from 'node:assert/strict'
import { createLaqParts, completeLaqRemainder } from './blueprintLaqParts.js'
test('creates one HoT part for six marks and exact mixed parts across questions', () => {
 assert.deepEqual(createLaqParts(6, 1, { hot: 6, lot: 0 }), [{ splitCount: '1', splits: [{ marks: '6', level: 'hot' }] }])
 const rows = createLaqParts(6, 2, { hot: 8, lot: 4 })
 assert.deepEqual(rows.map(row=>row.splits.map(part=>part.marks)), [['2','4'],['2','4']])
 assert.equal(createLaqParts(6,1,{hot:5,lot:0}).length,0)
})
test('reducing marks fills the remainder and never changes other questions', () => {
 const rows = createLaqParts(6, 2, { hot: 12, lot: 0 })
 rows[0].splits[0].marks = '4'
 const result = completeLaqRemainder(rows,0,6,{hot:12,lot:0})
 assert.deepEqual(result[0].splits.map(part=>part.marks),['4','2'])
 assert.equal(result[1],rows[1])
 assert.equal(rows[0].splits.length,1)
 result[0].splits[0].marks='5'
 assert.deepEqual(completeLaqRemainder(result,0,6,{hot:12,lot:0})[0].splits.map(part=>part.marks),['5','1'])
 result[0].splits[0].marks='6'
 assert.equal(completeLaqRemainder(result,0,6,{hot:12,lot:0})[0].splits.length,1)
})
test('mixed remainder uses both levels; invalid edits do not force an allocation', () => {
 const rows=[{splitCount:'1',splits:[{marks:'2',level:'lot'}]}]
 const result=completeLaqRemainder(rows,0,6,{hot:3,lot:3})
 assert.deepEqual(result[0].splits.map(p=>[p.marks,p.level]),[['2','lot'],['1','lot'],['3','hot']])
 assert.equal(completeLaqRemainder(rows,0,1,{hot:0,lot:1}),rows)
 assert.equal(completeLaqRemainder([{splitCount:'1',splits:[{marks:'',level:'hot'}]}],0,6,{hot:6,lot:0})[0].splits.length,1)
})

test('completed LAQ removes blank placeholders while preserving valid parts and cognition', async () => {
 const { normalizeCompletedLaq } = await import('./blueprintLaqParts.js')
 const input={splitCount:'5',splits:[{marks:'5',level:'lot'},{marks:'5',level:'hot'},{marks:'',level:'lot'},{marks:'',level:'lot'},{marks:'',level:'hot'}]}
 const result=normalizeCompletedLaq(input,10)
 assert.equal(result.splitCount,'2')
 assert.deepEqual(result.splits,input.splits.slice(0,2))
 assert.equal(input.splits.length,5)
 assert.equal(normalizeCompletedLaq(result,10),result)
 assert.equal(normalizeCompletedLaq(input,15),input)
 assert.equal(normalizeCompletedLaq(input,5),input)
})

 test('LAQ validation explains excess, missing and invalid marks', async () => {
 const { getLaqSplitError } = await import('./blueprintLaqParts.js')
 const parts = values => values.map(marks => ({marks:String(marks),level:'hot'}))
 assert.equal(getLaqSplitError(parts([10,3,6]),10),'19 / 10 marks allocated. Reduce the split marks by 9.')
 assert.match(getLaqSplitError(parts([3,4]),10),/remaining 3/)
 assert.match(getLaqSplitError(parts([0.5,9.5]),10),/whole number/)
 assert.equal(getLaqSplitError(parts([3,2,5]),10),'')
 })
