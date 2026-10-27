import { CURRENT_INSTITUTION_CODE } from '../config/institution.js'

const TABLE = [[0,3,1,7,5,9,8,6,4,2],[7,0,9,2,1,5,4,8,6,3],[4,2,0,6,8,7,1,3,5,9],[1,7,5,0,9,8,3,4,2,6],[6,1,2,3,0,4,5,9,7,8],[3,6,7,4,2,0,9,5,8,1],[5,8,6,9,7,2,0,1,3,4],[8,9,4,5,3,6,2,0,1,7],[9,4,3,8,6,1,7,2,0,5],[2,5,8,1,4,3,6,7,9,0]]
export const ID_TYPES = ['SA', 'AP', 'BP', 'QB', 'AQ']
export const MAX_SEQUENCE = 99999999999
const COUNTERS = 'vx-qid-sequences'
const LEDGER = 'vx-qid-issued'
export const damm = digits => [...String(digits)].reduce((value, digit) => TABLE[value][Number(digit)], 0)
export const validInstitution = value => /^[A-Z0-9]{2,8}$/.test(value) && !value.startsWith('DRF')
/** Format a positive sequence; the final digit is a Damm check digit, not part of the sequence. */
export function formatQid(type, sequence, institution = CURRENT_INSTITUTION_CODE) {
  if (!validInstitution(institution) || !ID_TYPES.includes(type) || !Number.isSafeInteger(sequence) || sequence < 1 || sequence > MAX_SEQUENCE) throw new Error('Invalid ID namespace or exhausted ID sequence.')
  return `${institution}-${type}-${`${sequence}${damm(sequence)}`.padStart(['QB','AQ'].includes(type) ? 7 : 5, '0')}`
}
/** Read separated input before compact input so draft tokens can never become an institution. */
export function parseQid(input) {
  const value = String(input || '').trim().toUpperCase()
  if (value.startsWith('DRF')) return null
  const parts = value.split(/[\s_-]+/)
  const match = parts.length === 3 ? parts : parts.length === 1 ? value.match(/^([A-Z0-9]{2,8}?)(SA|AP|BP|QB|AQ|AS)(\d{2,12})$/)?.slice(1) : null
  if (!match) return null
  const [institution, originalType, number] = match, type = originalType === 'AS' ? 'AQ' : originalType
  if (!validInstitution(institution) || !ID_TYPES.includes(type) || !/^\d{2,12}$/.test(number) || damm(number) !== 0 || Number(number.slice(0,-1)) < 1) return null
  return { institution, type, number: Number(number), sequence: Number(number.slice(0,-1)), canonical: formatQid(type, Number(number.slice(0,-1)), institution) }
}
export const isPermanentRecordId = (value, type) => {
  const parsed = parseQid(value)
  return Boolean(parsed && (!type || parsed.type === type) || /^(?!DRF)[A-Z0-9]{2,8}-(AP|BP)-\d{2}-\d{2,12}$/i.test(value || '') || /^(ASST\d+|ASSTBP\d+)$/i.test(value || ''))
}
export const sameQid = (a,b) => Boolean(parseQid(a) && parseQid(b) && parseQid(a).canonical === parseQid(b).canonical)
export function compareQids(a,b) {
  const first = parseQid(a), second = parseQid(b)
  if (!first || !second) return Number(Boolean(second)) - Number(Boolean(first))
  return first.institution.localeCompare(second.institution) || first.type.localeCompare(second.type) || first.number - second.number
}
const readObject = (storage, key) => {
  const value = JSON.parse(storage.getItem(key) || '{}')
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('ID registry could not be read.')
  return value
}
/** Local mock allocation boundary. Production must allocate within the server's assign/publish/approve transaction.
 * @param {string} type ID type.
 * @param {number} count Entire batch size; overflow never advances the counter.
 * @param {{storage?:Storage,institution?:string,existing?:unknown[]}} options Known persisted records aid counter recovery.
 */
export function mintQids(type, count = 1, { storage = globalThis.localStorage, institution = CURRENT_INSTITUTION_CODE, existing = [] } = {}) {
  if (count === 0) return []
  if (!storage) throw new Error('ID storage is unavailable.')
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid ID batch size.')
  formatQid(type, 1, institution)
  const counters = readObject(storage, COUNTERS), ledger = readObject(storage, LEDGER), key = `${institution}:${type}`
  let highest = ['SA','AP'].includes(type) ? 20 : 0
  for (const value of [counters[key], ledger[key]]) {
    if (value !== undefined && (!Number.isSafeInteger(value) || value < 0)) throw new Error('ID registry could not be read.')
    highest = Math.max(highest, value || 0)
  }
  const inspect = value => {
    if (typeof value === 'string') { const id = parseQid(value); if (id?.institution === institution && id.type === type) highest = Math.max(highest, id.sequence) }
    else if (value && typeof value === 'object') Object.values(value).forEach(inspect)
  }
  inspect(existing)
  for (let index = 0; index < (storage.length || 0); index++) {
    const name = storage.key(index)
    if (name === COUNTERS || name === LEDGER) continue
    const raw = storage.getItem(name)
    try { inspect(JSON.parse(raw)) } catch { /* Unrelated non-JSON preferences contain no ID records. */ }
  }
  if (highest + count > MAX_SEQUENCE) throw new Error('The ID sequence is exhausted. No IDs were issued.')
  const ids = Array.from({ length: count }, (_, index) => formatQid(type, highest + index + 1, institution))
  if (count) {
    // Reserve in the independent non-deletable ledger first. A failed counter write can leave a gap, never a duplicate.
    storage.setItem(LEDGER, JSON.stringify({ ...ledger, [key]: highest + count }))
    storage.setItem(COUNTERS, JSON.stringify({ ...counters, [key]: highest + count }))
  }
  return ids
}
export const mintRecordId = (type, options) => mintQids(type, 1, options)[0]
