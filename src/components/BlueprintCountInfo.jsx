import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'
import './BlueprintCountInfo.css'

/** Read-only planner breakdown. Heading is visible; label includes the cell's cognition level for accessibility. Entries are {category: string, count: number}[], or null for an invalid draft. */
export default function BlueprintCountInfo({ heading, label, entries }) {
  const id = useId()
  const trigger = useRef(null)
  const popup = useRef(null)
  const leaveTimer = useRef(null)
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const cancelLeave = () => clearTimeout(leaveTimer.current)
  const close = useCallback(() => {
    clearTimeout(leaveTimer.current)
    setOpen(false)
    setPinned(false)
  }, [])
  const leave = () => {
    if (!pinned && document.activeElement !== trigger.current) {
      leaveTimer.current = setTimeout(() => setOpen(false), 120)
    }
  }
  useEffect(() => () => clearTimeout(leaveTimer.current), [])

  useLayoutEffect(() => {
    if (!open) return
    const anchor = trigger.current.getBoundingClientRect()
    const panel = popup.current.getBoundingClientRect()
    const theme = getComputedStyle(trigger.current)
    setPosition({
      '--tooltip-surface': theme.getPropertyValue(trigger.current.closest('.theme-dark') ? '--color-surface' : '--app-surface'),
      '--tooltip-text': theme.getPropertyValue('--app-text'),
      left: Math.max(8, Math.min(anchor.right - panel.width, window.innerWidth - panel.width - 8)),
      top: anchor.bottom + panel.height + 8 < window.innerHeight
        ? anchor.bottom + 4 : Math.max(8, anchor.top - panel.height - 4),
    })
  }, [open, entries, heading])

  useEffect(() => {
    if (!open) return
    const outside = (event) => {
      if (!trigger.current?.contains(event.target) && !popup.current?.contains(event.target)) close()
    }
    const keydown = (event) => { if (event.key === 'Escape') close() }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', keydown)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', keydown)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open, close])

  return <>
    <button
      ref={trigger}
      type="button"
      className="blueprint-count-info"
      aria-label={`${label} category counts`}
      aria-describedby={open ? id : undefined}
      aria-expanded={open}
      onPointerEnter={(event) => { cancelLeave(); if (event.pointerType === 'mouse') setOpen(true) }}
      onPointerLeave={leave}
      onFocus={() => setOpen(true)}
      onBlur={close}
      onClick={() => { setOpen(!pinned); setPinned(!pinned) }}
    ><Info size={14} aria-hidden="true" /></button>
    {open && createPortal(
      <div ref={popup} id={id} role="tooltip" className="blueprint-count-tooltip" style={position}
        onPointerEnter={cancelLeave} onPointerLeave={leave}>
        <strong>{heading}</strong>
        {entries ? <dl>{entries.map(({ category, count }) => (
          <div key={category}><dt>{category}</dt><dd>{count}</dd></div>
        ))}</dl> : <p>Category breakdown unavailable. Check the allocation counts and marks.</p>}
      </div>, document.body,
    )}
  </>
}
