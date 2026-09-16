/** Question coverage, not marks: each question is counted once per completed attempt. */
export const PRACTICE_TAG_GROUPS = {
  cognitiveLevel: [['Remember', 'remember|recall'], ['Evaluate', 'evaluate'], ['Apply', 'apply|application'], ['Analyse', 'analyse|analyze|analysis'], ['Understand', 'understand|comprehension']],
  thinkingLevel: [['HoT - Higher order thinking', 'hot|hot higher order thinking|higher order thinking|higher order'], ['LoT - Lower order thinking', 'lot|lot lower order thinking|lower order thinking|lower order']],
  cognitiveFunction: [['Pattern Recognition', 'pattern recognition'], ['Attention & Cue Detection', 'attention & cue detection|attention and cue detection|attention|cue detection'], ['Working Memory', 'working memory'], ['Prioritization/Executive Function', 'prioritization/executive function|prioritisation/executive function|prioritization|prioritisation|executive function'], ['Judgement & Decision Making', 'judgement & decision making|judgment & decision making|judgement and decision making|judgment and decision making|decision making'], ['Metacognition (Reflection)', 'metacognition (reflection)|metacognition|reflection']],
  skillFocus: [
    ['Diagnosis', 'diagnosis|identification'], ['Investigation', 'investigation'], ['Treatment', 'treatment'],
    ['Management', 'management'], ['Prognosis', 'prognosis'], ['Prevention', 'prevention'],
    ['Knowledge', 'knowledge|concept explanation|structured explanation'], ['Data Interpretation', 'data interpretation'],
    ['Risk Assessment', 'risk assessment'], ['Ethics', 'ethics'],
    ['Communication', 'communication|professional communication'], ['Patient Safety', 'patient safety'],
    ['Regulations or Protocols', 'regulations or protocols|regulations|protocols'],
  ],
}
const fields = {
  cognitiveLevel: ['cognitiveLevel', 'bloomLevel', 'bloomsLevel', 'bloomsTaxonomy', 'taxonomyLevel'],
  thinkingLevel: ['thinkingLevel', 'thinking', 'cognitionLevel'],
  cognitiveFunction: ['cognitiveFunction'], skillFocus: ['skillFocus'],
}
const normalise = (value) => String(value ?? '').trim().toLowerCase().replace(/[\u2013\u2014-]/g, ' ').replace(/\s+/g, ' ')
const values = (value) => (Array.isArray(value) ? value : String(value ?? '').split(/[,;|]/)).map(normalise).filter(Boolean)

/** Prefer explicit parent tags, then collect tags from descriptive leaves without counting parts as questions. */
function questionTags(question, key) {
  const direct = fields[key].flatMap(field => values(question?.[field]))
  if (direct.length) return direct
  return ['descriptiveSections', 'subQuestions', 'children'].flatMap(field => (
    Array.isArray(question?.[field]) ? question[field].flatMap(part => questionTags(part, key)) : []
  ))
}

/** Restore omitted tag fields from the original question-bank records when available. */
export function enrichPracticeTagSession(session, sources = []) {
  const byId = new Map()
  for (const source of sources) for (const id of [source?.id, source?.originalQuestionId, source?.questionId]) {
    if (id != null && !byId.has(String(id))) byId.set(String(id), source)
  }
  return { ...session, questions: (session.questions ?? []).map(question => {
    const source = [question.originalQuestionId, question.id, question.questionId].map(id => byId.get(String(id))).find(Boolean)
    if (!source) return question
    return Object.fromEntries([...new Set([...Object.keys(source), ...Object.keys(question)])].map(key => {
      const current = question[key]
      const missing = current == null || current === '' || (Array.isArray(current) && !current.length)
      return [key, missing ? source[key] : current]
    }))
  }) }
}

/** Repair fully unclassified legacy dimensions only; preserve populated historical snapshots. */
export function resolvePracticeTagSnapshot(saved, session) {
  const recovered = getPracticeTagSnapshot(session)
  if (!saved) return recovered
  if (saved.total !== recovered.total) return saved
  return { ...saved, groups: Object.fromEntries(Object.keys(PRACTICE_TAG_GROUPS).map(key => {
    const previous = saved.groups?.[key]
    const hasTags = Object.values(previous?.counts ?? {}).some(count => count > 0)
    return [key, hasTags ? previous : recovered.groups[key]]
  })) }
}

