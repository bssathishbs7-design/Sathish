const SEQUENCE_PREFIX = 'vx-assessment-daily-sequence:'
const indiaDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
})

/**
 * Reserve a new assessment identity. Replace this local adapter with a server
 * allocation endpoint when IDs must be shared across devices or users.
 * Web Locks serialise reservations across tabs of the same browser origin.
 * @param {{storage?: Storage, now?: () => Date, createId?: () => string, locks?: LockManager}} options
 * @returns {Promise<{assessmentId: string, assessmentCode: string, createdAt: string}>}
 */
export async function reserveAssessmentIdentity({
  storage = globalThis.localStorage,
  now = () => new Date(),
  createId = () => globalThis.crypto.randomUUID(),
  locks = globalThis.navigator?.locks,
} = {}) {
  const reserve = () => {
    const date = now()
    const parts = Object.fromEntries(indiaDate.formatToParts(date).map(part => [part.type, part.value]))
    const key = `${SEQUENCE_PREFIX}${parts.year}-${parts.month}-${parts.day}`
    const stored = storage.getItem(key)
    const previous = stored === null ? 0 : Number(stored)
    if (!Number.isInteger(previous) || previous < 0) throw new Error('The assessment sequence could not be read. Please contact support.')
    if (previous >= 999) throw new Error('All 999 assessment IDs for today have been allocated. Please try again tomorrow.')
    const sequence = previous + 1
    const identity = {
      assessmentId: `assessment-${createId()}`,
      assessmentCode: `ASST${parts.month}${parts.day}${String(sequence).padStart(3, '0')}`,
      createdAt: date.toISOString(),
    }
    storage.setItem(key, String(sequence))
    return identity
  }
  return locks ? locks.request('medsy-assessment-identity', reserve) : reserve()
}
