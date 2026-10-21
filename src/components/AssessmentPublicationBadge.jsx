import { BadgeCheck, Send } from 'lucide-react'
import { getAssessmentPublicationMethod } from '../services/assessmentPublicationMethod'
import './AssessmentPublicationBadge.css'

/** @param {{assessment:Object}} props Published assessment with publication provenance. */
export default function AssessmentPublicationBadge({assessment}) {
  const method = getAssessmentPublicationMethod(assessment)
  if (!method) return null
  const Icon = method === 'approval' ? BadgeCheck : Send
  return <span className={`assessment-stage-badge assessment-publication-badge is-${method}`}><Icon size={13} aria-hidden="true" />{method === 'approval' ? 'Approval Publish' : 'Direct Publish'}</span>
}
