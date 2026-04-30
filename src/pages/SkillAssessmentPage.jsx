import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FolderKanban,
  GraduationCap,
  Info,
  LayoutGrid,
  Rows3,
  Search,
  Users,
} from 'lucide-react'
import PageBreadcrumbs from '../components/PageBreadcrumbs'
import '../styles/evaluation.css'
import { skillAssessmentActivities } from './skillAssessmentData'

const formatDisplayDate = (value) => {
  const normalized = value ? String(value).split(',')[0].trim() : ''
  const [day, month, year] = normalized.split('/').map((part) => Number.parseInt(part, 10))

  if (!day || !month || !year) return normalized

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: '2-digit',
  }).format(new Date(year, month - 1, day))
}

const getActivityTypeTone = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()

  if (normalized === 'ospe') return 'is-ospe'
  if (normalized === 'osce') return 'is-osce'
  if (normalized === 'interpretation') return 'is-interpretation'
  if (normalized === 'image') return 'is-image'

  return ''
}

const parseAttemptValue = (value) => {
  if (value === null || value === undefined || value === '') return 0
  const match = String(value).match(/\d+/)
  return Number.parseInt(match?.[0] ?? '0', 10) || 0
}

const getNormalizedResultStatus = (value = '') => String(value ?? '').trim().toLowerCase()

const getAttemptNumber = (row) => Number(row?.attemptNumber) || 1

const getCompletedRowStatus = (row) => getNormalizedResultStatus(
  row?.resultStatus
  ?? row?.decisionTitle
  ?? row?.evaluationDecision
  ?? row?.evaluationResult?.resultStatus,
)

const getLatestCompletedRowsByStudent = (rows = []) => {
  const latestRows = new Map()

  rows.forEach((row) => {
    if (!row?.activityId || !row?.studentId) return
    if (!getCompletedRowStatus(row)) return

    const key = `${row.activityId}:${row.studentId}`
    const current = latestRows.get(key)

    if (!current || getAttemptNumber(row) >= getAttemptNumber(current)) {
      latestRows.set(key, row)
    }
  })

  return [...latestRows.values()]
}

const getRecordAttemptNumber = (record, completedRows = []) => {
  const nextAttemptNumber = Number(record?.nextAttemptNumber ?? record?.approvalRecord?.nextAttemptNumber ?? 0) || 0

  if (nextAttemptNumber > 0) return nextAttemptNumber

  const storedAttemptNumber = parseAttemptValue(
    record?.approvalRecord?.attemptNumber
    ?? record?.approvalRecord?.attemptCount
    ?? record?.attemptNumber
    ?? record?.attemptCount,
  )

  if (storedAttemptNumber > 0) return storedAttemptNumber

  const activityId = record?.id ?? record?.activityId

  if (!activityId) return 1

  const latestAttemptNumber = getLatestCompletedRowsByStudent(
    completedRows.filter((row) => row.activityId === activityId),
  ).reduce((maxAttempt, row) => Math.max(maxAttempt, getAttemptNumber(row)), 0)

  return latestAttemptNumber || 1
}

const getApprovalRecord = (record, approvalQueueRows = []) => {
  const activityId = record?.id ?? record?.activityId

  if (!activityId) return null

  return approvalQueueRows.find((row) => String(row.activityId ?? '') === String(activityId)) ?? null
}

const getApprovalStatus = (record) => String(
  record?.approvalStatus
  ?? record?.reviewStatus
  ?? record?.status
  ?? '',
).trim().toLowerCase()

const getApprovalAttemptLabel = (record) => `Attempt ${getRecordAttemptNumber(record)}`

const getCurrentAttemptStudentCount = (record, approvalRecord) => {
  const approvalTotalStudents = Number(approvalRecord?.totalStudents) || 0

  if (approvalTotalStudents > 0) return approvalTotalStudents

  const totalStudents = Math.max(1, Number(record?.studentCount) || 0)
  const visibleCount = Math.min(totalStudents, 17)
  const notSubmittedSampleCount = visibleCount > 1
    ? Math.min(2, Math.max(1, Math.floor(visibleCount * 0.12)))
    : 0

  return visibleCount - notSubmittedSampleCount
}

