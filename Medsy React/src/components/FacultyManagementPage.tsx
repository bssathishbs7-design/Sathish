import { DashboardShell } from './DashboardShell'

const facultyRows = [
  { name: 'Dr. Anika Sharma', department: 'Anatomy', role: 'Course Lead', status: 'Active', load: '18 hrs/week', tone: 'teal' },
  { name: 'Dr. Rahul Mehta', department: 'Physiology', role: 'Module Coordinator', status: 'On Leave', load: '12 hrs/week', tone: 'purple' },
  { name: 'Prof. N. Iyer', department: 'Pathology', role: 'Exam Lead', status: 'Active', load: '22 hrs/week', tone: 'light' },
  { name: 'Dr. Sana Khan', department: 'Pharmacology', role: 'Assessment Reviewer', status: 'Active', load: '16 hrs/week', tone: 'teal' },
]

export default function FacultyManagementPage() {
  return (
    <DashboardShell>
      <section className="vx-card" style={{ marginBottom: 18 }}>
        <header className="vx-card-head">
          <div>
            <h3>Faculty Management</h3>
            <p>Track faculty allocation, workload, and academic responsibilities</p>
          </div>
          <button type="button" className="vx-dots" aria-label="More options">
            ...
          </button>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            padding: 18,
          }}
        >
          <div
            style={{
              padding: 16,
              border: '1px solid #e2e8f3',
              borderRadius: 16,
              background: '#f8faff',
            }}
          >
            <strong style={{ display: 'block', fontSize: '1.6rem', color: '#0162e8' }}>42</strong>
            <span style={{ color: '#64748b' }}>Active faculty members</span>
          </div>
          <div
            style={{
              padding: 16,
              border: '1px solid #e2e8f3',
              borderRadius: 16,
              background: '#f8faff',
            }}
          >
            <strong style={{ display: 'block', fontSize: '1.6rem', color: '#0f8b7c' }}>8</strong>
            <span style={{ color: '#64748b' }}>Departments covered</span>
          </div>
          <div
            style={{
              padding: 16,
              border: '1px solid #e2e8f3',
              borderRadius: 16,
              background: '#f8faff',
            }}
          >
            <strong style={{ display: 'block', fontSize: '1.6rem', color: '#6e44b8' }}>6</strong>
            <span style={{ color: '#64748b' }}>Pending approvals</span>
          </div>
        </div>
      </section>

      <section className="vx-card">
        <header className="vx-card-head">
          <div>
            <h3>Faculty Directory</h3>
            <p>Review department, role, and teaching load at a glance</p>
          </div>
          <button type="button" className="vx-btn vx-btn-primary">
            Add Faculty
          </button>
        </header>

        <div className="vx-table-wrap">
          <table className="vx-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Workload</th>
              </tr>
            </thead>
            <tbody>
              {facultyRows.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.department}</td>
                  <td>{row.role}</td>
                  <td>
                    <span className={`vx-tag vx-tag-${row.tone}`}>{row.status}</span>
                  </td>
                  <td>{row.load}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  )
}
