import LogbookStorageRecovery from '../components/logbook/LogbookStorageRecovery'
import { subjectWriteBlock } from '../services/logbookPolicy'
import { LogbookReaderContext } from '../services/logbookCommentRead'
import { useEffect, useState } from 'react'
import { BookOpen, LayoutDashboard, LoaderCircle, Plus, Search, UserRound } from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
import SubjectView from '../components/logbook/LogbookSubjectDetail'
import LogbookSubjects from '../components/logbook/LogbookSubjects'
import LogbookDashboard from '../components/logbook/LogbookDashboard'
import LogbookBoundary from '../components/logbook/LogbookBoundary'
import { closeLogbookDrawer } from '../components/logbook/closeLogbookDrawer'
import LogbookEntryForm from '../components/logbook/LogbookEntryForm'
import LogbookEntryDetail from '../components/logbook/LogbookEntryDetail'
import { ProfileView, SearchView } from '../components/logbook/LogbookViews'
import { listLogbookEntries, resetLogbook, STORAGE_KEY, today } from '../services/logbook'
import { getLogbookWorkflow } from '../services/adminLogbook'
import { matchesRemedial } from '../services/logbookPeople'
import { belongsTo } from '../services/adminLogbook'
import { SUBJECTS } from '../services/logbookSample'
import '../styles/medsy/question-sort-tokens.css'
import '../styles/ospe-activity.css'
import '../styles/my-skills.css'
import './LogbookPage.css'
import '../components/logbook/LogbookStatus.css'

const NAVIGATION = [
  { name: 'home', label: 'Dashboard', icon: LayoutDashboard },
  { name: 'subjects', label: 'Subjects', icon: BookOpen },
  { name: 'search', label: 'All entries', icon: Search },
]

import '../components/logbook/LogbookPolish.css'
import '../components/logbook/LogbookReadability.css'

/** Page orchestration; App owns route/history. Form and detail drafts live beside their UI.
 * @param {{route:{name:string,id?:string,status?:string}, onNavigate:Function, onBack:Function, onForward:Function, canBack:boolean, canForward:boolean, theme:string, identity:Object}} props
 */
