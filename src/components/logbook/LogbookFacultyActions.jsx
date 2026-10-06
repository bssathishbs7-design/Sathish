import { subjectWriteBlock } from '../../services/logbookPolicy'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import LogbookConfirm from './LogbookConfirm'
import LogbookDrawer from './LogbookDrawer'
import { CATEGORIES, SUBJECTS } from '../../services/logbookSample'
import { assignEntries, assignmentFields, LEARNERS } from '../../services/adminLogbook'
import { today } from '../../services/logbook'
import './LogbookFacultyActions.css'

/** Assignment dialog shares the same modal shell as entry creation and review. */
export function AssignmentDrawer({ actor, workflow, studentId = '', subject: initialSubject = '', theme, onClose, onChanged }) {
  const [form, setForm] = useState({ studentId, subject: actor.departments.includes(initialSubject) ? initialSubject : actor.departments[0], cat: '', due: '', instructions: '', values: {} })
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [confirmClose, setConfirmClose] = useState(false)
  const change = (key, value) => setForm(current => ({ ...current, [key]: value, ...(key === 'subject' ? { cat: '', values: {} } : key === 'cat' ? { values: {} } : {}) }))
  const submit = async event => { event.preventDefault(); setBusy(true); setError(''); try { const result = await assignEntries(actor, form); onChanged(`Assigned to ${result.assigned} student${result.assigned === 1 ? '' : 's'}.${result.skipped ? ` ${result.skipped} signed-off or in-review logbooks skipped.` : ''}`); onClose() } catch (failure) { setError(failure.message) } finally { setBusy(false) } }
  const recipients = form.studentId === 'all' ? LEARNERS : LEARNERS.filter(person => person.id === form.studentId)
  const eligible = recipients.filter(person => !subjectWriteBlock(workflow, person.id, form.subject))
  const categories = (SUBJECTS.find(subject => subject.name === form.subject)?.categories || []).filter(id => !['skill', 'cert'].includes(id))
  const fields = assignmentFields(form.cat, form.subject)
  const close = () => { if (form.instructions || Object.keys(form.values).length || form.cat || form.due || form.studentId !== studentId) setConfirmClose(true); else onClose() }
  return <LogbookDrawer title="Assign entry" subtitle="Choose a student and activity to assign for review." variant="form" theme={theme} onClose={close} busy={busy}>
    <form onSubmit={submit} className="faculty-assignment-form">
      <div className="faculty-assignment-body">
        {confirmClose && <LogbookConfirm title="Discard this unfinished assignment?" onCancel={() => setConfirmClose(false)} onConfirm={onClose} confirmLabel="Discard assignment" />}{error && <p role="alert" className="lb-error">{error}</p>}
        <fieldset disabled={busy} className="faculty-fieldset faculty-assignment-grid">
          <label className="lb-field"><span>Student <span className="faculty-required" aria-hidden="true">*</span></span><span className="faculty-select"><select required value={form.studentId} onChange={event => change('studentId', event.target.value)}><option value="">Choose student</option><option value="all">Entire sample cohort ({LEARNERS.length} students)</option>{LEARNERS.map(person => <option key={person.id} value={person.id} disabled={Boolean(subjectWriteBlock(workflow, person.id, form.subject))}>{person.name}{subjectWriteBlock(workflow, person.id, form.subject) ? ' · read-only logbook' : ''}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
          <label className="lb-field"><span>Subject <span className="faculty-required" aria-hidden="true">*</span></span><span className="faculty-select"><select required value={form.subject} onChange={event => change('subject', event.target.value)}>{actor.departments.map(subject => <option key={subject}>{subject}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
          <label className="lb-field"><span>Log category <span className="faculty-required" aria-hidden="true">*</span></span><span className="faculty-select"><select required value={form.cat} onChange={event => change('cat', event.target.value)}><option value="">Choose category</option>{CATEGORIES.filter(category => categories.includes(category.id)).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
          <label className="lb-field"><span>Due date <span className="faculty-optional">(optional)</span></span><input type="date" min={today()} value={form.due} onChange={event => change('due', event.target.value)} /></label>
          {fields.length > 0 && <section className="faculty-assignment-details"><div><h3>Activity details</h3><p>Provide at least one activity detail or write instructions below. Entered details are locked for the student.</p></div><div className="faculty-assignment-grid">{fields.map(field => <label className="lb-field" key={field.key}>{field.label}{field.options ? <span className="faculty-select"><select value={form.values[field.key] || ''} onChange={event => change('values', { ...form.values, [field.key]: event.target.value })}><option value="">Student will complete</option>{field.options.map(option => <option key={option}>{option}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span> : <input type={field.type === 'number' ? 'number' : 'text'} min={1} maxLength={500} value={form.values[field.key] || ''} onChange={event => change('values', { ...form.values, [field.key]: event.target.value })} />}</label>)}</div></section>}
          <label className="lb-field faculty-assignment-instructions"><span>Instructions</span><textarea aria-describedby="assignment-instructions-hint" placeholder="Describe what the student should complete." maxLength={500} rows={3} value={form.instructions} onChange={event => change('instructions', event.target.value)} /><small id="assignment-instructions-hint" className="faculty-optional">Required if no activity details are supplied.</small></label>
        </fieldset>
      <p className="lb-muted faculty-assignment-recipients" role="status">{eligible.length} eligible recipient{eligible.length === 1 ? '' : 's'}{recipients.length > eligible.length ? ` · ${recipients.length - eligible.length} signed-off or in-review logbooks will be skipped` : ''}.</p>
      </div>
      <footer className="lb-drawer-foot"><button className="lb-btn" type="button" disabled={busy} onClick={close}>Cancel</button><button className="lb-btn lb-primary" type="submit" disabled={busy || !eligible.length}>{busy ? 'Assigning...' : !eligible.length ? 'Assign entry' : `Assign to ${eligible.length} student${eligible.length === 1 ? '' : 's'}`}</button></footer>
    </form>
  </LogbookDrawer>
}

export { default as SignoffList } from './LogbookSignoff'

export { default as ApprovalChain } from './ApprovalChainEditor'
