export const DESCRIPTIVE_QUESTION_TYPES = [
  {
    type: 'Desc Long Answer Questions (LAQs)',
    shortLabel: 'LAQs',
    menuLabel: 'Long Answer Questions (LAQs)',
  },
  {
    type: 'Desc Short Answer Questions (SAQs)',
    shortLabel: 'SAQs',
    menuLabel: 'Short Answer Questions (SAQs)',
  },
  {
    type: 'Desc Modified Essay Questions (MEQs)',
    shortLabel: 'MEQs',
    menuLabel: 'Modified Essay Questions (MEQs)',
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
