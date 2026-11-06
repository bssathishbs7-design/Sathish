import ManagementSelect from '../ManagementSelect'
import { useState } from 'react'
import FacultyPanel from './FacultyPanel'
import { liveState, subjectName } from '../../services/facultyModel'
import './FacultyOperation.css'

export default function FacultyOperation({type,record,data,onSave,onClose}) {
  const [reason,setReason]=useState(''),[facultyId,setFacultyId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const title=type==='status'?(record.accountStatus==='ACTIVE'?'Deactivate faculty':'Reactivate faculty'):type==='end'?'End teaching assignment':'Reassign teaching responsibility'
  const owned=type==='status'?data.assignments.filter(a=>a.facultyId===record.id):[record]
  const impacted=data.assignments.filter(a=>!['ENDED','CANCELLED'].includes(liveState(a))&&(owned.includes(a)||owned.some(p=>a.primaryAssignmentId===p.id)))
  const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{await onSave({type,id:record.id,reason,facultyId})}catch(failure){setError(failure.message)}finally{setBusy(false)}}
  return <FacultyPanel title={title} subtitle={record.name||subjectName(record.subjectId)} busy={busy} onClose={onClose}><form className="fm-dialog-form" onSubmit={submit}><fieldset className="fm-panel-body" disabled={busy}>
    {error&&<p role="alert" className="fm-error">{error}</p>}
    <p>{type==='reassign'?'Transfer current and future responsibility to an eligible replacement. Historical ownership is retained.':record.accountStatus==='INACTIVE'?'Reactivation does not reopen ended assignments.':'This closes affected teaching responsibilities from today, including dependent co-teaching. Historical rosters remain available.'}</p>
    {record.accountStatus!=='INACTIVE'&&<div className="fm-operation-impact"><strong>{impacted.length} affected assignments</strong><ul>{impacted.map(a=><li key={a.id}>{subjectName(a.subjectId)} · {data.faculty.find(f=>f.id===a.facultyId)?.name} · {a.members.length} students</li>)}</ul></div>}
    {type==='reassign'&&<label className="fm-field"><span>Replacement faculty</span><ManagementSelect required value={facultyId} onChange={e=>setFacultyId(e.target.value)}><option value="">Choose faculty</option>{data.faculty.filter(f=>f.id!==record.facultyId&&f.accountStatus==='ACTIVE'&&f.eligibleSubjectIds.includes(record.subjectId)).map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</ManagementSelect></label>}
    <label className="fm-field"><span>Reason</span><textarea required value={reason} onChange={e=>setReason(e.target.value)} autoFocus/></label>
  </fieldset><footer className="fm-panel-footer"><button type="button" className="fm-btn" disabled={busy} onClick={onClose}>Cancel</button><button className="fm-btn fm-primary" disabled={busy||!reason.trim()}>{busy?'Saving…':'Confirm change'}</button></footer></form></FacultyPanel>
}

