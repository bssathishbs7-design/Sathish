import { explainBlueprintRemainder } from './blueprintRemainder.js'
import { calculateBlueprintOutline } from './blueprintOutline.js'
import { getBlueprintOutlinePercentages } from './blueprintOutlinePercentages.js'

/** Suggestions fill a missing field or offer count alternatives alongside the current allocation.
 * @param {object} draft Setup rows keyed by type.
 * @param {string} label Active row.
 * @param {{totalMarks:number,hotMarks:number}} target Assessment budgets.
 * @param {object} previousLaq Existing LAQ quantities.
 * @param {Array} laqParts Existing LAQ parts.
 * @param {number} visibleCount Maximum cards shown before Show more.
 * @returns {{cards:Array,message:string,hasMore?:boolean}}
 */
function buildBlueprintCountSuggestions(draft, label, target, previousLaq, laqParts, visibleCount = 3) {
  const empty = { cards: [], message: '' }
  const item = draft[label] || {}
  const hasMarks = String(item.perQuestionMarks ?? '').trim() !== ''
  const hasCount = String(item.questionCount ?? '').trim() !== ''
  const unit = Math.round(Number(item.perQuestionMarks) * 100)
  const count = Number(item.questionCount)
  const total = Math.round(target.totalMarks * 100)
  const hotTarget = Math.round(target.hotMarks * 100)
  const mode = item.cognitionMode
  const isLaq = label === 'LAQs'
  if ((!hasMarks && !hasCount) || !(total > 0) || !Number.isFinite(hotTarget) || hotTarget < 0 || hotTarget > total
    || (label.startsWith('SAQs') && !['hot', 'lot', 'both'].includes(mode))) return empty
  if (hasMarks && (!Number.isSafeInteger(unit) || unit <= 0 || !Number.isSafeInteger(Number(item.perQuestionMarks)))) return { cards: [], message: 'Enter a positive whole number for marks per question.' }
  if (hasCount && (!Number.isSafeInteger(count) || count <= 0)) return { cards: [], message: 'Enter a positive whole-question count.' }
  const others = { ...draft }
  delete others[label]
  const outline = calculateBlueprintOutline(others, target.totalMarks)
  const current = getBlueprintOutlinePercentages(draft, target, previousLaq, laqParts)
  const fallback = getBlueprintOutlinePercentages(others, target, previousLaq, laqParts)
  let hot = hotTarget
  let lot = total - hotTarget
  for (const row of outline.rows.filter(row => row.entered && row.valid)) {
    const allocation = current.rows[row.label] || fallback.rows[row.label]
    if (!allocation) return { cards: [], message: 'Review the existing allocations to see available options.' }
    hot -= allocation.hotCents
    lot -= allocation.totalCents - allocation.hotCents
  }
  const remaining = Math.round(outline.remaining * 100)
  if (hot < 0 || lot < 0) return { cards: [], message: 'Existing allocations exceed the cognition targets. Edit those rows first.' }
  const maxCount = marks => Math.min(Math.floor(remaining / marks), isLaq ? Math.floor((hot + lot) / marks)
    : mode === 'hot' ? Math.floor(hot / marks) : mode === 'lot' ? Math.floor(lot / marks)
      : Math.floor(hot / marks) + Math.floor(lot / marks))
  const make = (marks, questions, reason, readOnly = false) => {
    const rowMarks = marks * questions
    const hotCount = mode === 'hot' ? questions : mode === 'lot' ? 0
      : Math.min(questions, Math.floor(hot / marks), Math.max(0, questions - Math.floor(lot / marks), Math.round(questions * (label === 'MCQs' ? 0.75 : hotTarget / total))))
    const calculatedHot = isLaq ? Math.min(hot, Math.max(0, rowMarks - lot, Math.round(rowMarks * hotTarget / total))) : hotCount * marks
    const hotCents = readOnly && current.rows[label] ? current.rows[label].hotCents : calculatedHot
    const after = { total: (remaining - rowMarks) / 100, hot: (hot - hotCents) / 100, lot: (lot - rowMarks + hotCents) / 100 }
    return { after, lockedHotCents: hotCents, count: questions, marksPerQuestion: marks / 100, marks: rowMarks / 100, reason, isLaq, readOnly,
      field: hasMarks ? 'questionCount' : 'perQuestionMarks', value: String(hasMarks ? questions : marks / 100),
      hotCount: isLaq ? 0 : hotCents / marks, lotCount: isLaq ? 0 : questions - hotCents / marks,
      hotMarks: hotCents / 100, lotMarks: (rowMarks - hotCents) / 100,
      warning: explainBlueprintRemainder(draft, label, after) }
  }
  if (hasMarks && hasCount) {
    const max = maxCount(unit)
    if (count > max) return { cards: [], message: `This row can fit at most ${Math.max(0, max)} questions at ${unit / 100} marks each. Edit this row's marks or count.` }
    const card = make(unit, count, 'Current calculation', true)
    if (card.after.hot < 0 || card.after.lot < 0) return { cards: [], message: 'This row exceeds the remaining HoT or LoT marks. Edit its marks, count or thinking level.' }
    const gcd = (a, b) => b ? gcd(b, a % b) : a
    const flexible = !isLaq && !['hot', 'lot'].includes(mode)
    const step = flexible ? label === 'MCQs' ? 4 : total / gcd(total, hotTarget) : 1
    const ratio = label === 'MCQs' ? 0.75 : hotTarget / total
    const exactMax = flexible ? Math.min(max,
      ratio ? Math.floor(hot / (unit * ratio) + 1e-9) : max,
      ratio < 1 ? Math.floor(lot / (unit * (1 - ratio)) + 1e-9) : max) : max
    const firstExact = (Math.floor(count / step) + 1) * step
    const useExact = firstExact <= exactMax
    const increment = useExact ? step : 1
    const upper = useExact ? exactMax : max
    const first = useExact ? firstExact : count + 1
    const candidates = [card]
    let next = first
    while (next <= upper && candidates.length < visibleCount + 1) {
      candidates.push(make(unit, next, useExact && flexible ? 'Exact percentage' : 'Available'))
      next += increment
    }
    // At the upper limit, offer smaller valid counts as explicit alternatives.
    let lower = count - 1
    while (candidates.length < visibleCount + 1 && lower > 0 && first > upper) {
      candidates.push(make(unit, lower, 'Available'))
      lower--
    }
    const descendingOnly = first > upper
    const totalCards = descendingOnly ? count : 1 + Math.max(0, Math.floor((upper - first) / increment) + 1)
    const currentIndex = descendingOnly ? count - 1 : 0
    // Build only the requested page, even when the permitted range is large.
    const getPage = (page, size) => Array.from({ length: Math.max(0, Math.min(size, totalCards - page * size)) }, (_, offset) => {
      const index = page * size + offset
      if (index === currentIndex) return card
      const questions = descendingOnly ? index + 1 : first + (index - 1) * increment
      return make(unit, questions, !descendingOnly && useExact && flexible ? 'Exact percentage' : 'Available')
    })
    return { cards: candidates.slice(0, visibleCount).sort((a, b) => a.count - b.count), hasMore: candidates.length > visibleCount, message: '', totalCards, currentIndex, getPage }
  }
  let cards
  if (hasMarks) {
    const max = maxCount(unit)
    if (max < 1) {
      const level = mode === 'lot' ? 'LoT' : mode === 'hot' ? 'HoT' : ''
      const budget = remaining < unit ? 'total' : level || 'HoT or LoT'
      return { cards: [], message: `Not enough ${budget} marks remain to add a ${unit / 100}-mark question. Reduce the marks per question or adjust ${budget === 'total' ? 'the marks' : `the ${budget} allocation`} in other rows.` }
    }
    cards = [make(unit, 1, 'Low'), make(unit, Math.ceil(max / 2), 'Mid'), make(unit, max, 'High')]
  } else {
    // Feasibility decreases monotonically as marks increase. Work in exact cents.
    let low = 1
    let high = Math.floor(remaining / count)
    let maximum = 0
    while (low <= high) {
      const middle = Math.floor((low + high) / 2)
      if (maxCount(middle) >= count) { maximum = middle; low = middle + 1 } else high = middle - 1
    }
    if (maximum < 100) return { cards: [], message: `No whole-number marks value fits ${count} questions within the remaining budgets.` }
    // Suggest whole marks only, including when less than one mark remains.
    const step = 100
    const max = Math.floor(maximum / step) * step
    cards = [make(step, count, 'Low'), make(Math.max(step, Math.ceil(max / step / 2) * step), count, 'Mid'), make(max, count, 'High')]
  }
  return { cards: cards.filter((card, index) => cards.findIndex(other => other.count === card.count && other.marksPerQuestion === card.marksPerQuestion) === index), message: '' }
}

/** Move the fully allocated option first without changing any allocation values. */
export function getBlueprintCountSuggestions(...args) {
  const result = buildBlueprintCountSuggestions(...args)
  const complete = card => card && card.after.total === 0 && card.after.hot === 0 && card.after.lot === 0
  if (!result.getPage) {
    const cards = [...result.cards].sort((a, b) => Number(complete(b)) - Number(complete(a)))
    return { ...result, cards, completedFirst: complete(cards[0]) }
  }
  // A complete allocation can only be at the largest question count.
  const lastIndex = result.totalCards - 1
  const last = result.getPage(lastIndex, 1)[0]
  if (!complete(last)) return result
  const getPage = (page, size) => Array.from({ length: Math.max(0, Math.min(size, result.totalCards - page * size)) }, (_, offset) => {
    const index = page * size + offset
    return index === 0 ? last : result.getPage(index - 1, 1)[0]
  })
  return { ...result, completedFirst: true, currentIndex: result.currentIndex === lastIndex ? 0 : result.currentIndex + 1,
    getPage, cards: getPage(0, result.cards.length) }
}
