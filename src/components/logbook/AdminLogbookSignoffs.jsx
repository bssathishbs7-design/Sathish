import { ChevronDown } from 'lucide-react'
import { learnerRegisterId } from '../../services/logbookPeople'
import LogbookSignoff from './LogbookSignoff'
import { learnerName } from '../../services/logbookPeople'
import './AdminLogbookSignoffs.css'

/** URL-backed approval filters; selection stays independent of queue membership. */
export default function AdminLogbookSignoffs({ records, view, onFilter, ...props }) {
  const state = view.approvalStatus || ''
  const rows = records.filter(record => (!view.approvalSubject || record.subject === view.approvalSubject) && (!view.approvalStudent || record.studentId === view.approvalStudent) && (!state || (state === 'mine' ? record.status === 'Submitted' && record.chain[record.step] === props.actor.id : state === 'others' ? record.status === 'Submitted' && record.chain[record.step] !== props.actor.id : record.status === state)))
    .sort((a, b) => (b.history?.at(-1)?.at || '').localeCompare(a.history?.at(-1)?.at || ''))
  return <section className="lb-card lb-stack admin-signoffs">
    <header className="admin-signoffs-heading"><h2>Subject sign-offs</h2><p className="lb-muted" role="status">{rows.length} subject {rows.length === 1 ? 'logbook' : 'logbooks'}</p></header>
    <div className="admin-signoff-filters">
      <label className="lb-field">Approval status<span className="admin-signoff-select"><select value={state} onChange={event => onFilter({ approvalStatus: event.target.value })}><option value="">All statuses</option><option value="mine">Awaiting your signature</option><option value="others">With other approvers</option>{['Ready', 'Returned', 'Completed'].map(status => <option key={status}>{status}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
      <label className="lb-field">Subject<span className="admin-signoff-select"><select value={view.approvalSubject || ''} onChange={event => onFilter({ approvalSubject: event.target.value })}><option value="">All subjects</option>{[...new Set(records.map(record => record.subject))].map(subject => <option key={subject}>{subject}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
      <label className="lb-field">Student<span className="admin-signoff-select"><select value={view.approvalStudent || ''} onChange={event => onFilter({ approvalStudent: event.target.value })}><option value="">All students</option>{[...new Set(records.map(record => record.studentId))].map(id => <option key={id} value={id}>{learnerName(id)} / {learnerRegisterId(id)}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
      <button className="lb-btn" onClick={() => onFilter({ approvalStatus: '', approvalSubject: '', approvalStudent: '' })}>Clear filters</button>
    </div>
    <LogbookSignoff {...props} records={rows} selectedKey={view.approval || null} onSelect={approval => onFilter({ approval: approval || '' })} empty={state === 'mine' ? 'No logbooks are awaiting your signature.' : state === 'Completed' ? 'No completed logbooks match these filters.' : 'No subject logbooks match these filters.'} />
  </section>
}
