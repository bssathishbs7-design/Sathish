import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, LoaderCircle, Sparkles, Undo2, X } from 'lucide-react'
import { getActivitySuggestions, refineActivityContent } from '../services/activitySuggestions'
import './ActivityNameRefiner.css'

/**
 * Controlled refinement wrapper; the parent owns the activity text and growing textarea.
 * @param {{value: string, onChange: (text: string) => void, inputRef: import('react').RefObject<HTMLTextAreaElement>, children: import('react').ReactNode, showRefine?: boolean, statusTarget?: HTMLElement | null}} props
 */
export default function ActivityNameRefiner({ value, onChange, inputRef, children, showRefine = false, statusTarget = null }) {
  const id = useId()
  const root = useRef(null)
  const panel = useRef(null)
  const request = useRef(null)
  const generation = useRef(0)
  const skipAutomatic = useRef(null)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('idle')
  const [suggestions, setSuggestions] = useState([])
  const [mode, setMode] = useState('suggestions')
  const [refined, setRefined] = useState(null)
  const [previous, setPrevious] = useState(null)
  const [position, setPosition] = useState(null)

  const close = () => {
    generation.current += 1
    request.current?.abort()
    setOpen(false)
    setStatus('idle')
  }

  const load = useCallback(async (text, nextMode) => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    const current = ++generation.current
    setOpen(true)
    setMode(nextMode)
    setStatus('loading')
    setSuggestions([])
    setRefined(null)
    try {
      const service = nextMode === 'refine' ? refineActivityContent : getActivitySuggestions
      const result = await service({ text, signal: controller.signal })
      if (current !== generation.current || controller.signal.aborted) return
      if (nextMode === 'refine') setRefined(result)
      else setSuggestions(result.suggestions)
      setStatus('ready')
    } catch (error) {
      if (error.name !== 'AbortError' && current === generation.current) setStatus('error')
    }
  }, [])

  useEffect(() => {
    generation.current += 1
    request.current?.abort()
    if (skipAutomatic.current === value) return undefined
    if (document.activeElement !== inputRef.current || !value.trim()) return undefined
    const current = generation.current
    const timer = setTimeout(() => {
      if (generation.current === current && document.activeElement === inputRef.current) void load(value, 'suggestions')
    }, 350)
    return () => clearTimeout(timer)
  }, [value, inputRef, load])

  useEffect(() => () => { request.current?.abort(); generation.current += 1 }, [])

  useLayoutEffect(() => {
    if (!open) return undefined
    const place = () => {
      if (mode === 'suggestions') return
      const anchor = root.current.getBoundingClientRect()
      const width = Math.min(anchor.width, window.innerWidth - 32)
      const height = panel.current.getBoundingClientRect().height
      const below = window.innerHeight - anchor.bottom >= height + 16
      const computed = getComputedStyle(root.current)
      const theme = Object.fromEntries(['--surface-card', '--text-body', '--text-strong', '--text-muted', '--text-brand', '--border', '--app-surface', '--app-text'].map(key => [key, computed.getPropertyValue(key)]).filter(([, val]) => val.trim()))
      setPosition({ ...theme, width, left: Math.max(16, Math.min(anchor.left, window.innerWidth - width - 16)), top: Math.max(16, below ? anchor.bottom + 8 : anchor.top - height - 8), '--refiner-arrow-top': below ? '-4px' : 'auto', '--refiner-arrow-bottom': below ? 'auto' : '-4px' })
    }
    const outside = event => { if (!root.current.contains(event.target) && !panel.current?.contains(event.target)) close() }
    const escape = event => { if (event.key === 'Escape') { const restore = panel.current?.contains(document.activeElement); close(); if (restore) inputRef.current?.focus() } }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(panel.current)
    observer.observe(root.current)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open, inputRef, mode])

  function apply(text) {
    setPrevious(value)
    skipAutomatic.current = text
    onChange(text)
    close()
    inputRef.current?.focus()
  }

  function navigate(event) {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return
    const buttons = [...panel.current.querySelectorAll('button:not(:disabled)')]
    const index = buttons.indexOf(document.activeElement)
    buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus()
    event.preventDefault()
  }

  // Suggestions belong below the field in normal flow; refinement keeps its floating preview.
  const renderPanel = content => mode === 'suggestions' ? content : createPortal(content, document.body)
  const renderStatus = content => statusTarget ? createPortal(content, statusTarget) : content

  return <div className="activity-name-refiner" ref={root}>
    <div className="activity-name-refiner-entry" onChange={() => { close(); setPrevious(null); skipAutomatic.current = null }} onKeyDown={event => {
      if (open && event.key === 'ArrowDown' && event.altKey) { event.preventDefault(); panel.current?.querySelector('button')?.focus() }
    }}>
      {children}
      {showRefine && <button type="button" className="activity-refine-button" disabled={!value.trim() || (mode === 'refine' && status === 'loading')} aria-expanded={open && mode === 'refine'} aria-controls={open && mode === 'refine' ? id : undefined} onClick={() => load(value, 'refine')}>
        {mode === 'refine' && status === 'loading' ? <LoaderCircle size={16} className="activity-refiner-spinner" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
        {mode === 'refine' && status === 'loading' ? 'Refining…' : 'Refine'}
      </button>}
    </div>
    {previous !== null && renderStatus(<div className="activity-refiner-undo" role="status">{mode === 'refine' ? 'Refined content applied.' : 'Suggestion applied.'}
      <button type="button" onClick={() => { skipAutomatic.current = previous; onChange(previous); setPrevious(null); close(); inputRef.current?.focus() }}><Undo2 size={14} aria-hidden="true" />Undo</button>
    </div>)}
    {open && renderPanel(<div ref={panel} id={id} role="region" aria-label={mode === 'refine' ? 'Refined content' : 'Activity name suggestions'} className={`activity-refiner-popover${mode === 'suggestions' ? ' activity-refiner-suggestions' : ' activity-refiner-enhancement'}`} style={mode === 'suggestions' ? undefined : position || { visibility: 'hidden' }} onKeyDown={navigate}>
      <div className="activity-refiner-heading"><strong>{mode === 'refine' ? 'Refined content' : 'Activity Suggestions'}</strong><button type="button" aria-label={mode === 'refine' ? 'Close refined content' : 'Close suggestions'} onClick={() => { close(); inputRef.current?.focus() }}><X size={16} /></button></div>
      {mode === 'refine' && <p className="activity-refiner-caption">Demo refinement · Review the enhanced wording before applying.</p>}
      <div aria-live="polite">{status === 'loading' && <p>{mode === 'refine' ? 'Enhancing your content…' : 'Preparing suggestions…'}</p>}
        {status === 'error' && <p>{mode === 'refine' ? 'Content could not be refined.' : 'Suggestions could not load.'} <button type="button" onClick={() => load(value, mode)}>Retry</button></p>}
        {mode === 'suggestions' && status === 'ready' && !suggestions.length && <p>No suggestions available. Keep typing to try again.</p>}
      </div>
      {mode === 'refine' && status === 'ready' && refined && <div className="activity-refiner-preview">
        <p>{refined.text}</p>
        {!refined.changed && <p className="activity-refiner-caption">No wording changes were found by the demo refiner.</p>}
        <div className="activity-refiner-preview-actions">
          <button type="button" onClick={() => { close(); inputRef.current?.focus() }}>Cancel</button>
          <button type="button" disabled={!refined.changed} onClick={() => apply(refined.text)}><Check size={16} aria-hidden="true" />Apply</button>
        </div>
      </div>}
      {mode === 'suggestions' && <ul className="activity-refiner-list">{suggestions.map((suggestion, index) => <li key={suggestion.id}>
        <button type="button" className="activity-suggestion-row" aria-label={`Apply suggestion ${index + 1}: ${suggestion.text}`} onClick={() => apply(suggestion.text)}>
          <span className="activity-suggestion-text">{suggestion.text}</span>
        </button>
      </li>)}</ul>}
    </div>)}
  </div>
}
