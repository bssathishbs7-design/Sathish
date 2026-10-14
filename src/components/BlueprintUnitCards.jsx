import { Plus } from 'lucide-react'
import './BlueprintUnitCards.css'

/** Shared allocation cards. units contain identity, group, category, level, marks and a suggested competency; LAQ units include one-based question and part numbers. onAdd receives one unit ID. */
export default function BlueprintUnitCards({ units, onAdd, disabled = false }) {
  const grouped = new Map()
  units.forEach(unit => {
    const key = unit.group === 'LAQ' ? unit.id : [unit.group, unit.category, unit.level, unit.marks].join(':')
    const label = unit.group === 'LAQ'
      ? `LAQ ${unit.question} – Part ${String.fromCharCode(64 + unit.part)}`
      : unit.group === 'SAQ' ? ({ AETCOM: 'Aetcom' }[unit.category] || unit.category) : unit.label
    const card = grouped.get(key) || { ...unit, label, count: 0 }
    card.count += 1
    grouped.set(key, card)
  })
  const cards = [...grouped.values()]
  return <ul className="blueprint-unit-cards">{cards.map(card => <li key={card.id} className="blueprint-unit-card">
          <div><div><strong>{card.group === 'SAQ' ? card.count + ' ' : ''}{card.label}</strong><span>{card.level === 'lot' ? 'LoT' : 'HoT'} {'\u00b7'} {card.marks} {card.marks === 1 ? 'mark' : 'marks'}{card.group === 'SAQ' ? ' each' : ''}</span></div>
            <small>{card.suggested ? 'Suggested: ' + card.suggested.code : 'No competency has enough marks remaining.'}</small></div>
          <button type="button" disabled={disabled || !card.suggested} onClick={() => onAdd(card.id)} aria-label={'Add ' + (card.group === 'LAQ' ? card.label : 'one ' + card.category + ' question') + (card.suggested ? ' to ' + card.suggested.code : '')}>
            <Plus size={14} strokeWidth={2} aria-hidden="true" />Add
          </button>
        </li>)}</ul>
}
