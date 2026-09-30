import { actorName, REVIEWERS } from '../../services/logbookPeople'
import { formatDate } from '../../services/logbook'
import './LogbookApprovalSummary.css'

/** Current-round approval evidence; historical rounds remain in the audit history. */
export default function LogbookApprovalSummary({ record, chain, rows, requirements, skills, children }) {
  const round = (record.history || []).slice((record.history || []).findLastIndex(event => event.action === 'submit') + 1)
  const totals = [
    ['Entries', rows.filter(entry => !['Draft', 'To do'].includes(entry.status)).length],
    ['Approved', rows.filter(entry => entry.status === 'Approved').length],
    ['Skills certified', skills.length ? `${skills.filter(skill => skill.complete).length} / ${skills.length}` : 'Not configured'],
    ['Logged requirements met', requirements.length ? `${requirements.filter(item => item.met).length} / ${requirements.length}` : 'Not configured'],
  ]
  return <>
    <dl className="lb-approval-totals">{totals.map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={typeof value === 'string' && value === 'Not configured' ? 'is-unconfigured' : undefined}>{value}</dd></div>)}</dl>
    <div className="lb-approval-notices">{children}</div><section className="lb-approval-chain"><header><h3>Approval chain</h3>
      {record.status === 'Submitted' && <p className="lb-muted">Step {record.step + 1} of {chain.length}</p>}</header>
      <ol className="lb-signoff-steps">{chain.map((id, index) => {
        const decision = round.findLast(event => event.actor === id && ['approve', 'return'].includes(event.action))
        const state = decision?.action === 'return' ? 'Returned' : decision?.action === 'approve' || record.status === 'Completed' ? 'Signed' : record.status === 'Submitted' && index === record.step ? 'Awaiting signature' : record.status === 'Returned' ? 'Not reached in this round' : 'Waiting'
        const tone = state === 'Signed' ? 'signed' : state === 'Returned' ? 'returned' : state === 'Awaiting signature' ? 'current' : 'waiting'
        return <li key={id} className={'is-' + tone}><span className="lb-approval-step-number" aria-hidden="true">{index + 1}</span><div><strong>{actorName(id)}</strong><small>{REVIEWERS.find(person => person.id === id)?.role === 'HoD' ? 'Head of Department' : REVIEWERS.find(person => person.id === id)?.role || 'Approver'} &middot; {state}{decision?.at ? ` / ${formatDate(decision.at)}` : ''}</small>{decision?.remarks && <p className="lb-muted">{decision.remarks}</p>}</div></li>
      })}</ol>
    </section>
  </>
}
