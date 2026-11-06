import StudentWorkspacePanel from '../students/StudentWorkspacePanel'
import { createContext, useContext, useEffect, useState } from 'react'
import './FacultyPanel.css'
const CloseContext=createContext(()=>{})
export function FacultyCancelButton({disabled}) {
  const close=useContext(CloseContext)
  return <button type="button" className="fm-btn" disabled={disabled} onClick={close}>Cancel</button>
}

/** Shared native-dialog shell. Reuses existing focus, Escape, scroll lock and restore behaviour. */
export default function FacultyPanel({ title, subtitle, busy, onClose, confirmClose = false, children }) {
  const [discard,setDiscard]=useState(false)
  useEffect(()=>{ document.querySelector('.fm-workspace dialog[open] .fm-panel-body :is(input,select,textarea)')?.focus() },[])
  const close=()=>{ if(discard)setDiscard(false);else if(confirmClose)setDiscard(true);else onClose() }
  return <StudentWorkspacePanel title={title} subtitle={subtitle} busy={busy} onClose={close}>{discard?<><div className="fm-panel-body"><h3>Discard unsaved changes?</h3><p>Your saved records will be kept. Changes in this form have not been saved.</p></div><footer className="fm-panel-footer"><button autoFocus className="fm-btn" onClick={()=>setDiscard(false)}>Keep editing</button><button className="fm-btn fm-primary" onClick={onClose}>Discard changes</button></footer></>:<CloseContext.Provider value={close}>{children}</CloseContext.Provider>}</StudentWorkspacePanel>
}

