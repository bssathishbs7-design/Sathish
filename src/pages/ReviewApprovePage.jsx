import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Eye,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
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

const isQuestionBankRow = (row) => String(row.activityType ?? '').trim().toLowerCase() === 'question bank'
const isAssessmentRow = (row) => String(row.activityType ?? '').trim().toLowerCase() === 'assessment'
const isEvaluationRow = (row) => String(row.activityType ?? '').trim().toLowerCase() === 'evaluation'

const formatCountValue = (value, fallback = 'Not set') => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? String(number) : fallback
}

const formatCompactValue = (value, fallback = 'Not set') => {
  if (Array.isArray(value)) {
    const values = value.map((item) => String(item ?? '').trim()).filter(Boolean)
    if (!values.length) return fallback
    if (values.length === 1) return values[0]
    return `${values[0]} +${values.length - 1}`
  }

  const text = String(value ?? '').trim()
  return text || fallback
}

const getUniqueQuestionValue = (row, key, fallback = 'Not set') => {
  const values = [...new Set((row.questionRows ?? [])
    .flatMap((question) => Array.isArray(question?.[key]) ? question[key] : [question?.[key]])
    .map((value) => String(value ?? '').trim())
    .filter(Boolean))]

  if (!values.length) return fallback
  if (values.length === 1) return values[0]
  return `${values[0]} +${values.length - 1}`
}

const getQuestionEditCount = (question) => {
  const explicitCount = Number(question?.editCount ?? question?.revisionCount ?? 0)
  if (explicitCount > 0) return explicitCount
  return String(question?.revisionStatus ?? '').trim().toLowerCase() === 'edited' ? 1 : 0
}

const getQuestionBankEditCount = (row) => {
  const explicitCount = Number(row.questionEditCount ?? row.questionEditedCount ?? 0)
  if (explicitCount > 0) return explicitCount

  return (row.questionRows ?? []).reduce((total, question) => total + getQuestionEditCount(question), 0)
}

const descriptiveTypeLabels = new Map([
  ['desc long answer questions (laqs)', 'LAQs'],
  ['desc short answer questions (saqs)', 'SAQs'],
  ['desc modified essay questions (meqs)', 'MEQs'],
  ['descriptive question', 'SAQs'],
  ['descriptive', 'SAQs'],
])

const getQuestionTypeLabel = (type) => {
  const normalized = String(type ?? '').trim()
  return descriptiveTypeLabels.get(normalized.toLowerCase()) ?? (normalized || 'Question')
}

const getQuestionTypeSummaryText = (row) => {
  if (row.questionTypeSummaryText) return row.questionTypeSummaryText

  if (Array.isArray(row.questionTypeSummary)) {
    return row.questionTypeSummary.map((item) => `${getQuestionTypeLabel(item.type)}: ${item.count}`).join(', ')
  }

  if (row.questionTypeSummary && typeof row.questionTypeSummary === 'object') {
    return Object.entries(row.questionTypeSummary).map(([type, count]) => `${getQuestionTypeLabel(type)}: ${count}`).join(', ')
  }

  const counts = (row.questionRows ?? []).reduce((summary, question) => ({
    ...summary,
    [getQuestionTypeLabel(question.type)]: (summary[getQuestionTypeLabel(question.type)] ?? 0) + 1,
  }), {})

  return Object.entries(counts).map(([type, count]) => `${type}: ${count}`).join(', ') || 'Not set'
}

const getQuestionTypeSummaryItems = (row) => {
  if (Array.isArray(row.questionTypeSummary)) {
    return row.questionTypeSummary.map((item) => ({ ...item, type: getQuestionTypeLabel(item.type) }))
  }

  if (row.questionTypeSummary && typeof row.questionTypeSummary === 'object') {
    return Object.entries(row.questionTypeSummary).map(([type, count]) => ({ type: getQuestionTypeLabel(type), count }))
  }

  const counts = (row.questionRows ?? []).reduce((summary, question) => ({
    ...summary,
    [getQuestionTypeLabel(question.type)]: (summary[getQuestionTypeLabel(question.type)] ?? 0) + 1,
  }), {})

  return Object.entries(counts).map(([type, count]) => ({ type, count }))
}

