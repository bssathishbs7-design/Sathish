import { useState } from 'react'
import { Database, X, RefreshCw } from 'lucide-react'
import SaveChangesDialog from './SaveChangesDialog'
import { installAssessmentDemo, isDemoRecord } from '../services/assessmentDemo/storage'
import './AssessmentDemoTools.css'

/** Development-only fixture launcher. Never mounted in production unless explicitly enabled. */
export default function AssessmentDemoTools({initialError=''}) {
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(initialError)
 const [selected,setSelected]=useState('demo-assessment-practice-live')
 if(/online-(practice|proctored)-exam/.test(location.pathname))return null
 const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}}
 const rows=[...read('vx-assessment-drafts'),...read('vx-assessment-published')].filter(isDemoRecord)
 const current=rows.find(row=>row.id===selected)||rows[0]
 const go=(path,kind)=>{
  if(!current)return
  if(kind==='create'){
   localStorage.setItem('vx-create-assessment-setup',JSON.stringify({...current.setup,sourceDraftId:current.id}))
   localStorage.setItem(`vx-create-assessment-questions:${current.id}`,JSON.stringify(current.questionRows))
   localStorage.setItem('vx-create-assessment-initial-tab','preview')
  }
  if(kind==='evaluation'||kind==='result'){
   sessionStorage.setItem('vx-assessment-evaluation-selected',JSON.stringify(current))
   sessionStorage.setItem('vx-assessment-evaluation-student',JSON.stringify({...current.students[0],evaluationStatus:'Completed'}))
   if(kind==='result')sessionStorage.setItem('vx-assessment-student-result-source','my-assessment')
   else sessionStorage.removeItem('vx-assessment-student-result-source')
  }
  if(kind==='controls')sessionStorage.setItem('vx-exam-controls-assessment',JSON.stringify(current))
  location.assign(path)
 }
 const refresh=async()=>{
  setBusy(true);setError('')
  try {installAssessmentDemo(localStorage,sessionStorage,{refresh:true});location.reload()}
  catch(failure){setError(failure.message||'Unable to load demo data.');setBusy(false)}
 }
 return <>
  <button className="assessment-demo-launcher" type="button" onClick={()=>setOpen(true)}><Database size={14} aria-hidden="true" />Demo data</button>
  {open&&<SaveChangesDialog className="assessment-demo-dialog" title="Assessment demo data" description="Local development examples. Refresh replaces demo records only; your other assessments are retained." onCancel={()=>setOpen(false)} cancelLabel={<X size={16} />} cancelAriaLabel="Close demo tools" error={error}>
   <div className="assessment-demo-links"><a href="/assessment/create">Faculty assessments</a><a href="/my-assessment">Student My Assessment</a></div>
   <label className="assessment-demo-select">Example assessment<select value={current?.id||''} onChange={event=>setSelected(event.target.value)}>{rows.map(row=><option key={row.id} value={row.id}>{row.assessmentName}</option>)}</select></label>
   <div className="assessment-demo-links">
    <button type="button" disabled={!current||current.status!=='Draft'} onClick={()=>go('/createassessment','create')}>Authoring / preview</button>
    <button type="button" disabled={!current?.studentResults} onClick={()=>go('/assessment/evaluation','evaluation')}>Evaluation</button>
    <button type="button" disabled={current?.resultStatus!=='Published'} onClick={()=>go('/assessment/assessmentstudentresult','result')}>Student result</button>
    <button type="button" disabled={!current||current.demoStage!=='live'} onClick={()=>go('/assessment/exam-controls','controls')}>Exam controls</button>
   </div>
   <p className="assessment-demo-help">Open My Assessment to enter practice or proctored exams through their normal instructions and start flow. Real proctoring restrictions remain enabled.</p>
   <button className="assessment-demo-refresh" type="button" disabled={busy} onClick={refresh}><RefreshCw size={14} aria-hidden="true" />{busy?'Refreshing…':'Refresh demo data and schedules'}</button>
  </SaveChangesDialog>}
 </>
}
