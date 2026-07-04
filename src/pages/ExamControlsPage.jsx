import { Fragment, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Activity, ArrowLeft, CalendarDays, CheckCircle2, Clock3, FileText, Info, Monitor, Search, ShieldCheck, TimerReset } from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
import { APP_PAGES } from '../config/appPages'
import '../styles/assessment-pages.css'

const EXAM_CONTROLS_ASSESSMENT_KEY = 'vx-exam-controls-assessment'
const EXAM_CONTROLS_STATE_KEY = 'vx-exam-controls-state'
const EXAM_CONTROLS_STATE_CHANGED_EVENT = 'vx-exam-controls-state-changed'
const ASSESSMENT_CREATE_INITIAL_TAB_KEY = 'vx-assessment-create-initial-tab'
const STUDENT_EXAM_TIME_EXTENSIONS_KEY = 'vx-student-exam-time-extensions'
const STUDENT_EXAM_TIME_EXTENSION_EVENT = 'vx-student-exam-time-extension-changed'
const STUDENT_EXAM_SUBMISSION_STATUS_KEY = 'vx-student-exam-submission-status'
const STUDENT_EXAM_SUBMISSION_STATUS_EVENT = 'vx-student-exam-submission-status-changed'
const STUDENT_EXAM_SESSION_KEY = 'vx-student-exam-session'
const STUDENT_EXAM_SESSION_EVENT = 'vx-student-exam-session-changed'
const STUDENT_EXAM_RESET_KEY = 'vx-student-exam-reset-state'
const STUDENT_EXAM_RESET_EVENT = 'vx-student-exam-reset-changed'
const ASSESSMENT_PUBLISHED_STORAGE_KEY = 'vx-assessment-published'
const ASSESSMENT_PUBLISHED_CHANGED_EVENT = 'vx-assessment-published-changed'
const ONLINE_PRACTICE_EXAM_STORAGE_KEY = 'vx-online-practice-exam-assessment'
const ONLINE_PROCTORED_EXAM_STORAGE_KEY = 'vx-online-proctored-exam-assessment'

const CONTROL_STUDENTS = [
  { id: 'MV1253', name: 'Student 1', attendance: 'P' },
  { id: 'MV1254', name: 'Student 2', attendance: 'P' },
  { id: 'MV1255', name: 'Student 3', attendance: 'A' },
  { id: 'MC2568', name: 'Karthik Subramanian', attendance: 'P' },
]

const CLASS_RESUME_STATUS_OPTIONS = [
  { value: 'violation', label: 'Violation' },
]

const readExamControlsAssessment = () => {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(EXAM_CONTROLS_ASSESSMENT_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const readControlState = (assessmentId) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(`${EXAM_CONTROLS_STATE_KEY}:${assessmentId}`) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeControlState = (assessmentId, state) => {
  window.localStorage.setItem(`${EXAM_CONTROLS_STATE_KEY}:${assessmentId}`, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(EXAM_CONTROLS_STATE_CHANGED_EVENT, {
    detail: { assessmentId },
  }))
}

const isSameAssessmentRecord = (first, second) => {
  if (!first || !second) return false
  if (first.id && second.id) return first.id === second.id

  return (
    first.assessmentName === second.assessmentName
    && first.startDate === second.startDate
    && first.startTime === second.startTime
  )
}

const readStudentTimeExtensions = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STUDENT_EXAM_TIME_EXTENSIONS_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const readStudentSubmissionStatuses = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STUDENT_EXAM_SUBMISSION_STATUS_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const readStudentExamSessions = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STUDENT_EXAM_SESSION_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const readStudentExamResets = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STUDENT_EXAM_RESET_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const removeStudentStorageRecord = (key, assessmentId, studentId) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || 'null')
    if (!parsed?.[assessmentId]) return
    const nextAssessmentValue = { ...parsed[assessmentId] }
    delete nextAssessmentValue[studentId]
    const nextValue = { ...parsed }
    if (Object.keys(nextAssessmentValue).length) {
      nextValue[assessmentId] = nextAssessmentValue
    } else {
      delete nextValue[assessmentId]
    }
    window.localStorage.setItem(key, JSON.stringify(nextValue))
  } catch {
    // Reset should remain best-effort even if optional student state is malformed.
  }
}

const clearAssessmentCompletedStatus = (assessment) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ASSESSMENT_PUBLISHED_STORAGE_KEY) || '[]')
    if (Array.isArray(parsed)) {
      const updated = parsed.map((item) => (
        isSameAssessmentRecord(item, assessment)
          ? { ...item, status: undefined, completedAt: undefined }
          : item
      ))
      window.localStorage.setItem(ASSESSMENT_PUBLISHED_STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent(ASSESSMENT_PUBLISHED_CHANGED_EVENT))
    }
  } catch {
    // Keep reset flow moving even if published storage is unavailable.
  }

  ;[ONLINE_PRACTICE_EXAM_STORAGE_KEY, ONLINE_PROCTORED_EXAM_STORAGE_KEY].forEach((key) => {
    try {
      const selectedAssessment = JSON.parse(window.sessionStorage.getItem(key) || 'null')
      if (isSameAssessmentRecord(selectedAssessment, assessment)) {
        window.sessionStorage.setItem(key, JSON.stringify({
          ...selectedAssessment,
          status: undefined,
          completedAt: undefined,
        }))
      }
    } catch {
      // Session storage is optional here.
    }
  })
}

const writeStudentExamReset = ({ assessmentId, studentId, mode }) => {
  const resets = readStudentExamResets()
  const assessmentResets = resets[assessmentId] || {}
  const previous = assessmentResets[studentId] || {}
  const reset = {
    mode,
    version: Number(previous.version || 0) + 1,
    resetAt: new Date().toISOString(),
  }
  const nextResets = {
    ...resets,
    [assessmentId]: {
      ...assessmentResets,
      [studentId]: reset,
    },
  }

  window.localStorage.setItem(STUDENT_EXAM_RESET_KEY, JSON.stringify(nextResets))
  window.dispatchEvent(new CustomEvent(STUDENT_EXAM_RESET_EVENT, {
    detail: { assessmentId, studentId, reset },
  }))
}

