import { useEffect, useId, useRef } from 'react'
import { X, ClipboardList, Trash2 } from 'lucide-react'
import './StudentWorkspacePanel.css'

/** Centred native modal: traps focus, keeps the background inert and restores the trigger on close. */
export default function StudentWorkspacePanel({ title, subtitle, busy, onClose, children, variant }) {
  const dialog = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const node = dialog.current
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    node.showModal()
    return () => {
      node.close()
      document.body.style.overflow = overflow
      if (previous?.isConnected) previous.focus()
    }
  }, [])
  return <dialog ref={dialog} className={`sm-workspace-panel${variant === 'student' ? ' sm-student-popup' : variant === 'destructive' ? ' sm-confirm-popup' : ''}`} aria-labelledby={titleId} aria-busy={busy}
    onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <header className="sm-workspace-heading"><div className="sm-popup-title"><span className="sm-popup-icon" aria-hidden="true">{variant === 'destructive' ? <Trash2 size={22}/> : <ClipboardList size={22}/>}</span><div><h2 id={titleId}>{title}</h2>{variant !== 'student' && variant !== 'destructive' && <p>{subtitle}</p>}</div></div><button type="button" className="lb-icon-btn" aria-label="Close popup" disabled={busy} onClick={onClose}><X size={20} /></button></header>
    {children}
  </dialog>
}
