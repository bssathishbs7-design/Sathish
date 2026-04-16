import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  BadgeCheck,
  Brain,
  ClipboardList,
  Clock3,
  FileSearch,
  Filter,
  FlaskConical,
  HeartHandshake,
  Search,
  Shapes,
} from 'lucide-react'
import PageBreadcrumbs from '../components/PageBreadcrumbs'
import '../styles/dashboard-summary.css'
import { skillAssessmentActivities } from './skillAssessmentData'

const COGNITIVE_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
const AFFECTIVE_LEVELS = ['Receive', 'Respond', 'Value', 'Organize', 'Characterize']
const PSYCHOMOTOR_LEVELS = ['Perception', 'Set', 'Guided Response', 'Mechanism', 'Adaptation', 'Origination']
const AFFECTIVE_RING_COLORS = ['#158f69', '#7c5cff', '#8c7cf9', '#d946ef', '#d97706']
const SAMPLE_GRAPH_SERIES = {
  cognitive: [
    { label: 'Remember', value: 38 },
    { label: 'Understand', value: 22 },
    { label: 'Apply', value: 28 },
    { label: 'Analyze', value: 48 },
    { label: 'Evaluate', value: 84 },
    { label: 'Create', value: 42 },
  ],
  affective: [
    { label: 'Receive', value: 92 },
    { label: 'Respond', value: 74 },
    { label: 'Value', value: 68 },
    { label: 'Organize', value: 54 },
    { label: 'Characterize', value: 36 },
  ],
  psychomotor: [
    { label: 'Perception', value: 26 },
    { label: 'Set', value: 44 },
    { label: 'Guided Response', value: 56 },
    { label: 'Mechanism', value: 52 },
    { label: 'Adaptation', value: 63 },
    { label: 'Origination', value: 14 },
  ],
}

const normalizeText = (value) => String(value ?? '').trim()
const normalizeLower = (value) => normalizeText(value).toLowerCase()
const isApplicableDomain = (value) => {
  const normalized = normalizeLower(value)
  return normalized && normalized !== 'not applicable'
}
const calculatePercentage = (obtained, total) => {
  const safeTotal = Number(total) || 0
  if (safeTotal <= 0) return 0
  return ((Number(obtained) || 0) / safeTotal) * 100
}

const buildFallbackEvaluationRecords = () => skillAssessmentActivities.map((activity) => ({
  id: `fallback-${activity.id}`,
  activityName: activity.name,
  activityType: activity.skillType,
  studentCount: activity.students ?? 0,
  year: activity.year,
  sgt: activity.sgt,
  evaluationStatus: activity.completedAttempts?.length ? 'Completed Evaluation' : 'Pending Evaluation',
}))

const getActivitySource = (record, assignmentMap) => (
  record?.assignment
  ?? assignmentMap.get(record?.id)
  ?? {
    id: record?.id,
    title: record?.activityName,
    type: record?.activityType,
    year: record?.year,
    sgt: record?.sgt,
    examData: record?.examData,
    activityData: record?.activityData,
  }
)

const getItemDomains = (item = {}) => {
  const domains = []

  if (isApplicableDomain(item.cognitive ?? (item.domain === 'Cognitive' ? item.domain : ''))) {
    domains.push('cognitive')
  }
  if (isApplicableDomain(item.affective ?? (item.domain === 'Affective' ? item.domain : ''))) {
    domains.push('affective')
  }
  if (isApplicableDomain(item.psychomotor ?? (item.domain === 'Psychomotor' ? item.domain : ''))) {
    domains.push('psychomotor')
  }

  return [...new Set(domains)]
}

