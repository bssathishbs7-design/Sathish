import { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardPlus,
  Eye,
  FlaskConical,
  FileSignature,
  FileText,
  Info,
  Image as ImageIcon,
  ListChecks,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import { APP_PAGES } from '../config/appPages'
import PageBreadcrumbs from '../components/PageBreadcrumbs'
import '../styles/config/skill-management.css'

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
      {
        id: 'act-5',
        name: 'Identify major upper limb landmarks from labeled specimen images',
        certifiable: true,
        type: 'Image',
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
  { value: 'Checklist', label: 'Checklist', detail: 'Focus on checklist-led assessment content.' },
  { value: 'Form', label: 'Form', detail: 'Draft a form-first experience for the activity.' },
  { value: 'Scaffolding', label: 'Scaffolding', detail: 'Create guided steps and supporting structure.' },
]

const generationStatusSteps = [
  { threshold: 0, label: 'Analyzing requirements...' },
  { threshold: 36, label: 'Structuring components...' },
  { threshold: 72, label: 'Finalizing layout...' },
]

/**
 * SkillManagementPage Implementation Contract
 * Structure:
 * - Configuration workflow for competency discovery, activity creation, generation, preview, and assignment.
 * Dependencies:
 * - React local state/effects
 * - lucide-react icons
 * - shared app page ids from src/config/appPages.js
 * Props / Data:
 * - onGenerateComplete controls cross-page navigation after generation
 * - onOpenImageActivity opens the dedicated Image Activity workflow with selected record data
 * State:
 * - Owns record filtering, modal visibility, generation flow, activity creation draft, and local table interactions
 * Hooks / Providers:
 * - No extra provider is required; this page is self-contained and passes selected activity upward only when needed
 * Required assets:
 * - Uses in-file seed competency/activity data for the configuration flow
 * Responsive behavior:
 * - Search, filters, table actions, nested rows, and modal flows must remain accessible across breakpoints
 * Placement:
 * - Page-level workflow in src/pages/
 */
function SkillManagementPage({ onGenerateComplete, onOpenImageActivity, onOpenInterpretationActivity, onOpenOspeActivity, onAlert, savedImageActivities = {} }) {
  const generationPopoverRef = useRef(null)
  const handledGenerationSuccessRef = useRef('')
  const activityNameInputRef = useRef(null)
  const [records, setRecords] = useState(competencyRecords)
  const [selectedRecordId, setSelectedRecordId] = useState(competencyRecords[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [builderActivity, setBuilderActivity] = useState(null)
  const [builderNotes, setBuilderNotes] = useState('Assessment instructions and checklist content')
  const [generationFlow, setGenerationFlow] = useState(null)
  const [pendingOspeOpen, setPendingOspeOpen] = useState(null)
  const [activityFormRecordId, setActivityFormRecordId] = useState(null)
  const [activityDraft, setActivityDraft] = useState(defaultActivityDraft)
  const [yearFilter, setYearFilter] = useState('All Years')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [activityTypeFilter, setActivityTypeFilter] = useState('All Activities')
  const [certifiableFilter, setCertifiableFilter] = useState('All Certifiable')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [activeSearchField, setActiveSearchField] = useState(null)
  const [newRecord, setNewRecord] = useState({
    year: 'First Year',
    subject: 'Human Anatomy',
    topic: '',
    competency: '',
  })

  const years = ['All Years', ...new Set(records.map((record) => record.year))]
  const subjects = ['All Subjects', ...new Set(records.map((record) => record.subject))]
  const activityTypeOptions = ['All Activities', ...new Set(records.flatMap((record) => record.activities.map((activity) => activity.type)).filter(Boolean))]
  const topicSuggestions = [...new Set(records.map((record) => record.topic).filter(Boolean))]
  const competencySuggestions = [...new Set(records.map((record) => record.competency).filter(Boolean))]
  const hasActiveListFilters = yearFilter !== 'All Years'
    || subjectFilter !== 'All Subjects'
    || activityTypeFilter !== 'All Activities'
    || certifiableFilter !== 'All Certifiable'
    || statusFilter !== 'All Statuses'

  const activeListFilterCount = [
    yearFilter !== 'All Years',
    subjectFilter !== 'All Subjects',
    activityTypeFilter !== 'All Activities',
    certifiableFilter !== 'All Certifiable',
    statusFilter !== 'All Statuses',
  ].filter(Boolean).length

  const filteredRecords = records.filter((record) => {
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch = !query
      || record.competency.toLowerCase().includes(query)
      || record.topic.toLowerCase().includes(query)
    const matchesYear = yearFilter === 'All Years' || record.year === yearFilter
    const matchesSubject = subjectFilter === 'All Subjects' || record.subject === subjectFilter
    const matchesActivityType = activityTypeFilter === 'All Activities'
      || record.activities.some((activity) => activity.type === activityTypeFilter)
    const matchesCertifiable = certifiableFilter === 'All Certifiable'
      || record.activities.some((activity) => (certifiableFilter === 'Certifiable' ? activity.certifiable : !activity.certifiable))
    const matchesStatus = statusFilter === 'All Statuses'
      || record.activities.some((activity) => activity.status === statusFilter)

    return matchesSearch && matchesYear && matchesSubject && matchesActivityType && matchesCertifiable && matchesStatus
  })

  const selectedRecord = filteredRecords.find((record) => record.id === selectedRecordId) ?? filteredRecords[0] ?? null
  const getDefaultSubject = (list) => list[0]?.subject ?? 'Human Anatomy'
  const getDefaultYear = (list) => list[0]?.year ?? 'First Year'
  const generationSelectionLabel = generationFlow?.selectedModes?.join(', ') ?? ''
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
      onAlert?.({ tone: 'warning', message: 'Complete the topic and competency fields before creating a record.' })
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
    onAlert?.({ tone: 'secondary', message: 'Configuration record created successfully.' })
  }

  const handleOpenActivityForm = (recordId) => {
    setActivityFormRecordId(recordId)
    setActivityDraft(defaultActivityDraft)
  }

  const handleCloseActivityForm = () => {
    setActivityFormRecordId(null)
    setActivityDraft(defaultActivityDraft)
  }

  useEffect(() => {
    if (!activityFormRecordId) return undefined

    const frameId = window.requestAnimationFrame(() => {
      activityNameInputRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [activityFormRecordId])

  const handleClearListFilters = () => {
    setYearFilter('All Years')
    setSubjectFilter('All Subjects')
    setActivityTypeFilter('All Activities')
    setCertifiableFilter('All Certifiable')
    setStatusFilter('All Statuses')
  }

  const openAssociatedActivityPage = (record, activity, options = {}) => {
    if (!activity) return
    const { openReviewAssign = false } = options

    const recordPayload = record
      ? {
          year: record.year,
          subject: record.subject,
          competency: record.competency,
          topic: record.topic,
        }
      : null

    if (activity.type === 'Image') {
      const savedPayload = savedImageActivities[activity.id]
      onOpenImageActivity?.(
        savedPayload
          ? { ...savedPayload, openReviewAssign }
          : { activity, record: recordPayload, openReviewAssign },
      )
      return
    }

    if (activity.type === 'Interpretation') {
      onOpenInterpretationActivity?.({ activity, record: recordPayload, openReviewAssign })
      return
    }

    if (activity.type === 'OSPE' || activity.type === 'OSCE') {
      onOpenOspeActivity?.({ activity, record: recordPayload, generatedModes: activity.generatedModes ?? ['Checklist'], openReviewAssign })
      return
    }

    onAlert?.({ tone: 'primary', message: 'This activity page is not connected yet.' })
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
      onAlert?.({ tone: 'warning', message: 'Enter an activity name before creating the activity.' })
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
    onAlert?.({ tone: 'secondary', message: 'Activity created successfully.' })
  }

  useEffect(() => {
    if (generationFlow?.phase !== 'processing') return undefined

    const timer = window.setInterval(() => {
      setGenerationFlow((current) => {
        if (!current || current.phase !== 'processing') return current

        const hasScaffolding = current.selectedModes.includes('Scaffolding')
        const pace = hasScaffolding ? 18 : 16
        const nextProgress = Math.min(current.progress + pace, 100)

        if (nextProgress >= 100) {
          const generatedActivitySnapshot = {
            ...current.activitySnapshot,
            status: 'Generated',
            marks: '10',
            generatedModes: current.selectedModes,
          }

          setRecords((existingRecords) => existingRecords.map((record) => (
            record.id === current.recordId
              ? {
                  ...record,
                  activities: record.activities.map((activity) => (
                    activity.id === current.activityId
                      ? { ...activity, status: 'Generated', marks: '10', generatedModes: current.selectedModes }
                      : activity
                  )),
                }
              : record
          )))

          if (current.activityType === 'OSPE' || current.activityType === 'OSCE') {
            setPendingOspeOpen({
              activity: generatedActivitySnapshot,
              record: current.recordSnapshot,
              generatedModes: current.selectedModes,
            })
          }

          return {
            ...current,
            activitySnapshot: generatedActivitySnapshot,
            progress: 100,
            phase: 'success',
          }
        }

        return {
          ...current,
          progress: nextProgress,
        }
      })
    }, 240)

    return () => window.clearInterval(timer)
  }, [generationFlow?.activityId, generationFlow?.phase, generationFlow?.recordId, generationFlow?.selectedModes])

  useEffect(() => {
    if (!generationFlow) return undefined

    const handlePointerDown = (event) => {
      if (generationPopoverRef.current?.contains(event.target)) return
      setGenerationFlow(null)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [generationFlow])

  useEffect(() => {
    if (!generationFlow || generationFlow.phase !== 'success') return undefined

    const successKey = `${generationFlow.recordId}-${generationFlow.activityId}`
    if (handledGenerationSuccessRef.current === successKey) return undefined

    handledGenerationSuccessRef.current = successKey

    onAlert?.({ tone: 'secondary', message: 'Activity generation completed successfully.' })
    if (generationFlow.activityType !== 'OSPE' && generationFlow.activityType !== 'OSCE') {
      onGenerateComplete?.(APP_PAGES.EVALUATION)
    }
    setGenerationFlow(null)
    return undefined
  }, [generationFlow, onAlert, onGenerateComplete, onOpenOspeActivity])

  useEffect(() => {
    if (!pendingOspeOpen) return undefined

    onAlert?.({ tone: 'secondary', message: 'Activity generation completed successfully.' })
    onOpenOspeActivity?.(pendingOspeOpen)
    setPendingOspeOpen(null)
    setGenerationFlow(null)
    return undefined
  }, [onAlert, onOpenOspeActivity, pendingOspeOpen])

  const handleDeleteActivity = (recordId, activityId) => {
    setRecords((current) => current.map((record) => (
      record.id === recordId
        ? { ...record, activities: record.activities.filter((activity) => activity.id !== activityId) }
        : record
    )))
    onAlert?.({ tone: 'danger', message: 'Activity removed from the configuration list.' })
  }

  const findActivity = (recordId, activityId) => records
    .find((record) => record.id === recordId)
    ?.activities.find((activity) => activity.id === activityId) ?? null

  const assignActivityToDefaultBatch = (recordId, activityId, batch = 'Batch A • 28 students') => {
    setRecords((current) => current.map((record) => (
      record.id === recordId
        ? {
            ...record,
            activities: record.activities.map((activity) => (
              activity.id === activityId
                ? { ...activity, status: 'Assigned', batch }
                : activity
            )),
          }
        : record
    )))
    onAlert?.({ tone: 'secondary', message: 'Assessment assigned successfully.' })
  }

  const handlePrimaryAction = (recordId, activityId) => {
    const activity = findActivity(recordId, activityId)
    const record = records.find((item) => item.id === recordId)
    const savedImageActivity = activity?.type === 'Image' ? savedImageActivities[activity.id] : null
    if (!activity) return

    if (activity.status === 'Not Generated') {
      handledGenerationSuccessRef.current = ''
      setGenerationFlow({
        recordId,
        activityId,
        activityType: activity.type,
        activitySnapshot: activity,
        recordSnapshot: record
          ? {
              year: record.year,
              subject: record.subject,
              competency: record.competency,
              topic: record.topic,
            }
          : null,
        selectedModes: ['Checklist'],
        phase: 'selection',
        progress: 0,
      })
      return
    }

    if (activity.status === 'Not Created') {
      if (savedImageActivity) {
        assignActivityToDefaultBatch(recordId, activityId, activity.batch && activity.batch !== 'No batch selected' ? activity.batch : 'Batch A • 28 students')
        return
      }

      if (activity.type === 'Image') {
        onOpenImageActivity?.({
          activity,
          record: record
            ? {
                year: record.year,
                subject: record.subject,
                competency: record.competency,
                topic: record.topic,
              }
            : null,
        })
        return
      }

      if (activity.type === 'Interpretation') {
        onOpenInterpretationActivity?.({
          activity,
          record: record
            ? {
                year: record.year,
                subject: record.subject,
                competency: record.competency,
                topic: record.topic,
              }
            : null,
        })
        return
      }

      setBuilderActivity({ recordId, activityId })
      setBuilderNotes('Assessment instructions and checklist content')
      return
    }

    if (activity.status === 'Generated' || activity.status === 'Created' || activity.status === 'Assigned') {
      openAssociatedActivityPage(record, activity, { openReviewAssign: true })
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
    onAlert?.({ tone: 'secondary', message: 'Manual assessment saved successfully.' })
  }

  const handleSelectGenerationMode = (mode) => {
    setGenerationFlow((current) => {
      if (!current || current.phase !== 'selection') return current

      const isActive = current.selectedModes.includes(mode)

      if (mode === 'Checklist') {
        const selectedModes = isActive ? [] : ['Checklist']
        return { ...current, selectedModes }
      }

      if (!current.selectedModes.includes('Checklist')) {
        return current
      }

      const selectedModes = isActive
        ? current.selectedModes.filter((item) => item !== mode)
        : [...current.selectedModes, mode]

      return { ...current, selectedModes }
    })
  }

  const handleStartGeneration = () => {
    setGenerationFlow((current) => {
      if (!current || current.phase !== 'selection') return current
      if (current.selectedModes.length === 0) {
        onAlert?.({ tone: 'warning', message: 'Select at least one generation mode before continuing.' })
        return current
      }
      handledGenerationSuccessRef.current = ''
      return { ...current, phase: 'processing', progress: 0 }
    })
  }

  const handleCloseGenerationFlow = () => {
    setGenerationFlow(null)
  }

  const handleSelectAllGenerationModes = () => {
    setGenerationFlow((current) => {
      if (!current || current.phase !== 'selection') return current
      const hasAllSelected = generationModes.every((mode) => current.selectedModes.includes(mode.value))

      if (hasAllSelected) {
        return {
          ...current,
          selectedModes: ['Checklist'],
        }
      }

      return {
        ...current,
        selectedModes: generationModes.map((mode) => mode.value),
      }
    })
  }

  const hasAllGenerationModesSelected = generationModes.every((mode) => generationFlow?.selectedModes?.includes(mode.value))

  const canOpenActivityFromRow = (activity) => {
    const savedImageActivity = activity.type === 'Image' ? savedImageActivities[activity.id] : null
    return Boolean(savedImageActivity) || activity.status === 'Created' || activity.status === 'Assigned'
  }

  const getStateConfig = (activity) => {
    const savedImageActivity = activity.type === 'Image' ? savedImageActivities[activity.id] : null

    if (savedImageActivity) {
      return {
        primaryLabel: 'Review / Assign',
        primaryTone: 'orange',
        showPreview: true,
        showDelete: true,
        showOptions: false,
        isDisabled: false,
      }
    }

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
    <section className="vx-content forms-page configuration-page">
      <div className="forms-flow-shell">
        <PageBreadcrumbs items={[{ label: 'Skills' }, { label: 'Configuration' }]} />
        <div className="vx-page-intro">
          <div className="vx-page-intro-title">
            <SlidersHorizontal size={18} strokeWidth={2} aria-hidden="true" />
            <h1>Configuration</h1>
          </div>
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
            <button
              type="button"
              className={`tool-btn forms-inline-filter-toggle ${isFilterOpen || hasActiveListFilters ? 'is-active' : ''}`}
              onClick={() => setIsFilterOpen((current) => !current)}
              aria-expanded={isFilterOpen}
              aria-controls="configuration-inline-filters"
              aria-label={isFilterOpen ? 'Hide search filters' : 'Show search filters'}
              title={isFilterOpen ? 'Hide search filters' : 'Show search filters'}
            >
              <SlidersHorizontal size={16} strokeWidth={2.2} />
              {activeListFilterCount ? (
                <span className="forms-inline-filter-toggle-badge" aria-hidden="true">
                  {activeListFilterCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className="tool-btn green"
              onClick={() => setIsAddOpen((current) => !current)}
              aria-expanded={isAddOpen}
              aria-controls="configuration-add-competency-panel"
            >
              <ClipboardPlus size={15} strokeWidth={2.2} />
              Add Competency
            </button>
          </div>

          {isAddOpen ? (
            <div id="configuration-add-competency-panel" className="configuration-inline-compact-builder">
              <div className="configuration-inline-compact-grid">
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

                <label className="forms-field skill-assessment-search-field">
                  <span>Topic</span>
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

                <label className="forms-field skill-assessment-search-field">
                  <span>Competency</span>
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

              <div className="configuration-inline-compact-actions">
                <button type="button" className="ghost" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="button" className="tool-btn green" onClick={handleAddRecord}>Create Competency</button>
              </div>
            </div>
          ) : null}

          {isFilterOpen ? (
            <div id="configuration-inline-filters" className="forms-inline-filter-panel">
              <div className="forms-inline-filter-panel-head">
                <div>
                  <strong>Refine Competency List</strong>
                  <p>Filter the configuration records by year and subject without leaving this page.</p>
                </div>
              </div>
              <div className="forms-inline-filter-grid">
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
                <label className="forms-field">
                  <span>Activity</span>
                  <div className="forms-select-wrap">
                    <select value={activityTypeFilter} onChange={(event) => setActivityTypeFilter(event.target.value)}>
                      {activityTypeOptions.map((activityType) => (
                        <option key={activityType} value={activityType}>{activityType}</option>
                      ))}
                    </select>
                  </div>
                </label>
                <label className="forms-field">
                  <span>Certifiable</span>
                  <div className="forms-select-wrap">
                    <select value={certifiableFilter} onChange={(event) => setCertifiableFilter(event.target.value)}>
                      <option>All Certifiable</option>
                      <option>Certifiable</option>
                      <option>Non-Certifiable</option>
                    </select>
                  </div>
                </label>
                <label className="forms-field">
                  <span>Status</span>
                  <div className="forms-select-wrap">
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                      <option>All Statuses</option>
                      <option>Not Generated</option>
                      <option>Generated</option>
                      <option>Not Created</option>
                      <option>Created</option>
                      <option>Assigned</option>
                    </select>
                  </div>
                </label>
              </div>
              <div className="forms-inline-filter-footer">
                <div className="forms-inline-filter-chips" aria-live="polite">
                  {hasActiveListFilters ? (
                    <>
                      {yearFilter !== 'All Years' ? <span className="forms-inline-filter-chip">{yearFilter}</span> : null}
                      {subjectFilter !== 'All Subjects' ? <span className="forms-inline-filter-chip">{subjectFilter}</span> : null}
                      {activityTypeFilter !== 'All Activities' ? <span className="forms-inline-filter-chip">{activityTypeFilter}</span> : null}
                      {certifiableFilter !== 'All Certifiable' ? <span className="forms-inline-filter-chip">{certifiableFilter}</span> : null}
                      {statusFilter !== 'All Statuses' ? <span className="forms-inline-filter-chip">{statusFilter}</span> : null}
                    </>
                  ) : (
                    <span className="forms-inline-filter-hint">No filters applied</span>
                  )}
                </div>
                <div className="forms-inline-filter-actions">
                  <button type="button" className="ghost" onClick={() => setIsFilterOpen(false)}>Cancel</button>
                  {hasActiveListFilters ? (
                    <button type="button" className="ghost" onClick={handleClearListFilters}>Clear</button>
                  ) : null}
                  <button type="button" className="tool-btn green" onClick={() => setIsFilterOpen(false)}>Apply</button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="forms-hierarchy-list">
            {filteredRecords.map((record) => {
              const isSelected = selectedRecord?.id === record.id
              const competency = getTruncatedCompetencyText(record.competency)

              return (
                <article key={record.id} className={`forms-parent-card ${isSelected ? 'is-selected' : ''}`}>
                  <button
                    type="button"
                    className={`forms-parent-row ${isSelected ? 'is-tooltip-active' : ''}`}
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
                      {isSelected ? <ChevronDown size={18} strokeWidth={2.6} /> : <ChevronRight size={18} strokeWidth={2.6} />}
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
                                ref={activityNameInputRef}
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
                                        : FlaskConical

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
                          const isRowNavigable = canOpenActivityFromRow(activity)
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
                              } ${
                                isRowNavigable ? 'is-row-navigable' : ''
                              }`}
                              onClick={isRowNavigable ? () => openAssociatedActivityPage(record, activity) : undefined}
                              onKeyDown={isRowNavigable ? (event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault()
                                  openAssociatedActivityPage(record, activity)
                                }
                              } : undefined}
                              role={isRowNavigable ? 'button' : undefined}
                              tabIndex={isRowNavigable ? 0 : -1}
                            >
                              <div className="forms-flow-activity" data-label="Activity Name">
                                <div
                                  className={`forms-activity-tooltip ${isSelected ? 'has-tooltip' : ''}`}
                                  data-tooltip={isSelected ? `${activity.name}\n${getActivityPreviewText(activity, record.id)}` : undefined}
                                  tabIndex={isSelected ? 0 : undefined}
                                >
                                  <strong className="forms-activity-text">
                                    {getTruncatedActivityName(activity.name)}
                                  </strong>
                                </div>
                              </div>
                              <div className="forms-flow-cell is-center" data-label="Certifiable">
                                {activity.showCertifiable ? (
                                  <span className="forms-certifiable">
                                    <CheckCircle2 size={16} strokeWidth={2} />
                                    Yes
                                  </span>
                                ) : (
                                  <span className="forms-badge forms-badge-neutral">Nil</span>
                                )}
                              </div>
                              <div className="forms-flow-cell is-center" data-label="Activity Type">
                                <span className={`t-type ${activity.type.toLowerCase()}`}>{activity.type}</span>
                              </div>
                              <div className="forms-flow-cell is-center" data-label="Marks">
                                <span className="forms-badge forms-badge-neutral">{activity.marks}</span>
                              </div>
                              <div className="forms-flow-actions" data-label="Actions" onClick={(event) => event.stopPropagation()}>
                                <div
                                  className="forms-flow-action-main"
                                  ref={generationFlow?.recordId === record.id && generationFlow?.activityId === activity.id ? generationPopoverRef : null}
                                >
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
                                  {generationFlow?.recordId === record.id
                                  && generationFlow?.activityId === activity.id
                                  && generationFlow.phase !== 'success' ? (
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
                                          <div className="generation-tooltip-list" role="listbox" aria-label="Generation modes">
                                            {generationModes.filter((mode) => mode.value === 'Checklist').map((mode) => {
                                              const isActive = generationFlow.selectedModes.includes(mode.value)
                                              return (
                                                <button
                                                  key={mode.value}
                                                  type="button"
                                                  className={`generation-tooltip-item ${isActive ? 'active' : ''}`}
                                                  onClick={() => handleSelectGenerationMode(mode.value)}
                                                  aria-pressed={isActive}
                                                >
                                                  <span className="generation-tooltip-icon" aria-hidden="true">
                                                    <ListChecks size={13} strokeWidth={2.2} />
                                                  </span>
                                                  <span className="generation-tooltip-copy">
                                                    <strong>{mode.label}</strong>
                                                    <small>Required base output.</small>
                                                  </span>
                                                </button>
                                              )
                                            })}
                                          </div>
                                          <div className="generation-tooltip-section">
                                            <div className="generation-tooltip-section-head">
                                              <span>Add-ons</span>
                                              <button
                                                type="button"
                                                className="generation-tooltip-link"
                                                onClick={handleSelectAllGenerationModes}
                                              >
                                                {hasAllGenerationModesSelected ? 'Unselect add-ons' : 'Select all'}
                                              </button>
                                            </div>
                                            <div className="generation-tooltip-list" role="listbox" aria-label="Generation add-ons">
                                              {generationModes.filter((mode) => mode.value !== 'Checklist').map((mode) => {
                                                const isActive = generationFlow.selectedModes.includes(mode.value)
                                                const isDisabled = !generationFlow.selectedModes.includes('Checklist')
                                                return (
                                                  <button
                                                    key={mode.value}
                                                    type="button"
                                                    className={`generation-tooltip-item ${isActive ? 'active' : ''} ${isDisabled ? 'is-disabled' : ''}`}
                                                    onClick={() => handleSelectGenerationMode(mode.value)}
                                                    aria-pressed={isActive}
                                                    disabled={isDisabled}
                                                  >
                                                    <span className="generation-tooltip-icon" aria-hidden="true">
                                                      {mode.value === 'Form'
                                                        ? <FileSignature size={13} strokeWidth={2.2} />
                                                        : <Wrench size={13} strokeWidth={2.2} />}
                                                    </span>
                                                    <span className="generation-tooltip-copy">
                                                      <strong>{mode.label}</strong>
                                                      <small>{mode.value === 'Form' ? 'Draft activity form.' : 'Add guided support.'}</small>
                                                    </span>
                                                  </button>
                                                )
                                              })}
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            className="generation-tooltip-action"
                                            onClick={handleStartGeneration}
                                            disabled={!generationFlow.selectedModes.includes('Checklist')}
                                          >
                                            Generate
                                          </button>
                                        </>
                                      ) : (
                                        <div className="generation-tooltip-progress">
                                          <div className="generation-tooltip-status">
                                            <strong>{generationStatusLabel}</strong>
                                            <span>{generationFlow.progress}%</span>
                                          </div>
                                          <div className="generation-tooltip-bar" aria-hidden="true">
                                            <span style={{ width: `${generationFlow.progress}%` }} />
                                          </div>
                                          <p>
                                            {generationSelectionLabel}
                                            {' '}
                                            in progress.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                                <div className="forms-flow-action-icons">
                                  {state.showPreview ? (
                                    <button
                                      type="button"
                                      className="forms-icon-btn"
                                      aria-label="Preview"
                                      onClick={() => openAssociatedActivityPage(record, activity)}
                                    >
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
                              <div className="forms-flow-cell is-center" data-label="Status">
                                <span className={`forms-badge ${activity.status === 'Assigned' ? 'forms-badge-success' : activity.status === 'Generated' || activity.status === 'Created' ? 'forms-badge-info' : 'forms-badge-danger'}`}>
                                  {activity.status}
                                </span>
                              </div>
                              <div className="forms-flow-assign is-center" data-label="Assign Info">
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

    </section>
  )
}


export default SkillManagementPage


