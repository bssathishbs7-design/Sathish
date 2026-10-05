import { formatDate } from '../../services/logbook'
import LogbookCommentBadge from './LogbookCommentBadge'
import './LogbookSkillAttempts.css'

/** Attempts within an already labelled skill/student group.
 * @param {{rows:Object[],onOpen:Function,busy:boolean,studentName:string}} props
 */
export default function LogbookSkillAttempts({ rows, onOpen, busy, studentName }) {
  const attempts = [...rows].sort((a, b) => (a.date || a.submittedAt || '').localeCompare(b.date || b.submittedAt || '') || String(a.id).localeCompare(String(b.id)))
  return <div className="lb-skill-attempts"><table aria-label={`${studentName} skill attempts`}>
    <thead><tr><th scope="col">Attempt</th><th scope="col">Activity date</th><th scope="col">Status</th><th scope="col"><span className="lb-attempt-action-label">Details</span></th></tr></thead>
    <tbody>{attempts.map((entry, index) => <tr key={entry.id}>
      <th scope="row"><span className="lb-attempt-number">{index + 1}</span><LogbookCommentBadge entry={entry} /></th>
      <td>{entry.date ? formatDate(entry.date) : 'Not recorded'}</td>
      <td><span className={`lb-status is-${entry.status.toLowerCase().replaceAll(' ', '-')}`}>{entry.status}</span></td>
      <td><button className="lb-btn" disabled={busy} aria-label={`View attempt ${index + 1} for ${studentName}`} onClick={() => onOpen(entry.id)}>View</button></td>
    </tr>)}</tbody>
  </table></div>
}
