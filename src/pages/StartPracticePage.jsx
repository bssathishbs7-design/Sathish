import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PracticeLeaveDialog from '../components/PracticeLeaveDialog'
import { restoreCompletedPracticeHistory } from '../services/competencyAnalytics'
import { mergeNewPracticeSessions } from '../services/practiceShareSync'
import { ArrowLeft, BarChart3, BookOpenCheck, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Eye, Home, Info, Play, RotateCcw, Timer, Trophy, X } from 'lucide-react'
import { APP_PAGES } from '../config/appPages'
import './StartPracticePage.css'

const START_PRACTICE_SELECTED_CARD_KEY = 'vx-start-practice-selected-card'
const START_PRACTICE_DEFAULT_FILTER_KEY = 'vx-start-practice-default-filter'
const LEARN_PRACTICE_SHARED_CARDS_KEY = 'vx-learn-practice-shared-cards'
const PRACTICE_EVALUATION_DURATION_MS = 5000
const PRACTICE_TIMEOUT_NOTICE_MS = 2500
const DEFAULT_PRACTICE_SESSION_PAGE_SIZE = 5
const getPracticeSessionPageSize = () => {
  if (typeof window === 'undefined') return DEFAULT_PRACTICE_SESSION_PAGE_SIZE

  const viewportHeight = window.visualViewport?.height ?? window.innerHeight
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth
  const isDesktop = viewportWidth >= 1024
  const reservedHeight = isDesktop ? 275 : 360
  const rowHeight = isDesktop ? 76 : 96
  const minRows = isDesktop ? DEFAULT_PRACTICE_SESSION_PAGE_SIZE : 3
  const maxRows = isDesktop ? 10 : 6
  const availableRowSpace = Math.max(0, viewportHeight - reservedHeight)
  const calculatedRows = Math.floor(availableRowSpace / rowHeight)

  return Math.max(minRows, Math.min(maxRows, calculatedRows || minRows))
}
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

const readDefaultPracticeFilter = () => {
  if (typeof window === 'undefined') return 'all'
  const value = window.sessionStorage.getItem(START_PRACTICE_DEFAULT_FILTER_KEY)
  return value === 'in-progress' ? 'in-progress' : 'all'
}

const persistSelectedPracticeCard = (card = {}) => {
  if (typeof window === 'undefined' || !card || typeof card !== 'object') return

  const matchesCard = (item = {}) => (
    String(item?.id ?? '') === String(card?.id ?? '')
    || String(item?.competencyCode ?? '') === String(card?.competencyCode ?? '')
  )

  try {
    window.sessionStorage.setItem(START_PRACTICE_SELECTED_CARD_KEY, JSON.stringify(card))
  } catch {
    // Keep the in-page state usable if session storage is unavailable.
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LEARN_PRACTICE_SHARED_CARDS_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return

    let didUpdate = false
    const nextCards = parsed.map((item) => {
      if (!matchesCard(item)) return item
      didUpdate = true
      return card
    })

    if (didUpdate) {
      window.localStorage.setItem(LEARN_PRACTICE_SHARED_CARDS_KEY, JSON.stringify(nextCards))
      window.dispatchEvent(new Event('learn-practice-shared-cards'))
    }
  } catch {
    // Ignore malformed shared-card storage; local UI state remains correct.
  }
}

const writePracticeSessionStatus = (card = {}, sessionId = '', status = '') => {
  if (typeof window === 'undefined' || !card || !sessionId || !status) return

  const matchesCard = (item = {}) => (
    String(item?.id ?? '') === String(card?.id ?? '')
    || String(item?.competencyCode ?? '') === String(card?.competencyCode ?? '')
  )
  const updateCard = (item = {}) => {
    const sessions = Array.isArray(item.practiceSessions) ? item.practiceSessions : []
    const nextSessions = sessions.map((session) => (
      String(session?.id ?? '') === String(sessionId) ? { ...session, status } : session
    ))
    const didUpdateSession = nextSessions.some((session, index) => session !== sessions[index])

    if (!didUpdateSession && String(`${item.id ?? item.competencyCode}-practice-1`) !== String(sessionId)) {
      return item
    }

    return {
      ...item,
      status,
      practiceSessions: didUpdateSession ? nextSessions : sessions,
    }
  }

  try {
    const selectedCard = JSON.parse(window.sessionStorage.getItem(START_PRACTICE_SELECTED_CARD_KEY) ?? 'null')
    if (selectedCard && typeof selectedCard === 'object' && matchesCard(selectedCard)) {
      window.sessionStorage.setItem(START_PRACTICE_SELECTED_CARD_KEY, JSON.stringify(updateCard(selectedCard)))
    }
  } catch {
    // Keep the in-page status update even if session storage is malformed.
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LEARN_PRACTICE_SHARED_CARDS_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return

    let didUpdate = false
    const nextCards = parsed.map((item) => {
      if (!matchesCard(item)) return item
      didUpdate = true
      return updateCard(item)
    })

    if (didUpdate) {
      window.localStorage.setItem(LEARN_PRACTICE_SHARED_CARDS_KEY, JSON.stringify(nextCards))
      window.dispatchEvent(new Event('learn-practice-shared-cards'))
    }
  } catch {
    // Ignore malformed shared-card storage; local UI state remains correct.
  }
}

const writePracticeSessionAttempt = (card = {}, sessionId = '', attempt = {}) => {
  if (typeof window === 'undefined' || !card || !sessionId) return

  const matchesCard = (item = {}) => (
    String(item?.id ?? '') === String(card?.id ?? '')
    || String(item?.competencyCode ?? '') === String(card?.competencyCode ?? '')
  )
  const updateCard = (item = {}) => {
    const sessions = Array.isArray(item.practiceSessions) ? item.practiceSessions : []
    const nextSessions = sessions.map((session) => (
      String(session?.id ?? '') === String(sessionId)
        ? {
            ...session,
            practiceAnswers: attempt.answers ?? {},
            practiceTryLaterKeys: attempt.tryLaterKeys ?? [],
            practiceSubmitted: Boolean(attempt.isSubmitted),
          }
        : session
    ))
    const didUpdateSession = nextSessions.some((session, index) => session !== sessions[index])

    if (!didUpdateSession) return item

    return {
      ...item,
      practiceSessions: nextSessions,
    }
  }

  try {
    const selectedCard = JSON.parse(window.sessionStorage.getItem(START_PRACTICE_SELECTED_CARD_KEY) ?? 'null')
    if (selectedCard && typeof selectedCard === 'object' && matchesCard(selectedCard)) {
      window.sessionStorage.setItem(START_PRACTICE_SELECTED_CARD_KEY, JSON.stringify(updateCard(selectedCard)))
    }
  } catch {
    // Keep the in-page attempt even if session storage is malformed.
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LEARN_PRACTICE_SHARED_CARDS_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return

    let didUpdate = false
    const nextCards = parsed.map((item) => {
      if (!matchesCard(item)) return item
      didUpdate = true
      return updateCard(item)
    })

    if (didUpdate) {
      window.localStorage.setItem(LEARN_PRACTICE_SHARED_CARDS_KEY, JSON.stringify(nextCards))
      window.dispatchEvent(new Event('learn-practice-shared-cards'))
    }
  } catch {
    // Ignore malformed shared-card storage; local UI state remains correct.
  }
}

