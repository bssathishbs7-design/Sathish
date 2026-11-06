import ManagementMultiSelect from '../ManagementMultiSelect'
import ManagementSelect from '../ManagementSelect'
import { useRef, useState } from 'react'
import FacultyPanel, { FacultyCancelButton } from './FacultyPanel'
import { DESIGNATIONS, SUBJECT_CATALOG, profileErrors } from '../../services/facultyModel'
import './FacultyProfileEditor.css'

/** Controlled profile editor; profile mutations never include teaching assignments. */
export default function FacultyProfileEditor({ profile, data, onSave, onClose }) {
  const [draft, setDraft] = useState(profile || { employeeId:'',name:'',email:'',phone:'',departmentId:'',designationId:'Assistant Professor',eligibleSubjectIds:[] })
  const [errors,setErrors] = useState({}), [error,setError] = useState(''), [busy,setBusy] = useState(false)
  const [step,setStep] = useState(1), [assignNext,setAssignNext] = useState(!profile)
  const initialDraft=useRef(JSON.stringify(draft))
  const change = (key,value) => { setDraft(d => ({...d,[key]:value})); setErrors(e => ({...e,[key]:''})) }
  const submit = async e => {
    e.preventDefault()
    const next=profileErrors(draft,data); setErrors(next)
    if(Object.keys(next).length) {setStep(1);return}
    if(step===1) {setStep(2);return}
    setBusy(true);setError('')
    try { await onSave({type:'profile',draft},assignNext) } catch(failure) {setError(failure.message)} finally {setBusy(false)}
  }
  return <FacultyPanel title={profile ? 'Edit faculty' : 'Add faculty'} subtitle={step===1 ? 'Identity and teaching eligibility' : 'Review the profile before saving'} busy={busy} onClose={onClose} confirmClose={JSON.stringify(draft)!==initialDraft.current}>
    <form className="fm-dialog-form" onSubmit={submit} noValidate><fieldset className="fm-panel-body" disabled={busy}>
      {error && <p role="alert" className="fm-error">{error}</p>}
      {step===1 ? <><div className="fm-form-grid">{[['employeeId','Employee ID'],['name','Full name'],['email','Institutional email'],['phone','Phone (optional)'],['departmentId','Department']].map(([key,label])=><label className="fm-field" key={key}><span>{label}</span><input autoFocus={key==='employeeId'} type={key==='email'?'email':key==='phone'?'tel':'text'} value={draft[key]} disabled={busy} onChange={e=>change(key,e.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key]?key+'-error':undefined}/>{errors[key]&&<small id={key+'-error'} className="fm-field-error">{errors[key]}</small>}</label>)}
      <label className="fm-field"><span>Designation</span><ManagementSelect value={draft.designationId} onChange={e=>change('designationId',e.target.value)}>{DESIGNATIONS.map(d=><option key={d}>{d}</option>)}</ManagementSelect></label></div>
      <ManagementMultiSelect label="Eligible teaching subjects" options={SUBJECT_CATALOG.map(subject=>({value:subject.id,label:subject.name}))} value={draft.eligibleSubjectIds} onChange={value=>change('eligibleSubjectIds',value)} disabled={busy} error={errors.eligibleSubjectIds}/>
      </> : <div className="fm-profile-review"><h3>{draft.name}</h3><dl>{[['Employee ID',draft.employeeId],['Email',draft.email],['Department',draft.departmentId],['Designation',draft.designationId],['Subjects',SUBJECT_CATALOG.filter(s=>draft.eligibleSubjectIds.includes(s.id)).map(s=>s.name).join(', ')]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p>Saving this profile preserves every teaching assignment.</p><label className="fm-inline-check"><input type="checkbox" checked={assignNext} onChange={e=>setAssignNext(e.target.checked)}/>Assign students after saving</label></div>}
      </fieldset><footer className="fm-panel-footer">{step===2?<button type="button" className="fm-btn" disabled={busy} onClick={()=>setStep(1)}>Back</button>:<FacultyCancelButton disabled={busy}/>}<button className="fm-btn fm-primary" disabled={busy}>{busy?'Saving…':step===1?'Review profile':'Save faculty'}</button></footer></form>
  </FacultyPanel>
}

