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
  SendHorizonal,
  Shapes,
} from 'lucide-react'
import SendApprovalModal from '../components/SendApprovalModal'
import '../styles/evaluation.css'

const formatPercent = (value) => `${Number(value ?? 0).toFixed(1).replace(/\.0$/, '')}%`
const formatMarks = (value) => {
  const numericValue = Number(value ?? 0)

  if (Number.isNaN(numericValue)) return '0'
  if (Number.isInteger(numericValue)) return String(numericValue)

  return numericValue.toFixed(2).replace(/\.?0+$/, '')
}

const normalizePdfText = (value) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[^\x20-\x7E]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const escapePdfText = (value) => normalizePdfText(value)
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')

const sanitizeFileName = (value) => normalizePdfText(value)
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase()
  || 'evaluation-result'

const wrapPdfText = (value, maxLength = 58) => {
  const words = normalizePdfText(value).split(' ').filter(Boolean)
  const lines = []

  words.forEach((word) => {
    const currentLine = lines[lines.length - 1] ?? ''
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (nextLine.length <= maxLength) {
      if (lines.length) lines[lines.length - 1] = nextLine
      else lines.push(nextLine)
      return
    }

    lines.push(word.length > maxLength ? `${word.slice(0, maxLength - 1)}-` : word)
  })

  return lines.length ? lines : ['-']
}

const buildSimplePdf = ({ title, rows }) => {
  const pageWidth = 595.28
  const pageHeight = 841.89
  const margin = 48
  const tableWidth = pageWidth - margin * 2
  const labelWidth = 150
  const valueX = margin + labelWidth
  const content = []
  let y = pageHeight - margin

  const addText = ({ text, x, y: textY, size = 10, color = '0.08 0.18 0.14' }) => {
    content.push(`${color} rg BT /F1 ${size} Tf ${x} ${textY} Td (${escapePdfText(text)}) Tj ET`)
  }

  addText({ text: title, x: margin, y: y - 18, size: 18 })
  y -= 48

  rows.forEach(([label, value]) => {
    const valueLines = wrapPdfText(value)
    const rowHeight = Math.max(28, valueLines.length * 13 + 14)
    const bottomY = y - rowHeight

    content.push(`0.965 0.985 0.975 rg ${margin} ${bottomY} ${labelWidth} ${rowHeight} re f`)
    content.push(`0.86 0.91 0.88 RG ${margin} ${bottomY} ${tableWidth} ${rowHeight} re S`)
    content.push(`0.86 0.91 0.88 RG ${valueX} ${bottomY} m ${valueX} ${y} l S`)
    addText({ text: label, x: margin + 12, y: y - 18, size: 10, color: '0.29 0.41 0.36' })
    valueLines.forEach((line, index) => {
      addText({ text: line, x: valueX + 12, y: y - 18 - (index * 13), size: 10, color: '0.08 0.18 0.14' })
    })

    y = bottomY
  })

  const stream = content.join('\n')
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`,
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ]
  const header = '%PDF-1.4\n'
  const offsets = []
  let body = header

  objects.forEach((object) => {
    offsets.push(body.length)
    body += object
  })

  const xrefOffset = body.length
  const xrefRows = offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')

  return `${body}xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${xrefRows}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
}

