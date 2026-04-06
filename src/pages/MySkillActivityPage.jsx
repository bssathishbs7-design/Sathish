import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChartColumn,
  CheckCircle2,
  ClipboardList,
  LayoutGrid,
  Play,
  RotateCcw,
} from 'lucide-react'
import '../styles/ospe-activity.css'
import '../styles/my-skills.css'

const statusFilters = ['All', 'Assigned', 'Live Activity', 'Completed']

const defaultActivities = [
  {
    title: 'Upper Limb Landmark Identification',
    type: 'Image',
    competency: 'AN1.5',
    assignedTo: 'First Year • SGT A',
    status: 'Assigned',
    action: 'Start Activity',
    tone: 'primary',
    attemptCount: '0 / 1',
    createdDate: '06/04/2026',
  },
  {
    title: 'Blood Group Determination Station',
    type: 'OSCE',
    competency: 'PY2.7',
    assignedTo: 'Second Year • SGT D',
    status: 'Assigned',
    action: 'Yet to Start',
    tone: 'secondary',
    attemptCount: '0 / 1',
    createdDate: '05/04/2026',
  },
  {
    title: 'Artificial Respiration Interpretation',
    type: 'Interpretation',
    competency: 'AN1.5',
    assignedTo: 'First Year • SGT C',
    status: 'Live Activity',
    action: 'Start Activity',
    tone: 'primary',
    attemptCount: '1 / 1',
    createdDate: '04/04/2026',
  },
  {
    title: 'WBC Count Checklist Station',
    type: 'OSPE',
    competency: 'AN1.2',
    assignedTo: 'Final Year • SGT J',
    status: 'Completed',
    action: 'View Submission',
    tone: 'secondary',
    attemptCount: '1 / 1',
    createdDate: '02/04/2026',
  },
]

function ActivityCard({ item, onStartActivity }) {
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
      <div className="my-skills-activity-foot">
        <div className="my-skills-activity-meta">
          <span className="my-skills-date-pill"><CalendarDays size={13} strokeWidth={2} /> {item.createdDate ?? 'DD-MM-YYYY'}</span>
        </div>
        <button
          type="button"
          className={`tool-btn ${isReadyAction ? 'green' : 'ghost'} my-skills-activity-cta ${!isReadyAction ? 'is-muted' : ''}`}
          onClick={() => isReadyAction && onStartActivity?.(item)}
          disabled={!isReadyAction}
        >
          {isReadyAction ? <Play size={13} strokeWidth={2.2} /> : null}
          {isReadyAction ? item.action ?? 'Start Activity' : item.action ?? 'Yet to Start'}
        </button>
      </div>
    </article>
  )
}

function InsightCard({ kicker, title, meta, actionLabel, onAction, tone = 'default', children }) {
  return (
    <article className={`my-skills-insight-card is-${tone}`}>
      <div className="my-skills-insight-head">
        <span className="ospe-kicker">{kicker}</span>
      </div>
      <div className="my-skills-insight-copy">
        <strong>{title}</strong>
        {meta ? <p>{meta}</p> : null}
      </div>
      {children}
      {actionLabel ? (
        <button type="button" className="tool-btn ghost my-skills-insight-action" onClick={onAction}>
          {actionLabel}
          <ArrowRight size={14} strokeWidth={2.2} />
        </button>
      ) : null}
    </article>
  )
}

