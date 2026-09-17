import { useEffect, useId, useRef, useState } from 'react'
import './SkillFocusCoverageGraph.css'

/** @param {{items: Array<{label: string, value: number, percentage: number}>}} props All skill categories, including zero values. */
export default function SkillFocusCoverageGraph({ items }) {
  const root = useRef(null)
  const tooltipId = useId()
  const [width, setWidth] = useState(800)
  const [active, setActive] = useState(null)
  useEffect(() => {
    const element = root.current
    const measure = () => setWidth(Math.max(1, element.clientWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    const dismiss = event => { if (!element.contains(event.target)) setActive(null) }
    document.addEventListener('pointerdown', dismiss)
    return () => { observer.disconnect(); document.removeEventListener('pointerdown', dismiss) }
  }, [])
  const plotWidth = Math.max(1, width - 48)
  const columnWidth = plotWidth / Math.max(1, items.length)
  // Stagger short labels on narrow screens without splitting or scrolling the graph.
  const labelRows = Math.min(items.length || 1, Math.max(1, Math.ceil(56 / columnWidth)))
  const labelWidth = columnWidth * labelRows
  const characterLimit = Math.max(3, Math.min(6, Math.floor(labelWidth / 7) - 1))
  const chartHeight = 168 + labelRows * 40
  const points = items.map((item, i) => ({ ...item, x: 36 + (i + .5) * columnWidth, y: 160 - Math.max(0, Math.min(100, item.percentage)) * 1.4 }))
  const activePoint = points.find(point => point.label === active)
  const line = points.map((point, i) => (i ? ' L ' : 'M ') + point.x + ' ' + point.y).join('')
  const area = points.length ? line + ' L ' + points.at(-1).x + ' 160 L ' + points[0].x + ' 160 Z' : ''
  const tooltipWidth = Math.min(208, width)
  return <div ref={root} className="skill-coverage clg-skill-content" aria-label="Skill focus coverage">
    <svg viewBox={'0 0 ' + width + ' ' + chartHeight} role="group" aria-label="All skill focus categories in one chart">
      {[0, 20, 40, 60, 80, 100].map(value => <g key={value} aria-hidden="true">
        <line className="skill-coverage-grid" x1="36" x2={width - 12} y1={160 - value * 1.4} y2={160 - value * 1.4} />
        <text x="28" y={164 - value * 1.4} textAnchor="end">{value}%</text>
      </g>)}
      <path className="skill-coverage-area" d={area} />
      <path className="skill-coverage-line" d={line} />
      {points.map((point, index) => {
        const labelY = 184 + (index % labelRows) * 40
        const shortLabel = point.label.length > characterLimit ? point.label.slice(0, characterLimit) + '…' : point.label
        const labelX = Math.max(labelWidth / 2, Math.min(width - labelWidth / 2, point.x))
        return <g key={point.label} tabIndex={0} className={'skill-coverage-point ' + (active === point.label ? 'is-active' : '')}
          onPointerEnter={() => setActive(point.label)}
          onPointerLeave={event => { if (document.activeElement !== event.currentTarget) setActive(null) }}
          onFocus={() => setActive(point.label)} onBlur={() => setActive(null)}
          onClick={() => setActive(point.label)}
          onKeyDown={event => { if (event.key === 'Escape') { setActive(null); event.stopPropagation() } }}
          aria-describedby={active === point.label ? tooltipId : undefined}
          aria-label={point.label + ': ' + point.percentage + ' percent, ' + point.value + ' questions'}>
          <circle className="skill-coverage-hit" cx={point.x} cy={point.y} r="10" />
          <circle cx={point.x} cy={point.y} r={active === point.label ? 5 : 3} />
          <text className="skill-coverage-label" x={labelX} y={labelY} textAnchor="middle">{shortLabel}</text>
          <text x={labelX} y={labelY + 16} textAnchor="middle">{point.percentage}%</text>
        </g>
      })}
    </svg>
    {activePoint && <div id={tooltipId} role="tooltip" className="skill-coverage-tooltip" style={{ width: tooltipWidth, left: Math.max(0, Math.min(width - tooltipWidth, activePoint.x - tooltipWidth / 2)), top: Math.max(0, activePoint.y - 76) }}>
      <strong>{activePoint.label}</strong>
      <span>{activePoint.percentage}% · {activePoint.value} {activePoint.value === 1 ? 'Question' : 'Questions'}</span>
    </div>}
  </div>
}
