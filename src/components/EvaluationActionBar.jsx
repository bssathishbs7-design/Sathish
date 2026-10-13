import { useEffect, useRef } from 'react'
import { Users, ChevronRight, Check } from 'lucide-react'
import './EvaluationActionBar.css'
/** Persistent marking actions; callbacks retain the page's existing navigation and scoring flow. */
export default function EvaluationActionBar({ onStudents, evaluated, total, completedStudents, totalStudents, hasPending, marked, canComplete, onNextPending, onComplete }) {
 const barRef = useRef(null)
 useEffect(() => {
  const bar = barRef.current
  const page = bar.closest('.student-evaluation-theme')
  let frame = 0
  const measure = () => {
   const height = `${Math.ceil(bar.getBoundingClientRect().height)}px`
   if (page?.style.getPropertyValue('--evaluation-action-height') !== height) page?.style.setProperty('--evaluation-action-height', height)
  }
  measure()
  const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure) })
  observer.observe(bar)
  return () => { observer.disconnect(); cancelAnimationFrame(frame); page?.style.removeProperty('--evaluation-action-height') }
 }, [])
 return <nav className="evaluation-action-bar" ref={barRef} aria-label="Student evaluation actions">
  <div className="evaluation-action-left">
   <button type="button" onClick={onStudents}><Users size={15} />View students</button>
   <button type="button" onClick={onNextPending} disabled={!hasPending}>Pending Correction<ChevronRight size={15} /></button>
  </div>
  <div className="evaluation-action-progress" aria-live="polite"><strong>{evaluated}/{total} questions evaluated</strong><span>{completedStudents}/{totalStudents} students completed</span></div>
  <div className="evaluation-action-right">
   <button type="button" className="evaluation-action-primary" onClick={onComplete} disabled={!canComplete && !marked}>{marked ? <ChevronRight size={15} /> : <Check size={15} />}{marked ? 'Next student' : 'Complete evaluation'}</button>
  </div>
 </nav>
}
