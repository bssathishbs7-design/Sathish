import { CalendarClock } from 'lucide-react'
import './AssessmentSchedulePanel.css'

/** @param {{sections:Array<{content:import('react').ReactNode,hidden?:boolean}>}} props Draft changes are owned by the page and validated on submission. */
export default function AssessmentSchedulePanel({ sections }) {
  return <div className="assessment-schedule-panel">
    <header><h3><CalendarClock size={16} aria-hidden="true" />Schedule &amp; Answer Settings</h3></header>
    <div className="assessment-schedule-form">
      {sections.filter(section => !section.hidden).map((section, index) => <div className="assessment-schedule-form-section" key={index}>{section.content}</div>)}
    </div>
  </div>
}
