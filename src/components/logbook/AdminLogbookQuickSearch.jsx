import LogbookCommentBadge from './LogbookCommentBadge'
import { useRef, useState } from 'react'
import { Search, SlidersHorizontal, ChevronDown, ChevronRight } from 'lucide-react'
import { entryTitle, formatDate } from '../../services/logbook'
import { categoryLabel } from '../../services/logbookPresentation'
import { actorName, learnerName, waitingDays } from '../../services/logbookPeople'
import './AdminLogbookQuickSearch.css'

/** Search only the records provided by the parent visibility policy; no additional data access.
 * @param {{entries:Object[],onOpen:Function,onViewAll:Function}} props
 */
export default function AdminLogbookQuickSearch({ entries, onOpen, onViewAll }) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ status: '', subject: '', category: '', range: 'all' })
  const [expanded, setExpanded] = useState(false)
  const input = useRef(null)
  const resultsRef = useRef(null)
  const filterCount = Object.entries(filters).filter(([key, value]) => key === 'range' ? value !== 'all' : Boolean(value)).length
  const active = Boolean(query.trim() || filterCount)
  const matches = active ? entries.filter(entry => (!filters.status || entry.status === filters.status) && (!filters.subject || entry.subject === filters.subject) && (!filters.category || entry.cat === filters.category) && (filters.range === 'all' || waitingDays(entry) <= Number(filters.range)) && query.trim().toLowerCase().split(/\s+/).every(term => [learnerName(entry.studentId), entry.studentId || 'MC2568', entry.subject, categoryLabel(entry.cat), actorName(entry.faculty), entry.status, ...Object.values(entry.values || {}), entry.extra?.remarks, entry.extra?.facultyRemarks, ...(entry.extra?.comments || []).map(comment => comment.text)].join(' ').toLowerCase().includes(term))).sort((a, b) => (b.submittedAt || b.date).localeCompare(a.submittedAt || a.date)) : []
  const clear = () => { setQuery(''); setFilters({ status: '', subject: '', category: '', range: 'all' }); input.current?.focus() }
  const options = [
    ['status', 'Status', [['', 'All statuses'], ...['To do', 'Pending', 'Approved', 'Returned'].map(value => [value, value])]],
    ['subject', 'Subject', [['', 'All subjects'], ...[...new Set(entries.map(entry => entry.subject))].sort().map(value => [value, value])]],
    ['category', 'Category', [['', 'All categories'], ...[...new Set(entries.map(entry => entry.cat))].map(value => [value, categoryLabel(value)])]],
    ['range', 'Date', [['all', 'Any time'], ['7', 'Last 7 days'], ['30', 'Last 30 days']]],
  ]
  const moveFocus = event => {
    if (!['ArrowDown', 'ArrowUp', 'Escape'].includes(event.key)) return
    const buttons = [...(resultsRef.current?.querySelectorAll('button') || [])]
    if (event.key === 'Escape') { input.current?.focus(); return }
    if (!buttons.length) return
    event.preventDefault()
    const index = buttons.indexOf(document.activeElement)
    if (event.key === 'ArrowUp' && index <= 0) input.current?.focus()
    else buttons[Math.min(buttons.length - 1, Math.max(0, index + (event.key === 'ArrowDown' ? 1 : -1)))]?.focus()
  }
  return <section className="lb-card admin-quick-search" aria-label="Search all logbook entries" onKeyDown={moveFocus}>
    <span className="admin-quick-search-label">Search all logbooks</span>
    <div className="admin-quick-search-bar"><label className="lb-search"><Search size={16} aria-hidden="true" /><input ref={input} type="search" aria-label="Search all logbook entries" aria-controls="dashboard-search-results" placeholder="Search students, ID, subjects, skills or feedback" value={query} onChange={event => setQuery(event.target.value)} /></label><button className="lb-btn" aria-expanded={expanded} aria-controls="dashboard-search-filters" onClick={() => setExpanded(value => !value)}><SlidersHorizontal size={16} />Filters{filterCount > 0 && <strong>{filterCount}</strong>}</button>{active && <button className="lb-btn" onClick={clear}>Clear</button>}</div>
    {expanded && <div id="dashboard-search-filters" className="admin-quick-filters">{options.map(([key, label, values]) => <label key={key}><span>{label}</span><span className="admin-quick-select"><select aria-label={'Universal search ' + label.toLowerCase()} value={filters[key]} onChange={event => setFilters(current => ({ ...current, [key]: event.target.value }))}>{values.map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></span></label>)}</div>}
    <div id="dashboard-search-results" ref={resultsRef} hidden={!active}>
      {active && <><div className="admin-quick-results-head"><span role="status">{matches.length ? `${matches.length} ${matches.length === 1 ? 'entry' : 'entries'} found${matches.length > 5 ? ' / Showing latest 5' : ''}` : 'No entries match your search.'}</span>{matches.length > 0 && <button className="lb-text-btn" onClick={() => onViewAll({ query, ...filters })}>View all results <ChevronRight size={14} /></button>}</div>
      {matches.slice(0, 5).map(entry => <button className="admin-quick-result" key={entry.id} onClick={() => onOpen(entry.id)}><span><strong>{entryTitle(entry)}<LogbookCommentBadge entry={entry} /></strong><small>{learnerName(entry.studentId)} / {entry.subject}</small></span><span className="admin-quick-result-meta"><span className={'lb-status is-' + entry.status.toLowerCase().replaceAll(' ', '-')}>{entry.status}</span><small>{formatDate(entry.submittedAt || entry.date)}</small></span><ChevronRight size={16} aria-hidden="true" /></button>)}
      {!matches.length && <p className="admin-quick-hint">Try a student name, competency code, or fewer filters.</p>}</>}
    </div>
  </section>
}
