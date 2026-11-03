import { reserveAssessmentIdentity } from './assessmentIdentity.js'
import { compactDuplicateBlueprintPlanners } from './blueprintPlannerStorage.js'
import { archiveAssessmentRecoveryBackups } from './assessmentRecoveryStorage.js'

const SETUP_KEY = 'vx-create-assessment-setup'
const TAB_KEY = 'vx-create-assessment-initial-tab'
const isQuotaError = error => ['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'].includes(error?.name)

/** Free duplicate cache space and archive recovery copies without deleting live assessments. */
export async function recoverAssessmentStorage(storage = globalThis.localStorage) {
  compactDuplicateBlueprintPlanners(storage)
  await archiveAssessmentRecoveryBackups(storage)
}

/**
 * Persist the complete new-workspace handoff before navigation. Retry quota failures once,
 * with the same identity, after lossless recovery. Restore the previous handoff on failure.
 * @param {Object} initialSetup Empty assessment form defaults.
 * @param {{storage?: Storage, createId?: () => string, recover?: (storage: Storage) => Promise<void>}} options
 * @returns {Promise<Object>} Saved setup, including reserved assessment and blueprint identities.
 */
export async function createAssessmentWorkspace(initialSetup, {
  storage = globalThis.localStorage,
  createId = () => globalThis.crypto.randomUUID(),
  recover = recoverAssessmentStorage,
} = {}) {
  const id = createId()
  const workflowKey = `vx-assessment-blueprint-workflow:assessment-${id}`
  const before = new Map([workflowKey, SETUP_KEY, TAB_KEY].map(key => [key, storage.getItem(key)]))
  const rollback = () => {
    // Remove this attempt's new keys first, making room to restore any older values.
    for (const [key, value] of before) if (value === null) storage.removeItem(key)
    for (const [key, value] of before) {
      if (value !== null && storage.getItem(key) !== value) storage.setItem(key, value)
    }
  }
  const save = async () => {
    const identity = await reserveAssessmentIdentity({ storage, createId: () => id })
    const setup = { ...initialSetup, ...identity }
    storage.setItem(SETUP_KEY, JSON.stringify(setup))
    storage.setItem(TAB_KEY, 'create')
    return setup
  }
  try {
    try { return await save() }
    catch (error) {
      rollback()
      if (!isQuotaError(error)) throw error
      // A failed archive retains its originals. Still retry if compaction freed space.
      try { await recover(storage) } catch { /* Existing records and backups remain intact. */ }
      return await save()
    }
  } catch (error) {
    rollback()
    if (isQuotaError(error)) {
      throw new Error('Browser storage is full. A new assessment could not be saved. Existing assessments have been kept. Free some space for this site or export your data before removing any records.', { cause: error })
    }
    throw error
  }
}
