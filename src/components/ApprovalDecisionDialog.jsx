import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './ApprovalDecisionDialog.css'
import '../styles/medsy/question-sort-tokens.css'

/** Shared review confirmation. Traps/restores focus; the caller owns busy/error state. */
export default function ApprovalDecisionDialog({ title, children, onConfirm, onClose, busy = false, error = '', theme = 'light' }) {
  const ref = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    return () => { document.body.style.overflow = overflow; previous?.focus?.() }
  }, [])
  const keyDown = event => {
    if (event.key === 'Escape') { event.stopPropagation(); if (!busy) onClose() }
    if (event.key !== 'Tab') return
    const buttons = [...ref.current.querySelectorAll('button:not(:disabled), [tabindex="0"]')]
    if (!buttons.length) { event.preventDefault(); return }
    const first = buttons[0], last = buttons.at(-1)
    if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first.focus() }
  }
  return createPortal(<div className={`approval-queue-scope aq-confirm-backdrop ${theme === 'dark' ? 'theme-dark' : ''}`} data-theme={theme}>
    <section className="aq-confirm" role="dialog" aria-modal="true" aria-labelledby="approval-decision-title" aria-busy={busy} tabIndex={-1} ref={ref} onKeyDown={keyDown}>
      <h2 id="approval-decision-title">{title}</h2><div>{children}</div>{error && <p role="alert">{error}</p>}
      <footer><button disabled={busy} onClick={onClose}>Cancel</button><button disabled={busy} onClick={onConfirm}>{busy ? 'Saving…' : 'Confirm decision'}</button></footer>
    </section>
  </div>, document.body)
}
