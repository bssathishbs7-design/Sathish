import { populateSampleStages } from './studentSamples.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { sampleDirectory, applyStudentCommand, deleteStudents } from './studentManagement.js'
import { validateStudent, migrateDirectory, currentEntry } from './studentModel.js'
import { STUDENT_COLUMNS, previewStudentSheet } from './studentImport.js'
const edit = (data, command) => applyStudentCommand(data, command, { canEdit: true })
const seed = () => sampleDirectory()
const draft = { registrationId: 'NEW001', name: 'New Student', email: 'new@example.edu', code: '+91', phone: '9876543210', batch: '2026', course: 'MBBS', section: 'A', department: 'N/A', academicYear: '2026-2027', joinedOn: '2026-08-01' }
const move = { type: 'move', ids: ['student-1'], action: 'promote', date: '2027-07-01', academicYear: '2027-2028' }
test('migration retains audit and only reconstructs the known current attempt', () => {
 const data=seed(); data.version=1; delete data.students[0].entries; delete data.students[0].trackingId
 const next=migrateDirectory(data)
 assert.equal(next.version,2); assert.equal(next.students[0].entries.length,1); assert.deepEqual(next.students[0].history,data.students[0].history)
 assert.equal(new Set(next.students.map(s=>s.trackingId)).size,next.students.length)
 assert.deepEqual(migrateDirectory(next),next)
})
test('tracking IDs are unique and never reused after deletion', () => {
 const first=edit(seed(),{type:'save',draft}), student=first.students.at(-1)
 assert.equal(student.year,'First Year'); assert.ok(student.trackingId.startsWith('MDS-2026-'))
 const removed=edit(first,{type:'delete',ids:[student.id],acknowledged:true})
 const next=edit(removed,{type:'save',draft}).students.at(-1)
 assert.notEqual(next.trackingId,student.trackingId)
 assert.throws(()=>edit(first,{type:'delete',ids:[student.id]}),/acknowledge/)
})
test('edits validate changed fields and keep identity/batch fixed', () => {
 const data=seed(), original=data.students[0]; original.phone='legacy invalid'
 const updated=edit(data,{type:'save',draft:{...original,name:'Changed Name',batch:'2025',year:'Internship'}}).students[0]
 assert.equal(updated.batch,original.batch);assert.equal(updated.trackingId,original.trackingId);assert.equal(updated.year,original.year)
 assert.equal(updated.phone,'legacy invalid')
})
test('onboarding validates bounded earlier batches, fields and duplicate phones', () => {
 assert.ok(validateStudent({...draft,phone:seed().students[0].phone},seed()).phone)
 assert.ok(validateStudent({...draft,name:'A'},seed()).name)
 assert.ok(validateStudent({...draft,registrationId:'x'.repeat(41)},seed()).registrationId)
 assert.ok(validateStudent({...draft,batch:'2025'},seed()).batchReason)
 assert.ok(validateStudent({...draft,academicYear:'2040-2041',batch:'2026',batchReason:'Other'},seed()).batch)
})
test('batch start accepts the following year and rejects duplicate/invalid batches', () => {
 const batch={id:'2024',course:'MBBS',startsOn:'2025-08-01'}
 const data=edit(seed(),{type:'batch',batch});assert.equal(data.batches.length,5)
 assert.throws(()=>edit(data,{type:'batch',batch}),/already/)
 assert.throws(()=>edit(seed(),{type:'batch',batch:{...batch,startsOn:'2026-01-01'}}),/start date/)
})
test('permissions default to read-only and stale profile saves fail', () => {
 assert.throws(()=>applyStudentCommand(seed(),{type:'batch',batch:{}}),/read-only/)
 const data=seed(), original=data.students[0], changed=edit(data,{type:'status',id:original.id,reason:'On leave'})
 assert.throws(()=>edit(changed,{type:'save',draft:original}),/changed since/)
})
test('promotion closes the old attempt and opens next at the same move date by default', () => {
 const original=seed(), data=edit(original,move), student=data.students[0]
 assert.equal(student.entries[0].end,move.date);assert.equal(student.entries[0].outcome,'Promoted')
 assert.equal(currentEntry(student).start,move.date);assert.equal(student.year,'Second Year');assert.equal(student.batch,'2026')
 assert.equal(original.students[0].entries.length,1)
})
test('repeat preserves separate attempts in the same year', () => {
 const student=edit(seed(),{...move,action:'repeat'}).students[0]
 assert.equal(student.entries.length,2);assert.equal(student.year,'First Year');assert.equal(student.entries[0].outcome,'Not promoted')
})
test('invalid/mixed/inactive progression rejects the entire transaction', () => {
 for(const command of [{...move,ids:['student-1','student-3']},{...move,ids:['student-4']},{...move,date:'2026-08-01'},{...move,startsOn:'2027-06-01'},{...move,academicYear:'2026-2027'}]) assert.throws(()=>edit(seed(),command))
 const data=seed(), before=JSON.stringify(data);assert.throws(()=>edit(data,{...move,ids:['student-1','missing']}));assert.equal(JSON.stringify(data),before)
})
test('completion closes internship, leaves no current entry and preserves account status', () => {
 const data=edit(seed(),{...move,ids:['student-7'],action:'complete'}), student=data.students[6]
 assert.equal(student.year,'Graduated');assert.equal(student.completedOn,move.date);assert.equal(student.status,'Active');assert.equal(currentEntry(student),undefined)
 assert.throws(()=>edit(seed(),{...move,action:'complete'}),/Only interns/)
 assert.throws(()=>edit(seed(),{...move,ids:['student-7'],action:'repeat'}),/Complete course/)
})
test('undo preserves later profile, SGT and account edits', () => {
 let data=edit(seed(),move)
 data=edit(data,{type:'save',draft:{...data.students[0],name:'Updated Person',section:'B'}})
 data=edit(data,{type:'status',id:'student-1',reason:'Leave'})
 const next=edit(data,{type:'undo',moveId:data.moves[0].id,reason:'Wrong selection'}).students[0]
 assert.equal(next.year,'First Year');assert.equal(next.name,'Updated Person');assert.equal(next.section,'B');assert.equal(next.status,'Inactive')
 assert.equal(currentEntry(next).section,'B')
})
test('partial undo leaves others untouched and repeated undo fails', () => {
 const moved=edit(seed(),{...move,ids:['student-1','student-2']})
 const cmd={type:'undo',moveId:moved.moves[0].id,ids:['student-1'],reason:'Wrong student'}
 const data=edit(moved,cmd);assert.equal(data.students[0].year,'First Year');assert.equal(data.students[1].year,'Second Year');assert.throws(()=>edit(data,cmd),/already/)
})
test('decision correction flips only latest outcome and invalidates original undo', () => {
 const moved=edit(seed(),move), s=moved.students[0]
 const data=edit(moved,{type:'correctDecision',id:s.id,entryId:s.entries[0].id,academicRevision:s.academicRevision,reason:'Incorrect result'})
 assert.equal(data.students[0].year,'First Year');assert.equal(currentEntry(data.students[0]).start,move.date)
 assert.throws(()=>edit(data,{type:'undo',moveId:moved.moves[0].id,reason:'Try reversal'}),/newer academic/)
})
test('year corrections enforce chronology and cannot change academic identity', () => {
 const moved=edit(seed(),move), s=moved.students[0]
 const cmd={type:'correct',id:s.id,entryId:s.entries[0].id,academicRevision:s.academicRevision,startsOn:'2026-08-02',endsOn:move.date,section:'B',reason:'Date correction',batch:'2021',year:'Internship'}
 const next=edit(moved,cmd).students[0];assert.equal(next.batch,'2026');assert.equal(next.year,'Second Year')
 assert.throws(()=>edit(moved,{...cmd,endsOn:'2028-01-01'}),/overlap/)
 assert.throws(()=>edit(moved,{...cmd,entryId:currentEntry(s).id,startsOn:move.date}),/current year/)
})
test('subject-specific syllabus defaults, overrides and reset persist separately', () => {
 let data=edit(seed(),{type:'syllabus',batch:'2026',year:'First Year',subjects:['Human Anatomy'],syllabus:'CBME 2019'})
 data=edit(data,{type:'syllabus',id:'student-1',year:'First Year',subjects:['Human Anatomy'],syllabus:'CBME 2024'})
 assert.equal(data.students[0].subjectSyllabuses['First Year:Human Anatomy'],'CBME 2024')
 data=edit(data,{type:'syllabus',id:'student-1',year:'First Year',subjects:['Human Anatomy'],syllabus:''})
 assert.equal(data.students[0].subjectSyllabuses['First Year:Human Anatomy'],undefined)
})
test('bulk setup applies to every legacy student in the selected stage', () => {
 const data=seed();data.students.push({...structuredClone(data.students[7]),id:'legacy-2',trackingId:'MDS-2021-9999'})
 const next=edit(data,{type:'bulkSetup',year:'Internship',joinedOn:'2021-08-01',startsOn:'2026-08-01',academicYear:'2026-2027',reason:'Verified records'})
 assert.equal(next.students.filter(s=>!s.tracked).length,0)
})
test('import master columns, batch date fallback, duplicate phones and stage conflicts', () => {
 const row=['NEW001','New Student','new@example.edu','+91','9876543210','A']
 const preview=previewStudentSheet([STUDENT_COLUMNS,row,row],'2026',seed())
 assert.equal(preview[0].errors.length,0);assert.equal(preview[0].draft.joinedOn,'2026-08-01');assert.ok(preview[1].errors.some(e=>e.includes('phone')))
 const invalid=previewStudentSheet([[...STUDENT_COLUMNS,'Year'],[...row,'Second Year']],'2026',seed());assert.ok(invalid[0].errors.length)
 assert.throws(()=>edit(seed(),{type:'import',rows:preview.map(r=>r.draft)}),/already exists/)
})
test('batch deletion retains tracking counters', () => {
 const data=seed(), counters=structuredClone(data.counters)
 const next=edit(data,{type:'deleteBatch',batch:'2026',confirm:'2026'});assert.deepEqual(next.counters,counters)
 assert.throws(()=>edit(data,{type:'deleteBatch',batch:'2026',confirm:'wrong'}),/confirm/)
})
test('sequential deletion reports partial failure accurately', async () => {
 const result=await deleteStudents(['a','b'],{canEdit:true},async command=>{if(command.ids[0]==='b')throw Error('Network failed')})
 assert.deepEqual(result.deleted,['a']);assert.equal(result.failed[0].id,'b')
})

