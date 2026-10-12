import { Pencil, History, BookOpen, BadgeCheck } from 'lucide-react'
import LogbookDrawer from '../logbook/LogbookDrawer'
import './StudentRecord.css'

/** Read-only profile and append-only audit history; edits open the shared form. */
export default function StudentRecord({ student, data, theme, canEdit, onClose, onAction }) {
  const batch = data.batches.find(item => item.id === student.batch)
  return <LogbookDrawer title={student.name} subtitle={student.registrationId} eyebrow="Student record" theme={theme} onClose={onClose}>
    <div className="lb-drawer-body sm-record">
      <span className={`student-management-status is-${student.status.toLowerCase()}`}>{student.status}</span>
      <dl>{Object.entries({ Email: student.email, Phone: student.phone, Batch: student.batch, Year: student.year, 'Academic year': student.academicYear, Section: student.section, 'Subject / department': student.subject, 'Joined on': student.joinedOn, 'Year started': student.startedAt, Syllabus: student.syllabus || `${batch?.syllabus || 'Not assigned'} (batch default)` }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not recorded'}</dd></div>)}</dl>
      {!student.tracked && <p className="lb-alert">Year tracking is not set up. This student cannot be promoted until setup is complete.</p>}
      {canEdit && <div className="sm-actions"><button className="lb-btn" onClick={() => onAction({ type: 'save', student })}><Pencil size={15} />Edit details</button>{student.year !== 'Graduated' && <><button className="lb-btn" onClick={() => onAction({ type: 'status', student })}><BadgeCheck size={15} />{student.status === 'Active' ? 'Deactivate' : 'Activate'}</button><button className="lb-btn" onClick={() => onAction({ type: student.tracked ? 'correct' : 'setup', student })}><History size={15} />{student.tracked ? 'Correct year' : 'Set up year'}</button></>}<button className="lb-btn" onClick={() => onAction({ type: 'syllabus', student })}><BookOpen size={15} />Assign syllabus</button></div>}
      <section><h3>Year and change history</h3>{!student.history.length ? <p>No year history yet.</p> : <ol className="sm-timeline">{[...student.history].reverse().map(event => <li key={event.id}><strong>{event.action}</strong><span>{event.year} · {event.academicYear}</span><time>{event.date}</time>{event.note && <p>{event.note}</p>}</li>)}</ol>}</section>
    </div>
  </LogbookDrawer>
}
