import { BookOpen } from 'lucide-react'
import { categoryLabel } from '../../services/logbookPresentation'
import { CATEGORY_ICONS } from './logbookCategoryIcons'
import './AdminStudentEntryGroups.css'

/** Category groups for one student's filtered entries; review actions remain owned by the parent.
 * @param {{rows:Object[],renderEntries:Function}} props
 */
export default function AdminStudentEntryGroups({ rows, renderEntries }) {
  return [...new Set(rows.map(entry => entry.cat))].map(category => {
    const entries = rows.filter(entry => entry.cat === category)
    const CategoryIcon = CATEGORY_ICONS[category] || BookOpen
    const pending = entries.filter(entry => entry.status === 'Pending').length
    return <section className="admin-student-entry-group" key={category} aria-label={categoryLabel(category)}>
      <header className="admin-student-entry-group-head"><span className="admin-student-entry-category-icon"><CategoryIcon size={18} aria-hidden="true" /></span><h3>{categoryLabel(category)}</h3><span className="admin-student-entry-count">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>{pending > 0 && <span className="admin-student-entry-pending">{pending} pending</span>}</header>
      {renderEntries(entries)}
    </section>
  })
}
