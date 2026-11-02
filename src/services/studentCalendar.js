/** Batch calendars use inclusive YYYY-MM ranges. All dates are local calendar dates, not instants. */
export const STUDY_YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year']
export const monthIndex = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value || '') ? +value.slice(0, 4) * 12 + +value.slice(5) - 1 : NaN
export const monthValue = index => `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}`
export const monthStart = value => value + '-01'
export const monthEnd = value => `${value}-${new Date(+value.slice(0, 4), +value.slice(5), 0).getDate()}`
export const calendarValue = calendar => calendar ? `${calendar.from}/${calendar.to}` : ''
export const calendarMonths = calendar => monthIndex(calendar?.to) - monthIndex(calendar?.from) + 1
export function calendarLabel(calendar) {
  if (typeof calendar === 'string') { const [from, to] = calendar.split('/'); calendar = { from, to } }
  if (!Number.isFinite(monthIndex(calendar?.from)) || !Number.isFinite(monthIndex(calendar?.to))) return 'Not set'
  const label = value => new Date(+value.slice(0, 4), +value.slice(5) - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  return `${label(calendar.from)} – ${label(calendar.to)}`
}
export function validateCalendar(batch, year, calendar) {
  const months = calendarMonths(calendar)
  if (!STUDY_YEARS.includes(year) || !Number.isFinite(months) || months < 6 || months > 24) return 'Choose the start and end month (6 to 24 months).'
  for (const [other, range] of Object.entries(batch.calendars || {})) {
    if (other === year) continue
    if (STUDY_YEARS.indexOf(other) < STUDY_YEARS.indexOf(year) && calendar.from <= range.to) return `${year} must start after ${other} ends (${calendarLabel(range)}).`
    if (STUDY_YEARS.indexOf(other) > STUDY_YEARS.indexOf(year) && calendar.to >= range.from) return `${year} must end before ${other} starts (${calendarLabel(range)}).`
  }
  return ''
}
export function suggestedCalendar(batch, year) {
  if (batch.calendars?.[year]) return batch.calendars[year]
  const previous = batch.calendars?.[STUDY_YEARS[STUDY_YEARS.indexOf(year) - 1]]
  const from = previous ? monthValue(monthIndex(previous.to) + 1) : `${batch.id}-08`
  return { from, to: monthValue(monthIndex(from) + (year === 'Fourth Year' ? 17 : 11)) }
}
export const studying = student => !student.graduated && STUDY_YEARS.includes(student.year)
export const currentCalendar = (data, student) => data.batches.find(b => b.id === student.batch)?.calendars?.[student.year]
export function runningYear(batch, date) {
  return STUDY_YEARS.find(year => { const c = batch.calendars?.[year]; return c && monthStart(c.from) <= date && monthEnd(c.to) >= date })
}
export function joinableYear(batch, year, date) {
  const c = batch?.calendars?.[year]
  if (!c) return false
  const first = STUDY_YEARS.find(y => batch.calendars?.[y])
  return runningYear(batch, date) === year || (year === first && date < monthStart(c.from))
}
export function laterBatches(data, student) {
  const end = currentCalendar(data, student)?.to
  return data.batches.filter(b => +b.id > +student.batch && b.course === student.course && b.calendars?.[student.year] && (!end || b.calendars[student.year].from > end)).sort((a, b) => a.id.localeCompare(b.id))
}
export function studentProgress(data, student, date) {
  const mother = student.motherBatch || student.batch
  const batch = data.batches.find(b => b.id === mother)
  const expected = batch && [...STUDY_YEARS].reverse().find(year => batch.calendars?.[year] && monthStart(batch.calendars[year].from) <= date)
  const difference = expected ? STUDY_YEARS.indexOf(expected) - STUDY_YEARS.indexOf(student.year) : 0
  const lag = Math.max(0, difference, +student.batch - +mother)
  return { lag, label: lag ? `Backlog · ${lag} yr` : 'On Track', summary: lag ? `${lag} year${lag > 1 ? 's' : ''} behind mother Batch ${mother}${student.batch !== mother ? ` · Migrated to Batch ${student.batch}` : ''}` : 'In the same year as their batch.' }
}
export function isLeftOver(data, student, date) {
  if (!studying(student)) return false
  const calendar = currentCalendar(data, student)
  return Boolean(calendar && monthEnd(calendar.to) < date && laterBatches(data, student).some(batch => runningYear(batch, date) === student.year && data.students.some(s => studying(s) && s.batch === batch.id && (s.motherBatch || s.batch) === batch.id && s.year === student.year)))
}
/** Resolve older-batch admissions onto a later calendar without inventing earlier attempts. */
export function admissionDestination(data, draft, date) {
  const batch = data.batches.find(b => b.id === draft.batch)
  if (!batch || !STUDY_YEARS.includes(draft.year)) throw new Error('Choose a batch and the year the student is joining.')
  const calendar = batch.calendars?.[draft.year]
  if (!calendar) throw new Error(`Batch ${batch.id} ${draft.year} dates are not set yet. Set them in Admission batches.`)
  if (joinableYear(batch, draft.year, date)) return { batch: batch.id, calendar, motherBatch: batch.id }
  if (monthEnd(calendar.to) < date) {
    const target = laterBatches(data, { ...draft, course: batch.course }).find(b => joinableYear(b, draft.year, date))
    if (target) return { batch: target.id, calendar: target.calendars[draft.year], motherBatch: batch.id }
    throw new Error(`Batch ${batch.id} finished ${draft.year} and no later batch has eligible dates. Add the next batch or set its dates first.`)
  }
  throw new Error('Students can join the running year or the first configured year before the batch starts.')
}
