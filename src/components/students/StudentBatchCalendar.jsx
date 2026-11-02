import { useState } from 'react'
import { ChevronDown, GraduationCap, Pencil, UserPlus, Upload, Trash2, Layers, Users, CalendarDays, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { STUDY_YEARS, calendarLabel, monthStart, monthEnd, runningYear, studying, joinableYear, studentProgress, isLeftOver, laterBatches } from '../../services/studentCalendar'
import { today } from '../../services/studentModel'
import FloatingTooltip from '../FloatingTooltip'
import './StudentBatchCalendar.css'

/** Calendar overview derives every count from current students; migrated-out students remain historical only. */
export default function StudentBatchCalendar({ data, canEdit, onAction, onOpen, toolbar, onRoster }) {
  const [sort, setSort] = useState('newest'), [page, setPage] = useState(1), [size, setSize] = useState(10)
  const counts = id => data.students.filter(s => s.batch === id && studying(s)).length
  const sorted = [...data.batches].sort((a, b) => sort === 'students' ? counts(b.id) - counts(a.id) : (sort === 'oldest' ? 1 : -1) * a.id.localeCompare(b.id))
  const pages = Math.max(1, Math.ceil(sorted.length / size)), current = Math.min(page, pages)
  return <section className="sm-calendar-overview"><header className="sm-section-head"><h2><Layers size={18} aria-hidden="true" />Admission batches <span className="sm-batch-heading-count">{data.batches.length}</span></h2><div className="sm-actions">{toolbar}<button className="lb-btn" onClick={onRoster}><CalendarDays size={15} aria-hidden="true" />Year roster</button>{data.batches.length > 1 && <span className="sm-batch-sort"><select aria-label="Sort batches" value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}><option value="newest">Newest batch first</option><option value="oldest">Oldest batch first</option><option value="students">Most students first</option></select><ChevronDown size={15} aria-hidden="true" /></span>}</div></header>
    <div className="sm-batch-table-scroll" role="region" aria-label="Admission batches" tabIndex={0}>
      <table className="sm-batch-table">
        <colgroup><col className="sm-batch-col-name" /><col /><col /><col /><col className="sm-batch-col-actions" /></colgroup>
        <thead><tr>{['Batch', 'Course', 'Students', 'Status', 'Actions'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        {sorted.slice((current - 1) * size, current * size).map(batch => <BatchRow key={batch.id} batch={batch} data={data} canEdit={canEdit} onAction={onAction} onOpen={onOpen} />)}
        {!sorted.length && <tbody><tr><td colSpan={5} className="lb-empty"><strong>No admission batches yet</strong><p>Select Add new batch to get started.</p></td></tr></tbody>}
      </table>
    </div>
    <footer className="sm-calendar-footer"><span>Showing {sorted.length ? (current - 1) * size + 1 : 0}-{Math.min(current * size, sorted.length)} of {sorted.length} batches</span><label>Batches per page <select value={size} onChange={e => { setSize(+e.target.value); setPage(1) }}>{[5, 10, 20, 50].map(n => <option key={n}>{n}</option>)}</select></label><button className="lb-icon-btn" aria-label="Previous page" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft size={16} /></button><span>Page {current} of {pages}</span><button className="lb-icon-btn" aria-label="Next page" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight size={16} /></button></footer>
  </section>
}
function BatchRow({ batch, data, canEdit, onAction, onOpen }) {
  const [open, setOpen] = useState(false), [all, setAll] = useState(false), date = today()
  const students = data.students.filter(s => studying(s) && s.batch === batch.id)
  const migrated = data.students.filter(s => (s.batch === batch.id && s.motherBatch !== batch.id) || s.entries.some(e => e.batch === batch.id && s.batch !== batch.id))
  const rows = STUDY_YEARS.map((year, i) => {
    const calendar = batch.calendars[year], members = students.filter(s => s.year === year)
    const previous = students.some(s => s.year === STUDY_YEARS[i - 1])
    const pending = calendar && monthEnd(calendar.to) < date && members.length > 0
    const days = calendar ? Math.ceil((Date.parse(monthEnd(calendar.to)) - Date.parse(date)) / 86400000) : null
    const status = !calendar ? previous ? 'Needed for promotion' : 'Dates not set' : pending ? 'Decision pending' : monthStart(calendar.from) > date ? 'Upcoming' : days < 0 ? 'Completed' : days <= 30 ? `Ends in ${days} days` : 'Current'
    const incoming = members.filter(s => s.motherBatch !== batch.id), outgoing = migrated.filter(s => s.batch !== batch.id && s.entries.some(e => e.batch === batch.id && e.year === year))
    const left = members.filter(s => isLeftOver(data, s, date))
    const waiting = data.students.filter(s => s.year === year && s.batch !== batch.id && isLeftOver(data, s, date) && laterBatches(data, s)[0]?.id === batch.id)
    const backlog = members.filter(s => studentProgress(data, s, date).lag).length
    return { year, calendar, members, status, pending, incoming, outgoing, left, waiting, backlog, joinable: joinableYear(batch, year, date), important: members.length || outgoing.length || previous || runningYear(batch, date) === year || joinableYear(batch, year, date) }
  })
  const visible = rows.filter(r => all || r.important), hidden = rows.filter(r => !r.important)
  const pending = students.some(s => isLeftOver(data, s, date))
  const canDelete = canEdit && !data.students.some(s => s.batch === batch.id) && !migrated.length && !data.moves.some(m => m.targetBatch && (m.batch === batch.id || m.targetBatch === batch.id))
  return <tbody className="sm-batch-group">
    <tr className={open ? 'sm-batch-row is-open' : 'sm-batch-row'}>
      <th scope="row"><div className="sm-calendar-identity">
        <button className="lb-icon-btn sm-batch-expand" aria-label={`${open ? 'Hide' : 'Show'} Batch ${batch.id} years`} aria-expanded={open} aria-controls={`batch-years-${batch.id}`} onClick={() => setOpen(!open)}><ChevronDown size={16} style={{ transform: open ? undefined : 'rotate(-90deg)' }} /></button>
        <GraduationCap size={18} aria-hidden="true" /><button className="sm-batch-link" onClick={() => onOpen(batch.id)}>Batch {batch.id}</button>
      </div></th>
      <td><span className="sm-course-badge">{batch.course}</span></td>
      <td><span className="sm-batch-total"><Users size={14} aria-hidden="true" /><span className="sm-batch-count">{students.length}</span></span></td>
      <td>{pending ? <span className="sm-calendar-attention">Decision pending</span> : <span className="sm-batch-no-status" aria-label="No pending decision">&mdash;</span>}</td>
      <td><div className="sm-actions sm-calendar-open">
        {canDelete && <button className="lb-icon-btn" aria-label={`Delete Batch ${batch.id}`} onClick={() => onAction({ type: 'deleteBatch', batch: batch.id, emptyOnly: true })}><Trash2 size={16} /></button>}
        <button className="lb-btn sm-batch-open-button" onClick={() => onOpen(batch.id)}>Open<ArrowUpRight size={14} aria-hidden="true" /></button>
      </div></td>
    </tr>
    <tr className="sm-batch-detail-row" hidden={!open} id={`batch-years-${batch.id}`}><td colSpan={5}><div className="sm-batch-details">{open && <>{visible.length > 0 && <div role="table" aria-label={`Batch ${batch.id} calendar`}><div role="row" className="sm-calendar-grid sm-calendar-labels">{['Year', 'Academic year', 'Students', 'Progress', 'Actions'].map(label => <span role="columnheader" key={label}>{label}</span>)}</div>{visible.map(row => <div className={`sm-calendar-year ${row.pending ? 'is-pending' : ''}`} key={row.year}><div role="row" className="sm-calendar-grid"><div role="cell"><strong className="sm-calendar-year-label">{row.year}</strong><small className={`sm-calendar-pill ${row.pending || row.status === 'Needed for promotion' ? 'is-warning' : ''}`}>{row.status}</small></div><div role="cell">{calendarLabel(row.calendar)}</div><div role="cell"><span className="sm-calendar-student-count">{row.members.length ? `${row.members.length} student${row.members.length === 1 ? '' : 's'}` : 'No students'}</span></div><div role="cell">{row.members.length > 0 ? <><div className="sm-progress-bar" aria-label={`${row.members.length - row.backlog} on track, ${row.backlog} backlog`}><span style={{ width: `${100 * (row.members.length - row.backlog) / row.members.length}%` }} /></div><small>On Track <b>{row.members.length - row.backlog}</b> · Backlog <b>{row.backlog}</b></small></> : <span className="sm-batch-no-status" aria-label="No students to measure">&mdash;</span>}</div><div role="cell" className="sm-calendar-row-actions"><span>{row.members.length > 0 && <button className={`lb-btn ${row.pending ? 'lb-primary' : ''}`} onClick={() => { const next = STUDY_YEARS[STUDY_YEARS.indexOf(row.year) + 1]; if (canEdit && next && !batch.calendars[next]) onAction({ type: 'calendar', batch: batch.id, year: next, continueYear: row.year }); else onOpen(batch.id, row.year) }}>{row.year === 'Fourth Year' ? 'Complete' : 'Promote'}</button>}</span>{row.calendar ? <>{canEdit && row.joinable ? <><FloatingTooltip content="Add student" className="sm-calendar-action-tip"><button className="lb-icon-btn" aria-label={`Add student to Batch ${batch.id} ${row.year}`} onClick={() => onAction({ type: 'save', batch: batch.id, year: row.year })}><UserPlus size={16} /></button></FloatingTooltip><FloatingTooltip content="Upload Excel" className="sm-calendar-action-tip"><button className="lb-icon-btn" aria-label={`Upload into Batch ${batch.id} ${row.year}`} onClick={() => onAction({ type: 'import', batch: batch.id, year: row.year })}><Upload size={16} /></button></FloatingTooltip></> : <><span /><span /></>}{canEdit && <FloatingTooltip content="Edit academic year" className="sm-calendar-action-tip"><button className="lb-icon-btn" aria-label={`Edit Batch ${batch.id} ${row.year} academic year`} onClick={() => onAction({ type: 'calendar', batch: batch.id, year: row.year })}><Pencil size={16} /></button></FloatingTooltip>}</> : canEdit && <button className="lb-btn sm-set-dates" onClick={() => onAction({ type: 'calendar', batch: batch.id, year: row.year })}>Set dates</button>}</div></div><div className="sm-calendar-notes">{row.incoming.length > 0 && <span>{row.incoming.length} migrated in from {[...new Set(row.incoming.map(s => `Batch ${s.motherBatch}`))].join(', ')}</span>}{row.outgoing.length > 0 && <span>{row.outgoing.length} migrated to later batches</span>}{row.waiting.length > 0 && <button className="lb-btn sm-error" onClick={() => onOpen(row.waiting[0].batch, row.year, 'left')}>{row.waiting.length} left over in Batch {[...new Set(row.waiting.map(s => s.batch))].join(', ')} waiting for a decision</button>}{row.left.length > 0 && <button className="sm-error lb-btn" onClick={() => onOpen(batch.id, row.year, 'left')}>{row.left.length} students left over: review decisions</button>}</div></div>)}</div>}{hidden.length > 0 && <button className="sm-calendar-fold lb-btn" onClick={() => setAll(!all)}>{all ? 'Show fewer years' : `Show ${hidden.length} more years`}</button>}</>}</div></td></tr>
  </tbody>
}
