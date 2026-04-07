import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
import DomainBadgeRow from '../components/DomainBadgeRow'
import '../styles/ospe-activity.css'

const cognitiveOptions = ['Not Applicable', 'Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create']
const affectiveOptions = ['Not Applicable', 'Receive', 'Respond', 'Value', 'Organize', 'Characterize']
const psychomotorOptions = ['Not Applicable', 'Perception', 'Set', 'Guided Response', 'Mechanism', 'Adaptation', 'Origination']
const domainOptionsMap = {
  cognitive: cognitiveOptions,
  affective: affectiveOptions,
  psychomotor: psychomotorOptions,
}
const defaultFormResponseTypes = ['Nil', 'Structure', 'Finding', 'Diagnosis', 'Significance', 'Function', 'Action', 'Nerve', 'Muscle', 'Ligament', 'Phase', 'Lesion']
const scaffoldStarterTypes = ['MCQ', 'Descriptive', 'True or False', 'Fill in the blanks']
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
const OSPE_SCAFFOLD_QUESTION_PLACEHOLDER = 'Enter your question here......'
const tabs = ['Checklist', 'Form', 'Scaffolding']
const addResponseTypeOptionValue = '__add_response_type__'
const formTypeOrder = ['single', 'double', 'triple']
const formTemplates = {
  single: {
    shortLabel: 'Single',
    label: 'Single response',
    prompt: 'Clinical, anatomical, or pathological significance of the identified object',
    responses: ['Q1'],
  },
  double: {
    shortLabel: 'Q1 + Q2',
    label: 'Two-question response',
    prompt: 'Answers to specific applied or theoretical questions asked at the station',
    responses: ['Q1', 'Q2'],
  },
  triple: {
    shortLabel: 'Q1 + Q2 + Q3',
    label: 'Three-question response',
    prompt: 'Answers to specific applied or theoretical questions asked at the station',
    responses: ['Q1', 'Q2', 'Q3'],
  },
}
const formStationBlueprints = [
  {
    formType: 'single',
    prompt: 'State the clinical, anatomical, or pathological significance of the identified object.',
    responses: [{ label: 'Q1', expectedResponse: 'Significance' }],
  },
  {
    formType: 'double',
    prompt: 'Answer the following station questions based on the identified specimen or structure.',
    responses: [
      { label: 'Q1', expectedResponse: 'Structure' },
      { label: 'Q2', expectedResponse: 'Function' },
    ],
  },
  {
    formType: 'double',
    prompt: 'Interpret the displayed image or specimen and answer the applied questions.',
    responses: [
      { label: 'Q1', expectedResponse: 'Diagnosis' },
      { label: 'Q2', expectedResponse: 'Finding' },
    ],
  },
  {
    formType: 'triple',
    prompt: 'Respond to the station in a structured sequence.',
    responses: [
      { label: 'Q1', expectedResponse: 'Structure' },
      { label: 'Q2', expectedResponse: 'Action' },
      { label: 'Q3', expectedResponse: 'Significance' },
    ],
  },
  {
    formType: 'single',
    prompt: 'Write the most likely diagnosis or interpretation for the station finding.',
    responses: [{ label: 'Q1', expectedResponse: 'Diagnosis' }],
  },
  {
    formType: 'double',
    prompt: 'Summarize the practical finding and one supporting point from this station.',
    responses: [
      { label: 'Q1', expectedResponse: 'Finding' },
      { label: 'Q2', expectedResponse: 'Significance' },
    ],
  },
  {
    formType: 'triple',
    prompt: 'Answer the applied station questions in order.',
    responses: [
      { label: 'Q1', expectedResponse: 'Diagnosis' },
      { label: 'Q2', expectedResponse: 'Function' },
      { label: 'Q3', expectedResponse: 'Significance' },
    ],
  },
]
const buildAssignThresholdRows = (totalMarks) => {
  const safeTotal = Math.max(1, Number(totalMarks) || 10)
  const firstCut = Number((safeTotal / 3).toFixed(1))
  const secondCut = Number(((safeTotal * 2) / 3).toFixed(1))
  return [
    { id: `threshold-a-${safeTotal}`, label: 'Below Expectation', from: '0', to: String(firstCut) },
    { id: `threshold-b-${safeTotal}`, label: 'Competent', from: String(firstCut), to: String(secondCut) },
    { id: `threshold-c-${safeTotal}`, label: 'Proficient', from: String(secondCut), to: String(safeTotal) },
  ]
}
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
})

const createFormResponse = (label, expectedResponse = 'Nil', keySeed = 'response') => ({
  key: `${keySeed}-${Math.random().toString(36).slice(2, 7)}`,
  label,
  answerText: '',
  expectedResponse,
})

