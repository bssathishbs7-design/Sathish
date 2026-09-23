import { useEffect, useState } from 'react'
import { Play, BookOpenCheck } from 'lucide-react'
import './PracticeFeaturedCard.css'

/** @param {{items:Array<{key:string,card:Object,subject:string,year:string,started:boolean,shared:number}>,onOpen:Function}} props */
export default function PracticeFeaturedCard({ items, onOpen }) {
  const [selectedKey, setSelectedKey] = useState(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [hidden, setHidden] = useState(() => document.hidden)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(media.matches)
    const updateVisibility = () => setHidden(document.hidden)
    media.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      media.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])
  const index = Math.max(0, items.findIndex(item => item.key === selectedKey))
  const item = items[index]
  const nextKey = items.length > 1 ? items[(index + 1) % items.length].key : null
  const paused = hovered || focused || reducedMotion || hidden
  useEffect(() => {
    if (paused || nextKey === null) return undefined
    const timer = window.setTimeout(() => setSelectedKey(nextKey), 5000)
    return () => window.clearTimeout(timer)
  }, [nextKey, paused])
  return <aside className="practice-featured" aria-label="Featured practice" aria-roledescription="carousel"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <div className="practice-featured-top"><span className="practice-featured-label"><BookOpenCheck size={14} aria-hidden="true" />{item ? 'Ready to practise' : 'Your next practice'}</span>
      {items.length > 1 && <div className="practice-featured-dots" role="group" aria-label="Choose featured practice">{items.map((entry, dotIndex) => <button key={entry.key} type="button" aria-label={'Show practice ' + (dotIndex + 1) + ': ' + entry.card.competencyCode} aria-pressed={dotIndex === index} onClick={() => setSelectedKey(entry.key)}><span aria-hidden="true" /></button>)}</div>}
    </div>
    <div className="practice-featured-slide" key={item?.key || "empty"} aria-live={paused ? "polite" : "off"} aria-atomic="true">
    <div className="practice-featured-copy">
      {item ? <><h2 title={item.card.competencyName}><span>{item.card.competencyCode}</span> {item.card.competencyName || 'Shared practice'}</h2>{item.shared > 0 ? <time className="practice-featured-timestamp" dateTime={new Date(item.shared).toISOString()}>Shared {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(item.shared)}</time> : <span className="practice-featured-timestamp">Shared date unavailable</span>}</> : <><h2>No practice waiting</h2><p>New practice shared by your faculty will appear here.</p></>}
    </div>
    {item && <div className="practice-featured-footer"><p>{item.subject}<span>{item.year}</span></p><button type="button" className="practice-featured-action" onClick={() => onOpen(item.card)}><Play size={15} aria-hidden="true" />{item.started ? 'Continue practice' : 'Start practice'}</button></div>}
    </div>
  </aside>
}
