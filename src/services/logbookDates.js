/** Local calendar dates; seven days includes today and the preceding six days. */
export function inLastDays(value, days, now = new Date()) {
  if (!value) return false
  const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - days + 1)
  const end = new Date(now); end.setHours(23, 59, 59, 999)
  const date = new Date(value.length === 10 ? value + 'T12:00:00' : value)
  return date >= start && date <= end
}
/** Most recent persisted event, including faculty decisions and conversation. */
export const latestEntryEvent = entry => [entry.date, entry.submittedAt, entry.updatedAt, entry.verifiedAt, ...(entry.audit || []).map(event => event.at), ...(entry.extra?.comments || []).map(comment => comment.date)].filter(Boolean).sort().at(-1) || ''
