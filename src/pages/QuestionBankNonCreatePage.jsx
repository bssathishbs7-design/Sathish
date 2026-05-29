import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardList, FileSearch, Flag, Filter, Info, LayoutGrid, ListChecks, Pencil, Plus, Search, Share2, Shuffle, Star, X } from 'lucide-react'
import { stripHtml } from '../utils/mathText'
import { APP_PAGES } from '../config/appPages'
import medsyIcon from '../assets/medsy-icon.svg'
import '../styles/assessment-pages.css'

const QUESTION_BANK_PUBLISHED_KEY = 'vx-question-bank-published-questions'
const QUESTION_BANK_UPLOADED_KEY = 'vx-question-bank-uploaded-questions'
const QUESTION_BANK_STORAGE_KEY = 'vx-question-bank-questions'
const QUESTION_BANK_REPORTED_KEY = 'vx-question-bank-reported-questions'
const QUESTION_BANK_CREATED_REPORTED_KEY = 'vx-question-bank-created-reported-questions'
const QUESTION_BANK_EDIT_HANDOFF_KEY = 'vx-question-bank-edit-handoff'
const QUESTION_BANK_FAVORITE_STORAGE_KEYS = [QUESTION_BANK_PUBLISHED_KEY, QUESTION_BANK_UPLOADED_KEY, QUESTION_BANK_STORAGE_KEY]
const REPORT_REASON_OPTIONS = [
  'Wrong answer',
  'Duplicate question',
  'Poor explanation',
  'Incorrect difficulty',
  'Wrong topic / competency',
  'Typo or unclear wording',
  'Other',
]
const REPORT_AUTHOR_ACTION_OPTIONS = [
  'Delete this question',
  'Regenerate this question',
]
const OLD_DEFAULT_ANSWER_TEXT = 'Correct answer: Review the selected option and add the supporting rationale.'
const CURRENT_DEFAULT_ANSWER_TEXT = 'Add the correct option and explanation.'
const DESCRIPTIVE_TYPE_LABELS = new Map([
  ['desc long answer questions (laqs)', 'LAQs'],
  ['desc short answer questions (saqs)', 'SAQs'],
  ['desc modified essay questions (meqs)', 'MEQs'],
  ['descriptive question', 'SAQs'],
  ['descriptive', 'SAQs'],
])
const DESCRIPTIVE_FILTER_TYPE_LABELS = new Map([
  ['LAQs', 'Descriptive (LAQs)'],
  ['SAQs', 'Descriptive (SAQs)'],
  ['MEQs', 'Descriptive (MEQs)'],
])

const getQuestionPreview = (question) => stripHtml(question?.questionText) || question?.title || 'Untitled question'
const getCompetencyCode = (value) => String(value ?? '').trim().split(/\s+/)[0] || value

const MEDSY_MCQ_SAMPLE_QUESTIONS = [
  ['Which structure passes through the optic canal along with the ophthalmic artery?', 'Optic nerve', 'Oculomotor nerve', 'Trochlear nerve', 'Abducens nerve', 'General Anatomy', 'AN1.1 Describe anatomical position and planes', 'Nervous', 'Optic pathway', 'Optic nerve passes through the optic canal with the ophthalmic artery.'],
  ['Which plane divides the body into superior and inferior parts?', 'Transverse plane', 'Sagittal plane', 'Coronal plane', 'Median plane', 'General Anatomy', 'AN1.1 Describe anatomical position and planes', 'General anatomy', 'Body planes', 'The transverse plane divides the body into superior and inferior parts.'],
  ['Which muscle initiates abduction of the shoulder joint?', 'Supraspinatus', 'Deltoid', 'Teres minor', 'Infraspinatus', 'Upper Limb', 'AN1.5 Describe muscles and movements of upper limb', 'Musculoskeletal', 'Shoulder', 'Supraspinatus initiates the first 15 degrees of shoulder abduction.'],
  ['Which nerve is most commonly injured in surgical neck fracture of humerus?', 'Axillary nerve', 'Radial nerve', 'Median nerve', 'Ulnar nerve', 'Upper Limb', 'AN1.5 Describe muscles and movements of upper limb', 'Nervous', 'Peripheral nerve', 'The axillary nerve winds around the surgical neck of the humerus and is vulnerable in fractures.'],
  ['Which artery is palpated in the anatomical snuffbox?', 'Radial artery', 'Ulnar artery', 'Brachial artery', 'Anterior interosseous artery', 'Upper Limb', 'AN1.5 Describe muscles and movements of upper limb', 'Cardiovascular', 'Blood vessel', 'The radial artery passes through the anatomical snuffbox and can be palpated there.'],
  ['Which carpal bone is most commonly fractured after a fall on the outstretched hand?', 'Scaphoid', 'Lunate', 'Triquetrum', 'Pisiform', 'Upper Limb', 'AN1.5 Describe muscles and movements of upper limb', 'Skeletal', 'Bone', 'The scaphoid is the most commonly fractured carpal bone in a fall on an outstretched hand.'],
  ['Which nerve supplies the diaphragm motor function?', 'Phrenic nerve', 'Vagus nerve', 'Intercostal nerve', 'Accessory nerve', 'Thorax', 'AN2.3 Explain mediastinal relations and surface anatomy', 'Respiratory', 'Diaphragm', 'The phrenic nerve provides motor supply to the diaphragm.'],
  ['Which valve is best heard at the left fifth intercostal space in the midclavicular line?', 'Mitral valve', 'Aortic valve', 'Pulmonary valve', 'Tricuspid valve', 'Thorax', 'AN2.3 Explain mediastinal relations and surface anatomy', 'Cardiovascular', 'Heart', 'The mitral valve area is located at the cardiac apex in the left fifth intercostal space.'],
  ['Which cranial nerve carries taste from the anterior two-thirds of the tongue?', 'Facial nerve', 'Glossopharyngeal nerve', 'Trigeminal nerve', 'Vagus nerve', 'Neuroanatomy', 'AN4.2 Identify major cranial nerve pathways', 'Nervous', 'Cranial nerve', 'Taste from the anterior two-thirds of the tongue is carried by the facial nerve via chorda tympani.'],
  ['Which lung volume cannot be measured by simple spirometry?', 'Residual volume', 'Tidal volume', 'Inspiratory reserve volume', 'Expiratory reserve volume', 'Respiratory System', 'PY6.8 Interpret spirometry and lung volumes', 'Respiratory', 'Lung', 'Residual volume cannot be directly measured by simple spirometry.'],
]

const MEDSY_DESCRIPTIVE_SAMPLE_QUESTIONS = [
  ['Define anatomical position and mention two key features used to describe it.', 'General Anatomy', 'AN1.1 Describe anatomical position and planes', 'General anatomy', 'Anatomical terminology'],
  ['Describe the boundaries and clinical importance of the anatomical snuffbox.', 'Upper Limb', 'AN1.5 Describe muscles and movements of upper limb', 'Musculoskeletal', 'Wrist anatomy'],
  ['Explain the course and functional importance of the phrenic nerve.', 'Thorax', 'AN2.3 Explain mediastinal relations and surface anatomy', 'Respiratory', 'Diaphragm'],
  ['Describe the surface marking of the mitral valve area and its auscultatory relevance.', 'Thorax', 'AN2.3 Explain mediastinal relations and surface anatomy', 'Cardiovascular', 'Heart sounds'],
  ['Explain the anatomical basis for axillary nerve injury in surgical neck fracture of humerus.', 'Upper Limb', 'AN1.5 Describe muscles and movements of upper limb', 'Nervous', 'Peripheral nerve'],
  ['Describe the role of type II pneumocytes in alveolar function.', 'Respiratory System', 'PY6.8 Interpret spirometry and lung volumes', 'Respiratory', 'Pulmonary surfactant'],
  ['Explain why residual volume cannot be measured by simple spirometry.', 'Respiratory System', 'PY6.8 Interpret spirometry and lung volumes', 'Respiratory', 'Lung volumes'],
  ['Describe the causes and peripheral smear features of macrocytic anemia.', 'Hematology', 'PA3.4 Classify anemia using peripheral smear findings', 'Cardiovascular', 'Anemia'],
  ['Explain apoptosis and contrast it with necrosis.', 'General Pathology', 'PA1.2 Explain cell injury and adaptation', 'General pathology', 'Cell injury'],
  ['Describe the regulation of blood calcium by parathyroid hormone.', 'General Physiology', 'PY1.4 Describe body fluid compartments and homeostasis', 'Endocrine', 'Calcium homeostasis'],
]

const createMedsyMcqSampleQuestions = () => MEDSY_MCQ_SAMPLE_QUESTIONS.map(([
  questionText,
  correctAnswer,
  optionB,
  optionC,
  optionD,
  topic,
  competency,
  organSystem,
  organSubSystem,
  answerKey,
], index) => {
  const questionNumber = index + 1
  const isHigherOrder = index % 3 === 1

  return {
    id: `medsy-uploaded-sample-${questionNumber}`,
    type: 'MCQ',
    authorName: 'Medsy',
    questionText,
    year: 'Year 1',
    subject: ['Respiratory System', 'Cardiovascular System', 'General Physiology'].includes(topic) ? 'Physiology' : topic.includes('Pathology') || competency.startsWith('PA') ? 'Pathology' : 'Human Anatomy',
    topics: [topic],
    competencies: [competency],
    questionCategory: isHigherOrder ? 'Application' : 'Direct',
    cognitiveLevel: isHigherOrder ? 'Apply' : 'Recall',
    cognitiveFunction: isHigherOrder ? 'Clinical Reasoning' : 'Pattern Recognition',
    skillFocus: isHigherOrder ? 'Diagnosis' : 'Identification',
    organSystem,
    organSubSystems: [organSubSystem],
    diseaseTags: index % 4 === 0 ? ['Clinical correlation'] : ['Not Applicable'],
    keyConcepts: isHigherOrder ? ['Diagnostic clue'] : ['Core concept'],
    thinkingLevel: isHigherOrder ? 'HoT' : 'LoT',
    difficultyLevel: index % 5 === 0 ? 'L2' : 'L1',
    options: [
      { id: `medsy-${questionNumber}-a`, label: correctAnswer, distractorErrors: [] },
      { id: `medsy-${questionNumber}-b`, label: optionB, distractorErrors: ['Terminology Confusion'] },
      { id: `medsy-${questionNumber}-c`, label: optionC, distractorErrors: ['False Association'] },
      { id: `medsy-${questionNumber}-d`, label: optionD, distractorErrors: ['Misclassification'] },
    ],
    correctOptionIds: [`medsy-${questionNumber}-a`],
    answerKey,
    questionBankSentAt: new Date(`2026-05-22T09:${String(index).padStart(2, '0')}:00+05:30`).toISOString(),
  }
})

