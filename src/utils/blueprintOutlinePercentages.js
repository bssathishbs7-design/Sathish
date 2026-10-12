import { createLaqParts } from './blueprintLaqParts.js'
import { calculateBlueprintOutline } from './blueprintOutline.js'
import { allocateBlueprintOutline } from './blueprintOutlineAllocation.js'

/** Read-only marks-based preview. Null means a complete allocation is not yet available.
 * @param {object} draft Setup rows keyed by question type.
 * @param {{totalMarks:number,hotMarks:number}} target Assessment targets.
 * @param {object} previousLaq Previously applied LAQ marks and total.
 * @param {Array} laqParts Previously applied LAQ parts.
 * @returns {{rows:object,saq:object|null,total:object|null,ready:boolean}}
 */
export function getBlueprintOutlinePercentages(draft, target, previousLaq = {}, laqParts = []) {
  const outline = calculateBlueprintOutline(draft, target.totalMarks)
  const laq = outline.rows.find(row => row.label === 'LAQs')
  const unchangedLaq = Number(previousLaq.perQuestionMarks) === Number(laq.perQuestionMarks)
    && Number(previousLaq.totalMarks) === laq.totalCents / 100
  const allocation = outline.valid
    ? allocateBlueprintOutline(draft, target, unchangedLaq ? laqParts : []) : {}
  const provisional = !allocation.draft
    ? allocateBlueprintOutline(Object.fromEntries(outline.rows.filter(row => row.entered && row.valid).map(row => [row.label, row])),
      target, unchangedLaq ? laqParts : [], { allowPartial: true }) : allocation
  const rows = Object.fromEntries(outline.rows.map(row => {
    if (!row.entered || !row.valid) return [row.label, null]
    const applied = provisional.draft?.[row.label]
    const hot = row.lockedHotCents !== undefined ? row.lockedHotCents / 100 : row.label === 'LAQs' ? provisional.laqTarget?.hot
      : row.cognitionMode === 'hot' ? row.totalCents / 100
        : row.cognitionMode === 'lot' ? 0
          : applied ? Number(applied.hotQuestions) * Number(row.perQuestionMarks) : undefined
    const parts = row.label === 'LAQs' && hot !== undefined ? (provisional.laqParts?.length ? provisional.laqParts : createLaqParts(row.perQuestionMarks, row.questionCount, {hot, lot: row.totalCents / 100 - hot})) : []
    const counts = row.label === 'LAQs'
      ? { hotCount: parts.flatMap(question => question.splits).filter(part => part.level === 'hot').length,
          lotCount: parts.flatMap(question => question.splits).filter(part => part.level === 'lot').length, parts: true }
      : { hotCount: Math.round(hot * 100) / Math.round(Number(row.perQuestionMarks) * 100),
          lotCount: Number(row.questionCount) - Math.round(hot * 100) / Math.round(Number(row.perQuestionMarks) * 100) }
    return [row.label, hot === undefined ? null : {
      ...counts, hotCents: Math.round(hot * 100), totalCents: row.totalCents,
      ...(!allocation.draft && row.lockedHotCents === undefined && !['hot', 'lot'].includes(row.cognitionMode) ? { provisional: true } : {}),
      ...percentages(Math.round(hot * 100), row.totalCents),
    }]
  }))
  const aggregate = (items, denominator) => {
    const entered = items.filter(row => row.entered)
    if (!entered.length || entered.some(row => !rows[row.label])) return null
    const value = percentages(entered.reduce((sum, row) => sum + rows[row.label].hotCents, 0),
      denominator ?? entered.reduce((sum, row) => sum + row.totalCents, 0),
      entered.reduce((sum, row) => sum + row.totalCents - rows[row.label].hotCents, 0))
    return { ...value, hotCount: entered.reduce((sum, row) => sum + rows[row.label].hotCount, 0),
      lotCount: entered.reduce((sum, row) => sum + rows[row.label].lotCount, 0), ...(entered.some(row => rows[row.label].provisional) ? { provisional: true } : {}) }
  }
  return { ready: Boolean(allocation.draft), rows, saq: aggregate(outline.rows.filter(row => row.label.startsWith('SAQs'))),
    total: aggregate(outline.rows, Math.round(target.totalMarks * 100)) }
}

function percentages(hot, total, lot = total - hot) {
  return total > 0 ? { hot: hot / total * 100, lot: lot / total * 100 } : null
}
