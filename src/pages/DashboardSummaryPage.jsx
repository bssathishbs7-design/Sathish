import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  BadgeCheck,
  Brain,
  ClipboardList,
  Clock3,
  ChevronDown,
  FileSearch,
  Filter,
  FlaskConical,
  HeartHandshake,
  Search,
  Shapes,
  Trophy,
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
const EMPTY_GRAPH_SERIES = {
  cognitive: COGNITIVE_LEVELS.map((label) => ({ label, value: 0, totalMarks: 0 })),
  affective: AFFECTIVE_LEVELS.map((label) => ({ label, value: 0, totalMarks: 0 })),
  psychomotor: PSYCHOMOTOR_LEVELS.map((label) => ({ label, value: 0, totalMarks: 0 })),
  criticality: [
    { label: 'Critical', value: 0, color: '#ef6b5a' },
    { label: 'Normal', value: 0, color: '#1fba8a' },
  ],
}

const normalizeText = (value) => String(value ?? '').trim()
const normalizeLower = (value) => normalizeText(value).toLowerCase()
const idsMatch = (left, right) => normalizeText(left) === normalizeText(right)
const formatThresholdLabel = (value) => {
  const normalized = normalizeText(value)
  return normalized && normalized !== 'Not Matched' ? normalized : 'No threshold'
}
const formatResultLabel = (value) => {
  const normalized = normalizeLower(value)
  if (normalized === 'repeat') return 'Repeat'
  if (normalized === 'remedial') return 'Remedial'
  if (normalized === 'completed') return 'Completed'
  if (normalized === 'evaluated') return 'Evaluated'
  if (normalized === 'pending') return 'Pending'
  return normalizeText(value) || 'Pending'
}
const escapeCsvCell = (value) => {
  const normalizedValue = String(value ?? '').replace(/\r?\n|\r/g, ' ').trim()
  return `"${normalizedValue.replace(/"/g, '""')}"`
}
const sanitizeFileName = (value) => normalizeText(value)
  .normalize('NFKD')
  .replace(/[^\x20-\x7E]/g, ' ')
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase()
  || 'dashboard-report'
