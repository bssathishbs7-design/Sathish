import { useMemo, useState } from 'react'
import { Search, UserPlus, Users, BadgeCheck, BookOpen, SlidersHorizontal, X, GraduationCap } from 'lucide-react'
import PageBreadcrumbs from '../components/PageBreadcrumbs'
import '../styles/student-management.css'

const studentDirectory = [
  { id: 'st-101', name: 'Aarav Nair', batch: 'Batch A', year: 'First Year', subject: 'Human Anatomy', status: 'Active' },
  { id: 'st-102', name: 'Diya Raman', batch: 'Batch A', year: 'First Year', subject: 'Human Anatomy', status: 'Active' },
  { id: 'st-103', name: 'Ishaan Kumar', batch: 'Batch B', year: 'Second Year', subject: 'Pathology', status: 'Review' },
  { id: 'st-104', name: 'Meera Joseph', batch: 'Batch C', year: 'Second Year', subject: 'Hematology', status: 'Inactive' },
]

export default function StudentManagementPage({ onAlert }) {
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
    <section className="vx-content student-management-page">
      <div className="student-management-shell">
        <PageBreadcrumbs items={[{ label: 'Admin' }, { label: 'Student Management' }]} />
        <div className="vx-page-intro">
          <div className="vx-page-intro-title">
            <GraduationCap size={18} strokeWidth={2} className="vx-page-intro-icon" aria-hidden="true" />
            <h1>Student Management</h1>
          </div>
        </div>

        <section className="student-management-hero">
          <div className="student-management-hero-copy">
            <span className="student-management-kicker">Student Management</span>
            <p>Search the student directory, review batch distribution, and keep enrollment records organized without leaving the workflow.</p>
          </div>
          <button
            type="button"
            className="tool-btn green"
            onClick={() => onAlert?.({ tone: 'primary', message: 'Add student flow can be connected next.' })}
          >
            <UserPlus size={16} strokeWidth={2.2} />
            Add Student
          </button>
        </section>

        <section className="student-management-stats">
          <article className="student-management-stat-card">
            <span><Users size={15} strokeWidth={2} /> Total Students</span>
            <strong>{studentDirectory.length}</strong>
          </article>
          <article className="student-management-stat-card">
            <span><BadgeCheck size={15} strokeWidth={2} /> Active</span>
            <strong>{studentDirectory.filter((student) => student.status === 'Active').length}</strong>
          </article>
          <article className="student-management-stat-card">
            <span><BookOpen size={15} strokeWidth={2} /> Batches</span>
            <strong>{new Set(studentDirectory.map((student) => student.batch)).size}</strong>
          </article>
        </section>

        <section className="student-management-toolbar">
          <div className="student-management-toolbar-topbar">
            <label className="student-management-search" htmlFor="student-management-search">
              <Search size={16} strokeWidth={2} />
              <input
                id="student-management-search"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by student name, ID, or subject"
              />
            </label>

            <button
              type="button"
              className={`student-management-filter-toggle ${showFilters || hasActiveFilters ? 'is-active' : ''}`}
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
                  <strong>Refine Student View</strong>
                  <p>Use quick filters to narrow the directory without leaving the page.</p>
                </div>
              </div>

              <div className="student-management-filter-grid">
                <label className="forms-field">
                  <span>Batch</span>
                  <div className="forms-select-wrap">
                    <select value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)}>
                      <option>All Batches</option>
                      <option>Batch A</option>
                      <option>Batch B</option>
                      <option>Batch C</option>
                    </select>
                  </div>
                </label>

                <label className="forms-field">
                  <span>Year</span>
                  <div className="forms-select-wrap">
                    <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                      <option>All Years</option>
                      <option>First Year</option>
                      <option>Second Year</option>
                    </select>
                  </div>
                </label>

                <label className="forms-field">
                  <span>Status</span>
                  <div className="forms-select-wrap">
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
                    <button type="button" className="student-management-filter-clear" onClick={clearFilters}>
                      <X size={14} strokeWidth={2.2} />
                      Clear
                    </button>
                  ) : null}
                  <button type="button" className="student-management-filter-done" onClick={() => setShowFilters(false)}>
                    Apply
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="student-management-table-card">
          <div className="student-management-table-head">
            <div>
              <h2>Student Directory</h2>
              <p>{visibleStudents.length} students matched your current view.</p>
            </div>
          </div>

          <div className="student-management-table-wrap">
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
