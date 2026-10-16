/** Capabilities backed by current execution paths. Enable only after connecting and testing an executor. */
export const ASSESSMENT_AUTOMATION_CAPABILITIES = Object.freeze({
  mcqEvaluation: true,
  descriptiveEvaluation: true,
  resultPublishing: true,
})

/** Resolve effective settings without overwriting saved preferences when response modes change.
 * @param {Object} setup Persisted settings; evaluation uses Yes/No, publishing uses On/Off.
 * @param {{hasMcq?:boolean,hasDescriptive?:boolean}} types Applicable question types.
 * @param {{mcqEvaluation:boolean,descriptiveEvaluation:boolean,resultPublishing:boolean}} capabilities Connected executors.
 * @returns {{rows:Array,canAutoPublishCombined:boolean}} Publishing eligibility only. Execution must also wait for every applicable section to finish evaluation.
 */
export function getAssessmentAutomation(setup, types, capabilities = ASSESSMENT_AUTOMATION_CAPABILITIES) {
  const rows = [['mcq', 'MCQ', types.hasMcq], ['descriptive', 'Descriptive', types.hasDescriptive]]
    .filter(([, , included]) => included).map(([key, label]) => {
      const readOnly = setup[key + 'DisplayType'] === 'Read-Only'
      const enabled = setup.examDeliveryMode !== 'Offline' && !readOnly
      const evaluationAvailable = capabilities[key + 'Evaluation'] === true
      const publishingAvailable = capabilities.resultPublishing === true
      const evaluation = enabled && evaluationAvailable && (key === 'mcq' || setup[key + 'AutoEvaluation'] === 'Yes')
      const publish = evaluation && publishingAvailable && ['Yes', 'On'].includes(setup[key + 'AutoPublish'])
      return { key, label, readOnly, enabled, evaluationAvailable, publishingAvailable, evaluation, publish }
    })
  return { rows, canAutoPublishCombined: rows.length > 0 && rows.every(row => row.publish) }
}

/** Resolve saved configuration independently of executor availability. This never executes grading or incurs cost.
 * @param {Object} setup Persisted settings; descriptive Yes means AI, No means faculty evaluation.
 * @param {{hasMcq?:boolean,hasDescriptive?:boolean}} types Applicable question types.
 */
export function getAssessmentAutomationConfiguration(setup, types) {
  return getAssessmentAutomation(setup, types, { mcqEvaluation: true, descriptiveEvaluation: true, resultPublishing: true })
}

/** Manual descriptive evaluation resets publishing. Hybrid uses one choice, persisted atomically
 * in the existing two publishing fields. Legacy mixed choices resolve to Off.
 * @param {Object} setup Persisted assessment configuration.
 * @param {string} field Changed field; hybridAutoPublish is a command, not a stored field.
 * @param {string} value Selected value.
 * @param {{hasMcq?:boolean,hasDescriptive?:boolean}} types Active question types.
 * Configuration is not execution authorisation: executors must still check capability and completion.
 */
export function updateAssessmentAutomation(setup, field, value, types = {}) {
  const next = field === 'hybridAutoPublish' ? { ...setup } : { ...setup, [field]: value }
  const hybrid = types.hasMcq && types.hasDescriptive
  if (field === 'hybridAutoPublish' && hybrid) {
    const eligible = getAssessmentAutomationConfiguration(next, types).rows.every(row => row.evaluation)
    next.mcqAutoPublish = next.descriptiveAutoPublish = eligible && value === 'On' ? 'On' : 'Off'
  }
  for (const key of ['mcq', 'descriptive']) {
    if (field === key + 'AutoEvaluation') {
      if (key === 'mcq') next[field] = 'Yes'
      if (next[field] === 'No') next[key + 'AutoPublish'] = 'Off'
    }
    if (field === key + 'AutoPublish') {
      const row = getAssessmentAutomationConfiguration(next, { hasMcq: key === 'mcq', hasDescriptive: key === 'descriptive' }).rows[0]
      if (!row.evaluation || !row.publishingAvailable) next[field] = 'Off'
    }
  }
  if (hybrid && !getAssessmentAutomationConfiguration(next, types).rows.every(row => row.evaluation)) {
    next.mcqAutoPublish = next.descriptiveAutoPublish = 'Off'
  }
  return next
}

/** Plain-language outcome derived from the same effective policy as the controls. */
export function describeAssessmentAutomation(policy) {
  if (!policy.rows.length) return ''
  const evaluation = policy.rows.map(row => row.readOnly
    ? `${row.label} questions are read-only and require manual evaluation.`
    : `${row.label} answers are evaluated ${row.evaluation ? 'automatically' : 'manually'}.`).join(' ')
  const combined = policy.rows.length > 1
  const publishing = policy.canAutoPublishCombined
    ? `The ${combined ? 'combined result publishes' : 'result publishes'} automatically after ${combined ? 'both sections are' : 'evaluation is'} complete.`
    : `Publish the ${combined ? 'combined ' : ''}result manually after ${combined ? 'both sections are evaluated' : 'evaluation'}.`
  return `${evaluation} ${publishing}`
}
