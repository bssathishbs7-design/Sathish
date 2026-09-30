import { facultyName, formatDate } from '../../services/logbook'
import { waitingDays } from '../../services/logbookPeople'
import './LogbookPendingGroups.css'

/** Pending follow-up groups retain the existing entry renderer and URL-owned selection. */
export default function LogbookPendingGroups({ entries, group = 'faculty', onGroup, renderEntries }) {
  const groups = new Map()
  for (const entry of [...entries].sort((a, b) => waitingDays(b) - waitingDays(a))) {
    const key = group === 'subject' ? entry.subject : group === 'faculty' ? facultyName(entry.faculty) : 'All pending entries'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(entry)
  }
  return <div className="lb-pending-groups"><div className="lb-actions" aria-label="Group pending entries">{[['faculty','By faculty'],['subject','By subject'],['none','All entries']].map(([value,label]) => <button className={`lb-btn${group === value ? ' lb-primary' : ''}`} aria-pressed={group === value} key={value} onClick={() => onGroup(value)}>{label}</button>)}</div>
    {[...groups].map(([label, rows]) => <section key={label}><div className="lb-section-head"><h3>{label}</h3><span className="lb-muted">{rows.length} pending</span></div><p className="lb-muted">Oldest wait: {waitingDays(rows[0])} days · submitted {formatDate(rows[0].submittedAt || rows[0].date)}{rows.some(entry => waitingDays(entry) > 14) ? ` · ${rows.filter(entry => waitingDays(entry) > 14).length} over 14 days` : ''}</p>{renderEntries(rows)}</section>)}
    {!entries.length && <p className="lb-empty">No pending entries match these filters.</p>}
  </div>
}
