import { useMemo, useRef, useState } from 'react'
import { Search, UserPlus, Upload, Users, BadgeCheck, BookOpen, SlidersHorizontal, X } from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
import '../styles/medsy/question-sort-tokens.css'
import '../styles/ospe-activity.css'
import '../styles/my-skills.css'
import './LogbookPage.css'
import '../components/logbook/LogbookDashboard.css'
import '../components/logbook/LogbookPolish.css'
import '../components/logbook/LogbookReadability.css'
import './StudentManagementPage.css'

const studentDirectory = [
  { id: 'st-101', name: 'Aarav Nair', batch: 'Batch A', year: 'First Year', subject: 'Human Anatomy', status: 'Active' },
  { id: 'st-102', name: 'Diya Raman', batch: 'Batch A', year: 'First Year', subject: 'Human Anatomy', status: 'Active' },
  { id: 'st-103', name: 'Ishaan Kumar', batch: 'Batch B', year: 'Second Year', subject: 'Pathology', status: 'Review' },
  { id: 'st-104', name: 'Meera Joseph', batch: 'Batch C', year: 'Second Year', subject: 'Hematology', status: 'Inactive' },
]

/**
 * Student directory styled with the shared Logbook presentation primitives.
 * Search and cohort filters are local; onAlert uses the application's notice handler.
 * @param {{ onAlert?: (notice: { tone: string, message: string }) => void }} props
 */
