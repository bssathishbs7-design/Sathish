import { DashboardShell } from './DashboardShell'
import { TableCard } from './TableCard'

const skillRows = [
  { name: 'Checklist for diluting the given sample of blood for WBC count.', type: 'OSPE', status: 'Not Generated', action: 'Generate with Ai', tone: 'teal' },
  { name: 'Determine Blood group & RBC indices', type: 'OSCE', status: 'Not Generated', action: 'Generate with Ai', tone: 'teal' },
  { name: 'Perform Spirometry and interpret the findings (Digital / Manual)', type: 'Interpretation', status: 'Not Created', action: 'Create Manual', tone: 'purple' },
  { name: 'Describe principles and methods of artificial respiration', type: 'Image', status: 'Not Created', action: 'Create Manual', tone: 'purple' },
  { name: 'Checklist for diluting the given sample of blood for WBC count.', type: 'OSPE', status: 'Assigned', action: 'Preview', tone: 'light' },
  { name: 'Determine Blood group & RBC indices', type: 'OSCE', status: 'Generated', action: 'Preview', tone: 'light' },
]

export default function SkillAssessmentPage() {
  return (
    <DashboardShell>
      <section className="vx-card">
        <header className="vx-card-head">
          <div>
            <h3>Skill Assessment</h3>
            <p>Manage skill assessments and track student progress</p>
          </div>
          <button type="button" className="vx-dots" aria-label="More options">
            ...
          </button>
        </header>
        <div className="vx-table-wrap">
          <table className="vx-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {skillRows.map((row, index) => (
                <tr key={index}>
                  <td>{row.name}</td>
                  <td>{row.type}</td>
                  <td>
                    <span className={`vx-tag vx-tag-${row.tone}`}>{row.status}</span>
                  </td>
                  <td>
                    <button type="button" className="vx-btn vx-btn-primary">
                      {row.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <TableCard title="Recent Activity" helper="Latest actions and events" className="mt-4" />
    </DashboardShell>
  )
}
