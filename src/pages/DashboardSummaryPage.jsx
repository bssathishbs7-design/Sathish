import { useMemo, useState } from 'react'
import {
  AlertTriangle,
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
  Users,
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
  criticality: [
    { label: 'Critical', value: 34, color: '#ef6b5a' },
    { label: 'Normal', value: 66, color: '#1fba8a' },
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
const clampPercent = (value) => Math.min(Math.max(Math.round(Number(value) || 0), 0), 100)

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
  const size = 340
  const center = size / 2
  const radius = 112
  const rings = [25, 50, 75, 100]
  const points = data.map((item, index) => {
    const angle = (-Math.PI / 2) + (index / data.length) * Math.PI * 2
    const valueRadius = radius * (clampPercent(item.value) / 100)

    return {
      ...item,
      value: clampPercent(item.value),
      x: center + Math.cos(angle) * valueRadius,
      y: center + Math.sin(angle) * valueRadius,
      axisX: center + Math.cos(angle) * radius,
      axisY: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * (radius + 34),
      labelY: center + Math.sin(angle) * (radius + 30),
    }
  })
  const polygonPoints = points.map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <div className="dashboard-cognitive-radar-card">
      <svg className="dashboard-cognitive-radar-chart" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Cognitive domain radar chart">
        {rings.map((ring) => {
          const ringPoints = data.map((_, index) => {
            const angle = (-Math.PI / 2) + (index / data.length) * Math.PI * 2
            const ringRadius = radius * (ring / 100)
            return `${center + Math.cos(angle) * ringRadius},${center + Math.sin(angle) * ringRadius}`
          }).join(' ')

          return <polygon key={ring} points={ringPoints} className="dashboard-cognitive-radar-grid" />
        })}
        {points.map((point) => (
          <line
            key={`axis-${point.label}`}
            x1={center}
            y1={center}
            x2={point.axisX}
            y2={point.axisY}
            className="dashboard-cognitive-radar-axis"
          />
        ))}
        <polygon points={polygonPoints} className="dashboard-cognitive-radar-fill" />
        <polyline points={`${polygonPoints} ${points[0]?.x},${points[0]?.y}`} className="dashboard-cognitive-radar-line" />
        {points.map((point) => (
          <g key={`dot-${point.label}`} className="dashboard-radar-point-group">
            <circle cx={point.x} cy={point.y} r="13" className="dashboard-cognitive-radar-hotspot" />
            <circle cx={point.x} cy={point.y} r="4.8" className="dashboard-cognitive-radar-dot" />
            <g className="dashboard-radar-tooltip-card">
              <rect x={point.x - 44} y={point.y - 48} width="88" height="34" rx="10" />
              <text x={point.x} y={point.y - 29} textAnchor="middle">{point.label}: {point.value}%</text>
            </g>
          </g>
        ))}
        {points.map((point) => (
          <g key={`label-${point.label}`}>
            <text
              x={point.labelX}
              y={point.labelY - 6}
              textAnchor={point.labelX < center - 10 ? 'end' : point.labelX > center + 10 ? 'start' : 'middle'}
              className="dashboard-cognitive-radar-value"
            >
              {point.value}%
            </text>
            <text
              x={point.labelX}
              y={point.labelY + 10}
              textAnchor={point.labelX < center - 10 ? 'end' : point.labelX > center + 10 ? 'start' : 'middle'}
              className="dashboard-cognitive-radar-label"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function AffectiveRingChart({ data }) {
  const chartWidth = 430
  const chartHeight = 250
  const padding = { top: 26, right: 24, bottom: 42, left: 42 }
  const values = data.map((item) => clampPercent(item.value))
  const maxValue = Math.max(100, ...values)
  const points = data.map((item, index) => {
    const x = padding.left + (index / Math.max(data.length - 1, 1)) * (chartWidth - padding.left - padding.right)
    const y = padding.top + (1 - (clampPercent(item.value) / maxValue)) * (chartHeight - padding.top - padding.bottom)

    return {
      ...item,
      x,
      y,
      value: clampPercent(item.value),
    }
  })
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const areaPath = `${linePath} L ${points.at(-1)?.x ?? padding.left} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`
  const peakPoint = points.reduce((best, point) => (point.value > best.value ? point : best), points[0] ?? { x: 0, y: 0, value: 0, label: '' })
  const gridLines = [0, 25, 50, 75, 100]

  return (
    <div className="dashboard-affective-line-card">
      <div className="dashboard-affective-line-top">
        <span>Engagement Trend</span>
        <strong>{peakPoint.value}% peak</strong>
      </div>
      <svg className="dashboard-affective-line-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Affective domain trend chart">
        <defs>
          <linearGradient id="affectiveAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLines.map((line) => {
          const y = padding.top + (1 - (line / maxValue)) * (chartHeight - padding.top - padding.bottom)

          return (
            <g key={line}>
              <line x1={padding.left} x2={chartWidth - padding.right} y1={y} y2={y} className="dashboard-affective-grid" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="dashboard-affective-axis-text">{line}</text>
            </g>
          )
        })}
        <path d={areaPath} className="dashboard-affective-area" />
        <path d={linePath} className="dashboard-affective-line" />
        {points.map((point) => (
          <g key={point.label} className="dashboard-affective-point-group">
            <circle cx={point.x} cy={point.y} r="14" className="dashboard-affective-hotspot" />
            <circle cx={point.x} cy={point.y} r={point.label === peakPoint.label ? 5.5 : 4.2} className={point.label === peakPoint.label ? 'dashboard-affective-point is-peak' : 'dashboard-affective-point'} />
            <g className="dashboard-affective-tooltip-card">
              <rect x={point.x - 48} y={point.y - 52} width="96" height="36" rx="10" />
              <text x={point.x} y={point.y - 31} textAnchor="middle">{point.label}: {point.value}%</text>
            </g>
          </g>
        ))}
        {peakPoint.label ? (
          <g>
            <line x1={peakPoint.x} x2={peakPoint.x} y1={peakPoint.y + 8} y2={chartHeight - padding.bottom} className="dashboard-affective-marker-line" />
            <rect x={peakPoint.x - 26} y={peakPoint.y - 31} width="52" height="22" rx="8" className="dashboard-affective-marker-bg" />
            <text x={peakPoint.x} y={peakPoint.y - 16} textAnchor="middle" className="dashboard-affective-marker-text">{peakPoint.value}%</text>
          </g>
        ) : null}
        {points.map((point) => (
          <text key={`label-${point.label}`} x={point.x} y={chartHeight - 10} textAnchor="middle" className="dashboard-affective-axis-text">
            {point.label.slice(0, 3)}
          </text>
        ))}
      </svg>
    </div>
  )
}

function PsychomotorBarChart({ data }) {
  const averageValue = data.length
    ? data.reduce((sum, item) => sum + (Number(item.value) || 0), 0) / data.length
    : 0

  return (
    <div className="dashboard-psy-heatmap">
      <div className="dashboard-psy-score-card">
        <span>Average Coverage</span>
        <strong>{Math.round(averageValue)}%</strong>
        <small>Psychomotor skill spread</small>
      </div>
      <div className="dashboard-psy-heatmap-grid">
        {data.map((item) => (
          <article key={item.label} className="dashboard-psy-heatmap-cell dashboard-chart-tooltip-wrap" style={{ '--value': `${clampPercent(item.value)}%` }}>
            <div>
              <strong>{item.label}</strong>
              <span>{clampPercent(item.value)}%</span>
            </div>
            <i />
            <span className="dashboard-chart-tooltip">{item.label}: {clampPercent(item.value)}%</span>
          </article>
        ))}
      </div>
    </div>
  )
}

function CriticalityDonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0) || 1
  const critical = data.find((item) => normalizeLower(item.label).includes('critical'))?.value ?? 0
  const normal = Math.max(total - critical, 0)
  const criticalPercent = clampPercent(calculatePercentage(critical, total))
  const radius = 72
  const circumference = 2 * Math.PI * radius
  const progress = (criticalPercent / 100) * circumference

  return (
    <div className="dashboard-critical-progress-card">
      <div className="dashboard-critical-progress-top">
        <span>Point Progress</span>
        <button type="button">Week</button>
      </div>
      <div className="dashboard-critical-progress-ring">
        <svg viewBox="0 0 190 190" role="img" aria-label={`Criticality progress ${criticalPercent}%`}>
          <circle cx="95" cy="95" r={radius} className="dashboard-critical-progress-bg" />
          <circle
            cx="95"
            cy="95"
            r={radius}
            className="dashboard-critical-progress-value"
            strokeDasharray={`${progress} ${circumference}`}
          />
        </svg>
        <div>
          <strong>{criticalPercent}%</strong>
          <span>Criticality</span>
        </div>
      </div>
      <div className="dashboard-critical-progress-foot">
        <span>{Math.round(critical)} critical</span>
        <strong>{Math.round(normal)} normal</strong>
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
  const [selectedActivityType, setSelectedActivityType] = useState('')
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
  const activityTypeOptions = useMemo(
    () => [...new Set(evaluationSource.map((record) => record.activityType).filter(Boolean))],
    [evaluationSource],
  )

  const filteredActivityRecords = useMemo(() => (
    evaluationSource.filter((record) => (
      (!selectedYear || record.year === selectedYear)
      && (!selectedSgt || record.sgt === selectedSgt)
      && (!selectedActivityType || record.activityType === selectedActivityType)
      && (!selectedActivity || record.activityName === selectedActivity)
    ))
  ), [evaluationSource, selectedActivity, selectedActivityType, selectedSgt, selectedYear])

  const filteredAssignedActivities = useMemo(() => (
    assignedSource.filter((assignment) => (
      (!selectedYear || assignment.year === selectedYear)
      && (!selectedSgt || assignment.sgt === selectedSgt)
      && (!selectedActivityType || assignment.type === selectedActivityType)
      && (!selectedActivity || assignment.title === selectedActivity)
    ))
  ), [assignedSource, selectedActivity, selectedActivityType, selectedSgt, selectedYear])

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
      criticality: [
        {
          label: 'Critical',
          value: calculatePercentage(activityItems.filter((item) => item.isCritical).length, activityItems.length),
          color: '#ef6b5a',
        },
        {
          label: 'Normal',
          value: calculatePercentage(activityItems.filter((item) => !item.isCritical).length, activityItems.length),
          color: '#1fba8a',
        },
      ],
    }
  }, [activityItems, hasRealGraphData])

  const activityPerformanceRows = useMemo(() => (
    visibleActivityRecords.slice(0, 6).map((record) => {
      const rows = filteredCompletedRows.filter((row) => row.activityId === record.id)
      const completedRows = rows.filter((row) => normalizeLower(row.rowStatus) === 'completed')
      const averageScore = completedRows.length
        ? completedRows.reduce((sum, row) => sum + (Number(row.totalPercentage) || 0), 0) / completedRows.length
        : 0

      return {
        id: record.id,
        activityName: record.activityName,
        activityType: record.activityType,
        year: record.year,
        sgt: record.sgt,
        submitted: completedRows.length,
        score: averageScore,
        status: completedRows.length ? 'Evaluated' : 'Pending',
      }
    })
  ), [filteredCompletedRows, visibleActivityRecords])

  const studentPerformanceRows = useMemo(() => (
    filteredCompletedRows.slice(0, 6).map((row) => ({
      id: row.id ?? `${row.activityId}-${row.studentId}`,
      studentName: row.studentName,
      registerId: row.registerId,
      activityType: row.activityType,
      score: Number(row.totalPercentage) || 0,
      critical: Number(row.overallCriticalMarks) || 0,
      result: row.resultStatus || '-',
    }))
  ), [filteredCompletedRows])

  const displayedActivityPerformanceRows = activityPerformanceRows.length ? activityPerformanceRows : [
    { id: 'sample-activity-1', activityName: 'Measure blood pressure', activityType: 'OSCE', year: 'First Year', sgt: 'SGT A', submitted: 4, score: 82, status: 'Evaluated' },
    { id: 'sample-activity-2', activityName: 'Identify specimen image', activityType: 'Image', year: 'Second Year', sgt: 'SGT B', submitted: 3, score: 68, status: 'Pending' },
  ]

  const displayedStudentPerformanceRows = studentPerformanceRows.length ? studentPerformanceRows : [
    { id: 'sample-student-1', studentName: 'Aarav Menon', registerId: 'MC25101', activityType: 'OSPE', critical: 2, score: 88, result: 'Completed' },
    { id: 'sample-student-2', studentName: 'Diya Krishnan', registerId: 'MC25102', activityType: 'Image', critical: 1, score: 72, result: 'Repeat' },
  ]

  const emptyState = !visibleActivityRecords.length && !filteredCompletedRows.length

  return (
    <section className="vx-content forms-page dashboard-summary-page">
      <div className="dashboard-summary-shell">
        <PageBreadcrumbs items={[{ label: 'Evaluation' }, { label: 'Dashboard Summary' }]} />

        <section className="dashboard-summary-command">
          <div>
            <span className="dashboard-summary-command-kicker">Skill Analytics</span>
            <h1>Evaluation dashboard</h1>
            <p>Track activities, completed evaluations, domain coverage, criticality and student performance in one live view.</p>
          </div>
          <div className="dashboard-summary-command-meta">
            <span>{visibleActivityRecords.length} Activities</span>
            <strong>{filteredCompletedRows.length} Records</strong>
          </div>
        </section>

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
              <span>Activity Type</span>
              <select value={selectedActivityType} onChange={(event) => setSelectedActivityType(event.target.value)}>
                <option value="">All types</option>
                {activityTypeOptions.map((activityType) => (
                  <option key={activityType} value={activityType}>{activityType}</option>
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

            <article className="dashboard-summary-domain-card is-red">
              <div className="dashboard-summary-domain-head">
                <span className="dashboard-summary-domain-icon" aria-hidden="true">
                  <AlertTriangle size={16} strokeWidth={2} />
                </span>
                <div>
                  <strong>Criticality Graph</strong>
                </div>
              </div>
              <CriticalityDonutChart data={graphSeries.criticality} />
            </article>

            <article className="dashboard-summary-domain-card is-green">
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

        <section className="dashboard-performance-grid">
          <article className="dashboard-performance-card">
            <div className="dashboard-performance-head">
              <div>
                <span>Activity Performance</span>
                <strong>Evaluation progress by activity</strong>
              </div>
              <ClipboardList size={18} strokeWidth={2} />
            </div>
            <div className="dashboard-performance-list">
              {displayedActivityPerformanceRows.map((row) => {
                const score = clampPercent(row.score)

                return (
                  <article key={row.id} className="dashboard-performance-row">
                    <div className="dashboard-performance-main">
                      <span className="dashboard-performance-avatar is-activity">{normalizeText(row.activityType).slice(0, 2) || 'AC'}</span>
                      <div>
                        <strong>{row.activityName}</strong>
                        <small>{row.activityType} / {row.year} / {row.sgt}</small>
                      </div>
                    </div>
                    <div className="dashboard-performance-score">
                      <span>{score}%</span>
                      <div className="dashboard-performance-track">
                        <i style={{ width: `${score}%` }} />
                      </div>
                    </div>
                    <div className="dashboard-performance-meta">
                      <span>{row.submitted} submitted</span>
                      <span className={`dashboard-performance-pill ${row.status === 'Evaluated' ? 'is-good' : 'is-warn'}`}>{row.status}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </article>

          <article className="dashboard-performance-card">
            <div className="dashboard-performance-head">
              <div>
                <span>Student Performance</span>
                <strong>Recent completed evaluations</strong>
              </div>
              <Users size={18} strokeWidth={2} />
            </div>
            <div className="dashboard-performance-list">
              {displayedStudentPerformanceRows.map((row) => {
                const score = clampPercent(row.score)
                const initials = normalizeText(row.studentName)
                  .split(/\s+/)
                  .map((part) => part.charAt(0))
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()

                return (
                  <article key={row.id} className="dashboard-performance-row">
                    <div className="dashboard-performance-main">
                      <span className="dashboard-performance-avatar">{initials || 'ST'}</span>
                      <div>
                        <strong>{row.studentName}</strong>
                        <small>{row.registerId} / {row.activityType} / Critical {row.critical}</small>
                      </div>
                    </div>
                    <div className="dashboard-performance-score">
                      <span>{score}%</span>
                      <div className="dashboard-performance-track">
                        <i style={{ width: `${score}%` }} />
                      </div>
                    </div>
                    <div className="dashboard-performance-meta">
                      <span>Final result</span>
                      <span className="dashboard-performance-pill is-soft">{row.result}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </article>
        </section>

        {false ? (
        <section className="dashboard-summary-table-grid">
          <article className="dashboard-summary-table-card">
            <div className="dashboard-summary-table-head">
              <div>
                <strong>Activity Performance</strong>
                <span>Evaluation progress by activity</span>
              </div>
              <ClipboardList size={16} strokeWidth={2} />
            </div>
            <div className="dashboard-summary-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Type</th>
                    <th>Batch</th>
                    <th>Submitted</th>
                    <th>Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(activityPerformanceRows.length ? activityPerformanceRows : [
                    { id: 'sample-activity-1', activityName: 'Measure blood pressure', activityType: 'OSCE', year: 'First Year', sgt: 'SGT A', submitted: 4, score: 82, status: 'Evaluated' },
                    { id: 'sample-activity-2', activityName: 'Identify specimen image', activityType: 'Image', year: 'Second Year', sgt: 'SGT B', submitted: 3, score: 68, status: 'Pending' },
                  ]).map((row) => (
                    <tr key={row.id}>
                      <td><strong>{row.activityName}</strong></td>
                      <td>{row.activityType}</td>
                      <td>{row.year} · {row.sgt}</td>
                      <td>{row.submitted}</td>
                      <td>{Math.round(row.score)}%</td>
                      <td><span className={`dashboard-summary-status ${row.status === 'Evaluated' ? 'is-good' : 'is-warn'}`}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard-summary-table-card">
            <div className="dashboard-summary-table-head">
              <div>
                <strong>Student Performance</strong>
                <span>Recent completed evaluations</span>
              </div>
              <Users size={16} strokeWidth={2} />
            </div>
            <div className="dashboard-summary-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Critical</th>
                    <th>Score</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {(studentPerformanceRows.length ? studentPerformanceRows : [
                    { id: 'sample-student-1', studentName: 'Aarav Menon', registerId: 'MC25101', activityType: 'OSPE', critical: 2, score: 88, result: 'Completed' },
                    { id: 'sample-student-2', studentName: 'Diya Krishnan', registerId: 'MC25102', activityType: 'Image', critical: 1, score: 72, result: 'Repeat' },
                  ]).map((row) => (
                    <tr key={row.id}>
                      <td><strong>{row.studentName}</strong></td>
                      <td>{row.registerId}</td>
                      <td>{row.activityType}</td>
                      <td>{row.critical}</td>
                      <td>{Math.round(row.score)}%</td>
                      <td><span className="dashboard-summary-status is-soft">{row.result}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
        ) : null}
      </div>
    </section>
  )
}
