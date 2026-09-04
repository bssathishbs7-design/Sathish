const normalizeText = (value) => String(value ?? '').trim().toLowerCase()

export const normalizeBlueprintQuestionType = (type) => {
  const normalized = normalizeText(type)
  if (normalized === 'mcq' || normalized.includes('multiple choice')) return 'mcq'
  if (normalized.includes('laq') || normalized.includes('long answer')) return 'laq'
  if (
    normalized.includes('saq')
    || normalized.includes('short answer')
    || normalized === 'descriptive question'
  ) return 'saq'
  return ''
}

export const normalizeBlueprintThinkingLevel = (value) => {
  const normalized = normalizeText(value).replace(/[^a-z]/g, '')
  if (normalized === 'hot' || normalized.includes('higherorder')) return 'hot'
  if (normalized === 'lot' || normalized.includes('lowerorder')) return 'lot'
  return ''
}

const normalizeBlueprintQuestionCategory = (value) => {
  const normalized = normalizeText(value).replace(/[^a-z]/g, '')
  if (normalized === 'criticalthinking' || normalized === 'aetcom') return 'Aetcom'
  if (normalized === 'application') return 'Application'
  if (normalized === 'reasoning') return 'Reasoning'
  return 'Direct'
}

const getBlueprintQuestionCategory = (question = {}) => {
  if (question.questionCategory) return question.questionCategory

  const sections = Array.isArray(question.descriptiveSections) ? question.descriptiveSections : []
  const category = sections.find((section) => section?.questionCategory)?.questionCategory
    ?? sections.flatMap((section) => (
      Array.isArray(section?.children) ? section.children : []
    )).find((child) => child?.questionCategory)?.questionCategory

  return category || question.category
}

export const getBlueprintQuestionMarkRowLabel = (question = {}) => {
  const type = normalizeBlueprintQuestionType(question.type)
  if (type === 'mcq') return 'MCQs'
  if (type === 'laq') return 'LAQs'
  if (type === 'saq') return `SAQs (${normalizeBlueprintQuestionCategory(getBlueprintQuestionCategory(question))})`
  return ''
}

const normalizeBlueprintQuestionMarkRowLabel = (label) => {
  const normalized = normalizeText(label)
  if (normalized === 'mcqs') return 'MCQs'
  if (normalized === 'laqs') return 'LAQs'
  if (normalized.includes('saq')) {
    const categoryLabel = String(label ?? '').match(/\(([^)]+)\)/)?.[1] ?? label
    return `SAQs (${normalizeBlueprintQuestionCategory(categoryLabel)})`
  }
  return label
}

export const resolveBlueprintPreviewQuestionMarks = ({
  question,
  questionTypeDraft = {},
  fallbackMarks = 0,
  isBlueprintEnabled = false,
  isPlannerSaved = false,
} = {}) => {
  const normalizedFallback = Math.max(0, Number(fallbackMarks) || 0)
  if (!isBlueprintEnabled || !isPlannerSaved) return normalizedFallback

  const rowLabel = getBlueprintQuestionMarkRowLabel(question)
  const blueprintRow = questionTypeDraft[rowLabel]
    ?? Object.entries(questionTypeDraft).find(([label]) => (
      normalizeBlueprintQuestionMarkRowLabel(label) === rowLabel
    ))?.[1]
  const blueprintMarks = Number(blueprintRow?.perQuestionMarks) || 0
  return blueprintMarks > 0 ? blueprintMarks : normalizedFallback
}

export const getBlueprintQuestionCompetencyCodes = (question = {}) => {
  const values = [
    ...(Array.isArray(question.competencies) ? question.competencies : []),
    question.competency,
    question.competencyCode,
  ].filter(Boolean)

  return Array.from(new Set(values.map((value) => {
    const label = typeof value === 'object'
      ? value.code ?? value.value ?? value.label ?? ''
      : value
    const match = String(label).match(/[A-Za-z]{1,5}\s*\d+(?:\.\d+)+/)
    return normalizeText(match?.[0] ?? label).replace(/\s+/g, '')
  }).filter(Boolean)))
}