const downloadCsv = ({ fileName, headers, rows }) => {
  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n')
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${sanitizeFileName(fileName)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
const formatDateTime = (value) => {
  const timestamp = Date.parse(value ?? '')
  if (!timestamp) return 'Not available'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}
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
const scaleGraphPercent = (value, index, key) => {
  const numericValue = Number(value) || 0
  if (numericValue <= 0) return 0

  const baselineByDomain = {
    cognitive: 46,
    affective: 42,
    psychomotor: 58,
  }
  const activityVariation = key === 'psychomotor'
    ? ((index * 11) % 24) - 2
    : ((index * 9) % 22) - 6
  const amplifiedValue = numericValue * (key === 'psychomotor' ? 2.15 : 1.45)

  return clampPercent(Math.max(amplifiedValue, (baselineByDomain[key] ?? 38) + activityVariation))
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

const buildSampleModuleItem = (activity, itemIndex, type) => {
  const cognitive = COGNITIVE_LEVELS[(itemIndex + activity.name.length) % COGNITIVE_LEVELS.length]
  const affective = AFFECTIVE_LEVELS[(itemIndex + activity.competency.length) % AFFECTIVE_LEVELS.length]
  const psychomotor = PSYCHOMOTOR_LEVELS[(itemIndex + activity.skillType.length) % PSYCHOMOTOR_LEVELS.length]

  return {
    id: `${activity.id}-${type}-${itemIndex + 1}`,
    text: `${activity.name} ${type} point ${itemIndex + 1}`,
    questionText: `${activity.name} ${type} point ${itemIndex + 1}`,
    marks: itemIndex % 2 === 0 ? 2 : 1,
    isCritical: itemIndex % 3 === 0,
    cognitive,
    affective,
    psychomotor,
  }
}

const buildSampleExamData = (activity) => ({
  modules: {
    checklist: Array.from({ length: 4 }, (_, index) => buildSampleModuleItem(activity, index, 'checklist')),
    form: Array.from({ length: 2 }, (_, index) => ({
      ...buildSampleModuleItem(activity, index + 4, 'form'),
      responses: [
        { key: `${activity.id}-form-${index + 1}-yes`, label: 'Completed' },
        { key: `${activity.id}-form-${index + 1}-no`, label: 'Needs Review' },
      ],
    })),
    questions: Array.from({ length: 3 }, (_, index) => buildSampleModuleItem(activity, index + 6, 'question')),
    scaffolding: Array.from({ length: 2 }, (_, index) => buildSampleModuleItem(activity, index + 9, 'scaffolding')),
  },
  thresholds: [
    { id: `${activity.id}-pass`, label: 'Pass', from: 75, to: 100 },
    { id: `${activity.id}-borderline`, label: 'Borderline', from: 55, to: 74 },
  ],
})

const buildSampleAssignedActivities = () => skillAssessmentActivities.map((activity, index) => ({
  id: `fallback-${activity.id}`,
  title: activity.name,
  type: activity.skillType,
  year: activity.year,
  sgt: activity.sgt,
  assignedTo: `${activity.year} • ${activity.sgt}`,
  studentCount: activity.students ?? 10,
  status: index % 2 === 0 ? 'Assigned' : 'In Progress',
  action: 'Start Activity',
  tone: index % 2 === 0 ? 'primary' : 'secondary',
  createdDate: `${String(index + 8).padStart(2, '0')}/04/2026`,
  competency: activity.competency,
  evaluationStatus: activity.completedAttempts?.length ? 'Completed Evaluation' : 'Pending Evaluation',
  examData: buildSampleExamData(activity),
}))

function DashboardFilterDropdown({
  label,
  value,
  placeholder,
  options,
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedLabel = value || placeholder

  return (
    <div
      className={`dashboard-summary-toolbar-field dashboard-summary-filter ${isOpen ? 'is-open' : ''}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false)
        }
      }}
    >
      <span>{label}</span>
      <button
        type="button"
        className="dashboard-summary-filter-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{selectedLabel}</span>
        <ChevronDown size={16} strokeWidth={2.2} />
      </button>
      {isOpen ? (
        <div className="dashboard-summary-filter-menu" role="listbox">
          <button
            type="button"
            role="option"
            aria-selected={!value}
            className={!value ? 'is-selected' : ''}
            onClick={() => {
              onChange('')
              setIsOpen(false)
            }}
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={value === option}
              className={value === option ? 'is-selected' : ''}
              onClick={() => {
                onChange(option)
                setIsOpen(false)
              }}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const buildSampleCompletedEvaluationRows = () => {
  const students = [
    { id: 'student-1', name: 'Aarav Menon', registerId: 'MC25101' },
    { id: 'student-2', name: 'Diya Krishnan', registerId: 'MC25102' },
    { id: 'student-3', name: 'Kavin Raj', registerId: 'MC25103' },
    { id: 'student-4', name: 'Megha Suresh', registerId: 'MC25104' },
    { id: 'student-5', name: 'Nithin Paul', registerId: 'MC25105' },
    { id: 'student-6', name: 'Riya Thomas', registerId: 'MC25106' },
  ]

  return skillAssessmentActivities
    .filter((activity) => activity.completedAttempts?.length)
    .flatMap((activity, activityIndex) => (
      students.slice(0, 2 + (activityIndex % 2)).map((student, studentIndex) => {
        const totalPercentage = 68 + ((activityIndex * 7 + studentIndex * 5) % 24)
        const totalMarks = 10
        const totalObtainedMarks = Number((totalMarks * totalPercentage / 100).toFixed(1))

        return {
          id: `sample-completed-${activity.id}-${student.id}`,
          activityId: `fallback-${activity.id}`,
          activityName: activity.name,
          activityType: activity.skillType,
          studentId: student.id,
          studentName: student.name,
          registerId: student.registerId,
          rowStatus: 'Completed',
          resultStatus: totalPercentage >= 75 ? 'Completed' : 'Repeat',
          decisionTitle: totalPercentage >= 75 ? 'Completed' : 'Repeat',
          thresholdLabel: totalPercentage >= 75 ? 'Pass' : 'Borderline',
          submittedAt: new Date(2026, 3, 9 + activityIndex, 9, 12 + studentIndex * 6).toISOString(),
          totalMarks,
          totalObtainedMarks,
          totalPercentage,
          overallCriticalMarks: 2 + ((activityIndex + studentIndex) % 3),
          overallCriticalPercentage: Math.max(totalPercentage - 8, 0),
          checklist: {
            itemCount: 5,
            obtainedMarks: Math.min(totalObtainedMarks, 5),
            criticalObtainedMarks: 1 + (studentIndex % 2),
            percentage: totalPercentage,
            criticalPercentage: Math.max(totalPercentage - 10, 0),
          },
          form: {
            itemCount: 2,
            obtainedMarks: Math.min(totalObtainedMarks, 2),
            criticalObtainedMarks: 1,
            percentage: Math.max(totalPercentage - 4, 0),
            criticalPercentage: Math.max(totalPercentage - 12, 0),
          },
          question: {
            itemCount: 3,
            obtainedMarks: Math.min(totalObtainedMarks, 3),
            criticalObtainedMarks: 1,
            percentage: Math.min(totalPercentage + 3, 100),
            criticalPercentage: Math.max(totalPercentage - 6, 0),
          },
        }
      })
    ))
}

const getLatestRowsByStudent = (rows = []) => {
  const latestRows = new Map()

  rows.forEach((row) => {
    const key = String(row.studentId ?? row.registerId ?? row.studentName ?? '')
    if (!key) return

    const current = latestRows.get(key)
    const rowAttempt = Number(row.attemptNumber) || 1
    const currentAttempt = Number(current?.attemptNumber) || 0

    if (!current || rowAttempt >= currentAttempt) {
      latestRows.set(key, row)
    }
  })

  return [...latestRows.values()]
}

const buildCompletedRowContext = (row, recordMap) => {
  const activityRecord = recordMap.get(row.activityId) ?? {}

  return {
    ...row,
    activityName: row.activityName ?? activityRecord.activityName ?? 'Activity',
    activityType: row.activityType ?? activityRecord.activityType ?? 'Activity',
    year: row.year ?? activityRecord.year ?? 'Not set',
    sgt: row.sgt ?? activityRecord.sgt ?? 'Not set',
    result: row.resultStatus ?? row.decisionTitle ?? row.evaluationStatus ?? '-',
    attemptNumber: Number(row.attemptNumber ?? row.attemptCount ?? 1) || 1,
    totalPercentage: Number(row.totalPercentage) || 0,
    totalObtainedMarks: Number(row.totalObtainedMarks) || 0,
    totalMarks: Number(row.totalMarks) || 0,
    critical: Number(row.overallCriticalMarks) || 0,
  }
}

const resolveRecordIdCandidates = (row = {}) => ([
  row.activityId,
  row.activityRecord?.id,
  row.assignment?.id,
])

const rowMatchesActivityRecord = (row, record) => {
  if (!row || !record) return false

  const hasMatchingId = resolveRecordIdCandidates(row).some((candidate) => idsMatch(candidate, record.id))
  if (hasMatchingId) return true

  return (
    idsMatch(row.activityName, record.activityName)
    && idsMatch(row.activityType, record.activityType)
    && idsMatch(row.year ?? row.activityRecord?.year, record.year)
    && idsMatch(row.sgt ?? row.activityRecord?.sgt, record.sgt)
  )
}

const getActivityPerformanceRows = (activityRecords = [], completedRows = [], limit = 6) => (
  activityRecords.slice(0, limit).map((record) => {
    const activityRows = completedRows.filter((row) => row.activityId === record.id)
    const latestRows = getLatestRowsByStudent(activityRows)
    const evaluatedStudents = latestRows.length
    const totalStudents = Number(record.studentCount) || 0
    const progressPercent = totalStudents > 0 ? calculatePercentage(evaluatedStudents, totalStudents) : 0
    const averageScore = latestRows.length
      ? latestRows.reduce((sum, row) => sum + (Number(row.totalPercentage) || 0), 0) / latestRows.length
      : 0

    return {
      id: record.id,
      activityName: record.activityName,
      activityType: record.activityType,
      year: record.year,
      sgt: record.sgt,
      totalStudents,
      evaluatedStudents,
      submitted: evaluatedStudents,
      progressPercent,
      averageScore,
      status: evaluatedStudents ? 'Evaluated' : 'Pending',
    }
  })
)

const getRecentStudentPerformanceRows = (completedRows = [], limit = 6) => (
  [...completedRows]
    .sort((left, right) => (Date.parse(right.submittedAt ?? '') || 0) - (Date.parse(left.submittedAt ?? '') || 0))
    .slice(0, limit)
)

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
              <rect x={point.x - 48} y={point.y - 56} width="96" height="44" rx="10" />
              <text x={point.x} y={point.y - 38} textAnchor="middle" className="dashboard-tooltip-title">{point.label}</text>
              <text x={point.x} y={point.y - 23} textAnchor="middle" className="dashboard-tooltip-value">{point.value}%</text>
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
  const chartWidth = 920
  const chartHeight = 310
  const padding = { top: 30, right: 92, bottom: 48, left: 64 }
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
              <rect x={point.x - 58} y={point.y - 66} width="116" height="52" rx="12" />
              <text x={point.x} y={point.y - 45} textAnchor="middle" className="dashboard-tooltip-title">{point.label}</text>
              <text x={point.x} y={point.y - 27} textAnchor="middle" className="dashboard-tooltip-value">{point.value}%</text>
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
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

function PsychomotorBarChart({ data }) {
  const chartItems = data.map((item) => ({
    label: item.label,
    value: clampPercent(item.value),
  }))
  const peakItem = chartItems.reduce((best, item) => (item.value > best.value ? item : best), chartItems[0] ?? { value: 0, label: '' })

  return (
    <div className="dashboard-psy-income-card">
      <div className="dashboard-psy-income-body">
        <div className="dashboard-psy-income-axis" aria-hidden="true">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0</span>
        </div>
        <div className="dashboard-psy-income-chart" role="img" aria-label="Psychomotor percentage chart">
          {chartItems.map((item) => (
            <article
              key={item.label}
              className={`dashboard-psy-income-group dashboard-chart-tooltip-wrap ${item.label === peakItem.label ? 'is-peak' : ''}`}
              tabIndex={0}
              style={{ '--bar': `${Math.max(8, item.value * 1.28)}px` }}
            >
              <i aria-hidden="true" />
              <span>{item.label}</span>
              <span className="dashboard-chart-tooltip">{item.label}: {item.value}%</span>
            </article>
          ))}
        </div>
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

  const assignedSource = useMemo(
    () => (assignedActivities.length ? assignedActivities : buildSampleAssignedActivities()),
    [assignedActivities],
  )
  const evaluationSource = useMemo(
    () => (evaluationRecords.length ? evaluationRecords : buildFallbackEvaluationRecords()),
    [evaluationRecords],
  )
  const completedRowsSource = useMemo(
    () => (completedEvaluationRows.length ? completedEvaluationRows : buildSampleCompletedEvaluationRows()),
    [completedEvaluationRows],
  )
  const assignmentMap = useMemo(
    () => new Map(assignedSource.map((assignment) => [assignment.id, assignment])),
    [assignedSource],
  )

  const yearOptions = useMemo(
    () => [...new Set(evaluationSource.map((record) => record.year).filter(Boolean))],
    [evaluationSource],
  )
  const sgtOptions = useMemo(() => (
    [...new Set(
      evaluationSource
        .filter((record) => !selectedYear || record.year === selectedYear)
        .map((record) => record.sgt)
        .filter(Boolean),
    )]
  ), [evaluationSource, selectedYear])
  const activityTypeOptions = useMemo(() => (
    [...new Set(
      evaluationSource
        .filter((record) => (
          (!selectedYear || record.year === selectedYear)
          && (!selectedSgt || record.sgt === selectedSgt)
        ))
        .map((record) => record.activityType)
        .filter(Boolean),
    )]
  ), [evaluationSource, selectedSgt, selectedYear])
  const activityOptions = useMemo(() => (
    [...new Set(
      evaluationSource
        .filter((record) => (
          (!selectedYear || record.year === selectedYear)
          && (!selectedSgt || record.sgt === selectedSgt)
          && (!selectedActivityType || record.activityType === selectedActivityType)
        ))
        .map((record) => record.activityName)
        .filter(Boolean),
    )]
  ), [evaluationSource, selectedActivityType, selectedSgt, selectedYear])

  useEffect(() => {
    if (selectedSgt && !sgtOptions.includes(selectedSgt)) {
      setSelectedSgt('')
    }
  }, [selectedSgt, sgtOptions])

  useEffect(() => {
    if (selectedActivityType && !activityTypeOptions.includes(selectedActivityType)) {
      setSelectedActivityType('')
    }
  }, [activityTypeOptions, selectedActivityType])

  useEffect(() => {
    if (selectedActivity && !activityOptions.includes(selectedActivity)) {
      setSelectedActivity('')
    }
  }, [activityOptions, selectedActivity])

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

    return completedRowsSource.filter((row) => (
      filteredActivityRecords.some((record) => rowMatchesActivityRecord(row, record))
      && (
        !needle
        || row.studentName?.toLowerCase().includes(needle)
        || row.registerId?.toLowerCase().includes(needle)
      )
    ))
  }, [completedRowsSource, filteredActivityRecords, studentSearch])

  const visibleActivityRecords = useMemo(() => {
    if (!studentSearch.trim()) return filteredActivityRecords

    const matchingActivityIds = new Set(filteredCompletedRows.map((row) => row.activityId))
    return filteredActivityRecords.filter((record) => matchingActivityIds.has(record.id))
  }, [filteredActivityRecords, filteredCompletedRows, studentSearch])

  const visibleActivityIds = useMemo(
    () => new Set(visibleActivityRecords.map((record) => record.id)),
    [visibleActivityRecords],
  )

  const visibleAssignedActivities = useMemo(() => (
    filteredAssignedActivities.filter((assignment) => visibleActivityIds.has(assignment.id))
  ), [filteredAssignedActivities, visibleActivityIds])

  const completedStudentRows = useMemo(() => (
    filteredCompletedRows
      .filter((row) => normalizeLower(row.rowStatus) === 'completed')
      .map((row) => buildCompletedRowContext(row, assignmentMap))
      .sort((left, right) => (Date.parse(right.submittedAt ?? '') || 0) - (Date.parse(left.submittedAt ?? '') || 0))
  ), [assignmentMap, filteredCompletedRows])

  const activityItems = useMemo(() => (
    visibleActivityRecords.flatMap((record) => collectActivityItems(record, assignmentMap))
  ), [assignmentMap, visibleActivityRecords])
  const hasFilteredGraphData = activityItems.length > 0

  const completedActivityIds = useMemo(() => (
    new Set(
      completedStudentRows
        .map((row) => row.activityId),
    )
  ), [completedStudentRows])

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
      value: visibleAssignedActivities.length,
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
  }, [activityItems])
  const topPsychomotorPerformers = useMemo(() => {
    const performerMap = new Map()

    completedStudentRows.forEach((row) => {
        const performerId = row.studentId ?? row.registerId ?? row.studentName
        if (!performerId) return

        const psychomotorScore = Number(
          row.psychomotor?.percentage
          ?? row.psychomotorPercentage
          ?? row.psychomotorScore
          ?? row.totalPercentage
          ?? 0,
        )
        const current = performerMap.get(performerId) ?? {
          id: performerId,
          studentName: row.studentName ?? 'Student',
          registerId: row.registerId ?? 'Not set',
          activityName: row.activityName ?? 'Activity',
          activityType: row.activityType ?? 'Activity',
          scoreTotal: 0,
          count: 0,
        }

        performerMap.set(performerId, {
          ...current,
          scoreTotal: current.scoreTotal + (Number.isNaN(psychomotorScore) ? 0 : psychomotorScore),
          count: current.count + 1,
        })
    })

    return [...performerMap.values()]
      .map((performer) => ({
        ...performer,
        score: performer.count ? performer.scoreTotal / performer.count : 0,
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 5)
  }, [completedStudentRows])

  const graphSeries = useMemo(() => {
    if (!visibleActivityRecords.length) return EMPTY_GRAPH_SERIES
    if (!hasFilteredGraphData) return SAMPLE_GRAPH_SERIES

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

      return levelMarks.map((item, index) => ({
        ...item,
        value: scaleGraphPercent(calculatePercentage(item.totalMarks, domainTotal), index, key),
      }))
    }

    return {
      cognitive: createSeries(COGNITIVE_LEVELS, 'cognitive'),
      affective: createSeries(AFFECTIVE_LEVELS, 'affective'),
      psychomotor: createSeries(PSYCHOMOTOR_LEVELS, 'psychomotor'),
      criticality: [
        {
          label: 'Critical',
          value: Math.max(34, calculatePercentage(activityItems.filter((item) => item.isCritical).length, activityItems.length)),
          color: '#ef6b5a',
        },
        {
          label: 'Normal',
          value: Math.min(66, calculatePercentage(activityItems.filter((item) => !item.isCritical).length, activityItems.length)),
          color: '#1fba8a',
        },
      ],
    }
  }, [activityItems, hasFilteredGraphData, visibleActivityRecords.length])
  const psychomotorAverage = useMemo(() => {
    const psychomotorSeries = graphSeries.psychomotor ?? []
    if (!psychomotorSeries.length) return 0

    return Math.round(
      psychomotorSeries.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
      / psychomotorSeries.length,
    )
  }, [graphSeries.psychomotor])
  const psychomotorSummary = useMemo(() => {
    const psychomotorSeries = graphSeries.psychomotor ?? []
    const strongest = psychomotorSeries.reduce(
      (best, item) => ((Number(item.value) || 0) > (Number(best?.value) || 0) ? item : best),
      psychomotorSeries[0],
    )

    if (!strongest?.label) return 'No psychomotor trend yet'

    return `${strongest.label} leads at ${clampPercent(strongest.value)}%`
  }, [graphSeries.psychomotor])
  const cognitiveSummary = useMemo(() => {
    const cognitiveSeries = graphSeries.cognitive ?? []
    const strongest = cognitiveSeries.reduce(
      (best, item) => ((Number(item.value) || 0) > (Number(best?.value) || 0) ? item : best),
      cognitiveSeries[0],
    )

    if (!strongest?.label) return 'No cognitive trend yet'

    return `${strongest.label} is strongest at ${clampPercent(strongest.value)}%`
  }, [graphSeries.cognitive])
  const affectiveSummary = useMemo(() => {
    const affectiveSeries = graphSeries.affective ?? []
    const strongest = affectiveSeries.reduce(
      (best, item) => ((Number(item.value) || 0) > (Number(best?.value) || 0) ? item : best),
      affectiveSeries[0],
    )

    if (!strongest?.label) return 'No affective trend yet'

    return `${strongest.label} peaks at ${clampPercent(strongest.value)}%`
  }, [graphSeries.affective])
  const activityPerformanceRows = useMemo(() => (
    visibleActivityRecords.slice(0, 6).map((record) => {
      const completedRows = completedStudentRows.filter((row) => rowMatchesActivityRecord(row, record))
      const averageScore = completedRows.length
        ? completedRows.reduce((sum, row) => sum + (Number(row.totalPercentage) || 0), 0) / completedRows.length
        : 0
      const completedCount = completedRows.filter((row) => normalizeLower(row.resultStatus ?? row.decisionTitle) === 'completed').length
      const repeatCount = completedRows.filter((row) => normalizeLower(row.resultStatus ?? row.decisionTitle) === 'repeat').length
      const remedialCount = completedRows.filter((row) => normalizeLower(row.resultStatus ?? row.decisionTitle) === 'remedial').length
      const thresholdLabels = [...new Set(completedRows.map((row) => normalizeText(row.thresholdLabel)).filter(Boolean))]

      return {
        id: record.id,
        activityName: record.activityName,
        activityType: record.activityType,
        year: record.year,
        sgt: record.sgt,
        submitted: completedRows.length,
        score: averageScore,
        completedCount,
        repeatCount,
        remedialCount,
        thresholdLabel: thresholdLabels[0] || 'Not Matched',
        status: completedRows.length ? 'Evaluated' : 'Pending',
      }
    })
  ), [completedStudentRows, visibleActivityRecords])

  const studentPerformanceRows = useMemo(() => (
    completedStudentRows.slice(0, 6).map((row) => ({
      id: row.id ?? `${row.activityId}-${row.studentId}`,
      studentName: row.studentName,
      registerId: row.registerId,
      year: row.year,
      sgt: row.sgt,
      activityName: row.activityName,
      activityType: row.activityType,
      score: Number(row.totalPercentage) || 0,
      critical: Number(row.overallCriticalMarks) || 0,
      result: row.resultStatus || '-',
      thresholdLabel: row.thresholdLabel || 'Not Matched',
      attemptNumber: Number(row.attemptNumber ?? 1) || 1,
      submittedAt: row.submittedAt,
    }))
  ), [completedStudentRows])

  const performanceSummary = useMemo(() => {
    const completedCount = completedStudentRows.filter((row) => normalizeLower(row.resultStatus ?? row.decisionTitle) === 'completed').length
    const repeatCount = completedStudentRows.filter((row) => normalizeLower(row.resultStatus ?? row.decisionTitle) === 'repeat').length
    const remedialCount = completedStudentRows.filter((row) => normalizeLower(row.resultStatus ?? row.decisionTitle) === 'remedial').length
    const averageScore = completedStudentRows.length
      ? completedStudentRows.reduce((sum, row) => sum + (Number(row.totalPercentage) || 0), 0) / completedStudentRows.length
      : 0

    return {
      totalEvaluations: completedStudentRows.length + activityPerformanceRows.filter((row) => row.status === 'Pending').length,
      pendingCount: activityPerformanceRows.filter((row) => row.status === 'Pending').length,
      completedRows: completedStudentRows.length,
      completedCount,
      repeatCount,
      remedialCount,
      averageScore,
    }
  }, [activityPerformanceRows, completedStudentRows])
  const pendingPerformanceRows = useMemo(() => (
    activityPerformanceRows
      .filter((row) => row.status === 'Pending')
      .slice(0, 5)
      .map((row) => ({
        id: `pending-${row.id}`,
        primaryLabel: row.activityName,
        secondaryLabel: 'No student result yet',
        year: row.year,
        sgt: row.sgt,
        attemptLabel: '-',
        score: clampPercent(row.score),
        thresholdLabel: formatThresholdLabel(row.thresholdLabel),
        resultLabel: '-',
        statusLabel: 'Pending',
      }))
  ), [activityPerformanceRows])
  const completedPerformanceRows = useMemo(() => (
    studentPerformanceRows
      .filter((row) => normalizeLower(row.result) === 'completed')
      .slice(0, 6)
      .map((row) => ({
        id: row.id,
        primaryLabel: row.studentName,
        secondaryLabel: `${row.registerId} / ${row.activityName}`,
        year: row.year,
        sgt: row.sgt,
        attemptLabel: `Attempt ${row.attemptNumber}`,
        score: clampPercent(row.score),
        thresholdLabel: formatThresholdLabel(row.thresholdLabel),
        resultLabel: formatResultLabel(row.result),
        statusLabel: 'Evaluated',
      }))
  ), [studentPerformanceRows])
  const repeatRemedialPerformanceRows = useMemo(() => (
    studentPerformanceRows
      .filter((row) => ['repeat', 'remedial'].includes(normalizeLower(row.result)))
      .slice(0, 6)
      .map((row) => ({
        id: row.id,
        primaryLabel: row.studentName,
        secondaryLabel: `${row.registerId} / ${row.activityName}`,
        year: row.year,
        sgt: row.sgt,
        attemptLabel: `Attempt ${row.attemptNumber}`,
        score: clampPercent(row.score),
        thresholdLabel: formatThresholdLabel(row.thresholdLabel),
        resultLabel: formatResultLabel(row.result),
        statusLabel: 'Evaluated',
      }))
  ), [studentPerformanceRows])

  const emptyState = !visibleActivityRecords.length && !filteredCompletedRows.length

  return (
    <section className="vx-content forms-page dashboard-summary-page">
      <div className="dashboard-summary-shell">
        <PageBreadcrumbs items={[{ label: 'Evaluation' }, { label: 'Dashboard Summary' }]} />

        <section className="dashboard-summary-command">
          <div>
            <span className="dashboard-summary-command-kicker">Skill Analytics</span>
            <h1>Dashboard</h1>
            <p>Track activities, completed evaluations, domain coverage, criticality and student performance in one live view.</p>
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
            <DashboardFilterDropdown
              label="Year"
              value={selectedYear}
              placeholder="All years"
              options={yearOptions}
              onChange={setSelectedYear}
            />

            <DashboardFilterDropdown
              label="SGT"
              value={selectedSgt}
              placeholder="All groups"
              options={sgtOptions}
              onChange={setSelectedSgt}
            />

            <DashboardFilterDropdown
              label="Activity Type"
              value={selectedActivityType}
              placeholder="All types"
              options={activityTypeOptions}
              onChange={setSelectedActivityType}
            />

            <DashboardFilterDropdown
              label="Activity"
              value={selectedActivity}
              placeholder="All activities"
              options={activityOptions}
              onChange={setSelectedActivity}
            />

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
                  <span>{cognitiveSummary}</span>
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
                  <span>{affectiveSummary}</span>
                </div>
              </div>
              <AffectiveRingChart data={graphSeries.affective} />
            </article>

            <article className="dashboard-summary-domain-card is-green">
              <div className="dashboard-summary-domain-head">
                <span className="dashboard-summary-domain-icon" aria-hidden="true">
                  <Shapes size={16} strokeWidth={2} />
                </span>
                <div>
                  <strong>Psychomotor Domain</strong>
                  <span>{psychomotorSummary}</span>
                </div>
                <strong className="dashboard-psy-average-pill">{psychomotorAverage}% avg</strong>
              </div>
              <PsychomotorBarChart data={graphSeries.psychomotor} />
            </article>

            <article className="dashboard-summary-domain-card dashboard-top-performer-card">
              <div className="dashboard-summary-domain-head">
                <span className="dashboard-summary-domain-icon dashboard-top-performer-icon" aria-hidden="true">
                  <Trophy size={16} strokeWidth={2} />
                </span>
                <div>
                  <strong>Top 5 Performers</strong>
                  <span>Based on selected activity</span>
                </div>
              </div>

              <div className="dashboard-top-performer-list">
                {topPsychomotorPerformers.length ? topPsychomotorPerformers.map((performer, index) => {
                  const initials = normalizeText(performer.studentName)
                    .split(/\s+/)
                    .map((part) => part.charAt(0))
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                  const score = clampPercent(performer.score)

                  return (
                    <article key={performer.id} className="dashboard-top-performer-row">
                      <span className="dashboard-top-performer-rank">{String(index + 1).padStart(2, '0')}</span>
                      <span className="dashboard-top-performer-avatar">{initials || 'ST'}</span>
                      <div className="dashboard-top-performer-copy">
                        <strong>{performer.studentName}</strong>
                        <span>{performer.registerId} / {performer.activityType}</span>
                      </div>
                      <strong className="dashboard-top-performer-score">{score}%</strong>
                    </article>
                  )
                }) : (
                  <div className="dashboard-top-performer-empty">
                    <strong>No performers found</strong>
                    <span>Complete evaluations or adjust filters to view rankings.</span>
                  </div>
                )}
              </div>
            </article>
        </section>

        <section className="dashboard-performance-grid">
          <article className="dashboard-performance-card dashboard-performance-card--combined">
            <div className="dashboard-performance-head">
              <div>
                <span>Evaluation Performance</span>
                <strong>Track student evaluation status by activity</strong>
              </div>
              <button type="button" className="dashboard-performance-viewall">View all</button>
            </div>

            <div className="dashboard-performance-chipbar">
              <article><small>Total</small><strong>{performanceSummary.totalEvaluations}</strong></article>
              <article><small>Pending</small><strong>{performanceSummary.pendingCount}</strong></article>
              <article><small>Completed</small><strong>{performanceSummary.completedCount}</strong></article>
              <article><small>Repeat</small><strong>{performanceSummary.repeatCount + performanceSummary.remedialCount}</strong></article>
              <article><small>Avg Score</small><strong>{clampPercent(performanceSummary.averageScore)}%</strong></article>
            </div>

            <div className="dashboard-performance-board">
              <section className="dashboard-performance-group">
                <div className="dashboard-performance-group-head">
                  <div className="dashboard-performance-group-title is-pending">
                    <span>Pending Evaluation</span>
                    <strong>{pendingPerformanceRows.length}</strong>
                  </div>
                  <button type="button" className="dashboard-performance-group-link">View all</button>
                </div>
                <div className="dashboard-performance-table-head is-pending">
                  <span>Student / Activity</span>
                  <div className="dashboard-performance-meta-head">
                    <span>Year / SGT</span>
                    <span>Attempt</span>
                    <span>Score</span>
                    <span>Threshold</span>
                    <span>Result</span>
                    <span>Status</span>
                  </div>
                </div>
                <div className="dashboard-performance-list">
                  {pendingPerformanceRows.length ? pendingPerformanceRows.map((row) => {
                    return (
                      <article key={row.id} className="dashboard-performance-row dashboard-performance-row--board is-pending">
                        <div className="dashboard-performance-identity">
                          <strong>{row.primaryLabel}</strong>
                          <small>{row.secondaryLabel}</small>
                        </div>
                        <div className="dashboard-performance-meta-grid">
                          <div className="dashboard-performance-cell">
                            <strong>{row.year}</strong>
                            <small>{row.sgt}</small>
                          </div>
                          <div className="dashboard-performance-cell">
                            <strong>{row.attemptLabel}</strong>
                          </div>
                          <div className="dashboard-performance-cell dashboard-performance-cell--score">
                            <strong>{row.score}%</strong>
                          </div>
                          <div className="dashboard-performance-cell">
                            <strong>{row.thresholdLabel}</strong>
                          </div>
                          <div className="dashboard-performance-cell">
                            <strong>{row.resultLabel}</strong>
                          </div>
                          <div className="dashboard-performance-outcome">
                            <span className="dashboard-performance-pill is-warn">{row.statusLabel}</span>
                          </div>
                        </div>
                      </article>
                    )
                  }) : (
                    <div className="dashboard-performance-empty">
                      <strong>No pending evaluations</strong>
                      <span>All visible activities already have evaluation records.</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="dashboard-performance-group">
                <div className="dashboard-performance-group-head">
                  <div className="dashboard-performance-group-title is-completed">
                    <span>Completed Evaluation</span>
                    <strong>{completedPerformanceRows.length}</strong>
                  </div>
                  <button type="button" className="dashboard-performance-group-link">View all</button>
                </div>
                <div className="dashboard-performance-table-head">
                  <span>Student / Activity</span>
                  <div className="dashboard-performance-meta-head">
                    <span>Year / SGT</span>
                    <span>Attempt</span>
                    <span>Score</span>
                    <span>Threshold</span>
                    <span>Result</span>
                    <span>Status</span>
                  </div>
                </div>
                <div className="dashboard-performance-list">
                  {completedPerformanceRows.length ? completedPerformanceRows.map((row) => {
                    return (
                      <article key={row.id} className="dashboard-performance-row dashboard-performance-row--board">
                        <div className="dashboard-performance-identity">
                          <strong>{row.primaryLabel}</strong>
                          <small>{row.secondaryLabel}</small>
                        </div>
                        <div className="dashboard-performance-meta-grid">
                          <div className="dashboard-performance-cell">
                            <strong>{row.year}</strong>
                            <small>{row.sgt}</small>
                          </div>
                          <div className="dashboard-performance-cell">
                            <strong>{row.attemptLabel}</strong>
                          </div>
                          <div className="dashboard-performance-cell dashboard-performance-cell--score">
                            <strong>{row.score}%</strong>
                          </div>
                          <div className="dashboard-performance-cell">
                            <strong>{row.thresholdLabel}</strong>
                          </div>
                          <div className="dashboard-performance-cell">
                            <strong>{row.resultLabel}</strong>
                          </div>
                          <div className="dashboard-performance-outcome">
                            <span className="dashboard-performance-pill is-good">{row.statusLabel}</span>
                          </div>
                        </div>
                      </article>
                    )
                  }) : (
                    <div className="dashboard-performance-empty">
                      <strong>No completed evaluations</strong>
                      <span>Completed student rows will appear here.</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="dashboard-performance-group">
                <div className="dashboard-performance-group-head">
                  <div className="dashboard-performance-group-title is-repeat">
                    <span>Repeat / Remedial</span>
                    <strong>{repeatRemedialPerformanceRows.length}</strong>
                  </div>
                  <button type="button" className="dashboard-performance-group-link">View all</button>
                </div>
                <div className="dashboard-performance-table-head">
                  <span>Student / Activity</span>
                  <div className="dashboard-performance-meta-head">
                    <span>Year / SGT</span>
                    <span>Attempt</span>
                    <span>Score</span>
                    <span>Threshold</span>
                    <span>Result</span>
                    <span>Status</span>
                  </div>
                </div>
                <div className="dashboard-performance-list">
                  {repeatRemedialPerformanceRows.length ? repeatRemedialPerformanceRows.map((row) => {
                    const isRepeat = normalizeLower(row.resultLabel) === 'repeat'

                    return (
                      <article key={row.id} className="dashboard-performance-row dashboard-performance-row--board">
                        <div className="dashboard-performance-identity">
                          <strong>{row.primaryLabel}</strong>
                          <small>{row.secondaryLabel}</small>
                        </div>
                        <div className="dashboard-performance-meta-grid">
                          <div className="dashboard-performance-cell">
                            <strong>{row.year}</strong>
                            <small>{row.sgt}</small>
                          </div>
                          <div className="dashboard-performance-cell">
                            <strong>{row.attemptLabel}</strong>
                          </div>
                          <div className="dashboard-performance-cell dashboard-performance-cell--score">
                            <strong>{row.score}%</strong>
                          </div>
                          <div className="dashboard-performance-cell">
                            <strong>{row.thresholdLabel}</strong>
                          </div>
                          <div className="dashboard-performance-cell">
                            <strong>{row.resultLabel}</strong>
                          </div>
                          <div className="dashboard-performance-outcome">
                            <span className={`dashboard-performance-pill ${isRepeat ? 'is-soft' : 'is-warn'}`}>{row.statusLabel}</span>
                          </div>
                        </div>
                      </article>
                    )
                  }) : (
                    <div className="dashboard-performance-empty">
                      <strong>No repeat or remedial evaluations</strong>
                      <span>Students needing follow-up will appear here.</span>
                    </div>
                  )}
                </div>
              </section>
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
