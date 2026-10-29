import { corelationRatingRows } from '../pages/corelationRatingData.js'
import { SUBJECTS } from './logbookCatalog.js'

/** Existing curriculum aliases; stored Logbook subject names are unchanged. */
const prefixes = { BI: 'BC', IM: 'GM' }
/** @returns {Array<{code:string,name:string}>} Unique competencies for a Logbook subject. */
export function logbookCompetencies(subject) {
  const entry = SUBJECTS.find(item => item.name === subject)
  if (!entry) return []
  const prefix = prefixes[entry.code] || entry.code
  const matches = corelationRatingRows.filter(row => row.code?.replace(/\s/g, '').match(/^[A-Z]+/)?.[0] === prefix)
  return [...new Map(matches.map(row => [row.code.replace(/\s/g, ''), { code: row.code.replace(/\s/g, ''), name: row.name }])).values()]
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
}
