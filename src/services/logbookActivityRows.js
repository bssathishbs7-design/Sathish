import { latestEntryEvent } from './logbookDates.js'

/** Display one row per student's assigned skill; retain raw attempts for history,
 * grading and persistence. Group before filtering and pagination so old decisions
 * cannot replace the current attempt. Missing identities remain separate.
 * @param {Object[]} entries Full Logbook attempt records.
 * @returns {Object[]} Latest attempt per assignment with its latest activity time.
 */
export function logbookActivityRows(entries) {
  const groups = new Map()
  for (const entry of entries) {
    const key = entry.source === 'skills' && entry.sourceAssignmentId && entry.studentId
      ? JSON.stringify([entry.studentId, entry.subject, entry.cat, entry.sourceAssignmentId, entry.sourceActivityId])
      : entry.id
    const previous = groups.get(key)
    if (!previous) { groups.set(key, entry); continue }
    const event = latestEntryEvent(entry)
    const previousEvent = latestEntryEvent(previous)
    const latest = Number(entry.attemptNumber) > Number(previous.attemptNumber)
      || (Number(entry.attemptNumber) === Number(previous.attemptNumber) && event > previousEvent) ? entry : previous
    groups.set(key, { ...latest, updatedAt: event > previousEvent ? event : previousEvent })
  }
  return [...groups.values()]
}
