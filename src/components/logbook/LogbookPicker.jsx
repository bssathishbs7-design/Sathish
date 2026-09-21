import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import './LogbookPicker.css'

/** Searchable, grouped single-select with keyboard navigation and a committed value.
 * @param {{name:string,label:string,value:string,options:Array<{value:string,label:string,group?:string,search?:string}>,onChange:Function,placeholder?:string,disabled?:boolean,error?:string,required?:boolean}} props
 */
export default function LogbookPicker({ name, label, value, options, onChange, placeholder = 'Search or select', disabled = false, error, required = false }) {
  const id = useId()
  const input = useRef(null)
  const list = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const selected = options.find((option) => option.value === value)
  const matches = options.filter((option) => `${option.label} ${option.group || ''} ${option.search || ''}`.toLowerCase().includes(query.trim().toLowerCase()))
  const activeIndex = Math.min(active, Math.max(0, matches.length - 1))
  const groups = [...new Set(matches.map((option) => option.group || ''))]
  useEffect(() => { if (open) list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }) }, [active, open, query])
  const show = () => { setQuery(''); setActive(Math.max(0, options.findIndex((option) => option.value === value))); setOpen(true) }
  const choose = (option) => { onChange(option.value); setOpen(false); setQuery('') }
  const keyDown = (event) => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); return }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && (open || event.key.startsWith('Arrow'))) {
      event.preventDefault()
      if (!open) { show(); return }
      setActive(event.key === 'Home' ? 0 : event.key === 'End' ? matches.length - 1 : (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % Math.max(1, matches.length))
    }
    if (event.key === 'Enter' && open) { event.preventDefault(); if (matches[activeIndex]) choose(matches[activeIndex]) }
  }
  return <div className={`lb-picker ${open ? 'is-open' : ''}`} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <label htmlFor={id}>{label}{required && <span className="lb-required" aria-hidden="true"> *</span>}</label>
    <div className={`lb-picker-control ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
      <Search size={16} aria-hidden="true" />
      <input ref={input} id={id} name={name} role="combobox" autoComplete="off" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={open && matches.length ? `${id}-option-${activeIndex}` : undefined} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} aria-required={required} disabled={disabled} value={open ? query : selected?.label || ''} placeholder={open && selected ? selected.label : placeholder} onFocus={show} onClick={() => { if (!open) show() }} onChange={(event) => { setQuery(event.target.value); setActive(0); setOpen(true) }} onKeyDown={keyDown} />
      <button type="button" tabIndex={-1} disabled={disabled} aria-label={`Show ${label.toLowerCase()} options`} onMouseDown={(event) => event.preventDefault()} onClick={() => { if (open) setOpen(false); else { input.current.focus(); show() } }}><ChevronDown size={16} /></button>
    </div>
    {error && <small id={`${id}-error`} className="lb-error">{error}</small>}
    {open && !disabled && <div className="lb-picker-menu">
      <div className="lb-picker-menu-head"><span>{query ? 'Search results' : 'Select an option'}</span><span aria-live="polite">{matches.length} options</span></div>
      <div ref={list} id={`${id}-list`} role="listbox" aria-label={label} className="lb-picker-list">
        {groups.map((group) => <div role="group" aria-label={group || label} key={group}>{group && <div className="lb-picker-group" aria-hidden="true">{group}</div>}{matches.filter((option) => (option.group || '') === group).map((option) => {
          const index = matches.indexOf(option)
          return <div key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={option.value === value} data-active={index === activeIndex} className="lb-picker-option" onMouseEnter={() => setActive(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option)}><span>{option.label}</span>{option.value === value && <Check size={16} aria-hidden="true" />}</div>
        })}</div>)}
        {!matches.length && <p className="lb-picker-empty">No matches. Try a different search.</p>}
      </div>
    </div>}
  </div>
}
