import { useCallback, useEffect, useRef, useState } from 'react'

/** App-owned URL state. Filters replace history; section changes push it.
 * @param {string} path @param {string} viewKey @param {string} fallback
 */
export default function useLogbookNavigation(path, viewKey, fallback) {
  const read = useCallback(() => ({ [viewKey]: fallback, ...Object.fromEntries(new URLSearchParams(window.location.pathname === path ? window.location.search : '')) }), [path, viewKey, fallback])
  const [view, setView] = useState(read)
  const cache = useRef(new Map())
  const scrollCache = useRef(new Map())
  const initial = window.history.state?.[path]?.index || 0
  const [position, setPosition] = useState(initial)
  const [max, setMax] = useState(initial)
  const key = route => `${route[viewKey] || fallback}:${route.id || ''}`
  const scroller = () => { const main = document.querySelector('.vx-main'); return main && main.scrollHeight > main.clientHeight ? main : document.scrollingElement }
  useEffect(() => {
    const pop = () => {
      if (window.location.pathname !== path) return
      setView(read()); setPosition(window.history.state?.[path]?.index || 0)
      const scroll = window.history.state?.[path]?.scroll || 0
      requestAnimationFrame(() => scroller()?.scrollTo({ top: scroll }))
    }
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [path, read])
  const navigate = (next, replace = false) => {
    cache.current.set(key(view), view)
    scrollCache.current.set(key(view), scroller()?.scrollTop || 0)
    const route = { [viewKey]: fallback, ...cache.current.get(key(next)), ...next }
    const params = new URLSearchParams()
    Object.entries(route).forEach(([k, v]) => { if (v && v !== 'all') params.set(k, v) })
    const index = replace ? position : position + 1
    const state = window.history.state || {}
    const scroll = replace ? scroller()?.scrollTop || 0 : scrollCache.current.get(key(route)) || 0
    if (!replace) window.history.replaceState({ ...state, [path]: { index: position, scroll: scroller()?.scrollTop || 0 } }, '')
    window.history[replace ? 'replaceState' : 'pushState']({ ...state, [path]: { index, scroll } }, '', path + (params.size ? '?' + params : ''))
    setMax(previous => replace ? Math.max(previous, index) : index)
    setPosition(index); setView(route)
    if (!replace) requestAnimationFrame(() => scroller()?.scrollTo({ top: scroll }))
  }
  return [view, navigate, { canBack: position > 0, canForward: position < max, back: () => window.history.back(), forward: () => window.history.forward() }]
}
