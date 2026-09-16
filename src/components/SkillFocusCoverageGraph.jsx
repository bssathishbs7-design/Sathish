import { useEffect, useRef, useState } from 'react'
import './SkillFocusCoverageGraph.css'

/** @param {{items: Array<{label: string, value: number, percentage: number}>}} props All skill categories, including zero values. */
export default function SkillFocusCoverageGraph({ items }) {
  const root = useRef(null)
  const [width, setWidth] = useState(800)
  const [active, setActive] = useState(null)
  useEffect(() => {
    const element = root.current
    const measure = () => setWidth(Math.max(1, element.clientWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const plotWidth = Math.max(1, width - 48)
  const compactLabels = plotWidth / Math.max(1, items.length) < 56
  const chartHeight = compactLabels ? 196 : 176
  const points = items.map((item, i) => ({ ...item, x: 36 + (i + .5) * plotWidth / items.length, y: 160 - Math.max(0, Math.min(100, item.percentage)) * 1.4 }))
  const line = points.map((point, i) => (i ? ' L ' : 'M ') + point.x + ' ' + point.y).join('')
  const area = points.length ? line + ' L ' + points.at(-1).x + ' 160 L ' + points[0].x + ' 160 Z' : ''
  return <div ref={root} className="skill-coverage clg-skill-content" aria-label="Skill focus coverage">
    <svg viewBox={'0 0 ' + width + ' ' + chartHeight} role="group" aria-label="All skill focus categories in one chart">
      {[0, 20, 40, 60, 80, 100].map(value => <g key={value} aria-hidden="true">
        <line className="skill-coverage-grid" x1="36" x2={width - 12} y1={160 - value * 1.4} y2={160 - value * 1.4} />
        <text x="28" y={164 - value * 1.4} textAnchor="end">{value}%</text>
      </g>)}
      <path className="skill-coverage-area" d={area} />
      <path className="skill-coverage-line" d={line} />
      {points.map((point, index) => <g key={point.label} tabIndex={0} className={'skill-coverage-point ' + (active === point.label ? 'is-active' : '')} onMouseEnter={() => setActive(point.label)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(point.label)} onBlur={() => setActive(null)} aria-label={point.label + ': ' + point.percentage + ' percent, ' + point.value + ' questions'}>
        <title>{point.label}: {point.percentage}%, {point.value} questions</title>
        <circle cx={point.x} cy={point.y} r={active === point.label ? 5 : 3} />
        {compactLabels && <text x={point.x} y="184" textAnchor="middle">{index + 1}</text>}
      </g>)}
    </svg>
    <div className={'skill-coverage-labels' + (compactLabels ? ' is-compact' : '')} style={compactLabels ? undefined : { gridTemplateColumns: 'repeat(' + items.length + ', minmax(0, 1fr))' }}>
      {items.map((item, index) => <div key={item.label} tabIndex={0} className={active === item.label ? 'is-active' : ''} onMouseEnter={() => setActive(item.label)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(item.label)} onBlur={() => setActive(null)}>
        <strong>{compactLabels && <span className="skill-coverage-index">{index + 1}. </span>}{item.label}</strong>
        <span>{item.percentage}%</span><small>{item.value} {item.value === 1 ? 'question' : 'questions'}</small>
      </div>)}
    </div>
  </div>
}
