/** Reclassify LAQ parts with the fewest changes, preserving their marks and order.
 * @param {Array<{splitCount: string, splits: Array<{marks: string, level: string}>}>} questions
 * @param {'hot'|'lot'} level Edited cognition level.
 * @param {number} count Requested number of parts at that level.
 */
export function redistributeLaqLevels(questions, level, count) {
  const next = questions.map(question => ({ ...question, splits: question.splits.map(part => ({ ...part })) }))
  const parts = next.flatMap(question => question.splits.slice(0, Number(question.splitCount) || 0))
  const target = Math.min(parts.length, Math.max(0, Math.trunc(Number(count) || 0)))
  const other = level === 'hot' ? 'lot' : 'hot'
  let difference = target - parts.filter(part => part.level === level).length
  for (const part of parts) {
    if (difference > 0 && part.level !== level) { part.level = level; difference -= 1 }
    else if (difference < 0 && part.level === level) { part.level = other; difference += 1 }
  }
  for (const part of parts) if (!['hot', 'lot'].includes(part.level)) part.level = other
  return next
}

