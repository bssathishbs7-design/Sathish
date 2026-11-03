import FloatingTooltip from './FloatingTooltip'
import { Info } from 'lucide-react'
import './InstructionBadge.css'

/** Reusable naming guidance. @param {{content: import('react').ReactNode, title?: string}} props */
export default function InstructionBadge({ content, title = 'Activity Instructions' }) {
  return (
    <FloatingTooltip interactive arrow label="Activity name instructions" className="instruction-badge"
      tooltipClassName="instruction-badge-popover" content={
        <>
          <h3 className="instruction-badge-heading">{title}</h3>
          <div className="instruction-badge-scroll" tabIndex={0} role="region" aria-label={`${title} content`}><p className="instruction-badge-content">{content}</p></div>
        </>
      }>
      <Info size={14} strokeWidth={2} aria-hidden="true" />
      Instructions
    </FloatingTooltip>
  )
}
