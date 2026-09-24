import LogbookCommentBadge from './LogbookCommentBadge'
import { entryTitle, formatDate } from '../../services/logbook'
import { categoryLabel } from '../../services/logbookPresentation'
import { actorName } from '../../services/logbookPeople'
import './LogbookStudentWorkflow.css'

/** Learner handoff for faculty assignments. */
export default function LogbookStudentWorkflow({ entries, onEdit }) {
  const tasks = entries.filter(entry => entry.status === 'To do')
  return <div className="lb-student-workflow">{tasks.length > 0 && <section className="lb-card lb-stack"><h2>Assigned to you</h2>{tasks.map(entry => <article className="lb-assigned-task" key={entry.id}><div><strong>{entryTitle(entry)}<LogbookCommentBadge entry={entry} /></strong><small>{entry.subject} / {categoryLabel(entry.cat)}</small>{entry.assignment.instructions && <p>{entry.assignment.instructions}</p>}<small>{actorName(entry.assignment.by)} | {entry.assignment.due ? `Due ${formatDate(entry.assignment.due)}` : 'No deadline'}</small></div><button className="lb-btn lb-primary" onClick={() => onEdit(entry)}>Complete entry</button></article>)}</section>}</div>
}
