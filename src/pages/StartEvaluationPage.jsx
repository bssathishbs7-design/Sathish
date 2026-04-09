import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  FileText,
  FolderKanban,
  GraduationCap,
  Image as ImageIcon,
  Microscope,
  Search,
  Shapes,
  Stethoscope,
  Tag,
  UserRound,
  Users,
} from 'lucide-react'
import PageBreadcrumbs from '../components/PageBreadcrumbs'
import '../styles/evaluation.css'
import '../styles/start-evaluation.css'

const FACULTY_LIST = [
  { id: 'fac-1', name: 'Dr. Meera Nair', role: 'Lead Evaluator' },
  { id: 'fac-2', name: 'Dr. Arjun Kumar', role: 'Co Evaluator' },
]

const formatDate = (value) => (value ? String(value).split(',')[0].trim() : 'Not set')
const normalizeValue = (value, fallback = 'Not Applicable') => value ?? fallback

const getActivityTypeTone = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()

  if (normalized === 'ospe') return 'is-ospe'
  if (normalized === 'osce') return 'is-osce'
  if (normalized === 'interpretation') return 'is-interpretation'
  if (normalized === 'image') return 'is-image'

  return ''
}

const getActivityTypeIcon = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()

  if (normalized === 'ospe') return Microscope
  if (normalized === 'osce') return Stethoscope
  if (normalized === 'interpretation') return FileText
  if (normalized === 'image') return ImageIcon

  return Shapes
}

const buildStudentName = (index, sgt = 'SGT') => {
  const names = [
    'Aarav Menon',
    'Diya Krishnan',
    'Kavin Raj',
    'Megha Suresh',
    'Nithin Paul',
    'Riya Thomas',
    'Sanjay Iyer',
    'Tanvi Patel',
  ]

  return `${names[index % names.length]} ${sgt.replace(/\s+/g, '')}${index + 1}`
}

const buildEvaluationItems = (assignment, record) => {
  const activityType = String(record?.activityType ?? assignment?.type ?? 'Interpretation').toLowerCase()
  const modules = assignment?.examData?.modules ?? {}
  const referenceImages = modules.referenceImages ?? []

  const createMetadata = (item, index, fallbackLabel, sectionType) => ({
    id: item.id ?? `${sectionType}-${index + 1}`,
    label: fallbackLabel,
    prompt: item.questionText ?? item.prompt ?? item.text ?? `${fallbackLabel} prompt not available.`,
    marks: item.marks ?? '1',
    isCritical: Boolean(item.isCritical),
    tags: item.tags ?? [],
    domains: [
      { label: `COG ${normalizeValue(item.cognitive ?? (item.domain === 'Cognitive' ? item.domain : undefined))}`, tone: 'is-domain-cognitive' },
      { label: `AFF ${normalizeValue(item.affective)}`, tone: 'is-domain-affective' },
      { label: `PSY ${normalizeValue(item.psychomotor ?? (item.domain === 'Psychomotor' ? item.domain : undefined))}`, tone: 'is-domain-psychomotor' },
    ],
    answerKey: item.answerKey ?? `Expected answer point ${index + 1} for ${record?.activityType ?? 'activity'}.`,
    explanation: item.explanation ?? `Explanation guide ${index + 1} for evaluator reference.`,
  })

  const checklistItems = (modules.checklist ?? []).map((item, index) => ({
    ...createMetadata(item, index, `Checklist ${index + 1}`, 'checklist'),
    label: item.text ?? `Checklist ${index + 1}`,
    prompt: item.text ?? item.questionText ?? item.prompt ?? `Checklist ${index + 1} prompt not available.`,
    type: 'checklist',
    sectionLabel: 'Checklist',
  }))

  const formItems = (modules.form ?? []).map((item, index) => ({
    ...createMetadata(item, index, `Form ${index + 1}`, 'form'),
    responses: (item.responses ?? []).map((response, responseIndex) => ({
      id: response.key ?? `${item.id ?? 'form'}-response-${responseIndex + 1}`,
      label: response.label ?? `Response ${responseIndex + 1}`,
    })),
    type: 'form',
    sectionLabel: 'Form',
  }))

  const scaffoldItems = (modules.scaffolding ?? []).map((item, index) => ({
    ...createMetadata(item, index, `Scaffolding ${index + 1}`, 'scaffold'),
    type: 'scaffolding',
    sectionLabel: 'Scaffolding',
  }))

  const imageItems = activityType === 'image'
    ? (modules.questions ?? []).map((item, index) => ({
        ...createMetadata(item, index, `Image ${index + 1}`, 'image'),
        type: 'image',
        sectionLabel: 'Image',
        referenceImages: referenceImages.length ? referenceImages : [{ id: 'image-ref-1', src: '', title: 'Reference Image 1' }],
      }))
    : []

  const questionItems = activityType !== 'image'
    ? (modules.questions ?? []).map((item, index) => ({
        ...createMetadata(item, index, `Manual Question ${index + 1}`, 'question'),
        type: 'question',
        sectionLabel: 'Manual Question',
        referenceImages: index === 0 && referenceImages.length ? referenceImages : [],
      }))
    : []

  const orderedGroups = [
    ...checklistItems,
    ...formItems,
    ...scaffoldItems,
    ...imageItems,
    ...questionItems,
  ]

  if (orderedGroups.length) return orderedGroups

  if (activityType === 'osce' || activityType === 'ospe') {
    return [
      {
        ...createMetadata({}, 0, 'Checklist 1', 'check'),
        label: 'Checklist 1',
        prompt: 'Verifies identity and preparation steps.',
        type: 'checklist',
        sectionLabel: 'Checklist',
      },
    ]
  }

  if (activityType === 'image') {
    return [{
      ...createMetadata({}, 0, 'Image 1', 'image'),
      prompt: 'Review the provided image and describe the key findings.',
      type: 'image',
      sectionLabel: 'Image',
      referenceImages: [{ id: 'image-ref-1', src: '', title: 'Reference Image 1' }],
    }]
  }

  return [{
        ...createMetadata({}, 0, 'Manual Question 1', 'question'),
        prompt: 'Review the scenario and provide your interpretation.',
        type: 'question',
        sectionLabel: 'Manual Question',
      }]
}

