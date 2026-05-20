import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Contact,
  Eye,
  FilePenLine,
  IdCard,
  FolderTree,
  ImagePlus,
  Info,
  BriefcaseBusiness,
  ListChecks,
  LoaderCircle,
  Send,
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
const DEFAULT_OPTIONAL_TAG = 'Not Applicable'

const CURRICULUM_DIRECTORY = YEAR_OPTIONS.reduce((directory, year) => ({
  ...directory,
  [year]: SUBJECT_DIRECTORY,
}), {})

const QUESTION_TYPE_CARDS = [
  { type: 'MCQ', shortLabel: 'MCQ', icon: ListChecks },
  { type: 'Descriptive Question', shortLabel: 'Descriptive', icon: FilePenLine },
  { type: 'True or False', shortLabel: 'True / False', icon: CheckCheck, isUpcoming: true },
  { type: 'Fill in the Blanks', shortLabel: 'Fill in blanks', icon: Sigma, isUpcoming: true },
  { type: 'Match Marker', shortLabel: 'Match Marker', icon: FolderTree, isUpcoming: true },
  { type: 'Crossword', shortLabel: 'Crossword', icon: Search, isUpcoming: true },
  { type: 'Assertion & Reasoning', shortLabel: 'Assertion & Reasoning', icon: CheckCircle2, isUpcoming: true },
  { type: 'Justify Yourself', shortLabel: 'Justify Yourself', icon: FilePenLine, isUpcoming: true },
]

const APPROVAL_REVIEWERS = [
  { facultyName: 'Dr. Meera Nair', employeeId: 'EMP1021', designation: 'Professor' },
  { facultyName: 'Dr. Arvind Rao', employeeId: 'EMP1044', designation: 'Associate Professor' },
  { facultyName: 'Dr. Kavya Menon', employeeId: 'EMP1180', designation: 'Assistant Professor' },
]

const QUESTION_BANK_STORAGE_KEY = 'vx-question-bank-questions'
const QUESTION_BANK_REVIEW_RESULTS_KEY = 'vx-question-bank-review-results'
const QUESTION_BANK_PUBLISHED_KEY = 'vx-question-bank-published-questions'

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
  id: `question-${Date.now()}-${questionSequence++}`,
  title: config.title ?? `Question ${questionSequence - 1}`,
  type,
  parentId: config.parentId ?? null,
  level: config.level ?? 'parent',
  questionText: '',
  year: config.year ?? '',
  subject: config.subject ?? '',
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
  revisionStatus: 'Created',
  editCount: 0,
})

