import { calculateBlueprintOutline } from './blueprintOutline.js'
import { getBlueprintOutlinePercentages } from './blueprintOutlinePercentages.js'

/** Snapshot allocations before editing one row. Only that row releases its allocation.
 * lockedHotCents is persisted with the setup draft, so later rows cannot rebalance it.
 * @param {object} draft Setup rows.
 * @param {string} label Edited row.
 * @param {string} field Edited field.
 * @param {string} value New input.
 * @param {{totalMarks:number,hotMarks:number}} target Assessment targets.
 * @param {object} previousLaq Previous LAQ quantities.
 * @param {Array} laqParts Existing LAQ parts.
 * @param {number} selectedHotCents Optional exact allocation from a suggestion.
 */
export function updateBlueprintOutlineRow(draft, label, field, value, target, previousLaq, laqParts, selectedHotCents) {
  const preview = getBlueprintOutlinePercentages(draft, target, previousLaq, laqParts)
  const next = Object.fromEntries(Object.entries(draft).map(([key, row]) => [key, { ...row,
    ...(key !== label && preview.rows[key] ? { lockedHotCents: preview.rows[key].hotCents } : {}),
  }]))
  next[label] = { ...next[label], [field]: value }
  if (field !== 'cognitionMode' && !next[label].perQuestionMarks && !next[label].questionCount) delete next[label].cognitionMode
  delete next[label].lockedHotCents
  if (selectedHotCents !== undefined) next[label].lockedHotCents = selectedHotCents
  const updated = getBlueprintOutlinePercentages(next, target, label === 'LAQs' ? {} : previousLaq, label === 'LAQs' ? [] : laqParts)
  if (updated.rows[label]) next[label].lockedHotCents = updated.rows[label].hotCents
  return next
}

/** Remaining marks and per-row budget errors; unresolved rows never consume cognition marks. */
export function getBlueprintSetupBalance(draft, target, preview) {
  const outline = calculateBlueprintOutline(draft, target.totalMarks)
  let hot = Math.round(target.hotMarks * 100)
  let lot = Math.round((target.totalMarks - target.hotMarks) * 100)
  for (const row of Object.values(preview.rows).filter(Boolean)) {
    hot -= row.hotCents
    lot -= row.totalCents - row.hotCents
  }
  return { total: outline.remaining, hot: hot / 100, lot: lot / 100,
    pending: outline.rows.some(row => row.entered && row.valid && !preview.rows[row.label]) }
}

/** Clear legacy non-digit input values without rounding marks or changing valid rows.
 * @param {object} draft Persisted setup rows.
 * @returns {object} Original draft when no repair is needed.
 */
export function normalizeBlueprintSetupInputs(draft) {
  let next = draft
  for (const [label, row] of Object.entries(draft)) {
    const invalid = ['perQuestionMarks', 'questionCount'].filter(field => !/^\d*$/.test(String(row[field] ?? '')))
    if (!invalid.length) continue
    if (next === draft) next = { ...draft }
    const repaired = { ...row }
    for (const field of invalid) repaired[field] = ''
    delete repaired.lockedHotCents
    next[label] = repaired
  }
  return next
}

/** Remove saved thinking-level selections from unused rows when opening setup. */
export function clearEmptyBlueprintModes(draft) {
  return Object.fromEntries(Object.entries(draft).map(([label, row]) => {
    if (String(row.perQuestionMarks ?? '').trim() || String(row.questionCount ?? '').trim()) return [label, row]
    const clean = { ...row }
    delete clean.cognitionMode
    delete clean.lockedHotCents
    return [label, clean]
  }))
}
