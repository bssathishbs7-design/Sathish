import { useEffect, useRef, useState } from 'react'

const clamp = (value, min, max) => Math.min(Math.max(min, value), Math.max(min, max))
/** Pointer capture avoids document listeners; viewport changes and content expansion re-clamp the dock. */
export default function useDemoDockGeometry(mode) {
  const panelRef = useRef(null)
  const [corner, setCorner] = useState('bottom-right'), [width, setWidth] = useState(560)
  const [point, setPoint] = useState(null), [mobile, setMobile] = useState(() => window.innerWidth < 768)
  const drag = useRef(null)
  useEffect(() => {
    const media = matchMedia('(max-width: 767px)')
    const resized = () => { setMobile(media.matches); setPoint(null) }
    window.addEventListener('resize', resized)
    return () => window.removeEventListener('resize', resized)
  }, [])
  useEffect(() => {
    const node = panelRef.current
    if (!node) return undefined
    const layout = () => {
      const margin = mobile ? 8 : 16
      const desired = mode === 'library' ? 360 : width
      node.style.setProperty('--demo-width', mode === 'launcher' ? 'max-content' : `${mobile ? innerWidth - margin * 2 : Math.min(desired, innerWidth - margin * 2)}px`)
      const rect = node.getBoundingClientRect()
      const x = mobile ? innerWidth - rect.width - margin : point?.x ?? (corner.endsWith('right') ? innerWidth - rect.width - margin : margin)
      const y = mobile ? innerHeight - rect.height - margin : point?.y ?? (corner.startsWith('bottom') ? innerHeight - rect.height - margin : margin)
      node.style.left = `${clamp(x, margin, innerWidth - rect.width - margin)}px`
      node.style.top = `${clamp(y, margin, innerHeight - rect.height - margin)}px`
    }
    layout()
    const observer = new ResizeObserver(layout)
    observer.observe(node)
    window.addEventListener('resize', layout)
    return () => { observer.disconnect(); window.removeEventListener('resize', layout) }
  }, [panelRef, mode, width, corner, point, mobile])
  const start = (event, resizing) => {
    if (mobile || event.button !== 0) return
    const rect = panelRef.current.getBoundingClientRect()
    drag.current = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, resizing }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const move = event => {
    const origin = drag.current
    if (!origin || mobile) return
    if (origin.resizing) {
      setPoint({ x: origin.left, y: origin.top })
      setWidth(clamp(origin.width + event.clientX - origin.x, 360, Math.min(820, innerWidth - 32)))
    } else setPoint({ x: origin.left + event.clientX - origin.x, y: origin.top + event.clientY - origin.y })
  }
  const end = event => {
    const origin = drag.current
    if (!origin) return
    const rect = panelRef.current.getBoundingClientRect()
    const finalWidth = origin.resizing ? clamp(origin.width + event.clientX - origin.x, 360, Math.min(820, innerWidth - 32)) : rect.width
    const x = clamp(origin.left + (origin.resizing ? 0 : event.clientX - origin.x), 16, innerWidth - finalWidth - 16)
    const y = clamp(origin.top + (origin.resizing ? 0 : event.clientY - origin.y), 16, innerHeight - rect.height - 16)
    if (origin.resizing) setWidth(finalWidth)
    setCorner(`${y + rect.height / 2 < innerHeight / 2 ? 'top' : 'bottom'}-${x + finalWidth / 2 < innerWidth / 2 ? 'left' : 'right'}`)
    setPoint(null)
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const keys = (event, resizing) => {
    if (mobile || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return
    event.preventDefault()
    if (event.key === 'Home') { setCorner('bottom-right'); setPoint(null); if (resizing) setWidth(560); return }
    if (resizing) setWidth(value => clamp(value + (['ArrowRight', 'ArrowUp'].includes(event.key) ? 40 : -40), 360, Math.min(820, innerWidth - 32)))
    else { setPoint(null); setCorner(current => `${event.key === 'ArrowUp' ? 'top' : event.key === 'ArrowDown' ? 'bottom' : current.split('-')[0]}-${event.key === 'ArrowLeft' ? 'left' : event.key === 'ArrowRight' ? 'right' : current.split('-')[1]}`) }
  }
  const handle = resizing => ({ onPointerDown: event => start(event, resizing), onPointerMove: move, onPointerUp: end, onPointerCancel: end, onKeyDown: event => keys(event, resizing) })
  return { panelRef, width, setWidth, mobile, moveHandle: handle(false), resizeHandle: handle(true), reset: () => { setCorner('bottom-right'); setPoint(null) } }
}
