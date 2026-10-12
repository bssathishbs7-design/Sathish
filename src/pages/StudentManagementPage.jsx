import { createElement, useEffect, useMemo, useState } from 'react'
import { Search, UserPlus, Upload, Users, BadgeCheck, BookOpen, SlidersHorizontal, Plus, History, Layers, GraduationCap, ChevronRight, Trash2 } from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
import LogbookBoundary from '../components/logbook/LogbookBoundary'
import StudentEditor from '../components/students/StudentEditor'
import StudentImport from '../components/students/StudentImport'
import StudentRecord from '../components/students/StudentRecord'
import StudentDirectory from '../components/students/StudentDirectory'
import StudentHistory from '../components/students/StudentHistory'
import { DIRECTORY_KEY, DIRECTORY_EVENT, YEARS, getStudentDirectory, saveStudentCommand } from '../services/studentManagement'
import '../styles/medsy/question-sort-tokens.css'
import '../styles/ospe-activity.css'
import '../styles/my-skills.css'
import './LogbookPage.css'
import '../components/logbook/LogbookDashboard.css'
import './AdminLogbookPage.css'
import '../components/logbook/LogbookPolish.css'
import '../components/logbook/LogbookReadability.css'
import './StudentManagementPage.css'

/** Student workflow uses the Admin Logbook shell and a replaceable asynchronous service.
 * @param {{theme?:string,canEdit?:boolean}} props Permission must also be enforced by the backend.
 */
export default function StudentManagementPage(props) {
  return <LogbookBoundary title="Student management could not be displayed"><StudentManagementContent {...props} /></LogbookBoundary>
}