const writeStudentTimeExtension = ({ assessmentId, studentId, minutes, section }) => {
  const extensions = readStudentTimeExtensions()
  const assessmentExtensions = extensions[assessmentId] || {}
  const studentExtension = assessmentExtensions[studentId] || {}
  const sectionExtensions = studentExtension.sectionExtensions || {}
  const nextStudentExtension = {
    ...studentExtension,
    extensionMinutes: section
      ? Number(studentExtension.extensionMinutes || 0)
      : Number(studentExtension.extensionMinutes || 0) + minutes,
    sectionExtensions: {
      ...sectionExtensions,
      ...(section ? { [section]: Number(sectionExtensions[section] || 0) + minutes } : {}),
    },
    updatedAt: new Date().toISOString(),
  }

  const nextExtensions = {
    ...extensions,
    [assessmentId]: {
      ...assessmentExtensions,
      [studentId]: nextStudentExtension,
    },
  }

  window.localStorage.setItem(STUDENT_EXAM_TIME_EXTENSIONS_KEY, JSON.stringify(nextExtensions))
  window.dispatchEvent(new CustomEvent(STUDENT_EXAM_TIME_EXTENSION_EVENT, {
    detail: { assessmentId, studentId, minutes, section },
  }))
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

const parseDurationMinutes = (value) => {
  const text = String(value || '').trim()
  if (!text) return 0
  if (text.includes(':')) {
    const parts = text.split(':').map((part) => Number(part.trim()))
    if (parts.some((part) => Number.isNaN(part))) return 0
    if (parts.length === 2) return Math.max(0, (parts[0] * 60) + parts[1])
    if (parts.length === 3) return Math.max(0, (parts[0] * 3600) + (parts[1] * 60) + parts[2])
  }
  const numeric = Number(text)
  if (Number.isFinite(numeric) && numeric > 0) return Math.floor(Math.max(0, numeric))
  return 0
}

const formatDuration = (minutes) => {
  const total = Math.max(0, Number(minutes) || 0)
  const hours = Math.floor(total / 60)
  const mins = total % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

const formatCountdown = (ms) => {
  const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const formatDisplayDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB').replace(/\//g, '-')
}

const formatDisplayTime = (date) => (
  date && !Number.isNaN(date.getTime())
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '-'
)

const getAssessmentSchedule = (assessment, now) => {
  const startDate = parseAssessmentDate(assessment?.startDate)
  const startAt = applyAssessmentTime(startDate, assessment?.startTime)
  const durationMinutes = parseDurationMinutes(assessment?.totalDuration)
  const durationEndAt = startAt && durationMinutes ? new Date(startAt.getTime() + durationMinutes * 60 * 1000) : null
  const endDate = parseAssessmentDate(assessment?.endDate)
  const dateEndAt = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null
  const endAt = [durationEndAt, dateEndAt].filter(Boolean).sort((first, second) => first - second)[0] || null

  if (!startAt || !endAt) {
    return { status: 'unknown', label: 'Schedule not available', remainingMs: 0, startAt, endAt, durationMinutes }
  }

  if (now > endAt) return { status: 'completed', label: 'Completed', remainingMs: 0, startAt, endAt, durationMinutes }
  if (now >= startAt) return { status: 'live', label: 'Assessment Live', remainingMs: endAt.getTime() - now.getTime(), startAt, endAt, durationMinutes }
  return { status: 'upcoming', label: 'Upcoming', remainingMs: startAt.getTime() - now.getTime(), startAt, endAt, durationMinutes }
}

const hasDescriptiveType = (assessment) => String(assessment?.examType || '').toLowerCase().includes('descriptive') || String(assessment?.examType || '').toLowerCase().includes('hybrid')
const hasMcqType = (assessment) => String(assessment?.examType || '').toLowerCase().includes('mcq') || String(assessment?.examType || '').toLowerCase().includes('hybrid')

const buildDefaultLogs = (student, assessment, schedule) => [
  {
    id: `${student.id}-joined`,
    time: formatDisplayTime(schedule.startAt),
    action: 'Started exam',
    remarks: `${student.name} entered ${assessment?.assessmentName || 'assessment'}.`,
    faculty: 'System',
  },
  {
    id: `${student.id}-tracking`,
    time: formatDisplayTime(new Date()),
    action: 'Live tracking',
    remarks: 'Live exam tracking log initialized.',
    faculty: 'System',
  },
]

function ExamControlsPage({ onNavigate }) {
  const assessment = readExamControlsAssessment()
  const assessmentId = assessment?.id || assessment?.assessmentId || assessment?.setup?.assessmentId || 'selected-assessment'
  const [now, setNow] = useState(() => new Date())
  const [controlState, setControlState] = useState(() => readControlState(assessmentId))
  const [extendModal, setExtendModal] = useState(null)
  const [extendForm, setExtendForm] = useState({
    clearAnswers: 'no',
    completeTimeReset: 'no',
    quickMinutes: '',
    customMinutes: '',
  })
  const [extendError, setExtendError] = useState('')
  const [extendSuccessModal, setExtendSuccessModal] = useState(null)
  const [resetModal, setResetModal] = useState(null)
  const [resetMode, setResetMode] = useState('clear')
  const [classResetModal, setClassResetModal] = useState(false)
  const [classResetForm, setClassResetForm] = useState({
    clearAnswers: 'no',
    completeTimeReset: 'no',
    resetAccess: 'yes',
    quickMinutes: '',
    customMinutes: '',
    extendSection: 'full',
    targetStatus: 'violation',
  })
  const [classResetError, setClassResetError] = useState('')
  const [logModal, setLogModal] = useState(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [submissionStatuses, setSubmissionStatuses] = useState(() => readStudentSubmissionStatuses())
  const [studentSessions, setStudentSessions] = useState(() => readStudentExamSessions())
  const [studentTimeExtensions, setStudentTimeExtensions] = useState(() => readStudentTimeExtensions())

  const goBackToPublishedTab = () => {
    window.localStorage.setItem(ASSESSMENT_CREATE_INITIAL_TAB_KEY, 'published')
    onNavigate?.(APP_PAGES.ASSESSMENT_CREATE)
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(intervalId)
  }, [assessmentId])

  useEffect(() => {
    const syncSubmissionStatuses = () => setSubmissionStatuses(readStudentSubmissionStatuses())
    const syncStudentSessions = () => setStudentSessions(readStudentExamSessions())
    const syncStudentTimeExtensions = () => setStudentTimeExtensions(readStudentTimeExtensions())
    const syncControlState = () => setControlState(readControlState(assessmentId))

    const handleStorage = (event) => {
      if (event.key === STUDENT_EXAM_SUBMISSION_STATUS_KEY) syncSubmissionStatuses()
      if (event.key === STUDENT_EXAM_SESSION_KEY) syncStudentSessions()
      if (event.key === STUDENT_EXAM_TIME_EXTENSIONS_KEY) syncStudentTimeExtensions()
      if (event.key === `${EXAM_CONTROLS_STATE_KEY}:${assessmentId}`) syncControlState()
    }

    const handleStatusEvent = () => syncSubmissionStatuses()
    const handleSessionEvent = () => syncStudentSessions()
    const handleTimeExtensionEvent = () => syncStudentTimeExtensions()
    const handleControlStateEvent = (event) => {
      if (!event?.detail) {
        syncControlState()
        return
      }
      if (!event.detail.assessmentId || event.detail.assessmentId === assessmentId) {
        syncControlState()
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(STUDENT_EXAM_SUBMISSION_STATUS_EVENT, handleStatusEvent)
    window.addEventListener(STUDENT_EXAM_SESSION_EVENT, handleSessionEvent)
    window.addEventListener(STUDENT_EXAM_TIME_EXTENSION_EVENT, handleTimeExtensionEvent)
    window.addEventListener(EXAM_CONTROLS_STATE_CHANGED_EVENT, handleControlStateEvent)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(STUDENT_EXAM_SUBMISSION_STATUS_EVENT, handleStatusEvent)
      window.removeEventListener(STUDENT_EXAM_SESSION_EVENT, handleSessionEvent)
      window.removeEventListener(STUDENT_EXAM_TIME_EXTENSION_EVENT, handleTimeExtensionEvent)
      window.removeEventListener(EXAM_CONTROLS_STATE_CHANGED_EVENT, handleControlStateEvent)
    }
  }, [])

  useEffect(() => {
    if (!extendSuccessModal) return undefined

    const timeoutId = window.setTimeout(() => {
      setExtendSuccessModal(null)
    }, 2000)

    return () => window.clearTimeout(timeoutId)
  }, [extendSuccessModal])

  const schedule = useMemo(() => getAssessmentSchedule(assessment, now), [assessment, now])
  const setup = assessment?.setup || {}
  const isProctored = String(assessment?.supervisionType || '').toLowerCase().includes('proctored')
  const isPractice = String(assessment?.supervisionType || '').toLowerCase().includes('practice')
  const isHybrid = String(assessment?.examType || '').toLowerCase().includes('hybrid')
  const isSplitHybrid = Boolean(isProctored && isHybrid && setup.splitProctoredDuration)
  const isFinalFiveMinutes = schedule.status === 'live' && schedule.remainingMs <= 5 * 60 * 1000
  const controlsDisabled = schedule.status !== 'live'
  const baseDurationMinutes = parseDurationMinutes(assessment?.totalDuration)
  const mcqDurationMinutes = parseDurationMinutes(setup.mcqTimeLimit) || baseDurationMinutes
  const descriptiveDurationMinutes = parseDurationMinutes(setup.descriptiveTimeLimit) || baseDurationMinutes
  const splitOrder = setup.proctoredSectionSequence === 'descriptive-first'
    ? ['descriptive', 'mcq']
    : ['mcq', 'descriptive']

  const students = useMemo(() => CONTROL_STUDENTS.map((student, index) => {
    const state = controlState[student.id] || {}
    const storedExtension = studentTimeExtensions?.[assessmentId]?.[student.id] || {}
    const storedSectionExtensions = storedExtension.sectionExtensions || {}
    const session = studentSessions?.[assessmentId]?.[student.id] || null
    const sessionLoginTime = session?.loginTime ? new Date(session.loginTime) : null
    const hasValidLoginTime = sessionLoginTime && !Number.isNaN(sessionLoginTime.getTime())
    const isPresent = Boolean(hasValidLoginTime)
    const startTime = hasValidLoginTime ? sessionLoginTime : null
    const extensionMinutes = Math.max(Number(state.extensionMinutes || 0), Number(storedExtension.extensionMinutes || 0))
    const mcqExtensionMinutes = Math.max(Number(state.mcqExtensionMinutes || 0), Number(storedSectionExtensions.mcq || 0))
    const descriptiveExtensionMinutes = Math.max(Number(state.descriptiveExtensionMinutes || 0), Number(storedSectionExtensions.descriptive || 0))
    const liveUntilMs = Number(state.liveUntilMs || 0)
    const mcqLiveUntilMs = Number(state.mcqLiveUntilMs || 0)
    const descriptiveLiveUntilMs = Number(state.descriptiveLiveUntilMs || 0)
    const hasLiveExtension = liveUntilMs > now.getTime() || mcqLiveUntilMs > now.getTime() || descriptiveLiveUntilMs > now.getTime()
    const invigilatorLock = state.invigilatorLock || null
    const lockedAt = Date.parse(invigilatorLock?.lockedAt || '')
    const resumeUnlockedAt = Date.parse(state.resumeUnlockedAt || '')
    const hasRestoredAfterLock = Number.isFinite(resumeUnlockedAt)
      && (!Number.isFinite(lockedAt) || resumeUnlockedAt >= lockedAt)
    const isInvigilatorLockActive = Boolean(invigilatorLock?.active) && !hasRestoredAfterLock
    const violationCount = Math.max(
      0,
      Number(state.fullscreenViolationTotal ?? state.fullscreenExitCount ?? invigilatorLock?.exitCount ?? 0),
    )
    const submissionState = submissionStatuses?.[assessmentId]?.[student.id] || {}
    const submittedStatus = submissionState.status || ''
    const completedSubmissionStatus = submittedStatus && !['Manual Submit', 'Auto Submit'].includes(submittedStatus)
      ? submittedStatus
      : submittedStatus
        ? 'Completed'
        : ''
    const submittedAt = Date.parse(submissionState.updatedAt || '')
    const extensionUpdatedAt = Date.parse(state.extensionUpdatedAt || '')
    const hasSubmissionAfterExtension = Boolean(submittedStatus && (!Number.isFinite(extensionUpdatedAt) || Number.isFinite(submittedAt) && submittedAt >= extensionUpdatedAt))
    const status = !isPresent
      ? 'Absent'
      : hasSubmissionAfterExtension
        ? completedSubmissionStatus
        : hasLiveExtension
          ? 'In progress'
        : schedule.status === 'completed'
        ? 'Completed'
        : schedule.status === 'live'
          ? 'In progress'
          : 'Waiting'
    const persistedStatus = state.overallStatus || ''
    const overallStatus = !isPresent
      ? 'Absent'
      : isInvigilatorLockActive
        ? 'Violation'
        : submittedStatus
          ? completedSubmissionStatus
          : hasSubmissionAfterExtension
            ? completedSubmissionStatus
            : hasLiveExtension
              ? 'In progress'
              : persistedStatus === 'In progress' && schedule.status === 'completed'
                ? 'Completed'
                : persistedStatus || status

    return {
      ...student,
      attendance: isPresent ? 'P' : 'A',
      startTime,
      extensionMinutes,
      mcqExtensionMinutes,
      descriptiveExtensionMinutes,
      liveUntilMs,
      mcqLiveUntilMs,
      descriptiveLiveUntilMs,
      violationCount,
      hasSubmissionAfterExtension,
      invigilatorLock: isInvigilatorLockActive ? invigilatorLock : null,
      accessRequest: isInvigilatorLockActive ? state.accessRequest || null : null,
      overallStatus,
      logs: state.logs || buildDefaultLogs(student, assessment, schedule),
    }
  }), [assessment, assessmentId, controlState, now, schedule, studentSessions, studentTimeExtensions, submissionStatuses])

  const classResetTargets = useMemo(() => {
    const seen = new Map()
    CONTROL_STUDENTS.forEach((student) => {
      if (!student?.id) return
      seen.set(student.id, {
        id: student.id,
        name: student.name || `Student ${student.id}`,
      })
    })
    ;(studentSessions?.[assessmentId] && Object.keys(studentSessions[assessmentId]).forEach((studentId) => {
      const session = studentSessions[assessmentId]?.[studentId]
      seen.set(studentId, {
        id: studentId,
        name: session?.name || session?.studentName || seen.get(studentId)?.name || `Student ${studentId}`,
      })
    }))

    Object.keys(submissionStatuses?.[assessmentId] || {}).forEach((studentId) => {
      seen.set(studentId, {
        id: studentId,
        name: seen.get(studentId)?.name || `Student ${studentId}`,
      })
    })

    Object.keys(controlState || {}).forEach((studentId) => {
      seen.set(studentId, {
        id: studentId,
        name: seen.get(studentId)?.name || `Student ${studentId}`,
      })
    })

    return Array.from(seen.values())
  }, [assessmentId, controlState, studentSessions, submissionStatuses])

  const getClassResumeStatus = (student) => {
    if (student.attendance !== 'P') return 'absent'
    if (!isProctored) return 'not-eligible'
    const statusText = String(student.overallStatus || '').toLowerCase()
    if (
      Boolean(student.invigilatorLock?.active)
      || statusText.includes('locked')
      || statusText.includes('violation')
      || statusText.includes('fullscreen')
    ) return 'violation'
    if (statusText.includes('completed')) return 'completed'
    if (statusText.includes('waiting')) return 'waiting'
    return 'in-progress'
  }

  const isStudentViolationActive = (student) => (
    isProctored
    && student.attendance === 'P'
    && Boolean(student.invigilatorLock?.active)
  )

  const classResumeTargets = useMemo(() => (
    students.filter((student) => isStudentViolationActive(student))
  ), [students])

  const classResumeStatusCounts = useMemo(() => {
    const counts = CLASS_RESUME_STATUS_OPTIONS.reduce((next, item) => ({ ...next, [item.value]: 0 }), {})
    students.forEach((student) => {
      const status = getClassResumeStatus(student)
      if (status === 'absent') return
      counts.all += 1
      if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1
    })
    return counts
  }, [students])

  const visibleStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase()
    const filteredStudents = query ? students.filter((student) => (
      String(student.id || '').toLowerCase().includes(query)
      || String(student.name || '').toLowerCase().includes(query)
      || String(student.attendance || '').toLowerCase().includes(query)
      || String(student.overallStatus || '').toLowerCase().includes(query)
    )) : students

    return [...filteredStudents].sort((first, second) => {
      const firstStatus = String(first.overallStatus || '').toLowerCase()
      const secondStatus = String(second.overallStatus || '').toLowerCase()
      const firstViolation = Boolean(first.invigilatorLock?.active)
        || firstStatus.includes('locked')
        || firstStatus.includes('violation')
        || firstStatus.includes('fullscreen')
        ? 1
        : 0
      const secondViolation = Boolean(second.invigilatorLock?.active)
        || secondStatus.includes('locked')
        || secondStatus.includes('violation')
        || secondStatus.includes('fullscreen')
        ? 1
        : 0
      if (firstViolation !== secondViolation) return secondViolation - firstViolation
      const firstRequested = first.accessRequest?.active ? 1 : 0
      const secondRequested = second.accessRequest?.active ? 1 : 0
      if (firstRequested !== secondRequested) return secondRequested - firstRequested
      return 0
    })
  }, [studentSearch, students])

  const addStudentLog = (studentId, action, remarks) => {
    const currentState = readControlState(assessmentId)
    const previous = currentState[studentId] || {}
    const nextLog = {
      id: `${studentId}-${Date.now()}`,
      time: formatDisplayTime(new Date()),
      action,
      remarks,
      faculty: 'Karthik Subramanian',
    }
    const nextState = {
      ...currentState,
      [studentId]: {
        ...previous,
        logs: [nextLog, ...(previous.logs || [])],
        updatedAt: new Date().toISOString(),
      },
    }
    writeControlState(assessmentId, nextState)
    setControlState(nextState)
  }

  const updateStudentControlState = (studentId, updater) => {
    const currentState = readControlState(assessmentId)
    const previous = currentState[studentId] || {}
    const nextStudentState = typeof updater === 'function' ? updater(previous) : updater
    const nextState = {
      ...currentState,
      [studentId]: {
        ...previous,
        ...nextStudentState,
        updatedAt: new Date().toISOString(),
      },
    }
    writeControlState(assessmentId, nextState)
    setControlState(nextState)
    return nextState[studentId]
  }

  const getSectionLabel = (section) => (
    section === 'mcq' ? 'MCQ section' : section === 'descriptive' ? 'Descriptive section' : assessment?.assessmentName || 'this assessment'
  )

  const getSectionDurationMinutes = (section) => (
    section === 'mcq'
      ? mcqDurationMinutes
      : section === 'descriptive'
        ? descriptiveDurationMinutes
        : baseDurationMinutes
  )

  const getCompleteTimeResetBadge = (section = '') => {
    if (section === 'mcq') return `MCQ ${mcqDurationMinutes} mins`
    if (section === 'descriptive') return `Descriptive ${descriptiveDurationMinutes} mins`
    return formatDuration(baseDurationMinutes)
  }

  const getAccessRestoredState = () => ({
    resumeUnlockedAt: new Date().toISOString(),
    fullscreenExitCount: 0,
    fullscreenViolationTotal: 0,
    invigilatorLock: null,
    accessRequest: null,
    overallStatus: 'In progress',
  })

  const clearStudentExamState = (student, mode = 'clear') => {
    writeStudentExamReset({ assessmentId, studentId: student.id, mode })
    removeStudentStorageRecord(STUDENT_EXAM_SUBMISSION_STATUS_KEY, assessmentId, student.id)
    removeStudentStorageRecord(STUDENT_EXAM_TIME_EXTENSIONS_KEY, assessmentId, student.id)
    window.dispatchEvent(new CustomEvent(STUDENT_EXAM_SUBMISSION_STATUS_EVENT, {
      detail: { assessmentId, studentId: student.id, status: '' },
    }))
    window.dispatchEvent(new CustomEvent(STUDENT_EXAM_TIME_EXTENSION_EVENT, {
      detail: { assessmentId, studentId: student.id, minutes: 0, section: '' },
    }))
    clearAssessmentCompletedStatus(assessment)
  }

  const extendStudentTime = (minutes, targetModal = extendModal) => {
    if (!targetModal) return
    const { student, section } = targetModal
    const sectionLabel = section === 'mcq' ? 'MCQ section' : section === 'descriptive' ? 'Descriptive section' : assessment?.assessmentName || 'this assessment'
    const sectionIndex = section ? splitOrder.indexOf(section) : -1
    const currentLiveUntilMs = (() => {
      if (!student.startTime) return now.getTime()
      if (!section) {
        return student.startTime.getTime() + ((baseDurationMinutes + Number(student.extensionMinutes || 0)) * 60 * 1000)
      }

      const sectionWindow = getSplitSectionWindow(student, sectionIndex)
      return sectionWindow ? sectionWindow.sectionExtensionEndAt : now.getTime()
    })()

    const key = section === 'mcq' ? 'mcqExtensionMinutes' : section === 'descriptive' ? 'descriptiveExtensionMinutes' : 'extensionMinutes'
    const liveUntilKey = section === 'mcq' ? 'mcqLiveUntilMs' : section === 'descriptive' ? 'descriptiveLiveUntilMs' : 'liveUntilMs'
    updateStudentControlState(student.id, (previous) => {
      const nextLiveUntilMs = Math.max(Number(previous[liveUntilKey] || 0), currentLiveUntilMs, now.getTime()) + (minutes * 60 * 1000)
      return {
        [key]: Number(previous[key] || 0) + minutes,
        [liveUntilKey]: nextLiveUntilMs,
        extensionUpdatedAt: new Date().toISOString(),
        ...getAccessRestoredState(),
      }
    })
    writeStudentTimeExtension({ assessmentId, studentId: student.id, minutes, section })
    setStudentTimeExtensions(readStudentTimeExtensions())
    addStudentLog(student.id, 'Time extended', `${section ? `${section.toUpperCase()} section` : 'Exam'} extended by ${minutes} minutes.`)
    setExtendModal(null)
    setExtendSuccessModal({
      title: 'Time Extended',
      message: `${student.name}'s ${sectionLabel} timer has been extended by ${minutes} minutes.`,
    })
  }

  const resetStudentFullTime = (targetModal) => {
    if (!targetModal) return
    const { student, section } = targetModal
    const durationMinutes = getSectionDurationMinutes(section)
    const liveUntilKey = section === 'mcq' ? 'mcqLiveUntilMs' : section === 'descriptive' ? 'descriptiveLiveUntilMs' : 'liveUntilMs'
    const extensionKey = section === 'mcq' ? 'mcqExtensionMinutes' : section === 'descriptive' ? 'descriptiveExtensionMinutes' : 'extensionMinutes'

    updateStudentControlState(student.id, {
      [extensionKey]: 0,
      [liveUntilKey]: now.getTime() + (durationMinutes * 60 * 1000),
      extensionUpdatedAt: new Date().toISOString(),
      ...getAccessRestoredState(),
    })
    addStudentLog(student.id, 'Time reset', `${getSectionLabel(section)} timer reset to ${getCompleteTimeResetBadge(section)}.`)
    setExtendSuccessModal({
      title: 'Time Reset',
      message: `${student.name}'s ${getSectionLabel(section)} timer has been reset.`,
    })
  }

  const openResumeExtendModal = (student, section = '') => {
    setExtendForm({
      clearAnswers: 'no',
      completeTimeReset: 'no',
      quickMinutes: '',
      customMinutes: '',
    })
    setExtendError('')
    setExtendModal({ student, section })
  }

  const getValidatedExtendMinutes = () => {
    const quickValue = Number(extendForm.quickMinutes || 0)
    if (quickValue > 0) return quickValue

    const text = String(extendForm.customMinutes || '').trim()
    if (!text) return 0
    if (!/^\d+$/.test(text)) return null
    const value = Number(text)
    if (value < 1 || value > 90) return null
    return value
  }

  const getExtendMinutesError = () => {
    const text = String(extendForm.customMinutes || '').trim()
    if (Number(extendForm.quickMinutes || 0) > 0) return ''
    if (!text) return 'Select quick time or enter custom minutes.'
    if (!/^\d+$/.test(text)) return 'Only whole minutes are allowed.'
    const value = Number(text)
    if (value < 1) return 'Enter at least 1 minute.'
    if (value > 90) return 'Maximum allowed extension is 90 minutes.'
    return ''
  }

  const hasResumeExtendAction = () => true

  const renderResumeSwitch = ({ checked, label, onChange }) => (
    <button
      type="button"
      className={`exam-controls-switch-toggle ${checked ? 'is-on' : 'is-off'}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        setExtendError('')
        setClassResetError('')
        onChange(checked ? 'no' : 'yes')
      }}
    >
      <span>{checked ? 'Yes' : 'No'}</span>
      <i aria-hidden="true" />
    </button>
  )

  const submitResumeExtend = () => {
    if (!extendModal) return
    const { student } = extendModal
    const shouldClearAnswers = extendForm.clearAnswers === 'yes'
    const shouldResetFullTime = extendForm.completeTimeReset === 'yes'

    if (shouldClearAnswers) {
      clearStudentExamState(student, 'clear')
    }

    if (shouldResetFullTime) {
      resetStudentFullTime(extendModal)
      setExtendModal(null)
      return
    }

    const minutes = getValidatedExtendMinutes()
    if (minutes === null) {
      setExtendError(getExtendMinutesError())
      return
    }

    if (!minutes) {
      const messageParts = ['Access restored']
      if (shouldClearAnswers) messageParts.push('saved answers cleared')
      updateStudentControlState(student.id, {
        ...getAccessRestoredState(),
      })
      addStudentLog(student.id, 'Resume attempt', `${messageParts.join(' and ')}.`)
      setExtendModal(null)
      setExtendSuccessModal({
        title: 'Resume Settings Applied',
        message: `${student.name}'s attempt can continue (${messageParts.join(' and ')}).`,
      })
      return
    }

    extendStudentTime(minutes, extendModal)
  }

  const confirmReset = () => {
    if (!resetModal) return
    const { student } = resetModal
    const resetMessage = resetMode === 'keep'
      ? 'Assessment reset. Student can continue with saved answers.'
      : 'Assessment reset. Student will start a fresh attempt.'
    writeStudentExamReset({ assessmentId, studentId: student.id, mode: resetMode })
    removeStudentStorageRecord(STUDENT_EXAM_SUBMISSION_STATUS_KEY, assessmentId, student.id)
    removeStudentStorageRecord(STUDENT_EXAM_SESSION_KEY, assessmentId, student.id)
    removeStudentStorageRecord(STUDENT_EXAM_TIME_EXTENSIONS_KEY, assessmentId, student.id)
    window.dispatchEvent(new CustomEvent(STUDENT_EXAM_SUBMISSION_STATUS_EVENT, {
      detail: { assessmentId, studentId: student.id, status: '' },
    }))
    window.dispatchEvent(new CustomEvent(STUDENT_EXAM_SESSION_EVENT, {
      detail: { assessmentId, studentId: student.id, loginTime: null },
    }))
    window.dispatchEvent(new CustomEvent(STUDENT_EXAM_TIME_EXTENSION_EVENT, {
      detail: { assessmentId, studentId: student.id, minutes: 0, section: '' },
    }))
    clearAssessmentCompletedStatus(assessment)
    setControlState((current) => {
      const previous = current[student.id] || {}
      const nextState = {
        ...current,
        [student.id]: {
          ...previous,
          resetMode,
          resetCount: Number(previous.resetCount || 0) + 1,
          extensionMinutes: 0,
          mcqExtensionMinutes: 0,
          descriptiveExtensionMinutes: 0,
          liveUntilMs: 0,
          mcqLiveUntilMs: 0,
          descriptiveLiveUntilMs: 0,
          extensionUpdatedAt: '',
          fullscreenExitCount: Number(previous.fullscreenExitCount ?? previous.fullscreenViolationTotal ?? previous.invigilatorLock?.exitCount ?? 0),
          fullscreenViolationTotal: Number(previous.fullscreenViolationTotal ?? previous.fullscreenExitCount ?? previous.invigilatorLock?.exitCount ?? 0),
          invigilatorLock: null,
          accessRequest: null,
          overallStatus: shouldResetAccess ? 'In progress' : previous.overallStatus || 'Waiting',
        },
      }
      writeControlState(assessmentId, nextState)
      return nextState
    })
    addStudentLog(
      student.id,
      'Reset assessment',
      resetMessage,
    )
    setSubmissionStatuses(readStudentSubmissionStatuses())
    setStudentSessions(readStudentExamSessions())
    setExtendSuccessModal({ title: 'Assessment Reset', message: resetMessage })
    setResetModal(null)
  }

  const openClassReset = () => {
    if (!classResetTargets.length) return
    setClassResetForm({
      clearAnswers: 'no',
      completeTimeReset: 'no',
      resetAccess: 'yes',
      quickMinutes: '',
      customMinutes: '',
      extendSection: isSplitHybrid ? 'both' : 'full',
      targetStatus: 'violation',
    })
    setClassResetError('')
    setClassResetModal(true)
  }

  const getClassExtensionMinutes = (section = '') => (
    students.reduce((sum, student) => {
      if (section === 'mcq') return sum + Number(student.mcqExtensionMinutes || 0)
      if (section === 'descriptive') return sum + Number(student.descriptiveExtensionMinutes || 0)
      return sum + Number(student.extensionMinutes || 0)
    }, 0)
  )

  const getClassRemainingLabel = (remainingMs) => {
    if (schedule.status === 'completed') return 'Completed'
    if (schedule.status !== 'live') return 'Not started'
    return formatCountdown(remainingMs)
  }

  const getClassResetTimeRows = () => {
    if (isSplitHybrid) {
      return [
        {
          label: 'MCQ remaining',
          value: getClassRemainingLabel(schedule.remainingMs),
          extension: `+${getClassExtensionMinutes('mcq')} mins`,
        },
        {
          label: 'Descriptive remaining',
          value: getClassRemainingLabel(schedule.remainingMs),
          extension: `+${getClassExtensionMinutes('descriptive')} mins`,
        },
      ]
    }

    return [{
      label: 'Remaining time',
      value: getClassRemainingLabel(schedule.remainingMs),
      extension: `+${getClassExtensionMinutes()} mins`,
    }]
  }

  const getClassViolationCount = () => (
    students.filter((student) => {
      const statusText = String(student.overallStatus || '').toLowerCase()
      return Number(student.violationCount || 0) > 0
        || Boolean(student.invigilatorLock?.active)
        || statusText.includes('locked')
        || statusText.includes('violation')
    }).length
  )

  const getClassValidatedExtendMinutes = () => {
    const quickValue = Number(classResetForm.quickMinutes || 0)
    if (quickValue > 0) return quickValue

    const text = String(classResetForm.customMinutes || '').trim()
    if (!text) return 0
    if (!/^\d+$/.test(text)) return null
    const value = Number(text)
    if (value < 1 || value > 90) return null
    return value
  }

  const getClassExtendError = () => {
    const text = String(classResetForm.customMinutes || '').trim()
    if (Number(classResetForm.quickMinutes || 0) > 0) return ''
    if (!text) return ''
    if (!/^\d+$/.test(text)) return 'Only whole minutes are allowed.'
    const value = Number(text)
    if (value < 1) return 'Enter at least 1 minute.'
    if (value > 90) return 'Maximum allowed extension is 90 minutes.'
    return ''
  }

  const getClassExtendScopeLabel = () => {
    if (!isSplitHybrid) return 'Full exam'
    return classResumeSplitTarget?.label || 'Active section'
  }

  const getClassResetImpactRows = () => {
    const classExtendMinutes = getClassValidatedExtendMinutes()
    const rows = [
      {
        label: 'Exam access',
        value: classResetForm.resetAccess === 'yes' ? 'Restored for eligible students' : 'No change',
      },
    ]

    if (isProctored) {
      rows.push({
        label: 'Violation lock',
        value: classResetForm.resetAccess === 'yes' ? 'Cleared for locked students' : 'Kept as-is',
      })
    }

    rows.push(
      {
        label: 'Saved answers',
        value: classResetForm.clearAnswers === 'yes' ? 'Cleared' : 'Kept',
      },
      {
        label: 'Exam time',
        value: classResetForm.completeTimeReset === 'yes'
          ? isSplitHybrid
            ? `Reset to MCQ ${formatDuration(mcqDurationMinutes)} and Descriptive ${formatDuration(descriptiveDurationMinutes)}`
            : `Reset to ${formatDuration(baseDurationMinutes)}`
          : 'No change',
      },
      {
        label: 'Extra time',
        value: classExtendMinutes > 0 ? `+${classExtendMinutes} mins to ${getClassExtendScopeLabel()}` : 'No extension',
      },
    )

    return rows
  }

  const hasClassResetAction = () => (
    classResetForm.clearAnswers === 'yes'
    || classResetForm.completeTimeReset === 'yes'
    || classResetForm.resetAccess === 'yes'
    || ((!isSplitHybrid || classResumeSplitTarget?.canExtend) && (
      Number(classResetForm.quickMinutes || 0) > 0
      || Boolean(String(classResetForm.customMinutes || '').trim() && !getClassExtendError())
    ))
  )

  const updateClassResetForm = (key, value) => {
    setClassResetError('')
    setClassResetForm((current) => ({ ...current, [key]: value }))
  }

  const extendClassStudentTime = (student, minutes, section = '') => {
    if (!minutes) return
    const sectionList = section === 'both' ? splitOrder : [section]

    sectionList.forEach((targetSection) => {
      const extensionKey = targetSection === 'mcq'
        ? 'mcqExtensionMinutes'
        : targetSection === 'descriptive'
          ? 'descriptiveExtensionMinutes'
          : 'extensionMinutes'
      const liveUntilKey = targetSection === 'mcq'
        ? 'mcqLiveUntilMs'
        : targetSection === 'descriptive'
          ? 'descriptiveLiveUntilMs'
          : 'liveUntilMs'
      const currentState = controlState[student.id] || {}
      const currentLiveUntilMs = Number(currentState[liveUntilKey] || 0)

      writeStudentTimeExtension({
        assessmentId,
        studentId: student.id,
        minutes,
        section: targetSection === 'full' ? '' : targetSection,
      })

      setControlState((current) => {
        const previous = current[student.id] || {}
        const nextLiveUntilMs = Math.max(Number(previous[liveUntilKey] || 0), currentLiveUntilMs, now.getTime()) + (minutes * 60 * 1000)
        const nextState = {
          ...current,
          [student.id]: {
            ...previous,
            [extensionKey]: Number(previous[extensionKey] || 0) + minutes,
            [liveUntilKey]: nextLiveUntilMs,
            extensionUpdatedAt: new Date().toISOString(),
            ...getAccessRestoredState(),
          },
        }
        writeControlState(assessmentId, nextState)
        return nextState
      })
    })
  }

  const confirmClassReset = () => {
    if (!classResetModal || !classResumeTargets.length) return
    if (!hasClassResetAction()) return
    const shouldClearAnswers = classResetForm.clearAnswers === 'yes'
    const shouldResetTime = classResetForm.completeTimeReset === 'yes'
    const shouldResetAccess = classResetForm.resetAccess === 'yes'
    const classExtendMinutes = getClassValidatedExtendMinutes()
    if (classExtendMinutes === null) {
      setClassResetError(getClassExtendError())
      return
    }
    const shouldExtendTime = classExtendMinutes > 0
    if (shouldExtendTime && isSplitHybrid && !classResumeSplitTarget?.canExtend) {
      setClassResetError(classResumeSplitTarget?.message || 'No active split section is available for extension.')
      return
    }
    const classExtendTargets = isSplitHybrid
      ? (classResumeSplitTarget?.targets || [])
      : classResumeTargets
    const classResetMessage = [
      'Class reset completed.',
      shouldResetAccess ? 'Exam access restored.' : '',
      shouldClearAnswers ? 'Saved answers cleared.' : 'Saved answers retained.',
      shouldResetTime ? 'Exam time reset.' : '',
      shouldExtendTime ? `${getClassExtendScopeLabel()} extended by ${classExtendMinutes} minutes.` : '',
    ].filter(Boolean).join(' ')
    classResumeTargets.forEach((student) => {
      writeStudentExamReset({ assessmentId, studentId: student.id, mode: shouldClearAnswers ? 'clear' : 'keep' })
      if (shouldClearAnswers) {
        removeStudentStorageRecord(STUDENT_EXAM_SUBMISSION_STATUS_KEY, assessmentId, student.id)
        removeStudentStorageRecord(STUDENT_EXAM_SESSION_KEY, assessmentId, student.id)
      }
      if (shouldResetTime) {
        removeStudentStorageRecord(STUDENT_EXAM_TIME_EXTENSIONS_KEY, assessmentId, student.id)
      }
      addStudentLog(
        student.id,
        'Reset assessment',
        classResetMessage,
      )
    })

    window.dispatchEvent(new CustomEvent(STUDENT_EXAM_SUBMISSION_STATUS_EVENT, {
      detail: { assessmentId },
    }))
    if (shouldClearAnswers) {
      window.dispatchEvent(new CustomEvent(STUDENT_EXAM_SESSION_EVENT, {
        detail: { assessmentId },
      }))
    }
    if (shouldResetTime) {
      window.dispatchEvent(new CustomEvent(STUDENT_EXAM_TIME_EXTENSION_EVENT, {
        detail: { assessmentId },
      }))
    }

    setControlState((current) => {
      const next = { ...current }
      classResumeTargets.forEach((student) => {
        const previous = next[student.id] || {}
        next[student.id] = {
          ...previous,
          resetMode: shouldClearAnswers ? 'clear' : 'keep',
          resetCount: Number(previous.resetCount || 0) + 1,
          ...(shouldResetTime ? {
            extensionMinutes: 0,
            mcqExtensionMinutes: 0,
            descriptiveExtensionMinutes: 0,
            liveUntilMs: 0,
            mcqLiveUntilMs: 0,
            descriptiveLiveUntilMs: 0,
            extensionUpdatedAt: '',
          } : {}),
          ...(shouldResetAccess ? {
            ...getAccessRestoredState(),
          } : {}),
          overallStatus: shouldResetAccess ? 'In progress' : 'Waiting',
        }
      })
      writeControlState(assessmentId, next)
      return next
    })

    if (shouldExtendTime) {
      classExtendTargets.forEach((student) => {
        extendClassStudentTime(student, classExtendMinutes, isSplitHybrid ? classResumeSplitTarget.section : classResetForm.extendSection)
      })
      setStudentTimeExtensions(readStudentTimeExtensions())
    }

    clearAssessmentCompletedStatus(assessment)
    setSubmissionStatuses(readStudentSubmissionStatuses())
    setStudentSessions(readStudentExamSessions())
    setExtendSuccessModal({
      title: 'Overall Resume & Extend',
      message: shouldExtendTime
        ? `${classExtendTargets.length} student(s) updated. ${getClassExtendScopeLabel()} extended by ${classExtendMinutes} minutes.`
        : `${classResumeTargets.length} student(s) updated successfully.`,
    })
    setClassResetModal(false)
  }

  const canUseResumeExtend = (student, section = '') => {
    if (schedule.status !== 'live') return false
    if (!isProctored) return false
    if (student.attendance !== 'P') return false
    if (!isStudentViolationActive(student)) return false
    if (section && isSplitHybrid) {
      const activeSplitSection = getStudentActiveSplitSection(student)
      if (activeSplitSection && section !== activeSplitSection) return false
      const sectionIndex = splitOrder.indexOf(section)
      const sectionParts = sectionIndex >= 0 ? getSplitSectionLiveDurationParts(student, sectionIndex) : null
      if (!sectionParts || ['waiting', 'done', 'done-with-extension', 'empty'].includes(sectionParts.mode)) return false
      const sectionStatus = getSplitSectionStatus(student, sectionIndex)
      if (sectionStatus.className !== 'in-progress' && sectionStatus.className !== 'violation') return false
    }

    return true
}

