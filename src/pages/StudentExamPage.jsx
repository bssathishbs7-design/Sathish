import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Image as ImageIcon,
  Play,
  SendHorizonal,
  ShieldCheck,
} from 'lucide-react'
import '../styles/student-exam.css'

const fallbackExam = {
  id: 'fallback-student-exam',
  title: 'Student Activity',
  type: 'Interpretation',
  examData: {
    assignContent: { question: true, form: false, scaffolding: true },
    durationMinutes: null,
    proctoring: {
      mode: 'Online Proctoring',
      fullscreenRequired: true,
      autoSubmitOnTimeout: true,
    },
    modules: {
      referenceImages: [],
      questions: [
        {
          id: 'fallback-question-1',
          type: 'Descriptive',
          prompt: 'Review the clinical prompt and write the most appropriate interpretation.',
          marks: '5',
          placeholder: 'Enter your answer here.',
          domain: 'Cognitive',
          isCritical: true,
        },
      ],
      form: [],
      scaffolding: [
        {
          id: 'fallback-scaffold-1',
          type: 'Descriptive',
          prompt: 'State one supporting point for your interpretation.',
          marks: '1',
          placeholder: 'Add one supporting point.',
          domain: 'Cognitive',
        },
      ],
    },
  },
}

const formatRemainingTime = (totalSeconds) => {
  const safeSeconds = Math.max(0, totalSeconds)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const normalizePrompt = (value, fallback) => value?.trim() || fallback

const getItemTypeBadge = (section, item, activityType) => {
  if (section === 'form') return 'Form'
  if (section === 'scaffolding') return 'Scaffolding'
  return item.kind === 'MCQ' || item.kind === 'True or False' ? item.kind : activityType
}

const getAssignedSections = (assignment) => {
  const resolved = assignment ?? fallbackExam
  const examData = resolved.examData ?? fallbackExam.examData
  const assignContent = examData.assignContent ?? { question: true, form: false, scaffolding: false }
  const modules = examData.modules ?? {}

  const questionSections = assignContent.question
    ? (modules.questions ?? []).map((question, index) => ({
        id: question.id ?? `question-${index + 1}`,
        section: 'question',
        kind: question.type ?? 'Descriptive',
        title: `Question ${index + 1}`,
        prompt: normalizePrompt(question.questionText ?? question.prompt, 'Add the main question prompt here.'),
        marks: question.marks ?? '1',
        placeholder: question.placeholder ?? 'Enter your answer here.',
        options: question.options ?? [],
        domain: question.domain ?? 'Cognitive',
        isCritical: Boolean(question.isCritical),
        tags: question.tags ?? [],
      }))
    : []

  const formSections = assignContent.form
    ? (modules.form ?? []).map((item, index) => ({
        id: item.id ?? `form-${index + 1}`,
        section: 'form',
        kind: item.formType ?? 'single',
        title: `Question ${index + 1}`,
        prompt: normalizePrompt(item.questionText ?? item.prompt, 'Add the form prompt here.'),
        marks: item.marks ?? '1',
        responses: (item.responses ?? []).map((response, responseIndex) => ({
          id: response.key ?? `${item.id ?? 'form'}-response-${responseIndex + 1}`,
          label: response.label ?? `Response ${responseIndex + 1}`,
          placeholder: `Enter ${response.label ?? `response ${responseIndex + 1}`.toLowerCase()}`,
        })),
        domain: item.domain ?? 'Psychomotor',
        isCritical: Boolean(item.isCritical),
        tags: item.tags ?? [],
      }))
    : []

  const scaffoldingSections = assignContent.scaffolding
    ? (modules.scaffolding ?? []).map((question, index) => ({
        id: question.id ?? `scaffold-${index + 1}`,
        section: 'scaffolding',
        kind: question.type ?? 'Descriptive',
        title: `Question ${questionSections.length + formSections.length + index + 1}`,
        prompt: normalizePrompt(question.questionText ?? question.prompt, 'Add the scaffolding prompt here.'),
        marks: question.marks ?? '1',
        placeholder: question.placeholder ?? 'Complete this mandatory scaffolding response.',
        options: question.options ?? [],
        domain: question.domain ?? 'Cognitive',
        isCritical: Boolean(question.isCritical),
        tags: question.tags ?? [],
      }))
    : []

  return {
    resolved,
    examData,
    questionSections,
    formSections,
    scaffoldingSections,
    examItems: [...questionSections, ...formSections, ...scaffoldingSections],
  }
}

function buildInitialAnswers(sections) {
  return {
    questions: Object.fromEntries(sections.questionSections.map((item) => [item.id, ''])),
    forms: Object.fromEntries(
      sections.formSections.flatMap((item) => item.responses.map((response) => [response.id, ''])),
    ),
    scaffolding: Object.fromEntries(sections.scaffoldingSections.map((item) => [item.id, ''])),
  }
}

function StudentQuestionCard({
  item,
  activityType,
  value,
  formValues,
  onChangeQuestion,
  onChangeForm,
  referenceImages,
  progressLabel,
}) {
  const isChoice = item.kind === 'MCQ' || item.kind === 'True or False'
  const options = item.kind === 'True or False' && item.options.length === 0 ? ['True', 'False'] : item.options
  const badges = [
    progressLabel,
    `Domain: ${item.domain ?? 'Cognitive'}`,
    `${item.marks} Marks`,
    getItemTypeBadge(item.section, item, activityType),
    ...(item.isCritical ? ['Critical'] : []),
    ...(item.tags ?? []),
  ]

  return (
    <article className="student-exam-question-stage">
      <div className="student-exam-question-top">
        <div className="student-exam-badge-row">
          {badges.map((badge) => (
            <span key={`${item.id}-${badge}`} className={`student-exam-badge ${badge === 'Critical' ? 'is-critical' : ''}`}>
              {badge}
            </span>
          ))}
        </div>
        <div className="student-exam-question-copy">
          <h2>{item.prompt}</h2>
        </div>
      </div>

      {referenceImages.length ? (
        <div className="student-exam-stage-media">
          {referenceImages.map((image) => (
            <figure key={image.id ?? image.src} className="student-exam-stage-media-card">
              {image.previewUrl || image.src ? (
                <img src={image.previewUrl ?? image.src} alt={image.label ?? 'Assigned reference'} />
              ) : (
                <ImageIcon size={24} strokeWidth={2} />
              )}
            </figure>
          ))}
        </div>
      ) : null}

      {item.section === 'form' ? (
        <div className="student-exam-form-stack">
          {item.responses.map((response) => (
            <label key={response.id} className="student-exam-field">
              <span>{response.label}</span>
              <input
                value={formValues[response.id] ?? ''}
                onChange={(event) => onChangeForm(response.id, event.target.value)}
                placeholder={response.placeholder}
              />
            </label>
          ))}
        </div>
      ) : isChoice && options.length ? (
        <div className="student-exam-choice-grid" role="radiogroup" aria-label={item.title}>
          {options.map((option) => (
            <label key={option} className={`student-exam-choice-card ${value === option ? 'is-selected' : ''}`}>
              <input
                type="radio"
                name={item.id}
                checked={value === option}
                onChange={() => onChangeQuestion(item.id, option, item.section)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : item.kind === 'Fill in the blanks' ? (
        <input
          className="student-exam-answer-input"
          value={value}
          onChange={(event) => onChangeQuestion(item.id, event.target.value, item.section)}
          placeholder={item.placeholder}
        />
      ) : (
        <textarea
          rows={7}
          className="student-exam-answer-area"
          value={value}
          onChange={(event) => onChangeQuestion(item.id, event.target.value, item.section)}
          placeholder={item.placeholder}
        />
      )}
    </article>
  )
}

export default function StudentExamPage({ assignment, onBackToActivities, onSubmitExam, onAlert }) {
  const sections = useMemo(() => getAssignedSections(assignment), [assignment])
  const { resolved, examData, examItems } = sections
  const hasTimer = Boolean(examData.durationMinutes)
  const [phase, setPhase] = useState('prestart')
  const [answers, setAnswers] = useState(() => buildInitialAnswers(sections))
  const [remainingSeconds, setRemainingSeconds] = useState((examData.durationMinutes ?? 0) * 60)
  const [warningCount, setWarningCount] = useState(0)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0)
  const [proctoringLog, setProctoringLog] = useState([])
  const [isFocusPaused, setIsFocusPaused] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false)
  const [submittedAt, setSubmittedAt] = useState('')
  const hasSubmittedRef = useRef(false)
  const lastViolationAtRef = useRef(0)

  useEffect(() => {
    const nextSections = getAssignedSections(assignment)
    setAnswers(buildInitialAnswers(nextSections))
    setRemainingSeconds((nextSections.examData.durationMinutes ?? 0) * 60)
    setWarningCount(0)
    setTabSwitchCount(0)
    setFullscreenExitCount(0)
    setProctoringLog([])
    setIsFocusPaused(false)
    setCurrentIndex(0)
    setIsSubmitConfirmOpen(false)
    setSubmittedAt('')
    setPhase('prestart')
    hasSubmittedRef.current = false
  }, [assignment])

  const completedCount = examItems.filter((item) => {
    if (item.section === 'form') {
      return item.responses.every((response) => String(answers.forms[response.id] ?? '').trim())
    }

    const source = item.section === 'scaffolding' ? answers.scaffolding : answers.questions
    return Boolean(String(source[item.id] ?? '').trim())
  }).length

  const currentItem = examItems[currentIndex] ?? null
  const currentItemValue = currentItem
    ? currentItem.section === 'scaffolding'
      ? answers.scaffolding[currentItem.id] ?? ''
      : answers.questions[currentItem.id] ?? ''
    : ''

  const isCurrentAnswered = currentItem
    ? currentItem.section === 'form'
      ? currentItem.responses.every((response) => String(answers.forms[response.id] ?? '').trim())
      : Boolean(String(currentItemValue).trim())
    : false

  const isSubmissionReady = examItems.length > 0 && completedCount === examItems.length

  const appendProctoringEvent = (message) => {
    setProctoringLog((current) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, message, time: new Date().toLocaleTimeString('en-GB') },
      ...current,
    ].slice(0, 10))
  }

  useEffect(() => {
    if (phase !== 'active' || isFocusPaused || !hasTimer) return undefined

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [hasTimer, isFocusPaused, phase])

  useEffect(() => {
    if (!hasTimer || phase !== 'active' || remainingSeconds > 0 || hasSubmittedRef.current) return
    handleSubmit('timeout')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTimer, phase, remainingSeconds])

  useEffect(() => {
    if (phase !== 'active') return undefined

    const registerViolation = (message, counter) => {
      const now = Date.now()
      if (now - lastViolationAtRef.current < 600) return
      lastViolationAtRef.current = now

      setWarningCount((current) => current + 1)
      if (counter === 'tab') setTabSwitchCount((current) => current + 1)
      if (counter === 'fullscreen') setFullscreenExitCount((current) => current + 1)
      appendProctoringEvent(message)
      setIsFocusPaused(true)
      onAlert?.({ tone: 'warning', message })
    }

    const handleVisibilityChange = () => {
      if (document.hidden) registerViolation('Focus was lost during the monitored exam.', 'tab')
    }

    const handleWindowBlur = () => {
      registerViolation('Focus was lost during the monitored exam.', 'tab')
    }

    const handleFullscreenChange = () => {
      if (examData.proctoring?.fullscreenRequired && !document.fullscreenElement) {
        registerViolation('Fullscreen exit detected during the exam.', 'fullscreen')
      }
    }

    window.addEventListener('blur', handleWindowBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      window.removeEventListener('blur', handleWindowBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [examData.proctoring?.fullscreenRequired, onAlert, phase])

  const startExam = async () => {
    if (examData.proctoring?.fullscreenRequired && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
      } catch {
        onAlert?.({ tone: 'warning', message: 'Fullscreen could not be enabled. Monitoring will continue.' })
      }
    }

    appendProctoringEvent('Exam started with online monitoring active.')
    setIsFocusPaused(false)
    setPhase('active')
  }

  const resumeExam = async () => {
    if (examData.proctoring?.fullscreenRequired && !document.fullscreenElement && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
      } catch {
        onAlert?.({ tone: 'warning', message: 'Resume attempted without fullscreen. Monitoring will continue.' })
      }
    }

    setIsFocusPaused(false)
  }

  const updateQuestionAnswer = (id, value, section) => {
    const key = section === 'scaffolding' ? 'scaffolding' : 'questions'
    setAnswers((current) => ({
      ...current,
      [key]: { ...current[key], [id]: value },
    }))
  }

  const updateFormAnswer = (id, value) => {
    setAnswers((current) => ({
      ...current,
      forms: { ...current.forms, [id]: value },
    }))
  }

  const moveQuestion = (direction) => {
    setCurrentIndex((current) => Math.max(0, Math.min(examItems.length - 1, current + direction)))
  }

  const requestFinalSubmit = () => {
    if (!isSubmissionReady) {
      onAlert?.({ tone: 'warning', message: 'Complete every mandatory question before final submission.' })
      return
    }
    setIsSubmitConfirmOpen(true)
  }

  const handleSubmit = (reason = 'manual') => {
    if (hasSubmittedRef.current) return
    if (reason === 'manual' && !isSubmissionReady) {
      onAlert?.({ tone: 'warning', message: 'Complete every mandatory question before final submission.' })
      return
    }

    hasSubmittedRef.current = true
    const submittedTimestamp = new Date().toLocaleString('en-GB')
    setIsFocusPaused(false)
    setIsSubmitConfirmOpen(false)
    setSubmittedAt(submittedTimestamp)
    setPhase('submitted')

    onSubmitExam?.({
      ...resolved,
      status: 'Completed',
      attemptCount: '1 / 1',
      submittedAt: submittedTimestamp,
      answers,
      proctoring: {
        warningCount,
        tabSwitchCount,
        fullscreenExitCount,
        events: proctoringLog,
        timedOut: reason === 'timeout',
      },
    })

    onAlert?.({
      tone: reason === 'timeout' ? 'warning' : 'secondary',
      message: reason === 'timeout' ? 'Time is over. The activity was auto-submitted.' : 'Activity submitted successfully.',
    })
  }

  const renderedReferenceImages = examData.modules?.referenceImages ?? []
  const prestartBadges = [
    `${examItems.length} Questions`,
    ...(sections.formSections.length ? [`${sections.formSections.length} Forms`] : []),
    ...(sections.scaffoldingSections.length ? ['Mandatory Scaffolding'] : []),
    examData.proctoring?.mode ?? 'Online Proctoring',
    ...(hasTimer ? [`${examData.durationMinutes} min`] : []),
  ]

  return (
    <section className="student-exam-page">
      <div className="student-exam-shell">
        {phase === 'prestart' ? (
          <section className="student-exam-entry">
            <div className="student-exam-entry-copy">
              <span className="student-exam-kicker">Student Exam</span>
              <h1>{resolved.title}</h1>
              <p>{resolved.type} assessment with monitored single-flow navigation.</p>
              <div className="student-exam-badge-row">
                {prestartBadges.map((badge) => (
                  <span key={badge} className="student-exam-badge">{badge}</span>
                ))}
              </div>
            </div>

            <div className="student-exam-entry-side">
              <div className="student-exam-entry-panel">
                <div className="student-exam-entry-rule">
                  <ShieldCheck size={18} strokeWidth={2.1} />
                  <span>Online proctoring is active for this attempt.</span>
                </div>
                {hasTimer ? (
                  <div className="student-exam-entry-rule">
                    <Clock3 size={18} strokeWidth={2.1} />
                    <span>Auto-submit will run when the timer reaches zero.</span>
                  </div>
                ) : null}
                <div className="student-exam-entry-rule">
                  <AlertTriangle size={18} strokeWidth={2.1} />
                  <span>Tab switches and fullscreen exits are recorded.</span>
                </div>
                <button type="button" className="student-exam-primary-btn" onClick={startExam}>
                  <Play size={16} strokeWidth={2.2} />
                  Start Activity
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {phase === 'active' && currentItem ? (
          <div className="student-exam-stage">
            <header className="student-exam-topbar">
              <div className="student-exam-topbar-copy">
                <span className="student-exam-kicker">Student Exam</span>
                <h1>{resolved.title}</h1>
              </div>
              <div className="student-exam-topbar-meta">
                <span className="student-exam-status-pill is-live-monitoring">
                  <span className="student-exam-live-dot" aria-hidden="true" />
                  Live Monitoring
                </span>
                <span className="student-exam-status-pill">
                  <Activity size={14} strokeWidth={2.1} />
                  Question {currentIndex + 1} of {examItems.length}
                </span>
                {hasTimer ? (
                  <span className="student-exam-status-pill">
                    <Clock3 size={14} strokeWidth={2.1} />
                    {formatRemainingTime(remainingSeconds)}
                  </span>
                ) : null}
              </div>
            </header>

            <section className="student-exam-stage-card">
              {isFocusPaused ? (
                <div className="student-exam-pause-overlay" role="alertdialog" aria-modal="true" aria-labelledby="exam-pause-title">
                  <div className="student-exam-pause-card">
                    <div className="student-exam-pause-icon" aria-hidden="true">
                      <AlertTriangle size={20} strokeWidth={2.2} />
                    </div>
                    <span className="student-exam-panel-kicker">Monitoring Pause</span>
                    <h2 id="exam-pause-title">Exam paused after focus loss</h2>
                    <p>This event has been recorded. Resume the monitored exam to continue answering.</p>
                    <div className="student-exam-pause-stats">
                      <span>Warnings {warningCount}</span>
                      <span>Tab switches {tabSwitchCount}</span>
                      <span>Fullscreen exits {fullscreenExitCount}</span>
                    </div>
                    <button type="button" className="student-exam-primary-btn" onClick={resumeExam}>
                      Resume Exam
                    </button>
                  </div>
                </div>
              ) : null}

              <StudentQuestionCard
                item={currentItem}
                activityType={resolved.type}
                value={currentItemValue}
                formValues={answers.forms}
                onChangeQuestion={updateQuestionAnswer}
                onChangeForm={updateFormAnswer}
                referenceImages={currentIndex === 0 ? renderedReferenceImages : []}
                progressLabel={`Question ${currentIndex + 1} of ${examItems.length}`}
              />

              <footer className="student-exam-stage-footer">
                <div className="student-exam-stage-progress">
                  <span>{completedCount} of {examItems.length} completed</span>
                  <div className="student-exam-stage-progress-bar" aria-hidden="true">
                    <span style={{ width: `${(completedCount / Math.max(examItems.length, 1)) * 100}%` }} />
                  </div>
                </div>

                <div className="student-exam-nav">
                  <button type="button" className="student-exam-secondary-btn" onClick={() => moveQuestion(-1)} disabled={currentIndex === 0}>
                    <ArrowLeft size={16} strokeWidth={2.1} />
                    Previous
                  </button>

                  {currentIndex < examItems.length - 1 ? (
                    <button
                      type="button"
                      className="student-exam-primary-btn"
                      onClick={() => moveQuestion(1)}
                    >
                      Next
                      <ArrowRight size={16} strokeWidth={2.1} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="student-exam-primary-btn"
                      onClick={requestFinalSubmit}
                      disabled={!isCurrentAnswered}
                    >
                      <SendHorizonal size={16} strokeWidth={2.1} />
                      Submit Activity
                    </button>
                  )}
                </div>
              </footer>
            </section>
          </div>
        ) : null}

        {phase === 'submitted' ? (
          <section className="student-exam-submitted-stage">
            <div className="student-exam-submitted-icon">
              <CheckCircle2 size={28} strokeWidth={2.1} />
            </div>
            <div className="student-exam-submitted-copy">
              <span className="student-exam-panel-kicker">Submitted</span>
              <h2>Activity submitted successfully</h2>
              <p>{submittedAt ? `Submission recorded on ${submittedAt}.` : 'Submission recorded successfully.'}</p>
            </div>
            <div className="student-exam-badge-row">
              <span className="student-exam-badge">Completed {completedCount} / {examItems.length}</span>
              <span className="student-exam-badge">Warnings {warningCount}</span>
              <span className="student-exam-badge">Tab switches {tabSwitchCount}</span>
            </div>
            <button type="button" className="student-exam-secondary-btn" onClick={onBackToActivities}>
              Back to My Skill Activity
            </button>
          </section>
        ) : null}
      </div>

      {isSubmitConfirmOpen ? (
        <div className="student-exam-confirm-backdrop" onClick={() => setIsSubmitConfirmOpen(false)} aria-hidden="true">
          <div className="student-exam-confirm-dialog" onClick={(event) => event.stopPropagation()}>
            <span className="student-exam-panel-kicker">Final Submission</span>
            <h3>Submit this activity now?</h3>
            <p>You cannot edit your answers after final submission.</p>
            <div className="student-exam-confirm-actions">
              <button type="button" className="student-exam-secondary-btn" onClick={() => setIsSubmitConfirmOpen(false)}>
                Cancel
              </button>
              <button type="button" className="student-exam-primary-btn" onClick={() => handleSubmit('manual')}>
                Submit Final
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
