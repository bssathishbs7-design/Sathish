/** Only editable table values participate; display, validation and allocation hints do not. */
const fields = {
  distribution: ['blueprintDraft', 'blueprintDistributionDraft'],
  specifications: ['blueprintCognitionWeightage', 'blueprintQuestionTypeDraft', 'blueprintLaqQuestionSplits'],
  matrix: ['blueprintTestSpecificationCountDraft', 'blueprintTestSpecificationMarkDraft', 'blueprintUnitAssignments'],
}
const normalise = value => {
  if (Array.isArray(value)) return value.map(normalise)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, normalise(value[key])]))
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return value
}
export const blueprintTableSignatures = snapshot => Object.fromEntries(Object.entries(fields).map(([table, keys]) => [table, JSON.stringify(normalise(Object.fromEntries(keys.map(key => [key, snapshot?.[key] ?? {}]))))]))

/** Derive per-table attribution against the submitted baseline. Reverted edits remove attribution.
 * @param {Object<string,string>} baseline Normalised submitted table signatures.
 * @param {Object<string,string>} current Current table signatures.
 * @param {{name:string,id?:string,registerId?:string}} actor Signed-in reviewer.
 * @param {Object} previous Previously derived table attribution, used to retain timestamps.
 * @param {string} now ISO modification timestamp.
 */
export function blueprintTableModifications(baseline, current, actor, previous = {}, now = new Date().toISOString()) {
  return Object.fromEntries(Object.keys(fields).filter(table => baseline[table] !== current[table]).map(table => [table,
    previous[table]?.signature === current[table] ? previous[table] : {
      modifiedBy: actor?.name || 'Reviewer', reviewerId: actor?.id || actor?.registerId || '', modifiedAt: now, signature: current[table],
    },
  ]))
}
