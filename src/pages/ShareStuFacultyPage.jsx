import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  BarChart3,
  BookOpenCheck,
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
  UsersRound,
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

const countQuestionTypes = (questions = [], fallback = {}) => {
  const counts = questions.reduce((nextCounts, question) => {
    const type = getQuestionType(question)
    if (type) nextCounts[type] += 1
    nextCounts.totalMarks += getQuestionMarks(question)
    return nextCounts
  }, { mcq: 0, saqs: 0, laqs: 0, totalMarks: 0 })

  return {
    mcq: counts.mcq || Number(fallback.mcq || fallback.mcqCount || 0),
    saqs: counts.saqs || Number(fallback.saqs || fallback.saqCount || 0),
    laqs: counts.laqs || Number(fallback.laqs || fallback.laqCount || 0),
    totalMarks: counts.totalMarks || Number(fallback.totalMarks || fallback.marks || 0),
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

const getScheduleLabel = (session = {}) => {
  const schedule = session.schedule ?? {}
  if (typeof session.timeRemaining === 'string') return session.timeRemaining
  if (typeof session.remainingTime === 'string') return session.remainingTime
  if (typeof session.scheduleLabel === 'string') return session.scheduleLabel
  if (typeof session.scheduleType === 'string') return session.scheduleType
  if (typeof schedule.label === 'string') return schedule.label
  if (session.isScheduled || session.scheduled || schedule.startDate || schedule.startTime) return 'Scheduled'
  return 'Normal'
}

const getSharedDate = (card = {}) => {
  const sessionDates = Array.isArray(card.practiceSessions)
    ? card.practiceSessions.map((session) => session?.sharedAt ?? session?.createdAt).filter(Boolean)
    : []
  return formatDateTime(getLatestDateValue(card.lastSharedAt, card.sharedAt, card.updatedAt, card.createdAt, sessionDates))
}

const getPracticeRows = (card = {}, cardQuestions = []) => {
  const sessions = Array.isArray(card.practiceSessions) && card.practiceSessions.length
    ? card.practiceSessions
    : [{
      id: `${card.id ?? card.competencyCode ?? 'practice'}-1`,
      practiceNo: 1,
      sharedAt: card.lastSharedAt ?? card.sharedAt ?? card.updatedAt ?? card.createdAt,
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
      schedule: getScheduleLabel(session),
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
  const [page, setPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState(() => new Set())
  const [activeReport, setActiveReport] = useState(null)

  useEffect(() => {
    const syncSharedCards = () => setSharedCards(readSharedCards())

    window.addEventListener('storage', syncSharedCards)
    window.addEventListener('learn-practice-shared-cards', syncSharedCards)

    return () => {
      window.removeEventListener('storage', syncSharedCards)
      window.removeEventListener('learn-practice-shared-cards', syncSharedCards)
    }
  }, [])

  const rows = useMemo(() => sharedCards.map((card) => {
    const questions = getCardQuestions(card)
    const counts = countQuestionTypes(questions, card)
    const code = card.competencyCode || questions.find((question) => question?.competencyCode)?.competencyCode || '-'
    const competencyRow = getCompetencyRow(code)
    const competency = card.competencyName || competencyRow?.competency || `Competency ${code}`
    const subject = card.subject || questions.find((question) => question?.subject)?.subject || competencyRow?.subject || 'Human Anatomy'
    const practices = getPracticeRows(card, questions)
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
  }), [sharedCards])

  const filteredRows = useMemo(() => {
    const searchText = query.trim().toLowerCase()
    if (!searchText) return rows

    return rows.filter((row) => (
      row.code.toLowerCase().includes(searchText)
      || row.competency.toLowerCase().includes(searchText)
      || row.subject.toLowerCase().includes(searchText)
      || row.assignedTo.toLowerCase().includes(searchText)
    ))
  }, [query, rows])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const visibleRows = filteredRows.slice((Math.min(page, pageCount) - 1) * PAGE_SIZE, Math.min(page, pageCount) * PAGE_SIZE)
  const totals = rows.reduce((nextTotals, row) => ({
    cards: nextTotals.cards + 1,
    questions: nextTotals.questions + row.total,
    mcq: nextTotals.mcq + row.mcq,
    saqs: nextTotals.saqs + row.saqs,
    laqs: nextTotals.laqs + row.laqs,
    livePractice: nextTotals.livePractice + row.livePractice,
    practices: nextTotals.practices + row.practiceCount,
  }), { cards: 0, questions: 0, mcq: 0, saqs: 0, laqs: 0, livePractice: 0, practices: 0 })

  useEffect(() => {
    setExpandedRows((currentRows) => {
      const nextRows = new Set(currentRows)
      rows.forEach((row) => nextRows.add(row.id))
      return nextRows
    })
  }, [rows])

  useEffect(() => {
    setPage(1)
  }, [query])

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

        <div className="assessment-create-card-heading learn-practice-title-row share-stu-faculty-title-row">
          <h2>
            <span className="learn-practice-title-icon share-stu-faculty-icon" aria-hidden="true">
              <Share2 size={18} strokeWidth={2.3} />
            </span>
            Share to Students
          </h2>
          <button type="button" onClick={() => onNavigate?.(APP_PAGES.QUESTION_BANK_NON_CREATE)}>
            <ChevronLeft size={16} strokeWidth={2.4} />
            Question Bank
          </button>
        </div>

        <section className="share-stu-faculty-metrics" aria-label="Share to students metrics">
          <article>
            <BookOpenCheck size={17} strokeWidth={2.3} />
            <strong>{totals.cards}</strong>
            <span>Shared sets</span>
          </article>
          <article>
            <UsersRound size={17} strokeWidth={2.3} />
            <strong>{totals.questions}</strong>
            <span>Total questions</span>
          </article>
          <article>
            <strong>{totals.mcq}</strong>
            <span>MCQ</span>
          </article>
          <article>
            <strong>{totals.saqs}</strong>
            <span>SAQs</span>
          </article>
          <article>
            <strong>{totals.laqs}</strong>
            <span>LAQs</span>
          </article>
        </section>

        <section className="share-stu-faculty-card" aria-label="Shared question list">
          <div className="share-stu-faculty-toolbar">
            <div>
              <h2>Shared questions</h2>
              <p>{filteredRows.length} shared competency {filteredRows.length === 1 ? 'set' : 'sets'}</p>
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

          {visibleRows.length ? (
            <>
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
                                <span className="share-stu-faculty-schedule-pill">{practice.schedule}</span>
                                <span className="share-stu-faculty-mix">
                                  <span><b>{practice.mcq || '-'}</b><small>MCQ</small></span>
                                  <span><b>{practice.saqs || '-'}</b><small>SAQs</small></span>
                                  <span><b>{practice.laqs || '-'}</b><small>LAQs</small></span>
                                  <span><b>{practice.total}</b><small>Total</small></span>
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
                  {activeReport.parent.code} • # Practice {activeReport.practice.practiceNo}
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
