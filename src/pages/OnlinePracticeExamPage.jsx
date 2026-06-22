import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Award, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileText, Hash, ListChecks, Moon, Sun, Timer } from 'lucide-react'
import { APP_PAGES } from '../config/appPages'
import '../styles/assessment-pages.css'

const ONLINE_PRACTICE_EXAM_STORAGE_KEY = 'vx-online-practice-exam-assessment'

const readSelectedAssessment = () => {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(ONLINE_PRACTICE_EXAM_STORAGE_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const stripHtml = (value) => String(value ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const formatDisplayDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB').replace(/\//g, '-')
}

const parseAssessmentDate = (value) => {
  if (!value) return null
  const normalized = String(value).trim()
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const displayMatch = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/)

  if (isoMatch) return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
  if (displayMatch) return new Date(Number(displayMatch[3]), Number(displayMatch[2]) - 1, Number(displayMatch[1]))

  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const applyAssessmentTime = (date, value) => {
  if (!date) return null
  const nextDate = new Date(date)
  const match = String(value || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i)

  if (!match) {
    nextDate.setHours(0, 0, 0, 0)
    return nextDate
  }

  let hours = Number(match[1])
  const minutes = Number(match[2] || 0)
  const period = String(match[3] || '').toUpperCase()

  if (period === 'PM' && hours < 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  nextDate.setHours(hours, minutes, 0, 0)
  return nextDate
}

const isDescriptiveQuestionType = (type) => (
  type === 'Descriptive Question'
  || String(type ?? '').toLowerCase().includes('descriptive')
  || String(type ?? '').includes('SAQs')
  || String(type ?? '').includes('MEQs')
  || String(type ?? '').includes('LAQs')
)

const getQuestionText = (question) => (
  stripHtml(question?.questionText ?? question?.question ?? question?.title) || 'Question text not available'
)

const getOptionText = (option) => (
  stripHtml(option?.label ?? option?.text ?? option?.value ?? option) || 'Option'
)

const getMarks = (question) => (
  question?.marks
  ?? question?.totalMarks
  ?? question?.mark
  ?? '-'
)

const getInstructionLines = (value) => stripHtml(value)
  .split(/\n+|(?:\s*•\s*)/)
  .map((line) => line.trim())
  .filter(Boolean)

const parseDurationToSeconds = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value * 60))
  const text = String(value ?? '').trim()
  if (!text) return 0
  const parts = text.split(':').map((part) => Number(part.trim()))
  if (parts.some((part) => Number.isNaN(part))) return 0
  if (parts.length === 3) return Math.max(0, (parts[0] * 3600) + (parts[1] * 60) + parts[2])
  if (parts.length === 2) return Math.max(0, (parts[0] * 3600) + (parts[1] * 60))
  return Math.max(0, parts[0] * 60)
}

