import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Play, RotateCcw } from 'lucide-react'
import { loadYouTubePlayer } from '../../services/youtubePlayer'
import { readDemoProgress, saveDemoProgress } from '../../services/demoVideoState'
import { demoProgressKey } from '../../config/demoVideos'
import { resumePosition, sampleDemoProgress } from '../../utils/demoVideoProgress'
import './DemoVideoPlayer.css'

/** Owns the media instance only; shell navigation never remounts this component.
 * @param {{video:object,viewerId:string,nextVideo:object|null,allWatched:boolean,onPlay:function}} props
 */
export default function DemoVideoPlayer({ video, viewerId, nextVideo, allWatched, onPlay }) {
  const mount = useRef(null), api = useRef(null)
  const [message, setMessage] = useState('Loading video…'), [ended, setEnded] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false, player, previous = null, poll, saver, readyTimeout
    const id = demoProgressKey(video)
    let progress = readDemoProgress(viewerId, id)
    const iframe = document.createElement('iframe')
    const start = Math.floor(resumePosition(progress))
    iframe.title = video.title
    iframe.src = `https://www.youtube-nocookie.com/embed/${video.videoId}?enablejsapi=1&origin=${encodeURIComponent(location.origin)}&playsinline=1&autoplay=1&cc_load_policy=1&start=${start}`
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
    iframe.allowFullscreen = true
    iframe.referrerPolicy = 'strict-origin-when-cross-origin'
    mount.current.replaceChildren(iframe)
    const sample = () => {
      if (!player?.getCurrentTime || !player?.getDuration) return
      try {
        const current = { position: player.getCurrentTime(), duration: player.getDuration(), wallTime: performance.now(), recordedAt: Date.now(),
          playing: player.getPlayerState() === 1 && !document.hidden, rate: player.getPlaybackRate() || 1 }
        progress = sampleDemoProgress(progress, current, previous)
        previous = current
      } catch { previous = null }
    }
    const save = () => { sample(); saveDemoProgress(viewerId, id, progress) }
    const hidden = () => { save(); previous = null }
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('pagehide', save)
    loadYouTubePlayer().then(YT => {
      if (cancelled) return
      player = new YT.Player(iframe, { events: {
        onReady: () => {
          if (cancelled) return
          clearTimeout(readyTimeout); setMessage(''); api.current = player
          poll = setInterval(sample, 500); saver = setInterval(save, 3000)
        },
        onStateChange: event => {
          if (cancelled) return
          sample()
          if (event.data !== 1) { save(); previous = null }
          if (event.data === 0) setEnded(true)
          if (event.data === 1) { setEnded(false); setMessage('') }
        },
        onPlaybackRateChange: () => { save(); previous = null },
        onError: () => { if (!cancelled) { save(); setMessage('This video could not play here. Try again or open it on YouTube. Your network may block YouTube.') } },
      } })
      readyTimeout = setTimeout(() => { if (!cancelled) setMessage('Video taking too long? Try the player controls or open it on YouTube. Progress tracking may be unavailable.') }, 10000)
    }).catch(error => { if (!cancelled) setMessage(error.message) })
    return () => {
      cancelled = true; save(); clearInterval(poll); clearInterval(saver); clearTimeout(readyTimeout)
      document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', save)
      player?.destroy?.(); api.current = null; iframe.remove()
    }
  }, [video, viewerId, attempt])
  const replay = () => {
    setEnded(false)
    if (api.current?.seekTo) { api.current.seekTo(0, true); api.current.playVideo() }
    else { setMessage('Loading video…'); setAttempt(value => value + 1) }
  }
  return <div className="demo-media">
    <div className="demo-video-frame" ref={mount} />
    {message && <div className="demo-video-message" role="status"><p>{message}</p>{message !== 'Loading video…' && <button onClick={() => { setMessage('Loading video…'); setAttempt(value => value + 1) }}><RotateCcw size={16} />Retry</button>}</div>}
    <div className="demo-video-links"><a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />Open on YouTube</a>
      {video.transcriptUrl && <a href={video.transcriptUrl} target="_blank" rel="noopener noreferrer">Read transcript</a>}</div>
    {ended && <div className="demo-up-next" aria-live="polite"><p>{allWatched ? 'You have watched every demo.' : nextVideo ? `Up next: ${nextVideo.title}` : 'Replay to finish any sections you skipped.'}</p>
      <div>{nextVideo && <button onClick={() => onPlay(nextVideo)}><Play size={16} />Play next</button>}<button onClick={replay}><RotateCcw size={16} />Replay</button></div></div>}
  </div>
}
