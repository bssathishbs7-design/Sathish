import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './SaveChangesDialog.css'

/**
 * Reusable save/discard/cancel confirmation. Native modal supplies focus trapping.
 * @param {{reference?: string, theme?: string, busy?: boolean, error?: string,
 * onSave: () => void, onDiscard?: () => void, onCancel: () => void, title?:string, description?:string, saveLabel?:string, cancelLabel?:string, busyLabel?:string, danger?:boolean, className?:string, children?:import("react").ReactNode}} props
 */
export default function SaveChangesDialog({ reference, theme, busy, error, onSave, onDiscard, onCancel, title = "Exit assessment?", description = "Save your progress or discard your unsaved changes.", saveLabel = "Save as Draft", cancelLabel = "Cancel", busyLabel = "Saving...", danger = false, className = "", children }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    const dialog = dialogRef.current
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])
  return createPortal(
    <dialog ref={dialogRef} className={`save-changes-dialog logbook-scope ${className}`} data-theme={theme}
      aria-labelledby="save-changes-title" aria-describedby="save-changes-description" aria-busy={busy}
      onCancel={event => { event.preventDefault(); if (!busy) onCancel() }}>
      <h2 id="save-changes-title">{title}</h2>
      <p id="save-changes-description">{description}</p>
      {reference && <p className="save-changes-reference">Assessment ID <strong>{reference}</strong></p>}
      {children}
      {error && <p className="save-changes-error" role="alert">{error}</p>}
      <div className="save-changes-actions">
        <button type="button" disabled={busy} onClick={onCancel} autoFocus={!children}>{cancelLabel}</button>
        {onDiscard && <button type="button" className="is-discard" disabled={busy} onClick={onDiscard}>Discard</button>}
        <button type="button" className={danger ? "is-discard" : "is-save"} disabled={busy} onClick={onSave}>{busy ? busyLabel : saveLabel}</button>
      </div>
    </dialog>, document.body,
  )
}
