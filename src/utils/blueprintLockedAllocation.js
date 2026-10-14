/** Fill around fixed manual cells, retaining their exact unit identities.
 * @param {{rows:Array<{key:string,targetMarks:number}>,unitsByField:Object<string,Array<{id:string,marks:number}>>,assignments:Object<string,Object<string,string>|null>,manual:Object<string,Object<string,boolean>>,seed?:number}} input
 * @returns {{assignments?:Object<string,Object<string,string>>,counts?:Object,marks?:Object,error?:string,complete?:boolean,unallocated?:Array,remainingMarks?:number}}
 */
export function fillAroundManualCells({ rows, unitsByField, assignments, manual, seed = 0 }) {
  const fields = Object.keys(unitsByField)
  const next = Object.fromEntries(fields.map(field => [field, {}]))
  const capacity = rows.map(row => Math.round(Number(row.targetMarks) * 100))
  const remaining = []
  for (const field of fields) {
    if (rows.some(row => manual[row.key]?.[field]) && !assignments[field]) return { error: 'Review the manual allocations in this column before using AutoFill.' }
    for (const unit of unitsByField[field]) {
      const owner = assignments[field]?.[unit.id]
      const rowIndex = rows.findIndex(row => row.key === owner)
      if (rowIndex >= 0 && manual[owner]?.[field]) {
        next[field][unit.id] = owner
        capacity[rowIndex] -= Math.round(unit.marks * 100)
      } else remaining.push({ ...unit, field, weight: Math.round(unit.marks * 100) })
    }
  }
  const fail = 'Review the manual counts and competency targets before using AutoFill.'
  if (capacity.some(value => !Number.isSafeInteger(value) || value < 0)
    || remaining.some(unit => !Number.isSafeInteger(unit.weight) || unit.weight <= 0)) return { error: fail }
  const fixedAssignments = structuredClone(next)
  const availableCapacity = [...capacity]
  remaining.sort((a, b) => b.weight - a.weight || a.field.localeCompare(b.field))
  const failed = new Set()
  let visits = 0
  const solve = index => {
    if (++visits > 100000) return false
    if (index === remaining.length) return capacity.every(value => value === 0)
    const signature = index + ':' + capacity.join(',')
    if (failed.has(signature)) return false
    const unit = remaining[index]
    const eligible = rows.map((row, i) => ({ row, i }))
      .filter(({ row, i }) => !manual[row.key]?.[unit.field] && capacity[i] >= unit.weight)
      .sort((a, b) => capacity[a.i] - capacity[b.i] || ((a.i + seed) % rows.length) - ((b.i + seed) % rows.length))
    for (const { row, i } of eligible) {
      capacity[i] -= unit.weight
      next[unit.field][unit.id] = row.key
      if (solve(index + 1)) return true
      delete next[unit.field][unit.id]
      capacity[i] += unit.weight
    }
    failed.add(signature)
    return false
  }
  const totalsMatch = remaining.reduce((sum, unit) => sum + unit.weight, 0) === capacity.reduce((sum, value) => sum + value, 0)
  if (!totalsMatch || !solve(0)) {
    // Skip units that cannot fit instead of abandoning all useful allocations.
    // Include the existing allocation as a candidate so a partial refill never loses progress.
    let best = null
    for (const strategy of ['existing', 'largest', 'smallest']) {
      const candidate = structuredClone(fixedAssignments)
      const slots = [...availableCapacity]
      let allocatedMarks = 0
      const place = (unit, rowIndex) => {
        if (rowIndex < 0 || manual[rows[rowIndex].key]?.[unit.field] || slots[rowIndex] < unit.weight) return false
        candidate[unit.field][unit.id] = rows[rowIndex].key
        slots[rowIndex] -= unit.weight
        allocatedMarks += unit.weight
        return true
      }
      if (strategy === 'existing') {
        for (const unit of remaining) place(unit, rows.findIndex(row => row.key === assignments[unit.field]?.[unit.id]))
      }
      const ordered = strategy === 'smallest' ? [...remaining].reverse() : remaining
      for (const unit of ordered) {
        if (candidate[unit.field][unit.id]) continue
        const eligible = rows.map((row, i) => ({ row, i }))
          .filter(({ row, i }) => !manual[row.key]?.[unit.field] && slots[i] >= unit.weight)
          .sort((a, b) => slots[a.i] - slots[b.i] || ((a.i + seed) % rows.length) - ((b.i + seed) % rows.length))
        if (eligible.length) place(unit, eligible[0].i)
      }
      if (!best || allocatedMarks > best.allocatedMarks) best = { candidate, allocatedMarks }
    }
    for (const field of fields) next[field] = best.candidate[field]
  }
  const counts = {}, marks = {}
  for (const row of rows) {
    counts[row.key] = {}
    marks[row.key] = {}
    for (const field of fields) {
      const assigned = unitsByField[field].filter(unit => next[field][unit.id] === row.key)
      counts[row.key][field] = assigned.length ? String(assigned.length) : ''
      marks[row.key][field] = Number(assigned.reduce((sum, unit) => sum + unit.marks, 0).toFixed(2))
    }
  }
  const unallocated = remaining.filter(unit => !next[unit.field][unit.id])
  const remainingMarks = Number((rows.reduce((sum, row) => sum + Number(row.targetMarks), 0)
    - Object.values(marks).reduce((sum, row) => sum + Object.values(row).reduce((a, b) => a + b, 0), 0)).toFixed(2))
  return { assignments: next, counts, marks, complete: !unallocated.length && remainingMarks === 0, unallocated, remainingMarks }
}
