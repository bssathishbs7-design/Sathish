import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CheckCircle2,
  Eye,
  Flag,
  ImagePlus,
  GripVertical,
  Pencil,
  Sparkles,
  Tag,
  Target,
  Trash2,
  Upload,
  Plus,
  X,
} from 'lucide-react'
import '../styles/config/image-activity.css'

const cognitiveScaffoldingOptions = ['Not Applicable', 'Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create']
const affectiveScaffoldingOptions = ['Not Applicable', 'Receive', 'Respond', 'Value', 'Organize', 'Characterize']
const psychomotorOptions = ['Perception', 'Set', 'Guided Response', 'Mechanism', 'Adaptation', 'Origination']
const psychomotorScaffoldingOptions = ['Not Applicable', ...psychomotorOptions]
const QUESTION_TEXT_PLACEHOLDER = 'Enter your question here......'
const dropdownValueOptions = ['mmHg', 'bpm', 'kg / lbs', 'mg/dL / mmol/L']
const answerInputTypeOptions = ['Numeric Value', 'Text box', 'Image Upload']
const scaffoldingTypeOptions = [
  { value: 'MCQ', label: 'MCQ', helper: 'Multi Choice Question' },
  { value: 'Descriptive', label: 'Descriptive', helper: 'Long-form response' },
  { value: 'True or False', label: 'True or False', helper: 'Binary answer format' },
  { value: 'Fill in the blanks', label: 'Fill in the blanks', helper: 'Short completion prompt' },
]
const createImageSlot = (existing = {}, index = 0) => ({
  key: existing?.key ?? `image-slot-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
  file: existing?.file ?? null,
  previewUrl: existing?.previewUrl ?? '',
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
  dropdownValues: [],
  answerInputType: 'Text box',
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
  && JSON.stringify(question?.dropdownValues ?? []) === JSON.stringify(baselineQuestion?.dropdownValues ?? [])
  && question?.answerInputType === baselineQuestion?.answerInputType
  && question?.answerKey === baselineQuestion?.answerKey
  && question?.explanation === baselineQuestion?.explanation
)

const getActiveDomainBadge = (question) => {
  if (question?.cognitive && question.cognitive !== 'Not Applicable') {
    return `Cognitive: ${question.cognitive}`
  }
  if (question?.affective && question.affective !== 'Not Applicable') {
    return `Affective: ${question.affective}`
  }
  if (question?.psychomotor && question.psychomotor !== 'Not Applicable') {
    return `Psychomotor: ${question.psychomotor}`
  }
  return null
}

const getImageSlotLabel = (index) => String.fromCharCode(65 + index)

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
export default function ImageActivityPage({ activityData, onAlert, onSaveSkillActivity, workflowType = 'image' }) {
  const isInterpretationWorkflow = workflowType === 'interpretation'
  const activity = activityData?.activity ?? activityData ?? null
  const record = activityData?.record ?? null
  const savedDraft = activityData?.draft ?? null
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
  const [isAssetsSectionOpen, setIsAssetsSectionOpen] = useState(true)
  const [images, setImages] = useState(() => createImageState(savedDraft?.images ?? []))
  const [previewImage, setPreviewImage] = useState(null)
  const [createdSkillQuestions, setCreatedSkillQuestions] = useState(
    savedDraft?.createdSkillQuestions?.length
      ? savedDraft.createdSkillQuestions
      : [defaultSkillQuestion],
  )
  const [createdDropdownDrafts, setCreatedDropdownDrafts] = useState({})
  const [customDropdownOptions, setCustomDropdownOptions] = useState(savedDraft?.customDropdownOptions ?? [])
  const [activeAddValueQuestionId, setActiveAddValueQuestionId] = useState(null)
  const [newDropdownOptionDraft, setNewDropdownOptionDraft] = useState('')
  const [activeCreatedSkillQuestionId, setActiveCreatedSkillQuestionId] = useState(
    savedDraft?.createdSkillQuestions?.[0]?.id ?? defaultSkillQuestion.id,
  )
  const [generatedQuestions, setGeneratedQuestions] = useState(savedDraft?.generatedQuestions ?? [])
  const [activeEditableQuestionId, setActiveEditableQuestionId] = useState(null)
  const [draggedQuestionId, setDraggedQuestionId] = useState(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [isActivityCreated, setIsActivityCreated] = useState(Boolean(savedDraft?.isSkillActivitySaved || activity?.status === 'Created'))
  const [isScaffoldingTooltipOpen, setIsScaffoldingTooltipOpen] = useState(false)
  const [isMetaExpanded, setIsMetaExpanded] = useState(false)
  const [isCreatedQuestionsOpen, setIsCreatedQuestionsOpen] = useState(true)
  const [isGeneratedQuestionsOpen, setIsGeneratedQuestionsOpen] = useState(Boolean(savedDraft?.generatedQuestions?.length))
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(isInterpretationWorkflow ? 'manual' : 'context')
  const [scaffoldingSelection, setScaffoldingSelection] = useState({
    MCQ: 0,
    Descriptive: 0,
    'True or False': 0,
    'Fill in the blanks': 0,
  })
  const imageUrlsRef = useRef([])
  const scaffoldingTooltipRef = useRef(null)
  const addValueTooltipRef = useRef(null)
  const bannerSectionRef = useRef(null)
  const assetsSectionRef = useRef(null)
  const manualSectionRef = useRef(null)
  const generatedSectionRef = useRef(null)
  const footerSectionRef = useRef(null)

  const certifiableLabel = isCertifiable ? 'Yes' : 'No'
  const totalGeneratedMarks = hasMarks
    ? [...createdSkillQuestions, ...generatedQuestions].reduce((total, question) => total + (Number(question.marks) || 0), 0)
    : 0
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

  useEffect(() => {
    if (!previewImage) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [previewImage])

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
      if (!scaffoldingTooltipRef.current?.contains(event.target)) {
        setIsScaffoldingTooltipOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isScaffoldingTooltipOpen])

  useEffect(() => {
    if (!activeAddValueQuestionId) return undefined

    const onPointerDown = (event) => {
      if (!addValueTooltipRef.current?.contains(event.target)) {
        setActiveAddValueQuestionId(null)
        setNewDropdownOptionDraft('')
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [activeAddValueQuestionId])

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
    () => images.filter((image) => image.file || image.previewUrl).length,
    [images],
  )

  const visibleImageSlots = images
  const canAddAnotherImage = !isInterpretationWorkflow && uploadedImageCount >= 1
  const uploadedPreviewImages = useMemo(
    () => images
      .filter((image) => image.previewUrl)
      .map((image) => ({
        slotKey: image.key,
        title: `Image ${getImageSlotLabel(images.findIndex((entry) => entry.key === image.key))}`,
        url: image.previewUrl,
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
  const allDropdownValueOptions = useMemo(
    () => [...dropdownValueOptions, ...customDropdownOptions.filter((option) => !dropdownValueOptions.includes(option))],
    [customDropdownOptions],
  )
  const currentDraftSignature = useMemo(() => JSON.stringify({
    activityName,
    hasMarks,
    isCertifiable,
    customDropdownOptions,
    images: images.map((image) => ({
      key: image.key,
      previewUrl: image.previewUrl,
      error: image.error,
      hasFile: Boolean(image.file),
    })),
    createdSkillQuestions,
    generatedQuestions,
  }), [activityName, hasMarks, isCertifiable, customDropdownOptions, images, createdSkillQuestions, generatedQuestions])
  const [lastSavedSignature, setLastSavedSignature] = useState(savedDraft ? currentDraftSignature : '')
  const canCreateActivity = hasCompletedUploadStep && hasCompletedQuestionStep && !isAutoSaving
  const canReviewAssign = hasCompletedUploadStep && hasCompletedQuestionStep && isActivityCreated
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
        text: 'Activity created. Continue to Review & Assign when you are ready.',
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

  const updateCreatedSkillQuestion = (id, field, value) => {
    setCreatedSkillQuestions((current) => current.map((question) => (
      question.id === id
        ? {
          ...question,
          ...(field === 'cognitive'
            ? {
              cognitive: value,
              affective: value !== 'Not Applicable' ? 'Not Applicable' : question.affective,
              psychomotor: value !== 'Not Applicable' ? 'Not Applicable' : question.psychomotor,
            }
            : field === 'affective'
              ? {
                affective: value,
                cognitive: value !== 'Not Applicable' ? 'Not Applicable' : question.cognitive,
                psychomotor: value !== 'Not Applicable' ? 'Not Applicable' : question.psychomotor,
              }
              : field === 'psychomotor'
                ? {
                  psychomotor: value,
                  cognitive: value !== 'Not Applicable' ? 'Not Applicable' : question.cognitive,
                  affective: value !== 'Not Applicable' ? 'Not Applicable' : question.affective,
                }
                : { [field]: value }),
        }
        : question
    )))
    setIsActivityCreated(false)
  }

  const handleSaveCustomDropdownOption = () => {
    const nextValue = newDropdownOptionDraft.trim()
    if (!nextValue || !activeAddValueQuestionId) {
      onAlert?.({ tone: 'warning', message: 'Enter a value before saving.' })
      return
    }

    const alreadyExists = [...dropdownValueOptions, ...customDropdownOptions]
      .some((option) => option.toLowerCase() === nextValue.toLowerCase())

    if (alreadyExists) {
      onAlert?.({ tone: 'warning', message: 'Value already exists.' })
      return
    }

    setCustomDropdownOptions((current) => [...current, nextValue])
    setCreatedDropdownDrafts((current) => ({ ...current, [activeAddValueQuestionId]: nextValue }))
    setCreatedSkillQuestions((current) => current.map((question) => (
      question.id === activeAddValueQuestionId
        ? { ...question, dropdownValues: [...(question.dropdownValues ?? []), nextValue] }
        : question
    )))
    setNewDropdownOptionDraft('')
    setActiveAddValueQuestionId(null)
    setIsActivityCreated(false)
    onAlert?.({ tone: 'secondary', message: 'Value added.' })
  }

  const removeCreatedSkillDropdownValue = (id, valueIndex) => {
    setCreatedSkillQuestions((current) => current.map((question) => (
      question.id === id
        ? {
          ...question,
          dropdownValues: (question.dropdownValues ?? []).filter((_, index) => index !== valueIndex),
        }
        : question
    )))
    setIsActivityCreated(false)
  }

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
          ...(field === 'cognitive'
            ? {
              cognitive: value,
              affective: value !== 'Not Applicable' ? 'Not Applicable' : question.affective,
              psychomotor: value !== 'Not Applicable' ? 'Not Applicable' : question.psychomotor,
            }
            : field === 'affective'
              ? {
                affective: value,
                cognitive: value !== 'Not Applicable' ? 'Not Applicable' : question.cognitive,
                psychomotor: value !== 'Not Applicable' ? 'Not Applicable' : question.psychomotor,
              }
              : field === 'psychomotor'
                ? {
                  psychomotor: value,
                  cognitive: value !== 'Not Applicable' ? 'Not Applicable' : question.cognitive,
                  affective: value !== 'Not Applicable' ? 'Not Applicable' : question.affective,
                }
                : { [field]: value }),
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

  const persistSkillActivityDraft = useCallback(async () => {
    const savedImages = await Promise.all(
      images.map(async (image) => ({
        key: image.key,
        file: null,
        previewUrl: image.file ? await fileToDataUrl(image.file) : image.previewUrl,
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

  const handleReviewAssign = () => {
    onAlert?.({ tone: 'primary', message: 'Review/Assign flow is ready for the saved skill activity.' })
  }

  const handleCreateActivity = async () => {
    await persistSkillActivityDraft()
    setLastSavedSignature(currentDraftSignature)
    setIsActivityCreated(true)
    onAlert?.({ tone: 'secondary', message: 'Activity created successfully. You can review and assign it now.' })
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
    <section className={`vx-content forms-page image-activity-page ${isInterpretationWorkflow ? 'interpretation-activity-page' : ''}`.trim()}>
      <div className="image-activity-workspace image-activity-workspace--enhanced">
        <section ref={bannerSectionRef} className="image-activity-banner image-activity-banner--enhanced">
          <div className="image-activity-banner-main">
            <div className="image-activity-banner-head">
              <span className="image-activity-section-badge">Phase 1: Contextual Setup</span>
              <div className="image-activity-banner-actions">
                <span className="image-activity-state-badge">{activityStatus}</span>
                <button
                  type="button"
                  className="image-activity-meta-toggle"
                  onClick={() => setIsMetaExpanded((current) => !current)}
                  aria-expanded={isMetaExpanded}
                >
                  {isMetaExpanded ? 'Less details' : 'More details'}
                  {isMetaExpanded ? <ChevronUp size={15} strokeWidth={2.2} /> : <ChevronDown size={15} strokeWidth={2.2} />}
                </button>
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
              {isMetaExpanded ? (
                <>
                  <article className="image-activity-meta-card">
                    <div className="image-activity-meta-head">
                      <span className="image-activity-meta-icon" aria-hidden="true"><CalendarDays size={14} strokeWidth={2} /></span>
                      <span>Year</span>
                    </div>
                    <strong>{activityYear}</strong>
                  </article>
                  <article className="image-activity-meta-card">
                    <div className="image-activity-meta-head">
                      <span className="image-activity-meta-icon" aria-hidden="true"><BookOpen size={14} strokeWidth={2} /></span>
                      <span>Subject</span>
                    </div>
                    <strong>{activitySubject}</strong>
                  </article>
                  <article className="image-activity-meta-card image-activity-meta-card-wide">
                    <div className="image-activity-meta-head">
                      <span className="image-activity-meta-icon" aria-hidden="true"><Target size={14} strokeWidth={2} /></span>
                      <span>Competency</span>
                    </div>
                    <strong>{activityCompetency}</strong>
                  </article>
                </>
              ) : null}
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

        <section ref={assetsSectionRef} className="vx-card image-activity-assets-card image-activity-assets-card--enhanced">
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
                <button
                  type="button"
                  className="image-activity-section-toggle"
                  onClick={() => setIsAssetsSectionOpen((current) => !current)}
                  aria-expanded={isAssetsSectionOpen}
                  aria-label={isAssetsSectionOpen ? 'Collapse asset uploading section' : 'Expand asset uploading section'}
                >
                  {isAssetsSectionOpen ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
                </button>
              </div>
            ) : null}
          </div>

          {isAssetsSectionOpen ? (
            <>
              {!isInterpretationWorkflow ? (
                <>
                  <div className="image-activity-upload-row">
                    <div className="image-activity-assets-grid">
                      {visibleImageSlots.map((image, index) => {
                        const isFilled = Boolean(image.file || image.previewUrl)
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
                                    onClick={() => setPreviewImage({ slotKey: image.key, title: `Image ${slotLabel}`, url: image.previewUrl })}
                                    aria-label="Preview image"
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
                            {isFilled ? (
                              <div className="image-activity-upload-preview">
                                <img src={image.previewUrl} alt={`Image ${slotLabel}`} />
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
                    </div>
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
                      <button
                        type="button"
                        className="image-activity-section-toggle"
                        onClick={() => setIsCreatedQuestionsOpen((current) => !current)}
                        aria-expanded={isCreatedQuestionsOpen}
                        aria-label={isCreatedQuestionsOpen ? 'Collapse manual question section' : 'Expand manual question section'}
                      >
                        {isCreatedQuestionsOpen ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
                      </button>
                    </div>
                  </div>

                  {isCreatedQuestionsOpen ? (
                    <>
                      <div className="image-activity-created-skill-list">
                        {createdSkillQuestions.map((question, index) => {
                          const isPreviewOnly = false
                          const isCreatedSkillActive = activeCreatedSkillQuestionId === question.id
                          const activeDomainBadge = getActiveDomainBadge(question)
                          return (
                            <article
                              key={question.id}
                              data-created-skill-question-id={question.id}
                              className={`image-activity-created-skill-card ${isCreatedSkillActive ? 'is-active' : ''}`}
                              onClick={() => {
                                setActiveCreatedSkillQuestionId(question.id)
                              }}
                            >
                          <div className="image-activity-created-skill-head">
                            <div className="image-activity-created-skill-title">
                              <span className="image-activity-generated-drag-handle" aria-hidden="true">
                                <GripVertical size={16} strokeWidth={2} />
                              </span>
                              <span className="image-activity-question-number-badge">Q{index + 1}</span>
                            </div>
                            <div className="image-activity-created-skill-meta">
                              {question.isCritical ? (
                                <span className="image-activity-criticality-pill">
                                  <Flag size={12} strokeWidth={2} />
                                  Criticality
                                </span>
                              ) : null}
                              {activeDomainBadge ? (
                                <span className="image-activity-generated-tag">{activeDomainBadge}</span>
                              ) : null}
                              <span className={`image-activity-generated-mark-pill ${!hasMarks ? 'is-disabled' : ''}`}>
                                {hasMarks ? `${question.marks} mark` : 'Marks disabled'}
                              </span>
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

                          <p className="image-activity-created-skill-summary">{question.questionText || QUESTION_TEXT_PLACEHOLDER}</p>

                          {isCreatedSkillActive ? (
                            <div className="image-activity-created-skill-body">
                              <div className="image-activity-created-skill-editor">
                                <div className="image-activity-created-skill-editor-main">
                                  <label className="forms-field forms-field-full">
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
                                    <div className="image-activity-answer-type-row">
                                      <label className="forms-field image-activity-answer-type-select-field">
                                        <span>Select Value</span>
                                        <div className="image-activity-dropdown-builder">
                                          <div className="forms-select-wrap">
                                            <select
                                              value={createdDropdownDrafts[question.id] ?? ''}
                                              onChange={(event) => {
                                                if (isPreviewOnly) return
                                                setCreatedDropdownDrafts((current) => ({
                                                  ...current,
                                                  [question.id]: event.target.value,
                                                }))
                                              }}
                                              onClick={(event) => event.stopPropagation()}
                                              disabled={isPreviewOnly}
                                            >
                                              <option value="">Select value</option>
                                              {allDropdownValueOptions.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <button
                                            type="button"
                                            className="ghost image-activity-dropdown-add-button"
                                            onClick={(event) => {
                                              event.stopPropagation()
                                              if (isPreviewOnly) return
                                              setActiveAddValueQuestionId((current) => (current === question.id ? null : question.id))
                                              setNewDropdownOptionDraft('')
                                            }}
                                            disabled={isPreviewOnly}
                                            aria-label="Add answer type value"
                                            aria-expanded={activeAddValueQuestionId === question.id}
                                          >
                                            <Plus size={16} strokeWidth={2.2} />
                                          </button>
                                          {activeAddValueQuestionId === question.id ? (
                                            <div
                                              ref={addValueTooltipRef}
                                              className="image-activity-add-value-tooltip"
                                              onClick={(event) => event.stopPropagation()}
                                            >
                                              <div className="image-activity-add-value-tooltip-copy">
                                                <strong>Add Value</strong>
                                                <p>Create a new selectable value for this question.</p>
                                              </div>
                                              <label className="forms-field forms-field-full">
                                                <span>Add Field</span>
                                                <input
                                                  type="text"
                                                  value={newDropdownOptionDraft}
                                                  placeholder="Add Value"
                                                  onChange={(event) => setNewDropdownOptionDraft(event.target.value)}
                                                />
                                              </label>
                                              <div className="image-activity-add-value-tooltip-actions">
                                                <button
                                                  type="button"
                                                  className="ghost"
                                                  onClick={() => setNewDropdownOptionDraft('')}
                                                >
                                                  Clear
                                                </button>
                                                <button
                                                  type="button"
                                                  className="tool-btn green"
                                                  onClick={handleSaveCustomDropdownOption}
                                                >
                                                  Save
                                                </button>
                                              </div>
                                            </div>
                                          ) : null}
                                        </div>
                                      </label>
                                      <label className="forms-field image-activity-answer-type-kind-field">
                                        <span>Input Type</span>
                                        <div className="forms-select-wrap">
                                          <select
                                            value={question.answerInputType ?? 'Text box'}
                                            onChange={(event) => {
                                              if (isPreviewOnly) return
                                              updateCreatedSkillQuestion(question.id, 'answerInputType', event.target.value)
                                            }}
                                            onClick={(event) => event.stopPropagation()}
                                            disabled={isPreviewOnly}
                                          >
                                            {answerInputTypeOptions.map((option) => (
                                              <option key={option} value={option}>{option}</option>
                                            ))}
                                          </select>
                                        </div>
                                      </label>
                                    </div>
                                    {question.dropdownValues?.length ? (
                                      <div className="image-activity-dropdown-values">
                                        {question.dropdownValues.map((value, valueIndex) => (
                                          <span
                                            key={`${question.id}-dropdown-${valueIndex}-${value}`}
                                            className="image-activity-dropdown-pill"
                                          >
                                            <span>{value}</span>
                                            {!isPreviewOnly ? (
                                              <button
                                                type="button"
                                                onClick={(event) => {
                                                  event.stopPropagation()
                                                  removeCreatedSkillDropdownValue(question.id, valueIndex)
                                                }}
                                                aria-label={`Remove ${value}`}
                                              >
                                                <X size={12} strokeWidth={2} />
                                              </button>
                                            ) : null}
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}
                                    <label className="forms-field forms-field-full">
                                      <span>Answer &amp; Explanation</span>
                                      <input
                                        value={question.answerKey}
                                        onChange={(event) => {
                                          if (isPreviewOnly) return
                                          updateCreatedSkillQuestion(question.id, 'answerKey', event.target.value)
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

                                    <label className="forms-field">
                                      <span>Cognitive</span>
                                      <div className="forms-select-wrap">
                                        <select
                                          value={question.cognitive}
                                          onChange={(event) => {
                                            if (isPreviewOnly) return
                                            updateCreatedSkillQuestion(question.id, 'cognitive', event.target.value)
                                          }}
                                          onClick={(event) => event.stopPropagation()}
                                          disabled={isPreviewOnly}
                                        >
                                          {cognitiveScaffoldingOptions.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </label>

                                    <label className="forms-field">
                                      <span>Affective</span>
                                      <div className="forms-select-wrap">
                                        <select
                                          value={question.affective}
                                          onChange={(event) => {
                                            if (isPreviewOnly) return
                                            updateCreatedSkillQuestion(question.id, 'affective', event.target.value)
                                          }}
                                          onClick={(event) => event.stopPropagation()}
                                          disabled={isPreviewOnly}
                                        >
                                          {affectiveScaffoldingOptions.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </label>

                                    <label className="forms-field">
                                      <span>Psychomotor</span>
                                      <div className="forms-select-wrap">
                                        <select
                                          value={question.psychomotor}
                                          onChange={(event) => {
                                            if (isPreviewOnly) return
                                            updateCreatedSkillQuestion(question.id, 'psychomotor', event.target.value)
                                          }}
                                          onClick={(event) => event.stopPropagation()}
                                          disabled={isPreviewOnly}
                                        >
                                          {psychomotorScaffoldingOptions.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="image-activity-created-skill-body">
                              <div className="image-activity-created-skill-answer">
                                {question.answerKey}
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
                          <span>Add another manual question or generate guided supporting questions from the one you already wrote.</span>
                        </div>
                        <div className="image-activity-builder-actions-main">
                          <button type="button" className="ghost" onClick={handleAddQuestion}>
                            Add Question
                          </button>
                          <div className="image-activity-scaffolding-anchor" ref={scaffoldingTooltipRef}>
                            <div className="image-activity-scaffolding-trigger">
                          <button
                            type="button"
                            className="ghost image-activity-scaffolding-button"
                            onClick={() => setIsScaffoldingTooltipOpen((current) => !current)}
                            aria-expanded={isScaffoldingTooltipOpen}
                            disabled={!canUseScaffolding}
                            title={hasGeneratedScaffolding ? 'Scaffolding already created' : 'Generate scaffolding'}
                          >
                            <Sparkles size={15} strokeWidth={2.2} />
                            <span>Generate Scaffolding</span>
                          </button>
                            </div>
                            {isScaffoldingTooltipOpen && canUseScaffolding ? (
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
                                          <label className="forms-field image-activity-scaffolding-range">
                                            <span>Count</span>
                                            <input
                                              type="number"
                                              min="1"
                                              max="5"
                                              value={scaffoldingSelection[option.value]}
                                                onChange={(event) => handleScaffoldingRangeChange(option.value, event.target.value)}
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
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}
                </section>
              ) : null}
            </>
          ) : null}
        </section>

        {generatedQuestions.length > 0 ? (
          <section ref={generatedSectionRef} className="vx-card image-activity-builder-card image-activity-builder-card--enhanced">
            <div className="image-activity-question-entry image-activity-generated-questions">
              <div className="image-activity-question-head">
                <div className="image-activity-question-head-copy">
                  <span className="image-activity-step-kicker">Step 3 Optional</span>
                  <h2>Generated Questions</h2>
                  <p className="image-activity-section-copy">
                    Generate supporting questions only if you need extra guided practice from the main manual question.
                  </p>
                </div>
                <div className="image-activity-question-head-actions">
                  <div className="image-activity-question-count">
                    <span className="image-activity-question-count-label">Created</span>
                    <strong>{generatedQuestions.length}</strong>
                  </div>
                  <button
                    type="button"
                    className="image-activity-section-toggle"
                    onClick={() => setIsGeneratedQuestionsOpen((current) => !current)}
                    aria-expanded={isGeneratedQuestionsOpen}
                    aria-label={isGeneratedQuestionsOpen ? 'Collapse generated question list' : 'Expand generated question list'}
                  >
                    {isGeneratedQuestionsOpen ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
                  </button>
                </div>
              </div>

              {isGeneratedQuestionsOpen ? (
                <div className="image-activity-question-list">
                  {generatedQuestions.map((question, index) => {
                    const isCardEditing = activeEditableQuestionId === question.id
                    const activeDomainBadge = getActiveDomainBadge(question)
                    return (
                    <article
                      key={question.id}
                      data-generated-question-id={question.id}
                      className={`image-activity-generated-card ${draggedQuestionId === question.id ? 'is-dragging' : ''} ${isCardEditing ? 'is-editing' : ''}`}
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
                        <div className="image-activity-generated-card-copy">
                          <div className="image-activity-generated-card-title-row">
                            <div className="image-activity-generated-title-group">
                              <button
                                type="button"
                                className="image-activity-generated-drag-handle"
                                aria-label="Drag question to reorder"
                              >
                                <GripVertical size={16} strokeWidth={2} />
                              </button>
                              <strong>Question {index + 1}</strong>
                            </div>
                            <div className="image-activity-generated-card-meta">
                              <div className="image-activity-generated-tags">
                                {question.isCritical ? (
                                  <span className="image-activity-criticality-pill">
                                    <Flag size={12} strokeWidth={2} />
                                    Criticality
                                  </span>
                                ) : null}
                                {activeDomainBadge ? (
                                  <span className="image-activity-generated-tag">{activeDomainBadge}</span>
                                ) : null}
                              </div>
                              <div className="image-activity-generated-card-actions">
                                <span className={`image-activity-generated-mark-pill ${!hasMarks ? 'is-disabled' : ''}`}>
                                  {hasMarks ? `${question.marks} mark` : 'Marks disabled'}
                                </span>
                                <span className="image-activity-generated-type-badge">{question.type}</span>
                                {isCardEditing ? (
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
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <p className="image-activity-generated-summary-text">
                            {question.questionText || QUESTION_TEXT_PLACEHOLDER}
                          </p>
                        </div>
                      </div>

                      <div className="image-activity-generated-body">
                        {isCardEditing ? (
                          <label className="forms-field forms-field-full">
                            <textarea
                              rows={3}
                              value={question.questionText}
                              placeholder={QUESTION_TEXT_PLACEHOLDER}
                              onChange={(event) => updateGeneratedQuestion(question.id, 'questionText', event.target.value)}
                              onClick={(event) => event.stopPropagation()}
                            />
                          </label>
                        ) : null}

                        {question.type === 'MCQ' ? (
                          <>
                            {isCardEditing ? (
                              <div className="image-activity-generated-section-label">Options</div>
                            ) : null}
                            <div className="image-activity-generated-options">
                              {question.options.map((option, optionIndex) => (
                                <div key={`${question.id}-${option}`} className="image-activity-generated-option">
                                  <span>{String.fromCharCode(65 + optionIndex)}</span>
                                  {isCardEditing ? (
                                    <input
                                      value={option}
                                      onChange={(event) => {
                                        const nextOptions = [...question.options]
                                        nextOptions[optionIndex] = event.target.value
                                        updateGeneratedQuestion(question.id, 'options', nextOptions)
                                      }}
                                      onClick={(event) => event.stopPropagation()}
                                    />
                                  ) : (
                                    <strong>{option}</strong>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        ) : null}

                        {isCardEditing ? (
                          <>
                            <div className="image-activity-generated-section-label">Assessment Tags</div>
                            <div className="image-activity-generated-meta-grid">
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

                              <label className="forms-field">
                                <span>Marks</span>
                                <input
                                  disabled={!hasMarks}
                                  value={question.marks}
                                  onChange={(event) => updateGeneratedQuestion(question.id, 'marks', event.target.value)}
                                  onClick={(event) => event.stopPropagation()}
                                />
                              </label>

                              <label className="forms-field">
                                <span>Cognitive</span>
                                <div className="forms-select-wrap">
                                  <select value={question.cognitive} onChange={(event) => updateGeneratedQuestion(question.id, 'cognitive', event.target.value)} onClick={(event) => event.stopPropagation()}>
                                    {cognitiveScaffoldingOptions.map((option) => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                </div>
                              </label>

                              <label className="forms-field">
                                <span>Affective</span>
                                <div className="forms-select-wrap">
                                  <select value={question.affective} onChange={(event) => updateGeneratedQuestion(question.id, 'affective', event.target.value)} onClick={(event) => event.stopPropagation()}>
                                    {affectiveScaffoldingOptions.map((option) => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                </div>
                              </label>

                              <label className="forms-field">
                                <span>Psychomotor</span>
                                <div className="forms-select-wrap">
                                  <select value={question.psychomotor} onChange={(event) => updateGeneratedQuestion(question.id, 'psychomotor', event.target.value)} onClick={(event) => event.stopPropagation()}>
                                    {psychomotorScaffoldingOptions.map((option) => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                </div>
                              </label>
                            </div>
                          </>
                        ) : null}

                        <div className="image-activity-generated-support-grid">
                          <label className="forms-field">
                            {isCardEditing ? <span>Answer &amp; Explanation</span> : null}
                            {isCardEditing ? (
                              <input
                                value={question.answerKey}
                                onChange={(event) => updateGeneratedQuestion(question.id, 'answerKey', event.target.value)}
                                onClick={(event) => event.stopPropagation()}
                              />
                            ) : (
                              <div className="image-activity-generated-readonly">{question.answerKey}</div>
                            )}
                          </label>
                        </div>
                      </div>
                    </article>
                  )
                  })}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <div ref={footerSectionRef} className="vx-card image-activity-builder-footer image-activity-builder-footer--final">
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
            {isActivityCreated ? (
              <button
                type="button"
                className="tool-btn image-activity-review-assign-btn"
                onClick={handleReviewAssign}
                disabled={!canReviewAssign}
              >
                Review &amp; Assign
              </button>
            ) : (
              <button
                type="button"
                className="tool-btn green"
                onClick={handleCreateActivity}
                disabled={!canCreateActivity}
              >
                Create Activity
              </button>
            )}
          </div>
        </div>

      </div>
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
