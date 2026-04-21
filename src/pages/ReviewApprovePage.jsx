import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  CalendarClock,
  Eye,
  Info,
} from 'lucide-react'
import '../styles/review-approve.css'

const getDecisionTone = (value = '') => {
  const normalized = String(value).trim().toLowerCase()

  if (normalized === 'completed') return 'is-completed'
  if (normalized === 'repeat') return 'is-repeat'
  if (normalized === 'remedial') return 'is-remedial'

  return 'is-pending'
}

const formatReceivedDateTime = (value) => {
  if (!value) return { date: 'Not received', time: '' }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return { date: 'Not received', time: '' }

  return {
    date: new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date),
    time: new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date),
  }
}

const getActivityToneClass = (value = '') => String(value).trim().toLowerCase().replace(/\s+/g, '-')

export default function ReviewApprovePage({ approvalQueueRows = [], onAlert, onViewApproval }) {
  const [activeSenderInfoId, setActiveSenderInfoId] = useState('')
  const sourceRows = approvalQueueRows
  const reviewRows = useMemo(() => {
    const activityRows = new Map()

    sourceRows.forEach((row) => {
      const activityKey = row.activityId ?? row.id
      if (!activityKey || activityRows.has(activityKey)) return
      activityRows.set(activityKey, row)
    })

    return [...activityRows.values()]
  }, [sourceRows])

  const handleViewApproval = (row) => {
    onViewApproval?.(row)
    onAlert?.({
      tone: 'secondary',
      message: `Viewing ${row.activityName ?? 'approval record'}.`,
    })
  }

  return (
    <section className="vx-content review-approve-page">
      <div className="review-approve-shell">
        <section className="review-approve-table-card">
          <div className="review-approve-list">
            {reviewRows.length ? reviewRows.map((row) => {
              const isApprovalCard = Boolean(row.facultyName || row.employeeId || row.designation)
              const decision = isApprovalCard ? 'Pending Approval' : row.decisionTitle ?? row.resultStatus ?? 'Pending'
              const senderName = row.senderName ?? row.studentName ?? 'Sender name not set'
              const senderId = row.senderId ?? row.registerId ?? 'Sender ID not set'
              const senderDesignation = row.senderDesignation ?? row.senderRole ?? row.role ?? ''
              const receivedAt = formatReceivedDateTime(row.receivedAt ?? row.sentAt ?? row.submittedAt)
              const isSenderInfoOpen = activeSenderInfoId === row.id
              const activityType = row.activityType ?? 'Activity'

              return (
                <article key={row.id} className="review-approve-row">
                  <div className="review-approve-profile-head">
                    <div className="review-approve-header-badges">
                      <span className={`review-approve-activity-pill ${getActivityToneClass(activityType)}`}>{activityType}</span>
                      <span className={`review-approve-result-pill ${getDecisionTone(decision)}`}>{decision}</span>
                    </div>
                    <div className="review-approve-sender-info-wrap">
                      <button
                        type="button"
                        className={`review-approve-info-btn ${isSenderInfoOpen ? 'is-open' : ''}`}
                        onClick={() => setActiveSenderInfoId(isSenderInfoOpen ? '' : row.id)}
                        aria-expanded={isSenderInfoOpen}
                        aria-label="View sender details"
                      >
                        <Info size={15} strokeWidth={2.2} />
                      </button>
                      {isSenderInfoOpen ? (
                        <div className="review-approve-info-tooltip" role="tooltip">
                          <strong>{senderName}</strong>
                          <span>{senderId}</span>
                          {senderDesignation ? <span>{senderDesignation}</span> : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="review-approve-profile-stats">
                    <div className="review-approve-profile-activity-name">
                      <strong>{row.activityName ?? 'Untitled Activity'}</strong>
                    </div>
                  </div>

                  <div className="review-approve-profile-foot">
                    <span>
                      <CalendarClock size={15} strokeWidth={2} />
                      {receivedAt.date}{receivedAt.time ? `, ${receivedAt.time}` : ''}
                    </span>
                    <button type="button" className="ghost review-approve-view-btn" onClick={() => handleViewApproval(row)}>
                      <Eye size={14} strokeWidth={2} />
                      View
                    </button>
                  </div>
                </article>
              )
            }) : (
              <div className="review-approve-empty">
                <BadgeCheck size={24} strokeWidth={2} />
                <strong>No records found</strong>
                <p>Send an activity result to approval to populate this queue.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
