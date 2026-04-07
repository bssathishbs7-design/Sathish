import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import '../styles/domain-badge-row.css'

const DEFAULT_VALUE = 'Not Applicable'
const MAX_VISIBLE_VALUE_LENGTH = 7

function clampValue(value) {
  if (!value) return ''
  return value.length > MAX_VISIBLE_VALUE_LENGTH ? `${value.slice(0, MAX_VISIBLE_VALUE_LENGTH)}...` : value
}

function DomainBadgeDropdown({ label, value = DEFAULT_VALUE, options = [], isOpen, disabled, onToggle, onSelect }) {
  const badgeTone = value === DEFAULT_VALUE ? 'is-neutral' : 'is-selected'
  const displayValue = value === DEFAULT_VALUE ? '' : value
  const domainClass = `is-${label.toLowerCase()}`
  const compactValue = clampValue(displayValue)
  const tooltipLabel = displayValue ? `${label}: ${displayValue}` : label

  return (
    <div className={`domain-badge-dropdown ${domainClass} ${isOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className={`domain-badge-trigger ${badgeTone}`}
        data-tooltip={tooltipLabel}
        onClick={(event) => {
          event.stopPropagation()
          if (disabled) return
          onToggle()
        }}
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span className="domain-badge-trigger-label">{label}</span>
        {displayValue ? <span className="domain-badge-trigger-value">{compactValue}</span> : null}
        <ChevronDown size={14} strokeWidth={2} className="domain-badge-trigger-icon" />
      </button>
      {isOpen ? (
        <div className="domain-badge-menu" onClick={(event) => event.stopPropagation()}>
          {options.map((option) => (
            <button
              key={`${label}-${option}`}
              type="button"
              className={`domain-badge-option ${option === value ? 'is-selected' : ''}`}
              onClick={(event) => {
                event.stopPropagation()
                onSelect(option)
              }}
            >
              <span className="domain-badge-option-label">{option}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function DomainBadgeRow({
  values,
  optionsMap,
  onChange,
  className = '',
  disabled = false,
}) {
  const rowRef = useRef(null)
  const [openKey, setOpenKey] = useState('')

  const domains = useMemo(() => ([
    { key: 'cognitive', label: 'Cognitive' },
    { key: 'affective', label: 'Affective' },
    { key: 'psychomotor', label: 'Psychomotor' },
  ]), [])

  useEffect(() => {
    if (!openKey) return undefined

    const handlePointerDown = (event) => {
      if (!rowRef.current?.contains(event.target)) {
        setOpenKey('')
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [openKey])

  return (
    <div ref={rowRef} className={`domain-badge-row ${className}`.trim()}>
      {domains.map((domain) => (
        <DomainBadgeDropdown
          key={domain.key}
          label={domain.label}
          value={values?.[domain.key] || DEFAULT_VALUE}
          options={optionsMap?.[domain.key] || [DEFAULT_VALUE]}
          isOpen={openKey === domain.key}
          disabled={disabled}
          onToggle={() => setOpenKey((current) => (current === domain.key ? '' : domain.key))}
          onSelect={(nextValue) => {
            onChange(domain.key, nextValue)
            setOpenKey('')
          }}
        />
      ))}
    </div>
  )
}
