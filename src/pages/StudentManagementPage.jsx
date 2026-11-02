import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, History, UserPlus, Upload, ChevronDown } from 'lucide-react'
import FeedbackToast from '../components/FeedbackToast'
import PageNavigationHeader from '../components/PageNavigationHeader'
import LogbookBoundary from '../components/logbook/LogbookBoundary'
import StudentEditor from '../components/students/StudentEditor'
import StudentImport from '../components/students/StudentImport'
import StudentRecord from '../components/students/StudentRecord'
import StudentDirectory from '../components/students/StudentDirectory'
import StudentRosterFilters from '../components/students/StudentRosterFilters'
import StudentHistory from '../components/students/StudentHistory'
import StudentManagementHeader from '../components/students/StudentManagementHeader'
import StudentBatchCalendar from '../components/students/StudentBatchCalendar'
import StudentCalendarDialog from '../components/students/StudentCalendarDialog'
import StudentClosingNotice from '../components/students/StudentClosingNotice'
import { STUDY_YEARS, studying, runningYear, studentProgress, isLeftOver, calendarLabel } from '../services/studentCalendar'
import { today, canUndo } from '../services/studentModel'
import StudentSearch from '../components/students/StudentSearch'
import StudentSubjects from '../components/students/StudentSubjects'
import { DIRECTORY_KEY, DIRECTORY_EVENT, getStudentDirectory, saveStudentCommand, deleteStudents } from '../services/studentManagement'
import '../styles/medsy/question-sort-tokens.css'
import '../styles/ospe-activity.css'
import '../styles/my-skills.css'
import './LogbookPage.css'
import '../components/logbook/LogbookDashboard.css'
import './AdminLogbookPage.css'
import '../components/logbook/LogbookPolish.css'
import '../components/logbook/LogbookReadability.css'
import './StudentManagementPage.css'
import './StudentManagementWorkspace.css'
import './StudentBatchWorkspace.css'


