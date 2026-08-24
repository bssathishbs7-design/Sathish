import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpenCheck, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Play, Timer, Trophy } from 'lucide-react'
import { APP_PAGES } from '../config/appPages'
import './StartPracticePage.css'

const START_PRACTICE_SELECTED_CARD_KEY = 'vx-start-practice-selected-card'

const readSelectedPracticeCard = () => {
  if (typeof window === 'undefined') return null

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(START_PRACTICE_SELECTED_CARD_KEY) ?? 'null')
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const getQuestionType = (question = {}) => {
  const type = String(question.type ?? question.questionType ?? '').toLowerCase()
  if (type.includes('mcq') || type.includes('multiple')) return 'MCQ'
  if (type.includes('laq') || type.includes('long')) return 'LAQs'
  if (type.includes('saq') || type.includes('short')) return 'SAQs'
  return question.options?.length ? 'MCQ' : 'Practice'
}

const getQuestionText = (question = {}) => (
  question.questionText
  || question.title
  || question.stem
  || question.prompt
  || 'Practice question'
)

const getAnswerText = (question = {}) => (
  question.answerKey
  || question.modelAnswer
  || question.rationale
  || question.explanation
  || 'Answer guidance will appear here.'
)

const formatCount = (value) => String(Number(value || 0)).padStart(2, '0')
const formatTime12Hour = (date) => date.toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const dateText = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${dateText} ${formatTime12Hour(date)}`
}

const formatScheduleDate = (value) => {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB')
}

const formatScheduleTime = (value) => {
  if (!value) return '-'
  const [hour = '00', minute = '00'] = String(value).split(':')
  const date = new Date()
  date.setHours(Number(hour) || 0, Number(minute) || 0, 0, 0)
  return formatTime12Hour(date)
}

const parseScheduledDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return null
  const date = new Date(`${dateValue}T${timeValue}`)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatCountdown = (targetDate, now = new Date()) => {
  if (!targetDate) return '-'
  const diffMs = targetDate.getTime() - now.getTime()
  if (diffMs <= 0) return '00:00:00'

  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const getPracticeSessions = (card = {}) => {
  if (Array.isArray(card.practiceSessions) && card.practiceSessions.length) {
    return card.practiceSessions.map((session, index) => ({
      id: session.id ?? `${card.id ?? card.competencyCode}-practice-${index + 1}`,
      practiceNo: Number(session.practiceNo) || index + 1,
      sharedAt: session.sharedAt || card.lastSharedAt || '',
      assignment: session.assignment ?? card.assignment ?? {},
      questions: Array.isArray(session.questions) ? session.questions : [],
      mcq: Number(session.mcq || 0),
      laqs: Number(session.laqs || 0),
      saqs: Number(session.saqs || 0),
      status: session.status || 'In Progress',
    }))
  }

  const legacyQuestions = Array.isArray(card.questions) ? card.questions : []
  return legacyQuestions.length ? [{
    id: `${card.id ?? card.competencyCode}-practice-1`,
    practiceNo: 1,
    sharedAt: card.lastSharedAt || card.sharedToStudentsAt || '',
    assignment: card.assignment ?? {},
    questions: legacyQuestions,
    mcq: Number(card.mcq || 0),
    laqs: Number(card.laqs || 0),
    saqs: Number(card.saqs || 0),
    status: 'In Progress',
  }] : []
}

const getPracticeRows = (card = {}, now = new Date()) => getPracticeSessions(card).map((session) => {
  const assignment = session.assignment ?? {}
  const isScheduled = Boolean(assignment.scheduleEnabled)
  const endDateTime = isScheduled ? parseScheduledDateTime(assignment.endDate, assignment.endTime) : null
  return {
    ...session,
    label: `# PRACTICE ${session.practiceNo}`,
    dateTime: formatDateTime(session.sharedAt),
    type: isScheduled ? 'Scheduled' : 'Normal',
    from: isScheduled ? formatScheduleDate(assignment.startDate) : '-',
    to: isScheduled ? formatScheduleDate(assignment.endDate) : '-',
    time: isScheduled && assignment.startTime && assignment.endTime
      ? `${formatScheduleTime(assignment.startTime)} - ${formatScheduleTime(assignment.endTime)}`
      : '-',
    countdown: isScheduled ? formatCountdown(endDateTime, now) : '-',
    mcq: formatCount(session.mcq),
    laqs: formatCount(session.laqs),
    saqs: formatCount(session.saqs),
    status: session.status || 'In Progress',
  }
})

