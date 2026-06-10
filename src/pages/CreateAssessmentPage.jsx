import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Database,
  Eye,
  FilePenLine,
  History,
  ImagePlus,
  Info,
  ListChecks,
  LogOut,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  Sparkles,
  Sun,
  Trash2,
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
const CREATE_ASSESSMENT_QUESTIONS_KEY = 'vx-create-assessment-questions'
const CREATE_ASSESSMENT_SECTION_TITLES_KEY = 'vx-create-assessment-section-titles'
const CREATE_ASSESSMENT_SECTION_ORDER_KEY = 'vx-create-assessment-section-order'
const CREATE_ASSESSMENT_CUSTOM_SECTIONS_KEY = 'vx-create-assessment-custom-sections'
const ASSESSMENT_DRAFTS_STORAGE_KEY = 'vx-assessment-drafts'
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
const CREATE_ASSESSMENT_SELECT_OPTIONS = {
  colleges: [
    'Sri Ramachandra Institute of Higher Education and Research',
    'Saveetha Institute of Medical and Technical Sciences',
    'SRM Medical College Hospital and Research Centre',
    'Sri Manakula Vinayagar Medical College and Hospital',
  ],
  examCategories: [
    'Internal Assessment',
    'University Exam',
    'Formative Assessment',
    'Summative Assessment',
    'Theory Exam',
    'Practical Exam',
    'Viva Voce',
    'Mock Test',
    'Entrance/Screening Test',
  ],
  courses: ['India MBBS (NMC Syllabus)'],
  years: YEAR_OPTIONS,
  academicYears: ['2024 - 2025', '2025 - 2026', '2026 - 2027', '2027 - 2028'],
}
const CREATE_ASSESSMENT_DEFAULT_SETUP = {
  collegeName: '',
  logoName: '',
  logoPreview: '',
  assessmentName: '',
  academicYear: '2025 - 2026',
  examCategory: '',
  course: '',
  year: '',
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

function AssessmentSetupSelectField({ label, value, options, placeholder, onChange, className = '' }) {
  return (
    <label className={`assessment-create-field ${className}`.trim()}>
      <span>{label}</span>
      <span className="assessment-create-select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
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
    return row && typeof row === 'object' ? row : {}
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

export default function CreateAssessmentPage({ onNavigate, theme = 'light', onToggleTheme }) {
  const [setup, setSetup] = useState(() => ({
    ...CREATE_ASSESSMENT_DEFAULT_SETUP,
    ...readCreateAssessmentSetup(),
  }))
  const [setupDraft, setSetupDraft] = useState(() => ({
    ...CREATE_ASSESSMENT_DEFAULT_SETUP,
    ...readCreateAssessmentSetup(),
  }))
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
  const isGeneratingQuestion = generationJobs.length > 0

  const detailItems = [setup.collegeName, setup.academicYear, setup.examCategory, setup.course, setup.year].filter(Boolean)
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

  const saveSetupConfiguration = () => {
    const nextSetup = {
      ...setupDraft,
      assessmentId: setupDraft.assessmentId || setup.assessmentId || `assessment-${Date.now()}`,
      createdAt: setupDraft.createdAt || setup.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify(nextSetup))
    setSetup(nextSetup)
    setSetupDraft(nextSetup)
    setSaveStatus('Configuration saved')
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
      ? 'Preparing distractors...'
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
  const canSaveAssessmentDraft = selectedAssessmentQuestionCount > 0
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
  }, [])

  useEffect(() => {
    if (!generationJobs.length) return undefined
    const intervalId = window.setInterval(() => setGenerationTick(Date.now()), 450)
    return () => window.clearInterval(intervalId)
  }, [generationJobs.length])

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

    if (editingPreviewQuestionId || question.type !== 'MCQ') {
      persistQuestion('Created')
      return
    }

    const sourceQuestion = {
      ...question,
      topics: [...(question.topics ?? [])],
      competencies: [...(question.competencies ?? [])],
      images: [...(question.images ?? [])],
      options: (question.options ?? []).map((option) => ({
        ...option,
        distractorErrors: [...(option.distractorErrors ?? [])],
      })),
      correctOptionIds: [...(question.correctOptionIds ?? [])],
      organSubSystems: [...(question.organSubSystems ?? [])],
      diseaseTags: [...(question.diseaseTags ?? [])],
      keyConcepts: [...(question.keyConcepts ?? [])],
    }
    const jobId = `mcq-generation-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const questionPreviewText = getRichTextPreview(sourceQuestion.questionText).slice(0, 54) || 'MCQ question'

    const startedAt = Date.now()
    setGenerationTick(startedAt)
    setGenerationJobs((current) => [...current, { id: jobId, questionPreviewText, startedAt }])
    setQuestion(createQuestion(setup, 'MCQ'))
    setActiveCreateTab('create')
    setHasSelectedCreateTab(true)
    setSelectedCreateQuestionTypeLabel('MCQ')
    setActiveMappingPicker(null)
    setMappingSearchValue('')
    setIsOptionalTagsOpen(false)
    setSaveStatus('MCQ generation started. You can create the next question.')

    const timerId = setTimeout(() => {
      const latestText = getRichTextPreview(sourceQuestion.questionText)
      if (!latestText) {
        setGenerationJobs((current) => current.filter((job) => job.id !== jobId))
        generationTimersRef.current.delete(jobId)
        setSaveStatus('Enter question text to create.')
        return
      }
      const generatedQuestion = buildGeneratedMcqQuestion(sourceQuestion)
      persistQuestion('Created', generatedQuestion, {
        resetEditor: false,
        editingPreviewQuestionId: null,
        message: 'MCQ generated and added to preview.',
      })
      setActiveCreateTab('create')
      setHasSelectedCreateTab(true)
      setSelectedCreateQuestionTypeLabel('MCQ')
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
    window.localStorage.setItem(assessmentQuestionsStorageKey, JSON.stringify(savedQuestions))
    const draftRow = {
      id: setup.assessmentId || getAssessmentStorageSuffix(setup),
      setup,
      assessmentName: setup.assessmentName || 'Untitled Assessment',
      academicYear: setup.academicYear || '',
      examCategory: setup.examCategory || '',
      course: setup.course || '',
      year: setup.year || '',
      questionCount: assessmentSummary.totalQuestions,
      totalMarks: assessmentSummary.totalMarks,
      updatedAt: new Date().toISOString(),
    }
    try {
      const existingDrafts = JSON.parse(window.localStorage.getItem(ASSESSMENT_DRAFTS_STORAGE_KEY) || '[]')
      const rows = Array.isArray(existingDrafts) ? existingDrafts : []
      const nextDrafts = [draftRow, ...rows.filter((row) => row.id !== draftRow.id)]
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
          {setup.logoPreview ? (
            <img src={setup.logoPreview} alt={setup.logoName || 'Assessment logo'} className="create-assessment-logo" />
          ) : null}

          <div className="create-assessment-title-copy">
            <h1>{setup.assessmentName || 'Untitled Assessment'}</h1>
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
              <strong>Preview</strong>
              <span className="create-assessment-preview-section-actions">
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
          <section className="create-assessment-tab-panel" aria-label="Assessment configuration">
            <div className="create-assessment-tab-panel-head">
              <strong>Configuration</strong>
            </div>
            <div className="create-assessment-configuration-form">
              <div className="assessment-create-setup-top">
                <label
                  className="assessment-create-field assessment-create-upload"
                  data-tooltip="Upload logo in PNG, JPG, or SVG format. Square or 1:1 aspect ratio recommended. Max 2MB."
                >
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
                />

                <AssessmentSetupSelectField
                  className="assessment-create-year-field"
                  label="Academic Year"
                  value={setupDraft.academicYear}
                  options={CREATE_ASSESSMENT_SELECT_OPTIONS.academicYears}
                  placeholder="Academic Year"
                  onChange={(value) => updateSetupDraft('academicYear', value)}
                />

                <label className="assessment-create-field assessment-create-name-field">
                  <span>Assessment Name</span>
                  <input
                    type="text"
                    value={setupDraft.assessmentName}
                    placeholder="Assessment Name"
                    onChange={(event) => updateSetupDraft('assessmentName', toCapitalizedCase(event.target.value))}
                  />
                </label>

                <div className="assessment-create-side-fields">
                  <AssessmentSetupSelectField
                    label="Exam Category"
                    value={setupDraft.examCategory}
                    options={CREATE_ASSESSMENT_SELECT_OPTIONS.examCategories}
                    placeholder="Exam Category"
                    onChange={(value) => updateSetupDraft('examCategory', value)}
                  />

                  <AssessmentSetupSelectField
                    label="Select Course"
                    value={setupDraft.course}
                    options={CREATE_ASSESSMENT_SELECT_OPTIONS.courses}
                    placeholder="Select Course"
                    onChange={(value) => updateSetupDraft('course', value)}
                  />

                  <AssessmentSetupSelectField
                    label="Select Year"
                    value={setupDraft.year}
                    options={CREATE_ASSESSMENT_SELECT_OPTIONS.years}
                    placeholder="Select Year"
                    onChange={(value) => updateSetupDraft('year', value)}
                  />
                </div>
              </div>

              <div className="assessment-create-setup-divider" />

              <div className="assessment-create-form-actions">
                <button type="button" className="is-clear" onClick={clearSetupDraft}>
                  <RotateCcw size={15} strokeWidth={2.2} />
                  Clear
                </button>
                <button type="button" className="is-primary" onClick={saveSetupConfiguration}>
                  <Save size={15} strokeWidth={2.2} />
                  Save Configuration
                </button>
              </div>
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
                <strong>Generating MCQ</strong>
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
        <button type="button" className="create-assessment-action-btn is-draft" onClick={saveAssessmentDraft} disabled={!canSaveAssessmentDraft}>
          <Save size={16} strokeWidth={2.2} />
          <span>Save as Draft</span>
        </button>
        <button type="button" className="create-assessment-action-btn is-primary" onClick={() => persistQuestion('Created')} disabled={!question || !canCreate}>
          <ArrowRight size={16} strokeWidth={2.2} />
          <span>Send to Approval</span>
        </button>
        </div>
      </aside>
      </div>
    </section>
  )
}
