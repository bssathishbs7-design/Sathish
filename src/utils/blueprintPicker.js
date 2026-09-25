import { allocateCategoryBreakdown } from './blueprintCategoryBreakdown.js'
import { getBlueprintQuestionCompetencyCodes, getBlueprintQuestionMarkRowLabel, normalizeBlueprintQuestionType, normalizeBlueprintThinkingLevel } from './blueprintQuestionProgress.js'

/**
 * @typedef {Object} BlueprintPickerRow
 * @property {string} id Stable requirement identity, saved with the planner.
 * @property {'mcq'|'saq'|'laq'} type
 * @property {string} competency Curriculum code; LAQs list their part competencies.
 * @property {string} category SAQ category, empty for other types.
 * @property {'lot'|'hot'|'split'} level
 * @property {number} count Required whole questions.
 * @property {number} marks Marks for one complete question.
 * @property {string} subject
 * @property {string[]} topics
 * @property {{id:string, part:number, marks:number, level:string, competency:string}[]} [parts] Ordered LAQ parts.
 */

/** Build stable selection requirements from the validated matrix, including explicit LAQ part ownership. */
export function buildBlueprintPickerRows({ competencies, cells, saqBreakdowns, cards, subject, topics, mcqMarks }) {
  const rows = []
  for (const competency of competencies) {
    for (const level of ['Lot', 'Hot']) {
      const count = cells[`${competency.key}:mcq${level}`]?.count || 0
      if (count) rows.push({ id: `${competency.key}:mcq${level}`, type: 'mcq', competency: competency.code, category: '', level: level.toLowerCase(), count, marks: mcqMarks })
      for (const entry of saqBreakdowns[`saq${level}`]?.[competency.key] || []) {
        rows.push({ id: `${competency.key}:saq${level}:${entry.category}:${entry.perQuestionMarks}`, type: 'saq', competency: competency.code, category: entry.category, level: level.toLowerCase(), count: entry.count, marks: entry.perQuestionMarks })
      }
    }
  }
  const assigned = new Map()
  for (const level of ['lot', 'hot']) {
    const units = cards.flatMap(card => card.splits.flatMap((part, index) => part.level === level
      ? [{ category: `${card.questionIndex}:${index}`, marks: Number(part.marks) }] : []))
    const allocation = allocateCategoryBreakdown({ units, cells: competencies.map(c => ({ key: c.key, ...(cells[`${c.key}:laq${level === 'lot' ? 'Lot' : 'Hot'}`] || {count: 0, marks: 0}) })) })
    if (!allocation) return []
    for (const c of competencies) for (const part of allocation[c.key] || []) assigned.set(part.category, c.code)
  }
  for (const card of cards) {
    const parts = card.splits.map((part, index) => ({ id: `${card.questionIndex}:${index}`, part: index + 1, marks: Number(part.marks), level: part.level, competency: assigned.get(`${card.questionIndex}:${index}`) }))
    if (parts.some(p => !p.competency)) return []
    rows.push({ id: `laq:${card.questionIndex}`, type: 'laq', competency: [...new Set(parts.map(p => p.competency))].join(', '), category: '', level: 'split', count: 1, marks: parts.reduce((n, p) => n + p.marks, 0), parts })
  }
  return rows.map(row => ({ ...row, subject, topics }))
}

const norm = value => String(value || '').trim().toLowerCase()
export function blueprintQuestionParts(question) {
  const flatten = sections => sections.flatMap(section => section.children?.length ? flatten(section.children) : [section])
  return flatten(question.descriptiveSections || [])
}

/** Exact bank matching: a whole LAQ must satisfy every required part. */
export function matchesBlueprintPickerRow(question, row) {
  if (!row || normalizeBlueprintQuestionType(question.type) !== row.type) return false
  if (row.subject && norm(question.subject) !== norm(row.subject)) return false
  if (row.topics?.length && !(question.topics || []).some(topic => row.topics.map(norm).includes(norm(topic)))) return false
  const matchesPart = (part, expected) => Number(part.marks) === expected.marks
    && normalizeBlueprintThinkingLevel(part.thinkingLevel || part.thinking || part.cognitionLevel) === expected.level
    && getBlueprintQuestionCompetencyCodes(part).includes(norm(expected.competency).replace(/\s/g, ''))
  if (row.type === 'laq') {
    const parts = blueprintQuestionParts(question)
    return parts.length === row.parts.length && row.parts.every((expected, index) => matchesPart({ ...question, ...parts[index] }, expected))
  }
  const parts = blueprintQuestionParts(question)
  const marks = parts.length ? parts.reduce((sum, part) => sum + Number(part.marks || 0), 0) : Number(question.marks)
  return matchesPart({ ...question, marks }, row)
    && (row.type !== 'saq' || getBlueprintQuestionMarkRowLabel(question) === `SAQs (${row.category})`)
}

/** Each unique question fills one requirement; LAQ parts never inflate the main-question count. */
export function getBlueprintPickerProgress(rows, questions) {
  const used = Object.fromEntries(rows.map(row => [row.id, []]))
  const seen = new Set()
  const unmatched = []
  for (const question of questions) {
    const key = String(question.originalQuestionId || question.id)
    const row = rows.find(row => used[row.id].length < row.count && matchesBlueprintPickerRow(question, row))
    if (question.status === 'Draft' || seen.has(key) || !row) { unmatched.push(question); continue }
    seen.add(key)
    used[row.id].push(question)
  }
  const target = rows.reduce((n, row) => n + row.count, 0)
  const matched = Object.values(used).reduce((n, items) => n + items.length, 0)
  return { used, target, matched, marks: rows.reduce((n, row) => n + used[row.id].length * row.marks, 0), totalMarks: rows.reduce((n, row) => n + row.count * row.marks, 0), unmatched, complete: target > 0 && matched === target && unmatched.length === 0 }
}

/** Accept only unique questions that fill an unfilled requirement; visible bank filters remain independent. */
export function acceptBlueprintQuestions(rows, current, candidates) {
  const accepted = []
  let count = getBlueprintPickerProgress(rows, current).matched
  const ids = new Set(current.map(q => String(q.originalQuestionId || q.id)))
  for (const question of candidates) {
    const id = String(question.originalQuestionId || question.id)
    if (ids.has(id)) continue
    const next = getBlueprintPickerProgress(rows, [...current, ...accepted, question])
    if (next.matched <= count) continue
    accepted.push(question)
    ids.add(id)
    count = next.matched
  }
  return accepted
}

/** Stable workflow order: MCQ, SAQ by category, then whole LAQs. */
export function orderBlueprintRequirements(rows) {
  const types = ['mcq', 'saq', 'laq']
  const categories = ['direct', 'reasoning', 'aetcom', 'application']
  const rank = value => { const index = categories.indexOf(norm(value)); return index < 0 ? categories.length : index }
  return [...rows].sort((a, b) => types.indexOf(a.type) - types.indexOf(b.type)
    || (a.type === 'saq' ? rank(a.category) - rank(b.category) : 0))
}

/** Browse by any competency on the whole question or its nested parts; exact allocation remains separate. */
export function matchesBlueprintBrowseCompetency(question, selected) {
  if (!selected.length) return true
  const collect = part => [...getBlueprintQuestionCompetencyCodes(part), ...(part.children || []).flatMap(collect)]
  const codes = new Set([...getBlueprintQuestionCompetencyCodes(question), ...(question.descriptiveSections || []).flatMap(collect)])
  return getBlueprintQuestionCompetencyCodes({ competencies: selected }).some(code => codes.has(code))
}
