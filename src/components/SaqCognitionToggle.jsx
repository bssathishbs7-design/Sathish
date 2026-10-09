import './SaqCognitionToggle.css'

/** Controlled SAQ cognition selector.
 * @param {{label: string, value: 'lot'|'hot'|'both'|null, disabled?: boolean, onChange: (value: string) => void}} props
 */
export default function SaqCognitionToggle({ label, value, onChange, disabled = false }) {
  return (
    <div className="saq-cognition-toggle qb-sort-scope" role="group" aria-label={`${label} cognition`}>
      {[['lot', 'LoT'], ['hot', 'HoT'], ['both', 'Both']].map(([mode, text]) => (
        <button key={mode} type="button" disabled={disabled} aria-pressed={value === mode} onClick={() => onChange(mode)}>{text}</button>
      ))}
    </div>
  )
}
