import './BlueprintCognitionBadge.css'

/** Read-only cognition badge shared by SAQ rows and LAQ parts.
 * @param {{level:'hot'|'lot'|'both'|string,label?:string}} props
 */
export default function BlueprintCognitionBadge({ level, label }) {
  const text = level === 'hot' ? 'HoT' : level === 'lot' ? 'LoT' : level === 'both' ? 'Both' : 'Unassigned'
  return <span className={`blueprint-cognition-badge is-${level || 'empty'}`} aria-label={label ? `${label}: ${text}` : undefined}>{text}</span>
}