test('stale progression requests and stale corrections cannot overwrite newer academic work', () => {
 const original=seed(), revisions={'student-1':original.students[0].academicRevision}
 const moved=edit(original,{...move,expectedAcademicRevisions:revisions})
 assert.throws(()=>edit(moved,{...move,date:'2028-07-01',academicYear:'2028-2029',expectedAcademicRevisions:revisions}),/newer academic/)
 const s=moved.students[0]
 assert.throws(()=>edit(moved,{type:'correctDecision',id:s.id,entryId:s.entries[0].id,academicRevision:0,reason:'Incorrect choice'}),/changed/)
})
test('completion undo restores Internship without changing later account state', () => {
 let data=edit(seed(),{...move,ids:['student-7'],action:'complete'})
 data=edit(data,{type:'status',id:'student-7',reason:'Account paused'})
 const undone=edit(data,{type:'undo',moveId:data.moves[0].id,reason:'Completed in error'}).students[6]
 assert.equal(undone.year,'Internship');assert.equal(undone.graduated,false);assert.equal(undone.completedOn,null);assert.equal(undone.status,'Inactive');assert.ok(currentEntry(undone))
})

test('N/A SGT saves and remains valid when correcting year dates', () => {
 const data=edit(seed(),{type:'save',draft:{...draft,section:'N/A'}})
 const student=data.students.at(-1), entry=currentEntry(student)
 assert.equal(student.section,'N/A'); assert.equal(entry.section,'N/A')
 const next=edit(data,{type:'correct',id:student.id,entryId:entry.id,academicRevision:student.academicRevision,startsOn:entry.start,section:'N/A',reason:'Confirm date'})
 assert.equal(next.students.at(-1).section,'N/A')
})

