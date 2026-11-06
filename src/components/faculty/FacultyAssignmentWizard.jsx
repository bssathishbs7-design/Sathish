import ManagementSelect from '../ManagementSelect'
import { useRef, useState } from 'react'
import FacultyPanel, { FacultyCancelButton } from './FacultyPanel'
import FacultyRoster from './FacultyRoster'
import { normaliseAssignment } from '../../services/facultyAssignments'
import { contexts, previewAssignment } from '../../services/facultyAcademicContext'
import { SGT_VALUES, SUBJECT_CATALOG, localDate, liveState, subjectName } from '../../services/facultyModel'
import { STUDY_YEARS, monthStart, monthEnd, calendarLabel } from '../../services/studentCalendar'
import './FacultyAssignmentWizard.css'

/** Four-step assignment editor. Every publish sends the exact reviewed source fingerprint. */
export default function FacultyAssignmentWizard({ facultyId, assignment, data, directory, onSave, onClose }) {
  const [draft,setDraft]=useState(()=>normaliseAssignment(assignment || {facultyId,studyYear:'First Year',scopeType:'WHOLE_BATCH'},data.institutionId))
  const [step,setStep]=useState(1),[review,setReview]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  const heading=useRef(null)
  const initialDraft=useRef(JSON.stringify(draft))
  const selectedFaculty=data.faculty.find(f=>f.id===draft.facultyId)
  const options=contexts(directory,draft.studyYear)
  const period=draft.calendarRefs[0]?draft.calendarRefs[0].fromMonth+'/'+draft.calendarRefs[0].toMonth:''
  const periods=[...new Set(options.map(c=>c.fromMonth+'/'+c.toMonth))]
  const [chosenPeriod,setChosenPeriod]=useState(period)
  const preview=previewAssignment(draft,data,directory)
  const selected=preview.members.map(m=>m.studentId)
  const change=(values,reset=false)=>{setDraft(d=>({...d,...values,...(reset?{excludedStudentIds:[],exclusionReason:''}:{})}));setReview(null);setError('')}
  const goto=value=>{setStep(value);setTimeout(()=>heading.current?.focus(),0)}
  const setPeriod=value=>{
    setChosenPeriod(value); const [from,to]=value.split('/')
    change({calendarRefs:[],startsOn:from?(monthStart(from)>localDate()?monthStart(from):localDate()):'',endsOn:to?monthEnd(to):''},true)
  }
  const toggleBatch=c=>change({calendarRefs:draft.calendarRefs.some(r=>r.batchId===c.batchId)?draft.calendarRefs.filter(r=>r.batchId!==c.batchId):[...draft.calendarRefs,c]},true)
  const next=()=>{
    setError('')
    if(step===1&&(!draft.facultyId||!draft.calendarRefs.length)) return setError('Choose a faculty member, academic period and at least one compatible batch.')
    if(step===2&&(!draft.subjectId||(draft.roleType==='CO_TEACHER'&&!draft.primaryAssignmentId)||(draft.scopeType==='SGT'&&!draft.selectedSgtValues.length))) return setError('Choose a subject, teaching role and complete its scope.')
    if(step===3) {
      if(!selected.length) return setError('There are no selected eligible students.')
      if(draft.excludedStudentIds.length&&!draft.exclusionReason.trim()) return setError('Explain the intentional exclusions before continuing.')
      setReview(preview)
    }
    goto(step+1)
  }
  const save=async type=>{
    setBusy(true);setError('')
    try {await onSave({type,draft,fingerprint:review?.fingerprint})} catch(failure){setError(failure.message)} finally{setBusy(false)}
  }
  const primaryOptions=data.assignments.filter(a=>a.roleType==='PRIMARY'&&a.facultyId!==draft.facultyId&&a.subjectId===draft.subjectId&&a.studyYear===draft.studyYear&&['ACTIVE','SCHEDULED'].includes(liveState(a)))
  return <FacultyPanel title={assignment&&assignment.state!=='DRAFT'?'Revise teaching assignment':'Assign students'} subtitle="A reviewed roster for one subject and academic period" busy={busy} onClose={onClose} confirmClose={JSON.stringify(draft)!==initialDraft.current}>
    <ol className="fm-steps" aria-label="Assignment progress">{['Teaching context','Subject and scope','Review students','Publish'].map((name,i)=><li key={name} aria-current={step===i+1?'step':undefined}><span>{i+1}</span>{name}</li>)}</ol>
    <fieldset className="fm-panel-body" disabled={busy}>
      <div className="fm-context"><strong>{selectedFaculty?.name||'Choose faculty'}</strong><span>{draft.studyYear}{chosenPeriod?' · '+calendarLabel(chosenPeriod):''}{draft.subjectId?' · '+subjectName(draft.subjectId):''}</span></div>
      <h3 ref={heading} tabIndex={-1} className="fm-step-title">{['Choose the teaching context','Set the teaching responsibility','Check the student roster','Review and publish'][step-1]}</h3>
      {error&&<p role="alert" className="fm-error">{error}</p>}
      {step===1&&<><div className="fm-form-grid">
        <label className="fm-field"><span>Faculty</span><ManagementSelect value={draft.facultyId} onChange={e=>change({facultyId:e.target.value,subjectId:'',primaryAssignmentId:''},true)}><option value="">Choose faculty</option>{data.faculty.filter(f=>f.accountStatus==='ACTIVE').map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</ManagementSelect></label>
        <label className="fm-field"><span>Course</span><input value="MBBS" readOnly/></label>
        <label className="fm-field"><span>Study year</span><ManagementSelect value={draft.studyYear} onChange={e=>{setChosenPeriod('');change({studyYear:e.target.value,calendarRefs:[],subjectId:'',startsOn:'',endsOn:''},true)}}>{STUDY_YEARS.map(y=><option key={y}>{y}</option>)}</ManagementSelect></label>
        <label className="fm-field"><span>Academic period</span><ManagementSelect value={chosenPeriod} onChange={e=>setPeriod(e.target.value)}><option value="">Choose exact dates</option>{periods.map(p=><option key={p} value={p}>{calendarLabel(p)}</option>)}</ManagementSelect></label>
      </div><fieldset className="fm-checks"><legend>Teaching batches</legend>{options.filter(c=>c.fromMonth+'/'+c.toMonth===chosenPeriod).map(c=><label key={c.batchId}><input type="checkbox" checked={draft.calendarRefs.some(r=>r.batchId===c.batchId)} onChange={()=>toggleBatch(c)}/>Batch {c.batchId}</label>)}</fieldset>{!chosenPeriod&&<p className="fm-empty">Choose an academic period to see compatible teaching batches.</p>}<p className="fm-note">Batch calendars come from Student Management. Different date ranges require separate assignments.</p></>}
      {step===2&&<><div className="fm-form-grid">
        <label className="fm-field"><span>Subject</span><ManagementSelect value={draft.subjectId} onChange={e=>change({subjectId:e.target.value,primaryAssignmentId:''},true)}><option value="">Choose an eligible subject</option>{SUBJECT_CATALOG.filter(s=>s.years.includes(draft.studyYear)&&selectedFaculty?.eligibleSubjectIds.includes(s.id)).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</ManagementSelect></label>
        <label className="fm-field"><span>Teaching role</span><ManagementSelect value={draft.roleType} onChange={e=>change({roleType:e.target.value,primaryAssignmentId:''})}><option value="PRIMARY">Primary faculty</option><option value="CO_TEACHER">Co-teacher</option></ManagementSelect></label>
        {draft.roleType==='CO_TEACHER'&&<label className="fm-field fm-full"><span>Primary assignment</span><ManagementSelect value={draft.primaryAssignmentId} onChange={e=>change({primaryAssignmentId:e.target.value})}><option value="">Choose primary responsibility</option>{primaryOptions.map(a=><option key={a.id} value={a.id}>{data.faculty.find(f=>f.id===a.facultyId)?.name} · {a.members.length} students · {a.startsOn} to {a.endsOn}</option>)}</ManagementSelect><small>Co-teacher students and dates must be covered by this primary.</small></label>}
        <label className="fm-field"><span>Delivery scope</span><ManagementSelect value={draft.scopeType} onChange={e=>change({scopeType:e.target.value,selectedSgtValues:[]},true)}><option value="WHOLE_BATCH">Whole batch</option><option value="SGT">Small group teaching (SGT)</option></ManagementSelect></label>
        <label className="fm-field"><span>Effective start</span><input type="date" value={draft.startsOn} onChange={e=>change({startsOn:e.target.value})}/></label>
        <label className="fm-field"><span>Effective end</span><input type="date" value={draft.endsOn} onChange={e=>change({endsOn:e.target.value})}/></label>
      </div>{draft.scopeType==='SGT'?<fieldset className="fm-checks"><legend>SGT groups</legend>{SGT_VALUES.map(s=><label key={s}><input type="checkbox" checked={draft.selectedSgtValues.includes(s)} onChange={()=>change({selectedSgtValues:draft.selectedSgtValues.includes(s)?draft.selectedSgtValues.filter(v=>v!==s):[...draft.selectedSgtValues,s]},true)}/>{s}</label>)}</fieldset>:<p className="fm-note">Whole batch includes all eligible students, including students without an SGT.</p>}</>}
      {step===3&&<>{draft.scopeType==='SGT'&&<div className="fm-toolbar"><button type="button" className="fm-btn" onClick={()=>change({excludedStudentIds:[],exclusionReason:''})}>Select all {preview.eligible.length} eligible students</button><span>{draft.excludedStudentIds.length} intentionally excluded</span></div>}
        <FacultyRoster members={preview.eligible} excluded={preview.excluded} selected={selected} readOnly={draft.scopeType==='WHOLE_BATCH'} onToggle={id=>change({excludedStudentIds:draft.excludedStudentIds.includes(id)?draft.excludedStudentIds.filter(v=>v!==id):[...draft.excludedStudentIds,id]})}/>
        {draft.excludedStudentIds.length>0&&<label className="fm-field"><span>Reason for intentional exclusions</span><textarea value={draft.exclusionReason} onChange={e=>change({exclusionReason:e.target.value})}/></label>}
        {preview.eligible.some(m=>!m.restrictionVerified)&&<p className="fm-note">Detention restrictions are not recorded for some students. Current eligibility uses their active enrolment; confirm restrictions with Student Management before relying on this roster.</p>}
      </>}
      {step===4&&review&&<><div className="fm-review-summary"><strong>{review.members.length} students</strong><span>{subjectName(draft.subjectId)} · {draft.scopeType==='WHOLE_BATCH'?'Whole batch':'SGT '+draft.selectedSgtValues.join(', ')} · {draft.roleType==='PRIMARY'?'Primary faculty':'Co-teacher'}</span><span>{draft.startsOn} to {draft.endsOn}</span></div>
        {review.errors.length>0?<div role="alert" className="fm-error"><strong>Resolve before publishing</strong><ul>{review.errors.map(e=><li key={e}>{e}</li>)}</ul></div>:<p className="fm-note">The selected roster and source versions will be checked again when you publish.</p>}
        <FacultyRoster members={review.members} excluded={review.excluded} readOnly/>
        <button type="button" className="fm-btn" onClick={()=>{setReview(preview);setError('')}}>Refresh review</button>
      </>}
    </fieldset><footer className="fm-panel-footer">{step===1?<FacultyCancelButton disabled={busy}/>:<button type="button" className="fm-btn" disabled={busy} onClick={()=>goto(step-1)}>Back</button>}{(!assignment||assignment.state==='DRAFT')&&<button type="button" className="fm-btn" disabled={busy||!draft.facultyId} onClick={()=>save('draft')}>Save draft</button>}{step<4?<button type="button" className="fm-btn fm-primary" disabled={busy} onClick={next}>Continue</button>:<button type="button" className="fm-btn fm-primary" disabled={busy||!review?.members.length||Boolean(review?.errors.length)} onClick={()=>save('publish')}>{busy?'Saving…':'Publish assignment'}</button>}</footer>
  </FacultyPanel>
}

