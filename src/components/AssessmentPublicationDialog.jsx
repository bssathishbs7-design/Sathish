import { useEffect, useRef, useState } from 'react'
import { UsersRound, Send, X, LoaderCircle, ChevronDown } from 'lucide-react'
import AssessmentAssignmentFields from './AssessmentAssignmentFields'
import ManagementMultiSelect from './ManagementMultiSelect'
import SaveChangesDialog from './SaveChangesDialog'
import { ASSESSMENT_REVIEWERS } from '../services/assessmentReviewers'
import './AssessmentPublicationDialog.css'

/**
 * Stages all choices locally until confirmation. Existing review-only consumers omit combined.
 * @param {{action:string,name:string,theme:string,year?:string,group?:string,selectedGroups?:string[],batch?:string,selectedStudentIds?:string[],years?:string[],groups?:string[],groupsByYear?:Object,requireAssignment?:boolean,combined?:boolean,allowDirectPublish?:boolean,onCancel:Function,onConfirm:(values:{action:string,assignYear:string,assignGroup:string,assignGroups:string[],assignBatch?:string,assignStudentIds?:string[],reviewer:Object})=>Promise<boolean>}} props
 */
export default function AssessmentPublicationDialog({ action, name, theme, year, group, selectedGroups, batch, selectedStudentIds, years = [], groups = [], groupsByYear, requireAssignment = false, combined = false, allowDirectPublish = true, onCancel, onConfirm }) {
  const [method, setMethod] = useState(action === 'Direct Publish' && allowDirectPublish ? 'Direct Publish' : 'Send to Approval')
  const selectedAction = combined ? allowDirectPublish ? method : 'Send to Approval' : action
  const assigning = selectedAction === 'Direct Publish'
  const [assignYear, setYear] = useState(year || '')
  const [assignGroups, setGroups] = useState(() => Array.isArray(selectedGroups) ? selectedGroups : group ? group.split(',').map(value => value.trim()).filter(Boolean) : [])
  const [assignment, setAssignment] = useState(() => ({ assignBatch: batch || '', assignYear: batch ? year || '' : '', assignGroups: batch ? selectedGroups || [] : [], assignStudentIds: batch ? selectedStudentIds || [] : [] }))
  const [cascadeValid, setCascadeValid] = useState(false)
  const [employeeId, setEmployeeId] = useState(combined || requireAssignment ? '' : ASSESSMENT_REVIEWERS[0].employeeId)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [yearError, setYearError] = useState(false)
  const [groupError, setGroupError] = useState(false)
  const needsAssignment = combined || assigning || requireAssignment
  const availableGroups = groupsByYear ? groupsByYear[assignYear] || [] : groups
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  const yearRef = useRef(null)
  const reviewerRef = useRef(null)
  useEffect(() => { (needsAssignment ? yearRef : reviewerRef).current?.focus() }, [needsAssignment])
  const reviewer = ASSESSMENT_REVIEWERS.find(person => person.employeeId === employeeId)
  const assignmentValid = combined ? cascadeValid : Boolean(assignYear && assignGroups.every(value => availableGroups.includes(value)))
  const confirm = async () => {
    if (locked.current) return
    if (combined && !cascadeValid) { setError('Select a batch and year with eligible students.'); return }
    if (!combined && needsAssignment && !assignYear) { setYearError(true); yearRef.current?.focus(); return }
    if (!combined && needsAssignment && !assignGroups.every(value => availableGroups.includes(value))) { setGroupError(true); return }
    if (!assigning && !reviewer) { setError('Select a faculty member.'); reviewerRef.current?.focus(); return }
    locked.current = true
    setBusy(true)
    setError('')
    try {
      const success = await onConfirm({ action: selectedAction, ...(combined ? { ...assignment, assignGroup: assignment.assignGroups.join(', ') } : { assignYear, assignGroups, assignGroup: assignGroups.join(', ') }), reviewer: { ...reviewer, note: note.trim() } })
      if (!success) setError('Unable to complete this action. Check the assessment and try again.')
    } catch (reason) {
      setError(reason.message || 'Unable to complete this action. Please try again.')
    } finally { locked.current = false; setBusy(false) }
  }
  const Icon = assigning && !combined ? UsersRound : Send
  return <SaveChangesDialog className={`assessment-publication-dialog qb-sort-scope ${combined ? 'is-compact-publication' : ''} ${assigning && !combined ? 'is-assignment' : 'is-approval'}`} theme={theme}
    title={<><Icon size={20} aria-hidden="true" />{combined ? 'Publish assessment' : assigning ? 'Assign Assessment' : 'Send to Approval'}</>}
    description={`Assessment: ${name || 'Untitled Assessment'}`} onCancel={onCancel} onSave={confirm}
    busy={busy} error={error} saveDisabled={needsAssignment && (!assignmentValid || !assigning && !reviewer)}
    saveLabel={combined ? assigning ? 'Publish assessment' : 'Send for approval' : assigning ? 'Assign' : 'Send'}
    busyLabel={<><LoaderCircle size={15} className="publication-spinner" aria-hidden="true" />{assigning ? 'Publishing…' : 'Sending…'}</>}>
    <button type="button" className="publication-dialog-close" disabled={busy} onClick={onCancel} aria-label="Close"><X size={18} /></button>
    <fieldset disabled={busy} className="publication-dialog-fields">
      {combined && <AssessmentAssignmentFields optionalFilters value={assignment} onChange={setAssignment} onValidityChange={setCascadeValid} disabled={busy} />}
      {!combined && needsAssignment && <div className="publication-dialog-grid">
        <label>{combined ? 'Assign to year' : assigning ? 'Student Year' : 'Assign to Year'} <em>*</em>
          <span className="publication-select"><select ref={yearRef} required value={assignYear} aria-invalid={yearError} aria-describedby={yearError ? 'publication-year-error' : undefined} onChange={event => { setYear(event.target.value); setYearError(false); setGroups([]); setGroupError(false) }}>
            <option value="">Select year</option>
            {Array.from(new Set([...years, ...(year ? [year] : [])])).map(value => <option key={value}>{value}</option>)}
          </select><ChevronDown size={16} aria-hidden="true" /></span>
          {yearError && <small id="publication-year-error" role="alert">Select a student year.</small>}
        </label>
        <ManagementMultiSelect label={combined ? 'SGT groups (optional)' : requireAssignment ? 'SGT (Optional)' : 'SGT Group / Class (Optional)'}
          placeholder="Select SGT groups or classes" searchLabel="Search SGT groups" emptyLabel="No matching SGT groups."
          options={Array.from(new Set(availableGroups)).map(value => ({ value, label: value }))}
          value={assignGroups} onChange={values => { setGroups(values); setGroupError(false) }}
          disabled={busy || !assignYear} error={groupError ? 'Select valid SGT groups for this year.' : undefined}
          allowSelectAll compact floating />
      </div>}
      {combined && <fieldset className="publication-methods">
        <legend>Publication method <em>*</em></legend>
        <div className="publication-method-grid">
          {[{ value: 'Direct Publish', label: 'Publish directly', detail: 'Publish for the scheduled exam.' },
            { value: 'Send to Approval', label: 'Send for approval', detail: 'Faculty review before publishing.' }].map(option => <label className="publication-method" key={option.value}>
            <input type="radio" name="assessment-publication-method" value={option.value} checked={selectedAction === option.value}
              disabled={busy || option.value === 'Direct Publish' && !allowDirectPublish}
              aria-describedby={option.value === 'Direct Publish' && !allowDirectPublish ? 'publication-approval-required' : undefined}
              onChange={() => { setMethod(option.value); setError('') }} />
            <span><strong>{option.label}</strong><span>{option.detail}</span></span>
          </label>)}
        </div>
        {!allowDirectPublish && <p id="publication-approval-required" className="publication-method-note">Changes to this assessment require approval.</p>}
      </fieldset>}
      {!assigning && <div className={combined ? 'publication-review-section' : undefined}>
        <div className={`publication-dialog-grid is-reviewer${combined ? ' is-combined-reviewer' : ''}`}>
          <label>{combined ? 'Reviewer' : 'Faculty Name'} <em>*</em><span className="publication-select"><select ref={reviewerRef} required value={employeeId} onChange={event => setEmployeeId(event.target.value)}>{(combined || requireAssignment) && <option value="">Select faculty member</option>}{ASSESSMENT_REVIEWERS.map(person => <option key={person.employeeId} value={person.employeeId}>{person.facultyName}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
          {!combined && <label>Employee ID<input readOnly value={reviewer?.employeeId || ''} /></label>}
          {!combined && <label>Designation<input readOnly value={reviewer?.designation || ''} /></label>}
        </div>
        <label>{combined ? 'Note (optional)' : 'Note (Optional)'}<textarea rows={combined ? 1 : 4} placeholder={combined ? 'Add a note for the reviewer' : 'Add approval note'} value={note} onChange={event => setNote(event.target.value)} /></label>
      </div>}
    </fieldset>
  </SaveChangesDialog>
}
