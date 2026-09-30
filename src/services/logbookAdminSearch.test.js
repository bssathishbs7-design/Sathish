import test from 'node:test'
import assert from 'node:assert/strict'
import { matchesAdminSearch } from './logbookAdminSearch.js'
import { LEARNERS, learnerRegisterId } from './logbookPeople.js'
import { subjectCategory } from './logbookSubjectGroups.js'
test('admin search matches notes, feedback and registration without changing record identity',()=>{
 const person=LEARNERS[0], previous=person.registerId
 try { person.registerId='ROLL-2026-001'; const entry={studentId:person.id,cat:'cert',subject:'Human Anatomy',values:{competency:'AN1'},extra:{notes:'unique reflection',comments:[{text:'review conversation'}]}}
 assert.equal(learnerRegisterId(person.id),'ROLL-2026-001'); assert.ok(matchesAdminSearch(entry,'ROLL-2026-001 reflection')); assert.ok(matchesAdminSearch(entry,'conversation')); assert.ok(!matchesAdminSearch(entry,'missing phrase')); assert.equal(entry.studentId,person.id)
 } finally { person.registerId=previous }
})
test('category membership includes legacy remedial alongside certifiable attempts',()=>{
 assert.deepEqual(['cert','remedial','skill'].map(cat=>subjectCategory({cat})),['cert','cert','skill'])
})
