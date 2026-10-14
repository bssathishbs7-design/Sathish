import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import BlueprintUnitCards from './BlueprintUnitCards'
import './BlueprintFieldSuggestions.css'

/** Non-modal field suggestions: anchor stays editable; Add targets the active row.
 * @param {{anchor:HTMLElement,heading:string,units:Array,error:string,onAdd:Function,onClose:Function}} props
 */
export default function BlueprintFieldSuggestions({ anchor, heading, units, error, onAdd, onClose }) {
  const popup = useRef(null)
  const isEmpty = !units.length && !error
  const [position, setPosition] = useState({ left: 0, top: 0, visibility: 'hidden' })
  useLayoutEffect(() => {
    if (!anchor?.isConnected) { onClose(); return }
    const place = () => {
      const rect = anchor.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) { onClose(); return }
      const box = popup.current.getBoundingClientRect()
      const below = window.innerHeight - rect.bottom - 12
      const above = rect.top - 12
      const bottom = below >= Math.min(box.height, 280) || below >= above
      const maxHeight = Math.max(80, bottom ? below : above)
      setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - box.width - 8)),
        top: bottom ? rect.bottom + 4 : Math.max(8, rect.top - Math.min(box.height, maxHeight) - 4),
        maxHeight, visibility: 'visible' })
    }
    place()
    const outside = event => {
      if (!anchor.contains(event.target) && !popup.current?.contains(event.target)) onClose()
    }
    const escape = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (popup.current?.contains(document.activeElement)) anchor.focus({ preventScroll: true })
        onClose()
      }
    }
    const scroll = event => { if (!popup.current?.contains(event.target)) place() }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    document.addEventListener('keydown', escape)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', scroll, true)
    const observer = new ResizeObserver(place)
    observer.observe(popup.current)
    return () => {
      observer.disconnect()
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('keydown', escape)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', scroll, true)
    }
  }, [anchor, onClose])
  const dark = anchor?.closest('.theme-dark, [data-theme="dark"], [data-theme="oled"]')
  return createPortal(<div className={dark ? 'theme-dark' : undefined}>
    <section ref={popup} id="blueprint-field-suggestions" className={`blueprint-field-suggestions qb-sort-scope${isEmpty ? ' is-empty' : ''}`} style={position} role="dialog" aria-label={heading + ' suggestions'}>
      {isEmpty ? <div className="blueprint-field-empty-message" role="status">
        <strong>{heading}</strong><span>No unallocated items for this cell</span><Check size={14} aria-hidden="true" />
      </div> : <>
      <div className="blueprint-field-suggestions-head"><strong>{heading}</strong><span>{units.length} remaining</span>
        <button type="button" aria-label="Close field suggestions" onClick={() => { anchor.focus({ preventScroll: true }); onClose() }}><X size={14} aria-hidden="true" /></button></div>
      {error ? <p role="alert" className="blueprint-field-suggestions-error">{error}</p> : null}
      {units.length ? <BlueprintUnitCards units={units} onAdd={onAdd} /> : <p>No eligible questions remain for this field.</p>}
      <p className="blueprint-field-suggestions-hint">Type a count in the field, or add an item here.</p>
      </>}
    </section>
  </div>, document.body)
}
