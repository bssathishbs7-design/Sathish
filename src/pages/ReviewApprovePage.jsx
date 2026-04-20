import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  RotateCcw,
  Search,
  UserRoundCheck,
} from 'lucide-react'
import '../styles/review-approve.css'

const sampleReviewRows = [
  {
    id: 'review-sample-1',
    activityName: 'OSPE Station Review',
    activityType: 'OSPE',
    studentName: 'Aarav Menon',
    registerId: 'MC25101',
    decisionTitle: 'Completed',
    thresholdLabel: 'Meets',
    totalObtainedMarks: 8,
    totalMarks: 10,
  },
  {
    id: 'review-sample-2',
    activityName: 'Image Interpretation',
    activityType: 'Image',
    studentName: 'Diya Krishnan',
    registerId: 'MC25102',
    decisionTitle: 'Repeat',
    thresholdLabel: 'Below',
    totalObtainedMarks: 4,
    totalMarks: 10,
  },
  {
    id: 'review-sample-3',
    activityName: 'Clinical Form Assessment',
    activityType: 'OSCE',
    studentName: 'Kavin Raj',
    registerId: 'MC25103',
    decisionTitle: 'Remedial',
    thresholdLabel: 'Needs Review',
    totalObtainedMarks: 5,
    totalMarks: 10,
  },
]

const getDecisionTone = (value = '') => {
  const normalized = String(value).trim().toLowerCase()

  if (normalized === 'completed') return 'is-completed'
  if (normalized === 'repeat') return 'is-repeat'
  if (normalized === 'remedial') return 'is-remedial'

  return 'is-pending'
}

const formatMarks = (obtained, total) => {
  const safeObtained = Number(obtained) || 0
  const safeTotal = Number(total) || 0

  return `${safeObtained} / ${safeTotal || 'Nil'}`
}

export default function ReviewApprovePage({ approvalQueueRows = [], completedEvaluationRows = [], onAlert }) {
  const [search, setSearch] = useState('')
  const [approvedRows, setApprovedRows] = useState({})

  const sourceRows = approvalQueueRows.length ? approvalQueueRows : completedEvaluationRows.length ? completedEvaluationRows : sampleReviewRows
  const reviewRows = useMemo(() => {
    const needle = search.trim().toLowerCase()

    return sourceRows.filter((row) => {
      if (!needle) return true

      return [
        row.activityName,
        row.activityType,
        row.studentName,
        row.registerId,
        row.facultyName,
        row.employeeId,
        row.designation,
        row.decisionTitle,
        row.resultStatus,
        row.thresholdLabel,
      ].some((value) => String(value ?? '').toLowerCase().includes(needle))
    })
  }, [search, sourceRows])

  const approvedCount = Object.values(approvedRows).filter((status) => status === 'approved').length
  const returnedCount = Object.values(approvedRows).filter((status) => status === 'returned').length
  const pendingCount = Math.max(sourceRows.length - approvedCount - returnedCount, 0)

  const setReviewStatus = (row, status) => {
    setApprovedRows((current) => ({ ...current, [row.id]: status }))
    onAlert?.({
      tone: status === 'approved' ? 'secondary' : 'warning',
      message: `${row.studentName ?? 'Student'} ${status === 'approved' ? 'approved' : 'returned for review'}.`,
    })
  }

  const metrics = [
    { label: 'Pending Review', value: pendingCount, icon: ClipboardCheck, tone: 'is-pending' },
    { label: 'Approved', value: approvedCount, icon: CheckCircle2, tone: 'is-approved' },
    { label: 'Returned', value: returnedCount, icon: RotateCcw, tone: 'is-returned' },
  ]

  return (
    <section className="vx-content review-approve-page">
      <div className="review-approve-shell">
        <section className="review-approve-metrics">
          {metrics.map((item) => (
            <article key={item.label} className={`review-approve-metric ${item.tone}`}>
              <span><item.icon size={15} strokeWidth={2} /> {item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </section>

        <section className="review-approve-table-card">
          <div className="review-approve-table-head">
            <div>
              <strong>Approval List</strong>
              <p>{reviewRows.length} record{reviewRows.length === 1 ? '' : 's'} ready for review.</p>
            </div>
            <div className="review-approve-table-tools">
              <label className="review-approve-search">
                <Search size={16} strokeWidth={2} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity, student, result" />
              </label>
            </div>
          </div>

          <div className="review-approve-list">
            {reviewRows.length ? reviewRows.map((row) => {
              const rowStatus = approvedRows[row.id] ?? 'pending'
      const isApprovalCard = Boolean(row.facultyName || row.employeeId || row.designation)
      const decision = isApprovalCard ? 'Pending Approval' : row.decisionTitle ?? row.resultStatus ?? 'Pending'
      const identityName = isApprovalCard ? row.senderName ?? 'Sender' : row.studentName ?? 'Student'
      const identityId = isApprovalCard ? row.senderId ?? 'Sender ID not set' : row.registerId ?? 'Register ID not set'

      return (
        <article key={row.id} className={`review-approve-row ${rowStatus !== 'pending' ? `is-${rowStatus}` : ''}`}>
          <div className="review-approve-student">
            <span className="review-approve-avatar" aria-hidden="true">
              {identityName.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{identityName}</strong>
              <p>{identityId}</p>
            </div>
          </div>

          <div className="review-approve-activity">
            <strong>{row.activityName ?? 'Untitled Activity'}</strong>
            <p>{isApprovalCard ? `${row.activityType ?? 'Activity'} • ${row.source ?? 'Approval'}` : row.activityType ?? 'Activity'}</p>
          </div>

          <div className="review-approve-result">
            <span className={`review-approve-result-pill ${getDecisionTone(decision)}`}>{decision}</span>
            <small>{isApprovalCard ? row.designation : row.thresholdLabel ?? 'Threshold not set'}</small>
          </div>

          <div className="review-approve-score">
            <span>{isApprovalCard ? 'Evaluated' : 'Score'}</span>
            <strong>{isApprovalCard ? `${row.evaluatedCount ?? 0} / ${row.totalStudents ?? 0}` : formatMarks(row.totalObtainedMarks, row.totalMarks)}</strong>
          </div>

                  <div className="review-approve-actions">
                    <button type="button" className="ghost review-approve-return-btn" onClick={() => setReviewStatus(row, 'returned')}>
                      <RotateCcw size={14} strokeWidth={2} />
                      Return
                    </button>
                    <button type="button" className="tool-btn green review-approve-approve-btn" onClick={() => setReviewStatus(row, 'approved')}>
                      <UserRoundCheck size={14} strokeWidth={2} />
                      Approve
                    </button>
                  </div>
                </article>
              )
            }) : (
              <div className="review-approve-empty">
                <BadgeCheck size={24} strokeWidth={2} />
                <strong>No records found</strong>
                <p>Try another search term or complete evaluations to populate this queue.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
