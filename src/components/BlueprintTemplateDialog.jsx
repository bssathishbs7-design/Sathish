import { useRef, useState } from 'react'
import SaveChangesDialog from './SaveChangesDialog'
import { saveBlueprintTemplate } from '../services/blueprintTemplates'
import './BlueprintTemplateDialog.css'

/** @param {{snapshot:Object,theme:string,createdBy?:string,onSaved:Function,onCancel:Function}} props */
export default function BlueprintTemplateDialog({ snapshot, theme, createdBy = '', onSaved, onCancel }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const save = async () => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError('')
    try {
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)))
      const template = await saveBlueprintTemplate(name, snapshot, localStorage, createdBy)
      onSaved(template)
    } catch (failure) { setError(failure.message) }
    finally { busyRef.current = false; setBusy(false) }
  }
  return <SaveChangesDialog className="blueprint-template-dialog" theme={theme} title="Save blueprint template" description="Save Level of Cognition and Question Type Breakdown for reuse." saveLabel="Save" busy={busy} error={error} onSave={save} onCancel={onCancel}>
    <form className="blueprint-template-name" onSubmit={event => { event.preventDefault(); save() }}>
      <label htmlFor="blueprint-template-name">Blueprint name <em aria-hidden="true">*</em></label>
      <input id="blueprint-template-name" autoFocus required maxLength={80} value={name} disabled={busy} placeholder="Enter your blueprint name" aria-invalid={Boolean(error)} onChange={event => { setName(event.target.value); setError('') }} />
    </form>
  </SaveChangesDialog>
}
