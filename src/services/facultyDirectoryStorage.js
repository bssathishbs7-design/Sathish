import { getStudentDirectory } from './studentManagement.js'
import { initialFacultyState, applyFacultyCommand } from './facultyAssignments.js'
import { FACULTY_EVENT } from './facultyModel.js'

const DB = 'medsy-faculty-workspace'
function open() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error('Browser storage is unavailable. Enable storage and retry.'))
    const request = indexedDB.open(DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('institutions')
    request.onerror = () => reject(new Error('Faculty records could not be opened. Existing data has been kept.'))
    request.onblocked = () => reject(new Error('Close other Medsy tabs and retry.'))
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result) }
  })
}
export async function readFaculty(institutionId, directory) {
  const db = await open()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('institutions', 'readonly')
      const request = tx.objectStore('institutions').get(institutionId)
      tx.oncomplete = () => {
        if (request.result && (request.result.version !== 1 || request.result.institutionId !== institutionId)) reject(new Error('Unsupported faculty data version. Saved data has not been replaced.'))
        else resolve(request.result || initialFacultyState(institutionId, directory))
      }
      tx.onabort = () => reject(new Error('Faculty records could not be read. Retry.'))
    })
  } finally { db.close() }
}
/** One IndexedDB transaction commits faculty records, memberships, audit and idempotency ledger.
 * Student database remains separate; production must enforce cross-domain revisions on the server.
 */
export async function saveFaculty(command, options) {
  const directory = await getStudentDirectory()
  const db = await open()
  try {
    const data = await new Promise((resolve, reject) => {
      const tx = db.transaction('institutions', 'readwrite')
      const store = tx.objectStore('institutions')
      let next, failure
      const request = store.get(options.institutionId)
      request.onsuccess = () => {
        try {
          next = applyFacultyCommand(request.result || initialFacultyState(options.institutionId, directory), command, directory, options)
          store.put(next, options.institutionId)
        } catch (error) { failure = error; tx.abort() }
      }
      tx.oncomplete = () => resolve(next)
      tx.onabort = () => reject(failure || new Error('Faculty changes could not be saved. Existing data has been kept.'))
      tx.onerror = () => { failure ||= new Error('Browser storage failed. Free space and retry; the draft is retained.') }
    })
    window.dispatchEvent(new Event(FACULTY_EVENT))
    if (typeof BroadcastChannel !== 'undefined') { const channel = new BroadcastChannel(FACULTY_EVENT); channel.postMessage('saved'); channel.close() }
    return data
  } finally { db.close() }
}

