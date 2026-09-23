import { ChevronRight, Paperclip, MessageSquare } from 'lucide-react'
import { entryTitle, formatDate } from '../../services/logbook'
import { categoryLabel } from '../../services/logbookPresentation'
import { isGraded, learnerName, overdueEntry, waitingDays } from '../../services/logbookPeople'
import './AdminLogbookRecords.css'

/** Compact shared faculty rows. Selection is restricted by the parent's eligible IDs. */
export default function AdminLogbookRecords({ rows, onOpen, eligible = [], checked = [], onCheck, onCancel, actorId, empty = 'No entries in this view.' }) {
  return <div className="admin-entry-list">{!rows.length && <p className="lb-empty">{empty}</p>}{rows.map(entry => <div className="admin-entry" key={entry.id}>
    {eligible.includes(entry.id) && <input type="checkbox" aria-label={`Select ${entryTitle(entry)} by ${learnerName(entry.studentId)}`} checked={checked.includes(entry.id)} onChange={event => onCheck(entry.id, event.target.checked)} />}
    <button className="admin-entry-open" onClick={() => onOpen(entry.id)}><span><strong>{entryTitle(entry)}</strong><small title={`${learnerName(entry.studentId)} · ${entry.subject} · ${categoryLabel(entry.cat)}`}>{learnerName(entry.studentId)} · {entry.subject} · {categoryLabel(entry.cat)}</small><small>{entry.status === 'Pending' ? `${waitingDays(entry)} days waiting${overdueEntry(entry) ? ' · Overdue' : ''}${isGraded(entry) ? ' · Needs grade' : ''}` : entry.assignment?.due ? `Due ${formatDate(entry.assignment.due)}` : ''}</small></span><span className="admin-entry-meta"><span className={`lb-status is-${entry.status.toLowerCase().replaceAll(' ', '-')}`}>{entry.status}</span><small>{formatDate(entry.submittedAt || entry.date)}</small><span className="admin-record-flags">{entry.extra?.attachments?.length > 0 && <Paperclip size={13} aria-label="Has attachments" />}{(entry.extra?.comments?.length > 0 || entry.extra?.remarks) && <MessageSquare size={13} aria-label="Has comments or remarks" />}</span></span><ChevronRight size={16} /></button>
    {onCancel && entry.assignment?.by === actorId && entry.status === 'To do' && <button className="lb-btn" onClick={() => onCancel(entry)}>Cancel assignment</button>}
  </div>)}</div>
}
