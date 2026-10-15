/** Fields owned by Schedule & answer settings. Cancellation restores only this subset. */
export const ASSESSMENT_SCHEDULE_FIELDS = [
  'examDeliveryMode', 'supervisionType', 'examDate', 'startTime', 'startPeriod',
  'practiceStartDate', 'practiceStartTime', 'practiceStartPeriod', 'practiceEndDate', 'practiceEndTime', 'practiceEndPeriod',
  'mcqStartTime', 'mcqStartPeriod', 'descriptiveStartTime', 'descriptiveStartPeriod',
  'mcqDisplayType', 'descriptiveDisplayType', 'mcqAutoPublish', 'mcqAutoEvaluation',
  'descriptiveAutoEvaluation', 'descriptiveAutoPublish', 'descriptiveEvaluationRequired',
  'proctoredTotalDuration', 'splitProctoredDuration', 'proctoredSectionSequence',
  'mcqTimeLimit', 'descriptiveTimeLimit', 'offlineDuration',
]

/** @param {Object} setup Assessment draft. @returns {Object} Independent scheduling snapshot. */
export function captureScheduleSettings(setup) {
  return Object.fromEntries(ASSESSMENT_SCHEDULE_FIELDS.map(field => [field, setup[field]]))
}

/** @param {Object<string,string>} errors Full configuration errors. */
export function getScheduleErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([field]) => ASSESSMENT_SCHEDULE_FIELDS.includes(field)))
}

const dateTime = (date, time, period) => {
  const parsed = date ? new Date(`${date}T12:00:00`) : null
  const label = parsed && !Number.isNaN(parsed.getTime()) ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed) : date
  return [label, time ? `${time.replace(/^0/, '')} ${period || ''}`.trim() : ''].filter(Boolean).join(' · ')
}
const duration = value => {
  const [hours, minutes] = String(value || '').split(':').map(Number)
  return [hours ? `${hours} ${hours === 1 ? 'hour' : 'hours'}` : '', minutes ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : ''].filter(Boolean).join(' ') || value || 'Not set'
}

/** @param {Object} setup Valid scheduling draft. @returns {Array<{label:string,value:string}>} Readable summary rows. */
export function getScheduleSummary(setup) {
  const rows = [{ label: 'Exam mode', value: setup.examDeliveryMode }]
  if (setup.examDeliveryMode === 'Online') rows.push({ label: 'Supervision', value: setup.supervisionType })
  if (setup.examDeliveryMode === 'Online' && setup.supervisionType === 'Practice Exam') {
    rows.push({ label: 'Starts', value: dateTime(setup.practiceStartDate, setup.practiceStartTime, setup.practiceStartPeriod) }, { label: 'Ends', value: dateTime(setup.practiceEndDate, setup.practiceEndTime || '12:00', setup.practiceEndPeriod || 'PM') })
  } else {
    rows.push({ label: 'Date & time', value: dateTime(setup.examDate, setup.startTime, setup.startPeriod) }, { label: 'Duration', value: duration(setup.examDeliveryMode === 'Offline' ? setup.offlineDuration : setup.proctoredTotalDuration) })
  }
  return rows
}