function LogbookContent({ route: requestedRoute, onNavigate, onBack, onForward, canBack, canForward, theme, identity }) {
  const studentId = identity.id || identity.registerId
  const legacyStatus = { pending: 'Pending', draft: 'Draft', approved: 'Approved', faculty: 'Pending' }[requestedRoute.name]
  const route = legacyStatus ? { ...requestedRoute, name: 'search', status: legacyStatus } : ['home', 'search', 'subjects', 'subject', 'profile'].includes(requestedRoute.name) ? requestedRoute : { name: 'home' }
  const [entries, setEntries] = useState([])
  const [workflow, setWorkflow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(null)
  const [commentDrafts, setCommentDrafts] = useState({})
  const [resetting, setResetting] = useState(false)
  useEffect(() => {
    let active = true
    const refresh = async () => {
      try { const [rows, state] = await Promise.all([listLogbookEntries(), getLogbookWorkflow()]); if (active) { setEntries(rows.filter(entry => belongsTo(entry, studentId))); setWorkflow(state); setFailure('') } }
      catch (error) { if (active) setFailure(error.message) }
      finally { if (active) setLoading(false) }
    }
    const storage = (event) => { if (!event.key || event.key === STORAGE_KEY) void refresh() }
    void refresh()
    window.addEventListener('medsy-logbook-changed', refresh)
    window.addEventListener('storage', storage)
    return () => { active = false; window.removeEventListener('medsy-logbook-changed', refresh); window.removeEventListener('storage', storage) }
  }, [studentId])
  const selected = entries.find((entry) => entry.id === selectedId)
  const subject = SUBJECTS.find((item) => item.name === route.id)
  const title = route.name === 'profile' ? 'My profile' : route.name === 'subject' ? subject?.name || 'Subjects' : route.name === 'faculty' ? 'Faculty verification' : NAVIGATION.find((item) => item.name === route.name)?.label || 'Dashboard'
  const navigate = (name, id, status) => onNavigate({ name, id, ...(status !== undefined ? { status } : {}) })
  const newEntry = (subjectName = '', cat = '', skill) => {
    const reason = subjectWriteBlock(workflow, studentId, subjectName)
    if (reason) { setNotice(reason); return }
    setSelectedId(null)
    setForm({ mode: 'new', entry: { id: crypto.randomUUID(), studentId, subject: subjectName, cat, date: today(), status: 'Draft', faculty: '', values: skill ? { competency: skill.code, activity: skill.name } : {}, extra: {} } })
  }
  const edit = (entry) => { const reason = subjectWriteBlock(workflow, studentId, entry.subject); if (reason) { setNotice(reason); return } setSelectedId(null); setForm({ mode: 'edit', entry }) }
  const remedial = (entry) => {
    const reason = subjectWriteBlock(workflow, studentId, entry.subject)
    if (reason) { setNotice(reason); return }
    const child = entries.find(item => matchesRemedial(entry, item))
    if (child) { if (child.status === 'Draft') edit(child); else setSelectedId(child.id); return }
    setSelectedId(null)
    setForm({ mode: 'remedial', entry: { id: crypto.randomUUID(), studentId, subject: entry.subject, cat: entry.cat, date: today(), status: 'Draft', faculty: entry.faculty, linkedTo: entry.id, values: { competency: entry.values.competency || '', activity: entry.values.activity || '' }, extra: {} } })
  }
  const reset = async () => {
    setResetting(true)
    try { await resetLogbook(studentId); setCommentDrafts({}); setSelectedId(null); setNotice('Sample Logbook restored.') }
    catch (error) { setFailure(error.message) }
    finally { setResetting(false) }
  }
  return <section className={`vx-content ospe-page my-skills-page logbook-scope lb-page ${route.name !== 'home' ? 'lb-working-view' : ''}`} aria-label="Logbook">
    <div className="ospe-shell my-skills-shell lb-shell">
    <PageNavigationHeader items={route.name === 'home' ? ['My Pages', 'My logbook'] : ['My Pages', { label: 'My logbook', onClick: () => navigate('home') }, ...(route.name === 'subject' ? [{ label: 'Subjects', onClick: () => navigate('subjects') }] : []), title]} onBack={onBack} onForward={onForward} canBack={canBack} canForward={canForward} />
    <header className="my-skills-overview lb-page-head">
      <div className="my-skills-overview-main">
        <span className="ospe-kicker">My Skills</span>
        <div className="my-skills-overview-copy"><h1>Logbook</h1><p>Record your learning experiences, track competency progress, and follow up on faculty verification.</p></div>
    <nav className="lb-navigation" aria-label="Logbook views">{NAVIGATION.map(({ name, label, icon }) => { const NavIcon = icon; return <button key={name} className={`my-skills-filter-chip ${(route.name === name || (name === 'subjects' && route.name === 'subject')) ? 'is-active' : ''}`} aria-current={(route.name === name || (name === 'subjects' && route.name === 'subject')) ? 'page' : undefined} onClick={() => navigate(name)}><NavIcon size={15} />{label}</button> })}</nav>
      </div>
      <div className="my-skills-live-card lb-create-card">
        <div className="my-skills-live-card-top"><span className="my-skills-live-indicator"><BookOpen size={15} /> Your learning record</span><button type="button" className="lb-card-profile" aria-label="My profile" title="My profile" aria-current={route.name === 'profile' ? 'page' : undefined} onClick={() => navigate('profile')}><UserRound size={18} /></button></div>
        <div className="my-skills-live-card-body"><strong>Capture your next experience</strong><p>Add an activity, reflect on what you learned, and submit it for verification.</p></div>
        <button className="tool-btn my-skills-live-card-cta lb-new-entry-btn" disabled={loading || Boolean(failure) || Boolean(route.name === 'subject' && subjectWriteBlock(workflow, studentId, subject?.name))} onClick={() => newEntry(route.name === 'subject' ? subject?.name : '')}><Plus size={16} />Create New Logbook Entry</button>
      </div>
    </header>
    {notice && <div className="lb-alert" role="status">{notice}<button className="lb-btn" onClick={() => setNotice('')}>Dismiss</button></div>}
    {failure && <div className="lb-alert lb-error" role="alert">{failure}<LogbookStorageRecovery message={failure} /><button className="lb-btn" onClick={() => window.location.reload()}>Reload</button></div>}
    {loading ? <div className="lb-empty" role="status"><LoaderCircle size={25} className="lb-spin" /><p>Loading your Logbook…</p></div> : !failure && <div className="lb-content">
            {route.name === 'home' && <LogbookDashboard identity={identity} signoffs={Object.values(workflow?.signoffs || {}).filter(record => record.studentId === studentId)} onEdit={edit} onRemedial={remedial} entries={entries} onNavigate={navigate} onOpen={setSelectedId} onSubject={(id, approval) => onNavigate({ name: 'subject', id, approval: approval ? 'open' : '' })} />}
      {route.name === 'subjects' && <LogbookSubjects workflow={workflow} studentId={studentId} entries={entries} onSubject={(id) => navigate('subject', id)} />}
      {route.name === 'subject' && subject && <SubjectView workflow={workflow} onRemedial={remedial} view={route} onFilter={patch => onNavigate({ ...route, ...patch }, true)} theme={theme} key={subject.name} subject={subject} entries={entries} onOpen={setSelectedId} onNew={newEntry} studentId={studentId} onChanged={setNotice} />}
      {route.name === 'search' && <SearchView view={route} onFilter={patch => onNavigate({ ...route, ...patch }, true)} signoffs={Object.values(workflow?.signoffs || {}).filter(record => record.studentId === studentId)} onSubject={id => onNavigate({ name: 'subject', id, approval: 'open' })} entries={entries} onOpen={setSelectedId} initialStatus={route.status} />}
      {route.name === 'subject' && !subject && <div className="lb-card lb-empty"><p>This subject is unavailable.</p><button className="lb-btn" onClick={() => navigate('subjects')}>Browse subjects</button></div>}{route.name === 'profile' && <ProfileView entries={entries} identity={identity} onReset={reset} busy={resetting} />}
    </div>}
    </div>
    {form && <LogbookEntryForm key={form.entry.id} {...form} workflow={workflow} entries={entries} theme={theme} onClose={() => { void closeLogbookDrawer(() => setForm(null)) }} onSaved={(message) => { void closeLogbookDrawer(() => { setForm(null); setNotice(message) }) }} />}
    {selected && !form && <LogbookEntryDetail key={selected.id} entry={selected} workflow={workflow} entries={entries} theme={theme} role="learner" commentDraft={commentDrafts[selected.id] || ''} onCommentDraft={(text) => setCommentDrafts((current) => ({ ...current, [selected.id]: text }))} onClose={() => { void closeLogbookDrawer(() => setSelectedId(null)) }} onEdit={edit} onRemedial={remedial} onOpen={setSelectedId} onChanged={setNotice} />}
  </section>
}
export default function LogbookPage(props) { return <LogbookBoundary><LogbookReaderContext.Provider value={{ id: props.identity.id || props.identity.registerId, name: props.identity.name, role: 'learner' }}><LogbookContent {...props} /></LogbookReaderContext.Provider></LogbookBoundary> }
