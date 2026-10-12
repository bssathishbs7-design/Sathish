import { isBlueprintRowAllocated } from './blueprintRowState.js'

/**
 * With a blank row total, suggest the remaining cognition budget. With an entered
 * total, suggest its nearest remaining-budget splits. Counts are whole questions;
 * marks use integer cents and other completed rows constrain both stages.
 * Empty and incomplete rows consume no marks and never block other suggestions.
 * @param {object} row Derived question-type row (label, cognitionMode, perQuestionMarks,
 * totalMarks, totalQuestions, hotQuestions, lotQuestions, hotMarks, lotMarks,
 * hasRequiredValues, hasValidQuestionTotal, usesLaqSplit). For LAQ corrections,
 * laqParts contains {questionIndex:number, partIndex:number, marks:number|string,
 * level:'hot'|'lot'} entries identifying existing parts without changing marks.
 * @param {object[]} rows All derived question-type rows.
 * @param {{totalMarks:number,hotMarks:number,lotPercent?:number,hotPercent?:number}} target Assessment marks, rounded HoT target and cognition percentages.
 * @returns {object|null} Remaining budgets, possible allocations, or explanatory message.
 */
export function suggestBlueprintRow(row, rows, target) {
  const cents = value => Math.round(Number(value) * 100)
  const marks = value => value / 100
  const hasEnteredTotal = String(row.totalMarks ?? '').trim() !== ''
  if (!Number.isFinite(target.totalMarks) || !(target.totalMarks > 0) || !Number.isFinite(target.hotMarks) || target.hotMarks < 0 || target.hotMarks > target.totalMarks) return null
  if (target.lotPercent !== undefined || target.hotPercent !== undefined) {
    if (![target.lotPercent, target.hotPercent].every(value => Number.isFinite(value) && value >= 0 && value <= 100)
      || Math.abs(target.lotPercent + target.hotPercent - 100) > 0.000001) return null
  }
  if (row.label.startsWith('SAQs (') && !['lot', 'hot', 'both'].includes(row.cognitionMode)) return null
  const others = rows.filter(item => item.label !== row.label && isBlueprintRowAllocated(item))
  const total = cents(target.totalMarks)
  const hotTarget = cents(target.hotMarks)
  const usedHot = others.reduce((sum, item) => sum + cents(item.hotMarks || 0), 0)
  const usedLot = others.reduce((sum, item) => sum + cents(item.lotMarks || 0), 0)
  const hot = hotTarget - usedHot
  const lot = total - hotTarget - usedLot
  const result = { label: row.label, remainingHot: marks(hot), remainingLot: marks(lot), options: [], message: '', laq: row.label === 'LAQs' }
  const ownHot = cents(row.hotMarks || 0)
  const ownLot = cents(row.lotMarks || 0)
  const difference = usedHot + ownHot - hotTarget
  const correctionUnit = cents(row.perQuestionMarks)
  // Corrections reduce a completed assessment's mismatch without touching other rows.
  if (row.hasValidQuestionTotal && usedHot + usedLot + ownHot + ownLot === total && difference !== 0
    && ownHot + ownLot === cents(row.totalMarks) && correctionUnit > 0) {
    const moveToHot = difference < 0
    if (result.laq) {
      if (!row.usesLaqSplit || !row.laqParts?.length) return null
      const parts = row.laqParts
      if (parts.some(part => !Number.isFinite(Number(part.marks)) || cents(part.marks) <= 0 || !['hot', 'lot'].includes(part.level))
        || parts.reduce((sum, part) => sum + cents(part.marks), 0) !== ownHot + ownLot
        || parts.filter(part => part.level === 'hot').reduce((sum, part) => sum + cents(part.marks), 0) !== ownHot) return null
      // Sparse subset sums: each existing part may move once; never exceed the gap.
      const sums = new Map([[0, []]])
      for (const part of parts.filter(part => part.level === (moveToHot ? 'lot' : 'hot'))) {
        for (const [sum, selected] of [...sums]) {
          const next = sum + cents(part.marks)
          if (next > Math.abs(difference)) continue
          const candidate = [...selected, part]
          if (!sums.has(next) || sums.get(next).length > candidate.length) sums.set(next, candidate)
        }
      }
      const moved = [...sums.keys()].reduce((best, sum) => Math.max(best, sum), 0)
      if (!moved) return null
      const laqChanges = sums.get(moved).map(part => ({ questionIndex: part.questionIndex, partIndex: part.partIndex, level: moveToHot ? 'hot' : 'lot' }))
      const newHot = ownHot + (moveToHot ? moved : -moved)
      const newLot = ownLot + (moveToHot ? -moved : moved)
      result.options.push({
        id: `laq:${JSON.stringify(laqChanges)}`, label: row.label, totalQuestions: row.totalQuestions,
        totalMarks: Number(row.totalMarks), laqChanges,
        hotQuestions: row.hotQuestions + (moveToHot ? laqChanges.length : -laqChanges.length),
        lotQuestions: row.lotQuestions + (moveToHot ? -laqChanges.length : laqChanges.length),
        hotMarks: marks(newHot), lotMarks: marks(newLot), remainingHot: marks(hot - newHot), remainingLot: marks(lot - newLot),
        correction: true, movedMarks: marks(moved), destination: moveToHot ? 'HoT' : 'LoT',
        remainingMismatch: marks(Math.abs(difference) - moved), requiresConfirmation: true, recommended: true, canApply: true,
      })
      return result
    }
    const available = moveToHot ? row.lotQuestions : row.hotQuestions
    const movedQuestions = Math.min(available, Math.floor(Math.abs(difference) / correctionUnit))
    if (!Number.isInteger(movedQuestions) || movedQuestions <= 0) return null
    const hotQuestions = row.hotQuestions + (moveToHot ? movedQuestions : -movedQuestions)
    const lotQuestions = row.lotQuestions + (moveToHot ? -movedQuestions : movedQuestions)
    const requiredMode = row.label.startsWith('SAQs (')
      ? row.cognitionMode === 'both' ? 'both' : hotQuestions === 0 ? 'lot' : lotQuestions === 0 ? 'hot' : 'both'
      : null
    result.options.push({
      id: `correct:${row.totalQuestions}:${hotQuestions}`, label: row.label, totalQuestions: row.totalQuestions,
      totalMarks: Number(row.totalMarks), perQuestionMarks: Number(row.perQuestionMarks), hotQuestions, lotQuestions,
      hotMarks: marks(hotQuestions * correctionUnit), lotMarks: marks(lotQuestions * correctionUnit),
      remainingHot: marks(hot - hotQuestions * correctionUnit), remainingLot: marks(lot - lotQuestions * correctionUnit),
      correction: true, movedQuestions, movedMarks: marks(movedQuestions * correctionUnit), destination: moveToHot ? 'HoT' : 'LoT',
      remainingMismatch: marks(Math.abs(difference) - movedQuestions * correctionUnit),
      requiredMode, requiresConfirmation: Boolean(requiredMode && requiredMode !== row.cognitionMode),
      recommended: true, canApply: true,
    })
    return result
  }
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
  const enteredUnits = cents(row.totalMarks || 0)
  if (hasEnteredTotal && (!Number.isFinite(enteredUnits) || !(enteredUnits > 0) || enteredUnits % unit)) return { ...result, message: 'Total marks must be a positive whole number of questions at this mark value.' }
  const counts = [hasEnteredTotal ? enteredUnits / unit : maxCount]
  for (const count of counts) {
    if (count <= 0 || count > maxCount) continue
    const minHot = Math.max(0, count - maxLot)
    const limitHot = Math.min(count, maxHot)
    const expectedHot = hot + lot > 0 ? count * hot / (hot + lot) : 0
    const splits = (!hasEnteredTotal ? [maxHot] : both
      ? [...new Set([Math.floor(expectedHot), Math.ceil(expectedHot)].map(value => Math.max(minHot, Math.min(limitHot, value))))]
      : [row.cognitionMode === 'hot' ? count : 0])
      .filter(value => value >= minHot && value <= limitHot)
      .sort((a, b) => Math.abs(a - expectedHot) - Math.abs(b - expectedHot) || b - a)
    for (const hotCount of splits) {
      const lotCount = count - hotCount
      result.options.push({
        id: `${count}:${hotCount}`, label: row.label, totalQuestions: count, totalMarks: marks(count * unit),
        recommended: result.options.length === 0,
        hotQuestions: hotCount, lotQuestions: lotCount, hotMarks: marks(hotCount * unit), lotMarks: marks(lotCount * unit),
        remainingHot: marks(hot - hotCount * unit), remainingLot: marks(lot - lotCount * unit), perQuestionMarks: Number(row.perQuestionMarks),
        canApply: Number(row.totalMarks) !== marks(count * unit) || row.hotQuestions !== hotCount || row.lotQuestions !== lotCount,
      })
    }
  }
  if (!result.options.length) result.message = 'No percentage-based split fits the remaining marks and this selection. Review this row’s total or the other allocations.'
  if (!result.options.length && row.label.startsWith('SAQs (') && ['lot', 'hot'].includes(row.cognitionMode)) {
    const selectedHot = row.cognitionMode === 'hot'
    const available = selectedHot ? hot : lot
    const level = selectedHot ? 'HoT' : 'LoT'
    result.message = available < unit
      ? `${marks(available)} ${level} marks available. A ${marks(unit)}-mark ${level} question cannot fit.`
      : `${marks(available)} ${level} marks available. This row needs ${marks(enteredUnits)} ${level} marks.`
    const alternateBudget = selectedHot ? lot : hot
    const count = hasEnteredTotal ? enteredUnits / unit : Math.floor(alternateBudget / unit)
    if (Number.isInteger(count) && count > 0 && count * unit <= alternateBudget) {
      const requiredMode = selectedHot ? 'lot' : 'hot'
      result.options.push({
        id: `switch:${requiredMode}:${count}`, label: row.label, requiredMode, requiresConfirmation: true,
        modeAlternative: true, totalQuestions: count, totalMarks: marks(count * unit), perQuestionMarks: Number(row.perQuestionMarks),
        hotQuestions: selectedHot ? 0 : count, lotQuestions: selectedHot ? count : 0,
        hotMarks: selectedHot ? 0 : marks(count * unit), lotMarks: selectedHot ? marks(count * unit) : 0,
        remainingHot: marks(hot - (selectedHot ? 0 : count * unit)),
        remainingLot: marks(lot - (selectedHot ? count * unit : 0)), canApply: true,
      })
      result.showExplanation = true
    }
  }
  return result
}
