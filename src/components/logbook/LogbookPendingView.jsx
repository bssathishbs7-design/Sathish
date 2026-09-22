import { useState } from 'react'
import { ChevronDown, ListFilter, RotateCcw, Search } from 'lucide-react'
import { facultyName, searchEntries } from '../../services/logbook'
import { subjectLabel } from '../../services/logbookCatalog'
import { EntryList } from './LogbookViews'
import './LogbookPendingView.css'

/** Labelled native filter; selection remains keyboard accessible. */
function Filter({ label, value, onChange, children }) {
  return <label className="lb-pending-filter"><span className="lb-pending-label">{label}</span><span className="lb-pending-select"><select value={value} onChange={event => onChange(event.target.value)}>{children}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
}

/** Pending and draft discovery. Filters are local and never mutate stored entries.
 * @param {{entries:Object[],onOpen:Function,draftsOnly?:boolean}} props
 */
export default function LogbookPendingView({ entries, onOpen, draftsOnly = false }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('subject')
  const [selection, setSelection] = useState('')
  const candidates = entries.filter(entry => entry.status === (draftsOnly ? 'Draft' : 'Pending'))
  const keyOf = entry => group === 'subject' ? entry.subject : entry.faculty || '__unassigned__'
  const labelOf = key => group === 'subject' ? subjectLabel(key) : key === '__unassigned__' ? 'Not assigned' : facultyName(key)
  const keys = [...new Set(candidates.map(keyOf))].sort((a, b) => labelOf(a).localeCompare(labelOf(b)))
  const results = searchEntries(candidates.filter(entry => !selection || keyOf(entry) === selection), query)
  const filtered = Boolean(query || selection || group !== 'subject')
  const clear = () => { setQuery(''); setGroup('subject'); setSelection('') }
  return <div className="lb-pending-workspace">
    <header className="lb-pending-heading"><h2><ListFilter size={16} aria-hidden="true" />Filter</h2>
    <div className="lb-pending-filters">
      <label className="lb-pending-filter"><span className="lb-pending-label">Search entries</span><span className="lb-pending-search"><Search size={16} aria-hidden="true" /><input type="search" value={query} placeholder="Search entries" onChange={event => setQuery(event.target.value)} /></span></label>
      <Filter label="Group by" value={group} onChange={value => { setGroup(value); setSelection('') }}><option value="subject">By subject</option><option value="faculty">By faculty</option></Filter>
      <Filter label={group === 'subject' ? 'Subject' : 'Faculty'} value={selection} onChange={setSelection}><option value="">{group === 'subject' ? 'All subjects' : 'All faculty'}</option>{keys.map(key => <option key={key} value={key}>{labelOf(key)} ({candidates.filter(entry => keyOf(entry) === key).length})</option>)}</Filter>
      <button type="button" className="lb-pending-clear" disabled={!filtered} onClick={clear}><RotateCcw size={14} aria-hidden="true" />Clear</button>
    </div>
    </header>
    <section className="lb-pending-results"><div className="lb-pending-result-heading"><span aria-live="polite">{results.length} {results.length === 1 ? 'entry' : 'entries'} found</span></div><EntryList entries={results} onOpen={onOpen} empty={filtered ? 'No matching entries. Clear or adjust your filters.' : draftsOnly ? 'No draft entries.' : 'No pending entries.'} /></section>
  </div>
}