/**
 * Snapshot explicit question tags without inferring classifications from marks or type.
 * @param {{questions?: object[], mcq?: number, saqs?: number, laqs?: number}} session
 * @returns {{total: number, groups: Object<string, {counts: Object<string, number>, unclassified: number}>}}
 */
export function getPracticeTagSnapshot(session = {}) {
  const questions = Array.isArray(session.questions) ? session.questions : []
  const total = questions.length || ['mcq', 'saqs', 'laqs'].reduce((sum, key) => sum + Math.max(0, Number(session[key]) || 0), 0)
  const groups = Object.fromEntries(Object.entries(PRACTICE_TAG_GROUPS).map(([key, definitions]) => {
    const counts = Object.fromEntries(definitions.map(([label]) => [label, 0]))
    let unclassified = total - questions.length
    for (const question of questions) {
      const tags = questionTags(question, key)
      const matches = new Set(definitions.filter(([label, aliases]) => tags.some(tag => [label, ...aliases.split('|')].some(alias => normalise(alias) === tag))).map(([label]) => label))
      if (key === 'cognitiveLevel' && tags.some(tag => ['create', 'creation'].includes(tag))) matches.add('Create')
      // Preserve explicitly tagged additional skill categories instead of silently dropping them.
      if (key === 'skillFocus') for (const tag of tags) {
        if (!definitions.some(([label, aliases]) => [label, ...aliases.split('|')].some(alias => normalise(alias) === tag)) && !['n/a', 'none', 'unknown', 'unclassified', 'not specified'].includes(tag)) matches.add(tag.charAt(0).toUpperCase() + tag.slice(1))
      }
      // Thinking is mutually exclusive; contradictory tags are unclassified.
      if (!matches.size || (key === 'thinkingLevel' && matches.size > 1)) unclassified += 1
      else for (const label of matches) counts[label] = (counts[label] || 0) + 1
    }
    return [key, { counts, unclassified }]
  }))
  return { total, groups }
}

/** Aggregate persisted snapshots; percentages use all questions, including unclassified ones. */
export function buildPracticeTagAnalytics(snapshots = []) {
  const total = snapshots.reduce((sum, snapshot) => sum + snapshot.total, 0)
  return Object.fromEntries(Object.entries(PRACTICE_TAG_GROUPS).map(([key, definitions]) => {
    const counts = Object.fromEntries(definitions.map(([label]) => [label, 0]))
    let unclassified = 0
    for (const snapshot of snapshots) {
      const group = snapshot.groups[key]
      unclassified += group?.unclassified ?? snapshot.total
      for (const [label, count] of Object.entries(group?.counts ?? {})) {
        const canonical = definitions.find(([name, aliases]) => [name, ...aliases.split('|')].some(alias => normalise(alias) === normalise(label)))?.[0] ?? label
        counts[canonical] = (counts[canonical] || 0) + count
      }
    }
    return [key, { total, unclassified, items: Object.entries(counts).map(([label, value]) => ({ label, value, percentage: total ? Math.round(value / total * 100) : 0 })) }]
  }))
}


/** Complete older five-category payloads at the display boundary without changing saved results. */
export function completePracticeTagAnalytics(analytics = {}) {
  return Object.fromEntries(Object.entries(PRACTICE_TAG_GROUPS).map(([key, definitions]) => {
    const group = analytics[key] ?? { total: 0, unclassified: 0, items: [] }
    const existing = new Map((group.items ?? []).map(item => [normalise(item.label), item]))
    const items = definitions.map(([label, aliases]) => {
      const candidate = [label, ...aliases.split('|')].map(normalise).find(alias => existing.has(alias))
      const item = candidate ? existing.get(candidate) : { value: 0, percentage: 0 }
      if (candidate) existing.delete(candidate)
      return { ...item, label }
    })
    return [key, { ...group, items: [...items, ...existing.values()] }]
  }))
}
