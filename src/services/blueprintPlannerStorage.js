/** Read the authoritative workflow snapshot, while retaining legacy planner support.
 * @param {string} key Assessment-scoped planner key.
 * @param {string} assessmentId Stable assessment identity.
 * @param {Storage} storage Local persistence adapter.
 */
export function readBlueprintPlanner(key, assessmentId, storage = localStorage) {
  const parse = name => { try { return JSON.parse(storage.getItem(name) || 'null') } catch { return null } }
  const cached = parse(key)
  const workflow = parse(`vx-assessment-blueprint-workflow:${assessmentId}`)
  const snapshot = workflow?.snapshot || (cached?.workflowAssessmentId ? parse(`vx-assessment-blueprint-workflow:${cached.workflowAssessmentId}`)?.snapshot : cached)
  if (!snapshot || snapshot.validationStatus !== 'matched') return null
  return { ...snapshot, ...(cached?.workflowAssessmentId && typeof cached.enabled === 'boolean' ? { enabled: cached.enabled } : {}) }
}

/** Store only a reference after the workflow has durably saved the snapshot.
 * A full cache is never needed for recovery: readers fall back to the workflow.
 * Optional reference quota failures must not turn a successful save into a failure.
 */
export function saveBlueprintPlannerReference(key, assessmentId, storage = localStorage, enabled) {
  const workflow = JSON.parse(storage.getItem(`vx-assessment-blueprint-workflow:${assessmentId}`) || 'null')
  if (!workflow?.snapshot) throw new Error('The blueprint has not been saved. Please try again.')
  const reference = { workflowAssessmentId: assessmentId, ...(typeof enabled === 'boolean' ? { enabled } : {}) }
  try { storage.setItem(key, JSON.stringify(reference)) }
  catch (error) {
    if (error?.name !== 'QuotaExceededError' && error?.name !== 'NS_ERROR_DOM_QUOTA_REACHED') throw error
    // The existing cache is left intact; readBlueprintPlanner prefers the durable workflow.
    return false
  }
  return true
}

/** Compact only exact duplicate legacy caches; never discard a distinct planner snapshot. */
export function compactDuplicateBlueprintPlanners(storage = localStorage) {
  const canonical = value => JSON.stringify(value && typeof value === 'object'
    ? Array.isArray(value) ? value.map(item => JSON.parse(canonical(item))) : Object.fromEntries(Object.keys(value).sort().map(key => [key, JSON.parse(canonical(value[key]))]))
    : value ?? null)
  let compacted = 0
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index)
    if (!key?.startsWith('vx-create-assessment-blueprint-planner:')) continue
    let cache, flow
    try {
      cache = JSON.parse(storage.getItem(key) || 'null')
      if (!cache?.assessmentId || cache.workflowAssessmentId) continue
      flow = JSON.parse(storage.getItem(`vx-assessment-blueprint-workflow:${cache.assessmentId}`) || 'null')
    } catch { continue }
    if (!flow?.snapshot) continue
    const comparable = { ...cache }
    delete comparable.savedAt
    if (canonical(comparable) !== canonical(flow.snapshot)) continue
    if (saveBlueprintPlannerReference(key, cache.assessmentId, storage)) compacted++
  }
  return compacted
}
