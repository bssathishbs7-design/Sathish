import { useMemo } from 'react'
import {
  CheckCircle2,
  ClipboardCheck,
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

const SECTION_CONFIGS = [
  { key: 'checklist', label: 'Checklist', scoreHeader: 'Chk Score', criticalHeader: 'Chk Crit', percentHeader: 'Chk %' },
  { key: 'form', label: 'Form', scoreHeader: 'Form Score', criticalHeader: 'Form Crit', percentHeader: 'Form %' },
  { key: 'scaffolding', label: 'Scaffold', scoreHeader: 'Scaf Score', criticalHeader: 'Scaf Crit', percentHeader: 'Scaf %' },
  { key: 'question', label: 'Question', scoreHeader: 'Q Score', criticalHeader: 'Q Crit', percentHeader: 'Q %' },
  { key: 'image', label: 'Image', scoreHeader: 'Img Score', criticalHeader: 'Img Crit', percentHeader: 'Img %' },
]

export default function CompletedEvaluationPage({
  completedEvaluationRows = [],
  activityId,
  activityRecord,
  onBackToEvaluation,
}) {
  const filteredRows = useMemo(() => (
    activityId
      ? completedEvaluationRows.filter((row) => row.activityId === activityId)
      : completedEvaluationRows
  ), [activityId, completedEvaluationRows])

  const visibleSections = useMemo(() => (
    SECTION_CONFIGS.filter((section) => filteredRows.some((row) => (row[section.key]?.itemCount ?? 0) > 0))
  ), [filteredRows])

  const tableHeaders = useMemo(() => ([
    { key: 'studentName', label: 'Student' },
    { key: 'registerId', label: 'ID' },
    ...visibleSections.flatMap((section) => ([
      { key: `${section.key}-score`, label: section.scoreHeader },
      { key: `${section.key}-critical`, label: section.criticalHeader },
      { key: `${section.key}-percent`, label: section.percentHeader },
    ])),
    { key: 'overallCriticalMarks', label: 'Crit Score' },
    { key: 'overallCriticalPercentage', label: 'Critical %' },
    { key: 'totalMarks', label: 'Total' },
    { key: 'totalObtainedMarks', label: 'Obt' },
    { key: 'totalPercentage', label: 'Total %' },
  ]), [visibleSections])

  return (
    <section className="vx-content forms-page eval-page">
      <div className="eval-shell">
        <section className="eval-header">
          <div className="eval-header-copy">
            <span className="eval-kicker">Completed Evaluations</span>
            <h1>{activityRecord?.activityName ?? 'Completed Evaluation'}</h1>
            <p>Review submitted evaluation results for this activity in one clear table.</p>
            <div className="eval-header-inline">
              <span><CheckCircle2 size={13} strokeWidth={2} /> Completed <strong>{filteredRows.length}</strong></span>
              <span><ClipboardCheck size={13} strokeWidth={2} /> Records</span>
            </div>
          </div>

          <div className="eval-header-side">
            <span>Status</span>
            <strong>Completed Only</strong>
            <button type="button" className="ghost" onClick={onBackToEvaluation}>
              Back to Evaluation
            </button>
          </div>
        </section>

        {filteredRows.length ? (
          <div className="eval-table-wrap">
            <table className="eval-table eval-table-completed">
              <thead>
                <tr>
                  {tableHeaders.map((header) => <th key={header.key} title={header.label}>{header.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="eval-table-title">
                        <strong>{row.studentName}</strong>
                      </div>
                    </td>
                    <td>{row.registerId}</td>
                    {visibleSections.flatMap((section) => {
                      const sectionStats = row[section.key] ?? {}

                      return [
                        <td key={`${row.id}-${section.key}-score`}>{formatMarks(sectionStats.obtainedMarks)}</td>,
                        <td key={`${row.id}-${section.key}-critical`}>{formatMarks(sectionStats.criticalObtainedMarks)}</td>,
                        <td key={`${row.id}-${section.key}-percent`}>{formatPercent(sectionStats.percentage)}</td>,
                      ]
                    })}
                    <td>{formatMarks(row.overallCriticalMarks)}</td>
                    <td>{formatPercent(row.overallCriticalPercentage)}</td>
                    <td>{formatMarks(row.totalMarks)}</td>
                    <td>{formatMarks(row.totalObtainedMarks)}</td>
                    <td>{formatPercent(row.totalPercentage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