test('samples cover every batch and stage without replacing existing records', () => {
 const original=sampleDirectory({complete:false}), data=populateSampleStages(original)
 for(const batch of data.batches) for(const stage of ['First Year','Second Year','Third Year','Fourth Year','Internship','Graduated']) assert.ok(data.students.some(s=>s.batch===batch.id&&s.year===stage&&s.tracked))
 assert.equal(new Set(data.students.map(s=>s.trackingId)).size,data.students.length)
 for(const student of original.students) assert.deepEqual(data.students.find(s=>s.id===student.id),student)
 assert.deepEqual(populateSampleStages(data),data)
})

test('empty batch shortcut rejects populated batches and respects permissions', () => {
 const data=seed(); data.batches.push({id:'2035',course:'MBBS',startsOn:'2035-08-01'})
 const command={type:'deleteBatch',batch:'2035',emptyOnly:true}
 assert.equal(edit(data,command).batches.some(b=>b.id==='2035'),false)
 assert.throws(()=>applyStudentCommand(data,command),/read-only/)
 assert.throws(()=>edit(data,{...command,batch:'2026'}),/contains students/)
 assert.equal(data.batches.some(b=>b.id==='2035'),true)
})


test('future batch start dates are valid for automatic joining dates', () => {
 const data=seed(); data.batches.push({id:'2035',course:'MBBS',startsOn:'2035-08-01'})
 const future={...draft,batch:'2035',academicYear:'2035-2036',joinedOn:'2035-08-01'}
 assert.equal(validateStudent(future,data).joinedOn,undefined)
 assert.equal(edit(data,{type:'save',draft:future}).students.at(-1).joinedOn,'2035-08-01')
 assert.ok(validateStudent({...future,joinedOn:'2034-08-01'},data).joinedOn)
 assert.ok(validateStudent({...future,joinedOn:'2035-09-01'},data).joinedOn)
})

