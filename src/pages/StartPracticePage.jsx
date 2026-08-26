import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, BookOpenCheck, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Info, Play, Timer, Trophy } from 'lucide-react'
import { APP_PAGES } from '../config/appPages'
import './StartPracticePage.css'

const START_PRACTICE_SELECTED_CARD_KEY = 'vx-start-practice-selected-card'
const PRACTICE_EVALUATION_DURATION_MS = 10000
const PRACTICE_TIMEOUT_NOTICE_MS = 2500
const QUESTION_BANK_STORAGE_KEYS = [
  'vx-question-bank-published-questions',
  'vx-question-bank-uploaded-questions',
  'vx-question-bank-questions',
]

const readQuestionBankQuestionMap = () => {
  if (typeof window === 'undefined') return new Map()

  return QUESTION_BANK_STORAGE_KEYS.reduce((questionMap, storageKey) => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
      if (!Array.isArray(parsed)) return questionMap

      parsed.forEach((question) => {
        const id = String(question?.id ?? question?.originalQuestionId ?? '').trim()
        if (id && !questionMap.has(id)) questionMap.set(id, question)
      })
    } catch {
      // Ignore malformed question-bank storage and keep the shared-card payload usable.
    }

    return questionMap
  }, new Map())
}

const hydratePracticeQuestion = (question = {}, questionMap = new Map()) => {
  const questionId = String(question?.id ?? question?.originalQuestionId ?? '').trim()
  const sourceQuestion = questionMap.get(questionId) ?? {}
  const sourceSections = Array.isArray(sourceQuestion.descriptiveSections) ? sourceQuestion.descriptiveSections : []
  const sharedSections = Array.isArray(question.descriptiveSections) ? question.descriptiveSections : []
  const sourceSubQuestions = Array.isArray(sourceQuestion.subQuestions) ? sourceQuestion.subQuestions : []
  const sharedSubQuestions = Array.isArray(question.subQuestions) ? question.subQuestions : []

  return {
    ...sourceQuestion,
    ...question,
    questionText: question.questionText || sourceQuestion.questionText || question.title || sourceQuestion.title || sourceQuestion.stem,
    title: question.title || sourceQuestion.title || sourceQuestion.questionText || sourceQuestion.stem,
    type: question.type || sourceQuestion.type,
    marks: question.marks ?? sourceQuestion.marks ?? '',
    options: Array.isArray(question.options) && question.options.length ? question.options : sourceQuestion.options,
    descriptiveSections: sharedSections.length ? sharedSections : sourceSections,
    subQuestions: sharedSubQuestions.length ? sharedSubQuestions : sourceSubQuestions,
  }
}

const hydratePracticeCard = (card) => {
  if (!card || typeof card !== 'object') return card
  const questionMap = readQuestionBankQuestionMap()
  const hydrateQuestions = (questions = []) => (
    Array.isArray(questions) ? questions.map((question) => hydratePracticeQuestion(question, questionMap)) : []
  )

  return {
    ...card,
    questions: hydrateQuestions(card.questions),
    practiceSessions: Array.isArray(card.practiceSessions)
      ? card.practiceSessions.map((session) => ({
          ...session,
          questions: hydrateQuestions(session.questions),
        }))
      : card.practiceSessions,
  }
}

const readSelectedPracticeCard = () => {
  if (typeof window === 'undefined') return null

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(START_PRACTICE_SELECTED_CARD_KEY) ?? 'null')
    return parsed && typeof parsed === 'object' ? hydratePracticeCard(parsed) : null
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

const stripHtml = (value = '') => String(value ?? '')
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<\/(p|div|span|li|h[1-6])>/gi, ' ')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim()

const getQuestionText = (question = {}) => (
  stripHtml(question.questionText
  || question.title
  || question.stem
  || question.prompt
  || 'Practice question')
)

const getAnswerText = (question = {}) => (
  stripHtml(question.answerKey
  || question.modelAnswer
  || question.rationale
  || question.explanation
  || 'Answer guidance will appear here.')
)

const cleanRevealAnswerText = (value = '') => (
  stripHtml(value).replace(/^correct\s+answer\s*:\s*/i, '').trim()
)

const parseMarksValue = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const match = String(value ?? '').match(/\d+(\.\d+)?/)
  return match ? Number(match[0]) : 0
}

const getQuestionMarks = (question = {}) => {
  const directMarks = [
    question.marks,
    question.mark,
    question.totalMarks,
    question.maximumMarks,
    question.marksText,
  ].map(parseMarksValue).find((marks) => marks > 0)

  if (directMarks) return directMarks

  const sectionMarks = Array.isArray(question.descriptiveSections)
    ? question.descriptiveSections.reduce((total, section) => total + parseMarksValue(section?.marks), 0)
    : 0

  if (sectionMarks > 0) return sectionMarks

  const type = getQuestionType(question)
  if (type === 'MCQ') return 1
  if (type === 'SAQs') return 8
  if (type === 'LAQs') return 10
  return 0
}

