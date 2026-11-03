import { useRef, useState } from 'react'
import { ArrowLeft, Check, X } from 'lucide-react'
import SaveChangesDialog from './SaveChangesDialog'
import './AssessmentResultReview.css'

/** Read-only evaluation snapshot. Approval publishes; rejection returns it to faculty.
 * @param {{record:Object,onBack:Function,onDecision:Function,theme:string}} props
 */
export default function AssessmentResultReview({ record, onBack, onDecision, theme }) {
  const [decision, setDecision] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const remarksRef = useRef(null)
  const actionable = !record.submissionReadOnly && record.approvalStatus === 'Pending Approval'
  const rows = record.resultSnapshot?.rows || []
  const decide = async () => {
    if (!actionable || lock.current) return
    if (decision === 'Approval Rejected' && !remarks.trim()) {
      setError('Add remarks so faculty can correct and resubmit the results.')
      remarksRef.current?.focus()
      return
    }
    lock.current = true
    setBusy(true)
    setError('')
    try {
      await onDecision({ ...record, status: decision, approvalStatus: decision, reviewRemarks: remarks.trim() })
      setDecision(null)
    } catch (reason) { setError(reason.message || 'The decision could not be saved. Please retry.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <section className="vx-content assessment-result-review qb-sort-scope">
    <button type="button" className="btn" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />Back to approvals</button>
    <header><h1>{record.activityName}</h1><p>{record.approvalStatus}</p>
      <p>Submitted by {record.senderName || 'Faculty'}. Approval publishes this reviewed result snapshot to students.</p></header>
    <div className="assessment-result-review-table" role="region" tabIndex={0} aria-label="Submitted assessment results">
      <table><thead><tr><th scope="col">Student</th><th scope="col">ID</th><th scope="col">Evaluation</th><th scope="col">Marks</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}><th scope="row">{row.name}</th><td className="mono">{row.id}</td>
          <td>{row.isAbsent ? 'Absent' : row.evalStatus}</td><td className="mono">{row.isAbsent ? '-' : `${row.scoringSummary.obtainedMarks} / ${row.scoringSummary.maxMarks}`}</td></tr>)}</tbody></table>
    </div>
    {record.reviewRemarks && <p><strong>Review remarks:</strong> {record.reviewRemarks}</p>}
    {actionable && <footer><button type="button" className="btn" onClick={() => { setDecision('Approval Rejected'); setError('') }}><X size={16} aria-hidden="true" />Reject results</button>
      <button type="button" className="btn" onClick={() => { setDecision('Approved'); setError('') }}><Check size={16} aria-hidden="true" />Approve and publish</button></footer>}
    {decision && <SaveChangesDialog title={decision === 'Approved' ? 'Approve and publish results?' : 'Return results to faculty?'}
      description={record.activityName} theme={theme} busy={busy} error={error} onCancel={() => setDecision(null)} onSave={decide}
      saveLabel={decision === 'Approved' ? 'Approve and publish' : 'Reject results'} busyLabel="Saving decision...">
      <label className="assessment-result-review-remarks">Review remarks{decision === 'Approval Rejected' ? ' (required)' : ' (optional)'}
        <textarea ref={remarksRef} value={remarks} disabled={busy} required={decision === 'Approval Rejected'} onChange={event => setRemarks(event.target.value)} /></label>
    </SaveChangesDialog>}
  </section>
}
