import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePenLine,
  FolderTree,
  ImagePlus,
  Info,
  ListChecks,
  LoaderCircle,
  Plus,
  Search,
  Sigma,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import RichMathEditor from '../components/RichMathEditor'
import { stripHtml } from '../utils/mathText'
import '../styles/question-bank.css'

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

const QUESTION_TYPE_OPTIONS = ['MCQ', 'Descriptive Question', 'True or False', 'Fill in the Blanks']
const QUESTION_CATEGORY_OPTIONS = ['Direct', 'Reasoning', 'Critical Thinking', 'Application']
const COGNITIVE_LEVEL_OPTIONS = ['Apply', 'Remember', 'Understand', 'Analyze', 'Evaluate']
const THINKING_LEVEL_OPTIONS = ['HoT', 'LoT']
const DIFFICULTY_LEVEL_OPTIONS = ['L1', 'L2', 'L3']
const YEAR_OPTIONS = ['Year 1', 'Year 2', 'Year 3', 'Year 4']
const COGNITIVE_FUNCTION_OPTIONS = [
  'Attention & Cue Detection',
  'Working Memory',
  'Pattern Recognition',
  'Prioritization/Executive Function',
  'Judgement & Decision Making',
  'Metacognition (Reflection)',
]
const SKILL_FOCUS_OPTIONS = [
  'Diagnosis',
  'Investigation',
  'Treatment',
  'Management',
  'Prognosis',
  'Prevention',
  'Knowledge',
  'Data Interpretation',
  'Risk Assessment',
  'Ethics',
  'Communication',
  'Patient Safety',
  'Regulations or Protocols',
]
const ORGAN_SYSTEM_OPTIONS = [
  'Integumentary',
  'Skeletal',
  'Muscular',
  'Nervous',
  'Endocrine',
  'Cardiovascular',
  'Lymphatic',
  'Respiratory',
  'Digestive',
  'Urinary',
  'Reproductive',
  'N/A',
]
const ORGAN_SUB_SYSTEM_OPTIONS = [
  'Skin',
  'Bone',
  'Joint',
  'Peripheral nerve',
  'Brain',
  'Spinal cord',
  'Heart',
  'Blood vessel',
  'Lung',
  'Upper GI',
  'Lower GI',
  'Kidney',
  'Bladder',
]
const DISEASE_TAG_OPTIONS = [
  'Inflammation',
  'Infection',
  'Trauma',
  'Neoplasm',
  'Degenerative disease',
  'Autoimmune',
  'Congenital',
  'Metabolic',
  'Vascular',
  'Toxicity',
]
const KEY_CONCEPT_OPTIONS = [
  'Anatomical relation',
  'Clinical correlation',
  'Mechanism',
  'Differential diagnosis',
  'Diagnostic clue',
  'Management principle',
  'Complication',
  'Risk factor',
  'Pathophysiology',
  'Prevention strategy',
]
const SINGLE_OPTION_MIN_COUNT = 2
const SINGLE_OPTION_MAX_COUNT = 6
const MULTIPLE_OPTION_MIN_COUNT = 3
const MULTIPLE_OPTION_MAX_COUNT = 8
const MAX_QUESTION_IMAGES = 4

const CURRICULUM_DIRECTORY = YEAR_OPTIONS.reduce((directory, year) => ({
  ...directory,
  [year]: SUBJECT_DIRECTORY,
}), {})

const QUESTION_TYPE_CARDS = [
  { type: 'MCQ', shortLabel: 'MCQ', icon: ListChecks },
  { type: 'Descriptive Question', shortLabel: 'Descriptive', icon: FilePenLine },
  { type: 'True or False', shortLabel: 'True / False', icon: CheckCheck },
  { type: 'Fill in the Blanks', shortLabel: 'Fill in blanks', icon: Sigma },
]

let questionSequence = 1
let optionSequence = 1
let imageSequence = 1

const createOption = (label = '') => ({
  id: `option-${optionSequence++}`,
  label,
})

const readImageFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve({
    id: `image-${imageSequence++}`,
    name: file.name,
    url: reader.result,
  })
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const createQuestion = (type = 'MCQ', config = {}) => ({
  id: `question-${questionSequence++}`,
  title: config.title ?? `Question ${questionSequence - 1}`,
  type,
  parentId: config.parentId ?? null,
  level: config.level ?? 'parent',
  questionText: '',
  year: 'Year 1',
  subject: 'Human Anatomy',
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
  organSubSystems: [],
  diseaseTags: [],
  keyConcepts: [],
  answerKey: '',
  options: [createOption(''), createOption(''), createOption(''), createOption('')],
  correctOptionIds: [],
  trueFalseAnswer: 'True',
  fillBlankAnswers: [''],
  descriptiveGuide: '',
  isRequired: true,
  allowMultiple: false,
  answerWithImage: false,
  estimationTime: '2',
  marks: '0',
  isCritical: false,
  status: 'Editing',
})

const getQuestionTypeMeta = (type) => (
  QUESTION_TYPE_CARDS.find((item) => item.type === type) ?? QUESTION_TYPE_CARDS[0]
)

const getRichTextPreview = (value) => stripHtml(value)

const getQuestionPreview = (question) => getRichTextPreview(question.questionText) || question.title || 'Untitled question'

const createHtmlBlock = (value) => `<div>${String(value ?? '')}</div>`

const getGeneratedOptionalTags = (type) => {
  if (type === 'Descriptive Question') {
    return {
      cognitiveFunction: 'Judgement & Decision Making',
      skillFocus: 'Communication',
      organSystem: 'Nervous',
      organSubSystems: ['Brain'],
      diseaseTags: ['Trauma'],
      keyConcepts: ['Clinical correlation', 'Management principle'],
    }
  }

  if (type === 'True or False') {
    return {
      cognitiveFunction: 'Pattern Recognition',
      skillFocus: 'Knowledge',
      organSystem: 'N/A',
      organSubSystems: [],
      diseaseTags: ['Inflammation'],
      keyConcepts: ['Mechanism'],
    }
  }

  if (type === 'Fill in the Blanks') {
    return {
      cognitiveFunction: 'Working Memory',
      skillFocus: 'Knowledge',
      organSystem: 'N/A',
      organSubSystems: [],
      diseaseTags: [],
      keyConcepts: ['Anatomical relation'],
    }
  }

  return {
    cognitiveFunction: 'Pattern Recognition',
    skillFocus: 'Diagnosis',
    organSystem: 'Nervous',
    organSubSystems: ['Brain'],
    diseaseTags: ['Inflammation'],
    keyConcepts: ['Clinical correlation', 'Diagnostic clue'],
  }
}

const getGeneratedQuestionDraft = (question) => {
  const type = question.type ?? 'MCQ'
  const subject = question.subject ?? 'Human Anatomy'
  const topic = question.topics[0] ?? 'the selected topic'
  const optionalTags = getGeneratedOptionalTags(type)

  if (type === 'True or False') {
    return {
      ...optionalTags,
      questionText: createHtmlBlock(`True or False: ${subject} concepts related to ${topic} should be applied directly to clinical interpretation.`),
      answerKey: createHtmlBlock('False. The correct response depends on the specific clinical context and supporting evidence.'),
      questionCategory: 'Reasoning',
      cognitiveLevel: 'Understand',
      thinkingLevel: 'LoT',
      difficultyLevel: 'L1',
      trueFalseAnswer: 'False',
    }
  }

  if (type === 'Fill in the Blanks') {
    return {
      ...optionalTags,
      questionText: createHtmlBlock(`Fill in the blank: In ${subject}, the key concept associated with ${topic} is ______.`),
      answerKey: createHtmlBlock('Accepted answer: Add the expected key term or concept based on the mapped competency.'),
      questionCategory: 'Direct',
      cognitiveLevel: 'Remember',
      thinkingLevel: 'LoT',
      difficultyLevel: 'L1',
      fillBlankAnswers: [createHtmlBlock('Expected key term')],
    }
  }

  if (type === 'Descriptive Question') {
    return {
      ...optionalTags,
      questionText: createHtmlBlock(`Explain the clinical relevance of ${topic} in ${subject}, including key anatomical or functional relationships.`),
      answerKey: createHtmlBlock('The answer should include the core concept, relevant relationships, clinical significance, and a concise conclusion.'),
      questionCategory: 'Critical Thinking',
      cognitiveLevel: 'Analyze',
      thinkingLevel: 'HoT',
      difficultyLevel: 'L3',
      descriptiveGuide: createHtmlBlock('Look for accurate concepts, structured explanation, correct terminology, and clinical correlation.'),
    }
  }

  return {
    ...optionalTags,
    questionText: createHtmlBlock(`Which of the following best explains the application of ${topic} in ${subject}?`),
    answerKey: createHtmlBlock('Correct answer: Review the selected option and add the supporting rationale.'),
    questionCategory: 'Application',
    cognitiveLevel: 'Apply',
    thinkingLevel: 'HoT',
    difficultyLevel: 'L2',
  }
}

