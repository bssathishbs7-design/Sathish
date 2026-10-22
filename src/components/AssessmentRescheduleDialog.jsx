import { useRef, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import SaveChangesDialog from './SaveChangesDialog'
import { isPracticeSchedule } from '../services/assessmentReschedule'
import { assessmentDisplayId } from '../services/assessmentHistory'
import './AssessmentRescheduleDialog.css'

/** Shared rescheduling form for tracker and approval queue.
 * @param {{record:Object,theme:string,onCancel:Function,onSave:(values:Object)=>Promise<void>}} props
 */
export default function AssessmentRescheduleDialog({record, theme, onCancel, onSave}) {
  const [values, setValues] = useState({date:'', time:'', endDate:'', endTime:''})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const form = useRef(null)
  const practice = isPracticeSchedule(record)
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const earliestEndDate = values.date > today ? values.date : today
  const save = async () => {
    if (lock.current || !form.current.reportValidity()) return
    lock.current = true; setBusy(true); setError('')
    try { await onSave(values) } catch (failure) { setError(failure.message || 'Unable to save the new schedule. Please try again.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <SaveChangesDialog className="assessment-reschedule-dialog qb-sort-scope" theme={theme}
    title={<><CalendarClock size={20} aria-hidden="true" /> Reschedule assessment</>}
    description="Choose a future schedule. Approval remains pending."
    onCancel={onCancel} onSave={save} saveLabel="Save schedule" busy={busy} error={error}>
    <div className="assessment-reschedule-reference"><span>Assessment</span><strong title={assessmentDisplayId(record)}>{record.setup?.assessmentCode || record.assessmentCode || record.assessmentName || record.activityName || assessmentDisplayId(record)}</strong></div>
    <form ref={form} onSubmit={event => {event.preventDefault(); save()}}>
      <fieldset disabled={busy}>
        {(practice ? [['date','Start date','date'],['time','Start time','time'],['endDate','End date','date'],['endTime','End time','time']] : [['date','Start date','date'],['time','Start time','time']]).map(([key,label,type], index) => <label key={key}>{label}<input autoFocus={index === 0} type={type} min={type === 'date' ? key === 'endDate' ? earliestEndDate : today : undefined} required value={values[key]} onChange={event => {setValues(current => ({...current,[key]:event.target.value}));setError('')}} /></label>)}
      </fieldset>
    </form>
  </SaveChangesDialog>
}
