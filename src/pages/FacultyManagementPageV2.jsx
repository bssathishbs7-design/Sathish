import { useState } from 'react'
import PageBreadcrumbs from '../components/PageBreadcrumbs'
import {
  Download,
  Eye,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UsersRound,
  UserPen,
  X,
} from 'lucide-react'

/**
 * FacultyManagementPageV2 Implementation Contract
 * Structure:
 * - Faculty directory page with search, table actions, and assignment detail flows.
 * Dependencies:
 * - React local state
 * - lucide-react icons
 * Props / Data:
 * - onAlert is used for shared completion and warning alerts
 * State:
 * - Owns search, filters, dialog visibility, and faculty selection state
 * Hooks / Providers:
 * - No context provider required with the current page-local interaction model
 * Required assets:
 * - Uses in-file faculty dataset and iconography only
 * Responsive behavior:
 * - Directory controls and row actions must remain usable on smaller screens through wrapping and stacking
 * Placement:
 * - Page-level management screen in src/pages/
 */
const facultyRows = [
  {
    id: 'FAC-001',
    name: 'Dr. Anika Sharma',
    designation: 'Professor',
    email: 'anika.sharma@medsy.edu',
    department: 'Anatomy',
    roles: ['Course Lead', 'Exam Coordinator'],
    status: 'Active',
    avatar: 'AS',
    assignment: {
      course: 'MBBS Phase I',
      department: 'Anatomy',
      yearSem: '1st Year - Sem 1',
      subjects: 'Anatomy, Histology',
      classSec: 'A / B',
      studentCount: 120,
      assignmentStatus: 'Assigned',
    },
  },
  {
    id: 'FAC-002',
    name: 'Dr. Rahul Mehta',
    designation: 'Associate Professor',
    email: 'rahul.mehta@medsy.edu',
    department: 'Physiology',
    roles: ['Module Coordinator'],
    status: 'Inactive',
    avatar: 'RM',
    assignment: {
      course: 'MBBS Phase II',
      department: 'Physiology',
      yearSem: '2nd Year - Sem 3',
      subjects: 'Systemic Physiology',
      classSec: 'C',
      studentCount: 96,
      assignmentStatus: 'Not Assigned',
    },
  },
  {
    id: 'FAC-003',
    name: 'Prof. N. Iyer',
    designation: 'Professor',
    email: 'niyer@medsy.edu',
    department: 'Pathology',
    roles: ['Exam Lead', 'Content Reviewer'],
    status: 'Active',
    avatar: 'NI',
    assignment: {
      course: 'MBBS Phase II',
      department: 'Pathology',
      yearSem: '2nd Year - Sem 4',
      subjects: 'General Pathology, Hematology',
      classSec: 'A / B',
      studentCount: 110,
      assignmentStatus: 'Assigned',
    },
  },
  {
    id: 'FAC-004',
    name: 'Dr. Sana Khan',
    designation: 'Assistant Professor',
    email: 'sana.khan@medsy.edu',
    department: 'Pharmacology',
    roles: ['Assessment Reviewer', 'Practical Lead'],
    status: 'Active',
    avatar: 'SK',
    assignment: {
      course: 'MBBS Phase III',
      department: 'Pharmacology',
      yearSem: '3rd Year - Sem 5',
      subjects: 'Autonomic Pharmacology, CNS Pharmacology',
      classSec: 'B',
      studentCount: 84,
      assignmentStatus: 'Assigned',
    },
  },
  {
    id: 'FAC-005',
    name: 'Dr. Meera Joseph',
    designation: 'Assistant Professor',
    email: 'meera.joseph@medsy.edu',
    department: 'Community Medicine',
    roles: ['Attendance Lead'],
    status: 'Not Assigned',
    avatar: 'MJ',
    assignment: {
      course: 'MBBS Phase I',
      department: 'Community Medicine',
      yearSem: '1st Year - Sem 2',
      subjects: 'Introductory Epidemiology',
      classSec: 'C',
      studentCount: 72,
      assignmentStatus: 'Pending Allocation',
    },
  },
  {
    id: 'FAC-006',
    name: 'Dr. Farhan Ali',
    designation: 'Senior Resident',
    email: 'farhan.ali@medsy.edu',
    department: 'Microbiology',
    roles: ['Lab Coordinator'],
    status: 'Active',
    avatar: 'FA',
    assignment: {
      course: 'MBBS Phase II',
      department: 'Microbiology',
      yearSem: '2nd Year - Sem 4',
      subjects: 'Bacteriology',
      classSec: 'A',
      studentCount: 104,
      assignmentStatus: 'Assigned',
    },
  },
]

