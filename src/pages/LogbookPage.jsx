import { useEffect, useState } from 'react'
import { BookOpen, Clock3, LayoutDashboard, LoaderCircle, Plus, Search, UserRound } from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
import LogbookSubjects from '../components/logbook/LogbookSubjects'
import LogbookDashboard from '../components/logbook/LogbookDashboard'
import LogbookBoundary from '../components/logbook/LogbookBoundary'
import LogbookEntryForm from '../components/logbook/LogbookEntryForm'
import LogbookEntryDetail from '../components/logbook/LogbookEntryDetail'
import { EntryList, PendingView, ProfileView, SearchView, SubjectView } from '../components/logbook/LogbookViews'
import { listLogbookEntries, resetLogbook, STORAGE_KEY, today } from '../services/logbook'
import { SUBJECTS } from '../services/logbookSample'
import '../styles/medsy/question-sort-tokens.css'
import '../styles/ospe-activity.css'
import '../styles/my-skills.css'
import './LogbookPage.css'

const NAVIGATION = [
  { name: 'home', label: 'Overview', icon: LayoutDashboard },
  { name: 'subjects', label: 'Subjects', icon: BookOpen },
  { name: 'pending', label: 'Pending', icon: Clock3 },
  { name: 'search', label: 'Search', icon: Search },
]

/** Page orchestration; App owns route/history. Form and detail drafts live beside their UI.
 * @param {{route:{name:string,id?:string,status?:string}, onNavigate:Function, onBack:Function, onForward:Function, canBack:boolean, canForward:boolean, theme:string, identity:Object}} props
 */
