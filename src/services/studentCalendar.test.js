import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarSampleDirectory, upgradeStudentCalendars } from './studentCalendarData.js'
import { applyCalendarCommand } from './studentCalendarCommands.js'
import { validateCalendar, calendarMonths, suggestedCalendar, admissionDestination, isLeftOver } from './studentCalendar.js'
import { sampleDirectory } from './studentManagement.js'
import { previewStudentSheet, STUDENT_COLUMNS } from './studentImport.js'

const run = (data, command) => applyCalendarCommand(data, { today: '2026-11-02', ...command }, { canEdit: true })
const fixture = calendarSampleDirectory
test('inclusive calendars enforce 6–24 months, year order and 18-month Fourth Year', () => {
  assert.equal(calendarMonths({from:'2026-08',to:'2027-01'}),6)
  assert.equal(validateCalendar({calendars:{}},'First Year',{from:'2026-08',to:'2028-07'}),'')
  assert.ok(validateCalendar({calendars:{}},'First Year',{from:'2026-08',to:'2028-08'}))
  assert.ok(validateCalendar({calendars:{'First Year':{from:'2026-08',to:'2027-07'}}},'Second Year',{from:'2027-07',to:'2028-06'}))
  assert.equal(calendarMonths(suggestedCalendar({id:'2026'},'Fourth Year')),18)
})
test('onboarding resolves running advanced years and redirects ended years', () => {
  const data=fixture()
  assert.equal(admissionDestination(data,{batch:'2023',year:'Fourth Year'},'2026-11-02').batch,'2023')
  assert.equal(admissionDestination(data,{batch:'2025',year:'First Year'},'2026-11-02').batch,'2026')
  assert.throws(()=>admissionDestination(data,{batch:'2026',year:'Second Year'},'2026-11-02'),/not set/)
})
test('left over requires later batch own students, not migrants alone', () => {
  const data=fixture(), student=data.students[0]
  assert.equal(isLeftOver(data,student,'2026-11-02'),true)
  data.students=data.students.filter(s=>s.batch!=='2026'||s.motherBatch!=='2026')
  assert.equal(isLeftOver(data,student,'2026-11-02'),false)
})
test('repeat migration preserves identity, audit and mother batch; undo preserves profile and SGT', () => {
  let data=fixture(); const before=structuredClone(data.students[0])
  data=run(data,{type:'changeBatch',reasonType:'repeat',targetBatch:'2026',ids:[before.id]})
  assert.equal(data.students[0].batch,'2026');assert.equal(data.students[0].motherBatch,'2025')
  assert.equal(data.students[0].trackingId,before.trackingId)
  assert.equal(data.students[0].entries[0].outcome,'Not promoted')
  const move=data.moves[0].id
  data=run(data,{type:'sgt',ids:[before.id],section:'B'})
  data.students[0].name='Updated name'
  data=run(data,{type:'undo',moveId:move,reason:'Restore decision'})
  assert.equal(data.students[0].batch,'2025');assert.equal(data.students[0].section,'B')
  assert.equal(data.students[0].name,'Updated name');assert.equal(data.students[0].entries.length,1)
})
test('promotion uses calendar dates and is atomic when next dates are absent', () => {
  const data=fixture(), original=structuredClone(data), id=data.students[2].id
  assert.throws(()=>run(data,{type:'move',ids:[id]}),/Set Second Year/)
  assert.deepEqual(data,original)
  const next=run(data,{type:'move',ids:[id],calendar:{from:'2027-08',to:'2028-07'}})
  assert.equal(next.students[2].entries[0].end,'2027-07-31')
  assert.equal(next.students[2].startedAt,'2027-08-01')
})
test('Fourth Year completes course without opening an Internship attempt', () => {
  const data=fixture(), s=data.students[2]
  s.batch=s.motherBatch='2023';s.year='Fourth Year'
  s.entries=[{id:'fourth',batch:'2023',year:s.year,start:'2026-08-01',end:null,academicYear:'2026-08/2028-01',outcome:'Current',section:'A'}]
  const next=run(data,{type:'move',ids:[s.id]})
  assert.equal(next.students[2].graduated,true)
  assert.equal(next.students[2].completedOn,'2028-01-31')
  assert.equal(next.students[2].entries.length,1)
})
test('wrong mapping issues a new identity and blocks students with year-end decisions', () => {
  const data=fixture(), s=data.students[2], before=s.trackingId
  const next=run(data,{type:'changeBatch',reasonType:'mapping',targetBatch:'2025',batchReason:'Rejoining after a break',reason:'Incorrect admission batch',ids:[s.id]})
  assert.equal(next.students[2].motherBatch,'2025')
  assert.notEqual(next.students[2].trackingId,before)
  assert.deepEqual(next.students[2].previousTrackingIds,[before])
  assert.throws(()=>run(data,{type:'changeBatch',reasonType:'mapping',targetBatch:'2025',reason:'Wrong batch',ids:[data.students[10].id]}),/year-end decisions/)
  assert.throws(()=>run(data,{type:'changeBatch',reasonType:'mapping',targetBatch:'2025',ids:[s.id]}),/reason/)
})
test('SGT updates only the selected attempt; stale academic changes reject atomically', () => {
  const data=fixture(),s=data.students[10]
  const next=run(data,{type:'sgt',ids:[s.id],section:'O'})
  assert.equal(next.students[10].entries[0].section,'A')
  assert.equal(next.students[10].entries[1].section,'O')
  assert.throws(()=>run(data,{type:'move',ids:[s.id],expectedAcademicRevisions:{[s.id]:999}}),/newer changes/)
})
test('legacy conversion retains records and explicit calendar reconciliation retains original dates', () => {
  const old=sampleDirectory(), data=upgradeStudentCalendars(old)
  assert.equal(data.students.length,old.students.length)
  assert.equal(data.students[0].trackingId,old.students[0].trackingId)
  const fresh=fixture(), s=fresh.students[2]
  s.entries[0].legacyCalendar=true;s.entries[0].start='2026-09-15'
  const preserved=run(fresh,{type:'calendar',batch:'2026',year:'First Year',calendar:{from:'2026-08',to:'2027-07'}})
  assert.equal(preserved.students[2].entries[0].start,'2026-09-15')
  const reconciled=run(fresh,{type:'calendar',batch:'2026',year:'First Year',calendar:{from:'2026-08',to:'2027-07'},reconcileLegacy:true})
  assert.equal(reconciled.students[2].entries[0].originalCalendar.start,'2026-09-15')
  assert.equal(reconciled.students[2].entries[0].start,'2026-08-01')
})
test('batches with migration links cannot be deleted and permissions default to read only', () => {
  assert.throws(()=>run(fixture(),{type:'deleteBatch',batch:'2026',confirm:'2026'}),/migrated/)
  assert.throws(()=>applyCalendarCommand(fixture(),{type:'sgt'}),/read-only/)
})
test('advanced-year Excel rows inherit calendar dates and optional SGT', () => {
  const data=fixture()
  const preview=previewStudentSheet([STUDENT_COLUMNS,['MCNEW01','New Student','new@example.edu','+91','9876123456','']], '2023',data,{year:'Fourth Year',joinedOn:'2026-11-02'})
  assert.deepEqual(preview[0].errors,[])
  const next=run(data,{type:'import',rows:preview.map(r=>r.draft)})
  const student=next.students.at(-1)
  assert.equal(student.year,'Fourth Year');assert.equal(student.section,'N/A')
  assert.equal(student.academicYear,'2026-08/2028-01')
  assert.equal(student.startedAt,'2026-08-01')
})
test('duplicate imported identities reject the entire new-calendar transaction', () => {
  const data=fixture(), original=structuredClone(data)
  const preview=previewStudentSheet([STUDENT_COLUMNS,['MCNEW02','New Student','new@example.edu','+91','9876123456','A']], '2026',data,{year:'First Year',joinedOn:'2026-11-02'})
  assert.throws(()=>run(data,{type:'import',rows:[preview[0].draft,preview[0].draft]}),/already exists/)
  assert.deepEqual(data,original)
})
