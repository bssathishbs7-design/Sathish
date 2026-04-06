import { ChartNoAxesCombined, CircleCheckBig, Gauge, Target } from 'lucide-react'
import '../styles/my-skills.css'

const competencyProgress = [
  { code: 'AN1.2', label: 'Bone and bone marrow basics', percent: 72 },
  { code: 'AN1.5', label: 'Upper limb applied anatomy', percent: 84 },
  { code: 'PY2.7', label: 'CBC and smear interpretation', percent: 61 },
]

export default function ProgressTrackingPage() {
  return (
    <section className="vx-content my-skills-page">
      <div className="my-skills-hero vx-card">
        <div>
          <span className="my-skills-kicker">My Skills</span>
          <h1>Progress Tracking</h1>
          <p>Monitor competency completion, certifiable skill progress, and recent performance trends across your learning journey.</p>
        </div>
        <div className="my-skills-hero-stats">
          <article className="my-skills-stat-card">
            <Target size={18} strokeWidth={2.2} />
            <div><strong>78%</strong><span>Completion</span></div>
          </article>
          <article className="my-skills-stat-card">
            <Gauge size={18} strokeWidth={2.2} />
            <div><strong>12</strong><span>Competencies</span></div>
          </article>
          <article className="my-skills-stat-card">
            <CircleCheckBig size={18} strokeWidth={2.2} />
            <div><strong>5</strong><span>Certifiable</span></div>
          </article>
        </div>
      </div>

      <div className="my-skills-section-grid my-skills-progress-grid">
        <section className="vx-card my-skills-section">
          <div className="my-skills-section-head">
            <h3>Competency Progress</h3>
            <span>Current Snapshot</span>
          </div>
          <div className="my-skills-progress-list">
            {competencyProgress.map((item) => (
              <article key={item.code} className="my-skills-progress-card">
                <div className="my-skills-progress-copy">
                  <strong>{item.code}</strong>
                  <p>{item.label}</p>
                </div>
                <div className="my-skills-progress-meter" aria-hidden="true">
                  <span style={{ width: `${item.percent}%` }} />
                </div>
                <small>{item.percent}% complete</small>
              </article>
            ))}
          </div>
        </section>

        <section className="vx-card my-skills-section">
          <div className="my-skills-section-head">
            <h3>Recent Performance</h3>
            <span>Latest Results</span>
          </div>
          <div className="my-skills-insight-grid">
            <article className="my-skills-insight-card">
              <ChartNoAxesCombined size={18} strokeWidth={2.2} />
              <strong>Average Threshold</strong>
              <p>Competent</p>
            </article>
            <article className="my-skills-insight-card">
              <CircleCheckBig size={18} strokeWidth={2.2} />
              <strong>Submitted This Week</strong>
              <p>4 activities</p>
            </article>
            <article className="my-skills-insight-card">
              <Target size={18} strokeWidth={2.2} />
              <strong>Next Focus Area</strong>
              <p>Interpretation and Scaffolding</p>
            </article>
          </div>
        </section>
      </div>
    </section>
  )
}
