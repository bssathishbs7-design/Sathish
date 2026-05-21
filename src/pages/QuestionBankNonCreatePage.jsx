import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardList, FileSearch, Filter, Info, ListChecks, Plus, Search, X } from 'lucide-react'
import { stripHtml } from '../utils/mathText'
import '../styles/assessment-pages.css'

const QUESTION_BANK_PUBLISHED_KEY = 'vx-question-bank-published-questions'
const QUESTION_BANK_UPLOADED_KEY = 'vx-question-bank-uploaded-questions'
const QUESTION_BANK_VIEW_KEY = 'vx-question-bank-all-view'
const OLD_DEFAULT_ANSWER_TEXT = 'Correct answer: Review the selected option and add the supporting rationale.'
const CURRENT_DEFAULT_ANSWER_TEXT = 'Add the correct option and explanation.'

const getQuestionPreview = (question) => stripHtml(question?.questionText) || question?.title || 'Untitled question'

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
          const refreshedUploaded = existingUploaded.map((question) => (
            sampleById.has(question.id)
              ? { ...sampleById.get(question.id), ...question, ...sampleById.get(question.id) }
              : question
          ))
          const missingSamples = sampleQuestions.filter((sample) => (
            !refreshedUploaded.some((question) => question.id === sample.id)
          ))
          window.localStorage.setItem(storageKey, JSON.stringify([...refreshedUploaded, ...missingSamples]))
        }
      }
    }

    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(parsed)) return []

    const cleanedQuestions = cleanQuestionBankItems(parsed)

    if (JSON.stringify(cleanedQuestions) !== JSON.stringify(parsed)) {
      window.localStorage.setItem(storageKey, JSON.stringify(cleanedQuestions))
      window.dispatchEvent(new Event('question-bank-published-questions'))
    }

    return cleanedQuestions
  } catch {
    return []
  }
}

const readAllQuestionBankQuestions = () => [
  ...readStoredQuestionList(QUESTION_BANK_PUBLISHED_KEY),
  ...readStoredQuestionList(QUESTION_BANK_UPLOADED_KEY),
]

const readQuestionBankView = () => {
  if (typeof window === 'undefined') return 'table'

  const savedView = window.localStorage.getItem(QUESTION_BANK_VIEW_KEY)
  return savedView === 'table' ? 'table' : 'card'
}

const getQuestionAuthorName = (question) => (
  question?.authorName
  ?? question?.createdByName
  ?? question?.senderName
  ?? 'Karthik Subramanian'
)

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

const getQuestionSourceType = (question) => (
  getQuestionAuthorName(question).trim().toLowerCase() === 'medsy' ? 'Uploaded' : 'Created'
)

const getAuthorBadgeClassName = (question) => (
  getQuestionSourceType(question) === 'Uploaded' ? 'is-uploaded-author' : 'is-created-author'
)

const getQuestionSearchText = (question) => [
  getQuestionPreview(question),
  question.type,
  getQuestionAuthorName(question),
  getQuestionSourceType(question),
  question.year,
  question.subject,
  ...(question.topics ?? []),
  ...(question.competencies ?? []),
  question.questionCategory,
  question.cognitiveLevel,
  question.thinkingLevel,
  question.difficultyLevel,
].filter(Boolean).join(' ').toLowerCase()

