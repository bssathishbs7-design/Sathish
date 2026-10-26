import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, Trash2, Pencil, UserRound, GripVertical, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { YEARS } from '../../services/studentModel'
import useSelectionCardDrag from './useSelectionCardDrag'
import useStudentGridHeight from './useStudentGridHeight'
import CopyIdBadge from '../CopyIdBadge'
import './StudentDirectory.css'

/** Selection is restricted to the active batch/year view. Graduated records are read-only. */
export default function StudentDirectory({ rows, canEdit, onOpen, onAction, onClear, title, onSelectionChange, highlightId, onClearHighlight, graduated = false }) {
  const tableRef = useRef(null), selectionRef = useRef(null)
  useStudentGridHeight(tableRef)
  const { handleProps, constrain } = useSelectionCardDrag(selectionRef)
  const constrainRef = useRef(constrain)
  useLayoutEffect(() => { constrainRef.current = constrain })
  const [selected, setSelected] = useState([]), [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState({ key: 'name', direction: 1 })
  const sortValue = student => {
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
  const select = ids => { tableRef.current?.querySelector('.student-management-table-wrap')?.scrollTo({ top: 0 }); setSelected(ids); onSelectionChange?.(ids.length) }
  const checked = rows.filter(student => selected.includes(student.id)), ids = checked.map(student => student.id)
  const activeRows = rows.filter(student => student.status === 'Active')
  const allSelected = activeRows.length > 0 && activeRows.every(student => selected.includes(student.id))
  const partiallySelected = checked.length > 0 && !allSelected
  const selectionLabel = allSelected ? 'Unselect all' : 'Select active'
  const editable = canEdit && !graduated
  const canProgress = checked.length > 0 && checked.every(s => s.tracked && !s.graduated && s.status === 'Active' && s.batch === checked[0].batch && s.year === checked[0].year)
  const hasSelection = editable && checked.length > 0
  useLayoutEffect(() => {
    if (!hasSelection) return
    const table = tableRef.current, card = selectionRef.current
    const update = () => {
      constrainRef.current()
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(table); observer.observe(card)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => { observer.disconnect(); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true) }
  }, [hasSelection])
  return <section ref={tableRef} className={`lb-card student-management-table-card${hasSelection ? ' has-selection' : ''}`}>
    <div className="student-management-table-wrap" role="region" aria-label={title} tabIndex={0}><table className={`student-management-table sm-students-table${editable ? ' has-checkboxes' : ''}${hasSelection ? ' has-selected-rows' : ''}`}><colgroup>{editable && <col className="sm-col-checkbox" />}<col className="sm-col-student" /><col className="sm-col-contact" /><col className="sm-col-course" /><col className="sm-col-academic" /><col className="sm-col-stage" /><col className="sm-col-status" /><col className="sm-col-actions" /></colgroup><thead><tr>{editable && <th><label className="sm-select-all-label"><input type="checkbox" ref={element => { if (element) element.indeterminate = partiallySelected }} aria-label={selectionLabel} title={selectionLabel} checked={allSelected} disabled={activeRows.length === 0} onChange={() => select(allSelected ? [] : activeRows.map(student => student.id))} />{allSelected && <span>Unselect all</span>}</label></th>}{sortHeading('name', 'Student')}{sortHeading('email', 'Contact')}{sortHeading('course', 'Course / Dept', 'Course / Department')}{sortHeading('academicYear', 'AY / Batch', 'Academic year / Batch')}{sortHeading('year', 'Year / SGT')}{sortHeading(graduated ? 'completedOn' : 'status', graduated ? 'Completed' : 'Status')}<th>Actions</th></tr></thead><tbody>
      {!shown.length && <tr><td colSpan={editable ? 8 : 7}><div className="lb-empty"><strong>No students in this view</strong><button className="lb-btn" onClick={onClear}>Reset filters</button></div></td></tr>}
      {shown.map(s => <tr key={s.id} className={s.id === highlightId ? 'sm-highlight' : ''}><>{editable && <td><label className="sm-row-select-label"><input type="checkbox" aria-label={`${selected.includes(s.id) ? 'Unselect' : 'Select'} ${s.name}`} checked={selected.includes(s.id)} onChange={event => select(event.target.checked ? [...selected, s.id] : selected.filter(id => id !== s.id))} />{selected.includes(s.id) && <span className="sm-row-select-badge">Selected</span>}</label></td>}</><td className="sm-student-column"><button className="sm-student-link" onClick={() => onOpen(s.id)}><strong>{s.name}</strong><span>{s.registrationId}</span><span>{s.trackingId}</span></button></td><td className="sm-contact-column"><div className="sm-contact-badges"><CopyIdBadge compactFeedback value={s.email} label="email address" /><CopyIdBadge compactFeedback value={[s.code, s.phone].filter(Boolean).join(' ')} label="phone number" /></div></td><td>{s.course}<small className="sm-cell-note">{s.department}</small></td><td><span className="sm-academic-year-value">{s.tracked ? s.academicYear || 'Not recorded' : 'Needs setup'}</span><small className="sm-cell-note">Batch {s.batch}</small></td><td>{s.year}<small className="sm-cell-note">SGT {s.section || 'N/A'}</small>{Object.keys(s.subjectSyllabuses || {}).length > 0 && <small className="sm-cell-note">Own CBME</small>}</td><td>{graduated ? s.completedOn || 'Not recorded' : <span className={`student-management-status is-${s.status.toLowerCase()}`}>{s.status}</span>}</td><td><div className="sm-actions sm-row-actions"><button className="lb-icon-btn" aria-label={`View profile of ${s.name}`} title="View profile" onClick={() => onOpen(s.id)}><UserRound size={16} aria-hidden="true" /></button>{editable && <><button className="lb-icon-btn" aria-label={`Edit ${s.name}`} onClick={() => onAction({ type: 'save', student: s })}><Pencil size={16} /></button><button className="lb-icon-btn" aria-label={`Delete ${s.name}`} onClick={() => onAction({ type: 'delete', ids: [s.id] })}><Trash2 size={16} /></button></>}</div></td></tr>)}
    </tbody></table></div>
    <footer className="sm-student-footer"><span role="status">Showing {rows.length ? (current - 1) * pageSize + 1 : 0}-{Math.min(current * pageSize, rows.length)} of {rows.length} students</span>{hasSelection && <div ref={selectionRef} className="sm-selection-float"><div className="sm-selection" role="region" aria-label="Selected student actions"><button type="button" className="sm-selection-drag" aria-label="Move selection card" title="Drag to move. Arrow keys move; Home resets position." {...handleProps}><GripVertical size={18} aria-hidden="true" /></button><strong role="status">{checked.length} selected</strong><div className="sm-actions">{canProgress && <><button className="lb-btn lb-primary" onClick={() => onAction({ type: 'move', ids, action: checked[0].year === 'Internship' ? 'complete' : 'promote' })}><ArrowRight size={16} />{checked[0].year === 'Internship' ? 'Mark course completed' : `Promote to ${YEARS[YEARS.indexOf(checked[0].year) + 1]}`}</button></>}<button className="lb-btn" onClick={() => select([])}>Clear</button></div>{!canProgress && <small>Only active, tracked students in the same batch and year can progress. Activate inactive students from Student Record first.</small>}</div></div>}<div className="sm-student-pagination"><label>Rows per page<span className="sm-student-page-size"><select aria-label="Students per page" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); onClearHighlight?.() }}>{[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></span></label><nav aria-label="Student pages"><button type="button" className="lb-icon-btn" aria-label="Previous student page" disabled={current === 1} onClick={() => { onClearHighlight?.(); setPage(current - 1) }}><ChevronLeft size={16} aria-hidden="true" /></button><span>Page {current} of {pages}</span><button type="button" className="lb-icon-btn" aria-label="Next student page" disabled={current === pages} onClick={() => { onClearHighlight?.(); setPage(current + 1) }}><ChevronRight size={16} aria-hidden="true" /></button></nav></div></footer>
  </section>
}
