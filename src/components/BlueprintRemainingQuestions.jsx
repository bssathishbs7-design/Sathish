import { useState } from 'react'
import BlueprintUnitCards from './BlueprintUnitCards'
import './BlueprintRemainingQuestions.css'

/** Unallocated units, grouped for display; each Add assigns one exact unit.
 * @param {{items:Array<{key:string,group:string,label:string,remaining:number}>,units:Array<{id:string,group:string,label:string,level:string,marks:number,category?:string,suggested?:{code:string}}>,onAdd:Function,disabled?:boolean,includeMcq?:boolean,collapsible?:boolean}} props
 */
export default function BlueprintRemainingQuestions({ items, units = [], onAdd, disabled = false, includeMcq = false, collapsible = false }) {
  const [selectedGroup, setSelectedGroup] = useState(undefined)
  const groups = (includeMcq ? ['MCQ', 'LAQ', 'SAQ'] : ['LAQ', 'SAQ']).filter(group => units.some(unit => unit.group === group))
  const activeGroup = selectedGroup === null ? null : groups.includes(selectedGroup) ? selectedGroup : groups[0]
  const remaining = items.filter(item => (includeMcq || item.group !== 'MCQ') && item.remaining > 0)
  if (!remaining.length) return null
  const cards = units
  return <section className="blueprint-remaining-questions" aria-label="Unallocated questions">
    <header><h4>Unallocated questions</h4><span>{remaining.reduce((sum, item) => sum + item.remaining, 0)} questions / parts remaining</span></header>
    <div className="blueprint-remaining-body">
    {groups.map(group => {
      const entries = cards.filter(card => card.group === group)
      if (!entries.length) return null
      if (collapsible) return <details className="blueprint-unit-group is-collapsible" data-group={group} key={group} open={activeGroup === group}>
        <summary onClick={event => { event.preventDefault(); setSelectedGroup(activeGroup === group ? null : group) }}>{{ MCQ: 'Multiple-Choice Questions (MCQ)', LAQ: 'Long-Answer Questions (LAQ)', SAQ: 'Short-Answer Questions (SAQ)' }[group]}</summary>
        <BlueprintUnitCards units={entries} onAdd={onAdd} disabled={disabled} />
      </details>
      return <div className="blueprint-unit-group" key={group}>
        <strong>{group}</strong>
        <BlueprintUnitCards units={entries} onAdd={onAdd} disabled={disabled} />
      </div>
    })}
    {remaining.filter(item => !cards.some(card => card.fieldKey === item.key)).map(item =>
      <p className="blueprint-unit-summary" key={item.key}>{item.group} {item.label}: {item.remaining} remaining. Review the current allocations to identify individual questions.</p>
    )}
    </div>
  </section>
}
