import { useEffect, useState } from 'react'
import {
  Bell,
  Blocks,
  ChevronFirst,
  ChevronLast,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  LayoutDashboard,
  Maximize,
  Menu,
  Minimize,
  Moon,
  Info,
  MoreHorizontal,
  LogOut,
  Search,
  Sun,
  Table2,
  Trash2,
  UserPen,
  X,
} from 'lucide-react'
import './App.css'
import brandLogo from './assets/brand-logo.svg'
import brandMark from './assets/brand-mark.svg'
import FacultyManagementPageV2 from './FacultyManagementPageV2'

const baseRows = [
  ['1', 'Mark', 'Otto', '@mdo'],
  ['2', 'Jacob', 'Thornton', '@fat'],
  ['3', 'Larry', 'Bird', '@twitter'],
]

const menu = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Widgets', icon: Blocks },
      { label: 'Tables', icon: Table2 },
      { label: 'Skill Management', icon: FileText },
      { label: 'Skill Assessment', icon: FileText },
      { label: 'Faculty Management', icon: UserPen },
    ],
  },
]

const assessmentYearOptions = ['First Year', 'Second Year', 'Third Year']

const assessmentSgtMap = {
  'First Year': ['SGT 1A', 'SGT 1B', 'SGT 1C'],
  'Second Year': ['SGT 2A', 'SGT 2B', 'SGT 2C'],
  'Third Year': ['SGT 3A', 'SGT 3B', 'SGT 3C'],
}

const skillAssessmentActivities = [
  {
    id: 'fy-1',
    year: 'First Year',
    sgt: 'SGT 1A',
    competency: 'PY1.4',
    skillType: 'OSPE',
    name: 'Identify the parts of a compound microscope',
    students: 10,
    completedAttempts: [2],
  },
  {
    id: 'fy-2',
    year: 'First Year',
    sgt: 'SGT 1B',
    competency: 'AN1.8',
    skillType: 'OSCE',
    name: 'Measure blood pressure and document the reading',
    students: 10,
    completedAttempts: [1, 3],
  },
  {
    id: 'sy-1',
    year: 'Second Year',
    sgt: 'SGT 2A',
    competency: 'PY2.11',
    skillType: 'OSPE',
    name: 'Interpret a complete blood count panel',
    students: 10,
    completedAttempts: [2],
  },
  {
    id: 'sy-2',
    year: 'Second Year',
    sgt: 'SGT 2B',
    competency: 'PY2.7',
    skillType: 'OSCE',
    name: 'Review peripheral smear basics',
    students: 10,
    completedAttempts: [1],
  },
  {
    id: 'ty-1',
    year: 'Third Year',
    sgt: 'SGT 3A',
    competency: 'PA3.4',
    skillType: 'Image',
    name: 'Identify gross pathology on specimen images',
    students: 10,
    completedAttempts: [1],
  },
  {
    id: 'ty-2',
    year: 'Third Year',
    sgt: 'SGT 3C',
    competency: 'MD3.2',
    skillType: 'Interpretation',
    name: 'Evaluate a long case summary and propose next steps',
    students: 10,
    completedAttempts: [],
  },
]

const evaluationStudents = [
  { id: 'MC2566', name: 'Karthik Subramanian' },
  { id: 'MC2567', name: 'Aarav Sharma' },
  { id: 'MC2568', name: 'Diya Patel' },
  { id: 'MC2569', name: 'Kabir Khan' },
  { id: 'MC2570', name: 'Meera Nair' },
  { id: 'MC2571', name: 'Ishaan Verma' },
  { id: 'MC2572', name: 'Ananya Iyer' },
  { id: 'MC2573', name: 'Rahul Singh' },
  { id: 'MC2574', name: 'Sana Ali' },
  { id: 'MC2575', name: 'Vivaan Gupta' },
]

const dashboardActivityDirectory = [
  {
    competency: 'PY2.11',
    title: 'Interpret a complete blood count panel',
  },
  {
    competency: 'AN1.2',
    title: 'Describe composition of bone and bone marrow',
  },
  {
    competency: 'OSCE',
    title: 'Review peripheral smear basics',
  },
  {
    competency: 'PA3.4',
    title: 'Identify gross pathology on specimen images',
  },
]

const dashboardStudentProfiles = evaluationStudents.map((student, index) => {
  const year = assessmentYearOptions[Math.min(Math.floor(index / 4), assessmentYearOptions.length - 1)]
  const batch = ['Batch A', 'Batch A', 'Batch A', 'Batch A', 'Batch B', 'Batch B', 'Batch B', 'Batch C', 'Batch C', 'Batch C'][index] ?? 'Batch A'
  const sgt = [
    'SGT 1A',
    'SGT 1B',
    'SGT 1C',
    'SGT 1A',
    'SGT 2A',
    'SGT 2B',
    'SGT 2C',
    'SGT 3A',
    'SGT 3B',
    'SGT 3C',
  ][index] ?? 'SGT 1A'
  const activity = dashboardActivityDirectory[index % dashboardActivityDirectory.length]
  const totalDoap = 2 + (index % 4)
  const pending = 1 + (index % 2)
  const complete = Math.max(totalDoap - pending, 0)
  const cognitive = 58 + ((index * 7) % 28)
  const affective = 54 + ((index * 5) % 26)
  const psychomotor = 62 + ((index * 6) % 24)

  return {
    ...student,
    year,
    batch,
    sgt,
    activity,
    totalDoap,
    pending,
    complete,
    evalCount: `${(index % 3) + 1} / 12`,
    evalStatus: index % 3 === 0 ? 'Complete' : 'Incomplete',
    obtainedMarks: `${String(3 + (index % 4)).padStart(2, '0')} / 10`,
    checklistDone: `${4 + (index % 2)} / 5`,
    cognitive,
    affective,
    psychomotor,
    auditTrail: [
      {
        id: `${student.id}-attempt-1`,
        competency: activity.competency,
        title: activity.title,
        attempt: 'Attempt 1',
        status: 'Repeated',
        remarks: 'Needs a more structured response under timed conditions.',
      },
      {
        id: `${student.id}-attempt-2`,
        competency: activity.competency,
        title: activity.title,
        attempt: 'Attempt 3',
        status: 'Certified',
        remarks: 'Confident execution with complete checklist coverage.',
      },
      {
        id: `${student.id}-attempt-3`,
        competency: 'AN1.2',
        title: 'Describe composition of bone and bone marrow',
        attempt: 'Attempt 2',
        status: 'Remedial',
        remarks: 'Focused revision needed before the next grading cycle.',
      },
    ],
  }
})

const gradingTabs = [
  { id: 'checklist', label: 'Activity Checklist' },
  { id: 'form', label: 'Activity Form' },
  { id: 'questions', label: 'Scaffolded Questions' },
]

const gradingChecklistItems = [
  { id: 'preparedness', label: 'Preparedness', hint: 'Has equipment and notes ready.' },
  { id: 'environment', label: 'Environment', hint: 'Maintains a safe and clean setup.' },
  { id: 'equipment', label: 'Equipment', hint: 'Uses the correct tools confidently.' },
  { id: 'procedure', label: 'Procedure', hint: 'Follows the task sequence accurately.' },
  { id: 'communication', label: 'Communication', hint: 'Explains the process clearly.' },
]

const gradingQuestions = [
  'Explain the key principle behind this activity.',
  'What would you do differently in the next attempt?',
]

const createGradingChecklistState = () => Object.fromEntries(
  gradingChecklistItems.map((item) => [item.id, 'pending'])
)

const createStudentAssessmentState = () => ({
  activeTab: 'checklist',
  checklist: createGradingChecklistState(),
  formNotes: '',
  questionAnswers: gradingQuestions.reduce((acc, question, index) => {
    acc[`question-${index + 1}`] = ''
    return acc
  }, {}),
  remarks: '',
  submitted: false,
  lastSavedAt: Date.now(),
  loading: false,
})

