import { Activity, Bone, BookOpen, ChevronRight, FlaskConical, Microscope, Pill, Stethoscope, Users } from 'lucide-react'
import { SUBJECTS } from '../../services/logbookCatalog'
import './LogbookSubjects.css'
import './AdminLogbookSubjects.css'

const ICONS = { AN: Bone, PY: Activity, BI: FlaskConical, PA: Microscope, MI: Microscope, PH: Pill, CM: Users }

/** Faculty subject catalogue. Counts use visible records; selecting a subject opens its existing drilldown.
 * @param {{entries:Object[],departments:string[],onSubject:Function}} props
 */
export default function AdminLogbookSubjects({ entries, departments, onSubject }) {
  return <div className="lb-subjects-compact admin-subjects">
    {['Phase I', 'Phase II', 'Phase III'].map(phase => {
      const subjects = SUBJECTS.filter(subject => subject.phase === phase)
      return <section className="lb-subject-phase" key={phase}>
        <div className="lb-subject-phase-heading"><h2>{phase}</h2><span className="lb-subject-phase-description">{subjects[0].subtitle}</span><span className="lb-subject-phase-badge"><strong>{subjects.length}</strong> subjects</span></div>
        <div className="admin-subject-grid">{subjects.map(subject => {
          const rows = entries.filter(entry => entry.subject === subject.name)
          const total = rows.filter(entry => entry.status !== 'To do').length
          const students = new Set(rows.map(entry => entry.studentId || 'MC2568')).size
          const pending = rows.filter(entry => entry.status === 'Pending').length
          const tasks = rows.filter(entry => entry.status === 'To do').length
          const own = departments.includes(subject.name)
          const SubjectIcon = ICONS[subject.code] || (subject.phase === 'Phase III' ? Stethoscope : BookOpen)
          return <button type="button" key={subject.name} className={'admin-subject-card' + (own ? ' is-department' : '')} onClick={() => onSubject(subject.name)}>
            <span className="admin-subject-symbol"><SubjectIcon size={20} aria-hidden="true" /></span>
            <span className="admin-subject-name"><strong>{subject.label}</strong>{own ? <span className="admin-subject-department">Your department</span> : <small>View subject logbooks</small>}</span>
            <ChevronRight className="admin-subject-arrow" size={16} aria-hidden="true" />
            <span className="admin-subject-footer">
              {rows.length ? <span className="admin-subject-counts"><span><strong>{students}</strong> {students === 1 ? 'student' : 'students'}</span><span><strong>{total}</strong> {total === 1 ? 'entry' : 'entries'}</span></span> : <span className="admin-subject-empty">No entries yet</span>}
              {pending > 0 ? <span className="lb-status is-pending">{pending} pending</span> : tasks > 0 ? <span className="lb-status is-to-do">{tasks} assigned</span> : rows.length > 0 && <span className="admin-subject-clear">No pending reviews</span>}
            </span>
          </button>
        })}</div>
      </section>
    })}
  </div>
}
