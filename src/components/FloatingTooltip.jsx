import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './FloatingTooltip.css'

/** @param {{content: import('react').ReactNode, className?: string, children: import('react').ReactNode, interactive?:boolean, label?:string, clickOnly?:boolean}} props */
export default function FloatingTooltip({ content, className, children, interactive = false, label, clickOnly = false }) {
  const id = useId()
  const trigger = useRef(null)
  const tip = useRef(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const pinned = useRef(false)
  const closeTimer = useRef(null)
  const cancelClose = useCallback(() => { clearTimeout(closeTimer.current); closeTimer.current = null }, [])
  const dismiss = useCallback(() => { cancelClose(); pinned.current = false; setOpen(false) }, [cancelClose])
  const leave = () => {
    if (pinned.current) return
    cancelClose()
    // Use the trigger's resolved Medsy hover duration as the crossing grace period.
    const duration = getComputedStyle(trigger.current).transitionDuration.split(',')[0].trim()
    const delay = (parseFloat(duration) || 0) * (duration.endsWith('ms') ? 1 : 1000)
    closeTimer.current = setTimeout(() => {
      if (!pinned.current && !tip.current?.contains(document.activeElement)) setOpen(false)
    }, delay)
  }
  const onBlur = event => {
    if (trigger.current?.contains(event.relatedTarget) || tip.current?.contains(event.relatedTarget)) return
    dismiss()
  }
  useEffect(() => () => clearTimeout(closeTimer.current), [])

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
  }, [open, content, interactive, dismiss])

  // Hover, focus and click can fire while already open. Keep the measured
  // position in that case so pinning an existing tooltip does not hide it.
  const show = () => { cancelClose(); if (!open) setPosition(null); setOpen(true) }
  const Trigger = interactive ? 'button' : 'span'
  return <>
    <Trigger ref={trigger} type={interactive ? 'button' : undefined} aria-label={label} className={className} tabIndex={0} aria-describedby={open ? id : undefined}
      onClick={interactive ? event => { event.stopPropagation(); if (pinned.current) dismiss(); else { pinned.current = true; show() } } : undefined}
      onMouseEnter={clickOnly ? undefined : show} onMouseLeave={leave} onFocus={clickOnly ? undefined : show} onBlur={onBlur}>
      {children}
    </Trigger>
    {open && createPortal(<div ref={tip} id={id} role="tooltip" className={`floating-tooltip${interactive ? ' is-interactive' : ''}`}
      onMouseEnter={cancelClose} onMouseLeave={leave} onFocus={cancelClose} onBlur={onBlur}
      style={{ ...position?.theme, left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? 'visible' : 'hidden' }}>{content}</div>, document.body)}
  </>
}