const buildStudentSubmission = (student, items, record, latestSubmission) => {
  const hasRealSubmission = Boolean(latestSubmission?.answers) && student.id === 'student-1'
  const answers = latestSubmission?.answers ?? { questions: {}, forms: {}, scaffolding: {} }
  const normalizedType = String(record?.activityType ?? '').toLowerCase()

  const mappedItems = items.map((item, index) => {
    if (item.type === 'form') {
      return {
        ...item,
        answers: item.responses?.map((response, responseIndex) => ({
          label: response.label,
          value: hasRealSubmission
            ? answers.forms?.[response.id] ?? 'Not answered'
            : `Sample response ${responseIndex + 1} for ${student.name}`,
        })) ?? [],
      }
    }

    if (item.type === 'checklist') {
      return {
        ...item,
        status: hasRealSubmission ? 'Completed' : index % 2 === 0 ? 'Completed' : 'Pending',
        answer:
          hasRealSubmission
            ? answers.questions?.[item.id] ?? answers.scaffolding?.[item.id] ?? 'Reviewed by evaluator.'
            : `Observation ${index + 1} recorded for ${student.name}.`,
      }
    }

    return {
      ...item,
      answer:
        hasRealSubmission
          ? answers.questions?.[item.id] ?? answers.scaffolding?.[item.id] ?? 'Not answered'
          : normalizedType === 'image'
            ? `Student interpretation for image review ${index + 1}.`
            : `Submitted answer ${index + 1} by ${student.name}.`,
    }
  })

  return {
    studentId: student.id,
    submittedAt: hasRealSubmission ? latestSubmission.submittedAt : student.submittedAt,
    status: student.submissionStatus,
    items: mappedItems,
  }
}

