import { Check, ChevronDown, Pencil } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import PageNavigationHeader from '../components/PageNavigationHeader'
import { corelationRatingRows } from './corelationRatingData'
import '../styles/assessment-pages.css'

const CORELATION_PAGE_SIZE = 10

export default function BlueprintPage() {
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false)
  const [topicSearch, setTopicSearch] = useState('')
  const [collapsedTopics, setCollapsedTopics] = useState({})
  const [selectedType, setSelectedType] = useState('')
  const [ratingValues, setRatingValues] = useState({})
  const [savedRows, setSavedRows] = useState({})
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const subjectOptions = useMemo(
    () => [...new Set(corelationRatingRows.map((row) => row.subject).filter(Boolean))],
    [],
  )
  const availableTopics = useMemo(
    () => [
      ...new Set(
        corelationRatingRows
          .filter((row) => row.subject === selectedSubject)
          .map((row) => row.topic)
          .filter(Boolean),
      ),
    ],
    [selectedSubject],
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
        row.subject === selectedSubject
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
  const isSelectionLocked = Boolean(selectedSubject && selectedTopic && selectedType)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedSubject, selectedTopic, selectedType])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value)
    setSelectedTopic('')
    setIsTopicMenuOpen(false)
    setTopicSearch('')
    setCollapsedTopics({})
    setSelectedType('')
  }

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic)
    setIsTopicMenuOpen(false)
    setTopicSearch('')
    setCollapsedTopics({})
  }

  const resetCorrelationSelection = () => {
    setSelectedSubject('')
    setSelectedTopic('')
    setSelectedType('')
    setCollapsedTopics({})
    setRatingValues({})
    setSavedRows({})
    setIsSaveConfirmOpen(false)
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

  const getCompetencyKey = (row) => `${row.subject}::${row.topic}::${row.code}::${row.name}`

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

  const getRatingValue = (values) => {
    if (values?.rating) {
      return values.rating
    }

    if (!values?.impact || !values?.frequency) {
      return ''
    }

    return String(Number(values.impact) * Number(values.frequency))
  }

  const isRowComplete = (values, rowType) => {
    const rating = getRatingValue(values)

    if (rowType === 'Non-Clinical') {
      return Boolean(rating)
    }

    return Boolean(values?.impact && values?.frequency && rating)
  }

  const completedRowKeys = filteredCompetencies
    .map((row) => {
      const key = getCompetencyKey(row)
      const values = ratingValues[key] ?? {}
      const rowType = values.type || row.type || selectedType || 'Clinical'
      return isRowComplete(values, rowType) ? key : null
    })
    .filter(Boolean)
  const hasCompletedUnsavedRows = completedRowKeys.some((key) => !savedRows[key])

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
        <PageNavigationHeader items={['My Pages', 'Corelation Rating']} />

        <section className="corelation-rating-panel corelation-rating-panel-combined" aria-label="Corelation rating setup">
          <div className="corelation-rating-controls">
            <label className="corelation-rating-field">
              <span>Subject</span>
              <select value={selectedSubject} onChange={handleSubjectChange} disabled={isSelectionLocked}>
                <option value="">Choose subject</option>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </label>

            <div className="corelation-rating-field corelation-rating-topic-field">
              <span>Topics</span>
              <button
                type="button"
                className="corelation-rating-topic-trigger"
                disabled={!selectedSubject || isSelectionLocked}
                aria-expanded={isTopicMenuOpen}
                onClick={() => setIsTopicMenuOpen((current) => !current)}
              >
                <span>{selectedTopic || (selectedSubject ? 'Choose topic' : 'Select subject first')}</span>
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
                          {topic}
                        </button>
                      ))
                    ) : (
                      <span className="corelation-rating-topic-empty">No topics found</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedSubject && selectedTopic && (
              <div className="corelation-rating-field corelation-rating-type-field">
                <span className="corelation-rating-required-label">Choose Any of This <strong>*</strong></span>
                <div className="corelation-rating-type-switch" role="radiogroup" aria-label="Choose competency type">
                  {['Clinical', 'Non-Clinical'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={selectedType === type}
                      disabled={isSelectionLocked}
                      className={selectedType === type ? 'is-active' : ''}
                      onClick={() => setSelectedType(type)}
                    >
                      <span aria-hidden="true" />
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isSelectionLocked && (
              <>
                <div className="corelation-rating-actions" aria-label="Correlation rating reset action">
                  <button type="button" className="is-reset" onClick={resetCorrelationSelection}>
                    Reset Search
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="corelation-rating-table-wrap">
            <table className="corelation-rating-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Competency Name</th>
                  <th title="Clinical uses Impact and Frequency. Non-Clinical uses direct Rating.">Type</th>
                  <th title="1 low, 2 medium, 3 high">Impact</th>
                  <th title="1 low, 2 medium, 3 high">Frequency</th>
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
                          <td colSpan="7">
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
                          const rowComplete = isRowComplete(currentValues, rowType)
                          const ratingValue = getRatingValue(currentValues)
                          const isRowSaved = Boolean(savedRows[competencyKey]) && rowComplete

                          return (
                            <tr key={`${row.code}-${row.topic}-${index}`} className={`corelation-rating-child-row${rowComplete ? ' is-complete' : ''}`}>
                              <td>
                                <span className="corelation-rating-code-badge">{row.code}</span>
                              </td>
                              <td>{row.name}</td>
                              <td>
                                {isRowSaved ? (
                                  <span className={`corelation-rating-type-badge ${isNonClinical ? 'is-non-clinical' : 'is-clinical'}`}>
                                    {rowType}
                                  </span>
                                ) : (
                                  <select
                                    aria-label={`Type for ${row.code}`}
                                    className="corelation-rating-type-select"
                                    value={rowType}
                                    onChange={(event) => updateRowType(competencyKey, event.target.value)}
                                  >
                                    <option value="Clinical">Clinical</option>
                                    <option value="Non-Clinical">Non-Clinical</option>
                                  </select>
                                )}
                              </td>
                              <td>
                                {isRowSaved ? (
                                  <span className="corelation-rating-score-value">{renderValue(currentValues.impact)}</span>
                                ) : (
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    aria-label={`Impact for ${row.code}`}
                                    title={isNonClinical ? 'Impact is used only for Clinical competencies.' : 'Enter 1, 2, or 3'}
                                    className="corelation-rating-score-input"
                                    disabled={isNonClinical}
                                    value={currentValues.impact ?? ''}
                                    onChange={(event) => updateRatingField(competencyKey, 'impact', event.target.value)}
                                    placeholder="-"
                                  />
                                )}
                              </td>
                              <td>
                                {isRowSaved ? (
                                  <span className="corelation-rating-score-value">{renderValue(currentValues.frequency)}</span>
                                ) : (
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    aria-label={`Frequency for ${row.code}`}
                                    title={isNonClinical ? 'Frequency is used only for Clinical competencies.' : 'Enter 1, 2, or 3'}
                                    className="corelation-rating-score-input"
                                    disabled={isNonClinical}
                                    value={currentValues.frequency ?? ''}
                                    onChange={(event) => updateRatingField(competencyKey, 'frequency', event.target.value)}
                                    placeholder="-"
                                  />
                                )}
                              </td>
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
                ) : (
                  <tr>
                    <td colSpan="7" className="corelation-rating-empty">
                      {!selectedSubject
                        ? 'Select subject to load topics.'
                        : !selectedTopic
                          ? 'Select a topic.'
                          : !selectedType
                            ? 'Select Clinical or Non-Clinical to load competencies.'
                            : 'No competencies available for this selection.'}
                    </td>
                  </tr>
                )}
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
              {isSelectionLocked && (
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
