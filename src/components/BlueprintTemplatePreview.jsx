import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { resolveTemplateCognition } from '../services/blueprintTemplates'
import './BlueprintTemplatePreview.css'

/** Read-only saved-template preview; never modifies the active blueprint.
 * @param {{template:Object,anchor:HTMLElement,id:string,onClose:Function}} props
 */
export default function BlueprintTemplatePreview({ template, anchor, id, onClose }) {
  const popup = useRef(null)
  const [position, setPosition] = useState({ visibility: 'hidden' })
  useLayoutEffect(() => {
    const place = () => {
      if (!anchor.isConnected) return onClose()
      const rect = anchor.getBoundingClientRect(), box = popup.current.getBoundingClientRect()
      const left = Math.max(8, Math.min(rect.left - 24, innerWidth - box.width - 8))
      const top = Math.max(8, rect.top - box.height - 16)
      setPosition({ left, top, visibility: 'visible',
        '--arrow-x': `${Math.max(20, Math.min(rect.left + rect.width / 2 - left, box.width - 20))}px` })
    }
    const outside = e => { if (!popup.current?.contains(e.target) && !anchor.contains(e.target)) onClose() }
    const escape = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); anchor.focus(); onClose() } }
    place()
    const observer = new ResizeObserver(place); observer.observe(popup.current)
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape, true)
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true)
    return () => { observer.disconnect(); document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape, true); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true) }
  }, [anchor, onClose])
  const fields = ['perQuestionMarks', 'totalMarks', 'questions', 'hotQuestions', 'hotMarks', 'lotQuestions', 'lotMarks']
  const rows = Object.entries(template.breakdown || {}).map(([label, row]) => {
    const per = Number(row.perQuestionMarks), total = Number(row.totalMarks)
    const parts = label === 'LAQs' ? (template.laqParts || []).flatMap(q => q.splits || []) : []
    const count = per > 0 ? total / per : 0
    const hot = parts.length ? parts.filter(p => p.level === 'hot').length : row.cognitionMode === 'hot' ? count : row.cognitionMode === 'lot' ? 0 : row.hotQuestions === '' || row.hotQuestions == null ? null : Number(row.hotQuestions)
    const lot = parts.length ? parts.filter(p => p.level === 'lot').length : row.cognitionMode === 'lot' ? count : row.cognitionMode === 'hot' ? 0 : row.lotQuestions === '' || row.lotQuestions == null ? null : Number(row.lotQuestions)
    return { label: label.replace('SAQs (', '').replace(')', ''), child: label.startsWith('SAQs ('), perQuestionMarks: per, totalMarks: total, questions: count, hotQuestions: hot, lotQuestions: lot,
      hotMarks: parts.length ? parts.reduce((s,p) => s + (p.level === 'hot' ? Number(p.marks) : 0),0) : hot == null ? null : hot * per,
      lotMarks: parts.length ? parts.reduce((s,p) => s + (p.level === 'lot' ? Number(p.marks) : 0),0) : lot == null ? null : lot * per }
  })
  const sum = list => Object.fromEntries(fields.map(key => [key, key === 'perQuestionMarks' || list.some(r => r[key] == null) ? null : list.reduce((s,r) => s + r[key],0)]))
  const saqs = rows.filter(r => r.child)
  const display = [...rows.filter(r => !r.child), ...(saqs.length ? [{ label: 'SAQs (Total)', ...sum(saqs), summary: true }, ...saqs] : [])]
  const format = n => Number.isFinite(n) && n !== 0 ? Number(n.toFixed(2)) : '-'
  const renderRow = (row, key) => <tr key={key} className={row.summary ? 'is-summary' : row.child ? 'is-child' : undefined}><th scope="row">{row.label}</th>{fields.map(field => <td key={field}>{format(row[field])}</td>)}</tr>
  const dark = anchor.closest('.theme-dark, [data-theme="dark"], [data-theme="oled"]')
  const cognition = resolveTemplateCognition(template)
  const headings = [['Type', 'Question type'], ['M/Q', 'Marks per question'], ['Marks', 'Total marks'], ['Qs', 'Total questions'], ['HoT Qs', 'HoT questions'], ['HoT M', 'HoT marks'], ['LoT Qs', 'LoT questions'], ['LoT M', 'LoT marks']]
  return createPortal(<div className={dark ? 'theme-dark' : undefined}><section ref={popup} id={id} data-template-preview className="blueprint-template-preview qb-sort-scope" style={position} role="dialog" aria-label={template.name + ' question type breakdown'}>
    <svg className="blueprint-template-preview-tail" viewBox="0 0 24 16" aria-hidden="true"><path d="M1 1 L12 14 L23 1" /></svg>
    <header><div><strong>Question Type Breakdown</strong><small title={template.name}>{template.name} / Read-only</small></div><div className="blueprint-template-preview-summary"><span>Total: <b>{template.totalMarks ?? '-'}</b> marks</span><span>HoT: <b>{cognition ? `${cognition.hot}%` : '-'}</b> · LoT: <b>{cognition ? `${cognition.lot}%` : '-'}</b></span></div></header>
    {rows.length ? <div className="blueprint-template-preview-scroll"><table><thead><tr>{headings.map(([label, full]) => <th key={label} scope="col" title={full} aria-label={full}>{label}</th>)}</tr></thead><tbody>{display.map((row,i) => renderRow(row,i))}</tbody><tfoot>{renderRow({ label: 'Total', ...sum(rows) },'total')}</tfoot></table></div> : <p>Breakdown unavailable for this template.</p>}
  </section></div>, document.body)
}
