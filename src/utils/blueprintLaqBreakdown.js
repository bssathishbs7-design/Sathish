import { allocateCategoryBreakdown } from './blueprintCategoryBreakdown.js'

/** Trace LAQ cell totals to uniquely identifiable configured parts.
 * Counts/marks do not retain part IDs, so ambiguous cells return null.
 * @param {{parts:Array<{question:number,part:number,marks:number}>,cells:Array<{key:string,count:number,marks:number}>}} input
 * @returns {Object<string, Array<{question:number,part:number,marks:number}>|null>|null}
 */
export function getLaqSplitBreakdowns({ parts, cells }) {
  const units = parts.map((part, index) => ({ category: String(index), marks: Math.round(part.marks * 100) }))
  const normalized = cells.map(cell => ({ ...cell, marks: Math.round(cell.marks * 100) }))
  if (parts.some(part => !Number.isFinite(part.marks) || part.marks <= 0)
    || cells.some(cell => !Number.isInteger(cell.count) || cell.count < 0 || !Number.isFinite(cell.marks) || cell.marks < 0)
    || !allocateCategoryBreakdown({ units, cells: normalized })) return null
  const weights = [...new Set(units.map(unit => unit.marks))]
  return Object.fromEntries(normalized.map((cell, cellIndex) => {
    if (!cell.count) return [cell.key, []]
    const possibleWeights = new Set(weights.filter(weight => {
      if (weight > cell.marks) return false
      const excluded = units.findIndex(unit => unit.marks === weight)
      return allocateCategoryBreakdown({
        units: units.filter((_, index) => index !== excluded),
        cells: normalized.map((candidate, index) => index === cellIndex
          ? { ...candidate, count: candidate.count - 1, marks: candidate.marks - weight } : candidate),
      }) !== null
    }))
    const possibleParts = parts.filter((_, index) => possibleWeights.has(units[index].marks))
    return [cell.key, possibleParts.length === cell.count ? possibleParts : null]
  }))
}