function StartPracticePage({ onNavigate }) {
  const [selectedCard] = useState(() => readSelectedPracticeCard())
  const [mode, setMode] = useState('sessions')
  const [activeIndex, setActiveIndex] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const practiceRows = useMemo(() => getPracticeRows(selectedCard, now), [selectedCard, now])
  const [sessionFilter, setSessionFilter] = useState('all')
  const visiblePracticeRows = useMemo(() => (
    sessionFilter === 'all'
      ? practiceRows
      : practiceRows.filter((row) => row.type.toLowerCase() === sessionFilter)
  ), [practiceRows, sessionFilter])
  const sessionFilterCounts = useMemo(() => ({
    all: practiceRows.length,
    scheduled: practiceRows.filter((row) => row.type === 'Scheduled').length,
    normal: practiceRows.filter((row) => row.type === 'Normal').length,
  }), [practiceRows])
  const [activeSessionId, setActiveSessionId] = useState('')
  const activeSession = practiceRows.find((row) => row.id === activeSessionId) ?? practiceRows[0] ?? null
  const questions = useMemo(() => (
    Array.isArray(activeSession?.questions) ? activeSession.questions : []
  ), [activeSession])
  const activeQuestion = questions[activeIndex] ?? null
  const activeType = getQuestionType(activeQuestion)
  const competencyName = selectedCard?.competencyName || `Competency ${selectedCard?.competencyCode ?? ''}`

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  if (!selectedCard) {
    return (
      <section className="vx-content assessment-page start-practice-page">
        <div className="start-practice-empty">
          <span aria-hidden="true"><BookOpenCheck size={26} strokeWidth={2.2} /></span>
          <strong>No practice set selected</strong>
          <p>Choose a competency card from Learn & Practice to start a session.</p>
          <button type="button" onClick={() => onNavigate?.(APP_PAGES.LEARN_PRACTICE)}>
            <ArrowLeft size={15} strokeWidth={2.4} />
            Back to Learn & Practice
          </button>
        </div>
      </section>
    )
  }

  const renderPracticePlayer = () => (
    <>
      <main className="start-practice-workspace">
        <aside className="start-practice-question-nav" aria-label="Practice question navigation">
          {questions.map((question, index) => (
            <button
              key={question.id ?? `${selectedCard.competencyCode}-${index}`}
              type="button"
              className={index === activeIndex ? 'is-active' : ''}
              onClick={() => setActiveIndex(index)}
            >
              <span>Q{index + 1}</span>
              <em>{getQuestionType(question)}</em>
            </button>
          ))}
        </aside>

        <section className="start-practice-question-card">
          {activeQuestion ? (
            <>
              <div className="start-practice-question-head">
                <span>
                  <small>Question {activeIndex + 1} of {questions.length}</small>
                  <strong>{activeType}</strong>
                </span>
                <em>{activeQuestion.marks ?? selectedCard.marks ?? ''}{activeQuestion.marks || selectedCard.marks ? ' marks' : ''}</em>
              </div>

              <div className="start-practice-question-body">
                <p>{getQuestionText(activeQuestion)}</p>
                {activeType === 'MCQ' && Array.isArray(activeQuestion.options) && activeQuestion.options.length ? (
                  <div className="start-practice-options">
                    {activeQuestion.options.map((option, index) => (
                      <button key={option.id ?? option.label ?? index} type="button">
                        <span>{String.fromCharCode(65 + index)}</span>
                        {option.text ?? option.label ?? option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea placeholder="Type your practice answer here..." rows={6} />
                )}
              </div>

              <section className="start-practice-answer-card">
                <strong>Answer guidance</strong>
                <p>{getAnswerText(activeQuestion)}</p>
              </section>
            </>
          ) : (
            <div className="start-practice-empty is-inline">
              <span aria-hidden="true"><CheckCircle2 size={24} strokeWidth={2.2} /></span>
              <p>No questions are available in this practice set.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="start-practice-footer">
        <button type="button" disabled={activeIndex === 0} onClick={() => setActiveIndex((current) => Math.max(0, current - 1))}>
          <ChevronLeft size={15} strokeWidth={2.4} />
          Previous
        </button>
        <span>Page {questions.length ? activeIndex + 1 : 0} of {questions.length}</span>
        <button type="button" disabled={activeIndex >= questions.length - 1} onClick={() => setActiveIndex((current) => Math.min(questions.length - 1, current + 1))}>
          Next
          <ChevronRight size={15} strokeWidth={2.4} />
        </button>
      </footer>
    </>
  )

  return (
    <section className="vx-content assessment-page start-practice-page">
      <div className="start-practice-shell">
        <header className="start-practice-title-bar">
          <button type="button" className="start-practice-title-back" onClick={() => {
            if (mode === 'player') {
              setMode('sessions')
              return
            }
            onNavigate?.(APP_PAGES.LEARN_PRACTICE)
          }}>
            <ArrowLeft size={14} strokeWidth={2.4} />
            Back
          </button>
          <strong>{selectedCard.competencyCode}</strong>
          <span>{competencyName}</span>
        </header>

        {mode === 'sessions' ? (
          <section className="start-practice-session-card" aria-label={`${selectedCard.competencyCode} practice sessions`}>
            <div className="start-practice-session-toolbar">
              <span>
                <strong>Practice sessions</strong>
                <small>{practiceRows.length} sessions available</small>
              </span>
              <div className="start-practice-session-filters" aria-label="Filter practice sessions">
                {[
                  ['all', 'All'],
                  ['scheduled', 'Scheduled'],
                  ['normal', 'Normal'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={sessionFilter === value ? 'is-active' : ''}
                    onClick={() => setSessionFilter(value)}
                  >
                    {label}
                    <span>{sessionFilterCounts[value]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="start-practice-session-grid" role="table" aria-label="Practice sessions">
              <div className="start-practice-session-grid-head" role="row">
                <span role="columnheader">Practice</span>
                <span role="columnheader">Schedule</span>
                <span role="columnheader">Question mix</span>
                <span role="columnheader">Status</span>
                <span role="columnheader">Action</span>
              </div>
              {visiblePracticeRows.length ? visiblePracticeRows.map((row) => (
                <div className="start-practice-session-row" role="row" key={row.id}>
                  <span className="start-practice-session-primary" role="cell">
                    <strong>
                      <BookOpenCheck size={14} strokeWidth={2.2} />
                      {row.label}
                    </strong>
                    <em>
                      <CalendarDays size={13} strokeWidth={2.1} />
                      {row.dateTime}
                    </em>
                  </span>
                  <span className="start-practice-session-detail is-schedule" role="cell">
                    {row.type === 'Scheduled' ? (
                      <strong className={`start-practice-countdown-badge ${row.countdown === '00:00:00' ? 'is-expired' : 'is-live'}`}>
                        <Timer size={13} strokeWidth={2.1} />
                        {row.countdown}
                      </strong>
                    ) : (
                      <strong className="start-practice-normal-badge">Normal</strong>
                    )}
                  </span>
                  <span className="start-practice-session-mix" role="cell" aria-label={`${row.mcq} MCQ, ${row.laqs} LAQs, ${row.saqs} SAQs`}>
                    <span><strong>{row.mcq}</strong><em>MCQ</em></span>
                    <span><strong>{row.laqs}</strong><em>LAQs</em></span>
                    <span><strong>{row.saqs}</strong><em>SAQs</em></span>
                  </span>
                  <span role="cell"><span className="start-practice-status">{row.status}</span></span>
                  <span className="start-practice-session-action" role="cell">
                    <button type="button" className="start-practice-row-score" disabled>
                      <Trophy size={13} strokeWidth={2.3} />
                      Score
                    </button>
                    <button type="button" className="start-practice-row-start" onClick={() => {
                      setActiveSessionId(row.id)
                      setActiveIndex(0)
                      setMode('player')
                    }}>
                      <Play size={13} strokeWidth={2.4} />
                      Start
                    </button>
                  </span>
                </div>
              )) : (
                <div className="start-practice-session-row is-empty" role="row">
                  <span className="start-practice-session-empty" role="cell">No practice sessions match this filter.</span>
                </div>
              )}
            </div>
          </section>
        ) : renderPracticePlayer()}
      </div>
    </section>
  )
}

export default StartPracticePage
