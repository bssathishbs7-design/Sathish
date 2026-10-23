/** Sort a copy of history rows. Missing values stay last in either direction. */
export function sortAssessmentHistory(events, key = 'timestamp', direction = 'desc') {
  const value = event => key === 'timestamp' ? Date.parse(event.timestamp) : String(event[key] || '').trim()
  return [...events].sort((a, b) => {
    const left = value(a), right = value(b)
    const leftMissing = key === 'timestamp' ? !Number.isFinite(left) : !left
    const rightMissing = key === 'timestamp' ? !Number.isFinite(right) : !right
    if (leftMissing || rightMissing) return Number(leftMissing) - Number(rightMissing)
    const compared = key === 'timestamp' ? left - right : left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
    return direction === 'asc' ? compared : -compared
  })
}
