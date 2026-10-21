import test from 'node:test'
import assert from 'node:assert/strict'
import {rescheduleAssessment} from './assessmentReschedule.js'
const now = new Date(2026,9,21,10)
const record = {id:'one',activityId:'submission',activityType:'Assessment',approvalStatus:'Pending Approval',questionRows:[{id:'q1'}],setup:{assessmentId:'ASST1',examDate:'2026-10-20',startTime:'01:00',startPeriod:'AM',supervisionType:'Proctored Exam',totalDuration:'01:00'}}
test('reschedule preserves identity, approval, questions and duration',()=>{
 const next=rescheduleAssessment(record,{date:'2026-10-22',time:'14:30'},now)
 assert.equal(next.id,record.id);assert.equal(next.setup.assessmentId,'ASST1');assert.equal(next.activityId,record.activityId);assert.equal(next.approvalStatus,'Pending Approval');assert.deepEqual(next.questionRows,record.questionRows)
 assert.equal(next.startTime,'02:30 PM');assert.equal(next.setup.totalDuration,'01:00');assert.equal(record.setup.examDate,'2026-10-20')
})
test('rejects past, incomplete, impossible schedules and non-pending records',()=>{
 for(const values of [{date:'2026-10-20',time:'14:00'},{date:'2026-10-22',time:''},{date:'2027-02-31',time:'14:00'},{date:'2026-10-22',time:'25:00'}])assert.throws(()=>rescheduleAssessment(record,values,now))
 assert.throws(()=>rescheduleAssessment({...record,approvalStatus:'Approved'},{date:'2026-10-22',time:'14:30'},now))
})
test('practice rescheduling requires a later end and updates window duration',()=>{
 const practice={...record,setup:{...record.setup,supervisionType:'Practice Exam',examDeliveryMode:'Online'}}
 assert.throws(()=>rescheduleAssessment(practice,{date:'2026-10-22',time:'14:00',endDate:'2026-10-22',endTime:'13:00'},now))
 const next=rescheduleAssessment(practice,{date:'2026-10-22',time:'14:00',endDate:'2026-10-23',endTime:'16:00'},now)
 assert.equal(next.setup.practiceStartTime,'02:00');assert.equal(next.setup.practiceEndPeriod,'PM');assert.equal(next.totalDuration,'26:00')
})
