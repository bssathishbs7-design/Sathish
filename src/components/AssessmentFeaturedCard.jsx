import { useEffect, useState } from 'react'
import { CalendarClock, ClipboardCheck, Play } from 'lucide-react'
import './AssessmentFeaturedCard.css'

/**
 * @param {{items: Array<{assessment:Object,isLive:boolean,scheduleLabel:string}>, onStart:Function}} props
 * Cycles eligible exams, pausing for hover, keyboard focus, hidden tabs and reduced motion.
 */
export default function AssessmentFeaturedCard({ items, onStart }) {
  const [selectedId, setSelectedId] = useState(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [hidden, setHidden] = useState(() => document.hidden)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(media.matches)
    const updateVisibility = () => setHidden(document.hidden)
    media.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => { media.removeEventListener('change', updateMotion); document.removeEventListener('visibilitychange', updateVisibility) }
  }, [])
  const index = Math.max(0, items.findIndex(item => item.assessment.id === selectedId))
  const item = items[index]
  const nextId = items.length > 1 ? items[(index + 1) % items.length].assessment.id : null
  const paused = hovered || focused || reducedMotion || hidden
  useEffect(() => {
    if (paused || nextId === null) return undefined
    const timer = window.setTimeout(() => setSelectedId(nextId), 5000)
    return () => window.clearTimeout(timer)
  }, [nextId, paused])
  return (
    <aside className="assessment-featured" aria-label="Featured assessments" aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
      <div className="assessment-featured-top">
        <span className="assessment-featured-label"><ClipboardCheck size={15} aria-hidden="true" />{item?.isLive ? 'Ready to start' : 'Your next assessment'}</span>
        {items.length > 1 && <div className="assessment-featured-dots" role="group" aria-label="Choose featured assessment">
          {items.map((entry, dotIndex) => <button key={entry.assessment.id} type="button"
            aria-label={`Show assessment ${dotIndex + 1}: ${entry.assessment.assessmentName || 'Assigned assessment'}`}
            aria-pressed={dotIndex === index} onClick={() => setSelectedId(entry.assessment.id)}>
            <span aria-hidden="true" />
          </button>)}
        </div>}
      </div>
      <div className="assessment-featured-slide" aria-live={paused ? 'polite' : 'off'} aria-atomic="true">
        <h2>{item?.assessment.assessmentName || (item ? 'Assigned assessment' : 'You’re all caught up')}</h2>
        {item ? <>
          <p>{item.assessment.examCategory || 'Assessment'} · {item.assessment.assignTo || 'Assigned to you'}</p>
          <div className="assessment-featured-footer">
            <span><CalendarClock size={15} aria-hidden="true" />{item.scheduleLabel}</span>
            {item.isLive && <button className="assessment-featured-start" type="button" onClick={() => onStart(item.assessment)}><Play size={15} aria-hidden="true" />Start assessment</button>}
          </div>
        </> : <p>Your next available assessment will appear here. You can review existing assessments below.</p>}
      </div>
    </aside>
  )
}
