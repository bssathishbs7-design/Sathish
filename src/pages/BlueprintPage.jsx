import { BarChart3, BookOpen, Check, ChevronDown, ListTree, Pencil, Target, XCircle } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import PageNavigationHeader from '../components/PageNavigationHeader'
import { corelationRatingRows } from './corelationRatingData'
import '../styles/assessment-pages.css'

const CORELATION_PAGE_SIZE = 10
const getSubjectKey = (row) => `${row.year || '1st Year'}::${row.subject}`
const DEFAULT_RATIONALE = `This competency focuses on the basic structural and molecular organization of the eukaryotic cell, including the nucleus, cytoplasm, plasma membrane, and subcellular organelles. It also includes understanding the fluid mosaic model of biological membranes and the functions of cellular organelles in metabolism and homeostasis.

The learning objectives require students to identify cell structures, describe membrane organization, and explain organelle functions. These elements provide fundamental biochemical and cellular biology knowledge that forms the scientific basis for understanding later concepts in physiology and pathology.

Although applied correlations may help learners understand disease mechanisms at a molecular level, this competency primarily explains what cellular structures are and how they function rather than enabling direct clinical decision-making.

Therefore, because the competency primarily describes cellular structure, membrane composition, and organelle function without influencing immediate patient-care decisions, it is classified as foundational scientific knowledge.`

