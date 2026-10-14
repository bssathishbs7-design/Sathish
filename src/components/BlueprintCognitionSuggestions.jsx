import { ArrowRight, Plus } from 'lucide-react'
import './BlueprintCognitionSuggestions.css'

/** Final cognition adjustments. All state and validation belong to the page.
 * @param {{suggestions:{options:Array<{id:string,changes:Array<{label:string,count:number,from:string,to:string}>}>,message:string}|null,onApply:Function}} props
 */
export default function BlueprintCognitionSuggestions({ suggestions, onApply }) {
  if (!suggestions) return null
  return <section className="blueprint-cognition-suggestions" aria-label="Suggested cognition changes">
    <h4>Suggested changes — choose one</h4>
    {suggestions.options.length ? <div className="blueprint-cognition-suggestions-grid">
      {suggestions.options.map((option, index) => <article className="blueprint-cognition-suggestion" key={option.id}>
        <header><button type="button" onClick={() => onApply(option.id)} aria-label={`Apply suggestion ${index + 1}: ${option.changes.map(item => `${item.label}, ${item.count} ${item.from} to ${item.to}`).join('; ')}`}><Plus size={12} aria-hidden="true" />Apply</button></header>
        <div className="blueprint-cognition-suggestion-labels" aria-hidden="true"><span>Type</span><span>Count</span><span>Change</span></div>
        <ul>{option.changes.map(item => <li key={item.label}>
          <span>{item.label.startsWith('SAQs (') ? `${item.label.slice(6, -1)} SAQ` : item.label}</span>
          <span className="blueprint-cognition-suggestion-count" aria-label={`${item.count} questions`}>{item.count}</span>
          <span className="blueprint-cognition-suggestion-direction">{item.from}<ArrowRight size={12} aria-label="to" />{item.to}</span>
        </li>)}</ul>
      </article>)}
    </div> : <p role="status">{suggestions.message}</p>}
  </section>
}
