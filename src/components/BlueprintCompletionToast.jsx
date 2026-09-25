import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import './BlueprintCompletionToast.css'

/** Announces an enabled Blueprint's transition to complete, without replaying on tab changes.
 * @param {{enabled: boolean, complete: boolean}} props
 */
export default function BlueprintCompletionToast({ enabled, complete }) {
  const [previous, setPrevious] = useState({ enabled, complete })
  const [visible, setVisible] = useState(false)
  if (previous.enabled !== enabled || previous.complete !== complete) {
    setPrevious({ enabled, complete })
    setVisible(Boolean(enabled && previous.enabled && complete && !previous.complete))
  }
  useEffect(() => {
    if (!visible) return undefined
    const timer = window.setTimeout(() => setVisible(false), 3000)
    return () => window.clearTimeout(timer)
  }, [visible])

  return createPortal(<div className="blueprint-completion-toast-region qb-sort-scope">
    <div role="status" aria-live="polite" aria-atomic="true">
      {visible && <div className="blueprint-completion-toast">
        <Check className="blueprint-completion-toast-icon" size={20} aria-hidden="true" />
        <div><strong>Blueprint complete!</strong><p>All required questions have been selected.</p></div>
      </div>}
    </div>
    {visible && <button className="blueprint-completion-toast-close" type="button" aria-label="Dismiss Blueprint completion message" onClick={() => setVisible(false)}><X size={16} aria-hidden="true" /></button>}
  </div>, document.body)
}
