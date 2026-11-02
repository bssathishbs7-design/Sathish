import { useState } from 'react'
import { Info } from 'lucide-react'
import { STUDY_YEARS, studying, monthEnd, isLeftOver, laterBatches } from '../../services/studentCalendar'
import { today } from '../../services/studentModel'
import './StudentClosingNotice.css'
export default function StudentClosingNotice({ data, batchId, onOpen }) {
  const [open, setOpen] = useState(() => localStorage.getItem('medsy-closing-open') === 'true')
  const date = today(), groups = []
  for (const batch of data.batches) for (const year of STUDY_YEARS) {
    const range = batch.calendars[year]; if (!range) continue
    const days = Math.ceil((Date.parse(monthEnd(range.to)) - Date.parse(date)) / 86400000)
    const students = data.students.filter(s => studying(s) && s.batch === batch.id && s.year === year)
    if (days > 30 || !students.length || (batchId && batch.id !== batchId && !students.some(s => laterBatches(data, s).some(b => b.id === batchId)))) continue
    groups.push({ batch: batch.id, year, days, students, end: monthEnd(range.to), left: students.some(s => isLeftOver(data, s, date)) })
  }
  if (!groups.length) return null
  return <aside className="sm-closing" role="note"><div><Info size={18} /><strong>Academic year closing</strong><span>{groups.reduce((n, g) => n + g.students.length, 0)} students in {groups.length} {groups.length === 1 ? 'class' : 'classes'} need a year-end decision</span>{groups.some(g => g.left) && <span className="sm-error">{groups.filter(g => g.left).length} {groups.filter(g => g.left).length === 1 ? 'class' : 'classes'} left over</span>}<button className="lb-btn" aria-expanded={open} onClick={() => { setOpen(!open); localStorage.setItem('medsy-closing-open', String(!open)) }}>{open ? 'Hide' : 'Show'}</button></div>{open && <div className="sm-closing-list">{groups.map(g => <div key={g.batch + g.year}><span><strong>Batch {g.batch} · {g.year}</strong> · {g.days < 0 ? 'ended' : 'ends'} {g.end} · {g.students.length} students</span><button className="lb-btn" onClick={() => onOpen(g.batch, g.year, g.left ? 'left' : 'all')}>{g.left ? 'Review left over' : g.year === 'Fourth Year' ? 'Open course completion' : 'Open promotion'}</button></div>)}<small>Alerts start 30 days before the closing month ends.</small></div>}</aside>
}