test('progression retains before and after snapshots when the operation is undone', () => {
 const data=edit(seed(),move)
 const operation=data.moves[0], member=operation.students[0]
 const student=data.students.find(row=>row.id===member.before.id)
 assert.equal(member.beforeAcademic.year,'First Year')
 assert.equal(member.afterAcademic.year,'Second Year')
 assert.equal(member.afterAcademic.academicYear,move.academicYear)
 assert.deepEqual(member.afterAcademic.entries,student.entries)
 const after=structuredClone(member.afterAcademic)
 const undone=edit(data,{type:'undo',moveId:operation.id,reason:'Wrong selection'})
 assert.deepEqual(undone.moves[0].students[0].afterAcademic,after)
 assert.equal(undone.students.find(row=>row.id===member.before.id).year,'First Year')
})

test('batch-scoped setup leaves other batches untracked', () => {
 const data=seed()
 data.students.push({...structuredClone(data.students[7]),id:'other-batch-legacy',batch:'2023',trackingId:'MDS-2023-9999'})
 const next=edit(data,{type:'bulkSetup',batch:'2021',year:'Internship',joinedOn:'2021-08-01',startsOn:'2026-08-01',academicYear:'2026-2027',reason:'Verified records'})
 assert.equal(next.students.find(s=>s.id===data.students[7].id).tracked,true)
 assert.equal(next.students.find(s=>s.id==='other-batch-legacy').tracked,false)
})

test('six-column imports derive admission details and default optional SGT', () => {
 const data=seed(), row=['NEW001','New Student','new@example.edu','+91','9876543210','']
 assert.deepEqual(STUDENT_COLUMNS,['Student ID','Student Name','Email','Code','Phone No','SGT'])
 const preview=previewStudentSheet([STUDENT_COLUMNS,row],'2026',data)
 assert.deepEqual(preview[0].errors,[])
 assert.equal(preview[0].draft.section,'N/A')
 assert.equal(preview[0].draft.course,'MBBS')
 assert.equal(preview[0].draft.department,'N/A')
 assert.equal(preview[0].draft.joinedOn,'2026-08-01')
 const next=edit(data,{type:'import',rows:preview.map(item=>item.draft)})
 assert.equal(next.students.at(-1).academicYear,'2026-2027')
 assert.equal(next.students.at(-1).year,'First Year')
 assert.deepEqual(previewStudentSheet([STUDENT_COLUMNS.slice(0,5),row.slice(0,5)],'2026',data)[0].errors,[])
 for(let index=0;index<5;index++) {
  const missing=[...row]; missing[index]=''
  assert.ok(previewStudentSheet([STUDENT_COLUMNS,missing],'2026',data)[0].errors.includes(STUDENT_COLUMNS[index]+' is required.'))
 }
 const invalid=[...row];invalid[5]='Z'
 assert.ok(previewStudentSheet([STUDENT_COLUMNS,invalid],'2026',data)[0].errors.some(error=>error.includes('SGT')))
 assert.throws(()=>previewStudentSheet([STUDENT_COLUMNS.slice(1),row.slice(1)],'2026',data),/Missing columns: Student ID/)
})
