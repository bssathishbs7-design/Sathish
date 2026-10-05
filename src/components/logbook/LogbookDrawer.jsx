import { useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './LogbookDrawer.css'

/** Shared modal shell. Native dialog provides focus trapping and makes the app inert.
 * @param {{title:string, subtitle?:string, theme:string, onClose:Function, children:import('react').ReactNode, busy?:boolean, variant?:'drawer'|'form'|'approval'|'compact'}} props
 */
export default function LogbookDrawer({ title, subtitle, theme, onClose, children, busy = false, variant = 'drawer' }) {
  const dialog = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const previous = document.activeElement
    const node = dialog.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    node.showModal()
    return () => {
      node.close()
      document.body.style.overflow = overflow
      requestAnimationFrame(() => {
        if (previous?.isConnected && !previous.disabled && !['BODY', 'HTML'].includes(previous.tagName)) previous.focus()
        else { const fallback = document.querySelector('dialog[open] button:not(:disabled), .lb-page h1'); if (fallback) { fallback.setAttribute('tabindex', '-1'); fallback.focus() } }
      })
    }
  }, [])
  return createPortal(
    <dialog ref={dialog} className={`logbook-scope lb-drawer${variant === 'form' ? ' is-entry-form' : variant === 'approval' ? ' is-approval' : variant === 'compact' ? ' is-compact-dialog' : ''}`} data-theme={theme} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); event.stopPropagation(); if (!busy) onClose() }}
      onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!busy) onClose() } }}
      onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
      <div className="lb-drawer-panel">
        <header className="lb-drawer-head"><div>{!['approval', 'compact'].includes(variant) && <span className="lb-eyebrow">Logbook</span>}<h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="lb-icon-btn" aria-label={variant === 'compact' ? 'Close dialog' : 'Close drawer'} disabled={busy} onClick={onClose}><X size={20} /></button></header>
        {children}
      </div>
    </dialog>, document.body,
  )
}
