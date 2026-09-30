import { useEffect, useId, useRef, useState } from 'react'
import { actionable, actorName, isGraded, reassignEntry, REVIEWERS, reviewEntries } from '../../services/adminLogbook'
import './FacultyReview.css'

/** Shared faculty decision controls; the service rechecks assignment on every mutation. */
export default function FacultyReview({ entry, actor, onChanged, onDirty, onBusy, disabled = false }) {
  const [attempt, setAttempt] = useState('')
  const [rating, setRating] = useState('')
  const [decision, setDecision] = useState('R')
  const [remarks, setRemarks] = useState('')
  const [faculty, setFaculty] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const saving = useRef(false), formRef = useRef(null), validationId = useId()
  const [fieldErrors, setFieldErrors] = useState({})
  const decide = status => {
    const next = { ...(isGraded(entry) && !attempt ? { attempt: 'Choose an attempt.' } : {}), ...(isGraded(entry) && !rating ? { rating: 'Choose a rating.' } : {}), ...(status === 'Returned' && !remarks.trim() ? { remarks: 'Add feedback before returning an entry.' } : {}) }
    setFieldErrors(next)
    if (Object.keys(next).length) { formRef.current?.querySelector(`[name="${Object.keys(next)[0]}"]`)?.focus(); return }
    void run(() => reviewEntries([entry.id], actor, { status, attempt, rating, decision, remarks }))
  }
  useEffect(() => { onDirty(Boolean(attempt || rating || remarks || faculty)) }, [attempt, rating, remarks, faculty, onDirty])
  const run = async (operation, kind) => { if (saving.current || disabled) return; saving.current = true; setBusy(true); onBusy(true); setError(''); try { await operation(); if (kind === 'reassign') setFaculty(''); else { setAttempt(''); setRating(''); setRemarks('') } onChanged('Review updated.') } catch (failure) { setError(failure.message) } finally { saving.current = false; setBusy(false); onBusy(false) } }
  if (!actionable(entry, actor)) return <p className="lb-alert">{entry.status === 'Pending' ? `Read only: assigned to ${actorName(entry.faculty)}.` : 'This entry is not awaiting review.'}</p>
  return <section ref={formRef} className="lb-stack faculty-review" aria-busy={busy || disabled}><h3>Faculty verification</h3><fieldset className="faculty-fieldset lb-stack" disabled={disabled || busy}>{error && <p role="alert" className="lb-error">{error}</p>}
    {isGraded(entry) && <div className="faculty-review-grid"><label className="lb-field">Attempt<select disabled={busy} name="attempt" aria-invalid={Boolean(fieldErrors.attempt)} aria-describedby={fieldErrors.attempt ? validationId + '-attempt' : undefined} value={attempt} onChange={event => { setAttempt(event.target.value); setFieldErrors(current => ({ ...current, attempt: '' })) }}><option value="">Choose attempt</option>{!entry.linkedTo && <option value="F">First</option>}<option value="R">Repeat</option><option value="Re">Remedial</option></select>{fieldErrors.attempt && <small id={validationId + '-attempt'} className="lb-error" role="alert">{fieldErrors.attempt}</small>}</label><label className="lb-field">Rating<select disabled={busy} name="rating" aria-invalid={Boolean(fieldErrors.rating)} aria-describedby={fieldErrors.rating ? validationId + '-rating' : undefined} value={rating} onChange={event => { setRating(event.target.value); setFieldErrors(current => ({ ...current, rating: '' })) }}><option value="">Choose rating</option><option value="M">Meets expectations</option><option value="B">Below expectations</option><option value="E">Exceeds expectations</option></select>{fieldErrors.rating && <small id={validationId + '-rating'} className="lb-error" role="alert">{fieldErrors.rating}</small>}</label><label className="lb-field">Return decision<select disabled={busy} value={decision} onChange={event => setDecision(event.target.value)}><option value="R">Repeat</option><option value="Re">Remedial</option></select></label></div>}
    <label className="lb-field">Feedback to learner<textarea rows={3} maxLength={500} disabled={busy} name="remarks" aria-invalid={Boolean(fieldErrors.remarks)} aria-describedby={fieldErrors.remarks ? validationId + '-remarks' : undefined} value={remarks} onChange={event => { setRemarks(event.target.value); setFieldErrors(current => ({ ...current, remarks: '' })) }} /><small>Required when returning an entry.</small>{fieldErrors.remarks && <small id={validationId + '-remarks'} className="lb-error" role="alert">{fieldErrors.remarks}</small>}</label>
    <div className="lb-actions"><button className="lb-btn" disabled={busy} onClick={() => decide('Returned')}>Return entry</button><button className="lb-btn lb-primary" disabled={busy} onClick={() => decide('Approved')}>{busy ? 'Saving…' : 'Approve entry'}</button></div>
    <label className="lb-field">Reassign to<select disabled={busy} value={faculty} onChange={event => setFaculty(event.target.value)}><option value="">Choose department faculty</option>{REVIEWERS.filter(person => person.id !== actor.id && person.departments.includes(entry.subject)).map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><button className="lb-btn" disabled={busy || !faculty} onClick={() => run(() => reassignEntry(entry.id, actor, faculty), 'reassign')}>Reassign entry</button>
  </fieldset></section>
}