function LogbookContent({ route, onNavigate, onBack, onForward, canBack, canForward, theme, identity }) {
  const [entries, setEntries] = useState([])
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
      try { const rows = await listLogbookEntries(); if (active) { setEntries(rows); setFailure('') } }
      catch (error) { if (active) setFailure(error.message) }
      finally { if (active) setLoading(false) }
    }
    const storage = (event) => { if (!event.key || event.key === STORAGE_KEY) void refresh() }
    void refresh()
    window.addEventListener('medsy-logbook-changed', refresh)
    window.addEventListener('storage', storage)
    return () => { active = false; window.removeEventListener('medsy-logbook-changed', refresh); window.removeEventListener('storage', storage) }
  }, [])
  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 4500)
    return () => window.clearTimeout(timer)
  }, [notice])
  const selected = entries.find((entry) => entry.id === selectedId)
  const subject = SUBJECTS.find((item) => item.name === route.id)
  const title = route.name === 'profile' ? 'My profile' : route.name === 'subject' ? subject?.name || 'Subjects' : route.name === 'faculty' ? 'Faculty verification' : NAVIGATION.find((item) => item.name === route.name)?.label || 'Overview'
  const navigate = (name, id, status) => onNavigate({ name, id, status })
  const newEntry = (subjectName = '', cat = '', skill) => {
    setSelectedId(null)
    setForm({ mode: 'new', entry: { id: crypto.randomUUID(), subject: subjectName, cat, date: today(), status: 'Draft', faculty: '', values: skill ? { competency: skill.code, activity: skill.name } : {}, extra: {} } })
  }
  const edit = (entry) => { setSelectedId(null); setForm({ mode: 'edit', entry }) }
  const remedial = (entry) => {
    setSelectedId(null)
    setForm({ mode: 'remedial', entry: { id: crypto.randomUUID(), subject: entry.subject, cat: entry.cat, date: today(), status: 'Draft', faculty: entry.faculty, linkedTo: entry.id, values: { competency: entry.values.competency || '', activity: entry.values.activity || '' }, extra: {} } })
  }
  const reset = async () => {
    setResetting(true)
    try { await resetLogbook(); setCommentDrafts({}); setSelectedId(null); setNotice('Sample Logbook restored.') }
    catch (error) { setFailure(error.message) }
    finally { setResetting(false) }
  }
  return <section className="vx-content ospe-page my-skills-page logbook-scope lb-page" aria-label="Logbook">
    <div className="ospe-shell my-skills-shell lb-shell">
    <PageNavigationHeader items={route.name === 'home' ? ['My Pages', 'Logbook'] : ['My Pages', 'Logbook', title]} onBack={onBack} onForward={onForward} canBack={canBack} canForward={canForward} />
    <header className="my-skills-overview lb-page-head">
      <div className="my-skills-overview-main">
        <span className="ospe-kicker">My Skills</span>
        <div className="my-skills-overview-copy"><h1>Logbook</h1><p>Record your learning experiences, track competency progress, and follow up on faculty verification.</p></div>
        <div className="my-skills-overview-inline">
          <span><strong>{entries.length}</strong> Entries</span>
          <span><strong>{entries.filter((entry) => entry.status === 'Pending').length}</strong> Pending</span>
          <span><strong>{entries.filter((entry) => entry.status === 'Approved').length}</strong> Approved</span>
        </div>
      </div>
      <div className="my-skills-live-card lb-create-card">
        <div className="my-skills-live-card-top"><span className="my-skills-live-indicator"><BookOpen size={15} /> Your learning record</span><button type="button" className="lb-card-profile" aria-label="My profile" title="My profile" aria-current={route.name === 'profile' ? 'page' : undefined} onClick={() => navigate('profile')}><UserRound size={18} /></button></div>
        <div className="my-skills-live-card-body"><strong>Capture your next experience</strong><p>Add an activity, reflect on what you learned, and submit it for verification.</p></div>
        <button className="tool-btn my-skills-live-card-cta lb-new-entry-btn" disabled={loading || Boolean(failure)} onClick={() => newEntry(route.name === 'subject' ? subject?.name : '')}><Plus size={16} />New entry</button>
      </div>
    </header>
    <nav className="my-skills-toolbar lb-navigation" aria-label="Logbook views">{NAVIGATION.map(({ name, label, icon }) => { const NavIcon = icon; return <button key={name} className={`my-skills-filter-chip ${(route.name === name || (name === 'subjects' && route.name === 'subject')) ? 'is-active' : ''}`} aria-current={(route.name === name || (name === 'subjects' && route.name === 'subject')) ? 'page' : undefined} onClick={() => navigate(name)}><NavIcon size={15} />{label}{name === 'pending' && <span>{entries.filter((entry) => entry.status === 'Pending').length}</span>}</button> })}</nav>
    {notice && <div className="lb-toast" role="status">{notice}</div>}
    {failure && <div className="lb-alert lb-error" role="alert">{failure}<button className="lb-btn" onClick={() => window.location.reload()}>Reload</button></div>}
    {loading ? <div className="lb-empty" role="status"><LoaderCircle size={25} className="lb-spin" /><p>Loading your Logbook…</p></div> : !failure && <div className="lb-content">
      {route.name === 'home' && <LogbookDashboard onEdit={edit} onRemedial={remedial} entries={entries} onNavigate={navigate} onOpen={setSelectedId} onSubject={(id) => navigate('subject', id)} />}
      {route.name === 'subjects' && <LogbookSubjects entries={entries} onSubject={(id) => navigate('subject', id)} />}
      {route.name === 'subject' && subject && <SubjectView key={subject.name} subject={subject} entries={entries} onOpen={setSelectedId} onNew={newEntry} />}
      {route.name === 'pending' && <PendingView entries={entries} onOpen={setSelectedId} />}
      {route.name === 'search' && <SearchView key={route.status || 'all'} entries={entries} onOpen={setSelectedId} initialStatus={route.status} />}
      {route.name === 'profile' && <ProfileView entries={entries} identity={identity} onReset={reset} busy={resetting} />}
      {route.name === 'faculty' && <section className="lb-card"><div className="lb-section-head"><h2>Logbook verification</h2><span className="lb-sample">Faculty demo</span></div><p className="lb-muted">Review submitted entries, provide feedback and approve or return an attempt.</p><EntryList entries={entries.filter((entry) => entry.status === 'Pending')} onOpen={setSelectedId} empty="No Logbook entries awaiting verification." /></section>}
    </div>}
    </div>
    {form && <LogbookEntryForm key={form.entry.id} {...form} entries={entries} theme={theme} onClose={() => setForm(null)} onSaved={(message) => { setForm(null); setNotice(message) }} />}
    {selected && !form && <LogbookEntryDetail key={selected.id} entry={selected} entries={entries} theme={theme} role={route.name === 'faculty' ? 'faculty' : 'learner'} commentDraft={commentDrafts[selected.id] || ''} onCommentDraft={(text) => setCommentDrafts((current) => ({ ...current, [selected.id]: text }))} onClose={() => setSelectedId(null)} onEdit={edit} onRemedial={remedial} onOpen={setSelectedId} onChanged={setNotice} />}
  </section>
}
export default function LogbookPage(props) { return <LogbookBoundary><LogbookContent {...props} /></LogbookBoundary> }
