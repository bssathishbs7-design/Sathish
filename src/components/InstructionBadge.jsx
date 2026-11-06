import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info, X } from 'lucide-react'
import '../styles/medsy/question-sort-tokens.css'
import './InstructionBadge.css'

/** Hover previews guidance; clicking pins it open until explicitly dismissed. */
export default function InstructionBadge() {
  const id = useId(), trigger = useRef(null), panel = useRef(null)
  const [open, setOpen] = useState(false)
  const pinned = useRef(false), closeTimer = useRef(null)
  const cancelClose = () => { clearTimeout(closeTimer.current); closeTimer.current = null }
  useEffect(() => () => clearTimeout(closeTimer.current), [])
  const showPreview = event => {
    if (event.pointerType !== 'mouse') return
    cancelClose()
    if (!panel.current.matches(':popover-open')) panel.current.showPopover()
  }
  const leave = () => {
    cancelClose()
    if (pinned.current) return
    const duration = getComputedStyle(trigger.current).getPropertyValue('--dur-overlay').trim()
    const delay = (parseFloat(duration) || 0) * (duration.endsWith('ms') ? 1 : 1000)
    closeTimer.current = setTimeout(() => {
      if (!pinned.current && !panel.current?.contains(document.activeElement)) panel.current?.hidePopover()
    }, delay)
  }
  const click = event => {
    event.preventDefault()
    cancelClose()
    if (pinned.current && panel.current.matches(':popover-open')) { pinned.current = false; panel.current.hidePopover(); return }
    pinned.current = true
    if (!panel.current.matches(':popover-open')) panel.current.showPopover()
    if (event.detail === 0) panel.current.querySelector('button').focus({preventScroll:true})
  }
  useLayoutEffect(() => {
    if (!open) return
    const node = panel.current
    const theme = getComputedStyle(trigger.current)
    // The top-layer panel inherits the exact page tokens, including dark mode.
    for (const key of theme) if (key.startsWith('--')) node.style.setProperty(key, theme.getPropertyValue(key))
    const place = () => {
      const anchor = trigger.current.getBoundingClientRect()
      const gap = parseFloat(theme.getPropertyValue('--s-3')) || 12
      const margin = gap * 2, width = node.offsetWidth, height = node.offsetHeight
      const rightFits = anchor.right + gap + width <= innerWidth - margin
      const leftFits = anchor.left - gap - width >= margin
      let side = innerWidth <= 767 ? 'below' : rightFits ? 'right' : leftFits ? 'left' : 'below'
      if (side === 'below' && anchor.bottom + gap + height > innerHeight - margin && anchor.top - gap - height >= margin) side = 'above'
      const left = side === 'right' ? anchor.right + gap : side === 'left' ? anchor.left - width - gap : anchor.left
      const top = side === 'below' ? anchor.bottom + gap : side === 'above' ? anchor.top - height - gap : anchor.top
      const panelLeft = Math.max(margin, Math.min(left, innerWidth - width - margin))
      const panelTop = Math.max(margin, Math.min(top, innerHeight - height - margin))
      node.style.left = panelLeft + 'px'
      node.style.top = panelTop + 'px'
      // Viewport clamping can move a "below" panel beside or over its trigger.
      // Derive the pointer from the final geometry, never the preferred placement.
      const edge = anchor.right <= panelLeft ? 'right' : anchor.left >= panelLeft + width ? 'left'
        : anchor.bottom <= panelTop ? 'below' : anchor.top >= panelTop + height ? 'above' : null
      const centerY = anchor.top + anchor.height / 2 - panelTop - 1
      const centerX = anchor.left + anchor.width / 2 - panelLeft - 1
      const vertical = edge === 'right' || edge === 'left'
      const aligned = vertical ? centerY >= 20 && centerY <= height - 20 : centerX >= 20 && centerX <= width - 20
      // No misleading corner pointer when the trigger is covered or offscreen.
      node.style.setProperty('--instruction-pointer-visible', edge && aligned ? 'visible' : 'hidden')
      node.style.setProperty('--instruction-pointer-left', (edge === 'right' ? -9 : edge === 'left' ? width - 11 : centerX - 8) + 'px')
      node.style.setProperty('--instruction-pointer-top', (vertical ? centerY - 8 : edge === 'below' ? -9 : height - 11) + 'px')
      node.style.setProperty('--instruction-pointer-angle', (edge === 'left' ? 225 : edge === 'below' ? 135 : edge === 'above' ? 315 : 45) + 'deg')
      node.dataset.side = edge || side
    }
    place()
    const observer = new ResizeObserver(place); observer.observe(node); observer.observe(trigger.current)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => { observer.disconnect(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true) }
  }, [open])
  const close = () => { cancelClose(); pinned.current = false; panel.current.hidePopover(); trigger.current.focus({preventScroll:true}) }
  return <>
    <span className="logbook-scope instruction-badge-scope"><button ref={trigger} type="button" className="instruction-badge" popoverTarget={id} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onPointerEnter={showPreview} onPointerLeave={leave} onClick={click}>
      <Info size={14} aria-hidden="true" />Instructions
    </button></span>
    {createPortal(<div ref={panel} id={id} popover="auto" role="dialog" aria-modal="false" aria-labelledby={id+'-title'} tabIndex={-1} className="logbook-scope instruction-popover" onPointerEnter={cancelClose} onPointerLeave={leave} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))leave()}} onToggle={event=>{const visible=event.newState==='open';setOpen(visible);if(!visible){pinned.current=false;cancelClose()}}}>
      <header className="instruction-popover-head"><h3 id={id+'-title'}>Activity instructions</h3><button type="button" onClick={close} aria-label="Close activity instructions"><X size={16} aria-hidden="true" /></button></header>
      <div className="instruction-popover-body">
        <section className="instruction-guide-card"><strong>Write a clear activity name</strong><p>Describe what the student should perform or demonstrate. Include the skill or procedure and any relevant clinical context.</p></section>
        <table className="instruction-guide-table"><caption>What to include in an activity name</caption><thead><tr><th scope="col">Include</th><th scope="col">Guidance</th><th scope="col">Example</th></tr></thead><tbody>
          <tr><th scope="row">Action</th><td>Start with a clear action verb.</td><td>Measure, examine, interpret</td></tr>
          <tr><th scope="row">Skill or procedure</th><td>Name the task being assessed.</td><td>Blood pressure measurement</td></tr>
          <tr><th scope="row">Clinical context</th><td>Add the patient or situation when relevant.</td><td>In an adult patient</td></tr>
          <tr><th scope="row">Specific wording</th><td>Avoid vague titles.</td><td>Replace “Activity 1” with a descriptive name.</td></tr>
        </tbody></table>
        <div className="instruction-guide-examples"><section className="instruction-guide-card"><strong>Example</strong><p>Measure blood pressure in an adult patient.</p></section>
        <section className="instruction-guide-card"><strong>Another example</strong><p>Interpret a chest X-ray for suspected pneumonia.</p></section></div>
      </div>
    </div>, document.body)}
  </>
}
