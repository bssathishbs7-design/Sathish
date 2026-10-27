import { deleteBlueprintWorkflow } from '../services/blueprintApproval'
import { parseAssessmentDate, applyAssessmentTime, formatAssessmentRemainingTime, getPublishedAssessmentScheduleStatus, hasPublishedResults, splitPublishedAssessmentRows, canStartLiveEvaluation } from '../services/assessmentTrackerLifecycle'
import { createQuestionPaperExporter } from '../utils/assessmentQuestionPaper'
import FloatingTooltip from '../components/FloatingTooltip'
import AssessmentStartCountdown from '../components/AssessmentStartCountdown'
import AssessmentPublicationBadge from '../components/AssessmentPublicationBadge'
import { getAssessmentPublicationMethod } from '../services/assessmentPublicationMethod'
import { isAssessmentScheduleExpired, isPendingAssessmentExpired } from '../services/assessmentScheduleExpiry'
import AssessmentExamType from '../components/AssessmentExamType'
import AssessmentTrackerCard from '../components/AssessmentTrackerCard'
import AssessmentViewMenu from '../components/AssessmentViewMenu'
import { readAssessmentView } from '../config/assessmentViews'
import AssessmentCardCollection from '../components/AssessmentCardCollection'
import CopyIdBadge from '../components/CopyIdBadge'
import { readBlueprintWorkflow } from '../services/blueprintApproval'
import AssessmentHistoryDialog from '../components/AssessmentHistoryDialog'
import { assessmentDisplayId } from '../services/assessmentHistory'
import AssessmentCardSettings from '../components/AssessmentCardSettings'
import AssessmentResultStatus from '../components/AssessmentResultStatus'
import { createElement, useEffect, useRef, useState } from 'react'
import { reserveAssessmentIdentity } from '../services/assessmentIdentity'
import { resetAssessmentTrackerOnce } from '../services/assessmentTrackerReset'
import { createPortal } from 'react-dom'
import { ArrowRight, CalendarDays, ChevronDown, BadgeCheck, ChartColumnBig, ClipboardCheck, Clock3, Download, LoaderCircle, EyeOff, FolderPlus, Info, ListFilter, Monitor, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
import { APP_PAGES } from '../config/appPages'
import '../styles/assessment-pages.css'
import './MyAssessmentTheme.css'
import '../styles/my-skills.css'
import './LogbookPage.css'
import '../components/logbook/LogbookDashboard.css'
import './AssessmentCreatePage.css'

const assessmentMetrics = [
  {
    label: 'Draft Assessment',
    count: 0,
    icon: FolderPlus,
    tone: 'draft',
  },
  {
    label: 'Approval Queue',
    count: 0,
    icon: Clock3,
    tone: 'approval-queue',
  },
  {
    label: 'Published Assessment',
    count: 0,
    icon: BadgeCheck,
    tone: 'published',
  },
  {
    label: 'Evaluation',
    count: 0,
    icon: ClipboardCheck,
    tone: 'evaluation',
  },
  {
    label: 'Results',
    count: 0,
    icon: BadgeCheck,
    tone: 'results',
  },
]

const initialForm = {
  collegeName: '',
  logoName: '',
  logoPreview: '',
  assessmentName: '',
  academicYear: '2025 - 2026',
  examCategory: '',
  course: '',
  year: '',
}

const CREATE_ASSESSMENT_SETUP_KEY = 'vx-create-assessment-setup'
const CREATE_ASSESSMENT_INITIAL_TAB_KEY = 'vx-create-assessment-initial-tab'
const ASSESSMENT_CREATE_INITIAL_TAB_KEY = 'vx-assessment-create-initial-tab'
const CREATE_ASSESSMENT_QUESTIONS_KEY = 'vx-create-assessment-questions'
const ASSESSMENT_DRAFTS_STORAGE_KEY = 'vx-assessment-drafts'
const ASSESSMENT_PUBLISHED_STORAGE_KEY = 'vx-assessment-published'
const ONLINE_PRACTICE_EXAM_STORAGE_KEY = 'vx-online-practice-exam-assessment'
const ONLINE_PROCTORED_EXAM_STORAGE_KEY = 'vx-online-proctored-exam-assessment'
const EXAM_CONTROLS_ASSESSMENT_KEY = 'vx-exam-controls-assessment'
const EXAM_CONTROLS_STATE_KEY = 'vx-exam-controls-state'
const ASSESSMENT_EVALUATION_SELECTED_KEY = 'vx-assessment-evaluation-selected'
const ASSESSMENT_OVERALL_ANALYTICS_SOURCE_KEY = 'vx-assessment-overall-analytics-source'
const ASSESSMENT_PUBLISHED_CHANGED_EVENT = 'vx-assessment-published-changed'
const PUBLISHED_ACTION_VERIFICATION_CODE = '1234'
const PUBLISHED_FILTER_DEFAULTS = {
  mode: 'all',
  status: 'all',
  supervision: 'all',
  examType: 'all',
}
const PUBLISHED_FILTER_GROUPS = [
  {
    key: 'mode',
    label: 'Exam Mode',
    options: [
      { value: 'all', label: 'All Modes' },
      { value: 'online', label: 'Online' },
      { value: 'offline', label: 'Offline' },
    ],
  },
  {
    key: 'status',
    label: 'Exam Status',
    options: [
      { value: 'all', label: 'All Status' },
      { value: 'live', label: 'Live' },
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'completed', label: 'Completed' },
    ],
  },
  {
    key: 'supervision',
    label: 'Supervision Type',
    options: [
      { value: 'all', label: 'All Types' },
      { value: 'practice', label: 'Practice Exam' },
      { value: 'proctored', label: 'Proctored Exam' },
    ],
  },
  {
    key: 'examType',
    label: 'Exam Type',
    options: [
      { value: 'all', label: 'All Exam Types' },
      { value: 'mcq', label: 'MCQ' },
      { value: 'descriptive', label: 'Descriptive' },
      { value: 'hybrid', label: 'Hybrid' },
    ],
  },
]

