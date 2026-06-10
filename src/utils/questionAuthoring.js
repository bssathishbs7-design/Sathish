export const DESCRIPTIVE_QUESTION_TYPES = [
  {
    type: 'Desc Long Answer Questions (LAQs)',
    shortLabel: 'LAQs',
    menuLabel: 'Descriptive LAQs',
  },
  {
    type: 'Desc Short Answer Questions (SAQs)',
    shortLabel: 'SAQs',
    menuLabel: 'Descriptive SAQs',
  },
  {
    type: 'Desc Modified Essay Questions (MEQs)',
    shortLabel: 'MEQs',
    menuLabel: 'Descriptive MEQs',
  },
]

export const DESCRIPTIVE_QUESTION_TYPE_SET = new Set([
  'Descriptive Question',
  ...DESCRIPTIVE_QUESTION_TYPES.map((item) => item.type),
])

export const QUESTION_CATEGORY_OPTIONS = ['Direct', 'Reasoning', 'Aetcom', 'Application']

export const getQuestionCategorySelectOptions = (questionType) => (
  QUESTION_CATEGORY_OPTIONS.map((option) => (
    questionType === 'MCQ' && option === 'Aetcom' ? 'Critical Thinking' : option
  ))
)

export const getQuestionCategorySelectValue = (questionType, value) => (
  questionType === 'MCQ' && value === 'Aetcom' ? 'Critical Thinking' : value
)

let authoringSequence = 1

export const isDescriptiveQuestionType = (type) => DESCRIPTIVE_QUESTION_TYPE_SET.has(type)

export const getBaseQuestionTypeMeta = (type) => (
  { type: 'MCQ', shortLabel: 'MCQ', menuLabel: 'Multiple Choice Question' }.type === type
    ? { type: 'MCQ', shortLabel: 'MCQ', menuLabel: 'Multiple Choice Question' }
    : DESCRIPTIVE_QUESTION_TYPES.find((item) => item.type === type)
      ?? (type === 'Descriptive Question'
        ? { type, shortLabel: 'SAQs', menuLabel: 'Descriptive SAQs' }
        : { type: 'MCQ', shortLabel: 'MCQ', menuLabel: 'Multiple Choice Question' })
)

export const getShortCompetencyLabel = (value) => String(value ?? '').split(/\s+/)[0] || value

export const createAuthoringOption = ({ idPrefix = 'option', label = '' } = {}) => ({
  id: `${idPrefix}-${Date.now()}-${authoringSequence++}`,
  label,
  distractorErrors: [],
})

export const createAuthoringDescriptiveInsideQuestion = ({
  idPrefix = 'descriptive-inside',
  source = {},
  includeAnswerKey = true,
} = {}) => ({
  id: `${idPrefix}-${Date.now()}-${authoringSequence++}`,
  questionText: '',
  marks: '0',
  ...(includeAnswerKey ? { answerKey: '' } : {}),
  year: source.year ?? '',
  subject: source.subject ?? '',
  topics: [...(source.topics ?? [])],
  competencies: [...(source.competencies ?? [])],
})

export const createAuthoringDescriptiveSubQuestion = ({
  idPrefix = 'descriptive-sub',
  optionIdPrefix = 'option',
  source = {},
  includeAnswerKey = true,
} = {}) => ({
  id: `${idPrefix}-${Date.now()}-${authoringSequence++}`,
  type: 'text',
  questionText: '',
  marks: '0',
  ...(includeAnswerKey ? { answerKey: '' } : {}),
  year: source.year ?? '',
  subject: source.subject ?? '',
  topics: [...(source.topics ?? [])],
  competencies: [...(source.competencies ?? [])],
  options: Array.from({ length: 4 }, () => createAuthoringOption({ idPrefix: optionIdPrefix })),
  correctOptionIds: [],
  children: [],
})

export const createAuthoringQuestion = ({
  idPrefix = 'question',
  optionIdPrefix = 'option',
  type = 'MCQ',
  title = '',
  config = {},
  defaultOptionalTag = 'Not Applicable',
  status = 'Editing',
  includeQuestionBankFields = false,
} = {}) => ({
  id: `${idPrefix}-${Date.now()}-${authoringSequence++}`,
  title,
  type,
  parentId: config.parentId ?? null,
  level: config.level ?? 'parent',
  questionText: '',
  year: config.year ?? '',
  subject: config.subject ?? '',
  topics: [...(config.topics ?? [])],
  competencies: [...(config.competencies ?? [])],
  images: [],
  questionCategory: '',
  cognitiveLevel: '',
  thinkingLevel: '',
  difficultyLevel: '',
  cognitiveFunction: '',
  skillFocus: '',
  organSystem: '',
  organSubSystems: [defaultOptionalTag],
  diseaseTags: [defaultOptionalTag],
  keyConcepts: [defaultOptionalTag],
  answerKey: '',
  options: Array.from({ length: 4 }, () => createAuthoringOption({ idPrefix: optionIdPrefix })),
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
  status,
  ...(includeQuestionBankFields ? { revisionStatus: 'Created', editCount: 0 } : {}),
  descriptiveSections: [],
})
