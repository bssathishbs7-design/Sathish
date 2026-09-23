import { useState } from 'react'
import { actionable, actorName, isGraded, reassignEntry, REVIEWERS, reviewEntries } from '../../services/adminLogbook'
import './FacultyReview.css'

/** Shared faculty decision controls; the service rechecks assignment on every mutation. */
export default function FacultyReview({ entry, actor, onChanged, onDirty, onBusy }) {
  const [attempt, setAttempt] = useState('')
  const [rating, setRating] = useState('')
  const [decision, setDecision] = useState('R')
  const [remarks, setRemarks] = useState('')
  const [faculty, setFaculty] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const run = async operation => { setBusy(true); onBusy(true); setError(''); try { await operation(); onDirty(false); onChanged('Review updated.') } catch (failure) { setError(failure.message) } finally { setBusy(false); onBusy(false) } }
  if (!actionable(entry, actor)) return <p className="lb-alert">{entry.status === 'Pending' ? `Read only: assigned to ${actorName(entry.faculty)}.` : 'This entry is not awaiting review.'}</p>
  return <section className="lb-stack faculty-review" onChange={() => onDirty(true)}><h3>Faculty verification</h3>{error && <p role="alert" className="lb-error">{error}</p>}
    {isGraded(entry) && <div className="faculty-review-grid"><label className="lb-field">Attempt<select disabled={busy} value={attempt} onChange={event => setAttempt(event.target.value)}><option value="">Choose attempt</option>{!entry.linkedTo && <option value="F">First</option>}<option value="R">Repeat</option><option value="Re">Remedial</option></select></label><label className="lb-field">Rating<select disabled={busy} value={rating} onChange={event => setRating(event.target.value)}><option value="">Choose rating</option><option value="M">Meets expectations</option><option value="B">Below expectations</option><option value="E">Exceeds expectations</option></select></label><label className="lb-field">Return decision<select disabled={busy} value={decision} onChange={event => setDecision(event.target.value)}><option value="R">Repeat</option><option value="Re">Remedial</option></select></label></div>}
    <label className="lb-field">Feedback to learner<textarea rows={3} maxLength={500} disabled={busy} value={remarks} onChange={event => setRemarks(event.target.value)} /><small>Required when returning an entry.</small></label>
    <div className="lb-actions"><button className="lb-btn" disabled={busy} onClick={() => run(() => reviewEntries([entry.id], actor, { status: 'Returned', attempt, rating, decision, remarks }))}>Return entry</button><button className="lb-btn lb-primary" disabled={busy} onClick={() => run(() => reviewEntries([entry.id], actor, { status: 'Approved', attempt, rating, remarks }))}>{busy ? 'Saving…' : 'Approve entry'}</button></div>
    <label className="lb-field">Reassign to<select disabled={busy} value={faculty} onChange={event => setFaculty(event.target.value)}><option value="">Choose department faculty</option>{REVIEWERS.filter(person => person.id !== actor.id && person.departments.includes(entry.subject)).map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><button className="lb-btn" disabled={busy || !faculty} onClick={() => run(() => reassignEntry(entry.id, actor, faculty))}>Reassign entry</button>
  </section>
}