function StudentManagementContent({ theme, canEdit = true }) {
  const [data, setData] = useState(null), [error, setError] = useState(''), [notice, setNotice] = useState(''), [reload, setReload] = useState(0)
  const [view, setView] = useState('Directory'), [query, setQuery] = useState(''), [batch, setBatch] = useState(''), [year, setYear] = useState(''), [status, setStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false), [mode, setMode] = useState(null), [recordId, setRecordId] = useState(null), [selectionVersion, setSelectionVersion] = useState(0)
  useEffect(() => {
    let active = true
    const refresh = async () => { try { const next = await getStudentDirectory(); if (active) { setData(next); setError('') } } catch (failure) { if (active) setError(failure.message) } }
    const storage = event => { if (!event.key || event.key === DIRECTORY_KEY) void refresh() }
    void refresh(); window.addEventListener(DIRECTORY_EVENT, refresh); window.addEventListener('storage', storage)
    return () => { active = false; window.removeEventListener(DIRECTORY_EVENT, refresh); window.removeEventListener('storage', storage) }
  }, [reload])
  const rows = useMemo(() => (data?.students || []).filter(student => (!query.trim() || `${student.name} ${student.registrationId} ${student.email} ${student.subject}`.toLowerCase().includes(query.trim().toLowerCase())) && (!batch || student.batch === batch) && (!year || student.year === year) && (!status || student.status === status) && (view === 'Graduated' ? student.year === 'Graduated' : view === 'Needs setup' ? !student.tracked : true)).sort((a, b) => a.name.localeCompare(b.name)), [data, query, batch, year, status, view])
  const record = data?.students.find(student => student.id === recordId)
  const selectedBatch = data?.batches.find(item => item.id === batch)
  const clearFilters = () => { setQuery(''); setBatch(''); setYear(''); setStatus('') }
  const navigate = next => { setView(next); clearFilters() }
  const open = next => { setRecordId(null); setMode(next) }
  const save = async command => { const next = await saveStudentCommand(command, { canEdit }); setData(next); setSelectionVersion(value => value + 1); setNotice(command.type === 'import' ? `${command.rows.length} students imported.` : 'Changes saved.'); if (command.type === 'deleteBatch') { setBatch(''); setView('Batches') } }
  return <section className="vx-content ospe-page my-skills-page logbook-scope lb-page admin-logbook-page student-management-page">
    <div className="ospe-shell my-skills-shell lb-shell student-management-shell">
      <PageNavigationHeader items={['My Pages', 'Student Management']} />
      <header className="my-skills-overview lb-page-head admin-page-head student-management-header">
        <div className="my-skills-overview-main"><span className="ospe-kicker">Student administration</span><div className="my-skills-overview-copy"><h1>Student Management</h1><p>Manage enrolment, review batches and follow each student’s academic journey.</p></div></div>
        <div className="my-skills-live-card lb-create-card admin-action-card student-management-action-card"><div className="my-skills-live-card-top"><span className="my-skills-live-indicator"><Users size={15} />Student directory</span></div><div className="my-skills-live-card-body"><strong>Manage your student community</strong><p>{canEdit ? 'Add students individually or preview an Excel import.' : 'You have read-only access to student records.'}</p></div><div className="student-management-card-actions"><button className="tool-btn my-skills-live-card-cta lb-new-entry-btn" disabled={!canEdit || !data?.batches.length} onClick={() => open({ type: 'save', batch })}><UserPlus size={16} />Add student</button><button className="tool-btn my-skills-live-card-cta lb-new-entry-btn" disabled={!canEdit || !data?.batches.length} onClick={() => open({ type: 'import', batch })}><Upload size={16} />Upload</button></div></div>
      </header>
      {error && <div className="lb-alert sm-error" role="alert">{error}<button className="lb-btn" onClick={() => setReload(value => value + 1)}>Retry</button></div>}
      {notice && <div className="lb-alert sm-notice" role="status"><BadgeCheck size={18} /><span>{notice}</span><button className="lb-btn" onClick={() => setNotice('')}>Dismiss</button></div>}
      {!data ? !error && <div className="lb-card" role="status">Loading student records…</div> : <>
        <section className="lb-summary-strip student-management-stats" aria-label="Student summary">{[[Users, data.students.length, 'Total students'], [BadgeCheck, data.students.filter(student => student.status === 'Active').length, 'Active students'], [BookOpen, data.batches.length, 'Batches']].map(([MetricIcon, count, label]) => <article key={label} className="lb-summary-item my-skills-metric-card is-assigned"><span className="my-skills-metric-card-icon">{createElement(MetricIcon, { size: 18 })}</span><span className="my-skills-metric-card-copy"><strong>{count}</strong><span>{label}</span></span></article>)}</section>
        <nav className="lb-navigation admin-tabs" aria-label="Student management views">{[[Users, 'Directory'], [Layers, 'Batches'], [GraduationCap, 'Graduated'], [History, 'History'], [SlidersHorizontal, 'Needs setup']].map(([TabIcon, label]) => <button key={label} className={view === label ? 'is-active' : ''} aria-current={view === label ? 'page' : undefined} onClick={() => navigate(label)}>{createElement(TabIcon, { size: 16 })}{label}{label === 'Needs setup' && <span>{data.students.filter(student => !student.tracked).length}</span>}</button>)}</nav>
        {view === 'Batches' ? <section className="lb-card sm-batches"><div className="sm-section-head"><div><h2>Batches</h2><p>Select a batch to manage students by year.</p></div>{canEdit && <button className="lb-btn lb-primary" onClick={() => open({ type: 'batch' })}><Plus size={16} />Add batch</button>}</div><div className="admin-card-grid">{[...data.batches].sort((a, b) => b.id.localeCompare(a.id)).map(item => <button className="admin-tile" key={item.id} onClick={() => { setBatch(item.id); setView('Directory') }}><strong>Batch {item.id}</strong><small>{item.course} · {item.syllabus}</small><span>{data.students.filter(student => student.batch === item.id).length} students</span><ChevronRight size={18} /></button>)}</div>{!data.batches.length && <p>No batches yet. Add a batch before enrolling students.</p>}</section> : <>
          <section className="lb-card student-management-toolbar" aria-label="Search and filter students"><div className="student-management-toolbar-topbar"><label className="student-management-search"><Search size={16} /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, student ID, email or subject" aria-label="Search students" /></label><button className={`lb-btn student-management-filter-toggle ${showFilters ? 'is-active' : ''}`} onClick={() => setShowFilters(value => !value)} aria-expanded={showFilters} aria-controls="student-management-filter-panel"><SlidersHorizontal size={16} />Filters</button></div>
            {showFilters && <div id="student-management-filter-panel" className="student-management-filter-panel"><div className="student-management-filter-grid"><label className="lb-field"><span>Batch</span><select value={batch} onChange={event => setBatch(event.target.value)}><option value="">All batches</option>{data.batches.map(item => <option key={item.id} value={item.id}>Batch {item.id}</option>)}</select></label><label className="lb-field"><span>Year</span><select value={year} onChange={event => setYear(event.target.value)}><option value="">All years</option>{[...YEARS, 'Graduated'].map(item => <option key={item}>{item}</option>)}</select></label><label className="lb-field"><span>Status</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{['Active', 'Inactive', 'Graduated'].map(item => <option key={item}>{item}</option>)}</select></label></div><div className="sm-actions"><button className="lb-btn" onClick={clearFilters}>Clear filters</button><button className="lb-btn lb-primary" onClick={() => setShowFilters(false)}>Done</button></div></div>}
            {(batch || year || status) && <p className="sm-help">{[batch && `Batch ${batch}`, year, status].filter(Boolean).join(' · ')} <button className="lb-btn" onClick={clearFilters}>Clear</button></p>}
          </section>
          {selectedBatch && view !== 'History' && <section className="lb-card sm-batch-detail"><div className="sm-section-head"><div><h2>Batch {batch}</h2><p>{selectedBatch.course} · {selectedBatch.syllabus} · Started {selectedBatch.startsOn}</p></div>{canEdit && <div className="sm-actions"><button className="lb-btn" onClick={() => open({ type: 'syllabus', batch })}>Syllabus</button><button className="lb-btn" onClick={() => open({ type: 'deleteBatch', batch })}><Trash2 size={15} />Delete batch</button></div>}</div><div className="sm-actions" aria-label="Batch year filters">{['', ...YEARS, 'Graduated'].map(item => <button key={item} className={`lb-btn ${year === item ? 'lb-primary' : ''}`} aria-pressed={year === item} onClick={() => setYear(item)}>{item || 'All years'} <span className="sm-number">{data.students.filter(student => student.batch === batch && (!item || student.year === item)).length}</span></button>)}</div></section>}
          {view === 'History' ? <StudentHistory data={data} batch={batch} year={year} status={status} query={query} canEdit={canEdit} onOpen={setRecordId} onAction={open} /> : <>{view === 'Needs setup' && <p className="lb-alert">Open a student to complete year setup before promotion.</p>}<StudentDirectory key={[view, query, batch, year, status, selectionVersion].join('|')} rows={rows} canEdit={canEdit} onOpen={setRecordId} onAction={open} onClear={clearFilters} title={view === 'Directory' ? 'Student directory' : view === 'Graduated' ? 'Graduated students' : 'Students needing year setup'} /></>}
        </>}
      </>}
    </div>
    {mode && data && (mode.type === 'import' ? <StudentImport data={data} batch={mode.batch} theme={theme} onClose={() => setMode(null)} onSave={save} /> : <StudentEditor key={`${mode.type}-${mode.student?.id || ''}`} mode={mode} data={data} theme={theme} onClose={() => setMode(null)} onSave={save} />)}
    {record && <StudentRecord student={record} data={data} theme={theme} canEdit={canEdit} onClose={() => setRecordId(null)} onAction={open} />}
  </section>
}
