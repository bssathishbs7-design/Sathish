import { useEffect, useRef, useState } from 'react'
import { Maximize, Minimize } from 'lucide-react'
import './WorkspaceFullscreenButton.css'

/** Browser fullscreen control; tracks native Escape and external fullscreen changes. */
export default function WorkspaceFullscreenButton() {
  const [active, setActive] = useState(Boolean(document.fullscreenElement))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  useEffect(() => {
    const update = () => setActive(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])
  const supported = Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen)
  const label = active ? 'Exit fullscreen' : 'Enter fullscreen'
  const toggle = async () => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch { setError('Unable to change fullscreen. Please try again.') }
    finally { lock.current = false; setBusy(false) }
  }
  const Icon = active ? Minimize : Maximize
  return <span className="workspace-fullscreen-control">
    <button type="button" className="create-assessment-theme-btn" onClick={toggle} disabled={busy || !supported}
      aria-label={label} aria-pressed={active} aria-busy={busy} title={supported ? label : 'Fullscreen is unavailable in this browser'}>
      <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
    </button>
    {error && <span className="workspace-fullscreen-error" role="alert">{error}</span>}
  </span>
}
