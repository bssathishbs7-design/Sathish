import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Pencil,
  Search,
  Shapes,
} from 'lucide-react'
import '../styles/evaluation.css'

const formatPercent = (value) => `${Number(value ?? 0).toFixed(1).replace(/\.0$/, '')}%`
const formatMarks = (value) => {
  const numericValue = Number(value ?? 0)

  if (Number.isNaN(numericValue)) return '0'
  if (Number.isInteger(numericValue)) return String(numericValue)

  return numericValue.toFixed(2).replace(/\.?0+$/, '')
}

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const SECTION_CONFIGS = [
  { key: 'checklist', scoreHeader: 'Checklist' },
  { key: 'form', scoreHeader: 'Form' },
  { key: 'scaffolding', scoreHeader: 'Scaffold' },
]

const getThresholdTone = (value = '') => {
  const normalized = String(value).trim().toLowerCase()

  if (normalized.includes('exceed') || normalized.includes('pass') || normalized.includes('complete')) return 'is-positive'
  if (normalized.includes('below') || normalized.includes('not matched')) return 'is-warning'

  return 'is-neutral'
}

const getOutcomeTone = (value = '') => {
  const normalized = String(value).trim().toLowerCase()

  if (normalized.includes('completed')) return 'is-positive'
  if (normalized.includes('repeat')) return 'is-info'
  if (normalized.includes('remedial')) return 'is-warning'

  return 'is-neutral'
}

const getEvaluationStatusTone = (value = '') => {
  const normalized = String(value).trim().toLowerCase()

  if (normalized.includes('completed')) return 'is-positive'
  if (normalized.includes('pending')) return 'is-neutral'

  return 'is-neutral'
}

