import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardList, FileSearch, Flag, Filter, Info, LayoutGrid, ListChecks, Pencil, Plus, Search, Sparkles, Star, X } from 'lucide-react'
import { stripHtml } from '../utils/mathText'
import '../styles/assessment-pages.css'

const QUESTION_BANK_PUBLISHED_KEY = 'vx-question-bank-published-questions'
const QUESTION_BANK_UPLOADED_KEY = 'vx-question-bank-uploaded-questions'
const QUESTION_BANK_STORAGE_KEY = 'vx-question-bank-questions'
const QUESTION_BANK_FAVORITE_STORAGE_KEYS = [QUESTION_BANK_PUBLISHED_KEY, QUESTION_BANK_UPLOADED_KEY, QUESTION_BANK_STORAGE_KEY]
const OLD_DEFAULT_ANSWER_TEXT = 'Correct answer: Review the selected option and add the supporting rationale.'
const CURRENT_DEFAULT_ANSWER_TEXT = 'Add the correct option and explanation.'

const getQuestionPreview = (question) => stripHtml(question?.questionText) || question?.title || 'Untitled question'
const getCompetencyCode = (value) => String(value ?? '').trim().split(/\s+/)[0] || value

const MEDSY_EXTRA_SAMPLE_QUESTIONS = [
  ['Which muscle initiates abduction of the shoulder joint?', 'Supraspinatus', 'Deltoid', 'Teres minor', 'Infraspinatus', 'Upper Limb', 'AN1.5 Describe muscles and movements of upper limb', 'Musculoskeletal', 'Shoulder', 'Supraspinatus initiates the first 15 degrees of shoulder abduction.'],
  ['Which nerve is most commonly injured in surgical neck fracture of humerus?', 'Axillary nerve', 'Radial nerve', 'Median nerve', 'Ulnar nerve', 'Upper Limb', 'AN1.5 Describe muscles and movements of upper limb', 'Nervous', 'Peripheral nerve', 'The axillary nerve winds around the surgical neck of the humerus and is vulnerable in fractures.'],
  ['Which artery is palpated in the anatomical snuffbox?', 'Radial artery', 'Ulnar artery', 'Brachial artery', 'Anterior interosseous artery', 'Upper Limb', 'AN1.5 Describe muscles and movements of upper limb', 'Cardiovascular', 'Blood vessel', 'The radial artery passes through the anatomical snuffbox and can be palpated there.'],
  ['Which carpal bone is most commonly fractured after a fall on the outstretched hand?', 'Scaphoid', 'Lunate', 'Triquetrum', 'Pisiform', 'Upper Limb', 'AN1.5 Describe muscles and movements of upper limb', 'Skeletal', 'Bone', 'The scaphoid is the most commonly fractured carpal bone in a fall on an outstretched hand.'],
  ['Which nerve supplies the diaphragm motor function?', 'Phrenic nerve', 'Vagus nerve', 'Intercostal nerve', 'Accessory nerve', 'Thorax', 'AN2.3 Explain mediastinal relations and surface anatomy', 'Respiratory', 'Diaphragm', 'The phrenic nerve provides motor supply to the diaphragm.'],
  ['Which valve is best heard at the left fifth intercostal space in the midclavicular line?', 'Mitral valve', 'Aortic valve', 'Pulmonary valve', 'Tricuspid valve', 'Thorax', 'AN2.3 Explain mediastinal relations and surface anatomy', 'Cardiovascular', 'Heart', 'The mitral valve area is located at the cardiac apex in the left fifth intercostal space.'],
  ['Which structure forms the anterior boundary of the epiploic foramen?', 'Free edge of lesser omentum', 'Inferior vena cava', 'Caudate lobe', 'First part of duodenum', 'General Anatomy', 'AN1.1 Describe anatomical position and planes', 'Digestive', 'Upper GI', 'The free edge of the lesser omentum containing the portal triad forms the anterior boundary.'],
  ['Which cranial nerve carries taste from the anterior two-thirds of the tongue?', 'Facial nerve', 'Glossopharyngeal nerve', 'Trigeminal nerve', 'Vagus nerve', 'Neuroanatomy', 'AN4.2 Identify major cranial nerve pathways', 'Nervous', 'Cranial nerve', 'Taste from the anterior two-thirds of the tongue is carried by the facial nerve via chorda tympani.'],
  ['Which cranial nerve exits the skull through the jugular foramen?', 'Glossopharyngeal nerve', 'Optic nerve', 'Mandibular nerve', 'Facial nerve', 'Neuroanatomy', 'AN4.2 Identify major cranial nerve pathways', 'Nervous', 'Cranial nerve', 'The glossopharyngeal nerve exits through the jugular foramen.'],
  ['Which lobe of the brain contains the primary visual cortex?', 'Occipital lobe', 'Frontal lobe', 'Parietal lobe', 'Temporal lobe', 'Neuroanatomy', 'AN4.2 Identify major cranial nerve pathways', 'Nervous', 'Brain', 'The primary visual cortex is located in the occipital lobe.'],
  ['Which cell type produces surfactant in the alveoli?', 'Type II pneumocyte', 'Type I pneumocyte', 'Alveolar macrophage', 'Club cell', 'Respiratory System', 'PY6.8 Interpret spirometry and lung volumes', 'Respiratory', 'Lung', 'Type II pneumocytes synthesize and secrete pulmonary surfactant.'],
  ['Which lung volume cannot be measured by simple spirometry?', 'Residual volume', 'Tidal volume', 'Inspiratory reserve volume', 'Expiratory reserve volume', 'Respiratory System', 'PY6.8 Interpret spirometry and lung volumes', 'Respiratory', 'Lung', 'Residual volume cannot be directly measured by simple spirometry.'],
  ['Which blood cell is primarily responsible for oxygen transport?', 'Erythrocyte', 'Neutrophil', 'Platelet', 'Lymphocyte', 'Hematology', 'PY2.11 Interpret complete blood count findings', 'Cardiovascular', 'Blood', 'Erythrocytes transport oxygen through hemoglobin.'],
  ['Which leukocyte increases most typically in acute bacterial infection?', 'Neutrophil', 'Eosinophil', 'Basophil', 'Monocyte', 'Hematology', 'PY2.11 Interpret complete blood count findings', 'Immune', 'Blood', 'Neutrophilia is commonly associated with acute bacterial infection.'],
  ['Which anemia shows macrocytic red blood cells?', 'Vitamin B12 deficiency anemia', 'Iron deficiency anemia', 'Thalassemia', 'Anemia of chronic disease', 'Hematology', 'PA3.4 Classify anemia using peripheral smear findings', 'Cardiovascular', 'Blood', 'Vitamin B12 deficiency commonly causes megaloblastic macrocytic anemia.'],
  ['Which process describes programmed cell death?', 'Apoptosis', 'Necrosis', 'Metaplasia', 'Hypertrophy', 'General Pathology', 'PA1.2 Explain cell injury and adaptation', 'General pathology', 'Cell injury', 'Apoptosis is programmed cell death with controlled cellular dismantling.'],
  ['Which cellular adaptation is seen in increased workload without new cell formation?', 'Hypertrophy', 'Hyperplasia', 'Metaplasia', 'Dysplasia', 'General Pathology', 'PA1.2 Explain cell injury and adaptation', 'General pathology', 'Cell adaptation', 'Hypertrophy is an increase in cell size due to increased workload.'],
  ['Which necrosis is classically seen in tuberculosis?', 'Caseous necrosis', 'Coagulative necrosis', 'Liquefactive necrosis', 'Fat necrosis', 'General Pathology', 'PA1.2 Explain cell injury and adaptation', 'General pathology', 'Necrosis', 'Caseous necrosis is classically associated with tuberculosis.'],
  ['Which investigation is most useful for assessing cardiac rhythm?', 'Electrocardiogram', 'Chest X-ray', 'Spirometry', 'Ultrasound abdomen', 'Cardiovascular System', 'PY4.5 Explain regulation of cardiac output', 'Cardiovascular', 'Heart', 'An electrocardiogram records electrical activity and rhythm of the heart.'],
  ['Which chamber of the heart receives oxygenated blood from the lungs?', 'Left atrium', 'Right atrium', 'Left ventricle', 'Right ventricle', 'Cardiovascular System', 'PY4.5 Explain regulation of cardiac output', 'Cardiovascular', 'Heart', 'The left atrium receives oxygenated blood from pulmonary veins.'],
  ['Which hormone increases blood calcium levels?', 'Parathyroid hormone', 'Insulin', 'Calcitonin', 'Aldosterone', 'General Physiology', 'PY1.4 Describe body fluid compartments and homeostasis', 'Endocrine', 'Calcium homeostasis', 'Parathyroid hormone increases blood calcium levels.'],
  ['Which compartment contains the largest percentage of total body water?', 'Intracellular fluid', 'Plasma', 'Interstitial fluid', 'Transcellular fluid', 'General Physiology', 'PY1.4 Describe body fluid compartments and homeostasis', 'General physiology', 'Body fluids', 'Intracellular fluid is the largest body water compartment.'],
  ['Which joint is a ball-and-socket type?', 'Hip joint', 'Elbow joint', 'Superior radioulnar joint', 'Interphalangeal joint', 'General Anatomy', 'AN1.1 Describe anatomical position and planes', 'Skeletal', 'Joint', 'The hip joint is a multiaxial ball-and-socket synovial joint.'],
  ['Which anatomical term means closer to the midline?', 'Medial', 'Lateral', 'Proximal', 'Distal', 'General Anatomy', 'AN1.1 Describe anatomical position and planes', 'General anatomy', 'Directional terms', 'Medial means nearer to the median plane or midline.'],
  ['Which term describes movement away from the midline?', 'Abduction', 'Adduction', 'Flexion', 'Extension', 'General Anatomy', 'AN1.1 Describe anatomical position and planes', 'Musculoskeletal', 'Movement', 'Abduction is movement away from the midline.'],
]