const getQuestionKey = (question = {}, index = 0) => String(question.id ?? question.questionId ?? `practice-question-${index}`)

const getQuestionOptions = (question = {}) => {
  const optionSources = [
    question.options,
    question.choices,
    question.answerOptions,
    question.mcqOptions,
    question.answers,
  ]
  const arrayOptions = optionSources.find((source) => Array.isArray(source) && source.length)
  if (arrayOptions) return arrayOptions

  return [
    question.optionA,
    question.optionB,
    question.optionC,
    question.optionD,
    question.optionE,
    question.a,
    question.b,
    question.c,
    question.d,
    question.e,
  ].filter((option) => option !== undefined && option !== null && String(option).trim())
}

const getFallbackMcqOptions = () => [
  'Option A',
  'Option B',
  'Option C',
  'Option D',
]

const getOptionText = (option) => {
  if (typeof option === 'string' || typeof option === 'number') return stripHtml(option)
  return stripHtml(option?.text ?? option?.label ?? option?.value ?? 'Option')
}

const normalizeAnswerValue = (value) => stripHtml(value).toLowerCase().replace(/[^a-z0-9]+/g, '')

const isOptionMarkedCorrect = (option = {}) => {
  if (!option || typeof option !== 'object') return false
  return Boolean(option.isCorrect || option.correct || option.isAnswer || option.answer === true || option.is_correct)
}

const getMcqCorrectOptionKey = (question = {}, options = []) => {
  const flaggedIndex = options.findIndex(isOptionMarkedCorrect)
  if (flaggedIndex >= 0) {
    const option = options[flaggedIndex]
    return String(option.id ?? option.value ?? getOptionText(option) ?? flaggedIndex)
  }

  const rawAnswer = [
    question.correctOption,
    question.correctAnswer,
    question.correctAnswerId,
    question.answerKey,
    question.answer,
    question.correct,
  ].find((value) => value !== undefined && value !== null && String(value).trim())

  if (!rawAnswer) {
    const firstFlaggedOrOption = options[0]
    return firstFlaggedOrOption !== undefined ? String(firstFlaggedOrOption.id ?? firstFlaggedOrOption.value ?? getOptionText(firstFlaggedOrOption) ?? 0) : ''
  }

  const answer = stripHtml(rawAnswer)
  const answerLetter = answer.trim().match(/^[A-E]$/i)?.[0]?.toUpperCase()
  if (answerLetter) {
    const optionIndex = answerLetter.charCodeAt(0) - 65
    const option = options[optionIndex]
    return option !== undefined ? String(option.id ?? option.value ?? getOptionText(option) ?? optionIndex) : ''
  }

  const normalizedAnswer = normalizeAnswerValue(answer)
  const matchedIndex = options.findIndex((option, index) => {
    const optionKey = String(option?.id ?? option?.value ?? getOptionText(option) ?? index)
    const optionLetter = String.fromCharCode(65 + index)
    const normalizedOptionText = normalizeAnswerValue(getOptionText(option))
    return [
      optionKey,
      getOptionText(option),
      optionLetter,
      `${optionLetter}. ${getOptionText(option)}`,
    ].some((candidate) => normalizeAnswerValue(candidate) === normalizedAnswer)
      || (normalizedOptionText && normalizedAnswer.includes(normalizedOptionText))
  })

  if (matchedIndex < 0) return ''
  const option = options[matchedIndex]
  return String(option.id ?? option.value ?? getOptionText(option) ?? matchedIndex)
}

const getOptionComparableValues = (option, index = 0) => {
  const optionText = getOptionText(option)
  const optionLetter = String.fromCharCode(65 + index)
  return [
    option?.id,
    option?.value,
    optionText,
    optionLetter,
    `${optionLetter}. ${optionText}`,
    index,
    String(index + 1),
  ].filter((value) => value !== undefined && value !== null && String(value).trim())
}

const findOptionIndexByAnswer = (answer, options = []) => {
  const normalizedAnswer = normalizeAnswerValue(answer)
  if (!normalizedAnswer) return -1
  return options.findIndex((option, index) => (
    getOptionComparableValues(option, index).some((value) => {
      const normalizedValue = normalizeAnswerValue(value)
      return normalizedValue === normalizedAnswer
        || (normalizedValue.length > 8 && normalizedAnswer.includes(normalizedValue))
        || (normalizedAnswer.length > 8 && normalizedValue.includes(normalizedAnswer))
    })
  ))
}

const getReviewStatus = (question = {}, selectedAnswer, options = []) => {
  if (getQuestionType(question) !== 'MCQ') return 'Needs review'
  const correctKey = getMcqCorrectOptionKey(question, options)
  if (!correctKey) return 'Wrong'
  const selectedIndex = findOptionIndexByAnswer(selectedAnswer, options)
  const correctIndex = findOptionIndexByAnswer(correctKey, options)
  return selectedIndex >= 0 && selectedIndex === correctIndex ? 'Correct' : 'Wrong'
}

