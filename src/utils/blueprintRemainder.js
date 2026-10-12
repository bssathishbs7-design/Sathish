/** Explain remainders that cannot be filled by the currently entered unused row marks.
 * Empty rows are optional. This is guidance, never an automatic edit or a submission gate.
 */
export function explainBlueprintRemainder(draft, activeLabel, after) {
  if (after.total <= 0) return ''
  const available = Object.entries(draft).filter(([label, row]) => label !== activeLabel && !Number(row.questionCount)
    && Number(row.perQuestionMarks) > 0).map(([label, row]) => ({ ...row, label, unit: Math.round(Number(row.perQuestionMarks) * 100) }))
  if (!available.length) return 'Add another row to allocate the remaining marks.'
  if (available.some(row => row.label === 'LAQs')) return ''
  for (const level of ['hot', 'lot']) {
    const amount = Math.round(after[level] * 100)
    if (!amount) continue
    const units = available.filter(row => row.label === 'MCQs' || row.cognitionMode === level || row.cognitionMode === 'both').map(row => row.unit)
    if (!canFill(amount, units)) return `The remaining ${after[level]} ${level === 'hot' ? 'HoT' : 'LoT'} marks cannot be filled with the entered unused row marks. Edit a row or add different marks.`
  }
  return ''
}

function canFill(amount, units) {
  if (!units.length) return false
  const gcd = (a, b) => b ? gcd(b, a % b) : a
  const divisor = units.reduce(gcd)
  if (amount % divisor) return false
  const target = amount / divisor
  if (target > 100000) return true // Avoid a blocking search; do not claim impossibility without proof.
  const reachable = new Uint8Array(target + 1)
  reachable[0] = 1
  for (const unit of units) for (let sum = unit / divisor; sum <= target; sum++) {
    if (reachable[sum - unit / divisor]) reachable[sum] = 1
  }
  return Boolean(reachable[target])
}
