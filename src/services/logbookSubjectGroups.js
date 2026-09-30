import { activityParts, entryTitle } from './logbookTitles.js'

/** Subject browsing combines original certification and remedial attempts. */
export const subjectCategory = entry => entry.cat === 'remedial' ? 'cert' : entry.cat

/** Match the prototype's activity identity without altering persisted records. */
export function subjectActivityTitle(entry) {
  const v = entry.values || {}
  const parts = ({
    ccp: [v.diagnosis], clerkship: [v.provDx], proc: [v.activity],
    simulation: [v.activity], ach: [v.activity], emergency: [v.shift ? `${v.shift} shift` : 'Casualty duty'],
    obg: [v.recordType], pm: [v.recordType], imm: [v.sessionType],
    fap: [v.place], fvs: [v.village || v.place],
  })[entry.cat] || activityParts(entry)
  return parts.filter(Boolean).join(' · ') || entryTitle(entry)
}

/** Each activity retains all student attempts, sorted newest first. */
export function subjectActivityGroups(entries) {
  const groups = new Map()
  for (const entry of entries) {
    const title = subjectActivityTitle(entry)
    const key = JSON.stringify([subjectCategory(entry), title.trim().toLowerCase()])
    if (!groups.has(key)) groups.set(key, { key, title, rows: [] })
    groups.get(key).rows.push(entry)
  }
  return [...groups.values()].map(group => ({ ...group, rows: group.rows.sort((a, b) => (b.submittedAt || b.date || '').localeCompare(a.submittedAt || a.date || '')) }))
    .sort((a, b) => b.rows.length - a.rows.length || a.title.localeCompare(b.title))
}
