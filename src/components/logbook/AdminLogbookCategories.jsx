import { BookOpen, CheckCircle2, ChevronRight, Users } from 'lucide-react'
import { CATEGORIES } from '../../services/logbookCatalog'
import { categoryLabel } from '../../services/logbookPresentation'
import { CATEGORY_ICONS } from './logbookCategoryIcons'
import './LogbookSubjectCard.css'
import './AdminLogbookCategories.css'

/** Department category cards; selection opens the existing category records.
 * @param {{entries:Object[],onCategory:Function}} props
 */
export default function AdminLogbookCategories({ entries, onCategory }) {
  const categories = CATEGORIES.filter(category => entries.some(entry => entry.cat === category.id))
  if (!categories.length) return <div className="lb-card lb-empty"><BookOpen size={24} /><p>No department entries yet.</p></div>
  return <div className="admin-category-grid">{categories.map((category, index) => {
    const rows = entries.filter(entry => entry.cat === category.id)
    const students = new Set(rows.map(entry => entry.studentId || 'MC2568')).size
    const pending = rows.filter(entry => entry.status === 'Pending').length
    const CategoryIcon = CATEGORY_ICONS[category.id] || BookOpen
    return <button type="button" className="lb-subject-tile admin-category-card" data-tone={index % 5} key={category.id} onClick={() => onCategory(category.id)}>
      <span className="lb-subject-icon"><CategoryIcon size={20} aria-hidden="true" /></span>
      <span className="lb-subject-tile-copy"><strong>{categoryLabel(category.id)}</strong><small><span className="lb-mono">{rows.length}</span> {rows.length === 1 ? 'entry' : 'entries'}</small></span>
      <ChevronRight size={16} aria-hidden="true" />
      <span className="admin-category-footer">
        <span className="admin-category-students"><Users size={14} aria-hidden="true" /><span><span className="lb-mono">{students}</span> {students === 1 ? 'student' : 'students'}</span></span>
        {pending ? <span className="lb-status is-pending"><span className="lb-mono">{pending}</span>&nbsp;pending</span> : <span className="admin-category-clear"><CheckCircle2 size={14} aria-hidden="true" />No pending reviews</span>}
      </span>
    </button>
  })}</div>
}
