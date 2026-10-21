/** Move optional recovery copies out of localStorage without deleting live data.
 * A backup is removed only after IndexedDB confirms it was stored successfully.
 * @returns {Promise<void>}
 */
export async function archiveAssessmentRecoveryBackups(storage = localStorage, database = globalThis.indexedDB) {
  const keys = Object.keys(storage).filter(key => key === 'vx-assessment-clear-all-backup' || /^vx-assessment-tracker-reset-.*:backup$/.test(key))
  if (!keys.length || !database) return
  const entries = keys.map(key => [key, storage.getItem(key)])
  const db = await new Promise((resolve, reject) => {
    const request = database.open('medsy-assessment-recovery', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('backups')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Recovery storage is unavailable.'))
  })
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('backups', 'readwrite')
      entries.forEach(([key, value]) => transaction.objectStore('backups').put(value, key))
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error || new Error('Recovery backup was not stored.'))
    })
    entries.forEach(([key, value]) => { if (storage.getItem(key) === value) storage.removeItem(key) })
  } finally { db.close() }
}
