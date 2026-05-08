import { Activity, ChartColumnBig, ShieldCheck } from 'lucide-react'
import '../styles/assessment-pages.css'

const dashboardCards = [
  {
    title: 'Assessment performance',
    description: 'Review dedicated assessment KPIs, completion movement, and result distribution trends.',
    icon: ChartColumnBig,
  },
  {
    title: 'Operational health',
    description: 'Track overdue tasks, evaluator bottlenecks, and workflow interruptions for live assessments.',
    icon: Activity,
  },
  {
    title: 'Governance overview',
    description: 'Highlight approval coverage, audit readiness, and compliance checkpoints for assessment cycles.',
    icon: ShieldCheck,
  },
]

export default function AssessmentDashboardPage() {
  return (
    <section className="vx-content assessment-page">
      <div className="assessment-page-shell">
        <section className="assessment-page-hero">
          <span className="assessment-page-kicker">Assessment</span>
          <h1>Dashboard</h1>
          <p>Use this dashboard for assessment-only analytics and workflow status, separate from the existing summary dashboards.</p>
        </section>

        <section className="assessment-page-grid" aria-label="Assessment dashboard overview">
          {dashboardCards.map((item) => {
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
