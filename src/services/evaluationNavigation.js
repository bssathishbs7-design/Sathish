/**
 * Find the next present student requiring evaluation, wrapping once through the list.
 * @param {Array<{id: string, isAbsent: boolean, markedEvaluated: boolean, evalStatus: string}>} rows
 * @param {string} currentId
 * @returns {object|null} Null means no other eligible student remains.
 */
export function nextPendingEvaluationStudent(rows, currentId) {
  const currentIndex = rows.findIndex(row => row.id === currentId)
  const ordered = [...rows.slice(currentIndex + 1), ...rows.slice(0, currentIndex + 1)]
  return ordered.find(row => row.id !== currentId && !row.isAbsent
    && !(row.markedEvaluated && row.evalStatus === 'Completed')) || null
}
