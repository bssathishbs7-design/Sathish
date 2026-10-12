import { useState } from 'react'
import { Download, Upload, LoaderCircle } from 'lucide-react'
import LogbookDrawer from '../logbook/LogbookDrawer'
import LogbookConfirm from '../logbook/LogbookConfirm'
import { StudentField } from './StudentEditor'
import { previewStudentSheet, readStudentFile, downloadStudentTemplate } from '../../services/studentImport'
import './StudentImport.css'

/** Preview first; valid rows are committed together only after confirmation. */
export default function StudentImport({ data, batch, theme, onClose, onSave }) {
  const [batchId, setBatchId] = useState(batch || data.batches[0]?.id || '')
  const [sheet, setSheet] = useState(null), [name, setName] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [discard, setDiscard] = useState(false)
  let preview = [], previewError = ''
  if (sheet) { try { preview = previewStudentSheet(sheet, batchId, data) } catch (failure) { previewError = failure.message } }
  const invalid = preview.filter(row => row.errors.length).length
  const close = () => { if (sheet) setDiscard(true); else onClose() }
  const run = async operation => { setBusy(true); setError(''); try { await operation() } catch (failure) { setError(failure.message || 'The Excel file could not be read. Use the sample template.') } finally { setBusy(false) } }
  return <LogbookDrawer title="Upload students" subtitle="Preview an Excel file before adding students to First Year." eyebrow="Student management" theme={theme} variant="form" onClose={close} busy={busy}>
    <div className="sm-editor">
      <div className="sm-form-body">
        <StudentField label="Destination batch" value={batchId} onChange={setBatchId} disabled={busy} options={[{ value: '', label: 'Choose batch' }, ...data.batches.map(item => ({ value: item.id, label: `Batch ${item.id}` }))]} />
        <button type="button" className="lb-btn" disabled={busy} onClick={() => run(downloadStudentTemplate)}><Download size={16} />Download sample template</button>
        <label className="sm-upload"><Upload size={24} /><strong>Choose Excel file</strong><span>.xlsx · up to 5 MB · 1,000 students</span><input type="file" accept=".xlsx" disabled={busy || !batchId} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void run(async () => { setSheet(null); setName(file.name); setSheet(await readStudentFile(file)) }) }} /></label>
        {name && <p>{name}</p>}
        {preview.length > 0 && <><p role="status">{preview.length} student{preview.length === 1 ? '' : 's'} · {invalid} rows need correction. Destination: Batch {batchId}, First Year.</p><div className="sm-import-table"><table><thead><tr><th>Row</th><th>Student</th><th>Validation</th></tr></thead><tbody>{preview.map(row => <tr key={row.row}><td>{row.row}</td><td>{row.draft.name}<small>{row.draft.registrationId}</small></td><td className={row.errors.length ? 'sm-error' : ''}>{row.errors.join(' ') || 'Ready to import'}</td></tr>)}</tbody></table></div></>}
        {(error || previewError) && <p className="lb-alert sm-error" role="alert">{error || previewError}</p>}
        {invalid > 0 && <p className="sm-help">Correct the listed rows in Excel and choose the file again. No students have been imported.</p>}
        {discard && <LogbookConfirm title="Close import preview?" confirmLabel="Close preview" onCancel={() => setDiscard(false)} onConfirm={onClose}>No student records will be added.</LogbookConfirm>}
      </div>
      <footer className="lb-drawer-foot"><button type="button" className="lb-btn" disabled={busy} onClick={close}>Cancel</button><button className="lb-btn lb-primary" disabled={busy || !batchId || !preview.length || invalid > 0 || Boolean(previewError) || discard} onClick={() => run(async () => { await onSave({ type: 'import', rows: preview.map(row => row.draft) }); onClose() })}>{busy ? <LoaderCircle size={16} className="sm-spinner" /> : <Upload size={16} />}{busy ? 'Processing…' : `Import ${preview.length} student${preview.length === 1 ? '' : 's'}`}</button></footer>
    </div>
  </LogbookDrawer>
}
