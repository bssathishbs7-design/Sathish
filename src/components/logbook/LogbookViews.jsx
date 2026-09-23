import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { STUDENT, CATEGORIES } from '../../services/logbookSample'
import { entryTitle, facultyName, formatDate, searchEntries } from '../../services/logbook'
import { awaitingRemedial } from '../../services/logbookPeople'
import { subjectLabel } from '../../services/logbookCatalog'
import './LogbookViews.css'
import LogbookCategoryMenu from './LogbookCategoryMenu'

/** Presentational collection: all record data and navigation callbacks come from the page. */
export function EntryList({ entries, onOpen, empty = 'No entries here yet.' }) {
  return entries.length ? <div className="lb-entry-list">{entries.map((entry) => <button className="lb-entry-row" key={entry.id} onClick={() => onOpen(entry.id)}>
    <span className={`lb-entry-icon is-${entry.status.toLowerCase().replaceAll(' ', '-')}`}><BookOpen size={18} /></span><span className="lb-entry-copy"><strong>{entryTitle(entry)}</strong><small>{entry.values.competency ? `${entry.values.competency} · ` : ''}{subjectLabel(entry.subject)} · {facultyName(entry.faculty)}</small></span><span className="lb-entry-meta"><span className={`lb-status is-${entry.status.toLowerCase().replaceAll(' ', '-')}`}>{entry.status}</span><small>{formatDate(entry.date)}</small></span><ChevronRight size={16} />
  </button>)}</div> : <div className="lb-empty"><BookOpen size={26} /><p>{empty}</p></div>
}
export function SearchView({ entries, onOpen, initialStatus = '' }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(initialStatus)
  const [category, setCategory] = useState('all')
  const matches = searchEntries(entries, query).filter(entry => !status || (status === 'Logged entries' ? entry.status !== 'To do' : status === 'Needs action' ? ['Draft', 'To do'].includes(entry.status) || (awaitingRemedial(entry, entries) && !entries.some(child => child.linkedTo === entry.id && child.status === 'Draft')) : entry.status === status))
  const categoryIds = [...new Set(matches.map(entry => entry.cat))]
  const options = [{ id: 'all', name: 'All entries', count: matches.length }, ...categoryIds.map(id => ({ ...(CATEGORIES.find(item => item.id === id) || { id, name: 'Other entries' }), count: matches.filter(entry => entry.cat === id).length }))]
  const selection = options.some(item => item.id === category) ? category : 'all'
  const results = matches.filter(entry => selection === 'all' || entry.cat === selection)
  return <div className="lb-all-entries"><LogbookCategoryMenu options={options} value={selection} onChange={setCategory} /><section className="lb-card lb-all-entry-results"><div className="lb-search-bar"><label className="lb-search"><Search size={18} /><input aria-label="Search logbook entries" placeholder="Search competency, topic, faculty, notes…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="lb-status-select"><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{['Logged entries', 'Needs action', 'To do', 'Draft', 'Pending', 'Approved', 'Returned'].map((value) => <option key={value}>{value}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></div></div><p className="lb-muted" aria-live="polite">{results.length} {results.length === 1 ? 'entry' : 'entries'} found</p><EntryList entries={results} onOpen={onOpen} empty="No matching entries. Try another search or status." /></section></div>
}
export function ProfileView({ entries, identity, onReset, busy }) {
  const [confirm, setConfirm] = useState(false)
  return <div className="lb-stack"><section className="lb-card lb-profile"><span className="lb-profile-avatar" aria-hidden="true">{(identity?.name || STUDENT.name).split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><div><span className="lb-eyebrow">Student profile</span><h2>{identity?.name || STUDENT.name}</h2><p>{identity?.registerId || STUDENT.registerId} · {STUDENT.programme} · Batch {STUDENT.batch}</p><p className="lb-muted">{STUDENT.posting} posting · ends {formatDate(STUDENT.postingEnd)}</p></div></section><div className="lb-metrics">{['Approved', 'Pending', 'Returned'].map((status) => <div className="lb-metric" key={status}><span>{status} entries</span><strong>{entries.filter((entry) => entry.status === status).length}</strong></div>)}</div><section className="lb-card"><h2>Faculty interactions</h2><p className="lb-muted">Submitted entries grouped by their verifying faculty.</p>{[...new Set(entries.filter((entry) => entry.faculty && entry.status !== 'Draft').map((entry) => entry.faculty))].map((id) => <div className="lb-profile-row" key={id}><span>{facultyName(id)}</span><strong className="lb-mono">{entries.filter((entry) => entry.faculty === id && entry.status !== 'Draft').length} entries</strong></div>)}</section><section className="lb-card"><h2>Reset sample Logbook</h2><p className="lb-muted">Restore your sample records and remove your entry changes and final approvals from this browser. Other students and approval-chain settings are kept.</p>{confirm ? <div className="lb-actions" role="alert"><strong>Reset entries and final approvals for this student? Other students will be kept.</strong><button className="lb-btn" disabled={busy} onClick={() => setConfirm(false)}>Cancel</button><button className="lb-btn" disabled={busy} onClick={async () => { await onReset(); setConfirm(false) }}>{busy ? 'Resetting…' : 'Confirm reset'}</button></div> : <button className="lb-btn" onClick={() => setConfirm(true)}>Reset Logbook data</button>}</section></div>
}
