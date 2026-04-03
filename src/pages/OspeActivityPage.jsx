import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookCheck,
  CheckCircle2,
  Eye,
  FileText,
  Flag,
  ListChecks,
  ListTodo,
  Pencil,
  Plus,
  Sparkles,
  Stethoscope,
  Tag,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import '../styles/ospe-activity.css'

const cognitiveOptions = ['Not Applicable', 'Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create']
const affectiveOptions = ['Not Applicable', 'Receive', 'Respond', 'Value', 'Organize', 'Characterize']
const psychomotorOptions = ['Not Applicable', 'Perception', 'Set', 'Guided Response', 'Mechanism', 'Adaptation', 'Origination']
const defaultFormValues = ['Nil', 'Present', 'Absent', 'Positive', 'Negative']
const scaffoldStarterTypes = ['MCQ', 'Descriptive', 'True or False', 'Fill in the blanks']
const scaffoldingTypeOptions = [
  { value: 'MCQ', label: 'MCQ', helper: 'Multi Choice Question' },
  { value: 'Descriptive', label: 'Descriptive', helper: 'Long-form response' },
  { value: 'True or False', label: 'True or False', helper: 'Binary answer format' },
  { value: 'Fill in the blanks', label: 'Fill in the blanks', helper: 'Short completion prompt' },
]
const tabs = ['Checklist', 'Form', 'Scaffolding']
const fallbackOspeActivitySeed = {
  activity: {
    id: 'ospe-activity-seed',
    name: 'OSPE Activity',
    type: 'OSPE',
    marks: 'Nil',
    certifiable: false,
  },
  record: {
    year: 'Not available',
    subject: 'Not available',
    competency: 'Not available',
    topic: '',
  },
  generatedModes: ['Checklist'],
}

