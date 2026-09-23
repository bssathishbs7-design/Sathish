import LogbookSubjects from './LogbookSubjects'
import { subjectProgress } from '../../services/logbook'
import { belongsTo, LEARNERS } from '../../services/logbookPeople'
import './AdminLogbookSubjects.css'

/** Reuse the learner catalogue design, with progress summed per student so one
 * student's extra attempts cannot satisfy another student's requirements.
 * @param {{entries:Object[],onSubject:Function}} props
 */
export default function AdminLogbookSubjects({ entries, onSubject }) {
  const logged = entries.filter(entry => !['Draft', 'To do'].includes(entry.status))
  const getProgress = subject => {
    const totals = LEARNERS.reduce((sum, learner) => {
      const progress = subjectProgress(logged.filter(entry => belongsTo(entry, learner.id)), subject)
      return { approved: sum.approved + progress.approved, required: sum.required + progress.required }
    }, { approved: 0, required: 0 })
    return { ...totals, percent: totals.required ? Math.round(totals.approved / totals.required * 100) : 0 }
  }
  return <div className="admin-subjects"><LogbookSubjects entries={logged} onSubject={onSubject} getProgress={getProgress} progressDescription={'Approved attempts across ' + LEARNERS.length + ' students; requirements are counted separately for each student.'} /></div>
}
