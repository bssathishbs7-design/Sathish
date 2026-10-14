const cents = value => Math.round(Number(value) * 100)

/** Exact final adjustments, using existing whole questions only. LAQ parts and
 * their allocations are fixed; SAQs may change thinking level when applied.
 * Search is bounded to keep typing responsive.
 * @param {Array<{label:string,perQuestionMarks:number|string,totalMarks:number|string,totalQuestions:number,hotQuestions:number,lotQuestions:number,hotMarks:number,lotMarks:number,cognitionMode?:string,hasValidQuestionTotal:boolean,usesLaqSplit?:boolean}>} rows Derived breakdown rows.
 * @param {{totalMarks:number,hotMarks:number}} target Assessment targets.
 * @returns {{options:Array<{id:string,changes:Array<{label:string,count:number,delta:number,from:string,to:string}>}>,message:string}|null}
 */
export function getCognitionSuggestions(rows, target) {
  const total = cents(target.totalMarks)
  const hotTarget = cents(target.hotMarks)
  if (!Number.isSafeInteger(total) || total <= 0 || !Number.isSafeInteger(hotTarget) || hotTarget < 0 || hotTarget > total) return null
  const entered = rows.filter(row => String(row.perQuestionMarks ?? '').trim() || String(row.totalMarks ?? '').trim())
  if (!entered.length || entered.some(row => !row.hasValidQuestionTotal
    || !Number.isFinite(row.hotMarks) || !Number.isFinite(row.lotMarks)
    || cents(row.hotMarks) + cents(row.lotMarks) !== cents(row.totalMarks)
    || (row.label === 'LAQs' && !row.usesLaqSplit))) return null
  if (entered.reduce((sum, row) => sum + cents(row.totalMarks), 0) !== total) return null
  const gap = hotTarget - entered.reduce((sum, row) => sum + cents(row.hotMarks), 0)
  if (!gap) return null
  const eligible = entered.filter(row => row.label === 'MCQs' || row.label.startsWith('SAQs ('))
    .filter(row => [row.totalQuestions, row.hotQuestions, row.lotQuestions].every(Number.isSafeInteger)
    && row.hotQuestions >= 0 && row.lotQuestions >= 0 && row.hotQuestions + row.lotQuestions === row.totalQuestions
    && cents(row.perQuestionMarks) > 0
    && cents(row.perQuestionMarks) * row.hotQuestions === cents(row.hotMarks)
    && cents(row.perQuestionMarks) * row.lotQuestions === cents(row.lotMarks))
    .map(row => ({ ...row, unit: cents(row.perQuestionMarks) }))
  const signature = JSON.stringify([target, entered.map(row => [row.label, row.perQuestionMarks, row.totalMarks, row.hotQuestions, row.lotQuestions, row.hotMarks, row.lotMarks, row.cognitionMode])])
  const options = []
  const add = changes => options.push({ id: JSON.stringify([signature, changes.map(change => [change.label, change.delta])]), changes })
  const change = (row, delta) => ({ label: row.label, count: Math.abs(delta), delta, from: delta > 0 ? 'LoT' : 'HoT', to: delta > 0 ? 'HoT' : 'LoT' })
  // Single-row fixes are always considered first, even for very large counts.
  for (const row of eligible) {
    const delta = gap / row.unit
    if (Number.isInteger(delta) && delta >= -row.hotQuestions && delta <= row.lotQuestions) add([change(row, delta)])
  }
  let visits = 0
  const limit = 50000
  const search = (index, remaining, slots, changes) => {
    if (++visits > limit || eligible.length - index < slots) return
    if (!slots) { if (!remaining) add(changes); return }
    const rest = eligible.slice(index)
    if (remaining < -rest.reduce((sum, row) => sum + row.hotQuestions * row.unit, 0)
      || remaining > rest.reduce((sum, row) => sum + row.lotQuestions * row.unit, 0)) return
    for (let i = index; i <= eligible.length - slots && visits <= limit; i += 1) {
      const row = eligible[i]
      if (slots === 1) {
        const delta = remaining / row.unit
        if (delta && Number.isInteger(delta) && delta >= -row.hotQuestions && delta <= row.lotQuestions) add([...changes, change(row, delta)])
        continue
      }
      const direction = remaining >= 0 ? 1 : -1
      const max = Math.max(row.hotQuestions, row.lotQuestions)
      for (let count = 1; count <= max && visits <= limit; count += 1) {
        for (const delta of [count * direction, -count * direction]) {
          if (delta < -row.hotQuestions || delta > row.lotQuestions) continue
          search(i + 1, remaining - delta * row.unit, slots - 1, [...changes, change(row, delta)])
        }
      }
    }
  }
  for (let size = 2; size <= eligible.length && options.length < 6 && visits <= limit; size += 1) search(0, gap, size, [])
  options.sort((a, b) => a.changes.length - b.changes.length
    || a.changes.reduce((sum, item) => sum + item.count, 0) - b.changes.reduce((sum, item) => sum + item.count, 0))
  return { options: options.slice(0, 6), message: options.length ? '' : visits > limit
    ? 'No quick exact adjustment found. Adjust the editable HoT or LoT counts manually.'
    : 'No exact adjustment is available using the current editable questions. Review the counts or LAQ parts.' }
}

/** Apply a current suggestion atomically, snapshotting other displayed counts so
 * they stay unchanged. Returns null for stale or invalid cards; never mutates input.
 * @param {Object<string,object>} draft Persisted breakdown rows.
 * @param {Array<object>} rows Current derived rows, as above.
 * @param {{totalMarks:number,hotMarks:number}} target Current targets.
 * @param {string} id Suggestion identifier from getCognitionSuggestions.
 * @returns {Object<string,object>|null}
 */
export function applyCognitionSuggestion(draft, rows, target, id) {
  const option = getCognitionSuggestions(rows, target)?.options.find(item => item.id === id)
  if (!option) return null
  const next = { ...draft }
  for (const row of rows.filter(item => item.hasValidQuestionTotal && item.label !== 'LAQs')) {
    const delta = option.changes.find(item => item.label === row.label)?.delta || 0
    const hotQuestions = row.hotQuestions + delta
    const lotQuestions = row.lotQuestions - delta
    next[row.label] = { ...draft[row.label], hotQuestions: String(hotQuestions), lotQuestions: String(lotQuestions),
      ...(delta && row.label.startsWith('SAQs (') ? { cognitionMode: hotQuestions === 0 ? 'lot' : lotQuestions === 0 ? 'hot' : 'both' } : {}),
      hotMarks: String(hotQuestions * cents(row.perQuestionMarks) / 100), lotMarks: String(lotQuestions * cents(row.perQuestionMarks) / 100) }
  }
  return next
}
