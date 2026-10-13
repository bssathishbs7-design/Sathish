import { Check, Clock3, AlertCircle, X } from 'lucide-react'
import './EvaluationStatus.css'
/** Marking completion is separate from whether a student supplied an answer. */
export default function EvaluationStatus({ completed = 0, total = 1, marks = 0, maximum = 0, invalid = false, unanswered = false }) {
 const done = total > 0 && completed === total
 const positive = Number(marks) > 0
 const state = invalid ? 'invalid' : done ? (positive ? 'done' : 'incorrect') : 'pending'
 const Icon = invalid ? AlertCircle : done ? (positive ? Check : X) : Clock3
 const label = invalid ? 'Check marks' : !done ? (completed ? 'In progress' : 'Pending evaluation') : unanswered ? 'Unanswered' : !positive ? 'Incorrect' : Number(marks) < Number(maximum) ? 'Partial credit' : 'Correct'
 const detail = done && !invalid ? marks + '/' + maximum : completed ? completed + '/' + total + ' parts' : ''
 return <span className={`evaluation-marking-status is-${state}`}><Icon size={14} aria-hidden="true" /><strong>{label}</strong>{detail && <span className="evaluation-marking-detail">{detail}</span>}</span>
}