const getSubjectsForYear = (year) => Object.keys(CURRICULUM_DIRECTORY[year] ?? SUBJECT_DIRECTORY)

const getSubjectDirectory = (question) => {
  const yearDirectory = CURRICULUM_DIRECTORY[question.year] ?? SUBJECT_DIRECTORY
  return yearDirectory[question.subject] ?? yearDirectory[getSubjectsForYear(question.year)[0]] ?? SUBJECT_DIRECTORY['Human Anatomy']
}

const getAvailableTopics = (question) => getSubjectDirectory(question).topics

const getAvailableCompetencies = (question) => {
  const directory = getSubjectDirectory(question)
  if (!question.topics.length) return directory.competencies
  return directory.competencies.filter((item) => question.topics.includes(item.topic))
}

const isQuestionReady = (question) => (
  Boolean(getRichTextPreview(question.questionText))
  && Boolean(getRichTextPreview(question.answerKey))
  && question.topics.length > 0
  && question.competencies.length > 0
  && Boolean(question.questionCategory)
  && Boolean(question.cognitiveLevel)
  && Boolean(question.thinkingLevel)
  && Boolean(question.difficultyLevel)
)

const getLevelLabel = (level) => (
  level === 'parent' ? 'Parent' : level === 'child' ? 'Child' : 'Sub-Child'
)

const hasCurriculumMapping = (question) => (
  Boolean(question?.year)
  && Boolean(question?.subject)
  && question.topics.length > 0
  && question.competencies.length > 0
)

const hasQuestionContent = (question) => Boolean(getRichTextPreview(question?.questionText))

const hasMcqOptions = (question) => (
  question?.type !== 'MCQ'
  || (
    question.options.filter((option) => Boolean(getRichTextPreview(option.label))).length >= (question.allowMultiple ? MULTIPLE_OPTION_MIN_COUNT : SINGLE_OPTION_MIN_COUNT)
    && question.correctOptionIds.length > 0
  )
)

const hasAssessmentTags = (question) => (
  Boolean(question?.marks)
  && Boolean(question?.questionCategory)
  && Boolean(question?.cognitiveLevel)
  && Boolean(question?.thinkingLevel)
  && Boolean(question?.difficultyLevel)
)

const hasVisibleMarks = (marks) => Number(marks) > 0

const canCreateQuestion = (question) => {
  if (!question || question.status === 'Generating') return false

  if (question.type === 'MCQ') {
    return hasCurriculumMapping(question) && hasQuestionContent(question) && hasMcqOptions(question)
  }

  return hasCurriculumMapping(question) && hasQuestionContent(question)
}

const getProcessSteps = (question) => ([
  { label: 'Curriculum Mapping', done: hasCurriculumMapping(question) },
  { label: 'Question Creation', done: hasQuestionContent(question) },
  { label: 'Options', done: hasMcqOptions(question) },
  { label: 'Answer Key (optional)', done: Boolean(getRichTextPreview(question.answerKey)) },
  { label: 'Assessment Tags (optional)', done: hasAssessmentTags(question) },
  { label: question.status === 'Draft' ? 'Draft Saved' : 'Created', done: ['Draft', 'Created'].includes(question.status) },
])

const getQuestionCardStatus = (question) => {
  if (question.status === 'Generating') return 'Generating'
  if (question.status === 'Draft') return 'Draft'
  if (question.status === 'Created') return 'Created'
  return 'Editing'
}

const GENERATION_DELAY_MS = 15000

const isDescendantOf = (question, parentId, questionMap) => {
  let currentParentId = question.parentId
  while (currentParentId) {
    if (currentParentId === parentId) return true
    currentParentId = questionMap.get(currentParentId)?.parentId ?? null
  }
  return false
}

const insertAfterBranch = (questions, sourceId, newQuestion) => {
  const questionMap = new Map(questions.map((item) => [item.id, item]))
  const sourceIndex = questions.findIndex((item) => item.id === sourceId)
  if (sourceIndex === -1) return [...questions, newQuestion]

  let insertIndex = sourceIndex + 1
  while (insertIndex < questions.length && isDescendantOf(questions[insertIndex], sourceId, questionMap)) {
    insertIndex += 1
  }

  return [
    ...questions.slice(0, insertIndex),
    newQuestion,
    ...questions.slice(insertIndex),
  ]
}

const toggleSelection = (items, value) => (
  items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value]
)

function SelectionChips({ items, selected, onToggle, emptyLabel }) {
  return (
    <div className="question-bank-chip-wrap">
      {items.length ? items.map((item) => {
        const value = typeof item === 'string' ? item : item.value
        const label = typeof item === 'string' ? item : item.value
        const isActive = selected.includes(value)

        return (
          <button
            key={value}
            type="button"
            className={`question-bank-chip ${isActive ? 'is-active' : ''}`}
            onClick={() => onToggle(value)}
          >
            {label}
          </button>
        )
      }) : (
        <span className="question-bank-empty-inline">{emptyLabel}</span>
      )}
    </div>
  )
}

