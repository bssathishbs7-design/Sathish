import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CircleCheckBig,
  CircleX,
  History,
  FileText,
  Image as ImageIcon,
  Microscope,
  Search,
  Shapes,
  Stethoscope,
  Tag,
  Users,
} from 'lucide-react'
import '../styles/evaluation.css'
import '../styles/start-evaluation.css'

const CHECKLIST_FALLBACK_PROMPTS = [
  'Performs hand hygiene and introduces self to the patient.',
  'Confirms patient identity and explains the procedure clearly.',
  'Positions the patient correctly before starting the examination.',
  'Uses the instrument safely and follows the correct examination sequence.',
  'Communicates findings clearly and maintains professional behaviour.',
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

const getChecklistMarksState = (value, maxMarks) => {
  if (value === '' || value === null || value === undefined) return ''

  const numericValue = Number(value)
  const numericMax = Number(maxMarks)

  if (Number.isNaN(numericValue) || Number.isNaN(numericMax)) return 'is-invalid'
  if (numericValue === 0) return 'is-invalid'
  if (numericValue > numericMax) return 'is-invalid'
  if (numericValue > 0) return 'is-valid'

  return ''
}

const getChecklistCardState = (decisionState, marksState) => {
  if (decisionState === 'wrong' || marksState === 'is-invalid') return 'is-error'
  if (decisionState === 'right' || marksState === 'is-valid') return 'is-success'
  return ''
}

const getSanitizedChecklistMarksValue = (rawValue, maxMarks) => {
  if (rawValue === '') return ''
  if (!/^\d*\.?\d*$/.test(rawValue)) return null

  const numericValue = Number(rawValue)
  const numericMax = Number(maxMarks)

  if (Number.isNaN(numericValue) || Number.isNaN(numericMax)) return null
  if (numericValue < 0 || numericValue > numericMax) return null

  return rawValue
}

const getDecisionStateFromMarks = (value) => {
  if (value === '' || value === null || value === undefined) return ''

  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) return ''
  if (numericValue === 0) return 'wrong'
  if (numericValue > 0) return 'right'

  return ''
}

