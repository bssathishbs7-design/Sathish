import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { sanitizeRichHtml } from '../utils/sanitizeHtml'
import {
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  CornerUpLeft,
  Contact,
  Eye,
  FilePenLine,
  IdCard,
  Download,
  FolderTree,
  ImagePlus,
  Info,
  BriefcaseBusiness,
  ListChecks,
  LoaderCircle,
  Save,
  Send,
  Plus,
  Search,
  Sigma,
  Sparkles,
  Stethoscope,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
import RichMathEditor from '../components/RichMathEditor'
import GenerationProcessorCard from '../components/GenerationProcessorCard'
import { isQuestionGenerationErrorText, stripHtml } from '../utils/mathText'
import { assignInstituteQuestionBankIds } from '../utils/questionBankIdentity'
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
import {
  questionBankCurriculumDirectory,
  questionBankSubjectDirectory,
  questionBankYearOptions,
} from './corelationRatingData'
import '../styles/question-bank.css'

const COGNITIVE_LEVEL_OPTIONS = ['Apply', 'Remember', 'Understand', 'Analyze', 'Evaluate']
const THINKING_LEVEL_OPTIONS = ['HoT', 'LoT']
const DIFFICULTY_LEVEL_OPTIONS = ['L1', 'L2', 'L3', 'L4', 'L5']
const YEAR_OPTIONS = questionBankYearOptions
const SUBJECT_DIRECTORY = questionBankSubjectDirectory
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
const CREATE_DESCRIPTIVE_QUESTION_TYPES = DESCRIPTIVE_QUESTION_TYPES.filter((item) => item.shortLabel !== 'MEQs')
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
const MAX_QUESTION_IMAGES = 4
const DEFAULT_OPTIONAL_TAG = 'Not Applicable'
const ROMAN_NUMERALS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']

const CURRICULUM_DIRECTORY = questionBankCurriculumDirectory

const QUESTION_TYPE_CARDS = [
  { type: 'MCQ', shortLabel: 'MCQ', icon: ListChecks },
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
const QUESTION_BANK_UPLOADED_KEY = 'vx-question-bank-uploaded-questions'
const QUESTION_BANK_REPORTED_KEY = 'vx-question-bank-reported-questions'
const QUESTION_BANK_CREATED_REPORTED_KEY = 'vx-question-bank-created-reported-questions'
const QUESTION_BANK_CREATED_DATA_CLEANUP_KEY = 'vx-question-bank-created-data-cleaned'
const QUESTION_BANK_EDIT_HANDOFF_KEY = 'vx-question-bank-edit-handoff'

let questionSequence = 1
let optionSequence = 1
let imageSequence = 1

const createOption = (label = '') => createAuthoringOption({ idPrefix: 'option', label })

const createDescriptiveInsideQuestion = (source = {}) => createAuthoringDescriptiveInsideQuestion({
  idPrefix: 'descriptive-inside',
  source,
})

const createDescriptiveSubQuestion = (source = {}) => createAuthoringDescriptiveSubQuestion({
  idPrefix: 'descriptive-sub',
  optionIdPrefix: 'option',
  source,
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

const createQuestion = (type = 'MCQ', config = {}) => {
  const sequence = questionSequence++
  return createAuthoringQuestion({
    idPrefix: 'question',
    optionIdPrefix: 'option',
    type,
    title: config.title ?? `Question ${sequence}`,
    config,
    defaultOptionalTag: DEFAULT_OPTIONAL_TAG,
    includeQuestionBankFields: true,
  })
}

const readStoredQuestionBankQuestions = () => {
  if (typeof window === 'undefined') return []

  try {
    if (!window.localStorage.getItem(QUESTION_BANK_CREATED_DATA_CLEANUP_KEY)) {
      const existingQuestions = JSON.parse(window.localStorage.getItem(QUESTION_BANK_STORAGE_KEY) ?? '[]')
      const preservedQuestions = Array.isArray(existingQuestions)
        ? existingQuestions.filter((question) => (
          question?.status === 'Approved'
          || Boolean(question?.questionBankSentAt)
          || question?.questionBankStatus === 'Sent to Question Bank'
        )).map(normalizeQuestionForAuthoring)
        : []
      window.localStorage.setItem(QUESTION_BANK_STORAGE_KEY, JSON.stringify(preservedQuestions))
      window.localStorage.setItem(QUESTION_BANK_CREATED_DATA_CLEANUP_KEY, 'true')
      return preservedQuestions
    }

    const parsed = JSON.parse(window.localStorage.getItem(QUESTION_BANK_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.map(normalizeQuestionForAuthoring) : []
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

const readUploadedQuestionBankQuestions = () => {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUESTION_BANK_UPLOADED_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const readExcelUploadedQuestionBankQuestions = () => (
  readUploadedQuestionBankQuestions().filter((question) => (
    question?.source === 'Excel Upload'
    || Boolean(question?.uploadBatchId)
  ))
)

const isExcelUploadedQuestion = (question) => (
  question?.source === 'Excel Upload'
  || Boolean(question?.uploadBatchId)
)

const getThinkingLevelLabel = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'hot') return 'HoT'
  if (normalized === 'lot') return 'LoT'
  return value
}

const getCreatedQuestionDisplayId = (index) => `INSC-B01-${String(index + 1).padStart(3, '0')}`

const readReportedQuestionRecords = () => {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUESTION_BANK_CREATED_REPORTED_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeCreatedReportedQuestionRecords = (records) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(QUESTION_BANK_CREATED_REPORTED_KEY, JSON.stringify(records))
  window.dispatchEvent(new Event('question-bank-created-reported-questions'))
}

const replaceQuestionInStorage = (question) => {
  if (typeof window === 'undefined' || !question?.id) return

  ;[QUESTION_BANK_STORAGE_KEY, QUESTION_BANK_PUBLISHED_KEY, QUESTION_BANK_UPLOADED_KEY].forEach((storageKey) => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
      if (!Array.isArray(parsed)) return
      if (!parsed.some((item) => item?.id === question.id)) return

      window.localStorage.setItem(storageKey, JSON.stringify(parsed.map((item) => (
        item?.id === question.id ? { ...item, ...question } : item
      ))))
    } catch {
      // Keep the edit flow responsive if one storage bucket is malformed.
    }
  })

  window.dispatchEvent(new Event('question-bank-published-questions'))
  window.dispatchEvent(new Event('question-bank-uploaded-questions'))
}

const deleteQuestionFromStorage = (questionId) => {
  if (typeof window === 'undefined' || !questionId) return

  ;[QUESTION_BANK_STORAGE_KEY, QUESTION_BANK_PUBLISHED_KEY, QUESTION_BANK_UPLOADED_KEY].forEach((storageKey) => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
      if (!Array.isArray(parsed)) return
      const nextQuestions = parsed.filter((question) => question?.id !== questionId)
      if (nextQuestions.length === parsed.length) return
      window.localStorage.setItem(storageKey, JSON.stringify(nextQuestions))
    } catch {
      // Ignore malformed storage and continue deleting from any valid bucket.
    }
  })

  window.dispatchEvent(new Event('question-bank-published-questions'))
  window.dispatchEvent(new Event('question-bank-uploaded-questions'))
}

const cloneQuestionForCreate = (question, mode) => {
  const questionId = mode === 'duplicate'
    ? `question-${Date.now()}-${questionSequence++}`
    : question.id
  const optionIdMap = new Map()
  const clonedOptions = (question.options ?? []).map((option, optionIndex) => {
    const nextOptionId = mode === 'duplicate' ? `option-${Date.now()}-${optionIndex}-${optionSequence++}` : option.id
    optionIdMap.set(option.id, nextOptionId)
    return {
      ...option,
      id: nextOptionId,
    }
  })

  return {
    ...question,
    id: questionId,
    title: question.title || getQuestionPreview(question).slice(0, 60),
    options: clonedOptions,
    correctOptionIds: mode === 'duplicate'
      ? (question.correctOptionIds ?? []).map((optionId) => optionIdMap.get(optionId) ?? optionId)
      : question.correctOptionIds ?? [],
    status: 'Editing',
    revisionStatus: mode === 'duplicate' ? 'Created' : 'Edited',
    questionBankEditMode: mode,
    sourceQuestionId: question.id,
    questionBankStatus: undefined,
    questionBankSentAt: undefined,
    approvalReviewRemarks: '',
    approvalReviewedAt: '',
    isReported: false,
    reported: false,
    reportStatus: undefined,
    reportedAt: undefined,
  }
}

const getQuestionTypeMeta = (type) => (
  QUESTION_TYPE_CARDS.find((item) => item.type === type)
  ?? DESCRIPTIVE_QUESTION_TYPES.find((item) => item.type === type)
  ?? (type === 'Descriptive Question' ? { type, shortLabel: 'SAQs', menuLabel: 'Descriptive SAQs', icon: FilePenLine } : QUESTION_TYPE_CARDS[0])
)

const getDescriptiveOutputType = (question, builderMode) => (
  getQuestionTypeMeta(question?.type).shortLabel === 'LAQs' && builderMode === 'SAQs'
    ? 'Desc Short Answer Questions (SAQs)'
    : question?.type
)

const isSaqDescriptiveOutput = (question) => (
  getQuestionTypeMeta(question?.type).shortLabel === 'SAQs'
  || question?.descriptiveBuilderMode === 'SAQs'
  || typeof question?.clinicalVignetteEnabled === 'boolean'
)

const isSaqSingleQuestionOutput = (question) => (
  isSaqDescriptiveOutput(question) && question?.clinicalVignetteEnabled !== true
)

const getRichTextPreview = (value) => stripHtml(value)

const getQuestionPreview = (question) => getRichTextPreview(question.questionText) || question.title || 'Untitled question'

const asArray = (value) => (Array.isArray(value) ? value : [])

const normalizeQuestionForAuthoring = (question = {}) => ({
  ...question,
  type: question.type ?? 'MCQ',
  questionText: question.questionText ?? '',
  answerKey: question.answerKey ?? '',
  year: question.year ?? '',
  subject: question.subject ?? '',
  topics: asArray(question.topics),
  competencies: asArray(question.competencies),
  images: asArray(question.images),
  options: asArray(question.options),
  correctOptionIds: asArray(question.correctOptionIds),
  fillBlankAnswers: asArray(question.fillBlankAnswers).length ? asArray(question.fillBlankAnswers) : [''],
  descriptiveSections: asArray(question.descriptiveSections),
  organSubSystems: asArray(question.organSubSystems).length ? asArray(question.organSubSystems) : [DEFAULT_OPTIONAL_TAG],
  diseaseTags: asArray(question.diseaseTags).length ? asArray(question.diseaseTags) : [DEFAULT_OPTIONAL_TAG],
  keyConcepts: asArray(question.keyConcepts).length ? asArray(question.keyConcepts) : [DEFAULT_OPTIONAL_TAG],
  allowMultiple: Boolean(question.allowMultiple),
  marks: question.marks ?? '0',
  status: question.status ?? 'Editing',
})

const getQuestionAuthorName = (question) => (
  question?.authorName
  ?? question?.createdByName
  ?? question?.senderName
  ?? 'Karthik Subramanian'
)

const createHtmlBlock = (value) => `<div>${String(value ?? '')}</div>`

const EXCEL_UPLOAD_TYPE_CONFIG = {
  MCQ: {
    label: 'MCQ',
    type: 'MCQ',
    columns: ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'answer_explanation', 'marks'],
    sample: ['Which plane divides the body into superior and inferior parts?', 'Transverse plane', 'Sagittal plane', 'Coronal plane', 'Median plane', 'A', 'The transverse plane divides the body into superior and inferior parts.', '1'],
  },
  LAQs: {
    label: 'LAQs',
    type: 'Desc Long Answer Questions (LAQs)',
    columns: ['question_type', 'question_text', 'answer_key', 'marks', 'year', 'subject', 'topic', 'competency', 'question_category', 'cognitive_level', 'thinking_level', 'difficulty_level'],
    sample: ['LAQs', 'Describe the boundaries and clinical importance of the anatomical snuffbox.', 'Include boundaries, contents, clinical relevance, and scaphoid fracture correlation.', '10', 'Year 1', 'Human Anatomy', 'Upper Limb', 'AN1.5 Describe muscles and movements of upper limb', 'Application', 'Analyze', 'HoT', 'L3'],
  },
  SAQs: {
    label: 'SAQs',
    type: 'Desc Short Answer Questions (SAQs)',
    columns: ['question_type', 'question_text', 'answer_key', 'marks', 'year', 'subject', 'topic', 'competency', 'question_category', 'cognitive_level', 'thinking_level', 'difficulty_level'],
    sample: ['SAQs', 'Define anatomical position and mention two key features.', 'Standing erect, facing forward, upper limbs by side, palms forward.', '2', 'Year 1', 'Human Anatomy', 'General Anatomy', 'AN1.1 Describe anatomical position and planes', 'Direct', 'Remember', 'LoT', 'L1'],
  },
  MEQs: {
    label: 'MEQs',
    type: 'Desc Modified Essay Questions (MEQs)',
    columns: ['question_type', 'question_text', 'answer_key', 'marks', 'year', 'subject', 'topic', 'competency', 'question_category', 'cognitive_level', 'thinking_level', 'difficulty_level', 'sub_question_1', 'sub_answer_1', 'sub_marks_1', 'sub_question_2', 'sub_answer_2', 'sub_marks_2'],
    sample: ['MEQs', 'A patient has shoulder weakness after surgical neck fracture. Analyze the anatomical basis.', 'Discuss axillary nerve relation, deltoid involvement, sensory loss, and clinical findings.', '6', 'Year 1', 'Human Anatomy', 'Upper Limb', 'AN1.5 Describe muscles and movements of upper limb', 'Reasoning', 'Analyze', 'HoT', 'L3', 'Name the nerve at risk.', 'Axillary nerve.', '2', 'Mention one motor deficit.', 'Weak shoulder abduction due to deltoid involvement.', '2'],
  },
}

const EXCEL_UPLOAD_REQUIRED_COLUMNS = {
  MCQ: ['question_text'],
  LAQs: ['question_text', 'answer_key', 'marks', 'year', 'subject', 'topic', 'competency', 'question_category', 'cognitive_level', 'thinking_level', 'difficulty_level'],
  SAQs: ['question_text', 'answer_key', 'marks', 'year', 'subject', 'topic', 'competency', 'question_category', 'cognitive_level', 'thinking_level', 'difficulty_level'],
  MEQs: ['question_text', 'answer_key', 'marks', 'year', 'subject', 'topic', 'competency', 'question_category', 'cognitive_level', 'thinking_level', 'difficulty_level'],
}

const EXCEL_UPLOAD_ANALYZE_SECONDS = 20
const normalizeUploadHeader = (value) => String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')

const escapeCsvValue = (value) => {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const parseCsvText = (text) => {
  const rows = []
  let cell = ''
  let row = []
  let isQuoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const nextChar = text[index + 1]

    if (char === '"' && isQuoted && nextChar === '"') {
      cell += '"'
      index += 1
    } else if (char === '"') {
      isQuoted = !isQuoted
    } else if (char === ',' && !isQuoted) {
      row.push(cell)
      cell = ''
    } else if ((char === '\n' || char === '\r') && !isQuoted) {
      if (char === '\r' && nextChar === '\n') index += 1
      row.push(cell)
      if (row.some((item) => String(item).trim())) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  row.push(cell)
  if (row.some((item) => String(item).trim())) rows.push(row)
  return rows
}

const getUploadTemplateCsv = (typeKey) => {
  const config = EXCEL_UPLOAD_TYPE_CONFIG[typeKey]
  if (!config) return ''
  return [
    config.columns.map(escapeCsvValue).join(','),
    config.sample.map(escapeCsvValue).join(','),
  ].join('\n')
}

const downloadCsvTemplate = (typeKey) => {
  if (typeof document === 'undefined') return
  const csv = getUploadTemplateCsv(typeKey)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${typeKey.toLowerCase()}-question-upload-template.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const getUploadQuestionTypeKey = (value, fallback = '') => {
  const normalized = String(value || fallback || '').trim().toLowerCase()
  if (normalized.includes('mcq') || normalized === 'multiple choice') return 'MCQ'
  if (normalized.includes('laq') || normalized.includes('long')) return 'LAQs'
  if (normalized.includes('meq') || normalized.includes('modified')) return 'MEQs'
  if (normalized.includes('saq') || normalized.includes('short') || normalized.includes('descriptive')) return 'SAQs'
  return ''
}

const getUploadCell = (row, key) => String(row[key] ?? '').trim()

const getUploadRowObjects = (csvText) => {
  const parsedRows = parseCsvText(csvText)
  if (!parsedRows.length) {
    return { headers: [], rows: [], errors: ['The uploaded file is empty.'] }
  }
  const headers = parsedRows[0].map(normalizeUploadHeader)
  const uniqueHeaders = new Set(headers.filter(Boolean))
  if (!uniqueHeaders.size) {
    return { headers, rows: [], errors: ['Header row is missing. Use one of the sample templates.'] }
  }

  const rows = parsedRows.slice(1).map((cells, rowIndex) => {
    const row = { __rowNumber: rowIndex + 2 }
    headers.forEach((header, cellIndex) => {
      if (header) row[header] = String(cells[cellIndex] ?? '').trim()
    })
    return row
  }).filter((row) => (
    Object.entries(row).some(([key, value]) => key !== '__rowNumber' && String(value).trim())
  ))

  return { headers, rows, errors: [] }
}

const validateExcelUploadRows = (csvText, uploadMeta = {}) => {
  const { headers, rows, errors } = getUploadRowObjects(csvText)
  if (errors.length) return { questions: [], errors, rowsCount: 0 }
  if (!rows.length) return { questions: [], errors: ['No question rows found below the header.'], rowsCount: 0 }

  const headerSet = new Set(headers)
  const batchId = `upload-${Date.now()}`
  const questions = []
  const validationErrors = []

  rows.forEach((row, rowIndex) => {
    const typeKey = getUploadQuestionTypeKey(row.question_type, uploadMeta.questionType)
    if (!typeKey || !EXCEL_UPLOAD_TYPE_CONFIG[typeKey]) {
      validationErrors.push(`Row ${row.__rowNumber}: question_type must be MCQ, LAQs, SAQs, or MEQs.`)
      return
    }

    const missingHeaders = EXCEL_UPLOAD_REQUIRED_COLUMNS[typeKey].filter((column) => !headerSet.has(column))
    if (missingHeaders.length) {
      validationErrors.push(`Row ${row.__rowNumber}: missing template columns ${missingHeaders.join(', ')}.`)
      return
    }

    const missingValues = EXCEL_UPLOAD_REQUIRED_COLUMNS[typeKey].filter((column) => {
      const mappedValue = ['year', 'subject', 'topic', 'competency'].includes(column)
        ? uploadMeta[column]
        : ''
      return !mappedValue && !getUploadCell(row, column)
    })
    if (missingValues.length) {
      validationErrors.push(`Row ${row.__rowNumber}: required values missing for ${missingValues.join(', ')}.`)
      return
    }

    const marks = getUploadCell(row, 'marks')
    const marksNumber = Number(marks)
    if ((typeKey !== 'MCQ' || marks) && (!Number.isFinite(marksNumber) || marksNumber <= 0)) {
      validationErrors.push(`Row ${row.__rowNumber}: marks must be a positive number.`)
      return
    }

    if (typeKey === 'MCQ') {
      const correctOption = getUploadCell(row, 'correct_option').toUpperCase()
      if (correctOption && !['A', 'B', 'C', 'D'].includes(correctOption)) {
        validationErrors.push(`Row ${row.__rowNumber}: correct_option must be A, B, C, or D.`)
        return
      }
    }

    questions.push(buildExcelUploadQuestion(row, typeKey, batchId, row.__rowNumber, rowIndex, uploadMeta))
  })

  return {
    questions,
    errors: validationErrors,
    rowsCount: rows.length,
  }
}

const formatUploadWizardTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.ceil(Number(seconds) || 0))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60
  if (!minutes) return `${remainingSeconds}s`
  return `${minutes}m ${String(remainingSeconds).padStart(2, '0')}s`
}

const getUploadErrorRows = (errors = []) => (
  errors.map((error, index) => {
    const text = String(error)
    const rowMatch = text.match(/^Row\s+(\d+):\s*(.*)$/i)
    const issueText = rowMatch ? rowMatch[2] : text
    const fieldMatch = issueText.match(/^(.*?)(?:\s+must\s+|\s+missing\s+|\s+is\s+|$)/i)
    return {
      id: `${index}-${text}`,
      row: rowMatch ? rowMatch[1] : '-',
      field: fieldMatch?.[1]?.replace(/[:.]+$/, '').trim() || 'File',
      message: issueText,
    }
  })
)

const buildExcelUploadQuestion = (row, typeKey, batchId, rowNumber, questionIndex, uploadMeta = {}) => {
  const config = EXCEL_UPLOAD_TYPE_CONFIG[typeKey]
  const uploadYear = uploadMeta.year || getUploadCell(row, 'year')
  const uploadSubject = uploadMeta.subject || getUploadCell(row, 'subject')
  const uploadTopic = uploadMeta.topic || getUploadCell(row, 'topic')
  const uploadCompetency = uploadMeta.competency || getUploadCell(row, 'competency')
  const question = createQuestion(config.type, {
    title: `${config.label} Upload ${questionIndex + 1}`,
  })
  const autoFilledCurriculum = getAutoFilledCurriculum({
    ...question,
    year: uploadYear,
    subject: uploadSubject,
    topics: [uploadTopic].filter(Boolean),
    competencies: [uploadCompetency].filter(Boolean),
  })
  const optionalTags = getGeneratedOptionalTags(config.type)
  const marks = getUploadCell(row, 'marks') || (typeKey === 'MCQ' ? '1' : '')
  const correctOption = getUploadCell(row, 'correct_option').toUpperCase()
  const answerExplanation = getUploadCell(row, 'answer_explanation')
  const baseQuestion = {
    ...question,
    questionText: createHtmlBlock(getUploadCell(row, 'question_text')),
    answerKey: createHtmlBlock(typeKey === 'MCQ'
      ? answerExplanation || (correctOption ? `Correct option: ${correctOption}.` : '')
      : getUploadCell(row, 'answer_key')),
    year: autoFilledCurriculum.year || uploadYear,
    subject: autoFilledCurriculum.subject || uploadSubject,
    topics: autoFilledCurriculum.topics?.length ? autoFilledCurriculum.topics : [uploadTopic].filter(Boolean),
    competencies: autoFilledCurriculum.competencies?.length ? autoFilledCurriculum.competencies : [uploadCompetency].filter(Boolean),
    questionCategory: getUploadCell(row, 'question_category') || (typeKey === 'MCQ' ? 'Direct' : ''),
    cognitiveLevel: getUploadCell(row, 'cognitive_level') || (typeKey === 'MCQ' ? 'Recall' : ''),
    thinkingLevel: getUploadCell(row, 'thinking_level') || (typeKey === 'MCQ' ? 'LoT' : ''),
    difficultyLevel: getUploadCell(row, 'difficulty_level') || (typeKey === 'MCQ' ? 'L1' : ''),
    cognitiveFunction: optionalTags.cognitiveFunction,
    skillFocus: optionalTags.skillFocus,
    organSystem: optionalTags.organSystem,
    organSubSystems: optionalTags.organSubSystems,
    diseaseTags: optionalTags.diseaseTags,
    keyConcepts: optionalTags.keyConcepts,
    marks,
    status: 'Created',
    revisionStatus: 'Created',
    source: 'Excel Upload',
    authorName: getUploadCell(row, 'author_by') || 'Institute/College',
    createdByName: getUploadCell(row, 'author_by') || 'Institute/College',
    uploadedByName: getUploadCell(row, 'uploaded_by'),
    uploadedAt: new Date().toISOString(),
    uploadBatchId: batchId,
    uploadRowNumber: rowNumber,
  }

  if (typeKey === 'MCQ') {
    const optionValues = ['option_a', 'option_b', 'option_c', 'option_d'].map((key) => getUploadCell(row, key))
    const hasCompleteOptionSet = optionValues.every(Boolean)
    const options = hasCompleteOptionSet
      ? optionValues.map((value, optionIndex) => ({
        id: `${baseQuestion.id}-option-${optionIndex + 1}`,
        label: value,
        distractorErrors: getGeneratedDistractorErrors(optionIndex),
      }))
      : []
    const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctOption)
    return {
      ...baseQuestion,
      options,
      correctOptionIds: hasCompleteOptionSet && correctIndex >= 0 ? [options[correctIndex].id] : [],
    }
  }

  const descriptiveSections = typeKey === 'MEQs'
    ? [1, 2, 3, 4, 5].map((index) => {
      const questionText = getUploadCell(row, `sub_question_${index}`)
      if (!questionText) return null
      return {
        id: `${baseQuestion.id}-section-${index}`,
        type: 'text',
        questionText: createHtmlBlock(questionText),
        marks: getUploadCell(row, `sub_marks_${index}`) || '0',
        answerKey: createHtmlBlock(getUploadCell(row, `sub_answer_${index}`)),
        children: [],
      }
    }).filter(Boolean)
    : []

  return {
    ...baseQuestion,
    options: [],
    correctOptionIds: [],
    descriptiveSections,
  }
}

const getGeneratedOptionalTags = (type) => {
  if (isDescriptiveQuestionType(type)) {
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
  const topic = asArray(question.topics)[0] ?? 'the selected topic'
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

  if (isDescriptiveQuestionType(type)) {
    return {
      ...optionalTags,
      questionText: createHtmlBlock(`Explain the clinical relevance of ${topic} in ${subject}, including key anatomical or functional relationships.`),
      answerKey: createHtmlBlock('The answer should include the core concept, relevant relationships, clinical significance, and a concise conclusion.'),
      questionCategory: 'Critical Thinking',
      cognitiveLevel: 'Analyze',
      thinkingLevel: 'HoT',
      difficultyLevel: 'L3',
      marks: '2',
      descriptiveGuide: createHtmlBlock('Look for accurate concepts, structured explanation, correct terminology, and clinical correlation.'),
    }
  }

  return {
    ...optionalTags,
    questionText: createHtmlBlock(`Which of the following best explains the application of ${topic} in ${subject}?`),
    answerKey: createHtmlBlock('Add the correct option and explanation.'),
    questionCategory: 'Application',
    cognitiveLevel: 'Apply',
    thinkingLevel: 'HoT',
    difficultyLevel: 'L2',
  }
}

const getGeneratedDistractorErrors = (optionIndex) => {
  if (optionIndex === 0) return []
  if (optionIndex === 1) return ['Factual Recall Error']
  if (optionIndex === 2) return ['Superficial Match']
  if (optionIndex === 3) return ['Mechanism Confusion']
  return ['Misinterpretation']
}

const getSubjectsForYear = (year) => Object.keys(CURRICULUM_DIRECTORY[year] ?? SUBJECT_DIRECTORY)

const getYearForSubject = (subject) => (
  YEAR_OPTIONS.find((year) => getSubjectsForYear(year).includes(subject)) || YEAR_OPTIONS[0]
)

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
  const topics = asArray(question.topics)
  if (!topics.length) return directory.competencies
  return directory.competencies.filter((item) => topics.includes(item.topic))
}

const hasCurriculumMapping = (question) => (
  Boolean(question?.year)
  && Boolean(question?.subject)
  && asArray(question?.topics).length > 0
  && asArray(question?.competencies).length > 0
)

const hasQuestionContent = (question) => {
  const preview = getRichTextPreview(question?.questionText)
  return Boolean(preview) && !isQuestionGenerationErrorText(preview)
}

const hasMcqOptions = (question) => (
  question?.type !== 'MCQ'
  || (
    asArray(question?.options).filter((option) => Boolean(getRichTextPreview(option.label))).length >= (question?.allowMultiple ? MULTIPLE_OPTION_MIN_COUNT : SINGLE_OPTION_MIN_COUNT)
    && asArray(question?.correctOptionIds).length > 0
  )
)

const hasVisibleMarks = (marks) => Number(marks) > 0

const parseMarksValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getDescriptiveQuestionMarksTotal = (question) => {
  const sections = question?.descriptiveSections ?? []
  const rootMarks = sections.length ? 0 : parseMarksValue(question?.marks)
  const sectionMarks = sections.reduce((total, section) => {
    const children = Array.isArray(section.children) ? section.children : []
    const childMarks = children.reduce((sum, child) => sum + parseMarksValue(child.marks), 0)
    const ownMarks = children.length ? 0 : parseMarksValue(section.marks)
    return total + ownMarks + childMarks
  }, 0)

  return rootMarks + sectionMarks
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

const getQuestionMarksLabel = (question) => {
  if (isDescriptiveQuestionType(question?.type)) {
    const descriptiveTotal = getDescriptiveQuestionMarksTotal(question)
    return descriptiveTotal > 0 ? String(descriptiveTotal) : ''
  }
  if (hasVisibleMarks(question?.marks)) return String(question.marks)
  return question?.type === 'MCQ' ? '1' : ''
}

const getAutoGeneratedDescriptiveMarks = () => '2'
const AUTO_GENERATED_DESCRIPTIVE_ANSWER_TEXT = 'Key points with accurate terminology and a concise explanation.'

const getAutoGeneratedDescriptiveAnswer = (questionText, marks = getAutoGeneratedDescriptiveMarks()) => {
  return createHtmlBlock(AUTO_GENERATED_DESCRIPTIVE_ANSWER_TEXT)
}

const isAutoGeneratedDescriptiveAnswer = (value) => (
  getRichTextPreview(value).startsWith('Expected answer for ')
  || getRichTextPreview(value) === AUTO_GENERATED_DESCRIPTIVE_ANSWER_TEXT
)

const getModelAnswerPreview = (value) => {
  const preview = getRichTextPreview(value)
  if (!preview) return ''
  return isAutoGeneratedDescriptiveAnswer(value) ? AUTO_GENERATED_DESCRIPTIVE_ANSWER_TEXT : preview
}

const getExaminerNotesPreview = (item, fallbackItem) => {
  const savedNotes = getRichTextPreview(item?.examinerNotes) || getRichTextPreview(fallbackItem?.examinerNotes)
  if (savedNotes) return savedNotes
  return 'Award marks for the required key points, accurate terminology, and clear clinical reasoning.'
}

const getFatalFlawPreview = (item, fallbackItem) => {
  const savedFlaw = getRichTextPreview(item?.fatalFlaw) || getRichTextPreview(fallbackItem?.fatalFlaw)
  if (savedFlaw) return savedFlaw
  return 'Do not award full marks if the response misses the core concept or gives an unrelated explanation.'
}

const hasAssessmentTags = (question) => (
  (isDescriptiveQuestionType(question?.type) ? getDescriptiveQuestionMarksTotal(question) > 0 : Boolean(question?.marks))
  && Boolean(question?.questionCategory)
  && Boolean(question?.cognitiveLevel)
  && Boolean(question?.thinkingLevel)
  && Boolean(question?.difficultyLevel)
)

const hasSaqSingleQuestionAssessmentTags = (question) => (
  hasVisibleMarks(question?.marks)
  && Boolean(question?.questionCategory)
  && Boolean(question?.cognitiveLevel)
  && Boolean(question?.thinkingLevel)
  && Boolean(question?.difficultyLevel)
)

const isDefaultOptionalTagOnly = (values) => (
  !values?.length || (values.length === 1 && values[0] === DEFAULT_OPTIONAL_TAG)
)

const hasDraftContent = (question) => {
  if (!question) return false

  return Boolean(getRichTextPreview(question.questionText))
    || Boolean(getRichTextPreview(question.answerKey))
    || asArray(question.images).length > 0
    || Boolean(question.year)
    || Boolean(question.subject)
    || asArray(question.topics).length > 0
    || asArray(question.competencies).length > 0
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
    || asArray(question.options).some((option) => Boolean(getRichTextPreview(option.label)))
    || asArray(question.options).some((option) => (option.distractorErrors ?? []).length > 0)
    || asArray(question.correctOptionIds).length > 0
    || asArray(question.fillBlankAnswers).some((answer) => Boolean(getRichTextPreview(answer)))
    || Boolean(getRichTextPreview(question.descriptiveGuide))
    || (isDescriptiveQuestionType(question.type) ? getDescriptiveQuestionMarksTotal(question) > 0 : hasVisibleMarks(question.marks))
    || question.isCritical
}

const isReportedQuestion = (question) => Boolean(
  question?.isReported
  || question?.reported
  || question?.reportStatus
  || question?.reportedAt
  || (Array.isArray(question?.reports) && question.reports.length)
)

const getAutoFilledCurriculum = (question) => {
  const year = question.year || YEAR_OPTIONS[0]
  const subject = question.subject || getSubjectsForYear(year)[0] || 'Human Anatomy'
  const topicOptions = getAvailableTopics({ ...question, year, subject })
  const topics = asArray(question.topics).length ? question.topics : topicOptions.slice(0, 1)
  const competencyOptions = getAvailableCompetencies({ ...question, year, subject, topics })
  const competencies = asArray(question.competencies).length
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
  if (isDescriptiveQuestionType(question.type)) return isDescriptiveQuestionComplete(question)
  return hasQuestionContent(question)
}

const getLaqLeafSections = (question) => (
  (question?.descriptiveSections ?? []).filter((section) => !(section.children ?? []).length)
)

const hasLaqSubQuestions = (question) => (
  getLaqLeafSections(question).some((section) => Boolean(getRichTextPreview(section.questionText)))
)

const hasLaqMarkDistribution = (question) => {
  const sections = getLaqLeafSections(question)
  return sections.length > 0 && sections.every((section) => hasVisibleMarks(section.marks))
}

const hasLaqAssessmentTags = (question) => {
  const sections = getLaqLeafSections(question)
  return sections.length > 0 && sections.every((section) => (
    Boolean(section.questionCategory)
    && Boolean(section.cognitiveLevel)
    && Boolean(section.thinkingLevel)
    && Boolean(section.difficultyLevel)
    && Boolean(section.competencies?.length)
  ))
}

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

const getCreatedSubQuestionOptionalTagGroups = (item, fallback = {}) => [
  { label: 'Cognitive', values: [item?.cognitiveLevel || fallback?.cognitiveLevel].filter(Boolean) },
  { label: 'Function', values: [item?.cognitiveFunction || fallback?.cognitiveFunction].filter(Boolean) },
  { label: 'Skill Focus', values: [item?.skillFocus || fallback?.skillFocus].filter(Boolean) },
  { label: 'Organ', values: [item?.organSystem || fallback?.organSystem].filter(Boolean) },
  { label: 'Sub-System', values: item?.organSubSystems ?? fallback?.organSubSystems ?? [] },
  { label: 'Disease', values: item?.diseaseTags ?? fallback?.diseaseTags ?? [] },
  { label: 'Concept', values: item?.keyConcepts ?? fallback?.keyConcepts ?? [] },
].map((group) => ({
  ...group,
  values: group.values
    .filter((value) => value && value !== 'Not Applicable')
    .slice(0, group.label === 'Concept' ? 1 : group.values.length),
})).filter((group) => group.values.length)

const getDescriptiveLeafSections = (question) => {
  const sections = Array.isArray(question?.descriptiveSections) ? question.descriptiveSections : []
  return sections.flatMap((section) => {
    const children = Array.isArray(section?.children) ? section.children : []
    return children.length ? children : [section]
  }).filter((section) => (
    Boolean(getRichTextPreview(section?.questionText))
    || asArray(section?.competencies).length > 0
  ))
}

const getCreatedQuestionPrimaryKpiSource = (question) => (
  getDescriptiveLeafSections(question)[0] ?? question ?? {}
)

const getCreatedQuestionKpiValue = (question, fieldName) => {
  const primarySource = getCreatedQuestionPrimaryKpiSource(question)
  return question?.[fieldName] || primarySource?.[fieldName] || ''
}

const getCreatedQuestionPrimaryCompetencyDisplay = (question) => (
  getDescriptiveCompetencyDisplay(
    getCreatedQuestionPrimaryKpiSource(question),
    question,
  )
)

const getOptionValue = (item) => (typeof item === 'string' ? item : item.value)
const getOptionLabel = (item) => (typeof item === 'string' ? item : item.value)
const getYearDisplayLabel = (year) => ({
  'Year 1': '1st Year',
  'Year 2': '2nd Year',
  'Year 3': '3rd Year',
  'Year 4': '4th Year',
  'First Year': '1st Year',
  'Second Year': '2nd Year',
  'Third Year': '3rd Year',
  'Fourth Year': '4th Year',
}[year] ?? year)

const getSelectionSummary = (selected, emptyLabel, formatter = (value) => value) => {
  if (!selected.length) return emptyLabel
  const visible = selected.slice(0, 2).map(formatter).join(', ')
  const remaining = selected.length - 2
  return remaining > 0 ? `${visible} +${remaining} more` : visible
}

const getDescriptiveCompetencyCode = (item) => (
  (item?.competencies ?? []).length ? getShortCompetencyLabel(item.competencies[0]) : ''
)

const getDescriptiveCompetencyDisplay = (item, fallbackQuestion) => {
  const competencyValue = item?.competencies?.[0] ?? ''
  if (!competencyValue) return null

  const subject = item?.subject || fallbackQuestion?.subject || 'Not selected'
  const topics = (item?.topics?.length ? item.topics : fallbackQuestion?.topics) ?? []
  const competencyRecord = getAvailableCompetencies({
    ...(fallbackQuestion ?? {}),
    year: item?.year || fallbackQuestion?.year || getYearForSubject(subject),
    subject,
    topics,
  }).find((competency) => competency.value === competencyValue)
  const topic = competencyRecord?.topic || topics[0] || 'Not selected'

  return {
    code: getShortCompetencyLabel(competencyValue),
    subject,
    topic,
    competency: competencyRecord?.label || competencyValue,
  }
}

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
  className = '',
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
    <div className={`question-bank-mapping-panel ${className}`}>
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

function QuestionBankUploadDropdown({
  label,
  placeholder,
  searchPlaceholder,
  value,
  options,
  onChange,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [menuPosition, setMenuPosition] = useState(null)
  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const normalizedOptions = options.map((option) => (
    typeof option === 'string' ? { value: option, label: option } : option
  ))
  const selectedOption = normalizedOptions.find((option) => option.value === value)
  const normalizedSearch = searchValue.trim().toLowerCase()
  const visibleOptions = normalizedSearch
    ? normalizedOptions.filter((option) => option.label.toLowerCase().includes(normalizedSearch))
    : normalizedOptions

  useEffect(() => {
    if (!isOpen) return undefined
    const closeOnOutsideClick = (event) => {
      if (
        !dropdownRef.current?.contains(event.target)
        && !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false)
        setSearchValue('')
      }
    }
    const closeOnViewportChange = () => {
      setIsOpen(false)
      setSearchValue('')
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    window.addEventListener('resize', closeOnViewportChange)
    document.addEventListener('scroll', closeOnViewportChange, true)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      window.removeEventListener('resize', closeOnViewportChange)
      document.removeEventListener('scroll', closeOnViewportChange, true)
    }
  }, [isOpen])

  const closeDropdown = () => {
    setIsOpen(false)
    setSearchValue('')
    setMenuPosition(null)
  }

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown()
      return
    }

    const triggerRect = triggerRef.current?.getBoundingClientRect()
    if (!triggerRect) return
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const availableBelow = viewportHeight - triggerRect.bottom - 12
    const availableAbove = triggerRect.top - 12
    const openBelow = availableBelow >= Math.min(230, availableAbove)
    const maxMenuHeight = Math.max(136, Math.min(260, openBelow ? availableBelow : availableAbove))
    const menuWidth = Math.min(triggerRect.width, viewportWidth - 16)

    setMenuPosition({
      top: openBelow
        ? triggerRect.bottom + 7
        : Math.max(8, triggerRect.top - maxMenuHeight - 7),
      left: Math.min(Math.max(8, triggerRect.left), viewportWidth - menuWidth - 8),
      width: menuWidth,
      optionsHeight: Math.max(70, maxMenuHeight - 67),
    })
    setIsOpen(true)
  }

  return (
    <div
      ref={dropdownRef}
      className={`question-bank-upload-select ${isOpen && !disabled ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`}
    >
      <span className="question-bank-upload-select-label">
        {label} <b aria-hidden="true">*</b>
      </span>
      <button
        ref={triggerRef}
        type="button"
        className="question-bank-upload-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen && !disabled}
        disabled={disabled}
        onClick={toggleDropdown}
      >
        <span className={selectedOption ? '' : 'is-placeholder'}>{selectedOption?.label || placeholder}</span>
        <ChevronDown size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>

      {isOpen && !disabled && menuPosition && typeof document !== 'undefined' ? createPortal(
        <div
          ref={menuRef}
          className="question-bank-upload-select-menu"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
          }}
        >
          <label className="question-bank-upload-select-search">
            <Search size={17} strokeWidth={2} aria-hidden="true" />
            <input
              autoFocus
              value={searchValue}
              placeholder={searchPlaceholder}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') closeDropdown()
              }}
            />
          </label>
          <div
            className="question-bank-upload-select-options"
            role="listbox"
            aria-label={label}
            style={{ maxHeight: menuPosition.optionsHeight }}
          >
            {visibleOptions.length ? visibleOptions.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`question-bank-upload-select-option ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    onChange(option.value)
                    closeDropdown()
                  }}
                >
                  <span className="question-bank-upload-select-check">
                    {isSelected ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : null}
                  </span>
                  <span title={option.label}>{option.label}</span>
                </button>
              )
            }) : (
              <span className="question-bank-upload-select-empty">No matching options</span>
            )}
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  )
}

export default function QuestionBankPage({ onAlert, onSendToApproval, mode = 'editable' }) {
  const normalizedMode = mode === 'editable' ? 'editable' : 'readonly'
  const [questions, setQuestions] = useState(() => readStoredQuestionBankQuestions())
  const [selectedQuestionId, setSelectedQuestionId] = useState(null)
  const [activeMappingPicker, setActiveMappingPicker] = useState(null)
  const [mappingSearchValue, setMappingSearchValue] = useState('')
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false)
  const [generationProcessorTick, setGenerationProcessorTick] = useState(Date.now())
  const [generationProcessorStartedAt, setGenerationProcessorStartedAt] = useState({})
  const [generationProcessorCompletedIds, setGenerationProcessorCompletedIds] = useState([])
  const [generationCompleteId, setGenerationCompleteId] = useState(null)
  const [isOptionalTagsOpen, setIsOptionalTagsOpen] = useState(false)
  const [openCreatedTagsId, setOpenCreatedTagsId] = useState(null)
  const [openCreatedQuestionIds, setOpenCreatedQuestionIds] = useState([])
  const [openCreatedSubQuestionIds, setOpenCreatedSubQuestionIds] = useState({})
  const [openDistractorOptionId, setOpenDistractorOptionId] = useState(null)
  const [openDistractorMenuOptionId, setOpenDistractorMenuOptionId] = useState(null)
  const [openOptionDistractorPreviewId, setOpenOptionDistractorPreviewId] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [isCurriculumEditing, setIsCurriculumEditing] = useState(false)
  const [curriculumDraft, setCurriculumDraft] = useState(null)
  const [isDefaultCurriculumOpen, setIsDefaultCurriculumOpen] = useState(false)
  const [, setAutoOpenCurriculumQuestionId] = useState(null)
  const [activeQuestionTab, setActiveQuestionTab] = useState('create')
  const [isDescriptiveTypePickerOpen, setIsDescriptiveTypePickerOpen] = useState(false)
  const [isUploadTemplateMenuOpen, setIsUploadTemplateMenuOpen] = useState(false)
  const [isApprovalSelectMode, setIsApprovalSelectMode] = useState(false)
  const [approvalSelectedIds, setApprovalSelectedIds] = useState([])
  const [approvedQuestionBankSelectedIds, setApprovedQuestionBankSelectedIds] = useState([])
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [approvalNote, setApprovalNote] = useState('')
  const [selectedApprovalReviewerIndex, setSelectedApprovalReviewerIndex] = useState(0)
  const [pendingUploadApprovalQuestions, setPendingUploadApprovalQuestions] = useState([])
  const [pendingEditQuestionId, setPendingEditQuestionId] = useState(null)
  const [reportedQuestionRecords, setReportedQuestionRecords] = useState(() => readReportedQuestionRecords())
  const [, setUploadedQuestionCount] = useState(() => readExcelUploadedQuestionBankQuestions().filter(hasQuestionContent).length)
  const [uploadImportResult, setUploadImportResult] = useState(null)
  const [uploadWizard, setUploadWizard] = useState({
    isOpen: false,
    status: 'idle',
    fileName: '',
    questionType: 'MCQ',
    year: '',
    subject: '',
    topic: '',
    competency: '',
    generatedCount: 0,
    totalSeconds: 0,
    remainingSeconds: 0,
    startedAt: 0,
  })
  const [editableDescriptiveFieldKeys, setEditableDescriptiveFieldKeys] = useState([])
  const [activeDescriptiveAnswerTarget, setActiveDescriptiveAnswerTarget] = useState({ type: 'root' })
  const [activeDescriptiveMappingTarget, setActiveDescriptiveMappingTarget] = useState(null)
  const [descriptiveCompetencyDraft, setDescriptiveCompetencyDraft] = useState(null)
  const [activeLaqCompetencySectionId, setActiveLaqCompetencySectionId] = useState(null)
  const [activeLaqSelectKey, setActiveLaqSelectKey] = useState(null)
  const [laqCompetencySearchValue, setLaqCompetencySearchValue] = useState('')
  const [descriptiveBuilderMode, setDescriptiveBuilderMode] = useState('LAQs')
  const generationProcessorCleanupTimersRef = useRef(new Map())
  const [pendingDescriptiveBuilderMode, setPendingDescriptiveBuilderMode] = useState(null)

  function getDescriptiveTooltipPosition(anchorElement = null, hasOpenDropdown = false) {
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

  function closeDescriptiveCompetencyTooltip() {
    setActiveDescriptiveMappingTarget(null)
    setDescriptiveCompetencyDraft(null)
  }

  function closeMappingPicker() {
    setActiveMappingPicker(null)
    setMappingSearchValue('')
  }

  function renderLaqCompactSelect({ selectKey, value, placeholder, options, onChange, variant = 'simple' }) {
    const normalizedOptions = options.map((option) => (
      typeof option === 'string' ? { value: option, label: option } : option
    ))
    const selectedOption = normalizedOptions.find((option) => option.value === value)
    const isOpen = activeLaqSelectKey === selectKey

    return (
      <div
        className={`question-bank-laq-select-field question-bank-laq-select-field-custom is-${variant} ${isOpen ? 'is-open' : ''}`}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setActiveLaqSelectKey(null)
          }
        }}
      >
        <button
          type="button"
          className={`question-bank-laq-select-trigger ${selectedOption ? '' : 'is-placeholder'}`}
          onClick={() => {
            setActiveLaqCompetencySectionId(null)
            setActiveLaqSelectKey((current) => (current === selectKey ? null : selectKey))
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>{selectedOption?.label ?? placeholder}</span>
          <ChevronDown size={14} strokeWidth={2.3} />
        </button>
        {isOpen ? (
          <div className="question-bank-laq-dropdown question-bank-laq-select-menu" role="listbox">
            <div className="question-bank-laq-dropdown-list">
              {normalizedOptions.map((option) => {
                const isSelected = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`question-bank-laq-dropdown-option ${isSelected ? 'is-active' : ''}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange(option.value)
                      setActiveLaqSelectKey(null)
                    }}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {variant === 'mapping' ? (
                      <span className="question-bank-laq-dropdown-check" aria-hidden="true">
                        {isSelected ? <Check size={12} strokeWidth={2.7} /> : null}
                      </span>
                    ) : null}
                    <strong>{option.label}</strong>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  function requestDescriptiveBuilderModeChange(nextMode) {
    if (nextMode === descriptiveBuilderMode) return
    setPendingDescriptiveBuilderMode(nextMode)
  }

  function cancelDescriptiveBuilderModeChange() {
    setPendingDescriptiveBuilderMode(null)
  }

  function confirmDescriptiveBuilderModeChange() {
    if (!pendingDescriptiveBuilderMode) return
    if (selectedQuestion && !['Sent to Approval', 'Approved'].includes(selectedQuestion.status)) {
      setQuestions((current) => current.map((item) => {
        if (item.id !== selectedQuestion.id) return item

        const nextQuestion = {
          ...item,
          questionText: '',
          title: `${pendingDescriptiveBuilderMode} ${questions.length}`,
          answerKey: '',
          marks: pendingDescriptiveBuilderMode === 'LAQs' ? '0' : '',
          subject: '',
          topics: [],
          competencies: [],
          images: [],
          descriptiveSections: pendingDescriptiveBuilderMode === 'LAQs' ? [createDescriptiveSubQuestion({ ...item, subject: '', topics: [], competencies: [] })] : [],
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
          revisionStatus: item.status === 'Created' ? 'Edited' : item.revisionStatus,
          editCount: item.status === 'Created' ? Math.max(Number(item.editCount ?? item.revisionCount ?? 1) || 1, 1) : item.editCount,
        }

        return nextQuestion
      }))
      setCurriculumDraft(null)
      setIsCurriculumEditing(false)
      setActiveDescriptiveAnswerTarget({ type: 'root' })
      setActiveDescriptiveMappingTarget(null)
      setDescriptiveCompetencyDraft(null)
      setActiveLaqCompetencySectionId(null)
      setLaqCompetencySearchValue('')
      closeMappingPicker()
    }
    setDescriptiveBuilderMode(pendingDescriptiveBuilderMode)
    setPendingDescriptiveBuilderMode(null)
  }

  const selectedQuestion = questions.find((item) => item.id === selectedQuestionId) ?? null

  useEffect(() => {
    if (!pendingDescriptiveBuilderMode) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        cancelDescriptiveBuilderModeChange()
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [pendingDescriptiveBuilderMode])

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

  useEffect(() => {
    if (!activeMappingPicker) return undefined

    const closeOnOutsideAction = (event) => {
      if (event.key && event.key !== 'Escape') return
      const target = event.target
      if (!event.key && target?.closest?.('.question-bank-laq-map-field, .question-bank-laq-competency-field, .question-bank-inline-map-field, .question-bank-inline-map-dropdown, .question-bank-laq-dropdown, .question-bank-mapping-panel, .question-bank-mapping-trigger')) {
        return
      }
      closeMappingPicker()
    }

    document.addEventListener('pointerdown', closeOnOutsideAction)
    document.addEventListener('keydown', closeOnOutsideAction)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideAction)
      document.removeEventListener('keydown', closeOnOutsideAction)
    }
  }, [activeMappingPicker])

  useEffect(() => {
    if (!activeLaqCompetencySectionId) return undefined

    const closeOnOutsideAction = (event) => {
      if (event.key && event.key !== 'Escape') return
      const target = event.target
      if (!event.key && target?.closest?.('.question-bank-laq-competency-field')) return
      setActiveLaqCompetencySectionId(null)
      setLaqCompetencySearchValue('')
    }

    document.addEventListener('pointerdown', closeOnOutsideAction)
    document.addEventListener('keydown', closeOnOutsideAction)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideAction)
      document.removeEventListener('keydown', closeOnOutsideAction)
    }
  }, [activeLaqCompetencySectionId])

  const getInitialDescriptiveAnswerTarget = (question) => {
    if (!isDescriptiveQuestionType(question?.type)) return { type: 'root' }
    const sections = question.descriptiveSections ?? []
    const insideWithAnswer = sections.flatMap((section) => (
      (section.children ?? []).map((child) => ({ section, child }))
    )).find(({ child }) => getRichTextPreview(child.answerKey))
    if (insideWithAnswer) {
      return { type: 'inside', sectionId: insideWithAnswer.section.id, childId: insideWithAnswer.child.id }
    }
    const sectionWithAnswer = sections.find((section) => (
      !(section.children ?? []).length && getRichTextPreview(section.answerKey)
    ))
    if (sectionWithAnswer) return { type: 'section', sectionId: sectionWithAnswer.id }
    if (getRichTextPreview(question.answerKey)) return { type: 'root' }

    const firstInside = sections.flatMap((section) => (
      (section.children ?? []).map((child) => ({ section, child }))
    )).find(({ child }) => getRichTextPreview(child.questionText))
    if (firstInside) return { type: 'inside', sectionId: firstInside.section.id, childId: firstInside.child.id }
    const firstSection = sections.find((section) => (
      !(section.children ?? []).length && getRichTextPreview(section.questionText)
    ))
    if (firstSection) return { type: 'section', sectionId: firstSection.id }
    return { type: 'root' }
  }

  useEffect(() => {
    if (!selectedQuestion) return
    if (getQuestionTypeMeta(selectedQuestion.type).shortLabel !== 'LAQs') return
    if ((selectedQuestion.descriptiveSections ?? []).length) return

    const nextSection = createDescriptiveSubQuestion(selectedQuestion)
    setQuestions((current) => current.map((item) => (
      item.id === selectedQuestion.id && !(item.descriptiveSections ?? []).length
        ? { ...item, marks: '0', answerKey: '', descriptiveSections: [nextSection] }
        : item
    )))
    setActiveDescriptiveAnswerTarget({ type: 'section', sectionId: nextSection.id })
  }, [selectedQuestion?.id, selectedQuestion?.type, selectedQuestion?.descriptiveSections?.length])

  const pendingEditQuestion = questions.find((item) => item.id === pendingEditQuestionId) ?? null
  const draftQuestionCards = questions.filter((item) => item.status === 'Draft')
  const createdQuestionCards = questions.filter((item) => ['Created', 'Generating'].includes(item.status) && !isExcelUploadedQuestion(item))
  const questionBankGenerationProcessorRows = createdQuestionCards
    .map((item, index) => {
      const isGenerating = item.status === 'Generating'
      const startedAt = generationProcessorStartedAt[item.id] ?? generationProcessorTick
      const elapsed = Math.max(0, generationProcessorTick - startedAt)
      const percent = isGenerating
        ? Math.min(96, Math.max(8, Math.round((elapsed / GENERATION_DELAY_MS) * 100)))
        : 100

      return {
        id: item.id,
        typeLabel: getQuestionTypeMeta(item.type).shortLabel,
        idLabel: getCreatedQuestionDisplayId(index),
        status: isGenerating ? 'Generating' : 'Completed',
        percent,
        onClick: item.status !== 'Generating'
          ? () => {
            setSelectedQuestionId(item.id)
            setActiveQuestionTab('created')
            setOpenCreatedQuestionIds((current) => (current.includes(item.id) ? current : [...current, item.id]))
            window.setTimeout(() => {
              document.querySelector(`[data-created-question-id="${item.id}"]`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              })
            }, 80)
          }
          : undefined,
      }
    })
    .filter((item) => (
      questions.find((question) => question.id === item.id)?.status === 'Generating'
      || generationProcessorCompletedIds.includes(item.id)
    ))
  const hasQuestionBankGenerationProcessorRunning = createdQuestionCards.some((item) => item.status === 'Generating')

  useEffect(() => {
    if (!hasQuestionBankGenerationProcessorRunning) return undefined

    const intervalId = window.setInterval(() => {
      setGenerationProcessorTick(Date.now())
    }, 500)

    return () => window.clearInterval(intervalId)
  }, [hasQuestionBankGenerationProcessorRunning])

  useEffect(() => () => {
    generationProcessorCleanupTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    generationProcessorCleanupTimersRef.current.clear()
  }, [])

  const sentApprovalQuestionCards = questions.filter((item) => item.status === 'Sent to Approval' && hasQuestionContent(item))
  const approvedQuestionCards = questions
    .filter((item) => item.status === 'Approved' && hasQuestionContent(item))
    .sort((firstQuestion, secondQuestion) => (
      Number(Boolean(firstQuestion.questionBankSentAt)) - Number(Boolean(secondQuestion.questionBankSentAt))
    ))
  const rejectedQuestionCards = questions.filter((item) => item.status === 'Approval Rejected' && hasQuestionContent(item))
  const reportQuestionCards = Array.from(new Map([
    ...reportedQuestionRecords
      .map((record) => (record.question && hasQuestionContent(record.question) ? {
        ...record.question,
        reportReasons: record.reasons ?? record.question.reportReasons ?? [],
        reportExplanation: record.explanation ?? record.question.reportExplanation ?? '',
        reportAuthorAction: record.authorAction ?? record.question.reportAuthorAction ?? '',
        reportRecordId: record.id,
      } : null))
      .filter(Boolean),
    ...questions.filter((item) => isReportedQuestion(item) && hasQuestionContent(item)),
  ].map((question) => [question.id ?? getQuestionPreview(question), question])).values())
  const uploadedQuestionCards = useMemo(() => {
    const uploadedById = new Map()
    readExcelUploadedQuestionBankQuestions().filter(hasQuestionContent).forEach((question) => {
      uploadedById.set(question.id, question)
    })
    questions.filter((question) => isExcelUploadedQuestion(question) && hasQuestionContent(question)).forEach((question) => {
      uploadedById.set(question.id, question)
    })
    return Array.from(uploadedById.values()).filter((question) => ['Created', 'Generating'].includes(question.status))
  }, [questions])
  const approvedQuestionBankPendingCards = approvedQuestionCards.filter((item) => (
    !item.questionBankSentAt
    && item.questionBankStatus !== 'Add to Question Bank'
  ))
  const activeApprovableCards = activeQuestionTab === 'uploaded' ? uploadedQuestionCards : createdQuestionCards
  const approvableQuestionIds = activeApprovableCards
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
      : activeQuestionTab === 'uploaded'
        ? uploadedQuestionCards
        : activeQuestionTab === 'sent'
          ? sentApprovalQuestionCards
          : activeQuestionTab === 'approved'
            ? approvedQuestionCards
            : activeQuestionTab === 'rejected'
              ? rejectedQuestionCards
              : activeQuestionTab === 'report'
                ? reportQuestionCards
                : []

  const curriculumQuestion = isCurriculumEditing && curriculumDraft ? curriculumDraft : selectedQuestion
  const normalizedCurriculumQuestion = curriculumQuestion
    ? { ...curriculumQuestion, year: curriculumQuestion.year || getYearForSubject(curriculumQuestion.subject) }
    : null
  const availableSubjects = normalizedCurriculumQuestion ? getSubjectsForYear(normalizedCurriculumQuestion.year) : []
  const availableTopics = normalizedCurriculumQuestion ? getAvailableTopics(normalizedCurriculumQuestion) : []
  const availableCompetencies = normalizedCurriculumQuestion ? getAvailableCompetencies(normalizedCurriculumQuestion) : []
  const selectedQuestionTypeLabel = selectedQuestion
    ? getQuestionTypeMeta(selectedQuestion.type).shortLabel
    : ''
  const isSelectedLaqQuestion = ['LAQs', 'SAQs'].includes(selectedQuestionTypeLabel)
  const isSelectedSaqBuilderMode = isSelectedLaqQuestion && descriptiveBuilderMode === 'SAQs'
  const isSelectedLaqBuilderMode = isSelectedLaqQuestion && descriptiveBuilderMode === 'LAQs'
  const shouldShowSelectedSubQuestionFlow = isSelectedLaqBuilderMode
    || (isSelectedSaqBuilderMode && selectedQuestion?.clinicalVignetteEnabled === true)
  const isSelectedSaqSingleQuestionFlow = isSelectedLaqQuestion
    && descriptiveBuilderMode === 'SAQs'
    && selectedQuestion?.clinicalVignetteEnabled !== true
  const canCreateSelectedQuestion = isSelectedSaqSingleQuestionFlow
    ? (
      hasQuestionContent(selectedQuestion)
      && Boolean(selectedQuestion?.subject)
      && Boolean(selectedQuestion?.topics?.length)
      && asArray(selectedQuestion?.competencies).length === 1
      && hasSaqSingleQuestionAssessmentTags(selectedQuestion)
    )
    : canCreateQuestion(selectedQuestion)
  const canSaveSelectedDraft = selectedQuestion?.status !== 'Sent to Approval' && hasDraftContent(selectedQuestion)
  const shouldShowSelectedCurriculumPanel = selectedQuestion
    && (!isDescriptiveQuestionType(selectedQuestion.type) || !(selectedQuestion.descriptiveSections ?? []).length)
  const isUpdatingSelectedQuestion = selectedQuestion
    ? selectedQuestion.questionBankEditMode === 'duplicate'
      ? false
      : ['Created', 'Draft', 'Approval Rejected'].includes(selectedQuestion.status) || selectedQuestion.questionBankEditMode === 'overwrite'
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
  const isListQuestionTab = ['created', 'uploaded', 'draft', 'sent', 'approved', 'rejected', 'report'].includes(activeQuestionTab)
  const uploadWizardQuestionCount = uploadImportResult?.questions?.length ?? 0
  const uploadWizardProgress = uploadWizardQuestionCount
    ? Math.round((uploadWizard.generatedCount / uploadWizardQuestionCount) * 100)
    : 0
  const uploadWizardErrorRows = getUploadErrorRows(uploadImportResult?.errors ?? [])
  const uploadWizardSubjectOptions = Object.keys(SUBJECT_DIRECTORY)
  const uploadWizardTopicOptions = uploadWizard.subject
    ? (SUBJECT_DIRECTORY[uploadWizard.subject]?.topics ?? [])
    : []
  const uploadWizardCompetencyOptions = uploadWizard.subject && uploadWizard.topic
    ? (SUBJECT_DIRECTORY[uploadWizard.subject]?.competencies ?? []).filter((item) => item.topic === uploadWizard.topic)
    : []
  const selectedUploadCompetency = uploadWizardCompetencyOptions.find((item) => item.value === uploadWizard.competency)
  const canBrowseUploadFile = Boolean(uploadWizard.subject && uploadWizard.topic && uploadWizard.competency)
  const isUploadWizardLocked = ['analyzing', 'generating', 'complete'].includes(uploadWizard.status)
  const approvalModalQuestionCount = pendingUploadApprovalQuestions.length || approvalSelectedIds.length

  const selectQuestionForEditing = (questionId, questionOverride = null) => {
    const storedQuestion = questionOverride ? null : questions.find((item) => item.id === questionId)
    const nextSelectedQuestion = questionOverride
      ? normalizeQuestionForAuthoring(questionOverride)
      : storedQuestion
        ? normalizeQuestionForAuthoring(storedQuestion)
        : null
    const nextTypeShortLabel = getQuestionTypeMeta(nextSelectedQuestion?.type).shortLabel
    setSelectedQuestionId(nextSelectedQuestion?.id ?? null)
    setIsGeneratingQuestion(false)
    setGenerationCompleteId(null)
    setIsOptionalTagsOpen(false)
    setOpenDistractorOptionId(null)
    setOpenDistractorMenuOptionId(null)
    setOpenOptionDistractorPreviewId(null)
    setEditableDescriptiveFieldKeys([])
    closeMappingPicker()
    if (nextSelectedQuestion) {
      if (nextTypeShortLabel === 'SAQs' || nextSelectedQuestion.descriptiveBuilderMode === 'SAQs' || typeof nextSelectedQuestion.clinicalVignetteEnabled === 'boolean') {
        setDescriptiveBuilderMode('SAQs')
      } else if (nextTypeShortLabel === 'LAQs') {
        setDescriptiveBuilderMode('LAQs')
      }
      setActiveDescriptiveAnswerTarget(getInitialDescriptiveAnswerTarget(nextSelectedQuestion))
      setCurriculumDraft({
        year: nextSelectedQuestion.year,
        subject: nextSelectedQuestion.subject,
        topics: [...asArray(nextSelectedQuestion.topics)],
        competencies: [...asArray(nextSelectedQuestion.competencies)],
      })
      setIsCurriculumEditing(true)
      setIsDefaultCurriculumOpen(true)
      setAutoOpenCurriculumQuestionId(null)
      return
    }
    setActiveDescriptiveAnswerTarget({ type: 'root' })
    setIsCurriculumEditing(false)
    setCurriculumDraft(null)
    setIsDefaultCurriculumOpen(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(QUESTION_BANK_STORAGE_KEY, JSON.stringify(questions))
  }, [questions])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const timerId = window.setTimeout(() => {
      try {
        const handoff = JSON.parse(window.sessionStorage.getItem(QUESTION_BANK_EDIT_HANDOFF_KEY) ?? 'null')
        if (!handoff?.question) return

        window.sessionStorage.removeItem(QUESTION_BANK_EDIT_HANDOFF_KEY)
        const mode = handoff.mode === 'duplicate' ? 'duplicate' : 'overwrite'
        const editableQuestion = cloneQuestionForCreate(handoff.question, mode)
        const typeMeta = getQuestionTypeMeta(editableQuestion.type)

        setQuestions((current) => {
          const hasQuestion = current.some((item) => item.id === editableQuestion.id)
          return hasQuestion
            ? current.map((item) => (item.id === editableQuestion.id ? { ...item, ...editableQuestion } : item))
            : [...current, editableQuestion]
        })
        setSelectedQuestionId(editableQuestion.id)
        setActiveDescriptiveAnswerTarget(getInitialDescriptiveAnswerTarget(editableQuestion))
        setActiveQuestionTab('create')
        setGenerationCompleteId(null)
        onAlert?.({
          tone: 'secondary',
          message: mode === 'duplicate' ? 'Question duplicated into Create Question.' : 'Question loaded for overwrite.',
        })
      } catch {
        window.sessionStorage.removeItem(QUESTION_BANK_EDIT_HANDOFF_KEY)
      }
    }, 0)
    return () => window.clearTimeout(timerId)
  }, [onAlert])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const syncQuestionBankExternalCounts = () => {
      setReportedQuestionRecords(readReportedQuestionRecords())
      setUploadedQuestionCount(readExcelUploadedQuestionBankQuestions().filter(hasQuestionContent).length)
    }

    window.addEventListener('storage', syncQuestionBankExternalCounts)
    window.addEventListener('question-bank-created-reported-questions', syncQuestionBankExternalCounts)
    window.addEventListener('question-bank-uploaded-questions', syncQuestionBankExternalCounts)

    return () => {
      window.removeEventListener('storage', syncQuestionBankExternalCounts)
      window.removeEventListener('question-bank-created-reported-questions', syncQuestionBankExternalCounts)
      window.removeEventListener('question-bank-uploaded-questions', syncQuestionBankExternalCounts)
    }
  }, [])

  useEffect(() => {
    if (!openDistractorOptionId && !openDistractorMenuOptionId) return undefined
    if (typeof document === 'undefined') return undefined

    const handleOutsideDistractorClick = (event) => {
      if (event.target.closest?.('.question-bank-distractor-wrap')) return
      setOpenDistractorOptionId(null)
      setOpenDistractorMenuOptionId(null)
    }

    document.addEventListener('mousedown', handleOutsideDistractorClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideDistractorClick)
    }
  }, [openDistractorOptionId, openDistractorMenuOptionId])

  useEffect(() => {
    if (!isUploadTemplateMenuOpen) return undefined
    if (typeof document === 'undefined') return undefined

    const handleOutsideUploadTemplateClick = (event) => {
      if (event.target.closest?.('.question-bank-upload-template-menu-wrap')) return
      setIsUploadTemplateMenuOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideUploadTemplateClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideUploadTemplateClick)
    }
  }, [isUploadTemplateMenuOpen])

  useEffect(() => {
    if (!editableDescriptiveFieldKeys.length) return undefined
    if (typeof document === 'undefined') return undefined

    const handleOutsideDescriptiveEditClick = (event) => {
      const target = event.target
      if (target.closest?.('.question-bank-field-edit-btn')) return
      if (target.closest?.('.question-bank-field.rich')) return
      if (target.closest?.('.question-bank-descriptive-text')) return
      if (target.closest?.('.question-bank-descriptive-marks')) return

      setEditableDescriptiveFieldKeys([])
    }

    document.addEventListener('mousedown', handleOutsideDescriptiveEditClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideDescriptiveEditClick)
    }
  }, [editableDescriptiveFieldKeys])

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
          questionBankStatus: result.status === 'Approved'
            ? result.questionBankStatus ?? question.questionBankStatus ?? 'Add to Question Bank'
            : undefined,
          questionBankSentAt: result.status === 'Approved'
            ? result.questionBankSentAt ?? question.questionBankSentAt
            : undefined,
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

  useEffect(() => {
    if (uploadWizard.status !== 'analyzing') return undefined
    if (!uploadWizard.startedAt || !uploadImportResult) return undefined

    const finishAnalyze = () => {
      setUploadWizard((current) => {
        if (current.status !== 'analyzing') return current

        if (uploadImportResult.extension && ['xls', 'xlsx'].includes(uploadImportResult.extension)) {
          setUploadImportResult({
            status: 'error',
            fileName: uploadImportResult.fileName,
            questions: [],
            rowsCount: 0,
            errors: ['Please open the Excel file and save it as CSV before upload. This project currently validates CSV templates directly.'],
          })
          return { ...current, status: 'error', remainingSeconds: 0 }
        }

        if (uploadImportResult.readError) {
          setUploadImportResult({
            status: 'error',
            fileName: uploadImportResult.fileName,
            questions: [],
            rowsCount: 0,
            errors: ['Unable to read this file. Please upload a CSV exported from the sample template.'],
          })
          return { ...current, status: 'error', remainingSeconds: 0 }
        }

        const result = validateExcelUploadRows(uploadImportResult.csvText ?? '', {
          questionType: uploadImportResult.questionType,
          year: uploadImportResult.year,
          subject: uploadImportResult.subject,
          topic: uploadImportResult.topic,
          competency: uploadImportResult.competency,
        })
        setUploadImportResult({
          status: result.errors.length ? 'error' : 'ready',
          fileName: uploadImportResult.fileName,
          ...result,
        })

        return {
          ...current,
          status: result.errors.length ? 'error' : 'ready',
          generatedCount: 0,
          totalSeconds: result.errors.length ? 0 : result.questions.length * 15,
          remainingSeconds: result.errors.length ? 0 : result.questions.length * 15,
          startedAt: 0,
        }
      })
    }

    const updateAnalyzeProgress = () => {
      const elapsedSeconds = Math.floor((Date.now() - uploadWizard.startedAt) / 1000)
      const remainingSeconds = Math.max(0, EXCEL_UPLOAD_ANALYZE_SECONDS - elapsedSeconds)

      setUploadWizard((current) => (
        current.status === 'analyzing'
          ? {
            ...current,
            totalSeconds: EXCEL_UPLOAD_ANALYZE_SECONDS,
            remainingSeconds,
          }
          : current
      ))

      if (remainingSeconds <= 0) finishAnalyze()
    }

    updateAnalyzeProgress()
    const intervalId = window.setInterval(updateAnalyzeProgress, 1000)
    return () => {
      window.clearInterval(intervalId)
    }
  }, [uploadWizard.status, uploadWizard.startedAt, uploadImportResult])

  useEffect(() => {
    if (uploadWizard.status !== 'generating') return undefined
    const questionsToGenerate = uploadImportResult?.questions ?? []
    if (!questionsToGenerate.length || !uploadWizard.startedAt) return undefined

    const totalQuestions = questionsToGenerate.length
    const totalSeconds = totalQuestions * 15
    let didComplete = false

    const updateGenerationProgress = () => {
      const elapsedSeconds = Math.floor((Date.now() - uploadWizard.startedAt) / 1000)
      const generatedCount = Math.min(totalQuestions, Math.floor(elapsedSeconds / 15))
      const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)

      setUploadWizard((current) => (
        current.status === 'generating'
          ? {
            ...current,
            generatedCount,
            totalSeconds,
            remainingSeconds,
          }
          : current
      ))

      if (generatedCount >= totalQuestions && !didComplete) {
        didComplete = true
        setUploadWizard((current) => (
          current.status === 'generating'
            ? {
              ...current,
              status: 'complete',
              generatedCount: totalQuestions,
              remainingSeconds: 0,
            }
            : current
        ))
      }
    }

    updateGenerationProgress()
    const intervalId = window.setInterval(updateGenerationProgress, 1000)
    return () => {
      window.clearInterval(intervalId)
    }
  }, [uploadWizard.status, uploadWizard.startedAt, uploadImportResult])

  const updateSelectedQuestion = (updater) => {
    if (!selectedQuestion) return
    if (['Sent to Approval', 'Approved'].includes(selectedQuestion.status)) return
    setGenerationCompleteId((current) => (
      current === selectedQuestion.id ? null : current
    ))
    setQuestions((current) => current.map((item) => (
      item.id === selectedQuestion.id
        ? {
          ...item,
          ...(typeof updater === 'function' ? updater(item) : updater),
          revisionStatus: item.status === 'Created' ? 'Edited' : item.revisionStatus,
          editCount: item.status === 'Created' ? Math.max(Number(item.editCount ?? item.revisionCount ?? 1) || 1, 1) : item.editCount,
        }
        : item
    )))
  }

  const handleCreateQuestion = (type) => {
    const typeMeta = getQuestionTypeMeta(type)
    if (typeMeta.isUpcoming) return
    const question = normalizeQuestionForAuthoring(createQuestion(type, {
      title: `${typeMeta.shortLabel} ${questions.length + 1}`,
    }))
    if (typeMeta.shortLabel === 'LAQs') {
      question.descriptiveSections = [createDescriptiveSubQuestion(question)]
    }
    setQuestions((current) => [...current, question])
    selectQuestionForEditing(question.id, question)
    setAutoOpenCurriculumQuestionId(question.id)
    setActiveQuestionTab('create')
    setIsDescriptiveTypePickerOpen(false)
  }

  const handleDownloadUploadTemplate = (typeKey) => {
    downloadCsvTemplate(typeKey)
    onAlert?.({ tone: 'secondary', message: `${typeKey} upload template downloaded.` })
  }

  const resetUploadWizard = () => {
    setUploadImportResult(null)
    setUploadWizard({
      isOpen: true,
      status: 'idle',
      fileName: '',
      questionType: 'MCQ',
      year: '',
      subject: '',
      topic: '',
      competency: '',
      generatedCount: 0,
      totalSeconds: 0,
      remainingSeconds: 0,
      startedAt: 0,
    })
  }

  const openUploadWizard = () => {
    resetUploadWizard()
  }

  const closeUploadWizard = () => {
    if (['analyzing', 'generating', 'complete'].includes(uploadWizard.status)) return
    setUploadWizard((current) => ({ ...current, isOpen: false }))
  }

  const stopUploadGeneration = () => {
    setUploadImportResult(null)
    setUploadWizard({
      isOpen: false,
      status: 'idle',
      fileName: '',
      questionType: 'MCQ',
      year: '',
      subject: '',
      topic: '',
      competency: '',
      generatedCount: 0,
      totalSeconds: 0,
      remainingSeconds: 0,
      startedAt: 0,
    })
    onAlert?.({ tone: 'warning', message: 'Upload question generation stopped.' })
  }

  const updateUploadWizardField = (field, value) => {
    setUploadWizard((current) => ({
      ...current,
      [field]: value,
      ...(field === 'subject' ? { topic: '', competency: '', year: '' } : {}),
      ...(field === 'topic' ? { competency: '', year: '' } : {}),
      ...(field === 'competency' ? {
        year: uploadWizardCompetencyOptions.find((item) => item.value === value)?.year || '',
      } : {}),
    }))
  }

  const startUploadGeneration = () => {
    const questionsToGenerate = uploadImportResult?.questions ?? []
    if (!questionsToGenerate.length) return
    setUploadWizard((current) => ({
      ...current,
      status: 'generating',
      generatedCount: 0,
      totalSeconds: questionsToGenerate.length * 15,
      remainingSeconds: questionsToGenerate.length * 15,
      startedAt: Date.now(),
    }))
  }

  const handleUploadQuestionFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploadImportResult(null)
    setUploadWizard((current) => ({
      ...current,
      status: 'analyzing',
      fileName: file.name,
      generatedCount: 0,
      totalSeconds: EXCEL_UPLOAD_ANALYZE_SECONDS,
      remainingSeconds: EXCEL_UPLOAD_ANALYZE_SECONDS,
      startedAt: Date.now(),
    }))

    const extension = file.name.split('.').pop()?.toLowerCase()

    try {
      const csvText = ['xls', 'xlsx'].includes(extension) ? '' : await file.text()
      setUploadImportResult({
        status: 'analyzing',
        fileName: file.name,
        csvText,
        extension,
        questionType: uploadWizard.questionType,
        year: selectedUploadCompetency?.year || uploadWizard.year,
        subject: uploadWizard.subject,
        topic: uploadWizard.topic,
        competency: uploadWizard.competency,
        questions: [],
        rowsCount: 0,
        errors: [],
      })
    } catch {
      setUploadImportResult({
        status: 'analyzing',
        fileName: file.name,
        extension,
        questionType: uploadWizard.questionType,
        year: selectedUploadCompetency?.year || uploadWizard.year,
        subject: uploadWizard.subject,
        topic: uploadWizard.topic,
        competency: uploadWizard.competency,
        readError: true,
        questions: [],
        rowsCount: 0,
        errors: [],
      })
    }
  }

  const saveGeneratedUploadQuestionsForLater = () => {
    const nextQuestions = uploadImportResult?.questions ?? []
    if (!nextQuestions.length || typeof window === 'undefined') return

    const existingUploadedQuestions = readUploadedQuestionBankQuestions()
    const mergedUploadedQuestions = [...existingUploadedQuestions, ...nextQuestions]
    window.localStorage.setItem(QUESTION_BANK_UPLOADED_KEY, JSON.stringify(mergedUploadedQuestions))
    window.dispatchEvent(new Event('question-bank-uploaded-questions'))

    setQuestions((current) => {
      const existingIds = new Set(current.map((item) => item.id))
      return [
        ...current,
        ...nextQuestions.filter((question) => !existingIds.has(question.id)),
      ]
    })
    setUploadedQuestionCount(mergedUploadedQuestions.filter((question) => (
      hasQuestionContent(question)
      && (question?.source === 'Excel Upload' || Boolean(question?.uploadBatchId))
    )).length)
    setUploadImportResult(null)
    setUploadWizard({
      isOpen: false,
      status: 'idle',
      fileName: '',
      generatedCount: 0,
      totalSeconds: 0,
      remainingSeconds: 0,
      startedAt: 0,
    })
    setActiveQuestionTab('uploaded')
    onAlert?.({ tone: 'secondary', message: `${nextQuestions.length} uploaded questions saved for approval later.` })
  }

  const openGeneratedUploadApprovalModal = () => {
    const generatedQuestions = uploadImportResult?.questions ?? []
    if (!generatedQuestions.length) return
    setPendingUploadApprovalQuestions(generatedQuestions)
    setApprovalNote('')
    setIsApprovalModalOpen(true)
  }

  const confirmGeneratedUploadQuestionsToApproval = () => {
    const generatedQuestions = pendingUploadApprovalQuestions
    if (!generatedQuestions.length || typeof window === 'undefined') return

    const approvalId = `question-bank-upload-${Date.now()}`
    const sentQuestions = generatedQuestions.map((question) => ({
      ...question,
      status: 'Sent to Approval',
      questionBankStatus: undefined,
      questionBankSentAt: undefined,
    }))
    const yearValues = [...new Set(sentQuestions.map((item) => item.year).filter(Boolean))]
    const subjectValues = [...new Set(sentQuestions.map((item) => item.subject).filter(Boolean))]
    const questionTypeSummary = sentQuestions.reduce((summary, question) => ({
      ...summary,
      [getQuestionTypeMeta(question.type).shortLabel]: (summary[getQuestionTypeMeta(question.type).shortLabel] ?? 0) + 1,
    }), {})
    const questionTypeSummaryText = Object.entries(questionTypeSummary)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ')

    onSendToApproval?.({
      activityId: approvalId,
      activityName: `Question Bank Upload - ${sentQuestions.length} Questions`,
      activityType: 'Question Bank',
      approvalStatus: 'Pending Approval',
      status: 'Pending Approval',
      totalStudents: sentQuestions.length,
      totalQuestions: sentQuestions.length,
      questionTypeSummary,
      questionTypeSummaryText,
      questionRevisionStatus: 'Created',
      questionChangeStatus: 'Created',
      questionEditCount: 0,
      year: yearValues.length === 1 ? yearValues[0] : yearValues.length ? `${yearValues.length} years` : 'Question Bank',
      sgt: subjectValues.length === 1 ? subjectValues[0] : subjectValues.length ? `${subjectValues.length} subjects` : 'Questions',
      facultyName: selectedApprovalReviewer.facultyName,
      employeeId: selectedApprovalReviewer.employeeId,
      designation: selectedApprovalReviewer.designation,
      note: approvalNote,
      questionRows: sentQuestions.map((question, index) => ({
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
        descriptiveSections: question.descriptiveSections,
        answerKey: question.answerKey,
      })),
    })

    const existingUploadedQuestions = readUploadedQuestionBankQuestions()
    const sentQuestionById = new Map(sentQuestions.map((question) => [question.id, question]))
    const mergedUploadedQuestions = [
      ...existingUploadedQuestions.map((question) => sentQuestionById.get(question.id) ?? question),
      ...sentQuestions.filter((question) => !existingUploadedQuestions.some((item) => item?.id === question.id)),
    ]
    window.localStorage.setItem(QUESTION_BANK_UPLOADED_KEY, JSON.stringify(mergedUploadedQuestions))
    window.dispatchEvent(new Event('question-bank-uploaded-questions'))

    setQuestions((current) => {
      const existingIds = new Set(current.map((item) => item.id))
      return [
        ...current.map((question) => sentQuestionById.get(question.id) ?? question),
        ...sentQuestions.filter((question) => !existingIds.has(question.id)),
      ]
    })
    setUploadedQuestionCount(mergedUploadedQuestions.filter((question) => (
      hasQuestionContent(question)
      && (question?.source === 'Excel Upload' || Boolean(question?.uploadBatchId))
    )).length)
    setUploadImportResult(null)
    setPendingUploadApprovalQuestions([])
    setIsApprovalModalOpen(false)
    setApprovalNote('')
    setUploadWizard({
      isOpen: false,
      status: 'idle',
      fileName: '',
      generatedCount: 0,
      totalSeconds: 0,
      remainingSeconds: 0,
      startedAt: 0,
    })
    setActiveQuestionTab('sent')
    onAlert?.({ tone: 'success', message: `${sentQuestions.length} uploaded questions sent to approval.` })
  }

  const openEditQuestionFlow = (questionId) => {
    setOpenCreatedTagsId(null)
    const question = questions.find((item) => item.id === questionId)
      ?? reportedQuestionRecords.find((record) => record.questionId === questionId)?.question
    if (activeQuestionTab === 'report' && question) {
      startEditQuestionFlow(question)
      return
    }
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
    const nextQuestion = {
      ...questionToEdit,
      status: 'Draft',
      revisionStatus: isRejectedQuestion ? 'Created' : 'Edited',
      editCount: isRejectedQuestion ? 0 : Number(questionToEdit.editCount ?? questionToEdit.revisionCount ?? 0) + 1,
      approvalReviewRemarks: '',
      approvalReviewedAt: '',
      questionBankStatus: undefined,
      questionBankSentAt: undefined,
      isReported: false,
      reported: false,
      reportStatus: undefined,
    }

    setQuestions((current) => {
      const hasQuestion = current.some((item) => item.id === questionId)

      return hasQuestion
        ? current.map((item) => (item.id === questionId ? { ...item, ...nextQuestion } : item))
        : [...current, nextQuestion]
    })
    selectQuestionForEditing(questionId, nextQuestion)
    setActiveQuestionTab('create')
    setPendingEditQuestionId(null)
    setIsApprovalSelectMode(false)
    setApprovalSelectedIds((current) => current.filter((id) => id !== questionId))
    onAlert?.({ tone: 'secondary', message: `${typeMeta.shortLabel} loaded for editing.` })
  }

  const clearCreatedReportForQuestion = (questionId) => {
    const nextRecords = readReportedQuestionRecords().filter((record) => record.questionId !== questionId)
    writeCreatedReportedQuestionRecords(nextRecords)
    setReportedQuestionRecords(nextRecords)
  }

  const deleteCreatedReportQuestion = (questionId) => {
    if (!questionId) return

    const nextRecords = readReportedQuestionRecords().filter((record) => record.questionId !== questionId)
    writeCreatedReportedQuestionRecords(nextRecords)
    setReportedQuestionRecords(nextRecords)
    deleteQuestionFromStorage(questionId)
    setQuestions((current) => current.filter((item) => item.id !== questionId))
    if (selectedQuestionId === questionId) {
      selectQuestionForEditing(null)
    }
    onAlert?.({ tone: 'warning', message: 'Reported question deleted.' })
  }

  const handleDeleteQuestion = () => {
    if (!selectedQuestion) return
    if (selectedQuestion.status === 'Sent to Approval') return
    const nextQuestions = questions.filter((item) => item.id !== selectedQuestion.id)
    deleteQuestionFromStorage(selectedQuestion.id)
    setUploadedQuestionCount(readExcelUploadedQuestionBankQuestions().filter(hasQuestionContent).length)
    setQuestions(nextQuestions)
    selectQuestionForEditing(nextQuestions[0]?.id ?? null, nextQuestions[0] ?? null)
    onAlert?.({ tone: 'warning', message: 'Question removed.' })
  }

  const handleDeleteQuestionById = (questionId) => {
    const question = questions.find((item) => item.id === questionId)
      ?? readUploadedQuestionBankQuestions().find((item) => item.id === questionId)
    if (question?.status === 'Sent to Approval') return
    const nextQuestions = questions.filter((item) => item.id !== questionId)
    deleteQuestionFromStorage(questionId)
    setUploadedQuestionCount(readExcelUploadedQuestionBankQuestions().filter(hasQuestionContent).length)
    setQuestions(nextQuestions)
    setApprovalSelectedIds((current) => current.filter((id) => id !== questionId))
    if (selectedQuestionId === questionId) {
      selectQuestionForEditing(nextQuestions[0]?.id ?? null, nextQuestions[0] ?? null)
    }
    onAlert?.({ tone: 'warning', message: 'Question removed.' })
  }

  const updateDescriptiveSections = (updater) => {
    if (!selectedQuestionId) return

    setGenerationCompleteId((current) => (
      current === selectedQuestionId ? null : current
    ))
    setQuestions((current) => current.map((item) => {
      if (item.id !== selectedQuestionId) return item

      return {
        ...item,
        descriptiveSections: typeof updater === 'function'
          ? updater(item.descriptiveSections ?? [])
          : updater,
        revisionStatus: item.status === 'Created' ? 'Edited' : item.revisionStatus,
        editCount: item.status === 'Created' ? Math.max(Number(item.editCount ?? item.revisionCount ?? 1) || 1, 1) : item.editCount,
      }
    }))
  }

  const isDescriptiveFieldEditable = (fieldKey) => editableDescriptiveFieldKeys.includes(fieldKey)

  const enableDescriptiveFieldEdit = (fieldKey) => {
    setEditableDescriptiveFieldKeys((current) => (
      current.includes(fieldKey) ? current : [...current, fieldKey]
    ))
  }

  const getActiveDescriptiveAnswerValue = () => {
    if (!selectedQuestion || activeDescriptiveAnswerTarget.type === 'root') return selectedQuestion?.answerKey ?? ''
    const section = (selectedQuestion.descriptiveSections ?? []).find((item) => item.id === activeDescriptiveAnswerTarget.sectionId)
    if (!section) return ''
    if (activeDescriptiveAnswerTarget.type === 'section') return section.answerKey ?? ''
    const child = (section.children ?? []).find((item) => item.id === activeDescriptiveAnswerTarget.childId)
    return child?.answerKey ?? ''
  }

  const updateActiveDescriptiveAnswer = (answerKey) => {
    if (!selectedQuestion) return
    if (activeDescriptiveAnswerTarget.type === 'root') {
      updateSelectedQuestion({ answerKey })
      return
    }

    updateDescriptiveSections((sections) => sections.map((section) => {
      if (section.id !== activeDescriptiveAnswerTarget.sectionId) return section
      if (activeDescriptiveAnswerTarget.type === 'section') {
        return { ...section, answerKey }
      }
      return {
        ...section,
        children: (section.children ?? []).map((child) => (
          child.id === activeDescriptiveAnswerTarget.childId ? { ...child, answerKey } : child
        )),
      }
    }))
  }

  const getResolvedDescriptiveGenerationTarget = (question) => {
    if (!isDescriptiveQuestionType(question?.type)) return null
    const target = activeDescriptiveAnswerTarget ?? { type: 'root' }
    const sections = question.descriptiveSections ?? []
    const rootFieldKey = `${question.id}:root`
    const isRootEnabled = !sections.length || isDescriptiveFieldEditable(rootFieldKey)

    const isTargetEnabled = (candidate) => {
      if (!candidate) return false
      if (candidate.type === 'root') return isRootEnabled
      const section = sections.find((item) => item.id === candidate.sectionId)
      if (!section) return false
      const children = Array.isArray(section.children) ? section.children : []
      if (candidate.type === 'section') return !children.length
      return Boolean(children.find((item) => item.id === candidate.childId))
    }

    if (isTargetEnabled(target)) return target

    const insideCandidates = sections.flatMap((section) => (
      (section.children ?? []).map((child) => ({ section, child }))
    ))
    const emptyInsideAnswer = insideCandidates.find(({ child }) => (
      getRichTextPreview(child.questionText) && !getRichTextPreview(child.answerKey)
    ))
    if (emptyInsideAnswer) {
      return { type: 'inside', sectionId: emptyInsideAnswer.section.id, childId: emptyInsideAnswer.child.id }
    }

    const emptySectionAnswer = sections.find((section) => (
      !(section.children ?? []).length
      && getRichTextPreview(section.questionText)
      && !getRichTextPreview(section.answerKey)
    ))
    if (emptySectionAnswer) return { type: 'section', sectionId: emptySectionAnswer.id }

    if (isRootEnabled && getRichTextPreview(question.questionText) && !getRichTextPreview(question.answerKey)) {
      return { type: 'root' }
    }

    const firstInside = insideCandidates.find(({ child }) => getRichTextPreview(child.questionText))
    if (firstInside) return { type: 'inside', sectionId: firstInside.section.id, childId: firstInside.child.id }

    const firstSection = sections.find((section) => (
      !(section.children ?? []).length && getRichTextPreview(section.questionText)
    ))
    if (firstSection) return { type: 'section', sectionId: firstSection.id }

    return isRootEnabled ? { type: 'root' } : null
  }

  const applyGeneratedDescriptiveAnswer = (question, answerKey, target = activeDescriptiveAnswerTarget) => {
    if (!isDescriptiveQuestionType(question.type)) return { answerKey: getRichTextPreview(question.answerKey) ? question.answerKey : answerKey }
    if (!target) return {}
    if (target.type === 'root') {
      return { answerKey: getRichTextPreview(question.answerKey) ? question.answerKey : answerKey }
    }

    return {
      descriptiveSections: (question.descriptiveSections ?? []).map((section) => {
        if (section.id !== target.sectionId) return section
        if (target.type === 'section') {
          return {
            ...section,
            answerKey: getRichTextPreview(section.answerKey) ? section.answerKey : answerKey,
          }
        }
        return {
          ...section,
          children: (section.children ?? []).map((child) => (
            child.id === target.childId
              ? { ...child, answerKey: getRichTextPreview(child.answerKey) ? child.answerKey : answerKey }
              : child
          )),
        }
      }),
    }
  }

  const applyGeneratedDescriptiveMarks = (question, marks, target = activeDescriptiveAnswerTarget) => {
    const generatedMarks = String(marks || '2')
    if (!isDescriptiveQuestionType(question.type)) {
      return { marks: hasVisibleMarks(question.marks) ? question.marks : generatedMarks }
    }
    if (!target) return {}
    if (target.type === 'root') {
      return { marks: hasVisibleMarks(question.marks) ? question.marks : generatedMarks }
    }

    return {
      descriptiveSections: (question.descriptiveSections ?? []).map((section) => {
        if (section.id !== target.sectionId) return section
        const children = Array.isArray(section.children) ? section.children : []
        if (target.type === 'section') {
          return {
            ...section,
            marks: children.length || hasVisibleMarks(section.marks) ? (children.length ? '0' : section.marks) : generatedMarks,
          }
        }
        return {
          ...section,
          marks: children.length ? '0' : section.marks,
          children: children.map((child) => (
            child.id === target.childId
              ? { ...child, marks: hasVisibleMarks(child.marks) ? child.marks : generatedMarks }
              : child
          )),
        }
      }),
    }
  }

  const addDescriptiveSubQuestion = () => {
    const nextSection = createDescriptiveSubQuestion(selectedQuestion ?? {})
    updateSelectedQuestion({ marks: '0', answerKey: '' })
    updateDescriptiveSections((sections) => [...sections, nextSection])
    setActiveDescriptiveAnswerTarget({ type: 'section', sectionId: nextSection.id })
    setActiveDescriptiveMappingTarget(null)
    setDescriptiveCompetencyDraft(null)
  }

  const updateDescriptiveSubQuestion = (sectionId, updater) => {
    updateDescriptiveSections((sections) => sections.map((section) => (
      section.id === sectionId
        ? {
          ...section,
          ...(typeof updater === 'function' ? updater(section) : updater),
        }
        : section
    )))
  }

  const deleteDescriptiveSubQuestion = (sectionId) => {
    updateDescriptiveSections((sections) => sections.filter((section) => section.id !== sectionId))
    if (activeDescriptiveMappingTarget?.sectionId === sectionId) {
      setActiveDescriptiveMappingTarget(null)
      setDescriptiveCompetencyDraft(null)
    }
  }

  const addDescriptiveInsideQuestion = (sectionId, sectionIndex) => {
    const parentSection = (selectedQuestion?.descriptiveSections ?? []).find((section, index) => (
      section.id === sectionId || index === sectionIndex
    ))
    const nextInsideQuestion = createDescriptiveInsideQuestion({
      year: parentSection?.year || selectedQuestion?.year || '',
      subject: parentSection?.subject || selectedQuestion?.subject || '',
    })
    updateDescriptiveSections((sections) => sections.map((section, index) => (
      section.id === sectionId || index === sectionIndex
        ? {
          ...section,
          marks: '0',
          answerKey: '',
          children: [...(Array.isArray(section.children) ? section.children : []), nextInsideQuestion],
        }
        : section
    )))
    setActiveDescriptiveAnswerTarget({ type: 'inside', sectionId, childId: nextInsideQuestion.id })
    setActiveDescriptiveMappingTarget(null)
    setDescriptiveCompetencyDraft(null)
  }

  const updateDescriptiveInsideQuestion = (sectionId, childId, updater, sectionIndex, childIndex) => {
    updateDescriptiveSections((sections) => sections.map((section, index) => (
      section.id === sectionId || index === sectionIndex
        ? {
          ...section,
          children: (Array.isArray(section.children) ? section.children : []).map((child, currentChildIndex) => (
            child.id === childId || currentChildIndex === childIndex
              ? {
                ...child,
                ...(typeof updater === 'function' ? updater(child) : updater),
              }
              : child
          )),
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
    const isDeletingActiveMapping = activeDescriptiveMappingTarget?.type === 'inside'
      && activeDescriptiveMappingTarget.sectionId === sectionId
      && (activeDescriptiveMappingTarget.childId === childId || activeDescriptiveMappingTarget.childIndex === childIndex)
    if (isDeletingActiveMapping) {
      setActiveDescriptiveMappingTarget(null)
      setDescriptiveCompetencyDraft(null)
    }
  }

  const getDescriptiveMappingKey = (target = activeDescriptiveMappingTarget) => {
    if (!target) return ''
    return target.type === 'inside'
      ? `inside:${target.sectionId}:${target.childId}`
      : `section:${target.sectionId}`
  }

  const getDescriptiveCurriculumValue = (item) => ({
    year: item?.year || selectedQuestion?.year || '',
    subject: item?.subject || selectedQuestion?.subject || '',
    topics: item?.topics ?? [],
    competencies: item?.competencies ?? [],
  })

  const updateDescriptiveMappingTarget = (target, patch) => {
    if (!target) return
    if (target.type === 'section') {
      updateDescriptiveSubQuestion(target.sectionId, patch)
      return
    }
    updateDescriptiveInsideQuestion(target.sectionId, target.childId, patch, target.sectionIndex, target.childIndex)
  }

  const getDescriptiveSampleTopicOptions = (topics, subject) => {
    const sampleTopics = [
      'General Anatomy',
      'Upper Limb',
      'Thorax',
      'Neuroanatomy',
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
      `${subject || 'Subject'} Integration`,
    ]
    return Array.from(new Set([...(topics ?? []), ...sampleTopics])).slice(0, 20)
  }

  const getDescriptiveSampleCompetencyOptions = (competencies, subject, topic) => {
    const prefix = {
      'Human Anatomy': 'AN',
      Physiology: 'PY',
      Pathology: 'PA',
    }[subject] ?? 'CM'
    const baseTopic = topic || subject || 'Topic'
    const sampleCompetencies = Array.from({ length: 20 }, (_, index) => {
      const number = index + 1
      return {
        value: `${prefix}${number}.${(number % 9) + 1} ${baseTopic} sample competency ${number}`,
        label: `${baseTopic} sample competency ${number}`,
        topic: baseTopic,
      }
    })

    return Array.from(
      new Map([...(competencies ?? []), ...sampleCompetencies].map((competency) => [competency.value, competency])).values()
    ).slice(0, 20)
  }

  const getDescriptiveCompetencyDraftOptions = (draft = descriptiveCompetencyDraft) => {
    if (!selectedQuestion || !draft) return { subjects: [], topics: [], competencies: [] }
    const subjects = draft.year ? getSubjectsForYear(draft.year) : YEAR_OPTIONS.flatMap(getSubjectsForYear)
    const topicQuery = (draft.topicSearch ?? '').trim().toLowerCase()
    const competencyQuery = (draft.competencySearch ?? '').trim().toLowerCase()
    const allTopics = getDescriptiveSampleTopicOptions(getAvailableTopics({
      ...selectedQuestion,
      year: draft.year,
      subject: draft.subject,
      topics: draft.topic ? [draft.topic] : [],
    }), draft.subject)
    const topics = allTopics.filter((topic) => topic.toLowerCase().includes(topicQuery))
    const allCompetencies = getDescriptiveSampleCompetencyOptions(getAvailableCompetencies({
      ...selectedQuestion,
      year: draft.year,
      subject: draft.subject,
      topics: draft.topic ? [draft.topic] : [],
    }), draft.subject, draft.topic)
    const competencies = allCompetencies.filter((competency) => (
      competency.value.toLowerCase().includes(competencyQuery)
      || (competency.label ?? '').toLowerCase().includes(competencyQuery)
    ))

    return {
      subjects: Array.from(new Set(subjects)),
      topics,
      competencies,
    }
  }

  const openDescriptiveCompetencyTooltip = (target, item, anchorElement = null) => {
    const itemCurriculum = getDescriptiveCurriculumValue(item)
    setActiveDescriptiveMappingTarget(target)
    setDescriptiveCompetencyDraft({
      target,
      anchorElement,
      position: getDescriptiveTooltipPosition(anchorElement),
      year: itemCurriculum.year,
      subject: itemCurriculum.subject,
      topic: itemCurriculum.topics[0] ?? '',
      competency: itemCurriculum.competencies[0] ?? '',
      topicSearch: '',
      competencySearch: '',
      openDropdown: '',
    })
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

  const sendApprovedQuestionsToQuestionBank = (questionIds = approvedQuestionBankSelectedIds) => {
    if (!questionIds.length || typeof window === 'undefined') return

    const selectedIds = new Set(questionIds)
    const selectedApprovedCards = approvedQuestionBankPendingCards.filter((question) => selectedIds.has(question.id))
    if (!selectedApprovedCards.length) return

    const sentAt = new Date().toISOString()
    const existingQuestions = readPublishedQuestionBankQuestions()
    const existingQuestionById = new Map(existingQuestions.map((question) => [question.id, question]))
    const pendingPublishedQuestions = selectedApprovedCards.map((question) => ({
      ...question,
      questionBankId: existingQuestionById.get(question.id)?.questionBankId ?? question.questionBankId,
      authorName: getQuestionAuthorName(question),
      source: 'Institute',
      sourceType: 'Institute',
      isInstituteQuestion: true,
      isInstitute: undefined,
      status: 'Approved',
      questionBankStatus: 'Sent to Question Bank',
      questionBankSentAt: sentAt,
    }))
    const existingInstituteQuestions = existingQuestions.filter((question) => (
      String(getQuestionAuthorName(question)).trim().toLowerCase() !== 'medsy'
      && (
        question?.questionBankStatus === 'Sent to Question Bank'
        || Boolean(question?.questionBankSentAt)
        || question?.isInstituteQuestion
        || question?.isInstitute
      )
    ))
    const assignedInstituteQuestions = assignInstituteQuestionBankIds(
      [...existingInstituteQuestions, ...pendingPublishedQuestions],
      [
        ...existingQuestions,
        ...readStoredQuestionBankQuestions(),
        ...readUploadedQuestionBankQuestions(),
      ],
    )
    const assignedInstituteById = new Map(
      assignedInstituteQuestions.map((question) => [question.id, question]),
    )
    const nextPublishedQuestions = pendingPublishedQuestions.map((question) => (
      assignedInstituteById.get(question.id) ?? question
    ))
    const nextQuestionIds = new Set(nextPublishedQuestions.map((question) => question.id))
    const mergedQuestions = [
      ...nextPublishedQuestions,
      ...existingQuestions
        .filter((question) => !nextQuestionIds.has(question.id))
        .map((question) => assignedInstituteById.get(question.id) ?? question),
    ]

    window.localStorage.setItem(QUESTION_BANK_PUBLISHED_KEY, JSON.stringify(mergedQuestions))
    window.dispatchEvent(new Event('question-bank-published-questions'))
    setQuestions((current) => current.map((item) => (
      nextQuestionIds.has(item.id)
        ? {
          ...item,
          questionBankId: assignedInstituteById.get(item.id)?.questionBankId,
          source: 'Institute',
          sourceType: 'Institute',
          isInstituteQuestion: true,
          isInstitute: undefined,
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

  const deleteApprovedQuestionEverywhere = (questionId) => {
    if (!questionId) return

    deleteQuestionFromStorage(questionId)
    setQuestions((current) => current.filter((item) => item.id !== questionId))
    setApprovedQuestionBankSelectedIds((current) => current.filter((id) => id !== questionId))
    setApprovalSelectedIds((current) => current.filter((id) => id !== questionId))
    if (selectedQuestionId === questionId) {
      selectQuestionForEditing(null)
    }
    onAlert?.({ tone: 'warning', message: 'Approved question deleted from Question Bank and All Questions.' })
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
    setActiveQuestionTab(activeQuestionTab === 'uploaded' ? 'uploaded' : 'created')
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

  const toggleCreatedQuestionDetails = (questionId) => {
    setOpenCreatedTagsId(null)
    setOpenCreatedQuestionIds((current) => (
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    ))
  }

  const toggleCreatedSubQuestionDetails = (subQuestionId) => {
    setOpenCreatedSubQuestionIds((current) => ({
      ...current,
      [subQuestionId]: !current[subQuestionId],
    }))
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

  const closeApprovalModal = () => {
    setIsApprovalModalOpen(false)
    setPendingUploadApprovalQuestions([])
  }

  const confirmSendSelectedQuestionsToApproval = () => {
    if (pendingUploadApprovalQuestions.length) {
      confirmGeneratedUploadQuestionsToApproval()
      return
    }
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
        descriptiveSections: question.descriptiveSections,
        answerKey: question.answerKey,
      })),
    })

    const sentQuestions = selectedQuestions.map((question) => ({
      ...question,
      status: 'Sent to Approval',
      questionBankStatus: undefined,
      questionBankSentAt: undefined,
    }))
    setQuestions((current) => current.map((item) => {
      const sentQuestion = sentQuestions.find((question) => question.id === item.id)
      return sentQuestion ?? item
    }))
    sentQuestions.filter(isExcelUploadedQuestion).forEach(replaceQuestionInStorage)
    setActiveQuestionTab('sent')
    if (selectedIds.has(selectedQuestionId)) {
      const nextEditable = questions.find((item) => !selectedIds.has(item.id) && !['Sent to Approval', 'Approved'].includes(item.status))
      selectQuestionForEditing(nextEditable?.id ?? null, nextEditable ?? null)
    }
    setIsApprovalModalOpen(false)
    setApprovalNote('')
    cancelApprovalSelection()
    onAlert?.({ tone: 'success', message: 'Selected questions sent to approval.' })
  }

  const handlePrimaryQuestionAction = () => {
    if (!selectedQuestion || isGeneratingQuestion || !canCreateSelectedQuestion) return

    const questionId = selectedQuestion.id
    const outputQuestionType = getDescriptiveOutputType(selectedQuestion, descriptiveBuilderMode)
    const isOutputSaqSingleQuestion = getQuestionTypeMeta(outputQuestionType).shortLabel === 'SAQs'
      && selectedQuestion.clinicalVignetteEnabled !== true

    if (isUpdatingSelectedQuestion) {
      const updatedQuestion = {
        ...selectedQuestion,
        type: outputQuestionType,
        descriptiveBuilderMode,
        descriptiveSections: isOutputSaqSingleQuestion ? [] : selectedQuestion.descriptiveSections,
        title: getQuestionPreview(selectedQuestion).slice(0, 60) || selectedQuestion.title,
        status: 'Created',
        revisionStatus: selectedQuestion.revisionStatus === 'Edited' ? 'Edited' : 'Created',
        approvalReviewRemarks: '',
        approvalReviewedAt: '',
        questionBankStatus: undefined,
        questionBankSentAt: undefined,
        questionBankEditMode: undefined,
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

      setQuestions((current) => [
        ...current.map((item) => (
          item.id === questionId
            ? { ...item, ...updatedQuestion }
            : item
        )),
        nextQuestion,
      ])
      replaceQuestionInStorage(updatedQuestion)
      selectQuestionForEditing(nextQuestion.id, nextQuestion)
      setGenerationCompleteId(null)
      closeMappingPicker()
      clearCreatedReportForQuestion(questionId)
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

    const startedAt = Date.now()
    setIsGeneratingQuestion(true)
    setGenerationProcessorTick(startedAt)
    setGenerationProcessorStartedAt((current) => ({
      ...current,
      [questionId]: startedAt,
    }))
    setGenerationProcessorCompletedIds((current) => current.filter((id) => id !== questionId))
    const existingProcessorTimer = generationProcessorCleanupTimersRef.current.get(questionId)
    if (existingProcessorTimer) {
      window.clearTimeout(existingProcessorTimer)
      generationProcessorCleanupTimersRef.current.delete(questionId)
    }
    setGenerationCompleteId(null)
    setQuestions((current) => [
      ...current.map((item) => (
        item.id === questionId ? { ...item, status: 'Generating' } : item
      )),
      nextQuestion,
    ])
    selectQuestionForEditing(nextQuestion.id, nextQuestion)
    closeMappingPicker()

    window.setTimeout(() => {
      setQuestions((current) => current.map((item) => {
        if (item.id !== questionId) return item

        const needsQuestion = !hasQuestionContent(item)
        const autoFilledCurriculum = getAutoFilledCurriculum(item)
        const needsOptions = item.type === 'MCQ' && !hasMcqOptions(item)
        const needsAnswerKey = !getRichTextPreview(item.answerKey)
        const isDescriptiveItem = isDescriptiveQuestionType(item.type)
        const descriptiveGenerationTarget = isDescriptiveItem ? getResolvedDescriptiveGenerationTarget(item) : null
        const generatedDescriptiveAnswer = isDescriptiveItem
          ? applyGeneratedDescriptiveAnswer(item, generatedDraft.answerKey, descriptiveGenerationTarget)
          : {}
        const generatedDescriptiveMarks = isDescriptiveItem
          ? applyGeneratedDescriptiveMarks({ ...item, ...generatedDescriptiveAnswer }, generatedDraft.marks, descriptiveGenerationTarget)
          : {}
        const generatedOptions = needsOptions
          ? [
            { ...createOption(createHtmlBlock('A clinically relevant application')), distractorErrors: getGeneratedDistractorErrors(0) },
            { ...createOption(createHtmlBlock('An unrelated basic recall point')), distractorErrors: getGeneratedDistractorErrors(1) },
            { ...createOption(createHtmlBlock('A partially correct distractor')), distractorErrors: getGeneratedDistractorErrors(2) },
            { ...createOption(createHtmlBlock('A non-specific explanation')), distractorErrors: getGeneratedDistractorErrors(3) },
          ]
          : asArray(item.options).map((option, optionIndex) => ({
            ...option,
            distractorErrors: (option.distractorErrors ?? []).length
              ? option.distractorErrors
              : getGeneratedDistractorErrors(optionIndex),
          }))

        return {
          ...item,
          type: outputQuestionType,
          descriptiveBuilderMode,
          ...autoFilledCurriculum,
          ...generatedDescriptiveAnswer,
          ...generatedDescriptiveMarks,
          descriptiveSections: isOutputSaqSingleQuestion
            ? []
            : (generatedDescriptiveAnswer.descriptiveSections ?? generatedDescriptiveMarks.descriptiveSections ?? item.descriptiveSections),
          questionText: needsQuestion ? generatedDraft.questionText : item.questionText,
          ...(!isDescriptiveItem ? { answerKey: needsAnswerKey ? generatedDraft.answerKey : item.answerKey } : {}),
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
          questionBankStatus: undefined,
          questionBankSentAt: undefined,
          questionBankEditMode: undefined,
        }
      }))
      setIsGeneratingQuestion(false)
      setGenerationCompleteId(questionId)
      setGenerationProcessorCompletedIds((current) => (current.includes(questionId) ? current : [...current, questionId]))
      const cleanupTimerId = window.setTimeout(() => {
        setGenerationProcessorCompletedIds((current) => current.filter((id) => id !== questionId))
        generationProcessorCleanupTimersRef.current.delete(questionId)
      }, 120000)
      generationProcessorCleanupTimersRef.current.set(questionId, cleanupTimerId)
      onAlert?.({ tone: 'success', message: 'Question created.' })
    }, GENERATION_DELAY_MS)
  }

  const handleSaveDraft = () => {
    if (!selectedQuestion || !canSaveSelectedDraft) return
    const questionId = selectedQuestion.id
    const outputQuestionType = getDescriptiveOutputType(selectedQuestion, descriptiveBuilderMode)
    const nextQuestion = createQuestion(selectedQuestion.type, {
      title: `${getQuestionTypeMeta(selectedQuestion.type).shortLabel} ${questions.length + 1}`,
    })

    setQuestions((current) => [
      ...current.map((item) => (
        item.id === questionId
          ? {
            ...item,
            type: outputQuestionType,
            descriptiveBuilderMode,
            descriptiveSections: isSaqSingleQuestionOutput({ ...item, type: outputQuestionType, descriptiveBuilderMode }) ? [] : item.descriptiveSections,
            title: getQuestionPreview(item).slice(0, 60) || item.title,
            status: 'Draft',
          }
          : item
      )),
      nextQuestion,
    ])
    selectQuestionForEditing(nextQuestion.id, nextQuestion)
    setGenerationCompleteId(null)
    closeMappingPicker()
    onAlert?.({ tone: 'secondary', message: 'Question saved as draft.' })
  }

  const openMappingPicker = (type) => {
    if (isSelectedLaqQuestion && selectedQuestion && !curriculumDraft) {
      setCurriculumDraft({
        year: selectedQuestion.year || getYearForSubject(selectedQuestion.subject),
        subject: selectedQuestion.subject,
        topics: [...(selectedQuestion.topics ?? [])],
        competencies: [...(selectedQuestion.competencies ?? [])],
      })
    }
    if (isSelectedLaqQuestion) {
      setIsCurriculumEditing(true)
      setIsDefaultCurriculumOpen(true)
    }
    setActiveMappingPicker(type)
    setMappingSearchValue('')
  }

  const cancelCurriculumEdit = () => {
    if (selectedQuestion) {
      setCurriculumDraft({
        year: selectedQuestion.year,
        subject: selectedQuestion.subject,
        topics: [...selectedQuestion.topics],
        competencies: [...selectedQuestion.competencies],
      })
    }
    setIsCurriculumEditing(true)
    setIsDefaultCurriculumOpen(true)
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
    setIsCurriculumEditing(true)
    setIsDefaultCurriculumOpen(true)
    closeMappingPicker()
  }

  const updateCurriculumDraft = (updater) => {
    setIsDefaultCurriculumOpen(false)
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

  const handleSelectLaqSubject = (value) => {
    if (!selectedQuestion) return
    const year = selectedQuestion.year || curriculumDraft?.year || getYearForSubject(value)
    const nextDraft = {
      year,
      subject: value,
      topics: [],
      competencies: [],
    }
    setCurriculumDraft(nextDraft)
    setIsCurriculumEditing(true)
    setIsDefaultCurriculumOpen(true)
    updateSelectedQuestion(nextDraft)
    setActiveMappingPicker('topics')
    setMappingSearchValue('')
  }

  const handleToggleLaqTopic = (value) => {
    if (!selectedQuestion) return
    const baseDraft = curriculumDraft ?? selectedQuestion
    const year = baseDraft.year || getYearForSubject(baseDraft.subject)
    const nextTopics = descriptiveBuilderMode === 'SAQs'
      ? [value]
      : toggleSelection(baseDraft.topics ?? [], value)
    const nextCompetencies = (baseDraft.competencies ?? []).filter((entry) => (
      getAvailableCompetencies({ ...baseDraft, year, topics: nextTopics }).some((competency) => competency.value === entry)
    ))
    const nextDraft = {
      year,
      subject: baseDraft.subject,
      topics: nextTopics,
      competencies: nextCompetencies,
    }
    setCurriculumDraft(nextDraft)
    setIsCurriculumEditing(true)
    setIsDefaultCurriculumOpen(true)
    updateSelectedQuestion(nextDraft)
    if (descriptiveBuilderMode === 'SAQs') {
      closeMappingPicker()
    }
  }

  const handleToggleLaqCompetency = (value) => {
    if (!selectedQuestion) return
    const baseDraft = curriculumDraft ?? selectedQuestion
    const isSaqSingleCompetencyMode = descriptiveBuilderMode === 'SAQs' && selectedQuestion.clinicalVignetteEnabled !== true
    const nextDraft = {
      year: baseDraft.year || getYearForSubject(baseDraft.subject),
      subject: baseDraft.subject,
      topics: baseDraft.topics ?? [],
      competencies: isSaqSingleCompetencyMode ? [value] : toggleSelection(baseDraft.competencies ?? [], value),
    }
    setCurriculumDraft(nextDraft)
    setIsCurriculumEditing(true)
    setIsDefaultCurriculumOpen(true)
    updateSelectedQuestion(nextDraft)
    if (isSaqSingleCompetencyMode) {
      closeMappingPicker()
    }
  }

  const toggleSaqClinicalVignette = () => {
    if (!selectedQuestion) return
    updateSelectedQuestion((current) => {
      const nextEnabled = !current.clinicalVignetteEnabled
      const nextBase = {
        ...current,
        questionText: '',
        answerKey: '',
        marks: nextEnabled ? '0' : '',
        competencies: nextEnabled ? current.competencies : (current.competencies ?? []).slice(0, 1),
        clinicalVignetteEnabled: nextEnabled,
      }

      return {
        questionText: '',
        title: nextEnabled ? 'SAQ clinical vignette' : 'SAQ question',
        answerKey: '',
        marks: nextEnabled ? '0' : '',
        images: [],
        competencies: nextEnabled ? current.competencies : (current.competencies ?? []).slice(0, 1),
        clinicalVignetteEnabled: nextEnabled,
        descriptiveSections: nextEnabled ? [createDescriptiveSubQuestion(nextBase)] : [],
      }
    })
    setActiveDescriptiveAnswerTarget({ type: 'root' })
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
      const currentOptions = asArray(item.options)
      const requiredOptionCount = Math.max(minCount, Math.min(currentOptions.length, maxCount))
      const nextOptions = currentOptions.slice(0, maxCount)
      while (nextOptions.length < requiredOptionCount) {
        nextOptions.push(createOption(''))
      }
      const optionIds = new Set(nextOptions.map((option) => option.id))
      const nextCorrectOptionIds = asArray(item.correctOptionIds).filter((id) => optionIds.has(id))

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
      const currentOptions = asArray(item.options)
      if (currentOptions.length >= maxCount) return item

      return {
        ...item,
        options: [...currentOptions, createOption('')],
      }
    })
  }

  const selectOptionDistractorError = (optionId, error) => {
    updateSelectedQuestion((item) => ({
      ...item,
      options: asArray(item.options).map((option) => {
        if (option.id !== optionId) return option
        return {
          ...option,
          distractorErrors: [error],
        }
      }),
    }))
    setOpenDistractorMenuOptionId(null)
  }

  const clearOptionDistractorError = (optionId) => {
    updateSelectedQuestion((item) => ({
      ...item,
      options: asArray(item.options).map((option) => (
        option.id === optionId
          ? { ...option, distractorErrors: [] }
          : option
      )),
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

  const renderDescriptiveCompetencyButton = (target, item, shouldHighlight = false, disabled = false) => {
    const selectedCompetency = item?.competencies?.[0] ?? ''
    const isOpen = getDescriptiveMappingKey(activeDescriptiveMappingTarget) === getDescriptiveMappingKey(target)

    if (!selectedCompetency) {
      return (
        <button
          type="button"
          className={`question-bank-secondary-btn question-bank-descriptive-competency-btn is-icon-only ${shouldHighlight ? 'question-bank-next-action' : ''}`}
          onClick={(event) => {
            setActiveDescriptiveAnswerTarget(target.type === 'inside'
              ? { type: 'inside', sectionId: target.sectionId, childId: target.childId }
              : { type: 'section', sectionId: target.sectionId })
            openDescriptiveCompetencyTooltip(target, item, event.currentTarget)
          }}
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
      <div className={`question-bank-descriptive-competency-chip ${shouldHighlight ? 'question-bank-next-action' : ''}`}>
        <span>{getShortCompetencyLabel(selectedCompetency)}</span>
        <button
        type="button"
          onClick={(event) => {
            setActiveDescriptiveAnswerTarget(target.type === 'inside'
              ? { type: 'inside', sectionId: target.sectionId, childId: target.childId }
              : { type: 'section', sectionId: target.sectionId })
            openDescriptiveCompetencyTooltip(target, item, event.currentTarget)
          }}
          aria-label="Edit competency"
          title="Edit competency"
          disabled={disabled}
        >
          <FilePenLine size={13} strokeWidth={2.2} />
        </button>
      </div>
    )
  }

  const renderDescriptiveCurriculumControls = (target, isChild = false) => {
    const isOpen = getDescriptiveMappingKey(activeDescriptiveMappingTarget) === getDescriptiveMappingKey(target)
    if (!isOpen || !descriptiveCompetencyDraft || typeof document === 'undefined') return null

    const draft = descriptiveCompetencyDraft
    const options = getDescriptiveCompetencyDraftOptions(draft)
    const canApply = Boolean(draft.year && draft.subject && draft.topic && draft.competency)

    return createPortal((
      <div
        className={`question-bank-descriptive-map-popover ${isChild ? 'is-child' : ''} ${draft.position?.opensAbove ? 'is-above' : ''}`}
        style={{
          top: `${draft.position?.top ?? 24}px`,
          left: `${draft.position?.left ?? 24}px`,
          maxHeight: `${draft.position?.maxHeight ?? 420}px`,
          '--question-bank-tooltip-arrow-left': `${draft.position?.arrowLeft ?? 24}px`,
        }}
        role="dialog"
        aria-labelledby="question-bank-descriptive-map-title"
      >
        <div className="question-bank-descriptive-map-head">
          <div>
            <strong id="question-bank-descriptive-map-title">Add Competency</strong>
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
                topicSearch: '',
                competencySearch: '',
                openDropdown: '',
              })}
            >
              <option value="">Select year</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
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
                topicSearch: '',
                competencySearch: '',
                openDropdown: '',
              })}
              disabled={!draft.year}
            >
              <option value="">Select subject</option>
              {options.subjects.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
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
                    <input
                      value={draft.topicSearch}
                      onChange={(event) => updateDescriptiveCompetencyDraft({ topicSearch: event.target.value })}
                      placeholder="Search topic"
                      autoFocus
                    />
                  </label>
                  <div className="question-bank-descriptive-map-options">
                    {options.topics.length ? options.topics.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        className={draft.topic === topic ? 'is-active' : ''}
                        onClick={() => updateDescriptiveCompetencyDraft({
                          topic,
                          competency: '',
                          topicSearch: '',
                          competencySearch: '',
                          openDropdown: '',
                        })}
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
                    <input
                      value={draft.competencySearch}
                      onChange={(event) => updateDescriptiveCompetencyDraft({ competencySearch: event.target.value })}
                      placeholder="Search competency"
                      autoFocus
                    />
                  </label>
                  <div className="question-bank-descriptive-map-options">
                    {options.competencies.length ? options.competencies.map((competency) => (
                      <button
                        key={competency.value}
                        type="button"
                        className={draft.competency === competency.value ? 'is-active' : ''}
                        onClick={() => updateDescriptiveCompetencyDraft({
                          competency: competency.value,
                          competencySearch: '',
                          openDropdown: '',
                        })}
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
          <button type="button" className="question-bank-ghost-btn" onClick={clearDescriptiveCompetencyDraft}>
            Clear
          </button>
          <button type="button" className="question-bank-primary-btn" onClick={applyDescriptiveCompetencyDraft} disabled={!canApply}>
            Apply
          </button>
        </div>
      </div>
    ), document.body)
  }

  const createQuestionTypeCards = (
    <section className="question-bank-create-choice-panel" aria-label="Select question type">
      <h2>Select your question type</h2>
      <div className="question-bank-type-picker is-inline">
        {QUESTION_TYPE_CARDS.slice(0, 1).map((item) => {
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
              <span>{item.menuLabel ?? item.shortLabel}</span>
              {item.isUpcoming ? <small>Upcoming</small> : null}
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
              {CREATE_DESCRIPTIVE_QUESTION_TYPES.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  className="question-bank-type-picker-menu-item"
                  onClick={() => handleCreateQuestion(item.type)}
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
        {QUESTION_TYPE_CARDS.slice(1).map((item) => {
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
              <span>{item.menuLabel ?? item.shortLabel}</span>
              {item.isUpcoming ? <small>Upcoming</small> : null}
            </button>
          )
        })}
      </div>
    </section>
  )

  const approvalQuestionTabs = [
    { id: 'sent', label: 'Pending', count: sentApprovalQuestionCards.length },
    { id: 'approved', label: 'Approved', count: approvedQuestionCards.length },
    { id: 'report', label: 'Reported', count: reportQuestionCards.length },
    { id: 'rejected', label: 'Disapproved', count: rejectedQuestionCards.length },
  ]
  const approvalStatusTabIds = approvalQuestionTabs.map((item) => item.id)
  const isApprovalStatusTab = approvalStatusTabIds.includes(activeQuestionTab)
  const approvalStatusCount = approvalQuestionTabs.reduce((total, item) => total + item.count, 0)
  const approvalStatusTabs = isApprovalStatusTab ? (
    <div className="question-bank-approval-status-tabs" role="tablist" aria-label="Approval status filters">
      {approvalQuestionTabs.map((item) => (
        <button
          key={item.id}
          type="button"
          className={activeQuestionTab === item.id ? 'is-active' : ''}
          onClick={() => setActiveQuestionTab(item.id)}
          role="tab"
          aria-selected={activeQuestionTab === item.id}
        >
          <span>{item.label}</span>
          <small>{item.count}</small>
        </button>
      ))}
    </div>
  ) : null

  const questionBankTabs = (
    <aside className="question-bank-side-tabs" role="tablist" aria-label="Question bank sections">
      <button
        type="button"
        className={activeQuestionTab === 'create' ? 'is-active' : ''}
        onClick={() => {
          setActiveQuestionTab('create')
          if (selectedQuestion) {
            selectQuestionForEditing(null)
          }
        }}
        role="tab"
        aria-selected={activeQuestionTab === 'create'}
      >
        <span>
          {selectedQuestion ? (
            <CornerUpLeft size={14} strokeWidth={2.4} aria-hidden="true" />
          ) : (
            <FilePenLine size={14} strokeWidth={2.3} aria-hidden="true" />
          )}
          {selectedQuestion ? 'Back to Select Question' : 'Create New Question'}
        </span>
      </button>
      <button
        type="button"
        className={activeQuestionTab === 'uploaded' ? 'is-active' : ''}
        onClick={() => setActiveQuestionTab('uploaded')}
        role="tab"
        aria-selected={activeQuestionTab === 'uploaded'}
      >
        <span>
          <Upload size={14} strokeWidth={2.3} aria-hidden="true" />
          Upload Question
        </span>
        <small>{uploadedQuestionCards.length}</small>
      </button>
      <button
        type="button"
        className={`${activeQuestionTab === 'created' ? 'is-active' : ''} ${createdQuestionCards.length > 0 ? 'has-count' : ''}`.trim()}
        onClick={() => {
          if (hasQuestionBankGenerationProcessorRunning) return
          setActiveQuestionTab('created')
        }}
        disabled={hasQuestionBankGenerationProcessorRunning}
        title={hasQuestionBankGenerationProcessorRunning ? 'Generated Questions will be available after generation completes.' : undefined}
        role="tab"
        aria-selected={activeQuestionTab === 'created'}
        aria-disabled={hasQuestionBankGenerationProcessorRunning}
      >
        <span>
          <Sparkles size={14} strokeWidth={2.3} aria-hidden="true" />
          Generated Questions
        </span>
        <small>{createdQuestionCards.length}</small>
      </button>
      <button
        type="button"
        className={activeQuestionTab === 'draft' ? 'is-active' : ''}
        onClick={() => setActiveQuestionTab('draft')}
        role="tab"
        aria-selected={activeQuestionTab === 'draft'}
      >
        <span>
          <FilePenLine size={14} strokeWidth={2.3} aria-hidden="true" />
          My Draft
        </span>
        <small>{draftQuestionCards.length}</small>
      </button>
      <button
        type="button"
        className={isApprovalStatusTab ? 'is-active' : ''}
        onClick={() => setActiveQuestionTab('sent')}
        role="tab"
        aria-selected={isApprovalStatusTab}
      >
        <span>
          <ListChecks size={14} strokeWidth={2.3} aria-hidden="true" />
          Status Filter
        </span>
        <small>{approvalStatusCount}</small>
      </button>
    </aside>
  )

  const renderLaqMappingDropdown = (type) => {
    if (activeMappingPicker !== type || !curriculumDraft) return null
    const isInlineMapping = !isSelectedLaqQuestion
    const isSaqBuilderMode = descriptiveBuilderMode === 'SAQs'
    const isSaqSingleCompetencyMode = isSaqBuilderMode && selectedQuestion?.clinicalVignetteEnabled !== true

    const items = type === 'subjects'
      ? availableSubjects
      : type === 'topics'
        ? availableTopics
        : availableCompetencies
    const selected = type === 'subjects'
      ? [curriculumDraft.subject].filter(Boolean)
      : type === 'topics'
        ? curriculumDraft.topics
        : isSaqSingleCompetencyMode
          ? (curriculumDraft.competencies ?? []).slice(0, 1)
          : curriculumDraft.competencies
    const query = mappingSearchValue.trim().toLowerCase()
    const selectedSet = new Set(selected)
    const visibleItems = items
      .filter((item) => getOptionLabel(item).toLowerCase().includes(query))
      .slice(0, 80)
    const isMulti = !isInlineMapping && ((type === 'competencies' && !isSaqSingleCompetencyMode) || (type === 'topics' && !isSaqBuilderMode))
    const title = type === 'subjects' ? 'subject' : type === 'topics' ? 'topics' : 'competency'
    const emptyLabel = type === 'subjects'
      ? 'Try another subject keyword.'
      : type === 'topics'
        ? 'Try another topic keyword.'
        : 'Select topics first or try another competency keyword.'

    const handleSelectAll = () => {
      if (type === 'topics') {
        if (isSaqBuilderMode) return
        if (isSelectedLaqQuestion && selectedQuestion) {
          const baseDraft = curriculumDraft ?? selectedQuestion
          const year = baseDraft.year || getYearForSubject(baseDraft.subject)
          const nextTopics = visibleItems.map(getOptionValue)
          const nextCompetencies = (baseDraft.competencies ?? []).filter((entry) => (
            getAvailableCompetencies({ ...baseDraft, year, topics: nextTopics }).some((competency) => competency.value === entry)
          ))
          const nextDraft = { year, subject: baseDraft.subject, topics: nextTopics, competencies: nextCompetencies }
          setCurriculumDraft(nextDraft)
          updateSelectedQuestion(nextDraft)
          return
        }
        updateCurriculumDraft((item) => {
          const nextTopics = visibleItems.map(getOptionValue)
          const nextCompetencies = item.competencies.filter((entry) => (
            getAvailableCompetencies({ ...item, topics: nextTopics }).some((competency) => competency.value === entry)
          ))
          return { ...item, topics: nextTopics, competencies: nextCompetencies }
        })
      } else if (type === 'competencies') {
        if (isSaqSingleCompetencyMode) return
        const baseDraft = curriculumDraft ?? selectedQuestion
        const nextDraft = {
          year: baseDraft.year || getYearForSubject(baseDraft.subject),
          subject: baseDraft.subject,
          topics: baseDraft.topics ?? [],
          competencies: visibleItems.map(getOptionValue),
        }
        setCurriculumDraft(nextDraft)
        updateSelectedQuestion(nextDraft)
      }
    }

    const handleClear = () => {
      if (type === 'topics') {
        if (isSelectedLaqQuestion && selectedQuestion) {
          const baseDraft = curriculumDraft ?? selectedQuestion
          const nextDraft = {
            year: baseDraft.year || getYearForSubject(baseDraft.subject),
            subject: baseDraft.subject,
            topics: [],
            competencies: [],
          }
          setCurriculumDraft(nextDraft)
          updateSelectedQuestion(nextDraft)
          return
        }
        updateCurriculumDraft((item) => ({ ...item, topics: [], competencies: [] }))
      } else if (type === 'competencies') {
        const baseDraft = curriculumDraft ?? selectedQuestion
        const nextDraft = {
          year: baseDraft.year || getYearForSubject(baseDraft.subject),
          subject: baseDraft.subject,
          topics: baseDraft.topics ?? [],
          competencies: [],
        }
        setCurriculumDraft(nextDraft)
        updateSelectedQuestion(nextDraft)
      }
    }

    return (
      <div className={`${isInlineMapping ? 'question-bank-inline-map-dropdown' : 'question-bank-laq-dropdown'} is-${type}`} role="listbox" aria-label={`Select ${title}`}>
        <label className={isInlineMapping ? 'question-bank-inline-map-search' : 'question-bank-laq-dropdown-search'}>
          <Search size={15} strokeWidth={2.1} />
          <input
            value={mappingSearchValue}
            onChange={(event) => setMappingSearchValue(event.target.value)}
            placeholder={`Search ${title}`}
            autoFocus
          />
        </label>

        {isMulti ? (
          <div className={isInlineMapping ? 'question-bank-inline-map-actions' : 'question-bank-laq-dropdown-actions'}>
            <button type="button" onClick={handleSelectAll}>
              <Check size={13} strokeWidth={2.4} />
              Select All
            </button>
            <button type="button" onClick={handleClear} disabled={!selected.length}>
              <X size={13} strokeWidth={2.4} />
              Clear
            </button>
          </div>
        ) : null}

        <div className={isInlineMapping ? 'question-bank-inline-map-list' : 'question-bank-laq-dropdown-list'}>
          {visibleItems.length ? visibleItems.map((item) => {
            const value = getOptionValue(item)
            const isActive = selectedSet.has(value)
            return (
              <button
                key={value}
                type="button"
                className={`${isInlineMapping ? 'question-bank-inline-map-option' : 'question-bank-laq-dropdown-option'} ${isActive ? 'is-active' : ''}`}
                onClick={() => {
                  if (!isSelectedLaqQuestion) {
                    if (type === 'subjects') {
                      const nextDraft = {
                        ...curriculumDraft,
                        year: getYearForSubject(value),
                        subject: value,
                        topics: [],
                        competencies: [],
                      }
                      setCurriculumDraft(nextDraft)
                      updateSelectedQuestion(nextDraft)
                      setActiveMappingPicker('topics')
                      setMappingSearchValue('')
                      return
                    }
                    if (type === 'topics') {
                      const nextTopics = [value]
                      const nextCompetencies = (curriculumDraft.competencies ?? []).filter((entry) => (
                        getAvailableCompetencies({ ...curriculumDraft, topics: nextTopics }).some((competency) => competency.value === entry)
                      ))
                      const nextDraft = { ...curriculumDraft, topics: nextTopics, competencies: nextCompetencies }
                      setCurriculumDraft(nextDraft)
                      updateSelectedQuestion(nextDraft)
                      closeMappingPicker()
                      return
                    }
                    const nextDraft = {
                      ...curriculumDraft,
                      competencies: [value],
                    }
                    setCurriculumDraft(nextDraft)
                    updateSelectedQuestion(nextDraft)
                    closeMappingPicker()
                    return
                  }
                  if (type === 'subjects') {
                    handleSelectLaqSubject(value)
                    return
                  }
                  if (type === 'topics') {
                    handleToggleLaqTopic(value)
                    return
                  }
                  handleToggleLaqCompetency(value)
                }}
                role="option"
                aria-selected={isActive}
              >
                <span className={isInlineMapping ? 'question-bank-inline-map-check' : 'question-bank-laq-dropdown-check'} aria-hidden="true">
                  {isActive ? <Check size={12} strokeWidth={2.7} /> : null}
                </span>
                <strong>{getOptionLabel(item)}</strong>
              </button>
            )
          }) : (
            <div className={isInlineMapping ? 'question-bank-inline-map-empty' : 'question-bank-laq-dropdown-empty'}>
              <strong>No matches</strong>
              <p>{emptyLabel}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className={`question-bank-page is-${normalizedMode}`}>
      <div className="question-bank-layout">
        <main className="question-bank-main">
          <section className="question-bank-create-page-head" aria-label="Question bank page navigation">
            <PageNavigationHeader items={['My Pages', 'Assessment Suite', 'My Questions']} />
          </section>
          <aside className="question-bank-create-right-rail" aria-label="Question bank create actions">
            {questionBankTabs}
            <GenerationProcessorCard rows={questionBankGenerationProcessorRows} />
          </aside>

          <section className="question-bank-tab-shell">
            <section className={`question-bank-tab-card ${activeQuestionTab === 'uploaded' ? 'is-uploaded-tab' : ''}`}>
            {activeQuestionTab === 'uploaded' ? (
            <section className="question-bank-upload-import-panel" aria-label="Upload questions from Excel template">
              <div className="question-bank-upload-import-head">
                <div className="question-bank-upload-import-copy">
                  <span className="question-bank-upload-import-icon">
                    <Upload size={18} strokeWidth={2.3} />
                  </span>
                  <div>
                    <strong>Upload questions</strong>
                    <p>Download a template, complete it in Excel, then upload the CSV for validation.</p>
                  </div>
                </div>
              </div>

              <div className="question-bank-upload-import-actions">
                <div className="question-bank-upload-template-grid" aria-label="Question upload templates">
                  <span className="question-bank-upload-template-label">Download :</span>
                  <button
                    type="button"
                    className="question-bank-upload-template-btn"
                    onClick={() => handleDownloadUploadTemplate('MCQ')}
                  >
                    <Download size={13} strokeWidth={2.2} />
                    MCQ Sample Excel
                  </button>
                  <span className="question-bank-upload-template-menu-wrap">
                    <button
                      type="button"
                      className="question-bank-upload-template-btn"
                      onClick={() => setIsUploadTemplateMenuOpen((current) => !current)}
                      aria-expanded={isUploadTemplateMenuOpen}
                      aria-haspopup="menu"
                      disabled
                    >
                      <Download size={13} strokeWidth={2.2} />
                      Descriptive Sample Excel
                      <ChevronDown size={13} strokeWidth={2.3} />
                    </button>
                    {isUploadTemplateMenuOpen ? (
                      <span className="question-bank-upload-template-menu" role="menu">
                        {['LAQs', 'SAQs', 'MEQs'].map((typeKey) => (
                          <button
                            key={typeKey}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              handleDownloadUploadTemplate(typeKey)
                              setIsUploadTemplateMenuOpen(false)
                            }}
                          >
                            <Download size={13} strokeWidth={2.2} />
                            {typeKey} Sample Excel
                          </button>
                        ))}
                      </span>
                    ) : null}
                  </span>
                </div>
                <button type="button" className="question-bank-upload-question-btn" onClick={openUploadWizard}>
                  <Upload size={15} strokeWidth={2.4} />
                  Upload Question
                </button>
              </div>
            </section>
          ) : null}

            {activeQuestionTab === 'create' && !selectedQuestion ? (
            <div className={`question-bank-create-strip ${!selectedQuestion ? 'has-empty-state' : ''}`}>
              {createQuestionTypeCards}
            </div>
          ) : null}

            {selectedQuestion || isListQuestionTab ? (
            <div className="question-bank-workspace">
              <div className="question-bank-editor">
                {activeQuestionTab === 'create' && selectedQuestion ? (
                <section className={`question-bank-author-card ${selectedQuestion.isCritical ? 'is-critical' : ''} ${isSelectedLaqQuestion ? 'is-laq-flow' : ''} ${selectedQuestion.type === 'MCQ' ? 'is-mcq-flow' : ''}`}>
                  {!isSelectedLaqQuestion && selectedQuestion.type === 'MCQ' ? (
                    <div className="question-bank-mcq-topbar">
                      <div className="question-bank-laq-tab-head">
                        <span className="question-bank-laq-title-wrap">
                          <button
                            type="button"
                            className="question-bank-laq-back-btn"
                            onClick={() => selectQuestionForEditing(null)}
                            aria-label="Back to select question"
                            title="Back to select question"
                          >
                            <ArrowLeft size={15} strokeWidth={2.4} />
                          </button>
                          <h2>Multiple Choice Question (MCQ)</h2>
                        </span>
                      </div>
                    </div>
                  ) : null}
                  <div className="question-bank-author-grid">
                    <div className="question-bank-author-main">
                      {shouldShowSelectedCurriculumPanel ? (
                      <section className={`question-bank-curriculum-panel ${isSelectedLaqQuestion ? 'is-laq-flow' : ''}`}>
                        {isCurriculumEditing ? (
                          <div className={`question-bank-curriculum-edit-card ${isSelectedLaqQuestion ? 'is-laq-flow' : ''}`}>
                            {!isSelectedLaqQuestion ? (
                              <div className="question-bank-curriculum-grid is-inline-map">
                                <div className="question-bank-field question-bank-inline-map-field">
                                  <button
                                    type="button"
                                    className="question-bank-inline-map-trigger question-bank-mapping-trigger"
                                    onClick={() => openMappingPicker('subjects')}
                                  >
                                    <span className="question-bank-inline-map-label">Subject <em>*</em> :</span>
                                    <span className="question-bank-inline-map-value">{curriculumDraft?.subject || 'Select Subject'}</span>
                                    <ChevronDown size={15} strokeWidth={2.4} />
                                  </button>
                                  {renderLaqMappingDropdown('subjects')}
                                </div>

                                <div className="question-bank-field question-bank-inline-map-field">
                                  <button
                                    type="button"
                                    className="question-bank-inline-map-trigger question-bank-mapping-trigger"
                                    onClick={() => openMappingPicker('topics')}
                                  >
                                    <span className="question-bank-inline-map-label">Topics <em>*</em> :</span>
                                    <span className="question-bank-inline-map-value">{getSelectionSummary(curriculumDraft?.topics ?? [], 'Select Topics')}</span>
                                    <ChevronDown size={15} strokeWidth={2.4} />
                                  </button>
                                  {renderLaqMappingDropdown('topics')}
                                </div>

                                <div className="question-bank-field question-bank-inline-map-field">
                                  <button
                                    type="button"
                                    className="question-bank-inline-map-trigger question-bank-mapping-trigger"
                                    onClick={() => openMappingPicker('competencies')}
                                  >
                                    <span className="question-bank-inline-map-label">Competency <em>*</em> :</span>
                                    <span className="question-bank-inline-map-value">
                                      {getSelectionSummary(
                                        curriculumDraft?.competencies ?? [],
                                        'Select Competency',
                                        getShortCompetencyLabel,
                                      )}
                                    </span>
                                    <ChevronDown size={15} strokeWidth={2.4} />
                                  </button>
                                  {renderLaqMappingDropdown('competencies')}
                                </div>
                              </div>
                            ) : null}
                            {!isDefaultCurriculumOpen && isSelectedLaqQuestion ? (
                              <div className="question-bank-curriculum-actions">
                                <button type="button" className="question-bank-secondary-btn" onClick={cancelCurriculumEdit}>
                                  Cancel
                                </button>
                                <button type="button" className="question-bank-primary-btn" onClick={applyCurriculumEdit}>
                                  Apply
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </section>
                      ) : null}

                      {!isSelectedLaqQuestion ? (
                      <div className="question-bank-assessment-panel question-bank-assessment-inline">
                        {selectedQuestion.type === 'MCQ' ? (
                          <div className="question-bank-section-head">
                            <div>
                              <strong>Assessment Tags</strong>
                            </div>
                          </div>
                        ) : null}
                        {!isOptionalTagsOpen ? (
                          <div className={shouldShowSelectedSubQuestionFlow ? 'question-bank-laq-assessment-row' : 'question-bank-assessment-default-fields'}>
                            <label className="question-bank-field">
                              {!shouldShowSelectedSubQuestionFlow ? (
                              <span>Question Category</span>
                              ) : null}
                              <select
                                className={!selectedQuestion.questionCategory ? 'is-placeholder' : ''}
                                value={getQuestionCategorySelectValue(selectedQuestion.type, selectedQuestion.questionCategory)}
                                onChange={(event) => updateSelectedQuestion({ questionCategory: event.target.value })}
                              >
                                <option value="" disabled>Select Category</option>
                                {getQuestionCategorySelectOptions(selectedQuestion.type).map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </label>

                            <label className="question-bank-field">
                              {!shouldShowSelectedSubQuestionFlow ? (
                              <span>Cognitive Level</span>
                              ) : null}
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
                              {!shouldShowSelectedSubQuestionFlow ? (
                              <span>Thinking Level</span>
                              ) : null}
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
                              {!shouldShowSelectedSubQuestionFlow ? (
                              <span>Difficulty Level</span>
                              ) : null}
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
                          </div>
                        ) : null}

                        {!isOptionalTagsOpen && !shouldShowSelectedSubQuestionFlow && selectedQuestion.type !== 'MCQ' ? (
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
                        {selectedQuestion.type === 'MCQ' ? (
                          <span className="question-bank-assessment-actions question-bank-mcq-question-actions">
                            <button
                              type="button"
                              className="question-bank-secondary-btn"
                              onClick={handleSaveDraft}
                              disabled={!canSaveSelectedDraft}
                            >
                              Save as Draft
                            </button>
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
                                  {isUpdatingSelectedQuestion ? 'Update' : 'Generate'}
                                </>
                              )}
                            </button>
                          </span>
                        ) : null}
                      </div>
                      ) : null}

                      {(() => {
                        const isDescriptiveSelected = isDescriptiveQuestionType(selectedQuestion.type)
                        const selectedOptions = asArray(selectedQuestion.options)
                        const selectedCorrectOptionIds = asArray(selectedQuestion.correctOptionIds)
                        const selectedFillBlankAnswers = asArray(selectedQuestion.fillBlankAnswers)
                        const descriptiveSections = selectedQuestion.descriptiveSections ?? []
                        const hasRootQuestionText = Boolean(getRichTextPreview(selectedQuestion.questionText))
                        const rootFieldKey = `${selectedQuestion.id}:root`
                        const isLaqBuilderMode = isSelectedLaqQuestion && descriptiveBuilderMode === 'LAQs'
                        const isSaqBuilderMode = isSelectedLaqQuestion && descriptiveBuilderMode === 'SAQs'
                        const isSaqClinicalVignetteEnabled = isSaqBuilderMode && selectedQuestion.clinicalVignetteEnabled === true
                        const shouldShowCaseStemBlock = isLaqBuilderMode || isSaqClinicalVignetteEnabled
                        const shouldShowSubQuestionFlow = isLaqBuilderMode || isSaqClinicalVignetteEnabled
                        const isSaqSingleQuestionFlow = isSaqBuilderMode && !isSaqClinicalVignetteEnabled
                        const shouldLockRootQuestion = !isLaqBuilderMode && isDescriptiveSelected && descriptiveSections.length > 0 && !isDescriptiveFieldEditable(rootFieldKey)
                        const descriptiveMarksTotal = isDescriptiveSelected ? getDescriptiveQuestionMarksTotal(selectedQuestion) : 0
                        const laqCurriculum = curriculumDraft ?? selectedQuestion
                        const activeDescriptiveAnswerValue = getActiveDescriptiveAnswerValue()
                        const visibleDescriptiveAnswerValue = isAutoGeneratedDescriptiveAnswer(activeDescriptiveAnswerValue)
                          ? ''
                          : activeDescriptiveAnswerValue
                        const lastDescriptiveSection = descriptiveSections[descriptiveSections.length - 1]
                        const lastDescriptiveSectionChildren = lastDescriptiveSection?.children ?? []
                        const lastDescriptiveInsideQuestion = lastDescriptiveSectionChildren[lastDescriptiveSectionChildren.length - 1]
                        const canAddSubQuestion = hasRootQuestionText && (
                          !lastDescriptiveSection
                          || (lastDescriptiveSectionChildren.length
                            ? isDescriptiveLeafRowComplete(lastDescriptiveInsideQuestion)
                            : isDescriptiveSectionComplete(lastDescriptiveSection))
                        )

                        return (
                      <section className={`question-bank-soft-panel question-bank-answer-panel ${isSelectedLaqQuestion ? 'is-laq-flow' : ''}`}>
                        {isSelectedLaqQuestion ? (
                          <div className="question-bank-laq-topbar">
                            <div className="question-bank-laq-tab-head">
                              <span className="question-bank-laq-title-wrap">
                                <button
                                  type="button"
                                  className="question-bank-laq-back-btn"
                                  onClick={() => selectQuestionForEditing(null)}
                                  aria-label="Back to select question"
                                  title="Back to select question"
                                >
                                  <ArrowLeft size={15} strokeWidth={2.4} />
                                </button>
                                <h2>{descriptiveBuilderMode === 'SAQs' ? 'Short Answer Question (SAQs)' : 'Long Answer Question (LAQs)'}</h2>
                              </span>
                              <div className="question-bank-laq-mode-toggle" role="group" aria-label="Descriptive question type">
                                {['LAQs', 'SAQs'].map((modeOption) => (
                                  <button
                                    key={modeOption}
                                    type="button"
                                    className={descriptiveBuilderMode === modeOption ? 'is-active' : ''}
                                    onClick={() => requestDescriptiveBuilderModeChange(modeOption)}
                                    aria-pressed={descriptiveBuilderMode === modeOption}
                                  >
                                    {modeOption}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="question-bank-laq-control-row">
                              <div className="question-bank-laq-case-mapping">
                                <div className="question-bank-laq-map-field">
                                  <button
                                    type="button"
                                    className="question-bank-laq-map-trigger"
                                    onClick={() => openMappingPicker('subjects')}
                                    aria-expanded={activeMappingPicker === 'subjects'}
                                  >
                                    <span>
                                      <small>Subject <b className="question-bank-required-star">*</b></small>
                                      {laqCurriculum?.subject || 'Select Subject'}
                                    </span>
                                    <ChevronDown size={14} strokeWidth={2.3} />
                                  </button>
                                  {renderLaqMappingDropdown('subjects')}
                                </div>
                                <div className="question-bank-laq-map-field">
                                  <button
                                    type="button"
                                    className="question-bank-laq-map-trigger"
                                    onClick={() => openMappingPicker('topics')}
                                    aria-expanded={activeMappingPicker === 'topics'}
                                    disabled={!laqCurriculum?.subject}
                                  >
                                    <span>
                                      <small>Topics <b className="question-bank-required-star">*</b></small>
                                      {getSelectionSummary(laqCurriculum?.topics ?? [], 'Select Topics')}
                                    </span>
                                    <ChevronDown size={14} strokeWidth={2.3} />
                                  </button>
                                  {renderLaqMappingDropdown('topics')}
                                </div>
                                {isSaqBuilderMode ? (
                                  <div className="question-bank-laq-map-field question-bank-saq-competency-field">
                                    <button
                                      type="button"
                                      className="question-bank-laq-map-trigger"
                                      onClick={() => openMappingPicker('competencies')}
                                      aria-expanded={activeMappingPicker === 'competencies'}
                                      disabled={!(laqCurriculum?.topics ?? []).length}
                                    >
                                      <span>
                                        <small>Competency <b className="question-bank-required-star">*</b></small>
                                        {getSelectionSummary(
                                          isSaqClinicalVignetteEnabled
                                            ? (laqCurriculum?.competencies ?? [])
                                            : (laqCurriculum?.competencies ?? []).slice(0, 1),
                                          'Select Competency',
                                          getShortCompetencyLabel,
                                        )}
                                      </span>
                                      <ChevronDown size={14} strokeWidth={2.3} />
                                    </button>
                                    {renderLaqMappingDropdown('competencies')}
                                  </div>
                                ) : null}
                                {isSaqBuilderMode ? (
                                  <div className="question-bank-saq-vignette-toggle-card">
                                    <div className="question-bank-saq-vignette-toggle-row">
                                      <span>Clinical Vignette</span>
                                      <div className="question-bank-saq-vignette-toggle" role="group" aria-label="Clinical vignette">
                                        {[
                                          { label: 'Yes', value: true },
                                          { label: 'No', value: false },
                                        ].map((option) => (
                                          <button
                                            key={option.label}
                                            type="button"
                                            className={isSaqClinicalVignetteEnabled === option.value ? 'is-active' : ''}
                                            onClick={() => {
                                              if (isSaqClinicalVignetteEnabled !== option.value) {
                                                toggleSaqClinicalVignette()
                                              }
                                            }}
                                            aria-pressed={isSaqClinicalVignetteEnabled === option.value}
                                          >
                                            {option.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <p className="question-bank-saq-vignette-mode-note">
                                      {isSaqClinicalVignetteEnabled ? (
                                        <>
                                          <strong>Mode 2 (SAQ with Sub-Questions):</strong> Short structured question divided into 2 parts. Clinical vignette is optional. You map a separate <strong>NMC Competency Code</strong> to each sub-question row (e.g. 2M + 3M = 5M).
                                        </>
                                      ) : (
                                        <>
                                          <strong>Mode 1 (SAQ without Sub-Questions):</strong> A single direct short note question. Clinical vignette is optional. You map <strong>1 single NMC Competency Code</strong> to the entire marks.
                                        </>
                                      )}
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ) : null}
                        {!isSaqBuilderMode || shouldShowCaseStemBlock ? (
                        <div className={shouldShowCaseStemBlock ? 'question-bank-laq-case-stem-block' : undefined}>
                          <div className="question-bank-section-head">
                            <div>
                              <span className="question-bank-step-title-row">
                                {shouldShowCaseStemBlock ? (
                                  <Stethoscope className="question-bank-laq-case-stem-icon" size={14} strokeWidth={2.3} />
                                ) : null}
                                <strong className="question-bank-step-title">
                                  {shouldShowCaseStemBlock ? 'Clinical Vignette / Case Stem' : 'Question'}
                                </strong>
                                {!shouldShowCaseStemBlock ? (
                                  <span className="question-bank-required-star" aria-hidden="true">*</span>
                                ) : null}
                              </span>
                            </div>
                            <div className="question-bank-question-head-controls">
                              {shouldShowCaseStemBlock && !(selectedQuestion.images?.length ?? 0) ? (
                                <label className="question-bank-question-image-add question-bank-laq-reference-image-add" aria-label="Add reference image">
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

                              {!shouldShowCaseStemBlock && !isSaqBuilderMode && !(selectedQuestion.images?.length ?? 0) ? (
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

                              {!isSelectedLaqQuestion && selectedQuestion.type !== 'MCQ' ? (
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
                              ) : null}

                              {!isLaqBuilderMode && !isSaqClinicalVignetteEnabled ? (
                                <label className="question-bank-question-head-field question-bank-question-head-marks">
                                  <span>Marks</span>
                                  <input
                                    value={isDescriptiveSelected ? String(descriptiveMarksTotal) : selectedQuestion.marks}
                                    onChange={(event) => updateSelectedQuestion({ marks: event.target.value })}
                                    disabled={isDescriptiveSelected ? shouldShowSubQuestionFlow && descriptiveSections.length > 0 : shouldLockRootQuestion}
                                  />
                                </label>
                              ) : null}
                            </div>
                          </div>

                          <label className="question-bank-field rich">
                            <RichMathEditor
                              value={selectedQuestion.questionText}
                              onChange={(nextValue) => updateSelectedQuestion((current) => {
                                const nextPreview = getRichTextPreview(nextValue)
                                const shouldAutoMark = isDescriptiveQuestionType(current.type)
                                  && !(current.descriptiveSections ?? []).length
                                  && Boolean(nextPreview)
                                  && !hasVisibleMarks(current.marks)
                                const nextMarks = shouldAutoMark ? getAutoGeneratedDescriptiveMarks() : current.marks
                                const isMainAnswerEnabled = isDescriptiveQuestionType(current.type)
                                  && !(current.descriptiveSections ?? []).length
                                const shouldAutoAnswer = isDescriptiveQuestionType(current.type)
                                  && isMainAnswerEnabled
                                  && !(current.descriptiveSections ?? []).length
                                  && Boolean(nextPreview)
                                  && !getRichTextPreview(current.answerKey)

                                return {
                                  questionText: nextValue,
                                  title: nextPreview.slice(0, 60) || current.title,
                                  ...(shouldAutoMark ? { marks: nextMarks } : {}),
                                  ...(shouldAutoAnswer ? { answerKey: getAutoGeneratedDescriptiveAnswer(nextValue, nextMarks) } : {}),
                                }
                              })}
                              onFocus={() => setActiveDescriptiveAnswerTarget({ type: 'root' })}
                              placeholder={shouldShowCaseStemBlock ? 'A 45-year-old male presents to the ED with severe retrosternal pain radiating to the left arm...' : 'Enter your question here'}
                              minRows={3}
                              ariaLabel="Question text"
                              allowPastedImages={false}
                              readOnly={shouldLockRootQuestion && !shouldShowCaseStemBlock}
                              onPasteImageRejected={() => onAlert?.({ tone: 'warning', message: 'Images are not supported in question text.' })}
                            />
                            {shouldLockRootQuestion && !isLaqBuilderMode && !shouldShowCaseStemBlock ? (
                              <button
                                type="button"
                                className="question-bank-field-edit-btn"
                                onClick={() => {
                                  enableDescriptiveFieldEdit(rootFieldKey)
                                  setActiveDescriptiveAnswerTarget({ type: 'root' })
                                }}
                                aria-label="Edit main question"
                                title="Edit main question"
                              >
                                <FilePenLine size={14} strokeWidth={2.2} />
                              </button>
                            ) : null}
                          </label>
                        </div>
                        ) : null}

                        {(!isSaqBuilderMode || shouldShowCaseStemBlock) && (selectedQuestion.images?.length ?? 0) ? (
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

                      {isDescriptiveSelected ? (
                        <div className="question-bank-descriptive-builder">
                          {shouldShowSubQuestionFlow ? (
                            <div className="question-bank-descriptive-builder-foot is-laq-case-stem-actions">
                              <strong className="question-bank-laq-subheading">
                                <FolderTree size={14} strokeWidth={2.3} aria-hidden="true" />
                                {isSaqBuilderMode ? 'SAQ Questions & Mark Distribution' : 'Sub-Questions & Mark Distribution'}
                              </strong>
                              <div className="question-bank-question-head-controls">
                                <span className="question-bank-laq-weightage-summary">
                                  Total Weightage : <strong>{String(Number(descriptiveMarksTotal) || 0).padStart(2, '0')} Marks</strong>
                                </span>
                              </div>
                            </div>
                          ) : null}

                          {shouldShowSubQuestionFlow && descriptiveSections.length ? (
                            <div className="question-bank-descriptive-sub-list">
                              {descriptiveSections.map((section, sectionIndex) => {
                                const sectionLabel = `${ROMAN_NUMERALS[sectionIndex] ?? sectionIndex + 1}.`
                                const sectionChildren = section.children ?? []
                                const sectionFieldKey = `${selectedQuestion.id}:section:${section.id}`
                                const shouldLockSectionQuestion = sectionChildren.length > 0 && !isDescriptiveFieldEditable(sectionFieldKey)
                                const sectionTarget = { type: 'section', sectionId: section.id }
                                const isSectionActive = activeDescriptiveAnswerTarget.type === 'section' && activeDescriptiveAnswerTarget.sectionId === section.id
                                const shouldShowSectionControls = isSectionActive && !sectionChildren.length
                                const hasSectionText = Boolean(getRichTextPreview(section.questionText))
                                const hasSectionMapping = Boolean((section.topics ?? []).length || (section.competencies ?? []).length)
                                const shouldHighlightSectionText = !hasSectionText
                                const shouldHighlightSectionMapping = shouldShowSectionControls && hasSectionText && !hasSectionMapping
                                const shouldHighlightSectionMarks = shouldShowSectionControls && hasSectionText && hasSectionMapping && !hasVisibleMarks(section.marks)
                                const lastInsideQuestion = sectionChildren[sectionChildren.length - 1]
                                const canAddInsideQuestion = hasSectionText && (!lastInsideQuestion || isDescriptiveLeafRowComplete(lastInsideQuestion))
                                if (shouldShowSubQuestionFlow) {
                                  const selectedCompetency = section.competencies?.[0] ?? ''
                                  const laqSectionCompetencies = getAvailableCompetencies({
                                    ...selectedQuestion,
                                    year: selectedQuestion.year || getYearForSubject(selectedQuestion.subject),
                                    subject: selectedQuestion.subject,
                                    topics: selectedQuestion.topics,
                                  })
                                  const isLaqCompetencyOpen = activeLaqCompetencySectionId === section.id
                                  const laqCompetencyQuery = laqCompetencySearchValue.trim().toLowerCase()
                                  const visibleLaqCompetencies = laqSectionCompetencies
                                    .filter((competency) => (
                                      competency.value.toLowerCase().includes(laqCompetencyQuery)
                                      || (competency.label ?? '').toLowerCase().includes(laqCompetencyQuery)
                                    ))
                                    .slice(0, 80)
                                  return (
                                    <div key={section.id} className="question-bank-laq-sub-question-card">
                                        <div className="question-bank-laq-sub-question-meta">
                                          <span className="question-bank-laq-sub-question-letter">{String.fromCharCode(97 + sectionIndex)}.</span>
                                        <div className={`question-bank-laq-competency-field ${shouldHighlightSectionMapping ? 'question-bank-next-action' : ''}`}>
                                          <button
                                            type="button"
                                            className={`question-bank-laq-map-trigger ${!selectedCompetency ? 'is-placeholder' : ''}`}
                                            onClick={() => {
                                              setActiveLaqSelectKey(null)
                                              setActiveDescriptiveAnswerTarget({ type: 'section', sectionId: section.id })
                                              setActiveLaqCompetencySectionId((current) => (current === section.id ? null : section.id))
                                              setLaqCompetencySearchValue('')
                                            }}
                                            aria-expanded={isLaqCompetencyOpen}
                                          >
                                            <span>
                                              <small>Competency <b className="question-bank-required-star">*</b></small>
                                              {selectedCompetency ? getShortCompetencyLabel(selectedCompetency) : 'Select competency'}
                                            </span>
                                            <ChevronDown size={14} strokeWidth={2.3} />
                                          </button>
                                          {isLaqCompetencyOpen ? (
                                            <div className="question-bank-laq-dropdown is-competencies" role="listbox" aria-label={`Select competency for sub-question ${sectionIndex + 1}`}>
                                              <label className="question-bank-laq-dropdown-search">
                                                <Search size={15} strokeWidth={2.1} />
                                                <input
                                                  value={laqCompetencySearchValue}
                                                  onChange={(event) => setLaqCompetencySearchValue(event.target.value)}
                                                  placeholder="Search competency"
                                                  autoFocus
                                                />
                                              </label>
                                              <div className="question-bank-laq-dropdown-list">
                                                {visibleLaqCompetencies.length ? visibleLaqCompetencies.map((competency) => {
                                                  const isActive = selectedCompetency === competency.value
                                                  return (
                                                    <button
                                                      key={competency.value}
                                                      type="button"
                                                      className={`question-bank-laq-dropdown-option ${isActive ? 'is-active' : ''}`}
                                                      onClick={() => {
                                                        updateDescriptiveSubQuestion(section.id, {
                                                          year: selectedQuestion.year || getYearForSubject(selectedQuestion.subject),
                                                          subject: selectedQuestion.subject,
                                                          topics: [...selectedQuestion.topics],
                                                          competencies: [competency.value],
                                                        })
                                                        setActiveLaqCompetencySectionId(null)
                                                        setLaqCompetencySearchValue('')
                                                      }}
                                                      role="option"
                                                      aria-selected={isActive}
                                                    >
                                                      <span className="question-bank-laq-dropdown-check" aria-hidden="true">
                                                        {isActive ? <Check size={12} strokeWidth={2.7} /> : null}
                                                      </span>
                                                      <strong>{getShortCompetencyLabel(competency.value)}</strong>
                                                      <span className="question-bank-laq-dropdown-option-label">{competency.label ?? competency.value}</span>
                                                    </button>
                                                  )
                                                }) : (
                                                  <div className="question-bank-laq-dropdown-empty">
                                                    <strong>No matches</strong>
                                                    <p>Select topics first or try another competency keyword.</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ) : null}
                                        </div>
                                        {renderLaqCompactSelect({
                                          selectKey: `${section.id}-category`,
                                          value: section.questionCategory ?? '',
                                          placeholder: 'Select Category',
                                          options: getQuestionCategorySelectOptions(selectedQuestion.type),
                                          onChange: (nextValue) => updateDescriptiveSubQuestion(section.id, { questionCategory: nextValue }),
                                        })}
                                        {renderLaqCompactSelect({
                                          selectKey: `${section.id}-cognitive`,
                                          value: section.cognitiveLevel ?? '',
                                          placeholder: 'Cognitive Level',
                                          options: COGNITIVE_LEVEL_OPTIONS,
                                          onChange: (nextValue) => updateDescriptiveSubQuestion(section.id, { cognitiveLevel: nextValue }),
                                        })}
                                        {renderLaqCompactSelect({
                                          selectKey: `${section.id}-difficulty`,
                                          value: section.difficultyLevel ?? '',
                                          placeholder: 'Difficulty Level',
                                          options: DIFFICULTY_LEVEL_OPTIONS,
                                          onChange: (nextValue) => updateDescriptiveSubQuestion(section.id, { difficultyLevel: nextValue }),
                                        })}
                                        {sectionIndex > 0 ? (
                                          <button
                                            type="button"
                                            className="question-bank-icon-btn question-bank-laq-delete-btn"
                                            onPointerDown={(event) => {
                                              event.preventDefault()
                                              event.stopPropagation()
                                              deleteDescriptiveSubQuestion(section.id)
                                            }}
                                            onClick={(event) => event.stopPropagation()}
                                            aria-label={`Delete sub-question ${sectionIndex + 1}`}
                                            title="Delete"
                                          >
                                            <Trash2 size={14} strokeWidth={2.2} />
                                          </button>
                                        ) : <span className="question-bank-laq-delete-spacer" aria-hidden="true" />}
                                        </div>
                                      {shouldShowSectionControls ? renderDescriptiveCurriculumControls(sectionTarget) : null}

                                      <div className="question-bank-laq-sub-question-main">
                                        <label className={`question-bank-laq-question-text ${shouldHighlightSectionText ? 'question-bank-next-action' : ''}`}>
                                          <RichMathEditor
                                            value={section.questionText}
                                            onChange={(nextValue) => updateDescriptiveSubQuestion(section.id, (currentSection) => {
                                              const shouldAutoMark = Boolean(getRichTextPreview(nextValue)) && !hasVisibleMarks(currentSection.marks)
                                              const nextMarks = shouldAutoMark ? getAutoGeneratedDescriptiveMarks() : currentSection.marks

                                              return {
                                                questionText: nextValue,
                                                ...(shouldAutoMark ? { marks: nextMarks } : {}),
                                                ...(Boolean(getRichTextPreview(nextValue)) && !getRichTextPreview(currentSection.answerKey)
                                                  ? { answerKey: getAutoGeneratedDescriptiveAnswer(nextValue, nextMarks) }
                                                  : {}),
                                              }
                                            })}
                                            onFocus={() => setActiveDescriptiveAnswerTarget({ type: 'section', sectionId: section.id })}
                                            placeholder="Enter sub-question"
                                            minRows={2}
                                            ariaLabel={`Sub-question ${sectionIndex + 1}`}
                                          />
                                        </label>
                                        <div className="question-bank-laq-side-stack">
                                          <label className={`question-bank-laq-marks-field ${shouldHighlightSectionMarks ? 'question-bank-next-action' : ''}`}>
                                            <input
                                              value={section.marks === '0' ? '' : (section.marks ?? '')}
                                              placeholder="Marks"
                                              onFocus={() => setActiveDescriptiveAnswerTarget({ type: 'section', sectionId: section.id })}
                                              onChange={(event) => updateDescriptiveSubQuestion(section.id, { marks: event.target.value })}
                                              inputMode="decimal"
                                              aria-label={`Marks for sub-question ${sectionIndex + 1}`}
                                            />
                                          </label>
                                          <div className="question-bank-laq-thinking-toggle" role="group" aria-label={`Thinking level for sub-question ${sectionIndex + 1}`}>
                                            <span className="question-bank-laq-thinking-required" aria-hidden="true">*</span>
                                            {THINKING_LEVEL_OPTIONS.map((option) => (
                                              <button
                                                key={option}
                                                type="button"
                                                className={(section.thinkingLevel ?? '') === option ? 'is-active' : ''}
                                                onClick={() => updateDescriptiveSubQuestion(section.id, { thinkingLevel: option })}
                                                aria-pressed={(section.thinkingLevel ?? '') === option}
                                              >
                                                {option}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                }
                                return (
                                  <div key={section.id} className="question-bank-descriptive-sub-card">
                                    <div className="question-bank-descriptive-row">
                                      <span className="question-bank-descriptive-index">{sectionLabel}</span>
                                      <label className={`question-bank-descriptive-text ${shouldHighlightSectionText ? 'question-bank-next-action' : ''}`}>
                                        <RichMathEditor
                                          value={section.questionText}
                                          onChange={(nextValue) => updateDescriptiveSubQuestion(section.id, (currentSection) => {
                                            const children = Array.isArray(currentSection.children) ? currentSection.children : []
                                            const shouldAutoMark = !children.length
                                              && Boolean(getRichTextPreview(nextValue))
                                              && !hasVisibleMarks(currentSection.marks)
                                            const nextMarks = shouldAutoMark ? getAutoGeneratedDescriptiveMarks() : currentSection.marks
                                            const isSectionAnswerEnabled = !children.length
                                            const shouldAutoAnswer = isSectionAnswerEnabled
                                              && Boolean(getRichTextPreview(nextValue))
                                              && !getRichTextPreview(currentSection.answerKey)

                                            return {
                                              questionText: nextValue,
                                              ...(shouldAutoMark ? { marks: nextMarks } : {}),
                                              ...(shouldAutoAnswer ? { answerKey: getAutoGeneratedDescriptiveAnswer(nextValue, nextMarks) } : {}),
                                            }
                                          })}
                                          onFocus={() => setActiveDescriptiveAnswerTarget({ type: 'section', sectionId: section.id })}
                                          placeholder="Enter your question"
                                          minRows={1}
                                          compact
                                          readOnly={shouldLockSectionQuestion}
                                          ariaLabel={`Sub question ${sectionIndex + 1}`}
                                        />
                                        {shouldLockSectionQuestion ? (
                                          <button
                                            type="button"
                                            className="question-bank-field-edit-btn"
                                            onClick={() => {
                                              enableDescriptiveFieldEdit(sectionFieldKey)
                                              setActiveDescriptiveAnswerTarget({ type: 'section', sectionId: section.id })
                                            }}
                                            aria-label={`Edit sub question ${sectionIndex + 1}`}
                                            title="Edit sub question"
                                          >
                                            <FilePenLine size={14} strokeWidth={2.2} />
                                          </button>
                                        ) : null}
                                      </label>
                                      {!sectionChildren.length ? (
                                        renderDescriptiveCompetencyButton(sectionTarget, section, shouldHighlightSectionMapping, !hasSectionText)
                                      ) : null}
                                      {!sectionChildren.length ? (
                                        <label className={`question-bank-descriptive-marks ${shouldHighlightSectionMarks ? 'question-bank-next-action' : ''}`}>
                                          <input
                                            value={section.marks ?? '0'}
                                            onFocus={() => setActiveDescriptiveAnswerTarget({ type: 'section', sectionId: section.id })}
                                            onChange={(event) => updateDescriptiveSubQuestion(section.id, { marks: event.target.value })}
                                            inputMode="decimal"
                                            disabled={shouldLockSectionQuestion}
                                          />
                                        </label>
                                      ) : null}
                                      <button
                                        type="button"
                                        className="question-bank-icon-btn question-bank-descriptive-delete-btn"
                                        onPointerDown={(event) => {
                                          event.preventDefault()
                                          event.stopPropagation()
                                          deleteDescriptiveSubQuestion(section.id)
                                        }}
                                        onClick={(event) => event.stopPropagation()}
                                        aria-label={`Delete sub question ${sectionIndex + 1}`}
                                      >
                                        <Trash2 size={14} strokeWidth={2.2} />
                                      </button>
                                    </div>
                                    {shouldShowSectionControls ? renderDescriptiveCurriculumControls(sectionTarget) : null}

                                    <div className="question-bank-descriptive-inside-list">
                                      {sectionChildren.map((child, childIndex) => {
                                        const childTarget = { type: 'inside', sectionId: section.id, childId: child.id, sectionIndex, childIndex }
                                        const isChildActive = activeDescriptiveAnswerTarget.type === 'inside'
                                          && activeDescriptiveAnswerTarget.sectionId === section.id
                                          && activeDescriptiveAnswerTarget.childId === child.id
                                        const hasChildText = Boolean(getRichTextPreview(child.questionText))
                                        const hasChildMapping = Boolean((child.topics ?? []).length || (child.competencies ?? []).length)
                                        const shouldHighlightChildText = !hasChildText
                                        const shouldHighlightChildMapping = isChildActive && hasChildText && !hasChildMapping
                                        const shouldHighlightChildMarks = isChildActive && hasChildText && hasChildMapping && !hasVisibleMarks(child.marks)
                                        return (
                                        <div key={child.id}>
                                        <div className="question-bank-descriptive-row is-child">
                                          <span className="question-bank-descriptive-index">{String.fromCharCode(97 + childIndex)}.</span>
                                          <label className={`question-bank-descriptive-text ${shouldHighlightChildText ? 'question-bank-next-action' : ''}`}>
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
                                              onFocus={() => setActiveDescriptiveAnswerTarget({ type: 'inside', sectionId: section.id, childId: child.id })}
                                              placeholder="Enter your question"
                                              minRows={1}
                                              compact
                                              ariaLabel={`Inside question ${childIndex + 1}`}
                                            />
                                          </label>
                                          {renderDescriptiveCompetencyButton(childTarget, child, shouldHighlightChildMapping, !hasChildText)}
                                          <label className={`question-bank-descriptive-marks ${shouldHighlightChildMarks ? 'question-bank-next-action' : ''}`}>
                                            <input
                                              value={child.marks ?? '0'}
                                              onFocus={() => setActiveDescriptiveAnswerTarget({ type: 'inside', sectionId: section.id, childId: child.id })}
                                              onChange={(event) => updateDescriptiveInsideQuestion(section.id, child.id, { marks: event.target.value }, sectionIndex, childIndex)}
                                              inputMode="decimal"
                                            />
                                          </label>
                                          <button
                                            type="button"
                                            className="question-bank-icon-btn question-bank-descriptive-delete-btn"
                                            onPointerDown={(event) => {
                                              event.preventDefault()
                                              event.stopPropagation()
                                              deleteDescriptiveInsideQuestion(section.id, child.id, sectionIndex, childIndex)
                                            }}
                                            onClick={(event) => event.stopPropagation()}
                                            aria-label={`Delete inside question ${childIndex + 1}`}
                                          >
                                            <Trash2 size={14} strokeWidth={2.2} />
                                          </button>
                                        </div>
                                        {isChildActive ? renderDescriptiveCurriculumControls(childTarget, true) : null}
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
                          {isSaqSingleQuestionFlow ? (
                            <>
                              <div className="question-bank-laq-sub-question-card question-bank-saq-single-question-card">
                                <div className="question-bank-laq-sub-question-meta">
                                  {renderLaqCompactSelect({
                                    selectKey: 'saq-single-category',
                                    value: getQuestionCategorySelectValue(selectedQuestion.type, selectedQuestion.questionCategory),
                                    placeholder: 'Select Category',
                                    options: getQuestionCategorySelectOptions(selectedQuestion.type),
                                    onChange: (nextValue) => updateSelectedQuestion({ questionCategory: nextValue }),
                                  })}
                                  {renderLaqCompactSelect({
                                    selectKey: 'saq-single-cognitive',
                                    value: selectedQuestion.cognitiveLevel,
                                    placeholder: 'Cognitive Level',
                                    options: COGNITIVE_LEVEL_OPTIONS,
                                    onChange: (nextValue) => updateSelectedQuestion({ cognitiveLevel: nextValue }),
                                  })}
                                  {renderLaqCompactSelect({
                                    selectKey: 'saq-single-difficulty',
                                    value: selectedQuestion.difficultyLevel,
                                    placeholder: 'Difficulty Level',
                                    options: DIFFICULTY_LEVEL_OPTIONS,
                                    onChange: (nextValue) => updateSelectedQuestion({ difficultyLevel: nextValue }),
                                  })}
                                  <label className="question-bank-laq-marks-field">
                                    <input
                                      value={hasVisibleMarks(selectedQuestion.marks) ? selectedQuestion.marks : ''}
                                      onChange={(event) => updateSelectedQuestion({ marks: event.target.value })}
                                      placeholder="Marks"
                                      aria-label="SAQ marks"
                                    />
                                  </label>
                                  <div className="question-bank-laq-thinking-toggle" role="group" aria-label="Thinking level for SAQ">
                                    <span className="question-bank-laq-thinking-required" aria-hidden="true">*</span>
                                    {THINKING_LEVEL_OPTIONS.map((option) => (
                                      <button
                                        key={option}
                                        type="button"
                                        className={selectedQuestion.thinkingLevel === option ? 'is-active' : ''}
                                        onClick={() => updateSelectedQuestion({ thinkingLevel: option })}
                                        aria-pressed={selectedQuestion.thinkingLevel === option}
                                      >
                                        {option}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="question-bank-saq-single-question-main">
                                  <label className="question-bank-laq-question-text">
                                    <RichMathEditor
                                      value={selectedQuestion.questionText}
                                      onChange={(nextValue) => updateSelectedQuestion((current) => {
                                        const nextPreview = getRichTextPreview(nextValue)
                                        const shouldAutoMark = Boolean(nextPreview) && !hasVisibleMarks(current.marks)
                                        const nextMarks = shouldAutoMark ? getAutoGeneratedDescriptiveMarks() : current.marks
                                        const shouldAutoAnswer = Boolean(nextPreview) && !getRichTextPreview(current.answerKey)

                                        return {
                                          questionText: nextValue,
                                          title: nextPreview.slice(0, 60) || current.title,
                                          ...(shouldAutoMark ? { marks: nextMarks } : {}),
                                          ...(shouldAutoAnswer ? { answerKey: getAutoGeneratedDescriptiveAnswer(nextValue, nextMarks) } : {}),
                                        }
                                      })}
                                      onFocus={() => setActiveDescriptiveAnswerTarget({ type: 'root' })}
                                      placeholder="Enter sub-question"
                                      minRows={2}
                                      ariaLabel="SAQ question"
                                      allowPastedImages={false}
                                      onPasteImageRejected={() => onAlert?.({ tone: 'warning', message: 'Images are not supported in question text.' })}
                                    />
                                  </label>
                                </div>
                              </div>
                              <div className="question-bank-descriptive-builder-foot is-saq-single-actions">
                                <span />
                                <span className="question-bank-assessment-actions question-bank-laq-form-actions">
                                  <button
                                    type="button"
                                    className="question-bank-secondary-btn"
                                    onClick={handleSaveDraft}
                                    disabled={!canSaveSelectedDraft}
                                  >
                                    <Save size={14} strokeWidth={2.2} aria-hidden="true" />
                                    Save as Draft
                                  </button>
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
                                        {isUpdatingSelectedQuestion ? 'Update' : 'Generate Question'}
                                      </>
                                    )}
                                  </button>
                                </span>
                              </div>
                            </>
                          ) : null}
                          {shouldShowSubQuestionFlow || !isSelectedLaqQuestion ? (
                          <div className={`question-bank-descriptive-builder-foot ${shouldShowSubQuestionFlow ? 'is-laq-case-stem-actions' : ''}`}>
                            {shouldShowSubQuestionFlow ? (
                              <>
                                <button
                                  type="button"
                                  className="question-bank-secondary-btn question-bank-laq-add-sub-btn"
                                  onClick={addDescriptiveSubQuestion}
                                  disabled={!canAddSubQuestion}
                                >
                                  <Plus size={14} strokeWidth={2.2} />
                                  Add Sub question
                                </button>
                                <span className="question-bank-assessment-actions question-bank-laq-form-actions">
                                  <button
                                    type="button"
                                    className="question-bank-secondary-btn"
                                    onClick={handleSaveDraft}
                                    disabled={!canSaveSelectedDraft}
                                  >
                                    <Save size={14} strokeWidth={2.2} aria-hidden="true" />
                                    Save as Draft
                                  </button>
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
                                        {isUpdatingSelectedQuestion ? 'Update' : 'Generate Question'}
                                      </>
                                    )}
                                  </button>
                                </span>
                              </>
                            ) : (
                              <button
                                type="button"
                                className={`question-bank-secondary-btn ${hasRootQuestionText && !descriptiveSections.length ? 'question-bank-next-action' : ''}`}
                                onClick={addDescriptiveSubQuestion}
                                disabled={!canAddSubQuestion}
                              >
                                <Plus size={14} strokeWidth={2.2} />
                                Add Sub Question
                              </button>
                            )}
                          </div>
                          ) : null}
                          {!shouldShowSubQuestionFlow && !isSaqBuilderMode ? (
                            <div className="question-bank-answer-block question-bank-descriptive-answer-block">
                              <label className="question-bank-field">
                                <span className="question-bank-inline-field-badge">Answer &amp; Explanation</span>
                                <RichMathEditor
                                  value={visibleDescriptiveAnswerValue}
                                  onChange={updateActiveDescriptiveAnswer}
                                  placeholder="Add answer and explanation"
                                  minRows={3}
                                  ariaLabel="Descriptive answer and explanation"
                                />
                              </label>
                            </div>
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
                            {selectedOptions.map((option, index) => {
                              const { minCount } = getOptionModeConfig(selectedQuestion.allowMultiple)
                              const isMandatoryOption = index < minCount
                              const isSelectedOption = selectedCorrectOptionIds.includes(option.id)
                              const hasOptionText = Boolean(getRichTextPreview(option.label))
                              const hasAnyCorrectOption = selectedCorrectOptionIds.length > 0
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
                                        ? asArray(item.correctOptionIds).includes(option.id)
                                          ? asArray(item.correctOptionIds).filter((currentId) => currentId !== option.id)
                                          : [...asArray(item.correctOptionIds), option.id]
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
                                    options: asArray(item.options).map((currentOption) => (
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
                                      onClick={() => updateSelectedQuestion((item) => ({
                                        ...item,
                                        options: asArray(item.options).filter((currentOption) => currentOption.id !== option.id),
                                        correctOptionIds: asArray(item.correctOptionIds).filter((currentId) => currentId !== option.id),
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
                              const isAtMaxOptions = selectedOptions.length >= maxCount
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

                      {!isDescriptiveSelected && selectedQuestion.type !== 'MCQ' ? (
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
                      ) : null}

                      </section>
                        )
                      })()}

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
                            {selectedFillBlankAnswers.map((answer, index) => (
                              <RichMathEditor
                                key={`${selectedQuestion.id}-blank-${index}`}
                                value={answer}
                                onChange={(nextValue) => updateSelectedQuestion((item) => ({
                                  ...item,
                                  fillBlankAnswers: asArray(item.fillBlankAnswers).map((currentAnswer, answerIndex) => (
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
                              fillBlankAnswers: [...asArray(item.fillBlankAnswers), ''],
                            }))}
                          >
                            <Plus size={14} strokeWidth={2} />
                            Add Accepted Answer
                          </button>
                        </section>
                      ) : null}

                    </div>

                  </div>
                </section>

                ) : null}

                {['created', 'uploaded', 'draft', 'sent', 'approved', 'rejected', 'report'].includes(activeQuestionTab) && activeQuestionCards.length ? (
                  <section className="question-bank-created-panel">
                    {approvalStatusTabs}
                    <div className="question-bank-section-head">
                      <div>
                        {activeQuestionTab === 'approved' ? (
                          <span className="question-bank-approval-selection-head">
                            <span className="question-bank-approval-count-badge">
                              {approvedQuestionBankSelectedIds.length} selected
                            </span>
                          </span>
                        ) : isApprovalSelectMode && ['created', 'uploaded'].includes(activeQuestionTab) ? (
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
                          activeQuestionTab === 'created' ? (
                            <span className="question-bank-created-tab-title">
                              <Sparkles size={16} strokeWidth={2.2} />
                              Generate Question
                            </span>
                          ) : (
                            <span className="question-bank-eyebrow">
                              {activeQuestionTab === 'draft'
                              ? 'Draft Questions'
                              : activeQuestionTab === 'uploaded'
                                ? 'Upload Questions'
                              : activeQuestionTab === 'sent'
                                ? 'Sent to Approval'
                                : activeQuestionTab === 'approved'
                                  ? 'Approved Questions'
                                  : activeQuestionTab === 'rejected'
                                    ? 'Approval Rejected'
                                : 'Created Questions'}
                            </span>
                          )
                        )}
                      </div>
                      {['created', 'uploaded', 'approved'].includes(activeQuestionTab) ? (
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
                            null
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
                        const canStartCardEdit = activeQuestionTab === 'report' || ['Approved', 'Approval Rejected'].includes(status)
                        const isApprovedQuestionBankSelection = activeQuestionTab === 'approved'
                        const isQuestionBankAdded = question.questionBankStatus === 'Add to Question Bank'
                        const isQuestionBankSent = Boolean(question.questionBankSentAt) || isQuestionBankAdded
                        const isQuestionBankSelected = approvedQuestionBankSelectedIds.includes(question.id)
                        const reportReasonText = (question.reportReasons ?? []).filter(Boolean).join(', ')
                        const reportActionText = question.reportAuthorAction ?? ''
                        const isDescriptiveCard = isDescriptiveQuestionType(question.type)
                        const descriptiveSections = Array.isArray(question.descriptiveSections) ? question.descriptiveSections : []
                        const isCreatedSaqDescriptiveOutput = isSaqDescriptiveOutput(question)
                        const isCreatedSaqSingleQuestionOutput = isSaqSingleQuestionOutput(question)
                        const shouldShowStatusBadge = !(status === 'Approved' && isQuestionBankSent)
                        const shouldShowQuestionDetails = ['Created', 'Sent to Approval', 'Approved', 'Approval Rejected'].includes(status)
                        const canEditCreatedCard = status !== 'Generating' && (!isLockedApprovalCard || canStartCardEdit)
                        const questionMarksLabel = isCreatedSaqSingleQuestionOutput && hasVisibleMarks(question.marks)
                          ? String(question.marks)
                          : getQuestionMarksLabel(question)
                        const curriculumMeta = [
                          question.year ? getYearDisplayLabel(question.year) : null,
                          question.subject,
                          question.topics?.length ? getSelectionSummary(question.topics, '') : null,
                          question.competencies?.length
                            ? getSelectionSummary(question.competencies, '', getShortCompetencyLabel)
                            : null,
                        ].filter(Boolean)
                        const isCreatedCardExpanded = openCreatedQuestionIds.includes(question.id)
                        const isGeneratedDescriptiveWithSections = isDescriptiveCard && descriptiveSections.length > 0
                        const shouldShowCreatedSubQuestionFlow = isGeneratedDescriptiveWithSections && !isCreatedSaqSingleQuestionOutput
                        const descriptiveStructurePartCount = descriptiveSections.length
                        const descriptiveStructureSubPartCount = descriptiveSections.reduce((total, section) => (
                          total + (Array.isArray(section.children) ? section.children.length : 0)
                        ), 0)
                        const descriptiveStructureLabel = descriptiveStructurePartCount || descriptiveStructureSubPartCount
                          ? `${descriptiveStructurePartCount} ${descriptiveStructurePartCount === 1 ? 'part' : 'parts'} - ${descriptiveStructureSubPartCount} ${descriptiveStructureSubPartCount === 1 ? 'sub-part' : 'sub-parts'}`
                          : ''
                        const createdDescriptiveParts = descriptiveSections.flatMap((section, sectionIndex) => {
                          const children = Array.isArray(section.children) ? section.children : []
                          return children.length
                            ? children.map((child, childIndex) => ({
                              item: child,
                              fallback: section,
                              key: child.id ?? `${question.id}-section-${sectionIndex}-child-${childIndex}`,
                            }))
                            : [{
                              item: section,
                              fallback: question,
                              key: section.id ?? `${question.id}-section-${sectionIndex}`,
                            }]
                        })
                        const shouldShowCreatedCurriculum = curriculumMeta.length && (!isDescriptiveCard || !shouldShowCreatedSubQuestionFlow)
                        const createdCardTypeBadgeLabel = isCreatedSaqDescriptiveOutput
                          ? 'SAQs'
                          : isGeneratedDescriptiveWithSections
                          ? typeMeta.shortLabel
                          : typeMeta.shortLabel
                        const createdCardTypeBadgeClass = createdCardTypeBadgeLabel === 'SAQs'
                          ? 'is-saq-type'
                          : createdCardTypeBadgeLabel === 'LAQs'
                            ? 'is-laq-type'
                            : createdCardTypeBadgeLabel === 'MCQ'
                              ? 'is-mcq-type'
                              : ''
                        const primaryKpiSource = getCreatedQuestionPrimaryKpiSource(question)
                        const primaryQuestionCategory = getCreatedQuestionKpiValue(question, 'questionCategory')
                        const primaryCognitiveLevel = getCreatedQuestionKpiValue(question, 'cognitiveLevel')
                        const primaryThinkingLevel = getCreatedQuestionKpiValue(question, 'thinkingLevel')
                        const primaryDifficultyLevel = getCreatedQuestionKpiValue(question, 'difficultyLevel')
                        const primaryCognitiveFunction = getCreatedQuestionKpiValue(question, 'cognitiveFunction')
                        const primarySkillFocus = getCreatedQuestionKpiValue(question, 'skillFocus')
                        const primaryOrganSystem = question.organSystem || primaryKpiSource.organSystem || ''
                        const thinkingBadgeLabel = primaryThinkingLevel ? getThinkingLevelLabel(primaryThinkingLevel) : ''
                        const thinkingBadgeClass = String(thinkingBadgeLabel).toLowerCase() === 'hot'
                          ? 'is-hot'
                          : String(thinkingBadgeLabel).toLowerCase() === 'lot'
                            ? 'is-lot'
                            : 'lilac'
                        const rootCompetencyDisplay = getCreatedQuestionPrimaryCompetencyDisplay(question)
                        const createdDisplayId = getCreatedQuestionDisplayId(index)
                        const createdCardKpis = [
                          { label: 'Question ID', value: createdDisplayId },
                          { label: 'Suggested', value: questionMarksLabel ? `${questionMarksLabel} Mark${questionMarksLabel === '1' ? '' : 's'}` : '' },
                          { label: 'Thinking', value: thinkingBadgeLabel },
                          { label: 'Level', value: primaryDifficultyLevel },
                          { label: 'Cognitive', value: primaryCognitiveLevel },
                          { label: 'Function', value: primaryCognitiveFunction },
                          { label: 'Skill Focus', value: primarySkillFocus },
                          { label: 'Concept', value: primaryOrganSystem },
                        ].filter((item) => Boolean(item.value))
                        return (
                          <article
                            key={question.id}
                            data-created-question-id={question.id}
                            className={`question-bank-created-card ${isCreatedCardExpanded ? 'is-expanded' : ''} ${question.id === selectedQuestionId ? 'is-active' : ''} ${question.isCritical ? 'is-critical' : ''} ${approvalSelectedIds.includes(question.id) || isQuestionBankSelected ? 'is-approval-selected' : ''} ${isApprovalSelectMode || (isApprovedQuestionBankSelection && !isQuestionBankSent) ? 'is-selection-mode' : ''} ${isQuestionBankSent ? 'is-question-bank-sent' : ''} ${isLockedApprovalCard ? 'is-approval-locked' : ''}`}
                          >
                            {isApprovalSelectMode || (isApprovedQuestionBankSelection && !isQuestionBankSent) || ['created', 'uploaded'].includes(activeQuestionTab) ? (
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
                            ) : (
                              <span className="question-bank-created-row-check" aria-hidden="true" />
                            )}
                            <div
                              className="question-bank-created-card-main"
                              role="button"
                              tabIndex={status === 'Generating' || (isApprovedQuestionBankSelection && isQuestionBankSent) ? -1 : 0}
                              aria-disabled={status === 'Generating' || (isApprovedQuestionBankSelection && isQuestionBankSent)}
                              onClick={() => {
                                if (isApprovedQuestionBankSelection && isQuestionBankSent) {
                                  return
                                }
                                if (isApprovedQuestionBankSelection) {
                                  toggleApprovedQuestionBankSelection(question.id)
                                  return
                                }
                                if (isApprovalSelectMode) {
                                  if (status === 'Created') toggleApprovalSelection(question.id)
                                  return
                                }
                                if (status !== 'Generating') {
                                  toggleCreatedQuestionDetails(question.id)
                                }
                              }}
                              onKeyDown={(event) => {
                                if (isApprovedQuestionBankSelection && isQuestionBankSent) {
                                  return
                                }
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
                                if (status !== 'Generating' && (event.key === 'Enter' || event.key === ' ')) {
                                  event.preventDefault()
                                  toggleCreatedQuestionDetails(question.id)
                                }
                              }}
                            >
                              <span>
                                  <span className="question-bank-created-header">
                                  <span className="question-bank-created-header-badges">
                                    <span className="question-bank-badge success question-bank-created-source-badge">Institute</span>
                                    <span className="question-bank-badge soft question-bank-created-id-badge">{createdDisplayId}</span>
                                    {rootCompetencyDisplay ? (
                                      <span className="question-bank-created-descriptive-code-wrap">
                                        <span className="question-bank-created-descriptive-code" tabIndex={0}>
                                          {rootCompetencyDisplay.code}
                                          <Info size={11} strokeWidth={2.3} aria-hidden="true" />
                                        </span>
                                        <span className="question-bank-created-competency-popover" role="tooltip">
                                          <span><b>Subject:</b> {rootCompetencyDisplay.subject}</span>
                                          <span><b>Topic:</b> {rootCompetencyDisplay.topic}</span>
                                          <span><b>Competency:</b> {rootCompetencyDisplay.competency}</span>
                                        </span>
                                      </span>
                                    ) : null}
                                    <span className={`question-bank-badge type ${createdCardTypeBadgeClass}`}>{createdCardTypeBadgeLabel}</span>
                                    {shouldShowQuestionDetails && questionMarksLabel ? (
                                      <span className="question-bank-badge soft question-bank-created-marks-badge">
                                        {questionMarksLabel} mark{questionMarksLabel === '1' ? '' : 's'}
                                      </span>
                                    ) : null}
                                    {shouldShowCreatedSubQuestionFlow ? (
                                      <span className="question-bank-badge soft question-bank-created-sub-count-badge">
                                        <ListChecks size={12} strokeWidth={2.3} />
                                        {descriptiveStructureLabel}
                                      </span>
                                    ) : null}
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
                                    {shouldShowQuestionDetails && !shouldShowCreatedSubQuestionFlow && primaryQuestionCategory ? (
                                      <span className="question-bank-badge mint">{primaryQuestionCategory}</span>
                                    ) : null}
                                    {shouldShowQuestionDetails && !shouldShowCreatedSubQuestionFlow && primaryCognitiveLevel ? (
                                      <span className="question-bank-badge blue">{primaryCognitiveLevel}</span>
                                    ) : null}
                                    {shouldShowQuestionDetails && !shouldShowCreatedSubQuestionFlow && thinkingBadgeLabel ? (
                                      <span className={`question-bank-badge ${thinkingBadgeClass}`}>{thinkingBadgeLabel}</span>
                                    ) : null}
                                    {shouldShowQuestionDetails && !shouldShowCreatedSubQuestionFlow && primaryDifficultyLevel ? (
                                      <span className="question-bank-badge soft">{primaryDifficultyLevel}</span>
                                    ) : null}
                                    {activeQuestionTab === 'report' && reportReasonText ? (
                                      <span className="question-bank-badge report-reason" title={reportReasonText}>
                                        Reason: {reportReasonText}
                                      </span>
                                    ) : null}
                                    {activeQuestionTab === 'report' && reportActionText ? (
                                      <span className="question-bank-badge report-action" title={reportActionText}>
                                        Action: {reportActionText}
                                      </span>
                                    ) : null}
                                    {activeQuestionTab === 'approved' && isQuestionBankAdded ? (
                                      <span className="question-bank-badge blue">
                                        <Send size={13} strokeWidth={2.2} />
                                        Add to Question Bank
                                      </span>
                                    ) : null}
                                    {status === 'Approved' && question.questionBankSentAt && shouldShowStatusBadge ? (
                                      <span className="question-bank-badge blue">
                                        <Send size={13} strokeWidth={2.2} />
                                        Sent to Question Bank
                                      </span>
                                    ) : null}
                                    {!shouldShowCreatedSubQuestionFlow && !isCreatedSaqSingleQuestionOutput && question.type !== 'MCQ' && shouldShowQuestionDetails && optionalTagGroups.length ? (
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
                                          + {optionalTagGroups.reduce((total, group) => total + group.values.length, 0)} more tags
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
                                  <span className="question-bank-created-card-actions">
                                    {canEditCreatedCard ? (
                                      <button
                                        type="button"
                                        className="question-bank-icon-btn"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          if (canStartCardEdit) {
                                            openEditQuestionFlow(question.id)
                                            return
                                          }
                                          setOpenCreatedTagsId(null)
                                          selectQuestionForEditing(question.id, question)
                                          setActiveQuestionTab('create')
                                        }}
                                        aria-label="Edit question"
                                        title="Edit question"
                                      >
                                        <FilePenLine size={14} strokeWidth={2} />
                                      </button>
                                    ) : null}
                                    {activeQuestionTab === 'approved' && isQuestionBankSent ? (
                                      <button
                                        type="button"
                                        className="question-bank-icon-btn"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          deleteApprovedQuestionEverywhere(question.id)
                                        }}
                                        aria-label="Delete approved question"
                                        title="Delete approved question"
                                      >
                                        <Trash2 size={14} strokeWidth={2} />
                                      </button>
                                    ) : null}
                                    {!isLockedApprovalCard ? (
                                      <button
                                        type="button"
                                        className="question-bank-icon-btn"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setOpenCreatedTagsId(null)
                                          if (activeQuestionTab === 'report') {
                                            deleteCreatedReportQuestion(question.id)
                                          } else {
                                            handleDeleteQuestionById(question.id)
                                          }
                                        }}
                                        aria-label="Delete question"
                                      >
                                        <Trash2 size={14} strokeWidth={2} />
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      className="question-bank-icon-btn question-bank-created-expand-btn"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        toggleCreatedQuestionDetails(question.id)
                                      }}
                                      aria-expanded={isCreatedCardExpanded}
                                      aria-label={isCreatedCardExpanded ? 'Collapse question details' : 'Expand question details'}
                                      title={isCreatedCardExpanded ? 'Collapse' : 'Expand'}
                                    >
                                      {isCreatedCardExpanded ? (
                                        <ChevronUp size={14} strokeWidth={2.3} />
                                      ) : (
                                        <ChevronDown size={14} strokeWidth={2.3} />
                                      )}
                                    </button>
                                  </span>
                                </span>
                                <div className={shouldShowCreatedSubQuestionFlow ? 'question-bank-created-case-scenario' : `question-bank-created-question${isCreatedSaqSingleQuestionOutput ? ' question-bank-created-saq-single-question' : ''}`}>
                                  {shouldShowCreatedSubQuestionFlow ? (
                                    <>
                                      <strong className="question-bank-created-question-number">Q{index + 1}.</strong>
                                      <strong className="question-bank-created-case-label">Clinical Case Scenario:</strong>
                                      <span>{getRichTextPreview(question.questionText) || question.title || 'Clinical case scenario not added.'}</span>
                                    </>
                                  ) : isCreatedSaqSingleQuestionOutput ? (
                                    <>
                                      <strong className="question-bank-created-question-prefix">Q{index + 1}.</strong>
                                      <span className="question-bank-created-question-body">{getRichTextPreview(question.questionText) || question.title || 'Untitled question'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <strong className="question-bank-created-question-prefix">Q{index + 1}.</strong>
                                      {getRichTextPreview(question.questionText) ? (
                                        <div
                                          className="question-bank-created-question-body"
                                          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(question.questionText) }}
                                        />
                                      ) : (
                                        <strong className="question-bank-created-question-body">
                                          {question.title || 'Untitled question'}
                                        </strong>
                                      )}
                                    </>
                                  )}
                                </div>
                                {isCreatedCardExpanded && shouldShowCreatedCurriculum && !isCreatedSaqSingleQuestionOutput && question.type !== 'MCQ' ? (
                                  <span className="question-bank-created-curriculum" title={curriculumMeta.join(' / ')}>
                                    {curriculumMeta.map((item) => (
                                      <span key={item}>{item}</span>
                                    ))}
                                  </span>
                                ) : null}
                                {isCreatedCardExpanded && shouldShowQuestionDetails ? (
                                  <>
                                    {createdCardKpis.length && !isCreatedSaqSingleQuestionOutput && (!isDescriptiveCard || !shouldShowCreatedSubQuestionFlow) ? (
                                      <span className="question-bank-created-kpi-strip">
                                        {createdCardKpis.map((item) => (
                                          <span key={`${question.id}-${item.label}`} className="question-bank-created-kpi">
                                            <b>{item.label}</b>
                                            <strong>{item.value}</strong>
                                          </span>
                                        ))}
                                      </span>
                                    ) : null}
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
                                    {isCreatedSaqSingleQuestionOutput ? (
                                      <span className="question-bank-created-saq-single-review">
                                        <span className="question-bank-created-descriptive-tags" aria-label={`Tags for question ${index + 1}`}>
                                          {question.cognitiveFunction ? (
                                            <span className="question-bank-badge mint">{question.cognitiveFunction}</span>
                                          ) : null}
                                          {question.skillFocus ? (
                                            <span className="question-bank-badge blue">{question.skillFocus}</span>
                                          ) : null}
                                          {question.organSystem ? (
                                            <span className="question-bank-badge soft">{question.organSystem}</span>
                                          ) : null}
                                        </span>
                                        <span className="question-bank-created-saq-full-question">
                                          <b>Question</b>
                                          <span>{getRichTextPreview(question.questionText) || question.title || 'Untitled question'}</span>
                                        </span>
                                        <span className="question-bank-created-inline-answer">
                                          <b>Model answer</b>
                                          <span>{getModelAnswerPreview(question.answerKey) || AUTO_GENERATED_DESCRIPTIVE_ANSWER_TEXT}</span>
                                        </span>
                                        <span className="question-bank-created-inline-answer question-bank-created-inline-answer-notes">
                                          <b>Examiner's marking notes</b>
                                          <span>{getExaminerNotesPreview(question, question)}</span>
                                        </span>
                                        <span className="question-bank-created-inline-answer question-bank-created-inline-answer-flaw">
                                          <b><TriangleAlert size={12} strokeWidth={2.2} aria-hidden="true" /> Fatal flaw</b>
                                          <span>{getFatalFlawPreview(question, question)}</span>
                                        </span>
                                      </span>
                                    ) : null}
                                    {question.type === 'MCQ' ? (
                                      <span className="question-bank-created-options">
                                        {question.options
                                          .filter((option) => Boolean(getRichTextPreview(option.label)))
                                          .map((option, optionIndex) => {
                                            const optionPreviewId = `${question.id}-${option.id}`

                                            return (
                                              <b
                                                key={option.id}
                                                className={asArray(question.correctOptionIds).includes(option.id) ? 'is-correct' : ''}
                                              >
                                                {String.fromCharCode(65 + optionIndex)}. {getRichTextPreview(option.label)}
                                                <span className="question-bank-option-distractor-preview">
                                                  <button
                                                    type="button"
                                                    onClick={(event) => {
                                                      event.stopPropagation()
                                                      setOpenOptionDistractorPreviewId((current) => (current === optionPreviewId ? null : optionPreviewId))
                                                    }}
                                                    aria-expanded={openOptionDistractorPreviewId === optionPreviewId}
                                                    aria-label={`View distractor errors for option ${String.fromCharCode(65 + optionIndex)}`}
                                                  >
                                                    <Info size={12} strokeWidth={2.2} />
                                                  </button>
                                                  {openOptionDistractorPreviewId === optionPreviewId ? (
                                                    <span className="question-bank-option-distractor-tooltip" role="tooltip">
                                                      <strong>Distractor Error</strong>
                                                      {(option.distractorErrors ?? []).length ? (
                                                        <span>{option.distractorErrors[0]}</span>
                                                      ) : (
                                                        <span>No distractor error selected</span>
                                                      )}
                                                    </span>
                                                  ) : null}
                                                </span>
                                              </b>
                                            )
                                        })}
                                      </span>
                                    ) : null}
                                    {isDescriptiveCard && shouldShowCreatedSubQuestionFlow ? (
                                      <span className="question-bank-created-descriptive-list">
                                        {createdDescriptiveParts.map((part, partIndex) => {
                                          const partItem = part.item
                                          const partFallback = part.fallback
                                          const partCompetencyDisplay = getDescriptiveCompetencyDisplay(partItem, partFallback)
                                          const partThinkingLabel = partItem.thinkingLevel
                                            ? getThinkingLevelLabel(partItem.thinkingLevel)
                                            : partFallback.thinkingLevel
                                              ? getThinkingLevelLabel(partFallback.thinkingLevel)
                                              : thinkingBadgeLabel
                                          const partThinkingClass = String(partThinkingLabel).toLowerCase() === 'hot'
                                            ? 'is-hot'
                                            : String(partThinkingLabel).toLowerCase() === 'lot'
                                              ? 'is-lot'
                                              : 'lilac'
                                          const partCategory = partItem.questionCategory || partFallback.questionCategory || question.questionCategory
                                          const partTags = getCreatedSubQuestionOptionalTagGroups(partItem, partFallback)
                                          const partDetailId = `${question.id}-${part.key}`
                                          const isPartDetailsOpen = Boolean(openCreatedSubQuestionIds[partDetailId])
                                          const partMoreTagCount = partTags.reduce((total, group) => total + group.values.length, 0)
                                          const partAnswer = getModelAnswerPreview(partItem.answerKey)
                                            || getModelAnswerPreview(partFallback.answerKey)
                                            || getModelAnswerPreview(question.answerKey)
                                          const partNotes = getExaminerNotesPreview(partItem, partFallback)
                                            || getExaminerNotesPreview(partFallback, question)
                                          const partFatalFlaw = getFatalFlawPreview(partItem, partFallback)
                                            || getFatalFlawPreview(partFallback, question)

                                          return (
                                            <span key={part.key} className="question-bank-created-descriptive-item">
                                              <span className="question-bank-created-descriptive-line">
                                                <b>{String.fromCharCode(97 + partIndex)}.</b>
                                                <span>
                                                  <span>{getRichTextPreview(partItem.questionText) || 'Question not added'}</span>
                                                </span>
                                              </span>
                                              <span className="question-bank-created-sub-summary">
                                                {partCompetencyDisplay ? (
                                                  <span className="question-bank-created-descriptive-code-wrap">
                                                    <span className="question-bank-created-descriptive-code" tabIndex={0}>
                                                      {partCompetencyDisplay.code}
                                                      <Info size={11} strokeWidth={2.3} aria-hidden="true" />
                                                    </span>
                                                    <span className="question-bank-created-competency-popover" role="tooltip">
                                                      <span><b>Subject:</b> {partCompetencyDisplay.subject}</span>
                                                      <span><b>Topic:</b> {partCompetencyDisplay.topic}</span>
                                                      <span><b>Competency:</b> {partCompetencyDisplay.competency}</span>
                                                    </span>
                                                  </span>
                                                ) : null}
                                                {partThinkingLabel ? (
                                                  <span className={`question-bank-badge question-bank-created-summary-badge ${partThinkingClass}`}>{partThinkingLabel}</span>
                                                ) : null}
                                                {partItem.difficultyLevel || partFallback.difficultyLevel || question.difficultyLevel ? (
                                                  <span className="question-bank-badge question-bank-created-summary-badge soft">{partItem.difficultyLevel || partFallback.difficultyLevel || question.difficultyLevel}</span>
                                                ) : null}
                                                {partCategory ? (
                                                  <span className="question-bank-badge question-bank-created-summary-badge is-category">{partCategory}</span>
                                                ) : null}
                                                {hasVisibleMarks(partItem.marks) ? (
                                                  <span className="question-bank-badge question-bank-created-summary-badge question-bank-created-part-marks-badge">{partItem.marks} marks</span>
                                                ) : null}
                                                <button
                                                  type="button"
                                                  className="question-bank-badge question-bank-created-view-more-badge"
                                                  onClick={(event) => {
                                                    event.stopPropagation()
                                                    toggleCreatedSubQuestionDetails(partDetailId)
                                                  }}
                                                  aria-expanded={isPartDetailsOpen}
                                                >
                                                  {isPartDetailsOpen ? (
                                                    <ChevronUp size={12} strokeWidth={2.4} />
                                                  ) : (
                                                    <ChevronDown size={12} strokeWidth={2.4} />
                                                  )}
                                                  {isPartDetailsOpen ? 'Hide tags' : `+ ${partMoreTagCount} more tags`}
                                                </button>
                                              </span>
                                              {isPartDetailsOpen ? (
                                                <span className="question-bank-created-sub-details">
                                                  {partTags.length ? (
                                                    <span className="question-bank-created-descriptive-tags" aria-label={`Tags for sub-question ${String.fromCharCode(97 + partIndex)}`}>
                                                      {partTags.flatMap((group) => group.values.map((value) => (
                                                        <span key={`${part.key}-${group.label}-${value}`} className="question-bank-created-inline-tag-chip">
                                                          <b>{group.label}</b>
                                                          <span>{value}</span>
                                                        </span>
                                                      )))}
                                                    </span>
                                                  ) : null}
                                                  {partAnswer ? (
                                                    <span className="question-bank-created-inline-answer">
                                                      <b>Model answer</b>
                                                      <span>{partAnswer}</span>
                                                    </span>
                                                  ) : null}
                                                  {partNotes ? (
                                                    <span className="question-bank-created-inline-answer question-bank-created-inline-answer-notes">
                                                      <b>Examiner's marking notes</b>
                                                      <span>{partNotes}</span>
                                                    </span>
                                                  ) : null}
                                                  {partFatalFlaw ? (
                                                    <span className="question-bank-created-inline-answer question-bank-created-inline-answer-flaw">
                                                      <b><TriangleAlert size={12} strokeWidth={2.2} aria-hidden="true" /> Fatal flaw</b>
                                                      <span>{partFatalFlaw}</span>
                                                    </span>
                                                  ) : null}
                                                </span>
                                              ) : null}
                                            </span>
                                          )
                                        })}
                                      </span>
                                    ) : null}
                                    {isDescriptiveCard && !isCreatedSaqSingleQuestionOutput && !shouldShowCreatedSubQuestionFlow ? (() => {
                                      const rootAnswer = getModelAnswerPreview(question.answerKey)
                                      const descriptiveAnswerItems = descriptiveSections.length
                                        ? descriptiveSections.flatMap((section, sectionIndex) => {
                                          const sectionLabel = ROMAN_NUMERALS[sectionIndex] ?? sectionIndex + 1
                                          const sectionChildren = section.children ?? []
                                          if (!sectionChildren.length) {
                                            const sectionAnswer = getModelAnswerPreview(section.answerKey) || rootAnswer
                                            return sectionAnswer ? [{
                                              key: `${section.id ?? `${question.id}-section-${sectionIndex}`}-answer`,
                                              label: `${String.fromCharCode(97 + sectionIndex)}.`,
                                              text: sectionAnswer,
                                            }] : []
                                          }
                                          return sectionChildren.map((child, childIndex) => {
                                            const childAnswer = getModelAnswerPreview(child.answerKey) || getModelAnswerPreview(section.answerKey) || rootAnswer
                                            return childAnswer ? {
                                              key: `${child.id ?? `${section.id ?? sectionIndex}-child-${childIndex}`}-answer`,
                                              label: `${sectionLabel}.${String.fromCharCode(97 + childIndex)}.`,
                                              text: childAnswer,
                                            } : null
                                          }).filter(Boolean)
                                        })
                                        : rootAnswer ? [{
                                          key: `${question.id}-main-answer`,
                                          label: 'Main question',
                                          text: rootAnswer,
                                        }] : []

                                      return descriptiveAnswerItems.length ? (
                                        <span className="question-bank-created-descriptive-answer is-bottom">
                                          <b>Model Answer</b>
                                          {descriptiveAnswerItems.map((answerItem) => (
                                            <span key={answerItem.key}>
                                              <strong>{answerItem.label}</strong>
                                              <span>{answerItem.text}</span>
                                            </span>
                                          ))}
                                        </span>
                                      ) : null
                                    })() : null}
                                    {!isDescriptiveCard && getRichTextPreview(question.answerKey) ? (
                                      question.type === 'MCQ' ? (
                                        <span className="question-bank-created-mcq-review">
                                          <span className="question-bank-created-mcq-answer-card">
                                            <b>Answer key & rationale</b>
                                            <span>{getModelAnswerPreview(question.answerKey)}</span>
                                          </span>
                                          <span className="question-bank-created-mcq-answer-card is-notes">
                                            <b>Examiner's marking notes</b>
                                            <span>{getExaminerNotesPreview(question, question)}</span>
                                          </span>
                                        </span>
                                      ) : (
                                        <span className="question-bank-created-answer">
                                          <b>Answer & Explanation</b>
                                          {getModelAnswerPreview(question.answerKey)}
                                        </span>
                                      )
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

                          </article>
                        )
                      })}
                    </div>
                  </section>
                ) : null}

                {approvalSelectedIds.length ? (
                  <div className="question-bank-floating-selection-bar" role="status" aria-live="polite">
                    <button
                      type="button"
                      className="question-bank-icon-btn question-bank-floating-selection-close"
                      onClick={cancelApprovalSelection}
                      aria-label="Clear selected questions"
                      title="Clear selected questions"
                    >
                      <X size={15} strokeWidth={2.2} />
                    </button>
                    <span className="question-bank-approval-count-badge">
                      {approvalSelectedIds.length} selected
                    </span>
                    <span className="question-bank-floating-selection-actions">
                      <button
                        type="button"
                        className="question-bank-secondary-btn"
                        onClick={selectAllApprovalQuestions}
                        disabled={hasAllApprovalSelected}
                      >
                        <CheckCheck size={14} strokeWidth={2.2} />
                        Select all
                      </button>
                      <button
                        type="button"
                        className="question-bank-secondary-btn"
                        onClick={unselectAllApprovalQuestions}
                      >
                        <X size={14} strokeWidth={2.2} />
                        Unselect all
                      </button>
                      <button
                        type="button"
                        className="question-bank-primary-btn"
                        onClick={sendSelectedQuestionsToApproval}
                      >
                        <CheckCircle2 size={14} strokeWidth={2.2} />
                        Send selected
                      </button>
                    </span>
                  </div>
                ) : null}

                {['created', 'uploaded', 'draft', 'sent', 'approved', 'rejected', 'report'].includes(activeQuestionTab) && !activeQuestionCards.length ? (
                  <section className="question-bank-created-panel">
                    {approvalStatusTabs}
                    <div className="question-bank-empty-state question-bank-tab-empty-state">
                      <FilePenLine size={24} strokeWidth={2} />
                      <strong>
                        {activeQuestionTab === 'draft'
                          ? 'No draft questions yet'
                          : activeQuestionTab === 'uploaded'
                            ? 'No uploaded questions yet'
                          : activeQuestionTab === 'sent'
                            ? 'No questions sent to approval yet'
                            : activeQuestionTab === 'approved'
                              ? 'No approved questions yet'
                              : activeQuestionTab === 'rejected'
                                ? 'No disapproved questions yet'
                            : activeQuestionTab === 'report'
                              ? 'No reported questions yet'
                            : 'No created questions yet'}
                      </strong>
                      <p>
                        {activeQuestionTab === 'draft'
                          ? 'Save a question as draft to see it here.'
                          : activeQuestionTab === 'uploaded'
                            ? 'Uploaded questions will appear here.'
                          : activeQuestionTab === 'sent'
                            ? 'Send created questions for approval to see them here.'
                            : activeQuestionTab === 'approved'
                              ? 'Approved questions will appear here after review.'
                              : activeQuestionTab === 'rejected'
                                ? 'Disapproved questions will appear here for correction.'
                            : activeQuestionTab === 'report'
                              ? 'Reported questions will appear here for review.'
                            : 'Create a question to see it here.'}
                      </p>
                    </div>
                  </section>
                ) : null}

              </div>
            </div>
            ) : (
            null
            )}
            </section>
          </section>
        </main>
      </div>

      {uploadWizard.isOpen && typeof document !== 'undefined' ? createPortal((
        <div className="question-bank-upload-wizard" role="dialog" aria-modal="true" aria-labelledby="question-bank-upload-wizard-title">
          <div className="question-bank-upload-wizard-backdrop" />
          <div className="question-bank-upload-wizard-card">
            <div className="question-bank-upload-wizard-head">
              <span className="question-bank-upload-import-icon">
                <Upload size={18} strokeWidth={2.3} />
              </span>
              <div>
                <span id="question-bank-upload-wizard-title" className="question-bank-upload-wizard-eyebrow">Question Bank Upload</span>
                <p>Analyze the Excel CSV template, generate questions, then add them to Upload Ques.</p>
              </div>
              {!isUploadWizardLocked ? (
                <button
                  type="button"
                  className="question-bank-upload-wizard-close"
                  onClick={closeUploadWizard}
                  aria-label="Close upload wizard"
                >
                  <X size={16} strokeWidth={2.4} />
                </button>
              ) : <span />}
            </div>

            <div className="question-bank-upload-wizard-steps" aria-label="Upload progress">
              {['Upload', 'Analyze', 'Generate', 'Complete'].map((stepLabel, stepIndex) => {
                const currentStep = uploadWizard.status === 'idle'
                  ? 0
                  : uploadWizard.status === 'analyzing' || uploadWizard.status === 'error'
                    ? 1
                    : uploadWizard.status === 'ready' || uploadWizard.status === 'generating'
                      ? 2
                      : 3
                return (
                  <span key={stepLabel} className={stepIndex <= currentStep ? 'is-active' : ''}>
                    <b>{stepIndex + 1}</b>
                    <em>{stepLabel}</em>
                  </span>
                )
              })}
            </div>

            {uploadWizard.status === 'idle' ? (
              <>
                <div className="question-bank-upload-wizard-fields">
                  <QuestionBankUploadDropdown
                    label="Subject"
                    placeholder="Choose subject"
                    searchPlaceholder="Search subject"
                    value={uploadWizard.subject}
                    options={uploadWizardSubjectOptions}
                    onChange={(value) => updateUploadWizardField('subject', value)}
                  />
                  <QuestionBankUploadDropdown
                    label="Topic"
                    placeholder="Select topic"
                    searchPlaceholder="Search topic"
                    value={uploadWizard.topic}
                    options={uploadWizardTopicOptions}
                    onChange={(value) => updateUploadWizardField('topic', value)}
                    disabled={!uploadWizard.subject}
                  />
                  <QuestionBankUploadDropdown
                    label="Competency"
                    placeholder="Select competency"
                    searchPlaceholder="Search competency"
                    value={uploadWizard.competency}
                    options={uploadWizardCompetencyOptions.map((competency) => ({
                      value: competency.value,
                      label: `${competency.code} - ${competency.label}`,
                    }))}
                    onChange={(value) => updateUploadWizardField('competency', value)}
                    disabled={!uploadWizard.topic}
                  />
                </div>
                <label className={`question-bank-upload-wizard-drop ${!canBrowseUploadFile ? 'is-disabled' : ''}`}>
                  <input type="file" accept=".csv,.txt,.xls,.xlsx" onChange={handleUploadQuestionFile} disabled={!canBrowseUploadFile} />
                  <span className="question-bank-upload-wizard-drop-icon">
                    <Upload size={24} strokeWidth={2.3} />
                  </span>
                  <span className="question-bank-upload-wizard-drop-copy">
                    <strong>Choose Excel CSV file</strong>
                    <span>{canBrowseUploadFile ? 'Use the sample templates and save from Excel as CSV.' : 'Select subject, topic, and competency before browsing.'}</span>
                  </span>
                  <span className="question-bank-upload-wizard-drop-action">Browse file</span>
                </label>
              </>
            ) : null}

            {uploadWizard.status === 'analyzing' ? (
              <div className="question-bank-upload-wizard-state">
                <LoaderCircle size={24} strokeWidth={2.3} className="question-bank-spin-icon" />
                <strong>Analyzing file</strong>
                <span>{uploadWizard.fileName || 'Checking rows and required fields...'}</span>
                <span className="question-bank-upload-generation-progress">
                  <span style={{ width: `${Math.round(((EXCEL_UPLOAD_ANALYZE_SECONDS - uploadWizard.remainingSeconds) / EXCEL_UPLOAD_ANALYZE_SECONDS) * 100)}%` }} />
                </span>
                <em>{formatUploadWizardTime(uploadWizard.remainingSeconds)} remaining</em>
              </div>
            ) : null}

            {uploadWizard.status === 'error' ? (
              <div className="question-bank-upload-validation is-error">
                <strong>Upload needs correction</strong>
                <p>Fix these rows in Excel, save as CSV, and upload again.</p>
                <div className="question-bank-upload-error-table-wrap">
                  <table className="question-bank-upload-error-table">
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Field</th>
                        <th>Issue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadWizardErrorRows.map((errorRow) => (
                        <tr key={errorRow.id}>
                          <td>{errorRow.row}</td>
                          <td>{errorRow.field}</td>
                          <td>{errorRow.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {uploadWizard.status === 'ready' ? (
              <div className="question-bank-upload-generation-panel">
                <div>
                  <strong>Ready to generate</strong>
                  <span>{uploadWizardQuestionCount} question{uploadWizardQuestionCount === 1 ? '' : 's'} validated from {uploadWizard.fileName}</span>
                </div>
                <span className="question-bank-upload-generation-progress">
                  <span style={{ width: '100%' }} />
                </span>
                <div className="question-bank-upload-generation-meta">
                  <span>
                    <strong>{formatUploadWizardTime(uploadWizard.totalSeconds)}</strong>
                    <em>Estimated generation</em>
                  </span>
                  <span>
                    <strong>{uploadWizard.subject || 'Curriculum mapping'}</strong>
                    <em>{uploadWizard.topic} / {selectedUploadCompetency?.code || 'Competency'}</em>
                  </span>
                </div>
              </div>
            ) : null}

            {uploadWizard.status === 'generating' ? (
              <div className="question-bank-upload-generation-panel">
                <div>
                  <strong>Generating questions</strong>
                  <span>{uploadWizard.generatedCount} of {uploadWizardQuestionCount} generated</span>
                </div>
                <span className="question-bank-upload-generation-progress">
                  <span style={{ width: `${uploadWizardProgress}%` }} />
                </span>
                <div className="question-bank-upload-generation-meta">
                  <span>
                    <strong>{formatUploadWizardTime(uploadWizard.remainingSeconds)}</strong>
                    <em>Remaining time</em>
                  </span>
                  <span>
                    <strong>{formatUploadWizardTime(uploadWizard.totalSeconds)}</strong>
                    <em>Total estimated</em>
                  </span>
                </div>
              </div>
            ) : null}

            {uploadWizard.status === 'complete' ? (
              <div className="question-bank-upload-wizard-state is-complete">
                <CheckCircle2 size={28} strokeWidth={2.3} />
                <strong>Question generation completed</strong>
                <span>{uploadWizard.generatedCount} questions are ready for approval.</span>
              </div>
            ) : null}

            <div className="question-bank-upload-wizard-actions">
              {uploadWizard.status === 'idle' || uploadWizard.status === 'error' ? (
                <>
                  <button type="button" className="question-bank-secondary-btn" onClick={closeUploadWizard}>
                    Close
                  </button>
                  <button type="button" className="question-bank-secondary-btn" onClick={resetUploadWizard}>
                    Reset Upload
                  </button>
                </>
              ) : null}
              {uploadWizard.status === 'generating' ? (
                <button type="button" className="question-bank-primary-btn danger" onClick={stopUploadGeneration}>
                  Stop Generation
                </button>
              ) : null}
              {uploadWizard.status === 'ready' ? (
                <button type="button" className="question-bank-primary-btn" onClick={startUploadGeneration}>
                  <Sparkles size={15} strokeWidth={2.2} />
                  Start Generate
                </button>
              ) : null}
              {uploadWizard.status === 'complete' ? (
                <>
                  <button type="button" className="question-bank-secondary-btn" onClick={saveGeneratedUploadQuestionsForLater}>
                    Approval Later
                  </button>
                  <button type="button" className="question-bank-primary-btn" onClick={openGeneratedUploadApprovalModal}>
                    <Send size={15} strokeWidth={2.2} />
                    Sent to Approval
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ), document.body) : null}

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

      {pendingDescriptiveBuilderMode && typeof document !== 'undefined' ? createPortal((
        <div
          className="question-bank-approval-modal question-bank-mode-confirm-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="question-bank-mode-confirm-title"
        >
          <button
            type="button"
            className="question-bank-approval-modal-backdrop"
            onClick={cancelDescriptiveBuilderModeChange}
            aria-label="Close question type confirmation"
          />
          <div className="question-bank-approval-modal-card question-bank-mode-confirm-card">
            <div className="question-bank-mode-confirm-head">
              <span className="question-bank-mode-confirm-icon">
                <ListChecks size={18} strokeWidth={2.2} />
              </span>
              <div>
                <h2 id="question-bank-mode-confirm-title">
                  Switch to {pendingDescriptiveBuilderMode}?
                </h2>
                <p>
                  {pendingDescriptiveBuilderMode === 'SAQs'
                    ? 'SAQs uses a separate short-answer question flow. Switching will clear this LAQ form.'
                    : 'LAQs uses the long-answer case stem and sub-question flow. Switching will clear this SAQ form.'}
                </p>
              </div>
              <button
                type="button"
                className="question-bank-icon-btn"
                onClick={cancelDescriptiveBuilderModeChange}
                aria-label="Close question type confirmation"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>
            <div className="question-bank-mode-confirm-actions">
              <button type="button" className="question-bank-secondary-btn" onClick={cancelDescriptiveBuilderModeChange}>
                No
              </button>
              <button type="button" className="question-bank-primary-btn" onClick={confirmDescriptiveBuilderModeChange}>
                Switch to {pendingDescriptiveBuilderMode}
              </button>
            </div>
          </div>
        </div>
      ), document.body) : null}

      {isApprovalModalOpen && typeof document !== 'undefined' ? createPortal((
        <div className={`question-bank-approval-modal ${pendingUploadApprovalQuestions.length ? 'is-upload-approval' : ''}`} role="dialog" aria-modal="true" aria-labelledby="question-bank-approval-title">
          <button
            type="button"
            className="question-bank-approval-modal-backdrop"
            onClick={closeApprovalModal}
            aria-label="Close send to approval"
          />
          <div className="question-bank-approval-modal-card">
            <div className="question-bank-approval-modal-head">
              <div>
                <h2 id="question-bank-approval-title">Send to Approval</h2>
                <p>{approvalModalQuestionCount} selected question{approvalModalQuestionCount === 1 ? '' : 's'} will be sent for review</p>
              </div>
              <button
                type="button"
                className="question-bank-icon-btn"
                onClick={closeApprovalModal}
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
              <button type="button" className="question-bank-secondary-btn" onClick={closeApprovalModal}>
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
