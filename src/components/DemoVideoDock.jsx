import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Grip, Library, Maximize, Play, Power, Video, X } from 'lucide-react'
import { DEMO_VIDEOS, demoPageLabel, demoProgressKey } from '../config/demoVideos'
import { fetchDemoVideos } from '../services/demoVideos'
import { markDemoPrompted } from '../services/demoVideoState'
import DemoVideoLibrary from './demos/DemoVideoLibrary'
import DemoVideoPlayer from './demos/DemoVideoPlayer'
import useDemoDockGeometry from './demos/useDemoDockGeometry'
import '../styles/medsy/question-sort-tokens.css'
import './DemoVideoDock.css'

/** Shell-mounted dock. App owns viewer preference and navigation; this component owns presentation and playback selection. */
export default function DemoVideoDock({ viewerId, state, activePage, theme, onNavigate, onDisable }) {
  const [videos, setVideos] = useState(DEMO_VIDEOS), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const [reload, setReload] = useState(0), [mode, setMode] = useState('launcher'), [selected, setSelected] = useState(null)
  const [nudge, setNudge] = useState(null), [fullscreenError, setFullscreenError] = useState('')
  const launcher = useRef(null), heading = useRef(null), visited = useRef(''), previousMode = useRef('launcher')
  const { panelRef, width, setWidth, mobile, moveHandle, resizeHandle, reset } = useDemoDockGeometry(mode)
  useEffect(() => { visited.current = '' }, [activePage])
  useEffect(() => {
    const controller = new AbortController()
    fetchDemoVideos({ signal: controller.signal }).then(catalogue => { setVideos(catalogue); setLoading(false); setError('') })
      .catch(reason => { if (reason.name !== 'AbortError') { setLoading(false); setError(reason.message) } })
    return () => controller.abort()
  }, [reload])
  useEffect(() => {
    if (mode !== 'launcher' || loading || visited.current === activePage) return undefined
    const candidate = videos.find(video => video.videoId && video.pages.includes(activePage) && !state.prompted[demoProgressKey(video)] && !state.videos[demoProgressKey(video)]?.started)
    if (!candidate) return undefined
    const timer = setTimeout(() => {
      if (document.hidden || document.querySelector('[aria-modal="true"]')) return
      visited.current = activePage
      setNudge({ video: candidate, page: activePage })
      markDemoPrompted(viewerId, demoProgressKey(candidate))
    }, 1200)
    return () => clearTimeout(timer)
  }, [activePage, loading, mode, videos, state, viewerId])
  useEffect(() => {
    if (!nudge) return undefined
    const timer = setTimeout(() => setNudge(null), 12000)
    return () => clearTimeout(timer)
  }, [nudge])
  useEffect(() => {
    if (previousMode.current === mode) return
    previousMode.current = mode
    if (mode === 'launcher') launcher.current?.focus({ preventScroll: true }); else heading.current?.focus({ preventScroll: true })
  }, [mode])
  const play = video => { setSelected(video); setMode('player'); setNudge(null) }
  const openLibrary = () => { setMode('library'); setSelected(null); setNudge(null) }
  const close = () => { setMode('launcher'); setSelected(null); setNudge(null); reset() }
  const candidates = selected ? videos.filter(video => video.series === selected.series) : []
  const next = selected ? [...candidates.slice(candidates.indexOf(selected) + 1), ...candidates.slice(0, candidates.indexOf(selected))]
    .find(video => video.videoId && !state.videos[demoProgressKey(video)]?.watched) : null
  const fullscreen = async () => {
    try { if (document.fullscreenElement === panelRef.current) await document.exitFullscreen(); else await panelRef.current.requestFullscreen(); setFullscreenError('') }
    catch { setFullscreenError('Fullscreen is unavailable in this browser. You can use the L size instead.') }
  }
  return <aside ref={panelRef} className={`demo-scope demo-dock demo-mode-${mode}`} data-theme={theme} aria-label="Demo videos" onKeyDown={event => {
    if (event.key === 'Escape' && !document.fullscreenElement) { event.stopPropagation(); close() }
  }}>
    {mode === 'launcher' ? <>
      {nudge?.page === activePage && <section className="demo-nudge" aria-label="Suggested walkthrough"><strong>New here? See how it’s done</strong><p>{nudge.video.title}</p><div><button onClick={() => play(nudge.video)}><Play size={16} />Watch</button><button onClick={() => setNudge(null)}>Not now</button></div></section>}
      <button className="demo-launcher" ref={launcher} onClick={openLibrary} title="Open demo videos" aria-label="Open demos"><Video size={18} />Demos</button>
    </> : <>
      <header className="demo-dock-header"><button className="demo-move" aria-label="Move demo dock; use arrow keys to choose a corner or Home to reset" {...moveHandle} onDoubleClick={reset} title="Drag to move; double-click to reset"><Grip size={18} /></button>
        <h2 tabIndex={-1} ref={heading}>{mode === 'library' ? 'Demo Videos' : selected?.title}</h2>
        {mode === 'library' && <button className="demo-power" aria-label="Turn off demo videos" title="Turn off demo videos" onClick={onDisable}><Power size={16} /></button>}
        <button className="demo-close" aria-label="Close demos" title="Close demos" onClick={close}><X size={16} /></button>
      </header>
      {state.storageError && <p className="demo-notice" role="status">Your browser could not save demo preferences or progress. They will last for this session only.</p>}
      {mode === 'library' ? <>
        {loading && <p className="demo-notice" role="status">Loading demos…</p>}
        {error && <div className="demo-notice" role="alert">{error}<button onClick={() => { setLoading(true); setReload(value => value + 1) }}>Try again</button></div>}
        <DemoVideoLibrary videos={videos} state={state} activePage={activePage} onPlay={play} />
      </> : <>
        <div className="demo-player-toolbar"><div role="group" aria-label="Player size">{[['S', 360], ['M', 560], ['L', 820]].map(([label, size]) => <button key={label} disabled={mobile} aria-pressed={width === size} aria-label={`${label} player size, ${size} pixels`} onClick={() => setWidth(size)}>{label}</button>)}</div>
          <button onClick={fullscreen} aria-label="Toggle demo fullscreen"><Maximize size={16} /></button><button onClick={openLibrary}><Library size={16} />All demos</button></div>
        {fullscreenError && <p className="demo-notice" role="status">{fullscreenError}</p>}
        <DemoVideoPlayer key={demoProgressKey(selected)} video={selected} viewerId={viewerId} nextVideo={next} allWatched={candidates.every(video => state.videos[demoProgressKey(video)]?.watched)} onPlay={play} />
        <footer className="demo-follow"><span>Follow along in <strong>{demoPageLabel(selected.followPage)}</strong></span><button onClick={() => onNavigate(selected.followPage)}>Go there<ArrowUpRight size={16} /></button></footer>
        <button className="demo-resize" aria-label="Resize demo player; drag or use arrow keys, Home for medium" {...resizeHandle}><Grip size={18} /></button>
      </>}
    </>}
  </aside>
}
