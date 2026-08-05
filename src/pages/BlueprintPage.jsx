import { ChevronDown, ChevronLeft, ChevronRight, Grid2X2, ListChecks, Pencil, SlidersHorizontal } from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PageNavigationHeader from '../components/PageNavigationHeader'
import { corelationRatingRows } from './corelationRatingData'
import '../styles/assessment-pages.css'

const CORELATION_RATING_SAVED_ROWS_KEY = 'medsy-corelation-rating-saved-rows'
const CORELATION_RATING_RATIONALE_KEY = 'medsy-corelation-rating-rationale-values'
const getSavedTopicPageSize = () => {
  if (typeof window === 'undefined') {
    return 8
  }

  return Math.max(6, Math.min(20, Math.floor((window.innerHeight - 215) / 39)))
}
const getSubjectKey = (row) => `${row.year || '1st Year'}::${row.subject}`
const readStoredObject = (key) => {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

const writeStoredObject = (key, value) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

const DEFAULT_RATIONALE = `This competency focuses on the basic structural and molecular organization of the eukaryotic cell, including the nucleus, cytoplasm, plasma membrane, and subcellular organelles. It also includes understanding the fluid mosaic model of biological membranes and the functions of cellular organelles in metabolism and homeostasis.

The learning objectives require students to identify cell structures, describe membrane organization, and explain organelle functions. These elements provide fundamental biochemical and cellular biology knowledge that forms the scientific basis for understanding later concepts in physiology and pathology.

Although applied correlations may help learners understand disease mechanisms at a molecular level, this competency primarily explains what cellular structures are and how they function rather than enabling direct clinical decision-making.

Therefore, because the competency primarily describes cellular structure, membrane composition, and organelle function without influencing immediate patient-care decisions, it is classified as foundational scientific knowledge.`

export default function BlueprintPage() {
  const savedTopicScrollRef = useRef(null)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [isSubjectMenuOpen, setIsSubjectMenuOpen] = useState(false)
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false)
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false)
  const [topicSearch, setTopicSearch] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [ratingValues, setRatingValues] = useState({})
  const [rationaleValues, setRationaleValues] = useState(() => readStoredObject(CORELATION_RATING_RATIONALE_KEY))
  const [isRationaleEnabled, setIsRationaleEnabled] = useState(true)
  const [openRationaleKey, setOpenRationaleKey] = useState('')
  const [editingRationaleKey, setEditingRationaleKey] = useState('')
  const [savedRows, setSavedRows] = useState(() => readStoredObject(CORELATION_RATING_SAVED_ROWS_KEY))
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false)
  const [pendingCollapseGroupKey, setPendingCollapseGroupKey] = useState('')
  const [activeCorrelationTab, setActiveCorrelationTab] = useState('saved')
  const [editingCorrelationKeys, setEditingCorrelationKeys] = useState({})
  const [editingSavedGroupKey, setEditingSavedGroupKey] = useState('')
  const [ratingMethod, setRatingMethod] = useState('direct')
  const [rowImpactFrequencyEnabled, setRowImpactFrequencyEnabled] = useState({})
  const [collapsedSavedTopics, setCollapsedSavedTopics] = useState({})
  const [savedFilterSubject, setSavedFilterSubject] = useState('')
  const [savedFilterTopic, setSavedFilterTopic] = useState('')
  const [savedFilterType, setSavedFilterType] = useState('')
  const [savedTopicPage, setSavedTopicPage] = useState(1)
  const [savedTopicPageSize, setSavedTopicPageSize] = useState(getSavedTopicPageSize)

  useEffect(() => {
    writeStoredObject(CORELATION_RATING_SAVED_ROWS_KEY, savedRows)
  }, [savedRows])

  useEffect(() => {
    writeStoredObject(CORELATION_RATING_RATIONALE_KEY, rationaleValues)
  }, [rationaleValues])

  useEffect(() => {
    if (!editingSavedGroupKey || typeof document === 'undefined') {
      return undefined
    }

    const frame = window.requestAnimationFrame(() => {
      document
        .querySelector('.corelation-rating-topic-detail-wrap[data-inline-editing="true"] .corelation-rating-type-select')
        ?.focus()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [editingSavedGroupKey])

  const subjectOptions = useMemo(
    () => {
      const options = new Map()
      corelationRatingRows.forEach((row) => {
        if (!row.subject) {
          return
        }
        const key = getSubjectKey(row)
        if (!options.has(key)) {
          options.set(key, {
            key,
            subject: row.subject,
            year: row.year || '1st Year',
          })
        }
      })
      return [...options.values()]
    },
    [],
  )
  const selectedSubjectOption = useMemo(
    () => subjectOptions.find((option) => option.key === selectedSubject),
    [selectedSubject, subjectOptions],
  )
  const availableTopics = useMemo(
    () => [
      ...new Set(
        corelationRatingRows
          .filter((row) => getSubjectKey(row) === selectedSubject)
          .map((row) => row.topic)
          .filter(Boolean),
      ),
    ],
    [selectedSubject],
  )
  const allTopicOptions = useMemo(
    () => [...new Set(corelationRatingRows.map((row) => row.topic).filter(Boolean))],
    [],
  )
  const searchedTopics = useMemo(
    () => availableTopics.filter((topic) => (
      topic.toLowerCase().includes(topicSearch.trim().toLowerCase())
    )),
    [availableTopics, topicSearch],
  )
  const filteredCompetencies = useMemo(
    () => {
      if (!selectedSubject || !selectedTopic) {
        return []
      }

      return corelationRatingRows.filter((row) => (
        getSubjectKey(row) === selectedSubject
        && row.topic === selectedTopic
      ))
    },
    [selectedSubject, selectedTopic],
  )
  const isSetupComplete = Boolean(selectedSubject && selectedTopic)
  const showImpactFrequencyFields = selectedType === 'Clinical' && ratingMethod === 'impact-frequency'
  const getTypeLabel = (type) => type === 'Non-Clinical' ? 'Para - Clinical' : type
  const selectedTypeSummary = selectedType
    ? `${getTypeLabel(selectedType)}${showImpactFrequencyFields ? ' / I-F' : selectedType === 'Clinical' ? ' / Direct' : ''}`
    : 'Choose Type'

  const getTopicNumberLabel = (topic) => {
    const row = corelationRatingRows.find((item) => (
      getSubjectKey(item) === selectedSubject && item.topic === topic
    ))
    return row?.topicNumber || availableTopics.indexOf(topic) + 1
  }

  const handleSubjectSelect = (subjectKey) => {
    setSelectedSubject(subjectKey)
    setSelectedTopic('')
    setIsSubjectMenuOpen(false)
    setIsTopicMenuOpen(false)
    setIsTypeMenuOpen(false)
    setTopicSearch('')
    setSelectedType('All')
    setRatingMethod('direct')
  }

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic)
    setIsSubjectMenuOpen(false)
    setIsTopicMenuOpen(false)
    setIsTypeMenuOpen(false)
    setTopicSearch('')
    setRatingValues({})
    setRowImpactFrequencyEnabled({})
  }

  const renderValue = (value, fallback = '-') => (
    value === undefined || value === null || value === '' ? fallback : value
  )

  const getCompetencyKey = (row) => `${row.year || '1st Year'}::${row.subject}::${row.topic}::${row.code}::${row.name}`
  const displayImpactFrequencyColumns = showImpactFrequencyFields
    || filteredCompetencies.some((row) => rowImpactFrequencyEnabled[getCompetencyKey(row)])

  const updateRatingField = (key, field, value) => {
    if (!/^[1-3]?$/.test(value)) {
      return
    }

    setRatingValues((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: value,
        rating: '',
      },
    }))
  }

  const isRatingInRange = (value, min, max) => {
    if (!/^[1-9]$/.test(String(value || ''))) {
      return false
    }

    const numericValue = Number(value)
    return numericValue >= min && numericValue <= max
  }

  const updateManualRating = (key, value, rowType) => {
    if (!/^[1-9]?$/.test(value)) {
      return
    }

    const maxRating = rowType === 'Non-Clinical' ? 3 : 9
    if (value && Number(value) > maxRating) {
      return
    }

    setRatingValues((current) => ({
      ...current,
      [key]: {
        ...current[key],
        impact: value ? '' : current[key]?.impact,
        frequency: value ? '' : current[key]?.frequency,
        rating: value,
      },
    }))
  }

  const updateRowType = (key, type) => {
    if (type !== 'Clinical') {
      setRowImpactFrequencyEnabled((current) => {
        const next = { ...current }
        delete next[key]
        return next
      })
    }

    setRatingValues((current) => ({
      ...current,
      [key]: {
        ...current[key],
        type,
        impact: type !== 'Clinical' ? '' : current[key]?.impact,
        frequency: type !== 'Clinical' ? '' : current[key]?.frequency,
        rating: type === 'N/A' || (type === 'Non-Clinical' && Number(current[key]?.rating) > 3)
          ? ''
          : current[key]?.rating,
      },
    }))
  }

  const updateTopicRowTypes = (rows, type) => {
    rows.forEach((row) => updateRowType(row.key, type))
  }

  const updateRowImpactFrequencyEnabled = (key, checked) => {
    setRowImpactFrequencyEnabled((current) => {
      const next = { ...current }
      if (checked) {
        next[key] = true
      } else {
        delete next[key]
      }
      return next
    })

    if (!checked) {
      setRatingValues((current) => ({
        ...current,
        [key]: {
          ...current[key],
          impact: '',
          frequency: '',
        },
      }))
    }
  }

  const handleDefaultTypeSelect = (type) => {
    setSelectedType(type)
    setRatingValues({})
    setRowImpactFrequencyEnabled({})
    setRatingMethod((current) => (type === 'Clinical' ? current : 'direct'))
  }

  const updateRationaleValue = (key, value) => {
    setRationaleValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const getRationaleValue = (key) => rationaleValues[key] ?? DEFAULT_RATIONALE

  const getRatingValue = (values) => {
    if (values?.rating) {
      return values.rating
    }

    if (!values?.impact || !values?.frequency) {
      return ''
    }

    return String(Number(values.impact) * Number(values.frequency))
  }

  const isRowComplete = (values, rowType, usesImpactFrequency = rowType === 'Clinical') => {
    const rating = getRatingValue(values)

    if (rowType === 'N/A') {
      return false
    }

    if (rowType === 'Non-Clinical') {
      return isRatingInRange(rating, 1, 3)
    }

    if (values?.rating) {
      return isRatingInRange(values.rating, 1, 9)
    }

    if (usesImpactFrequency) {
      return Boolean(
        isRatingInRange(values?.impact, 1, 3)
        && isRatingInRange(values?.frequency, 1, 3)
        && isRatingInRange(rating, 1, 9),
      )
    }

    return isRatingInRange(rating, 1, 9)
  }

  const completedRowKeys = filteredCompetencies
    .map((row) => {
      const key = getCompetencyKey(row)
      const values = ratingValues[key] ?? {}
      const rowType = values.type || (selectedType === 'All' ? 'N/A' : selectedType)
      const usesImpactFrequency = rowType === 'Clinical' && (showImpactFrequencyFields || rowImpactFrequencyEnabled[key])
      return isRowComplete(values, rowType, usesImpactFrequency) ? key : null
    })
    .filter(Boolean)
  const hasCompletedUnsavedRows = completedRowKeys.some((key) => !savedRows[key] || editingCorrelationKeys[key])
  const topicCompetencyCount = filteredCompetencies.length
  const completedCompetencyCount = completedRowKeys.length
  const isTopicComplete = topicCompetencyCount > 0 && completedCompetencyCount === topicCompetencyCount
  const canSaveCorrelation = isTopicComplete && hasCompletedUnsavedRows
  const completionStatusText = isTopicComplete
    ? `All ${topicCompetencyCount} competencies completed`
    : `Completed ${completedCompetencyCount} of ${topicCompetencyCount} competencies`
  const allCorrelationRows = useMemo(
    () => corelationRatingRows.map((row) => {
      const key = getCompetencyKey(row)
      const saved = savedRows[key]
      return {
        ...row,
        key,
        isRated: Boolean(saved),
        savedValues: saved?.values ?? {},
      }
    }),
    [savedRows],
  )
  const savedMetricCount = allCorrelationRows.filter((row) => row.isRated).length
  const savedSubjectOptions = useMemo(
    () => {
      const options = new Map()
      allCorrelationRows.forEach((row) => {
        const key = getSubjectKey(row)
        if (!options.has(key)) {
          options.set(key, {
            key,
            subject: row.subject,
            year: row.year || '1st Year',
          })
        }
      })
      return [...options.values()]
    },
    [allCorrelationRows],
  )
  const savedTopicOptions = useMemo(
    () => [
      ...new Set(
        allCorrelationRows
          .filter((row) => !savedFilterSubject || getSubjectKey(row) === savedFilterSubject)
          .map((row) => row.topic)
          .filter(Boolean),
      ),
    ],
    [allCorrelationRows, savedFilterSubject],
  )
  const selectedSavedSubjectOption = useMemo(
    () => savedSubjectOptions.find((option) => option.key === savedFilterSubject),
    [savedFilterSubject, savedSubjectOptions],
  )
  const searchedSavedTopics = useMemo(
    () => savedTopicOptions.filter((topic) => (
      topic.toLowerCase().includes(topicSearch.trim().toLowerCase())
    )),
    [savedTopicOptions, topicSearch],
  )
  const filteredSavedCorrelationRows = useMemo(
    () => allCorrelationRows.filter((row) => (
      (!savedFilterSubject || getSubjectKey(row) === savedFilterSubject)
      && (!savedFilterTopic || row.topic === savedFilterTopic)
      && (!savedFilterType || row.savedValues?.type === savedFilterType)
    )),
    [allCorrelationRows, savedFilterSubject, savedFilterTopic, savedFilterType],
  )
  const savedTopicGroups = useMemo(
    () => {
      const groups = new Map()
      filteredSavedCorrelationRows.forEach((row) => {
        const topic = row.topic || 'Untitled Topic'
        const groupKey = `${getSubjectKey(row)}::${topic}`
        if (!groups.has(groupKey)) {
          groups.set(groupKey, { topic, rows: [] })
        }
        groups.get(groupKey).rows.push(row)
      })

      return [...groups.entries()].map(([key, group]) => ({ key, ...group }))
    },
    [filteredSavedCorrelationRows],
  )
  const savedTopicPageCount = Math.max(1, Math.ceil(savedTopicGroups.length / savedTopicPageSize))
  const pagedSavedTopicGroups = useMemo(() => {
    const startIndex = (savedTopicPage - 1) * savedTopicPageSize
    return savedTopicGroups.slice(startIndex, startIndex + savedTopicPageSize)
  }, [savedTopicGroups, savedTopicPage, savedTopicPageSize])
  const savedTopicRangeStart = savedTopicGroups.length
    ? ((savedTopicPage - 1) * savedTopicPageSize) + 1
    : 0
  const savedTopicRangeEnd = Math.min(savedTopicPage * savedTopicPageSize, savedTopicGroups.length)

  useEffect(() => {
    const updatePageSize = () => setSavedTopicPageSize(getSavedTopicPageSize())
    window.addEventListener('resize', updatePageSize)
    return () => window.removeEventListener('resize', updatePageSize)
  }, [])

  useEffect(() => {
    setSavedTopicPage(1)
  }, [savedFilterSubject, savedFilterTopic, savedFilterType])

  useEffect(() => {
    setSavedTopicPage((current) => Math.min(current, savedTopicPageCount))
  }, [savedTopicPageCount])

  useEffect(() => {
    savedTopicScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [savedTopicPage])
  const subjectCountLabel = subjectOptions.length.toString().padStart(2, '0')
  const topicCountLabel = (selectedSubject ? availableTopics.length : allTopicOptions.length).toString().padStart(2, '0')
  const isEditingCorrelation = Object.keys(editingCorrelationKeys).length > 0
  const areAllSavedTopicsCollapsed = savedTopicGroups.length > 0
    && savedTopicGroups.every((group) => collapsedSavedTopics[group.key] !== false)

  const saveCompletedCorrelationRows = () => {
    setSavedRows((current) => {
      const next = { ...current }
      completedRowKeys.forEach((key) => {
        const values = ratingValues[key] ?? {}
        const rowType = values.type || (selectedType === 'All' ? 'N/A' : selectedType)
        const usesImpactFrequency = rowType === 'Clinical' && (showImpactFrequencyFields || rowImpactFrequencyEnabled[key])
        next[key] = {
          values: {
            ...values,
            type: rowType,
            impact: usesImpactFrequency ? values.impact : '',
            frequency: usesImpactFrequency ? values.frequency : '',
            rating: getRatingValue(values),
          },
        }
      })
      return next
    })
    setEditingCorrelationKeys({})
    setEditingSavedGroupKey('')
    setIsSaveConfirmOpen(false)
    setActiveCorrelationTab('saved')
  }

  const toggleSavedTopic = (groupKey) => {
    setCollapsedSavedTopics((current) => ({
      ...current,
      [groupKey]: current[groupKey] === false,
    }))
  }

  const expandAllSavedTopics = () => {
    setCollapsedSavedTopics((current) => {
      const next = { ...current }
      savedTopicGroups.forEach((group) => {
        next[group.key] = false
      })
      return next
    })
  }

  const collapseAllSavedTopics = () => {
    setCollapsedSavedTopics((current) => {
      const next = { ...current }
      savedTopicGroups.forEach((group) => {
        delete next[group.key]
      })
      return next
    })
  }

  const editSavedCorrelationTopic = (rows, groupKey) => {
    const firstRow = rows[0]

    if (!firstRow) {
      return
    }

    const firstValues = firstRow.savedValues ?? {}
    const nextRatingValues = {}
    const nextImpactFrequencyRows = {}

    rows.forEach((row) => {
      const values = row.savedValues ?? {}
      nextRatingValues[row.key] = values
      if (values.type === 'Clinical' && values.impact && values.frequency) {
        nextImpactFrequencyRows[row.key] = true
      }
    })

    setSelectedSubject(getSubjectKey(firstRow))
    setSelectedTopic(firstRow.topic)
    setSelectedType(firstValues.type && firstValues.type !== 'N/A' ? firstValues.type : 'All')
    setRatingMethod(firstValues.impact && firstValues.frequency ? 'impact-frequency' : 'direct')
    setRatingValues((current) => ({
      ...current,
      ...nextRatingValues,
    }))
    setRowImpactFrequencyEnabled((current) => ({
      ...current,
      ...nextImpactFrequencyRows,
    }))
    setEditingCorrelationKeys(Object.fromEntries(rows.map((row) => [row.key, true])))
    setEditingSavedGroupKey(groupKey)
    setCollapsedSavedTopics((current) => ({
      ...current,
      [groupKey]: false,
    }))
    setIsSubjectMenuOpen(false)
    setIsTopicMenuOpen(false)
    setIsTypeMenuOpen(false)
  }

  const cancelInlineCorrelationEdit = () => {
    setEditingSavedGroupKey('')
    setEditingCorrelationKeys({})
    setRatingValues({})
    setRowImpactFrequencyEnabled({})
    setOpenRationaleKey('')
    setEditingRationaleKey('')
  }

  const handleSavedTopicToggle = (group) => {
    const isExpanded = collapsedSavedTopics[group.key] === false

    if (isExpanded) {
      if (editingSavedGroupKey === group.key) {
        setPendingCollapseGroupKey(group.key)
        return
      }
      toggleSavedTopic(group.key)
      return
    }

    const hasSavedRatings = group.rows.some((row) => row.isRated)
    if (hasSavedRatings) {
      toggleSavedTopic(group.key)
      return
    }

    editSavedCorrelationTopic(group.rows, group.key)
  }

  const confirmInlineCollapse = () => {
    const groupKey = pendingCollapseGroupKey
    cancelInlineCorrelationEdit()
    setPendingCollapseGroupKey('')
    if (groupKey) {
      setCollapsedSavedTopics((current) => ({ ...current, [groupKey]: true }))
    }
  }

  return (
    <section className="vx-content assessment-page assessment-evaluation-page">
      <div className="assessment-page-shell assessment-evaluation-page-shell">
        <div className="corelation-rating-page-head">
          <PageNavigationHeader items={['My Pages', 'Correlation Rating']} />
          <div className="corelation-rating-metric" aria-label={`${savedMetricCount} of ${corelationRatingRows.length} correlations completed`}>
            <strong>Create Correlation</strong>
            <span>{savedMetricCount} / {corelationRatingRows.length}</span>
          </div>
        </div>

        <section className="corelation-rating-panel corelation-rating-panel-combined" aria-label="Correlation rating setup">
          {activeCorrelationTab === 'entry' && (
          <div className="corelation-rating-controls">
            <div className="corelation-rating-field corelation-rating-subject-field">
              <span className="corelation-rating-required-label">
                Subject <strong>*</strong>
                <em className="corelation-rating-label-badge">{subjectCountLabel}</em>
              </span>
              <button
                type="button"
                className="corelation-rating-topic-trigger corelation-rating-subject-trigger"
                aria-expanded={isSubjectMenuOpen}
                onClick={() => {
                  setIsSubjectMenuOpen((current) => !current)
                  setIsTopicMenuOpen(false)
                  setIsTypeMenuOpen(false)
                }}
              >
                <span className="corelation-rating-trigger-value">
                  {selectedSubjectOption ? (
                    <>
                      <span className="corelation-rating-subject-year">{selectedSubjectOption.year}</span>
                      <span className="corelation-rating-subject-name">{selectedSubjectOption.subject}</span>
                    </>
                  ) : (
                    'Choose subject'
                  )}
                </span>
                <ChevronDown size={15} strokeWidth={2.4} aria-hidden="true" />
              </button>

              {isSubjectMenuOpen && (
                <div className="corelation-rating-topic-menu corelation-rating-subject-menu" role="listbox" aria-label="Subject options">
                  <div className="corelation-rating-topic-list corelation-rating-subject-list">
                    {subjectOptions.map((subject) => (
                      <button
                        key={subject.key}
                        type="button"
                        className={selectedSubject === subject.key ? 'is-selected' : ''}
                        onClick={() => handleSubjectSelect(subject.key)}
                      >
                        <span className="corelation-rating-subject-name">{subject.subject}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="corelation-rating-field corelation-rating-topic-field">
              <span className="corelation-rating-required-label">
                Topics <strong>*</strong>
                <em className="corelation-rating-label-badge is-topic-count">{topicCountLabel}</em>
              </span>
              <button
                type="button"
                className="corelation-rating-topic-trigger"
                disabled={!selectedSubject}
                aria-expanded={isTopicMenuOpen}
                onClick={() => {
                  setIsTopicMenuOpen((current) => !current)
                  setIsSubjectMenuOpen(false)
                  setIsTypeMenuOpen(false)
                }}
              >
                <span className="corelation-rating-trigger-value">
                  {selectedTopic ? (
                    <>
                      <span className="corelation-rating-topic-number">Topic {getTopicNumberLabel(selectedTopic)}</span>
                      <span className="corelation-rating-topic-name">{selectedTopic}</span>
                    </>
                  ) : (
                    selectedSubject ? 'Choose topic' : 'Select subject first'
                  )}
                </span>
                <ChevronDown size={15} strokeWidth={2.4} aria-hidden="true" />
              </button>

              {isTopicMenuOpen && (
                <div className="corelation-rating-topic-menu" role="listbox" aria-label="Topic options">
                  <input
                    type="search"
                    className="corelation-rating-topic-search"
                    value={topicSearch}
                    onChange={(event) => setTopicSearch(event.target.value)}
                    placeholder="Search topic..."
                    autoFocus
                  />
                  <div className="corelation-rating-topic-list">
                    {searchedTopics.length ? (
                      searchedTopics.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          className={selectedTopic === topic ? 'is-selected' : ''}
                          onClick={() => handleTopicSelect(topic)}
                        >
                          <span className="corelation-rating-topic-number">
                            Topic {getTopicNumberLabel(topic)}
                          </span>
                          <span className="corelation-rating-topic-name">{topic}</span>
                        </button>
                      ))
                    ) : (
                      <span className="corelation-rating-topic-empty">No topics found</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="corelation-rating-field corelation-rating-type-field">
              <span className="corelation-rating-required-label">
                Competency Type <strong>*</strong>
              </span>
              <button
                type="button"
                className={`corelation-rating-type-trigger${selectedType ? ' is-selected' : ''}`}
                aria-expanded={isTypeMenuOpen}
                onClick={() => {
                  setIsTypeMenuOpen((current) => !current)
                  setIsSubjectMenuOpen(false)
                  setIsTopicMenuOpen(false)
                }}
              >
                <span>
                  <SlidersHorizontal size={14} strokeWidth={2.4} aria-hidden="true" />
                  {selectedTypeSummary}
                </span>
                <ChevronDown size={15} strokeWidth={2.4} aria-hidden="true" />
              </button>

              {isTypeMenuOpen && (
                <div className="corelation-rating-type-menu" role="dialog" aria-label="Competency type controls">
                  <div className="corelation-rating-type-menu-head">
                    <strong>Competency Type</strong>
                    <small>Choose how this topic should be rated.</small>
                  </div>
                  <div className="corelation-rating-type-switch" role="radiogroup" aria-label="Choose competency type">
                    {['All', 'Clinical', 'Non-Clinical'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={selectedType === type}
                        className={selectedType === type ? 'is-active' : ''}
                        onClick={() => handleDefaultTypeSelect(type)}
                      >
                        <span aria-hidden="true" />
                        {getTypeLabel(type)}
                      </button>
                    ))}
                  </div>
                  <div className="corelation-rating-type-note">
                    {selectedType === 'Clinical' && (
                      <div className="corelation-rating-method-section">
                        <span>Rating Method</span>
                        <div className="corelation-rating-method-switch" role="radiogroup" aria-label="Choose rating method">
                          {[
                            ['direct', 'Direct Rating'],
                            ['impact-frequency', 'Impact + Frequency'],
                          ].map(([method, label]) => (
                            <button
                              key={method}
                              type="button"
                              role="radio"
                              aria-checked={ratingMethod === method}
                              className={ratingMethod === method ? 'is-active' : ''}
                              onClick={() => setRatingMethod(method)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <small className="corelation-rating-type-help">
                      {!selectedType
                        ? 'Choose a type to load competencies.'
                        : selectedType === 'All'
                          ? 'Select a type per competency row.'
                        : selectedType === 'Clinical'
                          ? ratingMethod === 'impact-frequency'
                            ? 'Impact and Frequency will calculate the Rating.'
                            : 'Enter the Rating directly for each competency.'
                          : 'Enter direct Rating only.'}
                    </small>
                  </div>
                </div>
              )}
            </div>

          </div>
          )}

          {activeCorrelationTab === 'saved' ? (
            <>
              {allCorrelationRows.length ? (
                <>
                <div className="corelation-rating-saved-results">
                <div className="corelation-rating-saved-filters" aria-label="Saved correlation filters">
                  <div className="corelation-rating-field corelation-rating-subject-field">
                    <span className="corelation-rating-required-label">
                      Subject
                      <em className="corelation-rating-label-badge">{savedSubjectOptions.length}</em>
                    </span>
                    <button
                      type="button"
                      className="corelation-rating-topic-trigger corelation-rating-subject-trigger"
                      aria-expanded={isSubjectMenuOpen}
                      onClick={() => {
                        setIsSubjectMenuOpen((current) => !current)
                        setIsTopicMenuOpen(false)
                        setIsTypeMenuOpen(false)
                      }}
                    >
                      <span className="corelation-rating-trigger-value">
                        {selectedSavedSubjectOption ? (
                          <>
                            <span className="corelation-rating-subject-year">{selectedSavedSubjectOption.year}</span>
                            <span className="corelation-rating-subject-name">{selectedSavedSubjectOption.subject}</span>
                          </>
                        ) : 'All'}
                      </span>
                      <ChevronDown size={15} strokeWidth={2.4} aria-hidden="true" />
                    </button>
                    {isSubjectMenuOpen ? (
                      <div className="corelation-rating-topic-menu corelation-rating-subject-menu" role="listbox" aria-label="Subject filter options">
                        <div className="corelation-rating-topic-list corelation-rating-subject-list">
                          <button
                            type="button"
                            className={!savedFilterSubject ? 'is-selected' : ''}
                            onClick={() => {
                              setSavedFilterSubject('')
                              setSavedFilterTopic('')
                              setIsSubjectMenuOpen(false)
                            }}
                          >
                            <span className="corelation-rating-subject-name">All</span>
                          </button>
                          {savedSubjectOptions.map((option) => (
                            <button
                              key={option.key}
                              type="button"
                              className={savedFilterSubject === option.key ? 'is-selected' : ''}
                              onClick={() => {
                                setSavedFilterSubject(option.key)
                                setSavedFilterTopic('')
                                setTopicSearch('')
                                setIsSubjectMenuOpen(false)
                              }}
                            >
                              <span className="corelation-rating-subject-year">{option.year}</span>
                              <span className="corelation-rating-subject-name">{option.subject}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="corelation-rating-field corelation-rating-topic-field">
                    <span className="corelation-rating-required-label">
                      Topics
                      <em className="corelation-rating-label-badge is-topic-count">{savedTopicOptions.length}</em>
                    </span>
                    <button
                      type="button"
                      className="corelation-rating-topic-trigger"
                      aria-expanded={isTopicMenuOpen}
                      onClick={() => {
                        setIsTopicMenuOpen((current) => !current)
                        setIsSubjectMenuOpen(false)
                        setIsTypeMenuOpen(false)
                      }}
                    >
                      <span className="corelation-rating-trigger-value">
                        {savedFilterTopic || 'All'}
                      </span>
                      <ChevronDown size={15} strokeWidth={2.4} aria-hidden="true" />
                    </button>
                    {isTopicMenuOpen ? (
                      <div className="corelation-rating-topic-menu" role="listbox" aria-label="Topic filter options">
                        <input
                          type="search"
                          className="corelation-rating-topic-search"
                          value={topicSearch}
                          onChange={(event) => setTopicSearch(event.target.value)}
                          placeholder="Search topic..."
                          autoFocus
                        />
                        <div className="corelation-rating-topic-list">
                          <button
                            type="button"
                            className={!savedFilterTopic ? 'is-selected' : ''}
                            onClick={() => {
                              setSavedFilterTopic('')
                              setTopicSearch('')
                              setIsTopicMenuOpen(false)
                            }}
                          >
                            <span className="corelation-rating-topic-name">All</span>
                          </button>
                          {searchedSavedTopics.map((topic) => (
                            <button
                              key={topic}
                              type="button"
                              className={savedFilterTopic === topic ? 'is-selected' : ''}
                              onClick={() => {
                                setSavedFilterTopic(topic)
                                setTopicSearch('')
                                setIsTopicMenuOpen(false)
                              }}
                            >
                              <span className="corelation-rating-topic-name">{topic}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <label>
                    <span>Type</span>
                    <select
                      value={savedFilterType}
                      onChange={(event) => setSavedFilterType(event.target.value)}
                    >
                      <option value="">All</option>
                      <option value="Clinical">Clinical</option>
                      <option value="Non-Clinical">Para - Clinical</option>
                    </select>
                  </label>
                  <div className="corelation-rating-saved-collapse-switch" role="group" aria-label="Saved topic display controls">
                    <button
                      type="button"
                      className={!areAllSavedTopicsCollapsed ? 'is-active' : ''}
                      aria-pressed={!areAllSavedTopicsCollapsed}
                      onClick={expandAllSavedTopics}
                      title="Expand all topics"
                      aria-label="Expand all topics"
                    >
                      <ListChecks size={14} strokeWidth={2.4} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={areAllSavedTopicsCollapsed ? 'is-active' : ''}
                      aria-pressed={areAllSavedTopicsCollapsed}
                      onClick={collapseAllSavedTopics}
                      title="Collapse all topics"
                      aria-label="Collapse all topics"
                    >
                      <Grid2X2 size={14} strokeWidth={2.4} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {filteredSavedCorrelationRows.length ? (
                <div className="corelation-rating-topic-summary-wrap">
                  <div ref={savedTopicScrollRef} className="corelation-rating-topic-summary-scroll">
                    <table className="corelation-rating-topic-summary-table">
                    <thead>
                      <tr>
                        <th>Topic</th>
                        <th>Competencies</th>
                        <th>Rated</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedSavedTopicGroups.map((group) => {
                        const isCollapsed = collapsedSavedTopics[group.key] !== false
                        const ratedCount = group.rows.filter((row) => row.isRated).length
                        const groupTypes = [...new Set(
                          group.rows
                            .map((row) => row.savedValues?.type)
                            .filter((type) => type === 'Clinical' || type === 'Non-Clinical'),
                        )]
                        const isInlineEditing = editingSavedGroupKey === group.key
                        const currentGroupTypes = group.rows.map((row) => {
                          const values = isInlineEditing
                            ? ratingValues[row.key] ?? row.savedValues ?? {}
                            : row.savedValues ?? {}
                          return values.type || 'N/A'
                        })
                        const groupTypeState = currentGroupTypes.length > 0
                          && currentGroupTypes.every((type) => type === 'Clinical')
                          ? 'Clinical'
                          : currentGroupTypes.length > 0
                            && currentGroupTypes.every((type) => type === 'Non-Clinical')
                            ? 'Non-Clinical'
                            : 'Mixed'
                        const ratingStateClass = ratedCount === 0
                          ? ' is-not-started'
                          : ratedCount === group.rows.length
                            ? ' is-fully-rated'
                            : ' is-partially-rated'
                        const ratingStatusLabel = ratedCount === 0
                          ? 'Not Started'
                          : ratedCount === group.rows.length
                            ? 'Completed'
                            : 'In Progress'
                        return (
                          <Fragment key={group.key}>
                            <tr className={`corelation-rating-topic-summary-row${isCollapsed ? '' : ' is-expanded'}${ratingStateClass}${isInlineEditing ? ' is-editing' : ''}`}>
                              <td>
                                <button
                                  type="button"
                                  className="corelation-rating-topic-summary-toggle"
                                  aria-expanded={!isCollapsed}
                                  onClick={() => handleSavedTopicToggle(group)}
                                >
                                  <ChevronDown size={16} strokeWidth={2.5} aria-hidden="true" />
                                  <span>{group.topic}</span>
                                </button>
                              </td>
                              <td><strong className="corelation-rating-topic-summary-count">{group.rows.length}</strong></td>
                              <td><strong className="corelation-rating-topic-summary-rated">{ratedCount} / {group.rows.length}</strong></td>
                              <td>
                                {groupTypes.length ? (
                                  <span className="corelation-rating-topic-summary-types">
                                    {groupTypes.map((type) => (
                                      <em
                                        key={type}
                                        className={`corelation-rating-topic-summary-type${type === 'Non-Clinical' ? ' is-non-clinical' : ' is-clinical'}`}
                                      >
                                        {getTypeLabel(type)}
                                      </em>
                                    ))}
                                  </span>
                                ) : <span className="corelation-rating-topic-summary-empty">-</span>}
                              </td>
                              <td>
                                {ratedCount > 0 ? (
                                  <em className={`corelation-rating-topic-status${ratingStateClass}`}>
                                    {ratingStatusLabel}
                                  </em>
                                ) : <span className="corelation-rating-topic-summary-empty">-</span>}
                              </td>
                              <td>
                                {isInlineEditing ? (
                                  <span className="corelation-rating-inline-actions">
                                    <button type="button" className="is-cancel" onClick={cancelInlineCorrelationEdit}>Cancel</button>
                                    <button
                                      type="button"
                                      className="is-update"
                                      disabled={!canSaveCorrelation}
                                      onClick={() => setIsSaveConfirmOpen(true)}
                                    >
                                      Update Correlation
                                    </button>
                                  </span>
                                ) : ratedCount > 0 ? (
                                  <button
                                    type="button"
                                    className="corelation-rating-saved-topic-edit"
                                    title={`Edit ${group.topic}`}
                                    aria-label={`Edit ${group.topic}`}
                                    onClick={() => editSavedCorrelationTopic(group.rows, group.key)}
                                  >
                                    <Pencil size={14} strokeWidth={2.5} aria-hidden="true" />
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                            {!isCollapsed && (
                              <tr className="corelation-rating-topic-detail-row">
                                <td colSpan={6}>
                                  <div className="corelation-rating-topic-detail-wrap" data-inline-editing={isInlineEditing ? 'true' : 'false'}>
                                    <table className={`corelation-rating-saved-table${isRationaleEnabled ? '' : ' is-rationale-off'}`}>
                                      <thead>
                                        <tr>
                                          <th>Code</th>
                                          <th>
                                            <div className="corelation-rating-competency-head">
                                              <span>Competency</span>
                                              <span className={`corelation-rating-rationale-head${isRationaleEnabled ? ' is-enabled' : ' is-disabled'}`}>
                                                <span>Show Rationale</span>
                                                <button
                                                  type="button"
                                                  className={isRationaleEnabled ? 'is-on' : ''}
                                                  aria-pressed={isRationaleEnabled}
                                                  onClick={() => {
                                                    setIsRationaleEnabled((current) => !current)
                                                    setOpenRationaleKey('')
                                                    setEditingRationaleKey('')
                                                  }}
                                                >
                                                  {isRationaleEnabled ? 'On' : 'Off'}
                                                </button>
                                              </span>
                                            </div>
                                          </th>
                                          {isRationaleEnabled && <th>Rationale</th>}
                                          <th>
                                            <div className="corelation-rating-bulk-type-head">
                                              <span>Type</span>
                                              {isInlineEditing && (
                                                <div
                                                  className={`corelation-rating-bulk-type-switch${groupTypeState === 'Mixed' ? ' is-mixed' : ''}`}
                                                  aria-label={`Set all competency types for ${group.topic}`}
                                                >
                                                  <button
                                                    type="button"
                                                    className={groupTypeState === 'Clinical' ? 'is-clinical is-active' : 'is-clinical'}
                                                    aria-pressed={groupTypeState === 'Clinical'}
                                                    onClick={() => updateTopicRowTypes(group.rows, 'Clinical')}
                                                  >
                                                    Clinical
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className={groupTypeState === 'Non-Clinical' ? 'is-non-clinical is-active' : 'is-non-clinical'}
                                                    aria-pressed={groupTypeState === 'Non-Clinical'}
                                                    onClick={() => updateTopicRowTypes(group.rows, 'Non-Clinical')}
                                                  >
                                                    Para - Clinical
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </th>
                                          <th>Impact</th>
                                          <th>Frequency</th>
                                          <th>Rating</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                            {group.rows.map((row) => {
                              const values = isInlineEditing
                                ? ratingValues[row.key] ?? row.savedValues ?? {}
                                : row.savedValues ?? {}
                              const rowType = values.type || 'N/A'
                              const isRowTypePending = rowType === 'N/A'
                              const rowUsesImpactFrequency = rowType === 'Clinical'
                                && Boolean(rowImpactFrequencyEnabled[row.key])
                              const ratingValue = getRatingValue(values)
                              const rationaleValue = isInlineEditing || row.isRated ? getRationaleValue(row.key) : ''
                              const isRationaleLong = rationaleValue.length > 120
                              const rationalePreview = isRationaleLong ? `${rationaleValue.slice(0, 118).trim()}...` : rationaleValue || '-'
                              const isEditingRationale = editingRationaleKey === row.key
                              return (
                                <tr key={row.key} className={isInlineEditing ? 'is-inline-editing' : ''}>
                                  <td><span className="corelation-rating-code-badge">{row.code}</span></td>
                                  <td>{row.name}</td>
                                  {isRationaleEnabled && (
                                    <td>
                                      <div className="corelation-rating-rationale-preview">
                                        <span>
                                          {rationalePreview}
                                          {isRationaleLong && (
                                            <button
                                              type="button"
                                              onClick={() => setOpenRationaleKey((current) => {
                                                setEditingRationaleKey('')
                                                return current === row.key ? '' : row.key
                                              })}
                                            >
                                              View More
                                            </button>
                                          )}
                                        </span>
                                        {openRationaleKey === row.key && typeof document !== 'undefined' && createPortal((
                                          <div
                                            className="corelation-rating-rationale-popover-backdrop"
                                            role="presentation"
                                            onClick={() => {
                                              setEditingRationaleKey('')
                                              setOpenRationaleKey('')
                                            }}
                                          >
                                            <div
                                              className="corelation-rating-rationale-popover"
                                              role="dialog"
                                              aria-modal="true"
                                              aria-label={`Rationale for ${row.code}`}
                                              onClick={(event) => event.stopPropagation()}
                                            >
                                              {isEditingRationale ? (
                                                <div className="corelation-rating-rationale-edit">
                                                  <textarea
                                                    className="corelation-rating-rationale-textarea"
                                                    aria-label={`Edit rationale for ${row.code}`}
                                                    value={rationaleValue}
                                                    onChange={(event) => updateRationaleValue(row.key, event.target.value)}
                                                  />
                                                  <div className="corelation-rating-rationale-popover-actions">
                                                    <button
                                                      type="button"
                                                      className="is-edit"
                                                      onClick={() => setEditingRationaleKey('')}
                                                    >
                                                      Done
                                                    </button>
                                                    <button
                                                      type="button"
                                                      className="is-close"
                                                      onClick={() => {
                                                        setEditingRationaleKey('')
                                                        setOpenRationaleKey('')
                                                      }}
                                                    >
                                                      Close
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <>
                                                  <p>{rationaleValue}</p>
                                                  <div className="corelation-rating-rationale-popover-actions">
                                                    <button
                                                      type="button"
                                                      className="is-edit"
                                                      onClick={() => setEditingRationaleKey(row.key)}
                                                    >
                                                      <Pencil size={13} strokeWidth={2.5} aria-hidden="true" />
                                                      Edit
                                                    </button>
                                                    <button
                                                      type="button"
                                                      className="is-close"
                                                      onClick={() => {
                                                        setEditingRationaleKey('')
                                                        setOpenRationaleKey('')
                                                      }}
                                                    >
                                                      Close
                                                    </button>
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        ), document.body)}
                                      </div>
                                    </td>
                                  )}
                                  <td>
                                    {isInlineEditing ? (
                                      <div className="corelation-rating-row-type-control">
                                        <select
                                          aria-label={`Type for ${row.code}`}
                                          className="corelation-rating-type-select"
                                          value={rowType}
                                          onChange={(event) => updateRowType(row.key, event.target.value)}
                                        >
                                          <option value="N/A">N/A</option>
                                          <option value="Clinical">Clinical</option>
                                          <option value="Non-Clinical">Para - Clinical</option>
                                        </select>
                                        {rowType === 'Clinical' && (
                                          <label className="corelation-rating-row-impact-toggle" title="Use Impact and Frequency rating">
                                            <input
                                              type="checkbox"
                                              checked={rowUsesImpactFrequency}
                                              onChange={(event) => updateRowImpactFrequencyEnabled(row.key, event.target.checked)}
                                            />
                                            <span>Use I/F Rating</span>
                                          </label>
                                        )}
                                      </div>
                                    ) : (
                                      <span className={`corelation-rating-type-badge ${!row.isRated ? 'is-unrated' : values.type === 'Non-Clinical' ? 'is-non-clinical' : 'is-clinical'}`}>
                                        {getTypeLabel(values.type) || '-'}
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    {isInlineEditing && rowUsesImpactFrequency ? (
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        aria-label={`Impact for ${row.code}`}
                                        className="corelation-rating-score-input"
                                        value={values.impact ?? ''}
                                        onChange={(event) => updateRatingField(row.key, 'impact', event.target.value)}
                                        placeholder="-"
                                      />
                                    ) : renderValue(values.impact)}
                                  </td>
                                  <td>
                                    {isInlineEditing && rowUsesImpactFrequency ? (
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        aria-label={`Frequency for ${row.code}`}
                                        className="corelation-rating-score-input"
                                        value={values.frequency ?? ''}
                                        onChange={(event) => updateRatingField(row.key, 'frequency', event.target.value)}
                                        placeholder="-"
                                      />
                                    ) : renderValue(values.frequency)}
                                  </td>
                                  <td>
                                    {isInlineEditing ? (
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        aria-label={`Rating for ${row.code}`}
                                        className="corelation-rating-score-input"
                                        value={isRowTypePending ? '' : ratingValue}
                                        onChange={(event) => updateManualRating(row.key, event.target.value, rowType)}
                                        placeholder="-"
                                        disabled={isRowTypePending || rowUsesImpactFrequency}
                                      />
                                    ) : renderValue(values.rating)}
                                  </td>
                                </tr>
                              )
                            })}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                      </tbody>
                    </table>
                  </div>
                  <div className="corelation-rating-topic-pagination">
                    <div className="corelation-rating-topic-pagination-summary">
                      <strong>Page {savedTopicPage} of {savedTopicPageCount}</strong>
                      <span>Showing {savedTopicRangeStart}-{savedTopicRangeEnd} of {savedTopicGroups.length} topics</span>
                    </div>
                    <div className="corelation-rating-topic-pagination-actions">
                      <button
                        type="button"
                        aria-label="Previous topic page"
                        title="Previous page"
                        disabled={savedTopicPage <= 1}
                        onClick={() => setSavedTopicPage((current) => Math.max(1, current - 1))}
                      >
                        <ChevronLeft size={16} strokeWidth={2.5} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next topic page"
                        title="Next page"
                        disabled={savedTopicPage >= savedTopicPageCount}
                        onClick={() => setSavedTopicPage((current) => Math.min(savedTopicPageCount, current + 1))}
                      >
                        <ChevronRight size={16} strokeWidth={2.5} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
                ) : (
                  <div className="corelation-rating-saved-empty">No saved correlation ratings for this filter.</div>
                )}
                </div>
                </>
              ) : (
                <div className="corelation-rating-saved-empty">No saved correlation ratings yet.</div>
              )}
            </>
          ) : isSetupComplete ? (
            <>
          <div className="corelation-rating-table-wrap">
            <table className={`corelation-rating-table${isRationaleEnabled ? '' : ' is-rationale-off'}${displayImpactFrequencyColumns ? '' : ' is-impact-frequency-hidden'}`}>
              <thead>
                <tr>
                  <th className="is-code">Code</th>
                  <th className="is-competency-name">
                    <div className="corelation-rating-competency-head">
                      <span>Competency</span>
                      <span className={`corelation-rating-rationale-head${isRationaleEnabled ? ' is-enabled' : ' is-disabled'}`}>
                        <span>Show Rationale</span>
                        <button
                          type="button"
                          className={isRationaleEnabled ? 'is-on' : ''}
                          aria-pressed={isRationaleEnabled}
                          onClick={() => {
                            setIsRationaleEnabled((current) => !current)
                            setOpenRationaleKey('')
                            setEditingRationaleKey('')
                          }}
                        >
                          {isRationaleEnabled ? 'On' : 'Off'}
                        </button>
                      </span>
                    </div>
                  </th>
                  {isRationaleEnabled && <th className="is-rationale">Rationale</th>}
                  <th className="is-type" title="Clinical uses Impact and Frequency. Para - Clinical uses direct Rating.">Type</th>
                  {displayImpactFrequencyColumns && (
                    <>
                      <th className="is-impact" title="1 low, 2 medium, 3 high">Impact</th>
                      <th className="is-frequency" title="1 low, 2 medium, 3 high">Frequency</th>
                    </>
                  )}
                  <th className="is-rating" title="Auto: Impact × Frequency, or enter 1-9 directly">Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompetencies.map((row, index) => {
                          const competencyKey = getCompetencyKey(row)
                          const currentValues = ratingValues[competencyKey] ?? savedRows[competencyKey]?.values ?? {}
                          const rowType = currentValues.type || (selectedType === 'All' ? 'N/A' : selectedType)
                          const isNonClinical = rowType === 'Non-Clinical'
                          const isRowTypePending = rowType === 'N/A'
                          const isRowImpactFrequencyEnabled = Boolean(rowImpactFrequencyEnabled[competencyKey])
                          const rowUsesImpactFrequency = !isRowTypePending && !isNonClinical && (showImpactFrequencyFields || isRowImpactFrequencyEnabled)
                          const rowComplete = isRowComplete(currentValues, rowType, rowUsesImpactFrequency)
                          const ratingValue = getRatingValue(currentValues)
                          const isRowSaved = Boolean(savedRows[competencyKey]) && rowComplete && !editingCorrelationKeys[competencyKey]
                          const rationaleValue = getRationaleValue(competencyKey)
                          const isRationaleLong = rationaleValue.length > 120
                          const rationalePreview = isRationaleLong ? `${rationaleValue.slice(0, 118).trim()}...` : rationaleValue
                          const isEditingRationale = editingRationaleKey === competencyKey

                          return (
                            <tr key={`${row.code}-${row.topic}-${index}`} className={`corelation-rating-child-row${rowComplete ? ' is-complete' : ''}`}>
                              <td className="is-code">
                                <span className="corelation-rating-code-badge">{row.code}</span>
                              </td>
                              <td className="is-competency-name">{row.name}</td>
                              {isRationaleEnabled && (
                              <td className="is-rationale">
                                  <div className="corelation-rating-rationale-preview">
                                    <span>
                                      {rationalePreview}
                                      {isRationaleLong && (
                                        <button
                                          type="button"
                                          onClick={() => setOpenRationaleKey((current) => {
                                            setEditingRationaleKey('')
                                            return current === competencyKey ? '' : competencyKey
                                          })}
                                        >
                                          View More
                                        </button>
                                      )}
                                    </span>
                                    {openRationaleKey === competencyKey && typeof document !== 'undefined' && createPortal((
                                      <div
                                        className="corelation-rating-rationale-popover-backdrop"
                                        role="presentation"
                                        onClick={() => {
                                          setEditingRationaleKey('')
                                          setOpenRationaleKey('')
                                        }}
                                      >
                                        <div
                                          className="corelation-rating-rationale-popover"
                                          role="dialog"
                                          aria-modal="true"
                                          aria-label={`Rationale for ${row.code}`}
                                          onClick={(event) => event.stopPropagation()}
                                        >
                                        {isEditingRationale ? (
                                          <div className="corelation-rating-rationale-edit">
                                            <textarea
                                              className="corelation-rating-rationale-textarea"
                                              aria-label={`Edit rationale for ${row.code}`}
                                              value={rationaleValue}
                                              onChange={(event) => updateRationaleValue(competencyKey, event.target.value)}
                                            />
                                            <div className="corelation-rating-rationale-popover-actions">
                                              <button
                                                type="button"
                                                className="is-edit"
                                                onClick={() => setEditingRationaleKey('')}
                                              >
                                                Done
                                              </button>
                                              <button
                                                type="button"
                                                className="is-close"
                                                onClick={() => {
                                                  setEditingRationaleKey('')
                                                  setOpenRationaleKey('')
                                                }}
                                              >
                                                Close
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                          <p>{rationaleValue}</p>
                                          <div className="corelation-rating-rationale-popover-actions">
                                            <button
                                              type="button"
                                              className="is-edit"
                                              onClick={() => setEditingRationaleKey(competencyKey)}
                                            >
                                              <Pencil size={13} strokeWidth={2.5} aria-hidden="true" />
                                              Edit
                                            </button>
                                            <button
                                              type="button"
                                              className="is-close"
                                              onClick={() => {
                                                setEditingRationaleKey('')
                                                setOpenRationaleKey('')
                                              }}
                                            >
                                              Close
                                            </button>
                                          </div>
                                          </>
                                        )}
                                        </div>
                                      </div>
                                    ), document.body)}
                                  </div>
                              </td>
                              )}
                              <td className="is-type">
                                {isRowSaved ? (
                                  <span className={`corelation-rating-type-badge ${isNonClinical ? 'is-non-clinical' : 'is-clinical'}`}>
                                    {getTypeLabel(rowType)}
                                  </span>
                                ) : (
                                  <div className="corelation-rating-row-type-control">
                                    <select
                                      aria-label={`Type for ${row.code}`}
                                      className="corelation-rating-type-select"
                                      value={rowType}
                                      onChange={(event) => updateRowType(competencyKey, event.target.value)}
                                    >
                                      <option value="N/A">N/A</option>
                                      <option value="Clinical">Clinical</option>
                                      <option value="Non-Clinical">Para - Clinical</option>
                                    </select>
                                    {!isRowTypePending && !isNonClinical && !showImpactFrequencyFields && (
                                      <label className="corelation-rating-row-impact-toggle" title="Use Impact and Frequency rating">
                                        <input
                                          type="checkbox"
                                          checked={isRowImpactFrequencyEnabled}
                                          onChange={(event) => updateRowImpactFrequencyEnabled(competencyKey, event.target.checked)}
                                        />
                                        <span>Use I/F Rating</span>
                                      </label>
                                    )}
                                  </div>
                                )}
                              </td>
                              {displayImpactFrequencyColumns && (
                                <>
                                  <td className="is-impact">
                                    {isRowSaved ? (
                                      <span className="corelation-rating-score-value">{renderValue(currentValues.impact)}</span>
                                    ) : !rowUsesImpactFrequency ? (
                                      <span className="corelation-rating-score-muted">-</span>
                                    ) : (
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        aria-label={`Impact for ${row.code}`}
                                        title="Enter 1, 2, or 3"
                                        className="corelation-rating-score-input"
                                        value={currentValues.impact ?? ''}
                                        onChange={(event) => updateRatingField(competencyKey, 'impact', event.target.value)}
                                        placeholder="-"
                                      />
                                    )}
                                  </td>
                                  <td className="is-frequency">
                                    {isRowSaved ? (
                                      <span className="corelation-rating-score-value">{renderValue(currentValues.frequency)}</span>
                                    ) : !rowUsesImpactFrequency ? (
                                      <span className="corelation-rating-score-muted">-</span>
                                    ) : (
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        aria-label={`Frequency for ${row.code}`}
                                        title="Enter 1, 2, or 3"
                                        className="corelation-rating-score-input"
                                        value={currentValues.frequency ?? ''}
                                        onChange={(event) => updateRatingField(competencyKey, 'frequency', event.target.value)}
                                        placeholder="-"
                                      />
                                    )}
                                  </td>
                                </>
                              )}
                              <td className="is-rating">
                                {isRowSaved ? (
                                  <span className="corelation-rating-score-value">{renderValue(ratingValue)}</span>
                                ) : isRowTypePending ? (
                                  <input
                                    type="text"
                                    aria-label={`Rating for ${row.code}`}
                                    className="corelation-rating-score-input"
                                    value=""
                                    placeholder="-"
                                    disabled
                                    readOnly
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    aria-label={`Rating for ${row.code}`}
                                    title={rowType === 'Non-Clinical' ? 'Enter 1, 2, or 3' : 'Enter 1 to 9'}
                                    className="corelation-rating-score-input"
                                    value={ratingValue}
                                    onChange={(event) => updateManualRating(competencyKey, event.target.value, rowType)}
                                    placeholder="-"
                                  />
                                )}
                              </td>
                            </tr>
                          )
                        })}
              </tbody>
            </table>
          </div>

          <div className="corelation-rating-table-footer">
            <div>
              <span className={`corelation-rating-completion-status${isTopicComplete ? ' is-complete' : ''}`}>
                {completionStatusText}
              </span>
              {isSetupComplete && (
                <button
                  type="button"
                  className="is-save-corelation"
                  disabled={!canSaveCorrelation}
                  onClick={() => setIsSaveConfirmOpen(true)}
                >
                  {isEditingCorrelation ? 'Update Correlation' : 'Save Correlation'}
                </button>
              )}
            </div>
          </div>
            </>
          ) : (
            <div className="corelation-rating-setup-empty" role="status">
              {!selectedSubject
                ? 'Choose a subject to begin.'
                : !selectedTopic
                  ? 'Choose a topic for the selected subject.'
                  : 'Choose a type for each competency row.'}
            </div>
          )}
        </section>

        {isSaveConfirmOpen && typeof document !== 'undefined' && createPortal((
          <div className="assessment-evaluation-confirm-overlay" role="presentation">
            <div className="assessment-evaluation-confirm-modal corelation-rating-save-modal" role="dialog" aria-modal="true" aria-labelledby="corelation-save-title">
              <h2 id="corelation-save-title">{isEditingCorrelation ? 'Update Correlation' : 'Save Correlation'}</h2>
              <p>Are you sure you want to {isEditingCorrelation ? 'update' : 'save'} all completed correlation ratings for this topic?</p>
              <div className="assessment-evaluation-confirm-actions">
                <button type="button" className="is-secondary" onClick={() => setIsSaveConfirmOpen(false)}>
                  No
                </button>
                <button type="button" className="is-primary" onClick={saveCompletedCorrelationRows}>
                  Yes
                </button>
              </div>
            </div>
          </div>
        ), document.body)}

        {pendingCollapseGroupKey && typeof document !== 'undefined' && createPortal((
          <div className="assessment-evaluation-confirm-overlay" role="presentation">
            <div className="assessment-evaluation-confirm-modal corelation-rating-save-modal" role="dialog" aria-modal="true" aria-labelledby="corelation-collapse-title">
              <h2 id="corelation-collapse-title">Discard unsaved changes?</h2>
              <p>Collapsing this topic will remove the unsaved correlation selections.</p>
              <div className="assessment-evaluation-confirm-actions">
                <button type="button" className="is-secondary" onClick={() => setPendingCollapseGroupKey('')}>
                  No
                </button>
                <button type="button" className="is-primary" onClick={confirmInlineCollapse}>
                  Yes
                </button>
              </div>
            </div>
          </div>
        ), document.body)}

      </div>
    </section>
  )
}
