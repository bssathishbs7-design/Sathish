import test from 'node:test'
import assert from 'node:assert/strict'
import { subjectActivityGroups, subjectCategory } from './logbookSubjectGroups.js'
test('certification and remedial attempts stay together without dropping students', () => {
 const rows = [{id:'1',cat:'cert',studentId:'A',date:'2026-09-01',values:{competency:'AN1',activity:'Identify bones'}},{id:'2',cat:'remedial',studentId:'B',date:'2026-09-02',values:{competency:'AN1',activity:'Identify bones'}}]
 const groups=subjectActivityGroups(rows)
 assert.equal(groups.length,1); assert.deepEqual(groups[0].rows.map(e=>e.id),['2','1']); assert.equal(subjectCategory(rows[1]),'cert'); assert.equal(rows[1].cat,'remedial')
})
test('patient identifiers and participation do not split subject activity groups',()=>{
 for(const [cat,values,extra] of [['obg',{recordType:'Antenatal'},{patientId:'P2'}],['proc',{activity:'Venepuncture'},{participation:'Performed'}],['ccp',{diagnosis:'Anaemia'},{ageGender:'45 female'}]]) {
 assert.equal(subjectActivityGroups([{cat,values},{cat,values:{...values,...extra}}]).length,1)
 }
 assert.equal(subjectActivityGroups([{cat:'skill',values:{activity:'A'}},{cat:'cert',values:{activity:'A'}}]).length,2)
})
