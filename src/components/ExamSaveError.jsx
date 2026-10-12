import './ExamSaveError.css'

/** Shows persistence failures only; successful background saves need no banner. */
export default function ExamSaveError({ error, onRetry }) {
  if (!error) return null
  return <div className="exam-save-error qb-sort-scope" role="alert"><p>{error}</p><button type="button" onClick={onRetry}>Retry saving</button></div>
}
