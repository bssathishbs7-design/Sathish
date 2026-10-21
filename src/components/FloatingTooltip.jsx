import { useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './FloatingTooltip.css'

/** @param {{content: import('react').ReactNode, className?: string, children: import('react').ReactNode, interactive?:boolean, label?:string}} props */
export default function FloatingTooltip({ content, className, children, interactive = false, label }) {
  const id = useId()
  const trigger = useRef(null)
  const tip = useRef(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const pinned = useRef(false)
  const dismiss = () => { pinned.current = false; setOpen(false) }

  useLayoutEffect(() => {
    if (!open) return undefined
    const place = () => {
      const anchor = trigger.current.getBoundingClientRect()
      const box = tip.current.getBoundingClientRect()
      const gap = 8
      const computed = getComputedStyle(trigger.current)
      const theme = Object.fromEntries(['--s-1', '--s-2', '--s-3', '--s-4', '--border', '--r-sm', '--r-pill', '--surface-card', '--surface-soft', '--text-body', '--text-strong', '--text-brand', '--shadow-soft', '--fs-micro', '--butter', '--sky'].map(key => [key, computed.getPropertyValue(key)]).filter(([, value]) => value.trim()))
      // Portals sit outside the page theme; preserve its semantic tokens.
      setPosition({
        theme,
        left: Math.max(gap, Math.min(anchor.left + (anchor.width - box.width) / 2, window.innerWidth - box.width - gap)),
        top: anchor.top >= box.height + gap * 2 ? anchor.top - box.height - gap : Math.min(anchor.bottom + gap, window.innerHeight - box.height - gap),
      })
    }
    const onKey = (event) => { if (event.key === 'Escape') dismiss() }
    const onOutside = event => { if (!trigger.current?.contains(event.target) && !tip.current?.contains(event.target)) dismiss() }
    const onViewport = interactive ? place : dismiss
    place()
    window.addEventListener('scroll', onViewport, true)
    window.addEventListener('resize', onViewport)
    window.addEventListener('keydown', onKey)
    if (interactive) document.addEventListener('pointerdown', onOutside)
    return () => {
      window.removeEventListener('scroll', onViewport, true)
      window.removeEventListener('resize', onViewport)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onOutside)
    }
  }, [open, content, interactive])

  // Hover, focus and click can fire while already open. Keep the measured
  // position in that case so pinning an existing tooltip does not hide it.
  const show = () => { if (!open) setPosition(null); setOpen(true) }
  const Trigger = interactive ? 'button' : 'span'
  return <>
    <Trigger ref={trigger} type={interactive ? 'button' : undefined} aria-label={label} className={className} tabIndex={0} aria-describedby={open ? id : undefined}
      onClick={interactive ? event => { event.stopPropagation(); if (pinned.current) dismiss(); else { pinned.current = true; show() } } : undefined}
      onMouseEnter={show} onMouseLeave={() => { if (!pinned.current) setOpen(false) }} onFocus={show} onBlur={dismiss}>
      {children}
    </Trigger>
    {open && createPortal(<div ref={tip} id={id} role="tooltip" className="floating-tooltip"
      style={{ ...position?.theme, left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? 'visible' : 'hidden' }}>{content}</div>, document.body)}
  </>
}
