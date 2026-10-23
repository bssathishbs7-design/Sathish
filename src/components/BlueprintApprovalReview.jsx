import AssessmentApprovalReview from './AssessmentApprovalReview'
import { reviewBlueprintWorkflow } from '../services/blueprintApproval'
/** Blueprint-only review permits local edits; approval validates and persists the edited snapshot. */
export default function BlueprintApprovalReview({ currentUser, record, onBack, onDecision, theme = 'light', onToggleTheme }) {
  const decide = async reviewed => {
    const flow = reviewBlueprintWorkflow(record, reviewed.approvalStatus === 'Approved' ? 'Approved' : 'Rejected', reviewed.reviewRemarks, localStorage, reviewed.approvalStatus === 'Approved' ? reviewed.blueprintSnapshot : undefined)
    await onDecision?.({ ...reviewed, blueprintSnapshot: flow.snapshot, blueprintRevision: flow.revision,
      totalMarks: Number(flow.snapshot.blueprintDraft?.totalMark) || 0,
      questionCount: (flow.snapshot.pickerRows || []).reduce((sum, row) => sum + Number(row.count), 0),
      status: flow.status === 'Approved' ? 'Approved' : 'Approval Rejected',
      approvalStatus: flow.status === 'Approved' ? 'Approved' : 'Approval Rejected', reviewedAt: flow.reviewedAt })
  }
  return <AssessmentApprovalReview currentUser={currentUser} record={record} onBack={onBack} onDecision={decide} theme={theme} onToggleTheme={onToggleTheme} />
}
