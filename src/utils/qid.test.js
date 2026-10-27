import test from 'node:test'
import assert from 'node:assert/strict'
import { formatQid, parseQid, mintQids, sameQid, compareQids, MAX_SEQUENCE } from './qid.js'
import { createDraftRecordCode, parseDraftId } from './draftReference.js'
import { searchQuestionIds } from './questionSearch.js'
const memory = () => { const rows = new Map(); return { getItem: key => rows.get(key) ?? null, setItem: (key,value) => rows.set(key,value), removeItem:key=>rows.delete(key), key:index=>[...rows.keys()][index], get length(){return rows.size} } }
test('Damm examples, widths, aliases and namespace restrictions', () => {
  assert.equal(formatQid('AP',14),'SRMC-AP-00149')
  assert.equal(formatQid('QB',13),'SRMC-QB-0000130')
  assert.equal(formatQid('BP',1),'SRMC-BP-00013')
  assert.equal(parseQid('srmc qb 130').canonical,formatQid('QB',13))
  assert.equal(parseQid('SRMCQB0000130').canonical,formatQid('QB',13))
  assert.ok(sameQid('SRMC-AS-13','SRMC-AQ-0000013'))
  for (const value of ['DRF-AP-VBP442','DRFAPVBP442','SRMC-QB-0000131']) assert.equal(parseQid(value),null)
  assert.throws(()=>formatQid('AP',1,'DRFABC'))
  assert.throws(()=>formatQid('AP',MAX_SEQUENCE+1))
})
test('every single digit error and distinct adjacent transposition is rejected', () => {
  const id=formatQid('QB',123456), digits=id.split('-')[2]
  for(let i=0;i<digits.length;i++) {
    for(let digit=0;digit<10;digit++) if(String(digit)!==digits[i]) assert.equal(parseQid('SRMC-QB-'+digits.slice(0,i)+digit+digits.slice(i+1)),null)
    if(i+1<digits.length && digits[i]!==digits[i+1]) assert.equal(parseQid('SRMC-QB-'+digits.slice(0,i)+digits[i+1]+digits[i]+digits.slice(i+2)),null)
  }
})
test('ledger survives counter clearing and deletion; stored records recover the high watermark', () => {
  const storage=memory()
  assert.equal(mintQids('AP',1,{storage})[0],'SRMC-AP-00210')
  const first=mintQids('QB',2,{storage})
  storage.removeItem('vx-qid-sequences')
  assert.equal(parseQid(mintQids('QB',1,{storage})[0]).sequence,3)
  storage.setItem('records',JSON.stringify([{questionBankId:formatQid('QB',90)}]))
  assert.equal(parseQid(mintQids('QB',1,{storage})[0]).sequence,91)
  assert.equal(new Set(first).size,2)
})
test('overflow refuses the entire batch without advancing either registry', () => {
  const storage=memory();storage.setItem('vx-qid-sequences',JSON.stringify({'SRMC:QB':MAX_SEQUENCE-1}))
  assert.throws(()=>mintQids('QB',2,{storage}),/exhausted/)
  assert.equal(storage.getItem('vx-qid-issued'),null)
  assert.equal(JSON.parse(storage.getItem('vx-qid-sequences'))['SRMC:QB'],MAX_SEQUENCE-1)
})
test('drafts are unique and typed; ambiguous input is normalised only as a draft', () => {
  const ids=Array.from({length:100},()=>createDraftRecordCode('QB'))
  assert.equal(new Set(ids).size,100)
  assert.ok(ids.every(id=>/^DRF-QB-[0-9A-HJKMNP-TV-Z]{6}$/.test(id)))
  assert.equal(parseDraftId('QB7K2M9Q'),'DRF-QB-7K2M9Q')
  assert.equal(parseDraftId('drf qb OIL234'),'DRF-QB-011234')
})
test('ID search supports drafts, lists, paper lookup, deleted IDs and typo suggestions', () => {
  const rows=[{id:'q1',questionBankId:formatQid('QB',13),draftCode:'DRF-QB-7K2M9Q'},{id:'q2',questionBankId:formatQid('QB',14)}]
  assert.equal(searchQuestionIds(rows,'130; SRMC QB 149').questions.length,2)
  assert.match(searchQuestionIds(rows,'QB7K2M9Q').messages[0],/approved as/)
  assert.match(searchQuestionIds(rows,'SRMC-QB-0000131').messages[0],/did you mean/)
  const assessment={assessmentCode:formatQid('AP',21),assessmentName:'Paper',questionRows:[rows[0],{id:'own',assessmentQuestionId:formatQid('AQ',1)}]}
  assert.equal(searchQuestionIds(rows,assessment.assessmentCode,{assessments:[assessment]}).questions.length,1)
  assert.match(searchQuestionIds([],formatQid('QB',1),{deleted:[{questionBankId:formatQid('QB',1),deletedAt:'2026-10-27',reason:'Duplicate'}]}).messages[0],/Duplicate/)
  assert.ok(compareQids(formatQid('QB',99),formatQid('QB',100))<0)
  assert.ok(compareQids('DRF-QB-7K2M9Q',formatQid('QB',1))>0)
})
