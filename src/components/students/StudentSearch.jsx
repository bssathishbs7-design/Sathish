import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import './StudentSearch.css'
/** Debounced, cross-batch search; selection delegates navigation to the page. */
export default function StudentSearch({ students, onSelect }) {
  const [query, setQuery] = useState(''), [results, setResults] = useState([]), [open, setOpen] = useState(false)
  const root = useRef(null)
  useEffect(() => {
    const timer = setTimeout(() => {
      const text = query.trim().toLowerCase()
      setResults(text.length < 2 ? [] : students.filter(s => `${s.name} ${s.registrationId} ${s.trackingId}`.toLowerCase().includes(text)).slice(0, 10))
    }, 250)
    return () => clearTimeout(timer)
  }, [query, students])
  useEffect(() => { const outside = event => { if (!root.current?.contains(event.target)) setOpen(false) }; document.addEventListener('pointerdown', outside); return () => document.removeEventListener('pointerdown', outside) }, [])
  return <div ref={root} className="sm-global-search" onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }}>
    <label className="student-management-search"><Search size={18} /><input type="search" aria-label="Search across batches" placeholder="Search name, Student ID or Tracking ID" value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true) }} /></label>
    {open && query.trim().length >= 2 && <div className="sm-search-results" aria-label="Student search results">{results.length ? results.map(s => <button type="button" className="sm-search-result" key={s.id} onClick={() => { onSelect(s); setOpen(false); setQuery('') }}><strong>{s.name}</strong><span>{s.registrationId} / {s.trackingId}</span><small>Batch {s.batch} / {s.tracked ? s.year : 'Needs setup'}</small></button>) : <p role="status">No matching students.</p>}</div>}
  </div>
}