const MOCK_PUBLISHED_ASSESSMENTS = [
  {
    id: 'mock-published-online-mcq',
    assessmentName: 'Anatomy weekly MCQ',
    examCategory: 'Internal Assessment',
    assignTo: 'First Year',
    examMode: 'Online',
    supervisionType: 'Standard Exam',
    examType: 'MCQ',
    startDate: '2026-08-12',
    startTime: '10:00 AM',
    endDate: '2026-08-12',
    totalDuration: '00:45',
    totalMarks: 40,
    questionRows: Array.from({ length: 40 }, (_, index) => ({ id: `anatomy-mcq-${index + 1}`, type: 'MCQ', marks: 1 })),
    publishedAt: '2026-08-10T09:20:00.000Z',
    publishedLog: [
      { facultyId: 'MC2568', facultyName: 'Karthik Subramanian', remarks: 'Published online MCQ assessment', timestamp: '2026-08-10T09:20:00.000Z' },
    ],
  },
  {
    id: 'mock-published-proctored-hybrid',
    assessmentName: 'Final proctored medicine exam',
    examCategory: 'Final Examination',
    assignTo: 'Final Year',
    examMode: 'Online',
    supervisionType: 'Proctored Exams',
    examType: 'Hybrid',
    startDate: '2026-08-15',
    startTime: '09:00 AM',
    endDate: '2026-08-15',
    totalDuration: '03:00',
    totalMarks: 200,
    questionRows: [
      ...Array.from({ length: 80 }, (_, index) => ({ id: `medicine-mcq-${index + 1}`, type: 'MCQ', marks: 1 })),
      ...Array.from({ length: 5 }, (_, index) => ({ id: `medicine-desc-${index + 1}`, type: 'Descriptive Question', marks: 24 })),
    ],
    publishedAt: '2026-08-09T11:10:00.000Z',
    publishedLog: [
      { facultyId: 'MC2568', facultyName: 'Karthik Subramanian', remarks: 'Published proctored hybrid assessment', timestamp: '2026-08-09T11:10:00.000Z' },
    ],
  },
  {
    id: 'mock-published-offline-descriptive',
    assessmentName: 'Clinical skills offline test',
    examCategory: 'Practical Assessment',
    assignTo: 'Third Year',
    examMode: 'Offline',
    supervisionType: 'Offline Exam',
    examType: 'Descriptive',
    startDate: '2026-08-20',
    startTime: '09:30 AM',
    endDate: '2026-08-20',
    totalDuration: '02:00',
    totalMarks: 80,
    questionRows: Array.from({ length: 8 }, (_, index) => ({ id: `clinical-desc-${index + 1}`, type: 'Descriptive Question', marks: 10 })),
    publishedAt: '2026-08-08T08:45:00.000Z',
    publishedLog: [
      { facultyId: 'MC2568', facultyName: 'Karthik Subramanian', remarks: 'Published offline descriptive paper', timestamp: '2026-08-08T08:45:00.000Z' },
    ],
  },
  {
    id: 'mock-published-practice-mcq',
    assessmentName: 'Pharmacology practice quiz',
    examCategory: 'Practice Assessment',
    assignTo: 'Second Year',
    examMode: 'Online',
    supervisionType: 'Practice Exam',
    examType: 'MCQ',
    startDate: '2026-08-11',
    startTime: '12:00 AM',
    endDate: '2027-08-11',
    totalDuration: '00:30',
    totalMarks: 25,
    questionRows: Array.from({ length: 25 }, (_, index) => ({ id: `pharma-practice-${index + 1}`, type: 'MCQ', marks: 1 })),
    publishedAt: '2026-08-07T10:00:00.000Z',
    publishedLog: [
      { facultyId: 'MC2568', facultyName: 'Karthik Subramanian', remarks: 'Published practice MCQ quiz', timestamp: '2026-08-07T10:00:00.000Z' },
    ],
  },
  {
    id: 'mock-evaluation-online-descriptive',
    assessmentName: 'Pathology descriptive assessment',
    examCategory: 'Internal Assessment',
    assignTo: 'Second Year',
    examMode: 'Online',
    supervisionType: 'Standard Exam',
    examType: 'Descriptive',
    startDate: '2026-08-01',
    startTime: '09:00 AM',
    endDate: '2026-08-01',
    totalDuration: '02:00',
    totalMarks: 60,
    evaluationStatus: 'Pending Evaluation',
    questionRows: Array.from({ length: 6 }, (_, index) => ({ id: `pathology-desc-${index + 1}`, type: 'Descriptive Question', marks: 10 })),
    publishedAt: '2026-07-29T09:00:00.000Z',
  },
  {
    id: 'mock-evaluation-proctored-hybrid',
    assessmentName: 'Surgery hybrid midterm',
    examCategory: 'Midterm Examination',
    assignTo: 'Final Year',
    examMode: 'Online',
    supervisionType: 'Proctored Exams',
    examType: 'Hybrid',
    startDate: '2026-08-02',
    startTime: '10:00 AM',
    endDate: '2026-08-02',
    totalDuration: '02:30',
    totalMarks: 120,
    evaluationStatus: 'In Progress',
    questionRows: [
      ...Array.from({ length: 60 }, (_, index) => ({ id: `surgery-mcq-${index + 1}`, type: 'MCQ', marks: 1 })),
      ...Array.from({ length: 3 }, (_, index) => ({ id: `surgery-desc-${index + 1}`, type: 'Descriptive Question', marks: 20 })),
    ],
    publishedAt: '2026-07-30T10:30:00.000Z',
  },
  {
    id: 'mock-evaluation-offline-mcq',
    assessmentName: 'Offline physiology test',
    examCategory: 'Unit Test',
    assignTo: 'First Year',
    examMode: 'Offline',
    supervisionType: 'Offline Exam',
    examType: 'MCQ',
    startDate: '2026-08-03',
    startTime: '11:00 AM',
    endDate: '2026-08-03',
    totalDuration: '01:00',
    totalMarks: 50,
    evaluationStatus: 'Pending Evaluation',
    questionRows: Array.from({ length: 50 }, (_, index) => ({ id: `physiology-mcq-${index + 1}`, type: 'MCQ', marks: 1 })),
    publishedAt: '2026-07-31T11:15:00.000Z',
  },
  {
    id: 'mock-result-online-mcq',
    assessmentName: 'Biochemistry unit test',
    examCategory: 'Unit Test',
    assignTo: 'First Year',
    examMode: 'Online',
    supervisionType: 'Standard Exam',
    examType: 'MCQ',
    startDate: '2026-07-25',
    startTime: '10:00 AM',
    endDate: '2026-07-25',
    totalDuration: '01:00',
    totalMarks: 50,
    evaluationStatus: 'Published',
    resultStatus: 'Published',
    questionRows: Array.from({ length: 50 }, (_, index) => ({ id: `biochem-mcq-${index + 1}`, type: 'MCQ', marks: 1 })),
    publishedAt: '2026-07-26T12:00:00.000Z',
  },
  {
    id: 'mock-result-proctored-hybrid',
    assessmentName: 'General medicine final',
    examCategory: 'Final Examination',
    assignTo: 'Final Year',
    examMode: 'Online',
    supervisionType: 'Proctored Exams',
    examType: 'Hybrid',
    startDate: '2026-07-20',
    startTime: '09:00 AM',
    endDate: '2026-07-20',
    totalDuration: '03:00',
    totalMarks: 200,
    evaluationStatus: 'Published',
    resultStatus: 'Published',
    questionRows: [
      ...Array.from({ length: 80 }, (_, index) => ({ id: `general-medicine-mcq-${index + 1}`, type: 'MCQ', marks: 1 })),
      ...Array.from({ length: 5 }, (_, index) => ({ id: `general-medicine-desc-${index + 1}`, type: 'Descriptive Question', marks: 24 })),
    ],
    publishedAt: '2026-07-22T15:00:00.000Z',
  },
  {
    id: 'mock-result-practice-mcq',
    assessmentName: 'Practice cardiology quiz',
    examCategory: 'Practice Assessment',
    assignTo: 'Final Year',
    examMode: 'Online',
    supervisionType: 'Practice Exam',
    examType: 'MCQ',
    startDate: '2026-07-18',
    startTime: '12:00 AM',
    endDate: '2026-07-31',
    totalDuration: '00:25',
    totalMarks: 25,
    evaluationStatus: 'Published',
    resultStatus: 'Published',
    questionRows: Array.from({ length: 25 }, (_, index) => ({ id: `cardiology-practice-${index + 1}`, type: 'MCQ', marks: 1 })),
    publishedAt: '2026-08-01T09:15:00.000Z',
  },
]

const getMockPublishedAssessments = () => MOCK_PUBLISHED_ASSESSMENTS.map((assessment) => ({
  ...assessment,
  setup: {
    collegeName: 'Medsy Medical College',
    academicYear: '2025 - 2026',
    assessmentName: assessment.assessmentName,
    examCategory: assessment.examCategory,
    year: assessment.assignTo,
  },
}))

const mergeMockPublishedAssessments = (rows = []) => {
  const existingRows = Array.isArray(rows) ? rows : []
  const existingIds = new Set(existingRows.map((assessment) => assessment?.id).filter(Boolean))
  const missingMockRows = getMockPublishedAssessments().filter((assessment) => !existingIds.has(assessment.id))

  return [...missingMockRows, ...existingRows]
}


const isDescriptiveQuestionType = (type) => (
  type === 'Descriptive Question'
  || String(type ?? '').toLowerCase().includes('descriptive')
  || String(type ?? '').includes('SAQs')
  || String(type ?? '').includes('MEQs')
  || String(type ?? '').includes('LAQs')
)

