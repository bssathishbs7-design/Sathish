import { Activity, Bone, BookOpen, CheckCircle2, ChevronRight, FlaskConical, Info, Microscope, Stethoscope } from 'lucide-react'
import { SUBJECTS } from '../../services/logbookCatalog'
import { subjectProgress } from '../../services/logbook'
import './LogbookSubjectCard.css'

const SUBJECT_ICONS = { AN: Bone, PY: Activity, BI: FlaskConical, PA: Microscope, MI: Microscope, PH: FlaskConical }

/** Shared subject card for the catalogue and overview. Counts exclude drafts.
 * @param {{subject:Object,entries:Object[],onSubject:Function}} props
 */
export default function LogbookSubjectCard({ subject, entries, onSubject }) {
        const SubjectIcon = SUBJECT_ICONS[subject.code] || (subject.phase === 'Phase III' ? Stethoscope : BookOpen)
        const progress = subjectProgress(entries, subject)
        const count = entries.filter(entry => entry.subject === subject.name && entry.status !== 'Draft').length
        return <button type="button" className="lb-subject-tile" data-tone={SUBJECTS.findIndex(item => item.name === subject.name) % 5} key={subject.name} onClick={() => onSubject(subject.name)}>
          <span className={'lb-subject-icon' + (progress.required ? ' has-progress' : '')}>{progress.required > 0 && <svg className="lb-subject-ring" viewBox="0 0 44 44" role="img" aria-label={progress.approved + ' of ' + progress.required + ' required attempts approved'}><circle className="lb-subject-ring-track" cx="22" cy="22" r="19" /><circle className="lb-subject-ring-value" cx="22" cy="22" r="19" pathLength="100" strokeDasharray={progress.percent + ' 100'} transform="rotate(-90 22 22)" /></svg>}<SubjectIcon size={18} aria-hidden="true" /></span><span className="lb-subject-tile-copy"><strong title={subject.label}>{subject.label}</strong><small>{count} {count === 1 ? 'entry' : 'entries'} logged</small></span><ChevronRight size={16} aria-hidden="true" />
          <span className="lb-subject-tile-progress">{progress.required ? <><span><span className="lb-subject-progress-label"><CheckCircle2 size={14} aria-hidden="true" />Approved attempts</span><strong>{progress.approved}/{progress.required}</strong></span></> : <span className="lb-subject-unconfigured"><Info size={14} aria-hidden="true" />Requirements not configured</span>}</span>
        </button>
}
