import { ChevronDown, Pencil, SlidersHorizontal } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import PageNavigationHeader from '../components/PageNavigationHeader'
import { corelationRatingRows } from './corelationRatingData'
import '../styles/assessment-pages.css'

const CORELATION_RATING_SAVED_ROWS_KEY = 'medsy-corelation-rating-saved-rows'
const CORELATION_RATING_RATIONALE_KEY = 'medsy-corelation-rating-rationale-values'
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
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [isSubjectMenuOpen, setIsSubjectMenuOpen] = useState(false)
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false)
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false)
  const [topicSearch, setTopicSearch] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [ratingValues, setRatingValues] = useState({})
  const [rationaleValues, setRationaleValues] = useState(() => readStoredObject(CORELATION_RATING_RATIONALE_KEY))
  const [isRationaleEnabled, setIsRationaleEnabled] = useState(true)
  const [openRationaleKey, setOpenRationaleKey] = useState('')
  const [editingRationaleKey, setEditingRationaleKey] = useState('')
  const [savedRows, setSavedRows] = useState(() => readStoredObject(CORELATION_RATING_SAVED_ROWS_KEY))
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false)
  const [activeCorrelationTab, setActiveCorrelationTab] = useState('entry')
  const [ratingMethod, setRatingMethod] = useState('direct')
  const [rowImpactFrequencyEnabled, setRowImpactFrequencyEnabled] = useState({})
  const [collapsedSavedTopics, setCollapsedSavedTopics] = useState({})
  const [savedFilterSubject, setSavedFilterSubject] = useState('')
  const [savedFilterTopic, setSavedFilterTopic] = useState('')

  useEffect(() => {
    writeStoredObject(CORELATION_RATING_SAVED_ROWS_KEY, savedRows)
  }, [savedRows])

  useEffect(() => {
    writeStoredObject(CORELATION_RATING_RATIONALE_KEY, rationaleValues)
  }, [rationaleValues])

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
      if (!selectedSubject || !selectedTopic || !selectedType) {
        return []
      }

      return corelationRatingRows.filter((row) => (
        getSubjectKey(row) === selectedSubject
        && row.topic === selectedTopic
      ))
    },
    [selectedSubject, selectedTopic, selectedType],
  )
  const isSetupComplete = Boolean(selectedSubject && selectedTopic && selectedType)
  const showImpactFrequencyFields = selectedType === 'Clinical' && ratingMethod === 'impact-frequency'
  const selectedTypeSummary = selectedType
    ? `${selectedType}${showImpactFrequencyFields ? ' / I-F' : selectedType === 'Clinical' ? ' / Direct' : ''}`
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
    setSelectedType('')
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

  const updateManualRating = (key, value) => {
    if (!/^[1-9]?$/.test(value)) {
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
    if (type === 'Non-Clinical') {
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
        impact: type === 'Non-Clinical' ? '' : current[key]?.impact,
        frequency: type === 'Non-Clinical' ? '' : current[key]?.frequency,
      },
    }))
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

    if (rowType === 'Non-Clinical') {
      return Boolean(rating)
    }

    if (values?.rating) {
      return true
    }

    if (usesImpactFrequency) {
      return Boolean(values?.impact && values?.frequency && rating)
    }

    return Boolean(rating)
  }

  const completedRowKeys = filteredCompetencies
    .map((row) => {
      const key = getCompetencyKey(row)
      const values = ratingValues[key] ?? {}
      const rowType = values.type || row.type || selectedType || 'Clinical'
      const usesImpactFrequency = rowType === 'Clinical' && (showImpactFrequencyFields || rowImpactFrequencyEnabled[key])
      return isRowComplete(values, rowType, usesImpactFrequency) ? key : null
    })
    .filter(Boolean)
  const hasCompletedUnsavedRows = completedRowKeys.some((key) => !savedRows[key])
  const topicCompetencyCount = filteredCompetencies.length
  const completedCompetencyCount = completedRowKeys.length
  const isTopicComplete = topicCompetencyCount > 0 && completedCompetencyCount === topicCompetencyCount
  const canSaveCorrelation = isTopicComplete && hasCompletedUnsavedRows
  const completionStatusText = isTopicComplete
    ? `All ${topicCompetencyCount} competencies completed`
    : `Completed ${completedCompetencyCount} of ${topicCompetencyCount} competencies`
  const savedCorrelationRows = useMemo(
    () => corelationRatingRows
      .map((row) => {
        const key = getCompetencyKey(row)
        const saved = savedRows[key]
        return saved ? { ...row, key, savedValues: saved.values ?? {} } : null
      })
      .filter(Boolean),
    [savedRows],
  )
  const savedMetricCount = savedCorrelationRows.length
  const savedSubjectOptions = useMemo(
    () => {
      const options = new Map()
      savedCorrelationRows.forEach((row) => {
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
    [savedCorrelationRows],
  )
  const savedTopicOptions = useMemo(
    () => [
      ...new Set(
        savedCorrelationRows
          .filter((row) => !savedFilterSubject || getSubjectKey(row) === savedFilterSubject)
          .map((row) => row.topic)
          .filter(Boolean),
      ),
    ],
    [savedCorrelationRows, savedFilterSubject],
  )
  const filteredSavedCorrelationRows = useMemo(
    () => savedCorrelationRows.filter((row) => (
      (!savedFilterSubject || getSubjectKey(row) === savedFilterSubject)
      && (!savedFilterTopic || row.topic === savedFilterTopic)
    )),
    [savedCorrelationRows, savedFilterSubject, savedFilterTopic],
  )
  const savedTopicGroups = useMemo(
    () => {
      const groups = new Map()
      filteredSavedCorrelationRows.forEach((row) => {
        const topic = row.topic || 'Untitled Topic'
        if (!groups.has(topic)) {
          groups.set(topic, [])
        }
        groups.get(topic).push(row)
      })

      return [...groups.entries()].map(([topic, rows]) => ({
        topic,
        rows,
      }))
    },
    [filteredSavedCorrelationRows],
  )
  const subjectCountLabel = subjectOptions.length.toString().padStart(2, '0')
  const topicCountLabel = (selectedSubject ? availableTopics.length : allTopicOptions.length).toString().padStart(2, '0')
  const correlationRatingLabel = `${savedMetricCount.toString().padStart(2, '0')} / ${corelationRatingRows.length.toString().padStart(2, '0')}`

  const saveCompletedCorrelationRows = () => {
    const currentRows = new Map(filteredCompetencies.map((row) => [getCompetencyKey(row), row]))
    setSavedRows((current) => {
      const next = { ...current }
      completedRowKeys.forEach((key) => {
        const row = currentRows.get(key)
        const values = ratingValues[key] ?? {}
        const rowType = values.type || row?.type || selectedType || 'Clinical'
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
    setIsSaveConfirmOpen(false)
  }

  const toggleSavedTopic = (topic) => {
    setCollapsedSavedTopics((current) => ({
      ...current,
      [topic]: !current[topic],
    }))
  }

  const editSavedCorrelationTopic = (rows) => {
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
    setSelectedType(firstValues.type || firstRow.type || 'Clinical')
    setRatingMethod(firstValues.impact && firstValues.frequency ? 'impact-frequency' : 'direct')
    setRatingValues((current) => ({
      ...current,
      ...nextRatingValues,
    }))
    setRowImpactFrequencyEnabled((current) => ({
      ...current,
      ...nextImpactFrequencyRows,
    }))
    setSavedRows((current) => {
      const next = { ...current }
      rows.forEach((row) => {
        delete next[row.key]
      })
      return next
    })
    setIsSubjectMenuOpen(false)
    setIsTopicMenuOpen(false)
    setIsTypeMenuOpen(false)
    setActiveCorrelationTab('entry')
  }

  return (
    <section className="vx-content assessment-page assessment-evaluation-page">
      <div className="assessment-page-shell assessment-evaluation-page-shell">
        <div className="corelation-rating-page-head">
          <PageNavigationHeader items={['My Pages', 'Correlation Rating']} />
          <div className="corelation-rating-tabs" role="tablist" aria-label="Correlation rating views">
            <button
              type="button"
              role="tab"
              aria-selected={activeCorrelationTab === 'entry'}
              className={activeCorrelationTab === 'entry' ? 'is-active' : ''}
              onClick={() => setActiveCorrelationTab('entry')}
            >
              Correlation Entry
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCorrelationTab === 'saved'}
              className={activeCorrelationTab === 'saved' ? 'is-active is-view-rating' : 'is-view-rating'}
              onClick={() => setActiveCorrelationTab('saved')}
            >
              View Correlation Rating
              <span>{correlationRatingLabel}</span>
            </button>
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
                    {['Clinical', 'Non-Clinical'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={selectedType === type}
                        className={selectedType === type ? 'is-active' : ''}
                        onClick={() => handleDefaultTypeSelect(type)}
                      >
                        <span aria-hidden="true" />
                        {type}
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
                        ? 'Choose Clinical or Non-Clinical to load competencies.'
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
              {savedCorrelationRows.length ? (
                <>
                <div className="corelation-rating-saved-filters" aria-label="Saved correlation filters">
                  <label>
                    <span>Subject</span>
                    <select
                      value={savedFilterSubject}
                      onChange={(event) => {
                        setSavedFilterSubject(event.target.value)
                        setSavedFilterTopic('')
                      }}
                    >
                      <option value="">All saved subjects</option>
                      {savedSubjectOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.year} - {option.subject}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Topic</span>
                    <select
                      value={savedFilterTopic}
                      onChange={(event) => setSavedFilterTopic(event.target.value)}
                    >
                      <option value="">All saved topics</option>
                      {savedTopicOptions.map((topic) => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {filteredSavedCorrelationRows.length ? (
                <div className="corelation-rating-saved-table-wrap">
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
                        <th>Type</th>
                        <th>Impact</th>
                        <th>Frequency</th>
                        <th>Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedTopicGroups.map((group) => {
                        const isCollapsed = Boolean(collapsedSavedTopics[group.topic])
                        const topicColumnSpan = isRationaleEnabled ? 7 : 6
                        return (
                          <Fragment key={group.topic}>
                            <tr key={`${group.topic}-topic`} className={`corelation-rating-saved-topic-row${isCollapsed ? ' is-collapsed' : ''}`}>
                              <td colSpan={topicColumnSpan}>
                                <div className="corelation-rating-saved-topic-header">
                                  <button
                                    type="button"
                                    className="corelation-rating-saved-topic-toggle"
                                    aria-expanded={!isCollapsed}
                                    onClick={() => toggleSavedTopic(group.topic)}
                                  >
                                    <ChevronDown size={15} strokeWidth={2.5} aria-hidden="true" />
                                    <span>{group.topic}</span>
                                    <strong>{group.rows.length} Competencies</strong>
                                  </button>
                                  <button
                                    type="button"
                                    className="corelation-rating-saved-topic-edit"
                                    title={`Edit ${group.topic}`}
                                    aria-label={`Edit ${group.topic}`}
                                    onClick={() => editSavedCorrelationTopic(group.rows)}
                                  >
                                    <Pencil size={13} strokeWidth={2.5} aria-hidden="true" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {!isCollapsed && group.rows.map((row) => {
                              const values = row.savedValues ?? {}
                              const rationaleValue = getRationaleValue(row.key)
                              const isRationaleLong = rationaleValue.length > 120
                              const rationalePreview = isRationaleLong ? `${rationaleValue.slice(0, 118).trim()}...` : rationaleValue
                              const isEditingRationale = editingRationaleKey === row.key
                              return (
                                <tr key={row.key}>
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
                                    <span className={`corelation-rating-type-badge ${values.type === 'Non-Clinical' ? 'is-non-clinical' : 'is-clinical'}`}>
                                      {values.type || '-'}
                                    </span>
                                  </td>
                                  <td>{renderValue(values.impact)}</td>
                                  <td>{renderValue(values.frequency)}</td>
                                  <td>{renderValue(values.rating)}</td>
                                </tr>
                              )
                            })}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                ) : (
                  <div className="corelation-rating-saved-empty">No saved correlation ratings for this filter.</div>
                )}
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
                  <th className="is-type" title="Clinical uses Impact and Frequency. Non-Clinical uses direct Rating.">Type</th>
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
                          const rowType = currentValues.type || row.type || selectedType || 'Clinical'
                          const isNonClinical = rowType === 'Non-Clinical'
                          const isRowImpactFrequencyEnabled = Boolean(rowImpactFrequencyEnabled[competencyKey])
                          const rowUsesImpactFrequency = !isNonClinical && (showImpactFrequencyFields || isRowImpactFrequencyEnabled)
                          const rowComplete = isRowComplete(currentValues, rowType, rowUsesImpactFrequency)
                          const ratingValue = getRatingValue(currentValues)
                          const isRowSaved = Boolean(savedRows[competencyKey]) && rowComplete
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
                                    {rowType}
                                  </span>
                                ) : (
                                  <div className="corelation-rating-row-type-control">
                                    <select
                                      aria-label={`Type for ${row.code}`}
                                      className="corelation-rating-type-select"
                                      value={rowType}
                                      onChange={(event) => updateRowType(competencyKey, event.target.value)}
                                    >
                                      <option value="Clinical">Clinical</option>
                                      <option value="Non-Clinical">Non-Clinical</option>
                                    </select>
                                    {!isNonClinical && !showImpactFrequencyFields && (
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
                                ) : (
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    aria-label={`Rating for ${row.code}`}
                                    className="corelation-rating-score-input"
                                    value={ratingValue}
                                    onChange={(event) => updateManualRating(competencyKey, event.target.value)}
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
                  Save Correlation
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
                  : 'Choose Clinical or Non-Clinical to load competencies.'}
            </div>
          )}
        </section>

        {isSaveConfirmOpen && typeof document !== 'undefined' && createPortal((
          <div className="assessment-evaluation-confirm-overlay" role="presentation">
            <div className="assessment-evaluation-confirm-modal corelation-rating-save-modal" role="dialog" aria-modal="true" aria-labelledby="corelation-save-title">
              <h2 id="corelation-save-title">Save Correlation</h2>
              <p>Are you sure you want to save all completed correlation ratings for this topic?</p>
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

      </div>
    </section>
  )
}
