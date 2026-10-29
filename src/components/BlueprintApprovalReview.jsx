import AssessmentApprovalReview from './AssessmentApprovalReview'
import { reviewBlueprintWorkflow } from '../services/blueprintApproval'
/** Blueprint-only review permits local edits; approval validates and persists the edited snapshot. */
export default function BlueprintApprovalReview({ currentUser, record, onBack, onDecision, theme = 'light', onToggleTheme, onValidateReview }) {
  const decide = async reviewed => {
    onValidateReview?.(record)
    const flow = reviewBlueprintWorkflow({ ...record, reviewedBy: currentUser?.name, reviewedById: currentUser?.id || currentUser?.registerId }, reviewed.approvalStatus === 'Approved' ? 'Approved' : 'Rejected', reviewed.reviewRemarks, localStorage, reviewed.approvalStatus === 'Approved' ? reviewed.blueprintSnapshot : undefined)
    await onDecision?.({ ...reviewed, blueprintId: flow.blueprintId, setup: { ...reviewed.setup, blueprintId: flow.blueprintId }, blueprintSnapshot: flow.snapshot, blueprintRevision: flow.revision,
      totalMarks: Number(flow.snapshot.blueprintDraft?.totalMark) || 0,
      questionCount: (flow.snapshot.pickerRows || []).reduce((sum, row) => sum + Number(row.count), 0),
      status: flow.status === 'Approved' ? 'Approved' : 'Approval Rejected',
      approvalStatus: flow.status === 'Approved' ? 'Approved' : 'Approval Rejected', reviewedAt: flow.reviewedAt })
  }
  return <AssessmentApprovalReview readOnly={record.submissionReadOnly} currentUser={currentUser} record={record} onBack={onBack} onDecision={decide} theme={theme} onToggleTheme={onToggleTheme} />
}
