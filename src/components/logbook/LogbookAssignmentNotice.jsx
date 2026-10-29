import { formatDate } from '../../services/logbook'
import { sourceCategoryLabel } from '../../services/logbookAssignmentSamples'
import './LogbookAssignmentNotice.css'

/** Shared faculty/learner provenance notice; completed work is never implied by a sample task. */
export default function LogbookAssignmentNotice({ assignment }) {
  if (!assignment) return null
  return <div className="lb-alert lb-assignment-notice">
    {assignment.activityId && <strong>{assignment.sample ? 'Sample template' : 'Document activity'} · {assignment.phase} · {sourceCategoryLabel(assignment.sourceCategory)}</strong>}
    {assignment.activityId && <p>Assigned {formatDate(assignment.assignedAt)}</p>}
    <p>{assignment.instructions || 'Complete the assigned activity.'}</p>
    <p>{assignment.due ? `Due ${formatDate(assignment.due)}` : 'No deadline'}</p>
    <small>Faculty-supplied fields are locked. Add your own completion details and reflection.</small>
  </div>
}
