import { RotateCcw } from 'lucide-react'
import './StudentHistory.css'

/** Historical records survive progression undo. Newer edits prevent stale restoration. */
export default function StudentHistory({ data, batch, year, status, query, canEdit, onOpen, onAction }) {
  const moves = data.moves.filter(move => (!batch || move.batch === batch) && move.students.some(item => (!query || `${item.before.name} ${item.before.registrationId}`.toLowerCase().includes(query.toLowerCase())) && (!year || item.before.year === year) && (!status || item.before.status === status)))
  return <section className="lb-card sm-history"><h2>Progression history</h2><p>Review promotions, repeat years and course completions. Undo requires a reason and is blocked after newer changes.</p>{moves.map(move => <article className="sm-history-item" key={move.id}><div className="sm-section-head"><strong>Batch {move.batch} · {({ promote: 'Promoted', repeat: 'Not promoted', complete: 'Course completed' })[move.action]}</strong><time>{move.date}</time></div>{move.note && <p>{move.note}</p>}{move.students.map(item => {
    const current = data.students.find(student => student.id === item.before.id)
    const undoable = !item.undone && current?.revision === item.afterRevision
    return <div className="sm-history-student" key={item.before.id}><button className="lb-btn" disabled={!current} onClick={() => onOpen(current.id)}>{item.before.name}</button><span>{item.undone ? 'Undone' : !current ? 'Student deleted' : undoable ? 'Can undo' : 'Newer changes recorded'}</span>{canEdit && <button className="lb-btn" disabled={!undoable} onClick={() => onAction({ type: 'undo', moveId: move.id, ids: [item.before.id] })}><RotateCcw size={14} />Undo</button>}</div>
  })}</article>)}{!moves.length && <div className="lb-empty">No progression changes in this view.</div>}</section>
}
