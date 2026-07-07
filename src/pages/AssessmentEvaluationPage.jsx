import { AlertCircle, ArrowLeft, Award, Check, ChevronDown, ChevronRight, ChevronUp, ClipboardList, Clock3, Download, FileText, Filter, Image as ImageIcon, Info, LogOut, Moon, Pencil, Percent, RotateCcw, Search, Sun, UserX, Users, X } from 'lucide-react'
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

const RESULT_TAG_ANALYTICS = {
  questionCategory: {
    title: 'Question Category',
    heading: 'Progress Based Mastery',
    field: 'questionCategory',
    labels: [
      { label: 'Direct Comprehension', aliases: ['direct'] },
      { label: 'Reasoning Skills', aliases: ['reasoning'] },
      { label: 'Critical Thinking', aliases: ['critical'] },
      { label: 'Application', aliases: ['application', 'apply'] },
    ],
  },
  thinkingLevel: {
    title: 'Thinking Level',
    field: 'thinkingLevel',
    labels: [
      { label: 'HoT - Higher Order Thinking', aliases: ['hot', 'higher order'] },
      { label: 'LoT - Lower Order Thinking', aliases: ['lot', 'lower order'] },
    ],
  },
  cognitiveLevel: {
    title: 'Cognitive Level',
    heading: 'Cognitive Levels - Blooms Taxonomy',
    field: 'cognitiveLevel',
    labels: [
      { label: 'Remember', aliases: ['remember'] },
      { label: 'Evaluate', aliases: ['evaluate'] },
      { label: 'Apply', aliases: ['apply', 'application'] },
      { label: 'Analyse', aliases: ['analyse', 'analyze'] },
      { label: 'Understand', aliases: ['understand'] },
    ],
  },
  cognitiveFunction: {
    title: 'Cognitive Function',
    field: 'cognitiveFunction',
    labels: [
      { label: 'Attention & Cue Detection', aliases: ['attention', 'cue detection'] },
      { label: 'Working Memory', aliases: ['working memory'] },
      { label: 'Pattern Recognition', aliases: ['pattern recognition'] },
      { label: 'Prioritization/Executive Function', aliases: ['prioritization', 'prioritisation', 'executive function'] },
      { label: 'Judgement & Decision Making', aliases: ['judgement', 'judgment', 'decision making'] },
      { label: 'Metacognition (Reflection)', aliases: ['metacognition', 'reflection'] },
    ],
  },
  skillFocus: {
    title: 'Skill Focus',
    heading: 'Skill Focus Categories',
    field: 'skillFocus',
    labels: [
      { label: 'Diagnosis', aliases: ['diagnosis'] },
      { label: 'Investigation', aliases: ['investigation'] },
      { label: 'Treatment', aliases: ['treatment'] },
      { label: 'Management', aliases: ['management'] },
      { label: 'Prognosis', aliases: ['prognosis'] },
      { label: 'Prevention', aliases: ['prevention'] },
      { label: 'Knowledge', aliases: ['knowledge'] },
      { label: 'Data Interpretation', aliases: ['data interpretation'] },
      { label: 'Risk Assessment', aliases: ['risk assessment'] },
      { label: 'Ethics', aliases: ['ethics'] },
      { label: 'Communication', aliases: ['communication'] },
      { label: 'Patient Safety', aliases: ['patient safety'] },
      { label: 'Regulations or Protocols', aliases: ['regulations', 'protocols'] },
    ],
  },
}

const RESULT_CHART_COLORS = ['#2ecda3', '#f0d436', '#6bb6e8', '#b9caf2', '#c18beb', '#6e8ee8', '#8fd8b8', '#f5cf7d', '#9479c8', '#62b783']

const normalizeTagLabel = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const isMatchingTagValue = (value, tag) => {
  const normalizedValue = normalizeTagLabel(value)
  if (!normalizedValue) return false
  const candidates = [tag.label, ...(tag.aliases || [])].map(normalizeTagLabel)
  return candidates.some((candidate) => normalizedValue === candidate || normalizedValue.includes(candidate) || candidate.includes(normalizedValue))
}

const buildTagAnalyticsSeries = (questions = [], config) => {
  const counts = config.labels.map((tag) => {
    const count = questions.reduce((total, question) => {
      const values = getTagValues(question?.[config.field])
      return total + (values.some((value) => isMatchingTagValue(value, tag)) ? 1 : 0)
    }, 0)
    return { label: tag.label, value: count }
  })
  const total = counts.reduce((sum, item) => sum + item.value, 0)

  return counts.map((item, index) => ({
    ...item,
    color: RESULT_CHART_COLORS[index % RESULT_CHART_COLORS.length],
    percentage: total ? Math.round((item.value / total) * 100) : 0,
  }))
}

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

const getAssessmentAttainmentThreshold = (assessment) => {
  const levels = assessment?.attainmentLevels || assessment?.setup?.attainmentLevels || []
  const validLevels = Array.isArray(levels)
    ? levels
      .map((row) => ({
        level: Number(row?.level),
        minPercentage: Number(row?.minPercentage),
        maxPercentage: Number(row?.maxPercentage),
      }))
      .filter((row) => Number.isFinite(row.minPercentage) && row.minPercentage >= 0 && row.minPercentage <= 100)
    : []

  if (!validLevels.length) return 50

  const highestLevel = [...validLevels].sort((left, right) => {
    if (Number.isFinite(right.level) && Number.isFinite(left.level) && right.level !== left.level) {
      return right.level - left.level
    }
    return (right.maxPercentage || 0) - (left.maxPercentage || 0)
  })[0]

  return highestLevel?.minPercentage ?? 50
}

