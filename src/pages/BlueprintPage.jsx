import { ClipboardList, FileSpreadsheet, Layers3 } from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
import '../styles/assessment-pages.css'

const blueprintPanels = [
  {
    title: 'Blueprint setup',
    description: 'Create assessment blueprints with course, year, topic, difficulty, and marks distribution.',
    icon: Layers3,
  },
  {
    title: 'Question mapping',
    description: 'Map question bank items to blueprint rows before moving into assessment creation.',
    icon: ClipboardList,
  },
  {
    title: 'Coverage review',
    description: 'Check topic balance, question count, and marks coverage before publishing.',
    icon: FileSpreadsheet,
  },
]

export default function BlueprintPage() {
  return (
    <section className="vx-content assessment-page assessment-evaluation-page">
      <div className="assessment-page-shell assessment-evaluation-page-shell">
        <PageNavigationHeader items={['My Pages', 'Assessment Suite', 'Blueprint']} />

        <section className="assessment-page-hero">
          <span className="assessment-page-kicker">Assessment Suite</span>
          <h1>Blueprint</h1>
          <p>Plan assessment structure, coverage, and question distribution before creating the final assessment.</p>
        </section>

        <section className="assessment-page-grid" aria-label="Blueprint overview">
          {blueprintPanels.map((item) => {
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
