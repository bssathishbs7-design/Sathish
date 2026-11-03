/**
 * Demo-only wording service. Replace this function with a server API call for AI refinement.
 * No text leaves the browser and no clinical details are inferred.
 * @param {{text: string, signal?: AbortSignal}} request
 * @returns {Promise<{source: 'demo', suggestions: Array<{id: string, text: string}>}>}
 */
export async function getActivitySuggestions({ text, signal }) {
  signal?.throwIfAborted()
  const clean = text.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '')
  if (!clean) return { source: 'demo', suggestions: [] }
  const expanded = clean.replace(/\bbp\b/gi, 'blood pressure').replace(/\bpt\b/gi, 'patient')
  const sentence = expanded.charAt(0).toUpperCase() + expanded.slice(1)
  const examples = /^(?:check (?:patient(?:'s)? )?)?blood pressure$/i.test(expanded)
    ? ['Measure the patient’s blood pressure.', 'Perform a blood pressure measurement.', 'Assess the patient’s blood pressure.']
    : [`${sentence}.`, sentence, sentence]
  signal?.throwIfAborted()
  return { source: 'demo', suggestions: examples.map((value, index) => ({ id: `suggestion-${index}`, text: value })) }
}

/**
 * Separate demo enhancement endpoint; only invoked by the explicit Refine action.
 * Preserves clinical facts; the local fallback fixes spacing, common shorthand and phrasing.
 * Replace with a backend enhancement API for arbitrary contextual rewriting.
 * @param {{text: string, signal?: AbortSignal}} request
 * @returns {Promise<{source: 'demo', text: string, changed: boolean}>}
 */
export async function refineActivityContent({ text, signal }) {
  signal?.throwIfAborted()
  const clean = text.trim().replace(/\s+/g, ' ')
  if (!clean) return { source: 'demo', text: '', changed: false }
  let enhanced = clean.replace(/\bbp\b/gi, 'blood pressure').replace(/\bpt\b/gi, 'patient')
  if (/^check (?:patient(?:'s)? )?blood pressure\b/i.test(enhanced)) {
    enhanced = enhanced.replace(/^check (?:patient(?:'s)? )?blood pressure\b/i, 'Measure the patient’s blood pressure')
      .replace(/\busing (?:the )?correct method\b/gi, 'using the appropriate measurement technique')
  }
  enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1)
  if (!/[.!?]$/.test(enhanced)) enhanced += '.'
  signal?.throwIfAborted()
  return { source: 'demo', text: enhanced, changed: enhanced !== text }
}
