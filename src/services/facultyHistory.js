import { subjectName } from './facultyModel.js'

/** Human-readable audit differences; internal records stay out of the product interface. */
export function describeFacultyHistory(event) {
  const lines=[]
  for(const profile of event.after.faculty) {
    const old=event.before.faculty.find(p=>p.id===profile.id)
    if(!old) {lines.push(profile.name+' added ('+profile.employeeId+').');continue}
    for(const [key,label] of [['name','Name'],['employeeId','Employee ID'],['email','Email'],['phone','Phone'],['departmentId','Department'],['designationId','Designation'],['accountStatus','Account status']]) if(old[key]!==profile[key]) lines.push(profile.name+' · '+label+': '+(old[key]||'Not set')+' → '+(profile[key]||'Not set'))
    if(JSON.stringify(old.eligibleSubjectIds)!==JSON.stringify(profile.eligibleSubjectIds)) lines.push(profile.name+' · Eligible subjects: '+profile.eligibleSubjectIds.map(subjectName).join(', '))
  }
  for(const a of event.after.assignments) {
    const old=event.before.assignments.find(p=>p.id===a.id)
    if(old&&old.revision===a.revision)continue
    const name=event.after.faculty.find(f=>f.id===a.facultyId)?.name||'Faculty'
    lines.push(name+' · '+subjectName(a.subjectId)+': '+(old?old.state.toLowerCase()+' → ':'')+a.state.toLowerCase()+', '+a.members.length+' students, '+(a.startsOn||'dates pending')+' to '+(a.endsOn||'dates pending')+'.')
  }
  return lines
}

