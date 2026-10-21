import { Info, ClipboardCheck, Eye, Pencil, FileText } from 'lucide-react'
import FloatingTooltip from './FloatingTooltip'
import { getAssessmentResponseSummary } from '../services/assessmentResponseSummary'
import './AssessmentExamType.css'

/** @param {{assessment:Object, questions?:Array<Object>}} props */
export default function AssessmentExamType({assessment, questions}) {
  const {type, details} = getAssessmentResponseSummary(assessment, questions)
  return <span className="assessment-exam-type" data-exam-type={type}><strong>{type}</strong>{details.length > 0 && <FloatingTooltip interactive label={type + ' student response details'} className="assessment-exam-type-info" content={<div className="assessment-exam-type-details"><header><ClipboardCheck size={16} aria-hidden="true" /><b>Student response</b><span>{type}</span></header><dl>{details.map(row => {
    const readOnly = row.response === 'Read-only'
    const offline = row.response === 'Answers provided offline'
    const ResponseIcon = offline ? FileText : readOnly ? Eye : Pencil
    return <div key={row.label}><dt>{row.label}</dt><dd className={offline ? 'is-offline' : readOnly ? 'is-read-only' : 'is-answer-input'}><ResponseIcon size={13} aria-hidden="true" />{row.response}</dd></div>
  })}</dl></div>}><Info size={14} aria-hidden="true" /></FloatingTooltip>}</span>
}
