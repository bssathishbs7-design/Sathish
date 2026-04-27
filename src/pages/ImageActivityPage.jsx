import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Eye,
  FileText,
  Flag,
  ImagePlus,
  GripVertical,
  ListTodo,
  Pencil,
  Sparkles,
  Tag,
  Target,
  Trash2,
  Upload,
  Plus,
  X,
} from 'lucide-react'
import DomainBadgeRow from '../components/DomainBadgeRow'
import DomainHeaderBadges from '../components/DomainHeaderBadges'
import '../styles/config/image-activity.css'

const cognitiveScaffoldingOptions = ['Not Applicable', 'Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create']
const affectiveScaffoldingOptions = ['Not Applicable', 'Receive', 'Respond', 'Value', 'Organize', 'Characterize']
const psychomotorOptions = ['Perception', 'Set', 'Guided Response', 'Mechanism', 'Adaptation', 'Origination']
const psychomotorScaffoldingOptions = ['Not Applicable', ...psychomotorOptions]
const domainOptionsMap = {
  cognitive: cognitiveScaffoldingOptions,
  affective: affectiveScaffoldingOptions,
  psychomotor: psychomotorScaffoldingOptions,
}
const QUESTION_TEXT_PLACEHOLDER = 'Enter your question here......'
const ASSIGN_YEAR_OPTIONS = ['First Year', 'Second Year', 'Third Year Part 1', 'Third Year Part 2', 'Final Year']
const ASSIGN_SGT_OPTIONS = {
  'First Year': ['SGT A', 'SGT B', 'SGT C'],
  'Second Year': ['SGT D', 'SGT E'],
  'Third Year Part 1': ['SGT F', 'SGT G'],
  'Third Year Part 2': ['SGT H', 'SGT I'],
  'Final Year': ['SGT J', 'SGT K'],
}
const ASSIGN_SERVER_TIME = {
  date: '2026-04-05',
  label: 'Server time (IST)',
}
const scaffoldingTypeOptions = [
  { value: 'MCQ', label: 'MCQ', helper: 'Multi Choice Question' },
  { value: 'Descriptive', label: 'Descriptive', helper: 'Long-form response' },
  { value: 'True or False', label: 'True or False', helper: 'Binary answer format' },
  { value: 'Fill in the blanks', label: 'Fill in the blanks', helper: 'Short completion prompt' },
]

