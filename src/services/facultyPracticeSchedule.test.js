import test from 'node:test'
import assert from 'node:assert/strict'
import { getScheduleLabel, isPendingScheduledPractice } from './facultyPracticeSchedule.js'

const session = { assignment: { scheduleEnabled: true, endDate: '2026-09-17', endTime: '14:00' }, timeRemaining: '03:00:00' }
const practiceAt = (time) => ({ schedule: getScheduleLabel(session, new Date(`2026-09-17T${time}`)), status: 'In Progress' })

test('timestamp takes priority over a stale saved countdown', () => {
  assert.equal(practiceAt('13:59:58').schedule, '00:00:02')
  assert.equal(isPendingScheduledPractice(practiceAt('13:59:58')), true)
})
test('expiry removes the highlight and scheduled membership at the same instant', () => {
  assert.equal(isPendingScheduledPractice(practiceAt('13:59:59.500')), true)
  assert.equal(practiceAt('14:00:00').schedule, '00:00:00')
  assert.equal(isPendingScheduledPractice(practiceAt('14:00:00')), false)
  assert.equal(isPendingScheduledPractice(practiceAt('15:00:00')), false)
})
test('normal and explicitly expired practices are not scheduled', () => {
  assert.equal(isPendingScheduledPractice({ schedule: getScheduleLabel({}), status: 'In Progress' }), false)
  assert.equal(isPendingScheduledPractice({ schedule: '02:00:00', status: 'Expired' }), false)
})
test('upcoming schedules and long countdowns are included', () => {
  assert.equal(isPendingScheduledPractice({ schedule: 'Scheduled' }), true)
  assert.equal(isPendingScheduledPractice({ schedule: '120:00:00' }), true)
})
test('scheduled count counts matching competency groups once', () => {
  const groups = [
    { practices: [practiceAt('13:00:00'), practiceAt('13:30:00')] },
    { practices: [practiceAt('14:00:00')] },
    { practices: [{ schedule: 'Normal' }] },
  ]
  assert.equal(groups.filter(row => row.practices.some(isPendingScheduledPractice)).length, 1)
})