const REVIEW_STOP_WORDS = new Set([
  'about',
  'after',
  'answer',
  'because',
  'between',
  'clinical',
  'correct',
  'describe',
  'explain',
  'features',
  'include',
  'patient',
  'question',
  'relevant',
  'should',
  'their',
  'there',
  'these',
  'those',
  'undergoing',
  'using',
  'with',
  'within',
])

const getReviewTerms = (value = '') => {
  const words = stripHtml(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3 && !REVIEW_STOP_WORDS.has(word))

  return [...new Set(words)].slice(0, 18)
}

const evaluateDescriptiveAnswer = (answer = '', modelAnswer = '', marks = 0) => {
  const maxMarks = Number(marks) || 0
  const answerText = stripHtml(answer)
  if (!answerText) {
    return { status: 'Wrong', earnedMarks: 0, maxMarks, ratio: 0 }
  }

  const modelTerms = getReviewTerms(modelAnswer)
  if (!modelTerms.length) {
    return { status: 'Needs review', earnedMarks: Math.max(1, Math.round(maxMarks * 0.5)), maxMarks, ratio: 0.5 }
  }

  const normalizedAnswer = normalizeAnswerValue(answerText)
  const matchedTerms = modelTerms.filter((term) => normalizedAnswer.includes(normalizeAnswerValue(term)))
  const ratio = matchedTerms.length / modelTerms.length
  const earnedMarks = Math.min(maxMarks, Math.max(0, Math.round(maxMarks * ratio)))
  const status = ratio >= 0.72 ? 'Correct' : ratio > 0 ? 'Needs review' : 'Wrong'

  return { status, earnedMarks, maxMarks, ratio }
}

const getReviewClassName = (status = '') => `is-review-${status.toLowerCase().replace(/\s+/g, '-')}`

const evaluateQuestionReview = (question = {}, answer, options = [], marks = 0) => {
  const type = getQuestionType(question)
  const maxMarks = Number(marks) || getQuestionMarks(question)
  if (type === 'MCQ') {
    const correctKey = getMcqCorrectOptionKey(question, options)
    if (!correctKey) return { status: 'Wrong', earnedMarks: 0, maxMarks, correctKey }
    const selectedIndex = findOptionIndexByAnswer(answer, options)
    const correctIndex = findOptionIndexByAnswer(correctKey, options)
    const isCorrect = selectedIndex >= 0 && selectedIndex === correctIndex
    return { status: isCorrect ? 'Correct' : 'Wrong', earnedMarks: isCorrect ? maxMarks : 0, maxMarks, correctKey }
  }

  return evaluateDescriptiveAnswer(answer, getAnswerText(question), maxMarks)
}

const getSectionMeta = (type) => {
  if (type === 'MCQ') return { key: 'mcq', title: 'Multiple Choice Questions (MCQ)', label: 'Multiple Choice Questions (MCQ)', numeral: 'I.', accent: 'mcq' }
  if (type === 'SAQs') return { key: 'saqs', title: 'Short Answer Questions (SAQs)', label: 'Short Answer Questions (SAQs)', numeral: 'II.', accent: 'saq' }
  if (type === 'LAQs') return { key: 'laqs', title: 'Long Answer Questions (LAQs)', label: 'Long Answer Questions (LAQs)', numeral: 'III.', accent: 'laq' }
  return { key: 'practice', title: 'Practice Questions', label: 'Practice', numeral: '', accent: 'practice' }
}

const getDescriptiveParts = (question = {}, questionKey = '') => {
  const sections = Array.isArray(question.descriptiveSections) && question.descriptiveSections.length
    ? question.descriptiveSections
    : Array.isArray(question.subQuestions) ? question.subQuestions : []
  const parentMarks = getQuestionMarks(question)

  if (!sections.length) {
    const fallbackPartCount = parentMarks >= 10 ? 2 : 1
    const fallbackPartMarks = fallbackPartCount > 1 ? parentMarks / fallbackPartCount : parentMarks
    return Array.from({ length: fallbackPartCount }, (_, index) => ({
      key: fallbackPartCount === 1 ? questionKey : `${questionKey}-part-${index}`,
      label: String.fromCharCode(97 + index),
      text: getQuestionText(question),
      marks: fallbackPartMarks,
    }))
  }

  return sections.flatMap((section, sectionIndex) => {
    const children = Array.isArray(section.children) ? section.children : []
    if (children.length) {
      return children.map((child, childIndex) => ({
        key: String(child.id ?? `${questionKey}-part-${sectionIndex}-${childIndex}`),
        label: String.fromCharCode(97 + childIndex),
        text: getQuestionText(child),
        marks: getQuestionMarks(child) || (children.length === 1 ? parentMarks : 0),
      }))
    }

    return [{
      key: String(section.id ?? `${questionKey}-part-${sectionIndex}`),
      label: String.fromCharCode(97 + sectionIndex),
      text: getQuestionText(section),
      marks: getQuestionMarks(section) || (sections.length === 1 ? parentMarks : 0),
    }]
  })
}

