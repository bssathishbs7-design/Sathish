import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Info, Search } from 'lucide-react'
import { logbookCompetencies } from '../../services/logbookCompetencies'
import './LogbookCompetencySelect.css'
import LogbookTooltip from './LogbookTooltip'

/** Searchable single-select. Uses a stable item ID when supplied; otherwise stores one competency code.
 * @param {{subject:string,value:string,onChange:Function,label:string,disabled?:boolean,items?:Array<{id?:string,code:string,name:string}>,kind?:string}} props
 */
export default function LogbookCompetencySelect({ subject, value = '', onChange, label, disabled = false, items, kind = 'competency' }) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState('')
  const [tooltip, setTooltip] = useState(null)
  const dismissTimer = useRef(null)
  const keepTooltip = () => clearTimeout(dismissTimer.current)
  const hideTooltip = () => { keepTooltip(); dismissTimer.current = setTimeout(() => setTooltip(null), 150) }
  const showTooltip = (option, anchor) => { keepTooltip(); setTooltip({ ...option, anchor }) }
  useEffect(() => {
    const dismiss = () => setTooltip(null)
    document.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    return () => { clearTimeout(dismissTimer.current); document.removeEventListener('scroll', dismiss, true); window.removeEventListener('resize', dismiss) }
  }, [])
  const root = useRef(null), trigger = useRef(null), search = useRef(null), id = useId()
  const options = useMemo(() => items || logbookCompetencies(subject), [subject, items])
  const selected = value.split(',')[0].trim()
  useEffect(() => { if (value.includes(',')) onChange(selected) }, [value, selected, onChange])
  const selectedOption = options.find(option => (option.id || option.code) === selected)
  const selectedLabel = selectedOption ? `${selectedOption.code || (selectedOption.sample ? 'Sample' : 'Topic')}: ${selectedOption.name}` : selected
  const term = query.trim().toLowerCase()
  const matches = options.filter(option => `${option.code} ${option.name}`.toLowerCase().includes(term))
  useEffect(() => {
    if (!open) return undefined
    search.current?.focus()
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  const choose = code => { keepTooltip(); setTooltip(null); onChange(code); setOpen(false); trigger.current?.focus() }
  return <div className="lb-field lb-competency-select" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); if (tooltip) { keepTooltip(); setTooltip(null) } else { setOpen(false); trigger.current?.focus() } }
  }}>
    <span id={`${id}-label`}>{label}</span>
    <div className={`lb-competency-control${open ? ' is-open' : ''}`}>
    <button type="button" ref={trigger} className="lb-competency-trigger" disabled={disabled} aria-labelledby={`${id}-label ${id}-value`} aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => { setQuery(''); setOpen(current => !current) }}>
      <span id={`${id}-value`} title={selectedLabel}>{selectedLabel || `Search and select ${kind}`}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    {open && <div id={`${id}-panel`} className="lb-competency-panel" role="group" aria-labelledby={`${id}-label`}>
      <div className="lb-competency-search"><Search size={16} aria-hidden="true" /><input ref={search} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${kind}`} aria-label={`Search ${kind}`} /></div>
      <div className="lb-competency-options">{matches.map(option => <div key={option.id || option.code} className="lb-competency-option" onMouseEnter={event => showTooltip(option, event.currentTarget)} onMouseLeave={hideTooltip}>
        <input id={`${id}-choice-${option.id || option.code}`} type="radio" name={`${id}-competency`} onFocus={event => showTooltip(option, event.currentTarget)} onBlur={hideTooltip} aria-describedby={(tooltip?.id || tooltip?.code) === (option.id || option.code) ? `${id}-tooltip` : undefined} aria-label={`${option.code}: ${option.name}`} checked={selected === (option.id || option.code)} onChange={() => choose(option.id || option.code)} onClick={() => { if (selected === (option.id || option.code)) choose(option.id || option.code) }} />
        <span className="lb-competency-badge"><label htmlFor={`${id}-choice-${option.id || option.code}`} className="lb-competency-code">{option.code || (option.sample ? 'Sample' : 'Topic')}</label>
        <button className="lb-competency-info" type="button" aria-label={`About ${option.code || option.name}`} aria-describedby={(tooltip?.id || tooltip?.code) === (option.id || option.code) ? `${id}-tooltip` : undefined} onFocus={event => showTooltip(option, event.currentTarget)} onBlur={hideTooltip} onClick={event => showTooltip(option, event.currentTarget)}><Info size={13} aria-hidden="true" /></button></span>
        <label htmlFor={`${id}-choice-${option.id || option.code}`} className="lb-competency-summary">{option.name}</label>
      </div>)}</div>
      {!matches.length && <p role="status">{options.length ? `No matching ${kind === 'activity' ? 'activities' : kind === 'module' ? 'modules' : 'competencies'}.` : `No ${kind === 'module' ? 'modules' : 'competencies'} available for this subject.`}</p>}
    </div>}
    </div>
    {open && tooltip && <LogbookTooltip id={`${id}-tooltip`} anchor={tooltip.anchor} title={tooltip.code} onMouseEnter={keepTooltip} onMouseLeave={hideTooltip}>{tooltip.name}</LogbookTooltip>}
  </div>
}
