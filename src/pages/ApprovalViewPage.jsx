import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpDown,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Info,
  RotateCcw,
  Search,
  Users,
  X,
} from 'lucide-react'
import '../styles/approval-view.css'

const formatDateTime = (value) => {
  if (!value) return 'Not received'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not received'

  const dateText = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
  const timeText = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

  return `${dateText}, ${timeText}`
}

const getActivityToneClass = (value = '') => String(value).trim().toLowerCase().replace(/\s+/g, '-')

const formatPercent = (value) => `${Number(value ?? 0).toFixed(1).replace(/\.0$/, '')}%`

const formatMarks = (value) => {
  const numericValue = Number(value ?? 0)
  if (Number.isNaN(numericValue)) return '0'
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(2).replace(/\.?0+$/, '')
}

const getResultTone = (value = '') => {
  const normalized = String(value).trim().toLowerCase()

  if (normalized === 'completed') return 'is-completed'
  if (normalized === 'repeat') return 'is-repeat'
  if (normalized === 'remedial') return 'is-remedial'

  return 'is-pending'
}

const escapeCsvCell = (value) => {
  const normalizedValue = String(value ?? '').replace(/\r?\n|\r/g, ' ').trim()
  return `"${normalizedValue.replace(/"/g, '""')}"`
}

const sanitizeFileName = (value) => String(value ?? 'approval-view')
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase()
  || 'approval-view'

