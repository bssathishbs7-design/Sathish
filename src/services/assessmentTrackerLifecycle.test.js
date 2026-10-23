import test from 'node:test'
import assert from 'node:assert/strict'
import { splitPublishedAssessmentRows, getPublishedAssessmentScheduleStatus, canStartLiveEvaluation } from './assessmentTrackerLifecycle.js'
const exam = { id: 'exam', startDate: '2026-10-23', startTime: '10:00 AM', totalDuration: '01:00', students: [{id:'s1'}], supervisionType:'Practice' }
test('live projections share a record and transition at end without inflating unique count', () => {
  const before = splitPublishedAssessmentRows([exam], new Date(2026,9,23,9))
  assert.equal(before.evaluation.length,0)
  const live = splitPublishedAssessmentRows([exam], new Date(2026,9,23,10,30))
  assert.equal(live.published[0],exam); assert.equal(live.evaluation[0],exam)
  assert.equal(new Set([...live.published,...live.evaluation]).size,1)
  const ended = splitPublishedAssessmentRows([exam], new Date(2026,9,23,11))
  assert.equal(ended.published.length,0); assert.equal(ended.evaluation[0],exam)
})
test('released live exams retain both live access and results review', () => {
  const released={...exam,resultStatus:'Published'}
  const rows=splitPublishedAssessmentRows([released],new Date(2026,9,23,10,30))
  for(const tab of ['published','evaluation','results']) assert.equal(rows[tab][0],released)
  assert.equal(getPublishedAssessmentScheduleStatus(exam,new Date(2026,9,23,10,30)).remainingMs,1800000)
})
test('draft answers cannot enable evaluation; submitted roster sections can', () => {
  const prior=globalThis.localStorage
  let attempt={answers:{q:0}}
  globalThis.localStorage={getItem:()=>JSON.stringify({exam:{s1:attempt}})}
  try {
    assert.equal(canStartLiveEvaluation(exam),false)
    attempt={...attempt,isMcqSubmitted:true}
    assert.equal(canStartLiveEvaluation(exam),true)
    assert.equal(canStartLiveEvaluation({...exam,students:[{id:'someone-else'}]}),false)
  } finally { globalThis.localStorage=prior }
})
