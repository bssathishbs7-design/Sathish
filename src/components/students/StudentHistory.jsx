import { ArrowRightLeft, ChevronDown, RotateCcw, StickyNote } from 'lucide-react'
import { canUndo } from '../../services/studentModel'
import FloatingTooltip from '../FloatingTooltip'
import StudentLatestChange from './StudentLatestChange'
import './StudentHistory.css'

const actionLabels = { promote: 'Promotion', repeat: 'Year repeated', complete: 'Course completed', undo: 'Change reversed' }

/** Batch change history. Undo eligibility uses academic revisions; profile changes are preserved. */
export default function StudentHistory({ data, batch, canEdit, onOpen, onAction, onUndoLast }) {
  const moves = data.moves.filter(move => !batch || move.batch === batch)
  return <section className="lb-card sm-history">
    <div className="sm-section-head"><h2>Change list</h2></div>
    <StudentLatestChange move={moves[0]} students={data.students} canEdit={canEdit} onUndo={onUndoLast} />
    <p className="sm-history-help">Academic corrections or later progression block undo. Contact and account changes are preserved.</p>
    {moves.map((move, index) => {
      const eligible = move.students.filter(member => canUndo(data.students.find(s => s.id === member.before.id), member, move))
      const recordedAt = move.at ? new Date(move.at) : null
      const hasTimestamp = recordedAt && !Number.isNaN(recordedAt.getTime())
      const stamp = hasTimestamp ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(recordedAt) + ' IST' : 'Time not recorded'
      return <details className="sm-history-item" key={move.id}>
        <summary><span className="sm-history-event-icon"><ArrowRightLeft size={18} aria-hidden="true" /></span><span className="sm-history-event"><strong>{actionLabels[move.action] || move.action}</strong><span>Batch {move.batch}</span></span><span className="sm-history-badge sm-history-count">{move.students.length} {move.students.length === 1 ? 'student' : 'students'}</span>{move.note?.trim() && <FloatingTooltip interactive clickOnly label="View change note" className="lb-icon-btn sm-history-note-trigger" content={<span className="sm-history-note-popup"><strong>Note</strong><span>{move.note}</span></span>}><StickyNote size={16} aria-hidden="true" /></FloatingTooltip>}<span className="sm-history-meta"><time dateTime={hasTimestamp ? move.at : undefined} title="Recorded date and time">{stamp}</time>{index === 0 && <span className="sm-history-badge">Last change</span>}<ChevronDown size={16} aria-hidden="true" /></span></summary>
        <div className="sm-history-body">
          {move.legacy && <p className="sm-history-help">Legacy change retained for audit; it cannot safely be undone.</p>}
          {canEdit && eligible.length > 1 && <div className="sm-history-student-heading"> <button type="button" className="lb-btn" onClick={() => onAction({ type: 'undo', moveId: move.id, ids: eligible.map(m => m.before.id) })}><RotateCcw size={14} aria-hidden="true" />Undo {eligible.length} eligible students</button></div>}
          <div className="sm-history-students">{move.students.map(member => {
            const student = data.students.find(s => s.id === member.before.id), available = canUndo(student, member, move)
            const status = member.undone ? 'Undone' : !student ? 'Deleted' : available ? 'Unchanged' : 'Changed'
            return <div className="sm-history-student" key={member.before.id}>
              <div className="sm-history-identity"><button type="button" className="sm-history-name" disabled={!student} onClick={() => onOpen(student.id)}>{student?.name || member.before.name}</button><span>{student?.trackingId || member.before.trackingId}</span></div>
              <span className="sm-history-badge">{status}</span>
              {canEdit && <button type="button" className="lb-btn" disabled={!available} onClick={() => onAction({ type: 'undo', moveId: move.id, ids: [member.before.id] })}><RotateCcw size={14} aria-hidden="true" />Undo</button>}
            </div>
          })}</div>
        </div>
      </details>
    })}
    {!moves.length && <div className="lb-empty">No progression changes yet.</div>}
  </section>
}
