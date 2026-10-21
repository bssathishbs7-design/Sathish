/** Compare an unpublished schedule in the browser's local timezone.
 * @param {{date:string,time:string,period?:string}} schedule
 * @param {Date} now
 * @returns {boolean} Invalid or incomplete schedules never expire.
 */
export function isAssessmentScheduleExpired({date, time, period = ''}, now = new Date()) {
  const dateMatch = String(date || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const displayMatch = String(date || '').trim().match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  if (!dateMatch && !displayMatch) return false
  const [year, month, day] = dateMatch ? dateMatch.slice(1).map(Number) : displayMatch.slice(1).reverse().map(Number)
  const timeText = [time, /am|pm/i.test(time || '') ? '' : period].filter(Boolean).join(' ').trim()
  const match = timeText.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!match) return false
  let hour = Number(match[1])
  const minute = Number(match[2])
  const meridiem = match[3]?.toUpperCase()
  if (minute > 59 || hour > (meridiem ? 12 : 23) || (meridiem && hour < 1)) return false
  if (meridiem) hour = hour % 12 + (meridiem === 'PM' ? 12 : 0)
  const start = new Date(year, month - 1, day, hour, minute)
  if (start.getFullYear() !== year || start.getMonth() !== month - 1 || start.getDate() !== day) return false
  return now.getTime() > start.getTime()
}

/** Pending assessment submissions expire at their saved start, independently of display formatting. */
export function isPendingAssessmentExpired(record, now = new Date()) {
  if (record?.activityType !== 'Assessment' || (record.approvalStatus || record.status) !== 'Pending Approval') return false
  const setup = record.setup || {}
  const practice = setup.supervisionType === 'Practice Exam' && setup.examDeliveryMode !== 'Offline'
  return isAssessmentScheduleExpired({
    date: (practice ? setup.practiceStartDate : setup.examDate) || record.examDate || record.startDate,
    time: (practice ? setup.practiceStartTime : setup.startTime) || record.startTime,
    period: (practice ? setup.practiceStartPeriod : setup.startPeriod) || record.startPeriod,
  }, now)
}
