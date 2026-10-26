import { useId, useRef, useState } from 'react'
import { ChevronDown, LoaderCircle } from 'lucide-react'
import { SUBJECTS, YEARS } from '../../services/studentModel'
import './StudentSubjects.css'

/** Batch defaults apply by academic stage; individual student overrides remain authoritative.
 * @param {{batch: {id:string,syllabus?:string,subjectSyllabuses?:Object},year:string,students:Array,canEdit:boolean,onSave:Function}} props
 * onSave receives {type:'syllabus',batch,year,subjects:string[],syllabus} and resolves after persistence.
 */
export default function StudentSubjects({ batch, year, students, canEdit, onSave }) {
  const headingId = useId(), panelId = useId()
  const [expanded, setExpanded] = useState(false)
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const saving = useRef(false)
  const subjects = SUBJECTS[year] || []
  const academicYears = [...new Set(students.filter(student => student.tracked && student.batch === batch.id && student.year === year).map(student => student.academicYear).filter(Boolean))].sort()
  const startYear = Number(batch.id) + YEARS.indexOf(year)
  const academicYear = academicYears.length ? academicYears.join(', ') : startYear + '-' + (startYear + 1)
  const changeSyllabus = async (subject, syllabus) => {
    if (!canEdit || saving.current) return
    saving.current = true
    setPending(subject); setError('')
    try { await onSave({ type: 'syllabus', batch: batch.id, year, subjects: [subject], syllabus }) }
    catch (failure) { setError(failure.message || 'Could not save the syllabus. Please try again.') }
    finally { saving.current = false; setPending('') }
  }
  return <section className="sm-subjects" aria-labelledby={headingId} aria-busy={Boolean(pending)}>
    <h3 className="sm-subjects-toggle-heading"><button type="button" className="sm-subjects-toggle" id={headingId} aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded(value => !value)}><span className="sm-subjects-heading"><span className="sm-subjects-title">Subjects &amp; Syllabus</span><span className="sm-subjects-context"><span className="sm-subjects-year">{academicYear}</span> &middot; Batch {batch.id} / {year}</span></span><ChevronDown size={18} aria-hidden="true" /></button></h3>
    <div id={panelId} hidden={!expanded} className="sm-subjects-panel">
    <div className="sm-subjects-list">{subjects.map(subject => <label className="sm-subject-chip" key={subject}><span>{subject}</span><span className="sm-subjects-select"><select aria-label={subject + ' syllabus'} value={batch.subjectSyllabuses?.[year + ':' + subject] || batch.syllabus || 'CBME 2024'} disabled={!canEdit || Boolean(pending)} onChange={event => void changeSyllabus(subject, event.target.value)}><option>CBME 2019</option><option>CBME 2024</option></select>{pending === subject ? <LoaderCircle size={14} className="sm-spinner" aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}</span></label>)}</div>
    {pending && <span className="sm-subjects-status" role="status">Saving {pending} syllabus...</span>}
    {error && <p className="sm-error" role="alert">{error}</p>}
    </div>
  </section>
}
