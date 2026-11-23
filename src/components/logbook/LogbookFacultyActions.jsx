import { ChevronDown, X } from 'lucide-react'
import AssessmentAssignmentFields from '../AssessmentAssignmentFields'
import ManagementMultiSelect from '../ManagementMultiSelect'
import { useState } from 'react'
import LogbookConfirm from './LogbookConfirm'
import LogbookDrawer from './LogbookDrawer'
import AssignmentSection from './AssignmentSection'
import LogbookCompetencySelect from './LogbookCompetencySelect'
import { CATEGORIES, SUBJECTS } from '../../services/logbookSample'
import { assignEntries, assignmentFields } from '../../services/adminLogbook'
import { today } from '../../services/logbook'
import { assignmentSamples, assignmentPhases, assignmentCategories, assignmentCategory, sourceAssignmentValues, sampleInstructions, findAssignmentActivity } from '../../services/logbookAssignmentSamples'
import './LogbookFacultyActions.css'

/** Assignment state belongs to this drawer. Document identities remain separate from competency codes. */
export function AssignmentDrawer({ actor, workflow, studentId = '', subject: initialSubject = '', theme, onClose, onChanged }) {
  const initial = actor.departments.includes(initialSubject) ? initialSubject : actor.departments[0]
  const [form, setForm] = useState({ studentId, subject: initial, phase: assignmentPhases(initial)[0] || '', cat: '', due: '', instructions: '', values: {}, activityId: '' })
  const [entryMode, setEntryMode] = useState('')
  const [manualValues, setManualValues] = useState({})
  const [recipients, setRecipients] = useState({ assignBatch: '', assignYear: '', assignGroups: [], assignStudentIds: [] })
  const [recipientsValid, setRecipientsValid] = useState(false)
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [confirmClose, setConfirmClose] = useState(false)
  const [step, setStep] = useState(1)
  const [pendingSelection, setPendingSelection] = useState(null)
  const recentKey = `medsy-logbook-assignment-recent:${actor.id}`
  const [recent] = useState(() => { try { const saved = JSON.parse(localStorage.getItem(recentKey) || '[]'); return Array.isArray(saved) ? saved : [] } catch { return [] } })
  const change = (key, value) => {
    setError('')
    if (['subject', 'phase', 'cat'].includes(key)) setManualValues({})
    setForm(current => ({ ...current, [key]: value,
      ...(['subject', 'phase', 'cat'].includes(key) ? { values: {}, activityId: '' } : {}),
      ...(['subject', 'phase'].includes(key) ? { cat: '' } : {}),
      ...(key === 'subject' ? { phase: assignmentPhases(value)[0] || '' } : {}),
    }))
  }
  const phases = assignmentPhases(form.subject)
  const selectScope = (key, value) => {
    if (form[key] === value) return
    if (form.activityId || Object.keys(form.values).length || Object.keys(manualValues).length) setPendingSelection({ key, value })
    else change(key, value)
  }
  const sourceMode = entryMode === 'predefined'
  const category = assignmentCategory(form.cat)
  const activity = sourceMode ? findAssignmentActivity(form.activityId) : null
  const values = sourceMode ? form.values : manualValues
  const changeValue = (key, value) => sourceMode ? change('values', { ...form.values, [key]: value }) : setManualValues(current => ({ ...current, [key]: value }))
  const selectedDepartments = (manualValues.depts || '').split('; ').filter(Boolean)
  const updateDepartments = departments => changeValue('depts', departments.join('; '))
  const excludedStudentIds = Object.values(workflow?.signoffs || {}).filter(record => record.subject === form.subject && ['Submitted', 'Completed'].includes(record.status)).map(record => record.studentId)
  const eligible = recipients.assignStudentIds.filter(id => !excludedStudentIds.includes(id))
  const manualCategories = SUBJECTS.find(subject => subject.name === form.subject)?.categories || []
  const categories = phases.length ? assignmentCategories(form.subject, form.phase) : CATEGORIES.filter(row => manualCategories.includes(row.id) && !row.legacy && !['skill', 'cert'].includes(row.id))
  const fields = assignmentFields(category, form.subject).filter(field => !sourceMode || field.key !== 'competency')
  const samples = assignmentSamples(form.cat, form.subject, form.phase)
  const lockedValues = activity ? sourceAssignmentValues(activity) : {}
  const scopeReady = Boolean(form.subject && categories.some(row => row.id === form.cat))
  const detailError = !entryMode ? 'Choose an entry source.'
    : sourceMode && !activity ? 'Choose a document activity.'
      : fields.some(field => (!sourceMode && field.required && !String(values[field.key] || '').trim())) ? 'Complete the required activity details.'
        : !sourceMode && !form.instructions.trim() && !Object.values(values).some(value => String(value).trim()) ? 'Add activity details or instructions.'
          : form.due && (!/^\d{4}-\d{2}-\d{2}$/.test(form.due) || Number.isNaN(Date.parse(form.due)) || new Date(form.due).toISOString().slice(0, 10) !== form.due || form.due < today()) ? 'Choose a valid due date from today onwards.' : ''
  const detailsReady = scopeReady && !detailError
  const openStep = next => { setStep(next); setError(''); requestAnimationFrame(() => document.querySelector('.assignment-section.is-open > h3 > button')?.focus()) }
  const continueStep = next => {
    if (next === 2 && !scopeReady) { setError('Choose a subject and log category.'); return }
    if (next === 3 && detailError) { setError(detailError); return }
    openStep(next)
  }
  const selectActivity = id => {
    const selected = findAssignmentActivity(id)
    setForm(current => ({ ...current, activityId: id, values: selected ? sourceAssignmentValues(selected) : {} }))
  }
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      if (!scopeReady) { setStep(1); throw new Error('Choose a subject and log category.') }
      if (detailError) { setStep(2); throw new Error(detailError) }
      if (!entryMode) throw new Error('Choose an entry source.')
      if (!recipientsValid) throw new Error('Choose a batch, year and eligible students.')
      if (sourceMode && !activity) throw new Error('Choose an activity from the document catalogue.')
      const result = await assignEntries(actor, { ...form, values, activityId: sourceMode ? form.activityId : '', entryMode, recipientScope: recipients, cat: category, instructions: form.instructions || (activity ? sampleInstructions(activity) : '') })
      try { localStorage.setItem(recentKey, JSON.stringify([{ subject: form.subject, cat: form.cat }, ...recent.filter(row => row.subject !== form.subject || row.cat !== form.cat)].slice(0, 6))) } catch { /* Assignment succeeded; optional recent history can be unavailable. */ }
      onChanged(`Assigned to ${result.assigned} student${result.assigned === 1 ? '' : 's'}.${result.skipped ? ` ${result.skipped} existing or locked assignments skipped.` : ''}`); onClose()
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  const close = () => { if (form.instructions || Object.keys(form.values).length || Object.keys(manualValues).length || form.cat || form.due || form.studentId !== studentId || recipients.assignBatch) setConfirmClose(true); else onClose() }
  return <LogbookDrawer title="Assign entry" subtitle="Choose students and an activity to assign for review." variant="form" theme={theme} onClose={close} busy={busy}>
    <form onSubmit={submit} noValidate className="faculty-assignment-form">
      <div className="faculty-assignment-body">
        {confirmClose && <LogbookConfirm modal theme={theme} title="Discard this unfinished assignment?" onCancel={() => setConfirmClose(false)} onConfirm={onClose} confirmLabel="Discard assignment" />}
        {pendingSelection && <LogbookConfirm modal theme={theme} title="Change this selection?" onCancel={() => setPendingSelection(null)} onConfirm={() => { change(pendingSelection.key, pendingSelection.value); setPendingSelection(null); openStep(1) }} confirmLabel="Change selection"><p>This clears the selected activity and its details in both entry modes. Instructions, due date and student selections will be kept.</p></LogbookConfirm>}
        {error && <p role="alert" className="lb-error">{error}</p>}
        <p className="assignment-required-note"><span>*</span> Required fields</p>
        <fieldset disabled={busy} className="faculty-fieldset faculty-assignment-steps">
          <AssignmentSection number={1} title="Subject & category" summary={scopeReady ? `${form.subject} · ${categories.find(row => row.id === form.cat)?.name}` : 'Choose where this learning belongs'} open={step === 1} complete={scopeReady} onToggle={() => openStep(step === 1 ? 0 : 1)}>
          <div className="assignment-section-full"><LogbookCompetencySelect overlay label="Subject *" subject={form.subject} kind="subject" items={actor.departments.map((name, index) => ({ id: String(index), code: '', name }))} value={String(actor.departments.indexOf(form.subject))} onChange={id => selectScope('subject', actor.departments[Number(id)])} disabled={busy} /></div>
          <div className="assignment-section-full"><LogbookCompetencySelect overlay label="Log category *" subject={form.subject} kind="category" items={categories.map(row => ({ id: row.id, code: '', name: row.name }))} value={form.cat} onChange={id => selectScope('cat', id)} disabled={busy || !form.subject} /></div>
          {recent.some(row => row.subject === form.subject && categories.some(cat => cat.id === row.cat)) && <div className="assignment-recent"><span>Recently used</span>{recent.filter(row => row.subject === form.subject && categories.some(cat => cat.id === row.cat)).slice(0, 3).map(row => <button type="button" className="lb-btn" key={row.cat} onClick={() => selectScope('cat', row.cat)}>{categories.find(cat => cat.id === row.cat)?.name}</button>)}</div>}
          <div className="assignment-section-continue"><button type="button" className="lb-btn lb-primary" onClick={() => continueStep(2)}>Continue</button></div>
          </AssignmentSection>
          <AssignmentSection number={2} title="Activity details" summary={!scopeReady ? 'Select a subject and category first' : detailsReady ? `${sourceMode ? 'Predefined Log' : 'New Log Entry'} · ${values.topic || values.activity || activity?.name || 'Details completed'}` : 'Choose an entry source and describe the activity'} open={step === 2} complete={detailsReady} disabled={!scopeReady} onToggle={() => openStep(step === 2 ? 0 : 2)}>
          <div className="lb-field"><span>Entry source <span className="faculty-required" aria-hidden="true">*</span></span><div className="faculty-entry-mode" role="group" aria-label="Entry source (required)">{[['predefined', 'Predefined Log'], ['manual', 'New Log Entry']].map(([mode, label]) => <button type="button" key={mode} aria-pressed={entryMode === mode} onClick={() => { setEntryMode(mode); setError('') }}>{label}</button>)}</div></div>
          <label className="lb-field"><span>Due date <span className="faculty-optional">(optional)</span></span><input type="date" min={today()} value={form.due} onChange={event => change('due', event.target.value)} /></label>
          {entryMode && ((sourceMode && form.cat) || (!sourceMode && fields.length > 0)) && <section className="faculty-assignment-details">
          {sourceMode && form.cat && <>
            {!samples.length && <p className="faculty-empty-catalogue">No predefined activities for this category. <button type="button" className="lb-btn" onClick={() => setEntryMode('manual')}>Create new log entry</button></p>}
            <LogbookCompetencySelect overlay key={`${form.subject}:${form.phase}:${form.cat}`} subject={form.subject} items={samples} kind="activity" label="Document activity" value={form.activityId} onChange={selectActivity} disabled={busy} />
          </>}
          {fields.length > 0 && (!sourceMode || activity) && <><div className="faculty-assignment-grid">{fields.map(field => !sourceMode && field.key === 'depts' ? <div key={field.key} className="faculty-integrated-departments"><ManagementMultiSelect label={field.label} options={SUBJECTS.map(subject => ({ value: subject.name, label: subject.label || subject.name }))} value={selectedDepartments} onChange={updateDepartments} disabled={busy} floating compact allowSelectAll placeholder="Select departments" searchLabel="Search departments" emptyLabel="No matching departments." />{selectedDepartments.length > 0 && <><small className="faculty-department-count">{selectedDepartments.length} selected</small><div className="faculty-department-chips">{selectedDepartments.map(name => <button type="button" key={name} disabled={busy} title={`Remove ${name}`} aria-label={`Remove ${name}`} onClick={() => updateDepartments(selectedDepartments.filter(item => item !== name))}><span>{SUBJECTS.find(subject => subject.name === name)?.label || name}</span><X size={14} aria-hidden="true" /></button>)}</div></>}</div> : !sourceMode && field.key === 'competency' ? <LogbookCompetencySelect key={`${form.subject}:${form.cat}:competency`} overlay subject={form.subject} label={field.label} value={values.competency || ''} onChange={value => changeValue('competency', value)} disabled={busy} /> : <label className={`lb-field${['topic', 'activity', 'competency', 'depts'].includes(field.key) ? ' faculty-topic-field' : ''}`} key={field.key}>{field.label}{field.options ? <span className="faculty-select"><select required={!sourceMode && field.required} value={values[field.key] || ''} onChange={event => changeValue(field.key, event.target.value)}><option value="">Student will complete</option>{field.options.map(option => <option key={option}>{option}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span> : <input required={!sourceMode && field.required} type={field.type === 'number' ? 'number' : 'text'} min={1} maxLength={500} readOnly={field.key !== 'topic' && Object.hasOwn(lockedValues, field.key)} title={values[field.key] || ''} value={values[field.key] || ''} onChange={event => changeValue(field.key, event.target.value)} />}</label>)}</div></>}
          </section>}
          <label className="lb-field faculty-assignment-instructions"><span>Instructions</span><textarea placeholder="Describe what the student should complete." maxLength={500} rows={3} value={form.instructions} onChange={event => change('instructions', event.target.value)} /></label>
          <div className="assignment-section-continue"><button type="button" className="lb-btn lb-primary" onClick={() => continueStep(3)}>Continue</button></div>
          </AssignmentSection>
          <AssignmentSection number={3} title="Assign to students" summary={!detailsReady ? 'Complete the activity details first' : recipientsValid && eligible.length ? `${eligible.length} students · ${recipients.assignYear} · Batch ${recipients.assignBatch}` : 'Choose the batch, year and students'} open={step === 3} complete={detailsReady && recipientsValid && eligible.length > 0} disabled={!detailsReady} onToggle={() => openStep(step === 3 ? 0 : 3)}>
          <div className="faculty-recipient-selector"><AssessmentAssignmentFields value={recipients} onChange={setRecipients} onValidityChange={setRecipientsValid} excludedStudentIds={excludedStudentIds} disabled={busy || !detailsReady} /></div>
          </AssignmentSection>
        </fieldset>
      </div>
      <footer className="lb-drawer-foot"><button className="lb-btn" type="button" disabled={busy} onClick={close}>Cancel</button><button className="lb-btn lb-primary" type="submit" disabled={busy || !detailsReady || !recipientsValid || !eligible.length || (sourceMode && !activity)}>{busy ? 'Assigning…' : `Assign${eligible.length ? ` to ${eligible.length} student${eligible.length === 1 ? '' : 's'}` : ' entry'}`}</button></footer>
    </form>
  </LogbookDrawer>
}

export { default as SignoffList } from './LogbookSignoff'
export { default as ApprovalChain } from './ApprovalChainEditor'
