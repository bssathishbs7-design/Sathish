import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Upload, RefreshCw, Search, UsersRound, BookOpen, GraduationCap, ClipboardList } from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
import LogbookBoundary from '../components/logbook/LogbookBoundary'
import FacultyProfileEditor from '../components/faculty/FacultyProfileEditor'
import FacultyAssignmentWizard from '../components/faculty/FacultyAssignmentWizard'
import FacultyAssignmentDetail from '../components/faculty/FacultyAssignmentDetail'
import FacultyOperation from '../components/faculty/FacultyOperation'
import FacultyImport from '../components/faculty/FacultyImport'
import FacultyFilters from '../components/faculty/FacultyFilters'
import { getStudentDirectory, DIRECTORY_EVENT } from '../services/studentManagement'
import { readFaculty, saveFaculty } from '../services/facultyDirectoryStorage'
import { FACULTY_EVENT, liveState, subjectName } from '../services/facultyModel'
import { assignmentChanges, effectiveFacultyRoster, assignmentStatus } from '../services/facultyAcademicContext'
import { describeFacultyHistory } from '../services/facultyHistory'
import '../styles/medsy/question-sort-tokens.css'
import './StudentManagementPage.css'
import './StudentManagementWorkspace.css'
import '../components/students/StudentManagementHeader.css'
import '../components/students/StudentMetrics.css'
import './FacultyManagementPageV2.css'

/** Page-local workflow state; App owns route, identity and write permission.
 * @param {{onAlert:Function,canEdit?:boolean,actor?:string,institutionId?:string}} props
 */
