import { useEffect, useRef, useState } from 'react'
import { Download, Upload, LoaderCircle, Info, CircleCheck } from 'lucide-react'
import StudentWorkspacePanel from './StudentWorkspacePanel'
import { StudentField } from './StudentEditor'
import { previewStudentSheet, analyseStudentFile, downloadStudentTemplate, downloadStudentErrors } from '../../services/studentImport'
import { academicYearFor } from '../../services/studentModel'
import './StudentImport.css'

/** Preview first; valid rows are committed together only after confirmation. */
export default function StudentImport({ data, batch, onClose, onSave }) {
  const originalFile = useRef(null)
  const fileInput = useRef(null), analysisRequest = useRef(null)
  const [step, setStep] = useState(1)
  const stepHeading = useRef(null)
  useEffect(() => { if (step === 2) stepHeading.current?.focus() }, [step])
  const [analysing, setAnalysing] = useState(false)
  useEffect(() => () => analysisRequest.current?.abort(), [])
  const [batchId, setBatchId] = useState(batch || data.batches[0]?.id || '')
  const academicYear = batchId ? academicYearFor(batchId) : ''
  const destinationError = !batchId
  const changeBatch = value => { setBatchId(value); setError('') }
  const [finished, setFinished] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [sheet, setSheet] = useState(null), [name, setName] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [discard, setDiscard] = useState(false)
  let preview = [], previewError = ''
  if (sheet && !finished) { try { preview = previewStudentSheet(sheet, batchId, data) } catch (failure) { previewError = failure.message } }
  const invalid = preview.filter(row => row.errors.length).length
  const close = () => { analysisRequest.current?.abort(); if (analysing) { onClose(); return } if (finished) { onClose(); return } if (sheet) setDiscard(true); else onClose() }
  const run = async operation => { setBusy(true); setError(''); try { await operation() } catch (failure) { setError(failure.message || 'The Excel file could not be read. Use the sample template.') } finally { setBusy(false) } }
  const analyse = async file => {
    originalFile.current = file
    analysisRequest.current?.abort()
    const request = new AbortController()
    analysisRequest.current = request
    setAnalysing(true); setSheet(null); setError(''); setDiscard(false); setName(file.name)
    try {
      const next = await analyseStudentFile(file, batchId, data, { signal: request.signal })
      if (!request.signal.aborted) setSheet(next)
    } catch (failure) {
      if (!request.signal.aborted) setError(failure.message || 'The Excel file could not be read. Use the sample template.')
    } finally {
      if (!request.signal.aborted) { setAnalysing(false); setStep(2) }
    }
  }
  const backToUpload = () => { originalFile.current = null; setStep(1); setSheet(null); setName(''); setError(''); setDiscard(false) }
  return <StudentWorkspacePanel title="Upload students" subtitle={finished ? 'Import completed successfully.' : step === 1 ? 'Step 1 of 2: Upload and analyse your Excel file.' : 'Step 2 of 2: Review validation results before importing.'} onClose={close} busy={busy}>
    <div className="sm-editor">
      <div className="sm-form-body">
        {finished && <div role="status" className="sm-import-ready"><CircleCheck size={22} aria-hidden="true" /><div><strong>All {importedCount} students were imported successfully.</strong><p>Select Finish to return to the batch.</p></div></div>}
        {!finished && <fieldset disabled={busy || analysing}>
        {step === 1 && <>
        <div className="sm-import-onboarding-notice"><Info size={18} aria-hidden="true" /><p><strong>First Year onboarding only</strong><span>Upload new First Year students only. They will join the selected batch.</span></p></div>
        <div className="sm-import-destination">
          <StudentField label="Destination batch" value={batchId} onChange={changeBatch} options={[{ value: '', label: 'Choose batch' }, ...data.batches.map(item => ({ value: item.id, label: 'Batch ' + item.id }))]} />
          <StudentField label="Academic year" value={academicYear} onChange={() => {}} disabled={!batchId} options={batchId ? [academicYear] : [{ value: '', label: 'Choose batch first' }]} />
        
        </div>
        <button type="button" className="lb-btn" disabled={busy} onClick={() => run(() => downloadStudentTemplate())}><Download size={16} />Download sample template</button>
        {analysing ? <div className="sm-upload sm-upload-analysis" role="status" aria-live="polite" aria-busy="true"><LoaderCircle size={28} className="sm-spinner" aria-hidden="true" /><strong>Analysing your Excel file...</strong><span>Checking required fields, formats, duplicates and SGT.</span><span>Results will appear after at least 30 seconds.</span><span className="sm-upload-filename">{name}</span></div> : (<div className="sm-upload"><Upload size={24} aria-hidden="true" /><strong>Choose Excel file</strong><span>.xlsx · up to 5 MB · 1,000 students</span><button type="button" className="lb-btn sm-upload-button" disabled={busy || !batchId} onClick={() => fileInput.current?.click()}>{analysing ? 'Analysing...' : busy ? 'Processing...' : name ? 'Choose another file' : 'Choose file'}</button><input ref={fileInput} hidden aria-label="Choose Excel file" type="file" accept=".xlsx" disabled={busy || !batchId} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void analyse(file) }} />{name && <span className="sm-upload-filename" title={name}>{name}</span>}</div>)}
        </>}
        {step === 2 && <>
        <div className="sm-import-review-header"><h3 className="sm-import-review-heading" ref={stepHeading} tabIndex={-1}>Validation results</h3>
        <p className="sm-import-review-filename" title={name}>{name}</p></div>
        {preview.length > 0 && invalid === 0 && <div role="status" className="sm-import-ready"><CircleCheck size={22} aria-hidden="true" /><strong>All {preview.length} students are ready to import.</strong></div>}
        {(error || previewError) && <p className="lb-alert sm-error" role="alert">{error || previewError}</p>}
        {invalid > 0 && <div className="sm-import-error-block" role="alert"><div className="sm-import-error-heading"><strong>Correct {invalid} rows before importing</strong><button type="button" className="lb-btn" onClick={() => run(() => downloadStudentErrors(preview, originalFile.current))}>Download Excel with errors</button></div>
        <p>Download the workbook. Sheet1 contains valid students; correct the students listed in the Errors sheet. Then select Back to upload to choose the corrected file. No students have been imported.</p></div>}
        </>}
        {step === 1 && error && <p className="lb-alert sm-error" role="alert">{error}</p>}
        {discard && <div className="sm-inline-confirm" role="alert"><strong>Close preview without importing?</strong><button type="button" className="lb-btn" onClick={() => setDiscard(false)}>Keep preview</button><button type="button" className="lb-btn" onClick={onClose}>Close preview</button></div>}
        </fieldset>}
      </div>
      <footer className="sm-form-footer">{step === 2 && !finished && <button type="button" className="lb-btn sm-import-back" disabled={busy} onClick={backToUpload}>Back to upload</button>}<button type="button" className="lb-btn" disabled={busy} onClick={finished ? onClose : close}>{finished ? 'Close' : 'Cancel'}</button>{finished ? <button className="lb-btn lb-primary" onClick={onClose}>Finish</button> : step === 2 && <button className="lb-btn lb-primary" disabled={busy || analysing || destinationError || !preview.length || invalid > 0 || Boolean(previewError) || discard} onClick={() => run(async () => { const rows = preview.map(row => row.draft); await onSave({ type: 'import', rows }); setImportedCount(rows.length); setFinished(true) })}>{busy || analysing ? <LoaderCircle size={16} className="sm-spinner" /> : <Upload size={16} />}{busy ? 'Processing…' : `Import ${preview.length} student${preview.length === 1 ? '' : 's'}`}</button>}</footer>
    </div>
  </StudentWorkspacePanel>
}
