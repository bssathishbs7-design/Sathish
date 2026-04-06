import { useMemo, useState } from 'react'
import {
  Activity,
  CalendarDays,
  ChartColumn,
  CheckCircle2,
  ClipboardList,
  LayoutGrid,
  Play,
  RotateCcw,
  Search,
} from 'lucide-react'
import '../styles/ospe-activity.css'
import '../styles/my-skills.css'

const statusFilters = ['All', 'Assigned', 'Live Activity', 'Completed']

const defaultActivities = [
  {
    title: 'Upper Limb Landmark Identification',
    type: 'Image',
    status: 'Assigned',
    action: 'Start Activity',
    tone: 'primary',
    attemptCount: '0 / 1',
    createdDate: '06/04/2026',
  },
  {
    title: 'Blood Group Determination Station',
    type: 'OSCE',
    status: 'Assigned',
    action: 'Yet to Start',
    tone: 'secondary',
    attemptCount: '0 / 1',
    createdDate: '05/04/2026',
  },
  {
    title: 'Artificial Respiration Interpretation',
    type: 'Interpretation',
    status: 'Live Activity',
    action: 'Start Activity',
    tone: 'primary',
    attemptCount: '1 / 1',
    createdDate: '04/04/2026',
  },
  {
    title: 'WBC Count Checklist Station',
    type: 'OSPE',
    status: 'Completed',
    action: 'View Submission',
    tone: 'secondary',
    attemptCount: '1 / 1',
    createdDate: '02/04/2026',
  },
]

const metricToFilter = {
  Assigned: 'Assigned',
  'Live Activity': 'Live Activity',
  Completed: 'Completed',
  'Activity Results': 'Completed',
}

function ActivityCard({ item, onStartActivity }) {
  const attemptValue = item.attemptCount?.split('/')?.[0]?.trim() ?? '0'
  const typeToneClass = `is-${String(item.type).toLowerCase().replace(/\s+/g, '-')}`
  const isReadyAction = item.tone === 'primary'

  return (
    <article className="my-skills-activity-card">
      <div className="my-skills-activity-card-head">
        <span className="my-skills-attempt-pill">Attempt {attemptValue}</span>
        <span className={`my-skills-activity-type ${typeToneClass}`}>{item.type}</span>
      </div>

      <strong className="my-skills-activity-title">{item.title}</strong>

      <div className="my-skills-activity-foot">
        <span className="my-skills-date-pill">
          <CalendarDays size={12} strokeWidth={2} />
          {item.createdDate ?? 'DD-MM-YYYY'}
        </span>

        <button
          type="button"
          className={`tool-btn ${isReadyAction ? 'green' : 'ghost'} my-skills-activity-cta ${!isReadyAction ? 'is-muted' : ''}`}
          onClick={() => isReadyAction && onStartActivity?.(item)}
          disabled={!isReadyAction}
        >
          {isReadyAction ? <Play size={12} strokeWidth={2.2} /> : null}
          {isReadyAction ? item.action ?? 'Start Activity' : item.action ?? 'Yet to Start'}
        </button>
      </div>
    </article>
  )
}

export default function MySkillActivityPage({ assignedActivities = [], onStartActivity }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeMetric, setActiveMetric] = useState('Overall Activity')
  const [query, setQuery] = useState('')

  const activityItems = useMemo(() => ([
    ...assignedActivities.map((item) => ({
      ...item,
      action: 'Start Activity',
      tone: 'primary',
      status: item.status ?? 'Assigned',
    })),
    ...defaultActivities,
  ]), [assignedActivities])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return activityItems.filter((item) => {
      const matchesFilter = activeFilter === 'All' ? true : item.status === activeFilter
      const matchesQuery = normalizedQuery
        ? [item.title, item.type, item.status].some((value) => String(value).toLowerCase().includes(normalizedQuery))
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

  const liveActivity = activityItems.find((item) => item.status === 'Live Activity') ?? null

  const handleMetricClick = (label) => {
    setActiveMetric(label)
    setActiveFilter(metricToFilter[label] ?? 'All')
  }

  const handleFilterClick = (filter) => {
    setActiveFilter(filter)
    setActiveMetric(filter === 'All' ? 'Overall Activity' : filter)
  }

  return (
    <section className="vx-content ospe-page my-skills-page">
      <div className="ospe-shell my-skills-shell">
        <section className="my-skills-overview">
          <div className="my-skills-overview-main">
            <span className="ospe-kicker">My Skills</span>
            <div className="my-skills-overview-copy">
              <h1>My Skill Activity</h1>
              <p>Track what is active, start what is ready, and review assigned work in one clean flow.</p>
            </div>
            <div className="my-skills-overview-inline">
              <span><strong>{activityItems.length}</strong> Overall</span>
              <span><strong>{kpiItems[1].value}</strong> Live</span>
              <span><strong>{kpiItems[5].value}</strong> Results</span>
            </div>
          </div>

          <div className="my-skills-live-card">
            <div className="my-skills-live-card-top">
              <span className="my-skills-live-indicator">
                <span className="my-skills-live-indicator-dot" aria-hidden="true" />
                Live activity
              </span>
              <span className="my-skills-live-card-date">{liveActivity?.createdDate ?? 'No date'}</span>
            </div>
            <strong>{liveActivity?.title ?? 'No live activity right now'}</strong>
            <p>{liveActivity ? `${liveActivity.type} is ready for the next student attempt.` : 'New active assignments will appear here when they are available.'}</p>
            {liveActivity ? (
              <button type="button" className="tool-btn green my-skills-live-card-cta" onClick={() => onStartActivity?.(liveActivity)}>
                <Play size={13} strokeWidth={2.2} />
                Start Activity
              </button>
            ) : null}
          </div>
        </section>

        <div className="my-skills-metrics-grid" role="list" aria-label="Activity metrics">
          {kpiItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                type="button"
                className={`my-skills-metric-card ${item.tone} ${activeMetric === item.label ? 'is-active' : ''}`}
                role="listitem"
                onClick={() => handleMetricClick(item.label)}
              >
                <span className="my-skills-metric-card-icon">
                  <Icon size={16} strokeWidth={2.1} />
                  {item.isLive ? <span className="my-skills-metric-live-dot" aria-hidden="true" /> : null}
                </span>
                <div className="my-skills-metric-card-copy">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              </button>
            )
          })}
        </div>

        <section className="my-skills-board-shell">
          <div className="my-skills-toolbar">
            <div className="my-skills-filter-row">
              {statusFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`my-skills-filter-chip ${activeFilter === filter ? 'is-active' : ''}`}
                  onClick={() => handleFilterClick(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <label className="my-skills-search">
              <Search size={14} strokeWidth={2.2} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search activity"
              />
            </label>
          </div>

          <div className="my-skills-board-head">
            <h3>Activity Board</h3>
            <span className="ospe-topic-pill">{filteredItems.length} Results</span>
          </div>

          <div className="my-skills-activity-list">
            {filteredItems.map((item) => (
              <ActivityCard key={`${item.status}-${item.title}-${item.type}`} item={item} onStartActivity={onStartActivity} />
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