const formatThresholdValue = (value) => {
  const rounded = Number(value.toFixed(2))
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

const formatThresholdPercentageInput = (value) => {
  if (value === '' || value === null || value === undefined) return ''
  return `${value}%`
}

const parseThresholdPercentageInput = (value) => value.replace(/%/g, '').trim()

const DEFAULT_THRESHOLD_CONFIG = [
  { label: 'Below', startPercent: 0, endPercent: 0.4 },
  { label: 'Meets', startPercent: 0.4, endPercent: 0.75 },
  { label: 'Exceeds', startPercent: 0.75, endPercent: 1 },
]

const isAutoThresholdLabel = (value) => DEFAULT_THRESHOLD_CONFIG.some((item) => item.label === String(value ?? '').trim())

const buildEmptyAssignThresholdRows = (totalMarks = 10) => {
  return DEFAULT_THRESHOLD_CONFIG.map((item, index) => ({
    id: `threshold-${Date.now()}-${index + 1}`,
    label: item.label,
    from: formatThresholdValue(item.startPercent * 100),
    to: formatThresholdValue(item.endPercent * 100),
  }))
}
const createImageSlot = (existing = {}, index = 0) => ({
  key: existing?.key ?? `image-slot-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
  file: existing?.file ?? null,
  previewUrl: existing?.previewUrl ?? existing?.src ?? existing?.url ?? '',
  error: existing?.error ?? '',
})

const createImageState = (savedImages = []) => {
  if (savedImages.length) {
    return savedImages.map((image, index) => createImageSlot(image, index))
  }

  return [createImageSlot({}, 0)]
}

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(file)
})

const createGeneratedQuestion = (type, index) => ({
  id: `${type}-${index + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type,
  questionText:
    type === 'MCQ'
      ? 'Select the most appropriate answer based on the image provided.'
      : type === 'Descriptive'
        ? ''
        : type === 'True or False'
          ? 'The labelled structure is functioning normally in this image.'
          : 'The highlighted structure is the ________.',
  options:
    type === 'MCQ'
      ? ['Option A', 'Option B', 'Option C', 'Option D']
      : [],
  cognitive: 'Not Applicable',
  affective: 'Not Applicable',
  psychomotor: 'Not Applicable',
  isCritical: false,
  marks: '1',
  answerKey:
    type === 'MCQ'
      ? 'Option A'
      : type === 'True or False'
        ? 'True'
        : 'Sample answer key',
  explanation: 'Add a short explanation for the expected answer.',
})

const isSameQuestionContent = (question, baselineQuestion) => (
  question?.type === baselineQuestion?.type
  && question?.questionText === baselineQuestion?.questionText
  && JSON.stringify(question?.options ?? []) === JSON.stringify(baselineQuestion?.options ?? [])
  && question?.cognitive === baselineQuestion?.cognitive
  && question?.affective === baselineQuestion?.affective
  && question?.psychomotor === baselineQuestion?.psychomotor
  && question?.isCritical === baselineQuestion?.isCritical
  && question?.marks === baselineQuestion?.marks
  && question?.answerKey === baselineQuestion?.answerKey
  && question?.explanation === baselineQuestion?.explanation
)

const getImageSlotLabel = (index) => String.fromCharCode(65 + index)

const buildAutoAnswerAndExplanation = (questionText) => {
  const normalizedQuestion = questionText.trim().replace(/\s+/g, ' ')
  if (!normalizedQuestion) return ''

  const plainQuestion = normalizedQuestion.replace(/[?.!]+$/, '')
  const lowerQuestion = plainQuestion.toLowerCase()

  if (/(identify|name|label|which|what is|what are)/.test(lowerQuestion)) {
    return `Identify the correct structure or finding shown in the image. Then explain the key visual clue that supports "${plainQuestion}."`
  }

  if (/(describe|outline|summari[sz]e|mention)/.test(lowerQuestion)) {
    return `State the main point for "${plainQuestion}" in one concise answer, then add a short explanation based on the visible image evidence.`
  }

  if (/(why|how|function|mechanism|importance|significance)/.test(lowerQuestion)) {
    return `Give the direct answer to "${plainQuestion}" and explain it briefly using the most relevant feature seen in the image.`
  }

  if (/(true or false|correct|incorrect)/.test(lowerQuestion)) {
    return `State whether the statement is true or false, then justify the choice with one short image-based explanation.`
  }

  return `Answer "${plainQuestion}" directly, then add one short explanation based on the important feature visible in the image.`
}

/**
 * ImageActivityPage Implementation Contract
 * Structure:
 * - Workflow page combining activity context, image upload, preview modal, and scaffolding question creation.
 * Dependencies:
 * - React hooks for local workflow state
 * - createPortal for image preview layering
 * - lucide-react icons for actions and status affordances
 * Props / Data:
 * - activityData may contain { activity, record } from the Configuration page
 * State:
 * - Local state owns title editing, marks/certifiable toggles, uploaded images, preview dialog, and scaffolding question state
 * Hooks / Browser APIs:
 * - Uses object URLs for local image preview and cleans them up on removal/unmount
 * - Locks body scroll while the preview dialog is open
 * Required assets:
 * - User-provided image files; no static image dependency required
 * Responsive behavior:
 * - Header, upload cards, rubric outline, and modal must remain usable from mobile through wide desktop
 * Placement:
 * - Page-level workflow in src/pages/ because it owns substantial screen-specific state
 */
export default function ImageActivityPage({ activityData, onAlert, onSaveSkillActivity, onAssignActivity, workflowType = 'image' }) {
  const isInterpretationWorkflow = workflowType === 'interpretation'
  const usesManualAnswerKeyGeneration = true
  const activity = activityData?.activity ?? activityData ?? null
  const record = activityData?.record ?? null
  const savedDraft = activityData?.draft ?? null
  const assignDefaultYear = ASSIGN_YEAR_OPTIONS.includes(record?.year) ? record.year : ASSIGN_YEAR_OPTIONS[0]
  const defaultActivityName = activity?.name ?? (
    isInterpretationWorkflow
      ? 'Interpret the most important clinical finding visible in the case.'
      : 'Describe principles and methods of artificial respiration'
  )
  const defaultMarksEnabled = activity ? activity.marks !== 'Nil' : true
  const defaultCertifiable = activity?.certifiable ?? false
  const activityTag = activity?.type ?? (isInterpretationWorkflow ? 'Interpretation' : 'Image')
  const activityStatus = activity?.status ?? 'Draft'
  const activityYear = record?.year ?? 'Not available'
  const activitySubject = record?.subject ?? 'Not available'
  const activityCompetency = record?.competency ?? 'Not available'
  const activityTopic = record?.topic ?? ''
  const uploadSectionHeading = isInterpretationWorkflow ? 'Reference Cases' : 'Reference Images'
  const uploadSectionDescription = isInterpretationWorkflow
    ? 'Upload 1 or 2 reference cases first. This step is required before you continue with question building.'
    : 'Upload reference images first. This step is required before you continue with question building.'
  const skillSectionHeading = 'Create Questions'
  const skillSectionDescription = 'Create at least one manual question. AI scaffolding is optional and only comes after the main question is ready.'
  const defaultSkillQuestion = useMemo(() => createGeneratedQuestion('Descriptive', 0), [])

  const [activityName, setActivityName] = useState(defaultActivityName)
  const [isEditingName, setIsEditingName] = useState(false)
  const [hasMarks, setHasMarks] = useState(savedDraft?.hasMarks ?? defaultMarksEnabled)
  const [isCertifiable, setIsCertifiable] = useState(savedDraft?.isCertifiable ?? defaultCertifiable)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('builder')
  const [images, setImages] = useState(() => createImageState(savedDraft?.images ?? []))
  const [previewImage, setPreviewImage] = useState(null)
  const [createdSkillQuestions, setCreatedSkillQuestions] = useState(
    savedDraft?.createdSkillQuestions?.length
      ? savedDraft.createdSkillQuestions
      : [defaultSkillQuestion],
  )
  const [activeCreatedSkillQuestionId, setActiveCreatedSkillQuestionId] = useState(
    savedDraft?.createdSkillQuestions?.[0]?.id ?? defaultSkillQuestion.id,
  )
  const [generatedQuestions, setGeneratedQuestions] = useState(savedDraft?.generatedQuestions ?? [])
  const [autoGeneratingQuestionIds, setAutoGeneratingQuestionIds] = useState([])
  const [activeEditableQuestionId, setActiveEditableQuestionId] = useState(null)
  const [draggedQuestionId, setDraggedQuestionId] = useState(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [isActivityCreated, setIsActivityCreated] = useState(Boolean(savedDraft?.isSkillActivitySaved || activity?.status === 'Created'))
  const [isReviewAssignPopupOpen, setIsReviewAssignPopupOpen] = useState(false)
  const [assignThresholds, setAssignThresholds] = useState(() => buildEmptyAssignThresholdRows())
  const [assignYear, setAssignYear] = useState(assignDefaultYear)
  const [assignSgt, setAssignSgt] = useState('')
  const [isAssignScheduleEnabled, setIsAssignScheduleEnabled] = useState(false)
  const [assignSchedule, setAssignSchedule] = useState({ date: '', time: '', meridiem: 'AM' })
  const [assignContent, setAssignContent] = useState({ form: false, question: true, scaffolding: false })
  const [isScaffoldingTooltipOpen, setIsScaffoldingTooltipOpen] = useState(false)
  const [isMetaExpanded, setIsMetaExpanded] = useState(false)
  const [isGeneratedQuestionsOpen, setIsGeneratedQuestionsOpen] = useState(Boolean(savedDraft?.generatedQuestions?.length))
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(isInterpretationWorkflow ? 'manual' : 'context')
  const [scaffoldingSelection, setScaffoldingSelection] = useState({
    MCQ: 0,
    Descriptive: 0,
    'True or False': 0,
    'Fill in the blanks': 0,
  })
  const imageUrlsRef = useRef([])
  const createdSkillAutoGenerationTimersRef = useRef(new Map())
  const createdSkillAutoGenerationLoaderTimersRef = useRef(new Map())
  const createdSkillManualExplanationIdsRef = useRef(new Set())
  const createdSkillAutoGeneratedQuestionRef = useRef(new Map())
  const scaffoldingTriggerRef = useRef(null)
  const scaffoldingTooltipRef = useRef(null)
  const bannerSectionRef = useRef(null)
  const assetsSectionRef = useRef(null)
  const manualSectionRef = useRef(null)
  const generatedSectionRef = useRef(null)
  const footerSectionRef = useRef(null)
  const reviewAssignOpenHandledRef = useRef(false)

  const certifiableLabel = isCertifiable ? 'Yes' : 'No'
  const totalGeneratedMarks = hasMarks
    ? [...createdSkillQuestions, ...generatedQuestions].reduce((total, question) => total + (Number(question.marks) || 0), 0)
    : 0

  useEffect(() => {
    if (!activityData?.openReviewAssign) {
      reviewAssignOpenHandledRef.current = false
      return
    }
    if (reviewAssignOpenHandledRef.current) return
    reviewAssignOpenHandledRef.current = true
    setAssignThresholds(buildEmptyAssignThresholdRows(totalGeneratedMarks))
    setIsReviewAssignPopupOpen(true)
  }, [activityData?.openReviewAssign, totalGeneratedMarks])

  useEffect(() => {
    imageUrlsRef.current = images.map((image) => image.previewUrl).filter(Boolean)
  }, [images])

  useEffect(() => () => {
    imageUrlsRef.current.forEach((previewUrl) => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    })
  }, [])

  useEffect(() => () => {
    createdSkillAutoGenerationTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId)
    })
    createdSkillAutoGenerationTimersRef.current.clear()

    createdSkillAutoGenerationLoaderTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId)
    })
    createdSkillAutoGenerationLoaderTimersRef.current.clear()
  }, [])

  useEffect(() => {
    if (!previewImage && !isReviewAssignPopupOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isReviewAssignPopupOpen, previewImage])

  useEffect(() => {
    if (!previewImage) return undefined

    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      setPreviewImage(null)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [previewImage])

  useEffect(() => {
    if (!isScaffoldingTooltipOpen) return undefined

    const onPointerDown = (event) => {
      const clickedInsideTrigger = scaffoldingTriggerRef.current?.contains(event.target)
      const clickedInsideTooltip = scaffoldingTooltipRef.current?.contains(event.target)
      if (!clickedInsideTrigger && !clickedInsideTooltip) {
        setIsScaffoldingTooltipOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isScaffoldingTooltipOpen])

  useEffect(() => {
    if (!activeCreatedSkillQuestionId) return undefined

    const onPointerDown = (event) => {
      const activeCard = document.querySelector(`[data-created-skill-question-id="${activeCreatedSkillQuestionId}"]`)
      if (!activeCard?.contains(event.target)) {
        setActiveCreatedSkillQuestionId(null)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [activeCreatedSkillQuestionId])

  useEffect(() => {
    if (!activeEditableQuestionId) return undefined

    const onPointerDown = (event) => {
      const activeCard = document.querySelector(`[data-generated-question-id="${activeEditableQuestionId}"]`)
      if (!activeCard?.contains(event.target)) {
        setActiveEditableQuestionId(null)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [activeEditableQuestionId])

  const uploadedImageCount = useMemo(
    () => images.filter((image) => image.file || image.previewUrl || image.src || image.url).length,
    [images],
  )

  const visibleImageSlots = images
  const canAddAnotherImage = !isInterpretationWorkflow && uploadedImageCount >= 1
  const uploadedPreviewImages = useMemo(
    () => images
      .filter((image) => image.previewUrl || image.src || image.url)
      .map((image) => ({
        slotKey: image.key,
        title: `Image ${getImageSlotLabel(images.findIndex((entry) => entry.key === image.key))}`,
        url: image.previewUrl || image.src || image.url,
      })),
    [images],
  )
  const hasSelectedScaffoldingType = useMemo(
    () => Object.values(scaffoldingSelection).some((range) => range > 0),
    [scaffoldingSelection],
  )
  const hasAnyQuestionCreated = createdSkillQuestions.length > 0 || generatedQuestions.length > 0
  const hasEditedDefaultCreatedQuestion = useMemo(() => {
    const firstQuestion = createdSkillQuestions[0]
    if (!firstQuestion) return false
    return !isSameQuestionContent(firstQuestion, defaultSkillQuestion)
  }, [createdSkillQuestions, defaultSkillQuestion])
  const hasCompletedUploadStep = isInterpretationWorkflow ? true : uploadedImageCount >= 1
  const hasCompletedQuestionStep = hasEditedDefaultCreatedQuestion || createdSkillQuestions.length > 1
  const hasGeneratedScaffolding = generatedQuestions.length > 0
  const canUseScaffolding = hasCompletedQuestionStep && !hasGeneratedScaffolding
  const hasDraftContent = uploadedImageCount > 0 || hasAnyQuestionCreated
  const shouldShowSkillBuilder = true
  const currentDraftSignature = useMemo(() => JSON.stringify({
    activityName,
    hasMarks,
    isCertifiable,
    images: images.map((image) => ({
      key: image.key,
      previewUrl: image.previewUrl,
      error: image.error,
      hasFile: Boolean(image.file),
    })),
    createdSkillQuestions,
    generatedQuestions,
  }), [activityName, hasMarks, isCertifiable, images, createdSkillQuestions, generatedQuestions])
  const [lastSavedSignature, setLastSavedSignature] = useState(savedDraft ? currentDraftSignature : '')
  const canCreateActivity = hasCompletedUploadStep && hasCompletedQuestionStep && !isAutoSaving
  const readinessTone = isActivityCreated
    ? 'is-created'
    : canCreateActivity
      ? 'is-ready'
      : hasCompletedUploadStep || hasCompletedQuestionStep
        ? 'is-progress'
        : 'is-pending'
  const readinessSummary = useMemo(() => {
    if (isActivityCreated) {
      return {
        label: 'Created',
        text: 'Activity created successfully. You can continue refining the activity here.',
      }
    }

    if (canCreateActivity) {
      return {
        label: 'Ready',
        text: hasGeneratedScaffolding
          ? 'Everything required is complete. You can create the activity now.'
          : 'Main requirements are complete. You can create the activity now or add optional scaffolding first.',
      }
    }

    if (!hasCompletedUploadStep && !hasCompletedQuestionStep) {
      return {
        label: 'In progress',
        text: isInterpretationWorkflow
          ? 'Complete one manual question to make this activity ready.'
          : 'Add at least one image and complete one manual question to make this activity ready.',
      }
    }

    if (!hasCompletedUploadStep) {
      return {
        label: 'Missing image',
        text: 'Add at least one reference image to unlock activity creation.',
      }
    }

    return {
      label: 'Missing question',
      text: 'Complete one manual question to unlock activity creation.',
    }
  }, [
    canCreateActivity,
    hasCompletedQuestionStep,
    hasCompletedUploadStep,
    hasGeneratedScaffolding,
    isActivityCreated,
    isInterpretationWorkflow,
  ])
  const footerStatusTone = isAutoSaving ? 'is-saving' : readinessTone
  const footerStatusSummary = isAutoSaving
    ? { label: 'Saving', text: 'Saving the latest changes to this activity.' }
    : readinessSummary
  const assignSgtOptions = assignYear ? (ASSIGN_SGT_OPTIONS[assignYear] ?? []) : []
  useEffect(() => {
    if (!assignYear) {
      if (assignSgt) {
        setAssignSgt('')
      }
      return
    }
    if (!assignSgtOptions.length) {
      if (assignSgt) {
        setAssignSgt('')
      }
      return
    }
    if (!assignSgt || !assignSgtOptions.includes(assignSgt)) {
      setAssignSgt(assignSgtOptions[0])
    }
  }, [assignSgt, assignSgtOptions, assignYear])
  const imageAssignHelperText = ''
  const imageStudentAssignOptions = [
    { key: 'question', label: isInterpretationWorkflow ? 'Manual Question' : 'Question', available: true },
    { key: 'scaffolding', label: 'Scaffolding', available: generatedQuestions.length > 0 },
  ]
  const assignThresholdErrors = useMemo(() => assignThresholds.map((row, index) => {
    const from = Number(row.from)
    const to = Number(row.to)
    if (!row.label.trim()) return 'Enter a threshold label.'
    if (Number.isNaN(from) || Number.isNaN(to)) return 'Enter valid values.'
    if (from > to) return '`From` must be less than or equal to `To`.'
    if (index === 0 && from !== 0) return 'First row must start at 0.'
    if (index > 0) {
      const previousTo = Number(assignThresholds[index - 1].to)
      if (Math.abs(previousTo - from) > 0.001) return 'Thresholds must continue without gaps or overlaps.'
    }
    if (index === assignThresholds.length - 1 && Math.abs(to - 100) > 0.001) {
      return 'Final threshold must end at 100%.'
    }
    return ''
  }), [assignThresholds])
  const canProceedAssign = assignThresholdErrors.every((error) => !error)
    && Boolean(assignYear)
    && Boolean(assignSgt)
    && (!isAssignScheduleEnabled || Boolean(assignSchedule.date && assignSchedule.time && assignSchedule.meridiem))

  const getSectionExpandAction = useCallback((sectionId) => {
    if (sectionId === 'reference') {
      return () => setIsAssetsSectionOpen(true)
    }
    if (sectionId === 'manual') {
      return () => setIsCreatedQuestionsOpen(true)
    }
    if (sectionId === 'generated') {
      return () => setIsGeneratedQuestionsOpen(true)
    }
    return undefined
  }, [])

  const jumpToWorkflowSection = (stepId, sectionRef, beforeScroll) => {
    setActiveWorkflowStep(stepId)
    beforeScroll?.()
    window.requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleAddQuestion = () => {
    const nextQuestion = createGeneratedQuestion('Descriptive', createdSkillQuestions.length)
    setCreatedSkillQuestions((current) => [...current, nextQuestion])
    setActiveCreatedSkillQuestionId(nextQuestion.id)
    setIsActivityCreated(false)
    onAlert?.({ tone: 'secondary', message: 'New question added successfully.' })
  }

  const handleGenerateScaffolding = () => {
    if (!canUseScaffolding) {
      onAlert?.({
        tone: 'warning',
        message: hasGeneratedScaffolding
          ? 'Scaffolding is already created. Remove the generated questions first to generate again.'
          : 'Create at least one manual question before generating scaffolding.',
      })
      return
    }

    const selectedTypes = Object.entries(scaffoldingSelection).filter(([, range]) => range > 0)

    if (!selectedTypes.length) {
      onAlert?.({ tone: 'warning', message: 'Select at least one scaffolding question type before generating.' })
      return
    }

    const hasInvalidRange = selectedTypes.some(([, range]) => range < 1 || range > 5)
    if (hasInvalidRange) {
      onAlert?.({ tone: 'warning', message: 'Each selected question type must have a range between 1 and 5.' })
      return
    }

    const nextGeneratedQuestions = selectedTypes.flatMap(([type, range]) => (
      Array.from({ length: range }, (_, index) => createGeneratedQuestion(type, index))
    ))

    setGeneratedQuestions(nextGeneratedQuestions)
    setActiveWorkspaceTab('scaffolding')
    setIsGeneratedQuestionsOpen(true)
    setActiveEditableQuestionId(null)
    setIsScaffoldingTooltipOpen(false)
    setIsActivityCreated(false)
    onAlert?.({ tone: 'secondary', message: 'Scaffolding questions created successfully.' })
  }

  const handleToggleScaffoldingType = (type) => {
    setScaffoldingSelection((current) => ({
      ...current,
      [type]: current[type] > 0 ? 0 : 1,
    }))
  }

  const handleScaffoldingRangeChange = (type, value) => {
    const nextValue = Number(value)
    setScaffoldingSelection((current) => ({
      ...current,
      [type]: Number.isNaN(nextValue) ? 1 : Math.min(5, Math.max(1, nextValue)),
    }))
  }

  const handleWorkspaceTabClick = (tab) => {
    if (tab === 'builder') {
      setActiveWorkspaceTab('builder')
      setIsScaffoldingTooltipOpen(false)
      return
    }

    setActiveWorkspaceTab('scaffolding')
    if (!generatedQuestions.length) {
      setIsScaffoldingTooltipOpen(canUseScaffolding)
    }
  }

  const updateCreatedSkillQuestion = (id, field, value) => {
    setCreatedSkillQuestions((current) => current.map((question) => (
      question.id === id
        ? {
          ...question,
          [field]: value,
        }
        : question
    )))
    setIsActivityCreated(false)
  }

  const updateCreatedSkillQuestionExplanation = (id, value) => {
    const trimmedValue = value.trim()
    if (trimmedValue) {
      createdSkillManualExplanationIdsRef.current.add(id)
    } else {
      createdSkillManualExplanationIdsRef.current.delete(id)
      createdSkillAutoGeneratedQuestionRef.current.delete(id)
    }

    const pendingTimer = createdSkillAutoGenerationTimersRef.current.get(id)
    if (pendingTimer) {
      window.clearTimeout(pendingTimer)
      createdSkillAutoGenerationTimersRef.current.delete(id)
    }

    const pendingLoaderTimer = createdSkillAutoGenerationLoaderTimersRef.current.get(id)
    if (pendingLoaderTimer) {
      window.clearTimeout(pendingLoaderTimer)
      createdSkillAutoGenerationLoaderTimersRef.current.delete(id)
    }

    setAutoGeneratingQuestionIds((current) => current.filter((questionId) => questionId !== id))
    updateCreatedSkillQuestion(id, 'explanation', value)
  }

  const handleGenerateCreatedSkillExplanation = (id) => {
    const question = createdSkillQuestions.find((entry) => entry.id === id)
    const normalizedQuestion = question?.questionText?.trim() ?? ''
    if (!normalizedQuestion) return

    const pendingTimer = createdSkillAutoGenerationTimersRef.current.get(id)
    if (pendingTimer) {
      window.clearTimeout(pendingTimer)
      createdSkillAutoGenerationTimersRef.current.delete(id)
    }

    const pendingLoaderTimer = createdSkillAutoGenerationLoaderTimersRef.current.get(id)
    if (pendingLoaderTimer) {
      window.clearTimeout(pendingLoaderTimer)
      createdSkillAutoGenerationLoaderTimersRef.current.delete(id)
    }

    createdSkillManualExplanationIdsRef.current.delete(id)
    setAutoGeneratingQuestionIds((current) => (
      current.includes(id) ? current : [...current, id]
    ))

    window.setTimeout(() => {
      const nextAutoExplanation = buildAutoAnswerAndExplanation(normalizedQuestion)
      createdSkillAutoGeneratedQuestionRef.current.set(id, normalizedQuestion)
      setCreatedSkillQuestions((current) => current.map((currentQuestion) => (
        currentQuestion.id === id
          ? {
            ...currentQuestion,
            explanation: nextAutoExplanation,
          }
          : currentQuestion
      )))
      setAutoGeneratingQuestionIds((current) => current.filter((questionId) => questionId !== id))
      setIsActivityCreated(false)
    }, 850)
  }

  useEffect(() => {
    const activeIds = new Set(createdSkillQuestions.map((question) => question.id))

    createdSkillAutoGenerationTimersRef.current.forEach((timerId, questionId) => {
      if (!activeIds.has(questionId)) {
        window.clearTimeout(timerId)
        createdSkillAutoGenerationTimersRef.current.delete(questionId)
      }
    })

    createdSkillAutoGenerationLoaderTimersRef.current.forEach((timerId, questionId) => {
      if (!activeIds.has(questionId)) {
        window.clearTimeout(timerId)
        createdSkillAutoGenerationLoaderTimersRef.current.delete(questionId)
      }
    })

    createdSkillManualExplanationIdsRef.current.forEach((questionId) => {
      if (!activeIds.has(questionId)) {
        createdSkillManualExplanationIdsRef.current.delete(questionId)
      }
    })

    createdSkillAutoGeneratedQuestionRef.current.forEach((_, questionId) => {
      if (!activeIds.has(questionId)) {
        createdSkillAutoGeneratedQuestionRef.current.delete(questionId)
      }
    })

    if (usesManualAnswerKeyGeneration) {
      setAutoGeneratingQuestionIds([])
      return undefined
    }

    createdSkillQuestions.forEach((question) => {
      const normalizedQuestion = question.questionText.trim()
      const pendingTimer = createdSkillAutoGenerationTimersRef.current.get(question.id)
      if (pendingTimer) {
        window.clearTimeout(pendingTimer)
        createdSkillAutoGenerationTimersRef.current.delete(question.id)
      }

      const pendingLoaderTimer = createdSkillAutoGenerationLoaderTimersRef.current.get(question.id)
      if (pendingLoaderTimer) {
        window.clearTimeout(pendingLoaderTimer)
        createdSkillAutoGenerationLoaderTimersRef.current.delete(question.id)
      }

        if (!normalizedQuestion) {
          createdSkillAutoGeneratedQuestionRef.current.delete(question.id)
          setAutoGeneratingQuestionIds((current) => current.filter((questionId) => questionId !== question.id))
          return
        }

      const isManualExplanationLocked = createdSkillManualExplanationIdsRef.current.has(question.id) && question.explanation.trim()
      if (isManualExplanationLocked) {
        setAutoGeneratingQuestionIds((current) => current.filter((questionId) => questionId !== question.id))
        return
      }

      const nextAutoExplanation = buildAutoAnswerAndExplanation(normalizedQuestion)
      const lastGeneratedQuestion = createdSkillAutoGeneratedQuestionRef.current.get(question.id)
      if (question.explanation === nextAutoExplanation && lastGeneratedQuestion === normalizedQuestion) {
        setAutoGeneratingQuestionIds((current) => current.filter((questionId) => questionId !== question.id))
        return
      }

      const loaderTimerId = window.setTimeout(() => {
        setAutoGeneratingQuestionIds((current) => (
          current.includes(question.id) ? current : [...current, question.id]
        ))
        createdSkillAutoGenerationLoaderTimersRef.current.delete(question.id)
      }, 450)

      createdSkillAutoGenerationLoaderTimersRef.current.set(question.id, loaderTimerId)

      const timerId = window.setTimeout(() => {
        createdSkillAutoGeneratedQuestionRef.current.set(question.id, normalizedQuestion)
        setCreatedSkillQuestions((current) => current.map((currentQuestion) => (
          currentQuestion.id === question.id
            ? {
              ...currentQuestion,
              explanation: nextAutoExplanation,
            }
            : currentQuestion
        )))
        setAutoGeneratingQuestionIds((current) => current.filter((questionId) => questionId !== question.id))
        createdSkillAutoGenerationTimersRef.current.delete(question.id)
        const activeLoaderTimer = createdSkillAutoGenerationLoaderTimersRef.current.get(question.id)
        if (activeLoaderTimer) {
          window.clearTimeout(activeLoaderTimer)
          createdSkillAutoGenerationLoaderTimersRef.current.delete(question.id)
        }
      }, 1400)

      createdSkillAutoGenerationTimersRef.current.set(question.id, timerId)
    })
  }, [createdSkillQuestions, usesManualAnswerKeyGeneration])

  const deleteCreatedSkillQuestion = (id) => {
    setCreatedSkillQuestions((current) => current.filter((question) => question.id !== id))
    setActiveCreatedSkillQuestionId((current) => (current === id ? null : current))
    setIsActivityCreated(false)
    onAlert?.({ tone: 'warning', message: 'Skill question removed.' })
  }

  const updateGeneratedQuestion = (id, field, value) => {
    setGeneratedQuestions((current) => current.map((question) => (
      question.id === id
        ? {
          ...question,
          [field]: value,
        }
        : question
    )))
    setIsActivityCreated(false)
  }

  const deleteGeneratedQuestion = (id) => {
    setGeneratedQuestions((current) => current.filter((question) => question.id !== id))
    setActiveEditableQuestionId((current) => (current === id ? null : current))
    setIsActivityCreated(false)
    onAlert?.({ tone: 'warning', message: 'Generated question removed.' })
  }

  const addScaffoldingQuestion = (type) => {
    const nextQuestion = createGeneratedQuestion(type, generatedQuestions.length)
    setGeneratedQuestions((current) => [...current, nextQuestion])
    setActiveWorkspaceTab('scaffolding')
    setIsGeneratedQuestionsOpen(true)
    setActiveEditableQuestionId(nextQuestion.id)
    setIsActivityCreated(false)
    onAlert?.({ tone: 'secondary', message: `${type} scaffolding question added.` })
  }

  const persistSkillActivityDraft = useCallback(async () => {
    const savedImages = await Promise.all(
      images.map(async (image, index) => ({
        key: image.key,
        file: null,
        previewUrl: image.file ? await fileToDataUrl(image.file) : (image.previewUrl || image.src || image.url || ''),
        label: `Reference Image ${index + 1}`,
        error: image.error,
      })),
    )

    onSaveSkillActivity?.({
      activity: {
        ...activity,
        status: 'Created',
      },
      record,
      draft: {
        activityName,
        hasMarks,
        isCertifiable,
        images: savedImages,
        createdSkillQuestions,
        generatedQuestions,
        isSkillActivitySaved: true,
      },
    })
  }, [activity, activityName, createdSkillQuestions, generatedQuestions, hasMarks, images, isCertifiable, onSaveSkillActivity, record])

  const handleCreateActivity = async () => {
    await persistSkillActivityDraft()
    setLastSavedSignature(currentDraftSignature)
    setIsActivityCreated(true)
    onAlert?.({ tone: 'secondary', message: 'Activity created successfully.' })
  }

  const handleReviewAssign = () => {
    setAssignThresholds(buildEmptyAssignThresholdRows(totalGeneratedMarks))
    setAssignYear(assignDefaultYear)
    setAssignSgt('')
    setIsAssignScheduleEnabled(false)
    setAssignSchedule({ date: '', time: '', meridiem: 'AM' })
    setAssignContent({
      form: false,
      question: true,
      scaffolding: generatedQuestions.length > 0,
    })
    setIsReviewAssignPopupOpen(true)
  }

  const updateAssignThreshold = (id, field, value) => {
    const nextValue = field === 'from' || field === 'to'
      ? parseThresholdPercentageInput(value)
      : value

    setAssignThresholds((current) => current.map((row) => (row.id === id ? { ...row, [field]: nextValue } : row)))
  }

  const addAssignThreshold = () => {
    setAssignThresholds((current) => [
      ...current,
      { id: `threshold-${Date.now()}`, label: '', from: '', to: '' },
    ])
  }

  const deleteAssignThreshold = (id) => {
    setAssignThresholds((current) => current.filter((row) => row.id !== id))
  }

  useEffect(() => {
    setAssignThresholds((current) => current.map((row) => {
      const matchingThreshold = DEFAULT_THRESHOLD_CONFIG.find((item) => item.label === String(row.label ?? '').trim())

      if (!matchingThreshold) return row

      return {
        ...row,
        from: formatThresholdValue(matchingThreshold.startPercent * 100),
        to: formatThresholdValue(matchingThreshold.endPercent * 100),
      }
    }))
  }, [totalGeneratedMarks])

  const handleProceedAssign = async () => {
    if (!canProceedAssign) {
      onAlert?.({ tone: 'warning', message: 'Complete thresholds, year, SGT, and schedule fields before proceeding.' })
      return
    }

    const referenceImages = (await Promise.all(
      images
        .filter((image) => image.file || image.previewUrl || image.src || image.url)
        .map(async (image, index) => ({
        id: image.key ?? `reference-${index + 1}`,
        src: image.file ? await fileToDataUrl(image.file) : (image.previewUrl || image.src || image.url),
        label: `Reference Image ${index + 1}`,
        })),
    ))

    const mappedQuestions = createdSkillQuestions.map((question, index) => ({
      id: question.id ?? `question-${index + 1}`,
      type: question.type ?? 'Descriptive',
      prompt: question.questionText || QUESTION_TEXT_PLACEHOLDER,
      questionText: question.questionText || QUESTION_TEXT_PLACEHOLDER,
      explanation: question.explanation ?? '',
      answerKey: question.answerKey ?? '',
      marks: question.marks ?? '1',
      placeholder: 'Write your answer here.',
      options: question.options ?? [],
      cognitive: question.cognitive ?? 'Not Applicable',
      affective: question.affective ?? 'Not Applicable',
      psychomotor: question.psychomotor ?? 'Not Applicable',
      isCritical: Boolean(question.isCritical),
    }))

    const mappedScaffolding = generatedQuestions.map((question, index) => ({
      id: question.id ?? `scaffold-${index + 1}`,
      type: question.type ?? 'Descriptive',
      prompt: question.questionText || QUESTION_TEXT_PLACEHOLDER,
      questionText: question.questionText || QUESTION_TEXT_PLACEHOLDER,
      explanation: question.explanation ?? '',
      answerKey: question.answerKey ?? '',
      marks: question.marks ?? '1',
      placeholder: 'Complete this mandatory scaffolding response.',
      options: question.options ?? [],
      cognitive: question.cognitive ?? 'Not Applicable',
      affective: question.affective ?? 'Not Applicable',
      psychomotor: question.psychomotor ?? 'Not Applicable',
      isCritical: Boolean(question.isCritical),
    }))

    onAssignActivity?.({
      id: activity?.id ?? `image-assignment-${Date.now()}`,
      title: activityName,
      type: activityTag,
      createdDate: new Date().toLocaleDateString('en-GB'),
      attemptCount: '0 / 1',
      status: 'Assigned',
      assignedTo: `${assignYear} • ${assignSgt}`,
      certifiable: isCertifiable,
      isCertifiable,
      thresholds: assignThresholds,
      schedule: isAssignScheduleEnabled ? assignSchedule : null,
      assignContent,
      examData: {
        assignContent,
        certifiable: isCertifiable,
        isCertifiable,
        durationMinutes: 30,
        thresholds: assignThresholds,
        schedule: isAssignScheduleEnabled ? assignSchedule : null,
        proctoring: {
          mode: 'Online Proctoring',
          fullscreenRequired: true,
          autoSubmitOnTimeout: true,
        },
        modules: {
          referenceImages,
          questions: assignContent.question ? mappedQuestions : [],
          form: [],
          scaffolding: assignContent.scaffolding ? mappedScaffolding : [],
        },
      },
      activityData: {
          ...(activityData ?? {}),
        activity: {
          ...(activity ?? {}),
          name: activityName,
          certifiable: isCertifiable,
          isCertifiable,
          status: 'Created',
        },
        record,
      },
    })
    setIsReviewAssignPopupOpen(false)
  }

  const moveGeneratedQuestion = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return

    setGeneratedQuestions((current) => {
      const sourceIndex = current.findIndex((question) => question.id === sourceId)
      const targetIndex = current.findIndex((question) => question.id === targetId)
      if (sourceIndex === -1 || targetIndex === -1) return current

      const nextQuestions = [...current]
      const [movedQuestion] = nextQuestions.splice(sourceIndex, 1)
      nextQuestions.splice(targetIndex, 0, movedQuestion)
      return nextQuestions
    })
    setIsActivityCreated(false)
  }

  const handleImageUpload = (slotKey, event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const readerUrl = URL.createObjectURL(file)

    setImages((current) => current.map((image) => {
      if (image.key !== slotKey) return image
      if (image.previewUrl) {
        URL.revokeObjectURL(image.previewUrl)
      }

      return {
        ...image,
        file,
        previewUrl: readerUrl,
        error: '',
      }
    }))

    event.target.value = ''
    setIsActivityCreated(false)
    onAlert?.({ tone: 'secondary', message: 'Image uploaded successfully.' })
  }

  const handleAddImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const readerUrl = URL.createObjectURL(file)

    setImages((current) => [
      ...current,
      createImageSlot({
        file,
        previewUrl: readerUrl,
        error: '',
      }, current.length),
    ])

    event.target.value = ''
    setIsActivityCreated(false)
    onAlert?.({ tone: 'secondary', message: 'Image uploaded successfully.' })
  }

  const handleRemoveImage = (slotKey) => {
    setImages((current) => {
      const removed = current.find((image) => image.key === slotKey)
      if (!removed) return current
      if (removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl)
      }

      if (previewImage?.slotKey === slotKey) {
        setPreviewImage(null)
      }

      const next = current.filter((image) => image.key !== slotKey)
      return next.length ? next : [createImageSlot({}, 0)]
    })
    const resetDefaultQuestion = createGeneratedQuestion('Descriptive', 0)
    setCreatedSkillQuestions([resetDefaultQuestion])
    setActiveCreatedSkillQuestionId(resetDefaultQuestion.id)
    setGeneratedQuestions([])
    setActiveEditableQuestionId(null)
    setIsActivityCreated(false)
    onAlert?.({ tone: 'danger', message: 'Image removed from the activity.' })
  }

  const activePreviewIndex = previewImage
    ? uploadedPreviewImages.findIndex((image) => image.slotKey === previewImage.slotKey)
    : -1

  const handlePreviewNavigate = (direction) => {
    if (activePreviewIndex === -1 || uploadedPreviewImages.length <= 1) return

    const nextIndex = (activePreviewIndex + direction + uploadedPreviewImages.length) % uploadedPreviewImages.length
    setPreviewImage(uploadedPreviewImages[nextIndex])
  }

  useEffect(() => {
    if (!hasDraftContent || currentDraftSignature === lastSavedSignature) {
      return undefined
    }

    let cancelled = false

    const timeoutId = window.setTimeout(() => {
      ;(async () => {
        setIsAutoSaving(true)
        await persistSkillActivityDraft()
        if (cancelled) return
        setLastSavedSignature(currentDraftSignature)
        setIsAutoSaving(false)
      })()
    }, 500)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [currentDraftSignature, hasDraftContent, lastSavedSignature, persistSkillActivityDraft])

  return (
    <section className={`image-activity-page ${isInterpretationWorkflow ? 'interpretation-activity-page' : ''}`.trim()}>
      <div className="image-activity-workspace image-activity-workspace--enhanced">
        <section ref={bannerSectionRef} className="image-activity-banner image-activity-banner--enhanced">
          <div className="image-activity-banner-main">
              <div className="image-activity-banner-head">
                <span className="image-activity-section-badge">Phase 1: Contextual Setup</span>
                <div className="image-activity-banner-actions">
                  <span className="image-activity-state-badge">{activityStatus}</span>
                </div>
              </div>
            <div className="image-activity-title-row">
              {isEditingName ? (
                <input
                  className="image-activity-title-input"
                  value={activityName}
                  onChange={(event) => setActivityName(event.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  autoFocus
                />
              ) : (
                <h1>{activityName}</h1>
              )}
              <button
                type="button"
                className="image-activity-title-edit"
                aria-label="Edit activity name"
                onClick={() => setIsEditingName(true)}
              >
                <Pencil size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="image-activity-meta-strip">
              <article className="image-activity-meta-card">
                <div className="image-activity-meta-head">
                  <span className="image-activity-meta-icon" aria-hidden="true"><Tag size={14} strokeWidth={2} /></span>
                  <span>Activity Type</span>
                </div>
                <strong>{activityTag}</strong>
              </article>
              <article className="image-activity-meta-card">
                <div className="image-activity-meta-head">
                  <span className="image-activity-meta-icon" aria-hidden="true"><CheckCircle2 size={14} strokeWidth={2} /></span>
                  <span>Total Marks</span>
                </div>
                <strong>{hasMarks ? totalGeneratedMarks : 'Disabled'}</strong>
              </article>
              <article className="image-activity-meta-card">
                <div className="image-activity-meta-head">
                  <span className="image-activity-meta-icon" aria-hidden="true"><BadgeCheck size={14} strokeWidth={2} /></span>
                  <span>Certifiable</span>
                </div>
                <strong>{certifiableLabel}</strong>
              </article>
            </div>

            <div className="image-activity-banner-tabs">
              <div className="image-activity-workspace-tabs">
                <button
                  type="button"
                  className={`image-activity-workspace-tab ${activeWorkspaceTab === 'builder' ? 'is-active' : ''}`}
                  onClick={() => handleWorkspaceTabClick('builder')}
                >
                  <span className="image-activity-workspace-tab-icon" aria-hidden="true"><ImagePlus size={14} strokeWidth={2} /></span>
                  <span>{isInterpretationWorkflow ? 'Manual Question' : 'Upload Image + Manual Question'}</span>
                </button>
                <div className="image-activity-scaffolding-anchor" ref={scaffoldingTriggerRef}>
                  <button
                    type="button"
                    className={`image-activity-workspace-tab ${activeWorkspaceTab === 'scaffolding' ? 'is-active' : ''}`}
                    onClick={() => handleWorkspaceTabClick('scaffolding')}
                    aria-expanded={isScaffoldingTooltipOpen}
                  >
                    <span className="image-activity-workspace-tab-icon" aria-hidden="true"><Sparkles size={14} strokeWidth={2} /></span>
                    <span>Scaffolding</span>
                    <strong>{generatedQuestions.length}</strong>
                  </button>
                </div>
              </div>
            </div>

          </div>

            <div className="image-activity-config-panel image-activity-config-panel--enhanced">
            <div className="image-activity-config-toggle-head">
              <div className="image-activity-config-head">
                <span>Activity Settings</span>
                <small>{hasMarks ? 'Marks enabled' : 'Marks disabled'} • {certifiableLabel} certifiable</small>
              </div>
            </div>
            <div className="image-activity-toggle-card">
              <div>
                <span>Marks</span>
                <small>Enable scoring for this activity</small>
              </div>
              <button
                type="button"
                className={`image-activity-toggle ${hasMarks ? 'is-active' : ''}`}
                onClick={() => setHasMarks((value) => !value)}
                aria-pressed={hasMarks}
              >
                <span />
              </button>
            </div>

            <div className="image-activity-toggle-card">
              <div>
                <span>Certifiable</span>
                <small>Mark this as a certifiable skill check</small>
              </div>
              <button
                type="button"
                className={`image-activity-toggle ${isCertifiable ? 'is-active' : ''}`}
                onClick={() => setIsCertifiable((value) => !value)}
                aria-pressed={isCertifiable}
              >
                <span />
              </button>
            </div>
          </div>
        </section>

        {activeWorkspaceTab === 'scaffolding' && generatedQuestions.length === 0 && isScaffoldingTooltipOpen && canUseScaffolding ? (
          <section className="image-activity-header-generator image-activity-header-generator--scaffolding" ref={scaffoldingTooltipRef}>
            <div className="image-activity-scaffolding-tooltip">
              <div className="image-activity-scaffolding-tooltip-head">
                <span className="image-activity-scaffolding-tooltip-kicker">Choose Generation</span>
                <button
                  type="button"
                  className="image-activity-scaffolding-close"
                  aria-label="Close scaffolding tooltip"
                  onClick={() => setIsScaffoldingTooltipOpen(false)}
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>

              <p className="image-activity-scaffolding-tooltip-note">
                Select one or more question types, set the count from 1 to 5, then click Generate.
              </p>

              <div className="image-activity-scaffolding-option-list">
                {scaffoldingTypeOptions.map((option) => {
                  const isSelected = scaffoldingSelection[option.value] > 0
                  return (
                    <div key={option.value} className={`image-activity-scaffolding-option ${isSelected ? 'is-selected' : ''}`}>
                      <div className="image-activity-scaffolding-row">
                        <button
                          type="button"
                          className="image-activity-scaffolding-choice"
                          onClick={() => handleToggleScaffoldingType(option.value)}
                          aria-pressed={isSelected}
                        >
                          <span className="image-activity-scaffolding-choice-icon" aria-hidden="true">
                            <Sparkles size={14} strokeWidth={2} />
                          </span>
                          <span className="image-activity-scaffolding-choice-copy">
                            <strong>{option.label}</strong>
                            <small>{option.helper}</small>
                          </span>
                        </button>
                        {isSelected ? (
                          <label className="image-activity-scaffolding-range">
                            <span>Count</span>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={scaffoldingSelection[option.value]}
                              onChange={(event) => handleScaffoldingRangeChange(option.value, event.target.value)}
                              onClick={(event) => event.stopPropagation()}
                            />
                          </label>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="image-activity-scaffolding-tooltip-actions">
                <button
                  type="button"
                  className="tool-btn green"
                  onClick={handleGenerateScaffolding}
                  disabled={!hasSelectedScaffoldingType}
                >
                  Generate
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {activeWorkspaceTab === 'builder' ? (
        <section ref={assetsSectionRef} className="image-activity-assets-card image-activity-assets-card--enhanced">
          <div className={`image-activity-section-head ${isInterpretationWorkflow ? 'is-interpretation-compact' : ''}`.trim()}>
            <div>
              {!isInterpretationWorkflow ? (
                <h2 className="image-activity-section-title-badge image-activity-section-title-badge--reference">{uploadSectionHeading}</h2>
              ) : null}
              {!isInterpretationWorkflow ? (
                <p className="image-activity-section-copy">{uploadSectionDescription}</p>
              ) : null}
            </div>
            {!isInterpretationWorkflow ? (
              <div className="image-activity-section-actions">
                <span className="image-activity-chip">
                  <ImagePlus size={14} strokeWidth={2} />
                  {uploadedImageCount} uploaded
                </span>
              </div>
            ) : null}
          </div>

            <>
              {!isInterpretationWorkflow ? (
                <>
                  <div className="image-activity-upload-row">
                    <div className="image-activity-assets-grid">
                      {visibleImageSlots.map((image, index) => {
                        const imageSource = image.previewUrl || image.src || image.url || ''
                        const isFilled = Boolean(image.file || imageSource)
                        const slotLabel = getImageSlotLabel(index)

                        return (
                          <article key={image.key} className={`image-activity-asset image-activity-asset--enhanced ${isFilled ? 'is-filled' : 'is-empty'}`}>
                            <div className="image-activity-asset-top">
                              <div className="image-activity-asset-title">
                                <span>{slotLabel}</span>
                                <small>{isFilled ? 'Uploaded' : 'Ready to upload'}</small>
                              </div>
                              {isFilled ? (
                                <div className="image-activity-asset-actions">
                                  <button
                                    type="button"
                                    className="image-activity-asset-btn"
                                    onClick={() => setPreviewImage({ slotKey: image.key, title: `Image ${slotLabel}`, url: imageSource })}
                                    aria-label="Preview image"
                                    disabled={!imageSource}
                                  >
                                    <Eye size={15} strokeWidth={2} />
                                  </button>
                                  <button
                                    type="button"
                                    className="image-activity-asset-btn is-danger"
                                    onClick={() => handleRemoveImage(image.key)}
                                    aria-label="Remove image"
                                  >
                                    <Trash2 size={15} strokeWidth={2} />
                                  </button>
                                </div>
                              ) : null}
                            </div>
                            {imageSource ? (
                              <div className="image-activity-upload-preview">
                                <img src={imageSource} alt={`Image ${slotLabel}`} />
                              </div>
                            ) : null}
                            {!isFilled ? (
                              <label className="image-activity-upload-box" htmlFor={`image-upload-${image.key}`}>
                                <Upload size={20} strokeWidth={2} />
                                <p>Upload image</p>
                                <small>JPG or PNG, recommended 700 x 700 px or above</small>
                                <span className="image-activity-upload-link">Click to browse</span>
                              </label>
                            ) : null}
                            <input
                              id={`image-upload-${image.key}`}
                              className="image-activity-upload-input"
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              onChange={(event) => handleImageUpload(image.key, event)}
                            />
                            {image.error ? <p className="image-activity-upload-error">{image.error}</p> : null}
                          </article>
                        )
                      })}
                      {canAddAnotherImage ? (
                        <label
                          className="image-activity-add-image-btn"
                          htmlFor="image-upload-add"
                          aria-label="Add another image"
                          data-tooltip="Upload Image"
                        >
                          <Plus size={18} strokeWidth={2.2} />
                        </label>
                      ) : null}
                    </div>
                  {canAddAnotherImage ? (
                    <input
                      id="image-upload-add"
                      className="image-activity-upload-input"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleAddImageUpload}
                    />
                  ) : null}
                  </div>
                </>
              ) : null}

              {shouldShowSkillBuilder ? (
                <section ref={manualSectionRef} className="image-activity-skill-card image-activity-skill-card--stacked">
                  <div className="image-activity-skill-card-top">
                    <div className="image-activity-skill-builder-copy">
                      {isInterpretationWorkflow ? (
                        <h2 className="image-activity-section-title-badge image-activity-section-title-badge--question">{skillSectionHeading}</h2>
                      ) : (
                        <h2 className="image-activity-section-title-badge image-activity-section-title-badge--question">{skillSectionHeading}</h2>
                      )}
                      <p>{skillSectionDescription}</p>
                    </div>
                    <div className="image-activity-inline-actions image-activity-skill-actions">
                    </div>
                  </div>

                    <>
                      <div className="image-activity-created-skill-list">
                        {createdSkillQuestions.map((question, index) => {
                          const isPreviewOnly = false
                          const isCreatedSkillActive = activeCreatedSkillQuestionId === question.id
                          return (
                            <article
                              key={question.id}
                              data-created-skill-question-id={question.id}
                              className={`image-activity-created-skill-card ${isCreatedSkillActive ? 'is-active' : ''} ${question.isCritical ? 'is-critical' : ''}`}
                              onClick={() => {
                                setActiveCreatedSkillQuestionId(question.id)
                              }}
                            >
                          <div className="image-activity-created-skill-head">
                            <div className="image-activity-created-skill-topline">
                              <span className="image-activity-question-number-badge">Q{index + 1}</span>
                              <div className="image-activity-created-skill-meta">
                              <DomainHeaderBadges values={question} />
                              <span className={`image-activity-generated-mark-pill ${!hasMarks ? 'is-disabled' : ''}`}>
                                  {hasMarks ? `${question.marks} mark` : 'Marks disabled'}
                                </span>
                                {question.isCritical ? (
                                  <span className="image-activity-criticality-pill">
                                    <Flag size={12} strokeWidth={2} />
                                    Criticality
                                  </span>
                                ) : null}
                                {isCreatedSkillActive && !isPreviewOnly && index > 0 ? (
                                  <button
                                    type="button"
                                    className="image-activity-asset-btn is-danger"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      deleteCreatedSkillQuestion(question.id)
                                    }}
                                    aria-label={`Delete skill question ${index + 1}`}
                                  >
                                    <Trash2 size={15} strokeWidth={2} />
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {!isCreatedSkillActive ? (
                            <p className="image-activity-created-skill-summary">{question.questionText || QUESTION_TEXT_PLACEHOLDER}</p>
                          ) : null}

                          {isCreatedSkillActive ? (
                            <div className="image-activity-created-skill-body">
                              <div className="image-activity-created-skill-editor">
                                <div className="image-activity-created-skill-editor-main">
                                  <label className="forms-field forms-field-full image-activity-created-skill-question-panel">
                                    <span>Question</span>
                                    <textarea
                                      rows={4}
                                      value={question.questionText}
                                      placeholder={QUESTION_TEXT_PLACEHOLDER}
                                      onChange={(event) => {
                                        if (isPreviewOnly) return
                                        updateCreatedSkillQuestion(question.id, 'questionText', event.target.value)
                                      }}
                                      onClick={(event) => event.stopPropagation()}
                                      readOnly={isPreviewOnly}
                                    />
                                  </label>

                                    <div className="image-activity-created-skill-value-card">
                                      <label className="forms-field forms-field-full">
                                        <div className="image-activity-created-skill-field-head">
                                          <span>Answer &amp; Explanation</span>
                                          <div className="image-activity-created-skill-field-actions">
                                            {autoGeneratingQuestionIds.includes(question.id) ? (
                                              <span className="image-activity-created-skill-field-status">
                                                <span className="image-activity-created-skill-field-spinner" />
                                                Generating
                                              </span>
                                            ) : null}
                                            {usesManualAnswerKeyGeneration ? (
                                              <button
                                                type="button"
                                                className="ghost image-activity-answer-key-btn"
                                                disabled={!question.questionText.trim() || autoGeneratingQuestionIds.includes(question.id)}
                                                onClick={(event) => {
                                                  event.stopPropagation()
                                                  if (isPreviewOnly) return
                                                  handleGenerateCreatedSkillExplanation(question.id)
                                                }}
                                              >
                                                <Sparkles size={13} strokeWidth={2.1} />
                                                Generate Answer Key
                                              </button>
                                            ) : null}
                                          </div>
                                        </div>
                                        <textarea
                                          rows={3}
                                        value={question.explanation}
                                        placeholder="Add a short explanation for the expected answer."
                                        onChange={(event) => {
                                          if (isPreviewOnly) return
                                          updateCreatedSkillQuestionExplanation(question.id, event.target.value)
                                        }}
                                        onClick={(event) => event.stopPropagation()}
                                        readOnly={isPreviewOnly}
                                      />
                                    </label>
                                  </div>
                                </div>

                                <div className="image-activity-created-skill-editor-side">
                                  <div className="image-activity-created-skill-side-card">
                                    <div className="image-activity-generated-section-label">Assessment Tags</div>

                                    <div className="image-activity-created-skill-side-top">
                                      <div className="image-activity-created-skill-side-primary">
                                        <label className="forms-field">
                                          <span>Marks</span>
                                          <input
                                            disabled={!hasMarks || isPreviewOnly}
                                            value={question.marks}
                                            onChange={(event) => {
                                              if (isPreviewOnly) return
                                              updateCreatedSkillQuestion(question.id, 'marks', event.target.value)
                                            }}
                                            onClick={(event) => event.stopPropagation()}
                                            readOnly={isPreviewOnly}
                                          />
                                        </label>

                                        <label className="forms-field image-activity-question-toggle-field">
                                          <span>Criticality</span>
                                          <button
                                            type="button"
                                            className={`image-activity-criticality-toggle ${question.isCritical ? 'is-active' : ''}`}
                                            onClick={(event) => {
                                              event.stopPropagation()
                                              if (isPreviewOnly) return
                                              updateCreatedSkillQuestion(question.id, 'isCritical', !question.isCritical)
                                            }}
                                            aria-pressed={question.isCritical}
                                            disabled={isPreviewOnly}
                                          >
                                            <span className="image-activity-criticality-toggle-track" aria-hidden="true">
                                              <span className="image-activity-criticality-toggle-thumb" />
                                            </span>
                                            <span className="image-activity-criticality-toggle-label">{question.isCritical ? 'On' : 'Off'}</span>
                                          </button>
                                        </label>
                                      </div>
                                      <div className="image-activity-created-skill-side-taxonomy">
                                        <span className="image-activity-created-skill-side-taxonomy-label">Domain Tags</span>
                                        <DomainBadgeRow
                                          className="image-activity-domain-badge-row image-activity-domain-badge-row--inline is-stacked"
                                          values={question}
                                          optionsMap={domainOptionsMap}
                                          disabled={isPreviewOnly}
                                          onChange={(field, value) => updateCreatedSkillQuestion(question.id, field, value)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="image-activity-created-skill-body">
                              <div className="image-activity-created-skill-answer">
                                <span>Answer &amp; Explanation</span>
                                <div>{question.explanation || 'Answer & Explanation will appear here.'}</div>
                              </div>
                            </div>
                          )}
                            </article>
                          )
                        })}
                      </div>
                      <div className="image-activity-builder-actions-bar">
                        <div className="image-activity-builder-actions-copy">
                          <strong>Continue building</strong>
                          <span>Add another manual question and complete the mandatory activity builder flow here.</span>
                        </div>
                        <div className="image-activity-builder-actions-main">
                          <button type="button" className="ghost" onClick={handleAddQuestion}>
                            Add Question
                          </button>
                        </div>
                      </div>
                    </>
                </section>
              ) : null}
            </>
        </section>
        ) : null}

        {activeWorkspaceTab === 'scaffolding' && generatedQuestions.length > 0 ? (
            <section ref={generatedSectionRef} className="image-activity-builder-card image-activity-builder-card--enhanced">
              <div className="image-activity-module-head">
                <div>
                  <h3>Generated Scaffolding</h3>
                  <p className="image-activity-section-copy">
                    Refine the optional scaffolding questions for this activity here.
                  </p>
                </div>
                <div className="image-activity-module-actions">
                  <div className="image-activity-module-count">
                    <span>Scaffolding</span>
                    <strong>{generatedQuestions.length}</strong>
                  </div>
                </div>
              </div>

              {isGeneratedQuestionsOpen ? (
                <div className="image-activity-question-list image-activity-generated-questions image-activity-generated-scaffolding">
                  {generatedQuestions.map((question, index) => {
                    const isCardEditing = activeEditableQuestionId === question.id
                    return (
                    <article
                      key={question.id}
                      data-generated-question-id={question.id}
                      className={`image-activity-generated-card image-activity-generated-card--scaffolding ${draggedQuestionId === question.id ? 'is-dragging' : ''} ${isCardEditing ? 'is-editing' : ''} ${question.isCritical ? 'is-critical' : ''}`}
                      draggable
                      onClick={() => setActiveEditableQuestionId(question.id)}
                      onDragStart={() => setDraggedQuestionId(question.id)}
                      onDragEnd={() => setDraggedQuestionId(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        moveGeneratedQuestion(draggedQuestionId, question.id)
                        setDraggedQuestionId(null)
                      }}
                    >
                      <div className="image-activity-generated-card-head">
                        <div className="image-activity-generated-card-topline image-activity-generated-card-topline--ospe">
                          <div className="image-activity-generated-card-copy">
                            <span className="image-activity-generated-kicker">Scaffolding {index + 1}</span>
                          </div>
                          <div className="image-activity-generated-card-meta">
                            <div className="image-activity-generated-card-actions">
                              <DomainHeaderBadges values={question} />
                              <span className="image-activity-generated-type-badge">{question.type}</span>
                              <span className={`image-activity-generated-mark-pill ${!hasMarks ? 'is-disabled' : ''}`}>
                                {hasMarks ? `${question.marks} mark` : 'Marks disabled'}
                              </span>
                              {question.isCritical ? (
                                <span className="image-activity-criticality-pill">
                                  <Flag size={12} strokeWidth={2} />
                                  Criticality
                                </span>
                              ) : null}
                              <button
                                type="button"
                                className="image-activity-asset-btn is-danger"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  deleteGeneratedQuestion(question.id)
                                }}
                                aria-label={`Delete question ${index + 1}`}
                              >
                                <Trash2 size={15} strokeWidth={2} />
                              </button>
                            </div>
                          </div>
                        </div>
                        {!isCardEditing ? (
                          <strong className="image-activity-generated-card-question">
                            {question.questionText || QUESTION_TEXT_PLACEHOLDER}
                          </strong>
                        ) : null}
                      </div>

                      <div className="image-activity-generated-body">
                        {isCardEditing ? (
                          <div className="image-activity-generated-edit-layout image-activity-generated-edit-layout--scaffolding">
                            <div className="image-activity-generated-content-panel">
                              <label className="forms-field forms-field-full image-activity-generated-question-panel">
                                <span>Question</span>
                                <textarea
                                  rows={3}
                                  value={question.questionText}
                                  placeholder={QUESTION_TEXT_PLACEHOLDER}
                                  onChange={(event) => updateGeneratedQuestion(question.id, 'questionText', event.target.value)}
                                  onClick={(event) => event.stopPropagation()}
                                />
                              </label>

                              {question.type === 'MCQ' ? (
                                <div className="image-activity-generated-content-card">
                                  <div className="image-activity-generated-section-label">Options</div>
                                  <div className="image-activity-generated-options">
                                    {question.options.map((option, optionIndex) => (
                                      <div key={`${question.id}-${option}`} className="image-activity-generated-option">
                                        <span>{String.fromCharCode(65 + optionIndex)}</span>
                                        <input
                                          value={option}
                                          onChange={(event) => {
                                            const nextOptions = [...question.options]
                                            nextOptions[optionIndex] = event.target.value
                                            updateGeneratedQuestion(question.id, 'options', nextOptions)
                                          }}
                                          onClick={(event) => event.stopPropagation()}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              <div className="image-activity-generated-content-card">
                                <div className="image-activity-generated-support-grid">
                                  <label className="forms-field">
                                    <span>Answer &amp; Explanation</span>
                                    <input
                                      value={question.answerKey}
                                      onChange={(event) => updateGeneratedQuestion(question.id, 'answerKey', event.target.value)}
                                      onClick={(event) => event.stopPropagation()}
                                      placeholder="Sample answer key"
                                    />
                                  </label>
                                  <label className="forms-field">
                                    <span>Explanation</span>
                                    <textarea
                                      rows={2}
                                      value={question.explanation}
                                      onChange={(event) => updateGeneratedQuestion(question.id, 'explanation', event.target.value)}
                                      onClick={(event) => event.stopPropagation()}
                                      placeholder="Add a short explanation for the expected answer."
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>

                            <div className="image-activity-generated-assessment-card">
                              <div className="image-activity-generated-section-label">Assessment Tags</div>
                              <div className="image-activity-generated-assessment-top">
                                <div className="image-activity-generated-assessment-primary">
                                  <label className="forms-field">
                                    <span>Marks</span>
                                    <input
                                      disabled={!hasMarks}
                                      value={question.marks}
                                      onChange={(event) => updateGeneratedQuestion(question.id, 'marks', event.target.value)}
                                      onClick={(event) => event.stopPropagation()}
                                    />
                                  </label>

                                  <label className="forms-field image-activity-question-toggle-field">
                                    <span>Criticality</span>
                                    <button
                                      type="button"
                                      className={`image-activity-criticality-toggle ${question.isCritical ? 'is-active' : ''}`}
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        updateGeneratedQuestion(question.id, 'isCritical', !question.isCritical)
                                      }}
                                      aria-pressed={question.isCritical}
                                    >
                                      <span className="image-activity-criticality-toggle-track" aria-hidden="true">
                                        <span className="image-activity-criticality-toggle-thumb" />
                                      </span>
                                      <span className="image-activity-criticality-toggle-label">{question.isCritical ? 'On' : 'Off'}</span>
                                    </button>
                                  </label>
                                </div>
                                <div className="image-activity-generated-assessment-taxonomy">
                                  <span className="image-activity-generated-assessment-taxonomy-label">Domain Tags</span>
                                  <DomainBadgeRow
                                    className="image-activity-domain-badge-row image-activity-domain-badge-row--inline is-stacked"
                                    values={question}
                                    optionsMap={domainOptionsMap}
                                    onChange={(field, value) => updateGeneratedQuestion(question.id, field, value)}
                                  />
                                </div>
                              </div>

                            </div>
                          </div>
                        ) : (
                          <div className="image-activity-generated-support-grid image-activity-generated-support-grid--summary">
                            <div className="image-activity-generated-summary-block">
                              <span>Answer &amp; Explanation</span>
                              <div>
                                {[question.answerKey, question.explanation].filter(Boolean).join(' ').trim() || 'Answer & Explanation will appear here.'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  )
                  })}
                </div>
              ) : null}

              <div className="image-activity-section-actions image-activity-section-actions--multi">
                {scaffoldingTypeOptions.map((option) => {
                  const Icon = option.value === 'MCQ'
                    ? ListTodo
                    : option.value === 'Descriptive'
                      ? FileText
                      : option.value === 'True or False'
                        ? CheckCircle2
                        : Pencil

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className="ghost image-activity-section-action-btn"
                      onClick={() => addScaffoldingQuestion(option.value)}
                    >
                      <Icon size={15} strokeWidth={2} />
                      <span>{option.value}</span>
                    </button>
                  )
                })}
              </div>
            </section>
        ) : null}

        <div ref={footerSectionRef} className="image-activity-builder-footer image-activity-builder-footer--final">
          <div className="image-activity-builder-status">
            <span
              className={`image-activity-builder-status-dot ${footerStatusTone}`}
              aria-hidden="true"
            />
            <div className="image-activity-builder-status-copy">
              <strong>{footerStatusSummary.label}</strong>
              <small>{footerStatusSummary.text}</small>
            </div>
          </div>
          <div className="image-activity-builder-footer-actions">
            <button
              type="button"
              className={`tool-btn ${isActivityCreated ? 'image-activity-review-assign-btn' : 'green'}`}
              onClick={isActivityCreated ? handleReviewAssign : handleCreateActivity}
              disabled={isActivityCreated ? false : !canCreateActivity}
            >
              {isActivityCreated ? 'Review / Assign' : 'Create Activity'}
            </button>
          </div>
        </div>
      </div>
      {isReviewAssignPopupOpen ? createPortal(
        <div className="image-activity-review-popup-backdrop" onClick={() => setIsReviewAssignPopupOpen(false)} aria-hidden="true">
          <section className="image-activity-review-popup-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="image-activity-review-popup-head">
              <div className="image-activity-review-popup-copy">
                <span className="image-activity-review-popup-kicker">Configuration &amp; Assign</span>
                <p>Set the assignment content, threshold configuration, target group, and optional schedule.</p>
              </div>
              <button
                type="button"
                className="image-activity-review-popup-close"
                onClick={() => setIsReviewAssignPopupOpen(false)}
                aria-label="Close Review and Assign"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>
            <div className="image-activity-assign-type-grid">
              <section className="image-activity-assign-panel image-activity-assign-panel--compact">
                <div className="image-activity-assign-panel-head">
                  <span className="image-activity-assign-panel-badge">Assign To Faculty :</span>
                </div>
                <div className="image-activity-assign-pill-row">
                  <span className="image-activity-assign-check is-static is-disabled">
                    <span>No faculty module</span>
                  </span>
                </div>
              </section>
              <section className="image-activity-assign-panel image-activity-assign-panel--compact">
                <div className="image-activity-assign-panel-head">
                  <span className="image-activity-assign-panel-badge">Assign To Student :</span>
                </div>
                <div className="image-activity-assign-pill-row">
                  {imageStudentAssignOptions.map((option) => (
                    <label key={option.key} className={`image-activity-assign-check ${option.available ? '' : 'is-disabled'}`.trim()}>
                      <input
                        type="checkbox"
                        checked={assignContent[option.key]}
                        disabled={!option.available}
                        onChange={(event) => setAssignContent((current) => ({ ...current, [option.key]: event.target.checked }))}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>
            {imageAssignHelperText ? <small className="image-activity-assign-helper">{imageAssignHelperText}</small> : null}
            <div className="image-activity-review-popup-foot">
              <div className="image-activity-assign-grid">
                <section className="image-activity-assign-panel image-activity-assign-panel--threshold">
                  <div className="image-activity-assign-panel-head">
                    <span className="image-activity-assign-panel-badge">Threshold Configuration *</span>
                  </div>
                  <div className="image-activity-threshold-list">
                    {assignThresholds.map((row, index) => (
                      <div key={row.id} className="image-activity-threshold-row">
                        <input
                          className="image-activity-threshold-label"
                          value={row.label}
                          onChange={(event) => updateAssignThreshold(row.id, 'label', event.target.value)}
                          placeholder="Create label"
                        />
                        <input
                          className="image-activity-threshold-from"
                          type="text"
                          inputMode="decimal"
                          value={formatThresholdPercentageInput(row.from)}
                          onChange={(event) => updateAssignThreshold(row.id, 'from', event.target.value)}
                          placeholder="From"
                        />
                        <span className="image-activity-threshold-separator" aria-hidden="true">-</span>
                        <input
                          className="image-activity-threshold-to"
                          type="text"
                          inputMode="decimal"
                          value={formatThresholdPercentageInput(row.to)}
                          onChange={(event) => updateAssignThreshold(row.id, 'to', event.target.value)}
                          placeholder="To"
                        />
                        <div className="image-activity-threshold-actions">
                          <button
                            type="button"
                            className="ghost image-activity-threshold-delete"
                            onClick={() => deleteAssignThreshold(row.id)}
                            disabled={assignThresholds.length === 1}
                            aria-label={`Delete threshold ${index + 1}`}
                          >
                            <Trash2 size={14} strokeWidth={2} />
                          </button>
                          {index === assignThresholds.length - 1 ? (
                            <button
                              type="button"
                              className="ghost image-activity-threshold-add"
                              onClick={addAssignThreshold}
                              aria-label="Add threshold"
                            >
                              <Plus size={15} strokeWidth={2.2} />
                            </button>
                          ) : <span className="image-activity-threshold-add-placeholder" aria-hidden="true" />}
                        </div>
                        {assignThresholdErrors[index] ? (
                          <small className="image-activity-assign-error">{assignThresholdErrors[index]}</small>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="image-activity-assign-panel image-activity-assign-panel--targets">
                  <div className="image-activity-assign-panel-head">
                    <span className="image-activity-assign-panel-badge">Assigning To *</span>
                  </div>
                  <div className="image-activity-assign-targets">
                    <div className="forms-select-wrap">
                      <select
                        value={assignYear}
                        onChange={(event) => {
                          setAssignYear(event.target.value)
                          setAssignSgt('')
                        }}
                      >
                        {ASSIGN_YEAR_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                      <div className="forms-select-wrap">
                        <select value={assignSgt} onChange={(event) => setAssignSgt(event.target.value)} disabled={!assignYear}>
                          {!assignYear ? <option value="">Select Year first</option> : null}
                          {assignSgtOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <label className="image-activity-assign-schedule-toggle">
                    <input
                      type="checkbox"
                      checked={isAssignScheduleEnabled}
                      onChange={(event) => {
                        const isEnabled = event.target.checked
                        setIsAssignScheduleEnabled(isEnabled)
                        if (isEnabled) {
                          setAssignSchedule((current) => ({
                            ...current,
                            date: current.date || ASSIGN_SERVER_TIME.date,
                          }))
                        }
                      }}
                    />
                    <span>If you want schedule...</span>
                  </label>
                  {isAssignScheduleEnabled ? (
                    <div className="image-activity-assign-schedule-row">
                      <input
                        type="date"
                        min={ASSIGN_SERVER_TIME.date}
                        value={assignSchedule.date}
                        onChange={(event) => setAssignSchedule((current) => ({ ...current, date: event.target.value }))}
                      />
                      <input
                        type="time"
                        value={assignSchedule.time}
                        onChange={(event) => setAssignSchedule((current) => ({ ...current, time: event.target.value }))}
                      />
                        <div className="forms-select-wrap">
                          <select
                            value={assignSchedule.meridiem}
                            onChange={(event) => setAssignSchedule((current) => ({ ...current, meridiem: event.target.value }))}
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                  ) : null}
                </section>
              </div>
              <div className="image-activity-assign-actions">
                <button type="button" className="ghost" onClick={() => setIsReviewAssignPopupOpen(false)}>
                  Close
                </button>
                <button type="button" className="tool-btn green" onClick={handleProceedAssign} disabled={!canProceedAssign}>
                  Proceed
                </button>
              </div>
            </div>
          </section>
        </div>,
        document.body,
      ) : null}
      {previewImage ? createPortal(
        <div className="image-activity-preview-modal" onClick={() => setPreviewImage(null)} aria-hidden="true">
          <div className="image-activity-preview-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="image-activity-preview-dialog-head">
              <div className="image-activity-preview-dialog-copy">
                <strong>{previewImage.title}</strong>
                <span>{activePreviewIndex + 1}/{uploadedPreviewImages.length} uploaded images</span>
              </div>
              <button
                type="button"
                className="image-activity-preview-close"
                onClick={() => setPreviewImage(null)}
                aria-label="Close preview"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>
            <div className="image-activity-preview-frame">
              {uploadedPreviewImages.length > 1 ? (
                <button
                  type="button"
                  className="image-activity-preview-nav is-prev"
                  onClick={() => handlePreviewNavigate(-1)}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} strokeWidth={2.2} />
                </button>
              ) : null}
              <img src={previewImage.url} alt={previewImage.title} />
              {uploadedPreviewImages.length > 1 ? (
                <button
                  type="button"
                  className="image-activity-preview-nav is-next"
                  onClick={() => handlePreviewNavigate(1)}
                  aria-label="Next image"
                >
                  <ChevronRight size={20} strokeWidth={2.2} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      , document.body) : null}
    </section>
  )
}
