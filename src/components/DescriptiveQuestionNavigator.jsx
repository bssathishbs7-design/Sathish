import { useEffect, useState } from 'react'
import { descriptiveQuestionProgress } from '../services/descriptiveResponses'
import { FileText, ListTree, ChevronRight } from 'lucide-react'
import './DescriptiveQuestionNavigator.css'

/** Section navigation. questions/answers and navigationStatuses are owned and persisted by the exam page. */
export default function DescriptiveQuestionNavigator({groups,questions,answers,navigationStatuses={},activeIndex,mode,onMode,onSelect,numberFor,disabled=false}) {
  const activeGroup = groups.find(group=>group.questions.includes(questions[activeIndex]))?.key
  const [expanded,setExpanded] = useState([activeGroup])
  useEffect(()=>setExpanded([activeGroup]),[activeGroup])
  const statuses = questions.map((question,index)=> navigationStatuses[question.id ?? index]==='try-later' ? 'Try Later' : descriptiveQuestionProgress(question,index,answers)==='Answered' ? 'Answered' : navigationStatuses[question.id ?? index] ? 'Viewed' : 'Not Viewed')
  const answered = questions.filter((question,index)=>descriptiveQuestionProgress(question,index,answers)==='Answered').length
  return <div className="descriptive-question-navigator">
    <div className="descriptive-view-switch" role="group" aria-label="Display mode">
      <button type="button" aria-pressed={mode==='single'} onClick={()=>onMode('single')} disabled={disabled}><FileText size={14} aria-hidden="true" />Question view</button>
      <button type="button" aria-pressed={mode==='all'} onClick={()=>onMode('all')} disabled={disabled}><ListTree size={14} aria-hidden="true" />Section view</button>
    </div>
    <details className="descriptive-question-map" open>
      <summary>Questions <span className="descriptive-nav-progress">{answered} of {questions.length} answered</span></summary>
      <div className="descriptive-section-scroll">
      {groups.map(group=><details className="descriptive-nav-section" key={group.key} open={expanded.includes(group.key)}>
        <summary onClick={event=>{event.preventDefault();setExpanded(current=>current.includes(group.key)?current.filter(key=>key!==group.key):[...current,group.key])}} title={`${group.roman} ${group.title}`}><ChevronRight size={14} aria-hidden="true" /><span>{group.roman} {group.title}</span><small>{group.questions.length}</small></summary>
        <div className="descriptive-question-buttons online-practice-number-nav">
          {group.questions.map(question=>{const index=questions.indexOf(question);const status=statuses[index];return <button type="button" key={question.id??index} disabled={disabled} className={`is-${status.toLowerCase().replaceAll(' ','-')}`} aria-current={index===activeIndex?'step':undefined} aria-label={`Question ${numberFor(question)}, ${status}`} title={status} onClick={()=>onSelect(index)}>{numberFor(question)}</button>})}
        </div>
      </details>)}
      </div>
      <div className="online-practice-question-status-legend" aria-label="Question status legend">{['Answered','Try Later','Not Viewed','Viewed'].map(status=><span key={status} className={`is-${status.toLowerCase().replaceAll(' ','-')}`}><i aria-hidden="true" />{status}</span>)}</div>
    </details>
  </div>
}