const normalizeLevelName = (value) => {
  const normalized = normalizeLower(value)
  if (!normalized || normalized === 'not applicable') return ''
  return normalized
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const collectActivityItems = (record, assignmentMap) => {
  const source = getActivitySource(record, assignmentMap)
  const modules = source?.examData?.modules ?? {}
  const sections = [
    { key: 'checklist', type: 'checklist' },
    { key: 'form', type: 'form' },
    { key: 'questions', type: 'question' },
    { key: 'scaffolding', type: 'scaffolding' },
  ]

  return sections.flatMap((section) => (
    (modules?.[section.key] ?? []).map((item, index) => ({
      id: item.id ?? `${record.id}-${section.type}-${index + 1}`,
      activityId: record.id,
      activityName: record.activityName,
      activityType: record.activityType,
      year: record.year,
      sgt: record.sgt,
      sectionType: section.type,
      marks: Number(item.marks) || 0,
      isCritical: Boolean(item.isCritical),
      domains: getItemDomains(item),
      cognitiveLevel: normalizeLevelName(item.cognitive ?? (item.domain === 'Cognitive' ? item.domain : '')),
      affectiveLevel: normalizeLevelName(item.affective ?? (item.domain === 'Affective' ? item.domain : '')),
      psychomotorLevel: normalizeLevelName(item.psychomotor ?? (item.domain === 'Psychomotor' ? item.domain : '')),
    }))
  ))
}

function CognitiveRadarChart({ data }) {
  const size = 300
  const center = size / 2
  const radius = 104
  const points = data.map((item, index) => {
    const angle = (-Math.PI / 2) + (index / data.length) * Math.PI * 2
    const pointRadius = radius * (item.value / 100)
    return {
      x: center + Math.cos(angle) * pointRadius,
      y: center + Math.sin(angle) * pointRadius,
      labelX: center + Math.cos(angle) * (radius + 22),
      labelY: center + Math.sin(angle) * (radius + 22),
    }
  })
  const polygonPoints = points.map((point) => `${point.x},${point.y}`).join(' ')
  const rings = [20, 40, 60, 80, 100]

  return (
    <div className="dashboard-radar">
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {rings.map((ring) => {
          const ringPoints = data.map((_, index) => {
            const angle = (-Math.PI / 2) + (index / data.length) * Math.PI * 2
            const ringRadius = radius * (ring / 100)
            return `${center + Math.cos(angle) * ringRadius},${center + Math.sin(angle) * ringRadius}`
          }).join(' ')

          return <polygon key={ring} points={ringPoints} className="dashboard-radar-grid" />
        })}

        {data.map((_, index) => {
          const angle = (-Math.PI / 2) + (index / data.length) * Math.PI * 2
          return (
            <line
              key={`axis-${data[index].label}`}
              x1={center}
              y1={center}
              x2={center + Math.cos(angle) * radius}
              y2={center + Math.sin(angle) * radius}
              className="dashboard-radar-axis"
            />
          )
        })}

        <polygon points={polygonPoints} className="dashboard-radar-fill" />
        <polyline points={polygonPoints} className="dashboard-radar-line" />
        {points.map((point, index) => (
          <circle key={`point-${data[index].label}`} cx={point.x} cy={point.y} r="4" className="dashboard-radar-point" />
        ))}

        {rings.map((ring) => (
          <text key={`tick-${ring}`} x={center + 6} y={center - (radius * (ring / 100)) + 4} className="dashboard-radar-tick">
            {ring}
          </text>
        ))}

        {points.map((point, index) => (
          <text
            key={`label-${data[index].label}`}
            x={point.labelX}
            y={point.labelY}
            textAnchor={point.labelX < center - 12 ? 'end' : point.labelX > center + 12 ? 'start' : 'middle'}
            className="dashboard-radar-label"
          >
            {data[index].label}
          </text>
        ))}
      </svg>
    </div>
  )
}

function AffectiveRingChart({ data }) {
  const size = 300
  const center = size / 2
  const baseRadius = 104
  const strokeWidth = 10

  return (
    <div className="dashboard-ring-chart">
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {data.map((item, index) => {
          const radius = baseRadius - index * 18
          const circumference = 2 * Math.PI * radius
          const progress = (item.value / 100) * circumference

          return (
            <g key={item.label}>
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="rgba(142, 125, 249, 0.12)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={AFFECTIVE_RING_COLORS[index % AFFECTIVE_RING_COLORS.length]}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${progress} ${circumference}`}
                transform={`rotate(-90 ${center} ${center})`}
              />
            </g>
          )
        })}
        <line x1={center} y1={center} x2={center} y2="26" className="dashboard-ring-axis" />
        <line x1={center} y1={center} x2="26" y2={center} className="dashboard-ring-axis is-faded" />
        <circle cx={center} cy={center} r="3" className="dashboard-ring-center-dot" />
      </svg>

      <div className="dashboard-ring-legend">
        {data.map((item, index) => (
          <span key={item.label}>
            <i style={{ backgroundColor: AFFECTIVE_RING_COLORS[index % AFFECTIVE_RING_COLORS.length] }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function PsychomotorBarChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 100)

  return (
    <div className="dashboard-psy-chart">
      <div className="dashboard-psy-bars">
        {data.map((item) => (
          <div key={item.label} className="dashboard-psy-bar-col">
            <span className="dashboard-psy-bar-value">{Math.round(item.value)}</span>
            <div className="dashboard-psy-bar-track">
              <div
                className="dashboard-psy-bar-fill"
                style={{ height: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <span className="dashboard-psy-bar-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardSummaryPage({
  dashboardData,
  assignedActivities = [],
  evaluationRecords = [],
  completedEvaluationRows = [],
}) {
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSgt, setSelectedSgt] = useState('')
  const [selectedActivity, setSelectedActivity] = useState('')
  const [studentSearch, setStudentSearch] = useState('')

  const assignedSource = assignedActivities.length ? assignedActivities : []
  const evaluationSource = evaluationRecords.length ? evaluationRecords : buildFallbackEvaluationRecords()
  const assignmentMap = useMemo(
    () => new Map(assignedSource.map((assignment) => [assignment.id, assignment])),
    [assignedSource],
  )

  const yearOptions = useMemo(
    () => [...new Set(evaluationSource.map((record) => record.year).filter(Boolean))],
    [evaluationSource],
  )
  const sgtOptions = useMemo(
    () => [...new Set(evaluationSource.map((record) => record.sgt).filter(Boolean))],
    [evaluationSource],
  )
  const activityOptions = useMemo(
    () => [...new Set(evaluationSource.map((record) => record.activityName).filter(Boolean))],
    [evaluationSource],
  )

  const filteredActivityRecords = useMemo(() => (
    evaluationSource.filter((record) => (
      (!selectedYear || record.year === selectedYear)
      && (!selectedSgt || record.sgt === selectedSgt)
      && (!selectedActivity || record.activityName === selectedActivity)
    ))
  ), [evaluationSource, selectedActivity, selectedSgt, selectedYear])

  const filteredAssignedActivities = useMemo(() => (
    assignedSource.filter((assignment) => (
      (!selectedYear || assignment.year === selectedYear)
      && (!selectedSgt || assignment.sgt === selectedSgt)
      && (!selectedActivity || assignment.title === selectedActivity)
    ))
  ), [assignedSource, selectedActivity, selectedSgt, selectedYear])

  const filteredCompletedRows = useMemo(() => {
    const needle = studentSearch.trim().toLowerCase()
    const visibleActivityIds = new Set(filteredActivityRecords.map((record) => record.id))

    return completedEvaluationRows.filter((row) => (
      visibleActivityIds.has(row.activityId)
      && (
        !needle
        || row.studentName?.toLowerCase().includes(needle)
        || row.registerId?.toLowerCase().includes(needle)
      )
    ))
  }, [completedEvaluationRows, filteredActivityRecords, studentSearch])

  const visibleActivityRecords = useMemo(() => {
    if (!studentSearch.trim()) return filteredActivityRecords

    const matchingActivityIds = new Set(filteredCompletedRows.map((row) => row.activityId))
    return filteredActivityRecords.filter((record) => matchingActivityIds.has(record.id))
  }, [filteredActivityRecords, filteredCompletedRows, studentSearch])

  const activityItems = useMemo(() => (
    visibleActivityRecords.flatMap((record) => collectActivityItems(record, assignmentMap))
  ), [assignmentMap, visibleActivityRecords])
  const hasRealGraphData = activityItems.length > 0

  const completedActivityIds = useMemo(() => (
    new Set(
      filteredCompletedRows
        .filter((row) => normalizeLower(row.rowStatus) === 'completed')
        .map((row) => row.activityId),
    )
  ), [filteredCompletedRows])

  const metricCards = [
    {
      id: 'created',
      label: 'Total Skill Activity',
      value: visibleActivityRecords.length,
      icon: FlaskConical,
      tone: 'is-indigo',
    },
    {
      id: 'assigned',
      label: 'Assigned Activity',
      value: filteredAssignedActivities.length,
      icon: ClipboardList,
      tone: 'is-amber',
    },
    {
      id: 'completed',
      label: 'Complete Evaluation',
      value: completedActivityIds.size,
      icon: BadgeCheck,
      tone: 'is-green',
    },
    {
      id: 'pending',
      label: 'Pending Evaluation',
      value: Math.max(visibleActivityRecords.length - completedActivityIds.size, 0),
      icon: Clock3,
      tone: 'is-red',
    },
  ]

  const domainMetrics = useMemo(() => {
    if (!hasRealGraphData) {
      return [
        { itemCount: 12, criticalCount: 3 },
        { itemCount: 10, criticalCount: 2 },
        { itemCount: 14, criticalCount: 4 },
      ]
    }

    return [
      {
        itemCount: activityItems.filter((item) => item.domains.includes('cognitive')).length,
        criticalCount: activityItems.filter((item) => item.domains.includes('cognitive') && item.isCritical).length,
      },
      {
        itemCount: activityItems.filter((item) => item.domains.includes('affective')).length,
        criticalCount: activityItems.filter((item) => item.domains.includes('affective') && item.isCritical).length,
      },
      {
        itemCount: activityItems.filter((item) => item.domains.includes('psychomotor')).length,
        criticalCount: activityItems.filter((item) => item.domains.includes('psychomotor') && item.isCritical).length,
      },
    ]
  }, [activityItems, hasRealGraphData])

  const graphSeries = useMemo(() => {
    if (!hasRealGraphData) {
      return SAMPLE_GRAPH_SERIES
    }

    const createSeries = (levels, key) => {
      const levelMarks = levels.map((level) => {
        const matchingItems = activityItems.filter((item) => normalizeLower(item[`${key}Level`]) === normalizeLower(level))
        const totalMarks = matchingItems.reduce((sum, item) => sum + (Number(item.marks) || 0), 0)
        return {
          label: level,
          totalMarks,
          value: 0,
        }
      })

      const domainTotal = levelMarks.reduce((sum, item) => sum + item.totalMarks, 0)

      return levelMarks.map((item) => ({
        ...item,
        value: calculatePercentage(item.totalMarks, domainTotal),
      }))
    }

    return {
      cognitive: createSeries(COGNITIVE_LEVELS, 'cognitive'),
      affective: createSeries(AFFECTIVE_LEVELS, 'affective'),
      psychomotor: createSeries(PSYCHOMOTOR_LEVELS, 'psychomotor'),
    }
  }, [activityItems, hasRealGraphData])

  const emptyState = !visibleActivityRecords.length && !filteredCompletedRows.length

  return (
    <section className="vx-content forms-page dashboard-summary-page">
      <div className="dashboard-summary-shell">
        <PageBreadcrumbs items={[{ label: 'Evaluation' }, { label: 'Dashboard Summary' }]} />

        <section className="vx-card dashboard-summary-toolbar dashboard-summary-toolbar-panel">
          <div className="dashboard-summary-toolbar-head">
            <div>
              <span className="dashboard-summary-toolbar-kicker">
                <Filter size={12} strokeWidth={2} />
                Analytics Filters
              </span>
              <strong>Refine the dashboard data source</strong>
            </div>
          </div>

          <div className="dashboard-summary-toolbar-grid">
            <label className="dashboard-summary-toolbar-field">
              <span>Year</span>
              <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
                <option value="">All years</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>

            <label className="dashboard-summary-toolbar-field">
              <span>SGT</span>
              <select value={selectedSgt} onChange={(event) => setSelectedSgt(event.target.value)}>
                <option value="">All groups</option>
                {sgtOptions.map((sgt) => (
                  <option key={sgt} value={sgt}>{sgt}</option>
                ))}
              </select>
            </label>

            <label className="dashboard-summary-toolbar-field">
              <span>Activity</span>
              <select value={selectedActivity} onChange={(event) => setSelectedActivity(event.target.value)}>
                <option value="">All activities</option>
                {activityOptions.map((activity) => (
                  <option key={activity} value={activity}>{activity}</option>
                ))}
              </select>
            </label>

            <label className="dashboard-summary-toolbar-search">
              <span>Search Student</span>
              <span className="dashboard-summary-toolbar-searchbox">
                <Search size={16} strokeWidth={2} />
                <input
                  type="search"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Search student name or register number"
                />
              </span>
            </label>
          </div>
        </section>

        <section className="dashboard-summary-metrics" aria-label="Dashboard metrics">
          {metricCards.map((card) => {
            const Icon = card.icon

            return (
              <article key={card.id} className={`dashboard-summary-metric-card ${card.tone}`}>
                <div className="dashboard-summary-metric-icon-wrap">
                  <span className="dashboard-summary-metric-icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
                </div>
                <div className="dashboard-summary-metric-copy">
                  <div className="dashboard-summary-metric-topline">
                    <span>{card.label}</span>
                  </div>
                  <strong>{String(card.value).padStart(2, '0')}</strong>
                </div>
              </article>
            )
          })}
        </section>

        {emptyState ? (
          <section className="eval-empty dashboard-summary-empty-note">
            <div className="eval-empty-copy">
              <FileSearch size={18} strokeWidth={2} />
              <strong>No real dashboard records yet.</strong>
              <p>Showing sample graph data for preview. Assign activities and complete evaluations to replace this with real analytics.</p>
            </div>
          </section>
        ) : null}

        <section className="dashboard-summary-domain-grid">
            <article className="dashboard-summary-domain-card is-indigo">
              <div className="dashboard-summary-domain-head">
                <span className="dashboard-summary-domain-icon" aria-hidden="true">
                  <Brain size={16} strokeWidth={2} />
                </span>
                <div>
                  <strong>Cognitive Domain</strong>
                </div>
              </div>
              <CognitiveRadarChart data={graphSeries.cognitive} />
            </article>

            <article className="dashboard-summary-domain-card is-amber">
              <div className="dashboard-summary-domain-head">
                <span className="dashboard-summary-domain-icon" aria-hidden="true">
                  <HeartHandshake size={16} strokeWidth={2} />
                </span>
                <div>
                  <strong>Affective Domain</strong>
                </div>
              </div>
              <AffectiveRingChart data={graphSeries.affective} />
            </article>

            <article className="dashboard-summary-domain-card is-green dashboard-summary-domain-card-wide">
              <div className="dashboard-summary-domain-head">
                <span className="dashboard-summary-domain-icon" aria-hidden="true">
                  <Shapes size={16} strokeWidth={2} />
                </span>
                <div>
                  <strong>Psychomotor Domain</strong>
                </div>
              </div>
              <PsychomotorBarChart data={graphSeries.psychomotor} />
            </article>
        </section>
      </div>
    </section>
  )
}