export const createBlueprintQuestionRequirements = ({
  competencyCodes = [],
  columnQuestionCounts = {},
  cellQuestionCounts = {},
  targetQuestionCount,
} = {}) => ({
  competencyCodes: Array.from(new Set(
    competencyCodes.map((value) => normalizeText(value).replace(/\s+/g, '')).filter(Boolean),
  )),
  columnQuestionCounts: Object.fromEntries(
    Object.entries(columnQuestionCounts).map(([key, value]) => [key, Math.max(0, Number(value) || 0)]),
  ),
  cellQuestionCounts: Object.fromEntries(
    Object.entries(cellQuestionCounts).map(([key, value]) => [
      normalizeText(key).replace(/\s+/g, ''),
      Math.max(0, Number(value) || 0),
    ]),
  ),
  targetQuestionCount: Number.isFinite(Number(targetQuestionCount))
    ? Math.max(0, Number(targetQuestionCount))
    : null,
})

export const getBlueprintQuestionMatch = (question, requirements = {}) => {
  const type = normalizeBlueprintQuestionType(question?.type)
  const thinkingLevel = normalizeBlueprintThinkingLevel(
    question?.thinkingLevel ?? question?.thinking ?? question?.cognitionLevel,
  )
  const columnKey = type && thinkingLevel ? `${type}${thinkingLevel[0].toUpperCase()}${thinkingLevel.slice(1)}` : ''
  const requiredCount = Number(requirements.columnQuestionCounts?.[columnKey]) || 0
  const allowedCompetencies = requirements.competencyCodes ?? []
  const questionCompetencies = getBlueprintQuestionCompetencyCodes(question)
  const competencyCode = questionCompetencies.find((code) => allowedCompetencies.includes(code)) ?? ''
  const cellKey = competencyCode && columnKey ? `${competencyCode}:${normalizeText(columnKey)}` : ''

  return {
    columnKey,
    competencyCode,
    cellKey,
    isRelevant: Boolean(columnKey && requiredCount > 0 && competencyCode),
  }
}

const allocateBlueprintQuestions = (questions = [], requirements = {}) => {
  const columnTarget = Object.values(requirements.columnQuestionCounts ?? {})
    .reduce((total, value) => total + (Number(value) || 0), 0)
  const target = requirements.targetQuestionCount === null || requirements.targetQuestionCount === undefined
    ? columnTarget
    : Number(requirements.targetQuestionCount)
  const usedByColumn = {}
  const usedByCell = {}
  const relevance = []
  let matched = 0

  questions.forEach((question) => {
    const match = getBlueprintQuestionMatch(question, requirements)
    if (!match.isRelevant) {
      relevance.push(false)
      return
    }
    const current = usedByColumn[match.columnKey] || 0
    const limit = Number(requirements.columnQuestionCounts?.[match.columnKey]) || 0
    if (current >= limit || matched >= target) {
      relevance.push(false)
      return
    }
    const cellLimit = Number(requirements.cellQuestionCounts?.[match.cellKey]) || 0
    const currentCell = usedByCell[match.cellKey] || 0
    if (Object.keys(requirements.cellQuestionCounts ?? {}).length && (cellLimit <= 0 || currentCell >= cellLimit)) {
      relevance.push(false)
      return
    }
    usedByColumn[match.columnKey] = current + 1
    usedByCell[match.cellKey] = currentCell + 1
    matched += 1
    relevance.push(true)
  })

  return {
    matched,
    target,
    complete: target > 0 && matched === target,
    usedByColumn,
    usedByCell,
    relevance,
  }
}

export const getBlueprintQuestionRelevanceList = (questions = [], requirements = {}) => (
  allocateBlueprintQuestions(questions, requirements).relevance
)

export const summarizeBlueprintQuestionProgress = (questions = [], requirements = {}) => {
  const { relevance: _relevance, ...summary } = allocateBlueprintQuestions(questions, requirements)
  return summary
}
