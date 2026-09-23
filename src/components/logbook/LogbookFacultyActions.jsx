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
  return <LogbookDrawer title="Assign entry" subtitle="Students complete the activity and submit it to you for review." theme={theme} onClose={() => { if (!(form.instructions || Object.keys(form.values).length || form.cat) || window.confirm('Discard this unfinished assignment?')) onClose() }} busy={busy}><form onSubmit={submit} className="lb-drawer-body lb-stack">{error && <p role="alert" className="lb-error">{error}</p>}<fieldset disabled={busy} className="lb-stack faculty-fieldset">
    <label className="lb-field">Student<select required value={form.studentId} onChange={event => change('studentId', event.target.value)}><option value="">Choose student</option><option value="all">Entire cohort</option>{LEARNERS.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
    <label className="lb-field">Subject<select value={form.subject} onChange={event => change('subject', event.target.value)}>{actor.departments.map(subject => <option key={subject}>{subject}</option>)}</select></label>
    <label className="lb-field">Log category<select required value={form.cat} onChange={event => change('cat', event.target.value)}><option value="">Choose category</option>{CATEGORIES.filter(category => categories.includes(category.id)).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
    {assignmentFields(form.cat, form.subject).map(field => <label className="lb-field" key={field.key}>{field.label}{field.options ? <select value={form.values[field.key] || ''} onChange={event => change('values', { ...form.values, [field.key]: event.target.value })}><option value="">Student will complete</option>{field.options.map(option => <option key={option}>{option}</option>)}</select> : <input type={field.type === 'number' ? 'number' : 'text'} min={1} maxLength={500} value={form.values[field.key] || ''} onChange={event => change('values', { ...form.values, [field.key]: event.target.value })} />}<small>Values entered here are fixed for the student.</small></label>)}
    <label className="lb-field">Due date (optional)<input type="date" min={today()} value={form.due} onChange={event => change('due', event.target.value)} /></label>
    <label className="lb-field">Instructions<textarea maxLength={2000} rows={4} value={form.instructions} onChange={event => change('instructions', event.target.value)} /></label><button className="lb-btn lb-primary" type="submit">{busy ? 'Assigning…' : 'Assign entry'}</button>
  </fieldset></form></LogbookDrawer>
}

export { default as SignoffList } from './LogbookSignoff'

export function ApprovalChain({ chain, subject, actor, onChanged }) {
  const [draft, setDraft] = useState(chain), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const move = (index, direction) => { const next = [...draft]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; setDraft(next) }
  return <details className="lb-card"><summary>Configure approval chain</summary><p className="lb-muted">Applies to new submissions. In-progress logbooks keep their original chain.</p>{error && <p role="alert" className="lb-error">{error}</p>}<fieldset disabled={busy} className="faculty-fieldset lb-stack">{draft.map((id, index) => <div className="lb-actions" key={id}><span>{index + 1}. {actorName(id)}</span><button className="lb-btn" disabled={index === 0} onClick={() => move(index, -1)}>Move up</button><button className="lb-btn" disabled={index === draft.length - 1} onClick={() => move(index, 1)}>Move down</button><button className="lb-btn" disabled={draft.length === 1} onClick={() => setDraft(draft.filter(value => value !== id))}>Remove</button></div>)}<label className="lb-field">Add approver<select value="" onChange={event => setDraft([...draft, event.target.value])}><option value="">Choose approver</option>{REVIEWERS.filter(person => !draft.includes(person.id)).map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><div className="lb-actions"><button className="lb-btn" onClick={() => setDraft(DEFAULT_CHAIN)}>Reset chain</button><button className="lb-btn lb-primary" onClick={async () => { setBusy(true); setError(''); try { await saveApprovalChain(draft, subject, actor); onChanged('Approval chain saved.') } catch (failure) { setError(failure.message) } finally { setBusy(false) } }}>{busy ? 'Saving…' : 'Save chain'}</button></div></fieldset></details>
}
