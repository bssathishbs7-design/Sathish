const text = value => String(value || '').replace(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi, ' image:$1 ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/\s+/g,' ').trim()
const canonical = value => typeof value === 'string' ? text(value) : Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().filter(key => !['id','createdAt','updatedAt','version','currentVersion','versionHistory'].includes(key)).map(key => [key,canonical(value[key])])) : value
/** Compare educational content only, preserving image sources and correct-answer associations. */
export function questionContentKey(question) {
  const options = question.options || []
  return JSON.stringify(canonical({ questionText: question.questionText, options, correctAnswers: (question.correctOptionIds || []).map(id => options.find(option => option.id === id)?.label || options.find(option => option.id === id)?.text || id), answerKey: question.answerKey,
    trueFalseAnswer: question.trueFalseAnswer, fillBlankAnswers: question.fillBlankAnswers, marks: question.marks, images: question.images, parts: question.descriptiveSections, guide: question.descriptiveGuide }))
}
export const questionContentChanged = (snapshot, current) => Boolean(snapshot && current && questionContentKey(snapshot) !== questionContentKey(current))
