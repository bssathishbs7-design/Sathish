import test from 'node:test'
import assert from 'node:assert/strict'
import { suggestPromotion, validatePromotion } from './studentPromotionForm.js'
const students = [{ academicYear: '2023-2024', entries: [{ start: '2023-01-26', outcome: 'Current' }] }]
test('late promotion suggests dates compatible with the end date', () => {
  const draft = { date: '2026-10-26', ...suggestPromotion(students, '2026-10-26') }
  assert.equal(draft.academicYear, '2026-2027')
  assert.equal(draft.startsOn, draft.date)
  assert.deepEqual(validatePromotion(students, draft), {})
})
test('choosing a future academic year moves the suggested start into that year', () => {
  assert.equal(suggestPromotion(students, '2026-10-26', '2028-2029').startsOn, '2028-01-01')
})
test('manual mismatched dates identify the fields that need correction', () => {
  const errors = validatePromotion(students, { date: '2026-10-26', academicYear: '2024-2025', startsOn: '2027-01-26' })
  assert.ok(errors.academicYear)
  assert.ok(errors.startsOn)
})
test('promotion requires a later end date and later academic year for every selected student', () => {
  const errors = validatePromotion(students, { date: '2023-01-26', academicYear: '2023-2024', startsOn: '2023-01-25' })
  assert.ok(errors.date)
  assert.ok(errors.academicYear)
  assert.ok(errors.startsOn)
})
