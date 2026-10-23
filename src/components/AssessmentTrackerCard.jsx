import { TriangleAlert } from 'lucide-react'
import './AssessmentTrackerCard.css'

/** Shared tracker layout. Slots retain the owning page's stage-specific actions.
 * @param {{identity:React.ReactNode, summary:React.ReactNode, settings:React.ReactNode,
 * actions:React.ReactNode, topBadge?:React.ReactNode, resultSummary?:React.ReactNode, resultPlacement?:"footer"|"schedule", timestamp?:React.ReactNode, className?:string, expired?:boolean}} props
 */
export default function AssessmentTrackerCard({ identity, summary, settings, actions, topBadge, resultSummary, resultPlacement = 'footer', timestamp, className = '', expired = false }) {
  return <article className={`assessment-create-draft-card assessment-tracker-card ${expired ? 'is-expired' : ''} ${className}`}>
    {topBadge && <div className="assessment-tracker-card-top">{topBadge}</div>}
    <div className="assessment-tracker-card-identity">{identity}
      {expired && <p className="assessment-expiry-message" role="status"><TriangleAlert size={16} aria-hidden="true" /><span>Approval Pending. <strong>The scheduled start time has passed. Reschedule this assessment to continue.</strong></span></p>}
    </div>
    <div className="assessment-tracker-card-summary">{summary}{resultPlacement === 'schedule' && resultSummary}</div>
    <div className="assessment-tracker-card-bottom">
      {resultPlacement === 'footer' && resultSummary}
    <div className="assessment-tracker-card-controls">{settings}{timestamp != null && <div className="assessment-tracker-card-timestamp">{timestamp}</div>}<div className="assessment-create-draft-footer">{actions}</div></div>
    </div>
  </article>
}
