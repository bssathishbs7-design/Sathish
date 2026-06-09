import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BarChart3, BookOpenCheck, Brain, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardList, FileSearch, Flag, Gauge, Info, LayoutGrid, ListChecks, Pencil, Plus, Search, Share2, Shuffle, Star, Tags, Upload, X } from 'lucide-react'
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
const QUESTION_BANK_DASHBOARD_WELCOME_DISMISSED_KEY = 'vx-question-bank-dashboard-welcome-dismissed'
const CREATE_ASSESSMENT_SETUP_KEY = 'vx-create-assessment-setup'
const CREATE_ASSESSMENT_INITIAL_TAB_KEY = 'vx-create-assessment-initial-tab'
const CREATE_ASSESSMENT_QUESTIONS_KEY = 'vx-create-assessment-questions'
const ASSESSMENT_DRAFTS_STORAGE_KEY = 'vx-assessment-drafts'
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
const DEFAULT_ASSESSMENT_SETUP = {
  collegeName: '',
  logoName: '',
  logoPreview: '',
  assessmentName: '',
  academicYear: '2025 - 2026',
  examCategory: '',
  course: '',
  year: '',
}
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
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

const getQuestionPreview = (question) => stripHtml(question?.questionText) || question?.title || 'Untitled question'
const getCompetencyCode = (value) => String(value ?? '').trim().split(/\s+/)[0] || value
const getQuestionCategoryLabel = (value, questionOrType) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  const typeLabel = questionOrType ? getQuestionTypeLabel(questionOrType) : ''
  const isMcq = typeLabel === 'MCQ'
  if (normalized === 'critical thinking' || normalized === 'critical_thinking' || normalized === 'aetcom') {
    return isMcq ? 'Critical Thinking' : 'Aetcom'
  }
  if (normalized === 'direct') return 'Direct'
  if (normalized === 'reasoning') return 'Reasoning'
  if (normalized === 'application') return 'Application'
  return value
}

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
  const sectionAnswer = isHigherOrder
    ? 'Cover the key anatomical or physiological basis, mechanism of injury, and expected functional consequence.'
    : 'State the core concept clearly with the essential supporting points.'
  const childAnswer = 'Add a clinically relevant correlation, common presentation, or practical application linked to the question.'

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
        answerKey: sectionAnswer,
        children: [
          {
            id: `medsy-desc-${questionNumber}-child-1`,
            questionText: 'Add one relevant clinical correlation.',
            marks: '1',
            answerKey: childAnswer,
          },
        ],
      },
    ],
    answerKey: sectionAnswer,
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

const isExcelUploadedQuestion = (question) => (
  !isMedsyQuestion(question)
  && (
    question?.source === 'Excel Upload'
    || Boolean(question?.uploadBatchId)
  )
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
  { label: 'Category', values: [getQuestionCategoryLabel(question?.questionCategory, question)].filter(Boolean) },
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

const getThinkingLevelLabel = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'hot') return 'HoT'
  if (normalized === 'lot') return 'LoT'
  return value
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

const getDescriptiveAnswerText = (question, section, child) => {
  const explicitAnswer = stripHtml(child?.answerKey)
    || stripHtml(section?.answerKey)
    || stripHtml(question?.answerKey)
  if (explicitAnswer) return explicitAnswer
  if (!isMedsyQuestion(question)) return ''

  const targetText = stripHtml(child?.questionText)
    || stripHtml(section?.questionText)
    || getQuestionPreview(question)
  if (!targetText) return ''

  return `Answer & Explanation: Explain ${targetText} with the key concept, relevant supporting points, and clinical significance.`
}

const getDescriptiveAnswerItems = (question, sections) => {
  const sectionList = Array.isArray(sections) ? sections : []
  if (!sectionList.length) {
    const mainAnswer = stripHtml(question?.answerKey)
    return mainAnswer ? [{ key: `${question?.id ?? 'question'}-main-answer`, label: 'Main question', text: mainAnswer }] : []
  }

  return sectionList.flatMap((section, sectionIndex) => {
    const sectionLabel = ROMAN_NUMERALS[sectionIndex] ?? String(sectionIndex + 1)
    const children = Array.isArray(section.children) ? section.children : []
    if (!children.length) {
      const answerText = getDescriptiveAnswerText(question, section)
      return answerText
        ? [{ key: `${section.id ?? sectionIndex}-answer`, label: `${sectionLabel}.`, text: answerText }]
        : []
    }

    return children
      .map((child, childIndex) => {
        const answerText = getDescriptiveAnswerText(question, section, child)
        return answerText
          ? {
            key: `${child.id ?? `${section.id ?? sectionIndex}-child-${childIndex}`}-answer`,
            label: `${sectionLabel}.${String.fromCharCode(97 + childIndex)}.`,
            text: answerText,
          }
          : null
      })
      .filter(Boolean)
  })
}

const parseMarksValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getQuestionMarksTotal = (question) => {
  if (isDescriptiveQuestion(question)) {
    const sections = question.descriptiveSections ?? []
    const sectionTotal = (question.descriptiveSections ?? []).reduce((total, section) => {
      const children = Array.isArray(section.children) ? section.children : []
      const childTotal = children.reduce((sum, child) => sum + parseMarksValue(child.marks), 0)
      const sectionMarks = children.length ? 0 : parseMarksValue(section.marks)
      return total + sectionMarks + childTotal
    }, 0)
    const rootMarks = sections.length ? 0 : parseMarksValue(question.marks)
    const totalMarks = rootMarks + sectionTotal
    return totalMarks || (getQuestionPreview(question) ? 2 : 0)
  }

  if (getQuestionTypeLabel(question) === 'MCQ' && !parseMarksValue(question.marks)) return 1
  return parseMarksValue(question.marks)
}

const getQuestionSourceType = (question) => (
  isMedsyQuestion(question) || isExcelUploadedQuestion(question) ? 'Uploaded' : 'Created'
)

const getAuthorBadgeClassName = (question) => (
  isExcelUploadedQuestion(question)
    ? 'is-excel-uploaded-author'
    : getQuestionSourceType(question) === 'Uploaded'
      ? 'is-uploaded-author'
      : 'is-created-author'
)

const getAuthorBadgeInitial = (question) => (
  isMedsyQuestion(question) ? 'M' : isExcelUploadedQuestion(question) ? '' : 'C'
)

const getAuthorBadgeTooltip = (question) => (
  isEditedQuestion(question)
    ? 'Edited question'
    : isExcelUploadedQuestion(question)
      ? 'Uploaded question'
      : isMedsyQuestion(question)
        ? 'Medsy'
        : getQuestionAuthorName(question)
)