export default function MySkillActivityPage({ assignedActivities = [], onStartActivity }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [query, setQuery] = useState('')

  const activityItems = useMemo(() => ([
    ...assignedActivities.map((item) => ({
          ...item,
          action: 'Start Activity',
          tone: 'primary',
          status: item.status ?? 'Assigned',
          competency: item.competency ?? item.activityData?.record?.competency ?? '',
    })),
    ...defaultActivities,
  ]), [assignedActivities])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return activityItems.filter((item) => {
      const matchesFilter = activeFilter === 'All' ? true : item.status === activeFilter
      const matchesQuery = normalizedQuery
        ? [item.title, item.type, item.status, item.assignedTo, item.competency]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery))
        : true
      return matchesFilter && matchesQuery
    })
  }, [activityItems, activeFilter, query])

  const kpiItems = [
    { label: 'Assigned', value: activityItems.filter((item) => item.status === 'Assigned').length, icon: ClipboardList, tone: 'is-assigned' },
    { label: 'Live Activity', value: activityItems.filter((item) => item.status === 'Live Activity').length, icon: Activity, tone: 'is-live', isLive: true },
    { label: 'Completed', value: activityItems.filter((item) => item.status === 'Completed').length, icon: CheckCircle2, tone: 'is-completed' },
    { label: 'Attempt', value: activityItems.reduce((total, item) => total + Number(String(item.attemptCount ?? '0').split('/')[0].trim() || 0), 0), icon: RotateCcw, tone: 'is-attempt' },
    { label: 'Overall Activity', value: activityItems.length, icon: LayoutGrid, tone: 'is-overall' },
    { label: 'Activity Results', value: activityItems.filter((item) => item.status === 'Completed').length, icon: ChartColumn, tone: 'is-results' },
  ]

  const liveActivity = activityItems.find((item) => item.status === 'Live Activity') ?? activityItems.find((item) => item.status === 'Assigned') ?? null
  const upcomingActivity = activityItems.find((item) => item.status === 'Assigned') ?? null
  const recentResult = activityItems.find((item) => item.status === 'Completed') ?? null
  const quickProgress = {
    completed: activityItems.filter((item) => item.status === 'Completed').length,
    overall: activityItems.length,
    attempts: kpiItems.find((item) => item.label === 'Attempt')?.value ?? 0,
    results: kpiItems.find((item) => item.label === 'Activity Results')?.value ?? 0,
  }

  return (
    <section className="vx-content ospe-page my-skills-page">
      <div className="ospe-shell">
        <div className="my-skills-hero ospe-header-card">
          <div className="my-skills-hero-copy">
            <span className="ospe-kicker">My Skills</span>
            <h1>My Skill Activity</h1>
            <p>Start the next essential activity, continue what is active, and review progress with less clutter.</p>
          </div>
          <div className="my-skills-kpi-grid">
            {kpiItems.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.label} className={`ospe-summary-card my-skills-kpi-card ${item.tone}`}>
                  <span className="my-skills-kpi-icon">
                    <Icon size={16} strokeWidth={2.2} />
                    {item.isLive ? <span className="my-skills-kpi-live-dot" aria-hidden="true" /> : null}
                  </span>
                  <div>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <div className="my-skills-dashboard-grid">
          <section className="ospe-section-card my-skills-section">
            <div className="my-skills-toolbar">
              <div className="my-skills-filter-row">
                {statusFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`my-skills-filter-chip ${activeFilter === filter ? 'is-active' : ''}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <label className="my-skills-search">
                <span className="my-skills-search-label">Search</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search activity"
                />
              </label>
            </div>
            <div className="my-skills-section-head">
              <div>
                <h3>Activity Board</h3>
                <p>Find what is ready first, then scan what is live or completed.</p>
              </div>
              <span className="ospe-topic-pill">{filteredItems.length} Results</span>
            </div>
            <div className="my-skills-activity-list">
              {filteredItems.map((item) => (
                <ActivityCard key={`${item.status}-${item.title}-${item.type}`} item={item} onStartActivity={onStartActivity} />
              ))}
            </div>
          </section>

          <aside className="my-skills-insight-rail">
            <InsightCard
              kicker="Live Now"
              title={liveActivity?.title ?? 'No live activity right now'}
              meta={liveActivity ? `${liveActivity.type} • ${liveActivity.createdDate}` : 'Assigned activities will appear here when they become active.'}
              actionLabel={liveActivity ? 'Open Activity' : null}
              onAction={() => liveActivity && onStartActivity?.(liveActivity)}
              tone="live"
            >
              {liveActivity ? (
                <div className="my-skills-insight-pills">
                  <span className="my-skills-attempt-pill">{liveActivity.attemptCount ?? '0 / 1'}</span>
                  <span className={`my-skills-activity-type is-${String(liveActivity.type).toLowerCase().replace(/\s+/g, '-')}`}>{liveActivity.type}</span>
                </div>
              ) : null}
            </InsightCard>

            <InsightCard
              kicker="Upcoming"
              title={upcomingActivity?.title ?? 'No scheduled activity'}
              meta={upcomingActivity ? `${upcomingActivity.assignedTo} • ${upcomingActivity.createdDate}` : 'New assignments will be highlighted here.'}
              tone="upcoming"
            />

            <InsightCard
              kicker="Recent Result"
              title={recentResult?.title ?? 'No published result yet'}
              meta={recentResult ? `${recentResult.type} • Result available` : 'Completed activity results will surface here.'}
              actionLabel={recentResult ? 'View Result' : null}
              onAction={() => recentResult && onStartActivity?.(recentResult)}
              tone="result"
            />

            <article className="my-skills-insight-card is-progress">
              <div className="my-skills-insight-head">
                <span className="ospe-kicker">Quick Progress</span>
              </div>
              <div className="my-skills-progress-copy">
                <strong>{quickProgress.completed} / {quickProgress.overall}</strong>
                <p>Activities completed across your current skill workflow.</p>
              </div>
              <div className="my-skills-progress-meter">
                <span style={{ width: `${quickProgress.overall ? (quickProgress.completed / quickProgress.overall) * 100 : 0}%` }} />
              </div>
              <div className="my-skills-progress-stats">
                <span>Attempts {quickProgress.attempts}</span>
                <span>Results {quickProgress.results}</span>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </section>
  )
}
