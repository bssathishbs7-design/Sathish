import LogbookDrawer from './LogbookDrawer'
import { entryTitle, formatDate } from '../../services/logbook'
import './LogbookSkillRecord.css'

/** Read-only Skills projection shared by student and faculty Logbooks.
 * @param {{entry:Object,entries:Object[],theme:string,onClose:Function,onOpen:Function,onOpenSkill:Function}} props
 */
export default function LogbookSkillRecord({ entry, entries, theme, onClose, onOpen, onOpenSkill }) {
  const attempts = entries.filter(row => row.sourceAssignmentId === entry.sourceAssignmentId && row.studentId === entry.studentId).sort((a, b) => a.attemptNumber - b.attemptNumber)
  const performance = entry.performance
  return <LogbookDrawer title={entryTitle(entry)} subtitle={`${entry.subject} · ${entry.cat === 'cert' ? 'Certifiable skill' : 'Skill competency'}`} theme={theme} onClose={onClose}>
    <div className="lb-drawer-body lb-skill-record">
      <p className="lb-alert">This is a read-only skill record. Complete the activity and faculty evaluation in Skills.</p>
      <dl className="lb-record">
        <div><dt>Student</dt><dd>{entry.studentName} · {entry.studentId}</dd></div>
        <div><dt>Attempt</dt><dd className="lb-mono">{entry.attemptNumber}</dd></div>
        <div><dt>Status</dt><dd><span className={`lb-status is-${entry.status.toLowerCase().replaceAll(' ', '-')}`}>{entry.status}</span></dd></div>
        <div><dt>Certifiable</dt><dd>{entry.cat === 'cert' ? 'Yes' : 'No'}</dd></div>
        <div><dt>Assigned</dt><dd>{formatDate(entry.assignment.assignedAt)}</dd></div>
        {entry.submittedAt && <div><dt>Submitted</dt><dd>{formatDate(entry.submittedAt)}</dd></div>}
        {entry.verifiedAt && <div><dt>Evaluated</dt><dd>{formatDate(entry.verifiedAt)}</dd></div>}
        <div><dt>Marks</dt><dd>{!entry.marksEnabled ? 'Disabled' : performance ? `${performance.totalObtainedMarks ?? 0} / ${performance.totalMarks ?? 0}` : 'Awaiting evaluation'}</dd></div>
      </dl>
      {entry.submissionItems?.length > 0 && <section><h3>Student submission</h3><ul className="lb-skill-performance">{entry.submissionItems.map(item => <li key={item.id}><span>{item.label}</span><p>{item.answer}</p></li>)}</ul></section>}
      {entry.extra.facultyRemarks && <section><h3>Faculty feedback</h3><p>{entry.extra.facultyRemarks}</p></section>}
      {performance?.itemSummaries?.length > 0 && <section><h3>Performance</h3><ul className="lb-skill-performance">{performance.itemSummaries.map((item, index) => <li key={item.id || index}><span>{item.prompt || item.label || item.title || `Item ${index + 1}`}</span><strong>{entry.marksEnabled ? `${item.obtainedMarks ?? 0} / ${item.totalMarks ?? 0}` : item.decisionState === 'right' ? 'Meets expectations' : item.decisionState === 'wrong' ? 'Needs improvement' : 'Not rated'}</strong>{item.feedback && <p>{item.feedback}</p>}</li>)}</ul></section>}
      <section><h3>Attempt history</h3><div className="lb-skill-history">{attempts.map(attempt => <button type="button" className="lb-btn" key={attempt.id} aria-current={attempt.id === entry.id ? 'true' : undefined} onClick={() => onOpen(attempt.id)}>Attempt {attempt.attemptNumber} · {attempt.status}</button>)}</div></section>
    </div>
    <footer className="lb-drawer-foot"><button className="lb-btn lb-primary" onClick={() => onOpenSkill(entry)}>View skill activity</button><button className="lb-btn" onClick={onClose}>Done</button></footer>
  </LogbookDrawer>
}
