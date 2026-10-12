import { useCallback, useEffect, useState } from 'react'

/** Saves each draft change, and synchronously flushes a complete snapshot before submission.
 * writer returns false on a storage failure. The caller must not report submission success then.
 */
export default function useExamAttemptPersistence(writer, assessment, snapshot) {
  const [attemptSaveError, setAttemptSaveError] = useState('')
  const saveAttempt = useCallback((overrides = {}) => {
    if (!assessment) return false
    const saved = writer(assessment, { ...snapshot, ...overrides })
    setAttemptSaveError(saved ? '' : 'Your latest answers could not be saved. Keep this page open and retry before leaving.')
    return saved
  }, [assessment, snapshot, writer])
  useEffect(() => {
    let active = true
    queueMicrotask(() => { if (active && assessment) saveAttempt() })
    return () => { active = false }
  }, [assessment, saveAttempt])
  return { attemptSaveError, saveAttempt }
}
