import { ChevronDown } from 'lucide-react'
import { REVIEWERS } from '../../services/logbookPeople'
import './LogbookAccountSwitcher.css'

/** Direct preview-account selection; App owns the persisted identity and page remount.
 * @param {{actor:Object,onSelect:Function,disabled?:boolean}} props
 */
export default function LogbookAccountSwitcher({ actor, onSelect, disabled = false }) {
  return <div className="lb-account-switcher">
    <span className="lb-account-switch-select">
      <select value={actor.id} onChange={event => onSelect(event.target.value)} disabled={disabled} aria-label="Viewing as" title={actor.name}>
        {['Faculty', 'HoD', 'Dean', 'Director'].map(role => <optgroup key={role} label={role}>{REVIEWERS.filter(person => person.role === role).map(person => <option key={person.id} value={person.id}>{person.name}{person.role === 'Faculty' ? ` — ${person.departments.join(' / ')}` : ''}</option>)}</optgroup>)}
      </select><ChevronDown size={16} aria-hidden="true" />
    </span>
  </div>
}
