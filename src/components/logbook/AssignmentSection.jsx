import { useId } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import './AssignmentSection.css'

/** Controlled assignment step. Hidden fields stay mounted to preserve selection state.
 * @param {{number:number,title:string,summary:string,open:boolean,complete:boolean,disabled?:boolean,onToggle:Function,children:import('react').ReactNode}} props
 */
export default function AssignmentSection({ number, title, summary, open, complete, disabled = false, onToggle, children }) {
  const id = useId()
  return <section className={`assignment-section${open ? ' is-open' : ''}`}>
    <h3 className="assignment-section-title"><button type="button" aria-expanded={open} aria-controls={id} disabled={disabled} onClick={onToggle}>
      <span className={`assignment-step-number${complete ? ' is-complete' : ''}`}>{complete ? <Check size={16} aria-label="Complete" /> : number}</span>
      <span className="assignment-section-copy"><strong>{title}</strong><span>{summary}</span></span><ChevronDown size={18} aria-hidden="true" />
    </button></h3>
    <fieldset id={id} hidden={!open} disabled={disabled || !open} className="assignment-section-content faculty-fieldset faculty-assignment-grid">{children}</fieldset>
  </section>
}
