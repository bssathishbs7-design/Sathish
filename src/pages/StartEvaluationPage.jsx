import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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
  X,
} from 'lucide-react'
import SendApprovalModal from '../components/SendApprovalModal'
import '../styles/evaluation.css'
import '../styles/start-evaluation.css'

const CHECKLIST_FALLBACK_PROMPTS = [
  'Performs hand hygiene and introduces self to the patient.',
  'Confirms patient identity and explains the procedure clearly.',
  'Positions the patient correctly before starting the examination.',
  'Uses the instrument safely and follows the correct examination sequence.',
  'Communicates findings clearly and maintains professional behaviour.',
]

const isGeneratedQuestionLabel = (value) => /^Q\d+$/i.test(String(value ?? '').trim())

const formatDate = (value) => (value ? String(value).split(',')[0].trim() : 'Not set')
const normalizeValue = (value, fallback = 'Not Applicable') => value ?? fallback
const calculatePercentage = (obtained, total) => {
  const safeTotal = Number(total) || 0
  if (safeTotal <= 0) return 0
  return (Number(obtained) || 0) / safeTotal * 100
}
const formatMarksValue = (value) => {
  const numericValue = Number(value ?? 0)

  if (Number.isNaN(numericValue)) return '0'
  if (Number.isInteger(numericValue)) return String(numericValue)

  return numericValue.toFixed(2).replace(/\.?0+$/, '')
}

const resolveThresholdResult = (thresholds, obtainedMarks, totalMarks) => {
  const normalizedThresholds = (thresholds ?? [])
    .map((threshold, index) => ({
      id: threshold.id ?? `threshold-${index + 1}`,
      label: threshold.label ?? `Threshold ${index + 1}`,
      from: Number(threshold.from),
      to: Number(threshold.to),
    }))
    .filter((threshold) => !Number.isNaN(threshold.from) && !Number.isNaN(threshold.to))
    .sort((left, right) => left.from - right.from)

  const looksLikePercentageScale = normalizedThresholds.length > 0
    && normalizedThresholds.every((threshold) => threshold.to <= 100)

  const comparableValue = looksLikePercentageScale
    ? ((Number(totalMarks) || 0) > 0 ? (obtainedMarks / totalMarks) * 100 : 0)
    : obtainedMarks
  const matchedThreshold = normalizedThresholds.find((threshold) => (
    comparableValue >= threshold.from - 0.001
    && comparableValue <= threshold.to + 0.001
  ))

  return matchedThreshold ?? null
}

const buildDefaultDecisionOptions = () => ([
  { id: 'decision-completed', label: 'C', title: 'Completed' },
  { id: 'decision-repeat', label: 'R', title: 'Repeat' },
  { id: 'decision-remedial', label: 'Re', title: 'Remedial' },
])

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

const isActivityCertifiable = (activity) => Boolean(
  activity?.certifiable
  ?? activity?.isCertifiable
  ?? activity?.assignment?.certifiable
  ?? activity?.assignment?.isCertifiable
  ?? activity?.assignment?.examData?.certifiable
  ?? activity?.assignment?.examData?.isCertifiable
  ?? activity?.assignment?.activityData?.activity?.certifiable
  ?? activity?.assignment?.activityData?.activity?.isCertifiable
  ?? activity?.examData?.certifiable
  ?? activity?.examData?.isCertifiable
  ?? activity?.activityData?.activity?.certifiable
  ?? activity?.activityData?.activity?.isCertifiable
)

const getReviewSectionIcon = (label = '') => {
  const normalized = String(label).trim().toLowerCase()

  if (normalized.includes('checklist')) return ClipboardCheck
  if (normalized.includes('form')) return Shapes
  if (normalized.includes('scaffolding')) return FileText
  if (normalized.includes('image')) return ImageIcon
  if (normalized.includes('question')) return FileText

  return BadgeCheck
}

const getReviewSectionTone = (label = '') => {
  const normalized = String(label).trim().toLowerCase()

  if (normalized.includes('checklist')) return 'is-checklist'
  if (normalized.includes('form')) return 'is-form'
  if (normalized.includes('scaffolding')) return 'is-scaffolding'
  if (normalized.includes('image')) return 'is-image'
  if (normalized.includes('question')) return 'is-question'

  return 'is-default'
}

const getDecisionOptionMeta = (decisionId = '') => {
  if (decisionId === 'decision-completed') {
    return {
      icon: CheckCircle2,
      tone: 'is-completed',
    }
  }

  if (decisionId === 'decision-repeat') {
    return {
      icon: History,
      tone: 'is-repeat',
    }
  }

  if (decisionId === 'decision-remedial') {
    return {
      icon: AlertTriangle,
      tone: 'is-remedial',
    }
  }

  return {
    icon: BadgeCheck,
    tone: 'is-default',
  }
}

const buildCompletedSectionStats = (items = [], type) => {
  const sectionItems = items.filter((item) => item.type === type)
  const criticalItems = sectionItems.filter((item) => item.isCritical)
  const obtainedMarks = sectionItems.reduce((sum, item) => sum + (Number(item.obtainedMarks) || 0), 0)
  const totalMarks = sectionItems.reduce((sum, item) => sum + (Number(item.totalMarks) || 0), 0)
  const criticalObtainedMarks = criticalItems.reduce((sum, item) => sum + (Number(item.obtainedMarks) || 0), 0)
  const criticalTotalMarks = criticalItems.reduce((sum, item) => sum + (Number(item.totalMarks) || 0), 0)

  return {
    itemCount: sectionItems.length,
    obtainedMarks,
    criticalObtainedMarks,
    percentage: calculatePercentage(obtainedMarks, totalMarks),
    criticalPercentage: calculatePercentage(criticalObtainedMarks, criticalTotalMarks),
  }
}

