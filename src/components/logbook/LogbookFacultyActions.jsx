import { subjectWriteBlock } from '../../services/logbookPolicy'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import LogbookConfirm from './LogbookConfirm'
import LogbookDrawer from './LogbookDrawer'
import LogbookCompetencySelect from './LogbookCompetencySelect'
import LogbookSamplePreview from './LogbookSamplePreview'
import { CATEGORIES, SUBJECTS } from '../../services/logbookSample'
import { assignEntries, assignmentFields, LEARNERS } from '../../services/adminLogbook'
import { today } from '../../services/logbook'
import { assignmentSamples, assignmentPhases, assignmentCategories, assignmentCategory, sourceAssignmentValues, sampleInstructions, findAssignmentActivity } from '../../services/logbookAssignmentSamples'
import './LogbookFacultyActions.css'

/** Assignment state belongs to this drawer. Document identities remain separate from competency codes. */
export function AssignmentDrawer({ actor, workflow, studentId = '', subject: initialSubject = '', theme, onClose, onChanged }) {
  const initial = actor.departments.includes(initialSubject) ? initialSubject : actor.departments[0]
  const [form, setForm] = useState({ studentId, subject: initial, phase: assignmentPhases(initial)[0] || '', cat: '', due: '', instructions: '', values: {}, activityId: '', mode: assignmentPhases(initial).length ? 'catalogue' : 'manual' })
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [confirmClose, setConfirmClose] = useState(false)
  const change = (key, value) => {
    setError('')
    setForm(current => ({ ...current, [key]: value,
      ...(['subject', 'phase', 'mode', 'cat'].includes(key) ? { values: {}, activityId: '' } : {}),
      ...(['subject', 'phase', 'mode'].includes(key) ? { cat: '' } : {}),
      ...(key === 'subject' ? { phase: assignmentPhases(value)[0] || '', mode: assignmentPhases(value).length ? current.mode : 'manual' } : {}),
    }))
  }
  const sourceMode = form.mode === 'catalogue'
  const phases = assignmentPhases(form.subject)
  const category = sourceMode ? assignmentCategory(form.cat) : form.cat
  const activity = findAssignmentActivity(form.activityId)
  const recipients = form.studentId === 'all' ? LEARNERS : LEARNERS.filter(person => person.id === form.studentId)
  const eligible = recipients.filter(person => !subjectWriteBlock(workflow, person.id, form.subject))
  const manualCategories = SUBJECTS.find(subject => subject.name === form.subject)?.categories || []
  const categories = sourceMode ? assignmentCategories(form.subject, form.phase) : CATEGORIES.filter(row => manualCategories.includes(row.id) && !row.legacy && !['skill', 'cert'].includes(row.id))
  const fields = assignmentFields(category, form.subject)
  const samples = assignmentSamples(form.cat, form.subject, form.phase)
  const lockedValues = activity ? sourceAssignmentValues(activity) : {}
  const selectActivity = id => {
    const selected = findAssignmentActivity(id)
    setForm(current => ({ ...current, activityId: id, values: selected ? sourceAssignmentValues(selected) : {} }))
  }
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      if (sourceMode && !activity) throw new Error('Choose an activity from the document catalogue.')
      const result = await assignEntries(actor, { ...form, cat: category, instructions: form.instructions || (activity ? sampleInstructions(activity) : '') })
      onChanged(`Assigned to ${result.assigned} student${result.assigned === 1 ? '' : 's'}.${result.skipped ? ` ${result.skipped} existing or locked assignments skipped.` : ''}`); onClose()
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  const close = () => { if (form.instructions || Object.keys(form.values).length || form.cat || form.due || form.studentId !== studentId) setConfirmClose(true); else onClose() }
  return <LogbookDrawer title="Assign entry" subtitle="Choose a student and activity to assign for review." variant="form" theme={theme} onClose={close} busy={busy}>
    <form onSubmit={submit} className="faculty-assignment-form">
      <div className="faculty-assignment-body">
        {confirmClose && <LogbookConfirm title="Discard this unfinished assignment?" onCancel={() => setConfirmClose(false)} onConfirm={onClose} confirmLabel="Discard assignment" />}
        {error && <p role="alert" className="lb-error">{error}</p>}
        <fieldset disabled={busy} className="faculty-fieldset faculty-assignment-grid">
          <label className="lb-field"><span>Student <span className="faculty-required" aria-hidden="true">*</span></span><span className="faculty-select"><select required value={form.studentId} onChange={event => change('studentId', event.target.value)}><option value="">Choose student</option><option value="all">Entire sample cohort ({LEARNERS.length} students)</option>{LEARNERS.map(person => <option key={person.id} value={person.id} disabled={Boolean(subjectWriteBlock(workflow, person.id, form.subject))}>{person.name}{subjectWriteBlock(workflow, person.id, form.subject) ? ' · read-only logbook' : ''}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
          <label className="lb-field"><span>Subject <span className="faculty-required" aria-hidden="true">*</span></span><span className="faculty-select"><select required value={form.subject} onChange={event => change('subject', event.target.value)}>{actor.departments.map(subject => <option key={subject}>{subject}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
          <label className="lb-field"><span>Activity source</span><span className="faculty-select"><select value={form.mode} onChange={event => change('mode', event.target.value)}><option value="catalogue" disabled={!phases.length}>Department logbook documents</option><option value="manual">Manual activity</option></select><ChevronDown size={16} aria-hidden="true" /></span></label>
          {sourceMode && <label className="lb-field"><span>Posting phase</span><span className="faculty-select"><select value={form.phase} onChange={event => change('phase', event.target.value)}>{phases.map(phase => <option key={phase}>{phase}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>}
          {!phases.length && <p className="faculty-assignment-note">No document for this subject was supplied in the ZIP. You can assign a manual activity.</p>}
          <label className="lb-field"><span>Log category <span className="faculty-required" aria-hidden="true">*</span></span><span className="faculty-select"><select required value={form.cat} onChange={event => change('cat', event.target.value)}><option value="">Choose category</option>{categories.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
          <label className="lb-field"><span>Due date <span className="faculty-optional">(optional)</span></span><input type="date" min={today()} value={form.due} onChange={event => change('due', event.target.value)} /></label>
          {sourceMode && form.cat && <section className="faculty-assignment-details">
            <LogbookCompetencySelect key={`${form.subject}:${form.phase}:${form.cat}`} subject={form.subject} items={samples} kind="activity" label="Document activity" value={form.activityId} onChange={selectActivity} disabled={busy} />
            {activity && <div className="faculty-source-details"><p>{activity.sample ? 'Sample template — the source table is blank.' : activity.code ? 'Code and topic from the department document.' : 'Topic from the document; no competency code was supplied.'} Source values are locked for this assignment.</p><details><summary>View source</summary><p>{activity.name}</p>{activity.sources.map((source, index) => <p key={index}>{source.file}{source.table ? ` · Table ${source.table}` : ''}{source.row ? ` · Row ${source.row}` : ''}</p>)}</details></div>}
          </section>}
          {fields.length > 0 && (!sourceMode || activity) && <section className="faculty-assignment-details"><div><h3>Activity details</h3><p>Entered details are locked for the student. Completion details remain for the student to fill in.</p></div><div className="faculty-assignment-grid">{fields.map(field => !sourceMode && field.key === 'competency'
            ? <LogbookCompetencySelect key={`${form.subject}:${form.cat}:${field.key}`} subject={form.subject} items={field.key === 'moduleNo' ? [] : undefined} kind={field.key === 'moduleNo' ? 'module' : 'competency'} label={field.label} value={form.values[field.key] || ''} onChange={value => change('values', { ...form.values, [field.key]: value })} disabled={busy} />
            : <label className="lb-field" key={field.key}>{field.label}{field.options ? <span className="faculty-select"><select value={form.values[field.key] || ''} onChange={event => change('values', { ...form.values, [field.key]: event.target.value })}><option value="">Student will complete</option>{field.options.map(option => <option key={option}>{option}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span> : <input type={field.type === 'number' ? 'number' : 'text'} min={1} maxLength={500} readOnly={Object.hasOwn(lockedValues, field.key)} title={form.values[field.key] || ''} value={form.values[field.key] || ''} onChange={event => change('values', { ...form.values, [field.key]: event.target.value })} />}</label>)}</div></section>}
          <label className="lb-field faculty-assignment-instructions"><span>Instructions</span><textarea aria-describedby="assignment-instructions-hint" placeholder="Describe what the student should complete." maxLength={500} rows={3} value={form.instructions} onChange={event => change('instructions', event.target.value)} /><small id="assignment-instructions-hint" className="faculty-optional">{sourceMode ? 'Optional. Selected activities include a standard completion instruction.' : 'Required if no activity details are supplied.'}</small></label>
        </fieldset>
        <p className="lb-muted faculty-assignment-recipients" role="status">{eligible.length} eligible recipient{eligible.length === 1 ? '' : 's'}{recipients.length > eligible.length ? ` · ${recipients.length - eligible.length} locked logbooks will be skipped` : ''}.</p>
        <p className="faculty-assignment-note">Skill and certifiable activities are managed through Skills.</p>
        {sourceMode && <LogbookSamplePreview key={`${form.subject}:${form.phase}:${form.studentId}:${form.due}:${form.instructions}`} actor={actor} subject={form.subject} phase={form.phase} studentId={form.studentId} due={form.due} instructions={form.instructions} onBusy={setBusy} onChanged={onChanged} onClose={onClose} />}
      </div>
      <footer className="lb-drawer-foot"><button className="lb-btn" type="button" disabled={busy} onClick={close}>Cancel</button><button className="lb-btn lb-primary" type="submit" disabled={busy || !eligible.length || (sourceMode && !activity)}>{busy ? 'Assigning…' : `Assign${eligible.length ? ` to ${eligible.length} student${eligible.length === 1 ? '' : 's'}` : ' entry'}`}</button></footer>
    </form>
  </LogbookDrawer>
}

export { default as SignoffList } from './LogbookSignoff'
export { default as ApprovalChain } from './ApprovalChainEditor'
