import { useState } from 'react'
import { Search, Users, ChevronDown, ChevronRight, Clock3, Undo2, CheckCircle2 } from 'lucide-react'
import { formatDate } from '../../services/logbook'
import './AdminLogbookStudents.css'

/** @param {{students:Array<Object>,query:string,show:string,onFilter:Function,onOpen:Function}} props */
export default function AdminLogbookStudents({ students, query, show, onFilter, onOpen }) {
  const [sort, setSort] = useState('recent')
  const text = query.trim().toLowerCase()
  const rows = students.filter(person => (!text || (person.name + ' ' + person.id).toLowerCase().includes(text)) &&
    (show === 'risk' ? person.risk : show === 'pending' ? person.pending > 0 : show === 'returned' ? person.returned > 0 : show === 'empty' ? !person.total : true))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'pending' ? b.pending - a.pending || a.name.localeCompare(b.name) : (Date.parse(b.latest) || 0) - (Date.parse(a.latest) || 0) || a.name.localeCompare(b.name))
  const active = Boolean(query || show !== 'all' || sort !== 'recent')
  const clear = () => { onFilter({ query: '', show: 'all' }); setSort('recent') }
  return <section className="admin-students" aria-label="Student logbooks">
    <div className="admin-students-toolbar lb-card">
      <label className="lb-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Search students" placeholder="Search name or ID" value={query} onChange={event => onFilter({ query: event.target.value })} /></label>
      <label className="admin-students-control"><select aria-label="Filter students by status" title="Filter students by status" value={show} onChange={event => onFilter({ show: event.target.value })}><option value="all">All students</option><option value="pending">Awaiting review</option><option value="returned">Remedial due</option><option value="risk">Needs attention</option><option value="empty">No submissions</option></select><ChevronDown size={15} aria-hidden="true" /></label>
      <label className="admin-students-control"><select aria-label="Sort students" title="Sort students" value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Recent activity</option><option value="pending">Most pending</option><option value="name">Name A-Z</option></select><ChevronDown size={15} aria-hidden="true" /></label>
      {active && <button className="lb-btn" type="button" onClick={clear}>Clear</button>}
    </div>
    <div className="admin-students-grid">{rows.map(person => <button type="button" className="admin-student-card" key={person.id} onClick={() => onOpen(person.id)}>
      <span className="admin-student-heading"><span className="admin-student-avatar" aria-hidden="true">{person.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span><span className="admin-student-name"><strong>{person.name}</strong><small>{person.id}</small></span><ChevronRight size={16} aria-hidden="true" /></span>
      <span className="admin-student-counts"><span><Clock3 size={14} aria-hidden="true" /><strong>{person.pending}</strong> pending</span><span><CheckCircle2 size={14} aria-hidden="true" /><strong>{person.approved}</strong> approved</span><span><Undo2 size={14} aria-hidden="true" /><strong>{person.returned}</strong> remedial</span></span>
      <span className="admin-student-progress"><span>Category requirements</span><strong>{person.met}/{person.required}</strong></span>
      {person.required > 0 ? <progress value={person.met} max={person.required} aria-label={'Category requirements met for ' + person.name} /> : <small>Requirements not configured</small>}
      <span className="admin-student-foot"><span>{person.total} submitted</span><span>{person.latest ? 'Active ' + formatDate(person.latest) : 'No activity yet'}</span></span>
    </button>)}</div>
    {!rows.length && <div className="lb-card lb-empty"><Users size={24} aria-hidden="true" /><h3>No students found</h3><p>Try another name, ID or status.</p>{active && <button className="lb-btn" onClick={clear}>Clear filters</button>}</div>}
  </section>
}
