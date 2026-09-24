import { useState } from 'react'
import { ChevronDown, ArrowUpRight } from 'lucide-react'
import './AdminLogbookDashboard.css'

const stages = [
  { status: 'To do', label: 'Assigned', tone: 'blue' },
  { status: 'Pending', label: 'Awaiting review', tone: 'amber' },
  { status: 'Returned', label: 'Returned', tone: 'violet' },
  { status: 'Approved', label: 'Approved', tone: 'green' },
]
const dayKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** Live overview of faculty-visible records. Entry counts and subject-logbook sign-offs are separate units.
 * @param {{entries:Object[],signoffs:Object[],navigate:Function}} props
 */
export default function AdminLogbookDashboard({ entries, signoffs, navigate }) {
  const [subject, setSubject] = useState('')
  const subjects = [...new Set(entries.map(entry => entry.subject).filter(Boolean))].sort()
  const rows = entries.filter(entry => (!subject || entry.subject === subject) && stages.some(stage => stage.status === entry.status))
  const counts = stages.map(stage => ({ ...stage, count: rows.filter(entry => entry.status === stage.status).length }))
  const maxCount = Math.max(1, ...counts.map(stage => stage.count))
  const approved = counts.find(stage => stage.status === 'Approved').count
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - 6 + index)
    const key = dayKey(date)
    return { key, label: date.toLocaleDateString('en-GB', { weekday: 'short' }), date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), count: rows.filter(entry => entry.submittedAt && dayKey(new Date(entry.submittedAt)) === key).length }
  })
  const maxDay = Math.max(1, ...days.map(day => day.count))
  const subjectRows = (subject ? [subject] : subjects).map(name => ({ name, counts: stages.map(stage => rows.filter(entry => entry.subject === name && entry.status === stage.status).length) }))
  const maxSubject = Math.max(1, ...subjectRows.map(item => item.counts.reduce((sum, count) => sum + count, 0)))
  const records = signoffs.filter(record => !subject || record.subject === subject)
  return <section className="faculty-dashboard-charts" aria-label="Logbook overview charts">
    <div className="faculty-dashboard-heading"><div><h2>Logbook progress</h2><p>Current entry status across your departments. Select a bar to view entries.</p></div><label className="faculty-dashboard-filter"><select aria-label="Dashboard subject" value={subject} onChange={event => setSubject(event.target.value)}><option value="">All subjects</option>{subjects.map(name => <option key={name}>{name}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></label></div>
    <div className="faculty-chart-grid">
      <section className="lb-card faculty-chart"><div className="faculty-chart-title"><h3>Entry workflow</h3><span><strong>{rows.length}</strong> entries</span></div><p className="faculty-chart-note">{rows.length ? `${Math.round(approved / rows.length * 100)}% approved` : 'No entries yet'} / Drafts excluded</p>
        <div className="faculty-stage-chart">{counts.map(stage => <button key={stage.status} className="faculty-stage-row" data-tone={stage.tone} onClick={() => navigate('Search', '', { status: stage.status, query: subject })} aria-label={`${stage.label}: ${stage.count} entries. View entries.`}><span>{stage.label}</span><span className="faculty-bar-track"><span style={{ width: `${stage.count / maxCount * 100}%` }} /></span><strong>{stage.count}</strong><ArrowUpRight size={14} aria-hidden="true" /></button>)}</div>
      </section>
      <section className="lb-card faculty-chart"><div className="faculty-chart-title"><h3>Submission activity</h3><span>Last 7 days</span></div><p className="faculty-chart-note">{days.reduce((sum, day) => sum + day.count, 0)} entries by latest submission date</p><div className="faculty-week-chart" role="img" aria-label={days.map(day => `${day.date}: ${day.count} submissions`).join('; ')}>{days.map(day => <div className="faculty-day" key={day.key} title={`${day.date}: ${day.count} submissions`}><strong>{day.count}</strong><span className="faculty-day-track"><span style={{ height: `${day.count / maxDay * 100}%` }} /></span><small>{day.label}</small><small>{day.date}</small></div>)}</div></section>
      <section className="lb-card faculty-chart"><div className="faculty-chart-title"><h3>Subject breakdown</h3><span>Entry counts</span></div><div className="faculty-chart-legend">{stages.map(stage => <span key={stage.status} data-tone={stage.tone}><i />{stage.label}</span>)}</div><div className="faculty-subject-chart">{subjectRows.map(item => <button className="faculty-subject-row" key={item.name} onClick={() => navigate('Subjects', item.name)}><span>{item.name}</span><span className="faculty-subject-bar">{item.counts.map((count, index) => <span key={stages[index].status} data-tone={stages[index].tone} style={{ width: `${count / maxSubject * 100}%` }} title={`${stages[index].label}: ${count}`} />)}</span><strong>{item.counts.reduce((sum, count) => sum + count, 0)}</strong><span className="faculty-chart-sr">{item.counts.map((count, index) => `${stages[index].label}: ${count}`).join(', ')}</span></button>)}{!subjectRows.length && <p className="lb-empty">No subject activity yet.</p>}</div></section>
      <section className="lb-card faculty-chart"><div className="faculty-chart-title"><h3>Final sign-offs</h3><button className="lb-text-btn" onClick={() => navigate('Sign-offs')}>View all <ArrowUpRight size={14} /></button></div><p className="faculty-chart-note">Subject logbooks / separate from individual entry approval</p><div className="faculty-signoff-grid">{[['Ready', 'Ready to submit'], ['Submitted', 'With approvers'], ['Returned', 'Returned'], ['Completed', 'Completed']].map(([status, label], index) => <div key={status} data-tone={stages[index].tone}><strong>{records.filter(record => record.status === status).length}</strong><span>{label}</span></div>)}</div><p className="faculty-chart-note">Approve entries, confirm subject readiness, then complete the sign-off chain.</p></section>
    </div>
  </section>
}
