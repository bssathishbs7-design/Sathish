import LogbookInsights from './LogbookInsights'
import { isLoggedEntry, entrySubjectLocked } from '../../services/logbookPolicy'
import LogbookCommentBadge from './LogbookCommentBadge'
import { awaitingRemedial, isGraded, matchesRemedial } from '../../services/logbookPeople'
import LogbookSubjectCard from './LogbookSubjectCard'
import { useState } from 'react'
import { latestEntryEvent } from '../../services/logbookDates'
import { ArrowRight, BookOpen, CheckCircle2, Clock3, FilePenLine, ChevronRight, Undo2 } from 'lucide-react'
import { SUBJECTS } from '../../services/logbookSample'
import { entryTitle, facultyName, formatDate } from '../../services/logbook'
import { subjectLabel } from '../../services/logbookCatalog'
import './LogbookDashboard.css'

/** Compact learner overview. All actions use the page's existing navigation and entry flows.
 * @param {{entries:Object[],onNavigate:Function,onOpen:Function,onSubject:Function,onEdit:Function,onRemedial:Function}} props
 */
export default function LogbookDashboard({ entries, identity, onNavigate, onOpen, onSubject, onEdit, onRemedial, signoffs = [] }) {
  const [highlight, setHighlight] = useState(null)
  const counts = ['Approved', 'Pending', 'Returned'].map(status => ({ status, count: entries.filter(entry => entry.status === status).length }))
  const total = counts.reduce((sum, item) => sum + item.count, 0)
  const available = entries.filter(entry => !entrySubjectLocked(entry, signoffs))
  const drafts = available.filter(entry => entry.status === 'Draft')
  const remedials = available.filter(entry => awaitingRemedial(entry, entries) && !drafts.some(draft => matchesRemedial(entry, draft)))
  const finalTasks = signoffs.filter(record => ['Ready', 'Returned'].includes(record.status))
  const tasks = available.filter(entry => entry.status === 'To do').sort((a,b) => (a.assignment?.due || '9999').localeCompare(b.assignment?.due || '9999'))
  const actions = [...remedials, ...tasks, ...drafts].slice(0, 5)
  const metrics = [
    { label: 'Total entries', value: entries.filter(isLoggedEntry).length, icon: BookOpen },
    { label: 'Pending approval', value: counts[1].count, icon: Clock3 },
    { label: 'Approved', value: counts[0].count, icon: CheckCircle2 },
    { label: 'Needs action', value: tasks.length + drafts.length + remedials.length + finalTasks.length, icon: FilePenLine },
  ]
  const recent = [...entries].sort((a, b) => latestEntryEvent(b).localeCompare(latestEntryEvent(a))).slice(0, 5)
  const subjects = SUBJECTS.map(subject => ({ ...subject, count: entries.filter(entry => entry.subject === subject.name && isLoggedEntry(entry)).length })).filter(subject => subject.count).sort((a, b) => b.count - a.count).slice(0, 4)
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
      <section className="lb-overview-panel"><div className="lb-section-head"><h2>Needs your action <span className="lb-overview-count">{tasks.length + drafts.length + remedials.length + finalTasks.length}</span></h2><button className="lb-text-btn" onClick={() => onNavigate('search', undefined, 'Needs action')}>View all <ArrowRight size={14} /></button></div>
        {finalTasks.map(record => <div className="lb-action-row" key={record.subject}><FilePenLine size={16} /><span><strong>{subjectLabel(record.subject)}</strong><small>Subject approval · {record.status}</small></span><button className="lb-action-link" onClick={() => onSubject(record.subject, true)}>{record.status === 'Returned' ? 'Review and resubmit' : 'Submit logbook'}<ArrowRight size={13} /></button></div>)}{actions.length ? actions.map(entry => <div className="lb-action-row" key={entry.id}>{entry.status === 'Draft' ? <FilePenLine size={16} /> : <Undo2 size={16} />}<span><span className="lb-title-with-indicators"><strong title={entryTitle(entry)}>{entryTitle(entry)}</strong><LogbookCommentBadge entry={entry} /></span><small>{subjectLabel(entry.subject)}{entry.assignment?.due ? ` · Due ${formatDate(entry.assignment.due)}` : ''}</small></span><button className="lb-action-link" onClick={() => entry.source === 'skills' ? onOpen(entry.id) : ['Draft', 'To do'].includes(entry.status) ? onEdit(entry) : isGraded(entry) ? onRemedial(entry) : onEdit(entry)}>{entry.source === 'skills' ? 'View skill activity' : entry.status === 'Draft' ? 'Continue draft' : entry.status === 'To do' ? 'Complete entry' : isGraded(entry) ? 'Log remedial' : 'Edit and resubmit'}<ArrowRight size={13} /></button></div>) : <p className="lb-overview-empty"><CheckCircle2 size={18} /> {finalTasks.length ? 'No individual entries need your attention.' : 'No entries need your attention.'}</p>}
      </section>
    </div>
    <LogbookInsights entries={entries} identity={identity} onNavigate={onNavigate} onSubject={onSubject} /><div className="lb-overview-bottom">
      <section className="lb-overview-panel"><div className="lb-section-head"><h2>Recent activity</h2><button className="lb-text-btn" onClick={() => onNavigate('search')}>View all <ArrowRight size={14} /></button></div>

        {recent.length ? recent.map(entry => <button className="lb-recent-row" key={entry.id} onClick={() => onOpen(entry.id)}><span className="lb-recent-icon"><BookOpen size={18} /></span><span className="lb-recent-name"><span className="lb-title-with-indicators"><strong title={entryTitle(entry)}>{entryTitle(entry)}</strong><LogbookCommentBadge entry={entry} /></span><small title={subjectLabel(entry.subject)}>{subjectLabel(entry.subject)} / {facultyName(entry.faculty)}</small></span><span className="lb-recent-meta"><span className={`lb-status is-${entry.status.toLowerCase().replaceAll(' ', '-')}`}>{entry.status}</span><time dateTime={latestEntryEvent(entry)}>{formatDate(latestEntryEvent(entry))}</time></span><ChevronRight size={16} /></button>) : <p className="lb-overview-empty">Your entries will appear here once you start logging.</p>}
      </section>
      <section className="lb-overview-panel"><div className="lb-section-head"><h2>Active subjects</h2><button className="lb-text-btn" onClick={() => onNavigate('subjects')}>View all <ArrowRight size={14} /></button></div>
        {subjects.length ? <div className="lb-active-subject-cards">{subjects.map(subject => <LogbookSubjectCard key={subject.name} subject={subject} approval={signoffs.find(record => record.subject === subject.name)} entries={entries} onSubject={onSubject} />)}</div> : <p className="lb-overview-empty">Subjects appear after you submit an entry.</p>}
      </section>
    </div>
  </div>
}
