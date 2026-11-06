import { useState } from 'react'
import './FacultyRoster.css'

/** Renders authoritative current-attempt snapshots; search does not alter the full selection. */
export default function FacultyRoster({ members, excluded = [], selected, onToggle, readOnly = false }) {
  const [search,setSearch]=useState(''),[showExcluded,setShowExcluded]=useState(false)
  const source=showExcluded?excluded:members
  const rows=source.filter(m=>(m.name+' '+m.registrationId+' '+m.teachingBatchId).toLowerCase().includes(search.toLowerCase()))
  return <section className="fm-roster"><div className="fm-toolbar"><label className="fm-search"><span>Search students</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or registration ID"/></label><button type="button" className="fm-btn" onClick={()=>setShowExcluded(!showExcluded)}>{showExcluded?'Eligible students ('+members.length+')':'Excluded ('+excluded.length+')'}</button>{selected&&!showExcluded&&<span role="status">{selected.length} selected across all results</span>}</div>
    <div className="fm-table-scroll" tabIndex={0} aria-label="Student roster"><table><thead><tr>{!readOnly&&!showExcluded&&<th>Select</th>}<th>Student / registration</th><th>Teaching / admission batch</th><th>SGT</th><th>{showExcluded?'Exclusion reason':'Syllabus'}</th></tr></thead><tbody>{rows.map(m=><tr key={m.studentId}>{!readOnly&&!showExcluded&&<td><input type="checkbox" aria-label={'Select '+m.name} checked={selected.includes(m.studentId)} onChange={()=>onToggle(m.studentId)}/></td>}<td><strong>{m.name}</strong><small className="fm-mono">{m.registrationId}</small></td><td><span className="fm-mono">{m.teachingBatchId}</span><small>Admitted {m.admissionBatchId}</small></td><td>{m.sectionAtAssignment||'N/A'}</td><td>{showExcluded?m.reasons?.join('; '):m.syllabusAtAssignment}</td></tr>)}</tbody></table>{!rows.length&&<p className="fm-empty">{showExcluded?'No excluded students match.':'No eligible students match this search or context.'}</p>}</div>
  </section>
}

