import { useEffect, useLayoutEffect, useRef } from 'react'
import './useBlueprintEditHighlights.css'

const selector = 'input, .create-assessment-blueprint-readonly-number, tfoot td, tr.is-total td, .create-assessment-blueprint-laq-allocation-summary strong'
const valueOf = node => node.tagName === 'INPUT' ? node.value : node.getAttribute('aria-pressed') ?? node.textContent

/** Highlight the edited control and dependent values after React commits an edit.
 * Returns capture handlers and a ref for the Blueprint container only.
 */
export default function useBlueprintEditHighlights() {
  const ref = useRef(null)
  const previous = useRef(new Map())
  const pending = useRef(null)
  const timer = useRef(null)
  const clear = () => ref.current?.querySelectorAll('[data-blueprint-changed]').forEach(node => node.removeAttribute('data-blueprint-changed'))
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const capture = event => {
    const target = event.target.closest('input, button[aria-pressed]')
    if (!target || (event.type === 'click' && target.tagName === 'INPUT')) return
    window.clearTimeout(timer.current)
    clear()
    pending.current = target
  }
  useLayoutEffect(() => {
    const next = new Map()
    ref.current?.querySelectorAll(selector).forEach(node => {
      const value = valueOf(node)
      if (pending.current && (node === pending.current || (previous.current.has(node) && previous.current.get(node) !== value))) {
        if (node.tagName !== 'BUTTON' || node.getAttribute('aria-pressed') === 'true') node.setAttribute('data-blueprint-changed', 'true')
      }
      next.set(node, value)
    })
    previous.current = next
    if (pending.current) timer.current = window.setTimeout(clear, 1800)
    pending.current = null
  })
  return { ref, onChangeCapture: capture, onClickCapture: capture }
}
