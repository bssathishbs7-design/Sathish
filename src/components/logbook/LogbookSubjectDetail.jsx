import { useState } from 'react'
import { Activity, Bone, BookOpen, FlaskConical, Microscope, Search, Stethoscope } from 'lucide-react'
import { CATEGORIES } from '../../services/logbookSample'
import { subjectLabel } from '../../services/logbookCatalog'
import { searchEntries, skillProgress, subjectProgress } from '../../services/logbook'
import { EntryList } from './LogbookViews'
import './LogbookSubjectDetail.css'
import LogbookCategoryMenu from './LogbookCategoryMenu'
import { CATEGORY_ICONS } from './logbookCategoryIcons'

const SUBJECT_ICONS = { AN: Bone, PY: Activity, BI: FlaskConical, PA: Microscope, MI: Microscope, PH: FlaskConical }

/** Subject workspace with category-grouped entries and responsive navigation.
 * @param {{subject:Object,entries:Object[],onOpen:Function,onNew:Function}} props
 */
export default function LogbookSubjectDetail({ subject, entries, onOpen, onNew }) {
  const SubjectIcon = SUBJECT_ICONS[subject.code] || (subject.phase === 'Phase III' ? Stethoscope : BookOpen)
  const [selectedCategory, setSelection] = useState('all')
  const [query, setQuery] = useState('')
  const subjectEntries = entries.filter(entry => entry.subject === subject.name)
  const skills = skillProgress(entries, subject)
  const progress = subjectProgress(entries, subject)
  const categories = CATEGORIES.filter(item => subject.categories.includes(item.id) || subjectEntries.some(entry => entry.cat === item.id))
  const options = [
    { id: 'all', name: 'All entries', count: subjectEntries.length },
    { id: 'drafts', name: 'Drafts', count: subjectEntries.filter(entry => entry.status === 'Draft').length },
    ...categories.map(item => ({ ...item, count: subjectEntries.filter(entry => entry.cat === item.id).length })),
  ].filter(item => item.id === 'all' || item.count > 0)
  const selection = options.some(item => item.id === selectedCategory) ? selectedCategory : 'all'
  const results = searchEntries(subjectEntries.filter(entry => selection === 'all' || (selection === 'drafts' ? entry.status === 'Draft' : entry.cat === selection)), query)
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const visibleSkills = selection === 'drafts' ? [] : skills.filter(skill => terms.every(term => [skill.code, skill.name, subjectLabel(subject.name)].join(' ').toLowerCase().includes(term)))
  const groupIds = [...new Set([...categories.map(item => item.id), ...results.map(entry => entry.cat)])]
  const groups = groupIds.map(id => ({ id, name: categories.find(item => item.id === id)?.name || 'Other entries', entries: results.filter(entry => entry.cat === id), showSkills: id === 'cert' && ['all', 'cert'].includes(selection) && visibleSkills.length > 0 })).filter(item => item.entries.length || item.showSkills)
  return <div className="lb-subject-workspace">
    <header className="lb-detail-header">
      {progress.required ? <span className="lb-detail-progress-icon"><SubjectIcon size={20} aria-hidden="true" /><svg className="lb-detail-progress-ring" viewBox="0 0 48 48" role="img" aria-label={progress.percent + '% of required attempts approved'}><circle className="lb-detail-ring-track" cx="24" cy="24" r="20" /><circle className="lb-detail-ring-value" cx="24" cy="24" r="20" pathLength="100" strokeDasharray={progress.percent + ' 100'} transform="rotate(-90 24 24)" /></svg></span> : <span className="lb-detail-icon"><SubjectIcon size={22} aria-hidden="true" /></span>}
      <div className="lb-detail-title"><div className="lb-detail-subject-copy"><div><h2>{subjectLabel(subject.name)}</h2><span>{subject.phase} / {subject.subtitle}</span></div><small>{progress.required ? <><strong>{progress.approved}/{progress.required}</strong> attempts approved</> : 'Requirements not configured'}</small></div>{progress.required > 0 && <span className="lb-detail-percent" aria-label={`${progress.percent}% of required attempts approved`}>{progress.percent}%</span>}</div>
      <label className="lb-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Search subject entries" placeholder="Search entries" value={query} onChange={event => setQuery(event.target.value)} /></label>
    </header>
    <div className="lb-detail-columns">
      <LogbookCategoryMenu options={options} value={selection} onChange={setSelection} />
      <div className="lb-detail-groups" aria-live="polite">
        {groups.map(group => { const CategoryIcon = CATEGORY_ICONS[group.id] || BookOpen; return <section className="lb-detail-panel" key={group.id}>
          <header className="lb-detail-category-heading"><span className="lb-detail-category-icon"><CategoryIcon size={16} aria-hidden="true" /></span><div><h3>{group.name}</h3><p>{group.showSkills && <><span>{visibleSkills.length}</span> {visibleSkills.length === 1 ? 'skill' : 'skills'} ? </>}<span>{group.entries.length}</span> {group.entries.length === 1 ? 'entry' : 'entries'}</p></div></header>
          {group.showSkills && <div className="lb-detail-certification">
      <div className="lb-detail-skills">{visibleSkills.map(skill => {
        const remedial = skill.attempts.some(entry => entry.status === 'Returned' && !entries.some(child => child.linkedTo === entry.id && child.status !== 'Returned'))
        const status = skill.complete ? 'Certified' : remedial ? 'Remedial due' : skill.attempts.some(entry => entry.status !== 'Draft') ? 'In progress' : 'Not started'
        return <div className="lb-detail-skill" key={skill.code}>
          <span className="lb-detail-skill-icon"><BookOpen size={18} aria-hidden="true" /></span><div className="lb-detail-skill-name"><strong>{skill.name}</strong><span className="lb-code">{skill.code}</span></div>
          <span className="lb-detail-attempts"><strong>{skill.approved}/{skill.required}</strong><small>Approved / required</small></span>
          <span className={`lb-status ${'is-' + status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>
          <button type="button" className="lb-btn" aria-label={`Log attempt for ${skill.code}`} onClick={() => onNew(subject.name, 'cert', skill)}>Log attempt</button>
        </div>
      })}</div>
          </div>}
          {group.entries.length > 0 && <EntryList entries={group.entries} onOpen={onOpen} />}
        </section> })}
        {!groups.length && <section className="lb-detail-panel lb-empty"><BookOpen size={24} aria-hidden="true" /><p>{query ? 'No matching entries or skills.' : 'No entries in this category yet.'}</p>{query && <button type="button" className="lb-btn" onClick={() => setQuery('')}>Clear search</button>}</section>}
      </div>
    </div>
  </div>
}