const stripHtml = (value) => String(value ?? '')
  .replace(/<\/?[A-Za-z][^>]*>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .trim()

const formatYearLabel = (value) => {
  const yearMap = {
    'Year 1': 'First Year',
    'Year 2': 'Second Year',
    'Year 3': 'Third Year',
    'Year 4': 'Fourth Year',
  }
  return yearMap[value] || value || '-'
}

const readAssessmentDrafts = () => {
  try {
    resetAssessmentTrackerOnce(window.localStorage)
    const parsed = JSON.parse(window.localStorage.getItem(ASSESSMENT_DRAFTS_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const readPublishedAssessments = () => {
  try {
    const resetComplete = resetAssessmentTrackerOnce(window.localStorage)
    const parsed = JSON.parse(window.localStorage.getItem(ASSESSMENT_PUBLISHED_STORAGE_KEY) || '[]')
    return resetComplete ? (Array.isArray(parsed) ? parsed : []) : mergeMockPublishedAssessments(parsed)
  } catch {
    return []
  }
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

const clearDeletedAssessmentSessionRecords = (deletedAssessment) => {
  if (!deletedAssessment) return

  ;[ONLINE_PRACTICE_EXAM_STORAGE_KEY, ONLINE_PROCTORED_EXAM_STORAGE_KEY].forEach((storageKey) => {
    try {
      const selectedAssessment = JSON.parse(window.sessionStorage.getItem(storageKey) || 'null')
      if (isSameAssessmentRecord(deletedAssessment, selectedAssessment)) {
        window.sessionStorage.removeItem(storageKey)
      }
    } catch {
      // Session cleanup should not block deleting the published assessment.
    }
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

const readDraftQuestions = (draft) => {
  // A saved empty array is intentional, including deletion of the last question.
  if (Array.isArray(draft?.questionRows)) return draft.questionRows
  try {
    const storedRows = JSON.parse(window.localStorage.getItem(getAssessmentQuestionsStorageKey(draft?.setup ?? draft)) || '[]')
    if (Array.isArray(storedRows) && storedRows.length) return storedRows
    return Array.isArray(draft?.questionRows) ? draft.questionRows : []
  } catch {
    return Array.isArray(draft?.questionRows) ? draft.questionRows : []
  }
}

const restoreAssessmentQuestionsForCreate = (setup = {}, questionRows = []) => {
  if (!setup || !Array.isArray(questionRows)) return

  try {
    window.localStorage.setItem(getAssessmentQuestionsStorageKey(setup), JSON.stringify(questionRows))
  } catch {
    // Navigation should still continue if browser storage is full.
  }
}

const getDraftValue = (draft, ...keys) => {
  for (const key of keys) {
    const value = draft?.[key] ?? draft?.setup?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return ''
}

const renderAssessmentAssignment = record => {
  const year = getDraftValue(record, 'assignYear', 'year')
  const group = getDraftValue(record, 'assignGroup', 'sgt')
  return [year, group].filter(value => value && !['Not set', 'Not assigned', '-'].includes(value)).join(' / ') || 'Year not assigned'
}

const renderAssessmentIdentity = (record, title) => {
  const academicYear = getDraftValue(record, 'academicYear') || 'Academic year not set'
  const examCategory = getDraftValue(record, 'examCategory') || 'Category not set'
  return <span className="assessment-draft-identity-row"><strong className="assessment-card-title"><FloatingTooltip className="assessment-card-title-text" content={title}>{title}</FloatingTooltip></strong><span>{examCategory} / {academicYear}</span></span>
}

const renderAssessmentModeBadges = record => {
  const mode = String(getDraftValue(record, 'examDeliveryMode', 'examMode', 'assessmentMode')).toLowerCase()
  const supervision = String(getDraftValue(record, 'supervisionType')).toLowerCase()
  const practice = supervision.includes('practice')
  const SupervisionIcon = practice ? EyeOff : Monitor
  return <>
    {mode === 'online' && (practice || supervision.includes('proctored')) && <span className={`assessment-stage-badge assessment-create-published-supervision ${practice ? 'is-practice' : 'is-proctored'}`}><SupervisionIcon size={13} aria-hidden="true" />{practice ? 'Practice' : 'Proctored'}</span>}
    {['online', 'offline'].includes(mode) && <span className={`assessment-create-published-status is-${mode}`}>{mode === 'online' ? 'Online' : 'Offline'}</span>}
  </>
}

const renderAssessmentSummary = record => <div className="assessment-create-draft-stats" aria-label="Assessment summary"><span><strong>{record.questionCount ?? getPublishedQuestionRows(record).length}</strong><em><ClipboardCheck size={13} aria-hidden="true" /> Questions</em></span><span><strong>{record.totalMarks ?? '-'}</strong><em><ChartColumnBig size={13} aria-hidden="true" /> Total marks</em></span></div>

/** Keep schedule KPIs in the same order on every lifecycle card. */
const renderConfiguredSchedule = (record, scheduleStatus, questions, unpublishedNow, hideSchedule = false) => {
  const savedDraft = Boolean(record?.setup?.sourceDraftId)
  const practice = savedDraft && getDraftValue(record, 'supervisionType') === 'Practice Exam' && getDraftValue(record, 'examDeliveryMode', 'examMode') !== 'Offline'
  const date = practice ? getDraftValue(record, 'practiceStartDate') : getDraftValue(record, 'examDate', 'startDate')
  const time = getDraftValue(record, practice ? 'practiceStartTime' : 'startTime')
  const period = getDraftValue(record, practice ? 'practiceStartPeriod' : 'startPeriod')
  const duration = getDraftValue(record, 'totalDuration', 'duration', getDraftValue(record, 'examDeliveryMode', 'examMode') === 'Offline' ? 'offlineDuration' : 'proctoredTotalDuration')
  const end = getDraftValue(record, practice ? 'practiceEndDate' : 'endDate')
  const live = scheduleStatus?.type === 'live'
  const expired = unpublishedNow && isAssessmentScheduleExpired({date, time, period}, unpublishedNow)
  const fields = [
    ['Exam type', <AssessmentExamType assessment={record} questions={questions} />, ClipboardCheck],
    ['Start date', date ? formatDisplayDate(date) : '-', CalendarDays],
    ['Start time', time ? [time, /am|pm/i.test(time) ? '' : period].filter(Boolean).join(' ') : '-', Clock3],
    [live ? 'Time left' : 'Duration', live ? formatAssessmentRemainingTime(scheduleStatus.remainingMs) : duration || '-', Clock3],
    ['End date', end ? formatDisplayDate(end) : '-', CalendarDays],
  ]
  return <div className="assessment-create-published-details" aria-label="Assessment schedule">{fields.filter(([label]) => !hideSchedule || label === 'Exam type').map(([label, value, FieldIcon]) => <span key={label}>{label === 'Exam type' ? value : label === 'Start time' && expired ? <span className="assessment-schedule-expired">Expired</span> : <strong>{value}</strong>}<em>{createElement(FieldIcon, { size: 13, 'aria-hidden': true })} {label}</em></span>)}</div>
}

const renderAssessmentTimestamp = (record, stage) => {
  const stageKeys = { draft: ['updatedAt', 'savedAt'], pending: ['sentAt'], approved: ['reviewedAt'], rejected: ['reviewedAt'], published: ['publishedAt'], evaluation: ['evaluatedAt', 'updatedAt', 'publishedAt'], results: ['resultsPublishedAt', 'publishedAt'] }
  const value = getDraftValue(record, ...(stageKeys[stage] || []), 'updatedAt', 'savedAt', 'createdAt')
  return <span className="assessment-create-saved-timestamp">{value ? formatDraftSavedDate(value) : 'Date not available'}</span>
}

const parseMarksValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

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

const getPublishedQuestionRows = (assessment) => (
  Array.isArray(assessment?.questionRows) ? assessment.questionRows : []
)

const downloadQuestionPaperPdf = createQuestionPaperExporter({ stripHtml, isDescriptiveQuestionType, getQuestionMarksTotal, parseMarksValue, getPublishedQuestionRows })

const getDraftSummary = (draft) => {
  const questions = readDraftQuestions(draft)
  if (Array.isArray(draft?.questionRows) || questions.length) {
    return {
      questionCount: questions.length,
      totalMarks: questions.reduce((total, item) => total + getQuestionMarksTotal(item), 0),
    }
  }

  return {
    questionCount: Number(draft?.questionCount ?? 0),
    totalMarks: Number(draft?.totalMarks ?? 0),
  }
}

const formatDraftSavedDate = (value) => {
  if (!value) return 'Draft saved'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Draft saved'
  return `${date.toLocaleDateString('en-GB')} · ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
}

const formatDisplayDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB').replace(/\//g, '-')
}

const isPublishedAssessmentActionLocked = (assessment, now = new Date()) => {
  const scheduleStatus = getPublishedAssessmentScheduleStatus(assessment, now)
  if (['live', 'completed'].includes(scheduleStatus?.type)) return true

  const startDate = parseAssessmentDate(assessment?.startDate)
  if (!startDate) return false

  const startAt = applyAssessmentTime(startDate, assessment?.startTime)
  if (!startAt || Number.isNaN(startAt.getTime())) return false

  const lockAt = new Date(startAt.getTime() - 5 * 60 * 1000)
  return now >= lockAt
}

const getPublishedLogRows = (assessment) => {
  if (Array.isArray(assessment?.publishedLog) && assessment.publishedLog.length) return assessment.publishedLog

  return [{
    facultyId: assessment?.facultyId || assessment?.setup?.facultyId || 'MC2568',
    facultyName: assessment?.facultyName || assessment?.setup?.facultyName || 'Karthik Subramanian',
    remarks: assessment?.publishedAt ? 'Assessment published' : 'Published log not available',
    timestamp: assessment?.publishedAt || assessment?.createdAt || '',
  }]
}

const getAssessmentControlId = (assessment) => (
  assessment?.id || assessment?.assessmentId || assessment?.setup?.assessmentId || 'selected-assessment'
)

const readExamControlLogRows = (assessment) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(`${EXAM_CONTROLS_STATE_KEY}:${getAssessmentControlId(assessment)}`) || 'null')
    if (!parsed || typeof parsed !== 'object') return []

    return Object.entries(parsed).flatMap(([studentId, state]) => (
      Array.isArray(state?.logs)
        ? state.logs.map((log, index) => ({
            ...log,
            id: log.id || `${studentId}-${index}`,
            studentId,
          }))
        : []
    ))
  } catch {
    return []
  }
}

export default function AssessmentCreatePage({ onNavigate, approvalQueueRows = [], onViewSubmission, onClearAll, onReschedule, onSendToApproval }) {
  const creatingAssessmentRef = useRef(false)
  const [cardView, setCardView] = useState(readAssessmentView)
  const compactCards = cardView !== 'list'
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false)
  const [creationError, setCreationError] = useState('')
  const [downloadingPaperId, setDownloadingPaperId] = useState(null)
  const downloadPaper = async assessment => {
    if (downloadingPaperId) return
    setDownloadingPaperId(assessmentDisplayId(assessment))
    setCreationError('')
    try {
      await downloadQuestionPaperPdf(assessment)
    } catch {
      setCreationError('Unable to download the question paper. Please try again.')
    } finally {
      setDownloadingPaperId(null)
    }
  }
  const [isClearingCards, setIsClearingCards] = useState(false)
  const clearingCardsRef = useRef(false)
  const [highlightedAssessment, setHighlightedAssessment] = useState(() => sessionStorage.getItem('vx-assessment-highlight'))
  useEffect(() => {
    if (!highlightedAssessment) return undefined
    sessionStorage.removeItem('vx-assessment-highlight')
    document.querySelector('.assessment-tracker-card.is-just-published')?.scrollIntoView({block:'nearest'})
    const timer = window.setTimeout(() => setHighlightedAssessment(null), 6000)
    return () => window.clearTimeout(timer)
  }, [highlightedAssessment])
  const [draftAssessments, setDraftAssessments] = useState(readAssessmentDrafts)
  const [publishedAssessments, setPublishedAssessments] = useState(readPublishedAssessments)
  useEffect(() => {
    const refreshSavedCards = () => {
      setDraftAssessments(readAssessmentDrafts())
      setPublishedAssessments(readPublishedAssessments())
    }
    const onStorage = event => {
      if (!event.key || [ASSESSMENT_DRAFTS_STORAGE_KEY, ASSESSMENT_PUBLISHED_STORAGE_KEY].includes(event.key)) refreshSavedCards()
    }
    window.addEventListener(ASSESSMENT_PUBLISHED_CHANGED_EVENT, refreshSavedCards)
    window.addEventListener('focus', refreshSavedCards)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(ASSESSMENT_PUBLISHED_CHANGED_EVENT, refreshSavedCards)
      window.removeEventListener('focus', refreshSavedCards)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  const [selectedPublishedLogAssessment, setSelectedPublishedLogAssessment] = useState(null)
  const [scheduleNow, setScheduleNow] = useState(() => new Date())
  const [publishedSearchValue, setPublishedSearchValue] = useState('')
  const [publishedFilters, setPublishedFilters] = useState(PUBLISHED_FILTER_DEFAULTS)
  const [isPublishedFilterOpen, setIsPublishedFilterOpen] = useState(false)
  const [publishedActionModal, setPublishedActionModal] = useState(null)
  const [activeAssessmentTab, setActiveAssessmentTab] = useState(() => {
    const requestedTab = window.localStorage.getItem(ASSESSMENT_CREATE_INITIAL_TAB_KEY)
    window.localStorage.removeItem(ASSESSMENT_CREATE_INITIAL_TAB_KEY)
    const rows = readPublishedAssessments()
    const drafts = readAssessmentDrafts()
    if (requestedTab === 'evaluation') return 'evaluation'
    if (requestedTab === 'draft') return 'draft'
    if (['pending', 'approved', 'rejected', 'approval-queue'].includes(requestedTab)) return 'approval-queue'
    if (requestedTab === 'results') return 'results'
    if (requestedTab === 'published') return 'published'
    return rows.length ? 'published' : drafts.length ? 'draft' : 'published'
  })
  const { published: activePublishedAssessments, evaluation: evaluationAssessments, results: resultAssessments } = splitPublishedAssessmentRows(publishedAssessments, scheduleNow)
  const approvalAssessments = (() => {
    try {
      const queue = approvalQueueRows
      return queue.filter((record, index) => queue.findIndex(other => other.setup?.assessmentId === record.setup?.assessmentId && other.activityType === record.activityType) === index).filter(record => record.reworkStatus !== 'Draft' && record.setup?.assessmentId && !publishedAssessments.some(item => item.id === record.setup.assessmentId)
        && (record.activityType !== 'Blueprint' || (readBlueprintWorkflow(record.setup.assessmentId)?.status !== 'Revision required'
          && !queue.some(other => other.activityType === 'Assessment' && other.setup?.assessmentId === record.setup.assessmentId))))
    } catch { return [] }
  })()
  const isPendingAssessment = record => record.activityType === 'Assessment' && record.approvalStatus === 'Pending Approval'
  const visibleDraftAssessments = draftAssessments.filter(draft => !approvalAssessments.some(record => record.setup.assessmentId === (draft.setup?.assessmentId || draft.id)))
  const approvalStage = record => record.approvalStatus === 'Approved' ? 'approved' : /reject/i.test(record.approvalStatus || '') ? 'rejected' : 'pending'
  const activeApprovalAssessments = approvalAssessments.filter(record => (publishedFilters.status === 'all' || approvalStage(record) === publishedFilters.status) && [record.assessmentName, record.activityName, assessmentDisplayId(record)].join(' ').toLowerCase().includes(publishedSearchValue.trim().toLowerCase()))
  const metrics = assessmentMetrics.map((metric) => (
    metric.tone === 'draft'
      ? { ...metric, count: visibleDraftAssessments.length }
      : metric.tone === 'published'
        ? { ...metric, count: activePublishedAssessments.length }
        : metric.tone === 'evaluation'
          ? { ...metric, count: evaluationAssessments.length }
          : metric.tone === 'results'
            ? { ...metric, count: resultAssessments.length }
          : { ...metric, count: approvalAssessments.length }
  ))
  const assessmentTabItems = metrics.map((metric) => ({
      key: metric.tone,
      label: metric.tone === 'approval-queue' ? 'Approval Queue' : metric.label.replace(' Assessment', ''),
      count: metric.count,
      icon: metric.icon,
    }))
  const totalAssessmentCount = visibleDraftAssessments.length + approvalAssessments.length + publishedAssessments.length
  const shouldShowDraftAssessments = activeAssessmentTab === 'draft'
  const shouldShowPublishedAssessments = activeAssessmentTab === 'published'
  const shouldShowEvaluationAssessments = activeAssessmentTab === 'evaluation'
  const shouldShowResultAssessments = activeAssessmentTab === 'results'
  const activeEmptyTab = !['draft', 'published', 'evaluation', 'results'].includes(activeAssessmentTab)
    ? assessmentTabItems.find((item) => item.key === activeAssessmentTab)
    : null
  const activeTabLabel = assessmentTabItems.find((item) => item.key === activeAssessmentTab)?.label || 'Assessment'
  const activePublishedFilterCount = Object.values(publishedFilters).filter((value) => value !== 'all').length
  const hasPublishedFilter = activePublishedFilterCount > 0
  const hasPublishedSearch = Boolean(publishedSearchValue.trim())
  const filteredDraftAssessments = visibleDraftAssessments.filter((draft) => {
    const searchText = [
      getDraftValue(draft, 'assessmentName'),
      getDraftValue(draft, 'examCategory'),
      getDraftValue(draft, 'academicYear'),
      getDraftValue(draft, 'course', 'assignCourse'),
      getDraftValue(draft, 'year', 'assignYear'),
      getDraftValue(draft, 'updatedAt', 'savedAt', 'createdAt'),
    ].filter(Boolean).join(' ').toLowerCase()

    return !hasPublishedSearch || searchText.includes(publishedSearchValue.trim().toLowerCase())
  })
  const filterAssessmentCards = (assessments) => assessments.filter((assessment) => {
    const scheduleStatus = getPublishedAssessmentScheduleStatus(assessment, scheduleNow)
    const searchText = [
      assessment.assessmentName,
      assessment.examCategory,
      assessment.assignTo,
      assessment.examMode,
      assessment.examType,
      assessment.supervisionType,
      assessment.startDate,
      formatDisplayDate(assessment.startDate),
      assessment.startTime,
    ].filter(Boolean).join(' ').toLowerCase()
    const searchMatches = !hasPublishedSearch || searchText.includes(publishedSearchValue.trim().toLowerCase())

    const mode = String(assessment.examMode || '').toLowerCase()
    const examType = String(assessment.examType || '').toLowerCase()
    const supervisionType = String(assessment.supervisionType || '').toLowerCase()

    return (
      searchMatches
      && (publishedFilters.mode === 'all' || mode === publishedFilters.mode)
      && (publishedFilters.status === 'all' || scheduleStatus?.type === publishedFilters.status)
      && (publishedFilters.supervision === 'all' || supervisionType.includes(publishedFilters.supervision))
      && (publishedFilters.examType === 'all' || examType === publishedFilters.examType)
    )
  })
  const filteredPublishedAssessments = filterAssessmentCards(activePublishedAssessments).sort((a, b) => (
    Number(getPublishedAssessmentScheduleStatus(b, scheduleNow)?.type === 'live')
    - Number(getPublishedAssessmentScheduleStatus(a, scheduleNow)?.type === 'live')
  ))
  const filteredEvaluationAssessments = filterAssessmentCards(evaluationAssessments)
  const filteredResultAssessments = filterAssessmentCards(resultAssessments)

  const clearPublishedSearchFilters = () => {
    setPublishedSearchValue('')
    setPublishedFilters(PUBLISHED_FILTER_DEFAULTS)
    setIsPublishedFilterOpen(false)
  }

  const handleAssessmentTabChange = (tabKey) => {
    setActiveAssessmentTab(tabKey)
    setPublishedFilters(PUBLISHED_FILTER_DEFAULTS)
    setIsPublishedFilterOpen(false)
  }

  const renderAssessmentSearchToolbar = () => (
    <div className="assessment-create-published-toolbar assessment-create-tracker-toolbar">
      <label className="assessment-create-published-search">
        <Search size={15} strokeWidth={2.2} aria-hidden="true" />
        <input
          type="search"
          value={publishedSearchValue}
          placeholder={`Search ${activeTabLabel.toLowerCase()} assessments...`}
          onChange={(event) => setPublishedSearchValue(event.target.value)}
        />
      </label>
      <span className="assessment-create-published-filter-wrap">
        <button
          type="button"
          className={`assessment-create-published-filter-btn ${hasPublishedFilter ? 'is-active' : ''}`.trim()}
          onClick={() => setIsPublishedFilterOpen((current) => !current)}
          aria-expanded={isPublishedFilterOpen}
        >
          <ListFilter size={15} strokeWidth={2.3} />
          Filter
          {hasPublishedFilter ? <em>{activePublishedFilterCount}</em> : null}
        </button>
        {isPublishedFilterOpen ? (
          <span className="assessment-create-published-filter-popover" role="dialog" aria-label="Assessment filters">
            {(activeAssessmentTab === 'approval-queue' ? [{ key: 'status', label: 'Status', options: [{value:'all',label:'All'}, {value:'pending',label:'Pending'}, {value:'approved',label:'Approved'}, {value:'rejected',label:'Rejected'}] }] : PUBLISHED_FILTER_GROUPS).map((group) => (
              <label key={group.key}>
                <span>{group.label}</span>
                <span className="assessment-filter-select">
                <select
                  value={publishedFilters[group.key]}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setPublishedFilters((current) => ({ ...current, [group.key]: nextValue }))
                  }}
                >
                  {group.options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
                </span>
              </label>
            ))}
            <span className="assessment-create-published-filter-actions">
              <button type="button" onClick={() => setPublishedFilters(PUBLISHED_FILTER_DEFAULTS)}>
                Reset
              </button>
              <button type="button" className="is-primary" onClick={() => setIsPublishedFilterOpen(false)}>
                Apply
              </button>
            </span>
          </span>
        ) : null}
      </span>
      <AssessmentViewMenu value={cardView} onChange={setCardView} />
      {(hasPublishedSearch || hasPublishedFilter) ? (
        <button type="button" className="assessment-create-published-clear-btn" onClick={clearPublishedSearchFilters}>
          <X size={14} strokeWidth={2.3} />
          Clear
        </button>
      ) : null}
    </div>
  )

  useEffect(() => {
    // Keep unpublished expiry and published countdowns current while this page is open.

    const intervalId = window.setInterval(() => setScheduleNow(new Date()), 1000)
    return () => window.clearInterval(intervalId)
  }, [activeAssessmentTab])

  const clearAllCards = async () => {
    if (clearingCardsRef.current) return
    clearingCardsRef.current = true
    setIsClearingCards(true)
    setCreationError('')
    try {
      if (!onClearAll) throw new Error('Unable to clear assessments.')
      await onClearAll()
      setDraftAssessments([])
      setPublishedAssessments([])
      setSelectedPublishedLogAssessment(null)
      setPublishedActionModal(null)
      setPublishedSearchValue('')
      setPublishedFilters(PUBLISHED_FILTER_DEFAULTS)
    } catch {
      setCreationError('Unable to clear assessment cards. Please try again.')
    } finally {
      clearingCardsRef.current = false
      setIsClearingCards(false)
    }
  }

  const createAssessment = async () => {
    if (creatingAssessmentRef.current) return
    creatingAssessmentRef.current = true
    setIsCreatingAssessment(true)
    setCreationError('')
    try {
      const identity = await reserveAssessmentIdentity()
      window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify({ ...initialForm, ...identity }))
      window.localStorage.setItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY, 'create')
      onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
    } catch (error) {
      setCreationError(error instanceof Error ? error.message : 'Unable to create assessment. Please try again.')
      creatingAssessmentRef.current = false
      setIsCreatingAssessment(false)
    }
  }

  const continueBlueprintAssessment = record => {
    const draft = draftAssessments.find(item => (item.setup?.assessmentId || item.id) === record.setup.assessmentId)
    const flow = readBlueprintWorkflow(record.setup.assessmentId)
    const source = draft || { ...record, id: record.setup.sourceDraftId || record.setup.assessmentId }
    continueDraftAssessment({ ...source, setup: { ...source.setup, reworkReview: null, draftWorkspace: { ...source.setup?.draftWorkspace, activeCreateTab: flow?.status === 'Approved' ? 'questionBank' : 'blueprint', isBlueprintPlannerSaved: true, isBlueprintPlannerEditing: flow?.status !== 'Approved', blueprint: flow?.snapshot } } })
  }
  const continueRejectedAssessment = record => {
    try {
      const existing = draftAssessments.find(draft => (draft.setup?.assessmentId || draft.id) === record.setup.assessmentId)
      const resumed = existing?.setup?.reworkReview?.reviewedAt === record.reviewedAt ? existing : null
      const sections = record.previewSections || []
      const setup = {
        ...(resumed?.setup || record.setup),
        sourceDraftId: resumed?.id || record.setup.sourceDraftId || record.setup.assessmentId,
        reworkReview: { activityType: record.activityType, remarks: record.reviewRemarks || 'No rejection remarks were recorded.', reviewer: record.reviewedBy || record.approvalFaculty?.facultyName || 'Reviewer', reviewedAt: record.reviewedAt },
        draftWorkspace: {
          ...(resumed?.setup?.draftWorkspace || {}),
          activeCreateTab: record.activityType === 'Blueprint' ? 'blueprint' : 'preview',
          ...(resumed ? {} : { blueprint: record.blueprintSnapshot, isBlueprintPlannerSaved: Boolean(record.blueprintSnapshot), isBlueprintPlannerEditing: record.activityType === 'Blueprint' }),
        },
      }
      if (!resumed) {
        const suffix = getAssessmentStorageSuffix(setup)
        window.localStorage.setItem(getAssessmentQuestionsStorageKey(setup), JSON.stringify(record.questionRows || sections.flatMap(section => section.questions || [])))
        window.localStorage.setItem('vx-create-assessment-section-titles:' + suffix, JSON.stringify(Object.fromEntries(sections.map(section => [section.key, section.title]))))
        window.localStorage.setItem('vx-create-assessment-section-order:' + suffix, JSON.stringify(sections.map(section => section.key)))
        window.localStorage.setItem('vx-create-assessment-custom-sections:' + suffix, JSON.stringify(sections.filter(section => section.isCustom).map(section => { const metadata = { ...section }; delete metadata.questions; return metadata })))
      }
      window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify(setup))
      window.localStorage.setItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY, record.activityType === 'Blueprint' ? 'blueprint' : 'preview')
      onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
    } catch {
      setCreationError('Unable to open the rejected assessment. Free browser storage and try again.')
    }
  }
  const continueDraftAssessment = (draft) => {
    if (!draft?.setup) return
    const nextSetup = {
      ...draft.setup,
      sourceDraftId: draft.id,
      sourceDraftName: draft.assessmentName || draft.setup?.assessmentName || 'Untitled Assessment',
    }
    restoreAssessmentQuestionsForCreate(nextSetup, readDraftQuestions(draft))
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify(nextSetup))
    window.localStorage.setItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY, 'preview')
    onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
  }

  const deleteDraftAssessment = (draftId) => {
    setDraftAssessments((current) => {
      deleteBlueprintWorkflow(current.find(draft => draft.id === draftId))
      const nextDrafts = current.filter((draft) => draft.id !== draftId)
      window.localStorage.setItem(ASSESSMENT_DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts))
      if (!nextDrafts.length && activeAssessmentTab === 'draft') {
        setActiveAssessmentTab(publishedAssessments.length ? 'published' : 'draft')
      }
      return nextDrafts
    })
  }

  const editPublishedAssessment = (assessment) => {
    if (!assessment?.setup) return
    const editedAt = new Date().toISOString()
    const nextAssessment = {
      ...assessment,
      publishedLog: [
        {
          facultyId: assessment.facultyId || assessment.setup?.facultyId || 'MC2568',
          facultyName: assessment.facultyName || assessment.setup?.facultyName || 'Karthik Subramanian',
          remarks: 'Assessment opened for edit',
          timestamp: editedAt,
        },
        ...getPublishedLogRows(assessment),
      ],
    }
    setPublishedAssessments((current) => {
      const nextPublished = current.map((item) => (item.id === assessment.id ? nextAssessment : item))
      window.localStorage.setItem(ASSESSMENT_PUBLISHED_STORAGE_KEY, JSON.stringify(nextPublished))
      return nextPublished
    })
    const nextSetup = {
      ...assessment.setup,
      publicationMethod: getAssessmentPublicationMethod(assessment),
      sourcePublishedId: assessment.id,
      sourcePublishedName: assessment.assessmentName || assessment.setup?.assessmentName || 'Untitled Assessment',
      isPublishedEdit: true,
    }
    restoreAssessmentQuestionsForCreate(nextSetup, getPublishedQuestionRows(assessment))
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify(nextSetup))
    window.localStorage.setItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY, 'configuration')
    onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
  }

  const deletePublishedAssessment = (assessmentId) => {
    setPublishedAssessments((current) => {
      const deletedAssessment = current.find((assessment) => assessment.id === assessmentId)
      const nextPublished = current.filter((assessment) => assessment.id !== assessmentId)
      window.localStorage.setItem(ASSESSMENT_PUBLISHED_STORAGE_KEY, JSON.stringify(nextPublished))
      clearDeletedAssessmentSessionRecords(deletedAssessment)
      deleteBlueprintWorkflow(deletedAssessment)
      window.dispatchEvent(new CustomEvent(ASSESSMENT_PUBLISHED_CHANGED_EVENT))
      setSelectedPublishedLogAssessment((selected) => (selected?.id === assessmentId ? null : selected))
      if (!nextPublished.length && activeAssessmentTab === 'published') {
        setActiveAssessmentTab(draftAssessments.length ? 'draft' : 'published')
      }
      return nextPublished
    })
  }

  const openPublishedActionModal = (action, assessment) => {
    setPublishedActionModal({
      action,
      assessment,
      step: 'confirm',
      method: 'password',
      value: '',
      error: '',
    })
  }

  const closePublishedActionModal = () => {
    setPublishedActionModal(null)
  }

  const continuePublishedActionVerification = () => {
    setPublishedActionModal((current) => (
      current ? { ...current, step: 'verify', method: 'password', value: '', error: '' } : current
    ))
  }

  const updatePublishedActionVerification = (updates) => {
    setPublishedActionModal((current) => (
      current ? { ...current, ...updates, error: '' } : current
    ))
  }

  const editPublishedAssessmentResult = (assessment) => {
    window.sessionStorage.setItem(ASSESSMENT_EVALUATION_SELECTED_KEY, JSON.stringify({
      ...assessment,
      resultEditMode: true,
      returnTab: 'results',
    }))
    window.sessionStorage.removeItem(ASSESSMENT_OVERALL_ANALYTICS_SOURCE_KEY)
    onNavigate?.(APP_PAGES.ASSESSMENT_EVALUATION)
  }

  const submitPublishedActionVerification = (event) => {
    event.preventDefault()
    if (!publishedActionModal?.assessment) return

    const enteredValue = String(publishedActionModal.value || '').trim()
    if (enteredValue !== PUBLISHED_ACTION_VERIFICATION_CODE) {
      setPublishedActionModal((current) => (
        current
          ? {
              ...current,
              error: current.method === 'otp' ? 'Invalid OTP' : 'Invalid Password',
            }
          : current
      ))
      return
    }

    const { action, assessment } = publishedActionModal
    setPublishedActionModal(null)
    if (action === 'edit') {
      editPublishedAssessment(assessment)
      return
    }
    if (action === 'result-edit') {
      editPublishedAssessmentResult(assessment)
      return
    }
    deletePublishedAssessment(assessment.id)
  }

  const openExamControls = (assessment) => {
    window.sessionStorage.setItem(EXAM_CONTROLS_ASSESSMENT_KEY, JSON.stringify(assessment))
    onNavigate?.(APP_PAGES.EXAM_CONTROLS)
  }

  const startAssessmentEvaluation = (assessment) => {
    const nextAssessment = {
      ...assessment,
      evaluationStatus: hasPublishedResults(assessment) ? assessment.evaluationStatus : 'In Progress',
      evaluationStartedAt: assessment.evaluationStartedAt ?? new Date().toISOString(),
    }

    setPublishedAssessments((current) => {
      const nextPublished = current.map((item) => (item.id === assessment.id ? nextAssessment : item))
      window.localStorage.setItem(ASSESSMENT_PUBLISHED_STORAGE_KEY, JSON.stringify(nextPublished))
      window.dispatchEvent(new CustomEvent(ASSESSMENT_PUBLISHED_CHANGED_EVENT))
      return nextPublished
    })

    window.sessionStorage.setItem(ASSESSMENT_EVALUATION_SELECTED_KEY, JSON.stringify(nextAssessment))
    window.sessionStorage.removeItem(ASSESSMENT_OVERALL_ANALYTICS_SOURCE_KEY)
    onNavigate?.(APP_PAGES.ASSESSMENT_EVALUATION)
  }

  const viewPublishedAssessmentResult = (assessment) => {
    window.sessionStorage.setItem(ASSESSMENT_EVALUATION_SELECTED_KEY, JSON.stringify(assessment))
    window.sessionStorage.setItem(ASSESSMENT_OVERALL_ANALYTICS_SOURCE_KEY, 'results')
    onNavigate?.(APP_PAGES.ASSESSMENT_OVERALL_ANALYTICS)
  }

  return (
    <section className="vx-content assessment-page assessment-create-tracker-page my-assessment-theme logbook-scope lb-page assessment-create-theme" data-stage={activeAssessmentTab}>
      <div className={`assessment-page-shell assessment-create-page-shell ${activeAssessmentTab === 'draft' ? 'is-draft-tab' : ''}`}>
        <div className="assessment-tracker-navigation"><PageNavigationHeader items={['My Pages', 'Assessment Suite', 'Assessment']} /><button type="button" className="assessment-clear-all" onClick={clearAllCards} disabled={isClearingCards || totalAssessmentCount === 0} aria-busy={isClearingCards}><Trash2 size={15} aria-hidden="true" />{isClearingCards ? 'Clearing...' : 'Clear all'}</button></div>
        <header className="my-skills-overview lb-page-head">
          <div className="my-skills-overview-main">
            <span className="ospe-kicker">Assessment management</span>
            <div className="my-skills-overview-copy"><h1>Assessments</h1><p>Plan assessments, follow approvals, and manage evaluation and results.</p></div>
            <div className="my-skills-overview-inline"><span><strong>{totalAssessmentCount}</strong> Assessments</span><span><strong>{approvalAssessments.filter(record => approvalStage(record) === 'pending').length}</strong> Awaiting Approval</span></div>
          </div>
          <div className="my-skills-live-card lb-create-card">
            <div className="my-skills-live-card-top"><span className="my-skills-live-indicator"><ClipboardCheck size={15} aria-hidden="true" /> Assessment workspace</span></div>
            <div className="my-skills-live-card-body"><strong>Plan your next assessment</strong><p>Set up your blueprint, prepare questions, and configure your assessment.</p></div>
            <button type="button" className="tool-btn my-skills-live-card-cta lb-new-entry-btn" onClick={createAssessment} disabled={isCreatingAssessment} aria-busy={isCreatingAssessment}><Plus size={16} aria-hidden="true" />{isCreatingAssessment ? 'Creating...' : 'Create assessment'}</button>
          </div>
        </header>

        {creationError && <p role="alert">{creationError}</p>}

        <section className="assessment-create-tabbar" aria-label="Assessment status tabs">
          <div className="assessment-create-tabs" role="tablist" aria-label="Assessment status filters">
            {assessmentTabItems.map((tab) => {
              const Icon = tab.icon
              const isActive = activeAssessmentTab === tab.key

              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`assessment-create-tab is-${tab.key} ${isActive ? 'is-active' : ''}`.trim()}
                  onClick={() => handleAssessmentTabChange(tab.key)}
                >
                  <span className="my-skills-metric-card-icon"><Icon size={18} aria-hidden="true" /></span>
                  <span className="my-skills-metric-card-copy"><strong>{tab.count}</strong><span>{tab.label}</span></span>
                </button>
              )
            })}
          </div>
        </section>

        {shouldShowDraftAssessments ? (
          <section className="assessment-create-draft-shell" aria-label="Draft assessments">
            <div className="assessment-create-card-heading">
              <h2>Draft Assessment</h2>
              {renderAssessmentSearchToolbar()}
            </div>
            {visibleDraftAssessments.length && filteredDraftAssessments.length ? (
              <AssessmentCardCollection view={cardView}>
                {filteredDraftAssessments.map((draft) => {
                  const assessmentName = String(getDraftValue(draft, 'assessmentName') || '').replace(/^Draft:\s*/i, '').trim() || 'Untitled Assessment'
                  const examMode = String(getDraftValue(draft, 'examDeliveryMode', 'examMode') || '').toLowerCase()
                  const supervision = String(getDraftValue(draft, 'supervisionType') || '').toLowerCase()
                  const isPractice = supervision.includes('practice')
                  const hasSupervision = isPractice || supervision.includes('proctored')
                  const SupervisionIcon = isPractice ? EyeOff : Monitor
                  const course = String(getDraftValue(draft, 'course', 'assignCourse') || '-')
                    .replace(/\s*\(NMC Syllabus\)\s*/i, '')
                    .trim() || '-'
                  const year = getDraftValue(draft, 'year', 'assignYear')

                  const draftSummary = getDraftSummary(draft)
                  const questionCount = draftSummary.questionCount
                  const totalMarks = draftSummary.totalMarks

                  return (
                    <AssessmentTrackerCard key={draft.id}
                        identity={<><div className="assessment-draft-top-badges">
                      {examMode === 'online' && hasSupervision ? <span className={`assessment-stage-badge assessment-create-published-supervision ${isPractice ? 'is-practice' : 'is-proctored'}`}><SupervisionIcon size={13} strokeWidth={2.3} aria-hidden="true" />{isPractice ? 'Practice' : 'Proctored'}</span> : null}
                        {['online', 'offline'].includes(examMode) && <span className={`assessment-create-published-status is-${examMode}`} aria-label={`Exam mode: ${examMode}`}>{examMode === 'online' ? 'Online' : 'Offline'}</span>}
                      </div>
                      <div className="assessment-create-draft-profile">
                        <div>
                        {renderAssessmentIdentity(draft, assessmentName)}
                        </div>
                        <button type="button" className="assessment-card-info" onClick={() => setSelectedPublishedLogAssessment(draft)} aria-label={`View history for ${assessmentName}`}><Info size={15} /></button>
                        <button
                          type="button"
                          className="assessment-create-draft-delete"
                          onClick={() => deleteDraftAssessment(draft.id)}
                          aria-label={`Delete ${assessmentName}`}
                        >
                          <Trash2 size={15} strokeWidth={2.1} />
                        </button>
                      </div>
{(formatYearLabel(year) !== '-' || course !== '-') && <div className="assessment-create-draft-metadata">
                        {formatYearLabel(year) !== '-' && <span>{formatYearLabel(year)}</span>}
                        {course !== '-' && <span>{course}</span>}
                      </div>}</>}
                        summary={<><div className="assessment-create-draft-stats" aria-label="Draft summary">
                        <span>
                          <strong>{questionCount}</strong>
                          <em><ClipboardCheck size={13} aria-hidden="true" /> Questions</em>
                        </span>
                        <span>
                          <strong>{totalMarks}</strong>
                          <em><ChartColumnBig size={13} aria-hidden="true" /> Total marks</em>
                        </span>
                      </div>{renderConfiguredSchedule(draft, undefined, readDraftQuestions(draft), scheduleNow)}</>}
                        settings={<>{!compactCards && <CopyIdBadge value={assessmentDisplayId(draft)} />}<AssessmentCardSettings compact={compactCards} assessment={draft} timestamp={renderAssessmentTimestamp(draft, activeAssessmentTab)} /></>}
                        timestamp={compactCards ? null : renderAssessmentTimestamp(draft, activeAssessmentTab)}
                        actions={<><button type="button" onClick={() => continueDraftAssessment(draft)}>
                          Continue
                          <ArrowRight size={14} strokeWidth={2.3} />
                        </button></>}
                      />
                  )
                })}
              </AssessmentCardCollection>
            ) : visibleDraftAssessments.length ? (
              <div className="assessment-create-placeholder">
                <p>No draft assessments match your search.</p>
              </div>
            ) : (
              <div className="assessment-create-placeholder">
                <p>No draft assessments available.</p>
              </div>
            )}
          </section>
        ) : null}

        {shouldShowPublishedAssessments ? (
          <section className="assessment-create-draft-shell assessment-create-published-shell" aria-label="Published assessments">
            <div className="assessment-create-card-heading">
              <div className="assessment-create-published-title">
                <h2>Published Assessment</h2>
              </div>
              {renderAssessmentSearchToolbar()}
            </div>
            {activePublishedAssessments.length ? (
              <>
                {filteredPublishedAssessments.length ? (
              <AssessmentCardCollection view={cardView}>
                {filteredPublishedAssessments.map((assessment) => {

                  const isOfflineExam = String(assessment.examMode || '').toLowerCase() === 'offline'

                  const scheduleStatus = getPublishedAssessmentScheduleStatus(assessment, scheduleNow)
                  const canShowExamControls = !isOfflineExam && ['live', 'completed'].includes(scheduleStatus?.type)
                  const canShowPublishedActions = !isPublishedAssessmentActionLocked(assessment, scheduleNow)
                  const publishedQuestionRows = getPublishedQuestionRows(assessment)

                  return (
                      <AssessmentTrackerCard key={assessment.id} className={[scheduleStatus?.type === 'live' ? 'is-live' : '', assessment.id === highlightedAssessment ? 'is-just-published' : ''].filter(Boolean).join(' ')}
                        topBadge={compactCards && scheduleStatus?.type === 'live' && <AssessmentStartCountdown status={scheduleStatus} />}
                        identity={<><div className="assessment-draft-top-badges">{!compactCards && scheduleStatus?.type === 'live' && <AssessmentStartCountdown status={scheduleStatus} />}{renderAssessmentModeBadges(assessment)}{!compactCards && <AssessmentPublicationBadge assessment={assessment} />}{publishedQuestionRows.length ? (
                            <button type="button" className="assessment-create-published-download-btn" disabled={Boolean(downloadingPaperId)} aria-busy={downloadingPaperId === assessmentDisplayId(assessment)} onClick={() => downloadPaper(assessment)}>
                              {downloadingPaperId === assessmentDisplayId(assessment) ? <LoaderCircle className="assessment-pdf-spinner" size={12} aria-hidden="true" /> : <Download size={12} strokeWidth={2.4} aria-hidden="true" />}
                              {downloadingPaperId === assessmentDisplayId(assessment) ? 'Preparing PDF' : 'Download PDF'}
                            </button>
                          ) : null}</div>

                        <div className="assessment-create-published-head">
                          <div>
                            {renderAssessmentIdentity(assessment, assessment.assessmentName || 'Untitled Assessment')}
                      </div>
                      <span className="assessment-create-published-actions">
                        {canShowPublishedActions ? (
                          <button type="button" className="assessment-create-published-icon-btn is-delete" onClick={() => openPublishedActionModal('delete', assessment)} aria-label={`Delete ${assessment.assessmentName || 'published assessment'}`}>
                            <Trash2 size={13} strokeWidth={2.2} />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="assessment-create-published-info"
                          onClick={() => {
                            setSelectedPublishedLogAssessment(assessment)
                          }}
                          title="Published assessment details"
                          aria-label={`View published log for ${assessment.assessmentName || 'published assessment'}`}
                        >
                          <Info size={14} strokeWidth={2.2} />
                        </button>
                        {canShowPublishedActions ? (
                          <button type="button" className="assessment-create-published-icon-btn is-edit" onClick={() => openPublishedActionModal('edit', assessment)} aria-label={`Edit ${assessment.assessmentName || 'published assessment'}`}>
                            <Pencil size={13} strokeWidth={2.2} />
                          </button>
                        ) : null}
                      </span>
                        </div>
                        <span className="assessment-create-published-status-row">
                          <small className="assessment-card-category">{renderAssessmentAssignment(assessment)}</small>
                          
                          
                        </span></>}
                        summary={<>{renderAssessmentSummary(assessment)}
{renderConfiguredSchedule(assessment, scheduleStatus)}
                        </>}
                        resultPlacement="schedule"
                        resultSummary={<AssessmentResultStatus results={assessment.studentResults} />}
                        settings={<>{!compactCards && <CopyIdBadge value={assessmentDisplayId(assessment)} />}<AssessmentCardSettings compact={compactCards} assessment={assessment} timestamp={renderAssessmentTimestamp(assessment, activeAssessmentTab)} /></>}
                        actions={<>{scheduleStatus?.type !== 'live' && <AssessmentStartCountdown status={scheduleStatus} />}{canShowExamControls ? (
                            <button type="button" className="assessment-create-exam-controls-btn" onClick={() => openExamControls(assessment)}>
                              <Monitor size={12} strokeWidth={2.4} />
                              Exam Controls
                            </button>
                          ) : null}</>}
                      />
                    )
                })}
              </AssessmentCardCollection>
                ) : (
                  <div className="assessment-create-placeholder">
                    <p>No published assessments match your search.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="assessment-create-placeholder">
                <p>No published assessments available.</p>
              </div>
            )}
          </section>
        ) : null}

        {shouldShowEvaluationAssessments ? (
          <section className="assessment-create-draft-shell assessment-create-published-shell" aria-label="Evaluation assessments">
            <div className="assessment-create-card-heading">
              <div className="assessment-create-published-title">
                <h2>Evaluation</h2>
              </div>
              {renderAssessmentSearchToolbar()}
            </div>
            {evaluationAssessments.length ? (
              filteredEvaluationAssessments.length ? (
                <AssessmentCardCollection view={cardView}>
                  {filteredEvaluationAssessments.map((assessment) => {



                    const publishedQuestionRows = getPublishedQuestionRows(assessment)

                    const scheduleStatus = getPublishedAssessmentScheduleStatus(assessment, scheduleNow)
                    const isLive = scheduleStatus?.type === 'live'
                    const awaitingSubmissions = isLive && !canStartLiveEvaluation(assessment)
                    const resultsPublished = hasPublishedResults(assessment)
                    const evaluationStatus = resultsPublished ? 'Results published' : assessment.evaluationStatus === 'In Progress' ? 'In Progress' : 'Yet to Start'
                    const evaluationBadge = isLive ? <AssessmentStartCountdown status={scheduleStatus} /> : <span className={'assessment-create-published-schedule-badge ' + (resultsPublished ? 'is-published' : evaluationStatus === 'In Progress' ? 'is-in-progress' : 'is-yet-to-start')}>{resultsPublished ? 'Results published' : evaluationStatus === 'In Progress' ? 'In progress' : 'Yet to start'}</span>

                    return (
                      <AssessmentTrackerCard key={assessment.id} className={isLive ? 'is-live' : ''}
                        topBadge={compactCards && evaluationBadge}
                        identity={<><div className="assessment-draft-top-badges">{!compactCards && evaluationBadge}{renderAssessmentModeBadges(assessment)}{publishedQuestionRows.length ? (
                            <button type="button" className="assessment-create-published-download-btn" disabled={Boolean(downloadingPaperId)} aria-busy={downloadingPaperId === assessmentDisplayId(assessment)} onClick={() => downloadPaper(assessment)}>
                              {downloadingPaperId === assessmentDisplayId(assessment) ? <LoaderCircle className="assessment-pdf-spinner" size={12} aria-hidden="true" /> : <Download size={12} strokeWidth={2.4} aria-hidden="true" />}
                              {downloadingPaperId === assessmentDisplayId(assessment) ? 'Preparing PDF' : 'Download PDF'}
                            </button>
                          ) : null}</div>
                        <div className="assessment-create-published-head">
                          <div>
                            {renderAssessmentIdentity(assessment, assessment.assessmentName || 'Untitled Assessment')}
                          </div>
                          <span className="assessment-create-published-actions">
                            <button
                              type="button"
                              className="assessment-create-published-icon-btn is-edit"
                              onClick={() => openPublishedActionModal('result-edit', assessment)}
                              disabled={awaitingSubmissions}
                              title="Edit published result"
                              aria-label={`Edit published result for ${assessment.assessmentName || 'assessment'}`}
                            >
                              <Pencil size={13} strokeWidth={2.2} />
                            </button>
                            <button
                              type="button"
                              className="assessment-create-published-info"
                              onClick={() => {
                                setSelectedPublishedLogAssessment(assessment)
                              }}
                              title="Assessment log details"
                              aria-label={`View logs for ${assessment.assessmentName || 'assessment'}`}
                            >
                              <Info size={14} strokeWidth={2.2} />
                            </button>
                          </span>
                        </div>
                        <span className="assessment-create-published-status-row">
                          <small className="assessment-card-category">{renderAssessmentAssignment(assessment)}</small>
                          
                          
                        </span></>}
                        summary={<>{renderAssessmentSummary(assessment)}
{renderConfiguredSchedule(assessment, scheduleStatus)}</>}
                        resultPlacement="schedule"
                        resultSummary={<AssessmentResultStatus results={assessment.studentResults} />}
                        settings={<>{!compactCards && <CopyIdBadge value={assessmentDisplayId(assessment)} />}<AssessmentCardSettings compact={compactCards} assessment={assessment} timestamp={renderAssessmentTimestamp(assessment, activeAssessmentTab)} /></>}
                        timestamp={compactCards ? null : renderAssessmentTimestamp(assessment, activeAssessmentTab)}
                        actions={<><button type="button" className="assessment-create-exam-controls-btn is-start-evaluation" onClick={() => startAssessmentEvaluation(assessment)}>
                            <ClipboardCheck size={12} strokeWidth={2.4} />
                            {isLive ? 'Continue evaluation' : resultsPublished ? 'Review evaluation' : evaluationStatus === 'In Progress' ? 'Continue evaluation' : 'Start evaluation'}
                          </button></>}
                      />
                    )
                  })}
                </AssessmentCardCollection>
              ) : (
                <div className="assessment-create-placeholder">
                  <p>No evaluation assessments match your search.</p>
                </div>
              )
            ) : (
              <div className="assessment-create-placeholder">
                <p>No completed assessments available.</p>
              </div>
            )}
          </section>
        ) : null}

        {shouldShowResultAssessments ? (
          <section className="assessment-create-draft-shell assessment-create-published-shell" aria-label="Result assessments">
            <div className="assessment-create-card-heading">
              <div className="assessment-create-published-title">
                <h2>Results</h2>
              </div>
              {renderAssessmentSearchToolbar()}
            </div>
            {resultAssessments.length ? (
              filteredResultAssessments.length ? (
                <AssessmentCardCollection view={cardView}>
                  {filteredResultAssessments.map((assessment) => {


                    return (
                      <AssessmentTrackerCard key={assessment.id}
                        identity={<><div className="assessment-draft-top-badges">{renderAssessmentModeBadges(assessment)}</div>
                        <div className="assessment-create-published-head">
                          <div>
                            {renderAssessmentIdentity(assessment, assessment.assessmentName || 'Untitled Assessment')}
                          </div>
                          <span className="assessment-create-published-actions">
                            <button
                              type="button"
                              className="assessment-create-published-info"
                              onClick={() => {
                                setSelectedPublishedLogAssessment(assessment)
                              }}
                              title="Assessment log details"
                              aria-label={`View logs for ${assessment.assessmentName || 'assessment'}`}
                            >
                              <Info size={14} strokeWidth={2.2} />
                            </button>
                          </span>
                        </div>
                        <span className="assessment-create-published-status-row">
                          <small className="assessment-card-category">{renderAssessmentAssignment(assessment)}</small>
                          
                          
                        </span></>}
                        summary={<>{renderAssessmentSummary(assessment)}
{renderConfiguredSchedule(assessment)}
                        </>}
                        resultSummary={<AssessmentResultStatus results={assessment.studentResults} />}
                        settings={<>{!compactCards && <CopyIdBadge value={assessmentDisplayId(assessment)} />}<AssessmentCardSettings compact={compactCards} assessment={assessment} timestamp={renderAssessmentTimestamp(assessment, activeAssessmentTab)} /></>}
                        timestamp={compactCards ? null : renderAssessmentTimestamp(assessment, activeAssessmentTab)}
                        actions={<><button type="button" className="assessment-create-exam-controls-btn is-results" onClick={() => viewPublishedAssessmentResult(assessment)}>
                            <ChartColumnBig size={12} strokeWidth={2.4} />
                            View results
                          </button></>}
                      />
                    )
                  })}
                </AssessmentCardCollection>
              ) : (
                <div className="assessment-create-placeholder">
                  <p>No result assessments match your search.</p>
                </div>
              )
            ) : (
              <div className="assessment-create-placeholder">
                <p>No published results available.</p>
              </div>
            )}
          </section>
        ) : null}

        {activeEmptyTab ? (
          <section className="assessment-create-draft-shell" aria-label={`${activeEmptyTab.label} assessments`}>
            <div className="assessment-create-card-heading">
              <h2>{activeEmptyTab.label}</h2>
              {renderAssessmentSearchToolbar()}
            </div>
            {activeApprovalAssessments.length ? <AssessmentCardCollection view={cardView}>
              {activeApprovalAssessments.map(record => <AssessmentTrackerCard expired={isPendingAssessmentExpired(record, scheduleNow)} key={record.activityId || record.setup.assessmentId}
                        identity={<><div className="assessment-draft-top-badges"><span className={`assessment-create-published-schedule-badge approval-queue-status is-${approvalStage(record)}`}>{approvalStage(record) === 'approved' ? 'Approved' : approvalStage(record) === 'rejected' ? 'Rejected' : 'Pending approval'}</span>{renderAssessmentModeBadges(record)}</div>
                <div className="assessment-create-draft-profile"><div>{renderAssessmentIdentity(record, record.assessmentName || record.activityName || record.setup.assessmentName || 'Untitled Assessment')}</div>
                  <button type="button" className="assessment-card-info" onClick={() => setSelectedPublishedLogAssessment(record)} aria-label="View assessment history"><Info size={15} /></button>
                </div></>}
                        summary={<><div className="assessment-create-draft-stats"><span><strong>{record.questionCount ?? record.questionRows?.length ?? 0}</strong><em><ClipboardCheck size={13} aria-hidden="true" /> Questions</em></span><span><strong>{record.totalMarks ?? '-'}</strong><em><ChartColumnBig size={13} aria-hidden="true" /> Total marks</em></span></div>{renderConfiguredSchedule(record, undefined, undefined, scheduleNow, isPendingAssessmentExpired(record, scheduleNow))}</>}
                        settings={<>{!compactCards && <CopyIdBadge value={assessmentDisplayId(record)} />}<AssessmentCardSettings compact={compactCards} assessment={record} timestamp={renderAssessmentTimestamp(record, approvalStage(record))} /></>}
                        timestamp={compactCards ? null : renderAssessmentTimestamp(record, approvalStage(record))}
                        actions={<>{isPendingAssessment(record) ? <button type="button" onClick={() => isPendingAssessmentExpired(record, scheduleNow) ? onReschedule?.(record) : onViewSubmission?.(record)}>{isPendingAssessmentExpired(record, scheduleNow) ? 'Reschedule' : 'View'}<ArrowRight size={14} aria-hidden="true" /></button> : /reject/i.test(record.approvalStatus || '') ? <button type="button" onClick={() => continueRejectedAssessment(record)}>Continue<ArrowRight size={14} aria-hidden="true" /></button> : record.activityType === 'Blueprint' && record.approvalStatus !== 'Pending Approval' && <button type="button" onClick={() => continueBlueprintAssessment(record)}>{record.approvalStatus === 'Approved' ? 'Continue' : 'Edit blueprint'}<ArrowRight size={14} aria-hidden="true" /></button>}</>}
                      />)}
            </AssessmentCardCollection> : <div className="assessment-create-placeholder"><p>No assessments in the Approval Queue{hasPublishedSearch || hasPublishedFilter ? ' match your filters' : ''}.</p></div>}
          </section>
        ) : null}
      </div>
      {publishedActionModal ? createPortal((
        <div className="assessment-create-action-guard-backdrop" role="presentation">
          <section
            className="assessment-create-action-guard-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assessment-create-action-guard-title"
          >
            {publishedActionModal.step === 'confirm' ? (
              <>
                <span className={`assessment-create-action-guard-icon is-${publishedActionModal.action === 'delete' ? 'delete' : 'edit'}`} aria-hidden="true">
                  {publishedActionModal.action === 'delete' ? <Trash2 size={26} strokeWidth={2.2} /> : <Pencil size={26} strokeWidth={2.2} />}
                </span>
                <div className="assessment-create-action-guard-copy">
                  <h3 id="assessment-create-action-guard-title">
                    {publishedActionModal.action === 'delete' ? 'Are you sure delete?' : publishedActionModal.action === 'result-edit' ? 'Are you sure edit published result?' : 'Are you sure edit?'}
                  </h3>
                  <p>{publishedActionModal.assessment?.assessmentName || 'Untitled Assessment'}</p>
                </div>
                <div className="assessment-create-action-guard-actions">
                  <button type="button" className="is-secondary" onClick={closePublishedActionModal}>
                    No
                  </button>
                  <button type="button" className={publishedActionModal.action === 'delete' ? 'is-danger' : 'is-primary'} onClick={continuePublishedActionVerification}>
                    Yes
                  </button>
                </div>
              </>
            ) : (
              <form className="assessment-create-action-guard-form" onSubmit={submitPublishedActionVerification}>
                <span className={`assessment-create-action-guard-icon is-${publishedActionModal.action === 'delete' ? 'delete' : 'edit'}`} aria-hidden="true">
                  {publishedActionModal.action === 'delete' ? <Trash2 size={26} strokeWidth={2.2} /> : <Pencil size={26} strokeWidth={2.2} />}
                </span>
                <div className="assessment-create-action-guard-copy">
                  <h3 id="assessment-create-action-guard-title">
                    Verify {publishedActionModal.action === 'delete' ? 'Delete' : 'Edit'} Action
                  </h3>
                  <p>Select Password or OTP, then enter the code to continue.</p>
                </div>
                <div className="assessment-create-action-methods" role="radiogroup" aria-label="Verification method">
                  <button
                    type="button"
                    className={publishedActionModal.method === 'password' ? 'is-active' : ''}
                    onClick={() => updatePublishedActionVerification({ method: 'password', value: '' })}
                    aria-pressed={publishedActionModal.method === 'password'}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    className={publishedActionModal.method === 'otp' ? 'is-active' : ''}
                    onClick={() => updatePublishedActionVerification({ method: 'otp', value: '' })}
                    aria-pressed={publishedActionModal.method === 'otp'}
                  >
                    OTP
                  </button>
                </div>
                <label className="assessment-create-action-guard-field">
                  <span>{publishedActionModal.method === 'otp' ? 'Enter OTP' : 'Enter Password'}</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    value={publishedActionModal.value}
                    onChange={(event) => updatePublishedActionVerification({ value: event.target.value })}
                    placeholder="Enter 1234"
                  />
                </label>
                {publishedActionModal.error ? (
                  <p className="assessment-create-action-guard-error">{publishedActionModal.error}</p>
                ) : null}
                <div className="assessment-create-action-guard-actions">
                  <button type="button" className="is-secondary" onClick={closePublishedActionModal}>
                    No
                  </button>
                  <button type="submit" className={publishedActionModal.action === 'delete' ? 'is-danger' : 'is-primary'}>
                    Yes
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      ), document.body) : null}
      {selectedPublishedLogAssessment && <AssessmentHistoryDialog onSendToApproval={onSendToApproval} stage={activeTabLabel} assessment={selectedPublishedLogAssessment} controlLogs={readExamControlLogRows(selectedPublishedLogAssessment)} onClose={() => setSelectedPublishedLogAssessment(null)} />}
    </section>
  )
}
