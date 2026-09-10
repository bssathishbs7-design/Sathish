import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './PracticeLeaveDialog.css'

/** Confirmation for leaving a saved draft. Callbacks close the dialog or save and navigate. */
export default function PracticeLeaveDialog({ onClose, onSave }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])

  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dialog = dialogRef.current
    dialog.querySelector('[data-initial-focus]').focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
      }
      if (event.key !== 'Tab') return
      const buttons = [...dialog.querySelectorAll('button:not(:disabled)')]
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    dialog.addEventListener('keydown', handleKeyDown)
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])

  return createPortal(
    <div className="start-practice-confirm-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <div ref={dialogRef} className="start-practice-confirm-modal practice-leave-dialog" role="dialog" aria-modal="true" aria-labelledby="practice-leave-title" aria-describedby="practice-leave-description">
        <div className="practice-leave-dialog-heading">
          <strong id="practice-leave-title">Leave practice?</strong>
          <button type="button" className="practice-leave-dialog-close" aria-label="Close" title="Close" onClick={onClose}><X size={18} /></button>
        </div>
        <p id="practice-leave-description">Your progress will be saved. You can return and continue later.</p>
        <div className="start-practice-confirm-actions">
          <button type="button" className="is-secondary" data-initial-focus onClick={onClose}>Continue practice</button>
          <button type="button" className="is-primary" onClick={onSave}>Save and leave</button>
        </div>
      </div>
    </div>, document.body,
  )
}
