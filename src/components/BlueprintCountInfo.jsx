import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'
import './BlueprintCountInfo.css'

/** Read-only breakdown. SAQ entries contain category/count/perQuestionMarks/totalMarks;
 * LAQ entries contain question/part/marks. Null indicates an untraceable allocation.
 * @param {{heading:string,label:string,entries:Array|null,kind?:'saq'|'laq'}} props
 */
export default function BlueprintCountInfo({ heading, label, entries, kind = 'saq' }) {
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
      aria-label={`${label} ${kind === 'laq' ? 'split parts' : 'category counts'}`}
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
        {kind === 'laq' ? <>
          {entries ? <table aria-label={`${label} split breakdown`}>
            <thead><tr><th scope="col">Question</th><th scope="col">Part</th><th scope="col">Marks</th></tr></thead>
            <tbody>{entries.map(entry => <tr key={`${entry.question}-${entry.part}`}><th scope="row">LAQ {entry.question}</th><td>Part {entry.part}</td><td>{entry.marks}</td></tr>)}</tbody>
            <tfoot><tr><th scope="row">Total</th><td>{entries.length} {entries.length === 1 ? 'part' : 'parts'}</td><td>{Number(entries.reduce((sum, entry) => sum + entry.marks, 0).toFixed(2))}</td></tr></tfoot>
          </table> : <p>Split breakdown unavailable. These counts and marks do not uniquely identify the allocated parts.</p>}
          <p>Cell count = parts. LAQ heading count = main questions.</p>
        </> : entries ? <table aria-label={`${label} marks breakdown`}>
          <thead><tr><th scope="col">Category</th><th scope="col" aria-label="Questions">Qty</th><th scope="col" aria-label="Marks per question">Pre/M</th><th scope="col" aria-label="Total marks">Total</th></tr></thead>
          <tbody>{entries.map(({ category, count, perQuestionMarks, totalMarks }) => (
            <tr key={`${category}-${perQuestionMarks}`}><th scope="row">{category}</th><td>{count}</td><td>{perQuestionMarks}</td><td>{totalMarks}</td></tr>
          ))}</tbody>
          <tfoot><tr><th scope="row">Total</th><td>{entries.reduce((sum, entry) => sum + entry.count, 0)}</td><td>—</td><td>{Number(entries.reduce((sum, entry) => sum + entry.totalMarks, 0).toFixed(2))}</td></tr></tfoot>
        </table> : <p>Category breakdown unavailable. Check the allocation counts and marks.</p>}
      </div>, document.body,
    )}
  </>
}
