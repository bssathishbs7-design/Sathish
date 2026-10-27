import { ID_TYPES } from './qid.js'
const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const issued = new Set()
export function parseDraftId(input) {
  const value = String(input || '').trim().toUpperCase().replace(/[\s_]+/g, '-')
  if (/^DRF-[0-9A-HJKMNP-TV-Z]{8}$/.test(value)) return value
  const match = value.match(/^(?:DRF-?)?(SA|AP|BP|QB|AQ)-?([0-9A-Z]{6})$/)
  if (!match) return null
  const token = match[2].replace(/[IL]/g,'1').replace(/O/g,'0')
  return [...token].every(char => alphabet.includes(char)) ? `DRF-${match[1]}-${token}` : null
}
/** Cryptographic draft reference. No permanent sequence is consumed. */
export function createDraftRecordCode(type, known = []) {
  if (!ID_TYPES.includes(type)) throw new Error('Unknown draft ID type.')
  known.forEach(value => { const draft = parseDraftId(value); if (draft) issued.add(draft) })
  for (let attempt = 0; attempt < 100; attempt++) {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(6))
    const id = `DRF-${type}-${Array.from(bytes, byte => alphabet[byte & 31]).join('')}`
    if (!issued.has(id)) { issued.add(id); return id }
  }
  throw new Error('Unable to reserve a unique draft ID. Please try again.')
}