const createMedsyExtraSampleQuestions = () => MEDSY_EXTRA_SAMPLE_QUESTIONS.map(([
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
  const questionNumber = index + 4
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
    questionBankSentAt: new Date(`2026-05-22T10:${String(index).padStart(2, '0')}:00+05:30`).toISOString(),
  }
})

const createMedsySampleQuestions = () => [
  {
    id: 'medsy-uploaded-sample-1',
    type: 'MCQ',
    authorName: 'Medsy',
    questionText: 'Which structure passes through the optic canal along with the ophthalmic artery?',
    year: 'Year 1',
    subject: 'Human Anatomy',
    topics: ['General Anatomy'],
    competencies: ['AN1.1 Describe anatomical position and planes'],
    questionCategory: 'Direct',
    cognitiveLevel: 'Recall',
    cognitiveFunction: 'Pattern Recognition',
    skillFocus: 'Identification',
    organSystem: 'Nervous',
    organSubSystems: ['Optic pathway'],
    diseaseTags: ['Optic canal lesion'],
    keyConcepts: ['Anatomical foramen', 'Neurovascular relation'],
    thinkingLevel: 'LoT',
    difficultyLevel: 'L1',
    options: [
      { id: 'medsy-1-a', label: 'Optic nerve', distractorErrors: [] },
      { id: 'medsy-1-b', label: 'Oculomotor nerve', distractorErrors: ['Localization/Structural Error'] },
      { id: 'medsy-1-c', label: 'Trochlear nerve', distractorErrors: ['False Association'] },
      { id: 'medsy-1-d', label: 'Abducens nerve', distractorErrors: ['Misclassification'] },
    ],
    correctOptionIds: ['medsy-1-a'],
    answerKey: 'Optic nerve passes through the optic canal with the ophthalmic artery.',
    questionBankSentAt: new Date('2026-05-22T09:00:00+05:30').toISOString(),
  },
  {
    id: 'medsy-uploaded-sample-2',
    type: 'MCQ',
    authorName: 'Medsy',
    questionText: 'Which plane divides the body into superior and inferior parts?',
    year: 'Year 1',
    subject: 'Human Anatomy',
    topics: ['General Anatomy'],
    competencies: ['AN1.1 Describe anatomical position and planes'],
    questionCategory: 'Application',
    cognitiveLevel: 'Apply',
    cognitiveFunction: 'Spatial Orientation',
    skillFocus: 'Anatomical planes',
    organSystem: 'General anatomy',
    organSubSystems: ['Body planes'],
    diseaseTags: ['Not Applicable'],
    keyConcepts: ['Sectional anatomy', 'Clinical orientation'],
    thinkingLevel: 'HoT',
    difficultyLevel: 'L2',
    options: [
      { id: 'medsy-2-a', label: 'Sagittal plane', distractorErrors: ['Terminology Confusion'] },
      { id: 'medsy-2-b', label: 'Coronal plane', distractorErrors: ['Spatial Relationship Error'] },
      { id: 'medsy-2-c', label: 'Transverse plane', distractorErrors: [] },
      { id: 'medsy-2-d', label: 'Median plane', distractorErrors: ['Misclassification'] },
    ],
    correctOptionIds: ['medsy-2-c'],
    answerKey: 'The transverse plane divides the body into superior and inferior parts.',
    questionBankSentAt: new Date('2026-05-22T09:05:00+05:30').toISOString(),
  },
  {
    id: 'medsy-uploaded-sample-3',
    type: 'Descriptive',
    authorName: 'Medsy',
    questionText: 'Define anatomical position and mention two key features used to describe it.',
    year: 'Year 1',
    subject: 'Human Anatomy',
    topics: ['General Anatomy'],
    competencies: ['AN1.1 Describe anatomical position and planes'],
    questionCategory: 'Reasoning',
    cognitiveLevel: 'Understand',
    cognitiveFunction: 'Concept Recall',
    skillFocus: 'Definition',
    organSystem: 'General anatomy',
    organSubSystems: ['Anatomical terminology'],
    diseaseTags: ['Not Applicable'],
    keyConcepts: ['Reference position', 'Directional terms'],
    thinkingLevel: 'LoT',
    difficultyLevel: 'L1',
    options: [],
    correctOptionIds: [],
    answerKey: 'Anatomical position is the standard reference position with the body standing upright, face forward, upper limbs by the side, and palms facing forward.',
    questionBankSentAt: new Date('2026-05-22T09:10:00+05:30').toISOString(),
  },
  ...createMedsyExtraSampleQuestions(),
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
          const refreshedUploaded = existingUploaded.map((question) => {
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

const isMedsyQuestion = (question) => getQuestionAuthorName(question).trim().toLowerCase() === 'medsy'

const isApprovedQuestion = (question) => (
  question?.status === 'Approved'
  || Boolean(question?.questionBankSentAt)
  || question?.questionBankStatus === 'Sent to Question Bank'
)

const isAllQuestionBankQuestion = (question) => isMedsyQuestion(question) || isApprovedQuestion(question)

const isFavoriteQuestion = (question) => Boolean(question?.isFavorite || question?.isFavourite)

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

  ;[
    ...readStoredQuestionList(QUESTION_BANK_PUBLISHED_KEY),
    ...readStoredQuestionList(QUESTION_BANK_UPLOADED_KEY),
    ...readApprovedCreatedQuestions(),
  ].forEach((question, index) => {
    questionsById.set(question.id ?? `question-${index}`, question)
  })

  return Array.from(questionsById.values())
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

const getQuestionTypeBadgeClassName = (type) => {
  const normalized = String(type ?? '').trim().toLowerCase()
  if (normalized === 'mcq') return 'is-mcq'
  if (normalized.includes('descriptive')) return 'is-descriptive'
  return ''
}

const getQuestionTypeLabel = (type) => {
  const normalized = String(type ?? '').trim()
  if (normalized.toLowerCase().includes('descriptive')) return 'Desc'
  return normalized || 'Question'
}

const getQuestionSourceType = (question) => (
  getQuestionAuthorName(question).trim().toLowerCase() === 'medsy' ? 'Uploaded' : 'Created'
)

const getAuthorBadgeClassName = (question) => (
  getQuestionSourceType(question) === 'Uploaded' ? 'is-uploaded-author' : 'is-created-author'
)

const getAuthorBadgeInitial = (question) => (
  isMedsyQuestion(question) ? 'M' : 'C'
)

const getAuthorBadgeTooltip = (question) => (
  isMedsyQuestion(question) ? 'Medsy' : getQuestionAuthorName(question)
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

export default function QuestionBankNonCreatePage() {
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

  const metricFilteredQuestions = useMemo(() => (
    publishedQuestions.filter((question) => {
      if (activeMetric === 'medsy') return isMedsyQuestion(question)
      if (activeMetric === 'created') return !isMedsyQuestion(question)
      if (activeMetric === 'favorites') return isFavoriteQuestion(question)
      if (activeMetric === 'suggested') return question.isSuggested || question.questionSource === 'Suggested'
      return true
    })
  ), [activeMetric, publishedQuestions])

  const filterOptions = useMemo(() => ({
    authors: getUniqueValues(metricFilteredQuestions, getQuestionAuthorName),
    types: getUniqueValues(metricFilteredQuestions, (question) => question.type),
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
    types: getValueCounts(metricFilteredQuestions, (question) => question.type),
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
      if (!hasFilterMatch(filters.types, question.type)) return false
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
    { key: 'total', label: 'Total Qus', value: publishedQuestions.length, icon: ClipboardList, tone: 'total' },
    { key: 'medsy', label: 'Medsy Qus', value: publishedQuestions.filter(isMedsyQuestion).length, icon: FileSearch, tone: 'medsy' },
    { key: 'created', label: 'Institution Qus', value: publishedQuestions.filter((question) => !isMedsyQuestion(question)).length, icon: ListChecks, tone: 'created' },
    { key: 'favorites', label: 'Favorites', value: publishedQuestions.filter(isFavoriteQuestion).length, icon: Star, tone: 'favorites' },
    { key: 'suggested', label: 'Suggested Qus', value: publishedQuestions.filter((question) => question.isSuggested || question.questionSource === 'Suggested').length, icon: Sparkles, tone: 'suggested' },
  ]
  const activeMetricLabel = questionMetrics.find((metric) => metric.key === activeMetric)?.label ?? 'questions'
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

  const renderQuestionRowActions = (question, questionId, questionNumber, isTableRowOpen) => {
    const isFavorite = isFavoriteQuestion(question)

    return (
      <span className="assessment-page-grid-row-actions" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="assessment-page-grid-row-action is-icon-only"
          disabled
          title="Edit question"
          aria-label={`Edit question ${questionNumber}`}
        >
          <Pencil size={14} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          className="assessment-page-grid-row-action"
          disabled
          title="Report question"
          aria-label={`Report question ${questionNumber}`}
        >
          <Flag size={14} strokeWidth={2.2} />
          Report
        </button>
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
      <span
        className={`assessment-page-grid-author-label assessment-page-source-badge ${getAuthorBadgeClassName(question)}`}
        title={getAuthorBadgeTooltip(question)}
        aria-label={getAuthorBadgeTooltip(question)}
      >
        {getAuthorBadgeInitial(question)}
      </span>
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
      setPublishedQuestions(readAllQuestionBankQuestions())
    }

    window.addEventListener('storage', syncPublishedQuestions)
    window.addEventListener('question-bank-published-questions', syncPublishedQuestions)
    window.addEventListener('question-bank-uploaded-questions', syncPublishedQuestions)

    return () => {
      window.removeEventListener('storage', syncPublishedQuestions)
      window.removeEventListener('question-bank-published-questions', syncPublishedQuestions)
      window.removeEventListener('question-bank-uploaded-questions', syncPublishedQuestions)
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
    <section className="vx-content assessment-page">
      <div className={`assessment-page-shell ${selectedGridAction ? 'has-selection-bar' : ''}`}>
        <section className="assessment-page-metrics-strip" aria-label="Question bank metrics">
          {questionMetrics.map((metric) => {
            const Icon = metric.icon
            const isActive = activeMetric === metric.key

            return (
              <button
                key={metric.key}
                type="button"
                className={`is-${metric.tone} ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveMetric(metric.key)}
                aria-pressed={isActive}
              >
                <span className="assessment-page-metric-icon" aria-hidden="true">
                  <Icon size={15} strokeWidth={2.2} />
                </span>
                <span>{metric.label}</span>
                <strong title={formatMetricCount(metric.value)}>{formatCompactMetricCount(metric.value)}</strong>
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
                          <span>{group.filters.map(renderFilterDropdown)}</span>
                        </span>
                      ))}
                    </span>,
                    document.body,
                  ) : null}
                </span>
              ) : null}
              <span className="assessment-page-grid-action-controls" role="group" aria-label="Question bank actions">
                <button
                  type="button"
                  className={selectedGridAction === 'assessment' ? 'is-active' : ''}
                  onClick={() => setSelectedGridAction('assessment')}
                  disabled={selectedGridAction === 'learn'}
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
                  disabled={selectedGridAction === 'assessment'}
                >
                  <FileSearch size={14} strokeWidth={2.3} />
                  Assign to Learn
                  {selectedGridAction === 'learn' && selectedGridQuestionIds.length ? (
                    <span className="assessment-page-grid-action-count">{selectedGridQuestionIds.length}</span>
                  ) : null}
                </button>
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

              return (
                <article key={questionId} className={`assessment-page-question-card ${isCardOpen ? 'is-open' : 'is-closed'}`}>
                  <div className="assessment-page-question-head">
                    <span className="assessment-page-question-type">{question.type ?? 'Question'}</span>
                    <span
                      className={`assessment-page-question-author assessment-page-source-badge ${getAuthorBadgeClassName(question)}`}
                      title={getAuthorBadgeTooltip(question)}
                      aria-label={getAuthorBadgeTooltip(question)}
                    >
                      {getAuthorBadgeInitial(question)}
                    </span>
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
                      {question.type === 'MCQ' && optionRows.length ? (
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
                      {stripHtml(question.answerKey) ? (
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
                            <span className={`assessment-page-grid-type-label ${getQuestionTypeBadgeClassName(question.type)}`}>{getQuestionTypeLabel(question.type)}</span>
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
                                <span className={`assessment-page-grid-type-label ${getQuestionTypeBadgeClassName(question.type)}`}>{getQuestionTypeLabel(question.type)}</span>
                                <div className="assessment-page-table-full-question">
                                  Q{questionNumber}. {getQuestionPreview(question)}
                                </div>
                                <div className="assessment-page-grid-question-meta assessment-page-grid-detail-meta">
                                  {renderQuestionTagBadges(question)}
                                </div>
                                {renderQuestionRowActions(question, questionId, questionNumber, true)}
                              </div>
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
                              {question.type === 'MCQ' && optionRows.length ? (
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
                              {stripHtml(question.answerKey) ? (
                                <div className="assessment-page-table-inline-section assessment-page-table-answer">
                                  <span>{stripHtml(question.answerKey)}</span>
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

        {selectedGridAction ? (
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
