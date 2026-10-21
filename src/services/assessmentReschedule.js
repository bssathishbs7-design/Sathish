/** @param {Object} record Saved pending assessment submission. */
export const isPracticeSchedule = record => record.setup?.supervisionType === 'Practice Exam' && record.setup?.examDeliveryMode !== 'Offline'

/** Validate local date/time input without accepting normalised invalid dates. */
function scheduledDate(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '')) return null
  const value = new Date(date + 'T' + time)
  const [year, month, day] = date.split('-').map(Number)
  return Number.isFinite(value.getTime()) && value.getFullYear() === year && value.getMonth() === month - 1 && value.getDate() === day ? value : null
}
const clockParts = time => {
  const [hours, minutes] = time.split(':').map(Number)
  return {time: String(hours % 12 || 12).padStart(2, '0') + ':' + String(minutes).padStart(2, '0'), period: hours >= 12 ? 'PM' : 'AM'}
}

/** Return a replacement submission while preserving identity, questions, settings and approval stage.
 * @param {Object} record Current pending submission.
 * @param {{date:string,time:string,endDate?:string,endTime?:string}} values Local schedule values.
 * @param {Date} now Current local time.
 */
export function rescheduleAssessment(record, values, now = new Date()) {
  if (record.activityType !== 'Assessment' || (record.approvalStatus || record.status) !== 'Pending Approval') throw new Error('Only pending assessments can be rescheduled here.')
  const start = scheduledDate(values.date, values.time)
  if (!start || start <= now) throw new Error('Choose a start date and time in the future.')
  const practice = isPracticeSchedule(record)
  const end = practice ? scheduledDate(values.endDate, values.endTime) : null
  if (practice && (!end || end <= start)) throw new Error('Choose an end date and time after the new start.')
  const clock = clockParts(values.time)
  const setup = {...record.setup, examDate: values.date, startTime: clock.time, startPeriod: clock.period, updatedAt: now.toISOString()}
  const next = {...record, setup, examDate: values.date, startDate: values.date, startTime: clock.time + ' ' + clock.period, updatedAt: setup.updatedAt}
  if (practice) {
    const endClock = clockParts(values.endTime)
    Object.assign(setup, {practiceStartDate: values.date, practiceStartTime: clock.time, practiceStartPeriod: clock.period, practiceEndDate: values.endDate, practiceEndTime: endClock.time, practiceEndPeriod: endClock.period})
    const minutes = Math.round((end - start) / 60000)
    const duration = String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0')
    Object.assign(next, {endDate: values.endDate, endTime: endClock.time + ' ' + endClock.period, duration, totalDuration: duration})
    setup.totalDuration = duration
  }
  return next
}
