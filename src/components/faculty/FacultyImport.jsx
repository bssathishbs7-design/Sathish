import { useState } from 'react'
import FacultyPanel from './FacultyPanel'
import { downloadFacultyTemplate, previewFacultyImport, readFacultyWorkbook } from '../../services/facultyImport'
import './FacultyImport.css'

export default function FacultyImport({data,onSave,onClose}) {
  const [sheet,setSheet]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[ack,setAck]=useState(false)
  const preview=sheet?previewFacultyImport(sheet,data):[]
  const valid=preview.filter(row=>!row.errors.length)
  const run=async action=>{setBusy(true);setError('');try{await action()}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <FacultyPanel title="Import faculty" subtitle="Preview identity and subject eligibility before saving" busy={busy} onClose={onClose}><fieldset className="fm-panel-body" disabled={busy}>
    {error&&<p className="fm-error" role="alert">{error}</p>}
    <div className="fm-import-controls"><div className="fm-import-template"><span>Excel template</span><button type="button" className="fm-btn" disabled={busy} onClick={()=>run(downloadFacultyTemplate)}>Download template</button></div><label className="fm-field"><span>Faculty workbook (.xlsx)</span><input type="file" accept=".xlsx" disabled={busy} onChange={e=>{const file=e.target.files?.[0]; if(file)void run(async()=>{const rows=await readFacultyWorkbook(file); const result=previewFacultyImport(rows,data);if(!result.length)throw new Error('Add faculty rows to the template.');setSheet(rows);setAck(false)})}}/></label></div>
    <p className="fm-note">Separate subjects with semicolons. Imported profiles start without teaching assignments.</p>
    {sheet&&<><p role="status">{valid.length} valid · {preview.length-valid.length} need correction</p><div className="fm-table-scroll"><table><thead><tr><th>Row</th><th>Faculty</th><th>Validation</th></tr></thead><tbody>{preview.map(row=><tr key={row.row}><td className="fm-num">{row.row}</td><td>{row.draft.name}<small>{row.draft.employeeId}</small></td><td>{row.errors.join(' ')||'Ready to import'}</td></tr>)}</tbody></table></div><label className="fm-inline-check"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/>Import these {valid.length} valid rows only. Rows with errors will be skipped.</label></>}
  </fieldset><footer className="fm-panel-footer"><button className="fm-btn" disabled={busy} onClick={onClose}>Cancel</button><button className="fm-btn fm-primary" disabled={busy||!ack||!valid.length} onClick={()=>run(()=>onSave({type:'import',rows:valid.map(r=>r.draft)}))}>{busy?'Processing…':'Import valid rows'}</button></footer></FacultyPanel>
}