const roleOptions = ['Course Lead', 'Exam Coordinator', 'Module Coordinator', 'Assessment Reviewer', 'Practical Lead', 'Content Reviewer', 'Attendance Lead', 'Lab Coordinator']
const designationOptions = ['Professor', 'Associate Professor', 'Assistant Professor', 'Tutor', 'Senior Resident']
const departmentOptions = ['Anatomy', 'Physiology', 'Pathology', 'Pharmacology', 'Community Medicine', 'Microbiology']
const createFacultyDraft = (nextId = 'FAC-007') => ({
  facultyId: nextId,
  name: '',
  designation: 'Assistant Professor',
  email: '',
  phone: '',
  department: 'Anatomy',
  status: 'Active',
})

const deriveAvatar = (name) => (
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'FA'
)

export default function FacultyManagementPageV2({ onAlert }) {
  const [facultyData, setFacultyData] = useState(facultyRows)
  const [designationFilter, setDesignationFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchFaculty, setSearchFaculty] = useState('')
  const [detailedView, setDetailedView] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [expandedFacultyId, setExpandedFacultyId] = useState(facultyRows[0]?.id ?? '')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingFacultyId, setEditingFacultyId] = useState(null)
  const [selectedRoles, setSelectedRoles] = useState(['Course Lead'])
  const [addForm, setAddForm] = useState(() => createFacultyDraft())

  const visibleRows = facultyData.filter((row) => {
    const matchesDesignation = !designationFilter || row.designation === designationFilter
    const matchesRole = !roleFilter || row.roles.includes(roleFilter)
    const matchesStatus = !statusFilter || row.status === statusFilter
    const needle = searchFaculty.trim().toLowerCase()
    const matchesSearch = !needle
      || row.id.toLowerCase().includes(needle)
      || row.name.toLowerCase().includes(needle)
      || row.designation.toLowerCase().includes(needle)
      || row.department.toLowerCase().includes(needle)
      || row.roles.some((role) => role.toLowerCase().includes(needle))

    return matchesDesignation && matchesRole && matchesStatus && matchesSearch
  })

  const perPage = 5
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / perPage))
  const pageRows = visibleRows.slice((currentPage - 1) * perPage, currentPage * perPage)
  const totalCount = facultyData.length
  const activeCount = facultyData.filter((row) => row.status === 'Active').length
  const inactiveCount = facultyData.filter((row) => row.status === 'Inactive').length
  const unassignedCount = facultyData.filter((row) => row.status === 'Not Assigned' || row.assignment.assignmentStatus !== 'Assigned').length
  const rowColumns = detailedView ? 9 : 6
  const nextFacultyId = `FAC-${String(facultyData.length + 1).padStart(3, '0')}`
  const modalTitle = editingFacultyId ? 'Edit Faculty' : 'Add Faculty'
  const modalDescription = editingFacultyId
    ? 'Update faculty identity, role mapping, and department assignment.'
    : 'Capture faculty identity, role mapping, and department assignment.'

  const resetAndSet = (setter) => (value) => {
    setter(value)
    setCurrentPage(1)
  }

  const toggleRole = (role) => {
    setSelectedRoles((current) => (
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role]
    ))
  }

  const toggleExpandedFaculty = (facultyId) => {
    setExpandedFacultyId((current) => (current === facultyId ? '' : facultyId))
  }

  const changePage = (nextPage) => {
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages))
  }

  const handleOpenAddFaculty = () => {
    setEditingFacultyId(null)
    setSelectedRoles(['Course Lead'])
    setAddForm(createFacultyDraft(nextFacultyId))
    setIsAddOpen(true)
  }

  const handleCloseModal = () => {
    setIsAddOpen(false)
    setEditingFacultyId(null)
    setSelectedRoles(['Course Lead'])
    setAddForm(createFacultyDraft(nextFacultyId))
  }

  const handleImportFaculty = () => {
    onAlert?.({ tone: 'primary', message: 'Faculty import will be connected to your source file flow next.' })
  }

  const handleViewFaculty = (facultyId) => {
    setExpandedFacultyId(facultyId)
    onAlert?.({ tone: 'primary', message: 'Faculty assignment details opened below.' })
  }

  const handleEditFaculty = (row) => {
    setEditingFacultyId(row.id)
    setSelectedRoles(row.roles)
    setAddForm({
      facultyId: row.id,
      name: row.name,
      designation: row.designation,
      email: row.email,
      phone: row.phone ?? '',
      department: row.department,
      status: row.status,
    })
    setIsAddOpen(true)
  }

  const handleDeleteFaculty = (facultyId) => {
    setFacultyData((current) => current.filter((row) => row.id !== facultyId))
    setExpandedFacultyId((current) => (current === facultyId ? '' : current))
    setCurrentPage(1)
    onAlert?.({ tone: 'danger', message: 'Faculty profile removed from the directory.' })
  }

  const handleSaveFaculty = () => {
    if (!addForm.name.trim() || !addForm.email.trim()) {
      onAlert?.({ tone: 'warning', message: 'Complete the faculty name and email before saving.' })
      return
    }

    const normalizedName = addForm.name.trim()
    const nextFacultyRecord = {
      id: editingFacultyId ?? addForm.facultyId.trim(),
      name: normalizedName,
      designation: addForm.designation,
      email: addForm.email.trim(),
      phone: addForm.phone.trim(),
      department: addForm.department,
      roles: selectedRoles.length ? selectedRoles : ['Course Lead'],
      status: addForm.status,
      avatar: deriveAvatar(normalizedName),
      assignment: {
        course: 'Pending course mapping',
        department: addForm.department,
        yearSem: 'To be assigned',
        subjects: 'Pending subject mapping',
        classSec: 'TBD',
        studentCount: 0,
        assignmentStatus: addForm.status === 'Not Assigned' ? 'Pending Allocation' : 'Assigned',
      },
    }

    setFacultyData((current) => (
      editingFacultyId
        ? current.map((row) => (row.id === editingFacultyId ? { ...row, ...nextFacultyRecord } : row))
        : [nextFacultyRecord, ...current]
    ))
    setExpandedFacultyId(nextFacultyRecord.id)
    handleCloseModal()
    onAlert?.({
      tone: 'secondary',
      message: editingFacultyId ? 'Faculty profile updated successfully.' : 'Faculty profile saved successfully.',
    })
  }

  return (
    <section className="vx-content faculty-management-page">
      <div className="faculty-page-shell">
        <PageBreadcrumbs items={[{ label: 'Faculty' }, { label: 'Faculty Management' }]} />
        <div className="vx-page-intro">
          <div className="vx-page-intro-title">
            <UsersRound size={18} strokeWidth={2} className="vx-page-intro-icon" aria-hidden="true" />
            <h1>Faculty Management</h1>
          </div>
        </div>
        <div className="faculty-page-hero">
          <div className="faculty-page-hero-copy">
            <p>Search faculty, review assignments, and manage department load from one clear directory.</p>
          </div>

          <div className="faculty-toolbar">
            <div className="faculty-toolbar-actions">
              <button type="button" className="faculty-utility-btn" onClick={handleImportFaculty}>
                <Download size={16} strokeWidth={2} />
                <span>Import</span>
              </button>
              <button type="button" className="tool-btn green" onClick={handleOpenAddFaculty}>
                <Plus size={16} strokeWidth={2} />
                Add Faculty
              </button>
            </div>
          </div>
        </div>

        <section className="faculty-filter-strip">
          <div className="faculty-filter-topbar">
            <label className="faculty-searchbox faculty-searchbox-inline">
              <Search size={16} strokeWidth={2} />
              <input
                type="search"
                value={searchFaculty}
                onChange={(event) => resetAndSet(setSearchFaculty)(event.target.value)}
                placeholder="Search by name, role, or employee ID"
              />
            </label>

            <button
              type="button"
              className={`faculty-utility-btn faculty-filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters((current) => !current)}
              aria-label={showFilters ? 'Hide filters' : 'Show filters'}
              title={showFilters ? 'Hide filters' : 'Show filters'}
            >
              <SlidersHorizontal size={16} strokeWidth={2} />
            </button>
          </div>

          {showFilters ? (
            <>
            <label className="forms-field">
              <span>Designation</span>
              <div className="forms-select-wrap">
                <select value={designationFilter} onChange={(event) => resetAndSet(setDesignationFilter)(event.target.value)}>
                  <option value="">All designations</option>
                  {designationOptions.map((designation) => (
                    <option key={designation} value={designation}>{designation}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="forms-field">
              <span>Roles</span>
              <div className="forms-select-wrap">
                <select value={roleFilter} onChange={(event) => resetAndSet(setRoleFilter)(event.target.value)}>
                  <option value="">All roles</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="forms-field">
              <span>Status</span>
              <div className="forms-select-wrap">
                <select value={statusFilter} onChange={(event) => resetAndSet(setStatusFilter)(event.target.value)}>
                  <option value="">All status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Not Assigned">Not Assigned</option>
                </select>
              </div>
            </label>
            </>
          ) : null}
        </section>

        <section className="faculty-stats-row">
          <div><span>Total Faculty</span><strong>{totalCount}</strong></div>
          <div><span>Active</span><strong>{activeCount}</strong></div>
          <div><span>Inactive</span><strong>{inactiveCount}</strong></div>
          <div><span>Unassigned</span><strong>{unassignedCount}</strong></div>
        </section>

        <section className="faculty-directory-card">
          <div className="faculty-directory-head">
            <div>
              <h2>Faculty Directory</h2>
              <p>Click any row to reveal class assignment details.</p>
            </div>
            <div className="faculty-page-meta">
              <span className="faculty-result-pill">{visibleRows.length} results</span>
              <button type="button" className="faculty-toggle" onClick={() => setDetailedView((current) => !current)}>
                {detailedView ? 'Compact View' : 'Detailed View'}
              </button>
            </div>
          </div>

          <div className="faculty-table-scroll">
            <table className="faculty-directory-table">
              <thead>
                <tr>
                  <th style={{ width: 34 }} />
                  <th>Name</th>
                  <th>Job Title</th>
                  <th>Department</th>
                  <th>Status</th>
                  {detailedView ? (
                    <>
                      <th>Course</th>
                      <th>Class / Sec</th>
                      <th>Student Count</th>
                    </>
                  ) : null}
                  <th style={{ width: 76 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => {
                  const isExpanded = expandedFacultyId === row.id
                  return [
                    <tr
                      key={`row-${row.id}`}
                      className={`faculty-directory-row ${isExpanded ? 'is-expanded' : ''}`}
                      onClick={() => toggleExpandedFaculty(row.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          toggleExpandedFaculty(row.id)
                        }
                      }}
                    >
                      <td>
                        <input type="checkbox" className="faculty-row-check" aria-label={`Select ${row.name}`} />
                      </td>
                      <td>
                        <div className="faculty-name-cell">
                          <div>
                            <strong>{row.name}</strong>
                            <span>{row.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>{row.designation}</td>
                      <td>{row.department}</td>
                      <td>
                        <span className={`faculty-status-chip ${row.status === 'Active' ? 'is-active' : row.status === 'Inactive' ? 'is-inactive' : 'is-alert'}`}>
                          {row.status}
                        </span>
                      </td>
                      {detailedView ? (
                        <>
                          <td>{row.assignment.course}</td>
                          <td>{row.assignment.classSec}</td>
                          <td>{row.assignment.studentCount}</td>
                        </>
                      ) : null}
                      <td onClick={(event) => event.stopPropagation()}>
                        <div className="faculty-action-set">
                          <button type="button" className="faculty-icon-btn has-tooltip" data-tooltip="View" onClick={() => handleViewFaculty(row.id)}>
                            <Eye size={16} strokeWidth={2} />
                          </button>
                          <button type="button" className="faculty-icon-btn has-tooltip" data-tooltip="Edit" onClick={() => handleEditFaculty(row)}>
                            <UserPen size={16} strokeWidth={2} />
                          </button>
                          <button type="button" className="faculty-icon-btn is-danger has-tooltip" data-tooltip="Delete" onClick={() => handleDeleteFaculty(row.id)}>
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>,
                    isExpanded ? (
                      <tr key={`details-${row.id}`} className="faculty-details-row">
                        <td colSpan={rowColumns}>
                          <div className="faculty-details-panel">
                            <div className="faculty-details-head">
                              <strong>Class Assignment Details</strong>
                              <span className={`faculty-assignment-status ${row.assignment.assignmentStatus === 'Assigned' ? 'is-active' : 'is-alert'}`}>
                                {row.assignment.assignmentStatus}
                              </span>
                            </div>

                            <div className="faculty-details-grid">
                              <div><span>Course</span><strong>{row.assignment.course}</strong></div>
                              <div><span>Department</span><strong>{row.assignment.department}</strong></div>
                              <div><span>Year-Sem</span><strong>{row.assignment.yearSem}</strong></div>
                              <div><span>Subjects</span><strong>{row.assignment.subjects}</strong></div>
                              <div><span>Class / Sec</span><strong>{row.assignment.classSec}</strong></div>
                              <div><span>Student Count</span><strong>{row.assignment.studentCount}</strong></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null,
                  ]
                })}
              </tbody>
            </table>
          </div>

          <div className="faculty-table-footer">
            <div className="faculty-page-size">
              <span>Show</span>
              <select value={perPage} disabled>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>from 200 data</span>
            </div>

            <div className="faculty-pagination">
              <button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={page === currentPage ? 'active' : ''}
                  onClick={() => changePage(page)}
                >
                  {page}
                </button>
              ))}
              <button type="button" onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </section>

        <div className={`faculty-modal-backdrop ${isAddOpen ? 'open' : ''}`} onClick={handleCloseModal} aria-hidden="true">
          <div className="faculty-modal" onClick={(event) => event.stopPropagation()}>
            <div className="faculty-modal-head">
              <div>
                <h3>{modalTitle}</h3>
                <p>{modalDescription}</p>
              </div>
              <button type="button" className="faculty-icon-btn" onClick={handleCloseModal} aria-label="Close add faculty">
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="faculty-modal-grid">
              <label className="forms-field">
                <span>Faculty ID</span>
                <input
                  type="text"
                  value={addForm.facultyId}
                  onChange={(event) => setAddForm((current) => ({ ...current, facultyId: event.target.value }))}
                />
              </label>
              <label className="forms-field">
                <span>Name</span>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(event) => setAddForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Enter faculty name"
                />
              </label>
              <label className="forms-field">
                <span>Designation</span>
                <div className="forms-select-wrap">
                  <select
                    value={addForm.designation}
                    onChange={(event) => setAddForm((current) => ({ ...current, designation: event.target.value }))}
                  >
                    {designationOptions.map((designation) => (
                      <option key={designation} value={designation}>{designation}</option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="forms-field">
                <span>Email</span>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(event) => setAddForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="name@medsy.edu"
                />
              </label>
              <label className="forms-field">
                <span>Phone Number</span>
                <div className="faculty-phone-field">
                  <span>+91</span>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={(event) => setAddForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="98765 43210"
                  />
                </div>
              </label>
              <label className="forms-field">
                <span>Department Mapping</span>
                <div className="forms-select-wrap">
                  <select
                    value={addForm.department}
                    onChange={(event) => setAddForm((current) => ({ ...current, department: event.target.value }))}
                  >
                    {departmentOptions.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="forms-field">
                <span>Status</span>
                <div className="forms-select-wrap">
                  <select
                    value={addForm.status}
                    onChange={(event) => setAddForm((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Not Assigned">Not Assigned</option>
                  </select>
                </div>
              </label>
              <label className="forms-field faculty-modal-full">
                <span>Roles Selection</span>
                <div className="faculty-role-picker">
                  {roleOptions.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`faculty-role-chip ${selectedRoles.includes(role) ? 'active' : ''}`}
                      onClick={() => toggleRole(role)}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="faculty-modal-actions">
              <button type="button" className="tool-btn green" onClick={handleSaveFaculty}>Save Faculty</button>
              <button type="button" className="ghost" onClick={handleCloseModal}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

