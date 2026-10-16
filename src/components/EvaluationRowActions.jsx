import { MoreHorizontal, RotateCcw } from 'lucide-react'
import './EvaluationRowActions.css'
/** @param {{onReset:Function,onRetain?:Function,label:string|number}} props Reset or restore the saved evaluation through a keyboard-accessible menu. */
export default function EvaluationRowActions({ onReset, onRetain, label }) {
 return <details className="evaluation-row-menu" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false }} onKeyDown={event => { if(event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary').focus() } }}>
  <summary aria-label={`Actions for question ${label}`} title="Question actions"><MoreHorizontal size={16} /></summary>
  <div><button type="button" onClick={event => { const details=event.currentTarget.closest('details'); (onRetain || onReset)(); details.open=false; details.querySelector('summary').focus() }}><RotateCcw size={14} />{onRetain ? 'Retain evaluation' : 'Reset evaluation'}</button></div>
 </details>
}
