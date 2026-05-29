import { useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock3,
  Database,
  Eye,
  FilePenLine,
  ImagePlus,
  Info,
  ListChecks,
  LogOut,
  Moon,
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
import QuestionBankNonCreatePage from './QuestionBankNonCreatePage'
import '../styles/question-bank.css'
import '../styles/assessment-pages.css'

const CREATE_ASSESSMENT_SETUP_KEY = 'vx-create-assessment-setup'
const CREATE_ASSESSMENT_QUESTIONS_KEY = 'vx-create-assessment-questions'
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

const YEAR_OPTIONS = ['Year 1', 'Year 2', 'Year 3', 'Year 4']
const QUESTION_CATEGORY_OPTIONS = ['Direct', 'Reasoning', 'Critical Thinking', 'Application']
const COGNITIVE_LEVEL_OPTIONS = ['Apply', 'Remember', 'Understand', 'Analyze', 'Evaluate']
const THINKING_LEVEL_OPTIONS = ['HoT', 'LoT']
const DIFFICULTY_LEVEL_OPTIONS = ['L1', 'L2', 'L3']
const COGNITIVE_FUNCTION_OPTIONS = ['Attention & Cue Detection', 'Working Memory', 'Pattern Recognition', 'Judgement & Decision Making']
const SKILL_FOCUS_OPTIONS = ['Diagnosis', 'Investigation', 'Treatment', 'Management', 'Knowledge', 'Data Interpretation']
const ORGAN_SYSTEM_OPTIONS = ['Nervous', 'Cardiovascular', 'Respiratory', 'Digestive', 'Skeletal', 'Muscular', 'N/A']
const DEFAULT_OPTIONAL_TAG = 'Not Applicable'
const SINGLE_OPTION_MIN_COUNT = 2
const SINGLE_OPTION_MAX_COUNT = 6
const MULTIPLE_OPTION_MIN_COUNT = 3
const MULTIPLE_OPTION_MAX_COUNT = 8
const ROMAN_NUMERALS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']
const DESCRIPTIVE_QUESTION_TYPES = [
  { type: 'Desc Long Answer Questions (LAQs)', shortLabel: 'LAQs', menuLabel: 'Descriptive Long (LAQs)' },
  { type: 'Desc Short Answer Questions (SAQs)', shortLabel: 'SAQs', menuLabel: 'Descriptive Short (SAQs)' },
  { type: 'Desc Modified Essay Questions (MEQs)', shortLabel: 'MEQs', menuLabel: 'Descriptive Essay (MEQs)' },
]
const DESCRIPTIVE_QUESTION_TYPE_SET = new Set(['Descriptive Question', ...DESCRIPTIVE_QUESTION_TYPES.map((item) => item.type)])
const QUESTION_TYPE_CARDS = [
  { type: 'MCQ', shortLabel: 'MCQ', icon: ListChecks },
  ...DESCRIPTIVE_QUESTION_TYPES.map((item) => ({ ...item, icon: FilePenLine })),
]

let optionSequence = 1
let descriptiveSequence = 1

const createOption = (label = '') => ({
  id: `assessment-option-${Date.now()}-${optionSequence++}`,
  label,
  distractorErrors: [],
})

const createDescriptiveInsideQuestion = () => ({
  id: `assessment-descriptive-inside-${Date.now()}-${descriptiveSequence++}`,
  questionText: '',
  marks: '0',
})

const createDescriptiveSubQuestion = () => ({
  id: `assessment-descriptive-sub-${Date.now()}-${descriptiveSequence++}`,
  questionText: '',
  marks: '0',
  children: [],
})

const createQuestion = (setup = {}, type = 'MCQ') => ({
  id: `assessment-question-${Date.now()}`,
  type,
  questionText: '',
  year: setup.year || '',
  subject: '',
  topics: [],
  competencies: [],
  images: [],
  questionCategory: '',
  cognitiveLevel: '',
  thinkingLevel: '',
  difficultyLevel: '',
  cognitiveFunction: '',
  skillFocus: '',
  organSystem: '',
  organSubSystems: [DEFAULT_OPTIONAL_TAG],
  diseaseTags: [DEFAULT_OPTIONAL_TAG],
  keyConcepts: [DEFAULT_OPTIONAL_TAG],
  answerKey: '',
  options: [createOption(''), createOption(''), createOption(''), createOption('')],
  correctOptionIds: [],
  allowMultiple: false,
  marks: '0',
  isCritical: false,
  status: 'Editing',
  descriptiveSections: [],
})

const readCreateAssessmentSetup = () => {
  try {
    const row = JSON.parse(window.localStorage.getItem(CREATE_ASSESSMENT_SETUP_KEY) || '{}')
    return row && typeof row === 'object' ? row : {}
  } catch {
    return {}
  }
}

const readSavedAssessmentQuestions = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CREATE_ASSESSMENT_QUESTIONS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
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
const isDescriptiveQuestionType = (type) => DESCRIPTIVE_QUESTION_TYPE_SET.has(type)
const getQuestionTypeMeta = (type) => (
  QUESTION_TYPE_CARDS.find((item) => item.type === type)
  ?? (type === 'Descriptive Question' ? { type, shortLabel: 'SAQs', menuLabel: 'Short Answer Questions (SAQs)' } : QUESTION_TYPE_CARDS[0])
)
const hasVisibleMarks = (marks) => Number(marks) > 0
const getOptionModeConfig = (allowMultiple) => ({
  minCount: allowMultiple ? MULTIPLE_OPTION_MIN_COUNT : SINGLE_OPTION_MIN_COUNT,
  maxCount: allowMultiple ? MULTIPLE_OPTION_MAX_COUNT : SINGLE_OPTION_MAX_COUNT,
})
const getShortCompetencyLabel = (value) => String(value).split(/\s+/)[0] || value
const getSelectionSummary = (items, emptyLabel, formatter = (value) => value) => (
  items.length ? items.map(formatter).join(', ') : emptyLabel
)

const normalizeOptionalTagValues = (values) => {
  const cleanValues = (values ?? [])
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)

  return cleanValues.length ? cleanValues : [DEFAULT_OPTIONAL_TAG]
}

