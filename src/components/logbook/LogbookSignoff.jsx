import { BookOpen, ChevronRight, TriangleAlert } from 'lucide-react'
import LogbookApprovalSummary from './LogbookApprovalSummary'
import { signoffVersion, signoffEligibility } from '../../services/logbookPolicy'
import { useEffect, useId, useRef, useState } from 'react'
import LogbookConfirm from './LogbookConfirm'
import LogbookDrawer from './LogbookDrawer'
import { closeLogbookDrawer } from './closeLogbookDrawer'
import { actorName, belongsTo, learnerRegisterId, learnerName } from '../../services/logbookPeople'
import { changeSignoff, chainFor, getLogbookWorkflow } from '../../services/adminLogbook'
import { formatDate, STORAGE_KEY, skillProgress } from '../../services/logbook'
import { requirementProgress } from '../../services/logbookProgress'
import { SUBJECTS } from '../../services/logbookSample'
import './LogbookSignoff.css'

const statusLabel = record => record.status === 'Submitted' ? `Awaiting ${actorName(record.chain[record.step])}` : record.status

/** Compact record links; full history and decisions live in the shared drawer. */
export default function LogbookSignoff({ records, actor, studentId, onChanged, entries = [], theme, workflow, onOpenLogbook, selectedKey, onSelect, empty = 'No logbooks in this view.' }) {
  const [localSelected, setLocalSelected] = useState(null)
  const selected = selectedKey === undefined ? localSelected : selectedKey
  const setSelected = value => { setLocalSelected(value); onSelect?.(value) }
  const feedbackId = useId(), feedbackRef = useRef(null)
  const [feedbackError, setFeedbackError] = useState('')
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [confirm, setConfirm] = useState('')
  const [notice, setNotice] = useState('')
  const [leaveAction, setLeaveAction] = useState(null)
  const confirmationSnapshot = useRef(null), saving = useRef(false)
  const record = workflow?.signoffs?.[selected] || records.find(item => `${item.studentId}:${item.subject}` === selected)
  const submissionChain = record ? (workflow ? chainFor(workflow, record.subject) : record.chain || []) : []
  const close = (after) => { if (busy) return; if (remarks.trim()) { setLeaveAction(() => () => { setRemarks(''); setSelected(null); if (typeof after === 'function') after() }); return; } void closeLogbookDrawer(() => { setSelected(null); setRemarks(''); setError(''); setConfirm(false); if (typeof after === 'function') after() }) }
  const run = async action => {
    if (saving.current) return
    if (action === 'return' && !remarks.trim()) { setFeedbackError('Give a reason for returning the logbook.'); feedbackRef.current?.focus(); return }
    setFeedbackError('')
    if (confirm !== action) { confirmationSnapshot.current = { expectedVersion: signoffVersion(record), ...(action === 'submit' ? { expectedChain: [...submissionChain] } : {}) }; setConfirm(action); return }
    saving.current = true
    setBusy(true); setError('')
    try { await changeSignoff({ studentId: record.studentId, subject: record.subject, actor, learnerId: studentId, action, remarks, ...confirmationSnapshot.current }); setRemarks(''); setConfirm(false); setNotice('Logbook approval updated.'); onChanged('Logbook approval updated.') } catch (failure) { setError(failure.message); setConfirm('') } finally { saving.current = false; setBusy(false) }
  }
  const rows = record ? entries.filter(entry => belongsTo(entry, record.studentId) && entry.subject === record.subject) : []
  const req = record ? requirementProgress(record.subject, rows) : []
  const subject = SUBJECTS.find(item => item.name === record?.subject)
  const skills = subject ? skillProgress(rows, subject).filter(skill => skill.required > 0) : []
  const eligibility = signoffEligibility(rows)
  const ready = record?.history?.find(event => event.action === 'ready')
  const mine = record?.status === 'Submitted' && record.chain[record.step] === actor?.id
  return <div className="lb-signoff-list">
    {!records.length && <p className="lb-empty">{empty}</p>}
    {records.map(item => <button className="lb-signoff-row" key={`${item.studentId}:${item.subject}`} onClick={() => { setSelected(`${item.studentId}:${item.subject}`); setRemarks(''); setFeedbackError(''); setError(''); setNotice(''); setConfirm(''); setLeaveAction(null) }}><span className="lb-signoff-identity"><strong>{studentId ? 'View approval details' : item.subject}</strong>{!studentId && <small>{learnerName(item.studentId)} · {learnerRegisterId(item.studentId)}</small>}</span><span className="lb-signoff-summary"><span className={'lb-status is-' + ({ Submitted: 'pending', Ready: 'in-progress', Completed: 'approved', Returned: 'returned' }[item.status] || 'not-started')}>{item.status === 'Submitted' ? 'In approval' : item.status}</span><small>{item.status === 'Ready' ? 'Awaiting learner submission' : item.status === 'Completed' ? 'Completed ' + formatDate(item.completedAt) : item.status === 'Returned' ? 'Returned ' + formatDate(item.history?.findLast(event => event.action === 'return')?.at) : 'Step ' + (item.step + 1) + ' of ' + item.chain.length + ' / Awaiting ' + actorName(item.chain[item.step])}</small></span><ChevronRight className="lb-signoff-chevron" size={18} aria-hidden="true" /></button>)}
    {record && <LogbookDrawer title="Logbook sign-off" variant="approval" theme={theme} onClose={close} busy={busy}>
      <div className="lb-drawer-body lb-approval-body">
        {notice && <p role="status" className="lb-alert">{notice}</p>}
        {leaveAction && <LogbookConfirm title="Discard unsaved sign-off feedback?" onCancel={() => setLeaveAction(null)} onConfirm={() => { leaveAction(); setLeaveAction(null) }} confirmLabel="Discard feedback" />}
        {confirm && <LogbookConfirm title={confirm === 'submit' ? 'Submit this subject logbook?' : confirm === 'return' ? 'Return this logbook to the student?' : 'Approve this sign-off?'} busy={busy} onCancel={() => setConfirm('')} onConfirm={() => run(confirm)} confirmLabel={confirm === 'submit' ? 'Confirm submission' : 'Confirm decision'}><p>{learnerName(record.studentId)} / {record.subject}</p><p>{eligibility.approved} approved entries. {confirm === 'submit' ? 'Next approver: ' + actorName(submissionChain[0]) + '.' : confirm === 'approve' ? 'Your signature will advance the configured approval chain.' : remarks}</p></LogbookConfirm>}
        <section className="lb-approval-identity" aria-label="Student logbook">
          <div className="lb-approval-identity-top"><span className="lb-eyebrow">{record.subject} logbook</span><span className={'lb-approval-status is-' + record.status.toLowerCase()}>{statusLabel(record)}</span></div>
          <h3>{learnerName(record.studentId)}</h3>
          <p>Roll no. {learnerRegisterId(record.studentId)}{record.submittedAt && <> &middot; Submitted {formatDate(record.submittedAt)}</>}</p>
          {ready && <p>Marked ready by {actorName(ready.actor)} &middot; {formatDate(ready.at)}</p>}
          {record.status === 'Ready' && <p>Ready for the learner to submit for final approval.</p>}
        </section>
        {error && <p className="lb-error" role="alert">{error}</p>}
        <LogbookApprovalSummary record={record} chain={record.status === 'Ready' ? submissionChain : record.chain || []} rows={rows} requirements={req} skills={skills}>
          {['Ready', 'Returned', 'Submitted'].includes(record.status) && !eligibility.allowed && <div className="lb-approval-warning" role="status"><TriangleAlert size={24} aria-hidden="true" /><p>{eligibility.reason}</p></div>}
          {record.status === 'Returned' && <div className="lb-approval-warning"><TriangleAlert size={24} aria-hidden="true" /><div><p>Returned by {actorName(record.history?.findLast(event => event.action === 'return')?.actor)}: {record.remarks}</p><p>Resubmission restarts at the first approver.</p></div></div>}
        </LogbookApprovalSummary>
        {record.status === 'Returned' && <p className="lb-muted">Next submission: {submissionChain.map(actorName).join(' / ')}</p>}
        {record.status === 'Completed' && <p className="lb-alert">Completed {formatDate(record.completedAt)}. This subject is sealed. Its signed records cannot be changed; notes and comments remain available.</p>}
        {mine && <section className="lb-approval-signature"><header><h3>Your signature</h3><span className="lb-approval-status is-current">Your turn</span></header><label className="lb-field">Feedback<textarea ref={feedbackRef} aria-invalid={Boolean(feedbackError)} aria-describedby={feedbackError ? feedbackId : undefined} maxLength={500} rows={3} disabled={busy} value={remarks} onChange={event => { setRemarks(event.target.value); setFeedbackError('') }} /><small>Required when returning a logbook.</small>{feedbackError && <span id={feedbackId} role="alert" className="lb-error">{feedbackError}</span>}</label><div className="lb-actions"><button className="lb-btn" disabled={busy} onClick={() => run('return')}>Return logbook</button><button className="lb-btn lb-primary" disabled={busy || eligibility.pending > 0} onClick={() => run('approve')}>{busy ? 'Saving...' : 'Approve sign-off'}</button></div></section>}
        {onOpenLogbook && <button className="lb-btn lb-approval-open" disabled={busy} onClick={() => close(() => onOpenLogbook(record.studentId, record.subject))}><BookOpen size={18} aria-hidden="true" />Open student logbook<ChevronRight size={16} aria-hidden="true" /></button>}
        {req.length > 0 && <details className="lb-approval-details"><summary>Logged category coverage</summary><p className="lb-muted">Includes pending and returned entries. This is separate from approved attempts and certified skills. Faculty judgement determines readiness.</p>{req.map(item => <div className="lb-section-head" key={item.cat}><span>{item.label}</span><strong>{item.count}/{item.required} {item.met ? 'met' : 'logged'}</strong></div>)}</details>}
        <details className="lb-approval-details"><summary>Approval history ({record.history.length})</summary>{record.history.map((event, index) => <p key={index} className="lb-muted">{formatDate(event.at)} &middot; {actorName(event.actor)} &middot; {event.action}{event.remarks ? ' / ' + event.remarks : ''}</p>)}</details>
      </div><footer className="lb-drawer-foot">{studentId === record.studentId && ['Ready', 'Returned'].includes(record.status) && <button className="lb-btn lb-primary" disabled={busy || !eligibility.allowed} onClick={() => run('submit')}>{busy ? 'Submitting...' : confirm === 'submit' ? 'Review submission confirmation' : record.status === 'Returned' ? 'Resubmit for final approval' : 'Submit for final approval'}</button>}<button className="lb-btn" disabled={busy} onClick={close}>Done</button></footer>
    </LogbookDrawer>}
  </div>
}

/** Subject-level learner approval details, also reached from dashboard tasks. */
export function StudentSubjectApproval({ subject, studentId, entries, theme, onChanged, open = false, onOpenChange, notice }) {
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
  return <section className="lb-subject-approval"><h3>Subject approval</h3>{notice && <p className="lb-alert lb-subject-approval-notice" role="status">{notice}</p>}{error && <p className="lb-error" role="alert">{error}</p>}{!state && !error ? <p role="status">Loading subject approval…</p> : record ? <>{record.status !== 'Submitted' && <p className="lb-muted">{record.status === 'Ready' ? 'Next: submit this logbook for final approval.' : record.status === 'Returned' ? 'Review the feedback, complete corrections and resubmit.' : record.status === 'Completed' ? 'Final approval complete. This subject is sealed.' : statusLabel(record)}</p>}{record.status === 'Returned' && <p className="lb-alert">{record.remarks}</p>}<LogbookSignoff selectedKey={open ? `${studentId}:${subject}` : null} onSelect={value => onOpenChange?.(Boolean(value))} records={[record]} workflow={state} studentId={studentId} entries={entries} theme={theme} onChanged={onChanged} /></> : <p className="lb-muted">Faculty will mark this subject ready after reviewing your entries.</p>}</section>
}
