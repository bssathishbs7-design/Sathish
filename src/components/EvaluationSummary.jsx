import './EvaluationSummary.css'

/** Compact faculty summary. Progress counts parent questions, while scores include every marked part.
 * @param {{progress:Object,mcqCount:number,descriptiveCount:number,marks:number,maxMarks:number,percentage:number,mcqMarks:number,descriptiveMarks:number,outcome:string,complete:boolean,finalised:boolean,responses:Object|null}} props
 */
export default function EvaluationSummary({ progress, mcqCount, descriptiveCount, marks, maxMarks, percentage, mcqMarks, descriptiveMarks, outcome, complete, finalised = false, responses }) {
  const groups = [
    { label: 'Questions', value: `${progress.total} questions`, detail: `${mcqCount} MCQ · ${descriptiveCount} descriptive` },
    { label: 'Evaluation', value: finalised ? 'Evaluation complete' : complete ? 'Ready to complete' : `${progress.evaluated}/${progress.total} evaluated · ${progress.total - progress.evaluated} pending`, progress: true },
    { label: finalised ? 'Final score' : 'Score so far', value: `${marks} / ${maxMarks} marks · ${percentage}%`, detail: `MCQ ${mcqMarks} · Descriptive ${descriptiveMarks}` },
    ...(finalised ? [{ label: 'Outcome', value: outcome }] : []),
  ]
  return <section className={`evaluation-summary ${finalised ? 'is-finalised' : 'is-in-progress'}`} aria-label="Student evaluation summary">
    <div className="evaluation-summary-grid">
      {groups.map(group => <div className="evaluation-summary-group" key={group.label}>
        <span className="evaluation-summary-label">{group.label}</span>
        <strong>{group.value}</strong>
        {group.progress ? <progress aria-label="Questions evaluated" value={progress.evaluated} max={progress.total || 1} /> : group.detail ? <small>{group.detail}</small> : null}
      </div>)}
    </div>
    {responses && <div className="evaluation-summary-responses"><strong>Student responses</strong><span>{responses.answered} answered · {responses.partial} partial · {responses.unanswered} unanswered{responses.unavailable > 0 ? ` · Awaiting submission: ${responses.unavailable}` : ''}</span></div>}
  </section>
}
