import { useCallback, useLayoutEffect, useRef, useState } from 'react'

const KEY = 'medsy-blueprint-progress-position'
/** Mouse, touch and keyboard positioning for the floating progress control only. */
export default function useBlueprintFloatingPosition(trigger, panel, open, inline) {
  const [position, setPosition] = useState(null)
  const [panelPosition, setPanelPosition] = useState(null)
  const drag = useRef(null)
  const suppressClick = useRef(false)
  const clamp = useCallback(point => {
    const box = trigger.current?.getBoundingClientRect()
    return { x: Math.max(8, Math.min(point.x, innerWidth - (box?.width || 104) - 8)), y: Math.max(8, Math.min(point.y, innerHeight - (box?.height || 104) - 8)) }
  }, [trigger])
  const move = useCallback(point => {
    const next = clamp(point)
    setPosition(next)
    try { sessionStorage.setItem(KEY, JSON.stringify(next)) } catch { /* Position remains available for this mount. */ }
  }, [clamp])
  useLayoutEffect(() => {
    if (inline) return
    let saved
    try { saved = JSON.parse(sessionStorage.getItem(KEY)) } catch { /* Use default corner. */ }
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) move(saved)
    const resize = () => {
      const box = trigger.current?.getBoundingClientRect()
      if (box) move({ x: box.left, y: box.top })
    }
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [inline, move, trigger])
  useLayoutEffect(() => {
    if (inline || !open || !panel.current || !trigger.current) return
    const place = () => {
      const anchor = trigger.current.getBoundingClientRect()
      const box = panel.current.getBoundingClientRect()
      const x = anchor.right + box.width + 8 <= innerWidth ? anchor.right + 8 : anchor.left - box.width - 8
      setPanelPosition({ left: Math.max(8, Math.min(x, innerWidth - box.width - 8)), top: Math.max(8, Math.min(anchor.bottom - box.height, innerHeight - box.height - 8)), bottom: 'auto' })
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(panel.current)
    window.addEventListener('resize', place)
    return () => { observer.disconnect(); window.removeEventListener('resize', place) }
  }, [inline, open, position, panel, trigger])
  const reset = () => {
    const box = trigger.current.getBoundingClientRect()
    move({ x: 16, y: innerHeight - box.height - 16 })
    trigger.current.focus({ preventScroll: true })
  }
  return {
    reset,
    panelStyle: inline ? undefined : panelPosition,
    buttonProps: {
      style: position ? { left: position.x, top: position.y, bottom: 'auto' } : undefined,
      title: 'Drag to move. Use arrow keys to move, or Home to reset.',
      onPointerDown: event => {
        if (event.button !== 0 || !event.isPrimary) return
        const box = event.currentTarget.getBoundingClientRect()
        suppressClick.current = false
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: box.left, top: box.top }
        event.currentTarget.setPointerCapture(event.pointerId)
      },
      onPointerMove: event => {
        const start = drag.current
        if (!start || start.id !== event.pointerId) return
        const dx = event.clientX - start.x, dy = event.clientY - start.y
        if (!suppressClick.current && Math.hypot(dx, dy) < 6) return
        suppressClick.current = true
        move({ x: start.left + dx, y: start.top + dy })
      },
      onPointerUp: () => { drag.current = null },
      onPointerCancel: () => { drag.current = null; suppressClick.current = true },
      onLostPointerCapture: () => { drag.current = null },
      onClickCapture: event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false } },
      onKeyDown: event => {
        if (event.key === 'Home') { event.preventDefault(); reset(); return }
        const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
        if (!delta) return
        event.preventDefault()
        const box = event.currentTarget.getBoundingClientRect(), step = event.shiftKey ? 32 : 8
        move({ x: box.left + delta[0] * step, y: box.top + delta[1] * step })
      },
    },
  }
}
