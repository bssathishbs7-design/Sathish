/** Recover a paper logo only from snapshots belonging to this assessment.
 * @param {Object} assessment Published assessment with optional setup.
 * @param {Storage} storage Local assessment storage.
 * @returns {string} Image URL or an empty string when no saved logo exists.
 */
export function getAssessmentPaperLogo(assessment, storage) {
  if (assessment.setup?.logoPreview) return assessment.setup.logoPreview
  if (assessment.logoPreview) return assessment.logoPreview
  const id = assessment.setup?.assessmentId || assessment.assessmentId || assessment.id
  if (!id) return ''
  for (const key of ['vx-create-assessment-setup', 'vx-assessment-drafts']) {
    try {
      const saved = JSON.parse(storage.getItem(key) || 'null')
      const rows = Array.isArray(saved) ? saved : [saved]
      for (const row of rows) {
        const setup = row?.setup || row
        if ((setup?.assessmentId || row?.id) === id && setup?.logoPreview) return setup.logoPreview
      }
    } catch {
      // Other matching snapshots may still contain the logo.
    }
  }
  return ''
}
