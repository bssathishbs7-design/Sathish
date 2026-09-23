import { BookOpen, ChevronDown } from 'lucide-react'
import { CATEGORY_ICONS } from './logbookCategoryIcons'
import './LogbookCategoryMenu.css'

const MENU_LABELS = { ece: 'ECE', sdl: 'SDL', sgt: 'Small group teaching', obg: 'Labour & antenatal', imm: 'Immunisation', pm: 'Postmortem / MLC', fap: 'Family adoption', chs: 'Community health', pharm: 'Prescription review', ach: 'Achievements' }
const menuLabel = item => MENU_LABELS[item.id] || item.shortName || item.name


/** Shared category filters. Options contain id, name, optional shortName and count.
 * @param {{options:Object[],value:string,onChange:Function}} props
 */
export default function LogbookCategoryMenu({ options, value, onChange }) {
  return <><label className="lb-category-mobile"><span>Log Categories</span><span><select aria-label="Log Categories" value={value} onChange={event => onChange(event.target.value)}>{options.map(item => <option key={item.id} value={item.id}>{menuLabel(item)} ({item.count})</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label><aside className="lb-category-sidebar" aria-label="Log Categories"><h3>Log Categories</h3><nav>{options.map(item => { const CategoryIcon = CATEGORY_ICONS[item.id] || BookOpen; return <button type="button" key={item.id} title={item.name} aria-label={item.name + ', ' + item.count + ' entries'} aria-current={value === item.id ? 'true' : undefined} onClick={() => onChange(item.id)}><CategoryIcon size={18} aria-hidden="true" /><span>{menuLabel(item)}</span><small>{item.count}</small></button> })}</nav></aside></>
}
