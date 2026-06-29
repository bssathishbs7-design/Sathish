import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowLeft, Award, Ban, BatteryCharging, BellOff, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileText, Hand, Hash, Info, ListChecks, Monitor, Moon, ShieldCheck, Sun, Timer, Wifi, X } from 'lucide-react'
import { APP_PAGES } from '../config/appPages'
import '../styles/assessment-pages.css'

const ONLINE_PROCTORED_EXAM_STORAGE_KEY = 'vx-online-proctored-exam-assessment'
const ASSESSMENT_PUBLISHED_STORAGE_KEY = 'vx-assessment-published'
const CREATE_ASSESSMENT_SECTION_TITLES_KEY = 'vx-create-assessment-section-titles'
const CREATE_ASSESSMENT_SECTION_ORDER_KEY = 'vx-create-assessment-section-order'
const CREATE_ASSESSMENT_CUSTOM_SECTIONS_KEY = 'vx-create-assessment-custom-sections'
const STUDENT_EXAM_TIME_EXTENSIONS_KEY = 'vx-student-exam-time-extensions'
const STUDENT_EXAM_TIME_EXTENSION_EVENT = 'vx-student-exam-time-extension-changed'
const STUDENT_EXAM_SUBMISSION_STATUS_KEY = 'vx-student-exam-submission-status'
const STUDENT_EXAM_SUBMISSION_STATUS_EVENT = 'vx-student-exam-submission-status-changed'
const STUDENT_EXAM_SESSION_KEY = 'vx-student-exam-session'
const STUDENT_EXAM_SESSION_EVENT = 'vx-student-exam-session-changed'
const STUDENT_EXAM_RESET_KEY = 'vx-student-exam-reset-state'
const STUDENT_EXAM_RESET_EVENT = 'vx-student-exam-reset-changed'
const EXAM_CONTROLS_STATE_KEY = 'vx-exam-controls-state'
const EXAM_CONTROLS_STATE_CHANGED_EVENT = 'vx-exam-controls-state-changed'
const ONLINE_PROCTORED_ATTEMPT_STORAGE_KEY = 'vx-online-proctored-exam-attempts'
const ASSESSMENT_PUBLISHED_CHANGED_EVENT = 'vx-assessment-published-changed'
const CURRENT_STUDENT_ID = 'MC2568'
const PROCTOR_WARNING_LABEL = 'Security Violation'
const PROCTOR_PENALTY_SECONDS = 10
const PROCTOR_LOCK_SECONDS = 30
const PROCTOR_VIOLATION_COOLDOWN_MS = 650
const PROCTOR_TOP_EDGE_GUARD_PX = 18
const EXAM_HEARTBEAT_INTERVAL_MS = 5000
const PREVIEW_SECTION_CONFIG = [
  { key: 'MCQ', defaultTitle: 'Multiple Choice Question' },
  { key: 'SAQs', defaultTitle: 'Short Answer Questions' },
  { key: 'MEQs', defaultTitle: 'Modified Essay Questions' },
  { key: 'LAQs', defaultTitle: 'Long Answer Questions' },
]
const PREVIEW_SECTION_KEY_SET = new Set(PREVIEW_SECTION_CONFIG.map((section) => section.key))

const readSelectedAssessment = () => {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(ONLINE_PROCTORED_EXAM_STORAGE_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const getAssessmentId = (assessment) => (
  assessment?.id || assessment?.assessmentId || assessment?.setup?.assessmentId || 'selected-assessment'
)

const readStudentTimeExtension = (assessment, studentId = CURRENT_STUDENT_ID) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STUDENT_EXAM_TIME_EXTENSIONS_KEY) || 'null')
    const assessmentExtensions = parsed?.[getAssessmentId(assessment)]
    const studentExtension = assessmentExtensions?.[studentId]
    return studentExtension && typeof studentExtension === 'object' ? studentExtension : {}
  } catch {
    return {}
  }
}

const readStudentExamReset = (assessment, studentId = CURRENT_STUDENT_ID) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STUDENT_EXAM_RESET_KEY) || 'null')
    const reset = parsed?.[getAssessmentId(assessment)]?.[studentId]
    return reset && typeof reset === 'object' ? reset : null
  } catch {
    return null
  }
}

const readExamControlsState = (assessmentId) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(`${EXAM_CONTROLS_STATE_KEY}:${assessmentId}`) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeExamControlsState = (assessment, studentId, stateUpdater) => {
  const assessmentId = getAssessmentId(assessment)
  try {
    const parsed = readExamControlsState(assessmentId)
    const currentState = parsed[studentId] || {}
    const nextState = typeof stateUpdater === 'function'
      ? stateUpdater(currentState)
      : stateUpdater

    const nextParsed = {
      ...parsed,
      [studentId]: {
        ...currentState,
        ...nextState,
        updatedAt: new Date().toISOString(),
      },
    }

    window.localStorage.setItem(`${EXAM_CONTROLS_STATE_KEY}:${assessmentId}`, JSON.stringify(nextParsed))
    window.dispatchEvent(new CustomEvent(EXAM_CONTROLS_STATE_CHANGED_EVENT, {
      detail: { assessmentId, studentId },
    }))
  } catch {
    // Best-effort write so exams are not blocked by local storage failure.
  }
}

const formatCompactTime = (value) => (
  value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '-'
)

const appendStudentViolationLog = (assessment, studentId, remarks) => {
  const assessmentId = getAssessmentId(assessment)
  if (!assessmentId || !studentId) return

  writeExamControlsState(assessment, studentId, (current) => {
    const nextCount = Number(current.violationCount || 0) + 1
    const nextLog = {
      id: `${studentId}-${Date.now()}`,
      time: formatCompactTime(new Date()),
      action: PROCTOR_WARNING_LABEL,
      remarks,
      faculty: 'System',
      ruleNumber: nextCount,
    }

    return {
      ...current,
      violationCount: nextCount,
      overallStatus: 'In progress',
      logs: [nextLog, ...(current.logs || [])],
      lastViolationAt: new Date().toISOString(),
    }
  })
}

const appendStudentMonitoringLog = (assessment, studentId, remarks, action = 'Monitoring Event') => {
  const assessmentId = getAssessmentId(assessment)
  if (!assessmentId || !studentId) return

  writeExamControlsState(assessment, studentId, (current) => {
    const nextLog = {
      id: `${studentId}-monitor-${Date.now()}`,
      time: formatCompactTime(new Date()),
      action,
      remarks,
      faculty: 'System',
    }

    return {
      ...current,
      logs: [nextLog, ...(current.logs || [])],
      lastMonitoringEventAt: new Date().toISOString(),
    }
  })
}

const writeStudentExamHeartbeat = (assessment, studentId, state) => {
  const assessmentId = getAssessmentId(assessment)
  if (!assessmentId || !studentId) return

  writeExamControlsState(assessment, studentId, (current) => ({
    ...current,
    heartbeat: {
      ...(current.heartbeat || {}),
      ...state,
      lastHeartbeatAt: new Date().toISOString(),
    },
    overallStatus: state.isSubmitted
      ? 'Completed'
      : state.isPaused
        ? 'Paused'
        : 'In progress',
  }))
}

const readStoredAttempt = (assessment, studentId = CURRENT_STUDENT_ID) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ONLINE_PROCTORED_ATTEMPT_STORAGE_KEY) || 'null')
    const attempt = parsed?.[getAssessmentId(assessment)]?.[studentId]
    return attempt && typeof attempt === 'object' ? attempt : null
  } catch {
    return null
  }
}

const getInitialStoredAttempt = (assessment, studentId = CURRENT_STUDENT_ID) => {
  const attempt = readStoredAttempt(assessment, studentId)
  const reset = readStudentExamReset(assessment, studentId)
  if (!reset?.version) return attempt
  if (attempt?.appliedResetVersion === reset.version) return attempt
  if (reset.mode === 'clear') return { appliedResetVersion: reset.version }
  return {
    ...(attempt || {}),
    hasStarted: false,
    examStartedAt: null,
    activeSequenceStartedAt: null,
    isMcqSubmitted: false,
    isDescriptiveSubmitted: false,
    isAssessmentSubmitted: false,
    appliedResetVersion: reset.version,
  }
}

const writeStoredAttempt = (assessment, attempt, studentId = CURRENT_STUDENT_ID) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ONLINE_PROCTORED_ATTEMPT_STORAGE_KEY) || 'null')
    const attempts = parsed && typeof parsed === 'object' ? parsed : {}
    const assessmentId = getAssessmentId(assessment)
    const assessmentAttempts = attempts[assessmentId] || {}
    window.localStorage.setItem(ONLINE_PROCTORED_ATTEMPT_STORAGE_KEY, JSON.stringify({
      ...attempts,
      [assessmentId]: {
        ...assessmentAttempts,
        [studentId]: {
          ...attempt,
          updatedAt: new Date().toISOString(),
        },
      },
    }))
  } catch {
    // Attempt restore is best-effort.
  }
}

const writeStudentSubmissionStatus = (assessment, status, studentId = CURRENT_STUDENT_ID) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STUDENT_EXAM_SUBMISSION_STATUS_KEY) || 'null')
    const statuses = parsed && typeof parsed === 'object' ? parsed : {}
    const assessmentId = getAssessmentId(assessment)
    const assessmentStatuses = statuses[assessmentId] || {}
    const nextStatuses = {
      ...statuses,
      [assessmentId]: {
        ...assessmentStatuses,
        [studentId]: {
          status,
          updatedAt: new Date().toISOString(),
        },
      },
    }

    window.localStorage.setItem(STUDENT_EXAM_SUBMISSION_STATUS_KEY, JSON.stringify(nextStatuses))
    window.dispatchEvent(new CustomEvent(STUDENT_EXAM_SUBMISSION_STATUS_EVENT, {
      detail: { assessmentId, studentId, status },
    }))
  } catch {
    // Submission status sharing is best-effort for the faculty controls page.
  }
}

const writeStudentExamSession = (assessment, loginTime, studentId = CURRENT_STUDENT_ID) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STUDENT_EXAM_SESSION_KEY) || 'null')
    const sessions = parsed && typeof parsed === 'object' ? parsed : {}
    const assessmentId = getAssessmentId(assessment)
    const assessmentSessions = sessions[assessmentId] || {}
    const nextSessions = {
      ...sessions,
      [assessmentId]: {
        ...assessmentSessions,
        [studentId]: {
          ...(assessmentSessions[studentId] || {}),
          loginTime: new Date(loginTime).toISOString(),
          examType: 'Proctored',
          attendance: 'P',
          updatedAt: new Date().toISOString(),
        },
      },
    }

    window.localStorage.setItem(STUDENT_EXAM_SESSION_KEY, JSON.stringify(nextSessions))
    window.dispatchEvent(new CustomEvent(STUDENT_EXAM_SESSION_EVENT, {
      detail: { assessmentId, studentId, loginTime },
    }))
  } catch {
    // Session sharing is best-effort for the faculty controls page.
  }
}

const stripHtml = (value) => String(value ?? '')
  .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
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
  stripHtml(question?.questionText)
  || stripHtml(question?.title)
  || stripHtml(question?.question)
  || 'Question text not available'
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

const formatMarksLabel = (value) => {
  const marks = getMarks(value)
  return marks === '-' ? '- Marks' : `${String(marks).padStart(2, '0')} Marks`
}

const hasVisibleMarks = (value) => {
  const text = String(value ?? '').trim()
  return text !== '' && text !== '-' && Number(text) !== 0
}

const getNumericMarks = (value) => {
  const marks = Number(getMarks(value))
  return Number.isFinite(marks) ? marks : 0
}

const parseMarksValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getQuestionMarksTotal = (question) => {
  if (!isDescriptiveQuestionType(question?.type)) {
    if (question?.type === 'MCQ' && !parseMarksValue(question?.marks)) return 1
    return parseMarksValue(getMarks(question))
  }

  const sections = Array.isArray(question?.descriptiveSections) ? question.descriptiveSections : []
  const sectionMarks = sections.reduce((total, section) => {
    const children = Array.isArray(section.children) ? section.children : []
    const childMarks = children.reduce((sum, child) => sum + parseMarksValue(child.marks), 0)
    const ownMarks = children.length ? 0 : parseMarksValue(section.marks)
    return total + ownMarks + childMarks
  }, 0)

  return (sections.length ? 0 : parseMarksValue(question?.marks)) + sectionMarks
}

const formatQuestionMarksBadge = (question) => {
  const totalMarks = getQuestionMarksTotal(question)
  if (totalMarks > 0) return `${totalMarks} Marks`

  const marks = getMarks(question)
  return marks === '-' ? '- Marks' : `${marks} Marks`
}

const renderQuestionImages = (images, className = '', onPreview, isDisabled = false) => (
  Array.isArray(images) && images.length ? (
    <div className={`online-practice-question-images ${className}`.trim()} aria-label="Question images">
      {images.map((image, imageIndex) => (
        <figure key={image.id ?? `${image.name || 'image'}-${imageIndex}`}>
          <span>{String.fromCharCode(65 + imageIndex)}</span>
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => onPreview?.(images, imageIndex)}
            aria-label={`Preview question image ${String.fromCharCode(65 + imageIndex)}`}
          >
            <img src={image.url} alt={image.name || `Question image ${imageIndex + 1}`} />
          </button>
        </figure>
      ))}
    </div>
  ) : null
)

const toRoman = (value) => {
  const numerals = [
    ['X', 10],
    ['IX', 9],
    ['V', 5],
    ['IV', 4],
    ['I', 1],
  ]
  let remaining = Math.max(1, value)
  let output = ''

  numerals.forEach(([symbol, amount]) => {
    while (remaining >= amount) {
      output += symbol
      remaining -= amount
    }
  })

  return output
}

const toLowerRoman = (value) => toRoman(value).toLowerCase()

const isCustomPreviewSectionKey = (key) => String(key ?? '').startsWith('custom-section-')

