import { useSyncExternalStore } from 'react'
import { emptyDemoProgress, mergePlayedRanges } from '../utils/demoVideoProgress.js'

const cache = new Map(), listeners = new Set()
const keyFor = viewerId => `medsy-demo-videos-v1:${encodeURIComponent(viewerId)}`
const initial = () => ({ enabled: true, prompted: {}, videos: {}, storageError: false })
/** Viewer-scoped browser mock. A server adapter must enforce authenticated identity before onboarding reporting. */
function read(viewerId) {
  if (!cache.has(viewerId)) {
    try {
      const stored = JSON.parse(localStorage.getItem(keyFor(viewerId)) || 'null')
      cache.set(viewerId, { ...initial(), enabled: stored?.enabled !== false, prompted: stored?.prompted || {}, videos: stored?.videos || {} })
    } catch { cache.set(viewerId, { ...initial(), storageError: true }) }
  }
  return cache.get(viewerId)
}
function update(viewerId, change) {
  let next = { ...read(viewerId), ...change(read(viewerId)), storageError: false }
  try { localStorage.setItem(keyFor(viewerId), JSON.stringify(next)) } catch { next = { ...next, storageError: true } }
  cache.set(viewerId, next)
  listeners.forEach(notify => notify())
}
const onStorage = event => {
  for (const viewerId of cache.keys()) if (event.key === null || event.key === keyFor(viewerId)) cache.delete(viewerId)
  listeners.forEach(notify => notify())
}
const subscribe = notify => {
  if (!listeners.size) window.addEventListener('storage', onStorage)
  listeners.add(notify)
  return () => { listeners.delete(notify); if (!listeners.size) window.removeEventListener('storage', onStorage) }
}
export const useDemoVideoState = viewerId => useSyncExternalStore(subscribe, () => read(viewerId))
export const setDemoVideosEnabled = (viewerId, enabled) => update(viewerId, () => ({ enabled }))
export const markDemoPrompted = (viewerId, id) => update(viewerId, state => ({ prompted: { ...state.prompted, [id]: true } }))
export const saveDemoProgress = (viewerId, id, progress) => update(viewerId, state => ({ videos: { ...state.videos, [id]: {
  ...progress, watched: progress.watched || state.videos[id]?.watched === true,
  ranges: mergePlayedRanges([...(Array.isArray(state.videos[id]?.ranges) ? state.videos[id].ranges : []), ...progress.ranges], progress.duration),
} } }))
export function readDemoProgress(viewerId, id) {
  const saved = read(viewerId).videos[id]
  if (!saved || !Number.isFinite(saved.duration) || !Number.isFinite(saved.position)) return emptyDemoProgress()
  return { ...emptyDemoProgress(), ...saved, watched: saved.watched === true, started: saved.started === true,
    ranges: mergePlayedRanges(Array.isArray(saved.ranges) ? saved.ranges : [], saved.duration) }
}
