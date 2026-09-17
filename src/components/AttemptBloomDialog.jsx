import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { RadarGraph } from './AssessmentOverallAnalyticsDashboard'
import { buildPracticeTagAnalytics } from '../services/practiceTagAnalytics'
import './AttemptBloomDialog.css'

/**
 * Native modal uses the browser top layer for focus trapping and shell-independent stacking.
 * @param {{attempt: {practice: string, tagSnapshot?: object}, submittedLabel: string, onClose: function}} props
 * tagSnapshot is the selected completed attempt's saved question-tag counts.
 */
export default function AttemptBloomDialog({ attempt, submittedLabel, onClose }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  const group = buildPracticeTagAnalytics(attempt.tagSnapshot ? [attempt.tagSnapshot] : []).cognitiveLevel
  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])
  const navigatePoints = event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    const points = [...dialogRef.current.querySelectorAll('.aoa-radar-point')]
    const index = points.indexOf(event.target)
    if (index < 0) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? points.length - 1 : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + points.length) % points.length
    points[next].focus()
  }
  return <dialog ref={dialogRef} className="ca-attempt-dialog" aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); onClose() }} onKeyDown={navigatePoints}>
    <header className="ca-attempt-dialog-header">
      <div><h2 id={titleId}>Cognitive levels – Bloom’s taxonomy</h2><p id={descriptionId}>{attempt.practice} · {submittedLabel}</p></div>
      <button type="button" className="ca-attempt-close" aria-label="Close analytics" title="Close" onClick={onClose}><X size={18} /></button>
    </header>
    <div className="clg ca-attempt-chart"><RadarGraph items={group.items} coverage /></div>
    {(!group.total || group.unclassified === group.total) && <p className="ca-attempt-empty">No cognitive-level tags were recorded for this attempt.</p>}
  </dialog>
}
