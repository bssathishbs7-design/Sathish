import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowUpDown,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Eye,
  FolderKanban,
  GraduationCap,
  Info,
  LayoutGrid,
  Rows3,
  Search,
  Users,
} from 'lucide-react'
import '../styles/review-approve.css'

const getDecisionTone = (value = '') => {
  const normalized = String(value).trim().toLowerCase()

  if (normalized.includes('published')) return 'is-published'
  if (normalized.includes('approved')) return 'is-approved'
  if (normalized.includes('completed')) return 'is-completed'
  if (normalized.includes('repeat')) return 'is-repeat'
  if (normalized.includes('remedial') || normalized.includes('rejected')) return 'is-remedial'

  return 'is-pending'
}

const getDisplayDecision = (row) => {
  const rawDecision = row.approvalStatus ?? row.status ?? row.decisionTitle ?? row.resultStatus ?? 'Pending Approval'
  const normalized = String(rawDecision).trim().toLowerCase()

  if (normalized === 'scheduled' || normalized === 'flow completed') {
    return 'Pending Approval'
  }

  return rawDecision
}

const shouldShowDecisionBadge = (value = '') => {
  const normalized = String(value).trim().toLowerCase()

  return normalized === 'approved' || normalized === 'approval rejected'
}

const getActivityToneClass = (value = '') => String(value).trim().toLowerCase().replace(/\s+/g, '-')

const formatReceivedDateTime = (value) => {
  if (!value) return { date: 'Not received', time: '' }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { date: 'Not received', time: '' }

  return {
    date: new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    }).format(date),
    time: new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date).toLowerCase(),
  }
}

const getAttemptValue = (row) => Number(row.attemptCount ?? row.attemptNumber ?? 1) || 1

const getSenderDetails = (row) => ({
  name: row.senderName ?? row.studentName ?? 'Sender name not set',
  id: row.senderId ?? row.registerId ?? 'Sender ID not set',
  designation: row.senderDesignation ?? row.senderRole ?? row.role ?? '',
})

const getActivityMeta = (row) => ({
  students: Number(row.totalStudents ?? row.evaluatedCount ?? row.studentRows?.length ?? 0) || 0,
  year: row.year ?? row.activityRecord?.year ?? 'Not set',
  sgt: row.sgt ?? row.activityRecord?.sgt ?? 'Not set',
})