const readStoredQuestionBankQuestions = () => {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUESTION_BANK_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const readQuestionBankReviewResults = () => {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUESTION_BANK_REVIEW_RESULTS_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const readPublishedQuestionBankQuestions = () => {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUESTION_BANK_PUBLISHED_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getQuestionTypeMeta = (type) => (
  QUESTION_TYPE_CARDS.find((item) => item.type === type) ?? QUESTION_TYPE_CARDS[0]
)

const getRichTextPreview = (value) => stripHtml(value)

const getQuestionPreview = (question) => getRichTextPreview(question.questionText) || question.title || 'Untitled question'

const getQuestionAuthorName = (question) => (
  question?.authorName
  ?? question?.createdByName
  ?? question?.senderName
  ?? 'Karthik Subramanian'
)

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
  const subject = question.subject || 'Human Anatomy'
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

const getAvailableTopics = (question) => (
  question.year && question.subject ? getSubjectDirectory(question).topics : []
)

const getAvailableCompetencies = (question) => {
  if (!question.year || !question.subject) return []
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

const isDefaultOptionalTagOnly = (values) => (
  !values?.length || (values.length === 1 && values[0] === DEFAULT_OPTIONAL_TAG)
)

const hasDraftContent = (question) => {
  if (!question) return false

  return Boolean(getRichTextPreview(question.questionText))
    || Boolean(getRichTextPreview(question.answerKey))
    || question.images.length > 0
    || Boolean(question.year)
    || Boolean(question.subject)
    || question.topics.length > 0
    || question.competencies.length > 0
    || Boolean(question.questionCategory)
    || Boolean(question.cognitiveLevel)
    || Boolean(question.thinkingLevel)
    || Boolean(question.difficultyLevel)
    || Boolean(question.cognitiveFunction)
    || Boolean(question.skillFocus)
    || Boolean(question.organSystem)
    || !isDefaultOptionalTagOnly(question.organSubSystems)
    || !isDefaultOptionalTagOnly(question.diseaseTags)
    || !isDefaultOptionalTagOnly(question.keyConcepts)
    || question.options.some((option) => Boolean(getRichTextPreview(option.label)))
    || question.correctOptionIds.length > 0
    || question.fillBlankAnswers.some((answer) => Boolean(getRichTextPreview(answer)))
    || Boolean(getRichTextPreview(question.descriptiveGuide))
    || hasVisibleMarks(question.marks)
    || question.isCritical
}

const getAutoFilledCurriculum = (question) => {
  const year = question.year || YEAR_OPTIONS[0]
  const subject = question.subject || getSubjectsForYear(year)[0] || 'Human Anatomy'
  const topicOptions = getAvailableTopics({ ...question, year, subject })
  const topics = question.topics.length ? question.topics : topicOptions.slice(0, 1)
  const competencyOptions = getAvailableCompetencies({ ...question, year, subject, topics })
  const competencies = question.competencies.length
    ? question.competencies
    : competencyOptions.slice(0, 1).map((item) => item.value)

  return {
    year,
    subject,
    topics,
    competencies,
  }
}

const canCreateQuestion = (question) => {
  if (!question || ['Generating', 'Sent to Approval', 'Approved'].includes(question.status)) return false
  return hasQuestionContent(question)
}

const getProcessSteps = (question) => ([
  { label: 'Question Creation (required)', done: hasQuestionContent(question) },
  { label: 'Curriculum Mapping (AI can fill)', done: hasCurriculumMapping(question) },
  { label: 'Options (AI can fill)', done: hasMcqOptions(question) },
  { label: 'Answer Key (AI can fill)', done: Boolean(getRichTextPreview(question.answerKey)) },
  { label: 'Assessment Tags (AI can fill)', done: hasAssessmentTags(question) },
  { label: question.status === 'Draft' ? 'Draft Saved' : question.status === 'Sent to Approval' ? 'Sent to Approval' : 'Created', done: ['Draft', 'Created', 'Sent to Approval'].includes(question.status) },
])

const getQuestionCardStatus = (question) => {
  if (question.status === 'Generating') return 'Generating'
  if (question.status === 'Draft') return 'Draft'
  if (question.status === 'Created') return 'Created'
  if (question.status === 'Sent to Approval') return 'Sent to Approval'
  if (question.status === 'Approved') return 'Approved'
  if (question.status === 'Approval Rejected') return 'Approval Rejected'
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

const normalizeOptionalTagValues = (values) => {
  const cleanValues = (values ?? [])
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)

  return cleanValues.length ? cleanValues : [DEFAULT_OPTIONAL_TAG]
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
            <button
              key={value}
              type="button"
              onClick={() => removeValue(value)}
              aria-label={`Remove ${value}`}
            >
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
  question.year ? getYearDisplayLabel(question.year) : 'Select year',
  question.subject || 'Select subject',
  question.topics.length ? question.topics.join(', ') : 'Select topics',
  question.competencies.length ? question.competencies.map(getShortCompetencyLabel).join(', ') : 'Select competencies',
].filter(Boolean).join(' / ')

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
        </div>
        <span className="question-bank-mapping-selected-badge">{selected.length} selected</span>
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

export default function QuestionBankPage({ onAlert, onSendToApproval }) {
  const [questions, setQuestions] = useState(() => readStoredQuestionBankQuestions())
  const [selectedQuestionId, setSelectedQuestionId] = useState(null)
  const [activeMappingPicker, setActiveMappingPicker] = useState(null)
  const [mappingSearchValue, setMappingSearchValue] = useState('')
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false)
  const [generationCompleteId, setGenerationCompleteId] = useState(null)
  const [isProgressWidgetOpen, setIsProgressWidgetOpen] = useState(false)
  const [isOptionalTagsOpen, setIsOptionalTagsOpen] = useState(false)
  const [openCreatedTagsId, setOpenCreatedTagsId] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [isCurriculumEditing, setIsCurriculumEditing] = useState(false)
  const [curriculumDraft, setCurriculumDraft] = useState(null)
  const [activeQuestionTab, setActiveQuestionTab] = useState('create')
  const [isQuestionTypePickerOpen, setIsQuestionTypePickerOpen] = useState(false)
  const [selectedQuestionTypeLabel, setSelectedQuestionTypeLabel] = useState('')
  const [isApprovalSelectMode, setIsApprovalSelectMode] = useState(false)
  const [approvalSelectedIds, setApprovalSelectedIds] = useState([])
  const [approvedQuestionBankSelectedIds, setApprovedQuestionBankSelectedIds] = useState([])
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [approvalNote, setApprovalNote] = useState('')
  const [selectedApprovalReviewerIndex, setSelectedApprovalReviewerIndex] = useState(0)
  const [pendingEditQuestionId, setPendingEditQuestionId] = useState(null)

  const selectedQuestion = questions.find((item) => item.id === selectedQuestionId) ?? null
  const pendingEditQuestion = questions.find((item) => item.id === pendingEditQuestionId) ?? null
  const visibleQuestionCards = questions.filter((item) => item.status !== 'Editing')
  const draftQuestionCards = questions.filter((item) => item.status === 'Draft')
  const createdQuestionCards = questions.filter((item) => ['Created', 'Generating'].includes(item.status))
  const sentApprovalQuestionCards = questions.filter((item) => item.status === 'Sent to Approval' && hasQuestionContent(item))
  const approvedQuestionCards = questions
    .filter((item) => item.status === 'Approved' && hasQuestionContent(item))
    .sort((firstQuestion, secondQuestion) => (
      Number(Boolean(firstQuestion.questionBankSentAt)) - Number(Boolean(secondQuestion.questionBankSentAt))
    ))
  const rejectedQuestionCards = questions.filter((item) => item.status === 'Approval Rejected' && hasQuestionContent(item))
  const approvedQuestionBankPendingCards = approvedQuestionCards.filter((item) => !item.questionBankSentAt)
  const totalCount = visibleQuestionCards.length
  const readyCount = questions.filter((item) => item.status === 'Created').length
  const draftCount = questions.filter((item) => item.status === 'Draft').length
  const sentApprovalCount = sentApprovalQuestionCards.length
  const approvedCount = approvedQuestionCards.length
  const rejectedCount = rejectedQuestionCards.length
  const generatingCount = questions.filter((item) => item.status === 'Generating').length
  const generationProcessTotal = readyCount + generatingCount
  const generationProcessPercent = generationProcessTotal
    ? Math.round((readyCount / generationProcessTotal) * 100)
    : 0
  const approvableQuestionIds = createdQuestionCards
    .filter((item) => item.status === 'Created')
    .map((item) => item.id)
  const approvedQuestionBankPendingIds = approvedQuestionBankPendingCards.map((item) => item.id)
  const hasApprovableQuestions = approvableQuestionIds.length > 0
  const hasApprovedQuestionsToSend = approvedQuestionBankPendingCards.length > 0
  const hasAllApprovalSelected = hasApprovableQuestions
    && approvableQuestionIds.every((id) => approvalSelectedIds.includes(id))
  const hasAllApprovedQuestionBankSelected = hasApprovedQuestionsToSend
    && approvedQuestionBankPendingIds.every((id) => approvedQuestionBankSelectedIds.includes(id))
  const selectedApprovalReviewer = APPROVAL_REVIEWERS[selectedApprovalReviewerIndex] ?? APPROVAL_REVIEWERS[0]
  const activeQuestionCards = activeQuestionTab === 'draft'
    ? draftQuestionCards
    : activeQuestionTab === 'created'
      ? createdQuestionCards
      : activeQuestionTab === 'sent'
        ? sentApprovalQuestionCards
        : activeQuestionTab === 'approved'
          ? approvedQuestionCards
          : activeQuestionTab === 'rejected'
            ? rejectedQuestionCards
      : []

  const descriptiveQuestions = useMemo(
    () => questions.filter((item) => item.type === 'Descriptive Question'),
    [questions],
  )

  const curriculumQuestion = isCurriculumEditing && curriculumDraft ? curriculumDraft : selectedQuestion
  const availableSubjects = curriculumQuestion ? getSubjectsForYear(curriculumQuestion.year) : []
  const availableTopics = curriculumQuestion ? getAvailableTopics(curriculumQuestion) : []
  const availableCompetencies = curriculumQuestion ? getAvailableCompetencies(curriculumQuestion) : []
  const selectedQuestionIndex = selectedQuestion ? questions.findIndex((item) => item.id === selectedQuestion.id) + 1 : 0
  const selectedProcessSteps = selectedQuestion ? getProcessSteps(selectedQuestion) : []
  const selectedCurrentProcessIndex = selectedProcessSteps.findIndex((step) => !step.done)
  const completedProcessStepCount = selectedProcessSteps.filter((step) => step.done).length
  const selectedProcessPercent = selectedProcessSteps.length
    ? Math.round((completedProcessStepCount / selectedProcessSteps.length) * 100)
    : 0
  const questionBankMetrics = [
    {
      label: 'Sent to Approval',
      value: sentApprovalCount,
      detail: 'Waiting for review',
      icon: Send,
      tone: 'draft',
      targetTab: 'sent',
    },
    {
      label: 'Approved Question',
      value: approvedCount,
      detail: 'Ready to publish',
      icon: CheckCheck,
      tone: 'approved',
      targetTab: 'approved',
    },
    {
      label: 'Approval Rejected',
      value: rejectedCount,
      detail: 'Needs correction',
      icon: X,
      tone: 'rejected',
      targetTab: 'rejected',
    },
    {
      label: 'Generation Process',
      value: `${generationProcessPercent}%`,
      detail: `${readyCount}/${generationProcessTotal} generated`,
      icon: generatingCount ? LoaderCircle : Sparkles,
      tone: 'process',
      progress: generationProcessPercent,
      isLoading: generatingCount > 0,
      targetTab: 'created',
    },
  ]
  const canCreateSelectedQuestion = canCreateQuestion(selectedQuestion)
  const canSaveSelectedDraft = selectedQuestion?.status !== 'Sent to Approval' && hasDraftContent(selectedQuestion)
  const isUpdatingSelectedQuestion = selectedQuestion
    ? ['Created', 'Draft', 'Approval Rejected'].includes(selectedQuestion.status)
    : false
  const shouldShowSelectedDelete = selectedQuestion
    ? selectedQuestion.status !== 'Editing' && !['Sent to Approval', 'Approved'].includes(selectedQuestion.status)
    : false
  const activeMappingItems = activeMappingPicker === 'years'
    ? YEAR_OPTIONS
    : activeMappingPicker === 'subjects'
    ? availableSubjects
    : activeMappingPicker === 'topics'
      ? availableTopics
      : availableCompetencies
  const activeMappingSelected = curriculumQuestion
    ? activeMappingPicker === 'years'
      ? [curriculumQuestion.year].filter(Boolean)
      : activeMappingPicker === 'subjects'
      ? [curriculumQuestion.subject].filter(Boolean)
      : activeMappingPicker === 'topics'
      ? curriculumQuestion.topics
      : curriculumQuestion.competencies
    : []
  const previewImages = previewImage?.images ?? []
  const previewIndex = Math.min(Math.max(previewImage?.index ?? 0, 0), Math.max(previewImages.length - 1, 0))
  const activePreviewImage = previewImages[previewIndex] ?? null
  const hasPreviewNavigation = previewImages.length > 1
  const activePreviewLetter = activePreviewImage ? String.fromCharCode(65 + previewIndex) : ''
  const isListQuestionTab = ['created', 'draft', 'sent', 'approved', 'rejected'].includes(activeQuestionTab)

  useEffect(() => {
    setIsGeneratingQuestion(false)
    setGenerationCompleteId(null)
    setIsProgressWidgetOpen(false)
    setIsOptionalTagsOpen(false)
    setIsCurriculumEditing(false)
    setCurriculumDraft(null)
    closeMappingPicker()
  }, [selectedQuestionId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(QUESTION_BANK_STORAGE_KEY, JSON.stringify(questions))
  }, [questions])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const applyReviewResults = () => {
      const results = readQuestionBankReviewResults()
      if (!results.length) return

      const resultByQuestionId = new Map(results.map((result) => [result.questionId, result]))
      const currentIds = new Set(questions.map((question) => question.id))
      const hasMatchingResults = results.some((result) => currentIds.has(result.questionId))
      if (!hasMatchingResults) return

      setQuestions((current) => current.map((question) => {
        const result = resultByQuestionId.get(question.id)
        if (!result) return question

        return {
          ...question,
          status: result.status === 'Approved' ? 'Approved' : 'Approval Rejected',
          approvalReviewRemarks: result.remarks ?? '',
          approvalReviewedAt: result.reviewedAt ?? '',
        }
      }))

      const remainingResults = results.filter((result) => !currentIds.has(result.questionId))
      window.localStorage.setItem(QUESTION_BANK_REVIEW_RESULTS_KEY, JSON.stringify(remainingResults))
    }

    applyReviewResults()
    window.addEventListener('question-bank-review-results', applyReviewResults)
    window.addEventListener('storage', applyReviewResults)

    return () => {
      window.removeEventListener('question-bank-review-results', applyReviewResults)
      window.removeEventListener('storage', applyReviewResults)
    }
  }, [questions])

  const updateSelectedQuestion = (updater) => {
    if (!selectedQuestion) return
    if (['Sent to Approval', 'Approved'].includes(selectedQuestion.status)) return
    setGenerationCompleteId((current) => (
      current === selectedQuestion.id ? null : current
    ))
    setQuestions((current) => current.map((item) => (
      item.id === selectedQuestion.id
        ? {
          ...(typeof updater === 'function' ? updater(item) : { ...item, ...updater }),
          revisionStatus: item.status === 'Created' ? 'Edited' : item.revisionStatus,
          editCount: item.status === 'Created' ? Math.max(Number(item.editCount ?? item.revisionCount ?? 1) || 1, 1) : item.editCount,
        }
        : item
    )))
  }

  const handleCreateQuestion = (type) => {
    const typeMeta = getQuestionTypeMeta(type)
    if (typeMeta.isUpcoming) return
    const question = createQuestion(type, {
      title: `${typeMeta.shortLabel} ${questions.length + 1}`,
    })
    setQuestions((current) => [...current, question])
    setSelectedQuestionId(question.id)
    setActiveQuestionTab('create')
    setSelectedQuestionTypeLabel(typeMeta.shortLabel)
    setIsQuestionTypePickerOpen(false)
  }

  const openEditQuestionFlow = (questionId) => {
    setOpenCreatedTagsId(null)
    const question = questions.find((item) => item.id === questionId)
    if (question?.status === 'Approval Rejected') {
      startEditQuestionFlow(question)
      return
    }
    setPendingEditQuestionId(questionId)
  }

  const cancelEditQuestionFlow = () => {
    setPendingEditQuestionId(null)
  }

  const startEditQuestionFlow = (questionToEdit = pendingEditQuestion) => {
    if (!questionToEdit) return

    const questionId = questionToEdit.id
    const typeMeta = getQuestionTypeMeta(questionToEdit.type)
    const isRejectedQuestion = questionToEdit.status === 'Approval Rejected'

    setQuestions((current) => current.map((item) => (
      item.id === questionId
        ? {
          ...item,
          status: 'Draft',
          revisionStatus: isRejectedQuestion ? 'Created' : 'Edited',
          editCount: isRejectedQuestion ? 0 : Number(item.editCount ?? item.revisionCount ?? 0) + 1,
          approvalReviewRemarks: '',
          approvalReviewedAt: '',
        }
        : item
    )))
    setSelectedQuestionId(questionId)
    setActiveQuestionTab('create')
    setSelectedQuestionTypeLabel(typeMeta.shortLabel)
    setPendingEditQuestionId(null)
    setIsQuestionTypePickerOpen(false)
    setIsApprovalSelectMode(false)
    setApprovalSelectedIds((current) => current.filter((id) => id !== questionId))
    onAlert?.({ tone: 'secondary', message: `${typeMeta.shortLabel} loaded for editing.` })
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
    if (selectedQuestion.status === 'Sent to Approval') return
    const nextQuestions = questions.filter((item) => item.id !== selectedQuestion.id)
    setQuestions(nextQuestions)
    setSelectedQuestionId(nextQuestions[0]?.id ?? null)
    onAlert?.({ tone: 'warning', message: 'Question removed.' })
  }

  const handleDeleteQuestionById = (questionId) => {
    const question = questions.find((item) => item.id === questionId)
    if (question?.status === 'Sent to Approval') return
    const nextQuestions = questions.filter((item) => item.id !== questionId)
    setQuestions(nextQuestions)
    setApprovalSelectedIds((current) => current.filter((id) => id !== questionId))
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(nextQuestions[0]?.id ?? null)
    }
    onAlert?.({ tone: 'warning', message: 'Question removed.' })
  }

  const sendApprovedQuestionsToQuestionBank = (questionIds = approvedQuestionBankSelectedIds) => {
    if (!questionIds.length || typeof window === 'undefined') return

    const selectedIds = new Set(questionIds)
    const selectedApprovedCards = approvedQuestionBankPendingCards.filter((question) => selectedIds.has(question.id))
    if (!selectedApprovedCards.length) return

    const sentAt = new Date().toISOString()
    const nextPublishedQuestions = selectedApprovedCards.map((question) => ({
      ...question,
      questionBankStatus: 'Sent to Question Bank',
      questionBankSentAt: sentAt,
    }))
    const existingQuestions = readPublishedQuestionBankQuestions()
    const nextQuestionIds = new Set(nextPublishedQuestions.map((question) => question.id))
    const mergedQuestions = [
      ...existingQuestions.filter((question) => !nextQuestionIds.has(question.id)),
      ...nextPublishedQuestions,
    ]

    window.localStorage.setItem(QUESTION_BANK_PUBLISHED_KEY, JSON.stringify(mergedQuestions))
    window.dispatchEvent(new Event('question-bank-published-questions'))
    setQuestions((current) => current.map((item) => (
      nextQuestionIds.has(item.id)
        ? {
          ...item,
          questionBankStatus: 'Sent to Question Bank',
          questionBankSentAt: sentAt,
        }
        : item
    )))
    setApprovedQuestionBankSelectedIds((current) => current.filter((id) => !nextQuestionIds.has(id)))
    onAlert?.({
      tone: 'success',
      message: `${nextPublishedQuestions.length} approved question${nextPublishedQuestions.length === 1 ? '' : 's'} sent to Question Bank.`,
    })
  }

  const selectAllApprovedQuestionBankQuestions = () => {
    setApprovedQuestionBankSelectedIds(approvedQuestionBankPendingIds)
  }

  const unselectApprovedQuestionBankQuestions = () => {
    setApprovedQuestionBankSelectedIds([])
  }

  const clearApprovedQuestionBankSelection = () => {
    setApprovedQuestionBankSelectedIds([])
  }

  const toggleApprovedQuestionBankSelection = (questionId) => {
    if (!approvedQuestionBankPendingIds.includes(questionId)) return
    setApprovedQuestionBankSelectedIds((current) => (
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    ))
  }

  const startApprovalSelection = () => {
    if (!hasApprovableQuestions) return
    setActiveQuestionTab('created')
    setIsApprovalSelectMode(true)
    setApprovalSelectedIds(approvableQuestionIds)
  }

  const cancelApprovalSelection = () => {
    setIsApprovalSelectMode(false)
    setApprovalSelectedIds([])
  }

  const toggleApprovalSelection = (questionId) => {
    if (!approvableQuestionIds.includes(questionId)) return
    setApprovalSelectedIds((current) => (
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    ))
  }

  const selectAllApprovalQuestions = () => {
    setApprovalSelectedIds(approvableQuestionIds)
  }

  const unselectAllApprovalQuestions = () => {
    setApprovalSelectedIds([])
  }

  const sendSelectedQuestionsToApproval = () => {
    if (!approvalSelectedIds.length) return
    setIsApprovalModalOpen(true)
  }

  const confirmSendSelectedQuestionsToApproval = () => {
    if (!approvalSelectedIds.length) return
    const selectedIds = new Set(approvalSelectedIds)
    const selectedQuestions = questions.filter((item) => selectedIds.has(item.id))
    const approvalId = `question-bank-${Date.now()}`
    const primaryQuestion = selectedQuestions[0] ?? null
    const yearValues = [...new Set(selectedQuestions.map((item) => item.year).filter(Boolean))]
    const subjectValues = [...new Set(selectedQuestions.map((item) => item.subject).filter(Boolean))]
    const questionTypeSummary = selectedQuestions.reduce((summary, question) => ({
      ...summary,
      [getQuestionTypeMeta(question.type).shortLabel]: (summary[getQuestionTypeMeta(question.type).shortLabel] ?? 0) + 1,
    }), {})
    const questionTypeSummaryText = Object.entries(questionTypeSummary)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ')
    const questionChangeStatus = selectedQuestions.some((question) => question.revisionStatus === 'Edited')
      ? 'Edited'
      : 'Created'
    const questionEditedCount = selectedQuestions.reduce((total, question) => (
      total + (question.revisionStatus === 'Edited' ? Math.max(Number(question.editCount ?? question.revisionCount ?? 1) || 1, 1) : 0)
    ), 0)

    onSendToApproval?.({
      activityId: approvalId,
      activityName: selectedQuestions.length === 1
        ? getQuestionPreview(primaryQuestion)
        : `Question Bank - ${selectedQuestions.length} Questions`,
      activityType: 'Question Bank',
      approvalStatus: 'Pending Approval',
      status: 'Pending Approval',
      totalStudents: selectedQuestions.length,
      totalQuestions: selectedQuestions.length,
      questionTypeSummary,
      questionTypeSummaryText,
      questionRevisionStatus: questionChangeStatus,
      questionChangeStatus,
      questionEditCount: questionEditedCount,
      year: yearValues.length === 1 ? yearValues[0] : yearValues.length ? `${yearValues.length} years` : 'Question Bank',
      sgt: subjectValues.length === 1 ? subjectValues[0] : subjectValues.length ? `${subjectValues.length} subjects` : 'Questions',
      facultyName: selectedApprovalReviewer.facultyName,
      employeeId: selectedApprovalReviewer.employeeId,
      designation: selectedApprovalReviewer.designation,
      note: approvalNote,
      questionRows: selectedQuestions.map((question, index) => ({
        id: question.id,
        questionNumber: index + 1,
        title: getQuestionPreview(question),
        authorName: getQuestionAuthorName(question),
        type: question.type,
        year: question.year,
        subject: question.subject,
        topics: question.topics,
        competencies: question.competencies,
        isCritical: question.isCritical,
        revisionStatus: question.revisionStatus || 'Created',
        editCount: question.editCount ?? question.revisionCount ?? 0,
        marks: question.marks,
        questionCategory: question.questionCategory,
        cognitiveLevel: question.cognitiveLevel,
        thinkingLevel: question.thinkingLevel,
        difficultyLevel: question.difficultyLevel,
        cognitiveFunction: question.cognitiveFunction,
        skillFocus: question.skillFocus,
        organSystem: question.organSystem,
        organSubSystems: question.organSubSystems,
        diseaseTags: question.diseaseTags,
        keyConcepts: question.keyConcepts,
        images: question.images,
        questionText: question.questionText,
        options: question.options,
        correctOptionIds: question.correctOptionIds,
        trueFalseAnswer: question.trueFalseAnswer,
        fillBlankAnswers: question.fillBlankAnswers,
        descriptiveGuide: question.descriptiveGuide,
        answerKey: question.answerKey,
      })),
    })

    setQuestions((current) => current.map((item) => (
      selectedIds.has(item.id) ? { ...item, status: 'Sent to Approval' } : item
    )))
    setActiveQuestionTab('sent')
    setSelectedQuestionId((currentId) => {
      if (!selectedIds.has(currentId)) return currentId
      const nextEditable = questions.find((item) => !selectedIds.has(item.id) && !['Sent to Approval', 'Approved'].includes(item.status))
      return nextEditable?.id ?? null
    })
    setIsApprovalModalOpen(false)
    setApprovalNote('')
    cancelApprovalSelection()
    onAlert?.({ tone: 'success', message: 'Selected questions sent to approval.' })
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
              revisionStatus: item.revisionStatus === 'Edited' ? 'Edited' : 'Created',
              approvalReviewRemarks: '',
              approvalReviewedAt: '',
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

    window.setTimeout(() => {
      setQuestions((current) => current.map((item) => {
        if (item.id !== questionId) return item

        const needsQuestion = !hasQuestionContent(item)
        const autoFilledCurriculum = getAutoFilledCurriculum(item)
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
          ...autoFilledCurriculum,
          questionText: needsQuestion ? generatedDraft.questionText : item.questionText,
          answerKey: needsAnswerKey ? generatedDraft.answerKey : item.answerKey,
          questionCategory: item.questionCategory || generatedDraft.questionCategory || 'Application',
          cognitiveLevel: item.cognitiveLevel || generatedDraft.cognitiveLevel || 'Apply',
          thinkingLevel: item.thinkingLevel || generatedDraft.thinkingLevel || 'HoT',
          difficultyLevel: item.difficultyLevel || generatedDraft.difficultyLevel || 'L2',
          cognitiveFunction: item.cognitiveFunction || generatedDraft.cognitiveFunction || '',
          skillFocus: item.skillFocus || generatedDraft.skillFocus || '',
          organSystem: item.organSystem || generatedDraft.organSystem || '',
          organSubSystems: isDefaultOptionalTagOnly(item.organSubSystems) ? generatedDraft.organSubSystems || [DEFAULT_OPTIONAL_TAG] : item.organSubSystems,
          diseaseTags: isDefaultOptionalTagOnly(item.diseaseTags) ? generatedDraft.diseaseTags || [DEFAULT_OPTIONAL_TAG] : item.diseaseTags,
          keyConcepts: isDefaultOptionalTagOnly(item.keyConcepts) ? generatedDraft.keyConcepts || [DEFAULT_OPTIONAL_TAG] : item.keyConcepts,
          options: generatedOptions,
          correctOptionIds: needsOptions ? [generatedOptions[0].id] : item.correctOptionIds,
          trueFalseAnswer: item.trueFalseAnswer || generatedDraft.trueFalseAnswer || 'True',
          fillBlankAnswers: item.fillBlankAnswers?.some((answer) => getRichTextPreview(answer))
            ? item.fillBlankAnswers
            : generatedDraft.fillBlankAnswers || item.fillBlankAnswers,
          descriptiveGuide: item.descriptiveGuide || generatedDraft.descriptiveGuide || item.descriptiveGuide,
          title: getRichTextPreview(needsQuestion ? generatedDraft.questionText : item.questionText).slice(0, 60) || item.title,
          status: 'Created',
          revisionStatus: item.revisionStatus || 'Created',
        }
      }))
      setGenerationCompleteId(questionId)
      onAlert?.({ tone: 'success', message: 'Question created.' })
    }, GENERATION_DELAY_MS)
  }

  const handleSaveDraft = () => {
    if (!selectedQuestion || !canSaveSelectedDraft) return
    const questionId = selectedQuestion.id
    const nextQuestion = createQuestion(selectedQuestion.type, {
      title: `${getQuestionTypeMeta(selectedQuestion.type).shortLabel} ${questions.length + 1}`,
    })

    setQuestions((current) => [
      ...current.map((item) => (
        item.id === questionId
          ? {
            ...item,
            title: getQuestionPreview(item).slice(0, 60) || item.title,
            status: 'Draft',
          }
          : item
      )),
      nextQuestion,
    ])
    setSelectedQuestionId(nextQuestion.id)
    setGenerationCompleteId(null)
    closeMappingPicker()
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

  const startCurriculumEdit = () => {
    if (!selectedQuestion) return
    setCurriculumDraft({
      year: selectedQuestion.year,
      subject: selectedQuestion.subject,
      topics: [...selectedQuestion.topics],
      competencies: [...selectedQuestion.competencies],
    })
    setIsCurriculumEditing(true)
    closeMappingPicker()
  }

  const cancelCurriculumEdit = () => {
    setIsCurriculumEditing(false)
    setCurriculumDraft(null)
    closeMappingPicker()
  }

  const applyCurriculumEdit = () => {
    if (!curriculumDraft) return
    updateSelectedQuestion({
      year: curriculumDraft.year,
      subject: curriculumDraft.subject,
      topics: [...curriculumDraft.topics],
      competencies: [...curriculumDraft.competencies],
    })
    setIsCurriculumEditing(false)
    setCurriculumDraft(null)
    closeMappingPicker()
  }

  const updateCurriculumDraft = (updater) => {
    setCurriculumDraft((current) => {
      if (!current) return current
      return typeof updater === 'function' ? updater(current) : { ...current, ...updater }
    })
  }

  const handleToggleTopic = (value) => {
    updateCurriculumDraft((item) => {
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

  const handleSelectSubject = (value) => {
    updateCurriculumDraft({
      subject: value,
      topics: [],
      competencies: [],
    })
    setActiveMappingPicker('topics')
    setMappingSearchValue('')
  }

  const handleSelectYear = (value) => {
    updateCurriculumDraft((item) => {
      const nextSubjects = getSubjectsForYear(value)
      const nextSubject = nextSubjects.includes(item.subject)
        ? item.subject
        : ''
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
    <div className={`question-bank-type-select-panel ${isQuestionTypePickerOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className="question-bank-type-select-trigger"
        onClick={() => setIsQuestionTypePickerOpen((current) => !current)}
        aria-expanded={isQuestionTypePickerOpen}
      >
        <span className="question-bank-type-picker-icon">
          <ListChecks size={15} strokeWidth={2} />
        </span>
        <strong>{selectedQuestion ? getQuestionTypeMeta(selectedQuestion.type).shortLabel : selectedQuestionTypeLabel || 'Select Question Type'}</strong>
        <ChevronDown size={16} strokeWidth={2.4} />
      </button>

      {isQuestionTypePickerOpen ? (
        <div className="question-bank-type-picker">
          {QUESTION_TYPE_CARDS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.type}
                type="button"
                className={`question-bank-type-picker-item ${item.isUpcoming ? 'is-upcoming' : ''}`}
                onClick={() => handleCreateQuestion(item.type)}
                disabled={item.isUpcoming}
              >
                <span className="question-bank-type-picker-icon">
                  <Icon size={15} strokeWidth={2} />
                </span>
                <span>{item.shortLabel}</span>
                {item.isUpcoming ? <small>Upcoming</small> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )

  return (
    <section className="question-bank-page">
     

      <div className="question-bank-layout">
        <main className="question-bank-main">
          <div className="question-bank-metrics-grid" aria-label="Question bank metrics">
            {questionBankMetrics.map((metric) => {
              const Icon = metric.icon
              const MetricElement = metric.targetTab ? 'button' : 'article'
              return (
                <MetricElement
                  key={metric.label}
                  type={metric.targetTab ? 'button' : undefined}
                  className={`question-bank-metric-card is-${metric.tone} ${metric.targetTab ? 'is-actionable' : ''}`}
                  onClick={metric.targetTab ? () => setActiveQuestionTab(metric.targetTab) : undefined}
                >
                  <span className="question-bank-metric-icon">
                    <Icon
                      size={17}
                      strokeWidth={2.3}
                      className={metric.isLoading ? 'question-bank-spin-icon' : undefined}
                    />
                  </span>
                  <span className="question-bank-metric-copy">
                    <strong>{metric.value}</strong>
                    <small>{metric.label}</small>
                    <em className={metric.isLoading ? 'is-loading' : undefined}>
                      {metric.isLoading ? 'Generating...' : metric.detail}
                    </em>
                    {typeof metric.progress === 'number' ? (
                      <span className={`question-bank-metric-progress ${metric.isLoading ? 'is-loading' : ''}`}>
                        <span style={{ width: `${metric.progress}%` }} />
                      </span>
                    ) : null}
                  </span>
                </MetricElement>
              )
            })}
          </div>

          <div className="question-bank-tabs" role="tablist" aria-label="Question bank sections">
            <button
              type="button"
              className={activeQuestionTab === 'create' ? 'is-active' : ''}
              onClick={() => setActiveQuestionTab('create')}
              role="tab"
              aria-selected={activeQuestionTab === 'create'}
            >
              Create Question
            </button>
            <button
              type="button"
              className={activeQuestionTab === 'created' ? 'is-active' : ''}
              onClick={() => setActiveQuestionTab('created')}
              role="tab"
              aria-selected={activeQuestionTab === 'created'}
            >
              Created Questions
              <span>{createdQuestionCards.length}</span>
            </button>
            <button
              type="button"
              className={activeQuestionTab === 'draft' ? 'is-active' : ''}
              onClick={() => setActiveQuestionTab('draft')}
              role="tab"
              aria-selected={activeQuestionTab === 'draft'}
            >
              Draft Questions
              <span>{draftQuestionCards.length}</span>
            </button>
            <button
              type="button"
              className={activeQuestionTab === 'sent' ? 'is-active' : ''}
              onClick={() => setActiveQuestionTab('sent')}
              role="tab"
              aria-selected={activeQuestionTab === 'sent'}
            >
              Sent to Approval
              <span>{sentApprovalQuestionCards.length}</span>
            </button>
            <button
              type="button"
              className={activeQuestionTab === 'approved' ? 'is-active' : ''}
              onClick={() => setActiveQuestionTab('approved')}
              role="tab"
              aria-selected={activeQuestionTab === 'approved'}
            >
              Approved Questions
              <span>{approvedQuestionCards.length}</span>
            </button>
            <button
              type="button"
              className={activeQuestionTab === 'rejected' ? 'is-active' : ''}
              onClick={() => setActiveQuestionTab('rejected')}
              role="tab"
              aria-selected={activeQuestionTab === 'rejected'}
            >
              Approval Rejected
              <span>{rejectedQuestionCards.length}</span>
            </button>
          </div>

          {activeQuestionTab === 'create' && !selectedQuestion ? (
            <div className={`question-bank-create-strip ${!selectedQuestion ? 'has-empty-state' : ''}`}>
              {questionTypePicker}
              {!selectedQuestion ? (
                <div className="question-bank-empty-state question-bank-create-empty-state">
                  <FilePenLine size={24} strokeWidth={2} />
                  <strong>Create your first question</strong>
                  <p>Choose MCQ or Descriptive from Select Question Type.</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {selectedQuestion || isListQuestionTab ? (
            <div className="question-bank-workspace">
              <div className="question-bank-editor">
                {activeQuestionTab === 'create' && selectedQuestion ? (
                <section className={`question-bank-author-card ${selectedQuestion.isCritical ? 'is-critical' : ''}`}>
                  <div className="question-bank-author-type-strip">
                    {questionTypePicker}
                    {shouldShowSelectedDelete ? (
                      <button type="button" className="question-bank-icon-btn" onClick={handleDeleteQuestion} aria-label="Delete question">
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    ) : null}
                  </div>

                  <div className="question-bank-author-grid">
                    <div className="question-bank-author-main">
                      <section className="question-bank-curriculum-panel">
                        {!isCurriculumEditing ? (
                          <div className="question-bank-curriculum-summary-line" title={getCurriculumStatusLabel(selectedQuestion)}>
                            <span>{getCurriculumStatusLabel(selectedQuestion)}</span>
                            <button
                              type="button"
                              className="question-bank-curriculum-edit-link"
                              onClick={startCurriculumEdit}
                              aria-label={`Edit curriculum mapping: ${getCurriculumStatusLabel(selectedQuestion)}`}
                            >
                              <FilePenLine size={13} strokeWidth={2.2} />
                              Edit Curriculum
                            </button>
                          </div>
                        ) : (
                          <div className="question-bank-curriculum-edit-card">
                            <div className="question-bank-curriculum-grid">
                              <div className="question-bank-field">
                                <button
                                  type="button"
                                  className="question-bank-mapping-trigger"
                                  onClick={() => openMappingPicker('years')}
                                >
                                  <strong>Year</strong>
                                  <span>{curriculumDraft?.year || 'Select year'}</span>
                                </button>
                              </div>

                              <div className="question-bank-field">
                                <button
                                  type="button"
                                  className="question-bank-mapping-trigger"
                                  onClick={() => openMappingPicker('subjects')}
                                >
                                  <strong>Subject</strong>
                                  <span>{curriculumDraft?.subject || 'Select subject'}</span>
                                </button>
                              </div>

                              <div className="question-bank-field">
                                <button
                                  type="button"
                                  className="question-bank-mapping-trigger"
                                  onClick={() => openMappingPicker('topics')}
                                >
                                  <strong>Topics - {curriculumDraft?.topics.length ?? 0} selected</strong>
                                  <span>{getSelectionSummary(curriculumDraft?.topics ?? [], 'Search and select topics')}</span>
                                </button>
                              </div>

                              <div className="question-bank-field">
                                <button
                                  type="button"
                                  className="question-bank-mapping-trigger"
                                  onClick={() => openMappingPicker('competencies')}
                                >
                                  <strong>Competency - {curriculumDraft?.competencies.length ?? 0} selected</strong>
                                  <span>
                                    {getSelectionSummary(
                                      curriculumDraft?.competencies ?? [],
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
                                    : (value) => updateCurriculumDraft((item) => ({
                                    ...item,
                                    competencies: toggleSelection(item.competencies, value),
                                  }))}
                                emptyLabel={activeMappingPicker === 'years'
                                  ? 'Try another year keyword.'
                                  : activeMappingPicker === 'subjects'
                                  ? 'Try another subject keyword.'
                                  : activeMappingPicker === 'topics'
                                  ? 'Try another topic keyword.'
                                  : 'Select topics first or try another competency keyword.'}
                              />
                            ) : null}
                            <div className="question-bank-curriculum-actions">
                              <button type="button" className="question-bank-secondary-btn" onClick={cancelCurriculumEdit}>
                                Cancel
                              </button>
                              <button type="button" className="question-bank-primary-btn" onClick={applyCurriculumEdit}>
                                Apply
                              </button>
                            </div>
                          </div>
                        )}
                      </section>

                      <section className="question-bank-soft-panel question-bank-answer-panel">
                        <div className="question-bank-section-head">
                          <div>
                            <strong className="question-bank-step-title">STEP 1 : Question Creation</strong>
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
                                <strong className="question-bank-step-title">STEP 2 : Options</strong>
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
                              const hasOptionText = Boolean(getRichTextPreview(option.label))
                              const hasAnyCorrectOption = selectedQuestion.correctOptionIds.length > 0
                              const isIncorrectOption = hasAnyCorrectOption && hasOptionText && !isSelectedOption
                              const optionStateClass = isSelectedOption
                                ? 'is-correct'
                                : isIncorrectOption
                                  ? 'is-incorrect'
                                  : !hasOptionText
                                    ? 'is-empty'
                                    : ''
                              return (
                              <div key={option.id} className={`question-bank-choice-row ${optionStateClass}`}>
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
                                  {isSelectedOption ? (
                                    <Check size={13} strokeWidth={2.5} />
                                  ) : isIncorrectOption ? (
                                    <X size={13} strokeWidth={2.5} />
                                  ) : null}
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
                                      className={`question-bank-icon-btn ${hasOptionText ? '' : 'is-empty-remove'}`}
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
                          <label className="question-bank-field">
                            <span className="question-bank-inline-field-badge">Answer &amp; Explanation</span>
                            <RichMathEditor
                              value={selectedQuestion.answerKey}
                              onChange={(nextValue) => updateSelectedQuestion({ answerKey: nextValue })}
                              placeholder="Add a short note for the expected answer."
                              minRows={1}
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
                          <div>
                            <button
                              type="button"
                              className="question-bank-assessment-title-btn"
                              onClick={() => setIsOptionalTagsOpen(false)}
                              aria-expanded={!isOptionalTagsOpen}
                            >
                              <span>Assessment Tags</span>
                              {isOptionalTagsOpen ? (
                                <ChevronDown size={15} strokeWidth={2.4} />
                              ) : (
                                <ChevronUp size={15} strokeWidth={2.4} />
                              )}
                            </button>
                          </div>
                        </div>

                        {!isOptionalTagsOpen ? (
                          <>
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
                          </>
                        ) : null}

                        {!isOptionalTagsOpen ? (
                          <button
                            type="button"
                            className="question-bank-optional-tags-badge"
                            onClick={() => setIsOptionalTagsOpen(true)}
                            aria-expanded={isOptionalTagsOpen}
                          >
                            <Info size={13} strokeWidth={2.2} />
                            <span>Add More (Optional)</span>
                            <ChevronDown size={14} strokeWidth={2.4} />
                          </button>
                        ) : null}

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

                            <OptionalTagTextInput
                              label="Organ Sub System"
                              values={selectedQuestion.organSubSystems}
                              onChange={(values) => updateSelectedQuestion({ organSubSystems: values })}
                            />

                            <OptionalTagTextInput
                              label="Disease Tags"
                              values={selectedQuestion.diseaseTags}
                              onChange={(values) => updateSelectedQuestion({ diseaseTags: values })}
                            />

                            <OptionalTagTextInput
                              label="Key Concept"
                              values={selectedQuestion.keyConcepts}
                              onChange={(values) => updateSelectedQuestion({ keyConcepts: values })}
                            />
                          </div>
                        ) : null}

                        <div className="question-bank-assessment-actions">
                          <button
                            type="button"
                            className={`question-bank-primary-btn ${isGeneratingQuestion ? 'is-loading' : ''}`}
                            onClick={handlePrimaryQuestionAction}
                            disabled={isGeneratingQuestion || !canCreateSelectedQuestion}
                            data-tooltip={canCreateSelectedQuestion && !isGeneratingQuestion ? 'The AI engine will automatically generate data for empty fields.' : undefined}
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
                                <Sparkles size={14} strokeWidth={2.2} />
                                {isUpdatingSelectedQuestion ? 'Update' : 'Create'}
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="question-bank-secondary-btn"
                            onClick={handleSaveDraft}
                            disabled={!canSaveSelectedDraft}
                          >
                            Save as Draft
                          </button>
                        </div>

                      </div>
                    </aside>

                  </div>
                </section>

                ) : null}

                {['created', 'draft', 'sent', 'approved', 'rejected'].includes(activeQuestionTab) && activeQuestionCards.length ? (
                  <section className="question-bank-created-panel">
                    <div className="question-bank-section-head">
                      <div>
                        {activeQuestionTab === 'approved' ? (
                          <span className="question-bank-approval-selection-head">
                            <span className="question-bank-approval-count-badge">
                              {approvedQuestionBankSelectedIds.length} selected
                            </span>
                          </span>
                        ) : isApprovalSelectMode && activeQuestionTab === 'created' ? (
                          <span className="question-bank-approval-selection-head">
                            <button
                              type="button"
                              className="question-bank-icon-btn question-bank-approval-cancel-icon"
                              onClick={cancelApprovalSelection}
                              aria-label="Cancel approval selection"
                              title="Cancel"
                            >
                              <X size={15} strokeWidth={2.2} />
                            </button>
                            <span className="question-bank-approval-count-badge">
                              {approvalSelectedIds.length} selected
                            </span>
                          </span>
                        ) : (
                          <span className="question-bank-eyebrow">
                            {activeQuestionTab === 'draft'
                              ? 'Draft Questions'
                              : activeQuestionTab === 'sent'
                                ? 'Sent to Approval'
                                : activeQuestionTab === 'approved'
                                  ? 'Approved Questions'
                                  : activeQuestionTab === 'rejected'
                                    ? 'Approval Rejected'
                                : 'Created Questions'}
                          </span>
                        )}
                      </div>
                      {activeQuestionTab === 'created' || activeQuestionTab === 'approved' ? (
                        <div className="question-bank-created-panel-actions">
                          {activeQuestionTab === 'approved' ? (
                            <>
                              <button
                                type="button"
                                className="question-bank-secondary-btn"
                                onClick={selectAllApprovedQuestionBankQuestions}
                                disabled={!hasApprovedQuestionsToSend || hasAllApprovedQuestionBankSelected}
                              >
                                <CheckCheck size={14} strokeWidth={2.2} />
                                Select All
                              </button>
                              <button
                                type="button"
                                className="question-bank-secondary-btn"
                                onClick={unselectApprovedQuestionBankQuestions}
                                disabled={!approvedQuestionBankSelectedIds.length}
                              >
                                <X size={14} strokeWidth={2.2} />
                                Unselect
                              </button>
                              <button
                                type="button"
                                className="question-bank-secondary-btn"
                                onClick={clearApprovedQuestionBankSelection}
                                disabled={!approvedQuestionBankSelectedIds.length}
                              >
                                <Trash2 size={14} strokeWidth={2.2} />
                                Clear
                              </button>
                              <button
                                type="button"
                                className="question-bank-primary-btn"
                                onClick={() => sendApprovedQuestionsToQuestionBank()}
                                disabled={!approvedQuestionBankSelectedIds.length}
                                aria-label="Send selected approved questions to question bank"
                                title={approvedQuestionBankSelectedIds.length ? 'Send selected approved questions to Question Bank' : 'Select approved questions to send'}
                              >
                                <Send size={14} strokeWidth={2.2} />
                                Sent to Question Bank
                              </button>
                            </>
                          ) : isApprovalSelectMode ? (
                            <>
                              <button
                                type="button"
                                className="question-bank-secondary-btn"
                                onClick={hasAllApprovalSelected ? unselectAllApprovalQuestions : selectAllApprovalQuestions}
                              >
                                {hasAllApprovalSelected ? (
                                  <X size={14} strokeWidth={2.2} />
                                ) : (
                                  <CheckCheck size={14} strokeWidth={2.2} />
                                )}
                                {hasAllApprovalSelected ? 'Unselect All' : 'Select All'}
                              </button>
                              <button
                                type="button"
                                className="question-bank-primary-btn"
                                onClick={sendSelectedQuestionsToApproval}
                                disabled={!approvalSelectedIds.length}
                              >
                                <CheckCircle2 size={14} strokeWidth={2.2} />
                                Send Selected
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="question-bank-secondary-btn question-bank-send-approval-btn"
                              onClick={startApprovalSelection}
                              disabled={!hasApprovableQuestions}
                              aria-label="Send created questions to approval"
                              title={hasApprovableQuestions ? 'Send to approval' : 'No created questions available'}
                            >
                              <CheckCheck size={15} strokeWidth={2.2} />
                              Send to Approval
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className="question-bank-created-list">
                      {activeQuestionCards.map((question, index) => {
                        const status = getQuestionCardStatus(question)
                        const typeMeta = getQuestionTypeMeta(question.type)
                        const optionalTagGroups = getQuestionOptionalTagGroups(question)
                        const isLockedApprovalCard = ['Sent to Approval', 'Approved'].includes(status)
                        const canStartCardEdit = ['Approved', 'Approval Rejected'].includes(status)
                        const isApprovedQuestionBankSelection = activeQuestionTab === 'approved'
                        const isQuestionBankSent = Boolean(question.questionBankSentAt)
                        const isQuestionBankSelected = approvedQuestionBankSelectedIds.includes(question.id)
                        const shouldShowStatusBadge = !(status === 'Approved' && isQuestionBankSent)
                        const shouldShowQuestionDetails = ['Created', 'Sent to Approval', 'Approved', 'Approval Rejected'].includes(status)
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
                            className={`question-bank-created-card ${question.id === selectedQuestionId ? 'is-active' : ''} ${question.isCritical ? 'is-critical' : ''} ${approvalSelectedIds.includes(question.id) || isQuestionBankSelected ? 'is-approval-selected' : ''} ${isApprovalSelectMode || (isApprovedQuestionBankSelection && !isQuestionBankSent) ? 'is-selection-mode' : ''} ${isQuestionBankSent ? 'is-question-bank-sent' : ''} ${isLockedApprovalCard ? 'is-approval-locked' : ''}`}
                          >
                            {isApprovalSelectMode || (isApprovedQuestionBankSelection && !isQuestionBankSent) ? (
                              <label
                                className="question-bank-approval-checkbox"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {isApprovedQuestionBankSelection ? (
                                  <input
                                    type="checkbox"
                                    checked={isQuestionBankSelected}
                                    onChange={() => toggleApprovedQuestionBankSelection(question.id)}
                                  />
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={approvalSelectedIds.includes(question.id)}
                                    disabled={status !== 'Created'}
                                    onChange={() => toggleApprovalSelection(question.id)}
                                  />
                                )}
                                <span />
                              </label>
                            ) : null}
                            <div
                              className="question-bank-created-card-main"
                              role={isApprovedQuestionBankSelection || !isLockedApprovalCard ? 'button' : undefined}
                              tabIndex={status === 'Generating' || (isLockedApprovalCard && !isApprovedQuestionBankSelection) || (isApprovedQuestionBankSelection && isQuestionBankSent) ? -1 : 0}
                              aria-disabled={status === 'Generating' || (isApprovedQuestionBankSelection && isQuestionBankSent)}
                              onClick={() => {
                                if (isApprovedQuestionBankSelection) {
                                  toggleApprovedQuestionBankSelection(question.id)
                                  return
                                }
                                if (isApprovalSelectMode) {
                                  if (status === 'Created') toggleApprovalSelection(question.id)
                                  return
                                }
                                if (status !== 'Generating' && !isLockedApprovalCard) {
                                  setOpenCreatedTagsId(null)
                                  setSelectedQuestionId(question.id)
                                  setActiveQuestionTab('create')
                                }
                              }}
                              onKeyDown={(event) => {
                                if (isApprovedQuestionBankSelection && (event.key === 'Enter' || event.key === ' ')) {
                                  event.preventDefault()
                                  toggleApprovedQuestionBankSelection(question.id)
                                  return
                                }
                                if (isApprovalSelectMode && (event.key === 'Enter' || event.key === ' ')) {
                                  event.preventDefault()
                                  if (status === 'Created') toggleApprovalSelection(question.id)
                                  return
                                }
                                if (status !== 'Generating' && !isLockedApprovalCard && (event.key === 'Enter' || event.key === ' ')) {
                                  event.preventDefault()
                                  setOpenCreatedTagsId(null)
                                  setSelectedQuestionId(question.id)
                                  setActiveQuestionTab('create')
                                }
                              }}
                            >
                              <span>
                                <span className="question-bank-created-header">
                                  <span className="question-bank-created-header-badges">
                                    <span className="question-bank-badge type">{typeMeta.shortLabel}</span>
                                    {shouldShowStatusBadge ? (
                                      <span className={`question-bank-badge ${status === 'Draft' ? 'warning' : status === 'Created' ? 'success' : status === 'Sent to Approval' ? 'blue' : status === 'Approved' ? 'success' : status === 'Approval Rejected' ? 'danger' : 'soft'}`}>
                                        {status === 'Generating' ? (
                                          <LoaderCircle size={13} strokeWidth={2.2} className="question-bank-spin-icon" />
                                        ) : status === 'Created' || status === 'Approved' ? (
                                          <CheckCircle2 size={13} strokeWidth={2.2} />
                                        ) : status === 'Sent to Approval' ? (
                                          <Send size={13} strokeWidth={2.2} />
                                        ) : status === 'Approval Rejected' ? (
                                          <X size={13} strokeWidth={2.2} />
                                        ) : (
                                          <FilePenLine size={13} strokeWidth={2.2} />
                                        )}
                                        {status}
                                      </span>
                                    ) : null}
                                    {activeQuestionTab === 'approved' && question.questionBankSentAt ? (
                                      <span className="question-bank-badge soft">
                                        Author By : {getQuestionAuthorName(question)}
                                      </span>
                                    ) : null}
                                    {shouldShowQuestionDetails && question.questionCategory ? (
                                      <span className="question-bank-badge mint">{question.questionCategory}</span>
                                    ) : null}
                                    {shouldShowQuestionDetails && question.cognitiveLevel ? (
                                      <span className="question-bank-badge blue">{question.cognitiveLevel}</span>
                                    ) : null}
                                    {shouldShowQuestionDetails && question.thinkingLevel ? (
                                      <span className="question-bank-badge lilac">{question.thinkingLevel}</span>
                                    ) : null}
                                    {shouldShowQuestionDetails && question.difficultyLevel ? (
                                      <span className="question-bank-badge soft">{question.difficultyLevel}</span>
                                    ) : null}
                                    {shouldShowQuestionDetails && hasVisibleMarks(question.marks) ? (
                                      <span className="question-bank-badge soft">
                                        {question.marks} mark{question.marks === '1' ? '' : 's'}
                                      </span>
                                    ) : null}
                                    {status === 'Approved' && question.questionBankSentAt && shouldShowStatusBadge ? (
                                      <span className="question-bank-badge blue">
                                        <Send size={13} strokeWidth={2.2} />
                                        Sent to Question Bank
                                      </span>
                                    ) : null}
                                    {shouldShowQuestionDetails && optionalTagGroups.length ? (
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
                                <div className="question-bank-created-question">
                                  <strong className="question-bank-created-question-prefix">Q{index + 1}.</strong>
                                  {getRichTextPreview(question.questionText) ? (
                                    <div
                                      className="question-bank-created-question-body"
                                      dangerouslySetInnerHTML={{ __html: question.questionText }}
                                    />
                                  ) : (
                                    <strong className="question-bank-created-question-body">
                                      {question.title || 'Untitled question'}
                                    </strong>
                                  )}
                                </div>
                                {curriculumMeta.length ? (
                                  <span className="question-bank-created-curriculum" title={curriculumMeta.join(' / ')}>
                                    {curriculumMeta.map((item) => (
                                      <span key={item}>{item}</span>
                                    ))}
                                  </span>
                                ) : null}
                                {shouldShowQuestionDetails ? (
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
                                    {status === 'Approval Rejected' && question.approvalReviewRemarks ? (
                                      <span className="question-bank-created-answer is-rejected-remark">
                                        <b>Reviewer Remarks</b>
                                        {question.approvalReviewRemarks}
                                      </span>
                                    ) : null}
                                  </>
                                ) : null}
                              </span>
                            </div>

                            {canStartCardEdit || !isLockedApprovalCard ? (
                              <span className="question-bank-created-card-actions">
                                {canStartCardEdit ? (
                                  <button
                                    type="button"
                                    className="question-bank-icon-btn"
                                    onClick={() => openEditQuestionFlow(question.id)}
                                    aria-label="Edit question"
                                    title="Edit question"
                                  >
                                    <FilePenLine size={14} strokeWidth={2} />
                                  </button>
                                ) : null}
                                {!isLockedApprovalCard ? (
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
                                ) : null}
                              </span>
                            ) : null}
                          </article>
                        )
                      })}
                    </div>
                  </section>
                ) : null}

                {['created', 'draft', 'sent', 'approved', 'rejected'].includes(activeQuestionTab) && !activeQuestionCards.length ? (
                  <div className="question-bank-empty-state question-bank-tab-empty-state">
                    <FilePenLine size={24} strokeWidth={2} />
                    <strong>
                      {activeQuestionTab === 'draft'
                        ? 'No draft questions yet'
                        : activeQuestionTab === 'sent'
                          ? 'No questions sent to approval yet'
                          : activeQuestionTab === 'approved'
                            ? 'No approved questions yet'
                            : activeQuestionTab === 'rejected'
                              ? 'No rejected questions yet'
                          : 'No created questions yet'}
                    </strong>
                    <p>
                      {activeQuestionTab === 'draft'
                        ? 'Save a question as draft to see it here.'
                        : activeQuestionTab === 'sent'
                          ? 'Send created questions for approval to see them here.'
                          : activeQuestionTab === 'approved'
                            ? 'Approved questions will appear here after review.'
                            : activeQuestionTab === 'rejected'
                              ? 'Rejected questions will appear here for correction.'
                        : 'Create a question to see it here.'}
                    </p>
                  </div>
                ) : null}

              </div>
            </div>
          ) : (
            null
          )}
        </main>
      </div>

      {selectedQuestion && activeQuestionTab === 'create' ? (
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

      {isApprovalModalOpen && typeof document !== 'undefined' ? createPortal((
        <div className="question-bank-approval-modal" role="dialog" aria-modal="true" aria-labelledby="question-bank-approval-title">
          <button
            type="button"
            className="question-bank-approval-modal-backdrop"
            onClick={() => setIsApprovalModalOpen(false)}
            aria-label="Close send to approval"
          />
          <div className="question-bank-approval-modal-card">
            <div className="question-bank-approval-modal-head">
              <div>
                <h2 id="question-bank-approval-title">Send to Approval</h2>
                <p>{approvalSelectedIds.length} selected question{approvalSelectedIds.length === 1 ? '' : 's'} will be sent for review</p>
              </div>
              <button
                type="button"
                className="question-bank-icon-btn"
                onClick={() => setIsApprovalModalOpen(false)}
                aria-label="Close send to approval"
              >
                <X size={17} strokeWidth={2.2} />
              </button>
            </div>

            <div className="question-bank-approval-modal-body">
              <label className="question-bank-approval-modal-field">
                <span>Faculty Name</span>
                <div>
                  <Contact size={16} strokeWidth={2.2} />
                  <select
                    value={selectedApprovalReviewerIndex}
                    onChange={(event) => setSelectedApprovalReviewerIndex(Number(event.target.value))}
                  >
                    {APPROVAL_REVIEWERS.map((reviewer, index) => (
                      <option key={reviewer.employeeId} value={index}>{reviewer.facultyName}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} strokeWidth={2.2} />
                </div>
              </label>

              <label className="question-bank-approval-modal-field">
                <span>Employee ID</span>
                <div>
                  <IdCard size={16} strokeWidth={2.2} />
                  <select
                    value={selectedApprovalReviewerIndex}
                    onChange={(event) => setSelectedApprovalReviewerIndex(Number(event.target.value))}
                  >
                    {APPROVAL_REVIEWERS.map((reviewer, index) => (
                      <option key={reviewer.employeeId} value={index}>{reviewer.employeeId}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} strokeWidth={2.2} />
                </div>
              </label>

              <label className="question-bank-approval-modal-field">
                <span>Designation</span>
                <div>
                  <BriefcaseBusiness size={16} strokeWidth={2.2} />
                  <select
                    value={selectedApprovalReviewerIndex}
                    onChange={(event) => setSelectedApprovalReviewerIndex(Number(event.target.value))}
                  >
                    {APPROVAL_REVIEWERS.map((reviewer, index) => (
                      <option key={reviewer.employeeId} value={index}>{reviewer.designation}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} strokeWidth={2.2} />
                </div>
              </label>

              <label className="question-bank-approval-modal-note">
                <span>Note</span>
                <textarea
                  value={approvalNote}
                  onChange={(event) => setApprovalNote(event.target.value)}
                  placeholder="Add approval note"
                />
              </label>
            </div>

            <div className="question-bank-approval-modal-actions">
              <button type="button" className="question-bank-secondary-btn" onClick={() => setIsApprovalModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="question-bank-primary-btn" onClick={confirmSendSelectedQuestionsToApproval}>
                <Send size={15} strokeWidth={2.2} />
                Send
              </button>
            </div>
          </div>
        </div>
      ), document.body) : null}

      {pendingEditQuestion && typeof document !== 'undefined' ? createPortal((
        <div className="question-bank-approval-modal question-bank-edit-modal" role="dialog" aria-modal="true" aria-labelledby="question-bank-edit-title">
          <button
            type="button"
            className="question-bank-approval-modal-backdrop"
            onClick={cancelEditQuestionFlow}
            aria-label="Close edit question"
          />
          <div className="question-bank-approval-modal-card">
            <div className="question-bank-approval-modal-head">
              <div>
                <h2 id="question-bank-edit-title">Edit Question</h2>
              </div>
              <button
                type="button"
                className="question-bank-icon-btn"
                onClick={cancelEditQuestionFlow}
                aria-label="Close edit question"
              >
                <X size={17} strokeWidth={2.2} />
              </button>
            </div>

            <div className="question-bank-edit-modal-body">
              <p className="question-bank-edit-instruction">
                This question will open in the Create Question tab with all saved details. Review the content, make the required changes, then update and send it for approval again.
              </p>
            </div>

            <div className="question-bank-approval-modal-actions">
              <button type="button" className="question-bank-secondary-btn" onClick={cancelEditQuestionFlow}>
                Cancel
              </button>
              <button type="button" className="question-bank-primary-btn" onClick={() => startEditQuestionFlow()}>
                <FilePenLine size={15} strokeWidth={2.2} />
                Start to Edit
              </button>
            </div>
          </div>
        </div>
      ), document.body) : null}

    </section>
  )
}