const getQuestionOptionalTagGroups = (item) => [
  { label: 'Cognitive Function', values: item.cognitiveFunction ? [item.cognitiveFunction] : [] },
  { label: 'Skill Focus', values: item.skillFocus ? [item.skillFocus] : [] },
  { label: 'Organ System', values: item.organSystem ? [item.organSystem] : [] },
  { label: 'Organ Sub System', values: item.organSubSystems ?? [] },
  { label: 'Disease Tags', values: item.diseaseTags ?? [] },
  { label: 'Key Concept', values: item.keyConcepts ?? [] },
].filter((group) => group.values.length)

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
  const [setup] = useState(readCreateAssessmentSetup)
  const [question, setQuestion] = useState(null)
  const [savedQuestions, setSavedQuestions] = useState(readSavedAssessmentQuestions)
  const [isQuestionTypePickerOpen, setIsQuestionTypePickerOpen] = useState(false)
  const [isDescriptiveTypePickerOpen, setIsDescriptiveTypePickerOpen] = useState(false)
  const [activeMappingPicker, setActiveMappingPicker] = useState(null)
  const [mappingSearchValue, setMappingSearchValue] = useState('')
  const [isOptionalTagsOpen, setIsOptionalTagsOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [activeCreateTab, setActiveCreateTab] = useState('create')
  const [hasSelectedCreateTab, setHasSelectedCreateTab] = useState(false)
  const [selectedCreateQuestionTypeLabel, setSelectedCreateQuestionTypeLabel] = useState('')
  const [expandedQuestionId, setExpandedQuestionId] = useState(null)

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

  const requiredProgress = [
    Boolean(question?.year),
    Boolean(question?.subject),
    (question?.topics ?? []).length > 0,
    (question?.competencies ?? []).length > 0,
    Boolean(getRichTextPreview(question?.questionText ?? '')),
    isDescriptiveQuestionType(question?.type) ? true : (question?.correctOptionIds ?? []).length > 0,
  ].filter(Boolean).length
  const hasDescriptiveContent = (question?.descriptiveSections ?? []).some((section) => (
    getRichTextPreview(section.questionText)
    || (section.children ?? []).some((child) => getRichTextPreview(child.questionText))
  ))
  const canSaveDraft = Boolean(
    getRichTextPreview(question?.questionText ?? '')
    || (question?.options ?? []).some((option) => getRichTextPreview(option.label))
    || hasDescriptiveContent,
  )
  const canCreate = requiredProgress === 6 && (
    isDescriptiveQuestionType(question?.type)
      ? true
      : (question?.options ?? []).slice(0, 2).every((option) => getRichTextPreview(option.label))
  )
  const selectedQuestionTypeLabel = selectedCreateQuestionTypeLabel || 'Create New Question'
  const visibleQuestionRows = question
    ? savedQuestions.filter((item) => item.id !== question.id)
    : savedQuestions

  const updateQuestion = (patch) => {
    setQuestion((current) => current ? ({
      ...current,
      ...(typeof patch === 'function' ? patch(current) : patch),
    }) : current)
    setSaveStatus('')
  }

  const persistQuestion = (status) => {
    if (!question) return

    const nextQuestion = {
      ...question,
      status,
      assessmentName: setup.assessmentName || 'Untitled Assessment',
      savedAt: new Date().toISOString(),
      questionCategory: question.questionCategory || 'Direct',
      cognitiveLevel: question.cognitiveLevel || 'Apply',
      thinkingLevel: question.thinkingLevel || 'LoT',
      difficultyLevel: question.difficultyLevel || 'L1',
    }
    const nextQuestions = [nextQuestion, ...savedQuestions.filter((item) => item.id !== question.id)]
    window.localStorage.setItem(CREATE_ASSESSMENT_QUESTIONS_KEY, JSON.stringify(nextQuestions))
    setSavedQuestions(nextQuestions)
    setQuestion(createQuestion(setup, question.type))
    setExpandedQuestionId(nextQuestion.id)
    setSaveStatus(status === 'Draft' ? 'Draft saved.' : 'Question created.')
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

  const editSavedQuestion = (item) => {
    const baseQuestion = createQuestion(setup, item.type)

    setQuestion({
      ...baseQuestion,
      ...item,
      options: item.options?.length ? item.options : baseQuestion.options,
      descriptiveSections: item.descriptiveSections ?? [],
      status: 'Editing',
    })
    setExpandedQuestionId(item.id)
    setIsQuestionTypePickerOpen(false)
    setIsDescriptiveTypePickerOpen(false)
    setActiveCreateTab('create')
    setHasSelectedCreateTab(true)
    setSaveStatus('Editing saved question.')
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
    setActiveCreateTab('create')
    setHasSelectedCreateTab(true)
    setSelectedCreateQuestionTypeLabel(nextTypeMeta?.menuLabel ?? nextTypeMeta?.shortLabel ?? 'Create New Question')
    setSaveStatus('')
  }

  const updateDescriptiveSections = (updater) => {
    updateQuestion((current) => ({
      descriptiveSections: typeof updater === 'function'
        ? updater(current.descriptiveSections ?? [])
        : updater,
    }))
  }

  const updateDescriptiveSubQuestion = (sectionId, patch) => {
    updateDescriptiveSections((sections) => sections.map((section) => (
      section.id === sectionId ? { ...section, ...patch } : section
    )))
  }

  const updateDescriptiveInsideQuestion = (sectionId, childId, patch) => {
    updateDescriptiveSections((sections) => sections.map((section) => (
      section.id === sectionId
        ? {
          ...section,
          children: (section.children ?? []).map((child) => (
            child.id === childId ? { ...child, ...patch } : child
          )),
        }
        : section
    )))
  }

  const addDescriptiveSubQuestion = () => {
    updateDescriptiveSections((sections) => [...sections, createDescriptiveSubQuestion()])
  }

  const deleteDescriptiveSubQuestion = (sectionId) => {
    updateDescriptiveSections((sections) => sections.filter((section) => section.id !== sectionId))
  }

  const addDescriptiveInsideQuestion = (sectionId) => {
    updateDescriptiveSections((sections) => sections.map((section) => (
      section.id === sectionId
        ? { ...section, children: [...(section.children ?? []), createDescriptiveInsideQuestion()] }
        : section
    )))
  }

  const deleteDescriptiveInsideQuestion = (sectionId, childId) => {
    updateDescriptiveSections((sections) => sections.map((section) => (
      section.id === sectionId
        ? { ...section, children: (section.children ?? []).filter((child) => child.id !== childId) }
        : section
    )))
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
          <span className="create-assessment-header-badge">
            <CheckCircle2 size={15} strokeWidth={2.2} />
            Questions: {savedQuestions.length}
          </span>
          <span className="create-assessment-header-badge">
            <Clock3 size={15} strokeWidth={2.2} />
            Duration: 00:00
          </span>
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
            <QuestionBankNonCreatePage mode="readonly" embedded onNavigate={onNavigate} />
          </section>
        ) : null}

        {activeCreateTab === 'preview' ? (
          <section className="create-assessment-tab-panel" aria-label="Assessment preview">
            <div className="create-assessment-tab-panel-head">
              <strong>Preview</strong>
            </div>
            {question || savedQuestions.length ? (
              <div className="create-assessment-preview-list">
                {[...(question ? [question] : []), ...savedQuestions.filter((item) => item.id !== question?.id)].map((item, index) => (
                  <article key={item.id} className="create-assessment-preview-card">
                    <span className={`question-bank-badge type ${isDescriptiveQuestionType(item.type) ? 'is-desc' : 'is-mcq'}`}>
                      {isDescriptiveQuestionType(item.type) ? getQuestionTypeMeta(item.type).shortLabel : 'MCQ'}
                    </span>
                    <div>
                      <strong>Q{index + 1}. {getRichTextPreview(item.questionText) || item.title || 'Untitled question'}</strong>
                      <span>{[item.year, item.subject, item.topics?.[0]].filter(Boolean).join(' / ') || 'Curriculum not selected'}</span>
                    </div>
                  </article>
                ))}
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
            <div className="create-assessment-configuration-grid">
              {[
                ['College', setup.collegeName],
                ['Academic Year', setup.academicYear],
                ['Exam Category', setup.examCategory],
                ['Course', setup.course],
                ['Year', setup.year],
                ['Assessment', setup.assessmentName || 'Untitled Assessment'],
              ].map(([label, value]) => (
                <span key={label} className="create-assessment-configuration-item">
                  <small>{label}</small>
                  <strong>{value || 'Not configured'}</strong>
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {activeCreateTab === 'create' ? (
          <>
        {question ? (
          <section className={`question-bank-author-card ${question.isCritical ? 'is-critical' : ''}`}>
            <div className="question-bank-author-grid">
              <div className="question-bank-author-main">
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
                        <input value={question.marks} onChange={(event) => updateQuestion({ marks: event.target.value })} />
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
                      <div className="question-bank-descriptive-builder-head">
                        <div>
                          <strong>Sub Questions</strong>
                        </div>
                        <button type="button" className="question-bank-secondary-btn" onClick={addDescriptiveSubQuestion}>
                          <Plus size={14} strokeWidth={2.2} />
                          Sub Question
                        </button>
                      </div>

                      {(question.descriptiveSections ?? []).length ? (
                        <div className="question-bank-descriptive-sub-list">
                          {(question.descriptiveSections ?? []).map((section, sectionIndex) => (
                            <div key={section.id} className="question-bank-descriptive-sub-card">
                              <div className="question-bank-descriptive-row">
                                <span className="question-bank-descriptive-index">{ROMAN_NUMERALS[sectionIndex] ?? sectionIndex + 1}.</span>
                                <label className="question-bank-descriptive-text">
                                  <RichMathEditor
                                    value={section.questionText}
                                    onChange={(nextValue) => updateDescriptiveSubQuestion(section.id, { questionText: nextValue })}
                                    placeholder="Enter your question"
                                    minRows={1}
                                    compact
                                    ariaLabel={`Sub question ${sectionIndex + 1}`}
                                  />
                                </label>
                                <label className="question-bank-descriptive-marks">
                                  <span>Marks</span>
                                  <input value={section.marks ?? '0'} onChange={(event) => updateDescriptiveSubQuestion(section.id, { marks: event.target.value })} inputMode="decimal" />
                                </label>
                                <button type="button" className="question-bank-icon-btn question-bank-descriptive-delete-btn" onClick={() => deleteDescriptiveSubQuestion(section.id)} aria-label={`Delete sub question ${sectionIndex + 1}`}>
                                  <Trash2 size={14} strokeWidth={2.2} />
                                </button>
                              </div>

                              <div className="question-bank-descriptive-inside-list">
                                {(section.children ?? []).map((child, childIndex) => (
                                  <div key={child.id} className="question-bank-descriptive-row is-child">
                                    <span className="question-bank-descriptive-index">{String.fromCharCode(97 + childIndex)}.</span>
                                    <label className="question-bank-descriptive-text">
                                      <RichMathEditor
                                        value={child.questionText}
                                        onChange={(nextValue) => updateDescriptiveInsideQuestion(section.id, child.id, { questionText: nextValue })}
                                        placeholder="Enter your question"
                                        minRows={1}
                                        compact
                                        ariaLabel={`Inside question ${childIndex + 1}`}
                                      />
                                    </label>
                                    <label className="question-bank-descriptive-marks">
                                      <span>Marks</span>
                                      <input value={child.marks ?? '0'} onChange={(event) => updateDescriptiveInsideQuestion(section.id, child.id, { marks: event.target.value })} inputMode="decimal" />
                                    </label>
                                    <button type="button" className="question-bank-icon-btn question-bank-descriptive-delete-btn" onClick={() => deleteDescriptiveInsideQuestion(section.id, child.id)} aria-label={`Delete inside question ${childIndex + 1}`}>
                                      <Trash2 size={14} strokeWidth={2.2} />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <div className="question-bank-descriptive-sub-actions">
                                <button type="button" className="question-bank-secondary-btn" onClick={() => addDescriptiveInsideQuestion(section.id)}>
                                  <Plus size={14} strokeWidth={2.2} />
                                  Inside
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="question-bank-descriptive-empty">No sub questions added.</div>
                      )}
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
                        <select className={!question.questionCategory ? 'is-placeholder' : ''} value={question.questionCategory} onChange={(event) => updateQuestion({ questionCategory: event.target.value })}>
                          <option value="" disabled>Select Category</option>
                          {QUESTION_CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
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
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </section>
        ) : null}

        {visibleQuestionRows.length ? (
          <section className="create-assessment-question-list" aria-label="Created questions">
            {visibleQuestionRows.map((item, index) => {
              const isOpen = expandedQuestionId === item.id
              const isDescriptive = isDescriptiveQuestionType(item.type)
              const optionalTagGroups = getQuestionOptionalTagGroups(item)
              const visibleOptions = (item.options ?? []).filter((option) => Boolean(getRichTextPreview(option.label)))
              const curriculumMeta = [
                item.year,
                item.subject,
                item.topics?.length ? getSelectionSummary(item.topics, '') : null,
                item.competencies?.length ? getSelectionSummary(item.competencies, '', getShortCompetencyLabel) : null,
              ].filter(Boolean)

              return (
                <article key={item.id} className={`question-bank-created-card create-assessment-question-row ${item.isCritical ? 'is-critical' : ''} ${isOpen ? 'is-open' : ''}`}>
                  <div className="create-assessment-question-summary">
                    <span className={`question-bank-badge type create-assessment-question-type ${isDescriptive ? 'is-desc' : 'is-mcq'}`}>
                      {isDescriptive ? getQuestionTypeMeta(item.type).shortLabel : 'MCQ'}
                    </span>
                    <button
                      type="button"
                      className="create-assessment-question-title"
                      onClick={() => setExpandedQuestionId((current) => (current === item.id ? null : item.id))}
                      aria-expanded={isOpen}
                      title={isOpen ? 'Close question details' : 'Open question details'}
                    >
                      <strong>Q{index + 1}.</strong>
                      <span>{getRichTextPreview(item.questionText) || item.title || (item.isLivePreview ? 'Current question preview' : 'Untitled question')}</span>
                    </button>
                    <span className="create-assessment-question-badges">
                      {item.isLivePreview ? <span className="question-bank-badge mint">Editing</span> : null}
                      {item.difficultyLevel ? <span className="question-bank-badge soft">{item.difficultyLevel}</span> : null}
                      {item.thinkingLevel ? <span className="question-bank-badge lilac">{item.thinkingLevel}</span> : null}
                      {item.isCritical ? <span className="question-bank-badge warning">Critical</span> : null}
                      {optionalTagGroups.length ? (
                        <span className="question-bank-created-tags-wrap">
                          <button
                            type="button"
                            className="question-bank-badge question-bank-created-tags-badge"
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`View tags for question ${index + 1}`}
                          >
                            <Info size={13} strokeWidth={2.2} />
                            Tags
                          </button>
                          <span className="question-bank-created-tags-tooltip" role="tooltip">
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
                    </span>
                    <span className="create-assessment-question-actions">
                      {!item.isLivePreview ? (
                        <button type="button" className="question-bank-icon-btn" onClick={() => editSavedQuestion(item)} aria-label={`Edit question ${index + 1}`} title="Edit question">
                          <FilePenLine size={15} strokeWidth={2.1} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="question-bank-icon-btn"
                        onClick={() => setExpandedQuestionId((current) => (current === item.id ? null : item.id))}
                        aria-label={`${isOpen ? 'Close' : 'Open'} question ${index + 1}`}
                        aria-expanded={isOpen}
                        title={isOpen ? 'Close details' : 'Open details'}
                      >
                        {isOpen ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
                      </button>
                    </span>
                  </div>

                  {isOpen ? (
                    <div className="create-assessment-question-detail">
                      {curriculumMeta.length ? (
                        <span className="question-bank-created-curriculum" title={curriculumMeta.join(' / ')}>
                          {curriculumMeta.map((meta) => <span key={meta}>{meta}</span>)}
                        </span>
                      ) : null}
                      {!isDescriptive && visibleOptions.length ? (
                        <span className="question-bank-created-options">
                          {visibleOptions.map((option, optionIndex) => (
                            <b key={option.id} className={(item.correctOptionIds ?? []).includes(option.id) ? 'is-correct' : ''}>
                              {String.fromCharCode(65 + optionIndex)}. {getRichTextPreview(option.label)}
                            </b>
                          ))}
                        </span>
                      ) : null}
                      {isDescriptive && (item.descriptiveSections ?? []).length ? (
                        <span className="question-bank-created-descriptive-list">
                          {(item.descriptiveSections ?? []).map((section, sectionIndex) => (
                            <span key={section.id ?? `${item.id}-${sectionIndex}`} className="question-bank-created-descriptive-item">
                              <span className="question-bank-created-descriptive-line">
                                <b>{ROMAN_NUMERALS[sectionIndex] ?? sectionIndex + 1}.</b>
                                <span>{getRichTextPreview(section.questionText) || 'Question not added'}</span>
                                {hasVisibleMarks(section.marks) ? <em>{section.marks} marks</em> : null}
                              </span>
                              {(section.children ?? []).map((child, childIndex) => (
                                <span key={child.id ?? `${section.id}-${childIndex}`} className="question-bank-created-descriptive-line is-child">
                                  <b>{String.fromCharCode(97 + childIndex)}.</b>
                                  <span>{getRichTextPreview(child.questionText) || 'Question not added'}</span>
                                  {hasVisibleMarks(child.marks) ? <em>{child.marks} marks</em> : null}
                                </span>
                              ))}
                            </span>
                          ))}
                        </span>
                      ) : null}
                      {getRichTextPreview(item.answerKey) ? (
                        <span className="question-bank-created-answer">
                          <b>Answer &amp; Explanation</b>
                          {getRichTextPreview(item.answerKey)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              )
            })}
          </section>
        ) : null}
          </>
        ) : null}
      </main>

      <aside className="create-assessment-action-panel" aria-label="Create actions">
        <strong>Create Assessment</strong>
        <div className={`question-bank-type-select-panel ${isQuestionTypePickerOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            className={`create-assessment-action-btn is-create ${hasSelectedCreateTab && activeCreateTab === 'create' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveCreateTab('create')
              setHasSelectedCreateTab(true)
              if (isQuestionTypePickerOpen) setIsDescriptiveTypePickerOpen(false)
              setIsQuestionTypePickerOpen((current) => !current)
            }}
            aria-expanded={isQuestionTypePickerOpen}
            aria-pressed={hasSelectedCreateTab && activeCreateTab === 'create'}
          >
            <ListChecks size={16} strokeWidth={2.2} />
            <span>{selectedQuestionTypeLabel}</span>
            <ChevronDown size={15} strokeWidth={2.4} />
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
        <button
          type="button"
          className={`create-assessment-action-btn ${activeCreateTab === 'questionBank' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveCreateTab('questionBank')
            setHasSelectedCreateTab(true)
            setIsQuestionTypePickerOpen(false)
            setIsDescriptiveTypePickerOpen(false)
            setSelectedCreateQuestionTypeLabel('')
          }}
          aria-pressed={activeCreateTab === 'questionBank'}
        >
          <Database size={16} strokeWidth={2.2} />
          <span>Question Bank</span>
        </button>
        <button
          type="button"
          className={`create-assessment-action-btn ${activeCreateTab === 'preview' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveCreateTab('preview')
            setHasSelectedCreateTab(true)
            setIsQuestionTypePickerOpen(false)
            setIsDescriptiveTypePickerOpen(false)
            setSelectedCreateQuestionTypeLabel('')
          }}
          disabled={!question && !savedQuestions.length}
          aria-pressed={activeCreateTab === 'preview'}
        >
          <Eye size={16} strokeWidth={2.2} />
          <span>Preview</span>
        </button>
        <button
          type="button"
          className={`create-assessment-action-btn ${activeCreateTab === 'configuration' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveCreateTab('configuration')
            setHasSelectedCreateTab(true)
            setIsQuestionTypePickerOpen(false)
            setIsDescriptiveTypePickerOpen(false)
            setSelectedCreateQuestionTypeLabel('')
          }}
          aria-pressed={activeCreateTab === 'configuration'}
        >
          <Settings size={16} strokeWidth={2.2} />
          <span>Configuration</span>
        </button>
        <button type="button" className="create-assessment-action-btn" onClick={() => persistQuestion('Draft')} disabled={!question || !canSaveDraft}>
          <Save size={16} strokeWidth={2.2} />
          <span>Save as Draft</span>
        </button>
        <button type="button" className="create-assessment-action-btn is-primary" onClick={() => persistQuestion('Created')} disabled={!question || !canCreate}>
          <ArrowRight size={16} strokeWidth={2.2} />
          <span>Send to Approval</span>
        </button>
        {saveStatus ? <span className="create-assessment-save-status">{saveStatus}</span> : null}
      </aside>
      </div>
    </section>
  )
}
