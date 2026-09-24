import LogbookCommentBadge from './LogbookCommentBadge'
import { ChevronRight } from 'lucide-react'
import { entryTitle, formatDate } from '../../services/logbook'
import { categoryLabel } from '../../services/logbookPresentation'
import { isGraded, learnerName, overdueEntry, waitingDays } from '../../services/logbookPeople'
import './AdminLogbookRecords.css'

/** Compact shared faculty rows. Selection is restricted by the parent's eligible IDs. */
export default function AdminLogbookRecords({ rows, onOpen, grouped = false, eligible = [], checked = [], onCheck, onCancel, actorId, empty = 'No entries in this view.' }) {
  return <div className="admin-entry-list">{!rows.length && <p className="lb-empty">{empty}</p>}{rows.map(entry => <div className="admin-entry" key={entry.id}>
    {eligible.includes(entry.id) && <input type="checkbox" aria-label={`Select ${entryTitle(entry)} by ${learnerName(entry.studentId)}`} checked={checked.includes(entry.id)} onChange={event => onCheck(entry.id, event.target.checked)} />}
    <button className="admin-entry-open" onClick={() => onOpen(entry.id)}><span><strong>{entryTitle(entry)}<LogbookCommentBadge entry={entry} /></strong><small>{[!grouped && learnerName(entry.studentId), entry.subject, categoryLabel(entry.cat)].filter(Boolean).join(" / ")}</small><small>{entry.status === 'Pending' ? `${waitingDays(entry)} days waiting${overdueEntry(entry) ? ' · Overdue' : ''}${isGraded(entry) ? ' · Needs grade' : ''}` : entry.assignment?.due ? `Due ${formatDate(entry.assignment.due)}` : ''}</small></span><span className="admin-entry-meta"><span className={`lb-status is-${entry.status.toLowerCase().replaceAll(' ', '-')}`}>{entry.status}</span><small>{formatDate(entry.submittedAt || entry.date)}</small></span>{grouped ? <span className="admin-queue-review">Review<ChevronRight size={14} aria-hidden="true" /></span> : <ChevronRight size={16} />}</button>
    {onCancel && entry.assignment?.by === actorId && entry.status === 'To do' && <button className="lb-btn" onClick={() => onCancel(entry)}>Cancel assignment</button>}
  </div>)}</div>
}