const renderResumeExtendButton = (student, section = '') => {
  const isAllowed = canUseResumeExtend(student, section)
  const resumeDisabledReason = isAllowed
    ? ''
    : student.attendance !== 'P'
      ? 'Absent students cannot be resumed or extended.'
      : !isProctored
        ? 'Resume & Extend is only for proctored violation recovery.'
        : schedule.status !== 'live'
          ? 'Exam is not live.'
          : !isStudentViolationActive(student)
            ? 'Available only when the student status is Violation.'
            : 'Action unavailable for this row.'

  return (
    <button
      type="button"
      className="exam-controls-extend-btn"
      disabled={!isAllowed}
      onClick={() => openResumeExtendModal(student, section)}
      title={resumeDisabledReason || undefined}
    >
      Resume & Extend
    </button>
  )
}

  const getLiveDurationParts = ({
    startAt,
    durationMinutes,
    extensionMinutes = 0,
    liveUntilMs = 0,
    completed = false,
  }) => {
    if (!startAt || !durationMinutes) {
      return { base: '-', extension: '', mode: 'empty', title: 'Timer unavailable' }
    }

    const baseEndAt = startAt + (durationMinutes * 60 * 1000)
    const extensionMs = Math.max(0, Number(extensionMinutes || 0)) * 60 * 1000
    const extensionEndAt = Math.max(Number(liveUntilMs || 0), baseEndAt + extensionMs)
    const nowMs = now.getTime()
    const hasExtension = extensionMs > 0

    if (completed && !Number(liveUntilMs || 0)) {
      return { base: '00:00', extension: '', mode: 'done', title: 'Exam timer completed' }
    }

    if (nowMs < baseEndAt) {
      return {
        base: formatCountdown(baseEndAt - nowMs),
        extension: hasExtension ? formatCountdown(extensionMs) : '',
        mode: hasExtension ? 'base-plus-extension' : 'base',
        title: hasExtension
          ? 'Base time remaining + extension time available'
          : 'Base time remaining',
      }
    }

    if (hasExtension && extensionEndAt > nowMs) {
      return {
        base: '00:00',
        extension: formatCountdown(extensionEndAt - nowMs),
        mode: 'extension',
        title: 'Extension time remaining',
      }
    }

    return { base: '00:00', extension: '', mode: 'done', title: 'Exam timer completed' }
  }

  const getStudentLiveDurationParts = (student) => {
    if (student.attendance !== 'P') return { base: '-', extension: '', mode: 'empty', title: 'Student absent' }
    if (!student.startTime) return { base: '-', extension: '', mode: 'empty', title: 'Student has not logged in' }
    if (student.hasSubmissionAfterExtension) return { base: '00:00', extension: '', mode: 'done', title: 'Exam submitted' }

    return getLiveDurationParts({
      startAt: student.startTime.getTime(),
      durationMinutes: baseDurationMinutes,
      extensionMinutes: student.extensionMinutes,
      liveUntilMs: student.liveUntilMs,
      completed: String(student.overallStatus || '').toLowerCase() === 'completed',
    })
  }

  const renderLiveDuration = (parts) => (
    <span
      className={`exam-controls-live-duration is-${parts.mode}`.trim()}
      title={parts.title}
    >
      <span className="exam-controls-live-duration-base">{parts.base}</span>
      {parts.extension ? (
        <span className="exam-controls-live-duration-extension">
          <span aria-hidden="true">+</span>
          <span>Ext: {parts.extension}</span>
        </span>
      ) : null}
    </span>
  )

  const renderExtensionOnlyDuration = (parts) => (
    <span
      className={`exam-controls-live-duration is-${parts.mode}`.trim()}
      title={parts.title}
    >
      <span className="exam-controls-live-duration-base">
        {parts.extension ? `Ext: ${parts.extension}` : parts.base}
      </span>
    </span>
  )
  const renderStudentLiveDuration = (student) => {
    const parts = getStudentLiveDurationParts(student)
    return parts.mode === 'extension' ? renderExtensionOnlyDuration(parts) : renderLiveDuration(parts)
  }

  const getOverallStatusLabel = (student) => {
    const statusText = String(student.overallStatus || '').toLowerCase()
    if (student.attendance !== 'P' || statusText.includes('absent')) return 'Absent'
    if (statusText.includes('locked') || statusText.includes('violation') || statusText.includes('fullscreen violation')) {
      return 'Violation'
    }
    if (statusText.includes('completed')) return 'Completed'
    if (statusText.includes('waiting')) return 'Waiting'
    return 'In Progress'
  }

  const getOverallStatusClassName = (student) => {
    const statusText = String(student.overallStatus || '').toLowerCase()
    if (student.attendance !== 'P' || statusText.includes('absent')) return 'absent'
    if (statusText === 'completed due to fullscreen violation limit') return 'violation'
    if (statusText.includes('locked') || statusText.includes('fullscreen violation') || statusText.includes('violation')) return 'violation'
    if (statusText.includes('completed')) return 'completed'
    if (statusText.includes('waiting')) return 'waiting'
    return 'in-progress'
  }

  const getSplitSectionMinutes = (student, section) => {
    const isMcq = section === 'mcq'
    const duration = isMcq ? mcqDurationMinutes : descriptiveDurationMinutes
    const extension = isMcq ? student.mcqExtensionMinutes : student.descriptiveExtensionMinutes
    return {
      duration,
      extension,
      total: duration + extension,
    }
  }

  const getSplitSectionWindow = (student, sectionIndex) => {
    if (student.attendance !== 'P' || !student.startTime) return null

    const toMs = (minutes) => Math.max(0, Number(minutes || 0)) * 60 * 1000
    const getSectionConfig = (section) => {
      const isMcq = section === 'mcq'
      return {
        duration: isMcq ? mcqDurationMinutes : descriptiveDurationMinutes,
        extensionMinutes: isMcq ? Number(student.mcqExtensionMinutes || 0) : Number(student.descriptiveExtensionMinutes || 0),
        liveUntilMs: Number((isMcq ? student.mcqLiveUntilMs : student.descriptiveLiveUntilMs) || 0),
      }
    }

    let sectionStartAt = student.startTime.getTime()
    for (let index = 0; index < sectionIndex; index += 1) {
      const prevSection = splitOrder[index]
      const previous = getSectionConfig(prevSection)
      const previousBaseEndAt = sectionStartAt + toMs(previous.duration)
      const previousExtensionEndAt = Math.max(
        previousBaseEndAt + toMs(previous.extensionMinutes),
        previous.liveUntilMs,
      )
      sectionStartAt = previousExtensionEndAt
    }

    const section = splitOrder[sectionIndex]
    const sectionConfig = getSectionConfig(section)
    const sectionBaseEndAt = sectionStartAt + toMs(sectionConfig.duration)
    const sectionExtensionEndAt = Math.max(
      sectionBaseEndAt + toMs(sectionConfig.extensionMinutes),
      sectionConfig.liveUntilMs,
    )

    return {
      section,
      sectionIndex,
      duration: sectionConfig.duration,
      extensionMinutes: sectionConfig.extensionMinutes,
      sectionStartAt,
      sectionBaseEndAt,
      sectionExtensionEndAt,
      sectionLiveUntilMs: sectionConfig.liveUntilMs,
    }
  }

  const getSplitSectionLiveDurationParts = (student, sectionIndex) => {
    if (student.attendance !== 'P') return { base: '-', extension: '', mode: 'empty', title: 'Student absent' }
    if (!student.startTime) return { base: '-', extension: '', mode: 'empty', title: 'Student has not logged in' }
    if (student.hasSubmissionAfterExtension) return { base: '00:00', extension: '', mode: 'done', title: 'Exam submitted' }

    const sectionWindow = getSplitSectionWindow(student, sectionIndex)
    if (!sectionWindow) return { base: '-', extension: '', mode: 'empty', title: 'Timer unavailable' }

    const section = splitOrder[sectionIndex]
    const { duration, extension } = getSplitSectionMinutes(student, section)
    if (!duration) return { base: '-', extension: '', mode: 'empty', title: 'Timer unavailable' }

    const {
      sectionStartAt,
      sectionLiveUntilMs,
      sectionExtensionEndAt,
    } = sectionWindow
    const nowMs = now.getTime()
    if (String(student.overallStatus || '').toLowerCase() === 'completed' && !sectionLiveUntilMs) {
      return { base: '00:00', extension: '', mode: 'done', title: 'Exam timer completed' }
    }

    if (nowMs < sectionStartAt) {
      return {
        base: 'Waiting',
        extension: extension > 0 ? formatCountdown(extension * 60 * 1000) : '',
        mode: 'waiting',
        title: extension > 0
          ? 'Section is waiting. Extension duration is already added.'
          : 'Section starts after the previous configured duration ends',
      }
    }

    if (nowMs >= sectionExtensionEndAt) {
      return { base: 'Completed', extension: '', mode: 'done', title: 'Section duration and extension completed' }
    }

    return getLiveDurationParts({
      startAt: sectionStartAt,
      durationMinutes: duration,
      extensionMinutes: extension,
      liveUntilMs: sectionLiveUntilMs,
      completed: false,
    })
  }

  const renderSplitSectionLiveDuration = (student, sectionIndex) => {
    const parts = getSplitSectionLiveDurationParts(student, sectionIndex)
    return parts.mode === 'extension' ? renderExtensionOnlyDuration(parts) : renderLiveDuration(parts)
  }

  const getSplitSectionStatus = (student, sectionIndex) => {
    const statusText = String(student.overallStatus || '').toLowerCase()
    if (student.attendance !== 'P' || statusText.includes('absent')) return { label: 'Absent', className: 'absent' }

    const parts = getSplitSectionLiveDurationParts(student, sectionIndex)
    if (parts.mode === 'waiting') return { label: 'Waiting', className: 'waiting' }
    if (parts.mode === 'done') return { label: 'Completed', className: 'completed' }
    if (parts.mode === 'empty') return { label: 'Waiting', className: 'waiting' }

    const section = splitOrder[sectionIndex]
    const activeSplitSection = getStudentActiveSplitSection(student)
    const isActiveViolationSection = isStudentViolationActive(student)
      && (!activeSplitSection || section === activeSplitSection)

    if (isActiveViolationSection || statusText.includes('locked') || statusText.includes('fullscreen violation')) {
      return { label: 'Violation', className: 'violation' }
    }
    return { label: 'In Progress', className: 'in-progress' }
  }

  const getStudentActiveSplitSection = (student) => {
    if (!isSplitHybrid || student.attendance !== 'P') return ''
    const activeIndex = splitOrder.findIndex((section, sectionIndex) => {
      const parts = getSplitSectionLiveDurationParts(student, sectionIndex)
      return ['base', 'base-plus-extension', 'extension'].includes(parts.mode)
    })
    return activeIndex >= 0 ? splitOrder[activeIndex] : ''
  }

  const getSplitSectionDisplayLabel = (section) => {
    const sectionIndex = splitOrder.indexOf(section)
    const name = section === 'mcq' ? 'MCQ' : 'Descriptive'
    return sectionIndex >= 0 ? `${name} (Sequence ${sectionIndex + 1})` : name
  }

  const classResumeSplitTarget = (() => {
    if (!isSplitHybrid) {
      return {
        canExtend: true,
        section: classResetForm.extendSection,
        label: 'Full exam',
        message: '',
        targets: classResumeTargets,
      }
    }

    const activeEntries = classResumeTargets
      .map((student) => ({ student, section: getStudentActiveSplitSection(student) }))
      .filter((item) => Boolean(item.section))
    const activeSections = Array.from(new Set(activeEntries.map((item) => item.section)))

    if (!activeEntries.length) {
      return {
        canExtend: false,
        section: '',
        label: 'No active section',
        message: 'No live split section is available for the selected status.',
        targets: [],
      }
    }

    if (activeSections.length > 1) {
      return {
        canExtend: false,
        section: '',
        label: 'Mixed active sections',
        message: 'Selected students are in different active sections. Choose a specific status or student to extend.',
        targets: [],
      }
    }

    const [section] = activeSections
    return {
      canExtend: true,
      section,
      label: getSplitSectionDisplayLabel(section),
      message: '',
      targets: activeEntries.map((item) => item.student),
    }
  })()

  const renderSimpleTable = () => (
    <div className="exam-controls-student-grid-wrap">
      <div className="exam-controls-student-grid" role="table" aria-label="Live exam tracking">
        <div className="exam-controls-student-grid-head" role="row">
          <span role="columnheader">Student ID</span>
          <span role="columnheader">Attendance</span>
          <span role="columnheader">Student Name</span>
          <span role="columnheader">Login Time</span>
          <span role="columnheader">Status Log</span>
          <span role="columnheader">Resume &amp; Extend</span>
          <span role="columnheader">{isPractice ? 'Exam Duration' : 'Live Duration'}</span>
          <span role="columnheader">Overall Status</span>
        </div>
        <div className="exam-controls-student-grid-body">
          {visibleStudents.map((student) => {
            const rowStatus = getOverallStatusClassName(student)
            const rowClassName = `exam-controls-student-grid-row ${rowStatus === 'violation' ? 'is-violation-row' : ''} ${rowStatus === 'violation' && student.accessRequest?.active ? 'has-access-request' : ''}`.trim()
            return (
            <div className={rowClassName} role="row" key={student.id}>
              <span className="exam-controls-student-cell is-student-id" role="cell"><strong>{student.id}</strong></span>
              <span className="exam-controls-student-cell is-attendance" role="cell">
                <span className={`exam-controls-attendance is-${student.attendance.toLowerCase()}`}>{student.attendance}</span>
              </span>
              <span className="exam-controls-student-cell is-student-name" role="cell">{student.name}</span>
              <span className="exam-controls-student-cell is-login" role="cell">{formatDisplayTime(student.startTime)}</span>
              <span className="exam-controls-student-cell is-status-log" role="cell">
                <button type="button" className="exam-controls-log-btn" onClick={() => setLogModal(student)}>
                  View Log
                </button>
              </span>
              <span className="exam-controls-student-cell is-resume" role="cell">{renderResumeExtendButton(student)}</span>
              <span className="exam-controls-student-cell is-live-duration" role="cell">{renderStudentLiveDuration(student)}</span>
              <span className="exam-controls-student-cell is-overall" role="cell">
                <span className={`exam-controls-overall is-${rowStatus}`}>{getOverallStatusLabel(student)}</span>
              </span>
            </div>
          )})}
        </div>
      </div>
    </div>
  )

  const renderSplitTable = () => (
    <div className="exam-controls-split-grid-wrap">
      <div className="exam-controls-split-grid" role="table" aria-label="Live exam tracking split duration">
        <div className="exam-controls-split-grid-head" role="row">
          <span role="columnheader">Student ID</span>
          <span role="columnheader">Attendance</span>
          <span role="columnheader">Student Name</span>
          <span role="columnheader">Login Time</span>
          <span role="columnheader">Status Log</span>
          <span role="columnheader">Duration Split</span>
          <span role="columnheader">Duration</span>
          <span role="columnheader">Resume &amp; Extend</span>
          <span role="columnheader">Live Duration</span>
          <span role="columnheader">Overall Status</span>
        </div>
        <div className="exam-controls-split-grid-body">
          {visibleStudents.map((student) => {
            const rowStatus = getOverallStatusClassName(student)
            const rowClassName = `exam-controls-split-grid-group ${rowStatus === 'violation' ? 'is-violation-row' : ''} ${rowStatus === 'violation' && student.accessRequest?.active ? 'has-access-request' : ''}`.trim()
            return (
            <div className={rowClassName} role="rowgroup" key={student.id}>
              <span className="exam-controls-split-cell is-student-id" role="cell"><strong>{student.id}</strong></span>
              <span className="exam-controls-split-cell is-attendance" role="cell">
                <span className={`exam-controls-attendance is-${student.attendance.toLowerCase()}`}>{student.attendance}</span>
              </span>
              <span className="exam-controls-split-cell is-student-name" role="cell">{student.name}</span>
              <span className="exam-controls-split-cell is-login" role="cell">{formatDisplayTime(student.startTime)}</span>
              <span className="exam-controls-split-cell is-status-log" role="cell">
                <button type="button" className="exam-controls-log-btn" onClick={() => setLogModal(student)}>
                  View Log
                </button>
              </span>
              {splitOrder.map((section, sectionIndex) => {
            const isMcq = section === 'mcq'
            const sectionTiming = getSplitSectionMinutes(student, section)
            const sectionStatus = getSplitSectionStatus(student, sectionIndex)
            return (
                  <Fragment
                key={`${student.id}-${section}`}
              >
                    <span className={`exam-controls-split-cell is-duration-split is-section-${sectionIndex + 1}`} role="cell">
                  <span className="exam-controls-sequence-pill">
                    {isMcq ? 'MCQ' : 'Descriptive'} (Sequence {sectionIndex + 1})
                  </span>
                    </span>
                    <span className={`exam-controls-split-cell is-duration is-section-${sectionIndex + 1}`} role="cell">
                      <strong>{formatDuration(sectionTiming.duration)}</strong>
                    </span>
                    <span className={`exam-controls-split-cell is-resume is-section-${sectionIndex + 1}`} role="cell">
                      {renderResumeExtendButton(student, section)}
                    </span>
                    <span className={`exam-controls-split-cell is-live-duration is-section-${sectionIndex + 1}`} role="cell">
                      {renderSplitSectionLiveDuration(student, sectionIndex)}
                    </span>
                    <span className={`exam-controls-split-cell is-overall is-section-${sectionIndex + 1}`} role="cell">
                      <span className={`exam-controls-overall is-${sectionStatus.className}`}>{sectionStatus.label}</span>
                    </span>
                  </Fragment>
            )
              })}
            </div>
          )})}
        </div>
      </div>
    </div>
  )

  const renderModalPortal = (content) => (
    typeof document === 'undefined' ? content : createPortal(content, document.body)
  )

  if (!assessment) {
    return (
      <section className="vx-content exam-controls-page">
        <div className="exam-controls-shell">
          <PageNavigationHeader
            items={['My Pages', 'Assessment', 'Exam Controls']}
            onBack={goBackToPublishedTab}
          />
          <section className="exam-controls-empty">
            <strong>No assessment selected</strong>
            <p>Open Exam Controls from a live or completed published assessment card.</p>
            <button type="button" onClick={() => onNavigate?.(APP_PAGES.ASSESSMENT_CREATE)}>
              <ArrowLeft size={16} strokeWidth={2.3} />
              Back to Published Assessments
            </button>
          </section>
        </div>
      </section>
    )
  }

  return (
    <section className="vx-content exam-controls-page">
      <div className="exam-controls-shell">
        <PageNavigationHeader
          items={['My Pages', 'Assessment', 'Exam Controls']}
          onBack={goBackToPublishedTab}
        />

        <section className={`exam-controls-header-panel is-${schedule.status}`} aria-label="Assessment control summary">
          <div className="exam-controls-header-main">
            <div>
              <h1>{assessment.assessmentName || 'Untitled Assessment'}</h1>
              <p>{assessment.examCategory || '-'} / {assessment.assignTo || '-'}</p>
            </div>
            <span className={`exam-controls-header-status is-${schedule.status}`}>{schedule.label}</span>
          </div>

          <div className="exam-controls-command-strip">
            <span className={`exam-controls-command-timer ${isFinalFiveMinutes ? 'is-critical' : ''}`.trim()}>
              <Clock3 size={20} strokeWidth={2.3} />
              <span>
                <strong>{schedule.status === 'live' ? formatCountdown(schedule.remainingMs) : assessment.totalDuration || '-'}</strong>
                <em>{schedule.status === 'live' ? 'Remaining Time' : 'Total Duration'}</em>
              </span>
            </span>

            <div className="exam-controls-command-meta">
              {[
                { label: 'Mode', value: assessment.examMode || '-', icon: Monitor },
                { label: 'Supervision', value: assessment.supervisionType || '-', icon: ShieldCheck },
                { label: 'Type', value: assessment.examType || '-', icon: FileText },
                { label: 'Start', value: `${formatDisplayDate(assessment.startDate)} / ${assessment.startTime || '-'}`, icon: CalendarDays },
                { label: 'Marks', value: assessment.totalMarks ?? '-', icon: Activity },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <span key={item.label}>
                    <Icon size={14} strokeWidth={2.25} />
                    <em>{item.label}</em>
                    <strong>{item.value}</strong>
                  </span>
                )
              })}
            </div>
          </div>

          {isFinalFiveMinutes ? (
            <div className="exam-controls-final-warning">
              Final 5 minutes warning: please review student states carefully.
            </div>
          ) : null}
        </section>

        <section className="exam-controls-tracking-card">
          <div className="exam-controls-tracking-head">
            <div>
              <h2>Live Exam Tracking</h2>
            </div>
            <div className="exam-controls-tracking-tools">
              <label className="exam-controls-student-search">
                <Search size={15} strokeWidth={2.3} />
                <input
                  type="search"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Search student..."
                />
              </label>
              <button
                type="button"
                className="exam-controls-class-reset-btn"
                disabled={controlsDisabled || !isProctored || !classResumeTargets.length}
                onClick={openClassReset}
                title={
                  controlsDisabled
                    ? 'Exam is not live'
                    : !isProctored
                      ? 'Available only for proctored violation recovery'
                      : !classResumeTargets.length
                        ? 'No violation students available'
                        : 'Resume and extend violation students'
                }
              >
                Overall Resume &amp; Extend
              </button>
            </div>
          </div>
          {isSplitHybrid ? renderSplitTable() : renderSimpleTable()}
        </section>
      </div>

      {extendModal ? renderModalPortal((
        <div className="exam-controls-modal-backdrop" role="presentation">
          <section className="exam-controls-modal exam-controls-resume-modal" role="dialog" aria-modal="true" aria-labelledby="exam-controls-extend-title">
            <div className="exam-controls-resume-head">
              <span className="exam-controls-modal-icon" aria-hidden="true">
                <Clock3 size={24} strokeWidth={2.3} />
              </span>
              <div className="exam-controls-resume-title">
                <h2 id="exam-controls-extend-title">Resume &amp; Extend</h2>
                <span className="exam-controls-resume-name-row">
                  <strong>{extendModal.student.name}</strong>
                  <em className="is-id">ID: {extendModal.student.id}</em>
                  <em className={isProctored ? 'is-proctored' : 'is-practice'}>
                    {assessment.supervisionType || (isProctored ? 'Proctored' : 'Practice')}
                  </em>
                  {isProctored ? <em className="is-violation has-count">Violation</em> : null}
                </span>
              </div>
            </div>
            <p className="exam-controls-modal-summary">
              Invigilator action required. Apply only after verifying the student.
            </p>

            <div className="exam-controls-resume-card">
              <div className="exam-controls-resume-field">
              <span className="exam-controls-resume-label">
                Clear answer
                <Info
                  size={14}
                  strokeWidth={2.3}
                  aria-hidden="true"
                  title="Yes will remove the student's saved answers before resuming."
                />
              </span>
              {renderResumeSwitch({
                checked: extendForm.clearAnswers === 'yes',
                label: 'Clear answer',
                onChange: (value) => setExtendForm((current) => ({
                  ...current,
                  clearAnswers: value,
                })),
              })}
              </div>

              {extendForm.clearAnswers === 'yes' ? (
                <p className="exam-controls-inline-warning">Student answers will be cleared after submit.</p>
              ) : null}
            </div>

            <div className="exam-controls-resume-card">
              <div className="exam-controls-resume-field">
              <span className="exam-controls-resume-label">
                Complete time reset
                <Info
                  size={14}
                  strokeWidth={2.3}
                  aria-hidden="true"
                  title="Yes will reset the selected exam or section timer to its full configured duration."
                />
              </span>
              {extendForm.completeTimeReset === 'yes' ? (
                <em>Extra time fields are hidden because full time reset is selected.</em>
              ) : null}
              {renderResumeSwitch({
                checked: extendForm.completeTimeReset === 'yes',
                label: 'Complete time reset',
                onChange: (value) => setExtendForm((current) => ({
                  ...current,
                  completeTimeReset: value,
                  quickMinutes: value === 'yes' ? '' : current.quickMinutes,
                  customMinutes: value === 'yes' ? '' : current.customMinutes,
                })),
              })}
              </div>

              {extendForm.completeTimeReset === 'yes' ? (
                <div className="exam-controls-duration-reset-badge">
                  Full time will be reset to: {getCompleteTimeResetBadge(extendModal.section)}
                </div>
              ) : null}
            </div>

            {extendForm.completeTimeReset === 'yes' ? (
              null
            ) : (
              <div className="exam-controls-resume-card">
                <div className="exam-controls-extension-copy">
                  <strong>Add extra time</strong>
                  <span>Choose quick minutes or enter custom minutes.</span>
                </div>
                <div className="exam-controls-extension-options">
                  {[5, 10, 15].map((minutes) => (
                    <button
                      type="button"
                      key={minutes}
                      className={Number(extendForm.quickMinutes) === minutes ? 'is-selected' : ''}
                      onClick={() => {
                      setExtendError('')
                      setExtendForm((current) => ({ ...current, quickMinutes: String(minutes), customMinutes: '' }))
                    }}
                  >
                      +{minutes} min
                    </button>
                  ))}
                </div>
                <label className="exam-controls-minute-input">
                  <span>Extend time</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={extendForm.customMinutes}
                    placeholder="Enter minutes"
                    onChange={(event) => {
                      const nextValue = event.target.value
                      setExtendForm((current) => ({ ...current, customMinutes: nextValue, quickMinutes: '' }))
                      if (!nextValue.trim()) {
                        setExtendError('')
                      } else if (!/^\d+$/.test(nextValue.trim())) {
                        setExtendError('Only whole minutes are allowed.')
                      } else if (Number(nextValue) < 1) {
                        setExtendError('Enter at least 1 minute.')
                      } else if (Number(nextValue) > 90) {
                        setExtendError('Maximum allowed extension is 90 minutes.')
                      } else {
                        setExtendError('')
                      }
                    }}
                  />
                </label>
                <p className={extendError ? 'exam-controls-form-error' : 'exam-controls-form-hint'}>
                  {extendError || 'Maximum allowed extension is 90 minutes.'}
                </p>
              </div>
            )}

            <div className="exam-controls-modal-actions">
              <button type="button" className="is-secondary" onClick={() => setExtendModal(null)}>Cancel</button>
              <button type="button" onClick={submitResumeExtend} disabled={!hasResumeExtendAction()}>Apply Changes</button>
            </div>
          </section>
        </div>
      )) : null}

      {resetModal ? renderModalPortal((
        <div className="exam-controls-modal-backdrop" role="presentation">
          <section className="exam-controls-reset-modal" role="dialog" aria-modal="true" aria-labelledby="exam-controls-reset-title">
            <span className="exam-controls-modal-icon is-reset" aria-hidden="true">
              <TimerReset size={26} strokeWidth={2.3} />
            </span>
            <h2 id="exam-controls-reset-title">
              <span>Reset Student</span>
              {resetModal.student.name}
            </h2>
            <label className={resetMode === 'keep' ? 'is-selected' : ''}>
              <input type="radio" checked={resetMode === 'keep'} onChange={() => setResetMode('keep')} />
              <span>Keep Answers</span>
            </label>
            <label className={resetMode === 'clear' ? 'is-selected' : ''}>
              <input type="radio" checked={resetMode === 'clear'} onChange={() => setResetMode('clear')} />
              <span>Clear Answers</span>
            </label>
            <div className="exam-controls-reset-note">
              <TimerReset size={17} strokeWidth={2.3} />
              <p>This student will be reset. {resetMode === 'keep' ? 'Saved answers are retained.' : 'Saved answers are cleared.'}</p>
            </div>
            <div className="exam-controls-modal-actions">
              <button type="button" className="is-secondary" onClick={() => setResetModal(null)}>Cancel</button>
              <button type="button" onClick={confirmReset}>Reset Student</button>
            </div>
          </section>
        </div>
      )) : null}

      {classResetModal ? renderModalPortal((
        <div className="exam-controls-modal-backdrop" role="presentation">
          <section className="exam-controls-modal exam-controls-resume-modal exam-controls-overall-resume-modal" role="dialog" aria-modal="true" aria-labelledby="exam-controls-class-reset-title">
            <div className="exam-controls-resume-head">
              <span className="exam-controls-modal-icon is-reset" aria-hidden="true">
                <TimerReset size={24} strokeWidth={2.3} />
              </span>
              <div className="exam-controls-resume-title">
                <h2 id="exam-controls-class-reset-title">Overall Resume &amp; Extend</h2>
                <span className="exam-controls-resume-name-row">
                  <strong>{assessment?.assessmentName || 'Assessment'}</strong>
                  <em className="is-id">Selected: {classResumeTargets.length}</em>
                  <em className={isProctored ? 'is-proctored' : 'is-practice'}>
                    {assessment.supervisionType || (isProctored ? 'Proctored' : 'Practice')}
                  </em>
                  <em className="is-section">{assessment.examType || 'Exam'}</em>
                  {isSplitHybrid ? <em className="is-section">Duration split</em> : null}
                </span>
              </div>
            </div>
            <p className="exam-controls-modal-summary">
              Violation recovery only. This applies to present proctored students whose current status is Violation.
            </p>

            <div className="exam-controls-resume-card">
              <div className="exam-controls-resume-field">
                <span className="exam-controls-resume-label">
                  Clear answer
                  <Info
                    size={14}
                    strokeWidth={2.3}
                    aria-hidden="true"
                    title="Yes will remove saved answers for the selected students before resuming."
                  />
                </span>
                {renderResumeSwitch({
                  checked: classResetForm.clearAnswers === 'yes',
                  label: 'Clear class answers',
                  onChange: (value) => updateClassResetForm('clearAnswers', value),
                })}
              </div>

              {classResetForm.clearAnswers === 'yes' ? (
                <p className="exam-controls-inline-warning">Selected student answers will be cleared after submit.</p>
              ) : null}
            </div>

            <div className="exam-controls-resume-card">
              <div className="exam-controls-resume-field">
                <span className="exam-controls-resume-label">
                  Complete time reset
                  <Info
                    size={14}
                    strokeWidth={2.3}
                    aria-hidden="true"
                    title="Yes will reset the selected exam or section timer to its full configured duration."
                  />
                </span>
                {classResetForm.completeTimeReset === 'yes' ? (
                  <em>Extra time fields are hidden because full time reset is selected.</em>
                ) : null}
                {renderResumeSwitch({
                  checked: classResetForm.completeTimeReset === 'yes',
                  label: 'Complete class time reset',
                  onChange: (value) => setClassResetForm((current) => ({
                    ...current,
                    completeTimeReset: value,
                    quickMinutes: value === 'yes' ? '' : current.quickMinutes,
                    customMinutes: value === 'yes' ? '' : current.customMinutes,
                  })),
                })}
              </div>

              {classResetForm.completeTimeReset === 'yes' ? (
                <div className="exam-controls-duration-reset-badge">
                  Full time will be reset to: {isSplitHybrid
                    ? `MCQ ${formatDuration(mcqDurationMinutes)} / Descriptive ${formatDuration(descriptiveDurationMinutes)}`
                    : formatDuration(baseDurationMinutes)}
                </div>
              ) : null}
            </div>

            {classResetForm.completeTimeReset === 'yes' ? (
              null
            ) : (
            <div className="exam-controls-resume-card">
              <div className="exam-controls-extension-copy">
                <strong>
                  <span>Add extra time</span>
                  {isSplitHybrid ? (
                    <em className={`exam-controls-active-section-badge ${classResumeSplitTarget.canExtend ? 'is-ready' : 'is-blocked'}`.trim()}>
                      {classResumeSplitTarget.canExtend
                        ? `Active section: ${classResumeSplitTarget.label}`
                        : 'No active section'}
                    </em>
                  ) : null}
                </strong>
                <span>{isSplitHybrid ? 'Extra time applies only to the currently live section.' : 'Choose quick minutes or enter custom minutes.'}</span>
              </div>
              {isSplitHybrid && !classResumeSplitTarget.canExtend ? (
                <p className="exam-controls-active-section-inline is-blocked">{classResumeSplitTarget.message}</p>
              ) : null}
              <div className="exam-controls-extension-options" role="group" aria-label="Quick class extension minutes">
                {[5, 10, 15].map((minutes) => (
                  <button
                    type="button"
                    key={minutes}
                    className={Number(classResetForm.quickMinutes) === minutes ? 'is-selected' : ''}
                    disabled={isSplitHybrid && !classResumeSplitTarget.canExtend}
                    onClick={() => updateClassResetForm('quickMinutes', Number(classResetForm.quickMinutes) === minutes ? '' : String(minutes))}
                  >
                    +{minutes} min
                  </button>
                ))}
              </div>
              <label className="exam-controls-minute-input">
                <span>Extend time</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={classResetForm.customMinutes}
                  disabled={isSplitHybrid && !classResumeSplitTarget.canExtend}
                  onChange={(event) => updateClassResetForm('customMinutes', event.target.value.replace(/\s+/g, ''))}
                  onFocus={() => updateClassResetForm('quickMinutes', '')}
                  placeholder="Enter minutes"
                  aria-invalid={Boolean(classResetError || getClassExtendError())}
                />
              </label>
              {classResetError || getClassExtendError() ? (
                <p className="exam-controls-form-error">{classResetError || getClassExtendError()}</p>
              ) : isSplitHybrid && !classResumeSplitTarget.canExtend ? (
                <p className="exam-controls-form-error">{classResumeSplitTarget.message}</p>
              ) : (
                <p className="exam-controls-form-hint">Maximum allowed extension is 90 minutes.</p>
              )}
            </div>
            )}

            <div className="exam-controls-modal-actions">
              <button type="button" className="is-secondary" onClick={() => setClassResetModal(false)}>Cancel</button>
              <button type="button" onClick={confirmClassReset} disabled={!hasClassResetAction() || !classResumeTargets.length}>Apply Changes</button>
            </div>
          </section>
        </div>
      )) : null}

      {extendSuccessModal ? renderModalPortal((
        <div className="exam-controls-modal-backdrop" role="presentation">
          <section className="exam-controls-success-modal" role="dialog" aria-modal="true" aria-labelledby="exam-controls-success-title">
            <span className="exam-controls-modal-icon is-success" aria-hidden="true">
              <CheckCircle2 size={28} strokeWidth={2.3} />
            </span>
            <h2 id="exam-controls-success-title">{extendSuccessModal.title || 'Updated'}</h2>
            <p>{extendSuccessModal.message}</p>
          </section>
        </div>
      )) : null}

      {logModal ? renderModalPortal((
        <div className="exam-controls-modal-backdrop" role="presentation">
          <section className="exam-controls-log-modal" role="dialog" aria-modal="true" aria-labelledby="exam-controls-log-title">
            <div className="exam-controls-log-head">
              <div>
                <h2 id="exam-controls-log-title">Live Exam Tracking Log</h2>
                <p>{logModal.id} / {logModal.name}</p>
              </div>
              <button type="button" onClick={() => setLogModal(null)}>Close</button>
            </div>
            <div className="exam-controls-log-table-wrap">
              <table className="exam-controls-log-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Remarks</th>
                    <th>Faculty</th>
                  </tr>
                </thead>
                <tbody>
                  {(students.find((student) => student.id === logModal.id)?.logs || []).map((log) => (
                    <tr key={log.id}>
                      <td>{log.time}</td>
                      <td>{log.action}</td>
                      <td>{log.remarks}</td>
                      <td>{log.faculty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )) : null}
    </section>
  )
}

export default ExamControlsPage
