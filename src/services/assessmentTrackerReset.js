const RESET_KEY = 'vx-assessment-tracker-reset-2026-10-21'
const BACKUP_KEY = `${RESET_KEY}:backup`
const CARD_KEYS = ['vx-assessment-drafts', 'vx-assessment-published']

/**
 * Apply the requested one-time local tracker reset, preserving a recovery snapshot.
 * Subsequent visits retain newly created assessments. Other app data is untouched.
 * @param {Storage} storage Browser local storage.
 * @returns {boolean} Whether this browser has completed the reset.
 */
export function resetAssessmentTrackerOnce(storage, session = globalThis.sessionStorage) {
  if (session && !session.getItem(RESET_KEY)) {
    const queueKey = "vx-approval-queue-rows"
    const rows = JSON.parse(session.getItem(queueKey) || "[]")
    session.setItem(BACKUP_KEY, JSON.stringify(rows))
    session.setItem(queueKey, JSON.stringify(rows.filter(row => !["assessment", "blueprint"].includes(String(row.activityType || "").toLowerCase()))))
    session.setItem(RESET_KEY, "complete")
  }
  if (storage.getItem(RESET_KEY)) return true
  if (!storage.getItem(BACKUP_KEY)) {
    storage.setItem(BACKUP_KEY, JSON.stringify(Object.fromEntries(
      CARD_KEYS.map(key => [key, storage.getItem(key)]),
    )))
  }
  CARD_KEYS.forEach(key => storage.setItem(key, '[]'))
  storage.setItem(RESET_KEY, 'complete')
  return true
}

/** Clear tracker lists and assessment approval entries, preserving other modules.
 * Retain a recovery snapshot when browser storage has enough space.
 * @param {Storage} storage Local storage.
 * @param {Storage} session Session storage.
 * @returns {Array<Object>} Remaining non-assessment approval rows.
 */
export function clearAssessmentCards(storage = localStorage, session = sessionStorage) {
  const queueKey = 'vx-approval-queue-rows'
  const before = CARD_KEYS.map(key => [key, storage.getItem(key)])
  const queueBefore = session.getItem(queueKey)
  const remaining = JSON.parse(queueBefore || '[]').filter(row => !['assessment', 'blueprint'].includes(String(row.activityType || '').toLowerCase()))
  try {
    CARD_KEYS.forEach(key => storage.setItem(key, '[]'))
    session.setItem(queueKey, JSON.stringify(remaining))
  } catch (error) {
    before.forEach(([key, value]) => { if (value === null) storage.removeItem(key); else storage.setItem(key, value) })
    if (queueBefore === null) session.removeItem(queueKey); else session.setItem(queueKey, queueBefore)
    throw error
  }
  // Backing up first duplicates large question/image payloads and can exhaust
  // storage before clearing. Recovery storage must not block an explicit clear.
  try {
    storage.setItem('vx-assessment-clear-all-backup', JSON.stringify({ clearedAt: new Date().toISOString(), local: Object.fromEntries(before), queue: queueBefore }))
  } catch {
    // The requested clear succeeded; leave any previous recovery snapshot intact.
  }
  return remaining
}