const formatCountdown = (seconds) => {
  const remaining = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(remaining / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  const secs = remaining % 60
  const pad = (value) => String(value).padStart(2, '0')

  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
  return `${pad(minutes)}:${pad(secs)}`
}

function OnlinePracticeExamPage({ onExit, theme = 'light', onToggleTheme }) {
  const [assessment] = useState(readSelectedAssessment)
  const [hasAgreed, setHasAgreed] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [examStartedAt, setExamStartedAt] = useState(null)
  const [timerNow, setTimerNow] = useState(Date.now())
  const [activeSection, setActiveSection] = useState('mcq')
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})

  const questionRows = Array.isArray(assessment?.questionRows) ? assessment.questionRows : []
  const mcqQuestions = useMemo(() => questionRows.filter((item) => item?.type === 'MCQ'), [questionRows])
  const descriptiveQuestions = useMemo(() => questionRows.filter((item) => isDescriptiveQuestionType(item?.type)), [questionRows])
  const currentQuestions = activeSection === 'mcq' ? mcqQuestions : descriptiveQuestions
  const currentQuestion = currentQuestions[activeQuestionIndex] ?? null
  const setup = assessment?.setup ?? {}
  const headerLogo = setup.logoPreview || assessment?.logoPreview || ''
  const ThemeIcon = theme === 'dark' ? Sun : Moon
  const studentInstructionLines = getInstructionLines(setup.studentInstructions)
  const canShowStudentInstructions = setup.provideStudentInstructions === 'Yes' && studentInstructionLines.length > 0
  const totalDurationSeconds = useMemo(() => parseDurationToSeconds(assessment?.totalDuration), [assessment?.totalDuration])
  const scheduledStartAt = useMemo(() => {
    const startDate = parseAssessmentDate(assessment?.startDate)
    return applyAssessmentTime(startDate, assessment?.startTime)
  }, [assessment?.startDate, assessment?.startTime])
  const scheduledEndAt = useMemo(() => (
    scheduledStartAt && totalDurationSeconds
      ? new Date(scheduledStartAt.getTime() + (totalDurationSeconds * 1000))
      : null
  ), [scheduledStartAt, totalDurationSeconds])
  const isAssessmentLive = Boolean(
    scheduledStartAt
    && scheduledEndAt
    && timerNow >= scheduledStartAt.getTime()
    && timerNow <= scheduledEndAt.getTime()
  )
  const fallbackEndAt = examStartedAt && totalDurationSeconds ? examStartedAt + (totalDurationSeconds * 1000) : null
  const remainingDurationSeconds = (hasStarted || isAssessmentLive) && totalDurationSeconds
    ? Math.max(0, Math.floor(((scheduledEndAt?.getTime() || fallbackEndAt || timerNow) - timerNow) / 1000))
    : totalDurationSeconds
  const shouldShowRemainingTime = Boolean((hasStarted || isAssessmentLive) && totalDurationSeconds)
  const durationDisplay = shouldShowRemainingTime
    ? formatCountdown(remainingDurationSeconds)
    : assessment?.totalDuration || '-'
  const headerChips = [
    { label: 'Type', value: assessment?.examType || '-', tone: 'type' },
    { label: shouldShowRemainingTime ? 'Remaining Time' : 'Duration', value: durationDisplay, tone: 'duration' },
    { label: 'Marks', value: assessment?.totalMarks ?? '-', tone: 'marks' },
  ]
  const detailItems = [
    { label: 'Total Marks', value: assessment?.totalMarks ?? '-', icon: Award },
    { label: 'Questions', value: assessment?.questionCount ?? questionRows.length, icon: Hash },
    { label: shouldShowRemainingTime ? 'Remaining Time' : 'Total Duration', value: durationDisplay, icon: Timer },
    { label: 'Start Date', value: formatDisplayDate(assessment?.startDate), icon: CalendarDays },
    { label: 'Start Time', value: assessment?.startTime || '-', icon: Clock3 },
    { label: 'End Date', value: formatDisplayDate(assessment?.endDate), icon: CalendarDays },
  ]

  const switchSection = (section) => {
    setActiveSection(section)
    setActiveQuestionIndex(0)
  }

  const startExam = () => {
    const startedAt = Date.now()
    setExamStartedAt(startedAt)
    setTimerNow(startedAt)
    setHasStarted(true)
  }

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setTimerNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [])

  if (!assessment) {
    return (
      <main className="online-practice-exam-page">
        <section className="online-practice-empty">
          <h1>Assessment not found</h1>
          <p>Please return to My Assessment and start the assessment again.</p>
          <button type="button" onClick={() => onExit?.(APP_PAGES.MY_ASSESSMENT)}>
            <ArrowLeft size={16} strokeWidth={2.2} />
            Back to My Assessment
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className={`online-practice-exam-page ${hasStarted ? 'has-fixed-header' : 'is-before-start'}`}>
      {hasStarted ? (
        <header className="online-practice-header">
          {headerLogo ? (
            <img src={headerLogo} alt={setup.logoName || 'Assessment logo'} className="online-practice-logo-image" />
          ) : (
            <span className="online-practice-logo-mark" aria-hidden="true">
              <ListChecks size={20} strokeWidth={2.3} />
            </span>
          )}
          <div className="online-practice-header-title">
            <h1>{assessment.assessmentName || 'Practice Assessment'}</h1>
            <p>{setup.collegeName || assessment.collegeName || 'College not selected'}</p>
            <small>
              {[assessment.examCategory, setup.academicYear, assessment.assignTo, assessment.supervisionType || 'Practice Exam']
                .filter(Boolean)
                .join(' / ')}
            </small>
          </div>
          <div className="online-practice-header-chips" aria-label="Assessment configuration summary">
            {headerChips.map(([label, value]) => (
              <span key={label} className={`is-${label.toLowerCase()}`}>
                <em>{label}</em>
                <strong>{value}</strong>
              </span>
            ))}
          </div>
          <div className="online-practice-header-actions">
            <button type="button" className="online-practice-theme-btn" onClick={onToggleTheme} aria-label="Toggle theme">
              <ThemeIcon size={16} strokeWidth={2.2} />
            </button>
            <button type="button" className="online-practice-exit-btn" onClick={() => onExit?.(APP_PAGES.MY_ASSESSMENT)}>
              Exit
            </button>
          </div>
        </header>
      ) : null}

      {!hasStarted ? (
        <section className="online-practice-start-card">
          <div className="online-practice-start-identity">
            {headerLogo ? (
              <img src={headerLogo} alt={setup.logoName || 'Assessment logo'} className="online-practice-logo-image" />
            ) : (
              <span className="online-practice-logo-mark" aria-hidden="true">
                <ListChecks size={20} strokeWidth={2.3} />
              </span>
            )}
            <div>
              <h1>{assessment.assessmentName || 'Practice Assessment'}</h1>
              <p>{setup.collegeName || assessment.collegeName || 'College not selected'}</p>
              <small>
                {[assessment.examCategory, setup.academicYear, assessment.assignTo, assessment.supervisionType || 'Practice Exam']
                  .filter(Boolean)
                  .join(' / ')}
              </small>
            </div>
            <div className="online-practice-header-actions">
              <button type="button" className="online-practice-theme-btn" onClick={onToggleTheme} aria-label="Toggle theme">
                <ThemeIcon size={16} strokeWidth={2.2} />
              </button>
              <button type="button" className="online-practice-exit-btn" onClick={() => onExit?.(APP_PAGES.MY_ASSESSMENT)}>
                Exit
              </button>
            </div>
          </div>
          <div className="online-practice-start-head">
            <span>
              <FileText size={18} strokeWidth={2.2} />
              Assessment Details
            </span>
            <strong>{assessment.examMode || 'Online'}</strong>
          </div>

          <div className="online-practice-detail-grid">
            {detailItems.map((item) => {
              const Icon = item.icon

              return (
                <span key={item.label}>
                  <i aria-hidden="true">
                    <Icon size={15} strokeWidth={2.3} />
                  </i>
                  <strong>{item.value}</strong>
                  <em>{item.label}</em>
                </span>
              )
            })}
          </div>

          <div className="online-practice-instructions">
            <h2>Instructions</h2>
            <ul>
              <li>This is an online practice assessment.</li>
              <li>MCQ questions can be answered by selecting one option.</li>
              <li>Descriptive questions are shown in read-only mode for review.</li>
              <li>Use Next and Previous to move between questions.</li>
            </ul>
          </div>

          {canShowStudentInstructions ? (
            <div className="online-practice-student-instructions">
              <h2>Student Instructions &amp; Assessment Description</h2>
              <ul>
                {studentInstructionLines.map((line, index) => (
                  <li key={`${line}-${index}`}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="online-practice-start-footer">
            <label className="online-practice-agree">
              <input type="checkbox" checked={hasAgreed} onChange={(event) => setHasAgreed(event.target.checked)} />
              <span>I acknowledge and agree to comply with all stated assessment guidelines.</span>
            </label>

            <button type="button" className="online-practice-start-btn" disabled={!hasAgreed} onClick={startExam}>
              Start Exam
            </button>
          </div>
        </section>
      ) : (
        <section className="online-practice-workspace">
          <div className="online-practice-tabs" role="tablist" aria-label="Question sections">
            <button type="button" className={activeSection === 'mcq' ? 'is-active' : ''} onClick={() => switchSection('mcq')}>
              MCQ
              <strong>{mcqQuestions.length}</strong>
            </button>
            <button type="button" className={activeSection === 'descriptive' ? 'is-active' : ''} onClick={() => switchSection('descriptive')}>
              Descriptive
              <strong>{descriptiveQuestions.length}</strong>
              <em>Read Only</em>
            </button>
          </div>

          <article className="online-practice-question-card">
            {currentQuestion ? (
              <>
                <div className="online-practice-question-head">
                  <span>Question {activeQuestionIndex + 1} of {currentQuestions.length}</span>
                  <strong>{getMarks(currentQuestion)} Marks</strong>
                </div>
                <h2>{getQuestionText(currentQuestion)}</h2>

                {activeSection === 'mcq' ? (
                  <div className="online-practice-options">
                    {(currentQuestion.options ?? []).map((option, optionIndex) => {
                      const optionKey = `${currentQuestion.id ?? activeQuestionIndex}-${optionIndex}`
                      const isSelected = answers[currentQuestion.id ?? activeQuestionIndex] === optionIndex

                      return (
                        <button
                          type="button"
                          key={optionKey}
                          className={isSelected ? 'is-selected' : ''}
                          onClick={() => setAnswers((current) => ({ ...current, [currentQuestion.id ?? activeQuestionIndex]: optionIndex }))}
                        >
                          <strong>{String.fromCharCode(65 + optionIndex)}.</strong>
                          <span>{getOptionText(option)}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="online-practice-descriptive-readonly">
                    <span><CheckCircle2 size={15} strokeWidth={2.2} /> Read Only</span>
                    {(currentQuestion.descriptiveSections ?? []).length ? (
                      currentQuestion.descriptiveSections.map((section, index) => (
                        <p key={section.id ?? index}>
                          <strong>{index + 1}.</strong>
                          {getQuestionText(section)}
                        </p>
                      ))
                    ) : (
                      <p>No sub questions available.</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="online-practice-empty-section">
                <p>No questions available in this section.</p>
              </div>
            )}
          </article>

          <footer className="online-practice-question-nav">
            <button type="button" disabled={activeQuestionIndex <= 0} onClick={() => setActiveQuestionIndex((current) => Math.max(0, current - 1))}>
              <ChevronLeft size={16} strokeWidth={2.2} />
              Previous
            </button>
            <button type="button" disabled={activeQuestionIndex >= currentQuestions.length - 1} onClick={() => setActiveQuestionIndex((current) => Math.min(currentQuestions.length - 1, current + 1))}>
              Next
              <ChevronRight size={16} strokeWidth={2.2} />
            </button>
          </footer>
        </section>
      )}
    </main>
  )
}

export default OnlinePracticeExamPage
