import { createElement } from 'react'
import { ArrowLeft, ChevronDown, Plus, BookOpen, CheckCircle2, Clock3, ClipboardList } from 'lucide-react'
import { requirementProgress } from '../../services/logbookProgress'
import './AdminLogbookStudentDetail.css'

/** Student summary and subject readiness. Parent retains assignment, sign-off and navigation actions.
 * @param {{student:Object,subjects:string[],workflow:Object,busy:boolean,onBack:Function,onAssign:Function,onReady:Function,renderSignoff:Function}} props
 */
export default function AdminLogbookStudentDetail({ student, subjects, workflow, busy, onBack, onAssign, onReady, renderSignoff }) {
  return <section className="lb-card admin-student-detail">
    <header className="admin-student-detail-head"><button className="lb-btn" onClick={onBack} aria-label="Back to students"><ArrowLeft size={18} /></button><span className="admin-student-detail-avatar" aria-hidden="true">{student.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span><div><h2>{student.name}</h2><small>{student.id}</small></div><button className="lb-btn lb-primary" onClick={onAssign}><Plus size={16} />Assign entry</button></header>
    <div className="admin-student-detail-stats">{[[BookOpen, student.total, 'Submitted'], [CheckCircle2, student.approved, 'Approved'], [Clock3, student.pending, 'Pending'], [ClipboardList, `${student.met}/${student.required}`, 'Requirements met']].map(([icon, count, label]) => <div key={label}>{createElement(icon, { size: 16, 'aria-hidden': true })}<strong>{count}</strong><span>{label}</span></div>)}</div>
    <div className="admin-student-subject-heading"><h3>Subject readiness</h3><span>Expand to review requirements</span></div>
    <div className="admin-student-subjects">{subjects.map(subject => {
      const rows = student.all.filter(entry => entry.subject === subject)
      const record = workflow?.signoffs?.[student.id + ':' + subject]
      const blockers = rows.filter(entry => ['Pending', 'To do'].includes(entry.status)).length
      const approved = rows.filter(entry => entry.status === 'Approved').length
      const requirements = requirementProgress(subject, rows)
      const locked = busy || blockers > 0 || !approved || Boolean(record && !['Not ready', 'Returned'].includes(record.status))
      return <details className="admin-student-subject" key={subject}><summary><span><strong>{subject}</strong><small>{approved} approved / {blockers} awaiting completion</small></span><span className="admin-student-readiness">{record?.status || 'Not ready'}</span><ChevronDown size={16} aria-hidden="true" /></summary>
        <div className="admin-student-subject-body">{requirements.length > 0 ? <div className="admin-requirements">{requirements.map(item => <div key={item.cat}>{item.label}<small>{item.count}/{item.required} logged</small></div>)}</div> : <p className="lb-muted">No category minimums configured.</p>}
          <p className="lb-muted">{blockers ? `${blockers} pending entries or tasks must be cleared.` : !approved ? 'Verify an entry before marking ready.' : 'Faculty judgement determines readiness.'}</p>
          <button className="lb-btn" disabled={locked} onClick={() => onReady(subject)}>{busy ? 'Saving...' : 'Mark ready for final approval'}</button>
          {record && renderSignoff(record)}
        </div>
      </details>
    })}</div>
  </section>
}
