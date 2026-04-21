import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Fingerprint,
  GraduationCap,
  HeartHandshake,
  Images,
  Image as ImageIcon,
  Microscope,
  Shapes,
  Play,
  SendHorizonal,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react'
import '../styles/student-exam.css'

const ANSWER_PLACEHOLDER = 'Enter Response'
const isGeneratedQuestionLabel = (value) => /^Q\d+$/i.test(String(value ?? '').trim())
const formatQuestionCountLabel = (label, count) => `${label} - ${count} Questions`
const getFormResponsePlaceholder = (responseIndex, responseCount) => (
  responseCount > 1 ? `${ANSWER_PLACEHOLDER} ${responseIndex + 1}` : ANSWER_PLACEHOLDER
)

const fallbackExam = {
  id: 'fallback-student-exam',
  title: 'Student Activity',
  type: 'Interpretation',
  createdDate: '08/04/2026',
  attemptCount: '0 / 1',
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
          placeholder: ANSWER_PLACEHOLDER,
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
          placeholder: ANSWER_PLACEHOLDER,
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

const normalizeDomainValue = (value) => value ?? 'Not Applicable'

const getAlphabetTag = (index) => String.fromCharCode(65 + (index % 26))

const normalizeReferenceImage = (image, index) => ({
  ...image,
  id: image?.id ?? image?.key ?? image?.src ?? image?.previewUrl ?? `reference-${index + 1}`,
  src: image?.src ?? image?.previewUrl ?? image?.url ?? '',
  label: image?.label ?? image?.title ?? `Image ${getAlphabetTag(index)}`,
  tag: image?.tag ?? getAlphabetTag(index),
})

const getItemTypeBadge = (section, item, activityType) => {
  if (section === 'form') return 'Form'
  if (section === 'scaffolding') return 'Scaffolding'
  return item.kind === 'MCQ' || item.kind === 'True or False' ? item.kind : activityType
}

const getItemTypeBadgeConfig = (label) => {
  const normalized = String(label ?? '').toLowerCase()

  if (normalized.includes('image')) return { tone: 'is-type-image', icon: Images }
  if (normalized.includes('interpretation')) return { tone: 'is-type-interpretation', icon: Stethoscope }
  if (normalized.includes('ospe')) return { tone: 'is-type-ospe', icon: Microscope }
  if (normalized.includes('osce')) return { tone: 'is-type-osce', icon: Stethoscope }
  if (normalized.includes('scaffolding')) return { tone: 'is-type-scaffolding', icon: Activity }
  if (normalized.includes('form')) return { tone: 'is-type-form', icon: Shapes }
  if (normalized.includes('mcq')) return { tone: 'is-type-question', icon: BookOpenCheck }
  if (normalized.includes('true or false')) return { tone: 'is-type-question', icon: BookOpenCheck }

  return { tone: 'is-type-question', icon: FileText }
}

const isActivityCertifiable = (activity) => Boolean(
  activity?.certifiable
  ?? activity?.isCertifiable
  ?? activity?.examData?.certifiable
  ?? activity?.examData?.isCertifiable
  ?? activity?.activityData?.activity?.certifiable
  ?? activity?.activityData?.activity?.isCertifiable
)

const getStudentExamContext = (resolved, examItems) => ({
  studentName:
    resolved.studentName
    ?? resolved.student?.name
    ?? resolved.assignedStudentName
    ?? resolved.assigneeName
    ?? 'Assigned Student',
  studentId:
    resolved.studentId
    ?? resolved.student?.id
    ?? resolved.assignedStudentId
    ?? resolved.registrationNumber
    ?? 'MC2568',
  year:
    resolved.year
    ?? resolved.student?.year
    ?? resolved.targetYear
    ?? resolved.assigningYear
    ?? 'First Year',
  sgt:
    resolved.sgt
    ?? resolved.student?.sgt
    ?? resolved.targetSgt
    ?? resolved.assigningSgt
    ?? 'SGT A',
  questionCount: examItems.length,
})

const getAssignedSections = (assignment) => {
  const resolved = assignment ?? fallbackExam
  const examData = resolved.examData ?? fallbackExam.examData
  const assignContent = examData.assignContent ?? { question: true, form: false, scaffolding: false }
  const modules = examData.modules ?? {}
  const normalizedReferenceImages = (modules.referenceImages ?? []).map(normalizeReferenceImage)
  const isImageActivity = String(resolved.type ?? '').trim().toLowerCase() === 'image'

  const questionSections = assignContent.question
    ? (modules.questions ?? []).map((question, index) => ({
        id: question.id ?? `question-${index + 1}`,
        section: 'question',
        kind: question.type ?? 'Descriptive',
        title: question.title ?? '',
        prompt: normalizePrompt(question.questionText ?? question.prompt, 'Add the main question prompt here.'),
        marks: question.marks ?? '1',
        placeholder: ANSWER_PLACEHOLDER,
        options: question.options ?? [],
        domain: question.domain ?? 'Cognitive',
        cognitive: normalizeDomainValue(question.cognitive ?? (question.domain === 'Cognitive' ? question.domain : undefined)),
        affective: normalizeDomainValue(question.affective),
        psychomotor: normalizeDomainValue(question.psychomotor),
        isCritical: Boolean(question.isCritical),
        tags: question.tags ?? [],
        imageQuestionTag: isImageActivity ? getAlphabetTag(index) : '',
        referenceImages: isImageActivity
          ? ((question.referenceImages ?? question.images ?? []).length
              ? (question.referenceImages ?? question.images).map(normalizeReferenceImage)
              : normalizedReferenceImages)
          : [],
      }))
    : []

  const formSections = assignContent.form
    ? (modules.form ?? []).map((item, index) => ({
        id: item.id ?? `form-${index + 1}`,
        section: 'form',
        kind: item.formType ?? 'single',
        title: item.title ?? '',
        prompt: normalizePrompt(item.questionText ?? item.prompt, 'Add the form prompt here.'),
        marks: item.marks ?? '1',
        responses: (item.responses ?? []).map((response, responseIndex, responses) => ({
          id: response.key ?? `${item.id ?? 'form'}-response-${responseIndex + 1}`,
          label: response.label ?? `Response ${responseIndex + 1}`,
          placeholder: getFormResponsePlaceholder(responseIndex, responses.length),
        })),
        domain: item.domain ?? 'Psychomotor',
        cognitive: normalizeDomainValue(item.cognitive),
        affective: normalizeDomainValue(item.affective),
        psychomotor: normalizeDomainValue(item.psychomotor ?? (item.domain === 'Psychomotor' ? item.domain : undefined)),
        isCritical: Boolean(item.isCritical),
        tags: item.tags ?? [],
      }))
    : []

  const scaffoldingSections = assignContent.scaffolding
    ? (modules.scaffolding ?? []).map((question, index) => ({
        id: question.id ?? `scaffold-${index + 1}`,
        section: 'scaffolding',
        kind: question.type ?? 'Descriptive',
        title: question.title ?? '',
        prompt: normalizePrompt(question.questionText ?? question.prompt, 'Add the scaffolding prompt here.'),
        marks: question.marks ?? '1',
        placeholder: ANSWER_PLACEHOLDER,
        options: question.options ?? [],
        domain: question.domain ?? 'Cognitive',
        cognitive: normalizeDomainValue(question.cognitive ?? (question.domain === 'Cognitive' ? question.domain : undefined)),
        affective: normalizeDomainValue(question.affective),
        psychomotor: normalizeDomainValue(question.psychomotor),
        isCritical: Boolean(question.isCritical),
        tags: question.tags ?? [],
      }))
    : []

  return {
    resolved,
    examData,
    referenceImages: normalizedReferenceImages,
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
}) {
  const isChoice = item.kind === 'MCQ' || item.kind === 'True or False'
  const options = item.kind === 'True or False' && item.options.length === 0 ? ['True', 'False'] : item.options
  const isImageQuestion = String(activityType ?? '').trim().toLowerCase() === 'image' && item.section === 'question'
  const badges = [
    { label: `COG ${item.cognitive ?? 'Not Applicable'}`, tone: 'is-domain-cognitive' },
    { label: `AFF ${item.affective ?? 'Not Applicable'}`, tone: 'is-domain-affective' },
    { label: `PSY ${item.psychomotor ?? 'Not Applicable'}`, tone: 'is-domain-psychomotor' },
    ...(item.isCritical ? [{ label: 'Criticality', tone: 'is-critical', icon: AlertTriangle }] : []),
    { label: `${item.marks} Mark${String(item.marks) === '1' ? '' : 's'}`, tone: 'is-marks', icon: BadgeCheck },
    ...(item.tags ?? []).map((tag) => ({ label: tag, tone: 'is-tag' })),
  ]

  return (
    <article className={`student-exam-question-stage ${item.isCritical ? 'is-critical' : ''}`}>
      <div className="student-exam-question-top">
        <div className="student-exam-badge-row">
          {badges.map((badge) => (
            <span key={`${item.id}-${badge.label}`} className={`student-exam-badge ${badge.tone ?? ''}`}>
              {badge.icon ? <badge.icon size={12} strokeWidth={2} /> : null}
              {badge.label}
            </span>
          ))}
        </div>
        <div className="student-exam-question-copy">
          <h2>{item.prompt}</h2>
        </div>
      </div>

      {isImageQuestion && referenceImages.length ? (
        <div className="student-exam-stage-media">
          {referenceImages.map((image, imageIndex) => (
            <figure key={image.id ?? image.src} className="student-exam-stage-media-card">
              {image.previewUrl || image.src ? (
                <img src={image.previewUrl ?? image.src} alt={image.label ?? 'Assigned reference'} />
              ) : (
                <ImageIcon size={24} strokeWidth={2} />
              )}
              <figcaption>
                <span>{image.tag ?? getAlphabetTag(imageIndex)}</span>
                {image.label ?? `Image ${getAlphabetTag(imageIndex)}`}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}

      {item.section === 'form' ? (
        <div className="student-exam-form-stack">
          {item.responses.map((response) => (
            <label key={response.id} className="student-exam-field">
              {isGeneratedQuestionLabel(response.label) ? null : <span>{response.label}</span>}
              <input
                aria-label={response.label || ANSWER_PLACEHOLDER}
                value={formValues[response.id] ?? ''}
                onChange={(event) => onChangeForm(response.id, event.target.value)}
                placeholder={response.placeholder}
              />
            </label>
          ))}
        </div>
      ) : isChoice && options.length ? (
        <div className="student-exam-choice-grid" role="radiogroup" aria-label={item.prompt}>
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

export default function StudentExamPage({ assignment, onBackToActivities, onSubmitExam, onAlert, onRecordExamLog }) {
  const sections = useMemo(() => getAssignedSections(assignment), [assignment])
  const { resolved, examData, examItems } = sections
  const examContext = useMemo(() => getStudentExamContext(resolved, examItems), [resolved, examItems])
  const isMarksDisabled = String(resolved?.marks ?? assignment?.marks ?? '').trim().toLowerCase() === 'nil'
  const isCertifiableActivity = isActivityCertifiable(resolved) || isActivityCertifiable(assignment)
  const hasTimer = false
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

  const appendProctoringEvent = ({ message, eventType = 'Info', severity = 'info', detail = message }) => {
    const now = new Date()

    setProctoringLog((current) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, message, time: now.toLocaleTimeString('en-GB') },
      ...current,
    ].slice(0, 10))

    onRecordExamLog?.({
      activityId: resolved.id ?? assignment?.id ?? 'unknown-activity',
      activityName: resolved.title ?? assignment?.title ?? 'Student Activity',
      activityType: resolved.type ?? assignment?.type ?? 'Activity',
      studentId: examContext.studentId,
      studentName: examContext.studentName,
      eventType,
      detail,
      severity,
      timestamp: now.toISOString(),
      status: phase === 'submitted' ? 'Completed' : 'Live',
    })
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
      appendProctoringEvent({
        message,
        eventType: counter === 'fullscreen' ? 'Full Screen Exit' : 'Tab Switch',
        severity: 'warning',
        detail: message,
      })
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

    const handleOffline = () => {
      appendProctoringEvent({
        message: 'Network connection was lost during the exam.',
        eventType: 'Network Issue',
        severity: 'warning',
        detail: 'Device went offline during the monitored exam.',
      })
      onAlert?.({ tone: 'warning', message: 'Network connection lost. The event has been recorded.' })
    }

    const handleOnline = () => {
      appendProctoringEvent({
        message: 'Network connection was restored.',
        eventType: 'Reconnected',
        severity: 'info',
        detail: 'Device reconnected to the network during the monitored exam.',
      })
    }

    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [examData.proctoring?.fullscreenRequired, onAlert, phase])

  const startExam = async () => {
    if (isMarksDisabled) {
      onAlert?.({ tone: 'warning', message: 'This activity is unavailable because marks are disabled.' })
      return
    }

    if (examData.proctoring?.fullscreenRequired && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
      } catch {
        onAlert?.({ tone: 'warning', message: 'Fullscreen could not be enabled. Monitoring will continue.' })
      }
    }

    appendProctoringEvent({
      message: 'Exam started with online monitoring active.',
      eventType: 'Exam Started',
      severity: 'info',
      detail: 'Student started the monitored exam session.',
    })
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

    appendProctoringEvent({
      message: 'Exam resumed after monitoring interruption.',
      eventType: 'Exam Resumed',
      severity: 'info',
      detail: 'Student resumed the exam after a monitoring pause.',
    })
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
    if (isMarksDisabled) return
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

    appendProctoringEvent({
      message: reason === 'timeout' ? 'Activity was auto-submitted.' : 'Activity submitted successfully.',
      eventType: reason === 'timeout' ? 'Auto Submitted' : 'Exam Submitted',
      severity: reason === 'timeout' ? 'warning' : 'success',
      detail: reason === 'timeout'
        ? 'Exam was automatically submitted when the timer ended.'
        : 'Student completed and submitted the exam.',
    })

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

    onBackToActivities?.()
  }

  const sessionTypeConfig = getItemTypeBadgeConfig(resolved.type ?? 'Activity')
  const summaryItems = [
    { label: 'Assessment Type', value: resolved.type ?? 'Activity', icon: Shapes },
    { label: 'Questions', value: String(examItems.length), icon: FileText },
    { label: 'Marks', value: examItems.reduce((total, item) => total + (Number(item.marks) || 0), 0) || 'Nil', icon: BadgeCheck },
    { label: 'Duration', value: hasTimer ? `${examData.durationMinutes} min` : 'Flexible', icon: Clock3 },
    { label: 'Attempt', value: resolved.attemptCount ?? '0 / 1', icon: Activity },
    { label: 'Assigned On', value: resolved.createdDate ?? 'Not set', icon: CalendarDays },
  ]
  const instructionItems = [
    'Read each question fully before answering.',
    'Stay on this page during the monitored attempt.',
    hasTimer ? 'Your activity will auto-submit when the timer ends.' : 'Submit the activity only after reviewing all answers.',
    examData.proctoring?.fullscreenRequired
      ? 'Fullscreen is required for this monitored attempt.'
      : 'Keep the activity window active until submission.',
  ]
  const activityQuestionCount = sections.questionSections.length || examItems.length
  const activityQuestionBadge = formatQuestionCountLabel(resolved.type ?? 'Activity', activityQuestionCount)
  const shouldShowActivityQuestionBadge = !['osce', 'ospe'].includes(String(resolved.type ?? '').trim().toLowerCase())
  const prestartBadges = [
    ...(activityQuestionCount && shouldShowActivityQuestionBadge
      ? [{ label: activityQuestionBadge, tone: `${sessionTypeConfig.tone} is-activity-count`, icon: sessionTypeConfig.icon }]
      : []),
    ...(sections.formSections.length
      ? [{ label: formatQuestionCountLabel('Forms', sections.formSections.length), tone: 'is-form', icon: Shapes }]
      : []),
    ...(sections.scaffoldingSections.length
      ? [{ label: formatQuestionCountLabel('Scaffolding', sections.scaffoldingSections.length), tone: 'is-scaffolding', icon: Activity }]
      : []),
    ...(isMarksDisabled ? [{ label: 'Marks Disabled', tone: 'is-critical', icon: AlertTriangle }] : []),
    ...(isCertifiableActivity ? [{ label: 'Certifiable', tone: 'is-certifiable', icon: BadgeCheck }] : []),
    ...(hasTimer ? [{ label: `${examData.durationMinutes} min`, tone: 'is-duration', icon: Clock3 }] : []),
  ]

  return (
    <section className="student-exam-page">
      <div className="student-exam-shell">
        {phase === 'prestart' ? (
          <section className="student-exam-entry">
            <div className="student-exam-entry-copy">
              <button type="button" className="student-exam-back-link" onClick={onBackToActivities}>
                <ArrowLeft size={15} strokeWidth={2.2} />
                Back to My Skills
              </button>
              <span className="student-exam-kicker is-briefing">
                <Eye size={12} strokeWidth={2.1} />
                Assessment Briefing
              </span>
              <h1>{resolved.title}</h1>
              <p>Review the activity details, rules, and timing below before you begin this monitored student attempt.</p>
              <div className="student-exam-badge-row student-exam-summary-badges">
                {prestartBadges.map((badge) => {
                  const BadgeIcon = badge.icon
                  return (
                    <span key={badge.label} className={`student-exam-badge ${badge.tone}`}>
                      <BadgeIcon size={12} strokeWidth={2} />
                      {badge.label}
                    </span>
                  )
                })}
              </div>
              <div className="student-exam-summary-grid">
                {summaryItems.map((item) => (
                  <article key={item.label} className="student-exam-summary-card">
                    <span>
                      <item.icon size={14} strokeWidth={2} />
                      {item.label}
                    </span>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </div>
            </div>

            <div className="student-exam-entry-side">
              <div className="student-exam-entry-panel">
                <div className="student-exam-entry-panel-head">
                  <span className="student-exam-panel-kicker">Before You Start</span>
                  <strong>Instruction</strong>
                </div>
                <div className="student-exam-entry-rule">
                  <ShieldCheck size={18} strokeWidth={2.1} />
                  <span>Online proctoring is active for this attempt.</span>
                </div>
                <div className="student-exam-entry-rule">
                  <Clock3 size={18} strokeWidth={2.1} />
                  <span>{hasTimer ? 'Auto-submit will run when the timer reaches zero.' : 'No timer is configured, but your monitoring rules still apply.'}</span>
                </div>
                <div className="student-exam-entry-rule">
                  <AlertTriangle size={18} strokeWidth={2.1} />
                  <span>Tab switches and fullscreen exits are recorded.</span>
                </div>
                {isMarksDisabled ? (
                  <div className="student-exam-entry-rule">
                    <AlertTriangle size={18} strokeWidth={2.1} />
                    <span>This activity is disabled because marks were turned off during activity creation.</span>
                  </div>
                ) : null}
                <div className="student-exam-instruction-list">
                  {(isMarksDisabled
                    ? ['This activity is locked for students until marks are enabled for the assigned activity.']
                    : instructionItems).map((instruction) => (
                    <div key={instruction} className="student-exam-instruction-item">
                      <span className="student-exam-instruction-dot" aria-hidden="true" />
                      <span>{instruction}</span>
                    </div>
                  ))}
                </div>
                <button type="button" className="student-exam-primary-btn" onClick={startExam} disabled={isMarksDisabled}>
                  <Play size={16} strokeWidth={2.2} />
                  {isMarksDisabled ? 'Activity Disabled' : 'Start Activity'}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {phase === 'active' && currentItem ? (
          <div className="student-exam-stage">
            <section className="student-exam-session-banner">
              <div className="student-exam-session-banner-copy">
                <span className="student-exam-kicker">Live Exam Session</span>
                <h1>{resolved.title}</h1>
                <p>Monitored student attempt in progress. Review the active session details before continuing the response flow.</p>
                <div className="student-exam-session-banner-tags">
                  <span className={`student-exam-badge ${sessionTypeConfig.tone}`}>
                    <sessionTypeConfig.icon size={12} strokeWidth={2} />
                    {resolved.type ?? 'Activity'}
                  </span>
                  {isCertifiableActivity ? (
                    <span className="student-exam-badge is-certifiable">
                      <BadgeCheck size={12} strokeWidth={2} />
                      Certifiable
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="student-exam-session-banner-grid">
                <article className="student-exam-session-tile">
                  <span>
                    <UserRound size={13} strokeWidth={2} />
                    Student Name
                  </span>
                  <strong>{examContext.studentName}</strong>
                </article>
                <article className="student-exam-session-tile">
                  <span>
                    <Fingerprint size={13} strokeWidth={2} />
                    Student ID
                  </span>
                  <strong>{examContext.studentId}</strong>
                </article>
                <article className="student-exam-session-tile">
                  <span>
                    <GraduationCap size={13} strokeWidth={2} />
                    Year
                  </span>
                  <strong>{examContext.year}</strong>
                </article>
                <article className="student-exam-session-tile">
                  <span>
                    <Users size={13} strokeWidth={2} />
                    SGT
                  </span>
                  <strong>{examContext.sgt}</strong>
                </article>
              </div>

              <div className="student-exam-session-banner-status">
                <span className="student-exam-status-pill is-live-monitoring">
                  <span className="student-exam-live-dot" aria-hidden="true" />
                  Live Monitoring
                </span>
                {hasTimer ? (
                  <span className="student-exam-status-pill">
                    <Clock3 size={14} strokeWidth={2.1} />
                    {formatRemainingTime(remainingSeconds)}
                  </span>
                ) : null}
              </div>
            </section>

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
                referenceImages={currentItem.referenceImages ?? []}
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
