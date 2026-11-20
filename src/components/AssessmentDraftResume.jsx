import { LayoutGrid, SlidersHorizontal, FilePlus2, Database, Eye, Settings, ArrowRight } from 'lucide-react'
import './AssessmentDraftResume.css'

const steps = {
  createBlueprint: ['Continue blueprint creation', LayoutGrid],
  blueprint: ['Continue blueprint selection', SlidersHorizontal],
  create: ['Continue question creation', FilePlus2],
  questionBank: ['Continue question selection', Database],
  preview: ['Continue assessment preview', Eye],
  configuration: ['Continue configuration', Settings],
}

/** Display the workspace step persisted when this assessment draft was saved.
 * @param {{draft:Object}} props Saved assessment with optional setup.draftWorkspace.activeCreateTab.
 */
export default function AssessmentDraftResume({ draft }) {
  const [label, Icon] = steps[draft?.setup?.draftWorkspace?.activeCreateTab] || ['Continue assessment setup', ArrowRight]
  return <div className="assessment-draft-resume"><span><Icon size={14} aria-hidden="true" />Resume from</span><strong>{label}</strong></div>
}
