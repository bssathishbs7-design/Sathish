import { useEffect, useState } from 'react'
import LogbookDrawer from './LogbookDrawer'
import { closeLogbookDrawer } from './closeLogbookDrawer'
import { actorName, belongsTo, learnerName } from '../../services/logbookPeople'
import { changeSignoff, chainFor, getLogbookWorkflow } from '../../services/adminLogbook'
import { formatDate, STORAGE_KEY, skillProgress } from '../../services/logbook'
import { requirementProgress } from '../../services/logbookProgress'
import { SUBJECTS } from '../../services/logbookSample'
import './LogbookSignoff.css'

const statusLabel = record => record.status === 'Submitted' ? `Awaiting ${actorName(record.chain[record.step])}` : record.status

/** Compact record links; full history and decisions live in the shared drawer. */
export default function LogbookSignoff({ records, actor, studentId, onChanged, entries = [], theme, onOpenLogbook }) {
  const [selected, setSelected] = useState(null), [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [confirm, setConfirm] = useState(false)
  const record = records.find(item => `${item.studentId}:${item.subject}` === selected)
  const close = (after) => { if (busy || (remarks.trim() && !window.confirm('Discard unsaved sign-off feedback?'))) return; void closeLogbookDrawer(() => { setSelected(null); setRemarks(''); setError(''); setConfirm(false); if (typeof after === 'function') after() }) }
  const run = async action => {
    if (action === 'submit' && !confirm) { setConfirm(true); return }
    setBusy(true); setError('')
    try { await changeSignoff({ studentId: record.studentId, subject: record.subject, actor, learnerId: studentId, action, remarks }); setRemarks(''); setConfirm(false); onChanged('Logbook approval updated.') } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  const rows = record ? entries.filter(entry => belongsTo(entry, record.studentId) && entry.subject === record.subject) : []
  const req = record ? requirementProgress(record.subject, rows) : []
  const subject = SUBJECTS.find(item => item.name === record?.subject)
  const skills = subject ? skillProgress(rows, subject) : []
  const pending = rows.filter(entry => ['Pending', 'To do'].includes(entry.status)).length
  const mine = record?.status === 'Submitted' && record.chain[record.step] === actor?.id
  return <div className="lb-signoff-list">
    {!records.length && <p className="lb-empty">No logbooks in this view.</p>}
    {records.map(item => <button className="lb-signoff-row" key={`${item.studentId}:${item.subject}`} onClick={() => { setSelected(`${item.studentId}:${item.subject}`); setRemarks(''); setError('') }}><span><strong>{item.subject}</strong>{!studentId && <small>{learnerName(item.studentId)} · {item.studentId}</small>}</span><span><span className="lb-status">{statusLabel(item)}</span><small>View approval details</small></span></button>)}
    {record && <LogbookDrawer title="Subject logbook approval" subtitle={`${learnerName(record.studentId)} · ${record.subject}`} theme={theme} onClose={close} busy={busy}>
      <div className="lb-drawer-body lb-stack"><span className="lb-status">{statusLabel(record)}</span>{error && <p className="lb-error" role="alert">{error}</p>}
        <p className="lb-muted">{rows.filter(entry => !['Draft', 'To do'].includes(entry.status)).length} submitted entries · {rows.filter(entry => entry.status === 'Approved').length} approved · {skills.filter(skill => skill.complete).length}/{skills.length} skills certified</p>
        {req.length > 0 && <div className="lb-stack"><h3>Category requirements</h3>{req.map(item => <div className="lb-section-head" key={item.cat}><span>{item.label}</span><strong>{item.count}/{item.required} {item.met ? 'met' : 'logged'}</strong></div>)}</div>}
        {pending > 0 && <p className="lb-alert">{pending} pending entries or assigned tasks remain. Clear these before submitting.</p>}
        {record.status === 'Returned' && <p className="lb-alert">{record.remarks}</p>}
        <ol className="lb-signoff-steps">{(record.chain || []).map((id, index) => <li key={id}><strong>{actorName(id)}</strong><small>{record.status === 'Completed' || (record.status === 'Submitted' && index < record.step) ? 'Signed' : record.status === 'Submitted' && index === record.step ? 'Awaiting signature' : 'Upcoming'}</small></li>)}</ol>
        {record.status === 'Completed' && <p className="lb-alert">Completed {formatDate(record.completedAt)}. Later submissions remain available as late entries ({rows.filter(entry => entry.submittedAt && entry.submittedAt > record.completedAt).length}).</p>}
        {mine && <label className="lb-field">Feedback<textarea maxLength={500} rows={3} disabled={busy} value={remarks} onChange={event => setRemarks(event.target.value)} /><small>Required when returning a logbook.</small></label>}
        <details><summary>Approval history ({record.history.length})</summary>{record.history.map((event, index) => <p key={index} className="lb-muted">{formatDate(event.at)} · {actorName(event.actor)} · {event.action}{event.remarks ? ` — ${event.remarks}` : ''}</p>)}</details>
        {onOpenLogbook && <button className="lb-btn" disabled={busy} onClick={() => close(() => onOpenLogbook(record.studentId, record.subject))}>Open student logbook</button>}
      </div><footer className="lb-drawer-foot">{mine && <><button className="lb-btn" disabled={busy} onClick={() => run('return')}>Return logbook</button><button className="lb-btn lb-primary" disabled={busy} onClick={() => run('approve')}>{busy ? 'Saving…' : 'Approve sign-off'}</button></>}{studentId === record.studentId && ['Ready', 'Returned'].includes(record.status) && <button className="lb-btn lb-primary" disabled={busy || pending > 0} onClick={() => run('submit')}>{busy ? 'Submitting…' : confirm ? 'Confirm submission' : record.status === 'Returned' ? 'Resubmit for final approval' : 'Submit for final approval'}</button>}<button className="lb-btn" disabled={busy} onClick={close}>Done</button></footer>
    </LogbookDrawer>}
  </div>
}

/** Subject-level learner entry point. It deliberately does not add a dashboard card. */
export function StudentSubjectApproval({ subject, studentId, entries, theme, onChanged }) {
  const [state, setState] = useState(null), [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const refresh = async () => { try { const value = await getLogbookWorkflow(); if (active) { setState(value); setError('') } } catch (failure) { if (active) setError(failure.message) } }
    const storage = event => { if (!event.key || event.key === STORAGE_KEY) void refresh() }
    void refresh(); window.addEventListener('medsy-logbook-changed', refresh); window.addEventListener('storage', storage)
    return () => { active = false; window.removeEventListener('medsy-logbook-changed', refresh); window.removeEventListener('storage', storage) }
  }, [])
  const existing = state?.signoffs[`${studentId}:${subject}`]
  const record = existing ? { ...existing, chain: existing.chain || chainFor(state, subject) } : null
  return <section className="lb-subject-approval"><h3>Subject approval</h3>{error && <p className="lb-error" role="alert">{error}</p>}{record ? <LogbookSignoff records={[record]} studentId={studentId} entries={entries} theme={theme} onChanged={onChanged} /> : <p className="lb-muted">Faculty will mark this subject ready after reviewing your entries.</p>}</section>
}
