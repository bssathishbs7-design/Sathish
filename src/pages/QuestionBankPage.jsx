import { BookCopy, FileStack, FolderKanban } from 'lucide-react'
import '../styles/assessment-pages.css'

const questionBankHighlights = [
  {
    title: 'Structured repository',
    description: 'Organize question sets by topic, difficulty, and assessment type in one dedicated workspace.',
    icon: FolderKanban,
  },
  {
    title: 'Reusable items',
    description: 'Prepare validated questions that can be reused across future assessments without rebuilding drafts.',
    icon: BookCopy,
  },
  {
    title: 'Review pipeline',
    description: 'Keep version tracking, curation, and approval-ready question batches visible for faculty teams.',
    icon: FileStack,
  },
]

export default function QuestionBankPage() {
  return (
    <section className="vx-content assessment-page">
      <div className="assessment-page-shell">
        <section className="assessment-page-hero">
          <span className="assessment-page-kicker">Question Bank</span>
          <h1>Question Bank</h1>
          <p>Manage standalone question repositories, organize reusable content, and prepare curated sets for upcoming assessments.</p>
        </section>

        <section className="assessment-page-grid" aria-label="Question bank overview">
          {questionBankHighlights.map((item) => {
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
