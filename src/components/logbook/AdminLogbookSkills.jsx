import { useState } from 'react'
import { Search, ChevronDown, CheckCircle2 } from 'lucide-react'
import { collectSkills } from '../../services/logbookProgress'
import { LEARNERS, belongsTo, isGraded, awaitingRemedial } from '../../services/logbookPeople'
import './AdminLogbookSkills.css'

/** Certification view over existing logbook records. Filters are local; callbacks retain page navigation and entry review.
 * @param {{subjects:string[],department:Object[],entries:Object[],onStudent:Function,renderEntries:Function}} props
 */
export default function AdminLogbookSkills({ subjects, department, entries, onStudent, renderEntries }) {
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('')
  const skills = subjects.flatMap(name => collectSkills(name, department).map(skill => {
    const people = LEARNERS.map(person => {
      const rows = department.filter(entry => belongsTo(entry, person.id) && entry.subject === name && isGraded(entry) && (entry.values.competency || entry.values.activity) === skill.code)
      const approved = rows.filter(entry => entry.status === 'Approved').length
      return { ...person, rows, approved, complete: skill.required > 0 && approved >= skill.required, remedial: rows.some(entry => awaitingRemedial(entry, entries)) }
    })
    return { ...skill, subject: name, people, certified: people.filter(person => person.complete).length }
  }))
  const visible = skills.filter(skill => (!subject || skill.subject === subject) && `${skill.code} ${skill.name} ${skill.subject}`.toLowerCase().includes(query.trim().toLowerCase()))
  const clear = () => { setQuery(''); setSubject('') }
  return <section className="admin-skills" aria-label="Skill certification">
    <div className="lb-card admin-skills-toolbar">
      <label className="lb-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Search skills" placeholder="Search skill name or code" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label className="admin-skills-select"><select aria-label="Filter skills by subject" value={subject} onChange={event => setSubject(event.target.value)}><option value="">All subjects</option>{subjects.map(name => <option key={name}>{name}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></label>
      {(query || subject) && <button className="lb-btn" onClick={clear}>Clear</button>}
    </div>
    <p className="lb-muted admin-skills-result" aria-live="polite">{visible.length} {visible.length === 1 ? 'skill' : 'skills'} / Expand a skill to view students</p>
    {visible.map(skill => <details className="admin-skill-card" key={skill.subject + skill.code}>
      <summary>
        <span className="admin-skill-icon"><CheckCircle2 size={20} aria-hidden="true" /></span>
        <span className="admin-skill-copy"><span><code>{skill.code}</code><strong>{skill.name}</strong></span><small>{skill.subject} / {skill.required ? `${skill.required} approved attempts required` : 'Requirement not configured'}</small></span>
        <span className="admin-skill-certified"><strong>{skill.certified}/{skill.people.length}</strong><small>students certified</small></span>
        <ChevronDown className="admin-skill-chevron" size={18} aria-hidden="true" />
        <span className="admin-skill-stats"><span>{skill.people.filter(person => !person.complete && person.rows.length).length} in progress</span><span>{skill.people.filter(person => person.remedial && !person.complete).length} remedial</span><span>{skill.people.filter(person => !person.rows.length).length} not started</span></span>
      </summary>
      <div className="admin-skill-people">{skill.people.map(person => <div className="admin-skill-person" key={person.id}>
        <button className="admin-skill-person-link" onClick={() => onStudent(person.id)}><span><strong>{person.name}</strong><small>{person.id}</small></span><span><strong>{person.approved}/{skill.required || '?'}</strong><small>{person.complete ? 'Certified' : person.remedial ? 'Remedial due' : person.rows.length ? 'In progress' : 'Not started'}</small></span></button>
        {person.rows.length > 0 && renderEntries(person.rows)}
      </div>)}</div>
    </details>)}
    {!visible.length && <div className="lb-card lb-empty"><p>{skills.length ? 'No skills match your search.' : 'No skills configured or logged for your departments.'}</p>{(query || subject) && <button className="lb-btn" onClick={clear}>Clear filters</button>}</div>}
  </section>
}
