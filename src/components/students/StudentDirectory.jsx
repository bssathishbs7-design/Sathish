import { createPortal } from 'react-dom'
import { calendarLabel } from '../../services/studentCalendar'
import { useRef, useState } from 'react'
import { ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronDown, Search } from 'lucide-react'
import { YEARS } from '../../services/studentModel'
import useStudentGridHeight from './useStudentGridHeight'
import CopyIdBadge from '../CopyIdBadge'
import './StudentDirectory.css'
import StudentRowActions from './StudentRowActions'
import StudentAvatar from './StudentAvatar'

/** Selection is restricted to the active batch/year view. Graduated records are read-only. */
export default function StudentDirectory({ rows: sourceRows, canEdit, onOpen, onAction, onClear, title, onSelectionChange, highlightId, onClearHighlight, graduated = false, emptyBatch = false, onAddStudent, searchTarget = null }) {
  const [query, setQuery] = useState('')
  const rows = sourceRows.filter(s => !query.trim() || [s.name,s.registrationId,s.trackingId,s.email,s.phone,s.section].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
  const tableRef = useRef(null)
  useStudentGridHeight(tableRef)
  const [selected, setSelected] = useState([]), [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState({ key: 'name', direction: 1 })
  const sortValue = student => {
    if (sort.key === 'progress') return [student.progressInfo?.lag || 0]
    if (sort.key === 'course') return [student.course, student.department]
    if (sort.key === 'academicYear') return [student.academicYear, student.batch]
    if (sort.key === 'year') return [YEARS.indexOf(student.year) < 0 ? YEARS.length : YEARS.indexOf(student.year), student.section]
    if (sort.key === 'email') return [student.email, student.phone]
    return [student[sort.key]]
  }
  const sortedRows = [...rows].sort((a, b) => {
    const left = sortValue(a), right = sortValue(b)
    for (let index = 0; index < left.length; index++) {
      const comparison = String(left[index] ?? '').localeCompare(String(right[index] ?? ''), undefined, { numeric: true, sensitivity: 'base' })
      if (comparison) return comparison * sort.direction
    }
    return String(a.id).localeCompare(String(b.id))
  })
  const sortHeading = (key, label, fullLabel = label) => {
    const active = sort.key === key, SortIcon = active ? sort.direction === 1 ? ArrowUp : ArrowDown : ArrowUpDown
    return <th scope="col" aria-sort={active ? sort.direction === 1 ? 'ascending' : 'descending' : 'none'}><button type="button" className="sm-student-sort" title={fullLabel} aria-label={`Sort by ${fullLabel}, ${active && sort.direction === 1 ? 'descending' : 'ascending'}`} onClick={() => { setSort({ key, direction: active ? -sort.direction : 1 }); setPage(1); onClearHighlight?.() }}>{label}<SortIcon size={13} aria-hidden="true" /></button></th>
  }
  const pages = Math.max(1, Math.ceil(rows.length / pageSize)), targetPage = highlightId ? Math.floor(Math.max(0, sortedRows.findIndex(s => s.id === highlightId)) / pageSize) + 1 : page
  const current = Math.min(targetPage, pages), shown = sortedRows.slice((current - 1) * pageSize, current * pageSize)
  const select = ids => { tableRef.current?.querySelector('.sm-students-table tbody')?.scrollTo({ top: 0 }); setSelected(ids); onSelectionChange?.(ids.length) }
  const checked = rows.filter(student => selected.includes(student.id)), ids = checked.map(student => student.id)
  const activeRows = rows.filter(student => student.status === 'Active')
  const allSelected = activeRows.length > 0 && activeRows.every(student => selected.includes(student.id))
  const partiallySelected = checked.length > 0 && !allSelected
  const selectionLabel = allSelected ? 'Unselect all' : 'Select active'
  const editable = canEdit && !graduated
  const canProgress = checked.length > 0 && checked.every(s => s.tracked && !s.graduated && s.status === 'Active' && s.batch === checked[0].batch && s.year === checked[0].year)
  const hasSelection = editable && checked.length > 0
  const searchControl = <label className="student-management-search"><Search size={16} aria-hidden="true" /><input type="search" value={query} aria-label="Search students in this view" placeholder="Search students in this view" onChange={e => { setQuery(e.target.value); setPage(1); select([]) }} /></label>
  return <section ref={tableRef} className={`lb-card student-management-table-card${hasSelection ? ' has-selection' : ''}${!rows.length ? ' is-empty' : ''}`}>
    {searchTarget ? createPortal(searchControl, searchTarget) : <header className="sm-table-toolbar">{searchControl}</header>}
    {hasSelection && <div className="sm-bulk-toolbar"><div className="sm-selection" role="region" aria-label="Selected student actions"><strong role="status">{checked.length} selected</strong><div className="sm-actions">{canProgress && <><button className="lb-btn lb-primary" onClick={() => onAction({ type: 'move', ids, action: checked[0].year === 'Fourth Year' ? 'complete' : 'promote' })}><ArrowRight size={16} />{checked[0].year === 'Fourth Year' ? 'Mark course completed' : `Promote to ${YEARS[YEARS.indexOf(checked[0].year) + 1]}`}</button></>}<button className="lb-btn" onClick={() => onAction({ type: "changeBatch", ids })}>Change batch</button><button className="lb-btn" onClick={() => onAction({ type: "sgt", ids })}>Update SGT</button><button className="lb-btn" onClick={() => select([])}>Clear</button></div>{!canProgress && <small>Only active, tracked students in the same batch and year can progress. Activate inactive students from Student Record first.</small>}</div></div>}
    <div className="student-management-table-wrap" role="region" aria-label={title} tabIndex={0}><table className={`student-management-table sm-students-table${editable ? ' has-checkboxes' : ''}${hasSelection ? ' has-selected-rows' : ''}`}><colgroup>{editable && <col className="sm-col-checkbox" />}<col className="sm-col-student" /><col className="sm-col-contact" /><col className="sm-col-academic" /><col className="sm-col-status" /><col className="sm-col-actions" /></colgroup><thead><tr>{editable && <th><label className="sm-select-all-label"><input type="checkbox" ref={element => { if (element) element.indeterminate = partiallySelected }} aria-label={selectionLabel} title={selectionLabel} checked={allSelected} disabled={activeRows.length === 0} onChange={() => select(allSelected ? [] : activeRows.map(student => student.id))} /></label></th>}{sortHeading('name', 'Student')}{sortHeading('email', 'Contact')}{sortHeading('year', 'Academic details', 'Study year')}{sortHeading(graduated ? 'completedOn' : 'status', graduated ? 'Completed' : 'Status')}<th>Actions</th></tr></thead><tbody tabIndex={0} aria-label="Student rows">
      {!shown.length && <tr><td colSpan={editable ? 6 : 5}><div className="lb-empty"><strong>{emptyBatch ? 'No students currently in this batch' : 'No students match this view'}</strong><p>{emptyBatch ? 'Add a student or upload an Excel file to get started.' : 'Try another search or reset the filters.'}</p>{emptyBatch ? onAddStudent && <button className="lb-btn" onClick={onAddStudent}>Add student</button> : <button className="lb-btn" onClick={() => { setQuery(''); onClear() }}>Reset filters</button>}</div></td></tr>}
      {shown.map(s => <tr key={s.id} className={[s.id === highlightId ? 'sm-highlight' : '', selected.includes(s.id) ? 'is-selected' : ''].join(' ')}>
        {editable && <td className="sm-select-cell"><label className="sm-row-select-label"><input type="checkbox" aria-label={(selected.includes(s.id) ? 'Unselect ' : 'Select ') + s.name} checked={selected.includes(s.id)} onChange={event => select(event.target.checked ? [...selected, s.id] : selected.filter(id => id !== s.id))} /></label></td>}
        <td className="sm-student-column">
          <button className="sm-student-link" onClick={() => onOpen(s.id)}><StudentAvatar name={s.name} photo={s.photo} /><div className="sm-student-identity"><strong>{s.name}</strong><span>{s.registrationId} &middot; {s.trackingId}</span></div></button>
          {Boolean(s.progressInfo?.lag) && <span className="sm-student-progress is-backlog" title={s.progressInfo.summary}>{s.progressInfo.label || 'Backlog'}</span>}
          {s.leftOver && <small className="sm-error">Decision pending</small>}
          {s.motherBatch && s.motherBatch !== s.batch && <small className="sm-cell-note">Mother batch {s.motherBatch}</small>}
        </td>
        <td className="sm-contact-column"><div className="sm-contact-badges"><CopyIdBadge compactFeedback value={s.email} label="email address" /><CopyIdBadge compactFeedback value={[s.code, s.phone].filter(Boolean).join(' ')} label="phone number" /></div></td>
        <td data-label="Academic details" className="sm-academic-details">
          <strong>{s.course} &middot; {s.year}</strong>
          <span className="sm-cell-note">{s.academicYear?.includes('/') ? calendarLabel(s.academicYear) : s.academicYear || 'Academic year not recorded'}</span>
          <span className="sm-cell-note">{s.migratedOut ? 'Now in Batch ' : 'Batch '}{s.batch} &middot; SGT {s.section || 'N/A'}{s.department && s.department !== 'N/A' ? ' / ' + s.department : ''}</span>
          {Object.keys(s.subjectSyllabuses || {}).length > 0 && <small className="sm-cell-note">Own CBME</small>}
        </td>
        <td data-label="Account">{graduated ? s.completedOn || 'Not recorded' : <span className={'student-management-status is-' + s.status.toLowerCase()}>{s.status}</span>}</td>
        <td className="sm-action-cell"><StudentRowActions student={s} editable={editable} onOpen={onOpen} onAction={onAction} /></td>
      </tr>)}

    </tbody></table></div>
    <footer className="sm-student-footer"><span role="status">Showing {rows.length ? (current - 1) * pageSize + 1 : 0}-{Math.min(current * pageSize, rows.length)} of {rows.length} students</span><div className="sm-student-pagination"><label>Rows per page<span className="sm-student-page-size"><select aria-label="Students per page" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); onClearHighlight?.() }}>{[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></span></label><nav aria-label="Student pages"><button type="button" className="lb-icon-btn" aria-label="Previous student page" disabled={current === 1} onClick={() => { onClearHighlight?.(); setPage(current - 1) }}><ChevronLeft size={16} aria-hidden="true" /></button><span>Page {current} of {pages}</span><button type="button" className="lb-icon-btn" aria-label="Next student page" disabled={current === pages} onClick={() => { onClearHighlight?.(); setPage(current + 1) }}><ChevronRight size={16} aria-hidden="true" /></button></nav></div></footer>
  </section>
}
