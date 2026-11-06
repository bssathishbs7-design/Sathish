import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarSampleDirectory } from './studentCalendarData.js'
import { initialFacultyState, applyFacultyCommand, normaliseAssignment } from './facultyAssignments.js'
import { previewAssignment, assignmentChanges, contexts, effectiveFacultyRoster, assignmentStatus } from './facultyAcademicContext.js'
import { profileErrors } from './facultyModel.js'
import { previewFacultyImport, FACULTY_COLUMNS } from './facultyImport.js'

const date='2026-11-04', options={canEdit:true,actor:'Test administrator',date}
const fixture=()=>{const directory=calendarSampleDirectory();const data=initialFacultyState('test',directory,date);return {directory,data}}
const command=(data,values)=>({...values,requestId:crypto.randomUUID(),expectedRevision:data.revision})
const save=(data,directory,values)=>applyFacultyCommand(data,command(data,values),directory,options)
function draftFor(data,directory,values={}) {
  return normaliseAssignment({facultyId:'faculty-rahul',studyYear:'First Year',subjectId:'physiology',scopeType:'WHOLE_BATCH',roleType:'PRIMARY',calendarRefs:contexts(directory,'First Year').filter(c=>c.batchId==='2026'),startsOn:date,endsOn:'2027-07-31',...values},data.institutionId)
}
function publish(data,directory,draft) {
  return save(data,directory,{type:'publish',draft,fingerprint:previewAssignment(draft,data,directory,date).fingerprint})
}
test('profile edit preserves all teaching memberships and rejects duplicate identities',()=>{
 const {data,directory}=fixture(),before=structuredClone(data.assignments)
 const draft={...data.faculty[0],phone:'+91 9876543210'}
 const next=save(data,directory,{type:'profile',draft})
 assert.deepEqual(next.assignments,before)
 assert.ok(profileErrors({...draft,email:data.faculty[1].email},data).email)
})
test('permission and optimistic revisions are enforced',()=>{
 const {data,directory}=fixture(),c=command(data,{type:'profile',draft:data.faculty[0]})
 assert.throws(()=>applyFacultyCommand(data,c,directory,{...options,canEdit:false}),/read-only/)
 assert.throws(()=>applyFacultyCommand(data,{...c,expectedRevision:99},directory,options),/changed/)
})
test('whole batch includes N/A and repeaters, excludes inactive students',()=>{
 const {data,directory}=fixture();directory.students[2].section='N/A'
 const preview=previewAssignment(draftFor(data,directory),data,directory,date)
 assert.ok(preview.members.some(m=>m.sectionAtAssignment==='N/A'))
 assert.ok(preview.members.some(m=>m.admissionBatchId!==m.teachingBatchId))
 assert.ok(preview.excluded.some(m=>m.studentId===directory.students[9].id))
})
test('SGT selection excludes ungrouped and other groups; intentional exclusions persist',()=>{
 const {data,directory}=fixture();directory.students[2].section='N/A';directory.students[3].section='B'
 const draft=draftFor(data,directory,{scopeType:'SGT',selectedSgtValues:['A'],excludedStudentIds:[directory.students[4].id],exclusionReason:'Allocated separately'})
 const next=publish(data,directory,draft),a=next.assignments.at(-1)
 assert.ok(a.members.every(m=>m.sectionAtAssignment==='A'))
 assert.ok(!a.members.some(m=>m.studentId===directory.students[4].id))
 assert.equal(assignmentChanges(a,next,directory).needsReview,false)
})
test('whole batch cannot hide intentional exclusions',()=>{
 const {data,directory}=fixture()
 assert.throws(()=>publish(data,directory,draftFor(data,directory,{excludedStudentIds:[directory.students[2].id],exclusionReason:'Hide'})),/Whole batch/)
})
test('mismatched calendars and invalid dates are rejected',()=>{
 const {data,directory}=fixture()
 const draft=draftFor(data,directory,{calendarRefs:contexts(directory,'First Year')})
 assert.ok(previewAssignment(draft,data,directory,date).errors.some(e=>/calendar dates/.test(e)))
 assert.throws(()=>publish(data,directory,draftFor(data,directory,{endsOn:'2026-02-31'})),/valid dates/)
})
test('one primary across scopes and same-faculty duplicates are rejected',()=>{
 const {data,directory}=fixture()
 const draft=draftFor(data,directory,{facultyId:'faculty-anika',subjectId:'human-anatomy',scopeType:'SGT',selectedSgtValues:['A']})
 assert.ok(previewAssignment(draft,data,directory,date).errors.some(e=>/overlapping/.test(e)))
})
test('co-teacher must be covered by a primary and may not be its faculty',()=>{
 const {data,directory}=fixture()
 const draft=draftFor(data,directory,{facultyId:'faculty-anika',subjectId:'human-anatomy',roleType:'CO_TEACHER',primaryAssignmentId:'sample-anatomy-primary'})
 assert.ok(previewAssignment(draft,data,directory,date).errors.some(e=>/primary/.test(e)))
 const noPrimary={...draft,facultyId:'faculty-farhan',primaryAssignmentId:'missing'}
 assert.ok(previewAssignment(noPrimary,data,directory,date).errors.length)
})
test('stale student preview rejects publication without changing original state',()=>{
 const {data,directory}=fixture(),draft=draftFor(data,directory),fingerprint=previewAssignment(draft,data,directory,date).fingerprint
 directory.students[2].section='B';directory.students[2].academicRevision++
 assert.throws(()=>save(data,directory,{type:'publish',draft,fingerprint}),/roster or context changed/)
 assert.equal(data.assignments.length,2)
})
test('publication retries are idempotent and reused request IDs cannot change commands',()=>{
 const {data,directory}=fixture(),draft=draftFor(data,directory)
 const c=command(data,{type:'publish',draft,fingerprint:previewAssignment(draft,data,directory,date).fingerprint})
 const next=applyFacultyCommand(data,c,directory,options)
 assert.strictEqual(applyFacultyCommand(next,c,directory,options),next)
 assert.throws(()=>applyFacultyCommand(next,{...c,type:'draft'},directory,options),/different changes/)
})
test('student departures produce review differences and remain in historical roster',()=>{
 const {data,directory}=fixture(),next=publish(data,directory,draftFor(data,directory)),a=next.assignments.at(-1)
 directory.students[2].status='Inactive'
 const delta=assignmentChanges(a,next,directory)
 assert.equal(delta.removed.length,1);assert.ok(a.members.some(m=>m.studentId===directory.students[2].id))
 const draft=normaliseAssignment(a,next.institutionId)
 const reconciled=save(next,directory,{type:'reconcile',id:a.id,fingerprint:previewAssignment(draft,next,directory,date).fingerprint,reason:'Reviewed inactive student'})
 const updated=reconciled.assignments.find(x=>x.id===a.id)
 assert.equal(updated.members.length,a.members.length-1);assert.equal(updated.rosterHistory.length,1)
})
test('deactivation closes primary and co-teacher assignments atomically',()=>{
 const {data,directory}=fixture()
 const next=save(data,directory,{type:'status',id:'faculty-anika',reason:'Left institution'})
 assert.equal(next.faculty[0].accountStatus,'INACTIVE')
 assert.ok(next.assignments.every(a=>a.state==='ENDED'))
 assert.ok(next.assignments.every(a=>a.rosterHistory.length===1))
})
test('faculty import validates subjects and duplicates within the file',()=>{
 const {data}=fixture()
 const row=['NEW-1','Dr Kavya Raman','kavya@example.edu','','Anatomy','Tutor','Human Anatomy']
 const preview=previewFacultyImport([FACULTY_COLUMNS,row,row],data)
 assert.equal(preview[0].errors.length,0);assert.ok(preview[1].errors.length)
})
test('primary reassignment preserves dependent co-teacher coverage and old ownership',()=>{
 const {data,directory}=fixture()
 data.faculty[1].eligibleSubjectIds.push('human-anatomy')
 const next=save(data,directory,{type:'reassign',id:'sample-anatomy-primary',facultyId:'faculty-rahul',reason:'Teaching handover'})
 assert.equal(next.assignments.find(a=>a.id==='sample-anatomy-primary').state,'ENDED')
 const replacement=next.assignments.find(a=>a.facultyId==='faculty-rahul')
 assert.ok(replacement)
 const child=next.assignments.find(a=>a.facultyId==='faculty-farhan'&&a.state==='ACTIVE')
 assert.equal(child.primaryAssignmentId,replacement.id)
})

