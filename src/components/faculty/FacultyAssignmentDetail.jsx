import ManagementSelect from '../ManagementSelect'
import { useState } from 'react'
import FacultyPanel from './FacultyPanel'
import FacultyRoster from './FacultyRoster'
import { assignmentChanges, previewAssignment, assignmentStatus } from '../../services/facultyAcademicContext'
import { normaliseAssignment } from '../../services/facultyAssignments'
import { subjectName, liveState } from '../../services/facultyModel'
import './FacultyAssignmentDetail.css'

export default function FacultyAssignmentDetail({assignment:a,data,directory,canEdit,onSave,onAction,onClose}) {
  const changes=assignmentChanges(a,data,directory)
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[snapshot,setSnapshot]=useState('current')
  const current=data.faculty.find(f=>f.id===a.facultyId)
  const historical=snapshot==='current'?null:a.rosterHistory[Number(snapshot)]
  const active=['ACTIVE','SCHEDULED'].includes(liveState(a))
  const reconcile=async()=>{
    setBusy(true);setError('')
    try{const draft=normaliseAssignment(a,data.institutionId);const preview=previewAssignment(draft,data,directory);await onSave({type:'reconcile',id:a.id,fingerprint:preview.fingerprint,reason:'Reviewed roster differences'})}catch(e){setError(e.message)}finally{setBusy(false)}
  }
  return <FacultyPanel title={subjectName(a.subjectId)} subtitle={current?.name+' · '+(a.roleType==='PRIMARY'?'Primary faculty':'Co-teacher')} busy={busy} onClose={onClose}><div className="fm-panel-body">
    <div className="fm-detail-meta"><span className="fm-badge">{assignmentStatus(a,data,directory)}</span><span>{a.studyYear}</span><span>{a.startsOn} to {a.endsOn}</span><span>{a.scopeType==='WHOLE_BATCH'?'Whole batch':'SGT '+a.selectedSgtValues.join(', ')}</span><span>Teaching batches {a.calendarRefs.map(c=>c.batchId).join(', ')}</span></div>
    {a.roleType==='CO_TEACHER'&&<p className="fm-note">Primary: {data.faculty.find(f=>f.id===data.assignments.find(p=>p.id===a.primaryAssignmentId)?.facultyId)?.name||'Unavailable'}</p>}
    {error&&<p className="fm-error" role="alert">{error}</p>}
    {changes.needsReview&&<section className="fm-change-review"><h3>Roster needs review</h3><p>{changes.added.length} new · {changes.removed.length} no longer eligible · {changes.changed.length} context changes</p>{[['New entrants',changes.added],['No longer eligible',changes.removed],['Changed context',changes.changed]].map(([label,rows])=>rows.length>0&&<details key={label}><summary>{label} ({rows.length})</summary><ul>{rows.map(m=><li key={m.studentId}>{m.name} · {m.registrationId}</li>)}</ul></details>)}{changes.errors.map(e=><p className="fm-field-error" key={e}>{e}</p>)}<p>Ineligible students remain in history. New students join only after confirmation.</p>{canEdit&&<button className="fm-btn fm-primary" disabled={busy||Boolean(changes.errors.length)} onClick={reconcile}>{busy?'Saving…':'Confirm roster changes'}</button>}</section>}
    <label className="fm-field"><span>Roster version</span><ManagementSelect value={snapshot} onChange={e=>setSnapshot(e.target.value)}><option value="current">Current saved roster · revision {a.rosterRevision}</option>{a.rosterHistory.map((h,i)=><option key={i} value={i}>Revision {h.rosterRevision} · {h.at?.slice(0,10)} · {h.reason}</option>)}</ManagementSelect></label>
    <FacultyRoster members={historical?.members||a.members} excluded={changes.preview?.excluded||[]} readOnly/>
    <p className="fm-note">Saved rosters are historical records. Current teaching eligibility is rechecked against Student Management.</p>
  </div><footer className="fm-panel-footer"><button className="fm-btn" onClick={onClose} disabled={busy}>Close</button>{canEdit&&<>{a.state==='DRAFT'&&<button className="fm-btn fm-primary" onClick={()=>onAction('wizard',a)}>Continue draft</button>}{active&&<><button className="fm-btn" onClick={()=>onAction('wizard',a)}>Revise assignment</button><button className="fm-btn" onClick={()=>onAction('reassign',a)}>Reassign</button></>}<button className="fm-btn" onClick={()=>onAction('copy',a)}>Copy to next period</button>{(active||a.state==='DRAFT')&&<button className="fm-btn" onClick={()=>onAction('end',a)}>End assignment</button>}</>}</footer></FacultyPanel>
}