export default function CompletedEvaluationPage({
  completedEvaluationRows = [],
  activityId,
  activityRecord,
  onBackToEvaluation,
  onOpenEvaluation,
}) {
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState('studentName')
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  const sourceRows = useMemo(() => (
    activityId
      ? completedEvaluationRows.filter((row) => row.activityId === activityId)
      : completedEvaluationRows
  ), [activityId, completedEvaluationRows])

  const filteredRows = useMemo(() => {
    const needle = searchValue.trim().toLowerCase()

    return sourceRows.filter((row) => {
      const matchesFilter = statusFilter === 'all'
        || String(row.rowStatus ?? '').trim().toLowerCase() === statusFilter
      const matchesSearch = !needle
        || row.studentName?.toLowerCase().includes(needle)
        || row.registerId?.toLowerCase().includes(needle)
        || row.thresholdLabel?.toLowerCase().includes(needle)

      return matchesFilter && matchesSearch
    })
  }, [searchValue, sourceRows, statusFilter])

  const visibleSections = useMemo(() => (
    SECTION_CONFIGS.filter((section) => filteredRows.some((row) => (row[section.key]?.itemCount ?? 0) > 0))
  ), [filteredRows])

  const filterOptions = [
    { id: 'all', label: 'All', count: sourceRows.length },
    { id: 'completed', label: 'Completed', count: sourceRows.filter((row) => String(row.rowStatus ?? '').trim().toLowerCase() === 'completed').length },
    { id: 'pending', label: 'Pending', count: sourceRows.filter((row) => String(row.rowStatus ?? '').trim().toLowerCase() === 'pending').length },
  ]

  const tableHeaders = useMemo(() => ([
    { key: 'studentName', label: 'Student', sortable: true },
    { key: 'registerId', label: 'ID', sortable: true },
    ...visibleSections.flatMap((section) => ([
      { key: `${section.key}-score`, label: section.scoreHeader, sortable: true },
    ])),
    { key: 'overallCriticalMarks', label: 'Critical', sortable: true },
    { key: 'thresholdLabel', label: 'Threshold', sortable: true },
    { key: 'decisionTitle', label: 'Result', sortable: true },
    { key: 'scoreComparison', label: 'Score', sortable: true },
    { key: 'totalPercentage', label: 'Total %', sortable: true },
    { key: 'rowStatus', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false },
  ]), [visibleSections])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchValue, sortDirection, sortKey, statusFilter])

  const sortedRows = useMemo(() => {
    const getSortValue = (row, key) => {
      if (key.endsWith('-score')) {
        const sectionKey = key.replace(/-score$/, '')
        return Number(row[sectionKey]?.obtainedMarks) || 0
      }

      if (key === 'scoreComparison') return Number(row.totalObtainedMarks) || 0
      if (key === 'totalPercentage') return Number(row.totalPercentage) || 0
      if (key === 'overallCriticalMarks') return Number(row.overallCriticalMarks) || 0

      return row[key] ?? ''
    }

    return [...filteredRows].sort((left, right) => {
      const leftValue = getSortValue(left, sortKey)
      const rightValue = getSortValue(right, sortKey)

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return sortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue
      }

      return sortDirection === 'asc'
        ? String(leftValue).localeCompare(String(rightValue))
        : String(rightValue).localeCompare(String(leftValue))
    })
  }, [filteredRows, sortDirection, sortKey])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedRows.slice(startIndex, startIndex + pageSize)
  }, [currentPage, sortedRows])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setSortDirection('asc')
  }

  const handleDownloadRow = (row) => {
    const summaryRows = [
      ['Activity', row.activityName],
      ['Type', row.activityType],
      ['Student', row.studentName],
      ['ID', row.registerId],
      ...visibleSections.map((section) => [section.scoreHeader, formatMarks(row[section.key]?.obtainedMarks)]),
      ['Critical', formatMarks(row.overallCriticalMarks)],
      ['Threshold', row.thresholdLabel ?? 'Not Matched'],
      ['Result', row.resultStatus || '-'],
      ['Status', row.rowStatus ?? 'Pending'],
      ['Score', `${formatMarks(row.totalObtainedMarks)} / ${formatMarks(row.totalMarks)}`],
      ['Total %', formatPercent(row.totalPercentage)],
    ]

    const safeTitle = escapeHtml(`${row.studentName} Evaluation Result`)
    const bodyRows = summaryRows.map(([label, value]) => (
      `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
    )).join('')

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.setAttribute('aria-hidden', 'true')

    iframe.onload = () => {
      const frameWindow = iframe.contentWindow
      if (!frameWindow) {
        document.body.removeChild(iframe)
        return
      }

      frameWindow.focus()
      frameWindow.print()

      window.setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1000)
    }

    iframe.srcdoc = `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${safeTitle}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 32px;
              color: #173126;
            }
            h1 {
              margin: 0 0 8px;
              font-size: 24px;
            }
            p {
              margin: 0 0 24px;
              color: #5d7569;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 12px 14px;
              border: 1px solid #dbe7e1;
              text-align: left;
              font-size: 14px;
            }
            th {
              width: 32%;
              background: #f5fbf8;
              color: #48695c;
            }
            td {
              background: #ffffff;
            }
            @media print {
              body {
                margin: 16px;
              }
            }
          </style>
        </head>
        <body>
          <h1>${safeTitle}</h1>
          <p>Use your browser's Save as PDF option to download this result.</p>
          <table>
            <tbody>${bodyRows}</tbody>
          </table>
        </body>
      </html>
    `

    document.body.appendChild(iframe)
  }

  return (
    <section className="vx-content forms-page eval-page">
      <div className="eval-shell">
        <section className="eval-header">
          <div className="eval-header-copy">
              <span className="eval-kicker">
                <ClipboardCheck size={12} strokeWidth={2} />
                Completed Evaluations
              </span>
              <h1>{activityRecord?.activityName ?? 'Completed Evaluation'}</h1>
              <div className="eval-header-inline">
                <span><Shapes size={13} strokeWidth={2} /> {activityRecord?.activityType ?? 'Activity'}</span>
                <span><ClipboardCheck size={13} strokeWidth={2} /> Records <strong>{sourceRows.length}</strong></span>
              </div>
          </div>

          <div className="eval-header-side-grid">
            <div className="eval-header-side">
              <span>Status</span>
              <strong>Completed Only</strong>
              <small>{activityRecord?.year ?? 'Assigned Batch'} {activityRecord?.sgt ? `• ${activityRecord.sgt}` : ''}</small>
            </div>
            <button type="button" className="ghost eval-header-back" onClick={onBackToEvaluation}>
              Back to Evaluation
            </button>
          </div>
        </section>

        {sourceRows.length ? (
          <section className="eval-completed-toolbar">
            <div className="eval-completed-filterbar" role="tablist" aria-label="Outcome filters">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === option.id}
                  className={`eval-completed-filter ${statusFilter === option.id ? 'is-active' : ''}`}
                  onClick={() => setStatusFilter(option.id)}
                >
                  <span>{option.label}</span>
                  <small>{option.count}</small>
                </button>
              ))}
            </div>

            <label className="eval-completed-search">
              <Search size={14} strokeWidth={2} />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search student or threshold"
              />
            </label>
          </section>
        ) : null}

        {filteredRows.length ? (
          <div className="eval-table-wrap">
            <table className="eval-table eval-table-completed">
              <thead>
                <tr>
                  {tableHeaders.map((header) => (
                    <th key={header.key} title={header.label}>
                      {header.sortable ? (
                        <button
                          type="button"
                          className={`eval-table-sort ${sortKey === header.key ? 'is-active' : ''}`}
                          onClick={() => handleSort(header.key)}
                        >
                          <span>{header.label}</span>
                          <ArrowUpDown size={12} strokeWidth={2} />
                        </button>
                      ) : header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="eval-completed-student">
                        <span className="eval-completed-avatar">{row.studentName.slice(0, 2).toUpperCase()}</span>
                        <div className="eval-table-title">
                          <strong>{row.studentName}</strong>
                        </div>
                      </div>
                    </td>
                    <td>{row.registerId}</td>
                    {visibleSections.flatMap((section) => {
                      const sectionStats = row[section.key] ?? {}

                      return [
                        <td key={`${row.id}-${section.key}-score`}>{formatMarks(sectionStats.obtainedMarks)}</td>,
                      ]
                    })}
                    <td>{formatMarks(row.overallCriticalMarks)}</td>
                    <td>
                      <span className={`eval-table-pill ${getThresholdTone(row.thresholdLabel)}`}>
                        {row.thresholdLabel ?? 'Not Matched'}
                      </span>
                    </td>
                    <td>
                      {row.resultStatus ? (
                        <span className={`eval-table-pill ${getOutcomeTone(row.resultStatus)}`}>
                          {row.resultStatus}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="is-strong">{formatMarks(row.totalObtainedMarks)} / {formatMarks(row.totalMarks)}</td>
                    <td className="is-strong">{formatPercent(row.totalPercentage)}</td>
                    <td>
                      <span className={`eval-table-pill ${getEvaluationStatusTone(row.rowStatus)}`}>
                        {row.rowStatus ?? 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="eval-completed-actions">
                        <button
                          type="button"
                          className="tool-btn eval-table-action eval-completed-icon-btn"
                          title="Edit evaluation"
                          aria-label="Edit evaluation"
                          onClick={() => onOpenEvaluation?.({
                            ...(row.activityRecord ?? activityRecord ?? {}),
                            id: row.activityId,
                            activityId: row.activityId,
                            activityName: row.activityName,
                            activityType: row.activityType,
                          }, { studentId: row.studentId })}
                        >
                          <Pencil size={14} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="tool-btn eval-table-action eval-completed-icon-btn"
                          title="Download PDF"
                          aria-label="Download PDF"
                          onClick={() => handleDownloadRow(row)}
                        >
                          <Download size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="eval-table-footer">
              <span>
                Showing {paginatedRows.length ? (currentPage - 1) * pageSize + 1 : 0}
                {' '}to{' '}
                {(currentPage - 1) * pageSize + paginatedRows.length}
                {' '}of {sortedRows.length}
              </span>
              <div className="eval-pagination">
                <button
                  type="button"
                  className="eval-page-btn"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft size={14} strokeWidth={2} />
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`eval-page-btn ${currentPage === pageNumber ? 'is-active' : ''}`}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  className="eval-page-btn"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <section className="eval-empty">
            <div className="eval-empty-copy">
              <Shapes size={18} strokeWidth={2} />
              <strong>No completed evaluations yet.</strong>
              <p>Once faculty confirm submit, the completed student records will appear here.</p>
            </div>
          </section>
        )}
      </div>
    </section>
  )
}
