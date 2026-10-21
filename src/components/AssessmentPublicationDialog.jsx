import { useEffect, useRef, useState } from 'react'
import { UsersRound, Send, X, LoaderCircle, ChevronDown } from 'lucide-react'
import SaveChangesDialog from './SaveChangesDialog'
import { ASSESSMENT_REVIEWERS } from '../services/assessmentReviewers'
import './AssessmentPublicationDialog.css'

/**
 * Stages assignment or reviewer choices until confirmation; cancellation leaves the page draft intact.
 * @param {{action:string, name:string, theme:string, year:string, group:string, years:string[], groups:string[], groupsByYear?:Object, requireAssignment?:boolean, onCancel:Function, onConfirm:(values:{assignYear:string,assignGroup:string,reviewer:Object})=>Promise<boolean>}} props
 */
export default function AssessmentPublicationDialog({ action, name, theme, year, group, years = [], groups = [], groupsByYear, requireAssignment = false, onCancel, onConfirm }) {
  const assigning = action === 'Direct Publish'
  const stepped = !assigning && requireAssignment
  const [step, setStep] = useState(1)
  const [assignYear, setYear] = useState(year || '')
  const [assignGroup, setGroup] = useState(group || '')
  const [employeeId, setEmployeeId] = useState(stepped ? '' : ASSESSMENT_REVIEWERS[0].employeeId)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [yearError, setYearError] = useState(false)
  const [groupError, setGroupError] = useState(false)
  const groupRef = useRef(null)
  const needsAssignment = assigning || requireAssignment
  const availableGroups = groupsByYear ? groupsByYear[assignYear] || [] : groups
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  const yearRef = useRef(null)
  const reviewerRef = useRef(null)
  useEffect(() => { (stepped && step === 2 ? reviewerRef : yearRef).current?.focus() }, [step, stepped])
  const reviewer = ASSESSMENT_REVIEWERS.find(person => person.employeeId === employeeId)
  const assignmentValid = Boolean(assignYear && (!assignGroup || availableGroups.includes(assignGroup)))
  const confirm = async () => {
    if (locked.current) return
    if (needsAssignment && !assignYear) { setYearError(true); yearRef.current?.focus(); return }
    if (requireAssignment && assignGroup && !availableGroups.includes(assignGroup)) { setGroupError(true); groupRef.current?.focus(); return }
    if (stepped && step === 1) { setStep(2); setError(''); return }
    if (!assigning && !reviewer) { setError('Select a faculty member.'); return }
    locked.current = true
    setBusy(true)
    setError('')
    try {
      await new Promise(resolve => setTimeout(resolve, 0))
      const success = await onConfirm({ assignYear, assignGroup, reviewer: { ...reviewer, note: note.trim() } })
      if (!success) setError('Unable to complete this action. Check the assessment and try again.')
    } catch {
      setError('Unable to complete this action. Please try again.')
    } finally { locked.current = false; setBusy(false) }
  }
  const Icon = assigning ? UsersRound : Send
  return <SaveChangesDialog className={`assessment-publication-dialog qb-sort-scope ${assigning ? 'is-assignment' : 'is-approval'}`} theme={theme}
    title={<><Icon size={20} aria-hidden="true" />{assigning ? 'Assign Assessment' : 'Send to Approval'}</>}
    description={`Assessment: ${name || 'Untitled Assessment'}`} onCancel={onCancel} onSave={confirm}
    busy={busy} error={error} saveDisabled={stepped && (!assignmentValid || step === 2 && !reviewer)}
    footerStart={stepped && step === 2 ? <button type="button" disabled={busy} onClick={() => {setStep(1);setError('')}}>Back</button> : null}
    saveLabel={assigning ? 'Assign' : stepped && step === 1 ? 'Next' : 'Send'}
    busyLabel={<><LoaderCircle size={15} className="publication-spinner" aria-hidden="true" />{assigning ? 'Assigning…' : 'Sending…'}</>}>
    <button type="button" className="publication-dialog-close" disabled={busy} onClick={onCancel} aria-label="Close"><X size={18} /></button>
    {stepped && <div className="publication-step-progress" aria-label="Approval steps"><p aria-live="polite">Step {step} of 2</p><ol><li aria-current={step === 1 ? 'step' : undefined}>1. Assign students</li><li aria-current={step === 2 ? 'step' : undefined}>2. Select reviewer</li></ol></div>}
    <fieldset disabled={busy} className="publication-dialog-fields">
      {needsAssignment && (!stepped || step === 1) && <div className="publication-dialog-grid">
        <label>{assigning ? 'Student Year' : 'Assign to Year'} <em>*</em>
          <span className="publication-select"><select ref={yearRef} required value={assignYear} aria-invalid={yearError} aria-describedby={yearError ? 'publication-year-error' : undefined} onChange={event => { setYear(event.target.value); setYearError(false); if (requireAssignment) { setGroup(''); setGroupError(false) } }}>
            <option value="">Select year</option>
            {Array.from(new Set([...years, ...(year ? [year] : [])])).map(value => <option key={value}>{value}</option>)}
          </select><ChevronDown size={16} aria-hidden="true" /></span>
          {yearError && <small id="publication-year-error" role="alert">Select a student year.</small>}
        </label>
        <label>{requireAssignment ? 'SGT (Optional)' : 'SGT Group / Class (Optional)'}
          <span className="publication-select"><select ref={groupRef} disabled={requireAssignment && !assignYear} aria-invalid={groupError} aria-describedby={groupError ? 'publication-group-error' : undefined} value={assignGroup} onChange={event => {setGroup(event.target.value);setGroupError(false)}}>
            <option value="">Select SGT group or class</option>
            {Array.from(new Set([...availableGroups, ...(!requireAssignment && group ? [group] : [])])).map(value => <option key={value}>{value}</option>)}
          </select><ChevronDown size={16} aria-hidden="true" /></span>
          {groupError && <small id="publication-group-error" role="alert">Select an SGT group.</small>}
        </label>
      </div>}
      {!assigning && (!stepped || step === 2) && <>
        <div className="publication-dialog-grid is-reviewer">
          <label>Faculty Name <em>*</em><span className="publication-select"><select ref={stepped ? reviewerRef : yearRef} required value={employeeId} onChange={event => setEmployeeId(event.target.value)}>{stepped && <option value="">Select faculty</option>}{ASSESSMENT_REVIEWERS.map(person => <option key={person.employeeId} value={person.employeeId}>{person.facultyName}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
          <label>Employee ID<input readOnly value={reviewer?.employeeId || ''} /></label>
          <label>Designation<input readOnly value={reviewer?.designation || ''} /></label>
        </div>
        <label>Note (Optional)<textarea rows={4} placeholder="Add approval note" value={note} onChange={event => setNote(event.target.value)} /></label>
      </>}
    </fieldset>
  </SaveChangesDialog>
}
