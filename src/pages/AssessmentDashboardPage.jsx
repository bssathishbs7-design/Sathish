import { useEffect, useState } from 'react'
import { Activity, BadgeCheck, CalendarClock, ChartColumnBig, ClipboardList, EyeOff, ListFilter, Monitor, Search, ShieldCheck, X } from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
import { APP_PAGES } from '../config/appPages'
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

const ASSESSMENT_PUBLISHED_STORAGE_KEY = 'vx-assessment-published'
const ONLINE_PRACTICE_EXAM_STORAGE_KEY = 'vx-online-practice-exam-assessment'
const ONLINE_PROCTORED_EXAM_STORAGE_KEY = 'vx-online-proctored-exam-assessment'
const ASSESSMENT_PUBLISHED_CHANGED_EVENT = 'vx-assessment-published-changed'
const MY_ASSESSMENT_FILTER_DEFAULTS = {
  status: 'all',
  supervision: 'all',
  examType: 'all',
}
const MY_ASSESSMENT_FILTER_GROUPS = [
  {
    key: 'status',
    label: 'Exam Status',
    options: [
      { value: 'all', label: 'All Status' },
      { value: 'live', label: 'Live' },
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'completed', label: 'Completed' },
    ],
  },
  {
    key: 'supervision',
    label: 'Supervision Type',
    options: [
      { value: 'all', label: 'All Types' },
      { value: 'practice', label: 'Practice Exam' },
      { value: 'proctored', label: 'Proctored Exams' },
    ],
  },
  {
    key: 'examType',
    label: 'Exam Type',
    options: [
      { value: 'all', label: 'All Exam Types' },
      { value: 'mcq', label: 'MCQ' },
      { value: 'descriptive', label: 'Descriptive' },
      { value: 'hybrid', label: 'Hybrid' },
    ],
  },
]

const isSameAssessmentRecord = (first, second) => {
  if (!first || !second) return false
  if (first.id && second.id) return first.id === second.id

  return (
    first.assessmentName === second.assessmentName
    && first.startDate === second.startDate
    && first.startTime === second.startTime
  )
}

const readPublishedAssessments = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ASSESSMENT_PUBLISHED_STORAGE_KEY) || '[]')
    if (!Array.isArray(parsed)) return []

    const selectedPracticeAssessment = JSON.parse(window.sessionStorage.getItem(ONLINE_PRACTICE_EXAM_STORAGE_KEY) || 'null')
    const selectedProctoredAssessment = JSON.parse(window.sessionStorage.getItem(ONLINE_PROCTORED_EXAM_STORAGE_KEY) || 'null')
    const completedAssessments = [selectedPracticeAssessment, selectedProctoredAssessment]
      .filter((assessment) => assessment && assessment.status === 'completed')
    if (!completedAssessments.length) return parsed

    return parsed.map((assessment) => (
      completedAssessments.find((selectedAssessment) => isSameAssessmentRecord(assessment, selectedAssessment))
        ? {
          ...assessment,
          status: 'completed',
          completedAt: completedAssessments.find((selectedAssessment) => isSameAssessmentRecord(assessment, selectedAssessment))?.completedAt,
        }
        : assessment
    ))
  } catch {
    return []
  }
}

const formatDisplayDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB').replace(/\//g, '-')
}