const buildCompletedEvaluationRow = ({
  evaluationRecord,
  student,
  itemSummaries,
  obtainedMarks,
  totalMarks,
  thresholdResult,
  decision,
  rowStatus = 'Completed',
  evaluationDraft = null,
}) => {
  const checklist = buildCompletedSectionStats(itemSummaries, 'checklist')
  const form = buildCompletedSectionStats(itemSummaries, 'form')
  const scaffolding = buildCompletedSectionStats(itemSummaries, 'scaffolding')
  const question = buildCompletedSectionStats(itemSummaries, 'question')
  const image = buildCompletedSectionStats(itemSummaries, 'image')
  const criticalItems = itemSummaries.filter((item) => item.isCritical)
  const overallCriticalMarks = criticalItems.reduce((sum, item) => sum + (Number(item.obtainedMarks) || 0), 0)
  const overallCriticalTotalMarks = criticalItems.reduce((sum, item) => sum + (Number(item.totalMarks) || 0), 0)

  return {
    activityId: evaluationRecord?.id ?? 'unknown-activity',
    activityName: evaluationRecord?.activityName ?? 'Untitled Activity',
    activityType: evaluationRecord?.activityType ?? 'Activity',
    certifiable: isActivityCertifiable(evaluationRecord),
    activityRecord: evaluationRecord,
    studentId: student?.id ?? 'unknown-student',
    studentName: student?.name ?? 'Student',
    registerId: student?.registerId ?? 'Not set',
    rowStatus,
    resultStatus: decision?.title ?? '',
    decisionId: decision?.id ?? '',
    evaluationDraft,
    submittedAt: new Date().toISOString(),
    thresholdLabel: thresholdResult?.label ?? 'Not Matched',
    decisionTitle: decision?.title ?? '',
    itemSummaries,
    checklist,
    form,
    scaffolding,
    question,
    image,
    overallCriticalMarks,
    overallCriticalPercentage: calculatePercentage(overallCriticalMarks, overallCriticalTotalMarks),
    totalMarks: Number(totalMarks) || 0,
    totalObtainedMarks: Number(obtainedMarks) || 0,
    totalPercentage: calculatePercentage(obtainedMarks, totalMarks),
  }
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

const getNormalizedResultStatus = (value = '') => String(value ?? '').trim().toLowerCase()
const isCompletedRowStatus = (value = '') => getNormalizedResultStatus(value) === 'completed'
const getStudentResultStatus = (student) => getNormalizedResultStatus(
  student?.evaluationDecision
  ?? student?.evaluationResult?.decisionTitle
  ?? student?.evaluationResult?.resultStatus
  ?? '',
)
const hasStudentEvaluationResult = (student) => Boolean(
  student?.evaluationResult
  || isCompletedRowStatus(student?.evaluationStatus),
)
const isReevaluationResult = (value = '') => {
  const normalized = getNormalizedResultStatus(value)
  return normalized === 'repeat' || normalized === 'remedial'
}

const getStudentEvaluationBadge = (student) => {
  if (!student) {
    return { label: 'Pending', tone: 'is-pending' }
  }

  if (student.submissionStatus !== 'Submitted') {
    return { label: 'Not Submitted', tone: 'is-pending' }
  }

  const normalizedDecision = getStudentResultStatus(student)

  if (normalizedDecision === 'repeat') {
    return { label: 'Repeat', tone: 'is-repeat' }
  }

  if (normalizedDecision === 'remedial') {
    return { label: 'Remedial', tone: 'is-remedial' }
  }

  if (student.evaluationStatus === 'Completed') {
    return { label: 'Completed', tone: 'is-complete' }
  }

  return { label: 'Pending', tone: 'is-pending' }
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
    ...imageItems,
    ...questionItems,
    ...scaffoldItems,
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
  const visibleCount = Math.min(count, 17)
  const notSubmittedSampleCount = visibleCount > 1
    ? Math.min(2, Math.max(1, Math.floor(visibleCount * 0.12)))
    : 0
  const submittedSampleCount = visibleCount - notSubmittedSampleCount
  const items = buildEvaluationItems(assignment, record)

  return Array.from({ length: visibleCount }, (_, index) => {
    const hasSubmitted = index < submittedSampleCount
    const student = {
      id: `student-${index + 1}`,
      name:
        index === 0 && latestSubmission?.studentName
          ? latestSubmission.studentName
          : buildStudentName(index, record?.sgt),
      registerId: index === 0 && latestSubmission?.studentId ? latestSubmission.studentId : `MC25${String(index + 101).padStart(3, '0')}`,
      submissionStatus: hasSubmitted ? 'Submitted' : 'Pending',
      evaluationStatus: 'Pending',
      submittedAt: index === 0 && latestSubmission?.submittedAt ? latestSubmission.submittedAt : hasSubmitted ? `${String(index + 1).padStart(2, '0')}/04/2026, 09:${String(10 + index).padStart(2, '0')} ` : null,
    }

    return {
      ...student,
      submission: buildStudentSubmission(student, items, record, latestSubmission),
    }
  })
}

function StudentResponsePanel({
  student,
  record,
  savedDraft,
  marksDisabled,
  onObtainedMarksChange,
  onEvaluationStateChange,
  onRegisterActions,
}) {
  const activityType = String(record?.activityType ?? '').toLowerCase()
  const submission = student?.submission
  const isSubmittedStudent = student?.submissionStatus === 'Submitted'
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
  const [openReferenceAnswers, setOpenReferenceAnswers] = useState({})
  const visibleSubmissionItems = useMemo(() => {
    const items = submission?.items ?? []

    if (isSubmittedStudent) return items

    return items.filter((item) => item.type === 'checklist')
  }, [isSubmittedStudent, submission])
  const groupedItems = useMemo(() => {
    const groups = visibleSubmissionItems.reduce((accumulator, item) => {
      const key = item.sectionLabel ?? 'Questions'

      if (!accumulator[key]) {
        accumulator[key] = []
      }

      accumulator[key].push(item)
      return accumulator
    }, {})

    return Object.entries(groups).map(([label, items]) => ({ label, items }))
  }, [visibleSubmissionItems])
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
    const buildInitialDraft = () => {
      const checklistItems = visibleSubmissionItems.filter((item) => item.type === 'checklist')
      const formItems = visibleSubmissionItems.filter((item) => item.type === 'form')
      const scaffoldingItems = visibleSubmissionItems.filter((item) => item.type === 'scaffolding')
      const imageItems = visibleSubmissionItems.filter((item) => item.type === 'image')
      const manualQuestionItems = visibleSubmissionItems.filter((item) => item.type === 'question')

      return {
        checklistRemarks: Object.fromEntries(
          checklistItems.map((item) => [item.id, item.remarks ?? '']),
        ),
        checklistDecisions: Object.fromEntries(
          checklistItems.map((item) => [item.id, '']),
        ),
        checklistMarks: Object.fromEntries(
          checklistItems.map((item) => [item.id, '']),
        ),
        formRemarks: Object.fromEntries(
          formItems.map((item) => [item.id, '']),
        ),
        formDecisions: Object.fromEntries(
          formItems.map((item) => [item.id, '']),
        ),
        formMarks: Object.fromEntries(
          formItems.map((item) => [item.id, '']),
        ),
        scaffoldingRemarks: Object.fromEntries(
          scaffoldingItems.map((item) => [item.id, '']),
        ),
        scaffoldingDecisions: Object.fromEntries(
          scaffoldingItems.map((item) => [item.id, '']),
        ),
        scaffoldingMarks: Object.fromEntries(
          scaffoldingItems.map((item) => [item.id, '']),
        ),
        imageRemarks: Object.fromEntries(
          imageItems.map((item) => [item.id, '']),
        ),
        imageDecisions: Object.fromEntries(
          imageItems.map((item) => [item.id, '']),
        ),
        imageMarks: Object.fromEntries(
          imageItems.map((item) => [item.id, '']),
        ),
        manualQuestionRemarks: Object.fromEntries(
          manualQuestionItems.map((item) => [item.id, '']),
        ),
        manualQuestionDecisions: Object.fromEntries(
          manualQuestionItems.map((item) => [item.id, '']),
        ),
        manualQuestionMarks: Object.fromEntries(
          manualQuestionItems.map((item) => [item.id, '']),
        ),
        activeSection: groupedItems[0]?.label ?? '',
      }
    }

    const applyDraft = (draft) => {
      setChecklistRemarks(draft?.checklistRemarks ?? {})
      setOpenChecklistRemarks({})
      setChecklistDecisions(draft?.checklistDecisions ?? {})
      setChecklistMarks(draft?.checklistMarks ?? {})
      setFormRemarks(draft?.formRemarks ?? {})
      setOpenFormRemarks({})
      setFormDecisions(draft?.formDecisions ?? {})
      setFormMarks(draft?.formMarks ?? {})
      setScaffoldingRemarks(draft?.scaffoldingRemarks ?? {})
      setOpenScaffoldingRemarks({})
      setScaffoldingDecisions(draft?.scaffoldingDecisions ?? {})
      setScaffoldingMarks(draft?.scaffoldingMarks ?? {})
      setImageRemarks(draft?.imageRemarks ?? {})
      setOpenImageRemarks({})
      setImageDecisions(draft?.imageDecisions ?? {})
      setImageMarks(draft?.imageMarks ?? {})
      setManualQuestionRemarks(draft?.manualQuestionRemarks ?? {})
      setOpenManualQuestionRemarks({})
      setManualQuestionDecisions(draft?.manualQuestionDecisions ?? {})
      setManualQuestionMarks(draft?.manualQuestionMarks ?? {})
      setOpenReferenceAnswers({})
      setActiveSection(draft?.activeSection ?? groupedItems[0]?.label ?? '')
    }

    if (!student?.id) {
      applyDraft(null)
      onObtainedMarksChange?.(0)
      onEvaluationStateChange?.({
        groupedSections: [],
        requiredSections: [],
        itemSummaries: [],
        isReadyToSubmit: false,
        completedSectionCount: 0,
      })
      return
    }

    applyDraft(savedDraft ?? buildInitialDraft())
    onObtainedMarksChange?.(0)
  }, [groupedItems, onEvaluationStateChange, onObtainedMarksChange, savedDraft, student?.id, visibleSubmissionItems])

  useEffect(() => {
    if (marksDisabled) {
      onRegisterActions?.(null)
      return undefined
    }

    onRegisterActions?.({
      buildDraft: () => ({
        checklistRemarks,
        checklistDecisions,
        checklistMarks,
        formRemarks,
        formDecisions,
        formMarks,
        scaffoldingRemarks,
        scaffoldingDecisions,
        scaffoldingMarks,
        imageRemarks,
        imageDecisions,
        imageMarks,
        manualQuestionRemarks,
        manualQuestionDecisions,
        manualQuestionMarks,
        activeSection: activeSection || groupedItems[0]?.label || '',
      }),
      resetDraft: () => {
        const checklistItems = visibleSubmissionItems.filter((item) => item.type === 'checklist')
        const formItems = visibleSubmissionItems.filter((item) => item.type === 'form')
        const scaffoldingItems = visibleSubmissionItems.filter((item) => item.type === 'scaffolding')
        const imageItems = visibleSubmissionItems.filter((item) => item.type === 'image')
        const manualQuestionItems = visibleSubmissionItems.filter((item) => item.type === 'question')

        setChecklistRemarks(Object.fromEntries(checklistItems.map((item) => [item.id, item.remarks ?? ''])))
        setOpenChecklistRemarks({})
        setChecklistDecisions(Object.fromEntries(checklistItems.map((item) => [item.id, ''])))
        setChecklistMarks(Object.fromEntries(checklistItems.map((item) => [item.id, ''])))
        setFormRemarks(Object.fromEntries(formItems.map((item) => [item.id, ''])))
        setOpenFormRemarks({})
        setFormDecisions(Object.fromEntries(formItems.map((item) => [item.id, ''])))
        setFormMarks(Object.fromEntries(formItems.map((item) => [item.id, ''])))
        setScaffoldingRemarks(Object.fromEntries(scaffoldingItems.map((item) => [item.id, ''])))
        setOpenScaffoldingRemarks({})
        setScaffoldingDecisions(Object.fromEntries(scaffoldingItems.map((item) => [item.id, ''])))
        setScaffoldingMarks(Object.fromEntries(scaffoldingItems.map((item) => [item.id, ''])))
        setImageRemarks(Object.fromEntries(imageItems.map((item) => [item.id, ''])))
        setOpenImageRemarks({})
        setImageDecisions(Object.fromEntries(imageItems.map((item) => [item.id, ''])))
        setImageMarks(Object.fromEntries(imageItems.map((item) => [item.id, ''])))
        setManualQuestionRemarks(Object.fromEntries(manualQuestionItems.map((item) => [item.id, ''])))
        setOpenManualQuestionRemarks({})
        setManualQuestionDecisions(Object.fromEntries(manualQuestionItems.map((item) => [item.id, ''])))
        setManualQuestionMarks(Object.fromEntries(manualQuestionItems.map((item) => [item.id, ''])))
        setOpenReferenceAnswers({})
        setActiveSection(groupedItems[0]?.label ?? '')
      },
    })

    return () => onRegisterActions?.(null)
  }, [
    activeSection,
    checklistDecisions,
    checklistMarks,
    checklistRemarks,
    formDecisions,
    formMarks,
    formRemarks,
    groupedItems,
    imageDecisions,
    imageMarks,
    imageRemarks,
    manualQuestionDecisions,
    manualQuestionMarks,
    manualQuestionRemarks,
    marksDisabled,
    onRegisterActions,
    scaffoldingDecisions,
    scaffoldingMarks,
    scaffoldingRemarks,
    visibleSubmissionItems,
  ])

  useEffect(() => {
    if (marksDisabled) {
      onObtainedMarksChange?.(0)
      return
    }

    const checklistObtainedMarks = Object.values(checklistMarks).reduce((sum, value) => sum + (Number(value) || 0), 0)
    const formObtainedMarks = Object.values(formMarks).reduce((sum, value) => sum + (Number(value) || 0), 0)
    const scaffoldingObtainedMarks = Object.values(scaffoldingMarks).reduce((sum, value) => sum + (Number(value) || 0), 0)
    const imageObtainedMarks = Object.values(imageMarks).reduce((sum, value) => sum + (Number(value) || 0), 0)
    const manualQuestionObtainedMarks = Object.values(manualQuestionMarks).reduce((sum, value) => sum + (Number(value) || 0), 0)
    const obtainedMarks = checklistObtainedMarks + formObtainedMarks + scaffoldingObtainedMarks + imageObtainedMarks + manualQuestionObtainedMarks
    onObtainedMarksChange?.(obtainedMarks)
  }, [checklistMarks, formMarks, imageMarks, manualQuestionMarks, marksDisabled, onObtainedMarksChange, scaffoldingMarks])

  useEffect(() => {
    if (marksDisabled) {
      onEvaluationStateChange?.({
        groupedSections: [],
        requiredSections: [],
        itemSummaries: [],
        isReadyToSubmit: false,
        completedSectionCount: 0,
      })
      return
    }

    const sectionSummaries = groupedItems.map((group) => {
      const itemSummaries = group.items.map((item) => {
        const isCompleted = item.type === 'checklist'
          ? (checklistDecisions[item.id] === 'right' || checklistDecisions[item.id] === 'wrong')
          : item.type === 'form'
            ? (formDecisions[item.id] === 'right' || formDecisions[item.id] === 'wrong')
            : item.type === 'scaffolding'
              ? (scaffoldingDecisions[item.id] === 'right' || scaffoldingDecisions[item.id] === 'wrong')
              : item.type === 'image'
                ? (imageDecisions[item.id] === 'right' || imageDecisions[item.id] === 'wrong')
                : item.type === 'question'
                  ? (manualQuestionDecisions[item.id] === 'right' || manualQuestionDecisions[item.id] === 'wrong')
                  : false
        const obtainedMarks = item.type === 'checklist'
          ? (Number(checklistMarks[item.id]) || 0)
          : item.type === 'form'
            ? (Number(formMarks[item.id]) || 0)
            : item.type === 'scaffolding'
              ? (Number(scaffoldingMarks[item.id]) || 0)
              : item.type === 'image'
                ? (Number(imageMarks[item.id]) || 0)
                : item.type === 'question'
                  ? (Number(manualQuestionMarks[item.id]) || 0)
                  : 0

        return {
          id: item.id,
          label: item.label,
          type: item.type,
          sectionLabel: group.label,
          isCritical: Boolean(item.isCritical),
          isCompleted,
          decisionState: item.type === 'checklist'
            ? (checklistDecisions[item.id] ?? '')
            : item.type === 'form'
              ? (formDecisions[item.id] ?? '')
              : item.type === 'scaffolding'
                ? (scaffoldingDecisions[item.id] ?? '')
                : item.type === 'image'
                  ? (imageDecisions[item.id] ?? '')
                  : item.type === 'question'
                    ? (manualQuestionDecisions[item.id] ?? '')
                    : '',
          obtainedMarks,
          totalMarks: Number(item.marks) || 0,
        }
      })
      const completedItems = group.items.reduce((count, item) => {
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

      const obtainedSectionMarks = group.items.reduce((sum, item) => {
        if (item.type === 'checklist') return sum + (Number(checklistMarks[item.id]) || 0)
        if (item.type === 'form') return sum + (Number(formMarks[item.id]) || 0)
        if (item.type === 'scaffolding') return sum + (Number(scaffoldingMarks[item.id]) || 0)
        if (item.type === 'image') return sum + (Number(imageMarks[item.id]) || 0)
        if (item.type === 'question') return sum + (Number(manualQuestionMarks[item.id]) || 0)
        return sum
      }, 0)

      return {
        key: group.label.toLowerCase().replace(/\s+/g, '-'),
        label: group.label,
        itemCount: group.items.length,
        itemSummaries,
        completedItems,
        obtainedMarks: obtainedSectionMarks,
        totalMarks: group.items.reduce((sum, item) => sum + (Number(item.marks) || 0), 0),
        isComplete: group.items.length > 0 && completedItems === group.items.length,
      }
    })

    onEvaluationStateChange?.({
      groupedSections: sectionSummaries,
      requiredSections: sectionSummaries.filter((section) => section.itemCount > 0),
      itemSummaries: sectionSummaries.flatMap((section) => section.itemSummaries),
      isReadyToSubmit: sectionSummaries.length > 0 && sectionSummaries.every((section) => section.itemCount > 0 && section.isComplete),
      completedSectionCount: sectionSummaries.filter((section) => section.isComplete).length,
    })
  }, [
    checklistDecisions,
    checklistMarks,
    formDecisions,
    formMarks,
    groupedItems,
    imageDecisions,
    imageMarks,
    marksDisabled,
    manualQuestionDecisions,
    manualQuestionMarks,
    onEvaluationStateChange,
    scaffoldingDecisions,
    scaffoldingMarks,
  ])

  if (!student) {
    return (
      <section className="start-eval-detail-card start-eval-empty-state">
        <strong>Select a student to review the submission.</strong>
      </section>
    )
  }

  if (marksDisabled) {
    return (
      <section className="start-eval-detail-card start-eval-empty-state">
        <strong>Evaluation unavailable</strong>
        <p>This activity cannot be evaluated because marks were disabled during activity creation.</p>
      </section>
    )
  }

  if (student.submissionStatus !== 'Submitted' && !groupedItems.length) {
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

  const activeSectionObtainedMarks = activeItems.reduce((sum, item) => {
    if (item.type === 'checklist') return sum + (Number(checklistMarks[item.id]) || 0)
    if (item.type === 'form') return sum + (Number(formMarks[item.id]) || 0)
    if (item.type === 'scaffolding') return sum + (Number(scaffoldingMarks[item.id]) || 0)
    if (item.type === 'image') return sum + (Number(imageMarks[item.id]) || 0)
    if (item.type === 'question') return sum + (Number(manualQuestionMarks[item.id]) || 0)
    return sum
  }, 0)

  const activeSectionTotalMarks = activeItems.reduce((sum, item) => sum + (Number(item.marks) || 0), 0)

  return (
    <section className="start-eval-detail-card">
      {!isSubmittedStudent ? (
        <div className="start-eval-faculty-note">
          <strong>Faculty checklist review only.</strong>
          <p>No student submission is available, so only checklist evaluation is shown.</p>
        </div>
      ) : null}
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

          <div className="start-eval-section-progress-group">
            <span className="start-eval-section-obtained-badge">
              Marks {activeSectionObtainedMarks} / {activeSectionTotalMarks}
            </span>
            <span className="start-eval-section-progress-badge">
              Evaluated {evaluatedCount} / {activeItems.length}
            </span>
          </div>
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
                {item.type !== 'checklist' && item.type !== 'scaffolding' && item.type !== 'question' && item.type !== 'form' ? <strong>{item.label}</strong> : null}
              </div>

              <div className="start-eval-badge-row">
                {item.type !== 'checklist' && item.type !== 'scaffolding' && item.type !== 'question' && item.type !== 'form' ? <span className="start-eval-meta-badge is-section">{item.sectionLabel}</span> : null}
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
                {item.referenceImages.map((image, imageIndex) => {
                  const imageSource = image.src ?? image.previewUrl ?? image.url ?? ''
                  const imageLabel = image.title ?? image.label ?? `Reference Image ${imageIndex + 1}`

                  return (
                    <figure key={image.id ?? `${item.id}-${imageIndex + 1}`} className={`start-eval-image-card ${imageSource ? 'has-image' : ''}`.trim()}>
                      {imageSource ? (
                        <img src={imageSource} alt={imageLabel} />
                      ) : (
                        <span className="start-eval-image-card-icon">
                          <ImageIcon size={16} strokeWidth={2} />
                        </span>
                      )}
                      <figcaption>{imageLabel}</figcaption>
                    </figure>
                  )
                })}
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
                      {isGeneratedQuestionLabel(response.label) ? null : <span>{response.label}</span>}
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
                    <div className="start-eval-reference-actions">
                      <button
                        type="button"
                        className={`start-eval-remarks-toggle ${openScaffoldingRemarks[item.id] ? 'is-open' : ''}`}
                        onClick={() => setOpenScaffoldingRemarks((current) => ({ ...current, [item.id]: !current[item.id] }))}
                      >
                        Remarks
                      </button>
                      <button
                        type="button"
                        className={`start-eval-reference-toggle ${openReferenceAnswers[item.id] ? 'is-open' : ''}`}
                        onClick={() => setOpenReferenceAnswers((current) => ({ ...current, [item.id]: !current[item.id] }))}
                      >
                        {openReferenceAnswers[item.id] ? 'Hide Answer Key' : 'View Answer Key'}
                      </button>
                    </div>

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
                    <div className="start-eval-reference-actions">
                      <button
                        type="button"
                        className={`start-eval-remarks-toggle ${openImageRemarks[item.id] ? 'is-open' : ''}`}
                        onClick={() => setOpenImageRemarks((current) => ({ ...current, [item.id]: !current[item.id] }))}
                      >
                        Remarks
                      </button>
                      <button
                        type="button"
                        className={`start-eval-reference-toggle ${openReferenceAnswers[item.id] ? 'is-open' : ''}`}
                        onClick={() => setOpenReferenceAnswers((current) => ({ ...current, [item.id]: !current[item.id] }))}
                      >
                        {openReferenceAnswers[item.id] ? 'Hide Answer Key' : 'View Answer Key'}
                      </button>
                    </div>

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
                    <div className="start-eval-reference-actions">
                      <button
                        type="button"
                        className={`start-eval-remarks-toggle ${openManualQuestionRemarks[item.id] ? 'is-open' : ''}`}
                        onClick={() => setOpenManualQuestionRemarks((current) => ({ ...current, [item.id]: !current[item.id] }))}
                      >
                        Remarks
                      </button>
                      <button
                        type="button"
                        className={`start-eval-reference-toggle ${openReferenceAnswers[item.id] ? 'is-open' : ''}`}
                        onClick={() => setOpenReferenceAnswers((current) => ({ ...current, [item.id]: !current[item.id] }))}
                      >
                        {openReferenceAnswers[item.id] ? 'Hide Answer Key' : 'View Answer Key'}
                      </button>
                    </div>

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

            {item.type !== 'checklist' && item.type !== 'form' && openReferenceAnswers[item.id] ? (
              <div className="start-eval-reference-answer">
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
              </div>
            ) : null}
          </article>
          )
        })}
      </div>
    </section>
  )
}

