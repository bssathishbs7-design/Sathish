import { summarizeCognitionCounts } from '../utils/blueprintCognitionCounts'
import { updateBlueprintOutlineRow, normalizeBlueprintSetupInputs } from '../utils/blueprintSetupRows'
import BlueprintCountSuggestions from './BlueprintCountSuggestions'
import { getBlueprintCountSuggestions } from '../utils/blueprintCountSuggestions'
import { useEffect, useMemo, useState } from 'react'
import { ListChecks, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import SaveChangesDialog from './SaveChangesDialog'
import SaqCognitionToggle from './SaqCognitionToggle'
import { calculateBlueprintOutline } from '../utils/blueprintOutline'
import { getBlueprintOutlinePercentages } from '../utils/blueprintOutlinePercentages'
import './BlueprintQuestionOutline.css'

/** Controlled question outline. onNext receives no mutation until the parent validates totals.
 * @param {{draft:Object<string,{perQuestionMarks:string,questionCount:string,cognitionMode?:string}>,target:number,hotMarks:number,previousLaq?:object,laqParts?:Array,error?:string,theme?:string,onReset:Function,hasGeneratedSetup?:boolean,onChange:Function,onNext:Function,onBack:Function}} props
 */
export default function BlueprintQuestionOutline({ draft: storedDraft, target, onChange, onNext, onBack, hotMarks, previousLaq, laqParts, theme, onReset, hasGeneratedSetup = false, error = '' }) {
  const draft = useMemo(() => normalizeBlueprintSetupInputs(storedDraft), [storedDraft])
  useEffect(() => {
    if (draft !== storedDraft) onChange(draft)
  }, [draft, storedDraft, onChange])
  const [activeRow, setActiveRow] = useState(null)
  const suggestions = useMemo(() => activeRow ? getBlueprintCountSuggestions(draft, activeRow, { totalMarks: target, hotMarks }, previousLaq, laqParts) : null, [activeRow, draft, target, hotMarks, previousLaq, laqParts])
  const [resetOpen, setResetOpen] = useState(false)
  const canReset = hasGeneratedSetup || Object.values(draft).some(row => row.perQuestionMarks || row.questionCount || row.cognitionMode)
  const result = calculateBlueprintOutline(draft, target)
  const preview = useMemo(() => getBlueprintOutlinePercentages(draft, { totalMarks: target, hotMarks }, previousLaq, laqParts), [draft, target, hotMarks, previousLaq, laqParts])
  const update = (label, field, value, selectedHotCents) => {
    if (field === 'questionCount' && !/^\d*$/.test(value)) return
    if (field === 'perQuestionMarks' && !/^\d*$/.test(value)) return
    setActiveRow(label)
    onChange(updateBlueprintOutlineRow(draft, label, field, value, {totalMarks: target, hotMarks}, previousLaq, laqParts, selectedHotCents))
  }
  const saqTotal = result.rows.filter(row => row.label.startsWith('SAQs')).reduce((sum, row) => sum + row.totalCents, 0) / 100
  return <section className="blueprint-question-outline create-assessment-blueprint-spec-card is-type-summary qb-sort-scope" aria-label="Question type setup">
    <header className="create-assessment-blueprint-test-grid-title-row"><h3><ListChecks size={14} aria-hidden="true" />Question type setup</h3><span className={`create-assessment-blueprint-spec-status ${result.valid ? 'is-complete' : 'is-warning'}`} role="status">{result.remaining === 0 ? `${result.total} / ${target} marks` : `${Math.abs(result.remaining)} marks ${result.remaining > 0 ? 'remaining' : 'over'}`}</span></header>
    <div className="blueprint-outline-scroll"><table className="create-assessment-blueprint-spec-table"><thead><tr><th>Question type</th><th>Marks per question</th><th>Number of questions</th><th>Total marks</th><th>HoT questions</th><th>LoT questions</th></tr></thead>
      <tbody>{result.rows.map((row, index) => <OutlineRow key={row.label} row={row} showSaq={index === 1} saqTotal={saqTotal} preview={preview} update={update} onFocus={() => setActiveRow(row.label)} suggestions={activeRow === row.label ? suggestions : null} />)}</tbody>
      <tfoot><tr className="is-total"><td title="Main questions count each LAQ once. HoT and LoT counts list LAQ parts separately.">Total</td><td /><td /><td className={`is-footer-validation ${result.valid ? 'is-valid' : 'is-invalid'}`}>{result.total} / {target}</td>{['hot', 'lot'].map(level => { const counts = summarizeCognitionCounts(Object.values(preview.rows))[level]; return <td key={level}>{counts.questions + counts.parts || '-'}</td> })}</tr></tfoot>
    </table></div>
    {error && <p className="blueprint-outline-error" role="alert">{error}</p>}
    <footer><button type="button" className="create-assessment-blueprint-reset-btn" onClick={onBack}><ArrowLeft size={14} aria-hidden="true" />Back</button>
      <span>{!result.rows.every(row => row.valid) ? 'Enter positive whole numbers for marks and question counts.' : result.valid ? preview.ready ? 'Totals matched. Continue to the breakdown.' : 'Match the HoT and LoT targets to continue.' : 'Match the assessment total to continue.'}</span>
      <button type="button" className="create-assessment-blueprint-reset-btn" disabled={!canReset} onClick={() => setResetOpen(true)}><RotateCcw size={14} aria-hidden="true" />Reset Setup</button>
      <button type="button" className="create-assessment-blueprint-competency-btn" disabled={!preview.ready} onClick={() => { if (preview.ready) onNext() }}>Create Breakdown<ArrowRight size={14} aria-hidden="true" /></button></footer>
    {resetOpen && <SaveChangesDialog theme={theme} className="blueprint-setup-reset-dialog" title="Reset cognition percentages and question setup?"
      description="This will clear LoT and HoT percentages, question marks, counts, thinking levels and LAQ splits. Your subject and assessment total will stay the same."
      cancelLabel="No" saveLabel="Yes, reset" danger
      onCancel={() => setResetOpen(false)} onSave={() => { onReset(); setResetOpen(false) }} />}
  </section>
}

function OutlineRow({ row, showSaq, saqTotal, preview, update, onFocus, suggestions }) {
  const saq = row.label.startsWith('SAQs')
  const enabled = !saq || Boolean(row.cognitionMode)
  return <>{showSaq && <tr className="create-assessment-blueprint-question-type-row is-saq-summary"><td>SAQs (Total)</td><td /><td /><td>{saqTotal || '-'}</td><CognitionCountCells value={preview.saq} /></tr>}
    <tr onFocus={onFocus} className={`create-assessment-blueprint-question-type-row ${saq ? 'is-child' : ''}`}><td><div className="blueprint-outline-type"><span className={saq ? 'create-assessment-blueprint-question-type-child-label' : undefined}>{saq ? row.label.slice(6, -1) : row.label}</span>{saq && <SaqCognitionToggle label={`Outline ${row.label}`} value={row.cognitionMode || null} onChange={value => update(row.label, 'cognitionMode', value)} />}</div></td>
      <td><input aria-label={`${row.label} outline marks per question`} inputMode="numeric" disabled={!enabled} value={row.perQuestionMarks || ''} onChange={event => update(row.label, 'perQuestionMarks', event.target.value)} aria-invalid={row.entered && !row.valid} /></td>
      <td><input aria-label={`${row.label} outline number of questions`} inputMode="numeric" disabled={!enabled} value={row.questionCount || ''} onChange={event => update(row.label, 'questionCount', event.target.value)} aria-invalid={row.entered && !row.valid} /></td>
      <td className="blueprint-outline-number">{row.valid && row.entered ? row.totalCents / 100 : '-'}</td><CognitionCountCells value={preview.rows[row.label]} /></tr>
    {suggestions && <BlueprintCountSuggestions suggestions={suggestions} onSelect={(field, value, hot) => update(row.label, field, value, hot)} />}
  </>
}

/** Read-only cognition counts; LAQs count allocated parts. */
function CognitionCountCells({ value }) {
  return <>{['hot', 'lot'].map(level => <td key={level} className="blueprint-outline-number">
    {value?.[`${level}Count`] ? value.parts ? `${value[`${level}Count`]} ${value[`${level}Count`] === 1 ? 'Part' : 'Parts'}` : value[`${level}Count`] : '-'}
    {value?.provisional && <small className="blueprint-percentage-preview">Preview</small>}
  </td>)}</>
}
