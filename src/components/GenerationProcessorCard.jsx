import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, Sparkles } from 'lucide-react'
import './GenerationProcessorCard.css'

const DEFAULT_PAGE_SIZE = 4

export default function GenerationProcessorCard({
  rows = [],
  title = 'Generation processor',
  pageSize = DEFAULT_PAGE_SIZE,
  className = '',
}) {
  const [pageIndex, setPageIndex] = useState(0)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))

  useEffect(() => {
    setPageIndex((current) => Math.min(current, totalPages - 1))
  }, [totalPages])

  const visibleRows = useMemo(() => {
    const start = pageIndex * pageSize
    return rows.slice(start, start + pageSize)
  }, [pageIndex, pageSize, rows])

  if (!rows.length) return null

  return (
    <section className={`generation-processor-card ${className}`.trim()} aria-live="polite">
      <div className="generation-processor-head">
        <span className="generation-processor-icon" aria-hidden="true">
          <Sparkles size={15} strokeWidth={2.3} />
        </span>
        <strong>{title}</strong>
      </div>

      <div className="generation-processor-list">
        {visibleRows.map((row) => {
          const percent = Math.max(0, Math.min(100, Math.round(row.percent ?? 0)))
          const isComplete = row.status === 'Completed'
          const isFailed = row.status === 'Failed'
          return (
            <button
              key={row.id}
              type="button"
              className={`generation-processor-row ${isComplete ? 'is-complete' : ''} ${isFailed ? 'is-failed' : ''}`}
              onClick={row.onClick}
              disabled={!row.onClick}
              title={`${row.typeLabel} ${row.idLabel} - ${row.status}`}
            >
              <span className="generation-processor-row-main">
                <span className="generation-processor-type">{row.typeLabel}</span>
                <span className="generation-processor-id">{row.idLabel}</span>
              </span>
              <span className="generation-processor-status">
                <span className="generation-processor-bar" aria-hidden="true">
                  <i style={{ width: `${percent}%` }} />
                </span>
                <span className="generation-processor-ring" aria-label={`${percent}% ${row.status}`}>
                  {isComplete ? (
                    <CheckCircle2 size={14} strokeWidth={2.4} />
                  ) : (
                    <LoaderCircle size={14} strokeWidth={2.3} />
                  )}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="generation-processor-foot">
        <button
          type="button"
          onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
          disabled={pageIndex === 0}
        >
          <ChevronLeft size={13} strokeWidth={2.5} />
          Previous
        </button>
        <span>Page {pageIndex + 1}/{totalPages}</span>
        <button
          type="button"
          onClick={() => setPageIndex((current) => Math.min(totalPages - 1, current + 1))}
          disabled={pageIndex >= totalPages - 1}
        >
          Next
          <ChevronRight size={13} strokeWidth={2.5} />
        </button>
      </div>
    </section>
  )
}