const getSummaryTypeLabel = (type) => {
  if (type === 'MCQ') return 'MCQ'
  if (String(type).includes('MEQs')) return 'MEQs'
  if (String(type).includes('LAQs')) return 'LAQs'
  if (String(type).includes('SAQs') || type === 'Descriptive Question') return 'SAQs'
  return type || 'Question'
}

const getPreviewSectionKey = (item) => (
  PREVIEW_SECTION_KEY_SET.has(item?.previewSectionKey) || isCustomPreviewSectionKey(item?.previewSectionKey)
    ? item.previewSectionKey
    : getSummaryTypeLabel(item?.type)
)

const getAssessmentStorageSuffix = (setup = {}) => {
  if (setup.assessmentId) return String(setup.assessmentId)
  const signature = [
    setup.collegeName,
    setup.assessmentName,
    setup.academicYear,
    setup.examCategory,
    setup.course,
    setup.year,
  ].filter(Boolean).join('|')
  return signature ? signature.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'draft'
}

const readJsonStorage = (key, fallback) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || 'null')
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

const getPreviewSectionTitles = (setup = {}) => {
  const suffix = getAssessmentStorageSuffix(setup)
  const defaults = PREVIEW_SECTION_CONFIG.reduce((titles, section) => ({
    ...titles,
    [section.key]: section.defaultTitle,
  }), {})
  const customSections = readJsonStorage(`${CREATE_ASSESSMENT_CUSTOM_SECTIONS_KEY}:${suffix}`, [])
  const customTitles = Array.isArray(customSections)
    ? Object.fromEntries(customSections.map((section) => [
      section.key,
      section.title || section.defaultTitle || 'New Section',
    ]))
    : {}
  const savedTitles = readJsonStorage(`${CREATE_ASSESSMENT_SECTION_TITLES_KEY}:${suffix}`, {})

  return {
    ...defaults,
    ...customTitles,
    ...(savedTitles && typeof savedTitles === 'object' ? savedTitles : {}),
  }
}

const getPreviewSectionOrder = (setup = {}, questions = []) => {
  const suffix = getAssessmentStorageSuffix(setup)
  const defaultOrder = PREVIEW_SECTION_CONFIG.map((section) => section.key)
  const savedOrder = readJsonStorage(`${CREATE_ASSESSMENT_SECTION_ORDER_KEY}:${suffix}`, [])
  const questionKeys = questions.map(getPreviewSectionKey).filter(Boolean)
  const orderedKeys = Array.isArray(savedOrder) ? savedOrder : []

  return [
    ...orderedKeys,
    ...defaultOrder,
    ...questionKeys,
  ].filter((key, index, rows) => rows.indexOf(key) === index)
}

const getPreviewOrderedQuestionNumbers = (setup = {}, questions = []) => {
  const sectionOrder = getPreviewSectionOrder(setup, questions)
  const numbers = {}
  let displayNumber = 1

  sectionOrder.forEach((sectionKey) => {
    questions
      .filter((question) => getPreviewSectionKey(question) === sectionKey)
      .forEach((question, index) => {
        const globalIndex = questions.indexOf(question)
        numbers[question.id ?? `${sectionKey}-${globalIndex}`] = displayNumber
        displayNumber += 1
      })
  })

  return numbers
}

const getPreviewSectionToneClass = (key) => {
  if (key === 'MCQ') return 'type-mcq'
  if (key === 'SAQs') return 'type-saqs'
  if (key === 'MEQs') return 'type-meqs'
  if (key === 'LAQs') return 'type-laqs'
  if (isCustomPreviewSectionKey(key)) return 'type-custom'
  return 'type-custom'
}

const getDescriptiveSectionTitle = (type) => {
  const normalized = String(type || 'Descriptive Questions')
    .replace(/\bSAQs?\b/gi, '')
    .replace(/\bDirect\b/gi, 'Direct')
    .replace(/\bModified\s+Essay\b/gi, 'Essay')
    .replace(/\bDescriptive\s+Question\b/gi, 'Descriptive Questions')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized || 'Descriptive Questions'
}

const getDescriptiveSubQuestions = (question) => {
  const sections = Array.isArray(question?.descriptiveSections) ? question.descriptiveSections : []
  if (sections.length) return sections
  const subQuestions = Array.isArray(question?.subQuestions) ? question.subQuestions : []
  if (subQuestions.length) return subQuestions
  return []
}

const getInstructionLines = (value) => stripHtml(value)
  .split(/\n+|(?:\s*•\s*)/)
  .map((line) => line.trim())
  .filter(Boolean)

const isInAppWebview = () => {
  const userAgent = window.navigator.userAgent || ''
  return /FBAN|FBAV|FB_IAB|Instagram|Line|MicroMessenger|WhatsApp|Telegram|Discord|LinkedInApp|Snapchat|TikTok|WeChat|Pinterest/i.test(userAgent)
}

const isMobileDevice = () => {
  const userAgent = window.navigator.userAgent || ''
  return /Android(?!.*\bTablet\b)|iPhone|iPod|Windows Phone|BlackBerry|IEMobile|Kindle|Silk/i.test(userAgent)
}

const isTabletDevice = () => {
  const userAgent = window.navigator.userAgent || ''
  return /iPad|Android(?!.*Mobi)|Tablet|PlayBook|Surface|Nexus 7|Nexus 10|SM-T|Kindle/i.test(userAgent)
}

const isMobileOrTabletDevice = () => isMobileDevice() || isTabletDevice()

const isPwaStandalone = () => (
  (window.matchMedia && (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches))
  || window.navigator.standalone === true
)

const hasFullscreenSupport = () => (
  Boolean(window.document?.documentElement?.requestFullscreen) && window.document.fullscreenEnabled !== false
)

const EXAM_KEYBOARD_LOCK_KEYS = [
  'Escape',
  'Tab',
  'AltLeft',
  'AltRight',
  'ControlLeft',
  'ControlRight',
  'ShiftLeft',
  'ShiftRight',
  'MetaLeft',
  'MetaRight',
  'ContextMenu',
  'PrintScreen',
  'ScrollLock',
  'Pause',
  'Insert',
  'Delete',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Enter',
  'Space',
  'Backspace',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
]

const requestExamFullscreen = async () => {
  if (!document.documentElement.requestFullscreen || document.fullscreenElement) return
  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
  } catch {
    await document.documentElement.requestFullscreen()
  }
}

const requestExamKeyboardLock = async () => {
  if (!window.navigator?.keyboard?.lock) return
  try {
    await window.navigator.keyboard.lock()
    return
  } catch {
    // Fall back to an explicit lock list when the browser rejects a broad lock.
  }

  try {
    await window.navigator.keyboard.lock(EXAM_KEYBOARD_LOCK_KEYS)
  } catch {
    // Keyboard Lock is browser-dependent and only works in supported fullscreen contexts.
  }
}

const releaseExamKeyboardLock = () => {
  try {
    window.navigator?.keyboard?.unlock?.()
  } catch {
    // Ignore unsupported browser cleanup.
  }
}

const blockExamKeyboardEvent = (event) => {
  event.preventDefault()
  event.stopPropagation()
  if (typeof event.stopImmediatePropagation === 'function') {
    event.stopImmediatePropagation()
  }
}

const isTextInputTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'))
}

const detectMultiMonitorSetup = () => {
  if (!window.screen || typeof window.screen.availLeft !== 'number') return false
  return window.screen.availLeft !== 0 || window.screen.availTop !== 0
}

const isRestrictedProctorEnvironment = () => {
  if (isInAppWebview()) return 'Please open the proctored exam in a standard browser session.'
  if (!isMobileOrTabletDevice() && !hasFullscreenSupport()) return 'Launch this proctored exam in fullscreen/PWA mode.'
  if (detectMultiMonitorSetup()) return 'More than one display is detected. Use one screen for the exam.'
  return ''
}

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

const getDescriptiveSectionDomId = (key) => `online-practice-desc-${String(key || 'section').replace(/[^a-zA-Z0-9_-]/g, '-')}`
const getMcqQuestionKey = (question, index) => String(question?.id ?? `mcq-${index}`)
const isAnswerInputMode = (value) => String(value || '').toLowerCase().includes('answer')
const isOnlineProctoredAssessment = (assessment) => (
  String(assessment?.examMode || '').toLowerCase() === 'online'
  && String(assessment?.supervisionType || '').toLowerCase().includes('proctored')
)

