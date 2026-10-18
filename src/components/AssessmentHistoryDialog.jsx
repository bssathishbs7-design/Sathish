import { readBlueprintWorkflow } from '../services/blueprintApproval'
import { History, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import SaveChangesDialog from './SaveChangesDialog'
import { assessmentDisplayId, readAssessmentHistory } from '../services/assessmentHistory'
import './AssessmentHistoryDialog.css'
/** @param {{assessment:Object,onClose:Function,controlLogs?:Array}} props Shared lifecycle history across assessment stages. */
export default function AssessmentHistoryDialog({ assessment, onClose, stage, controlLogs = [] }) {
  const blueprintId = readBlueprintWorkflow(assessment.setup?.assessmentId || assessment.assessmentId || assessment.id)?.blueprintId
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    const refresh = () => {
      try { setHistory(readAssessmentHistory(assessment)); setError('') }
      catch { setError('Unable to read assessment history. Please try again.') }
    }
    refresh()
    const timer = setInterval(refresh, 2000)
    return () => clearInterval(timer)
  }, [assessment])
  const theme = document.documentElement.dataset.theme || (document.querySelector('.theme-dark') ? 'dark' : 'light')
  const events = [...history, ...controlLogs.map(log => ({ id: log.id, action: log.action || 'Exam control updated', timestamp: log.timestamp, notes: log.remarks, actor: log.faculty, legacyTime: [log.date, log.time].filter(Boolean).join(' ') }))]
    .sort((a,b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0))
  return <SaveChangesDialog className="assessment-history-dialog" theme={theme} title={<span className="assessment-history-title"><span className="assessment-history-icon"><History size={18} aria-hidden="true" /></span>Assessment History</span>} description={<span className="assessment-history-meta"><strong>{assessment.assessmentName || assessment.activityName || assessment.setup?.assessmentName || 'Untitled Assessment'}</strong><span className="mono">{assessmentDisplayId(assessment)}</span><span>{stage || '-'}</span>{blueprintId && <span className="mono">{blueprintId}</span>}<span>{events.length} activities</span></span>} onCancel={onClose} cancelLabel={<X size={18} aria-hidden="true" />} cancelAriaLabel="Close assessment history" error={error}>
    <div className="assessment-history-table-wrap" tabIndex={0} role="region" aria-label="Scrollable assessment history">
      <table className="assessment-history-table">
        <thead><tr><th scope="col">Date &amp; time</th><th scope="col">Activity</th><th scope="col">Person</th><th scope="col">Notes</th></tr></thead>
        <tbody>{events.map((event,index) => <tr key={`${event.id}-${index}`}>
          <td><time>{Number.isFinite(Date.parse(event.timestamp)) ? new Date(event.timestamp).toLocaleString('en-GB', { hour12: true }).toUpperCase() : event.legacyTime || '-'}</time></td>
          <td>{event.action}</td><td>{event.actor || '-'}</td><td>{event.notes || '-'}</td>
        </tr>)}</tbody>
      </table>
      {!events.length && !error && <p className="assessment-history-empty">No recorded activity yet.</p>}
    </div>
  </SaveChangesDialog>
}