export default function FacultyManagementPageV2(props) {
  return <LogbookBoundary title="Faculty management could not be displayed"><FacultyWorkspace {...props}/></LogbookBoundary>
}
function FacultyWorkspace({onAlert,canEdit=false,actor='Administrator',institutionId='medsy-demo'}) {
  const [data,setData]=useState(null),[directory,setDirectory]=useState(null),[error,setError]=useState(''),[refreshing,setRefreshing]=useState(false)
  const [view,setView]=useState('Faculty'),[search,setSearch]=useState(''),[status,setStatus]=useState(''),[subject,setSubject]=useState(''),[page,setPage]=useState(1),[mode,setMode]=useState(null)
  const [showFilters,setShowFilters]=useState(false),[extra,setExtra]=useState({})
  const request=useRef(null),loadingVersion=useRef(0)
  const refresh=useCallback(async()=>{
    const version=++loadingVersion.current;setRefreshing(true)
    try {const students=await getStudentDirectory();const faculty=await readFaculty(institutionId,students);if(version===loadingVersion.current){setDirectory(students);setData(faculty);setError('')}}
    catch(e){if(version===loadingVersion.current)setError(e.message)}
    finally{if(version===loadingVersion.current)setRefreshing(false)}
  },[institutionId])
  useEffect(()=>{
    void refresh()
    const events=[DIRECTORY_EVENT,FACULTY_EVENT,'storage','focus']
    events.forEach(name=>window.addEventListener(name,refresh))
    const channels=typeof BroadcastChannel==='undefined'?[]:[DIRECTORY_EVENT,FACULTY_EVENT].map(name=>{const c=new BroadcastChannel(name);c.onmessage=refresh;return c})
    return()=>{events.forEach(name=>window.removeEventListener(name,refresh));channels.forEach(c=>c.close())}
  },[refresh])
  const resetFilters=()=>{setSearch('');setStatus('');setSubject('');setExtra({});setPage(1)}
  const changeView=value=>{setView(value);resetFilters();setShowFilters(false)}
  const save=async(command,assignNext=false)=>{
    const base={...command,expectedRevision:data.revision}
    const signature=JSON.stringify(base)
    if(request.current?.signature!==signature)request.current={signature,id:crypto.randomUUID()}
    const next=await saveFaculty({...base,requestId:request.current.id},{canEdit,actor,institutionId})
    setData(next);request.current=null
    if(assignNext)setMode({type:'wizard',facultyId:next.history[0].entityId})
    else setMode(null)
    if(['publish','draft','reconcile','reassign'].includes(command.type))changeView('Teaching assignments')
    onAlert?.({tone:'secondary',message:next.history[0]?.action||'Changes saved.'})
  }
  const action=(type,record)=>{
    if(type==='copy')setMode({type:'wizard',record:{facultyId:record.facultyId,studyYear:record.studyYear,subjectId:record.subjectId,scopeType:record.scopeType,selectedSgtValues:record.selectedSgtValues,roleType:record.roleType,state:'DRAFT',calendarRefs:[]}})
    else setMode({type,record,facultyId:record?.facultyId})
  }
  const needle=search.trim().toLowerCase()
  const changes=data&&directory?Object.fromEntries(data.assignments.map(a=>[a.id,assignmentChanges(a,data,directory)])):{}
  const assignments=data?.assignments||[]
  const coverage=f=>assignments.some(a=>a.facultyId===f.id&&assignmentStatus(a,data,directory)==='ACTIVE')?'assigned':assignments.some(a=>a.facultyId===f.id&&liveState(a)==='SCHEDULED')?'scheduled':'unassigned'
  const facultyRows=(data?.faculty||[]).filter(f=>(!status||f.accountStatus===status)&&(!subject||f.eligibleSubjectIds.includes(subject))&&(!extra.department||f.departmentId===extra.department)&&(!extra.designation||f.designationId===extra.designation)&&(!extra.coverage||coverage(f)===extra.coverage)&&[f.name,f.employeeId,f.email,f.departmentId].some(v=>v.toLowerCase().includes(needle)))
  const assignmentRows=assignments.filter(a=>(!status||(status==='REVIEW'?changes[a.id]?.needsReview:assignmentStatus(a,data,directory)===status))&&(!subject||a.subjectId===subject)&&(!extra.year||a.studyYear===extra.year)&&(!extra.period||a.calendarRefs.some(c=>c.fromMonth+'/'+c.toMonth===extra.period))&&(!extra.sgt||(a.scopeType==='SGT'?a.selectedSgtValues.includes(extra.sgt):a.members.some(m=>m.sectionAtAssignment===extra.sgt)))&&[subjectName(a.subjectId),data.faculty.find(f=>f.id===a.facultyId)?.name||'',a.studyYear,a.calendarRefs.map(c=>c.batchId).join(' ')].some(v=>v.toLowerCase().includes(needle)))
  const historyRows=(data?.history||[]).filter(h=>(h.action+' '+h.actor+' '+h.reason).toLowerCase().includes(needle))
  const rows=view==='Faculty'?facultyRows:view==='Teaching assignments'?assignmentRows:historyRows
  const pages=Math.max(1,Math.ceil(rows.length/10)),currentPage=Math.min(page,pages),shown=rows.slice((currentPage-1)*10,currentPage*10)
  const active=assignments.filter(a=>assignmentStatus(a,data,directory)==='ACTIVE')
  const selectedRecord=mode?.record?.id?assignments.find(a=>a.id===mode.record.id)||mode.record:mode?.record
  return <section className="vx-content ospe-page my-skills-page logbook-scope lb-page admin-logbook-page student-management-page fm-workspace">
    <div className="sm-page-heading"><PageNavigationHeader items={['My Pages','Faculty Management']}/></div>
    <div className="sm-directory-overview"><header className="my-skills-overview lb-page-head admin-page-head">
      <div className="my-skills-overview-main"><div className="my-skills-overview-copy"><h1>Faculty management</h1><p>Manage faculty profiles and teaching responsibilities.</p></div>
      {data&&<div className="lb-summary-strip admin-logbook-metrics sm-directory-metrics" data-count="4" aria-label="Faculty directory metrics">{[
        ['Faculty',data.faculty.length,<UsersRound size={18}/>],
        ['Assignments',active.length,<BookOpen size={18}/>],
        ['Students',new Set(active.flatMap(a=>effectiveFacultyRoster(a,data,directory).map(m=>m.studentId))).size,<GraduationCap size={18}/>],
        ['Needs review',Object.values(changes).filter(c=>c.needsReview).length,<ClipboardList size={18}/>]]
        .map(([label,value,icon],index)=><div className={'lb-summary-item my-skills-metric-card '+(index<2?'is-assigned':'is-completed')} key={label}><span className="my-skills-metric-card-icon" aria-hidden="true">{icon}</span><span className="my-skills-metric-card-copy"><strong>{value}</strong><span>{label}</span></span></div>)}</div>}
      </div><div className="my-skills-live-card lb-create-card admin-action-card"><div className="my-skills-live-card-body"><strong>Organise your faculty</strong><p>Add faculty, then assign students by year, subject and SGT.</p></div><div className="sm-header-actions">{canEdit&&<><button className="tool-btn my-skills-live-card-cta lb-new-entry-btn" disabled={!data} onClick={()=>setMode({type:'import'})}><Upload size={16}/>Import faculty</button><button className="tool-btn my-skills-live-card-cta lb-new-entry-btn" disabled={!data} onClick={()=>setMode({type:'profile'})}><Plus size={16}/>Add faculty</button></>}</div></div>
    </header></div>
    {!canEdit&&<p className="fm-note">Read-only access. Contact an administrator to change profiles or teaching assignments.</p>}
    {error&&<p role="alert" className="fm-error">{error} <button className="fm-btn" onClick={refresh}>Retry</button></p>}
    {!data?<p className="fm-empty" role="status">{error?'Faculty records unavailable.':'Loading faculty and student records…'}</p>:<>

      <nav className="fm-tabs" aria-label="Faculty workspace views">{['Faculty','Teaching assignments','History'].map(tab=><button key={tab} aria-pressed={view===tab} onClick={()=>changeView(tab)}>{tab}</button>)}</nav>
      <section className="fm-sheet"><div className="fm-toolbar"><label className="fm-search"><Search size={16} aria-hidden="true"/><input aria-label={"Search "+view.toLowerCase()} type="search" placeholder={view==='Faculty'?'Name, ID, email or department':'Search '+view.toLowerCase()} value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></label>
        <button className="fm-btn fm-icon-btn" onClick={refresh} disabled={refreshing} aria-label="Refresh faculty records"><RefreshCw size={16}/></button>
        {view!=='History'&&<button className="fm-btn" aria-expanded={showFilters} onClick={()=>setShowFilters(!showFilters)}>Filters{[status,subject,...Object.values(extra)].filter(Boolean).length?' ('+[status,subject,...Object.values(extra)].filter(Boolean).length+')':''}</button>}
        {view==='Teaching assignments'&&canEdit&&<button className="fm-btn fm-primary" onClick={()=>setMode({type:'wizard'})}>Assign students</button>}
      </div>{showFilters&&view!=='History'&&<FacultyFilters view={view} data={data} status={status} subject={subject} extra={extra} onStatus={v=>{setStatus(v);setPage(1)}} onSubject={v=>{setSubject(v);setPage(1)}} onExtra={(key,value)=>{setExtra(e=>({...e,[key]:value}));setPage(1)}} onReset={resetFilters}/>}<div className="fm-table-caption"><h2>{view}</h2><span role="status">{rows.length} {rows.length===1?'result':'results'}</span></div>
      <div className="fm-table-scroll" tabIndex={0} aria-label={view}><table>
        {view==='Faculty'?<><thead><tr><th>Faculty</th><th>Designation</th><th>Account</th><th>Actions</th></tr></thead><tbody>{shown.map(f=>{return <tr key={f.id}><td><strong>{f.name}</strong><small className="fm-mono">{f.employeeId}</small><small>{f.email}</small></td><td>{f.designationId}</td><td><span className="fm-badge">{f.accountStatus==='ACTIVE'?'Active':'Inactive'}</span></td><td><div className="fm-row-actions">{canEdit?<><button className="fm-btn" disabled={f.accountStatus!=='ACTIVE'} onClick={()=>setMode({type:'wizard',facultyId:f.id})}>Assign students</button><button className="fm-link" onClick={()=>setMode({type:'profile',record:f})}>Edit</button><button className="fm-link" onClick={()=>action('status',f)}>{f.accountStatus==='ACTIVE'?'Deactivate':'Reactivate'}</button></>:<span>Read only</span>}</div></td></tr>})}</tbody></>
        :view==='Teaching assignments'?<><thead><tr><th>Faculty / subject</th><th>Teaching context</th><th>Scope</th><th className="fm-num">Students</th><th>Status</th><th>Action</th></tr></thead><tbody>{shown.map(a=><tr key={a.id}><td><strong>{data.faculty.find(f=>f.id===a.facultyId)?.name}</strong><small>{subjectName(a.subjectId)} · {a.roleType==='PRIMARY'?'Primary':'Co-teacher'}</small></td><td>{a.studyYear}<small>{a.startsOn||'Dates not set'} to {a.endsOn||'not set'}</small><small>Batch {a.calendarRefs.map(c=>c.batchId).join(', ')||'not selected'}</small></td><td>{a.scopeType==='WHOLE_BATCH'?'Whole batch':'SGT '+a.selectedSgtValues.join(', ')}</td><td className="fm-num">{a.members.length}</td><td><span className="fm-badge">{assignmentStatus(a,data,directory).toLowerCase()}</span>{changes[a.id]?.needsReview&&<small className="fm-review-mark">Needs review</small>}</td><td><button className="fm-btn" onClick={()=>action('detail',a)}>View assignment</button></td></tr>)}</tbody></>
        :<><thead><tr><th>Change</th><th>Changed by</th><th>Date / time</th><th>Reason</th></tr></thead><tbody>{shown.map(h=><tr key={h.id}><td>{h.action}</td><td>{h.actor}</td><td className="fm-mono">{new Date(h.at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</td><td>{h.reason||'—'}<details><summary>Saved change details</summary><ul>{describeFacultyHistory(h).map((line,i)=><li key={i}>{line}</li>)}</ul></details></td></tr>)}</tbody></>}
      </table></div>
      {!rows.length&&<div className="fm-empty"><strong>{search||status||subject?'No matches':'No '+view.toLowerCase()+' yet'}</strong><p>{view==='History'?'Changes will appear here after a profile or assignment is saved.':'Adjust the filters or create a new record to get started.'}</p>{(search||status||subject)&&<button className="fm-btn" onClick={()=>{setSearch('');setStatus('');setSubject('')}}>Reset filters</button>}</div>}
      {rows.length>0&&<footer className="fm-pagination"><span>{(currentPage-1)*10+1}–{Math.min(currentPage*10,rows.length)} of {rows.length}</span><div className="fm-actions"><button className="fm-btn" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}>Previous</button><span className="fm-mono">{currentPage} / {pages}</span><button className="fm-btn" disabled={currentPage===pages} onClick={()=>setPage(currentPage+1)}>Next</button></div></footer>}
      </section>
    </>}
    {data&&directory&&mode?.type==='profile'&&<FacultyProfileEditor key={mode.record?.id||'new'} profile={mode.record} data={data} onSave={save} onClose={()=>setMode(null)}/>}
    {data&&directory&&mode?.type==='wizard'&&<FacultyAssignmentWizard key={mode.record?.id||mode.facultyId||'new'} facultyId={mode.facultyId} assignment={mode.record} data={data} directory={directory} onSave={save} onClose={()=>setMode(null)}/>}
    {data&&directory&&mode?.type==='detail'&&<FacultyAssignmentDetail assignment={selectedRecord} data={data} directory={directory} canEdit={canEdit} onSave={save} onAction={action} onClose={()=>setMode(null)}/>}
    {data&&mode?.type==='import'&&<FacultyImport data={data} onSave={save} onClose={()=>setMode(null)}/>}
    {data&&['status','end','reassign'].includes(mode?.type)&&<FacultyOperation type={mode.type} record={selectedRecord} data={data} onSave={save} onClose={()=>setMode(null)}/>}
  </section>
}

