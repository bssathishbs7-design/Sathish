import { useState } from 'react'
import PageBreadcrumbs from '../components/PageBreadcrumbs'
import {
  assessmentYearOptions,
  assessmentSgtMap,
  dashboardActivityDirectory,
  dashboardStudentProfiles,
} from './skillAssessmentData'

/**
 * DashboardSummaryPage Implementation Contract
 * Structure:
 * - Read-only analytics and learner summary view with filters and student detail panels.
 * Dependencies:
 * - React local state
 * - Shared dashboard data from skillAssessmentData.js
 * Props / Data:
 * - onBackToAssessment returns users to the evaluation workflow
 * State:
 * - Owns local filter selections and current learner focus
 * Hooks / Providers:
 * - No additional provider required; data is currently file-backed and page-local
 * Required assets:
 * - Uses shared dashboard activity and student data models
 * Responsive behavior:
 * - Toolbar controls and summary cards should wrap before content becomes cramped
 * Placement:
 * - Page-level reporting screen in src/pages/
 */
function DashboardSummaryPage({ onBackToAssessment }) {
  const [yearFilter, setYearFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [sgtFilter, setSgtFilter] = useState('')
  const [activityFilter, setActivityFilter] = useState('')
  const [searchStudent, setSearchStudent] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(dashboardStudentProfiles[0]?.id ?? '')

  const visibleStudents = dashboardStudentProfiles.filter((student) => {
    const matchesYear = !yearFilter || student.year === yearFilter
    const matchesBatch = !batchFilter || student.batch === batchFilter
    const matchesSgt = !sgtFilter || student.sgt === sgtFilter
    const matchesActivity = !activityFilter || student.activity.competency === activityFilter
    const needle = searchStudent.trim().toLowerCase()
    const matchesSearch = !needle
      || student.name.toLowerCase().includes(needle)
      || student.id.toLowerCase().includes(needle)

    return matchesYear && matchesBatch && matchesSgt && matchesActivity && matchesSearch
  })

  const selectedStudent = dashboardStudentProfiles.find((student) => student.id === selectedStudentId)
    ?? visibleStudents[0]
    ?? dashboardStudentProfiles[0]
  const cognitiveBars = [
    { label: 'Remembering', value: selectedStudent?.cognitive ?? 0 },
    { label: 'Understanding', value: Math.max((selectedStudent?.cognitive ?? 0) - 8, 0) },
    { label: 'Applying', value: Math.max((selectedStudent?.cognitive ?? 0) - 14, 0) },
    { label: 'Evaluating', value: Math.max((selectedStudent?.cognitive ?? 0) - 22, 0) },
  ]
  const recentCourses = visibleStudents.slice(0, 4).map((student, index) => ({
    student,
    progress: [60, 50, 100, 35][index] ?? 60,
    status: index % 3 === 0 ? 'Ongoing' : index % 3 === 1 ? 'Completed' : 'Pending',
    score: [78, 72, 90, 64][index] ?? 70,
    hours: [15, 20, 18, 19][index] ?? 16,
  }))

  return (
    <section className="vx-content forms-page dashboard-summary-page">
      <div className="dashboard-summary-shell">
        <PageBreadcrumbs items={[{ label: 'Evaluation' }, { label: 'Dashboard Summary' }]} />
        <div className="dashboard-summary-hero">
          <div className="dashboard-summary-hero-copy">
            <h1>Dashboard Summary</h1>
            <p>
              Filter the student directory, open a learner, and review a clean progress snapshot
              before drilling into details.
            </p>
          </div>

          <div className="dashboard-summary-hero-actions">
            <button type="button" className="ghost" onClick={onBackToAssessment}>
              Back to Assessment
            </button>
          </div>
        </div>

        <section className="vx-card dashboard-summary-toolbar">
          <label className="forms-field">
            <span>Year</span>
            <div className="forms-select-wrap">
              <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                <option value="">All years</option>
                {assessmentYearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </label>

          <label className="forms-field">
            <span>Class / Batch</span>
            <div className="forms-select-wrap">
              <select value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)}>
                <option value="">All batches</option>
                {['Batch A', 'Batch B', 'Batch C'].map((batch) => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>
          </label>

          <label className="forms-field">
            <span>SGT</span>
            <div className="forms-select-wrap">
              <select value={sgtFilter} onChange={(event) => setSgtFilter(event.target.value)}>
                <option value="">All groups</option>
                {(assessmentSgtMap[yearFilter] ?? Object.values(assessmentSgtMap).flat()).map((sgt) => (
                  <option key={sgt} value={sgt}>{sgt}</option>
                ))}
              </select>
            </div>
          </label>

          <label className="forms-field">
            <span>Activity</span>
            <div className="forms-select-wrap">
              <select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)}>
                <option value="">All activities</option>
                {dashboardActivityDirectory.map((activity) => (
                  <option key={activity.competency} value={activity.competency}>
                    {activity.competency} - {activity.title}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="forms-field forms-field-full dashboard-summary-search">
            <span>Search Student</span>
            <div className="tool-input">
              <input
                type="search"
                value={searchStudent}
                onChange={(event) => setSearchStudent(event.target.value)}
                placeholder="Search student name or register number"
              />
            </div>
          </label>
        </section>

        <div className="dashboard-summary-top-grid">
          <section className="vx-card dashboard-summary-card dashboard-summary-activity-card">
            <div className="dashboard-summary-section-head">
              <div>
                <h2>Learning Activity</h2>
                <p>{selectedStudent?.name ?? 'Select a student'} - {selectedStudent?.year ?? 'No year selected'}</p>
              </div>
              <button type="button" className="ghost dashboard-summary-mini-btn" onClick={onBackToAssessment}>
                View Assessment
              </button>
            </div>

            <div className="dashboard-summary-activity-stats">
              <div>
                <span>Total DOAP</span>
                <strong>{selectedStudent?.totalDoap ?? 0}</strong>
              </div>
              <div>
                <span>Pending</span>
                <strong>{selectedStudent?.pending ?? 0}</strong>
              </div>
              <div>
                <span>Complete</span>
                <strong>{selectedStudent?.complete ?? 0}</strong>
              </div>
            </div>

            <div className="dashboard-summary-mini-chart">
              {cognitiveBars.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <div className="dashboard-summary-bar-track">
                    <div className="dashboard-summary-bar-fill" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="vx-card dashboard-summary-card dashboard-summary-performance-card">
            <div className="dashboard-summary-section-head">
              <div>
                <h2>Performance</h2>
                <p>Focus view for the selected learner</p>
              </div>
              <span className="skill-assessment-panel-pill is-live">Last 6 months</span>
            </div>

            <div className="dashboard-summary-performance-wrap">
              <div className="dashboard-summary-radial" style={{
                background: `conic-gradient(#0f8364 0 ${selectedStudent?.affective ?? 0}%, #d9e8df ${selectedStudent?.affective ?? 0}% 100%)`,
              }}>
                <div>
                  <strong>{selectedStudent?.affective ?? 0}%</strong>
                  <span>Total score</span>
                </div>
              </div>

              <div className="dashboard-summary-performance-legend">
                <div><span className="dot dot-green" />Participation <strong>55%</strong></div>
                <div><span className="dot dot-gold" />Class quiz <strong>15%</strong></div>
                <div><span className="dot dot-sky" />Exam <strong>20%</strong></div>
                <div><span className="dot dot-red" />Absent <strong>10%</strong></div>
              </div>
            </div>

            <div className="dashboard-summary-performance-note">
              Success grows with steady weekly effort. Keep pushing forward.
            </div>
          </section>
        </div>

        <section className="vx-card dashboard-summary-roster-card">
          <div className="dashboard-summary-section-head">
            <div>
              <h2>Enrolled Students</h2>
              <p>Search, filter, and open any student from the list below.</p>
            </div>
            <span className="dashboard-summary-roster-pill">{visibleStudents.length} students</span>
          </div>

          <div className="dashboard-summary-roster-head">
            <span>Student</span>
            <span>Course</span>
            <span>Status</span>
            <span>Score</span>
            <span>Action</span>
          </div>

          <div className="dashboard-summary-roster-list">
            {recentCourses.length ? recentCourses.map(({ student, status, score, hours }) => (
              <article
                key={student.id}
                className={`dashboard-summary-roster-row ${student.id === selectedStudent?.id ? 'is-active' : ''}`}
                onClick={() => setSelectedStudentId(student.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedStudentId(student.id)
                  }
                }}
              >
                <span className="dashboard-summary-roster-student">
                  <strong>{student.name}</strong>
                  <span>{student.id}</span>
                </span>
                <span className="dashboard-summary-roster-course">
                  <strong>{student.activity.title}</strong>
                  <span>{student.year} • {student.sgt}</span>
                </span>
                <span className="dashboard-summary-roster-status">
                  <span className={`dashboard-summary-status ${status === 'Completed' ? 'is-cert' : status === 'Ongoing' ? 'is-remedial' : 'is-repeat'}`}>
                    {status}
                  </span>
                </span>
                <span className="dashboard-summary-roster-score">
                  <strong>{score}</strong>
                  <span>{hours} hrs</span>
                </span>
                <span className="dashboard-summary-roster-action">
                  <button
                    type="button"
                    className="dashboard-summary-info-btn"
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedStudentId(student.id)
                      onBackToAssessment()
                    }}
                  >
                    Open
                  </button>
                </span>
              </article>
            )) : (
              <div className="dashboard-summary-empty-state">
                <strong>No students match these filters.</strong>
                <p>Try adjusting the top filters or clearing the search field.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}


export default DashboardSummaryPage

