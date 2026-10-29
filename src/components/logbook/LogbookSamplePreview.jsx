import { useState } from 'react'
import { assignSampleEntries, previewSampleAssignments, LEARNERS } from '../../services/adminLogbook'
import { recommendedAssignmentSamples, sourceCategoryLabel } from '../../services/logbookAssignmentSamples'
import { formatDate } from '../../services/logbook'
import './LogbookSamplePreview.css'

/** Explicit preview before a representative batch is added to the demo students' logbooks. */
export default function LogbookSamplePreview({ actor, subject, phase, studentId, due = '', instructions = '', onChanged, onClose, onBusy }) {
  const [preview, setPreview] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const activities = recommendedAssignmentSamples(subject, phase)
  const request = { activityIds: activities.map(row => row.id), studentId, due, instructions }
  const recipients = studentId === 'all' ? LEARNERS : LEARNERS.filter(row => row.id === studentId)
  const run = async save => {
    setBusy(true); onBusy(true); setError('')
    try {
      const result = await (save ? assignSampleEntries(actor, request) : previewSampleAssignments(actor, request))
      if (save) { onChanged(`Added ${result.assigned} To do assignments. ${result.skipped} existing or locked assignments skipped.`); onClose() }
      else setPreview(result)
    } catch (failure) { setError(failure.message) }
    finally { setBusy(false); onBusy(false) }
  }
  return <section className="lb-sample-preview" aria-label="Sample assignment preview">
    <h3>Sample assignments</h3>
    <p>Preview one activity per category for {subject}, {phase}. All new entries start as <strong>To do</strong>.</p>
    <p>{recipients.length ? recipients.map(row => `${row.name} (${row.id})`).join(' · ') : 'Choose a student or the entire sample cohort above.'}</p>
    <p>{due ? `Due ${formatDate(due)}` : 'No deadline'}. {instructions || 'Each activity includes a standard completion instruction.'}</p>
    {error && <p role="alert" className="lb-error">{error}</p>}
    {preview && <>
      <ul>{preview.rows.map(({ activity, assigned, duplicate, locked }) => <li key={activity.id}>
        <strong>{sourceCategoryLabel(activity.category)}</strong>
        <span>{activity.code && `${activity.code} · `}{activity.name}</span>
        <small>{activity.sample ? 'Sample template' : 'Document activity'} · {assigned} new{duplicate ? ` · ${duplicate} already assigned` : ''}{locked ? ` · ${locked} locked` : ''}</small>
      </li>)}</ul>
      <p role="status">{preview.assigned} new assignments · {preview.skipped} skipped. Patient details, dates of completion, reflections and grades remain empty.</p>
    </>}
    <div className="lb-sample-preview-actions">
      <button type="button" className="lb-btn" disabled={busy || !recipients.length || !activities.length} onClick={() => run(false)}>{busy ? 'Please wait…' : preview ? 'Refresh preview' : 'Preview sample assignments'}</button>
      {preview && <button type="button" className="lb-btn lb-primary" disabled={busy || !preview.assigned} onClick={() => run(true)}>{busy ? 'Please wait…' : `Assign ${preview.assigned} entries`}</button>}
    </div>
  </section>
}
