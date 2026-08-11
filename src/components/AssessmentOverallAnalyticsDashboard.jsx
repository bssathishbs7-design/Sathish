import {
  AlertTriangle,
  ArrowLeft,
  Award,
  ClipboardCheck,
  Download,
  FileQuestion,
  GraduationCap,
  LogOut,
  Moon,
  Search,
  Sun,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import '../styles/assessment-overall-analytics.css'

const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0))
const formatCount = (value) => String(Number(value) || 0).padStart(2, '0')
const ANALYTICS_FILTER_STORAGE_KEY = 'vx-assessment-overall-analytics-filters'
const MASTERY_LABELS = {
  'Direct Comprehension': 'Direct',
  'Reasoning Skills': 'Reasoning',
  'Critical Thinking': 'Critical',
  Application: 'Application',
}
const MASTERY_COLORS = ['#0f6844', '#bd8734', '#5c8cb7', '#7c73b6']

function MetricCard({ icon, label, value, helper, tone }) {
  const Icon = icon
  return (
    <article className={`aoa-metric is-${tone}`}>
      <span className="aoa-metric-icon"><Icon size={20} /></span>
      <span className="aoa-metric-copy"><small>{label}</small><strong>{value}</strong><em>{helper}</em></span>
    </article>
  )
}

function PanelHeading({ icon, title, subtitle, action }) {
  const Icon = icon
  return (
    <header className="aoa-panel-heading">
      <span className="aoa-panel-icon"><Icon size={17} /></span>
      <span><strong>{title}</strong><small>{subtitle}</small></span>
      {action}
    </header>
  )
}

function EmptyGraph({ label = 'No tagged questions available' }) {
  return <div className="aoa-empty-inline"><FileQuestion size={20} />{label}</div>
}

function MasteryGaugeGraph({ items }) {
  const [hoverLabel, setHoverLabel] = useState(null)
  if (!items.length || !items.some((item) => Number(item.value) > 0)) return <EmptyGraph />
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const largestItem = items.reduce((largest, item) => item.percentage > (largest?.percentage || -1) ? item : largest, null)
  const segments = items.map((item, index) => {
    const start = items.slice(0, index).reduce((sum, previousItem) => sum + clamp(previousItem.percentage), 0)
    return {
      ...item,
      displayLabel: MASTERY_LABELS[item.label] || item.label,
      start,
      color: MASTERY_COLORS[index % MASTERY_COLORS.length],
    }
  })
  const activeSegment = segments.find((item) => item.label === hoverLabel) || largestItem || segments[0]

  return (
    <div className="aoa-mastery-gauge" style={{ '--mastery-color': activeSegment.color }}>
      <div className="aoa-mastery-hero" aria-label={`Progress Based Mastery: ${total} questions`}>
        <div className="aoa-mastery-visual">
          <svg viewBox="0 0 220 220" role="img" aria-label={`Progress Based Mastery: ${total} questions`}>
            <circle className="aoa-mastery-track" cx="110" cy="110" r="78" />
            {segments.map((item) => {
              const segmentLength = Math.max(0, clamp(item.percentage) - 1.5)
              return item.percentage > 0 ? <circle key={item.label} className={`aoa-mastery-segment ${activeSegment.label === item.label ? 'is-active' : ''}`} style={{ '--segment-color': item.color }} cx="110" cy="110" r="78" pathLength="100" strokeDasharray={`${segmentLength} ${100 - segmentLength}`} strokeDashoffset={-item.start} tabIndex="0" onMouseEnter={() => setHoverLabel(item.label)} onMouseLeave={() => setHoverLabel(null)} onFocus={() => setHoverLabel(item.label)} onBlur={() => setHoverLabel(null)}><title>{`${item.displayLabel}: ${item.value} questions · ${item.percentage}%`}</title></circle> : null
            })}
          </svg>
          <div className="aoa-mastery-reading"><span>Your mastery</span><strong>{activeSegment.percentage}%</strong></div>
          {hoverLabel && <div className="aoa-mastery-tooltip" role="status"><strong>{activeSegment.displayLabel}</strong><span>{activeSegment.value} question{activeSegment.value === 1 ? '' : 's'} · {activeSegment.percentage}%</span></div>}
        </div>
      </div>
      <div className="aoa-mastery-legend" aria-label="Mastery category summary">
        {segments.map((item) => <span key={item.label} style={{ '--segment-color': item.color }}><i /><em>{item.displayLabel}</em><b>{item.percentage}%</b></span>)}
      </div>
    </div>
  )
}