const getEvaluationStatusMeta = (record) => {
  const approvalStatus = getApprovalStatus(record.approvalRecord)
  const nextAttemptCount = Number(record?.nextAttemptCount ?? record?.approvalRecord?.nextAttemptCount ?? 0) || 0
  const nextAttemptNumber = Number(record?.nextAttemptNumber ?? record?.approvalRecord?.nextAttemptNumber ?? 0) || 0
  const nextAttemptStatus = String(record?.nextAttemptStatus ?? record?.approvalRecord?.nextAttemptStatus ?? '').trim().toLowerCase()

  if (approvalStatus === 'published') {
    if (nextAttemptCount > 0) {
      return {
        label: 'Published',
        tone: 'is-complete',
        actionLabel: nextAttemptStatus === 'scheduled' ? 'Start' : 'Schedule',
        actionTone: nextAttemptStatus === 'scheduled' ? 'green' : 'eval-view-btn',
        actionKind: nextAttemptStatus === 'scheduled' ? 'start' : 'schedule',
        isSentToApproval: false,
        isApprovalPending: false,
        isApproved: false,
        isRejected: false,
        isCompleted: true,
        isPublished: true,
        nextAttemptCount,
        nextAttemptNumber,
        nextAttemptStatus,
      }
    }

    return {
      label: 'Completed',
      tone: 'is-complete',
      actionLabel: '',
      actionTone: 'green',
      actionKind: '',
      isSentToApproval: false,
      isApprovalPending: false,
      isApproved: false,
      isRejected: false,
      isCompleted: true,
      isPublished: true,
      nextAttemptCount: 0,
      nextAttemptNumber: 0,
      nextAttemptStatus: '',
    }
  }

  if (approvalStatus === 'approved') {
    return {
      label: 'Approved',
      tone: 'is-approved',
      actionLabel: 'Publish',
      actionTone: 'green',
      actionKind: 'publish',
      isSentToApproval: false,
      isApprovalPending: false,
      isApproved: true,
      isRejected: false,
      isCompleted: false,
      isPublished: false,
      nextAttemptCount: 0,
      nextAttemptNumber: 0,
      nextAttemptStatus: '',
    }
  }

  if (approvalStatus === 'approval rejected') {
    return {
      label: 'Approval Rejected',
      tone: 'is-approval-rejected',
      actionLabel: 'Start',
      actionTone: 'green',
      actionKind: 'start',
      isSentToApproval: false,
      isApprovalPending: false,
      isApproved: false,
      isRejected: true,
      isCompleted: false,
      isPublished: false,
      nextAttemptCount: 0,
      nextAttemptNumber: 0,
      nextAttemptStatus: '',
    }
  }

  if (record.approvalRecord) {
    return {
      label: 'Sent to Approval',
      tone: 'is-sent-approval',
      actionLabel: '',
      actionTone: 'green',
      actionKind: '',
      isSentToApproval: true,
      isApprovalPending: true,
      isApproved: false,
      isRejected: false,
      isCompleted: false,
      isPublished: false,
      nextAttemptCount: 0,
      nextAttemptNumber: 0,
      nextAttemptStatus: '',
    }
  }

  const isCompleted = record.evaluationStatus === 'Completed Evaluation'

  return {
    label: isCompleted ? 'Completed' : 'Pending',
    tone: isCompleted ? 'is-complete' : 'is-pending',
    actionLabel: isCompleted ? 'View' : 'Start',
    actionTone: isCompleted ? 'eval-view-btn' : 'green',
    actionKind: isCompleted ? 'view' : 'start',
    isSentToApproval: false,
    isApprovalPending: false,
    isApproved: false,
    isRejected: false,
    isCompleted,
    isPublished: false,
    nextAttemptCount: 0,
    nextAttemptNumber: 0,
    nextAttemptStatus: '',
  }
}

const getResolvedStatusValue = (record) => getEvaluationStatusMeta(record).label

const parseDateValue = (value) => {
  if (!value) return 0
  const normalized = String(value).split(',')[0].trim()
  const [day, month, year] = normalized.split('/').map((part) => Number.parseInt(part, 10))
  if (!day || !month || !year) return 0
  return new Date(year, month - 1, day).getTime()
}

const buildFallbackRecords = () => skillAssessmentActivities.slice(0, 8).map((activity, index) => ({
  id: `evaluation-${activity.id}`,
  activityName: activity.name,
  activityType: activity.skillType,
  studentCount: 24 + (index * 4),
  year: activity.year,
  sgt: activity.sgt,
  attemptCount: `${(index % 3) + 1} / 3`,
  createdDate: `0${(index % 8) + 1}/04/2026`,
  evaluationStatus: index % 3 === 0 ? 'Completed Evaluation' : 'Pending Evaluation',
  questionCount: 2 + (index % 4),
}))