const createMedsyDescriptiveSampleQuestions = () => MEDSY_DESCRIPTIVE_SAMPLE_QUESTIONS.map(([
  questionText,
  topic,
  competency,
  organSystem,
  organSubSystem,
], index) => {
  const questionNumber = index + 11
  const isHigherOrder = index % 2 === 0

  return {
    id: `medsy-uploaded-sample-${questionNumber}`,
    type: 'Descriptive Question',
    authorName: 'Medsy',
    questionText,
    year: 'Year 1',
    subject: ['Respiratory System', 'General Physiology'].includes(topic) ? 'Physiology' : topic.includes('Pathology') || competency.startsWith('PA') ? 'Pathology' : 'Human Anatomy',
    topics: [topic],
    competencies: [competency],
    questionCategory: isHigherOrder ? 'Reasoning' : 'Direct',
    cognitiveLevel: isHigherOrder ? 'Analyze' : 'Understand',
    cognitiveFunction: isHigherOrder ? 'Concept Explanation' : 'Concept Recall',
    skillFocus: isHigherOrder ? 'Structured explanation' : 'Definition',
    organSystem,
    organSubSystems: [organSubSystem],
    diseaseTags: ['Not Applicable'],
    keyConcepts: ['Core concept'],
    thinkingLevel: isHigherOrder ? 'HoT' : 'LoT',
    difficultyLevel: index % 3 === 0 ? 'L2' : 'L1',
    options: [],
    correctOptionIds: [],
    descriptiveSections: [
      {
        id: `medsy-desc-${questionNumber}-section-1`,
        questionText: 'Mention the key anatomical or physiological points.',
        marks: '2',
        children: [
          {
            id: `medsy-desc-${questionNumber}-child-1`,
            questionText: 'Add one relevant clinical correlation.',
            marks: '1',
          },
        ],
      },
    ],
    answerKey: '',
    questionBankSentAt: new Date(`2026-05-22T09:${String(questionNumber).padStart(2, '0')}:00+05:30`).toISOString(),
  }
})

const createMedsySampleQuestions = () => [
  ...createMedsyMcqSampleQuestions(),
  ...createMedsyDescriptiveSampleQuestions(),
]

const cleanQuestionBankItems = (items) => items
  .filter((question, index) => (
    !(index === 6 && getQuestionPreview(question).trim().toLowerCase() === 'data')
  ))
  .map((question) => ({
    ...question,
    answerKey: typeof question.answerKey === 'string'
      ? question.answerKey
        .replaceAll(OLD_DEFAULT_ANSWER_TEXT, CURRENT_DEFAULT_ANSWER_TEXT)
        .replaceAll('Correct answer: Add the correct option and explanation.', CURRENT_DEFAULT_ANSWER_TEXT)
      : question.answerKey,
  }))

const readStoredQuestionList = (storageKey) => {
  if (typeof window === 'undefined') return []

  try {
    if (storageKey === QUESTION_BANK_UPLOADED_KEY) {
      const sampleQuestions = createMedsySampleQuestions()
      const existingRaw = window.localStorage.getItem(storageKey)

      if (!existingRaw) {
        window.localStorage.setItem(storageKey, JSON.stringify(sampleQuestions))
      } else {
        const existingUploaded = JSON.parse(existingRaw)
        if (Array.isArray(existingUploaded)) {
          const sampleById = new Map(sampleQuestions.map((question) => [question.id, question]))
          const refreshedUploaded = existingUploaded.filter((question) => (
            !String(question?.id ?? '').startsWith('medsy-uploaded-sample-')
            || sampleById.has(question.id)
          )).map((question) => {
            const sampleQuestion = sampleById.get(question.id)
            if (!sampleQuestion) return question

            return {
              ...sampleQuestion,
              isFavorite: isFavoriteQuestion(question),
            }
          })
          const missingSamples = sampleQuestions.filter((sample) => (
            !refreshedUploaded.some((question) => question.id === sample.id)
          ))
          window.localStorage.setItem(storageKey, JSON.stringify([...refreshedUploaded, ...missingSamples]))
        }
      }
    }

    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(parsed)) return []

    const cleanedQuestions = cleanQuestionBankItems(parsed).filter(isAllQuestionBankQuestion)

    if (JSON.stringify(cleanedQuestions) !== JSON.stringify(parsed)) {
      window.localStorage.setItem(storageKey, JSON.stringify(cleanedQuestions))
      window.dispatchEvent(new Event('question-bank-published-questions'))
    }

    return cleanedQuestions
  } catch {
    return []
  }
}

const getQuestionAuthorName = (question) => (
  question?.authorName
  ?? question?.createdByName
  ?? question?.senderName
  ?? 'Karthik Subramanian'
)

const isEditedQuestion = (question) => Boolean(
  question?.sourceQuestionId
  || String(question?.revisionStatus ?? '').trim().toLowerCase() === 'edited'
  || Number(question?.editCount ?? question?.revisionCount ?? 0) > 0,
)

const isMedsyQuestion = (question) => (
  getQuestionAuthorName(question).trim().toLowerCase() === 'medsy'
  && !isEditedQuestion(question)
)

const isApprovedQuestion = (question) => (
  question?.status === 'Approved'
  || Boolean(question?.questionBankSentAt)
  || question?.questionBankStatus === 'Sent to Question Bank'
)

const isAllQuestionBankQuestion = (question) => isMedsyQuestion(question) || isApprovedQuestion(question)

const isFavoriteQuestion = (question) => Boolean(question?.isFavorite || question?.isFavourite)

const readReportedQuestionRecords = () => {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUESTION_BANK_REPORTED_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const readCreatedReportedQuestionRecords = () => {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUESTION_BANK_CREATED_REPORTED_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const isResolvedReportRecord = (record) => String(record?.status ?? '').trim().toLowerCase() === 'resolved'

const getReportedQuestionIds = () => new Set(
  [
    ...readReportedQuestionRecords(),
    ...readCreatedReportedQuestionRecords(),
  ]
    .filter((record) => !isResolvedReportRecord(record))
    .map((record) => record.questionId)
    .filter(Boolean),
)

const isSharedToStudentsQuestion = (question) => Boolean(
  question?.sharedToStudents
  || question?.shareToStudents
  || question?.isSharedToStudents
  || question?.sharedWithStudents
  || (Array.isArray(question?.sharedStudentIds) && question.sharedStudentIds.length)
  || (Array.isArray(question?.studentShareIds) && question.studentShareIds.length)
)

const isUsedInAssessmentQuestion = (question) => Boolean(
  question?.usedInAssessment
  || question?.isUsedInAssessment
  || question?.assessmentId
  || question?.assessmentName
  || (Array.isArray(question?.assessmentIds) && question.assessmentIds.length)
  || (Array.isArray(question?.usedAssessmentIds) && question.usedAssessmentIds.length)
  || (Array.isArray(question?.assessmentNames) && question.assessmentNames.length)
)

const updateQuestionFavoriteInStorage = (questionId, isFavorite) => {
  if (typeof window === 'undefined' || !questionId) return

  QUESTION_BANK_FAVORITE_STORAGE_KEYS.forEach((storageKey) => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
      if (!Array.isArray(parsed)) return

      let didUpdate = false
      const nextQuestions = parsed.map((question) => {
        if (question?.id !== questionId) return question
        didUpdate = true
        return {
          ...question,
          isFavorite,
          isFavourite: undefined,
        }
      })

      if (didUpdate) {
        window.localStorage.setItem(storageKey, JSON.stringify(nextQuestions))
      }
    } catch {
      // Ignore malformed local storage entries and keep the in-memory UI responsive.
    }
  })

  window.dispatchEvent(new Event('question-bank-published-questions'))
  window.dispatchEvent(new Event('question-bank-uploaded-questions'))
}

const readApprovedCreatedQuestions = () => {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUESTION_BANK_STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return cleanQuestionBankItems(parsed).filter((question) => !isMedsyQuestion(question) && isApprovedQuestion(question))
  } catch {
    return []
  }
}

const readAllQuestionBankQuestions = () => {
  const questionsById = new Map()
  const reportedQuestionIds = getReportedQuestionIds()

  ;[
    ...readStoredQuestionList(QUESTION_BANK_PUBLISHED_KEY),
    ...readStoredQuestionList(QUESTION_BANK_UPLOADED_KEY),
    ...readApprovedCreatedQuestions(),
  ].forEach((question, index) => {
    if (reportedQuestionIds.has(question.id)) return
    questionsById.set(question.id ?? `question-${index}`, question)
  })

  return Array.from(questionsById.values()).sort((firstQuestion, secondQuestion) => {
    const firstSentAt = Date.parse(firstQuestion?.questionBankSentAt ?? firstQuestion?.updatedAt ?? firstQuestion?.createdAt ?? '')
    const secondSentAt = Date.parse(secondQuestion?.questionBankSentAt ?? secondQuestion?.updatedAt ?? secondQuestion?.createdAt ?? '')

    return (Number.isNaN(secondSentAt) ? 0 : secondSentAt) - (Number.isNaN(firstSentAt) ? 0 : firstSentAt)
  })
}

const getListSummary = (values, fallback = '-') => {
  const list = Array.isArray(values) ? values.filter(Boolean) : []
  return list.length ? list.join(', ') : fallback
}

const getTableTagSummary = (question) => {
  const tagSummary = getOptionalTagGroups(question)
    .map((group) => `${group.label}: ${group.values.join(', ')}`)
    .join(' | ')

  return tagSummary || '-'
}

const getOptionalTagGroups = (question) => [
  { label: 'Category', values: [question?.questionCategory].filter(Boolean) },
  { label: 'Thinking Level', values: [question?.thinkingLevel].filter(Boolean) },
  { label: 'Difficulty Level', values: [question?.difficultyLevel].filter(Boolean) },
  { label: 'Cognitive Level', values: [question?.cognitiveLevel].filter(Boolean) },
  { label: 'Cognitive Function', values: [question?.cognitiveFunction].filter(Boolean) },
  { label: 'Skill Focus', values: [question?.skillFocus].filter(Boolean) },
  { label: 'Organ System', values: [question?.organSystem].filter(Boolean) },
  { label: 'Organ Sub-System', values: question?.organSubSystems ?? [] },
  { label: 'Disease Tags', values: question?.diseaseTags ?? [] },
  { label: 'Key Concept', values: question?.keyConcepts ?? [] },
].map((group) => ({
  ...group,
  values: group.values.filter((value) => value && value !== 'Not Applicable'),
})).filter((group) => group.values.length)

const getSentDate = (value) => {
  if (!value) return 'Sent date not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sent date not available'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const getThinkingBadgeClassName = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'hot') return 'assessment-page-thinking-hot'
  if (normalized === 'lot') return 'assessment-page-thinking-lot'
  return ''
}

const hasFilledOptions = (question) => (
  Array.isArray(question?.options)
  && question.options.some((option) => stripHtml(option?.label ?? option?.content).trim())
)