const downloadCsv = ({ fileName, headers, rows }) => {
  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n')
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${sanitizeFileName(fileName)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const getStudentName = (row) => row.studentName ?? row.name ?? 'Student'
const getStudentId = (row) => row.registerId ?? row.studentId ?? '-'
const getStudentAttempt = (row) => Number(row.attemptCount ?? row.attemptNumber) || 1
const getStudentTotalMarks = (row) => Number(row.totalMarks ?? row.maxMarks ?? 1) || 1
const getStudentObtainedMarks = (row) => Number(row.totalObtainedMarks ?? row.obtainedMarks ?? row.score ?? 0) || 0
const getStudentPercentage = (row) => Number(row.totalPercentage ?? ((getStudentObtainedMarks(row) / getStudentTotalMarks(row)) * 100)) || 0
const getStudentResult = (row) => row.resultStatus ?? row.evaluationStatus ?? '-'
const getSectionMarks = (row, key) => Number(row[key]?.obtainedMarks ?? row[`${key}Marks`] ?? 0) || 0
const getCriticalMarks = (row) => Number(row.overallCriticalMarks ?? row.criticalMarks ?? 0) || 0
const getThresholdLabel = (row) => row.thresholdLabel ?? row.threshold ?? 'Not Matched'
const getThresholdTone = (value = '') => {
  const normalized = String(value).trim().toLowerCase()

  if (normalized.includes('exceed') || normalized.includes('match') || normalized.includes('pass')) return 'is-completed'
  if (normalized.includes('below') || normalized.includes('not matched')) return 'is-remedial'

  return 'is-neutral'
}

const buildDomainBadges = (item = {}) => {
  const badges = []

  if (item.cognitive || item.domain === 'Cognitive') {
    badges.push({ label: `COG ${item.cognitive ?? 'Yes'}`, tone: 'is-domain-cognitive' })
  }

  if (item.affective) {
    badges.push({ label: `AFF ${item.affective}`, tone: 'is-domain-affective' })
  }

  if (item.psychomotor || item.domain === 'Psychomotor') {
    badges.push({ label: `PSY ${item.psychomotor ?? 'Yes'}`, tone: 'is-domain-psychomotor' })
  }

  return badges
}

const buildPerformanceItems = (record, row) => {
  const activitySource = row?.activityRecord?.assignment
    ?? row?.activityRecord
    ?? record?.assignment
    ?? record
    ?? {}
  const modules = activitySource?.examData?.modules ?? {}
  const answers = row?.answers ?? row?.submissionAnswers ?? row?.activityRecord?.latestSubmission?.answers ?? {}
  const evaluationDraft = row?.evaluationDraft ?? {}

  const getItemState = (type, itemId) => {
    if (type === 'checklist') {
      return {
        decision: evaluationDraft.checklistDecisions?.[itemId] ?? '',
        marks: evaluationDraft.checklistMarks?.[itemId] ?? 0,
        remarks: evaluationDraft.checklistRemarks?.[itemId] ?? '',
      }
    }

    if (type === 'form') {
      return {
        decision: evaluationDraft.formDecisions?.[itemId] ?? '',
        marks: evaluationDraft.formMarks?.[itemId] ?? 0,
        remarks: evaluationDraft.formRemarks?.[itemId] ?? '',
      }
    }

    if (type === 'scaffolding') {
      return {
        decision: evaluationDraft.scaffoldingDecisions?.[itemId] ?? '',
        marks: evaluationDraft.scaffoldingMarks?.[itemId] ?? 0,
        remarks: evaluationDraft.scaffoldingRemarks?.[itemId] ?? '',
      }
    }

    if (type === 'image') {
      return {
        decision: evaluationDraft.imageDecisions?.[itemId] ?? '',
        marks: evaluationDraft.imageMarks?.[itemId] ?? 0,
        remarks: evaluationDraft.imageRemarks?.[itemId] ?? '',
      }
    }

    return {
      decision: evaluationDraft.manualQuestionDecisions?.[itemId] ?? '',
      marks: evaluationDraft.manualQuestionMarks?.[itemId] ?? 0,
      remarks: evaluationDraft.manualQuestionRemarks?.[itemId] ?? '',
    }
  }

  const resolveAnswer = (type, item) => {
    if (type === 'form') {
      const responses = (item.responses ?? []).map((response) => ({
        label: response.label ?? response.key ?? 'Response',
        value: answers.forms?.[response.id ?? response.key ?? ''] ?? 'Not answered',
      }))

      return responses.length
        ? responses.map((response) => `${response.label}: ${response.value}`).join(' | ')
        : 'Not answered'
    }

    if (type === 'scaffolding') return answers.scaffolding?.[item.id] ?? 'Not answered'
    if (type === 'checklist') return answers.questions?.[item.id] ?? answers.scaffolding?.[item.id] ?? 'Checklist review'

    return answers.questions?.[item.id] ?? 'Not answered'
  }

  const buildItems = (items = [], type, fallbackLabel) => items.map((item, index) => {
    const itemId = item.id ?? `${type}-${index + 1}`
    const state = getItemState(type, itemId)

    return {
      id: itemId,
      label: item.label ?? item.text ?? item.questionText ?? `${fallbackLabel} ${index + 1}`,
      prompt: item.prompt ?? item.questionText ?? item.text ?? `${fallbackLabel} ${index + 1}`,
      answer: resolveAnswer(type, { ...item, id: itemId }),
      marks: Number(item.marks) || 0,
      obtainedMarks: Number(state.marks) || 0,
      decision: state.decision || 'Not evaluated',
      remarks: state.remarks || '',
      isCritical: Boolean(item.isCritical),
      tags: item.tags ?? [],
      domains: buildDomainBadges(item),
      sectionLabel: type,
    }
  })

  const moduleItems = [
    ...buildItems(modules.checklist ?? [], 'checklist', 'Checklist Item'),
    ...buildItems(modules.form ?? [], 'form', 'Form'),
    ...buildItems(modules.questions ?? [], String(record?.activityType ?? '').toLowerCase() === 'image' ? 'image' : 'question', 'Question'),
    ...buildItems(modules.scaffolding ?? [], 'scaffolding', 'Scaffolding'),
  ]

  if (moduleItems.length) return moduleItems

  if (Array.isArray(row?.itemSummaries) && row.itemSummaries.length) {
    return row.itemSummaries.map((item, index) => ({
      id: item.id ?? `summary-${index + 1}`,
      label: item.label ?? `${item.type ?? 'Item'} ${index + 1}`,
      prompt: item.sectionLabel ?? item.label ?? `${item.type ?? 'Item'} ${index + 1}`,
      answer: 'Detailed answer not available',
      marks: Number(item.totalMarks) || 0,
      obtainedMarks: Number(item.obtainedMarks) || 0,
      decision: item.decisionState || (item.isCompleted ? 'Completed' : 'Not evaluated'),
      remarks: '',
      isCritical: Boolean(item.isCritical),
      tags: [],
      domains: [],
      sectionLabel: item.sectionLabel ?? item.type ?? 'section',
    }))
  }

  return []
}

const getDisplayApprovalStatus = (value = '') => {
  const normalized = String(value ?? '').trim().toLowerCase()

  if (normalized === 'scheduled' || normalized === 'flow completed') {
    return 'Pending Approval'
  }

  return value || 'Pending Approval'
}

const questionColumnOptions = [
  { key: 'checklist', label: 'Checklist' },
  { key: 'form', label: 'Form' },
  { key: 'question', label: 'Question' },
  { key: 'scaffolding', label: 'Scaffolding' },
]

const normalizeSectionKey = (value = '') => {
  const rawValue = typeof value === 'object' ? value.key ?? value.label : value
  const normalized = String(rawValue ?? '').trim().toLowerCase()

  if (normalized.includes('checklist')) return 'checklist'
  if (normalized.includes('form')) return 'form'
  if (normalized.includes('question') || normalized.includes('manual') || normalized.includes('interpretation')) return 'question'
  if (normalized.includes('scaffold')) return 'scaffolding'

  return normalized
}

const getSectionLabel = (section) => {
  const key = normalizeSectionKey(section)
  const fallbackLabel = questionColumnOptions.find((column) => column.key === key)?.label

  return typeof section === 'object'
    ? section.label ?? fallbackLabel ?? key
    : fallbackLabel ?? String(section ?? '')
}

const StatCard = ({ icon: Icon, label, value, tone = '' }) => (
  <article className={`approval-view-stat ${tone}`}>
    <span aria-hidden="true">
      <Icon size={17} strokeWidth={2.2} />
    </span>
    <div>
      <small>{label}</small>
      <strong>{value ?? 0}</strong>
    </div>
  </article>
)

const InfoTooltipButton = ({ id, icon: Icon, label, title, items, activeTooltipId, onToggle }) => {
  const isOpen = activeTooltipId === id
  const visibleItems = items.filter((item) => item.value)

  return (
    <div className="approval-view-info-wrap">
      <button
        type="button"
        className={`approval-view-info-btn ${isOpen ? 'is-open' : ''}`}
        onClick={() => onToggle(isOpen ? '' : id)}
        aria-expanded={isOpen}
        aria-label={label}
      >
        <Icon size={15} strokeWidth={2.2} />
      </button>
      {isOpen ? (
        <div className="approval-view-info-tooltip" role="tooltip">
          <strong>{title}</strong>
          {visibleItems.map((item) => (
            <span key={item.label}>
              <small>{item.label}</small>
              {item.value}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function ApprovalViewPage({ approvalRecord, completedEvaluationRows = [], onBack, onAlert, onApprovalAction }) {
  const [activeTooltipId, setActiveTooltipId] = useState('')
  const [reviewRemarks, setReviewRemarks] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [studentStatusFilter, setStudentStatusFilter] = useState('all')
  const [studentSortKey, setStudentSortKey] = useState('studentName')
  const [studentSortDirection, setStudentSortDirection] = useState('asc')
  const [studentPage, setStudentPage] = useState(1)
  const [selectedPerformanceRow, setSelectedPerformanceRow] = useState(null)
  const studentPageSize = 10
  const approvalStudentRows = useMemo(() => {
    if (!approvalRecord) return []

    const completedRowsForActivity = completedEvaluationRows.filter((row) => row.activityId === approvalRecord.activityId)
    const completedRowByStudent = new Map()

    completedRowsForActivity.forEach((row) => {
      const key = row.studentId ?? row.registerId ?? row.id
      if (!key) return

      const current = completedRowByStudent.get(key)
      const rowAttempt = Number(row.attemptCount ?? row.attemptNumber) || 1
      const currentAttempt = Number(current?.attemptCount ?? current?.attemptNumber) || 0

      if (!current || rowAttempt >= currentAttempt) {
        completedRowByStudent.set(key, row)
      }
    })

    const rows = Array.isArray(approvalRecord.studentRows) && approvalRecord.studentRows.length
      ? approvalRecord.studentRows
      : completedRowsForActivity
    const latestRows = new Map()

    rows.forEach((row) => {
      const key = row.studentId ?? row.registerId ?? row.id
      if (!key) return
      const completedRow = completedRowByStudent.get(key)
      const mergedRow = {
        ...completedRow,
        ...row,
        checklist: row.checklist ?? completedRow?.checklist,
        form: row.form ?? completedRow?.form,
        question: row.question ?? completedRow?.question,
        scaffolding: row.scaffolding ?? completedRow?.scaffolding,
        overallCriticalMarks: row.overallCriticalMarks ?? completedRow?.overallCriticalMarks,
        thresholdLabel: row.thresholdLabel ?? completedRow?.thresholdLabel,
      }

      const current = latestRows.get(key)
      const rowAttempt = Number(mergedRow.attemptCount ?? mergedRow.attemptNumber) || 1
      const currentAttempt = Number(current?.attemptCount ?? current?.attemptNumber) || 0

      if (!current || rowAttempt >= currentAttempt) {
        latestRows.set(key, mergedRow)
      }
    })

    return [...latestRows.values()]
  }, [approvalRecord, completedEvaluationRows])
  const evaluatedStudentRows = useMemo(() => (
    approvalStudentRows.filter((row) => ['completed', 'repeat', 'remedial'].includes(String(getStudentResult(row)).trim().toLowerCase()))
  ), [approvalStudentRows])
  const filteredStudentRows = useMemo(() => {
    const needle = studentSearch.trim().toLowerCase()

    return evaluatedStudentRows.filter((row) => {
      const result = String(getStudentResult(row)).trim().toLowerCase()
      const matchesStatus = studentStatusFilter === 'all' || result === studentStatusFilter
      const matchesSearch = !needle
        || getStudentName(row).toLowerCase().includes(needle)
        || String(getStudentId(row)).toLowerCase().includes(needle)
        || result.includes(needle)
        || String(getStudentAttempt(row)).includes(needle)
        || `attempt ${getStudentAttempt(row)}`.includes(needle)

      return matchesStatus && matchesSearch
    })
  }, [evaluatedStudentRows, studentSearch, studentStatusFilter])
  const sortedStudentRows = useMemo(() => {
    const getSortValue = (row) => {
      if (studentSortKey === 'studentName') return getStudentName(row)
      if (studentSortKey === 'registerId') return getStudentId(row)
      if (studentSortKey === 'attempts') return getStudentAttempt(row)
      if (['checklist', 'form', 'question', 'scaffolding'].includes(studentSortKey)) return getSectionMarks(row, studentSortKey)
      if (studentSortKey === 'critical') return getCriticalMarks(row)
      if (studentSortKey === 'threshold') return getThresholdLabel(row)
      if (studentSortKey === 'score') return getStudentObtainedMarks(row)
      if (studentSortKey === 'totalPercentage') return getStudentPercentage(row)
      if (studentSortKey === 'result') return getStudentResult(row)

      return ''
    }

    return [...filteredStudentRows].sort((left, right) => {
      const leftValue = getSortValue(left)
      const rightValue = getSortValue(right)

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return studentSortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue
      }

      return studentSortDirection === 'asc'
        ? String(leftValue).localeCompare(String(rightValue))
        : String(rightValue).localeCompare(String(leftValue))
    })
  }, [filteredStudentRows, studentSortDirection, studentSortKey])
  const studentTotalPages = Math.max(1, Math.ceil(sortedStudentRows.length / studentPageSize))
  const paginatedStudentRows = useMemo(() => {
    const startIndex = (studentPage - 1) * studentPageSize
    return sortedStudentRows.slice(startIndex, startIndex + studentPageSize)
  }, [sortedStudentRows, studentPage])
  const studentFilterOptions = useMemo(() => ([
    { id: 'all', label: 'All', count: evaluatedStudentRows.length },
    { id: 'completed', label: 'Completed', count: evaluatedStudentRows.filter((row) => String(getStudentResult(row)).trim().toLowerCase() === 'completed').length },
    { id: 'repeat', label: 'Repeat', count: evaluatedStudentRows.filter((row) => String(getStudentResult(row)).trim().toLowerCase() === 'repeat').length },
    { id: 'remedial', label: 'Remedial', count: evaluatedStudentRows.filter((row) => String(getStudentResult(row)).trim().toLowerCase() === 'remedial').length },
  ]), [evaluatedStudentRows])
  const visibleQuestionColumns = useMemo(() => (
    (() => {
      const completedRowsForActivity = approvalRecord
        ? completedEvaluationRows.filter((row) => row.activityId === approvalRecord.activityId)
        : []
      const rowsForSectionDetection = [...approvalStudentRows, ...completedRowsForActivity]

      return Array.isArray(approvalRecord?.activitySections) && approvalRecord.activitySections.length
        ? approvalRecord.activitySections
        .map((section) => ({
          key: normalizeSectionKey(section),
          label: getSectionLabel(section),
        }))
        .filter((section) => questionColumnOptions.some((column) => column.key === section.key))
        : questionColumnOptions.filter((column) => rowsForSectionDetection.some((row) => (
          (row[column.key]?.itemCount ?? 0) > 0
          || getSectionMarks(row, column.key) > 0
        )))
    })()
  ), [approvalRecord, approvalStudentRows, completedEvaluationRows])
  const tableSummaryCounts = useMemo(() => ({
    students: evaluatedStudentRows.length,
    evaluated: evaluatedStudentRows.length,
    completed: evaluatedStudentRows.filter((row) => String(getStudentResult(row)).trim().toLowerCase() === 'completed').length,
    repeat: evaluatedStudentRows.filter((row) => String(getStudentResult(row)).trim().toLowerCase() === 'repeat').length,
    remedial: evaluatedStudentRows.filter((row) => String(getStudentResult(row)).trim().toLowerCase() === 'remedial').length,
  }), [evaluatedStudentRows])
  const performanceItems = useMemo(() => (
    selectedPerformanceRow ? buildPerformanceItems(approvalRecord, selectedPerformanceRow) : []
  ), [approvalRecord, selectedPerformanceRow])
  const performanceSections = useMemo(() => {
    const groups = new Map()

    performanceItems.forEach((item) => {
      const key = item.sectionLabel
      const current = groups.get(key) ?? []
      current.push(item)
      groups.set(key, current)
    })

    return [...groups.entries()]
  }, [performanceItems])

  useEffect(() => {
    setStudentPage(1)
  }, [studentSearch, studentSortDirection, studentSortKey, studentStatusFilter])

  if (!approvalRecord) {
    return (
      <section className="vx-content approval-view-page">
        <div className="approval-view-empty">
          <BadgeCheck size={28} strokeWidth={2} />
          <strong>No approval record selected</strong>
          <p>Open a record from the approval queue to view its details.</p>
          <button type="button" className="tool-btn green" onClick={onBack}>
            Back to Approval Queue
          </button>
        </div>
      </section>
    )
  }

  const activityType = approvalRecord.activityType ?? 'Activity'
  const status = getDisplayApprovalStatus(
    approvalRecord.status ?? approvalRecord.approvalStatus ?? approvalRecord.reviewStatus ?? 'Pending Approval',
  )
  const receivedAt = formatDateTime(approvalRecord.receivedAt ?? approvalRecord.sentAt ?? approvalRecord.submittedAt)
  const senderName = approvalRecord.senderName ?? 'Sender name not set'
  const senderId = approvalRecord.senderId ?? 'Sender ID not set'
  const senderDesignation = approvalRecord.senderDesignation ?? ''
  const attemptCount = approvalRecord.attemptCount ?? approvalRecord.attempts ?? approvalRecord.attemptNumber ?? 1
  const showDecisionPanel = String(status).trim().toLowerCase() !== 'published'

  const handleApprovalAction = (action) => {
    const nextStatus = action === 'approve' ? 'Approved' : 'Approval Rejected'
    const reviewPayload = {
      ...approvalRecord,
      status: nextStatus,
      approvalStatus: nextStatus,
      reviewStatus: nextStatus,
      reviewRemarks: reviewRemarks.trim(),
      reviewedAt: new Date().toISOString(),
    }

    if (onApprovalAction) {
      onApprovalAction(reviewPayload)
      return
    }

    onAlert?.({
      tone: action === 'approve' ? 'secondary' : 'warning',
      message: `${approvalRecord.activityName ?? 'Activity'} ${action === 'approve' ? 'approved' : 'rejected'}${reviewRemarks.trim() ? ' with remarks' : ''}.`,
    })
  }

  const handleStudentSort = (key) => {
    if (studentSortKey === key) {
      setStudentSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setStudentSortKey(key)
    setStudentSortDirection('asc')
  }

  const handleDownloadStudents = () => {
    if (!sortedStudentRows.length) return

    downloadCsv({
      fileName: `${approvalRecord.activityName ?? 'approval-student-list'} student list`,
      headers: ['Student', 'ID', 'Attempts', ...visibleQuestionColumns.map((column) => column.label), 'Critical', 'Threshold', 'Score', 'Total %', 'Result'],
      rows: sortedStudentRows.map((row) => {
        const totalMarks = getStudentTotalMarks(row)
        const obtainedMarks = getStudentObtainedMarks(row)

        return [
          getStudentName(row),
          getStudentId(row),
          String(getStudentAttempt(row)),
          ...visibleQuestionColumns.map((column) => formatMarks(getSectionMarks(row, column.key))),
          formatMarks(getCriticalMarks(row)),
          getThresholdLabel(row),
          `${formatMarks(obtainedMarks)} / ${formatMarks(totalMarks)}`,
          formatPercent(getStudentPercentage(row)),
          getStudentResult(row),
        ]
      }),
    })
  }

  const handleViewStudent = (row) => {
    const matchedCompletedRow = completedEvaluationRows.find((item) => (
      String(item.activityId ?? '') === String(approvalRecord?.activityId ?? '')
      && String(item.studentId ?? item.registerId ?? '') === String(row.studentId ?? row.registerId ?? '')
      && (Number(item.attemptNumber) || 1) === (Number(row.attemptCount ?? row.attemptNumber) || 1)
    )) ?? completedEvaluationRows.find((item) => (
      String(item.activityId ?? '') === String(approvalRecord?.activityId ?? '')
      && String(item.studentId ?? item.registerId ?? '') === String(row.studentId ?? row.registerId ?? '')
    )) ?? null

    setSelectedPerformanceRow(matchedCompletedRow ? { ...row, ...matchedCompletedRow } : row)
  }

  const studentTableHeaders = [
    { key: 'studentName', label: 'Student' },
    { key: 'registerId', label: 'ID' },
    { key: 'attempts', label: 'Attempts' },
    ...visibleQuestionColumns,
    { key: 'critical', label: 'Critical' },
    { key: 'threshold', label: 'Threshold' },
    { key: 'score', label: 'Score' },
    { key: 'totalPercentage', label: 'Total %' },
    { key: 'result', label: 'Result' },
    { key: 'actions', label: 'Actions', sortable: false },
  ]

  return (
    <section className="vx-content approval-view-page">
      <div className="approval-view-shell">
        <header className="approval-view-header">
          <button type="button" className="approval-view-back" onClick={onBack} aria-label="Back to approval queue">
            <ChevronLeft size={19} strokeWidth={2.2} />
          </button>
          <div className="approval-view-title">
            <h1>{approvalRecord.activityName ?? 'Untitled Activity'}</h1>
            <div className="approval-view-meta-row">
              <span className={`approval-view-activity-pill ${getActivityToneClass(activityType)}`}>{activityType}</span>
              <span className="approval-view-status-pill">{status}</span>
              {attemptCount ? <span className="approval-view-attempt-pill">Attempt {attemptCount}</span> : null}
              <span className="approval-view-header-time">
                <CalendarClock size={14} strokeWidth={2.1} />
                {receivedAt}
              </span>
            </div>
          </div>
          <div className="approval-view-info-actions">
            <InfoTooltipButton
              id="sender"
              icon={Info}
              label="View created by details"
              title="Created By"
              activeTooltipId={activeTooltipId}
              onToggle={setActiveTooltipId}
              items={[
                { label: 'Name', value: senderName },
                { label: 'ID', value: senderId },
                { label: 'Designation', value: senderDesignation },
                { label: 'Sent date and time', value: receivedAt },
              ]}
            />
          </div>
        </header>

        <div className="approval-view-grid">
          <section className="approval-view-panel approval-view-summary-panel">
            <div className="approval-view-stats">
              <StatCard icon={Users} label="Students" value={tableSummaryCounts.students} />
              <StatCard icon={CheckCircle2} label="Evaluated" value={tableSummaryCounts.evaluated} tone="is-evaluated" />
              <StatCard icon={BadgeCheck} label="Completed" value={tableSummaryCounts.completed} tone="is-completed" />
              <StatCard icon={RotateCcw} label="Repeat" value={tableSummaryCounts.repeat} tone="is-repeat" />
              <StatCard icon={BriefcaseBusiness} label="Remedial" value={tableSummaryCounts.remedial} tone="is-remedial" />
            </div>
          </section>

          {showDecisionPanel ? (
            <section className="approval-view-panel approval-view-decision-panel">
              <div className="approval-view-decision-column">
                <span className="approval-view-decision-label">Approval note</span>
                <p className="approval-view-note-text">{approvalRecord.note || 'No approval note added.'}</p>
              </div>

              <div className="approval-view-decision-divider" aria-hidden="true" />

              <div className="approval-view-decision-column">
                <span className="approval-view-decision-label">Approval review</span>
                <label className="approval-view-remarks-field">
                  <textarea
                    value={reviewRemarks}
                    onChange={(event) => setReviewRemarks(event.target.value)}
                    placeholder="Add review remarks"
                    rows={4}
                  />
                </label>
                <div className="approval-view-review-actions">
                  <button type="button" className="ghost approval-view-return-btn" onClick={() => handleApprovalAction('reject')}>
                    <RotateCcw size={16} strokeWidth={2.1} />
                    Reject
                  </button>
                  <button type="button" className="tool-btn green approval-view-approve-btn" onClick={() => handleApprovalAction('approve')}>
                    <BadgeCheck size={16} strokeWidth={2.1} />
                    Approve
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          <section className="approval-view-panel approval-view-student-panel">
            <div className="approval-view-student-toolbar">
              <label className="approval-view-student-search">
                <Search size={14} strokeWidth={2} />
                <input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Search student, ID, result, or attempts"
                />
              </label>
              <button
                type="button"
                className="approval-view-download-btn"
                onClick={handleDownloadStudents}
                disabled={!sortedStudentRows.length}
              >
                <Download size={14} strokeWidth={2} />
                Download Excel
              </button>
              <div className="approval-view-filterbar" aria-label="Filter approval students">
                {studentFilterOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`approval-view-filter ${studentStatusFilter === option.id ? 'is-active' : ''}`}
                    onClick={() => setStudentStatusFilter(option.id)}
                  >
                    <span>{option.label}</span>
                    <small>{option.count}</small>
                  </button>
                ))}
              </div>
            </div>
            {approvalStudentRows.length ? (
              <>
                <div className="approval-view-table-wrap">
                  <table
                    className="approval-view-student-table"
                    style={{ '--question-column-count': visibleQuestionColumns.length }}
                  >
                    <thead>
                      <tr>
                        {studentTableHeaders.map((header) => (
                          <th key={header.key}>
                            {header.sortable === false ? header.label : (
                              <button
                                type="button"
                                className={`approval-view-sort-btn ${studentSortKey === header.key ? 'is-active' : ''}`}
                                onClick={() => handleStudentSort(header.key)}
                              >
                                <span>{header.label}</span>
                                <ArrowUpDown size={12} strokeWidth={2} />
                              </button>
                            )}
                          </th>
                        ))}
                      </tr>
                  </thead>
                  <tbody>
                    {paginatedStudentRows.map((row) => {
                      const studentName = getStudentName(row)
                      const totalMarks = getStudentTotalMarks(row)
                      const obtainedMarks = getStudentObtainedMarks(row)
                      const resultStatus = getStudentResult(row)

                      return (
                        <tr key={row.id ?? row.studentId ?? row.registerId}>
                          <td>
                            <div className="approval-view-student-cell">
                              <strong>{studentName}</strong>
                            </div>
                          </td>
                          <td>{getStudentId(row)}</td>
                          <td><span className="approval-view-table-pill is-neutral">{getStudentAttempt(row)}</span></td>
                          {visibleQuestionColumns.map((column) => (
                            <td key={`${row.id ?? row.studentId ?? row.registerId}-${column.key}`}>
                              {formatMarks(getSectionMarks(row, column.key))}
                            </td>
                          ))}
                          <td>{formatMarks(getCriticalMarks(row))}</td>
                          <td>
                            <span className={`approval-view-table-pill ${getThresholdTone(getThresholdLabel(row))}`}>
                              {getThresholdLabel(row)}
                            </span>
                          </td>
                          <td className="is-strong">{formatMarks(obtainedMarks)} / {formatMarks(totalMarks)}</td>
                          <td className="is-strong">{formatPercent(getStudentPercentage(row))}</td>
                          <td>
                            <span className={`approval-view-table-pill ${getResultTone(resultStatus)}`}>{resultStatus}</span>
                          </td>
                          <td>
                            <button type="button" className="ghost approval-view-row-btn" onClick={() => handleViewStudent(row)}>
                              <Eye size={14} strokeWidth={2} />
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                </div>
                <div className="approval-view-table-footer">
                  <span>
                    Showing {paginatedStudentRows.length ? (studentPage - 1) * studentPageSize + 1 : 0}
                    {' '}to{' '}
                    {(studentPage - 1) * studentPageSize + paginatedStudentRows.length}
                    {' '}of {sortedStudentRows.length}
                  </span>
                  <div className="approval-view-pagination">
                    <button
                      type="button"
                      className="approval-view-page-btn"
                      onClick={() => setStudentPage((page) => Math.max(1, page - 1))}
                      disabled={studentPage <= 1}
                    >
                      <ChevronLeft size={14} strokeWidth={2} />
                      Previous
                    </button>
                    {Array.from({ length: studentTotalPages }, (_, index) => index + 1).slice(0, 5).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`approval-view-page-btn ${studentPage === pageNumber ? 'is-active' : ''}`}
                        onClick={() => setStudentPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="approval-view-page-btn"
                      onClick={() => setStudentPage((page) => Math.min(studentTotalPages, page + 1))}
                      disabled={studentPage >= studentTotalPages}
                    >
                      Next
                      <ChevronRight size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="approval-view-student-empty">No active student records found.</div>
            )}
          </section>
        </div>
      </div>
      {selectedPerformanceRow ? (
        <>
          <button
            type="button"
            className="approval-view-drawer-overlay"
            aria-label="Close student performance panel"
            onClick={() => setSelectedPerformanceRow(null)}
          />
          <aside className="approval-view-drawer" aria-label="Student performance details">
            <div className="approval-view-drawer-head">
              <div className="approval-view-drawer-identity">
                <small>Student Performance</small>
                <h3>{getStudentName(selectedPerformanceRow) || 'Student'}</h3>
                <div className="approval-view-drawer-inline-meta">
                  <span>{getStudentId(selectedPerformanceRow) || 'Not set'}</span>
                  <span>Attempt {getStudentAttempt(selectedPerformanceRow)}</span>
                  <span>{approvalRecord.activityType ?? 'Activity'}</span>
                </div>
              </div>
              <button
                type="button"
                className="approval-view-drawer-close"
                onClick={() => setSelectedPerformanceRow(null)}
                aria-label="Close student performance"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            <div className="approval-view-drawer-statusbar">
              <span>{getStudentResult(selectedPerformanceRow)}</span>
              <span>{formatMarks(getStudentObtainedMarks(selectedPerformanceRow))} / {formatMarks(getStudentTotalMarks(selectedPerformanceRow))}</span>
              <span>{formatPercent(getStudentPercentage(selectedPerformanceRow))}</span>
              <span>{getThresholdLabel(selectedPerformanceRow)}</span>
            </div>

            <div className="approval-view-drawer-body">
              {performanceSections.length ? (
                performanceSections.map(([sectionLabel, items]) => (
                  <section key={sectionLabel} className="approval-view-drawer-section">
                    <div className="approval-view-drawer-section-head">
                      <h4>{sectionLabel.charAt(0).toUpperCase() + sectionLabel.slice(1)}</h4>
                      <span>{items.length} items</span>
                    </div>

                    <div className="approval-view-drawer-list">
                      {items.map((item) => (
                        <article key={item.id} className={`approval-view-drawer-item ${item.isCritical ? 'is-critical' : ''}`}>
                          <div className="approval-view-drawer-item-head">
                            <div>
                              <small className="approval-view-drawer-item-kicker">{item.sectionLabel ?? 'Question'}</small>
                              <strong>{item.label}</strong>
                              <p>{item.prompt}</p>
                            </div>
                            <span className="approval-view-drawer-score">{formatMarks(item.obtainedMarks)} / {formatMarks(item.marks)}</span>
                          </div>

                          <div className="approval-view-drawer-answer">
                            <span>Answer</span>
                            <p>{item.answer}</p>
                          </div>

                          <div className="approval-view-drawer-tags">
                            <span className="approval-view-table-pill is-neutral">{item.decision}</span>
                            {item.isCritical ? <span className="approval-view-table-pill is-remedial">Critical</span> : null}
                            {item.tags.map((tag) => (
                              <span key={`${item.id}-${tag}`} className="approval-view-table-pill is-neutral">{tag}</span>
                            ))}
                            {item.domains.map((domain) => (
                              <span key={`${item.id}-${domain.label}`} className="approval-view-table-pill is-neutral">{domain.label}</span>
                            ))}
                          </div>

                          {item.remarks ? (
                            <div className="approval-view-drawer-answer is-remark">
                              <span>Faculty Remark</span>
                              <p>{item.remarks}</p>
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="approval-view-drawer-empty">No detailed performance data found for this student.</div>
              )}
            </div>
          </aside>
        </>
      ) : null}
    </section>
  )
}
