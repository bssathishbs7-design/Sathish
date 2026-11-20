import { blueprintQuestionParts, matchesBlueprintPickerRow } from './blueprintPicker.js'
import { getBlueprintQuestionCompetencyCodes, getBlueprintQuestionMarkRowLabel, normalizeBlueprintQuestionType, normalizeBlueprintThinkingLevel } from './blueprintQuestionProgress.js'

const norm = value => String(value || '').trim().toLowerCase()
const level = value => value === 'hot' ? 'HoT' : value === 'lot' ? 'LoT' : 'Not specified'
/** Explain an unallocated preview question using the same dimensions as exact picker matching.
 * @returns {{label:string,reasons:string[]}} Specific reasons, or a filled-quota explanation.
 */
export function explainBlueprintQuestionMismatch(question, rows, progress) {
  if (question.status === 'Draft') return { label: 'Blueprint mismatch', reasons: ['This question is a draft. Complete it before it can count towards blueprint progress.'] }
  const allocated = Object.values(progress.used).flat()
  if (allocated.some(item => item.id !== question.id && String(item.originalQuestionId || item.id) === String(question.originalQuestionId || question.id))) {
    return { label: 'Blueprint mismatch', reasons: ['Another copy of this question is already counted. Each question can count only once.'] }
  }
  const matches = rows.filter(row => matchesBlueprintPickerRow(question, row))
  if (matches.length && matches.every(row => (progress.used[row.id]?.length || 0) >= row.count)) {
    return { label: 'Blueprint quota filled', reasons: matches.map(row => `${row.competency} · ${row.type.toUpperCase()} · ${level(row.level)}: ${row.count}/${row.count} questions already selected.`) }
  }
  const comparePart = (actual, expected, prefix = '') => {
    const reasons = []
    if (!getBlueprintQuestionCompetencyCodes(actual).includes(norm(expected.competency).replace(/\s/g, ''))) reasons.push(`${prefix}Required competency: ${expected.competency}. Question: ${getBlueprintQuestionCompetencyCodes(actual).join(', ') || 'Not specified'}.`)
    const actualLevel = normalizeBlueprintThinkingLevel(actual.thinkingLevel || actual.thinking || actual.cognitionLevel)
    if (actualLevel !== expected.level) reasons.push(`${prefix}Required level: ${level(expected.level)}. Question: ${level(actualLevel)}.`)
    if (Number(actual.marks) !== expected.marks) reasons.push(`${prefix}Required marks: ${expected.marks}. Question: ${actual.marks ?? 'Not specified'}.`)
    return reasons
  }
  const comparisons = rows.map(row => {
    const reasons = []
    if (normalizeBlueprintQuestionType(question.type) !== row.type) reasons.push(`Required type: ${row.type.toUpperCase()}. Question: ${question.type || 'Not specified'}.`)
    if (row.subject && norm(question.subject) !== norm(row.subject)) reasons.push(`Required subject: ${row.subject}. Question: ${question.subject || 'Not specified'}.`)
    if (row.topics?.length && !(question.topics || []).some(topic => row.topics.map(norm).includes(norm(topic)))) reasons.push(`Required topic: ${row.topics.join(', ')}. Question: ${(question.topics || []).join(', ') || 'Not specified'}.`)
    const parts = blueprintQuestionParts(question)
    if (row.type === 'laq') {
      if (parts.length !== row.parts.length) reasons.push(`Required LAQ parts: ${row.parts.length}. Question: ${parts.length}.`)
      row.parts.forEach((part, index) => { if (parts[index]) reasons.push(...comparePart({ ...question, ...parts[index] }, part, `Part ${index + 1}: `)) })
    } else {
      reasons.push(...comparePart({ ...question, marks: parts.length ? parts.reduce((sum, part) => sum + Number(part.marks || 0), 0) : question.marks }, row))
      if (row.type === 'saq' && getBlueprintQuestionMarkRowLabel(question) !== `SAQs (${row.category})`) reasons.push(`Required category: ${row.category}. Question: ${getBlueprintQuestionMarkRowLabel(question) || 'Not specified'}.`)
    }
    return reasons
  }).sort((a, b) => a.length - b.length)
  return { label: 'Blueprint mismatch', reasons: comparisons[0]?.length ? ['Compared with the closest blueprint requirement:', ...comparisons[0]] : ['No saved blueprint requirement currently allocates this question.'] }
}
