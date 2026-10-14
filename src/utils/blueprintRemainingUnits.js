import { allocateCategoryBreakdown } from './blueprintCategoryBreakdown.js'

/** Resolve individual question units against current cell counts and marks.
 * @param {{units:Array<{id:string,marks:number}>,cells:Array<{key:string,count:number,marks:number}>,saved?:Object<string,string>}} input
 * @returns {Object<string,string>|null} Unit ID to competency key, or null for invalid totals.
 */
export function resolveBlueprintUnits({ units, cells, saved }) {
  if (units.some(unit => !Number.isFinite(unit.marks) || unit.marks <= 0)
    || cells.some(cell => !Number.isSafeInteger(cell.count) || cell.count < 0 || !Number.isFinite(cell.marks) || cell.marks < 0)) return null
  if (saved && Object.entries(saved).every(([id, key]) => units.some(unit => unit.id === id) && cells.some(cell => cell.key === key))
    && cells.every(cell => {
      const assigned = units.filter(unit => saved[unit.id] === cell.key)
      return assigned.length === cell.count && Math.round(assigned.reduce((sum, unit) => sum + unit.marks, 0) * 100) === Math.round(cell.marks * 100)
    })) return saved
  const allocation = allocateCategoryBreakdown({
    units: units.map(unit => ({ category: unit.id, marks: Math.round(unit.marks * 100) })),
    cells: cells.map(cell => ({ ...cell, marks: Math.round(cell.marks * 100) })),
  })
  if (!allocation) return null
  return Object.fromEntries(Object.entries(allocation).flatMap(([key, entries]) => entries.map(entry => [entry.category, key])))
}

/** Prefer a competency that fits the unit, with the smallest remaining capacity.
 * @param {Array<{key:string,code:string,targetMarks:number,actual:number}>} rows
 * @param {number} marks
 */
export function suggestBlueprintCompetency(rows, marks) {
  return rows.filter(row => Math.round((Number(row.targetMarks) - row.actual) * 100) >= Math.round(marks * 100))
    .sort((a, b) => (a.targetMarks - a.actual) - (b.targetMarks - b.actual))[0] || null
}

/** Change one cell without taking units from another competency.
 * Increases use the smallest available units that fit; decreases retain existing identities.
 * @param {{units:Array<{id:string,marks:number}>,assignments:Object<string,string>|null,rowKey:string,count:number,capacity:number}} input
 * @returns {{error?:string,assignments?:Object<string,string>,marks?:number}}
 */
export function changeBlueprintUnitCount({ units, assignments, rowKey, count, capacity }) {
  if (!Number.isSafeInteger(count) || count < 0) return { error: 'Enter a whole number of zero or more.' }
  if (!assignments) return { error: 'Review this column’s current counts and marks before changing it.' }
  const current = units.filter(unit => assignments[unit.id] === rowKey)
  const free = units.filter(unit => !assignments[unit.id]).sort((a, b) => a.marks - b.marks)
  if (count > current.length + free.length) return { error: `Only ${current.length + free.length} questions or parts are available for this field.` }
  const selected = count <= current.length ? current.slice(0, count) : [...current, ...free.slice(0, count - current.length)]
  const marks = Number(selected.reduce((sum, unit) => sum + unit.marks, 0).toFixed(2))
  if (count > current.length && Math.round(marks * 100) > Math.round(capacity * 100)) return { error: 'This count exceeds the competency’s remaining marks.' }
  const next = Object.fromEntries(Object.entries(assignments).filter(([, key]) => key !== rowKey))
  selected.forEach(unit => { next[unit.id] = rowKey })
  return { assignments: next, marks }
}
