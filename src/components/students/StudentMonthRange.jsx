import { calendarLabel, calendarMonths, monthIndex, monthValue } from '../../services/studentCalendar'
import { ChevronDown } from 'lucide-react'
import './StudentMonthRange.css'
/** Controlled inclusive month range, shared by batch creation, calendar editing and promotion. */
export default function StudentMonthRange({ value, onChange, year, error }) {
  const currentYear = new Date().getFullYear()
  const yearOptions = [...new Set([
    ...Array.from({ length: 41 }, (_, index) => String(currentYear - 20 + index)),
    value.from?.slice(0, 4), value.to?.slice(0, 4),
  ].filter(item => /^\d{4}$/.test(item || '')))].sort()
  const change = (key, part, input) => {
    const pieces = (value[key] || '-').split('-'); pieces[part] = input
    const next = { ...value, [key]: pieces.join('-') }
    if (key === 'from' && Number.isFinite(monthIndex(next.from))) next.to = monthValue(monthIndex(next.from) + (year === 'Fourth Year' ? 17 : 11))
    onChange(next)
  }
  return <fieldset className="sm-month-range"><legend>{year} academic year</legend><div>{['from', 'to'].map(key => <div className="sm-month-pair" key={key}><span>{key === 'from' ? 'From' : 'To'}</span><label className="sm-select-control"><span className="sm-sr-only">{key} month</span><select aria-label={`${key} month`} value={value[key]?.slice(5) || ''} onChange={e => change(key, 1, e.target.value)}><option value="">Month</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{new Date(2026, i, 1).toLocaleDateString('en-GB', { month: 'short' })}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></label><label className="sm-select-control"><span className="sm-sr-only">{key} year</span><select aria-label={`${key} year`} value={value[key]?.slice(0, 4) || ''} onChange={e => change(key, 0, e.target.value)}><option value="">Year</option>{yearOptions.map(option => <option key={option} value={option}>{option}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></label></div>)}</div><small>{calendarLabel(value)}{Number.isFinite(calendarMonths(value)) && ` · ${calendarMonths(value)} months, both months included`}</small>{error && <p role="alert" className="sm-error">{error}</p>}</fieldset>
}
