import { questionContentChanged } from '../utils/questionContent'
import { sameQid } from '../utils/qid'
import { questionDisplayId } from '../utils/questionLifecycle'
import './QuestionSnapshotNotice.css'
/** Bank edits never overwrite the paper's saved question snapshot. */
export default function QuestionSnapshotNotice({ question }) {
  if (!question.originalQuestionId || question.assessmentEdited) return null
  let rows
  try { rows = JSON.parse(localStorage.getItem('vx-question-bank-published-questions') || '[]') } catch { return null }
  const current = rows.find(row => row.id === question.originalQuestionId || sameQid(questionDisplayId(row), questionDisplayId(question)))
  return questionContentChanged(question, current) ? <span className="question-snapshot-notice" tabIndex={0} title="This paper keeps the question as it was when added. Remove and re-add it to use the edited question.">Edited in the Question Bank since it was added</span> : null
}
