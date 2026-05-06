import { CheckSquare2, ListChecks, Users } from 'lucide-react'
import '../styles/assessment-pages.css'

const evaluationPanels = [
  {
    title: 'Pending evaluations',
    description: 'Keep assigned assessment runs, evaluator coverage, and due windows visible in one place.',
    icon: ListChecks,
  },
  {
    title: 'Faculty actions',
    description: 'Provide a focused area for assigning evaluators, opening attempts, and reviewing completion.',
    icon: Users,
  },
  {
    title: 'Outcome checks',
    description: 'Surface validation, missing scoring, and readiness before approval or release.',
    icon: CheckSquare2,
  },
]

export default function AssessmentEvaluationPage() {
  return (
    <section className="vx-content assessment-page">
      <div className="assessment-page-shell">
        <section className="assessment-page-hero">
          <span className="assessment-page-kicker">Assessment</span>
          <h1>Evaluation</h1>
          <p>Manage evaluation activity for assessment-specific workflows here. This page is separate from the current Skills evaluation page.</p>
        </section>

        <section className="assessment-page-grid" aria-label="Assessment evaluation overview">
          {evaluationPanels.map((item) => {
            const Icon = item.icon
            return (
              <article key={item.title} className="assessment-page-card">
                <span className="assessment-page-card-icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </article>
            )
          })}
        </section>
      </div>
    </section>
  )
}
