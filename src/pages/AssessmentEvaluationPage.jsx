import { AlertCircle, ArrowLeft, Award, Check, ChevronDown, ChevronUp, ClipboardList, Clock3, FileText, Image as ImageIcon, Info, LogOut, Moon, Pencil, Percent, RotateCcw, Sun, UserX, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { APP_PAGES } from '../config/appPages'
import '../styles/assessment-pages.css'

const ASSESSMENT_EVALUATION_SELECTED_KEY = 'vx-assessment-evaluation-selected'
const ASSESSMENT_EVALUATION_STUDENT_KEY = 'vx-assessment-evaluation-student'
const CREATE_ASSESSMENT_QUESTIONS_KEY = 'vx-create-assessment-questions'
const CREATE_ASSESSMENT_SECTION_TITLES_KEY = 'vx-create-assessment-section-titles'
const CREATE_ASSESSMENT_SECTION_ORDER_KEY = 'vx-create-assessment-section-order'
const CREATE_ASSESSMENT_CUSTOM_SECTIONS_KEY = 'vx-create-assessment-custom-sections'
const ASSESSMENT_CREATE_INITIAL_TAB_KEY = 'vx-assessment-create-initial-tab'
const STUDENT_EXAM_SESSION_KEY = 'vx-student-exam-session'
const STUDENT_EXAM_SESSION_EVENT = 'vx-student-exam-session-changed'
const STUDENT_EXAM_SUBMISSION_STATUS_KEY = 'vx-student-exam-submission-status'
const STUDENT_EXAM_SUBMISSION_STATUS_EVENT = 'vx-student-exam-submission-status-changed'
const ASSESSMENT_EVALUATION_ATTENDANCE_KEY = 'vx-assessment-evaluation-attendance'
const ASSESSMENT_STUDENT_QUESTION_EVALUATION_KEY = 'vx-assessment-student-question-evaluation'
const ASSESSMENT_STUDENT_EVALUATION_STATUS_KEY = 'vx-assessment-student-evaluation-status'
const ONLINE_PROCTORED_ATTEMPT_STORAGE_KEY = 'vx-online-proctored-exam-attempts'
const DEFAULT_EVALUATION_STUDENTS = [
  { id: 'MV1253', name: 'Student 1', attendance: 'P' },
  { id: 'MV1254', name: 'Student 2', attendance: 'P' },
  { id: 'MV1255', name: 'Student 3', attendance: 'P' },
  { id: 'MC2568', name: 'Karthik Subramanian', attendance: 'P' },
]
const PREVIEW_SECTION_CONFIG = [
  { key: 'MCQ', defaultTitle: 'Multiple Choice Question' },
  { key: 'SAQs', defaultTitle: 'Short Answer Questions' },
  { key: 'MEQs', defaultTitle: 'Modified Essay Questions' },
  { key: 'LAQs', defaultTitle: 'Long Answer Questions' },
]
const PREVIEW_SECTION_KEY_SET = new Set(PREVIEW_SECTION_CONFIG.map((section) => section.key))

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

const getStudentEvaluationStatusStorageKey = (assessment) => (
  `${ASSESSMENT_STUDENT_EVALUATION_STATUS_KEY}:${getAssessmentControlId(assessment)}`
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

const getOptionText = (option, fallback) => (
  stripHtml(option?.label ?? option?.text ?? option?.value ?? option?.title ?? fallback)
)

const getQuestionOptions = (question) => (
  Array.isArray(question?.options) ? question.options.filter((option) => getOptionText(option, '')) : []
)

const getCorrectOptionIndexes = (question) => {
  const options = getQuestionOptions(question)
  const correctIds = Array.isArray(question?.correctOptionIds) ? question.correctOptionIds.map(String) : []

  return options
    .map((option, index) => (correctIds.includes(String(option?.id)) ? index : -1))
    .filter((index) => index >= 0)
}

const getCorrectOptionLabel = (question) => {
  const labels = getCorrectOptionIndexes(question).map((index) => String.fromCharCode(65 + index))
  return labels.length ? labels.join(', ') : '-'
}

const getCorrectOptionAnswerText = (question) => {
  const options = getQuestionOptions(question)
  const answers = getCorrectOptionIndexes(question).map((index) => {
    const label = String.fromCharCode(65 + index)
    const text = getOptionText(options[index], '')
    return text ? `${label} - ${text}` : label
  })
  return answers.length ? answers.join(', ') : '-'
}

const getAnswerKeyText = (item) => stripHtml(item?.answerKey ?? item?.answer ?? item?.expectedAnswer ?? '')

const getOnlineMcqQuestionKey = (question, index) => String(question?.id ?? `mcq-${index}`)

const getTagValues = (value) => {
  const values = Array.isArray(value) ? value : [value]
  return values
    .map((item) => stripHtml(item?.label ?? item?.value ?? item))
    .filter(Boolean)
}

const getQuestionTagItems = (item, fallback = {}) => [
  { label: 'Year', values: getTagValues(item?.year || fallback?.year) },
  { label: 'Subject', values: getTagValues(item?.subject || fallback?.subject) },
  { label: 'Topics', values: getTagValues(item?.topics?.length ? item.topics : fallback?.topics) },
  { label: 'Competency', values: getTagValues(item?.competencies?.length ? item.competencies : fallback?.competencies) },
  { label: 'Category', values: getTagValues(item?.questionCategory || fallback?.questionCategory) },
  { label: 'Thinking Level', values: getTagValues(item?.thinkingLevel || fallback?.thinkingLevel) },
  { label: 'Difficulty Level', values: getTagValues(item?.difficultyLevel || fallback?.difficultyLevel) },
  { label: 'Cognitive Level', values: getTagValues(item?.cognitiveLevel || fallback?.cognitiveLevel) },
  { label: 'Cognitive Function', values: getTagValues(item?.cognitiveFunction || fallback?.cognitiveFunction) },
  { label: 'Skill Focus', values: getTagValues(item?.skillFocus || fallback?.skillFocus) },
  { label: 'Organ System', values: getTagValues(item?.organSystem || fallback?.organSystem) },
  { label: 'Organ Sub-System', values: getTagValues((item?.organSubSystems?.length ? item.organSubSystems : fallback?.organSubSystems)) },
  { label: 'Key Concept', values: getTagValues((item?.keyConcepts?.length ? item.keyConcepts : fallback?.keyConcepts)) },
].filter((tag) => tag.values.length)

const readStoredAttempt = (assessment, student) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ONLINE_PROCTORED_ATTEMPT_STORAGE_KEY) || 'null')
    const attempt = parsed?.[getAssessmentControlId(assessment)]?.[student?.id]
    return attempt && typeof attempt === 'object' ? attempt : {}
  } catch {
    return {}
  }
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

