import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Eye,
  ImagePlus,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

const cognitiveOptions = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
const affectiveOptions = ['Receiving', 'Responding', 'Valuing', 'Organization', 'Characterization']
const psychomotorOptions = ['Perception', 'Set', 'Guided Response', 'Mechanism', 'Adaptation', 'Origination']

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

const createRubricStep = (id, instruction = '') => ({
  id,
  instruction,
  cognitive: 'Apply',
  affective: 'Responding',
  psychomotor: 'Mechanism',
  saved: false,
})

const initialSteps = [
  createRubricStep('step-1', 'Place the blood pressure cuff snugly on the upper arm with the artery marker aligned correctly.'),
  createRubricStep('step-2', 'Explain the procedure to the patient before inflating the cuff.'),
]

/**
 * ImageActivityPage Implementation Contract
 * Structure:
 * - Workflow page combining activity context, image upload, preview modal, and rubric editing.
 * Dependencies:
 * - React hooks for local workflow state
 * - createPortal for image preview layering
 * - lucide-react icons for actions and status affordances
 * Props / Data:
 * - activityData may contain { activity, record } from the Configuration page
 * State:
 * - Local state owns title editing, marks/certifiable toggles, uploaded images, preview dialog, and rubric steps
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
export default function ImageActivityPage({ activityData }) {
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
  const [images, setImages] = useState(createImageState)
  const [previewImage, setPreviewImage] = useState(null)
  const [steps, setSteps] = useState(initialSteps)
  const [activeStepId, setActiveStepId] = useState(initialSteps[0].id)
  const imageUrlsRef = useRef([])

  const marksLabel = hasMarks ? 'Enabled' : 'Nil'
  const certifiableLabel = isCertifiable ? 'Yes' : 'No'

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

  const activeStep = useMemo(
    () => steps.find((step) => step.id === activeStepId) ?? steps[0] ?? null,
    [activeStepId, steps],
  )

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

  const updateStep = (id, field, value) => {
    setSteps((current) => current.map((step) => (
      step.id === id
        ? { ...step, [field]: value, saved: false }
        : step
    )))
  }

  const handleSaveStep = (id) => {
    setSteps((current) => current.map((step) => (
      step.id === id
        ? { ...step, saved: true }
        : step
    )))
  }

  const handleClearStep = (id) => {
    setSteps((current) => current.map((step) => (
      step.id === id
        ? {
            ...step,
            instruction: '',
            cognitive: 'Remember',
            affective: 'Receiving',
            psychomotor: 'Perception',
            saved: false,
          }
        : step
    )))
  }

  const handleAddQuestion = () => {
    const nextStep = createRubricStep(`step-${Date.now()}`)
    setSteps((current) => [...current, nextStep])
    setActiveStepId(nextStep.id)
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
              <span className="image-activity-kicker">Phase 1: Contextual Setup</span>
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
                <span>Year</span>
                <strong>{activityYear}</strong>
              </article>
              <article className="image-activity-meta-card">
                <span>Subject</span>
                <strong>{activitySubject}</strong>
              </article>
              <article className="image-activity-meta-card image-activity-meta-card-wide">
                <span>Competency</span>
                <strong>{activityCompetency}</strong>
              </article>
              <article className="image-activity-meta-card">
                <span>Activity Tag</span>
                <strong>{activityTag}</strong>
              </article>
              <article className="image-activity-meta-card">
                <span>Certifiable</span>
                <strong>{certifiableLabel}</strong>
              </article>
              <article className="image-activity-meta-card">
                <span>Marks</span>
                <strong>{marksLabel}</strong>
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
              <span className="image-activity-section-badge">Asset Uploading</span>
              <h2>Upload Clinical Reference Images</h2>
            </div>
            <span className="image-activity-chip">
              <ImagePlus size={14} strokeWidth={2} />
              {uploadedImageCount}/{imageSlots.length} uploaded
            </span>
          </div>

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
        </section>

        <section className="vx-card image-activity-builder-card image-activity-builder-card--enhanced">
          <div className="image-activity-section-head">
            <div>
              <span className="image-activity-kicker">Phase 2: Building the Assessment Rubric</span>
              <h2>Instruction + Taxonomy Mapping</h2>
              <p className="image-activity-section-copy">
                Use the step list to move through the procedure in order. Editing one step at a time keeps the rubric easier to review and save.
              </p>
            </div>
            <div className="image-activity-inline-actions">
              <button type="button" className="tool-btn green" onClick={handleAddQuestion}>
                <Plus size={15} strokeWidth={2.2} />
                Add Question
              </button>
            </div>
          </div>

          <div className="image-activity-builder-layout">
            <aside className="image-activity-outline">
              <div className="image-activity-outline-head">
                <strong>Procedure Steps</strong>
                <span>{steps.length} total</span>
              </div>

              <div className="image-activity-outline-list">
                {steps.map((step, index) => {
                  const isActive = step.id === activeStep?.id
                  return (
                    <button
                      key={step.id}
                      type="button"
                      className={`image-activity-outline-item ${isActive ? 'is-active' : ''}`}
                      onClick={() => setActiveStepId(step.id)}
                    >
                      <span className="image-activity-outline-number">{index + 1}</span>
                      <div className="image-activity-outline-copy">
                        <strong>{step.instruction || 'Untitled step'}</strong>
                        <small>{step.saved ? 'Saved step' : 'Draft step'}</small>
                      </div>
                      {step.saved ? <CheckCircle2 size={16} strokeWidth={2.2} /> : null}
                    </button>
                  )
                })}
              </div>
            </aside>

            {activeStep ? (
              <div className="image-activity-step-editor">
                <div className="image-activity-rubric-head image-activity-rubric-head--enhanced">
                  <div>
                    <span className="image-activity-step-label">
                      Step {steps.findIndex((step) => step.id === activeStep.id) + 1}
                    </span>
                    <strong>Observable Action</strong>
                  </div>
                  <span className={`image-activity-save-state ${activeStep.saved ? 'is-saved' : ''}`}>
                    {activeStep.saved ? 'Saved' : 'Draft'}
                  </span>
                </div>

                <label className="forms-field forms-field-full">
                  <span>Instruction Input</span>
                  <textarea
                    rows={6}
                    value={activeStep.instruction}
                    onChange={(event) => updateStep(activeStep.id, 'instruction', event.target.value)}
                    placeholder="Type the specific action the student must perform..."
                  />
                </label>

                <div className="image-activity-taxonomy-grid">
                  <label className="forms-field">
                    <span>Cognitive</span>
                    <div className="forms-select-wrap">
                      <select value={activeStep.cognitive} onChange={(event) => updateStep(activeStep.id, 'cognitive', event.target.value)}>
                        {cognitiveOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </label>

                  <label className="forms-field">
                    <span>Affective</span>
                    <div className="forms-select-wrap">
                      <select value={activeStep.affective} onChange={(event) => updateStep(activeStep.id, 'affective', event.target.value)}>
                        {affectiveOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </label>

                  <label className="forms-field">
                    <span>Psychomotor</span>
                    <div className="forms-select-wrap">
                      <select value={activeStep.psychomotor} onChange={(event) => updateStep(activeStep.id, 'psychomotor', event.target.value)}>
                        {psychomotorOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>

                <div className="image-activity-step-actions">
                  <button type="button" className="ghost" onClick={() => handleClearStep(activeStep.id)}>
                    <Trash2 size={15} strokeWidth={2} />
                    Clear
                  </button>
                  <button type="button" className="tool-btn green" onClick={() => handleSaveStep(activeStep.id)}>
                    <Save size={15} strokeWidth={2} />
                    Save Step
                  </button>
                </div>
              </div>
            ) : null}
          </div>
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
