import { useMemo } from 'react'
import {
  AlertTriangle,
  ChevronLeft,
  FileClock,
  MonitorCog,
  RefreshCcw,
  ShieldAlert,
  WifiOff,
} from 'lucide-react'
import '../styles/exam-log.css'
import '../styles/evaluation.css'

const formatValue = (value, fallback = 'Not available') => value ?? fallback

const formatTimestamp = (value) => {
  if (!value) return 'Not available'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getSeverityTone = (value) => {
  const normalized = String(value ?? '').toLowerCase()

  if (normalized === 'warning') return 'is-warning'
  if (normalized === 'success') return 'is-success'
  if (normalized === 'danger') return 'is-danger'

  return 'is-info'
}

const getEventBadgeTone = (value) => {
  const normalized = String(value ?? '').toLowerCase()

  if (normalized.includes('warning')) return 'is-warning'
  if (normalized.includes('tab')) return 'is-tab'
  if (normalized.includes('full screen')) return 'is-fullscreen'
  if (normalized.includes('network')) return 'is-network'
  if (normalized.includes('reconnected')) return 'is-info'
  if (normalized.includes('submitted')) return 'is-success'

  return 'is-info'
}

const buildExamRows = (context, logs) => {
  const student = context?.student
  const record = context?.evaluationRecord
  const assignmentDate = record?.createdDate
  const submittedAt = student?.submission?.submittedAt
  const baselineRows = [
    {
      id: `baseline-assigned-${record?.id ?? 'activity'}`,
      eventType: 'Exam Assigned',
      detail: `${formatValue(record?.activityName, 'Activity')} assigned for ${formatValue(record?.year, 'Year')} ${formatValue(record?.sgt, 'SGT')}.`,
      severity: 'info',
      timestamp: assignmentDate,
      activityType: record?.activityType ?? 'Activity',
      status: 'Assigned',
    },
    {
      id: `baseline-submitted-${student?.id ?? 'student'}`,
      eventType: submittedAt ? 'Exam Submitted' : 'Submission Pending',
      detail: submittedAt
        ? `${formatValue(student?.name, 'Student')} submitted the activity for evaluation.`
        : 'No submission timestamp has been recorded yet for this student.',
      severity: submittedAt ? 'success' : 'warning',
      timestamp: submittedAt ?? assignmentDate,
      activityType: record?.activityType ?? 'Activity',
      status: submittedAt ? 'Submitted' : 'Pending',
    },
  ]

  const monitoringRows = logs.map((log) => ({
    id: log.id,
    eventType: log.eventType,
    detail: log.detail ?? log.message ?? 'Event captured.',
    severity: log.severity ?? 'info',
    timestamp: log.timestamp,
    activityType: log.activityType ?? record?.activityType ?? 'Activity',
    status: log.status ?? 'Live',
  }))

  return [...monitoringRows, ...baselineRows].sort((left, right) => (
    new Date(right.timestamp ?? 0).getTime() - new Date(left.timestamp ?? 0).getTime()
  ))
}

export default function ExamLogPage({
  examLogContext,
  examMonitoringLogs = [],
  onBackToEvaluation,
  onResetActivity,
}) {
  const student = examLogContext?.student
  const record = examLogContext?.evaluationRecord
  const obtainedMarks = examLogContext?.obtainedMarks ?? 0
  const totalMarks = examLogContext?.totalMarks ?? 0

  const filteredLogs = useMemo(() => (
    examMonitoringLogs.filter((item) => (
      item.activityId === (record?.id ?? examLogContext?.activityId)
      && item.studentId === student?.id
    ))
  ), [examMonitoringLogs, examLogContext?.activityId, record?.id, student?.id])

  const tableRows = useMemo(
    () => buildExamRows(examLogContext, filteredLogs),
    [examLogContext, filteredLogs],
  )

  const metrics = useMemo(() => {
    const warningCount = filteredLogs.filter((item) => String(item.severity).toLowerCase() === 'warning').length
    const tabSwitchCount = filteredLogs.filter((item) => String(item.eventType).toLowerCase().includes('tab')).length
    const fullscreenExitCount = filteredLogs.filter((item) => String(item.eventType).toLowerCase().includes('full screen')).length
    const networkIssueCount = filteredLogs.filter((item) => String(item.eventType).toLowerCase().includes('network')).length

    return [
      { label: 'Total Events', value: filteredLogs.length, icon: FileClock, tone: 'is-info' },
      { label: 'Warnings', value: warningCount, icon: AlertTriangle, tone: 'is-warning' },
      { label: 'Tab Switches', value: tabSwitchCount, icon: MonitorCog, tone: 'is-tab' },
      { label: 'Full Screen Exits', value: fullscreenExitCount, icon: ShieldAlert, tone: 'is-fullscreen' },
      { label: 'Network Issues', value: networkIssueCount, icon: WifiOff, tone: 'is-network' },
    ]
  }, [filteredLogs])

  return (
    <section className="vx-content forms-page exam-log-page">
      <div className="exam-log-shell">
        <section className="exam-log-header-card">
          <div className="exam-log-copy">
            <span className="exam-log-kicker">Exam Monitoring</span>
            <h2>{formatValue(record?.activityName, 'No activity selected')}</h2>
            <p>
              {formatValue(student?.name, 'No student selected')}
              {' • '}
              {formatValue(student?.registerId, 'No register number')}
              {' • '}
              {formatValue(record?.activityType, 'Activity')}
            </p>
            <div className="exam-log-header-badges">
              <span className={`eval-status-pill ${student?.evaluationStatus === 'Completed' ? 'is-complete' : 'is-pending'}`}>
                {student?.evaluationStatus === 'Completed' ? 'Completed' : 'Pending'}
              </span>
              <span className="exam-log-summary-pill">Obtained Marks {obtainedMarks} / {totalMarks}</span>
            </div>
          </div>

          <div className="exam-log-header-actions">
            <button type="button" className="ghost exam-log-back-btn" onClick={onBackToEvaluation}>
              <ChevronLeft size={15} strokeWidth={2} />
              Back
            </button>
            <button
              type="button"
              className="tool-btn green exam-log-reset-btn"
              onClick={() => {
                onResetActivity?.(examLogContext)
                onBackToEvaluation?.()
              }}
            >
              <RefreshCcw size={15} strokeWidth={2} />
              Reset Activity
            </button>
          </div>
        </section>

        <section className="exam-log-summary-grid">
          {metrics.map((item) => (
            <article key={item.label} className={`exam-log-summary-tile ${item.tone}`}>
              <span><item.icon size={14} strokeWidth={2} /> {item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </section>

        <section className="exam-log-table-card">
          <div className="exam-log-panel-head">
            <div>
              <strong>Activity Monitoring Table</strong>
              <p>Warnings, tab switches, fullscreen exits, network issues, and submission events for this student activity.</p>
            </div>
          </div>

          <div className="exam-log-table-wrap">
            <table className="exam-log-table">
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>Detail</th>
                  <th>Severity</th>
                  <th>Activity Type</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length ? tableRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className={`exam-log-event-pill ${getEventBadgeTone(row.eventType)}`}>
                        {row.eventType}
                      </span>
                    </td>
                    <td>{row.detail}</td>
                    <td>
                      <span className={`exam-log-severity-pill ${getSeverityTone(row.severity)}`}>
                        {row.severity}
                      </span>
                    </td>
                    <td>{formatValue(row.activityType)}</td>
                    <td>{formatValue(row.status)}</td>
                    <td>{formatTimestamp(row.timestamp)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="exam-log-empty-cell">
                      No monitoring events available for this student activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  )
}
