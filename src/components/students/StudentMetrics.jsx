import { studying, studentProgress } from '../../services/studentCalendar'
import { today } from '../../services/studentModel'
import { Layers, Users, UserCheck, Hourglass } from 'lucide-react'
import { createElement } from 'react'
import './StudentMetrics.css'
/** Uses the same summary cards as Admin Logbook, with counts derived from the directory. */
export default function StudentMetrics({ data }) {
 const metrics=[['Batches',data.batches.length,Layers],['Students',data.students.filter(studying).length,Users],['Active',data.students.filter(s=>studying(s)&&s.status==='Active').length,UserCheck],['Backlog',data.students.filter(s=>studying(s)&&studentProgress(data,s,today()).lag>0).length,Hourglass]]
 return <div className="lb-summary-strip admin-logbook-metrics sm-directory-metrics" data-count="4" aria-label="Student directory metrics">{metrics.map(([label,value,Icon],index)=><div className={'lb-summary-item my-skills-metric-card '+(index<2?'is-assigned':'is-completed')} key={label}><span className="my-skills-metric-card-icon">{createElement(Icon,{size:18,'aria-hidden':true})}</span><span className="my-skills-metric-card-copy"><strong>{value}</strong><span>{label}</span></span></div>)}</div>
}
