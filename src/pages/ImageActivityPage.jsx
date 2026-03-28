import { useEffect, useMemo, useRef, useState } from 'react'
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
  ImagePlus,
  GripVertical,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Target,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

const cognitiveScaffoldingOptions = ['Not Applicable', 'Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create']
const affectiveScaffoldingOptions = ['Not Applicable', 'Receive', 'Respond', 'Value', 'Organize', 'Characterize']
const psychomotorOptions = ['Perception', 'Set', 'Guided Response', 'Mechanism', 'Adaptation', 'Origination']
const psychomotorScaffoldingOptions = ['Not Applicable', ...psychomotorOptions]
const scaffoldingTypeOptions = [
  { value: 'MCQ', label: 'MCQ', helper: 'Multi Choice Question' },
  { value: 'Descriptive', label: 'Descriptive', helper: 'Long-form response' },
  { value: 'True or False', label: 'True or False', helper: 'Binary answer format' },
  { value: 'Fill in the blanks', label: 'Fill in the blanks', helper: 'Short completion prompt' },
]
const scaffoldingTypeMeta = Object.fromEntries(
  scaffoldingTypeOptions.map((option) => [option.value, option]),
)

const imageSlots = [
  { key: 'A' },
  { key: 'B' },
]

const createImageState = () => imageSlots.map((slot) => ({
  key: slot.key,
  file: null,
  previewUrl: '',
  error: '',
}))