const updatePracticeSessionInCard = (card = {}, sessionId = '', patch = {}) => {
  if (!card || !sessionId) return card

  const sessions = Array.isArray(card.practiceSessions) ? card.practiceSessions : []
  let didUpdateSession = false
  const nextSessions = sessions.map((session) => {
    if (String(session?.id ?? '') !== String(sessionId)) return session
    didUpdateSession = true
    return {
      ...session,
      ...patch,
    }
  })

  if (!didUpdateSession) return card

  return {
    ...card,
    practiceSessions: nextSessions,
    status: patch.status ?? card.status,
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

const isPlaceholderAnswerGuidance = (value = '') => (
  !cleanRevealAnswerText(value)
  || /^answer guidance will appear here\.?$/i.test(cleanRevealAnswerText(value))
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

  if (matchedIndex < 0) {
    const fallbackOption = options[0]
    return fallbackOption !== undefined
      ? String(fallbackOption.id ?? fallbackOption.value ?? getOptionText(fallbackOption) ?? 0)
      : ''
  }
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

  const modelText = stripHtml(modelAnswer)
  if (!modelText || /^answer guidance will appear here\.?$/i.test(modelText)) {
    return { status: 'Correct', earnedMarks: maxMarks, maxMarks, ratio: 1 }
  }

  const modelTerms = getReviewTerms(modelText)
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

const getDescriptiveFeedbackSections = ({
  answer = '',
  evaluation = {},
  guidance = '',
  marks = 0,
} = {}) => {
  const status = evaluation.status || 'Needs review'
  const earnedMarks = Number(evaluation.earnedMarks ?? 0)
  const maxMarks = Number(evaluation.maxMarks ?? marks ?? 0)
  const ratio = Number.isFinite(evaluation.ratio) ? evaluation.ratio : (maxMarks ? earnedMarks / maxMarks : 0)
  const hasAnswer = Boolean(stripHtml(answer))
  const cleanGuidance = cleanRevealAnswerText(guidance)
  const hasGuidance = !isPlaceholderAnswerGuidance(cleanGuidance)
  const roundedScore = `${earnedMarks}/${maxMarks || marks || 0}`

  const assessmentRationale = !hasAnswer
    ? 'No written response was submitted, so marks could not be awarded for this answer.'
    : status === 'Correct'
      ? 'The response covers the expected points closely enough for this practice evaluation.'
      : status === 'Wrong'
        ? 'The response does not yet show enough of the expected answer points for this question.'
        : 'The response shows partial alignment with the expected answer and needs more complete coverage.'

  const strengths = !hasAnswer
    ? 'No strengths could be identified because an answer was not written.'
    : ratio >= 0.72
      ? 'Your answer includes the main expected points and stays relevant to the question.'
      : ratio > 0
        ? 'Your answer includes some relevant ideas that can be developed further.'
        : 'Your answer attempts the question, but the key expected points are still missing.'

  const improvements = !hasAnswer
    ? 'Write a focused answer before submission so it can be evaluated against the expected points.'
    : ratio >= 0.72
      ? 'Add sharper sequencing, supporting details, and any missing keywords to make the answer complete.'
      : ratio > 0
        ? 'Expand the answer with the missing core points, clearer reasoning, and direct links to the question stem.'
        : 'Rebuild the answer around the core concepts asked in the question and avoid unrelated content.'

  return [
    {
      heading: 'Evaluation Report',
      body: roundedScore,
      status,
      summary: true,
    },
    {
      heading: 'Assessment Rationale',
      body: assessmentRationale,
    },
    {
      heading: 'Your Strengths',
      body: strengths,
    },
    {
      heading: 'Areas for Improvement',
      body: improvements,
    },
    {
      heading: 'Guidance for a Perfect Answer',
      body: hasGuidance
        ? cleanGuidance
        : 'A perfect answer should directly address every part of the question, include the key expected points, and present them in a clear clinical sequence.',
    },
  ]
}

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
      totalMarks: session.totalMarks,
      maxMarks: session.maxMarks,
      marks: session.marks,
      sharedAt: session.sharedAt || card.lastSharedAt || '',
      assignment: session.assignment ?? card.assignment ?? {},
      questions: Array.isArray(session.questions) ? session.questions : [],
      mcq: Number(session.mcq || 0),
      laqs: Number(session.laqs || 0),
      saqs: Number(session.saqs || 0),
      status: session.status || 'In Progress',
      practiceAnswers: session.practiceAnswers ?? {},
      practiceTryLaterKeys: Array.isArray(session.practiceTryLaterKeys) ? session.practiceTryLaterKeys : [],
      practiceSubmitted: Boolean(session.practiceSubmitted),
      practiceAttemptHistory: Array.isArray(session.practiceAttemptHistory) ? session.practiceAttemptHistory : [],
    }))
  }

  const legacyQuestions = Array.isArray(card.questions) ? card.questions : []
  return legacyQuestions.length ? [{
    id: `${card.id ?? card.competencyCode}-practice-1`,
    practiceNo: 1,
    totalMarks: card.totalMarks,
    maxMarks: card.maxMarks,
    marks: card.marks,
    sharedAt: card.lastSharedAt || card.sharedToStudentsAt || '',
    assignment: card.assignment ?? {},
    questions: legacyQuestions,
    mcq: Number(card.mcq || 0),
    laqs: Number(card.laqs || 0),
    saqs: Number(card.saqs || 0),
    status: 'In Progress',
    practiceAnswers: card.practiceAnswers ?? {},
    practiceTryLaterKeys: Array.isArray(card.practiceTryLaterKeys) ? card.practiceTryLaterKeys : [],
    practiceSubmitted: Boolean(card.practiceSubmitted),
    practiceAttemptHistory: Array.isArray(card.practiceAttemptHistory) ? card.practiceAttemptHistory : [],
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

const getSessionScore = (session = {}) => {
  const answers = session.practiceAnswers ?? {}
  const questions = Array.isArray(session.questions) ? session.questions : []

  return questions.reduce((score, question, index) => {
    const questionKey = getQuestionKey(question, index)
    const type = getQuestionType(question)
    const questionMarks = getQuestionMarks(question)
    const options = type === 'MCQ' ? getQuestionOptions(question) : []

    if (type === 'LAQs' || type === 'SAQs') {
      const hasDescriptiveParts = Array.isArray(question.descriptiveSections) && question.descriptiveSections.length
      const parts = type === 'LAQs' || (type === 'SAQs' && hasDescriptiveParts)
        ? getDescriptiveParts(question, questionKey)
        : []

      if (parts.length) {
        const partScore = parts.reduce((partTotal, part) => {
          const evaluation = evaluateDescriptiveAnswer(
            answers[part.key] ?? '',
            getAnswerText(part) || getAnswerText(question),
            part.marks,
          )
          return partTotal + evaluation.earnedMarks
        }, 0)

        const typeKey = type.toLowerCase()

        return {
          ...score,
          [typeKey]: score[typeKey] + partScore,
          obtained: score.obtained + partScore,
          total: score.total + questionMarks,
        }
      }
    }

    const evaluation = evaluateQuestionReview(question, answers[questionKey], options, questionMarks)
    const typeKey = type.toLowerCase()
    return {
      ...score,
      [typeKey]: score[typeKey] + evaluation.earnedMarks,
      obtained: score.obtained + evaluation.earnedMarks,
      total: score.total + evaluation.maxMarks,
    }
  }, { mcq: 0, saqs: 0, laqs: 0, obtained: 0, total: 0 })
}

const getPracticeSessionTotalMarks = (session = {}, fallbackTotal = 0) => {
  const attemptHistory = Array.isArray(session.practiceAttemptHistory) ? session.practiceAttemptHistory : []
  const historyTotals = attemptHistory.map((record) => parseMarksValue(record?.total))
  const explicitTotals = [
    session.totalMarks,
    session.maxMarks,
    session.marks,
    fallbackTotal,
  ].map(parseMarksValue)

  return Math.max(0, ...historyTotals, ...explicitTotals)
}

const createPracticeAttemptRecord = (session = {}, attempt = {}, status = 'Completed') => {
  const score = getSessionScore({
    ...session,
    practiceAnswers: attempt.answers ?? {},
    practiceTryLaterKeys: attempt.tryLaterKeys ?? [],
    practiceSubmitted: true,
  })

  return {
    id: `${session.id ?? 'practice'}-attempt-${Date.now()}`,
    attemptedAt: new Date().toISOString(),
    status,
    mcq: score.mcq,
    saqs: score.saqs,
    laqs: score.laqs,
    obtained: score.obtained,
    total: getPracticeSessionTotalMarks(session, score.total),
    answers: attempt.answers ?? {},
    tryLaterKeys: attempt.tryLaterKeys ?? [],
  }
}

const appendPracticeAttemptRecord = (card = {}, sessionId = '', attempt = {}, status = 'Completed') => {
  const session = getPracticeSessions(card).find((item) => String(item.id) === String(sessionId))
  if (!session) return card

  const attemptRecord = createPracticeAttemptRecord(session, attempt, status)
  const existingHistory = Array.isArray(session.practiceAttemptHistory) ? session.practiceAttemptHistory : []

  return updatePracticeSessionInCard(card, sessionId, {
    status,
    practiceAnswers: attempt.answers ?? {},
    practiceTryLaterKeys: attempt.tryLaterKeys ?? [],
    practiceSubmitted: true,
    practiceAttemptHistory: [...existingHistory, attemptRecord],
  })
}

const formatPracticeMarks = (obtained, total) => {
  const obtainedMarks = Number(obtained)
  const totalMarks = Number(total)

  if (!Number.isFinite(obtainedMarks) || !Number.isFinite(totalMarks) || totalMarks <= 0) return '-'

  return `${obtainedMarks}/${totalMarks}`
}

const getLatestPracticeMarks = (session = {}) => {
  const attemptHistory = Array.isArray(session.practiceAttemptHistory) ? session.practiceAttemptHistory : []
  const latestAttempt = attemptHistory.reduce((latest, record) => {
    if (!latest) return record

    const latestTime = Date.parse(latest.attemptedAt || '')
    const recordTime = Date.parse(record.attemptedAt || '')

    if (!Number.isFinite(latestTime) && !Number.isFinite(recordTime)) return record
    if (!Number.isFinite(latestTime)) return record
    if (!Number.isFinite(recordTime)) return latest
    return recordTime >= latestTime ? record : latest
  }, null)

  const score = getSessionScore(session)
  const totalMarks = getPracticeSessionTotalMarks(session, score.total)

  if (latestAttempt) return formatPracticeMarks(latestAttempt.obtained, totalMarks)
  if (!session.practiceSubmitted && !['completed', 'expired'].includes(String(session.status).trim().toLowerCase())) return '-'

  return formatPracticeMarks(score.obtained, totalMarks)
}

function StartPracticePage({ onNavigate, onPracticeAnswerModeChange, onOpenAnalytics, analyticsReturnState }) {
  const [selectedCard, setSelectedCard] = useState(() => readSelectedPracticeCard())
  useEffect(() => {
    const syncSharedSessions = (event) => {
      if (event?.type === 'storage' && event.key !== LEARN_PRACTICE_SHARED_CARDS_KEY && event.key !== null) return
      let cards
      try {
        cards = JSON.parse(window.localStorage.getItem(LEARN_PRACTICE_SHARED_CARDS_KEY) || '[]')
      } catch {
        return
      }
      if (!Array.isArray(cards)) return
      setSelectedCard((current) => {
        if (!current) return current
        const incoming = cards.find((card) => card && (
          (current.id && String(card.id) === String(current.id))
          || (current.competencyCode && card.competencyCode === current.competencyCode)
        ))
        if (!incoming) return current
        const base = current.practiceSessions?.length ? current : { ...current, practiceSessions: getPracticeSessions(current) }
        const next = mergeNewPracticeSessions(base, incoming)
        if (next === base) return current
        return hydratePracticeCard(next)
      })
    }
    window.addEventListener('learn-practice-shared-cards', syncSharedSessions)
    window.addEventListener('storage', syncSharedSessions)
    syncSharedSessions()
    return () => {
      window.removeEventListener('learn-practice-shared-cards', syncSharedSessions)
      window.removeEventListener('storage', syncSharedSessions)
    }
  }, [])

  useEffect(() => {
    if (!selectedCard) return
    try {
      window.sessionStorage.setItem(START_PRACTICE_SELECTED_CARD_KEY, JSON.stringify(selectedCard))
    } catch {
      // Live updates remain available when storage cannot be written.
    }
  }, [selectedCard])
  const [mode, setMode] = useState('sessions')
  const [activeIndex, setActiveIndex] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [sessionStatuses, setSessionStatuses] = useState({})
  const [sessionAttempts, setSessionAttempts] = useState({})
  const [isReviewingAttempt, setIsReviewingAttempt] = useState(false)
  const practiceRows = useMemo(() => {
    const sessionsById = new Map(getPracticeSessions(selectedCard).map((session) => [String(session.id), session]))

    return getPracticeRows(selectedCard, now).map((row) => {
      const status = sessionStatuses[row.id] || row.status
      const session = sessionsById.get(String(row.id)) ?? row

      return {
        ...row,
        status,
        hasCompletedAttempt: Boolean(session.practiceAttemptHistory?.length || session.practiceSubmitted),
        isRetakeInProgress: Boolean(session.practiceAttemptHistory?.length) && String(status).toLowerCase() === 'in progress',
        marks: session.practiceAttemptHistory?.length || ['completed', 'expired'].includes(String(status).trim().toLowerCase())
          ? getLatestPracticeMarks({ ...session, status })
          : '-',
      }
    })
  }, [now, selectedCard, sessionStatuses])
  const returnState = analyticsReturnState?.card?.competencyCode === selectedCard?.competencyCode ? analyticsReturnState : null
  const [sessionFilter, setSessionFilter] = useState(() => returnState?.filter ?? readDefaultPracticeFilter())
  const previousSessionFilter = useRef(sessionFilter)
  const [answers, setAnswers] = useState({})
  const [tryLaterQuestions, setTryLaterQuestions] = useState(() => new Set())
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showScoreDialog, setShowScoreDialog] = useState(false)
  const [scoreSessionId, setScoreSessionId] = useState('')
  const closeScoreDialog = useCallback(() => {
    setShowScoreDialog(false)
    setScoreSessionId('')
  }, [])
  const [timedOutSessionId, setTimedOutSessionId] = useState('')
  const [showTimeCompletedNotice, setShowTimeCompletedNotice] = useState(false)
  const [isEvaluatingPractice, setIsEvaluatingPractice] = useState(false)
  const [evaluationStartedAt, setEvaluationStartedAt] = useState(0)
  const [evaluationProgress, setEvaluationProgress] = useState(0)
  const [isPracticeSubmitted, setIsPracticeSubmitted] = useState(false)
  const [sessionPage, setSessionPage] = useState(() => returnState?.page ?? 0)
  const [sessionPageSize, setSessionPageSize] = useState(() => getPracticeSessionPageSize())
  const questionCardRefs = useRef({})
  const visiblePracticeRows = useMemo(() => (
    practiceRows.filter((row) => {
      if (sessionFilter === 'all') return true
      if (sessionFilter === 'in-progress') return String(row.status).trim().toLowerCase() === 'in progress'
      return row.type.toLowerCase() === sessionFilter
    })
  ), [practiceRows, sessionFilter])
  const sessionPageCount = Math.max(1, Math.ceil(visiblePracticeRows.length / sessionPageSize))
  const currentSessionPage = Math.min(sessionPage, sessionPageCount - 1)
  const paginatedPracticeRows = useMemo(() => {
    const startIndex = currentSessionPage * sessionPageSize
    return visiblePracticeRows.slice(startIndex, startIndex + sessionPageSize)
  }, [currentSessionPage, sessionPageSize, visiblePracticeRows])
  const sessionFilterCounts = useMemo(() => ({
    all: practiceRows.length,
    scheduled: practiceRows.filter((row) => row.type === 'Scheduled').length,
    normal: practiceRows.filter((row) => row.type === 'Normal').length,
    inProgress: practiceRows.filter((row) => String(row.status).trim().toLowerCase() === 'in progress').length,
  }), [practiceRows])
  const [activeSessionId, setActiveSessionId] = useState('')
  const activeSession = practiceRows.find((row) => row.id === activeSessionId) ?? practiceRows[0] ?? null
  const isFinishedPracticeStatus = (status = '') => ['completed', 'expired'].includes(String(status).trim().toLowerCase())
  const activeSessionTimeoutKey = activeSession?.id ?? ''
  const activeSessionCountdown = activeSession?.countdown ?? ''
  const activeSessionType = activeSession?.type ?? ''
  const completedScoreRows = useMemo(() => {
    const sessionsById = new Map(getPracticeSessions(selectedCard).map((session) => [String(session.id), session]))
    const finishedRows = practiceRows.filter((row) => (
      (row.hasCompletedAttempt || isFinishedPracticeStatus(row.status))
      && (!scoreSessionId || String(row.id) === String(scoreSessionId))
    ))

    let attemptIndex = 0

    return finishedRows.flatMap((row) => {
      const session = sessionsById.get(String(row.id)) ?? row
      const attemptHistory = Array.isArray(session.practiceAttemptHistory) ? session.practiceAttemptHistory : []
      const sessionTotalMarks = getPracticeSessionTotalMarks(session)
      if (attemptHistory.length) {
        return attemptHistory.map((record) => {
          attemptIndex += 1
          return {
            id: String(record.id ?? `${row.id}-attempt-${attemptIndex}`),
            attempt: `Attempt ${attemptIndex}`,
            dateTime: formatDateTime(record.attemptedAt) || row.dateTime || '-',
            mcq: Number(row.mcq || 0) > 0 ? Number(record.mcq || 0) : '-',
            saqs: Number(row.saqs || 0) > 0 ? Number(record.saqs || 0) : '-',
            laqs: Number(row.laqs || 0) > 0 ? Number(record.laqs || 0) : '-',
            obtained: Number(record.obtained || 0),
            total: sessionTotalMarks || Number(record.total || 0),
          }
        })
      }

      const savedAttempt = sessionAttempts[row.id]
      const liveAttempt = activeSessionTimeoutKey === row.id
        ? {
            answers,
            tryLaterKeys: Array.from(tryLaterQuestions),
            isSubmitted: isPracticeSubmitted,
          }
        : null
      const attempt = liveAttempt ?? savedAttempt
      const sessionForScore = attempt
        ? {
            ...session,
            practiceAnswers: attempt.answers ?? session.practiceAnswers ?? {},
            practiceTryLaterKeys: attempt.tryLaterKeys ?? session.practiceTryLaterKeys ?? [],
            practiceSubmitted: Boolean(attempt.isSubmitted ?? session.practiceSubmitted),
          }
        : session
      const score = getSessionScore(sessionForScore)
      attemptIndex += 1

      return [{
        id: row.id,
        attempt: `Attempt ${attemptIndex}`,
        dateTime: row.dateTime || '-',
        mcq: Number(row.mcq || 0) > 0 ? score.mcq : '-',
        saqs: Number(row.saqs || 0) > 0 ? score.saqs : '-',
        laqs: Number(row.laqs || 0) > 0 ? score.laqs : '-',
        obtained: score.obtained,
        total: getPracticeSessionTotalMarks(session, score.total),
      }]
    })
  }, [activeSessionTimeoutKey, answers, isPracticeSubmitted, practiceRows, scoreSessionId, selectedCard, sessionAttempts, tryLaterQuestions])

  useEffect(() => {
    if (previousSessionFilter.current !== sessionFilter) setSessionPage(0)
    previousSessionFilter.current = sessionFilter
  }, [sessionFilter])

  useEffect(() => {
    if (sessionFilter === 'in-progress' && sessionFilterCounts.inProgress === 0) {
      setSessionFilter('all')
    }
  }, [sessionFilter, sessionFilterCounts.inProgress])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const updatePageSize = () => setSessionPageSize(getPracticeSessionPageSize())
    window.addEventListener('resize', updatePageSize)
    window.visualViewport?.addEventListener('resize', updatePageSize)

    return () => {
      window.removeEventListener('resize', updatePageSize)
      window.visualViewport?.removeEventListener('resize', updatePageSize)
    }
  }, [])

  useEffect(() => {
    setSessionPage((currentPage) => Math.min(currentPage, sessionPageCount - 1))
  }, [sessionPageCount])
  const scoreRows = useMemo(() => {
    if (completedScoreRows.length <= 2) return completedScoreRows

    const recentAttempt = completedScoreRows[completedScoreRows.length - 1]
    return [
      completedScoreRows[0],
      completedScoreRows[1],
      {
        ...recentAttempt,
        attempt: 'Recent Attempt',
      },
    ]
  }, [completedScoreRows])
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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    onPracticeAnswerModeChange?.(mode === 'player')
    return () => onPracticeAnswerModeChange?.(false)
  }, [mode, onPracticeAnswerModeChange])

  useEffect(() => {
    if (!showSubmitConfirm && !showScoreDialog) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowSubmitConfirm(false)
      if (event.key === 'Escape') closeScoreDialog()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeScoreDialog, showScoreDialog, showSubmitConfirm])

  useEffect(() => {
    if (mode !== 'player' || !activeSessionTimeoutKey || isReviewingAttempt) return

    const attempt = {
      answers,
      tryLaterKeys: Array.from(tryLaterQuestions),
      isSubmitted: isPracticeSubmitted,
    }
    setSessionAttempts((current) => ({
      ...current,
      [activeSessionTimeoutKey]: attempt,
    }))
    writePracticeSessionAttempt(selectedCard, activeSessionTimeoutKey, attempt)
  }, [activeSessionTimeoutKey, answers, isPracticeSubmitted, isReviewingAttempt, mode, selectedCard, tryLaterQuestions])

  useEffect(() => {
    const expiredRows = practiceRows.filter((row) => (
      row.type === 'Scheduled'
      && row.countdown === '00:00:00'
      && row.status !== 'Completed'
      && row.status !== 'Expired'
    ))

    if (!expiredRows.length) return

    expiredRows.forEach((row) => writePracticeSessionStatus(selectedCard, row.id, 'Expired'))
    setSessionStatuses((current) => {
      let changed = false
      const next = { ...current }

      expiredRows.forEach((row) => {
        if (current[row.id] !== 'Completed' && current[row.id] !== 'Expired') {
          next[row.id] = 'Expired'
          changed = true
        }
      })

      return changed ? next : current
    })
  }, [practiceRows, selectedCard])

  useEffect(() => {
    if (!isEvaluatingPractice || !evaluationStartedAt) return undefined

    const updateProgress = () => {
      const elapsed = Date.now() - evaluationStartedAt
      const nextProgress = Math.min(100, Math.round((elapsed / PRACTICE_EVALUATION_DURATION_MS) * 100))
      setEvaluationProgress(nextProgress)

      if (elapsed >= PRACTICE_EVALUATION_DURATION_MS) {
        const finalAttempt = {
          answers,
          tryLaterKeys: Array.from(tryLaterQuestions),
          isSubmitted: true,
        }
        setIsEvaluatingPractice(false)
        setIsPracticeSubmitted(true)
        setEvaluationStartedAt(0)
        if (activeSessionTimeoutKey) {
          setSessionAttempts((current) => ({
            ...current,
            [activeSessionTimeoutKey]: finalAttempt,
          }))
          writePracticeSessionAttempt(selectedCard, activeSessionTimeoutKey, finalAttempt)
          writePracticeSessionStatus(selectedCard, activeSessionTimeoutKey, 'Completed')
          setSelectedCard((current) => {
            const nextCard = appendPracticeAttemptRecord(current, activeSessionTimeoutKey, finalAttempt, 'Completed')
            persistSelectedPracticeCard(nextCard)
            return nextCard
          })
          setSessionStatuses((current) => ({ ...current, [activeSessionTimeoutKey]: 'Completed' }))
        }
      }
    }

    updateProgress()
    const timer = window.setInterval(updateProgress, 500)
    return () => window.clearInterval(timer)
  }, [activeSessionTimeoutKey, answers, evaluationStartedAt, isEvaluatingPractice, selectedCard, tryLaterQuestions])

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
      const finalAttempt = {
        answers,
        tryLaterKeys: Array.from(tryLaterQuestions),
        isSubmitted: true,
      }
      setShowTimeCompletedNotice(false)
      setEvaluationProgress(100)
      setEvaluationStartedAt(0)
      setIsEvaluatingPractice(false)
      setIsPracticeSubmitted(true)
      setSessionAttempts((current) => ({
        ...current,
        [activeSessionTimeoutKey]: finalAttempt,
      }))
      writePracticeSessionAttempt(selectedCard, activeSessionTimeoutKey, finalAttempt)
      writePracticeSessionStatus(selectedCard, activeSessionTimeoutKey, 'Expired')
      setSelectedCard((current) => {
        const nextCard = appendPracticeAttemptRecord(current, activeSessionTimeoutKey, finalAttempt, 'Expired')
        persistSelectedPracticeCard(nextCard)
        return nextCard
      })
      setSessionStatuses((current) => ({ ...current, [activeSessionTimeoutKey]: 'Expired' }))
    }, PRACTICE_TIMEOUT_NOTICE_MS)

    return () => window.clearTimeout(revealTimer)
  }, [activeSessionTimeoutKey, answers, selectedCard, showTimeCompletedNotice, tryLaterQuestions])

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

  const focusQuestionCard = (questionIndex) => {
    setActiveIndex(questionIndex)

    window.requestAnimationFrame(() => {
      const card = questionCardRefs.current[String(questionIndex)]
      if (!card) return

      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      card.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
        inline: 'nearest',
      })
      card.focus({ preventScroll: true })
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

  const getSummaryReviewClass = (item = {}) => {
    if (!isPracticeSubmitted || !item.question) return ''

    const options = getQuestionOptions(item.question)
    const visibleOptions = item.type === 'MCQ' && !options.length ? getFallbackMcqOptions() : options
    const hasSavedDescriptiveParts = Array.isArray(item.question.descriptiveSections) && item.question.descriptiveSections.length
    const shouldReviewParts = item.type === 'LAQs' || (item.type === 'SAQs' && hasSavedDescriptiveParts)
    const descriptiveParts = shouldReviewParts ? getDescriptiveParts(item.question, item.key) : []
    const partEvaluations = descriptiveParts.map((part) => (
      evaluateDescriptiveAnswer(answers[part.key] ?? '', getAnswerText(part) || getAnswerText(item.question), part.marks)
    ))
    const reviewStatus = partEvaluations.length
      ? (
          partEvaluations.every((evaluation) => evaluation.status === 'Correct')
            ? 'Correct'
            : partEvaluations.every((evaluation) => evaluation.status === 'Wrong') ? 'Wrong' : 'Needs review'
        )
      : evaluateQuestionReview(item.question, answers[item.key], visibleOptions, item.marks).status

    return `is-result-${reviewStatus.toLowerCase().replace(/\s+/g, '-')}`
  }

  const startPracticeEvaluation = () => {
    setShowSubmitConfirm(false)
    setEvaluationProgress(0)
    setEvaluationStartedAt(Date.now())
    setIsEvaluatingPractice(true)
  }

  const clearStartPracticePageState = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(START_PRACTICE_SELECTED_CARD_KEY)
      window.sessionStorage.removeItem(START_PRACTICE_DEFAULT_FILTER_KEY)
    }
    setActiveSessionId('')
    setActiveIndex(0)
    setAnswers({})
    setTryLaterQuestions(new Set())
    setShowSubmitConfirm(false)
    setScoreSessionId('')
    setShowTimeCompletedNotice(false)
    setIsEvaluatingPractice(false)
    setEvaluationStartedAt(0)
    setEvaluationProgress(0)
    setIsPracticeSubmitted(false)
  }

  const openPracticeSession = (row, options = {}) => {
    setShowLeaveConfirm(false)
    const isRetake = Boolean(options.retake)
    const session = getPracticeSessions(selectedCard).find((item) => String(item.id) === String(row.id)) ?? row
    const latestAttempt = [...(session.practiceAttemptHistory ?? [])].sort((a, b) => (Date.parse(b.attemptedAt) || 0) - (Date.parse(a.attemptedAt) || 0))[0]
    const isReview = !isRetake && !options.resume && (row.hasCompletedAttempt || isFinishedPracticeStatus(row.status))
    setIsReviewingAttempt(isReview)
    const savedAttempt = isReview && latestAttempt ? { ...latestAttempt, isSubmitted: true } : sessionAttempts[row.id] ?? {
      answers: row.practiceAnswers ?? {},
      tryLaterKeys: row.practiceTryLaterKeys ?? [],
      isSubmitted: Boolean(row.practiceSubmitted),
    }
    const finishedStatus = isReview

    if (isRetake) {
      const freshAttempt = {
        answers: {},
        tryLaterKeys: [],
        isSubmitted: false,
      }
      // Preserve older completed sessions that predate attempt-history storage.
      const cardWithHistory = !latestAttempt && row.hasCompletedAttempt
        ? appendPracticeAttemptRecord(selectedCard, row.id, savedAttempt, 'Completed')
        : selectedCard
      const nextCard = hydratePracticeCard(updatePracticeSessionInCard(cardWithHistory, row.id, {
        status: 'In Progress',
        practiceAnswers: {},
        practiceTryLaterKeys: [],
        practiceSubmitted: false,
      }))

      setSelectedCard(nextCard)
      persistSelectedPracticeCard(nextCard)
      writePracticeSessionAttempt(nextCard, row.id, freshAttempt)
      writePracticeSessionStatus(nextCard, row.id, 'In Progress')
      setSessionStatuses((current) => ({ ...current, [row.id]: 'In Progress' }))
      setSessionAttempts((current) => ({ ...current, [row.id]: freshAttempt }))
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
      return
    }

    setActiveSessionId(row.id)
    setActiveIndex(0)
    setAnswers(isRetake ? {} : savedAttempt.answers ?? {})
    setTryLaterQuestions(new Set(isRetake ? [] : savedAttempt.tryLaterKeys ?? []))
    setShowSubmitConfirm(false)
    setShowTimeCompletedNotice(false)
    setIsEvaluatingPractice(false)
    setEvaluationStartedAt(0)
    setEvaluationProgress(0)
    setIsPracticeSubmitted(isRetake ? false : finishedStatus || Boolean(savedAttempt.isSubmitted))
    setMode('player')
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
                        <span>{formatCount(section.items.length)} Questions - {formatCount(section.marks)} Marks</span>
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
                      <article
                        key={questionKey}
                        ref={(node) => {
                          if (node) questionCardRefs.current[String(item.index)] = node
                          else delete questionCardRefs.current[String(item.index)]
                        }}
                        className={`start-practice-answer-question ${descriptiveParts.length ? 'is-laq-case' : ''} is-${status} ${isActive ? 'is-active' : ''} ${isPracticeSubmitted && cardEvaluation ? getReviewClassName(cardEvaluation.status) : ''}`}
                        tabIndex={-1}
                      >
                        {descriptiveParts.length ? (
                          <div className="start-practice-laq-parts">
                            <div className="start-practice-laq-case-stem">
                              <strong>
                                <span>{orderedIndex + 1}.</span>
                                Clinical Case Scenario
                              </strong>
                              <p>{getQuestionText(item.question)}</p>
                            </div>
                            {descriptiveParts.map((part, partIndex) => {
                              const partEvaluation = partEvaluations[partIndex]
                              const partAnswer = answers[part.key] ?? ''
                              const feedbackSections = getDescriptiveFeedbackSections({
                                answer: partAnswer,
                                evaluation: partEvaluation,
                                guidance: getAnswerText(part) || getAnswerText(item.question),
                                marks: part.marks,
                              })

                              return (
                              <label className="start-practice-laq-part" key={part.key}>
                                <span>
                                  <strong>{part.label}.</strong>
                                  <p>{part.text}</p>
                                  {isPracticeSubmitted ? (
                                    <b className={`start-practice-review-status ${getReviewClassName(partEvaluation?.status)}`}>
                                      {partEvaluation?.status}
                                    </b>
                                  ) : null}
                                  <em>{isPracticeSubmitted ? `${partEvaluation?.earnedMarks ?? 0} / ${part.marks}` : `${part.marks} Marks`}</em>
                                </span>
                                {isPracticeSubmitted ? (
                                  <p className="start-practice-written-answer">
                                    {partAnswer.trim() || 'No answer written.'}
                                  </p>
                                ) : (
                                  <textarea
                                    rows={7}
                                    value={partAnswer}
                                    placeholder="Type your practice answer here..."
                                    onChange={(event) => setAnswerValue(part.key, event.target.value)}
                                  />
                                )}
                                {isPracticeSubmitted ? (
                                  <div className={`start-practice-review-block is-descriptive-feedback ${partEvaluation?.status === 'Wrong' ? 'is-feedback-wrong' : ''}`}>
                                    {feedbackSections.map((section) => (
                                      <section className={`start-practice-feedback-section ${section.summary ? 'is-summary-row' : ''}`} key={section.heading}>
                                        {section.summary ? (
                                          <>
                                            <p className="start-practice-feedback-summary-item">
                                              <strong>Evaluation Report :</strong>
                                              <span>{section.body}</span>
                                            </p>
                                            <p className="start-practice-feedback-summary-item">
                                              <strong>Status :</strong>
                                              <span className={`start-practice-feedback-status ${getReviewClassName(section.status)}`}>
                                                {section.status}
                                              </span>
                                            </p>
                                          </>
                                        ) : (
                                          <>
                                            <strong>{section.heading}</strong>
                                            {section.body ? <p>{section.body}</p> : null}
                                          </>
                                        )}
                                      </section>
                                    ))}
                                  </div>
                                ) : null}
                              </label>
                              )
                            })}
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
                                  const selectedOptionIndex = findOptionIndexByAnswer(selectedAnswer, visibleOptions)
                                  const isSelected = selectedAnswer === optionKey || selectedOptionIndex === optionIndex
                                  const correctOptionIndex = findOptionIndexByAnswer(correctOptionKey, visibleOptions)
                                  const isCorrect = isPracticeSubmitted && correctOptionIndex === optionIndex
                                  const isWrongSelection = isPracticeSubmitted && isSelected && reviewStatus === 'Wrong'

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
                              item.type === 'MCQ' ? (
                                <div className="start-practice-review-block is-mcq">
                                  <strong>Answer key & rationale</strong>
                                  <p>{cleanRevealAnswerText(getAnswerText(item.question))}</p>
                                </div>
                              ) : (
                                <div className={`start-practice-review-block is-${item.type.toLowerCase()} is-descriptive-feedback ${itemEvaluation?.status === 'Wrong' ? 'is-feedback-wrong' : ''}`}>
                                  {getDescriptiveFeedbackSections({
                                    answer: answers[questionKey] ?? '',
                                    evaluation: itemEvaluation,
                                    guidance: getAnswerText(item.question),
                                    marks: item.marks,
                                  }).map((section) => (
                                    <section className={`start-practice-feedback-section ${section.summary ? 'is-summary-row' : ''}`} key={section.heading}>
                                      {section.summary ? (
                                        <>
                                          <p className="start-practice-feedback-summary-item">
                                            <strong>Evaluation Report :</strong>
                                            <span>{section.body}</span>
                                          </p>
                                          <p className="start-practice-feedback-summary-item">
                                            <strong>Status :</strong>
                                            <span className={`start-practice-feedback-status ${getReviewClassName(section.status)}`}>
                                              {section.status}
                                            </span>
                                          </p>
                                        </>
                                      ) : (
                                        <>
                                          <strong>{section.heading}</strong>
                                          {section.body ? <p>{section.body}</p> : null}
                                        </>
                                      )}
                                    </section>
                                  ))}
                                </div>
                              )
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
                  const reviewClass = getSummaryReviewClass(item)
                  return (
                    <button
                      key={questionKey}
                      type="button"
                      className={`is-${status} ${reviewClass} ${item.index === activeIndex ? 'is-active' : ''}`}
                      onClick={() => focusQuestionCard(item.index)}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
              {!isPracticeSubmitted ? (
                <>
                  <div className="start-practice-summary-legend">
                    <span className="is-answered">Answered</span>
                    <span className="is-try-later">Try Later</span>
                    <span className="is-not-viewed">Not Viewed</span>
                    <span className="is-viewed">Viewed</span>
                  </div>
                  <button
                    type="button"
                    className={`start-practice-summary-try-later ${tryLaterQuestions.has(getQuestionKey(questions[activeIndex], activeIndex)) ? 'is-marked' : ''}`}
                    disabled={isEvaluatingPractice || showTimeCompletedNotice}
                    onClick={() => toggleTryLater(getQuestionKey(questions[activeIndex], activeIndex))}
                  >
                    Try Later
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className={`start-practice-submit-btn ${isPracticeSubmitted ? 'is-reset' : ''}`}
                disabled={!isPracticeSubmitted && (isEvaluatingPractice || showTimeCompletedNotice)}
                onClick={() => {
                  if (isPracticeSubmitted) {
                    openPracticeSession(activeSession, activeSession.isRetakeInProgress ? { resume: true } : { retake: true })
                    return
                  }
                  setShowSubmitConfirm(true)
                }}
              >
                {isPracticeSubmitted ? (activeSession?.isRetakeInProgress ? 'Resume Retake' : 'Retake Practice') : 'Submit Practice'}
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
      >
        <strong id="start-practice-submit-title">Do you want to submit this Practice now?</strong>
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

  const scoreDialog = showScoreDialog ? (
    <div
      className="start-practice-confirm-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeScoreDialog()
      }}
    >
      <div
        className="start-practice-confirm-modal start-practice-score-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-practice-score-title"
      >
        <header className="start-practice-score-head">
          <span>
            <strong id="start-practice-score-title">
              <Trophy size={17} strokeWidth={2.3} />
              Practice Score
            </strong>
          </span>
          <button type="button" onClick={closeScoreDialog} aria-label="Close score">
            <X size={16} strokeWidth={2.4} />
          </button>
        </header>
        <div className="start-practice-score-table-wrap">
          <table className="start-practice-score-table">
            <thead>
              <tr>
                <th>Practice Score</th>
                <th>Date &amp; Time</th>
                <th>MCQ</th>
                <th>SAQs</th>
                <th>LAQs</th>
                <th>Obt. Marks</th>
                <th>Total Marks</th>
              </tr>
            </thead>
            <tbody>
              {scoreRows.length ? scoreRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className={`start-practice-score-attempt-badge ${row.attempt === 'Recent Attempt' ? 'is-recent' : ''}`}>
                      {row.attempt}
                    </span>
                  </td>
                  <td>{row.dateTime}</td>
                  <td>{row.mcq}</td>
                  <td>{row.saqs}</td>
                  <td>{row.laqs}</td>
                  <td>{row.obtained}</td>
                  <td>{row.total}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7">No score is available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button type="button" className="start-practice-score-close" onClick={closeScoreDialog}>
          Close
        </button>
      </div>
    </div>
  ) : null

  return (
    <section className="vx-content assessment-page start-practice-page">
      <div className="start-practice-shell">
        <header className={`start-practice-title-bar ${mode === 'player' ? 'is-player-header' : ''}`}>
          <div className="start-practice-title-main">
            <button type="button" className="start-practice-title-back" aria-label="Home" title="Home" onClick={() => {
              if (mode === 'player') {
                if (!isReviewingAttempt && !isPracticeSubmitted) {
                  setShowLeaveConfirm(true)
                  return
                }
                setMode('sessions')
                return
              }
              clearStartPracticePageState()
              onNavigate?.(APP_PAGES.LEARN_PRACTICE)
            }}>
              <Home size={15} strokeWidth={2.3} />
            </button>
            <strong className="start-practice-competency-badge" tabIndex={0}>
              {selectedCard.competencyCode}
              <Info size={11} strokeWidth={2.4} aria-hidden="true" />
              <span role="tooltip">{competencyName}</span>
            </strong>
          </div>
          {mode === 'sessions' ? (
            <div className="start-practice-title-actions">
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
              <button
                type="button"
                className={`start-practice-title-progress ${sessionFilter === 'in-progress' ? 'is-active' : ''} ${sessionFilterCounts.inProgress > 0 ? 'has-live-count' : 'is-empty'}`}
                onClick={() => setSessionFilter('in-progress')}
              >
                Live practice
                <span>{sessionFilterCounts.inProgress}</span>
              </button>
              <button type="button" className="start-practice-title-analytics" onClick={() => {
                const sessions = getPracticeSessions(selectedCard).map((session) => ({
                  ...session,
                  status: sessionStatuses[session.id] || session.status,
                }))
                const card = restoreCompletedPracticeHistory(selectedCard, sessions, getSessionScore, getPracticeSessionTotalMarks)
                setSelectedCard(card)
                persistSelectedPracticeCard(card)
                onOpenAnalytics?.({ card, filter: sessionFilter, page: currentSessionPage })
              }}>
                <BarChart3 size={15} strokeWidth={2.2} />
                View Analytics
              </button>
            </div>
          ) : null}
          {mode === 'player' ? (
            <div className="start-practice-title-meta" aria-label="Practice session summary">
              <span className="start-practice-title-attended">
                <em>Attended</em>
                <strong>{answeredCount} / {questions.length}</strong>
              </span>
              <div className="start-practice-title-totals" aria-label="Practice totals">
                <span><em>Total ques</em><strong>{formatCount(questions.length)}</strong></span>
                <span><em>Total Marks</em><strong>{formatCount(totalMarks)}</strong></span>
              </div>
            </div>
          ) : null}
        </header>

        {mode === 'sessions' ? (
          <section className="start-practice-session-card" aria-label={`${selectedCard.competencyCode} practice sessions`}>
            <div className="start-practice-session-grid" role="table" aria-label="Practice sessions">
              <div className="start-practice-session-grid-head" role="row">
                <span role="columnheader">Practice</span>
                <span role="columnheader">Schedule</span>
                <span role="columnheader">Question mix</span>
                <span role="columnheader">Status</span>
                <span role="columnheader">Marks</span>
                <span role="columnheader">Action</span>
              </div>
              {paginatedPracticeRows.length ? paginatedPracticeRows.map((row) => {
                const isFinishedRow = row.hasCompletedAttempt || isFinishedPracticeStatus(row.status)

                return (
                <div className={`start-practice-session-row ${isFinishedRow ? 'is-finished' : ''}`} role="row" key={row.id}>
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
                    <span className={`start-practice-status is-${String(row.isRetakeInProgress ? 'Completed' : row.status).toLowerCase().replace(/\s+/g, '-')}`}>
                      {row.isRetakeInProgress ? 'Completed' : row.status}
                    </span>
                  </span>
                  <span className="start-practice-session-marks" role="cell" aria-label={`Marks ${row.marks}`}>
                    {row.marks}
                  </span>
                  <span className="start-practice-session-action" role="cell">
                    <button
                      type="button"
                      className="start-practice-row-score"
                      disabled={!isFinishedRow}
                      onClick={() => {
                        setScoreSessionId(row.id)
                        setShowScoreDialog(true)
                      }}
                    >
                      <Trophy size={13} strokeWidth={2.3} />
                      Score
                    </button>
                    <button
                      type="button"
                      className={`start-practice-row-start ${isFinishedRow ? 'is-view-retake' : ''}`}
                      onClick={() => openPracticeSession(row)}
                    >
                      {isFinishedRow ? (
                        <Eye size={13} strokeWidth={2.4} />
                      ) : (
                        <Play size={13} strokeWidth={2.4} />
                      )}
                      {isFinishedRow ? 'Review' : 'Start'}
                    </button>
                    <button
                      type="button"
                      className="start-practice-row-retake"
                      onClick={() => openPracticeSession(row, row.isRetakeInProgress ? { resume: true } : { retake: true })}
                      disabled={!isFinishedRow}
                    >
                      <RotateCcw size={13} strokeWidth={2.4} />
                      Retake
                    </button>
                  </span>
                </div>
                )
              }) : (
                <div className="start-practice-session-row is-empty" role="row">
                  <span className="start-practice-session-empty" role="cell">No practice sessions match this filter.</span>
                </div>
              )}
            </div>
            <footer className="start-practice-session-footer" aria-label="Practice session pagination">
              <button
                type="button"
                onClick={() => setSessionPage((page) => Math.max(0, page - 1))}
                disabled={currentSessionPage <= 0}
              >
                <ChevronLeft size={15} strokeWidth={2.4} />
                Previous
              </button>
              <span>Page {visiblePracticeRows.length ? currentSessionPage + 1 : 0} of {visiblePracticeRows.length ? sessionPageCount : 0}</span>
              <button
                type="button"
                onClick={() => setSessionPage((page) => Math.min(sessionPageCount - 1, page + 1))}
                disabled={currentSessionPage >= sessionPageCount - 1 || !visiblePracticeRows.length}
              >
                Next
                <ChevronRight size={15} strokeWidth={2.4} />
              </button>
            </footer>
          </section>
        ) : renderPracticePlayer()}
      </div>

      {submitConfirmationDialog ? createPortal(submitConfirmationDialog, document.body) : null}
      {showLeaveConfirm && !isPracticeSubmitted && !showTimeCompletedNotice && !isEvaluatingPractice ? (
        <PracticeLeaveDialog
          onClose={() => setShowLeaveConfirm(false)}
          onSave={() => {
            const nextCard = updatePracticeSessionInCard(selectedCard, activeSessionTimeoutKey, {
              practiceAnswers: answers,
              practiceTryLaterKeys: Array.from(tryLaterQuestions),
              practiceSubmitted: false,
            })
            setSelectedCard(nextCard)
            persistSelectedPracticeCard(nextCard)
            setShowLeaveConfirm(false)
            setMode('sessions')
          }}
        />
      ) : null}
      {timeCompletedDialog ? createPortal(timeCompletedDialog, document.body) : null}
      {scoreDialog ? createPortal(scoreDialog, document.body) : null}
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
