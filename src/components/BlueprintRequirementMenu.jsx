import './BlueprintRequirementMenu.css'

/** One selectable row per saved requirement; counts reflect questions added to Preview.
 * @param {{rows: Array<{id:string,label:string,picked:number,count:number}>, activeId:string, onSelect:Function}} props
 */
export default function BlueprintRequirementMenu({ rows, activeId, onSelect }) {
  return <div className="assessment-page-filter-menu blueprint-requirement-menu qb-sort-scope">
    <div><strong>Blueprint requirement</strong></div>
    <div role="radiogroup" aria-label="Blueprint requirement">
      {rows.map(row => <label key={row.id} className="assessment-page-filter-option" title={row.label}>
        <input type="radio" name="blueprint-requirement" checked={row.id === activeId} onChange={() => onSelect(row.id)} />
        <span className="blueprint-requirement-label">{row.label}</span>
        <span className="blueprint-requirement-count">{row.picked}/{row.count}</span>
        {row.picked >= row.count && <strong className="blueprint-requirement-done">Done</strong>}
      </label>)}
    </div>
  </div>
}
