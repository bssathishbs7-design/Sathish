import { useEffect, useState } from 'react'
import { LoaderCircle, MessageSquare, Send } from 'lucide-react'
import LogbookDrawer from './LogbookDrawer'
import { CATEGORIES, getLogbookField } from '../../services/logbookCatalog'
import { entryTitle, facultyName, formatDate, updateLogbookEntry } from '../../services/logbook'
import './LogbookEntryDetail.css'

/** Entry inspection shared by learner and faculty demo views. Service validates lifecycle mutations.
 * @param {{entry:Object, entries:Object[], theme:string, role?:string, commentDraft:string, onCommentDraft:Function, onClose:Function, onEdit:Function, onRemedial:Function, onOpen:Function, onChanged:Function}} props
 */
export default function LogbookEntryDetail({ entry, entries, theme, role = 'learner', commentDraft, onCommentDraft, onClose, onEdit, onRemedial, onOpen, onChanged }) {
  const [notes, setNotes] = useState(entry.extra?.notes || '')
  const [remarks, setRemarks] = useState('')
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const child = entries.find((item) => item.linkedTo === entry.id && item.status !== 'Returned')
  useEffect(() => {
    if (!confirmWithdraw) return undefined
    const timer = window.setTimeout(() => setConfirmWithdraw(false), 4000)
    return () => window.clearTimeout(timer)
  }, [confirmWithdraw])
  const flushNotes = async () => {
    if (notes !== (entry.extra?.notes || '')) await updateLogbookEntry(entry.id, 'notes', { text: notes })
  }
  const leave = async (action = onClose) => {
    setBusy(true); setFailure('')
    try { await flushNotes(); action() } catch (error) { setFailure(error.message); setBusy(false) }
  }
  const mutate = async (action, payload, close = false) => {
    setBusy(true); setFailure('')
    try {
      await flushNotes()
      await updateLogbookEntry(entry.id, action, payload)
      if (action === 'comment') onCommentDraft('')
      onChanged(action === 'comment' ? 'Comment posted.' : action === 'withdraw' ? 'Entry removed.' : 'Faculty decision saved.')
      if (close) onClose()
    } catch (error) { setFailure(error.message) } finally { setBusy(false) }
  }
  return <LogbookDrawer title={entryTitle(entry)} subtitle={`${entry.subject} · ${CATEGORIES.find((category) => category.id === entry.cat)?.name}`} theme={theme} onClose={() => leave()} busy={busy}>
    <div className="lb-drawer-body">
      {failure && <div className="lb-alert lb-error" role="alert">{failure}</div>}
      <div className="lb-actions"><span className={`lb-status is-${entry.status.toLowerCase()}`}>{entry.status}</span><span className="lb-muted">{formatDate(entry.date)}</span></div>
      <dl className="lb-record"><div><dt>Verifying faculty</dt><dd>{facultyName(entry.faculty)}</dd></div>{Object.entries(entry.values).filter(([, value]) => value).map(([key, value]) => <div key={key}><dt>{getLogbookField(entry.cat, key, entry.subject)?.label || (key === 'recordGroup' ? 'Record group' : key === 'serial' ? 'Serial number' : key)}</dt><dd>{value}</dd></div>)}{entry.extra?.remarks && <div><dt>Learner remarks</dt><dd>{entry.extra.remarks}</dd></div>}{entry.submittedAt && <div><dt>Learner confirmation</dt><dd>Confirmed {formatDate(entry.submittedAt)}</dd></div>}{entry.verifiedAt && <div><dt>Faculty decision date</dt><dd>{formatDate(entry.verifiedAt)}</dd></div>}</dl>
      {entry.status === 'Approved' && <div className="lb-alert">This signed record is locked. Personal notes and comments remain available.</div>}
      {entry.extra?.facultyRemarks && <div className="lb-feedback"><span className="lb-eyebrow">Faculty feedback</span><p>{entry.extra.facultyRemarks}</p></div>}
      {entry.linkedTo && <button className="lb-btn" disabled={busy} onClick={() => leave(() => onOpen(entry.linkedTo))}>View original returned entry</button>}
      {entry.status === 'Returned' && role === 'learner' && <button className="lb-btn lb-primary" disabled={busy} onClick={() => leave(() => child ? onOpen(child.id) : onRemedial(entry))}>{child ? 'View linked remedial attempt' : 'Log a remedial attempt'}</button>}
      {entry.extra?.attachments?.length > 0 && <div className="lb-photo-grid">{entry.extra.attachments.map((photo, index) => <figure key={`${photo.name}-${index}`}>{/^data:image\/(png|jpeg|webp);base64,/.test(photo.dataUrl || '') && <img src={photo.dataUrl} alt={photo.name} />}<figcaption>{photo.name}</figcaption></figure>)}</div>}
      {role === 'learner' && <label className="lb-field"><span>Personal notes</span><textarea rows={4} maxLength={4000} value={notes} disabled={busy} onChange={(event) => setNotes(event.target.value)} /><small>Saved when you close this drawer. Not part of the signed record.{entry.extra?.notesEdited ? ` Last edited ${formatDate(entry.extra.notesEdited)}.` : ''}</small></label>}
      <section className="lb-stack"><h3><MessageSquare size={18} /> Comments</h3>{!entry.extra?.comments?.length && <p className="lb-muted">No comments yet. Start a conversation about this entry.</p>}
        {(entry.extra?.comments || []).map((comment, index) => <article className="lb-comment" key={comment.id || index}><div className="lb-comment-avatar" aria-hidden="true">{comment.by === 'faculty' ? 'F' : 'L'}</div><div><strong>{comment.who || (comment.by === 'faculty' ? 'Faculty' : 'Learner')}</strong><small>{comment.by === 'faculty' ? 'Faculty' : 'Learner'} · {new Date(comment.date).toLocaleString('en-IN')}</small><p>{comment.text}</p></div></article>)}
        <label className="lb-field"><span>Add a comment</span><textarea value={commentDraft} onChange={(event) => onCommentDraft(event.target.value)} disabled={busy} rows={3} maxLength={2000} /><small>Posted comments cannot be edited or removed.</small></label><button className="lb-btn" disabled={busy || !commentDraft.trim()} onClick={() => mutate('comment', { text: commentDraft, by: role, who: role === 'faculty' ? facultyName(entry.faculty) : 'Learner' })}><Send size={15} /> Post comment</button>
      </section>
      {role === 'faculty' && entry.status === 'Pending' && <section className="lb-stack"><h3>Faculty verification</h3><label className="lb-field"><span>Feedback to learner</span><textarea maxLength={500} value={remarks} disabled={busy} onChange={(event) => setRemarks(event.target.value)} /></label><div className="lb-actions"><button className="lb-btn" disabled={busy} onClick={() => mutate('review', { status: 'Returned', remarks }, true)}>Return for remedial attempt</button><button className="lb-btn lb-primary" disabled={busy} onClick={() => mutate('review', { status: 'Approved', remarks }, true)}>Approve entry</button></div></section>}
    </div>
    <footer className="lb-drawer-foot">{role === 'learner' && ['Draft', 'Pending'].includes(entry.status) && <><button className="lb-btn" disabled={busy} onClick={() => confirmWithdraw ? mutate('withdraw', {}, true) : setConfirmWithdraw(true)}>{confirmWithdraw ? 'Confirm removal' : entry.status === 'Draft' ? 'Delete draft' : 'Withdraw'}</button><button className="lb-btn lb-primary" disabled={busy} onClick={() => leave(() => onEdit({ ...entry, extra: { ...entry.extra, notes } }))}>Edit entry</button></>}<button className="lb-btn" disabled={busy} onClick={() => leave()}>{busy && <LoaderCircle size={16} className="lb-spin" />}Done</button></footer>
  </LogbookDrawer>
}
