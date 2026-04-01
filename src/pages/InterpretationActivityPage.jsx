import ImageActivityPage from './ImageActivityPage'
import '../styles/config/interpretation-activity.css'

const interpretationActivitySeed = {
  activity: {
    id: 'interpretation-activity-seed',
    name: 'Interpret the most important clinical finding visible in the case.',
    certifiable: false,
    type: 'Interpretation',
    marks: 'Nil',
    status: 'Draft',
  },
  record: {
    year: 'Not available',
    subject: 'Not available',
    competency: 'Not available',
    topic: '',
  },
}

/**
 * InterpretationActivityPage Implementation Contract
 * Structure:
 * - Reuses the full Image Activity workflow shell with interpretation-specific defaults and labels.
 * Dependencies:
 * - Shared ImageActivityPage workflow component.
 * Props / Data:
 * - onAlert is passed through so interpretation actions can reuse the shared alert system.
 * State:
 * - All workflow state is owned by the reused ImageActivityPage component.
 * Responsive behavior:
 * - Inherits the same responsive workflow behavior as ImageActivityPage.
 * Placement:
 * - Page-level route wrapper in src/pages/.
 */
export default function InterpretationActivityPage({ activityData, onAlert }) {
  return (
    <ImageActivityPage
      activityData={activityData ?? interpretationActivitySeed}
      onAlert={onAlert}
      workflowType="interpretation"
    />
  )
}
