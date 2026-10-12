/** Count whole questions separately from LAQ parts. Rows use label, hotCount and lotCount. */
export function summarizeCognitionCounts(rows) {
  const result = { hot: { questions: 0, parts: 0 }, lot: { questions: 0, parts: 0 } }
  for (const row of rows) {
    if (!row) continue
    for (const level of ['hot', 'lot']) result[level][row.parts || row.label === 'LAQs' ? 'parts' : 'questions'] += Number(row[level + 'Count']) || 0
  }
  return result
}
/** Display units explicitly so parts cannot be mistaken for whole questions. */
export function formatCognitionCount(count, empty = '-') {
  if (!count) return empty
  const labels = []
  if (count.questions) labels.push(count.questions + (count.questions === 1 ? ' Question' : ' Questions'))
  if (count.parts) labels.push(count.parts + (count.parts === 1 ? ' Part' : ' Parts'))
  return labels.join(' + ') || empty
}