const createGeneratedQuestion = (type, index) => ({
  id: `${type}-${index + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type,
  questionText:
    type === 'MCQ'
      ? 'Select the most appropriate answer based on the image provided.'
      : type === 'Descriptive'
        ? 'Describe the most important clinical finding visible in the image.'
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
  marks: '1',
  answerKey:
    type === 'MCQ'
      ? 'Option A'
      : type === 'True or False'
        ? 'True'
        : 'Sample answer key',
  explanation: 'Add a short explanation for the expected answer.',
})

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
export default function ImageActivityPage({ activityData, onAlert }) {
  const activity = activityData?.activity ?? activityData ?? null
  const record = activityData?.record ?? null
  const defaultActivityName = activity?.name ?? 'Describe principles and methods of artificial respiration'
  const defaultMarksEnabled = Boolean(activity) ? activity.marks !== 'Nil' : true
  const defaultCertifiable = activity?.certifiable ?? false
  const activityTag = activity?.type ?? 'Image'
  const activityStatus = activity?.status ?? 'Draft'
  const activityYear = record?.year ?? 'Not available'
  const activitySubject = record?.subject ?? 'Not available'
  const activityCompetency = record?.competency ?? 'Not available'
  const activityTopic = record?.topic ?? ''

  const [activityName, setActivityName] = useState(defaultActivityName)
  const [isEditingName, setIsEditingName] = useState(false)
  const [hasMarks, setHasMarks] = useState(defaultMarksEnabled)
  const [isCertifiable, setIsCertifiable] = useState(defaultCertifiable)
  const [isAssetsSectionOpen, setIsAssetsSectionOpen] = useState(false)
  const [images, setImages] = useState(createImageState)
  const [previewImage, setPreviewImage] = useState(null)
  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [activeEditableQuestionId, setActiveEditableQuestionId] = useState(null)
  const [draggedQuestionId, setDraggedQuestionId] = useState(null)
  const [isScaffoldingTooltipOpen, setIsScaffoldingTooltipOpen] = useState(false)
  const [scaffoldingSelection, setScaffoldingSelection] = useState({
    MCQ: 0,
    Descriptive: 0,
    'True or False': 0,
    'Fill in the blanks': 0,
  })
  const imageUrlsRef = useRef([])
  const scaffoldingTooltipRef = useRef(null)

  const certifiableLabel = isCertifiable ? 'Yes' : 'No'
  const totalGeneratedMarks = hasMarks
    ? generatedQuestions.reduce((total, question) => total + (Number(question.marks) || 0), 0)
    : 0

  useEffect(() => {
    setActivityName(defaultActivityName)
    setHasMarks(defaultMarksEnabled)
    setIsCertifiable(defaultCertifiable)
  }, [defaultActivityName, defaultMarksEnabled, defaultCertifiable])

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
    () => images.filter((image) => image.file).length,
    [images],
  )

  const visibleImageCount = Math.min(uploadedImageCount + 1, imageSlots.length)
  const visibleImageSlots = images.slice(0, visibleImageCount)
  const uploadedPreviewImages = useMemo(
    () => images
      .filter((image) => image.file && image.previewUrl)
      .map((image) => ({
        slotKey: image.key,
        title: `Image ${image.key}`,
        url: image.previewUrl,
      })),
    [images],
  )
  const hasSelectedScaffoldingType = useMemo(
    () => Object.values(scaffoldingSelection).some((range) => range > 0),
    [scaffoldingSelection],
  )

  const handleAddQuestion = () => {
    onAlert?.({ tone: 'primary', message: 'Add Question action is ready for the next workflow step.' })
  }

  const handleGenerateScaffolding = () => {
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
    setActiveEditableQuestionId(null)
    setIsScaffoldingTooltipOpen(false)
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

  const updateGeneratedQuestion = (id, field, value) => {
    setGeneratedQuestions((current) => current.map((question) => (
      question.id === id
        ? { ...question, [field]: value }
        : question
    )))
  }

  const deleteGeneratedQuestion = (id) => {
    setGeneratedQuestions((current) => current.filter((question) => question.id !== id))
    setActiveEditableQuestionId((current) => (current === id ? null : current))
    onAlert?.({ tone: 'warning', message: 'Generated question removed.' })
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
    onAlert?.({ tone: 'secondary', message: `Image ${slotKey} uploaded successfully.` })
  }

  const handleRemoveImage = (slotKey) => {
    setImages((current) => {
      const next = current.map((image) => ({ ...image }))
      const index = next.findIndex((image) => image.key === slotKey)
      if (index === -1) return current

      const removed = next[index]
      if (removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl)
      }

      for (let imageIndex = index; imageIndex < next.length - 1; imageIndex += 1) {
        next[imageIndex].file = next[imageIndex + 1].file
        next[imageIndex].previewUrl = next[imageIndex + 1].previewUrl
      }

      next[next.length - 1].file = null
      next[next.length - 1].previewUrl = ''
      next[next.length - 1].error = ''

      if (previewImage?.slotKey === slotKey) {
        setPreviewImage(null)
      }

      return next
    })
    onAlert?.({ tone: 'danger', message: `Image ${slotKey} removed from the activity.` })
  }

  const activePreviewIndex = previewImage
    ? uploadedPreviewImages.findIndex((image) => image.slotKey === previewImage.slotKey)
    : -1

  const handlePreviewNavigate = (direction) => {
    if (activePreviewIndex === -1 || uploadedPreviewImages.length <= 1) return

    const nextIndex = (activePreviewIndex + direction + uploadedPreviewImages.length) % uploadedPreviewImages.length
    setPreviewImage(uploadedPreviewImages[nextIndex])
  }

  return (
    <section className="vx-content forms-page image-activity-page">
      <div className="image-activity-workspace image-activity-workspace--enhanced">
        <section className="image-activity-banner image-activity-banner--enhanced">
          <div className="image-activity-banner-main">
            <div className="image-activity-banner-head">
              <span className="image-activity-section-badge">Phase 1: Contextual Setup</span>
              <span className="image-activity-state-badge">{activityStatus}</span>
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
            {activityTopic ? <span className="image-activity-topic-pill">{activityTopic}</span> : null}
            <div className="image-activity-meta-strip">
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
              <article className="image-activity-meta-card">
                <div className="image-activity-meta-head">
                  <span className="image-activity-meta-icon" aria-hidden="true"><Tag size={14} strokeWidth={2} /></span>
                  <span>Activity Tag</span>
                </div>
                <strong>{activityTag}</strong>
              </article>
              <article className="image-activity-meta-card">
                <div className="image-activity-meta-head">
                  <span className="image-activity-meta-icon" aria-hidden="true"><BadgeCheck size={14} strokeWidth={2} /></span>
                  <span>Certifiable</span>
                </div>
                <strong>{certifiableLabel}</strong>
              </article>
              <article className="image-activity-meta-card">
                <div className="image-activity-meta-head">
                  <span className="image-activity-meta-icon" aria-hidden="true"><CheckCircle2 size={14} strokeWidth={2} /></span>
                  <span>Total Marks</span>
                </div>
                <strong>{hasMarks ? totalGeneratedMarks : 'Disabled'}</strong>
              </article>
            </div>

          </div>

          <div className="image-activity-config-panel image-activity-config-panel--enhanced">
            <div className="image-activity-config-head">
              <span>Activity Settings</span>
              <small>Adjust key visibility and certification options.</small>
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

        <section className="vx-card image-activity-assets-card image-activity-assets-card--enhanced">
          <div className="image-activity-section-head">
            <div>
              <span className="image-activity-section-badge">Upload Clinical Reference Images</span>
            </div>
            <div className="image-activity-section-actions">
              <span className="image-activity-chip">
                <ImagePlus size={14} strokeWidth={2} />
                {uploadedImageCount}/{imageSlots.length} uploaded
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
          </div>

          {isAssetsSectionOpen ? (
            <div className="image-activity-assets-grid">
              {visibleImageSlots.map((image, index) => {
                const slot = imageSlots[index]
                const isFilled = Boolean(image.file)

                return (
                  <article key={slot.key} className={`image-activity-asset image-activity-asset--enhanced ${isFilled ? 'is-filled' : 'is-empty'}`}>
                    <div className="image-activity-asset-top">
                      <div className="image-activity-asset-title">
                        <span>{slot.key}</span>
                        <small>{isFilled ? 'Uploaded' : 'Next slot'}</small>
                      </div>
                      {isFilled ? (
                        <div className="image-activity-asset-actions">
                          <button
                            type="button"
                            className="image-activity-asset-btn"
                            onClick={() => setPreviewImage({ slotKey: slot.key, title: `Image ${slot.key}`, url: image.previewUrl })}
                            aria-label="Preview image"
                          >
                            <Eye size={15} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            className="image-activity-asset-btn is-danger"
                            onClick={() => handleRemoveImage(slot.key)}
                            aria-label="Remove image"
                          >
                            <Trash2 size={15} strokeWidth={2} />
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {isFilled ? (
                      <div className="image-activity-upload-preview">
                        <img src={image.previewUrl} alt={`Image ${slot.key}`} />
                      </div>
                    ) : (
                      <label className="image-activity-upload-box" htmlFor={`image-upload-${slot.key}`}>
                        <Upload size={20} strokeWidth={2} />
                        <p>Upload image</p>
                        <small>JPG or PNG, recommended 700 x 700 px or above</small>
                        <span className="image-activity-upload-link">Click to browse</span>
                      </label>
                    )}
                    <input
                      id={`image-upload-${slot.key}`}
                      className="image-activity-upload-input"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(event) => handleImageUpload(slot.key, event)}
                    />
                    {image.error ? <p className="image-activity-upload-error">{image.error}</p> : null}
                  </article>
                )
              })}
            </div>
          ) : null}
        </section>

        <section className="vx-card image-activity-builder-card image-activity-builder-card--enhanced">
          <div className="image-activity-section-head">
            <div>
              <span className="image-activity-section-badge">Phase 2: Building the Assessment Rubric</span>
            </div>
            <div className="image-activity-inline-actions" ref={scaffoldingTooltipRef}>
              {generatedQuestions.length === 0 ? (
                <div className="image-activity-scaffolding-anchor">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setIsScaffoldingTooltipOpen((current) => !current)}
                    aria-expanded={isScaffoldingTooltipOpen}
                  >
                    <Sparkles size={15} strokeWidth={2.2} />
                    Generate Scaffolding
                  </button>
                  {isScaffoldingTooltipOpen ? (
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
              ) : null}
              <button type="button" className="tool-btn green" onClick={handleAddQuestion}>
                <Plus size={15} strokeWidth={2.2} />
                Add Question
              </button>
            </div>
          </div>

          {generatedQuestions.length > 0 ? (
            <div className="image-activity-question-entry image-activity-generated-questions">
              <div className="image-activity-question-head">
                <div>
                  <span className="image-activity-section-badge">Generated Scaffolding Questions</span>
                </div>
                <div className="image-activity-question-count">
                  <span className="image-activity-question-count-label">Total created</span>
                  <strong>{generatedQuestions.length}</strong>
                </div>
              </div>

              <div className="image-activity-question-list">
                {generatedQuestions.map((question, index) => {
                  const isCardEditing = activeEditableQuestionId === question.id
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
                                <span className="image-activity-generated-tag">{question.cognitive}</span>
                                <span className="image-activity-generated-tag">{question.affective}</span>
                                <span className="image-activity-generated-tag">{question.psychomotor}</span>
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
                            {question.questionText}
                          </p>
                        </div>

                      </div>

                      <div className="image-activity-generated-body">
                          {isCardEditing ? (
                            <label className="forms-field forms-field-full">
                              <span>Question Text</span>
                              <textarea
                                rows={3}
                                value={question.questionText}
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
                              {isCardEditing ? <span>Answer & Explanation</span> : null}
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
            </div>
          ) : null}

        </section>

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