const hasDescriptiveSections = (question) => (
  Array.isArray(question?.descriptiveSections)
  && question.descriptiveSections.some((section) => (
    stripHtml(section?.questionText).trim()
    || (section?.children ?? []).some((child) => stripHtml(child?.questionText).trim())
  ))
)

const getResolvedQuestionType = (questionOrType) => {
  if (questionOrType && typeof questionOrType === 'object') {
    const rawType = String(questionOrType.type ?? '').trim()
    const normalizedType = rawType.toLowerCase()
    const hasAnswerOptions = hasFilledOptions(questionOrType) || (questionOrType.correctOptionIds ?? []).length > 0

    if ((normalizedType.includes('descriptive') || normalizedType.startsWith('desc ')) && hasAnswerOptions && !hasDescriptiveSections(questionOrType)) {
      return 'MCQ'
    }

    return rawType
  }

  return String(questionOrType ?? '').trim()
}

const getQuestionTypeBadgeClassName = (questionOrType) => {
  const type = getResolvedQuestionType(questionOrType)
  const normalized = String(type ?? '').trim().toLowerCase()
  if (normalized === 'mcq') return 'is-mcq'
  if (normalized.includes('descriptive') || normalized.startsWith('desc ')) return 'is-descriptive'
  return ''
}

const getQuestionTypeLabel = (questionOrType) => {
  const normalized = getResolvedQuestionType(questionOrType)
  const compactLabel = DESCRIPTIVE_TYPE_LABELS.get(normalized.toLowerCase())
  if (compactLabel) return compactLabel
  if (normalized.toLowerCase().includes('descriptive')) return 'SAQs'
  return normalized || 'Question'
}

const getQuestionTypeFilterLabel = (questionOrType) => {
  const compactLabel = getQuestionTypeLabel(questionOrType)
  return DESCRIPTIVE_FILTER_TYPE_LABELS.get(compactLabel) ?? compactLabel
}

const isDescriptiveQuestion = (question) => (
  getQuestionTypeBadgeClassName(question) === 'is-descriptive'
)

const getQuestionSourceType = (question) => (
  isMedsyQuestion(question) ? 'Uploaded' : 'Created'
)

const getAuthorBadgeClassName = (question) => (
  getQuestionSourceType(question) === 'Uploaded' ? 'is-uploaded-author' : 'is-created-author'
)

const getAuthorBadgeInitial = (question) => (
  isMedsyQuestion(question) ? 'M' : 'C'
)

const getAuthorBadgeTooltip = (question) => (
  isEditedQuestion(question) ? 'Edited question' : isMedsyQuestion(question) ? 'Medsy' : getQuestionAuthorName(question)
)

const renderSourceBadge = (question, className) => (
  <span
    className={`${className} assessment-page-source-badge ${getAuthorBadgeClassName(question)} ${isEditedQuestion(question) ? 'is-edited-author' : ''}`}
    title={getAuthorBadgeTooltip(question)}
    aria-label={getAuthorBadgeTooltip(question)}
  >
    {isEditedQuestion(question) ? (
      <Shuffle size={14} strokeWidth={2.4} />
    ) : isMedsyQuestion(question) ? (
      <img className="assessment-page-medsy-mark" src={medsyIcon} alt="" aria-hidden="true" />
    ) : (
      getAuthorBadgeInitial(question)
    )}
  </span>
)

const formatMetricCount = (value) => (
  new Intl.NumberFormat('en-IN').format(Number(value) || 0)
)

const formatCompactMetricCount = (value) => (
  new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0)
)

const PAGE_SIZE = 20

const createEmptyFilters = () => ({
  authors: [],
  types: [],
  years: [],
  subjects: [],
  topics: [],
  competencies: [],
  categories: [],
  thinkingLevels: [],
  difficultyLevels: [],
  cognitiveLevels: [],
  cognitiveFunctions: [],
  skillFocuses: [],
  organSystems: [],
  organSubSystems: [],
  diseaseTags: [],
  keyConcepts: [],
  sharedToStudents: [],
  usedInAssessment: [],
})

const getUniqueValues = (questions, getter) => (
  Array.from(new Set(questions.flatMap((question) => {
    const value = getter(question)
    return Array.isArray(value) ? value : [value]
  }).filter((value) => value && value !== 'Not Applicable'))).sort()
)

const getValueCounts = (questions, getter) => (
  questions.reduce((counts, question) => {
    const value = getter(question)
    const values = Array.isArray(value) ? value : [value]

    Array.from(new Set(values.filter((item) => item && item !== 'Not Applicable'))).forEach((item) => {
      counts[item] = (counts[item] ?? 0) + 1
    })

    return counts
  }, {})
)

const hasSelectedFilters = (filters) => Object.values(filters).some((values) => values.length)

const hasFilterMatch = (selectedValues, questionValues) => {
  if (!selectedValues.length) return true
  const values = Array.isArray(questionValues) ? questionValues.filter(Boolean) : [questionValues].filter(Boolean)
  return selectedValues.some((value) => values.includes(value))
}

const hasBooleanFilterMatch = (selectedValues, isMatch) => {
  if (!selectedValues.length) return true
  return selectedValues.includes(isMatch ? 'Yes' : 'No')
}

const nonCreateHighlights = [
  {
    title: 'Question review',
    description: 'View and organize question bank items that are not part of the create workflow.',
    icon: FileSearch,
  },
  {
    title: 'Mapped collections',
    description: 'Track existing questions by subject, topic, competency, difficulty, and status.',
    icon: ClipboardList,
  },
  {
    title: 'Readiness status',
    description: 'Use this area for non-authoring question bank tasks, checks, and references.',
    icon: ListChecks,
  },
]

