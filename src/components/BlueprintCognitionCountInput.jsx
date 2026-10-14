import { useId } from 'react'
import './BlueprintCognitionCountInput.css'

/** Existing count input with a temporary indication of an applied suggestion.
 * @param {{delta?:number,className?:string,value:string,onChange:Function,readOnly?:boolean,disabled?:boolean,'aria-label':string}} props Native input props are forwarded unchanged.
 */
export default function BlueprintCognitionCountInput({ delta = 0, className = '', ...inputProps }) {
  const changeId = useId()
  const changed = delta !== 0
  const description = `${delta > 0 ? 'Increased' : 'Decreased'} by ${Math.abs(delta)} ${Math.abs(delta) === 1 ? 'question' : 'questions'}`
  return <span className={`blueprint-cognition-count-field${changed ? ' has-applied-change' : ''}`}>
    <input {...inputProps} className={className} aria-describedby={changed ? changeId : undefined} />
    {changed && <span id={changeId} className="blueprint-cognition-count-delta" aria-label={description} title={description}>{delta > 0 ? '+' : ''}{delta}</span>}
  </span>
}
