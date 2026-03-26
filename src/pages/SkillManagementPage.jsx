import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Info,
  Image as ImageIcon,
  MoreHorizontal,
  Search,
  Sparkles,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react'

const workflowSteps = [
  {
    step: '1. Pick',
    title: 'Choose a competency',
    detail: 'Search by year, subject, or topic, then select the row you need.',
  },
  {
    step: '2. Add',
    title: 'Create activities',
    detail: 'Add OSPE, OSCE, Interpretation, or Image tasks as needed.',
  },
  {
    step: '3. Generate',
    title: 'Build the content',
    detail: 'Use Generate for AI output or create the content manually.',
  },
  {
    step: '4. Review',
    title: 'Check and assign',
    detail: 'Preview, adjust, and assign the activity to students.',
  },
]

const competencyRecords = [
  {
    id: 'an1-2',
    year: 'First Year',
    subject: 'Human Anatomy',
    topic: 'Topic 1: Anatomical terminology',
    competency: 'AN1.2 Describe composition of bone and bone marrow',
    activities: [
      {
        id: 'act-1',
        name: 'Checklist for diluting the given sample of blood for WBC count.',
        certifiable: true,
        type: 'OSPE',
        marks: 'Nil',
        status: 'Not Generated',
        assignInfo: 'First Yr MBBS',
        batch: 'Batch A • 28 students',
      },
      {
        id: 'act-2',
        name: 'Determine Blood group & RBC indices',
        certifiable: true,
        type: 'OSCE',
        marks: 'Nil',
        status: 'Generated',
        assignInfo: 'First Yr MBBS',
        batch: 'Batch A • 28 students',
      },
    ],
  },
  {
    id: 'an1-5',
    year: 'First Year',
    subject: 'Human Anatomy',
    topic: 'Topic 2: Upper limb',
    competency: 'AN1.5 Describe muscles, movements, and applied anatomy of upper limb',
    activities: [
      {
        id: 'act-3',
        name: 'Perform Spirometry and interpret the findings (Digital / Manual)',
        certifiable: true,
        type: 'Interpretation',
        marks: 'Nil',
        status: 'Not Created',
        assignInfo: 'First Yr MBBS',
        batch: 'Batch B • 24 students',
      },
    ],
  },
  {
    id: 'py2-7',
    year: 'Second Year',
    subject: 'Pathology',
    topic: 'Topic 4: Hematology',
    competency: 'PY2.7 Interpret complete blood count and peripheral smear basics',
    activities: [
      {
        id: 'act-4',
        name: 'Describe principles and methods of artificial respiration',
        certifiable: true,
        type: 'Image',
        marks: 'Nil',
        status: 'Assigned',
        assignInfo: 'Second Yr MBBS',
        batch: 'Batch C • 30 students',
      },
    ],
  },
]

const assessmentTypeGroups = [
  {
    title: 'Manual Entry',
    hint: 'Human-authored activities for image or interpretation flows.',
    options: [
      { value: 'Image', label: 'Image', tone: 'image', isAi: false },
      { value: 'Interpretation', label: 'Interpretation', tone: 'interpretation', isAi: false },
    ],
  },
  {
    title: 'AI-Generated',
    hint: 'AI-assisted setup for objective structured activity formats.',
    options: [
      { value: 'OSCE', label: 'OSCE', tone: 'osce', isAi: true },
      { value: 'OSPE', label: 'OSPE', tone: 'ospe', isAi: true },
    ],
  },
]

const defaultActivityDraft = {
  manualName: '',
  assessmentType: 'OSPE',
  includeCertifiable: false,
  includeMarks: false,
}

const generationModes = [
  { value: 'Generate All', label: 'Generate All', detail: 'Build the complete page and activity bundle.' },
  { value: 'Checklist', label: 'Checklist', detail: 'Focus on checklist-led assessment content.' },
  { value: 'Form', label: 'Form', detail: 'Draft a form-first experience for the activity.' },
  { value: 'Scaffolding', label: 'Scaffolding', detail: 'Create guided steps and supporting structure.' },
]

const generationStatusSteps = [
  { threshold: 0, label: 'Analyzing requirements...' },
  { threshold: 36, label: 'Structuring components...' },
  { threshold: 72, label: 'Finalizing layout...' },
]