const getQuestionAnswerKeys = (question = {}, index = 0) => {
  const questionKey = getQuestionKey(question, index)
  const type = getQuestionType(question)
  const hasDescriptiveParts = Array.isArray(question.descriptiveSections) && question.descriptiveSections.length
  const parts = type === 'LAQs' || (type === 'SAQs' && hasDescriptiveParts) ? getDescriptiveParts(question, questionKey) : []
  return parts.length ? parts.map((part) => part.key) : [questionKey]
}

const buildQuestionSections = (questions = []) => {
  const grouped = questions.reduce((accumulator, question, index) => {
    const type = getQuestionType(question)
    const meta = getSectionMeta(type)
    const item = {
      question,
      index,
      key: getQuestionKey(question, index),
      type,
      marks: getQuestionMarks(question),
    }

    return {
      ...accumulator,
      [meta.key]: [...(accumulator[meta.key] ?? []), item],
    }
  }, {})

  return ['MCQ', 'SAQs', 'LAQs', 'Practice']
    .map(getSectionMeta)
    .map((meta) => ({
      ...meta,
      items: grouped[meta.key] ?? [],
      marks: (grouped[meta.key] ?? []).reduce((total, item) => total + item.marks, 0),
    }))
    .filter((section) => section.items.length)
}

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

