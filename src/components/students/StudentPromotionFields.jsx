import { ArrowRight } from 'lucide-react'
import { YEARS } from '../../services/studentModel'
import './StudentPromotionFields.css'

/** Promotion fields consume the editor draft; field renders accessible inputs and inline errors. */
export default function StudentPromotionFields({ mode, draft, data, field, set }) {
  const students = data.students.filter(student => mode.ids.includes(student.id))
  const first = students[0]
  const earliest = Math.max(...students.map(student => Number(student.academicYear.slice(5))))
  const latest = Math.max(earliest + 9, Number(draft.academicYear.slice(0, 4)), Number(draft.date.slice(0, 4)) + 1)
  const options = Array.from({ length: latest - earliest + 1 }, (_, index) => String(earliest + index) + '-' + String(earliest + index + 1))
  const startLabel = draft.startsOn ? new Date(draft.startsOn + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Choose an end date first'
  return <>
    <div className="sm-promotion-summary">
      <strong>{students.length} {students.length === 1 ? 'student' : 'students'}</strong>
      <span className="sm-promotion-destination">{first?.year}<ArrowRight size={16} aria-label="to" />{YEARS[YEARS.indexOf(first?.year) + 1]}</span>
      <span>Batch {first?.batch}</span>
      <small>Admission batch stays unchanged.</small>
    </div>
    <div className="sm-form-grid sm-move-grid">
      {field('date', 'Current year ends on', { type: 'date' })}
      {field('academicYear', 'New academic year', { options })}
      {draft.differentStart ? field('startsOn', 'New year starts on', { type: 'date' }) : <div className="sm-promotion-start"><span>New year starts on</span><strong>{startLabel}</strong><small>Suggested from the dates above.</small></div>}
      <label className="sm-move-date-toggle"><input type="checkbox" checked={Boolean(draft.differentStart)} onChange={event => set('differentStart')(event.target.checked)} /><span>Set a different start date</span></label>
      <div className="sm-move-note">{field('note', 'Note (optional)', { required: false })}</div>
    </div>
  </>
}