function OptionalTagMultiSelect({ label, options, selected, onToggle, searchValue, onSearchChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const fieldRef = useRef(null)
  const query = searchValue.trim().toLowerCase()
  const visibleOptions = options
    .filter((option) => option.toLowerCase().includes(query))
    .slice(0, 10)
  const summary = selected.length
    ? selected.length === 1
      ? selected[0]
      : `${selected[0]} +${selected.length - 1}`
    : `Select ${label.toLowerCase()}`

  return (
    <div
      ref={fieldRef}
      className={`question-bank-optional-tag-field ${isOpen ? 'is-open' : ''}`}
      onBlur={(event) => {
        if (!fieldRef.current?.contains(event.relatedTarget)) {
          setIsOpen(false)
        }
      }}
    >
      <span className="question-bank-optional-tag-label">{label}</span>
      <button
        type="button"
        className={`question-bank-optional-tag-trigger ${selected.length ? 'has-value' : ''}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <span>{summary}</span>
        <ChevronDown size={14} strokeWidth={2.2} />
      </button>

      {isOpen ? (
        <div className="question-bank-optional-tag-menu">
          <div className="question-bank-optional-tag-search">
            <Search size={13} strokeWidth={2} />
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              autoFocus
            />
          </div>
          <div className="question-bank-optional-tag-options">
            {visibleOptions.length ? visibleOptions.map((option) => {
              const isSelected = selected.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  className={`question-bank-optional-tag-option ${isSelected ? 'is-active' : ''}`}
                  onClick={() => onToggle(option)}
                >
                  <span>{isSelected ? <Check size={12} strokeWidth={2.4} /> : null}</span>
                  <strong>{option}</strong>
                </button>
              )
            }) : (
              <span className="question-bank-empty-inline">No matches</span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

const getQuestionOptionalTagGroups = (question) => [
  { label: 'Cognitive Function', values: question.cognitiveFunction ? [question.cognitiveFunction] : [] },
  { label: 'Skill Focus', values: question.skillFocus ? [question.skillFocus] : [] },
  { label: 'Organ System', values: question.organSystem ? [question.organSystem] : [] },
  { label: 'Organ Sub System', values: question.organSubSystems ?? [] },
  { label: 'Disease Tags', values: question.diseaseTags ?? [] },
  { label: 'Key Concept', values: question.keyConcepts ?? [] },
].filter((group) => group.values.length)

const getOptionValue = (item) => (typeof item === 'string' ? item : item.value)
const getOptionLabel = (item) => (typeof item === 'string' ? item : item.value)
const getShortCompetencyLabel = (value) => value.split(' ').slice(0, 1).join(' ')
const getYearDisplayLabel = (year) => ({
  'Year 1': 'First Year',
  'Year 2': 'Second Year',
  'Year 3': 'Third Year',
  'Year 4': 'Fourth Year',
}[year] ?? year)

const getSelectionSummary = (selected, emptyLabel, formatter = (value) => value) => {
  if (!selected.length) return emptyLabel
  const visible = selected.slice(0, 2).map(formatter).join(', ')
  const remaining = selected.length - 2
  return remaining > 0 ? `${visible} +${remaining} more` : visible
}

const getCurriculumStatusLabel = (question) => [
  getYearDisplayLabel(question.year),
  question.subject,
  question.topics.length ? question.topics.join(', ') : 'Select topics',
  question.competencies.length ? question.competencies.map(getShortCompetencyLabel).join(', ') : 'Select competencies',
].filter(Boolean).join(' / ')

const getRestrictedText = (value, maxLength = 72) => (
  value.length > maxLength ? `${value.slice(0, maxLength - 1).trimEnd()}...` : value
)

const getOptionModeConfig = (allowMultiple) => ({
  minCount: allowMultiple ? MULTIPLE_OPTION_MIN_COUNT : SINGLE_OPTION_MIN_COUNT,
  maxCount: allowMultiple ? MULTIPLE_OPTION_MAX_COUNT : SINGLE_OPTION_MAX_COUNT,
  label: allowMultiple ? 'Multiple' : 'Single',
})

function MappingSelectorPanel({
  title,
  searchValue,
  onSearchChange,
  items,
  selected,
  onToggle,
  onClose,
  emptyLabel,
}) {
  const query = searchValue.trim().toLowerCase()
  const selectedSet = new Set(selected)
  const selectedItems = items.filter((item) => selectedSet.has(getOptionValue(item)))
  const unselectedItems = items.filter((item) => !selectedSet.has(getOptionValue(item)))
  const filterItem = (item) => getOptionLabel(item).toLowerCase().includes(query)
  const visibleItems = [
    ...selectedItems.filter(filterItem),
    ...unselectedItems.filter(filterItem),
  ].slice(0, 80)

  return (
    <div className="question-bank-mapping-panel">
      <div className="question-bank-mapping-panel-head">
        <div>
          <span className="question-bank-eyebrow">{title}</span>
          <strong>{selected.length} selected</strong>
        </div>
        <div className="question-bank-inline-actions">
          <button type="button" className="question-bank-secondary-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>

      <label className="question-bank-search">
        <Search size={14} strokeWidth={2} />
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={`Search ${title.toLowerCase()}`}
        />
      </label>

      <div className="question-bank-mapping-results">
        {visibleItems.length ? visibleItems.map((item) => {
          const value = getOptionValue(item)
          const isActive = selectedSet.has(value)
          return (
            <button
              key={value}
              type="button"
              className={`question-bank-mapping-result ${isActive ? 'is-active' : ''}`}
              onClick={() => onToggle(value)}
            >
              <span>
                <Check size={13} strokeWidth={2.4} />
              </span>
              <strong>{getOptionLabel(item)}</strong>
            </button>
          )
        }) : (
          <div className="question-bank-empty-card">
            <strong>No matches</strong>
            <p>{emptyLabel}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function QuestionBankPage({ onAlert }) {
  const [questions, setQuestions] = useState([])
  const [selectedQuestionId, setSelectedQuestionId] = useState(null)
  const [activeMappingPicker, setActiveMappingPicker] = useState(null)
  const [mappingSearchValue, setMappingSearchValue] = useState('')
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false)
  const [generationCompleteId, setGenerationCompleteId] = useState(null)
  const [isProgressWidgetOpen, setIsProgressWidgetOpen] = useState(false)
  const [isOptionalTagsOpen, setIsOptionalTagsOpen] = useState(false)
  const [openCreatedTagsId, setOpenCreatedTagsId] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [optionalTagSearchValues, setOptionalTagSearchValues] = useState({
    organSubSystems: '',
    diseaseTags: '',
    keyConcepts: '',
  })

  const selectedQuestion = questions.find((item) => item.id === selectedQuestionId) ?? null
  const visibleQuestionCards = questions.filter((item) => item.status !== 'Editing')
  const totalCount = visibleQuestionCards.length
  const readyCount = questions.filter((item) => item.status === 'Created').length
  const draftCount = questions.filter((item) => item.status === 'Draft').length

  const descriptiveQuestions = useMemo(
    () => questions.filter((item) => item.type === 'Descriptive Question'),
    [questions],
  )

  const availableSubjects = selectedQuestion ? getSubjectsForYear(selectedQuestion.year) : []
  const availableTopics = selectedQuestion ? getAvailableTopics(selectedQuestion) : []
  const availableCompetencies = selectedQuestion ? getAvailableCompetencies(selectedQuestion) : []
  const selectedQuestionIndex = selectedQuestion ? questions.findIndex((item) => item.id === selectedQuestion.id) + 1 : 0
  const selectedProcessSteps = selectedQuestion ? getProcessSteps(selectedQuestion) : []
  const selectedCurrentProcessIndex = selectedProcessSteps.findIndex((step) => !step.done)
  const completedProcessStepCount = selectedProcessSteps.filter((step) => step.done).length
  const selectedProcessPercent = selectedProcessSteps.length
    ? Math.round((completedProcessStepCount / selectedProcessSteps.length) * 100)
    : 0
  const canCreateSelectedQuestion = canCreateQuestion(selectedQuestion)
  const isUpdatingSelectedQuestion = selectedQuestion
    ? ['Created', 'Draft'].includes(selectedQuestion.status)
    : false
  const curriculumStatusTone = selectedQuestion
    ? selectedQuestion.topics.length && selectedQuestion.competencies.length
      ? 'is-complete'
      : selectedQuestion.topics.length || selectedQuestion.competencies.length
        ? 'is-partial'
        : 'is-incomplete'
    : ''
  const activeMappingItems = activeMappingPicker === 'years'
    ? YEAR_OPTIONS
    : activeMappingPicker === 'subjects'
    ? availableSubjects
    : activeMappingPicker === 'topics'
      ? availableTopics
      : availableCompetencies
  const activeMappingSelected = selectedQuestion
    ? activeMappingPicker === 'years'
      ? [selectedQuestion.year]
      : activeMappingPicker === 'subjects'
      ? [selectedQuestion.subject]
      : activeMappingPicker === 'topics'
      ? selectedQuestion.topics
      : selectedQuestion.competencies
    : []
  const previewImages = previewImage?.images ?? []
  const previewIndex = Math.min(Math.max(previewImage?.index ?? 0, 0), Math.max(previewImages.length - 1, 0))
  const activePreviewImage = previewImages[previewIndex] ?? null
  const hasPreviewNavigation = previewImages.length > 1
  const activePreviewLetter = activePreviewImage ? String.fromCharCode(65 + previewIndex) : ''

  useEffect(() => {
    setIsGeneratingQuestion(false)
    setGenerationCompleteId(null)
    setIsProgressWidgetOpen(false)
    setIsOptionalTagsOpen(false)
    setOptionalTagSearchValues({
      organSubSystems: '',
      diseaseTags: '',
      keyConcepts: '',
    })
  }, [selectedQuestionId])

  const updateSelectedQuestion = (updater) => {
    if (!selectedQuestion) return
    setGenerationCompleteId((current) => (
      current === selectedQuestion.id ? null : current
    ))
    setQuestions((current) => current.map((item) => (
      item.id === selectedQuestion.id
        ? (typeof updater === 'function' ? updater(item) : { ...item, ...updater })
        : item
    )))
  }

  const handleCreateQuestion = (type) => {
    const question = createQuestion(type, {
      title: `${getQuestionTypeMeta(type).shortLabel} ${questions.length + 1}`,
    })
    setQuestions((current) => [...current, question])
    setSelectedQuestionId(question.id)
  }

  const handleAddHierarchyNode = (level) => {
    if (!selectedQuestion || selectedQuestion.type !== 'Descriptive Question') return
    if (level === 'child' && selectedQuestion.level === 'sub-child') return
    if (level === 'sub-child' && selectedQuestion.level !== 'child') return

    const question = createQuestion('Descriptive Question', {
      parentId: selectedQuestion.id,
      level,
      title: `${getLevelLabel(level)} Question`,
    })

    setQuestions((current) => insertAfterBranch(current, selectedQuestion.id, question))
    setSelectedQuestionId(question.id)
    onAlert?.({ tone: 'secondary', message: `${getLevelLabel(level)} question added.` })
  }

  const handleDeleteQuestion = () => {
    if (!selectedQuestion) return
    const nextQuestions = questions.filter((item) => item.id !== selectedQuestion.id)
    setQuestions(nextQuestions)
    setSelectedQuestionId(nextQuestions[0]?.id ?? null)
    onAlert?.({ tone: 'warning', message: 'Question removed.' })
  }

  const handleDeleteQuestionById = (questionId) => {
    const nextQuestions = questions.filter((item) => item.id !== questionId)
    setQuestions(nextQuestions)
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(nextQuestions[0]?.id ?? null)
    }
    onAlert?.({ tone: 'warning', message: 'Question removed.' })
  }

  const handlePrimaryQuestionAction = () => {
    if (!selectedQuestion || isGeneratingQuestion || !canCreateSelectedQuestion) return

    const questionId = selectedQuestion.id

    if (isUpdatingSelectedQuestion) {
      const nextQuestionBase = createQuestion(selectedQuestion.type, {
        title: `${getQuestionTypeMeta(selectedQuestion.type).shortLabel} ${questions.length + 1}`,
      })
      const nextQuestion = {
        ...nextQuestionBase,
        year: selectedQuestion.year,
        subject: selectedQuestion.subject,
        topics: [...selectedQuestion.topics],
        competencies: [...selectedQuestion.competencies],
      }

      setQuestions((current) => [
        ...current.map((item) => (
          item.id === questionId
            ? {
              ...item,
              title: getQuestionPreview(item).slice(0, 60) || item.title,
              status: 'Created',
            }
            : item
        )),
        nextQuestion,
      ])
      setSelectedQuestionId(nextQuestion.id)
      setGenerationCompleteId(null)
      closeMappingPicker()
      onAlert?.({ tone: 'success', message: 'Question updated.' })
      return
    }

    const nextQuestionBase = createQuestion(selectedQuestion.type, {
      title: `${getQuestionTypeMeta(selectedQuestion.type).shortLabel} ${questions.length + 1}`,
    })
    const nextQuestion = {
      ...nextQuestionBase,
      year: selectedQuestion.year,
      subject: selectedQuestion.subject,
      topics: [...selectedQuestion.topics],
      competencies: [...selectedQuestion.competencies],
    }
    const generatedDraft = getGeneratedQuestionDraft(selectedQuestion)

    setGenerationCompleteId(null)
    setQuestions((current) => [
      ...current.map((item) => (
        item.id === questionId ? { ...item, status: 'Generating' } : item
      )),
      nextQuestion,
    ])
    setSelectedQuestionId(nextQuestion.id)
    closeMappingPicker()
    onAlert?.({ tone: 'secondary', message: 'Question generation started.' })

    window.setTimeout(() => {
      setQuestions((current) => current.map((item) => {
        if (item.id !== questionId) return item

        const needsQuestion = !hasQuestionContent(item)
        const needsOptions = item.type === 'MCQ' && !hasMcqOptions(item)
        const needsAnswerKey = !getRichTextPreview(item.answerKey)
        const generatedOptions = needsOptions
          ? [
            createOption(createHtmlBlock('A clinically relevant application')),
            createOption(createHtmlBlock('An unrelated basic recall point')),
            createOption(createHtmlBlock('A partially correct distractor')),
            createOption(createHtmlBlock('A non-specific explanation')),
          ]
          : item.options

        return {
          ...item,
          questionText: needsQuestion ? generatedDraft.questionText : item.questionText,
          answerKey: needsAnswerKey ? generatedDraft.answerKey : item.answerKey,
          questionCategory: item.questionCategory || generatedDraft.questionCategory || 'Application',
          cognitiveLevel: item.cognitiveLevel || generatedDraft.cognitiveLevel || 'Apply',
          thinkingLevel: item.thinkingLevel || generatedDraft.thinkingLevel || 'HoT',
          difficultyLevel: item.difficultyLevel || generatedDraft.difficultyLevel || 'L2',
          cognitiveFunction: item.cognitiveFunction || generatedDraft.cognitiveFunction || '',
          skillFocus: item.skillFocus || generatedDraft.skillFocus || '',
          organSystem: item.organSystem || generatedDraft.organSystem || '',
          organSubSystems: item.organSubSystems?.length ? item.organSubSystems : generatedDraft.organSubSystems || [],
          diseaseTags: item.diseaseTags?.length ? item.diseaseTags : generatedDraft.diseaseTags || [],
          keyConcepts: item.keyConcepts?.length ? item.keyConcepts : generatedDraft.keyConcepts || [],
          marks: item.marks || '1',
          options: generatedOptions,
          correctOptionIds: needsOptions ? [generatedOptions[0].id] : item.correctOptionIds,
          trueFalseAnswer: item.trueFalseAnswer || generatedDraft.trueFalseAnswer || 'True',
          fillBlankAnswers: item.fillBlankAnswers?.some((answer) => getRichTextPreview(answer))
            ? item.fillBlankAnswers
            : generatedDraft.fillBlankAnswers || item.fillBlankAnswers,
          descriptiveGuide: item.descriptiveGuide || generatedDraft.descriptiveGuide || item.descriptiveGuide,
          title: getRichTextPreview(needsQuestion ? generatedDraft.questionText : item.questionText).slice(0, 60) || item.title,
          status: 'Created',
        }
      }))
      setGenerationCompleteId(questionId)
      onAlert?.({ tone: 'success', message: 'Question created.' })
    }, GENERATION_DELAY_MS)
  }

  const handleSaveDraft = () => {
    if (!selectedQuestion) return
    updateSelectedQuestion({ status: 'Draft' })
    onAlert?.({ tone: 'secondary', message: 'Question saved as draft.' })
  }

  const openMappingPicker = (type) => {
    setActiveMappingPicker(type)
    setMappingSearchValue('')
  }

  const closeMappingPicker = () => {
    setActiveMappingPicker(null)
    setMappingSearchValue('')
  }

  const handleToggleTopic = (value) => {
    updateSelectedQuestion((item) => {
      const nextTopics = toggleSelection(item.topics, value)
      const nextCompetencies = item.competencies.filter((entry) => (
        getAvailableCompetencies({ ...item, topics: nextTopics }).some((competency) => competency.value === entry)
      ))

      return {
        ...item,
        topics: nextTopics,
        competencies: nextCompetencies,
      }
    })
  }

  const toggleMappingFlow = () => {
    if (activeMappingPicker) {
      closeMappingPicker()
    } else {
      openMappingPicker('years')
    }
  }

  const handleSelectSubject = (value) => {
    updateSelectedQuestion({
      subject: value,
      topics: [],
      competencies: [],
    })
    setActiveMappingPicker('topics')
    setMappingSearchValue('')
  }

  const handleSelectYear = (value) => {
    updateSelectedQuestion((item) => {
      const nextSubjects = getSubjectsForYear(value)
      const nextSubject = nextSubjects.includes(item.subject)
        ? item.subject
        : nextSubjects[0] ?? ''
      const nextTopicOptions = getAvailableTopics({ ...item, year: value, subject: nextSubject })
      const nextTopics = nextSubject === item.subject
        ? item.topics.filter((topic) => nextTopicOptions.includes(topic))
        : []
      const nextCompetencies = nextSubject === item.subject
        ? item.competencies.filter((entry) => (
          getAvailableCompetencies({ ...item, year: value, subject: nextSubject, topics: nextTopics })
            .some((competency) => competency.value === entry)
        ))
        : []

      return {
        ...item,
        year: value,
        subject: nextSubject,
        topics: nextTopics,
        competencies: nextCompetencies,
      }
    })
    setActiveMappingPicker('subjects')
    setMappingSearchValue('')
  }

  const handleOptionModeChange = (allowMultiple) => {
    updateSelectedQuestion((item) => {
      const { minCount, maxCount } = getOptionModeConfig(allowMultiple)
      const requiredOptionCount = Math.max(minCount, Math.min(item.options.length, maxCount))
      const nextOptions = item.options.slice(0, maxCount)
      while (nextOptions.length < requiredOptionCount) {
        nextOptions.push(createOption(''))
      }
      const optionIds = new Set(nextOptions.map((option) => option.id))
      const nextCorrectOptionIds = item.correctOptionIds.filter((id) => optionIds.has(id))

      return {
        ...item,
        allowMultiple,
        options: nextOptions,
        correctOptionIds: allowMultiple ? nextCorrectOptionIds : nextCorrectOptionIds.slice(0, 1),
      }
    })
  }

  const handleAddOption = () => {
    updateSelectedQuestion((item) => {
      const { maxCount } = getOptionModeConfig(item.allowMultiple)
      if (item.options.length >= maxCount) return item

      return {
        ...item,
        options: [...item.options, createOption('')],
      }
    })
  }

  const updateOptionalTagSearch = (field, value) => {
    setOptionalTagSearchValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const toggleOptionalTag = (field, value) => {
    updateSelectedQuestion((item) => ({
      ...item,
      [field]: toggleSelection(item[field] ?? [], value),
    }))
  }

  const handleQuestionImagesUpload = async (event) => {
    if (!selectedQuestion) return

    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'))
    event.target.value = ''

    if (!files.length) return

    const availableSlots = MAX_QUESTION_IMAGES - (selectedQuestion.images?.length ?? 0)
    if (availableSlots <= 0) {
      onAlert?.({ tone: 'warning', message: 'Maximum 4 images allowed.' })
      return
    }

    const acceptedFiles = files.slice(0, availableSlots)
    if (files.length > availableSlots) {
      onAlert?.({ tone: 'warning', message: 'Maximum 4 images allowed.' })
    }

    try {
      const images = await Promise.all(acceptedFiles.map(readImageFile))
      updateSelectedQuestion((item) => ({
        ...item,
        images: [...(item.images ?? []), ...images].slice(0, MAX_QUESTION_IMAGES),
      }))
    } catch {
      onAlert?.({ tone: 'warning', message: 'Unable to upload image.' })
    }
  }

  const openImagePreview = (images, index) => {
    setPreviewImage({
      images: images ?? [],
      index,
    })
  }

  const movePreviewImage = (direction) => {
    setPreviewImage((current) => {
      if (!current?.images?.length) return current
      const nextIndex = (current.index + direction + current.images.length) % current.images.length
      return {
        ...current,
        index: nextIndex,
      }
    })
  }

  const removeQuestionImage = (imageId) => {
    updateSelectedQuestion((item) => ({
      ...item,
      images: (item.images ?? []).filter((image) => image.id !== imageId),
    }))
    setPreviewImage((current) => (
      current?.images?.[current.index]?.id === imageId
        ? null
        : current
    ))
  }

  const questionTypePicker = (
    <div className="question-bank-type-picker">
      {QUESTION_TYPE_CARDS.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.type}
            type="button"
            className="question-bank-type-picker-item"
            onClick={() => handleCreateQuestion(item.type)}
          >
            <span className="question-bank-type-picker-icon">
              <Icon size={15} strokeWidth={2} />
            </span>
            <span>{item.shortLabel}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <section className="question-bank-page">
      <header className="question-bank-header">
        <div>
          <h1>Question Bank</h1>
          <p>Create MCQ, descriptive, true or false, and fill in the blanks with fewer clicks.</p>
        </div>
        <div className="question-bank-header-stats">
          <span><strong>{totalCount}</strong> Total</span>
          <span><strong>{readyCount}</strong> Ready</span>
          <span><strong>{draftCount}</strong> Draft</span>
        </div>
      </header>

      <div className="question-bank-create-strip">
        {questionTypePicker}
      </div>

      <div className="question-bank-layout">
        <main className="question-bank-main">
          {selectedQuestion ? (
            <div className="question-bank-workspace">
              <div className="question-bank-editor">
                <section className="question-bank-author-card">
                  <div className="question-bank-author-head">
                    <div className="question-bank-type-label">{selectedQuestion.type}</div>
                    <div className="question-bank-badge-row">
                      {selectedQuestion.questionCategory ? (
                        <span className="question-bank-badge mint">{selectedQuestion.questionCategory}</span>
                      ) : null}
                      {selectedQuestion.cognitiveLevel ? (
                        <span className="question-bank-badge blue">{selectedQuestion.cognitiveLevel}</span>
                      ) : null}
                      {selectedQuestion.thinkingLevel ? (
                        <span className="question-bank-badge lilac">{selectedQuestion.thinkingLevel}</span>
                      ) : null}
                      {selectedQuestion.difficultyLevel ? (
                        <span className="question-bank-badge soft">{selectedQuestion.difficultyLevel}</span>
                      ) : null}
                      {selectedQuestion.isCritical ? (
                        <span className="question-bank-badge critical">Critical</span>
                      ) : null}
                    </div>
                    <button type="button" className="question-bank-icon-btn" onClick={handleDeleteQuestion} aria-label="Delete question">
                      <Trash2 size={15} strokeWidth={2} />
                    </button>
                  </div>

                  <div className="question-bank-author-grid">
                    <div className="question-bank-author-main">
                      <section className="question-bank-curriculum-panel">
                        <div className="question-bank-section-head">
                          {(() => {
                            const curriculumStatusLabel = getCurriculumStatusLabel(selectedQuestion)
                            return (
                              <>
                                <div>
                                  <strong className="question-bank-step-title">STEP 1 : Curriculum Mapping</strong>
                                </div>
                                <button
                                  type="button"
                                  className={`question-bank-curriculum-status ${curriculumStatusTone} ${activeMappingPicker ? 'is-open' : ''}`}
                                  onClick={toggleMappingFlow}
                                  aria-expanded={Boolean(activeMappingPicker)}
                                  aria-label={curriculumStatusLabel}
                                  data-tooltip={curriculumStatusLabel}
                                >
                                  <span className="question-bank-curriculum-status-text">
                                    {getRestrictedText(curriculumStatusLabel)}
                                  </span>
                                </button>
                              </>
                            )
                          })()}
                        </div>

                        <div className="question-bank-curriculum-grid">
                          <div className="question-bank-field">
                            <button
                              type="button"
                              className="question-bank-mapping-trigger"
                              onClick={() => openMappingPicker('years')}
                            >
                              <strong>Year</strong>
                              <span>{selectedQuestion.year}</span>
                            </button>
                          </div>

                          <div className="question-bank-field">
                            <button
                              type="button"
                              className="question-bank-mapping-trigger"
                              onClick={() => openMappingPicker('subjects')}
                            >
                              <strong>Subject</strong>
                              <span>{selectedQuestion.subject}</span>
                            </button>
                          </div>

                          <div className="question-bank-field">
                            <button
                              type="button"
                              className="question-bank-mapping-trigger"
                              onClick={() => openMappingPicker('topics')}
                            >
                              <strong>Topics - {selectedQuestion.topics.length} selected</strong>
                              <span>{getSelectionSummary(selectedQuestion.topics, 'Search and select topics')}</span>
                            </button>
                          </div>

                          <div className="question-bank-field">
                            <button
                              type="button"
                              className="question-bank-mapping-trigger"
                              onClick={() => openMappingPicker('competencies')}
                            >
                              <strong>Competency - {selectedQuestion.competencies.length} selected</strong>
                              <span>
                                {getSelectionSummary(
                                  selectedQuestion.competencies,
                                  'Search and select competencies',
                                  getShortCompetencyLabel,
                                )}
                              </span>
                            </button>
                          </div>
                        </div>
                        {activeMappingPicker ? (
                          <MappingSelectorPanel
                            title={activeMappingPicker === 'years'
                              ? 'Year'
                              : activeMappingPicker === 'subjects'
                              ? 'Subject'
                              : activeMappingPicker === 'topics'
                                ? 'Topics'
                                : 'Competency'}
                            searchValue={mappingSearchValue}
                            onSearchChange={setMappingSearchValue}
                            items={activeMappingItems}
                            selected={activeMappingSelected}
                            onToggle={activeMappingPicker === 'years'
                              ? handleSelectYear
                              : activeMappingPicker === 'subjects'
                              ? handleSelectSubject
                              : activeMappingPicker === 'topics'
                                ? handleToggleTopic
                                : (value) => updateSelectedQuestion((item) => ({
                                ...item,
                                competencies: toggleSelection(item.competencies, value),
                              }))}
                            onClose={closeMappingPicker}
                            emptyLabel={activeMappingPicker === 'years'
                              ? 'Try another year keyword.'
                              : activeMappingPicker === 'subjects'
                              ? 'Try another subject keyword.'
                              : activeMappingPicker === 'topics'
                              ? 'Try another topic keyword.'
                              : 'Select topics first or try another competency keyword.'}
                          />
                        ) : null}
                      </section>

                      <section className="question-bank-soft-panel question-bank-answer-panel">
                        <div className="question-bank-section-head">
                          <div>
                            <strong className="question-bank-step-title">STEP 2 : Question Creation</strong>
                          </div>
                          <div className="question-bank-question-head-controls">
                            {!(selectedQuestion.images?.length ?? 0) ? (
                              <label className="question-bank-question-image-add" aria-label="Add image">
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={handleQuestionImagesUpload}
                                />
                                <ImagePlus size={14} strokeWidth={2.1} />
                                Add Image
                              </label>
                            ) : null}

                            <label className="question-bank-question-head-field question-bank-question-head-criticality">
                              <span>Criticality</span>
                              <button
                                type="button"
                                className={`question-bank-criticality-toggle ${selectedQuestion.isCritical ? 'is-active' : ''}`}
                                onClick={() => updateSelectedQuestion((item) => ({ ...item, isCritical: !item.isCritical }))}
                                aria-pressed={selectedQuestion.isCritical}
                              >
                                <span className="question-bank-criticality-switch" />
                                <strong>{selectedQuestion.isCritical ? 'ON' : 'OFF'}</strong>
                              </button>
                            </label>

                            <label className="question-bank-question-head-field question-bank-question-head-marks">
                              <span>Marks</span>
                              <input
                                value={selectedQuestion.marks}
                                onChange={(event) => updateSelectedQuestion({ marks: event.target.value })}
                              />
                            </label>
                          </div>
                        </div>

                        <label className="question-bank-field rich">
                          <RichMathEditor
                            value={selectedQuestion.questionText}
                            onChange={(nextValue) => updateSelectedQuestion({
                              questionText: nextValue,
                              title: getRichTextPreview(nextValue).slice(0, 60) || selectedQuestion.title,
                            })}
                            placeholder="Enter your question here"
                            minRows={5}
                            ariaLabel="Question text"
                            allowPastedImages={false}
                            onPasteImageRejected={() => onAlert?.({ tone: 'warning', message: 'Images are not supported in question text.' })}
                          />
                        </label>

                        {(selectedQuestion.images?.length ?? 0) ? (
                        <div className="question-bank-question-images">
                          {(selectedQuestion.images ?? []).map((image, index) => (
                            <article key={image.id} className="question-bank-question-image-card">
                              <button
                                type="button"
                                className="question-bank-question-image-thumb"
                                onClick={() => openImagePreview(selectedQuestion.images ?? [], index)}
                              >
                                <img src={image.url} alt={image.name} />
                              </button>
                              <span className="question-bank-question-image-letter">{String.fromCharCode(65 + index)}</span>
                              <span className="question-bank-question-image-actions">
                                <button
                                  type="button"
                                  className="question-bank-question-image-icon"
                                  onClick={() => openImagePreview(selectedQuestion.images ?? [], index)}
                                  aria-label={`Preview image ${String.fromCharCode(65 + index)}`}
                                >
                                  <Eye size={12} strokeWidth={2.2} />
                                </button>
                                <button
                                  type="button"
                                  className="question-bank-question-image-icon danger"
                                  onClick={() => removeQuestionImage(image.id)}
                                  aria-label={`Delete image ${String.fromCharCode(65 + index)}`}
                                >
                                  <Trash2 size={12} strokeWidth={2.2} />
                                </button>
                              </span>
                            </article>
                          ))}

                          {(selectedQuestion.images?.length ?? 0) < MAX_QUESTION_IMAGES ? (
                            <label className="question-bank-question-image-add is-icon-only" aria-label="Add image">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleQuestionImagesUpload}
                              />
                              <ImagePlus size={18} strokeWidth={2.1} />
                            </label>
                          ) : null}
                        </div>
                        ) : null}

                      {selectedQuestion.type === 'MCQ' ? (
                        <div className="question-bank-options-block">
                          <div className="question-bank-options-head">
                            <div>
                              <span className="question-bank-step-title-row">
                                <strong className="question-bank-step-title">STEP 3 : Options</strong>
                                <span className="question-bank-step-helper-badge">Enter Your Option &amp; Choose Right Answer</span>
                              </span>
                            </div>
                            <div className="question-bank-options-toolbar">
                              <div className="question-bank-option-mode-toggle" role="group" aria-label="Answer type">
                                <button
                                  type="button"
                                  className={!selectedQuestion.allowMultiple ? 'is-active' : ''}
                                  onClick={() => handleOptionModeChange(false)}
                                  aria-pressed={!selectedQuestion.allowMultiple}
                                >
                                  Single
                                </button>
                                <button
                                  type="button"
                                  className={selectedQuestion.allowMultiple ? 'is-active' : ''}
                                  onClick={() => handleOptionModeChange(true)}
                                  aria-pressed={selectedQuestion.allowMultiple}
                                >
                                  Multiple
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="question-bank-choice-list">
                            {selectedQuestion.options.map((option, index) => {
                              const { minCount } = getOptionModeConfig(selectedQuestion.allowMultiple)
                              const isMandatoryOption = index < minCount
                              const isSelectedOption = selectedQuestion.correctOptionIds.includes(option.id)
                              return (
                              <div key={option.id} className="question-bank-choice-row">
                                <span className="question-bank-choice-letter">{String.fromCharCode(65 + index)}</span>
                                <button
                                  type="button"
                                  className={`question-bank-choice-check ${selectedQuestion.allowMultiple ? 'is-multiple' : 'is-single'} ${isSelectedOption ? 'is-selected' : ''}`}
                                  onClick={() => updateSelectedQuestion((item) => ({
                                      ...item,
                                      correctOptionIds: item.allowMultiple
                                        ? item.correctOptionIds.includes(option.id)
                                          ? item.correctOptionIds.filter((currentId) => currentId !== option.id)
                                          : [...item.correctOptionIds, option.id]
                                        : [option.id],
                                    }))}
                                  aria-label={`${isSelectedOption ? 'Unselect' : 'Select'} option ${String.fromCharCode(65 + index)} as correct`}
                                  aria-pressed={isSelectedOption}
                                >
                                  {isSelectedOption ? <Check size={13} strokeWidth={2.5} /> : null}
                                </button>
                                <RichMathEditor
                                  value={option.label}
                                  onChange={(nextValue) => updateSelectedQuestion((item) => ({
                                    ...item,
                                    options: item.options.map((currentOption) => (
                                      currentOption.id === option.id
                                        ? { ...currentOption, label: nextValue }
                                        : currentOption
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
                                      className="question-bank-icon-btn"
                                      onClick={() => updateSelectedQuestion((item) => ({
                                        ...item,
                                        options: item.options.filter((currentOption) => currentOption.id !== option.id),
                                        correctOptionIds: item.correctOptionIds.filter((currentId) => currentId !== option.id),
                                      }))}
                                      aria-label="Delete option"
                                    >
                                      <Trash2 size={14} strokeWidth={2} />
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            )})}
                          </div>
                          <div className="question-bank-options-foot">
                            {(() => {
                              const { maxCount } = getOptionModeConfig(selectedQuestion.allowMultiple)
                              const isAtMaxOptions = selectedQuestion.options.length >= maxCount
                              return (
                                <button
                                  type="button"
                                  className="question-bank-add-option-icon"
                                  onClick={handleAddOption}
                                  aria-label="Add option"
                                  title={isAtMaxOptions ? `Maximum ${maxCount} options` : 'Add option'}
                                  disabled={isAtMaxOptions}
                                >
                                  <Plus size={14} strokeWidth={2} />
                                  Add Option
                                </button>
                              )
                            })()}
                          </div>
                        </div>
                      ) : null}

                        <div className="question-bank-answer-block">
                          <div className="question-bank-section-head">
                            <div>
                              <span className="question-bank-eyebrow">Answer & Explanation</span>
                            </div>
                          </div>

                          <label className="question-bank-field">
                            <RichMathEditor
                              value={selectedQuestion.answerKey}
                              onChange={(nextValue) => updateSelectedQuestion({ answerKey: nextValue })}
                              placeholder="Add a short note for the expected answer."
                              minRows={3}
                              ariaLabel="Answer key"
                            />
                          </label>
                      </div>

                      </section>

                      {selectedQuestion.type === 'Descriptive Question' ? (
                        <section className="question-bank-soft-panel">
                          <div className="question-bank-section-head">
                            <div>
                              <span className="question-bank-eyebrow">Question Structure</span>
                              <strong>Parent, child and sub-child flow</strong>
                            </div>
                            <div className="question-bank-inline-actions">
                              <button
                                type="button"
                                className="question-bank-secondary-btn"
                                onClick={() => handleAddHierarchyNode('child')}
                                disabled={selectedQuestion.level === 'sub-child'}
                              >
                                <FolderTree size={14} strokeWidth={2} />
                                Add Child
                              </button>
                              <button
                                type="button"
                                className="question-bank-secondary-btn"
                                onClick={() => handleAddHierarchyNode('sub-child')}
                                disabled={selectedQuestion.level !== 'child'}
                              >
                                <Sparkles size={14} strokeWidth={2} />
                                Add Sub-Child
                              </button>
                            </div>
                          </div>

                          <div className="question-bank-hierarchy-list">
                            {descriptiveQuestions.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className={`question-bank-hierarchy-item is-${item.level} ${item.id === selectedQuestion.id ? 'is-active' : ''}`}
                                onClick={() => setSelectedQuestionId(item.id)}
                              >
                                <span>{getLevelLabel(item.level)}</span>
                                <strong>{getQuestionPreview(item)}</strong>
                              </button>
                            ))}
                          </div>

                          <label className="question-bank-field">
                            <span>Expected response guide</span>
                            <RichMathEditor
                              value={selectedQuestion.descriptiveGuide}
                              onChange={(nextValue) => updateSelectedQuestion({ descriptiveGuide: nextValue })}
                              placeholder="Outline what faculty expect in the answer"
                              minRows={4}
                              ariaLabel="Expected response guide"
                            />
                          </label>
                        </section>
                      ) : null}

                      {selectedQuestion.type === 'True or False' ? (
                        <section className="question-bank-soft-panel">
                          <div className="question-bank-section-head">
                            <div>
                              <span className="question-bank-eyebrow">Options</span>
                              <strong>Select true or false</strong>
                            </div>
                          </div>
                          <div className="question-bank-binary-row">
                            {['True', 'False'].map((value) => (
                              <button
                                key={value}
                                type="button"
                                className={`question-bank-binary-btn ${selectedQuestion.trueFalseAnswer === value ? 'is-active' : ''}`}
                                onClick={() => updateSelectedQuestion({ trueFalseAnswer: value, answerKey: `Correct answer: ${value}` })}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </section>
                      ) : null}

                      {selectedQuestion.type === 'Fill in the Blanks' ? (
                        <section className="question-bank-soft-panel">
                          <div className="question-bank-section-head">
                            <div>
                              <span className="question-bank-eyebrow">Blank Answers</span>
                              <strong>Show text box and accepted answers</strong>
                            </div>
                          </div>
                          <div className="question-bank-choice-list">
                            {selectedQuestion.fillBlankAnswers.map((answer, index) => (
                              <RichMathEditor
                                key={`${selectedQuestion.id}-blank-${index}`}
                                value={answer}
                                onChange={(nextValue) => updateSelectedQuestion((item) => ({
                                  ...item,
                                  fillBlankAnswers: item.fillBlankAnswers.map((currentAnswer, answerIndex) => (
                                    answerIndex === index ? nextValue : currentAnswer
                                  )),
                                }))}
                                placeholder={`Accepted answer ${index + 1}`}
                                minRows={1}
                                compact
                                ariaLabel={`Accepted answer ${index + 1}`}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            className="question-bank-secondary-btn"
                            onClick={() => updateSelectedQuestion((item) => ({
                              ...item,
                              fillBlankAnswers: [...item.fillBlankAnswers, ''],
                            }))}
                          >
                            <Plus size={14} strokeWidth={2} />
                            Add Accepted Answer
                          </button>
                        </section>
                      ) : null}

                    </div>

                    <aside className="question-bank-side-panel">
                      <div className="question-bank-assessment-panel question-bank-assessment-inline">
                        <div className="question-bank-section-head">
                          <div>
                            <strong>Assessment Tags</strong>
                          </div>
                        </div>

                        <label className="question-bank-field">
                          <span>Question Category</span>
                          <select
                            className={!selectedQuestion.questionCategory ? 'is-placeholder' : ''}
                            value={selectedQuestion.questionCategory}
                            onChange={(event) => updateSelectedQuestion({ questionCategory: event.target.value })}
                          >
                            <option value="" disabled>Select Category</option>
                            {QUESTION_CATEGORY_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </label>

                        <label className="question-bank-field">
                          <span>Cognitive Level</span>
                          <select
                            className={!selectedQuestion.cognitiveLevel ? 'is-placeholder' : ''}
                            value={selectedQuestion.cognitiveLevel}
                            onChange={(event) => updateSelectedQuestion({ cognitiveLevel: event.target.value })}
                          >
                            <option value="" disabled>Select Cognitive Level</option>
                            {COGNITIVE_LEVEL_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </label>

                        <label className="question-bank-field">
                          <span>Thinking Level</span>
                          <select
                            className={!selectedQuestion.thinkingLevel ? 'is-placeholder' : ''}
                            value={selectedQuestion.thinkingLevel}
                            onChange={(event) => updateSelectedQuestion({ thinkingLevel: event.target.value })}
                          >
                            <option value="" disabled>Select Thinking Level</option>
                            {THINKING_LEVEL_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </label>

                        <label className="question-bank-field">
                          <span>Difficulty Level</span>
                          <select
                            className={!selectedQuestion.difficultyLevel ? 'is-placeholder' : ''}
                            value={selectedQuestion.difficultyLevel}
                            onChange={(event) => updateSelectedQuestion({ difficultyLevel: event.target.value })}
                          >
                            <option value="">Select Difficulty Level</option>
                            {DIFFICULTY_LEVEL_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </label>

                        <button
                          type="button"
                          className={`question-bank-optional-tags-badge ${isOptionalTagsOpen ? 'is-open' : ''}`}
                          onClick={() => setIsOptionalTagsOpen((current) => !current)}
                          aria-expanded={isOptionalTagsOpen}
                        >
                          <Info size={13} strokeWidth={2.2} />
                          Add More (Optional)
                        </button>

                        {isOptionalTagsOpen ? (
                          <div className="question-bank-optional-tags-panel">
                            <label className="question-bank-field">
                              <span>Cognitive Function</span>
                              <select
                                className={!selectedQuestion.cognitiveFunction ? 'is-placeholder' : ''}
                                value={selectedQuestion.cognitiveFunction}
                                onChange={(event) => updateSelectedQuestion({ cognitiveFunction: event.target.value })}
                              >
                                <option value="">Select Cognitive Function</option>
                                {COGNITIVE_FUNCTION_OPTIONS.map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </label>

                            <label className="question-bank-field">
                              <span>Skill Focus</span>
                              <select
                                className={!selectedQuestion.skillFocus ? 'is-placeholder' : ''}
                                value={selectedQuestion.skillFocus}
                                onChange={(event) => updateSelectedQuestion({ skillFocus: event.target.value })}
                              >
                                <option value="">Select Skill Focus</option>
                                {SKILL_FOCUS_OPTIONS.map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </label>

                            <label className="question-bank-field">
                              <span>Organ System</span>
                              <select
                                className={!selectedQuestion.organSystem ? 'is-placeholder' : ''}
                                value={selectedQuestion.organSystem}
                                onChange={(event) => updateSelectedQuestion({ organSystem: event.target.value })}
                              >
                                <option value="">Select Organ System</option>
                                {ORGAN_SYSTEM_OPTIONS.map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </label>

                            <OptionalTagMultiSelect
                              label="Organ Sub System"
                              options={ORGAN_SUB_SYSTEM_OPTIONS}
                              selected={selectedQuestion.organSubSystems ?? []}
                              onToggle={(value) => toggleOptionalTag('organSubSystems', value)}
                              searchValue={optionalTagSearchValues.organSubSystems}
                              onSearchChange={(value) => updateOptionalTagSearch('organSubSystems', value)}
                            />

                            <OptionalTagMultiSelect
                              label="Disease Tags"
                              options={DISEASE_TAG_OPTIONS}
                              selected={selectedQuestion.diseaseTags ?? []}
                              onToggle={(value) => toggleOptionalTag('diseaseTags', value)}
                              searchValue={optionalTagSearchValues.diseaseTags}
                              onSearchChange={(value) => updateOptionalTagSearch('diseaseTags', value)}
                            />

                            <OptionalTagMultiSelect
                              label="Key Concept"
                              options={KEY_CONCEPT_OPTIONS}
                              selected={selectedQuestion.keyConcepts ?? []}
                              onToggle={(value) => toggleOptionalTag('keyConcepts', value)}
                              searchValue={optionalTagSearchValues.keyConcepts}
                              onSearchChange={(value) => updateOptionalTagSearch('keyConcepts', value)}
                            />
                          </div>
                        ) : null}

                        <div className="question-bank-assessment-actions">
                          <button
                            type="button"
                            className={`question-bank-primary-btn ${isGeneratingQuestion ? 'is-loading' : ''}`}
                            onClick={handlePrimaryQuestionAction}
                            disabled={isGeneratingQuestion || !canCreateSelectedQuestion}
                          >
                            {isGeneratingQuestion ? (
                              <>
                                <LoaderCircle size={14} strokeWidth={2.2} className="question-bank-spin-icon" />
                                Generating...
                              </>
                            ) : generationCompleteId === selectedQuestion.id ? (
                              <>
                                <CheckCircle2 size={14} strokeWidth={2.2} />
                                {isUpdatingSelectedQuestion ? 'Updated' : 'Created'}
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={14} strokeWidth={2.2} />
                                {isUpdatingSelectedQuestion ? 'Update' : 'Create'}
                              </>
                            )}
                          </button>
                          <button type="button" className="question-bank-secondary-btn" onClick={handleSaveDraft}>
                            Save as Draft
                          </button>
                        </div>

                      </div>
                    </aside>

                  </div>
                </section>

                {visibleQuestionCards.length ? (
                  <section className="question-bank-created-panel">
                    <div className="question-bank-section-head">
                      <div>
                        <span className="question-bank-eyebrow">Created Questions</span>
                      </div>
                    </div>

                    <div className="question-bank-created-list">
                      {visibleQuestionCards.map((question, index) => {
                        const status = getQuestionCardStatus(question)
                        const typeMeta = getQuestionTypeMeta(question.type)
                        const optionalTagGroups = getQuestionOptionalTagGroups(question)
                        const curriculumMeta = [
                          question.year,
                          question.subject,
                          question.topics?.length ? getSelectionSummary(question.topics, '') : null,
                          question.competencies?.length
                            ? getSelectionSummary(question.competencies, '', getShortCompetencyLabel)
                            : null,
                        ].filter(Boolean)
                        return (
                          <article
                            key={question.id}
                            className={`question-bank-created-card ${question.id === selectedQuestionId ? 'is-active' : ''}`}
                          >
                            <div
                              className="question-bank-created-card-main"
                              role="button"
                              tabIndex={status === 'Generating' ? -1 : 0}
                              aria-disabled={status === 'Generating'}
                              onClick={() => {
                                if (status !== 'Generating') {
                                  setOpenCreatedTagsId(null)
                                  setSelectedQuestionId(question.id)
                                }
                              }}
                              onKeyDown={(event) => {
                                if (status !== 'Generating' && (event.key === 'Enter' || event.key === ' ')) {
                                  event.preventDefault()
                                  setOpenCreatedTagsId(null)
                                  setSelectedQuestionId(question.id)
                                }
                              }}
                            >
                              <span>
                                <span className="question-bank-created-header">
                                  <span className="question-bank-created-header-badges">
                                    <span className="question-bank-badge type">{typeMeta.shortLabel}</span>
                                    <span className={`question-bank-badge ${status === 'Draft' ? 'warning' : status === 'Created' ? 'success' : 'soft'}`}>
                                      {status === 'Generating' ? (
                                        <LoaderCircle size={13} strokeWidth={2.2} className="question-bank-spin-icon" />
                                      ) : status === 'Created' ? (
                                        <CheckCircle2 size={13} strokeWidth={2.2} />
                                      ) : (
                                        <FilePenLine size={13} strokeWidth={2.2} />
                                      )}
                                      {status}
                                    </span>
                                    {status === 'Created' && question.questionCategory ? (
                                      <span className="question-bank-badge mint">{question.questionCategory}</span>
                                    ) : null}
                                    {status === 'Created' && question.cognitiveLevel ? (
                                      <span className="question-bank-badge blue">{question.cognitiveLevel}</span>
                                    ) : null}
                                    {status === 'Created' && question.thinkingLevel ? (
                                      <span className="question-bank-badge lilac">{question.thinkingLevel}</span>
                                    ) : null}
                                    {status === 'Created' && question.difficultyLevel ? (
                                      <span className="question-bank-badge soft">{question.difficultyLevel}</span>
                                    ) : null}
                                    {status === 'Created' && hasVisibleMarks(question.marks) ? (
                                      <span className="question-bank-badge soft">
                                        {question.marks} mark{question.marks === '1' ? '' : 's'}
                                      </span>
                                    ) : null}
                                    {status === 'Created' && optionalTagGroups.length ? (
                                      <span className="question-bank-created-tags-wrap">
                                        <button
                                          type="button"
                                          className="question-bank-badge question-bank-created-tags-badge"
                                          onClick={(event) => {
                                            event.stopPropagation()
                                            setOpenCreatedTagsId((current) => (current === question.id ? null : question.id))
                                          }}
                                          aria-expanded={openCreatedTagsId === question.id}
                                        >
                                          <Info size={13} strokeWidth={2.2} />
                                          View tags
                                        </button>
                                        <span
                                          className={`question-bank-created-tags-tooltip ${openCreatedTagsId === question.id ? 'is-open' : ''}`}
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
                                  </span>
                                </span>
                                <strong className="question-bank-created-question">Q{index + 1}. {getQuestionPreview(question)}</strong>
                                {curriculumMeta.length ? (
                                  <span className="question-bank-created-curriculum" title={curriculumMeta.join(' / ')}>
                                    {curriculumMeta.map((item) => (
                                      <span key={item}>{item}</span>
                                    ))}
                                  </span>
                                ) : null}
                                {status === 'Created' ? (
                                  <>
                                    {question.images?.length ? (
                                      <span className="question-bank-created-images">
                                        {question.images.map((image, imageIndex) => (
                                          <button
                                            key={image.id}
                                            type="button"
                                            className="question-bank-created-image-thumb"
                                            onClick={(event) => {
                                              event.stopPropagation()
                                              openImagePreview(question.images ?? [], imageIndex)
                                            }}
                                            aria-label={`Preview attached image ${String.fromCharCode(65 + imageIndex)}`}
                                          >
                                            <img src={image.url} alt={image.name} />
                                            <span>{String.fromCharCode(65 + imageIndex)}</span>
                                          </button>
                                        ))}
                                      </span>
                                    ) : null}
                                    {question.type === 'MCQ' ? (
                                      <span className="question-bank-created-options">
                                        {question.options
                                          .filter((option) => Boolean(getRichTextPreview(option.label)))
                                          .map((option, optionIndex) => (
                                            <b
                                              key={option.id}
                                              className={question.correctOptionIds.includes(option.id) ? 'is-correct' : ''}
                                            >
                                              {String.fromCharCode(65 + optionIndex)}. {getRichTextPreview(option.label)}
                                            </b>
                                          ))}
                                      </span>
                                    ) : null}
                                    {getRichTextPreview(question.answerKey) ? (
                                      <span className="question-bank-created-answer">
                                        <b>Answer & Explanation</b>
                                        {getRichTextPreview(question.answerKey)}
                                      </span>
                                    ) : null}
                                  </>
                                ) : null}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="question-bank-icon-btn"
                              onClick={() => {
                                setOpenCreatedTagsId(null)
                                handleDeleteQuestionById(question.id)
                              }}
                              aria-label="Delete question"
                            >
                              <Trash2 size={14} strokeWidth={2} />
                            </button>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                ) : null}

              </div>
            </div>
          ) : (
            <div className="question-bank-empty-state">
              <FilePenLine size={24} strokeWidth={2} />
              <strong>Create your first question</strong>
              <p>Choose MCQ, Descriptive, True/False, or Fill in the Blanks from the create card.</p>
            </div>
          )}
        </main>
      </div>

      {selectedQuestion ? (
        <div className={`question-bank-progress-widget ${isProgressWidgetOpen ? 'is-open' : ''}`}>
          {isProgressWidgetOpen ? (
            <div className="question-bank-progress-popover" role="dialog" aria-label="Process checklist">
              <strong className="question-bank-process-title">Process checklist</strong>
              <div className="question-bank-process-list">
                {selectedProcessSteps.map((step, index) => (
                  <div
                    key={step.label}
                    className={`question-bank-process-item ${step.done ? 'is-done' : index === selectedCurrentProcessIndex ? 'is-current' : ''}`}
                  >
                    <span>
                      {step.done ? (
                        <Check size={13} strokeWidth={2.5} />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <strong>{step.label}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            className="question-bank-progress-fab"
            style={{ '--question-bank-progress': `${selectedProcessPercent}%` }}
            onClick={() => setIsProgressWidgetOpen((current) => !current)}
            aria-expanded={isProgressWidgetOpen}
            aria-label="Toggle process checklist"
          >
            <span>
              <strong>{completedProcessStepCount}</strong>
              <small>/{selectedProcessSteps.length}</small>
            </span>
          </button>
        </div>
      ) : null}

      {activePreviewImage ? (
        <div className="question-bank-image-preview-modal" role="dialog" aria-modal="true" aria-label="Image preview">
          <button
            type="button"
            className="question-bank-image-preview-backdrop"
            onClick={() => setPreviewImage(null)}
            aria-label="Close image preview"
          />
          <div className="question-bank-image-preview-card">
            <div className="question-bank-image-preview-head">
              <span className="question-bank-image-preview-title">
                <span className="question-bank-image-preview-letter">{activePreviewLetter}</span>
              </span>
              <span className="question-bank-image-preview-actions">
                <button
                  type="button"
                  className="question-bank-icon-btn"
                  onClick={() => setPreviewImage(null)}
                  aria-label="Close image preview"
                >
                  <X size={15} strokeWidth={2.2} />
                </button>
              </span>
            </div>
            <div className="question-bank-image-preview-body">
              {hasPreviewNavigation ? (
                <button
                  type="button"
                  className="question-bank-image-preview-nav is-prev"
                  onClick={() => movePreviewImage(-1)}
                  aria-label="Preview previous image"
                >
                  <ChevronLeft size={18} strokeWidth={2.4} />
                </button>
              ) : null}
              <img src={activePreviewImage.url} alt={activePreviewImage.name} />
              {hasPreviewNavigation ? (
                <button
                  type="button"
                  className="question-bank-image-preview-nav is-next"
                  onClick={() => movePreviewImage(1)}
                  aria-label="Preview next image"
                >
                  <ChevronRight size={18} strokeWidth={2.4} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

    </section>
  )
}
