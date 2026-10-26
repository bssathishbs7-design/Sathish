import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import './CopyIdBadge.css'

/** Compact, keyboard-accessible copy badge. Copies only the supplied value.
 * @param {{value:string, label?:string, compactFeedback?:boolean}} props
 */
export default function CopyIdBadge({ value, label = 'assessment ID', compactFeedback = false }) {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = async () => {
    setBusy(true)
    try {
      await navigator.clipboard.writeText(value)
      setStatus('Copied')
    } catch {
      setStatus('Unable to copy. Select the text to copy it manually.')
    } finally {
      setBusy(false)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setStatus(''), 3000)
    }
  }
  return <span className="copy-id-badge-wrap">
    <span className="copy-id-badge"><span>{value}</span><button type="button" onClick={copy} disabled={busy || !value} aria-label={status === 'Copied' ? label + ' copied' : 'Copy ' + label + ' ' + value} title={status || 'Copy ' + label}>{status === 'Copied' ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}</button></span>
    <span className={compactFeedback ? 'copy-id-feedback-sr' : 'copy-id-feedback'} role="status">{status}</span>
  </span>
}
