export const DEFAULT_ATTAINMENT_LEVELS = [
  { id: 'attainment-0', minPercentage: '0', maxPercentage: '30', level: '0' },
  { id: 'attainment-1', minPercentage: '31', maxPercentage: '49', level: '1' },
  { id: 'attainment-2', minPercentage: '50', maxPercentage: '70', level: '2' },
  { id: 'attainment-3', minPercentage: '71', maxPercentage: '100', level: '3' },
]
export const DEFAULT_BLOOMS_THRESHOLDS = {
  applyThreshold: '55',
  rememberThreshold: '75',
  understandThreshold: '60',
  analyzeThreshold: '45',
  evaluateThreshold: '80',
}

/** Shared defaults for the author form and saved-card status comparison. */
export const DEFAULT_THINKING_THRESHOLDS = {
  thinkingThresholdMode: 'hotlot', lotThreshold: '70', hotThreshold: '60', ...DEFAULT_BLOOMS_THRESHOLDS,
}

/** @param {Object} setup Saved assessment configuration; omitted fields retain defaults. */
export function getAssessmentConfigurationStatus(setup = {}) {
  const enabled = setup.provideStudentInstructions === true || setup.provideStudentInstructions === 'Yes'
  const content = String(setup.studentInstructions || '').replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;|&#xA0;/gi, ' ').trim()
  const changedThinking = Object.entries(DEFAULT_THINKING_THRESHOLDS).some(([key, value]) => {
    if (setup[key] == null) return false
    return key === 'thinkingThresholdMode' ? setup[key] !== value : String(setup[key]).trim() === '' || Number(setup[key]) !== Number(value)
  })
  const normalise = rows => rows.map(row => [row.minPercentage, row.maxPercentage, row.level].map(value => String(value).trim() === '' ? '' : Number(value))).sort((a,b) => a[0] - b[0])
  const changedAttainment = setup.attainmentLevels != null && (!Array.isArray(setup.attainmentLevels) || JSON.stringify(normalise(setup.attainmentLevels)) !== JSON.stringify(normalise(DEFAULT_ATTAINMENT_LEVELS)))
  return { instructions: enabled && Boolean(content), thresholdChanged: changedThinking || changedAttainment }
}
