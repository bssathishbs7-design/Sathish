import { useId, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import LogbookDrawer from '../logbook/LogbookDrawer'
import LogbookConfirm from '../logbook/LogbookConfirm'
import { YEARS, today, academicYearFor, validateStudent } from '../../services/studentManagement'
import './StudentEditor.css'

/** Accessible labelled field shared by student forms. */
export function StudentField({ label, value, onChange, options, error, type = 'text', disabled = false, required = true }) {
  const id = useId()
  const props = { id, value: value ?? '', disabled, required, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined, onChange: event => onChange(event.target.value) }
  return <label className="lb-field sm-field" htmlFor={id}><span>{label}{required && !disabled ? ' *' : ''}</span>{options ? <select {...props}>{options.map(option => typeof option === 'string' ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input {...props} type={type} />}{error && <small id={`${id}-error`} className="sm-error">{error}</small>}</label>
}

/** mode supplies a transaction type and optional student/batch/selected ids. */
export default function StudentEditor({ mode, data, theme, onClose, onSave }) {
  const student = mode.student
  const movingStudent = mode.type === 'move' ? data.students.find(person => mode.ids.includes(person.id)) : null
  const nextAcademicStart = movingStudent ? Math.max(Number(movingStudent.academicYear.slice(5)), Number(today().slice(0, 4)) + 1) : null
  const [draft, setDraft] = useState(() => mode.type === 'save' ? (student ? { ...student } : { name: '', registrationId: '', email: '', phone: '', batch: mode.batch || data.batches[0]?.id || '', section: 'A', subject: '', joinedOn: today(), academicYear: academicYearFor(today()) }) : { ...mode, id: student?.id, batch: student?.batch || mode.batch || data.batches[0]?.id || '', year: student?.year || YEARS[0], academicYear: nextAcademicStart ? `${nextAcademicStart}-${nextAcademicStart + 1}` : student?.academicYear || academicYearFor(today()), startsOn: nextAcademicStart ? `${nextAcademicStart}-08-01` : student?.startedAt || today(), date: today(), reason: '', note: '', confirm: '', syllabus: student?.syllabus ?? data.batches.find(batch => batch.id === mode.batch)?.syllabus ?? 'CBME 2024', course: 'MBBS', batchYear: '', batchStart: today() })
  const [errors, setErrors] = useState({}), [error, setError] = useState(''), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false), [discard, setDiscard] = useState(false)
  const titles = { save: student ? 'Edit student' : 'Add student', batch: 'Add batch', deleteBatch: 'Delete batch', delete: 'Delete students', move: mode.action === 'complete' ? 'Complete course' : mode.action === 'repeat' ? 'Mark not promoted' : 'Promote students', undo: 'Undo progression', status: 'Change student status', setup: 'Set up year tracking', correct: 'Correct year record', syllabus: 'Syllabus assignment' }
  const set = key => value => { setDraft(previous => ({ ...previous, [key]: value })); setDirty(true); setErrors(previous => ({ ...previous, [key]: '' })); setError('') }
  const field = (key, label, options = {}) => <StudentField key={key} label={label} value={draft[key]} onChange={set(key)} error={errors[key]} {...options} />
  const close = () => { if (dirty) setDiscard(true); else onClose() }
  const save = async event => {
    event.preventDefault()
    if (mode.type === 'save') {
      const next = validateStudent(draft, data, student)
      setErrors(next)
      if (Object.keys(next).length) { setError('Check the highlighted fields.'); return }
    }
    setBusy(true); setError('')
    try {
      const command = mode.type === 'save' ? { type: 'save', draft } : mode.type === 'batch' ? { type: 'batch', batch: { id: draft.batchYear, course: draft.course, startsOn: draft.batchStart, syllabus: draft.syllabus } } : { ...draft, type: mode.type }
      await onSave(command)
      onClose()
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  const batchOptions = [{ value: '', label: 'Choose batch' }, ...data.batches.map(batch => ({ value: batch.id, label: `Batch ${batch.id}` }))]
  return <LogbookDrawer title={titles[mode.type]} subtitle={student ? `${student.name} · ${student.registrationId}` : 'Student administration'} eyebrow="Student management" theme={theme} variant="form" busy={busy} onClose={close}>
    <form className="sm-editor" onSubmit={save} noValidate={mode.type === 'save'}>
      <fieldset className="sm-form-body" disabled={busy}>
        {mode.type === 'save' && <><p className="sm-help">{student ? 'Batch and academic year are managed through progression and year history.' : 'New students join First Year. Use progression to move them to later years.'}</p><div className="sm-form-grid">
          {field('name', 'Full name')}{field('registrationId', 'Student ID')}{field('email', 'Email', { type: 'email' })}{field('phone', 'Phone', { type: 'tel' })}
          {field('batch', 'Batch', { options: batchOptions, disabled: Boolean(student) })}{field('academicYear', 'Academic year', { disabled: Boolean(student) })}{field('joinedOn', 'Joining date', { type: 'date', disabled: Boolean(student) })}
          {field('section', 'Section', { options: 'ABCDEFGHIJKLMNO'.split('') })}{field('subject', 'Subject / department')}
          {!student && Number(draft.batch) < Number(draft.academicYear?.slice(0, 4)) && field('batchReason', 'Reason for earlier batch')}
        </div></>}
        {mode.type === 'batch' && <div className="sm-form-grid">{field('batchYear', 'Batch year')}{field('course', 'Course')}{field('batchStart', 'Starts on', { type: 'date' })}{field('syllabus', 'Default syllabus', { options: ['CBME 2024', 'CBME 2019'] })}</div>}
        {mode.type === 'move' && <><p>{mode.ids.length} selected student{mode.ids.length !== 1 ? 's' : ''}. Review the dates before confirming. Previous year records will remain in history.</p><div className="sm-form-grid">{field('date', mode.action === 'complete' ? 'Course completed on' : 'Current year ends on', { type: 'date' })}{mode.action !== 'complete' && <>{field('academicYear', 'New academic year')}{field('startsOn', 'New year starts on', { type: 'date' })}</>}{field('note', 'Note', { required: false })}</div></>}
        {['setup', 'correct'].includes(mode.type) && <><p>Record the student’s actual current year. Corrections are retained in the audit history.</p><div className="sm-form-grid">{field('batch', 'Batch', { options: batchOptions })}{field('year', 'Current year', { options: YEARS })}{field('academicYear', 'Academic year')}{field('startsOn', 'Year starts on', { type: 'date' })}{field('reason', 'Reason')}</div></>}
        {mode.type === 'status' && <><p>Change status from <strong>{student.status}</strong> to <strong>{student.status === 'Active' ? 'Inactive' : 'Active'}</strong>. Inactive students cannot be promoted.</p>{field('reason', 'Reason')}</>}
        {mode.type === 'undo' && <><p>Restore the previous year for this progression. Undo is available only while the affected students have no newer changes.</p>{field('reason', 'Reason')}</>}
        {mode.type === 'delete' && <p>Delete {mode.ids.length} student record{mode.ids.length !== 1 ? 's' : ''}? This permanently removes their enrolment records from this directory.</p>}
        {mode.type === 'deleteBatch' && <><p>Delete Batch {mode.batch}, its {data.students.filter(person => person.batch === mode.batch).length} students and progression history? This cannot be undone.</p>{field('confirm', 'Type the batch year to confirm')}</>}
        {mode.type === 'syllabus' && <>{field('syllabus', student ? 'Student syllabus' : 'Batch default syllabus', { options: [...(student ? [{ value: '', label: 'Follow batch syllabus' }] : []), 'CBME 2024', 'CBME 2019'] })}<p className="sm-help">Student overrides take precedence over the batch default.</p></>}
        {error && <p className="lb-alert sm-error" role="alert">{error}</p>}
        {discard && <LogbookConfirm title="Discard unsaved changes?" confirmLabel="Discard" onCancel={() => setDiscard(false)} onConfirm={onClose}>Your saved student records will stay unchanged.</LogbookConfirm>}
      </fieldset>
      <footer className="lb-drawer-foot"><button type="button" className="lb-btn" disabled={busy} onClick={close}>Cancel</button><button className="lb-btn lb-primary" disabled={busy || discard} type="submit">{busy && <LoaderCircle size={16} className="sm-spinner" />}{busy ? 'Saving…' : ['delete', 'deleteBatch'].includes(mode.type) ? 'Confirm deletion' : mode.type === 'save' ? 'Save student' : 'Confirm'}</button></footer>
    </form>
  </LogbookDrawer>
}
