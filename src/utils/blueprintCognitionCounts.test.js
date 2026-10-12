import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeCognitionCounts, formatCognitionCount } from './blueprintCognitionCounts.js'
test('reference example keeps LAQ parts separate from whole questions', () => {
 const rows=[{label:'MCQs',hotCount:14,lotCount:6},{label:'SAQs',hotCount:8,lotCount:4},{label:'LAQs',hotCount:2,lotCount:1}]
 const counts=summarizeCognitionCounts(rows)
 assert.deepEqual(counts,{hot:{questions:22,parts:2},lot:{questions:10,parts:1}})
 assert.equal(formatCognitionCount(counts.hot),'22 Questions + 2 Parts')
 assert.equal(formatCognitionCount(counts.lot),'10 Questions + 1 Part')
})
test('setup preview and empty counts retain clear units',()=>{
 assert.deepEqual(summarizeCognitionCounts([null,{parts:true,hotCount:1,lotCount:0}]).hot,{questions:0,parts:1})
 assert.equal(formatCognitionCount({parts:1}),'1 Part')
 assert.equal(formatCognitionCount({questions:1}),'1 Question')
 assert.equal(formatCognitionCount({questions:0,parts:0}),'-')
})
