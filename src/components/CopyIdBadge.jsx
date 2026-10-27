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
  const textRef = useRef(null)
  const select = event => {
    event?.stopPropagation()
    if (!textRef.current) return
    const range = document.createRange()
    range.selectNodeContents(textRef.current)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  }
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = async event => {
    event.stopPropagation()
    setBusy(true)
    try {
      await navigator.clipboard.writeText(value)
      setStatus('Copied')
    } catch {
      select()
      setStatus('Unable to copy. Select the ID to copy it manually.')
    } finally {
      setBusy(false)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setStatus(''), 1600)
    }
  }
  return <span className="copy-id-badge-wrap">
    <span className={`copy-id-badge${/^(DRF-|[A-Z0-9]{2,8}-(SA|AP|BP|QB|AQ|AS)-|ASST|INS-)/.test(value) ? ' is-standard-id' : ''}${String(value).startsWith('DRF-') ? ' is-draft' : ''}`} onKeyDown={event => event.stopPropagation()}><span ref={textRef} onClick={select}>{value}</span><button type="button" onClick={copy} disabled={busy || !value} aria-label={status === 'Copied' ? 'Copied' : 'Copy ' + label + ' ' + value} title={status || 'Copy ' + label}>{status === 'Copied' ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}</button></span>
    <span className={compactFeedback ? 'copy-id-feedback-sr' : 'copy-id-feedback'} role="status">{status}</span>
  </span>
}
