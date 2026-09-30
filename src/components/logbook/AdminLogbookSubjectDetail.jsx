import { useState } from 'react'
import { BookOpen, ChevronDown } from 'lucide-react'
import { CATEGORIES } from '../../services/logbookCatalog'
import { subjectActivityGroups, subjectCategory } from '../../services/logbookSubjectGroups'
import LogbookCategoryMenu from './LogbookCategoryMenu'
import { CATEGORY_ICONS } from './logbookCategoryIcons'
import './AdminLogbookSubjectDetail.css'

const students = rows => new Set(rows.map(entry => entry.studentId || 'MC2568')).size
const count = (n, singular, plural = singular + 's') => `${n} ${n === 1 ? singular : plural}`

/** Subject category navigation and activity disclosures. Parent owns filtering and entry review.
 * @param {{source:Object[],rows:Object[],category:string,onCategory:Function,filters:React.ReactNode,renderEntries:Function}} props
 */
export default function AdminLogbookSubjectDetail({ source, rows, category, onCategory, filters, renderEntries }) {
  const [open, setOpen] = useState(null)
  const categories = CATEGORIES.filter(item => item.id !== 'remedial' && source.some(entry => subjectCategory(entry) === item.id))
  const options = [{ id: 'all', name: 'All categories', count: rows.length }, ...categories.map(item => ({ ...item, count: rows.filter(entry => subjectCategory(entry) === item.id).length }))]
  const selected = categories.some(item => item.id === category) ? category : ''
  const shown = rows.filter(entry => !selected || subjectCategory(entry) === selected)
  return <div className="admin-subject-detail">
    <LogbookCategoryMenu options={options} value={selected || 'all'} onChange={value => { setOpen(null); onCategory(value === 'all' ? '' : value) }} />
    <div className="admin-subject-content">
      <section className="lb-card lb-stack" aria-label="Filter subject entries">{filters}<p className="lb-muted" aria-live="polite">{count(shown.length, 'entry', 'entries')}</p></section>
      {!shown.length && <section className="lb-card lb-empty">{source.length ? 'No entries match these filters.' : 'No entries have been logged for this subject yet.'}</section>}
      {categories.filter(item => shown.some(entry => subjectCategory(entry) === item.id)).map(item => {
        const entries = shown.filter(entry => subjectCategory(entry) === item.id)
        const activities = subjectActivityGroups(entries)
        const CategoryIcon = CATEGORY_ICONS[item.id] || BookOpen
        return <section className="lb-card admin-subject-group" key={item.id}>
          <header><span className="admin-subject-category-icon"><CategoryIcon size={22} aria-hidden="true" /></span><div><h3>{item.name}</h3><p className="lb-muted">{count(activities.length, 'item')} · {count(entries.length, 'entry', 'entries')} · {count(students(entries), 'student')}</p></div></header>
          {activities.map(activity => {
            const pending = activity.rows.filter(entry => entry.status === 'Pending').length
            const expanded = open === activity.key
            return <div className="admin-subject-activity" key={activity.key}>
              <button type="button" className="admin-subject-activity-toggle" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : activity.key)}>
                <span><strong>{activity.title}</strong><span className="lb-muted">{count(students(activity.rows), 'student')} · {count(activity.rows.length, 'entry', 'entries')} · {activity.rows.filter(entry => entry.status === 'Approved').length} approved</span></span>
                {pending > 0 && <span className="lb-status is-pending">{pending} pending</span>}<ChevronDown size={18} aria-hidden="true" />
              </button>
              {expanded && <div className="admin-subject-attempts">{renderEntries(activity.rows)}</div>}
            </div>
          })}
        </section>
      })}
    </div>
  </div>
}
