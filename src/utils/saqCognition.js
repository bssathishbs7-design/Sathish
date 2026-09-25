/** Resolve a persisted SAQ cognition choice; other question types return null.
 * @param {string} label Question type label.
 * @param {{cognitionMode?: 'lot'|'hot'|'both'}} draft Persisted question configuration.
 */
export function getSaqCognitionMode(label, draft = {}) {
  if (!label.startsWith('SAQs (')) return null
  if (['lot', 'hot', 'both'].includes(draft.cognitionMode)) return draft.cognitionMode
  return label === 'SAQs (Direct)' ? 'lot' : 'hot'
}
