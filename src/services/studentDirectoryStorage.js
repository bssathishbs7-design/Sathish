/** IndexedDB holds the directory and an untouched snapshot from before its first save.
 * LocalStorage remains a read-only migration source; no existing records are deleted.
 */
const DATABASE = 'medsy-student-directory'
const STORE = 'snapshots'

function storageError(error) {
  const message = error?.name === 'QuotaExceededError'
    ? 'Device storage is full. Your changes were not saved. Free some device space and try again. Existing student records have been kept.'
    : 'Student records could not be saved or loaded from browser storage. Existing records have been kept. Close other Medsy tabs and try again.'
  return new Error(message, { cause: error })
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('Browser database storage is unavailable. Enable site storage to save student records.')); return }
    const request = indexedDB.open(DATABASE, 1)
    let blocked = false
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onerror = () => reject(storageError(request.error))
    request.onblocked = () => { blocked = true; reject(storageError(new Error('Database blocked'))) }
    request.onsuccess = () => {
      const db = request.result
      if (blocked) { db.close(); return }
      db.onversionchange = () => db.close()
      resolve(db)
    }
  })
}

/** @returns {Promise<object|undefined>} Undefined means migration has not occurred yet. */
export async function readStudentSnapshot() {
  const db = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).get('current')
      tx.oncomplete = () => resolve(request.result)
      tx.onabort = () => reject(storageError(tx.error))
      tx.onerror = () => reject(storageError(tx.error))
    })
  } finally { db.close() }
}

/** Commit the complete directory atomically; resolve only after the transaction commits.
 * @param {object} next Validated student directory including photos and audit history.
 * @param {object} previous Directory before this command, retained on the first save.
 */
export async function writeStudentSnapshot(next, previous) {
  const db = await openDatabase()
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const backup = store.get('before-first-save')
      backup.onsuccess = () => { if (backup.result === undefined) store.put(previous, 'before-first-save') }
      store.put(next, 'current')
      tx.oncomplete = resolve
      tx.onabort = () => reject(storageError(tx.error))
      tx.onerror = () => reject(storageError(tx.error))
    })
  } catch (error) {
    if (error.cause) throw error
    throw storageError(error)
  } finally { db.close() }
}
