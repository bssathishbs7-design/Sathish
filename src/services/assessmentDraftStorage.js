/** Read exact storage values so discarding can undo automatically persisted edits. */
export function captureAssessmentStorage(keys, storage = localStorage) {
  return Object.fromEntries(keys.map(key => [key, storage.getItem(key)]))
}

/**
 * Commit a set of serialised values, restoring previous values if a write fails.
 * @param {Record<string, string|null>} values Null removes a key.
 * @param {Storage} storage
 */
export function commitAssessmentStorage(values, storage = localStorage) {
  const before = captureAssessmentStorage(Object.keys(values), storage)
  const write = (key, value) => value === null ? storage.removeItem(key) : storage.setItem(key, value)
  const written = []
  try {
    for (const [key, value] of Object.entries(values)) {
      write(key, value)
      written.push(key)
    }
  } catch (error) {
    // Release newly occupied space before restoring the previous snapshot.
    for (const key of written) storage.removeItem(key)
    for (const key of written) write(key, before[key])
    throw error
  }
}

/** Match only identity, allowing multiple assessments with the same title. */
export function upsertAssessmentDraft(rows, draft, sourceDraftId) {
  return [draft, ...rows.filter(row => row.id !== draft.id
    && (!sourceDraftId || row.id !== sourceDraftId)
    && (!draft.setup.assessmentId || row.setup?.assessmentId !== draft.setup.assessmentId))]
}
