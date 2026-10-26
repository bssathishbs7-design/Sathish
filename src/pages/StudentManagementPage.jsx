import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, History, ChevronDown, UserPlus, Upload, Trash2 } from 'lucide-react'
import FeedbackToast from '../components/FeedbackToast'
import PageNavigationHeader from '../components/PageNavigationHeader'
import LogbookBoundary from '../components/logbook/LogbookBoundary'
import StudentEditor from '../components/students/StudentEditor'
import StudentImport from '../components/students/StudentImport'
import StudentRecord from '../components/students/StudentRecord'
import StudentDirectory from '../components/students/StudentDirectory'
import StudentHistory from '../components/students/StudentHistory'
import StudentManagementHeader from '../components/students/StudentManagementHeader'
import StudentBatches from '../components/students/StudentBatches'
import StudentSearch from '../components/students/StudentSearch'
import StudentSubjects from '../components/students/StudentSubjects'
import { canUndo } from '../services/studentModel'
import { DIRECTORY_KEY, DIRECTORY_EVENT, YEARS, getStudentDirectory, saveStudentCommand, deleteStudents } from '../services/studentManagement'
import '../styles/medsy/question-sort-tokens.css'
import '../styles/ospe-activity.css'
import '../styles/my-skills.css'
import './LogbookPage.css'
import '../components/logbook/LogbookDashboard.css'
import './AdminLogbookPage.css'
import '../components/logbook/LogbookPolish.css'
import '../components/logbook/LogbookReadability.css'
import './StudentManagementPage.css'

