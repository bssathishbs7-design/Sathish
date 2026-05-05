import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  CalendarDays,
  ChartColumn,
  CheckCircle2,
  ClipboardList,
  LayoutGrid,
  Play,
  Search,
} from 'lucide-react'
import DashboardSummaryPage from './DashboardSummaryPage'
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
    attemptCount: '1 / 1',
    createdDate: '06/04/2026',
  },
  {
    title: 'Blood Group Determination Station',
    type: 'OSCE',
    status: 'Assigned',
    action: 'Yet to Start',
    tone: 'secondary',
    attemptCount: '1 / 1',
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
    action: 'View Results',
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

const normalizeText = (value) => String(value ?? '').trim()
const normalizeLower = (value) => normalizeText(value).toLowerCase()
const buildAnalyticsKey = (item) => [item?.id, item?.title, item?.type, item?.studentId, item?.studentName].map(normalizeText).join('::')
const LIVE_ACTIVITY_AUTOPLAY_MS = 4500
const isLiveReadyActivity = (item) => {
  const normalizedStatus = normalizeLower(item?.status)
  const normalizedAction = normalizeLower(item?.action)

  if (normalizedStatus === 'live activity') return true
  if (normalizedStatus === 'assigned' && normalizedAction === 'start activity') return true

  return false
}

function ActivityCard({ item, onStartActivity, onSelectAnalytics, isSelected = false }) {
  const attemptValue = item.attemptCount?.split('/')?.[0]?.trim() ?? '1'
  const normalizedAttemptValue = Number.parseInt(attemptValue, 10) > 0 ? attemptValue : '1'
  const typeToneClass = `is-${String(item.type).toLowerCase().replace(/\s+/g, '-')}`
  const statusToneClass = `is-${String(item.status ?? 'assigned').toLowerCase().replace(/\s+/g, '-')}`
  const normalizedAction = String(item.action ?? '').trim().toLowerCase()
  const isViewAction = normalizedAction === 'view results'
  const scheduledAt = item.scheduledAt ? Date.parse(item.scheduledAt) : 0
  const isScheduleLocked = item.nextAttemptStatus === 'scheduled' && scheduledAt && Date.now() < scheduledAt
  const isReadyAction = (!isScheduleLocked && item.tone === 'primary') || isViewAction
  const buttonLabel = isScheduleLocked ? 'Yet to Start' : (isReadyAction ? item.action ?? 'Start Activity' : item.action ?? 'Yet to Start')
  const displayDate = item.scheduledDate || item.createdDate || 'Not set'
  const displayTime = item.scheduledTime || item.createdTime || 'Not set'

  return (
    <article
      className={`my-skills-activity-card${isSelected ? ' is-selected' : ''}`}
      onClick={() => isViewAction && onSelectAnalytics?.(item)}
    >
      <div className="my-skills-activity-card-head">
        <span className={`my-skills-activity-type ${typeToneClass}`}>{item.type}</span>
        <span className={`my-skills-status-pill ${statusToneClass}`}>{item.status}</span>
      </div>

      <strong className="my-skills-activity-title">{item.title}</strong>

      <div className="my-skills-activity-info-row">
        <span className="my-skills-attempt-pill">Attempt {normalizedAttemptValue}</span>
        <span className="my-skills-date-pill">
          <CalendarDays size={12} strokeWidth={2} />
          {displayDate}
        </span>
        <span className="my-skills-time-pill">
          {displayTime}
        </span>
      </div>

      <div className="my-skills-activity-foot">
        <button
          type="button"
          className={`tool-btn ${isViewAction ? 'ghost' : isReadyAction ? 'green' : 'ghost'} my-skills-activity-cta ${!isReadyAction ? 'is-muted' : ''}`}
          onClick={(event) => {
            event.stopPropagation()
            if (isReadyAction) onStartActivity?.(item)
          }}
          disabled={!isReadyAction}
        >
          {isReadyAction && !isViewAction ? <Play size={12} strokeWidth={2.2} /> : null}
          {buttonLabel}
        </button>
      </div>
    </article>
  )
}

export default function MySkillActivityPage({
  assignedActivities = [],
  evaluationRecords = [],
  completedEvaluationRows = [],
  onStartActivity,
}) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeMetric, setActiveMetric] = useState('Overall Activity')
  const [query, setQuery] = useState('')
  const [selectedAnalyticsKey, setSelectedAnalyticsKey] = useState('')
  const [activeLiveIndex, setActiveLiveIndex] = useState(0)
  const analyticsSectionRef = useRef(null)
  const boardSectionRef = useRef(null)

  const activityItems = useMemo(() => ([
    ...assignedActivities.map((item) => ({
      ...item,
      action: item.action ?? (item.status === 'Completed' ? 'View Results' : 'Start Activity'),
      tone: item.tone ?? (item.status === 'Completed' ? 'secondary' : 'primary'),
      status: item.status ?? 'Assigned',
    })),
    ...(assignedActivities.length ? [] : defaultActivities),
  ]), [assignedActivities])

  const analyticReadyItems = useMemo(() => (
    activityItems.filter((item) => {
      const normalizedAction = normalizeLower(item.action)
      const normalizedStatus = normalizeLower(item.status)
      return normalizedAction === 'view results' || normalizedStatus === 'completed'
    })
  ), [activityItems])

  const liveActivities = useMemo(() => (
    activityItems.filter((item) => isLiveReadyActivity(item))
  ), [activityItems])

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

  const selectedAnalyticsActivity = useMemo(() => {
    const explicitMatch = analyticReadyItems.find((item) => buildAnalyticsKey(item) === selectedAnalyticsKey)
    if (explicitMatch) return explicitMatch

    const visibleCompletedMatch = filteredItems.find((item) => (
      analyticReadyItems.some((candidate) => buildAnalyticsKey(candidate) === buildAnalyticsKey(item))
    ))

    return visibleCompletedMatch ?? analyticReadyItems[0] ?? null
  }, [analyticReadyItems, filteredItems, selectedAnalyticsKey])

  const selectedActivityEvaluationRecords = useMemo(() => {
    if (!selectedAnalyticsActivity) return []

    const selectedTitle = normalizeLower(selectedAnalyticsActivity.title)
    const selectedType = normalizeLower(selectedAnalyticsActivity.type)

    return evaluationRecords.filter((record) => (
      normalizeLower(record.activityName) === selectedTitle
      && normalizeLower(record.activityType) === selectedType
    ))
  }, [evaluationRecords, selectedAnalyticsActivity])

  const selectedActivityCompletedRows = useMemo(() => {
    if (!selectedAnalyticsActivity) return []

    const selectedId = normalizeText(selectedAnalyticsActivity.id)
    const selectedTitle = normalizeLower(selectedAnalyticsActivity.title)
    const selectedType = normalizeLower(selectedAnalyticsActivity.type)
    const selectedStudentId = normalizeLower(selectedAnalyticsActivity.studentId)
    const selectedStudentName = normalizeLower(selectedAnalyticsActivity.studentName)
    const selectedRegisterId = normalizeLower(selectedAnalyticsActivity.registerId)

    const matchingRows = completedEvaluationRows.filter((row) => {
      const activityMatches = (
        normalizeText(row.activityId) === selectedId
        || (
          normalizeLower(row.activityName) === selectedTitle
          && normalizeLower(row.activityType) === selectedType
        )
      )
      if (!activityMatches) return false

      if (!(selectedStudentId || selectedStudentName || selectedRegisterId)) return true

      return (
        normalizeLower(row.studentId) === selectedStudentId
        || normalizeLower(row.studentName) === selectedStudentName
        || normalizeLower(row.registerId) === selectedRegisterId
      )
    })

    return matchingRows.sort((left, right) => {
      const attemptDiff = (Number(right.attemptNumber) || 0) - (Number(left.attemptNumber) || 0)
      if (attemptDiff !== 0) return attemptDiff
      return (Date.parse(right.submittedAt ?? '') || 0) - (Date.parse(left.submittedAt ?? '') || 0)
    })
  }, [completedEvaluationRows, selectedAnalyticsActivity])

  const selectedActivityAssignedRows = useMemo(() => (
    selectedAnalyticsActivity ? [selectedAnalyticsActivity] : []
  ), [selectedAnalyticsActivity])

  useEffect(() => {
    if (!selectedAnalyticsKey || !analyticsSectionRef.current) return

    analyticsSectionRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [selectedAnalyticsKey])

  useEffect(() => {
    if (activeLiveIndex < liveActivities.length) return
    setActiveLiveIndex(0)
  }, [activeLiveIndex, liveActivities.length])

  useEffect(() => {
    if (liveActivities.length < 2) return undefined

    const timer = window.setInterval(() => {
      setActiveLiveIndex((currentIndex) => (
        currentIndex + 1 >= liveActivities.length ? 0 : currentIndex + 1
      ))
    }, LIVE_ACTIVITY_AUTOPLAY_MS)

    return () => window.clearInterval(timer)
  }, [liveActivities.length])

  const kpiItems = [
    { label: 'Assigned', value: activityItems.filter((item) => item.status === 'Assigned').length, icon: ClipboardList, tone: 'is-assigned' },
    { label: 'Live Activity', value: activityItems.filter((item) => item.status === 'Live Activity').length, icon: Activity, tone: 'is-live', isLive: true },
    { label: 'Completed', value: activityItems.filter((item) => item.status === 'Completed').length, icon: CheckCircle2, tone: 'is-completed' },
    { label: 'Overall Activity', value: activityItems.length, icon: LayoutGrid, tone: 'is-overall' },
    { label: 'Activity Results', value: activityItems.filter((item) => item.status === 'Completed').length, icon: ChartColumn, tone: 'is-results' },
  ]

  const liveActivity = liveActivities[activeLiveIndex] ?? null
  const hasMultipleLiveActivities = liveActivities.length >= 2

  const handleMetricClick = (label) => {
    setActiveMetric(label)
    setActiveFilter(metricToFilter[label] ?? 'All')

    window.requestAnimationFrame(() => {
      boardSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  const handleFilterClick = (filter) => {
    setActiveFilter(filter)
    setActiveMetric(filter === 'All' ? 'Overall Activity' : filter)
  }

  const handleActivityAction = (item) => {
    onStartActivity?.(item)
  }

  const handleSelectAnalytics = (item) => {
    setSelectedAnalyticsKey(buildAnalyticsKey(item))
  }

  return (
    <section className="vx-content ospe-page my-skills-page">
      <div className="ospe-shell my-skills-shell">
        <section className="my-skills-overview">
          <div className="my-skills-overview-main">
            <span className="ospe-kicker">My Skills</span>
            <div className="my-skills-overview-copy">
              <h1>My Skill Activity</h1>
              <p>Track active assessments, jump into what is ready, and review published results without digging through bulky screens.</p>
            </div>
            <div className="my-skills-overview-inline">
              <span><strong>{activityItems.length}</strong> Overall</span>
              <span><strong>{kpiItems[1].value}</strong> Live</span>
              <span><strong>{kpiItems[4].value}</strong> Results</span>
            </div>
          </div>

          <div className={`my-skills-live-card${hasMultipleLiveActivities ? ' is-carousel' : ''}`}>
            <div className="my-skills-live-card-top">
              <span className="my-skills-live-indicator">
                <span className="my-skills-live-indicator-dot" aria-hidden="true" />
                Live activity
              </span>
              <span className="my-skills-live-card-date">{liveActivity?.createdDate ?? 'No date'}</span>
            </div>
            <div className="my-skills-live-card-body">
              <strong>{liveActivity?.title ?? 'No live activity right now'}</strong>
              <p>{liveActivity ? `${liveActivity.type} is ready to launch now.` : 'New active assignments will appear here when they are available.'}</p>
            </div>
            {liveActivity ? (
              <button type="button" className="tool-btn green my-skills-live-card-cta" onClick={() => onStartActivity?.(liveActivity)}>
                <Play size={13} strokeWidth={2.2} />
                Start Activity
              </button>
            ) : null}
            {hasMultipleLiveActivities ? (
              <div className="my-skills-live-dots" aria-label="Live activity slides">
                {liveActivities.map((item, index) => (
                  <button
                    key={buildAnalyticsKey(item) || `${item.title}-${index}`}
                    type="button"
                    className={`my-skills-live-dot${activeLiveIndex === index ? ' is-active' : ''}`}
                    onClick={() => setActiveLiveIndex(index)}
                    aria-label={`Show live activity ${index + 1}`}
                    aria-pressed={activeLiveIndex === index}
                  />
                ))}
              </div>
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

        {selectedAnalyticsActivity ? (
          <section ref={analyticsSectionRef} className="my-skills-analytics-shell">
            <DashboardSummaryPage
              embedded
              useSampleFallback={false}
              heading={`${selectedAnalyticsActivity.title} Dashboard`}
              description={`Analytics for ${selectedAnalyticsActivity.type} based on the selected student activity record.`}
              assignedActivities={selectedActivityAssignedRows}
              evaluationRecords={selectedActivityEvaluationRecords}
              completedEvaluationRows={selectedActivityCompletedRows}
            />
          </section>
        ) : null}

        <section ref={boardSectionRef} className="my-skills-board-shell">
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
            <span className="ospe-topic-pill">{filteredItems.length} Activities</span>
          </div>

          <div className="my-skills-activity-list">
            {filteredItems.map((item) => (
              <ActivityCard
                key={`${item.status}-${item.title}-${item.type}-${item.studentId ?? item.id ?? ''}`}
                item={item}
                onStartActivity={handleActivityAction}
                onSelectAnalytics={handleSelectAnalytics}
                isSelected={buildAnalyticsKey(item) === buildAnalyticsKey(selectedAnalyticsActivity)}
              />
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
