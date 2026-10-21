import { useRef, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import SaveChangesDialog from './SaveChangesDialog'
import { isPracticeSchedule } from '../services/assessmentReschedule'
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
  const save = async () => {
    if (lock.current || !form.current.reportValidity()) return
    lock.current = true; setBusy(true); setError('')
    try { await onSave(values) } catch (failure) { setError(failure.message || 'Unable to save the new schedule. Please try again.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <SaveChangesDialog className="assessment-reschedule-dialog qb-sort-scope" theme={theme}
    title={<><CalendarClock size={20} aria-hidden="true" /> Reschedule assessment</>}
    description="Choose a future schedule. This assessment will remain pending approval."
    reference={record.setup?.assessmentId} onCancel={onCancel} onSave={save} saveLabel="Save schedule" busy={busy} error={error}>
    <form ref={form} onSubmit={event => {event.preventDefault(); save()}}>
      <fieldset disabled={busy}>
        {(practice ? [['date','Start date','date'],['time','Start time','time'],['endDate','End date','date'],['endTime','End time','time']] : [['date','Start date','date'],['time','Start time','time']]).map(([key,label,type], index) => <label key={key}>{label}<input autoFocus={index === 0} type={type} required value={values[key]} onChange={event => {setValues(current => ({...current,[key]:event.target.value}));setError('')}} /></label>)}
      </fieldset>
    </form>
  </SaveChangesDialog>
}
