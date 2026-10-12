import { createLaqParts } from './blueprintLaqParts.js'
import { calculateBlueprintOutline } from './blueprintOutline.js'

/** Calculate a cognition split without mutating entered values.
 * Fixed SAQ modes are honoured; MCQs and Both rows use whole questions. Existing
 * complete LAQ parts are preserved. Unconfigured LAQs receive one or two parts
 * per question, using the residual cognition marks exactly.
 * @param {object} draft Outline rows keyed by question type.
 * @param {{totalMarks:number,hotMarks:number}} target Assessment cognition targets.
 * @param {Array<{splitCount:string,splits:Array<{marks:string,level:string}>}>} laqParts Existing parts, only when LAQ quantities are unchanged.
 * @param {{allowPartial?:boolean}} options Allow incomplete assessment totals for read-only previews.
 * @returns {{draft?:object,error?:string,laqTarget?:{hot:number,lot:number}}}
 */
export function allocateBlueprintOutline(draft, target, laqParts = [], { allowPartial = false } = {}) {
  const outline = calculateBlueprintOutline(draft, target.totalMarks)
  if (!outline.valid && !(allowPartial && outline.total > 0 && outline.remaining >= 0 && outline.rows.every(row => row.valid))) return { error: 'Match the assessment total and complete all entered question counts.' }
  const total = Math.round(target.totalMarks * 100)
  const hotTarget = Math.round(target.hotMarks * 100)
  if (!Number.isFinite(hotTarget) || hotTarget < 0 || hotTarget > total) return { error: 'Enter valid LoT and HoT percentages.' }
  const rows = outline.rows.filter(row => row.entered)
  for (const row of rows) {
    if (row.lockedHotCents === undefined) continue
    const hot = row.lockedHotCents
    if (!Number.isSafeInteger(hot) || hot < 0 || hot > row.totalCents
      || (row.label !== 'LAQs' && hot % Math.round(Number(row.perQuestionMarks) * 100) !== 0)
      || (row.cognitionMode === 'hot' && hot !== row.totalCents) || (row.cognitionMode === 'lot' && hot !== 0)) {
      return { error: 'Review the edited row allocation before continuing.' }
    }
  }
  const laq = rows.find(row => row.label === 'LAQs')
  const completeParts = laq && laqParts.length === Number(laq.questionCount) && laqParts.every(question =>
    Number(question.splitCount) > 0 && question.splits?.length === Number(question.splitCount)
    && question.splits.every(part => Number(part.marks) > 0 && ['hot', 'lot'].includes(part.level))
    && question.splits.reduce((sum, part) => sum + Math.round(Number(part.marks) * 100), 0) === Math.round(Number(laq.perQuestionMarks) * 100))
  const fixedLaqHot = laq?.lockedHotCents !== undefined ? laq.lockedHotCents : completeParts ? laqParts.reduce((sum, question) => sum + question.splits.reduce((subtotal, part) => subtotal + (part.level === 'hot' ? Math.round(Number(part.marks) * 100) : 0), 0), 0) : 0
  const freeLaq = laq && !completeParts && laq.lockedHotCents === undefined ? laq.totalCents : 0
  const fixedHot = rows.filter(row => row.label !== 'LAQs' && (row.cognitionMode === 'hot' || row.lockedHotCents !== undefined)).reduce((sum, row) => sum + (row.lockedHotCents ?? row.totalCents), fixedLaqHot)
  const fixedLot = rows.filter(row => row.label !== 'LAQs' && (row.cognitionMode === 'lot' || row.lockedHotCents !== undefined)).reduce((sum, row) => sum + (row.totalCents - (row.lockedHotCents ?? 0)), (completeParts || laq?.lockedHotCents !== undefined) ? laq.totalCents - fixedLaqHot : 0)
  if (fixedHot > hotTarget) return { error: `Fixed HoT allocations exceed the target by ${(fixedHot - hotTarget) / 100} marks. Revise setup or the existing LAQ parts.` }
  if (fixedLot > total - hotTarget) return { error: `Fixed LoT allocations exceed the target by ${(fixedLot - total + hotTarget) / 100} marks. Revise setup or the existing LAQ parts.` }
  let states = new Map([[fixedLaqHot, { cost: 0, counts: {} }]])
  for (const row of rows.filter(item => item.label !== 'LAQs')) {
    const unit = Math.round(Number(row.perQuestionMarks) * 100)
    const count = Number(row.questionCount)
    const choices = row.lockedHotCents !== undefined ? [row.lockedHotCents / unit] : row.cognitionMode === 'lot' ? [0] : row.cognitionMode === 'hot' ? [count] : Array.from({ length: Math.min(count, Math.floor(hotTarget / unit)) + 1 }, (_, index) => index)
    const next = new Map()
    for (const [sum, state] of states) for (const hotCount of choices) {
      const nextSum = sum + hotCount * unit
      if (nextSum > hotTarget) continue
      // Prefer the reference MCQ split; other rows absorb the remaining global budget.
      // Existing locks still take precedence, and exact assessment totals remain mandatory.
      const preferredHot = row.label === 'MCQs' ? Math.round(count * 0.75) * unit : row.totalCents * hotTarget / total
      const cost = state.cost + Math.abs(hotCount * unit - preferredHot) * (row.label === 'MCQs' ? total + 1 : 1)
      if (!next.has(nextSum) || cost < next.get(nextSum).cost) next.set(nextSum, { cost, counts: { ...state.counts, [row.label]: hotCount } })
    }
    states = next
  }
  const unfilled = allowPartial ? Math.round(outline.remaining * 100) : 0
  const candidates = [...states].filter(([sum]) => hotTarget - sum >= 0 && hotTarget - sum <= freeLaq + unfilled)
    .sort((a, b) => a[1].cost - b[1].cost || b[0] - a[0])
  if (!candidates.length) return { error: 'An exact LoT/HoT split is not possible with these whole-question marks and selections. Edit the question counts, marks, or thinking levels.' }
  const [sum, chosen] = candidates[0]
  const output = Object.fromEntries(rows.map(row => [row.label, {
    perQuestionMarks: row.perQuestionMarks, totalMarks: String(row.totalCents / 100), pendingAllocation: false,
    ...(row.cognitionMode ? { cognitionMode: row.cognitionMode } : {}),
    ...(row.label !== 'LAQs' ? { hotQuestions: String(chosen.counts[row.label]), lotQuestions: String(Number(row.questionCount) - chosen.counts[row.label]) } : {}),
  }]))
  const residualHot = allowPartial ? Math.min(freeLaq, hotTarget - sum, Math.max(0, hotTarget - sum - unfilled, Math.round(freeLaq * hotTarget / total))) : hotTarget - sum
  const laqTarget = laq ? { hot: ((completeParts || laq.lockedHotCents !== undefined) ? fixedLaqHot : residualHot) / 100, lot: (laq.totalCents - ((completeParts || laq.lockedHotCents !== undefined) ? fixedLaqHot : residualHot)) / 100 } : undefined
  return { draft: output, laqTarget, laqParts: !laq ? [] : completeParts && (laq.lockedHotCents === undefined || laqParts.reduce((sum, question) => sum + question.splits.reduce((n, part) => n + (part.level === 'hot' ? Math.round(Number(part.marks) * 100) : 0), 0), 0) === laq.lockedHotCents) ? laqParts : createLaqParts(laq.perQuestionMarks, laq.questionCount, laqTarget) }
}