const buildStudentRoster = (record, assignment, latestSubmission) => {
  const count = Math.max(1, Number(record?.studentCount ?? 6))
  const items = buildEvaluationItems(assignment, record)

  return Array.from({ length: count }, (_, index) => {
    const student = {
      id: `student-${index + 1}`,
      name:
        index === 0 && latestSubmission?.studentName
          ? latestSubmission.studentName
          : buildStudentName(index, record?.sgt),
      registerId: index === 0 && latestSubmission?.studentId ? latestSubmission.studentId : `MC25${String(index + 101).padStart(3, '0')}`,
      submissionStatus: index === 0 ? 'Submitted' : index < Math.min(count, 4) ? 'Submitted' : 'Pending',
      evaluationStatus: index === 0 ? 'Pending' : index % 4 === 0 ? 'Completed' : 'Pending',
      submittedAt: index === 0 && latestSubmission?.submittedAt ? latestSubmission.submittedAt : index < Math.min(count, 4) ? `0${index + 1}/04/2026, 09:1${index} ` : null,
    }

    return {
      ...student,
      submission: buildStudentSubmission(student, items, record, latestSubmission),
    }
  })
}

function StudentResponsePanel({ student, record }) {
  const activityType = String(record?.activityType ?? '').toLowerCase()
  const Icon = getActivityTypeIcon(record?.activityType)
  const submission = student?.submission
  const groupedItems = useMemo(() => {
    const groups = (submission?.items ?? []).reduce((accumulator, item) => {
      const key = item.sectionLabel ?? 'Questions'

      if (!accumulator[key]) {
        accumulator[key] = []
      }

      accumulator[key].push(item)
      return accumulator
    }, {})

    return Object.entries(groups).map(([label, items]) => ({ label, items }))
  }, [submission])
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    if (!groupedItems.length) {
      setActiveSection('')
      return
    }

    if (!activeSection || !groupedItems.some((group) => group.label === activeSection)) {
      setActiveSection(groupedItems[0].label)
    }
  }, [activeSection, groupedItems])

  if (!student) {
    return (
      <section className="start-eval-detail-card start-eval-empty-state">
        <strong>Select a student to review the submission.</strong>
      </section>
    )
  }

  if (student.submissionStatus !== 'Submitted') {
    return (
      <section className="start-eval-detail-card start-eval-empty-state">
        <strong>No submission available</strong>
        <p>{student.name} has not submitted this activity yet.</p>
      </section>
    )
  }

  const activeGroup = groupedItems.find((group) => group.label === activeSection) ?? groupedItems[0]
  const activeItems = activeGroup?.items ?? []

  return (
    <section className="start-eval-detail-card">
      <div className="start-eval-detail-head">
        <div>
          <span className={`eval-type-chip ${getActivityTypeTone(record?.activityType)}`}>
            {record?.activityType}
          </span>
          <h2>{student.name}</h2>
          <p>{student.registerId} • Submitted {formatDate(submission?.submittedAt)}</p>
        </div>
        <span className={`eval-status-pill ${student.evaluationStatus === 'Completed' ? 'is-complete' : 'is-pending'}`}>
          {student.evaluationStatus}
        </span>
      </div>

      <div className="start-eval-response-kicker">
        <Icon size={14} strokeWidth={2} />
        {activityType === 'osce' || activityType === 'ospe' ? 'Checklist Review' : 'Student Response Review'}
      </div>

      {groupedItems.length ? (
        <div className="start-eval-section-tabs" role="tablist" aria-label="Student response sections">
          {groupedItems.map((group) => (
            <button
              key={group.label}
              type="button"
              role="tab"
              aria-selected={group.label === activeSection}
              className={`start-eval-section-tab ${group.label === activeSection ? 'is-active' : ''}`}
              onClick={() => setActiveSection(group.label)}
            >
              <span>{group.label}</span>
              <small>{group.items.length}</small>
            </button>
          ))}
        </div>
      ) : null}

      <div className="start-eval-response-list is-ordered">
        {activeItems.map((item, index) => (
          <article key={item.id} className={`start-eval-response-item ${item.isCritical ? 'is-critical' : ''}`}>
            <div className="start-eval-response-label">
              <strong>{item.label}</strong>
              {item.type === 'checklist' ? (
                <span className={`eval-status-pill ${item.status === 'Completed' ? 'is-complete' : 'is-pending'}`}>
                  {item.status}
                </span>
              ) : null}
            </div>

            <div className="start-eval-question-index">Question {index + 1}</div>

            <div className="start-eval-badge-row">
              <span className={`eval-type-chip ${getActivityTypeTone(record?.activityType)}`}>{record?.activityType}</span>
              <span className="start-eval-meta-badge is-section">{item.sectionLabel}</span>
              <span className="start-eval-meta-badge is-marks"><BadgeCheck size={12} strokeWidth={2} /> {item.marks} mark{String(item.marks) === '1' ? '' : 's'}</span>
              {item.isCritical ? <span className="start-eval-meta-badge is-critical"><AlertTriangle size={12} strokeWidth={2} /> Criticality</span> : null}
              {item.domains?.map((domain) => <span key={`${item.id}-${domain.label}`} className={`start-eval-meta-badge ${domain.tone}`}>{domain.label}</span>)}
              {item.tags?.map((tag) => <span key={`${item.id}-${tag}`} className="start-eval-meta-badge is-tag"><Tag size={12} strokeWidth={2} /> {tag}</span>)}
            </div>

            <div className="start-eval-question-box">
              <span>Question</span>
              <strong>{item.prompt}</strong>
            </div>

            {item.referenceImages?.length ? (
              <div className="start-eval-image-strip">
                {item.referenceImages.map((image, imageIndex) => (
                  <div key={image.id ?? `${item.id}-${imageIndex + 1}`} className="start-eval-image-card">
                    <ImageIcon size={16} strokeWidth={2} />
                    <span>{image.title ?? `Reference Image ${imageIndex + 1}`}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {item.answers ? (
              <div className="start-eval-form-response-list">
                {item.answers.map((response) => (
                  <div key={response.label} className="start-eval-form-response">
                    <span>{response.label}</span>
                    <strong>{response.value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="start-eval-answer-box">
                <span>Student Answer</span>
                <strong>{item.answer}</strong>
              </div>
            )}

            <div className="start-eval-evaluator-grid">
              <div className="start-eval-answer-box is-answer-key">
                <span>Answer Key</span>
                <strong>{item.answerKey}</strong>
              </div>
              <div className="start-eval-answer-box is-explanation">
                <span>Explanation Answer</span>
                <strong>{item.explanation}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function StartEvaluationPage({ evaluationRecord, onBackToEvaluation }) {
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')

  const roster = useMemo(
    () => buildStudentRoster(evaluationRecord, evaluationRecord?.assignment, evaluationRecord?.latestSubmission),
    [evaluationRecord],
  )

  const filteredStudents = useMemo(() => {
    const needle = studentSearch.trim().toLowerCase()

    return roster.filter((student) => (
      !needle
      || student.name.toLowerCase().includes(needle)
      || student.registerId.toLowerCase().includes(needle)
    ))
  }, [roster, studentSearch])

  useEffect(() => {
    if (!filteredStudents.length) {
      setSelectedStudentId('')
      return
    }

    if (!selectedStudentId || !filteredStudents.some((student) => student.id === selectedStudentId)) {
      const firstSubmitted = filteredStudents.find((student) => student.submissionStatus === 'Submitted')
      setSelectedStudentId(firstSubmitted?.id ?? filteredStudents[0].id)
    }
  }, [filteredStudents, selectedStudentId])

  const selectedStudent = filteredStudents.find((student) => student.id === selectedStudentId) ?? null
  const submittedCount = roster.filter((student) => student.submissionStatus === 'Submitted').length
  const completedCount = roster.filter((student) => student.evaluationStatus === 'Completed').length

  return (
    <section className="vx-content forms-page start-evaluation-page">
      <div className="start-eval-shell">
        <PageBreadcrumbs items={[{ label: 'Skills' }, { label: 'Evaluation' }, { label: 'Start Evaluation' }]} />
        <div className="vx-page-intro">
          <div className="vx-page-intro-title">
            <ClipboardCheck size={18} strokeWidth={2} className="vx-page-intro-icon" aria-hidden="true" />
            <h1>Start Evaluation</h1>
          </div>
        </div>

        <section className="start-eval-summary-card">
          <div className="start-eval-summary-copy">
            <div className="start-eval-summary-badges">
              <span className={`eval-type-chip ${getActivityTypeTone(evaluationRecord?.activityType)}`}>{evaluationRecord?.activityType ?? 'Activity'}</span>
              <span className={`eval-status-pill ${evaluationRecord?.evaluationStatus === 'Completed Evaluation' ? 'is-complete' : 'is-pending'}`}>
                {evaluationRecord?.evaluationStatus === 'Completed Evaluation' ? 'Completed' : 'Pending'}
              </span>
            </div>
            <h2>{evaluationRecord?.activityName ?? 'No evaluation selected'}</h2>
            <p>{evaluationRecord?.year ?? 'Year not set'} • {evaluationRecord?.sgt ?? 'SGT not set'}</p>
          </div>

          <div className="start-eval-summary-grid">
            <article className="start-eval-summary-tile">
              <span><Users size={13} strokeWidth={2} /> Students</span>
              <strong>{evaluationRecord?.studentCount ?? roster.length}</strong>
            </article>
            <article className="start-eval-summary-tile">
              <span><CheckCircle2 size={13} strokeWidth={2} /> Submitted</span>
              <strong>{submittedCount}</strong>
            </article>
            <article className="start-eval-summary-tile">
              <span><ClipboardCheck size={13} strokeWidth={2} /> Evaluated</span>
              <strong>{completedCount}</strong>
            </article>
            <article className="start-eval-summary-tile">
              <span><CalendarDays size={13} strokeWidth={2} /> Created</span>
              <strong>{formatDate(evaluationRecord?.createdDate)}</strong>
            </article>
          </div>
        </section>

        <section className="start-eval-board">
          <aside className="start-eval-student-panel">
            <div className="start-eval-panel-head">
              <div>
                <strong>Students</strong>
                <p>Click a student to switch the question and answer panel.</p>
              </div>
              <button type="button" className="ghost start-eval-back-btn" onClick={onBackToEvaluation}>
                <ChevronLeft size={15} strokeWidth={2} />
                Back
              </button>
            </div>

            <label className="start-eval-student-search">
              <Search size={15} strokeWidth={2} />
              <input
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Search student"
              />
            </label>

            <div className="start-eval-student-list">
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  className={`start-eval-student-item ${student.id === selectedStudentId ? 'is-active' : ''}`}
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <div className="start-eval-student-main">
                    <span className="start-eval-student-avatar">{student.name.slice(0, 2).toUpperCase()}</span>
                    <div>
                      <strong>{student.name}</strong>
                      <p>{student.registerId}</p>
                    </div>
                  </div>
                  <div className="start-eval-student-meta">
                    <span className={`eval-status-pill ${student.submissionStatus === 'Submitted' ? 'is-complete' : 'is-pending'}`}>
                      {student.submissionStatus}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="start-eval-main-panel">
            <StudentResponsePanel student={selectedStudent} record={evaluationRecord} />

            <section className="start-eval-faculty-card">
              <div className="start-eval-panel-head">
                <div>
                  <strong>Faculty</strong>
                  <p>Assigned evaluators for this batch.</p>
                </div>
              </div>

              <div className="start-eval-faculty-list">
                {FACULTY_LIST.map((faculty) => (
                  <article key={faculty.id} className="start-eval-faculty-item">
                    <span className="start-eval-faculty-avatar"><UserRound size={15} strokeWidth={2} /></span>
                    <div>
                      <strong>{faculty.name}</strong>
                      <p>{faculty.role}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="start-eval-batch-strip">
                <span><GraduationCap size={13} strokeWidth={2} /> {evaluationRecord?.year ?? 'Year not set'}</span>
                <span><FolderKanban size={13} strokeWidth={2} /> {evaluationRecord?.sgt ?? 'SGT not set'}</span>
              </div>
            </section>
          </div>
        </section>
      </div>
    </section>
  )
}
