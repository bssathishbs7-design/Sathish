import { LayoutTemplate, ClipboardCheck, Send, FileText, SlidersHorizontal } from 'lucide-react'
import CopyIdBadge from './CopyIdBadge'
import { readBlueprintWorkflow } from '../services/blueprintApproval'
import { getAssessmentAutomationConfiguration } from '../services/assessmentAutomation'
import { getAssessmentConfigurationStatus } from '../services/assessmentConfigurationStatus'
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
  const configurationStatus = getAssessmentConfigurationStatus(setup)
  const blueprint = setup.blueprintEnabled ?? setup.draftWorkspace?.blueprint?.enabled ?? Boolean(blueprintFlow?.snapshot || setup.blueprintId)
  // Blueprint queue records describe a submitted blueprint; stale authoring flags
  // must not hide its approval status or approved ID.
  const blueprintEnabled = assessment?.activityType === 'Blueprint' || blueprint === true || blueprint === 'Yes'
  const blueprintStatus = blueprintFlow?.status || (assessment?.activityType === 'Blueprint' ? assessment.approvalStatus : setup.blueprintStatus) || 'Draft'
  const blueprintId = blueprintFlow?.blueprintId || setup.blueprintId || assessment?.blueprintId
  const showBlueprintId = blueprintEnabled && blueprintStatus === 'Approved' && Boolean(blueprintId)
  const blueprintLabel = !blueprintEnabled ? 'No' : showBlueprintId ? blueprintId : ({
    Draft: 'In progress',
    'Pending Approval': 'Pending approval',
    'Approval Rejected': 'Rejected',
    'Revision required': 'Revision required',
    'Not required': 'Saved',
  }[blueprintStatus] || blueprintStatus)
  const settings = [
    ['Blueprint', blueprintEnabled, LayoutTemplate],
    ['Evaluation', policy.rows.length > 0 && policy.rows.every(row => row.evaluation), ClipboardCheck],
    ['Auto Publish', policy.canAutoPublishCombined, Send],
    ['Instructions', configurationStatus.instructions, FileText],
    ['Threshold', configurationStatus.thresholdChanged, SlidersHorizontal],
  ]
  return <dl className="assessment-card-settings" aria-label="Assessment settings">
    {settings.map(([label, enabled, SettingIcon]) => <div key={label}><dt><SettingIcon size={13} aria-hidden="true" />{label}</dt><dd className={label === 'Blueprint' ? showBlueprintId ? 'assessment-card-blueprint-id' : 'is-no' : enabled ? 'is-yes' : 'is-no'}>{label === 'Blueprint' ? showBlueprintId ? <CopyIdBadge value={blueprintId} label="blueprint ID" /> : blueprintLabel : label === 'Threshold' ? enabled ? 'Changed' : 'Default' : enabled ? 'Yes' : 'No'}</dd></div>)}
  </dl>
}
