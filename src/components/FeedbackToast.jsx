import { useEffect, useLayoutEffect, useRef } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import './FeedbackToast.css'

/** Non-blocking feedback. Remount with a new key for each notification.
 * @param {{message:string,onClose:Function,duration?:number, placement?:'bottom-right'|'top-right'}} props
 */
export default function FeedbackToast({ message, onClose, duration = 4000, placement = 'bottom-right' }) {
  const toastRef = useRef(null)
  useLayoutEffect(() => {
    if (placement !== 'top-right') return
    const toast = toastRef.current, navbar = document.querySelector('.vx-topbar')
    const position = () => {
      const gap = parseFloat(getComputedStyle(toast).getPropertyValue('--s-3')) || 12
      toast.style.setProperty('top', Math.max(0, navbar?.getBoundingClientRect().bottom || 0) + gap + 'px')
      toast.style.setProperty('bottom', 'auto')
    }
    position()
    const observer = new ResizeObserver(position)
    if (navbar) observer.observe(navbar)
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    return () => { observer.disconnect(); window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true) }
  }, [placement])
  useEffect(() => { const timer = window.setTimeout(onClose, duration); return () => window.clearTimeout(timer) }, [onClose, duration])
  return <div ref={toastRef} className="feedback-toast"><CheckCircle2 size={20} aria-hidden="true" /><span role="status" aria-live="polite">{message}</span><button type="button" aria-label="Close notification" onClick={onClose}><X size={16}/></button></div>
}
