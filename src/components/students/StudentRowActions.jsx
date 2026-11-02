import { useId, useRef, useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import './StudentRowActions.css'

/** @param {{student:Object, editable:boolean, onOpen:Function, onAction:Function}} props */
export default function StudentRowActions({ student, editable, onOpen, onAction }) {
  const id = useId(), trigger = useRef(null), popup = useRef(null)
  const [open, setOpen] = useState(false)
  const show = () => {
    if (open) { popup.current.hidePopover(); return }
    const rect = trigger.current.getBoundingClientRect()
    popup.current.showPopover()
    const box = popup.current.getBoundingClientRect()
    popup.current.style.left = `${Math.max(0, Math.min(rect.right - box.width, innerWidth - box.width))}px`
    popup.current.style.top = `${rect.bottom + box.height > innerHeight ? Math.max(0, rect.top - box.height) : rect.bottom}px`
    popup.current.querySelector('button')?.focus()
  }
  const choose = type => {
    popup.current.hidePopover()
    trigger.current.focus()
    onAction(type === 'save' ? { type, student } : { type, ids: [student.id] })
  }
  const keyboard = event => {
    const buttons = [...popup.current.querySelectorAll('button')]
    const index = buttons.indexOf(document.activeElement)
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length].focus()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      popup.current.hidePopover()
      trigger.current.focus()
    }
    if (event.key === 'Tab') popup.current.hidePopover()
  }
  return <div className="sm-student-actions">
    <button type="button" className="lb-btn sm-view-student" onClick={() => onOpen(student.id)} aria-label={`View ${student.name}`}>View</button>
    {editable && <>
      <button type="button" className="lb-icon-btn" ref={trigger} aria-label={`More actions for ${student.name}`} aria-haspopup="menu" aria-expanded={open} aria-controls={id} onClick={show}><MoreHorizontal size={18} /></button>
      <div id={id} ref={popup} popover="auto" role="menu" aria-label={`Actions for ${student.name}`} className="sm-student-action-menu" onToggle={event => setOpen(event.newState === 'open')} onKeyDown={keyboard}>
        <button type="button" role="menuitem" onClick={() => choose('save')}><Pencil size={16} />Edit student</button>
        <button type="button" role="menuitem" className="is-destructive" onClick={() => choose('delete')}><Trash2 size={16} />Delete student</button>
      </div>
    </>}
  </div>
}
