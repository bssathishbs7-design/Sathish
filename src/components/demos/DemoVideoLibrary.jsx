import { useId, useState } from 'react'
import { Check, CheckCircle2, ChevronDown, Clock3, History, Library, ListChecks, PanelTop, Play, Stethoscope, Video } from 'lucide-react'
import { demoProgressKey } from '../../config/demoVideos'
import { demoStatus } from '../../utils/demoVideoProgress'
import './DemoVideoLibrary.css'

const durationText = seconds => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`
/** One open section at a time. Playback and viewer-scoped progress remain owned by the shell/player. */
export default function DemoVideoLibrary({ videos, state, activePage, onPlay }) {
  const [openSection, setOpenSection] = useState('page')
  const sectionId = useId()
  const progressFor = video => state.videos[demoProgressKey(video)]
  const watched = videos.filter(video => progressFor(video)?.watched).length
  const inProgress = videos.filter(video => !progressFor(video)?.watched && progressFor(video)?.started).length
  const rank = video => progressFor(video)?.watched ? 2 : progressFor(video)?.started ? 0 : 1
  const suggested = videos.filter(video => video.pages.includes(activePage)).sort((a, b) => rank(a) - rank(b))
  const recent = videos.filter(video => progressFor(video)?.started && Number.isFinite(progressFor(video)?.lastPlayedAt) && progressFor(video).lastPlayedAt > 0)
    .sort((a, b) => progressFor(b).lastPlayedAt - progressFor(a).lastPlayedAt).slice(0, 5)
  const sections = [
    { id: 'page', label: 'Related Videos for This Page', Icon: PanelTop, items: suggested, empty: 'No walkthroughs for this page yet. Explore the other sections.' },
    { id: 'recent', label: 'Recently Watched', Icon: History, items: recent, empty: 'No videos watched yet.' },
    { id: 'all', label: 'All Videos', Icon: Library, items: videos },
    { id: 'questions', label: 'Question Bank', Icon: ListChecks, items: videos.filter(video => video.series === 'questions') },
    { id: 'skills', label: 'Skill Assessment', Icon: Stethoscope, items: videos.filter(video => video.series === 'skills') },
  ]
  const focusSection = event => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(event.key)) return
    event.preventDefault()
    const buttons = [...event.currentTarget.closest('.demo-accordion').querySelectorAll('.demo-section-toggle')]
    const current = buttons.indexOf(event.currentTarget)
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
    buttons[target]?.focus()
  }
  const list = (items, prefix) => <ul className="demo-video-list">{items.map(video => {
    const progress = progressFor(video), status = demoStatus(progress)
    return <li key={`${prefix}-${video.id}`}><button className={`demo-video-row ${progress?.watched ? 'is-watched' : progress?.started ? 'is-started' : ''}`} disabled={!video.videoId} onClick={() => onPlay(video)} aria-label={`${status === 'In progress' ? 'Resume' : 'Play'} ${video.title}`}>
      <span className="demo-video-glyph" aria-hidden="true">{progress?.watched ? <Check size={18} /> : progress?.started ? <Clock3 size={18} /> : <Play size={18} />}</span>
      <span className="demo-video-copy">
        <span className="demo-video-title"><strong><span className="demo-step">{video.step}</span>{video.title}</strong>
          {video.duration && <span className="demo-duration"><Clock3 size={12} aria-hidden="true" />{durationText(video.duration)}</span>}</span>
        <span className="demo-video-summary" title={video.summary}>{video.summary}</span>
        <small className="demo-video-status">{!video.videoId ? 'Video not available yet' : status}</small>
      </span>
    </button></li>
  })}</ul>
  return <div className="demo-library-content">
    <div className="demo-progress-summary">
      <div className="demo-progress-label"><span><CheckCircle2 size={15} aria-hidden="true" /><strong>{watched}<span>/{videos.length}</span></strong>watched</span>
        <span><Clock3 size={15} aria-hidden="true" /><strong>{inProgress}</strong>in progress</span></div>
      <progress max={Math.max(1, videos.length)} value={watched} aria-label={`${watched} of ${videos.length} demos watched`} />
    </div>
    <div className="demo-accordion">{sections.map(section => {
      const { id, label, Icon, items, empty } = section
      const expanded = openSection === id
      return <section className="demo-accordion-section" data-section={id} key={id}>
        <h3><button className="demo-section-toggle" id={`${sectionId}-${id}-heading`} aria-expanded={expanded} aria-controls={`${sectionId}-${id}-panel`}
          onKeyDown={focusSection} onClick={() => setOpenSection(expanded ? null : id)}>
          <span className="demo-section-icon"><Icon size={15} aria-hidden="true" /></span><span className="demo-section-label">{label}</span><small>{items.length}</small><ChevronDown size={14} className="demo-section-chevron" aria-hidden="true" />
        </button></h3>
        <div className="demo-accordion-panel" id={`${sectionId}-${id}-panel`} role="region" aria-labelledby={`${sectionId}-${id}-heading`} hidden={!expanded}>
          {items.length ? list(items, id) : <p className="demo-empty"><Video size={18} aria-hidden="true" />{empty}</p>}
        </div>
      </section>
    })}</div>
  </div>
}
