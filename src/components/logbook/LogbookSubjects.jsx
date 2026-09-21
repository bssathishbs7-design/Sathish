import { useState } from 'react'
import { Activity, Bone, BookOpen, CheckCircle2, ChevronDown, ChevronRight, FlaskConical, Info, Microscope, Search, Stethoscope } from 'lucide-react'
import { SUBJECTS } from '../../services/logbookCatalog'
import { subjectProgress } from '../../services/logbook'
import './LogbookSubjects.css'

const SUBJECT_ICONS = { AN: Bone, PY: Activity, BI: FlaskConical, PA: Microscope, MI: Microscope, PH: FlaskConical }

/** Searchable subject catalogue. Counts exclude drafts; progress uses approved required attempts.
 * @param {{entries:Object[],onSubject:Function}} props
 */
export default function LogbookSubjects({ entries, onSubject }) {
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState('')
  const phases = ['Phase I', 'Phase II', 'Phase III']
  const matches = SUBJECTS.filter(subject => (!phase || subject.phase === phase) && `${subject.name} ${subject.label} ${subject.code}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <div className="lb-subjects-compact">
    <div className="lb-subject-tools"><label className="lb-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Search subjects" placeholder="Search subject or code" value={query} onChange={event => setQuery(event.target.value)} /></label><div className="lb-subject-phase-select"><select aria-label="Filter subjects by phase" value={phase} onChange={event => setPhase(event.target.value)}><option value="">All phases</option>{phases.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></div><span className="lb-subject-total" aria-live="polite"><strong>{matches.length}</strong> {matches.length === 1 ? 'subject' : 'subjects'}</span></div>
    {phases.map(item => {
      const subjects = matches.filter(subject => subject.phase === item)
      return subjects.length > 0 && <section key={item} className="lb-subject-phase"><div className="lb-subject-phase-heading"><h2>{item}</h2><span className="lb-subject-phase-description">{subjects[0].subtitle}</span><span className="lb-subject-phase-badge"><strong>{subjects.length}</strong> {subjects.length === 1 ? 'subject' : 'subjects'}</span></div><div className="lb-subject-tiles">{subjects.map(subject => {
        const SubjectIcon = SUBJECT_ICONS[subject.code] || (subject.phase === 'Phase III' ? Stethoscope : BookOpen)
        const progress = subjectProgress(entries, subject)
        const count = entries.filter(entry => entry.subject === subject.name && entry.status !== 'Draft').length
        return <button className="lb-subject-tile" data-tone={SUBJECTS.indexOf(subject) % 5} key={subject.name} onClick={() => onSubject(subject.name)}>
          <span className="lb-subject-icon"><SubjectIcon size={18} aria-hidden="true" /></span><span className="lb-subject-tile-copy"><strong>{subject.label}</strong><small>{count} {count === 1 ? 'entry' : 'entries'} logged</small></span><ChevronRight size={16} aria-hidden="true" />
          <span className="lb-subject-tile-progress">{progress.required ? <><span><span className="lb-subject-progress-label"><CheckCircle2 size={14} aria-hidden="true" />Approved attempts</span><strong>{progress.approved}/{progress.required}</strong></span><progress value={progress.approved} max={progress.required} aria-label={`${progress.approved} of ${progress.required} required attempts approved`} /></> : <span className="lb-subject-unconfigured"><Info size={14} aria-hidden="true" />Requirements not configured</span>}</span>
        </button>
      })}</div></section>
    })}
    {!matches.length && <div className="lb-empty"><Search size={24} /><p>No subjects match your search.</p><button className="lb-btn" onClick={() => { setQuery(''); setPhase('') }}>Clear filters</button></div>}
  </div>
}