function ThinkingGaugeGraph({ items }) {
  const [selectedLabel, setSelectedLabel] = useState(null)
  const [previewLabel, setPreviewLabel] = useState(null)
  if (!items.length || !items.some((item) => Number(item.value) > 0)) return <EmptyGraph />
  const hotItem = items.find((item) => /hot|higher/i.test(item.label)) || items[0]
  const activeItem = items.find((item) => item.label === previewLabel)
    || items.find((item) => item.label === selectedLabel)
    || hotItem
  const gaugePercentage = Math.max(0, Math.min(100, activeItem?.percentage || 0))
  const isHot = /hot|higher/i.test(activeItem?.label || '')
  const gaugeColor = isHot ? '#35c8a4' : '#dfb34c'
  const angle = -180 + (gaugePercentage * 1.8)
  const arcLength = 314.16
  const progressLength = (gaugePercentage / 100) * arcLength
  const gaugeTicks = [0, 25, 50, 75, 100].map((value) => {
    const angleRadians = Math.PI - ((value / 100) * Math.PI)
    const outerRadius = 112
    const innerRadius = value === 50 ? 96 : 101
    return {
      value,
      x1: 130 + Math.cos(angleRadians) * outerRadius,
      y1: 130 - Math.sin(angleRadians) * outerRadius,
      x2: 130 + Math.cos(angleRadians) * innerRadius,
      y2: 130 - Math.sin(angleRadians) * innerRadius,
    }
  })

  return (
    <div className="aoa-thinking-gauge">
      <div
        className={`aoa-gauge-visual ${isHot ? 'is-hot' : 'is-lot'}`}
        style={{
          '--gauge-color': gaugeColor,
          '--gauge-angle': `${angle}deg`,
          '--gauge-offset': progressLength,
          '--gauge-arc': arcLength,
        }}
      >
        <svg viewBox="0 0 260 160" role="img" aria-label={`${activeItem?.label || 'Thinking level'} ${gaugePercentage}%`}>
          <path className="aoa-gauge-track" d="M 30 130 A 100 100 0 0 1 230 130" />
          <path key={`arc-${activeItem?.label}`} className="aoa-gauge-progress" d="M 30 130 A 100 100 0 0 1 230 130" strokeDasharray={`${progressLength} ${arcLength}`} />
          <g className="aoa-gauge-ticks" aria-hidden="true">
            {gaugeTicks.map((tick) => <line key={tick.value} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} />)}
          </g>
          <line key={`needle-${activeItem?.label}`} className="aoa-gauge-needle" x1="130" y1="130" x2="188" y2="130" />
          <circle className="aoa-gauge-hub" cx="130" cy="130" r="8" />
          <text className="aoa-gauge-end-label" x="25" y="153">LoT</text>
          <text className="aoa-gauge-mid-label" x="130" y="13">Balanced</text>
          <text className="aoa-gauge-end-label" x="235" y="153">HoT</text>
        </svg>
        <div className="aoa-gauge-reading"><em>Current thinking focus</em><strong>{gaugePercentage}%</strong></div>
      </div>
      <div className="aoa-gauge-breakdown" aria-label="Thinking level summary">
        {items.map((item, index) => (
          <button
            type="button"
            key={item.label}
            className={activeItem?.label === item.label ? 'is-active' : ''}
            style={{ '--gauge-item-color': item.color || (/hot|higher/i.test(item.label) ? '#35c8a4' : index % 2 ? '#efc93d' : '#35c8a4') }}
            aria-pressed={selectedLabel === item.label}
            onClick={() => setSelectedLabel(item.label)}
            onMouseEnter={() => setPreviewLabel(item.label)}
            onMouseLeave={() => setPreviewLabel(null)}
            onFocus={() => setPreviewLabel(item.label)}
            onBlur={() => setPreviewLabel(null)}
          >
            <span><i /><b>{item.label}</b></span>
            <strong>{item.percentage}%</strong>
            <small>{item.value} question{item.value === 1 ? '' : 's'}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

function RadarGraph({ items, thresholds = {} }) {
  const [activePoint, setActivePoint] = useState(null)
  const [view, setView] = useState('cohort')
  if (!items.length || !items.some((item) => Number(item.value) > 0)) return <EmptyGraph />
  const size = 420
  const center = size / 2
  const radius = 138
  const count = Math.max(items.length, 3)
  const getPoint = (index, valueRadius) => {
    const angle = (-Math.PI / 2) + (index / count) * Math.PI * 2
    return { x: center + Math.cos(angle) * valueRadius, y: center + Math.sin(angle) * valueRadius }
  }
  const rings = [25, 50, 75, 100]
  const thresholdKeys = {
    Remember: 'remember',
    Understand: 'understand',
    Apply: 'apply',
    Analyse: 'analyze',
    Evaluate: 'evaluate',
  }
  const cohortItems = items.map((item) => {
    const key = thresholdKeys[item.label]
    const rawThreshold = key === 'analyze'
      ? thresholds?.analyze ?? thresholds?.analyse
      : thresholds?.[key]
    const targetPercentage = rawThreshold === '' || rawThreshold == null || !Number.isFinite(Number(rawThreshold))
      ? null
      : clamp(rawThreshold)
    return { ...item, targetPercentage }
  })
  const hasTargetSeries = cohortItems.some((item) => item.targetPercentage !== null)
  const totalQuestions = items.reduce((total, item) => total + Number(item.value || 0), 0)
  const youItems = cohortItems.map((item) => ({
    ...item,
    percentage: item.targetPercentage ?? item.percentage,
    value: item.targetPercentage == null ? item.value : Math.round((item.targetPercentage / 100) * totalQuestions),
  }))
  const chartItems = view === 'cohort' ? cohortItems : youItems
  const comparisonItems = view === 'cohort' ? youItems : cohortItems
  const dataPoints = chartItems.map((item, index) => ({ ...item, ...getPoint(index, radius * (clamp(item.percentage) / 100)) }))
  const targetPoints = hasTargetSeries
    ? comparisonItems.map((item, index) => getPoint(index, radius * (clamp(item.percentage) / 100)))
    : []
  const polygon = dataPoints.map((point) => `${point.x},${point.y}`).join(' ')
  const targetPolygon = targetPoints.map((point) => `${point.x},${point.y}`).join(' ')
  return (
    <div className="aoa-radar-wrap">
      <svg className="aoa-radar-chart" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Cognitive Levels Bloom's Taxonomy radar chart">
        {rings.map((ring) => <polygon key={ring} className="aoa-radar-grid" points={items.map((_, index) => { const point = getPoint(index, radius * ring / 100); return `${point.x},${point.y}` }).join(' ')} />)}
        {items.map((item, index) => { const point = getPoint(index, radius); return <line key={`axis-${item.label}`} className="aoa-radar-axis" x1={center} y1={center} x2={point.x} y2={point.y} /> })}
        {hasTargetSeries && <><polygon className="aoa-radar-target-area" points={targetPolygon} /><polyline className="aoa-radar-target-line" points={`${targetPolygon} ${targetPoints[0]?.x},${targetPoints[0]?.y}`} /></>}
        <polygon className="aoa-radar-area" points={polygon} />
        <polyline className="aoa-radar-line" points={`${polygon} ${dataPoints[0]?.x},${dataPoints[0]?.y}`} />
        {dataPoints.map((point) => <g key={`point-${point.label}`} className="aoa-radar-point" tabIndex="0" aria-label={`${point.label}: ${point.percentage}% · ${point.value} questions`} onMouseEnter={() => setActivePoint(point)} onMouseLeave={() => setActivePoint(null)} onFocus={() => setActivePoint(point)} onBlur={() => setActivePoint(null)}><circle cx={point.x} cy={point.y} r="12" /><circle cx={point.x} cy={point.y} r="4" /></g>)}
        {chartItems.map((item, index) => { const point = getPoint(index, radius + 28); const anchor = point.x < center - 8 ? 'end' : point.x > center + 8 ? 'start' : 'middle'; return <g key={`label-${item.label}`}><text className="aoa-radar-label" x={point.x} y={point.y - 4} textAnchor={anchor}>{item.label}</text><text className="aoa-radar-value" x={point.x} y={point.y + 13} textAnchor={anchor}>{item.percentage}% · {item.value} Qus</text></g> })}
      </svg>
      {activePoint && <div className="aoa-radar-tooltip" role="status" style={{ left: `${Math.max(18, Math.min(82, (activePoint.x / size) * 100))}%`, top: `${Math.max(12, Math.min(72, (activePoint.y / size) * 100))}%` }}><strong>{activePoint.label}</strong><span>{activePoint.percentage}% · {activePoint.value} question{activePoint.value === 1 ? '' : 's'}</span></div>}
      <div className="aoa-radar-view-switch" role="tablist" aria-label="Bloom's taxonomy comparison">
        <button type="button" role="tab" aria-selected={view === 'you'} className={view === 'you' ? 'is-active' : ''} onClick={() => setView('you')}>You</button>
        <button type="button" role="tab" aria-selected={view === 'cohort'} className={view === 'cohort' ? 'is-active' : ''} onClick={() => setView('cohort')}>Cohort avg</button>
      </div>
    </div>
  )
}

function BubbleGraph({ items }) {
  if (!items.length || !items.some((item) => Number(item.value) > 0)) return <EmptyGraph />
  const palette = ['#168d6b', '#4b7bec', '#7a58c8', '#d98b35', '#3d99ab']
  const sortedItems = [...items].sort((left, right) => right.percentage - left.percentage)
  return (
    <div className="aoa-function-bars" aria-label="Cognitive Function distribution">
      {sortedItems.map((item, index) => {
        const color = item.color || palette[index % palette.length]
        const percentage = clamp(item.percentage)
        const questionLabel = `${item.value} question${item.value === 1 ? '' : 's'}`
        return (
          <article
            key={item.label}
            style={{ '--function-color': color, '--function-value': `${percentage}%` }}
            tabIndex="0"
            aria-label={`${item.label}: ${percentage}% (${questionLabel})`}
          >
            <div className="aoa-function-bar-label">
              <i aria-hidden="true" />
              <span>{item.label}</span>
            </div>
            <div className="aoa-function-bar-metric">
              <small>{questionLabel}</small>
              <p aria-hidden="true"><b /></p>
              <strong>{percentage}%</strong>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function SkillFocusGraph({ items }) {
  const [activePoint, setActivePoint] = useState(null)
  const relevantItems = items
    .filter((item) => Number(item.value) > 0 || Number(item.percentage) > 0)
    .sort((left, right) => right.percentage - left.percentage)
  const defaultItems = items.filter((item) => !relevantItems.includes(item))
  const visibleItems = [...relevantItems, ...defaultItems].slice(0, 5)
  if (!visibleItems.length || !visibleItems.some((item) => Number(item.value) > 0)) return <EmptyGraph />
  const average = Math.round(visibleItems.reduce((sum, item) => sum + item.percentage, 0) / visibleItems.length)
  const chartWidth = 900
  const chartHeight = 320
  // Match the inner horizontal gutters so the first and last plotted categories
  // have the same visual breathing room as the labels below them.
  const bounds = { left: 64, right: 64, top: 16, bottom: 80 }
  const plotWidth = chartWidth - bounds.left - bounds.right
  const plotHeight = chartHeight - bounds.top - bounds.bottom
  const points = visibleItems.map((item, index) => ({
    ...item,
    x: bounds.left + ((visibleItems.length === 1 ? .5 : index / (visibleItems.length - 1)) * plotWidth),
    y: bounds.top + ((100 - clamp(item.percentage)) / 100 * plotHeight),
  }))
  const linePath = points.reduce((path, point, index) => {
    if (!index) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const controlX = (previous.x + point.x) / 2
    return `${path} Q ${controlX} ${previous.y}, ${point.x} ${point.y}`
  }, '')
  const areaPath = points.length ? `${linePath} L ${points[points.length - 1].x} ${bounds.top + plotHeight} L ${points[0].x} ${bounds.top + plotHeight} Z` : ''
  return (
    <div className="aoa-skill-area-chart">
      <span className="aoa-skill-average">{average}% avg</span>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Skill Focus Categories coverage chart" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="aoa-skill-area-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#26a786" stopOpacity=".28" />
            <stop offset="100%" stopColor="#26a786" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {[0, 20, 40, 60, 80, 100].map((value) => {
          const y = bounds.top + ((100 - value) / 100 * plotHeight)
          return <g key={value}><line className="aoa-skill-gridline" x1={bounds.left} x2={chartWidth - bounds.right} y1={y} y2={y} /><text className="aoa-skill-y-label" x={bounds.left - 10} y={y + 3} textAnchor="end">{value}%</text></g>
        })}
        <path className="aoa-skill-area" d={areaPath} />
        <path className="aoa-skill-line" d={linePath} />
        {points.map((item) => {
          const compactLabel = item.label.length > 16 ? `${item.label.slice(0, 15)}…` : item.label
          return <g key={item.label} className="aoa-skill-point" tabIndex="0" aria-label={`${item.label}: ${item.percentage}% · ${item.value} questions`} onMouseEnter={() => setActivePoint(item)} onMouseLeave={() => setActivePoint(null)} onFocus={() => setActivePoint(item)} onBlur={() => setActivePoint(null)}>
          <circle cx={item.x} cy={item.y} r="5" />
          <text className="aoa-skill-x-label" x={item.x} y={chartHeight - 44} textAnchor="middle">{compactLabel}</text>
          <text className="aoa-skill-value-label" x={item.x} y={chartHeight - 24} textAnchor="middle">{item.percentage}% · {item.value} Qus</text>
          </g>
        })}
      </svg>
      {activePoint && <div className="aoa-skill-tooltip" role="status" style={{ left: `${Math.max(16, Math.min(84, (activePoint.x / chartWidth) * 100))}%`, top: `${Math.min(72, Math.max(14, (activePoint.y / chartHeight) * 100 + 8))}%` }}><strong>{activePoint.label}</strong><span>{activePoint.percentage}% · {activePoint.value} questions</span></div>}
    </div>
  )
}

export function AssessmentAnalyticsGraphGrid({ tagAnalytics, bloomThresholds = {}, className = '' }) {
  return (
    <div className={`aoa-graph-grid ${className}`.trim()}>
      <article className="aoa-panel is-mastery"><PanelHeading icon={Award} title="Progress Based Mastery" subtitle="Question distribution by mastery category" /><MasteryGaugeGraph items={tagAnalytics.questionCategory} /></article>
      <article className="aoa-panel is-bloom"><PanelHeading icon={GraduationCap} title="Cognitive Levels - Bloom's Taxonomy" subtitle="Coverage across Bloom's cognitive levels" /><RadarGraph items={tagAnalytics.cognitiveLevel} thresholds={bloomThresholds} /></article>
      <article className="aoa-panel is-thinking"><PanelHeading icon={TrendingUp} title="Thinking Level" subtitle="Higher and lower order thinking balance" /><ThinkingGaugeGraph items={tagAnalytics.thinkingLevel} /></article>
      <article className="aoa-panel is-function"><PanelHeading icon={ClipboardCheck} title="Cognitive Function" subtitle="Mental processes represented by the questions" /><BubbleGraph items={tagAnalytics.cognitiveFunction} /></article>
      <article className="aoa-panel is-skill"><PanelHeading icon={Target} title="Skill Focus Categories" subtitle="Clinical and professional skill coverage" /><SkillFocusGraph items={tagAnalytics.skillFocus} /></article>
    </div>
  )
}

export default function AssessmentOverallAnalyticsDashboard({
  assessmentName, academicYear, examMode, examType, examCategory, theme, onToggleTheme, onExit,
  onBack, onDownload, rows, overallPercentage, attainmentThreshold, bloomThresholds,
  tagAnalytics, attainmentTabs, attainmentTab, onAttainmentTabChange, attainmentRows, questions, onOpenStudent,
}) {
  const storageKey = `${ANALYTICS_FILTER_STORAGE_KEY}:${assessmentName}`
  const initialFilters = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(storageKey)) || {}
    } catch {
      return {}
    }
  }, [storageKey])
  const [search, setSearch] = useState(initialFilters.search || '')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const searchContainerRef = useRef(null)

  const filteredQuestions = questions

  const completed = rows.filter((row) => row.evalStatus === 'Completed' && !row.isAbsent)
  const pending = rows.filter((row) => row.evalStatus !== 'Completed' && !row.isAbsent)
  const absent = rows.filter((row) => row.isAbsent)
  const present = rows.length - absent.length
  const achieved = completed.filter((row) => Number.parseFloat(row.percentage) >= attainmentThreshold).length
  const completionRate = present ? Math.round((completed.length / present) * 100) : 0
  const studentSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []
    return rows.filter((row) => (
      String(row.name || '').toLowerCase().includes(query)
      || String(row.id || '').toLowerCase().includes(query)
    )).slice(0, 6)
  }, [rows, search])

  useEffect(() => {
    window.sessionStorage.setItem(storageKey, JSON.stringify({ search }))
  }, [search, storageKey])

  useEffect(() => {
    if (!isSearchOpen) return undefined
    const closeOnOutsidePointer = (event) => {
      if (!searchContainerRef.current?.contains(event.target)) setIsSearchOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [isSearchOpen])

  const selectStudent = (row) => {
    setSearch(`${row.name} · ${row.id}`)
    setIsSearchOpen(false)
    onOpenStudent?.(row)
  }

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsSearchOpen(false)
      return
    }
    if (!studentSuggestions.length) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveSuggestionIndex((current) => (current + direction + studentSuggestions.length) % studentSuggestions.length)
      setIsSearchOpen(true)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      selectStudent(studentSuggestions[activeSuggestionIndex] || studentSuggestions[0])
    }
  }

  return (
    <section className="aoa-page">
      <header className="aoa-topbar">
        <div className="aoa-title">
          {typeof onBack === 'function' ? <button type="button" onClick={onBack} aria-label="Back to evaluation" title="Back to evaluation"><ArrowLeft size={18} /></button> : null}
          <div className="aoa-title-copy">
            <h1>{assessmentName}</h1>
            <p>{examCategory} / {examType} / {examMode} / {academicYear}</p>
          </div>
        </div>
        <div className="aoa-top-actions">
          <button type="button" className="is-icon" onClick={onToggleTheme} aria-label="Toggle theme">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
          <button type="button" className="is-exit" onClick={onExit}><LogOut size={16} />Exit</button>
        </div>
      </header>

      <main className="aoa-shell">
        <section className="aoa-overview" aria-label="Assessment overview">
          <div className="aoa-filterbar" aria-label="Analytics filters">
            <h2 className="aoa-filterbar-title"><span className="aoa-filterbar-title-icon"><TrendingUp size={18} /></span><span>Overall Assessment Analytics</span></h2>
            <div className="aoa-search-wrap" ref={searchContainerRef}>
              <label className="aoa-search">
                <Search size={16} />
                <input
                  role="combobox"
                  aria-label="Search students"
                  aria-autocomplete="list"
                  aria-expanded={isSearchOpen && Boolean(search.trim())}
                  aria-controls="aoa-student-suggestions"
                  aria-activedescendant={isSearchOpen && studentSuggestions.length ? `aoa-student-option-${activeSuggestionIndex}` : undefined}
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setActiveSuggestionIndex(0); setIsSearchOpen(true) }}
                  onFocus={() => setIsSearchOpen(Boolean(search.trim()))}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search student ID or name"
                />
              </label>
              {isSearchOpen && search.trim() ? (
                <div className="aoa-student-suggestions" id="aoa-student-suggestions" role="listbox" aria-label="Matching students">
                  {studentSuggestions.length ? studentSuggestions.map((row, index) => {
                    const status = row.isAbsent ? 'Absent' : row.evalStatus === 'Completed' ? 'Completed' : 'Pending'
                    return (
                      <button
                        type="button"
                        id={`aoa-student-option-${index}`}
                        role="option"
                        aria-selected={activeSuggestionIndex === index}
                        className={activeSuggestionIndex === index ? 'is-active' : ''}
                        key={row.id}
                        onMouseEnter={() => setActiveSuggestionIndex(index)}
                        onClick={() => selectStudent(row)}
                      >
                        <span><strong>{row.name}</strong><small>{row.id}</small></span>
                        <em className={`is-${status.toLowerCase()}`}>{status}</em>
                      </button>
                    )
                  }) : <p>No students match this search.</p>}
                </div>
              ) : null}
            </div>
            <button type="button" className="aoa-download" onClick={onDownload}><Download size={16} />Download report</button>
          </div>

          <div className="aoa-metrics">
            <MetricCard icon={Users} label="Total students" value={formatCount(rows.length)} helper={`${formatCount(present)} present / ${formatCount(absent.length)} absent`} tone="indigo" />
            <MetricCard icon={ClipboardCheck} label="Evaluated" value={formatCount(completed.length)} helper={`${completionRate}% complete`} tone="green" />
            <MetricCard icon={AlertTriangle} label="Pending" value={formatCount(pending.length)} helper="Awaiting evaluation" tone="amber" />
            <MetricCard icon={TrendingUp} label="Average score" value={`${formatCount(overallPercentage)}%`} helper={`${formatCount(achieved)} achieved target`} tone="violet" />
          </div>
        </section>

        <section className="aoa-learning-studio" aria-label="Learning dimension graphs">
          <section className="aoa-panel aoa-attainment-panel">
            <PanelHeading icon={Target} title="Attainment explorer" subtitle={`Target threshold ${attainmentThreshold}%`} action={<div className="aoa-tabs" role="tablist">{attainmentTabs.map((tab) => <button type="button" role="tab" key={tab.key} className={attainmentTab === tab.key ? 'is-active' : ''} onClick={() => onAttainmentTabChange(tab.key)}>{tab.label}</button>)}</div>} />
            <div className="aoa-attainment-list">{attainmentRows.length ? attainmentRows.slice(0, 10).map((row) => { const percentage = row.maxMarks ? Math.round((row.averageMarks / row.maxMarks) * 100) : 0; const attained = percentage >= attainmentThreshold; return <article key={`${attainmentTab}-${row.name}`} className={attained ? 'is-attained' : 'is-not-attained'}><span><strong title={row.name}>{row.name}</strong><small>Level {row.level}</small></span><div><i><b style={{ width: `${clamp(percentage)}%` }} /></i><em>{percentage}%</em></div><b>{attained ? 'Attained' : 'Not Attained'}</b></article> }) : <div className="aoa-empty-inline">No attainment data available.</div>}</div>
          </section>
          <AssessmentAnalyticsGraphGrid tagAnalytics={tagAnalytics} bloomThresholds={bloomThresholds} />
        </section>

        <section className="aoa-panel aoa-question-panel">
          <PanelHeading icon={FileQuestion} title="Question-level analysis" subtitle="Class Average and Level of Attainment for every question" action={<span className="aoa-insight-badge">{filteredQuestions.length} questions</span>} />
          <div className="aoa-question-table-wrap">
            <table className="aoa-question-table">
              <thead><tr><th>#</th><th>Question and competency</th><th>Type</th><th>Thinking</th><th>Max marks</th><th>Class Avg</th><th>LoA</th><th>Attainment</th></tr></thead>
              <tbody>{filteredQuestions.length ? filteredQuestions.map((question, index) => {
                const attained = question.classAveragePercentage >= attainmentThreshold
                return <tr key={question.id || `${question.title}-${index}`}>
                  <td className="aoa-question-order">{String(index + 1).padStart(2, '0')}</td>
                  <td className="aoa-question-summary"><strong title={question.title}>{question.title}</strong><small title={question.competency}>{question.competency || 'Competency not tagged'}</small></td>
                  <td><span className="aoa-question-badge">{question.typeLabel}</span></td>
                  <td><span className={`aoa-question-badge ${String(question.thinking).toLowerCase().includes('hot') ? 'is-hot' : 'is-lot'}`}>{question.thinking || '-'}</span></td>
                  <td className="aoa-question-max"><strong>{question.marks}</strong><small>marks</small></td>
                  <td className="aoa-question-stat"><strong>{Number(question.classAverageMarks || 0).toFixed(1)} / {question.marks}</strong><small>{question.classAveragePercentage}% class average</small></td>
                  <td className="aoa-question-stat"><strong>{question.loaCount} / {question.evaluatedCount}</strong><small>{question.loaPercentage}% attained</small></td>
                  <td><span className={`aoa-status ${attained ? 'is-complete' : 'is-low'}`}>{attained ? 'Attained' : 'Not attained'}</span></td>
                </tr>
              }) : <tr><td colSpan="8"><div className="aoa-empty-inline">No questions match the selected type.</div></td></tr>}</tbody>
            </table>
          </div>
        </section>
      </main>
    </section>
  )
}