test('unknown restrictions are marked unverified; explicit restrictions exclude the student',()=>{
 const {data,directory}=fixture(),draft=draftFor(data,directory)
 assert.ok(previewAssignment(draft,data,directory,date).members.some(m=>!m.restrictionVerified))
 directory.students[2].teachingRestriction={blocked:true,reason:'Teaching suspended',from:date}
 assert.ok(previewAssignment(draft,data,directory,date).excluded.some(m=>m.reasons.includes('Teaching suspended')))
})
test('invalid primary eligibility removes co-teacher live eligibility',()=>{
 const {data,directory}=fixture()
 data.faculty[0].eligibleSubjectIds=[]
 assert.equal(effectiveFacultyRoster(data.assignments[1],data,directory,date).length,0)
})
test('scheduled activation blocks an unreviewed roster change',()=>{
 const {data,directory}=fixture()
 const next=publish(data,directory,draftFor(data,directory,{startsOn:'2026-11-05'}))
 const assignment=next.assignments.at(-1)
 directory.students[2].status='Inactive'
 assert.equal(assignmentStatus(assignment,next,directory,'2026-11-06'),'BLOCKED')
 assert.equal(effectiveFacultyRoster(assignment,next,directory,'2026-11-06').length,0)
})
test('ending an empty draft cancels it without creating past dates',()=>{
 const {data,directory}=fixture()
 const draft=normaliseAssignment({facultyId:'faculty-rahul'},data.institutionId)
 const next=save(data,directory,{type:'draft',draft})
 const ended=save(next,directory,{type:'end',id:next.assignments.at(-1).id,reason:'No longer needed'})
 assert.equal(ended.assignments.at(-1).state,'CANCELLED')
})
test('SGT changes preserve whole-batch eligibility while marking context for review',()=>{
 const {data,directory}=fixture(),next=publish(data,directory,draftFor(data,directory)),a=next.assignments.at(-1)
 const count=effectiveFacultyRoster(a,next,directory,date).length
 directory.students[2].section='B'
 assert.equal(effectiveFacultyRoster(a,next,directory,date).length,count)
 assert.equal(assignmentChanges(a,next,directory).changed.length,1)
})


