import { useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, LoaderCircle, LockKeyhole, Paperclip, Plus, Trash2 } from 'lucide-react'
import LogbookDrawer from './LogbookDrawer'
import LogbookAccordionSection from './LogbookAccordionSection'
import LogbookPicker from './LogbookPicker'
import { FACULTY } from '../../services/logbookSample'
import { eligibleReviewers } from '../../services/logbookPeople'
import { CATEGORIES, SUBJECTS, availableLogCategories, changeLogSelection, getLogbookGroups, getLogbookField, recentLogCategories } from '../../services/logbookCatalog'
import { saveLogbookEntry, today, validateEntry } from '../../services/logbook'
import './LogbookEntryForm.css'

/** Progressive accordion learner form. Selection changes confirm only when entered fields would be removed.
 * @param {{entry:Object, entries:Object[], mode:'new'|'edit'|'remedial', theme:string, onSaved:Function, onClose:Function}} props
 */
export default function LogbookEntryForm({ entry, entries = [], mode, theme, onSaved, onClose }) {
  const [form, setForm] = useState(() => ({ ...entry, values: { ...entry.values }, extra: { ...entry.extra, attachments: entry.extra?.attachments || [] }, fAck: false }))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const [dirty, setDirty] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [selectionChange, setSelectionChange] = useState(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [step, setStep] = useState(entry.subject && entry.cat ? 1 : 0)
  const formRef = useRef(null)
  const noticeRef = useRef(null)
  const savingRef = useRef(false)
  const lock = Boolean(form.linkedTo || form.assignment || form.status === 'Returned')
  const subject = SUBJECTS.find((item) => item.name === form.subject)
  const category = CATEGORIES.find((item) => item.id === form.cat)
  const groups = getLogbookGroups(form.cat, form.subject, Boolean(form.linkedTo)).map(group => {
    // Pair short identifiers and dates; keep long activity titles on their own row.
    const date = group.fields.find(field => field.key === 'date')
    const first = group.fields[0]
    return date && first && !first.wide && first.key !== 'date'
      ? { ...group, fields: [first, date, ...group.fields.filter(field => field !== first && field !== date)] }
      : group
  })
  const schemaKeys = new Set(groups.flatMap(group => group.fields.map(field => field.key)))
  const previousValues = Object.entries(form.values).filter(([key, value]) => !schemaKeys.has(key) && String(value || '').trim())
  const visibleCategories = availableLogCategories(form.subject, form.cat)
  const recent = recentLogCategories(entries).filter(item => visibleCategories.some(category => category.id === item.id))
  const subjectOptions = SUBJECTS.map((item) => ({ value: item.name, label: `${item.label} · ${item.phase}`, group: item.phase, search: item.name }))
  const categoryOptions = visibleCategories.map((item) => ({ value: item.id, label: item.name, group: item.group }))
  const validation = validateEntry(form, true)
  const contextReady = Boolean(subject && category && !validation.subject && !validation.cat)
  const detailsErrors = Object.fromEntries(Object.entries(validation).filter(([key]) => !['faculty', 'fAck'].includes(key)))
  const detailsReady = contextReady && !Object.keys(detailsErrors).length
  const openStep = (next) => {
    setStep(next)
    requestAnimationFrame(() => {
      const heading = formRef.current?.querySelector('#lb-step-' + next + '-heading')
      heading?.focus()
      heading?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    })
  }
  const commitSelection = (next) => {
    setDirty(true); setErrors({}); setForm(next); setSelectionChange(null)
    if (next.subject && next.cat) openStep(1)
  }
  const clearError = (key) => setErrors((current) => ({ ...current, [key]: '' }))
  const change = (key, value) => { setDirty(true); clearError(key); setForm((current) => ({ ...current, fAck: false, [key]: value })) }
  const valueChange = (key, value) => {
    setDirty(true); clearError(key)
    setForm((current) => {
      const values = { ...current.values, [key]: value }
      if (key === 'competency') {
        const skill = subject?.skills.find((item) => item.code === value)
        if (skill && schemaKeys.has('activity') && !current.assignment?.locked?.includes('activity')) values.activity = skill.name
      }
      return { ...current, values, fAck: false }
    })
  }
  const extraChange = (key, value) => { setDirty(true); clearError(key); setForm((current) => ({ ...current, extra: { ...current.extra, [key]: value }, fAck: false })) }
  const showNotice = () => requestAnimationFrame(() => { noticeRef.current?.scrollIntoView({ block: 'nearest' }); noticeRef.current?.focus() })
  const select = (key, value) => {
    if (lock || form[key] === value) return
    const change = changeLogSelection(form, key, value)
    if (change.removed.length) { setSelectionChange(change); showNotice(); return }
    commitSelection(change.form)
  }
  const revealErrors = (next) => {
    setErrors(next)
    const first = Object.keys(next)[0]
    setStep(['subject', 'cat'].includes(first) ? 0 : ['faculty', 'fAck'].includes(first) ? 2 : 1)
    if (next.remarks || next.attachments) setMoreOpen(true)
    requestAnimationFrame(() => {
      const field = formRef.current?.querySelector(`[name="${Object.keys(next)[0]}"]`)
      field?.focus()
      field?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    })
  }
  const save = async (submit) => {
    if (savingRef.current) return
    const next = validateEntry(form, submit)
    if (Object.keys(next).length) { setConfirmClose(false); revealErrors(next); return }
    savingRef.current = true
    setBusy(true); setFailure('')
    try { await saveLogbookEntry(form, submit); onSaved(submit ? 'Entry submitted for verification.' : form.assignment ? 'Progress saved.' : 'Changes saved.') }
    catch (error) { setFailure(error.message); showNotice(); setBusy(false) }
    finally { savingRef.current = false }
  }
  const advance = () => {
    const next = step === 0 ? Object.fromEntries(Object.entries(validation).filter(([key]) => ['subject', 'cat'].includes(key))) : detailsErrors
    if (Object.keys(next).length) { revealErrors(next); return }
    setErrors({}); openStep(step === 0 ? 1 : 2)
  }
  const close = () => {
    if (!dirty) { onClose(); return }
    if (mode !== 'edit' && form.subject && form.cat && !Object.keys(validateEntry(form)).length) { void save(false); return }
    setConfirmClose(true); showNotice()
  }
  const attach = async (files) => {
    if (files.length + form.extra.attachments.length > 3) { setFailure('Attach up to three photos.'); showNotice(); return }
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 300 * 1024)) { setFailure('Choose JPG, PNG or WebP photos up to 300 KB each.'); showNotice(); return }
    setBusy(true); setFailure('')
    try {
      const attachments = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve({ name: file.name, kind: 'image', dataUrl: reader.result })
        reader.onerror = () => reject(new Error('A photo could not be read. Try another file.'))
        reader.readAsDataURL(file)
      })))
      extraChange('attachments', [...form.extra.attachments, ...attachments])
    } catch (error) { setFailure(error.message); showNotice() } finally { setBusy(false) }
  }
  const field = (key, definition = getLogbookField(form.cat, key, form.subject)) => {
    const props = { id: `lb-${key}`, name: key, value: (key === 'date' ? form.date : form.values[key]) || '', onChange: (event) => key === 'date' ? change('date', event.target.value) : valueChange(key, event.target.value), 'aria-invalid': Boolean(errors[key]), 'aria-describedby': errors[key] ? `lb-error-${key}` : undefined, 'aria-required': Boolean(definition.required), placeholder: definition.placeholder, disabled: Boolean(form.assignment?.locked?.includes(key)) }
    const configuredCompetencies = key === 'competency' && subject?.skills.length > 0
    return <label className={`lb-field ${definition.wide || (form.cat === 'emergency' && key === 'date') ? 'lb-field-wide' : ''}`} key={key} htmlFor={`lb-${key}`}>
      <span>{definition.label}{definition.required && <span className="lb-required" aria-hidden="true"> *</span>}</span>
      {definition.type === 'select' ? <span className="lb-entry-select"><select {...props}><option value="">Choose one</option>{props.value && !definition.options.includes(props.value) && <option value={props.value}>{props.value} (previous value)</option>}{definition.options.map(option => <option key={option}>{option}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span>
        : definition.type === 'textarea' ? <textarea {...props} rows={3} maxLength={4000} />
          : <><input {...props} list={configuredCompetencies ? 'lb-competency-options' : undefined} type={definition.type || 'text'} maxLength={500} {...(definition.type === 'date' ? { max: today() } : definition.type === 'number' ? { min: 1, step: 1 } : {})} />{configuredCompetencies && <datalist id="lb-competency-options">{subject.skills.map(skill => <option key={skill.code} value={skill.code}>{skill.name}</option>)}</datalist>}</>}
      {definition.hint && <small>{definition.hint}</small>}
      {errors[key] && <small className="lb-error" id={`lb-error-${key}`}>{errors[key]}</small>}
    </label>
  }
  return <LogbookDrawer variant="form" title={mode === 'remedial' ? 'Log a remedial attempt' : mode === 'edit' ? 'Edit logbook entry' : 'New logbook entry'} subtitle="Choose an activity, add details, then send for verification." theme={theme} onClose={close} busy={busy}>
    <form ref={formRef} className="lb-entry-form" onSubmit={(event) => { event.preventDefault(); if (!selectionChange && !busy) { if (step === 2) void save(true); else advance() } }} noValidate>
      <fieldset disabled={busy} className="lb-entry-scroll">
        {(failure || confirmClose || selectionChange) && <div ref={noticeRef} tabIndex={-1} className="lb-form-notices">
          {failure && <div className="lb-alert lb-error" role="alert">{failure}</div>}
          {selectionChange && <div className="lb-alert" role="alert"><strong>Keep your entered information?</strong><p>This selection would clear: {selectionChange.removed.join(', ')}. All other fields will be kept.</p><div className="lb-actions"><button type="button" className="lb-btn" onClick={() => setSelectionChange(null)}>Keep current selection</button><button type="button" className="lb-btn lb-primary" onClick={() => { commitSelection(selectionChange.form) }}>Change selection</button></div></div>}
          {confirmClose && <div className="lb-alert" role="alert"><strong>Keep your changes before closing?</strong><div className="lb-actions"><button type="button" className="lb-btn" onClick={() => setConfirmClose(false)}>Keep editing</button>{form.status !== 'Pending' && <button type="button" className="lb-btn" onClick={() => save(false)}>{form.status === 'Returned' ? 'Save corrections' : form.assignment ? 'Save progress' : 'Save draft'}</button>}<button type="button" className="lb-btn" onClick={onClose}>Discard changes</button></div></div>}
        </div>}
        <fieldset className="lb-form-sections" disabled={Boolean(selectionChange)}>
        {form.assignment && <div className="lb-alert">{form.assignment.instructions || 'Complete the assigned activity.'}<small> Faculty-supplied fields are locked.</small></div>}
        <p className="lb-form-hint"><span className="lb-required" aria-hidden="true">*</span> Required fields</p>
        <LogbookAccordionSection index={0} title="Subject & category" summary={contextReady ? subject.label + ' / ' + (category.shortName || category.name) : 'Choose where this learning belongs'} open={step === 0} complete={contextReady} onOpen={() => openStep(0)}>
            <LogbookPicker name="subject" label="Subject" value={form.subject} options={subjectOptions} onChange={(value) => select('subject', value)} placeholder="Search or select a subject" disabled={lock || busy} error={errors.subject} required />
          <LogbookPicker name="cat" label="Log category" value={form.cat} options={categoryOptions} onChange={(value) => select('cat', value)} placeholder="Search or select a log category" disabled={lock || busy} error={errors.cat} required />
          {!lock && recent.length > 0 && <div className="lb-recent-categories"><span>Recently used</span>{recent.map((item) => <button type="button" key={item.id} aria-pressed={form.cat === item.id} onClick={() => select('cat', item.id)} title={item.name}>{form.cat === item.id && <Check size={13} />}{item.shortName || item.name}</button>)}</div>}
          {lock && <p className="lb-form-hint"><LockKeyhole size={14} /> Subject and category are locked for this {mode === 'remedial' ? 'linked remedial attempt' : 'entry'}.</p>}
        </LogbookAccordionSection>
        <LogbookAccordionSection index={1} title="Activity details" summary={detailsReady ? (form.values.activity || form.values.topic || 'Required details completed') : contextReady ? 'Complete the fields for your selected category' : 'Select a subject and category first'} open={step === 1} complete={detailsReady} disabled={!contextReady} onOpen={() => openStep(1)}>
          {category && <>
          {category.subjects && !category.subjects.includes(form.subject) && <p className="lb-form-hint">Usually logged under {category.subjects.join(' / ')}.</p>}
          {groups.map(group => <section className="lb-schema-group" key={group.title} aria-label={group.title}>
            {group.title !== 'Record' && <h4>{group.title}{group.locked ? ' / Faculty only' : ''}</h4>}
            {group.note && <p className="lb-form-hint">{group.note}</p>}
            <div className={`lb-form-grid${group.locked ? ' lb-faculty-readonly-grid' : ''}`}>{group.fields.map(definition => group.locked
              ? <label className="lb-field" key={definition.key}><span>{definition.label}</span><input className="lb-faculty-readonly" readOnly value={definition.options.find(option => option.startsWith(form.grading?.[definition.key] + ' ')) || 'Awaiting faculty'} /></label>
              : field(definition.key, definition))}</div>
          </section>)}
          {previousValues.length > 0 && <details className="lb-more"><summary>Previously recorded information</summary><dl className="lb-record">{previousValues.map(([key, value]) => <div key={key}><dt>{getLogbookField(form.cat, key, form.subject)?.label || key}</dt><dd>{value}</dd></div>)}</dl></details>}
          <details className="lb-more" open={moreOpen} onToggle={(event) => setMoreOpen(event.currentTarget.open)}><summary><Plus size={15} /> Remarks, notes and photos <span>Optional</span></summary><div className="lb-form-grid">
            <label className="lb-field lb-field-wide"><span>Remarks</span><textarea name="remarks" rows={3} maxLength={500} value={form.extra.remarks || ''} onChange={(event) => extraChange('remarks', event.target.value)} /><small>Up to 500 characters. Included in your submission.</small></label>
            <label className="lb-field lb-field-wide"><span>Personal notes</span><textarea rows={3} value={form.extra.notes || ''} onChange={(event) => extraChange('notes', event.target.value)} maxLength={4000} /><small>Stay editable after approval. Not part of the signed record.</small></label>
            <label className="lb-field lb-field-wide"><span><Paperclip size={15} /> Photos ({form.extra.attachments.length}/3)</span><input name="attachments" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { void attach(Array.from(event.target.files)); event.target.value = '' }} /><small>JPG, PNG or WebP, up to 300 KB each.</small></label>
            {form.extra.attachments.map((photo, index) => <div key={`${photo.name}-${index}`} className="lb-attachment lb-field-wide"><span>{photo.name}</span><button type="button" className="lb-icon-btn" aria-label={`Remove ${photo.name}`} onClick={() => extraChange('attachments', form.extra.attachments.filter((_, i) => i !== index))}><Trash2 size={16} /></button></div>)}
          </div></details>
          </>}
        </LogbookAccordionSection>
        <LogbookAccordionSection index={2} title="Faculty verification" summary={form.faculty ? (FACULTY.find(person => person.id === form.faculty)?.name || 'Choose faculty') : 'Choose a reviewer and confirm your entry'} open={step === 2} complete={!Object.keys(validation).length} disabled={!contextReady} onOpen={() => { if (Object.keys(detailsErrors).length) revealErrors(detailsErrors); else openStep(2) }}>
          <label className="lb-field"><span>Verifying faculty <span className="lb-required" aria-hidden="true">*</span></span><span className="lb-entry-select"><select disabled={Boolean(form.assignment)} name="faculty" value={form.faculty} aria-required="true" aria-invalid={Boolean(errors.faculty)} aria-describedby={errors.faculty ? 'lb-faculty-error' : undefined} onChange={(event) => change('faculty', event.target.value)}><option value="">Select faculty</option>{eligibleReviewers(form.subject).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span>{errors.faculty && <small id="lb-faculty-error" className="lb-error">{errors.faculty}</small>}</label>
          <label className="lb-check"><input name="fAck" type="checkbox" checked={form.fAck} onChange={(event) => change('fAck', event.target.checked)} aria-required="true" aria-invalid={Boolean(errors.fAck)} aria-describedby={errors.fAck ? 'lb-ack-error' : undefined} /><span>I confirm that this is an accurate record of my learning activity. <span className="lb-required" aria-hidden="true">*</span></span></label>{errors.fAck && <small id="lb-ack-error" className="lb-error">{errors.fAck}</small>}
        </LogbookAccordionSection>
        </fieldset>
      </fieldset>
      <footer className="lb-drawer-foot lb-entry-footer"><span className="lb-entry-save-hint">Step {step + 1} of 3</span><div className="lb-actions">{form.status !== 'Pending' && <button type="button" className="lb-btn" disabled={busy || Boolean(selectionChange)} onClick={() => save(false)}>{form.status === 'Returned' ? 'Save corrections' : form.assignment ? 'Save progress' : 'Save draft'}</button>}<button type="submit" className="lb-btn lb-primary" disabled={busy || Boolean(selectionChange)}>{busy ? <LoaderCircle className="lb-spin" size={16} /> : step === 2 ? <Check size={16} /> : <ArrowRight size={16} />}{busy ? 'Saving…' : step === 2 ? form.status === 'Returned' ? 'Resubmit for verification' : 'Submit for verification' : 'Continue'}</button></div></footer>
    </form>
  </LogbookDrawer>
}