const getPreviewSectionTitles = (setup = {}) => {
  const suffix = getAssessmentStorageSuffix(setup)
  const defaults = PREVIEW_SECTION_CONFIG.reduce((titles, section) => ({
    ...titles,
    [section.key]: section.defaultTitle,
  }), {})
  const customSections = readStorageObject(`${CREATE_ASSESSMENT_CUSTOM_SECTIONS_KEY}:${suffix}`)
  const customTitles = Array.isArray(customSections)
    ? Object.fromEntries(customSections.map((section) => [
      section.key,
      section.title || section.defaultTitle || 'New Section',
    ]))
    : {}
  const savedTitles = readStorageObject(`${CREATE_ASSESSMENT_SECTION_TITLES_KEY}:${suffix}`)

  return {
    ...defaults,
    ...customTitles,
    ...(savedTitles && typeof savedTitles === 'object' ? savedTitles : {}),
  }
}

const getPreviewSectionOrder = (setup = {}, questions = []) => {
  const suffix = getAssessmentStorageSuffix(setup)
  const defaultOrder = PREVIEW_SECTION_CONFIG.map((section) => section.key)
  const savedOrder = readStorageObject(`${CREATE_ASSESSMENT_SECTION_ORDER_KEY}:${suffix}`)
  const orderedKeys = Array.isArray(savedOrder) ? savedOrder : []
  const questionKeys = questions.map(getPreviewSectionKey).filter(Boolean)

  return [
    ...orderedKeys,
    ...defaultOrder,
    ...questionKeys,
  ].filter((key, index, rows) => rows.indexOf(key) === index)
}

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

const ROMAN_LABELS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']
const ALPHA_LABELS = 'abcdefghijklmnopqrstuvwxyz'.split('')
const getRomanLabel = (index) => `${ROMAN_LABELS[index] || index + 1}.`
const getAlphaLabel = (index) => `${ALPHA_LABELS[index] || index + 1}.`

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

