import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LoaderCircle, Sparkles, Undo2, X } from 'lucide-react'
import { getActivitySuggestions } from '../services/activitySuggestions'
import './ActivityNameRefiner.css'

/** Suggestions are requested only by Improve / Refine or Retry. Typing never starts work.
 * @param {{value:string,onChange:(text:string)=>void,inputRef:import('react').RefObject<HTMLTextAreaElement>,children:import('react').ReactNode,statusTarget?:HTMLElement|null}} props
 */
export default function ActivityNameRefiner({ value, onChange, inputRef, children, statusTarget = null }) {
  const id = useId(), root = useRef(null), panel = useRef(null)
  const request = useRef(null), generation = useRef(0), currentValue = useRef(value)
  const [result, setResult] = useState(null), [previous, setPrevious] = useState(null)
  useLayoutEffect(() => { currentValue.current = value }, [value])
  const open = result !== null && result.sourceText === value
  const busy = open && result.status === 'loading'
  const close = () => { generation.current += 1; request.current?.abort(); setResult(null) }

  async function load() {
    if (!value.trim() || busy) return
    request.current?.abort()
    const controller = new AbortController(), version = ++generation.current, text = value
    request.current = controller
    setResult({ sourceText: text, status: 'loading', suggestions: [] })
    try {
      const response = await getActivitySuggestions({ text, signal: controller.signal })
      if (controller.signal.aborted || version !== generation.current || currentValue.current !== text) return
      setResult({ sourceText: text, status: 'ready', suggestions: response.suggestions })
    } catch (error) {
      if (error.name !== 'AbortError' && version === generation.current && currentValue.current === text) {
        setResult({ sourceText: text, status: 'error', suggestions: [] })
      }
    }
  }

  // External value changes and unmount cancel pending work; neither starts a request.
  useEffect(() => { generation.current += 1; request.current?.abort() }, [value])
  useEffect(() => () => { generation.current += 1; request.current?.abort() }, [])
  useEffect(() => {
    if (!open) return undefined
    const outside = event => { if (!root.current?.contains(event.target)) close() }
    const escape = event => {
      if (event.key !== 'Escape') return
      const restore = panel.current?.contains(document.activeElement)
      close()
      if (restore) inputRef.current?.focus()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open, inputRef])

  function apply(text) {
    setPrevious({ original: value, applied: text })
    onChange(text); close(); inputRef.current?.focus()
  }
  function navigate(event) {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return
    const buttons = [...panel.current.querySelectorAll('button:not(:disabled)')]
    const index = buttons.indexOf(document.activeElement)
    buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus()
    event.preventDefault()
  }
  const undo = previous && value === previous.applied ? <div className="activity-refiner-undo" role="status">Suggestion applied.
    <button type="button" onClick={() => { onChange(previous.original); setPrevious(null); close(); inputRef.current?.focus() }}><Undo2 size={14} aria-hidden="true" />Undo</button>
  </div> : null

  return <div className="activity-name-refiner" ref={root}>
    <div className="activity-name-refiner-entry" onChange={() => { close(); setPrevious(null) }} onKeyDown={event => {
      if (open && event.key === 'ArrowDown' && event.altKey) { event.preventDefault(); panel.current?.querySelector('button')?.focus() }
    }}>
      {children}
    </div>
    <div className="activity-refiner-card">
      <div className="activity-refiner-card-copy">
        <p id={`${id}-help`}>Click to get clearer wording. Apply only the suggestion you prefer.</p>
      </div>
      <button type="button" className="activity-refine-button" disabled={!value.trim() || busy} aria-describedby={`${id}-help`} aria-expanded={open} aria-controls={open ? id : undefined} onClick={load}>
        {busy ? <LoaderCircle size={16} className="activity-refiner-spinner" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
        {busy ? 'Preparing suggestions...' : 'Improve / Refine'}
      </button>
    </div>
    {statusTarget ? createPortal(undo, statusTarget) : undo}
    {open && <div ref={panel} id={id} role="region" aria-label="Activity name suggestions" className="activity-refiner-popover activity-refiner-suggestions" onKeyDown={navigate}>
      <div className="activity-refiner-heading"><strong>Suggested Activity Names</strong><button type="button" aria-label="Close suggestions" onClick={() => { close(); inputRef.current?.focus() }}><X size={16} /></button></div>
      <div aria-live="polite">
        {busy && <p>Preparing suggestions...</p>}
        {result.status === 'error' && <p>Suggestions could not load. <button type="button" onClick={load}>Retry</button></p>}
        {result.status === 'ready' && !result.suggestions.length && <p>No suggestions available. Edit the activity name and click Improve / Refine to try again.</p>}
      </div>
      <ul className="activity-refiner-list">{result.suggestions.map((suggestion, index) => <li key={suggestion.id}>
        <button type="button" className="activity-suggestion-row" aria-label={`Apply suggestion ${index + 1}: ${suggestion.text}`} onClick={() => apply(suggestion.text)}><span className="activity-suggestion-text">{suggestion.text}</span></button>
      </li>)}</ul>
    </div>}
  </div>
}
