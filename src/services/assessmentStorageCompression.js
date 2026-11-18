import { gzipSync, gunzipSync, strFromU8, strToU8 } from 'fflate'

const PREFIX = 'medsy:gzip:1:'
const supportedKey = key => /^vx-(assessment|create-assessment|question-bank|blueprint|approval)/.test(key)

/** Lossless representation of large assessment JSON, including image URLs and Unicode text. */
export function encodeAssessmentStorage(value) {
  if (value.length < 1024) return value
  const bytes = gzipSync(strToU8(value))
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192))
  }
  const encoded = PREFIX + btoa(binary)
  return encoded.length < value.length ? encoded : value
}

export function decodeAssessmentStorage(value) {
  if (!value?.startsWith(PREFIX)) return value
  const bytes = Uint8Array.from(atob(value.slice(PREFIX.length)), character => character.charCodeAt(0))
  return strFromU8(gunzipSync(bytes))
}

/**
 * Keep existing synchronous JSON consumers compatible while storing compressed assessment data.
 * Only the supplied localStorage instance is affected; sessionStorage remains unchanged.
 * Migration replaces a value atomically, after verifying its exact round trip, without removing keys.
 * @param {Storage} storage Browser localStorage.
 * @param {object} prototype Storage prototype (injectable for tests).
 */
export function installAssessmentStorageCompression(storage, prototype = Storage.prototype) {
  const installed = Symbol.for('medsy.assessmentStorageCompression')
  if (prototype[installed]) return
  const read = prototype.getItem
  const write = prototype.setItem
  prototype.getItem = function (key) {
    const value = read.call(this, key)
    return this === storage ? decodeAssessmentStorage(value) : value
  }
  prototype.setItem = function (key, value) {
    const text = String(value)
    return write.call(this, key, this === storage && supportedKey(String(key)) ? encodeAssessmentStorage(text) : text)
  }
  Object.defineProperty(prototype, installed, { value: true })
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
  for (const key of keys) {
    if (!supportedKey(key)) continue
    try {
      const original = read.call(storage, key)
      if (!original || original.startsWith(PREFIX)) continue
      const compact = encodeAssessmentStorage(original)
      if (compact !== original && decodeAssessmentStorage(compact) === original) write.call(storage, key, compact)
    } catch {
      // A failed migration leaves the original value in place; never delete data to make room.
    }
  }
}
