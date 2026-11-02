import { CalendarDays, ChevronDown, UsersRound } from 'lucide-react'
import { STUDY_YEARS } from '../../services/studentCalendar'
import './StudentRosterFilters.css'

/** Controlled roster filters; selecting multiple batches compares students in the same study year.
 * @param {{batches:Object[], selected:string[], year:string, sgt:string, count:number, onBatches:Function, onYear:Function, onSgt:Function, onReset:Function, searchRef:Function}} props
 */
export default function StudentRosterFilters({ batches, selected, year, sgt, count, onBatches, onYear, onSgt, onReset, searchRef }) {
  const ready = selected.length > 0 && Boolean(year)
  return <section className="sm-roster-panel" aria-labelledby="sm-roster-title">
    <header className="sm-roster-heading"><div><h1 id="sm-roster-title"><CalendarDays size={20} aria-hidden="true" />Year roster</h1><p>View students in the same study year across admission batches.</p></div>{(selected.length > 0 || year || sgt) && <button type="button" className="lb-btn" onClick={onReset}>Reset filters</button>}</header>
    <div className="sm-roster-controls">
      <fieldset className="sm-roster-batches"><legend>Admission batches <span>Select one or more</span></legend><div>{batches.map(batch => <label className={selected.includes(batch.id) ? 'is-selected' : ''} key={batch.id}><input type="checkbox" checked={selected.includes(batch.id)} onChange={event => onBatches(event.target.checked ? [...selected, batch.id] : selected.filter(id => id !== batch.id))} /><span>Batch {batch.id}</span></label>)}</div>{!batches.length && <p>No admission batches available.</p>}</fieldset>
      <label className="sm-roster-field"><span>Study year</span><div><select value={year} onChange={event => onYear(event.target.value)}><option value="">Choose study year</option>{STUDY_YEARS.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></div></label>
      <label className="sm-roster-field"><span>SGT</span><div><select value={sgt} onChange={event => onSgt(event.target.value)}><option value="">All SGTs</option>{['N/A', ...'ABCDEFGHIJKLMNO'].map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></div></label>
    </div>
    {ready ? <div className="sm-roster-results"><p role="status"><strong>{count}</strong> {count === 1 ? 'student' : 'students'} in {year.toLowerCase()} <span>across {selected.length} {selected.length === 1 ? 'batch' : 'batches'}</span></p><div className="sm-batch-search-slot" ref={searchRef} /></div> : <div className="sm-roster-prompt"><UsersRound size={20} aria-hidden="true" /><div><strong>{!selected.length ? 'Select a batch to get started' : 'Choose a study year'}</strong><p>Select at least one batch and a study year to see the roster.</p></div></div>}
  </section>
}
