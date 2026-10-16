const RESET_KEY = 'vx-assessment-tracker-reset-2026-10-16'
const BACKUP_KEY = `${RESET_KEY}:backup`
const CARD_KEYS = ['vx-assessment-drafts', 'vx-assessment-published']

/**
 * Apply the requested one-time local tracker reset, preserving a recovery snapshot.
 * Subsequent visits retain newly created assessments. Other app data is untouched.
 * @param {Storage} storage Browser local storage.
 * @returns {boolean} Whether this browser has completed the reset.
 */
export function resetAssessmentTrackerOnce(storage) {
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
