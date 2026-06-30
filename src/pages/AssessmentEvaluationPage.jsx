import { AlertCircle, ArrowLeft, Award, Check, ClipboardList, Clock3, FileText, Image as ImageIcon, LogOut, Moon, Pencil, Percent, RotateCcw, Sun, UserX, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { APP_PAGES } from '../config/appPages'
import '../styles/assessment-pages.css'

const ASSESSMENT_EVALUATION_SELECTED_KEY = 'vx-assessment-evaluation-selected'
const ASSESSMENT_EVALUATION_STUDENT_KEY = 'vx-assessment-evaluation-student'
const CREATE_ASSESSMENT_QUESTIONS_KEY = 'vx-create-assessment-questions'
const ASSESSMENT_CREATE_INITIAL_TAB_KEY = 'vx-assessment-create-initial-tab'
const STUDENT_EXAM_SESSION_KEY = 'vx-student-exam-session'
const STUDENT_EXAM_SESSION_EVENT = 'vx-student-exam-session-changed'
const STUDENT_EXAM_SUBMISSION_STATUS_KEY = 'vx-student-exam-submission-status'
const STUDENT_EXAM_SUBMISSION_STATUS_EVENT = 'vx-student-exam-submission-status-changed'
const ASSESSMENT_EVALUATION_ATTENDANCE_KEY = 'vx-assessment-evaluation-attendance'
const ASSESSMENT_STUDENT_QUESTION_EVALUATION_KEY = 'vx-assessment-student-question-evaluation'
const DEFAULT_EVALUATION_STUDENTS = [
  { id: 'MV1253', name: 'Student 1', attendance: 'P' },
  { id: 'MV1254', name: 'Student 2', attendance: 'P' },
  { id: 'MV1255', name: 'Student 3', attendance: 'P' },
  { id: 'MC2568', name: 'Karthik Subramanian', attendance: 'P' },
]

const readSelectedAssessment = () => {
  try {
    const storedAssessment = window.sessionStorage.getItem(ASSESSMENT_EVALUATION_SELECTED_KEY)
    return storedAssessment ? JSON.parse(storedAssessment) : null
  } catch {
    return null
  }
}

const readSelectedStudent = () => {
  try {
    const storedStudent = window.sessionStorage.getItem(ASSESSMENT_EVALUATION_STUDENT_KEY)
    return storedStudent ? JSON.parse(storedStudent) : null
  } catch {
    return null
  }
}

const readStorageObject = (key) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeStorageObject = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

const getAssessmentYear = (assessment) => assessment?.academicYear
  || assessment?.setup?.academicYear
  || '2025 - 2026'

const getAssessmentValue = (assessment, key, fallback = '-') => assessment?.[key]
  || assessment?.setup?.[key]
  || fallback

const getAssessmentLogo = (assessment) => assessment?.logoPreview
  || assessment?.setup?.logoPreview
  || ''

const getAssessmentControlId = (assessment) => (
  assessment?.id || assessment?.assessmentId || assessment?.setup?.assessmentId || 'selected-assessment'
)

const getManualAttendanceStorageKey = (assessment) => (
  `${ASSESSMENT_EVALUATION_ATTENDANCE_KEY}:${getAssessmentControlId(assessment)}`
)

const getStudentQuestionEvaluationStorageKey = (assessment, student) => (
  `${ASSESSMENT_STUDENT_QUESTION_EVALUATION_KEY}:${getAssessmentControlId(assessment)}:${student?.id || 'student'}`
)

const isOfflineAssessment = (assessment) => String(
  assessment?.examMode
  || assessment?.mode
  || assessment?.setup?.examMode
  || assessment?.setup?.mode
  || '',
).toLowerCase().includes('offline')

const stripHtml = (value) => String(value ?? '')
  .replace(/<\/?[A-Za-z][^>]*>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .trim()

const parseMarksValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const isDescriptiveQuestionType = (type) => (
  type === 'Descriptive Question'
  || String(type ?? '').toLowerCase().includes('descriptive')
  || String(type ?? '').includes('SAQs')
  || String(type ?? '').includes('MEQs')
  || String(type ?? '').includes('LAQs')
)

const getQuestionMarksTotal = (item) => {
  if (isDescriptiveQuestionType(item?.type)) {
    const sections = Array.isArray(item?.descriptiveSections) ? item.descriptiveSections : []
    const sectionMarks = sections.reduce((total, section) => {
      const children = Array.isArray(section.children) ? section.children : []
      const childMarks = children.reduce((sum, child) => sum + parseMarksValue(child.marks), 0)
      const ownMarks = children.length ? 0 : parseMarksValue(section.marks)
      return total + ownMarks + childMarks
    }, 0)
    const totalMarks = (sections.length ? 0 : parseMarksValue(item?.marks)) + sectionMarks
    return totalMarks || (stripHtml(item?.questionText) ? 2 : 0)
  }

  if (item?.type === 'MCQ' && !parseMarksValue(item?.marks)) return 1
  return parseMarksValue(item?.marks)
}

const getDescriptiveSectionMarks = (section) => {
  const children = Array.isArray(section?.children) ? section.children : []
  if (children.length) {
    return children.reduce((total, child) => total + (getQuestionMarksTotal(child) || parseMarksValue(child?.marks)), 0)
  }
  return getQuestionMarksTotal(section) || parseMarksValue(section?.marks)
}

const getDescriptiveScoringItems = (question, index) => {
  const baseKey = getQuestionKey(question, `descriptive-${index + 1}`)
  const sections = Array.isArray(question?.descriptiveSections) ? question.descriptiveSections : []

  if (!sections.length) {
    return [{ key: baseKey, maxMarks: getQuestionMarksTotal(question) }]
  }

  return sections.flatMap((section, sectionIndex) => {
    const sectionKey = getQuestionKey(section, `${baseKey}-section-${sectionIndex + 1}`)
    const children = Array.isArray(section.children) ? section.children : []

    if (!children.length) {
      return [{ key: sectionKey, maxMarks: getDescriptiveSectionMarks(section) }]
    }

    return children.map((child, childIndex) => ({
      key: getQuestionKey(child, `${sectionKey}-child-${childIndex + 1}`),
      maxMarks: getQuestionMarksTotal(child) || parseMarksValue(child?.marks),
    }))
  })
}

const getQuestionText = (item, fallback = 'Question not available') => (
  stripHtml(item?.questionText ?? item?.prompt ?? item?.text ?? item?.title ?? item?.question ?? fallback)
)

const getQuestionKey = (item, fallback) => String(
  item?.id
  || item?.questionId
  || item?._id
  || fallback
)

const getQuestionImages = (item) => {
  const candidates = [
    item?.images,
    item?.questionImages,
    item?.attachments,
    item?.media,
    item?.imagePreview,
    item?.questionImagePreview,
    item?.imageUrl,
    item?.questionImageUrl,
    item?.image,
    item?.questionImage,
  ].filter(Boolean)

  return candidates.flatMap((candidate) => {
    const values = Array.isArray(candidate) ? candidate : [candidate]
    return values.map((image, index) => {
      if (typeof image === 'string') return { id: `${image}-${index}`, url: image, name: `Question image ${index + 1}` }
      const url = image?.url || image?.src || image?.preview || image?.dataUrl || image?.base64 || image?.path
      return url ? { id: image?.id || `${url}-${index}`, url, name: image?.name || image?.fileName || `Question image ${index + 1}` } : null
    }).filter(Boolean)
  })
}

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

const getAssessmentQuestionsStorageKey = (setup = {}) => (
  `${CREATE_ASSESSMENT_QUESTIONS_KEY}:${getAssessmentStorageSuffix(setup)}`
)

const readAssessmentQuestions = (assessment) => {
  const attachedQuestions = [
    assessment?.questions,
    assessment?.selectedQuestions,
    assessment?.setup?.questions,
    assessment?.setup?.selectedQuestions,
  ].find((items) => Array.isArray(items))

  if (attachedQuestions) return attachedQuestions

  try {
    const parsed = JSON.parse(window.localStorage.getItem(getAssessmentQuestionsStorageKey(assessment?.setup ?? assessment)) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const formatTwoDigit = (value) => String(Number(value) || 0).padStart(2, '0')

const getQuestionSummary = (assessment) => {
  const questions = readAssessmentQuestions(assessment)
  const mcqQuestions = questions.filter((item) => !isDescriptiveQuestionType(item?.type))
  const descriptiveQuestions = questions.filter((item) => isDescriptiveQuestionType(item?.type))
  const mcqMarks = mcqQuestions.reduce((total, item) => total + getQuestionMarksTotal(item), 0)
  const descriptiveMarks = descriptiveQuestions.reduce((total, item) => total + getQuestionMarksTotal(item), 0)

  return {
    mcqCount: mcqQuestions.length,
    descriptiveCount: descriptiveQuestions.length,
    totalCount: questions.length,
    mcqMarks,
    descriptiveMarks,
    totalMarks: mcqMarks + descriptiveMarks,
  }
}

const hasValidDateValue = (value) => {
  if (!value) return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime())
}

const readEvaluationStudents = (assessment, studentSessions = {}, submissionStatuses = {}, manualAttendance = {}) => {
  const attachedStudents = [
    assessment?.students,
    assessment?.assignedStudents,
    assessment?.studentRows,
    assessment?.setup?.students,
    assessment?.setup?.assignedStudents,
  ].find((items) => Array.isArray(items) && items.length)

  const assessmentId = getAssessmentControlId(assessment)
  const baseStudents = attachedStudents || DEFAULT_EVALUATION_STUDENTS
  const hasAttachedStudents = Boolean(attachedStudents)
  const isOffline = isOfflineAssessment(assessment)

  return baseStudents.map((student, index) => {
    const id = student.id || student.studentId || student.registerId || `ST${String(index + 1).padStart(4, '0')}`
    const session = studentSessions?.[assessmentId]?.[id] || null
    const submission = submissionStatuses?.[assessmentId]?.[id] || null
    const isPresent = hasValidDateValue(session?.loginTime) || Boolean(submission?.status)
    const savedAttendance = manualAttendance[id]

    return {
      id,
      name: student.name || student.studentName || `Student ${index + 1}`,
      attendance: isOffline ? (savedAttendance || (hasAttachedStudents ? (student.attendance || student.attendanceStatus) : '') || 'P') : (isPresent ? 'P' : 'A'),
    }
  })
}

export default function AssessmentEvaluationPage({ onNavigate, onAlert, theme = 'light', onToggleTheme }) {
  const [assessment] = useState(() => readSelectedAssessment())
  const [selectedStudent, setSelectedStudent] = useState(() => readSelectedStudent())
  const [studentSessions, setStudentSessions] = useState(() => readStorageObject(STUDENT_EXAM_SESSION_KEY))
  const [submissionStatuses, setSubmissionStatuses] = useState(() => readStorageObject(STUDENT_EXAM_SUBMISSION_STATUS_KEY))
  const [manualAttendance, setManualAttendance] = useState(() => readStorageObject(getManualAttendanceStorageKey(readSelectedAssessment())))
  const [studentSearch, setStudentSearch] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'studentId', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [studentDetailSearch, setStudentDetailSearch] = useState('')
  const [questionEvaluationState, setQuestionEvaluationState] = useState(() => (
    readStorageObject(getStudentQuestionEvaluationStorageKey(readSelectedAssessment(), readSelectedStudent()))
  ))

  const assessmentName = getAssessmentValue(assessment, 'assessmentName', 'Start Student Evaluation')
  const academicYear = getAssessmentYear(assessment)
  const examMode = getAssessmentValue(assessment, 'examMode', 'Online')
  const examCategory = getAssessmentValue(assessment, 'examCategory', 'Assessment')
  const examYear = assessment?.assignTo || assessment?.year || assessment?.setup?.year || '-'
  const examType = getAssessmentValue(assessment, 'examType')
  const logoPreview = getAssessmentLogo(assessment)
  const logoName = getAssessmentValue(assessment, 'logoName', 'Assessment logo')
  const headerSubtitle = [examCategory, examYear, examType, academicYear]
    .map((value) => value || '-')
    .join(' / ')
  const questionSummary = getQuestionSummary(assessment)
  const assessmentQuestions = useMemo(() => readAssessmentQuestions(assessment), [assessment])
  const mcqQuestions = assessmentQuestions.filter((item) => !isDescriptiveQuestionType(item?.type))
  const descriptiveQuestions = assessmentQuestions.filter((item) => isDescriptiveQuestionType(item?.type))
  const isOffline = isOfflineAssessment(assessment)
  const examTypeText = String(examType || '').toLowerCase()
  const shouldShowMcqObtained = examTypeText.includes('mcq') || examTypeText.includes('hybrid')
  const shouldShowDescriptiveObtained = examTypeText.includes('descriptive') || examTypeText.includes('hybrid')
  const evaluationRows = readEvaluationStudents(assessment, studentSessions, submissionStatuses, manualAttendance)
  const maxMark = questionSummary.totalMarks || Number(assessment?.totalMarks ?? assessment?.setup?.totalMarks ?? 0) || 0
  const normalizedRows = useMemo(() => evaluationRows.map((row) => {
    const isAbsent = String(row.attendance).toUpperCase() === 'A'
    return {
      ...row,
      isAbsent,
      evalStatus: isAbsent ? 'Absent' : 'Yet to Start',
      mcq: '-',
      descriptive: '-',
      attemptedQuestions: '-',
      maxMark: formatTwoDigit(maxMark),
      obtainedMarks: '-',
      percentage: '-',
    }
  }), [evaluationRows, maxMark])
  const absentCount = normalizedRows.filter((row) => row.isAbsent).length
  const pendingCount = normalizedRows.filter((row) => !row.isAbsent).length
  const metricItems = [
    {
      label: 'Total Marks :',
      value: `${formatTwoDigit(questionSummary.totalMarks)} (${formatTwoDigit(questionSummary.mcqMarks)} MCQ + ${formatTwoDigit(questionSummary.descriptiveMarks)} Desc.)`,
      icon: Award,
      tone: 'marks',
    },
    {
      label: 'Total Questions :',
      value: `${formatTwoDigit(questionSummary.totalCount)} (${formatTwoDigit(questionSummary.mcqCount)} MCQ + ${formatTwoDigit(questionSummary.descriptiveCount)} Desc.)`,
      icon: ClipboardList,
      tone: 'questions',
    },
    {
      label: 'No. of Students',
      value: formatTwoDigit(normalizedRows.length),
      icon: Users,
      tone: 'students',
    },
    {
      label: 'Absent',
      value: formatTwoDigit(absentCount),
      icon: UserX,
      tone: 'absent',
    },
    {
      label: 'Evaluation Pending',
      value: formatTwoDigit(pendingCount),
      icon: Clock3,
      tone: 'pending',
    },
    {
      label: 'Overall Percentage',
      value: '00',
      icon: Percent,
      tone: 'percentage',
    },
  ]
  const filteredRows = useMemo(() => {
    const query = studentSearch.trim().toLowerCase()
    return normalizedRows.filter((row) => {
      const matchesSearch = !query || [
        row.id,
        row.name,
        row.attendance,
        row.evalStatus,
      ].join(' ').toLowerCase().includes(query)
      const matchesAttendance = attendanceFilter === 'all' || row.attendance === attendanceFilter
      const matchesStatus = statusFilter === 'all' || row.evalStatus === statusFilter
      return matchesSearch && matchesAttendance && matchesStatus
    })
  }, [attendanceFilter, normalizedRows, statusFilter, studentSearch])
  const sortedRows = useMemo(() => {
    const sortValue = (row) => {
      if (sortConfig.key === 'studentId') return row.id
      if (sortConfig.key === 'studentName') return row.name
      if (sortConfig.key === 'attendance') return row.attendance
      if (sortConfig.key === 'status') return row.evalStatus
      if (sortConfig.key === 'maxMark') return Number(row.maxMark) || 0
      return row.id
    }

    return [...filteredRows].sort((left, right) => {
      const leftValue = sortValue(left)
      const rightValue = sortValue(right)
      const result = typeof leftValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true, sensitivity: 'base' })
      return sortConfig.direction === 'asc' ? result : -result
    })
  }, [filteredRows, sortConfig])
  const rowsPerPage = 5
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage))
  const pageStartIndex = (currentPage - 1) * rowsPerPage
  const pagedRows = sortedRows.slice(pageStartIndex, pageStartIndex + rowsPerPage)
  const pageFrom = sortedRows.length ? pageStartIndex + 1 : 0
  const pageTo = Math.min(pageStartIndex + rowsPerPage, sortedRows.length)
  const toggleSort = (key) => {
    setSortConfig((current) => (
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    ))
  }
  const sortLabel = (key, label) => (
    <button type="button" className="assessment-evaluation-sort-btn" onClick={() => toggleSort(key)}>
      {label}
      {sortConfig.key === key ? <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span> : null}
    </button>
  )
  const showTableAction = (action, row) => {
    onAlert?.({
      tone: 'primary',
      message: `${action} selected for ${row.name}.`,
    })
  }

  const openStudentEvaluation = (row) => {
    if (row.isAbsent) return
    const nextStudent = {
      ...row,
      evaluationStatus: 'Not Completed',
      attendanceStatus: row.attendance === 'P' ? 'Present' : 'Absent',
    }
    window.sessionStorage.setItem(ASSESSMENT_EVALUATION_STUDENT_KEY, JSON.stringify(nextStudent))
    setSelectedStudent(nextStudent)
  }

  const backToStudentList = () => {
    window.sessionStorage.removeItem(ASSESSMENT_EVALUATION_STUDENT_KEY)
    setSelectedStudent(null)
    setStudentDetailSearch('')
  }

  const handleStudentDetailSearch = (value) => {
    setStudentDetailSearch(value)
    const query = value.trim().toLowerCase()
    if (!query) return
    const matchedStudent = normalizedRows.find((row) => (
      !row.isAbsent
      && (
        String(row.id).toLowerCase().includes(query)
        || String(row.name).toLowerCase().includes(query)
      )
    ))
    if (matchedStudent) openStudentEvaluation(matchedStudent)
  }

  const exitToEvaluationTab = () => {
    window.localStorage.setItem(ASSESSMENT_CREATE_INITIAL_TAB_KEY, 'evaluation')
    onNavigate?.(APP_PAGES.ASSESSMENT_CREATE)
  }

  const updateManualAttendance = (studentId, attendance) => {
    setManualAttendance((current) => {
      const nextAttendance = { ...current, [studentId]: attendance }
      writeStorageObject(getManualAttendanceStorageKey(assessment), nextAttendance)
      return nextAttendance
    })
  }

  const mcqScoringItems = mcqQuestions.map((question, index) => ({
    key: getQuestionKey(question, `mcq-${index + 1}`),
    maxMarks: getQuestionMarksTotal(question) || 1,
  }))
  const descriptiveScoringItems = descriptiveQuestions.flatMap(getDescriptiveScoringItems)
  const getScoringSummary = (items) => items.reduce((summary, item) => {
    const result = questionEvaluationState[item.key] || {}
    const hasMarks = result.marks !== undefined && result.marks !== null && result.marks !== ''
    const isAttempted = result.status === 'correct'
      || result.status === 'wrong'
      || result.status === 'evaluated'
      || (hasMarks && result.status !== 'not-attempted')

    return {
      total: summary.total + 1,
      attempted: summary.attempted + (isAttempted ? 1 : 0),
      maxMarks: summary.maxMarks + parseMarksValue(item.maxMarks),
      obtainedMarks: summary.obtainedMarks + (hasMarks ? parseMarksValue(result.marks) : 0),
    }
  }, {
    total: 0,
    attempted: 0,
    maxMarks: 0,
    obtainedMarks: 0,
  })
  const mcqScoringSummary = getScoringSummary(mcqScoringItems)
  const descriptiveScoringSummary = getScoringSummary(descriptiveScoringItems)
  const studentScoringSummary = {
    total: mcqScoringSummary.total + descriptiveScoringSummary.total,
    attempted: mcqScoringSummary.attempted + descriptiveScoringSummary.attempted,
    maxMarks: mcqScoringSummary.maxMarks + descriptiveScoringSummary.maxMarks,
    obtainedMarks: mcqScoringSummary.obtainedMarks + descriptiveScoringSummary.obtainedMarks,
  }
  const studentPercentage = studentScoringSummary.maxMarks
    ? Math.round((studentScoringSummary.obtainedMarks / studentScoringSummary.maxMarks) * 100)
    : 0

  const saveQuestionEvaluationState = (updater) => {
    if (!selectedStudent) return
    setQuestionEvaluationState((current) => {
      const nextState = typeof updater === 'function' ? updater(current) : updater
      writeStorageObject(getStudentQuestionEvaluationStorageKey(assessment, selectedStudent), nextState)
      return nextState
    })
  }

  const setQuestionResult = (questionKey, result) => {
    saveQuestionEvaluationState((current) => ({
      ...current,
      [questionKey]: result,
    }))
  }

  const resetQuestionResult = (questionKey) => {
    saveQuestionEvaluationState((current) => {
      const nextState = { ...current }
      delete nextState[questionKey]
      return nextState
    })
  }

  const renderQuestionImages = (question) => {
    const images = getQuestionImages(question)
    if (!images.length) return null

    return (
      <div className="assessment-question-images" aria-label="Question images">
        {images.map((image, index) => (
          <figure key={image.id || `${image.url}-${index}`}>
            <img src={image.url} alt={image.name || `Question image ${index + 1}`} />
            <figcaption>
              <ImageIcon size={13} strokeWidth={2.3} />
              Image {String.fromCharCode(65 + index)}
            </figcaption>
          </figure>
        ))}
      </div>
    )
  }

  const renderMcqQuestion = (question, index) => {
    const questionKey = getQuestionKey(question, `mcq-${index + 1}`)
    const result = questionEvaluationState[questionKey]?.status || 'pending'
    const maxMarks = getQuestionMarksTotal(question) || 1

    return (
      <article key={questionKey} className={`assessment-question-row is-mcq is-${result}`}>
        <div className="assessment-question-main">
          <span className="assessment-question-number">{index + 1}.</span>
          <div>
            <p>{getQuestionText(question, `MCQ question ${index + 1}`)}</p>
            {renderQuestionImages(question)}
          </div>
        </div>
        <div className="assessment-question-actions">
          <span className="assessment-question-mark">Max Mark : {maxMarks}</span>
          <button
            type="button"
            className={result === 'correct' ? 'is-active is-correct' : 'is-correct'}
            onClick={() => setQuestionResult(questionKey, { status: 'correct', marks: maxMarks })}
            aria-label={`Mark question ${index + 1} correct`}
          >
            <Check size={16} strokeWidth={2.6} />
          </button>
          <button
            type="button"
            className={result === 'wrong' ? 'is-active is-wrong' : 'is-wrong'}
            onClick={() => setQuestionResult(questionKey, { status: 'wrong', marks: 0 })}
            aria-label={`Mark question ${index + 1} wrong`}
          >
            <X size={16} strokeWidth={2.6} />
          </button>
          <button
            type="button"
            className={result === 'not-attempted' ? 'is-active is-not-attempted' : 'is-not-attempted'}
            onClick={() => setQuestionResult(questionKey, { status: 'not-attempted', marks: 0 })}
          >
            Not Attempted
          </button>
          <button type="button" className="is-reset" onClick={() => resetQuestionResult(questionKey)}>
            <RotateCcw size={15} strokeWidth={2.4} />
            Reset
          </button>
        </div>
      </article>
    )
  }

  const renderDescriptiveScoringRow = (question, indexLabel, questionKey) => {
    const result = questionEvaluationState[questionKey] || {}
    const maxMarks = getQuestionMarksTotal(question) || parseMarksValue(question?.marks)

    return (
      <article key={questionKey} className={`assessment-question-row is-descriptive ${result.status === 'not-attempted' ? 'is-not-attempted' : ''}`}>
        <div className="assessment-question-main">
          <span className="assessment-question-number">{indexLabel}</span>
          <div>
            <p>{getQuestionText(question, `Descriptive question ${indexLabel}`)}</p>
            {renderQuestionImages(question)}
          </div>
        </div>
        <div className="assessment-question-actions">
          <span className="assessment-question-mark">Max Mark : {maxMarks}</span>
          <input
            type="number"
            min="0"
            max={maxMarks || undefined}
            value={result.marks ?? ''}
            onChange={(event) => setQuestionResult(questionKey, { status: 'evaluated', marks: event.target.value })}
            placeholder="Enter mark"
            aria-label={`Enter obtained mark for question ${indexLabel}`}
          />
          <button
            type="button"
            className={result.status === 'not-attempted' ? 'is-active is-not-attempted' : 'is-not-attempted'}
            onClick={() => setQuestionResult(questionKey, { status: 'not-attempted', marks: 0 })}
          >
            Not Attempted
          </button>
          <button type="button" className="is-reset" onClick={() => resetQuestionResult(questionKey)}>
            <RotateCcw size={15} strokeWidth={2.4} />
            Reset
          </button>
        </div>
      </article>
    )
  }

  const renderDescriptiveQuestion = (question, index) => {
    const baseKey = getQuestionKey(question, `descriptive-${index + 1}`)
    const sections = Array.isArray(question?.descriptiveSections) ? question.descriptiveSections : []

    if (!sections.length) {
      return renderDescriptiveScoringRow(question, `${index + 1}.`, baseKey)
    }

    return (
      <article key={baseKey} className="assessment-descriptive-group">
        <div className="assessment-descriptive-parent">
          <span className="assessment-question-number">{index + 1}.</span>
          <div>
            <p>{getQuestionText(question, `Descriptive question ${index + 1}`)}</p>
            {renderQuestionImages(question)}
          </div>
        </div>
        <div className="assessment-descriptive-children">
          {sections.map((section, sectionIndex) => {
            const children = Array.isArray(section.children) ? section.children : []
            const sectionKey = getQuestionKey(section, `${baseKey}-section-${sectionIndex + 1}`)
            const sectionTitle = getQuestionText(section, `Sub question ${index + 1}.${sectionIndex + 1}`)

            return (
              <section key={sectionKey} className="assessment-descriptive-section">
                <header>
                  <strong>{sectionTitle}</strong>
                  <span>Section Mark : {getDescriptiveSectionMarks(section)}</span>
                </header>
                {renderQuestionImages(section)}
                {children.length ? (
                  children.map((child, childIndex) => renderDescriptiveScoringRow(
                    child,
                    `${index + 1}.${sectionIndex + 1}.${childIndex + 1}`,
                    getQuestionKey(child, `${sectionKey}-child-${childIndex + 1}`),
                  ))
                ) : renderDescriptiveScoringRow(section, `${index + 1}.${sectionIndex + 1}`, sectionKey)}
              </section>
            )
          })}
        </div>
      </article>
    )
  }

  const selectedStudentDetails = selectedStudent ? [
    { label: 'Questions', value: `Attempted: ${formatTwoDigit(studentScoringSummary.attempted)} of ${formatTwoDigit(studentScoringSummary.total)}`, icon: ClipboardList, tone: 'questions' },
    { label: 'Marks', value: `Obtained: ${formatTwoDigit(studentScoringSummary.obtainedMarks)} of ${formatTwoDigit(studentScoringSummary.maxMarks)}`, icon: Award, tone: 'marks' },
    ...(shouldShowMcqObtained ? [{
      label: 'MCQ',
      badge: `${formatTwoDigit(mcqScoringSummary.attempted)} Out of ${formatTwoDigit(mcqScoringSummary.total)}`,
      tone: 'mcq',
      icon: ClipboardList,
      value: `${formatTwoDigit(mcqScoringSummary.obtainedMarks)} Marks`,
    }] : []),
    ...(shouldShowDescriptiveObtained ? [{
      label: 'Descriptive',
      badge: `${formatTwoDigit(descriptiveScoringSummary.attempted)} Out of ${formatTwoDigit(descriptiveScoringSummary.total)}`,
      tone: 'descriptive',
      icon: FileText,
      value: `${formatTwoDigit(descriptiveScoringSummary.obtainedMarks)} Marks`,
    }] : []),
    { label: 'Percentage', value: `${formatTwoDigit(studentPercentage)}%`, icon: Percent, tone: 'percentage' },
  ] : []

  useEffect(() => {
    const syncStudentSessions = () => setStudentSessions(readStorageObject(STUDENT_EXAM_SESSION_KEY))
    const syncSubmissionStatuses = () => setSubmissionStatuses(readStorageObject(STUDENT_EXAM_SUBMISSION_STATUS_KEY))

    const handleStorage = (event) => {
      if (event.key === STUDENT_EXAM_SESSION_KEY) syncStudentSessions()
      if (event.key === STUDENT_EXAM_SUBMISSION_STATUS_KEY) syncSubmissionStatuses()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(STUDENT_EXAM_SESSION_EVENT, syncStudentSessions)
    window.addEventListener(STUDENT_EXAM_SUBMISSION_STATUS_EVENT, syncSubmissionStatuses)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(STUDENT_EXAM_SESSION_EVENT, syncStudentSessions)
      window.removeEventListener(STUDENT_EXAM_SUBMISSION_STATUS_EVENT, syncSubmissionStatuses)
    }
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [attendanceFilter, statusFilter, studentSearch])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  useEffect(() => {
    setQuestionEvaluationState(readStorageObject(getStudentQuestionEvaluationStorageKey(assessment, selectedStudent)))
  }, [assessment, selectedStudent])

  return (
    <section className="assessment-evaluation-workspace">
      <header className="assessment-evaluation-top-header">
        <div className="assessment-evaluation-brand-block">
          <span className="assessment-evaluation-logo" aria-hidden="true">
            {logoPreview ? (
              <img src={logoPreview} alt={logoName} />
            ) : (
              <span>{String(assessmentName).charAt(0).toUpperCase()}</span>
            )}
          </span>
          <div className="assessment-evaluation-title-block">
            <h1>{assessmentName}</h1>
            <p>
              <span className={`assessment-evaluation-mode-text is-${String(examMode).toLowerCase().includes('offline') ? 'offline' : 'online'}`}>
                {examMode}
              </span>
              {' / '}
              {headerSubtitle}
            </p>
          </div>
        </div>

        <div className="assessment-evaluation-right-block">
          <div className="assessment-evaluation-header-actions" aria-label="Evaluation actions">
            <button
              type="button"
              className="assessment-evaluation-icon-btn"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={17} strokeWidth={2.3} /> : <Moon size={17} strokeWidth={2.3} />}
            </button>
            <button
              type="button"
              className="assessment-evaluation-exit-btn"
              onClick={exitToEvaluationTab}
            >
              <LogOut size={15} strokeWidth={2.4} />
              Exit
            </button>
          </div>
        </div>
      </header>

      {selectedStudent ? (
        <section className="assessment-student-evaluation-card" aria-label="Selected student evaluation">
          <div className="assessment-student-evaluation-head">
            <button type="button" className="assessment-student-back-icon" onClick={backToStudentList} title="Back to Student List" aria-label="Back to Student List">
              <ArrowLeft size={18} strokeWidth={2.4} />
            </button>
            <div>
              <h2>{selectedStudent.name}</h2>
              <p className="assessment-student-evaluation-subtitle">
                <span>{selectedStudent.id}</span>
                <span className="assessment-student-evaluation-divider">/</span>
                <span>{selectedStudent.attendanceStatus || (selectedStudent.attendance === 'P' ? 'Present' : 'Absent')}</span>
                <span className="assessment-student-evaluation-divider">/</span>
                <strong>{selectedStudent.evaluationStatus || 'Not Completed'}</strong>
              </p>
            </div>
            <label className="assessment-student-search">
              <input
                type="search"
                value={studentDetailSearch}
                onChange={(event) => handleStudentDetailSearch(event.target.value)}
                placeholder="Search student or ID..."
              />
            </label>
          </div>

          <div className="assessment-student-detail-grid">
            {selectedStudentDetails.map((item) => (
              <span key={item.label} className={item.tone ? `is-${item.tone}` : ''}>
                {item.icon ? <i aria-hidden="true"><item.icon size={15} strokeWidth={2.3} /></i> : null}
                <span>
                  <em>
                    {item.label}
                    {item.badge ? <b>({item.badge})</b> : null}
                  </em>
                  <strong>{item.value}</strong>
                  {item.subValue ? <small>{item.subValue}</small> : null}
                </span>
              </span>
            ))}
          </div>

          <section className="assessment-student-question-area" aria-label="Question evaluation workspace">
            {mcqQuestions.length || descriptiveQuestions.length ? (
              <>
                {mcqQuestions.length ? (
                  <section className="assessment-student-question-section is-mcq" aria-label="MCQ questions">
                    <header>
                      <h3>I. MCQ Questions</h3>
                      <span>Section Total = {formatTwoDigit(questionSummary.mcqMarks)} Marks</span>
                    </header>
                    <div className="assessment-question-list">
                      {mcqQuestions.map(renderMcqQuestion)}
                    </div>
                  </section>
                ) : null}

                {descriptiveQuestions.length ? (
                  <section className="assessment-student-question-section is-descriptive" aria-label="Descriptive questions">
                    <header>
                      <h3>{mcqQuestions.length ? 'II.' : 'I.'} Descriptive Questions</h3>
                      <span>Section Total = {formatTwoDigit(questionSummary.descriptiveMarks)} Marks</span>
                    </header>
                    <div className="assessment-question-list">
                      {descriptiveQuestions.map(renderDescriptiveQuestion)}
                    </div>
                  </section>
                ) : null}
              </>
            ) : (
              <div className="assessment-student-evaluation-empty">
                <AlertCircle size={26} strokeWidth={2.3} />
                <strong>No questions found for this assessment</strong>
                <p>Attach MCQ or descriptive questions to this exam before starting student evaluation.</p>
              </div>
            )}
          </section>
        </section>
      ) : (
      <section className="assessment-evaluation-table-card" aria-label="Student evaluation tracking">
        <div className="assessment-evaluation-metrics" aria-label="Evaluation summary">
          {metricItems.map((item) => {
            const Icon = item.icon
            return (
              <span key={item.label} className={`is-${item.tone}`}>
                <i aria-hidden="true"><Icon size={15} strokeWidth={2.3} /></i>
                <span>
                  <em>{item.label}</em>
                  <strong>{item.value}</strong>
                </span>
              </span>
            )
          })}
        </div>
        <div className="assessment-evaluation-table-tools">
          <h2>Student Evaluation</h2>
          <label>
            <input
              type="search"
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Search student..."
            />
          </label>
          <label>
            <select value={attendanceFilter} onChange={(event) => setAttendanceFilter(event.target.value)}>
              <option value="all">Attendance: All</option>
              <option value="P">Attendance: Present</option>
              <option value="A">Attendance: Absent</option>
            </select>
          </label>
          <label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Status: All</option>
              <option value="Yet to Start">Status: Yet to Start</option>
              <option value="Absent">Status: Absent</option>
            </select>
          </label>
        </div>
        <div className="assessment-evaluation-table-wrap">
          <table className="assessment-evaluation-table">
            <thead>
              <tr>
                <th>{sortLabel('studentId', 'Student ID')}</th>
                <th>{sortLabel('attendance', 'Attendance')}</th>
                <th>{sortLabel('studentName', 'Student Name')}</th>
                <th>{sortLabel('status', 'Eval. Status')}</th>
                <th>MCQ</th>
                <th>Descriptive</th>
                <th>Attempted Ques</th>
                <th>{sortLabel('maxMark', 'Max Mark')}</th>
                <th>Obt. Marks</th>
                <th>Percentage</th>
                <th>Results</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => {
                const { isAbsent, evalStatus } = row
                return (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>
                      {isOffline ? (
                        <span className="assessment-evaluation-attendance-toggle" aria-label={`Attendance for ${row.name}`}>
                          <button
                            type="button"
                            className={row.attendance === 'P' ? 'is-present is-active' : 'is-present'}
                            onClick={() => updateManualAttendance(row.id, 'P')}
                            aria-label={`Mark ${row.name} present`}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            className={row.attendance === 'A' ? 'is-absent is-active' : 'is-absent'}
                            onClick={() => updateManualAttendance(row.id, 'A')}
                            aria-label={`Mark ${row.name} absent`}
                          >
                            A
                          </button>
                        </span>
                      ) : (
                        <span className={`assessment-evaluation-attendance is-${String(row.attendance).toLowerCase()}`}>{row.attendance}</span>
                      )}
                    </td>
                    <td>{row.name}</td>
                    <td><span className={`assessment-evaluation-status ${isAbsent ? 'is-absent' : 'is-yet-to-start'}`}>{evalStatus}</span></td>
                    <td>{row.mcq}</td>
                    <td>{row.descriptive}</td>
                    <td>{row.attemptedQuestions}</td>
                    <td>{row.maxMark}</td>
                    <td>{row.obtainedMarks}</td>
                    <td>{row.percentage}</td>
                    <td>
                      <button type="button" className="assessment-evaluation-result-btn" onClick={() => showTableAction('View', row)} disabled={isAbsent}>
                        View
                      </button>
                    </td>
                    <td>
                      <div className="assessment-evaluation-row-actions">
                        <button type="button" className="is-icon is-reset" onClick={() => showTableAction('Reset', row)} aria-label={`Reset ${row.name}`} disabled={isAbsent}>
                          <RotateCcw size={14} strokeWidth={2.4} />
                        </button>
                        <button type="button" className="is-icon is-edit" onClick={() => showTableAction('Edit', row)} aria-label={`Edit ${row.name}`} disabled={isAbsent}>
                          <Pencil size={14} strokeWidth={2.4} />
                        </button>
                        <button type="button" className="is-primary" onClick={() => openStudentEvaluation(row)} disabled={isAbsent}>Start Evaluation</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <footer className="assessment-evaluation-table-footer">
          <span>Showing {pageFrom}-{pageTo} of {sortedRows.length}</span>
          <div>
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage <= 1}>
              Previous
            </button>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage >= totalPages}>
              Next
            </button>
          </div>
        </footer>
      </section>
      )}
    </section>
  )
}
