import { CheckCircle2, ChevronRight, History, Undo2 } from 'lucide-react'
import { entryTitle, formatDate } from '../../services/logbook'
import { learnerName } from '../../services/logbookPeople'
import { categoryLabel } from '../../services/logbookPresentation'
import './AdminLogbookHistory.css'

/** Read-only decision timeline. Each row opens the existing entry review drawer.
 * @param {{history:Array<{key:string,entry:Object,event:{at:string,action:string,remarks?:string}}>, certified:boolean, onShowAll:Function, onOpen:Function}} props
 */
export default function AdminLogbookHistory({ history, certified, onShowAll, onOpen }) {
  const groups = new Map()
  history.forEach(item => {
    const date = new Date(item.event.at).toLocaleDateString('en-CA')
    if (!groups.has(date)) groups.set(date, [])
    groups.get(date).push(item)
  })
  const approved = history.filter(item => item.event.action === 'Approved').length
  return <section className="lb-card admin-history">
    <header className="admin-history-head">
      <div><h2>{certified ? 'Certified this week' : 'My signed history'}</h2><p>Review your past decisions and feedback.</p></div>
      <div className="admin-history-summary" aria-label="Decision summary">
        <span><strong>{history.length}</strong> decisions</span>
        <span><CheckCircle2 size={14} /><strong>{approved}</strong> approved</span>
        <span><Undo2 size={14} /><strong>{history.length - approved}</strong> returned</span>
        {certified && <button className="lb-text-btn" onClick={onShowAll}>All decisions</button>}
      </div>
    </header>
    {!history.length && <div className="lb-empty"><History size={24} /><p>Your review decisions will appear here.</p></div>}
    {[...groups].map(([date, items]) => <section className="admin-history-day" key={date} aria-label={formatDate(items[0].event.at)}>
      <div className="admin-history-date"><h3>{formatDate(items[0].event.at)}</h3><span>{items.length} {items.length === 1 ? 'decision' : 'decisions'}</span></div>
      <div className="admin-history-list">{items.map(({ entry, event, key }) => <button className="admin-history-row" key={key} onClick={() => onOpen(entry.id)}>
        <span className={`admin-history-icon is-${event.action.toLowerCase()}`} aria-hidden="true">{event.action === 'Approved' ? <CheckCircle2 size={18} /> : <Undo2 size={18} />}</span>
        <span className="admin-history-copy">
          <strong>{entryTitle(entry)}</strong>
          <span className="admin-history-context"><span>{learnerName(entry.studentId)}</span><span>{entry.subject}</span><span>{categoryLabel(entry.cat)}</span></span>
          {event.remarks && <span className="admin-history-feedback" title={event.remarks}>Feedback: {event.remarks}</span>}
          {entry.status !== event.action && <span className="admin-history-updated">Updated since this decision</span>}
        </span>
        <span className="admin-history-decision"><span className={`lb-status is-${event.action.toLowerCase()}`}>{event.action}</span><time dateTime={event.at}>{new Date(event.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</time></span>
        <ChevronRight className="admin-history-chevron" size={16} aria-hidden="true" />
      </button>)}</div>
    </section>)}
  </section>
}
