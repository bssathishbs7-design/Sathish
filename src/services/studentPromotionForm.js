import { currentEntry, validDate, validYear, withinYear } from './studentModel.js'

/** Suggest dates for selected students using the existing academic-year date boundaries. */
export function suggestPromotion(students, date, academicYear) {
  const earliestYear = Math.max(...students.map(student => Number(student.academicYear.slice(5))), Number(date.slice(0, 4)))
  const year = academicYear || String(earliestYear) + '-' + String(earliestYear + 1)
  return { academicYear: year, startsOn: date > year.slice(0, 4) + '-01-01' ? date : year.slice(0, 4) + '-01-01' }
}

/** Return field errors before sending a promotion command; service validation remains authoritative. */
export function validatePromotion(students, draft) {
  const errors = {}
  if (!validDate(draft.date)) errors.date = 'Choose an end date.'
  else if (students.some(student => draft.date <= currentEntry(student)?.start)) errors.date = 'Choose a date after every selected student?s current-year start.'
  if (!validYear(draft.academicYear) || students.some(student => draft.academicYear <= student.academicYear)) errors.academicYear = 'Choose an academic year later than the current year.'
  else if (draft.date > draft.academicYear.slice(5) + '-12-31') errors.academicYear = 'Choose an academic year that includes or follows the end date.'
  if (!validDate(draft.startsOn)) errors.startsOn = 'Choose a start date.'
  else if (draft.startsOn < draft.date) errors.startsOn = 'Start date must be on or after the end date.'
  else if (!withinYear(draft.startsOn, draft.academicYear)) errors.startsOn = 'Start date must fall within ' + draft.academicYear + '.'
  return errors
}
