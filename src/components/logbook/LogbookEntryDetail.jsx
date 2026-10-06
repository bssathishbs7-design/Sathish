import LogbookSkillRecord from './LogbookSkillRecord'
import { learnerRegisterId } from '../../services/logbookPeople'
import { attestationLabel } from '../../services/logbookTitles'
import { subjectWriteBlock, textLimitFor } from '../../services/logbookPolicy'
import LogbookCommentMessage from './LogbookCommentMessage'
import { useContext } from 'react'
import { LogbookReaderContext } from '../../services/logbookCommentRead'
import LogbookCommentBadge from './LogbookCommentBadge'
import { useState, useRef } from 'react'
import LogbookConfirm from './LogbookConfirm'
import LogbookEvidence from './LogbookEvidence'
import LogbookPagination from './LogbookPagination'
import { certificationTarget } from '../../services/logbookProgress'
import { matchesRemedial } from '../../services/logbookPeople'
import { LoaderCircle, Send } from 'lucide-react'
import LogbookDrawer from './LogbookDrawer'
import { CATEGORIES, getLogbookField } from '../../services/logbookCatalog'
import { entryTitle, facultyName, formatDate, updateLogbookEntry } from '../../services/logbook'
import './LogbookEntryDetail.css'
import FacultyReview from './FacultyReview'
import { actorName, learnerName, isGraded, actionable } from '../../services/adminLogbook'

/** Entry inspection shared by learner and faculty demo views. Service validates lifecycle mutations.
 * @param {{entry:Object, entries:Object[], theme:string, role?:string, commentDraft:string, onCommentDraft:Function, onClose:Function, onEdit:Function, onRemedial:Function, onOpen:Function, onChanged:Function}} props
 */
