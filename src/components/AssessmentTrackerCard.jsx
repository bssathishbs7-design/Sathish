import { TriangleAlert } from 'lucide-react'
import './AssessmentTrackerCard.css'

/** Shared tracker layout. Slots retain the owning page's stage-specific actions.
 * @param {{identity:React.ReactNode, summary:React.ReactNode, settings:React.ReactNode,
 * actions:React.ReactNode, timestamp?:React.ReactNode, className?:string, expired?:boolean}} props
 */
export default function AssessmentTrackerCard({ identity, summary, settings, actions, timestamp, className = '', expired = false }) {
  return <article className={`assessment-create-draft-card assessment-tracker-card ${expired ? 'is-expired' : ''} ${className}`}>
    <div className="assessment-tracker-card-identity">{identity}</div>
    {expired && <p className="assessment-expiry-message" role="status"><TriangleAlert size={16} aria-hidden="true" /><span>Approval Pending. <strong>The scheduled start time has passed. Reschedule this assessment to continue.</strong></span></p>}
    <div className="assessment-tracker-card-summary">{summary}</div>
    <div className="assessment-tracker-card-controls">{settings}{timestamp != null && <div className="assessment-tracker-card-timestamp">{timestamp}</div>}<div className="assessment-create-draft-footer">{actions}</div></div>
  </article>
}
