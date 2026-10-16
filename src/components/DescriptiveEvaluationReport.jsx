import { getDescriptiveFeedbackSections } from '../services/descriptiveFeedback'
import { getAssessmentAutomationConfiguration } from '../services/assessmentAutomation'
import './DescriptiveEvaluationReport.css'

/** @param {{assessment:Object,result:Object,answer:string|Object,question:Object,maxMarks:number}} props Assessment settings, persisted automatic marks and the matching answer part. */
export default function DescriptiveEvaluationReport({ assessment, result, answer, question, maxMarks }) {
  const setup = { ...assessment, ...assessment?.setup }
  setup.examDeliveryMode = setup.examDeliveryMode || setup.examMode || 'Online'
  const automatic = getAssessmentAutomationConfiguration(setup, { hasDescriptive: true }).rows[0].evaluation
  if (!automatic || !result?.autoEvaluated || result.reviewRequired) return null
  const earnedMarks = Number(result.marks) || 0
  const ratio = result.coverageRatio ?? (maxMarks > 0 ? earnedMarks / maxMarks : 0)
  const status = result.reviewStatus || (ratio >= .72 ? 'Correct' : ratio > 0 ? 'Needs review' : 'Wrong')
  const sections = getDescriptiveFeedbackSections({ answer, evaluation: { status, earnedMarks, maxMarks, ratio }, guidance: question.answerKey || question.modelAnswer || question.rationale || question.explanation || '', marks: maxMarks })
  return <section className={`descriptive-evaluation-report ${status === 'Wrong' ? 'is-wrong' : status === 'Correct' ? 'is-correct' : 'is-partial'}`} aria-label="Descriptive Evaluation Report">
    {sections.filter(section => !section.summary).map(section => <div className="descriptive-evaluation-report-section" key={section.heading}>
      <h4>{section.heading}</h4><p>{section.body.replace('this practice evaluation', 'this evaluation')}</p>
    </div>)}
  </section>
}
