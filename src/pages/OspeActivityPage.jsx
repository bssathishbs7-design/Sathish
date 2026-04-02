import { useEffect, useMemo, useState } from 'react'
import {
  BookCheck,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  CalendarDays,
  FileText,
  ListChecks,
  Pencil,
  Plus,
  Sparkles,
  Stethoscope,
  Tag,
  Trash2,
  Target,
} from 'lucide-react'
import '../styles/ospe-activity.css'

const cognitiveOptions = ['Not Applicable', 'Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create']
const affectiveOptions = ['Not Applicable', 'Receive', 'Respond', 'Value', 'Organize', 'Characterize']
const psychomotorOptions = ['Not Applicable', 'Perception', 'Set', 'Guided Response', 'Mechanism', 'Adaptation', 'Origination']
const formAnswerTypeOptions = ['Text box', 'Numeric Value', 'Image Upload']
const scaffoldQuickTypes = ['MCQ', 'Descriptive', 'True / False', 'Fill in the blanks']

const createChecklistItem = (index) => ({
  id: `checklist-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
  text: '',
  marks: '1',
  cognitive: 'Not Applicable',
  affective: 'Not Applicable',
  psychomotor: 'Not Applicable',
  isCritical: false,
})

const createFormItem = (index) => ({
  id: `form-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
  questionText: '',
  answerType: 'Text box',
  answerKey: '',
  marks: '1',
  cognitive: 'Not Applicable',
  affective: 'Not Applicable',
  psychomotor: 'Not Applicable',
  isCritical: false,
})

