/** Preserve a row's displayed split when target percentages change or before Undo.
 * Existing manual fields stay intact. LAQ counts remain derived from their parts.
 * @param {object|undefined} draft Persisted values for one question type.
 * @param {object|undefined} row Derived row containing validity and cognition counts.
 * @returns {object} Independent copy of this row only.
 */
export function snapshotBlueprintRow(draft = {}, row) {
  const next = { ...draft }
  if (row?.hasValidQuestionTotal && !row.pendingAllocation && row.label !== 'LAQs') {
    next.hotQuestions = String(row.hotQuestions)
    next.lotQuestions = String(row.lotQuestions)
  }
  return next
}

/** Whether a derived row has a complete allocation that consumes assessment budgets.
 * Draft marks alone do not reserve marks. LAQ parts must be complete; other rows
 * must contain whole-question counts consistent with their selected thinking level.
 * @param {object} row Derived breakdown row.
 * @returns {boolean}
 */
export function isBlueprintRowAllocated(row) {
  if (!row || row.pendingAllocation || !row.hasValidQuestionTotal) return false
  const cents = value => Math.round(Number(value) * 100)
  const amount = cents(row.totalMarks)
  const unit = cents(row.perQuestionMarks)
  const hot = cents(row.hotMarks)
  const lot = cents(row.lotMarks)
  if (![amount, unit, hot, lot].every(Number.isFinite) || amount <= 0 || unit <= 0
    || amount % unit || hot < 0 || lot < 0 || hot + lot !== amount) return false
  if (row.label === 'LAQs') return Boolean(row.usesLaqSplit)
  if (!Number.isInteger(row.hotQuestions) || !Number.isInteger(row.lotQuestions)
    || row.hotQuestions < 0 || row.lotQuestions < 0
    || row.hotQuestions * unit !== hot || row.lotQuestions * unit !== lot) return false
  return !row.label.startsWith('SAQs (') || (['lot', 'hot', 'both'].includes(row.cognitionMode)
    && (row.cognitionMode !== 'lot' || hot === 0) && (row.cognitionMode !== 'hot' || lot === 0))
}

/** Remaining budgets for replacing one row; incomplete rows do not reserve marks. */
export function getBlueprintRowBudget(row, rows, target) {
  const others = rows.filter(item => item.label !== row.label && isBlueprintRowAllocated(item))
  const cents = value => Math.round(Number(value) * 100)
  return {
    hot: (cents(target.hotMarks) - others.reduce((sum, item) => sum + cents(item.hotMarks), 0)) / 100,
    lot: (cents(target.totalMarks) - cents(target.hotMarks) - others.reduce((sum, item) => sum + cents(item.lotMarks), 0)) / 100,
  }
}

/** Disabled reasons per SAQ mode. The currently selected mode always stays available. */
export function getBlueprintModeReasons(row, rows, target) {
  const budget = getBlueprintRowBudget(row, rows, target)
  const unit = Number(row.perQuestionMarks) || 0
  const total = Number(row.totalMarks) || 0
  const result = {}
  for (const mode of ['lot', 'hot', 'both']) {
    if (mode === row.cognitionMode) continue
    if (budget.hot + budget.lot <= 0) result[mode] = 'All assessment marks are allocated.'
    else if (mode !== 'hot' && budget.lot <= 0) result[mode] = 'LoT target reached.'
    else if (mode !== 'lot' && budget.hot <= 0) result[mode] = 'HoT target reached.'
    else if (unit > 0) {
      const hotCount = Math.max(0, Math.floor(Math.round(budget.hot * 100) / Math.round(unit * 100)))
      const lotCount = Math.max(0, Math.floor(Math.round(budget.lot * 100) / Math.round(unit * 100)))
      const count = total / unit
      const fits = mode === 'both'
        ? hotCount > 0 && lotCount > 0 && (!total || (Number.isInteger(count) && count >= 2 && count <= hotCount + lotCount))
        : (mode === 'hot' ? hotCount : lotCount) >= (total ? count : 1) && (!total || Number.isInteger(count))
      if (!fits) result[mode] = 'No whole-question split fits the available marks.'
    }
  }
  return result
}