const getQuestionRevisionStatus = (row) => {
  if (row.questionRevisionStatus) return row.questionRevisionStatus
  if (row.questionChangeStatus) return row.questionChangeStatus

  return (row.questionRows ?? []).some((question) => question.revisionStatus === 'Edited')
    ? 'Edited'
    : 'Created'
}

function ReviewApproveCard({ row, isInfoOpen, onToggleInfo, onView }) {
  const decision = getDisplayDecision(row)
  const sender = getSenderDetails(row)
  const meta = getActivityMeta(row)
  const receivedAt = formatReceivedDateTime(row.receivedAt ?? row.sentAt ?? row.submittedAt)
  const activityType = row.activityType ?? 'Activity'
  const hasInfo = Boolean(sender.name || sender.id || sender.designation)
  const receivedDateTime = `${receivedAt.date}${receivedAt.time ? ` ${receivedAt.time}` : ''}`

  if (isAssessmentRow(row)) {
    const assessmentMode = row.assessmentMode ?? 'Not set'
    const primaryDetails = [
      { label: 'Category', value: row.examCategory ?? 'Not set' },
      { label: 'Assign to', value: row.assignTo ?? 'Not assigned' },
      { label: 'Exam Date', value: row.examDate ?? 'Not set' },
      { label: 'Start Time', value: row.startTime ?? 'Not set' },
    ]

    return (
      <article className="review-approve-card review-approve-assessment-card">
        <div className="review-approve-card-top">
          <div className="review-approve-card-topline">
            <span className={`review-approve-type-chip ${getActivityToneClass(activityType)}`}>{activityType}</span>
            <span className={`review-approve-status-pill ${getDecisionTone(decision)}`}>{decision}</span>
          </div>
          <div className="review-approve-card-title">
            <h3>{row.assessmentName ?? row.activityName ?? 'Untitled Assessment'}</h3>
          </div>
          <div className="review-approve-assessment-badges">
            <span className={`is-mode-${String(assessmentMode).trim().toLowerCase()}`}>{assessmentMode}</span>
            <span>{row.examType ?? 'Not selected'}</span>
            <span>{row.duration ?? '00:00'}</span>
          </div>
        </div>

        <div className="review-approve-assessment-grid">
          {primaryDetails.map((item) => (
            <div key={item.label} className="review-approve-assessment-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <div className="review-approve-card-date-row">
          <div className="review-approve-card-date">
            <CalendarClock size={12} strokeWidth={2} />
            {receivedDateTime}
          </div>
          {hasInfo ? (
            <div className="review-approve-tooltip-wrap">
              <button
                type="button"
                className="review-approve-tooltip-btn"
                onClick={onToggleInfo}
                aria-expanded={isInfoOpen}
                aria-label="View creator details"
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

        <div className="review-approve-card-footer">
          <button type="button" className="tool-btn eval-view-btn review-approve-card-view-btn" onClick={onView}>
            View
          </button>
        </div>
      </article>
    )
  }

  if (isQuestionBankRow(row)) {
    const questionRevisionStatus = getQuestionRevisionStatus(row)
    const revisionTone = questionRevisionStatus.toLowerCase()
    const questionEditCount = getQuestionBankEditCount(row)
    const questionRevisionLabel = questionRevisionStatus.toLowerCase() === 'edited' && questionEditCount
      ? `Edited ${questionEditCount}`
      : questionRevisionStatus
    const totalQuestions = Number(row.totalQuestions ?? row.questionRows?.length ?? row.totalStudents ?? 0) || 0
    const questionTypeItems = getQuestionTypeSummaryItems(row)

    return (
      <article className="review-approve-card review-approve-question-bank-card">
        <div className="review-approve-card-top">
          <div className="review-approve-card-topline">
            <span className={`review-approve-type-chip ${getActivityToneClass(activityType)}`}>{activityType}</span>
            <span className={`review-approve-question-state is-${revisionTone}`}>{questionRevisionLabel}</span>
          </div>
        </div>

        <div className="review-approve-qb-body">
          <div className="review-approve-qb-count">
            <strong>{totalQuestions}</strong>
            <span>Total Question{totalQuestions === 1 ? '' : 's'}</span>
          </div>
          <div className="review-approve-qb-types">
            <span className="review-approve-qb-label">
              <LayoutGrid size={12} strokeWidth={2.2} />
              Question Type
            </span>
            <div className="review-approve-qb-type-list" aria-label={getQuestionTypeSummaryText(row)}>
              {questionTypeItems.length ? questionTypeItems.map((item) => (
                <span key={item.type} className="review-approve-qb-type-chip">
                  {item.type}
                  <strong>{item.count}</strong>
                </span>
              )) : <span className="review-approve-qb-type-chip">Not set</span>}
            </div>
          </div>
        </div>

        <div className="review-approve-card-footer">
          <div className="review-approve-card-footer-meta">
            <div className="review-approve-qb-submitted">
              <CalendarClock size={12} strokeWidth={2} />
              <span className="review-approve-qb-submitted-copy">
                <span className="review-approve-qb-submitted-label">Created By</span>
                <span className="review-approve-qb-submitted-name">{sender.name}</span>
                <span className="review-approve-qb-submitted-date">{receivedDateTime}</span>
              </span>
            </div>
          </div>

          <button type="button" className="tool-btn eval-view-btn review-approve-card-view-btn" onClick={onView}>
            View
          </button>
        </div>
      </article>
    )
  }

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
          {receivedDateTime}
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
  const [activeModuleTab, setActiveModuleTab] = useState('assessment')
  const [searchQuery, setSearchQuery] = useState('')
  const [isReviewFilterOpen, setIsReviewFilterOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortKey, setSortKey] = useState('receivedAt')
  const [sortDirection, setSortDirection] = useState('desc')

  const reviewRows = useMemo(() => {
    const activityRows = new Map()

    approvalQueueRows.forEach((row) => {
      const activityKey = row.activityId ?? row.id
      const approvalStatus = String(row.approvalStatus ?? row.status ?? row.reviewStatus ?? '').trim().toLowerCase()
      if (isQuestionBankRow(row) && approvalStatus && approvalStatus !== 'pending approval') return
      if (!activityKey || activityRows.has(activityKey)) return
      activityRows.set(activityKey, row)
    })

    return [...activityRows.values()]
  }, [approvalQueueRows])

  const getReviewModuleKey = (row) => {
    const type = String(row.activityType ?? '').trim().toLowerCase()
    const decision = String(getDisplayDecision(row)).trim().toLowerCase()

    if (decision.includes('published')) return 'published'
    if (type.includes('question bank')) return 'questionBank'
    if (type.includes('assessment')) return 'assessment'
    if (type.includes('evaluation')) return 'evaluation'
    if (type.includes('skill')) return 'evaluation'
    if (type.includes('interpretation') || type.includes('ospe') || type.includes('osce') || type.includes('activity')) return 'evaluation'
    if (type.includes('result')) return 'results'

    return 'evaluation'
  }

  const moduleTabs = [
    { key: 'questionBank', label: 'Question Bank' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'evaluation', label: 'Skill Assessment' },
  ].map((tab) => ({
    ...tab,
    count: reviewRows.filter((row) => getReviewModuleKey(row) === tab.key).length,
  }))

  const filteredRows = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()

    return reviewRows.filter((row) => {
      const decision = String(getDisplayDecision(row))
      const sender = getSenderDetails(row)
      const meta = getActivityMeta(row)

      const matchesSearch = !needle || [
        row.activityName,
        row.activityType,
        row.assessmentName,
        row.assessmentMode,
        row.examCategory,
        row.academicYear,
        row.assignTo,
        row.examDate,
        row.startTime,
        row.examType,
        sender.name,
        sender.id,
        meta.year,
        meta.sgt,
        decision,
      ].some((value) => String(value ?? '').toLowerCase().includes(needle))

      const matchesModule = getReviewModuleKey(row) === activeModuleTab
      const matchesStatus = !selectedStatus || getDecisionTone(decision) === selectedStatus

      return matchesSearch && matchesModule && matchesStatus
    })
  }, [activeModuleTab, reviewRows, searchQuery, selectedStatus])

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

  const getCompactRowTitle = (row) => row.assessmentName ?? row.activityName ?? (
    isQuestionBankRow(row) ? 'Question Bank Review' : 'Untitled Activity'
  )

  const getCompactRowSummary = (row) => {
    if (isQuestionBankRow(row)) {
      const totalQuestions = Number(row.totalQuestions ?? row.questionRows?.length ?? row.totalStudents ?? 0) || 0
      return `${totalQuestions} question${totalQuestions === 1 ? '' : 's'} • ${getQuestionTypeSummaryText(row)}`
    }

    if (isAssessmentRow(row)) {
      return `${row.examCategory ?? 'Assessment'} • ${row.assessmentMode ?? 'Mode not set'} • ${row.examType ?? 'Type not set'}`
    }

    const meta = getActivityMeta(row)
    return `${meta.students} students • ${meta.year} • ${meta.sgt}`
  }

  const getCompactCardDetails = (row, { receivedAt, sender, meta }) => {
    if (isQuestionBankRow(row)) {
      const totalQuestions = Number(row.totalQuestions ?? row.questionRows?.length ?? row.totalStudents ?? 0) || 0
      const subject = formatCompactValue(row.subject ?? getUniqueQuestionValue(row, 'subject', meta.sgt))
      const topic = formatCompactValue(row.topic ?? row.topics ?? getUniqueQuestionValue(row, 'topics', 'Topics not set'))

      return [
        { label: 'Question Types', value: getQuestionTypeSummaryText(row), hint: `${formatCountValue(totalQuestions, '0')} questions` },
        { label: 'Subject', value: subject, hint: topic },
        { label: 'Submitted By', value: sender.name, hint: sender.id },
        { label: 'Received', value: receivedAt.date, hint: receivedAt.time || 'Time not set' },
      ]
    }

    if (isAssessmentRow(row)) {
      return [
        { label: 'Marks', value: formatCountValue(row.totalMarks), hint: row.totalMarksDetail ?? 'Total marks' },
        { label: 'Questions', value: formatCountValue(row.questionCount ?? row.totalQuestions ?? row.questionRows?.length, '0'), hint: row.examType ?? 'Question type not set' },
        { label: 'Exam Setup', value: row.assessmentMode ?? 'Mode not set', hint: row.examCategory ?? 'Category not set' },
        { label: 'Schedule', value: row.examDate ?? 'Date not set', hint: row.startTime ?? row.duration ?? 'Time not set' },
      ]
    }

    if (isEvaluationRow(row)) {
      const evaluated = Number(row.evaluatedCount ?? row.completedCount ?? row.completedStudents ?? 0) || 0
      const totalStudents = Number(row.totalStudents ?? row.studentCount ?? meta.students ?? 0) || 0
      const status = row.evaluationStatus ?? row.resultStatus ?? row.status ?? 'Status not set'

      return [
        { label: 'Evaluation', value: status, hint: `${evaluated} / ${totalStudents || 0} students` },
        { label: 'Assessment', value: row.assessmentName ?? row.activityName ?? 'Untitled Assessment', hint: row.examType ?? 'Type not set' },
        { label: 'Evaluator', value: sender.name, hint: sender.id },
        { label: 'Received', value: receivedAt.date, hint: receivedAt.time || 'Time not set' },
      ]
    }

    return [
      { label: 'Received', value: receivedAt.date, hint: receivedAt.time || 'Time not set' },
      { label: 'Submitted By', value: sender.name, hint: sender.id },
      { label: 'Year', value: meta.year, hint: meta.sgt },
      { label: 'Students', value: meta.students, hint: row.examType ?? 'Not set' },
    ]
  }

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

  const handleFilterSortChange = (value) => {
    if (value === 'received-desc') {
      setSortKey('receivedAt')
      setSortDirection('desc')
    } else if (value === 'received-asc') {
      setSortKey('receivedAt')
      setSortDirection('asc')
    } else {
      setSortKey('activityName')
      setSortDirection('asc')
    }
  }

  const activeFilterSort = sortKey === 'activityName'
    ? 'item-asc'
    : sortDirection === 'asc'
      ? 'received-asc'
      : 'received-desc'

  return (
    <section className="vx-content eval-page review-approve-page assessment-page assessment-create-tracker-page">
      <div className="eval-shell review-approve-shell assessment-page-shell assessment-create-page-shell">
        <div className="assessment-create-page-header review-approve-breadcrumb-head">
          <PageNavigationHeader items={['My Pages', 'Approval Queue']} />
        </div>

        <section className="review-approve-board">
          <section className="assessment-create-tabbar review-approve-module-tabbar" aria-label="Review module tabs">
            <div className="assessment-create-tabs review-approve-module-tabs" role="tablist" aria-label="Review modules">
              {moduleTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`assessment-create-tab ${activeModuleTab === tab.key ? 'is-active' : ''}`.trim()}
                  onClick={() => setActiveModuleTab(tab.key)}
                  role="tab"
                  aria-selected={activeModuleTab === tab.key}
                >
                  <span>{tab.label}</span>
                  <strong>{tab.count}</strong>
                </button>
              ))}
            </div>
            <div className="review-approve-tab-actions">
              <label className="eval-search">
                <Search size={15} strokeWidth={2} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search review items..."
                />
              </label>

              <div className="review-approve-filter-wrap">
                <button
                  type="button"
                  className={`review-approve-filter-btn ${isReviewFilterOpen ? 'is-open' : ''}`.trim()}
                  onClick={() => setIsReviewFilterOpen((current) => !current)}
                  aria-expanded={isReviewFilterOpen}
                >
                  <SlidersHorizontal size={15} strokeWidth={2.2} />
                  Filter
                </button>
                {isReviewFilterOpen ? (
                  <div className="review-approve-filter-popover" role="dialog" aria-label="Review filters">
                    <label>
                      <span>Module</span>
                      <select value={activeModuleTab} onChange={(event) => setActiveModuleTab(event.target.value)}>
                        {moduleTabs.map((tab) => (
                          <option key={tab.key} value={tab.key}>{tab.label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Review Status</span>
                      <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                        <option value="">All Status</option>
                        <option value="is-pending">Pending</option>
                        <option value="is-completed">Completed</option>
                        <option value="is-approved">Approved</option>
                        <option value="is-remedial">Rejected</option>
                      </select>
                    </label>
                    <label>
                      <span>Sort By</span>
                      <select value={activeFilterSort} onChange={(event) => handleFilterSortChange(event.target.value)}>
                        <option value="received-desc">Newest Received</option>
                        <option value="received-asc">Oldest Received</option>
                        <option value="item-asc">Item Name</option>
                      </select>
                    </label>
                    <div className="review-approve-filter-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStatus('')
                          setActiveModuleTab('assessment')
                          setSortKey('receivedAt')
                          setSortDirection('desc')
                        }}
                      >
                        Reset
                      </button>
                      <button type="button" className="is-primary" onClick={() => setIsReviewFilterOpen(false)}>
                        Apply
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {sortedRows.length ? (
            <section className="review-approve-content">
            <div className="review-approve-compact-card-grid" role="list">
              {sortedRows.map((row) => {
                const decision = getDisplayDecision(row)
                const receivedAt = formatReceivedDateTime(row.receivedAt ?? row.sentAt ?? row.submittedAt)
                const sender = getSenderDetails(row)
                const meta = getActivityMeta(row)
                const moduleLabel = row.activityType ?? moduleTabs.find((tab) => tab.key === getReviewModuleKey(row))?.label ?? 'Activity'
                const cardDetails = getCompactCardDetails(row, { receivedAt, sender, meta })

                return (
                  <article key={row.id} className="review-approve-compact-card" role="listitem">
                    <div className="review-approve-compact-card-top">
                      <div className="review-approve-compact-title">
                        <strong>{getCompactRowTitle(row)}</strong>
                        <span>{getCompactRowSummary(row)}</span>
                      </div>
                    </div>

                    <div className="review-approve-compact-card-badges">
                      <span className={`review-approve-type-chip ${getActivityToneClass(moduleLabel)}`}>{moduleLabel}</span>
                      <span className={`review-approve-status-pill ${getDecisionTone(decision)}`}>{decision}</span>
                    </div>

                    <div className="review-approve-compact-card-details">
                      {cardDetails.map((item) => (
                        <span key={`${item.label}-${item.value}`}>
                          <small>{item.label}</small>
                          <strong>{item.value}</strong>
                          <em>{item.hint}</em>
                        </span>
                      ))}
                    </div>

                    <div className="review-approve-compact-card-footer">
                      <button type="button" className="tool-btn eval-view-btn review-approve-table-btn" onClick={() => handleViewApproval(row)}>
                        <Eye size={13} strokeWidth={2} />
                        View
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
            </section>
          ) : (
            <section className="eval-empty review-approve-empty">
              <BadgeCheck size={22} strokeWidth={2} />
              <strong>No approval records match these filters.</strong>
              <p>Try a broader search or clear the active filters.</p>
            </section>
          )}
        </section>
      </div>
    </section>
  )
}
