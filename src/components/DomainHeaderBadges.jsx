import '../styles/domain-header-badges.css'

const DEFAULT_VALUE = 'Not Applicable'
const MAX_VISIBLE_VALUE_LENGTH = 12

const domains = [
  { key: 'cognitive', label: 'Cognitive', shortLabel: 'Cog' },
  { key: 'affective', label: 'Affective', shortLabel: 'Aff' },
  { key: 'psychomotor', label: 'Psychomotor', shortLabel: 'Psy' },
]

function clampValue(value) {
  if (!value) return ''
  return value.length > MAX_VISIBLE_VALUE_LENGTH ? `${value.slice(0, MAX_VISIBLE_VALUE_LENGTH)}...` : value
}

export default function DomainHeaderBadges({ values, className = '' }) {
  return (
    <div className={`domain-header-badges ${className}`.trim()}>
      {domains.map((domain) => {
        const value = values?.[domain.key] || DEFAULT_VALUE
        const displayValue = value === DEFAULT_VALUE ? domain.label : clampValue(value)
        const title = value === DEFAULT_VALUE ? `${domain.label}: ${DEFAULT_VALUE}` : `${domain.label}: ${value}`

        return (
          <span
            key={domain.key}
            className={`domain-header-badge is-${domain.key}`}
            title={title}
          >
            <span className="domain-header-badge-key">{domain.shortLabel}</span>
            <span className="domain-header-badge-value">{displayValue}</span>
          </span>
        )
      })}
    </div>
  )
}
