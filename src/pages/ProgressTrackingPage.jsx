import { useMemo } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  BookOpenCheck,
  CalendarDays,
  Download,
  FileText,
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

const getTypeToneClass = (value = '') => `is-${String(value).toLowerCase().replace(/\s+/g, '-')}`

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
  || 'activity-result'

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

const sampleProgressResultRecord = {
  id: 'sample-progress-result',
  activityId: 'sample-progress-result',
  title: 'WBC Count Checklist Station',
  activityName: 'WBC Count Checklist Station',
  type: 'OSPE',
  activityType: 'OSPE',
  studentName: 'Aarav Menon',
  studentId: 'MC25101',
  createdDate: '2026-04-02T09:00:00',
  submittedAt: '2026-04-02T09:00:00',
  status: 'Published',
  attemptNumber: 1,
  latestCompletedRow: {
    studentName: 'Aarav Menon',
    registerId: 'MC25101',
    studentId: 'MC25101',
    attemptNumber: 1,
    totalObtainedMarks: 4,
    totalMarks: 4,
    totalPercentage: 100,
    resultStatus: 'Completed',
    thresholdLabel: 'Exceeds',
    submittedAt: '2026-04-02T09:00:00',
  },
}

const sampleDetailItems = [
  {
    id: 'sample-question-1',
    type: 'question',
    label: 'Question 1',
    prompt: 'Interpret the peripheral smear findings and identify the likely diagnosis.',
    answer: 'Microcytic hypochromic anemia with anisopoikilocytosis, likely iron deficiency anemia.',
    marks: 2,
    obtainedMarks: 2,
    decision: 'Completed',
    remarks: 'Clear interpretation with relevant terminology.',
    isCritical: false,
    tags: ['Interpretation'],
    domains: [
      { label: 'COG K2', tone: 'is-domain-cognitive' },
      { label: 'AFF A1', tone: 'is-domain-affective' },
    ],
    sectionLabel: 'question',
  },
  {
    id: 'sample-question-2',
    type: 'question',
    label: 'Question 2',
    prompt: 'Mention one confirmatory investigation for this case.',
    answer: 'Serum ferritin estimation.',
    marks: 1,
    obtainedMarks: 1,
    decision: 'Completed',
    remarks: '',
    isCritical: false,
    tags: ['Investigation'],
    domains: [
      { label: 'COG K1', tone: 'is-domain-cognitive' },
    ],
    sectionLabel: 'question',
  },
  {
    id: 'sample-scaffold-1',
    type: 'scaffolding',
    label: 'Scaffolding 1',
    prompt: 'State one key differential diagnosis.',
    answer: 'Thalassemia trait.',
    marks: 1,
    obtainedMarks: 1,
    decision: 'Completed',
    remarks: 'Acceptable differential diagnosis.',
    isCritical: true,
    tags: ['Scaffolding'],
    domains: [
      { label: 'COG K2', tone: 'is-domain-cognitive' },
      { label: 'PSY P1', tone: 'is-domain-psychomotor' },
    ],
    sectionLabel: 'scaffolding',
  },
]

const buildDomainBadges = (item = {}) => {
  const badges = []

  if (item.cognitive || item.domain === 'Cognitive') {
    badges.push({ label: `COG ${item.cognitive ?? 'Yes'}`, tone: 'is-domain-cognitive' })
  }

  if (item.affective) {
    badges.push({ label: `AFF ${item.affective}`, tone: 'is-domain-affective' })
  }

  if (item.psychomotor || item.domain === 'Psychomotor') {
    badges.push({ label: `PSY ${item.psychomotor ?? 'Yes'}`, tone: 'is-domain-psychomotor' })
  }

  return badges
}