export default function QuestionBankNonCreatePage({ onNavigate, mode = 'readonly', embedded = false }) {
  const resolvedMode = mode === 'editable' ? 'editable' : 'readonly'
  const isEditable = resolvedMode === 'editable'
  const isReadonly = resolvedMode === 'readonly'
  const filterHeaderRef = useRef(null)
  const moreFiltersRef = useRef(null)
  const selectionBarRef = useRef(null)
  const selectionBarDragRef = useRef(null)
  const [publishedQuestions, setPublishedQuestions] = useState(() => readAllQuestionBankQuestions())
  const activeView = 'grid'
  const [filterSearchTerms, setFilterSearchTerms] = useState({})
  const [filters, setFilters] = useState(() => createEmptyFilters())
  const [openFilterKey, setOpenFilterKey] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [moreFiltersPanelStyle, setMoreFiltersPanelStyle] = useState({})
  const [isFilterHeaderCompact, setIsFilterHeaderCompact] = useState(false)
  const [isCompactFilterTrayOpen, setIsCompactFilterTrayOpen] = useState(false)
  const pageSize = PAGE_SIZE
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTagsId, setActiveTagsId] = useState('')
  const [activeOptionDistractorId, setActiveOptionDistractorId] = useState('')
  const [expandedTableRows, setExpandedTableRows] = useState([])
  const [selectedGridAction, setSelectedGridAction] = useState('')
  const [selectedGridQuestionIds, setSelectedGridQuestionIds] = useState([])
  const [selectionBarPosition, setSelectionBarPosition] = useState(null)
  const [expandedCardRows, setExpandedCardRows] = useState([])
  const [activeMetric, setActiveMetric] = useState('total')
  const [reportedQuestionRecords, setReportedQuestionRecords] = useState(() => readReportedQuestionRecords())
  const [createdReportedQuestionRecords, setCreatedReportedQuestionRecords] = useState(() => readCreatedReportedQuestionRecords())
  const [reportQuestion, setReportQuestion] = useState(null)
  const [reportReasons, setReportReasons] = useState([])
  const [reportExplanation, setReportExplanation] = useState('')
  const [reportAuthorAction, setReportAuthorAction] = useState('')
  const [editQuestion, setEditQuestion] = useState(null)
  const [editQuestionMode, setEditQuestionMode] = useState('overwrite')

  useEffect(() => {
    if (!isReadonly) return
    setSelectedGridAction('')
    setSelectedGridQuestionIds([])
    setSelectionBarPosition(null)
  }, [isReadonly])

  const metricFilteredQuestions = useMemo(() => {
    if (activeMetric === 'suggested') {
      return [
        ...reportedQuestionRecords,
        ...createdReportedQuestionRecords,
      ]
        .filter((record) => !isResolvedReportRecord(record))
        .map((record) => record.question)
        .filter(Boolean)
    }

    return publishedQuestions.filter((question) => {
      if (activeMetric === 'medsy') return isMedsyQuestion(question)
      if (activeMetric === 'created') return !isMedsyQuestion(question)
      if (activeMetric === 'favorites') return isFavoriteQuestion(question)
      if (activeMetric === 'shared') return isSharedToStudentsQuestion(question)
      return true
    })
  }, [activeMetric, publishedQuestions, reportedQuestionRecords, createdReportedQuestionRecords])
  const filterOptions = useMemo(() => ({
    authors: getUniqueValues(metricFilteredQuestions, getQuestionAuthorName),
    types: getUniqueValues(metricFilteredQuestions, (question) => getQuestionTypeFilterLabel(question)),
    years: getUniqueValues(metricFilteredQuestions, (question) => question.year),
    subjects: getUniqueValues(metricFilteredQuestions, (question) => question.subject),
    topics: getUniqueValues(metricFilteredQuestions, (question) => question.topics ?? []),
    competencies: getUniqueValues(metricFilteredQuestions, (question) => question.competencies ?? []),
    categories: getUniqueValues(metricFilteredQuestions, (question) => question.questionCategory),
    thinkingLevels: getUniqueValues(metricFilteredQuestions, (question) => question.thinkingLevel),
    difficultyLevels: getUniqueValues(metricFilteredQuestions, (question) => question.difficultyLevel),
    cognitiveLevels: getUniqueValues(metricFilteredQuestions, (question) => question.cognitiveLevel),
    cognitiveFunctions: getUniqueValues(metricFilteredQuestions, (question) => question.cognitiveFunction),
    skillFocuses: getUniqueValues(metricFilteredQuestions, (question) => question.skillFocus),
    organSystems: getUniqueValues(metricFilteredQuestions, (question) => question.organSystem),
    organSubSystems: getUniqueValues(metricFilteredQuestions, (question) => question.organSubSystems ?? []),
    diseaseTags: getUniqueValues(metricFilteredQuestions, (question) => question.diseaseTags ?? []),
    keyConcepts: getUniqueValues(metricFilteredQuestions, (question) => question.keyConcepts ?? []),
  }), [metricFilteredQuestions])

  const filterOptionCounts = useMemo(() => ({
    authors: getValueCounts(metricFilteredQuestions, getQuestionAuthorName),
    types: getValueCounts(metricFilteredQuestions, (question) => getQuestionTypeFilterLabel(question)),
    years: getValueCounts(metricFilteredQuestions, (question) => question.year),
    subjects: getValueCounts(metricFilteredQuestions, (question) => question.subject),
    topics: getValueCounts(metricFilteredQuestions, (question) => question.topics ?? []),
    competencies: getValueCounts(metricFilteredQuestions, (question) => question.competencies ?? []),
    categories: getValueCounts(metricFilteredQuestions, (question) => question.questionCategory),
    thinkingLevels: getValueCounts(metricFilteredQuestions, (question) => question.thinkingLevel),
    difficultyLevels: getValueCounts(metricFilteredQuestions, (question) => question.difficultyLevel),
    cognitiveLevels: getValueCounts(metricFilteredQuestions, (question) => question.cognitiveLevel),
    cognitiveFunctions: getValueCounts(metricFilteredQuestions, (question) => question.cognitiveFunction),
    skillFocuses: getValueCounts(metricFilteredQuestions, (question) => question.skillFocus),
    organSystems: getValueCounts(metricFilteredQuestions, (question) => question.organSystem),
    organSubSystems: getValueCounts(metricFilteredQuestions, (question) => question.organSubSystems ?? []),
    diseaseTags: getValueCounts(metricFilteredQuestions, (question) => question.diseaseTags ?? []),
    keyConcepts: getValueCounts(metricFilteredQuestions, (question) => question.keyConcepts ?? []),
  }), [metricFilteredQuestions])

  const selectedFilterCount = Object.values(filters).reduce((total, values) => total + values.length, 0)

  const toggleFilterValue = (filterKey, value) => {
    setFilters((current) => {
      const selectedValues = current[filterKey] ?? []
      return {
        ...current,
        [filterKey]: selectedValues.includes(value)
          ? selectedValues.filter((item) => item !== value)
          : [...selectedValues, value],
      }
    })
  }

  const clearFilterValue = (filterKey, value) => {
    setFilters((current) => ({
      ...current,
      [filterKey]: (current[filterKey] ?? []).filter((item) => item !== value),
    }))
  }

  const clearMoreFilters = () => {
    setFilters((current) => {
      const nextFilters = { ...current }
      advancedFilterDefinitions.forEach(([filterKey]) => {
        nextFilters[filterKey] = []
      })
      return nextFilters
    })
  }

  const updateMoreFiltersPosition = () => {
    if (typeof window === 'undefined') return
    const trigger = moreFiltersRef.current?.querySelector('button')
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const viewportPadding = 32
    const panelWidth = Math.min(420, window.innerWidth - (viewportPadding * 2))
    const preferredLeft = rect.left
    const left = Math.max(
      viewportPadding,
      Math.min(preferredLeft, window.innerWidth - panelWidth - viewportPadding),
    )
    const arrowLeft = Math.max(18, Math.min((rect.left + (rect.width / 2)) - left - 6, panelWidth - 30))

    setMoreFiltersPanelStyle({
      left: `${left}px`,
      top: `${rect.bottom + 10}px`,
      width: `${panelWidth}px`,
      '--assessment-more-arrow-left': `${arrowLeft}px`,
    })
  }

  const filteredQuestions = useMemo(() => {
    return metricFilteredQuestions.filter((question) => {
      if (!hasFilterMatch(filters.authors, getQuestionAuthorName(question))) return false
      if (!hasFilterMatch(filters.types, getQuestionTypeFilterLabel(question))) return false
      if (!hasFilterMatch(filters.years, question.year)) return false
      if (!hasFilterMatch(filters.subjects, question.subject)) return false
      if (!hasFilterMatch(filters.topics, question.topics ?? [])) return false
      if (!hasFilterMatch(filters.competencies, question.competencies ?? [])) return false
      if (!hasFilterMatch(filters.categories, question.questionCategory)) return false
      if (!hasFilterMatch(filters.thinkingLevels, question.thinkingLevel)) return false
      if (!hasFilterMatch(filters.difficultyLevels, question.difficultyLevel)) return false
      if (!hasFilterMatch(filters.cognitiveLevels, question.cognitiveLevel)) return false
      if (!hasFilterMatch(filters.cognitiveFunctions, question.cognitiveFunction)) return false
      if (!hasFilterMatch(filters.skillFocuses, question.skillFocus)) return false
      if (!hasFilterMatch(filters.organSystems, question.organSystem)) return false
      if (!hasFilterMatch(filters.organSubSystems, question.organSubSystems ?? [])) return false
      if (!hasFilterMatch(filters.diseaseTags, question.diseaseTags ?? [])) return false
      if (!hasFilterMatch(filters.keyConcepts, question.keyConcepts ?? [])) return false
      if (!hasBooleanFilterMatch(filters.sharedToStudents, isSharedToStudentsQuestion(question))) return false
      if (!hasBooleanFilterMatch(filters.usedInAssessment, isUsedInAssessmentQuestion(question))) return false
      return true
    })
  }, [filters, metricFilteredQuestions])

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStartIndex = (safeCurrentPage - 1) * pageSize
  const pagedQuestions = filteredQuestions.slice(pageStartIndex, pageStartIndex + pageSize)
  const pagedQuestionIds = pagedQuestions.map((question, index) => question.id ?? `${question.type}-${index}`)
  const hasAllVisibleRowsExpanded = Boolean(pagedQuestionIds.length)
    && pagedQuestionIds.every((questionId) => expandedTableRows.includes(questionId))
  const baseFilterDefinitions = [
    ['authors', 'Author', filterOptions.authors],
    ['types', 'Type', filterOptions.types],
    ['years', 'Year', filterOptions.years],
    ['subjects', 'Subject', filterOptions.subjects],
    ['topics', 'Topic', filterOptions.topics],
    ['competencies', 'Competency', filterOptions.competencies],
  ].filter(([, , options]) => options.length)
  const moreFilterGroups = [
    {
      label: 'Curriculum',
      filters: [],
    },
    {
      label: 'Assessment',
      filters: [
        ['categories', 'Category', filterOptions.categories],
        ['thinkingLevels', 'Thinking', filterOptions.thinkingLevels],
        ['difficultyLevels', 'Difficulty', filterOptions.difficultyLevels],
        ['cognitiveLevels', 'Cognitive', filterOptions.cognitiveLevels],
        ['sharedToStudents', 'Shared to Student', ['Yes', 'No'], 'boolean'],
        ['usedInAssessment', 'Used in Assessment', ['Yes', 'No'], 'boolean'],
      ],
    },
    {
      label: 'Tags',
      filters: [
        ['cognitiveFunctions', 'Cognitive Function', filterOptions.cognitiveFunctions],
        ['skillFocuses', 'Skill Focus', filterOptions.skillFocuses],
        ['organSystems', 'Organ System', filterOptions.organSystems],
        ['organSubSystems', 'Organ Sub-System', filterOptions.organSubSystems],
        ['diseaseTags', 'Disease Tags', filterOptions.diseaseTags],
        ['keyConcepts', 'Key Concept', filterOptions.keyConcepts],
      ],
    },
  ].map((group) => ({
    ...group,
    filters: group.filters.filter(([, , options]) => options.length),
  })).filter((group) => group.filters.length)
  const advancedFilterDefinitions = moreFilterGroups.flatMap((group) => group.filters)
  const searchableFilterKeys = ['subjects', 'topics', 'competencies', 'organSystems', 'organSubSystems', 'diseaseTags', 'keyConcepts']
  const questionMetrics = [
    { key: 'total', label: 'Total Question', value: publishedQuestions.length, icon: ClipboardList, tone: 'total' },
    { key: 'medsy', label: 'Medsy Question', value: publishedQuestions.filter(isMedsyQuestion).length, icon: FileSearch, tone: 'medsy' },
    { key: 'created', label: 'Created Question', value: publishedQuestions.filter((question) => !isMedsyQuestion(question)).length, icon: ListChecks, tone: 'created' },
    { key: 'favorites', label: 'Favorites', value: publishedQuestions.filter(isFavoriteQuestion).length, icon: Star, tone: 'favorites' },
    { key: 'shared', label: 'Share to Students', value: publishedQuestions.filter(isSharedToStudentsQuestion).length, icon: Share2, tone: 'shared' },
    { key: 'suggested', label: 'Report Question', value: [
      ...reportedQuestionRecords,
      ...createdReportedQuestionRecords,
    ].filter((record) => !isResolvedReportRecord(record)).length, icon: Flag, tone: 'suggested' },
  ]
  const visibleQuestionMetrics = isEditable
    ? questionMetrics
    : questionMetrics.filter((metric) => !['shared', 'suggested'].includes(metric.key))
  const activeMetricLabel = questionMetrics.find((metric) => metric.key === activeMetric)?.label ?? 'questions'
  const isReportMetricActive = activeMetric === 'suggested'
  const footerResultSummary = hasSelectedFilters(filters)
    ? `${formatMetricCount(filteredQuestions.length)} filtered of ${formatMetricCount(metricFilteredQuestions.length)} ${activeMetricLabel.toLowerCase()}`
    : `Showing ${formatMetricCount(pagedQuestions.length)} of ${formatMetricCount(metricFilteredQuestions.length)}`

  const expandAllVisibleRows = () => {
    setExpandedTableRows((current) => Array.from(new Set([...current, ...pagedQuestionIds])))
  }

  const collapseAllVisibleRows = () => {
    setExpandedTableRows((current) => current.filter((questionId) => !pagedQuestionIds.includes(questionId)))
  }

  const toggleGridQuestionSelection = (questionId) => {
    setSelectedGridQuestionIds((current) => (
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    ))
  }

  const toggleQuestionFavorite = (questionId) => {
    const question = publishedQuestions.find((item) => item.id === questionId)
    if (!question) return

    const nextFavoriteState = !isFavoriteQuestion(question)
    setPublishedQuestions((current) => current.map((item) => (
      item.id === questionId
        ? { ...item, isFavorite: nextFavoriteState, isFavourite: undefined }
        : item
    )))
    updateQuestionFavoriteInStorage(questionId, nextFavoriteState)
  }

  const resetReportModal = () => {
    setReportQuestion(null)
    setReportReasons([])
    setReportExplanation('')
    setReportAuthorAction('')
  }

  const openReportModal = (question) => {
    if (!isEditable) return
    setReportQuestion(question)
    setReportReasons([])
    setReportExplanation('')
    setReportAuthorAction('')
  }

  const openEditModeModal = (question) => {
    if (!isEditable) return
    setEditQuestion(question)
    setEditQuestionMode(isMedsyQuestion(question) ? 'overwrite' : 'duplicate')
  }

  const closeEditModeModal = () => {
    setEditQuestion(null)
    setEditQuestionMode('overwrite')
  }

  const continueEditQuestion = () => {
    if (!editQuestion || typeof window === 'undefined') return
    const safeEditMode = isMedsyQuestion(editQuestion) ? editQuestionMode : 'duplicate'

    window.sessionStorage.setItem(QUESTION_BANK_EDIT_HANDOFF_KEY, JSON.stringify({
      mode: safeEditMode,
      question: editQuestion,
      requestedAt: new Date().toISOString(),
    }))
    closeEditModeModal()
    onNavigate?.(APP_PAGES.QUESTION_BANK)
  }

  const submitReportQuestion = () => {
    if (!reportQuestion || !reportReasons.length || !reportAuthorAction) return

    const reportedAt = new Date().toISOString()
    const isCreatedReport = !isMedsyQuestion(reportQuestion)
    const reportedQuestion = {
      ...reportQuestion,
      type: String(reportQuestion.type ?? '').trim().toLowerCase() === 'descriptive' ? 'Descriptive Question' : reportQuestion.type,
      isReported: true,
      reported: true,
      reportStatus: 'Pending',
      reportedAt,
      reportReasons,
      reportExplanation: reportExplanation.trim(),
      reportAuthorAction,
      status: 'Reported',
    }
    const nextRecord = {
      id: `${isCreatedReport ? 'created-report' : 'query-report'}-${reportQuestion.id ?? Date.now()}`,
      questionId: reportQuestion.id,
      title: getQuestionPreview(reportQuestion),
      requester: getQuestionAuthorName(reportQuestion),
      status: 'Pending',
      reasons: reportReasons,
      explanation: reportExplanation.trim(),
      authorAction: reportAuthorAction,
      reportedAt,
      question: reportedQuestion,
    }

    if (isCreatedReport) {
      const nextCreatedRecords = [
        nextRecord,
        ...readCreatedReportedQuestionRecords().filter((record) => record.questionId !== reportQuestion.id),
      ]
      window.localStorage.setItem(QUESTION_BANK_CREATED_REPORTED_KEY, JSON.stringify(nextCreatedRecords))
      window.dispatchEvent(new Event('question-bank-created-reported-questions'))
    } else {
      const nextRecords = [
        nextRecord,
        ...readReportedQuestionRecords().filter((record) => record.questionId !== reportQuestion.id),
      ]
      window.localStorage.setItem(QUESTION_BANK_REPORTED_KEY, JSON.stringify(nextRecords))
      window.dispatchEvent(new Event('question-bank-reported-questions'))
      setReportedQuestionRecords(nextRecords)
    }
    setPublishedQuestions(readAllQuestionBankQuestions())
    resetReportModal()
  }

  const withdrawReportedQuestion = (questionId) => {
    if (!questionId || typeof window === 'undefined') return

    const nextRecords = readReportedQuestionRecords().filter((record) => record.questionId !== questionId)
    const nextCreatedRecords = readCreatedReportedQuestionRecords().filter((record) => record.questionId !== questionId)
    window.localStorage.setItem(QUESTION_BANK_REPORTED_KEY, JSON.stringify(nextRecords))
    window.localStorage.setItem(QUESTION_BANK_CREATED_REPORTED_KEY, JSON.stringify(nextCreatedRecords))
    window.dispatchEvent(new Event('question-bank-reported-questions'))
    window.dispatchEvent(new Event('question-bank-created-reported-questions'))
    setReportedQuestionRecords(nextRecords)
    setCreatedReportedQuestionRecords(nextCreatedRecords)
    setPublishedQuestions(readAllQuestionBankQuestions())
  }

  const renderQuestionRowActions = (question, questionId, questionNumber, isTableRowOpen) => {
    const isFavorite = isFavoriteQuestion(question)

    return (
      <span className="assessment-page-grid-row-actions" onClick={(event) => event.stopPropagation()}>
        {isEditable && !isReportMetricActive ? (
          <button
            type="button"
            className="assessment-page-grid-row-action is-icon-only"
            onClick={() => openEditModeModal(question)}
            title="Edit question"
            aria-label={`Edit question ${questionNumber}`}
          >
            <Pencil size={14} strokeWidth={2.2} />
          </button>
        ) : null}
        {isEditable ? (
          <button
            type="button"
            className="assessment-page-grid-row-action"
            onClick={() => {
              if (isReportMetricActive) {
                withdrawReportedQuestion(question.id)
                return
              }

              openReportModal(question)
            }}
            title={isReportMetricActive ? 'Withdraw report' : 'Report question'}
            aria-label={`${isReportMetricActive ? 'Withdraw report for' : 'Report'} question ${questionNumber}`}
          >
            <Flag size={14} strokeWidth={2.2} />
            {isReportMetricActive ? 'Withdraw' : 'Report'}
          </button>
        ) : null}
        {isEditable && !isReportMetricActive ? (
          <button
            type="button"
            className={`assessment-page-grid-row-action is-icon-only is-favorite ${isFavorite ? 'is-active' : ''}`}
            onClick={() => toggleQuestionFavorite(questionId)}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={`${isFavorite ? 'Remove' : 'Add'} question ${questionNumber} ${isFavorite ? 'from' : 'to'} favorites`}
            aria-pressed={isFavorite}
          >
            <Star size={15} strokeWidth={2.2} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        ) : null}
        <button
          type="button"
          className="assessment-page-grid-collapse-indicator"
          onClick={() => toggleGridRowExpansion(questionId, isTableRowOpen)}
          aria-label={`${isTableRowOpen ? 'Collapse' : 'Expand'} question ${questionNumber}`}
        >
          {isTableRowOpen ? <ChevronUp size={16} strokeWidth={2.4} /> : <ChevronDown size={16} strokeWidth={2.4} />}
        </button>
      </span>
    )
  }

  const renderQuestionTagBadges = (question) => (
    <>
      {renderSourceBadge(question, 'assessment-page-grid-author-label')}
      {question.difficultyLevel ? <span className="assessment-page-table-value-pill assessment-page-difficulty-badge">{question.difficultyLevel}</span> : null}
      {question.thinkingLevel ? <span className={`assessment-page-table-value-pill ${getThinkingBadgeClassName(question.thinkingLevel)}`}>{question.thinkingLevel}</span> : null}
    </>
  )

  const handleGridRowAction = (questionId, isTableRowOpen) => {
    if (selectedGridAction) {
      toggleGridQuestionSelection(questionId)
      return
    }

    setExpandedTableRows((current) => (
      isTableRowOpen
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    ))
  }

  const toggleGridRowExpansion = (questionId, isTableRowOpen) => {
    setExpandedTableRows((current) => (
      isTableRowOpen
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    ))
  }

  const clearGridActionState = () => {
    setSelectedGridAction('')
    setSelectedGridQuestionIds([])
  }

  const handleSelectionBarPointerDown = (event) => {
    if (event.button !== 0 || event.target.closest('button')) return

    const bar = selectionBarRef.current
    if (!bar) return

    const rect = bar.getBoundingClientRect()
    selectionBarDragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    }
    setSelectionBarPosition({ x: rect.left, y: rect.top })
    bar.setPointerCapture(event.pointerId)
  }

  const handleSelectionBarPointerMove = (event) => {
    const drag = selectionBarDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const margin = 10
    const maxX = Math.max(margin, window.innerWidth - drag.width - margin)
    const maxY = Math.max(margin, window.innerHeight - drag.height - margin)

    setSelectionBarPosition({
      x: Math.min(Math.max(margin, event.clientX - drag.offsetX), maxX),
      y: Math.min(Math.max(margin, event.clientY - drag.offsetY), maxY),
    })
  }

  const handleSelectionBarPointerUp = (event) => {
    const drag = selectionBarDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    selectionBarDragRef.current = null
    selectionBarRef.current?.releasePointerCapture(event.pointerId)
  }

  const renderFilterDropdown = ([filterKey, label, options]) => {
    const selectedValues = filters[filterKey]
    const isOpen = openFilterKey === filterKey
    const isSearchableFilter = searchableFilterKeys.includes(filterKey)
    const filterSearchTerm = filterSearchTerms[filterKey] ?? ''
    const visibleOptions = isSearchableFilter
      ? options.filter((option) => option.toLowerCase().includes(filterSearchTerm.trim().toLowerCase()))
      : options

    return (
      <div key={filterKey} className="assessment-page-filter-dropdown" data-filter-key={filterKey}>
        <button
          type="button"
          className={selectedValues.length ? 'has-selection' : ''}
          onClick={() => setOpenFilterKey(isOpen ? '' : filterKey)}
          aria-expanded={isOpen}
        >
          <span>{label}</span>
          {selectedValues.length ? <strong>{selectedValues.length}</strong> : null}
          <ChevronDown size={14} strokeWidth={2.3} />
        </button>
        {isOpen ? (
          <div className="assessment-page-filter-menu" role="menu">
            <div>
              <strong>{label}</strong>
              {selectedValues.length ? (
                <button type="button" onClick={() => setFilters((current) => ({ ...current, [filterKey]: [] }))}>
                  Clear
                </button>
              ) : null}
            </div>
            {isSearchableFilter ? (
              <label className="assessment-page-filter-menu-search">
                <Search size={14} strokeWidth={2.2} />
                <input
                  type="search"
                  value={filterSearchTerm}
                  onChange={(event) => setFilterSearchTerms((current) => ({
                    ...current,
                    [filterKey]: event.target.value,
                  }))}
                  placeholder={`Search ${label.toLowerCase()}...`}
                />
              </label>
            ) : null}
            <div>
              {visibleOptions.map((option) => {
                const isSelected = selectedValues.includes(option)
                return (
                  <label key={option} className="assessment-page-filter-option">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFilterValue(filterKey, option)}
                    />
                    <span>{option}</span>
                    <strong>{filterOptionCounts[filterKey]?.[option] ?? 0}</strong>
                  </label>
                )
              })}
              {!visibleOptions.length ? (
                <span className="assessment-page-filter-menu-empty">No matches</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  const renderBooleanFilterDropdown = ([filterKey, label, options]) => {
    const selectedValue = filters[filterKey]?.[0] ?? ''
    const isOpen = openFilterKey === filterKey

    return (
      <div key={filterKey} className="assessment-page-filter-dropdown assessment-page-boolean-dropdown" data-filter-key={filterKey}>
        <button
          type="button"
          className={selectedValue ? 'has-selection' : ''}
          onClick={() => setOpenFilterKey(isOpen ? '' : filterKey)}
          aria-expanded={isOpen}
        >
          <span>{label}</span>
          {selectedValue ? <strong>{selectedValue}</strong> : null}
          <ChevronDown size={14} strokeWidth={2.3} />
        </button>
        {isOpen ? (
          <div className="assessment-page-filter-menu" role="menu">
            <div>
              <strong>{label}</strong>
              {selectedValue ? (
                <button type="button" onClick={() => setFilters((current) => ({ ...current, [filterKey]: [] }))}>
                  Clear
                </button>
              ) : null}
            </div>
            <div>
              {options.map((option) => {
                const isSelected = selectedValue === option
                return (
                  <label key={option} className="assessment-page-filter-option">
                    <input
                      type="radio"
                      name={filterKey}
                      checked={isSelected}
                      onChange={() => {
                        setFilters((current) => ({ ...current, [filterKey]: [option] }))
                        setOpenFilterKey('')
                      }}
                    />
                    <span>{option}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [activeMetric, filters, pageSize])

  useEffect(() => {
    setExpandedTableRows([])
    setSelectedGridQuestionIds([])
  }, [activeMetric])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const syncPublishedQuestions = () => {
      setReportedQuestionRecords(readReportedQuestionRecords())
      setCreatedReportedQuestionRecords(readCreatedReportedQuestionRecords())
      setPublishedQuestions(readAllQuestionBankQuestions())
    }

    window.addEventListener('storage', syncPublishedQuestions)
    window.addEventListener('question-bank-published-questions', syncPublishedQuestions)
    window.addEventListener('question-bank-uploaded-questions', syncPublishedQuestions)
    window.addEventListener('question-bank-reported-questions', syncPublishedQuestions)
    window.addEventListener('question-bank-created-reported-questions', syncPublishedQuestions)

    return () => {
      window.removeEventListener('storage', syncPublishedQuestions)
      window.removeEventListener('question-bank-published-questions', syncPublishedQuestions)
      window.removeEventListener('question-bank-uploaded-questions', syncPublishedQuestions)
      window.removeEventListener('question-bank-reported-questions', syncPublishedQuestions)
      window.removeEventListener('question-bank-created-reported-questions', syncPublishedQuestions)
    }
  }, [])

  useEffect(() => {
    if (!openFilterKey && !showAdvancedFilters) return undefined
    if (typeof document === 'undefined') return undefined

    const handleOutsideFilterClick = (event) => {
      const activeDropdown = event.target.closest?.('.assessment-page-filter-dropdown')
      if (activeDropdown?.dataset?.filterKey === openFilterKey) return
      if (event.target.closest?.('.assessment-page-filter-toggle')) return
      if (event.target.closest?.('.assessment-page-filter-advanced-row')) {
        setOpenFilterKey('')
        return
      }
      if (event.target.closest?.('.assessment-page-more-filters-wrap')) {
        setOpenFilterKey('')
        return
      }
      setOpenFilterKey('')
      setShowAdvancedFilters(false)
    }

    document.addEventListener('mousedown', handleOutsideFilterClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideFilterClick)
    }
  }, [openFilterKey, showAdvancedFilters])

  useEffect(() => {
    if (!showAdvancedFilters) return undefined
    if (typeof window === 'undefined') return undefined

    const updatePosition = () => updateMoreFiltersPosition()
    const frame = window.requestAnimationFrame(updatePosition)

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showAdvancedFilters])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const filterHeader = filterHeaderRef.current
    if (!filterHeader) return undefined

    let animationFrame = 0

    const handleScroll = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(() => {
        const top = filterHeader.getBoundingClientRect().top
        const shouldCompact = top <= 4
        setIsFilterHeaderCompact(shouldCompact)
        if (!shouldCompact) setIsCompactFilterTrayOpen(false)
      })
    }

    const scrollParents = [window]
    let parent = filterHeader.parentElement
    while (parent) {
      const style = window.getComputedStyle(parent)
      if (/(auto|scroll|overlay)/.test(`${style.overflow}${style.overflowY}`)) {
        scrollParents.push(parent)
      }
      parent = parent.parentElement
    }

    handleScroll()
    scrollParents.forEach((item) => item.addEventListener('scroll', handleScroll, { passive: true }))
    window.addEventListener('resize', handleScroll)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      scrollParents.forEach((item) => item.removeEventListener('scroll', handleScroll))
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <section className={`vx-content assessment-page ${embedded ? 'is-embedded' : ''} is-${resolvedMode}-mode`}>
      <div className={`assessment-page-shell question-bank-overview-shell ${selectedGridAction ? 'has-selection-bar' : ''}`}>
        <section className="assessment-page-metrics-strip" aria-label="Question bank metrics">
          {visibleQuestionMetrics.map((metric) => {
            const Icon = metric.icon
            const isActive = activeMetric === metric.key

            return (
              <button
                key={metric.key}
                type="button"
                className={`is-${metric.tone} ${isActive ? 'is-active' : ''}`}
                onClick={() => {
                  if (!metric.value) return
                  setActiveMetric(metric.key)
                }}
                disabled={!metric.value}
                aria-pressed={isActive}
              >
                <span className="assessment-page-metric-icon" aria-hidden="true">
                  <Icon size={15} strokeWidth={2.2} />
                </span>
                <span className="assessment-page-metric-copy">
                  <strong title={formatMetricCount(metric.value)}>{formatCompactMetricCount(metric.value)}</strong>
                  <span>{metric.label}</span>
                </span>
              </button>
            )
          })}
        </section>

        {publishedQuestions.length ? (
          <section
            ref={filterHeaderRef}
            className={`assessment-page-bank-controls ${activeView === 'grid' ? 'is-grid-attached' : ''} ${isFilterHeaderCompact ? 'is-compact' : ''} ${isCompactFilterTrayOpen ? 'is-filter-tray-open' : ''}`}
            aria-label="All question bank controls"
          >
            <div className="assessment-page-filter-strip" aria-label="Question filters">
              <button
                type="button"
                className={`assessment-page-filter-toggle ${openFilterKey ? 'is-open' : ''}`}
                onClick={() => {
                  if (isFilterHeaderCompact) {
                    setIsCompactFilterTrayOpen((current) => !current)
                    setOpenFilterKey('')
                    return
                  }
                  setOpenFilterKey((current) => (current ? '' : baseFilterDefinitions[0]?.[0] ?? ''))
                }}
                aria-expanded={isFilterHeaderCompact ? isCompactFilterTrayOpen : Boolean(openFilterKey)}
              >
                <Filter size={16} strokeWidth={2.2} />
                {selectedFilterCount ? <span>{selectedFilterCount}</span> : null}
              </button>
              {baseFilterDefinitions.map(renderFilterDropdown)}
              {advancedFilterDefinitions.length ? (
                <span className="assessment-page-more-filters-wrap" ref={moreFiltersRef}>
                  <button
                    type="button"
                    className={`assessment-page-more-filters-btn ${showAdvancedFilters ? 'is-open' : ''}`}
                    onClick={() => {
                      updateMoreFiltersPosition()
                      setShowAdvancedFilters((current) => !current)
                    }}
                    aria-expanded={showAdvancedFilters}
                  >
                    <Plus size={15} strokeWidth={2.3} />
                    More
                  </button>
                  {showAdvancedFilters && typeof document !== 'undefined' ? createPortal(
                    <span className="assessment-page-filter-advanced-row" style={moreFiltersPanelStyle} role="tooltip">
                      <span className="assessment-page-more-filter-head">
                        <strong>More filters</strong>
                        {advancedFilterDefinitions.some(([filterKey]) => filters[filterKey]?.length) ? (
                          <button type="button" onClick={clearMoreFilters}>
                            Clear
                          </button>
                        ) : null}
                      </span>
                      {moreFilterGroups.map((group) => (
                        <span key={group.label} className="assessment-page-more-filter-group">
                          <strong>{group.label}</strong>
                          <span>{group.filters.map((filter) => (
                            filter[3] === 'boolean' ? renderBooleanFilterDropdown(filter) : renderFilterDropdown(filter)
                          ))}</span>
                        </span>
                      ))}
                    </span>,
                    document.body,
                  ) : null}
                </span>
              ) : null}
              {isEditable ? (
                <span className="assessment-page-grid-action-controls" role="group" aria-label="Question bank actions">
                  <button
                    type="button"
                    className={selectedGridAction === 'assessment' ? 'is-active' : ''}
                    onClick={() => setSelectedGridAction('assessment')}
                    disabled={selectedGridAction === 'learn' || isReportMetricActive}
                  >
                    <ListChecks size={14} strokeWidth={2.3} />
                    Add to Assessment
                    {selectedGridAction === 'assessment' && selectedGridQuestionIds.length ? (
                      <span className="assessment-page-grid-action-count">{selectedGridQuestionIds.length}</span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    className={selectedGridAction === 'learn' ? 'is-active' : ''}
                    onClick={() => setSelectedGridAction('learn')}
                    disabled={selectedGridAction === 'assessment' || isReportMetricActive}
                  >
                    <Share2 size={14} strokeWidth={2.3} />
                    Share to Students
                    {selectedGridAction === 'learn' && selectedGridQuestionIds.length ? (
                      <span className="assessment-page-grid-action-count">{selectedGridQuestionIds.length}</span>
                    ) : null}
                  </button>
                </span>
              ) : null}
              <span className="assessment-page-expand-toggle" role="group" aria-label="Expand or collapse all visible questions">
                <button
                  type="button"
                  className={!hasAllVisibleRowsExpanded ? 'is-active' : ''}
                  onClick={collapseAllVisibleRows}
                  disabled={!pagedQuestionIds.length}
                  title="Collapse all"
                  aria-label="Collapse all visible questions"
                >
                  <ListChecks size={14} strokeWidth={2.3} />
                </button>
                <button
                  type="button"
                  className={hasAllVisibleRowsExpanded ? 'is-active' : ''}
                  onClick={expandAllVisibleRows}
                  disabled={!pagedQuestionIds.length}
                  title="Expand all"
                  aria-label="Expand all visible questions"
                >
                  <LayoutGrid size={14} strokeWidth={2.3} />
                </button>
              </span>
            </div>
            {hasSelectedFilters(filters) ? (
              <div className="assessment-page-active-filters">
                {Object.entries(filters).flatMap(([filterKey, values]) => (
                  values.map((value) => (
                    <button key={`${filterKey}-${value}`} type="button" onClick={() => clearFilterValue(filterKey, value)}>
                      {filterKey === 'competencies' ? getCompetencyCode(value) : value}
                      <X size={12} strokeWidth={2.4} />
                    </button>
                  ))
                ))}
                <button
                  type="button"
                  className="assessment-page-active-filters-clear"
                  onClick={() => setFilters(createEmptyFilters())}
                >
                  Clear all
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {pagedQuestions.length && activeView === 'card' ? (
          <section className="assessment-page-question-list" aria-label="Sent question bank questions">
            {pagedQuestions.map((question, index) => {
              const questionNumber = pageStartIndex + index + 1
              const curriculum = [
                question.year,
                question.subject,
                ...(question.topics ?? []),
                ...(question.competencies ?? []),
              ].filter(Boolean)
              const imageRows = Array.isArray(question.images) ? question.images : []
              const optionRows = Array.isArray(question.options) ? question.options : []
              const tagGroups = getOptionalTagGroups(question)
              const questionId = question.id ?? `${question.type}-${index}`
              const isTagsOpen = activeTagsId === questionId
              const isCardOpen = expandedCardRows.includes(questionId)
              const descriptiveSections = Array.isArray(question.descriptiveSections) ? question.descriptiveSections : []
              const isDescriptive = isDescriptiveQuestion(question)
              const isMcq = getQuestionTypeLabel(question) === 'MCQ'

              return (
                <article key={questionId} className={`assessment-page-question-card ${isCardOpen ? 'is-open' : 'is-closed'}`}>
                  <div className="assessment-page-question-head">
                    <span className="assessment-page-question-type">{getQuestionTypeLabel(question)}</span>
                    {renderSourceBadge(question, 'assessment-page-question-author')}
                    {question.thinkingLevel ? <span className={getThinkingBadgeClassName(question.thinkingLevel)}>{question.thinkingLevel}</span> : null}
                    {question.difficultyLevel ? <span className="assessment-page-difficulty-badge">{question.difficultyLevel}</span> : null}
                    {isCardOpen && tagGroups.length ? (
                      <span className="assessment-page-question-tags-wrap">
                        <button
                          type="button"
                          className="assessment-page-question-tags-btn"
                          onClick={() => setActiveTagsId(isTagsOpen ? '' : questionId)}
                          aria-expanded={isTagsOpen}
                        >
                          <Info size={13} strokeWidth={2.2} />
                          View tags
                        </button>
                        {isTagsOpen ? (
                          <span className="assessment-page-question-tags-popover" role="tooltip">
                            {tagGroups.map((group) => (
                              <span key={group.label} className="assessment-page-question-tags-group">
                                <strong>{group.label}</strong>
                                <span>
                                  {group.values.map((value) => (
                                    <span key={value}>{value}</span>
                                  ))}
                                </span>
                              </span>
                            ))}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className="assessment-page-card-collapse-btn"
                      onClick={() => {
                        setExpandedCardRows((current) => (
                          current.includes(questionId)
                            ? current.filter((id) => id !== questionId)
                            : [...current, questionId]
                        ))
                      }}
                      aria-expanded={isCardOpen}
                      aria-label={`${isCardOpen ? 'Collapse' : 'Expand'} question ${questionNumber}`}
                    >
                      {isCardOpen ? <ChevronUp size={16} strokeWidth={2.4} /> : <ChevronDown size={16} strokeWidth={2.4} />}
                    </button>
                  </div>
                  <div className="assessment-page-question-title">
                    <strong>Q{questionNumber}.</strong>
                    <span>{getQuestionPreview(question)}</span>
                  </div>
                  {isCardOpen ? (
                    <>
                      {curriculum.length ? (
                        <div className="assessment-page-question-path">
                          {curriculum.join(' / ')}
                        </div>
                      ) : null}
                      {imageRows.length ? (
                        <div className="assessment-page-question-images" aria-label="Question images">
                          {imageRows.map((image, imageIndex) => (
                            <figure key={image.id ?? `${question.id}-image-${imageIndex}`} className="assessment-page-question-image">
                              <img src={image.url} alt={image.name || `Question image ${imageIndex + 1}`} />
                              <figcaption>{String.fromCharCode(65 + imageIndex)}</figcaption>
                            </figure>
                          ))}
                        </div>
                      ) : null}
                      {isMcq && optionRows.length ? (
                        <div className="assessment-page-question-options">
                          {optionRows
                            .filter((option) => stripHtml(option.label ?? option.content))
                            .map((option, optionIndex) => {
                              const optionLabel = String.fromCharCode(65 + optionIndex)
                              const isCorrect = (question.correctOptionIds ?? []).includes(option.id)
                              const optionPreviewId = `${questionId}-${option.id ?? optionIndex}`

                              return (
                                <span key={option.id ?? `${questionId}-option-${optionIndex}`} className={isCorrect ? 'is-correct' : ''}>
                                  <strong>{optionLabel}.</strong>
                                  {stripHtml(option.label ?? option.content)}
                                  <span className="assessment-page-option-distractor">
                                    <button
                                      type="button"
                                      onClick={() => setActiveOptionDistractorId((current) => (current === optionPreviewId ? '' : optionPreviewId))}
                                      aria-expanded={activeOptionDistractorId === optionPreviewId}
                                      aria-label={`View distractor errors for option ${optionLabel}`}
                                    >
                                      <Info size={12} strokeWidth={2.2} />
                                    </button>
                                    {activeOptionDistractorId === optionPreviewId ? (
                                      <span className="assessment-page-option-distractor-tooltip" role="tooltip">
                                        <strong>Distractor Error</strong>
                                        <span>{(option.distractorErrors ?? [])[0] ?? 'No distractor error selected'}</span>
                                      </span>
                                    ) : null}
                                  </span>
                                </span>
                              )
                            })}
                        </div>
                      ) : null}
                      {isDescriptive && descriptiveSections.length ? (
                        <div className="assessment-page-descriptive-lines">
                          {descriptiveSections.map((section, sectionIndex) => (
                            <div key={section.id ?? `${questionId}-section-${sectionIndex}`} className="assessment-page-descriptive-item">
                              <div className="assessment-page-descriptive-line">
                                <strong>{sectionIndex + 1}.</strong>
                                <span>{stripHtml(section.questionText) || 'Question not added'}</span>
                                {Number(section.marks ?? 0) > 0 ? <em>{section.marks} marks</em> : null}
                              </div>
                              {(section.children ?? []).map((child, childIndex) => (
                                <div key={child.id ?? `${section.id}-child-${childIndex}`} className="assessment-page-descriptive-line is-child">
                                  <strong>{String.fromCharCode(97 + childIndex)}.</strong>
                                  <span>{stripHtml(child.questionText) || 'Question not added'}</span>
                                  {Number(child.marks ?? 0) > 0 ? <em>{child.marks} marks</em> : null}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {!isDescriptive && stripHtml(question.answerKey) ? (
                        <div className="assessment-page-question-answer">
                          <strong>Answer & Explanation</strong>
                          <span>{stripHtml(question.answerKey)}</span>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </article>
              )
            })}
          </section>
        ) : null}

        {pagedQuestions.length && activeView === 'grid' ? (
          <section className="assessment-page-table-wrap" aria-label="Sent question bank table">
            <div className="assessment-page-grid-scroll">
              <table className="assessment-page-question-table assessment-page-grid-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Question</th>
                    <th>Tags</th>
                    <th aria-label="Actions"></th>
                  </tr>
                </thead>
                <tbody>
                {pagedQuestions.map((question, index) => {
                  const questionNumber = pageStartIndex + index + 1
                  const questionId = question.id ?? `${question.type}-${index}`
                  const imageRows = Array.isArray(question.images) ? question.images : []
                  const optionRows = Array.isArray(question.options) ? question.options : []
                  const curriculum = [
                    question.year,
                    question.subject,
                    ...(question.topics ?? []),
                    ...(question.competencies ?? []),
                  ].filter(Boolean)
                  const tagGroups = getOptionalTagGroups(question)
                  const tableTagsId = `table-tags-${questionId}`
                  const isTagsOpen = activeTagsId === tableTagsId
                  const isTableRowOpen = expandedTableRows.includes(questionId)
                  const isGridQuestionSelected = selectedGridQuestionIds.includes(questionId)
                  const descriptiveSections = Array.isArray(question.descriptiveSections) ? question.descriptiveSections : []
                  const isDescriptive = isDescriptiveQuestion(question)
                  const isMcq = getQuestionTypeLabel(question) === 'MCQ'

                  return (
                    <Fragment key={questionId}>
                      {!isTableRowOpen ? (
                        <tr
                          className={`assessment-page-grid-summary-row ${selectedGridAction ? 'is-selection-mode' : ''} ${isGridQuestionSelected ? 'is-selected' : ''}`}
                          onClick={() => handleGridRowAction(questionId, false)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              handleGridRowAction(questionId, false)
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-expanded="false"
                          aria-pressed={selectedGridAction ? isGridQuestionSelected : undefined}
                        >
                          <td className="assessment-page-grid-type-cell">
                            <span className={`assessment-page-grid-type-label ${getQuestionTypeBadgeClassName(question)}`}>{getQuestionTypeLabel(question)}</span>
                          </td>
                          <td className="assessment-page-grid-question">
                            <span className="assessment-page-grid-row-layout">
                              {selectedGridAction ? (
                                <label className="assessment-page-grid-row-checkbox" onClick={(event) => event.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isGridQuestionSelected}
                                    onChange={() => toggleGridQuestionSelection(questionId)}
                                    aria-label={`Select question ${questionNumber}`}
                                  />
                                </label>
                              ) : null}
                              <span className="assessment-page-grid-question-content">
                                <strong>Q{questionNumber}. {getQuestionPreview(question)}</strong>
                              </span>
                            </span>
                          </td>
                          <td className="assessment-page-grid-tags-cell">
                            <span className="assessment-page-grid-question-meta">
                              {renderQuestionTagBadges(question)}
                            </span>
                          </td>
                          <td className="assessment-page-grid-actions-cell">
                            {renderQuestionRowActions(question, questionId, questionNumber, false)}
                          </td>
                        </tr>
                      ) : null}
                      {isTableRowOpen ? (
                        <tr
                          key={`${questionId}-details`}
                          className={`assessment-page-grid-detail-row ${selectedGridAction ? 'is-selection-mode' : ''} ${isGridQuestionSelected ? 'is-selected' : ''}`}
                          onClick={() => handleGridRowAction(questionId, true)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              handleGridRowAction(questionId, true)
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-expanded="true"
                          aria-pressed={selectedGridAction ? isGridQuestionSelected : undefined}
                        >
                          <td colSpan={4}>
                            <div className="assessment-page-table-question-stack">
                              <div className="assessment-page-grid-detail-head">
                                {selectedGridAction ? (
                                  <label className="assessment-page-grid-row-checkbox" onClick={(event) => event.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isGridQuestionSelected}
                                      onChange={() => toggleGridQuestionSelection(questionId)}
                                      aria-label={`Select question ${questionNumber}`}
                                    />
                                  </label>
                                ) : null}
                                <span className={`assessment-page-grid-type-label ${getQuestionTypeBadgeClassName(question)}`}>{getQuestionTypeLabel(question)}</span>
                                <div className="assessment-page-table-full-question">
                                  Q{questionNumber}. {getQuestionPreview(question)}
                                </div>
                                <div className="assessment-page-grid-question-meta assessment-page-grid-detail-meta">
                                  {renderQuestionTagBadges(question)}
                                </div>
                                {renderQuestionRowActions(question, questionId, questionNumber, true)}
                              </div>
                              {imageRows.length ? (
                                <div className="assessment-page-table-inline-section">
                                  <div className="assessment-page-table-images" aria-label={`Images for question ${questionNumber}`}>
                                    {imageRows.map((image, imageIndex) => (
                                      <figure key={image.id ?? `${questionId}-table-image-${imageIndex}`}>
                                        <img src={image.url} alt={image.name || `Question image ${imageIndex + 1}`} />
                                        <figcaption>{String.fromCharCode(65 + imageIndex)}</figcaption>
                                      </figure>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              {isMcq && optionRows.length ? (
                                <div className="assessment-page-table-inline-section">
                                  <div className="assessment-page-table-options">
                                    {optionRows
                                      .filter((option) => stripHtml(option.label ?? option.content))
                                      .map((option, optionIndex) => {
                                        const optionLabel = String.fromCharCode(65 + optionIndex)
                                        const isCorrect = (question.correctOptionIds ?? []).includes(option.id)
                                        const optionPreviewId = `table-${questionId}-${option.id ?? optionIndex}`

                                        return (
                                          <span key={option.id ?? `${questionId}-table-option-${optionIndex}`} className={isCorrect ? 'is-correct' : ''}>
                                            <strong>{optionLabel}.</strong>
                                            {stripHtml(option.label ?? option.content)}
                                            <span className="question-bank-option-distractor-preview assessment-page-table-option-info">
                                              <button
                                                type="button"
                                                onClick={(event) => {
                                                  event.stopPropagation()
                                                  setActiveOptionDistractorId((current) => (current === optionPreviewId ? '' : optionPreviewId))
                                                }}
                                                aria-expanded={activeOptionDistractorId === optionPreviewId}
                                                aria-label={`View distractor errors for option ${optionLabel}`}
                                              >
                                                <Info size={12} strokeWidth={2.2} />
                                              </button>
                                              {activeOptionDistractorId === optionPreviewId ? (
                                                <span className="question-bank-option-distractor-tooltip" role="tooltip">
                                                  <strong>Distractor Error</strong>
                                                  <span>{(option.distractorErrors ?? [])[0] ?? 'No distractor error selected'}</span>
                                                </span>
                                              ) : null}
                                            </span>
                                          </span>
                                        )
                                      })}
                                  </div>
                                </div>
                              ) : null}
                              {isDescriptive && descriptiveSections.length ? (
                                <div className="assessment-page-table-inline-section">
                                  <div className="assessment-page-descriptive-lines">
                                    {descriptiveSections.map((section, sectionIndex) => (
                                      <div key={section.id ?? `${questionId}-table-section-${sectionIndex}`} className="assessment-page-descriptive-item">
                                        <div className="assessment-page-descriptive-line">
                                          <strong>{sectionIndex + 1}.</strong>
                                          <span>{stripHtml(section.questionText) || 'Question not added'}</span>
                                          {Number(section.marks ?? 0) > 0 ? <em>{section.marks} marks</em> : null}
                                        </div>
                                        {(section.children ?? []).map((child, childIndex) => (
                                          <div key={child.id ?? `${section.id}-table-child-${childIndex}`} className="assessment-page-descriptive-line is-child">
                                            <strong>{String.fromCharCode(97 + childIndex)}.</strong>
                                            <span>{stripHtml(child.questionText) || 'Question not added'}</span>
                                            {Number(child.marks ?? 0) > 0 ? <em>{child.marks} marks</em> : null}
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              {!isDescriptive && stripHtml(question.answerKey) ? (
                                <div className="assessment-page-table-inline-section assessment-page-table-answer">
                                  <span>{stripHtml(question.answerKey)}</span>
                                </div>
                              ) : null}
                              {tagGroups.length || curriculum.length ? (
                                <div className="assessment-page-grid-detail-footer-meta">
                                  {tagGroups.length ? (
                                    <div className="assessment-page-grid-question-meta assessment-page-grid-detail-extra-tags">
                                      <span className="assessment-page-question-tags-wrap">
                                        <button
                                          type="button"
                                          className="assessment-page-question-tags-btn"
                                          onClick={(event) => {
                                            event.stopPropagation()
                                            setActiveTagsId(isTagsOpen ? '' : tableTagsId)
                                          }}
                                          aria-expanded={isTagsOpen}
                                        >
                                          <Info size={12} strokeWidth={2.2} />
                                          View Tags
                                        </button>
                                        {isTagsOpen ? (
                                          <span className="assessment-page-question-tags-popover" role="tooltip">
                                            {tagGroups.map((group) => (
                                              <span key={group.label} className="assessment-page-question-tags-group">
                                                <strong>{group.label}</strong>
                                                <span>
                                                  {group.values.map((value) => (
                                                    <span key={value}>{value}</span>
                                                  ))}
                                                </span>
                                              </span>
                                            ))}
                                          </span>
                                        ) : null}
                                      </span>
                                    </div>
                                  ) : null}
                                  {curriculum.length ? (
                                    <div className="assessment-page-table-curriculum">{curriculum.join(' / ')}</div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })}
                </tbody>
              </table>
            </div>
            {publishedQuestions.length && pagedQuestions.length ? (
              <section className="assessment-page-bank-pagination assessment-page-grid-pagination" aria-label="All question bank pagination">
                <span className="assessment-page-grid-pagination-summary">
                  <span>Page {safeCurrentPage} of {totalPages}</span>
                  <span>{footerResultSummary}</span>
                </span>
                <div>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safeCurrentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} strokeWidth={2.3} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safeCurrentPage === totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} strokeWidth={2.3} />
                  </button>
                </div>
              </section>
            ) : null}
          </section>
        ) : null}

        {isEditable && selectedGridAction ? (
          <section
            ref={selectionBarRef}
            className="assessment-page-selection-bar"
            style={selectionBarPosition ? {
              top: `${selectionBarPosition.y}px`,
              right: 'auto',
              bottom: 'auto',
              left: `${selectionBarPosition.x}px`,
              margin: 0,
            } : undefined}
            onPointerDown={handleSelectionBarPointerDown}
            onPointerMove={handleSelectionBarPointerMove}
            onPointerUp={handleSelectionBarPointerUp}
            onPointerCancel={handleSelectionBarPointerUp}
            aria-live="polite"
          >
            <span>
              <strong>{selectedGridQuestionIds.length}</strong>
              selected for {selectedGridAction === 'assessment' ? 'Assessment' : 'Learn'}
            </span>
            <button type="button" onClick={clearGridActionState}>
              Clear
            </button>
          </section>
        ) : null}

        {isEditable && reportQuestion && typeof document !== 'undefined' ? createPortal(
          <div className="assessment-page-report-modal" role="dialog" aria-modal="true" aria-labelledby="assessment-report-title">
            <div className="assessment-page-report-backdrop" onClick={resetReportModal} aria-hidden="true" />
            <div className="assessment-page-report-card">
              <header className="assessment-page-report-head">
                <div>
                  <h2 id="assessment-report-title">Why report this?</h2>
                </div>
                <button type="button" onClick={resetReportModal} aria-label="Close report dialog">
                  <X size={17} strokeWidth={2.4} />
                </button>
              </header>
              <label className="assessment-page-report-field">
                <span>Select reason for the question</span>
                <select
                  value=""
                  onChange={(event) => {
                    const selectedReason = event.target.value
                    if (!selectedReason) return
                    setReportReasons((current) => (
                      current.includes(selectedReason) ? current : [...current, selectedReason]
                    ))
                  }}
                >
                  <option value="">Select reason</option>
                  {REPORT_REASON_OPTIONS
                    .filter((reason) => !reportReasons.includes(reason))
                    .map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                </select>
                <span className="assessment-page-report-reason-badges" aria-label="Selected report reasons">
                  {reportReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setReportReasons((current) => current.filter((item) => item !== reason))}
                      aria-label={`Remove ${reason}`}
                    >
                      {reason}
                      <X size={12} strokeWidth={2.4} />
                    </button>
                  ))}
                </span>
              </label>
              <label className="assessment-page-report-field">
                <span>Assign to Author</span>
                <select value={reportAuthorAction} onChange={(event) => setReportAuthorAction(event.target.value)}>
                  <option value="">Select action</option>
                  {REPORT_AUTHOR_ACTION_OPTIONS.map((action) => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </label>
              <label className="assessment-page-report-field">
                <span>Any other comments <small>(optional)</small></span>
                <textarea
                  value={reportExplanation}
                  onChange={(event) => setReportExplanation(event.target.value)}
                  placeholder="Explain clearly why you are rejecting this"
                  rows={4}
                />
              </label>
              <footer className="assessment-page-report-actions">
                <button type="button" className="is-secondary" onClick={resetReportModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitReportQuestion}
                  disabled={!reportReasons.length || !reportAuthorAction}
                >
                  Assign to Author
                </button>
              </footer>
            </div>
          </div>,
          document.body,
        ) : null}

        {isEditable && editQuestion && typeof document !== 'undefined' ? createPortal(
          <div className="assessment-page-report-modal" role="dialog" aria-modal="true" aria-labelledby="assessment-edit-title">
            <div className="assessment-page-report-backdrop" onClick={closeEditModeModal} aria-hidden="true" />
            <div className="assessment-page-report-card assessment-page-edit-mode-card">
              <header className="assessment-page-report-head">
                <div>
                  <h2 id="assessment-edit-title">Edit this question?</h2>
                </div>
                <button type="button" onClick={closeEditModeModal} aria-label="Close edit dialog">
                  <X size={17} strokeWidth={2.4} />
                </button>
              </header>
              <p className="assessment-page-edit-mode-copy">
                Choose how you want to use this question in Create Question.
              </p>
              <div className="assessment-page-edit-mode-toggle" role="radiogroup" aria-label="Edit mode">
                <button
                  type="button"
                  className={editQuestionMode === 'overwrite' ? 'is-active' : ''}
                  onClick={() => setEditQuestionMode('overwrite')}
                  disabled={!isMedsyQuestion(editQuestion)}
                  role="radio"
                  aria-checked={editQuestionMode === 'overwrite'}
                  aria-disabled={!isMedsyQuestion(editQuestion)}
                  title={!isMedsyQuestion(editQuestion) ? 'Created questions can only be duplicated for editing' : 'Overwrite this question'}
                >
                  Overwrite
                </button>
                <button
                  type="button"
                  className={editQuestionMode === 'duplicate' ? 'is-active' : ''}
                  onClick={() => setEditQuestionMode('duplicate')}
                  role="radio"
                  aria-checked={editQuestionMode === 'duplicate'}
                >
                  Create New
                </button>
              </div>
              <footer className="assessment-page-report-actions">
                <button type="button" className="is-secondary" onClick={closeEditModeModal}>
                  Cancel
                </button>
                <button type="button" onClick={continueEditQuestion}>
                  Continue
                </button>
              </footer>
            </div>
          </div>,
          document.body,
        ) : null}

        {publishedQuestions.length && !pagedQuestions.length ? (
          <section className="assessment-page-empty">
            <Info size={18} strokeWidth={2.2} />
            <strong>No matching questions</strong>
            <p>Try changing the search text, source, or author filter.</p>
          </section>
        ) : null}

        {!publishedQuestions.length ? (
          <section className="assessment-page-empty">
            <Info size={18} strokeWidth={2.2} />
            <strong>No sent questions yet</strong>
            <p>Approved questions sent to Question Bank will appear here.</p>
          </section>
        ) : null}
      </div>
    </section>
  )
}
