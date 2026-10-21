import { Clock3, CheckCircle2 } from 'lucide-react'
import './AssessmentResultStatus.css'

/** @param {{result?:Object, results?:Object, }} props Persisted student result or faculty cohort results. */
export default function AssessmentResultStatus({ result, results }) {
  if (results) {
    const rows = Object.values(results)
    if (!rows.length) return null
    return <div className="assessment-result-status" role="status"><CheckCircle2 size={16} aria-hidden="true" /><span>{rows.filter(row => row.status !== 'evaluating').length}/{rows.length} Evaluated / {rows.filter(row => row.status === 'published').length} Results Published</span></div>
  }
  if (!result) return null
  if (result.status === 'published') return <div className="assessment-result-status" role="status"><CheckCircle2 size={16} aria-hidden="true" /><span>Results ready / {result.marks} / {result.maxMarks} Marks</span></div>
  return <div className="assessment-result-status is-preparing">
    <Clock3 size={18} aria-hidden="true" />
    <div><strong>Submitted. Awaiting publication</strong>
      <small>Results will be available after publication.</small>
    </div>
  </div>
}
