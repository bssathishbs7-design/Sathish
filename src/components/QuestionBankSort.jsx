import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownUp, Check, X } from 'lucide-react'
import { curriculumFields } from '../utils/questionBankSort'
import './QuestionBankSort.css'

/**
 * @param {object} props
 * @param {{field: string, direction: string}} props.sort Applied ordering.
 * @param {Function} props.onApply Receives the selected sort field and direction.
 */
export default function QuestionBankSort({ sort, onApply }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const panelId = useId()
  const closePanel = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }, [])
  return (
    <>
      <button ref={triggerRef} type="button" className="qb-sort-trigger qb-sort-scope" aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined} aria-expanded={open} onClick={() => setOpen(current => !current)}>
        <ArrowDownUp size={14} aria-hidden="true" /> Sort
        {sort.field && <span className="qb-sort-indicator" aria-label="Sorting active" />}
      </button>
      {open && <SortPopover sort={sort} triggerRef={triggerRef} panelId={panelId}
        onClose={closePanel} onApply={onApply} />}
    </>
  )
}

function SortPopover({ sort, triggerRef, panelId, onClose, onApply }) {
  const [ordering, setOrdering] = useState(() => ({ ...sort, field: sort.field || 'years' }))
  const panelRef = useRef(null)
  const titleId = useId()

  useLayoutEffect(() => {
    const panel = panelRef.current
    const trigger = triggerRef.current
    const position = () => {
      const anchor = trigger.getBoundingClientRect()
      const tokens = getComputedStyle(panel)
      const gap = parseFloat(tokens.getPropertyValue('--s-2')) || 8
      if (anchor.bottom < 0 || anchor.top > window.innerHeight) { onClose(false); return }
      const below = window.innerHeight - anchor.bottom - gap * 2
      const above = anchor.top - gap * 2
      const openAbove = below < panel.scrollHeight && above > below
      panel.style.maxHeight = `${Math.max(0, openAbove ? above : below)}px`
      const rect = panel.getBoundingClientRect()
      const left = Math.max(gap, Math.min(anchor.right - rect.width, window.innerWidth - rect.width - gap))
      panel.style.left = `${left}px`
      panel.style.top = `${openAbove ? anchor.top - gap - rect.height : anchor.bottom + gap}px`
      panel.style.setProperty('--qb-sort-arrow-left', `${Math.max(20, Math.min(anchor.left + anchor.width / 2 - left, rect.width - 20))}px`)
      panel.dataset.placement = openAbove ? 'above' : 'below'
    }
    const outside = (event) => {
      if (!panel.contains(event.target) && !trigger.contains(event.target)) onClose(false)
    }
    const escape = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
    }
    panel.showPopover()
    position()
    panel.querySelector('select')?.focus({ preventScroll: true })
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    document.addEventListener('keydown', escape)
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    return () => {
      panel.hidePopover()
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('keydown', escape)
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
    }
  }, [onClose, triggerRef])

  return createPortal(
    <div ref={panelRef} id={panelId} popover="manual" role="dialog" aria-modal="false"
      className="qb-sort-popover qb-sort-scope" aria-labelledby={titleId}>
      <form onSubmit={(event) => { event.preventDefault(); onApply(ordering); onClose() }}>
        <header>
          <h2 id={titleId}>Sort questions</h2>
          <button type="button" className="qb-sort-close" aria-label="Close sort" onClick={() => onClose()}><X size={14} /></button>
        </header>
        <div className="qb-sort-order">
          <label className="qb-sort-field">Sort by
            <select value={ordering.field} onChange={(event) => setOrdering({ ...ordering, field: event.target.value })}>
              {curriculumFields.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              <option value="codes">Code</option>
            </select>
          </label>
          <label className="qb-sort-field">Direction
            <select value={ordering.direction}
              onChange={(event) => setOrdering({ ...ordering, direction: event.target.value })}>
              <option value="asc">Ascending</option><option value="desc">Descending</option>
            </select>
          </label>
          <button type="submit" className="qb-sort-apply" aria-label="Apply sort" title="Apply sort">
            <Check size={16} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>, document.querySelector('.vx-shell') ?? document.body,
  )
}
