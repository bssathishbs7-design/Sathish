import './ActivityOptionSwitch.css'
import { CheckCircle2, FileText } from 'lucide-react'

/**
 * Controlled activity option. The parent owns persistence and the current boolean value.
 * @param {{label: string, checked: boolean, onChange: (checked: boolean) => void, onLabel: string, offLabel: string, disabled?: boolean, alwaysOn?: boolean}} props
 */
export default function ActivityOptionSwitch({ label, checked, onChange, onLabel, offLabel, disabled = false, alwaysOn = false }) {
  if (label === 'Marks' && alwaysOn) return (
    <div className="activity-option-marks is-always-on" aria-label="Marks always on">
      <FileText size={14} aria-hidden="true" />
      <span className="activity-option-label">Marks</span>
      <span className="activity-option-status">Always on</span>
    </div>
  )
  if (label === 'Marks') return (
    <button type="button" aria-label={label} aria-pressed={checked} className="activity-option-marks"
      disabled={disabled} onClick={() => onChange(!checked)}>
      <FileText size={14} aria-hidden="true" />
      <span className="activity-option-label">Marks</span>
      <span className="activity-option-status">{checked ? 'On' : 'Off'}</span>
    </button>
  )
  return <div className="activity-option-segments" role="group" aria-label={label}>
    <button type="button" aria-pressed={checked} disabled={disabled} onClick={() => onChange(true)}>
      <CheckCircle2 size={14} aria-hidden="true" />{onLabel}
    </button>
    <button type="button" aria-pressed={!checked} disabled={disabled} onClick={() => onChange(false)}>{offLabel}</button>
  </div>
}
