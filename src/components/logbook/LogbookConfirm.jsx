import { useEffect, useRef } from 'react'
import './LogbookConfirm.css'

/** Inline confirmation remains inside the current dialog's focus boundary. */
export default function LogbookConfirm({ title, children, onConfirm, onCancel, busy = false, confirmLabel = 'Confirm' }) {
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus(); ref.current?.scrollIntoView({ block: 'nearest' }) }, [])
  return <section className="lb-alert lb-confirm" role="alert" tabIndex={-1} ref={ref}>
    <strong>{title}</strong><div>{children}</div><div className="lb-actions"><button type="button" className="lb-btn" disabled={busy} onClick={onCancel}>Cancel</button><button type="button" className="lb-btn lb-primary" disabled={busy} onClick={onConfirm}>{busy ? 'Saving…' : confirmLabel}</button></div>
  </section>
}
