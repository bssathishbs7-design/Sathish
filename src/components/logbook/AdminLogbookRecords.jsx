import { learnerRegisterId } from '../../services/logbookPeople'
import { useState } from 'react'
import LogbookPagination from './LogbookPagination'
import LogbookCommentBadge from './LogbookCommentBadge'
import { ChevronRight } from 'lucide-react'
import { entryTitle, formatDate } from '../../services/logbook'
import { categoryLabel } from '../../services/logbookPresentation'
import { actorName, isGraded, learnerName, overdueEntry, waitingDays } from '../../services/logbookPeople'
import './AdminLogbookRecords.css'

/** Compact shared faculty rows. Selection is restricted by the parent's eligible IDs. */
export default function AdminLogbookRecords({ rows, onOpen, grouped = false, subjectRows = false, eligible = [], checked = [], onCheck, onCancel, actorId, busy = false, empty = 'No entries in this view.' }) {
  const [limit, setLimit] = useState(25)
  return <div className="admin-entry-list">{!rows.length && <p className="lb-empty">{empty}</p>}{rows.slice(0, limit).map(entry => <div className="admin-entry" key={entry.id}>
    {eligible.includes(entry.id) && <input type="checkbox" disabled={busy} aria-label={`Select ${entryTitle(entry)} by ${learnerName(entry.studentId)}`} checked={checked.includes(entry.id)} onChange={event => onCheck(entry.id, event.target.checked)} />}
    <button className="admin-entry-open" disabled={busy} onClick={() => onOpen(entry.id)}><span><strong>{subjectRows ? learnerName(entry.studentId) : entryTitle(entry)}<LogbookCommentBadge entry={entry} /></strong><small>{subjectRows ? [learnerRegisterId(entry.studentId), actorName(entry.faculty), categoryLabel(entry.cat)].join(' / ') : [!grouped && learnerName(entry.studentId), entry.subject, categoryLabel(entry.cat)].filter(Boolean).join(' / ')}</small><small>{entry.status === 'Pending' ? `${waitingDays(entry)} days waiting${overdueEntry(entry) ? ' · Overdue' : ''}${isGraded(entry) ? ' · Needs grade' : ''}` : entry.assignment?.due ? `Due ${formatDate(entry.assignment.due)}` : ''}</small></span><span className="admin-entry-meta">{entry.attemptNumber && <small>Attempt {entry.attemptNumber}</small>}<span className={`lb-status is-${entry.status.toLowerCase().replaceAll(' ', '-')}`}>{entry.status}</span><small>{formatDate(entry.submittedAt || entry.date)}</small></span>{grouped ? <span className="admin-queue-review">Review<ChevronRight size={14} aria-hidden="true" /></span> : <ChevronRight size={16} />}</button>
    {onCancel && entry.source !== 'skills' && entry.assignment?.by === actorId && entry.status === 'To do' && <button className="lb-btn" disabled={busy} onClick={() => onCancel(entry)}>Cancel assignment</button>}
  </div>)}<LogbookPagination count={rows.length} limit={limit} onMore={() => setLimit(value => value + 25)} /></div>
}
