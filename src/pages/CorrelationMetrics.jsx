import { BookOpen, Clock, ChartPie, Stethoscope, FlaskConical, Layers } from 'lucide-react'
import './CorrelationMetrics.css'

const topicKey = (row) => JSON.stringify([row.year || '1st Year', row.subject, row.topic])

/**
 * Filter-aware summary of saved correlation ratings.
 * @param {{rows: Array<object>, allRows: Array<object>}} props
 * rows contains every matching competency, before pagination; allRows preserves
 * complete topic membership when a type filter matches only part of a topic.
 */
export default function CorrelationMetrics({ rows, allRows }) {
  const rated = rows.filter((row) => row.isRated).length
  const percentage = rows.length ? Math.round(rated / rows.length * 1000) / 10 : 0
  const matchingTopics = new Set(rows.map(topicKey))
  const groups = new Map()
  allRows.forEach((row) => {
    const key = topicKey(row)
    if (!matchingTopics.has(key)) return
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  })
  const classifications = { clinical: 0, para: 0, mixed: 0 }
  groups.forEach((group) => {
    if (!group.every((row) => row.isRated && ['Clinical', 'Non-Clinical'].includes(row.savedValues?.type))) return
    const types = new Set(group.map((row) => row.savedValues.type))
    classifications[types.size > 1 ? 'mixed' : types.has('Clinical') ? 'clinical' : 'para'] += 1
  })
  const cards = [
    { label: 'Competencies', value: rated.toLocaleString(), total: rows.length.toLocaleString(), note: 'Rated / total', icon: BookOpen },
    { label: 'Pending rating', value: (rows.length - rated).toLocaleString(), note: 'Competencies remaining', icon: Clock, tone: 'pending' },
    { label: 'Completion', value: `${percentage}%`, note: 'Of matching competencies', icon: ChartPie },
    { label: 'Clinical', value: classifications.clinical.toLocaleString(), note: 'Fully rated topics', icon: Stethoscope, tone: 'clinical' },
    { label: 'Para - Clinical', value: classifications.para.toLocaleString(), note: 'Fully rated topics', icon: FlaskConical, tone: 'para' },
    { label: 'Mixed', value: classifications.mixed.toLocaleString(), note: 'Topics with both types', icon: Layers, tone: 'mixed' },
  ]
  return (
    <div className="correlation-metrics" aria-label="Correlation rating summary">
      {cards.map(({ label, value, total, note, icon: MetricIcon, tone }) => (
        <article className={`correlation-metrics-card${tone ? ` is-${tone}` : ''}`} key={label} tabIndex={0} title={`${label}: ${value}${total ? ` of ${total}` : ''}. ${note}. Based on the selected filters.`}>
          <span className="correlation-metrics-icon"><MetricIcon size={16} aria-hidden="true" /></span>
          <div className="correlation-metrics-copy">
            <strong className="correlation-metrics-value">{value}{total && <small> / {total}</small>}</strong>
            <span className="correlation-metrics-label">{label}</span>
          </div>
        </article>
      ))}
    </div>
  )
}
