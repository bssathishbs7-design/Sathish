/**
 * Assign configured SAQ units to planner cells, preserving question counts and marks.
 * @param {{units: {category: string, marks: number}[], cells: {key: string, count: number, marks: number}[]}} input
 * @returns {Object<string, {category: string, count: number, perQuestionMarks: number, totalMarks: number}[]>|null} Null means the draft cannot be allocated.
 */
export function allocateCategoryBreakdown({ units, cells }) {
  const weights = [...new Set(units.map((unit) => unit.marks))].sort((a, b) => b - a)
  const pools = weights.map((weight) => units.filter((unit) => unit.marks === weight))
  const remaining = pools.map((pool) => pool.length)
  const assignments = []
  const failed = new Set()
  function solve(index) {
    if (index === cells.length) return true
    const cell = cells[index]
    const signature = `${index}:${remaining.join(',')}`
    if (failed.has(signature)) return false
    const selected = weights.map(() => 0)
    function choose(weightIndex, count, marks) {
      if (count === 0 && marks === 0) {
        selected.forEach((amount, i) => { remaining[i] -= amount })
        assignments[index] = [...selected]
        if (solve(index + 1)) return true
        selected.forEach((amount, i) => { remaining[i] += amount })
        return false
      }
      if (weightIndex === weights.length || count < 0 || marks < 0) return false
      const weight = weights[weightIndex]
      for (let amount = Math.min(count, remaining[weightIndex], Math.floor(marks / weight)); amount >= 0; amount -= 1) {
        selected[weightIndex] = amount
        if (choose(weightIndex + 1, count - amount, marks - amount * weight)) return true
      }
      selected[weightIndex] = 0
      return false
    }
    if (choose(0, cell.count, cell.marks)) return true
    failed.add(signature)
    return false
  }
  if (units.some((unit) => unit.marks <= 0) || !solve(0)) return null
  const order = ['Direct', 'Reasoning', 'Aetcom', 'Application']
  return Object.fromEntries(cells.map((cell, index) => {
    const counts = new Map()
    assignments[index].forEach((amount, i) => {
      pools[i].splice(0, amount).forEach(({ category, marks }) => {
        const key = JSON.stringify([category, marks])
        const entry = counts.get(key) || { category, count: 0, perQuestionMarks: marks, totalMarks: 0 }
        entry.count += 1
        entry.totalMarks = Number((entry.totalMarks + marks).toFixed(2))
        counts.set(key, entry)
      })
    })
    return [cell.key, [...counts.values()]
      .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.perQuestionMarks - b.perQuestionMarks)]
  }))
}
