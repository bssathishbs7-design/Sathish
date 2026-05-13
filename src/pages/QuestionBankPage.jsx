import { useEffect, useMemo, useState } from 'react'
import {
  Bot,
  Check,
  CheckCheck,
  CheckCircle2,
  FilePenLine,
  FolderTree,
  ListChecks,
  LoaderCircle,
  Plus,
  Search,
  Sigma,
  Sparkles,
  Trash2,
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

const QUESTION_TYPE_CARDS = [
  { type: 'MCQ', shortLabel: 'Multiple choice', icon: ListChecks },
  { type: 'Descriptive Question', shortLabel: 'Descriptive', icon: FilePenLine },
  { type: 'True or False', shortLabel: 'True / False', icon: CheckCheck },
  { type: 'Fill in the Blanks', shortLabel: 'Fill in blanks', icon: Sigma },
]

let questionSequence = 1
let optionSequence = 1

const createOption = (label = '') => ({
  id: `option-${optionSequence++}`,
  label,
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
  questionCategory: '',
  cognitiveLevel: '',
  thinkingLevel: '',
  difficultyLevel: '',
  answerKey: '',
  imageName: '',
  options: [createOption(''), createOption(''), createOption(''), createOption('')],
  correctOptionIds: [],
  trueFalseAnswer: 'True',
  fillBlankAnswers: [''],
  descriptiveGuide: '',
  isRequired: true,
  allowMultiple: false,
  answerWithImage: false,
  estimationTime: '2',
  marks: '1',
  isCritical: false,
  status: 'Draft',
})

const getQuestionTypeMeta = (type) => (
  QUESTION_TYPE_CARDS.find((item) => item.type === type) ?? QUESTION_TYPE_CARDS[0]
)

const getRichTextPreview = (value) => stripHtml(value)

const getQuestionPreview = (question) => getRichTextPreview(question.questionText) || question.title || 'Untitled question'

const createHtmlBlock = (value) => `<div>${String(value ?? '')}</div>`

const getGeneratedQuestionDraft = (question) => {
  const type = question.type ?? 'MCQ'
  const subject = question.subject ?? 'Human Anatomy'
  const topic = question.topics[0] ?? 'the selected topic'

  if (type === 'True or False') {
    return {
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
    questionText: createHtmlBlock(`Which of the following best explains the application of ${topic} in ${subject}?`),
    answerKey: createHtmlBlock('Correct answer: Review the selected option and add the supporting rationale.'),
    questionCategory: 'Application',
    cognitiveLevel: 'Apply',
    thinkingLevel: 'HoT',
    difficultyLevel: 'L2',
  }
}

const getAvailableCompetencies = (question) => {
  const directory = SUBJECT_DIRECTORY[question.subject] ?? SUBJECT_DIRECTORY['Human Anatomy']
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

const getValidationItems = (question) => ([
  { label: 'Question text', done: Boolean(getRichTextPreview(question.questionText)) },
  { label: 'Answer key', done: Boolean(getRichTextPreview(question.answerKey)) },
  { label: 'Topic selected', done: question.topics.length > 0 },
  { label: 'Competency mapped', done: question.competencies.length > 0 },
])

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

const getOptionValue = (item) => (typeof item === 'string' ? item : item.value)
const getOptionLabel = (item) => (typeof item === 'string' ? item : item.value)
const getShortCompetencyLabel = (value) => value.split(' ').slice(0, 1).join(' ')

const getSelectionSummary = (selected, emptyLabel, formatter = (value) => value) => {
  if (!selected.length) return emptyLabel
  const visible = selected.slice(0, 2).map(formatter).join(', ')
  const remaining = selected.length - 2
  return remaining > 0 ? `${visible} +${remaining} more` : visible
}

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
  const [searchValue, setSearchValue] = useState('')
  const [activeMappingPicker, setActiveMappingPicker] = useState(null)
  const [mappingSearchValue, setMappingSearchValue] = useState('')
  const [isAiMode, setIsAiMode] = useState(false)
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false)
  const [generationCompleteId, setGenerationCompleteId] = useState(null)

  const selectedQuestion = questions.find((item) => item.id === selectedQuestionId) ?? null
  const readyCount = questions.filter(isQuestionReady).length
  const draftCount = questions.length - readyCount

  const filteredQuestions = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) return questions
    return questions.filter((item) => (
      item.title.toLowerCase().includes(query)
      || getRichTextPreview(item.questionText).toLowerCase().includes(query)
      || item.type.toLowerCase().includes(query)
      || item.subject.toLowerCase().includes(query)
    ))
  }, [questions, searchValue])

  const descriptiveQuestions = useMemo(
    () => questions.filter((item) => item.type === 'Descriptive Question'),
    [questions],
  )

  const availableTopics = selectedQuestion
    ? (SUBJECT_DIRECTORY[selectedQuestion.subject] ?? SUBJECT_DIRECTORY['Human Anatomy']).topics
    : []
  const availableCompetencies = selectedQuestion ? getAvailableCompetencies(selectedQuestion) : []
  const selectedQuestionIndex = selectedQuestion ? questions.findIndex((item) => item.id === selectedQuestion.id) + 1 : 0
  const selectedValidationItems = selectedQuestion ? getValidationItems(selectedQuestion) : []
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
    ? Object.keys(SUBJECT_DIRECTORY)
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

  useEffect(() => {
    setIsGeneratingQuestion(false)
    setGenerationCompleteId(null)
  }, [selectedQuestionId])

  const updateSelectedQuestion = (updater) => {
    if (!selectedQuestion) return
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
    onAlert?.({ tone: 'secondary', message: `${type} question created.` })
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

  const handleMarkCreated = () => {
    if (!selectedQuestion) return
    updateSelectedQuestion({ status: 'Created' })
    onAlert?.({ tone: 'success', message: 'Question created.' })
  }

  const handleGenerateQuestion = () => {
    if (!selectedQuestion || isGeneratingQuestion) return

    const questionId = selectedQuestion.id
    const generatedDraft = getGeneratedQuestionDraft(selectedQuestion)

    setIsGeneratingQuestion(true)
    setGenerationCompleteId(null)

    window.setTimeout(() => {
      setQuestions((current) => current.map((item) => (
        item.id === questionId
          ? {
            ...item,
            ...generatedDraft,
            title: getRichTextPreview(generatedDraft.questionText).slice(0, 60) || item.title,
            status: 'Draft',
          }
          : item
      )))
      setSelectedQuestionId(questionId)
      setIsGeneratingQuestion(false)
      setGenerationCompleteId(questionId)
      onAlert?.({ tone: 'success', message: 'AI question generated as draft.' })
    }, 900)
  }

  const handlePrimaryQuestionAction = () => {
    if (isAiMode) {
      handleGenerateQuestion()
      return
    }

    handleMarkCreated()
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
    updateSelectedQuestion({ year: value })
    setActiveMappingPicker('subjects')
    setMappingSearchValue('')
  }

  return (
    <section className="question-bank-page">
      <header className="question-bank-header">
        <div>
          <h1>Question Bank</h1>
          <p>Create MCQ, descriptive, true or false, and fill in the blanks with fewer clicks.</p>
        </div>
        <div className="question-bank-header-stats">
          <span><strong>{questions.length}</strong> Total</span>
          <span><strong>{readyCount}</strong> Ready</span>
          <span><strong>{draftCount}</strong> Draft</span>
        </div>
      </header>

      <div className="question-bank-layout">
        <aside className="question-bank-sidebar">
          <div className="question-bank-sidebar-head">
            <div>
              <span className="question-bank-eyebrow">Create</span>
              <strong>Question type</strong>
            </div>
          </div>

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

          <label className="question-bank-search">
            <Search size={14} strokeWidth={2} />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search questions"
            />
          </label>

          <div className="question-bank-sidebar-list">
            {filteredQuestions.length ? filteredQuestions.map((question, index) => {
              const typeMeta = getQuestionTypeMeta(question.type)
              return (
                <button
                  key={question.id}
                  type="button"
                  className={`question-bank-sidebar-item ${question.id === selectedQuestionId ? 'is-active' : ''}`}
                  onClick={() => setSelectedQuestionId(question.id)}
                >
                  <div className="question-bank-sidebar-item-top">
                    <span className="question-bank-sidebar-index">Q{index + 1}</span>
                    <strong>{getQuestionPreview(question)}</strong>
                  </div>
                  <div className="question-bank-sidebar-item-bottom">
                    <span className="question-bank-badge soft">{typeMeta.shortLabel}</span>
                    <span className={`question-bank-badge ${isQuestionReady(question) ? 'success' : 'warning'}`}>
                      {isQuestionReady(question) ? 'Ready' : 'Draft'}
                    </span>
                  </div>
                </button>
              )
            }) : (
              <div className="question-bank-empty-card">
                <strong>No questions yet</strong>
                <p>Select a type to start.</p>
              </div>
            )}
          </div>
        </aside>

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
                          <div>
                            <span className="question-bank-eyebrow">Curriculum Mapping</span>
                          </div>
                          <button
                            type="button"
                            className={`question-bank-curriculum-status ${curriculumStatusTone} ${activeMappingPicker ? 'is-open' : ''}`}
                            onClick={toggleMappingFlow}
                            aria-expanded={Boolean(activeMappingPicker)}
                          >
                            {selectedQuestion.year} - {selectedQuestion.subject} - {selectedQuestion.topics.length} topic{selectedQuestion.topics.length === 1 ? '' : 's'} - {selectedQuestion.competencies.length} competenc{selectedQuestion.competencies.length === 1 ? 'y' : 'ies'}
                          </button>
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
                            <span className="question-bank-eyebrow">Question</span>
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
                          />
                        </label>

                      {selectedQuestion.type === 'MCQ' ? (
                        <div className="question-bank-options-block">
                          <div className="question-bank-options-head">
                            <span className="question-bank-eyebrow">Options</span>
                            <button
                              type="button"
                              className="question-bank-add-option-icon"
                              onClick={() => updateSelectedQuestion((item) => ({
                                ...item,
                                options: [...item.options, createOption('')],
                              }))}
                              aria-label="Add option"
                              title="Add option"
                            >
                              <Plus size={14} strokeWidth={2} />
                              Add Option
                            </button>
                          </div>
                          <div className="question-bank-choice-list">
                            {selectedQuestion.options.map((option, index) => (
                              <div key={option.id} className="question-bank-choice-row">
                                <span className="question-bank-choice-letter">{String.fromCharCode(65 + index)}</span>
                                <label className="question-bank-choice-check">
                                  <input
                                    type={selectedQuestion.allowMultiple ? 'checkbox' : 'radio'}
                                    name={`choice-${selectedQuestion.id}`}
                                    checked={selectedQuestion.correctOptionIds.includes(option.id)}
                                    onChange={(event) => updateSelectedQuestion((item) => ({
                                      ...item,
                                      correctOptionIds: item.allowMultiple
                                        ? event.target.checked
                                          ? [...item.correctOptionIds, option.id]
                                          : item.correctOptionIds.filter((currentId) => currentId !== option.id)
                                        : [option.id],
                                    }))}
                                  />
                                </label>
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
                                </div>
                              </div>
                            ))}
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
                      <div className="question-bank-readiness-strip">
                        <strong>Ready checklist</strong>
                        {selectedValidationItems.map((item) => (
                          <span key={item.label} className={item.done ? 'is-done' : ''}>
                            <Check size={12} strokeWidth={2.5} />
                            {item.label}
                          </span>
                        ))}
                      </div>

                      <div className="question-bank-flow-card">
                        <div className="question-bank-section-head">
                          <div>
                            <span className="question-bank-eyebrow">Question Flow</span>
                            <strong>{isAiMode ? 'AI-assisted creation' : 'Manual creation'}</strong>
                          </div>
                        </div>

                        <div className="question-bank-ai-flow">
                          <button
                            type="button"
                            className={`question-bank-ai-toggle ${isAiMode ? 'is-active' : ''}`}
                            onClick={() => {
                              setIsAiMode((current) => !current)
                              setGenerationCompleteId(null)
                            }}
                            aria-pressed={isAiMode}
                          >
                            <span className="question-bank-ai-toggle-switch" />
                            <strong>{isAiMode ? 'AI Generate' : 'Manual'}</strong>
                          </button>
                        </div>

                        <div className="question-bank-flow-summary">
                          <span>
                            <small>Mode</small>
                            <strong>{isAiMode ? 'AI Generate' : 'Manual'}</strong>
                          </span>
                          <span>
                            <small>Primary Button</small>
                            <strong>{isAiMode ? 'AI Generate' : 'Create'}</strong>
                          </span>
                          <span>
                            <small>Status</small>
                            <strong>
                              {isGeneratingQuestion
                                ? 'Generating...'
                                : generationCompleteId === selectedQuestion.id
                                  ? 'Generated'
                                  : 'Ready'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="question-bank-assessment-panel question-bank-assessment-inline">
                        <div className="question-bank-section-head">
                          <div>
                            <span className="question-bank-eyebrow">Assessment Tags</span>
                          </div>
                        </div>

                        <div className="question-bank-assessment-pair">
                          <label className="question-bank-field">
                            <span>Marks</span>
                            <input
                              value={selectedQuestion.marks}
                              onChange={(event) => updateSelectedQuestion({ marks: event.target.value })}
                            />
                          </label>

                          <label className="question-bank-field question-bank-criticality-field">
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

                        <div className="question-bank-assessment-actions">
                          <button
                            type="button"
                            className={`question-bank-primary-btn ${isGeneratingQuestion ? 'is-loading' : ''}`}
                            onClick={handlePrimaryQuestionAction}
                            disabled={isGeneratingQuestion}
                          >
                            {isGeneratingQuestion ? (
                              <>
                                <LoaderCircle size={14} strokeWidth={2.2} className="question-bank-spin-icon" />
                                Generating...
                              </>
                            ) : isAiMode && generationCompleteId === selectedQuestion.id ? (
                              <>
                                <CheckCircle2 size={14} strokeWidth={2.2} />
                                Generated
                              </>
                            ) : isAiMode ? (
                              <>
                                <Bot size={14} strokeWidth={2.2} />
                                AI Generate
                              </>
                            ) : (
                              'Create'
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
    </section>
  )
}