const getAttainmentResult = (percentage, threshold) => {
  const numericPercentage = Number(percentage)
  const numericThreshold = Number(threshold)
  if (!Number.isFinite(numericPercentage) || !Number.isFinite(numericThreshold)) return null
  const achieved = numericPercentage >= numericThreshold

  return {
    achieved,
    thresholdLabel: achieved ? 'Threshold Achieved' : 'Threshold Not Achieved',
    resultLabel: achieved ? 'Achieved' : 'Not Achieved',
  }
}

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
  const isStudentResultView = view === 'result'
  const isStudentEvaluationView = view === 'student' || isStudentResultView
  const [assessment] = useState(() => readSelectedAssessment())
  const [selectedStudent, setSelectedStudent] = useState(() => readSelectedStudent())
  const [studentSessions, setStudentSessions] = useState(() => readStorageObject(STUDENT_EXAM_SESSION_KEY))
  const [submissionStatuses, setSubmissionStatuses] = useState(() => readStorageObject(STUDENT_EXAM_SUBMISSION_STATUS_KEY))
  const [manualAttendance, setManualAttendance] = useState(() => readStorageObject(getManualAttendanceStorageKey(readSelectedAssessment())))
  const [studentEvaluationStatuses, setStudentEvaluationStatuses] = useState(() => readStorageObject(getStudentEvaluationStatusStorageKey(readSelectedAssessment())))
  const [studentSearch, setStudentSearch] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isEvaluationFilterOpen, setIsEvaluationFilterOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'studentId', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [studentDetailSearch, setStudentDetailSearch] = useState('')
  const [expandedMcqQuestions, setExpandedMcqQuestions] = useState({})
  const [expandedDescriptiveAnswerKeys, setExpandedDescriptiveAnswerKeys] = useState({})
  const [collapsedQuestionSections, setCollapsedQuestionSections] = useState({})
  const [expandedTagPanels, setExpandedTagPanels] = useState({})
  const [radarTooltip, setRadarTooltip] = useState(null)
  const [functionTooltip, setFunctionTooltip] = useState(null)
  const [skillTooltip, setSkillTooltip] = useState(null)
  const [masteryTooltip, setMasteryTooltip] = useState(null)
  const [thinkingTooltip, setThinkingTooltip] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
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
  const resultTagAnalytics = useMemo(() => ({
    questionCategory: buildTagAnalyticsSeries(assessmentQuestions, RESULT_TAG_ANALYTICS.questionCategory),
    thinkingLevel: buildTagAnalyticsSeries(assessmentQuestions, RESULT_TAG_ANALYTICS.thinkingLevel),
    cognitiveLevel: buildTagAnalyticsSeries(assessmentQuestions, RESULT_TAG_ANALYTICS.cognitiveLevel),
    cognitiveFunction: buildTagAnalyticsSeries(assessmentQuestions, RESULT_TAG_ANALYTICS.cognitiveFunction),
    skillFocus: buildTagAnalyticsSeries(assessmentQuestions, RESULT_TAG_ANALYTICS.skillFocus),
  }), [assessmentQuestions])
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
  const attainmentThreshold = getAssessmentAttainmentThreshold(assessment)
  const mcqScoringItems = mcqQuestions.map((question, index) => ({
    key: getQuestionKey(question, `mcq-${index + 1}`),
    maxMarks: getQuestionMarksTotal(question) || 1,
  }))
  const descriptiveScoringItems = descriptiveQuestions.flatMap(getDescriptiveScoringItems)
  const getScoringSummary = (items, evaluationState = {}) => items.reduce((summary, item) => {
    const result = evaluationState[item.key] || {}
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
  const normalizedRows = useMemo(() => evaluationRows.map((row) => {
    const isAbsent = String(row.attendance).toUpperCase() === 'A'
    const savedEvaluation = studentEvaluationStatuses[row.id] || {}
    const savedStatus = savedEvaluation.status
    const evalStatus = isAbsent ? 'Absent' : (savedStatus === 'Completed' ? 'Completed' : 'Yet to Start')
    const savedQuestionState = readStorageObject(getStudentQuestionEvaluationStorageKey(assessment, row))
    const rowMcqSummary = getScoringSummary(mcqScoringItems, savedQuestionState)
    const rowDescriptiveSummary = getScoringSummary(descriptiveScoringItems, savedQuestionState)
    const rowSummary = {
      attempted: rowMcqSummary.attempted + rowDescriptiveSummary.attempted,
      total: rowMcqSummary.total + rowDescriptiveSummary.total,
      maxMarks: rowMcqSummary.maxMarks + rowDescriptiveSummary.maxMarks,
      obtainedMarks: rowMcqSummary.obtainedMarks + rowDescriptiveSummary.obtainedMarks,
    }
    const rowPercentage = rowSummary.maxMarks
      ? Math.round((rowSummary.obtainedMarks / rowSummary.maxMarks) * 100)
      : 0
    const shouldFillScores = !isAbsent && evalStatus === 'Completed'

    return {
      ...row,
      isAbsent,
      evalStatus,
      markedEvaluated: Boolean(savedEvaluation.markedEvaluated),
      mcq: shouldFillScores && shouldShowMcqObtained ? formatTwoDigit(rowMcqSummary.obtainedMarks) : '-',
      descriptive: shouldFillScores && shouldShowDescriptiveObtained ? formatTwoDigit(rowDescriptiveSummary.obtainedMarks) : '-',
      attemptedQuestions: shouldFillScores ? `${formatTwoDigit(rowSummary.attempted)} / ${formatTwoDigit(rowSummary.total)}` : '-',
      maxMark: formatTwoDigit(maxMark),
      obtainedMarks: shouldFillScores ? formatTwoDigit(rowSummary.obtainedMarks) : '-',
      percentage: shouldFillScores ? `${formatTwoDigit(rowPercentage)}%` : '-',
      resultOutcome: shouldFillScores ? getAttainmentResult(rowPercentage, attainmentThreshold) : null,
      scoringSummary: rowSummary,
    }
  }), [assessment, attainmentThreshold, descriptiveScoringItems, evaluationRows, getScoringSummary, maxMark, mcqScoringItems, shouldShowDescriptiveObtained, shouldShowMcqObtained, studentEvaluationStatuses])
  const absentCount = normalizedRows.filter((row) => row.isAbsent).length
  const pendingCount = normalizedRows.filter((row) => !row.isAbsent && row.evalStatus !== 'Completed').length
  const completedScoreRows = normalizedRows.filter((row) => !row.isAbsent && row.evalStatus === 'Completed')
  const completedObtainedMarks = completedScoreRows.reduce((total, row) => total + (row.scoringSummary?.obtainedMarks || 0), 0)
  const completedMaxMarks = completedScoreRows.reduce((total, row) => total + (row.scoringSummary?.maxMarks || 0), 0)
  const overallPercentage = completedMaxMarks
    ? Math.round((completedObtainedMarks / completedMaxMarks) * 100)
    : 0
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
      value: `${formatTwoDigit(overallPercentage)}%`,
      icon: Percent,
      tone: 'percentage',
    },
  ]
  const evaluationFilterCount = (attendanceFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)
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

  const publishEvaluationAssessment = () => {
    onAlert?.({
      tone: 'success',
      message: 'Assessment published successfully.',
    })
  }

  const downloadEvaluationExcel = () => {
    const headers = [
      'Student ID',
      'Attendance',
      'Student Name',
      'Evaluation Status',
      'MCQ',
      'Descriptive',
      'Attempted Questions',
      'Max Mark',
      'Obtained Marks',
      'Percentage',
      'Result',
    ]
    const escapeCell = (value) => `"${String(value ?? '-').replace(/"/g, '""')}"`
    const rows = sortedRows.map((row) => [
      row.id,
      row.attendance,
      row.name,
      row.evalStatus,
      row.mcq,
      row.descriptive,
      row.attemptedQuestions,
      row.maxMark,
      row.obtainedMarks,
      row.percentage,
      row.resultOutcome?.resultLabel || '-',
    ])
    const csvContent = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const assessmentName = String(assessment?.name || assessment?.title || 'assessment-evaluation')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'assessment-evaluation'
    link.href = url
    link.download = `${assessmentName}-evaluation.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const openEvaluationActionConfirm = (type, row) => {
    if (row.isAbsent) return
    setConfirmAction({ type, row })
  }

  const closeEvaluationActionConfirm = () => {
    setConfirmAction(null)
  }

  const resetStudentEvaluation = (row) => {
    window.localStorage.removeItem(getStudentQuestionEvaluationStorageKey(assessment, row))
    setStudentEvaluationStatuses((current) => {
      const nextStatuses = {
        ...current,
        [row.id]: {
          ...(current[row.id] || {}),
          status: 'Yet to Start',
          markedEvaluated: false,
          updatedAt: new Date().toISOString(),
        },
      }
      writeStorageObject(getStudentEvaluationStatusStorageKey(assessment), nextStatuses)
      return nextStatuses
    })

    if (selectedStudent?.id === row.id) {
      setQuestionEvaluationState({})
      const nextStudent = { ...selectedStudent, evaluationStatus: 'Yet to Start' }
      window.sessionStorage.setItem(ASSESSMENT_EVALUATION_STUDENT_KEY, JSON.stringify(nextStudent))
      setSelectedStudent(nextStudent)
    }

    onAlert?.({ tone: 'success', message: 'Evaluation reset successfully.' })
  }

  const confirmEvaluationAction = () => {
    if (!confirmAction?.row) return
    const { type, row } = confirmAction
    closeEvaluationActionConfirm()

    if (type === 'reset') {
      resetStudentEvaluation(row)
      return
    }

    if (type === 'edit') {
      openStudentEvaluation(row)
    }
  }

  const openStudentEvaluation = (row) => {
    if (row.isAbsent) {
      onAlert?.({ tone: 'warning', message: 'Absent student cannot be evaluated.' })
      return
    }
    const nextStudent = {
      ...row,
      evaluationStatus: row.evalStatus === 'Completed' ? 'Completed' : 'Not Completed',
      attendanceStatus: row.attendance === 'P' ? 'Present' : 'Absent',
    }
    window.sessionStorage.setItem(ASSESSMENT_EVALUATION_STUDENT_KEY, JSON.stringify(nextStudent))
    setSelectedStudent(nextStudent)
    onNavigate?.(APP_PAGES.ASSESSMENT_STUDENT_EVALUATION)
  }

  const openStudentResult = (row) => {
    if (row.isAbsent) {
      onAlert?.({ tone: 'warning', message: 'Absent student result is not available.' })
      return
    }
    if (row.evalStatus !== 'Completed') {
      onAlert?.({ tone: 'warning', message: 'Result is available after evaluation is completed.' })
      return
    }
    const nextStudent = {
      ...row,
      evaluationStatus: 'Completed',
      attendanceStatus: row.attendance === 'P' ? 'Present' : 'Absent',
    }
    window.sessionStorage.setItem(ASSESSMENT_EVALUATION_STUDENT_KEY, JSON.stringify(nextStudent))
    setSelectedStudent(nextStudent)
    onNavigate?.(APP_PAGES.ASSESSMENT_STUDENT_RESULT)
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
      String(row.id).toLowerCase().includes(query)
      || String(row.name).toLowerCase().includes(query)
    ))
    if (matchedStudent?.isAbsent) {
      onAlert?.({ tone: 'warning', message: 'Absent student cannot be evaluated.' })
      return
    }
    if (matchedStudent) openStudentEvaluation(matchedStudent)
  }

  const downloadStudentResultPdf = () => {
    window.print()
  }

  const markSelectedStudentEvaluated = () => {
    if (!selectedStudent) return
    if (!canMarkSelectedStudentEvaluated) {
      onAlert?.({
        tone: 'warning',
        message: 'Complete the student evaluation before marking it as evaluated.',
      })
      return
    }
    if (isSelectedStudentMarkedEvaluated) {
      onAlert?.({
        tone: 'success',
        message: `Marks already evaluated for ${selectedStudent.name} / ${selectedStudent.id}.`,
      })
      return
    }
    const nextStatuses = {
      ...studentEvaluationStatuses,
      [selectedStudent.id]: {
        ...(studentEvaluationStatuses[selectedStudent.id] || {}),
        status: 'Completed',
        markedEvaluated: true,
        markedEvaluatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
    writeStorageObject(getStudentEvaluationStatusStorageKey(assessment), nextStatuses)
    setStudentEvaluationStatuses(nextStatuses)

    const nextStudent = { ...selectedStudent, evaluationStatus: 'Completed' }
    window.sessionStorage.setItem(ASSESSMENT_EVALUATION_STUDENT_KEY, JSON.stringify(nextStudent))
    setSelectedStudent(nextStudent)
    onAlert?.({
      tone: 'success',
      message: `Marks evaluated for ${selectedStudent.name} / ${selectedStudent.id}.`,
    })
  }

  const moveToEvaluationStudent = (row) => {
    if (!row) return
    openStudentEvaluation(row)
  }

  const continueToNextEvaluationStudent = () => {
    if (!isSelectedStudentMarkedEvaluated) {
      onAlert?.({
        tone: 'warning',
        message: 'Please mark this student as evaluated before moving to the next student.',
      })
      return
    }
    if (!nextEvaluationStudent) {
      onAlert?.({ tone: 'success', message: 'All student evaluations completed.' })
      backToStudentList()
      return
    }
    moveToEvaluationStudent(nextEvaluationStudent)
  }

  const handleEvaluationFooterAction = () => {
    if (isSelectedStudentMarkedEvaluated) {
      continueToNextEvaluationStudent()
      return
    }
    markSelectedStudentEvaluated()
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

  const mcqScoringSummary = getScoringSummary(mcqScoringItems, questionEvaluationState)
  const descriptiveScoringSummary = getScoringSummary(descriptiveScoringItems, questionEvaluationState)
  const studentScoringSummary = {
    total: mcqScoringSummary.total + descriptiveScoringSummary.total,
    attempted: mcqScoringSummary.attempted + descriptiveScoringSummary.attempted,
    maxMarks: mcqScoringSummary.maxMarks + descriptiveScoringSummary.maxMarks,
    obtainedMarks: mcqScoringSummary.obtainedMarks + descriptiveScoringSummary.obtainedMarks,
  }
  const studentPercentage = studentScoringSummary.maxMarks
    ? Math.round((studentScoringSummary.obtainedMarks / studentScoringSummary.maxMarks) * 100)
    : 0
  const studentResultOutcome = selectedStudent
    ? getAttainmentResult(studentPercentage, attainmentThreshold)
    : null

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

    if (numericValue === 0) {
      setQuestionResult(questionKey, {
        status: 'invalid',
        marks: value,
        error: 'Marks must be greater than 0.',
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

  const renderQuestionBadges = (maxMarks, question, fallbackQuestion = {}, tagKey = getQuestionKey(question, 'question-tags'), showTags = true, showMark = true) => {
    const tagNode = showTags ? renderQuestionTagInfo(question, fallbackQuestion, tagKey) : null
    const markNode = showMark ? <span className="assessment-question-badge is-mark">Max Mark : {maxMarks || 0}</span> : null
    if (!tagNode && !markNode) return null

    return (
      <div className="assessment-question-badges">
        {tagNode}
        {markNode}
      </div>
    )
  }

  const renderQuestionEndBadges = (maxMarks, question, fallbackQuestion, tagKey, resultMeta, showTags = true, showMark = true) => {
    const resultNode = isStudentResultView ? renderQuestionResultBadges(resultMeta) : null
    const tagNode = showTags ? renderQuestionTagInfo(question, fallbackQuestion, tagKey) : null
    const markNode = showMark ? <span className="assessment-question-badge is-mark">Max Mark : {maxMarks || 0}</span> : null
    if (!resultNode && !tagNode && !markNode) return null

    return (
      <div className="assessment-question-badges">
        {resultNode}
        {tagNode}
        {markNode}
      </div>
    )
  }

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
          aria-label={`${isExpanded ? 'Hide' : 'Show'} answer key`}
          title={isExpanded ? 'Hide answer key' : 'Show answer key'}
        >
          {isExpanded ? <ChevronUp size={13} strokeWidth={2.4} /> : <ChevronDown size={13} strokeWidth={2.4} />}
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
      className={`assessment-mcq-toggle ${isExpanded ? 'is-open' : ''}`}
      onClick={() => toggleMcqDetails(questionKey)}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? 'Hide answer key and options' : 'View answer key and options'}
      title={isExpanded ? 'Hide answer key and options' : 'View answer key and options'}
    >
      {isExpanded ? <ChevronUp size={13} strokeWidth={2.4} /> : <ChevronDown size={13} strokeWidth={2.4} />}
    </button>
  )

  const getQuestionThresholdPercent = (question = {}) => {
    const setup = assessment?.setup || assessment || {}
    const thinkingLevel = getTagValues(question?.thinkingLevel).join(' ').toLowerCase()
    const thresholdValue = thinkingLevel.includes('hot')
      ? setup.hotThreshold
      : thinkingLevel.includes('lot')
        ? setup.lotThreshold
        : setup.questionThreshold ?? setup.passThreshold ?? setup.threshold
    const numericThreshold = Number(thresholdValue)
    return Number.isFinite(numericThreshold) && numericThreshold >= 0 ? numericThreshold : 50
  }

  const getMcqResultMeta = (question, questionKey, index, maxMarks) => {
    const result = questionEvaluationState[questionKey] || {}
    const attempt = readStoredAttempt(assessment, selectedStudent)
    const storedStudentAnswer = attempt?.answers?.[getOnlineMcqQuestionKey(question, index)]
    const selectedOptionIndex = Number.isFinite(Number(storedStudentAnswer)) ? Number(storedStudentAnswer) : null
    const correctIndexes = getCorrectOptionIndexes(question)
    const isCorrect = result.status === 'correct'
      || (result.status !== 'wrong' && result.status !== 'not-attempted' && Number.isInteger(selectedOptionIndex) && correctIndexes.includes(selectedOptionIndex))
    const obtainedMarks = isCorrect ? maxMarks : 0

    return {
      isCorrect,
      thresholdAchieved: isCorrect,
      obtainedMarks,
    }
  }

  const getDescriptiveResultMeta = (question, questionKey, maxMarks) => {
    const result = questionEvaluationState[questionKey] || {}
    const obtainedMarks = result.status === 'not-attempted' ? 0 : parseMarksValue(result.marks)
    const thresholdPercent = getQuestionThresholdPercent(question)
    const thresholdMarks = (parseMarksValue(maxMarks) * thresholdPercent) / 100
    const thresholdAchieved = parseMarksValue(maxMarks) > 0 && obtainedMarks >= thresholdMarks

    return {
      isCorrect: thresholdAchieved,
      thresholdAchieved,
      obtainedMarks,
    }
  }

  const renderQuestionResultBadges = (meta) => {
    if (!isStudentResultView) return null

    return (
      <>
        <span className={`assessment-question-badge ${meta.isCorrect ? 'is-result-correct' : 'is-result-incorrect'}`}>
          {meta.isCorrect ? 'Correct' : 'Incorrect'}
        </span>
        <span className={`assessment-question-badge ${meta.thresholdAchieved ? 'is-threshold-achieved' : 'is-threshold-not-achieved'}`}>
          {meta.thresholdAchieved ? 'Threshold Achieved' : 'Threshold Not Achieved'}
        </span>
      </>
    )
  }

  const renderMcqQuestion = (question, index, displayNumber = index + 1) => {
    const questionKey = getQuestionKey(question, `mcq-${index + 1}`)
    const result = questionEvaluationState[questionKey]?.status || 'pending'
    const maxMarks = getQuestionMarksTotal(question) || 1
    const attempt = readStoredAttempt(assessment, selectedStudent)
    const storedStudentAnswer = attempt?.answers?.[getOnlineMcqQuestionKey(question, index)]
    const studentAnswerIndex = Number.isFinite(Number(storedStudentAnswer)) ? Number(storedStudentAnswer) : null
    const shouldShowOnlineMcqDetails = !isOffline
    const isExpanded = Boolean(expandedMcqQuestions[questionKey])
    const resultMeta = getMcqResultMeta(question, questionKey, index, maxMarks)
    const mcqActionControls = isStudentResultView ? null : (
      <div className="assessment-question-actions is-mcq-header-actions">
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
    )

    return (
      <article key={questionKey} className={`assessment-question-row is-mcq is-${result}`}>
        <div className="assessment-question-main">
          <span className="assessment-question-number">{displayNumber}.</span>
          <div>
            <div className="assessment-question-content-head">
              <p>
                {getQuestionText(question, `MCQ question ${displayNumber}`)}
                {renderQuestionImageBadge(question)}
                {renderMcqDetailsToggle(questionKey, isExpanded)}
              </p>
              <div className="assessment-question-end-actions">
                {renderQuestionEndBadges(maxMarks, question, {}, questionKey, resultMeta)}
                {mcqActionControls}
              </div>
            </div>
            {renderQuestionTagsPanel(question, {}, questionKey)}
            {isExpanded ? (
              <div className="assessment-mcq-details-panel">
                {renderMcqAnswerKeyOnly(question)}
                {renderMcqOptions(question)}
              </div>
            ) : null}
          </div>
        </div>
      </article>
    )
  }

  const renderDescriptiveScoringRow = (question, indexLabel, questionKey, isNestedSubQuestion = false) => {
    const result = questionEvaluationState[questionKey] || {}
    const maxMarks = getQuestionMarksTotal(question) || parseMarksValue(question?.marks)
    const resultMeta = getDescriptiveResultMeta(question, questionKey, maxMarks)
    const hasValidMarks = result.status === 'evaluated' && !result.error && String(result.marks ?? '').trim() !== ''
    const hasInvalidMarks = Boolean(result.error)
    const shouldPromptMarks = !hasValidMarks && !hasInvalidMarks && result.status !== 'not-attempted'
    const descriptiveActionControls = isStudentResultView ? null : (
      <div className="assessment-question-actions is-descriptive-header-actions">
        <label className="assessment-mark-field assessment-compact-mark-control">
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
            placeholder="Obtained Marks"
            aria-label={`Enter obtained mark for question ${indexLabel}`}
            aria-invalid={Boolean(result.error)}
            className={`${result.error ? 'is-invalid' : ''} ${shouldPromptMarks ? 'is-mark-prompt' : ''}`.trim()}
          />
        </label>
        <span className="assessment-max-mark-box">Max Mark : {maxMarks || 0}</span>
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
    )

    return (
      <article key={questionKey} className={`assessment-question-row is-descriptive ${isNestedSubQuestion ? 'is-nested-subquestion' : ''} ${result.status === 'not-attempted' ? 'is-not-attempted' : ''} ${hasValidMarks ? 'is-marked' : ''} ${hasInvalidMarks ? 'is-invalid-mark' : ''}`}>
        <div className="assessment-question-main">
          {isNestedSubQuestion ? <span className="assessment-question-nested-arrow" aria-hidden="true">-&gt;</span> : null}
          <span className="assessment-question-number">{indexLabel}</span>
          <div>
            <div className="assessment-question-content-head">
              <p>
                {getQuestionText(question, `Descriptive question ${indexLabel}`)}
                {renderQuestionImageBadge(question)}
                {renderDescriptiveAnswerKeyToggle(question, questionKey)}
              </p>
              <div className="assessment-question-end-actions">
                {renderQuestionEndBadges(maxMarks, question, {}, questionKey, resultMeta, false, true)}
                {descriptiveActionControls}
              </div>
            </div>
          </div>
        </div>
        {expandedDescriptiveAnswerKeys[questionKey] ? (
          <div className="assessment-question-answer-row">
            {renderDescriptiveAnswerKeyContent(question)}
          </div>
        ) : null}
        {result.error ? (
          <div className="assessment-question-control-row is-descriptive-controls">
            <span className="assessment-mark-inline-error">{result.error}</span>
          </div>
        ) : null}
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
              {renderQuestionBadges(getQuestionMarksTotal(question) || parseMarksValue(question?.marks), question, {}, baseKey, true, false)}
            </div>
          </div>
          {renderQuestionTagsPanel(question, {}, baseKey)}
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
                  true,
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

  const selectedStudentStatusRecord = selectedStudent
    ? studentEvaluationStatuses[selectedStudent.id] || {}
    : {}
  const selectedStudentAutoStatus = selectedStudent && previewSectionGroups.length
    ? previewSectionGroups.every((section) => getSectionEvaluationStatus(section) === 'completed')
      ? 'Completed'
      : 'Not Completed'
    : selectedStudent?.evaluationStatus || 'Not Completed'
  const selectedStudentEvaluationStatus = selectedStudentAutoStatus
  const canMarkSelectedStudentEvaluated = selectedStudentEvaluationStatus === 'Completed'
  const isSelectedStudentMarkedEvaluated = canMarkSelectedStudentEvaluated && Boolean(selectedStudentStatusRecord.markedEvaluated)
  const presentEvaluationRows = useMemo(() => normalizedRows.filter((row) => !row.isAbsent), [normalizedRows])
  const selectedStudentIndex = selectedStudent
    ? presentEvaluationRows.findIndex((row) => row.id === selectedStudent.id)
    : -1
  const nextEvaluationStudent = selectedStudentIndex >= 0 && selectedStudentIndex < presentEvaluationRows.length - 1
    ? presentEvaluationRows[selectedStudentIndex + 1]
    : null
  const completedPresentEvaluations = presentEvaluationRows.filter((row) => row.markedEvaluated).length
  const totalPresentEvaluations = presentEvaluationRows.length

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
    {
      label: 'Percentage',
      value: `${formatTwoDigit(studentPercentage)}%`,
      icon: Percent,
      tone: 'percentage',
    },
    ...(studentResultOutcome ? [{
      label: 'Result',
      value: studentResultOutcome.resultLabel,
      icon: Check,
      tone: studentResultOutcome.achieved ? 'result-achieved' : 'result-not-achieved',
    }] : []),
  ] : []

  const renderSemiDonut = (value, label, color = '#2ecda3', className = '', tooltipItem = null) => {
    const percentage = Math.max(0, Math.min(100, Number(value) || 0))
    return (
      <div
        className={`assessment-result-semi-donut ${className}`}
        onMouseEnter={tooltipItem ? () => setThinkingTooltip(tooltipItem) : undefined}
        onFocus={tooltipItem ? () => setThinkingTooltip(tooltipItem) : undefined}
        tabIndex={tooltipItem ? 0 : undefined}
      >
        <svg viewBox="0 0 220 128" role="img" aria-label={`${label} ${percentage}%`}>
          <path d="M 28 110 A 82 82 0 0 1 192 110" pathLength="100" className="is-track" />
          <path
            d="M 28 110 A 82 82 0 0 1 192 110"
            pathLength="100"
            className="is-value"
            style={{ strokeDasharray: `${percentage} 100`, stroke: color }}
          />
        </svg>
        <span>
          <strong style={{ color }}>{percentage}%</strong>
          <em>{label}</em>
        </span>
      </div>
    )
  }

  const renderMasteryRingChart = (series) => {
    const size = 270
    const center = size / 2
    const radius = 98
    const circumference = 2 * Math.PI * radius
    const gap = 5
    let offset = 0

    return (
      <div className="assessment-result-mastery-ring-card" onMouseLeave={() => setMasteryTooltip(null)}>
        <div className="assessment-result-mastery-ring-wrap">
          <svg className="assessment-result-mastery-ring" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Progress Based Mastery segmented chart">
            <circle cx={center} cy={center} r={radius} className="is-track" />
            {series.map((item, index) => {
              const safeValue = Math.max(0, Math.min(100, item.percentage))
              const segment = Math.max(0, (safeValue / 100) * circumference - gap)
              const currentOffset = offset
              offset += (safeValue / 100) * circumference
              return (
                <circle
                  key={item.label}
                  cx={center}
                  cy={center}
                  r={radius}
                  className="is-segment"
                  style={{
                    stroke: item.color,
                    strokeDasharray: `${segment} ${circumference}`,
                    strokeDashoffset: -currentOffset,
                  }}
                  onMouseEnter={() => setMasteryTooltip({ ...item, x: 50, y: 18 })}
                  onFocus={() => setMasteryTooltip({ ...item, x: 50, y: 18 })}
                  tabIndex={0}
                />
              )
            })}
          </svg>
          <span className="assessment-result-mastery-center">
            <em>Your Mastery</em>
            <strong>{studentPercentage}%</strong>
          </span>
          {masteryTooltip ? (
            <span
              className="assessment-result-mastery-tooltip"
              style={{ left: `${masteryTooltip.x}%`, top: `${masteryTooltip.y}%` }}
              role="tooltip"
            >
              <strong>{masteryTooltip.label}</strong>
              <em>{masteryTooltip.percentage}% ({masteryTooltip.value} question{masteryTooltip.value === 1 ? '' : 's'})</em>
            </span>
          ) : null}
        </div>
        <div className="assessment-result-mastery-legend">
          {series.map((item) => (
            <button
              key={item.label}
              type="button"
              className="assessment-result-mastery-legend-row"
              onMouseEnter={() => setMasteryTooltip({ ...item, x: 50, y: 18 })}
              onFocus={() => setMasteryTooltip({ ...item, x: 50, y: 18 })}
            >
              <i style={{ background: item.color }} aria-hidden="true" />
              <span>{item.label}</span>
              <strong>{item.percentage}%</strong>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderRadarChart = (series) => {
    const viewWidth = 300
    const viewHeight = 260
    const center = 150
    const radius = 82
    const axisCount = series.length || 1
    const points = series.map((item, index) => {
      const angle = (-90 + (360 / axisCount) * index) * (Math.PI / 180)
      const itemRadius = radius * ((Number(item.percentage) || 0) / 100)
      return `${center + Math.cos(angle) * itemRadius},${center + Math.sin(angle) * itemRadius}`
    }).join(' ')

    return (
      <div className="assessment-result-radar-wrap" onMouseLeave={() => setRadarTooltip(null)}>
        <svg className="assessment-result-radar" viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label="Cognitive level radar chart">
          {[0.25, 0.5, 0.75, 1].map((scale) => (
            <polygon
              key={scale}
              points={series.map((_, index) => {
                const angle = (-90 + (360 / axisCount) * index) * (Math.PI / 180)
                return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`
              }).join(' ')}
              className="is-grid"
            />
          ))}
          {series.map((item, index) => {
            const angle = (-90 + (360 / axisCount) * index) * (Math.PI / 180)
            const labelRadius = radius + 28
            const rawLabelX = center + Math.cos(angle) * labelRadius
            const rawLabelY = center + Math.sin(angle) * labelRadius
            const labelX = Math.max(50, Math.min(viewWidth - 50, rawLabelX))
            const labelY = Math.max(26, Math.min(viewHeight - 26, rawLabelY))
            const anchor = 'middle'
            return (
              <g
                key={item.label}
                onMouseEnter={() => setRadarTooltip({
                  label: item.label,
                  percentage: item.percentage,
                  x: (labelX / viewWidth) * 100,
                  y: (labelY / viewHeight) * 100,
                })}
                onFocus={() => setRadarTooltip({
                  label: item.label,
                  percentage: item.percentage,
                  x: (labelX / viewWidth) * 100,
                  y: (labelY / viewHeight) * 100,
                })}
                tabIndex={0}
              >
                <line x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} className="is-axis" />
                <text x={labelX} y={labelY} textAnchor={anchor}>{item.label}</text>
              </g>
            )
          })}
          <polygon points={points} className="is-value" />
        </svg>
        <div className="assessment-result-radar-legend">
          {series.map((item) => (
            <button
              key={item.label}
              type="button"
              className="assessment-result-radar-legend-row"
              onMouseEnter={() => setRadarTooltip({ label: item.label, percentage: item.percentage, x: 50, y: 16 })}
              onFocus={() => setRadarTooltip({ label: item.label, percentage: item.percentage, x: 50, y: 16 })}
            >
              <i style={{ background: item.color }} aria-hidden="true" />
              <span>{item.label}</span>
              <strong>{item.percentage}%</strong>
            </button>
          ))}
        </div>
        {radarTooltip ? (
          <span
            className="assessment-result-radar-tooltip"
            style={{ left: `${radarTooltip.x}%`, top: `${radarTooltip.y}%` }}
            role="tooltip"
          >
            <strong>{radarTooltip.label}</strong>
            <em>{radarTooltip.percentage}%</em>
          </span>
        ) : null}
      </div>
    )
  }

  const renderFunctionRadialChart = (series) => {
    const size = 260
    const center = size / 2
    const ringGap = 17
    const outerRadius = 104
    const startOffset = 25

    return (
      <div className="assessment-result-function-radial" onMouseLeave={() => setFunctionTooltip(null)}>
        <svg className="assessment-result-function-rings" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Cognitive function radial percentage chart">
          {series.map((item, index) => {
            const radius = outerRadius - (index * ringGap)
            const circumference = 2 * Math.PI * radius
            const dash = (Math.max(0, Math.min(100, item.percentage)) / 100) * circumference
            const shortLabel = String.fromCharCode(65 + index)
            return (
              <g
                key={item.label}
                transform={`rotate(-90 ${center} ${center})`}
                onMouseEnter={() => setFunctionTooltip({ ...item, shortLabel, x: 54, y: 18 })}
                onFocus={() => setFunctionTooltip({ ...item, shortLabel, x: 54, y: 18 })}
                tabIndex={0}
              >
                <circle cx={center} cy={center} r={radius} className="is-track" />
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  className="is-value"
                  style={{
                    stroke: item.color,
                    strokeDasharray: `${dash} ${circumference}`,
                    strokeDashoffset: startOffset,
                  }}
                />
              </g>
            )
          })}
        </svg>
        <div className="assessment-result-function-legend">
          {series.map((item, index) => {
            const shortLabel = String.fromCharCode(65 + index)
            return (
              <button
                key={item.label}
                type="button"
                onMouseEnter={() => setFunctionTooltip({ ...item, shortLabel, x: 50, y: 52 })}
                onFocus={() => setFunctionTooltip({ ...item, shortLabel, x: 50, y: 52 })}
                className="assessment-result-function-legend-item"
              >
                <i style={{ background: item.color }} aria-hidden="true" />
                <span>{item.label}</span>
                <strong>{item.percentage}%</strong>
              </button>
            )
          })}
        </div>
        {functionTooltip ? (
          <span
            className="assessment-result-function-tooltip"
            style={{ left: `${functionTooltip.x}%`, top: `${functionTooltip.y}%` }}
            role="tooltip"
          >
            <strong>{functionTooltip.shortLabel}. {functionTooltip.label}</strong>
            <em>{functionTooltip.percentage}% ({functionTooltip.value} question{functionTooltip.value === 1 ? '' : 's'})</em>
          </span>
        ) : null}
      </div>
    )
  }

  const renderSkillBars = (series) => (
    <div className="assessment-result-skill-bars" onMouseLeave={() => setSkillTooltip(null)}>
      {series.map((item, index) => {
        const rowTop = 7 + (index * 7.15)
        return (
          <button
            key={item.label}
            type="button"
            className="assessment-result-skill-bar-row"
            onMouseEnter={() => setSkillTooltip({ ...item, x: 52, y: Math.min(86, rowTop) })}
            onFocus={() => setSkillTooltip({ ...item, x: 52, y: Math.min(86, rowTop) })}
          >
            <em>{item.label}</em>
            <i>
              <b style={{ width: `${item.percentage}%`, background: item.color || RESULT_CHART_COLORS[index % RESULT_CHART_COLORS.length] }} />
            </i>
            <strong>{item.percentage}%</strong>
          </button>
        )
      })}
      {skillTooltip ? (
        <span
          className="assessment-result-skill-tooltip"
          style={{ left: `${skillTooltip.x}%`, top: `${skillTooltip.y}%` }}
          role="tooltip"
        >
          <strong>{skillTooltip.label}</strong>
          <em>{skillTooltip.percentage}% ({skillTooltip.value} question{skillTooltip.value === 1 ? '' : 's'})</em>
        </span>
      ) : null}
    </div>
  )

  const renderQuestionTagPerformance = () => {
    if (!isStudentResultView) return null
    const categorySeries = resultTagAnalytics.questionCategory
    const thinkingSeries = resultTagAnalytics.thinkingLevel

    return (
      <section className="assessment-result-tag-analytics" aria-label="Question tags performance">
        <div className="assessment-result-chart-grid">
          <article className="assessment-result-chart-card is-category is-mastery">
            <h4><Award size={14} strokeWidth={2.4} />{RESULT_TAG_ANALYTICS.questionCategory.heading}</h4>
            {renderMasteryRingChart(categorySeries)}
          </article>

          <article className="assessment-result-chart-card is-cognitive">
            <h4><ClipboardList size={14} strokeWidth={2.4} />{RESULT_TAG_ANALYTICS.cognitiveLevel.heading}</h4>
            {renderRadarChart(resultTagAnalytics.cognitiveLevel)}
          </article>

          <article className="assessment-result-chart-card is-thinking">
            <h4><Clock3 size={14} strokeWidth={2.4} />{RESULT_TAG_ANALYTICS.thinkingLevel.title}</h4>
            <div className="assessment-result-thinking-grid" onMouseLeave={() => setThinkingTooltip(null)}>
              {thinkingSeries.map((item, index) => (
                <div key={item.label} className="assessment-result-thinking-card">
                  {renderSemiDonut(item.percentage, item.label, item.color, '', { ...item, x: 50, y: index === 0 ? 24 : 63 })}
                </div>
              ))}
              {thinkingTooltip ? (
                <span
                  className="assessment-result-thinking-tooltip"
                  style={{ left: `${thinkingTooltip.x}%`, top: `${thinkingTooltip.y}%` }}
                  role="tooltip"
                >
                  <strong>{thinkingTooltip.label}</strong>
                  <em>{thinkingTooltip.percentage}% ({thinkingTooltip.value} question{thinkingTooltip.value === 1 ? '' : 's'})</em>
                </span>
              ) : null}
            </div>
          </article>

          <article className="assessment-result-chart-card is-function">
            <h4><Percent size={14} strokeWidth={2.4} />{RESULT_TAG_ANALYTICS.cognitiveFunction.title}</h4>
            {renderFunctionRadialChart(resultTagAnalytics.cognitiveFunction)}
          </article>

          <article className="assessment-result-chart-card is-full is-skill">
            <h4><FileText size={14} strokeWidth={2.4} />{RESULT_TAG_ANALYTICS.skillFocus.heading}</h4>
            {renderSkillBars(resultTagAnalytics.skillFocus)}
          </article>
        </div>
      </section>
    )
  }

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
    if (!isEvaluationFilterOpen) return undefined

    const closeFilters = (event) => {
      if (!event.target?.closest?.('.assessment-evaluation-filter-menu-wrap')) {
        setIsEvaluationFilterOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeFilters)
    return () => document.removeEventListener('pointerdown', closeFilters)
  }, [isEvaluationFilterOpen])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  useEffect(() => {
    setQuestionEvaluationState(readStorageObject(getStudentQuestionEvaluationStorageKey(assessment, selectedStudent)))
  }, [assessment, selectedStudent])

  useEffect(() => {
    if (isStudentResultView || !isStudentEvaluationView || selectedStudent || !presentEvaluationRows.length) return
    openStudentEvaluation(presentEvaluationRows[0])
  }, [isStudentEvaluationView, isStudentResultView, presentEvaluationRows, selectedStudent])

  useEffect(() => {
    if (!selectedStudent) return
    const matchedRow = normalizedRows.find((row) => row.id === selectedStudent.id)
    const isAbsentSelected = matchedRow?.isAbsent || selectedStudent.attendance === 'A' || selectedStudent.attendanceStatus === 'Absent'
    if (!isAbsentSelected) return

    window.sessionStorage.removeItem(ASSESSMENT_EVALUATION_STUDENT_KEY)
    setSelectedStudent(null)
    onAlert?.({ tone: 'warning', message: 'Absent student cannot be evaluated.' })
    onNavigate?.(APP_PAGES.ASSESSMENT_EVALUATION)
  }, [normalizedRows, onAlert, onNavigate, selectedStudent])

  useEffect(() => {
    if (isStudentResultView) return
    if (!selectedStudent) return
    const studentId = selectedStudent.id
    const nextStatus = selectedStudentEvaluationStatus

    setStudentEvaluationStatuses((current) => {
      const currentRecord = current[studentId] || {}
      const nextMarkedEvaluated = nextStatus === 'Completed' ? Boolean(currentRecord.markedEvaluated) : false
      if (currentRecord.status === nextStatus && Boolean(currentRecord.markedEvaluated) === nextMarkedEvaluated) return current
      const nextStatuses = {
        ...current,
        [studentId]: {
          ...currentRecord,
          status: nextStatus,
          markedEvaluated: nextMarkedEvaluated,
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
  }, [assessment, isStudentResultView, selectedStudent, selectedStudentEvaluationStatus])

  useEffect(() => {
    if (isStudentResultView) return
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
  }, [assessment, selectedStudent, isOffline, assessmentQuestions, questionEvaluationState, isStudentResultView])

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
        <section className={`assessment-student-evaluation-card ${isStudentResultView ? 'is-result-view' : ''}`} aria-label={isStudentResultView ? 'Selected student result' : 'Selected student evaluation'}>
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
            {isStudentResultView ? (
              <button type="button" className="assessment-student-download-result-btn" onClick={downloadStudentResultPdf}>
                <Download size={16} strokeWidth={2.4} />
                Download Result PDF
              </button>
            ) : (
              <label className="assessment-student-search">
                <Search size={15} strokeWidth={2.3} aria-hidden="true" />
                <input
                  type="search"
                  value={studentDetailSearch}
                  onChange={(event) => handleStudentDetailSearch(event.target.value)}
                  placeholder="Search by Student ID or Name"
                />
              </label>
            )}
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

          {renderQuestionTagPerformance()}

          <section className="assessment-student-question-area" aria-label={isStudentResultView ? 'Question result workspace' : 'Question evaluation workspace'}>
            {previewSectionGroups.length ? (
              previewSectionGroups.map((section, sectionIndex) => {
                const sectionLabel = ['I', 'II', 'III', 'IV', 'V', 'VI'][sectionIndex] || `${sectionIndex + 1}`
                const isDescriptiveSection = section.questions.some((question) => isDescriptiveQuestionType(question?.type))
                const sectionStatus = getSectionEvaluationStatus(section)
                const isSectionCollapsed = collapsedQuestionSections[section.key] ?? (isStudentResultView ? false : true)

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
                        {isStudentResultView ? null : renderSectionStatusBadge(sectionStatus)}
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
          {isStudentResultView ? null : (
            <nav className="assessment-student-floating-controls" aria-label="Student evaluation navigation">
              <span className="assessment-student-completed-badge">
                No. of Evaluation Completed : {formatTwoDigit(completedPresentEvaluations)} out of {formatTwoDigit(totalPresentEvaluations)}
              </span>
              <span className="assessment-student-floating-actions">
                <button
                  type="button"
                  className={`assessment-student-floating-btn is-mark-evaluated ${isSelectedStudentMarkedEvaluated ? 'is-evaluated' : canMarkSelectedStudentEvaluated ? 'is-ready' : ''}`}
                  onClick={handleEvaluationFooterAction}
                  disabled={!canMarkSelectedStudentEvaluated && !isSelectedStudentMarkedEvaluated}
                >
                  {isSelectedStudentMarkedEvaluated ? <ChevronRight size={16} strokeWidth={2.5} /> : <Check size={16} strokeWidth={2.5} />}
                  {isSelectedStudentMarkedEvaluated ? 'Continue to Next' : 'Mark as Evaluated'}
                </button>
              </span>
            </nav>
          )}
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
          <div className="assessment-evaluation-toolbar-actions">
            <button type="button" className="assessment-evaluation-publish-btn" onClick={publishEvaluationAssessment}>
              Publish Assessment
            </button>
            <button type="button" className="assessment-evaluation-download-btn" onClick={downloadEvaluationExcel}>
              <Download size={15} strokeWidth={2.4} />
              Download Excel
            </button>
            <label className="assessment-evaluation-search-field">
              <Search size={15} strokeWidth={2.4} aria-hidden="true" />
              <input
                type="search"
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Search student..."
              />
            </label>
            <div className="assessment-evaluation-filter-menu-wrap">
              <button
                type="button"
                className={`assessment-evaluation-filter-icon-btn ${evaluationFilterCount ? 'has-active-filters' : ''}`}
                onClick={() => setIsEvaluationFilterOpen((current) => !current)}
                aria-expanded={isEvaluationFilterOpen}
                aria-label="Open evaluation filters"
                title="Filters"
              >
                <Filter size={16} strokeWidth={2.4} />
                {evaluationFilterCount ? <span>{evaluationFilterCount}</span> : null}
              </button>
              {isEvaluationFilterOpen ? (
                <div className="assessment-evaluation-filter-menu" role="dialog" aria-label="Evaluation filters">
                  <label>
                    <span>Attendance</span>
                    <select value={attendanceFilter} onChange={(event) => setAttendanceFilter(event.target.value)}>
                      <option value="all">All</option>
                      <option value="P">Present</option>
                      <option value="A">Absent</option>
                    </select>
                  </label>
                  <label>
                    <span>Status</span>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                      <option value="all">All</option>
                      <option value="Yet to Start">Yet to Start</option>
                      <option value="Completed">Completed</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          </div>
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
                <th>Result</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => {
                const { isAbsent, evalStatus } = row
                const canUseCompletedActions = !isAbsent && evalStatus === 'Completed'
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
                            disabled={evalStatus === 'Completed'}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            className={row.attendance === 'A' ? 'is-absent is-active' : 'is-absent'}
                            onClick={() => updateManualAttendance(row.id, 'A')}
                            aria-label={`Mark ${row.name} absent`}
                            disabled={evalStatus === 'Completed'}
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
                      {row.resultOutcome ? (
                        <span className={`assessment-evaluation-result-status ${row.resultOutcome.achieved ? 'is-achieved' : 'is-not-achieved'}`}>
                          {row.resultOutcome.resultLabel}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <div className="assessment-evaluation-row-actions">
                        <button
                          type="button"
                          className="is-icon is-reset"
                          onClick={() => openEvaluationActionConfirm('reset', row)}
                          aria-label={`Reset evaluation for ${row.name}`}
                          title={canUseCompletedActions ? 'Reset Evaluation' : 'Available after completion'}
                          data-tooltip={canUseCompletedActions ? 'Reset Evaluation' : undefined}
                          disabled={!canUseCompletedActions}
                        >
                          <RotateCcw size={14} strokeWidth={2.4} />
                        </button>
                        <button
                          type="button"
                          className="is-icon is-edit"
                          onClick={() => openEvaluationActionConfirm('edit', row)}
                          aria-label={`Edit evaluation for ${row.name}`}
                          title={canUseCompletedActions ? 'Edit Evaluation' : 'Available after completion'}
                          data-tooltip={canUseCompletedActions ? 'Edit Evaluation' : undefined}
                          disabled={!canUseCompletedActions}
                        >
                          <Pencil size={14} strokeWidth={2.4} />
                        </button>
                        <button
                          type="button"
                          className={evalStatus === 'Completed' ? 'is-view-result' : 'is-primary'}
                          onClick={() => (evalStatus === 'Completed' ? openStudentResult(row) : openStudentEvaluation(row))}
                          disabled={isAbsent}
                        >
                          {evalStatus === 'Completed' ? 'View Result' : 'Start Evaluation'}
                        </button>
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
      {confirmAction ? (
        <div className="assessment-evaluation-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="assessment-evaluation-confirm-title">
          <article className="assessment-evaluation-confirm-modal">
            <span className={`assessment-evaluation-confirm-icon is-${confirmAction.type}`} aria-hidden="true">
              {confirmAction.type === 'reset' ? <RotateCcw size={24} strokeWidth={2.4} /> : <Pencil size={24} strokeWidth={2.4} />}
            </span>
            <h2 id="assessment-evaluation-confirm-title">
              {confirmAction.type === 'reset' ? 'Are you sure reset this evaluation?' : 'Are you sure edit this evaluation?'}
            </h2>
            <p>{confirmAction.row.name} / {confirmAction.row.id}</p>
            <div className="assessment-evaluation-confirm-actions">
              <button type="button" className="is-secondary" onClick={closeEvaluationActionConfirm}>No</button>
              <button type="button" className="is-primary" onClick={confirmEvaluationAction}>Yes</button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}