function ReviewApproveCard({ row, isInfoOpen, onToggleInfo, onView }) {
  const decision = getDisplayDecision(row)
  const sender = getSenderDetails(row)
  const meta = getActivityMeta(row)
  const receivedAt = formatReceivedDateTime(row.receivedAt ?? row.sentAt ?? row.submittedAt)
  const activityType = row.activityType ?? 'Activity'
  const hasInfo = Boolean(sender.name || sender.id || sender.designation)

  return (
    <article className="review-approve-card">
      <div className="review-approve-card-top">
        <div className="review-approve-card-topline">
          <span className={`review-approve-type-chip ${getActivityToneClass(activityType)}`}>{activityType}</span>
          {shouldShowDecisionBadge(decision) ? (
            <span className={`review-approve-status-pill ${getDecisionTone(decision)}`}>{decision}</span>
          ) : null}
        </div>
      </div>

      <div className="review-approve-card-title">
        <h3>{row.activityName ?? 'Untitled Activity'}</h3>
      </div>

      <div className="review-approve-card-meta">
        <div className="review-approve-card-meta-item">
          <span><Users size={12} strokeWidth={2} /> Students</span>
          <strong>{meta.students}</strong>
        </div>
        <div className="review-approve-card-meta-item">
          <span><GraduationCap size={12} strokeWidth={2} /> Year</span>
          <strong>{meta.year}</strong>
        </div>
        <div className="review-approve-card-meta-item">
          <span><FolderKanban size={12} strokeWidth={2} /> SGT</span>
          <strong>{meta.sgt}</strong>
        </div>
      </div>

      <div className="review-approve-card-footer">
        <div className="review-approve-card-footer-meta">
          <div className="review-approve-card-footer-chip">
            <span>Attempt</span>
            <strong>{getAttemptValue(row)}</strong>
          </div>
        </div>

        <button type="button" className="tool-btn eval-view-btn review-approve-card-view-btn" onClick={onView}>
          View
        </button>
      </div>

      <div className="review-approve-card-date-row">
        <div className="review-approve-card-date">
          <CalendarClock size={12} strokeWidth={2} />
          {receivedAt.date}{receivedAt.time ? ` ${receivedAt.time}` : ''}
        </div>
        {hasInfo ? (
          <div className="review-approve-tooltip-wrap">
            <button
              type="button"
              className="review-approve-tooltip-btn"
              onClick={onToggleInfo}
              aria-expanded={isInfoOpen}
              aria-label="View sender details"
            >
              <Info size={12} strokeWidth={2.2} />
            </button>
            {isInfoOpen ? (
              <div className="review-approve-tooltip" role="tooltip">
                <small className="review-approve-tooltip-label">Created By</small>
                <strong>{sender.name}</strong>
                <span>{sender.id}</span>
                {sender.designation ? <span>{sender.designation}</span> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default function ReviewApprovePage({ approvalQueueRows = [], onAlert, onViewApproval }) {
  const [activeInfoId, setActiveInfoId] = useState('')
  const [viewMode, setViewMode] = useState('card')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortKey, setSortKey] = useState('receivedAt')
  const [sortDirection, setSortDirection] = useState('desc')

  const reviewRows = useMemo(() => {
    const activityRows = new Map()

    approvalQueueRows.forEach((row) => {
      const activityKey = row.activityId ?? row.id
      if (!activityKey || activityRows.has(activityKey)) return
      activityRows.set(activityKey, row)
    })

    return [...activityRows.values()]
  }, [approvalQueueRows])

  const typeOptions = useMemo(
    () => [...new Set(reviewRows.map((row) => row.activityType).filter(Boolean))],
    [reviewRows],
  )

  const filteredRows = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()

    return reviewRows.filter((row) => {
      const decision = String(getDisplayDecision(row))
      const sender = getSenderDetails(row)
      const meta = getActivityMeta(row)

      const matchesSearch = !needle || [
        row.activityName,
        row.activityType,
        sender.name,
        sender.id,
        meta.year,
        meta.sgt,
        decision,
      ].some((value) => String(value ?? '').toLowerCase().includes(needle))

      const matchesType = !selectedType || row.activityType === selectedType
      const matchesStatus = !selectedStatus || getDecisionTone(decision) === selectedStatus

      return matchesSearch && matchesType && matchesStatus
    })
  }, [reviewRows, searchQuery, selectedStatus, selectedType])

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows]
    const direction = sortDirection === 'asc' ? 1 : -1

    rows.sort((left, right) => {
      let leftValue = ''
      let rightValue = ''

      if (sortKey === 'receivedAt') {
        leftValue = Date.parse(left.receivedAt ?? left.sentAt ?? left.submittedAt ?? '') || 0
        rightValue = Date.parse(right.receivedAt ?? right.sentAt ?? right.submittedAt ?? '') || 0
      } else if (sortKey === 'students') {
        leftValue = getActivityMeta(left).students
        rightValue = getActivityMeta(right).students
      } else {
        leftValue = String(left[sortKey] ?? '').toLowerCase()
        rightValue = String(right[sortKey] ?? '').toLowerCase()
      }

      if (leftValue < rightValue) return -1 * direction
      if (leftValue > rightValue) return 1 * direction
      return 0
    })

    return rows
  }, [filteredRows, sortDirection, sortKey])

  const metrics = useMemo(() => ({
    total: reviewRows.length,
    pending: reviewRows.filter((row) => getDecisionTone(row.approvalStatus ?? row.status ?? row.resultStatus) === 'is-pending').length,
    completed: reviewRows.filter((row) => getDecisionTone(row.approvalStatus ?? row.status ?? row.resultStatus) === 'is-completed').length,
    years: new Set(reviewRows.map((row) => getActivityMeta(row).year).filter(Boolean)).size,
    rejected: reviewRows.filter((row) => getDecisionTone(row.approvalStatus ?? row.status ?? row.resultStatus) === 'is-remedial').length,
  }), [reviewRows])

  const metricItems = [
    { label: 'Total', value: metrics.total, icon: BadgeCheck, tone: 'is-total' },
    { label: 'Pending', value: metrics.pending, icon: Activity, tone: 'is-pending' },
    { label: 'Completed', value: metrics.completed, icon: CheckCircle2, tone: 'is-complete' },
    { label: 'Years', value: metrics.years, icon: GraduationCap, tone: 'is-years' },
    { label: 'Rejected', value: metrics.rejected, icon: Info, tone: 'is-rejected' },
  ]

  const handleViewApproval = (row) => {
    onViewApproval?.(row)
    onAlert?.({
      tone: 'secondary',
      message: `Viewing ${row.activityName ?? 'approval record'}.`,
    })
  }

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setSortDirection(key === 'receivedAt' ? 'desc' : 'asc')
  }

  return (
    <section className="vx-content eval-page review-approve-page">
      <div className="eval-shell review-approve-shell">
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

        <section className="eval-toolbar review-approve-toolbar">
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
                <span>Status</span>
                <div className="forms-select-wrap">
                  <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                    <option value="">All status</option>
                    <option value="is-pending">Pending</option>
                    <option value="is-completed">Completed</option>
                    <option value="is-approved">Approved</option>
                    <option value="is-remedial">Rejected</option>
                  </select>
                </div>
              </label>

              <label className="eval-filter-chip">
                <span>Type</span>
                <div className="forms-select-wrap">
                  <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
                    <option value="">All types</option>
                    {typeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              </label>
            </div>

            <div className="eval-view-switch" role="tablist" aria-label="Review approve layout">
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

        {sortedRows.length ? (
          <section className="review-approve-content">
            {viewMode === 'card' ? (
              <div className="eval-card-grid review-approve-card-grid">
                {sortedRows.map((row) => (
                  <ReviewApproveCard
                    key={row.id}
                    row={row}
                    isInfoOpen={activeInfoId === row.id}
                    onToggleInfo={() => setActiveInfoId((current) => (current === row.id ? '' : row.id))}
                    onView={() => handleViewApproval(row)}
                  />
                ))}
              </div>
            ) : (
              <div className="eval-table-wrap review-approve-table-wrap">
                <table className="eval-table review-approve-table">
                  <thead>
                    <tr>
                      <th>
                        <button type="button" className={`eval-table-sort ${sortKey === 'activityName' ? 'is-active' : ''}`} onClick={() => handleSort('activityName')}>
                          <span>Activity</span>
                          <ArrowUpDown size={12} strokeWidth={2} />
                        </button>
                      </th>
                      <th>Status</th>
                      <th>
                        <button type="button" className={`eval-table-sort ${sortKey === 'students' ? 'is-active' : ''}`} onClick={() => handleSort('students')}>
                          <span>Students</span>
                          <ArrowUpDown size={12} strokeWidth={2} />
                        </button>
                      </th>
                      <th>Year</th>
                      <th>SGT</th>
                      <th>
                        <button type="button" className={`eval-table-sort ${sortKey === 'receivedAt' ? 'is-active' : ''}`} onClick={() => handleSort('receivedAt')}>
                          <span>Received</span>
                          <ArrowUpDown size={12} strokeWidth={2} />
                        </button>
                      </th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row) => {
                      const meta = getActivityMeta(row)
                      const decision = getDisplayDecision(row)
                      const receivedAt = formatReceivedDateTime(row.receivedAt ?? row.sentAt ?? row.submittedAt)

                      return (
                        <tr key={row.id}>
                          <td>
                            <div className="eval-table-title">
                              <strong>{row.activityName ?? 'Untitled Activity'}</strong>
                            </div>
                          </td>
                          <td>
                            {shouldShowDecisionBadge(decision) ? (
                              <span className={`review-approve-status-pill ${getDecisionTone(decision)}`}>{decision}</span>
                            ) : null}
                          </td>
                          <td>{meta.students}</td>
                          <td>{meta.year}</td>
                          <td>{meta.sgt}</td>
                          <td>{receivedAt.date}{receivedAt.time ? ` ${receivedAt.time}` : ''}</td>
                          <td>
                            <button type="button" className="tool-btn eval-view-btn review-approve-table-btn" onClick={() => handleViewApproval(row)}>
                              <Eye size={13} strokeWidth={2} />
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <section className="eval-empty review-approve-empty">
            <BadgeCheck size={22} strokeWidth={2} />
            <strong>No approval records match these filters.</strong>
            <p>Try a broader search or clear the active filters.</p>
          </section>
        )}
      </div>
    </section>
  )
}
