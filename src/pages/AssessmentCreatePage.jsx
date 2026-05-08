import { ClipboardList, FolderPlus, Sparkles } from 'lucide-react'
import '../styles/assessment-pages.css'

const createHighlights = [
  {
    title: 'Assessment blueprint',
    description: 'Define the structure, activity type, and scoring plan for new assessment workflows.',
    icon: FolderPlus,
  },
  {
    title: 'Authoring queue',
    description: 'Prepare a dedicated workspace for question banks, rubrics, and review-ready drafts.',
    icon: ClipboardList,
  },
  {
    title: 'Publishing readiness',
    description: 'Track what still needs approval before a newly created assessment can be released.',
    icon: Sparkles,
  },
]

export default function AssessmentCreatePage() {
  return (
    <section className="vx-content assessment-page">
      <div className="assessment-page-shell">
        <section className="assessment-page-hero">
          <span className="assessment-page-kicker">Assessment</span>
          <h1>Create</h1>
          <p>Build a new assessment workspace here. This page is independent from the existing Skills configuration flow.</p>
        </section>

        <section className="assessment-page-grid" aria-label="Assessment create overview">
          {createHighlights.map((item) => {
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