const parseAssessmentDate = (value) => {
  if (!value) return null
  const normalized = String(value).trim()
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const displayMatch = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/)

  if (isoMatch) return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
  if (displayMatch) return new Date(Number(displayMatch[3]), Number(displayMatch[2]) - 1, Number(displayMatch[1]))

  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const applyAssessmentTime = (date, value) => {
  if (!date) return null
  const nextDate = new Date(date)
  const match = String(value || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i)

  if (!match) {
    nextDate.setHours(0, 0, 0, 0)
    return nextDate
  }

  let hours = Number(match[1])
  const minutes = Number(match[2] || 0)
  const period = String(match[3] || '').toUpperCase()

  if (period === 'PM' && hours < 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  nextDate.setHours(hours, minutes, 0, 0)
  return nextDate
}

const parseAssessmentDurationMs = (value) => {
  const match = String(value || '').trim().match(/^(\d+)(?::(\d{2}))?$/)
  if (!match) return 0
  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  return ((hours * 60) + minutes) * 60 * 1000
}

const formatAssessmentRemainingTime = (value) => {
  const totalSeconds = Math.max(0, Math.floor((value || 0) / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (item) => String(item).padStart(2, '0')

  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  return `${pad(minutes)}:${pad(seconds)}`
}

const getDayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const getPublishedAssessmentScheduleStatus = (assessment, now = new Date()) => {
  const isCompletedStatus = String(assessment?.status || '').trim().toLowerCase() === 'completed'
  if (isCompletedStatus) {
    return { type: 'completed', label: 'Completed' }
  }

  const startDate = parseAssessmentDate(assessment?.startDate)
  if (!startDate) {
    return null
  }

  const startAt = applyAssessmentTime(startDate, assessment?.startTime)
  const durationMs = parseAssessmentDurationMs(assessment?.totalDuration)
  const durationEndAt = durationMs ? new Date(startAt.getTime() + durationMs) : null
  const endDate = parseAssessmentDate(assessment?.endDate)
  const dateEndAt = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null
  const endAt = [durationEndAt, dateEndAt].filter(Boolean).sort((a, b) => a - b)[0] || startAt
  if (now > endAt) return { type: 'completed', label: 'Completed' }
  if (now >= startAt) return { type: 'live', label: 'Assessment Live', remainingMs: endAt.getTime() - now.getTime() }

  const diffMs = startAt.getTime() - now.getTime()
  const minutes = Math.max(1, Math.ceil(diffMs / (60 * 1000)))
  const startDay = getDayStart(startAt)
  const currentDay = getDayStart(now)
  const calendarDays = Math.round((startDay.getTime() - currentDay.getTime()) / (24 * 60 * 60 * 1000))

  if (calendarDays >= 1) {
    return { type: 'upcoming', label: `${calendarDays} ${calendarDays === 1 ? 'day' : 'days'} to go` }
  }

  if (minutes > 5 && minutes >= 60) {
    const hours = Math.max(1, Math.floor(minutes / 60))
    return { type: 'upcoming', label: `${hours} ${hours === 1 ? 'hour' : 'hours'} to go` }
  }

  return { type: 'upcoming', label: `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} to go` }
}

const getAssessmentStartTimeValue = (assessment) => {
  const startDate = parseAssessmentDate(assessment?.startDate)
  const startAt = applyAssessmentTime(startDate, assessment?.startTime)
  return startAt && !Number.isNaN(startAt.getTime()) ? startAt.getTime() : Number.MAX_SAFE_INTEGER
}

const sortAssessmentsByStatusPriority = (assessments, now = new Date()) => {
  const priority = {
    live: 0,
    upcoming: 1,
    completed: 2,
  }

  return [...assessments].sort((first, second) => {
    const firstStatus = getPublishedAssessmentScheduleStatus(first, now)?.type || 'upcoming'
    const secondStatus = getPublishedAssessmentScheduleStatus(second, now)?.type || 'upcoming'
    const priorityDiff = (priority[firstStatus] ?? 9) - (priority[secondStatus] ?? 9)
    if (priorityDiff) return priorityDiff

    const firstStart = getAssessmentStartTimeValue(first)
    const secondStart = getAssessmentStartTimeValue(second)
    return firstStatus === 'completed'
      ? secondStart - firstStart
      : firstStart - secondStart
  })
}

const handleViewAssessmentResults = (assessment) => {
  console.info('View assessment results', assessment?.id)
}

const isOnlinePracticeAssessment = (assessment) => (
  String(assessment?.examMode || '').toLowerCase() === 'online'
  && String(assessment?.supervisionType || '').toLowerCase().includes('practice')
)

const isOnlineProctoredAssessment = (assessment) => {
  const supervisionType = String(assessment?.supervisionType || '').toLowerCase()
  return String(assessment?.examMode || '').toLowerCase() === 'online'
    && supervisionType.includes('proctored')
}

export default function AssessmentDashboardPage({ mode = 'dashboard', onNavigate }) {
  const isMyAssessment = mode === 'my-assessment'
  const navigationItems = isMyAssessment
    ? ['My Pages', 'My Assessment']
    : ['My Pages', 'Assessment', 'Dashboard']
  const [publishedAssessments, setPublishedAssessments] = useState(readPublishedAssessments)
  const [scheduleNow, setScheduleNow] = useState(() => new Date())
  const [myAssessmentSearchValue, setMyAssessmentSearchValue] = useState('')
  const [myAssessmentFilters, setMyAssessmentFilters] = useState(MY_ASSESSMENT_FILTER_DEFAULTS)
  const [isMyAssessmentFilterOpen, setIsMyAssessmentFilterOpen] = useState(false)
  const studentOnlineAssessments = publishedAssessments.filter((assessment) => (
    isOnlinePracticeAssessment(assessment) || isOnlineProctoredAssessment(assessment)
  ))
  const liveOnlineAssessmentCount = studentOnlineAssessments.filter((assessment) => (
    getPublishedAssessmentScheduleStatus(assessment, scheduleNow)?.type === 'live'
  )).length
  const upcomingOnlineAssessmentCount = studentOnlineAssessments.filter((assessment) => (
    getPublishedAssessmentScheduleStatus(assessment, scheduleNow)?.type === 'upcoming'
  )).length
  const completedOnlineAssessmentCount = studentOnlineAssessments.filter((assessment) => (
    getPublishedAssessmentScheduleStatus(assessment, scheduleNow)?.type === 'completed'
  )).length
  const myAssessmentMetrics = [
    {
      key: 'all',
      label: 'Total Assessments',
      count: studentOnlineAssessments.length,
      icon: ClipboardList,
      tone: 'total',
    },
    {
      key: 'live',
      label: 'Live Assessment',
      count: liveOnlineAssessmentCount,
      icon: Activity,
      tone: 'live',
    },
    {
      key: 'upcoming',
      label: 'Upcoming',
      count: upcomingOnlineAssessmentCount,
      icon: CalendarClock,
      tone: 'upcoming',
    },
    {
      key: 'completed',
      label: 'Completed',
      count: completedOnlineAssessmentCount,
      icon: BadgeCheck,
      tone: 'completed',
    },
  ]
  const activeMyAssessmentFilterCount = Object.values(myAssessmentFilters).filter((value) => value !== 'all').length
  const hasMyAssessmentFilter = activeMyAssessmentFilterCount > 0
  const hasMyAssessmentSearch = Boolean(myAssessmentSearchValue.trim())
  const filteredOnlineAssessments = sortAssessmentsByStatusPriority(studentOnlineAssessments.filter((assessment) => {
    const scheduleStatus = getPublishedAssessmentScheduleStatus(assessment, scheduleNow)
    const searchText = [
      assessment.assessmentName,
      assessment.examCategory,
      assessment.assignTo,
      assessment.examMode,
      assessment.examType,
      assessment.supervisionType,
      assessment.startDate,
      formatDisplayDate(assessment.startDate),
      assessment.startTime,
    ].filter(Boolean).join(' ').toLowerCase()
    const searchMatches = !hasMyAssessmentSearch || searchText.includes(myAssessmentSearchValue.trim().toLowerCase())
    const examType = String(assessment.examType || '').toLowerCase()
    const supervisionType = String(assessment.supervisionType || '').toLowerCase()

    return (
      searchMatches
      && (myAssessmentFilters.status === 'all' || scheduleStatus?.type === myAssessmentFilters.status)
      && (myAssessmentFilters.supervision === 'all' || supervisionType.includes(myAssessmentFilters.supervision))
      && (myAssessmentFilters.examType === 'all' || examType === myAssessmentFilters.examType)
    )
  }), scheduleNow)

  const clearMyAssessmentSearchFilters = () => {
    setMyAssessmentSearchValue('')
    setMyAssessmentFilters(MY_ASSESSMENT_FILTER_DEFAULTS)
    setIsMyAssessmentFilterOpen(false)
  }

  const handleStartAssessment = (assessment) => {
    if (!assessment) return
    const isPracticeAssessment = isOnlinePracticeAssessment(assessment)
    const isProctoredAssessment = isOnlineProctoredAssessment(assessment)
    if (!isPracticeAssessment && !isProctoredAssessment) return
    const isOnlineProctoredFlow = isProctoredAssessment
    const storageKey = isOnlineProctoredFlow
      ? ONLINE_PROCTORED_EXAM_STORAGE_KEY
      : ONLINE_PRACTICE_EXAM_STORAGE_KEY
    const destinationPage = isOnlineProctoredFlow
      ? APP_PAGES.ONLINE_PROCTORED_EXAM
      : APP_PAGES.ONLINE_PRACTICE_EXAM

    try {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify(assessment),
      )
    } catch (error) {
      console.warn('Unable to persist selected online assessment.', error)
    }

    onNavigate?.(destinationPage)
  }

  useEffect(() => {
    if (!isMyAssessment) return undefined

    const refreshPublishedAssessments = () => {
      setPublishedAssessments(readPublishedAssessments())
    }
    const handleStorageChange = (event) => {
      if (event.key === ASSESSMENT_PUBLISHED_STORAGE_KEY) refreshPublishedAssessments()
    }

    refreshPublishedAssessments()
    setScheduleNow(new Date())
    const intervalId = window.setInterval(() => {
      refreshPublishedAssessments()
      setScheduleNow(new Date())
    }, 1000)
    window.addEventListener(ASSESSMENT_PUBLISHED_CHANGED_EVENT, refreshPublishedAssessments)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener(ASSESSMENT_PUBLISHED_CHANGED_EVENT, refreshPublishedAssessments)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [isMyAssessment])

  return (
    <section className={`vx-content assessment-page ${isMyAssessment ? 'is-my-assessment' : ''}`.trim()}>
      <div className="assessment-page-shell">
        <PageNavigationHeader items={navigationItems} />

        {isMyAssessment ? (
          <>
            <section className="my-assessment-metrics" aria-label="My assessment metrics">
              {myAssessmentMetrics.map((metric) => {
                const Icon = metric.icon
                const isActive = metric.key === 'all'
                  ? myAssessmentFilters.status === 'all'
                  : myAssessmentFilters.status === metric.key

                return (
                  <button
                    type="button"
                    key={metric.key}
                    className={`my-assessment-metric-card is-${metric.tone} ${isActive ? 'is-active' : ''}`.trim()}
                    onClick={() => setMyAssessmentFilters((current) => ({
                      ...current,
                      status: metric.key === 'all' || current.status === metric.key ? 'all' : metric.key,
                    }))}
                    aria-pressed={isActive}
                  >
                    <span className="my-assessment-metric-icon" aria-hidden="true">
                      <Icon size={16} strokeWidth={2.3} />
                    </span>
                    <span className="my-assessment-metric-copy">
                      <strong>{metric.count}</strong>
                      <span>{metric.label}</span>
                    </span>
                  </button>
                )
              })}
            </section>

            <section className="assessment-create-draft-shell assessment-create-published-shell my-assessment-published-shell" aria-label="My online assessments">
              <div className="assessment-create-card-heading">
                <h2>Assessment Status</h2>
                {studentOnlineAssessments.length ? (
                <div className="assessment-create-published-toolbar my-assessment-toolbar">
                  <label className="assessment-create-published-search">
                    <Search size={15} strokeWidth={2.2} aria-hidden="true" />
                    <input
                      type="search"
                      value={myAssessmentSearchValue}
                      placeholder="Search my assessments..."
                      onChange={(event) => setMyAssessmentSearchValue(event.target.value)}
                    />
                  </label>
                  <span className="assessment-create-published-filter-wrap">
                    <button
                      type="button"
                      className={`assessment-create-published-filter-btn ${hasMyAssessmentFilter ? 'is-active' : ''}`.trim()}
                      onClick={() => setIsMyAssessmentFilterOpen((current) => !current)}
                      aria-expanded={isMyAssessmentFilterOpen}
                    >
                      <ListFilter size={15} strokeWidth={2.3} />
                      Filter
                      {hasMyAssessmentFilter ? <em>{activeMyAssessmentFilterCount}</em> : null}
                    </button>
                    {isMyAssessmentFilterOpen ? (
                      <span className="assessment-create-published-filter-popover" role="dialog" aria-label="My assessment filters">
                        {MY_ASSESSMENT_FILTER_GROUPS.map((group) => (
                          <label key={group.key}>
                            <span>{group.label}</span>
                            <select
                              value={myAssessmentFilters[group.key]}
                              onChange={(event) => {
                                const nextValue = event.target.value
                                setMyAssessmentFilters((current) => ({ ...current, [group.key]: nextValue }))
                              }}
                            >
                              {group.options.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </label>
                        ))}
                        <span className="assessment-create-published-filter-actions">
                          <button type="button" onClick={() => setMyAssessmentFilters(MY_ASSESSMENT_FILTER_DEFAULTS)}>
                            Reset
                          </button>
                          <button type="button" className="is-primary" onClick={() => setIsMyAssessmentFilterOpen(false)}>
                            Apply
                          </button>
                        </span>
                      </span>
                    ) : null}
                  </span>
                  {(hasMyAssessmentSearch || hasMyAssessmentFilter) ? (
                    <button type="button" className="assessment-create-published-clear-btn" onClick={clearMyAssessmentSearchFilters}>
                      <X size={14} strokeWidth={2.3} />
                      Clear
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {studentOnlineAssessments.length ? (
              <div className="assessment-create-draft-grid my-assessment-published-grid">
                {filteredOnlineAssessments.length ? filteredOnlineAssessments.map((assessment) => {
                  const isPracticeExam = String(assessment.supervisionType || '').toLowerCase().includes('practice')
                  const isProctoredExam = String(assessment.supervisionType || '').toLowerCase().includes('proctored')
                  const SupervisionIcon = isPracticeExam ? EyeOff : Monitor
                  const scheduleStatus = getPublishedAssessmentScheduleStatus(assessment, scheduleNow)
                  const durationValue = scheduleStatus?.type === 'live'
                    ? formatAssessmentRemainingTime(scheduleStatus.remainingMs)
                    : assessment.totalDuration || '-'
                  const durationLabel = scheduleStatus?.type === 'live' ? 'Remaining Time' : 'Total Duration'

                  return (
                    <article
                      key={assessment.id}
                      className={`assessment-create-draft-card assessment-create-published-card ${scheduleStatus?.type === 'live' ? 'is-live' : ''}`.trim()}
                    >
                      <div className="assessment-create-published-head">
                        <div>
                          <strong>{assessment.assessmentName || 'Untitled Assessment'}</strong>
                          <small>{assessment.examCategory || '-'} / {assessment.assignTo || '-'}</small>
                        </div>
                        <span className="my-assessment-card-top-status">
                          {scheduleStatus ? (
                            scheduleStatus.type === 'upcoming' ? (
                              <span>{scheduleStatus.label}</span>
                            ) : (
                              <span className={`assessment-create-published-schedule-badge is-${scheduleStatus.type}`}>
                                {scheduleStatus.label}
                              </span>
                            )
                          ) : null}
                        </span>
                      </div>
                      <span className="assessment-create-published-status-row">
                        <span className="assessment-create-published-status is-online">
                          {assessment.examMode || '-'}
                        </span>
                        <span className={`assessment-create-published-supervision ${isPracticeExam ? 'is-practice' : 'is-proctored'}`}>
                          <SupervisionIcon size={13} strokeWidth={2.3} />
                          {assessment.supervisionType || '-'}
                        </span>
                      </span>
                      <div className="assessment-create-published-details" aria-label="Published assessment details">
                        <span><strong>{formatDisplayDate(assessment.startDate)}</strong><em>Start Date</em></span>
                        <span><strong>{assessment.startTime || '-'}</strong><em>Start Time</em></span>
                        <span><strong>{durationValue}</strong><em>{durationLabel}</em></span>
                        <span><strong>{formatDisplayDate(assessment.endDate)}</strong><em>End Date</em></span>
                        <span><strong>{assessment.totalMarks ?? '-'}</strong><em>Total Marks</em></span>
                        <span><strong>{assessment.examType || '-'}</strong><em>Exam Type</em></span>
                      </div>
                      <div className="assessment-create-draft-footer assessment-create-published-footer">
                        <span className="assessment-create-published-footer-status" />
                        <button
                          type="button"
                          className={`my-assessment-card-action is-${scheduleStatus?.type === 'completed' ? 'results' : 'start'} ${scheduleStatus?.type === 'live' ? 'is-live' : ''}`}
                          disabled={scheduleStatus?.type === 'upcoming'}
                          onClick={() => {
                            if (scheduleStatus?.type === 'completed') {
                              handleViewAssessmentResults(assessment)
                              return
                            }
                            handleStartAssessment(assessment)
                          }}
                        >
                          {scheduleStatus?.type === 'completed' ? 'View Results' : 'Start Assessment'}
                        </button>
                      </div>
                    </article>
                  )
                }) : (
                  <div className="assessment-create-placeholder my-assessment-empty-state">
                    <p>No assessments match your search.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="assessment-create-placeholder">
                <p>No assigned online assessments available.</p>
              </div>
            )}
            </section>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </section>
  )
}
