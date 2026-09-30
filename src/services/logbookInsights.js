import { SUBJECTS } from './logbookCatalog.js'
import { requirementProgress } from './logbookProgress.js'
import { isLoggedEntry } from './logbookPolicy.js'
import { skillProgress, today } from './logbook.js'
import { waitingDays } from './logbookPeople.js'
import { inLastDays } from './logbookDates.js'

/** Reference-only rotation schedule supplied by the HTML. Replace through the institution adapter. */
export const SAMPLE_POSTINGS = [
  { subject: 'General Surgery', end: '2026-09-30' },
  { subject: 'Community Medicine', end: '2026-10-10' },
  { subject: 'General Medicine', end: '2026-11-07' },
  { subject: 'Obstetrics and Gynaecology', end: '2026-12-05' },
  { subject: 'Paediatrics', end: '2027-01-09' },
  { subject: 'Orthopaedics', end: '2027-02-06' },
]
/** @returns {{pending:number,oldest:number,aged:number,skills:Object[],unstarted:Object[],week:number,posting:Object|null}} */
export function logbookInsights(entries, postings = [], now = today()) {
  const live = entries.filter(isLoggedEntry), pending = live.filter(entry => entry.status === 'Pending')
  const skills = SUBJECTS.flatMap(subject => skillProgress(live, subject)).filter(skill => skill.attempts.length)
  const unstarted = SUBJECTS.filter(subject => live.some(entry => entry.subject === subject.name)).flatMap(subject => requirementProgress(subject.name, live).filter(item => !item.count).map(item => ({ ...item, subject: subject.name })))
  const next = [...postings].filter(posting => posting.end >= now).sort((a,b) => a.end.localeCompare(b.end))[0]
  const posting = next ? { ...next, days: Math.max(0, Math.round((new Date(next.end + 'T12:00:00') - new Date(now + 'T12:00:00')) / 86400000)), outstanding: requirementProgress(next.subject, live).reduce((sum,item) => sum + Math.max(0,item.required-item.count),0) } : null
  return { pending: pending.length, oldest: Math.max(0,...pending.map(waitingDays)), aged: pending.filter(entry => waitingDays(entry) > 14).length, skills, unstarted, week: live.filter(entry => inLastDays(entry.submittedAt || entry.date,7)).length, posting }
}
