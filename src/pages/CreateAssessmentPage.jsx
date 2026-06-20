import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Bold,
  CalendarDays,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Clock3,
  Database,
  Eye,
  FilePenLine,
  History,
  ImagePlus,
  Info,
  Italic,
  LayoutGrid,
  ListChecks,
  LogOut,
  Moon,
  List,
  ListOrdered,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Strikethrough,
  Sun,
  Trash2,
  Underline,
  UsersRound,
  X,
} from 'lucide-react'
import RichMathEditor from '../components/RichMathEditor'
import { APP_PAGES } from '../config/appPages'
import { stripHtml } from '../utils/mathText'
import {
  DESCRIPTIVE_QUESTION_TYPES,
  QUESTION_CATEGORY_OPTIONS,
  createAuthoringDescriptiveInsideQuestion,
  createAuthoringDescriptiveSubQuestion,
  createAuthoringOption,
  createAuthoringQuestion,
  getQuestionCategorySelectOptions,
  getQuestionCategorySelectValue,
  getShortCompetencyLabel,
  isDescriptiveQuestionType,
} from '../utils/questionAuthoring'
import QuestionBankNonCreatePage from './QuestionBankNonCreatePage'
import '../styles/question-bank.css'
import '../styles/assessment-pages.css'

const CREATE_ASSESSMENT_SETUP_KEY = 'vx-create-assessment-setup'
const CREATE_ASSESSMENT_INITIAL_TAB_KEY = 'vx-create-assessment-initial-tab'
const ASSESSMENT_CREATE_INITIAL_TAB_KEY = 'vx-assessment-create-initial-tab'
const CREATE_ASSESSMENT_QUESTIONS_KEY = 'vx-create-assessment-questions'
const CREATE_ASSESSMENT_SECTION_TITLES_KEY = 'vx-create-assessment-section-titles'
const CREATE_ASSESSMENT_SECTION_ORDER_KEY = 'vx-create-assessment-section-order'
const CREATE_ASSESSMENT_CUSTOM_SECTIONS_KEY = 'vx-create-assessment-custom-sections'
const CREATE_ASSESSMENT_CUSTOM_EXAM_CATEGORIES_KEY = 'vx-create-assessment-custom-exam-categories'
const CREATE_ASSESSMENT_TEMPLATES_KEY = 'vx-create-assessment-templates'
const ASSESSMENT_DRAFTS_STORAGE_KEY = 'vx-assessment-drafts'
const ASSESSMENT_PUBLISHED_STORAGE_KEY = 'vx-assessment-published'
const QUESTION_BANK_STORAGE_KEY = 'vx-question-bank-questions'

const SUBJECT_DIRECTORY = {
  'Human Anatomy': {
    topics: ['General Anatomy', 'Upper Limb', 'Thorax', 'Neuroanatomy'],
    competencies: [
      { value: 'AN1.1 Describe anatomical position and planes', topic: 'General Anatomy' },
      { value: 'AN1.5 Describe muscles and movements of upper limb', topic: 'Upper Limb' },
      { value: 'AN2.3 Explain mediastinal relations and surface anatomy', topic: 'Thorax' },
      { value: 'AN4.2 Identify major cranial nerve pathways', topic: 'Neuroanatomy' },
    ],
  },
  Physiology: {
    topics: ['General Physiology', 'Hematology', 'Cardiovascular System', 'Respiratory System'],
    competencies: [
      { value: 'PY1.4 Describe body fluid compartments and homeostasis', topic: 'General Physiology' },
      { value: 'PY2.11 Interpret complete blood count findings', topic: 'Hematology' },
      { value: 'PY4.5 Explain regulation of cardiac output', topic: 'Cardiovascular System' },
      { value: 'PY6.8 Interpret spirometry and lung volumes', topic: 'Respiratory System' },
    ],
  },
  Pathology: {
    topics: ['General Pathology', 'Hematology', 'Systemic Pathology'],
    competencies: [
      { value: 'PA1.2 Explain cell injury and adaptation', topic: 'General Pathology' },
      { value: 'PA3.4 Classify anemia using peripheral smear findings', topic: 'Hematology' },
      { value: 'PA5.7 Correlate systemic pathology with clinical presentation', topic: 'Systemic Pathology' },
    ],
  },
}

const YEAR_OPTIONS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year']
const DEFAULT_EXAM_CATEGORIES = ['Internal', 'Midterm', 'Final', 'Viva']
const DEFAULT_COLLEGE_NAME = 'Sri Manakula Vinayagar Medical College and Hospital'
const DEFAULT_ATTAINMENT_LEVELS = [
  { id: 'attainment-0', minPercentage: '0', maxPercentage: '30', level: '0' },
  { id: 'attainment-1', minPercentage: '31', maxPercentage: '49', level: '1' },
  { id: 'attainment-2', minPercentage: '50', maxPercentage: '70', level: '2' },
  { id: 'attainment-3', minPercentage: '71', maxPercentage: '100', level: '3' },
]
const BLOOMS_THRESHOLD_FIELDS = [
  { key: 'applyThreshold', label: 'Apply' },
  { key: 'rememberThreshold', label: 'Remember' },
  { key: 'understandThreshold', label: 'Understand' },
  { key: 'analyzeThreshold', label: 'Analyze' },
  { key: 'evaluateThreshold', label: 'Evaluate' },
]
const DEFAULT_BLOOMS_THRESHOLDS = {
  applyThreshold: '55',
  rememberThreshold: '75',
  understandThreshold: '60',
  analyzeThreshold: '45',
  evaluateThreshold: '80',
}
const DEFAULT_STUDENT_INSTRUCTIONS = [
  '<h3>[Header] Mid-Term Market Analysis Quiz</h3>',
  '<p><strong><em>[Description]</em></strong><br>This quiz evaluates your understanding of strategic frameworks from Modules 1-4. It consists of 20 multiple-choice questions and accounts for 15% of your final grade.</p>',
  '<p><strong><em>[Instructions]</em></strong></p>',
  '<ul><li><strong>Time Limit :</strong> <em>60 minutes once started (cannot be paused).</em></li></ul>',
].join('')
const CREATE_ASSESSMENT_SELECT_OPTIONS = {
  colleges: [DEFAULT_COLLEGE_NAME],
  examCategories: DEFAULT_EXAM_CATEGORIES,
  courses: ['India MBBS (NMC Syllabus)'],
  years: YEAR_OPTIONS,
  sgtGroups: ['SGT Group A', 'SGT Group B', 'Class A', 'Class B'],
  academicYears: ['2024 - 2025', '2025 - 2026', '2026 - 2027', '2027 - 2028'],
}
const CREATE_ASSESSMENT_DEFAULT_SETUP = {
  collegeName: DEFAULT_COLLEGE_NAME,
  logoName: '',
  logoPreview: '',
  assessmentName: '',
  academicYear: '2025 - 2026',
  examCategory: '',
  course: '',
  year: '',
  examDeliveryMode: 'Online',
  supervisionType: 'Proctored Exams',
  approvalFlow: 'Send to Approval',
  examDate: '',
  startTime: '',
  startPeriod: 'AM',
  practiceStartDate: '',
  practiceStartTime: '',
  practiceStartPeriod: 'AM',
  practiceEndDate: '',
  practiceEndTime: '',
  practiceEndPeriod: 'PM',
  mcqStartTime: '',
  mcqStartPeriod: 'AM',
  descriptiveStartTime: '',
  descriptiveStartPeriod: 'AM',
  mcqDisplayType: 'Answer Input',
  descriptiveDisplayType: 'Read-Only',
  mcqAutoPublish: 'Off',
  descriptiveEvaluationRequired: 'Yes',
  proctoredTotalDuration: '',
  splitProctoredDuration: false,
  mcqTimeLimit: '',
  descriptiveTimeLimit: '',
  offlineDuration: '',
  provideStudentInstructions: 'No',
  studentInstructions: DEFAULT_STUDENT_INSTRUCTIONS,
  thinkingThresholdMode: 'hotlot',
  lotThreshold: '70',
  hotThreshold: '60',
  ...DEFAULT_BLOOMS_THRESHOLDS,
  attainmentLevels: DEFAULT_ATTAINMENT_LEVELS,
  assignCourse: '',
  assignYear: '',
  assignGroup: '',
}
const COGNITIVE_LEVEL_OPTIONS = ['Apply', 'Remember', 'Understand', 'Analyze', 'Evaluate']
const THINKING_LEVEL_OPTIONS = ['HoT', 'LoT']
const DIFFICULTY_LEVEL_OPTIONS = ['L1', 'L2', 'L3']
const COGNITIVE_FUNCTION_OPTIONS = ['Attention & Cue Detection', 'Working Memory', 'Pattern Recognition', 'Judgement & Decision Making']
const SKILL_FOCUS_OPTIONS = ['Diagnosis', 'Investigation', 'Treatment', 'Management', 'Knowledge', 'Data Interpretation']
const ORGAN_SYSTEM_OPTIONS = ['Nervous', 'Cardiovascular', 'Respiratory', 'Digestive', 'Skeletal', 'Muscular', 'N/A']
const DEFAULT_OPTIONAL_TAG = 'Not Applicable'
const DISTRACTOR_ERROR_GROUPS = [
  {
    heading: 'Simple Errors',
    options: [
      'Factual Recall Error',
      'Terminology Confusion',
      'Misclassification',
      'Localization/Structural Error',
      'Visual Recognition Error',
      'Unit Error',
      'Outdated Knowledge',
      'False Association',
      'Careless Mistake',
      'Numerical Error',
      'Language Misinterpretation',
    ],
  },
  {
    heading: 'Applied Errors',
    options: [
      'Mechanism Confusion',
      'Sequential Ordering Error',
      'Chronicity/Staging Error',
      'Spatial Relationship Error',
      'Concept Gap',
      'Normalcy Bias',
      'Misinterpretation',
      'Cause-Effect Confusion',
      'Overgeneralization',
      'Superficial Match',
      'Data-Concept Mismatch',
    ],
  },
  {
    heading: 'Complex Errors',
    options: [
      'Reasoning Flaw',
      'Clinical Context Neglect',
      'Guideline Mismatch',
      'Misdiagnosis',
      'Diagnostic Criteria Incompleteness',
      'Contraindication Oversight',
      'Wrong Investigation Choice',
      'Treatment Misjudgment',
      'Prognosis Misinterpretation',
      'Cross-Discipline Confusion',
      'Incomplete Synthesis',
      'Failure to Prioritize',
      'Risk/Benefit Miscalculation',
      'Ethical/Professional Norm Violation',
    ],
  },
]
const SINGLE_OPTION_MIN_COUNT = 2
const SINGLE_OPTION_MAX_COUNT = 6
const MULTIPLE_OPTION_MIN_COUNT = 3
const MULTIPLE_OPTION_MAX_COUNT = 8
const ROMAN_NUMERALS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']
const QUESTION_TYPE_CARDS = [
  { type: 'MCQ', shortLabel: 'MCQ', icon: ListChecks },
  ...DESCRIPTIVE_QUESTION_TYPES.map((item) => ({ ...item, icon: FilePenLine })),
]

const createOption = (label = '') => createAuthoringOption({ idPrefix: 'assessment-option', label })

