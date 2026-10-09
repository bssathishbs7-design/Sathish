import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Search, Trash2 } from 'lucide-react'
import SaveChangesDialog from './SaveChangesDialog'
import { deleteBlueprintTemplate, resolveTemplateCognition } from '../services/blueprintTemplates'
import './BlueprintTemplateSelect.css'

/** Template picker with separate select/delete actions and confirmation.
 * @param {{templates:Array, selected?:Object, value:string, placeholder?:string, disabled:boolean, theme:string, onChange:Function, onDeleted:Function}} props
 */
export default function BlueprintTemplateSelect({ templates, selected, value, placeholder = "Select Blueprint Template", disabled, theme, onChange, onDeleted }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const busyRef = useRef(false)
  const root = useRef(null)
  const trigger = useRef(null)
  const search = useRef(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  const choose = next => { onChange(next); setOpen(false); trigger.current?.focus() }
  const remove = async () => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError('')
    try {
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)))
      await deleteBlueprintTemplate(pendingDelete.id)
      onDeleted(pendingDelete)
      setPendingDelete(null)
      trigger.current?.focus()
    } catch (failure) { setError(failure.message) }
    finally { busyRef.current = false; setBusy(false) }
  }
  const matches = name => name.toLowerCase().includes(query.trim().toLowerCase())
  const filtered = templates.filter(template => matches(template.name))
  const showDefault = matches('Create Blueprint (Default)')
  return <div className="blueprint-template-picker create-assessment-blueprint-field" ref={root}>
    <span id={`${id}-label`}>Blueprint Template</span>
    <button ref={trigger} type="button" className="create-assessment-blueprint-select-trigger" aria-label="Blueprint Template"
      disabled={disabled} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => { setQuery(''); setOpen(current => !current) }}>
      <strong>{selected?.name || (value === 'default' ? 'Create Blueprint (Default)' : placeholder)}</strong><ChevronDown size={15} aria-hidden="true" />
    </button>
    {open && !disabled && <div id={id} className="blueprint-template-menu" role="dialog" aria-labelledby={`${id}-label`}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus() }
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && event.target.tagName !== 'INPUT') {
          const buttons = [...event.currentTarget.querySelectorAll('button')]
          const index = buttons.indexOf(document.activeElement)
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
          event.preventDefault(); buttons[next]?.focus()
        }
      }}>
      <div className="blueprint-template-search"><Search size={14} aria-hidden="true" /><input ref={search} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search blueprint template" aria-label="Search blueprint template" /></div>
      <div className="blueprint-template-list">
        {showDefault && <button type="button" className="blueprint-template-default" aria-pressed={value === 'default'} onClick={() => choose('default')}><Plus size={15} aria-hidden="true" /><span>Create Blueprint (Default)</span>{value === 'default' && <Check size={14} aria-hidden="true" />}</button>}
        {filtered.length > 0 && <h3 className="blueprint-template-list-heading">Saved Templates</h3>}
        {filtered.map(template => {
          const cognition = resolveTemplateCognition(template)
          return <div key={template.id} className={`blueprint-template-card ${value === template.id ? 'is-selected' : ''}`}>
            <button type="button" className="blueprint-template-choice" aria-pressed={value === template.id} onClick={() => choose(template.id)}>
              <strong title={template.name}>{template.name}</strong><span className="blueprint-template-marks">{template.totalMarks} marks</span>
              <span className="blueprint-template-creator" title={template.createdBy || 'Creator unavailable'}>{template.createdBy ? `Created by: ${template.createdBy}` : 'Creator unavailable'}</span>
              <span className="blueprint-template-cognition">{cognition ? `LoT ${cognition.lot}% / HoT ${cognition.hot}%` : 'Cognition unavailable'}</span>
            </button>
            <button type="button" className="blueprint-template-delete" aria-label={`Delete template ${template.name}`} title="Delete template"
              onClick={() => { setPendingDelete(template); setError(''); setOpen(false); trigger.current?.focus() }}><Trash2 size={15} aria-hidden="true" /></button>
          </div>
        })}
        {!filtered.length && !showDefault && <p>No templates found.</p>}
      </div>
    </div>}
    {pendingDelete && <SaveChangesDialog className="blueprint-template-delete-dialog" theme={theme} title={`Delete template '${pendingDelete.name}'?`}
      description="Remove this saved template? Loaded assessment data will be kept."
      saveLabel="Yes, delete" cancelLabel="No" busyLabel="Deleting..." danger busy={busy} error={error}
      onSave={remove} onCancel={() => setPendingDelete(null)} />}
  </div>
}
