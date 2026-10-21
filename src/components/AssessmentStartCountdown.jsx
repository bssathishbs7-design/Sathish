import { Clock3 } from 'lucide-react'
import './AssessmentStartCountdown.css'

/** @param {{status: {type:string,label:string,startsInMs?:number}|null}} props */
export default function AssessmentStartCountdown({ status }) {
  if (!status) return null
  const imminent = status.type === 'upcoming' && status.startsInMs <= 600000
  const seconds = Math.max(0, Math.ceil((status.startsInMs || 0) / 1000))
  const countdown = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0')
  const label = status.type === 'upcoming'
    ? 'Starts in ' + (imminent ? countdown : status.label.replace(/ to go$/, ''))
    : status.label
  return <span className={`assessment-start-countdown is-${status.type}${imminent ? ' is-imminent' : ''}`} role="timer" aria-live="off">
    {status.type === 'live' ? <span className="assessment-live-dot" aria-hidden="true" /> : <Clock3 size={14} aria-hidden="true" />}<span>{label}</span>
  </span>
}