/** History owns workspace navigation. All writes are revalidated by the directory adapter. */
export default function StudentManagementPage(props) { return <LogbookBoundary title="Student management could not be displayed"><StudentManagementContent {...props} /></LogbookBoundary> }
function StudentManagementContent({ theme, canEdit = false, recordId, onOpenRecord, onCloseRecord, onNavigateWorkspace }) {
  const [data, setData] = useState(null), [error, setError] = useState(''), [notice, setNotice] = useState(null), [mode, setMode] = useState(null), [revision, setRevision] = useState(0)
  const [studentSearchTarget, setStudentSearchTarget] = useState(null)
  const [workspace, setWorkspace] = useState(() => ({ view:'batches', batchId:'', year:'All', progress:'On Track', show:'all', ...window.history.state?.studentWorkspace }))
  const rosterBatches = workspace.rosterBatches || [], rosterYear = workspace.rosterYear || '', rosterSgt = workspace.rosterSgt || ''
  const closeNotice = useCallback(() => setNotice(null), [])
  const refresh = useCallback(async () => { try { const next = await getStudentDirectory(); setData(next); setWorkspace(value => value.batchId && !next.batches.some(b => b.id === value.batchId) ? { ...value, batchId:'',view:'batches' } : value); setError('') } catch (failure) { setError(failure.message) } }, [])
  useEffect(() => { getStudentDirectory().then(next => { setData(next); setWorkspace(value => value.batchId && !next.batches.some(b => b.id === value.batchId) ? { ...value,batchId:'',view:'batches' } : value) }).catch(failure => setError(failure.message)); const storage = e => { if (!e.key || [DIRECTORY_KEY, 'medsy-student-directory-v1'].includes(e.key)) void refresh() }; const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(DIRECTORY_EVENT) : null; if (channel) channel.onmessage = refresh; window.addEventListener(DIRECTORY_EVENT, refresh); window.addEventListener('storage', storage); return () => { channel?.close(); window.removeEventListener(DIRECTORY_EVENT, refresh); window.removeEventListener('storage', storage) } }, [refresh])
  useEffect(() => { const restore = e => { setWorkspace({ view:'batches', batchId:'', year:'All', progress:'On Track', show:'all', ...e.state?.studentWorkspace }); setMode(null) }; window.addEventListener('popstate', restore); return () => window.removeEventListener('popstate', restore) }, [])
  const navigate = next => { const value = { ...workspace, highlight:null, ...next }; setWorkspace(value); onNavigateWorkspace?.(value) }
  const setRosterBatches = rosterBatches => navigate({rosterBatches})
  const setRosterYear = rosterYear => navigate({rosterYear})
  const setRosterSgt = rosterSgt => navigate({rosterSgt})
  const openBatch = (batchId, year = 'All', show = 'all', highlight = null) => {
    const members = data.students.filter(s => s.batch === batchId && studying(s) && (year === 'All' || s.year === year))
    const progress = members.some(s => !studentProgress(data, s, today()).lag) ? 'On Track' : 'Backlog'
    navigate({ view:'batch', batchId, year, show, progress:show === 'left' ? 'All' : progress, highlight })
  }
  const openAction = next => { if (next.ids) next = { ...next, expectedAcademicRevisions:Object.fromEntries(next.ids.map(id => [id, data.students.find(s => s.id === id)?.academicRevision])) }; setMode(next) }
  const save = async command => {
    let next
    if (command.type === 'delete') { const result = await deleteStudents(command.ids, { canEdit }); if (result.failed.length) { await refresh(); throw new Error(result.failed.map(f => f.message).join(' ')) } next = await getStudentDirectory() }
    else next = await saveStudentCommand(command, { canEdit })
    setData(next); setRevision(v => v + 1); setNotice({ id:crypto.randomUUID(), message:command.type === 'import' ? command.rows.length + ' students imported.' : command.type === 'sgt' ? 'SGT ' + command.section + ' updated.' : 'Changes saved.' })
    if (command.type === 'batch') navigate({ batchId:command.batch.id, view:'batch', year:command.batch.year, progress:'On Track', show:'all' })
    if (command.type === 'deleteBatch') navigate({ batchId:'', view:'batches' })
    if (command.type === 'calendar' && mode?.continueYear) openBatch(command.batch, mode.continueYear)
    return next
  }
  const batch = data?.batches.find(b => b.id === workspace.batchId), record = data?.students.find(s => s.id === recordId), date = today()
  const all = data?.students.filter(studying) || [], members = all.filter(s => s.batch === batch?.id)
  const incoming = members.filter(s => s.motherBatch !== s.batch), outgoing = all.filter(s => s.batch !== batch?.id && s.entries.some(e => e.batch === batch?.id)), left = members.filter(s => isLeftOver(data, s, date))
  const groups = [{ value:'all', label:'All students', rows:members }, { value:'own', label:'Admitted to this batch', rows:members.filter(s => s.motherBatch === s.batch) }, { value:'incoming', label:'Migrated in from earlier batches', rows:incoming }, { value:'left', label:'Left over: decision pending', rows:left }, { value:'outgoing', label:'Migrated to later batches', rows:outgoing }]
  const scoped = groups.find(g => g.value === workspace.show)?.rows || members
  const progressRows = scoped.filter(s => workspace.progress === 'All' || (studentProgress(data, s, date).lag ? 'Backlog' : 'On Track') === workspace.progress)
  const filtered = workspace.view === 'roster' ? all.filter(s => rosterBatches.includes(s.batch) && s.year === rosterYear && (!rosterSgt || s.section === rosterSgt)) : progressRows.filter(s => workspace.year === 'All' || s.year === workspace.year)
  const rows = filtered.map(s => ({ ...s, progressInfo:studentProgress(data, s, date), leftOver:isLeftOver(data, s, date), migratedOut:workspace.show === 'outgoing' }))
  const stage = batch && (workspace.year !== 'All' ? workspace.year : runningYear(batch, date) || members[0]?.year || STUDY_YEARS.find(y => batch.calendars[y]) || 'First Year')
  const search = data && <StudentSearch students={data.students} onSelect={student => { if (!studying(student)) onOpenRecord(student.id); else navigate({ view:'batch',batchId:student.batch,year:student.year,show:'all',highlight:student.id,progress:studentProgress(data,student,date).lag ? 'Backlog' : 'On Track' }) }} />
  const back = () => navigate({ view:'batches', batchId:'', year:'All', show:'all' })
  return <section className={`vx-content ospe-page my-skills-page logbook-scope lb-page admin-logbook-page student-management-page${((batch && workspace.view === 'batch') || workspace.view === 'roster') && !recordId ? ' sm-batch-detail-page' : ''}`}><div className="ospe-shell my-skills-shell lb-shell admin-logbook-shell student-management-shell">
    <div className="sm-page-heading"><PageNavigationHeader items={['My Pages','Student Management', ...(recordId ? ['Student Record'] : [])]} /><div className="sm-page-actions">{recordId ? <button className="lb-btn" onClick={() => { const target = { view:'batch',batchId:record?.batch || '',year:'All',show:'all',progress:record && studentProgress(data,record,date).lag ? 'Backlog' : 'On Track' }; setWorkspace(target); onCloseRecord(target) }}><ArrowLeft size={16} />Back to batches</button> : workspace.view === 'batches' ? null : <><button className="lb-btn" onClick={back}><ArrowLeft size={16} />Back to batches</button>{batch && <>{canEdit && <><button className="lb-btn" onClick={() => openAction({ type:'save',batch:batch.id,year:stage })}><UserPlus size={16} />Add student</button><button className="lb-btn" onClick={() => openAction({ type:'import',batch:batch.id,year:stage })}><Upload size={16} />Upload Excel</button></>}<button className="lb-icon-btn" aria-label="All changes" onClick={() => navigate({ view:workspace.view === 'history' ? 'batch' : 'history' })}><History size={16} /></button></>}</>}</div></div>
    {error && <div role="alert" className="lb-alert sm-error">{error}<button className="lb-btn" onClick={refresh}>Retry</button></div>}{notice && <FeedbackToast key={notice.id} placement="top-right" message={notice.message} onClose={closeNotice} />}
    {!data ? <p role="status">Loading student records...</p> : recordId ? record ? <StudentRecord student={record} data={data} theme={theme} canEdit={canEdit} onAction={openAction} /> : <p>Student not found.</p> : workspace.view === 'batches' ? <><StudentManagementHeader data={data} canEdit={canEdit} onAddBatch={() => openAction({ type:'batch' })} onAddStudent={() => openAction({ type:'save' })} /><StudentClosingNotice data={data} onOpen={openBatch} /><StudentBatchCalendar data={data} canEdit={canEdit} onAction={openAction} onOpen={openBatch} toolbar={search} onRoster={() => navigate({ view:'roster',batchId:'' })} /></> : workspace.view === 'history' ? <StudentHistory data={data} batch={batch?.id} canEdit={canEdit} onOpen={onOpenRecord} onAction={openAction} onUndoLast={() => { const move = data.moves.find(m => m.batch === batch?.id || m.targetBatch === batch?.id); if (move) openAction({type:'undo',moveId:move.id,ids:move.students.filter(m=>canUndo(data.students.find(s=>s.id===m.before.id),m,move)).map(m=>m.before.id)}) }} /> : <>
    {batch && <><section className="sm-batch-overview-card"><header className="sm-batch-summary lb-card"><div><h1>Batch {batch.id}</h1><p>MBBS / {runningYear(batch,date) ? runningYear(batch,date) + ' running ' + calendarLabel(batch.calendars[runningYear(batch,date)]) : 'No year running today'}</p></div><div className="sm-batch-counts">{[['Students',members.length],['On Track',members.filter(s => !studentProgress(data,s,date).lag).length],['Backlog',members.filter(s => studentProgress(data,s,date).lag).length],['Migrated in',incoming.length],['Migrated out',outgoing.length],['Left over',left.length]].filter(([label,count]) => ['Students','On Track','Backlog'].includes(label) || count).map(([label,count]) => <div key={label}><span>{label}</span><strong>{count}</strong></div>)}</div></header><div className="sm-workspace-filters"><nav aria-label="Progress">{['On Track','Backlog'].map(label => <button className={'my-skills-filter-chip ' + (workspace.progress === label ? 'is-active' : '')} key={label} aria-pressed={workspace.progress === label} onClick={() => navigate({ progress:label,year:'All' })}>{label} ({scoped.filter(s => (studentProgress(data,s,date).lag ? 'Backlog' : 'On Track') === label).length})</button>)}</nav><label>Show <span className="sm-batch-filter-select"><select value={workspace.show} onChange={e => navigate({ show:e.target.value,year:'All',progress:e.target.value === 'left' || e.target.value === 'outgoing' ? 'All' : workspace.progress })}>{groups.filter(g => g.rows.length || g.value === 'all').map(g => <option key={g.value} value={g.value}>{g.label} ({g.rows.length})</option>)}</select><ChevronDown size={14} aria-hidden="true" /></span></label><label>Year <span className="sm-batch-filter-select"><select value={workspace.year} onChange={e => navigate({ year:e.target.value })}><option value="All">All years ({progressRows.length})</option>{STUDY_YEARS.filter(y => progressRows.some(s => s.year === y)).map(y => <option key={y}>{y}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></span></label><div className="sm-batch-search-slot" ref={setStudentSearchTarget} /></div></section><StudentClosingNotice data={data} batchId={batch.id} onOpen={openBatch} /><StudentSubjects key={batch.id + stage} batch={batch} year={stage} students={data.students} canEdit={canEdit} onSave={save} />
    {rows.length > 0 && workspace.year !== 'All' && <p className="lb-alert sm-year-help">Year-end for {workspace.year}: select students, then Promote, or Change batch / Not promoted to repeat with a later batch. Dates follow the batch calendar.</p>}</>}
    {workspace.view === 'roster' && <StudentRosterFilters batches={data.batches} selected={rosterBatches} year={rosterYear} sgt={rosterSgt} count={rows.length} onBatches={setRosterBatches} onYear={setRosterYear} onSgt={setRosterSgt} onReset={() => navigate({rosterBatches:[],rosterYear:'',rosterSgt:''})} searchRef={setStudentSearchTarget} />}
    {(workspace.view !== 'roster' || (rosterBatches.length > 0 && rosterYear)) && <StudentDirectory key={JSON.stringify(workspace)+revision+rosterBatches.join()+rosterYear+rosterSgt} rows={rows} canEdit={canEdit && workspace.show !== 'outgoing'} onOpen={onOpenRecord} onAction={openAction} onClear={() => navigate(workspace.view === 'roster' ? {rosterSgt:''} : { progress:'On Track',show:'all',year:'All' })} highlightId={workspace.highlight} onClearHighlight={() => setWorkspace(v => ({...v,highlight:null}))} title="Students" searchTarget={batch || workspace.view === 'roster' ? studentSearchTarget : null} emptyBatch={Boolean(batch && !members.length)} onAddStudent={batch && canEdit ? () => openAction({ type:'save',batch:batch.id,year:stage }) : undefined} />}
    </>}
    {mode && data && (mode.type === 'import' ? <StudentImport data={data} batch={mode.batch} year={mode.year} onSave={save} onClose={() => setMode(null)} /> : ['batch','calendar','move','changeBatch','sgt'].includes(mode.type) ? <StudentCalendarDialog mode={mode} data={data} onSave={save} onClose={() => setMode(null)} /> : <StudentEditor mode={mode} data={data} onSave={save} onClose={() => setMode(null)} />)}
  </div></section>
}
