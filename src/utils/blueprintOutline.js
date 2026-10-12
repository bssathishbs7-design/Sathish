export const blueprintOutlineLabels = ['MCQs', 'SAQs (Direct)', 'SAQs (Reasoning)', 'SAQs (Aetcom)', 'SAQs (Application)', 'LAQs']

/** Outline rows contain perQuestionMarks, questionCount and optional cognitionMode strings.
 * Returns exact cent-based totals and validity; unused rows do not contribute.
 */
export function calculateBlueprintOutline(draft, target) {
  const rows = blueprintOutlineLabels.map(label => {
    const item = draft[label] || {}
    const entered = Boolean(String(item.perQuestionMarks ?? '').trim() || String(item.questionCount ?? '').trim())
    const unit = Number(item.perQuestionMarks)
    const count = Number(item.questionCount)
    const valid = !entered || (Number.isSafeInteger(unit) && unit > 0
      && Number.isSafeInteger(count) && count > 0 && Number.isSafeInteger(Math.round(unit * 100) * count)
      && (!label.startsWith('SAQs') || ['lot', 'hot', 'both'].includes(item.cognitionMode)))
    return { label, ...item, entered, valid, totalCents: entered && valid ? Math.round(unit * 100) * count : 0 }
  })
  const totalCents = rows.reduce((sum, row) => sum + row.totalCents, 0)
  const remainingCents = Math.round(Number(target) * 100) - totalCents
  return { rows, total: totalCents / 100, remaining: remainingCents / 100,
    valid: Number(target) > 0 && rows.every(row => row.valid) && totalCents > 0 && remainingCents === 0 }
}