export default function BlueprintPage() {
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [isSubjectMenuOpen, setIsSubjectMenuOpen] = useState(false)
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false)
  const [topicSearch, setTopicSearch] = useState('')
  const [collapsedTopics, setCollapsedTopics] = useState({})
  const [selectedType, setSelectedType] = useState('')
  const [ratingValues, setRatingValues] = useState({})
  const [rationaleValues, setRationaleValues] = useState({})
  const [isRationaleEnabled, setIsRationaleEnabled] = useState(true)
  const [openRationaleKey, setOpenRationaleKey] = useState('')
  const [editingRationaleKey, setEditingRationaleKey] = useState('')
  const [savedRows, setSavedRows] = useState({})
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false)
  const [showImpactFrequencyFields, setShowImpactFrequencyFields] = useState(false)
  const [rowImpactFrequencyEnabled, setRowImpactFrequencyEnabled] = useState({})
  const [currentPage, setCurrentPage] = useState(1)

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
  const totalPages = Math.max(1, Math.ceil(filteredCompetencies.length / CORELATION_PAGE_SIZE))
  const paginatedCompetencies = useMemo(
    () => filteredCompetencies.slice(
      (currentPage - 1) * CORELATION_PAGE_SIZE,
      currentPage * CORELATION_PAGE_SIZE,
    ),
    [currentPage, filteredCompetencies],
  )
  const groupedCompetencies = useMemo(
    () => selectedTopic
      ? [{
        topic: selectedTopic,
        rows: paginatedCompetencies.filter((row) => row.topic === selectedTopic),
      }].filter((group) => group.rows.length)
      : [],
    [paginatedCompetencies, selectedTopic],
  )
  const pageStart = filteredCompetencies.length
    ? ((currentPage - 1) * CORELATION_PAGE_SIZE) + 1
    : 0
  const pageEnd = Math.min(currentPage * CORELATION_PAGE_SIZE, filteredCompetencies.length)
  const isSetupComplete = Boolean(selectedSubject && selectedTopic && selectedType)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedSubject, selectedTopic, selectedType])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

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
    setTopicSearch('')
    setCollapsedTopics({})
    setSelectedType('')
  }

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic)
    setIsSubjectMenuOpen(false)
    setIsTopicMenuOpen(false)
    setTopicSearch('')
    setCollapsedTopics({})
    setRatingValues({})
    setRowImpactFrequencyEnabled({})
    setSavedRows({})
    setCurrentPage(1)
  }

  const resetCorrelationSelection = () => {
    setSelectedSubject('')
    setSelectedTopic('')
    setIsSubjectMenuOpen(false)
    setSelectedType('')
    setCollapsedTopics({})
    setRatingValues({})
    setRationaleValues({})
    setIsRationaleEnabled(true)
    setOpenRationaleKey('')
    setEditingRationaleKey('')
    setSavedRows({})
    setIsSaveConfirmOpen(false)
    setShowImpactFrequencyFields(false)
    setRowImpactFrequencyEnabled({})
    setCurrentPage(1)
  }

  const toggleTopicGroup = (topic) => {
    setCollapsedTopics((current) => ({
      ...current,
      [topic]: !current[topic],
    }))
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
    setSavedRows({})
    setRowImpactFrequencyEnabled({})
    setShowImpactFrequencyFields((current) => (type === 'Clinical' ? current : false))
    setCurrentPage(1)
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

    if (rowType === 'Non-Clinical' || !usesImpactFrequency) {
      return Boolean(rating)
    }

    return Boolean(values?.impact && values?.frequency && rating)
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
  const metricCompetencyRows = useMemo(
    () => corelationRatingRows.filter((row) => (
      (!selectedSubject || getSubjectKey(row) === selectedSubject)
      && (!selectedTopic || row.topic === selectedTopic)
    )),
    [selectedSubject, selectedTopic],
  )
  const savedMetricCount = metricCompetencyRows.filter((row) => savedRows[getCompetencyKey(row)]).length
  const correlationMetrics = [
    {
      label: 'Subjects',
      value: subjectOptions.length.toString().padStart(2, '0'),
      icon: BookOpen,
      tone: 'is-subjects',
    },
    {
      label: 'Topics',
      value: (selectedSubject ? availableTopics.length : allTopicOptions.length).toString().padStart(2, '0'),
      icon: ListTree,
      tone: 'is-topics',
    },
    {
      label: 'Competency',
      value: metricCompetencyRows.length.toString().padStart(2, '0'),
      icon: Target,
      tone: 'is-competency',
    },
    {
      label: 'Correlation Rating',
      value: `${savedMetricCount.toString().padStart(2, '0')} / ${metricCompetencyRows.length.toString().padStart(2, '0')}`,
      icon: BarChart3,
      tone: 'is-rating',
    },
  ]

  const saveCompletedCorrelationRows = () => {
    setSavedRows((current) => {
      const next = { ...current }
      completedRowKeys.forEach((key) => {
        next[key] = true
      })
      return next
    })
    setIsSaveConfirmOpen(false)
  }

  const editSavedCorrelationRow = (key) => {
    setSavedRows((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  return (
    <section className="vx-content assessment-page assessment-evaluation-page">
      <div className="assessment-page-shell assessment-evaluation-page-shell">
        <PageNavigationHeader items={['My Pages', 'Correlation Rating']} />

        <section className="corelation-rating-metrics" aria-label="Correlation rating metrics">
          {correlationMetrics.map((metric) => {
            const MetricIcon = metric.icon
            return (
              <div key={metric.label} className={`corelation-rating-metric ${metric.tone}`}>
                <span aria-hidden="true">
                  <MetricIcon size={15} strokeWidth={2.4} />
                </span>
                <div>
                  <small>{metric.label}</small>
                  <strong>{metric.value}</strong>
                </div>
              </div>
            )
          })}
        </section>

        <section className="corelation-rating-panel corelation-rating-panel-combined" aria-label="Correlation rating setup">
          <div className="corelation-rating-controls">
            <div className="corelation-rating-field corelation-rating-subject-field">
              <span>Subject</span>
              <button
                type="button"
                className="corelation-rating-topic-trigger corelation-rating-subject-trigger"
                aria-expanded={isSubjectMenuOpen}
                onClick={() => {
                  setIsSubjectMenuOpen((current) => !current)
                  setIsTopicMenuOpen(false)
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
              <span>Topics</span>
              <button
                type="button"
                className="corelation-rating-topic-trigger"
                disabled={!selectedSubject}
                aria-expanded={isTopicMenuOpen}
                onClick={() => setIsTopicMenuOpen((current) => !current)}
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
              <span className="corelation-rating-required-label">Competency Type <strong>*</strong></span>
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
                  <label className="corelation-rating-impact-toggle">
                    <input
                      type="checkbox"
                      checked={showImpactFrequencyFields}
                      onChange={(event) => setShowImpactFrequencyFields(event.target.checked)}
                    />
                    <span>Impact + Frequency</span>
                  </label>
                )}
                <small className="corelation-rating-type-help">
                  {!selectedType
                    ? 'Choose Clinical or Non-Clinical to load competencies.'
                    : selectedType === 'Clinical'
                      ? 'Use Impact + Frequency when needed, or enter direct Rating.'
                      : 'Enter direct Rating only.'}
                </small>
              </div>
            </div>

            <div className="corelation-rating-actions" aria-label="Correlation rating reset action">
              <button
                type="button"
                className="is-reset"
                disabled={!selectedSubject && !selectedTopic && !selectedType}
                onClick={resetCorrelationSelection}
              >
                <XCircle size={14} strokeWidth={2.4} aria-hidden="true" />
                Clear
              </button>
            </div>
          </div>

          {isSetupComplete ? (
            <>
          <div className="corelation-rating-table-wrap">
            <table className={`corelation-rating-table${isRationaleEnabled ? '' : ' is-rationale-off'}${displayImpactFrequencyColumns ? '' : ' is-impact-frequency-hidden'}`}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Competency Name</th>
                  <th>
                    <div className="corelation-rating-rationale-head">
                      <span>Rationale</span>
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
                    </div>
                  </th>
                  <th title="Clinical uses Impact and Frequency. Non-Clinical uses direct Rating.">Type</th>
                  {displayImpactFrequencyColumns && (
                    <>
                      <th title="1 low, 2 medium, 3 high">Impact</th>
                      <th title="1 low, 2 medium, 3 high">Frequency</th>
                    </>
                  )}
                  <th title="Auto: Impact × Frequency, or enter 1-9 directly">Rating</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {groupedCompetencies.length ? (
                  groupedCompetencies.map((group) => {
                    const isCollapsed = Boolean(collapsedTopics[group.topic])
                    return (
                      <Fragment key={group.topic}>
                        <tr key={`${group.topic}-heading`} className="corelation-rating-topic-row">
                          <td colSpan={displayImpactFrequencyColumns ? 8 : 6}>
                            <button
                              type="button"
                              onClick={() => toggleTopicGroup(group.topic)}
                              aria-expanded={!isCollapsed}
                            >
                              <ChevronDown size={16} strokeWidth={2.5} aria-hidden="true" />
                              <span>{group.topic}</span>
                              <strong>{group.rows.length} Competencies</strong>
                            </button>
                          </td>
                        </tr>
                        {!isCollapsed && group.rows.map((row, index) => {
                          const competencyKey = getCompetencyKey(row)
                          const currentValues = ratingValues[competencyKey] ?? {}
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
                              <td>
                                <span className="corelation-rating-code-badge">{row.code}</span>
                              </td>
                              <td>{row.name}</td>
                              <td>
                                {isRationaleEnabled ? (
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
                                ) : (
                                  <span className="corelation-rating-rationale-off">-</span>
                                )}
                              </td>
                              <td>
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
                                  <td>
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
                                  <td>
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
                              <td>
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
                              <td>
                                {isRowSaved ? (
                                  <button
                                    type="button"
                                    className="corelation-rating-edit-row"
                                    title="Edit saved row"
                                    aria-label={`Edit ${row.code}`}
                                    onClick={() => editSavedCorrelationRow(competencyKey)}
                                  >
                                    <Pencil size={13} strokeWidth={2.5} aria-hidden="true" />
                                  </button>
                                ) : rowComplete && (
                                  <span className="corelation-rating-complete-icon" title="Completed">
                                    <Check size={13} strokeWidth={3} aria-hidden="true" />
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </Fragment>
                    )
                  })
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="corelation-rating-table-footer">
            <span>Showing {pageStart}-{pageEnd} of {filteredCompetencies.length}</span>
            <div>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Next
              </button>
              {isSetupComplete && (
                <button
                  type="button"
                  className="is-save-corelation"
                  disabled={!hasCompletedUnsavedRows}
                  onClick={() => setIsSaveConfirmOpen(true)}
                >
                  Save Coreleation
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
              <h2 id="corelation-save-title">Save Coreleation</h2>
              <p>Are you sure you want to save the completed coreleation ratings?</p>
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
