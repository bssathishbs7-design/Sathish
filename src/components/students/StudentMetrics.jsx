import { createElement } from 'react'
import { Layers, Users, UserCheck, ClipboardList } from 'lucide-react'
import './StudentMetrics.css'
/** Counts use the full directory, independent of the selected batch. */
export default function StudentMetrics({ data }) {
 const metrics=[{label:'Admission batches',value:data.batches.length,Icon:Layers,tone:'mint'},{label:'Total students',value:data.students.length,Icon:Users,tone:'sky'},{label:'Active accounts',value:data.students.filter(s=>s.status==='Active').length,Icon:UserCheck,tone:'lilac'},{label:'Needs setup',value:data.students.filter(s=>!s.tracked).length,Icon:ClipboardList,tone:'butter'}]
 return <div className="sm-metrics" aria-label="Student directory metrics">{metrics.map(({label,value,Icon,tone})=><div className={'sm-metric sm-accent-'+tone} key={label}><span className="sm-metric-icon">{createElement(Icon, { size: 20 })}</span><div><span>{label}</span><strong>{value}</strong></div></div>)}</div>
}