const buildActivityItems = (resultRecord) => {
  const activitySource = resultRecord?.evaluationRecord?.assignment ?? resultRecord?.evaluationRecord ?? resultRecord ?? {}
  const modules = activitySource?.examData?.modules ?? resultRecord?.examData?.modules ?? {}
  const answers = resultRecord?.answers ?? {}
  const evaluationDraft = resultRecord?.latestCompletedRow?.evaluationDraft ?? {}

  const getItemState = (type, itemId) => {
    if (type === 'checklist') {
      return {
        decision: evaluationDraft.checklistDecisions?.[itemId] ?? '',
        marks: evaluationDraft.checklistMarks?.[itemId] ?? 0,
        remarks: evaluationDraft.checklistRemarks?.[itemId] ?? '',
      }
    }

    if (type === 'form') {
      return {
        decision: evaluationDraft.formDecisions?.[itemId] ?? '',
        marks: evaluationDraft.formMarks?.[itemId] ?? 0,
        remarks: evaluationDraft.formRemarks?.[itemId] ?? '',
      }
    }

    if (type === 'scaffolding') {
      return {
        decision: evaluationDraft.scaffoldingDecisions?.[itemId] ?? '',
        marks: evaluationDraft.scaffoldingMarks?.[itemId] ?? 0,
        remarks: evaluationDraft.scaffoldingRemarks?.[itemId] ?? '',
      }
    }

    if (type === 'image') {
      return {
        decision: evaluationDraft.imageDecisions?.[itemId] ?? '',
        marks: evaluationDraft.imageMarks?.[itemId] ?? 0,
        remarks: evaluationDraft.imageRemarks?.[itemId] ?? '',
      }
    }

    return {
      decision: evaluationDraft.manualQuestionDecisions?.[itemId] ?? '',
      marks: evaluationDraft.manualQuestionMarks?.[itemId] ?? 0,
      remarks: evaluationDraft.manualQuestionRemarks?.[itemId] ?? '',
    }
  }

  const resolveAnswer = (type, item) => {
    if (type === 'form') {
      const responses = (item.responses ?? []).map((response) => ({
        label: response.label ?? response.key ?? 'Response',
        value: answers.forms?.[response.id ?? response.key ?? ''] ?? 'Not answered',
      }))

      return responses.length
        ? responses.map((response) => `${response.label}: ${response.value}`).join(' | ')
        : 'Not answered'
    }

    if (type === 'scaffolding') return answers.scaffolding?.[item.id] ?? 'Not answered'
    if (type === 'checklist') return answers.questions?.[item.id] ?? answers.scaffolding?.[item.id] ?? 'Checklist review'

    return answers.questions?.[item.id] ?? 'Not answered'
  }

  const buildItems = (items = [], type, fallbackLabel) => items.map((item, index) => {
    const itemId = item.id ?? `${type}-${index + 1}`
    const state = getItemState(type, itemId)

    return {
      id: itemId,
      type,
      label: item.label ?? item.text ?? item.questionText ?? `${fallbackLabel} ${index + 1}`,
      prompt: item.prompt ?? item.questionText ?? item.text ?? `${fallbackLabel} ${index + 1}`,
      answer: resolveAnswer(type, { ...item, id: itemId }),
      marks: Number(item.marks) || 0,
      obtainedMarks: Number(state.marks) || 0,
      decision: state.decision || 'Not evaluated',
      remarks: state.remarks || '',
      isCritical: Boolean(item.isCritical),
      tags: item.tags ?? [],
      domains: buildDomainBadges(item),
      sectionLabel: type,
    }
  })

  const resolvedItems = [
    ...buildItems(modules.checklist ?? [], 'checklist', 'Checklist Item'),
    ...buildItems(modules.form ?? [], 'form', 'Form'),
    ...buildItems(modules.questions ?? [], String(resultRecord?.type ?? resultRecord?.activityType ?? '').toLowerCase() === 'image' ? 'image' : 'question', 'Question'),
    ...buildItems(modules.scaffolding ?? [], 'scaffolding', 'Scaffolding'),
  ]

  return resolvedItems.length ? resolvedItems : sampleDetailItems
}

