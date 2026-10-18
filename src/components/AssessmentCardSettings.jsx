import { readBlueprintWorkflow } from '../services/blueprintApproval'
import { getAssessmentAutomationConfiguration } from '../services/assessmentAutomation'
import './AssessmentCardSettings.css'

/** @param {{assessment:Object}} props Saved draft or published assessment, including setup and questionRows. */
export default function AssessmentCardSettings({ assessment }) {
  const setup = { ...assessment, ...assessment?.setup }
  const blueprintFlow = readBlueprintWorkflow(setup.assessmentId || assessment?.id)
  setup.examDeliveryMode = setup.examDeliveryMode || setup.examMode || 'Online'
  const questions = assessment?.questionRows || setup.questionRows || []
  const examType = String(setup.examType || '').toLowerCase()
  const types = questions.length
    ? { hasMcq: questions.some(question => question.type === 'MCQ'), hasDescriptive: questions.some(question => question.type !== 'MCQ') }
    : { hasMcq: /mcq|hybrid/.test(examType), hasDescriptive: /descriptive|hybrid|saq|laq/.test(examType) }
  const policy = getAssessmentAutomationConfiguration(setup, types)
  const blueprint = Boolean(blueprintFlow?.snapshot) || (setup.blueprintEnabled ?? setup.draftWorkspace?.blueprint?.enabled ?? Boolean(setup.blueprintId))
  const settings = [
    ['Blueprint', blueprint === true || blueprint === 'Yes'],
    ['Evaluation', policy.rows.length > 0 && policy.rows.every(row => row.evaluation)],
    ['Auto Publish', policy.canAutoPublishCombined],
  ]
  return <dl className="assessment-card-settings" aria-label="Assessment settings">
    {blueprintFlow && <div><dt><span className="mono">{blueprintFlow.blueprintId}</span><br />Blueprint {blueprintFlow.status === 'Not required' ? 'saved' : blueprintFlow.status.toLowerCase()}</dt></div>}
    {settings.map(([label, enabled]) => <div key={label}><dt>{label}</dt><dd className={enabled ? 'is-yes' : 'is-no'}>{enabled ? 'Yes' : 'No'}</dd></div>)}
  </dl>
}
