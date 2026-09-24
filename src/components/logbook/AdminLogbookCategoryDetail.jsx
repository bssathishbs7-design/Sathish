import { ArrowLeft, BookOpen, History, Clock3, CheckCircle2, Undo2, ClipboardList } from 'lucide-react'
import { categoryLabel } from '../../services/logbookPresentation'
import { CATEGORY_ICONS } from './logbookCategoryIcons'
import './AdminLogbookCategoryDetail.css'

/** Category-specific record view. Parent owns URL filters and entry review actions.
 * @param {{category:string,entries:Object[],results:Object[],status:string,filters:React.ReactNode,onBack:Function,onStatus:Function,renderEntries:Function}} props
 */
export default function AdminLogbookCategoryDetail({ category, entries, results, status, filters, onBack, onStatus, renderEntries }) {
  const CategoryIcon = CATEGORY_ICONS[category] || BookOpen
  const studentCount = new Set(entries.map(entry => entry.studentId || 'MC2568')).size
  return <section className="lb-card admin-category-detail" aria-label={categoryLabel(category) + ' entries'}>
    <div className="admin-category-topbar">
    <header className="admin-category-detail-head">
      <button className="lb-btn" onClick={onBack} aria-label="Back to categories" title="Back to categories"><ArrowLeft size={18} /></button>
      <span className="admin-category-detail-icon"><CategoryIcon size={20} aria-hidden="true" /></span>
      <div><h2>{categoryLabel(category)}</h2><p>{entries.length} {entries.length === 1 ? 'entry' : 'entries'} / {studentCount} {studentCount === 1 ? 'student' : 'students'}</p></div>
    </header>
    <div className="admin-category-status" aria-label="Filter entries by status">{[['', 'All entries', History, 'total'], ['Pending', 'Pending', Clock3, 'pending'], ['Approved', 'Approved', CheckCircle2, 'approved'], ['Returned', 'Returned', Undo2, 'returned'], ['To do', 'Assigned', ClipboardList, 'assigned']].map(([value, label, StatusIcon, tone]) => <button key={value} className={'is-' + tone} aria-pressed={status === value} onClick={() => onStatus(value)}><StatusIcon size={14} aria-hidden="true" /><span>{label}</span><strong>{value ? entries.filter(entry => entry.status === value).length : entries.length}</strong></button>)}</div>
    </div>
    {filters}
    <p className="admin-category-result" aria-live="polite">Showing {results.length} of {entries.length} entries / Latest first</p>
    {renderEntries(results)}
  </section>
}
