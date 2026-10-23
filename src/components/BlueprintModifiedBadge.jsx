import FloatingTooltip from './FloatingTooltip'
import './BlueprintModifiedBadge.css'

/** @param {{modification?:{modifiedBy:string,modifiedAt:string}}} props Saved or pending review attribution. */
export default function BlueprintModifiedBadge({ modification }) {
  if (!modification) return null
  const date = new Date(modification.modifiedAt)
  const timestamp = Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  return <FloatingTooltip className="blueprint-modified-badge" label={`Modified by ${modification.modifiedBy}${timestamp ? `, ${timestamp}` : ''}`} content={<span>Modified by {modification.modifiedBy}{timestamp && <><br />{timestamp}</>}</span>}>
    <span>Modified by {modification.modifiedBy}</span>
  </FloatingTooltip>
}
