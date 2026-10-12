const cents = value => Math.round(Number(value) * 100)
const part = (marks, level) => ({ marks: String(marks / 100), level })

/** Generate one or two positive parts per LAQ, preserving exact cognition budgets.
 * @param {number|string} unit Marks per question.
 * @param {number|string} count Number of LAQs.
 * @param {{hot:number,lot:number}} target Allocated LAQ cognition marks.
 */
export function createLaqParts(unit, count, target) {
  const questionMarks = cents(unit)
  let hot = cents(target.hot)
  let lot = cents(target.lot)
  if (!Number.isInteger(Number(count)) || Number(count) <= 0 || questionMarks <= 0
    || ![hot, lot].every(Number.isFinite) || hot < 0 || lot < 0 || hot + lot !== questionMarks * Number(count)) return []
  return Array.from({ length: Number(count) }, (_, index) => {
    const remainingQuestions = Number(count) - index
    const precision = lot % 100 === 0 && questionMarks % 100 === 0 ? 100 : 1
    const lotMarks = Math.min(questionMarks, Math.ceil(lot / precision / remainingQuestions) * precision)
    const hotMarks = questionMarks - lotMarks
    const splits = [...(lotMarks ? [part(lotMarks, 'lot')] : []), ...(hotMarks ? [part(hotMarks, 'hot')] : [])]
    hot -= hotMarks
    lot -= lotMarks
    return { splitCount: String(splits.length), splits }
  })
}

/** Complete only the edited question after a marks field is committed. Generated
 * remainder parts may be refreshed; explicit parts and other questions stay intact.
 * @param {object[]} questions Current LAQ part drafts.
 * @param {number} questionIndex Edited question.
 * @param {number|string} unit Marks per question.
 * @param {{hot:number,lot:number}} target LAQ cognition budget excluding other types.
 */
export function completeLaqRemainder(questions, questionIndex, unit, target) {
  const question = questions[questionIndex]
  if (!question) return questions
  const explicit = question.splits.filter(item => !item.autoRemainder)
  if (!explicit.length || explicit.some(item => !Number.isFinite(Number(item.marks)) || cents(item.marks) <= 0 || !['hot', 'lot'].includes(item.level))) return questions
  const remaining = cents(unit) - explicit.reduce((sum, item) => sum + cents(item.marks), 0)
  if (remaining < 0) return questions
  const budget = { hot: cents(target.hot), lot: cents(target.lot) }
  const retained = questions.flatMap((item, index) => index === questionIndex ? explicit : item.splits)
  for (const item of retained) {
    if (!['hot', 'lot'].includes(item.level) || !Number.isFinite(Number(item.marks)) || cents(item.marks) <= 0) return questions
    budget[item.level] -= cents(item.marks)
  }
  if (budget.hot < 0 || budget.lot < 0 || budget.hot + budget.lot !== remaining) return questions
  const splits = [...explicit, ...['lot', 'hot'].filter(level => budget[level] > 0).map(level => ({ ...part(budget[level], level), autoRemainder: true }))]
  if (splits.length > 20) return questions
  return questions.map((item, index) => index === questionIndex ? { ...item, splitCount: String(splits.length), splits } : item)
}
/** Remove empty placeholders only when the entered, valid parts already fill the question. */
export function normalizeCompletedLaq(question, unit) {
  const splits = question.splits || []
  const entered = splits.filter(item => String(item.marks ?? '').trim() !== '')
  if (!entered.length || entered.length === splits.length
    || entered.some(item => !Number.isFinite(Number(item.marks)) || cents(item.marks) <= 0 || !['hot', 'lot'].includes(item.level))
    || entered.reduce((sum, item) => sum + cents(item.marks), 0) !== cents(unit)) return question
  return { ...question, splitCount: String(entered.length), splits: entered }
}

/** Lowercase split label for a zero-based index: a., b., ... z., aa. */
export function formatLaqSplitLabel(index) {
  let label = ''
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    label = String.fromCharCode(97 + (value - 1) % 26) + label
  }
  return label + '.'
}

/** Explain invalid LAQ split marks without mutating the entered values. */
export function getLaqSplitError(splits, target) {
  if (!splits.length) return 'Add split marks to complete this question.'
  const total = splits.reduce((sum, split) => sum + (Number(split.marks) || 0), 0)
  if (splits.some(split => String(split.marks).trim() !== '' && (!Number.isSafeInteger(Number(split.marks)) || Number(split.marks) <= 0))) return 'Enter a positive whole number for every split mark.'
  if (total > target) return total + ' / ' + target + ' marks allocated. Reduce the split marks by ' + (total - target) + '.'
  if (total < target) return total + ' / ' + target + ' marks allocated. Add the remaining ' + (target - total) + ' marks.'
  if (splits.some(split => !Number(split.marks))) return 'Complete or clear the unfinished splits.'
  if (splits.some(split => !['hot', 'lot'].includes(split.level))) return 'Set the thinking levels in Edit Setup to complete this question.'
  return ''
}
