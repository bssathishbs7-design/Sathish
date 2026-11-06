import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import './ManagementMultiSelect.css'

/** Controlled multi-select. Options are {value, label}; value is an array of IDs.
 * The expanding menu stays inside the dialog scroll area, including on mobile.
 */
export default function ManagementMultiSelect({ label, options, value, onChange, disabled = false, error }) {
  const id = useId(), root = useRef(null), trigger = useRef(null), search = useRef(null)
  const [open, setOpen] = useState(false), [query, setQuery] = useState('')
  const selected = options.filter(option => value.includes(option.value))
  const visible = options.filter(option => option.label.toLowerCase().includes(query.trim().toLowerCase()))
  useEffect(() => {
    if (!open) return
    search.current?.focus()
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  const close = () => { setOpen(false); trigger.current?.focus() }
  return <div className="management-multi" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }} onKeyDown={event => {
    if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() }
  }}>
    <label id={id + '-label'} htmlFor={id}>{label}</label>
    <button ref={trigger} id={id} type="button" className="management-multi-trigger" disabled={disabled} aria-expanded={open} aria-controls={id + '-choices'} aria-invalid={Boolean(error)} aria-describedby={error ? id + '-error' : undefined} onClick={() => { setQuery(''); setOpen(!open) }}>
      <span title={selected.map(option => option.label).join(', ')}>{selected.length ? selected.map(option => option.label).join(', ') : 'Select subjects'}</span>
      {selected.length > 0 && <small>{selected.length} selected</small>}<ChevronDown size={14} aria-hidden="true" />
    </button>
    {open && <div className="management-multi-menu" id={id + '-choices'} role="group" aria-labelledby={id + '-label'}>
      <div className="management-multi-search"><Search size={14} aria-hidden="true" /><input ref={search} type="search" aria-label="Search subjects" placeholder="Search subjects" value={query} onChange={event => setQuery(event.target.value)} /></div>
      <div className="management-multi-options">{visible.map(option => <label key={option.value}><input type="checkbox" disabled={disabled} checked={value.includes(option.value)} onChange={() => onChange(value.includes(option.value) ? value.filter(item => item !== option.value) : [...value, option.value])} /><span>{option.label}</span></label>)}{!visible.length && <p>No matching subjects.</p>}</div>
      <div className="management-multi-footer"><span aria-live="polite">{selected.length} selected</span><button type="button" className="fm-link" disabled={disabled || !value.length} onClick={() => onChange([])}>Clear</button><button type="button" className="fm-btn" onClick={close}>Done</button></div>
    </div>}
    {error && <small id={id + '-error'} className="fm-field-error" role="alert">{error}</small>}
  </div>
}
