import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import LogbookDrawer from './LogbookDrawer'
import { CATEGORIES, SUBJECTS } from '../../services/logbookSample'
import { actorName, assignEntries, assignmentFields, DEFAULT_CHAIN, LEARNERS, REVIEWERS, saveApprovalChain } from '../../services/adminLogbook'
import { today } from '../../services/logbook'
import './LogbookFacultyActions.css'

/** Assignment dialog shares the same modal shell as entry creation and review. */
export function AssignmentDrawer({ actor, studentId = '', theme, onClose, onChanged }) {
  const [form, setForm] = useState({ studentId, subject: actor.departments[0], cat: '', due: '', instructions: '', values: {} })
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const change = (key, value) => setForm(current => ({ ...current, [key]: value, ...(key === 'subject' ? { cat: '', values: {} } : key === 'cat' ? { values: {} } : {}) }))
  const submit = async event => { event.preventDefault(); setBusy(true); setError(''); try { await assignEntries(actor, form); onChanged('Entry assigned.'); onClose() } catch (failure) { setError(failure.message) } finally { setBusy(false) } }
  const categories = SUBJECTS.find(subject => subject.name === form.subject)?.categories || []
  const fields = assignmentFields(form.cat, form.subject)
  const close = () => { if (!(form.instructions || Object.keys(form.values).length || form.cat) || window.confirm('Discard this unfinished assignment?')) onClose() }
  return <LogbookDrawer title="Assign entry" subtitle="Choose a student and activity to assign for review." variant="form" theme={theme} onClose={close} busy={busy}>
    <form onSubmit={submit} className="faculty-assignment-form">
      <div className="faculty-assignment-body">
        {error && <p role="alert" className="lb-error">{error}</p>}
        <fieldset disabled={busy} className="faculty-fieldset faculty-assignment-grid">
          <label className="lb-field"><span>Student <span className="faculty-required" aria-hidden="true">*</span></span><span className="faculty-select"><select required value={form.studentId} onChange={event => change('studentId', event.target.value)}><option value="">Choose student</option><option value="all">Entire cohort</option>{LEARNERS.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
          <label className="lb-field"><span>Subject <span className="faculty-required" aria-hidden="true">*</span></span><span className="faculty-select"><select required value={form.subject} onChange={event => change('subject', event.target.value)}>{actor.departments.map(subject => <option key={subject}>{subject}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
          <label className="lb-field"><span>Log category <span className="faculty-required" aria-hidden="true">*</span></span><span className="faculty-select"><select required value={form.cat} onChange={event => change('cat', event.target.value)}><option value="">Choose category</option>{CATEGORIES.filter(category => categories.includes(category.id)).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
          <label className="lb-field">Due date <span className="faculty-optional">Optional</span><input type="date" min={today()} value={form.due} onChange={event => change('due', event.target.value)} /></label>
          {fields.length > 0 && <section className="faculty-assignment-details"><div><h3>Activity details</h3><p>Optional. Enter values to fix them for the student; leave blank for the student to complete.</p></div><div className="faculty-assignment-grid">{fields.map(field => <label className="lb-field" key={field.key}>{field.label}{field.options ? <span className="faculty-select"><select value={form.values[field.key] || ''} onChange={event => change('values', { ...form.values, [field.key]: event.target.value })}><option value="">Student will complete</option>{field.options.map(option => <option key={option}>{option}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span> : <input type={field.type === 'number' ? 'number' : 'text'} min={1} maxLength={500} value={form.values[field.key] || ''} onChange={event => change('values', { ...form.values, [field.key]: event.target.value })} />}</label>)}</div></section>}
          <label className="lb-field faculty-assignment-instructions">Instructions <span className="faculty-optional">Optional</span><textarea placeholder="Describe what the student should complete." maxLength={2000} rows={3} value={form.instructions} onChange={event => change('instructions', event.target.value)} /></label>
        </fieldset>
      </div>
      <footer className="lb-drawer-foot"><button className="lb-btn" type="button" disabled={busy} onClick={close}>Cancel</button><button className="lb-btn lb-primary" type="submit" disabled={busy}>{busy ? 'Assigning...' : 'Assign entry'}</button></footer>
    </form>
  </LogbookDrawer>
}

export { default as SignoffList } from './LogbookSignoff'

export function ApprovalChain({ chain, subject, actor, onChanged }) {
  const [draft, setDraft] = useState(chain), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const move = (index, direction) => { const next = [...draft]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; setDraft(next) }
  return <details className="lb-card"><summary>Configure approval chain</summary><p className="lb-muted">Applies to new submissions. In-progress logbooks keep their original chain.</p>{error && <p role="alert" className="lb-error">{error}</p>}<fieldset disabled={busy} className="faculty-fieldset lb-stack">{draft.map((id, index) => <div className="lb-actions" key={id}><span>{index + 1}. {actorName(id)}</span><button className="lb-btn" disabled={index === 0} onClick={() => move(index, -1)}>Move up</button><button className="lb-btn" disabled={index === draft.length - 1} onClick={() => move(index, 1)}>Move down</button><button className="lb-btn" disabled={draft.length === 1} onClick={() => setDraft(draft.filter(value => value !== id))}>Remove</button></div>)}<label className="lb-field">Add approver<select value="" onChange={event => setDraft([...draft, event.target.value])}><option value="">Choose approver</option>{REVIEWERS.filter(person => !draft.includes(person.id)).map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><div className="lb-actions"><button className="lb-btn" onClick={() => setDraft(DEFAULT_CHAIN)}>Reset chain</button><button className="lb-btn lb-primary" onClick={async () => { setBusy(true); setError(''); try { await saveApprovalChain(draft, subject, actor); onChanged('Approval chain saved.') } catch (failure) { setError(failure.message) } finally { setBusy(false) } }}>{busy ? 'Saving…' : 'Save chain'}</button></div></fieldset></details>
}