const PAGE_SIZE_OPTIONS = [25, 50, 100]

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
  const [publishedQuestions, setPublishedQuestions] = useState(() => readAllQuestionBankQuestions())
  const [activeView] = useState(() => readQuestionBankView())
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [filterSearchTerms, setFilterSearchTerms] = useState({})
  const [filters, setFilters] = useState(() => createEmptyFilters())
  const [openFilterKey, setOpenFilterKey] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isFilterHeaderCompact, setIsFilterHeaderCompact] = useState(false)
  const [isCompactFilterTrayOpen, setIsCompactFilterTrayOpen] = useState(false)
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTagsId, setActiveTagsId] = useState('')
  const [activeOptionDistractorId, setActiveOptionDistractorId] = useState('')
  const [expandedTableRows, setExpandedTableRows] = useState([])
  const [expandedCardRows, setExpandedCardRows] = useState([])

  const filterOptions = useMemo(() => ({
    authors: getUniqueValues(publishedQuestions, getQuestionAuthorName),
    types: getUniqueValues(publishedQuestions, (question) => question.type),
    years: getUniqueValues(publishedQuestions, (question) => question.year),
    subjects: getUniqueValues(publishedQuestions, (question) => question.subject),
    topics: getUniqueValues(publishedQuestions, (question) => question.topics ?? []),
    competencies: getUniqueValues(publishedQuestions, (question) => question.competencies ?? []),
    categories: getUniqueValues(publishedQuestions, (question) => question.questionCategory),
    thinkingLevels: getUniqueValues(publishedQuestions, (question) => question.thinkingLevel),
    difficultyLevels: getUniqueValues(publishedQuestions, (question) => question.difficultyLevel),
    cognitiveLevels: getUniqueValues(publishedQuestions, (question) => question.cognitiveLevel),
    cognitiveFunctions: getUniqueValues(publishedQuestions, (question) => question.cognitiveFunction),
    skillFocuses: getUniqueValues(publishedQuestions, (question) => question.skillFocus),
    organSystems: getUniqueValues(publishedQuestions, (question) => question.organSystem),
    organSubSystems: getUniqueValues(publishedQuestions, (question) => question.organSubSystems ?? []),
    diseaseTags: getUniqueValues(publishedQuestions, (question) => question.diseaseTags ?? []),
    keyConcepts: getUniqueValues(publishedQuestions, (question) => question.keyConcepts ?? []),
  }), [publishedQuestions])

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

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return publishedQuestions.filter((question) => {
      if (normalizedSearch && !getQuestionSearchText(question).includes(normalizedSearch)) return false
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
  }, [filters, publishedQuestions, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStartIndex = (safeCurrentPage - 1) * pageSize
  const pagedQuestions = filteredQuestions.slice(pageStartIndex, pageStartIndex + pageSize)
  const baseFilterDefinitions = [
    ['authors', 'Author', filterOptions.authors],
    ['types', 'Type', filterOptions.types],
    ['years', 'Year', filterOptions.years],
    ['subjects', 'Subject', filterOptions.subjects],
    ['topics', 'Topic', filterOptions.topics],
    ['competencies', 'Competency', filterOptions.competencies],
    ['categories', 'Category', filterOptions.categories],
    ['thinkingLevels', 'Thinking', filterOptions.thinkingLevels],
    ['difficultyLevels', 'Difficulty', filterOptions.difficultyLevels],
  ].filter(([, , options]) => options.length)
  const advancedFilterDefinitions = [
    ['cognitiveLevels', 'Cognitive', filterOptions.cognitiveLevels],
    ['cognitiveFunctions', 'Cognitive Function', filterOptions.cognitiveFunctions],
    ['skillFocuses', 'Skill Focus', filterOptions.skillFocuses],
    ['organSystems', 'Organ System', filterOptions.organSystems],
    ['organSubSystems', 'Organ Sub-System', filterOptions.organSubSystems],
    ['diseaseTags', 'Disease Tags', filterOptions.diseaseTags],
    ['keyConcepts', 'Key Concept', filterOptions.keyConcepts],
  ].filter(([, , options]) => options.length)
  const filterDefinitions = showAdvancedFilters
    ? [...baseFilterDefinitions, ...advancedFilterDefinitions]
    : baseFilterDefinitions
  const searchableFilterKeys = ['organSystems', 'organSubSystems', 'diseaseTags', 'keyConcepts']

  useEffect(() => {
    setCurrentPage(1)
  }, [filters, pageSize, searchTerm])

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
    if (!openFilterKey) return undefined
    if (typeof document === 'undefined') return undefined

    const handleOutsideFilterClick = (event) => {
      if (event.target.closest?.('.assessment-page-filter-dropdown')) return
      if (event.target.closest?.('.assessment-page-filter-toggle')) return
      setOpenFilterKey('')
    }

    document.addEventListener('mousedown', handleOutsideFilterClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideFilterClick)
    }
  }, [openFilterKey])

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
      <div className="assessment-page-shell">

        {publishedQuestions.length ? (
          <section
            ref={filterHeaderRef}
            className={`assessment-page-bank-controls ${isFilterHeaderCompact ? 'is-compact' : ''} ${isCompactFilterTrayOpen ? 'is-filter-tray-open' : ''}`}
            aria-label="All question bank controls"
          >
            {hasSelectedFilters(filters) ? (
              <button
                type="button"
                className="assessment-page-filter-clear"
                onClick={() => setFilters(createEmptyFilters())}
              >
                <X size={14} strokeWidth={2.3} />
                Clear all
              </button>
            ) : null}
            <div className="assessment-page-filter-strip" aria-label="Question filters">
              <div className={`assessment-page-search-compact ${isSearchOpen || searchTerm ? 'is-open' : ''}`}>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen((current) => !current)}
                  aria-label={isSearchOpen ? 'Close search' : 'Open search'}
                >
                  <Search size={17} strokeWidth={2.2} />
                </button>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search question, author, subject..."
                />
                {(isSearchOpen || searchTerm) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('')
                      setIsSearchOpen(false)
                    }}
                    aria-label="Clear search"
                  >
                    <X size={15} strokeWidth={2.3} />
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                className={`assessment-page-filter-toggle ${openFilterKey ? 'is-open' : ''}`}
                onClick={() => {
                  if (isFilterHeaderCompact) {
                    setIsCompactFilterTrayOpen((current) => !current)
                    setOpenFilterKey('')
                    return
                  }
                  setOpenFilterKey((current) => (current ? '' : filterDefinitions[0]?.[0] ?? ''))
                }}
                aria-expanded={isFilterHeaderCompact ? isCompactFilterTrayOpen : Boolean(openFilterKey)}
              >
                <Filter size={16} strokeWidth={2.2} />
                {selectedFilterCount ? <span>{selectedFilterCount}</span> : null}
              </button>
              {filterDefinitions.map(([filterKey, label, options]) => {
                const selectedValues = filters[filterKey]
                const isOpen = openFilterKey === filterKey
                const isSearchableFilter = searchableFilterKeys.includes(filterKey)
                const filterSearchTerm = filterSearchTerms[filterKey] ?? ''
                const visibleOptions = isSearchableFilter
                  ? options.filter((option) => option.toLowerCase().includes(filterSearchTerm.trim().toLowerCase()))
                  : options
                return (
                  <div key={filterKey} className="assessment-page-filter-dropdown">
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
                              <label key={option}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleFilterValue(filterKey, option)}
                                />
                                <span>{option}</span>
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
              })}
              {advancedFilterDefinitions.length ? (
                <button
                  type="button"
                  className={`assessment-page-more-filters-btn ${showAdvancedFilters ? 'is-open' : ''}`}
                  onClick={() => setShowAdvancedFilters((current) => !current)}
                >
                  <Plus size={15} strokeWidth={2.3} />
                  {showAdvancedFilters ? 'Hide more filters' : 'More Filters'}
                </button>
              ) : null}
            </div>
            {hasSelectedFilters(filters) ? (
              <div className="assessment-page-active-filters">
                {Object.entries(filters).flatMap(([filterKey, values]) => (
                  values.map((value) => (
                    <button key={`${filterKey}-${value}`} type="button" onClick={() => clearFilterValue(filterKey, value)}>
                      {value}
                      <X size={12} strokeWidth={2.4} />
                    </button>
                  ))
                ))}
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
                    <span className={`assessment-page-question-author ${getAuthorBadgeClassName(question)}`}>Author By : {getQuestionAuthorName(question)}</span>
                    {question.questionCategory ? <span>{question.questionCategory}</span> : null}
                    {question.thinkingLevel ? <span className={getThinkingBadgeClassName(question.thinkingLevel)}>{question.thinkingLevel}</span> : null}
                    {question.difficultyLevel ? <span>{question.difficultyLevel}</span> : null}
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

        {pagedQuestions.length && activeView === 'table' ? (
          <section className="assessment-page-table-wrap" aria-label="Sent question bank table">
            <table className="assessment-page-question-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Question</th>
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

                  return (
                    <tr key={questionId}>
                      <td className="assessment-page-table-serial">Q{questionNumber}</td>
                      <td className="assessment-page-table-question-cell">
                        <div className="assessment-page-table-question-stack">
                          <div className="assessment-page-table-question-badges">
                            <span className="assessment-page-table-pill">{question.type ?? 'Question'}</span>
                            {question.difficultyLevel ? <span>{question.difficultyLevel}</span> : null}
                            {question.thinkingLevel ? <span className={getThinkingBadgeClassName(question.thinkingLevel)}>{question.thinkingLevel}</span> : null}
                            {question.questionCategory ? <span>{question.questionCategory}</span> : null}
                            <span className={`assessment-page-table-author-pill ${getAuthorBadgeClassName(question)}`}>Author By : {getQuestionAuthorName(question)}</span>
                          </div>
                          <div className="assessment-page-table-question-text">
                            <strong>{getQuestionPreview(question)}</strong>
                            <button
                              type="button"
                              className="assessment-page-table-collapse-btn"
                              onClick={() => {
                                setExpandedTableRows((current) => (
                                  current.includes(questionId)
                                    ? current.filter((id) => id !== questionId)
                                    : [...current, questionId]
                                ))
                              }}
                              aria-expanded={isTableRowOpen}
                              aria-label={`${isTableRowOpen ? 'Collapse' : 'Expand'} question ${questionNumber}`}
                            >
                              {isTableRowOpen ? <ChevronUp size={16} strokeWidth={2.4} /> : <ChevronDown size={16} strokeWidth={2.4} />}
                            </button>
                          </div>
                          {isTableRowOpen ? (
                            <>
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
                                                onClick={() => setActiveOptionDistractorId((current) => (current === optionPreviewId ? '' : optionPreviewId))}
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
                              {tagGroups.length ? (
                                <div className="assessment-page-table-inline-section assessment-page-table-tags-line">
                                  <span className="assessment-page-question-tags-wrap">
                                    <button
                                      type="button"
                                      className="assessment-page-question-tags-btn"
                                      onClick={() => setActiveTagsId(isTagsOpen ? '' : tableTagsId)}
                                      aria-expanded={isTagsOpen}
                                    >
                                      <Info size={13} strokeWidth={2.2} />
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
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        ) : (
          !publishedQuestions.length ? (
          <section className="assessment-page-grid" aria-label="Question bank Overall Question overview">
            {nonCreateHighlights.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="assessment-page-card">
                  <span className="assessment-page-card-icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </article>
              )
            })}
          </section>
          ) : null
        )}

        {publishedQuestions.length && !pagedQuestions.length ? (
          <section className="assessment-page-empty">
            <Info size={18} strokeWidth={2.2} />
            <strong>No matching questions</strong>
            <p>Try changing the search text, source, or author filter.</p>
          </section>
        ) : null}

        {publishedQuestions.length ? (
          <section className="assessment-page-bank-pagination" aria-label="All question bank pagination">
            <span>
              Page {safeCurrentPage} of {totalPages}
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
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                aria-label="Items per page"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option} / page</option>
                ))}
              </select>
            </div>
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
