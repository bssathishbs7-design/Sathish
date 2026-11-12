import { ChevronDown } from 'lucide-react'
import AssessmentAssignmentFields from '../AssessmentAssignmentFields'
import { useState } from 'react'
import LogbookConfirm from './LogbookConfirm'
import LogbookDrawer from './LogbookDrawer'
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
  const [recipients, setRecipients] = useState({ assignBatch: '', assignYear: '', assignGroups: [], assignStudentIds: [] })
  const [recipientsValid, setRecipientsValid] = useState(false)
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [confirmClose, setConfirmClose] = useState(false)
  const change = (key, value) => {
    setError('')
    setForm(current => ({ ...current, [key]: value,
      ...(['subject', 'phase', 'cat'].includes(key) ? { values: {}, activityId: '' } : {}),
      ...(['subject', 'phase'].includes(key) ? { cat: '' } : {}),
      ...(key === 'subject' ? { phase: assignmentPhases(value)[0] || '' } : {}),
    }))
  }
  const phases = assignmentPhases(form.subject)
  const sourceMode = phases.length > 0
  const category = sourceMode ? assignmentCategory(form.cat) : form.cat
  const activity = findAssignmentActivity(form.activityId)
  const excludedStudentIds = Object.values(workflow?.signoffs || {}).filter(record => record.subject === form.subject && ['Submitted', 'Completed'].includes(record.status)).map(record => record.studentId)
  const eligible = recipients.assignStudentIds.filter(id => !excludedStudentIds.includes(id))
  const manualCategories = SUBJECTS.find(subject => subject.name === form.subject)?.categories || []
  const categories = sourceMode ? assignmentCategories(form.subject, form.phase) : CATEGORIES.filter(row => manualCategories.includes(row.id) && !row.legacy && !['skill', 'cert'].includes(row.id))
  const fields = assignmentFields(category, form.subject).filter(field => !sourceMode || field.key !== 'competency')
  const samples = assignmentSamples(form.cat, form.subject, form.phase)
  const lockedValues = activity ? sourceAssignmentValues(activity) : {}
  const selectActivity = id => {
    const selected = findAssignmentActivity(id)
    setForm(current => ({ ...current, activityId: id, values: selected ? sourceAssignmentValues(selected) : {} }))
  }
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      if (!recipientsValid) throw new Error('Choose a batch, year and eligible students.')
      if (sourceMode && !activity) throw new Error('Choose an activity from the document catalogue.')
      const result = await assignEntries(actor, { ...form, recipientScope: recipients, cat: category, instructions: form.instructions || (activity ? sampleInstructions(activity) : '') })
      onChanged(`Assigned to ${result.assigned} student${result.assigned === 1 ? '' : 's'}.${result.skipped ? ` ${result.skipped} existing or locked assignments skipped.` : ''}`); onClose()
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  const close = () => { if (form.instructions || Object.keys(form.values).length || form.cat || form.due || form.studentId !== studentId || recipients.assignBatch) setConfirmClose(true); else onClose() }
  return <LogbookDrawer title="Assign entry" subtitle="Choose students and an activity to assign for review." variant="form" theme={theme} onClose={close} busy={busy}>
    <form onSubmit={submit} className="faculty-assignment-form">
      <div className="faculty-assignment-body">
        {confirmClose && <LogbookConfirm title="Discard this unfinished assignment?" onCancel={() => setConfirmClose(false)} onConfirm={onClose} confirmLabel="Discard assignment" />}
        {error && <p role="alert" className="lb-error">{error}</p>}
        <fieldset disabled={busy} className="faculty-fieldset faculty-assignment-grid">
          <div className="faculty-recipient-selector"><AssessmentAssignmentFields value={recipients} onChange={setRecipients} onValidityChange={setRecipientsValid} excludedStudentIds={excludedStudentIds} disabled={busy} /></div>
          <label className="lb-field"><span>Subject <span className="faculty-required" aria-hidden="true">*</span></span><span className="faculty-select"><select required value={form.subject} onChange={event => change('subject', event.target.value)}>{actor.departments.map(subject => <option key={subject}>{subject}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
          {!phases.length && <p className="faculty-assignment-note">No document for this subject was supplied in the ZIP. You can assign a manual activity.</p>}
          <label className="lb-field"><span>Log category <span className="faculty-required" aria-hidden="true">*</span></span><span className="faculty-select"><select required value={form.cat} onChange={event => change('cat', event.target.value)}><option value="">Choose category</option>{categories.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
          <label className="lb-field"><span>Due date <span className="faculty-optional">(optional)</span></span><input type="date" min={today()} value={form.due} onChange={event => change('due', event.target.value)} /></label>
          {((sourceMode && form.cat) || (!sourceMode && fields.length > 0)) && <section className="faculty-assignment-details">
          {sourceMode && form.cat && <>
            <LogbookCompetencySelect key={`${form.subject}:${form.phase}:${form.cat}`} subject={form.subject} items={samples} kind="activity" label="Document activity" value={form.activityId} onChange={selectActivity} disabled={busy} />
          </>}
          {fields.length > 0 && (!sourceMode || activity) && <><div className="faculty-assignment-grid">{fields.map(field => !sourceMode && field.key === 'competency'
            ? <LogbookCompetencySelect key={`${form.subject}:${form.cat}:${field.key}`} subject={form.subject} items={field.key === 'moduleNo' ? [] : undefined} kind={field.key === 'moduleNo' ? 'module' : 'competency'} label={field.label} value={form.values[field.key] || ''} onChange={value => change('values', { ...form.values, [field.key]: value })} disabled={busy} />
            : <label className={`lb-field${field.key === 'topic' ? ' faculty-topic-field' : ''}`} key={field.key}>{field.label}{field.options ? <span className="faculty-select"><select value={form.values[field.key] || ''} onChange={event => change('values', { ...form.values, [field.key]: event.target.value })}><option value="">Student will complete</option>{field.options.map(option => <option key={option}>{option}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span> : <input type={field.type === 'number' ? 'number' : 'text'} min={1} maxLength={500} readOnly={field.key !== 'topic' && Object.hasOwn(lockedValues, field.key)} title={form.values[field.key] || ''} value={form.values[field.key] || ''} onChange={event => change('values', { ...form.values, [field.key]: event.target.value })} />}</label>)}</div></>}
          </section>}
          <label className="lb-field faculty-assignment-instructions"><span>Instructions</span><textarea placeholder="Describe what the student should complete." maxLength={500} rows={3} value={form.instructions} onChange={event => change('instructions', event.target.value)} /></label>
        </fieldset>
      </div>
      <footer className="lb-drawer-foot"><button className="lb-btn" type="button" disabled={busy} onClick={close}>Cancel</button><button className="lb-btn lb-primary" type="submit" disabled={busy || !recipientsValid || !eligible.length || (sourceMode && !activity)}>{busy ? 'Assigning…' : `Assign${eligible.length ? ` to ${eligible.length} student${eligible.length === 1 ? '' : 's'}` : ' entry'}`}</button></footer>
    </form>
  </LogbookDrawer>
}

export { default as SignoffList } from './LogbookSignoff'
export { default as ApprovalChain } from './ApprovalChainEditor'
