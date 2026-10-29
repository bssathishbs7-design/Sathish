import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './LogbookTooltip.css'

/** Hover/focus explanation rendered inside the modal's top layer, outside scrolling fields.
 * @param {{id:string,anchor:HTMLElement,title:string,children:import('react').ReactNode,onMouseEnter:Function,onMouseLeave:Function}} props
 */
export default function LogbookTooltip({ id, anchor, title, children, onMouseEnter, onMouseLeave }) {
  const tip = useRef(null)
  useLayoutEffect(() => {
    const node = tip.current, bounds = anchor.getBoundingClientRect()
    node.showPopover()
    const gap = parseFloat(getComputedStyle(node).getPropertyValue('--s-2')) || 8
    const rect = node.getBoundingClientRect()
    const left = Math.max(gap, Math.min(bounds.left, innerWidth - rect.width - gap))
    const top = bounds.bottom + gap + rect.height <= innerHeight - gap ? bounds.bottom + gap : Math.max(gap, bounds.top - rect.height - gap)
    node.style.left = `${left}px`
    node.style.top = `${top}px`
    return () => { if (node.matches(':popover-open')) node.hidePopover() }
  }, [anchor, title])
  return createPortal(<div ref={tip} id={id} popover="manual" className="lb-floating-tooltip" role="tooltip" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}><strong>{title}</strong><span>{children}</span></div>, anchor.closest('dialog') || document.body)
}
