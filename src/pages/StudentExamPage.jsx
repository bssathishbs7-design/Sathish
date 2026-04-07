import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Expand,
  FileText,
  Image as ImageIcon,
  Play,
  ShieldCheck,
} from 'lucide-react'
import '../styles/student-exam.css'

const fallbackExam = {
  id: 'fallback-student-exam',
  title: 'Student Activity',
  type: 'Interpretation',
  attemptCount: '0 / 1',
  createdDate: '07/04/2026',
  assignedTo: 'First Year • SGT A',
  examData: {
    assignContent: { question: true, form: false, scaffolding: true },
    durationMinutes: 30,
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
      }))
    : []

  const formSections = assignContent.form
    ? (modules.form ?? []).map((item, index) => ({
        id: item.id ?? `form-${index + 1}`,
        section: 'form',
        kind: item.formType ?? 'single',
        title: `Form ${index + 1}`,
        prompt: normalizePrompt(item.questionText ?? item.prompt, 'Add the form prompt here.'),
        marks: item.marks ?? '1',
        responses: (item.responses ?? []).map((response, responseIndex) => ({
          id: response.key ?? `${item.id ?? 'form'}-response-${responseIndex + 1}`,
          label: response.label ?? `Response ${responseIndex + 1}`,
          placeholder: `Enter ${response.label ?? `response ${responseIndex + 1}`.toLowerCase()}`,
        })),
      }))
    : []

  const scaffoldingSections = assignContent.scaffolding
    ? (modules.scaffolding ?? []).map((question, index) => ({
        id: question.id ?? `scaffold-${index + 1}`,
        section: 'scaffolding',
        kind: question.type ?? 'Descriptive',
        title: `Scaffolding ${index + 1}`,
        prompt: normalizePrompt(question.questionText ?? question.prompt, 'Add the scaffolding prompt here.'),
        marks: question.marks ?? '1',
        placeholder: question.placeholder ?? 'Complete this mandatory scaffolding response.',
        options: question.options ?? [],
      }))
    : []

  return {
    resolved,
    examData,
    assignContent,
    questionSections,
    formSections,
    scaffoldingSections,
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

function QuestionResponseCard({ item, value, onChange, isMandatory }) {
  const isChoice = item.kind === 'MCQ' || item.kind === 'True or False'
  const options = item.kind === 'True or False' && item.options.length === 0 ? ['True', 'False'] : item.options

  return (
    <article className={`student-exam-question-card ${item.section === 'scaffolding' ? 'is-scaffolding' : ''}`}>
      <div className="student-exam-question-head">
        <div>
          <span className="student-exam-question-kicker">{item.title}</span>
          <h3>{item.prompt}</h3>
        </div>
        <div className="student-exam-question-meta">
          <span>{item.marks} Marks</span>
          {isMandatory ? <span className="student-exam-required-pill">Mandatory</span> : null}
        </div>
      </div>

      {isChoice && options.length ? (
        <div className="student-exam-choice-list" role="radiogroup" aria-label={item.title}>
          {options.map((option) => (
            <label key={option} className={`student-exam-choice ${value === option ? 'is-selected' : ''}`}>
              <input
                type="radio"
                name={item.id}
                checked={value === option}
                onChange={() => onChange(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : item.kind === 'Fill in the blanks' ? (
        <input
          className="student-exam-text-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={item.placeholder}
        />
      ) : (
        <textarea
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={item.placeholder}
        />
      )}
    </article>
  )
}

function FormResponseCard({ item, responses, onChange }) {
  return (
    <article className="student-exam-question-card is-form">
      <div className="student-exam-question-head">
        <div>
          <span className="student-exam-question-kicker">{item.title}</span>
          <h3>{item.prompt}</h3>
        </div>
        <div className="student-exam-question-meta">
          <span>{item.marks} Marks</span>
          <span className="student-exam-required-pill">Mandatory</span>
        </div>
      </div>

      <div className="student-exam-form-response-list">
        {item.responses.map((response) => (
          <label key={response.id} className="student-exam-form-response">
            <span>{response.label}</span>
            <input
              value={responses[response.id] ?? ''}
              onChange={(event) => onChange(response.id, event.target.value)}
              placeholder={response.placeholder}
            />
          </label>
        ))}
      </div>
    </article>
  )
}

export default function StudentExamPage({ assignment, onBackToActivities, onSubmitExam, onAlert }) {
  const sections = useMemo(() => getAssignedSections(assignment), [assignment])
  const { resolved, examData, questionSections, formSections, scaffoldingSections } = sections

  const [phase, setPhase] = useState('prestart')
  const [answers, setAnswers] = useState(() => buildInitialAnswers(sections))
  const [remainingSeconds, setRemainingSeconds] = useState((examData.durationMinutes ?? 30) * 60)
  const [warningCount, setWarningCount] = useState(0)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0)
  const [proctoringLog, setProctoringLog] = useState([])
  const [submittedAt, setSubmittedAt] = useState('')
  const hasSubmittedRef = useRef(false)

  useEffect(() => {
    const nextSections = getAssignedSections(assignment)
    setAnswers(buildInitialAnswers(nextSections))
    setRemainingSeconds((nextSections.examData.durationMinutes ?? 30) * 60)
    setWarningCount(0)
    setTabSwitchCount(0)
    setFullscreenExitCount(0)
    setProctoringLog([])
    setSubmittedAt('')
    setPhase('prestart')
    hasSubmittedRef.current = false
  }, [assignment])

  const requiredQuestionIds = questionSections.map((item) => item.id)
  const requiredScaffoldingIds = scaffoldingSections.map((item) => item.id)
  const requiredFormIds = formSections.flatMap((item) => item.responses.map((response) => response.id))
  const totalRequiredCount = requiredQuestionIds.length + requiredScaffoldingIds.length + requiredFormIds.length
  const completedCount = [
    ...requiredQuestionIds.map((id) => answers.questions[id]),
    ...requiredScaffoldingIds.map((id) => answers.scaffolding[id]),
    ...requiredFormIds.map((id) => answers.forms[id]),
  ].filter((value) => String(value ?? '').trim()).length

  const proctoringSummary = useMemo(() => ([
    { label: 'Tab switches', value: tabSwitchCount },
    { label: 'Fullscreen exits', value: fullscreenExitCount },
    { label: 'Warnings', value: warningCount },
  ]), [fullscreenExitCount, tabSwitchCount, warningCount])

  const isSubmissionReady = completedCount === totalRequiredCount && totalRequiredCount > 0

  const appendProctoringEvent = (message) => {
    setProctoringLog((current) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, message, time: new Date().toLocaleTimeString('en-GB') },
      ...current,
    ].slice(0, 5))
  }

  useEffect(() => {
    if (phase !== 'active') return undefined

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
  }, [phase])

  useEffect(() => {
    if (phase !== 'active' || remainingSeconds > 0 || hasSubmittedRef.current) return

    handleSubmit('timeout')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, remainingSeconds])

  useEffect(() => {
    if (phase !== 'active') return undefined

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarningCount((current) => current + 1)
        setTabSwitchCount((current) => current + 1)
        appendProctoringEvent('Tab switch detected during the monitored attempt.')
        onAlert?.({ tone: 'warning', message: 'Tab switching is recorded during the exam.' })
      }
    }

    const handleFullscreenChange = () => {
      if (examData.proctoring?.fullscreenRequired && !document.fullscreenElement) {
        setWarningCount((current) => current + 1)
        setFullscreenExitCount((current) => current + 1)
        appendProctoringEvent('Fullscreen was exited during the monitored attempt.')
        onAlert?.({ tone: 'warning', message: 'Fullscreen exit detected during the exam.' })
      }
    }

    window.addEventListener('blur', handleVisibilityChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      window.removeEventListener('blur', handleVisibilityChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [examData.proctoring?.fullscreenRequired, onAlert, phase])

  const startExam = async () => {
    if (examData.proctoring?.fullscreenRequired && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
      } catch {
        onAlert?.({ tone: 'warning', message: 'Fullscreen could not be enabled. The exam will continue with monitoring warnings.' })
      }
    }

    appendProctoringEvent('Exam started with online monitoring active.')
    setPhase('active')
  }

  const updateQuestionAnswer = (id, value) => {
    setAnswers((current) => ({
      ...current,
      questions: { ...current.questions, [id]: value },
    }))
  }

  const updateScaffoldingAnswer = (id, value) => {
    setAnswers((current) => ({
      ...current,
      scaffolding: { ...current.scaffolding, [id]: value },
    }))
  }

  const updateFormAnswer = (id, value) => {
    setAnswers((current) => ({
      ...current,
      forms: { ...current.forms, [id]: value },
    }))
  }

  const handleSubmit = (reason = 'manual') => {
    if (hasSubmittedRef.current) return

    if (reason === 'manual' && !isSubmissionReady) {
      onAlert?.({ tone: 'warning', message: 'Complete all mandatory questions and scaffolding before submitting.' })
      return
    }

    hasSubmittedRef.current = true
    const submittedTimestamp = new Date().toLocaleString('en-GB')
    setSubmittedAt(submittedTimestamp)
    setPhase('submitted')

    onSubmitExam?.({
      ...resolved,
      status: 'Completed',
      attemptCount: resolved.attemptCount?.replace(/^0\s*\//, '1 /') ?? '1 / 1',
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
      message: reason === 'timeout'
        ? 'Time is over. The activity was auto-submitted.'
        : 'Activity submitted successfully.',
    })
  }

  const renderedReferenceImages = examData.modules?.referenceImages ?? []

  return (
    <section className="student-exam-page">
      <div className="student-exam-shell">
        <section className="student-exam-hero">
          <div className="student-exam-hero-copy">
            <span className="student-exam-kicker">Student Exam</span>
            <h1>{resolved.title}</h1>
            <p>{resolved.type} • {resolved.assignedTo ?? 'Assigned activity'} • Attempt {resolved.attemptCount ?? '0 / 1'}</p>
          </div>

          <div className="student-exam-hero-status">
            <div>
              <span>Mode</span>
              <strong>{examData.proctoring?.mode ?? 'Online Proctoring'}</strong>
            </div>
            <div>
              <span>Timer</span>
              <strong>{formatRemainingTime(remainingSeconds)}</strong>
            </div>
            <div>
              <span>Progress</span>
              <strong>{completedCount} / {totalRequiredCount}</strong>
            </div>
          </div>
        </section>

        {phase === 'prestart' ? (
          <div className="student-exam-grid">
            <section className="student-exam-panel">
              <div className="student-exam-panel-head">
                <span className="student-exam-panel-kicker">Exam Rules</span>
                <h2>Start a monitored activity</h2>
                <p>This exam starts immediately, records tab switching, and does not support save draft.</p>
              </div>

              <div className="student-exam-rule-list">
                <div><ShieldCheck size={16} strokeWidth={2.1} /><span>Online proctoring is active for this attempt.</span></div>
                <div><Clock3 size={16} strokeWidth={2.1} /><span>Auto-submit will run when the timer reaches zero.</span></div>
                <div><AlertTriangle size={16} strokeWidth={2.1} /><span>Tab switches and fullscreen exits are recorded.</span></div>
                <div><CheckCircle2 size={16} strokeWidth={2.1} /><span>Assigned scaffolding is mandatory and must be completed.</span></div>
              </div>

              <div className="student-exam-module-strip">
                {questionSections.length ? <span><FileText size={14} strokeWidth={2} /> Question</span> : null}
                {formSections.length ? <span><Activity size={14} strokeWidth={2} /> Form</span> : null}
                {scaffoldingSections.length ? <span><CheckCircle2 size={14} strokeWidth={2} /> Scaffolding</span> : null}
              </div>

              <div className="student-exam-panel-actions">
                <button type="button" className="ghost" onClick={onBackToActivities}>Back</button>
                <button type="button" className="tool-btn green" onClick={startExam}>
                  <Play size={14} strokeWidth={2.2} />
                  Start Activity
                </button>
              </div>
            </section>

            <section className="student-exam-panel is-side">
              <div className="student-exam-panel-head">
                <span className="student-exam-panel-kicker">Assignment Summary</span>
                <h2>What the student will answer</h2>
              </div>

              <div className="student-exam-summary-grid">
                <div><span>Questions</span><strong>{questionSections.length}</strong></div>
                <div><span>Forms</span><strong>{formSections.length}</strong></div>
                <div><span>Scaffolding</span><strong>{scaffoldingSections.length}</strong></div>
                <div><span>Duration</span><strong>{examData.durationMinutes ?? 30} min</strong></div>
              </div>
            </section>
          </div>
        ) : null}

        {phase === 'active' ? (
          <div className="student-exam-grid">
            <section className="student-exam-panel student-exam-panel-main">
              <div className="student-exam-sticky-bar">
                <div className="student-exam-live-chip">
                  <ShieldCheck size={14} strokeWidth={2.1} />
                  Live monitored
                </div>
                <div className="student-exam-timer-chip">
                  <Clock3 size={14} strokeWidth={2.1} />
                  {formatRemainingTime(remainingSeconds)}
                </div>
              </div>

              {renderedReferenceImages.length ? (
                <section className="student-exam-reference-panel">
                  <div className="student-exam-panel-head">
                    <span className="student-exam-panel-kicker">Reference</span>
                    <h2>Assigned visual context</h2>
                  </div>
                  <div className="student-exam-reference-grid">
                    {renderedReferenceImages.map((image) => (
                      <div key={image.id ?? image.slotKey ?? image.previewUrl} className="student-exam-reference-card">
                        {image.previewUrl || image.src ? <img src={image.previewUrl ?? image.src} alt={image.label ?? 'Assigned reference'} /> : <ImageIcon size={24} strokeWidth={2} />}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {questionSections.length ? (
                <section className="student-exam-section">
                  <div className="student-exam-panel-head">
                    <span className="student-exam-panel-kicker">Question Block</span>
                    <h2>Main assigned questions</h2>
                  </div>
                  <div className="student-exam-question-list">
                    {questionSections.map((item) => (
                      <QuestionResponseCard
                        key={item.id}
                        item={item}
                        value={answers.questions[item.id] ?? ''}
                        onChange={(value) => updateQuestionAnswer(item.id, value)}
                        isMandatory
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {formSections.length ? (
                <section className="student-exam-section">
                  <div className="student-exam-panel-head">
                    <span className="student-exam-panel-kicker">Form Block</span>
                    <h2>Assigned form responses</h2>
                  </div>
                  <div className="student-exam-question-list">
                    {formSections.map((item) => (
                      <FormResponseCard
                        key={item.id}
                        item={item}
                        responses={answers.forms}
                        onChange={updateFormAnswer}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {scaffoldingSections.length ? (
                <section className="student-exam-section">
                  <div className="student-exam-panel-head">
                    <span className="student-exam-panel-kicker">Mandatory Scaffolding</span>
                    <h2>Complete every assigned support prompt</h2>
                    <p>Scaffolding is part of the graded student flow for this attempt.</p>
                  </div>
                  <div className="student-exam-question-list">
                    {scaffoldingSections.map((item) => (
                      <QuestionResponseCard
                        key={item.id}
                        item={item}
                        value={answers.scaffolding[item.id] ?? ''}
                        onChange={(value) => updateScaffoldingAnswer(item.id, value)}
                        isMandatory
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="student-exam-submit-bar">
                <div className="student-exam-submit-copy">
                  <strong>Submit when every mandatory answer is complete.</strong>
                  <span>{completedCount} of {totalRequiredCount} required responses are complete.</span>
                </div>
                <button type="button" className="tool-btn green" onClick={() => handleSubmit('manual')}>
                  Submit Activity
                </button>
              </div>
            </section>

            <aside className="student-exam-panel is-side">
              <div className="student-exam-panel-head">
                <span className="student-exam-panel-kicker">Proctoring</span>
                <h2>Live monitoring</h2>
              </div>

              <div className="student-exam-summary-grid">
                {proctoringSummary.map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>

              <div className="student-exam-log">
                <strong>Recent events</strong>
                <div className="student-exam-log-list">
                  {proctoringLog.length ? proctoringLog.map((entry) => (
                    <div key={entry.id}>
                      <span>{entry.time}</span>
                      <p>{entry.message}</p>
                    </div>
                  )) : (
                    <div>
                      <span>Live</span>
                      <p>No warnings recorded yet for this attempt.</p>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        {phase === 'submitted' ? (
          <section className="student-exam-panel student-exam-submitted">
            <div className="student-exam-submitted-icon">
              <CheckCircle2 size={26} strokeWidth={2.1} />
            </div>
            <div className="student-exam-panel-head">
              <span className="student-exam-panel-kicker">Submitted</span>
              <h2>Activity submitted successfully</h2>
              <p>{submittedAt ? `Submission recorded on ${submittedAt}.` : 'Submission recorded.'}</p>
            </div>

            <div className="student-exam-summary-grid">
              <div><span>Warnings</span><strong>{warningCount}</strong></div>
              <div><span>Tab switches</span><strong>{tabSwitchCount}</strong></div>
              <div><span>Fullscreen exits</span><strong>{fullscreenExitCount}</strong></div>
              <div><span>Completed</span><strong>{completedCount} / {totalRequiredCount}</strong></div>
            </div>

            <div className="student-exam-panel-actions">
              <button type="button" className="ghost" onClick={onBackToActivities}>Back to My Skill Activity</button>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  )
}
