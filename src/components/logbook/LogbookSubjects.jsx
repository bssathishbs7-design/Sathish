import { SUBJECTS } from '../../services/logbookCatalog'
import LogbookSubjectCard from './LogbookSubjectCard'
import './LogbookSubjects.css'


/** Subject catalogue grouped by phase. Counts exclude drafts; progress uses approved required attempts.
 * @param {{entries:Object[],onSubject:Function}} props
 */
export default function LogbookSubjects({ entries, onSubject }) {
  const phases = ['Phase I', 'Phase II', 'Phase III']
  return <div className="lb-subjects-compact">
    {phases.map(item => {
      const subjects = SUBJECTS.filter(subject => subject.phase === item)
      return subjects.length > 0 && <section key={item} className="lb-subject-phase"><div className="lb-subject-phase-heading"><h2>{item}</h2><span className="lb-subject-phase-description">{subjects[0].subtitle}</span><span className="lb-subject-phase-badge"><strong>{subjects.length}</strong> {subjects.length === 1 ? 'subject' : 'subjects'}</span></div><div className="lb-subject-tiles">{subjects.map(subject => <LogbookSubjectCard key={subject.name} subject={subject} entries={entries} onSubject={onSubject} />)}</div></section>
    })}
  </div>
}
