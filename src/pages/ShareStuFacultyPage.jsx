import { buildFacultyReportSample as buildStudentReportRows } from '../services/facultyReportSample'
import FloatingTooltip from '../components/FloatingTooltip'
import { getScheduleLabel, getScheduleClassName, isPendingScheduledPractice } from '../services/facultyPracticeSchedule'
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
import './ShareStuFacultyTable.css'
import './ShareStuFacultyReportControls.css'

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
      questions,
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

function ShareStuFacultyPage({ onNavigate, onOpenAnalytics, returnState }) {
  const [sharedCards, setSharedCards] = useState(() => readSharedCards())
  const [query, setQuery] = useState(returnState?.query ?? '')
  const [activeFilter, setActiveFilter] = useState(returnState?.activeFilter ?? 'all')
  const [page, setPage] = useState(returnState?.page ?? 1)
  const [expandedRows, setExpandedRows] = useState(() => new Set(returnState?.expandedRows ?? []))
  const [activeReport, setActiveReport] = useState(null)
  const [reportQuery, setReportQuery] = useState('')
  const [reportPage, setReportPage] = useState(1)
  const reportRows = activeReport ? buildStudentReportRows(activeReport.practice).filter((student) => (
    `${student.name} ${student.rollNo}`.toLowerCase().includes(reportQuery.trim().toLowerCase())
  )) : []
  const reportPageCount = Math.max(1, Math.ceil(reportRows.length / 5))
  const currentReportPage = Math.min(reportPage, reportPageCount)
  const visibleReportRows = reportRows.slice((currentReportPage - 1) * 5, currentReportPage * 5)
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
      sourceCard: card,
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
        || (activeFilter === 'in-progress' && row.practices.some((practice) => practice.status === 'In Progress'))
        || (activeFilter === 'scheduled' && row.practices.some(isPendingScheduledPractice))
      )

      return matchesSearch && matchesFilter
    })
  }, [activeFilter, query, rows])

  const filterOptions = useMemo(() => [
    { key: 'all', label: 'All', count: rows.length },
    { key: 'live', label: 'Live', count: rows.filter((row) => row.livePractice > 0).length },
    { key: 'completed', label: 'Completed', count: rows.filter((row) => row.practices.some((practice) => practice.status === 'Complete')).length },
    { key: 'in-progress', label: 'In Progress', count: rows.filter((row) => row.practices.some((practice) => practice.status === 'In Progress')).length },
    { key: 'scheduled', label: 'Scheduled', count: rows.filter((row) => row.practices.some(isPendingScheduledPractice)).length },
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
                    onClick={() => { setActiveFilter(option.key); setPage(1) }}
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
                  onChange={(event) => { setQuery(event.target.value); setPage(1) }}
                />
                {query ? (
                  <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); setPage(1) }}>
                    <X size={14} strokeWidth={2.4} />
                  </button>
                ) : null}
              </label>
            </div>
          </div>

          {visibleRows.length ? (
            <>
              <div className="share-stu-faculty-table-frame">
              <div className="share-stu-faculty-list-head" aria-hidden="true">
                <span>Subject and Year</span>
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
                        className={`share-stu-faculty-group-head${row.practices.some(isPendingScheduledPractice) ? ' is-scheduled-row' : ''}`}
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
                        <FloatingTooltip className="share-stu-faculty-code" content={row.competency}>
                          {row.code}
                          <Info size={12} strokeWidth={2.4} aria-hidden="true" />
                        </FloatingTooltip>
                        <span className="share-stu-faculty-parent-metrics" aria-label="Shared summary">
                          <span><b>{row.practiceCount}</b><small>Practices</small></span>
                          <span><b>{row.total}</b><small>Questions</small></span>
                          <span>
                            {row.livePractice > 0 ? (
                              <strong className="faculty-live-badge">
                                <i className="faculty-live-dot" aria-hidden="true" />
                                <b>{row.livePractice}</b> Live
                              </strong>
                            ) : <b aria-label="No live practices">-</b>}
                          </span>
                        </span>
                        <button
                          type="button"
                          className="share-stu-faculty-analytics-btn"
                          onClick={(event) => {
                            event.stopPropagation()
                            onOpenAnalytics?.({ card: { ...row.sourceCard, competencyCode: row.code, competencyName: row.competency, subject: row.subject }, returnState: { query, activeFilter, page, expandedRows: [...expandedRows] } })
                          }}
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
                              <div className={`share-stu-faculty-practice-row${isPendingScheduledPractice(practice) ? ' is-scheduled-row' : ''}`} key={practice.id}>
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
                                  onClick={() => {
                                    setReportQuery('')
                                    setReportPage(1)
                                    setActiveReport({ parent: row, practice })
                                  }}
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
                  {activeReport.parent.code} - # Practice {activeReport.practice.practiceNo} ? Sample student results
                </p>
              </div>
              <button type="button" aria-label="Close report" onClick={() => setActiveReport(null)}>
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>
            <div className="faculty-report-toolbar">
              <label className="faculty-report-search">
                <Search size={16} aria-hidden="true" />
                <input type="search" aria-label="Search students by name or ID" placeholder="Search student name or ID..." value={reportQuery} onChange={(event) => {
                  setReportQuery(event.target.value)
                  setReportPage(1)
                }} />
              </label>
            </div>
            <div className="share-stu-faculty-report-table-wrap">
              <table className="share-stu-faculty-report-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll No./ ID</th>
                    <th>Attempt Status</th>
                    <th>MCQ</th>
                    <th>SAQs</th>
                    <th>LAQs</th>
                    <th>Obt. Marks</th>
                    <th>Total Marks</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleReportRows.map((student) => (
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
                    </tr>
                  ))}
                  {!reportRows.length && <tr><td colSpan={9} className="faculty-report-empty">No students match your search.</td></tr>}
                </tbody>
              </table>
            </div>
            <nav className="faculty-report-pagination" aria-label="Practice report pagination">
              <span role="status">{reportRows.length ? `${(currentReportPage - 1) * 5 + 1}–${Math.min(currentReportPage * 5, reportRows.length)} of ${reportRows.length} students` : '0 students'}</span>
              <button type="button" disabled={currentReportPage <= 1} onClick={() => setReportPage(currentReportPage - 1)}><ChevronLeft size={15} />Previous</button>
              <span>Page {currentReportPage} of {reportPageCount}</span>
              <button type="button" disabled={currentReportPage >= reportPageCount} onClick={() => setReportPage(currentReportPage + 1)}>Next<ChevronRight size={15} /></button>
            </nav>
          </section>
        </div>,
        document.body,
      ) : null}
    </section>
  )
}

export default ShareStuFacultyPage
