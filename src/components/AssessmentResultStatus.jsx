import { CheckCircle2 } from 'lucide-react'
import './AssessmentResultStatus.css'

/** @param {{results?:Object}} props Persisted faculty cohort results. */
export default function AssessmentResultStatus({ results }) {
  const rows = Object.values(results || {})
  if (!rows.length) return null
  return <div className="assessment-result-status" role="status"><CheckCircle2 size={16} aria-hidden="true" /><span>{rows.filter(row => row.status !== 'evaluating').length}/{rows.length} Evaluated / {rows.filter(row => row.status === 'published').length} Results Published</span></div>
}