export default function ProgressTrackingPage({
  resultRecord,
  completedEvaluationRows = [],
  onBackToActivities,
}) {
  const isSampleRecord = !resultRecord
  const resolvedResultRecord = useMemo(() => {
    if (!resultRecord) return sampleProgressResultRecord

    if (resultRecord.latestCompletedRow) return resultRecord

    const activityId = resultRecord.id ?? resultRecord.activityId
    const matchedRow = completedEvaluationRows
      .filter((row) => String(row.activityId ?? '') === String(activityId ?? ''))
      .sort((left, right) => {
        const attemptDiff = (Number(right.attemptNumber) || 0) - (Number(left.attemptNumber) || 0)

        if (attemptDiff !== 0) return attemptDiff

        return (Date.parse(right.submittedAt ?? '') || 0) - (Date.parse(left.submittedAt ?? '') || 0)
      })[0] ?? null

    return {
      ...resultRecord,
      activityId,
      latestCompletedRow: matchedRow,
    }
  }, [completedEvaluationRows, resultRecord])

  const detailItems = useMemo(() => buildActivityItems(resolvedResultRecord), [resolvedResultRecord])
  const latestCompletedRow = resolvedResultRecord?.latestCompletedRow ?? null
  const groupedItems = useMemo(() => {
    const groups = new Map()

    detailItems.forEach((item) => {
      const key = item.sectionLabel
      const current = groups.get(key) ?? []
      current.push(item)
      groups.set(key, current)
    })

    return [...groups.entries()]
  }, [detailItems])

  const activityName = resolvedResultRecord.title ?? resolvedResultRecord.activityName ?? 'Activity Result'
  const activityType = resolvedResultRecord.type ?? resolvedResultRecord.activityType ?? 'Activity'
  const studentName = resolvedResultRecord.studentName ?? latestCompletedRow?.studentName ?? 'Student'
  const studentId = resolvedResultRecord.studentId ?? latestCompletedRow?.registerId ?? latestCompletedRow?.studentId ?? 'Not set'
  const attemptNumber = Number(latestCompletedRow?.attemptNumber ?? resolvedResultRecord.attemptNumber ?? 1) || 1
  const obtainedMarks = Number(latestCompletedRow?.totalObtainedMarks ?? 0) || 0
  const totalMarks = Number(latestCompletedRow?.totalMarks ?? 0) || 0
  const totalPercentage = Number(latestCompletedRow?.totalPercentage ?? 0) || 0
  const resultStatus = latestCompletedRow?.resultStatus ?? latestCompletedRow?.decisionTitle ?? resolvedResultRecord.status ?? 'Published'
  const thresholdLabel = latestCompletedRow?.thresholdLabel ?? 'Not Matched'
  const handleDownloadPdf = () => {
    const rows = [
      ['Activity', activityName],
      ['Student', `${studentName} (${studentId})`],
      ['Type', activityType],
      ['Attempt', `Attempt ${attemptNumber}`],
      ['Result', resultStatus],
      ['Score', `${formatMarks(obtainedMarks)} / ${formatMarks(totalMarks)}`],
      ['Total %', formatPercent(totalPercentage)],
      ['Threshold', thresholdLabel],
      ...groupedItems.flatMap(([sectionLabel, items]) => items.map((item, index) => ([
        `${sectionLabel} ${index + 1}`,
        [
          item.label,
          item.prompt,
          `Answer: ${item.answer}`,
          `Marks: ${formatMarks(item.obtainedMarks)} / ${formatMarks(item.marks)}`,
          `Status: ${item.decision}`,
          item.tags.length ? `Tags: ${item.tags.join(', ')}` : '',
          item.domains.length ? `Domains: ${item.domains.map((domain) => domain.label).join(', ')}` : '',
          item.isCritical ? 'Critical: Yes' : '',
          item.remarks ? `Faculty Remark: ${item.remarks}` : '',
        ].filter(Boolean).join(' | '),
      ]))),
    ]

    downloadPdf({
      fileName: `${activityName}-${studentName}-result`,
      title: `${activityName} Result`,
      rows,
    })
  }

  return (
    <section className="vx-content my-skills-page">
      <section className="my-skills-progress-shell">
        <div className="my-skills-progress-topbar">
          <div className="my-skills-progress-topbar-actions">
            <button type="button" className="ghost my-skills-progress-back" onClick={onBackToActivities}>
              <ArrowLeft size={15} strokeWidth={2.2} />
              Back to Activities
            </button>
            <button type="button" className="ghost my-skills-progress-download" onClick={handleDownloadPdf}>
              <Download size={15} strokeWidth={2.2} />
              Download Result
            </button>
          </div>
          <span className="my-skills-progress-date">
            <CalendarDays size={12} strokeWidth={2} />
            {formatDisplayDate(resolvedResultRecord.submittedAt ?? resolvedResultRecord.createdDate ?? latestCompletedRow?.submittedAt)}
          </span>
        </div>

        <div className="my-skills-progress-header">
          <div className="my-skills-progress-heading">
            <div className="my-skills-progress-heading-top">
              <span className={`my-skills-progress-type ${getTypeToneClass(activityType)}`}>{activityType}</span>
              <span className="my-skills-progress-state">{isSampleRecord ? 'Sample Result' : 'Published Result'}</span>
            </div>
            <div>
              <h1>{activityName}</h1>
              <p>{studentName} • {studentId}</p>
            </div>
          </div>

          <div className="my-skills-progress-summary-strip">
            <span><small>Attempt</small><strong>{attemptNumber}</strong></span>
            <span><small>Result</small><strong>{resultStatus}</strong></span>
            <span><small>Score</small><strong>{formatMarks(obtainedMarks)} / {formatMarks(totalMarks)}</strong></span>
            <span><small>Total</small><strong>{formatPercent(totalPercentage)}</strong></span>
            <span><small>Threshold</small><strong>{thresholdLabel}</strong></span>
            <span><small>Items</small><strong>{detailItems.length}</strong></span>
          </div>
        </div>
      </section>

      <section className="my-skills-board-shell my-skills-progress-board">
        <div className="my-skills-board-head">
          <h3>Detailed Result</h3>
          <span className="my-skills-progress-board-meta">{groupedItems.length} Sections</span>
        </div>

        {groupedItems.length ? (
          <div className="my-skills-progress-section-list">
            {groupedItems.map(([sectionLabel, items]) => (
              <section key={sectionLabel} className="my-skills-progress-section">
                <div className="my-skills-section-head">
                  <h3>{sectionLabel.charAt(0).toUpperCase() + sectionLabel.slice(1)}</h3>
                  <span>{items.length} items</span>
                </div>
                <div className="my-skills-progress-table">
                  <div className="my-skills-progress-table-head">
                    <span>Question</span>
                    <span>Answer</span>
                    <span>Marks</span>
                    <span>Status</span>
                  </div>
                  {items.map((item) => (
                    <article key={item.id} className={`my-skills-progress-result-row ${item.isCritical ? 'is-critical' : ''}`}>
                      <div className="my-skills-progress-cell is-question">
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.prompt}</p>
                        </div>
                      </div>

                      <div className="my-skills-progress-cell is-answer">
                        <div className="my-skills-progress-answer-box">
                          <span><BookOpenCheck size={12} strokeWidth={2} /> Answer</span>
                          <p>{item.answer}</p>
                        </div>
                        {item.remarks ? (
                          <div className="my-skills-progress-remarks">
                            <span><FileText size={12} strokeWidth={2} /> Faculty Remark</span>
                            <p>{item.remarks}</p>
                          </div>
                        ) : null}
                      </div>

                      <div className="my-skills-progress-cell is-marks">
                        <span className="my-skills-progress-score-pill">
                          {formatMarks(item.obtainedMarks)} / {formatMarks(item.marks)}
                        </span>
                      </div>
                      <div className="my-skills-progress-cell is-status">
                        <div className="my-skills-progress-meta-row">
                          <span className="my-skills-progress-pill is-decision">{item.decision}</span>
                          {item.isCritical ? <span className="my-skills-progress-pill is-critical">Critical</span> : null}
                          {item.tags.map((tag) => (
                            <span key={`${item.id}-${tag}`} className="my-skills-progress-pill is-tag">{tag}</span>
                          ))}
                          {item.domains.map((domain) => (
                            <span key={`${item.id}-${domain.label}`} className={`my-skills-progress-pill ${domain.tone}`}>{domain.label}</span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="my-skills-progress-empty">
            <BadgeCheck size={18} strokeWidth={2} />
            <strong>No detailed published result found.</strong>
          </div>
        )}
      </section>
    </section>
  )
}