const createChecklistItem = (index) => ({
  id: `checklist-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
  text: '',
  marks: '1',
  cognitive: 'Not Applicable',
  affective: 'Not Applicable',
  psychomotor: 'Not Applicable',
  isCritical: false,
  isEnabled: true,
  isDomainTagsOpen: false,
})

const createFormItem = (index) => ({
  id: `form-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
  questionText: '',
  selectedValue: 'Nil',
  marks: '1',
  cognitive: 'Not Applicable',
  affective: 'Not Applicable',
  psychomotor: 'Not Applicable',
  isCritical: false,
  isDomainTagsOpen: false,
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

const buildInitialChecklistItems = () => Array.from({ length: 5 }, (_, index) => createChecklistItem(index))
const buildInitialFormItems = () => Array.from({ length: 7 }, (_, index) => createFormItem(index))
const buildInitialScaffoldItems = () => scaffoldStarterTypes.map((type, index) => createScaffoldItem(type, index))
const buildGeneratedModules = (generatedModes = []) => ({
  checklist: generatedModes.length === 0 || generatedModes.includes('Checklist'),
  form: generatedModes.includes('Form'),
  scaffolding: generatedModes.includes('Scaffolding'),
})
const sumItemMarks = (items = []) => items.reduce((total, item) => total + (Number(item?.marks) || 0), 0)
const taxonomyFields = ['cognitive', 'affective', 'psychomotor']

function MetaPill({ children, tone = 'default' }) {
  return <span className={`ospe-meta-pill is-${tone}`}>{children}</span>
}

function applyExclusiveTaxonomyUpdate(item, field, value) {
  if (!taxonomyFields.includes(field)) {
    return { ...item, [field]: value }
  }

  const nextItem = {
    ...item,
    cognitive: 'Not Applicable',
    affective: 'Not Applicable',
    psychomotor: 'Not Applicable',
    isDomainTagsOpen: true,
  }

  nextItem[field] = value
  return nextItem
}

function getActiveDomainBadge(item) {
  if (item?.cognitive && item.cognitive !== 'Not Applicable') {
    return `Cognitive: ${item.cognitive}`
  }
  if (item?.affective && item.affective !== 'Not Applicable') {
    return `Affective: ${item.affective}`
  }
  if (item?.psychomotor && item.psychomotor !== 'Not Applicable') {
    return `Psychomotor: ${item.psychomotor}`
  }
  return null
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

function TaxonomyBadges({ item, includeValue }) {
  const activeDomainBadge = getActiveDomainBadge(item)
  return (
    <>
      {includeValue ? <MetaPill tone="default">{includeValue}</MetaPill> : null}
      <MetaPill tone="default">{item.marks} mark</MetaPill>
      {activeDomainBadge ? <MetaPill tone="info">{activeDomainBadge}</MetaPill> : null}
      {item.isCritical ? <MetaPill tone="warning"><Flag size={12} strokeWidth={2} />Criticality</MetaPill> : null}
    </>
  )
}

function getDomainTagsButtonLabel(item) {
  return getActiveDomainBadge(item) ?? 'Add tags'
}

function ChecklistCard({ item, index, isEditing, marksEnabled, onActivate, onUpdate, onDelete }) {
  const activeDomainBadge = getActiveDomainBadge(item)
  return (
    <article className={`vx-card ospe-builder-card ${isEditing ? 'is-editing' : ''}`} data-editor-id={item.id} onClick={() => onActivate(item.id)}>
      <div className="ospe-builder-card-head">
        <div className="ospe-builder-card-topline">
          <div className="ospe-builder-card-copy">
            <div className="ospe-checklist-title-row">
              <span className="ospe-builder-card-kicker">Checklist {index + 1}</span>
            </div>
          </div>
          <div className="ospe-builder-card-meta">
            <MetaPill tone="default">{item.marks} mark</MetaPill>
            {activeDomainBadge ? <MetaPill tone="info">{activeDomainBadge}</MetaPill> : null}
            {item.isCritical ? <MetaPill tone="warning"><Flag size={12} strokeWidth={2} />Criticality</MetaPill> : null}
            {!item.isEnabled ? <MetaPill tone="warning">Disabled</MetaPill> : null}
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
        <strong className="ospe-builder-card-question">{item.text.trim() || 'Click to write the checklist question.'}</strong>
      </div>
      {isEditing ? (
        <div className="ospe-builder-card-body" onClick={(event) => event.stopPropagation()}>
          <div className="ospe-checklist-edit-layout">
            <label className="forms-field ospe-field--question ospe-checklist-question-panel">
              <span>Checklist Question</span>
              <textarea rows={4} value={item.text} onChange={(event) => onUpdate(item.id, 'text', event.target.value)} placeholder="Enter your question here....." />
            </label>
            <div className="ospe-assessment-card ospe-checklist-assessment-panel">
              <span className="ospe-assessment-card-title">Assessment Tags</span>
              <div className="ospe-assessment-card-top">
                <div className="ospe-assessment-card-primary">
                  <label className="forms-field ospe-field--marks">
                    <span>Marks</span>
                    <input value={item.marks} onChange={(event) => onUpdate(item.id, 'marks', event.target.value)} disabled={!marksEnabled} />
                  </label>
                  <div className="forms-field ospe-assessment-criticality">
                    <span>Criticality</span>
                    <button
                      type="button"
                      className={`ospe-criticality-toggle ${item.isCritical ? 'is-active' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onUpdate(item.id, 'isCritical', !item.isCritical)
                      }}
                      aria-pressed={item.isCritical}
                    >
                      <span className="ospe-criticality-toggle-track" aria-hidden="true">
                        <span className="ospe-criticality-toggle-thumb" />
                      </span>
                      <span className="ospe-criticality-toggle-label">{item.isCritical ? 'On' : 'Off'}</span>
                    </button>
                  </div>
                </div>
                <div className="forms-field ospe-domain-tags-field">
                  <span>Domain tags</span>
                  <div className="ospe-domain-tags">
                    <button
                      type="button"
                      className={`ghost ospe-domain-tags-trigger ${item.isDomainTagsOpen ? 'is-active' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onUpdate(item.id, 'isDomainTagsOpen', !item.isDomainTagsOpen)
                      }}
                      aria-expanded={item.isDomainTagsOpen}
                    >
                      <span>{getDomainTagsButtonLabel(item)}</span>
                    </button>
                    {item.isDomainTagsOpen ? (
                      <div className="ospe-domain-tags-popover" onClick={(event) => event.stopPropagation()}>
                        <label className="forms-field">
                          <span>Cognitive</span>
                          <div className="forms-select-wrap"><select value={item.cognitive} onChange={(event) => onUpdate(item.id, 'cognitive', event.target.value)}>{cognitiveOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
                        </label>
                        <label className="forms-field">
                          <span>Affective</span>
                          <div className="forms-select-wrap"><select value={item.affective} onChange={(event) => onUpdate(item.id, 'affective', event.target.value)}>{affectiveOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
                        </label>
                        <label className="forms-field">
                          <span>Psychomotor</span>
                          <div className="forms-select-wrap"><select value={item.psychomotor} onChange={(event) => onUpdate(item.id, 'psychomotor', event.target.value)}>{psychomotorOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
                        </label>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function FormCard({
  item,
  index,
  isEditing,
  marksEnabled,
  valueOptions,
  isAddValueOpen,
  addValueDraft,
  onActivate,
  onUpdate,
  onDelete,
  onToggleAddValue,
  onAddValueDraftChange,
  onSaveValue,
}) {
  const activeDomainBadge = getActiveDomainBadge(item)
  return (
    <article className={`vx-card ospe-builder-card ${isEditing ? 'is-editing' : ''}`} data-editor-id={item.id} onClick={() => onActivate(item.id)}>
      <div className="ospe-builder-card-head">
        <div className="ospe-builder-card-topline">
          <div className="ospe-builder-card-copy">
            <span className="ospe-builder-card-kicker">Form {index + 1}</span>
          </div>
          <div className="ospe-builder-card-meta">
            <MetaPill tone="default">{item.selectedValue}</MetaPill>
            <MetaPill tone="default">{item.marks} mark</MetaPill>
            {activeDomainBadge ? <MetaPill tone="info">{activeDomainBadge}</MetaPill> : null}
            {item.isCritical ? <MetaPill tone="warning"><Flag size={12} strokeWidth={2} />Criticality</MetaPill> : null}
            <button
              type="button"
              className="ospe-icon-btn is-danger"
              onClick={(event) => {
                event.stopPropagation()
                onDelete(item.id)
              }}
              aria-label={`Delete form ${index + 1}`}
            >
              <Trash2 size={15} strokeWidth={2} />
            </button>
          </div>
        </div>
        <strong className="ospe-builder-card-question">{item.questionText.trim() || 'Click to write the form question.'}</strong>
      </div>
      {isEditing ? (
        <div className="ospe-builder-card-body" onClick={(event) => event.stopPropagation()}>
          <div className="ospe-form-edit-layout">
            <div className="ospe-form-content-panel">
              <label className="forms-field ospe-field--question ospe-form-question-panel">
                <span>Form Question</span>
                <textarea rows={3} value={item.questionText} onChange={(event) => onUpdate(item.id, 'questionText', event.target.value)} placeholder="Write the form question" />
              </label>
              <label className="forms-field ospe-form-value-field">
                <span>Select Value</span>
                <div className="ospe-form-value-row">
                  <div className="forms-select-wrap">
                    <select value={item.selectedValue} onChange={(event) => onUpdate(item.id, 'selectedValue', event.target.value)}>
                      {valueOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <button type="button" className="ospe-icon-btn" onClick={(event) => { event.stopPropagation(); onToggleAddValue(item.id) }} aria-label="Add dropdown value">
                    <Plus size={14} strokeWidth={2.2} />
                  </button>
                </div>
                {isAddValueOpen ? (
                  <div className="ospe-add-value-tooltip">
                    <input value={addValueDraft} onChange={(event) => onAddValueDraftChange(event.target.value)} placeholder="Add value" />
                    <button type="button" className="tool-btn green" onClick={() => onSaveValue(item.id)}>Save</button>
                  </div>
                ) : null}
              </label>
            </div>
            <div className="ospe-assessment-card ospe-form-assessment-panel">
              <span className="ospe-assessment-card-title">Assessment Tags</span>
              <div className="ospe-assessment-card-top">
                <div className="ospe-assessment-card-primary">
                  <label className="forms-field ospe-field--marks">
                    <span>Marks</span>
                    <input value={item.marks} onChange={(event) => onUpdate(item.id, 'marks', event.target.value)} disabled={!marksEnabled} />
                  </label>
                  <div className="forms-field ospe-assessment-criticality">
                    <span>Criticality</span>
                    <button
                      type="button"
                      className={`ospe-criticality-toggle ${item.isCritical ? 'is-active' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onUpdate(item.id, 'isCritical', !item.isCritical)
                      }}
                      aria-pressed={item.isCritical}
                    >
                      <span className="ospe-criticality-toggle-track" aria-hidden="true">
                        <span className="ospe-criticality-toggle-thumb" />
                      </span>
                      <span className="ospe-criticality-toggle-label">{item.isCritical ? 'On' : 'Off'}</span>
                    </button>
                  </div>
                </div>
                <div className="forms-field ospe-domain-tags-field">
                  <span>Domain tags</span>
                  <div className="ospe-domain-tags">
                    <button
                      type="button"
                      className={`ghost ospe-domain-tags-trigger ${item.isDomainTagsOpen ? 'is-active' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onUpdate(item.id, 'isDomainTagsOpen', !item.isDomainTagsOpen)
                      }}
                      aria-expanded={item.isDomainTagsOpen}
                    >
                      <span>{getDomainTagsButtonLabel(item)}</span>
                    </button>
                    {item.isDomainTagsOpen ? (
                      <div className="ospe-domain-tags-popover" onClick={(event) => event.stopPropagation()}>
                        <label className="forms-field">
                          <span>Cognitive</span>
                          <div className="forms-select-wrap"><select value={item.cognitive} onChange={(event) => onUpdate(item.id, 'cognitive', event.target.value)}>{cognitiveOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
                        </label>
                        <label className="forms-field">
                          <span>Affective</span>
                          <div className="forms-select-wrap"><select value={item.affective} onChange={(event) => onUpdate(item.id, 'affective', event.target.value)}>{affectiveOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
                        </label>
                        <label className="forms-field">
                          <span>Psychomotor</span>
                          <div className="forms-select-wrap"><select value={item.psychomotor} onChange={(event) => onUpdate(item.id, 'psychomotor', event.target.value)}>{psychomotorOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
                        </label>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function ScaffoldingCard({ item, index, isEditing, marksEnabled, onActivate, onUpdate, onDelete }) {
  return (
    <article className={`vx-card ospe-builder-card ${isEditing ? 'is-editing' : ''}`} data-editor-id={item.id} onClick={() => onActivate(item.id)}>
      <div className="ospe-builder-card-head">
        <div className="ospe-builder-card-copy">
          <span className="ospe-builder-card-kicker">Scaffolding {index + 1}</span>
          <strong>{item.questionText.trim() || `Click to write the ${item.type} prompt.`}</strong>
        </div>
        <div className="ospe-builder-card-meta">
          <TaxonomyBadges item={item} includeValue={item.type} />
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
            <textarea rows={3} value={item.questionText} onChange={(event) => onUpdate(item.id, 'questionText', event.target.value)} placeholder="Write the scaffolding prompt" />
          </label>
          {item.type === 'MCQ' ? (
            <div className="ospe-mcq-editor">
              {item.options.map((option, optionIndex) => (
                <label key={`${item.id}-${optionIndex}`} className="forms-field">
                  <span>Option {String.fromCharCode(65 + optionIndex)}</span>
                  <input value={option} onChange={(event) => {
                    const nextOptions = [...item.options]
                    nextOptions[optionIndex] = event.target.value
                    onUpdate(item.id, 'options', nextOptions)
                  }} />
                </label>
              ))}
            </div>
          ) : null}
          <div className="ospe-builder-grid">
            <label className="forms-field"><span>Marks</span><input value={item.marks} onChange={(event) => onUpdate(item.id, 'marks', event.target.value)} disabled={!marksEnabled} /></label>
            <label className="forms-field forms-field-full"><span>Answer Key</span><input value={item.answerKey} onChange={(event) => onUpdate(item.id, 'answerKey', event.target.value)} placeholder="Expected answer" /></label>
            <label className="forms-field forms-field-full"><span>Explanation</span><textarea rows={2} value={item.explanation} onChange={(event) => onUpdate(item.id, 'explanation', event.target.value)} placeholder="Short explanation" /></label>
            <label className="forms-field"><span>Cognitive</span><div className="forms-select-wrap"><select value={item.cognitive} onChange={(event) => onUpdate(item.id, 'cognitive', event.target.value)}>{cognitiveOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></div></label>
            <label className="forms-field"><span>Affective</span><div className="forms-select-wrap"><select value={item.affective} onChange={(event) => onUpdate(item.id, 'affective', event.target.value)}>{affectiveOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></div></label>
            <label className="forms-field"><span>Psychomotor</span><div className="forms-select-wrap"><select value={item.psychomotor} onChange={(event) => onUpdate(item.id, 'psychomotor', event.target.value)}>{psychomotorOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></div></label>
          </div>
          <InlineToggle checked={item.isCritical} onChange={() => onUpdate(item.id, 'isCritical', !item.isCritical)} label={item.isCritical ? 'Criticality on' : 'Criticality off'} />
        </div>
      ) : null}
    </article>
  )
}

function OspeActivityPage({ activityData, onAlert }) {
  const resolvedActivityData = activityData ?? fallbackOspeActivitySeed
  const activity = resolvedActivityData?.activity ?? resolvedActivityData ?? null
  const record = resolvedActivityData?.record ?? null
  const generatedModes = resolvedActivityData?.generatedModes ?? ['Checklist']
  const generatedModules = useMemo(() => buildGeneratedModules(generatedModes), [generatedModes])

  const [checklistItems, setChecklistItems] = useState(() => buildInitialChecklistItems())
  const [formItems, setFormItems] = useState(() => (generatedModules.form ? buildInitialFormItems() : []))
  const [scaffoldItems, setScaffoldItems] = useState(() => (generatedModules.scaffolding ? buildInitialScaffoldItems() : []))
  const [activeEditorId, setActiveEditorId] = useState('')
  const [activeTab, setActiveTab] = useState('Checklist')
  const [isEditingName, setIsEditingName] = useState(false)
  const [activityName, setActivityName] = useState(() => activity?.name ?? 'OSPE Activity')
  const [marksEnabled, setMarksEnabled] = useState(() => activity?.marks !== 'Nil')
  const [certifiableEnabled, setCertifiableEnabled] = useState(() => Boolean(activity?.certifiable ?? activity?.showCertifiable))
  const [hasCreatedChecklist, setHasCreatedChecklist] = useState(true)
  const [hasCreatedForm, setHasCreatedForm] = useState(() => generatedModules.form)
  const [hasCreatedScaffolding, setHasCreatedScaffolding] = useState(() => generatedModules.scaffolding)
  const [customFormValues, setCustomFormValues] = useState([])
  const [activeAddValueId, setActiveAddValueId] = useState(null)
  const [addValueDraft, setAddValueDraft] = useState('')
  const [isFormTooltipOpen, setIsFormTooltipOpen] = useState(false)
  const [formGenerationCount, setFormGenerationCount] = useState(7)
  const [isScaffoldingTooltipOpen, setIsScaffoldingTooltipOpen] = useState(false)
  const formCountInputRef = useRef(null)
  const firstScaffoldingOptionRef = useRef(null)
  const [scaffoldingSelection, setScaffoldingSelection] = useState({
    MCQ: 0,
    Descriptive: 0,
    'True or False': 0,
    'Fill in the blanks': 0,
  })

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

  useEffect(() => {
    const onPointerDown = (event) => {
      if (event.target.closest('.ospe-domain-tags')) return
      setChecklistItems((current) => {
        let hasOpenPopover = false
        const next = current.map((item) => {
          if (!item.isDomainTagsOpen) return item
          hasOpenPopover = true
          return { ...item, isDomainTagsOpen: false }
        })
        return hasOpenPopover ? next : current
      })
      setFormItems((current) => {
        let hasOpenPopover = false
        const next = current.map((item) => {
          if (!item.isDomainTagsOpen) return item
          hasOpenPopover = true
          return { ...item, isDomainTagsOpen: false }
        })
        return hasOpenPopover ? next : current
      })
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    if (activeTab === 'Form' && !formItems.length && !isFormTooltipOpen && !hasCreatedForm) setActiveTab(scaffoldItems.length ? 'Scaffolding' : 'Checklist')
    if (activeTab === 'Scaffolding' && !scaffoldItems.length && !isScaffoldingTooltipOpen && !hasCreatedScaffolding) setActiveTab(formItems.length ? 'Form' : 'Checklist')
  }, [activeTab, formItems.length, scaffoldItems.length, isFormTooltipOpen, isScaffoldingTooltipOpen, hasCreatedForm, hasCreatedScaffolding])

  useEffect(() => {
    setChecklistItems(buildInitialChecklistItems())
    setFormItems(generatedModules.form ? buildInitialFormItems() : [])
    setScaffoldItems(generatedModules.scaffolding ? buildInitialScaffoldItems() : [])
    setHasCreatedChecklist(true)
    setHasCreatedForm(generatedModules.form)
    setHasCreatedScaffolding(generatedModules.scaffolding)
    setActiveEditorId('')
    setActiveTab('Checklist')
    setActiveAddValueId(null)
    setAddValueDraft('')
    setMarksEnabled(activity?.marks !== 'Nil')
    setCertifiableEnabled(Boolean(activity?.certifiable ?? activity?.showCertifiable))
    setIsFormTooltipOpen(false)
    setFormGenerationCount(7)
    setIsScaffoldingTooltipOpen(false)
  }, [activity, generatedModules])

  useEffect(() => {
    if (!isFormTooltipOpen) return undefined
    const timeoutId = window.setTimeout(() => {
      formCountInputRef.current?.focus()
      formCountInputRef.current?.select?.()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [isFormTooltipOpen])

  useEffect(() => {
    if (!isScaffoldingTooltipOpen) return undefined
    const timeoutId = window.setTimeout(() => {
      firstScaffoldingOptionRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [isScaffoldingTooltipOpen])

  const checklistCount = checklistItems.length
  const formCount = formItems.length
  const scaffoldingCount = scaffoldItems.length
  const checklistTotalMarks = useMemo(() => sumItemMarks(checklistItems), [checklistItems])
  const formTotalMarks = useMemo(() => sumItemMarks(formItems), [formItems])
  const scaffoldingTotalMarks = useMemo(() => sumItemMarks(scaffoldItems), [scaffoldItems])
  const overallTotalMarks = checklistTotalMarks + formTotalMarks + scaffoldingTotalMarks
  const formValueOptions = [...defaultFormValues, ...customFormValues.filter((value) => !defaultFormValues.includes(value))]
  const checklistReady = checklistItems.some((item) => item.text.trim())
  const formReady = !formItems.length || formItems.some((item) => item.questionText.trim())
  const canSaveActivity = checklistReady && formReady
  const hasMarks = marksEnabled
  const isCertifiable = certifiableEnabled
  const certifiableLabel = isCertifiable ? 'Yes' : 'No'
  const totalMarksLabel = hasMarks ? overallTotalMarks : 'Disabled'
  const readinessSummary = useMemo(() => {
    if (canSaveActivity) {
      return {
        label: 'Ready',
        text: 'Checklist and selected add-ons are ready. You can save this activity now.',
        tone: 'is-ready',
      }
    }

    const missingItems = []
    if (!checklistReady) missingItems.push('complete at least one checklist item')
    if (!formReady) missingItems.push('complete at least one form item')

    return {
      label: 'In progress',
      text: `${missingItems.join(' and ')} to make this activity ready.`,
      tone: 'is-progress',
    }
  }, [canSaveActivity, checklistReady, formReady])
  const updateChecklist = (id, field, value) => setChecklistItems((current) => current.map((item) => (item.id === id ? applyExclusiveTaxonomyUpdate(item, field, value) : item)))
  const updateForm = (id, field, value) => setFormItems((current) => current.map((item) => (item.id === id ? applyExclusiveTaxonomyUpdate(item, field, value) : item)))
  const updateScaffold = (id, field, value) => setScaffoldItems((current) => current.map((item) => (item.id === id ? applyExclusiveTaxonomyUpdate(item, field, value) : item)))
  const addChecklist = () => { const next = createChecklistItem(checklistItems.length); setHasCreatedChecklist(true); setChecklistItems((current) => [...current, next]); setActiveEditorId(next.id) }
  const addFormQuestion = () => { const next = createFormItem(formItems.length); setHasCreatedForm(true); setFormItems((current) => [...current, next]); setActiveEditorId(next.id) }
  const addScaffoldQuestion = (type) => { const next = createScaffoldItem(type, scaffoldItems.length); setHasCreatedScaffolding(true); setScaffoldItems((current) => [...current, next]); setActiveEditorId(next.id) }
  const deleteChecklist = (id) => { setChecklistItems((current) => current.filter((item) => item.id !== id)); setActiveEditorId((current) => (current === id ? '' : current)); onAlert?.({ tone: 'warning', message: 'Checklist item removed.' }) }
  const deleteForm = (id) => { setFormItems((current) => current.filter((item) => item.id !== id)); setActiveEditorId((current) => (current === id ? '' : current)); onAlert?.({ tone: 'warning', message: 'Form question removed.' }) }
  const deleteScaffold = (id) => { setScaffoldItems((current) => current.filter((item) => item.id !== id)); setActiveEditorId((current) => (current === id ? '' : current)); onAlert?.({ tone: 'warning', message: 'Scaffolding question removed.' }) }
  const generateFormItems = (count) => Array.from({ length: count }, (_, index) => createFormItem(index))
  const handleGenerateFormFromTooltip = () => {
    const nextCount = Math.min(20, Math.max(1, Number(formGenerationCount) || 7))
    setHasCreatedForm(true)
    setFormItems(generateFormItems(nextCount))
    setActiveTab('Form')
    setIsFormTooltipOpen(false)
    onAlert?.({ tone: 'secondary', message: 'Form generated successfully.' })
  }
  const saveNewFormValue = (itemId) => {
    const nextValue = addValueDraft.trim()
    if (!nextValue) return onAlert?.({ tone: 'warning', message: 'Enter a value before saving.' })
    if (![...defaultFormValues, ...customFormValues].some((value) => value.toLowerCase() === nextValue.toLowerCase())) {
      setCustomFormValues((current) => [...current, nextValue])
    }
    updateForm(itemId, 'selectedValue', nextValue)
    setAddValueDraft('')
    setActiveAddValueId(null)
    onAlert?.({ tone: 'secondary', message: 'Dropdown value added.' })
  }
  const hasSelectedScaffoldingType = Object.values(scaffoldingSelection).some((value) => value > 0)
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
  const handleGenerateScaffoldingFromTooltip = () => {
    const selectedTypes = Object.entries(scaffoldingSelection).filter(([, count]) => count > 0)
    if (!selectedTypes.length) {
      onAlert?.({ tone: 'warning', message: 'Select at least one scaffolding type before generating.' })
      return
    }
    const generated = selectedTypes.flatMap(([type, count]) => (
      Array.from({ length: count }, (_, index) => createScaffoldItem(type, scaffoldItems.length + index))
    ))
    setHasCreatedScaffolding(true)
    setScaffoldItems(generated)
    setActiveTab('Scaffolding')
    setIsScaffoldingTooltipOpen(false)
    onAlert?.({ tone: 'secondary', message: 'Scaffolding generated successfully.' })
  }
  const handleTabClick = (tab) => {
    if (tab === 'Form' && !formItems.length) {
      setActiveTab('Form')
      setIsScaffoldingTooltipOpen(false)
      setIsFormTooltipOpen(!hasCreatedForm)
      return
    }
    if (tab === 'Scaffolding' && !scaffoldItems.length) {
      setActiveTab('Scaffolding')
      setIsFormTooltipOpen(false)
      setIsScaffoldingTooltipOpen(!hasCreatedScaffolding)
      return
    }
    setIsFormTooltipOpen(false)
    setIsScaffoldingTooltipOpen(false)
    setActiveTab(tab)
  }

  return (
    <section className="vx-content forms-page ospe-page">
      <div className="ospe-shell">
        <section className="vx-card ospe-header-card">
          <div className="ospe-header-main">
            <div className="ospe-header-copy">
              <div className="ospe-header-topbar">
                <span className="ospe-section-badge">Phase 1: Contextual Setup</span>
              </div>
              <div className="ospe-title-row">
                {isEditingName ? (
                  <input className="ospe-title-input" value={activityName} onChange={(event) => setActivityName(event.target.value)} onBlur={() => setIsEditingName(false)} autoFocus />
                ) : (
                  <h2>{activityName}</h2>
                )}
                <button type="button" className="ospe-title-edit" aria-label="Edit activity name" onClick={() => setIsEditingName(true)}>
                  <Pencil size={16} strokeWidth={2} />
                </button>
              </div>
              <div className="ospe-header-meta-strip">
                <article className="ospe-header-meta-card"><div className="ospe-header-meta-head"><span className="ospe-header-meta-icon" aria-hidden="true"><Tag size={14} strokeWidth={2} /></span><span>Activity Type</span></div><strong>{activity?.type ?? 'OSPE'}</strong></article>
                <article className="ospe-header-meta-card"><div className="ospe-header-meta-head"><span className="ospe-header-meta-icon" aria-hidden="true"><CheckCircle2 size={14} strokeWidth={2} /></span><span>Total Marks</span></div><strong>{totalMarksLabel}</strong></article>
                <article className="ospe-header-meta-card"><div className="ospe-header-meta-head"><span className="ospe-header-meta-icon" aria-hidden="true"><Target size={14} strokeWidth={2} /></span><span>Certifiable</span></div><strong>{certifiableLabel}</strong></article>
              </div>
              <div className="ospe-tabs ospe-header-tabs">
                {tabs.map((tab) => {
                  const count = tab === 'Checklist' ? checklistCount : tab === 'Form' ? formCount : scaffoldingCount
                  const isAvailable = tab === 'Checklist' ? true : count > 0
                  const isCurrentTab = activeTab === tab
                  return (
                    <button
                      key={tab}
                      type="button"
                      className={`ospe-tab ${isCurrentTab ? 'is-active' : ''} ${!isAvailable && !isCurrentTab ? 'is-inactive' : ''}`.trim()}
                      onClick={() => handleTabClick(tab)}
                      aria-expanded={tab === 'Form' ? isFormTooltipOpen : tab === 'Scaffolding' ? isScaffoldingTooltipOpen : undefined}
                    >
                      <span className="ospe-tab-icon" aria-hidden="true">
                        <Sparkles size={14} strokeWidth={2} />
                      </span>
                      <span>{tab}</span>
                      <strong>{count}</strong>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="ospe-settings-panel">
              <div className="ospe-settings-head">
                <span>Activity Settings</span>
                <small>{hasMarks ? 'Marks enabled' : 'Marks disabled'} / {certifiableLabel} certifiable</small>
              </div>
              <div className="ospe-settings-card">
                <div><span>Marks</span><small>Enable scoring for this activity</small></div>
                <button
                  type="button"
                  className={`ospe-settings-toggle ${hasMarks ? 'is-active' : ''}`}
                  aria-pressed={hasMarks}
                  aria-label="Toggle marks"
                  onClick={() => setMarksEnabled((current) => !current)}
                >
                  <span />
                </button>
              </div>
              <div className="ospe-settings-card">
                <div><span>Certifiable</span><small>Mark this as a certifiable skill check</small></div>
                <button
                  type="button"
                  className={`ospe-settings-toggle ${isCertifiable ? 'is-active' : ''}`}
                  aria-pressed={isCertifiable}
                  aria-label="Toggle certifiable"
                  onClick={() => setCertifiableEnabled((current) => !current)}
                >
                  <span />
                </button>
              </div>
              <div className="ospe-header-actions">
                <button type="button" className="ghost" onClick={() => onAlert?.({ tone: 'secondary', message: 'Preview station opened.' })}><Eye size={16} strokeWidth={2} /><span>Preview</span></button>
                <button type="button" className="tool-btn green" onClick={() => onAlert?.({ tone: 'secondary', message: 'OSPE activity saved successfully.' })} disabled={!canSaveActivity}><BookCheck size={16} strokeWidth={2} /><span>Save Activity</span></button>
              </div>
            </div>
          </div>
        </section>

        {activeTab === 'Form' && !formItems.length && isFormTooltipOpen ? (
          <section className="ospe-header-generator ospe-header-generator--form">
            <div className="ospe-form-tooltip">
              <div className="ospe-scaffolding-tooltip-head">
                <span className="ospe-scaffolding-tooltip-kicker">Choose Generation</span>
                <button type="button" className="ospe-scaffolding-close" aria-label="Close form tooltip" onClick={() => setIsFormTooltipOpen(false)}>
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
              <p className="ospe-scaffolding-tooltip-note">Set the form count, then click Generate.</p>
              <div className="ospe-form-option">
                <div className="ospe-form-option-copy">
                  <span className="ospe-scaffolding-choice-icon" aria-hidden="true"><Sparkles size={14} strokeWidth={2} /></span>
                  <span className="ospe-scaffolding-choice-copy">
                    <strong>Form</strong>
                    <small>Generate structured form questions</small>
                  </span>
                </div>
                <label className="forms-field ospe-scaffolding-range">
                  <span>Count</span>
                  <input ref={formCountInputRef} type="number" min="1" max="20" value={formGenerationCount} onChange={(event) => setFormGenerationCount(Math.min(20, Math.max(1, Number(event.target.value) || 1)))} />
                </label>
              </div>
              <div className="ospe-scaffolding-tooltip-actions">
                <button type="button" className="tool-btn green" onClick={handleGenerateFormFromTooltip}>Generate</button>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'Scaffolding' && !scaffoldItems.length && isScaffoldingTooltipOpen ? (
          <section className="ospe-header-generator ospe-header-generator--scaffolding">
            <div className="ospe-scaffolding-tooltip">
              <div className="ospe-scaffolding-tooltip-head">
                <span className="ospe-scaffolding-tooltip-kicker">Choose Generation</span>
                <button type="button" className="ospe-scaffolding-close" aria-label="Close scaffolding tooltip" onClick={() => setIsScaffoldingTooltipOpen(false)}>
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
              <p className="ospe-scaffolding-tooltip-note">Select one or more question types, set the count from 1 to 5, then click Generate.</p>
              <div className="ospe-scaffolding-option-list">
                {scaffoldingTypeOptions.map((option) => {
                  const isSelected = scaffoldingSelection[option.value] > 0
                  return (
                    <div key={option.value} className={`ospe-scaffolding-option ${isSelected ? 'is-selected' : ''}`}>
                      <div className="ospe-scaffolding-row">
                        <button type="button" ref={option.value === scaffoldingTypeOptions[0].value ? firstScaffoldingOptionRef : null} className="ospe-scaffolding-choice" onClick={() => handleToggleScaffoldingType(option.value)} aria-pressed={isSelected}>
                          <span className="ospe-scaffolding-choice-icon" aria-hidden="true"><Sparkles size={14} strokeWidth={2} /></span>
                          <span className="ospe-scaffolding-choice-copy">
                            <strong>{option.label}</strong>
                            <small>{option.helper}</small>
                          </span>
                        </button>
                        {isSelected ? (
                          <label className="forms-field ospe-scaffolding-range">
                            <span>Count</span>
                            <input type="number" min="1" max="5" value={scaffoldingSelection[option.value]} onChange={(event) => handleScaffoldingRangeChange(option.value, event.target.value)} />
                          </label>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="ospe-scaffolding-tooltip-actions">
                <button type="button" className="tool-btn green" onClick={handleGenerateScaffoldingFromTooltip} disabled={!hasSelectedScaffoldingType}>Generate</button>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'Checklist' ? (
          <section className="vx-card ospe-stage-panel ospe-stage-panel--card">
            <div className="ospe-section-card ospe-section-card--embedded">
              <div className="ospe-section-head"><div><h3>Generated Checklist</h3><p>5 checklist items are generated first. Click any card to edit inline.</p></div><MetaPill tone={hasMarks ? 'success' : 'default'}>{hasMarks ? `Total Marks: ${checklistTotalMarks}` : 'Marks Disabled'}</MetaPill></div>
            </div>
            <div className="ospe-stage-list">{checklistItems.map((item, index) => <ChecklistCard key={item.id} item={item} index={index} isEditing={activeEditorId === item.id} marksEnabled={hasMarks} onActivate={setActiveEditorId} onUpdate={updateChecklist} onDelete={deleteChecklist} />)}</div>
            <div className="ospe-section-actions">
              <button type="button" className="ghost ospe-section-action-btn" onClick={addChecklist}><ListChecks size={16} strokeWidth={2} /><span>Add Checklist</span></button>
            </div>
          </section>
        ) : null}

        {activeTab === 'Form' ? (
          formItems.length ? (
            <section className="vx-card ospe-stage-panel ospe-stage-panel--card">
              <div className="ospe-section-card ospe-section-card--embedded">
                <div className="ospe-section-head"><div><h3>Generated Form</h3><p>Generated form items are ready to review, edit, and extend as needed.</p></div><MetaPill tone={hasMarks ? 'success' : 'default'}>{hasMarks ? `Total Marks: ${formTotalMarks}` : 'Marks Disabled'}</MetaPill></div>
              </div>
              <div className="ospe-stage-list">{formItems.map((item, index) => <FormCard key={item.id} item={item} index={index} isEditing={activeEditorId === item.id} marksEnabled={hasMarks} valueOptions={formValueOptions} isAddValueOpen={activeAddValueId === item.id} addValueDraft={addValueDraft} onActivate={setActiveEditorId} onUpdate={updateForm} onDelete={deleteForm} onToggleAddValue={(id) => { setActiveAddValueId((current) => (current === id ? null : id)); setAddValueDraft('') }} onAddValueDraftChange={setAddValueDraft} onSaveValue={saveNewFormValue} />)}</div>
              <div className="ospe-section-actions">
                <button type="button" className="ghost ospe-section-action-btn" onClick={addFormQuestion}><Plus size={16} strokeWidth={2} /><span>Add Form</span></button>
              </div>
            </section>
          ) : hasCreatedForm ? (
            <section className="vx-card ospe-stage-panel ospe-stage-panel--card">
              <div className="ospe-section-card ospe-section-card--embedded">
                <div className="ospe-section-head"><div><h3>Generated Form</h3><p>No form items yet. Add a new form item to continue.</p></div><MetaPill tone={hasMarks ? 'success' : 'default'}>{hasMarks ? `Total Marks: ${formTotalMarks}` : 'Marks Disabled'}</MetaPill></div>
              </div>
              <div className="ospe-section-actions">
                <button type="button" className="ghost ospe-section-action-btn" onClick={addFormQuestion}><Plus size={16} strokeWidth={2} /><span>Add Form</span></button>
              </div>
            </section>
          ) : null
        ) : null}

        {activeTab === 'Scaffolding' ? (
          scaffoldItems.length ? (
            <section className="vx-card ospe-stage-panel ospe-stage-panel--card">
              <div className="ospe-section-card ospe-section-card--embedded">
                <div className="ospe-section-head"><div><h3>Generated Scaffolding</h3><p>Starter set includes MCQ, Descriptive, True or False, and Fill in the blanks.</p></div><MetaPill tone={hasMarks ? 'success' : 'default'}>{hasMarks ? `Total Marks: ${scaffoldingTotalMarks}` : 'Marks Disabled'}</MetaPill></div>
              </div>
              <div className="ospe-stage-list">{scaffoldItems.map((item, index) => <ScaffoldingCard key={item.id} item={item} index={index} isEditing={activeEditorId === item.id} marksEnabled={hasMarks} onActivate={setActiveEditorId} onUpdate={updateScaffold} onDelete={deleteScaffold} />)}</div>
              <div className="ospe-section-actions ospe-section-actions--multi">
                {scaffoldStarterTypes.map((type) => {
                  const Icon = type === 'MCQ'
                    ? ListTodo
                    : type === 'Descriptive'
                      ? FileText
                      : type === 'True or False'
                        ? CheckCircle2
                        : Pencil

                  return (
                    <button key={type} type="button" className="ghost ospe-section-action-btn" onClick={() => addScaffoldQuestion(type)}><Icon size={15} strokeWidth={2} /><span>{type}</span></button>
                  )
                })}
              </div>
            </section>
          ) : hasCreatedScaffolding ? (
            <section className="vx-card ospe-stage-panel ospe-stage-panel--card">
              <div className="ospe-section-card ospe-section-card--embedded">
                <div className="ospe-section-head"><div><h3>Generated Scaffolding</h3><p>No scaffolding questions yet. Add a type to continue.</p></div><MetaPill tone={hasMarks ? 'success' : 'default'}>{hasMarks ? `Total Marks: ${scaffoldingTotalMarks}` : 'Marks Disabled'}</MetaPill></div>
              </div>
              <div className="ospe-section-actions ospe-section-actions--multi">
                {scaffoldStarterTypes.map((type) => {
                  const Icon = type === 'MCQ'
                    ? ListTodo
                    : type === 'Descriptive'
                      ? FileText
                      : type === 'True or False'
                        ? CheckCircle2
                        : Pencil

                  return (
                    <button key={type} type="button" className="ghost ospe-section-action-btn" onClick={() => addScaffoldQuestion(type)}><Icon size={15} strokeWidth={2} /><span>{type}</span></button>
                  )
                })}
              </div>
            </section>
          ) : null
        ) : null}

        <div className="vx-card ospe-footer-card">
          <div className="ospe-footer-status">
            <span className={`ospe-footer-status-dot ${readinessSummary.tone}`} aria-hidden="true" />
            <div className="ospe-footer-copy">
              <strong>{readinessSummary.label}</strong>
              <small>{readinessSummary.text}</small>
            </div>
          </div>
          <div className="ospe-footer-actions">
            <button type="button" className="tool-btn green" onClick={() => onAlert?.({ tone: 'secondary', message: 'OSPE activity saved successfully.' })} disabled={!canSaveActivity}>
              Save Activity
            </button>
          </div>
        </div>

      </div>
    </section>
  )
}

export default OspeActivityPage
