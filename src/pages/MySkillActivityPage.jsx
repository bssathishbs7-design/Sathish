import { useState } from 'react'
import { BookOpenCheck, CalendarDays, Clock3, FileCheck2, Play, Sparkles } from 'lucide-react'
import '../styles/ospe-activity.css'
import '../styles/my-skills.css'

const defaultActivitySections = [
  {
    title: 'Assigned',
    items: [
      { title: 'Upper Limb Landmark Identification', type: 'Image', competency: 'AN1.5', status: 'Ready to Start', action: 'Start', tone: 'primary' },
      { title: 'Blood Group Determination Station', type: 'OSCE', competency: 'PY2.7', status: 'Scheduled for Today', action: 'View', tone: 'secondary' },
    ],
  },
  {
    title: 'In Progress',
    items: [
      { title: 'Artificial Respiration Interpretation', type: 'Interpretation', competency: 'AN1.5', status: 'Draft Saved', action: 'Continue', tone: 'primary' },
    ],
  },
  {
    title: 'Completed',
    items: [
      { title: 'WBC Count Checklist Station', type: 'OSPE', competency: 'AN1.2', status: 'Submitted', action: 'View', tone: 'secondary' },
    ],
  },
]

function ActivityCard({ item, onStartActivity }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const attemptLabel = item.attemptCount
    ? item.attemptCount.includes('/')
      ? `Attempt : ${item.attemptCount.split('/')[0].trim()}`
      : `Attempt : ${item.attemptCount}`
    : 'Attempt : 1'
  const typeToneClass = `is-${String(item.type).toLowerCase().replace(/\s+/g, '-')}`
  const isReadyAction = item.tone === 'primary'

  return (
    <article className="my-skills-activity-card">
      <div className="my-skills-activity-card-head">
        <span className="my-skills-attempt-pill">{attemptLabel}</span>
        <span className={`my-skills-activity-type ${typeToneClass}`}>{item.type}</span>
      </div>
      <strong className="my-skills-activity-title">{item.title}</strong>
      <button
        type="button"
        className="my-skills-read-more"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
      >
        {isExpanded ? 'Show less' : 'Read more'}
      </button>
      {isExpanded ? (
        <div className="my-skills-activity-details">
          <p>Competency: {item.competency}</p>
          {item.assignedTo ? <p>Assigned to: {item.assignedTo}</p> : null}
        </div>
      ) : null}
      <div className="my-skills-activity-foot">
        <div className="my-skills-activity-meta">
          <span><CalendarDays size={14} strokeWidth={2} /> Date : {item.createdDate ?? 'DD-MM-YYYY'}</span>
        </div>
        <button
          type="button"
          className={`tool-btn ${isReadyAction ? 'green' : 'ghost'} my-skills-activity-cta ${!isReadyAction ? 'is-muted' : ''}`}
          onClick={() => isReadyAction && onStartActivity?.(item)}
          disabled={!isReadyAction}
        >
          {isReadyAction ? <Play size={14} strokeWidth={2.2} /> : null}
          {isReadyAction ? 'Start Activity' : 'Yet to Start'}
        </button>
      </div>
    </article>
  )
}

export default function MySkillActivityPage({ assignedActivities = [], onStartActivity }) {
  const activitySections = [
    {
      title: 'Assigned',
      items: [
        ...assignedActivities.map((item) => ({
          ...item,
          action: 'Start Activity',
          tone: 'primary',
          competency: item.assignedTo ?? 'Assigned activity',
        })),
        ...defaultActivitySections[0].items,
      ],
    },
    ...defaultActivitySections.slice(1),
  ]

  const assignedCount = activitySections[0].items.length

  return (
    <section className="vx-content ospe-page my-skills-page">
      <div className="ospe-shell">
      <div className="my-skills-hero ospe-header-card">
        <div>
          <span className="ospe-kicker">My Skills</span>
          <h1>My Skill Activity</h1>
          <p>Start the next essential activity, continue what is active, and review progress with less clutter.</p>
        </div>
        <div className="my-skills-hero-stats">
          <article className="ospe-summary-card my-skills-stat-card">
            <BookOpenCheck size={18} strokeWidth={2.2} />
            <div><strong>{assignedCount}</strong><span>Assigned</span></div>
          </article>
          <article className="ospe-summary-card my-skills-stat-card">
            <Clock3 size={18} strokeWidth={2.2} />
            <div><strong>2</strong><span>In Progress</span></div>
          </article>
          <article className="ospe-summary-card my-skills-stat-card">
            <FileCheck2 size={18} strokeWidth={2.2} />
            <div><strong>14</strong><span>Completed</span></div>
          </article>
        </div>
      </div>

      <div className="my-skills-section-grid">
        {activitySections.map((section) => (
          <section key={section.title} className="ospe-section-card my-skills-section">
            <div className="my-skills-section-head">
              <h3>{section.title}</h3>
              <span className="ospe-topic-pill">{section.items.length} Activities</span>
            </div>
            <div className="my-skills-activity-list">
              {section.items.map((item) => <ActivityCard key={`${section.title}-${item.title}`} item={item} onStartActivity={onStartActivity} />)}
            </div>
          </section>
        ))}
      </div>
      </div>
    </section>
  )
}
