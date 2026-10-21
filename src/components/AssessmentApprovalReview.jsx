import { useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { AssessmentAuthorWorkspace } from '../pages/CreateAssessmentPage'
import './AssessmentApprovalReview.css'

/**
 * Pending reviews edit a local submitted snapshot; author views stay read-only.
 * @param {{record: {activityId:string, setup:Object, blueprintSnapshot?:Object, previewSections?:Array, questionRows?:Array}, onBack:Function, onDecision:Function, readOnly?:boolean}} props
 */
export default function AssessmentApprovalReview({ record, onBack, onDecision, readOnly = false, theme = 'light', onToggleTheme }) {
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const remarksRef = useRef(null)
  const blueprintEditorRef = useRef(null)
  const assessmentEditorRef = useRef(null)
  const isBlueprint = record.activityType === 'Blueprint'
  const actionable = !readOnly && record.approvalStatus === 'Pending Approval'
  const editableBlueprint = isBlueprint && actionable
  const decide = async status => {
    if (!actionable || submitting.current) return
    if (status === 'Approval Rejected' && !remarks.trim()) {
      setError('Add review remarks before rejecting this assessment.')
      remarksRef.current?.focus()
      return
    }
    submitting.current = true
    setBusy(true)
    setError('')
    try {
      if (!onDecision) throw new Error('Review is unavailable. Please return to the approval queue.')
      const snapshot = editableBlueprint && status === 'Approved' ? blueprintEditorRef.current?.getSnapshot() : undefined
      if (editableBlueprint && status === 'Approved' && !snapshot) throw new Error('The blueprint editor is not ready. Please try again.')
      const editedAssessment = !isBlueprint && status === 'Approved' ? assessmentEditorRef.current?.getSnapshot() : undefined
      if (!isBlueprint && status === 'Approved' && !editedAssessment) throw new Error('The assessment editor is not ready. Please try again.')
      await onDecision({ ...record, ...editedAssessment, ...(snapshot ? { blueprintSnapshot: snapshot } : {}), status, approvalStatus: status, reviewRemarks: remarks.trim(), reviewedAt: new Date().toISOString() })
    } catch (reason) { setError(reason.message || 'Unable to save the decision. Please try again.') }
    finally { submitting.current = false; setBusy(false) }
  }
  const reviewActions = <>
      {actionable && <footer className="assessment-review-actions"><label htmlFor="assessment-review-remarks">Review remarks<textarea id="assessment-review-remarks" ref={remarksRef} value={remarks} onChange={event => setRemarks(event.target.value)} disabled={busy} placeholder="Required when rejecting" aria-describedby={error ? 'assessment-review-error' : undefined} /></label>
        {error && <p id="assessment-review-error" role="alert">{error}</p>}
        <div><button type="button" disabled={busy} onClick={() => decide('Approval Rejected')}><X size={16} />Reject</button><button type="button" className="assessment-review-approve" disabled={busy} onClick={() => decide('Approved')}><Check size={16} />{busy ? 'Saving…' : 'Save and approve'}</button></div>
      </footer>}
      {!actionable && record.reviewRemarks && <p><strong>Review remarks:</strong> {record.reviewRemarks}</p>}
    </>
  return <AssessmentAuthorWorkspace assessmentReview={record} assessmentEditable={actionable && !isBlueprint} assessmentEditorRef={assessmentEditorRef} blueprintReview={editableBlueprint ? { record } : undefined} blueprintEditorRef={blueprintEditorRef} theme={theme} onToggleTheme={onToggleTheme}
    onReviewExit={onBack} reviewBusy={busy} reviewActions={actionable || record.reviewRemarks ? reviewActions : null} />
}
