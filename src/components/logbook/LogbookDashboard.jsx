import { awaitingRemedial, isGraded } from '../../services/logbookPeople'
import LogbookSubjectCard from './LogbookSubjectCard'
import { useState } from 'react'
import { ArrowRight, BookOpen, CheckCircle2, Clock3, FilePenLine, ChevronRight, Undo2 } from 'lucide-react'
import { SUBJECTS } from '../../services/logbookSample'
import { entryTitle, facultyName, formatDate } from '../../services/logbook'
import { subjectLabel } from '../../services/logbookCatalog'
import './LogbookDashboard.css'

/** Compact learner overview. All actions use the page's existing navigation and entry flows.
 * @param {{entries:Object[],onNavigate:Function,onOpen:Function,onSubject:Function,onEdit:Function,onRemedial:Function}} props
 */
export default function LogbookDashboard({ entries, onNavigate, onOpen, onSubject, onEdit, onRemedial }) {
  const [highlight, setHighlight] = useState(null)
  const counts = ['Approved', 'Pending', 'Returned'].map(status => ({ status, count: entries.filter(entry => entry.status === status).length }))
  const total = counts.reduce((sum, item) => sum + item.count, 0)
  const drafts = entries.filter(entry => entry.status === 'Draft')
  const remedials = entries.filter(entry => awaitingRemedial(entry, entries) && !drafts.some(draft => draft.linkedTo === entry.id))
  const tasks = entries.filter(entry => entry.status === 'To do')
  const actions = [...tasks, ...remedials, ...drafts].slice(0, 3)
  const metrics = [
    { label: 'Total entries', value: entries.filter(entry => entry.status !== 'To do').length, icon: BookOpen },
    { label: 'Pending approval', value: counts[1].count, icon: Clock3 },
    { label: 'Approved', value: counts[0].count, icon: CheckCircle2 },
    { label: 'Needs action', value: tasks.length + drafts.length + remedials.length, icon: FilePenLine },
  ]
  const recent = [...entries].sort((a, b) => (b.updatedAt || b.submittedAt || b.date || '').localeCompare(a.updatedAt || a.submittedAt || a.date || '')).slice(0, 5)
  const subjects = SUBJECTS.map(subject => ({ ...subject, count: entries.filter(entry => entry.subject === subject.name && entry.status !== 'Draft').length })).filter(subject => subject.count).sort((a, b) => b.count - a.count).slice(0, 4)
  const statusAction = status => onNavigate('search', undefined, status)
  const focusStatus = event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    const buttons = [...event.currentTarget.parentElement.querySelectorAll('button')]
    buttons[(buttons.indexOf(event.currentTarget) + (event.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length]?.focus()
  }
  return <div className="lb-overview">
    <div className="lb-summary-strip" aria-label="Logbook summary">{metrics.map(({ label, value, icon }, index) => {
      const MetricIcon = icon
      return <button onClick={() => onNavigate('search', undefined, ['Logged entries', 'Pending', 'Approved', 'Needs action'][index])} className={`lb-summary-item my-skills-metric-card ${['is-assigned', 'is-assigned', 'is-completed', 'is-completed', 'is-results', 'is-results'][index]}`} key={label}><span className="my-skills-metric-card-icon"><MetricIcon size={18} aria-hidden="true" /></span><span className="my-skills-metric-card-copy"><strong>{value}</strong><span>{label}</span></span></button>
    })}</div>
    <div className="lb-overview-top">
      <section className="lb-overview-panel"><div className="lb-section-head"><h2>Verification</h2><span className="lb-overview-note">{total} submitted · excludes drafts</span></div>
        <div className="lb-verification-chart" aria-label="Verification status comparison">{counts.map(item => {
          const percent = total ? Math.round(item.count / total * 100) : 0
          return <button key={item.status} className={`lb-verification-row is-${item.status.toLowerCase()} ${highlight && highlight !== item.status ? 'is-muted' : ''}`} onClick={() => statusAction(item.status)} onFocus={() => setHighlight(item.status)} onBlur={() => setHighlight(null)} onMouseEnter={() => setHighlight(item.status)} onMouseLeave={() => setHighlight(null)} onKeyDown={focusStatus} aria-label={`${item.status}: ${item.count} entries, ${percent} percent. View records`}>
            <span className="lb-verification-label"><span>{item.status}</span><strong>{item.count}<small>{percent}%</small></strong></span>
            <span className="lb-verification-track"><span style={{ width: percent + '%' }} /></span>
          </button>
        })}</div>
        <p className="lb-overview-note" aria-live="polite">{!total ? 'Submit an entry to see verification progress.' : highlight ? 'View ' + highlight.toLowerCase() + ' entries' : 'Select a status to view entries'}</p>
      </section>
      <section className="lb-overview-panel"><div className="lb-section-head"><h2>Needs your action <span className="lb-overview-count">{tasks.length + drafts.length + remedials.length}</span></h2><button className="lb-text-btn" onClick={() => onNavigate('search', undefined, 'Needs action')}>View all <ArrowRight size={14} /></button></div>
        {actions.length ? actions.map(entry => <div className="lb-action-row" key={entry.id}>{entry.status === 'Draft' ? <FilePenLine size={16} /> : <Undo2 size={16} />}<span><strong title={entryTitle(entry)}>{entryTitle(entry)}</strong><small>{subjectLabel(entry.subject)}</small></span><button className="lb-action-link" onClick={() => ['Draft', 'To do'].includes(entry.status) ? onEdit(entry) : isGraded(entry) ? onRemedial(entry) : onEdit(entry)}>{entry.status === 'Draft' ? 'Continue draft' : entry.status === 'To do' ? 'Complete entry' : isGraded(entry) ? 'Log remedial' : 'Edit and resubmit'}<ArrowRight size={13} /></button></div>) : <p className="lb-overview-empty"><CheckCircle2 size={18} /> No entries need your attention.</p>}
      </section>
    </div>
    <div className="lb-overview-bottom">
      <section className="lb-overview-panel"><div className="lb-section-head"><h2>Recent activity</h2><button className="lb-text-btn" onClick={() => onNavigate('search')}>View all <ArrowRight size={14} /></button></div>

        {recent.length ? recent.map(entry => <button className="lb-recent-row" key={entry.id} onClick={() => onOpen(entry.id)}><span className="lb-recent-icon"><BookOpen size={18} /></span><span className="lb-recent-name"><strong title={entryTitle(entry)}>{entryTitle(entry)}</strong><small title={subjectLabel(entry.subject)}>{subjectLabel(entry.subject)} / {facultyName(entry.faculty)}</small></span><span className="lb-recent-meta"><span className={`lb-status is-${entry.status.toLowerCase().replaceAll(' ', '-')}`}>{entry.status}</span><time dateTime={entry.date}>{formatDate(entry.date)}</time></span><ChevronRight size={16} /></button>) : <p className="lb-overview-empty">Your entries will appear here once you start logging.</p>}
      </section>
      <section className="lb-overview-panel"><div className="lb-section-head"><h2>Active subjects</h2><button className="lb-text-btn" onClick={() => onNavigate('subjects')}>View all <ArrowRight size={14} /></button></div>
        {subjects.length ? <div className="lb-active-subject-cards">{subjects.map(subject => <LogbookSubjectCard key={subject.name} subject={subject} entries={entries} onSubject={onSubject} />)}</div> : <p className="lb-overview-empty">Subjects appear after you submit an entry.</p>}
      </section>
    </div>
  </div>
}