/** App owns route changes. Permissions default to read-only. Local adapter is replaceable by institution-scoped APIs. */
export default function StudentManagementPage(props) { return <LogbookBoundary title="Student management could not be displayed"><StudentManagementContent {...props} /></LogbookBoundary> }
function StudentManagementContent({ theme, canEdit = false, recordId, onOpenRecord, onCloseRecord, onNavigateWorkspace }) {
  const [data, setData] = useState(null), [error, setError] = useState(''), [notice, setNoticeState] = useState(null), [reload, setReload] = useState(0)
  const setNotice = message => setNoticeState({ message, id: crypto.randomUUID() })
  const closeNotice = useCallback(() => setNoticeState(null), [])
  const [batchId, setBatchId] = useState(() => window.history.state?.studentWorkspace?.batchId || ''), [year, setYear] = useState(() => window.history.state?.studentWorkspace?.year || 'First Year'), [remembered, setRemembered] = useState({}), [view, setView] = useState(() => window.history.state?.studentWorkspace?.view || 'batches')
  const [mode, setMode] = useState(null), [highlight, setHighlight] = useState(null), [selection, setSelection] = useState(0), [version, setVersion] = useState(0)
  useEffect(() => {
    let alive = true
    const refresh = async () => { try { const next = await getStudentDirectory(); if (alive) { setData(next); setError('') } } catch (failure) { if (alive) setError(failure.message) } }
    const storage = event => { if (!event.key || event.key === DIRECTORY_KEY) void refresh() }
    void refresh(); window.addEventListener(DIRECTORY_EVENT, refresh); window.addEventListener('storage', storage)
    return () => { alive = false; window.removeEventListener(DIRECTORY_EVENT, refresh); window.removeEventListener('storage', storage) }
  }, [reload])
  useEffect(() => {
    const restore = event => {
      const state = event.state?.studentWorkspace
      setBatchId(state?.batchId || ''); setYear(state?.year || 'First Year'); setView(state?.view || 'batches')
      setHighlight(state?.highlight || null); setSelection(0); setMode(null); setVersion(value => value + 1)
    }
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [])
  const navigateWorkspace = next => {
    const state = { batchId, year, view, highlight, ...next }
    onNavigateWorkspace(state)
    setBatchId(state.batchId); setYear(state.year); setView(state.view); setHighlight(state.highlight); setSelection(0)
  }
  const selectYear = next => { setRemembered(previous => ({ ...previous, [batchId]: next })); navigateWorkspace({ year: next, view: 'batch', highlight: null }) }
  const selectBatch = id => {
    if (!id) { navigateWorkspace({ batchId: '', year: 'First Year', view: 'batches', highlight: null }); return }
    const untracked = data.students.filter(student => student.batch === id && !student.tracked)
    if (untracked.length && !data.students.some(student => student.batch === id && student.tracked)) { navigateWorkspace({ batchId: id, year: untracked[0].year, view: 'setup', highlight: null }); return }
    const stages = [...YEARS, 'Graduated']
    const largest = [...stages].sort((a, b) => data.students.filter(s => s.batch === id && s.tracked && s.year === b).length - data.students.filter(s => s.batch === id && s.tracked && s.year === a).length)[0]
    navigateWorkspace({ batchId: id, year: remembered[id] || largest, view: 'batch', highlight: null })
  }
  const openRecord = id => onOpenRecord(id)
  const openAction = next => {
    if (next.type === 'move') next = { ...next, expectedAcademicRevisions: Object.fromEntries(next.ids.map(id => [id, data.students.find(s => s.id === id)?.academicRevision])) }
    setMode(next)
  }
  const save = async command => {
    if (command.type === 'delete') {
      const result = await deleteStudents(command.ids, { canEdit })
      const next = await getStudentDirectory(); setData(next); setSelection(0); setVersion(v => v + 1)
      setNotice(`${result.deleted.length} deleted.${result.failed.length ? ' Failed: ' + result.failed.map(f => `${f.id}: ${f.message}`).join('; ') : ''}`)
      if (result.failed.length) throw new Error('Some deletions failed. Close this form, review the result message and retry the remaining students.')
      return next
    }
    const next = await saveStudentCommand(command, { canEdit }); setData(next); setSelection(0); setVersion(v => v + 1)
    const created = command.type === 'save' && !command.draft.id ? next.students.find(s => !data.students.some(old => old.id === s.id)) : null
    setNotice(created ? `Student created: ${created.trackingId}` : command.type === 'import' ? `${command.rows.length} students imported.` : command.type === 'deleteBatch' ? `Batch ${command.batch} deleted.` : 'Changes saved.')
    if (command.type === 'batch') { navigateWorkspace({ batchId: command.batch.id, year: 'First Year', view: 'batch', highlight: null }) }
    if (command.type === 'deleteBatch') { navigateWorkspace({ batchId: '', year: 'First Year', view: 'batches', highlight: null }) }
    return next
  }
  const selectedBatch = data?.batches.find(b => b.id === batchId), record = data?.students.find(s => s.id === recordId)
  const returnToStudentList = () => {
    const target = record ? { batchId: record.batch, year: record.year, view: record.tracked ? 'batch' : 'setup', highlight: null } : { batchId: '', year: 'First Year', view: 'batches', highlight: null }
    setBatchId(target.batchId); setYear(target.year); setView(target.view); setHighlight(null); setSelection(0)
    onCloseRecord(target)
  }
  const batchIsEmpty = Boolean(selectedBatch) && !data.students.some(student => student.batch === batchId)
  const legacy = data?.students.filter(s => !s.tracked && s.batch === batchId) || []
  const lastChange = data?.moves.find(move => move.batch === batchId)
  const undoIds = lastChange?.students.filter(member => canUndo(data.students.find(s => s.id === member.before.id), member, lastChange)).map(member => member.before.id) || []
  const rows = (data?.students || []).filter(s => view === 'setup' ? !s.tracked && s.batch === batchId : s.tracked && s.batch === batchId && s.year === year).sort((a, b) => a.name.localeCompare(b.name))
  const directoryFilters = data && <><StudentSearch students={data.students} onSelect={student => navigateWorkspace({ batchId: student.batch, year: student.year, view: student.tracked ? 'batch' : 'setup', highlight: student.id })} /></>
  return <section className="vx-content ospe-page my-skills-page logbook-scope lb-page admin-logbook-page student-management-page"><div className="ospe-shell my-skills-shell lb-shell student-management-shell">
    <div className="sm-page-heading"><PageNavigationHeader items={['My Pages', 'Student Management', ...(recordId ? ['Student Record'] : [])]} />{!recordId && data && view === 'batches' && <div className="sm-page-batch-picker"><label className="lb-field"><span className="sm-select-control"><select aria-label="Select your batch" value={batchId} onChange={event => selectBatch(event.target.value)}><option value="">Select Your Batch</option>{data.batches.map(b => <option key={b.id} value={b.id}>Batch {b.id}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label></div>}{recordId && <button type="button" className="lb-btn" onClick={returnToStudentList}><ArrowLeft size={16} aria-hidden="true" />Back to batches</button>}{!recordId && data && view !== 'batches' && <div className="sm-page-actions">{<button type="button" className="lb-btn" onClick={() => selectBatch('')} aria-label={`Batch ${batchId}, back to admission batches`} title="Back to admission batches"><ArrowLeft size={16} aria-hidden="true" />Batch {batchId}</button>}{canEdit && view === 'setup' && legacy.length > 0 && <button className="lb-btn" onClick={() => setMode({ type: 'bulkSetup', batch: batchId, year: legacy[0].year })}>Set up year group</button>}{selectedBatch && view !== 'setup' && <div className="sm-actions">{canEdit && view === 'batch' && year === 'First Year' && selection === 0 && <><button className="lb-btn" onClick={() => setMode({ type: 'save', batch: batchId })}><UserPlus size={16}/>Add Student</button><button className="lb-btn" onClick={() => setMode({ type: 'import', batch: batchId })}><Upload size={16}/>Upload Excel</button></>}{view !== 'history' && <button type="button" className="lb-icon-btn" aria-label="All changes" title="All changes" onClick={() => navigateWorkspace({ view: 'history' })}><History size={16} aria-hidden="true" /></button>}{canEdit && batchIsEmpty && <button type="button" className="lb-icon-btn" aria-label="Delete batch" title="Delete batch" onClick={() => setMode({ type: 'deleteBatch', batch: batchId, emptyOnly: true })}><Trash2 size={16} aria-hidden="true" /></button>}</div>}</div>}</div>
    {!recordId && view === 'batches' && <StudentManagementHeader data={data} canEdit={canEdit} onAddBatch={() => setMode({ type: 'batch' })} onAddStudent={() => setMode({ type: 'save', batch: [...data.batches].sort((a,b) => b.id.localeCompare(a.id))[0]?.id })} />}
    {error && <div className="lb-alert sm-error" role="alert">{error}<button className="lb-btn" onClick={() => setReload(v => v + 1)}>Retry</button></div>}
    {notice && <FeedbackToast placement="top-right" key={notice.id} message={notice.message} onClose={closeNotice} />}
    {!data ? !error && <p role="status">Loading student records...</p> : recordId ? record ? <StudentRecord student={record} data={data} theme={theme} canEdit={canEdit} onAction={openAction} /> : <div className="lb-card"><p>Student not found.</p><button className="lb-btn" onClick={returnToStudentList}>Back to batches</button></div> : <>

      {view === 'batches' ? <StudentBatches toolbar={directoryFilters} data={data} onSelect={selectBatch} canEdit={canEdit} onDelete={batch => setMode({ type: 'deleteBatch', batch, emptyOnly: true })} /> : <div className="sm-batch-workspace">
        {selectedBatch && <nav className="sm-year-tabs" aria-label="Academic stages">{[...YEARS, 'Graduated'].map(stage => <button key={stage} className={view !== 'setup' && year === stage ? 'is-active' : ''} aria-current={view !== 'setup' && year === stage ? 'page' : undefined} onClick={() => selectYear(stage)}>{stage} ({data.students.filter(s => s.batch === batchId && s.tracked && s.year === stage).length})</button>)}{legacy.length > 0 && <button className={view === 'setup' ? 'is-active' : ''} aria-current={view === 'setup' ? 'page' : undefined} onClick={() => navigateWorkspace({ view: 'setup', highlight: null })}>Needs setup ({legacy.length})</button>}</nav>}
        {view === 'batch' && selectedBatch && year !== 'Graduated' && <StudentSubjects key={batchId + year} batch={selectedBatch} year={year} students={data.students} canEdit={canEdit} onSave={async command => { const next = await saveStudentCommand(command, { canEdit }); setData(next); setNotice(command.subjects[0] + ' syllabus updated.'); }} />}
        {view === 'history' ? <StudentHistory onUndoLast={canEdit && undoIds.length > 0 ? () => setMode({ type: 'undo', moveId: lastChange.id, ids: undoIds }) : undefined} data={data} batch={batchId} canEdit={canEdit} onOpen={openRecord} onAction={openAction} /> : <>
          <StudentDirectory key={[view, batchId, year, version].join(':')} rows={rows} canEdit={canEdit} onOpen={openRecord} onAction={openAction} onClear={() => { setHighlight(null); setSelection(0) }} onClearHighlight={() => setHighlight(null)} onSelectionChange={setSelection} highlightId={highlight} graduated={view !== 'setup' && year === 'Graduated'} title={view === 'setup' ? 'Students needing setup' : `${year} students`} />
        </>}
      </div>}
    </>}
    {mode && data && (mode.type === 'import' ? <StudentImport data={data} batch={mode.batch} onClose={() => { setMode(null); setSelection(0) }} onSave={save} /> : <StudentEditor key={`${mode.type}-${mode.student?.id || mode.entry?.id || ''}`} mode={mode} data={data} onClose={() => { setMode(null); setSelection(0) }} onSave={save} />)}
  </div></section>
}
