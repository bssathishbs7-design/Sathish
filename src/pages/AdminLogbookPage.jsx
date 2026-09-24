import { LogbookReaderContext } from '../services/logbookCommentRead'
import AdminStudentEntryGroups from '../components/logbook/AdminStudentEntryGroups'
import AdminLogbookStudentDetail from '../components/logbook/AdminLogbookStudentDetail'
import AdminLogbookQuickSearch from '../components/logbook/AdminLogbookQuickSearch'
import AdminLogbookCategoryDetail from '../components/logbook/AdminLogbookCategoryDetail'
import AdminLogbookDashboard from '../components/logbook/AdminLogbookDashboard'
import AdminLogbookSkills from '../components/logbook/AdminLogbookSkills'
import '../components/logbook/AdminLogbookQueue.css'
import AdminLogbookStudents from '../components/logbook/AdminLogbookStudents'
import { activityKey, categoryLabel } from '../services/logbookPresentation'
import { useEffect, useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Plus, Search, LayoutDashboard, Clock3, Users, Layers, CheckCircle2, FilePenLine, Undo2 } from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
import LogbookBoundary from '../components/logbook/LogbookBoundary'
import LogbookEntryDetail from '../components/logbook/LogbookEntryDetail'
import AdminLogbookRecords from '../components/logbook/AdminLogbookRecords'
import AdminLogbookHistory from '../components/logbook/AdminLogbookHistory'
import AdminLogbookSubjects from '../components/logbook/AdminLogbookSubjects'
import { AssignmentDrawer, ApprovalChain, SignoffList } from '../components/logbook/LogbookFacultyActions'
import { closeLogbookDrawer } from '../components/logbook/closeLogbookDrawer'
import { listLogbookEntries, STORAGE_KEY, today } from '../services/logbook'
import { cancelAssignment, changeSignoff, chainFor, getLogbookWorkflow, reviewEntries } from '../services/adminLogbook'
import { actionable, actorName, awaitingRemedial, belongsTo, isGraded, LEARNERS, learnerName, overdueEntry, visibleTo, waitingDays } from '../services/logbookPeople'
import { learnerSummary } from '../services/logbookProgress'
import { ADMIN_LOGBOOK_SECTIONS } from '../services/useAdminLogbookRoute'
import { SUBJECTS } from '../services/logbookSample'
import AdminLogbookCategories from '../components/logbook/AdminLogbookCategories'
import '../styles/medsy/question-sort-tokens.css'
import '../styles/ospe-activity.css'
import '../styles/my-skills.css'
import './LogbookPage.css'
import '../components/logbook/LogbookDashboard.css'
import '../components/logbook/LogbookStatus.css'
import './AdminLogbookPage.css'

