import test from 'node:test'
import assert from 'node:assert/strict'
import { assignInstituteQuestionBankIds } from './questionBankIdentity.js'
const memory=()=>{const rows=new Map();return {getItem:key=>rows.get(key)??null,setItem:(key,value)=>rows.set(key,value)}}
test('approval allocates valid QB IDs after existing permanent sequences',()=>{
 const [question]=assignInstituteQuestionBankIds([{id:'new'}],[{questionBankId:'SRMC-QB-0000130'}],{storage:memory()});assert.equal(question.questionBankId,'SRMC-QB-0000149')
})
test('own approved edit preserves identity; other authors and Medsy derivatives get new IDs',()=>{
 const storage=memory(),original={id:'original',questionBankId:'SRMC-QB-0000130'}
 const rows=assignInstituteQuestionBankIds([{id:'edit',replaceQuestionId:'original'},{id:'other',derivedFrom:original.questionBankId},{id:'medsy-edit',derivedFrom:'MED-QB-0000013'}],[original],{storage})
 assert.equal(rows[0].id,'original');assert.equal(rows[0].questionBankId,original.questionBankId);assert.notEqual(rows[1].questionBankId,original.questionBankId);assert.notEqual(rows[2].questionBankId,rows[1].questionBankId);assert.equal(rows[2].derivedFrom,'MED-QB-0000013')
})
test('legacy bank IDs survive approval and AQ provenance survives conversion',()=>{
 const rows=assignInstituteQuestionBankIds([{id:'old',questionBankId:'INS-A01-00012'},{id:'aq',assessmentQuestionId:'SRMC-AQ-0000013'}],[],{storage:memory()})
 assert.equal(rows[0].questionBankId,'INS-A01-00012');assert.equal(rows[1].derivedFrom,'SRMC-AQ-0000013');assert.equal(rows[1].assessmentQuestionId,undefined)
})