const createScaffoldItem = (type, index) => ({
  id: `scaffold-${type}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
  type,
  questionText: '',
  options: type === 'MCQ' ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
  answerKey: '',
  explanation: '',
  marks: '1',
  cognitive: 'Not Applicable',
  affective: 'Not Applicable',
  psychomotor: 'Not Applicable',
  isCritical: false,
})

const buildGeneratedModules = (generatedModes = []) => ({
  checklist: generatedModes.length === 0 || generatedModes.includes('Checklist'),
  form: generatedModes.includes('Form'),
  scaffolding: generatedModes.includes('Scaffolding'),
})

const getCompactTaxonomy = (item) => {
  if (item.cognitive && item.cognitive !== 'Not Applicable') return item.cognitive
  if (item.affective && item.affective !== 'Not Applicable') return item.affective
  if (item.psychomotor && item.psychomotor !== 'Not Applicable') return item.psychomotor
  return 'Tags pending'
}

const getScaffoldTypeTone = (type) => {
  if (type === 'MCQ') return 'info'
  if (type === 'True / False') return 'warning'
  if (type === 'Fill in the blanks') return 'success'
  return 'default'
}

function MetaPill({ children, tone = 'default' }) {
  return <span className={`ospe-meta-pill is-${tone}`}>{children}</span>
}

function InlineToggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className={`ospe-inline-toggle ${checked ? 'is-active' : ''}`}
      onClick={(event) => {
        event.stopPropagation()
        onChange()
      }}
      aria-pressed={checked}
    >
      <span className="ospe-inline-toggle-track" aria-hidden="true">
        <span className="ospe-inline-toggle-thumb" />
      </span>
      <span>{label}</span>
    </button>
  )
}

function ChecklistCard({ item, index, isEditing, onActivate, onUpdate, onDelete }) {
  return (
    <article
      className={`vx-card ospe-builder-card ${isEditing ? 'is-editing' : ''}`}
      data-editor-id={item.id}
      onClick={() => onActivate(item.id)}
    >
      <div className="ospe-builder-card-head">
        <div className="ospe-builder-card-copy">
          <span className="ospe-builder-card-kicker">Checklist {index + 1}</span>
          <strong>{item.text.trim() || 'Click to write the checklist item.'}</strong>
        </div>
        <div className="ospe-builder-card-meta">
          <MetaPill tone="default">{item.marks} mark</MetaPill>
          <MetaPill tone="info">{getCompactTaxonomy(item)}</MetaPill>
          {item.isCritical ? <MetaPill tone="warning">Criticality</MetaPill> : null}
          <button
            type="button"
            className="ospe-icon-btn is-danger"
            onClick={(event) => {
              event.stopPropagation()
              onDelete(item.id)
            }}
            aria-label={`Delete checklist ${index + 1}`}
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="ospe-builder-card-body" onClick={(event) => event.stopPropagation()}>
          <label className="forms-field forms-field-full">
            <span>Checklist Item</span>
            <textarea
              rows={3}
              value={item.text}
              onChange={(event) => onUpdate(item.id, 'text', event.target.value)}
              placeholder="Write the checklist statement"
            />
          </label>
          <div className="ospe-builder-grid">
            <label className="forms-field">
              <span>Marks</span>
              <input value={item.marks} onChange={(event) => onUpdate(item.id, 'marks', event.target.value)} />
            </label>
            <label className="forms-field">
              <span>Cognitive</span>
              <div className="forms-select-wrap">
                <select value={item.cognitive} onChange={(event) => onUpdate(item.id, 'cognitive', event.target.value)}>
                  {cognitiveOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </label>
            <label className="forms-field">
              <span>Affective</span>
              <div className="forms-select-wrap">
                <select value={item.affective} onChange={(event) => onUpdate(item.id, 'affective', event.target.value)}>
                  {affectiveOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </label>
            <label className="forms-field">
              <span>Psychomotor</span>
              <div className="forms-select-wrap">
                <select value={item.psychomotor} onChange={(event) => onUpdate(item.id, 'psychomotor', event.target.value)}>
                  {psychomotorOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </label>
          </div>
          <InlineToggle checked={item.isCritical} onChange={() => onUpdate(item.id, 'isCritical', !item.isCritical)} label={item.isCritical ? 'Criticality on' : 'Criticality off'} />
        </div>
      ) : null}
    </article>
  )
}

function FormCard({ item, index, isEditing, onActivate, onUpdate, onDelete }) {
  return (
    <article
      className={`vx-card ospe-builder-card ${isEditing ? 'is-editing' : ''}`}
      data-editor-id={item.id}
      onClick={() => onActivate(item.id)}
    >
      <div className="ospe-builder-card-head">
        <div className="ospe-builder-card-copy">
          <span className="ospe-builder-card-kicker">Form Question {index + 1}</span>
          <strong>{item.questionText.trim() || 'Click to write the main question.'}</strong>
        </div>
        <div className="ospe-builder-card-meta">
          <MetaPill tone="default">{item.answerType}</MetaPill>
          <MetaPill tone="default">{item.marks} mark</MetaPill>
          {item.isCritical ? <MetaPill tone="warning">Criticality</MetaPill> : null}
          <button
            type="button"
            className="ospe-icon-btn is-danger"
            onClick={(event) => {
              event.stopPropagation()
              onDelete(item.id)
            }}
            aria-label={`Delete form question ${index + 1}`}
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="ospe-builder-card-body" onClick={(event) => event.stopPropagation()}>
          <label className="forms-field forms-field-full">
            <span>Question</span>
            <textarea
              rows={3}
              value={item.questionText}
              onChange={(event) => onUpdate(item.id, 'questionText', event.target.value)}
              placeholder="Write the form question"
            />
          </label>
          <div className="ospe-builder-grid">
            <label className="forms-field">
              <span>Answer Type</span>
              <div className="forms-select-wrap">
                <select value={item.answerType} onChange={(event) => onUpdate(item.id, 'answerType', event.target.value)}>
                  {formAnswerTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </label>
            <label className="forms-field">
              <span>Marks</span>
              <input value={item.marks} onChange={(event) => onUpdate(item.id, 'marks', event.target.value)} />
            </label>
            <label className="forms-field forms-field-full">
              <span>Answer Key</span>
              <input value={item.answerKey} onChange={(event) => onUpdate(item.id, 'answerKey', event.target.value)} placeholder="Expected answer" />
            </label>
            <label className="forms-field">
              <span>Cognitive</span>
              <div className="forms-select-wrap">
                <select value={item.cognitive} onChange={(event) => onUpdate(item.id, 'cognitive', event.target.value)}>
                  {cognitiveOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </label>
            <label className="forms-field">
              <span>Affective</span>
              <div className="forms-select-wrap">
                <select value={item.affective} onChange={(event) => onUpdate(item.id, 'affective', event.target.value)}>
                  {affectiveOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </label>
            <label className="forms-field">
              <span>Psychomotor</span>
              <div className="forms-select-wrap">
                <select value={item.psychomotor} onChange={(event) => onUpdate(item.id, 'psychomotor', event.target.value)}>
                  {psychomotorOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </label>
          </div>
          <InlineToggle checked={item.isCritical} onChange={() => onUpdate(item.id, 'isCritical', !item.isCritical)} label={item.isCritical ? 'Criticality on' : 'Criticality off'} />
        </div>
      ) : null}
    </article>
  )
}

function ScaffoldingCard({ item, index, isEditing, onActivate, onUpdate, onDelete }) {
  return (
    <article
      className={`vx-card ospe-builder-card ${isEditing ? 'is-editing' : ''}`}
      data-editor-id={item.id}
      onClick={() => onActivate(item.id)}
    >
      <div className="ospe-builder-card-head">
        <div className="ospe-builder-card-copy">
          <span className="ospe-builder-card-kicker">Scaffolding {index + 1}</span>
          <strong>{item.questionText.trim() || 'Click to write the scaffolding prompt.'}</strong>
        </div>
        <div className="ospe-builder-card-meta">
          <MetaPill tone={getScaffoldTypeTone(item.type)}>{item.type}</MetaPill>
          <MetaPill tone="default">{item.marks} mark</MetaPill>
          {item.isCritical ? <MetaPill tone="warning">Criticality</MetaPill> : null}
          <button
            type="button"
            className="ospe-icon-btn is-danger"
            onClick={(event) => {
              event.stopPropagation()
              onDelete(item.id)
            }}
            aria-label={`Delete scaffolding ${index + 1}`}
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="ospe-builder-card-body" onClick={(event) => event.stopPropagation()}>
          <label className="forms-field forms-field-full">
            <span>Prompt</span>
            <textarea
              rows={3}
              value={item.questionText}
              onChange={(event) => onUpdate(item.id, 'questionText', event.target.value)}
              placeholder="Write the scaffolding question"
            />
          </label>
          {item.type === 'MCQ' ? (
            <div className="ospe-mcq-editor">
              {item.options.map((option, optionIndex) => (
                <label key={`${item.id}-${optionIndex}`} className="forms-field">
                  <span>Option {String.fromCharCode(65 + optionIndex)}</span>
                  <input
                    value={option}
                    onChange={(event) => {
                      const nextOptions = [...item.options]
                      nextOptions[optionIndex] = event.target.value
                      onUpdate(item.id, 'options', nextOptions)
                    }}
                  />
                </label>
              ))}
            </div>
          ) : null}
          <div className="ospe-builder-grid">
            <label className="forms-field">
              <span>Marks</span>
              <input value={item.marks} onChange={(event) => onUpdate(item.id, 'marks', event.target.value)} />
            </label>
            <label className="forms-field forms-field-full">
              <span>Answer Key</span>
              <input value={item.answerKey} onChange={(event) => onUpdate(item.id, 'answerKey', event.target.value)} placeholder="Expected answer" />
            </label>
            <label className="forms-field forms-field-full">
              <span>Explanation</span>
              <textarea rows={2} value={item.explanation} onChange={(event) => onUpdate(item.id, 'explanation', event.target.value)} placeholder="Short explanation" />
            </label>
            <label className="forms-field">
              <span>Cognitive</span>
              <div className="forms-select-wrap">
                <select value={item.cognitive} onChange={(event) => onUpdate(item.id, 'cognitive', event.target.value)}>
                  {cognitiveOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </label>
            <label className="forms-field">
              <span>Affective</span>
              <div className="forms-select-wrap">
                <select value={item.affective} onChange={(event) => onUpdate(item.id, 'affective', event.target.value)}>
                  {affectiveOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </label>
            <label className="forms-field">
              <span>Psychomotor</span>
              <div className="forms-select-wrap">
                <select value={item.psychomotor} onChange={(event) => onUpdate(item.id, 'psychomotor', event.target.value)}>
                  {psychomotorOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </label>
          </div>
          <InlineToggle checked={item.isCritical} onChange={() => onUpdate(item.id, 'isCritical', !item.isCritical)} label={item.isCritical ? 'Criticality on' : 'Criticality off'} />
        </div>
      ) : null}
    </article>
  )
}

function OspeActivityPage({ activityData, onAlert }) {
  const activity = activityData?.activity ?? activityData ?? null
  const record = activityData?.record ?? null
  const generatedModes = activityData?.generatedModes ?? ['Checklist']
  const generatedModules = useMemo(() => buildGeneratedModules(generatedModes), [generatedModes])
  const starterChecklistItems = useMemo(() => [createChecklistItem(0)], [])
  const starterFormItems = useMemo(() => (generatedModules.form ? [createFormItem(0)] : []), [generatedModules.form])
  const starterScaffoldItems = useMemo(() => (generatedModules.scaffolding ? [createScaffoldItem('Descriptive', 0)] : []), [generatedModules.scaffolding])

  const [checklistItems, setChecklistItems] = useState(starterChecklistItems)
  const [formItems, setFormItems] = useState(starterFormItems)
  const [scaffoldItems, setScaffoldItems] = useState(starterScaffoldItems)
  const [activeEditorId, setActiveEditorId] = useState(() => starterChecklistItems[0]?.id ?? starterFormItems[0]?.id ?? starterScaffoldItems[0]?.id ?? '')
  const [isMetaExpanded, setIsMetaExpanded] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [activityName, setActivityName] = useState(() => activity?.name ?? 'OSPE Activity')

  useEffect(() => {
    if (!activeEditorId) return undefined

    const onPointerDown = (event) => {
      const activeCard = document.querySelector(`[data-editor-id="${activeEditorId}"]`)
      if (!activeCard?.contains(event.target)) {
        setActiveEditorId('')
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [activeEditorId])

  const moduleLabels = useMemo(() => (
    [
      generatedModules.checklist ? 'Checklist' : null,
      generatedModules.form ? 'Form' : null,
      generatedModules.scaffolding ? 'Scaffolding' : null,
    ].filter(Boolean)
  ), [generatedModules])

  const checklistReady = checklistItems.some((item) => item.text.trim())
  const formReady = !generatedModules.form || formItems.some((item) => item.questionText.trim())
  const scaffoldingReady = !generatedModules.scaffolding || scaffoldItems.length > 0
  const canSaveActivity = checklistReady && formReady

  const readinessItems = [
    { label: 'Checklist', value: checklistReady ? 'Ready' : 'Required', tone: checklistReady ? 'success' : 'warning' },
    { label: 'Form', value: generatedModules.form ? (formReady ? 'Ready' : 'Required') : 'Not selected', tone: generatedModules.form ? (formReady ? 'success' : 'warning') : 'default' },
    { label: 'Scaffolding', value: generatedModules.scaffolding ? (scaffoldingReady ? 'Ready' : 'Optional') : 'Not selected', tone: generatedModules.scaffolding ? 'info' : 'default' },
  ]

  const headerCompetency = record?.competency ?? activity?.competency ?? 'Checklist-driven practical activity.'
  const headerYear = record?.year ?? 'Not available'
  const headerSubject = record?.subject ?? 'Not available'
  const headerTopic = record?.topic ?? 'Not available'
  const hasMarks = activity?.marks !== 'Nil'
  const isCertifiable = Boolean(activity?.certifiable ?? activity?.showCertifiable)
  const certifiableLabel = isCertifiable ? 'Yes' : 'No'
  const totalMarksLabel = hasMarks ? activity?.marks ?? 'Enabled' : 'Disabled'

  const updateChecklist = (id, field, value) => {
    setChecklistItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const updateForm = (id, field, value) => {
    setFormItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const updateScaffold = (id, field, value) => {
    setScaffoldItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const addChecklist = () => {
    const next = createChecklistItem(checklistItems.length)
    setChecklistItems((current) => [...current, next])
    setActiveEditorId(next.id)
  }

  const addFormQuestion = () => {
    const next = createFormItem(formItems.length)
    setFormItems((current) => [...current, next])
    setActiveEditorId(next.id)
  }

  const addScaffoldQuestion = (type) => {
    const next = createScaffoldItem(type, scaffoldItems.length)
    setScaffoldItems((current) => [...current, next])
    setActiveEditorId(next.id)
  }

  const deleteChecklist = (id) => {
    setChecklistItems((current) => current.filter((item) => item.id !== id))
    setActiveEditorId((current) => (current === id ? '' : current))
    onAlert?.({ tone: 'warning', message: 'Checklist item removed.' })
  }

  const deleteForm = (id) => {
    setFormItems((current) => current.filter((item) => item.id !== id))
    setActiveEditorId((current) => (current === id ? '' : current))
    onAlert?.({ tone: 'warning', message: 'Form question removed.' })
  }

  const deleteScaffold = (id) => {
    setScaffoldItems((current) => current.filter((item) => item.id !== id))
    setActiveEditorId((current) => (current === id ? '' : current))
    onAlert?.({ tone: 'warning', message: 'Scaffolding question removed.' })
  }

  return (
    <section className="vx-content forms-page ospe-page">
      <div className="ospe-shell">
        <section className="vx-card ospe-header-card">
          <div className="ospe-header-main">
            <div className="ospe-header-copy">
              <div className="ospe-header-topbar">
                <span className="ospe-section-badge">Phase 1: Contextual Setup</span>
                <div className="ospe-header-badges">
                  <button
                    type="button"
                    className="ospe-meta-toggle"
                    onClick={() => setIsMetaExpanded((current) => !current)}
                    aria-expanded={isMetaExpanded}
                  >
                    {isMetaExpanded ? 'Less details' : 'More details'}
                    {isMetaExpanded ? <ChevronUp size={15} strokeWidth={2.2} /> : <ChevronDown size={15} strokeWidth={2.2} />}
                  </button>
                </div>
              </div>
              <div className="ospe-title-row">
                {isEditingName ? (
                  <input
                    className="ospe-title-input"
                    value={activityName}
                    onChange={(event) => setActivityName(event.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    autoFocus
                  />
                ) : (
                  <h2>{activityName}</h2>
                )}
                <button
                  type="button"
                  className="ospe-title-edit"
                  aria-label="Edit activity name"
                  onClick={() => setIsEditingName(true)}
                >
                  <Pencil size={16} strokeWidth={2} />
                </button>
              </div>
              <div className="ospe-header-meta-strip">
                <article className="ospe-header-meta-card">
                  <div className="ospe-header-meta-head">
                    <span className="ospe-header-meta-icon" aria-hidden="true"><Tag size={14} strokeWidth={2} /></span>
                    <span>Activity Type</span>
                  </div>
                  <strong>{activity?.type ?? 'OSPE'}</strong>
                </article>
                <article className="ospe-header-meta-card">
                  <div className="ospe-header-meta-head">
                    <span className="ospe-header-meta-icon" aria-hidden="true"><CheckCircle2 size={14} strokeWidth={2} /></span>
                    <span>Total Marks</span>
                  </div>
                  <strong>{totalMarksLabel}</strong>
                </article>
                <article className="ospe-header-meta-card">
                  <div className="ospe-header-meta-head">
                    <span className="ospe-header-meta-icon" aria-hidden="true"><Target size={14} strokeWidth={2} /></span>
                    <span>Certifiable</span>
                  </div>
                  <strong>{certifiableLabel}</strong>
                </article>
                {isMetaExpanded ? (
                  <>
                    <article className="ospe-header-meta-card">
                      <div className="ospe-header-meta-head">
                        <span className="ospe-header-meta-icon" aria-hidden="true"><CalendarDays size={14} strokeWidth={2} /></span>
                        <span>Year</span>
                      </div>
                      <strong>{headerYear}</strong>
                    </article>
                    <article className="ospe-header-meta-card">
                      <div className="ospe-header-meta-head">
                        <span className="ospe-header-meta-icon" aria-hidden="true"><BookOpen size={14} strokeWidth={2} /></span>
                        <span>Subject</span>
                      </div>
                      <strong>{headerSubject}</strong>
                    </article>
                    <article className="ospe-header-meta-card ospe-header-meta-card--wide">
                      <div className="ospe-header-meta-head">
                        <span className="ospe-header-meta-icon" aria-hidden="true"><ClipboardCheck size={14} strokeWidth={2} /></span>
                        <span>Generated Modules</span>
                      </div>
                      <strong>{moduleLabels.join(', ')}</strong>
                    </article>
                  </>
                ) : null}
              </div>
            </div>

            <div className="ospe-settings-panel">
              <div className="ospe-settings-head">
                <span>Activity Settings</span>
                <small>{hasMarks ? 'Marks enabled' : 'Marks disabled'} • {isCertifiable ? 'Yes' : 'No'} certifiable</small>
              </div>
              <div className="ospe-settings-card">
                <div>
                  <span>Marks</span>
                  <small>Enable scoring for this activity</small>
                </div>
                <div className={`ospe-settings-toggle ${hasMarks ? 'is-active' : ''}`} aria-hidden="true">
                  <span />
                </div>
              </div>
              <div className="ospe-settings-card">
                <div>
                  <span>Certifiable</span>
                  <small>Mark this as a certifiable skill check</small>
                </div>
                <div className={`ospe-settings-toggle ${isCertifiable ? 'is-active' : ''}`} aria-hidden="true">
                  <span />
                </div>
              </div>
              <div className="ospe-header-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => onAlert?.({ tone: 'secondary', message: 'Preview station opened.' })}
                >
                  <ListChecks size={16} strokeWidth={2} />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  className="tool-btn green"
                  onClick={() => onAlert?.({ tone: 'secondary', message: 'OSPE activity saved successfully.' })}
                  disabled={!canSaveActivity}
                >
                  <BookCheck size={16} strokeWidth={2} />
                  <span>Save Activity</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {generatedModules.checklist ? (
          <section className="ospe-stage-panel">
            <div className="ospe-section-head">
              <div>
                <h3>Checklist</h3>
                <p>Click any card to edit. New checklist items open ready to type.</p>
              </div>
              <button type="button" className="ghost" onClick={addChecklist}>
                <Plus size={16} strokeWidth={2} />
                <span>Add Checklist</span>
              </button>
            </div>
            <div className="ospe-stage-list">
              {checklistItems.map((item, index) => (
                <ChecklistCard
                  key={item.id}
                  item={item}
                  index={index}
                  isEditing={activeEditorId === item.id}
                  onActivate={setActiveEditorId}
                  onUpdate={updateChecklist}
                  onDelete={deleteChecklist}
                />
              ))}
            </div>
          </section>
        ) : null}

        {generatedModules.form ? (
          <section className="ospe-stage-panel">
            <div className="ospe-section-head">
              <div>
                <h3>Form</h3>
                <p>Reuse the main question flow here with one-click inline editing.</p>
              </div>
              <button type="button" className="ghost" onClick={addFormQuestion}>
                <Plus size={16} strokeWidth={2} />
                <span>Add Question</span>
              </button>
            </div>
            <div className="ospe-stage-list">
              {formItems.map((item, index) => (
                <FormCard
                  key={item.id}
                  item={item}
                  index={index}
                  isEditing={activeEditorId === item.id}
                  onActivate={setActiveEditorId}
                  onUpdate={updateForm}
                  onDelete={deleteForm}
                />
              ))}
            </div>
          </section>
        ) : null}

        {generatedModules.scaffolding ? (
          <section className="ospe-stage-panel">
            <div className="ospe-section-head ospe-section-head--stacked">
              <div>
                <h3>Scaffolding</h3>
                <p>Use quick-add actions to create only the support question types you need.</p>
              </div>
              <div className="ospe-quick-actions">
                {scaffoldQuickTypes.map((type) => (
                  <button key={type} type="button" className="ghost" onClick={() => addScaffoldQuestion(type)}>
                    <Sparkles size={15} strokeWidth={2} />
                    <span>{type}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="ospe-stage-list">
              {scaffoldItems.map((item, index) => (
                <ScaffoldingCard
                  key={item.id}
                  item={item}
                  index={index}
                  isEditing={activeEditorId === item.id}
                  onActivate={setActiveEditorId}
                  onUpdate={updateScaffold}
                  onDelete={deleteScaffold}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="vx-card ospe-footer-card">
          <div className="ospe-footer-copy">
            <strong>{canSaveActivity ? 'Ready to save' : 'Complete the checklist to continue'}</strong>
            <small>Checklist is required. Form and scaffolding follow the generated modules only.</small>
          </div>
          <div className="ospe-footer-readiness">
            {readinessItems.map((item) => (
              <MetaPill key={item.label} tone={item.tone}>{item.label}: {item.value}</MetaPill>
            ))}
          </div>
          <div className="ospe-footer-actions">
            <button type="button" className="ghost" onClick={() => onAlert?.({ tone: 'primary', message: 'Review / Assign opened.' })}>
              <Stethoscope size={16} strokeWidth={2} />
              <span>Review / Assign</span>
            </button>
            <button type="button" className="tool-btn green" onClick={() => onAlert?.({ tone: 'secondary', message: 'OSPE activity saved successfully.' })} disabled={!canSaveActivity}>
              <BookCheck size={16} strokeWidth={2} />
              <span>Save Activity</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default OspeActivityPage
