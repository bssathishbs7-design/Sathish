import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Info,
  Search,
  Share2,
  Trophy,
  X,
} from 'lucide-react'
import { APP_PAGES } from '../config/appPages'
import { corelationRatingRows } from './corelationRatingData'
import '../styles/assessment-pages.css'
import './ShareStuFacultyPage.css'

const LEARN_PRACTICE_SHARED_CARDS_KEY = 'vx-learn-practice-shared-cards'
const PAGE_SIZE = 8

const readSharedCards = () => {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LEARN_PRACTICE_SHARED_CARDS_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const normalizeCode = (value) => String(value ?? '').replace(/\s+/g, '').toUpperCase()
const getCompetencyRow = (code) => corelationRatingRows.find((row) => normalizeCode(row.code) === normalizeCode(code))
const getCardQuestions = (card) => (
  Array.isArray(card?.practiceSessions) && card.practiceSessions.length
    ? card.practiceSessions.flatMap((session) => (Array.isArray(session?.questions) ? session.questions : []))
    : Array.isArray(card?.questions) ? card.questions : []
)
const getQuestionType = (question = {}) => {
  const type = String(question.type ?? question.questionType ?? '').toLowerCase()
  if (type.includes('mcq') || type.includes('multiple') || question.options?.length) return 'mcq'
  if (type.includes('laq') || type.includes('long')) return 'laqs'
  if (type.includes('saq') || type.includes('short')) return 'saqs'
  return ''
}

const formatDateTime = (rawDate) => {
  if (!rawDate) return '-'

  const date = new Date(rawDate)
  if (Number.isNaN(date.getTime())) return String(rawDate)

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

const getQuestionMarks = (question = {}) => {
  const rawMarks = question.marks ?? question.mark ?? question.totalMarks
  const marks = Number(rawMarks)
  return Number.isFinite(marks) ? marks : 0
}

const toCount = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return 0
}

const hasExplicitTypeCounts = (source = {}) => [
  source.mcq,
  source.mcqCount,
  source.typeCounts?.mcq,
  source.questionTypeCounts?.mcq,
  source.saqs,
  source.saq,
  source.saqsCount,
  source.saqCount,
  source.typeCounts?.saqs,
  source.typeCounts?.saq,
  source.questionTypeCounts?.saqs,
  source.questionTypeCounts?.saq,
  source.laqs,
  source.laq,
  source.laqsCount,
  source.laqCount,
  source.typeCounts?.laqs,
  source.typeCounts?.laq,
  source.questionTypeCounts?.laqs,
  source.questionTypeCounts?.laq,
].some((value) => value !== undefined && value !== null && value !== '')

const getExplicitTypeCounts = (source = {}) => ({
  mcq: toCount(source.mcq, source.mcqCount, source.typeCounts?.mcq, source.questionTypeCounts?.mcq),
  saqs: toCount(
    source.saqs,
    source.saq,
    source.saqsCount,
    source.saqCount,
    source.typeCounts?.saqs,
    source.typeCounts?.saq,
    source.questionTypeCounts?.saqs,
    source.questionTypeCounts?.saq,
  ),
  laqs: toCount(
    source.laqs,
    source.laq,
    source.laqsCount,
    source.laqCount,
    source.typeCounts?.laqs,
    source.typeCounts?.laq,
    source.questionTypeCounts?.laqs,
    source.questionTypeCounts?.laq,
  ),
  totalMarks: toCount(source.totalMarks, source.marks),
})

const countQuestionTypes = (questions = [], fallback = {}) => {
  if (hasExplicitTypeCounts(fallback)) {
    const explicitCounts = getExplicitTypeCounts(fallback)
    const derivedMarks = questions.reduce((total, question) => total + getQuestionMarks(question), 0)

    return {
      ...explicitCounts,
      totalMarks: explicitCounts.totalMarks || derivedMarks,
    }
  }

  const counts = questions.reduce((nextCounts, question) => {
    const type = getQuestionType(question)
    if (type) nextCounts[type] += 1
    nextCounts.totalMarks += getQuestionMarks(question)
    return nextCounts
  }, { mcq: 0, saqs: 0, laqs: 0, totalMarks: 0 })

  return {
    mcq: counts.mcq,
    saqs: counts.saqs,
    laqs: counts.laqs,
    totalMarks: counts.totalMarks || toCount(fallback.totalMarks, fallback.marks),
  }
}

const getLatestDateValue = (...values) => values
  .flat()
  .filter(Boolean)
  .sort((first, second) => new Date(second).getTime() - new Date(first).getTime())[0]

const getSessionStatus = (session = {}) => {
  const rawStatus = String(session.status ?? session.practiceStatus ?? 'In Progress').toLowerCase()
  if (rawStatus.includes('expire')) return 'Expired'
  if (rawStatus.includes('complete') || rawStatus.includes('submit')) return 'Complete'
  return 'In Progress'
}

const getStatusClassName = (status = '') => {
  const normalized = String(status).toLowerCase()
  if (normalized.includes('expire')) return 'is-expired'
  if (normalized.includes('complete')) return 'is-complete'
  return 'is-progress'
}

const parseScheduledDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return null

  const date = new Date(`${dateValue}T${timeValue}`)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatCountdown = (targetDate, now = new Date()) => {
  if (!targetDate) return null

  const diffMs = targetDate.getTime() - now.getTime()
  if (diffMs <= 0) return '00:00:00'

  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const getScheduleLabel = (session = {}, now = new Date()) => {
  const schedule = session.schedule ?? {}
  const assignment = session.assignment ?? {}
  if (typeof session.timeRemaining === 'string') return session.timeRemaining
  if (typeof session.remainingTime === 'string') return session.remainingTime

  const isScheduled = Boolean(
    assignment.scheduleEnabled
    || session.isScheduled
    || session.scheduled
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

  if (typeof session.scheduleLabel === 'string') return session.scheduleLabel
  if (typeof session.scheduleType === 'string') return session.scheduleType
  if (typeof schedule.label === 'string') return schedule.label
  if (isScheduled) return 'Scheduled'
  return 'Normal'
}

const isCountdownLabel = (value = '') => /^\d{2}:\d{2}:\d{2}$/.test(String(value).trim())

const getScheduleClassName = (schedule = '', status = '') => {
  const value = String(schedule).trim().toLowerCase()
  const statusValue = String(status).trim().toLowerCase()
  if (value === '00:00:00' || statusValue.includes('expire')) return 'is-expired'
  if (isCountdownLabel(value)) return 'is-live'
  if (value === 'normal') return 'is-normal'
  return 'is-scheduled'
}

const getSharedDate = (card = {}) => {
  const sessionDates = Array.isArray(card.practiceSessions)
    ? card.practiceSessions.map((session) => session?.sharedAt ?? session?.createdAt).filter(Boolean)
    : []
  return formatDateTime(getLatestDateValue(card.lastSharedAt, card.sharedAt, card.updatedAt, card.createdAt, sessionDates))
}

const getPracticeRows = (card = {}, cardQuestions = [], now = new Date()) => {
  const sessions = Array.isArray(card.practiceSessions) && card.practiceSessions.length
    ? card.practiceSessions
    : [{
      id: `${card.id ?? card.competencyCode ?? 'practice'}-1`,
      practiceNo: 1,
      sharedAt: card.lastSharedAt ?? card.sharedAt ?? card.updatedAt ?? card.createdAt,
      assignment: card.assignment,
      status: card.status,
      questions: cardQuestions,
      mcq: card.mcq,
      saqs: card.saqs,
      laqs: card.laqs,
      totalMarks: card.totalMarks,
    }]

  return sessions.map((session, index) => {
    const questions = Array.isArray(session.questions) ? session.questions : cardQuestions
    const counts = countQuestionTypes(questions, session)
    const total = counts.mcq + counts.saqs + counts.laqs

    return {
      id: session.id ?? `${card.id ?? card.competencyCode ?? 'practice'}-${index + 1}`,
      practiceNo: Number(session.practiceNo || session.attemptNo || index + 1),
      sharedAt: formatDateTime(session.sharedAt ?? session.createdAt ?? card.lastSharedAt ?? card.sharedAt ?? card.createdAt),
      schedule: getScheduleLabel(session, now),
      status: getSessionStatus(session),
      mcq: counts.mcq,
      saqs: counts.saqs,
      laqs: counts.laqs,
      total,
      totalMarks: counts.totalMarks || Number(card.totalMarks || card.marks || total),
    }
  }).filter((practice) => practice.total > 0)
}

const reportStudents = [
  ['Aarav Kumar', 'MC2501'],
  ['Diya Raman', 'MC2502'],
  ['Ishaan Patel', 'MC2503'],
  ['Meera Nair', 'MC2504'],
  ['Nikhil Joseph', 'MC2505'],
]

const buildStudentReportRows = (practice = {}) => reportStudents.map(([name, rollNo], index) => {
  const totalMarks = Number(practice.totalMarks || practice.total || 0)
  const status = index === 4 && practice.status === 'In Progress' ? 'In progress' : 'Submitted'
  const mcqScore = practice.mcq ? Math.max(0, practice.mcq - (index % 2)) : '-'
  const saqsScore = practice.saqs ? Math.max(0, practice.saqs - (index === 2 ? 1 : 0)) : '-'
  const laqsScore = practice.laqs ? Math.max(0, practice.laqs - (index === 3 ? 1 : 0)) : '-'
  const obtainedMarks = status === 'Submitted'
    ? Math.max(0, totalMarks - (index % 3))
    : '-'

  return {
    name,
    rollNo,
    status,
    mcqScore,
    saqsScore,
    laqsScore,
    obtainedMarks,
    totalMarks,
    submittedAt: status === 'Submitted' ? practice.sharedAt : '-',
  }
})

function ShareStuFacultyPage({ onNavigate }) {
  const [sharedCards, setSharedCards] = useState(() => readSharedCards())
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState(() => new Set())
  const [activeReport, setActiveReport] = useState(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const syncSharedCards = () => setSharedCards(readSharedCards())

    window.addEventListener('storage', syncSharedCards)
    window.addEventListener('learn-practice-shared-cards', syncSharedCards)

    return () => {
      window.removeEventListener('storage', syncSharedCards)
      window.removeEventListener('learn-practice-shared-cards', syncSharedCards)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timerId)
  }, [])

  const rows = useMemo(() => sharedCards.map((card) => {
    const questions = getCardQuestions(card)
    const counts = countQuestionTypes(questions, card)
    const code = card.competencyCode || questions.find((question) => question?.competencyCode)?.competencyCode || '-'
    const competencyRow = getCompetencyRow(code)
    const competency = card.competencyName || competencyRow?.competency || `Competency ${code}`
    const subject = card.subject || questions.find((question) => question?.subject)?.subject || competencyRow?.subject || 'Human Anatomy'
    const practices = getPracticeRows(card, questions, now)
    const totals = practices.reduce((nextTotals, practice) => ({
      mcq: nextTotals.mcq + practice.mcq,
      saqs: nextTotals.saqs + practice.saqs,
      laqs: nextTotals.laqs + practice.laqs,
      total: nextTotals.total + practice.total,
      livePractice: nextTotals.livePractice + (practice.status === 'In Progress' ? 1 : 0),
    }), { mcq: 0, saqs: 0, laqs: 0, total: 0, livePractice: 0 })

    return {
      id: card.id ?? code,
      code,
      competency,
      subject,
      assignedTo: card.assignment?.year || card.year || 'First Year',
      sharedAt: getSharedDate(card),
      practiceCount: practices.length,
      livePractice: totals.livePractice,
      total: totals.total || counts.mcq + counts.saqs + counts.laqs,
      mcq: totals.mcq || counts.mcq,
      saqs: totals.saqs || counts.saqs,
      laqs: totals.laqs || counts.laqs,
      practices,
    }
  }), [sharedCards, now])

  const filteredRows = useMemo(() => {
    const searchText = query.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch = !searchText || (
        row.code.toLowerCase().includes(searchText)
        || row.competency.toLowerCase().includes(searchText)
        || row.subject.toLowerCase().includes(searchText)
        || row.assignedTo.toLowerCase().includes(searchText)
      )
      const matchesFilter = (
        activeFilter === 'all'
        || (activeFilter === 'live' && row.livePractice > 0)
        || (activeFilter === 'completed' && row.practices.some((practice) => practice.status === 'Complete'))
        || (activeFilter === 'scheduled' && row.practices.some((practice) => getScheduleClassName(practice.schedule, practice.status) === 'is-scheduled'))
      )

      return matchesSearch && matchesFilter
    })
  }, [activeFilter, query, rows])

  const filterOptions = useMemo(() => [
    { key: 'all', label: 'All', count: rows.length },
    { key: 'live', label: 'Live', count: rows.filter((row) => row.livePractice > 0).length },
    { key: 'completed', label: 'Completed', count: rows.filter((row) => row.practices.some((practice) => practice.status === 'Complete')).length },
    { key: 'scheduled', label: 'Scheduled', count: rows.filter((row) => row.practices.some((practice) => getScheduleClassName(practice.schedule, practice.status) === 'is-scheduled')).length },
  ], [rows])

  const dashboardMetrics = useMemo(() => {
    const totals = filteredRows.reduce((nextTotals, row) => ({
      competencies: nextTotals.competencies + 1,
      practices: nextTotals.practices + row.practiceCount,
      questions: nextTotals.questions + row.total,
      live: nextTotals.live + row.livePractice,
    }), { competencies: 0, practices: 0, questions: 0, live: 0 })

    return [
      { label: 'Competency sets', value: totals.competencies, tone: 'mint', Icon: Share2 },
      { label: 'Practice sessions', value: totals.practices, tone: 'forest', Icon: FileText },
      { label: 'Shared questions', value: totals.questions, tone: 'sky', Icon: BarChart3 },
      { label: 'Live practice', value: totals.live, tone: 'amber', Icon: Trophy },
    ]
  }, [filteredRows])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const visibleRows = filteredRows.slice((Math.min(page, pageCount) - 1) * PAGE_SIZE, Math.min(page, pageCount) * PAGE_SIZE)
  const rowIdSignature = rows.map((row) => row.id).join('|')

  useEffect(() => {
    setExpandedRows((currentRows) => {
      const rowIds = rowIdSignature ? rowIdSignature.split('|') : []
      const availableRowIds = new Set(rowIds)
      return new Set([...currentRows].filter((rowId) => availableRowIds.has(rowId)))
    })
  }, [rowIdSignature])

  useEffect(() => {
    setPage(1)
  }, [activeFilter, query])

  useEffect(() => {
    if (!activeReport) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setActiveReport(null)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeReport])

  const toggleRow = (rowId) => {
    setExpandedRows((currentRows) => {
      const nextRows = new Set(currentRows)
      if (nextRows.has(rowId)) {
        nextRows.delete(rowId)
      } else {
        nextRows.add(rowId)
      }
      return nextRows
    })
  }

  return (
    <section className="vx-content assessment-page share-stu-faculty-page">
      <div className="assessment-page-shell share-stu-faculty-shell">
        <section className="question-bank-list-page-head" aria-label="Share to students breadcrumb">
          <span className="question-bank-list-breadcrumb">
            <button type="button" aria-label="Previous page" onClick={() => onNavigate?.(APP_PAGES.QUESTION_BANK_NON_CREATE)}>
              <ChevronLeft size={17} strokeWidth={2.3} />
            </button>
            <button type="button" aria-label="Next page">
              <ChevronRight size={17} strokeWidth={2.3} />
            </button>
            <span aria-hidden="true" />
            <em>My Pages</em>
            <ChevronRight size={14} strokeWidth={2.4} />
            <em>Assessment Suite</em>
            <ChevronRight size={14} strokeWidth={2.4} />
            <strong>Share to Students</strong>
          </span>
        </section>

        <section className="share-stu-faculty-card" aria-label="Shared question list">
          <div className="share-stu-faculty-metric-strip" aria-label="Share to students summary">
            {dashboardMetrics.map((metric) => (
              <span className={`share-stu-faculty-metric-card is-${metric.tone}`} key={metric.label}>
                <span aria-hidden="true">
                  <metric.Icon size={16} strokeWidth={2.3} />
                </span>
                <b>{metric.value}</b>
                <small>{metric.label}</small>
              </span>
            ))}
          </div>

          <div className="share-stu-faculty-toolbar">
            <div className="share-stu-faculty-toolbar-actions">
              <div className="share-stu-faculty-filter-tabs" role="group" aria-label="Filter shared questions">
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={activeFilter === option.key ? 'is-active' : ''}
                    onClick={() => setActiveFilter(option.key)}
                    aria-pressed={activeFilter === option.key}
                  >
                    {option.label}
                    <span>{option.count}</span>
                  </button>
                ))}
              </div>
              <label>
                <Search size={15} strokeWidth={2.3} aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  placeholder="Search shared questions..."
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query ? (
                  <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>
                    <X size={14} strokeWidth={2.4} />
                  </button>
                ) : null}
              </label>
            </div>
          </div>

          {visibleRows.length ? (
            <>
              <div className="share-stu-faculty-list-head" aria-hidden="true">
                <span>Competency</span>
                <span>Code</span>
                <span>Summary</span>
                <span>Action</span>
              </div>
              <div className="share-stu-faculty-groups">
                {visibleRows.map((row) => {
                  const isExpanded = expandedRows.has(row.id)

                  return (
                    <article className="share-stu-faculty-group" key={row.id}>
                      <div
                        className="share-stu-faculty-group-head"
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onClick={() => toggleRow(row.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            toggleRow(row.id)
                          }
                        }}
                      >
                        <span className="share-stu-faculty-group-main">
                          <span className="share-stu-faculty-expand-btn" aria-hidden="true">
                            <ChevronDown size={16} strokeWidth={2.5} />
                          </span>
                          <span>
                            <strong>{row.subject}</strong>
                            <em>{row.assignedTo}</em>
                          </span>
                        </span>
                        <span className="share-stu-faculty-code" data-tooltip={row.competency} tabIndex={0}>
                          {row.code}
                          <Info size={12} strokeWidth={2.4} aria-hidden="true" />
                        </span>
                        <span className="share-stu-faculty-parent-metrics" aria-label="Shared summary">
                          <span><b>{row.practiceCount}</b><small>Practices</small></span>
                          <span><b>{row.total}</b><small>Questions</small></span>
                          <span><b>{row.livePractice}</b><small>Live</small></span>
                        </span>
                        <button
                          type="button"
                          className="share-stu-faculty-analytics-btn"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <BarChart3 size={15} strokeWidth={2.4} />
                          View Analytics
                        </button>
                      </div>

                      {isExpanded ? (
                        <div className="share-stu-faculty-practice-panel">
                          <div className="share-stu-faculty-practice-head" aria-hidden="true">
                            <span>Date & Time</span>
                            <span>Practice</span>
                            <span>Schedule</span>
                            <span>Question mix</span>
                            <span>Status</span>
                            <span>Report</span>
                          </div>
                          <div className="share-stu-faculty-practice-list">
                            {row.practices.map((practice) => (
                              <div className="share-stu-faculty-practice-row" key={practice.id}>
                                <span className="share-stu-faculty-date">
                                  <CalendarDays size={14} strokeWidth={2.3} />
                                  {practice.sharedAt}
                                </span>
                                <span className="share-stu-faculty-practice-badge">
                                  <FileText size={14} strokeWidth={2.4} />
                                  # Practice {practice.practiceNo}
                                </span>
                                <span className={`share-stu-faculty-schedule-pill ${getScheduleClassName(practice.schedule, practice.status)}`}>
                                  {practice.schedule}
                                </span>
                                <span className="share-stu-faculty-mix">
                                  <span><b>{practice.mcq || '-'}</b><small>MCQ</small></span>
                                  <span><b>{practice.saqs || '-'}</b><small>SAQs</small></span>
                                  <span><b>{practice.laqs || '-'}</b><small>LAQs</small></span>
                                </span>
                                <span className={`share-stu-faculty-status ${getStatusClassName(practice.status)}`}>
                                  {practice.status}
                                </span>
                                <button
                                  type="button"
                                  className="share-stu-faculty-report-btn"
                                  onClick={() => setActiveReport({ parent: row, practice })}
                                >
                                  <Eye size={14} strokeWidth={2.4} />
                                  View
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  )
                })}
              </div>
              <div className="share-stu-faculty-footer">
                <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                  <ChevronLeft size={15} strokeWidth={2.4} />
                  Previous
                </button>
                <span>Page {Math.min(page, pageCount)} of {pageCount}</span>
                <button type="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
                  Next
                  <ChevronRight size={15} strokeWidth={2.4} />
                </button>
              </div>
            </>
          ) : (
            <div className="share-stu-faculty-empty">
              <Share2 size={20} strokeWidth={2.2} />
              <strong>No shared questions yet</strong>
              <p>Use Share to Students from Question Bank to create shared practice sets.</p>
            </div>
          )}
        </section>
      </div>
      {activeReport ? createPortal(
        <div className="share-stu-faculty-report-overlay" role="presentation" onMouseDown={() => setActiveReport(null)}>
          <section
            className="share-stu-faculty-report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-stu-faculty-report-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="share-stu-faculty-report-head">
              <div>
                <h2 id="share-stu-faculty-report-title">
                  <Trophy size={18} strokeWidth={2.4} />
                  Practice report
                </h2>
                <p>
                  {activeReport.parent.code} - # Practice {activeReport.practice.practiceNo}
                </p>
              </div>
              <button type="button" aria-label="Close report" onClick={() => setActiveReport(null)}>
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>
            <div className="share-stu-faculty-report-table-wrap">
              <table className="share-stu-faculty-report-table">
                <thead>
                  <tr>
                    <th>Student name</th>
                    <th>Roll no / ID</th>
                    <th>Attempt status</th>
                    <th>MCQ score</th>
                    <th>SAQs score</th>
                    <th>LAQs score</th>
                    <th>Obt. marks</th>
                    <th>Total marks</th>
                    <th>Submitted at</th>
                    <th>Report action</th>
                  </tr>
                </thead>
                <tbody>
                  {buildStudentReportRows(activeReport.practice).map((student) => (
                    <tr key={student.rollNo}>
                      <td>{student.name}</td>
                      <td>{student.rollNo}</td>
                      <td>
                        <span className={`share-stu-faculty-attempt-status ${student.status === 'Submitted' ? 'is-submitted' : 'is-pending'}`}>
                          {student.status}
                        </span>
                      </td>
                      <td>{student.mcqScore}</td>
                      <td>{student.saqsScore}</td>
                      <td>{student.laqsScore}</td>
                      <td>{student.obtainedMarks}</td>
                      <td>{student.totalMarks}</td>
                      <td>{student.submittedAt}</td>
                      <td>
                        <button type="button" className="share-stu-faculty-report-link">
                          <Eye size={13} strokeWidth={2.4} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>,
        document.body,
      ) : null}
    </section>
  )
}

export default ShareStuFacultyPage
