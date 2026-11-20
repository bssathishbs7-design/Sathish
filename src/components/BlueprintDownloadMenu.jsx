import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, ChevronDown, FileDown, FileSpreadsheet } from 'lucide-react'
import './BlueprintDownloadMenu.css'

/** @param {{name:string, disabled:boolean, busy:boolean, onDownload:(format:string)=>void}} props */
export default function BlueprintDownloadMenu({ name, disabled, busy, onDownload }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const trigger = useRef(null)
  const menu = useRef(null)
  const id = useId()
  const close = () => { setOpen(false); trigger.current?.focus({ preventScroll: true }) }
  useLayoutEffect(() => {
    if (!open) return
    const anchor = trigger.current.getBoundingClientRect()
    const box = menu.current.getBoundingClientRect()
    const styles = getComputedStyle(trigger.current)
    const theme = Object.fromEntries(['--surface-card', '--surface-soft', '--text-strong', '--border', '--forest', '--focus-ring'].map(key => [key, styles.getPropertyValue(key)]))
    setPosition({ ...theme, left: Math.max(8, Math.min(anchor.right - box.width, innerWidth - box.width - 8)), top: anchor.bottom + box.height + 8 < innerHeight ? anchor.bottom + 4 : Math.max(8, anchor.top - box.height - 4) })
  }, [open])
  useEffect(() => {
    if (open && position) menu.current?.querySelector('button')?.focus({ preventScroll: true })
  }, [open, position])
  useEffect(() => {
    if (!open) return
    const outside = event => { if (!menu.current?.contains(event.target) && !trigger.current?.contains(event.target)) setOpen(false) }
    const dismiss = () => setOpen(false)
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', dismiss)
    window.addEventListener('scroll', dismiss, true)
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', dismiss); window.removeEventListener('scroll', dismiss, true) }
  }, [open])
  const navigate = event => {
    const items = [...menu.current.querySelectorAll('button')]
    const current = items.indexOf(document.activeElement)
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      items[event.key === 'Home' ? 0 : event.key === 'End' ? 1 : (current + 1) % 2]?.focus()
    }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() }
    if (event.key === 'Tab') { event.preventDefault(); close() }
  }
  return <>
    <button ref={trigger} type="button" className="blueprint-download-trigger" disabled={disabled} aria-label={`Download ${name}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => setOpen(value => !value)} onKeyDown={event => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true) } }}>
      <Download size={14} aria-hidden="true" /><span>{busy ? 'Preparing…' : 'Download'}</span><ChevronDown size={12} aria-hidden="true" />
    </button>
    {open && createPortal(<div ref={menu} id={id} role="menu" aria-label={`Download ${name}`} className="blueprint-download-menu qb-sort-scope" style={{ ...position, visibility: position ? 'visible' : 'hidden' }} onKeyDown={navigate} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <button type="button" role="menuitem" tabIndex={-1} onClick={() => { close(); onDownload('pdf') }}><FileDown size={16} aria-hidden="true" />PDF</button>
      <button type="button" role="menuitem" tabIndex={-1} onClick={() => { close(); onDownload('excel') }}><FileSpreadsheet size={16} aria-hidden="true" />Excel</button>
    </div>, document.body)}
  </>
}
