import { ClipboardList, FileSearch, ListChecks } from 'lucide-react'
import '../styles/assessment-pages.css'

const nonCreateHighlights = [
  {
    title: 'Question review',
    description: 'View and organize question bank items that are not part of the create workflow.',
    icon: FileSearch,
  },
  {
    title: 'Mapped collections',
    description: 'Track existing questions by subject, topic, competency, difficulty, and status.',
    icon: ClipboardList,
  },
  {
    title: 'Readiness status',
    description: 'Use this area for non-authoring question bank tasks, checks, and references.',
    icon: ListChecks,
  },
]

export default function QuestionBankNonCreatePage() {
  return (
    <section className="vx-content assessment-page">
      <div className="assessment-page-shell">
        <section className="assessment-page-hero">
          <span className="assessment-page-kicker">Question Bank</span>
          <h1>Overall Question</h1>
          <p>Manage question bank work that does not need the question creation builder.</p>
        </section>

        <section className="assessment-page-grid" aria-label="Question bank Overall Question overview">
          {nonCreateHighlights.map((item) => {
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
