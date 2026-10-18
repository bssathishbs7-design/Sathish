import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import BlueprintApprovalSummary from './BlueprintApprovalSummary'
import CreateAssessmentPage from '../pages/CreateAssessmentPage'
import { readBlueprintWorkflow, reviewBlueprintWorkflow } from '../services/blueprintApproval'
import './BlueprintApprovalReview.css'
/** Review a submitted blueprint using the same distribution and specification editor as its author.
 * Edits remain local until Save and approve; rejection preserves the submitted snapshot.
 * @param {{record:Object,onBack:Function,onDecision:Function,theme?:string}} props
 */
export default function BlueprintApprovalReview({ record, onBack, onDecision, theme = 'light' }) {
 const [remarks, setRemarks] = useState('')
 const [error, setError] = useState('')
 const [busy, setBusy] = useState(false)
 const current = readBlueprintWorkflow(record.setup?.assessmentId)
 const actionable = current?.status === 'Pending Approval' && current.revision === record.blueprintRevision
 const decide = async (status, snapshot) => {
  if (busy) return
  setBusy(true)
  setError('')
  try {
   const flow = reviewBlueprintWorkflow(record, status, remarks, localStorage, snapshot)
   await onDecision?.({ ...record, blueprintSnapshot: flow.snapshot, blueprintRevision: flow.revision,
    totalMarks: Number(flow.snapshot.blueprintDraft?.totalMark), questionCount: flow.snapshot.pickerRows.reduce((sum, row) => sum + Number(row.count), 0),
    status: flow.status === 'Approved' ? 'Approved' : 'Approval Rejected', approvalStatus: flow.status === 'Approved' ? 'Approved' : 'Approval Rejected', reviewRemarks: remarks.trim(), reviewedAt: flow.reviewedAt })
  } catch (reason) { setError(reason.message); setBusy(false); throw reason }
 }
 return <div className="vx-content blueprint-approval-page qb-sort-scope"><section className="blueprint-approval-review">
  <header className="blueprint-review-header">
   <button type="button" className="blueprint-review-back" disabled={busy} onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />Back</button>
   <div className="blueprint-review-title"><h2>Review blueprint</h2><span className="blueprint-review-name">{record.activityName}</span></div>
   <div className="blueprint-review-badges" aria-label="Blueprint identifiers">
   <span className="blueprint-review-badge is-assessment mono" title="Assessment ID">{record.setup?.assessmentCode || record.setup?.assessmentId}</span>
   <strong className="blueprint-review-badge is-blueprint mono" title="Blueprint ID">{record.blueprintId}</strong>
   <span className="blueprint-review-badge is-revision">Rev {record.blueprintRevision}</span>
   </div>
   <div className="blueprint-review-submission"><span className="blueprint-review-sender">Sent by {record.senderName || '-'}</span>
   <time className="blueprint-review-time">{record.sentAt ? new Date(record.sentAt).toLocaleString('en-GB', { hour12: true }).toUpperCase() : '-'}</time></div>
  </header>
  {record.approvalFaculty?.note && <p>Submission note: {record.approvalFaculty.note}</p>}
  {actionable ? <>
   <div className="blueprint-review-notes">
    <label htmlFor="blueprint-review-remarks">Review remarks</label>
    <textarea id="blueprint-review-remarks" rows={1} value={remarks} onChange={event => setRemarks(event.target.value)} disabled={busy} placeholder="Add remarks (required for rejection)" />
    <small>Changes save on approval.</small>
   </div>
   <CreateAssessmentPage key={`${record.blueprintId}-${record.blueprintRevision}`} theme={theme} blueprintReview={{ record, onApprove: snapshot => decide('Approved', snapshot), footerActions: <button type="button" className="blueprint-review-secondary" disabled={busy} onClick={() => { decide('Rejected').catch(() => {}) }}>Reject submitted blueprint</button> }} />
  </> : <BlueprintApprovalSummary flow={{ blueprintId: record.blueprintId, revision: record.blueprintRevision, snapshot: record.blueprintSnapshot, status: record.approvalStatus, reviewRemarks: record.reviewRemarks }} />}
  {error && <p role="alert">{error}</p>}
 </section></div>
}
