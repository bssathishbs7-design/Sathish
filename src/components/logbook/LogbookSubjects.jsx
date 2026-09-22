import { useState } from 'react'
import { ChevronDown, ListFilter, RotateCcw, Search } from 'lucide-react'
import { SUBJECTS } from '../../services/logbookCatalog'
import LogbookSubjectCard from './LogbookSubjectCard'
import './LogbookSubjects.css'


/** Searchable subject catalogue. Counts exclude drafts; progress uses approved required attempts.
 * @param {{entries:Object[],onSubject:Function}} props
 */
export default function LogbookSubjects({ entries, onSubject }) {
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState('')
  const phases = ['Phase I', 'Phase II', 'Phase III']
  const matches = SUBJECTS.filter(subject => (!phase || subject.phase === phase) && `${subject.name} ${subject.label} ${subject.code}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <div className="lb-subjects-compact">
    <div className="lb-subject-tools"><span className="lb-subject-filter-label"><ListFilter size={16} aria-hidden="true" />Filter</span><label className="lb-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Search subjects" placeholder="Search subject or code" value={query} onChange={event => setQuery(event.target.value)} /></label><div className="lb-subject-phase-select"><select aria-label="Filter subjects by phase" value={phase} onChange={event => setPhase(event.target.value)}><option value="">All phases</option>{phases.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></div><button type="button" className="lb-subject-clear" disabled={!query && !phase} onClick={() => { setQuery(''); setPhase('') }}><RotateCcw size={14} aria-hidden="true" />Clear</button></div>
    {phases.map(item => {
      const subjects = matches.filter(subject => subject.phase === item)
      return subjects.length > 0 && <section key={item} className="lb-subject-phase"><div className="lb-subject-phase-heading"><h2>{item}</h2><span className="lb-subject-phase-description">{subjects[0].subtitle}</span><span className="lb-subject-phase-badge"><strong>{subjects.length}</strong> {subjects.length === 1 ? 'subject' : 'subjects'}</span></div><div className="lb-subject-tiles">{subjects.map(subject => <LogbookSubjectCard key={subject.name} subject={subject} entries={entries} onSubject={onSubject} />)}</div></section>
    })}
    {!matches.length && <div className="lb-empty"><Search size={24} /><p>No subjects match your search.</p><button className="lb-btn" onClick={() => { setQuery(''); setPhase('') }}>Clear filters</button></div>}
  </div>
}
