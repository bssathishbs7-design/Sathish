/**
 * Build up to three possible allocations for a row from assessment marks remaining
 * after all other completed rows. Counts are whole questions; marks use integer cents.
 * Empty rows consume no marks. Incomplete rows block allocation until resolved.
 * @param {object} row Derived question-type row (label, cognitionMode, perQuestionMarks,
 * totalMarks, totalQuestions, hotQuestions, lotQuestions, hotMarks, lotMarks,
 * hasRequiredValues, hasValidQuestionTotal, usesLaqSplit).
 * @param {object[]} rows All derived question-type rows.
 * @param {{totalMarks:number,hotMarks:number,lotPercent?:number,hotPercent?:number}} target Assessment marks, rounded HoT target and cognition percentages.
 * @returns {object|null} Remaining budgets, possible allocations, or explanatory message.
 */
export function suggestBlueprintRow(row, rows, target) {
  const cents = value => Math.round(Number(value) * 100)
  const marks = value => value / 100
  if (!Number.isFinite(target.totalMarks) || !(target.totalMarks > 0) || !Number.isFinite(target.hotMarks) || target.hotMarks < 0 || target.hotMarks > target.totalMarks) return null
  if (target.lotPercent !== undefined || target.hotPercent !== undefined) {
    if (![target.lotPercent, target.hotPercent].every(value => Number.isFinite(value) && value >= 0 && value <= 100)
      || Math.abs(target.lotPercent + target.hotPercent - 100) > 0.000001) return null
  }
  if (row.label.startsWith('SAQs (') && !['lot', 'hot', 'both'].includes(row.cognitionMode)) return null
  const others = rows.filter(item => item.label !== row.label)
  const incomplete = others.some(item => {
    if (String(item.totalMarks ?? '').trim() === '') return false
    const amount = cents(item.totalMarks)
    const unit = cents(item.perQuestionMarks)
    const hotMarks = cents(item.hotMarks)
    const lotMarks = cents(item.lotMarks)
    if (![amount, unit, hotMarks, lotMarks].every(Number.isFinite) || amount <= 0 || unit <= 0
      || !item.hasValidQuestionTotal || amount % unit || hotMarks < 0 || lotMarks < 0
      || hotMarks + lotMarks !== amount) return true
    if (item.label === 'LAQs') return !item.usesLaqSplit
    if (!Number.isInteger(item.hotQuestions) || !Number.isInteger(item.lotQuestions)
      || item.hotQuestions < 0 || item.lotQuestions < 0
      || item.hotQuestions * unit !== hotMarks || item.lotQuestions * unit !== lotMarks) return true
    return item.label.startsWith('SAQs (') && (!['lot', 'hot', 'both'].includes(item.cognitionMode)
      || (item.cognitionMode === 'lot' && hotMarks > 0) || (item.cognitionMode === 'hot' && lotMarks > 0))
  })
  const total = cents(target.totalMarks)
  const hotTarget = cents(target.hotMarks)
  const usedHot = others.reduce((sum, item) => sum + cents(item.hotMarks || 0), 0)
  const usedLot = others.reduce((sum, item) => sum + cents(item.lotMarks || 0), 0)
  const hot = hotTarget - usedHot
  const lot = total - hotTarget - usedLot
  const result = { label: row.label, remainingHot: marks(hot), remainingLot: marks(lot), options: [], message: '', laq: row.label === 'LAQs' }
  if (incomplete) return { ...result, message: 'Complete the marks and LAQ parts in other entered rows to calculate available allocations.' }
  if (hot < 0 || lot < 0) return { ...result, message: 'Other rows already exceed the LoT or HoT target. Adjust those allocations first.' }
  const unit = cents(row.perQuestionMarks)
  if (!Number.isFinite(unit) || !(unit > 0)) return { ...result, message: 'Enter valid marks per question to see possible allocations.' }
  if (result.laq) {
    if (!row.usesLaqSplit) return { ...result, message: 'Complete the LAQ parts and thinking levels to calculate their contribution.' }
    if (!row.hasValidQuestionTotal || cents(row.hotMarks) + cents(row.lotMarks) !== cents(row.totalMarks)
      || cents(row.hotMarks) > hot || cents(row.lotMarks) > lot) return { ...result, message: 'These LAQ parts do not fit the available marks. Review their marks and thinking levels.' }
    return { ...result, selected: { totalQuestions: row.totalQuestions, hotQuestions: row.hotQuestions, lotQuestions: row.lotQuestions, hotMarks: row.hotMarks, lotMarks: row.lotMarks },
      message: cents(row.hotMarks) > hot || cents(row.lotMarks) > lot ? 'These LAQ parts exceed the available cognition marks. Review the part selections.' : 'LAQ part marks contribute to the assessment targets; existing parts stay unchanged.' }
  }
  const both = row.label === 'MCQs' || row.cognitionMode === 'both'
  const maxHot = both || row.cognitionMode === 'hot' ? Math.floor(hot / unit) : 0
  const maxLot = both || row.cognitionMode === 'lot' ? Math.floor(lot / unit) : 0
  const maxCount = maxHot + maxLot
  const hasEnteredTotal = String(row.totalMarks ?? '').trim() !== ''
  const enteredUnits = cents(row.totalMarks || 0)
  if (hasEnteredTotal && (!Number.isFinite(enteredUnits) || !(enteredUnits > 0) || enteredUnits % unit)) return { ...result, message: 'Total marks must be a positive whole number of questions at this mark value.' }
  const counts = [hasEnteredTotal ? enteredUnits / unit : maxCount]
  for (const count of counts) {
    if (count <= 0 || count > maxCount) continue
    const minHot = Math.max(0, count - maxLot)
    const limitHot = Math.min(count, maxHot)
    const preferred = Math.max(minHot, Math.min(limitHot, Math.round(count * (hot + lot ? hot / (hot + lot) : 0))))
    const splits = hasEnteredTotal ? [...new Set([preferred, minHot, limitHot])] : [preferred]
    for (const hotCount of splits) {
      const lotCount = count - hotCount
      result.options.push({
        id: `${count}:${hotCount}`, label: row.label, totalQuestions: count, totalMarks: marks(count * unit),
        hotQuestions: hotCount, lotQuestions: lotCount, hotMarks: marks(hotCount * unit), lotMarks: marks(lotCount * unit),
        remainingHot: marks(hot - hotCount * unit), remainingLot: marks(lot - lotCount * unit), perQuestionMarks: Number(row.perQuestionMarks),
        canApply: Number(row.totalMarks) !== marks(count * unit) || row.hotQuestions !== hotCount || row.lotQuestions !== lotCount,
      })
    }
  }
  if (!result.options.length) result.message = 'No whole-question allocation fits the available marks and this selection. Review this row’s total or the other allocations.'
  return result
}
