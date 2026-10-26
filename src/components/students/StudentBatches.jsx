import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowUpRight, GraduationCap, Layers, Users, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { YEARS } from '../../services/studentModel'
import './StudentBatches.css'

/** Admission cohort directory; onSelect opens the existing batch/year workflow. */
export default function StudentBatches({ data, onSelect, canEdit = false, onDelete, toolbar }) {
  const gridRef = useRef(null)
  useLayoutEffect(() => {
    const grid = gridRef.current
    let frame
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const top = grid.getBoundingClientRect().top + window.scrollY
        const gutter = parseFloat(getComputedStyle(grid).getPropertyValue('--s-4')) || 16
        grid.style.setProperty('--sm-grid-height', Math.max(280, window.innerHeight - top - gutter) + 'px')
      })
    }
    const observer = new ResizeObserver(measure)
    for (const sibling of grid.parentElement.children) if (sibling !== grid) observer.observe(sibling)
    observer.observe(document.querySelector('.vx-navbar') || document.body)
    window.addEventListener('resize', measure)
    document.addEventListener('animationend', measure)
    measure()
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize', measure); document.removeEventListener('animationend', measure) }
  }, [])
  const [sort, setSort] = useState({ key: 'id', direction: 'desc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const counts = new Map()
  data.students.forEach(student => counts.set(student.batch, (counts.get(student.batch) || 0) + 1))
  const sorted = [...data.batches].sort((a, b) => {
    const comparison = sort.key === 'students' ? (counts.get(a.id) || 0) - (counts.get(b.id) || 0) : String(a[sort.key] || '').localeCompare(String(b[sort.key] || ''), undefined, { numeric: true })
    return (sort.direction === 'asc' ? comparison : -comparison) || b.id.localeCompare(a.id)
  })
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const offset = (currentPage - 1) * pageSize
  const changeSort = key => { setSort(previous => ({ key, direction: previous.key === key && previous.direction === 'asc' ? 'desc' : 'asc' })); setPage(1) }
  const sortHeader = (key, label) => <th scope="col" aria-sort={sort.key === key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button className="sm-cohort-sort" onClick={() => changeSort(key)}>{label}{sort.key === key ? sort.direction === 'asc' ? <ArrowUp size={14} aria-hidden="true"/> : <ArrowDown size={14} aria-hidden="true"/> : <ArrowUpDown size={14} aria-hidden="true"/>}</button></th>
  return <section ref={gridRef} className="sm-batch-overview"><header className="sm-directory-heading"><div><h2><Layers size={18} aria-hidden="true" />Admission batches <span>{data.batches.length}</span></h2></div><div className="sm-cohort-filters">{toolbar}</div></header>
    <div className="student-management-table-wrap" role="region" aria-label="Admission batches" tabIndex={0}><table className="student-management-table sm-cohort-table"><colgroup><col className="sm-cohort-col-batch"/><col className="sm-cohort-col-course"/><col className="sm-cohort-col-count"/><col className="sm-cohort-col-date"/><col className="sm-cohort-col-stages"/><col className="sm-cohort-col-actions"/></colgroup><thead><tr>{sortHeader('id', 'Admission Batch')}{sortHeader('course', 'Course')}{sortHeader('students', 'Students')}{sortHeader('startsOn', 'Start Date')}<th scope="col">Academic Stages</th><th scope="col">Action</th></tr></thead><tbody>{sorted.slice(offset, offset + pageSize).map(batch=>{
      const students=data.students.filter(s=>s.batch===batch.id)
      const stages=[...YEARS,'Graduated'].map(year=>({year,count:students.filter(s=>s.tracked&&s.year===year).length})).filter(stage=>stage.count)
      const legacy=students.filter(s=>!s.tracked).length
      return <tr key={batch.id}><td><button className="sm-batch-link" onClick={()=>onSelect(batch.id)}><span className="sm-batch-emblem" aria-hidden="true"><GraduationCap size={18}/></span><strong>Batch {batch.id}</strong></button></td><td><span className="sm-course-badge">{batch.course}</span></td><td><span className="sm-student-count"><Users size={14} aria-hidden="true" /><b className="sm-number">{students.length}</b></span></td><td><time dateTime={batch.startsOn}>{new Date(batch.startsOn+'T00:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</time></td><td><div className="sm-stage-list">{stages.map(stage=><span className={stage.year === 'Graduated' ? 'sm-stage-complete' : 'sm-stage-current'} key={stage.year}>{stage.year}<b>{stage.count}</b></span>)}{legacy>0&&<span className="sm-stage-setup">Needs setup<b>{legacy}</b></span>}{!students.length&&<span className="sm-stage-empty">No students yet</span>}</div></td><td><div className="sm-batch-row-actions">{canEdit && students.length === 0 && <button type="button" className="lb-icon-btn sm-delete-empty" aria-label={`Delete empty Batch ${batch.id}`} title="Delete empty batch" onClick={() => onDelete(batch.id)}><Trash2 size={16} aria-hidden="true" /></button>}<button className="sm-open-batch" aria-label={'Open Batch '+batch.id} onClick={()=>onSelect(batch.id)}>Open<ArrowUpRight size={16}/></button></div></td></tr>
    })}</tbody></table></div>{!data.batches.length&&<div className="lb-empty"><strong>No admission batches yet</strong><p>Select Add new batch to get started.</p></div>}
    <footer className="sm-cohort-footer"><span role="status">Showing {sorted.length ? offset + 1 : 0}-{Math.min(offset + pageSize, sorted.length)} of {sorted.length} batches</span><div className="sm-cohort-pagination"><label>Rows per page<span className="sm-page-size-control"><select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1) }}>{[5,10,20,50].map(size => <option key={size}>{size}</option>)}</select><ChevronDown size={14} aria-hidden="true"/></span></label><nav aria-label="Batch pages"><button className="lb-icon-btn" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16}/></button><span className="sm-cohort-page-number">Page {currentPage} of {pageCount}</span><button className="lb-icon-btn" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16}/></button></nav></div></footer>
  </section>
}
