import { actorName, learnerRegisterId } from '../../services/logbookPeople'
import { chainFor } from '../../services/adminLogbook'
import { formatDate } from '../../services/logbook'
import { signoffEligibility } from '../../services/logbookPolicy'
import { createElement } from 'react'
import { ArrowLeft, ChevronDown, Plus, BookOpen, CheckCircle2, Clock3, ClipboardList } from 'lucide-react'
import { skillProgress } from '../../services/logbook'
import { SUBJECTS } from '../../services/logbookCatalog'
import { requirementProgress } from '../../services/logbookProgress'
import './AdminLogbookStudentDetail.css'

/** Student summary and subject readiness. Parent retains assignment, sign-off and navigation actions.
 * @param {{student:Object,subjects:string[],workflow:Object,busy:boolean,onBack:Function,onAssign:Function,onReady:Function,renderSignoff:Function}} props
 */
export default function AdminLogbookStudentDetail({ student, subjects, workflow, busy, onBack, onAssign, onReady, renderSignoff, selectedSubject }) {
  return <section className="lb-card admin-student-detail">
    <header className="admin-student-detail-head"><button className="lb-btn" onClick={onBack} aria-label="Back to students"><ArrowLeft size={18} /></button><span className="admin-student-detail-avatar" aria-hidden="true">{student.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span><div><h2>{student.name}</h2><small>{learnerRegisterId(student.id)}</small></div><button className="lb-btn lb-primary" onClick={onAssign}><Plus size={16} />Assign entry</button></header>
    <div className="admin-student-detail-stats">{[[BookOpen, student.total, 'Submitted'], [CheckCircle2, student.approved, 'Approved'], [Clock3, student.pending, 'Pending'], [ClipboardList, student.required ? `${student.met}/${student.required}` : 'Not configured', 'Logged category coverage']].map(([icon, count, label]) => <div key={label}>{createElement(icon, { size: 16, 'aria-hidden': true })}<strong>{count}</strong><span>{label}</span></div>)}</div>
    {student.reasons?.length > 0 && <p className="lb-alert">Needs attention: {student.reasons.join(' / ')}</p>}<div className="admin-student-subject-heading"><h3>Subject readiness</h3><span>Logged coverage and certification are separate</span></div>
    <div className="admin-student-subjects">{subjects.map(subject => {
      const rows = student.all.filter(entry => entry.subject === subject)
      const record = workflow?.signoffs?.[student.id + ':' + subject]
      const { pending: blockers, approved, allowed } = signoffEligibility(rows)
      const requirements = requirementProgress(subject, rows)
      const skills = skillProgress(rows, SUBJECTS.find(item => item.name === subject)).filter(skill => skill.required > 0)
      const locked = busy || !allowed || Boolean(record && record.status !== 'Not ready')
      return <details className="admin-student-subject" key={subject} open={selectedSubject === subject || undefined}><summary><span><strong>{subject}</strong><small>{approved} approved / {blockers} awaiting completion</small></span><span className="admin-student-readiness">{record?.status || 'Not ready'}</span><ChevronDown size={16} aria-hidden="true" /></summary>
        <div className="admin-student-subject-body"><div className="admin-readiness-context"><span className="admin-readiness-label">Approval chain</span><p className="lb-muted">{(record?.chain || chainFor(workflow || {}, subject)).map(actorName).join(' / ')}</p>{record?.readyAt && <p className="lb-muted">Marked ready by {actorName(record.readyBy)} / {formatDate(record.readyAt)}</p>}<p className="admin-certification-summary">{skills.length ? `${skills.filter(skill => skill.complete).length} of ${skills.length} skills certified` : 'Certification requirements not configured'}</p></div><div className="admin-readiness-coverage"><span className="admin-readiness-label">Logged category coverage</span>{requirements.length > 0 ? <div className="admin-requirements">{requirements.map(item => <div key={item.cat}>{item.label}<small>{item.count}/{item.required} logged</small></div>)}</div> : <p className="lb-muted">No category minimums configured.</p>}</div>
          <div className="admin-student-readiness-action"><p className="lb-muted">{blockers ? `${blockers} pending entries or tasks must be cleared.` : !approved ? 'Verify an entry before marking ready.' : 'Faculty judgement determines readiness; logged coverage includes pending and returned work and does not certify skills.'}</p>
          <button className="lb-btn" disabled={locked} onClick={() => onReady(subject)}>{busy ? 'Saving...' : 'Mark ready for final approval'}</button></div>
          {record && renderSignoff(record)}
        </div>
      </details>
    })}</div>
  </section>
}
