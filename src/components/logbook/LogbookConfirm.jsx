import { useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import './LogbookConfirm.css'

/** Reusable confirmation; modal mode opens above the current drawer in the native top layer.
 * @param {{title:string, children?:import('react').ReactNode, onConfirm:Function, onCancel:Function, busy?:boolean, confirmLabel?:string, modal?:boolean, theme?:string}} props
 */
export default function LogbookConfirm({ title, children, onConfirm, onCancel, busy = false, confirmLabel = 'Confirm', modal = false, theme }) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => {
    if (!modal) { ref.current?.focus(); ref.current?.scrollIntoView({ block: 'nearest' }); return }
    const previous = document.activeElement
    const node = ref.current
    node.showModal()
    return () => { node.close(); if (previous?.isConnected) previous.focus() }
  }, [modal])
  if (modal) return createPortal(<dialog ref={ref} className="logbook-scope lb-confirm-modal" data-theme={theme} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); if (!busy) onCancel() }}
    onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!busy) onCancel() } }}>
    <h2 id={titleId}>{title}</h2>{children}<div className="lb-actions">
      <button type="button" className="lb-btn" autoFocus disabled={busy} onClick={onCancel}>Cancel</button>
      <button type="button" className="lb-btn lb-primary" disabled={busy} onClick={onConfirm}>{busy ? 'Saving…' : confirmLabel}</button>
    </div>
  </dialog>, document.body)
  return <section className="lb-alert lb-confirm" role="alert" tabIndex={-1} ref={ref}>
    <strong>{title}</strong><div>{children}</div><div className="lb-actions"><button type="button" className="lb-btn" disabled={busy} onClick={onCancel}>Cancel</button><button type="button" className="lb-btn lb-primary" disabled={busy} onClick={onConfirm}>{busy ? 'Saving…' : confirmLabel}</button></div>
  </section>
}
