import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, FilePenLine, X } from 'lucide-react'
import { matchesBlueprintPickerRow } from '../utils/blueprintPicker'
import './BlueprintSelectionProgress.css'

/** Non-modal Blueprint panel. LAQ counts refer to whole questions, not their parts.
 * @param {{rows:Object[], progress:Object, activeId:string, bankQuestions?:Object[], loadBankQuestions:Function, selectedQuestions:Object[], onSelect:Function, onCreate:Function, onReview:Function}} props
 */
export default function BlueprintSelectionProgress({ rows, progress, activeId, bankQuestions, loadBankQuestions, selectedQuestions = [], onSelect, onCreate, onReview }) {
  const panel = useRef(null)
  const trigger = useRef(null)
  const headingId = useId()
  const [open, setOpen] = useState(false)
  const [loadedBank, setLoadedBank] = useState(null)
  const [type, setType] = useState('mcq')
  const inventory = bankQuestions ?? loadedBank
  const types = ['mcq', 'saq', 'laq'].filter(value => rows.some(row => row.type === value))
  const activeRows = rows.filter(row => row.type === type)
  const percent = progress.target ? Math.min(100, Math.max(0, progress.matched / progress.target * 100)) : 0
  const stage = percent >= 100 ? 'complete' : percent >= 50 ? 'progress' : 'starting'
  const stageLabel = stage === 'complete' ? 'Complete' : stage === 'progress' ? 'In progress' : 'Getting started'
  const picked = row => progress.used[row.id]?.length || 0
  const availability = useMemo(() => {
    if (!open || !inventory) return {}
    const excluded = new Set(selectedQuestions.map(q => String(q.originalQuestionId || q.id)))
    return Object.fromEntries(rows.map(row => {
      const matches = inventory.filter(q => q.status !== 'Draft' && matchesBlueprintPickerRow(q, row))
      return [row.id, {
        total: new Set(matches.map(q => String(q.originalQuestionId || q.id))).size,
        remaining: new Set(matches.filter(q => !excluded.has(String(q.originalQuestionId || q.id))).map(q => String(q.originalQuestionId || q.id))).size,
      }]
    }))
  }, [open, inventory, rows, selectedQuestions])
  useEffect(() => {
    if (!open) return undefined
    panel.current?.focus()
    const outside = event => {
      if (!panel.current?.contains(event.target) && !trigger.current?.contains(event.target)) setOpen(false)
    }
    const escape = event => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])
  const close = () => { setOpen(false); trigger.current?.focus() }
  const act = (handler, row) => { close(); handler(row) }
  const toggle = () => {
    if (open) { close(); return }
    if (!bankQuestions) setLoadedBank(loadBankQuestions())
    setType(rows.find(row => row.id === activeId)?.type || types[0])
    setOpen(true)
  }
  const status = row => {
    const needed = row.count - picked(row)
    const count = needed > 0 ? availability[row.id]?.remaining : availability[row.id]?.total
    if (count === undefined) return { text: 'Checking', tone: '' }
    if (!count) return { text: 'Not available', tone: 'is-unavailable' }
    if (count < needed) return { text: 'Partially available', tone: 'is-partial' }
    return { text: 'Available', tone: 'is-available' }
  }
  const overall = row => picked(row) >= row.count ? 'Done' : picked(row) > 0 ? 'In progress' : 'Pending'
  const renderAction = row => {
    if (picked(row) >= row.count) return <button type="button" onClick={() => act(onReview, row)}>Review</button>
    const available = availability[row.id]?.remaining
    return <>
      {(available > 0 || row.type === 'laq') && <button type="button" onClick={() => act(onSelect, row)}>{row.type === 'laq' ? 'View LAQs' : 'Apply filter'}</button>}
      {(available === undefined || available < row.count - picked(row)) && <button type="button" onClick={() => act(onCreate, row)}>Create question</button>}
    </>
  }
  const nextType = types[types.indexOf(type) + 1]
  const previousType = types[types.indexOf(type) - 1]
  return createPortal(<div className={`blueprint-progress-floating qb-sort-scope is-${stage}`}>
    <button ref={trigger} type="button" className="blueprint-progress-circle" onClick={toggle} aria-haspopup="dialog" aria-expanded={open} aria-label={`Blueprint progress: ${progress.matched} of ${progress.target} questions. ${stageLabel}`}>
      <span className="blueprint-progress-pulse" aria-hidden="true" />
      <svg className="blueprint-progress-ring" viewBox="0 0 80 80" aria-hidden="true"><circle className="ring-track" cx="40" cy="40" r="35" /><circle className="ring-value" cx="40" cy="40" r="35" pathLength="100" style={{ strokeDashoffset: 100 - percent }} /></svg>
      <strong>{progress.matched}<span>/{progress.target}</span></strong><small>Blueprint</small>
    </button>
    {open && <section ref={panel} tabIndex={-1} className="blueprint-steps-panel" role="dialog" aria-modal="false" aria-labelledby={headingId}>
      <header><h2 id={headingId}><FilePenLine size={15} />Blueprint question progress</h2><span className="blueprint-selected-count">Selected: {progress.matched} / {progress.target} questions &middot; {stageLabel}</span><button type="button" className="blueprint-panel-close" onClick={close} aria-label="Close Blueprint progress"><X size={16} /></button></header>
      <progress value={progress.matched} max={progress.target || 1} aria-label="Blueprint completion" />
      <nav aria-label="Question type steps">{types.map(value => {
        const sectionRows = rows.filter(row => row.type === value)
        return <button type="button" key={value} aria-current={type === value ? 'step' : undefined} onClick={() => setType(value)}>{value.toUpperCase()} <span>{sectionRows.reduce((n, row) => n + picked(row), 0)}/{sectionRows.reduce((n, row) => n + row.count, 0)}</span></button>
      })}</nav>
      <div className="blueprint-steps-scroll">
        {type !== 'laq' ? <table><thead><tr>{['Competency', ...(type === 'saq' ? ['Category'] : []), 'Level', 'Mark', 'No.of Qus', 'Picked', 'Overall Status', 'Action'].map(label => <th key={label} scope="col" className={["Level", "Mark", "No.of Qus", "Picked", "Overall Status"].includes(label) ? "is-centred" : undefined}>{label}</th>)}</tr></thead>
          <tbody>{activeRows.map(row => <tr key={row.id} className={`${row.id === activeId ? 'is-current' : ''} ${overall(row) === 'Done' ? 'is-complete' : ''}`}>
            <th scope="row">{row.competency}</th>{type === 'saq' && <td>{row.category}</td>}<td className="is-centred"><span className={`blueprint-level is-${row.level}`}>{row.level === 'hot' ? 'HoT' : 'LoT'}</span></td><td className="is-numeric">{row.marks}</td><td className="is-numeric">{row.count}</td><td className="is-numeric">{picked(row)}/{row.count}</td>
            <td className="is-centred"><span className={`blueprint-completion-icon ${overall(row) === 'Done' ? 'is-done' : 'is-incomplete'}`} role="img" aria-label={overall(row)} title={overall(row)}>{overall(row) === 'Done' ? <Check size={18} strokeWidth={2.5} aria-hidden="true" /> : <X size={18} strokeWidth={2.5} aria-hidden="true" />}</span></td><td><div className="blueprint-row-actions">{renderAction(row)}</div></td>
          </tr>)}</tbody></table> : activeRows.map((row, index) => <section className={`blueprint-laq-requirement ${row.id === activeId ? 'is-current' : ''}`} key={row.id}>
            <header><strong>LAQ Question {index + 1}</strong><span className="blueprint-laq-marks"><span>{row.marks}</span> marks</span><span className="blueprint-laq-status">Overall Status <span className={`blueprint-completion-icon ${overall(row) === 'Done' ? 'is-done' : 'is-incomplete'}`} role="img" aria-label={overall(row)} title={overall(row)}>{overall(row) === 'Done' ? <Check size={18} strokeWidth={2.5} aria-hidden="true" /> : <X size={18} strokeWidth={2.5} aria-hidden="true" />}</span></span></header>
            <table className="blueprint-laq-table">
              <thead><tr><th scope="col">Part</th><th scope="col">Competency</th><th scope="col" className="is-centred">Level</th><th scope="col" className="is-centred">Mark</th></tr></thead>
              <tbody>{row.parts.map(part => <tr key={part.id}>
                <th scope="row">Part {part.part}</th><td>{part.competency}</td><td className="is-centred"><span className={`blueprint-level is-${part.level}`}>{part.level === 'hot' ? 'HoT' : 'LoT'}</span></td><td className="is-numeric">{part.marks}</td>
              </tr>)}</tbody>
            </table>
            <div className="blueprint-laq-toolbar"><span className={`blueprint-qb-status ${status(row).tone}`}>{availability[row.id] ? (availability[row.id].total > 0 ? 'Exact split available' : 'No exact split match') : 'Checking'}</span><div className="blueprint-row-actions">{renderAction(row)}</div></div>
          </section>)}
      </div>
      <footer><span>{Math.max(0, progress.target - progress.matched)} remaining &middot; {progress.marks}/{progress.totalMarks} marks</span><div>{previousType && <button type="button" onClick={() => setType(previousType)}>Back: {previousType.toUpperCase()}</button>}{nextType && <button type="button" className="blueprint-next-step" onClick={() => setType(nextType)}>Next: {nextType.toUpperCase()}</button>}</div></footer>
    </section>}
  </div>, document.body)
}
