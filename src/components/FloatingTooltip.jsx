import { useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './FloatingTooltip.css'

/** @param {{content: string, className?: string, children: import('react').ReactNode}} props */
export default function FloatingTooltip({ content, className, children }) {
  const id = useId()
  const trigger = useRef(null)
  const tip = useRef(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)

  useLayoutEffect(() => {
    if (!open) return undefined
    const place = () => {
      const anchor = trigger.current.getBoundingClientRect()
      const box = tip.current.getBoundingClientRect()
      const gap = 8
      setPosition({
        left: Math.max(gap, Math.min(anchor.left + (anchor.width - box.width) / 2, window.innerWidth - box.width - gap)),
        top: anchor.top >= box.height + gap * 2 ? anchor.top - box.height - gap : Math.min(anchor.bottom + gap, window.innerHeight - box.height - gap),
      })
    }
    const dismiss = () => setOpen(false)
    const onKey = (event) => { if (event.key === 'Escape') dismiss() }
    place()
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, content])

  const show = () => { setPosition(null); setOpen(true) }
  return <>
    <span ref={trigger} className={className} tabIndex={0} aria-describedby={open ? id : undefined}
      onMouseEnter={show} onMouseLeave={() => setOpen(false)} onFocus={show} onBlur={() => setOpen(false)}>
      {children}
    </span>
    {open && createPortal(<div ref={tip} id={id} role="tooltip" className="floating-tooltip"
      style={{ left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? 'visible' : 'hidden' }}>{content}</div>, document.body)}
  </>
}
