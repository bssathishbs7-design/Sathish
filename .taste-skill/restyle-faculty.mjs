import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
for(const name of readdirSync('src/components/faculty').filter(n=>n.endsWith('.jsx'))){
 const p='src/components/faculty/'+name;let s=readFileSync(p,'utf8')
 if(s.includes('<select'))writeFileSync(p,"import ManagementSelect from '../ManagementSelect'\n"+s.replaceAll('<select','<ManagementSelect').replaceAll('</select>','</ManagementSelect>'))
}
const p='src/pages/FacultyManagementPageV2.jsx';let s=readFileSync(p,'utf8')
s=s.replace('Plus, Upload, RefreshCw','Plus, Upload, RefreshCw, Search, UsersRound, BookOpen, GraduationCap, ClipboardList')
s=s.replace("import './FacultyManagementPageV2.css'", "import './StudentManagementPage.css'\nimport './StudentManagementWorkspace.css'\nimport '../components/students/StudentManagementHeader.css'\nimport '../components/students/StudentMetrics.css'\nimport './FacultyManagementPageV2.css'")
s=s.replace('vx-content logbook-scope fm-workspace','vx-content logbook-scope student-management-page fm-workspace')
const a=s.indexOf('    <header className="fm-heading">'),b=s.indexOf('\n    {!canEdit',a)
s=s.slice(0,a)+`    <div className="sm-directory-overview"><header className="my-skills-overview lb-page-head admin-page-head">
      <div className="my-skills-overview-main"><div className="my-skills-overview-copy"><h1>Faculty management</h1><p>Manage faculty profiles and teaching responsibilities.</p></div>
      {data&&<div className="lb-summary-strip admin-logbook-metrics sm-directory-metrics" data-count="4" aria-label="Faculty directory metrics">{[
        ['Faculty',data.faculty.length,<UsersRound size={18}/>],
        ['Assignments',active.length,<BookOpen size={18}/>],
        ['Students',new Set(active.flatMap(a=>effectiveFacultyRoster(a,data,directory).map(m=>m.studentId))).size,<GraduationCap size={18}/>],
        ['Needs review',Object.values(changes).filter(c=>c.needsReview).length,<ClipboardList size={18}/>]
        .map(([label,value,icon],index)=><div className={'lb-summary-item my-skills-metric-card '+(index<2?'is-assigned':'is-completed')} key={label}><span className="my-skills-metric-card-icon" aria-hidden="true">{icon}</span><span className="my-skills-metric-card-copy"><strong>{value}</strong><span>{label}</span></span></div>)}</div>}
      </div><div className="my-skills-live-card lb-create-card admin-action-card"><div className="my-skills-live-card-body"><strong>Organise your faculty</strong><p>Add faculty, then assign students by year, subject and SGT.</p></div><div className="sm-header-actions">{canEdit&&<><button className="tool-btn my-skills-live-card-cta lb-new-entry-btn" disabled={!data} onClick={()=>setMode({type:'import'})}><Upload size={16}/>Import faculty</button><button className="tool-btn my-skills-live-card-cta lb-new-entry-btn" disabled={!data} onClick={()=>setMode({type:'profile'})}><Plus size={16}/>Add faculty</button></>}</div></div>
    </header></div>`+s.slice(b)
const c=s.indexOf('      <div className="fm-metrics">'),d=s.indexOf('\n      <nav',c);s=s.slice(0,c)+s.slice(d)
s=s.replace('<span>Search {view.toLowerCase()}</span><input type="search"','<Search size={16} aria-hidden="true"/><input aria-label={"Search "+view.toLowerCase()} type="search"')
s=s.replace("{view!=='History'&&<button",`<button className="fm-btn fm-icon-btn" onClick={refresh} disabled={refreshing} aria-label="Refresh faculty records"><RefreshCw size={16}/></button>
        {view!=='History'&&<button`)
writeFileSync(p,s)