/** The shell provides the account and URL state. All counts derive from shared records. */
function AdminLogbookContent({ theme, actor, view, onNavigate }) {
  const [entries, setEntries] = useState([]), [workflow, setWorkflow] = useState(null)
  const [selectedId, setSelectedId] = useState(null), [checked, setChecked] = useState([])
  const [assignment, setAssignment] = useState(null), [comments, setComments] = useState({})
  const [notice, setNotice] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [reload, setReload] = useState(0)
  const office = !actor.departments.length
  const sections = office ? ADMIN_LOGBOOK_SECTIONS.filter(name => ['Overview', 'Subjects', 'Sign-offs', 'Search'].includes(name)) : ADMIN_LOGBOOK_SECTIONS
  const section = sections.includes(view.section) ? view.section : 'Overview'
  const { id: drill, query = '', status = '', category = '', range = 'all', show = 'all', subject = '' } = view
  useEffect(() => {
    let active = true
    const refresh = async () => { try { const [rows, state] = await Promise.all([listLogbookEntries(), getLogbookWorkflow()]); if (active) { setEntries(rows); setWorkflow(state); setError('') } } catch (failure) { if (active) setError(failure.message) } finally { if (active) setLoading(false) } }
    const storage = event => { if (!event.key || event.key === STORAGE_KEY) void refresh() }
    void refresh(); window.addEventListener('medsy-logbook-changed', refresh); window.addEventListener('storage', storage)
    return () => { active = false; window.removeEventListener('medsy-logbook-changed', refresh); window.removeEventListener('storage', storage) }
  }, [reload])
  const navigate = (name, id = '', filters = {}) => { setChecked([]); onNavigate({ section: name, id, query: '', status: '', category: '', range: 'all', show: 'all', ...filters }) }
  const filter = patch => { setChecked([]); onNavigate({ ...view, ...patch }, true) }
  const run = async operation => { setBusy(true); setError(''); try { await operation(); setNotice('Changes saved.'); setChecked([]) } catch (failure) { setError(failure.message) } finally { setBusy(false) } }
  const visible = entries.filter(visibleTo)
  const department = office ? visible : visible.filter(entry => actor.departments.includes(entry.subject))
  const pending = visible.filter(entry => actionable(entry, actor)).sort((a, b) => (a.submittedAt || a.date).localeCompare(b.submittedAt || b.date))
  const selected = visible.find(entry => entry.id === selectedId)
  const signoffs = Object.values(workflow?.signoffs || {}).filter(record => actor.departments.includes(record.subject) || (record.chain || []).includes(actor.id))
  const mySignoffs = signoffs.filter(record => record.status === 'Submitted' && record.chain[record.step] === actor.id)
  const students = LEARNERS.map(student => ({ ...student, ...learnerSummary(student.id, entries, actor.departments) }))
  const outstanding = department.filter(entry => entry.faculty === actor.id && isGraded(entry) && awaitingRemedial(entry, entries))
  const tasks = department.filter(entry => entry.status === 'To do' && entry.assignment?.by === actor.id)
  const allHistory = visible.flatMap(entry => (entry.audit || []).filter(event => event.actor === actor.id && ['Approved', 'Returned'].includes(event.action)).map((event, index) => ({ entry, event, key: entry.id + index }))).sort((a, b) => b.event.at.localeCompare(a.event.at))
  const certifiedEvents = allHistory.filter(item => item.event.action === 'Approved' && isGraded(item.entry) && Date.now() - Date.parse(item.event.at) < 7 * 86400000)
  const certifiedWeek = certifiedEvents.length
  const history = show === 'certified' ? certifiedEvents : allHistory
  const searchIdle = section === 'Search' && !query.trim() && !status && !category && range === 'all' && show === 'all' && !subject
  let source = section === 'Queue' ? pending : ['Subjects', 'Search'].includes(section) ? visible : department
  if (drill) source = source.filter(entry => section === 'Students' ? belongsTo(entry, drill) : section === 'Subjects' ? entry.subject === drill : entry.cat === drill)
  const results = searchIdle ? [] : source.filter(entry => (!subject || entry.subject === subject) && (!status || entry.status === status) && (!category || entry.cat === category) && (range === 'all' || waitingDays(entry) <= Number(range)) && (show !== 'overdue' || overdueEntry(entry)) && (show !== 'remedial' || Boolean(entry.linkedTo)) && (show !== 'todo' || entry.status === 'To do') && (show !== 'assigned' || entry.assignment?.by === actor.id) && (show !== 'outstanding' || (entry.faculty === actor.id && isGraded(entry) && awaitingRemedial(entry, entries))) && query.toLowerCase().trim().split(/\s+/).every(term => [learnerName(entry.studentId), entry.studentId || 'MC2568', entry.subject, categoryLabel(entry.cat), actorName(entry.faculty), entry.status, ...Object.values(entry.values), entry.extra?.remarks, entry.extra?.facultyRemarks, ...(entry.extra?.comments || []).map(comment => comment.text)].join(' ').toLowerCase().includes(term))).sort((a, b) => section === 'Queue' ? (a.submittedAt || a.date).localeCompare(b.submittedAt || b.date) : (b.submittedAt || b.date).localeCompare(a.submittedAt || a.date))
  const eligible = results.filter(entry => actionable(entry, actor) && !isGraded(entry)).map(entry => entry.id)
  const selectedIds = checked.filter(id => eligible.includes(id))
  const cancel = entry => { if (entry.assignment?.by !== actor.id) return; if (window.confirm('Cancel this unsubmitted assignment?')) void run(() => cancelAssignment(entry.id, actor)) }
  const list = (rows, selectable = false) => <AdminLogbookRecords grouped={section === 'Queue'} rows={rows} actorId={actor.id} empty={searchIdle ? 'Search by student, registration, subject, activity or feedback.' : 'No entries in this view.'} onOpen={setSelectedId} eligible={selectable ? eligible : []} checked={selectedIds} onCheck={(id, value) => setChecked(value ? [...checked, id] : checked.filter(item => item !== id))} onCancel={rows.some(entry => entry.status === 'To do' && entry.assignment?.by === actor.id) ? cancel : undefined} />
  const filters = <div className="admin-filters"><label className="lb-search"><Search size={16} /><input type="search" aria-label="Search student entries" placeholder="Search student, registration, activity or feedback" value={query} onChange={event => filter({ query: event.target.value })} /></label>{!['Queue', 'Categories'].includes(section) && <span className="admin-filter-select"><select aria-label="Status" value={status} onChange={event => filter({ status: event.target.value })}><option value="">All statuses</option>{['To do', 'Pending', 'Approved', 'Returned'].map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span>}{section !== 'Categories' && <span className="admin-filter-select"><select aria-label="Category" value={category} onChange={event => filter({ category: event.target.value })}><option value="">All categories</option>{[...new Set(source.map(entry => entry.cat))].map(id => <option key={id} value={id}>{categoryLabel(id)}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span>}<span className="admin-filter-select"><select aria-label="Submitted date range" value={range} onChange={event => filter({ range: event.target.value })}><option value="all">Any time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select><ChevronDown size={16} aria-hidden="true" /></span>{section === 'Queue' && <span className="admin-filter-select"><select aria-label="Show queue" value={show} onChange={event => filter({ show: event.target.value })}><option value="all">Everything waiting</option><option value="overdue">Overdue</option><option value="remedial">Remedial re-attempts</option></select><ChevronDown size={16} aria-hidden="true" /></span>}<button className="lb-btn" onClick={() => filter({ query: '', status: '', category: '', subject: '', range: 'all', show: 'all' })}>Clear</button></div>
  const student = students.find(person => person.id === drill)
  const signoffProps = { actor, entries, theme, onChanged: setNotice, onOpenLogbook: (studentId, subject) => office ? navigate('Subjects', subject, { query: learnerName(studentId) }) : navigate('Students', studentId) }
  const metrics = office ? [
    ['Awaiting your signature', mySignoffs.length, FilePenLine, () => navigate('Sign-offs')],
    ['With other approvers', signoffs.filter(record => record.status === 'Submitted' && record.chain[record.step] !== actor.id).length, Clock3, () => navigate('Sign-offs')],
    ['Completed logbooks', signoffs.filter(record => record.status === 'Completed').length, CheckCircle2, () => navigate('Sign-offs')],
    ['Subjects', SUBJECTS.length, Layers, () => navigate('Subjects')],
  ] : [
    ['Waiting for you', pending.length, Clock3, () => navigate('Queue')],
    ['Overdue', pending.filter(overdueEntry).length, Clock3, () => navigate('Queue', '', { show: 'overdue' })],
    ['Awaiting remedial', outstanding.length, Undo2, () => navigate('Search', '', { status: 'Returned', show: 'outstanding' })],
    ['Certified this week', certifiedWeek, CheckCircle2, () => navigate('History', '', { show: 'certified' })],
    ['Awaiting your signature', mySignoffs.length, FilePenLine, () => navigate('Sign-offs')],
    ['Assigned to do', tasks.length, BookOpen, () => navigate('Search', '', { status: 'To do', show: 'assigned' })],
  ]
  return <section className="vx-content ospe-page my-skills-page logbook-scope lb-page admin-logbook-page"><div className="ospe-shell my-skills-shell lb-shell admin-logbook-shell">
    <PageNavigationHeader items={['My Pages', 'Admin Logbook', ...(section === 'Overview' ? [] : [section]), ...(drill ? [section === 'Students' ? learnerName(drill) : section === 'Categories' ? categoryLabel(drill) : drill] : [])]} />
    <header className="my-skills-overview lb-page-head admin-page-head"><div className="my-skills-overview-main"><span className="ospe-kicker">Faculty logbook</span><div className="my-skills-overview-copy"><h1>Admin Logbook</h1><p>{actor.name} | {actor.role === 'Faculty' ? actor.departments.join(' / ') : actor.role}</p><p>Review learning experiences and guide students towards completion.</p></div></div><div className="my-skills-live-card lb-create-card admin-action-card"><div className="my-skills-live-card-top"><span className="my-skills-live-indicator"><BookOpen size={15} />Faculty review</span></div><div className="my-skills-live-card-body"><strong>{office ? 'Complete final approvals' : 'Guide the next learning experience'}</strong><p>{office ? 'Review subject logbooks awaiting your signature.' : 'Assign an activity and support students through verification.'}</p></div><button className="tool-btn my-skills-live-card-cta lb-new-entry-btn" disabled={loading} onClick={() => office ? navigate('Sign-offs') : setAssignment({ studentId: section === 'Students' ? drill : '' })}><Plus size={16} />{office ? 'Review sign-offs' : 'Assign logbook entry'}</button></div></header>
    <nav className="lb-navigation admin-tabs" aria-label="Admin Logbook sections">{sections.filter(name => name !== 'Search').map(name => { const Icon = { Overview: LayoutDashboard, Queue: Clock3, Students: Users, Subjects: Layers, Categories: Layers, Skills: CheckCircle2, History: Clock3, 'Sign-offs': FilePenLine }[name]; return <button key={name} className={'my-skills-filter-chip' + (section === name ? ' is-active' : '')} aria-current={section === name ? 'page' : undefined} onFocus={event => event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })} onClick={() => navigate(name)}><Icon size={15} />{name === 'Overview' ? 'Dashboard' : name}{name === 'Queue' && <span className="admin-tab-count">{pending.length}</span>}</button> })}</nav>
    {notice && <div className="lb-alert" role="status">{notice}<button className="lb-btn" onClick={() => setNotice('')}>Dismiss</button></div>}{error && <div className="lb-alert lb-error" role="alert">{error}<button className="lb-btn" onClick={() => setReload(value => value + 1)}>Reload</button></div>}
    {loading ? <p role="status">Loading records...</p> : <>
      {section === 'Overview' && <div className="faculty-dashboard"><AdminLogbookQuickSearch entries={visible} onOpen={setSelectedId} onViewAll={filters => navigate('Search', '', filters)} /><div className="lb-summary-strip admin-logbook-metrics" data-count={metrics.length}>{metrics.map(([label, count, icon, go], index) => { const MetricIcon = icon; return <button key={label} className={'lb-summary-item my-skills-metric-card ' + (index < 2 ? 'is-assigned' : 'is-completed')} onClick={go}><span className="my-skills-metric-card-icon"><MetricIcon size={18} /></span><span className="my-skills-metric-card-copy"><strong>{count}</strong><span>{label}</span></span></button> })}</div><AdminLogbookDashboard entries={department} signoffs={signoffs} navigate={navigate} /><div className="admin-overview-grid"><section className="lb-card"><div className="lb-section-head"><h2>{office ? 'Awaiting your signature' : 'Longest waiting'}</h2><button className="lb-text-btn" onClick={() => navigate(office ? 'Sign-offs' : 'Queue')}>View all</button></div>{office ? <SignoffList {...signoffProps} records={mySignoffs} /> : list(pending.slice(0, 4))}</section>{!office && <section className="lb-card"><div className="lb-section-head"><h2>Students needing attention</h2><button className="lb-text-btn" onClick={() => navigate('Students', '', { show: 'risk' })}>View all</button></div>{!students.some(person => person.risk) && <p className="lb-empty">No students need follow-up.</p>}{students.filter(person => person.risk).slice(0, 5).map(person => <button className="admin-tile" key={person.id} onClick={() => navigate('Students', person.id)}><strong>{person.name}</strong><small>{person.met}/{person.required} category requirements met | {person.returned} returned</small><ChevronRight size={16} /></button>)}<p className="lb-muted">{tasks.filter(entry => entry.assignment?.due && entry.assignment.due < today()).length} assigned tasks past due</p></section>}</div></div>}
      {section === 'Students' && !drill && <AdminLogbookStudents students={students} query={query} show={show} onFilter={filter} onOpen={id => navigate('Students', id)} />}
      {section === 'Subjects' && !drill && <AdminLogbookSubjects entries={visible} onSubject={subject => navigate('Subjects', subject)} />}
      {section === 'Categories' && !drill && <AdminLogbookCategories entries={department} onCategory={category => navigate('Categories', category)} />}
      {drill && !['Categories', 'Students'].includes(section) && <button className="lb-btn admin-back" onClick={() => navigate(section)}>Back to {section.toLowerCase()}</button>}
      {section === 'Students' && student && <AdminLogbookStudentDetail student={student} subjects={actor.departments} workflow={workflow} busy={busy} onBack={() => navigate('Students')} onAssign={() => setAssignment({ studentId: student.id })} onReady={subject => run(() => changeSignoff({ studentId: student.id, subject, actor, action: 'ready' }))} renderSignoff={record => <SignoffList {...signoffProps} records={[record]} />} />}
      {section === 'Subjects' && drill && <section className="lb-card lb-stack"><h2>{drill}</h2><p className="lb-muted">{actor.departments.includes(drill) ? 'Your department. Only entries addressed to you can be reviewed.' : 'Read-only review. You can comment; the addressed faculty verifies entries.'}</p><div className="admin-progress-summary"><span>{source.filter(entry => entry.status !== 'To do').length} entries</span><span>{new Set(source.map(entry => entry.studentId || 'MC2568')).size} students</span><span>{source.filter(entry => entry.status === 'Pending').length} pending</span><span>{source.filter(entry => entry.status === 'Approved').length} approved</span></div>{workflow && (actor.departments.includes(drill) || office) && <ApprovalChain key={drill + chainFor(workflow, drill).join('-')} chain={chainFor(workflow, drill)} subject={drill} actor={actor} onChanged={setNotice} />}</section>}
      {(['Queue', 'Search'].includes(section) || (drill && ['Students', 'Subjects'].includes(section))) && <section className={'lb-card lb-stack' + (section === 'Queue' ? ' admin-review-queue' : section === 'Students' ? ' admin-student-entries' : '')}>{!['Queue', 'Students'].includes(section) && <h2>{section === 'Search' ? 'Search entries' : 'Entries'}</h2>}{section === 'Search' && subject && <p className="lb-muted">Subject: {subject}</p>}{show === 'outstanding' && <p className="lb-muted">Returned skills awaiting a submitted remedial attempt.</p>}{show === 'assigned' && <p className="lb-muted">Unsubmitted assignments created by you.</p>}{filters}{section !== 'Students' && <p className="lb-muted" aria-live="polite">{searchIdle ? 'Find entries across all subjects' : results.length + ' entries'}{section === 'Queue' ? ' awaiting review / Oldest first' : ''}</p>}
        {section === 'Queue' && eligible.length > 0 && <div className="lb-actions"><label><input type="checkbox" checked={selectedIds.length === eligible.length} onChange={event => setChecked(event.target.checked ? eligible : [])} /> Select eligible entries</label><button className="lb-btn lb-primary" disabled={busy || !selectedIds.length} onClick={() => { if (window.confirm('Approve ' + selectedIds.length + ' entries?')) void run(() => reviewEntries(selectedIds, actor, { status: 'Approved' })) }}>Approve selected ({selectedIds.length})</button><small>Skills are graded individually.</small></div>}
        {section === 'Queue' ? [...new Set(results.map(entry => entry.studentId || 'MC2568'))].map(id => { const rows = results.filter(entry => belongsTo(entry, id)); return <section className="admin-queue-group" key={id}><div className="admin-group-heading"><button className="lb-text-btn" onClick={() => navigate('Students', id)}><span className="admin-queue-avatar" aria-hidden="true">{learnerName(id).split(' ').map(part => part[0]).slice(0, 2).join('')}</span><strong>{learnerName(id)}</strong><span className="admin-queue-id">{id}</span></button><small>{rows.length} {rows.length === 1 ? 'entry' : 'entries'}</small></div>{list(rows, true)}</section> }) : section === 'Subjects' ? [...new Set(results.map(entry => entry.cat))].map(cat => <section key={cat}><h3>{categoryLabel(cat)}</h3>{[...new Set(results.filter(entry => entry.cat === cat).map(activityKey))].map(key => { const rows = results.filter(entry => activityKey(entry) === key); return <details key={key}><summary>{rows[0].values.activity || rows[0].values.topic || rows[0].values.diagnosis || categoryLabel(cat)} | {new Set(rows.map(entry => entry.studentId || 'MC2568')).size} students | {rows.filter(entry => entry.status === 'Approved').length} approved</summary>{list(rows)}</details> })}</section>) : section === 'Students' ? <AdminStudentEntryGroups rows={results} renderEntries={list} /> : list(results)}
        {['Queue', 'Students', 'Subjects'].includes(section) && !results.length && <p className="lb-empty">{query || category || status || show !== 'all' ? 'No entries match these filters.' : 'No entries in this view.'}</p>}
      </section>}
      {section === 'Categories' && drill && <AdminLogbookCategoryDetail category={drill} entries={source} results={results} status={status} filters={filters} onBack={() => navigate('Categories')} onStatus={value => filter({ status: value })} renderEntries={list} />}
      {section === 'Skills' && <AdminLogbookSkills subjects={actor.departments} department={department} entries={entries} onStudent={id => navigate('Students', id)} renderEntries={list} />}
      {section === 'History' && <AdminLogbookHistory history={history} certified={show === 'certified'} onShowAll={() => navigate('History')} onOpen={setSelectedId} />}
      {section === 'Sign-offs' && <><section className="lb-card lb-stack"><h2>Awaiting your signature</h2><SignoffList {...signoffProps} records={mySignoffs} /></section><section className="lb-card lb-stack"><h2>Other logbooks</h2><SignoffList {...signoffProps} records={signoffs.filter(record => !mySignoffs.includes(record))} /></section></>}
    </>}
    {assignment && <AssignmentDrawer {...assignment} actor={actor} theme={theme} onChanged={setNotice} onClose={() => { void closeLogbookDrawer(() => setAssignment(null)) }} />}
    {selected && <LogbookEntryDetail key={selected.id} entry={selected} entries={visible} theme={theme} role="faculty" actor={actor} commentDraft={comments[selected.id] || ''} onCommentDraft={text => setComments(current => ({ ...current, [selected.id]: text }))} onOpen={setSelectedId} onChanged={setNotice} onClose={() => { void closeLogbookDrawer(() => setSelectedId(null)) }} />}
  </div></section>
}
export default function AdminLogbookPage(props) { return <LogbookBoundary><LogbookReaderContext.Provider value={{ id: props.actor.id, name: props.actor.name, role: 'faculty' }}><AdminLogbookContent {...props} /></LogbookReaderContext.Provider></LogbookBoundary> }
