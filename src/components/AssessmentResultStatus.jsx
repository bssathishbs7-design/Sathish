import { Clock3, CheckCircle2 } from 'lucide-react'
import { RESULT_PREPARATION_MS } from '../services/assessmentResultRelease'
import './AssessmentResultStatus.css'

/** @param {{result?:Object, results?:Object, now?:number}} props Persisted student result or faculty cohort results. */
export default function AssessmentResultStatus({ result, results, now = 0 }) {
  if (results) {
    const rows = Object.values(results)
    if (!rows.length) return null
    return <div className="assessment-result-status" role="status"><CheckCircle2 size={16} aria-hidden="true" /><span>{rows.filter(row => row.status !== 'evaluating').length}/{rows.length} Evaluated · {rows.filter(row => row.status === 'published').length} Results Published</span></div>
  }
  if (!result) return null
  if (result.status === 'published') return <div className="assessment-result-status" role="status"><CheckCircle2 size={16} aria-hidden="true" /><span>Result Ready · {result.marks} / {result.maxMarks} Marks</span></div>
  const seconds = Math.max(0, Math.ceil((Date.parse(result.releaseAt) - now) / 1000))
  const waiting = !result.autoPublish
  return <div className="assessment-result-status is-preparing">
    <Clock3 size={18} aria-hidden="true" />
    <div><strong>{waiting ? 'Awaiting Faculty Publication' : seconds ? 'Preparing Your Result' : 'Evaluation In Progress'}</strong>
      {result.autoPublish && seconds > 0 && <progress max={RESULT_PREPARATION_MS / 1000} value={RESULT_PREPARATION_MS / 1000 - seconds} aria-label="Result preparation progress" />}
      {result.autoPublish && !seconds && <small>Your result will appear when evaluation is complete.</small>}
    </div>
    {result.autoPublish && seconds > 0 && <time aria-label={`${seconds} seconds remaining`}>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</time>}
  </div>
}