const downloadPdf = ({ fileName, title, rows }) => {
  const pdf = buildSimplePdf({ title, rows })
  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${sanitizeFileName(fileName)}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const escapeCsvCell = (value) => {
  const normalizedValue = String(value ?? '').replace(/\r?\n|\r/g, ' ').trim()
  return `"${normalizedValue.replace(/"/g, '""')}"`
}

const excelTextValue = (value) => `="${String(value ?? '').replace(/"/g, '""')}"`

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

const SECTION_CONFIGS = [
  { key: 'checklist', scoreHeader: 'Checklist' },
  { key: 'form', scoreHeader: 'Form' },
  { key: 'question', scoreHeader: 'Question' },
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

const getAttemptNumber = (row) => Math.min(Math.max(Number(row?.attemptNumber) || 1, 1), 10)

const getStudentKey = (row) => row?.studentId ?? row?.registerId ?? row?.studentName ?? row?.id
const idsMatch = (left, right) => String(left ?? '') === String(right ?? '')

const uniqueDisplayStudentNames = [
  'Aarav Menon',
  'Diya Krishnan',
  'Kavin Raj',
  'Megha Suresh',
  'Nithin Paul',
  'Riya Thomas',
  'Sanjay Iyer',
  'Tanvi Patel',
  'Ananya Rao',
  'Rahul Nair',
  'Priya Shah',
  'Vikram Das',
  'Isha Verma',
  'Arjun Pillai',
  'Neha Kapoor',
  'Manoj Reddy',
  'Farah Khan',
  'Dev Patel',
  'Sneha George',
  'Aditya Bose',
]

const normalizeDuplicateStudentNames = (rows = []) => {
  const keys = [...new Set(rows.map(getStudentKey).filter(Boolean))]
  const nameByKey = new Map(keys.map((key, index) => [key, uniqueDisplayStudentNames[index] ?? `Student ${index + 1}`]))

  return rows.map((row) => {
    const studentKey = getStudentKey(row)
    const studentName = nameByKey.get(studentKey)

    return studentName ? { ...row, studentName } : row
  })
}

const isEvaluatedResultRow = (row) => {
  const status = String(row?.resultStatus ?? row?.decisionTitle ?? row?.decisionLabel ?? '').trim().toLowerCase()

  return ['completed', 'repeat', 'remedial'].includes(status)
}

const isActivityCertifiable = (activity) => Boolean(
  activity?.certifiable
  ?? activity?.isCertifiable
  ?? activity?.activityRecord?.certifiable
  ?? activity?.activityRecord?.isCertifiable
  ?? activity?.activityRecord?.assignment?.certifiable
  ?? activity?.activityRecord?.assignment?.isCertifiable
  ?? activity?.activityRecord?.assignment?.examData?.certifiable
  ?? activity?.activityRecord?.assignment?.examData?.isCertifiable
  ?? activity?.activityRecord?.activityData?.activity?.certifiable
  ?? activity?.activityRecord?.activityData?.activity?.isCertifiable
  ?? activity?.examData?.certifiable
  ?? activity?.examData?.isCertifiable
  ?? activity?.activityData?.activity?.certifiable
  ?? activity?.activityData?.activity?.isCertifiable
)

const getExpectedActivityStudentCount = (activity) => {
  const totalStudents = Number(activity?.studentCount ?? activity?.activityRecord?.studentCount) || 0

  if (totalStudents <= 0) return 0

  const visibleCount = Math.min(totalStudents, 17)
  const notSubmittedSampleCount = visibleCount > 1
    ? Math.min(2, Math.max(1, Math.floor(visibleCount * 0.12)))
    : 0

  return visibleCount - notSubmittedSampleCount
}

export default function CompletedEvaluationPage({
  completedEvaluationRows = [],
  activityId,
  activityRecord,
  onBackToEvaluation,
  onOpenEvaluation,
  onSendToApproval,
}) {
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState('studentName')
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [isApprovalPopupOpen, setIsApprovalPopupOpen] = useState(false)
  const pageSize = 10

  const sourceRows = useMemo(() => (
    normalizeDuplicateStudentNames(activityId
      ? completedEvaluationRows.filter((row) => idsMatch(row.activityId, activityId))
      : completedEvaluationRows)
  ), [activityId, completedEvaluationRows])

  const evaluatedStudentCount = useMemo(() => {
    const evaluatedStudentKeys = new Set()

    sourceRows.forEach((row) => {
      if (!isEvaluatedResultRow(row)) return

      const studentKey = getStudentKey(row)
      if (studentKey) evaluatedStudentKeys.add(studentKey)
    })

    return evaluatedStudentKeys.size
  }, [sourceRows])

  const completedTableStudentCount = useMemo(() => {
    const studentKeys = new Set()

    sourceRows.forEach((row) => {
      const studentKey = getStudentKey(row)
      if (studentKey) studentKeys.add(studentKey)
    })

    return studentKeys.size
  }, [sourceRows])

  const assignedStudentCount = useMemo(() => {
    const currentAttemptNumber = sourceRows.reduce((maxAttempt, row) => Math.max(maxAttempt, getAttemptNumber(row)), 1)

    if (currentAttemptNumber > 1) {
      return completedTableStudentCount || evaluatedStudentCount
    }

    const configuredStudentCount = getExpectedActivityStudentCount(activityRecord ?? sourceRows[0])

    return configuredStudentCount || completedTableStudentCount || evaluatedStudentCount
  }, [activityRecord, completedTableStudentCount, evaluatedStudentCount, sourceRows])

  const canSendApproval = assignedStudentCount > 0 && evaluatedStudentCount === assignedStudentCount

  const filteredRows = useMemo(() => {
    const needle = searchValue.trim().toLowerCase()

    return sourceRows.filter((row) => {
      const matchesFilter = statusFilter === 'all'
        || String(row.resultStatus ?? '').trim().toLowerCase() === statusFilter
      const matchesSearch = !needle
        || row.studentName?.toLowerCase().includes(needle)
        || row.registerId?.toLowerCase().includes(needle)
        || row.thresholdLabel?.toLowerCase().includes(needle)
        || row.resultStatus?.toLowerCase().includes(needle)
        || row.decisionTitle?.toLowerCase().includes(needle)
        || String(getAttemptNumber(row)).includes(needle)
        || `attempt ${getAttemptNumber(row)}`.includes(needle)

      return matchesFilter && matchesSearch
    })
  }, [searchValue, sourceRows, statusFilter])

  const visibleSections = useMemo(() => (
    SECTION_CONFIGS.filter((section) => filteredRows.some((row) => (row[section.key]?.itemCount ?? 0) > 0))
  ), [filteredRows])
  const approvalSections = useMemo(() => (
    SECTION_CONFIGS.filter((section) => sourceRows.some((row) => (row[section.key]?.itemCount ?? 0) > 0))
  ), [sourceRows])
  const currentAttemptNumber = useMemo(() => (
    sourceRows.reduce((maxAttempt, row) => Math.max(maxAttempt, getAttemptNumber(row)), 1)
  ), [sourceRows])

  const filterOptions = [
    { id: 'all', label: 'All', count: sourceRows.length },
    { id: 'completed', label: 'Completed', count: sourceRows.filter((row) => String(row.resultStatus ?? '').trim().toLowerCase() === 'completed').length },
    { id: 'repeat', label: 'Repeat', count: sourceRows.filter((row) => String(row.resultStatus ?? '').trim().toLowerCase() === 'repeat').length },
    { id: 'remedial', label: 'Remedial', count: sourceRows.filter((row) => String(row.resultStatus ?? '').trim().toLowerCase() === 'remedial').length },
  ]

  const handleSendApproval = (approvalFaculty) => {
    if (!canSendApproval) return

    const activitySource = activityRecord ?? sourceRows[0] ?? {}

    onSendToApproval?.({
      activityId: activityId ?? activitySource.activityId ?? activitySource.id ?? 'completed-evaluation',
      activityName: activitySource.activityName ?? 'Completed Evaluation',
      activityType: activitySource.activityType ?? 'Activity',
      source: 'Completed Evaluation',
      totalStudents: assignedStudentCount,
      evaluatedCount: evaluatedStudentCount,
      attemptCount: sourceRows.reduce((maxAttempt, row) => Math.max(maxAttempt, getAttemptNumber(row)), 0),
      activitySections: approvalSections.map((section) => ({
        key: section.key,
        label: section.scoreHeader,
      })),
      studentRows: sourceRows.map((row) => ({
        id: row.id,
        studentId: row.studentId,
        studentName: row.studentName,
        registerId: row.registerId,
        attemptCount: getAttemptNumber(row),
        checklist: row.checklist,
        form: row.form,
        question: row.question,
        scaffolding: row.scaffolding,
        overallCriticalMarks: row.overallCriticalMarks,
        thresholdLabel: row.thresholdLabel,
        totalObtainedMarks: row.totalObtainedMarks,
        totalMarks: row.totalMarks,
        totalPercentage: row.totalPercentage,
        resultStatus: row.resultStatus,
      })),
      completedCount: sourceRows.filter((row) => String(row.resultStatus ?? '').trim().toLowerCase() === 'completed').length,
      repeatCount: sourceRows.filter((row) => String(row.resultStatus ?? '').trim().toLowerCase() === 'repeat').length,
      remedialCount: sourceRows.filter((row) => String(row.resultStatus ?? '').trim().toLowerCase() === 'remedial').length,
      facultyName: approvalFaculty.facultyName,
      employeeId: approvalFaculty.employeeId,
      designation: approvalFaculty.designation,
      note: approvalFaculty.note,
    })
    setIsApprovalPopupOpen(false)
  }

  const tableHeaders = useMemo(() => ([
    { key: 'studentName', label: 'Student', sortable: true },
    { key: 'registerId', label: 'ID', sortable: true },
    { key: 'attemptNumber', label: 'Attempt', sortable: true },
    ...visibleSections.flatMap((section) => ([
      { key: `${section.key}-score`, label: section.scoreHeader, sortable: true },
    ])),
    { key: 'overallCriticalMarks', label: 'Critical', sortable: true },
    { key: 'thresholdLabel', label: 'Threshold', sortable: true },
    { key: 'scoreComparison', label: 'Score', sortable: true },
    { key: 'totalPercentage', label: 'Total %', sortable: true },
    { key: 'decisionTitle', label: 'Result', sortable: true },
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
      if (key === 'attemptNumber') return getAttemptNumber(row)

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

  const openEvaluationForRow = (row) => {
    if (!row) return

    onOpenEvaluation?.({
      ...(row.activityRecord ?? activityRecord ?? {}),
      id: row.activityId,
      activityId: row.activityId,
      activityName: row.activityName,
      activityType: row.activityType,
    }, { studentId: row.studentId, completedRowId: row.id })
  }

  const handleDownloadRow = (row) => {
    const isCertifiable = isActivityCertifiable(row) || isActivityCertifiable(activityRecord)
    const summaryRows = [
      ['Activity', row.activityName],
      ['Type', row.activityType],
      ...(isCertifiable ? [['Certifiable', 'Yes']] : []),
      ['Student', row.studentName],
      ['ID', row.registerId],
      ...visibleSections.map((section) => [section.scoreHeader, formatMarks(row[section.key]?.obtainedMarks)]),
      ['Critical', formatMarks(row.overallCriticalMarks)],
      ['Threshold', row.thresholdLabel ?? 'Not Matched'],
      ['Attempt', String(getAttemptNumber(row))],
      ['Score', `${formatMarks(row.totalObtainedMarks)} / ${formatMarks(row.totalMarks)}`],
      ['Total %', formatPercent(row.totalPercentage)],
      ['Result', row.resultStatus || '-'],
    ]

    const title = `${row.studentName} Evaluation Result`

    downloadPdf({
      fileName: title,
      title,
      rows: summaryRows,
    })
  }

  const handleDownloadAllExcel = () => {
    if (!sortedRows.length) return

    const headers = [
      'Activity Name',
      'Activity Type',
      'Certifiable',
      'Year',
      'SGT',
      'Student',
      'ID',
      ...visibleSections.map((section) => section.scoreHeader),
      'Critical',
      'Threshold',
      'Attempt',
      'Score',
      'Total %',
      'Result',
    ]
    const rows = sortedRows.map((row) => ([
      row.activityName ?? activityRecord?.activityName ?? 'Completed Evaluation',
      row.activityType ?? activityRecord?.activityType ?? 'Activity',
      isActivityCertifiable(row) || isActivityCertifiable(activityRecord) ? 'Yes' : 'No',
      row.activityRecord?.year ?? activityRecord?.year ?? '',
      row.activityRecord?.sgt ?? activityRecord?.sgt ?? '',
      row.studentName,
      row.registerId,
      ...visibleSections.map((section) => formatMarks(row[section.key]?.obtainedMarks)),
      formatMarks(row.overallCriticalMarks),
      row.thresholdLabel ?? 'Not Matched',
      String(getAttemptNumber(row)),
      excelTextValue(`${formatMarks(row.totalObtainedMarks)} / ${formatMarks(row.totalMarks)}`),
      formatPercent(row.totalPercentage),
      row.resultStatus || '-',
    ]))

    downloadCsv({
      fileName: `${activityRecord?.activityName ?? 'completed-evaluations'} excel`,
      headers,
      rows,
    })
  }

  const headerActivityName = activityRecord?.activityName ?? 'Completed Evaluation'
  const headerActivityType = activityRecord?.activityType ?? 'Activity'
  const headerIsCertifiable = isActivityCertifiable(activityRecord)

  return (
    <section className="vx-content forms-page eval-page">
      <div className="eval-shell">
        <section className="eval-header eval-completed-compact-header">
          <button
            type="button"
            className="ghost eval-header-back eval-header-back-icon"
            onClick={onBackToEvaluation}
            title="Back to Evaluation"
            aria-label="Back to Evaluation"
          >
            <ChevronLeft size={18} strokeWidth={2.4} />
          </button>

          <div className="eval-completed-header-main">
            <strong>{headerActivityName}</strong>
            <span><Shapes size={13} strokeWidth={2} /> {headerActivityType}</span>
            <span className={headerIsCertifiable ? 'is-certifiable' : 'is-not-certifiable'}>
              <CheckCircle2 size={13} strokeWidth={2} />
              {headerIsCertifiable ? 'Certifiable' : 'Not Certifiable'}
            </span>
          </div>

          <div className="eval-header-copy">
              <span className="eval-kicker">
                <ClipboardCheck size={12} strokeWidth={2} />
                Completed Evaluations
              </span>
              <h1>{activityRecord?.activityName ?? 'Completed Evaluation'}</h1>
              <div className="eval-header-inline">
                <span><Shapes size={13} strokeWidth={2} /> {activityRecord?.activityType ?? 'Activity'}</span>
                <span className="eval-status-pill is-attempt">Attempt {currentAttemptNumber}</span>
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

        <section className="eval-completed-results-panel">
          {sourceRows.length ? (
            <div className="eval-completed-toolbar">
              <label className="eval-completed-search">
                <Search size={14} strokeWidth={2} />
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search student, ID, result, or attempts"
                />
              </label>

              <div className="eval-completed-toolbar-actions">
                {canSendApproval ? (
                  <button
                    type="button"
                    className="tool-btn green eval-completed-send-approval"
                    onClick={() => setIsApprovalPopupOpen(true)}
                  >
                    <SendHorizonal size={14} strokeWidth={2} />
                    Send to Approval
                  </button>
                ) : null}
                <button
                  type="button"
                  className="eval-completed-download"
                  onClick={handleDownloadAllExcel}
                  disabled={!sortedRows.length}
                >
                  <Download size={14} strokeWidth={2} />
                  Download Excel
                </button>
              </div>

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
            </div>
          ) : null}

          {sortedRows.length ? (
            <div className="eval-table-wrap eval-completed-group-wrap">
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
                  <tr key={row.id} className="eval-completed-parent-row">
                    <td>
                      <div className="eval-completed-student">
                        <span className="eval-completed-avatar">{row.studentName.slice(0, 2).toUpperCase()}</span>
                        <div className="eval-table-title">
                          <strong>{row.studentName}</strong>
                        </div>
                      </div>
                    </td>
                    <td>{row.registerId}</td>
                    <td>
                      <span className="eval-table-pill is-neutral">{getAttemptNumber(row)}</span>
                    </td>
                    {visibleSections.map((section) => {
                      const sectionStats = row[section.key] ?? {}

                      return (
                        <td key={`${row.id}-${section.key}-score`}>
                          {formatMarks(sectionStats.obtainedMarks)}
                        </td>
                      )
                    })}
                    <td>{formatMarks(row.overallCriticalMarks)}</td>
                    <td>
                      <span className={`eval-table-pill ${getThresholdTone(row.thresholdLabel)}`}>
                        {row.thresholdLabel ?? 'Not Matched'}
                      </span>
                    </td>
                    <td className="is-strong">{formatMarks(row.totalObtainedMarks)} / {formatMarks(row.totalMarks)}</td>
                    <td className="is-strong">{formatPercent(row.totalPercentage)}</td>
                    <td>
                      {row.resultStatus ? (
                        <span className={`eval-table-pill ${getOutcomeTone(row.resultStatus)}`}>
                          {row.resultStatus}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <div className="eval-completed-actions">
                        <button
                          type="button"
                          className="tool-btn eval-table-action eval-completed-icon-btn"
                          title="Edit evaluation"
                          aria-label="Edit evaluation"
                          onClick={() => openEvaluationForRow(row)}
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
        </section>
        <SendApprovalModal
          open={isApprovalPopupOpen}
          title="Send to Approval"
          contextLabel={activityRecord?.activityName ?? sourceRows[0]?.activityName ?? 'Completed evaluations'}
          onClose={() => setIsApprovalPopupOpen(false)}
          onSend={handleSendApproval}
        />
      </div>
    </section>
  )
}
