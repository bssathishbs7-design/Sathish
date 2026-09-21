import { Check, ChevronDown } from 'lucide-react'
import './LogbookAccordionSection.css'

/** Controlled accordion section. Collapsed content unmounts; values remain in the parent form.
 * @param {{index:number,title:string,summary:string,open:boolean,complete:boolean,disabled?:boolean,onOpen:Function,children:import('react').ReactNode}} props
 */
export default function LogbookAccordionSection({ index, title, summary, open, complete, disabled, onOpen, children }) {
  const id = `lb-step-${index}`
  return <section className={`lb-accordion ${open ? 'is-open' : ''}`}>
    <h3 className="lb-accordion-heading"><button id={`${id}-heading`} type="button" className="lb-accordion-trigger" aria-expanded={open} aria-controls={`${id}-panel`} disabled={disabled} onClick={onOpen}>
      <span className={`lb-step-number ${complete ? 'is-complete' : ''}`} aria-label={complete ? 'Complete' : `Step ${index + 1}`}>{complete ? <Check size={15} /> : index + 1}</span>
      <span className="lb-step-copy"><strong>{title}</strong><small>{summary}</small></span>
      <ChevronDown size={16} className="lb-step-chevron" aria-hidden="true" />
    </button></h3>
    <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-heading`} hidden={!open}>
      {open && <div className="lb-accordion-body">{children}</div>}
    </div>
  </section>
}
