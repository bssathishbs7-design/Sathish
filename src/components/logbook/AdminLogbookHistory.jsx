import { inLastDays } from '../../services/logbookDates'
import { useState } from 'react'
import LogbookPagination from './LogbookPagination'
import LogbookCommentBadge from './LogbookCommentBadge'
import { CheckCircle2, ChevronDown, ChevronRight, History, Undo2 } from 'lucide-react'
import { entryTitle, formatDate } from '../../services/logbook'
import { learnerName, learnerRegisterId } from '../../services/logbookPeople'
import { categoryLabel } from '../../services/logbookPresentation'
import './AdminLogbookHistory.css'

/** Read-only decision timeline. Each row opens the existing entry review drawer.
 * @param {{history:Array<{key:string,entry:Object,event:{at:string,action:string,remarks?:string}}>, certified:boolean, onShowAll:Function, onOpen:Function}} props
 */
export default function AdminLogbookHistory({ history: allHistory, certified, onShowAll, onOpen, view = {}, onFilter }) {
  const [limit, setLimit] = useState(25)
  const history = allHistory.filter(item => (!view.historySubject || item.entry.subject === view.historySubject) && (!view.historyStudent || (item.entry.studentId || 'MC2568') === view.historyStudent) && (!view.historyDecision || item.event.action === view.historyDecision) && (!view.historyRange || inLastDays(item.event.at, Number(view.historyRange))))
  const groups = new Map()
  history.slice(0, limit).forEach(item => {
    const date = new Date(item.event.at).toLocaleDateString('en-CA')
    if (!groups.has(date)) groups.set(date, [])
    groups.get(date).push(item)
  })
  const approved = history.filter(item => item.event.action === 'Approved').length
  return <section className="lb-card admin-history">
    <header className="admin-history-head">
      <div><h2>{certified ? 'Skill attempts approved · last 7 days' : 'My signed history'}</h2><p>Review your past decisions and feedback.</p></div>
      <div className="admin-history-summary" aria-label="Decision summary">
        <span className="admin-history-stat is-total"><History size={14} aria-hidden="true" />Decisions<strong>{history.length}</strong></span>
        <span className="admin-history-stat is-approved"><CheckCircle2 size={14} aria-hidden="true" />Approved<strong>{approved}</strong></span>
        <span className="admin-history-stat is-returned"><Undo2 size={14} aria-hidden="true" />Returned<strong>{history.length - approved}</strong></span>
        {certified && <button className="lb-text-btn" onClick={onShowAll}>All decisions</button>}
      </div>
    </header>
    <div className="admin-history-filters">
      <label className="lb-field">Subject<span className="admin-history-select"><select value={view.historySubject || ''} onChange={event => onFilter({ historySubject: event.target.value })}><option value="">All subjects</option>{[...new Set(allHistory.map(item => item.entry.subject))].map(subject => <option key={subject}>{subject}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
      <label className="lb-field">Student<span className="admin-history-select"><select value={view.historyStudent || ''} onChange={event => onFilter({ historyStudent: event.target.value })}><option value="">All students</option>{[...new Set(allHistory.map(item => item.entry.studentId || 'MC2568'))].map(id => <option key={id} value={id}>{learnerName(id)} / {learnerRegisterId(id)}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
      <label className="lb-field">Decision<span className="admin-history-select"><select value={view.historyDecision || ''} onChange={event => onFilter({ historyDecision: event.target.value })}><option value="">All decisions</option><option>Approved</option><option>Returned</option></select><ChevronDown size={16} aria-hidden="true" /></span></label>
      <label className="lb-field">Decision date<span className="admin-history-select"><select value={view.historyRange || ''} onChange={event => onFilter({ historyRange: event.target.value })}><option value="">Any time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select><ChevronDown size={16} aria-hidden="true" /></span></label>
      <button className="lb-btn" onClick={() => onFilter({ historySubject: '', historyStudent: '', historyDecision: '', historyRange: '' })}>Clear filters</button>
    </div>
    {!history.length && <div className="lb-empty"><History size={24} /><p>No review decisions match this view.</p></div>}
    {[...groups].map(([date, items]) => <section className="admin-history-day" key={date} aria-label={formatDate(items[0].event.at)}>
      <div className="admin-history-date"><h3>{formatDate(items[0].event.at)}</h3><span>{items.length} {items.length === 1 ? 'decision' : 'decisions'}</span></div>
      <div className="admin-history-list">{items.map(({ entry, event, key }) => <button className="admin-history-row" key={key} onClick={() => onOpen(entry.id)}>
        <span className={`admin-history-icon is-${event.action.toLowerCase()}`} aria-hidden="true">{event.action === 'Approved' ? <CheckCircle2 size={18} /> : <Undo2 size={18} />}</span>
        <span className="admin-history-copy">
          <span className="admin-history-title"><strong>{entryTitle(entry)}</strong><LogbookCommentBadge entry={entry} /></span>
          <span className="admin-history-context"><span>{learnerName(entry.studentId)}</span><span>{entry.subject}</span><span>{categoryLabel(entry.cat)}</span></span>
          {event.remarks && <span className="admin-history-feedback" title={event.remarks}>Feedback: {event.remarks}</span>}
          {entry.status !== event.action && <span className="admin-history-updated">Updated since this decision</span>}
        </span>
        <span className="admin-history-decision"><span className={`lb-status is-${event.action.toLowerCase()}`}>{event.action}</span><time dateTime={event.at}>{new Date(event.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</time></span>
        <ChevronRight className="admin-history-chevron" size={16} aria-hidden="true" />
      </button>)}</div>
    </section>)}
    <LogbookPagination count={history.length} limit={limit} onMore={() => setLimit(value => value + 25)} />
  </section>
}
