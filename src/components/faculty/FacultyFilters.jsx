import ManagementSelect from '../ManagementSelect'
import { DESIGNATIONS, SUBJECT_CATALOG, SGT_VALUES } from '../../services/facultyModel'
import { STUDY_YEARS, calendarLabel } from '../../services/studentCalendar'
import './FacultyFilters.css'

/** Controlled list filters; all labels describe the same context used by the assignment resolver. */
export default function FacultyFilters({view,data,status,subject,extra,onStatus,onSubject,onExtra,onReset}) {
 const field=(label,value,options,change)=><label className="fm-field"><span>{label}</span><ManagementSelect value={value||''} onChange={e=>change(e.target.value)}><option value="">All {label.toLowerCase()}</option>{options.map(([key,text])=><option key={key} value={key}>{text}</option>)}</ManagementSelect></label>
 const periods=[...new Set(data.assignments.flatMap(a=>a.calendarRefs.map(c=>c.fromMonth+'/'+c.toMonth)))]
 return <div className="fm-filter-panel">
 {field('Statuses',status,(view==='Faculty'?['ACTIVE','INACTIVE']:['DRAFT','SCHEDULED','ACTIVE','BLOCKED','ENDED','CANCELLED','REVIEW']).map(s=>[s,s==='REVIEW'?'Needs review':s.charAt(0)+s.slice(1).toLowerCase()]),onStatus)}
 {field('Subjects',subject,SUBJECT_CATALOG.map(s=>[s.id,s.name]),onSubject)}
 {view==='Faculty'?<>
 {field('Departments',extra.department,[...new Set(data.faculty.map(f=>f.departmentId))].map(s=>[s,s]),v=>onExtra('department',v))}
 {field('Designations',extra.designation,DESIGNATIONS.map(s=>[s,s]),v=>onExtra('designation',v))}
 {field('Coverage',extra.coverage,[['assigned','Active assignments'],['scheduled','Scheduled only'],['unassigned','Unassigned']],v=>onExtra('coverage',v))}
 </>:<>
 {field('Study years',extra.year,STUDY_YEARS.map(s=>[s,s]),v=>onExtra('year',v))}
 {field('Academic periods',extra.period,periods.map(p=>[p,calendarLabel(p)]),v=>onExtra('period',v))}
 {field('SGTs',extra.sgt,SGT_VALUES.map(s=>[s,'SGT '+s]),v=>onExtra('sgt',v))}
 </>}
 <button className="fm-btn" onClick={onReset}>Reset filters</button>
 </div>
}