const renderSourceBadge = (question, className) => (
  <span
    className={`${className} assessment-page-source-badge ${getAuthorBadgeClassName(question)} ${isEditedQuestion(question) ? 'is-edited-author' : ''}`}
    title={getAuthorBadgeTooltip(question)}
    aria-label={getAuthorBadgeTooltip(question)}
  >
    {isEditedQuestion(question) ? (
      <Shuffle size={14} strokeWidth={2.4} />
    ) : isExcelUploadedQuestion(question) ? (
      <Upload size={14} strokeWidth={2.4} />
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

const getMetricCountSizeClass = (value) => {
  const formattedLength = formatMetricCount(value).length
  if (formattedLength >= 10) return 'is-count-xxl'
  if (formattedLength >= 8) return 'is-count-xl'
  if (formattedLength >= 6) return 'is-count-lg'
  return ''
}

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

const applyFilterSetToQuestion = (question, filterSet) => {
  if (!hasFilterMatch(filterSet.years ?? [], question.year)) return false
  if (!hasFilterMatch(filterSet.subjects ?? [], question.subject)) return false
  if (!hasFilterMatch(filterSet.topics ?? [], question.topics ?? [])) return false
  if (!hasFilterMatch(filterSet.competencies ?? [], question.competencies ?? [])) return false
  return true
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

const isQuestionBankDashboardWelcomeDismissed = () => {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(QUESTION_BANK_DASHBOARD_WELCOME_DISMISSED_KEY) === 'true'
}

const readAssessmentDrafts = () => {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ASSESSMENT_DRAFTS_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
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

const readAssessmentQuestionsForSetup = (setup = {}) => {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(getAssessmentQuestionsStorageKey(setup)) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const createImportedAssessmentQuestions = (questions = [], setup = {}) => (
  questions.map((item, index) => ({
    ...item,
    id: `assessment-imported-${item.id ?? Date.now()}-${index}`,
    originalQuestionId: item.id ?? item.originalQuestionId,
    status: 'Created',
    source: item.source || 'Question Bank',
    assessmentName: setup.assessmentName || 'Untitled Assessment',
    savedAt: new Date().toISOString(),
  }))
)

export default function QuestionBankNonCreatePage({ onNavigate, mode = 'readonly', embedded = false, onAddToAssessment }) {
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
  const [landingFilters, setLandingFilters] = useState(() => createEmptyFilters())
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
  const [isEmbeddedSelectionBarClosed, setIsEmbeddedSelectionBarClosed] = useState(false)
  const [isEmbeddedSelectionBarVisible, setIsEmbeddedSelectionBarVisible] = useState(false)
  const [expandedCardRows, setExpandedCardRows] = useState([])
  const [activeMetric, setActiveMetric] = useState('total')
  const [showMetricsLanding, setShowMetricsLanding] = useState(() => !embedded && !isQuestionBankDashboardWelcomeDismissed())
  const [showDashboardWelcomeToast, setShowDashboardWelcomeToast] = useState(() => !embedded && !isQuestionBankDashboardWelcomeDismissed())
  const [metricTooltip, setMetricTooltip] = useState(null)
  const [reportedQuestionRecords, setReportedQuestionRecords] = useState(() => readReportedQuestionRecords())
  const [createdReportedQuestionRecords, setCreatedReportedQuestionRecords] = useState(() => readCreatedReportedQuestionRecords())
  const [reportQuestion, setReportQuestion] = useState(null)
  const [reportReasons, setReportReasons] = useState([])
  const [reportExplanation, setReportExplanation] = useState('')
  const [reportAuthorAction, setReportAuthorAction] = useState('')
  const [editQuestion, setEditQuestion] = useState(null)
  const [editQuestionMode, setEditQuestionMode] = useState('overwrite')
  const [assessmentChooserOpen, setAssessmentChooserOpen] = useState(false)
  const [draftAssessmentOptions, setDraftAssessmentOptions] = useState(() => readAssessmentDrafts())

  useEffect(() => {
    if (!isReadonly || embedded) return
    setSelectedGridAction('')
    setSelectedGridQuestionIds([])
    setSelectionBarPosition(null)
    setAssessmentChooserOpen(false)
  }, [embedded, isReadonly])

  useEffect(() => {
    if (selectedGridQuestionIds.length) return
    setAssessmentChooserOpen(false)
  }, [selectedGridQuestionIds.length])

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
    categories: getUniqueValues(metricFilteredQuestions, (question) => getQuestionCategoryLabel(question.questionCategory, question)),
    thinkingLevels: getUniqueValues(metricFilteredQuestions, (question) => getThinkingLevelLabel(question.thinkingLevel)),
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
    categories: getValueCounts(metricFilteredQuestions, (question) => getQuestionCategoryLabel(question.questionCategory, question)),
    thinkingLevels: getValueCounts(metricFilteredQuestions, (question) => getThinkingLevelLabel(question.thinkingLevel)),
    difficultyLevels: getValueCounts(metricFilteredQuestions, (question) => question.difficultyLevel),
    cognitiveLevels: getValueCounts(metricFilteredQuestions, (question) => question.cognitiveLevel),
    cognitiveFunctions: getValueCounts(metricFilteredQuestions, (question) => question.cognitiveFunction),
    skillFocuses: getValueCounts(metricFilteredQuestions, (question) => question.skillFocus),
    organSystems: getValueCounts(metricFilteredQuestions, (question) => question.organSystem),
    organSubSystems: getValueCounts(metricFilteredQuestions, (question) => question.organSubSystems ?? []),
    diseaseTags: getValueCounts(metricFilteredQuestions, (question) => question.diseaseTags ?? []),
    keyConcepts: getValueCounts(metricFilteredQuestions, (question) => question.keyConcepts ?? []),
  }), [metricFilteredQuestions])

  const landingFilterOptions = useMemo(() => ({
    years: getUniqueValues(publishedQuestions, (question) => question.year),
    subjects: getUniqueValues(publishedQuestions, (question) => question.subject),
    topics: getUniqueValues(publishedQuestions, (question) => question.topics ?? []),
    competencies: getUniqueValues(publishedQuestions, (question) => question.competencies ?? []),
  }), [publishedQuestions])

  const landingQuestions = publishedQuestions

  const landingValueCounts = useMemo(() => ({
    types: getValueCounts(landingQuestions, (question) => getQuestionTypeFilterLabel(question)),
    subjects: getValueCounts(landingQuestions, (question) => question.subject),
    topics: getValueCounts(landingQuestions, (question) => question.topics ?? []),
    competencies: getValueCounts(landingQuestions, (question) => question.competencies ?? []),
    categories: getValueCounts(landingQuestions, (question) => getQuestionCategoryLabel(question.questionCategory, question)),
    cognitiveLevels: getValueCounts(landingQuestions, (question) => question.cognitiveLevel),
    thinkingLevels: getValueCounts(landingQuestions, (question) => getThinkingLevelLabel(question.thinkingLevel)),
    difficultyLevels: getValueCounts(landingQuestions, (question) => question.difficultyLevel),
  }), [landingQuestions])

  const updateActiveFilters = showMetricsLanding ? setLandingFilters : setFilters

  const toggleFilterValue = (filterKey, value) => {
    updateActiveFilters((current) => {
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
    updateActiveFilters((current) => ({
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
      if (!hasFilterMatch(filters.categories, getQuestionCategoryLabel(question.questionCategory, question))) return false
      if (!hasFilterMatch(filters.thinkingLevels, getThinkingLevelLabel(question.thinkingLevel))) return false
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
  const landingFilterDefinitions = [
    ['years', 'Year', landingFilterOptions.years],
    ['subjects', 'Subject', landingFilterOptions.subjects],
    ['topics', 'Topic', landingFilterOptions.topics],
    ['competencies', 'Competency', landingFilterOptions.competencies],
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
  const createDistribution = (counts, preferredOrder = []) => {
    const entries = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort((first, second) => {
        const firstOrder = preferredOrder.indexOf(first[0])
        const secondOrder = preferredOrder.indexOf(second[0])
        if (firstOrder !== -1 || secondOrder !== -1) {
          return (firstOrder === -1 ? Number.MAX_SAFE_INTEGER : firstOrder) - (secondOrder === -1 ? Number.MAX_SAFE_INTEGER : secondOrder)
        }
        return second[1] - first[1] || first[0].localeCompare(second[0])
      })
      .slice(0, 4)
    const maxCount = Math.max(1, ...entries.map(([, count]) => count))

    return entries.map(([label, count]) => ({
      label,
      count,
      width: Math.max(8, Math.round((count / maxCount) * 100)),
    }))
  }
  const createSplitCounts = (counts, preferredOrder = [], limit = 5) => (
    Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort((first, second) => {
        const firstOrder = preferredOrder.indexOf(first[0])
        const secondOrder = preferredOrder.indexOf(second[0])
        if (firstOrder !== -1 || secondOrder !== -1) {
          return (firstOrder === -1 ? Number.MAX_SAFE_INTEGER : firstOrder) - (secondOrder === -1 ? Number.MAX_SAFE_INTEGER : secondOrder)
        }
        return second[1] - first[1] || first[0].localeCompare(second[0])
      })
      .slice(0, limit)
      .map(([label, count]) => ({ label, count }))
  )
  const getSplitColor = (metricKey, index) => {
    const colorMap = {
      descriptive: ['#f59e0b', '#14b8a6', '#ef4444'],
      thinking: ['#7c3aed', '#14b8a6'],
      difficulty: ['#22c55e', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6'],
      cognitive: ['#2563eb', '#06b6d4', '#14b8a6', '#f59e0b', '#8b5cf6'],
    }

    return colorMap[metricKey]?.[index % colorMap[metricKey].length] ?? '#14b8a6'
  }
  const createDonutDistribution = (counts, preferredOrder = [], colors = ['#6d5dfc', '#2563eb', '#fb7c3f', '#38bdf8', '#20c7ad']) => {
    const entries = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort((first, second) => {
        const firstOrder = preferredOrder.indexOf(first[0])
        const secondOrder = preferredOrder.indexOf(second[0])
        if (firstOrder !== -1 || secondOrder !== -1) {
          return (firstOrder === -1 ? Number.MAX_SAFE_INTEGER : firstOrder) - (secondOrder === -1 ? Number.MAX_SAFE_INTEGER : secondOrder)
        }
        return second[1] - first[1] || first[0].localeCompare(second[0])
      })
      .slice(0, 5)
    const total = entries.reduce((sum, [, count]) => sum + count, 0)
    let cursor = 0
    const segments = entries.map(([label, count], index) => {
      const start = cursor
      const size = total ? (count / total) * 100 : 0
      cursor += size
      return {
        label,
        count,
        color: colors[index % colors.length],
        start,
        end: cursor,
        percent: total ? Math.round((count / total) * 100) : 0,
      }
    })
    const gradient = segments.length
      ? segments.map((item) => `${item.color} ${item.start}% ${item.end}%`).join(', ')
      : '#e5eef0 0 100%'

    return { segments, total, gradient }
  }

  const questionMetrics = [
    {
      key: 'total',
      label: 'Total Question',
      value: landingQuestions.length,
      icon: ClipboardList,
      tone: 'total',
      filters: {},
      distribution: createDistribution(landingValueCounts.types, ['MCQ', 'Descriptive (SAQs)', 'Descriptive (LAQs)', 'Descriptive (MEQs)']),
    },
    {
      key: 'medsy',
      label: 'Medsy Question',
      value: landingQuestions.filter(isMedsyQuestion).length,
      icon: FileSearch,
      tone: 'medsy',
      activeMetricKey: 'medsy',
      distribution: createDistribution(getValueCounts(landingQuestions.filter(isMedsyQuestion), (question) => getQuestionTypeFilterLabel(question))),
    },
    {
      key: 'created',
      label: 'Institute Questions',
      value: landingQuestions.filter((question) => !isMedsyQuestion(question)).length,
      icon: ListChecks,
      tone: 'created',
      activeMetricKey: 'created',
      distribution: createDistribution(getValueCounts(landingQuestions.filter((question) => !isMedsyQuestion(question)), (question) => getQuestionTypeFilterLabel(question))),
    },
    {
      key: 'mcq',
      label: 'Multiple Choice (MCQ)',
      value: landingValueCounts.types.MCQ ?? 0,
      icon: BookOpenCheck,
      tone: 'type',
      filters: { types: ['MCQ'] },
      distribution: createDistribution({ MCQ: landingValueCounts.types.MCQ ?? 0 }),
    },
    {
      key: 'descriptive',
      label: 'Descriptive',
      value: (landingValueCounts.types['Descriptive (LAQs)'] ?? 0)
        + (landingValueCounts.types['Descriptive (SAQs)'] ?? 0)
        + (landingValueCounts.types['Descriptive (MEQs)'] ?? 0),
      icon: BookOpenCheck,
      tone: 'type',
      filters: { types: ['Descriptive (LAQs)', 'Descriptive (SAQs)', 'Descriptive (MEQs)'] },
      splits: [
        { label: 'LAQs', count: landingValueCounts.types['Descriptive (LAQs)'] ?? 0 },
        { label: 'SAQs', count: landingValueCounts.types['Descriptive (SAQs)'] ?? 0 },
        { label: 'MEQs', count: landingValueCounts.types['Descriptive (MEQs)'] ?? 0 },
      ],
      donut: createDonutDistribution({
        LAQs: landingValueCounts.types['Descriptive (LAQs)'] ?? 0,
        SAQs: landingValueCounts.types['Descriptive (SAQs)'] ?? 0,
        MEQs: landingValueCounts.types['Descriptive (MEQs)'] ?? 0,
      }, ['LAQs', 'SAQs', 'MEQs'], ['#f59e0b', '#14b8a6', '#ef4444']),
      distribution: createDistribution({
        LAQs: landingValueCounts.types['Descriptive (LAQs)'] ?? 0,
        SAQs: landingValueCounts.types['Descriptive (SAQs)'] ?? 0,
        MEQs: landingValueCounts.types['Descriptive (MEQs)'] ?? 0,
      }, ['LAQs', 'SAQs', 'MEQs']),
    },
    {
      key: 'categories',
      label: 'Question Category',
      value: landingQuestions.filter((question) => question.questionCategory).length,
      icon: Tags,
      tone: 'category',
      filters: { categories: Object.keys(landingValueCounts.categories) },
      donut: createDonutDistribution(landingValueCounts.categories, ['Application', 'Direct', 'Reasoning', 'Critical Thinking', 'Aetcom'], ['#6d5dfc', '#2563eb', '#fb7c3f', '#38bdf8', '#14b8a6']),
      distribution: createDistribution(landingValueCounts.categories),
    },
    {
      key: 'cognitive',
      label: 'Cognitive Level',
      value: landingQuestions.filter((question) => question.cognitiveLevel).length,
      icon: Brain,
      tone: 'cognitive',
      filters: { cognitiveLevels: Object.keys(landingValueCounts.cognitiveLevels) },
      splits: createSplitCounts(landingValueCounts.cognitiveLevels),
      distribution: createDistribution(landingValueCounts.cognitiveLevels),
    },
    {
      key: 'thinking',
      label: 'Thinking Level',
      value: landingQuestions.filter((question) => question.thinkingLevel).length,
      icon: BarChart3,
      tone: 'thinking',
      filters: { thinkingLevels: Object.keys(landingValueCounts.thinkingLevels) },
      splits: createSplitCounts(landingValueCounts.thinkingLevels, ['HoT', 'LoT']),
      distribution: createDistribution(landingValueCounts.thinkingLevels, ['HoT', 'LoT']),
    },
    {
      key: 'difficulty',
      label: 'Difficulty Level',
      value: landingQuestions.filter((question) => question.difficultyLevel).length,
      icon: Gauge,
      tone: 'difficulty',
      filters: { difficultyLevels: Object.keys(landingValueCounts.difficultyLevels) },
      splits: createSplitCounts(landingValueCounts.difficultyLevels, ['L1', 'L2', 'L3', 'L4', 'L5'], 5),
      distribution: createDistribution(landingValueCounts.difficultyLevels, ['L1', 'L2', 'L3', 'L4', 'L5']),
    },
  ]
  const visibleQuestionMetrics = []
  const questionMetricByKey = Object.fromEntries(questionMetrics.map((metric) => [metric.key, metric]))
  const questionTypeDonut = createDonutDistribution({
    MCQ: landingValueCounts.types.MCQ ?? 0,
    LAQs: landingValueCounts.types['Descriptive (LAQs)'] ?? 0,
    SAQs: landingValueCounts.types['Descriptive (SAQs)'] ?? 0,
    MEQs: landingValueCounts.types['Descriptive (MEQs)'] ?? 0,
  }, ['MCQ', 'LAQs', 'SAQs', 'MEQs'], ['#2563eb', '#f59e0b', '#14b8a6', '#8b5cf6'])
  const questionTypeLabelItems = ['MCQ', 'LAQs', 'SAQs', 'MEQs'].map((label) => ({
    label,
    color: questionTypeDonut.segments.find((segment) => segment.label === label)?.color ?? '#cbd5e1',
  }))
  const questionListSummaryMetrics = [
    { key: 'total', label: 'Total Question', value: publishedQuestions.length, icon: ClipboardList, tone: 'total' },
    { key: 'medsy', label: 'Medsy Question', value: publishedQuestions.filter(isMedsyQuestion).length, icon: FileSearch, tone: 'medsy', activeMetricKey: 'medsy' },
    { key: 'created', label: 'Institute Questions', value: publishedQuestions.filter((question) => !isMedsyQuestion(question)).length, icon: ListChecks, tone: 'created', activeMetricKey: 'created' },
    { key: 'favorites', label: 'Favorites', value: publishedQuestions.filter(isFavoriteQuestion).length, icon: Star, tone: 'favorites', activeMetricKey: 'favorites' },
    { key: 'shared', label: 'Share to Students', value: publishedQuestions.filter(isSharedToStudentsQuestion).length, icon: Share2, tone: 'shared', activeMetricKey: 'shared' },
    { key: 'suggested', label: 'Report Question', value: [
      ...reportedQuestionRecords,
      ...createdReportedQuestionRecords,
    ].filter((record) => !isResolvedReportRecord(record)).length, icon: Flag, tone: 'suggested', activeMetricKey: 'suggested' },
  ]
  const activeMetricLabel = questionMetrics.find((metric) => metric.key === activeMetric)?.label ?? 'questions'
  const isReportMetricActive = activeMetric === 'suggested'
  const hasEmbeddedAssessmentSelection = embedded && typeof onAddToAssessment === 'function' && !isReportMetricActive
  const visibleQuestionListSummaryMetrics = embedded
    ? questionListSummaryMetrics.filter((metric) => !['shared', 'suggested'].includes(metric.key))
    : questionListSummaryMetrics
  const footerResultSummary = hasSelectedFilters(filters)
    ? `${formatMetricCount(filteredQuestions.length)} filtered of ${formatMetricCount(metricFilteredQuestions.length)} ${activeMetricLabel.toLowerCase()}`
    : `Showing ${formatMetricCount(pagedQuestions.length)} of ${formatMetricCount(metricFilteredQuestions.length)}`

  const openQuestionList = (metric = null) => {
    setActiveMetric(metric?.activeMetricKey ?? 'total')
    setFilters({
      ...createEmptyFilters(),
      ...(metric?.filters ?? {}),
    })
    setShowMetricsLanding(false)
    setOpenFilterKey('')
    setShowAdvancedFilters(false)
  }

  const viewAllQuestions = () => {
    setActiveMetric('total')
    setFilters(createEmptyFilters())
    setShowMetricsLanding(false)
    setOpenFilterKey('')
    setShowAdvancedFilters(false)
  }

  const applyLandingFilters = () => {
    setActiveMetric('total')
    setFilters({
      ...createEmptyFilters(),
      years: landingFilters.years,
      subjects: landingFilters.subjects,
      topics: landingFilters.topics,
      competencies: landingFilters.competencies,
    })
    setShowMetricsLanding(false)
    setOpenFilterKey('')
    setShowAdvancedFilters(false)
  }

  const clearLandingFilters = () => {
    setLandingFilters(createEmptyFilters())
    setOpenFilterKey('')
  }

  const closeDashboardWelcomeToast = () => {
    setShowDashboardWelcomeToast(false)
  }

  const dismissDashboardWelcomePermanently = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(QUESTION_BANK_DASHBOARD_WELCOME_DISMISSED_KEY, 'true')
    }
    setShowDashboardWelcomeToast(false)
    viewAllQuestions()
  }

  const backToMetrics = () => {
    setShowMetricsLanding(true)
    setActiveMetric('total')
    setFilters(createEmptyFilters())
    setLandingFilters(createEmptyFilters())
    setCurrentPage(1)
    setSelectedGridAction('')
    setSelectedGridQuestionIds([])
    setExpandedTableRows([])
    setExpandedCardRows([])
    setOpenFilterKey('')
    setShowAdvancedFilters(false)
    setIsCompactFilterTrayOpen(false)
    setShowDashboardWelcomeToast(!embedded)
  }

  const expandAllVisibleRows = () => {
    setExpandedTableRows((current) => Array.from(new Set([...current, ...pagedQuestionIds])))
  }

  const collapseAllVisibleRows = () => {
    setExpandedTableRows((current) => current.filter((questionId) => !pagedQuestionIds.includes(questionId)))
  }

  const toggleGridQuestionSelection = (questionId) => {
    setIsEmbeddedSelectionBarClosed(false)
    setIsEmbeddedSelectionBarVisible(true)
    setSelectedGridQuestionIds((current) => (
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    ))
  }

  const resetAssessmentSelection = () => {
    setSelectedGridQuestionIds([])
    setSelectedGridAction('')
    setSelectionBarPosition(null)
    setIsEmbeddedSelectionBarClosed(false)
    setIsEmbeddedSelectionBarVisible(false)
    setAssessmentChooserOpen(false)
  }

  const getSelectedAssessmentQuestions = () => (
    publishedQuestions.filter((item) => selectedGridQuestionIds.includes(item.id))
  )

  const addSelectedQuestionsToEmbeddedAssessment = () => {
    if (!selectedGridQuestionIds.length) return
    const selectedQuestions = getSelectedAssessmentQuestions()
    onAddToAssessment?.(selectedQuestions)
    resetAssessmentSelection()
  }

  const openAssessmentChooser = () => {
    if (!selectedGridQuestionIds.length) return
    setDraftAssessmentOptions(readAssessmentDrafts())
    setAssessmentChooserOpen((current) => !current)
  }

  const persistSelectedQuestionsToAssessment = (setup, draft = null) => {
    if (!setup || typeof window === 'undefined') return
    const selectedQuestions = getSelectedAssessmentQuestions()
    const importedQuestions = createImportedAssessmentQuestions(selectedQuestions, setup)
    if (!importedQuestions.length) return

    const existingQuestions = readAssessmentQuestionsForSetup(setup)
    const nextQuestions = [
      ...importedQuestions,
      ...existingQuestions.filter((item) => !selectedQuestions.some((questionItem) => (
        (questionItem.id ?? questionItem.originalQuestionId) === (item.originalQuestionId ?? item.id)
      ))),
    ]
    window.localStorage.setItem(getAssessmentQuestionsStorageKey(setup), JSON.stringify(nextQuestions))
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify(setup))
    window.localStorage.setItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY, 'preview')

    if (draft) {
      const totalMarks = nextQuestions.reduce((total, item) => total + getQuestionMarksTotal(item), 0)
      const nextDraft = {
        ...draft,
        setup,
        assessmentName: setup.assessmentName || draft.assessmentName || 'Untitled Draft Assessment',
        academicYear: setup.academicYear || draft.academicYear || '',
        examCategory: setup.examCategory || draft.examCategory || '',
        course: setup.course || draft.course || '',
        year: setup.year || draft.year || '',
        questionCount: nextQuestions.length,
        totalMarks,
        updatedAt: new Date().toISOString(),
      }
      const drafts = readAssessmentDrafts()
      window.localStorage.setItem(ASSESSMENT_DRAFTS_STORAGE_KEY, JSON.stringify([
        nextDraft,
        ...drafts.filter((item) => item.id !== nextDraft.id),
      ]))
    }

    resetAssessmentSelection()
    onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
  }

  const addSelectedQuestionsToDraftAssessment = (draft) => {
    if (!draft?.setup) return
    persistSelectedQuestionsToAssessment(draft.setup, draft)
  }

  const addSelectedQuestionsToNewAssessment = () => {
    const now = Date.now()
    persistSelectedQuestionsToAssessment({
      ...DEFAULT_ASSESSMENT_SETUP,
      assessmentId: `assessment-${now}`,
      assessmentName: `Assessment ${new Date(now).toLocaleDateString('en-IN')}`,
      createdAt: new Date(now).toISOString(),
    })
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
      {getQuestionMarksTotal(question) > 0 ? (
        <span className="assessment-page-table-value-pill assessment-page-marks-badge">
          {getQuestionMarksTotal(question)}M
        </span>
      ) : null}
      {question.difficultyLevel ? <span className="assessment-page-table-value-pill assessment-page-difficulty-badge">{question.difficultyLevel}</span> : null}
      {question.thinkingLevel ? <span className={`assessment-page-table-value-pill ${getThinkingBadgeClassName(question.thinkingLevel)}`}>{getThinkingLevelLabel(question.thinkingLevel)}</span> : null}
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
    setSelectionBarPosition(null)
    setIsEmbeddedSelectionBarClosed(false)
    setIsEmbeddedSelectionBarVisible(false)
    setAssessmentChooserOpen(false)
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
    const activeFilters = showMetricsLanding ? landingFilters : filters
    const selectedValues = activeFilters[filterKey]
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
                <button type="button" onClick={() => updateActiveFilters((current) => ({ ...current, [filterKey]: [] }))}>
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
        {showMetricsLanding ? (
          <section className="question-bank-metrics-landing" aria-label="Question bank metrics overview">
            <div className="question-bank-metrics-filter-card" aria-label="Question bank metric filters">
              <span className="question-bank-metrics-filter-copy">
                <strong>Question Bank</strong>
              </span>
              <span className="question-bank-metrics-filter-controls">
                {landingFilterDefinitions.map(renderFilterDropdown)}
              </span>
              <span className="question-bank-metrics-actions">
                <button type="button" className="is-secondary" onClick={applyLandingFilters}>
                  Set Default
                </button>
                <button type="button" onClick={viewAllQuestions} disabled={!publishedQuestions.length}>
                  View all
                </button>
              </span>
            </div>

            {hasSelectedFilters(landingFilters) ? (
              <div className="assessment-page-active-filters question-bank-metrics-active-filters">
                {['years', 'subjects', 'topics', 'competencies'].flatMap((filterKey) => (
                  (landingFilters[filterKey] ?? []).map((value) => (
                    <button key={`${filterKey}-${value}`} type="button" onClick={() => clearFilterValue(filterKey, value)}>
                      {filterKey === 'competencies' ? getCompetencyCode(value) : value}
                      <X size={12} strokeWidth={2.4} />
                    </button>
                  ))
                ))}
                <button
                  type="button"
                  className="assessment-page-active-filters-clear"
                  onClick={clearLandingFilters}
                >
                  Clear all
                </button>
              </div>
            ) : null}

            <div className="question-bank-overview-grid">
              <article className="question-bank-overview-card is-ownership">
                <div>
                  <strong className="question-bank-overview-total">{formatMetricCount(questionMetricByKey.total?.value)}</strong>
                  <span>Total Question</span>
                </div>
                <div className="question-bank-ownership-splits">
                  <span>
                    <img src={medsyIcon} alt="" aria-hidden="true" />
                    <strong>{formatMetricCount(questionMetricByKey.medsy?.value)}</strong>
                    <em>Medsy.ai</em>
                  </span>
                  <span>
                    <ListChecks size={16} strokeWidth={2.2} />
                    <strong>{formatMetricCount(questionMetricByKey.created?.value)}</strong>
                    <em>Institute/College</em>
                  </span>
                </div>
              </article>

              <article className="question-bank-overview-card is-types">
                <strong className="question-bank-overview-title">Question types</strong>
                <div className="question-bank-type-pie-layout">
                  <span
                    className="question-bank-type-pie"
                    style={{ '--question-type-pie': questionTypeDonut.gradient }}
                    aria-label={`Question types total ${formatMetricCount(questionTypeDonut.total)}`}
                    onMouseLeave={() => setMetricTooltip(null)}
                  >
                    {questionTypeDonut.segments.map((segment, segmentIndex) => (
                      <span
                        key={segment.label}
                        className={`question-bank-type-pie-label is-label-${segmentIndex}`}
                        onMouseEnter={() => setMetricTooltip({ key: 'types', ...segment })}
                        onFocus={() => setMetricTooltip({ key: 'types', ...segment })}
                        onBlur={() => setMetricTooltip(null)}
                        tabIndex="0"
                      >
                        <span className="sr-only">{`${segment.label}: ${formatMetricCount(segment.count)}`}</span>
                      </span>
                    ))}
                    <span className="question-bank-type-pie-total">
                      <strong>{formatMetricCount(questionTypeDonut.total)}</strong>
                      <em>Total</em>
                    </span>
                    {metricTooltip?.key === 'types' ? (
                      <span className="question-bank-chart-tooltip" role="tooltip">
                        <i style={{ background: metricTooltip.color }} />
                        <span>{metricTooltip.label}</span>
                        <strong>{formatMetricCount(metricTooltip.count)}</strong>
                      </span>
                    ) : null}
                  </span>
                  <span className="question-bank-type-pie-labels" aria-label="Question type labels">
                    {questionTypeLabelItems.map((segment) => (
                      <span key={segment.label}>
                        <i style={{ background: segment.color }} />
                        <em>{segment.label}</em>
                      </span>
                    ))}
                  </span>
                </div>
              </article>

              <article className="question-bank-overview-card is-category">
                <strong className="question-bank-overview-title">Question category</strong>
                <span className="question-bank-overview-icon" aria-hidden="true">
                  <Tags size={17} strokeWidth={2.2} />
                </span>
                <strong className="question-bank-overview-total">{formatMetricCount(questionMetricByKey.categories?.value)}</strong>
                <span className="question-bank-overview-list is-plain">
                  {(questionMetricByKey.categories?.donut?.segments ?? []).map((segment) => (
                    <span key={segment.label}>
                      <i style={{ background: segment.color }} />
                      <strong>{formatMetricCount(segment.count)}</strong>
                      <em>{segment.label}</em>
                    </span>
                  ))}
                </span>
              </article>

              <article className="question-bank-overview-card is-difficulty">
                <strong className="question-bank-overview-title">Difficulty level</strong>
                <span className="question-bank-overview-icon" aria-hidden="true">
                  <Gauge size={17} strokeWidth={2.2} />
                </span>
                <strong className="question-bank-overview-total">{formatMetricCount(questionMetricByKey.difficulty?.value)}</strong>
                <span className="question-bank-level-tiles">
                  {(questionMetricByKey.difficulty?.splits ?? []).map((split, splitIndex) => (
                    <span key={split.label} style={{ '--metric-split-color': getSplitColor('difficulty', splitIndex) }}>
                      <strong>{formatMetricCount(split.count)}</strong>
                      <em>{split.label}</em>
                    </span>
                  ))}
                </span>
              </article>

              {(questionMetricByKey.thinking?.splits ?? []).map((split, splitIndex) => (
                <article key={split.label} className={`question-bank-overview-card is-thinking-mini is-thinking-${splitIndex}`}>
                  <strong className="question-bank-overview-title">Thinking level</strong>
                  <span className="question-bank-overview-icon" aria-hidden="true">
                    <Brain size={17} strokeWidth={2.2} />
                  </span>
                  <strong className="question-bank-overview-total">{formatMetricCount(split.count)}</strong>
                  <span>{split.label}</span>
                </article>
              ))}

            </div>

            <div className="question-bank-metrics-grid">
              {visibleQuestionMetrics.map((metric) => {
                const Icon = metric.icon
                const isEmpty = !metric.value

                if (metric.key === 'categories' && metric.donut) {
                  return (
                    <article key={metric.key} className="question-bank-category-chart-card">
                      <strong className="question-bank-category-chart-title">Question category</strong>
                      <span className="question-bank-metric-donut" aria-label={`${metric.label} distribution`}>
                        <span className="question-bank-metric-donut-ring" aria-label={`${metric.label} chart`}>
                          <svg viewBox="0 0 120 120" focusable="false">
                            <circle className="question-bank-metric-donut-track" cx="60" cy="60" r="45" pathLength="100" />
                            {metric.donut.segments.map((segment) => (
                              <circle
                                key={segment.label}
                                className="question-bank-metric-donut-segment"
                                cx="60"
                                cy="60"
                                r="45"
                                pathLength="100"
                                stroke={segment.color}
                                strokeDasharray={`${Math.max(0, segment.end - segment.start)} ${100 - Math.max(0, segment.end - segment.start)}`}
                                strokeDashoffset={-segment.start}
                                tabIndex="0"
                                onFocus={() => setMetricTooltip({ key: metric.key, ...segment })}
                                onBlur={() => setMetricTooltip(null)}
                                onMouseEnter={() => setMetricTooltip({ key: metric.key, ...segment })}
                                onMouseLeave={() => setMetricTooltip(null)}
                              />
                            ))}
                          </svg>
                          {metricTooltip?.key === metric.key ? (
                            <span className="question-bank-chart-tooltip" role="tooltip">
                              <i style={{ background: metricTooltip.color }} />
                              <span>{metricTooltip.label}</span>
                              <strong>{formatMetricCount(metricTooltip.count)}</strong>
                            </span>
                          ) : null}
                          <strong className={`question-bank-donut-count ${getMetricCountSizeClass(metric.donut.total)}`}>{formatMetricCount(metric.donut.total)}</strong>
                          <span>Total</span>
                        </span>
                        <span className="question-bank-metric-donut-legend">
                          {metric.donut.segments.map((segment) => (
                            <span
                              key={segment.label}
                              style={{
                                '--segment-color': segment.color,
                                '--segment-width': `${metric.donut.total ? Math.max(8, Math.round((segment.count / metric.donut.total) * 100)) : 0}%`,
                              }}
                            >
                              <i style={{ background: segment.color }} />
                              <span>{segment.label}</span>
                              <strong>{formatMetricCount(segment.count)}</strong>
                            </span>
                          ))}
                        </span>
                      </span>
                    </article>
                  )
                }

                if (metric.key === 'descriptive' && metric.donut) {
                  return (
                    <article key={metric.key} className="question-bank-metric-card is-type is-descriptive has-splits">
                      <strong className="question-bank-mini-chart-title">Descriptive question</strong>
                      <span className="question-bank-descriptive-donut-wrap">
                        <span className="question-bank-metric-gauge-ring" aria-label={`${metric.label} chart`}>
                          <svg viewBox="0 0 160 100" focusable="false">
                            <path className="question-bank-metric-gauge-track" d="M 20 82 A 60 60 0 0 1 140 82" pathLength="100" />
                            {metric.donut.segments.map((segment) => (
                              <path
                                key={segment.label}
                                className="question-bank-metric-gauge-segment"
                                d="M 20 82 A 60 60 0 0 1 140 82"
                                pathLength="100"
                                stroke={segment.color}
                                strokeDasharray={`${Math.max(0, segment.end - segment.start)} ${100 - Math.max(0, segment.end - segment.start)}`}
                                strokeDashoffset={-segment.start}
                                tabIndex="0"
                                onFocus={() => setMetricTooltip({ key: metric.key, ...segment })}
                                onBlur={() => setMetricTooltip(null)}
                                onMouseEnter={() => setMetricTooltip({ key: metric.key, ...segment })}
                                onMouseLeave={() => setMetricTooltip(null)}
                              />
                            ))}
                          </svg>
                          {metricTooltip?.key === metric.key ? (
                            <span className="question-bank-chart-tooltip" role="tooltip">
                              <i style={{ background: metricTooltip.color }} />
                              <span>{metricTooltip.label}</span>
                              <strong>{formatMetricCount(metricTooltip.count)}</strong>
                            </span>
                          ) : null}
                          <strong className={`question-bank-gauge-count ${getMetricCountSizeClass(metric.value)}`}>{formatMetricCount(metric.value)}</strong>
                          <span>Total Descriptive</span>
                        </span>
                      </span>
                    </article>
                  )
                }

                return (
                  <article
                    key={metric.key}
                    className={`question-bank-metric-card is-${metric.tone} is-${metric.key} ${metric.splits?.length ? 'has-splits' : ''} ${isEmpty ? 'is-empty' : ''}`}
                  >
                    <span className="question-bank-metric-card-head">
                      <span className="question-bank-metric-card-icon" aria-hidden="true">
                        {metric.key === 'medsy' ? (
                          <img className="question-bank-metric-logo" src={medsyIcon} alt="" aria-hidden="true" />
                        ) : (
                          <Icon size={17} strokeWidth={2.2} />
                        )}
                      </span>
                      <span>
                        <strong title={formatMetricCount(metric.value)}>{formatMetricCount(metric.value)}</strong>
                        <span>{metric.label}</span>
                      </span>
                    </span>
                    {metric.splits?.length ? (
                      <span className="question-bank-metric-splits" aria-label={`${metric.label} split counts`}>
                        {metric.splits.map((split, splitIndex) => (
                          <span
                            key={split.label}
                            style={{
                              '--metric-split-color': getSplitColor(metric.key, splitIndex),
                              '--metric-split-width': `${metric.value ? Math.max(8, Math.round((split.count / metric.value) * 100)) : 0}%`,
                            }}
                            title={`${split.label}: ${formatMetricCount(split.count)}`}
                          >
                            <strong>{split.label}</strong>
                            <em>{formatMetricCount(split.count)}</em>
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </article>
                )
              })}
            </div>

          </section>
        ) : (
          <section className="assessment-page-metrics-strip" aria-label="Question bank metrics">
            {visibleQuestionListSummaryMetrics.map((metric) => {
              const Icon = metric.icon
              const isActive = activeMetric === (metric.activeMetricKey ?? metric.key)

              return (
                <button
                  key={metric.key}
                  type="button"
                  className={`is-${metric.tone} ${isActive ? 'is-active' : ''}`}
                  onClick={() => {
                    if (!metric.value) return
                    openQuestionList(metric)
                  }}
                  disabled={!metric.value}
                  aria-pressed={isActive}
                >
                  <span className="assessment-page-metric-icon" aria-hidden="true">
                    {metric.key === 'medsy' ? (
                      <img className="assessment-page-metric-logo" src={medsyIcon} alt="" aria-hidden="true" />
                    ) : (
                      <Icon size={15} strokeWidth={2.2} />
                    )}
                  </span>
                  <span className="assessment-page-metric-copy">
                    <strong title={formatMetricCount(metric.value)}>{formatMetricCount(metric.value)}</strong>
                    <span>{metric.label}</span>
                  </span>
                </button>
              )
            })}
          </section>
        )}

        {publishedQuestions.length && !showMetricsLanding ? (
          <section
            ref={filterHeaderRef}
            className={`assessment-page-bank-controls ${activeView === 'grid' ? 'is-grid-attached' : ''} ${isFilterHeaderCompact ? 'is-compact' : ''} ${isCompactFilterTrayOpen ? 'is-filter-tray-open' : ''}`}
            aria-label="All question bank controls"
          >
            <div className="assessment-page-filter-strip" aria-label="Question filters">
              <span className="assessment-page-filter-controls">
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
                        {!embedded ? (
                          <button
                            type="button"
                            className="assessment-page-more-filter-default-btn"
                            onClick={backToMetrics}
                          >
                            <BarChart3 size={14} strokeWidth={2.3} />
                            Set as Default
                          </button>
                        ) : null}
                      </span>,
                      document.body,
                    ) : null}
                  </span>
                ) : null}
              </span>
              <span className="assessment-page-grid-action-controls" role="group" aria-label="Question bank actions">
                {isEditable ? (
                  <>
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
                  </>
                ) : null}
              </span>
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

        {pagedQuestions.length && activeView === 'card' && !showMetricsLanding ? (
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
              const descriptiveAnswerItems = isDescriptive ? getDescriptiveAnswerItems(question, descriptiveSections) : []

              return (
                <article key={questionId} className={`assessment-page-question-card ${isCardOpen ? 'is-open' : 'is-closed'}`}>
                  <div className="assessment-page-question-head">
                    <span className="assessment-page-question-type">{getQuestionTypeLabel(question)}</span>
                    {renderSourceBadge(question, 'assessment-page-question-author')}
                    {question.thinkingLevel ? <span className={getThinkingBadgeClassName(question.thinkingLevel)}>{getThinkingLevelLabel(question.thinkingLevel)}</span> : null}
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
                                {!(section.children ?? []).length && Number(section.marks ?? 0) > 0 ? <em>{section.marks} marks</em> : null}
                              </div>
                              {(section.children ?? []).map((child, childIndex) => (
                                <Fragment key={child.id ?? `${section.id}-child-${childIndex}`}>
                                  <div className="assessment-page-descriptive-line is-child">
                                    <strong>{String.fromCharCode(97 + childIndex)}.</strong>
                                    <span>{stripHtml(child.questionText) || 'Question not added'}</span>
                                    {Number(child.marks ?? 0) > 0 ? <em>{child.marks} marks</em> : null}
                                  </div>
                                </Fragment>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {isDescriptive && descriptiveAnswerItems.length ? (
                        <div className="assessment-page-question-answer assessment-page-descriptive-answer-list">
                          <strong>Answer &amp; Explanation</strong>
                          <span>
                            {descriptiveAnswerItems.map((answerItem) => (
                              <span key={answerItem.key} className="assessment-page-descriptive-answer-row">
                                <b>{answerItem.label}</b>
                                <span>{answerItem.text}</span>
                              </span>
                            ))}
                          </span>
                        </div>
                      ) : null}
                      {(!isDescriptive || !descriptiveSections.length) && stripHtml(question.answerKey) ? (
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

        {pagedQuestions.length && activeView === 'grid' && !showMetricsLanding ? (
          <section className="assessment-page-table-wrap" aria-label="Sent question bank table">
            <div className="assessment-page-grid-scroll">
              <table className="assessment-page-question-table assessment-page-grid-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Question</th>
                    <th>Tags</th>
                    <th aria-label="Actions"></th>
                    {hasEmbeddedAssessmentSelection ? <th aria-label="Select questions"></th> : null}
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
                  const descriptiveAnswerItems = isDescriptive ? getDescriptiveAnswerItems(question, descriptiveSections) : []

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
                          {hasEmbeddedAssessmentSelection ? (
                            <td className="assessment-page-grid-select-cell">
                              <label className="assessment-page-grid-row-checkbox" onClick={(event) => event.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isGridQuestionSelected}
                                  onChange={() => toggleGridQuestionSelection(questionId)}
                                  aria-label={`Select question ${questionNumber}`}
                                />
                              </label>
                            </td>
                          ) : null}
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
                          <td colSpan={hasEmbeddedAssessmentSelection ? 5 : 4}>
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
                                {hasEmbeddedAssessmentSelection ? (
                                  <label className="assessment-page-grid-row-checkbox is-detail-select" onClick={(event) => event.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isGridQuestionSelected}
                                      onChange={() => toggleGridQuestionSelection(questionId)}
                                      aria-label={`Select question ${questionNumber}`}
                                    />
                                  </label>
                                ) : null}
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
                                          {!(section.children ?? []).length && Number(section.marks ?? 0) > 0 ? <em>{section.marks} marks</em> : null}
                                        </div>
                                        {(section.children ?? []).map((child, childIndex) => (
                                          <Fragment key={child.id ?? `${section.id}-table-child-${childIndex}`}>
                                            <div className="assessment-page-descriptive-line is-child">
                                              <strong>{String.fromCharCode(97 + childIndex)}.</strong>
                                              <span>{stripHtml(child.questionText) || 'Question not added'}</span>
                                              {Number(child.marks ?? 0) > 0 ? <em>{child.marks} marks</em> : null}
                                            </div>
                                          </Fragment>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              {isDescriptive && descriptiveAnswerItems.length ? (
                                <div className="assessment-page-table-inline-section assessment-page-descriptive-answer-list">
                                  <strong>Answer &amp; Explanation</strong>
                                  <span>
                                    {descriptiveAnswerItems.map((answerItem) => (
                                      <span key={answerItem.key} className="assessment-page-descriptive-answer-row">
                                        <b>{answerItem.label}</b>
                                        <span>{answerItem.text}</span>
                                      </span>
                                    ))}
                                  </span>
                                </div>
                              ) : null}
                              {(!isDescriptive || !descriptiveSections.length) && stripHtml(question.answerKey) ? (
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

        {(isEditable && selectedGridAction) || (hasEmbeddedAssessmentSelection && isEmbeddedSelectionBarVisible && !isEmbeddedSelectionBarClosed) ? (
          <section
            ref={selectionBarRef}
            className={`assessment-page-selection-bar ${hasEmbeddedAssessmentSelection ? 'is-assessment-picker' : ''}`}
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
              {hasEmbeddedAssessmentSelection
                ? `question${selectedGridQuestionIds.length === 1 ? '' : 's'} selected`
                : `selected for ${selectedGridAction === 'assessment' ? 'Assessment' : 'Learn'}`}
            </span>
            <div className="assessment-page-selection-bar-actions">
              <button type="button" className="is-clear" onClick={() => setSelectedGridQuestionIds([])}>
                Clear
              </button>
              {hasEmbeddedAssessmentSelection || selectedGridAction === 'assessment' ? (
                <>
                  <button
                    type="button"
                    className="is-primary"
                    onClick={hasEmbeddedAssessmentSelection ? addSelectedQuestionsToEmbeddedAssessment : openAssessmentChooser}
                    disabled={!selectedGridQuestionIds.length}
                    aria-expanded={!hasEmbeddedAssessmentSelection && assessmentChooserOpen}
                  >
                    Add to Assessment
                  </button>
                  {!hasEmbeddedAssessmentSelection && assessmentChooserOpen ? (
                    <span
                      className="assessment-page-add-assessment-popover"
                      role="tooltip"
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <strong>Add to Assessment</strong>
                      <button type="button" onClick={addSelectedQuestionsToNewAssessment}>
                        <Plus size={14} strokeWidth={2.4} />
                        <span>Create New Assessment</span>
                      </button>
                      {draftAssessmentOptions.length ? (
                        <span className="assessment-page-add-assessment-drafts">
                          <small>Draft assessment</small>
                          {draftAssessmentOptions.map((draft) => (
                            <button
                              key={draft.id}
                              type="button"
                              onClick={() => addSelectedQuestionsToDraftAssessment(draft)}
                            >
                              <ClipboardList size={14} strokeWidth={2.3} />
                              <span>{draft.assessmentName || draft.setup?.assessmentName || 'Untitled Draft Assessment'}</span>
                            </button>
                          ))}
                        </span>
                      ) : null}
                    </span>
                    ) : null}
                </>
              ) : null}
              <button
                type="button"
                className="is-icon-only"
                onClick={hasEmbeddedAssessmentSelection ? () => setIsEmbeddedSelectionBarClosed(true) : clearGridActionState}
                aria-label="Close selection card"
                title="Close"
              >
                <X size={15} strokeWidth={2.4} />
              </button>
            </div>
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

        {publishedQuestions.length && !pagedQuestions.length && !showMetricsLanding ? (
          <section className="assessment-page-empty">
            <Info size={18} strokeWidth={2.2} />
            <strong>No matching questions</strong>
            <p>Try changing the search text, source, or author filter.</p>
          </section>
        ) : null}

        {!publishedQuestions.length && !showMetricsLanding ? (
          <section className="assessment-page-empty">
            <Info size={18} strokeWidth={2.2} />
            <strong>No sent questions yet</strong>
            <p>Approved questions sent to Question Bank will appear here.</p>
          </section>
        ) : null}

        {!embedded && showDashboardWelcomeToast ? (
          <aside className="question-bank-dashboard-toast" role="status" aria-live="polite">
            <span className="question-bank-dashboard-toast-accent" aria-hidden="true" />
            <span className="question-bank-dashboard-toast-icon" aria-hidden="true">
              <Info size={22} strokeWidth={2.5} />
            </span>
            <span className="question-bank-dashboard-toast-copy">
              <strong>Welcome to your Question Bank Dashboard!</strong>
              <span>Track total questions, analyze difficulty levels, and filter by subject or topic in one place.</span>
            </span>
            <span className="question-bank-dashboard-toast-actions">
              <button type="button" className="is-secondary" onClick={dismissDashboardWelcomePermanently}>
                Don't show again
              </button>
              <button type="button" onClick={closeDashboardWelcomeToast}>
                Close
              </button>
            </span>
            <button
              type="button"
              className="question-bank-dashboard-toast-close"
              onClick={closeDashboardWelcomeToast}
              aria-label="Close welcome message"
            >
              <X size={22} strokeWidth={2.2} />
            </button>
          </aside>
        ) : null}
      </div>
    </section>
  )
}
