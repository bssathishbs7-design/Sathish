import { isRichAnswer } from './richAnswers.js'

const stripHtml = (value = '') => String(isRichAnswer(value) ? value.html : value ?? '')
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<\/(p|div|span|li|h[1-6])>/gi, ' ')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim()
const normalizeAnswerValue = value => stripHtml(value).toLowerCase().replace(/[^a-z0-9]+/g, '')

const REVIEW_STOP_WORDS = new Set([
  'about',
  'after',
  'answer',
  'because',
  'between',
  'clinical',
  'correct',
  'describe',
  'explain',
  'features',
  'include',
  'patient',
  'question',
  'relevant',
  'should',
  'their',
  'there',
  'these',
  'those',
  'undergoing',
  'using',
  'with',
  'within',
])

const getReviewTerms = (value = '') => {
  const words = stripHtml(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3 && !REVIEW_STOP_WORDS.has(word))

  return [...new Set(words)].slice(0, 18)
}

/** Shared keyword-coverage grader from Practice. Strict assessment mode never awards
 * marks for missing guidance, unsupported images or invalid maximum marks.
 * @param {string|{format:string,html:string}} answer Student response.
 * @param {string} modelAnswer Expected answer for this answerable question part.
 * @param {number} marks Maximum marks.
 * @param {{strict?:boolean}} options Preserve existing practice fallbacks by default.
 * @returns {{status:string,earnedMarks:number|null,maxMarks:number,ratio:number|null,reviewRequired?:boolean,reason?:string}}
 */
export const evaluateDescriptiveAnswer = (answer = '', modelAnswer = '', marks = 0, { strict = false } = {}) => {
  const maxMarks = Number(marks) || 0
  const answerText = stripHtml(answer)
  const review = reason => ({ status: 'Needs review', earnedMarks: null, maxMarks, ratio: null, reviewRequired: true, reason })
  if (strict && (!Number.isFinite(Number(marks)) || maxMarks <= 0)) return review('Set valid maximum marks.')
  if (strict && /<img\b/i.test(isRichAnswer(answer) ? answer.html : String(answer))) return review('Image responses require faculty review.')
  if (!answerText) {
    return { status: 'Wrong', earnedMarks: 0, maxMarks, ratio: 0 }
  }

  const modelText = stripHtml(modelAnswer)
  if (!modelText || /^answer guidance will appear here\.?$/i.test(modelText)) {
    if (strict) return review('Add a model answer or evaluate manually.')
    return { status: 'Correct', earnedMarks: maxMarks, maxMarks, ratio: 1 }
  }

  const modelTerms = getReviewTerms(modelText)
  if (!modelTerms.length) {
    if (strict) return review('Model answer needs faculty review.')
    return { status: 'Needs review', earnedMarks: Math.max(1, Math.round(maxMarks * 0.5)), maxMarks, ratio: 0.5 }
  }

  const normalizedAnswer = normalizeAnswerValue(answerText)
  const matchedTerms = modelTerms.filter((term) => normalizedAnswer.includes(normalizeAnswerValue(term)))
  const ratio = matchedTerms.length / modelTerms.length
  const earnedMarks = Math.min(maxMarks, Math.max(0, Math.round(maxMarks * ratio)))
  const status = ratio >= 0.72 ? 'Correct' : ratio > 0 ? 'Needs review' : 'Wrong'

  return { status, earnedMarks, maxMarks, ratio }
}


export { stripHtml as descriptiveAnswerText }
