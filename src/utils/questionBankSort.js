import { mbbsSubjectOrder } from '../config/mbbsCurriculumOrder.js'

export const curriculumFields = [
  ['years', 'Year'], ['subjects', 'Subject'], ['topics', 'Topic'], ['competencies', 'Competency'],
]
const depths = { years: 1, subjects: 2, topics: 3, competencies: 4, codes: 4 }
const normalise = (value) => String(value ?? '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '')
const subjects = mbbsSubjectOrder.map((subject, rank) => ({ ...subject, rank }))
const subjectByName = new Map(subjects.flatMap(subject => (
  [subject.code, ...subject.aliases].map(name => [normalise(name), subject])
)))

/** Extract curriculum codes, including legacy values such as "BC 14.1 Description". */
export const getSortCompetencyCode = (value) => (
  String(value ?? '').trim().match(/^(?:[a-z]+\.?\s*)?\d+(?:\s*[.:]\s*\d+)*/i)?.[0]
    .replace(/\s+/g, '').replace(/^([a-z]+)\./i, '$1').replace(/:/g, '.').toUpperCase() ?? ''
)

const codeParts = (value) => {
  const match = getSortCompetencyCode(value).match(/^([A-Z]*)(\d+)\.(\d+)$/)
  return match ? { prefix: match[1] === 'GM' ? 'IM' : match[1], topic: Number(match[2]), competency: Number(match[3]) } : null
}
const codeKey = (subject, code) => `${subject.code}:${code.topic}.${code.competency}`
const compareRanks = (a, b, depth = 4, direction = 1) => {
  for (let i = 0; i < depth; i++) {
    const firstMapped = Number.isFinite(a[i])
    const secondMapped = Number.isFinite(b[i])
    if (!firstMapped || !secondMapped) {
      if (firstMapped !== secondMapped) return Number(secondMapped) - Number(firstMapped)
      continue
    }
    const difference = a[i] - b[i]
    if (difference) return direction * difference
  }
  return 0
}

/**
 * Build once from the app's curriculum catalogue, not question arrival order.
 * @param {Array<{subject: string, topic: string, topicNumber: number, code: string}>} rows
 * @returns {{competencies: Map, topics: Map}}
 */
export function buildCurriculumSortIndex(rows) {
  const competencies = new Map()
  const topics = new Map()
  for (const row of rows) {
    const subject = subjectByName.get(normalise(row.subject))
    const code = codeParts(row.code)
    const topic = Number(row.topicNumber)
    if (!subject || !Number.isFinite(topic) || topic <= 0) continue
    const key = `${subject.code}:${normalise(row.topic)}`
    const ranks = [subject.phase, subject.rank, topic, code?.competency ?? null]
    if (!topics.has(key) || topic < topics.get(key)[2]) topics.set(key, ranks.slice(0, 3))
    if (code && (!code.prefix || code.prefix === subject.code)) competencies.set(codeKey(subject, code), ranks)
  }
  return { competencies, topics }
}

/**
 * Resolve a canonical curriculum position; the earliest mapped competency wins for multi-tag
 * questions in either direction. Missing metadata stays null, never alphabetical.
 * @param {{subject?: string, topics?: string[], competencies?: string[]}} question
 * @param {ReturnType<typeof buildCurriculumSortIndex>} index
 * @returns {{ranks: Array<number|null>}}
 */
export function getQuestionCurriculumSortRecord(question, index) {
  const declaredSubject = subjectByName.get(normalise(question.subject))
  const codes = (question.competencies ?? []).map(codeParts).filter(Boolean)
  const candidates = codes.flatMap(code => {
    const subject = declaredSubject ?? subjectByName.get(normalise(code.prefix))
    if (!subject || (code.prefix && code.prefix !== subject.code)) return []
    const ranks = index.competencies.get(codeKey(subject, code))
    return ranks ? [ranks] : []
  }).sort((a, b) => compareRanks(a, b))
  if (candidates.length) return { ranks: candidates[0] }
  if (!declaredSubject) return { ranks: [null, null, null, null] }
  const topicRanks = (question.topics ?? [])
    .map(topic => index.topics.get(`${declaredSubject.code}:${normalise(topic)}`))
    .filter(Boolean).sort((a, b) => compareRanks(a, b, 3))
  return { ranks: [declaredSubject.phase, declaredSubject.rank, topicRanks[0]?.[2] ?? null, null] }
}

/**
 * Group by phase, subject, topic number, then competency number to the selected level.
 * Remaining curriculum levels order questions within each group. Competency and Code share
 * the curriculum code sequence. Unmapped questions stay last in either direction; identical
 * curriculum positions retain their original order. Never mutates the input array.
 */
export function sortBankQuestions(questions, recordsByQuestion, sort) {
  const depth = depths[sort.field]
  if (!depth) return questions
  const direction = sort.direction === 'desc' ? -1 : 1
  return [...questions].sort((a, b) => {
    const first = recordsByQuestion.get(a)?.ranks ?? []
    const second = recordsByQuestion.get(b)?.ranks ?? []
    const firstMapped = first.length >= depth && first.slice(0, depth).every(Number.isFinite)
    const secondMapped = second.length >= depth && second.slice(0, depth).every(Number.isFinite)
    if (!firstMapped || !secondMapped) return Number(secondMapped) - Number(firstMapped)
    return compareRanks(first, second, 4, direction)
  })
}