const getChecklistItemStatus = (decisionState, marksValue) => {
  if (decisionState === 'right' || decisionState === 'wrong') return 'Completed'
  if (marksValue !== '' && marksValue !== null && marksValue !== undefined) return 'Completed'
  return 'Pending'
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

  return names[index % names.length]
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
    ...createMetadata(item, index, `Checklist Item ${index + 1}`, 'checklist'),
    label: item.text ?? CHECKLIST_FALLBACK_PROMPTS[index] ?? `Clinical checklist item ${index + 1}`,
    prompt: item.text ?? item.questionText ?? item.prompt ?? CHECKLIST_FALLBACK_PROMPTS[index] ?? `Clinical checklist item ${index + 1}`,
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
        ...createMetadata({}, 0, 'Checklist Item 1', 'check'),
        label: CHECKLIST_FALLBACK_PROMPTS[0],
        prompt: CHECKLIST_FALLBACK_PROMPTS[0],
        type: 'checklist',
        sectionLabel: 'Checklist',
      },
      {
        ...createMetadata({}, 1, 'Checklist Item 2', 'check'),
        label: CHECKLIST_FALLBACK_PROMPTS[1],
        prompt: CHECKLIST_FALLBACK_PROMPTS[1],
        type: 'checklist',
        sectionLabel: 'Checklist',
      },
      {
        ...createMetadata({}, 2, 'Checklist Item 3', 'check'),
        label: CHECKLIST_FALLBACK_PROMPTS[2],
        prompt: CHECKLIST_FALLBACK_PROMPTS[2],
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
        remarks:
          hasRealSubmission
            ? answers.questions?.[item.id] ?? answers.scaffolding?.[item.id] ?? ''
            : '',
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

function StudentResponsePanel({ student, record, onObtainedMarksChange }) {
  const activityType = String(record?.activityType ?? '').toLowerCase()
  const Icon = getActivityTypeIcon(record?.activityType)
  const submission = student?.submission
  const [checklistRemarks, setChecklistRemarks] = useState({})
  const [openChecklistRemarks, setOpenChecklistRemarks] = useState({})
  const [checklistDecisions, setChecklistDecisions] = useState({})
  const [checklistMarks, setChecklistMarks] = useState({})
  const [formRemarks, setFormRemarks] = useState({})
  const [openFormRemarks, setOpenFormRemarks] = useState({})
  const [formDecisions, setFormDecisions] = useState({})
  const [formMarks, setFormMarks] = useState({})
  const [scaffoldingRemarks, setScaffoldingRemarks] = useState({})
  const [openScaffoldingRemarks, setOpenScaffoldingRemarks] = useState({})
  const [scaffoldingDecisions, setScaffoldingDecisions] = useState({})
  const [scaffoldingMarks, setScaffoldingMarks] = useState({})
  const [imageRemarks, setImageRemarks] = useState({})
  const [openImageRemarks, setOpenImageRemarks] = useState({})
  const [imageDecisions, setImageDecisions] = useState({})
  const [imageMarks, setImageMarks] = useState({})
  const [manualQuestionRemarks, setManualQuestionRemarks] = useState({})
  const [openManualQuestionRemarks, setOpenManualQuestionRemarks] = useState({})
  const [manualQuestionDecisions, setManualQuestionDecisions] = useState({})
  const [manualQuestionMarks, setManualQuestionMarks] = useState({})
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

  useEffect(() => {
    if (!student?.id) {
      setChecklistRemarks({})
      setOpenChecklistRemarks({})
      setChecklistDecisions({})
      setChecklistMarks({})
      setFormRemarks({})
      setOpenFormRemarks({})
      setFormDecisions({})
      setFormMarks({})
      setScaffoldingRemarks({})
      setOpenScaffoldingRemarks({})
      setScaffoldingDecisions({})
      setScaffoldingMarks({})
      setImageRemarks({})
      setOpenImageRemarks({})
      setImageDecisions({})
      setImageMarks({})
      setManualQuestionRemarks({})
      setOpenManualQuestionRemarks({})
      setManualQuestionDecisions({})
      setManualQuestionMarks({})
      onObtainedMarksChange?.(0)
      return
    }

    const checklistItems = (submission?.items ?? []).filter((item) => item.type === 'checklist')
    const formItems = (submission?.items ?? []).filter((item) => item.type === 'form')
    const scaffoldingItems = (submission?.items ?? []).filter((item) => item.type === 'scaffolding')
    const imageItems = (submission?.items ?? []).filter((item) => item.type === 'image')
    const manualQuestionItems = (submission?.items ?? []).filter((item) => item.type === 'question')
    const nextRemarks = Object.fromEntries(
      checklistItems.map((item) => [item.id, item.remarks ?? '']),
    )
    const nextDecisions = Object.fromEntries(
      checklistItems.map((item) => [item.id, '']),
    )
    const nextMarks = Object.fromEntries(
      checklistItems.map((item) => [item.id, '']),
    )
    const nextFormRemarks = Object.fromEntries(
      formItems.map((item) => [item.id, '']),
    )
    const nextFormDecisions = Object.fromEntries(
      formItems.map((item) => [item.id, '']),
    )
    const nextFormMarks = Object.fromEntries(
      formItems.map((item) => [item.id, '']),
    )
    const nextScaffoldingRemarks = Object.fromEntries(
      scaffoldingItems.map((item) => [item.id, '']),
    )
    const nextScaffoldingDecisions = Object.fromEntries(
      scaffoldingItems.map((item) => [item.id, '']),
    )
    const nextScaffoldingMarks = Object.fromEntries(
      scaffoldingItems.map((item) => [item.id, '']),
    )
    const nextImageRemarks = Object.fromEntries(
      imageItems.map((item) => [item.id, '']),
    )
    const nextImageDecisions = Object.fromEntries(
      imageItems.map((item) => [item.id, '']),
    )
    const nextImageMarks = Object.fromEntries(
      imageItems.map((item) => [item.id, '']),
    )
    const nextManualQuestionRemarks = Object.fromEntries(
      manualQuestionItems.map((item) => [item.id, '']),
    )
    const nextManualQuestionDecisions = Object.fromEntries(
      manualQuestionItems.map((item) => [item.id, '']),
    )
    const nextManualQuestionMarks = Object.fromEntries(
      manualQuestionItems.map((item) => [item.id, '']),
    )

    setChecklistRemarks(nextRemarks)
    setOpenChecklistRemarks({})
    setChecklistDecisions(nextDecisions)
    setChecklistMarks(nextMarks)
    setFormRemarks(nextFormRemarks)
    setOpenFormRemarks({})
    setFormDecisions(nextFormDecisions)
    setFormMarks(nextFormMarks)
    setScaffoldingRemarks(nextScaffoldingRemarks)
    setOpenScaffoldingRemarks({})
    setScaffoldingDecisions(nextScaffoldingDecisions)
    setScaffoldingMarks(nextScaffoldingMarks)
    setImageRemarks(nextImageRemarks)
    setOpenImageRemarks({})
    setImageDecisions(nextImageDecisions)
    setImageMarks(nextImageMarks)
    setManualQuestionRemarks(nextManualQuestionRemarks)
    setOpenManualQuestionRemarks({})
    setManualQuestionDecisions(nextManualQuestionDecisions)
    setManualQuestionMarks(nextManualQuestionMarks)
    onObtainedMarksChange?.(0)
  }, [student?.id, submission])

  useEffect(() => {
    const checklistObtainedMarks = Object.values(checklistMarks).reduce((sum, value) => sum + (Number(value) || 0), 0)
    const formObtainedMarks = Object.values(formMarks).reduce((sum, value) => sum + (Number(value) || 0), 0)
    const scaffoldingObtainedMarks = Object.values(scaffoldingMarks).reduce((sum, value) => sum + (Number(value) || 0), 0)
    const imageObtainedMarks = Object.values(imageMarks).reduce((sum, value) => sum + (Number(value) || 0), 0)
    const manualQuestionObtainedMarks = Object.values(manualQuestionMarks).reduce((sum, value) => sum + (Number(value) || 0), 0)
    const obtainedMarks = checklistObtainedMarks + formObtainedMarks + scaffoldingObtainedMarks + imageObtainedMarks + manualQuestionObtainedMarks
    onObtainedMarksChange?.(obtainedMarks)
  }, [checklistMarks, formMarks, imageMarks, manualQuestionMarks, onObtainedMarksChange, scaffoldingMarks])

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
  const evaluatedCount = activeItems.reduce((count, item) => {
    if (item.type === 'checklist') {
      return count + (checklistDecisions[item.id] === 'right' || checklistDecisions[item.id] === 'wrong' ? 1 : 0)
    }

    if (item.type === 'form') {
      return count + (formDecisions[item.id] === 'right' || formDecisions[item.id] === 'wrong' ? 1 : 0)
    }

    if (item.type === 'scaffolding') {
      return count + (scaffoldingDecisions[item.id] === 'right' || scaffoldingDecisions[item.id] === 'wrong' ? 1 : 0)
    }

    if (item.type === 'image') {
      return count + (imageDecisions[item.id] === 'right' || imageDecisions[item.id] === 'wrong' ? 1 : 0)
    }

    if (item.type === 'question') {
      return count + (manualQuestionDecisions[item.id] === 'right' || manualQuestionDecisions[item.id] === 'wrong' ? 1 : 0)
    }

    return count
  }, 0)

  return (
    <section className="start-eval-detail-card">
      {groupedItems.length ? (
        <div className="start-eval-section-head">
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

          <span className="start-eval-section-progress-badge">
            Evaluated {evaluatedCount} / {activeItems.length}
          </span>
        </div>
      ) : null}

      <div className="start-eval-response-list is-ordered">
        {activeItems.map((item) => {
          const isChecklist = item.type === 'checklist'
          const isForm = item.type === 'form'
          const isScaffolding = item.type === 'scaffolding'
          const isImage = item.type === 'image'
          const isManualQuestion = item.type === 'question'
          const decisionState = isChecklist
            ? (checklistDecisions[item.id] ?? '')
            : isForm
              ? (formDecisions[item.id] ?? '')
              : isScaffolding
                ? (scaffoldingDecisions[item.id] ?? '')
                : isImage
                  ? (imageDecisions[item.id] ?? '')
                  : isManualQuestion
                    ? (manualQuestionDecisions[item.id] ?? '')
              : ''
          const marksValue = isChecklist
            ? checklistMarks[item.id]
            : isForm
              ? formMarks[item.id]
              : isScaffolding
                ? scaffoldingMarks[item.id]
                : isImage
                  ? imageMarks[item.id]
                  : isManualQuestion
                    ? manualQuestionMarks[item.id]
              : ''
          const itemStatus = isChecklist || isForm || isScaffolding || isImage || isManualQuestion
            ? getChecklistItemStatus(decisionState, marksValue)
            : item.status
          const marksState = isChecklist || isForm || isScaffolding || isImage || isManualQuestion
            ? getChecklistMarksState(marksValue, item.marks)
            : ''
          const cardState = isChecklist || isForm || isScaffolding || isImage || isManualQuestion
            ? getChecklistCardState(decisionState, marksState)
            : ''

          return (
            <article key={item.id} className={`start-eval-response-item ${item.isCritical ? 'is-critical' : ''} ${cardState}`.trim()}>
            <div className={`start-eval-response-top ${item.type === 'checklist' ? 'is-checklist' : ''}`}>
              <div className="start-eval-response-label">
                {item.type !== 'checklist' && item.type !== 'scaffolding' ? <strong>{item.label}</strong> : null}
              </div>

              <div className="start-eval-badge-row">
                {item.type !== 'checklist' && item.type !== 'scaffolding' ? <span className="start-eval-meta-badge is-section">{item.sectionLabel}</span> : null}
                <span className="start-eval-meta-badge is-marks"><BadgeCheck size={12} strokeWidth={2} /> {item.marks} mark{String(item.marks) === '1' ? '' : 's'}</span>
                {item.isCritical ? <span className="start-eval-meta-badge is-critical"><AlertTriangle size={12} strokeWidth={2} /> Criticality</span> : null}
                {item.domains?.map((domain) => <span key={`${item.id}-${domain.label}`} className={`start-eval-meta-badge ${domain.tone}`}>{domain.label}</span>)}
                {item.tags?.map((tag) => <span key={`${item.id}-${tag}`} className="start-eval-meta-badge is-tag"><Tag size={12} strokeWidth={2} /> {tag}</span>)}
              </div>

              {item.type === 'checklist' || item.type === 'form' || item.type === 'scaffolding' || item.type === 'image' || item.type === 'question' ? (
                <span className={`eval-status-pill ${itemStatus === 'Completed' ? 'is-complete' : 'is-pending'}`}>
                  {itemStatus}
                </span>
              ) : null}
            </div>

            <div className="start-eval-question-box">
              <span>{item.type === 'checklist' ? 'Checklist Question' : 'Question'}</span>
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

            {item.type === 'checklist' ? (
              <div className="start-eval-checklist-actions">
                <button
                  type="button"
                  className={`start-eval-remarks-toggle ${openChecklistRemarks[item.id] ? 'is-open' : ''}`}
                  onClick={() => setOpenChecklistRemarks((current) => ({ ...current, [item.id]: !current[item.id] }))}
                >
                  Remarks
                </button>

                <div className="start-eval-checklist-actions-end">
                  <label className="start-eval-checklist-marks-field">
                    <span>Obtained</span>
                    <input
                      type="number"
                      min="0"
                      max={item.marks}
                      step="0.1"
                      className={`start-eval-checklist-marks ${marksState}`}
                      value={checklistMarks[item.id] ?? ''}
                      onChange={(event) => {
                        const nextValue = getSanitizedChecklistMarksValue(event.target.value, item.marks)

                        if (nextValue === null) return

                        setChecklistMarks((current) => ({ ...current, [item.id]: nextValue }))
                        setChecklistDecisions((current) => ({ ...current, [item.id]: getDecisionStateFromMarks(nextValue) }))
                      }}
                      placeholder="Marks"
                    />
                  </label>

                  <div className="start-eval-checklist-decision-group" role="group" aria-label="Checklist evaluation">
                    <button
                      type="button"
                      className={`start-eval-checklist-icon-btn is-wrong ${decisionState === 'wrong' ? 'is-active' : ''}`}
                      aria-label="Mark as wrong"
                      onClick={() => {
                        setChecklistMarks((current) => ({ ...current, [item.id]: '' }))
                        setChecklistDecisions((current) => ({ ...current, [item.id]: current[item.id] === 'wrong' ? '' : 'wrong' }))
                      }}
                    >
                      <CircleX size={16} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      className={`start-eval-checklist-icon-btn is-right ${decisionState === 'right' ? 'is-active' : ''}`}
                      aria-label="Mark as right"
                      onClick={() => {
                        setChecklistMarks((current) => ({ ...current, [item.id]: current[item.id] === 'right' ? '' : String(item.marks ?? '') }))
                        setChecklistDecisions((current) => ({ ...current, [item.id]: current[item.id] === 'right' ? '' : 'right' }))
                      }}
                    >
                      <CircleCheckBig size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {openChecklistRemarks[item.id] ? (
                  <label className="start-eval-remarks-box">
                    <textarea
                      rows={2}
                      value={checklistRemarks[item.id] ?? ''}
                      onChange={(event) => setChecklistRemarks((current) => ({ ...current, [item.id]: event.target.value }))}
                      placeholder="Add remarks"
                    />
                  </label>
                ) : null}
              </div>
            ) : item.answers ? (
              <>
                <div className="start-eval-form-response-list">
                  {item.answers.map((response) => (
                    <div key={response.label} className="start-eval-form-response">
                      <span>{response.label}</span>
                      <strong>{response.value}</strong>
                    </div>
                  ))}
                </div>

                {item.type === 'form' ? (
                  <div className="start-eval-checklist-actions">
                    <button
                      type="button"
                      className={`start-eval-remarks-toggle ${openFormRemarks[item.id] ? 'is-open' : ''}`}
                      onClick={() => setOpenFormRemarks((current) => ({ ...current, [item.id]: !current[item.id] }))}
                    >
                      Remarks
                    </button>

                    <div className="start-eval-checklist-actions-end">
                      <label className="start-eval-checklist-marks-field">
                        <span>Obtained</span>
                        <input
                          type="number"
                          min="0"
                          max={item.marks}
                          step="0.1"
                          className={`start-eval-checklist-marks ${marksState}`}
                          value={formMarks[item.id] ?? ''}
                          onChange={(event) => {
                            const nextValue = getSanitizedChecklistMarksValue(event.target.value, item.marks)

                            if (nextValue === null) return

                            setFormMarks((current) => ({ ...current, [item.id]: nextValue }))
                            setFormDecisions((current) => ({ ...current, [item.id]: getDecisionStateFromMarks(nextValue) }))
                          }}
                          placeholder="Marks"
                        />
                      </label>

                      <div className="start-eval-checklist-decision-group" role="group" aria-label="Form evaluation">
                        <button
                          type="button"
                          className={`start-eval-checklist-icon-btn is-wrong ${decisionState === 'wrong' ? 'is-active' : ''}`}
                          aria-label="Mark as wrong"
                          onClick={() => {
                            setFormMarks((current) => ({ ...current, [item.id]: '' }))
                            setFormDecisions((current) => ({ ...current, [item.id]: current[item.id] === 'wrong' ? '' : 'wrong' }))
                          }}
                        >
                          <CircleX size={16} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className={`start-eval-checklist-icon-btn is-right ${decisionState === 'right' ? 'is-active' : ''}`}
                          aria-label="Mark as right"
                          onClick={() => {
                            setFormMarks((current) => ({ ...current, [item.id]: current[item.id] === 'right' ? '' : String(item.marks ?? '') }))
                            setFormDecisions((current) => ({ ...current, [item.id]: current[item.id] === 'right' ? '' : 'right' }))
                          }}
                        >
                          <CircleCheckBig size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>

                    {openFormRemarks[item.id] ? (
                      <label className="start-eval-remarks-box">
                        <textarea
                          rows={2}
                          value={formRemarks[item.id] ?? ''}
                          onChange={(event) => setFormRemarks((current) => ({ ...current, [item.id]: event.target.value }))}
                          placeholder="Add remarks"
                        />
                      </label>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="start-eval-answer-box">
                  <span>Student Answer</span>
                  <strong>{item.answer}</strong>
                </div>

                {item.type === 'scaffolding' ? (
                  <div className="start-eval-checklist-actions">
                    <button
                      type="button"
                      className={`start-eval-remarks-toggle ${openScaffoldingRemarks[item.id] ? 'is-open' : ''}`}
                      onClick={() => setOpenScaffoldingRemarks((current) => ({ ...current, [item.id]: !current[item.id] }))}
                    >
                      Remarks
                    </button>

                    <div className="start-eval-checklist-actions-end">
                      <label className="start-eval-checklist-marks-field">
                        <span>Obtained</span>
                        <input
                          type="number"
                          min="0"
                          max={item.marks}
                          step="0.1"
                          className={`start-eval-checklist-marks ${marksState}`}
                          value={scaffoldingMarks[item.id] ?? ''}
                          onChange={(event) => {
                            const nextValue = getSanitizedChecklistMarksValue(event.target.value, item.marks)

                            if (nextValue === null) return

                            setScaffoldingMarks((current) => ({ ...current, [item.id]: nextValue }))
                            setScaffoldingDecisions((current) => ({ ...current, [item.id]: getDecisionStateFromMarks(nextValue) }))
                          }}
                          placeholder="Marks"
                        />
                      </label>

                      <div className="start-eval-checklist-decision-group" role="group" aria-label="Scaffolding evaluation">
                        <button
                          type="button"
                          className={`start-eval-checklist-icon-btn is-wrong ${decisionState === 'wrong' ? 'is-active' : ''}`}
                          aria-label="Mark as wrong"
                          onClick={() => {
                            setScaffoldingMarks((current) => ({ ...current, [item.id]: '' }))
                            setScaffoldingDecisions((current) => ({ ...current, [item.id]: current[item.id] === 'wrong' ? '' : 'wrong' }))
                          }}
                        >
                          <CircleX size={16} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className={`start-eval-checklist-icon-btn is-right ${decisionState === 'right' ? 'is-active' : ''}`}
                          aria-label="Mark as right"
                          onClick={() => {
                            setScaffoldingMarks((current) => ({ ...current, [item.id]: current[item.id] === 'right' ? '' : String(item.marks ?? '') }))
                            setScaffoldingDecisions((current) => ({ ...current, [item.id]: current[item.id] === 'right' ? '' : 'right' }))
                          }}
                        >
                          <CircleCheckBig size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>

                    {openScaffoldingRemarks[item.id] ? (
                      <label className="start-eval-remarks-box">
                        <textarea
                          rows={2}
                          value={scaffoldingRemarks[item.id] ?? ''}
                          onChange={(event) => setScaffoldingRemarks((current) => ({ ...current, [item.id]: event.target.value }))}
                          placeholder="Add remarks"
                        />
                      </label>
                    ) : null}
                  </div>
                ) : item.type === 'image' ? (
                  <div className="start-eval-checklist-actions">
                    <button
                      type="button"
                      className={`start-eval-remarks-toggle ${openImageRemarks[item.id] ? 'is-open' : ''}`}
                      onClick={() => setOpenImageRemarks((current) => ({ ...current, [item.id]: !current[item.id] }))}
                    >
                      Remarks
                    </button>

                    <div className="start-eval-checklist-actions-end">
                      <label className="start-eval-checklist-marks-field">
                        <span>Obtained</span>
                        <input
                          type="number"
                          min="0"
                          max={item.marks}
                          step="0.1"
                          className={`start-eval-checklist-marks ${marksState}`}
                          value={imageMarks[item.id] ?? ''}
                          onChange={(event) => {
                            const nextValue = getSanitizedChecklistMarksValue(event.target.value, item.marks)

                            if (nextValue === null) return

                            setImageMarks((current) => ({ ...current, [item.id]: nextValue }))
                            setImageDecisions((current) => ({ ...current, [item.id]: getDecisionStateFromMarks(nextValue) }))
                          }}
                          placeholder="Marks"
                        />
                      </label>

                      <div className="start-eval-checklist-decision-group" role="group" aria-label="Image evaluation">
                        <button
                          type="button"
                          className={`start-eval-checklist-icon-btn is-wrong ${decisionState === 'wrong' ? 'is-active' : ''}`}
                          aria-label="Mark as wrong"
                          onClick={() => {
                            setImageMarks((current) => ({ ...current, [item.id]: '' }))
                            setImageDecisions((current) => ({ ...current, [item.id]: current[item.id] === 'wrong' ? '' : 'wrong' }))
                          }}
                        >
                          <CircleX size={16} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className={`start-eval-checklist-icon-btn is-right ${decisionState === 'right' ? 'is-active' : ''}`}
                          aria-label="Mark as right"
                          onClick={() => {
                            setImageMarks((current) => ({ ...current, [item.id]: current[item.id] === 'right' ? '' : String(item.marks ?? '') }))
                            setImageDecisions((current) => ({ ...current, [item.id]: current[item.id] === 'right' ? '' : 'right' }))
                          }}
                        >
                          <CircleCheckBig size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>

                    {openImageRemarks[item.id] ? (
                      <label className="start-eval-remarks-box">
                        <textarea
                          rows={2}
                          value={imageRemarks[item.id] ?? ''}
                          onChange={(event) => setImageRemarks((current) => ({ ...current, [item.id]: event.target.value }))}
                          placeholder="Add remarks"
                        />
                      </label>
                    ) : null}
                  </div>
                ) : item.type === 'question' ? (
                  <div className="start-eval-checklist-actions">
                    <button
                      type="button"
                      className={`start-eval-remarks-toggle ${openManualQuestionRemarks[item.id] ? 'is-open' : ''}`}
                      onClick={() => setOpenManualQuestionRemarks((current) => ({ ...current, [item.id]: !current[item.id] }))}
                    >
                      Remarks
                    </button>

                    <div className="start-eval-checklist-actions-end">
                      <label className="start-eval-checklist-marks-field">
                        <span>Obtained</span>
                        <input
                          type="number"
                          min="0"
                          max={item.marks}
                          step="0.1"
                          className={`start-eval-checklist-marks ${marksState}`}
                          value={manualQuestionMarks[item.id] ?? ''}
                          onChange={(event) => {
                            const nextValue = getSanitizedChecklistMarksValue(event.target.value, item.marks)

                            if (nextValue === null) return

                            setManualQuestionMarks((current) => ({ ...current, [item.id]: nextValue }))
                            setManualQuestionDecisions((current) => ({ ...current, [item.id]: getDecisionStateFromMarks(nextValue) }))
                          }}
                          placeholder="Marks"
                        />
                      </label>

                      <div className="start-eval-checklist-decision-group" role="group" aria-label="Manual question evaluation">
                        <button
                          type="button"
                          className={`start-eval-checklist-icon-btn is-wrong ${decisionState === 'wrong' ? 'is-active' : ''}`}
                          aria-label="Mark as wrong"
                          onClick={() => {
                            setManualQuestionMarks((current) => ({ ...current, [item.id]: '' }))
                            setManualQuestionDecisions((current) => ({ ...current, [item.id]: current[item.id] === 'wrong' ? '' : 'wrong' }))
                          }}
                        >
                          <CircleX size={16} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className={`start-eval-checklist-icon-btn is-right ${decisionState === 'right' ? 'is-active' : ''}`}
                          aria-label="Mark as right"
                          onClick={() => {
                            setManualQuestionMarks((current) => ({ ...current, [item.id]: current[item.id] === 'right' ? '' : String(item.marks ?? '') }))
                            setManualQuestionDecisions((current) => ({ ...current, [item.id]: current[item.id] === 'right' ? '' : 'right' }))
                          }}
                        >
                          <CircleCheckBig size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>

                    {openManualQuestionRemarks[item.id] ? (
                      <label className="start-eval-remarks-box">
                        <textarea
                          rows={2}
                          value={manualQuestionRemarks[item.id] ?? ''}
                          onChange={(event) => setManualQuestionRemarks((current) => ({ ...current, [item.id]: event.target.value }))}
                          placeholder="Add remarks"
                        />
                      </label>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}

            {item.type !== 'checklist' && item.type !== 'form' ? (
              <div className="start-eval-evaluator-grid">
                <div className="start-eval-answer-box is-answer-key">
                  <span>Answer Key</span>
                  <strong>{item.answerKey}</strong>
                </div>
                {item.type !== 'scaffolding' ? (
                  <div className="start-eval-answer-box is-explanation">
                    <span>Explanation Answer</span>
                    <strong>{item.explanation}</strong>
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
          )
        })}
      </div>
    </section>
  )
}

export default function StartEvaluationPage({ evaluationRecord, onBackToEvaluation, onOpenExamLog }) {
  const [studentSearch, setStudentSearch] = useState('')
  const [studentFilter, setStudentFilter] = useState('all')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false)
  const [obtainedMarks, setObtainedMarks] = useState(0)

  const roster = useMemo(
    () => buildStudentRoster(evaluationRecord, evaluationRecord?.assignment, evaluationRecord?.latestSubmission),
    [evaluationRecord],
  )

  const filteredStudents = useMemo(() => {
    const needle = studentSearch.trim().toLowerCase()

    return roster.filter((student) => (
      (studentFilter === 'all'
        || (studentFilter === 'submitted' && student.submissionStatus === 'Submitted')
        || (studentFilter === 'pending' && student.submissionStatus !== 'Submitted')
        || (studentFilter === 'evaluated' && student.evaluationStatus === 'Completed'))
      && (
        !needle
        || student.name.toLowerCase().includes(needle)
        || student.registerId.toLowerCase().includes(needle)
      )
    ))
  }, [roster, studentFilter, studentSearch])

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
  const selectedStudentIndex = filteredStudents.findIndex((student) => student.id === selectedStudentId)
  const submittedCount = roster.filter((student) => student.submissionStatus === 'Submitted').length
  const completedCount = roster.filter((student) => student.evaluationStatus === 'Completed').length
  const pendingCount = roster.filter((student) => student.submissionStatus !== 'Submitted').length
  const totalMarks = useMemo(() => {
    const items = selectedStudent?.submission?.items ?? []

    return items.reduce((sum, item) => sum + (Number(item.marks) || 0), 0)
  }, [selectedStudent])
  const studentFilterOptions = [
    { id: 'all', label: 'All', count: roster.length },
    { id: 'submitted', label: 'Submitted', count: submittedCount },
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'evaluated', label: 'Evaluated', count: completedCount },
  ]

  const handleSelectStudent = (studentId) => {
    setSelectedStudentId(studentId)
    setIsStudentPickerOpen(false)
  }

  const handlePreviousStudent = () => {
    if (selectedStudentIndex > 0) {
      setSelectedStudentId(filteredStudents[selectedStudentIndex - 1].id)
    }
  }

  const handleNextStudent = () => {
    if (selectedStudentIndex > -1 && selectedStudentIndex < filteredStudents.length - 1) {
      setSelectedStudentId(filteredStudents[selectedStudentIndex + 1].id)
    }
  }

  return (
    <section className="vx-content forms-page start-evaluation-page">
      <div className="start-eval-shell">
        <section className="start-eval-summary-card">
          <div className="start-eval-summary-main">
            <div className="start-eval-summary-topline">
              <div className="start-eval-summary-badges">
                <span className={`eval-type-chip ${getActivityTypeTone(evaluationRecord?.activityType)}`}>{evaluationRecord?.activityType ?? 'Activity'}</span>
                <span className={`eval-status-pill ${evaluationRecord?.evaluationStatus === 'Completed Evaluation' ? 'is-complete' : 'is-pending'}`}>
                  {evaluationRecord?.evaluationStatus === 'Completed Evaluation' ? 'Completed' : 'Pending'}
                </span>
              </div>
              <span className="start-eval-summary-date">
                <CalendarDays size={13} strokeWidth={2} />
                Created {formatDate(evaluationRecord?.createdDate)}
              </span>
            </div>
            <div className="start-eval-summary-copy">
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
          </div>
          </div>
        </section>

        <section className="start-eval-board">
          <div className="start-eval-main-panel">
            <section className="start-eval-student-nav-card">
              <div className="start-eval-student-nav-copy">
                <span className="start-eval-student-nav-kicker">Student Review</span>
                <strong>{selectedStudent?.name ?? 'No student selected'}</strong>
                <p>
                  {selectedStudent?.registerId ?? 'No register number'}
                  {' • '}
                  {filteredStudents.length ? `${Math.max(selectedStudentIndex + 1, 1)} of ${filteredStudents.length}` : '0 of 0'}
                </p>
                <div className="start-eval-student-nav-meta">
                  <span className={`eval-status-pill ${selectedStudent?.evaluationStatus === 'Completed' ? 'is-complete' : 'is-pending'}`}>
                    {selectedStudent?.evaluationStatus ?? 'Pending'}
                  </span>
                  <span className="start-eval-student-nav-total">Obtained Marks {obtainedMarks} / {totalMarks}</span>
                </div>
              </div>

              <div className="start-eval-student-nav-actions">
                <button
                  type="button"
                  className="ghost start-eval-nav-btn"
                  onClick={() => onOpenExamLog?.({
                    evaluationRecord,
                    student: selectedStudent,
                    totalMarks,
                    obtainedMarks,
                  })}
                >
                  <History size={15} strokeWidth={2} />
                  Exam Logs
                </button>
                <button
                  type="button"
                  className="ghost start-eval-nav-btn"
                  onClick={handlePreviousStudent}
                  disabled={selectedStudentIndex <= 0}
                >
                  <ChevronLeft size={15} strokeWidth={2} />
                  Previous
                </button>
                <button
                  type="button"
                  className="ghost start-eval-nav-btn"
                  onClick={handleNextStudent}
                  disabled={selectedStudentIndex === -1 || selectedStudentIndex >= filteredStudents.length - 1}
                >
                  Next
                  <ChevronRight size={15} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="ghost start-eval-picker-btn"
                  onClick={() => setIsStudentPickerOpen(true)}
                >
                  <Users size={15} strokeWidth={2} />
                  Students
                </button>
              </div>
            </section>

            <StudentResponsePanel
              student={selectedStudent}
              record={evaluationRecord}
              onObtainedMarksChange={setObtainedMarks}
            />
          </div>
        </section>

        {isStudentPickerOpen ? (
          <div className="start-eval-student-picker-overlay" role="dialog" aria-modal="true" aria-label="Student list">
            <div className="start-eval-student-picker">
              <div className="start-eval-panel-head">
                <div>
                  <strong>Students</strong>
                  <p>Select a student to continue evaluation.</p>
                </div>
                <button type="button" className="ghost start-eval-back-btn" onClick={() => setIsStudentPickerOpen(false)}>
                  <ChevronLeft size={15} strokeWidth={2} />
                  Close
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

              <div className="start-eval-student-filters" role="tablist" aria-label="Student filters">
                {studentFilterOptions.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    role="tab"
                    aria-selected={studentFilter === filter.id}
                    className={`start-eval-student-filter-chip ${studentFilter === filter.id ? 'is-active' : ''}`}
                    onClick={() => setStudentFilter(filter.id)}
                  >
                    <span>{filter.label}</span>
                    <small>{filter.count}</small>
                  </button>
                ))}
              </div>

              <div className="start-eval-student-list is-picker">
                {filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    className={`start-eval-student-item ${student.id === selectedStudentId ? 'is-active' : ''}`}
                    onClick={() => handleSelectStudent(student.id)}
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
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}


