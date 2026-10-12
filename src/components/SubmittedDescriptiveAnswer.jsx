import './SubmittedDescriptiveAnswer.css'
import { answerHtml, hasAnswerContent } from '../services/richAnswers'
import { sanitizeRichHtml } from '../utils/sanitizeHtml'

/** Displays sanitised submitted rich answers and escaped legacy text; never exposes drafts. */
export default function SubmittedDescriptiveAnswer({ answer, submitted, label = 'Student response' }) {
  return <section className="assessment-student-written-answer qb-sort-scope" aria-label={label}><strong>{label}</strong>{submitted && hasAnswerContent(answer) ? <div className="assessment-student-rich-answer" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(answerHtml(answer)) }} /> : <p>{submitted ? 'No answer submitted.' : 'Response not submitted yet.'}</p>}</section>
}
