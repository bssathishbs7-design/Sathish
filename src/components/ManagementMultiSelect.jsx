import { useEffect, useLayoutEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import './ManagementMultiSelect.css'

/** Controlled multi-select. Options are {value, label}; value is an array of IDs.
 * floating uses a top-layer popover anchored to the trigger without resizing its dialog.
 */
export default function ManagementMultiSelect({ label, options, value, onChange, disabled = false, error, placeholder = 'Select subjects', searchLabel = 'Search subjects', emptyLabel = 'No matching subjects.', allowSelectAll = false, compact = false, floating = false, allLabel }) {
  const id = useId(), root = useRef(null), trigger = useRef(null), search = useRef(null), menu = useRef(null)
  const [open, setOpen] = useState(false), [query, setQuery] = useState('')
  const selected = options.filter(option => value.includes(option.value))
  const allSelected = options.length > 0 && selected.length === options.length && selected.length === value.length
  const visible = options.filter(option => option.label.toLowerCase().includes(query.trim().toLowerCase()))
  useLayoutEffect(() => {
    if (!open || !floating) return
    const panel = menu.current
    panel.showPopover()
    const position = () => {
      const rect = trigger.current.getBoundingClientRect()
      const gap = parseFloat(getComputedStyle(panel).getPropertyValue('--s-1')) || 4
      const below = window.innerHeight - rect.bottom - gap * 2
      const above = rect.top - gap * 2
      panel.style.width = rect.width + 'px'
      panel.style.left = Math.max(gap, Math.min(rect.left, window.innerWidth - rect.width - gap)) + 'px'
      panel.style.maxHeight = Math.max(0, Math.max(below, above)) + 'px'
      const height = panel.getBoundingClientRect().height
      const useAbove = below < height && above > below
      panel.style.top = (useAbove ? rect.top - height - gap : rect.bottom + gap) + 'px'
    }
    position()
    const observer = new ResizeObserver(position)
    observer.observe(trigger.current)
    observer.observe(panel)
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
      if (panel.matches(':popover-open')) panel.hidePopover()
    }
  }, [open, floating])
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
      <span title={selected.map(option => option.label).join(', ')}>{allLabel && allSelected ? allLabel : selected.length ? selected.slice(0, compact ? 2 : selected.length).map(option => option.label).join(', ') + (compact && selected.length > 2 ? ` +${selected.length - 2}` : '') : placeholder}</span>
      {!compact && selected.length > 0 && <small>{selected.length} selected</small>}<ChevronDown size={14} aria-hidden="true" />
    </button>
    {open && <div ref={menu} popover={floating ? "manual" : undefined} className={`management-multi-menu${floating ? " is-floating" : ""}`} id={id + '-choices'} role="group" aria-labelledby={id + '-label'}>
      <div className="management-multi-search"><Search size={14} aria-hidden="true" /><input ref={search} type="search" aria-label={searchLabel} placeholder={searchLabel} value={query} onChange={event => setQuery(event.target.value)} /></div>
      <div className="management-multi-options">{allLabel && <label className="management-multi-all"><input type="checkbox" disabled={disabled || !options.length} checked={allSelected}
        ref={node => { if (node) node.indeterminate = selected.length > 0 && !allSelected }}
        onChange={() => onChange(allSelected ? [] : options.map(option => option.value))} /><span>{allLabel}</span></label>}{visible.map(option => <label key={option.value}><input type="checkbox" disabled={disabled} checked={value.includes(option.value)} onChange={() => onChange(value.includes(option.value) ? value.filter(item => item !== option.value) : [...value, option.value])} /><span>{option.label}</span></label>)}{!visible.length && <p>{emptyLabel}</p>}</div>
      <div className="management-multi-footer">{allowSelectAll && !allLabel && <button type="button" disabled={disabled || !options.length || selected.length === options.length} onClick={() => onChange(options.map(option => option.value))}>Select all</button>}<span aria-live="polite">{selected.length} selected</span><button type="button" className="fm-link" disabled={disabled || !value.length} onClick={() => onChange([])}>{allowSelectAll ? 'Clear selection' : 'Clear'}</button><button type="button" className="fm-btn" onClick={close}>Done</button></div>
    </div>}
    {error && <small id={id + '-error'} className="fm-field-error" role="alert">{error}</small>}
  </div>
}
