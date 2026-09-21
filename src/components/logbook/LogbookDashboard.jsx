import { useState } from 'react'
import { ArrowRight, BookOpen, CheckCircle2, Clock3, FilePenLine, ChevronRight, Undo2 } from 'lucide-react'
import { SUBJECTS } from '../../services/logbookSample'
import { entryTitle, facultyName, formatDate, skillProgress, subjectProgress, today } from '../../services/logbook'
import { subjectLabel } from '../../services/logbookCatalog'
import './LogbookDashboard.css'

/** Compact learner overview. All actions use the page's existing navigation and entry flows.
 * @param {{entries:Object[],onNavigate:Function,onOpen:Function,onSubject:Function,onEdit:Function,onRemedial:Function}} props
 */
export default function LogbookDashboard({ entries, onNavigate, onOpen, onSubject, onEdit, onRemedial }) {
  const [highlight, setHighlight] = useState(null)
  const counts = ['Approved', 'Pending', 'Returned'].map(status => ({ status, count: entries.filter(entry => entry.status === status).length }))
  const total = counts.reduce((sum, item) => sum + item.count, 0)
  const skills = SUBJECTS.flatMap(subject => skillProgress(entries, subject))
  const drafts = entries.filter(entry => entry.status === 'Draft')
  const remedials = entries.filter(entry => entry.status === 'Returned' && !entries.some(child => child.linkedTo === entry.id && child.status !== 'Returned'))
  const actions = [...remedials, ...drafts].slice(0, 3)
  const monday = new Date(`${today()}T12:00:00`)
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7)
  const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
  const metrics = [
    { label: 'Needs action', value: drafts.length + remedials.length, hint: `${drafts.length} drafts, ${remedials.length} remedial due`, icon: FilePenLine, route: 'pending' },
    { label: 'Pending', value: counts[1].count, hint: 'Submitted and waiting on faculty', icon: Clock3, route: 'pending' },
    { label: 'Skills certified', value: `${skills.filter(skill => skill.complete).length}/${skills.length}`, hint: 'Competencies with all required attempts approved', icon: CheckCircle2, route: 'subjects' },
    { label: 'Not started', value: skills.filter(skill => !skill.attempts.some(entry => entry.status !== 'Draft')).length, hint: 'Competencies with no submitted attempts', icon: BookOpen, route: 'subjects' },
    { label: 'This week', value: entries.filter(entry => entry.status !== 'Draft' && entry.date >= weekStart && entry.date <= today()).length, hint: 'Entries logged since Monday; open all records', icon: BookOpen, route: 'search' },
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
    <div className="lb-summary-strip" aria-label="Logbook summary">{metrics.map(({ label, value, hint, icon, route }, index) => {
      const MetricIcon = icon
      return <button className={`lb-summary-item my-skills-metric-card ${['is-assigned', 'is-assigned', 'is-completed', 'is-completed', 'is-results', 'is-results'][index]}`} key={label} onClick={() => onNavigate(route)} title={hint} aria-describedby={`lb-metric-hint-${index}`}><span className="my-skills-metric-card-icon"><MetricIcon size={18} aria-hidden="true" /></span><span className="my-skills-metric-card-copy"><strong>{value}</strong><span>{label}</span></span><small role="tooltip" id={`lb-metric-hint-${index}`}>{hint}</small></button>
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
      <section className="lb-overview-panel"><div className="lb-section-head"><h2>Needs your action <span className="lb-overview-count">{drafts.length + remedials.length}</span></h2><button className="lb-text-btn" onClick={() => onNavigate('pending')}>View all <ArrowRight size={14} /></button></div>
        {actions.length ? actions.map(entry => <div className="lb-action-row" key={entry.id}>{entry.status === 'Draft' ? <FilePenLine size={16} /> : <Undo2 size={16} />}<span><strong title={entryTitle(entry)}>{entryTitle(entry)}</strong><small>{subjectLabel(entry.subject)}</small></span><button className="lb-action-link" onClick={() => entry.status === 'Draft' ? onEdit(entry) : onRemedial(entry)}>{entry.status === 'Draft' ? 'Continue draft' : 'Log remedial'}<ArrowRight size={13} /></button></div>) : <p className="lb-overview-empty"><CheckCircle2 size={18} /> No drafts or remedial attempts need your attention.</p>}
      </section>
    </div>
    <div className="lb-overview-bottom">
      <section className="lb-overview-panel"><div className="lb-section-head"><h2>Recent activity</h2><button className="lb-text-btn" onClick={() => onNavigate('search')}>View all <ArrowRight size={14} /></button></div>

        {recent.length ? recent.map(entry => <button className="lb-recent-row" key={entry.id} onClick={() => onOpen(entry.id)}><span className="lb-recent-icon"><BookOpen size={18} /></span><span className="lb-recent-name"><strong title={entryTitle(entry)}>{entryTitle(entry)}</strong><small title={subjectLabel(entry.subject)}>{subjectLabel(entry.subject)} / {facultyName(entry.faculty)}</small></span><span className="lb-recent-meta"><span className={`lb-status is-${entry.status.toLowerCase()}`}>{entry.status}</span><time dateTime={entry.date}>{formatDate(entry.date)}</time></span><ChevronRight size={16} /></button>) : <p className="lb-overview-empty">Your entries will appear here once you start logging.</p>}
      </section>
      <section className="lb-overview-panel"><div className="lb-section-head"><h2>Active subjects</h2><button className="lb-text-btn" onClick={() => onNavigate('subjects')}>View all <ArrowRight size={14} /></button></div>
        {subjects.length ? subjects.map(subject => {
          const progress = subjectProgress(entries, subject)
          return <button className="lb-subject-progress" key={subject.name} onClick={() => onSubject(subject.name)}><span className="lb-progress-heading"><strong>{subjectLabel(subject.name)}</strong><small>{subject.count} entries</small></span>{progress.required ? <><progress value={progress.approved} max={progress.required} aria-label={`${subjectLabel(subject.name)}: ${progress.approved} of ${progress.required} required attempts approved`} /><span className="lb-progress-caption"><span>Required attempts approved</span><strong>{progress.approved}/{progress.required}</strong></span></> : <small>Certification requirements not configured</small>}</button>
        }) : <p className="lb-overview-empty">Subjects appear after you submit an entry.</p>}
      </section>
    </div>
  </div>
}