export default function StartEvaluationPage({
  evaluationRecord,
  initialSelectedStudentId,
  completedEvaluationRows = [],
  onBackToEvaluation,
  onOpenCompletedEvaluation,
  onOpenExamLog,
  onSaveCompletedEvaluation,
  onSendToApproval,
  onAlert,
}) {
  const [studentSearch, setStudentSearch] = useState('')
  const [studentFilter, setStudentFilter] = useState('all')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false)
  const [obtainedMarks, setObtainedMarks] = useState(0)
  const [evaluationState, setEvaluationState] = useState({
    groupedSections: [],
    requiredSections: [],
    itemSummaries: [],
    isReadyToSubmit: false,
    completedSectionCount: 0,
  })
  const [isSubmitPopupOpen, setIsSubmitPopupOpen] = useState(false)
  const [isApprovalPopupOpen, setIsApprovalPopupOpen] = useState(false)
  const [decisionOptions, setDecisionOptions] = useState(() => buildDefaultDecisionOptions())
  const [selectedDecisionId, setSelectedDecisionId] = useState('')
  const [submittedEvaluations, setSubmittedEvaluations] = useState({})
  const [savedEvaluationDrafts, setSavedEvaluationDrafts] = useState({})
  const [panelActions, setPanelActions] = useState(null)
  const isMarksDisabled = String(
    evaluationRecord?.assignment?.marks
    ?? evaluationRecord?.marks
    ?? evaluationRecord?.activityData?.marks
    ?? '',
  ).trim().toLowerCase() === 'nil'
  const isCertifiableActivity = isActivityCertifiable(evaluationRecord)
  const isEditingCompletedEvaluation = Boolean(evaluationRecord?.editingCompletedRowId && initialSelectedStudentId)

  const baseRoster = useMemo(
    () => buildStudentRoster(evaluationRecord, evaluationRecord?.assignment, evaluationRecord?.latestSubmission),
    [evaluationRecord],
  )

  const activityCompletedRows = useMemo(() => (
    completedEvaluationRows.filter((row) => (
      String(row.activityId ?? '') === String(evaluationRecord?.id ?? '') && isCompletedRowStatus(row.rowStatus)
    ))
  ), [completedEvaluationRows, evaluationRecord?.id])
  const finishedStudentIds = useMemo(() => {
    const ids = new Set()

    activityCompletedRows.forEach((row) => {
      if (row.studentId) ids.add(row.studentId)
    })

    Object.keys(submittedEvaluations).forEach((studentId) => {
      if (studentId) ids.add(studentId)
    })

    return ids
  }, [activityCompletedRows, submittedEvaluations])
  const latestCompletedRowByStudent = useMemo(() => {
    const latestRows = new Map()

    activityCompletedRows.forEach((row) => {
      const studentId = row.studentId
      if (!studentId) return

      const current = latestRows.get(studentId)
      const rowAttempt = Number(row.attemptNumber) || 0
      const currentAttempt = Number(current?.attemptNumber) || 0
      const rowTime = Date.parse(row.submittedAt ?? '') || 0
      const currentTime = Date.parse(current?.submittedAt ?? '') || 0

      if (!current || rowAttempt > currentAttempt || (rowAttempt === currentAttempt && rowTime >= currentTime)) {
        latestRows.set(studentId, row)
      }
    })

    return latestRows
  }, [activityCompletedRows])
  const hasCompletedEvaluationHistory = activityCompletedRows.length > 0

  const roster = useMemo(() => (
    baseRoster.map((student) => {
      const latestCompletedRow = latestCompletedRowByStudent.get(student.id)
      const submittedEvaluation = submittedEvaluations[student.id]

      if (submittedEvaluation) {
        return {
          ...student,
          evaluationStatus: 'Completed',
          evaluationDecision: submittedEvaluation.decisionTitle,
          evaluationResult: submittedEvaluation,
        }
      }

      if (latestCompletedRow) {
        return {
          ...student,
          evaluationStatus: 'Completed',
          evaluationDecision: latestCompletedRow.resultStatus ?? latestCompletedRow.decisionTitle ?? '',
          evaluationResult: latestCompletedRow,
        }
      }

      return student
    })
  ), [baseRoster, latestCompletedRowByStudent, submittedEvaluations])

  const filteredStudents = useMemo(() => {
    const needle = studentSearch.trim().toLowerCase()
    const submittedRoster = roster.filter((student) => student.submissionStatus === 'Submitted')
    const eligibleRoster = isEditingCompletedEvaluation
      ? submittedRoster.filter((student) => student.id === initialSelectedStudentId)
      : submittedRoster.filter((student) => !finishedStudentIds.has(student.id))

    return eligibleRoster.filter((student) => (
      ((studentFilter === 'all'
        || (studentFilter === 'submitted' && student.submissionStatus === 'Submitted')))
      && (
        !needle
        || student.name.toLowerCase().includes(needle)
        || student.registerId.toLowerCase().includes(needle)
      )
    ))
  }, [finishedStudentIds, initialSelectedStudentId, isEditingCompletedEvaluation, roster, studentFilter, studentSearch])

  useEffect(() => {
    const allowedFilters = ['all', 'submitted']

    if (!allowedFilters.includes(studentFilter)) {
      setStudentFilter('all')
    }
  }, [studentFilter])

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

  useEffect(() => {
    if (!initialSelectedStudentId) return
    if (!filteredStudents.some((student) => student.id === initialSelectedStudentId)) return

    setSelectedStudentId(initialSelectedStudentId)
  }, [filteredStudents, initialSelectedStudentId])

  const selectedStudent = filteredStudents.find((student) => student.id === selectedStudentId) ?? null
  const editingStudentDraft = selectedStudent?.id && selectedStudent.id === initialSelectedStudentId
    ? evaluationRecord?.editingStudentDraft ?? null
    : null
  const selectedStudentBadge = getStudentEvaluationBadge(selectedStudent)
  const selectedStudentIndex = filteredStudents.findIndex((student) => student.id === selectedStudentId)
  const submittedCount = roster.filter((student) => student.submissionStatus === 'Submitted').length
  const notSubmittedCount = roster.filter((student) => student.submissionStatus !== 'Submitted').length
  const completedCount = activityCompletedRows.length
  const pendingCount = roster.filter((student) => student.evaluationStatus !== 'Completed').length
  const repeatCount = roster.filter((student) => getStudentResultStatus(student) === 'repeat').length
  const remedialCount = roster.filter((student) => getStudentResultStatus(student) === 'remedial').length
  const remainingEvaluationCount = roster.filter((student) => (
    student.submissionStatus === 'Submitted' && !finishedStudentIds.has(student.id)
  )).length
  const evaluationStatusCount = roster.filter((student) => {
    const status = getStudentResultStatus(student)
    return student.evaluationStatus === 'Completed'
      || status === 'completed'
      || status === 'repeat'
      || status === 'remedial'
  }).length
  const canSendToApproval = !isEditingCompletedEvaluation && submittedCount > 0 && remainingEvaluationCount === 0
  const eligibleEvaluationCount = remainingEvaluationCount
  const totalMarks = useMemo(() => {
    const items = selectedStudent?.submission?.items ?? []

    return items.reduce((sum, item) => sum + (Number(item.marks) || 0), 0)
  }, [selectedStudent])
  const thresholdRows = useMemo(() => (
    evaluationRecord?.assignment?.thresholds
    ?? evaluationRecord?.assignment?.examData?.thresholds
    ?? evaluationRecord?.thresholds
    ?? evaluationRecord?.examData?.thresholds
    ?? []
  ), [evaluationRecord])
  const thresholdResult = useMemo(
    () => resolveThresholdResult(thresholdRows, obtainedMarks, totalMarks),
    [thresholdRows, obtainedMarks, totalMarks],
  )
  const readySections = evaluationState.requiredSections
  const groupedReviewSummaries = useMemo(() => {
    const summaries = evaluationState.itemSummaries ?? []
    const sectionDefinitions = [
      { key: 'checklist', label: 'Checklist' },
      { key: 'form', label: 'Form' },
      { key: 'question', label: 'Questions' },
      { key: 'scaffolding', label: 'Scaffolding' },
      { key: 'image', label: 'Image Review' },
    ]
    const buildPart = (items, label) => ({
      key: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      itemCount: items.length,
      completedItems: items.filter((item) => item.isCompleted).length,
      obtainedMarks: items.reduce((sum, item) => sum + (Number(item.obtainedMarks) || 0), 0),
      totalMarks: items.reduce((sum, item) => sum + (Number(item.totalMarks) || 0), 0),
    })
    const buildRow = (key, label, items) => {
      const normalItems = items.filter((item) => !item.isCritical)
      const criticalItems = items.filter((item) => item.isCritical)
      const parts = []

      if (normalItems.length && criticalItems.length) {
        parts.push(buildPart(normalItems, 'Normal'))
        parts.push(buildPart(criticalItems, 'Critical'))
      } else if (criticalItems.length) {
        parts.push(buildPart(criticalItems, 'Critical'))
      } else {
        parts.push(buildPart(items, 'Normal'))
      }

      return {
        key,
        label,
        parts,
        itemCount: items.length,
        completedItems: items.filter((item) => item.isCompleted).length,
      }
    }

    return sectionDefinitions
      .map((section) => {
        const items = summaries.filter((item) => item.type === section.key)

        if (!items.length) return null

        return buildRow(section.key, section.label, items)
      })
      .filter(Boolean)
  }, [evaluationState.itemSummaries])
  const isReadyToSubmit = Boolean(selectedStudent?.id)
    && selectedStudent?.submissionStatus === 'Submitted'
    && evaluationState.isReadyToSubmit
  const selectedDecision = decisionOptions.find((option) => option.id === selectedDecisionId) ?? null
  const hasCriticalityFailure = (evaluationState.itemSummaries ?? []).some((item) => (
    item.isCritical
    && (item.decisionState === 'wrong' || Number(item.obtainedMarks) <= 0)
  ))
  const criticalityRecommendationMessage = hasCriticalityFailure
    ? 'Criticality not performed well. Repeat is recommended.'
    : ''
  const studentFilterOptions = [
    { id: 'all', label: 'All', count: isEditingCompletedEvaluation ? filteredStudents.length : eligibleEvaluationCount },
    { id: 'submitted', label: 'Submitted', count: isEditingCompletedEvaluation ? filteredStudents.length : eligibleEvaluationCount },
  ]

  const handleSelectStudent = (studentId) => {
    setSelectedStudentId(studentId)
    setIsStudentPickerOpen(false)
  }

  const handleOpenCompletedEvaluation = () => {
    onOpenCompletedEvaluation?.(evaluationRecord)
  }

  const handleSendApproval = (approvalFaculty) => {
    onSendToApproval?.({
      activityId: evaluationRecord?.id ?? 'unknown-activity',
      activityName: evaluationRecord?.activityName ?? 'Untitled Activity',
      activityType: evaluationRecord?.activityType ?? 'Activity',
      source: 'Start Evaluation',
      totalStudents: submittedCount,
      evaluatedCount: evaluationStatusCount,
      completedCount: roster.filter((student) => getStudentResultStatus(student) === 'completed' || student.evaluationStatus === 'Completed').length,
      repeatCount,
      remedialCount,
      facultyName: approvalFaculty.facultyName,
      employeeId: approvalFaculty.employeeId,
      designation: approvalFaculty.designation,
      note: approvalFaculty.note,
    })
    setIsApprovalPopupOpen(false)
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

  const handleSubmitEvaluation = (decisionOverride = null) => {
    if (isMarksDisabled) return
    const decisionToSubmit = decisionOverride ?? selectedDecision
    if (!selectedStudent || !decisionToSubmit) return

    const submissionSummary = {
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      registerId: selectedStudent.registerId,
      obtainedMarks,
      totalMarks,
      thresholdLabel: thresholdResult?.label ?? 'Not Matched',
      decisionId: decisionToSubmit.id,
      decisionLabel: decisionToSubmit.label,
      decisionTitle: decisionToSubmit.title,
      sections: readySections,
      submittedAt: new Date().toISOString(),
    }
    const completedEvaluationRow = buildCompletedEvaluationRow({
      evaluationRecord,
      student: selectedStudent,
      itemSummaries: evaluationState.itemSummaries,
      obtainedMarks,
      totalMarks,
      thresholdResult,
      decision: decisionToSubmit,
      rowStatus: 'Completed',
      evaluationDraft: panelActions?.buildDraft?.() ?? null,
    })
    const normalizedCompletedEvaluationRow = isEditingCompletedEvaluation
      ? {
          ...completedEvaluationRow,
          id: evaluationRecord.editingCompletedRowId,
          attemptNumber: evaluationRecord.editingAttemptNumber ?? completedEvaluationRow.attemptNumber,
          attemptLabel: evaluationRecord.editingAttemptNumber
            ? `Attempt ${evaluationRecord.editingAttemptNumber}`
            : completedEvaluationRow.attemptLabel,
        }
      : completedEvaluationRow
    const hasNextStudent = selectedStudentIndex > -1 && selectedStudentIndex < filteredStudents.length - 1

    setSubmittedEvaluations((current) => ({
      ...current,
      [selectedStudent.id]: submissionSummary,
    }))
    onSaveCompletedEvaluation?.(normalizedCompletedEvaluationRow)
    setSavedEvaluationDrafts((current) => {
      const nextDrafts = { ...current }
      delete nextDrafts[selectedStudent.id]
      return nextDrafts
    })
    setIsSubmitPopupOpen(false)
    setSelectedDecisionId('')

    if (isEditingCompletedEvaluation) {
      onAlert?.({
        tone: 'success',
        message: `${selectedStudent.name} evaluation updated.`,
        duration: 2600,
      })
      onOpenCompletedEvaluation?.(evaluationRecord)
      return
    }

    onAlert?.({
      tone: 'success',
      message: hasNextStudent
        ? `${selectedStudent.name} marked as ${decisionToSubmit.title}. Moving to the next student.`
        : `${selectedStudent.name} marked as ${decisionToSubmit.title}.`,
      duration: 2600,
    })

    if (hasNextStudent) {
      setSelectedStudentId(filteredStudents[selectedStudentIndex + 1].id)
    }
  }

  const handleSaveEvaluation = () => {
    if (isMarksDisabled) return
    if (!selectedStudent?.id || !panelActions?.buildDraft) return

    if (isEditingCompletedEvaluation) {
      onAlert?.({
        tone: 'warning',
        message: 'Use Submit to update this edited evaluation.',
        duration: 2400,
      })
      return
    }

    setSavedEvaluationDrafts((current) => ({
      ...current,
      [selectedStudent.id]: panelActions.buildDraft(),
    }))
    onSaveCompletedEvaluation?.(buildCompletedEvaluationRow({
      evaluationRecord,
      student: selectedStudent,
      itemSummaries: evaluationState.itemSummaries,
      obtainedMarks,
      totalMarks,
      thresholdResult,
      decision: null,
      rowStatus: 'Pending',
      evaluationDraft: panelActions.buildDraft(),
    }))

    const hasNextStudent = selectedStudentIndex > -1 && selectedStudentIndex < filteredStudents.length - 1
    onAlert?.({
      tone: 'secondary',
      message: hasNextStudent
        ? `${selectedStudent.name} evaluation saved. Moving to the next student.`
        : `${selectedStudent.name} evaluation saved.`,
      duration: 2600,
    })

    if (hasNextStudent) {
      setSelectedStudentId(filteredStudents[selectedStudentIndex + 1].id)
    }
  }

  const handleResetEvaluation = () => {
    if (isMarksDisabled) return
    if (!selectedStudent?.id || !panelActions?.resetDraft) return

    panelActions.resetDraft()
    setSavedEvaluationDrafts((current) => {
      const nextDrafts = { ...current }
      delete nextDrafts[selectedStudent.id]
      return nextDrafts
    })
  }

  useEffect(() => {
    setEvaluationState({
      groupedSections: [],
      requiredSections: [],
      itemSummaries: [],
      isReadyToSubmit: false,
      completedSectionCount: 0,
    })
  }, [selectedStudentId])

  useEffect(() => {
    if (!selectedStudent?.id || selectedStudent.id !== initialSelectedStudentId) return
    if (!evaluationRecord?.editingDecisionId) return

    setSelectedDecisionId(evaluationRecord.editingDecisionId)
  }, [evaluationRecord?.editingDecisionId, initialSelectedStudentId, selectedStudent?.id])

  useEffect(() => {
    if (!isMarksDisabled) return

    setIsSubmitPopupOpen(false)
    setSelectedDecisionId('')
    setPanelActions(null)
    setObtainedMarks(0)
  }, [isMarksDisabled, selectedStudentId])

  useEffect(() => {
    if (!isSubmitPopupOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isSubmitPopupOpen])

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
                {isCertifiableActivity ? (
                  <span className="eval-status-pill is-certifiable">Certifiable</span>
                ) : null}
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
            <article className="start-eval-summary-tile start-eval-summary-tile-secondary">
              <span><Users size={13} strokeWidth={2} /> Students</span>
              <strong>{submittedCount}</strong>
            </article>
            <article className="start-eval-summary-tile start-eval-summary-tile-secondary">
              <span><CheckCircle2 size={13} strokeWidth={2} /> Activity Submitted</span>
              <strong>{submittedCount}</strong>
            </article>
            <article className="start-eval-summary-tile start-eval-summary-tile-secondary start-eval-summary-tile-saved">
              <span><FileText size={13} strokeWidth={2} /> Activity Not Submitted</span>
              <strong>0</strong>
            </article>
            <button
              type="button"
              className="start-eval-summary-tile start-eval-summary-tile-primary start-eval-summary-action start-eval-summary-action-completed"
              onClick={handleOpenCompletedEvaluation}
            >
              <span><ClipboardCheck size={13} strokeWidth={2} /> Evaluation Status</span>
              <div className="start-eval-summary-action-body">
                <strong>{evaluationStatusCount}</strong>
                <small>
                  View evaluations status
                  <ChevronRight size={14} strokeWidth={2} />
                </small>
              </div>
            </button>
          </div>
          </div>
        </section>

        <section className="start-eval-board">
          <div className="start-eval-main-panel">
            {canSendToApproval ? (
              <section className="start-eval-approval-card">
                <div className="start-eval-approval-copy">
                  <span><BadgeCheck size={13} strokeWidth={2} /> Approval Ready</span>
                  <strong>All submitted evaluations are complete.</strong>
                  <p>{evaluationStatusCount} records can be sent to the approval queue.</p>
                </div>
                <button
                  type="button"
                  className="tool-btn green start-eval-approval-btn"
                  onClick={() => setIsApprovalPopupOpen(true)}
                >
                  Send to Approval
                  <ChevronRight size={15} strokeWidth={2} />
                </button>
              </section>
            ) : (
              <>
                <section className="start-eval-student-nav-card">
                  <div className="start-eval-student-nav-main">
                    <div className="start-eval-student-nav-copy">
                      <span className="start-eval-student-nav-kicker">Student Review</span>
                      <strong>{selectedStudent?.name ?? 'No student selected'}</strong>
                      <p>{selectedStudent?.registerId ?? 'No register number'}</p>
                      <div className="start-eval-student-nav-meta">
                        <span className={`eval-status-pill ${selectedStudentBadge.tone}`}>
                          {selectedStudentBadge.label}
                        </span>
                        <span className="start-eval-student-nav-total">Obtained Marks {obtainedMarks} / {totalMarks}</span>
                        <span className="start-eval-student-nav-position">
                          Student {filteredStudents.length ? Math.max(selectedStudentIndex + 1, 1) : 0} of {filteredStudents.length}
                        </span>
                      </div>
                    </div>

                    <div className="start-eval-student-nav-quick-actions">
                      <button
                        type="button"
                        className="ghost start-eval-nav-btn"
                        onClick={() => setIsStudentPickerOpen(true)}
                      >
                        <Users size={15} strokeWidth={2} />
                        Students
                      </button>
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
                    </div>
                  </div>
                </section>

                <StudentResponsePanel
                  key={selectedStudent?.id ?? 'no-student'}
                  student={selectedStudent}
                  record={evaluationRecord}
                  savedDraft={selectedStudent?.id ? (savedEvaluationDrafts[selectedStudent.id] ?? editingStudentDraft ?? null) : null}
                  marksDisabled={isMarksDisabled}
                  onObtainedMarksChange={setObtainedMarks}
                  onEvaluationStateChange={setEvaluationState}
                  onRegisterActions={setPanelActions}
                />

                {selectedStudent ? (
                  <section className={`start-eval-workspace-footer ${isReadyToSubmit ? 'is-ready' : ''}`}>
                  <div className="start-eval-workspace-status">
                    {isMarksDisabled ? (
                      <span className="start-eval-submit-pill is-pending">
                        Evaluation disabled because marks are off
                      </span>
                    ) : null}
                    {selectedStudent.submissionStatus !== 'Submitted' ? (
                      <span className="start-eval-submit-pill is-pending">
                        No submission available
                      </span>
                    ) : null}
                    {readySections.map((section) => (
                      <span key={section.key} className={`start-eval-submit-pill ${section.isComplete ? 'is-complete' : 'is-pending'}`}>
                        {section.label} {formatMarksValue(section.obtainedMarks)}/{formatMarksValue(section.totalMarks)}
                      </span>
                    ))}
                    <span className="start-eval-submit-pill is-threshold">
                      Threshold {thresholdResult?.label ?? (thresholdRows.length ? 'Not Matched' : 'Not Configured')}
                    </span>
                  </div>

                  <div className="start-eval-workspace-actions">
                    <button
                      type="button"
                      className="ghost start-eval-nav-btn is-stepper"
                      onClick={handlePreviousStudent}
                      disabled={selectedStudentIndex <= 0}
                    >
                      <ChevronLeft size={15} strokeWidth={2} />
                      Previous
                    </button>
                    <button
                      type="button"
                      className="ghost start-eval-nav-btn is-stepper"
                      onClick={handleNextStudent}
                      disabled={selectedStudentIndex === -1 || selectedStudentIndex >= filteredStudents.length - 1}
                    >
                      Next
                      <ChevronRight size={15} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      className="ghost start-eval-submit-secondary"
                      onClick={handleSaveEvaluation}
                      disabled={!selectedStudent?.id || isMarksDisabled}
                    >
                      Save & Next
                    </button>
                    <button
                      type="button"
                      className="tool-btn green start-eval-submit-btn"
                      onClick={() => {
                        setSelectedDecisionId(hasCriticalityFailure ? 'decision-repeat' : '')
                        setIsSubmitPopupOpen(true)
                      }}
                      disabled={!isReadyToSubmit || isMarksDisabled}
                    >
                      Submit
                    </button>
                  </div>
                  </section>
                ) : null}
              </>
            )}
          </div>
        </section>

        {isStudentPickerOpen ? (
          <div
            className="start-eval-student-picker-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Student list"
            onClick={() => setIsStudentPickerOpen(false)}
          >
            <div className="start-eval-student-picker" onClick={(event) => event.stopPropagation()}>
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
                {filteredStudents.length ? filteredStudents.map((student) => {
                  const studentBadge = getStudentEvaluationBadge(student)

                  return (
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
                        <span className={`eval-status-pill ${studentBadge.tone}`}>
                          {studentBadge.label}
                        </span>
                      </div>
                    </button>
                  )
                }) : (
                  <div className="start-eval-student-picker-empty">
                    <strong>No students to evaluate</strong>
                    <p>
                      {hasCompletedEvaluationHistory
                        ? 'Only Repeat and Remedial students appear here. Completed students are hidden.'
                        : 'No students match the current search or filter.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {isSubmitPopupOpen && selectedStudent ? createPortal(
          <div className="start-eval-submit-overlay" role="dialog" aria-modal="true" aria-label="Submit evaluation">
            <div className="start-eval-submit-modal">
              <div className="start-eval-submit-topbar">
                <div className="start-eval-submit-title-block">
                  <strong>Submit Evaluation</strong>
                  <p>Review the summary, choose the outcome, and confirm.</p>
                </div>
                <button type="button" className="ghost start-eval-back-btn" onClick={() => setIsSubmitPopupOpen(false)}>
                  <X size={15} strokeWidth={2} />
                </button>
              </div>

              <section className="start-eval-submit-review">
                <div className="start-eval-submit-review-row">
                  <span className="start-eval-submit-review-icon" aria-hidden="true">
                    <Users size={14} strokeWidth={2} />
                  </span>
                  <span className="start-eval-submit-review-label">Student</span>
                  <strong>{selectedStudent.name}</strong>
                  <small>{selectedStudent.registerId}</small>
                </div>
                <div className="start-eval-submit-review-row">
                  <span className="start-eval-submit-review-icon" aria-hidden="true">
                    <BadgeCheck size={14} strokeWidth={2} />
                  </span>
                  <span className="start-eval-submit-review-label">Score</span>
                  <strong>{formatMarksValue(obtainedMarks)} / {formatMarksValue(totalMarks)}</strong>
                  <small>{evaluationRecord?.activityType ?? 'Activity'}</small>
                </div>
                <div className="start-eval-submit-review-row">
                  <span className="start-eval-submit-review-icon" aria-hidden="true">
                    <ClipboardCheck size={14} strokeWidth={2} />
                  </span>
                  <span className="start-eval-submit-review-label">Threshold</span>
                  <strong>{thresholdResult?.label ?? (thresholdRows.length ? 'Not Matched' : 'Not Configured')}</strong>
                  <small>
                    {thresholdResult
                      ? `${formatMarksValue(thresholdResult.from)} to ${formatMarksValue(thresholdResult.to)}`
                      : thresholdRows.length ? 'Threshold range available' : 'No threshold configured'}
                  </small>
                </div>
              </section>

              {groupedReviewSummaries.length ? (
                <section className="start-eval-submit-breakdown-panel">
                  <div className="start-eval-submit-activity-chips" aria-label="Included evaluation sections">
                    {readySections.map((section) => {
                      const SectionIcon = getReviewSectionIcon(section.label)
                      const sectionTone = getReviewSectionTone(section.label)

                      return (
                        <span key={`chip-${section.key}`} className={`start-eval-submit-activity-chip ${sectionTone}`}>
                          <SectionIcon size={12} strokeWidth={2} />
                          {section.label}
                        </span>
                      )
                    })}
                  </div>
                  <div className="start-eval-submit-breakdown-list">
                    {groupedReviewSummaries.map((section) => {
                      const SectionIcon = getReviewSectionIcon(section.label)
                      const sectionTone = getReviewSectionTone(section.label)

                      return (
                      <article key={section.key} className="start-eval-submit-breakdown-row">
                        <div className="start-eval-submit-breakdown-copy">
                          <span className={`start-eval-submit-breakdown-icon ${sectionTone}`} aria-hidden="true">
                            <SectionIcon size={13} strokeWidth={2} />
                          </span>
                          <strong>{section.label}</strong>
                          <p>{section.completedItems} of {section.itemCount} evaluated</p>
                        </div>
                        <div className="start-eval-submit-breakdown-parts">
                          {section.parts.map((part) => (
                            <div
                              key={`${section.key}-${part.key}`}
                              className={`start-eval-submit-breakdown-part ${part.label === 'Critical' ? 'is-critical' : ''}`.trim()}
                            >
                              <small>{part.label}</small>
                              <strong>{formatMarksValue(part.obtainedMarks)} / {formatMarksValue(part.totalMarks)}</strong>
                            </div>
                          ))}
                        </div>
                      </article>
                    )})}
                  </div>
                </section>
              ) : null}

              <section className="start-eval-submit-decision-panel">
                <div className="start-eval-submit-decision-head">
                  <div>
                    <strong>Select Your Outcome Result</strong>
                    <p>Select the final result for this student.</p>
                  </div>
                </div>
                {criticalityRecommendationMessage ? (
                  <div className="start-eval-submit-criticality-note">
                    <AlertTriangle size={14} strokeWidth={2} />
                    <span>{criticalityRecommendationMessage}</span>
                  </div>
                ) : null}
                <div className="start-eval-submit-decision-list">
                  {decisionOptions.map((option) => {
                    const decisionMeta = getDecisionOptionMeta(option.id)
                    const DecisionIcon = decisionMeta.icon

                    return (
                      <div key={option.id} className={`start-eval-submit-decision-item ${decisionMeta.tone} ${selectedDecisionId === option.id ? 'is-active' : ''}`}>
                        <button
                          type="button"
                          className="start-eval-submit-decision-btn"
                          onClick={() => {
                            setSelectedDecisionId(option.id)
                          }}
                        >
                          <span className="start-eval-submit-decision-icon" aria-hidden="true">
                            <DecisionIcon size={14} strokeWidth={2} />
                          </span>
                        <div className="start-eval-submit-decision-copy">
                          <strong>{option.title}</strong>
                        </div>
                      </button>
                    </div>
                  )})}
                </div>
              </section>

                <div className="start-eval-submit-foot">
                  <button type="button" className="ghost start-eval-nav-btn" onClick={() => setIsSubmitPopupOpen(false)}>
                    Cancel
                  </button>
                  {selectedDecisionId ? (
                    <button
                      type="button"
                      className="tool-btn green start-eval-submit-btn"
                      onClick={() => handleSubmitEvaluation()}
                      disabled={!selectedDecision}
                    >
                      Confirm Submit
                    </button>
                  ) : null}
                </div>
            </div>
          </div>,
          document.body,
        ) : null}
        <SendApprovalModal
          open={isApprovalPopupOpen}
          title="Send to Approval"
          contextLabel={evaluationRecord?.activityName ?? 'Evaluation activity'}
          onClose={() => setIsApprovalPopupOpen(false)}
          onSend={handleSendApproval}
        />
      </div>
    </section>
  )
}


