import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './LogbookDrawer.css'

/** Shared modal shell. Native dialog provides focus trapping and makes the app inert.
 * @param {{title:string, subtitle?:string, theme:string, onClose:Function, children:import('react').ReactNode, busy?:boolean, variant?:'drawer'|'form'}} props
 */
export default function LogbookDrawer({ title, subtitle, theme, onClose, children, busy = false, variant = 'drawer' }) {
  const dialog = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    const node = dialog.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    node.showModal()
    return () => {
      node.close()
      document.body.style.overflow = overflow
      if (previous?.isConnected) previous.focus()
    }
  }, [])
  return createPortal(
    <dialog ref={dialog} className={`logbook-scope lb-drawer${variant === 'form' ? ' is-entry-form' : ''}`} data-theme={theme} aria-labelledby="lb-drawer-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
      <div className="lb-drawer-panel">
        <header className="lb-drawer-head"><div><span className="lb-eyebrow">Your learning record</span><h2 id="lb-drawer-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="lb-icon-btn" aria-label="Close drawer" disabled={busy} onClick={onClose}><X size={20} /></button></header>
        {children}
      </div>
    </dialog>, document.body,
  )
}
