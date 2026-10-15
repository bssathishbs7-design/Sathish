import { X, FilePenLine, SlidersHorizontal, Eraser } from 'lucide-react'
import SaveChangesDialog from './SaveChangesDialog'
import './AssessmentOptionsDialog.css'

/** Shared configuration popup; the existing native-dialog primitive traps and restores focus.
 * @param {{type:'instructions'|'thresholds',theme:string,onSave:Function,onCancel:Function,onClear?:Function,children:import('react').ReactNode}} props
 */
export default function AssessmentOptionsDialog({ type, theme, onSave, onCancel, onClear, children }) {
  return <SaveChangesDialog
    title={type === 'instructions' ? <><FilePenLine size={16} aria-hidden="true" />Student Instructions</> : <><SlidersHorizontal size={16} aria-hidden="true" />Threshold Settings</>}
    description={type === 'instructions' ? 'Instructions and assessment description shown to students.' : 'Set attainment ranges and thinking level percentages.'}
    theme={theme} onSave={onSave} onCancel={onCancel} saveLabel="Save changes"
    className={`assessment-options-dialog qb-sort-scope is-${type}`}
    footerStart={type === 'instructions' && <button type="button" className="assessment-options-clear" onClick={onClear}><Eraser size={14} aria-hidden="true" />Clear instructions</button>}
  >
    <button type="button" className="assessment-options-close" aria-label="Close settings" onClick={onCancel}><X size={18} aria-hidden="true" /></button>
    <div className="configuration-compact assessment-options-content">{children}</div>
  </SaveChangesDialog>
}