export default function LogbookEntryDetail({ onOpenSkill, entry, entries, theme, workflow, role = 'learner', actor = null, commentDraft, onCommentDraft, onClose, onEdit, onRemedial, onOpen, onChanged }) {
  const reader = useContext(LogbookReaderContext)
  const [notes, setNotes] = useState(entry.extra?.notes || '')
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')
  const [leaveAction, setLeaveAction] = useState(null)
  const [commentLimit, setCommentLimit] = useState(25)
  const mutation = useRef(false)
  const writeBlock = subjectWriteBlock(workflow, entry.studentId || 'MC2568', entry.subject)
  const canDelete = !writeBlock && ['Draft','Pending','Returned'].includes(entry.status) && !entry.assignment && !entry.linkedTo && !entries.some(item => item.linkedTo === entry.id)
  const child = entries.find((item) => matchesRemedial(entry, item))
  const [reviewDirty, setReviewDirty] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const flushNotes = async () => {
    if (role === 'learner' && notes !== (entry.extra?.notes || '')) await updateLogbookEntry(entry.id, 'notes', { text: notes, studentId: reader.id })
  }
  const leave = async (action = onClose) => {
    if (reviewBusy || busy) return
    if (reviewDirty) { setLeaveAction(() => action); return }
    setBusy(true); setFailure('')
    try { await flushNotes(); action() } catch (error) { setFailure(error.message); setBusy(false) }
  }
  const mutate = async (action, payload, close = false) => {
    if (mutation.current || reviewBusy) return
    mutation.current = true; setBusy(true); setFailure('')
    try {
      await flushNotes()
      await updateLogbookEntry(entry.id, action, { ...payload, studentId: reader.id })
      if (action === 'comment') { onCommentDraft(''); setNotice('Comment posted.') }
      onChanged(action === 'comment' ? 'Comment posted.' : action === 'withdraw' ? 'Entry removed.' : 'Faculty decision saved.')
      if (close) onClose()
    } catch (error) { setFailure(error.message) } finally { mutation.current = false; setBusy(false) }
  }
  if (entry.source === 'skills') return <LogbookSkillRecord entry={entry} entries={entries} theme={theme} onClose={onClose} onOpen={onOpen} onOpenSkill={onOpenSkill} />
  return <LogbookDrawer title={entryTitle(entry)} subtitle={`${entry.subject} · ${CATEGORIES.find((category) => category.id === entry.cat)?.name}`} theme={theme} onClose={() => leave()} busy={busy || reviewBusy}>
    <div className="lb-drawer-body">
      {notice && <div className="lb-alert" role="status">{notice}</div>}{leaveAction && <LogbookConfirm title="Discard unsaved review or reassignment changes?" onCancel={() => setLeaveAction(null)} onConfirm={() => { setReviewDirty(false); setLeaveAction(null); leaveAction() }} confirmLabel="Discard and continue" />}{confirmWithdraw && <LogbookConfirm title={entry.status === 'Draft' ? 'Delete this draft?' : `Delete this ${entry.status.toLowerCase()} entry?`} busy={busy} onCancel={() => setConfirmWithdraw(false)} onConfirm={() => mutate('withdraw', {}, true)} confirmLabel="Delete entry"><p>This removes the entry from your logbook and the review queue. This action cannot be undone.</p></LogbookConfirm>}{failure && <div className="lb-alert lb-error" role="alert">{failure}</div>}
      <p className="lb-muted">{role === 'faculty' ? `Reviewer: ${facultyName(entry.faculty)}${entry.faculty !== actor?.id ? ' · Read-only review; comments are available.' : ''}` : `Verifying faculty: ${facultyName(entry.faculty)}`}</p><div className="lb-actions"><span className={`lb-status is-${entry.status.toLowerCase().replaceAll(' ', '-')}`}>{entry.status}</span><span className="lb-muted">{formatDate(entry.date)}</span></div>
      {entry.assignment && <div className="lb-alert">{entry.assignment.instructions} | {entry.assignment.due ? `Due ${formatDate(entry.assignment.due)}` : 'No deadline'}</div>}
      <dl className="lb-record">{role === 'faculty' && <div><dt>Student</dt><dd>{learnerName(entry.studentId)} | {learnerRegisterId(entry.studentId)}</dd></div>}<div><dt>Verifying faculty</dt><dd>{facultyName(entry.faculty)}</dd></div>{Object.entries(entry.values).filter(([, value]) => value).map(([key, value]) => <div key={key}><dt>{getLogbookField(entry.cat, key, entry.subject)?.label || (key === 'recordGroup' ? 'Record group' : key === 'serial' ? 'Serial number' : key)}</dt><dd>{key === 'numReq' ? certificationTarget(entry.subject, entry.values.competency || entry.values.activity) || 'Not configured' : value}</dd></div>)}{entry.extra?.remarks && <div><dt>Learner remarks</dt><dd>{entry.extra.remarks}</dd></div>}{entry.submittedAt && <div><dt>Learner confirmation</dt><dd>{learnerName(entry.studentId)} · confirmed {formatDate(entry.submittedAt)}</dd></div>}{entry.verifiedAt && <div><dt>{attestationLabel(entry.cat)}</dt><dd>{actorName(entry.audit?.filter(event => ['Approved','Returned'].includes(event.action)).at(-1)?.actor || entry.faculty)} · {formatDate(entry.verifiedAt)}</dd></div>}</dl>
      {role === 'faculty' && !writeBlock && <FacultyReview entry={entry} actor={actor} disabled={busy} onChanged={message => { setNotice(message); onChanged(message) }} onDirty={setReviewDirty} onBusy={setReviewBusy} />}
      {(entry.status === 'Approved' || writeBlock) && <div className="lb-alert">{writeBlock || 'This signed record is locked.'} Notes and comments remain available.</div>}
      {entry.extra?.facultyRemarks && <div className="lb-feedback"><span className="lb-eyebrow">Faculty feedback</span><p>{entry.extra.facultyRemarks}</p></div>}
      {entry.linkedTo && <button className="lb-btn" disabled={busy} onClick={() => leave(() => onOpen(entry.linkedTo))}>View original returned entry</button>}
      {entry.status === 'Returned' && !writeBlock && role === 'learner' && isGraded(entry) && <button className="lb-btn lb-primary" disabled={busy} onClick={() => leave(() => onRemedial(entry))}>{child?.status === 'Draft' ? 'Continue remedial draft' : child ? 'View linked remedial attempt' : 'Log a remedial attempt'}</button>}
      <LogbookEvidence photos={entry.extra?.attachments} theme={theme} />
      {role === 'learner' && <label className="lb-field"><span>Notes visible to faculty</span><textarea rows={4} maxLength={textLimitFor(entry.extra?.notes)} value={notes} disabled={busy} onChange={(event) => setNotes(event.target.value)} /><small>Saved when you close this drawer. Not part of the signed record.{entry.extra?.notesEdited ? ` Last edited ${formatDate(entry.extra.notesEdited)}.` : ''}</small></label>}
      {role === 'faculty' && <section className="lb-stack"><h3>Learner’s notes</h3><p>{entry.extra?.notes || 'No notes from the learner.'}</p>{entry.extra?.notesEdited && <small className="lb-muted">Edited {formatDate(entry.extra.notesEdited)}</small>}<p className="lb-muted">Read-only context; not part of the signed record.</p></section>}
      <section className="lb-stack"><h3>Comments <LogbookCommentBadge entry={entry} showAttachments={false} /></h3>{!entry.extra?.comments?.length && <p className="lb-muted">No comments yet. Start a conversation about this entry.</p>}
        {(entry.extra?.comments || []).slice(-commentLimit).map((comment, index) => <LogbookCommentMessage key={comment.id || index} entryId={entry.id} comment={comment} />)}
        <LogbookPagination count={entry.extra?.comments?.length || 0} limit={commentLimit} onMore={() => setCommentLimit(value => value + 25)} /><label className="lb-field"><span>Add a comment</span><textarea value={commentDraft} onChange={(event) => onCommentDraft(event.target.value)} disabled={busy || reviewBusy} rows={3} maxLength={500} /><small>Posted comments cannot be edited or removed.</small></label><button className="lb-btn" disabled={busy || reviewBusy || !commentDraft.trim()} onClick={() => mutate('comment', { authorId: reader.id, text: commentDraft, by: role, who: role === 'faculty' ? actorName(actor?.id) : learnerName(entry.studentId) })}><Send size={15} /> Post comment</button>
      </section>
      {entry.grading && <p className="lb-alert">Attempt: {{ F: 'First', R: 'Repeat', Re: 'Remedial' }[entry.grading.attempt]} | Rating: {{ M: 'Meets expectations', B: 'Below expectations', E: 'Exceeds expectations' }[entry.grading.rating]} | Decision: {{ C: 'Certified', R: 'Repeat', Re: 'Remedial' }[entry.grading.decision]}</p>}
      <details><summary>Entry history ({entry.audit?.length || 0})</summary><ol>{(entry.audit || []).map((item, index) => <li key={index}><strong>{item.action}</strong><p>{actorName(item.actor)} · {formatDate(item.at)}</p>{item.remarks && <p>{item.remarks}</p>}</li>)}</ol></details>
    </div>
    <footer className="lb-drawer-foot">{role === 'faculty' && !writeBlock && actionable(entry, actor) && <button className="lb-btn lb-primary" disabled={busy || reviewBusy} onClick={() => { const section = document.querySelector('.faculty-review'); section?.scrollIntoView({ block: 'start' }); section?.querySelector('select, textarea, button')?.focus({ preventScroll: true }) }}>Review entry</button>}{role === 'learner' && entry.status === 'Returned' && isGraded(entry) && canDelete && <button className="lb-btn" disabled={busy} onClick={() => setConfirmWithdraw(true)}>Delete returned entry</button>}{role === 'learner' && !writeBlock && (['Draft', 'Pending', 'To do'].includes(entry.status) || (entry.status === 'Returned' && !isGraded(entry))) && <><button className="lb-btn" disabled={busy || !canDelete} onClick={() => setConfirmWithdraw(true)}>{entry.status === 'Draft' ? 'Delete draft' : `Delete ${entry.status.toLowerCase()} entry`}</button><button className="lb-btn lb-primary" disabled={busy} onClick={() => leave(() => onEdit({ ...entry, extra: { ...entry.extra, notes } }))}>{entry.status === 'Returned' ? 'Edit and resubmit' : entry.status === 'To do' ? 'Complete entry' : 'Edit entry'}</button></>}<button className="lb-btn" disabled={busy} onClick={() => leave()}>{busy && <LoaderCircle size={16} className="lb-spin" />}Done</button></footer>
  </LogbookDrawer>
}
