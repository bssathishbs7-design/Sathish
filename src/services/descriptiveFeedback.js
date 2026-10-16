import { descriptiveAnswerText as stripHtml } from './descriptiveGrading.js'
const cleanRevealAnswerText = value => stripHtml(value).replace(/^correct\s+answer\s*:\s*/i, '').trim()
const isPlaceholderAnswerGuidance = value => !cleanRevealAnswerText(value) || /^answer guidance will appear here\.?$/i.test(cleanRevealAnswerText(value))

/** Build the shared Practice and Assessment descriptive feedback sections. */
export const getDescriptiveFeedbackSections = ({
  answer = '',
  evaluation = {},
  guidance = '',
  marks = 0,
} = {}) => {
  const status = evaluation.status || 'Needs review'
  const earnedMarks = Number(evaluation.earnedMarks ?? 0)
  const maxMarks = Number(evaluation.maxMarks ?? marks ?? 0)
  const ratio = Number.isFinite(evaluation.ratio) ? evaluation.ratio : (maxMarks ? earnedMarks / maxMarks : 0)
  const hasAnswer = Boolean(stripHtml(answer))
  const cleanGuidance = cleanRevealAnswerText(guidance)
  const hasGuidance = !isPlaceholderAnswerGuidance(cleanGuidance)
  const roundedScore = `${earnedMarks}/${maxMarks || marks || 0}`

  const assessmentRationale = !hasAnswer
    ? 'No written response was submitted, so marks could not be awarded for this answer.'
    : status === 'Correct'
      ? 'The response covers the expected points closely enough for this practice evaluation.'
      : status === 'Wrong'
        ? 'The response does not yet show enough of the expected answer points for this question.'
        : 'The response shows partial alignment with the expected answer and needs more complete coverage.'

  const strengths = !hasAnswer
    ? 'No strengths could be identified because an answer was not written.'
    : ratio >= 0.72
      ? 'Your answer includes the main expected points and stays relevant to the question.'
      : ratio > 0
        ? 'Your answer includes some relevant ideas that can be developed further.'
        : 'Your answer attempts the question, but the key expected points are still missing.'

  const improvements = !hasAnswer
    ? 'Write a focused answer before submission so it can be evaluated against the expected points.'
    : ratio >= 0.72
      ? 'Add sharper sequencing, supporting details, and any missing keywords to make the answer complete.'
      : ratio > 0
        ? 'Expand the answer with the missing core points, clearer reasoning, and direct links to the question stem.'
        : 'Rebuild the answer around the core concepts asked in the question and avoid unrelated content.'

  return [
    {
      heading: 'Evaluation Report',
      body: roundedScore,
      status,
      summary: true,
    },
    {
      heading: 'Assessment Rationale',
      body: assessmentRationale,
    },
    {
      heading: 'Your Strengths',
      body: strengths,
    },
    {
      heading: 'Areas for Improvement',
      body: improvements,
    },
    {
      heading: 'Guidance for a Perfect Answer',
      body: hasGuidance
        ? cleanGuidance
        : 'A perfect answer should directly address every part of the question, include the key expected points, and present them in a clear clinical sequence.',
    },
  ]
}

