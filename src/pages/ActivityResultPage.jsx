import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  TrendingUp,
  Users,
} from 'lucide-react'
import '../styles/my-skills.css'

const formatPercent = (value) => `${Number(value ?? 0).toFixed(1).replace(/\.0$/, '')}%`

const formatMarks = (value) => {
  const numericValue = Number(value ?? 0)

  if (Number.isNaN(numericValue)) return '0'
  if (Number.isInteger(numericValue)) return String(numericValue)

  return numericValue.toFixed(2).replace(/\.?0+$/, '')
}

const formatDisplayDate = (value) => {
  if (!value) return 'Not set'

  const normalized = String(value)
  const parsedDate = new Date(normalized)

  if (!Number.isNaN(parsedDate.getTime())) {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parsedDate)
  }

  const rawDate = normalized.split(',')[0].trim()
  const [day, month, year] = rawDate.split('/').map((part) => Number.parseInt(part, 10))

  if (!day || !month || !year) return normalized

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

const normalizeCsvText = (value) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[^\x20-\x7E]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const sanitizeFileName = (value) => normalizeCsvText(value)
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase()
  || 'activity-result-report'

const escapeCsvCell = (value) => {
  const normalizedValue = String(value ?? '').replace(/\r?\n|\r/g, ' ').trim()
  return `"${normalizedValue.replace(/"/g, '""')}"`
}

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

const getResultToneClass = (value = '') => {
  const normalized = String(value ?? '').trim().toLowerCase()

  if (normalized === 'completed') return 'is-completed'
  if (normalized === 'repeat') return 'is-repeat'
  if (normalized === 'remedial') return 'is-remedial'

  return 'is-neutral'
}

const getAttemptNumber = (row) => Number(row?.attemptNumber ?? row?.attemptCount ?? 1) || 1

const getResultStatus = (row) => row?.resultStatus ?? row?.decisionTitle ?? row?.evaluationStatus ?? '-'

const buildReportRows = (rows = [], includeAttempt = false) => rows.map((row) => {
  const baseColumns = [
    row.studentName ?? '-',
    row.registerId ?? row.studentId ?? '-',
  ]

  if (includeAttempt) {
    baseColumns.push(`Attempt ${getAttemptNumber(row)}`)
  }

  return [
    ...baseColumns,
    `${formatMarks(row.totalObtainedMarks)} / ${formatMarks(row.totalMarks)}`,
    formatPercent(row.totalPercentage),
    row.thresholdLabel ?? 'Not Matched',
    getResultStatus(row),
    formatDisplayDate(row.submittedAt),
  ]
})