const toCapitalizedCase = (value) =>
  value.replace(/[A-Za-z]+/g, (word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)

function AssessmentSetupSelectField({ label, value, options, placeholder, onChange, className = '', required = false, disabled = false }) {
  return (
    <label className={`assessment-create-field ${className}`.trim()}>
      <span>{label}{required ? <em className="assessment-create-required-mark">*</em> : null}</span>
      <span className="assessment-create-select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
          <option value="">{placeholder || label}</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <ChevronDown size={16} strokeWidth={2.2} aria-hidden="true" />
      </span>
    </label>
  )
}

function TimeStepperSelect({ value, onChange, emptyLabel = '--:--', maxHour = 23, minHour = 0, period = '', onPeriodChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const match = String(value || '').match(/^(\d{1,2}):([0-5]\d)$/)
  const hour = match ? Number(match[1]) : minHour
  const minute = match ? Number(match[2]) : 0
  const displayValue = value ? `${value}${period ? ` ${period}` : ''}` : emptyLabel
  const [hourDraft, setHourDraft] = useState(String(hour).padStart(2, '0'))
  const [minuteDraft, setMinuteDraft] = useState(String(minute).padStart(2, '0'))

  useEffect(() => {
    if (!isOpen) return
    setHourDraft(String(hour).padStart(2, '0'))
    setMinuteDraft(String(minute).padStart(2, '0'))
  }, [isOpen])

  const setTimePart = (nextHour, nextMinute) => {
    const safeHour = Math.max(minHour, Math.min(maxHour, nextHour))
    const safeMinute = Math.max(0, Math.min(59, nextMinute))
    setHourDraft(String(safeHour).padStart(2, '0'))
    setMinuteDraft(String(safeMinute).padStart(2, '0'))
    onChange(`${String(safeHour).padStart(2, '0')}:${String(safeMinute).padStart(2, '0')}`)
  }

  const updateHourDraft = (rawValue) => {
    const nextDraft = rawValue.replace(/\D/g, '').slice(0, 2)
    setHourDraft(nextDraft)
    if (nextDraft) {
      const safeHour = Math.max(minHour, Math.min(maxHour, Number(nextDraft)))
      onChange(`${String(safeHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
    }
  }

  const updateMinuteDraft = (rawValue) => {
    const nextDraft = rawValue.replace(/\D/g, '').slice(0, 2)
    setMinuteDraft(nextDraft)
    if (nextDraft) {
      const safeMinute = Math.max(0, Math.min(59, Number(nextDraft)))
      onChange(`${String(hour).padStart(2, '0')}:${String(safeMinute).padStart(2, '0')}`)
    }
  }

  const commitDrafts = () => {
    setTimePart(Number(hourDraft || minHour), Number(minuteDraft || 0))
  }

  return (
    <span className="create-assessment-time-stepper">
      <button type="button" className="create-assessment-time-stepper-trigger" onClick={() => {
        if (disabled) return
        setIsOpen((current) => !current)
      }} aria-expanded={isOpen} disabled={disabled}>
        <Clock3 size={16} strokeWidth={2.2} aria-hidden="true" />
        <span>{displayValue}</span>
      </button>
      {isOpen ? (
        <span className="create-assessment-time-stepper-popover" role="dialog" aria-label="Select time">
          <span className="create-assessment-time-stepper-body">
            <span className="create-assessment-time-stepper-columns">
              <span className="create-assessment-time-stepper-column">
                <strong>Hours</strong>
                <button type="button" aria-label="Increase hours" onClick={() => setTimePart(hour + 1, minute)}>
                  <ChevronUp size={14} strokeWidth={2.4} />
                </button>
                <input
                  aria-label="Hours"
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={hourDraft}
                onFocus={(event) => event.target.select()}
                onChange={(event) => updateHourDraft(event.target.value)}
                onBlur={commitDrafts}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                }}
              />
                <button type="button" aria-label="Decrease hours" onClick={() => setTimePart(hour - 1, minute)}>
                  <ChevronDown size={14} strokeWidth={2.4} />
                </button>
              </span>
              <b aria-hidden="true">:</b>
              <span className="create-assessment-time-stepper-column">
                <strong>Minutes</strong>
                <button type="button" aria-label="Increase minutes" onClick={() => setTimePart(hour, minute + 1)}>
                  <ChevronUp size={14} strokeWidth={2.4} />
                </button>
                <input
                  aria-label="Minutes"
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={minuteDraft}
                onFocus={(event) => event.target.select()}
                onChange={(event) => updateMinuteDraft(event.target.value)}
                onBlur={commitDrafts}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                }}
              />
                <button type="button" aria-label="Decrease minutes" onClick={() => setTimePart(hour, minute - 1)}>
                  <ChevronDown size={14} strokeWidth={2.4} />
                </button>
              </span>
            </span>
            {onPeriodChange ? (
              <span className="create-assessment-time-stepper-period" role="group" aria-label="Select period">
                {['AM', 'PM'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={(period || 'AM') === option ? 'is-active' : ''}
                    onClick={() => onPeriodChange(option)}
                  >
                    {option}
                  </button>
                ))}
              </span>
            ) : null}
          </span>
          <span className="create-assessment-time-stepper-actions">
            <button type="button" onClick={() => {
              setHourDraft(String(minHour).padStart(2, '0'))
              setMinuteDraft('00')
              onChange('')
            }}>
              Clear
            </button>
            <button type="button" className="is-primary" onClick={() => {
              commitDrafts()
              setIsOpen(false)
            }}>
              Set
            </button>
          </span>
        </span>
      ) : null}
    </span>
  )
}

function StartTimeSelect({ value, period, onChange, onPeriodChange }) {
  return <TimeStepperSelect value={value} onChange={onChange} emptyLabel="--:--" minHour={1} maxHour={12} period={period} onPeriodChange={onPeriodChange} />
}

function DurationTimeSelect({ value, onChange, disabled = false, emptyLabel = '00:00' }) {
  return <TimeStepperSelect value={value} onChange={onChange} emptyLabel={emptyLabel} maxHour={12} disabled={disabled} />
}

const createDescriptiveInsideQuestion = (source = {}) => createAuthoringDescriptiveInsideQuestion({
  idPrefix: 'assessment-descriptive-inside',
  source,
})

const createDescriptiveSubQuestion = (source = {}) => createAuthoringDescriptiveSubQuestion({
  idPrefix: 'assessment-descriptive-sub',
  optionIdPrefix: 'assessment-option',
  source,
})

const createQuestion = (setup = {}, type = 'MCQ') => createAuthoringQuestion({
  idPrefix: 'assessment-question',
  optionIdPrefix: 'assessment-option',
  type,
  config: { year: setup.year || '' },
  defaultOptionalTag: DEFAULT_OPTIONAL_TAG,
})

const readCreateAssessmentSetup = () => {
  try {
    const row = JSON.parse(window.localStorage.getItem(CREATE_ASSESSMENT_SETUP_KEY) || '{}')
    return row && typeof row === 'object' ? { ...row, collegeName: DEFAULT_COLLEGE_NAME } : {}
  } catch {
    return {}
  }
}

const readCreateAssessmentInitialTab = () => {
  try {
    const tab = window.localStorage.getItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY)
    window.localStorage.removeItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY)
    return ['create', 'questionBank', 'preview', 'configuration'].includes(tab) ? tab : 'create'
  } catch {
    return 'create'
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

const getAssessmentSectionTitlesStorageKey = (setup = {}) => (
  `${CREATE_ASSESSMENT_SECTION_TITLES_KEY}:${getAssessmentStorageSuffix(setup)}`
)

const getAssessmentSectionOrderStorageKey = (setup = {}) => (
  `${CREATE_ASSESSMENT_SECTION_ORDER_KEY}:${getAssessmentStorageSuffix(setup)}`
)

const getAssessmentCustomSectionsStorageKey = (setup = {}) => (
  `${CREATE_ASSESSMENT_CUSTOM_SECTIONS_KEY}:${getAssessmentStorageSuffix(setup)}`
)

const readSavedAssessmentQuestions = (setup = {}) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(getAssessmentQuestionsStorageKey(setup)) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const readCreateAssessmentSectionTitles = (setup = {}) => {
  const defaults = PREVIEW_SECTION_CONFIG.reduce((titles, section) => ({
    ...titles,
    [section.key]: section.defaultTitle,
  }), {})

  try {
    const parsed = JSON.parse(window.localStorage.getItem(getAssessmentSectionTitlesStorageKey(setup)) || '{}')
    return parsed && typeof parsed === 'object' ? { ...defaults, ...parsed } : defaults
  } catch {
    return defaults
  }
}

const isCustomPreviewSectionKey = (key) => String(key ?? '').startsWith('custom-section-')

const readCreateAssessmentSectionOrder = (setup = {}) => {
  const defaultOrder = PREVIEW_SECTION_CONFIG.map((section) => section.key)
  try {
    const parsed = JSON.parse(window.localStorage.getItem(getAssessmentSectionOrderStorageKey(setup)) || '[]')
    if (!Array.isArray(parsed)) return defaultOrder
    const validKeys = parsed.filter((key) => PREVIEW_SECTION_KEY_SET.has(key) || isCustomPreviewSectionKey(key))
    return [...validKeys, ...defaultOrder.filter((key) => !validKeys.includes(key))]
  } catch {
    return defaultOrder
  }
}

const readCreateAssessmentCustomSections = (setup = {}) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(getAssessmentCustomSectionsStorageKey(setup)) || '[]')
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((section) => isCustomPreviewSectionKey(section?.key))
      .map((section) => ({
        key: section.key,
        defaultTitle: section.defaultTitle || 'New Section',
        title: section.title || section.defaultTitle || 'New Section',
        type: 'custom',
        isCustom: true,
      }))
  } catch {
    return []
  }
}

const readCreateAssessmentCustomExamCategories = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CREATE_ASSESSMENT_CUSTOM_EXAM_CATEGORIES_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

const readCreateAssessmentTemplates = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CREATE_ASSESSMENT_TEMPLATES_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.name) : []
  } catch {
    return []
  }
}

const readImageFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve({
    id: `assessment-image-${Date.now()}-${file.name}`,
    name: file.name,
    url: reader.result,
  })
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const toggleSelection = (items, value) => (
  items.includes(value) ? items.filter((item) => item !== value) : [...items, value]
)

const getRichTextPreview = (value) => stripHtml(value).trim()
const getQuestionTypeMeta = (type) => (
  QUESTION_TYPE_CARDS.find((item) => item.type === type)
  ?? (type === 'Descriptive Question' ? { type, shortLabel: 'SAQs', menuLabel: 'Descriptive SAQs' } : QUESTION_TYPE_CARDS[0])
)
const hasVisibleMarks = (marks) => Number(marks) > 0
const getAutoGeneratedDescriptiveMarks = () => '2'
const getAutoGeneratedDescriptiveAnswer = (questionText, marks = getAutoGeneratedDescriptiveMarks()) => {
  const preview = stripHtml(questionText).trim()
  return `<div>Expected answer for ${marks} marks: Address the key points required for "${preview || 'this question'}" with accurate terminology and a concise explanation.</div>`
}
const isDescriptiveLeafRowComplete = (row) => (
  Boolean(getRichTextPreview(row?.questionText))
  && (row?.competencies ?? []).length > 0
  && hasVisibleMarks(row?.marks)
  && Boolean(getRichTextPreview(row?.answerKey))
)
const isDescriptiveSectionComplete = (section) => {
  const children = Array.isArray(section?.children) ? section.children : []
  if (!getRichTextPreview(section?.questionText)) return false
  return children.length
    ? children.every(isDescriptiveLeafRowComplete)
    : isDescriptiveLeafRowComplete(section)
}
const isDescriptiveQuestionComplete = (question) => {
  const sections = question?.descriptiveSections ?? []
  if (!getRichTextPreview(question?.questionText)) return false
  return sections.length
    ? sections.every(isDescriptiveSectionComplete)
    : true
}
const getOptionModeConfig = (allowMultiple) => ({
  minCount: allowMultiple ? MULTIPLE_OPTION_MIN_COUNT : SINGLE_OPTION_MIN_COUNT,
  maxCount: allowMultiple ? MULTIPLE_OPTION_MAX_COUNT : SINGLE_OPTION_MAX_COUNT,
})
const getQuestionCategorySectionLabel = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'critical thinking' || normalized === 'critical_thinking' || normalized === 'aetcom') return 'Aetcom'
  if (normalized === 'application') return 'Application'
  if (normalized === 'direct') return 'Direct'
  if (normalized === 'reasoning') return 'Reasoning'
  return String(value ?? '').trim() || 'Direct'
}
const getNmcSaqSectionTitle = (label) => `${label} Answer Questions`
const getSelectionSummary = (items, emptyLabel, formatter = (value) => value) => (
  items.length ? items.map(formatter).join(', ') : emptyLabel
)
const SUMMARY_TYPE_ORDER = ['MCQ', 'SAQs', 'MEQs', 'LAQs']
const NMC_SAQ_CATEGORY_ORDER = ['Aetcom', 'Application', 'Direct', 'Reasoning']
const PREVIEW_SECTION_ROMAN_NUMERALS = ['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.', 'VIII.', 'IX.', 'X.']
const PREVIEW_SECTION_CONFIG = [
  { key: 'MCQ', roman: 'I.', defaultTitle: 'Multiple Choice Question', type: 'MCQ' },
  { key: 'SAQs', roman: 'II.', defaultTitle: 'Short Answer Questions', type: 'Desc Short Answer Questions (SAQs)' },
  { key: 'MEQs', roman: 'III.', defaultTitle: 'Modified Essay Questions', type: 'Desc Modified Essay Questions (MEQs)' },
  { key: 'LAQs', roman: 'IV.', defaultTitle: 'Long Answer Questions', type: 'Desc Long Answer Questions (LAQs)' },
]
const PREVIEW_SECTION_KEY_SET = new Set(PREVIEW_SECTION_CONFIG.map((section) => section.key))

const formatSummaryNumber = (value) => String(value).padStart(2, '0')

const getLocalDateInputValue = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateInputDisplay = (value) => {
  const [year, month, day] = String(value || '').split('-')
  return year && month && day ? `${day}/${month}/${year}` : 'DD/MM/YYYY'
}

const getTimeValueMinutes = (value) => {
  const match = String(value || '').match(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
  if (!match) return 0
  return Number(match[1]) * 60 + Number(match[2])
}

const formatDurationValue = (totalMinutes) => {
  const safeMinutes = Math.max(0, Number(totalMinutes) || 0)
  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const CONFIGURATION_ERROR_LABELS = {
  collegeName: 'Select College Name',
  assessmentName: 'Assessment Name',
  examCategory: 'Exam Category',
  academicYear: 'Academic Year',
  assignYear: 'Select Year',
  examDeliveryMode: 'Select Exam Mode',
  supervisionType: 'Supervision Type',
  approvalFlow: 'Sent to',
  examDate: 'Exam Date',
  startTime: 'Start Time',
  practiceStartDate: 'Start Date',
  practiceStartTime: 'Start Time',
  practiceEndDate: 'End Date',
  practiceEndTime: 'End Time',
  mcqStartTime: 'MCQ Start Time',
  descriptiveStartTime: 'Descriptive Start Time',
  mcqDisplayType: 'MCQ Display Type',
  descriptiveDisplayType: 'Descriptive Display Type',
  proctoredTotalDuration: 'Total Duration',
  mcqTimeLimit: 'MCQ Time Limit',
  descriptiveTimeLimit: 'Descriptive Time Limit',
  offlineDuration: 'Set Duration',
  lotThreshold: 'LoT Threshold',
  hotThreshold: 'HoT Threshold',
  applyThreshold: 'Apply Threshold',
  rememberThreshold: 'Remember Threshold',
  understandThreshold: 'Understand Threshold',
  analyzeThreshold: 'Analyze Threshold',
  evaluateThreshold: 'Evaluate Threshold',
  attainmentLevels: 'Attainment Levels',
}

const getConfigurationErrorMessage = (errors = {}) => {
  const firstKey = Object.keys(errors)[0]
  const label = CONFIGURATION_ERROR_LABELS[firstKey] || 'required fields'
  return `Please complete ${label}.`
}

const TIME_LIMIT_PATTERN = /^([0-1]\d|2[0-3]):([0-5]\d)$/
const START_TIME_PATTERN = /^(0?[1-9]|1[0-2]):([0-5]\d)$/

const getScheduledStartDate = (examDate, startTime, startPeriod) => {
  if (!examDate || !START_TIME_PATTERN.test(startTime || '')) return null
  const [, hourValue, minuteValue] = String(startTime).match(START_TIME_PATTERN)
  const [year, month, day] = examDate.split('-').map(Number)
  let hours = Number(hourValue) % 12
  if (startPeriod === 'PM') hours += 12
  return new Date(year, month - 1, day, hours, Number(minuteValue), 0, 0)
}

const isScheduledStartTooSoon = (examDate, startTime, startPeriod) => {
  const scheduledStartDate = getScheduledStartDate(examDate, startTime, startPeriod)
  const minimumStartDate = new Date(Date.now() + 5 * 60 * 1000)
  return Boolean(scheduledStartDate && scheduledStartDate < minimumStartDate)
}

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

const parseMarksValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getQuestionMarksTotal = (item) => {
  if (isDescriptiveQuestionType(item?.type)) {
    const sections = item.descriptiveSections ?? []
    const sectionMarks = sections.reduce((total, section) => {
      const children = Array.isArray(section.children) ? section.children : []
      const childMarks = children.reduce((sum, child) => sum + parseMarksValue(child.marks), 0)
      const ownMarks = children.length ? 0 : parseMarksValue(section.marks)
      return total + ownMarks + childMarks
    }, 0)

    const totalMarks = (sections.length ? 0 : parseMarksValue(item.marks)) + sectionMarks
    return totalMarks || (getPreviewQuestionText(item) ? 2 : 0)
  }

  if (item?.type === 'MCQ' && !parseMarksValue(item?.marks)) return 1
  return parseMarksValue(item?.marks)
}

const getFirstValue = (value) => (Array.isArray(value) ? value[0] : value)

const getPreviewQuestionText = (item) => (
  getRichTextPreview(item.questionText)
  || item.title
  || item.question
  || 'Untitled question'
)

const getPreviewCurriculumText = (item) => {
  const values = [
    item.year,
    item.subject,
    getFirstValue(item.topics),
    getFirstValue(item.competencies) ? getShortCompetencyLabel(getFirstValue(item.competencies)) : '',
  ].filter(Boolean)

  return values.length ? values.join(' / ') : 'Curriculum not selected'
}

const getDescriptiveCompetencyCode = (item) => (
  (item?.competencies ?? []).length ? getShortCompetencyLabel(item.competencies[0]) : ''
)

const getCorrectOptionTexts = (item) => (
  (item.options ?? [])
    .filter((option) => (item.correctOptionIds ?? []).includes(option.id))
    .map((option) => getRichTextPreview(option.label))
    .filter(Boolean)
)

const getThinkingBadgeClassName = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'hot') return 'assessment-page-thinking-hot'
  if (normalized === 'lot') return 'assessment-page-thinking-lot'
  return ''
}

const normalizeOptionalTagValues = (values) => {
  const cleanValues = (values ?? [])
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)

  return cleanValues.length ? cleanValues : [DEFAULT_OPTIONAL_TAG]
}

const hasGeneratedTagValues = (values) => (
  (values ?? []).some((value) => {
    const normalized = String(value ?? '').trim()
    return normalized && normalized !== DEFAULT_OPTIONAL_TAG
  })
)

const getQuestionOptionalTagGroups = (item) => [
  { label: 'Cognitive Function', values: item.cognitiveFunction ? [item.cognitiveFunction] : [] },
  { label: 'Skill Focus', values: item.skillFocus ? [item.skillFocus] : [] },
  { label: 'Organ System', values: item.organSystem ? [item.organSystem] : [] },
  { label: 'Organ Sub System', values: item.organSubSystems ?? [] },
  { label: 'Disease Tags', values: item.diseaseTags ?? [] },
  { label: 'Key Concept', values: item.keyConcepts ?? [] },
].map((group) => ({
  ...group,
  values: group.values.filter((value) => value && value !== DEFAULT_OPTIONAL_TAG),
})).filter((group) => group.values.length)

function MappingSelectorPanel({ title, searchValue, onSearchChange, items, selected, onToggle, emptyLabel }) {
  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredItems = items.filter((item) => item.toLowerCase().includes(normalizedSearch))

  return (
    <div className="question-bank-mapping-panel">
      <div className="question-bank-mapping-panel-head">
        <strong>{title}</strong>
        <span className="question-bank-mapping-selected-badge">{selected.length} selected</span>
      </div>
      <label className="question-bank-search">
        <Search size={14} strokeWidth={2.2} />
        <input value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} />
      </label>
      <div className="question-bank-mapping-results">
        {filteredItems.length ? filteredItems.map((item) => {
          const isActive = selected.includes(item)
          return (
            <button key={item} type="button" className={`question-bank-mapping-result ${isActive ? 'is-active' : ''}`} onClick={() => onToggle(item)}>
              <span>{isActive ? <Check size={12} strokeWidth={2.3} /> : null}</span>
              <strong>{item}</strong>
            </button>
          )
        }) : (
          <div className="question-bank-empty-state">{emptyLabel}</div>
        )}
      </div>
    </div>
  )
}

function OptionalTagTextInput({ label, values, onChange }) {
  const [draftValue, setDraftValue] = useState('')
  const selected = normalizeOptionalTagValues(values)

  const commitValue = (value = draftValue) => {
    const nextValue = value.trim()
    setDraftValue('')
    if (!nextValue) return

    const existingValues = selected.filter((item) => item !== DEFAULT_OPTIONAL_TAG)
    const hasDuplicate = existingValues.some((item) => item.toLowerCase() === nextValue.toLowerCase())
    if (hasDuplicate) return

    onChange([...existingValues, nextValue])
  }

  const removeValue = (value) => {
    const nextValues = selected.filter((item) => item !== value)
    onChange(normalizeOptionalTagValues(nextValues))
  }

  return (
    <div className="question-bank-optional-tag-field">
      <span className="question-bank-optional-tag-label">{label}</span>
      <div className="question-bank-optional-tag-input">
        <div className="question-bank-optional-tag-chips">
          {selected.map((value) => (
            <button key={value} type="button" onClick={() => removeValue(value)} aria-label={`Remove ${value}`}>
              {value}
              <X size={12} strokeWidth={2.4} />
            </button>
          ))}
        </div>
        <input
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          onBlur={() => commitValue()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              commitValue()
            }
          }}
          placeholder={`Type ${label.toLowerCase()}`}
        />
      </div>
    </div>
  )
}

export default function CreateAssessmentPage({ onNavigate, onSendToApproval, theme = 'light', onToggleTheme }) {
  const [setup, setSetup] = useState(() => ({
    ...CREATE_ASSESSMENT_DEFAULT_SETUP,
    ...readCreateAssessmentSetup(),
  }))
  const [setupDraft, setSetupDraft] = useState(() => ({
    ...CREATE_ASSESSMENT_DEFAULT_SETUP,
    ...readCreateAssessmentSetup(),
  }))
  const [customExamCategories, setCustomExamCategories] = useState(readCreateAssessmentCustomExamCategories)
  const [savedTemplates, setSavedTemplates] = useState(readCreateAssessmentTemplates)
  const [isExamCategoryTooltipOpen, setIsExamCategoryTooltipOpen] = useState(false)
  const [examCategoryDraft, setExamCategoryDraft] = useState('')
  const [isStudentInstructionsOpen, setIsStudentInstructionsOpen] = useState(false)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [publishedAssessmentNotice, setPublishedAssessmentNotice] = useState(null)
  const [approvalDraft, setApprovalDraft] = useState({
    facultyName: 'Dr. Meera Nair',
    employeeId: 'EMP1021',
    designation: 'Professor',
    note: '',
  })
  const studentInstructionsEditorRef = useRef(null)
  const [isConfigurationSummaryVisible, setIsConfigurationSummaryVisible] = useState(true)
  const [isThresholdSectionOpen, setIsThresholdSectionOpen] = useState(false)
  const [isAssignSectionOpen, setIsAssignSectionOpen] = useState(true)
  const [isResultPublishSectionOpen, setIsResultPublishSectionOpen] = useState(false)
  const [isConfigurationChecklistOpen, setIsConfigurationChecklistOpen] = useState(false)
  const [setupErrors, setSetupErrors] = useState({})
  const [question, setQuestion] = useState(null)
  const assessmentQuestionsStorageKey = getAssessmentQuestionsStorageKey(setup)
  const assessmentSectionTitlesStorageKey = getAssessmentSectionTitlesStorageKey(setup)
  const assessmentSectionOrderStorageKey = getAssessmentSectionOrderStorageKey(setup)
  const assessmentCustomSectionsStorageKey = getAssessmentCustomSectionsStorageKey(setup)
  const [savedQuestions, setSavedQuestions] = useState(() => readSavedAssessmentQuestions(setup))
  const [isQuestionTypePickerOpen, setIsQuestionTypePickerOpen] = useState(false)
  const [isDescriptiveTypePickerOpen, setIsDescriptiveTypePickerOpen] = useState(false)
  const [isActionQuestionTypePickerOpen, setIsActionQuestionTypePickerOpen] = useState(false)
  const [isActionDescriptiveTypePickerOpen, setIsActionDescriptiveTypePickerOpen] = useState(false)
  const [activeMappingPicker, setActiveMappingPicker] = useState(null)
  const [mappingSearchValue, setMappingSearchValue] = useState('')
  const [isOptionalTagsOpen, setIsOptionalTagsOpen] = useState(false)
  const [openDistractorOptionId, setOpenDistractorOptionId] = useState(null)
  const [openDistractorMenuOptionId, setOpenDistractorMenuOptionId] = useState(null)
  const [openPreviewTagsId, setOpenPreviewTagsId] = useState(null)
  const [openPreviewCardIds, setOpenPreviewCardIds] = useState([])
  const [saveStatus, setSaveStatus] = useState('')
  const [activeCreateTab, setActiveCreateTab] = useState(readCreateAssessmentInitialTab)
  const [hasSelectedCreateTab, setHasSelectedCreateTab] = useState(false)
  const isPublishedEditMode = Boolean(setupDraft.isPublishedEdit || setupDraft.sourcePublishedId || setup.isPublishedEdit || setup.sourcePublishedId)
  const [selectedCreateQuestionTypeLabel, setSelectedCreateQuestionTypeLabel] = useState('')
  const [editingPreviewQuestionId, setEditingPreviewQuestionId] = useState(null)
  const [previewSectionTitles, setPreviewSectionTitles] = useState(() => readCreateAssessmentSectionTitles(setup))
  const [previewSectionOrder, setPreviewSectionOrder] = useState(() => readCreateAssessmentSectionOrder(setup))
  const [customPreviewSections, setCustomPreviewSections] = useState(() => readCreateAssessmentCustomSections(setup))
  const [editingPreviewSectionKey, setEditingPreviewSectionKey] = useState(null)
  const [previewSectionTitleDraft, setPreviewSectionTitleDraft] = useState('')
  const [draggedPreviewQuestionId, setDraggedPreviewQuestionId] = useState(null)
  const [draggedPreviewSectionKey, setDraggedPreviewSectionKey] = useState(null)
  const [generationJobs, setGenerationJobs] = useState([])
  const [generationTick, setGenerationTick] = useState(Date.now())
  const [descriptiveCompetencyDraft, setDescriptiveCompetencyDraft] = useState(null)
  const generationTimersRef = useRef(new Map())
  const publishNoticeTimerRef = useRef(null)
  const isGeneratingQuestion = generationJobs.length > 0

  const headerSetup = setupDraft ?? setup
  const detailItems = [headerSetup.collegeName, headerSetup.academicYear, headerSetup.examCategory, headerSetup.course, headerSetup.year].filter(Boolean)
  const examCategoryOptions = useMemo(() => (
    [...CREATE_ASSESSMENT_SELECT_OPTIONS.examCategories, ...customExamCategories]
      .filter((item, index, items) => items.findIndex((current) => current.toLowerCase() === item.toLowerCase()) === index)
  ), [customExamCategories])
  const subjectDirectory = question ? SUBJECT_DIRECTORY[question.subject] ?? null : null
  const competencyOptions = (subjectDirectory?.competencies ?? [])
    .filter((item) => !question?.topics.length || question.topics.includes(item.topic))
    .map((item) => item.value)

  const activeMappingItems = useMemo(() => {
    if (activeMappingPicker === 'years') return YEAR_OPTIONS
    if (activeMappingPicker === 'subjects') return Object.keys(SUBJECT_DIRECTORY)
    if (activeMappingPicker === 'topics') return subjectDirectory?.topics ?? []
    if (activeMappingPicker === 'competencies') return competencyOptions
    return []
  }, [activeMappingPicker, competencyOptions, subjectDirectory])

  const activeMappingSelected = activeMappingPicker === 'years'
    ? question?.year ? [question.year] : []
    : activeMappingPicker === 'subjects'
      ? question?.subject ? [question.subject] : []
      : activeMappingPicker === 'topics'
        ? question?.topics ?? []
        : activeMappingPicker === 'competencies'
          ? question?.competencies ?? []
          : []

  useEffect(() => {
    if (!descriptiveCompetencyDraft) return undefined

    const syncTooltipPosition = () => {
      setDescriptiveCompetencyDraft((current) => (
        current?.anchorElement
          ? { ...current, position: getDescriptiveTooltipPosition(current.anchorElement, Boolean(current.openDropdown)) }
          : current
      ))
    }

    const closeOnOutsideAction = (event) => {
      if (event.key && event.key !== 'Escape') return
      if (!event.key) {
        const target = event.target
        if (target?.closest?.('.question-bank-descriptive-map-popover, .question-bank-descriptive-competency-btn, .question-bank-descriptive-competency-chip')) {
          return
        }
      }
      closeDescriptiveCompetencyTooltip()
    }

    document.addEventListener('pointerdown', closeOnOutsideAction)
    document.addEventListener('keydown', closeOnOutsideAction)
    window.addEventListener('scroll', syncTooltipPosition, true)
    window.addEventListener('resize', syncTooltipPosition)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideAction)
      document.removeEventListener('keydown', closeOnOutsideAction)
      window.removeEventListener('scroll', syncTooltipPosition, true)
      window.removeEventListener('resize', syncTooltipPosition)
    }
  }, [descriptiveCompetencyDraft])

  const updateSetupDraft = (field, value) => {
    setSetupDraft((current) => ({ ...current, [field]: value }))
    setSetupErrors((current) => {
      if (!current[field]) return current
      const { [field]: _removed, ...rest } = current
      return rest
    })
  }

  const getResultPublishDefaults = (supervisionType) => (
    supervisionType === 'Practice Exam'
      ? { mcqAutoPublish: 'On', descriptiveEvaluationRequired: 'No' }
      : { mcqAutoPublish: 'Off', descriptiveEvaluationRequired: 'Yes' }
  )

  const normalizeResultPublishSettings = (draft) => {
    const nextDraft = { ...draft }
    if (nextDraft.supervisionType === 'Proctored Exams') {
      nextDraft.mcqAutoPublish = 'Off'
      nextDraft.descriptiveEvaluationRequired = 'Yes'
    }
    return nextDraft
  }

  const updateSupervisionType = (value) => {
    setSetupDraft((current) => normalizeResultPublishSettings({
      ...current,
      supervisionType: value,
      ...getResultPublishDefaults(value),
    }))
    setSetupErrors((current) => {
      const {
        examDate: _examDate,
        practiceStartDate: _practiceStartDate,
        practiceStartTime: _practiceStartTime,
        practiceEndDate: _practiceEndDate,
        practiceEndTime: _practiceEndTime,
        mcqStartTime: _mcqStartTime,
        descriptiveStartTime: _descriptiveStartTime,
        mcqTimeLimit: _mcq,
        descriptiveTimeLimit: _descriptive,
        proctoredTotalDuration: _proctoredTotalDuration,
        mcqDisplayType: _mcqDisplayType,
        descriptiveDisplayType: _descriptiveDisplayType,
        supervisionType: _supervisionType,
        ...rest
      } = current
      return rest
    })
  }

  const updateDisplayType = (field, value) => {
    setSetupDraft((current) => normalizeResultPublishSettings({
      ...current,
      [field]: value,
    }))
    setSetupErrors((current) => {
      const { [field]: removed, ...rest } = current
      return rest
    })
  }

  useEffect(() => {
    if (setupDraft.descriptiveDisplayType === 'Read-Only') return
    setSetupDraft((current) => ({ ...current, descriptiveDisplayType: 'Read-Only' }))
  }, [setupDraft.descriptiveDisplayType])

  const validatePublicationHeaderDraft = (draft = setupDraft) => {
    const errors = {}
    if (!draft.collegeName) errors.collegeName = 'Select college name.'
    if (!String(draft.assessmentName || '').trim()) errors.assessmentName = 'Enter assessment name.'
    if (!draft.examCategory) errors.examCategory = 'Select exam category.'
    if (!draft.academicYear) errors.academicYear = 'Select academic year.'
    return errors
  }

  const updateThinkingThresholdMode = (value) => {
    setSetupDraft((current) => {
      const nextDraft = { ...current, thinkingThresholdMode: value }
      if (value === 'blooms') {
        BLOOMS_THRESHOLD_FIELDS.forEach((field) => {
          if (!String(nextDraft[field.key] || '').trim()) {
            nextDraft[field.key] = DEFAULT_BLOOMS_THRESHOLDS[field.key]
          }
        })
      }
      return nextDraft
    })
    setSetupErrors((current) => {
      const {
        lotThreshold: _lot,
        hotThreshold: _hot,
        applyThreshold: _apply,
        rememberThreshold: _remember,
        understandThreshold: _understand,
        analyzeThreshold: _analyze,
        evaluateThreshold: _evaluate,
        ...rest
      } = current
      return rest
    })
  }

  useEffect(() => {
    if (!isStudentInstructionsOpen) return
    const editor = studentInstructionsEditorRef.current
    if (editor && editor.innerHTML !== (setupDraft.studentInstructions ?? '')) {
      editor.innerHTML = setupDraft.studentInstructions ?? ''
    }
  }, [isStudentInstructionsOpen, setupDraft.studentInstructions])

  const emitStudentInstructionsChange = () => {
    updateSetupDraft('studentInstructions', studentInstructionsEditorRef.current?.innerHTML ?? '')
  }

  const runStudentInstructionCommand = (command, value = null) => {
    studentInstructionsEditorRef.current?.focus()
    document.execCommand(command, false, value)
    emitStudentInstructionsChange()
  }

  const updateAttainmentLevel = (rowId, field, value) => {
    const nextValue = field === 'level'
      ? value.slice(0, 32)
      : value.replace(/[^\d]/g, '').slice(0, 3)
    setSetupDraft((current) => ({
      ...current,
      attainmentLevels: (current.attainmentLevels ?? DEFAULT_ATTAINMENT_LEVELS).map((row) => (
        row.id === rowId ? { ...row, [field]: nextValue } : row
      )),
    }))
    setSetupErrors((current) => {
      if (!current.attainmentLevels) return current
      const { attainmentLevels: _removed, ...rest } = current
      return rest
    })
  }

  const addAttainmentLevel = () => {
    setSetupDraft((current) => ({
      ...current,
      attainmentLevels: [
        ...(current.attainmentLevels ?? DEFAULT_ATTAINMENT_LEVELS),
        { id: `attainment-${Date.now()}`, minPercentage: '', maxPercentage: '', level: '' },
      ],
    }))
  }

  const deleteAttainmentLevel = (rowId) => {
    setSetupDraft((current) => {
      const rows = current.attainmentLevels ?? DEFAULT_ATTAINMENT_LEVELS
      if (rows.length <= 1) return current
      return {
        ...current,
        attainmentLevels: rows.filter((row) => row.id !== rowId),
      }
    })
  }

  const resetAttainmentLevelsToDefault = () => {
    setSetupDraft((current) => ({
      ...current,
      attainmentLevels: DEFAULT_ATTAINMENT_LEVELS.map((row) => ({ ...row })),
    }))
    setSetupErrors((current) => {
      if (!current.attainmentLevels) return current
      const { attainmentLevels: _removed, ...rest } = current
      return rest
    })
  }

  const resetThinkingThresholdsToDefault = () => {
    setSetupDraft((current) => ({
      ...current,
      thinkingThresholdMode: 'hotlot',
      lotThreshold: '70',
      hotThreshold: '60',
      ...DEFAULT_BLOOMS_THRESHOLDS,
    }))
    setSetupErrors((current) => {
      const {
        lotThreshold: _lot,
        hotThreshold: _hot,
        applyThreshold: _apply,
        rememberThreshold: _remember,
        understandThreshold: _understand,
        analyzeThreshold: _analyze,
        evaluateThreshold: _evaluate,
        ...rest
      } = current
      return rest
    })
  }

  const validateSetupDraft = (draft = setupDraft) => {
    const errors = {}
    const todayValue = getLocalDateInputValue()
    const mode = draft.examDeliveryMode || 'Online'

    if (!draft.collegeName) errors.collegeName = 'Select college name.'
    if (!String(draft.assessmentName || '').trim()) errors.assessmentName = 'Enter assessment name.'
    if (!draft.examCategory) errors.examCategory = 'Select exam category.'
    if (!draft.academicYear) errors.academicYear = 'Select academic year.'
    if (!draft.assignYear) errors.assignYear = 'Select year.'
    if (!draft.examDeliveryMode) errors.examDeliveryMode = 'Select exam mode.'
    if (!draft.supervisionType) errors.supervisionType = 'Select supervision type.'
    if (!draft.approvalFlow) errors.approvalFlow = 'Select send option.'
    const hasMcqQuestions = savedQuestions.some((item) => item.type === 'MCQ')
    const hasDescriptiveQuestions = savedQuestions.some((item) => isDescriptiveQuestionType(item.type))
    if (mode === 'Online') {
      if (draft.supervisionType === 'Practice Exam') {
        if (!draft.practiceStartDate) {
          errors.practiceStartDate = 'Select start date.'
        } else if (draft.practiceStartDate < todayValue) {
          errors.practiceStartDate = 'Previous dates are not allowed.'
        }
        if (!START_TIME_PATTERN.test(draft.practiceStartTime || '')) {
          errors.practiceStartTime = 'Enter start time in HH:MM format.'
        } else if (isScheduledStartTooSoon(draft.practiceStartDate, draft.practiceStartTime, draft.practiceStartPeriod)) {
          errors.practiceStartTime = 'Start time must be at least 5 minutes from current time.'
        }
        if (!draft.practiceEndDate) {
          errors.practiceEndDate = 'Select end date.'
        } else if (draft.practiceEndDate < todayValue) {
          errors.practiceEndDate = 'Previous dates are not allowed.'
        }
        if (!START_TIME_PATTERN.test(draft.practiceEndTime || '')) {
          errors.practiceEndTime = 'Enter end time in HH:MM format.'
        }
        const practiceStart = getScheduledStartDate(draft.practiceStartDate, draft.practiceStartTime, draft.practiceStartPeriod)
        const practiceEnd = getScheduledStartDate(draft.practiceEndDate, draft.practiceEndTime, draft.practiceEndPeriod)
        if (practiceStart && practiceEnd && practiceEnd <= practiceStart) {
          errors.practiceEndTime = 'End time must be after start time.'
        }
        if (hasMcqQuestions && !draft.mcqDisplayType) errors.mcqDisplayType = 'Select MCQ display type.'
        if (hasDescriptiveQuestions && draft.descriptiveDisplayType !== 'Read-Only') errors.descriptiveDisplayType = 'Descriptive must be Read-Only.'
      } else {
        if (!draft.examDate) {
          errors.examDate = 'Select exam date.'
        } else if (draft.examDate < todayValue) {
          errors.examDate = 'Previous dates are not allowed.'
        }
        if (!START_TIME_PATTERN.test(draft.startTime || '')) {
          errors.startTime = 'Enter start time in HH:MM format.'
        } else if (isScheduledStartTooSoon(draft.examDate, draft.startTime, draft.startPeriod)) {
          errors.startTime = 'Start time must be at least 5 minutes from current time.'
        }
        if (!TIME_LIMIT_PATTERN.test(draft.proctoredTotalDuration || '') || getTimeValueMinutes(draft.proctoredTotalDuration) <= 0) {
          errors.proctoredTotalDuration = 'Enter total duration as HH:MM.'
        }
        if (hasMcqQuestions) {
          if (String(draft.mcqTimeLimit || '').trim() && !TIME_LIMIT_PATTERN.test(draft.mcqTimeLimit || '')) errors.mcqTimeLimit = 'Enter MCQ time limit as HH:MM.'
          if (!draft.mcqDisplayType) errors.mcqDisplayType = 'Select MCQ display type.'
        }
        if (hasDescriptiveQuestions) {
          if (String(draft.descriptiveTimeLimit || '').trim() && !TIME_LIMIT_PATTERN.test(draft.descriptiveTimeLimit || '')) errors.descriptiveTimeLimit = 'Enter descriptive time limit as HH:MM.'
          if (draft.descriptiveDisplayType !== 'Read-Only') errors.descriptiveDisplayType = 'Descriptive must be Read-Only.'
        }
        if (
          TIME_LIMIT_PATTERN.test(draft.proctoredTotalDuration || '')
          && TIME_LIMIT_PATTERN.test(draft.mcqTimeLimit || '')
          && TIME_LIMIT_PATTERN.test(draft.descriptiveTimeLimit || '')
          && hasMcqQuestions
          && hasDescriptiveQuestions
          && draft.splitProctoredDuration
          && getTimeValueMinutes(draft.mcqTimeLimit) + getTimeValueMinutes(draft.descriptiveTimeLimit) !== getTimeValueMinutes(draft.proctoredTotalDuration)
        ) {
          errors.proctoredTotalDuration = 'MCQ and descriptive duration must match Total Duration.'
        }
      }
    } else {
      if (!draft.examDate) {
        errors.examDate = 'Select exam date.'
      } else if (draft.examDate < todayValue) {
        errors.examDate = 'Previous dates are not allowed.'
      }
      if (!START_TIME_PATTERN.test(draft.startTime || '')) {
        errors.startTime = 'Enter start time in HH:MM format.'
      } else if (isScheduledStartTooSoon(draft.examDate, draft.startTime, draft.startPeriod)) {
        errors.startTime = 'Start time must be at least 5 minutes from current time.'
      }
      if (!TIME_LIMIT_PATTERN.test(draft.offlineDuration || '')) {
        errors.offlineDuration = 'Enter duration as HH:MM.'
      }
    }

    if ((draft.thinkingThresholdMode || 'hotlot') === 'blooms') {
      BLOOMS_THRESHOLD_FIELDS.forEach((field) => {
        if (!String(draft[field.key] || '').trim()) {
          errors[field.key] = `Enter ${field.label} threshold.`
        } else if (Number(draft[field.key]) < 0 || Number(draft[field.key]) > 100) {
          errors[field.key] = `${field.label} threshold must be 0 to 100.`
        }
      })
    } else {
      if (!String(draft.lotThreshold || '').trim()) {
        errors.lotThreshold = 'Enter LoT threshold.'
      } else if (Number(draft.lotThreshold) < 0 || Number(draft.lotThreshold) > 100) {
        errors.lotThreshold = 'LoT threshold must be 0 to 100.'
      }

      if (!String(draft.hotThreshold || '').trim()) {
        errors.hotThreshold = 'Enter HoT threshold.'
      } else if (Number(draft.hotThreshold) < 0 || Number(draft.hotThreshold) > 100) {
        errors.hotThreshold = 'HoT threshold must be 0 to 100.'
      }
    }

    const attainmentRows = draft.attainmentLevels ?? []
    if (!attainmentRows.length || attainmentRows.some((row) => (
      !String(row.minPercentage || '').trim()
      || !String(row.maxPercentage || '').trim()
      || !String(row.level || '').trim()
      || Number(row.minPercentage) < 0
      || Number(row.maxPercentage) > 100
      || Number(row.minPercentage) > Number(row.maxPercentage)
    ))) {
      errors.attainmentLevels = 'Complete valid attainment level rows.'
    }

    return errors
  }

  const clearExamCategoryDraft = () => {
    setExamCategoryDraft('')
  }

  const addExamCategoryOption = () => {
    const nextCategory = toCapitalizedCase(examCategoryDraft.trim())
    if (!nextCategory) return

    const alreadyExists = examCategoryOptions.some((item) => item.toLowerCase() === nextCategory.toLowerCase())
    const nextCustomCategories = alreadyExists
      ? customExamCategories
      : [...customExamCategories, nextCategory]

    if (!alreadyExists) {
      setCustomExamCategories(nextCustomCategories)
      window.localStorage.setItem(CREATE_ASSESSMENT_CUSTOM_EXAM_CATEGORIES_KEY, JSON.stringify(nextCustomCategories))
    }

    updateSetupDraft('examCategory', alreadyExists
      ? examCategoryOptions.find((item) => item.toLowerCase() === nextCategory.toLowerCase()) ?? nextCategory
      : nextCategory)
    setExamCategoryDraft('')
    setIsExamCategoryTooltipOpen(false)
  }

  const clearSetupDraft = () => {
    setSetupDraft({
      ...CREATE_ASSESSMENT_DEFAULT_SETUP,
      assessmentId: setup.assessmentId,
      createdAt: setup.createdAt,
    })
  }

  const uploadSetupLogo = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setSetupDraft((current) => ({
        ...current,
        logoName: file.name,
        logoPreview: String(reader.result ?? ''),
      }))
    }
    reader.readAsDataURL(file)
  }

  const removeSetupLogo = () => {
    setSetupDraft((current) => ({
      ...current,
      logoName: '',
      logoPreview: '',
    }))
  }

  const persistSetupDraft = (nextStatus = 'Configuration saved') => {
    const nextSetup = {
      ...setupDraft,
      assessmentId: setupDraft.assessmentId || setup.assessmentId || `assessment-${Date.now()}`,
      createdAt: setupDraft.createdAt || setup.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify(nextSetup))
    setSetup(nextSetup)
    setSetupDraft(nextSetup)
    setSaveStatus(nextStatus)
    setIsConfigurationSummaryVisible(true)
    return nextSetup
  }

  const saveAssessmentTemplate = () => {
    const errors = validateSetupDraft()
    setSetupErrors(errors)
    if (Object.keys(errors).length) {
      setSaveStatus(getConfigurationErrorMessage(errors))
      return
    }

    const nextSetup = persistSetupDraft('Template saved')
    const templateName = String(nextSetup.assessmentName || '').trim()
    const templateId = templateName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `template-${Date.now()}`
    const template = {
      id: templateId,
      name: templateName,
      setup: nextSetup,
      savedAt: new Date().toISOString(),
    }
    const nextTemplates = [
      template,
      ...savedTemplates.filter((item) => item.id !== templateId),
    ]
    window.localStorage.setItem(CREATE_ASSESSMENT_TEMPLATES_KEY, JSON.stringify(nextTemplates))
    setSavedTemplates(nextTemplates)
  }

  const loadAssessmentTemplate = (templateId) => {
    const template = savedTemplates.find((item) => item.id === templateId)
    if (!template) return

    const nextSetup = {
      ...CREATE_ASSESSMENT_DEFAULT_SETUP,
      ...(template.setup ?? {}),
      updatedAt: new Date().toISOString(),
    }
    setSetup(nextSetup)
    setSetupDraft(nextSetup)
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify(nextSetup))

    setSetupErrors({})
    setIsConfigurationSummaryVisible(true)
    setSaveStatus('Template loaded')
  }

  const getPublishedAssessmentRecord = (nextSetup) => {
    const assessmentName = String(nextSetup.assessmentName || '').trim() || 'Untitled Assessment'
    const assignmentTarget = String(nextSetup.assignGroup || '').trim()
      || String(nextSetup.assignYear || '').trim()
      || 'Not assigned'
    const publishedAt = new Date().toISOString()

    return {
      id: nextSetup.assessmentId || `assessment-${Date.now()}`,
      assessmentName,
      examMode: nextSetup.examDeliveryMode || 'Online',
      assignTo: assignmentTarget,
      supervisionType: nextSetup.supervisionType || 'Not set',
      totalMarks: assessmentSummary.totalMarks,
      examCategory: nextSetup.examCategory || 'Not set',
      examType: configurationQuestionSummary.examType,
      startDate: nextSetup.examDeliveryMode === 'Offline' ? nextSetup.examDate : (nextSetup.supervisionType === 'Practice Exam' ? nextSetup.practiceStartDate : nextSetup.examDate),
      startTime: nextSetup.examDeliveryMode === 'Offline'
        ? [nextSetup.startTime, nextSetup.startPeriod].filter(Boolean).join(' ')
        : nextSetup.supervisionType === 'Practice Exam'
          ? [nextSetup.practiceStartTime, nextSetup.practiceStartPeriod].filter(Boolean).join(' ')
          : [nextSetup.startTime, nextSetup.startPeriod].filter(Boolean).join(' '),
      totalDuration: configurationDurationLabel,
      endDate: nextSetup.supervisionType === 'Practice Exam' ? nextSetup.practiceEndDate : '',
      createdAt: nextSetup.createdAt || new Date().toISOString(),
      publishedAt,
      publishedLog: [{
        facultyId: 'MC2568',
        facultyName: 'Karthik Subramanian',
        remarks: 'Assessment published',
        timestamp: publishedAt,
      }],
      questionCount: assessmentSummary.totalQuestions,
      questionRows: savedQuestions,
      setup: nextSetup,
    }
  }

  const getPublishedAssessmentChangeRemarks = (previousRecord, nextRecord) => {
    if (!previousRecord) return 'Assessment published'

    const trackedFields = [
      ['Assessment Name', previousRecord.assessmentName, nextRecord.assessmentName],
      ['Exam Mode', previousRecord.examMode, nextRecord.examMode],
      ['Assign To', previousRecord.assignTo, nextRecord.assignTo],
      ['Supervision Type', previousRecord.supervisionType, nextRecord.supervisionType],
      ['Total Marks', previousRecord.totalMarks, nextRecord.totalMarks],
      ['Exam Category', previousRecord.examCategory, nextRecord.examCategory],
      ['Exam Type', previousRecord.examType, nextRecord.examType],
      ['Start Date', previousRecord.startDate, nextRecord.startDate],
      ['Start Time', previousRecord.startTime, nextRecord.startTime],
      ['Total Duration', previousRecord.totalDuration, nextRecord.totalDuration],
      ['End Date', previousRecord.endDate, nextRecord.endDate],
      ['No. of Questions', previousRecord.questionCount, nextRecord.questionCount],
    ]

    const changes = trackedFields
      .filter(([, previousValue, nextValue]) => String(previousValue ?? '').trim() !== String(nextValue ?? '').trim())
      .map(([label, previousValue, nextValue]) => `${label}: ${previousValue || '-'} to ${nextValue || '-'}`)

    if (!changes.length) return 'Assessment republished with no configuration changes'
    return `Edited: ${changes.slice(0, 4).join('; ')}${changes.length > 4 ? `; +${changes.length - 4} more` : ''}`
  }

  const upsertPublishedAssessment = (record) => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(ASSESSMENT_PUBLISHED_STORAGE_KEY) || '[]')
      const rows = Array.isArray(parsed) ? parsed : []
      const existingRecord = rows.find((item) => item.id === record.id)
      const existingLog = Array.isArray(existingRecord?.publishedLog) ? existingRecord.publishedLog : []
      const nextLog = Array.isArray(record.publishedLog) ? record.publishedLog : []
      const changeRemarks = getPublishedAssessmentChangeRemarks(existingRecord, record)
      const nextRecord = {
        ...record,
        publishedLog: [
          ...nextLog.map((item) => ({
            ...item,
            remarks: changeRemarks,
          })),
          ...existingLog,
        ],
      }
      const nextRows = [
        nextRecord,
        ...rows.filter((item) => item.id !== record.id),
      ]
      window.localStorage.setItem(ASSESSMENT_PUBLISHED_STORAGE_KEY, JSON.stringify(nextRows))
    } catch {
      window.localStorage.setItem(ASSESSMENT_PUBLISHED_STORAGE_KEY, JSON.stringify([record]))
    }
  }

  const showPublishedAssessmentNotice = (record) => {
    if (publishNoticeTimerRef.current) {
      window.clearTimeout(publishNoticeTimerRef.current)
    }
    setPublishedAssessmentNotice(record)
    publishNoticeTimerRef.current = window.setTimeout(() => {
      setPublishedAssessmentNotice(null)
      publishNoticeTimerRef.current = null
      window.localStorage.setItem(ASSESSMENT_CREATE_INITIAL_TAB_KEY, 'published')
      onNavigate?.(APP_PAGES.ASSESSMENT_CREATE)
    }, 2000)
  }

  const publishAssessmentDirectly = () => {
    const nextSetup = persistSetupDraft('')
    const record = getPublishedAssessmentRecord(nextSetup)
    upsertPublishedAssessment(record)
    setSaveStatus('')
    showPublishedAssessmentNotice({
      ...record,
      noticeType: isPublishedEditMode ? 'update' : 'publish',
    })
  }

  const openApprovalModal = () => {
    const errors = validateSetupDraft()
    setSetupErrors(errors)
    if (Object.keys(errors).length) {
      setSaveStatus(getConfigurationErrorMessage(errors))
      return
    }
    if (!savedQuestions.length || !previewSections.length) {
      setSaveStatus('Add questions in Preview before sending to approval.')
      return
    }

    if (setupDraft.approvalFlow === 'Direct Publish') {
      publishAssessmentDirectly()
      return
    }

    setIsApprovalModalOpen(true)
  }

  const sendAssessmentToApproval = () => {
    const nextSetup = persistSetupDraft('Sent to approval')
    const assessmentName = String(nextSetup.assessmentName || '').trim() || 'Untitled Assessment'
    const assignmentTarget = String(nextSetup.assignGroup || '').trim()
      || String(nextSetup.assignYear || '').trim()
      || 'Not assigned'

    onSendToApproval?.({
      activityId: `assessment-${nextSetup.assessmentId || Date.now()}`,
      activityName: assessmentName,
      activityType: 'Assessment',
      approvalStatus: 'Pending Approval',
      status: 'Pending Approval',
      assessmentName,
      assessmentMode: nextSetup.examDeliveryMode || 'Online',
      examCategory: nextSetup.examCategory || 'Not set',
      academicYear: nextSetup.academicYear || 'Not set',
      assignTo: assignmentTarget,
      year: nextSetup.assignYear || nextSetup.year || 'Not set',
      sgt: nextSetup.assignGroup || 'Not set',
      examDate: nextSetup.examDate || 'Not set',
      startTime: [nextSetup.startTime, nextSetup.startPeriod].filter(Boolean).join(' ') || 'Not set',
      examType: configurationQuestionSummary.examType,
      totalMarks: assessmentSummary.totalMarks,
      totalMarksDetail: configurationQuestionSummary.totalMarksDetail,
      duration: configurationDurationLabel,
      questionCount: assessmentSummary.totalQuestions,
      questionRows: savedQuestions,
      previewSections,
      setup: nextSetup,
      approvalFaculty: approvalDraft,
    })
    setIsApprovalModalOpen(false)
  }

  const hasQuestionText = Boolean(getRichTextPreview(question?.questionText ?? ''))
  const isMcqQuestion = question?.type === 'MCQ'
  const isDescriptiveCurrentQuestion = isDescriptiveQuestionType(question?.type)
  const currentDescriptiveSections = question?.descriptiveSections ?? []
  const requiredProgress = [
    Boolean(question?.year),
    Boolean(question?.subject),
    (question?.topics ?? []).length > 0,
    (question?.competencies ?? []).length > 0,
    hasQuestionText,
    isDescriptiveCurrentQuestion ? true : (question?.correctOptionIds ?? []).length > 0,
  ].filter(Boolean).length
  const canCreate = isMcqQuestion
    ? hasQuestionText
    : isDescriptiveCurrentQuestion
      ? isDescriptiveQuestionComplete(question)
      : requiredProgress === 6 && (question?.options ?? []).slice(0, 2).every((option) => getRichTextPreview(option.label))
  const activeGenerationJob = generationJobs[0] ?? null
  const generationElapsed = activeGenerationJob ? Math.max(0, generationTick - activeGenerationJob.startedAt) : 0
  const generationPercent = activeGenerationJob
    ? Math.min(99, Math.max(4, Math.round((generationElapsed / 15000) * 100)))
    : 0
  const generationRunningText = generationPercent < 25
    ? 'Reading question text...'
    : generationPercent < 50
      ? activeGenerationJob?.isDescriptive ? 'Mapping tags and marks...' : 'Preparing distractors...'
      : generationPercent < 75
        ? 'Filling tags and answer...'
        : 'Adding question to preview...'
  const generationQueueLabel = generationJobs.length ? `Generating 1/${generationJobs.length}` : ''
  const selectedQuestionTypeLabel = selectedCreateQuestionTypeLabel || 'Create New Question'
  const previewQuestions = useMemo(
    () => savedQuestions,
    [savedQuestions],
  )
  const previewQuestionCount = previewQuestions.length
  const selectedAssessmentQuestionCount = savedQuestions.length
  const isSaveAssessmentDraftDisabled = selectedAssessmentQuestionCount === 0
  const canSaveAssessmentDraft = !isSaveAssessmentDraftDisabled
  const assessmentSummary = useMemo(() => {
    const rowsByType = savedQuestions.reduce((rows, item) => {
      const typeLabel = getSummaryTypeLabel(item.type)
      const current = rows[typeLabel] ?? { type: typeLabel, count: 0, marks: 0 }
      rows[typeLabel] = {
        ...current,
        count: current.count + 1,
        marks: current.marks + getQuestionMarksTotal(item),
      }
      return rows
    }, {})

    const rows = SUMMARY_TYPE_ORDER
      .map((type) => rowsByType[type])
      .filter(Boolean)

    const extraRows = Object.values(rowsByType)
      .filter((row) => !SUMMARY_TYPE_ORDER.includes(row.type))

    return {
      totalQuestions: selectedAssessmentQuestionCount,
      totalMarks: savedQuestions.reduce((total, item) => total + getQuestionMarksTotal(item), 0),
      rows: [...rows, ...extraRows],
    }
  }, [savedQuestions, selectedAssessmentQuestionCount])
  const configurationQuestionSummary = useMemo(() => {
    const mcqQuestions = savedQuestions.filter((item) => item.type === 'MCQ')
    const descriptiveQuestions = savedQuestions.filter((item) => isDescriptiveQuestionType(item.type))
    const mcqMarks = mcqQuestions.reduce((total, item) => total + getQuestionMarksTotal(item), 0)
    const descriptiveMarks = descriptiveQuestions.reduce((total, item) => total + getQuestionMarksTotal(item), 0)
    const hasMcq = mcqQuestions.length > 0
    const hasDescriptive = descriptiveQuestions.length > 0
    const examType = hasMcq && hasDescriptive
      ? 'Hybrid'
      : hasMcq
        ? 'MCQ'
        : hasDescriptive
          ? 'Descriptive'
          : 'Not selected'
    const totalMarks = mcqMarks + descriptiveMarks
    const totalMarksDetail = hasMcq && hasDescriptive
      ? `${formatSummaryNumber(descriptiveMarks)} Descriptive + ${formatSummaryNumber(mcqMarks)} MCQ`
      : hasDescriptive
        ? `${formatSummaryNumber(descriptiveMarks)} Descriptive`
        : `${formatSummaryNumber(mcqMarks)} MCQ`

    return {
      descriptiveCount: descriptiveQuestions.length,
      descriptiveMarks,
      examType,
      hasDescriptive,
      hasMcq,
      mcqCount: mcqQuestions.length,
      mcqMarks,
      totalMarks,
      totalMarksDetail,
    }
  }, [savedQuestions])
  const configurationDurationLabel = useMemo(() => {
    if ((setupDraft.examDeliveryMode || 'Online') === 'Offline') {
      return formatDurationValue(getTimeValueMinutes(setupDraft.offlineDuration))
    }

    if (setupDraft.supervisionType === 'Practice Exam') {
      const startDate = getScheduledStartDate(setupDraft.practiceStartDate, setupDraft.practiceStartTime, setupDraft.practiceStartPeriod)
      const endDate = getScheduledStartDate(setupDraft.practiceEndDate, setupDraft.practiceEndTime, setupDraft.practiceEndPeriod)
      if (!startDate || !endDate || endDate <= startDate) return '00:00'
      return formatDurationValue(Math.round((endDate.getTime() - startDate.getTime()) / 60000))
    }

    return formatDurationValue(getTimeValueMinutes(setupDraft.proctoredTotalDuration))
  }, [
    configurationQuestionSummary.hasDescriptive,
    configurationQuestionSummary.hasMcq,
    setupDraft.descriptiveTimeLimit,
    setupDraft.examDeliveryMode,
    setupDraft.mcqTimeLimit,
    setupDraft.offlineDuration,
    setupDraft.practiceEndDate,
    setupDraft.practiceEndPeriod,
    setupDraft.practiceEndTime,
    setupDraft.practiceStartDate,
    setupDraft.practiceStartPeriod,
    setupDraft.practiceStartTime,
    setupDraft.proctoredTotalDuration,
    setupDraft.supervisionType,
  ])
  const isSchedulingDetailsComplete = useMemo(() => {
    const mode = setupDraft.examDeliveryMode || 'Online'
    const hasMcq = configurationQuestionSummary.hasMcq
    const hasDescriptive = configurationQuestionSummary.hasDescriptive
    if (!mode || !setupDraft.supervisionType || !setupDraft.approvalFlow || !setupDraft.assignYear) return false

    if (mode === 'Offline') {
      return Boolean(
        setupDraft.examDate
        && START_TIME_PATTERN.test(setupDraft.startTime || '')
        && TIME_LIMIT_PATTERN.test(setupDraft.offlineDuration || '')
      )
    }

    if (setupDraft.supervisionType === 'Practice Exam') {
      const startDate = getScheduledStartDate(setupDraft.practiceStartDate, setupDraft.practiceStartTime, setupDraft.practiceStartPeriod)
      const endDate = getScheduledStartDate(setupDraft.practiceEndDate, setupDraft.practiceEndTime, setupDraft.practiceEndPeriod)
      return Boolean(
        startDate
        && endDate
        && endDate > startDate
        && (!hasMcq || setupDraft.mcqDisplayType)
        && (!hasDescriptive || setupDraft.descriptiveDisplayType === 'Read-Only')
      )
    }

    if (setupDraft.supervisionType === 'Proctored Exams') {
      const hasMcqSplit = TIME_LIMIT_PATTERN.test(setupDraft.mcqTimeLimit || '')
      const hasDescriptiveSplit = TIME_LIMIT_PATTERN.test(setupDraft.descriptiveTimeLimit || '')
      const splitMatchesTotal = !setupDraft.splitProctoredDuration || !hasMcq || !hasDescriptive || !hasMcqSplit || !hasDescriptiveSplit || (
        getTimeValueMinutes(setupDraft.mcqTimeLimit) + getTimeValueMinutes(setupDraft.descriptiveTimeLimit) === getTimeValueMinutes(setupDraft.proctoredTotalDuration)
      )
      return Boolean(
        setupDraft.examDate
        && START_TIME_PATTERN.test(setupDraft.startTime || '')
        && TIME_LIMIT_PATTERN.test(setupDraft.proctoredTotalDuration || '')
        && getTimeValueMinutes(setupDraft.proctoredTotalDuration) > 0
        && splitMatchesTotal
        && (!hasMcq || (
          setupDraft.mcqDisplayType
        ))
        && (!hasDescriptive || (
          setupDraft.descriptiveDisplayType === 'Read-Only'
        ))
      )
    }

    return false
  }, [
    configurationQuestionSummary.hasDescriptive,
    configurationQuestionSummary.hasMcq,
    setupDraft.approvalFlow,
    setupDraft.assignYear,
    setupDraft.descriptiveDisplayType,
    setupDraft.descriptiveStartTime,
    setupDraft.descriptiveTimeLimit,
    setupDraft.examDate,
    setupDraft.examDeliveryMode,
    setupDraft.mcqDisplayType,
    setupDraft.mcqStartTime,
    setupDraft.mcqTimeLimit,
    setupDraft.offlineDuration,
    setupDraft.practiceEndDate,
    setupDraft.practiceEndPeriod,
    setupDraft.practiceEndTime,
    setupDraft.practiceStartDate,
    setupDraft.practiceStartPeriod,
    setupDraft.practiceStartTime,
    setupDraft.proctoredTotalDuration,
    setupDraft.startTime,
    setupDraft.supervisionType,
  ])
  const isThresholdSettingsComplete = useMemo(() => {
    const attainmentRows = setupDraft.attainmentLevels ?? []
    const hasValidAttainmentRows = attainmentRows.length > 0 && attainmentRows.every((row) => (
      String(row.minPercentage || '').trim()
      && String(row.maxPercentage || '').trim()
      && String(row.level || '').trim()
      && Number(row.minPercentage) >= 0
      && Number(row.maxPercentage) <= 100
      && Number(row.minPercentage) <= Number(row.maxPercentage)
    ))
    if (!hasValidAttainmentRows) return false

    if ((setupDraft.thinkingThresholdMode || 'hotlot') === 'blooms') {
      return BLOOMS_THRESHOLD_FIELDS.every((field) => {
        const value = Number(setupDraft[field.key])
        return String(setupDraft[field.key] || '').trim() && value >= 0 && value <= 100
      })
    }

    const lotValue = Number(setupDraft.lotThreshold)
    const hotValue = Number(setupDraft.hotThreshold)
    return Boolean(
      String(setupDraft.lotThreshold || '').trim()
      && String(setupDraft.hotThreshold || '').trim()
      && lotValue >= 0
      && lotValue <= 100
      && hotValue >= 0
      && hotValue <= 100
    )
  }, [
    setupDraft.analyzeThreshold,
    setupDraft.applyThreshold,
    setupDraft.attainmentLevels,
    setupDraft.evaluateThreshold,
    setupDraft.hotThreshold,
    setupDraft.lotThreshold,
    setupDraft.rememberThreshold,
    setupDraft.thinkingThresholdMode,
    setupDraft.understandThreshold,
  ])
  const primaryPublicationActionLabel = setupDraft.approvalFlow === 'Direct Publish'
    ? isPublishedEditMode ? 'Update Assessment' : 'Publish Assessment'
    : 'Send to Approval'
  const isPublicationHeaderComplete = Boolean(
    setupDraft.collegeName
    && String(setupDraft.assessmentName || '').trim()
    && setupDraft.examCategory
    && setupDraft.academicYear
  )
  const configurationChecklistItems = useMemo(() => ([
    {
      id: 'header',
      label: 'Header Setup',
      complete: isPublicationHeaderComplete,
      target: 'assessment-publication-header-section',
    },
    {
      id: 'schedule',
      label: 'Assessment Scheduling',
      complete: isSchedulingDetailsComplete,
      target: 'assessment-scheduling-details-section',
    },
    {
      id: 'threshold',
      label: 'Threshold Settings',
      complete: isThresholdSettingsComplete,
      target: 'assessment-threshold-settings-section',
      onBeforeScroll: () => setIsThresholdSectionOpen(true),
    },
    {
      id: 'assign',
      label: 'Assign Information',
      complete: Boolean(setupDraft.assignYear),
      target: 'assessment-assign-information-section',
      onBeforeScroll: () => setIsAssignSectionOpen(true),
    },
  ]), [
    isPublicationHeaderComplete,
    isSchedulingDetailsComplete,
    isThresholdSettingsComplete,
    setIsAssignSectionOpen,
    setupDraft.assignYear,
  ])
  const configurationChecklistCompletedCount = configurationChecklistItems.filter((item) => item.complete).length
  const incompleteChecklistIndex = configurationChecklistItems.findIndex((item) => !item.complete)
  const configurationChecklistActiveIndex = incompleteChecklistIndex === -1
    ? configurationChecklistItems.length - 1
    : incompleteChecklistIndex
  const scrollToConfigurationSection = (item) => {
    item.onBeforeScroll?.()
    window.requestAnimationFrame(() => {
      document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const renderScheduleDateField = (field, label, errorKey = field) => (
    <label className={`create-assessment-schedule-field ${setupErrors[errorKey] ? 'has-error' : ''}`}>
      <span>{label} <em>*</em></span>
      <span className={`create-assessment-date-input ${setupDraft[field] ? 'has-value' : ''}`}>
        <input
          type="date"
          value={setupDraft[field] || ''}
          min={getLocalDateInputValue()}
          aria-label={label}
          onClick={(event) => event.currentTarget.showPicker?.()}
          onChange={(event) => updateSetupDraft(field, event.target.value)}
        />
        <em aria-hidden="true">{formatDateInputDisplay(setupDraft[field])}</em>
        <CalendarDays size={16} strokeWidth={2.2} aria-hidden="true" />
      </span>
      {setupErrors[errorKey] ? <small>{setupErrors[errorKey]}</small> : null}
    </label>
  )

  const renderScheduleStartTimeField = (field, periodField, label, errorKey = field) => (
    <label className={`create-assessment-schedule-field ${setupErrors[errorKey] ? 'has-error' : ''}`}>
      <span>{label} <em>*</em></span>
      <StartTimeSelect
        value={setupDraft[field]}
        period={setupDraft[periodField]}
        onChange={(value) => updateSetupDraft(field, value)}
        onPeriodChange={(value) => updateSetupDraft(periodField, value)}
      />
      {setupErrors[errorKey] ? <small>{setupErrors[errorKey]}</small> : null}
    </label>
  )

  const updateProctoredDurationSplit = (field, value) => {
    setSetupDraft((current) => {
      const nextDraft = { ...current, [field]: value }
      const totalMinutes = getTimeValueMinutes(nextDraft.proctoredTotalDuration)
      const hasValidTotal = TIME_LIMIT_PATTERN.test(nextDraft.proctoredTotalDuration || '') && totalMinutes > 0
      if (!hasValidTotal || !configurationQuestionSummary.hasMcq || !configurationQuestionSummary.hasDescriptive || !TIME_LIMIT_PATTERN.test(value || '')) {
        return nextDraft
      }

      const requestedMinutes = getTimeValueMinutes(value)
      const safeMinutes = Math.min(requestedMinutes, totalMinutes)
      nextDraft[field] = formatDurationValue(safeMinutes)
      const remainingMinutes = Math.max(0, totalMinutes - safeMinutes)
      if (field === 'mcqTimeLimit') nextDraft.descriptiveTimeLimit = formatDurationValue(remainingMinutes)
      if (field === 'descriptiveTimeLimit') nextDraft.mcqTimeLimit = formatDurationValue(remainingMinutes)
      return nextDraft
    })
    setSetupErrors((current) => {
      const { [field]: removed, proctoredTotalDuration: _proctoredTotalDuration, ...rest } = current
      return rest
    })
  }

  const updateProctoredTotalDuration = (value) => {
    setSetupDraft((current) => ({
      ...current,
      proctoredTotalDuration: value,
      splitProctoredDuration: false,
      mcqTimeLimit: '',
      descriptiveTimeLimit: '',
    }))
    setSetupErrors((current) => {
      const {
        proctoredTotalDuration: _proctoredTotalDuration,
        mcqTimeLimit: _mcqTimeLimit,
        descriptiveTimeLimit: _descriptiveTimeLimit,
        ...rest
      } = current
      return rest
    })
  }

  const updateSplitProctoredDuration = (checked) => {
    setSetupDraft((current) => ({
      ...current,
      splitProctoredDuration: checked,
      mcqTimeLimit: checked ? current.mcqTimeLimit : '',
      descriptiveTimeLimit: checked ? current.descriptiveTimeLimit : '',
    }))
    if (!checked) {
      setSetupErrors((current) => {
        const {
          mcqTimeLimit: _mcqTimeLimit,
          descriptiveTimeLimit: _descriptiveTimeLimit,
          proctoredTotalDuration: _proctoredTotalDuration,
          ...rest
        } = current
        return rest
      })
    }
  }

  const renderScheduleDurationField = (field, label, errorKey = field, options = {}) => (
    <label className={`create-assessment-schedule-field ${setupErrors[errorKey] ? 'has-error' : ''} ${options.disabled ? 'is-disabled' : ''}`.trim()}>
      <span>{label}{options.required === false ? null : <> <em>*</em></>}</span>
      <DurationTimeSelect
        value={setupDraft[field]}
        onChange={options.onChange || ((value) => updateSetupDraft(field, value))}
        disabled={options.disabled}
        emptyLabel={options.emptyLabel}
      />
      {setupErrors[errorKey] ? <small>{setupErrors[errorKey]}</small> : null}
    </label>
  )

  const renderDisplayTypeToggle = (type, field, errorKey = field) => {
    const isDescriptive = type === 'Descriptive'
    const value = isDescriptive ? 'Read-Only' : (setupDraft[field] || '')
    return (
      <label className={`create-assessment-schedule-toggle-field create-assessment-display-toggle-field ${setupErrors[errorKey] ? 'has-error' : ''}`}>
        <span>Display Type <em>*</em></span>
        <div className="create-assessment-mode-toggle" role="group" aria-label={`${type} display type`}>
          {['Answer Input', 'Read-Only'].map((option) => (
            <button
              key={option}
              type="button"
              className={value === option ? 'is-active' : ''}
              disabled={isDescriptive && option === 'Answer Input'}
              onClick={() => updateDisplayType(field, option)}
            >
              {option}
            </button>
          ))}
        </div>
        {setupErrors[errorKey] ? <small>{setupErrors[errorKey]}</small> : null}
      </label>
    )
  }

  const renderAnswerModePanel = () => {
    if (!configurationQuestionSummary.hasMcq && !configurationQuestionSummary.hasDescriptive) return null

    const rows = [
      configurationQuestionSummary.hasMcq
        ? { type: 'MCQ', field: 'mcqDisplayType', badgeClass: '' }
        : null,
      configurationQuestionSummary.hasDescriptive
        ? { type: 'Descriptive', field: 'descriptiveDisplayType', badgeClass: 'is-descriptive' }
        : null,
    ].filter(Boolean)

    return (
      <section className="create-assessment-answer-mode-panel" aria-label="Answer mode">
        <div className="create-assessment-answer-mode-head">
          <strong>Answer Mode <em>*</em></strong>
          <small>Choose how students interact with each question type.</small>
        </div>
        <div className="create-assessment-answer-mode-list">
          {rows.map((row) => {
            const isDescriptive = row.type === 'Descriptive'
            const value = isDescriptive ? 'Read-Only' : (setupDraft[row.field] || '')
            return (
              <div className="create-assessment-answer-mode-row" key={row.type}>
                <span className={`create-assessment-type-badge ${row.badgeClass}`.trim()}>{row.type}</span>
                <span className="create-assessment-mode-toggle" role="group" aria-label={`${row.type} display type`}>
                  {['Answer Input', 'Read-Only'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={value === option ? 'is-active' : ''}
                      disabled={isDescriptive && option === 'Answer Input'}
                      onClick={() => updateDisplayType(row.field, option)}
                    >
                      {option}
                    </button>
                  ))}
                </span>
                {setupErrors[row.field] ? <small>{setupErrors[row.field]}</small> : null}
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  const fullPreviewSectionConfig = useMemo(() => ([
    ...PREVIEW_SECTION_CONFIG,
    ...customPreviewSections,
  ]), [customPreviewSections])
  const previewSections = useMemo(() => {
    const sectionOrder = [
      ...previewSectionOrder.filter((sectionKey) => fullPreviewSectionConfig.some((section) => section.key === sectionKey)),
      ...fullPreviewSectionConfig.map((section) => section.key).filter((sectionKey) => !previewSectionOrder.includes(sectionKey)),
    ]

    return sectionOrder.map((sectionKey) => fullPreviewSectionConfig.find((section) => section.key === sectionKey))
      .filter(Boolean)
      .map((section) => {
      const questions = previewQuestions.filter((item) => getPreviewSectionKey(item) === section.key)
      return {
        ...section,
        title: previewSectionTitles[section.key] || section.title || section.defaultTitle,
        questions,
        marks: questions.reduce((total, item) => total + getQuestionMarksTotal(item), 0),
      }
    }).filter((section) => section.questions.length || section.isCustom)
  }, [fullPreviewSectionConfig, previewQuestions, previewSectionOrder, previewSectionTitles])
  const previewSectionCount = previewSections.length
  const canSendAssessmentForApproval = useMemo(() => (
    Object.keys(validateSetupDraft(setupDraft)).length === 0 && savedQuestions.length > 0 && previewSections.length > 0
  ), [previewSections.length, savedQuestions.length, setupDraft])
  const previewQuestionDisplayNumbers = useMemo(() => {
    let displayNumber = 1
    return previewSections.reduce((numbers, section) => {
      section.questions.forEach((item) => {
        numbers[item.id] = displayNumber
        displayNumber += 1
      })
      return numbers
    }, {})
  }, [previewSections])
  const areAllPreviewCardsOpen = previewQuestionCount > 0 && previewQuestions.every((item) => openPreviewCardIds.includes(item.id))

  useEffect(() => {
    if (!openDistractorOptionId && !openDistractorMenuOptionId && !openPreviewTagsId) return undefined
    if (typeof document === 'undefined') return undefined

    const handleOutsideDistractorClick = (event) => {
      if (event.target.closest?.('.question-bank-distractor-wrap')) return
      if (event.target.closest?.('.question-bank-created-tags-wrap')) return
      setOpenDistractorOptionId(null)
      setOpenDistractorMenuOptionId(null)
      setOpenPreviewTagsId(null)
    }

    document.addEventListener('mousedown', handleOutsideDistractorClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideDistractorClick)
    }
  }, [openDistractorOptionId, openDistractorMenuOptionId, openPreviewTagsId])

  useEffect(() => () => {
    generationTimersRef.current.forEach((timerId) => clearTimeout(timerId))
    generationTimersRef.current.clear()
    if (publishNoticeTimerRef.current) {
      clearTimeout(publishNoticeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!generationJobs.length) return undefined
    const intervalId = window.setInterval(() => setGenerationTick(Date.now()), 450)
    return () => window.clearInterval(intervalId)
  }, [generationJobs.length])

  useEffect(() => {
    if (!saveStatus) return undefined
    const timeoutId = window.setTimeout(() => setSaveStatus(''), 3600)
    return () => window.clearTimeout(timeoutId)
  }, [saveStatus])

  const updateQuestion = (patch) => {
    setQuestion((current) => current ? ({
      ...current,
      ...(typeof patch === 'function' ? patch(current) : patch),
    }) : current)
    setSaveStatus('')
  }

  const buildGeneratedMcqQuestion = (sourceQuestion) => {
    const fallbackSubject = sourceQuestion.subject || Object.keys(SUBJECT_DIRECTORY)[0] || ''
    const subjectData = SUBJECT_DIRECTORY[fallbackSubject] ?? {}
    const fallbackTopics = sourceQuestion.topics?.length ? sourceQuestion.topics : (subjectData.topics?.[0] ? [subjectData.topics[0]] : [])
    const fallbackCompetencies = sourceQuestion.competencies?.length
      ? sourceQuestion.competencies
      : (subjectData.competencies?.find((item) => !fallbackTopics.length || fallbackTopics.includes(item.topic))?.value
        ? [subjectData.competencies.find((item) => !fallbackTopics.length || fallbackTopics.includes(item.topic)).value]
        : [])
    const questionText = getRichTextPreview(sourceQuestion.questionText) || 'Generated question'
    const generatedOptionLabels = [
      'A clinically relevant application',
      'An unrelated basic recall point',
      'A partially correct distractor',
      'A non-specific explanation',
    ]
    const options = (sourceQuestion.options?.length ? sourceQuestion.options : [createOption(''), createOption(''), createOption(''), createOption('')])
      .slice(0, 4)
      .map((option, index) => ({
        ...option,
        label: getRichTextPreview(option.label) ? option.label : generatedOptionLabels[index] ?? `Option ${String.fromCharCode(65 + index)}`,
        distractorErrors: (option.distractorErrors ?? []).length
          ? option.distractorErrors
          : index === 0 ? [] : ['Superficial Match'],
      }))
    const correctOptionIds = sourceQuestion.correctOptionIds?.length ? sourceQuestion.correctOptionIds : [options[0]?.id].filter(Boolean)

    return {
      ...sourceQuestion,
      year: sourceQuestion.year || setup.year || YEAR_OPTIONS[0],
      subject: fallbackSubject,
      topics: fallbackTopics,
      competencies: fallbackCompetencies,
      questionCategory: sourceQuestion.questionCategory || 'Direct',
      cognitiveLevel: sourceQuestion.cognitiveLevel || 'Apply',
      thinkingLevel: sourceQuestion.thinkingLevel || 'HoT',
      difficultyLevel: sourceQuestion.difficultyLevel || 'L2',
      cognitiveFunction: sourceQuestion.cognitiveFunction || 'Pattern Recognition',
      skillFocus: sourceQuestion.skillFocus || 'Diagnosis',
      organSystem: sourceQuestion.organSystem || 'Nervous',
      organSubSystems: hasGeneratedTagValues(sourceQuestion.organSubSystems) ? sourceQuestion.organSubSystems : ['Brain'],
      diseaseTags: hasGeneratedTagValues(sourceQuestion.diseaseTags) ? sourceQuestion.diseaseTags : ['Clinical correlation'],
      keyConcepts: hasGeneratedTagValues(sourceQuestion.keyConcepts) ? sourceQuestion.keyConcepts : ['Diagnostic clue', 'Core concept'],
      marks: hasVisibleMarks(sourceQuestion.marks) ? sourceQuestion.marks : '1',
      options,
      correctOptionIds,
      answerKey: getRichTextPreview(sourceQuestion.answerKey)
        ? sourceQuestion.answerKey
        : `The correct answer is ${getRichTextPreview(options[0]?.label ?? '') || 'Option A'} because it best addresses the key concept in "${questionText}".`,
    }
  }

  const getQuestionCurriculumFallback = (sourceQuestion) => {
    const fallbackSubject = sourceQuestion.subject || Object.keys(SUBJECT_DIRECTORY)[0] || ''
    const subjectData = SUBJECT_DIRECTORY[fallbackSubject] ?? {}
    const fallbackTopics = sourceQuestion.topics?.length ? sourceQuestion.topics : (subjectData.topics?.[0] ? [subjectData.topics[0]] : [])
    const fallbackCompetency = subjectData.competencies?.find((item) => !fallbackTopics.length || fallbackTopics.includes(item.topic))?.value

    return {
      year: sourceQuestion.year || setup.year || YEAR_OPTIONS[0],
      subject: fallbackSubject,
      topics: fallbackTopics,
      competencies: sourceQuestion.competencies?.length ? sourceQuestion.competencies : (fallbackCompetency ? [fallbackCompetency] : []),
    }
  }

  const hydrateDescriptiveLeaf = (row, curriculum) => {
    const questionText = getRichTextPreview(row.questionText)
    const marks = hasVisibleMarks(row.marks) ? row.marks : getAutoGeneratedDescriptiveMarks()

    return {
      ...row,
      marks,
      year: row.year || curriculum.year,
      subject: row.subject || curriculum.subject,
      topics: row.topics?.length ? row.topics : [...curriculum.topics],
      competencies: row.competencies?.length ? row.competencies : [...curriculum.competencies],
      answerKey: getRichTextPreview(row.answerKey)
        ? row.answerKey
        : getAutoGeneratedDescriptiveAnswer(questionText, marks),
    }
  }

  const buildGeneratedDescriptiveQuestion = (sourceQuestion) => {
    const curriculum = getQuestionCurriculumFallback(sourceQuestion)
    const sections = (sourceQuestion.descriptiveSections ?? []).map((section) => {
      const sectionChildren = Array.isArray(section.children) ? section.children : []
      const generatedSection = hydrateDescriptiveLeaf(section, curriculum)

      return {
        ...generatedSection,
        marks: sectionChildren.length ? '0' : generatedSection.marks,
        children: sectionChildren.map((child) => hydrateDescriptiveLeaf(child, {
          year: generatedSection.year,
          subject: generatedSection.subject,
          topics: generatedSection.topics ?? [],
          competencies: generatedSection.competencies ?? [],
        })),
      }
    })
    const firstLeaf = sections.find((section) => !(section.children ?? []).length) ?? sections.flatMap((section) => section.children ?? [])[0]
    const marks = hasVisibleMarks(sourceQuestion.marks)
      ? sourceQuestion.marks
      : sections.length
        ? String(sections.reduce((total, section) => {
          const children = section.children ?? []
          return total + (children.length ? children.reduce((sum, child) => sum + parseMarksValue(child.marks), 0) : parseMarksValue(section.marks))
        }, 0) || getAutoGeneratedDescriptiveMarks())
        : getAutoGeneratedDescriptiveMarks()
    const questionText = getRichTextPreview(sourceQuestion.questionText)

    return {
      ...sourceQuestion,
      ...curriculum,
      descriptiveSections: sections,
      questionCategory: sourceQuestion.questionCategory || 'Direct',
      cognitiveLevel: sourceQuestion.cognitiveLevel || 'Apply',
      thinkingLevel: sourceQuestion.thinkingLevel || 'LoT',
      difficultyLevel: sourceQuestion.difficultyLevel || 'L1',
      cognitiveFunction: sourceQuestion.cognitiveFunction || 'Concept recall',
      skillFocus: sourceQuestion.skillFocus || 'Written response',
      organSystem: sourceQuestion.organSystem || 'General',
      organSubSystems: hasGeneratedTagValues(sourceQuestion.organSubSystems) ? sourceQuestion.organSubSystems : ['General'],
      diseaseTags: hasGeneratedTagValues(sourceQuestion.diseaseTags) ? sourceQuestion.diseaseTags : ['Not disease-specific'],
      keyConcepts: hasGeneratedTagValues(sourceQuestion.keyConcepts) ? sourceQuestion.keyConcepts : ['Core concept', 'Structured answer'],
      marks,
      answerKey: getRichTextPreview(sourceQuestion.answerKey)
        ? sourceQuestion.answerKey
        : firstLeaf?.answerKey || getAutoGeneratedDescriptiveAnswer(questionText, marks),
    }
  }

  const persistQuestion = (status, questionOverride = question, options = {}) => {
    if (!questionOverride) return
    const targetEditingPreviewQuestionId = options.editingPreviewQuestionId === undefined
      ? editingPreviewQuestionId
      : options.editingPreviewQuestionId
    const isEditingPreviewQuestion = Boolean(targetEditingPreviewQuestionId)

    const nextQuestion = {
      ...questionOverride,
      id: targetEditingPreviewQuestionId || questionOverride.id,
      status,
      assessmentName: setup.assessmentName || 'Untitled Assessment',
      savedAt: new Date().toISOString(),
      questionCategory: questionOverride.questionCategory || 'Direct',
      cognitiveLevel: questionOverride.cognitiveLevel || 'Apply',
      thinkingLevel: questionOverride.thinkingLevel || 'LoT',
      difficultyLevel: questionOverride.difficultyLevel || 'L1',
    }
    setSavedQuestions((currentQuestions) => {
      const nextQuestions = isEditingPreviewQuestion
        ? currentQuestions.map((item) => (item.id === targetEditingPreviewQuestionId ? nextQuestion : item))
        : [nextQuestion, ...currentQuestions.filter((item) => item.id !== questionOverride.id)]
      window.localStorage.setItem(assessmentQuestionsStorageKey, JSON.stringify(nextQuestions))
      return nextQuestions
    })
    if (options.resetEditor !== false) {
      setQuestion(createQuestion(setup, questionOverride.type))
      setEditingPreviewQuestionId(null)
      if (isEditingPreviewQuestion) {
        setActiveCreateTab('preview')
        setHasSelectedCreateTab(true)
        setSelectedCreateQuestionTypeLabel('')
      }
    }
    setSaveStatus(options.message ?? (isEditingPreviewQuestion ? 'Question updated.' : status === 'Draft' ? 'Draft saved.' : 'Question created.'))
  }

  const createQuestionWithGeneration = () => {
    if (!question || !canCreate) return

    if (editingPreviewQuestionId) {
      persistQuestion('Created')
      return
    }

    const isDescriptiveGeneration = isDescriptiveQuestionType(question.type)
    if (!isDescriptiveGeneration && question.type !== 'MCQ') {
      persistQuestion('Created')
      return
    }

    const sourceQuestion = {
      ...question,
      topics: [...(question.topics ?? [])],
      competencies: [...(question.competencies ?? [])],
      images: [...(question.images ?? [])],
      descriptiveSections: (question.descriptiveSections ?? []).map((section) => ({
        ...section,
        topics: [...(section.topics ?? [])],
        competencies: [...(section.competencies ?? [])],
        children: (section.children ?? []).map((child) => ({
          ...child,
          topics: [...(child.topics ?? [])],
          competencies: [...(child.competencies ?? [])],
        })),
      })),
      options: (question.options ?? []).map((option) => ({
        ...option,
        distractorErrors: [...(option.distractorErrors ?? [])],
      })),
      correctOptionIds: [...(question.correctOptionIds ?? [])],
      organSubSystems: [...(question.organSubSystems ?? [])],
      diseaseTags: [...(question.diseaseTags ?? [])],
      keyConcepts: [...(question.keyConcepts ?? [])],
    }
    const typeMeta = getQuestionTypeMeta(sourceQuestion.type)
    const typeLabel = isDescriptiveGeneration ? typeMeta.shortLabel : 'MCQ'
    const jobId = `${typeLabel.toLowerCase()}-generation-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const questionPreviewText = getRichTextPreview(sourceQuestion.questionText).slice(0, 54) || `${typeLabel} question`

    const startedAt = Date.now()
    setGenerationTick(startedAt)
    setGenerationJobs((current) => [...current, { id: jobId, questionPreviewText, startedAt, typeLabel, isDescriptive: isDescriptiveGeneration }])
    setQuestion(createQuestion(setup, sourceQuestion.type))
    setActiveCreateTab('create')
    setHasSelectedCreateTab(true)
    setSelectedCreateQuestionTypeLabel(typeLabel)
    setActiveMappingPicker(null)
    setMappingSearchValue('')
    setIsOptionalTagsOpen(false)
    setSaveStatus(`${typeLabel} generation started. You can create the next question.`)

    const timerId = setTimeout(() => {
      const latestText = getRichTextPreview(sourceQuestion.questionText)
      if (!latestText) {
        setGenerationJobs((current) => current.filter((job) => job.id !== jobId))
        generationTimersRef.current.delete(jobId)
        setSaveStatus('Enter question text to create.')
        return
      }
      const generatedQuestion = isDescriptiveGeneration
        ? buildGeneratedDescriptiveQuestion(sourceQuestion)
        : buildGeneratedMcqQuestion(sourceQuestion)
      persistQuestion('Created', generatedQuestion, {
        resetEditor: false,
        editingPreviewQuestionId: null,
        message: `${typeLabel} generated and added to preview.`,
      })
      setActiveCreateTab('create')
      setHasSelectedCreateTab(true)
      setSelectedCreateQuestionTypeLabel(typeLabel)
      setGenerationJobs((current) => current.filter((job) => job.id !== jobId))
      generationTimersRef.current.delete(jobId)
    }, 15000)
    generationTimersRef.current.set(jobId, timerId)
  }

  const clearQuestion = () => {
    setQuestion(null)
    setIsQuestionTypePickerOpen(false)
    setIsDescriptiveTypePickerOpen(false)
    setActiveMappingPicker(null)
    setMappingSearchValue('')
    setIsOptionalTagsOpen(false)
    setSaveStatus('')
  }

  const resetCurrentQuestion = () => {
    if (!question) return
    setQuestion(createQuestion(setup, question.type))
    setEditingPreviewQuestionId(null)
    setActiveMappingPicker(null)
    setMappingSearchValue('')
    setIsOptionalTagsOpen(false)
    setSaveStatus('')
  }

  const addQuestionToQuestionBank = () => {
    if (!question || !canCreate) {
      setActiveCreateTab('questionBank')
      setHasSelectedCreateTab(true)
      // setSaveStatus('Question bank opened in view-only mode.')
      return
    }

    const questionBankQuestion = {
      ...question,
      id: `assessment-qb-${Date.now()}`,
      status: 'Created',
      source: 'Create Assessment',
      assessmentName: setup.assessmentName || 'Untitled Assessment',
      createdAt: new Date().toISOString(),
      questionCategory: question.questionCategory || 'Direct',
      cognitiveLevel: question.cognitiveLevel || 'Apply',
      thinkingLevel: question.thinkingLevel || 'LoT',
      difficultyLevel: question.difficultyLevel || 'L1',
    }

    try {
      const existingRows = JSON.parse(window.localStorage.getItem(QUESTION_BANK_STORAGE_KEY) ?? '[]')
      const nextRows = [questionBankQuestion, ...(Array.isArray(existingRows) ? existingRows : [])]
      window.localStorage.setItem(QUESTION_BANK_STORAGE_KEY, JSON.stringify(nextRows))
      window.dispatchEvent(new Event('question-bank-created-questions'))
      setSaveStatus('Added to question bank.')
      setActiveCreateTab('questionBank')
      setHasSelectedCreateTab(true)
      setSelectedCreateQuestionTypeLabel('')
    } catch {
      setSaveStatus('Unable to add question bank.')
      setActiveCreateTab('questionBank')
      setHasSelectedCreateTab(true)
      setSelectedCreateQuestionTypeLabel('')
    }
  }

  const addQuestionBankSelectionToAssessment = (questions = []) => {
    const importedQuestions = questions.map((item, index) => ({
      ...item,
      id: `assessment-imported-${item.id ?? Date.now()}-${index}`,
      originalQuestionId: item.id ?? item.originalQuestionId,
      status: 'Created',
      source: item.source || 'Question Bank',
      assessmentName: setup.assessmentName || 'Untitled Assessment',
      savedAt: new Date().toISOString(),
    }))

    if (!importedQuestions.length) return

    const nextQuestions = [
      ...importedQuestions,
      ...savedQuestions.filter((item) => !questions.some((questionItem) => (
        (questionItem.id ?? questionItem.originalQuestionId) === (item.originalQuestionId ?? item.id)
      ))),
    ]
    window.localStorage.setItem(assessmentQuestionsStorageKey, JSON.stringify(nextQuestions))
    setSavedQuestions(nextQuestions)
    setSaveStatus(`${importedQuestions.length} question${importedQuestions.length === 1 ? '' : 's'} added to assessment.`)
  }

  const deletePreviewQuestion = (item) => {
    if (!item?.id) return

    if (question?.id === item.id) {
      setQuestion(null)
      setSaveStatus('Question removed from preview.')
      return
    }

    const nextQuestions = savedQuestions.filter((savedItem) => savedItem.id !== item.id)
    window.localStorage.setItem(assessmentQuestionsStorageKey, JSON.stringify(nextQuestions))
    setSavedQuestions(nextQuestions)
    setSaveStatus('Question removed from preview.')
  }

  const editPreviewQuestion = (item) => {
    if (!item?.id) return
    const nextTypeMeta = getQuestionTypeMeta(item.type)
    setQuestion({
      ...createQuestion(setup, item.type),
      ...item,
      options: Array.isArray(item.options) && item.options.length ? item.options : createQuestion(setup, item.type).options,
      correctOptionIds: item.correctOptionIds ?? [],
      descriptiveSections: item.descriptiveSections ?? [],
      images: item.images ?? [],
      topics: item.topics ?? [],
      competencies: item.competencies ?? [],
      organSubSystems: normalizeOptionalTagValues(item.organSubSystems),
      diseaseTags: normalizeOptionalTagValues(item.diseaseTags),
      keyConcepts: normalizeOptionalTagValues(item.keyConcepts),
    })
    setEditingPreviewQuestionId(item.id)
    setActiveCreateTab('create')
    setHasSelectedCreateTab(true)
    setSelectedCreateQuestionTypeLabel(nextTypeMeta?.shortLabel ?? nextTypeMeta?.menuLabel ?? 'Create New Question')
    setIsQuestionTypePickerOpen(false)
    setIsDescriptiveTypePickerOpen(false)
    setActiveMappingPicker(null)
    setMappingSearchValue('')
    setIsOptionalTagsOpen(false)
    setSaveStatus('Editing preview question.')
  }

  const persistSavedQuestions = (nextQuestions, message = '') => {
    window.localStorage.setItem(assessmentQuestionsStorageKey, JSON.stringify(nextQuestions))
    setSavedQuestions(nextQuestions)
    if (message) setSaveStatus(message)
  }

  const saveAssessmentDraft = () => {
    if (!canSaveAssessmentDraft) return
    const draftAssessmentName = String(setupDraft.assessmentName || '').trim() || 'Untitled Assessment'
    const draftId = draftAssessmentName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled-assessment'
    window.localStorage.setItem(assessmentQuestionsStorageKey, JSON.stringify(savedQuestions))
    const nextSetup = {
      ...setupDraft,
      assessmentName: draftAssessmentName,
      assessmentId: setupDraft.assessmentId || setup.assessmentId || `assessment-${Date.now()}`,
      sourceDraftId: draftId,
      sourceDraftName: draftAssessmentName,
      createdAt: setupDraft.createdAt || setup.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify(nextSetup))
    setSetup(nextSetup)
    setSetupDraft(nextSetup)
    const draftRow = {
      id: draftId,
      setup: nextSetup,
      assessmentName: draftAssessmentName,
      academicYear: nextSetup.academicYear || '',
      examCategory: nextSetup.examCategory || '',
      course: nextSetup.assignCourse || nextSetup.course || '',
      year: nextSetup.assignYear || nextSetup.year || '',
      examMode: nextSetup.examDeliveryMode || '',
      questionCount: assessmentSummary.totalQuestions,
      totalMarks: assessmentSummary.totalMarks,
      updatedAt: new Date().toISOString(),
    }
    try {
      const existingDrafts = JSON.parse(window.localStorage.getItem(ASSESSMENT_DRAFTS_STORAGE_KEY) || '[]')
      const rows = Array.isArray(existingDrafts) ? existingDrafts : []
      const normalizedDraftName = draftAssessmentName.trim().toLowerCase()
      const sourceDraftId = setupDraft.sourceDraftId || setup.sourceDraftId || ''
      const sourceDraftName = String(setupDraft.sourceDraftName || setup.sourceDraftName || '').trim().toLowerCase()
      const nextDrafts = [
        draftRow,
        ...rows.filter((row) => {
          const rowName = String(row.assessmentName || '').trim().toLowerCase()
          return row.id !== draftId
            && (!sourceDraftId || row.id !== sourceDraftId)
            && rowName !== normalizedDraftName
            && (!sourceDraftName || rowName !== sourceDraftName)
        }),
      ]
      window.localStorage.setItem(ASSESSMENT_DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts))
    } catch {
      window.localStorage.setItem(ASSESSMENT_DRAFTS_STORAGE_KEY, JSON.stringify([draftRow]))
    }
    setSaveStatus('Assessment draft saved.')
  }

  const startEditPreviewSectionTitle = (section) => {
    setEditingPreviewSectionKey(section.key)
    setPreviewSectionTitleDraft(section.title)
  }

  const commitPreviewSectionTitle = () => {
    if (!editingPreviewSectionKey) return
    const fallbackTitle = fullPreviewSectionConfig.find((section) => section.key === editingPreviewSectionKey)?.defaultTitle ?? 'New Section'
    const nextTitles = {
      ...previewSectionTitles,
      [editingPreviewSectionKey]: previewSectionTitleDraft.trim() || fallbackTitle,
    }
    window.localStorage.setItem(assessmentSectionTitlesStorageKey, JSON.stringify(nextTitles))
    setPreviewSectionTitles(nextTitles)
    setEditingPreviewSectionKey(null)
    setPreviewSectionTitleDraft('')
  }

  const createPreviewSection = () => {
    const sectionKey = `custom-section-${Date.now()}`
    const nextSection = {
      key: sectionKey,
      defaultTitle: 'New Section',
      title: 'New Section',
      type: 'custom',
      isCustom: true,
    }
    const nextCustomSections = [...customPreviewSections, nextSection]
    const nextOrder = [...previewSectionOrder.filter((key) => key !== sectionKey), sectionKey]
    const nextTitles = {
      ...previewSectionTitles,
      [sectionKey]: nextSection.title,
    }

    window.localStorage.setItem(assessmentCustomSectionsStorageKey, JSON.stringify(nextCustomSections))
    window.localStorage.setItem(assessmentSectionOrderStorageKey, JSON.stringify(nextOrder))
    window.localStorage.setItem(assessmentSectionTitlesStorageKey, JSON.stringify(nextTitles))
    setCustomPreviewSections(nextCustomSections)
    setPreviewSectionOrder(nextOrder)
    setPreviewSectionTitles(nextTitles)
    setEditingPreviewSectionKey(sectionKey)
    setPreviewSectionTitleDraft(nextSection.title)
    setSaveStatus('Section created.')
  }

  const deletePreviewSection = (section) => {
    if (!section?.isCustom) return
    const nextCustomSections = customPreviewSections.filter((item) => item.key !== section.key)
    const nextOrder = previewSectionOrder.filter((key) => key !== section.key)
    const nextTitles = Object.fromEntries(
      Object.entries(previewSectionTitles).filter(([key]) => key !== section.key),
    )
    const nextQuestions = savedQuestions.map((item) => (
      getPreviewSectionKey(item) === section.key
        ? { ...item, previewSectionKey: getSummaryTypeLabel(item.type) }
        : item
    ))

    window.localStorage.setItem(assessmentCustomSectionsStorageKey, JSON.stringify(nextCustomSections))
    window.localStorage.setItem(assessmentSectionOrderStorageKey, JSON.stringify(nextOrder))
    window.localStorage.setItem(assessmentSectionTitlesStorageKey, JSON.stringify(nextTitles))
    window.localStorage.setItem(assessmentQuestionsStorageKey, JSON.stringify(nextQuestions))
    setCustomPreviewSections(nextCustomSections)
    setPreviewSectionOrder(nextOrder)
    setPreviewSectionTitles(nextTitles)
    setSavedQuestions(nextQuestions)
    if (editingPreviewSectionKey === section.key) {
      setEditingPreviewSectionKey(null)
      setPreviewSectionTitleDraft('')
    }
    setSaveStatus('Section deleted. Questions moved back to their question type section.')
  }

  const resetPreviewSections = () => {
    const defaultTitles = PREVIEW_SECTION_CONFIG.reduce((titles, section) => ({
      ...titles,
      [section.key]: section.defaultTitle,
    }), {})
    const defaultOrder = PREVIEW_SECTION_CONFIG.map((section) => section.key)
    const nextQuestions = savedQuestions.map((item) => ({
      ...item,
      previewSectionKey: getSummaryTypeLabel(item.type),
    }))

    window.localStorage.setItem(assessmentCustomSectionsStorageKey, JSON.stringify([]))
    window.localStorage.setItem(assessmentSectionOrderStorageKey, JSON.stringify(defaultOrder))
    window.localStorage.setItem(assessmentSectionTitlesStorageKey, JSON.stringify(defaultTitles))
    window.localStorage.setItem(assessmentQuestionsStorageKey, JSON.stringify(nextQuestions))
    setCustomPreviewSections([])
    setPreviewSectionOrder(defaultOrder)
    setPreviewSectionTitles(defaultTitles)
    setSavedQuestions(nextQuestions)
    setEditingPreviewSectionKey(null)
    setPreviewSectionTitleDraft('')
    setDraggedPreviewQuestionId(null)
    setDraggedPreviewSectionKey(null)
    setSaveStatus('Preview sections reset.')
  }

  const createNmcSaqSections = () => {
    const saqQuestions = savedQuestions.filter((item) => getSummaryTypeLabel(item.type) === 'SAQs')
    if (!saqQuestions.length) {
      setSaveStatus('No SAQs available for NMC sections.')
      return
    }

    const usedCategoryLabels = Array.from(new Set(saqQuestions.map((item) => (
      getQuestionCategorySectionLabel(item.questionCategory)
    ))))
    const orderedCategoryLabels = [
      ...NMC_SAQ_CATEGORY_ORDER.filter((label) => usedCategoryLabels.includes(label)),
      ...usedCategoryLabels.filter((label) => !NMC_SAQ_CATEGORY_ORDER.includes(label)).sort(),
    ]
    const nmcSectionKeys = orderedCategoryLabels.map((label) => (
      `custom-section-nmc-saqs-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    ))
    const nmcSectionKeySet = new Set(nmcSectionKeys)
    const isNmcSectionKey = (key) => String(key ?? '').startsWith('custom-section-nmc-saqs-')

    const nextNmcSections = orderedCategoryLabels.map((label, index) => ({
      key: nmcSectionKeys[index],
      defaultTitle: getNmcSaqSectionTitle(label),
      title: getNmcSaqSectionTitle(label),
      type: 'custom',
      isCustom: true,
      isNmc: true,
    }))
    const nextCustomSections = [
      ...customPreviewSections.filter((section) => !isNmcSectionKey(section.key)),
      ...nextNmcSections,
    ]
    const nextTitles = {
      ...Object.fromEntries(Object.entries(previewSectionTitles).filter(([key]) => !isNmcSectionKey(key))),
      ...Object.fromEntries(nextNmcSections.map((section) => [section.key, section.title])),
    }
    const cleanOrder = previewSectionOrder.filter((key) => !isNmcSectionKey(key) && !nmcSectionKeySet.has(key))
    const saqOrderIndex = cleanOrder.indexOf('SAQs')
    const nextOrder = [...cleanOrder]
    nextOrder.splice(saqOrderIndex < 0 ? nextOrder.length : saqOrderIndex + 1, 0, ...nmcSectionKeys)
    const categoryKeyByLabel = Object.fromEntries(orderedCategoryLabels.map((label, index) => [label, nmcSectionKeys[index]]))
    const nextQuestions = savedQuestions.map((item) => {
      if (getSummaryTypeLabel(item.type) === 'SAQs') {
        return {
          ...item,
          previewSectionKey: categoryKeyByLabel[getQuestionCategorySectionLabel(item.questionCategory)] ?? 'SAQs',
        }
      }

      return isNmcSectionKey(getPreviewSectionKey(item))
        ? { ...item, previewSectionKey: getSummaryTypeLabel(item.type) }
        : item
    })

    window.localStorage.setItem(assessmentCustomSectionsStorageKey, JSON.stringify(nextCustomSections))
    window.localStorage.setItem(assessmentSectionOrderStorageKey, JSON.stringify(nextOrder))
    window.localStorage.setItem(assessmentSectionTitlesStorageKey, JSON.stringify(nextTitles))
    window.localStorage.setItem(assessmentQuestionsStorageKey, JSON.stringify(nextQuestions))
    setCustomPreviewSections(nextCustomSections)
    setPreviewSectionOrder(nextOrder)
    setPreviewSectionTitles(nextTitles)
    setSavedQuestions(nextQuestions)
    setEditingPreviewSectionKey(null)
    setPreviewSectionTitleDraft('')
    setSaveStatus('NMC SAQ sections created.')
  }

  const movePreviewQuestionToSection = (itemId, sectionKey) => {
    const movingQuestion = savedQuestions.find((item) => item.id === itemId)
    if (!movingQuestion) return

    const nextQuestions = savedQuestions.filter((item) => item.id !== itemId)
    const targetIndex = nextQuestions.reduce((lastIndex, item, index) => (
      getPreviewSectionKey(item) === sectionKey ? index : lastIndex
    ), -1)
    nextQuestions.splice(targetIndex + 1, 0, {
      ...movingQuestion,
      previewSectionKey: sectionKey,
    })
    persistSavedQuestions(nextQuestions, 'Question order updated.')
  }

  const movePreviewQuestionBefore = (itemId, targetId) => {
    if (itemId === targetId) return
    const movingQuestion = savedQuestions.find((item) => item.id === itemId)
    const targetQuestion = savedQuestions.find((item) => item.id === targetId)
    if (!movingQuestion || !targetQuestion) return

    const currentIndex = savedQuestions.findIndex((item) => item.id === itemId)
    const targetIndex = savedQuestions.findIndex((item) => item.id === targetId)
    const nextQuestions = [...savedQuestions]
    const [movedQuestion] = nextQuestions.splice(currentIndex, 1)
    const adjustedTargetIndex = currentIndex < targetIndex ? targetIndex - 1 : targetIndex
    nextQuestions.splice(adjustedTargetIndex, 0, {
      ...movedQuestion,
      previewSectionKey: getPreviewSectionKey(targetQuestion),
    })
    persistSavedQuestions(nextQuestions, 'Question order updated.')
  }

  const movePreviewQuestionToOwnSection = (itemId) => {
    const movingQuestion = savedQuestions.find((item) => item.id === itemId)
    if (!movingQuestion) return

    const ownSectionKey = getSummaryTypeLabel(movingQuestion.type)
    if (!PREVIEW_SECTION_KEY_SET.has(ownSectionKey)) return

    const nextQuestions = [
      ...savedQuestions.filter((item) => item.id !== itemId),
      {
        ...movingQuestion,
        previewSectionKey: ownSectionKey,
      },
    ]
    persistSavedQuestions(nextQuestions, 'Question moved to its own section.')
  }

  const movePreviewSectionBefore = (sectionKey, targetSectionKey) => {
    if (sectionKey === targetSectionKey) return
    const nextOrder = previewSectionOrder.filter((key) => key !== sectionKey)
    const targetIndex = nextOrder.findIndex((key) => key === targetSectionKey)
    nextOrder.splice(targetIndex < 0 ? nextOrder.length : targetIndex, 0, sectionKey)
    window.localStorage.setItem(assessmentSectionOrderStorageKey, JSON.stringify(nextOrder))
    setPreviewSectionOrder(nextOrder)
    setSaveStatus('Section order updated.')
  }

  const handleQuestionTypeChange = (type) => {
    const nextTypeMeta = getQuestionTypeMeta(type)
    setQuestion((current) => current ? ({
      ...createQuestion(setup, type),
      year: current.year,
      subject: current.subject,
      topics: current.topics,
      competencies: current.competencies,
      questionCategory: current.questionCategory,
      cognitiveLevel: current.cognitiveLevel,
      thinkingLevel: current.thinkingLevel,
      difficultyLevel: current.difficultyLevel,
      cognitiveFunction: current.cognitiveFunction,
      skillFocus: current.skillFocus,
      organSystem: current.organSystem,
      organSubSystems: current.organSubSystems,
      diseaseTags: current.diseaseTags,
      keyConcepts: current.keyConcepts,
    }) : createQuestion(setup, type))
    setIsQuestionTypePickerOpen(false)
    setIsDescriptiveTypePickerOpen(false)
    setIsActionQuestionTypePickerOpen(false)
    setIsActionDescriptiveTypePickerOpen(false)
    setActiveCreateTab('create')
    setHasSelectedCreateTab(true)
    setSelectedCreateQuestionTypeLabel(nextTypeMeta?.menuLabel ?? nextTypeMeta?.shortLabel ?? 'Create New Question')
    setSaveStatus('')
  }

  const renderQuestionTypePicker = (triggerClassName = 'question-bank-type-select-trigger', triggerIcon = <ListChecks size={15} strokeWidth={2} />) => (
    <div className={`question-bank-type-select-panel ${isQuestionTypePickerOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => {
          if (isQuestionTypePickerOpen) setIsDescriptiveTypePickerOpen(false)
          setIsQuestionTypePickerOpen((current) => !current)
        }}
        aria-expanded={isQuestionTypePickerOpen}
      >
        <span className="question-bank-type-picker-icon">
          {triggerIcon}
        </span>
        <strong>{question ? getQuestionTypeMeta(question.type).shortLabel : selectedQuestionTypeLabel}</strong>
        <ChevronDown size={16} strokeWidth={2.4} />
      </button>

      {isQuestionTypePickerOpen ? (
        <div className="question-bank-type-picker">
          {QUESTION_TYPE_CARDS.slice(0, 1).map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.type}
                type="button"
                className="question-bank-type-picker-item"
                onClick={() => handleQuestionTypeChange(item.type)}
              >
                <span className="question-bank-type-picker-icon">
                  <Icon size={15} strokeWidth={2} />
                </span>
                <span>{item.menuLabel ?? item.shortLabel}</span>
              </button>
            )
          })}
          <div className={`question-bank-type-picker-group ${isDescriptiveTypePickerOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="question-bank-type-picker-item question-bank-type-picker-menu-trigger"
              onClick={() => setIsDescriptiveTypePickerOpen((current) => !current)}
              aria-expanded={isDescriptiveTypePickerOpen}
            >
              <span className="question-bank-type-picker-icon">
                <FilePenLine size={15} strokeWidth={2} />
              </span>
              <span>Descriptive</span>
              <ChevronDown size={15} strokeWidth={2.4} />
            </button>
            {isDescriptiveTypePickerOpen ? (
              <div className="question-bank-type-picker-menu">
                {DESCRIPTIVE_QUESTION_TYPES.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    className="question-bank-type-picker-menu-item"
                    onClick={() => handleQuestionTypeChange(item.type)}
                  >
                    <span className="question-bank-type-picker-icon">
                      <FilePenLine size={15} strokeWidth={2} />
                    </span>
                    <span>{item.menuLabel}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )

  const updateDescriptiveSections = (updater) => {
    updateQuestion((current) => ({
      descriptiveSections: typeof updater === 'function'
        ? updater(current.descriptiveSections ?? [])
        : updater,
    }))
  }

  const updateDescriptiveSubQuestion = (sectionId, patch) => {
    updateDescriptiveSections((sections) => sections.map((section) => (
      section.id === sectionId
        ? { ...section, ...(typeof patch === 'function' ? patch(section) : patch) }
        : section
    )))
  }

  const updateDescriptiveInsideQuestion = (sectionId, childId, patch, sectionIndex, childIndex) => {
    updateDescriptiveSections((sections) => sections.map((section, index) => (
      section.id === sectionId || index === sectionIndex
        ? {
          ...section,
          children: (Array.isArray(section.children) ? section.children : []).map((child, currentChildIndex) => (
            child.id === childId || currentChildIndex === childIndex
              ? { ...child, ...(typeof patch === 'function' ? patch(child) : patch) }
              : child
          )),
        }
        : section
    )))
  }

  const addDescriptiveSubQuestion = () => {
    updateQuestion({ marks: '0' })
    updateDescriptiveSections((sections) => [...sections, createDescriptiveSubQuestion(question)])
  }

  const deleteDescriptiveSubQuestion = (sectionId) => {
    updateDescriptiveSections((sections) => sections.filter((section) => section.id !== sectionId))
    if (descriptiveCompetencyDraft?.target?.sectionId === sectionId) {
      setDescriptiveCompetencyDraft(null)
    }
  }

  const addDescriptiveInsideQuestion = (sectionId, sectionIndex) => {
    updateDescriptiveSections((sections) => sections.map((section, index) => (
      section.id === sectionId || index === sectionIndex
        ? {
          ...section,
          marks: '0',
          children: [
            ...(Array.isArray(section.children) ? section.children : []),
            createDescriptiveInsideQuestion({
              year: section.year || question.year,
              subject: section.subject || question.subject,
              topics: section.topics?.length ? section.topics : question.topics,
              competencies: section.competencies?.length ? section.competencies : question.competencies,
            }),
          ],
        }
        : section
    )))
  }

  const deleteDescriptiveInsideQuestion = (sectionId, childId, sectionIndex, childIndex) => {
    updateDescriptiveSections((sections) => sections.map((section, index) => (
      section.id === sectionId || index === sectionIndex
        ? {
          ...section,
          children: (Array.isArray(section.children) ? section.children : []).filter((child, currentChildIndex) => (
            child.id !== childId && currentChildIndex !== childIndex
          )),
        }
        : section
    )))
    const isDeletingActiveMapping = descriptiveCompetencyDraft?.target?.type === 'inside'
      && descriptiveCompetencyDraft.target.sectionId === sectionId
      && (descriptiveCompetencyDraft.target.childId === childId || descriptiveCompetencyDraft.target.childIndex === childIndex)
    if (isDeletingActiveMapping) {
      setDescriptiveCompetencyDraft(null)
    }
  }

  const getDescriptiveMappingKey = (target = descriptiveCompetencyDraft?.target) => {
    if (!target) return ''
    return target.type === 'inside'
      ? `inside:${target.sectionId}:${target.childId}`
      : `section:${target.sectionId}`
  }

  const getDescriptiveTooltipPosition = (anchorElement = null, hasOpenDropdown = false) => {
    const rect = anchorElement?.getBoundingClientRect?.()
    const tooltipWidth = 360
    const tooltipHeight = hasOpenDropdown ? 420 : 320
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : tooltipWidth
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : tooltipHeight
    const usableTooltipHeight = Math.min(tooltipHeight, Math.max(260, viewportHeight - 24))
    const left = rect ? Math.min(Math.max(12, rect.left), Math.max(12, viewportWidth - tooltipWidth - 12)) : 24
    const opensAbove = rect ? rect.bottom + usableTooltipHeight + 12 > viewportHeight : false
    const top = rect
      ? (opensAbove
        ? Math.max(12, rect.top - usableTooltipHeight - 8)
        : Math.min(rect.bottom + 8, Math.max(12, viewportHeight - usableTooltipHeight - 12)))
      : 24
    const arrowLeft = rect ? Math.min(Math.max(18, rect.left + (rect.width / 2) - left), tooltipWidth - 18) : 24

    return { top, left, arrowLeft, opensAbove, maxHeight: usableTooltipHeight }
  }

  const getDescriptiveCurriculumValue = (item) => ({
    year: item?.year || question?.year || '',
    subject: item?.subject || question?.subject || '',
    topic: item?.topics?.[0] || question?.topics?.[0] || '',
    competency: item?.competencies?.[0] || question?.competencies?.[0] || '',
  })

  const getDescriptiveCompetencyDraftOptions = (draft = descriptiveCompetencyDraft) => {
    if (!draft) return { subjects: [], topics: [], competencies: [] }
    const subjects = Object.keys(SUBJECT_DIRECTORY)
    const subjectData = SUBJECT_DIRECTORY[draft.subject] ?? null
    const topicQuery = (draft.topicSearch ?? '').trim().toLowerCase()
    const competencyQuery = (draft.competencySearch ?? '').trim().toLowerCase()
    const sampleTopics = [
      ...(subjectData?.topics ?? []),
      'Head and Neck',
      'Lower Limb',
      'Abdomen',
      'Pelvis',
      'Embryology',
      'Histology',
      'Osteology',
      'Arthrology',
      'Myology',
      'Angiology',
      'Lymphatic System',
      'Peripheral Nerves',
      'Surface Anatomy',
      'Radiological Anatomy',
      'Clinical Anatomy',
      `${draft.subject || 'Subject'} Integration`,
    ]
    const topics = Array.from(new Set(sampleTopics)).slice(0, 20)
      .filter((topic) => topic.toLowerCase().includes(topicQuery))
    const prefix = {
      'Human Anatomy': 'AN',
      Physiology: 'PY',
      Pathology: 'PA',
    }[draft.subject] ?? 'CM'
    const baseTopic = draft.topic || draft.subject || 'Topic'
    const sampleCompetencies = Array.from({ length: 20 }, (_, index) => {
      const number = index + 1
      return {
        value: `${prefix}${number}.${(number % 9) + 1} ${baseTopic} sample competency ${number}`,
        label: `${baseTopic} sample competency ${number}`,
        topic: baseTopic,
      }
    })
    const competencies = Array.from(
      new Map([...(subjectData?.competencies ?? []), ...sampleCompetencies].map((item) => [item.value, item])).values()
    ).slice(0, 20)
      .filter((item) => !draft.topic || item.topic === draft.topic)
      .filter((item) => (
        item.value.toLowerCase().includes(competencyQuery)
        || (item.label ?? '').toLowerCase().includes(competencyQuery)
      ))

    return { subjects, topics, competencies }
  }

  const updateDescriptiveMappingTarget = (target, patch) => {
    if (!target) return
    if (target.type === 'section') {
      updateDescriptiveSubQuestion(target.sectionId, patch)
      return
    }
    updateDescriptiveInsideQuestion(target.sectionId, target.childId, patch, target.sectionIndex, target.childIndex)
  }

  const openDescriptiveCompetencyTooltip = (target, item, anchorElement = null) => {
    const itemCurriculum = getDescriptiveCurriculumValue(item)
    setDescriptiveCompetencyDraft({
      target,
      anchorElement,
      position: getDescriptiveTooltipPosition(anchorElement, false),
      year: itemCurriculum.year,
      subject: itemCurriculum.subject,
      topic: itemCurriculum.topic,
      competency: itemCurriculum.competency,
      topicSearch: '',
      competencySearch: '',
      openDropdown: '',
    })
  }

  const closeDescriptiveCompetencyTooltip = () => {
    setDescriptiveCompetencyDraft(null)
  }

  const updateDescriptiveCompetencyDraft = (patch) => {
    setDescriptiveCompetencyDraft((current) => {
      if (!current) return current
      const next = { ...current, ...patch }
      if (Object.prototype.hasOwnProperty.call(patch, 'openDropdown')) {
        next.position = getDescriptiveTooltipPosition(next.anchorElement, Boolean(next.openDropdown))
      }
      return next
    })
  }

  const clearDescriptiveCompetencyDraft = () => {
    setDescriptiveCompetencyDraft((current) => (
      current
        ? {
          ...current,
          year: '',
          subject: '',
          topic: '',
          competency: '',
          topicSearch: '',
          competencySearch: '',
          openDropdown: '',
        }
        : current
    ))
  }

  const applyDescriptiveCompetencyDraft = () => {
    if (!descriptiveCompetencyDraft) return
    const { target, year, subject, topic, competency } = descriptiveCompetencyDraft
    if (!year || !subject || !topic || !competency) return
    updateDescriptiveMappingTarget(target, {
      year,
      subject,
      topics: [topic],
      competencies: [competency],
    })
    closeDescriptiveCompetencyTooltip()
  }

  const renderDescriptiveCompetencyButton = (target, item, disabled = false) => {
    const selectedCompetency = item?.competencies?.[0] ?? ''
    const isOpen = getDescriptiveMappingKey(descriptiveCompetencyDraft?.target) === getDescriptiveMappingKey(target)

    if (!selectedCompetency) {
      return (
        <button
          type="button"
          className="question-bank-secondary-btn question-bank-descriptive-competency-btn is-icon-only"
          onClick={(event) => openDescriptiveCompetencyTooltip(target, item, event.currentTarget)}
          aria-expanded={isOpen}
          aria-label="Add Competency"
          data-tooltip="Add Competency"
          disabled={disabled}
        >
          <Plus size={16} strokeWidth={2.4} />
        </button>
      )
    }

    return (
      <div className="question-bank-descriptive-competency-chip">
        <span>{getShortCompetencyLabel(selectedCompetency)}</span>
        <button
          type="button"
          onClick={(event) => openDescriptiveCompetencyTooltip(target, item, event.currentTarget)}
          aria-label="Edit competency"
          title="Edit competency"
          disabled={disabled}
        >
          <FilePenLine size={13} strokeWidth={2.2} />
        </button>
      </div>
    )
  }

  const renderDescriptiveCurriculumControls = (target) => {
    const isOpen = getDescriptiveMappingKey(descriptiveCompetencyDraft?.target) === getDescriptiveMappingKey(target)
    if (!isOpen || !descriptiveCompetencyDraft || typeof document === 'undefined') return null

    const draft = descriptiveCompetencyDraft
    const options = getDescriptiveCompetencyDraftOptions(draft)
    const canApply = Boolean(draft.year && draft.subject && draft.topic && draft.competency)

    return createPortal((
      <div
        className={`question-bank-descriptive-map-popover ${draft.position?.opensAbove ? 'is-above' : ''}`}
        style={{
          top: `${draft.position?.top ?? 24}px`,
          left: `${draft.position?.left ?? 24}px`,
          maxHeight: `${draft.position?.maxHeight ?? 420}px`,
          '--question-bank-tooltip-arrow-left': `${draft.position?.arrowLeft ?? 24}px`,
        }}
        role="dialog"
        aria-labelledby="assessment-descriptive-map-title"
      >
        <div className="question-bank-descriptive-map-head">
          <div>
            <strong id="assessment-descriptive-map-title">Add Competency</strong>
            <span>Select curriculum mapping for this question.</span>
          </div>
          <button type="button" onClick={closeDescriptiveCompetencyTooltip} aria-label="Close competency selector">
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>

        <div className="question-bank-descriptive-map-grid">
          <label className="question-bank-descriptive-map-field">
            <span>Year</span>
            <select
              value={draft.year}
              onChange={(event) => updateDescriptiveCompetencyDraft({
                year: event.target.value,
                subject: '',
                topic: '',
                competency: '',
                openDropdown: '',
              })}
            >
              <option value="">Select year</option>
              {YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>

          <label className="question-bank-descriptive-map-field">
            <span>Subject</span>
            <select
              value={draft.subject}
              onChange={(event) => updateDescriptiveCompetencyDraft({
                subject: event.target.value,
                topic: '',
                competency: '',
                openDropdown: '',
              })}
            >
              <option value="">Select subject</option>
              {options.subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </label>

          <div className="question-bank-descriptive-map-field">
            <span>Topic</span>
            <div className={`question-bank-descriptive-map-dropdown ${draft.openDropdown === 'topic' ? 'is-open' : ''}`}>
              <button
                type="button"
                className="question-bank-descriptive-map-trigger"
                onClick={() => updateDescriptiveCompetencyDraft({ openDropdown: draft.openDropdown === 'topic' ? '' : 'topic', topicSearch: '' })}
                disabled={!draft.subject}
              >
                <span>{draft.topic || 'Select topic'}</span>
                <ChevronDown size={14} strokeWidth={2.3} />
              </button>
              {draft.openDropdown === 'topic' ? (
                <div className="question-bank-descriptive-map-menu">
                  <label className="question-bank-descriptive-map-search">
                    <Search size={13} strokeWidth={2.1} />
                    <input value={draft.topicSearch} onChange={(event) => updateDescriptiveCompetencyDraft({ topicSearch: event.target.value })} placeholder="Search topic" autoFocus />
                  </label>
                  <div className="question-bank-descriptive-map-options">
                    {options.topics.length ? options.topics.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        className={draft.topic === topic ? 'is-active' : ''}
                        onClick={() => updateDescriptiveCompetencyDraft({ topic, competency: '', topicSearch: '', competencySearch: '', openDropdown: '' })}
                      >
                        <span className="question-bank-descriptive-map-check" />
                        <span className="question-bank-descriptive-map-option-label">{topic}</span>
                      </button>
                    )) : <small>No topics found</small>}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="question-bank-descriptive-map-field">
            <span>Competency</span>
            <div className={`question-bank-descriptive-map-dropdown ${draft.openDropdown === 'competency' ? 'is-open' : ''}`}>
              <button
                type="button"
                className="question-bank-descriptive-map-trigger"
                onClick={() => updateDescriptiveCompetencyDraft({ openDropdown: draft.openDropdown === 'competency' ? '' : 'competency', competencySearch: '' })}
                disabled={!draft.topic}
              >
                <span>{draft.competency ? getShortCompetencyLabel(draft.competency) : 'Select competency'}</span>
                <ChevronDown size={14} strokeWidth={2.3} />
              </button>
              {draft.openDropdown === 'competency' ? (
                <div className="question-bank-descriptive-map-menu">
                  <label className="question-bank-descriptive-map-search">
                    <Search size={13} strokeWidth={2.1} />
                    <input value={draft.competencySearch} onChange={(event) => updateDescriptiveCompetencyDraft({ competencySearch: event.target.value })} placeholder="Search competency" autoFocus />
                  </label>
                  <div className="question-bank-descriptive-map-options">
                    {options.competencies.length ? options.competencies.map((competency) => (
                      <button
                        key={competency.value}
                        type="button"
                        className={draft.competency === competency.value ? 'is-active' : ''}
                        onClick={() => updateDescriptiveCompetencyDraft({ competency: competency.value, competencySearch: '', openDropdown: '' })}
                      >
                        <span className="question-bank-descriptive-map-check" />
                        <strong>{getShortCompetencyLabel(competency.value)}</strong>
                        <span className="question-bank-descriptive-map-option-label">{competency.label ?? competency.value}</span>
                      </button>
                    )) : <small>No competencies found</small>}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="question-bank-descriptive-map-actions">
          <button type="button" className="question-bank-ghost-btn" onClick={clearDescriptiveCompetencyDraft}>Clear</button>
          <button type="button" className="question-bank-primary-btn" onClick={applyDescriptiveCompetencyDraft} disabled={!canApply}>Apply</button>
        </div>
      </div>
    ), document.body)
  }

  const openMappingPicker = (picker) => {
    setActiveMappingPicker((current) => (current === picker ? null : picker))
    setMappingSearchValue('')
  }

  const handleMappingToggle = (value) => {
    if (activeMappingPicker === 'years') {
      updateQuestion({ year: value })
      setActiveMappingPicker(null)
      return
    }
    if (activeMappingPicker === 'subjects') {
      updateQuestion({ subject: value, topics: [], competencies: [] })
      setActiveMappingPicker(null)
      return
    }
    if (activeMappingPicker === 'topics') {
      updateQuestion((current) => {
        const topics = toggleSelection(current.topics, value)
        return {
          topics,
          competencies: current.competencies.filter((competency) => (
            (SUBJECT_DIRECTORY[current.subject]?.competencies ?? [])
              .some((item) => item.value === competency && topics.includes(item.topic))
          )),
        }
      })
      return
    }
    if (activeMappingPicker === 'competencies') {
      updateQuestion((current) => ({ competencies: toggleSelection(current.competencies, value) }))
    }
  }

  const handleQuestionImagesUpload = async (event) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    const images = await Promise.all(files.map(readImageFile))
    updateQuestion((current) => ({ images: [...current.images, ...images].slice(0, 4) }))
    event.target.value = ''
  }

  const handleOptionModeChange = (allowMultiple) => {
    updateQuestion((current) => {
      const { minCount } = getOptionModeConfig(allowMultiple)
      const options = current.options.length >= minCount
        ? current.options
        : [...current.options, ...Array.from({ length: minCount - current.options.length }, () => createOption(''))]
      return {
        allowMultiple,
        options,
        correctOptionIds: allowMultiple ? current.correctOptionIds : current.correctOptionIds.slice(0, 1),
      }
    })
  }

  const selectOptionDistractorError = (optionId, error) => {
    updateQuestion((current) => ({
      options: current.options.map((option) => (
        option.id === optionId
          ? { ...option, distractorErrors: [error] }
          : option
      )),
    }))
    setOpenDistractorMenuOptionId(null)
  }

  const clearOptionDistractorError = (optionId) => {
    updateQuestion((current) => ({
      options: current.options.map((option) => (
        option.id === optionId
          ? { ...option, distractorErrors: [] }
          : option
      )),
    }))
    setOpenDistractorMenuOptionId(null)
  }

  const togglePreviewCard = (id) => {
    setOpenPreviewCardIds((current) => (
      current.includes(id)
        ? current.filter((currentId) => currentId !== id)
        : [...current, id]
    ))
  }

  const toggleAllPreviewCards = () => {
    setOpenPreviewCardIds(areAllPreviewCardsOpen ? [] : previewQuestions.map((item) => item.id))
  }

  const handleAddOption = () => {
    if (!question) return

    const { maxCount } = getOptionModeConfig(question.allowMultiple)
    if (question.options.length >= maxCount) return
    updateQuestion((current) => ({ options: [...current.options, createOption('')] }))
  }

  return (
    <section className="create-assessment-workspace">
      <header className="create-assessment-workspace-header">
        <div className="create-assessment-title-row">
          {headerSetup.logoPreview ? (
            <img src={headerSetup.logoPreview} alt={headerSetup.logoName || 'Assessment logo'} className="create-assessment-logo" />
          ) : null}

          <div className="create-assessment-title-copy">
            <h1>{headerSetup.assessmentName || 'Untitled Assessment'}</h1>
            {detailItems.length ? <p>{detailItems.join(' / ')}</p> : null}
          </div>
        </div>

        <div className="create-assessment-header-actions">
          <button
            type="button"
            className="create-assessment-theme-btn"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun size={15} strokeWidth={2.2} />
            ) : (
              <Moon size={15} strokeWidth={2.2} />
            )}
          </button>
          <button type="button" onClick={() => onNavigate?.(APP_PAGES.ASSESSMENT_CREATE)}>
            <LogOut size={15} strokeWidth={2.2} />
            Exit
          </button>
        </div>
      </header>

      {saveStatus ? (
        <div className="create-assessment-status-toast" role="status" aria-live="polite">
          <span className="create-assessment-status-toast-icon">
            <Info size={16} strokeWidth={2.2} />
          </span>
          <span>{saveStatus}</span>
          <button type="button" aria-label="Close message" onClick={() => setSaveStatus('')}>
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>
      ) : null}

      {isApprovalModalOpen ? (
        <div className="create-assessment-approval-backdrop" role="presentation">
          <section className="create-assessment-approval-modal" role="dialog" aria-modal="true" aria-labelledby="create-assessment-approval-title">
            <header className="create-assessment-approval-head">
              <span>
                <strong id="create-assessment-approval-title">Send to Approval</strong>
                <em>{selectedAssessmentQuestionCount || savedQuestions.length} selected question will be sent for review</em>
              </span>
              <button type="button" aria-label="Close send to approval" onClick={() => setIsApprovalModalOpen(false)}>
                <X size={17} strokeWidth={2.2} />
              </button>
            </header>

            <div className="create-assessment-approval-body">
              <div className="create-assessment-approval-grid">
                <label>
                  <span>Faculty Name</span>
                  <span className="create-assessment-approval-select">
                    <UsersRound size={16} strokeWidth={2.2} />
                    <select
                      value={approvalDraft.facultyName}
                      onChange={(event) => setApprovalDraft((current) => ({ ...current, facultyName: event.target.value }))}
                    >
                      <option value="Dr. Meera Nair">Dr. Meera Nair</option>
                      <option value="Dr. Arjun Menon">Dr. Arjun Menon</option>
                      <option value="Dr. Kavitha Rao">Dr. Kavitha Rao</option>
                    </select>
                    <ChevronDown size={15} strokeWidth={2.2} />
                  </span>
                </label>

                <label>
                  <span>Employee ID</span>
                  <span className="create-assessment-approval-select">
                    <Database size={16} strokeWidth={2.2} />
                    <select
                      value={approvalDraft.employeeId}
                      onChange={(event) => setApprovalDraft((current) => ({ ...current, employeeId: event.target.value }))}
                    >
                      <option value="EMP1021">EMP1021</option>
                      <option value="EMP1048">EMP1048</option>
                      <option value="EMP1120">EMP1120</option>
                    </select>
                    <ChevronDown size={15} strokeWidth={2.2} />
                  </span>
                </label>

                <label>
                  <span>Designation</span>
                  <span className="create-assessment-approval-select">
                    <Settings size={16} strokeWidth={2.2} />
                    <select
                      value={approvalDraft.designation}
                      onChange={(event) => setApprovalDraft((current) => ({ ...current, designation: event.target.value }))}
                    >
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                    </select>
                    <ChevronDown size={15} strokeWidth={2.2} />
                  </span>
                </label>
              </div>

              <label className="create-assessment-approval-note">
                <span>Note</span>
                <textarea
                  value={approvalDraft.note}
                  onChange={(event) => setApprovalDraft((current) => ({ ...current, note: event.target.value }))}
                  placeholder="Add approval note"
                  rows={5}
                />
              </label>
            </div>

            <footer className="create-assessment-approval-actions">
              <button type="button" className="is-cancel" onClick={() => setIsApprovalModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="is-send" onClick={sendAssessmentToApproval}>
                <ArrowRight size={16} strokeWidth={2.2} />
                Send
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {publishedAssessmentNotice ? (
        <div className="create-assessment-publish-modal" role="status" aria-live="polite">
          <section className="create-assessment-publish-card">
            <span className="create-assessment-publish-icon" aria-hidden="true">
              <Check size={22} strokeWidth={2.5} />
            </span>
            <strong>
              {publishedAssessmentNotice.noticeType === 'update'
                ? `Your changes to ${publishedAssessmentNotice.assessmentName} have been successfully saved and published.`
                : `${publishedAssessmentNotice.assessmentName} has been successfully published.`}
            </strong>
            {publishedAssessmentNotice.noticeType === 'update' ? null : <p>Students have been notified.</p>}
            <small>Redirecting to Published Assessment in 2 sec.</small>
          </section>
        </div>
      ) : null}

      <div className="create-assessment-workspace-body">
      <main className="create-assessment-workspace-main">
        {activeCreateTab === 'questionBank' ? (
          <section className="create-assessment-question-bank-panel" aria-label="Question bank view">
            <QuestionBankNonCreatePage
              mode="readonly"
              embedded
              onNavigate={onNavigate}
              onAddToAssessment={addQuestionBankSelectionToAssessment}
            />
          </section>
        ) : null}

        {activeCreateTab === 'preview' ? (
          <section className="create-assessment-tab-panel" aria-label="Assessment preview">
            <div className="create-assessment-tab-panel-head">
              <span className="create-assessment-preview-head-copy">
                <strong>Preview</strong>
                <span>
                  <b>{formatSummaryNumber(assessmentSummary.totalQuestions)} questions</b>
                  <b>{formatSummaryNumber(assessmentSummary.totalMarks)} marks</b>
                  <b>{formatSummaryNumber(previewSectionCount)} sections</b>
                </span>
              </span>
              <span className="create-assessment-preview-section-actions">
                <button
                  type="button"
                  className="create-assessment-preview-expand-toggle"
                  onClick={toggleAllPreviewCards}
                  disabled={!previewQuestionCount}
                  aria-label={areAllPreviewCardsOpen ? 'Collapse all preview questions' : 'Expand all preview questions'}
                  title={areAllPreviewCardsOpen ? 'Collapse all' : 'Expand all'}
                >
                  {areAllPreviewCardsOpen ? <LayoutGrid size={15} strokeWidth={2.2} /> : <ListChecks size={15} strokeWidth={2.2} />}
                </button>
                <button
                  type="button"
                  className="create-assessment-preview-reset-section"
                  onClick={resetPreviewSections}
                  disabled={!previewQuestionCount && !customPreviewSections.length}
                >
                  <RotateCcw size={14} strokeWidth={2.2} />
                  <span>Reset Sections</span>
                </button>
                <button
                  type="button"
                  className="create-assessment-preview-add-section"
                  onClick={createPreviewSection}
                >
                  <Plus size={14} strokeWidth={2.2} />
                  <span>Create New Section</span>
                </button>
              </span>
            </div>
            {previewQuestionCount || customPreviewSections.length ? (
              <div className="create-assessment-preview-list">
                {previewSections.map((section, sectionIndex) => {
                  const sectionToneClass = section.isCustom ? 'type-custom' : `type-${section.key.toLowerCase()}`
                  return (
                  <section
                    key={section.key}
                    className={`create-assessment-preview-section-group ${sectionToneClass} ${draggedPreviewQuestionId || draggedPreviewSectionKey ? 'is-drop-ready' : ''}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      if (draggedPreviewSectionKey) {
                        movePreviewSectionBefore(draggedPreviewSectionKey, section.key)
                        setDraggedPreviewSectionKey(null)
                        return
                      }
                      if (!draggedPreviewQuestionId) return
                      movePreviewQuestionToSection(draggedPreviewQuestionId, section.key)
                      setDraggedPreviewQuestionId(null)
                    }}
                  >
                    <div
                      className="create-assessment-preview-section-head"
                      draggable
                      onDragStart={(event) => {
                        if (event.target.closest?.('button, input')) {
                          event.preventDefault()
                          return
                        }
                        setDraggedPreviewSectionKey(section.key)
                      }}
                      onDragEnd={() => setDraggedPreviewSectionKey(null)}
                    >
                      <div className="create-assessment-preview-section-title">
                        <strong>{PREVIEW_SECTION_ROMAN_NUMERALS[sectionIndex] ?? `${sectionIndex + 1}.`}</strong>
                        {editingPreviewSectionKey === section.key ? (
                          <input
                            value={previewSectionTitleDraft}
                            onChange={(event) => setPreviewSectionTitleDraft(event.target.value)}
                            onBlur={commitPreviewSectionTitle}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') commitPreviewSectionTitle()
                              if (event.key === 'Escape') {
                                setEditingPreviewSectionKey(null)
                                setPreviewSectionTitleDraft('')
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span>{section.title}</span>
                        )}
                        <button
                          type="button"
                          className="create-assessment-preview-section-edit"
                          onClick={() => startEditPreviewSectionTitle(section)}
                          aria-label={`Edit ${section.title} title`}
                          title="Edit title"
                        >
                          <Pencil size={13} strokeWidth={2.3} />
                        </button>
                      </div>
                      <span className="create-assessment-preview-section-tools">
                        {section.key === 'SAQs' ? (
                          <button
                            type="button"
                            className="create-assessment-preview-nmc-section"
                            onClick={createNmcSaqSections}
                            disabled={!savedQuestions.some((item) => getSummaryTypeLabel(item.type) === 'SAQs')}
                          >
                            <ListChecks size={14} strokeWidth={2.2} />
                            <span>NMC Section</span>
                          </button>
                        ) : null}
                        <span className="create-assessment-preview-section-marks">{formatSummaryNumber(section.marks)} Marks</span>
                        {section.isCustom ? (
                          <button
                            type="button"
                            className="create-assessment-preview-section-delete"
                            onClick={() => deletePreviewSection(section)}
                            aria-label={`Delete ${section.title} section`}
                            title="Delete section"
                          >
                            <Trash2 size={13} strokeWidth={2.3} />
                          </button>
                        ) : null}
                      </span>
                    </div>
                    <div className="create-assessment-preview-section-body">
                      {section.questions.length ? section.questions.map((item) => {
                  const index = previewQuestions.findIndex((previewQuestion) => previewQuestion.id === item.id)
                  const displayNumber = previewQuestionDisplayNumbers[item.id] ?? index + 1
                  const isDescriptive = isDescriptiveQuestionType(item.type)
                  const questionMarksTotal = getQuestionMarksTotal(item)
                  const optionalTagGroups = getQuestionOptionalTagGroups(item)
                    .map((group) => ({
                      ...group,
                      values: group.values.filter((value) => value && value !== DEFAULT_OPTIONAL_TAG),
                    }))
                    .filter((group) => group.values.length)
                  const correctOptionTexts = getCorrectOptionTexts(item)
                  const visibleOptions = (item.options ?? []).filter((option) => getRichTextPreview(option.label))
                  const descriptiveSections = item.descriptiveSections ?? []
                  const previewCurriculumText = isDescriptive && descriptiveSections.length ? '' : getPreviewCurriculumText(item)
                  const rootDescriptiveAnswer = getRichTextPreview(item.answerKey)
                  const descriptiveAnswerItems = isDescriptive
                    ? descriptiveSections.length
                      ? descriptiveSections.flatMap((section, sectionIndex) => {
                        const sectionLabel = ROMAN_NUMERALS[sectionIndex] ?? sectionIndex + 1
                        const sectionChildren = section.children ?? []
                        if (!sectionChildren.length) {
                          const sectionAnswer = getRichTextPreview(section.answerKey) || rootDescriptiveAnswer
                          return sectionAnswer ? [{
                            key: `${section.id ?? `${item.id}-section-${sectionIndex}`}-answer`,
                            label: `${sectionLabel}.`,
                            text: sectionAnswer,
                          }] : []
                        }

                        return sectionChildren.map((child, childIndex) => {
                          const childAnswer = getRichTextPreview(child.answerKey) || getRichTextPreview(section.answerKey) || rootDescriptiveAnswer
                          return childAnswer ? {
                            key: `${child.id ?? `${section.id ?? sectionIndex}-child-${childIndex}`}-answer`,
                            label: `${sectionLabel}.${String.fromCharCode(97 + childIndex)}.`,
                            text: childAnswer,
                          } : null
                        }).filter(Boolean)
                      })
                      : rootDescriptiveAnswer ? [{
                        key: `${item.id}-main-answer`,
                        label: 'Main question',
                        text: rootDescriptiveAnswer,
                      }] : []
                    : []
                  const isPreviewCardOpen = openPreviewCardIds.includes(item.id)
                  return (
                    <article
                      key={item.id}
                      className={`create-assessment-preview-card ${isPreviewCardOpen ? 'is-open' : ''}`}
                      draggable
                      onDragStart={() => setDraggedPreviewQuestionId(item.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        if (!draggedPreviewQuestionId) return
                        movePreviewQuestionBefore(draggedPreviewQuestionId, item.id)
                        setDraggedPreviewQuestionId(null)
                      }}
                      onDragEnd={() => setDraggedPreviewQuestionId(null)}
                    >
                      <div className="create-assessment-preview-main">
                        <div className="create-assessment-preview-title-row">
                          <div>
                            <strong>{displayNumber}. {getPreviewQuestionText(item)}</strong>
                            {!isPreviewCardOpen ? (
                              <span className="create-assessment-preview-subline">
                                <em className={`create-assessment-preview-type-text ${isDescriptive ? 'is-desc' : 'is-mcq'}`}>
                                  {isDescriptive ? getQuestionTypeMeta(item.type).shortLabel : 'MCQ'}
                                </em>
                                {previewCurriculumText ? <span>{previewCurriculumText}</span> : null}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {isPreviewCardOpen ? (
                          <div className="create-assessment-preview-detail">
                            {(item.images ?? []).length ? (
                              <div className="create-assessment-preview-images" aria-label="Question images">
                                {item.images.map((image, imageIndex) => (
                                  <figure key={image.id ?? `${image.name}-${imageIndex}`}>
                                    <span>{String.fromCharCode(65 + imageIndex)}</span>
                                    <img src={image.url} alt={image.name || `Question image ${imageIndex + 1}`} />
                                  </figure>
                                ))}
                              </div>
                            ) : null}

                            {!isDescriptive && visibleOptions.length ? (
                              <div className="create-assessment-preview-options">
                                {visibleOptions.map((option, optionIndex) => {
                                  const isCorrect = (item.correctOptionIds ?? []).includes(option.id)
                                  const distractorError = (option.distractorErrors ?? [])[0]
                                  return (
                                    <span key={option.id} className={isCorrect ? 'is-correct' : ''}>
                                      <strong>{String.fromCharCode(65 + optionIndex)}.</strong>
                                      <span>{getRichTextPreview(option.label)}</span>
                                      {distractorError ? (
                                        <span className="create-assessment-preview-option-info">
                                          <button type="button" aria-label={`View distractor error for option ${String.fromCharCode(65 + optionIndex)}`}>
                                            <Info size={12} strokeWidth={2.2} />
                                          </button>
                                          <span className="create-assessment-preview-option-tooltip" role="tooltip">
                                            <strong>Distractor Error</strong>
                                            <span>{distractorError}</span>
                                          </span>
                                        </span>
                                      ) : null}
                                    </span>
                                  )
                                })}
                              </div>
                            ) : null}

                            {!isDescriptive && correctOptionTexts.length ? (
                              <p className="create-assessment-preview-answer">
                                <strong>Answer</strong>
                                <span>{correctOptionTexts.join(', ')}</span>
                              </p>
                            ) : null}

                            {isDescriptive && descriptiveSections.length ? (
                              <div className="create-assessment-preview-sections">
                                {descriptiveSections.map((section, sectionIndex) => (
                                  <div key={section.id ?? sectionIndex} className="create-assessment-preview-section">
                                    <div>
                                      <strong>{ROMAN_NUMERALS[sectionIndex] ?? sectionIndex + 1}.</strong>
                                      <span>
                                        {getRichTextPreview(section.questionText) || 'Sub question'}
                                        {!(section.children ?? []).length && hasVisibleMarks(section.marks) && getDescriptiveCompetencyCode(section) ? (
                                          <span className="question-bank-created-descriptive-code">{getDescriptiveCompetencyCode(section)}</span>
                                        ) : null}
                                      </span>
                                      {!(section.children ?? []).length && hasVisibleMarks(section.marks) ? <b>{section.marks} Marks</b> : null}
                                    </div>
                                    {(section.children ?? []).length ? (
                                      <div className="create-assessment-preview-children">
                                        {section.children.map((child, childIndex) => (
                                          <span key={child.id ?? childIndex}>
                                            <span>
                                              <strong>{String.fromCharCode(97 + childIndex)}.</strong>
                                              <span>
                                                {getRichTextPreview(child.questionText) || 'Inside question'}
                                                {hasVisibleMarks(child.marks) && getDescriptiveCompetencyCode(child) ? (
                                                  <span className="question-bank-created-descriptive-code">{getDescriptiveCompetencyCode(child)}</span>
                                                ) : null}
                                              </span>
                                              {hasVisibleMarks(child.marks) ? <b>{child.marks} Marks</b> : null}
                                            </span>
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            <div className="create-assessment-preview-bottom">
                              <span className="create-assessment-preview-subline">
                                <em className={`create-assessment-preview-type-text ${isDescriptive ? 'is-desc' : 'is-mcq'}`}>
                                  {isDescriptive ? getQuestionTypeMeta(item.type).shortLabel : 'MCQ'}
                                </em>
                                {previewCurriculumText ? <span>{previewCurriculumText}</span> : null}
                              </span>

                              {(item.questionCategory || item.cognitiveLevel || item.isCritical || item.source || optionalTagGroups.length) ? (
                                <div className="create-assessment-preview-meta">
                                  {item.questionCategory ? <span className="question-bank-badge mint">{item.questionCategory}</span> : null}
                                  {item.cognitiveLevel ? <span className="question-bank-badge blue">{item.cognitiveLevel}</span> : null}
                                  {item.isCritical ? <span className="question-bank-badge soft">Critical</span> : null}
                                  {item.source && item.source !== 'Create Assessment' ? <span className="question-bank-badge soft">{item.source}</span> : null}
                                  {optionalTagGroups.length ? (
                                    <span className="question-bank-created-tags-wrap">
                                      <button
                                        type="button"
                                        className="question-bank-badge question-bank-created-tags-badge"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setOpenPreviewTagsId((current) => (current === item.id ? null : item.id))
                                        }}
                                        aria-expanded={openPreviewTagsId === item.id}
                                      >
                                        <Info size={13} strokeWidth={2.2} />
                                        View tags
                                      </button>
                                      <span
                                        className={`question-bank-created-tags-tooltip ${openPreviewTagsId === item.id ? 'is-open' : ''}`}
                                        role="tooltip"
                                      >
                                        {optionalTagGroups.map((group) => (
                                          <span key={group.label} className="question-bank-created-tags-group">
                                            <strong>{group.label}</strong>
                                            <span>
                                              {group.values.map((value) => (
                                                <span key={value}>{value}</span>
                                              ))}
                                            </span>
                                          </span>
                                        ))}
                                      </span>
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}

                              {isDescriptive && descriptiveAnswerItems.length ? (
                                <p className="create-assessment-preview-answer create-assessment-preview-answer-list">
                                  <strong>Answer &amp; Explanation</strong>
                                  <span>
                                    {descriptiveAnswerItems.map((answerItem) => (
                                      <span key={answerItem.key} className="create-assessment-preview-answer-row">
                                        <b>{answerItem.label}</b>
                                        <span>{answerItem.text}</span>
                                      </span>
                                    ))}
                                  </span>
                                </p>
                              ) : null}

                              {!isDescriptive && getRichTextPreview(item.answerKey) ? (
                                <p className="create-assessment-preview-answer">
                                  <strong>Explanation</strong>
                                  <span>{getRichTextPreview(item.answerKey)}</span>
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="create-assessment-preview-actions">
                        {(item.thinkingLevel || item.difficultyLevel || questionMarksTotal) ? (
                          <span className="create-assessment-preview-action-badges">
                            {item.thinkingLevel ? <span className={`assessment-page-table-value-pill ${getThinkingBadgeClassName(item.thinkingLevel)}`}>{item.thinkingLevel}</span> : null}
                            {item.difficultyLevel ? <span className="assessment-page-table-value-pill assessment-page-difficulty-badge">{item.difficultyLevel}</span> : null}
                            {questionMarksTotal ? (
                              <span className="create-assessment-preview-marks-badge">
                                {questionMarksTotal}M
                              </span>
                            ) : (
                              <span className="create-assessment-preview-marks-badge is-empty" aria-hidden="true">
                                0M
                              </span>
                            )}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          className="create-assessment-preview-edit"
                          onClick={() => editPreviewQuestion(item)}
                          aria-label={`Edit question ${displayNumber}`}
                          title="Edit question"
                        >
                          <FilePenLine size={15} strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          className="create-assessment-preview-delete"
                          onClick={() => deletePreviewQuestion(item)}
                          aria-label={`Delete question ${displayNumber} from preview`}
                          title="Delete question"
                        >
                          <Trash2 size={15} strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          className="create-assessment-preview-toggle"
                          onClick={() => togglePreviewCard(item.id)}
                          aria-expanded={isPreviewCardOpen}
                          aria-label={`${isPreviewCardOpen ? 'Collapse' : 'Expand'} question ${displayNumber}`}
                          title={isPreviewCardOpen ? 'Collapse' : 'Expand'}
                        >
                          {isPreviewCardOpen ? <ChevronUp size={15} strokeWidth={2.2} /> : <ChevronDown size={15} strokeWidth={2.2} />}
                        </button>
                      </div>
                    </article>
                  )
                }) : (
                  <div className="create-assessment-preview-section-empty">Drop questions here.</div>
                )}
                    </div>
                  </section>
                )})}
                {draggedPreviewQuestionId ? (
                  <div
                    className="create-assessment-preview-new-section-drop"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      movePreviewQuestionToOwnSection(draggedPreviewQuestionId)
                      setDraggedPreviewQuestionId(null)
                    }}
                  >
                    Drop outside to create the matching question section
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="assessment-create-placeholder">
                <p>No questions available for preview.</p>
              </div>
            )}
          </section>
        ) : null}

        {activeCreateTab === 'configuration' ? (
          <section className="create-assessment-tab-panel create-assessment-configuration-panel" aria-label="Assessment configuration">
            <div className="create-assessment-tab-panel-head">
              <strong>
                <Settings size={16} strokeWidth={2.2} />
                Assessment Publication Settings
              </strong>
              <span className="create-assessment-template-select">
                <select
                  value=""
                  onChange={(event) => {
                    loadAssessmentTemplate(event.target.value)
                    event.target.value = ''
                  }}
                  disabled={!savedTemplates.length}
                  aria-label="Saved templates"
                >
                  <option value="">{savedTemplates.length ? 'Saved Templates' : 'No templates saved'}</option>
                  {savedTemplates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
                <ChevronDown size={15} strokeWidth={2.2} aria-hidden="true" />
              </span>
            </div>
            <div className="create-assessment-configuration-form">
              <div className="assessment-create-setup-top" id="assessment-publication-header-section">
                <label
                  className="assessment-create-field assessment-create-upload"
                  data-tooltip="Upload logo in PNG, JPG, or SVG format. Square or 1:1 aspect ratio recommended. Max 2MB."
                >
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => uploadSetupLogo(event.target.files?.[0])}
                  />
                  <strong>
                    {setupDraft.logoPreview ? (
                      <img src={setupDraft.logoPreview} alt={setupDraft.logoName || 'Uploaded logo'} />
                    ) : (
                      <ImagePlus size={30} strokeWidth={2.1} />
                    )}
                  </strong>
                  {setupDraft.logoPreview ? (
                    <button type="button" onClick={removeSetupLogo} aria-label="Remove logo">
                      <Trash2 size={13} strokeWidth={2.2} />
                    </button>
                  ) : null}
                </label>

                <AssessmentSetupSelectField
                  className="assessment-create-college-field"
                  label="Select College Name"
                  value={setupDraft.collegeName}
                  options={CREATE_ASSESSMENT_SELECT_OPTIONS.colleges}
                  placeholder="Select College Name"
                  onChange={(value) => updateSetupDraft('collegeName', value)}
                  required
                />

                <label className="assessment-create-field assessment-create-name-field">
                  <span>Assessment Name<em className="assessment-create-required-mark">*</em></span>
                  <input
                    type="text"
                    value={setupDraft.assessmentName}
                    placeholder="Assessment Name"
                    onChange={(event) => updateSetupDraft('assessmentName', toCapitalizedCase(event.target.value))}
                  />
                </label>

                <div className="assessment-create-side-fields">
                  <div className="assessment-create-field assessment-create-exam-category-field">
                    <span>Exam Category<em className="assessment-create-required-mark">*</em></span>
                    <span className="assessment-create-exam-category-row">
                      <span className="assessment-create-select-wrap">
                        <select value={setupDraft.examCategory} onChange={(event) => updateSetupDraft('examCategory', event.target.value)}>
                          <option value="" disabled hidden>Select Exam Category</option>
                          {examCategoryOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} strokeWidth={2.2} aria-hidden="true" />
                      </span>
                      <span className="assessment-create-category-add-wrap">
                        <button
                          type="button"
                          className="assessment-create-category-add-btn"
                          onClick={() => {
                            setIsExamCategoryTooltipOpen((current) => !current)
                          }}
                          aria-label="Add exam category"
                          aria-expanded={isExamCategoryTooltipOpen}
                        >
                          <Plus size={15} strokeWidth={2.4} />
                        </button>
                        {isExamCategoryTooltipOpen ? (
                          <span className="assessment-create-category-tooltip" role="tooltip">
                            <input
                              type="text"
                              value={examCategoryDraft}
                              placeholder="Add Category"
                              onChange={(event) => setExamCategoryDraft(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault()
                                  addExamCategoryOption()
                                }
                              }}
                              autoFocus
                            />
                            <span>
                              <button type="button" className="is-secondary" onClick={clearExamCategoryDraft}>
                                Clear
                              </button>
                              <button type="button" onClick={addExamCategoryOption} disabled={!examCategoryDraft.trim()}>
                                Add
                              </button>
                            </span>
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </div>

                  <div className="assessment-create-year-action-row">
                    <AssessmentSetupSelectField
                      className="assessment-create-year-field"
                      label="Academic Year"
                      value={setupDraft.academicYear}
                      options={CREATE_ASSESSMENT_SELECT_OPTIONS.academicYears}
                      placeholder="Academic Year"
                      onChange={(value) => updateSetupDraft('academicYear', value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="assessment-create-setup-divider" />

              {isConfigurationSummaryVisible ? (
                <div className="create-assessment-configuration-summary" aria-label="Assessment configuration summary">
                  <span className="create-assessment-configuration-badge">
                    <strong>Exam Type :</strong>
                    <em>{configurationQuestionSummary.examType}</em>
                  </span>
                  <span className="create-assessment-configuration-badge">
                    <strong>Total Marks :</strong>
                    <em>
                      {formatSummaryNumber(configurationQuestionSummary.totalMarks)}
                      {' '}
                      ({configurationQuestionSummary.totalMarksDetail})
                    </em>
                  </span>
                  <span className="create-assessment-configuration-badge">
                    <strong>Duration :</strong>
                    <em>{configurationDurationLabel}</em>
                  </span>
                </div>
              ) : null}

              <div className={`create-assessment-schedule-block ${isSchedulingDetailsComplete ? 'is-complete' : ''}`} id="assessment-scheduling-details-section" aria-label="Exam schedule">
                <div className="create-assessment-schedule-head">
                  <strong>
                    {isSchedulingDetailsComplete ? <Check size={14} strokeWidth={2.4} /> : <CalendarClock size={14} strokeWidth={2.2} />}
                    Assessment Scheduling Details
                  </strong>
                  <div className={`create-assessment-schedule-head-toggle ${setupErrors.examDeliveryMode ? 'has-error' : ''}`}>
                    <div className="create-assessment-mode-toggle" role="group" aria-label="Select exam mode">
                      {['Online', 'Offline'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={`${setupDraft.examDeliveryMode === mode ? 'is-active' : ''} is-${mode.toLowerCase()}`.trim()}
                          onClick={() => {
                            updateSetupDraft('examDeliveryMode', mode)
                            setSetupErrors((current) => {
                              const {
                                examDate: _examDate,
                                startTime: _startTime,
                                practiceStartDate: _practiceStartDate,
                                practiceStartTime: _practiceStartTime,
                                practiceEndDate: _practiceEndDate,
                                practiceEndTime: _practiceEndTime,
                                mcqStartTime: _mcqStartTime,
                                descriptiveStartTime: _descriptiveStartTime,
                                mcqTimeLimit: _mcq,
                                descriptiveTimeLimit: _descriptive,
                                proctoredTotalDuration: _proctoredTotalDuration,
                                offlineDuration: _offline,
                                mcqDisplayType: _mcqDisplayType,
                                descriptiveDisplayType: _descriptiveDisplayType,
                                ...rest
                              } = current
                              return rest
                            })
                          }}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                    {setupErrors.examDeliveryMode ? <small>{setupErrors.examDeliveryMode}</small> : null}
                  </div>
                </div>

                {setupDraft.examDeliveryMode === 'Online' ? (
                  <>
                    <div className="create-assessment-schedule-layout">
                      <section className="create-assessment-timing-panel" aria-label="Exam timing">
                        <div className="create-assessment-timing-panel-head">
                          <strong>Exam Timing</strong>
                          <label className={`create-assessment-schedule-toggle-field is-inline ${setupErrors.supervisionType ? 'has-error' : ''}`}>
                            <span>Supervision Type <em>*</em></span>
                            <div className="create-assessment-mode-toggle" role="group" aria-label="Supervision type">
                              {['Practice Exam', 'Proctored Exams'].map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  className={setupDraft.supervisionType === option ? 'is-active' : ''}
                                  onClick={() => updateSupervisionType(option)}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                            {setupErrors.supervisionType ? <small>{setupErrors.supervisionType}</small> : null}
                          </label>
                        </div>

                        {setupDraft.supervisionType === 'Practice Exam' ? (
                          <div className="create-assessment-schedule-grid is-practice">
                            {renderScheduleDateField('practiceStartDate', 'Start Date')}
                            {renderScheduleStartTimeField('practiceStartTime', 'practiceStartPeriod', 'Start Time')}
                            {renderScheduleDateField('practiceEndDate', 'End Date')}
                            {renderScheduleStartTimeField('practiceEndTime', 'practiceEndPeriod', 'End Time')}
                          </div>
                        ) : setupDraft.supervisionType === 'Proctored Exams' ? (
                          <>
                            <div className="create-assessment-schedule-grid is-proctored-shared">
                              {renderScheduleDateField('examDate', 'Exam Date')}
                              {renderScheduleStartTimeField('startTime', 'startPeriod', 'Start Time')}
                              {renderScheduleDurationField('proctoredTotalDuration', 'Total Duration', 'proctoredTotalDuration', {
                                onChange: updateProctoredTotalDuration,
                              })}
                            </div>

                            {configurationQuestionSummary.hasMcq
                            && configurationQuestionSummary.hasDescriptive
                            && TIME_LIMIT_PATTERN.test(setupDraft.proctoredTotalDuration || '')
                            && getTimeValueMinutes(setupDraft.proctoredTotalDuration) > 0 ? (
                              setupDraft.splitProctoredDuration ? (
                                <section className="create-assessment-duration-split-panel" aria-label="Duration split">
                                  <div className="create-assessment-duration-split-head">
                                    <strong>Duration Split</strong>
                                    <span>Total Duration: {setupDraft.proctoredTotalDuration}</span>
                                  </div>
                                  <div className="create-assessment-proctored-split-row">
                                    {renderScheduleDurationField('mcqTimeLimit', 'MCQ Duration', 'mcqTimeLimit', {
                                      required: false,
                                      emptyLabel: '--:--',
                                      onChange: (value) => updateProctoredDurationSplit('mcqTimeLimit', value),
                                    })}
                                    {renderScheduleDurationField('descriptiveTimeLimit', 'Descriptive Duration', 'descriptiveTimeLimit', {
                                      required: false,
                                      emptyLabel: '--:--',
                                      onChange: (value) => updateProctoredDurationSplit('descriptiveTimeLimit', value),
                                    })}
                                  </div>
                                  <div className="create-assessment-duration-split-footer">
                                    <p className="create-assessment-duration-note">
                                      <Info size={14} strokeWidth={2.2} />
                                      Enter one duration and the remaining time will be filled automatically.
                                    </p>
                                    <button type="button" onClick={() => updateSplitProctoredDuration(false)}>
                                      Clear Split
                                    </button>
                                  </div>
                                </section>
                              ) : (
                                <div className="create-assessment-duration-split-prompt">
                                  <span>Need separate MCQ &amp; Descriptive time?</span>
                                  <button type="button" onClick={() => updateSplitProctoredDuration(true)}>
                                    Configure Split
                                  </button>
                                </div>
                              )
                            ) : null}
                          </>
                        ) : (
                          <div className="create-assessment-schedule-empty">Select a supervision type to configure schedule details.</div>
                        )}
                      </section>

                      {renderAnswerModePanel()}
                    </div>

                  </>
                ) : (
                  <div className="create-assessment-schedule-grid is-offline">
                    {renderScheduleDateField('examDate', 'Exam Date')}
                    {renderScheduleStartTimeField('startTime', 'startPeriod', 'Start Time')}
                    {renderScheduleDurationField('offlineDuration', 'Set Duration (Max)')}
                  </div>
                )}

              </div>

              {(
                setupDraft.examDeliveryMode === 'Online'
                && (
                  (configurationQuestionSummary.hasMcq && setupDraft.mcqDisplayType !== 'Read-Only')
                  || (configurationQuestionSummary.hasDescriptive && setupDraft.descriptiveDisplayType !== 'Read-Only')
                )
              ) ? (
                <section className={`create-assessment-threshold-section create-assessment-result-publish-collapse ${isResultPublishSectionOpen ? 'is-open' : ''}`} aria-label="Result publish settings">
                  <button
                    type="button"
                    className="create-assessment-threshold-section-head"
                    onClick={() => setIsResultPublishSectionOpen((current) => !current)}
                    aria-expanded={isResultPublishSectionOpen}
                  >
                    <span>
                      <Sparkles size={14} strokeWidth={2.2} />
                      Auto Result Publish
                    </span>
                    {isResultPublishSectionOpen ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
                  </button>

                  {isResultPublishSectionOpen ? (
                    <div className="create-assessment-threshold-section-body">
                      <div className="create-assessment-result-publish-options">
                        {configurationQuestionSummary.hasMcq ? (
                          <label className="create-assessment-result-publish-option">
                            <span>MCQ Auto Publish</span>
                            <span className="create-assessment-yes-no-toggle" role="group" aria-label="MCQ auto publish">
                              {['On', 'Off'].map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  className={(setupDraft.mcqAutoPublish || 'Off') === option ? 'is-active' : ''}
                                  onClick={() => updateSetupDraft('mcqAutoPublish', option)}
                                >
                                  {option}
                                </button>
                              ))}
                            </span>
                          </label>
                        ) : null}
                        {configurationQuestionSummary.hasDescriptive ? (
                          <label className="create-assessment-result-publish-option">
                            <span>Descriptive - Evaluation Required</span>
                            <span className="create-assessment-yes-no-toggle" role="group" aria-label="Descriptive evaluation required">
                              {['Yes', 'No'].map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  className={(setupDraft.descriptiveEvaluationRequired || 'Yes') === option ? 'is-active' : ''}
                                  onClick={() => updateSetupDraft('descriptiveEvaluationRequired', option)}
                                >
                                  {option}
                                </button>
                              ))}
                            </span>
                          </label>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {setupDraft.examDeliveryMode === 'Online' ? (
                <section className={`create-assessment-threshold-section create-assessment-instructions-section ${isStudentInstructionsOpen ? 'is-open' : ''}`} aria-label="Student instructions and assessment description">
                  <div className="create-assessment-instructions-section-head">
                    <button
                      type="button"
                      className="create-assessment-threshold-section-head"
                      onClick={() => setIsStudentInstructionsOpen((current) => !current)}
                      aria-expanded={isStudentInstructionsOpen}
                    >
                      <span>
                        <Info size={14} strokeWidth={2.2} />
                        Student Instructions &amp; Assessment Description
                      </span>
                    </button>
                    <span className="create-assessment-yes-no-toggle" role="group" aria-label="Provide student instructions and assessment description">
                      {['Yes', 'No'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={(setupDraft.provideStudentInstructions || 'No') === option ? 'is-active' : ''}
                          onClick={() => {
                            setSetupDraft((current) => ({
                              ...current,
                              provideStudentInstructions: option,
                              studentInstructions: option === 'Yes' && !stripHtml(current.studentInstructions ?? '').trim()
                                ? DEFAULT_STUDENT_INSTRUCTIONS
                                : current.studentInstructions,
                            }))
                            setIsStudentInstructionsOpen(option === 'Yes')
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </span>
                  </div>

                  {isStudentInstructionsOpen ? (
                    <div className="create-assessment-instructions-inline-body">
                    <div className="create-assessment-instructions-editor">
                      <div className="create-assessment-instructions-toolbar" aria-label="Instruction formatting toolbar">
                        {[
                          ['Bold', Bold, 'bold'],
                          ['Italic', Italic, 'italic'],
                          ['Underline', Underline, 'underline'],
                          ['Strike', Strikethrough, 'strikeThrough'],
                        ].map(([label, Icon, command]) => (
                          <button
                            key={label}
                            type="button"
                            aria-label={label}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => runStudentInstructionCommand(command)}
                          >
                            <Icon size={16} strokeWidth={2.2} />
                          </button>
                        ))}
                        <select
                          aria-label="Paragraph style"
                          defaultValue="Normal"
                          onChange={(event) => {
                            const tagName = event.target.value === 'Heading'
                              ? 'h3'
                              : event.target.value === 'Subheading'
                                ? 'h4'
                                : 'p'
                            runStudentInstructionCommand('formatBlock', tagName)
                          }}
                        >
                          <option>Normal</option>
                          <option>Heading</option>
                          <option>Subheading</option>
                        </select>
                        <select
                          aria-label="Font size"
                          defaultValue="16"
                          onChange={(event) => {
                            const sizeMap = { 14: '2', 16: '3', 18: '4', 20: '5' }
                            runStudentInstructionCommand('fontSize', sizeMap[event.target.value] ?? '3')
                          }}
                        >
                          <option>14</option>
                          <option>16</option>
                          <option>18</option>
                          <option>20</option>
                        </select>
                        {[
                          ['Bulleted list', List, 'insertUnorderedList'],
                          ['Numbered list', ListOrdered, 'insertOrderedList'],
                          ['Align left', AlignLeft, 'justifyLeft'],
                          ['Align center', AlignCenter, 'justifyCenter'],
                          ['Align right', AlignRight, 'justifyRight'],
                          ['Justify', AlignJustify, 'justifyFull'],
                        ].map(([label, Icon, command]) => (
                          <button
                            key={label}
                            type="button"
                            aria-label={label}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => runStudentInstructionCommand(command)}
                          >
                            <Icon size={16} strokeWidth={2.2} />
                          </button>
                        ))}
                      </div>
                      <div
                        ref={studentInstructionsEditorRef}
                        className="create-assessment-instructions-surface"
                        contentEditable
                        suppressContentEditableWarning
                        role="textbox"
                        aria-label="Student instructions and assessment description"
                        data-empty={!stripHtml(setupDraft.studentInstructions ?? '').trim()}
                        onInput={emitStudentInstructionsChange}
                        onBlur={emitStudentInstructionsChange}
                        placeholder="Students will see these instructions during the assessment."
                      />
                    </div>
                    <div className="create-assessment-instructions-actions">
                      <button type="button" className="is-clear" onClick={() => updateSetupDraft('studentInstructions', '')}>
                        Clear
                      </button>
                      <button type="button" className="is-primary" onClick={() => {
                        updateSetupDraft('provideStudentInstructions', 'Yes')
                        setIsStudentInstructionsOpen(false)
                      }}>
                        Save
                      </button>
                    </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              <div className={`create-assessment-threshold-section ${isThresholdSectionOpen ? 'is-open' : ''}`} id="assessment-threshold-settings-section">
                <button
                  type="button"
                  className="create-assessment-threshold-section-head"
                  onClick={() => setIsThresholdSectionOpen((current) => !current)}
                  aria-expanded={isThresholdSectionOpen}
                >
                  <span>
                    <SlidersHorizontal size={14} strokeWidth={2.2} />
                    Attainment Levels &amp; Thinking Level Threshold
                  </span>
                  {isThresholdSectionOpen ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
                </button>

                {isThresholdSectionOpen ? (
                  <div className="create-assessment-threshold-section-body">
              <div className="create-assessment-threshold-card-grid" aria-label="Threshold configuration">
                <div className="create-assessment-threshold-block" aria-label="Attainment levels threshold">
                  <div className="create-assessment-schedule-head">
                    <strong>
                      <SlidersHorizontal size={14} strokeWidth={2.2} />
                      Attainment Levels Threshold
                    </strong>
                    <button type="button" className="create-assessment-default-btn" onClick={resetAttainmentLevelsToDefault}>
                      Set as Default
                    </button>
                  </div>

                  <div className={`create-assessment-attainment-list ${setupErrors.attainmentLevels ? 'has-error' : ''}`}>
                    {(setupDraft.attainmentLevels ?? DEFAULT_ATTAINMENT_LEVELS).map((row, rowIndex, rows) => (
                      <div className="create-assessment-attainment-row" key={row.id}>
                        <input
                          type="text"
                          value={row.level}
                          aria-label="Attainment level"
                          onChange={(event) => updateAttainmentLevel(row.id, 'level', event.target.value)}
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={3}
                          value={row.minPercentage}
                          aria-label="Minimum percentage"
                          onChange={(event) => updateAttainmentLevel(row.id, 'minPercentage', event.target.value)}
                        />
                        <span aria-hidden="true">-</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={3}
                          value={row.maxPercentage}
                          aria-label="Maximum percentage"
                          onChange={(event) => updateAttainmentLevel(row.id, 'maxPercentage', event.target.value)}
                        />
                        <button
                          type="button"
                          aria-label="Delete attainment level"
                          disabled={rows.length <= 1}
                          onClick={() => deleteAttainmentLevel(row.id)}
                        >
                          <Trash2 size={14} strokeWidth={2.2} />
                        </button>
                        {rowIndex === rows.length - 1 ? (
                          <button type="button" className="is-add" aria-label="Add attainment level" onClick={addAttainmentLevel}>
                            <Plus size={15} strokeWidth={2.3} />
                          </button>
                        ) : (
                          <span aria-hidden="true" />
                        )}
                      </div>
                    ))}
                  </div>
                  {setupErrors.attainmentLevels ? <small className="create-assessment-threshold-error">{setupErrors.attainmentLevels}</small> : null}
                </div>

                <div className="create-assessment-threshold-block" aria-label="Thinking level threshold">
                  <div className="create-assessment-schedule-head">
                    <strong>
                      <Settings size={14} strokeWidth={2.2} />
                      Thinking Level Threshold
                    </strong>
                    <button type="button" className="create-assessment-default-btn" onClick={resetThinkingThresholdsToDefault}>
                      Set as Default
                    </button>
                  </div>

                  <div className="create-assessment-threshold-mode-toggle" role="tablist" aria-label="Thinking threshold type">
                    {[
                      { value: 'hotlot', label: 'HoT / LoT' },
                      { value: 'blooms', label: 'Blooms' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={(setupDraft.thinkingThresholdMode || 'hotlot') === option.value ? 'is-active' : ''}
                        onClick={() => updateThinkingThresholdMode(option.value)}
                        aria-pressed={(setupDraft.thinkingThresholdMode || 'hotlot') === option.value}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {(setupDraft.thinkingThresholdMode || 'hotlot') === 'blooms' ? (
                    <div className="create-assessment-threshold-fields is-blooms">
                      {BLOOMS_THRESHOLD_FIELDS.map((field) => (
                        <label key={field.key} className={`create-assessment-schedule-field ${setupErrors[field.key] ? 'has-error' : ''}`}>
                          <span>{field.label} <em>*</em></span>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={3}
                            value={setupDraft[field.key] ?? ''}
                            onChange={(event) => updateSetupDraft(field.key, event.target.value.replace(/[^\d]/g, '').slice(0, 3))}
                          />
                          {setupErrors[field.key] ? <small>{setupErrors[field.key]}</small> : null}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="create-assessment-threshold-fields">
                      <label className={`create-assessment-schedule-field ${setupErrors.lotThreshold ? 'has-error' : ''}`}>
                        <span>LoT Threshold <em>*</em></span>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={3}
                          value={setupDraft.lotThreshold ?? ''}
                          onChange={(event) => updateSetupDraft('lotThreshold', event.target.value.replace(/[^\d]/g, '').slice(0, 3))}
                        />
                        {setupErrors.lotThreshold ? <small>{setupErrors.lotThreshold}</small> : null}
                      </label>

                      <label className={`create-assessment-schedule-field ${setupErrors.hotThreshold ? 'has-error' : ''}`}>
                        <span>HoT Threshold <em>*</em></span>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={3}
                          value={setupDraft.hotThreshold ?? ''}
                          onChange={(event) => updateSetupDraft('hotThreshold', event.target.value.replace(/[^\d]/g, '').slice(0, 3))}
                        />
                        {setupErrors.hotThreshold ? <small>{setupErrors.hotThreshold}</small> : null}
                      </label>
                    </div>
                  )}
                </div>
              </div>
                  </div>
                ) : null}
              </div>

              <div className={`create-assessment-threshold-section create-assessment-assign-collapse ${isAssignSectionOpen ? 'is-open' : ''}`} id="assessment-assign-information-section" aria-label="Assign information">
                <button
                  type="button"
                  className="create-assessment-threshold-section-head"
                  onClick={() => setIsAssignSectionOpen((current) => !current)}
                  aria-expanded={isAssignSectionOpen}
                >
                  <span>
                    <UsersRound size={14} strokeWidth={2.2} />
                    Assign Information
                  </span>
                  {isAssignSectionOpen ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
                </button>

                {isAssignSectionOpen ? (
                  <div className="create-assessment-threshold-section-body">
                    <div className="create-assessment-assign-grid">
                      <label className="create-assessment-schedule-field">
                        <span>Select Course</span>
                        <span className="create-assessment-assign-select">
                          <select
                            value={setupDraft.assignCourse ?? ''}
                            disabled
                            onChange={(event) => updateSetupDraft('assignCourse', event.target.value)}
                          >
                            <option value="">Select Course</option>
                            {CREATE_ASSESSMENT_SELECT_OPTIONS.courses.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          <ChevronDown size={15} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                      </label>

                      <label className={`create-assessment-schedule-field ${setupErrors.assignYear ? 'has-error' : ''}`}>
                        <span>Select Year <em>*</em></span>
                        <span className="create-assessment-assign-select">
                          <select
                            value={setupDraft.assignYear ?? ''}
                            onChange={(event) => updateSetupDraft('assignYear', event.target.value)}
                          >
                            <option value="">Select Year</option>
                            {CREATE_ASSESSMENT_SELECT_OPTIONS.years.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          <ChevronDown size={15} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                        {setupErrors.assignYear ? <small>{setupErrors.assignYear}</small> : null}
                      </label>

                      <label className="create-assessment-schedule-field">
                        <span>Select SGT Group or Class</span>
                        <span className="create-assessment-assign-select">
                          <select
                            value={setupDraft.assignGroup ?? ''}
                            disabled
                            onChange={(event) => updateSetupDraft('assignGroup', event.target.value)}
                          >
                            <option value="">Select SGT Group or Class</option>
                            {CREATE_ASSESSMENT_SELECT_OPTIONS.sgtGroups.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          <ChevronDown size={15} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                      </label>

                      <label className={`create-assessment-schedule-toggle-field create-assessment-assign-sent-toggle ${setupErrors.approvalFlow ? 'has-error' : ''}`}>
                        <span>Sent to <em>*</em></span>
                        <div className="create-assessment-mode-toggle" role="group" aria-label="Send option">
                          {[
                            { value: 'Direct Publish', label: 'Direct Publish' },
                            { value: 'Send to Approval', label: 'Send to Approval' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={setupDraft.approvalFlow === option.value ? 'is-active' : ''}
                              onClick={() => updateSetupDraft('approvalFlow', option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        {setupErrors.approvalFlow ? <small>{setupErrors.approvalFlow}</small> : null}
                      </label>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="assessment-create-form-actions" id="assessment-configuration-actions-section">
                <button type="button" className="is-template" onClick={saveAssessmentTemplate}>
                  <Save size={15} strokeWidth={2.2} />
                  Save Template
                </button>
                <span className="assessment-create-form-actions-spacer" aria-hidden="true" />
                <button type="button" className="is-clear" onClick={clearSetupDraft}>
                  <RotateCcw size={15} strokeWidth={2.2} />
                  Clear
                </button>
                <button type="button" className="is-primary" onClick={openApprovalModal} disabled={!canSendAssessmentForApproval}>
                  <ArrowRight size={15} strokeWidth={2.2} />
                  {primaryPublicationActionLabel}
                </button>
              </div>

              <aside className={`create-assessment-process-checklist ${isConfigurationChecklistOpen ? 'is-open' : 'is-collapsed'}`} aria-label="Process checklist">
                <button
                  type="button"
                  className="create-assessment-process-checklist-trigger"
                  aria-expanded={isConfigurationChecklistOpen}
                  onClick={() => setIsConfigurationChecklistOpen((current) => !current)}
                >
                  <ListChecks size={18} strokeWidth={2.4} />
                  <span>Process</span>
                  <strong>{configurationChecklistCompletedCount}/{configurationChecklistItems.length}</strong>
                </button>
                {isConfigurationChecklistOpen ? (
                  <div className="create-assessment-process-checklist-panel">
                    <strong>Process checklist</strong>
                    <div className="create-assessment-process-checklist-list">
                      {configurationChecklistItems.map((item, index) => {
                        const isActive = !item.complete && index === configurationChecklistActiveIndex
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`create-assessment-process-checklist-item ${item.complete ? 'is-complete' : isActive ? 'is-active' : 'is-pending'}`}
                            onClick={() => scrollToConfigurationSection(item)}
                          >
                            <span className="create-assessment-process-checklist-icon">
                              {item.complete ? <Check size={14} strokeWidth={2.4} /> : index + 1}
                            </span>
                            <span>{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </aside>
            </div>
          </section>
        ) : null}

        {activeCreateTab === 'create' ? (
          <>
        {!question ? (
          <div className="question-bank-create-strip has-empty-state">
            <div className="question-bank-empty-state question-bank-create-empty-state">
              {renderQuestionTypePicker(
                'question-bank-type-select-trigger create-assessment-empty-type-trigger',
                <FilePenLine size={15} strokeWidth={2.3} />
              )}
            </div>
          </div>
        ) : null}

        {question ? (
          <section className={`question-bank-author-card ${question.isCritical ? 'is-critical' : ''}`}>
            <div className="question-bank-author-grid">
              <div className="question-bank-author-main">
                {!(isDescriptiveQuestionType(question.type) && (question.descriptiveSections ?? []).length > 0) ? (
                <section className="question-bank-curriculum-panel">
                  <div className="question-bank-curriculum-edit-card">
                    <div className="question-bank-curriculum-grid">
                      <div className="question-bank-field">
                        <button type="button" className="question-bank-mapping-trigger" onClick={() => openMappingPicker('years')}>
                          <strong>Year</strong>
                          <span>{question.year || 'Select year'}</span>
                        </button>
                      </div>
                      <div className="question-bank-field">
                        <button type="button" className="question-bank-mapping-trigger" onClick={() => openMappingPicker('subjects')}>
                          <strong>Subject</strong>
                          <span>{question.subject || 'Select subject'}</span>
                        </button>
                      </div>
                      <div className="question-bank-field">
                        <button type="button" className="question-bank-mapping-trigger" onClick={() => openMappingPicker('topics')} disabled={!question.subject}>
                          <strong>Topics - {question.topics.length} selected</strong>
                          <span>{getSelectionSummary(question.topics, 'Search and select topics')}</span>
                        </button>
                      </div>
                      <div className="question-bank-field">
                        <button type="button" className="question-bank-mapping-trigger" onClick={() => openMappingPicker('competencies')} disabled={!question.topics.length}>
                          <strong>Competency - {question.competencies.length} selected</strong>
                          <span>{getSelectionSummary(question.competencies, 'Search and select competencies', getShortCompetencyLabel)}</span>
                        </button>
                      </div>
                    </div>

                    {activeMappingPicker ? (
                      <MappingSelectorPanel
                        title={activeMappingPicker === 'years' ? 'Year' : activeMappingPicker === 'subjects' ? 'Subject' : activeMappingPicker === 'topics' ? 'Topics' : 'Competency'}
                        searchValue={mappingSearchValue}
                        onSearchChange={setMappingSearchValue}
                        items={activeMappingItems}
                        selected={activeMappingSelected}
                        onToggle={handleMappingToggle}
                        emptyLabel={activeMappingPicker === 'competencies' ? 'Select topics first or try another keyword.' : 'Try another keyword.'}
                      />
                    ) : null}
                  </div>
                </section>
                ) : null}

                <section className="question-bank-soft-panel question-bank-answer-panel">
                  <div className="question-bank-section-head">
                    <strong className="question-bank-step-title">STEP 1 : Question Creation</strong>
                    <div className="question-bank-question-head-controls">
                      {!question.images.length ? (
                        <label className="question-bank-question-image-add" aria-label="Add image">
                          <input type="file" accept="image/*" multiple onChange={handleQuestionImagesUpload} />
                          <ImagePlus size={14} strokeWidth={2.1} />
                          Add Image
                        </label>
                      ) : null}
                      <label className="question-bank-question-head-field question-bank-question-head-criticality">
                        <span>Criticality</span>
                        <button
                          type="button"
                          className={`question-bank-criticality-toggle ${question.isCritical ? 'is-active' : ''}`}
                          onClick={() => updateQuestion((current) => ({ isCritical: !current.isCritical }))}
                          aria-pressed={question.isCritical}
                        >
                          <span className="question-bank-criticality-switch" />
                          <strong>{question.isCritical ? 'ON' : 'OFF'}</strong>
                        </button>
                      </label>
                      <label className="question-bank-question-head-field question-bank-question-head-marks">
                        <span>Marks</span>
                        <input
                          value={isDescriptiveQuestionType(question.type) ? String(getQuestionMarksTotal(question)) : question.marks}
                          onChange={(event) => updateQuestion({ marks: event.target.value })}
                          disabled={isDescriptiveQuestionType(question.type) && (question.descriptiveSections ?? []).length > 0}
                        />
                      </label>
                    </div>
                  </div>

                  <label className="question-bank-field rich">
                    <RichMathEditor
                      value={question.questionText}
                      onChange={(nextValue) => updateQuestion({ questionText: nextValue })}
                      placeholder="Enter your question here"
                      minRows={5}
                      ariaLabel="Question text"
                      allowPastedImages={false}
                    />
                  </label>

                  {question.images.length ? (
                    <div className="question-bank-question-images">
                      {question.images.map((image, index) => (
                        <article key={image.id} className="question-bank-question-image-card">
                          <span className="question-bank-question-image-thumb">
                            <img src={image.url} alt={image.name} />
                          </span>
                          <span className="question-bank-question-image-letter">{String.fromCharCode(65 + index)}</span>
                          <span className="question-bank-question-image-actions">
                            <button type="button" className="question-bank-question-image-icon danger" onClick={() => updateQuestion((current) => ({ images: current.images.filter((item) => item.id !== image.id) }))} aria-label="Delete image">
                              <Trash2 size={12} strokeWidth={2.2} />
                            </button>
                          </span>
                        </article>
                      ))}
                      {question.images.length < 4 ? (
                        <label className="question-bank-question-image-add is-icon-only" aria-label="Add image">
                          <input type="file" accept="image/*" multiple onChange={handleQuestionImagesUpload} />
                          <ImagePlus size={18} strokeWidth={2.1} />
                        </label>
                      ) : null}
                    </div>
                  ) : null}

                  {question.type === 'MCQ' ? (
                    <>
                      <div className="question-bank-options-block">
                        <div className="question-bank-options-head">
                          <span className="question-bank-step-title-row">
                            <strong className="question-bank-step-title">STEP 2 : Options</strong>
                            <span className="question-bank-step-helper-badge">Enter Your Option &amp; Choose Right Answer</span>
                          </span>
                          <div className="question-bank-option-mode-toggle" role="group" aria-label="Answer type">
                            <button type="button" className={!question.allowMultiple ? 'is-active' : ''} onClick={() => handleOptionModeChange(false)}>Single</button>
                            <button type="button" className={question.allowMultiple ? 'is-active' : ''} onClick={() => handleOptionModeChange(true)}>Multiple</button>
                          </div>
                        </div>

                        <div className="question-bank-choice-list">
                          {question.options.map((option, index) => {
                            const { minCount } = getOptionModeConfig(question.allowMultiple)
                            const isMandatoryOption = index < minCount
                            const isSelectedOption = question.correctOptionIds.includes(option.id)
                            const hasOptionText = Boolean(getRichTextPreview(option.label))
                            const hasAnyCorrectOption = question.correctOptionIds.length > 0
                            const isIncorrectOption = hasAnyCorrectOption && hasOptionText && !isSelectedOption
                            const optionStateClass = isSelectedOption ? 'is-correct' : isIncorrectOption ? 'is-incorrect' : !hasOptionText ? 'is-empty' : ''

                            return (
                              <div key={option.id} className={`question-bank-choice-row ${optionStateClass}`}>
                                <span className="question-bank-choice-letter">{String.fromCharCode(65 + index)}</span>
                                <button
                                  type="button"
                                  className={`question-bank-choice-check ${question.allowMultiple ? 'is-multiple' : 'is-single'} ${isSelectedOption ? 'is-selected' : ''}`}
                                  onClick={() => updateQuestion((current) => ({
                                    correctOptionIds: current.allowMultiple
                                      ? current.correctOptionIds.includes(option.id)
                                        ? current.correctOptionIds.filter((currentId) => currentId !== option.id)
                                        : [...current.correctOptionIds, option.id]
                                      : [option.id],
                                  }))}
                                  aria-label={`${isSelectedOption ? 'Unselect' : 'Select'} option ${String.fromCharCode(65 + index)} as correct`}
                                  aria-pressed={isSelectedOption}
                                >
                                  {isSelectedOption ? <Check size={13} strokeWidth={2.5} /> : isIncorrectOption ? <X size={13} strokeWidth={2.5} /> : null}
                                </button>
                                <RichMathEditor
                                  value={option.label}
                                  onChange={(nextValue) => updateQuestion((current) => ({
                                    options: current.options.map((currentOption) => (
                                      currentOption.id === option.id ? { ...currentOption, label: nextValue } : currentOption
                                    )),
                                  }))}
                                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                  minRows={1}
                                  compact
                                  ariaLabel={`Option ${String.fromCharCode(65 + index)}`}
                                />
                                <div className="question-bank-choice-actions">
                                  <span className="question-bank-distractor-wrap">
                                    <button
                                      type="button"
                                      className={`question-bank-icon-btn question-bank-distractor-trigger ${(option.distractorErrors ?? []).length ? 'has-selection' : ''}`}
                                      onClick={() => {
                                        setOpenDistractorOptionId((current) => (current === option.id ? null : option.id))
                                        setOpenDistractorMenuOptionId(null)
                                      }}
                                      aria-label={`Distractor errors for option ${String.fromCharCode(65 + index)}`}
                                      aria-expanded={openDistractorOptionId === option.id}
                                      title="Distractor Error"
                                    >
                                      <Info size={14} strokeWidth={2.2} />
                                    </button>
                                    {openDistractorOptionId === option.id ? (
                                      <span className="question-bank-distractor-popover" role="tooltip">
                                        <strong className="question-bank-distractor-title">Distractor Error</strong>
                                        {(option.distractorErrors ?? []).length ? (
                                          <button
                                            type="button"
                                            className="question-bank-distractor-clear"
                                            onClick={() => clearOptionDistractorError(option.id)}
                                          >
                                            Clear selected
                                            <X size={11} strokeWidth={2.3} />
                                          </button>
                                        ) : null}
                                        <span className="question-bank-distractor-dropdown">
                                          <button
                                            type="button"
                                            className="question-bank-distractor-dropdown-trigger"
                                            onClick={() => {
                                              setOpenDistractorMenuOptionId((current) => (current === option.id ? null : option.id))
                                            }}
                                            aria-expanded={openDistractorMenuOptionId === option.id}
                                          >
                                            <span>{(option.distractorErrors ?? [])[0] ?? 'Select distractor error'}</span>
                                            <ChevronDown size={14} strokeWidth={2.2} />
                                          </button>
                                          {openDistractorMenuOptionId === option.id ? (
                                            <span className="question-bank-distractor-menu">
                                              <span className="question-bank-distractor-menu-list">
                                                {DISTRACTOR_ERROR_GROUPS.map((group) => (
                                                  <span key={group.heading} className="question-bank-distractor-group">
                                                    <strong>{group.heading}</strong>
                                                    <span>
                                                      {group.options.map((error) => {
                                                        const isSelected = (option.distractorErrors ?? []).includes(error)
                                                        return (
                                                          <button
                                                            key={error}
                                                            type="button"
                                                            className={isSelected ? 'is-active' : ''}
                                                            onClick={() => selectOptionDistractorError(option.id, error)}
                                                          >
                                                            <span>{isSelected ? <Check size={12} strokeWidth={2.4} /> : null}</span>
                                                            {error}
                                                          </button>
                                                        )
                                                      })}
                                                    </span>
                                                  </span>
                                                ))}
                                              </span>
                                            </span>
                                          ) : null}
                                        </span>
                                      </span>
                                    ) : null}
                                  </span>
                                  {!isMandatoryOption ? (
                                    <button
                                      type="button"
                                      className={`question-bank-icon-btn ${hasOptionText ? '' : 'is-empty-remove'}`}
                                      onClick={() => updateQuestion((current) => ({
                                        options: current.options.filter((currentOption) => currentOption.id !== option.id),
                                        correctOptionIds: current.correctOptionIds.filter((currentId) => currentId !== option.id),
                                      }))}
                                      aria-label="Delete option"
                                    >
                                      <Trash2 size={14} strokeWidth={2} />
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div className="question-bank-options-foot">
                          <button type="button" className="question-bank-add-option-icon" onClick={handleAddOption} disabled={question.options.length >= getOptionModeConfig(question.allowMultiple).maxCount}>
                            <Plus size={14} strokeWidth={2} />
                            Add Option
                          </button>
                        </div>
                      </div>

                      <div className="question-bank-answer-block">
                        <label className="question-bank-field">
                          <span className="question-bank-inline-field-badge">Answer &amp; Explanation</span>
                          <RichMathEditor
                            value={question.answerKey}
                            onChange={(nextValue) => updateQuestion({ answerKey: nextValue })}
                            placeholder="Add a short note for the expected answer."
                            minRows={1}
                            ariaLabel="Answer key"
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <div className="question-bank-descriptive-builder">
                      {(question.descriptiveSections ?? []).length ? (
                        <div className="question-bank-descriptive-sub-list">
                          {(question.descriptiveSections ?? []).map((section, sectionIndex) => {
                            const sectionChildren = section.children ?? []
                            const hasSectionText = Boolean(getRichTextPreview(section.questionText))
                            const hasSectionMapping = Boolean((section.topics ?? []).length || (section.competencies ?? []).length)
                            const lastInsideQuestion = sectionChildren[sectionChildren.length - 1]
                            const canAddInsideQuestion = hasSectionText && (!lastInsideQuestion || isDescriptiveLeafRowComplete(lastInsideQuestion))
                            return (
                            <div key={section.id} className="question-bank-descriptive-sub-card">
                              {(() => {
                                const sectionTarget = { type: 'section', sectionId: section.id }
                                return (
                                  <>
                              <div className={`question-bank-descriptive-row ${sectionChildren.length ? 'has-children' : ''}`}>
                                <span className="question-bank-descriptive-index">{ROMAN_NUMERALS[sectionIndex] ?? sectionIndex + 1}.</span>
                                <label className="question-bank-descriptive-text">
                                  <RichMathEditor
                                    value={section.questionText}
                                    onChange={(nextValue) => updateDescriptiveSubQuestion(section.id, (currentSection) => {
                                      const children = Array.isArray(currentSection.children) ? currentSection.children : []
                                      const hasText = Boolean(getRichTextPreview(nextValue))
                                      const shouldAutoMark = !children.length && hasText && !hasVisibleMarks(currentSection.marks)
                                      const nextMarks = shouldAutoMark ? getAutoGeneratedDescriptiveMarks() : currentSection.marks
                                      return {
                                        questionText: nextValue,
                                        ...(shouldAutoMark ? { marks: nextMarks } : {}),
                                        ...(hasText && !children.length && !getRichTextPreview(currentSection.answerKey)
                                          ? { answerKey: getAutoGeneratedDescriptiveAnswer(nextValue, nextMarks) }
                                          : {}),
                                      }
                                    })}
                                    onFocus={() => updateQuestion({ answerKey: question.answerKey ?? '' })}
                                    placeholder="Enter your question"
                                    minRows={1}
                                    compact
                                    ariaLabel={`Sub question ${sectionIndex + 1}`}
                                  />
                                </label>
                                {!sectionChildren.length ? renderDescriptiveCompetencyButton(sectionTarget, section, !hasSectionText) : null}
                                {!sectionChildren.length ? (
                                  <label className="question-bank-descriptive-marks">
                                    <input
                                      value={section.marks ?? '0'}
                                      onChange={(event) => updateDescriptiveSubQuestion(section.id, { marks: event.target.value })}
                                      inputMode="decimal"
                                    />
                                  </label>
                                ) : null}
                                <button type="button" className="question-bank-icon-btn question-bank-descriptive-delete-btn" onClick={() => deleteDescriptiveSubQuestion(section.id)} aria-label={`Delete sub question ${sectionIndex + 1}`}>
                                  <Trash2 size={14} strokeWidth={2.2} />
                                </button>
                              </div>
                              {renderDescriptiveCurriculumControls(sectionTarget)}
                                  </>
                                )
                              })()}

                              <div className="question-bank-descriptive-inside-list">
                                {sectionChildren.map((child, childIndex) => {
                                  const childTarget = { type: 'inside', sectionId: section.id, childId: child.id, sectionIndex, childIndex }
                                  return (
                                  <div key={child.id}>
                                  <div className="question-bank-descriptive-row is-child">
                                    <span className="question-bank-descriptive-index">{String.fromCharCode(97 + childIndex)}.</span>
                                    <label className="question-bank-descriptive-text">
                                      <RichMathEditor
                                        value={child.questionText}
                                        onChange={(nextValue) => updateDescriptiveInsideQuestion(section.id, child.id, (currentChild) => {
                                          const hasText = Boolean(getRichTextPreview(nextValue))
                                          const shouldAutoMark = hasText && !hasVisibleMarks(currentChild.marks)
                                          const nextMarks = shouldAutoMark ? getAutoGeneratedDescriptiveMarks() : currentChild.marks
                                          return {
                                            questionText: nextValue,
                                            ...(shouldAutoMark ? { marks: nextMarks } : {}),
                                            ...(hasText && !getRichTextPreview(currentChild.answerKey)
                                              ? { answerKey: getAutoGeneratedDescriptiveAnswer(nextValue, nextMarks) }
                                              : {}),
                                          }
                                        }, sectionIndex, childIndex)}
                                        placeholder="Enter your question"
                                        minRows={1}
                                        compact
                                        ariaLabel={`Inside question ${childIndex + 1}`}
                                      />
                                    </label>
                                    {renderDescriptiveCompetencyButton(childTarget, child, !Boolean(getRichTextPreview(child.questionText)))}
                                    <label className="question-bank-descriptive-marks">
                                      <input value={child.marks ?? '0'} onChange={(event) => updateDescriptiveInsideQuestion(section.id, child.id, { marks: event.target.value }, sectionIndex, childIndex)} inputMode="decimal" />
                                    </label>
                                    <button type="button" className="question-bank-icon-btn question-bank-descriptive-delete-btn" onClick={() => deleteDescriptiveInsideQuestion(section.id, child.id, sectionIndex, childIndex)} aria-label={`Delete inside question ${childIndex + 1}`}>
                                      <Trash2 size={14} strokeWidth={2.2} />
                                    </button>
                                  </div>
                                  {renderDescriptiveCurriculumControls(childTarget)}
                                  </div>
                                  )
                                })}
                              </div>

                              {hasSectionText ? (
                              <div className="question-bank-descriptive-sub-actions">
                                <button
                                  type="button"
                                  className={`question-bank-secondary-btn ${hasSectionMapping && (sectionChildren.length || hasVisibleMarks(section.marks)) ? 'question-bank-next-action' : ''}`}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    addDescriptiveInsideQuestion(section.id, sectionIndex)
                                  }}
                                  disabled={!canAddInsideQuestion}
                                >
                                  <Plus size={14} strokeWidth={2.2} />
                                  Add Inside Question
                                </button>
                              </div>
                              ) : null}
                            </div>
                            )
                          })}
                        </div>
                      ) : (
                        null
                      )}
                      <div className="question-bank-descriptive-builder-foot">
                        <button
                          type="button"
                          className={`question-bank-secondary-btn ${getRichTextPreview(question.questionText) && !(question.descriptiveSections ?? []).length ? 'question-bank-next-action' : ''}`}
                          onClick={addDescriptiveSubQuestion}
                          disabled={!getRichTextPreview(question.questionText) || (() => {
                            const sections = question.descriptiveSections ?? []
                            const lastSection = sections[sections.length - 1]
                            if (!lastSection) return false
                            const children = lastSection.children ?? []
                            const lastChild = children[children.length - 1]
                            return lastChild ? !isDescriptiveLeafRowComplete(lastChild) : !isDescriptiveSectionComplete(lastSection)
                          })()}
                        >
                          <Plus size={14} strokeWidth={2.2} />
                          Add Sub Question
                        </button>
                      </div>
                      <div className="question-bank-answer-block question-bank-descriptive-answer-block">
                        <label className="question-bank-field">
                          <span className="question-bank-inline-field-badge">Answer &amp; Explanation</span>
                          <RichMathEditor
                            value={question.answerKey}
                            onChange={(nextValue) => updateQuestion({ answerKey: nextValue })}
                            placeholder="Add answer and explanation"
                            minRows={3}
                            ariaLabel="Descriptive answer and explanation"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </section>
              </div>

              <aside className="question-bank-side-panel">
                <div className="question-bank-ai-instruction-card">
                  <strong>
                    <Sparkles size={13} strokeWidth={2.2} />
                    Question Generation Process
                  </strong>
                  <ul>
                    <li>Enter the question text and select Create.</li>
                    <li>The AI engine will automatically generate data for optional fields.</li>
                    <li>Review the question to manually apply images, criticality levels, and marks, as these are not auto-generated.</li>
                  </ul>
                </div>

                <div className="question-bank-assessment-panel question-bank-assessment-inline">
                  <div className="question-bank-section-head">
                    <button type="button" className="question-bank-assessment-title-btn" onClick={() => setIsOptionalTagsOpen(false)} aria-expanded={!isOptionalTagsOpen}>
                      <span>Assessment Tags</span>
                      {isOptionalTagsOpen ? <ChevronDown size={15} strokeWidth={2.4} /> : <ChevronUp size={15} strokeWidth={2.4} />}
                    </button>
                  </div>

                  {!isOptionalTagsOpen ? (
                    <>
                      <label className="question-bank-field">
                        <span>Question Category</span>
                        <select
                          className={!question.questionCategory ? 'is-placeholder' : ''}
                          value={getQuestionCategorySelectValue(question.type, question.questionCategory)}
                          onChange={(event) => updateQuestion({ questionCategory: event.target.value })}
                        >
                          <option value="" disabled>Select Category</option>
                          {getQuestionCategorySelectOptions(question.type).map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <label className="question-bank-field">
                        <span>Cognitive Level</span>
                        <select className={!question.cognitiveLevel ? 'is-placeholder' : ''} value={question.cognitiveLevel} onChange={(event) => updateQuestion({ cognitiveLevel: event.target.value })}>
                          <option value="" disabled>Select Cognitive Level</option>
                          {COGNITIVE_LEVEL_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <label className="question-bank-field">
                        <span>Thinking Level</span>
                        <select className={!question.thinkingLevel ? 'is-placeholder' : ''} value={question.thinkingLevel} onChange={(event) => updateQuestion({ thinkingLevel: event.target.value })}>
                          <option value="" disabled>Select Thinking Level</option>
                          {THINKING_LEVEL_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <label className="question-bank-field">
                        <span>Difficulty Level</span>
                        <select className={!question.difficultyLevel ? 'is-placeholder' : ''} value={question.difficultyLevel} onChange={(event) => updateQuestion({ difficultyLevel: event.target.value })}>
                          <option value="">Select Difficulty Level</option>
                          {DIFFICULTY_LEVEL_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <button type="button" className="question-bank-optional-tags-badge" onClick={() => setIsOptionalTagsOpen(true)} aria-expanded={isOptionalTagsOpen}>
                        <Info size={13} strokeWidth={2.2} />
                        <span>Add More (Optional)</span>
                        <ChevronDown size={14} strokeWidth={2.4} />
                      </button>
                      <div className="question-bank-assessment-actions create-assessment-card-actions">
                        <button
                          type="button"
                          className="question-bank-secondary-btn"
                          onClick={resetCurrentQuestion}
                          disabled={!question}
                        >
                          <RotateCcw size={14} strokeWidth={2.2} />
                          Clear
                        </button>
                        <button
                          type="button"
                          className="question-bank-primary-btn"
                          onClick={createQuestionWithGeneration}
                          disabled={!question || !canCreate}
                        >
                          {editingPreviewQuestionId ? <FilePenLine size={14} strokeWidth={2.2} /> : <Sparkles size={14} strokeWidth={2.2} />}
                          {editingPreviewQuestionId ? 'Update' : 'Create'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="question-bank-optional-tags-panel">
                      <label className="question-bank-field">
                        <span>Cognitive Function</span>
                        <select value={question.cognitiveFunction} onChange={(event) => updateQuestion({ cognitiveFunction: event.target.value })}>
                          <option value="">Select Cognitive Function</option>
                          {COGNITIVE_FUNCTION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <label className="question-bank-field">
                        <span>Skill Focus</span>
                        <select value={question.skillFocus} onChange={(event) => updateQuestion({ skillFocus: event.target.value })}>
                          <option value="">Select Skill Focus</option>
                          {SKILL_FOCUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <label className="question-bank-field">
                        <span>Organ System</span>
                        <select value={question.organSystem} onChange={(event) => updateQuestion({ organSystem: event.target.value })}>
                          <option value="">Select Organ System</option>
                          {ORGAN_SYSTEM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <OptionalTagTextInput
                        label="Organ Sub System"
                        values={question.organSubSystems}
                        onChange={(values) => updateQuestion({ organSubSystems: values })}
                      />
                      <OptionalTagTextInput
                        label="Disease Tags"
                        values={question.diseaseTags}
                        onChange={(values) => updateQuestion({ diseaseTags: values })}
                      />
                      <OptionalTagTextInput
                        label="Key Concept"
                        values={question.keyConcepts}
                        onChange={(values) => updateQuestion({ keyConcepts: values })}
                      />
                      <div className="question-bank-assessment-actions create-assessment-card-actions">
                        <button
                          type="button"
                          className="question-bank-secondary-btn"
                          onClick={resetCurrentQuestion}
                          disabled={!question}
                        >
                          <RotateCcw size={14} strokeWidth={2.2} />
                          Clear
                        </button>
                        <button
                          type="button"
                          className="question-bank-primary-btn"
                          onClick={createQuestionWithGeneration}
                          disabled={!question || !canCreate}
                        >
                          {editingPreviewQuestionId ? <FilePenLine size={14} strokeWidth={2.2} /> : <Sparkles size={14} strokeWidth={2.2} />}
                          {editingPreviewQuestionId ? 'Update' : 'Create'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </section>
        ) : null}

          </>
        ) : null}
      </main>

      <aside className="create-assessment-right-rail" aria-label="Assessment actions and summary">
        <div className="create-assessment-summary-card" aria-label="Assessment question summary">
          <div className="create-assessment-summary-total-row">
            <span>Total Marks</span>
            <strong className="is-marks">{formatSummaryNumber(assessmentSummary.totalMarks)}</strong>
          </div>
          <div className="create-assessment-summary-total-row">
            <span>No. of Question</span>
            <strong className="is-questions">{formatSummaryNumber(assessmentSummary.totalQuestions)}</strong>
          </div>
          {assessmentSummary.rows.length ? (
            <div className="create-assessment-summary-table">
              <div className="create-assessment-summary-head">
                <span />
                <span>No. of Qus</span>
                <span>Marks</span>
              </div>
              {assessmentSummary.rows.map((row) => (
                <div className="create-assessment-summary-row" key={row.type}>
                  <span>{row.type}</span>
                  <strong className="is-questions">{formatSummaryNumber(row.count)}</strong>
                  <strong className="is-marks">{formatSummaryNumber(row.marks)}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {isGeneratingQuestion ? (
          <div className="create-assessment-generation-card" aria-live="polite">
            <div className="create-assessment-generation-head">
              <span className="create-assessment-generation-icon">
                <Sparkles size={16} strokeWidth={2.2} />
              </span>
              <span>
                <strong>Generating {activeGenerationJob?.typeLabel || 'MCQ'}</strong>
                <small>{activeGenerationJob?.questionPreviewText || 'Completing missing fields'}</small>
              </span>
              <b className="create-assessment-generation-percent">{generationPercent}%</b>
            </div>
            <span className="create-assessment-generation-bar" aria-hidden="true">
              <i style={{ width: `${generationPercent}%` }} />
            </span>
            <p className="create-assessment-generation-running">
              <span>{generationRunningText}</span>
              <strong>{generationQueueLabel}</strong>
            </p>
          </div>
        ) : null}
        <div className="create-assessment-action-panel" aria-label="Create actions">
        <strong>Create Assessment</strong>
        <div className={`question-bank-type-select-panel ${isActionQuestionTypePickerOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            className={`create-assessment-action-btn is-create ${hasSelectedCreateTab && activeCreateTab === 'create' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveCreateTab('create')
              setHasSelectedCreateTab(true)
              setIsQuestionTypePickerOpen(false)
              setIsDescriptiveTypePickerOpen(false)
              if (isActionQuestionTypePickerOpen) setIsActionDescriptiveTypePickerOpen(false)
              setIsActionQuestionTypePickerOpen((current) => !current)
            }}
            aria-expanded={isActionQuestionTypePickerOpen}
            aria-pressed={hasSelectedCreateTab && activeCreateTab === 'create'}
          >
            <ListChecks size={16} strokeWidth={2.2} />
            <span>{selectedQuestionTypeLabel}</span>
            <ChevronDown size={15} strokeWidth={2.4} />
          </button>

          {isActionQuestionTypePickerOpen ? (
            <div className="question-bank-type-picker">
              {QUESTION_TYPE_CARDS.slice(0, 1).map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.type}
                    type="button"
                    className="question-bank-type-picker-item"
                    onClick={() => handleQuestionTypeChange(item.type)}
                  >
                    <span className="question-bank-type-picker-icon">
                      <Icon size={15} strokeWidth={2} />
                    </span>
                    <span>{item.menuLabel ?? item.shortLabel}</span>
                  </button>
                )
              })}
              <div className={`question-bank-type-picker-group ${isActionDescriptiveTypePickerOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="question-bank-type-picker-item question-bank-type-picker-menu-trigger"
                  onClick={() => setIsActionDescriptiveTypePickerOpen((current) => !current)}
                  aria-expanded={isActionDescriptiveTypePickerOpen}
                >
                  <span className="question-bank-type-picker-icon">
                    <FilePenLine size={15} strokeWidth={2} />
                  </span>
                  <span>Descriptive</span>
                  <ChevronDown size={15} strokeWidth={2.4} />
                </button>
                {isActionDescriptiveTypePickerOpen ? (
                  <div className="question-bank-type-picker-menu">
                    {DESCRIPTIVE_QUESTION_TYPES.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        className="question-bank-type-picker-menu-item"
                        onClick={() => handleQuestionTypeChange(item.type)}
                      >
                        <span className="question-bank-type-picker-icon">
                          <FilePenLine size={15} strokeWidth={2} />
                        </span>
                        <span>{item.menuLabel}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className={`create-assessment-action-btn ${activeCreateTab === 'questionBank' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveCreateTab('questionBank')
            setHasSelectedCreateTab(true)
            setIsQuestionTypePickerOpen(false)
            setIsDescriptiveTypePickerOpen(false)
            setIsActionQuestionTypePickerOpen(false)
            setIsActionDescriptiveTypePickerOpen(false)
            setSelectedCreateQuestionTypeLabel('')
          }}
          aria-pressed={activeCreateTab === 'questionBank'}
        >
          <Database size={16} strokeWidth={2.2} />
          <span>Question Bank</span>
        </button>
        <button
          type="button"
          className="create-assessment-action-btn"
          disabled
        >
          <History size={16} strokeWidth={2.2} />
          <span>Assessment History</span>
        </button>
        <button
          type="button"
          className={`create-assessment-action-btn ${activeCreateTab === 'preview' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveCreateTab('preview')
            setHasSelectedCreateTab(true)
            setIsQuestionTypePickerOpen(false)
            setIsDescriptiveTypePickerOpen(false)
            setIsActionQuestionTypePickerOpen(false)
            setIsActionDescriptiveTypePickerOpen(false)
            setSelectedCreateQuestionTypeLabel('')
          }}
          disabled={!selectedAssessmentQuestionCount}
          aria-pressed={activeCreateTab === 'preview'}
        >
          <Eye size={16} strokeWidth={2.2} />
          <span>Preview</span>
          {selectedAssessmentQuestionCount ? <b className="create-assessment-action-count">{selectedAssessmentQuestionCount}</b> : null}
        </button>
        <button
          type="button"
          className={`create-assessment-action-btn ${activeCreateTab === 'configuration' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveCreateTab('configuration')
            setHasSelectedCreateTab(true)
            setIsQuestionTypePickerOpen(false)
            setIsDescriptiveTypePickerOpen(false)
            setIsActionQuestionTypePickerOpen(false)
            setIsActionDescriptiveTypePickerOpen(false)
            setSelectedCreateQuestionTypeLabel('')
          }}
          aria-pressed={activeCreateTab === 'configuration'}
        >
          <Settings size={16} strokeWidth={2.2} />
          <span>Configuration</span>
        </button>
        <button
          type="button"
          className="create-assessment-action-btn is-draft"
          onClick={saveAssessmentDraft}
          disabled={isSaveAssessmentDraftDisabled}
          aria-disabled={isSaveAssessmentDraftDisabled}
        >
          <Save size={16} strokeWidth={2.2} />
          <span>Save as Draft</span>
        </button>
        <button type="button" className="create-assessment-action-btn is-primary" onClick={openApprovalModal} disabled={!canSendAssessmentForApproval}>
          <ArrowRight size={16} strokeWidth={2.2} />
          <span>{primaryPublicationActionLabel}</span>
        </button>
        </div>
      </aside>
      </div>
    </section>
  )
}