function StartPracticePage({ onNavigate, onPracticeAnswerModeChange }) {
  const [selectedCard] = useState(() => readSelectedPracticeCard())
  const [mode, setMode] = useState('sessions')
  const [activeIndex, setActiveIndex] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [sessionStatuses, setSessionStatuses] = useState({})
  const practiceRows = useMemo(() => getPracticeRows(selectedCard, now).map((row) => ({
    ...row,
    status: sessionStatuses[row.id] || row.status,
  })), [now, selectedCard, sessionStatuses])
  const [sessionFilter, setSessionFilter] = useState('all')
  const [answers, setAnswers] = useState({})
  const [tryLaterQuestions, setTryLaterQuestions] = useState(() => new Set())
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [timedOutSessionId, setTimedOutSessionId] = useState('')
  const [showTimeCompletedNotice, setShowTimeCompletedNotice] = useState(false)
  const [isEvaluatingPractice, setIsEvaluatingPractice] = useState(false)
  const [evaluationStartedAt, setEvaluationStartedAt] = useState(0)
  const [evaluationProgress, setEvaluationProgress] = useState(0)
  const [isPracticeSubmitted, setIsPracticeSubmitted] = useState(false)
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
  const questionSections = useMemo(() => buildQuestionSections(questions), [questions])
  const orderedQuestionItems = useMemo(() => questionSections.flatMap((section) => section.items), [questionSections])
  const activeOrderedIndex = Math.max(0, orderedQuestionItems.findIndex((item) => item.index === activeIndex))
  const totalMarks = useMemo(() => questions.reduce((total, question) => total + getQuestionMarks(question), 0), [questions])
  const typeCounts = useMemo(() => questions.reduce((counts, question) => {
    const type = getQuestionType(question)
    return {
      ...counts,
      mcq: counts.mcq + (type === 'MCQ' ? 1 : 0),
      saqs: counts.saqs + (type === 'SAQs' ? 1 : 0),
      laqs: counts.laqs + (type === 'LAQs' ? 1 : 0),
    }
  }, { mcq: 0, saqs: 0, laqs: 0 }), [questions])
  const answeredCount = useMemo(() => questions.filter((question, index) => {
    const keys = getQuestionAnswerKeys(question, index)
    return keys.some((key) => {
      const answer = answers[key]
      return Array.isArray(answer) ? answer.length > 0 : Boolean(String(answer ?? '').trim())
    })
  }).length, [answers, questions])
  const competencyName = selectedCard?.competencyName || `Competency ${selectedCard?.competencyCode ?? ''}`
  const activeSessionTimeoutKey = activeSession?.id ?? ''
  const activeSessionCountdown = activeSession?.countdown ?? ''
  const activeSessionType = activeSession?.type ?? ''

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    onPracticeAnswerModeChange?.(mode === 'player')
    return () => onPracticeAnswerModeChange?.(false)
  }, [mode, onPracticeAnswerModeChange])

  useEffect(() => {
    if (!showSubmitConfirm) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowSubmitConfirm(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSubmitConfirm])

  useEffect(() => {
    if (!isEvaluatingPractice || !evaluationStartedAt) return undefined

    const updateProgress = () => {
      const elapsed = Date.now() - evaluationStartedAt
      const nextProgress = Math.min(100, Math.round((elapsed / PRACTICE_EVALUATION_DURATION_MS) * 100))
      setEvaluationProgress(nextProgress)

      if (elapsed >= PRACTICE_EVALUATION_DURATION_MS) {
        setIsEvaluatingPractice(false)
        setIsPracticeSubmitted(true)
        setEvaluationStartedAt(0)
        if (activeSessionTimeoutKey) {
          setSessionStatuses((current) => ({ ...current, [activeSessionTimeoutKey]: 'Completed' }))
        }
      }
    }

    updateProgress()
    const timer = window.setInterval(updateProgress, 500)
    return () => window.clearInterval(timer)
  }, [activeSessionTimeoutKey, evaluationStartedAt, isEvaluatingPractice])

  useEffect(() => {
    if (
      mode !== 'player'
      || !activeSessionTimeoutKey
      || activeSessionType !== 'Scheduled'
      || activeSessionCountdown !== '00:00:00'
      || isPracticeSubmitted
      || isEvaluatingPractice
      || showTimeCompletedNotice
      || timedOutSessionId === activeSessionTimeoutKey
    ) return undefined

    setTimedOutSessionId(activeSessionTimeoutKey)
    setShowSubmitConfirm(false)
    setShowTimeCompletedNotice(true)
    return undefined
  }, [
    activeSessionCountdown,
    activeSessionTimeoutKey,
    activeSessionType,
    isEvaluatingPractice,
    isPracticeSubmitted,
    mode,
    showTimeCompletedNotice,
    timedOutSessionId,
  ])

  useEffect(() => {
    if (!showTimeCompletedNotice) return undefined

    const revealTimer = window.setTimeout(() => {
      setShowTimeCompletedNotice(false)
      setEvaluationProgress(100)
      setEvaluationStartedAt(0)
      setIsEvaluatingPractice(false)
      setIsPracticeSubmitted(true)
      setSessionStatuses((current) => ({ ...current, [activeSessionTimeoutKey]: 'Expired' }))
    }, PRACTICE_TIMEOUT_NOTICE_MS)

    return () => window.clearTimeout(revealTimer)
  }, [activeSessionTimeoutKey, showTimeCompletedNotice])

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

  const setAnswerValue = (questionKey, value) => {
    if (isPracticeSubmitted || isEvaluatingPractice || showTimeCompletedNotice) return
    setAnswers((current) => ({ ...current, [questionKey]: value }))
  }

  const toggleTryLater = (questionKey) => {
    if (isPracticeSubmitted || isEvaluatingPractice || showTimeCompletedNotice) return
    setTryLaterQuestions((current) => {
      const next = new Set(current)
      if (next.has(questionKey)) next.delete(questionKey)
      else next.add(questionKey)
      return next
    })
  }

  const getQuestionStatus = (questionKey) => {
    if (tryLaterQuestions.has(questionKey)) return 'try-later'
    const questionIndex = questions.findIndex((question, index) => getQuestionKey(question, index) === questionKey)
    const answerKeys = questionIndex >= 0 ? getQuestionAnswerKeys(questions[questionIndex], questionIndex) : [questionKey]
    const hasAnswer = answerKeys.some((key) => {
      const answer = answers[key]
      return Array.isArray(answer) ? answer.length > 0 : Boolean(String(answer ?? '').trim())
    })
    if (hasAnswer) return 'answered'
    return 'not-viewed'
  }

  const startPracticeEvaluation = () => {
    setShowSubmitConfirm(false)
    setEvaluationProgress(0)
    setEvaluationStartedAt(Date.now())
    setIsEvaluatingPractice(true)
  }

  const resetPracticeAttempt = () => {
    setAnswers({})
    setTryLaterQuestions(new Set())
    setShowSubmitConfirm(false)
    setShowTimeCompletedNotice(false)
    setIsEvaluatingPractice(false)
    setEvaluationStartedAt(0)
    setEvaluationProgress(0)
    setIsPracticeSubmitted(false)
    setActiveIndex(0)
  }

  const renderPracticePlayer = () => (
    <>
      {questions.length ? (
        <main className="start-practice-answer-layout">
          <section className="start-practice-answer-main" aria-label="Practice questions">
            <section className="start-practice-section is-practice">
              <div className="start-practice-section-questions">
                {questionSections.map((section) => {
                  let sectionOffset = 0
                  for (const priorSection of questionSections) {
                    if (priorSection.key === section.key) break
                    sectionOffset += priorSection.items.length
                  }

                  return (
                    <div key={section.key} className={`start-practice-answer-group is-${section.accent}`}>
                      <header className="start-practice-answer-group-head">
                        <strong>{section.label}</strong>
                        <span>{formatCount(section.items.length)} Questions • {formatCount(section.marks)} Marks</span>
                      </header>
                      {section.items.map((item, sectionIndex) => {
                        const orderedIndex = sectionOffset + sectionIndex
                    const questionKey = item.key
                    const options = getQuestionOptions(item.question)
                    const visibleOptions = item.type === 'MCQ' && !options.length ? getFallbackMcqOptions() : options
                    const hasSavedDescriptiveParts = Array.isArray(item.question.descriptiveSections) && item.question.descriptiveSections.length
                    const shouldRenderDescriptiveParts = item.type === 'LAQs' || (item.type === 'SAQs' && hasSavedDescriptiveParts)
                    const descriptiveParts = shouldRenderDescriptiveParts ? getDescriptiveParts(item.question, questionKey) : []
                    const selectedAnswer = answers[questionKey]
                    const isActive = item.index === activeIndex
                    const status = getQuestionStatus(questionKey)
                    const itemEvaluation = isPracticeSubmitted
                      ? evaluateQuestionReview(item.question, selectedAnswer, visibleOptions, item.marks)
                      : null
                    const correctOptionKey = itemEvaluation?.correctKey || (item.type === 'MCQ' ? getMcqCorrectOptionKey(item.question, visibleOptions) : '')
                    const reviewStatus = itemEvaluation?.status || ''
                    const correctOptionText = correctOptionKey
                      ? getOptionText(visibleOptions.find((option, optionIndex) => (
                          String(option?.id ?? option?.value ?? getOptionText(option) ?? optionIndex) === correctOptionKey
                        )))
                      : ''
                    const partEvaluations = descriptiveParts.map((part) => (
                      evaluateDescriptiveAnswer(answers[part.key] ?? '', getAnswerText(part) || getAnswerText(item.question), part.marks)
                    ))
                    const descriptiveEvaluation = partEvaluations.length
                      ? {
                          status: partEvaluations.every((evaluation) => evaluation.status === 'Correct')
                            ? 'Correct'
                            : partEvaluations.every((evaluation) => evaluation.status === 'Wrong') ? 'Wrong' : 'Needs review',
                          earnedMarks: partEvaluations.reduce((total, evaluation) => total + evaluation.earnedMarks, 0),
                          maxMarks: partEvaluations.reduce((total, evaluation) => total + evaluation.maxMarks, 0),
                        }
                      : null
                    const cardEvaluation = descriptiveEvaluation || itemEvaluation

                    return (
                      <article key={questionKey} className={`start-practice-answer-question ${descriptiveParts.length ? 'is-laq-case' : ''} is-${status} ${isActive ? 'is-active' : ''} ${isPracticeSubmitted && cardEvaluation ? getReviewClassName(cardEvaluation.status) : ''}`}>
                        {descriptiveParts.length ? (
                          <div className="start-practice-laq-parts">
                            <div className="start-practice-laq-case-stem">
                              <strong>
                                <span>{orderedIndex + 1}.</span>
                                Clinical Case Scenario
                              </strong>
                              <p>{getQuestionText(item.question)}</p>
                            </div>
                            {descriptiveParts.map((part) => (
                              <label className="start-practice-laq-part" key={part.key}>
                                <span>
                                  <strong>{part.label}.</strong>
                                  <p>{part.text}</p>
                                  {isPracticeSubmitted ? (
                                    <b className={`start-practice-review-status ${getReviewClassName(partEvaluations[descriptiveParts.indexOf(part)]?.status)}`}>
                                      {partEvaluations[descriptiveParts.indexOf(part)]?.status}
                                    </b>
                                  ) : null}
                                  <em>{isPracticeSubmitted ? `${partEvaluations[descriptiveParts.indexOf(part)]?.earnedMarks ?? 0} / ${part.marks}` : `${part.marks} Marks`}</em>
                                </span>
                                {isPracticeSubmitted ? (
                                  <p className="start-practice-written-answer">
                                    {answers[part.key]?.trim() || 'No answer written.'}
                                  </p>
                                ) : (
                                  <textarea
                                    rows={7}
                                    value={answers[part.key] ?? ''}
                                    placeholder="Type your practice answer here..."
                                    onChange={(event) => setAnswerValue(part.key, event.target.value)}
                                  />
                                )}
                                {isPracticeSubmitted ? (
                                  <div className="start-practice-review-block is-descriptive">
                                    <strong>Model answer</strong>
                                    <p>{cleanRevealAnswerText(getAnswerText(part) || getAnswerText(item.question))}</p>
                                  </div>
                                ) : null}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <>
                            <div className="start-practice-answer-question-head">
                              <span>{orderedIndex + 1}.</span>
                              <p>{getQuestionText(item.question)}</p>
                              {isPracticeSubmitted ? (
                                <strong className={`start-practice-review-status ${getReviewClassName(reviewStatus)}`}>
                                  {reviewStatus}
                                </strong>
                              ) : null}
                              <em>{isPracticeSubmitted && itemEvaluation ? `${itemEvaluation.earnedMarks} / ${itemEvaluation.maxMarks}` : `${item.marks} Marks`}</em>
                            </div>

                            {item.type === 'MCQ' ? (
                              <div className="start-practice-answer-options">
                                {visibleOptions.map((option, optionIndex) => {
                                  const optionText = getOptionText(option)
                                  const optionKey = String(option.id ?? option.value ?? optionText ?? optionIndex)
                                  const optionLetter = String.fromCharCode(65 + optionIndex)
                                  const isSelected = selectedAnswer === optionKey
                                  const correctOptionIndex = findOptionIndexByAnswer(correctOptionKey, visibleOptions)
                                  const isCorrect = isPracticeSubmitted && correctOptionIndex === optionIndex
                                  const isWrongSelection = isPracticeSubmitted && isSelected && correctOptionIndex >= 0 && correctOptionIndex !== optionIndex

                                  return (
                                    <button
                                      key={optionKey}
                                      type="button"
                                      className={`${isSelected ? 'is-selected' : ''} ${isCorrect ? 'is-correct-option' : ''} ${isWrongSelection ? 'is-wrong-option' : ''}`}
                                      disabled={isPracticeSubmitted}
                                      onClick={() => {
                                        if (!isPracticeSubmitted) setAnswerValue(questionKey, optionKey)
                                      }}
                                    >
                                      <strong>{optionLetter}.</strong>
                                      {optionText}
                                    </button>
                                  )
                                })}
                              </div>
                            ) : isPracticeSubmitted ? (
                              <p className="start-practice-written-answer">
                                {answers[questionKey]?.trim() || 'No answer written.'}
                              </p>
                            ) : (
                              <textarea
                                rows={item.type === 'LAQs' ? 7 : 5}
                                value={answers[questionKey] ?? ''}
                                placeholder="Type your practice answer here..."
                                onChange={(event) => setAnswerValue(questionKey, event.target.value)}
                              />
                            )}
                            {isPracticeSubmitted ? (
                              <div className={`start-practice-review-block is-${item.type.toLowerCase()}`}>
                                <strong>{item.type === 'MCQ' ? 'Answer key & rationale' : 'Model answer'}</strong>
                                <p>{cleanRevealAnswerText(getAnswerText(item.question))}</p>
                              </div>
                            ) : null}
                          </>
                        )}

                      </article>
                    )
                      })}
                    </div>
                  )
                })}
              </div>
            </section>
            <footer className="start-practice-footer is-inside-answer-card">
              <button
                type="button"
                disabled={activeOrderedIndex === 0}
                onClick={() => setActiveIndex(orderedQuestionItems[Math.max(0, activeOrderedIndex - 1)]?.index ?? 0)}
              >
                <ChevronLeft size={15} strokeWidth={2.4} />
                Previous
              </button>
              <span>Page {orderedQuestionItems.length ? activeOrderedIndex + 1 : 0} of {orderedQuestionItems.length}</span>
              <div className="start-practice-footer-actions">
                <button
                  type="button"
                  disabled={activeOrderedIndex >= orderedQuestionItems.length - 1}
                  onClick={() => setActiveIndex(orderedQuestionItems[Math.min(orderedQuestionItems.length - 1, activeOrderedIndex + 1)]?.index ?? activeIndex)}
                >
                  Next
                  <ChevronRight size={15} strokeWidth={2.4} />
                </button>
              </div>
            </footer>
          </section>
          <aside className="start-practice-summary-panel" aria-label="Practice summary">
            <div className="start-practice-summary-card">
              <strong>Practice Summary</strong>
              <div className="start-practice-summary-mix">
                <span><em>{formatCount(typeCounts.mcq)}</em><small>MCQ</small></span>
                <span><em>{formatCount(typeCounts.saqs)}</em><small>SAQs</small></span>
                <span><em>{formatCount(typeCounts.laqs)}</em><small>LAQs</small></span>
              </div>
              <div className="start-practice-summary-progress">
                <span>Schedule</span>
                {activeSession ? (
                  <strong className={`start-practice-title-schedule ${activeSession.type === 'Scheduled' ? 'is-scheduled' : 'is-normal'} ${activeSession.countdown === '00:00:00' ? 'is-expired' : ''}`}>
                    {activeSession.type === 'Scheduled' ? (
                      <>
                        <Timer size={12} strokeWidth={2.2} />
                        {activeSession.countdown}
                      </>
                    ) : 'Normal'}
                  </strong>
                ) : null}
              </div>
              <div className="start-practice-summary-nav" aria-label="Question status">
                {orderedQuestionItems.map((item, index) => {
                  const questionKey = item.key
                  const status = getQuestionStatus(questionKey)
                  return (
                    <button
                      key={questionKey}
                      type="button"
                      className={`is-${status} ${item.index === activeIndex ? 'is-active' : ''}`}
                      onClick={() => setActiveIndex(item.index)}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
              <div className="start-practice-summary-legend">
                <span className="is-answered">Answered</span>
                <span className="is-try-later">Try Later</span>
                <span className="is-not-viewed">Not Viewed</span>
                <span className="is-viewed">Viewed</span>
              </div>
              <button
                type="button"
                className={`start-practice-summary-try-later ${tryLaterQuestions.has(getQuestionKey(questions[activeIndex], activeIndex)) ? 'is-marked' : ''}`}
                disabled={isPracticeSubmitted || isEvaluatingPractice || showTimeCompletedNotice}
                onClick={() => toggleTryLater(getQuestionKey(questions[activeIndex], activeIndex))}
              >
                Try Later
              </button>
              <button
                type="button"
                className={`start-practice-submit-btn ${isPracticeSubmitted ? 'is-reset' : ''}`}
                disabled={!isPracticeSubmitted && (answeredCount < questions.length || isEvaluatingPractice || showTimeCompletedNotice)}
                onClick={() => {
                  if (isPracticeSubmitted) {
                    resetPracticeAttempt()
                    return
                  }
                  setShowSubmitConfirm(true)
                }}
              >
                {isPracticeSubmitted ? 'Reset Practice' : 'Submit Practice'}
              </button>
            </div>
          </aside>
        </main>
      ) : (
        <div className="start-practice-empty">
          <span aria-hidden="true"><CheckCircle2 size={24} strokeWidth={2.2} /></span>
          <p>No questions are available in this practice set.</p>
        </div>
      )}

    </>
  )

  const submitConfirmationDialog = showSubmitConfirm ? (
    <div
      className="start-practice-confirm-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setShowSubmitConfirm(false)
      }}
    >
      <div
        className="start-practice-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-practice-submit-title"
        aria-describedby="start-practice-submit-copy"
      >
        <strong id="start-practice-submit-title">Submit Practice?</strong>
        <p id="start-practice-submit-copy">Do you want to submit this practice now?</p>
        <div className="start-practice-confirm-summary" aria-label="Submission summary">
          <span>
            <em>Answered</em>
            <strong>{answeredCount} / {questions.length}</strong>
          </span>
          <span>
            <em>Total Marks</em>
            <strong>{formatCount(totalMarks)}</strong>
          </span>
        </div>
        <div className="start-practice-confirm-actions">
          <button type="button" className="is-secondary" onClick={() => setShowSubmitConfirm(false)}>
            No
          </button>
          <button type="button" className="is-primary" onClick={startPracticeEvaluation}>
            Yes
          </button>
        </div>
      </div>
    </div>
  ) : null

  const timeCompletedDialog = showTimeCompletedNotice ? (
    <div className="start-practice-confirm-backdrop is-time-completed" role="presentation">
      <div
        className="start-practice-confirm-modal start-practice-time-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-practice-time-title"
        aria-describedby="start-practice-time-copy"
      >
        <span aria-hidden="true">
          <Timer size={24} strokeWidth={2.2} />
        </span>
        <strong id="start-practice-time-title">Time completed</strong>
        <p id="start-practice-time-copy">
          Your scheduled practice time is over. Answers will now be evaluated and revealed.
        </p>
      </div>
    </div>
  ) : null

  return (
    <section className="vx-content assessment-page start-practice-page">
      <div className="start-practice-shell">
        <header className={`start-practice-title-bar ${mode === 'player' ? 'is-player-header' : ''}`}>
          <div className="start-practice-title-main">
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
            <strong className="start-practice-competency-badge" tabIndex={0}>
              {selectedCard.competencyCode}
              <Info size={11} strokeWidth={2.4} aria-hidden="true" />
              <span role="tooltip">{competencyName}</span>
            </strong>
          </div>
          {mode === 'player' ? (
            <div className="start-practice-title-meta" aria-label="Practice session summary">
              <span className="start-practice-title-attended">
                <em>Attended</em>
                <strong>{answeredCount} / {questions.length}</strong>
              </span>
              <div className="start-practice-title-totals" aria-label="Practice totals">
                <span><em>Total Ques</em><strong>{formatCount(questions.length)}</strong></span>
                <span><em>Total Marks</em><strong>{formatCount(totalMarks)}</strong></span>
              </div>
            </div>
          ) : null}
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
                  <span role="cell">
                    <span className={`start-practice-status is-${String(row.status).toLowerCase().replace(/\s+/g, '-')}`}>
                      {row.status}
                    </span>
                  </span>
                  <span className="start-practice-session-action" role="cell">
                    <button type="button" className="start-practice-row-score" disabled>
                      <Trophy size={13} strokeWidth={2.3} />
                      Score
                    </button>
                    <button type="button" className="start-practice-row-start" onClick={() => {
                      setActiveSessionId(row.id)
                      setActiveIndex(0)
                      setAnswers({})
                      setTryLaterQuestions(new Set())
                      setShowSubmitConfirm(false)
                      setShowTimeCompletedNotice(false)
                      setIsEvaluatingPractice(false)
                      setEvaluationStartedAt(0)
                      setEvaluationProgress(0)
                      setIsPracticeSubmitted(false)
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

      {submitConfirmationDialog ? createPortal(submitConfirmationDialog, document.body) : null}
      {timeCompletedDialog ? createPortal(timeCompletedDialog, document.body) : null}
      {isEvaluatingPractice ? createPortal((
        <div className="start-practice-confirm-backdrop is-evaluating" role="presentation">
          <div
            className="start-practice-confirm-modal start-practice-evaluation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-practice-evaluation-title"
            aria-describedby="start-practice-evaluation-message"
          >
            <div
              className="start-practice-evaluation-ring"
              style={{ '--evaluation-progress': `${evaluationProgress * 3.6}deg` }}
              aria-label={`Evaluation ${evaluationProgress}% complete`}
            >
              <span>{evaluationProgress}%</span>
            </div>
            <strong id="start-practice-evaluation-title">Evaluating practice</strong>
            <p>Checking your answers and preparing feedback.</p>
            <small id="start-practice-evaluation-message">
              Please wait. Do not close or refresh this page.
            </small>
          </div>
        </div>
      ), document.body) : null}
    </section>
  )
}

export default StartPracticePage
