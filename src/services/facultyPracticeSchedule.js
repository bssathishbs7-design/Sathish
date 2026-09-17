const parseScheduledDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return null

  const date = new Date(`${dateValue}T${timeValue}`)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatCountdown = (targetDate, now = new Date()) => {
  if (!targetDate) return null

  const diffMs = targetDate.getTime() - now.getTime()
  if (diffMs <= 0) return '00:00:00'

  const totalSeconds = Math.ceil(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const getScheduleLabel = (session = {}, now = new Date()) => {
  const schedule = session.schedule ?? {}
  const assignment = session.assignment ?? {}

  const isScheduled = Boolean(
    assignment.scheduleEnabled
    || session.isScheduled
    || session.scheduled
    || session.startDate
    || session.endDate
    || schedule.startDate
    || schedule.startTime
    || schedule.endDate
    || schedule.endTime
  )
  const endDateTime = isScheduled
    ? parseScheduledDateTime(
      assignment.endDate ?? schedule.endDate ?? session.endDate,
      assignment.endTime ?? schedule.endTime ?? session.endTime,
    )
    : null
  const countdown = formatCountdown(endDateTime, now)
  if (countdown) return countdown

  if (typeof session.timeRemaining === 'string') return session.timeRemaining
  if (typeof session.remainingTime === 'string') return session.remainingTime
  if (typeof session.scheduleLabel === 'string') return session.scheduleLabel
  if (typeof session.scheduleType === 'string') return session.scheduleType
  if (typeof schedule.label === 'string') return schedule.label
  if (isScheduled) return 'Scheduled'
  return 'Normal'
}

const isCountdownLabel = (value = '') => /^\d{2,}:\d{2}:\d{2}$/.test(String(value).trim())

export const getScheduleClassName = (schedule = '', status = '') => {
  const value = String(schedule).trim().toLowerCase()
  const statusValue = String(status).trim().toLowerCase()
  if (value === '00:00:00' || statusValue.includes('expire')) return 'is-expired'
  if (isCountdownLabel(value)) return 'is-live'
  if (value === 'normal') return 'is-normal'
  return 'is-scheduled'
}

/** Whether a practice belongs in the Scheduled filter and receives a row highlight. */
export const isPendingScheduledPractice = (practice) => ['is-live', 'is-scheduled'].includes(getScheduleClassName(practice.schedule, practice.status))