export default function ActivityResultPage({
  resultRecord,
  completedEvaluationRows = [],
  onBack,
}) {
  const [selectedAttemptKey, setSelectedAttemptKey] = useState('overall')
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false)

  const activityId = resultRecord?.id ?? resultRecord?.activityId
  const activityName = resultRecord?.activityName ?? resultRecord?.title ?? 'Activity Result'
  const activityType = resultRecord?.activityType ?? resultRecord?.type ?? 'Activity'
  const activityStatus = resultRecord?.resolvedStatus ?? resultRecord?.evaluationStatus ?? resultRecord?.status ?? 'Published'

  const activityRows = useMemo(() => completedEvaluationRows
    .filter((row) => String(row.activityId ?? '') === String(activityId ?? ''))
    .sort((left, right) => {
      const attemptDiff = getAttemptNumber(right) - getAttemptNumber(left)

      if (attemptDiff !== 0) return attemptDiff

      const dateDiff = (Date.parse(right.submittedAt ?? '') || 0) - (Date.parse(left.submittedAt ?? '') || 0)

      if (dateDiff !== 0) return dateDiff

      return String(left.studentName ?? '').localeCompare(String(right.studentName ?? ''))
    }), [activityId, completedEvaluationRows])

  const attemptNumbers = useMemo(() => (
    [...new Set(activityRows.map((row) => getAttemptNumber(row)))].sort((left, right) => right - left)
  ), [activityRows])

  useEffect(() => {
    if (selectedAttemptKey === 'overall') return

    const selectedAttemptExists = attemptNumbers.includes(Number(selectedAttemptKey))

    if (!selectedAttemptExists) {
      setSelectedAttemptKey('overall')
    }
  }, [attemptNumbers, selectedAttemptKey])

  useEffect(() => {
    if (!isDownloadMenuOpen) return undefined

    const handlePointerDown = (event) => {
      if (!event.target.closest?.('.activity-result-download-menu')) {
        setIsDownloadMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isDownloadMenuOpen])

  const selectedRows = useMemo(() => {
    if (selectedAttemptKey === 'overall') return activityRows

    return activityRows.filter((row) => getAttemptNumber(row) === Number(selectedAttemptKey))
  }, [activityRows, selectedAttemptKey])

  const latestAttemptNumber = attemptNumbers[0] ?? 1
  const selectedAttemptLabel = selectedAttemptKey === 'overall' ? 'Overall' : `Attempt ${selectedAttemptKey}`

  const summary = useMemo(() => {
    const completedCount = selectedRows.filter((row) => String(getResultStatus(row)).trim().toLowerCase() === 'completed').length
    const repeatCount = selectedRows.filter((row) => String(getResultStatus(row)).trim().toLowerCase() === 'repeat').length
    const remedialCount = selectedRows.filter((row) => String(getResultStatus(row)).trim().toLowerCase() === 'remedial').length
    const averagePercentage = selectedRows.length
      ? selectedRows.reduce((sum, row) => sum + (Number(row.totalPercentage) || 0), 0) / selectedRows.length
      : 0

    return {
      totalStudents: selectedRows.length,
      completedCount,
      repeatCount,
      remedialCount,
      averagePercentage,
    }
  }, [selectedRows])

  const summaryItems = [
    { label: 'View', value: selectedAttemptLabel, icon: FileText },
    { label: 'Latest', value: `Attempt ${latestAttemptNumber}`, icon: TrendingUp },
    { label: 'Status', value: activityStatus, icon: CheckCircle2 },
    { label: 'Students', value: String(summary.totalStudents), icon: Users },
    { label: 'Completed', value: String(summary.completedCount), icon: CheckCircle2 },
    { label: 'Average', value: formatPercent(summary.averagePercentage), icon: TrendingUp },
  ]

  const handleDownloadOverallReport = () => {
    if (!activityRows.length) return

    downloadCsv({
      fileName: `${activityName}-overall-report`,
      headers: ['Student', 'ID', 'Attempt', 'Score', 'Total %', 'Threshold', 'Result', 'Submitted'],
      rows: buildReportRows(activityRows, true),
    })
    setIsDownloadMenuOpen(false)
  }

  const handleDownloadAttemptReport = (attemptNumber) => {
    const attemptRows = activityRows.filter((row) => getAttemptNumber(row) === Number(attemptNumber))
    if (!attemptRows.length) return

    downloadCsv({
      fileName: `${activityName}-attempt-${attemptNumber}-report`,
      headers: ['Student', 'ID', 'Score', 'Total %', 'Threshold', 'Result', 'Submitted'],
      rows: buildReportRows(attemptRows, false),
    })
    setIsDownloadMenuOpen(false)
  }

  return (
    <section className="vx-content my-skills-page">
      <section className="my-skills-progress-shell">
        <div className="my-skills-progress-topbar">
          <div className="my-skills-progress-topbar-actions">
            <button type="button" className="ghost my-skills-progress-back" onClick={onBack}>
              <ArrowLeft size={15} strokeWidth={2.2} />
              Back
            </button>
            <span className={`my-skills-progress-type is-${String(activityType).toLowerCase().replace(/\s+/g, '-')}`}>{activityType}</span>
            <span className="my-skills-progress-state">{activityStatus}</span>
          </div>
          <span className="my-skills-progress-date">{activityRows.length ? `${activityRows.length} published rows` : 'No published rows'}</span>
        </div>

        <div className="my-skills-progress-header">
          <div className="my-skills-progress-heading">
            <div>
              <h1>{activityName}</h1>
              <p>All published student results appear here, grouped overall and by attempt.</p>
            </div>
          </div>

          <div className="my-skills-progress-summary-strip">
            {summaryItems.map((item) => {
              const Icon = item.icon

              return (
                <span key={item.label}>
                  <small>{item.label}</small>
                  <strong><Icon size={12} strokeWidth={2} /> {item.value}</strong>
                </span>
              )
            })}
          </div>
        </div>
      </section>

      <section className="my-skills-board-shell my-skills-progress-board">
        <div className="my-skills-board-head">
          <h3>Published Results</h3>
          <div className="activity-result-head-actions">
            <span className="my-skills-progress-board-meta">{selectedAttemptLabel}</span>
            <div className="activity-result-download-menu">
              <button
                type="button"
                className="activity-result-download-btn"
                onClick={() => setIsDownloadMenuOpen((current) => !current)}
                disabled={!attemptNumbers.length}
              >
                <Download size={14} strokeWidth={2} />
                Download Report
                <ChevronDown size={14} strokeWidth={2} />
              </button>

              {isDownloadMenuOpen ? (
                <div className="activity-result-download-panel">
                  <button type="button" onClick={handleDownloadOverallReport}>
                    Overall Report
                  </button>
                  {attemptNumbers.map((attemptNumber) => (
                    <button
                      key={`download-attempt-${attemptNumber}`}
                      type="button"
                      onClick={() => handleDownloadAttemptReport(attemptNumber)}
                    >
                      {`Attempt ${attemptNumber} Report`}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {attemptNumbers.length ? (
          <>
            <div className="activity-result-attempt-bar">
              <button
                type="button"
                className={`activity-result-attempt-chip ${selectedAttemptKey === 'overall' ? 'is-active' : ''}`}
                onClick={() => setSelectedAttemptKey('overall')}
              >
                Overall
              </button>
              {attemptNumbers.map((attemptNumber) => (
                <button
                  key={attemptNumber}
                  type="button"
                  className={`activity-result-attempt-chip ${Number(selectedAttemptKey) === attemptNumber ? 'is-active' : ''}`}
                  onClick={() => setSelectedAttemptKey(String(attemptNumber))}
                >
                  {`Attempt ${attemptNumber}`}
                </button>
              ))}
            </div>

            <div className="activity-result-stat-grid">
              <article className="activity-result-stat-card">
                <span>Total Students</span>
                <strong>{summary.totalStudents}</strong>
              </article>
              <article className="activity-result-stat-card is-positive">
                <span>Completed</span>
                <strong>{summary.completedCount}</strong>
              </article>
              <article className="activity-result-stat-card is-info">
                <span>Repeat</span>
                <strong>{summary.repeatCount}</strong>
              </article>
              <article className="activity-result-stat-card is-warning">
                <span>Remedial</span>
                <strong>{summary.remedialCount}</strong>
              </article>
              <article className="activity-result-stat-card">
                <span>Average %</span>
                <strong>{formatPercent(summary.averagePercentage)}</strong>
              </article>
            </div>

            {selectedRows.length ? (
              <div className="activity-result-table-wrap">
                <table className="activity-result-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>ID</th>
                      {selectedAttemptKey === 'overall' ? <th>Attempt</th> : null}
                      <th>Score</th>
                      <th>Total %</th>
                      <th>Threshold</th>
                      <th>Result</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRows.map((row) => (
                      <tr key={`${row.studentId ?? row.registerId ?? row.id}-${getAttemptNumber(row)}`}>
                        <td>{row.studentName ?? '-'}</td>
                        <td>{row.registerId ?? row.studentId ?? '-'}</td>
                        {selectedAttemptKey === 'overall' ? <td>{`Attempt ${getAttemptNumber(row)}`}</td> : null}
                        <td>{formatMarks(row.totalObtainedMarks)} / {formatMarks(row.totalMarks)}</td>
                        <td>{formatPercent(row.totalPercentage)}</td>
                        <td>{row.thresholdLabel ?? 'Not Matched'}</td>
                        <td>
                          <span className={`activity-result-result-pill ${getResultToneClass(getResultStatus(row))}`}>
                            {getResultStatus(row)}
                          </span>
                        </td>
                        <td>{formatDisplayDate(row.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="my-skills-progress-empty">
                <FileText size={18} strokeWidth={2} />
                <strong>No rows found for {selectedAttemptLabel}.</strong>
                <p>Published student results will appear here once this attempt has evaluation rows.</p>
              </div>
            )}
          </>
        ) : (
          <div className="my-skills-progress-empty">
            <FileText size={18} strokeWidth={2} />
            <strong>No published results available.</strong>
            <p>Publish an activity attempt first, then this page will show all student results attempt-wise.</p>
          </div>
        )}
      </section>
    </section>
  )
}