function TableCard({ title, helper, className = '', rows = baseRows }) {
  return (
    <section className={`vx-card ${className}`}>
      <header className="vx-card-head">
        <div>
          <h3>{title}</h3>
          <p>{helper}</p>
        </div>
        <button type="button" className="vx-dots" aria-label="More options">
          ...
        </button>
      </header>
      <div className="vx-table-wrap">
        <table className="vx-table">
          <thead>
            <tr>
              <th>#</th>
              <th>First</th>
              <th>Last</th>
              <th>Handle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td key={`${row[0]}-${cell}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const workflowSteps = [
  {
    step: '1. Discovery & Selection',
    title: 'Find the right competency',
    detail: 'Search by year, subject, or topic, then select the matching competency row.',
  },
  {
    step: '2. Activity Management',
    title: 'Add and define activities',
    detail: 'Create OSPE, OSCE, Interpretation, or Image tasks and mark them certifiable.',
  },
  {
    step: '3. Content Creation',
    title: 'Generate or create content',
    detail: 'Use Generate with AI for auto-built content or Create Manual for human-authored tasks.',
  },
  {
    step: '4. Review & Deployment',
    title: 'Preview, review, and assign',
    detail: 'Preview content, edit settings, and complete the flow by assigning it to students.',
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

function SkillManagementPage() {
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
  const [processingTask, setProcessingTask] = useState(null)
  const [yearFilter, setYearFilter] = useState('All Years')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [newRecord, setNewRecord] = useState({
    year: 'First Year',
    subject: 'Human Anatomy',
    topic: '',
    competency: '',
  })

  const years = ['All Years', ...new Set(records.map((record) => record.year))]
  const subjects = ['All Subjects', ...new Set(records.map((record) => record.subject))]

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

  const handleAddActivity = (recordId) => {
    setRecords((current) => current.map((record) => (
      record.id === recordId
        ? {
            ...record,
            activities: [
              ...record.activities,
              {
                id: `activity-${Date.now()}`,
                name: 'New skill assessment activity',
                certifiable: true,
                type: 'OSPE',
                marks: 'Nil',
                status: 'Not Created',
                assignInfo: 'Unassigned',
                batch: 'No batch selected',
              },
            ],
          }
        : record
    )))
  }

  useEffect(() => {
    if (!processingTask) return undefined

    const timer = window.setInterval(() => {
      setProcessingTask((current) => {
        if (!current) return null
        const nextProgress = Math.min(current.progress + 20, 100)

        if (nextProgress >= 100) {
          setRecords((recordsState) => recordsState.map((record) => (
            record.id === current.recordId
              ? {
                  ...record,
                  activities: record.activities.map((activity) => (
                    activity.id === current.activityId
                      ? { ...activity, status: 'Generated', marks: '10' }
                      : activity
                  )),
                }
              : record
          )))
          return null
        }

        return { ...current, progress: nextProgress }
      })
    }, 250)

    return () => window.clearInterval(timer)
  }, [processingTask])

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
      setProcessingTask({ recordId, activityId, progress: 0 })
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

  const getStateConfig = (activity) => {
    if (activity.status === 'Not Generated') {
      return {
        primaryLabel: 'Generate with AI',
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
            <h1>Skill Management</h1>
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
                        <button type="button" className="activity-btn" onClick={() => handleAddActivity(record.id)}>Add Activity</button>
                      </div>

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
                          const isProcessing = processingTask?.recordId === record.id && processingTask?.activityId === activity.id

                          return (
                            <article key={activity.id} className={`forms-flow-row state-${activity.status.toLowerCase().replaceAll(' ', '-')}`}>
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
                                <span className="forms-certifiable">
                                  <CheckCircle2 size={16} strokeWidth={2} />
                                  {activity.certifiable ? 'Yes' : 'No'}
                                </span>
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
                                    {isProcessing ? `Generating ${processingTask.progress}%` : state.primaryLabel}
                                  </button>
                                  {isProcessing ? (
                                    <span className="forms-progress">
                                      <span style={{ width: `${processingTask.progress}%` }} />
                                    </span>
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
        <div className="forms-modal-backdrop" onClick={() => setIsAddOpen(false)} aria-hidden="true">
          <div className="forms-modal" onClick={(event) => event.stopPropagation()}>
            <div className="forms-modal-head">
              <div>
                <h3>Add Skill Assessment</h3>
                <p>Create a new competency record from the global forms action.</p>
              </div>
              <button type="button" className="ghost" onClick={() => setIsAddOpen(false)}>Close</button>
            </div>
            <div className="forms-modal-grid">
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
              <label className="forms-field forms-field-full">
                <span>Topic</span>
                <input value={newRecord.topic} onChange={(event) => setNewRecord((current) => ({ ...current, topic: event.target.value }))} placeholder="Enter topic name" />
              </label>
              <label className="forms-field forms-field-full">
                <span>Competency</span>
                <input value={newRecord.competency} onChange={(event) => setNewRecord((current) => ({ ...current, competency: event.target.value }))} placeholder="Enter competency name" />
              </label>
            </div>
            <div className="forms-modal-actions">
              <button type="button" className="ghost" onClick={() => setIsAddOpen(false)}>Cancel</button>
              <button type="button" className="tool-btn green" onClick={handleAddRecord}>Create Record</button>
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

function DashboardSummaryPage({ onBackToAssessment }) {
  const [yearFilter, setYearFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [sgtFilter, setSgtFilter] = useState('')
  const [activityFilter, setActivityFilter] = useState('')
  const [searchStudent, setSearchStudent] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(dashboardStudentProfiles[0]?.id ?? '')

  const visibleStudents = dashboardStudentProfiles.filter((student) => {
    const matchesYear = !yearFilter || student.year === yearFilter
    const matchesBatch = !batchFilter || student.batch === batchFilter
    const matchesSgt = !sgtFilter || student.sgt === sgtFilter
    const matchesActivity = !activityFilter || student.activity.competency === activityFilter
    const needle = searchStudent.trim().toLowerCase()
    const matchesSearch = !needle
      || student.name.toLowerCase().includes(needle)
      || student.id.toLowerCase().includes(needle)

    return matchesYear && matchesBatch && matchesSgt && matchesActivity && matchesSearch
  })

  const selectedStudent = dashboardStudentProfiles.find((student) => student.id === selectedStudentId)
    ?? visibleStudents[0]
    ?? dashboardStudentProfiles[0]
  const cognitiveBars = [
    { label: 'Remembering', value: selectedStudent?.cognitive ?? 0 },
    { label: 'Understanding', value: Math.max((selectedStudent?.cognitive ?? 0) - 8, 0) },
    { label: 'Applying', value: Math.max((selectedStudent?.cognitive ?? 0) - 14, 0) },
    { label: 'Evaluating', value: Math.max((selectedStudent?.cognitive ?? 0) - 22, 0) },
  ]
  const recentCourses = visibleStudents.slice(0, 4).map((student, index) => ({
    student,
    progress: [60, 50, 100, 35][index] ?? 60,
    status: index % 3 === 0 ? 'Ongoing' : index % 3 === 1 ? 'Completed' : 'Pending',
    score: [78, 72, 90, 64][index] ?? 70,
    hours: [15, 20, 18, 19][index] ?? 16,
  }))

  return (
    <section className="vx-content forms-page dashboard-summary-page">
      <div className="dashboard-summary-shell">
        <div className="dashboard-summary-hero">
          <div className="dashboard-summary-hero-copy">
            <span className="dashboard-summary-kicker">Dashboard summary</span>
            <h1>Dashboard Summary</h1>
            <p>
              Filter the student directory, open a learner, and review a clean progress snapshot
              before drilling into details.
            </p>
          </div>

          <div className="dashboard-summary-hero-actions">
            <button type="button" className="ghost" onClick={onBackToAssessment}>
              Back to Assessment
            </button>
          </div>
        </div>

        <section className="vx-card dashboard-summary-toolbar">
          <label className="forms-field">
            <span>Year</span>
            <div className="forms-select-wrap">
              <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                <option value="">All years</option>
                {assessmentYearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </label>

          <label className="forms-field">
            <span>Class / Batch</span>
            <div className="forms-select-wrap">
              <select value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)}>
                <option value="">All batches</option>
                {['Batch A', 'Batch B', 'Batch C'].map((batch) => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>
          </label>

          <label className="forms-field">
            <span>SGT</span>
            <div className="forms-select-wrap">
              <select value={sgtFilter} onChange={(event) => setSgtFilter(event.target.value)}>
                <option value="">All groups</option>
                {(assessmentSgtMap[yearFilter] ?? Object.values(assessmentSgtMap).flat()).map((sgt) => (
                  <option key={sgt} value={sgt}>{sgt}</option>
                ))}
              </select>
            </div>
          </label>

          <label className="forms-field">
            <span>Activity</span>
            <div className="forms-select-wrap">
              <select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)}>
                <option value="">All activities</option>
                {dashboardActivityDirectory.map((activity) => (
                  <option key={activity.competency} value={activity.competency}>
                    {activity.competency} - {activity.title}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="forms-field forms-field-full dashboard-summary-search">
            <span>Search Student</span>
            <div className="tool-input">
              <input
                type="search"
                value={searchStudent}
                onChange={(event) => setSearchStudent(event.target.value)}
                placeholder="Search student name or register number"
              />
            </div>
          </label>
        </section>

        <div className="dashboard-summary-top-grid">
          <section className="vx-card dashboard-summary-card dashboard-summary-activity-card">
            <div className="dashboard-summary-section-head">
              <div>
                <h2>Learning Activity</h2>
                <p>{selectedStudent?.name ?? 'Select a student'} - {selectedStudent?.year ?? 'No year selected'}</p>
              </div>
              <button type="button" className="ghost dashboard-summary-mini-btn" onClick={onBackToAssessment}>
                View Assessment
              </button>
            </div>

            <div className="dashboard-summary-activity-stats">
              <div>
                <span>Total DOAP</span>
                <strong>{selectedStudent?.totalDoap ?? 0}</strong>
              </div>
              <div>
                <span>Pending</span>
                <strong>{selectedStudent?.pending ?? 0}</strong>
              </div>
              <div>
                <span>Complete</span>
                <strong>{selectedStudent?.complete ?? 0}</strong>
              </div>
            </div>

            <div className="dashboard-summary-mini-chart">
              {cognitiveBars.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <div className="dashboard-summary-bar-track">
                    <div className="dashboard-summary-bar-fill" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="vx-card dashboard-summary-card dashboard-summary-performance-card">
            <div className="dashboard-summary-section-head">
              <div>
                <h2>Performance</h2>
                <p>Focus view for the selected learner</p>
              </div>
              <span className="skill-assessment-panel-pill is-live">Last 6 months</span>
            </div>

            <div className="dashboard-summary-performance-wrap">
              <div className="dashboard-summary-radial" style={{
                background: `conic-gradient(#0f8364 0 ${selectedStudent?.affective ?? 0}%, #d9e8df ${selectedStudent?.affective ?? 0}% 100%)`,
              }}>
                <div>
                  <strong>{selectedStudent?.affective ?? 0}%</strong>
                  <span>Total score</span>
                </div>
              </div>

              <div className="dashboard-summary-performance-legend">
                <div><span className="dot dot-green" />Participation <strong>55%</strong></div>
                <div><span className="dot dot-gold" />Class quiz <strong>15%</strong></div>
                <div><span className="dot dot-sky" />Exam <strong>20%</strong></div>
                <div><span className="dot dot-red" />Absent <strong>10%</strong></div>
              </div>
            </div>

            <div className="dashboard-summary-performance-note">
              Success grows with steady weekly effort. Keep pushing forward.
            </div>
          </section>
        </div>

        <section className="vx-card dashboard-summary-roster-card">
          <div className="dashboard-summary-section-head">
            <div>
              <h2>Enrolled Students</h2>
              <p>Search, filter, and open any student from the list below.</p>
            </div>
            <span className="dashboard-summary-roster-pill">{visibleStudents.length} students</span>
          </div>

          <div className="dashboard-summary-roster-head">
            <span>Student</span>
            <span>Course</span>
            <span>Status</span>
            <span>Score</span>
            <span>Action</span>
          </div>

          <div className="dashboard-summary-roster-list">
            {recentCourses.length ? recentCourses.map(({ student, progress, status, score, hours }) => (
              <article
                key={student.id}
                className={`dashboard-summary-roster-row ${student.id === selectedStudent?.id ? 'is-active' : ''}`}
                onClick={() => setSelectedStudentId(student.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedStudentId(student.id)
                  }
                }}
              >
                <span className="dashboard-summary-roster-student">
                  <strong>{student.name}</strong>
                  <span>{student.id}</span>
                </span>
                <span className="dashboard-summary-roster-course">
                  <strong>{student.activity.title}</strong>
                  <span>{student.year} • {student.sgt}</span>
                </span>
                <span className="dashboard-summary-roster-status">
                  <span className={`dashboard-summary-status ${status === 'Completed' ? 'is-cert' : status === 'Ongoing' ? 'is-remedial' : 'is-repeat'}`}>
                    {status}
                  </span>
                </span>
                <span className="dashboard-summary-roster-score">
                  <strong>{score}</strong>
                  <span>{hours} hrs</span>
                </span>
                <span className="dashboard-summary-roster-action">
                  <button
                    type="button"
                    className="dashboard-summary-info-btn"
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedStudentId(student.id)
                      onBackToAssessment()
                    }}
                  >
                    Open
                  </button>
                </span>
              </article>
            )) : (
              <div className="dashboard-summary-empty-state">
                <strong>No students match these filters.</strong>
                <p>Try adjusting the top filters or clearing the search field.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}

