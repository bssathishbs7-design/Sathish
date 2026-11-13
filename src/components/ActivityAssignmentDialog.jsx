import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import SaveChangesDialog from './SaveChangesDialog'
import AssessmentAssignmentFields from './AssessmentAssignmentFields'
import { resolveAssessmentAssignment } from '../services/assessmentAssignment'
import './ActivityAssignmentDialog.css'

/** Shared activity assignment workflow. Parents retain threshold/content/schedule drafts;
 * recipient scope, tab, busy and error state are local to this modal.
 * @param {{thresholds:Object[],thresholdErrors:string[],onThresholdChange:Function,onAddThreshold:Function,onDeleteThreshold:Function,content:Object,onContentChange:Function,facultyOptions:Object[],studentOptions:Object[],scheduleEnabled:boolean,onScheduleEnabled:Function,schedule:Object,onScheduleChange:Function,onClose:Function,onConfirm:Function}} props
 * onConfirm receives {recipientScope, students, studentIds, studentCount, year, sgt, batch}.
 */
export default function ActivityAssignmentDialog({ thresholds, thresholdErrors, onThresholdChange, onAddThreshold, onDeleteThreshold, content, onContentChange, facultyOptions, studentOptions, scheduleEnabled, onScheduleEnabled, schedule, onScheduleChange, onClose, onConfirm }) {
  const [tab, setTab] = useState('threshold')
  const [scope, setScope] = useState({ assignBatch: '', assignYear: '', assignGroups: [], assignStudentIds: [] })
  const [validRecipients, setValidRecipients] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [theme] = useState(() => document.querySelector('.vx-shell.theme-dark') ? 'dark' : document.documentElement.dataset.theme || 'light')
  const thresholdsValid = thresholds.length > 0 && thresholdErrors.every(value => !value)
  const contentValid = [...facultyOptions, ...studentOptions].some(option => option.available && content[option.key])
  const scheduleValid = !scheduleEnabled || Boolean(schedule.date && schedule.time && !Number.isNaN(Date.parse(`${schedule.date}T${schedule.time}`)))
  const changeTab = next => { setTab(next); setError('') }
  const submit = async () => {
    if (tab === 'threshold') { changeTab('assignment'); return }
    setBusy(true); setError('')
    try {
      const students = await resolveAssessmentAssignment(scope)
      await onConfirm({ recipientScope: scope, students, studentIds: students.map(student => student.sourceStudentId), studentCount: students.length, batch: scope.assignBatch, year: scope.assignYear, sgt: scope.assignGroups.join(', ') })
    } catch (failure) { setError(failure.message || 'Unable to assign. Please try again.') }
    finally { setBusy(false) }
  }
  const options = (title, rows) => <section className="activity-assignment-options"><h3>{title}</h3><div>{rows.length ? rows.map(option => <label key={option.key}><input type="checkbox" disabled={busy || !option.available} checked={Boolean(content[option.key])} onChange={event => onContentChange({ ...content, [option.key]: event.target.checked })} />{option.label}</label>) : <span>No faculty module</span>}</div></section>
  return <SaveChangesDialog className="activity-assignment-dialog qb-sort-scope" theme={theme} title="Configure and assign" description="Set thresholds and choose who receives this activity." showClose busy={busy} error={error} onCancel={onClose} onSave={submit} saveLabel={tab === 'threshold' ? 'Next' : 'Proceed'} busyLabel="Assigning..."
    saveDisabled={!thresholdsValid || (tab === 'assignment' && (!validRecipients || !contentValid || !scheduleValid))}
    footerStart={tab === 'assignment' && <button className="activity-assignment-back" disabled={busy} onClick={() => changeTab('threshold')}>Back</button>}>
    <div className="activity-assignment-tabs" role="tablist" aria-label="Configuration steps" onKeyDown={event => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'threshold' : event.key === 'End' ? 'assignment' : tab === 'threshold' ? 'assignment' : 'threshold'; changeTab(next); event.currentTarget.querySelector(`[data-tab="${next}"]`)?.focus() }
    }}>{[['threshold', 'Threshold configuration'], ['assignment', 'Assignment']].map(([key, label]) => <button key={key} type="button" id={`activity-tab-${key}`} data-tab={key} role="tab" aria-controls={`activity-panel-${key}`} aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} disabled={busy} onClick={() => changeTab(key)}>{label}</button>)}</div>
    <div role="tabpanel" id="activity-panel-threshold" aria-labelledby="activity-tab-threshold" hidden={tab !== 'threshold'}>
      <div className="activity-threshold-head"><span>Label</span><span>From (%)</span><span>To (%)</span><span /></div>
      {thresholds.map((row, index) => <div className="activity-threshold-row" key={row.id}>
        <input aria-label={`Threshold ${index + 1} label`} value={row.label} disabled={busy} onChange={event => onThresholdChange(row.id, 'label', event.target.value)} />
        {['from', 'to'].map(key => <input key={key} type="number" min="0" max="100" step="any" aria-label={`Threshold ${index + 1} ${key} percent`} value={row[key]} disabled={busy} onChange={event => onThresholdChange(row.id, key, event.target.value)} />)}
        <button type="button" aria-label={`Delete threshold ${index + 1}`} disabled={busy || thresholds.length === 1} onClick={() => onDeleteThreshold(row.id)}><Trash2 size={16} /></button>
        {thresholdErrors[index] && <p role="alert">{thresholdErrors[index]}</p>}
      </div>)}
      <button className="activity-threshold-add" type="button" disabled={busy} onClick={onAddThreshold}><Plus size={16} />Add range</button>
    </div>
    {tab === 'assignment' && <div role="tabpanel" id="activity-panel-assignment" aria-labelledby="activity-tab-assignment" className="activity-assignment-panel">
      <AssessmentAssignmentFields value={scope} onChange={setScope} onValidityChange={setValidRecipients} disabled={busy} />
      <div className="activity-assignment-content">{options('Assign to faculty', facultyOptions)}{options('Assign to student', studentOptions)}</div>
      {!contentValid && <p className="activity-assignment-hint">Select at least one available module.</p>}
      <label className="activity-assignment-schedule"><input type="checkbox" checked={scheduleEnabled} disabled={busy} onChange={event => onScheduleEnabled(event.target.checked)} />Schedule assignment</label>
      {scheduleEnabled && <div className="activity-assignment-content"><label>Date<input type="date" value={schedule.date} disabled={busy} onChange={event => onScheduleChange({ ...schedule, date: event.target.value })} /></label><label>Time<input type="time" value={schedule.time} disabled={busy} onChange={event => onScheduleChange({ ...schedule, time: event.target.value, meridiem: Number(event.target.value.split(':')[0]) >= 12 ? 'PM' : 'AM' })} /></label></div>}
    </div>}
  </SaveChangesDialog>
}
