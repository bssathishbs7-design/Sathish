import './SaqCognitionToggle.css'

/** Controlled SAQ cognition selector.
 * @param {{label: string, value: 'lot'|'hot'|'both'|null, disabled?: boolean, disabledReasons?:Object<string,string>, onChange: (value: string) => void}} props
 */
export default function SaqCognitionToggle({ label, value, onChange, disabled = false, disabledReasons = {} }) {
  return (
    <div className="saq-cognition-toggle qb-sort-scope" role="group" aria-label={`${label} cognition`}>
      {[['lot', 'LoT'], ['hot', 'HoT'], ['both', 'Both']].map(([mode, text]) => (
        <button key={mode} type="button" disabled={disabled} aria-disabled={Boolean(disabledReasons[mode]) || disabled} title={disabledReasons[mode] || undefined} aria-label={disabledReasons[mode] ? `${text}: ${disabledReasons[mode]}` : text} aria-pressed={value === mode} onClick={() => { if (!disabledReasons[mode]) onChange(mode) }}>{text}</button>
      ))}
    </div>
  )
}
