import { useId, useState } from 'react'
import { LoaderCircle, ChevronDown, Info } from 'lucide-react'
import StudentWorkspacePanel from './StudentWorkspacePanel'
import StudentPhoto from './StudentPhoto'
import StudentWorkflowFields from './StudentWorkflowFields'
import { YEARS, today, academicYearFor, validateStudent } from '../../services/studentManagement'
import { COURSES, DEPARTMENTS } from '../../services/studentModel'
import { suggestPromotion, validatePromotion } from '../../services/studentPromotionForm'
import './StudentEditor.css'

/** Labelled form field; errors are associated with the input for screen readers. */
export function StudentField({ label, value, onChange, options, error, type = 'text', disabled = false, required = true }) {
  const id = useId()
  const props = { id, value: value ?? '', disabled, required, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined, onChange: event => onChange(event.target.value) }
  return <label className="lb-field sm-field" htmlFor={id}><span>{label}{required && !disabled && <span className="sm-required-mark" aria-hidden="true"> *</span>}</span>{options ? <span className="sm-select-control"><select {...props}>{options.map(option => typeof option === 'string' ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span> : <input {...props} type={type} />}{error && <small id={`${id}-error`} className="sm-error">{error}</small>}</label>
}
/** onSave returns the committed Directory; photos are a separate transaction after profile save. */
export default function StudentEditor({ mode, data, onClose, onSave }) {
  const student = mode.student, batch = data.batches.find(b => b.id === (student?.batch || mode.batch))
  const moving = mode.type === 'move' ? data.students.find(s => mode.ids.includes(s.id)) : null
  const promoting = mode.type === 'move' && mode.action === 'promote'
  const selectedStudents = mode.type === 'move' ? data.students.filter(item => mode.ids.includes(item.id)) : []
  const nextYear = moving ? Number(moving.academicYear.slice(5)) : Number(today().slice(0, 4))
  const [draft, setDraft] = useState(() => mode.type === 'save' ? (student ? { ...student, section: student.section || 'N/A' } : { name: '', registrationId: '', email: '', code: '+91', phone: '', batch: '', course: batch?.course || 'MBBS', section: 'N/A', department: 'N/A', joinedOn: '', academicYear: '', year: YEARS[0], photo: '' }) : { ...mode, id: student?.id, batch: student?.batch || mode.batch || '', year: mode.year || student?.year || YEARS[0], joinedOn: student?.joinedOn || '', academicYear: `${nextYear}-${nextYear + 1}`, startsOn: mode.entry?.start || student?.startedAt || today(), endsOn: mode.entry?.end || '', section: mode.entry?.section || student?.section || 'N/A', academicRevision: student?.academicRevision, entryId: mode.entry?.id, photo: student?.photo || '', date: today(), reason: '', note: '', confirm: '', syllabus: 'CBME 2024', subjects: [], course: 'MBBS', batchYear: '', batchStart: today(), ...(promoting ? { ...suggestPromotion(selectedStudents, today()), differentStart: false } : {}) })
  const [photoBusy, setPhotoBusy] = useState(false)
  const [errors, setErrors] = useState({}), [error, setError] = useState(''), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false), [discard, setDiscard] = useState(false), [savedId, setSavedId] = useState(null)
  const titles = { save: student ? 'Edit student' : 'Add student', batch: 'Add batch', deleteBatch: 'Delete batch', delete: 'Delete students', move: mode.action === 'complete' ? 'Mark course completed' : mode.action === 'repeat' ? 'Mark not promoted' : 'Promote students', undo: 'Undo progression', status: 'Change account status', setup: 'Set up year tracking', bulkSetup: 'Set up legacy students', correct: 'Correct year dates / SGT', correctDecision: 'Correct latest decision', syllabus: 'Subjects and syllabus', photo: 'Student photo' }
  const set = key => value => { setDraft(previous => ({ ...previous, [key]: value, ...(promoting && key === 'date' && value ? { ...suggestPromotion(selectedStudents, value), ...(previous.differentStart ? { startsOn: previous.startsOn } : {}) } : {}), ...(promoting && (key === 'academicYear' || (key === 'differentStart' && !value)) && !((key === 'academicYear') && previous.differentStart) ? suggestPromotion(selectedStudents, previous.date, key === 'academicYear' ? value : previous.academicYear) : {}), ...(key === 'year' ? { subjects: [] } : {}), ...(key === 'batch' && mode.type === 'save' && !student ? { joinedOn: data.batches.find(item => item.id === value)?.startsOn || '', academicYear: value ? academicYearFor(value) : '' } : {}) })); setDirty(true); setErrors(previous => ({ ...previous, [key]: '', ...(key === 'batch' ? { joinedOn: '', academicYear: '' } : {}) })); setError('') }
  const promotionErrors = promoting ? validatePromotion(selectedStudents, draft) : {}
  const awaitingBatch = mode.type === 'save' && !student && !data.batches.some(item => item.id === draft.batch)
  const field = (key, label, options = {}) => <StudentField key={key} label={label} value={draft[key]} onChange={set(key)} error={promotionErrors[key] || errors[key]} {...options} disabled={Boolean(savedId) || Boolean(options.disabled) || (awaitingBatch && key !== 'batch')} />
  const close = () => { if (dirty && !savedId) setDiscard(true); else onClose() }
  const save = async event => {
    event.preventDefault()
    if (awaitingBatch || Object.keys(promotionErrors).length) return
    // Optional admission fields retain the form defaults when not supplied.
    const profileDraft = { ...draft, joinedOn: draft.joinedOn || data.batches.find(item => item.id === draft.batch)?.startsOn, department: draft.department || 'N/A', section: draft.section || 'N/A' }
    if (mode.type === 'save' && !savedId) {
      const next = validateStudent(profileDraft, data, student); setErrors(next)
      if (Object.keys(next).length) { setError('Check the highlighted fields.'); return }
    }
    setBusy(true); setError('')
    let committedId = savedId
    try {
      if (mode.type === 'save') {
        if (!committedId) {
          const next = await onSave({ type: 'save', draft: profileDraft })
          committedId = student?.id || next.students.find(s => s.registrationId === draft.registrationId.trim())?.id
          setSavedId(committedId)
        }
        if (draft.photo !== (student?.photo || '')) await onSave({ type: 'photo', id: committedId, photo: draft.photo })
      } else {
        const command = mode.type === 'batch' ? { type: 'batch', batch: { id: draft.batchYear, course: draft.course, startsOn: draft.batchStart } } : { ...draft, type: mode.type, ...(mode.type === 'move' && !promoting && !draft.differentStart ? { startsOn: draft.date } : {}) }
        await onSave(command)
      }
      onClose()
    } catch (failure) { setError(committedId ? `Student details saved. Photo was not saved: ${failure.message} Retry or close and update it from Student Record.` : failure.message) } finally { setBusy(false) }
  }
  const batches = data.batches.filter(b => b.course === draft.course)
  return <StudentWorkspacePanel variant={mode.type === 'save' ? 'student' : ['delete', 'deleteBatch'].includes(mode.type) ? 'destructive' : undefined} title={mode.type === 'deleteBatch' ? `Delete Batch ${mode.batch}?` : titles[mode.type]} subtitle={student ? `${student.name} / ${student.trackingId}` : mode.emptyOnly ? 'Remove this empty admission batch.' : mode.type === 'batch' ? 'Set the admission year and course start date.' : 'Review the details below before saving.'} busy={busy} onClose={close}>
    <form className="sm-editor" onSubmit={save} noValidate={mode.type === 'save'}>
      <fieldset className="sm-form-body" disabled={busy}>
        {mode.type === 'save' ? <>
          {!student && <p className="sm-first-year-notice"><Info size={16} aria-hidden="true"/><span>Select a destination batch to enable the form. New students can only be added to First Year.</span></p>}
          <fieldset className="sm-profile-section"><legend>Personal details</legend><div className="sm-sketch-personal">
            <div className="sm-photo-field"><StudentPhoto value={draft.photo || ''} onChange={set('photo')} onBusyChange={setPhotoBusy} disabled={busy || awaitingBatch} /></div>
            <div className="sm-sketch-fields">
              <div className="sm-sketch-row sm-sketch-identity">{field('registrationId', 'Student ID', { disabled: Boolean(student) })}{field('batch', 'Destination batch', { options: [{ value: '', label: 'Select Your Batch' }, ...batches.map(b => b.id)], disabled: Boolean(student) })}</div>
              <div className="sm-sketch-row sm-sketch-name">{field('name', 'Full name')}{field('joinedOn', 'Joined on', { type: 'date', disabled: true, required: false })}</div>
              <div className="sm-sketch-row sm-sketch-contact">{field('email', 'Email', { type: 'email' })}<div className="sm-aligned-phone">{field('code', 'Code', { options: ['+91', '+1', '+44', '+61', '+971'] })}{field('phone', 'Phone', { type: 'tel' })}</div></div>
            </div>
          </div></fieldset>
          <fieldset disabled={Boolean(savedId)} className="sm-profile-section"><legend>Admission details</legend><div className="sm-admission-grid">
            {field('academicYear', 'Academic year', { disabled: Boolean(student) })}{field('course', 'Course', { options: COURSES, disabled: Boolean(student) })}<span className="sm-grid-spacer" aria-hidden="true" />
            {field('department', 'Department', { options: DEPARTMENTS, required: false, disabled: Boolean(student) })}{field('year', 'Year', { disabled: true })}{field('section', 'SGT', { options: ['N/A', ...'ABCDEFGHIJKLMNO'.split('')], required: false })}
            {!student && Number(draft.batch) < Number(draft.academicYear?.slice(0, 4)) && <>{field('batchReason', 'Reason for earlier batch', { options: ['', 'Repeater transferred in', 'Rejoining after a break', 'Other'] })}{draft.batchReason === 'Other' && field('batchReasonDetail', 'Explain the reason')}</>}
          </div></fieldset>
        </> : mode.type === 'photo' ? <StudentPhoto value={draft.photo ?? student?.photo ?? ''} onChange={set('photo')} onBusyChange={setPhotoBusy} disabled={busy} /> : <StudentWorkflowFields mode={mode} draft={draft} data={data} student={student} field={field} set={set} />}
        {error && <p className="lb-alert sm-error" role="alert">{error}</p>}
        {discard && <div className="sm-inline-confirm" role="alert"><strong>Discard unsaved changes?</strong><button type="button" className="lb-btn" onClick={() => setDiscard(false)}>Keep editing</button><button type="button" className="lb-btn" onClick={onClose}>Discard changes</button></div>}
      </fieldset>
      <footer className="sm-form-footer"><button type="button" className="lb-btn" disabled={busy} onClick={close}>{savedId ? 'Close' : 'Cancel'}</button><button className="lb-btn lb-primary" disabled={busy || awaitingBatch || Object.keys(promotionErrors).length > 0 || photoBusy || discard || (mode.type === 'delete' && !draft.acknowledged)} type="submit">{busy && <LoaderCircle size={16} className="sm-spinner" />}{busy ? 'Saving...' : savedId ? 'Retry photo' : mode.type === 'deleteBatch' && mode.emptyOnly ? 'Delete batch' : ['delete', 'deleteBatch'].includes(mode.type) ? 'Confirm deletion' : mode.type === 'save' ? (student ? 'Update' : 'Save student') : mode.type === 'batch' ? 'Create batch' : promoting ? `Promote ${mode.ids.length} ${mode.ids.length === 1 ? 'student' : 'students'}` : 'Confirm'}</button></footer>
    </form>
  </StudentWorkspacePanel>
}