export default function AssessmentEvaluationPage({ onNavigate, onAlert, theme = 'light', onToggleTheme, view = 'list' }) {
  const isStudentEvaluationView = view === 'student'
  const [assessment] = useState(() => readSelectedAssessment())
  const [selectedStudent, setSelectedStudent] = useState(() => readSelectedStudent())
  const [studentSessions, setStudentSessions] = useState(() => readStorageObject(STUDENT_EXAM_SESSION_KEY))
  const [submissionStatuses, setSubmissionStatuses] = useState(() => readStorageObject(STUDENT_EXAM_SUBMISSION_STATUS_KEY))
  const [manualAttendance, setManualAttendance] = useState(() => readStorageObject(getManualAttendanceStorageKey(readSelectedAssessment())))
  const [studentEvaluationStatuses, setStudentEvaluationStatuses] = useState(() => readStorageObject(getStudentEvaluationStatusStorageKey(readSelectedAssessment())))
  const [studentSearch, setStudentSearch] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'studentId', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [studentDetailSearch, setStudentDetailSearch] = useState('')
  const [expandedMcqQuestions, setExpandedMcqQuestions] = useState({})
  const [expandedDescriptiveAnswerKeys, setExpandedDescriptiveAnswerKeys] = useState({})
  const [collapsedQuestionSections, setCollapsedQuestionSections] = useState({})
  const [expandedTagPanels, setExpandedTagPanels] = useState({})
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
  const previewSectionTitles = getPreviewSectionTitles(assessment?.setup ?? assessment)
  const previewSectionGroups = getPreviewSectionOrder(assessment?.setup ?? assessment, assessmentQuestions)
    .map((sectionKey) => {
      const questions = assessmentQuestions.filter((item) => getPreviewSectionKey(item) === sectionKey)
      return {
        key: sectionKey,
        title: previewSectionTitles[sectionKey] || sectionKey,
        marks: questions.reduce((total, item) => total + getQuestionMarksTotal(item), 0),
        questions,
      }
    })
    .filter((section) => section.questions.length)
  const questionDisplayNumbers = previewSectionGroups.reduce((numbers, section) => {
    section.questions.forEach((question) => {
      const key = getQuestionKey(question, `${section.key}-${section.questions.indexOf(question)}`)
      numbers[key] = Object.keys(numbers).length + 1
    })
    return numbers
  }, {})
  const isOffline = isOfflineAssessment(assessment)
  const examTypeText = String(examType || '').toLowerCase()
  const shouldShowMcqObtained = examTypeText.includes('mcq') || examTypeText.includes('hybrid')
  const shouldShowDescriptiveObtained = examTypeText.includes('descriptive') || examTypeText.includes('hybrid')
  const evaluationRows = readEvaluationStudents(assessment, studentSessions, submissionStatuses, manualAttendance)
  const maxMark = questionSummary.totalMarks || Number(assessment?.totalMarks ?? assessment?.setup?.totalMarks ?? 0) || 0
  const normalizedRows = useMemo(() => evaluationRows.map((row) => {
    const isAbsent = String(row.attendance).toUpperCase() === 'A'
    const savedStatus = studentEvaluationStatuses[row.id]?.status
    return {
      ...row,
      isAbsent,
      evalStatus: isAbsent ? 'Absent' : (savedStatus || 'Yet to Start'),
      mcq: '-',
      descriptive: '-',
      attemptedQuestions: '-',
      maxMark: formatTwoDigit(maxMark),
      obtainedMarks: '-',
      percentage: '-',
    }
  }), [evaluationRows, maxMark, studentEvaluationStatuses])
  const absentCount = normalizedRows.filter((row) => row.isAbsent).length
  const pendingCount = normalizedRows.filter((row) => !row.isAbsent && row.evalStatus !== 'Completed').length
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
      evaluationStatus: row.evalStatus === 'Completed' ? 'Completed' : 'Not Completed',
      attendanceStatus: row.attendance === 'P' ? 'Present' : 'Absent',
    }
    window.sessionStorage.setItem(ASSESSMENT_EVALUATION_STUDENT_KEY, JSON.stringify(nextStudent))
    setSelectedStudent(nextStudent)
    onNavigate?.(APP_PAGES.ASSESSMENT_STUDENT_EVALUATION)
  }

  const backToStudentList = () => {
    window.sessionStorage.removeItem(ASSESSMENT_EVALUATION_STUDENT_KEY)
    setSelectedStudent(null)
    setStudentDetailSearch('')
    onNavigate?.(APP_PAGES.ASSESSMENT_EVALUATION)
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
    const isValidResult = !result.error && result.status !== 'invalid'
    const isAttempted = isValidResult && (result.status === 'correct'
      || result.status === 'wrong'
      || result.status === 'evaluated'
      || (hasMarks && result.status !== 'not-attempted'))

    return {
      total: summary.total + 1,
      attempted: summary.attempted + (isAttempted ? 1 : 0),
      maxMarks: summary.maxMarks + parseMarksValue(item.maxMarks),
      obtainedMarks: summary.obtainedMarks + (hasMarks && isValidResult ? parseMarksValue(result.marks) : 0),
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

  const setDescriptiveMarksResult = (questionKey, value, maxMarks) => {
    const trimmedValue = String(value).trim()

    if (trimmedValue === '') {
      setQuestionResult(questionKey, { status: 'pending', marks: '' })
      return
    }

    const numericValue = Number(trimmedValue)
    const maxValue = Number(maxMarks) || 0

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      setQuestionResult(questionKey, {
        status: 'invalid',
        marks: value,
        error: 'Enter a valid mark.',
      })
      return
    }

    if (maxValue && numericValue > maxValue) {
      setQuestionResult(questionKey, {
        status: 'invalid',
        marks: value,
        error: `Marks cannot exceed Max Mark : ${maxValue}`,
      })
      return
    }

    setQuestionResult(questionKey, {
      status: 'evaluated',
      marks: value,
    })
  }

  const resetQuestionResult = (questionKey) => {
    saveQuestionEvaluationState((current) => {
      const nextState = { ...current }
      delete nextState[questionKey]
      return nextState
    })
  }

  const toggleMcqDetails = (questionKey) => {
    setExpandedMcqQuestions((current) => ({
      ...current,
      [questionKey]: !current[questionKey],
    }))
  }

  const toggleQuestionSection = (sectionKey) => {
    setCollapsedQuestionSections((current) => ({
      ...current,
      [sectionKey]: !(current[sectionKey] ?? true),
    }))
  }

  const toggleQuestionTags = (tagKey) => {
    setExpandedTagPanels((current) => ({
      ...current,
      [tagKey]: !current[tagKey],
    }))
  }

  const renderQuestionImageBadge = (question) => {
    const images = getQuestionImages(question)
    if (!images.length) return null

    return (
      <span className="assessment-question-image-popover">
        <button type="button" className="assessment-question-image-link">
          <ImageIcon size={13} strokeWidth={2.3} />
          View Images {images.length}
        </button>
        <span className="assessment-question-image-tooltip" role="tooltip">
          {images.map((image, index) => (
            <figure key={image.id || `${image.url}-${index}`}>
              <img src={image.url} alt={image.name || `Question image ${index + 1}`} />
              <figcaption>
                <ImageIcon size={12} strokeWidth={2.3} />
                Image {String.fromCharCode(65 + index)}
              </figcaption>
            </figure>
          ))}
        </span>
      </span>
    )
  }

  const renderQuestionTagInfo = (question, fallbackQuestion = {}, tagKey = getQuestionKey(question, 'question-tags')) => {
    const tags = getQuestionTagItems(question, fallbackQuestion)
    if (!tags.length) return null

    return (
      <button
        type="button"
        className={`assessment-question-tag-btn ${expandedTagPanels[tagKey] ? 'is-active' : ''}`}
        onClick={() => toggleQuestionTags(tagKey)}
        aria-expanded={Boolean(expandedTagPanels[tagKey])}
        aria-label="View question tags"
      >
        <Info size={14} strokeWidth={2.3} />
      </button>
    )
  }

  const renderQuestionTagsPanel = (question, fallbackQuestion = {}, tagKey = getQuestionKey(question, 'question-tags')) => {
    const tags = getQuestionTagItems(question, fallbackQuestion)
    if (!tags.length || !expandedTagPanels[tagKey]) return null

    return (
      <div className="assessment-question-tag-panel">
        <div className="assessment-question-tag-panel-head">
          <Info size={14} strokeWidth={2.3} />
          <strong>Question Tags</strong>
        </div>
        <div className="assessment-question-tag-grid">
          {tags.map((tag) => (
            <span key={tag.label} className="assessment-question-tag-item">
              <strong>{tag.label}</strong>
              <span>{tag.values.join(', ')}</span>
            </span>
          ))}
        </div>
      </div>
    )
  }

  const renderQuestionBadges = (maxMarks, question, fallbackQuestion = {}, tagKey = getQuestionKey(question, 'question-tags'), showTags = true) => (
    <div className="assessment-question-badges">
      {showTags ? renderQuestionTagInfo(question, fallbackQuestion, tagKey) : null}
      <span className="assessment-question-badge is-mark">Max Mark : {maxMarks || 0}</span>
    </div>
  )

  const renderAnswerKey = (item, label = 'Answer Key') => {
    const answerText = getAnswerKeyText(item)
    if (!answerText) return null

    return (
      <div className="assessment-answer-key">
        <strong>{label}</strong>
        <span>{answerText}</span>
      </div>
    )
  }

  const toggleDescriptiveAnswerKey = (questionKey) => {
    setExpandedDescriptiveAnswerKeys((current) => ({
      ...current,
      [questionKey]: !current[questionKey],
    }))
  }

  const renderDescriptiveAnswerKeyContent = (item) => {
    const answerText = getAnswerKeyText(item)
    if (!answerText) return null

    return (
      <span className="assessment-answer-key-content">
        <strong>Answer Key :</strong>
        <span>{answerText}</span>
      </span>
    )
  }

  const renderDescriptiveAnswerKeyToggle = (item, questionKey) => {
    const answerText = getAnswerKeyText(item)
    if (!answerText) return null

    const isExpanded = Boolean(expandedDescriptiveAnswerKeys[questionKey])

    return (
      <div className={`assessment-answer-key is-collapsible ${isExpanded ? 'is-open' : ''}`}>
        <button
          type="button"
          className="assessment-answer-key-toggle"
          onClick={() => toggleDescriptiveAnswerKey(questionKey)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <ChevronUp size={13} strokeWidth={2.4} /> : <ChevronDown size={13} strokeWidth={2.4} />}
          {isExpanded ? 'Hide Answer Key' : 'Show Answer Key'}
        </button>
      </div>
    )
  }

  const renderMcqOptions = (question) => {
    const options = getQuestionOptions(question)
    if (!options.length) return null

    return (
      <div className="assessment-mcq-options" aria-label="MCQ options">
        {options.map((option, optionIndex) => {
          const optionLabel = String.fromCharCode(65 + optionIndex)
          return (
            <span key={option?.id || `${optionLabel}-${optionIndex}`}>
              <b>{optionLabel}</b>
              <span>{getOptionText(option, `Option ${optionLabel}`)}</span>
            </span>
          )
        })}
      </div>
    )
  }

  const renderMcqAnswerMeta = (question, studentAnswerIndex) => (
    <div className="assessment-question-meta is-mcq-answer">
      <span>
        <strong>Answer Key</strong>
        {getCorrectOptionAnswerText(question)}
      </span>
      {Number.isInteger(studentAnswerIndex) ? (
        <span>
          <strong>Student Answer</strong>
          {String.fromCharCode(65 + studentAnswerIndex)}
        </span>
      ) : null}
      {renderAnswerKey(question, 'Explanation')}
    </div>
  )

  const renderMcqAnswerKeyOnly = (question) => (
    <div className="assessment-question-meta is-mcq-answer">
      <span>
        <strong>Answer Key</strong>
        {getCorrectOptionAnswerText(question)}
      </span>
    </div>
  )

  const renderMcqDetailsToggle = (questionKey, isExpanded) => (
    <button
      type="button"
      className="assessment-mcq-toggle"
      onClick={() => toggleMcqDetails(questionKey)}
      aria-expanded={isExpanded}
    >
      {isExpanded ? <ChevronUp size={13} strokeWidth={2.4} /> : <ChevronDown size={13} strokeWidth={2.4} />}
      {isExpanded ? 'Hide Options' : 'Show Options'}
    </button>
  )

  const renderMcqQuestion = (question, index, displayNumber = index + 1) => {
    const questionKey = getQuestionKey(question, `mcq-${index + 1}`)
    const result = questionEvaluationState[questionKey]?.status || 'pending'
    const maxMarks = getQuestionMarksTotal(question) || 1
    const attempt = readStoredAttempt(assessment, selectedStudent)
    const storedStudentAnswer = attempt?.answers?.[getOnlineMcqQuestionKey(question, index)]
    const studentAnswerIndex = Number.isFinite(Number(storedStudentAnswer)) ? Number(storedStudentAnswer) : null
    const shouldShowOnlineMcqDetails = !isOffline
    const isExpanded = Boolean(expandedMcqQuestions[questionKey])

    return (
      <article key={questionKey} className={`assessment-question-row is-mcq is-${result}`}>
        <div className="assessment-question-main">
          <span className="assessment-question-number">{displayNumber}.</span>
          <div>
            <div className="assessment-question-content-head">
              <p>
                {getQuestionText(question, `MCQ question ${displayNumber}`)}
                {renderQuestionImageBadge(question)}
              </p>
              {renderQuestionBadges(maxMarks, question, {}, questionKey)}
            </div>
            {renderQuestionTagsPanel(question, {}, questionKey)}
            {isExpanded ? renderMcqOptions(question) : null}
          </div>
        </div>
        <div className="assessment-question-control-row">
          <div className="assessment-question-control-start">
            {renderMcqAnswerKeyOnly(question)}
            {renderMcqDetailsToggle(questionKey, isExpanded)}
          </div>
          <div className="assessment-question-actions">
            <button
              type="button"
              className={result === 'correct' ? 'is-active is-correct' : 'is-correct'}
              onClick={() => setQuestionResult(questionKey, { status: 'correct', marks: maxMarks })}
              aria-label={`Mark question ${displayNumber} correct`}
            >
              <Check size={16} strokeWidth={2.6} />
            </button>
            <button
              type="button"
              className={result === 'wrong' ? 'is-active is-wrong' : 'is-wrong'}
              onClick={() => setQuestionResult(questionKey, { status: 'wrong', marks: 0 })}
              aria-label={`Mark question ${displayNumber} wrong`}
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
            <button type="button" className="is-reset is-icon-only" onClick={() => resetQuestionResult(questionKey)} title="Reset" aria-label={`Reset question ${displayNumber}`}>
              <RotateCcw size={15} strokeWidth={2.4} />
            </button>
          </div>
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
            <div className="assessment-question-content-head">
              <p>
                {getQuestionText(question, `Descriptive question ${indexLabel}`)}
                {renderQuestionImageBadge(question)}
              </p>
              {renderQuestionBadges(maxMarks, question, {}, questionKey, false)}
            </div>
          </div>
        </div>
        {expandedDescriptiveAnswerKeys[questionKey] ? (
          <div className="assessment-question-answer-row">
            {renderDescriptiveAnswerKeyContent(question)}
          </div>
        ) : null}
        <div className="assessment-question-control-row is-descriptive-controls">
          <div className="assessment-question-control-start">
            {renderDescriptiveAnswerKeyToggle(question, questionKey)}
          </div>
          {result.error ? <span className="assessment-mark-inline-error">{result.error}</span> : null}
          <div className="assessment-question-actions">
            <label className="assessment-mark-field">
              <input
                type="number"
                min="0"
                max={maxMarks || undefined}
                step="any"
                value={result.marks ?? ''}
                onKeyDown={(event) => {
                  if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault()
                }}
                onChange={(event) => setDescriptiveMarksResult(questionKey, event.target.value, maxMarks)}
                placeholder="Enter mark"
                aria-label={`Enter obtained mark for question ${indexLabel}`}
                aria-invalid={Boolean(result.error)}
                className={result.error ? 'is-invalid' : ''}
              />
            </label>
            <button
              type="button"
              className={result.status === 'not-attempted' ? 'is-active is-not-attempted' : 'is-not-attempted'}
              onClick={() => setQuestionResult(questionKey, { status: 'not-attempted', marks: 0 })}
            >
              Not Attempted
            </button>
            <button type="button" className="is-reset is-icon-only" onClick={() => resetQuestionResult(questionKey)} title="Reset" aria-label={`Reset question ${indexLabel}`}>
              <RotateCcw size={15} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </article>
    )
  }

  const renderDescriptiveQuestion = (question, index, displayNumber = index + 1) => {
    const baseKey = getQuestionKey(question, `descriptive-${index + 1}`)
    const sections = Array.isArray(question?.descriptiveSections) ? question.descriptiveSections : []

    if (!sections.length) {
      return renderDescriptiveScoringRow(question, `${displayNumber}.`, baseKey)
    }

    return (
      <article key={baseKey} className="assessment-descriptive-group">
        <div className="assessment-descriptive-parent">
          <span className="assessment-question-number">{displayNumber}.</span>
          <div>
            <div className="assessment-question-content-head">
              <p>
                {getQuestionText(question, `Descriptive question ${displayNumber}`)}
                {renderQuestionImageBadge(question)}
              </p>
              {renderQuestionBadges(getQuestionMarksTotal(question) || parseMarksValue(question?.marks), question, {}, baseKey)}
            </div>
            {renderQuestionTagsPanel(question, {}, baseKey)}
          </div>
        </div>
        <div className="assessment-descriptive-children">
          {sections.map((section, sectionIndex) => {
            const children = Array.isArray(section.children) ? section.children : []
            const sectionKey = getQuestionKey(section, `${baseKey}-section-${sectionIndex + 1}`)
            const sectionLabel = getRomanLabel(sectionIndex)
            const sectionTitle = getQuestionText(section, `Sub question ${displayNumber} ${sectionLabel}`)

            if (!children.length) {
              return renderDescriptiveScoringRow(section, sectionLabel, sectionKey)
            }

            return (
              <section key={sectionKey} className="assessment-descriptive-section">
                <header>
                  <strong>
                    <span className="assessment-descriptive-section-label">{sectionLabel}</span>
                    {sectionTitle}
                  </strong>
                </header>
                {children.map((child, childIndex) => renderDescriptiveScoringRow(
                  child,
                  getAlphaLabel(childIndex),
                  getQuestionKey(child, `${sectionKey}-child-${childIndex + 1}`),
                ))}
              </section>
            )
          })}
        </div>
      </article>
    )
  }

  const isMcqResultComplete = (result = {}) => (
    result.status === 'correct'
    || result.status === 'wrong'
    || result.status === 'not-attempted'
  )

  const isDescriptiveResultComplete = (result = {}) => {
    const hasMarks = result.marks !== undefined && result.marks !== null && result.marks !== ''
    return !result.error && (result.status === 'not-attempted' || result.status === 'evaluated' || hasMarks)
  }

  const getSectionEvaluationStatus = (section) => {
    const scoringItems = section.questions.flatMap((question, questionIndex) => {
      if (!isDescriptiveQuestionType(question?.type)) {
        return [{
          key: getQuestionKey(question, `mcq-${questionIndex + 1}`),
          type: 'mcq',
        }]
      }

      return getDescriptiveScoringItems(question, questionIndex).map((item) => ({
        key: item.key,
        type: 'descriptive',
      }))
    })

    if (!scoringItems.length) return 'in-progress'

    const isCompleted = scoringItems.every((item) => {
      const result = questionEvaluationState[item.key] || {}
      return item.type === 'mcq'
        ? isMcqResultComplete(result)
        : isDescriptiveResultComplete(result)
    })

    return isCompleted ? 'completed' : 'in-progress'
  }

  const renderSectionStatusBadge = (status) => (
    <span className={`assessment-section-status is-${status}`}>
      Section Status : {status === 'completed' ? 'Completed' : 'In Progress'}
    </span>
  )

  const selectedStudentEvaluationStatus = selectedStudent && previewSectionGroups.length
    ? previewSectionGroups.every((section) => getSectionEvaluationStatus(section) === 'completed')
      ? 'Completed'
      : 'Not Completed'
    : selectedStudent?.evaluationStatus || 'Not Completed'

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

  useEffect(() => {
    if (!selectedStudent) return
    const studentId = selectedStudent.id
    const nextStatus = selectedStudentEvaluationStatus

    setStudentEvaluationStatuses((current) => {
      if (current[studentId]?.status === nextStatus) return current
      const nextStatuses = {
        ...current,
        [studentId]: {
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        },
      }
      writeStorageObject(getStudentEvaluationStatusStorageKey(assessment), nextStatuses)
      return nextStatuses
    })

    if (selectedStudent.evaluationStatus !== nextStatus) {
      const nextStudent = { ...selectedStudent, evaluationStatus: nextStatus }
      window.sessionStorage.setItem(ASSESSMENT_EVALUATION_STUDENT_KEY, JSON.stringify(nextStudent))
      setSelectedStudent(nextStudent)
    }
  }, [assessment, selectedStudent, selectedStudentEvaluationStatus])

  useEffect(() => {
    if (!selectedStudent || isOffline || !mcqQuestions.length) return
    const attempt = readStoredAttempt(assessment, selectedStudent)
    const answers = attempt?.answers || {}
    if (!answers || typeof answers !== 'object') return

    const autoResults = {}
    mcqQuestions.forEach((question, index) => {
      const questionKey = getQuestionKey(question, `mcq-${index + 1}`)
      if (questionEvaluationState[questionKey]) return

      const storedAnswer = answers[getOnlineMcqQuestionKey(question, index)]
      const selectedOptionIndex = Number(storedAnswer)
      if (!Number.isInteger(selectedOptionIndex)) return

      const correctIndexes = getCorrectOptionIndexes(question)
      const maxMarks = getQuestionMarksTotal(question) || 1
      autoResults[questionKey] = correctIndexes.includes(selectedOptionIndex)
        ? { status: 'correct', marks: maxMarks, autoEvaluated: true }
        : { status: 'wrong', marks: 0, autoEvaluated: true }
    })

    if (!Object.keys(autoResults).length) return
    saveQuestionEvaluationState((current) => ({ ...autoResults, ...current }))
  }, [assessment, selectedStudent, isOffline, assessmentQuestions, questionEvaluationState])

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

      {isStudentEvaluationView ? (
        selectedStudent ? (
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
                <strong className={selectedStudentEvaluationStatus === 'Completed' ? 'is-completed' : 'is-not-completed'}>{selectedStudentEvaluationStatus}</strong>
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
            {previewSectionGroups.length ? (
              previewSectionGroups.map((section, sectionIndex) => {
                const sectionLabel = ['I', 'II', 'III', 'IV', 'V', 'VI'][sectionIndex] || `${sectionIndex + 1}`
                const isDescriptiveSection = section.questions.some((question) => isDescriptiveQuestionType(question?.type))
                const sectionStatus = getSectionEvaluationStatus(section)
                const isSectionCollapsed = collapsedQuestionSections[section.key] ?? true

                return (
                  <section
                    key={section.key}
                    className={`assessment-student-question-section ${isDescriptiveSection ? 'is-descriptive' : 'is-mcq'} ${isSectionCollapsed ? 'is-collapsed' : ''}`}
                    aria-label={section.title}
                  >
                    <header
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleQuestionSection(section.key)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          toggleQuestionSection(section.key)
                        }
                      }}
                    >
                      <h3>{sectionLabel}. {section.title}</h3>
                      <span className="assessment-section-head-meta">
                        {renderSectionStatusBadge(sectionStatus)}
                        <span className="assessment-section-mark-badge">{formatTwoDigit(section.marks)} Marks</span>
                        <button
                          type="button"
                          className="assessment-section-toggle"
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleQuestionSection(section.key)
                          }}
                          aria-expanded={!isSectionCollapsed}
                          aria-label={`${isSectionCollapsed ? 'Expand' : 'Collapse'} ${section.title}`}
                        >
                          {isSectionCollapsed ? <ChevronDown size={16} strokeWidth={2.5} /> : <ChevronUp size={16} strokeWidth={2.5} />}
                        </button>
                      </span>
                    </header>
                    {!isSectionCollapsed ? (
                      <div className="assessment-question-list">
                        {section.questions.map((question, questionIndex) => {
                          const questionKey = getQuestionKey(question, `${section.key}-${questionIndex}`)
                          const displayNumber = questionDisplayNumbers[questionKey] || questionIndex + 1

                          return isDescriptiveQuestionType(question?.type)
                            ? renderDescriptiveQuestion(question, questionIndex, displayNumber)
                            : renderMcqQuestion(question, questionIndex, displayNumber)
                        })}
                      </div>
                    ) : null}
                  </section>
                )
              })
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
          <section className="assessment-student-evaluation-card" aria-label="Selected student evaluation">
            <div className="assessment-student-evaluation-empty">
              <AlertCircle size={26} strokeWidth={2.3} />
              <strong>No student selected</strong>
              <p>Go back to the student evaluation list and choose Start Evaluation for a student.</p>
              <button type="button" className="assessment-evaluation-exit-btn" onClick={backToStudentList}>
                <ArrowLeft size={16} strokeWidth={2.4} />
                Back to Student List
              </button>
            </div>
          </section>
        )
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
              <option value="Completed">Status: Completed</option>
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
                    <td><span className={`assessment-evaluation-status ${isAbsent ? 'is-absent' : evalStatus === 'Completed' ? 'is-completed' : 'is-yet-to-start'}`}>{evalStatus}</span></td>
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
