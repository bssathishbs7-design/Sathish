import { installAssessmentStorageCompression } from './assessmentStorageCompression.js'

// Runs before application modules read stored assessment snapshots.
if (typeof window !== 'undefined') {
  try {
    installAssessmentStorageCompression(window.localStorage)
  } catch (error) {
    console.error('Assessment storage optimisation is unavailable.', error)
  }
}
