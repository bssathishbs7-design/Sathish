import { actorName, learnerName, learnerRegisterId } from './logbookPeople.js'
import { categoryLabel } from './logbookPresentation.js'
import { subjectCategory } from './logbookSubjectGroups.js'

/** Shared index for dashboard and full admin search; callers apply visibility first. */
export function matchesAdminSearch(entry, query = '') {
  const text = [learnerName(entry.studentId), learnerRegisterId(entry.studentId), entry.studentId || 'MC2568', entry.subject,
    categoryLabel(entry.cat), categoryLabel(subjectCategory(entry)), actorName(entry.faculty), entry.status,
    ...Object.values(entry.values || {}), entry.extra?.notes, entry.extra?.remarks, entry.extra?.facultyRemarks,
    ...(entry.extra?.comments || []).map(comment => comment.text)].join(' ').toLowerCase()
  return query.trim().toLowerCase().split(/\s+/).every(term => text.includes(term))
}