function ScheduleAttemptControl({ record, onAssign, onClear }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(record.scheduledDate ?? '')
  const [scheduleTime, setScheduleTime] = useState(record.scheduledTime ?? '')

  return (
    <div className={`eval-schedule-wrap${isOpen ? ' is-open' : ''}`}>
      <button
        type="button"
        className="tool-btn eval-view-btn eval-action-btn"
        onClick={() => setIsOpen((open) => !open)}
      >
        Schedule
      </button>
      {isOpen ? (
        <div className="eval-schedule-popover">
          <label>
            <span>Date</span>
            <input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} />
          </label>
          <label>
            <span>Time</span>
            <input type="time" value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} />
          </label>
          <div className="eval-schedule-actions">
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setScheduleDate('')
                setScheduleTime('')
                onClear?.(record)
                setIsOpen(false)
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="tool-btn green"
              onClick={() => {
                if (!scheduleDate || !scheduleTime) return
                onAssign?.(record, { date: scheduleDate, time: scheduleTime })
                setIsOpen(false)
              }}
            >
              Assign
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function EvaluationCard({ record, onOpenEvaluation, onScheduleAttempt, onClearAttemptSchedule }) {
  const statusMeta = getEvaluationStatusMeta(record)
  const approvalRemarks = String(record.approvalRecord?.reviewRemarks ?? '').trim()
  const remarksTitle = statusMeta.isRejected ? 'Rejection remarks' : 'Approval remarks'

  return (
    <article className="eval-card">
      <div className="eval-card-top">
        <div className="eval-card-topline">
          <span className={`eval-type-chip ${getActivityTypeTone(record.activityType)}`}>{record.activityType}</span>
          <span className={`eval-status-pill ${statusMeta.tone}`}>
            {statusMeta.label}
          </span>
        </div>

        <div className="eval-card-title">
          <h3>{record.activityName}</h3>
        </div>
      </div>

      <div className="eval-card-meta">
        <div className="eval-card-meta-item">
          <span><Users size={12} strokeWidth={2} /> Students</span>
          <strong>{record.displayStudentCount ?? record.studentCount ?? 0}</strong>
        </div>
        <div className="eval-card-meta-item">
          <span><GraduationCap size={12} strokeWidth={2} /> Year</span>
          <strong>{record.year || 'Not set'}</strong>
        </div>
        <div className="eval-card-meta-item">
          <span><FolderKanban size={12} strokeWidth={2} /> SGT</span>
          <strong>{record.sgt || 'Not set'}</strong>
        </div>
        </div>

      <div className="eval-card-action-panel">
        <div className="eval-card-action-cell">
          <span>Attempt</span>
          <strong>{record.attemptCount ?? getApprovalAttemptLabel(record)}</strong>
        </div>
        <div className="eval-card-action-cell is-remarks">
          <span>{statusMeta.nextAttemptCount ? 'Count' : 'Remarks'}</span>
          {statusMeta.nextAttemptCount ? (
            <strong>{statusMeta.nextAttemptCount} Students</strong>
          ) : approvalRemarks ? (
            <span className="eval-remarks-tooltip-wrap">
              <button
                type="button"
                className="eval-remarks-tooltip-btn"
                aria-label="View approval remarks"
              >
                <Info size={12} strokeWidth={2.2} />
              </button>
              <span className="eval-remarks-tooltip" role="tooltip">
                <strong>{remarksTitle}</strong>
                <span>{approvalRemarks}</span>
              </span>
            </span>
          ) : <strong>-</strong>}
        </div>
        <div className="eval-card-action-cell is-action">
          <span>Actions</span>
          {statusMeta.actionKind === 'schedule' ? (
            <ScheduleAttemptControl record={record} onAssign={onScheduleAttempt} onClear={onClearAttemptSchedule} />
          ) : statusMeta.isApprovalPending || !statusMeta.actionLabel ? (
            <strong>-</strong>
          ) : (
            <button
              type="button"
              className={`tool-btn ${statusMeta.actionTone} eval-action-btn`}
              onClick={() => onOpenEvaluation(record)}
            >
              {statusMeta.actionLabel}
            </button>
          )}
        </div>
      </div>

      <div className="eval-card-date">
        <CalendarDays size={12} strokeWidth={2} />
        {formatDisplayDate(record.createdDate) || 'Not set'}
      </div>
    </article>
  )
}

function EvaluationTable({
  records,
  onOpenEvaluation,
  onScheduleAttempt,
  onClearAttemptSchedule,
  sortKey,
  sortDirection,
  onSort,
  currentPage,
  pageCount,
  totalRecords,
  onPageChange,
}) {
  const renderSortableHeader = (label, key) => (
    <button
      type="button"
      className={`eval-table-sort ${sortKey === key ? 'is-active' : ''}`}
      onClick={() => onSort(key)}
    >
      <span>{label}</span>
      <ArrowUpDown size={13} strokeWidth={2} />
    </button>
  )

  return (
    <div className="eval-table-wrap">
      <table className="eval-table">
        <colgroup>
          <col className="eval-table-col-activity" />
          <col className="eval-table-col-type" />
          <col className="eval-table-col-year" />
          <col className="eval-table-col-sgt" />
          <col className="eval-table-col-students" />
          <col className="eval-table-col-created" />
          <col className="eval-table-col-status" />
          <col className="eval-table-col-action" />
        </colgroup>
        <thead>
          <tr>
            <th>{renderSortableHeader('Activity', 'activityName')}</th>
            <th>{renderSortableHeader('Type', 'activityType')}</th>
            <th>{renderSortableHeader('Year', 'year')}</th>
            <th>{renderSortableHeader('SGT', 'sgt')}</th>
            <th>{renderSortableHeader('Students', 'studentCount')}</th>
            <th>{renderSortableHeader('Created', 'createdDate')}</th>
            <th>{renderSortableHeader('Status', 'resolvedStatus')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const statusMeta = record.statusMeta ?? getEvaluationStatusMeta(record)

            return (
              <tr key={record.id}>
                <td>
                  <div className="eval-table-title">
                    <strong>{record.activityName}</strong>
                  </div>
                </td>
                <td>
                  <span className={`eval-type-chip eval-table-clip-chip ${getActivityTypeTone(record.activityType)}`} title={record.activityType}>
                    {record.activityType}
                  </span>
                </td>
                <td>
                  <span className="eval-table-clip-text" title={record.year || 'Not set'}>
                    {record.year || 'Not set'}
                  </span>
                </td>
                <td>
                  <span className="eval-table-clip-text" title={record.sgt || 'Not set'}>
                    {record.sgt || 'Not set'}
                  </span>
                </td>
                <td>{record.displayStudentCount ?? record.studentCount ?? 0}</td>
                <td>{formatDisplayDate(record.createdDate) || 'Not set'}</td>
                <td>
                  <span className={`eval-status-pill ${statusMeta.tone}`}>
                    {statusMeta.label}
                  </span>
                </td>
                <td>
                  {statusMeta.actionKind === 'schedule' ? (
                    <ScheduleAttemptControl record={record} onAssign={onScheduleAttempt} onClear={onClearAttemptSchedule} />
                  ) : statusMeta.isApprovalPending || !statusMeta.actionLabel ? null : (
                    <button
                      type="button"
                      className={`tool-btn ${statusMeta.actionTone} eval-table-action`}
                      onClick={() => onOpenEvaluation(record)}
                    >
                      {statusMeta.actionLabel}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="eval-table-footer">
        <span>{totalRecords} results</span>
        <div className="eval-pagination" aria-label="Table pagination">
          <button
            type="button"
            className="eval-page-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>

          {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={`eval-page-btn ${currentPage === page ? 'is-active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className="eval-page-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pageCount}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SkillAssessmentPage({
  onAlert,
  evaluationRecords = [],
  completedEvaluationRows = [],
  approvalQueueRows = [],
  onStartEvaluation,
  onPublishEvaluation,
  onScheduleAttempt,
  onClearAttemptSchedule,
}) {
  const [viewMode, setViewMode] = useState('card')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSgt, setSelectedSgt] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedActivityType, setSelectedActivityType] = useState('')
  const [sortKey, setSortKey] = useState('createdDate')
  const [sortDirection, setSortDirection] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)

  const rawSourceRecords = evaluationRecords.length ? evaluationRecords : buildFallbackRecords()
  const sourceRecords = useMemo(() => rawSourceRecords.map((record) => {
    const approvalRecord = getApprovalRecord(record, approvalQueueRows)
    const resolvedAttemptNumber = getRecordAttemptNumber({ ...record, approvalRecord }, completedEvaluationRows)
    const statusMeta = getEvaluationStatusMeta({
      ...record,
      approvalRecord,
    })

    return {
      ...record,
      attemptCount: `Attempt ${resolvedAttemptNumber}`,
      reattemptStudentCount: resolvedAttemptNumber,
      approvalRecord,
      displayStudentCount: getCurrentAttemptStudentCount(record, approvalRecord),
      resolvedStatus: statusMeta.label,
      isSentToApproval: statusMeta.isApprovalPending,
      isApproved: statusMeta.isApproved,
      isPublished: statusMeta.isPublished,
      isRejected: statusMeta.isRejected,
      statusMeta,
    }
  }), [approvalQueueRows, completedEvaluationRows, rawSourceRecords])

  const yearOptions = useMemo(() => [...new Set(sourceRecords.map((record) => record.year).filter(Boolean))], [sourceRecords])
  const sgtOptions = useMemo(() => [...new Set(sourceRecords.map((record) => record.sgt).filter(Boolean))], [sourceRecords])
  const activityTypeOptions = useMemo(() => [...new Set(sourceRecords.map((record) => record.activityType).filter(Boolean))], [sourceRecords])

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return sourceRecords.filter((record) => {
      const matchesSearch = !normalizedSearch || [
        record.activityName,
        record.activityType,
        record.year,
        record.sgt,
      ].some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch))

      return (
        matchesSearch
        && (!selectedYear || record.year === selectedYear)
        && (!selectedSgt || record.sgt === selectedSgt)
        && (!selectedStatus || record.resolvedStatus === selectedStatus)
        && (!selectedActivityType || record.activityType === selectedActivityType)
      )
    })
  }, [sourceRecords, searchQuery, selectedYear, selectedSgt, selectedStatus, selectedActivityType])

  const sortedRecords = useMemo(() => {
    const records = [...filteredRecords]
    const direction = sortDirection === 'asc' ? 1 : -1

    records.sort((left, right) => {
      let leftValue = left[sortKey]
      let rightValue = right[sortKey]

      if (sortKey === 'studentCount') {
        leftValue = Number(left.displayStudentCount ?? left.studentCount ?? 0)
        rightValue = Number(right.displayStudentCount ?? right.studentCount ?? 0)
      } else if (sortKey === 'attemptCount') {
        leftValue = parseAttemptValue(left.attemptCount)
        rightValue = parseAttemptValue(right.attemptCount)
      } else if (sortKey === 'createdDate') {
        leftValue = parseDateValue(left.createdDate)
        rightValue = parseDateValue(right.createdDate)
      } else if (sortKey === 'resolvedStatus') {
        leftValue = String(left.resolvedStatus ?? '').toLowerCase()
        rightValue = String(right.resolvedStatus ?? '').toLowerCase()
      } else {
        leftValue = String(leftValue ?? '').toLowerCase()
        rightValue = String(rightValue ?? '').toLowerCase()
      }

      if (leftValue < rightValue) return -1 * direction
      if (leftValue > rightValue) return 1 * direction
      return 0
    })

    return records
  }, [filteredRecords, sortDirection, sortKey])

  const pageSize = 8
  const pageCount = Math.max(1, Math.ceil(sortedRecords.length / pageSize))
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedRecords.slice(startIndex, startIndex + pageSize)
  }, [currentPage, sortedRecords])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedYear, selectedSgt, selectedStatus, selectedActivityType, sortKey, sortDirection, viewMode])

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount)
    }
  }, [currentPage, pageCount])

  const metrics = useMemo(() => ({
    total: filteredRecords.length,
    pending: filteredRecords.filter((record) => record.resolvedStatus === 'Pending').length,
    completed: filteredRecords.filter((record) => ['Completed', 'Published'].includes(record.resolvedStatus)).length,
    years: new Set(filteredRecords.map((record) => record.year).filter(Boolean)).size,
    sgts: new Set(filteredRecords.map((record) => `${record.year}-${record.sgt}`).filter(Boolean)).size,
  }), [filteredRecords])

  const metricItems = [
    { label: 'Total', value: metrics.total, icon: ClipboardCheck, tone: 'is-total' },
    { label: 'Pending', value: metrics.pending, icon: Activity, tone: 'is-pending' },
    { label: 'Completed', value: metrics.completed, icon: CheckCircle2, tone: 'is-complete' },
    { label: 'Years', value: metrics.years, icon: GraduationCap, tone: 'is-years' },
    { label: 'SGTs', value: metrics.sgts, icon: FolderKanban, tone: 'is-sgts' },
  ]

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setSortDirection(key === 'createdDate' ? 'desc' : 'asc')
  }

  const handleOpenEvaluation = (record) => {
    const statusMeta = record.statusMeta ?? getEvaluationStatusMeta(record)

    if (statusMeta.isApprovalPending) return

    if (statusMeta.actionKind === 'schedule') return

    if (statusMeta.isApproved) {
      onPublishEvaluation?.(record)
      return
    }

    if (onStartEvaluation) {
      onStartEvaluation(record)
      return
    }

    onAlert?.({
      tone: 'primary',
      message: `Evaluation workspace opened for ${record.activityName} (${record.year} - ${record.sgt}).`,
    })
  }

  return (
    <section className="vx-content eval-page">
      <div className="eval-shell">
        <PageBreadcrumbs items={[{ label: 'Skills' }, { label: 'Evaluation' }]} />

        <section className="eval-stats">
          {metricItems.map((item) => {
            const Icon = item.icon
            return (
              <article key={item.label} className={`eval-stat ${item.tone}`}>
                <span className="eval-stat-icon"><Icon size={14} strokeWidth={2.1} /></span>
                <div className="eval-stat-copy">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              </article>
            )
          })}
        </section>

        <section className="eval-toolbar">
          <div className="eval-toolbar-row">
            <label className="eval-search">
              <Search size={15} strokeWidth={2} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search activity, year, SGT"
              />
            </label>

            <div className="eval-filters">
              <label className="eval-filter-chip">
                <span>Year</span>
                <div className="forms-select-wrap">
                  <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
                    <option value="">All years</option>
                    {yearOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              </label>

              <label className="eval-filter-chip">
                <span>SGT</span>
                <div className="forms-select-wrap">
                  <select value={selectedSgt} onChange={(event) => setSelectedSgt(event.target.value)}>
                    <option value="">All SGTs</option>
                    {sgtOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              </label>

              <label className="eval-filter-chip">
                <span>Type</span>
                <div className="forms-select-wrap">
                  <select value={selectedActivityType} onChange={(event) => setSelectedActivityType(event.target.value)}>
                    <option value="">All types</option>
                    {activityTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              </label>
            </div>

            <div className="eval-view-switch" role="tablist" aria-label="Evaluation layout">
              <button type="button" className={`eval-view-btn ${viewMode === 'card' ? 'is-active' : ''}`} onClick={() => setViewMode('card')}>
                <LayoutGrid size={14} strokeWidth={2} />
                Cards
              </button>
              <button type="button" className={`eval-view-btn ${viewMode === 'table' ? 'is-active' : ''}`} onClick={() => setViewMode('table')}>
                <Rows3 size={14} strokeWidth={2} />
                Table
              </button>
            </div>
          </div>
        </section>

        {filteredRecords.length ? (
          <section className="eval-content">
            {viewMode === 'card' ? (
              <div className="eval-card-grid">
                {sortedRecords.map((record) => (
                  <EvaluationCard
                    key={record.id}
                    record={record}
                    onOpenEvaluation={handleOpenEvaluation}
                    onScheduleAttempt={onScheduleAttempt}
                    onClearAttemptSchedule={onClearAttemptSchedule}
                  />
                ))}
              </div>
            ) : (
              <EvaluationTable
                records={paginatedRecords}
                onOpenEvaluation={handleOpenEvaluation}
                onScheduleAttempt={onScheduleAttempt}
                onClearAttemptSchedule={onClearAttemptSchedule}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
                currentPage={currentPage}
                pageCount={pageCount}
                totalRecords={sortedRecords.length}
                onPageChange={setCurrentPage}
              />
            )}
          </section>
        ) : (
          <section className="eval-empty">
            <CheckCircle2 size={22} strokeWidth={2} />
            <strong>No evaluation records match these filters.</strong>
            <p>Try a broader search or clear the active filters.</p>
          </section>
        )}
      </div>
    </section>
  )
}