function FacultyManagementPage() {
  const facultyRows = [
    {
      id: 'FAC-001',
      name: 'Dr. Anika Sharma',
      designation: 'Professor',
      email: 'anika.sharma@medsy.edu',
      phone: '+91 98765 43210',
      department: 'Anatomy',
      roles: ['Course Lead', 'Exam Coordinator'],
      status: 'Active',
      assignment: {
        course: 'MBBS Phase I',
        department: 'Anatomy',
        yearSem: '1st Year - Sem 1',
        subjects: 'Anatomy, Histology',
        classSec: 'A / B',
        studentCount: 120,
        assignmentStatus: 'Assigned',
      },
    },
    {
      id: 'FAC-002',
      name: 'Dr. Rahul Mehta',
      designation: 'Associate Professor',
      email: 'rahul.mehta@medsy.edu',
      phone: '+91 98111 22445',
      department: 'Physiology',
      roles: ['Module Coordinator'],
      status: 'Inactive',
      assignment: {
        course: 'MBBS Phase II',
        department: 'Physiology',
        yearSem: '2nd Year - Sem 3',
        subjects: 'Systemic Physiology',
        classSec: 'C',
        studentCount: 96,
        assignmentStatus: 'Not Assigned',
      },
    },
    {
      id: 'FAC-003',
      name: 'Prof. N. Iyer',
      designation: 'Professor',
      email: 'niyer@medsy.edu',
      phone: '+91 98980 77881',
      department: 'Pathology',
      roles: ['Exam Lead', 'Content Reviewer'],
      status: 'Active',
      assignment: {
        course: 'MBBS Phase II',
        department: 'Pathology',
        yearSem: '2nd Year - Sem 4',
        subjects: 'General Pathology, Hematology',
        classSec: 'A / B',
        studentCount: 110,
        assignmentStatus: 'Assigned',
      },
    },
    {
      id: 'FAC-004',
      name: 'Dr. Sana Khan',
      designation: 'Assistant Professor',
      email: 'sana.khan@medsy.edu',
      phone: '+91 99021 11876',
      department: 'Pharmacology',
      roles: ['Assessment Reviewer', 'Practical Lead'],
      status: 'Active',
      assignment: {
        course: 'MBBS Phase III',
        department: 'Pharmacology',
        yearSem: '3rd Year - Sem 5',
        subjects: 'Autonomic Pharmacology, CNS Pharmacology',
        classSec: 'B',
        studentCount: 84,
        assignmentStatus: 'Assigned',
      },
    },
    {
      id: 'FAC-005',
      name: 'Dr. Meera Joseph',
      designation: 'Assistant Professor',
      email: 'meera.joseph@medsy.edu',
      phone: '+91 97654 33221',
      department: 'Community Medicine',
      roles: ['Attendance Lead'],
      status: 'Not Assigned',
      assignment: {
        course: 'MBBS Phase I',
        department: 'Community Medicine',
        yearSem: '1st Year - Sem 2',
        subjects: 'Introductory Epidemiology',
        classSec: 'C',
        studentCount: 72,
        assignmentStatus: 'Pending Allocation',
      },
    },
  ]

  const roleOptions = ['Course Lead', 'Exam Coordinator', 'Module Coordinator', 'Assessment Reviewer', 'Practical Lead', 'Content Reviewer', 'Attendance Lead']
  const designationOptions = ['Professor', 'Associate Professor', 'Assistant Professor', 'Tutor', 'Senior Resident']
  const departmentOptions = ['Anatomy', 'Physiology', 'Pathology', 'Pharmacology', 'Community Medicine', 'Microbiology']

  const [designationFilter, setDesignationFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchFaculty, setSearchFaculty] = useState('')
  const [detailedView, setDetailedView] = useState(false)
  const [expandedFacultyId, setExpandedFacultyId] = useState(facultyRows[0]?.id ?? '')
  const [selectedRoles, setSelectedRoles] = useState(['Course Lead', 'Exam Coordinator'])
  const [addForm, setAddForm] = useState({
    facultyId: 'FAC-006',
    name: '',
    designation: 'Assistant Professor',
    email: '',
    phone: '',
    department: 'Anatomy',
    status: 'Active',
  })

  const visibleRows = facultyRows.filter((row) => {
    const matchesDesignation = !designationFilter || row.designation === designationFilter
    const matchesRole = !roleFilter || row.roles.includes(roleFilter)
    const matchesStatus = !statusFilter || row.status === statusFilter
    const needle = searchFaculty.trim().toLowerCase()
    const matchesSearch = !needle
      || row.id.toLowerCase().includes(needle)
      || row.name.toLowerCase().includes(needle)

    return matchesDesignation && matchesRole && matchesStatus && matchesSearch
  })

  const toggleRole = (role) => {
    setSelectedRoles((current) => (
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role]
    ))
  }

  const toggleExpandedFaculty = (facultyId) => {
    setExpandedFacultyId((current) => (current === facultyId ? '' : facultyId))
  }

  const rowColumns = detailedView ? 10 : 7
  const totalCount = facultyRows.length
  const activeCount = facultyRows.filter((row) => row.status === 'Active').length
  const inactiveCount = facultyRows.filter((row) => row.status === 'Inactive').length
  const unassignedCount = facultyRows.filter((row) => row.status === 'Not Assigned' || row.assignment.assignmentStatus !== 'Assigned').length

  return (
    <section className="vx-content faculty-management-page">
      <div className="vx-breadcrumb">Admin / Faculty / Management</div>

      <div className="faculty-hero">
        <div className="faculty-hero-copy">
          <span className="faculty-kicker">Faculty Management</span>
          <h1>Faculty Management</h1>
          <p>Manage faculty records, roles, and class assignments from a compact, high-density workspace.</p>
        </div>

        <div className="faculty-hero-actions">
          <button type="button" className="tool-btn green">Add Faculty</button>
          <button type="button" className="ghost">Bulk Upload Excel</button>
          <button type="button" className="faculty-text-link">Download Sample</button>
        </div>
      </div>

      <div className="faculty-metrics">
        <div>
          <span>Total Faculty</span>
          <strong>{totalCount}</strong>
        </div>
        <div>
          <span>Active</span>
          <strong>{activeCount}</strong>
        </div>
        <div>
          <span>Inactive</span>
          <strong>{inactiveCount}</strong>
        </div>
        <div>
          <span>Unassigned</span>
          <strong>{unassignedCount}</strong>
        </div>
      </div>

      <section className="vx-card faculty-filter-bar">
        <label className="forms-field faculty-search-field faculty-search-wide">
          <span>Search by ID or Name</span>
          <div className="tool-input">
            <input
              type="search"
              value={searchFaculty}
              onChange={(event) => setSearchFaculty(event.target.value)}
              placeholder="Search faculty ID or name"
            />
          </div>
        </label>

        <label className="forms-field faculty-search-field">
          <span>Designation</span>
          <div className="forms-select-wrap">
            <select value={designationFilter} onChange={(event) => setDesignationFilter(event.target.value)}>
              <option value="">All designations</option>
              {designationOptions.map((designation) => (
                <option key={designation} value={designation}>{designation}</option>
              ))}
            </select>
          </div>
        </label>

        <label className="forms-field faculty-search-field">
          <span>Roles</span>
          <div className="forms-select-wrap">
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="">All roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </label>

        <label className="forms-field faculty-search-field">
          <span>Status</span>
          <div className="forms-select-wrap">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Not Assigned">Not Assigned</option>
            </select>
          </div>
        </label>

        <div className="faculty-filter-actions">
          <span className="faculty-filter-count">{visibleRows.length} records</span>
          <button
            type="button"
            className={`faculty-toggle ${detailedView ? 'active' : ''}`}
            onClick={() => setDetailedView((current) => !current)}
          >
            Detailed View
          </button>
        </div>
      </section>

      <div className="faculty-layout">
        <section className="vx-card faculty-table-panel">
          <div className="vx-card-head faculty-card-head">
            <div>
              <h3>Faculty Directory</h3>
              <p>Click a row to expand class assignment details.</p>
            </div>
            <span className="faculty-inline-note">
              {detailedView ? 'Granular class assignment view enabled' : 'Compact directory view'}
            </span>
          </div>

          <div className="faculty-table-wrap">
            <table className="vx-table faculty-table">
              <thead>
                <tr>
                  <th>Faculty ID</th>
                  <th>Name</th>
                  <th>Designation</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Status</th>
                  {detailedView ? (
                    <>
                      <th>Course</th>
                      <th>Class / Sec</th>
                      <th>Student Count</th>
                    </>
                  ) : null}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const isExpanded = expandedFacultyId === row.id
                  return [
                    <tr
                      key={`row-${row.id}`}
                      className={`faculty-row ${isExpanded ? 'is-expanded' : ''}`}
                      onClick={() => toggleExpandedFaculty(row.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          toggleExpandedFaculty(row.id)
                        }
                      }}
                    >
                      <td>{row.id}</td>
                      <td>
                        <div className="faculty-name-cell">
                          <strong>{row.name}</strong>
                          <span>{row.department}</span>
                        </div>
                      </td>
                      <td>{row.designation}</td>
                      <td>{row.email}</td>
                      <td>
                        <div className="faculty-role-badges">
                          {row.roles.map((role) => (
                            <span key={role} className="forms-badge forms-badge-info">{role}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`faculty-status faculty-status-${row.status === 'Active' ? 'active' : 'alert'}`}>
                          {row.status}
                        </span>
                      </td>
                      {detailedView ? (
                        <>
                          <td>{row.assignment.course}</td>
                          <td>{row.assignment.classSec}</td>
                          <td>{row.assignment.studentCount}</td>
                        </>
                      ) : null}
                      <td onClick={(event) => event.stopPropagation()}>
                        <div className="faculty-action-set">
                          <button type="button" className="faculty-icon-btn has-tooltip" data-tooltip="View">
                            <Eye size={16} strokeWidth={2} />
                          </button>
                          <button type="button" className="faculty-icon-btn has-tooltip" data-tooltip="Edit">
                            <UserPen size={16} strokeWidth={2} />
                          </button>
                          <button type="button" className="faculty-icon-btn is-danger has-tooltip" data-tooltip="Delete">
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>,
                    isExpanded ? (
                      <tr key={`details-${row.id}`} className="faculty-expanded-row">
                        <td colSpan={rowColumns}>
                          <div className="faculty-expanded-panel">
                            <div className="faculty-expanded-head">
                              <strong>Class Assignment Details</strong>
                              <span className={`faculty-assignment-status is-${row.assignment.assignmentStatus === 'Assigned' ? 'active' : 'alert'}`}>
                                {row.assignment.assignmentStatus}
                              </span>
                            </div>

                            <div className="faculty-assignment-grid">
                              <div>
                                <span>Course</span>
                                <strong>{row.assignment.course}</strong>
                              </div>
                              <div>
                                <span>Department</span>
                                <strong>{row.assignment.department}</strong>
                              </div>
                              <div>
                                <span>Year-Sem</span>
                                <strong>{row.assignment.yearSem}</strong>
                              </div>
                              <div>
                                <span>Subjects</span>
                                <strong>{row.assignment.subjects}</strong>
                              </div>
                              <div>
                                <span>Class / Sec</span>
                                <strong>{row.assignment.classSec}</strong>
                              </div>
                              <div>
                                <span>Student Count</span>
                                <strong>{row.assignment.studentCount}</strong>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null,
                  ]
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="vx-card faculty-form-panel">
          <div className="vx-card-head faculty-card-head">
            <div>
              <h3>Add Faculty</h3>
              <p>Capture identity, roles, and department mapping.</p>
            </div>
          </div>

          <div className="faculty-form-grid">
            <label className="forms-field">
              <span>Faculty ID</span>
              <input
                type="text"
                value={addForm.facultyId}
                onChange={(event) => setAddForm((current) => ({ ...current, facultyId: event.target.value }))}
              />
            </label>

            <label className="forms-field">
              <span>Name</span>
              <input
                type="text"
                value={addForm.name}
                onChange={(event) => setAddForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Enter faculty name"
              />
            </label>

            <label className="forms-field">
              <span>Designation</span>
              <div className="forms-select-wrap">
                <select
                  value={addForm.designation}
                  onChange={(event) => setAddForm((current) => ({ ...current, designation: event.target.value }))}
                >
                  {designationOptions.map((designation) => (
                    <option key={designation} value={designation}>{designation}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="forms-field">
              <span>Email</span>
              <input
                type="email"
                value={addForm.email}
                onChange={(event) => setAddForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@medsy.edu"
              />
            </label>

            <label className="forms-field">
              <span>Phone Number</span>
              <div className="faculty-phone-field">
                <span>+91</span>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(event) => setAddForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="98765 43210"
                />
              </div>
            </label>

            <label className="forms-field">
              <span>Department Mapping</span>
              <div className="forms-select-wrap">
                <select
                  value={addForm.department}
                  onChange={(event) => setAddForm((current) => ({ ...current, department: event.target.value }))}
                >
                  {departmentOptions.map((department) => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="forms-field faculty-field-full">
              <span>Roles Selection</span>
              <div className="faculty-role-picker">
                {roleOptions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`faculty-role-chip ${selectedRoles.includes(role) ? 'active' : ''}`}
                    onClick={() => toggleRole(role)}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </label>

            <label className="forms-field">
              <span>Status</span>
              <div className="forms-select-wrap">
                <select
                  value={addForm.status}
                  onChange={(event) => setAddForm((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Not Assigned">Not Assigned</option>
                </select>
              </div>
            </label>

            <div className="faculty-form-actions faculty-field-full">
              <button type="button" className="tool-btn green">Save Faculty</button>
              <button type="button" className="ghost">Reset</button>
            </div>
          </div>
        </section>
      </div>

      <div className="faculty-hint">
        Rows expand into class-assignment details, while Detailed View surfaces the same assignment data inline in the table.
      </div>
    </section>
  )
}

function SkillAssessmentPage({ onOpenDashboardSummary }) {
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSgt, setSelectedSgt] = useState('')
  const [attemptCount, setAttemptCount] = useState('')
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [previewAssessment, setPreviewAssessment] = useState(null)
  const [searchMessage, setSearchMessage] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isEvaluationStarted, setIsEvaluationStarted] = useState(false)
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(null)
  const [isLoadingStudent, setIsLoadingStudent] = useState(false)
  const [studentAssessments, setStudentAssessments] = useState(() => Object.fromEntries(
    evaluationStudents.map((student) => [student.id, createStudentAssessmentState()])
  ))

  const availableSgtOptions = selectedYear
    ? assessmentSgtMap[selectedYear] ?? []
    : Object.values(assessmentSgtMap).flat()

  const filteredActivities = skillAssessmentActivities.filter((activity) => {
    const matchesYear = !selectedYear || activity.year === selectedYear
    const matchesSgt = !selectedSgt || activity.sgt === selectedSgt
    const attemptNumber = Number(attemptCount)
    const matchesAttempt = !attemptCount || !activity.completedAttempts.includes(attemptNumber)

    return matchesYear && matchesSgt && matchesAttempt
  })

  const selectedActivity = filteredActivities.find((activity) => activity.id === selectedActivityId) ?? null
  const selectedStudent = selectedStudentIndex !== null ? evaluationStudents[selectedStudentIndex] ?? null : null
  const selectedStudentAssessment = selectedStudent ? studentAssessments[selectedStudent.id] ?? createStudentAssessmentState() : null
  const selectedStudentEvalNumber = selectedStudentIndex !== null ? selectedStudentIndex + 1 : 1
  const selectedStudentTotal = 12
  const obtainedMarks = selectedStudentAssessment
    ? Object.values(selectedStudentAssessment.checklist).filter((status) => status === 'pass').length * 2
    : 0
  const checklistCompleted = selectedStudentAssessment
    ? Object.values(selectedStudentAssessment.checklist).filter((status) => status !== 'pending').length
    : 0
  const evaluationStatus = selectedStudentAssessment?.submitted ? 'Complete' : 'Incomplete'

  const findYearForSgt = (sgt) => (
    assessmentYearOptions.find((year) => (assessmentSgtMap[year] ?? []).includes(sgt)) ?? ''
  )

  const updateStudentAssessment = (studentId, updater) => {
    setStudentAssessments((current) => {
      const existing = current[studentId] ?? createStudentAssessmentState()
      const next = typeof updater === 'function' ? updater(existing) : updater
      return { ...current, [studentId]: { ...existing, ...next, lastSavedAt: Date.now() } }
    })
  }

  const clearDerivedState = () => {
    setSelectedActivityId('')
    setPreviewAssessment(null)
    setIsEvaluationStarted(false)
    setSearchMessage('')
  }

  const handleYearChange = (value) => {
    setSelectedYear(value)
    setSelectedSgt('')
    clearDerivedState()
  }

  const handleSgtChange = (value) => {
    setSelectedSgt(value)
    if (value) {
      const derivedYear = findYearForSgt(value)
      if (derivedYear) {
        setSelectedYear(derivedYear)
      }
    }
    clearDerivedState()
  }

  const handleAttemptChange = (value) => {
    setAttemptCount(value)
    clearDerivedState()
  }

  const handleActivityChange = (value) => {
    setSelectedActivityId(value)
    setPreviewAssessment(null)
    setIsEvaluationStarted(false)
    setSearchMessage('')
  }

  const handleResetSearch = () => {
    setSelectedYear('')
    setSelectedSgt('')
    setAttemptCount('')
    setSelectedActivityId('')
    setPreviewAssessment(null)
    setSearchMessage('')
    setIsSearching(false)
    setIsEvaluationStarted(false)
    setSelectedStudentIndex(null)
    setIsLoadingStudent(false)
  }

  const handleSearchAssessment = () => {
    if (!selectedYear && !selectedSgt) {
      setSearchMessage('Select a Year or SGT to continue.')
      return
    }

    if (!attemptCount) {
      setSearchMessage('Enter an attempt count to continue.')
      return
    }

    if (!selectedActivityId) {
      setSearchMessage('Choose a competency activity before searching.')
      return
    }

    if (!selectedActivity) {
      setSearchMessage('The chosen activity is not available for this filter set.')
      return
    }

    setSearchMessage('')
    setIsSearching(true)
    window.setTimeout(() => {
      setIsSearching(false)
      setPreviewAssessment(selectedActivity)
      setIsEvaluationStarted(false)
    }, 650)
  }

  const handleStartEvaluation = () => {
    if (!previewAssessment) return
    setIsEvaluationStarted(true)
    setSelectedStudentIndex(0)
  }

  const handleSelectStudent = (index) => {
    setIsLoadingStudent(true)
    window.setTimeout(() => {
      setSelectedStudentIndex(index)
      setIsLoadingStudent(false)
      const student = evaluationStudents[index]
      if (student) {
        setStudentAssessments((current) => ({
          ...current,
          [student.id]: current[student.id] ?? createStudentAssessmentState(),
        }))
      }
    }, 180)
  }

  const handleChecklistStatus = (itemId, status) => {
    if (!selectedStudent) return
    updateStudentAssessment(selectedStudent.id, (current) => ({
      ...current,
      checklist: {
        ...current.checklist,
        [itemId]: status,
      },
      submitted: false,
    }))
  }

  const handleTabChange = (tabId) => {
    if (!selectedStudent) return
    updateStudentAssessment(selectedStudent.id, (current) => ({
      ...current,
      activeTab: tabId,
    }))
  }

  const handleStudentFieldChange = (field, value) => {
    if (!selectedStudent) return
    updateStudentAssessment(selectedStudent.id, (current) => ({
      ...current,
      [field]: value,
      submitted: false,
    }))
  }

  const handleQuestionChange = (questionKey, value) => {
    if (!selectedStudent) return
    updateStudentAssessment(selectedStudent.id, (current) => ({
      ...current,
      questionAnswers: {
        ...current.questionAnswers,
        [questionKey]: value,
      },
      submitted: false,
    }))
  }

  const handleSaveEvaluation = () => {
    if (!selectedStudent) return
    updateStudentAssessment(selectedStudent.id, (current) => ({
      ...current,
      lastSavedAt: Date.now(),
    }))
  }

  const handleSubmitEvaluation = () => {
    if (!selectedStudent) return
    updateStudentAssessment(selectedStudent.id, (current) => ({
      ...current,
      submitted: true,
      activeTab: current.activeTab,
    }))
  }

  const handleStepStudent = (direction) => {
    if (selectedStudentIndex === null) return
    const nextIndex = selectedStudentIndex + direction
    if (nextIndex < 0 || nextIndex >= evaluationStudents.length) return
    handleSelectStudent(nextIndex)
  }

  return (
    <section className="vx-content forms-page skill-assessment-page">
      <div className="skill-assessment-shell">
        <div className="skill-assessment-hero">
          <div className="skill-assessment-hero-copy">
            <h1>Skill Assessment</h1>
            <p>Choose a Year or SGT, set the attempt count, then search and launch the evaluation workspace.</p>
          </div>

          <div className="skill-assessment-hero-actions">
            <button type="button" className="tool-btn green skill-assessment-summary-btn" onClick={onOpenDashboardSummary}>
              Dashboard Summary
            </button>
          </div>
        </div>

        <div className={`skill-assessment-stage ${previewAssessment ? 'has-preview' : ''}`}>
          <section className="skill-assessment-panel skill-assessment-config">
            <div className="skill-assessment-panel-head">
              <div>
                <h2>Configuration</h2>
                <p>Set the narrow filters before loading the available competency activities.</p>
              </div>
              <span className="skill-assessment-panel-pill">Step 1 - 2</span>
            </div>

            <div className="skill-assessment-form-grid">
              <label className="forms-field">
                <span>Year</span>
                <div className="forms-select-wrap">
                  <select value={selectedYear} onChange={(event) => handleYearChange(event.target.value)}>
                    <option value="">Select year</option>
                    {assessmentYearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="forms-field">
                <span>SGT</span>
                <div className="forms-select-wrap">
                  <select value={selectedSgt} onChange={(event) => handleSgtChange(event.target.value)}>
                    <option value="">Select SGT</option>
                    {availableSgtOptions.map((sgt) => (
                      <option key={sgt} value={sgt}>{sgt}</option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="forms-field">
                <span>Attempt Count</span>
                <input
                  type="number"
                  min="1"
                  max="3"
                  inputMode="numeric"
                  value={attemptCount}
                  onChange={(event) => handleAttemptChange(event.target.value)}
                  placeholder="1, 2, or 3"
                />
              </label>

              <label className="forms-field forms-field-full">
                <span>Select Competency Activity</span>
                <div className="forms-select-wrap">
                  <select value={selectedActivityId} onChange={(event) => handleActivityChange(event.target.value)}>
                    <option value="">Choose activity</option>
                    {filteredActivities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.competency} - {activity.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>

            <div className="skill-assessment-actions">
              <button
                type="button"
                className="tool-btn green skill-assessment-search-btn"
                onClick={handleSearchAssessment}
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <span className="skill-assessment-spinner" aria-hidden="true" />
                    Searching...
                  </>
                ) : (
                  'Search Activity'
                )}
              </button>
              <button type="button" className="ghost" onClick={handleResetSearch}>Reset Search</button>
            </div>

            {searchMessage ? <p className="skill-assessment-feedback" role="alert">{searchMessage}</p> : null}
          </section>

          {previewAssessment ? (
            <aside className="skill-assessment-panel skill-assessment-preview-panel">
              <div className="skill-assessment-panel-head">
                <div>
                  <h2>Evaluation Preview</h2>
                  <p>Confirm the activity before entering the grading workspace.</p>
                </div>
                <span className="skill-assessment-panel-pill is-live">Ready</span>
              </div>

              <div className="skill-assessment-preview-card">
                <div className="skill-assessment-preview-head">
                  <span className="skill-assessment-badge is-competency">{previewAssessment.competency}</span>
                  <span className="skill-assessment-badge is-skill">{previewAssessment.skillType}</span>
                </div>

                <strong>{previewAssessment.name}</strong>

                <div className="skill-assessment-preview-meta">
                  <div>
                    <span>Year / SGT</span>
                    <strong>{previewAssessment.year} • {previewAssessment.sgt}</strong>
                  </div>
                  <div>
                    <span>No. of Students</span>
                    <strong>{previewAssessment.students}</strong>
                  </div>
                  <div>
                    <span>Attempt Count</span>
                    <strong>{attemptCount}</strong>
                  </div>
                </div>

                <p>The selected activity is ready for evaluation. Review the summary and then start the grading flow.</p>

                <div className="skill-assessment-preview-actions">
                  <button type="button" className="tool-btn green" onClick={handleStartEvaluation}>
                    Start Evaluation
                  </button>
                  <button type="button" className="ghost" onClick={handleResetSearch}>
                    Reset Search
                  </button>
                </div>
              </div>
            </aside>
          ) : null}
        </div>

        {isEvaluationStarted && previewAssessment ? (
          <section className="skill-assessment-panel skill-assessment-execution-panel">
            <div className="skill-assessment-panel-head">
              <div>
                <h2>Grading Workspace</h2>
                <p>Click a student to open the assessment flow, then move between tabs without losing progress.</p>
              </div>
              <span className="skill-assessment-panel-pill is-live">Live session</span>
            </div>

            <div className="skill-assessment-execution-summary">
              <div>
                <span>Activity</span>
                <strong>{previewAssessment.name}</strong>
              </div>
              <div>
                <span>Competency</span>
                <strong>{previewAssessment.competency}</strong>
              </div>
              <div>
                <span>Skill Type</span>
                <strong>{previewAssessment.skillType}</strong>
              </div>
            </div>

            <div className="skill-assessment-grading-layout">
              <aside className="skill-assessment-grading-list-panel">
                <div className="skill-assessment-list-head">
                  <strong>Student list</strong>
                  <span>{evaluationStudents.length} students</span>
                </div>
                <div className="skill-assessment-student-list">
                  {evaluationStudents.map((student, index) => {
                    const studentState = studentAssessments[student.id] ?? createStudentAssessmentState()
                    const isActive = selectedStudent?.id === student.id

                    return (
                      <article
                        key={student.id}
                        className={`skill-assessment-student-row ${isActive ? 'is-active' : ''}`}
                        onClick={() => handleSelectStudent(index)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            handleSelectStudent(index)
                          }
                        }}
                      >
                        <div className="skill-assessment-student-index">{index + 1}</div>
                        <div className="skill-assessment-student-main">
                          <strong>{student.name}</strong>
                          <span>{student.id}</span>
                        </div>
                        <div className="skill-assessment-student-actions">
                          <div className={`skill-assessment-student-status ${studentState.submitted ? 'is-complete' : ''}`}>
                            {studentState.submitted ? 'Complete' : 'Pending'}
                          </div>
                          <button type="button" className="skill-assessment-grade-btn" onClick={() => handleSelectStudent(index)}>
                            Grade
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </aside>

              <section className="skill-assessment-grading-workspace">
                {isLoadingStudent ? (
                  <div className="skill-assessment-loading-state">
                    <span className="skill-assessment-spinner" aria-hidden="true" />
                    Loading student workspace...
                  </div>
                ) : selectedStudent && selectedStudentAssessment ? (
                  <div className="skill-assessment-grading-card" key={selectedStudent.id}>
                    <div className="skill-assessment-grading-header">
                      <div>
                        <h3>{selectedStudent.id} - {selectedStudent.name}</h3>
                        <p>Activity synced for focused grading in a single workspace.</p>
                      </div>
                      <div className="skill-assessment-grading-header-badges">
                        <span className="skill-assessment-badge is-competency">{previewAssessment.competency}</span>
                        <span className="skill-assessment-badge is-skill">{previewAssessment.skillType}</span>
                      </div>
                    </div>

                    <div className="skill-assessment-grading-metrics">
                      <div>
                        <span>Eval Count</span>
                        <strong>{selectedStudentEvalNumber} Out of {selectedStudentTotal}</strong>
                      </div>
                      <div>
                        <span>Eval Status</span>
                        <strong>{evaluationStatus}</strong>
                      </div>
                      <div>
                        <span>Obtained Marks</span>
                        <strong>{String(obtainedMarks).padStart(2, '0')} / 10</strong>
                      </div>
                      <div>
                        <span>Checklist Done</span>
                        <strong>{checklistCompleted} / {gradingChecklistItems.length}</strong>
                      </div>
                    </div>

                    <div className="skill-assessment-tab-list" role="tablist" aria-label="Assessment phases">
                      {gradingTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          className={selectedStudentAssessment.activeTab === tab.id ? 'active' : ''}
                          aria-selected={selectedStudentAssessment.activeTab === tab.id}
                          onClick={() => handleTabChange(tab.id)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="skill-assessment-tab-panel">
                      {selectedStudentAssessment.activeTab === 'checklist' ? (
                        <div className="skill-assessment-checklist">
                          {gradingChecklistItems.map((item) => {
                            const status = selectedStudentAssessment.checklist[item.id] ?? 'pending'
                            return (
                              <article key={item.id} className={`skill-assessment-checklist-item is-${status}`}>
                                <div>
                                  <strong>{item.label}</strong>
                                  <span>{item.hint}</span>
                                </div>
                                <div className="skill-assessment-checklist-actions">
                                  <button
                                    type="button"
                                    className={status === 'pass' ? 'is-active pass' : 'pass'}
                                    onClick={() => handleChecklistStatus(item.id, 'pass')}
                                  >
                                    Pass
                                  </button>
                                  <button
                                    type="button"
                                    className={status === 'fail' ? 'is-active fail' : 'fail'}
                                    onClick={() => handleChecklistStatus(item.id, 'fail')}
                                  >
                                    Fail
                                  </button>
                                </div>
                              </article>
                            )
                          })}
                        </div>
                      ) : null}

                      {selectedStudentAssessment.activeTab === 'form' ? (
                        <div className="skill-assessment-form-panel">
                          <label className="skill-assessment-textarea-field">
                            <span>Activity Form Notes</span>
                            <textarea
                              rows="7"
                              value={selectedStudentAssessment.formNotes}
                              onChange={(event) => handleStudentFieldChange('formNotes', event.target.value)}
                              placeholder="Capture observed technique, sequence, and guidance points..."
                            />
                          </label>
                        </div>
                      ) : null}

                      {selectedStudentAssessment.activeTab === 'questions' ? (
                        <div className="skill-assessment-question-list">
                          {gradingQuestions.map((question, index) => {
                            const keyName = `question-${index + 1}`
                            return (
                              <label key={keyName} className="skill-assessment-textarea-field">
                                <span>{question}</span>
                                <textarea
                                  rows="4"
                                  value={selectedStudentAssessment.questionAnswers[keyName] ?? ''}
                                  onChange={(event) => handleQuestionChange(keyName, event.target.value)}
                                  placeholder="Enter the student response or your evaluation notes..."
                                />
                              </label>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>

                    <label className="skill-assessment-remarks-field">
                      <span>Enter your remarks...</span>
                      <textarea
                        rows="4"
                        value={selectedStudentAssessment.remarks}
                        onChange={(event) => handleStudentFieldChange('remarks', event.target.value)}
                        placeholder="Add constructive remarks for the student report..."
                      />
                    </label>

                    <div className="skill-assessment-footer-bar">
                      <div className="skill-assessment-save-state">
                        <span>Auto-save</span>
                        <strong>Saved just now</strong>
                      </div>
                      <div className="skill-assessment-footer-actions">
                        <button type="button" className="ghost" onClick={() => handleStepStudent(-1)} disabled={selectedStudentIndex === 0}>
                          Previous
                        </button>
                        <button type="button" className="ghost" onClick={handleSaveEvaluation}>
                          Save Evaluation
                        </button>
                        <button type="button" className="tool-btn green" onClick={handleSubmitEvaluation}>
                          Submit Evaluation
                        </button>
                        <button type="button" className="ghost" onClick={() => handleStepStudent(1)} disabled={selectedStudentIndex === evaluationStudents.length - 1}>
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="skill-assessment-empty-state">
                    <strong>Select a student to begin grading</strong>
                    <p>Choose a name from the left panel to open the assessment workspace with synced activity details, count tracking, and tabs.</p>
                  </div>
                )}
              </section>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  )
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const useCompactLogo = theme === 'light' && sidebarCollapsed
  const [activePage, setActivePage] = useState('Skill Management')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [profileToast, setProfileToast] = useState('')
  const profileUser = {
    name: 'Karthik Subramanian',
    registerId: 'MC2568',
    role: 'Admin',
  }

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!event.target.closest?.('.vx-profile-menu')) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    if (!profileToast) return undefined
    const timer = window.setTimeout(() => setProfileToast(''), 1800)
    return () => window.clearTimeout(timer)
  }, [profileToast])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const handleEditProfile = () => {
    setIsProfileMenuOpen(false)
    setActivePage('Profile Settings')
    window.history.pushState({}, '', '/profile/settings')
  }

  const handleSignOut = () => {
    setIsProfileMenuOpen(false)
    setProfileToast('Logging out...')
    setActivePage('Login')
    window.history.pushState({}, '', '/login')
  }

  return (
    <div className={`vx-shell ${sidebarCollapsed ? 'is-collapsed' : ''} ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <div
        className={`vx-overlay ${mobileSidebarOpen ? 'open' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`vx-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div className="vx-logo-row">
          <img
            src={brandLogo}
            alt="Brand logo"
            className={`vx-logo-image vx-logo-full ${theme === 'dark' ? 'is-white' : ''} ${useCompactLogo ? 'hide-logo' : ''}`}
          />
          <img
            src={brandMark}
            alt="Brand mark"
            className={`vx-logo-image vx-logo-mark ${theme === 'dark' ? 'is-white' : ''} ${useCompactLogo ? 'show-mark' : ''}`}
          />
          <button
            type="button"
            className="vx-icon-btn hide-desktop"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {menu.map((group) => (
          <div key={group.section} className="vx-menu-group">
            {group.items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`vx-link ${item.label === activePage ? 'active' : ''}`}
                onClick={() => {
                  setActivePage(item.label)
                  setMobileSidebarOpen(false)
                }}
              >
                <span className="vx-link-icon" aria-hidden="true">
                  <item.icon size={16} strokeWidth={2} />
                </span>
                <span className="vx-link-text">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>

      <main className="vx-main">
        <header className="vx-topbar">
          <button
            type="button"
            className="vx-icon-btn vx-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={18} strokeWidth={2} />
          </button>

          <button
            type="button"
            className="vx-icon-btn vx-collapse-btn desktop-only"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label="Collapse sidebar"
          >
            {sidebarCollapsed ? <ChevronLast size={18} strokeWidth={2} /> : <ChevronFirst size={18} strokeWidth={2} />}
          </button>

          <div className="vx-global-search">
            <span className="vx-search-icon" aria-hidden="true">
              <Search size={16} strokeWidth={2} />
            </span>
            <span className="vx-search-placeholder">Search for anything...</span>
          </div>

          <div className="vx-actions">
            <button type="button" className="vx-icon-btn" aria-label="Notifications">
              <Bell size={18} strokeWidth={2} />
            </button>
            <button type="button" className="vx-icon-btn" aria-label="Fullscreen" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={18} strokeWidth={2} /> : <Maximize size={18} strokeWidth={2} />}
            </button>
            <button
              type="button"
              className="vx-icon-btn"
              aria-label="Theme"
              onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            >
              {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
            </button>
            <div className="vx-profile-menu">
              <button
                type="button"
                className="vx-user vx-profile-trigger"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsProfileMenuOpen((open) => !open)}
              >
                <span className="avatar" aria-hidden="true">KS</span>
                <div>
                  <strong>{profileUser.name}</strong>
                  <p>{profileUser.registerId}</p>
                </div>
                <span className="vx-profile-caret" aria-hidden="true">
                  <ChevronRight size={14} strokeWidth={2} />
                </span>
              </button>

              {isProfileMenuOpen ? (
                <div className="vx-profile-tooltip" role="menu" aria-label="Profile menu">
                  <div className="vx-profile-tooltip-head">
                    <span className="avatar vx-profile-avatar" aria-hidden="true">KS</span>
                    <div>
                      <strong>{profileUser.name}</strong>
                      <p>{profileUser.registerId}</p>
                    </div>
                  </div>
                  <div className="vx-profile-divider" />
                  <button type="button" className="vx-profile-action" onClick={handleEditProfile}>
                    <span className="vx-profile-action-icon" aria-hidden="true">
                      <UserPen size={16} strokeWidth={2} />
                    </span>
                    <span>
                      <strong>Edit Profile</strong>
                      <small>Open profile settings</small>
                    </span>
                  </button>
                  <button type="button" className="vx-profile-action is-danger" onClick={handleSignOut}>
                    <span className="vx-profile-action-icon" aria-hidden="true">
                      <LogOut size={16} strokeWidth={2} />
                    </span>
                    <span>
                      <strong>Sign Out</strong>
                      <small>Leave the dashboard</small>
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          {profileToast ? <div className="vx-profile-toast" role="status">{profileToast}</div> : null}
        </header>

        {activePage === 'Skill Management' ? (
          <SkillManagementPage />
        ) : activePage === 'Skill Assessment' ? (
          <SkillAssessmentPage onOpenDashboardSummary={() => setActivePage('Dashboard Summary')} />
        ) : activePage === 'Faculty Management' ? (
          <FacultyManagementPageV2 />
        ) : activePage === 'Dashboard Summary' ? (
          <DashboardSummaryPage onBackToAssessment={() => setActivePage('Skill Assessment')} />
        ) : activePage === 'Profile Settings' ? (
          <section className="vx-content profile-settings-page">
            <div className="profile-settings-card">
              <span className="profile-settings-kicker">Profile settings</span>
              <h1>{profileUser.name}</h1>
              <p>{profileUser.registerId} • {profileUser.role}</p>
              <div className="profile-settings-actions">
                <button type="button" className="tool-btn green" onClick={() => setActivePage('Dashboard Summary')}>Back to Dashboard</button>
                <button type="button" className="ghost" onClick={() => setActivePage('Skill Management')}>Close</button>
              </div>
            </div>
          </section>
        ) : activePage === 'Login' ? (
          <section className="vx-content profile-settings-page">
            <div className="profile-settings-card">
              <span className="profile-settings-kicker">Signed out</span>
              <h1>Logging out...</h1>
              <p>You have been redirected to the login experience.</p>
              <button type="button" className="tool-btn green" onClick={() => setActivePage('Skill Management')}>Return to app</button>
            </div>
          </section>
        ) : (
          <section className="vx-content">
          <div className="vx-breadcrumb">Apps / Tables / Default Tables</div>
          <div className="vx-title-row">
            <div>
              <h1>Tables</h1>
              <p>A collection of table styles similar to Valex bootstrap template.</p>
            </div>
            <div className="vx-title-actions">
              <button type="button">Export</button>
              <button type="button">Add New</button>
            </div>
          </div>

          <div className="vx-grid">
            <TableCard title="Basic Table" helper="Using simple default table styles." />
            <TableCard title="Bordered Table" helper="Use borders around rows and columns." className="is-bordered" />
            <TableCard title="Borderless Table" helper="Remove borders to create cleaner table." className="is-borderless" />
            <TableCard title="Striped Rows" helper="Alternating row backgrounds for readability." className="is-striped" />
            <TableCard title="Hoverable Rows" helper="Rows are highlighted on hover." className="is-hover" />
            <TableCard
              title="Contextual Table"
              helper="Context colors for different row types."
              className="is-context"
              rows={[
                ['1', 'Primary', 'Row', '@primary'],
                ['2', 'Success', 'Row', '@success'],
                ['3', 'Warning', 'Row', '@warning'],
              ]}
            />
          </div>
          </section>
        )}
      </main>

      <nav className="vx-mobile-nav">
        <button type="button" onClick={() => setMobileSidebarOpen(true)}>Menu</button>
        <button type="button" className="active">Tables</button>
        <button type="button">Profile</button>
      </nav>
    </div>
  )
}

export default App

