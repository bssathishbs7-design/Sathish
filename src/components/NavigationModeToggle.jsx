import './NavigationModeToggle.css'

/** Header view selector; mode and navigation are owned by App.
 * @param {{mode:'faculty'|'student',onChange:Function}} props
 */
export default function NavigationModeToggle({ mode, onChange }) {
  return <div className="vx-navigation-mode" role="group" aria-label="Navigation mode">{['faculty', 'student'].map(value => <button key={value} type="button" aria-pressed={mode === value} onClick={() => onChange(value)}>{value === 'faculty' ? 'Faculty - User Interface' : 'Student - User Interface'}</button>)}</div>
}
