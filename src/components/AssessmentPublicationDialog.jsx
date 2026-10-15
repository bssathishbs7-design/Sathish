import { useEffect, useRef, useState } from 'react'
import { UsersRound, Send, X, LoaderCircle, ChevronDown } from 'lucide-react'
import SaveChangesDialog from './SaveChangesDialog'
import { ASSESSMENT_REVIEWERS } from '../services/assessmentReviewers'
import './AssessmentPublicationDialog.css'

/**
 * Stages assignment or reviewer choices until confirmation; cancellation leaves the page draft intact.
 * @param {{action:string, name:string, theme:string, year:string, group:string, years:string[], groups:string[], onCancel:Function, onConfirm:(values:{assignYear:string,assignGroup:string,reviewer:Object})=>Promise<boolean>}} props
 */
export default function AssessmentPublicationDialog({ action, name, theme, year, group, years, groups, onCancel, onConfirm }) {
  const assigning = action === 'Direct Publish'
  const [assignYear, setYear] = useState(year || '')
  const [assignGroup, setGroup] = useState(group || '')
  const [employeeId, setEmployeeId] = useState(ASSESSMENT_REVIEWERS[0].employeeId)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [yearError, setYearError] = useState(false)
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  const yearRef = useRef(null)
  useEffect(() => { yearRef.current?.focus() }, [])
  const reviewer = ASSESSMENT_REVIEWERS.find(person => person.employeeId === employeeId)
  const confirm = async () => {
    if (locked.current) return
    if (assigning && !assignYear) { setYearError(true); yearRef.current?.focus(); return }
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
    busy={busy} error={error} saveLabel={assigning ? 'Assign' : 'Send'}
    busyLabel={<><LoaderCircle size={15} className="publication-spinner" aria-hidden="true" />{assigning ? 'Assigning…' : 'Sending…'}</>}>
    <button type="button" className="publication-dialog-close" disabled={busy} onClick={onCancel} aria-label="Close"><X size={18} /></button>
    <fieldset disabled={busy} className="publication-dialog-fields">
      {assigning ? <div className="publication-dialog-grid">
        <label>Student Year <em>*</em>
          <span className="publication-select"><select ref={yearRef} value={assignYear} aria-invalid={yearError} aria-describedby={yearError ? 'publication-year-error' : undefined} onChange={event => { setYear(event.target.value); setYearError(false) }}>
            <option value="">Select year</option>
            {Array.from(new Set([...years, ...(year ? [year] : [])])).map(value => <option key={value}>{value}</option>)}
          </select><ChevronDown size={16} aria-hidden="true" /></span>
          {yearError && <small id="publication-year-error" role="alert">Select a student year.</small>}
        </label>
        <label>SGT Group / Class (Optional)
          <span className="publication-select"><select value={assignGroup} onChange={event => setGroup(event.target.value)}>
            <option value="">Select SGT group or class</option>
            {Array.from(new Set([...groups, ...(group ? [group] : [])])).map(value => <option key={value}>{value}</option>)}
          </select><ChevronDown size={16} aria-hidden="true" /></span>
        </label>
      </div> : <>
        <div className="publication-dialog-grid is-reviewer">
          <label>Faculty Name <em>*</em><span className="publication-select"><select ref={yearRef} value={employeeId} onChange={event => setEmployeeId(event.target.value)}>{ASSESSMENT_REVIEWERS.map(person => <option key={person.employeeId} value={person.employeeId}>{person.facultyName}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
          <label>Employee ID<input readOnly value={reviewer?.employeeId || ''} /></label>
          <label>Designation<input readOnly value={reviewer?.designation || ''} /></label>
        </div>
        <label>Note (Optional)<textarea rows={4} placeholder="Add approval note" value={note} onChange={event => setNote(event.target.value)} /></label>
      </>}
    </fieldset>
  </SaveChangesDialog>
}