const createFormItem = (index) => {
  const blueprint = formStationBlueprints[index % formStationBlueprints.length]
  const fallbackType = formTypeOrder[index % formTypeOrder.length]
  const formType = blueprint?.formType ?? fallbackType
  const prompt = blueprint?.prompt ?? formTemplates[formType].prompt
  const responses = blueprint?.responses ?? formTemplates[formType].responses.map((label) => ({ label, expectedResponse: 'Nil' }))

  return ({
  formType,
  id: `form-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
  questionText: prompt,
  responses: responses.map((response, responseIndex) => createFormResponse(
    response.label,
    response.expectedResponse ?? 'Nil',
    `${formType}-${responseIndex}`,
  )),
  marks: '1',
  cognitive: 'Not Applicable',
  affective: 'Not Applicable',
  psychomotor: 'Not Applicable',
  isCritical: false,
})
}

const createScaffoldItem = (type, index) => ({
  id: `scaffold-${type}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
  type,
  questionText:
    type === 'MCQ'
      ? 'Select the most appropriate answer based on this station.'
      : type === 'Descriptive'
        ? ''
        : type === 'True or False'
          ? 'The statement given for this station is correct.'
          : 'The identified structure / finding is ________.',
  options: type === 'MCQ' ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
  answerKey:
    type === 'MCQ'
      ? 'Option A'
      : type === 'True or False'
        ? 'True'
        : 'Sample answer key',
  explanation: 'Add a short explanation for the expected answer.',
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

function MetaPill({ children, tone = 'default' }) {
  return <span className={`ospe-meta-pill is-${tone}`}>{children}</span>
}

function getFormTypeMeta(formType) {
  return formTemplates[formType] ?? formTemplates.single
}

function getFormPromptText(item) {
  return item.questionText.trim() || getFormTypeMeta(item.formType).prompt
}

function getVisibleFormResponses(item) {
  return Array.isArray(item.responses) && item.responses.length
    ? item.responses
    : getFormTypeMeta(item.formType).responses.map((label, index) => ({
        key: `${item.id}-fallback-${index}`,
        label,
        answerText: '',
        expectedResponse: 'Nil',
      }))
}

function getExpectedResponseFieldType(expectedResponse) {
  if (expectedResponse === 'Significance' || expectedResponse === 'Function') {
    return 'textarea'
  }
  return 'text'
}

function getExpectedResponsePlaceholder(response) {
  const labelPrefix = response.label === 'Response' ? '' : `${response.label} `
  if (response.expectedResponse === 'Significance') {
    return `${labelPrefix}write the significance`
  }
  if (response.expectedResponse === 'Function') {
    return `${labelPrefix}write the function or role`
  }
  if (response.expectedResponse === 'Diagnosis') {
    return `${labelPrefix}enter the diagnosis`
  }
  if (response.expectedResponse === 'Finding') {
    return `${labelPrefix}enter the finding`
  }
  if (response.expectedResponse === 'Structure') {
    return `${labelPrefix}enter the structure`
  }
  return `${labelPrefix}write the answer`
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

function ChecklistCard({ item, index, isEditing, marksEnabled, onActivate, onUpdate, onDelete }) {
  return (
    <article className={`ospe-builder-card ${isEditing ? 'is-editing' : ''}`} data-editor-id={item.id} onClick={() => onActivate(item.id)}>
      <div className="ospe-builder-card-head">
        <div className="ospe-builder-card-topline">
          <div className="ospe-builder-card-copy">
            <div className="ospe-checklist-title-row">
              <span className="ospe-builder-card-kicker">Checklist {index + 1}</span>
            </div>
          </div>
          <div className="ospe-builder-card-meta">
            <MetaPill tone="default">{item.marks} mark</MetaPill>
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
        <strong className="ospe-builder-card-question">{item.text.trim() || 'Write one observable checklist step for this station.'}</strong>
      </div>
      {isEditing ? (
        <div className="ospe-builder-card-body" onClick={(event) => event.stopPropagation()}>
          <div className="ospe-checklist-edit-layout">
            <label className="forms-field ospe-field--question ospe-checklist-question-panel">
              <span>Checklist Question</span>
              <textarea rows={4} value={item.text} onChange={(event) => onUpdate(item.id, 'text', event.target.value)} placeholder='Write one measurable step, e.g. "Identifies the structure correctly"' />
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
                    <div className="ospe-assessment-card-taxonomy">
                      <span className="ospe-assessment-card-taxonomy-label">Domain Tags</span>
                      <DomainBadgeRow
                        className="ospe-domain-badge-row ospe-domain-badge-row--inline is-stacked"
                        values={item}
                        optionsMap={domainOptionsMap}
                        onChange={(field, value) => onUpdate(item.id, field, value)}
                      />
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
  unitOptions,
  onActivate,
  onUpdate,
  onUpdateResponse,
  onAddUnit,
  onAddResponse,
  onDeleteResponse,
  onDelete,
}) {
  const responses = getVisibleFormResponses(item)
  return (
    <article className={`ospe-builder-card ${isEditing ? 'is-editing' : ''}`} data-editor-id={item.id} onClick={() => onActivate(item.id)}>
      <div className="ospe-builder-card-head">
        <div className="ospe-builder-card-topline">
          <div className="ospe-builder-card-copy">
            <span className="ospe-builder-card-kicker">Form {index + 1}</span>
          </div>
          <div className="ospe-builder-card-meta">
            <MetaPill tone="default">{item.marks} mark</MetaPill>
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
        <strong className="ospe-builder-card-question">{getFormPromptText(item)}</strong>
      </div>
      {isEditing ? (
        <div className="ospe-builder-card-body" onClick={(event) => event.stopPropagation()}>
          <div className="ospe-form-edit-layout">
            <div className="ospe-form-content-panel">
              <label className="forms-field ospe-form-prompt-field">
                <span>Form Prompt</span>
                <input value={item.questionText} onChange={(event) => onUpdate(item.id, 'questionText', event.target.value)} placeholder={getFormTypeMeta(item.formType).prompt} />
              </label>
              <div className="ospe-form-response-list">
                {responses.map((response, responseIndex) => (
                  <div key={response.key} className="ospe-form-response-row">
                    <span className="ospe-form-response-label">{response.label}</span>
                    <label className="forms-field ospe-form-response-answer">
                      <span>{responseIndex === 0 ? 'Answer' : ''}</span>
                      {getExpectedResponseFieldType(response.expectedResponse) === 'textarea' ? (
                        <textarea
                          rows={2}
                          value={response.answerText}
                          onChange={(event) => onUpdateResponse(item.id, response.key, 'answerText', event.target.value)}
                          placeholder={getExpectedResponsePlaceholder(response)}
                        />
                      ) : (
                        <input
                          value={response.answerText}
                          onChange={(event) => onUpdateResponse(item.id, response.key, 'answerText', event.target.value)}
                          placeholder={getExpectedResponsePlaceholder(response)}
                        />
                      )}
                    </label>
                    <label className="forms-field ospe-form-response-unit">
                      <span>{responseIndex === 0 ? 'Expected response' : ''}</span>
                      <div className="forms-select-wrap">
                        <select
                          value={response.expectedResponse}
                          onChange={(event) => {
                            if (event.target.value === addResponseTypeOptionValue) {
                              onAddUnit(item.id, response.key)
                              return
                            }
                            onUpdateResponse(item.id, response.key, 'expectedResponse', event.target.value)
                          }}
                        >
                          {unitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          <option value={addResponseTypeOptionValue}>+ Add expected response</option>
                        </select>
                      </div>
                    </label>
                    {responses.length > 1 ? (
                      <button
                        type="button"
                        className="ospe-form-response-delete"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDeleteResponse(item.id, response.key)
                        }}
                        aria-label={`Delete ${response.label}`}
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              {responses.length < 3 ? (
                <div className="ospe-form-response-actions">
                  <button
                    type="button"
                    className="ghost ospe-inline-add-btn"
                    onClick={(event) => {
                      event.stopPropagation()
                      onAddResponse(item.id)
                    }}
                  >
                    <Plus size={14} strokeWidth={2} />
                    <span>Add response</span>
                  </button>
                </div>
              ) : null}
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
                    <div className="ospe-assessment-card-taxonomy">
                      <span className="ospe-assessment-card-taxonomy-label">Domain Tags</span>
                      <DomainBadgeRow
                        className="ospe-domain-badge-row ospe-domain-badge-row--inline is-stacked"
                        values={item}
                        optionsMap={domainOptionsMap}
                        onChange={(field, value) => onUpdate(item.id, field, value)}
                      />
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
    <article className={`ospe-builder-card ${isEditing ? 'is-editing' : ''}`} data-editor-id={item.id} onClick={() => onActivate(item.id)}>
      <div className="ospe-builder-card-head">
        <div className="ospe-builder-card-topline">
          <div className="ospe-builder-card-copy">
            <span className="ospe-builder-card-kicker">Scaffolding {index + 1}</span>
          </div>
          <div className="ospe-builder-card-meta">
            <MetaPill tone="default">{item.type}</MetaPill>
            <MetaPill tone="default">{item.marks} mark</MetaPill>
            {item.isCritical ? <MetaPill tone="warning"><Flag size={12} strokeWidth={2} />Criticality</MetaPill> : null}
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
        <strong className="ospe-builder-card-question">{item.questionText.trim() || OSPE_SCAFFOLD_QUESTION_PLACEHOLDER}</strong>
      </div>
      {isEditing ? (
        <div className="ospe-builder-card-body" onClick={(event) => event.stopPropagation()}>
          <div className="ospe-form-edit-layout">
            <div className="ospe-scaffold-content-panel">
              <label className="forms-field ospe-field--question ospe-scaffold-prompt-panel">
                <span>Question</span>
                <textarea rows={3} value={item.questionText} onChange={(event) => onUpdate(item.id, 'questionText', event.target.value)} placeholder={OSPE_SCAFFOLD_QUESTION_PLACEHOLDER} />
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
                      }} placeholder={`Write option ${String.fromCharCode(65 + optionIndex)}`} />
                    </label>
                  ))}
                </div>
              ) : null}
              <div className="ospe-scaffold-answer-grid">
                <label className="forms-field">
                  <span>Answer &amp; Explanation</span>
                  <input value={item.answerKey} onChange={(event) => onUpdate(item.id, 'answerKey', event.target.value)} placeholder="Sample answer key" />
                </label>
                <label className="forms-field">
                  <span>Explanation</span>
                  <textarea rows={2} value={item.explanation} onChange={(event) => onUpdate(item.id, 'explanation', event.target.value)} placeholder="Add a short explanation for the expected answer." />
                </label>
              </div>
            </div>
            <div className="ospe-assessment-card ospe-scaffold-assessment-panel">
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
                <div className="ospe-assessment-card-taxonomy">
                  <span className="ospe-assessment-card-taxonomy-label">Domain Tags</span>
                  <DomainBadgeRow
                    className="ospe-domain-badge-row ospe-domain-badge-row--inline is-stacked"
                    values={item}
                    optionsMap={domainOptionsMap}
                    onChange={(field, value) => onUpdate(item.id, field, value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function OspeActivityPage({ activityData, onAlert, onAssignActivity }) {
  const resolvedActivityData = activityData ?? fallbackOspeActivitySeed
  const activity = resolvedActivityData?.activity ?? resolvedActivityData ?? null
  const record = resolvedActivityData?.record ?? null
  const assignDefaultYear = ASSIGN_YEAR_OPTIONS.includes(record?.year) ? record.year : ASSIGN_YEAR_OPTIONS[0]
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
  const [isActivitySaved, setIsActivitySaved] = useState(false)
  const [isReviewAssignPopupOpen, setIsReviewAssignPopupOpen] = useState(false)
  const [assignThresholds, setAssignThresholds] = useState(() => buildAssignThresholdRows(10))
  const [assignYear, setAssignYear] = useState(assignDefaultYear)
  const [assignSgt, setAssignSgt] = useState('')
  const [isAssignScheduleEnabled, setIsAssignScheduleEnabled] = useState(false)
  const [assignSchedule, setAssignSchedule] = useState({ date: '', time: '', meridiem: 'AM' })
  const [assignContent, setAssignContent] = useState({ form: false, question: true, scaffolding: false })
  const [hasCreatedChecklist, setHasCreatedChecklist] = useState(true)
  const [hasCreatedForm, setHasCreatedForm] = useState(() => generatedModules.form)
  const [hasCreatedScaffolding, setHasCreatedScaffolding] = useState(() => generatedModules.scaffolding)
  const [formUnitOptions, setFormUnitOptions] = useState(defaultFormResponseTypes)
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
    if (!resolvedActivityData?.openReviewAssign) return
    setIsReviewAssignPopupOpen(true)
  }, [resolvedActivityData])

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
    setFormUnitOptions(defaultFormResponseTypes)
    setActiveEditorId('')
    setActiveTab('Checklist')
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
  const formValueOptions = formUnitOptions
  const checklistReady = checklistItems.some((item) => item.text.trim())
  const formReady = !formItems.length || formItems.some((item) => item.questionText.trim() || getVisibleFormResponses(item).some((response) => response.answerText.trim()))
  const canSaveActivity = checklistReady && formReady
  const hasMarks = marksEnabled
  const isCertifiable = certifiableEnabled
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
  const ospeMissingAssignTypes = [
    formCount === 0 ? 'Form' : null,
    scaffoldingCount === 0 ? 'Scaffolding' : null,
  ].filter(Boolean)
  const ospeAssignHelperText = ospeMissingAssignTypes.length
    ? `${ospeMissingAssignTypes.join(' and ')} ${ospeMissingAssignTypes.length > 1 ? 'are' : 'is'} not generated yet. Only student-facing modules created for this activity can be assigned.`
    : ''
  const assignThresholdErrors = useMemo(() => assignThresholds.map((row, index) => {
    const from = Number(row.from)
    const to = Number(row.to)
    const totalMarks = Math.max(1, Number(overallTotalMarks) || 10)
    if (Number.isNaN(from) || Number.isNaN(to)) return 'Enter valid values.'
    if (!row.label.trim()) return 'Label is required.'
    if (from > to) return '`From` must be less than or equal to `To`.'
    if (index === 0 && from !== 0) return 'First row must start at 0.'
    if (index > 0) {
      const previousTo = Number(assignThresholds[index - 1].to)
      if (Math.abs(previousTo - from) > 0.001) return ''
    }
    if (index === assignThresholds.length - 1 && Math.abs(to - totalMarks) > 0.001) {
      return ''
    }
    return ''
  }), [assignThresholds, overallTotalMarks])
  const canProceedAssign = assignThresholdErrors.every((error) => !error)
    && Boolean(assignYear)
    && Boolean(assignSgt)
    && (!isAssignScheduleEnabled || Boolean(assignSchedule.date && assignSchedule.time && assignSchedule.meridiem))
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

  const handleActivityAction = () => {
    if (!isActivitySaved) {
      setIsActivitySaved(true)
      onAlert?.({ tone: 'secondary', message: 'OSPE activity saved successfully.' })
      return
    }
    setAssignThresholds(buildAssignThresholdRows(overallTotalMarks || 10))
    setAssignYear(assignDefaultYear)
    setAssignSgt('')
    setIsAssignScheduleEnabled(false)
    setAssignSchedule({ date: '', time: '', meridiem: 'AM' })
    setAssignContent({
      form: formCount > 0,
      question: false,
      scaffolding: scaffoldingCount > 0,
    })
    setIsReviewAssignPopupOpen(true)
  }

  const updateAssignThreshold = (id, field, value) => {
    setAssignThresholds((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const addAssignThreshold = () => {
    const totalMarks = Math.max(1, Number(overallTotalMarks) || 10)
    const lastRow = assignThresholds[assignThresholds.length - 1]
    setAssignThresholds((current) => [
      ...current.slice(0, -1),
      { ...lastRow, id: `${lastRow.id}-split`, to: lastRow.from },
      { id: `threshold-${Date.now()}`, label: 'New Label', from: lastRow.from, to: String(totalMarks) },
    ])
  }

  const deleteAssignThreshold = (id) => {
    setAssignThresholds((current) => current.filter((row) => row.id !== id))
  }

  const handleProceedAssign = () => {
    if (!canProceedAssign) {
      onAlert?.({ tone: 'warning', message: 'Complete thresholds, year, SGT, and schedule fields before proceeding.' })
      return
    }

    const mappedFormItems = formItems.map((item, index) => ({
      id: item.id ?? `form-${index + 1}`,
      formType: item.formType ?? 'single',
      prompt: item.questionText || `Form ${index + 1}`,
      questionText: item.questionText || `Form ${index + 1}`,
      marks: item.marks ?? '1',
      responses: getVisibleFormResponses(item).map((response, responseIndex) => ({
        key: response.key ?? `${item.id ?? 'form'}-response-${responseIndex + 1}`,
        label: response.label ?? `Response ${responseIndex + 1}`,
      })),
    }))

    const mappedScaffolding = scaffoldItems.map((item, index) => ({
      id: item.id ?? `scaffold-${index + 1}`,
      type: item.type ?? 'Descriptive',
      prompt: item.questionText || `Scaffolding ${index + 1}`,
      questionText: item.questionText || `Scaffolding ${index + 1}`,
      marks: item.marks ?? '1',
      placeholder: 'Complete this mandatory scaffolding response.',
      options: item.options ?? [],
      answerKey: item.answerKey ?? '',
      explanation: item.explanation ?? '',
    }))

    onAssignActivity?.({
      id: activity?.id ?? `ospe-assignment-${Date.now()}`,
      title: activityName,
      type: activity?.type ?? 'OSPE',
      createdDate: new Date().toLocaleDateString('en-GB'),
      attemptCount: '0 / 1',
      status: 'Assigned',
      assignedTo: `${assignYear} • ${assignSgt}`,
      thresholds: assignThresholds,
      schedule: isAssignScheduleEnabled ? assignSchedule : null,
      assignContent,
      examData: {
        assignContent,
        durationMinutes: 30,
        thresholds: assignThresholds,
        schedule: isAssignScheduleEnabled ? assignSchedule : null,
        proctoring: {
          mode: 'Online Proctoring',
          fullscreenRequired: true,
          autoSubmitOnTimeout: true,
        },
        modules: {
          referenceImages: [],
          questions: [],
          form: assignContent.form ? mappedFormItems : [],
          scaffolding: assignContent.scaffolding ? mappedScaffolding : [],
        },
      },
      activityData: {
        ...(resolvedActivityData ?? {}),
        activity: {
          ...(activity ?? {}),
          name: activityName,
          status: 'Assigned',
        },
        record,
      },
    })
    setIsReviewAssignPopupOpen(false)
  }
  const updateChecklist = (id, field, value) => setChecklistItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  const updateForm = (id, field, value) => setFormItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  const updateFormResponse = (id, responseKey, field, value) => setFormItems((current) => current.map((item) => (
    item.id === id
      ? {
          ...item,
          responses: getVisibleFormResponses(item).map((response) => (
            response.key === responseKey ? { ...response, [field]: value } : response
          )),
        }
      : item
  )))
  const addFormResponse = (id) => setFormItems((current) => current.map((item) => {
    if (item.id !== id) return item
    const responses = getVisibleFormResponses(item)
    if (responses.length >= 3) return item
  const nextLabel = `Q${responses.length + 1}`
    return {
      ...item,
      responses: [...responses, createFormResponse(nextLabel, 'Nil', `${id}-${responses.length}`)],
    }
  }))
  const deleteFormResponse = (id, responseKey) => setFormItems((current) => current.map((item) => {
    if (item.id !== id) return item
    const responses = getVisibleFormResponses(item)
    if (responses.length <= 1) return item
    return {
      ...item,
      responses: responses
        .filter((response) => response.key !== responseKey)
        .map((response, index, list) => ({
          ...response,
          label: `Q${index + 1}`,
        })),
    }
  }))
  const addFormUnitOption = (formId, responseKey) => {
    const nextUnit = window.prompt('Enter a new expected response')
    const normalizedUnit = nextUnit?.trim()
    if (!normalizedUnit) return
    setFormUnitOptions((current) => (current.includes(normalizedUnit) ? current : [...current, normalizedUnit]))
    updateFormResponse(formId, responseKey, 'expectedResponse', normalizedUnit)
  }
  const updateScaffold = (id, field, value) => setScaffoldItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  const addChecklist = () => { const next = createChecklistItem(checklistItems.length); setHasCreatedChecklist(true); setChecklistItems((current) => [...current, next]); setActiveEditorId(next.id) }
  const addFormQuestion = (formType = 'single') => {
    const next = {
      ...createFormItem(formItems.length),
      formType,
      questionText: getFormTypeMeta(formType).prompt,
      responses: getFormTypeMeta(formType).responses.map((label, responseIndex) => createFormResponse(
        label,
        'Nil',
        `${formType}-${formItems.length}-${responseIndex}`,
      )),
    }
    setHasCreatedForm(true)
    setFormItems((current) => [...current, next])
    setActiveEditorId(next.id)
    setActiveTab('Form')
  }
  const addScaffoldQuestion = (type) => { const next = createScaffoldItem(type, scaffoldItems.length); setHasCreatedScaffolding(true); setScaffoldItems((current) => [...current, next]); setActiveEditorId(next.id) }
  const deleteChecklist = (id) => { setChecklistItems((current) => current.filter((item) => item.id !== id)); setActiveEditorId((current) => (current === id ? '' : current)); onAlert?.({ tone: 'warning', message: 'Checklist item removed.' }) }
  const deleteForm = (id) => { setFormItems((current) => current.filter((item) => item.id !== id)); setActiveEditorId((current) => (current === id ? '' : current)); onAlert?.({ tone: 'warning', message: 'Form question removed.' }) }
  const deleteScaffold = (id) => { setScaffoldItems((current) => current.filter((item) => item.id !== id)); setActiveEditorId((current) => (current === id ? '' : current)); onAlert?.({ tone: 'warning', message: 'Scaffolding question removed.' }) }
  const generateFormItems = (count) => Array.from({ length: count }, (_, index) => createFormItem(index))
  const handleGenerateFormFromTooltip = () => {
    const nextCount = Math.min(20, Math.max(1, Number(formGenerationCount) || 7))
    const nextItems = generateFormItems(nextCount)
    setHasCreatedForm(true)
    setFormItems(nextItems)
    setActiveEditorId(nextItems[0]?.id ?? '')
    setActiveTab('Form')
    setIsFormTooltipOpen(false)
    onAlert?.({ tone: 'secondary', message: 'Form generated successfully.' })
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
    if (tab === 'Checklist' && checklistItems.length) {
      setActiveEditorId((current) => (checklistItems.some((item) => item.id === current) ? current : checklistItems[0].id))
    }
    if (tab === 'Form' && formItems.length) {
      setActiveEditorId((current) => (formItems.some((item) => item.id === current) ? current : formItems[0].id))
    }
    if (tab === 'Scaffolding' && scaffoldItems.length) {
      setActiveEditorId((current) => (scaffoldItems.some((item) => item.id === current) ? current : scaffoldItems[0].id))
    }
    setIsFormTooltipOpen(false)
    setIsScaffoldingTooltipOpen(false)
    setActiveTab(tab)
  }

  return (
    <section className="ospe-page">
      <div className="ospe-shell">
        <section className="ospe-header-card">
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
                  const TabIcon = tab === 'Checklist' ? ListChecks : tab === 'Form' ? FileText : BookCheck
                  return (
                    <button
                      key={tab}
                      type="button"
                      className={`ospe-tab ${isCurrentTab ? 'is-active' : ''} ${!isAvailable && !isCurrentTab ? 'is-inactive' : ''}`.trim()}
                      onClick={() => handleTabClick(tab)}
                      aria-expanded={tab === 'Form' ? isFormTooltipOpen : tab === 'Scaffolding' ? isScaffoldingTooltipOpen : undefined}
                    >
                      <span className="ospe-tab-icon" aria-hidden="true">
                        <TabIcon size={14} strokeWidth={2} />
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
                <button type="button" className={`tool-btn ${isActivitySaved ? 'ospe-review-assign-btn' : 'green'}`} onClick={handleActivityAction} disabled={isActivitySaved ? false : !canSaveActivity}><BookCheck size={16} strokeWidth={2} /><span>{isActivitySaved ? 'Review / Assign' : 'Save Activity'}</span></button>
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
          <section className="ospe-stage-panel ospe-stage-panel--card">
            <div className="ospe-section-card ospe-section-card--embedded">
              <div className="ospe-section-head"><div><h3>Generated Checklist</h3><p>Use short, observable checklist steps for this station. Keep each item to one measurable action.</p></div><MetaPill tone={hasMarks ? 'success' : 'default'}>{hasMarks ? `Total Marks: ${checklistTotalMarks}` : 'Marks Disabled'}</MetaPill></div>
            </div>
            <div className="ospe-stage-list">{checklistItems.map((item, index) => <ChecklistCard key={item.id} item={item} index={index} isEditing={activeEditorId === item.id} marksEnabled={hasMarks} onActivate={setActiveEditorId} onUpdate={updateChecklist} onDelete={deleteChecklist} />)}</div>
            <div className="ospe-section-actions">
              <button type="button" className="ghost ospe-section-action-btn" onClick={addChecklist}><ListChecks size={16} strokeWidth={2} /><span>Add Checklist</span></button>
            </div>
          </section>
        ) : null}

        {activeTab === 'Form' ? (
          formItems.length ? (
            <section className="ospe-stage-panel ospe-stage-panel--card">
              <div className="ospe-section-card ospe-section-card--embedded">
                <div className="ospe-section-head"><div><h3>Generated Form</h3><p>Generated form items are ready to review, edit, and extend as needed.</p></div><MetaPill tone={hasMarks ? 'success' : 'default'}>{hasMarks ? `Total Marks: ${formTotalMarks}` : 'Marks Disabled'}</MetaPill></div>
              </div>
              <div className="ospe-stage-list">{formItems.map((item, index) => <FormCard key={item.id} item={item} index={index} isEditing={activeEditorId === item.id} marksEnabled={hasMarks} unitOptions={formValueOptions} onActivate={setActiveEditorId} onUpdate={updateForm} onUpdateResponse={updateFormResponse} onAddUnit={addFormUnitOption} onAddResponse={addFormResponse} onDeleteResponse={deleteFormResponse} onDelete={deleteForm} />)}</div>
              <div className="ospe-section-actions">
                <button type="button" className="ghost ospe-section-action-btn" onClick={() => addFormQuestion('single')}><Plus size={16} strokeWidth={2} /><span>Add Form</span></button>
              </div>
            </section>
          ) : hasCreatedForm ? (
            <section className="ospe-stage-panel ospe-stage-panel--card">
              <div className="ospe-section-card ospe-section-card--embedded">
                <div className="ospe-section-head"><div><h3>Generated Form</h3><p>No form items yet. Add a new form item to continue.</p></div><MetaPill tone={hasMarks ? 'success' : 'default'}>{hasMarks ? `Total Marks: ${formTotalMarks}` : 'Marks Disabled'}</MetaPill></div>
              </div>
              <div className="ospe-section-actions">
                <button type="button" className="ghost ospe-section-action-btn" onClick={() => addFormQuestion('single')}><Plus size={16} strokeWidth={2} /><span>Add Form</span></button>
              </div>
            </section>
          ) : null
        ) : null}

        {activeTab === 'Scaffolding' ? (
          scaffoldItems.length ? (
            <section className="ospe-stage-panel ospe-stage-panel--card">
              <div className="ospe-section-card ospe-section-card--embedded">
                <div className="ospe-section-head"><div><h3>Generated Scaffolding</h3><p>Use short, station-linked prompts to guide recognition, interpretation, and application.</p></div><MetaPill tone={hasMarks ? 'success' : 'default'}>{hasMarks ? `Total Marks: ${scaffoldingTotalMarks}` : 'Marks Disabled'}</MetaPill></div>
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
            <section className="ospe-stage-panel ospe-stage-panel--card">
              <div className="ospe-section-card ospe-section-card--embedded">
                <div className="ospe-section-head"><div><h3>Generated Scaffolding</h3><p>No scaffolding prompts yet. Add one short, station-specific question type to continue.</p></div><MetaPill tone={hasMarks ? 'success' : 'default'}>{hasMarks ? `Total Marks: ${scaffoldingTotalMarks}` : 'Marks Disabled'}</MetaPill></div>
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

        <div className="ospe-footer-card">
          <div className="ospe-footer-status">
            <span className={`ospe-footer-status-dot ${readinessSummary.tone}`} aria-hidden="true" />
            <div className="ospe-footer-copy">
              <strong>{readinessSummary.label}</strong>
              <small>{readinessSummary.text}</small>
            </div>
          </div>
          <div className="ospe-footer-actions">
            <button type="button" className={`tool-btn ${isActivitySaved ? 'ospe-review-assign-btn' : 'green'}`} onClick={handleActivityAction} disabled={isActivitySaved ? false : !canSaveActivity}>
              {isActivitySaved ? 'Review / Assign' : 'Save Activity'}
            </button>
          </div>
        </div>

        {isReviewAssignPopupOpen ? createPortal(
          <div className="ospe-review-popup-backdrop" onClick={() => setIsReviewAssignPopupOpen(false)} aria-hidden="true">
            <section className="ospe-review-popup-dialog" onClick={(event) => event.stopPropagation()}>
              <div className="ospe-review-popup-head">
                <div className="ospe-review-popup-copy">
                  <span className="ospe-review-popup-kicker">Configuration &amp; Assign</span>
                  <p>Set the assignment content, threshold configuration, target group, and optional schedule.</p>
                </div>
                <button
                  type="button"
                  className="ospe-review-popup-close"
                  onClick={() => setIsReviewAssignPopupOpen(false)}
                  aria-label="Close Review and Assign"
                >
                  <X size={16} strokeWidth={2.2} />
                </button>
              </div>
              <div className="ospe-assign-content-row">
                <span className="ospe-assign-panel-badge">Assign Type Check :</span>
                {formCount > 0 ? (
                  <label className="ospe-assign-check">
                    <input
                      type="checkbox"
                      checked={assignContent.form}
                      onChange={(event) => setAssignContent((current) => ({ ...current, form: event.target.checked }))}
                    />
                    <span>Form</span>
                  </label>
                ) : null}
                {scaffoldingCount > 0 ? (
                  <label className="ospe-assign-check">
                    <input
                      type="checkbox"
                      checked={assignContent.scaffolding}
                      onChange={(event) => setAssignContent((current) => ({ ...current, scaffolding: event.target.checked }))}
                    />
                    <span>Scaffolding</span>
                  </label>
                ) : null}
              </div>
              {ospeAssignHelperText ? <small className="ospe-assign-helper">{ospeAssignHelperText}</small> : null}
              <div className="ospe-review-popup-foot">
                <div className="ospe-assign-grid">
                  <section className="ospe-assign-panel">
                    <div className="ospe-assign-panel-head">
                      <span className="ospe-assign-panel-badge">Threshold Configuration *</span>
                    </div>
                    <div className="ospe-threshold-list">
                      {assignThresholds.map((row, index) => (
                        <div key={row.id} className="ospe-threshold-row">
                          <input
                            value={row.label}
                            onChange={(event) => updateAssignThreshold(row.id, 'label', event.target.value)}
                            placeholder="Text label"
                          />
                          <input
                            value={row.from}
                            onChange={(event) => updateAssignThreshold(row.id, 'from', event.target.value)}
                            placeholder="0"
                          />
                          <input
                            value={row.to}
                            onChange={(event) => updateAssignThreshold(row.id, 'to', event.target.value)}
                            placeholder="0"
                          />
                          <div className="ospe-threshold-actions">
                            <button
                              type="button"
                              className="ghost ospe-threshold-delete"
                              onClick={() => deleteAssignThreshold(row.id)}
                              disabled={assignThresholds.length === 1}
                              aria-label={`Delete threshold ${index + 1}`}
                            >
                              <Trash2 size={14} strokeWidth={2} />
                            </button>
                            {index === assignThresholds.length - 1 ? (
                              <button type="button" className="ghost ospe-threshold-add" onClick={addAssignThreshold} aria-label="Add threshold">
                                <Plus size={15} strokeWidth={2.2} />
                              </button>
                            ) : <span className="ospe-threshold-add-placeholder" aria-hidden="true" />}
                          </div>
                          {assignThresholdErrors[index] ? (
                            <small className="ospe-assign-error">{assignThresholdErrors[index]}</small>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="ospe-assign-panel">
                    <div className="ospe-assign-panel-head">
                      <span className="ospe-assign-panel-badge">Assigning To *</span>
                    </div>
                    <div className="ospe-assign-targets">
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
                    <label className="ospe-assign-schedule-toggle">
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
                      <div className="ospe-assign-schedule-row">
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
                <div className="ospe-assign-actions">
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

      </div>
    </section>
  )
}

export default OspeActivityPage
