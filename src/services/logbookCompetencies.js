import { corelationRatingRows } from '../pages/corelationRatingData.js'
import { SUBJECTS } from './logbookCatalog.js'
import catalogue from '../data/logbookDocumentCatalogue.json' with { type: 'json' }

/** Existing curriculum aliases; stored Logbook subject names are unchanged. */
const prefixes = { BI: 'BC', IM: 'GM' }
/** @returns {Array<{code:string,name:string}>} Unique competencies for a Logbook subject. */
export function logbookCompetencies(subject) {
  const entry = SUBJECTS.find(item => item.name === subject)
  if (!entry) return []
  const prefix = prefixes[entry.code] || entry.code
  const matches = corelationRatingRows.filter(row => row.code?.replace(/\s/g, '').match(/^[A-Z]+/)?.[0] === prefix)
  const rows = [...matches, ...catalogue.activities.filter(row => row.subject === subject && row.code)]
  const unique = new Map()
  for (const row of rows) {
    const code = row.code.replace(/\s/g, '')
    if (!/^[A-Z]+\d+(?:\.\d+)+$/.test(code)) continue
    if (!unique.has(code)) unique.set(code, new Set())
    if (row.name?.trim()) unique.get(code).add(row.name.trim())
  }
  return [...unique].map(([code, names]) => ({ code, name: [...names].join(' / ') }))
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
}
