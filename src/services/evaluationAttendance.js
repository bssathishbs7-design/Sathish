/** Convert stored attendance codes or labels to P/A; unknown values stay empty. */
export function normalizeEvaluationAttendance(value) {
  const attendance = String(value ?? '').trim().toLowerCase()
  if (attendance === 'p' || attendance === 'present') return 'P'
  if (attendance === 'a' || attendance === 'absent') return 'A'
  return ''
}
