import { createElement, useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, List } from 'lucide-react'
import { ASSESSMENT_VIEWS } from '../config/assessmentViews'
import './AssessmentViewMenu.css'

/** @param {{value:string,onChange:(value:string)=>void}} props */
export default function AssessmentViewMenu({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)
  const items = useRef([])
  const menuId = useId()
  const selected = ASSESSMENT_VIEWS.findIndex(view => view.value === value)
  const SelectedIcon = ASSESSMENT_VIEWS[selected]?.icon || List

  useEffect(() => {
    if (!open) return undefined
    items.current[selected]?.focus()
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open, selected])

  const close = () => { setOpen(false); trigger.current?.focus() }
  const choose = next => {
    onChange(next)
    try { localStorage.setItem('medsy-assessment-view', next) } catch { /* The view still works for this session. */ }
    close()
  }
  const navigate = event => {
    const current = items.current.indexOf(document.activeElement)
    let next
    if (event.key === 'ArrowDown') next = (current + 1) % ASSESSMENT_VIEWS.length
    if (event.key === 'ArrowUp') next = (current - 1 + ASSESSMENT_VIEWS.length) % ASSESSMENT_VIEWS.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = ASSESSMENT_VIEWS.length - 1
    if (next !== undefined) { event.preventDefault(); items.current[next]?.focus() }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() }
    if (event.key === 'Tab') setOpen(false)
  }

  return <div className="assessment-view-menu" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <button ref={trigger} type="button" className="assessment-view-trigger" aria-label={`View: ${ASSESSMENT_VIEWS[selected]?.label || 'List'}`} aria-haspopup="menu" aria-controls={open ? menuId : undefined} aria-expanded={open} onClick={() => setOpen(current => !current)} onKeyDown={event => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true) } }}>
      <SelectedIcon size={16} aria-hidden="true" /><span>View</span><ChevronDown size={13} aria-hidden="true" />
    </button>
    {open && <div className="assessment-view-options" id={menuId} role="menu" aria-label="Assessment view" onKeyDown={navigate}>
      {ASSESSMENT_VIEWS.map(({ value: option, label, icon: ViewIcon }, index) => <button ref={node => { items.current[index] = node }} type="button" key={option} role="menuitemradio" aria-checked={value === option} tabIndex={-1} onClick={() => choose(option)}>
        {createElement(ViewIcon, { size: 17, 'aria-hidden': true })}<span>{label}</span><Check size={15} aria-hidden="true" className={value === option ? '' : 'is-unselected'} />
      </button>)}
    </div>}
  </div>
}
