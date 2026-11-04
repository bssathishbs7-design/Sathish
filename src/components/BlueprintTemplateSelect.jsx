import CopyIdBadge from './CopyIdBadge'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Eye, Search, Trash2 } from 'lucide-react'
import BlueprintTemplatePreview from './BlueprintTemplatePreview'
import SaveChangesDialog from './SaveChangesDialog'
import { deleteBlueprintTemplate, resolveTemplateCognition } from '../services/blueprintTemplates'
import './BlueprintTemplateSelect.css'

/** Template picker with separate select/delete actions and confirmation.
 * @param {{templates:Array, selected?:Object, value:string, placeholder?:string, disabled:boolean, readOnly?:boolean, theme:string, onChange:Function, onDeleted:Function, unreadIds?:string[], onRead?:Function}} props
 */
export default function BlueprintTemplateSelect({ templates, selected, value, placeholder = "Select Blueprint Template", disabled, readOnly = false, theme, onChange, onDeleted, unreadIds = [], onRead }) {
  const [preview, setPreview] = useState(null)
  const closePreview = useCallback(() => setPreview(null), [])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState('institution')
  const [highlightedIds, setHighlightedIds] = useState([])
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
    const outside = event => { if (!root.current?.contains(event.target) && !event.target.closest('[data-template-preview]')) { setOpen(false); closePreview() } }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open, closePreview])
  const choose = next => { if (readOnly) return; onChange(next); closePreview(); setOpen(false); trigger.current?.focus() }
  const remove = async () => {
    if (busyRef.current || readOnly) return
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
  const unreadCount = unreadIds.filter(id => templates.some(template => template.id === id && template.scope !== 'institution')).length
  const filtered = templates.filter(template => (template.scope === 'institution' ? 'institution' : 'personal') === scope && matches(template.name))
    .sort((a, b) => Number(highlightedIds.includes(b.id)) - Number(highlightedIds.includes(a.id)))
  const changeScope = next => {
    setScope(next); setQuery(''); closePreview()
    if (next === 'personal' && unreadCount) { setHighlightedIds(unreadIds); onRead?.() }
    else setHighlightedIds([])
  }
  const badge = unreadCount > 0 && <span key={unreadCount} className="blueprint-template-unread" aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>
  return <div className="blueprint-template-picker create-assessment-blueprint-field" ref={root}>
    <span id={`${id}-label`}>Blueprint Template</span>
    <button ref={trigger} type="button" className="create-assessment-blueprint-select-trigger" aria-label={`Blueprint Template${unreadCount ? `, ${unreadCount} new templates` : ''}`}
      disabled={disabled} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => { closePreview(); setQuery(''); if (!open) changeScope(selected ? selected.scope === 'institution' ? 'institution' : 'personal' : 'institution'); else setHighlightedIds([]); setOpen(current => !current) }}>
      <strong>{selected?.name || placeholder}</strong><ChevronDown size={15} aria-hidden="true" />
      {badge}
    </button>
    {open && !disabled && <div id={id} className="blueprint-template-menu" role="dialog" aria-labelledby={`${id}-label`}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); closePreview(); setOpen(false); trigger.current?.focus() }
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && event.target.tagName !== 'INPUT') {
          const buttons = [...event.currentTarget.querySelectorAll('button')]
          const index = buttons.indexOf(document.activeElement)
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
          event.preventDefault(); buttons[next]?.focus()
        }
      }}>
      <div className="blueprint-template-search"><Search size={14} aria-hidden="true" /><input ref={search} type="search" value={query} onChange={event => { closePreview(); setQuery(event.target.value) }} placeholder="Search blueprint template" aria-label="Search blueprint template" /></div>
      <div className="blueprint-template-tabs" role="tablist" aria-label="Template source"
        onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
          event.preventDefault(); event.stopPropagation()
          const next = event.key === 'Home' ? 'institution' : event.key === 'End' ? 'personal' : scope === 'institution' ? 'personal' : 'institution'
          changeScope(next)
          event.currentTarget.querySelector(`[data-scope="${next}"]`)?.focus()
        }}>
        {[['institution', 'For Institution'], ['personal', 'For You']].map(([key, label]) => <button key={key} type="button" role="tab" data-scope={key} id={`${id}-${key}`} aria-controls={`${id}-templates`} aria-label={key === 'personal' && unreadCount ? `${label}, ${unreadCount} new templates` : label} aria-selected={scope === key} tabIndex={scope === key ? 0 : -1} onClick={() => changeScope(key)}>{label}{key === 'personal' && badge}</button>)}
      </div>
      <div className="blueprint-template-list" role="tabpanel" id={`${id}-templates`} aria-labelledby={`${id}-${scope}`}>
        {filtered.map(template => {
          const cognition = resolveTemplateCognition(template)
          return <div key={template.id} className={`blueprint-template-card ${value === template.id ? 'is-selected' : ''} ${highlightedIds.includes(template.id) ? 'is-new-template' : ''}`}>
            <button type="button" className="blueprint-template-choice" disabled={readOnly} title={readOnly ? 'Template selection is locked for this blueprint. Preview is available.' : undefined} aria-pressed={value === template.id} onClick={() => choose(template.id)}>
              <strong title={template.name}>{template.name}</strong><span className="blueprint-template-marks">{template.totalMarks} marks</span>
              <span className="blueprint-template-creator" title={template.createdBy || 'Creator unavailable'}>{template.createdBy ? `Created by: ${template.createdBy}` : 'Creator unavailable'}</span>
              <span className="blueprint-template-cognition">{cognition ? `LoT ${cognition.lot}% / HoT ${cognition.hot}%` : 'Cognition unavailable'}</span>
            </button>
            {template.blueprintId && <CopyIdBadge value={template.blueprintId} label="blueprint ID" />}
            <button type="button" className="blueprint-template-view" aria-label={`Preview template ${template.name}`} aria-haspopup="dialog" aria-expanded={preview?.template.id === template.id} aria-controls={preview?.template.id === template.id ? id + '-preview' : undefined}
              onClick={event => { const anchor = event.currentTarget; setPreview(current => current?.template.id === template.id ? null : { template, anchor }) }}><Eye size={15} aria-hidden="true" /></button>
            {scope === 'personal' && <button type="button" className="blueprint-template-delete" disabled={readOnly || template.approved} aria-label={`Delete template ${template.name}`} title="Delete template"
              onClick={() => { closePreview(); setPendingDelete(template); setError(''); setOpen(false); trigger.current?.focus() }}><Trash2 size={15} aria-hidden="true" /></button>}
          </div>
        })}
        {!filtered.length && <p>No templates found.</p>}
      </div>
    </div>}
    {open && preview && !disabled && <BlueprintTemplatePreview template={preview.template} anchor={preview.anchor} id={id + '-preview'} onClose={closePreview} />}
    {pendingDelete && <SaveChangesDialog className="blueprint-template-delete-dialog" theme={theme} title={`Delete template '${pendingDelete.name}'?`}
      description="Remove this saved template? Loaded assessment data will be kept."
      saveLabel="Yes, delete" cancelLabel="No" busyLabel="Deleting..." danger busy={busy} error={error}
      onSave={remove} onCancel={() => setPendingDelete(null)} />}
  </div>
}