export default function StudentManagementPage({ onAlert }) {
  const uploadInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [batchFilter, setBatchFilter] = useState('All Batches')
  const [yearFilter, setYearFilter] = useState('All Years')
  const [statusFilter, setStatusFilter] = useState('All Statuses')

  const hasActiveFilters = batchFilter !== 'All Batches' || yearFilter !== 'All Years' || statusFilter !== 'All Statuses'

  const visibleStudents = useMemo(() => (
    studentDirectory.filter((student) => {
      const matchesQuery = !query.trim()
        || student.name.toLowerCase().includes(query.trim().toLowerCase())
        || student.id.toLowerCase().includes(query.trim().toLowerCase())
        || student.subject.toLowerCase().includes(query.trim().toLowerCase())
      const matchesBatch = batchFilter === 'All Batches' || student.batch === batchFilter
      const matchesYear = yearFilter === 'All Years' || student.year === yearFilter
      const matchesStatus = statusFilter === 'All Statuses' || student.status === statusFilter
      return matchesQuery && matchesBatch && matchesYear && matchesStatus
    })
  ), [batchFilter, query, statusFilter, yearFilter])

  const clearFilters = () => {
    setBatchFilter('All Batches')
    setYearFilter('All Years')
    setStatusFilter('All Statuses')
  }

  return (
    <section className="vx-content ospe-page my-skills-page logbook-scope lb-page student-management-page">
      <div className="ospe-shell my-skills-shell lb-shell student-management-shell">
        <PageNavigationHeader items={['My Pages', 'Student Management']} />
        <header className="my-skills-overview lb-page-head student-management-header">
          <div className="my-skills-overview-main">
            <span className="ospe-kicker">Student administration</span>
            <div className="my-skills-overview-copy">
              <h1>Student Management</h1>
              <p>Search the student directory, review batches, and keep enrolment records organised.</p>
            </div>
          </div>
          <div className="my-skills-live-card lb-create-card student-management-action-card">
            <div className="my-skills-live-card-top"><span className="my-skills-live-indicator"><Users size={15} />Student directory</span></div>
            <div className="my-skills-live-card-body"><strong>Manage your student community</strong><p>Keep student details and cohort information together.</p></div>
          <div className="student-management-card-actions">
          <button
            type="button"
            className="tool-btn my-skills-live-card-cta lb-new-entry-btn"
            onClick={() => onAlert?.({ tone: 'primary', message: 'Add student flow can be connected next.' })}
          >
            <UserPlus size={16} strokeWidth={2.2} />
            Add Student
          </button>
          <button
            type="button"
            className="tool-btn my-skills-live-card-cta lb-new-entry-btn"
            onClick={() => uploadInputRef.current?.click()}
          >
            <Upload size={16} strokeWidth={2.2} />
            Upload
          </button>
          </div>
          <input
            ref={uploadInputRef}
            type="file"
            hidden
            aria-label="Choose student file"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) setSelectedFile(file)
              event.target.value = ''
            }}
          />
          {selectedFile && <p className="student-management-file-selection" role="status">Selected: {selectedFile.name}</p>}
          </div>
        </header>

        <section className="lb-summary-strip student-management-stats" aria-label="Student summary">
          <article className="lb-summary-item my-skills-metric-card is-assigned">
            <span className="my-skills-metric-card-icon"><Users size={18} strokeWidth={2} /></span>
            <span className="my-skills-metric-card-copy"><strong>{studentDirectory.length}</strong><span>Total students</span></span>
          </article>
          <article className="lb-summary-item my-skills-metric-card is-completed">
            <span className="my-skills-metric-card-icon"><BadgeCheck size={18} strokeWidth={2} /></span>
            <span className="my-skills-metric-card-copy"><strong>{studentDirectory.filter((student) => student.status === 'Active').length}</strong><span>Active students</span></span>
          </article>
          <article className="lb-summary-item my-skills-metric-card is-assigned">
            <span className="my-skills-metric-card-icon"><BookOpen size={18} strokeWidth={2} /></span>
            <span className="my-skills-metric-card-copy"><strong>{new Set(studentDirectory.map((student) => student.batch)).size}</strong><span>Batches</span></span>
          </article>
        </section>

        <section className="lb-card student-management-toolbar" aria-label="Search and filter students">
          <div className="student-management-toolbar-topbar">
            <label className="student-management-search" htmlFor="student-management-search">
              <Search size={16} strokeWidth={2} />
              <input
                id="student-management-search"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by student name, ID, or subject"
                aria-label="Search by student name, ID, or subject"
              />
            </label>

            <button
              type="button"
              className={`lb-btn student-management-filter-toggle ${showFilters || hasActiveFilters ? 'is-active' : ''}`}
              onClick={() => setShowFilters((current) => !current)}
              aria-expanded={showFilters}
              aria-controls="student-management-filter-panel"
            >
              <SlidersHorizontal size={16} strokeWidth={2} />
              Filters
            </button>
          </div>

          {showFilters ? (
            <div id="student-management-filter-panel" className="student-management-filter-panel">
              <div className="student-management-filter-header">
                <div>
                  <strong>Refine student view</strong>
                  <p>Use quick filters to narrow the directory without leaving the page.</p>
                </div>
              </div>

              <div className="student-management-filter-grid">
                <label className="lb-field">
                  <span>Batch</span>
                  <div className="student-management-select-wrap">
                    <select value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)}>
                      <option>All Batches</option>
                      <option>Batch A</option>
                      <option>Batch B</option>
                      <option>Batch C</option>
                    </select>
                  </div>
                </label>

                <label className="lb-field">
                  <span>Year</span>
                  <div className="student-management-select-wrap">
                    <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                      <option>All Years</option>
                      <option>First Year</option>
                      <option>Second Year</option>
                    </select>
                  </div>
                </label>

                <label className="lb-field">
                  <span>Status</span>
                  <div className="student-management-select-wrap">
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                      <option>All Statuses</option>
                      <option>Active</option>
                      <option>Review</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </label>
              </div>

              <div className="student-management-filter-footer">
                <div className="student-management-filter-chips" aria-live="polite">
                  {hasActiveFilters ? (
                    <>
                      {batchFilter !== 'All Batches' ? <span className="student-management-filter-chip">{batchFilter}</span> : null}
                      {yearFilter !== 'All Years' ? <span className="student-management-filter-chip">{yearFilter}</span> : null}
                      {statusFilter !== 'All Statuses' ? <span className="student-management-filter-chip">{statusFilter}</span> : null}
                    </>
                  ) : (
                    <span className="student-management-filter-hint">No filters applied</span>
                  )}
                </div>

                <div className="student-management-filter-actions">
                  {hasActiveFilters ? (
                    <button type="button" className="lb-btn student-management-filter-clear" onClick={clearFilters}>
                      <X size={14} strokeWidth={2.2} />
                      Clear
                    </button>
                  ) : null}
                  <button type="button" className="lb-btn lb-primary" onClick={() => setShowFilters(false)}>
                    Apply
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="lb-card student-management-table-card">
          <div className="student-management-table-head">
            <div>
              <h2>Student directory</h2>
              <p role="status">{visibleStudents.length} students matched your current view.</p>
            </div>
          </div>

          <div className="student-management-table-wrap" role="region" aria-label="Student directory" tabIndex={0}>
            <table className="student-management-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Batch</th>
                  <th>Year</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {!visibleStudents.length && <tr><td colSpan={5}><div className="lb-empty"><strong>No students found</strong><p>Try another name, ID, subject, or filter.</p><button type="button" className="lb-btn" onClick={() => { setQuery(''); clearFilters() }}>Reset search and filters</button></div></td></tr>}
                {visibleStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="student-management-student-cell">
                        <strong>{student.name}</strong>
                        <span>{student.id}</span>
                      </div>
                    </td>
                    <td>{student.batch}</td>
                    <td>{student.year}</td>
                    <td>{student.subject}</td>
                    <td>
                      <span className={`student-management-status is-${student.status.toLowerCase()}`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  )
}
