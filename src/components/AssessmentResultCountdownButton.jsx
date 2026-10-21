import { LoaderCircle } from 'lucide-react'
import { RESULT_PREPARATION_MS } from '../services/assessmentResultRelease'
import './AssessmentResultCountdownButton.css'

/** @param {{result:{releaseAt:string}, now:number}} props Persisted attempt release deadline. */
export default function AssessmentResultCountdownButton({ result, now }) {
  const seconds = Math.min(RESULT_PREPARATION_MS / 1000, Math.max(0, Math.ceil((Date.parse(result.releaseAt) - now) / 1000) || 0))
  const time = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0')
  return <button type="button" className="my-assessment-card-action assessment-result-countdown" disabled aria-busy="true" aria-label={seconds ? `Preparing results, ${seconds} seconds remaining` : 'Waiting for evaluation to complete'}>
    <LoaderCircle size={16} aria-hidden="true" />
    <span>{seconds ? 'Preparing results' : 'Evaluating...'}</span>
    {seconds > 0 && <time>{time}</time>}
  </button>
}