function SkillManagementPage({ onGenerateComplete }) {
  const [records, setRecords] = useState(competencyRecords)
  const [selectedRecordId, setSelectedRecordId] = useState(competencyRecords[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [previewActivity, setPreviewActivity] = useState(null)
  const [builderActivity, setBuilderActivity] = useState(null)
  const [assignmentActivity, setAssignmentActivity] = useState(null)
  const [builderNotes, setBuilderNotes] = useState('Assessment instructions and checklist content')
  const [assignmentTarget, setAssignmentTarget] = useState('Batch A • 28 students')
  const [generationFlow, setGenerationFlow] = useState(null)
  const [activityFormRecordId, setActivityFormRecordId] = useState(null)
  const [activityDraft, setActivityDraft] = useState(defaultActivityDraft)
  const [yearFilter, setYearFilter] = useState('All Years')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [activeSearchField, setActiveSearchField] = useState(null)
  const [newRecord, setNewRecord] = useState({
    year: 'First Year',
    subject: 'Human Anatomy',
    topic: '',
    competency: '',
  })

  const years = ['All Years', ...new Set(records.map((record) => record.year))]
  const subjects = ['All Subjects', ...new Set(records.map((record) => record.subject))]
  const topicSuggestions = [...new Set(records.map((record) => record.topic).filter(Boolean))]
  const competencySuggestions = [...new Set(records.map((record) => record.competency).filter(Boolean))]

  const filteredRecords = records.filter((record) => {
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch = !query
      || record.competency.toLowerCase().includes(query)
      || record.topic.toLowerCase().includes(query)
    const matchesYear = yearFilter === 'All Years' || record.year === yearFilter
    const matchesSubject = subjectFilter === 'All Subjects' || record.subject === subjectFilter

    return matchesSearch && matchesYear && matchesSubject
  })

  const selectedRecord = filteredRecords.find((record) => record.id === selectedRecordId) ?? filteredRecords[0] ?? null
  const getDefaultSubject = (list) => list[0]?.subject ?? 'Human Anatomy'
  const getDefaultYear = (list) => list[0]?.year ?? 'First Year'
  const generationActivity = generationFlow
    ? records.find((record) => record.id === generationFlow.recordId)
      ?.activities.find((activity) => activity.id === generationFlow.activityId) ?? null
    : null
  const generationStatusLabel = generationStatusSteps
    .slice()
    .reverse()
    .find((step) => (generationFlow?.progress ?? 0) >= step.threshold)?.label
    ?? generationStatusSteps[0].label
  const searchFieldQuery = activeSearchField ? newRecord[activeSearchField].trim().toLowerCase() : ''
  const activeSearchSuggestions = activeSearchField === 'topic'
    ? topicSuggestions.filter((item) => item.toLowerCase().includes(searchFieldQuery)).slice(0, 5)
    : activeSearchField === 'competency'
      ? competencySuggestions.filter((item) => item.toLowerCase().includes(searchFieldQuery)).slice(0, 5)
      : []

  const handleAddRecord = () => {
    if (!newRecord.topic.trim() || !newRecord.competency.trim()) {
      return
    }

    const recordId = `record-${Date.now()}`

    setRecords((current) => [
      {
        id: recordId,
        year: newRecord.year,
        subject: newRecord.subject,
        topic: newRecord.topic.trim(),
        competency: newRecord.competency.trim(),
        activities: [],
      },
      ...current,
    ])
    setSearchQuery('')
    setYearFilter('All Years')
    setSubjectFilter('All Subjects')
    setIsAddOpen(false)
    setSelectedRecordId(recordId)
    setNewRecord({
      year: getDefaultYear(records),
      subject: getDefaultSubject(records),
      topic: '',
      competency: '',
    })
  }

  const handleOpenActivityForm = (recordId) => {
    setActivityFormRecordId(recordId)
    setActivityDraft(defaultActivityDraft)
  }

  const handleCloseActivityForm = () => {
    setActivityFormRecordId(null)
    setActivityDraft(defaultActivityDraft)
  }

  const handleActivityDraftChange = (field, value) => {
    setActivityDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSearchSuggestionPick = (field, value) => {
    setNewRecord((current) => ({
      ...current,
      [field]: value,
    }))
    setActiveSearchField(null)
  }

  const handleCreateActivity = () => {
    if (!activityFormRecordId) return

    const activityName = activityDraft.manualName.trim()

    if (!activityName) {
      return
    }

    const isAiActivity = ['OSCE', 'OSPE'].includes(activityDraft.assessmentType)

    setRecords((current) => current.map((record) => (
      record.id === activityFormRecordId
        ? {
            ...record,
            activities: [
              ...record.activities,
              {
                id: `activity-${Date.now()}`,
                name: activityName,
                certifiable: activityDraft.includeCertifiable,
                type: activityDraft.assessmentType,
                marks: activityDraft.includeMarks ? 'Yes' : 'Nil',
                showCertifiable: activityDraft.includeCertifiable,
                showMarks: activityDraft.includeMarks,
                status: isAiActivity ? 'Not Generated' : 'Not Created',
                assignInfo: 'Faculty configured',
                batch: 'No batch selected',
              },
            ],
          }
        : record
    )))

    handleCloseActivityForm()
  }

  useEffect(() => {
    if (generationFlow?.phase !== 'processing') return undefined

    const timer = window.setInterval(() => {
      setGenerationFlow((current) => {
        if (!current || current.phase !== 'processing') return current

        const pace = current.selectedMode === 'Generate All'
          ? 14
          : current.selectedMode === 'Scaffolding'
            ? 18
            : 16

        return {
          ...current,
          progress: Math.min(current.progress + pace, 100),
        }
      })
    }, 240)

    return () => window.clearInterval(timer)
  }, [generationFlow?.activityId, generationFlow?.phase, generationFlow?.recordId, generationFlow?.selectedMode])

  useEffect(() => {
    if (!generationFlow || generationFlow.phase !== 'processing' || generationFlow.progress < 100) {
      return undefined
    }

    setRecords((current) => current.map((record) => (
      record.id === generationFlow.recordId
        ? {
            ...record,
            activities: record.activities.map((activity) => (
              activity.id === generationFlow.activityId
                ? { ...activity, status: 'Generated', marks: '10' }
                : activity
            )),
          }
        : record
    )))

    setGenerationFlow((current) => {
      if (!current || current.phase !== 'processing') return current
      return { ...current, phase: 'success' }
    })
  }, [generationFlow])

  useEffect(() => {
    if (!generationFlow || generationFlow.phase !== 'success') return undefined

    const timer = window.setTimeout(() => {
      onGenerateComplete?.('Evaluation')
      setGenerationFlow(null)
    }, 1100)

    return () => window.clearTimeout(timer)
  }, [generationFlow, onGenerateComplete])

  const handleDeleteActivity = (recordId, activityId) => {
    setRecords((current) => current.map((record) => (
      record.id === recordId
        ? { ...record, activities: record.activities.filter((activity) => activity.id !== activityId) }
        : record
    )))
  }

  const findActivity = (recordId, activityId) => records
    .find((record) => record.id === recordId)
    ?.activities.find((activity) => activity.id === activityId) ?? null

  const handlePrimaryAction = (recordId, activityId) => {
    const activity = findActivity(recordId, activityId)
    if (!activity) return

    if (activity.status === 'Not Generated') {
      setGenerationFlow({
        recordId,
        activityId,
        selectedMode: '',
        phase: 'selection',
        progress: 0,
      })
      return
    }

    if (activity.status === 'Not Created') {
      setBuilderActivity({ recordId, activityId })
      setBuilderNotes('Assessment instructions and checklist content')
      return
    }

    if (activity.status === 'Generated' || activity.status === 'Created' || activity.status === 'Assigned') {
      setAssignmentActivity({ recordId, activityId })
      setAssignmentTarget(activity.batch)
    }
  }

  const handleSaveBuilder = () => {
    if (!builderActivity) return

    setRecords((current) => current.map((record) => (
      record.id === builderActivity.recordId
        ? {
            ...record,
            activities: record.activities.map((activity) => (
              activity.id === builderActivity.activityId
                ? { ...activity, status: 'Created' }
                : activity
            )),
          }
        : record
    )))
    setBuilderActivity(null)
  }

  const handleSubmitAssignment = () => {
    if (!assignmentActivity) return

    setRecords((current) => current.map((record) => (
      record.id === assignmentActivity.recordId
        ? {
            ...record,
            activities: record.activities.map((activity) => (
              activity.id === assignmentActivity.activityId
                ? { ...activity, status: 'Assigned', batch: assignmentTarget }
                : activity
            )),
          }
        : record
    )))
    setAssignmentActivity(null)
  }

  const handleSelectGenerationMode = (mode) => {
    setGenerationFlow((current) => {
      if (!current || current.phase !== 'selection') return current
      return { ...current, selectedMode: mode }
    })
  }

  const handleStartGeneration = () => {
    setGenerationFlow((current) => {
      if (!current || current.phase !== 'selection' || !current.selectedMode) return current
      return { ...current, phase: 'processing', progress: 0 }
    })
  }

  const handleCloseGenerationFlow = () => {
    setGenerationFlow(null)
  }

  const getStateConfig = (activity) => {
    if (activity.status === 'Not Generated') {
      return {
        primaryLabel: 'Generate',
        primaryTone: 'teal',
        showPreview: false,
        showDelete: true,
        showOptions: false,
        isDisabled: false,
      }
    }

    if (activity.status === 'Not Created') {
      return {
        primaryLabel: 'Create Manual',
        primaryTone: 'purple',
        showPreview: false,
        showDelete: true,
        showOptions: false,
        isDisabled: false,
      }
    }

    if (activity.status === 'Generated' || activity.status === 'Created') {
      return {
        primaryLabel: 'Review / Assign',
        primaryTone: 'orange',
        showPreview: true,
        showDelete: true,
        showOptions: false,
        isDisabled: false,
      }
    }

    return {
      primaryLabel: 'Review / Assign',
      primaryTone: 'secondary',
      showPreview: true,
      showDelete: false,
      showOptions: true,
      isDisabled: true,
    }
  }

  const getActivityPreviewText = (activity, recordId) => `Child activity under parent competency ID ${recordId}`

  const getCompetencyParts = (text) => {
    const match = text.match(/^([A-Z]+[0-9]+(?:\.[0-9]+)?)(?:\s+(.*))?$/)

    if (!match) {
      return {
        code: '',
        summary: text,
        tooltipText: text,
      }
    }

    return {
      code: match[1],
      summary: match[2] ?? '',
      tooltipText: match[2] ? `${match[1]} ${match[2]}` : match[1],
    }
  }

  const getTruncatedCompetencyText = (text, maxLength = 40) => {
    const parts = getCompetencyParts(text)

    if (!parts.code) {
      return {
        code: '',
        summary: text.length > maxLength ? `${text.slice(0, Math.max(maxLength - 3, 0))}...` : text,
        tooltipText: text,
      }
    }

    const visibleSummaryLength = Math.max(maxLength - parts.code.length - 1, 0)
    const summary = parts.summary.length > visibleSummaryLength
      ? `${parts.summary.slice(0, Math.max(visibleSummaryLength - 3, 0)).trimEnd()}...`
      : parts.summary

    return {
      ...parts,
      summary,
    }
  }

  const getTruncatedActivityName = (name) => (
    name.length > 35 ? `${name.slice(0, 32)}...` : name
  )

  return (
    <section className="vx-content forms-page">
      <div className="forms-flow-shell">
        <div className="forms-flow-head">
          <div>
            <h1>Configuration</h1>
            <p>Move from competency discovery to activity creation, review, and assignment in one clear screen.</p>
          </div>
          <button type="button" className="tool-btn green" onClick={() => setIsAddOpen(true)}>+ Add Skill Assessment</button>
        </div>

        <div className="forms-flow-steps">
          {workflowSteps.map((item) => (
            <article key={item.step} className="forms-flow-step">
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="forms-flow-panel">
          <div className="forms-flow-panel-head">
            <div>
              <h2>Competency hierarchy</h2>
              <p>Select a competency row, then manage its nested child activities and state transitions.</p>
            </div>
          </div>

          <div className="forms-flow-search forms-flow-panel-search">
            <label className="tool-input forms-flow-searchbar" htmlFor="forms-competency-search">
              <Search size={16} strokeWidth={2} />
              <input
                id="forms-competency-search"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search competency name or topic name"
                aria-label="Search competencies"
              />
            </label>
            <button type="button" className="tool-btn" onClick={() => setIsFilterOpen(true)}>Search Filter</button>
          </div>

          <div className="forms-hierarchy-list">
            {filteredRecords.map((record) => {
              const isSelected = selectedRecord?.id === record.id
              const competency = getTruncatedCompetencyText(record.competency)

              return (
                <article key={record.id} className={`forms-parent-card ${isSelected ? 'is-selected' : ''}`}>
                  <button
                    type="button"
                    className="forms-parent-row"
                    aria-label={`Select competency ${record.competency}`}
                    onClick={() => setSelectedRecordId(record.id)}
                  >
                    <span>{record.year}</span>
                    <span>{record.subject}</span>
                    <span>{record.topic}</span>
                    <span className="forms-competency-cell">
                      <span className="forms-competency-display">
                        {competency.code ? <strong className="forms-competency-code">{competency.code}</strong> : null}
                        <span className="forms-competency-summary">{competency.summary}</span>
                      </span>
                      <span className="forms-competency-tooltip" aria-hidden="true">
                        {competency.code ? <strong className="forms-competency-code">{competency.code}</strong> : null}
                        <span className="forms-competency-tooltip-text">{competency.tooltipText}</span>
                        </span>
                      </span>
                    <span className="forms-parent-action" aria-hidden="true">
                      <ChevronRight size={18} strokeWidth={2.6} />
                    </span>
                  </button>

                  {isSelected ? (
                    <div className="forms-child-panel">
                      <div className="forms-child-head">
                        <div>
                          <strong>Activities</strong>
                          <span>Parent-child relationship: activities belong to this competency record.</span>
                        </div>
                        <button type="button" className="activity-btn" onClick={() => handleOpenActivityForm(record.id)}>Add Activity</button>
                      </div>

                      {activityFormRecordId === record.id ? (
                        <div className="activity-inline-builder">
                          <div className="activity-inline-builder-head">
                            <div>
                              <span className="activity-inline-builder-kicker">Add Activity</span>
                            </div>
                            <button
                              type="button"
                              className="generation-inline-close"
                              onClick={handleCloseActivityForm}
                              aria-label="Close activity builder"
                            >
                              <X size={16} strokeWidth={2.2} />
                            </button>
                          </div>

                          <div className="activity-inline-builder-grid">
                            <label className="activity-inline-field activity-inline-field-full">
                              <span>Activity Name</span>
                              <input
                                value={activityDraft.manualName}
                                onChange={(event) => handleActivityDraftChange('manualName', event.target.value)}
                                placeholder="e.g. Clinical Assessment 2024"
                              />
                            </label>

                            <div className="activity-inline-field activity-inline-field-full">
                              <span>Show in Row</span>
                              <div className="activity-inline-types">
                                <button
                                  type="button"
                                  className={`activity-inline-type ${activityDraft.includeCertifiable ? 'active' : ''}`}
                                  onClick={() => handleActivityDraftChange('includeCertifiable', !activityDraft.includeCertifiable)}
                                >
                                  <span className="activity-inline-type-icon" aria-hidden="true">
                                    <CheckCircle2 size={14} strokeWidth={2} />
                                  </span>
                                  <span>Certifiable</span>
                                </button>
                                <button
                                  type="button"
                                  className={`activity-inline-type ${activityDraft.includeMarks ? 'active' : ''}`}
                                  onClick={() => handleActivityDraftChange('includeMarks', !activityDraft.includeMarks)}
                                >
                                  <span className="activity-inline-type-icon" aria-hidden="true">
                                    <FileText size={14} strokeWidth={2} />
                                  </span>
                                  <span>Marks</span>
                                </button>
                              </div>
                            </div>

                            <div className="activity-inline-field activity-inline-field-full">
                              <span>Assessment Type</span>
                              <div className="activity-inline-types">
                                {assessmentTypeGroups.flatMap((group) => group.options).map((option) => {
                                  const icon = option.value === 'Image'
                                    ? ImageIcon
                                    : option.value === 'Interpretation'
                                      ? FileText
                                      : option.value === 'OSCE'
                                        ? Stethoscope
                                        : Sparkles

                                  const Icon = icon
                                  const isActive = activityDraft.assessmentType === option.value

                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      className={`activity-inline-type ${isActive ? 'active' : ''}`}
                                      onClick={() => handleActivityDraftChange('assessmentType', option.value)}
                                    >
                                      <span className="activity-inline-type-icon" aria-hidden="true">
                                        <Icon size={14} strokeWidth={2} />
                                      </span>
                                      <span>{option.label}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="activity-inline-actions">
                            <button type="button" className="ghost" onClick={handleCloseActivityForm}>Cancel</button>
                            <button type="button" className="tool-btn green" onClick={handleCreateActivity}>Create Activity</button>
                          </div>
                        </div>
                      ) : null}

                      <div className="forms-flow-columns" aria-hidden="true">
                        <span>Activity Name</span>
                        <span>Certifiable</span>
                        <span>Activity</span>
                        <span>Marks</span>
                        <span>Actions</span>
                        <span>Status</span>
                        <span className="forms-flow-info-head has-tooltip" data-tooltip="Assign info">
                          <Info size={14} strokeWidth={2.2} />
                        </span>
                      </div>

                      <div className="forms-flow-rows">
                        {record.activities.map((activity) => {
                          const state = getStateConfig(activity)
                          const isProcessing = generationFlow?.recordId === record.id
                            && generationFlow?.activityId === activity.id
                            && generationFlow.phase === 'processing'

                          return (
                            <article
                              key={activity.id}
                              className={`forms-flow-row state-${activity.status.toLowerCase().replaceAll(' ', '-')} ${
                                generationFlow?.recordId === record.id
                                  && generationFlow?.activityId === activity.id
                                  && generationFlow.phase === 'selection'
                                  ? 'generation-tooltip-open'
                                  : ''
                              }`}
                            >
                              <div className="forms-flow-activity">
                                <div
                                  className="has-tooltip forms-activity-tooltip"
                                  data-tooltip={`${activity.name}\n${getActivityPreviewText(activity, record.id)}`}
                                  tabIndex={0}
                                >
                                  <strong className="forms-activity-text">
                                    {getTruncatedActivityName(activity.name)}
                                  </strong>
                                </div>
                              </div>
                              <div className="forms-flow-cell is-center">
                                {activity.showCertifiable ? (
                                  <span className="forms-certifiable">
                                    <CheckCircle2 size={16} strokeWidth={2} />
                                    Yes
                                  </span>
                                ) : (
                                  <span className="forms-badge forms-badge-neutral">Nil</span>
                                )}
                              </div>
                              <div className="forms-flow-cell is-center">
                                <span className={`t-type ${activity.type.toLowerCase()}`}>{activity.type}</span>
                              </div>
                              <div className="forms-flow-cell is-center">
                                <span className="forms-badge forms-badge-neutral">{activity.marks}</span>
                              </div>
                              <div className="forms-flow-actions">
                                <div className="forms-flow-action-main">
                                  <button
                                    type="button"
                                    className={`forms-flow-primary is-${state.primaryTone}`}
                                    onClick={() => handlePrimaryAction(record.id, activity.id)}
                                    disabled={state.isDisabled || isProcessing}
                                  >
                                    {state.primaryLabel === 'Generate' && !isProcessing ? (
                                      <Sparkles size={14} strokeWidth={2.2} aria-hidden="true" />
                                    ) : null}
                                    {isProcessing && generationFlow?.phase === 'processing'
                                      ? `Generating ${generationFlow.progress}%`
                                      : state.primaryLabel}
                                  </button>
                                  {generationFlow?.recordId === record.id && generationFlow?.activityId === activity.id ? (
                                    <div className={`generation-tooltip ${generationFlow.phase}`}>
                                      <div className="generation-tooltip-head">
                                        <span className="generation-tooltip-kicker">
                                          {generationFlow.phase === 'selection'
                                            ? 'Choose generation'
                                            : generationFlow.phase === 'processing'
                                              ? 'Generating'
                                              : 'Success'}
                                        </span>
                                        <button type="button" className="generation-tooltip-close" onClick={handleCloseGenerationFlow} aria-label="Close generation tooltip">
                                          <X size={12} strokeWidth={2.4} />
                                        </button>
                                      </div>

                                      {generationFlow.phase === 'selection' ? (
                                        <>
                                          <div className="generation-tooltip-list" role="listbox" aria-label="Generation mode">
                                            {generationModes.map((mode) => {
                                              const isActive = generationFlow.selectedMode === mode.value
                                              return (
                                                <button
                                                  key={mode.value}
                                                  type="button"
                                                  className={`generation-tooltip-item ${isActive ? 'active' : ''}`}
                                                  onClick={() => handleSelectGenerationMode(mode.value)}
                                                >
                                                  <span className="generation-tooltip-icon" aria-hidden="true">
                                                    <Sparkles size={12} strokeWidth={2.2} />
                                                  </span>
                                                  <span className="generation-tooltip-copy">
                                                    <strong>{mode.label}</strong>
                                                    <small>{mode.detail}</small>
                                                  </span>
                                                </button>
                                              )
                                            })}
                                          </div>
                                          <button
                                            type="button"
                                            className="generation-tooltip-action"
                                            onClick={handleStartGeneration}
                                            disabled={!generationFlow.selectedMode}
                                          >
                                            Generate
                                          </button>
                                        </>
                                      ) : generationFlow.phase === 'processing' ? (
                                        <div className="generation-tooltip-progress">
                                          <div className="generation-tooltip-status">
                                            <strong>{generationStatusLabel}</strong>
                                            <span>{generationFlow.progress}%</span>
                                          </div>
                                          <div className="generation-tooltip-bar" aria-hidden="true">
                                            <span style={{ width: `${generationFlow.progress}%` }} />
                                          </div>
                                          <p>
                                            {generationFlow.selectedMode}
                                            {' '}
                                            in progress.
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="generation-tooltip-success">
                                          <CheckCircle2 size={14} strokeWidth={2.4} />
                                          <span>Success. Redirecting now.</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                                <div className="forms-flow-action-icons">
                                  {state.showPreview ? (
                                    <button type="button" className="forms-icon-btn" aria-label="Preview" onClick={() => setPreviewActivity({ recordId: record.id, activityId: activity.id })}>
                                      <Eye size={16} strokeWidth={2} />
                                    </button>
                                  ) : null}
                                  {state.showDelete ? (
                                    <button type="button" className="forms-icon-btn is-danger" aria-label="Delete" onClick={() => handleDeleteActivity(record.id, activity.id)}>
                                      <Trash2 size={16} strokeWidth={2} />
                                    </button>
                                  ) : null}
                                  {state.showOptions ? (
                                    <button type="button" className="forms-icon-btn" aria-label="More options">
                                      <MoreHorizontal size={16} strokeWidth={2} />
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                              <div className="forms-flow-cell is-center">
                                <span className={`forms-badge ${activity.status === 'Assigned' ? 'forms-badge-success' : activity.status === 'Generated' || activity.status === 'Created' ? 'forms-badge-info' : 'forms-badge-danger'}`}>
                                  {activity.status}
                                </span>
                              </div>
                              <div className="forms-flow-assign is-center">
                                <button
                                  type="button"
                                  className="forms-icon-btn forms-assign-info-btn has-tooltip"
                                  aria-label={`Assign info for ${activity.name}`}
                                  data-tooltip={`Assign info: ${activity.assignInfo}\nBatch: ${activity.batch}`}
                                >
                                  <MoreHorizontal size={16} strokeWidth={2.2} />
                                </button>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </div>
      </div>

      {isFilterOpen ? (
        <div className="forms-modal-backdrop" onClick={() => setIsFilterOpen(false)} aria-hidden="true">
          <div className="forms-modal" onClick={(event) => event.stopPropagation()}>
            <div className="forms-modal-head">
              <div>
                <h3>Advanced Filter</h3>
                <p>Sort the competency list by year and subject.</p>
              </div>
              <button type="button" className="ghost" onClick={() => setIsFilterOpen(false)}>Close</button>
            </div>
            <div className="forms-modal-grid">
              <label className="forms-field">
                <span>Year</span>
                <div className="forms-select-wrap">
                  <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="forms-field">
                <span>Subject</span>
                <div className="forms-select-wrap">
                  <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </label>
            </div>
          </div>
        </div>
      ) : null}

      {isAddOpen ? (
        <div className="forms-modal-backdrop forms-modal-skill-assessment-backdrop" onClick={() => setIsAddOpen(false)} aria-hidden="true">
          <div className="forms-modal forms-modal-activity forms-modal-skill-assessment" onClick={(event) => event.stopPropagation()}>
            <div className="forms-modal-head">
              <div className="activity-modal-head-copy">
                <span className="activity-modal-kicker">Add Skill Assessment</span>
                <p>Add the year, subject, topic, and competency to create a new record.</p>
              </div>
              <button type="button" className="activity-modal-close" onClick={() => setIsAddOpen(false)} aria-label="Close skill assessment builder">
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>
            <div className="activity-config-card skill-assessment-config-card">
              <div className="activity-config-section">
                <div className="activity-config-copy">
                  <span className="activity-section-step">01</span>
                  <h4>Academic Context</h4>
                  <p>Pick the year and subject.</p>
                </div>

                <div className="forms-modal-grid skill-assessment-inline-grid">
                  <label className="forms-field">
                    <span>Year</span>
                    <div className="forms-select-wrap">
                      <select value={newRecord.year} onChange={(event) => setNewRecord((current) => ({ ...current, year: event.target.value }))}>
                        {years.filter((year) => year !== 'All Years').map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </label>
                  <label className="forms-field">
                    <span>Subject</span>
                    <div className="forms-select-wrap">
                      <select value={newRecord.subject} onChange={(event) => setNewRecord((current) => ({ ...current, subject: event.target.value }))}>
                        {subjects.filter((subject) => subject !== 'All Subjects').map((subject) => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>
              </div>

              <div className="activity-config-section skill-assessment-details-section">
                <div className="activity-config-copy">
                  <span className="activity-section-step">02</span>
                  <h4>Competency Details</h4>
                  <p>Add the topic and competency statement.</p>
                </div>

                <div className="skill-assessment-search-stack">
                  <label className="forms-field forms-field-full skill-assessment-search-field">
                    <span>Search Topic</span>
                    <input
                      value={newRecord.topic}
                      onFocus={() => setActiveSearchField('topic')}
                      onBlur={() => window.setTimeout(() => setActiveSearchField((current) => (current === 'topic' ? null : current)), 120)}
                      onChange={(event) => {
                        setNewRecord((current) => ({ ...current, topic: event.target.value }))
                        setActiveSearchField('topic')
                      }}
                      placeholder="Topic name"
                    />
                    {activeSearchField === 'topic' && activeSearchSuggestions.length ? (
                      <div className="skill-assessment-suggest-list" role="listbox" aria-label="Topic suggestions">
                        {activeSearchSuggestions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            className="skill-assessment-suggest-item"
                            onMouseDown={(event) => {
                              event.preventDefault()
                              handleSearchSuggestionPick('topic', item)
                            }}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </label>

                  <label className="forms-field forms-field-full skill-assessment-search-field">
                    <span>Search Competency</span>
                    <input
                      value={newRecord.competency}
                      onFocus={() => setActiveSearchField('competency')}
                      onBlur={() => window.setTimeout(() => setActiveSearchField((current) => (current === 'competency' ? null : current)), 120)}
                      onChange={(event) => {
                        setNewRecord((current) => ({ ...current, competency: event.target.value }))
                        setActiveSearchField('competency')
                      }}
                      placeholder="Competency name"
                    />
                    {activeSearchField === 'competency' && activeSearchSuggestions.length ? (
                      <div className="skill-assessment-suggest-list" role="listbox" aria-label="Competency suggestions">
                        {activeSearchSuggestions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            className="skill-assessment-suggest-item"
                            onMouseDown={(event) => {
                              event.preventDefault()
                              handleSearchSuggestionPick('competency', item)
                            }}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </label>
                </div>
              </div>
            </div>
            <div className="forms-modal-actions">
              <div className="activity-footer-actions">
                <button type="button" className="ghost" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="button" className="tool-btn green" onClick={handleAddRecord}>Create Record</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {builderActivity ? (
        <div className="forms-modal-backdrop" onClick={() => setBuilderActivity(null)} aria-hidden="true">
          <div className="forms-modal" onClick={(event) => event.stopPropagation()}>
            <div className="forms-modal-head">
              <div>
                <h3>Assessment Builder</h3>
                <p>Manual creation path for activities in the `Not Created` state.</p>
              </div>
              <button type="button" className="ghost" onClick={() => setBuilderActivity(null)}>Close</button>
            </div>
            <label className="forms-field forms-field-full">
              <span>Assessment Content</span>
              <textarea value={builderNotes} onChange={(event) => setBuilderNotes(event.target.value)} rows={6} />
            </label>
            <div className="forms-modal-actions">
              <button type="button" className="ghost" onClick={() => setBuilderActivity(null)}>Cancel</button>
              <button type="button" className="tool-btn green" onClick={handleSaveBuilder}>Save Assessment</button>
            </div>
          </div>
        </div>
      ) : null}

      {assignmentActivity ? (
        <div className="forms-modal-backdrop" onClick={() => setAssignmentActivity(null)} aria-hidden="true">
          <div className="forms-modal" onClick={(event) => event.stopPropagation()}>
            <div className="forms-modal-head">
              <div>
                <h3>Student Selection</h3>
                <p>Assignment path for ready or finalized activities.</p>
              </div>
              <button type="button" className="ghost" onClick={() => setAssignmentActivity(null)}>Close</button>
            </div>
            <label className="forms-field forms-field-full">
              <span>Class / Batch Assignment</span>
              <div className="forms-select-wrap">
                <select value={assignmentTarget} onChange={(event) => setAssignmentTarget(event.target.value)}>
                  <option>Batch A • 28 students</option>
                  <option>Batch B • 24 students</option>
                  <option>Batch C • 30 students</option>
                </select>
              </div>
            </label>
            <div className="forms-modal-actions">
              <button type="button" className="ghost" onClick={() => setAssignmentActivity(null)}>Cancel</button>
              <button type="button" className="tool-btn green" onClick={handleSubmitAssignment}>Submit</button>
            </div>
          </div>
        </div>
      ) : null}

      {previewActivity ? (
        <div className="forms-modal-backdrop" onClick={() => setPreviewActivity(null)} aria-hidden="true">
          <div className="forms-modal" onClick={(event) => event.stopPropagation()}>
            <div className="forms-modal-head">
              <div>
                <h3>Preview Assessment</h3>
                <p>Preview the checklist, rubric, or image task before assigning.</p>
              </div>
              <button type="button" className="ghost" onClick={() => setPreviewActivity(null)}>Close</button>
            </div>
            <div className="forms-preview-card">
              <strong>{findActivity(previewActivity.recordId, previewActivity.activityId)?.name}</strong>
              <span>Status: {findActivity(previewActivity.recordId, previewActivity.activityId)?.status}</span>
              <p>This is a lightweight preview placeholder for the generated or manually created assessment content.</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}


export default SkillManagementPage