function OnlineProctoredExamPage({ onExit, theme = 'light', onToggleTheme }) {
  const [assessment] = useState(readSelectedAssessment)
  const [initialAttempt] = useState(() => getInitialStoredAttempt(assessment) || {})
  const [hasAgreed, setHasAgreed] = useState(false)
  const [hasStarted, setHasStarted] = useState(Boolean(initialAttempt.hasStarted))
  const [examStartedAt, setExamStartedAt] = useState(initialAttempt.examStartedAt || null)
  const [activeSequenceStartedAt, setActiveSequenceStartedAt] = useState(initialAttempt.activeSequenceStartedAt || null)
  const [timerNow, setTimerNow] = useState(Date.now())
  const [activeSection, setActiveSection] = useState(initialAttempt.activeSection || 'mcq')
  const [activeDescriptiveGroupKey, setActiveDescriptiveGroupKey] = useState(initialAttempt.activeDescriptiveGroupKey || '')
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(Number(initialAttempt.activeQuestionIndex || 0))
  const [answers, setAnswers] = useState(initialAttempt.answers || {})
  const [mcqQuestionStatuses, setMcqQuestionStatuses] = useState(initialAttempt.mcqQuestionStatuses || {})
  const [descriptiveAnswers, setDescriptiveAnswers] = useState(initialAttempt.descriptiveAnswers || {})
  const [submitModal, setSubmitModal] = useState(null)
  const [isMcqSubmitted, setIsMcqSubmitted] = useState(Boolean(initialAttempt.isMcqSubmitted))
  const [isDescriptiveSubmitted, setIsDescriptiveSubmitted] = useState(Boolean(initialAttempt.isDescriptiveSubmitted))
  const [isAssessmentSubmitted, setIsAssessmentSubmitted] = useState(Boolean(initialAttempt.isAssessmentSubmitted))
  const [appliedResetVersion, setAppliedResetVersion] = useState(Number(initialAttempt.appliedResetVersion || 0))
  const [isExitModalOpen, setIsExitModalOpen] = useState(false)
  const [isTimeLimitModalOpen, setIsTimeLimitModalOpen] = useState(false)
  const [sequenceAutoNotice, setSequenceAutoNotice] = useState('')
  const [sequenceTransitionModal, setSequenceTransitionModal] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [fullscreenError, setFullscreenError] = useState('')
  const [isFullscreenMode, setIsFullscreenMode] = useState(false)
  const [examPause, setExamPause] = useState({
    active: false,
    message: '',
    requiresFullscreen: false,
  })
  const [environmentRestrictionMessage, setEnvironmentRestrictionMessage] = useState(() => isRestrictedProctorEnvironment())
  const [timeExtension, setTimeExtension] = useState(() => readStudentTimeExtension(assessment))
  const [proctorViolation, setProctorViolation] = useState({
    count: 0,
    phase: 'idle',
    message: '',
    endsAt: 0,
    showFullscreenLock: false,
  })
  const [isAutoExitAfterViolation, setIsAutoExitAfterViolation] = useState(false)
  const violationCooldownRef = useRef(0)
  const isIntentionalFullscreenExitRef = useRef(false)
  const browserClosePromptRef = useRef(false)
  const fullscreenRestoreTimerRef = useRef(null)
  const lastMonitoringEventRef = useRef('')

  const questionRows = Array.isArray(assessment?.questionRows) ? assessment.questionRows : []
  const mcqQuestions = useMemo(() => questionRows.filter((item) => item?.type === 'MCQ'), [questionRows])
  const descriptiveQuestions = useMemo(() => questionRows.filter((item) => isDescriptiveQuestionType(item?.type)), [questionRows])
  const mcqTotalMarks = useMemo(() => (
    mcqQuestions.reduce((sum, question) => sum + getQuestionMarksTotal(question), 0)
  ), [mcqQuestions])
  const currentQuestions = activeSection === 'mcq' ? mcqQuestions : descriptiveQuestions
  const currentQuestion = currentQuestions[activeQuestionIndex] ?? null
  const setup = assessment?.setup ?? {}
  const examTypeValue = String(assessment?.examType || setup.examType || 'Hybrid').toLowerCase()
  const hasMcqSection = mcqQuestions.length > 0 && examTypeValue !== 'descriptive'
  const hasDescriptiveSection = descriptiveQuestions.length > 0 && examTypeValue !== 'mcq'
  const isProctoredFlowAssessment = isOnlineProctoredAssessment(assessment)
  const previewQuestionDisplayNumbers = useMemo(() => (
    getPreviewOrderedQuestionNumbers(setup, questionRows)
  ), [questionRows, setup])
  const currentQuestionDisplayNumber = currentQuestion
    ? previewQuestionDisplayNumbers[currentQuestion.id ?? `${getPreviewSectionKey(currentQuestion)}-${questionRows.indexOf(currentQuestion)}`] ?? activeQuestionIndex + 1
    : activeQuestionIndex + 1
  const descriptiveGroups = useMemo(() => {
    const titleMap = getPreviewSectionTitles(setup)
    const sectionOrder = getPreviewSectionOrder(setup, questionRows)
    const groupsByKey = new Map()

    descriptiveQuestions.forEach((question) => {
      const sectionKey = getPreviewSectionKey(question)
      const title = titleMap[sectionKey] || getDescriptiveSectionTitle(question?.type)
      const existing = groupsByKey.get(sectionKey)
      if (existing) {
        existing.questions.push(question)
        existing.totalMarks += getQuestionMarksTotal(question)
        return
      }

      groupsByKey.set(sectionKey, {
        key: sectionKey,
        title,
        totalMarks: getQuestionMarksTotal(question),
        questions: [question],
      })
    })

    const visibleSectionOrder = sectionOrder.filter((key) => (
      (key === 'MCQ' && hasMcqSection) || groupsByKey.has(key)
    ))

    return [...groupsByKey.values()]
      .sort((first, second) => sectionOrder.indexOf(first.key) - sectionOrder.indexOf(second.key))
      .map((group) => ({
        ...group,
        roman: `${toRoman(visibleSectionOrder.indexOf(group.key) + 1)}.`,
        toneClass: getPreviewSectionToneClass(group.key),
      }))
  }, [descriptiveQuestions, hasMcqSection, questionRows, setup])
  const descriptiveTotalMarks = useMemo(() => (
    descriptiveGroups.reduce((sum, group) => sum + group.totalMarks, 0)
  ), [descriptiveGroups])
  const mcqSectionTitle = getPreviewSectionTitles(setup).MCQ || 'Multiple Choice Question'
  const mcqSectionRoman = useMemo(() => {
    const sectionOrder = getPreviewSectionOrder(setup, questionRows)
    const mcqIndex = sectionOrder
      .filter((key) => (key === 'MCQ' && hasMcqSection) || descriptiveGroups.some((group) => group.key === key))
      .indexOf('MCQ')
    return `${toRoman(Math.max(0, mcqIndex) + 1)}.`
  }, [descriptiveGroups, hasMcqSection, questionRows, setup])
  const attendedMcqCount = useMemo(() => (
    mcqQuestions.filter((question, index) => (
      mcqQuestionStatuses[getMcqQuestionKey(question, index)] === 'answered'
    )).length
  ), [mcqQuestionStatuses, mcqQuestions])
  const mcqAllowsAnswerInput = isAnswerInputMode(setup.mcqDisplayType || assessment?.mcqDisplayType || 'Answer Input')
  const descriptiveAllowsAnswerInput = isAnswerInputMode(setup.descriptiveDisplayType || assessment?.descriptiveDisplayType || 'Read-Only')
  const isMcqLocked = isMcqSubmitted || isAssessmentSubmitted
  const isDescriptiveLocked = isDescriptiveSubmitted || isAssessmentSubmitted
  const isFullscreenRequiredForDevice = !isMobileOrTabletDevice()
  const isKeyboardLockedForExam = hasStarted && !isAssessmentSubmitted
  const isExamPaused = examPause.active && hasStarted && !isAssessmentSubmitted
  const proctorViolationRemainingSeconds = proctorViolation.endsAt ? Math.max(0, Math.ceil((proctorViolation.endsAt - timerNow) / 1000)) : 0
  const isProctorPenaltyOrLock = proctorViolation.phase === 'penalty' || proctorViolation.phase === 'lock'
  const shouldBlockProctoringActions = isProctoredFlowAssessment
    && hasStarted
    && !isAssessmentSubmitted
    && (isExamPaused || proctorViolation.phase === 'warning' || isProctorPenaltyOrLock || proctorViolation.phase === 'auto-submitted')
  const isProctorViolationActive = shouldBlockProctoringActions || proctorViolation.phase === 'warning' || proctorViolation.phase === 'auto-submitted'
  const shouldShowFullscreenViolation = hasStarted && !isAssessmentSubmitted
    && proctorViolation.phase !== 'idle'
    && proctorViolation.showFullscreenLock
  const shouldShowExamPauseOverlay = isExamPaused
  const isExamActionLocked = isExamPaused || isProctorViolationActive || proctorViolation.phase === 'auto-submitted'
  const hasPendingMcq = hasMcqSection && !isMcqSubmitted
  const hasPendingDescriptive = hasDescriptiveSection && !isDescriptiveSubmitted
  const hasPendingSections = hasPendingMcq || hasPendingDescriptive
  const isSplitProctoredFlow = Boolean(isProctoredFlowAssessment && hasMcqSection && hasDescriptiveSection && setup.splitProctoredDuration)
  const shouldShowSectionTabs = Boolean(hasMcqSection && hasDescriptiveSection && !isSplitProctoredFlow)
  const firstSplitSection = setup.proctoredSectionSequence === 'descriptive-first' ? 'descriptive' : 'mcq'
  const splitSequenceSections = isSplitProctoredFlow
    ? [firstSplitSection, firstSplitSection === 'descriptive' ? 'mcq' : 'descriptive']
    : []
  const splitSequenceFirst = splitSequenceSections[0]
  const splitSequenceSecond = splitSequenceSections[1]
  const isSplitSectionCompleted = (section) => (
    section === 'mcq'
      ? isMcqSubmitted
      : section === 'descriptive'
        ? isDescriptiveSubmitted
        : false
  )
  const isSectionAccessibleInSequence = (section) => {
    if (!isProctoredFlowAssessment) return false
    if (!isSplitProctoredFlow) {
      return (
        (section === 'mcq' && hasMcqSection)
        || (section === 'descriptive' && hasDescriptiveSection)
      )
    }

    if (section === splitSequenceFirst) return true
    return Boolean(splitSequenceSecond === section && isSplitSectionCompleted(splitSequenceFirst))
  }
  const isMcqFinalSubmit = activeSection === 'mcq' && hasPendingMcq && !hasPendingDescriptive
  const isDescriptiveFinalSubmit = activeSection === 'descriptive' && hasPendingDescriptive && !hasPendingMcq
  const splitSectionSubmitLabel = (section) => (
    isSplitProctoredFlow
      ? 'Submit Assessment'
      : section === 'mcq'
        ? isMcqFinalSubmit ? 'Submit Assessment' : 'Submit MCQ Assessment'
        : isDescriptiveFinalSubmit ? 'Submit Assessment' : 'Submit Descriptive Assessment'
  )
  const activeSequenceLabel = activeSection === 'mcq' ? 'MCQ' : 'Descriptive'
  const shouldShowMcqSubmit = activeSection === 'mcq' && hasPendingMcq
  const shouldShowDescriptiveSubmit = activeSection === 'descriptive' && hasPendingDescriptive
  const shouldShowFinalSubmit = hasStarted
    && (hasMcqSection || hasDescriptiveSection)
    && !isAssessmentSubmitted
    && !hasPendingSections
    && !shouldShowMcqSubmit
    && !shouldShowDescriptiveSubmit
  const headerLogo = setup.logoPreview || assessment?.logoPreview || ''
  const ThemeIcon = theme === 'dark' ? Sun : Moon
  const studentInstructionLines = getInstructionLines(setup.studentInstructions)
  const canShowStudentInstructions = setup.provideStudentInstructions === 'Yes' && studentInstructionLines.length > 0
  const totalDurationSeconds = useMemo(() => parseDurationToSeconds(assessment?.totalDuration), [assessment?.totalDuration])
  const extensionMinutes = Number(timeExtension?.extensionMinutes || 0)
  const sectionExtensions = timeExtension?.sectionExtensions || {}
  const mcqExtensionMinutes = Number(sectionExtensions.mcq || 0)
  const descriptiveExtensionMinutes = Number(sectionExtensions.descriptive || 0)
  const activeSectionExtensionMinutes = activeSection === 'mcq' ? mcqExtensionMinutes : descriptiveExtensionMinutes
  const effectiveTotalDurationSeconds = totalDurationSeconds + (extensionMinutes * 60)
  const scheduledStartAt = useMemo(() => {
    const startDate = parseAssessmentDate(assessment?.startDate)
    return applyAssessmentTime(startDate, assessment?.startTime)
  }, [assessment?.startDate, assessment?.startTime])
  const scheduledEndAt = useMemo(() => (
    scheduledStartAt && effectiveTotalDurationSeconds
      ? new Date(scheduledStartAt.getTime() + (effectiveTotalDurationSeconds * 1000))
      : null
  ), [scheduledStartAt, effectiveTotalDurationSeconds])
  const isAssessmentLive = Boolean(
    scheduledStartAt
    && scheduledEndAt
    && timerNow >= scheduledStartAt.getTime()
    && timerNow <= scheduledEndAt.getTime()
  )
  const fallbackEndAt = examStartedAt && effectiveTotalDurationSeconds ? examStartedAt + (effectiveTotalDurationSeconds * 1000) : null
  const remainingDurationSeconds = (hasStarted || isAssessmentLive) && effectiveTotalDurationSeconds
    ? Math.max(0, Math.floor(((scheduledEndAt?.getTime() || fallbackEndAt || timerNow) - timerNow) / 1000))
    : effectiveTotalDurationSeconds
  const shouldShowRemainingTime = Boolean((hasStarted || isAssessmentLive) && effectiveTotalDurationSeconds)
  const durationDisplay = shouldShowRemainingTime
    ? formatCountdown(remainingDurationSeconds)
    : assessment?.totalDuration || '-'
  const isTimeLimitCritical = shouldShowRemainingTime && remainingDurationSeconds > 0 && remainingDurationSeconds <= 300
  const mcqSequenceDurationSeconds = useMemo(() => parseDurationToSeconds(setup.mcqTimeLimit), [setup.mcqTimeLimit])
  const descriptiveSequenceDurationSeconds = useMemo(() => parseDurationToSeconds(setup.descriptiveTimeLimit), [setup.descriptiveTimeLimit])
  const activeSequenceDurationSeconds = isSplitProctoredFlow
    ? activeSection === 'mcq'
      ? mcqSequenceDurationSeconds + (mcqExtensionMinutes * 60)
      : descriptiveSequenceDurationSeconds + (descriptiveExtensionMinutes * 60)
    : 0
  const shouldShowSequenceTimer = Boolean(hasStarted && isSplitProctoredFlow && activeSequenceStartedAt && activeSequenceDurationSeconds > 0)
  const activeSequenceRemainingSeconds = shouldShowSequenceTimer
    ? Math.max(0, activeSequenceDurationSeconds - Math.floor((timerNow - activeSequenceStartedAt) / 1000))
    : activeSequenceDurationSeconds
  const activeSequenceTimeDisplay = activeSequenceDurationSeconds > 0 ? formatCountdown(activeSequenceRemainingSeconds) : '-'
  const isSequenceTimeCritical = shouldShowSequenceTimer && activeSequenceRemainingSeconds > 0 && activeSequenceRemainingSeconds <= 300
  const sequenceTransitionRemainingSeconds = sequenceTransitionModal
    ? Math.max(0, 5 - Math.floor((timerNow - sequenceTransitionModal.startedAt) / 1000))
    : 0
  const headerChips = []
  const sideNavMetaItems = [
    { label: 'Type', value: assessment?.examType || '-', tone: 'type' },
    {
      label: shouldShowSequenceTimer || shouldShowRemainingTime ? 'Time Remaining' : 'Duration',
      value: shouldShowSequenceTimer ? activeSequenceTimeDisplay : durationDisplay,
      tone: 'duration',
      isCritical: shouldShowSequenceTimer ? isSequenceTimeCritical : isTimeLimitCritical,
    },
    ...((isSplitProctoredFlow ? activeSectionExtensionMinutes : extensionMinutes) > 0
      ? [{ label: 'Extended', value: `+${isSplitProctoredFlow ? activeSectionExtensionMinutes : extensionMinutes} mins`, tone: 'extended' }]
      : []),
  ]
  const detailItems = [
    { label: 'Total Marks', value: assessment?.totalMarks ?? '-', icon: Award },
    { label: 'Questions', value: assessment?.questionCount ?? questionRows.length, icon: Hash },
    { label: shouldShowRemainingTime ? 'Remaining Time' : 'Total Duration', value: durationDisplay, icon: Timer },
    { label: 'Start Date', value: formatDisplayDate(assessment?.startDate), icon: CalendarDays },
    { label: 'Start Time', value: assessment?.startTime || '-', icon: Clock3 },
    { label: 'End Date', value: formatDisplayDate(assessment?.endDate), icon: CalendarDays },
  ]
  const submitModalCopy = submitModal?.isFinal
    ? {
        title: 'Submit Assessment?',
        message: `You are about to submit the complete proctored assessment for ${assessment?.name || 'this assessment'}. Once confirmed, this assessment will be marked as completed.`,
        success: `${assessment?.name || 'Assessment'} has been completed successfully.`,
      questions: questionRows.length,
      marks: assessment?.totalMarks ?? (mcqTotalMarks + descriptiveTotalMarks),
      answered: null,
    }
    : submitModal?.section === 'descriptive'
      ? {
        title: 'Submit Descriptive Assessment?',
        message: `You are about to submit the descriptive section for ${assessment?.name || 'this proctored assessment'}. After confirmation, descriptive responses will be locked and the next section will open.`,
        success: 'Descriptive section submitted successfully.',
        questions: descriptiveQuestions.length,
        marks: descriptiveTotalMarks,
        answered: null,
      }
      : {
        title: 'Submit MCQ Assessment?',
        message: `You are about to submit the MCQ section for ${assessment?.name || 'this proctored assessment'}. After confirmation, MCQ answers will be locked and the next section will open.`,
        success: 'MCQ section submitted successfully.',
        questions: mcqQuestions.length,
        marks: mcqTotalMarks,
        answered: `${attendedMcqCount} / ${mcqQuestions.length} answered`,
      }

  const showProctorViolation = (reason, details) => {
    let nextPhase = 'warning'
    let nextMessage = `Warning ${proctorViolation.count + 1}: ${reason}.`
    let nextRemaining = 0
    let shouldAutoSubmit = false

    setProctorViolation((current) => {
      const nextCount = Number(current.count || 0) + 1
      if (nextCount === 1) {
        nextPhase = 'warning'
        nextMessage = `Security warning (${nextCount}/4): ${reason}.`
        appendStudentViolationLog(assessment, CURRENT_STUDENT_ID, `${reason}${details ? ` | ${details}` : ''}`)
        return {
          ...current,
          count: nextCount,
          phase: nextPhase,
          message: nextMessage,
          endsAt: 0,
          showFullscreenLock: true,
        }
      }

      if (nextCount === 2) {
        nextPhase = 'penalty'
        nextRemaining = PROCTOR_PENALTY_SECONDS
        nextMessage = `Violation ${nextCount}/4: Penalty applied. Pause for ${nextRemaining} seconds.`
        appendStudentViolationLog(assessment, CURRENT_STUDENT_ID, `Penalty ${nextRemaining}s applied: ${reason}${details ? ` | ${details}` : ''}`)
        return {
          ...current,
          count: nextCount,
          phase: nextPhase,
          message: nextMessage,
          endsAt: Date.now() + (nextRemaining * 1000),
          showFullscreenLock: true,
        }
      }

      if (nextCount === 3) {
        nextPhase = 'lock'
        nextRemaining = PROCTOR_LOCK_SECONDS
        nextMessage = `Violation ${nextCount}/4: Locked for ${nextRemaining} seconds.`
        appendStudentViolationLog(assessment, CURRENT_STUDENT_ID, `Lock ${nextRemaining}s applied: ${reason}${details ? ` | ${details}` : ''}`)
        return {
          ...current,
          count: nextCount,
          phase: nextPhase,
          message: nextMessage,
          endsAt: Date.now() + (nextRemaining * 1000),
          showFullscreenLock: true,
        }
      }

      nextPhase = 'auto-submitted'
      nextMessage = `Auto-submitted due repeated security violations.`
      shouldAutoSubmit = true
      appendStudentViolationLog(assessment, CURRENT_STUDENT_ID, `Exam auto-submitted: ${reason}${details ? ` | ${details}` : ''}`)
      return {
        ...current,
        count: nextCount,
        phase: nextPhase,
        message: nextMessage,
        endsAt: Date.now() + 2000,
        showFullscreenLock: true,
      }
    })

    if (shouldAutoSubmit) {
      setIsAutoExitAfterViolation(true)
      finalizeAssessmentSubmission({ submissionStatus: 'Auto Submit' })
    }
  }

  const switchSection = (section) => {
    if (shouldBlockProctoringActions) return
    if (!isSectionAccessibleInSequence(section)) return
    if (section === 'mcq' && isMcqSubmitted) return
    if (section === 'descriptive' && isDescriptiveSubmitted) return
    setActiveSection(section)
    setActiveQuestionIndex(0)
    if (section === 'descriptive' && descriptiveGroups.length) {
      setActiveDescriptiveGroupKey(descriptiveGroups[0].key)
    }
    if (hasStarted && isSplitProctoredFlow) {
      setActiveSequenceStartedAt(Date.now())
    }
  }

  const setMcqStatus = (question, index, status) => {
    if (shouldBlockProctoringActions) return
    const key = getMcqQuestionKey(question, index)
    setMcqQuestionStatuses((current) => ({
      ...current,
      [key]: status,
    }))
  }

  const selectMcqOption = (question, index, optionIndex) => {
    if (!mcqAllowsAnswerInput || isMcqLocked || shouldBlockProctoringActions) return
    const key = getMcqQuestionKey(question, index)
    setAnswers((current) => ({ ...current, [key]: optionIndex }))
    setMcqQuestionStatuses((current) => ({ ...current, [key]: 'answered' }))
  }

  const markTryLater = () => {
    if (!currentQuestion || !mcqAllowsAnswerInput || isMcqLocked || shouldBlockProctoringActions) return
    setMcqStatus(currentQuestion, activeQuestionIndex, 'try-later')
    setActiveQuestionIndex((current) => Math.min(mcqQuestions.length - 1, current + 1))
  }

  const updateDescriptiveAnswer = (key, value) => {
    if (isDescriptiveLocked || shouldBlockProctoringActions) return
    setDescriptiveAnswers((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const startExam = async () => {
    const requiresFullscreen = !isMobileOrTabletDevice()

    if (environmentRestrictionMessage) {
      setFullscreenError(environmentRestrictionMessage)
      return
    }

    setProctorViolation({
      count: 0,
      phase: 'idle',
      message: '',
      endsAt: 0,
      showFullscreenLock: false,
    })
    setFullscreenError('')
    setExamPause({
      active: false,
      message: '',
      requiresFullscreen: false,
    })
    try {
      if (window.history && window.history.pushState) {
        window.history.pushState({ proctor: 'locked' }, '', window.location.href)
      }
      if (window.screen?.orientation?.lock) {
        window.screen.orientation.lock('landscape').catch(() => {})
      }
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await requestExamFullscreen()
      } else if (requiresFullscreen && !document.documentElement.requestFullscreen) {
        setFullscreenError('Launch this proctored exam in fullscreen/PWA mode.')
        return
      }
    } catch {
      if (requiresFullscreen) {
        setFullscreenError('Launch this proctored exam in fullscreen/PWA mode.')
        return
      }
    }

    if (requiresFullscreen && !document.fullscreenElement) {
      setFullscreenError('Please enter fullscreen mode to start the proctored exam.')
      return
    }

    await requestExamKeyboardLock()
    setIsFullscreenMode(Boolean(document.fullscreenElement))
    setExamPause({
      active: false,
      message: '',
      requiresFullscreen: false,
    })
    const startedAt = Date.now()
    setExamStartedAt(startedAt)
    setActiveSequenceStartedAt(isSplitProctoredFlow ? startedAt : null)
    setTimerNow(startedAt)
    setHasStarted(true)
    writeStudentExamSession(assessment, startedAt)
    if (isSplitProctoredFlow) {
      setActiveSection(firstSplitSection)
      setActiveQuestionIndex(0)
    }
  }

  const openSubmitModal = (section) => {
    if (shouldBlockProctoringActions) return
    if (section === 'final') {
      setSubmitModal({ section: 'final', isFinal: true, phase: 'confirm' })
      return
    }

    const isFinal = section === 'mcq' ? !hasPendingDescriptive : !hasPendingMcq
    setSubmitModal({ section, isFinal, phase: 'confirm' })
  }

  const closeSubmitModal = () => {
    if (submitModal?.phase === 'success') return
    setSubmitModal(null)
  }

  const confirmSubmit = () => {
    if (shouldBlockProctoringActions) return
    if (submitModal?.section === 'mcq') {
      setIsMcqSubmitted(true)
    }
    if (submitModal?.section === 'descriptive') {
      setIsDescriptiveSubmitted(true)
    }
    if (submitModal?.section === 'final' || submitModal?.isFinal) {
      setIsMcqSubmitted((current) => current || hasMcqSection)
      setIsDescriptiveSubmitted((current) => current || hasDescriptiveSection)
    }
    setSubmitModal((current) => (current ? { ...current, phase: 'success' } : current))
  }

  const finalizeAssessmentSubmission = (options = {}) => {
    const { navigateAway = false, submissionStatus = 'Manual Submit' } = options

    setIsAssessmentSubmitted(true)
    if (hasMcqSection) setIsMcqSubmitted(true)
    if (hasDescriptiveSection) setIsDescriptiveSubmitted(true)
    setProctorViolation((current) => ({
      ...current,
      phase: 'idle',
      message: '',
      endsAt: 0,
      showFullscreenLock: false,
    }))
    setIsAutoExitAfterViolation(false)
    setExamPause({
      active: false,
      message: '',
      requiresFullscreen: false,
    })
    if (document.fullscreenElement && document.exitFullscreen) {
      isIntentionalFullscreenExitRef.current = true
      document.exitFullscreen().catch(() => {})
    }
    releaseExamKeyboardLock()
    setIsFullscreenMode(false)
    writeStudentSubmissionStatus(assessment, submissionStatus)
    persistCompletedAssessment()
    setSubmitModal((current) => (current?.phase === 'success' ? current : null))
    setIsExitModalOpen(false)

    if (navigateAway) onExit?.(APP_PAGES.MY_ASSESSMENT)
  }

  const persistCompletedAssessment = () => {
    if (!assessment) return
    const completedAssessment = {
      ...assessment,
      status: 'completed',
      completedAt: new Date().toISOString(),
    }

    try {
      window.sessionStorage.setItem(ONLINE_PROCTORED_EXAM_STORAGE_KEY, JSON.stringify(completedAssessment))
    } catch {
      // Session storage is best-effort here; navigation should still continue.
    }

    try {
      const parsed = JSON.parse(window.localStorage.getItem(ASSESSMENT_PUBLISHED_STORAGE_KEY) || '[]')
      if (!Array.isArray(parsed)) return

      const updatedAssessments = parsed.map((item) => {
        const sameId = item?.id && assessment?.id && item.id === assessment.id
        const sameAssessment = !assessment?.id
          && item?.assessmentName === assessment?.assessmentName
          && item?.startDate === assessment?.startDate
          && item?.startTime === assessment?.startTime

        return sameId || sameAssessment ? { ...item, status: 'completed', completedAt: completedAssessment.completedAt } : item
      })

      window.localStorage.setItem(ASSESSMENT_PUBLISHED_STORAGE_KEY, JSON.stringify(updatedAssessments))
    } catch {
      // Local storage is best-effort here; the session value still keeps this navigation correct.
    } finally {
      try {
        window.dispatchEvent(new CustomEvent(ASSESSMENT_PUBLISHED_CHANGED_EVENT))
      } catch {
        // Ignore event dispatch errors in constrained environments.
      }
    }
  }

  const requestExit = () => {
    if (isAssessmentSubmitted) {
      onExit?.(APP_PAGES.MY_ASSESSMENT)
      return
    }

    setIsExitModalOpen(true)
  }

  const finishTest = () => {
    if (!hasStarted) {
      setIsExitModalOpen(false)
      onExit?.(APP_PAGES.MY_ASSESSMENT)
      return
    }

    setIsExitModalOpen(false)
    finalizeAssessmentSubmission({ navigateAway: true })
  }

  const exitAnyway = () => {
    setIsExitModalOpen(false)
    onExit?.(APP_PAGES.MY_ASSESSMENT)
  }

  const registerViolation = (reason, details = '') => {
    if (!hasStarted || isAssessmentSubmitted) return
    const now = Date.now()
    if (now - violationCooldownRef.current < PROCTOR_VIOLATION_COOLDOWN_MS) return
    violationCooldownRef.current = now
    if (!isMobileOrTabletDevice() && !document.fullscreenElement) {
      setFullscreenError('Fullscreen mode is required to continue.')
    }
    showProctorViolation(reason, details)
  }

  const recordMonitoringEvent = (reason, details = '') => {
    if (!hasStarted || isAssessmentSubmitted) return
    const eventKey = `${reason}:${details}`
    if (lastMonitoringEventRef.current === eventKey) return
    lastMonitoringEventRef.current = eventKey
    appendStudentMonitoringLog(assessment, CURRENT_STUDENT_ID, `${reason}${details ? ` | ${details}` : ''}`)
  }

  const openImagePreview = (images, index = 0) => {
    if (isExamActionLocked) return
    if (!Array.isArray(images) || !images.length) return
    setImagePreview({
      images,
      index: Math.min(Math.max(0, index), images.length - 1),
    })
  }

  const closeImagePreview = () => {
    setImagePreview(null)
  }

  const detectViolationShortcut = (event) => {
    const key = event.key || ''
    const lowerKey = key.toLowerCase()
    const blockedFnKeys = new Set(['F1', 'F3', 'F4', 'F5', 'F6', 'F10', 'F11', 'F12'])
    const hasCtrlMeta = event.ctrlKey || event.metaKey
    const hasAltCtrlMeta = event.altKey || hasCtrlMeta

    if (key === 'PrintScreen') return 'screenshot attempt'
    if (blockedFnKeys.has(key)) return `${key} key pressed`

    if (hasCtrlMeta && ['s', 'c', 'u', 'i', 'j', 'p', 'v', 'x', 'a', 'o', 'l', 'w', 'n', 't', 'r'].includes(lowerKey)) {
      return `${String(key).toUpperCase()} shortcut blocked`
    }
    if (event.shiftKey && hasCtrlMeta && ['c', 'i', 'j', 'p', 'n', 'q', 's', 'k', 'd'].includes(lowerKey)) {
      return `${String(key).toUpperCase()} shortcut blocked`
    }
    if (event.ctrlKey && event.shiftKey && ['I', 'J', 'C', 'K', 'P'].includes(key)) {
      return `${String(key).toUpperCase()} shortcut blocked`
    }
    if ((event.altKey && ['Tab', 'F4'].includes(key)) || (event.metaKey && ['Tab'].includes(key))) return 'Window/application switching attempt'
    if (hasAltCtrlMeta && ['Tab', 'Escape'].includes(key)) return 'Window/application switching attempt'
    if (event.metaKey && ['r', 'l', 'Left', 'Right', 't', 'n'].includes(key)) return 'Browser/application navigation attempt'
    if (event.ctrlKey && ['Tab', 'ArrowLeft', 'ArrowRight'].includes(key)) return 'Window/application switching attempt'
    return ''
  }

  const moveImagePreview = (direction) => {
    setImagePreview((current) => {
      if (!current) return current
      const nextIndex = Math.min(Math.max(0, current.index + direction), current.images.length - 1)
      return { ...current, index: nextIndex }
    })
  }

  const returnToFullscreen = async () => {
    if (!document.documentElement.requestFullscreen || document.fullscreenElement) return
    try {
      if (fullscreenRestoreTimerRef.current) {
        window.clearTimeout(fullscreenRestoreTimerRef.current)
        fullscreenRestoreTimerRef.current = null
      }
      await requestExamFullscreen()
      await requestExamKeyboardLock()
      setIsFullscreenMode(true)
      setExamPause({
        active: false,
        message: '',
        requiresFullscreen: false,
      })
      setFullscreenError('')
    } catch {
      setFullscreenError('Fullscreen mode is required for proctored exam.')
    }
  }

  const scheduleFullscreenRestore = () => {
    if (fullscreenRestoreTimerRef.current || !document.documentElement.requestFullscreen || document.fullscreenElement) return
    fullscreenRestoreTimerRef.current = window.setTimeout(() => {
      fullscreenRestoreTimerRef.current = null
      if (!hasStarted || isAssessmentSubmitted || document.fullscreenElement) return
      returnToFullscreen()
    }, 1000)
  }

  const resumePausedExam = async () => {
    if (isFullscreenRequiredForDevice && !document.fullscreenElement) {
      await returnToFullscreen()
      return
    }
    await requestExamKeyboardLock()
    setIsFullscreenMode(Boolean(document.fullscreenElement))
    setExamPause({
      active: false,
      message: '',
      requiresFullscreen: false,
    })
    setFullscreenError('')
  }

  const showDescriptiveSection = (groupKey) => {
    if (shouldBlockProctoringActions) return
    if (!isSectionAccessibleInSequence('descriptive')) return

    setActiveSection('descriptive')
    setActiveDescriptiveGroupKey(groupKey)
    window.requestAnimationFrame(() => {
      const target = document.getElementById(getDescriptiveSectionDomId(groupKey))
      const header = document.querySelector('.online-practice-header')
      if (!target) return

      const headerOffset = (header?.getBoundingClientRect().height ?? 84) + 14
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - headerOffset,
        behavior: 'smooth',
      })
    })
  }

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setTimerNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [])

  useEffect(() => {
    const updateEnvironmentRestriction = () => {
      if (!hasStarted && !isAssessmentSubmitted) {
        setEnvironmentRestrictionMessage(isRestrictedProctorEnvironment())
      }
    }

    updateEnvironmentRestriction()
    window.addEventListener('resize', updateEnvironmentRestriction)
    window.addEventListener('orientationchange', updateEnvironmentRestriction)

    return () => {
      window.removeEventListener('resize', updateEnvironmentRestriction)
      window.removeEventListener('orientationchange', updateEnvironmentRestriction)
    }
  }, [hasStarted, isAssessmentSubmitted])

  useEffect(() => {
    if (!hasStarted) return
    if (!isAssessmentSubmitted) return

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {})
    }
  }, [hasStarted, isAssessmentSubmitted])

  useEffect(() => {
    if (!proctorViolation.endsAt || !['penalty', 'lock', 'auto-submitted'].includes(proctorViolation.phase)) return undefined
    if (timerNow < proctorViolation.endsAt) return undefined

    if (proctorViolation.phase === 'auto-submitted') {
      return undefined
    }

    setProctorViolation((current) => (
      current.phase === proctorViolation.phase && current.endsAt === proctorViolation.endsAt
        ? {
          ...current,
          phase: 'idle',
          message: '',
          endsAt: 0,
        }
        : current
    ))
    return undefined
  }, [proctorViolation.endsAt, proctorViolation.phase, timerNow])

  useEffect(() => {
    if (!isProctorViolationActive || proctorViolation.phase !== 'warning') return undefined

    const timeoutId = window.setTimeout(() => {
      setProctorViolation((current) => (
        current.phase === 'warning'
          ? { ...current, phase: 'idle', message: '', endsAt: 0 }
          : current
      ))
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [isProctorViolationActive, proctorViolation.phase, proctorViolation.message])

  useEffect(() => {
    if (!isAutoExitAfterViolation || !isAssessmentSubmitted || proctorViolation.phase !== 'auto-submitted') return undefined

    const timeoutId = window.setTimeout(() => {
      onExit?.(APP_PAGES.MY_ASSESSMENT)
    }, 1800)

    return () => window.clearTimeout(timeoutId)
  }, [isAutoExitAfterViolation, isAssessmentSubmitted, onExit, proctorViolation.phase])

  useEffect(() => {
    if (!isKeyboardLockedForExam) return undefined

    const handleExamKeyboardEvent = (event) => {
      blockExamKeyboardEvent(event)
      if (event.type === 'keydown') {
        requestExamKeyboardLock()
      }
    }
    const handleExamTextFocus = (event) => {
      if (!isTextInputTarget(event.target)) return
      blockExamKeyboardEvent(event)
      if (typeof event.target.blur === 'function') {
        event.target.blur()
      }
    }

    requestExamKeyboardLock()
    if (isTextInputTarget(document.activeElement) && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur()
    }
    window.addEventListener('keydown', handleExamKeyboardEvent, true)
    window.addEventListener('keypress', handleExamKeyboardEvent, true)
    window.addEventListener('keyup', handleExamKeyboardEvent, true)
    window.addEventListener('beforeinput', handleExamKeyboardEvent, true)
    window.addEventListener('input', handleExamKeyboardEvent, true)
    window.addEventListener('compositionstart', handleExamKeyboardEvent, true)
    window.addEventListener('compositionupdate', handleExamKeyboardEvent, true)
    window.addEventListener('compositionend', handleExamKeyboardEvent, true)
    window.addEventListener('focusin', handleExamTextFocus, true)
    document.addEventListener('keydown', handleExamKeyboardEvent, true)
    document.addEventListener('keypress', handleExamKeyboardEvent, true)
    document.addEventListener('keyup', handleExamKeyboardEvent, true)
    document.addEventListener('beforeinput', handleExamKeyboardEvent, true)
    document.addEventListener('input', handleExamKeyboardEvent, true)
    document.addEventListener('compositionstart', handleExamKeyboardEvent, true)
    document.addEventListener('compositionupdate', handleExamKeyboardEvent, true)
    document.addEventListener('compositionend', handleExamKeyboardEvent, true)
    document.addEventListener('focusin', handleExamTextFocus, true)

    return () => {
      window.removeEventListener('keydown', handleExamKeyboardEvent, true)
      window.removeEventListener('keypress', handleExamKeyboardEvent, true)
      window.removeEventListener('keyup', handleExamKeyboardEvent, true)
      window.removeEventListener('beforeinput', handleExamKeyboardEvent, true)
      window.removeEventListener('input', handleExamKeyboardEvent, true)
      window.removeEventListener('compositionstart', handleExamKeyboardEvent, true)
      window.removeEventListener('compositionupdate', handleExamKeyboardEvent, true)
      window.removeEventListener('compositionend', handleExamKeyboardEvent, true)
      window.removeEventListener('focusin', handleExamTextFocus, true)
      document.removeEventListener('keydown', handleExamKeyboardEvent, true)
      document.removeEventListener('keypress', handleExamKeyboardEvent, true)
      document.removeEventListener('keyup', handleExamKeyboardEvent, true)
      document.removeEventListener('beforeinput', handleExamKeyboardEvent, true)
      document.removeEventListener('input', handleExamKeyboardEvent, true)
      document.removeEventListener('compositionstart', handleExamKeyboardEvent, true)
      document.removeEventListener('compositionupdate', handleExamKeyboardEvent, true)
      document.removeEventListener('compositionend', handleExamKeyboardEvent, true)
      document.removeEventListener('focusin', handleExamTextFocus, true)
      releaseExamKeyboardLock()
    }
  }, [isKeyboardLockedForExam])

  useEffect(() => {
    if (!hasStarted || isAssessmentSubmitted) return undefined
    const requiresFullscreen = !isMobileOrTabletDevice()
    const pauseExam = (message, requiresFullscreenRestore = false) => {
      setExamPause((current) => (
        current.active
          && current.message === message
          && current.requiresFullscreen === requiresFullscreenRestore
          ? current
          : {
            active: true,
            message,
            requiresFullscreen: requiresFullscreenRestore,
          }
      ))
    }
    const resumeExam = () => {
      setExamPause((current) => (
        current.active
          ? {
            active: false,
            message: '',
            requiresFullscreen: false,
          }
          : current
      ))
    }

    const handleVisibilityChange = () => {
      setIsFullscreenMode(Boolean(document.fullscreenElement))
      if (requiresFullscreen && !document.fullscreenElement) {
        pauseExam('Return to fullscreen to continue.', true)
        recordMonitoringEvent('Fullscreen interrupted', 'Page visibility changed while fullscreen was inactive')
        scheduleFullscreenRestore()
        return
      }
      if (document.hidden) {
        pauseExam('Return to the exam screen to continue.')
        recordMonitoringEvent('Tab or page hidden', 'Exam page became hidden')
        return
      }
      resumeExam()
    }
    const handleBlur = () => {
      setIsFullscreenMode(Boolean(document.fullscreenElement))
      if (requiresFullscreen && !document.fullscreenElement) {
        pauseExam('Return to fullscreen to continue.', true)
        recordMonitoringEvent('Fullscreen interrupted', 'Window lost focus while fullscreen was inactive')
        scheduleFullscreenRestore()
        return
      }
      pauseExam('Keep this exam window active to continue.')
      recordMonitoringEvent('Window focus lost', 'Exam window lost focus')
    }
    const handleFocus = () => {
      setIsFullscreenMode(Boolean(document.fullscreenElement))
      if (requiresFullscreen && !document.fullscreenElement) return
      if (browserClosePromptRef.current) {
        browserClosePromptRef.current = false
        pauseExam('Exam paused. Resume when you are ready to continue.')
        return
      }
      resumeExam()
    }
    const handleFullscreenChange = () => {
      setIsFullscreenMode(Boolean(document.fullscreenElement))
      if (requiresFullscreen && !document.fullscreenElement) {
        if (isIntentionalFullscreenExitRef.current) {
          isIntentionalFullscreenExitRef.current = false
          return
        }
        pauseExam('Return to fullscreen to continue.', true)
        recordMonitoringEvent('Fullscreen interrupted', 'Browser fullscreen exited')
        scheduleFullscreenRestore()
        return
      }
      if (document.fullscreenElement) {
        isIntentionalFullscreenExitRef.current = false
        requestExamKeyboardLock()
      }
      resumeExam()
    }
    const handleCopy = (event) => {
      event.preventDefault()
      event.stopPropagation()
    }
    const handleCut = (event) => {
      event.preventDefault()
      event.stopPropagation()
    }
    const handlePaste = (event) => {
      event.preventDefault()
      event.stopPropagation()
    }
    const handleContextMenu = (event) => {
      event.preventDefault()
      event.stopPropagation()
    }
    const handleDragStart = (event) => {
      event.preventDefault()
      event.stopPropagation()
    }
    const handleSelectStart = (event) => {
      event.preventDefault()
      event.stopPropagation()
    }
    const handleDrop = (event) => {
      event.preventDefault()
      event.stopPropagation()
    }
    const handleTopEdgePointer = (event) => {
      if (typeof event.clientY !== 'number' || event.clientY > PROCTOR_TOP_EDGE_GUARD_PX) return
      event.preventDefault()
      event.stopPropagation()
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation()
      }
      pauseExam('Exam paused. Move away from browser controls and resume when ready.')
      recordMonitoringEvent('Browser control area reached', 'Pointer moved to the top screen edge')
    }
    const handleVisibilityAndHistory = () => {
      if (!hasStarted || isAssessmentSubmitted) return
      if (window.history && window.history.pushState) {
        window.history.pushState({ proctor: 'locked' }, '', window.location.href)
      }
    }
    const handlePopState = () => {
      handleVisibilityAndHistory()
    }
    const handleFullscreenError = () => {
      if (requiresFullscreen) {
        pauseExam('Return to fullscreen to continue.', true)
        recordMonitoringEvent('Fullscreen restore failed', 'Browser reported a fullscreen error')
        scheduleFullscreenRestore()
      }
    }

    const handleBeforeUnload = (event) => {
      if (!hasStarted || isAssessmentSubmitted) return
      browserClosePromptRef.current = true
      pauseExam('Exam paused. Resume when you are ready to continue.')
      recordMonitoringEvent('Close or refresh prompted', 'Browser beforeunload prompt was triggered')
      event.preventDefault()
      event.returnValue = ''
    }
    const handlePageHide = () => {
      setIsFullscreenMode(Boolean(document.fullscreenElement))
      pauseExam('Return to the exam screen to continue.')
      recordMonitoringEvent('Page leaving or hidden', 'Browser pagehide event was triggered')
    }
    const handleResize = () => {
      setIsFullscreenMode(Boolean(document.fullscreenElement))
      if (requiresFullscreen && !document.fullscreenElement) {
        pauseExam('Return to fullscreen to continue.', true)
        recordMonitoringEvent('Fullscreen interrupted', 'Window resized while fullscreen was inactive')
        scheduleFullscreenRestore()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange, true)
    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('fullscreenchange', handleFullscreenChange, true)
    document.addEventListener('fullscreenerror', handleFullscreenError, true)
    window.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('copy', handleCopy)
    window.addEventListener('cut', handleCut)
    window.addEventListener('paste', handlePaste)
    window.addEventListener('dragstart', handleDragStart)
    window.addEventListener('selectstart', handleSelectStart)
    window.addEventListener('drop', handleDrop)
    window.addEventListener('pointermove', handleTopEdgePointer, true)
    window.addEventListener('mousemove', handleTopEdgePointer, true)
    document.addEventListener('pointermove', handleTopEdgePointer, true)
    document.addEventListener('mousemove', handleTopEdgePointer, true)
    window.addEventListener('fullscreenerror', handleFullscreenError)
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('resize', handleResize)
    window.history && window.history.pushState && window.history.pushState({ proctor: 'locked' }, '', window.location.href)

    return () => {
      if (fullscreenRestoreTimerRef.current) {
        window.clearTimeout(fullscreenRestoreTimerRef.current)
        fullscreenRestoreTimerRef.current = null
      }
      releaseExamKeyboardLock()
      document.removeEventListener('visibilitychange', handleVisibilityChange, true)
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('fullscreenchange', handleFullscreenChange, true)
      document.removeEventListener('fullscreenerror', handleFullscreenError, true)
      window.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('copy', handleCopy)
      window.removeEventListener('cut', handleCut)
      window.removeEventListener('paste', handlePaste)
      window.removeEventListener('dragstart', handleDragStart)
      window.removeEventListener('selectstart', handleSelectStart)
      window.removeEventListener('drop', handleDrop)
      window.removeEventListener('pointermove', handleTopEdgePointer, true)
      window.removeEventListener('mousemove', handleTopEdgePointer, true)
      document.removeEventListener('pointermove', handleTopEdgePointer, true)
      document.removeEventListener('mousemove', handleTopEdgePointer, true)
      window.removeEventListener('fullscreenerror', handleFullscreenError)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('resize', handleResize)
    }
  }, [hasStarted, isAssessmentSubmitted])

  useEffect(() => {
    if (!assessment) return
    writeStoredAttempt(assessment, {
      hasStarted,
      examStartedAt,
      activeSequenceStartedAt,
      activeSection,
      activeDescriptiveGroupKey,
      activeQuestionIndex,
      answers,
      mcqQuestionStatuses,
      descriptiveAnswers,
      isMcqSubmitted,
      isDescriptiveSubmitted,
      isAssessmentSubmitted,
      appliedResetVersion,
    })
  }, [
    activeDescriptiveGroupKey,
    activeQuestionIndex,
    activeSection,
    activeSequenceStartedAt,
    answers,
    appliedResetVersion,
    assessment,
    descriptiveAnswers,
    examStartedAt,
    hasStarted,
    isAssessmentSubmitted,
    isDescriptiveSubmitted,
    isMcqSubmitted,
    mcqQuestionStatuses,
  ])

  useEffect(() => {
    if (!assessment || !hasStarted) return undefined

    const writeHeartbeat = () => {
      writeStudentExamHeartbeat(assessment, CURRENT_STUDENT_ID, {
        isSubmitted: isAssessmentSubmitted,
        isPaused: examPause.active,
        fullscreenActive: Boolean(document.fullscreenElement),
        pageVisible: !document.hidden,
        windowFocused: document.hasFocus(),
        activeSection,
        activeQuestionIndex,
      })
    }

    writeHeartbeat()
    if (isAssessmentSubmitted) return undefined

    const intervalId = window.setInterval(writeHeartbeat, EXAM_HEARTBEAT_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [
    activeQuestionIndex,
    activeSection,
    assessment,
    examPause.active,
    hasStarted,
    isAssessmentSubmitted,
  ])

  useEffect(() => {
    const applyReset = () => {
      const reset = readStudentExamReset(assessment)
      const storedAttempt = readStoredAttempt(assessment) || {}
      if (!reset?.version || storedAttempt.appliedResetVersion === reset.version) return

      setHasStarted(false)
      setExamStartedAt(null)
      setActiveSequenceStartedAt(null)
      setActiveQuestionIndex(0)
      setSubmitModal(null)
      setIsExitModalOpen(false)
      setIsTimeLimitModalOpen(false)
      setSequenceAutoNotice('')
      setSequenceTransitionModal(null)
      setIsMcqSubmitted(false)
      setIsDescriptiveSubmitted(false)
      setIsAssessmentSubmitted(false)

      if (reset.mode === 'clear') {
        setAppliedResetVersion(reset.version)
        setActiveSection('mcq')
        setActiveDescriptiveGroupKey('')
        setAnswers({})
        setMcqQuestionStatuses({})
        setDescriptiveAnswers({})
        writeStoredAttempt(assessment, { appliedResetVersion: reset.version })
        return
      }

      setActiveSection(storedAttempt.activeSection || 'mcq')
      setActiveDescriptiveGroupKey(storedAttempt.activeDescriptiveGroupKey || '')
      setAnswers(storedAttempt.answers || {})
      setMcqQuestionStatuses(storedAttempt.mcqQuestionStatuses || {})
      setDescriptiveAnswers(storedAttempt.descriptiveAnswers || {})
      setAppliedResetVersion(reset.version)
      writeStoredAttempt(assessment, {
        ...storedAttempt,
        hasStarted: false,
        examStartedAt: null,
        activeSequenceStartedAt: null,
        isMcqSubmitted: false,
        isDescriptiveSubmitted: false,
        isAssessmentSubmitted: false,
        appliedResetVersion: reset.version,
      })
    }

    const handleResetEvent = (event) => {
      if (!event.detail || event.detail.assessmentId === getAssessmentId(assessment)) applyReset()
    }
    const handleStorage = (event) => {
      if (event.key === STUDENT_EXAM_RESET_KEY) applyReset()
    }

    applyReset()
    window.addEventListener(STUDENT_EXAM_RESET_EVENT, handleResetEvent)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(STUDENT_EXAM_RESET_EVENT, handleResetEvent)
      window.removeEventListener('storage', handleStorage)
    }
  }, [assessment])

  useEffect(() => {
    const syncStudentExtension = () => {
      setTimeExtension(readStudentTimeExtension(assessment))
    }

    const handleStorage = (event) => {
      if (event.key === STUDENT_EXAM_TIME_EXTENSIONS_KEY) syncStudentExtension()
    }

    const handleExtensionEvent = (event) => {
      if (!event.detail || event.detail.assessmentId === getAssessmentId(assessment)) {
        syncStudentExtension()
      }
    }

    syncStudentExtension()
    window.addEventListener('storage', handleStorage)
    window.addEventListener(STUDENT_EXAM_TIME_EXTENSION_EVENT, handleExtensionEvent)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(STUDENT_EXAM_TIME_EXTENSION_EVENT, handleExtensionEvent)
    }
  }, [assessment])

  useEffect(() => {
    if (!hasStarted || activeSection !== 'mcq' || !currentQuestion) return

    const key = getMcqQuestionKey(currentQuestion, activeQuestionIndex)
    setMcqQuestionStatuses((current) => (
      current[key] ? current : { ...current, [key]: 'viewed' }
    ))
  }, [activeQuestionIndex, activeSection, currentQuestion, hasStarted])

  useEffect(() => {
    if (!hasStarted || !isSplitProctoredFlow || submitModal || sequenceTransitionModal) return
    const isFirstSectionCompleted = isSplitSectionCompleted(splitSequenceFirst)

    if (activeSection === splitSequenceSecond && !isFirstSectionCompleted) {
      setActiveSection(splitSequenceFirst)
      setActiveQuestionIndex(0)
      if (splitSequenceFirst === 'descriptive' && descriptiveGroups.length) {
        setActiveDescriptiveGroupKey(descriptiveGroups[0].key)
      }
      return
    }

    if (activeSection === splitSequenceFirst && !isFirstSectionCompleted) return

    if (activeSection === splitSequenceFirst && isFirstSectionCompleted) {
      setActiveSection(splitSequenceSecond)
      setActiveQuestionIndex(0)
      if (splitSequenceSecond === 'descriptive' && descriptiveGroups.length) {
        setActiveDescriptiveGroupKey(descriptiveGroups[0].key)
      }
    }
  }, [activeSection, descriptiveGroups, hasStarted, isSplitProctoredFlow, isMcqSubmitted, isDescriptiveSubmitted, splitSequenceFirst, splitSequenceSecond, firstSplitSection, submitModal, sequenceTransitionModal])

  useEffect(() => {
    if (
      !shouldShowSequenceTimer
      || activeSequenceRemainingSeconds > 0
      || isAssessmentSubmitted
      || submitModal
      || sequenceTransitionModal
    ) return

    if (activeSection === splitSequenceFirst && !isSplitSectionCompleted(activeSection)) {
      if (activeSection === 'mcq') setIsMcqSubmitted(true)
      if (activeSection === 'descriptive') setIsDescriptiveSubmitted(true)
      setSequenceTransitionModal({
        fromLabel: activeSequenceLabel,
        toSection: splitSequenceSecond,
        toLabel: splitSequenceSecond === 'mcq' ? 'MCQ' : 'Descriptive',
        startedAt: Date.now(),
      })
      return
    }

    if (activeSection === splitSequenceSecond && !isSplitSectionCompleted(activeSection)) {
      setSequenceAutoNotice(`${activeSequenceLabel} time is over. Submitting assessment.`)
      finalizeAssessmentSubmission({ submissionStatus: 'Auto Submit' })
      setIsTimeLimitModalOpen(true)
    }
  }, [
    activeSection,
    activeSequenceLabel,
    activeSequenceRemainingSeconds,
    descriptiveGroups,
    isAssessmentSubmitted,
    shouldShowSequenceTimer,
    splitSequenceFirst,
    splitSequenceSecond,
    sequenceTransitionModal,
    submitModal,
  ])

  useEffect(() => {
    if (!sequenceTransitionModal || sequenceTransitionRemainingSeconds > 0) return

    const nextStartedAt = Date.now()
    setActiveSection(sequenceTransitionModal.toSection)
    setActiveQuestionIndex(0)
    setActiveSequenceStartedAt(nextStartedAt)
    if (sequenceTransitionModal.toSection === 'descriptive' && descriptiveGroups.length) {
      setActiveDescriptiveGroupKey(descriptiveGroups[0].key)
    }
    setSequenceTransitionModal(null)
  }, [descriptiveGroups, sequenceTransitionModal, sequenceTransitionRemainingSeconds])

  useEffect(() => {
    if (!sequenceAutoNotice) return undefined

    const timeoutId = window.setTimeout(() => {
      setSequenceAutoNotice('')
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [sequenceAutoNotice])

  useEffect(() => {
    if (hasMcqSection && !hasDescriptiveSection && activeSection !== 'mcq') {
      setActiveSection('mcq')
      setActiveQuestionIndex(0)
      return
    }

    if (!hasMcqSection && hasDescriptiveSection && activeSection !== 'descriptive') {
      setActiveSection('descriptive')
      setActiveQuestionIndex(0)
      if (descriptiveGroups.length) setActiveDescriptiveGroupKey(descriptiveGroups[0].key)
    }
  }, [activeSection, descriptiveGroups, hasDescriptiveSection, hasMcqSection])

  useEffect(() => {
    if (activeSection !== 'descriptive' || !descriptiveGroups.length) return undefined

    let animationFrameId = 0

    const updateActiveSectionFromScroll = () => {
      animationFrameId = 0
      const header = document.querySelector('.online-practice-header')
      const activationLine = (header?.getBoundingClientRect().height ?? 84) + 90
      const sectionPositions = descriptiveGroups
        .map((group) => {
          const element = document.getElementById(getDescriptiveSectionDomId(group.key))
          if (!element) return null
          const rect = element.getBoundingClientRect()
          return {
            key: group.key,
            top: rect.top,
            bottom: rect.bottom,
          }
        })
        .filter(Boolean)

      if (!sectionPositions.length) return

      const activeCandidate = sectionPositions
        .filter((section) => section.bottom >= activationLine)
        .sort((first, second) => Math.abs(first.top - activationLine) - Math.abs(second.top - activationLine))[0]
        ?? sectionPositions[sectionPositions.length - 1]

      setActiveDescriptiveGroupKey((current) => (
        current === activeCandidate.key ? current : activeCandidate.key
      ))
    }

    const handleScroll = () => {
      if (animationFrameId) return
      animationFrameId = window.requestAnimationFrame(updateActiveSectionFromScroll)
    }

    updateActiveSectionFromScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      document.removeEventListener('scroll', handleScroll, { capture: true })
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId)
    }
  }, [activeSection, descriptiveGroups])

  useEffect(() => {
    if (submitModal?.phase !== 'success') return undefined

    const timeoutId = window.setTimeout(() => {
      const submittedSection = submitModal.section
      const isFinalSubmit = submitModal.isFinal
      setSubmitModal(null)

      if (isFinalSubmit) {
        finalizeAssessmentSubmission({ navigateAway: true })
        return
      }

      if (submittedSection === 'mcq') {
        switchSection('descriptive')
        return
      }

      if (submittedSection === 'descriptive') {
        switchSection('mcq')
        return
      }
    }, 2000)

    return () => window.clearTimeout(timeoutId)
  }, [submitModal])

  useEffect(() => {
    if (!shouldShowRemainingTime || remainingDurationSeconds > 0 || isAssessmentSubmitted) return

    finalizeAssessmentSubmission({ submissionStatus: 'Auto Submit' })
    setIsTimeLimitModalOpen(true)
  }, [isAssessmentSubmitted, remainingDurationSeconds, shouldShowRemainingTime])

  useEffect(() => {
    if (!isTimeLimitModalOpen) return undefined

    const timeoutId = window.setTimeout(() => {
      onExit?.(APP_PAGES.MY_ASSESSMENT)
    }, 2000)

    return () => window.clearTimeout(timeoutId)
  }, [isTimeLimitModalOpen, onExit])

  useEffect(() => {
    if (!imagePreview) return undefined

    const handleKeyDown = (event) => {
      if (isKeyboardLockedForExam) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      if (event.key === 'Escape') {
        closeImagePreview()
        return
      }
      if (event.key === 'ArrowLeft') moveImagePreview(-1)
      if (event.key === 'ArrowRight') moveImagePreview(1)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imagePreview, isKeyboardLockedForExam])

  if (!assessment) {
    return (
      <main className="online-practice-exam-page is-proctored-exam">
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

  if (!isProctoredFlowAssessment) {
    return (
      <main className="online-practice-exam-page is-proctored-exam">
        <section className="online-practice-empty">
          <h1>Proctored exam only</h1>
          <p>This page is available only for Online Proctored Exam assessments.</p>
          <button type="button" onClick={() => onExit?.(APP_PAGES.MY_ASSESSMENT)}>
            <ArrowLeft size={16} strokeWidth={2.2} />
            Back to My Assessment
          </button>
        </section>
      </main>
    )
  }

  return (
    <main
      className={`online-practice-exam-page is-proctored-exam ${hasStarted ? 'has-fixed-header' : 'is-before-start'} ${
        shouldBlockProctoringActions ? 'is-proctor-locked' : ''
      } ${isProctorViolationActive ? 'is-proctor-restricted' : ''}`.trim()}
    >
      {isKeyboardLockedForExam ? <div className="online-proctored-top-edge-guard" aria-hidden="true" /> : null}
      {hasStarted ? (
        <header className={`online-practice-header ${headerChips.length ? '' : 'has-no-chips'}`.trim()}>
          {headerLogo ? (
            <img src={headerLogo} alt={setup.logoName || 'Assessment logo'} className="online-practice-logo-image" />
          ) : (
            <span className="online-practice-logo-mark" aria-hidden="true">
              <ListChecks size={20} strokeWidth={2.3} />
            </span>
          )}
          <div className="online-practice-header-title">
            <h1>{assessment.assessmentName || 'Proctored Assessment'}</h1>
            <p>{setup.collegeName || assessment.collegeName || 'College not selected'}</p>
            <small>
              {[assessment.examCategory, setup.academicYear, assessment.assignTo, assessment.supervisionType || 'Proctored Exam']
                .filter(Boolean)
                .join(' / ')}
            </small>
          </div>
          {headerChips.length ? (
            <div className="online-practice-header-chips" aria-label="Assessment configuration summary">
              {headerChips.map((chip) => (
                <span key={chip.tone} className={`is-${chip.tone} ${chip.isCritical ? 'is-critical' : ''}`.trim()}>
                  <em>{chip.label}</em>
                  <strong>{chip.value}</strong>
                </span>
              ))}
            </div>
          ) : null}
          <div className="online-practice-header-actions">
            <button type="button" className="online-practice-theme-btn" onClick={onToggleTheme} aria-label="Toggle theme">
              <ThemeIcon size={16} strokeWidth={2.2} />
            </button>
            {!isKeyboardLockedForExam ? (
              <button type="button" className="online-practice-exit-btn" onClick={requestExit}>
                Exit
              </button>
            ) : null}
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
              <h1>{assessment.assessmentName || 'Proctored Assessment'}</h1>
              <p>{setup.collegeName || assessment.collegeName || 'College not selected'}</p>
              <small>
                {[assessment.examCategory, setup.academicYear, assessment.assignTo, assessment.supervisionType || 'Proctored Exam']
                  .filter(Boolean)
                  .join(' / ')}
              </small>
            </div>
            <div className="online-practice-header-actions">
              <button type="button" className="online-practice-theme-btn" onClick={onToggleTheme} aria-label="Toggle theme">
                <ThemeIcon size={16} strokeWidth={2.2} />
              </button>
              <button type="button" className="online-practice-exit-btn" onClick={requestExit}>
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

          <section className="online-proctored-guidelines" aria-label="Important exam guidelines">
            <h2>
              <Info size={16} strokeWidth={2.4} />
              Important Exam Guidelines
            </h2>
            <div className="online-proctored-guideline-grid">
              <span>
                <BatteryCharging size={16} strokeWidth={2.4} />
                <strong>Power:</strong>
                <p>Ensure your device is sufficiently charged before taking the exam.</p>
              </span>
              <span>
                <Ban size={16} strokeWidth={2.4} />
                <strong>Restricted Items:</strong>
                <p>Use of calculators, smartwatches, or unauthorized electronic devices is strictly prohibited.</p>
              </span>
              <span>
                <Wifi size={16} strokeWidth={2.4} />
                <strong>Stable Internet:</strong>
                <p>Maintain a stable internet connection. If disconnected, your answers are saved locally, but you must reconnect to submit.</p>
              </span>
              <span>
                <Hand size={16} strokeWidth={2.4} />
                <strong>Technical Support:</strong>
                <p>If you face any technical issues, raise your hand to alert the physical invigilator immediately.</p>
              </span>
              <span>
                <BellOff size={16} strokeWidth={2.4} />
                <strong>No Interruptions:</strong>
                <p>Disable all notifications and close background applications to prevent accidental tab switches.</p>
              </span>
              <span>
                <CheckCircle2 size={16} strokeWidth={2.4} />
                <strong>Final Submission:</strong>
                <p>Do not close the browser window until you see the final "Submitted Successfully" screen.</p>
              </span>
            </div>
          </section>

          <section className="online-proctored-rules" aria-label="Online testing environment rules">
            <h2>
              <Monitor size={16} strokeWidth={2.4} />
              Online Testing Environment Rules
            </h2>
            <ul>
              <li>To ensure a fair testing environment, the system uses a controlled online exam window.</li>
              <li>Please remain on the exam page at all times until you submit the assessment.</li>
              <li>Desktop exams require fullscreen mode; mobile and tablet exams are monitored through app and page activity.</li>
              <li>Keyboard input is disabled during the live proctored exam. Use mouse or touch controls only.</li>
              <li>Do not close the browser window before final submission.</li>
            </ul>
          </section>

          <p className="online-proctored-fullscreen-note">Please click below to start your exam. Use mouse or touch only; switching apps, tabs, or leaving the exam screen will be monitored.</p>

          <div className="online-practice-start-footer">
            <label className="online-practice-agree">
              <input type="checkbox" checked={hasAgreed} onChange={(event) => setHasAgreed(event.target.checked)} />
              <span>I acknowledge and agree to comply with all stated assessment guidelines.</span>
            </label>

            <button
              type="button"
              className="online-practice-start-btn"
              disabled={!hasAgreed || Boolean(environmentRestrictionMessage)}
              onClick={startExam}
            >
              Start Proctored Exam
            </button>
          </div>
          {environmentRestrictionMessage ? (
            <div className="online-proctored-fullscreen-alert" role="alert">
              <AlertTriangle size={16} strokeWidth={2.4} />
              {environmentRestrictionMessage}
            </div>
          ) : null}
          {fullscreenError ? (
            <div className="online-proctored-fullscreen-alert" role="alert">
              <AlertTriangle size={16} strokeWidth={2.4} />
              {fullscreenError}
            </div>
          ) : null}
        </section>
      ) : (
        <section className="online-practice-workspace">
          <div className="online-practice-exam-layout">
            <div className="online-practice-exam-main">
              {activeSection === 'mcq' && hasMcqSection ? (
                <div className="online-practice-question-head is-section-title type-mcq">
                  <h2><span>{mcqSectionRoman}</span>{mcqSectionTitle}</h2>
                  <strong>{String(mcqTotalMarks).padStart(2, '0')} Marks</strong>
                </div>
              ) : null}
              <article className={`online-practice-question-card ${activeSection === 'descriptive' ? 'is-descriptive-section' : ''}`.trim()}>
                {activeSection === 'descriptive' ? (
                  descriptiveGroups.length ? (
                    <div className="online-practice-descriptive-readonly" aria-label="Read only descriptive questions">
                      {descriptiveGroups.map((group, groupIndex) => (
                        <section
                          className={`online-practice-descriptive-section ${group.toneClass}`}
                          id={getDescriptiveSectionDomId(group.key)}
                          key={group.title}
                        >
                          <div className="online-practice-descriptive-section-head">
                            <h2><span>{group.roman}</span>{group.title}</h2>
                            <strong>{String(group.totalMarks).padStart(2, '0')} Marks</strong>
                          </div>
                          <div className="online-practice-descriptive-list">
                            {group.questions.map((question, questionIndex) => {
                              const subQuestions = getDescriptiveSubQuestions(question)
                              const displayNumber = previewQuestionDisplayNumbers[question.id ?? `${group.key}-${questionRows.indexOf(question)}`] ?? questionIndex + 1

                              return (
                                <div className="online-practice-descriptive-paper-question" key={question.id ?? questionIndex}>
                                  <p className="online-practice-descriptive-main">
                                    <strong>{displayNumber}.</strong>
                                    <span>{getQuestionText(question)}</span>
                                  </p>
                                  {renderQuestionImages(question.images, '', openImagePreview, isExamActionLocked)}
                                  {subQuestions.length ? (
                                    subQuestions.map((section, index) => (
                                      <div className="online-practice-descriptive-subgroup" key={section.id ?? index}>
                                        <p className="online-practice-descriptive-sub">
                                          <strong>{toLowerRoman(index + 1)}.</strong>
                                          <span>{getQuestionText(section)}</span>
                                          {!(section.children ?? []).length && hasVisibleMarks(section.marks) ? (
                                            <b>{section.marks} Marks</b>
                                          ) : null}
                                        </p>
                                        {descriptiveAllowsAnswerInput && !(section.children ?? []).length ? (
                                          <label className="online-practice-descriptive-answer">
                                            <span>Your answer</span>
                                              <textarea
                                                disabled={isDescriptiveLocked || isExamActionLocked || isKeyboardLockedForExam}
                                                value={descriptiveAnswers[section.id ?? `${question.id}-section-${index}`] ?? ''}
                                                onChange={(event) => updateDescriptiveAnswer(section.id ?? `${question.id}-section-${index}`, event.target.value)}
                                                placeholder="Type your answer..."
                                            />
                                          </label>
                                        ) : null}
                                        {Array.isArray(section.children) && section.children.length ? (
                                          section.children.map((child, childIndex) => (
                                            <div className="online-practice-descriptive-child" key={child.id ?? childIndex}>
                                              <p className="online-practice-descriptive-sub is-nested">
                                                <strong>{String.fromCharCode(97 + childIndex)}.</strong>
                                                <span>{getQuestionText(child)}</span>
                                                {hasVisibleMarks(child.marks) ? <b>{child.marks} Marks</b> : null}
                                              </p>
                                              {descriptiveAllowsAnswerInput ? (
                                                <label className="online-practice-descriptive-answer is-nested">
                                                  <span>Your answer</span>
                                                  <textarea
                                                    disabled={isDescriptiveLocked || isExamActionLocked || isKeyboardLockedForExam}
                                                    value={descriptiveAnswers[child.id ?? `${question.id}-child-${index}-${childIndex}`] ?? ''}
                                                    onChange={(event) => updateDescriptiveAnswer(child.id ?? `${question.id}-child-${index}-${childIndex}`, event.target.value)}
                                                    placeholder="Type your answer..."
                                                  />
                                                </label>
                                              ) : null}
                                            </div>
                                          ))
                                        ) : null}
                                      </div>
                                    ))
                                  ) : descriptiveAllowsAnswerInput ? (
                                    <label className="online-practice-descriptive-answer">
                                      <span>Your answer</span>
                                      <textarea
                                        disabled={isDescriptiveLocked || isExamActionLocked || isKeyboardLockedForExam}
                                        value={descriptiveAnswers[question.id ?? `${group.key}-${questionIndex}`] ?? ''}
                                        onChange={(event) => updateDescriptiveAnswer(question.id ?? `${group.key}-${questionIndex}`, event.target.value)}
                                        placeholder="Type your answer..."
                                      />
                                    </label>
                                  ) : null}
                                </div>
                              )
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  ) : (
                    <div className="online-practice-empty-section">
                      <p>No questions available in this section.</p>
                    </div>
                  )
                ) : !mcqAllowsAnswerInput ? (
                  mcqQuestions.length ? (
                    <div className="online-practice-mcq-readonly-list" aria-label="Read only MCQ questions">
                      {mcqQuestions.map((question, questionIndex) => {
                        const displayNumber = previewQuestionDisplayNumbers[question.id ?? `MCQ-${questionRows.indexOf(question)}`] ?? questionIndex + 1

                        return (
                          <section className="online-practice-mcq-readonly-question" key={question.id ?? questionIndex}>
                            <div className="online-practice-current-question">
                              <strong className="online-practice-current-question-number">{displayNumber}.</strong>
                              <h2>{getQuestionText(question)}</h2>
                            </div>
                            {renderQuestionImages(question.images, 'is-mcq', openImagePreview, isExamActionLocked)}

                            <div className="online-practice-options is-readonly">
                              {(question.options ?? []).map((option, optionIndex) => (
                                <button type="button" key={`${question.id ?? questionIndex}-${optionIndex}`} disabled={isExamActionLocked}>
                                  <strong>{String.fromCharCode(65 + optionIndex)}.</strong>
                                  <span>{getOptionText(option)}</span>
                                </button>
                              ))}
                            </div>
                          </section>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="online-practice-empty-section">
                      <p>No questions available in this section.</p>
                    </div>
                  )
                ) : currentQuestion ? (
                  <>
                    <div className="online-practice-current-question">
                      <strong className="online-practice-current-question-number">{currentQuestionDisplayNumber}.</strong>
                      <h2>{getQuestionText(currentQuestion)}</h2>
                    </div>
                    {renderQuestionImages(currentQuestion.images, 'is-mcq', openImagePreview, isExamActionLocked)}

                    <div className="online-practice-options">
                      {(currentQuestion.options ?? []).map((option, optionIndex) => {
                        const optionKey = `${currentQuestion.id ?? activeQuestionIndex}-${optionIndex}`
                        const answerKey = getMcqQuestionKey(currentQuestion, activeQuestionIndex)
                        const isSelected = answers[answerKey] === optionIndex

                        return (
                          <button
                            type="button"
                            key={optionKey}
                            className={isSelected ? 'is-selected' : ''}
                            disabled={!mcqAllowsAnswerInput || isMcqLocked || isExamActionLocked}
                            onClick={() => selectMcqOption(currentQuestion, activeQuestionIndex, optionIndex)}
                          >
                            <strong>{String.fromCharCode(65 + optionIndex)}.</strong>
                            <span>{getOptionText(option)}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="online-practice-empty-section">
                    <p>No questions available in this section.</p>
                  </div>
                )}
              </article>

              {activeSection === 'mcq' && mcqAllowsAnswerInput ? (
                <footer className="online-practice-question-nav">
                  <button
                    type="button"
                    className="online-practice-try-later-btn"
                    onClick={markTryLater}
                    disabled={!currentQuestion || isMcqLocked || isExamActionLocked}
                  >
                    Try Later
                  </button>
                  <span className="online-practice-question-nav-actions">
                    <button
                      type="button"
                      disabled={activeQuestionIndex <= 0 || isExamActionLocked}
                      onClick={() => setActiveQuestionIndex((current) => Math.max(0, current - 1))}
                    >
                      <ChevronLeft size={16} strokeWidth={2.2} />
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={activeQuestionIndex >= currentQuestions.length - 1 || isExamActionLocked}
                      onClick={() => setActiveQuestionIndex((current) => Math.min(currentQuestions.length - 1, current + 1))}
                    >
                      Next
                      <ChevronRight size={16} strokeWidth={2.2} />
                    </button>
                  </span>
                </footer>
              ) : null}
            </div>

            <aside className="online-practice-side-nav" aria-label="Question navigation">
              <div className="online-proctored-side-meta" aria-label="Proctored assessment summary">
                <span className="online-proctored-side-badge">
                  <Monitor size={14} strokeWidth={2.3} />
                  Proctored Exams
                </span>
                <div className="online-proctored-side-meta-grid">
                  {sideNavMetaItems.map((item) => (
                    <span key={item.tone} className={`is-${item.tone} ${item.isCritical ? 'is-critical' : ''}`.trim()}>
                      <em>{item.label}</em>
                      <strong>{item.value}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {shouldShowSectionTabs ? (
                <div className="online-practice-tabs" role="tablist" aria-label="Question sections">
                  {hasMcqSection ? (
                    <button
                      type="button"
                      className={`${activeSection === 'mcq' ? 'is-active' : ''} ${isMcqSubmitted ? 'is-completed' : ''}`.trim()}
                      onClick={() => switchSection('mcq')}
                      disabled={isMcqSubmitted || isExamActionLocked}
                    >
                      {isMcqSubmitted ? 'MCQ Completed' : 'MCQ'}
                    </button>
                  ) : null}
                  {hasDescriptiveSection ? (
                    <button
                      type="button"
                      className={`${activeSection === 'descriptive' ? 'is-active' : ''} ${isDescriptiveSubmitted ? 'is-completed' : ''}`.trim()}
                      onClick={() => switchSection('descriptive')}
                      disabled={isDescriptiveSubmitted || isExamActionLocked}
                    >
                      {isDescriptiveSubmitted ? 'Descriptive Completed' : 'Descriptive'}
                    </button>
                  ) : null}
                </div>
              ) : isSplitProctoredFlow ? (
                <div className="online-proctored-sequence-note">
                  <ShieldCheck size={15} strokeWidth={2.4} />
                  <strong>{activeSequenceLabel}</strong>
                </div>
              ) : null}

              {sequenceAutoNotice ? (
                <div className="online-proctored-sequence-alert" role="status">
                  {sequenceAutoNotice}
                </div>
              ) : null}

              <div className="online-practice-nav-summary" aria-label={`${activeSection === 'mcq' ? 'MCQ' : 'Descriptive'} section summary`}>
                <span>
                  <strong>{activeSection === 'mcq' ? mcqQuestions.length : descriptiveQuestions.length}</strong>
                  <em>Total Questions</em>
                </span>
                <span>
                  <strong>{String(activeSection === 'mcq' ? mcqTotalMarks : descriptiveTotalMarks).padStart(2, '0')}</strong>
                  <em>Total Marks</em>
                </span>
              </div>

              {activeSection === 'mcq' ? (
                mcqAllowsAnswerInput ? (
                  <div className="online-practice-mcq-nav-panel">
                    <div className="online-practice-mcq-attended-row">
                      <span>Attended</span>
                      <strong>{attendedMcqCount} / {mcqQuestions.length}</strong>
                    </div>

                    <div className="online-practice-number-nav" aria-label="MCQ question numbers">
                      {mcqQuestions.map((question, index) => {
                        const status = mcqQuestionStatuses[getMcqQuestionKey(question, index)] || 'not-viewed'

                        return (
                            <button
                              type="button"
                              key={question.id ?? index}
                              className={`is-${status} ${activeQuestionIndex === index ? 'is-active' : ''}`.trim()}
                              onClick={() => setActiveQuestionIndex(index)}
                              disabled={isMcqLocked || isExamActionLocked}
                            >
                              {index + 1}
                            </button>
                        )
                      })}
                    </div>

                    <>
                      <div className="online-practice-question-status-legend" aria-label="Question status legend">
                        <span className="is-answered"><i aria-hidden="true" />Answered</span>
                        <span className="is-try-later"><i aria-hidden="true" />Try Later</span>
                        <span className="is-not-viewed"><i aria-hidden="true" />Not Viewed</span>
                        <span className="is-viewed"><i aria-hidden="true" />Viewed</span>
                      </div>
                      {shouldShowMcqSubmit ? (
                        <button
                          type="button"
                          className="online-practice-submit-mcq-btn"
                          onClick={() => openSubmitModal('mcq')}
                          disabled={isMcqSubmitted || isAssessmentSubmitted || isExamActionLocked}
                        >
                          {isMcqSubmitted ? 'MCQ Assessment Submitted' : splitSectionSubmitLabel('mcq')}
                        </button>
                      ) : null}
                    </>
                  </div>
                ) : null
              ) : (
                <div className="online-practice-section-nav" aria-label="Descriptive sections">
                  {descriptiveGroups.map((group, index) => {
                    const isActive = activeDescriptiveGroupKey ? activeDescriptiveGroupKey === group.key : index === 0

                    return (
                      <button
                        type="button"
                        key={group.key}
                        className={isActive ? 'is-active' : ''}
                        onClick={() => showDescriptiveSection(group.key)}
                        disabled={isDescriptiveLocked || isExamActionLocked}
                      >
                        <span>{group.roman}</span>
                        <strong>{group.title}</strong>
                        <em>
                          {String(group.totalMarks).padStart(2, '0')} Marks
                          {' '}
                          &bull;
                          {' '}
                          {group.questions.length} Questions
                        </em>
                      </button>
                    )
                  })}
                </div>
              )}

              {shouldShowMcqSubmit && !mcqAllowsAnswerInput ? (
                <button
                  type="button"
                  className="online-practice-submit-mcq-btn online-practice-submit-assessment-btn"
                  onClick={() => openSubmitModal('mcq')}
                  disabled={isMcqSubmitted || isAssessmentSubmitted || isExamActionLocked}
                >
                  {isMcqSubmitted ? 'MCQ Assessment Submitted' : splitSectionSubmitLabel('mcq')}
                </button>
              ) : null}

               {shouldShowDescriptiveSubmit ? (
                <button
                  type="button"
                  className="online-practice-submit-mcq-btn online-practice-submit-assessment-btn"
                  onClick={() => openSubmitModal('descriptive')}
                  disabled={isDescriptiveSubmitted || isAssessmentSubmitted || isExamActionLocked}
                >
                  {isAssessmentSubmitted ? 'Assessment Submitted' : isDescriptiveSubmitted ? 'Descriptive Assessment Submitted' : splitSectionSubmitLabel('descriptive')}
                </button>
              ) : null}

              {shouldShowFinalSubmit ? (
                <button
                  type="button"
                  className="online-practice-submit-mcq-btn online-practice-submit-assessment-btn"
                  onClick={() => openSubmitModal('final')}
                  disabled={isAssessmentSubmitted || hasPendingSections || isExamActionLocked}
                >
                  Submit Assessment
                </button>
              ) : null}
            </aside>
          </div>
        </section>
      )}

      {shouldShowExamPauseOverlay ? (
        <div className="online-practice-submit-overlay online-proctored-lock-overlay" role="presentation">
          <section className="online-proctored-violation-overlay online-practice-submit-modal is-paused" role="dialog" aria-modal="true" aria-labelledby="online-proctored-pause-title">
            <span className="online-practice-time-limit-icon" aria-hidden="true">
              <AlertTriangle size={34} strokeWidth={2.4} />
            </span>
            <h2 id="online-proctored-pause-title">Exam Paused</h2>
            <p>{examPause.message || 'Return to the exam screen to continue.'}</p>
            <div className="online-practice-submit-actions online-practice-exit-actions">
              {examPause.requiresFullscreen ? (
                <button type="button" onClick={returnToFullscreen}>
                  Return Fullscreen
                </button>
              ) : (
                <button type="button" onClick={resumePausedExam}>
                  Resume Exam
                </button>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {shouldShowFullscreenViolation ? (
        <div className="online-practice-submit-overlay" role="presentation">
          <section className={`online-proctored-violation-overlay online-practice-submit-modal is-${proctorViolation.phase}`} role="dialog" aria-modal="true" aria-labelledby="online-proctored-violation-title">
            <span className="online-practice-time-limit-icon" aria-hidden="true">
              <AlertTriangle size={34} strokeWidth={2.4} />
            </span>
            <h2 id="online-proctored-violation-title">Security Violation</h2>
            <p>{proctorViolation.message}</p>
            {isFullscreenRequiredForDevice && !isFullscreenMode ? (
              <p className="online-proctored-violation-note">Fullscreen mode is required to continue. Return to fullscreen to resume.</p>
            ) : null}
            {proctorViolationRemainingSeconds > 0 ? (
              <p className="online-proctored-violation-note">
                {isProctorPenaltyOrLock ? 'Restricted for' : 'Auto action in'}
                {' '}
                {String(proctorViolationRemainingSeconds).padStart(2, '0')}
                {' '}
                seconds.
              </p>
            ) : null}
            <div className="online-practice-submit-actions online-practice-exit-actions">
              {isFullscreenRequiredForDevice && !isFullscreenMode ? (
                <button type="button" onClick={returnToFullscreen}>
                  Return Fullscreen
                </button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {submitModal ? (
        <div className="online-practice-submit-overlay" role="presentation">
          <section className={`online-practice-submit-modal is-${submitModal.phase}`} role="dialog" aria-modal="true" aria-labelledby="online-practice-submit-title">
            {submitModal.phase === 'success' ? (
              <>
                <span className="online-practice-submit-success-icon" aria-hidden="true">
                  <CheckCircle2 size={34} strokeWidth={2.4} />
                </span>
                <h2 id="online-practice-submit-title">{submitModalCopy.success}</h2>
                <p>
                  {submitModal.isFinal || submitModal.section === 'final'
                    ? 'Redirecting to My Assessment.'
                    : submitModal.section === 'mcq'
                      ? 'Opening the descriptive section now.'
                      : 'Opening the MCQ section now.'}
                </p>
              </>
            ) : (
              <>
                <h2 id="online-practice-submit-title">{submitModalCopy.title}</h2>
                <p>{submitModalCopy.message}</p>

                <div className="online-practice-submit-summary" aria-label="Submission summary">
                  <span>
                    <em>Assessment</em>
                    <strong>{assessment?.name || assessment?.assessmentName || 'Assessment'}</strong>
                  </span>
                  <span>
                    <em>Exam Type</em>
                    <strong>{assessment?.examType || '-'}</strong>
                  </span>
                  <span>
                    <em>Questions</em>
                    <strong>{submitModalCopy.questions}</strong>
                  </span>
                  <span>
                    <em>Marks</em>
                    <strong>{submitModalCopy.marks}</strong>
                  </span>
                  {submitModalCopy.answered ? (
                    <span className="is-wide">
                      <em>MCQ Progress</em>
                      <strong>{submitModalCopy.answered}</strong>
                    </span>
                  ) : null}
                </div>

                <div className="online-practice-submit-actions">
                  <button type="button" className="is-secondary" onClick={closeSubmitModal}>
                    Cancel
                  </button>
                  <button type="button" onClick={confirmSubmit}>
                    Confirm Submit
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}

      {isExitModalOpen ? (
        <div className="online-practice-submit-overlay" role="presentation">
          <section className="online-practice-submit-modal online-practice-exit-modal" role="dialog" aria-modal="true" aria-labelledby="online-practice-exit-title">
            <span className="online-practice-exit-warning-icon" aria-hidden="true">
              <AlertTriangle size={32} strokeWidth={2.4} />
            </span>
            <h2 id="online-practice-exit-title">Hold on, you're not quite done!</h2>
            <p>This proctored exam is still in progress. Exiting now may leave the assessment incomplete. Are you sure you want to quit right now?</p>
            <div className="online-practice-submit-actions online-practice-exit-actions">
              <button type="button" onClick={finishTest}>
                Finish the Test
              </button>
              <button type="button" className="is-danger" onClick={exitAnyway}>
                Exit Anyway
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {sequenceTransitionModal ? (
        <div className="online-practice-submit-overlay" role="presentation">
          <section className="online-practice-submit-modal online-proctored-sequence-modal" role="dialog" aria-modal="true" aria-labelledby="online-proctored-sequence-title">
            <span className="online-practice-time-limit-icon" aria-hidden="true">
              <Timer size={32} strokeWidth={2.4} />
            </span>
            <h2 id="online-proctored-sequence-title">Section Time Completed</h2>
            <p>{sequenceTransitionModal.fromLabel} time has ended. The next section will begin shortly.</p>
            <div className="online-proctored-sequence-countdown" aria-live="polite">
              <strong>{sequenceTransitionRemainingSeconds}</strong>
              <span>Continuing to {sequenceTransitionModal.toLabel} in {sequenceTransitionRemainingSeconds} seconds...</span>
            </div>
          </section>
        </div>
      ) : null}

      {isTimeLimitModalOpen ? (
        <div className="online-practice-submit-overlay" role="presentation">
          <section className="online-practice-submit-modal online-practice-time-limit-modal is-success" role="dialog" aria-modal="true" aria-labelledby="online-practice-time-limit-title">
            <span className="online-practice-time-limit-icon" aria-hidden="true">
              <Timer size={34} strokeWidth={2.4} />
            </span>
            <h2 id="online-practice-time-limit-title">Time Limit Reached</h2>
            <p>Thank you for completing the assessment. The allocated time has ended. Your test is now being automatically submitted, and this window will close shortly.</p>
          </section>
        </div>
      ) : null}

      {imagePreview ? (
        <div className="online-practice-image-preview-overlay" role="presentation" onClick={closeImagePreview}>
          <section className="online-practice-image-preview-modal" role="dialog" aria-modal="true" aria-labelledby="online-practice-image-preview-title" onClick={(event) => event.stopPropagation()}>
            <header>
              <span className="online-practice-image-preview-badge">{String.fromCharCode(65 + imagePreview.index)}</span>
              <h2 id="online-practice-image-preview-title">Question Image</h2>
              <strong>{imagePreview.index + 1} / {imagePreview.images.length}</strong>
              <button type="button" onClick={closeImagePreview} aria-label="Close image preview">
                <X size={18} strokeWidth={2.4} />
              </button>
            </header>
            <div className="online-practice-image-preview-stage">
              <img
                src={imagePreview.images[imagePreview.index]?.url}
                alt={imagePreview.images[imagePreview.index]?.name || `Question image ${imagePreview.index + 1}`}
              />
            </div>
            <footer>
              <button type="button" onClick={() => moveImagePreview(-1)} disabled={imagePreview.index <= 0}>
                <ChevronLeft size={16} strokeWidth={2.3} />
                Previous
              </button>
              <button type="button" onClick={() => moveImagePreview(1)} disabled={imagePreview.index >= imagePreview.images.length - 1}>
                Next
                <ChevronRight size={16} strokeWidth={2.3} />
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default OnlineProctoredExamPage
