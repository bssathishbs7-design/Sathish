import { ArrowRight, RotateCcw, StickyNote, ChevronDown } from 'lucide-react'
import { canUndo } from '../../services/studentModel'
import FloatingTooltip from '../FloatingTooltip'
import './StudentLatestChange.css'

const labels = { promote: 'Promotion', repeat: 'Year repeated', complete: 'Course completed' }
const fields = [['year', 'Year'], ['academicYear', 'Academic year'], ['startedAt', 'Start date'], ['completedOn', 'Completed on']]

/** Latest batch operation with saved academic comparisons and the existing confirmed undo action.
 * @param {{move:Object, students:Array, canEdit:boolean, onUndo:Function|undefined}} props
 */
export default function StudentLatestChange({ move, students, canEdit, onUndo }) {
  if (!move) return null
  const members = move.students.map(member => {
    const student = students.find(item => item.id === member.before.id)
    const eligible = canUndo(student, member, move)
    const after = member.afterAcademic || (eligible ? student : null)
    const reason = member.undone ? 'Already undone' : !student ? 'Student deleted' : move.legacy ? 'Legacy record cannot be safely undone' : !eligible ? 'A newer academic change prevents undo' : 'Ready to undo'
    return { member, student, eligible, after, reason }
  })
  const eligibleCount = members.filter(item => item.eligible).length
  const recorded = move.at ? new Date(move.at) : null
  const stamp = recorded && !Number.isNaN(recorded.getTime()) ? new Intl.DateTimeFormat('en-GB', { timeZone:'Asia/Kolkata', day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true }).format(recorded) + ' IST' : 'Time not recorded'
  return <details key={move.id} className="sm-latest-change" aria-label="Latest change summary">
    <summary className="sm-latest-heading"><div><h3>Latest change</h3><p>{labels[move.action] || move.action} &middot; Batch {move.batch}</p></div><time dateTime={move.at}>{stamp}</time><span className="sm-history-badge">{members.length} {members.length === 1 ? 'student' : 'students'}</span>{move.note?.trim() && <FloatingTooltip interactive clickOnly label="View latest change note" className="lb-icon-btn" content={<span className="sm-history-note-popup"><strong>Note</strong><span>{move.note}</span></span>}><StickyNote size={16} aria-hidden="true" /></FloatingTooltip>}<ChevronDown className="sm-latest-chevron" size={16} aria-hidden="true" /></summary>
    <div className="sm-latest-members">{members.map(({ member, student, eligible, after, reason }) => {
      const before = member.beforeAcademic
      const changes = before && after ? fields.filter(([key]) => (before[key] || '') !== (after[key] || '')) : []
      return <div className="sm-latest-member" key={member.before.id}><div className="sm-latest-identity"><strong>{student?.name || member.before.name}</strong><span>{student?.trackingId || member.before.trackingId}</span><small>{reason}</small></div><div className="sm-latest-diff">{changes.map(([key, label]) => <div className="sm-latest-field" key={key}><span>{label}</span><span>{before[key] || 'Not set'}</span><ArrowRight size={14} aria-label="changed to" /><strong>{after[key] || 'Not set'}</strong></div>)}{!after && <p>The original after-change details were not saved for this older record.</p>}{after && !before && <p>The original academic snapshot is unavailable.</p>}{before && after && !changes.length && <p>Academic attempt updated.</p>}{eligible && before && <p>Undo restores {before.year}, {before.academicYear} and its saved academic attempt.</p>}</div></div>
    })}</div>
    <div className="sm-latest-footer"><p>{!canEdit ? 'You do not have permission to undo changes.' : eligibleCount ? eligibleCount + ' of ' + members.length + ' students can be restored. Contact and account details stay unchanged.' : 'This change cannot be undone. See the student status above.'}</p><button type="button" className="lb-btn" disabled={!canEdit || !eligibleCount || !onUndo} onClick={onUndo}><RotateCcw size={16} aria-hidden="true" />Undo last change</button></div>
  </details>
}
