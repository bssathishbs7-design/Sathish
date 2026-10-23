import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Lightbulb, X } from 'lucide-react'
import BlueprintRemainingQuestions from './BlueprintRemainingQuestions'
import './BlueprintChecklist.css'

/** Floating, non-modal allocation tools. All allocations remain owned by the planner.
 * @param {{items:Array,units:Array,total:number,onAdd:Function,disabled?:boolean,theme?:string}} props
 */
export default function BlueprintChecklist({ items, units, total, onAdd, disabled = false, theme = 'light', open = false, onOpenChange }) {
  const setOpen = onOpenChange
  const trigger = useRef(null)
  const panelId = useId()
  const panel = useRef(null)
  const drag = useRef(null)
  const [position, setPosition] = useState(null)
  const [dragging, setDragging] = useState(false)
  const move = (left, top) => {
    const rect = panel.current?.getBoundingClientRect()
    if (!rect) return
    setPosition({ left: Math.max(8, Math.min(left, window.innerWidth - rect.width - 8)), top: Math.max(8, Math.min(top, window.innerHeight - rect.height - 8)) })
  }
  const startDrag = event => {
    if (event.button !== 0 || event.target.closest('button')) return
    const rect = panel.current.getBoundingClientRect()
    drag.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }
  const endDrag = () => { drag.current = null; setDragging(false) }
  useEffect(() => {
    if (!open || !panel.current) return
    const keepVisible = () => {
      const rect = panel.current?.getBoundingClientRect()
      if (!rect) return
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8))
      const top = Math.max(8, Math.min(rect.top, window.innerHeight - rect.height - 8))
      if (Math.abs(left - rect.left) > 1 || Math.abs(top - rect.top) > 1) setPosition({ left, top })
    }
    const observer = new ResizeObserver(keepVisible)
    observer.observe(panel.current)
    window.addEventListener('resize', keepVisible)
    return () => { observer.disconnect(); window.removeEventListener('resize', keepVisible) }
  }, [open])
  useEffect(() => { if (open) trigger.current = document.activeElement }, [open])
  const remaining = items.reduce((sum, item) => sum + item.remaining, 0)
  const complete = total > 0 && remaining === 0
  const close = () => { setOpen(false); trigger.current?.focus() }
  return createPortal(<div className="blueprint-checklist logbook-scope" data-theme={theme} onKeyDown={event => { if (event.key === 'Escape' && open) { event.stopPropagation(); close() } }}>
    {open && <section ref={panel} id={panelId} style={position ? { position: 'fixed', left: position.left, top: position.top, bottom: 'auto', right: 'auto' } : undefined} className="blueprint-checklist-panel" aria-label="Suggestions">
      <header className={dragging ? 'is-dragging' : ''} tabIndex={0} aria-label="Move Suggestions panel. Drag or use arrow keys." onPointerDown={startDrag} onPointerMove={event => { if (drag.current) move(event.clientX - drag.current.x, event.clientY - drag.current.y) }} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag} onKeyDown={event => {
        if (event.target !== event.currentTarget) return
        const directions = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }
        const direction = directions[event.key]
        if (!direction) return
        event.preventDefault()
        const rect = panel.current.getBoundingClientRect()
        move(rect.left + direction[0], rect.top + direction[1])
      }}><strong className="blueprint-checklist-title"><Lightbulb size={18} aria-hidden="true" />Suggestions</strong><button type="button" onClick={close} aria-label="Close suggestions"><X size={16} aria-hidden="true" /></button></header>
      <div className="blueprint-checklist-body">
        <div className={`blueprint-checklist-content ${complete ? 'is-complete' : 'is-pending'}`}>
          {remaining ? <BlueprintRemainingQuestions collapsible includeMcq items={items} units={units} onAdd={onAdd} disabled={disabled} /> : <p className="blueprint-checklist-empty">{complete ? 'All questions are allocated.' : 'No questions to allocate yet.'}</p>}
        </div>
      </div>
    </section>}
  </div>, document.body)
}
