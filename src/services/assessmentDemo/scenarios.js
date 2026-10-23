import { demoQuestions, DEMO_STUDENTS } from './questions.js'
const day = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
const time = date => `${String(date.getHours()%12||12).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
const period = date => date.getHours()>=12?'PM':'AM'
/** Scenario definitions are static; dates are anchored to first installation (or explicit refresh).
 * @typedef {Object} DemoAssessment
 * @property {string} id Stable demo-assessment-* ID shared by faculty/student views.
 * @property {Object} setup Authoring, schedule and automation settings.
 * @property {Object[]} questionRows Real question-bank shaped content.
 * @property {Object[]} students Shared assigned student roster.
 * @property {string} demoScenario Fixture identity; never interpreted as a workflow status.
 */
export const DEMO_SCENARIOS = [
 ['draft-mcq','Physiology MCQ','draft','MCQ','Practice Exam'],
 ['draft-hybrid','Hybrid with nested questions','draft','Hybrid','Proctored Exam'],
 ['draft-descriptive','Descriptive assessment','draft','Descriptive','Practice Exam'],
 ['pending','Pending approval: hybrid','pending','Hybrid','Proctored Exam'],
 ['expired','Expired: reschedule practice','expired','Hybrid','Practice Exam'],
 ['approved','Approved: descriptive review','approved','Descriptive','Proctored Exam'],
 ['rejected','Rejected: revise and resubmit','rejected','MCQ','Practice Exam'],
 ['practice-live','Live practice: 10 + 20 descriptive questions','live','Hybrid','Practice Exam','long'],
 ['proctored-live','Live proctored: hybrid assessment','live','Hybrid','Proctored Exam'],
 ['practice-mcq','Live practice: MCQ with automatic results','live','MCQ','Practice Exam','auto'],
 ['proctored-mcq','Live proctored: MCQ only','live','MCQ','Proctored Exam'],
 ['readonly','Live practice: read-only paper','live','Descriptive','Practice Exam','readonly'],
 ['split','Live proctored: timed section sequence','live','Hybrid','Proctored Exam','split'],
 ['upcoming-practice','Upcoming practice assessment','upcoming','Hybrid','Practice Exam'],
 ['upcoming-proctored','Upcoming proctored assessment','upcoming','MCQ','Proctored Exam'],
 ['countdown','Starts soon: countdown example','soon','Hybrid','Proctored Exam'],
 ['manual-evaluation','Completed: manual evaluation pending','evaluation','Hybrid','Proctored Exam','manual'],
 ['pending-publication','Evaluated: awaiting publication','evaluated','Hybrid','Practice Exam'],
 ['auto-result','Published: automatic MCQ results','results','MCQ','Practice Exam','auto'],
 ['hybrid-result','Published: hybrid results and corrections','results','Hybrid','Proctored Exam','manual'],
 ['offline','Offline: attendance and marking','evaluation','Hybrid','Offline Exam','offline'],
 ['paused','Live proctored: invigilator lock','live','MCQ','Proctored Exam','paused'],
 ['locked','Live proctored: access request','live','MCQ','Proctored Exam','locked'],
]
/** Pure fixture factory; no storage or network side effects. @returns {{drafts:DemoAssessment[],queue:Object[],published:DemoAssessment[]}} */
export function createAssessmentDemoData(now = new Date()) {
 const result={drafts:[],queue:[],published:[]}
 DEMO_SCENARIOS.forEach(([slug,title,stage,kind,mode,variant],index)=>{
  const start=new Date(now.getTime()+(['live'].includes(stage)?-10:stage==='soon'?8:['evaluation','evaluated','results','expired'].includes(stage)?-2880:1440)*60000)
  const end=new Date(start.getTime()+120*60000)
  const id=`demo-assessment-${slug}`, code=`DEMO${String(index+1).padStart(3,'0')}`
  const questionRows=demoQuestions(kind,variant==='long')
  const auto=variant==='auto'
  const manual=variant==='manual'||variant==='offline'||variant==='readonly'
  const setup={assessmentId:id,assessmentCode:code,assessmentName:title,collegeName:'Medsy Demo Medical College',academicYear:`${now.getFullYear()} - ${now.getFullYear()+1}`,examCategory:'Midterm',course:'MBBS',year:'First Year',assignYear:'First Year',assignGroup:'SGT Group A',sgt:'SGT Group A',examType:kind,
   examDeliveryMode:variant==='offline'?'Offline':'Online',supervisionType:mode,examDate:day(start),startTime:time(start),startPeriod:period(start),
   practiceStartDate:day(start),practiceStartTime:time(start),practiceStartPeriod:period(start),practiceEndDate:day(end),practiceEndTime:time(end),practiceEndPeriod:period(end),
   totalDuration:'02:00',proctoredTotalDuration:'02:00',offlineDuration:'02:00',mcqDisplayType:'Answer Input',descriptiveDisplayType:variant==='readonly'?'Read-Only':'Answer Input',
   descriptiveAutoEvaluation:manual?'No':'Yes',mcqAutoEvaluation:'Yes',mcqAutoPublish:auto?'On':'Off',descriptiveAutoPublish:auto?'On':'Off',
   provideStudentInstructions:'Yes',studentInstructions:'Read every question carefully. Save your responses before submitting. Use the question navigator to return to questions marked Try Later.',
   approvalFlow:index%2?'Send to Approval':'Direct Publish',splitProctoredDuration:variant==='split',proctoredSectionSequence:'mcq-first',mcqTimeLimit:'01:00',descriptiveTimeLimit:'01:00',
   lotThreshold:'70',hotThreshold:'60',questionRows,students:DEMO_STUDENTS.map(s=>({...s})),
  }
  const row={id,assessmentId:id,assessmentCode:code,demoScenario:slug,assessmentName:title,examCategory:'Midterm',academicYear:setup.academicYear,assignTo:'First Year',assignYear:'First Year',assignSgt:'SGT Group A',examMode:setup.examDeliveryMode,supervisionType:mode,examType:kind,
   startDate:day(start),startTime:`${time(start)} ${period(start)}`,endDate:mode==='Practice Exam'?day(end):'',endTime:mode==='Practice Exam'?`${time(end)} ${period(end)}`:'',totalDuration:'02:00',duration:'02:00',totalMarks:questionRows.reduce((sum,q)=>sum+q.marks,0),questionCount:questionRows.length,questionRows,students:setup.students,setup,
   publicationMethod:index%2?'approval':'direct',publishedAt:new Date(now.getTime()-86400000).toISOString(),createdAt:new Date(now.getTime()-172800000).toISOString(),updatedAt:now.toISOString(),
   publishedLog:[{facultyName:'Dr. Meera Nair',remarks:index%2?'Assessment approved and published':'Direct publish',timestamp:new Date(now.getTime()-86400000).toISOString()}],
  }
  if(stage==='draft'){result.drafts.push({...row,status:'Draft',savedAt:now.toISOString()});return}
  if(['pending','expired','approved','rejected'].includes(stage)){
   result.queue.push({...row,id:`approval-${id}`,activityId:id,activityType:'Assessment',activityName:title,status:'Submitted',approvalStatus:stage==='approved'?'Approved':stage==='rejected'?'Approval Rejected':'Pending Approval',
    senderName:'Dr. Arjun Rao',senderId:'EMP1001',senderDesignation:'Assistant Professor',sentAt:row.createdAt,receivedAt:row.createdAt,reviewedAt:['approved','rejected'].includes(stage)?now.toISOString():null,
    reviewRemarks:stage==='rejected'?'Please review question coverage and resubmit.':'Ready for review.',reviewerName:'Dr. Meera Nair',approvalFaculty:{facultyName:'Dr. Meera Nair',employeeId:'EMP1021',designation:'Professor',note:'Please review this assessment.'}});return
  }
  result.published.push({...row,status:'Published',evaluationStatus:stage==='results'?'Published':stage==='evaluated'?'Completed':stage==='evaluation'?'In Progress':'Pending Evaluation',resultStatus:stage==='results'?'Published':'Pending',demoStage:stage})
 })
 return result
}
/** Async mock API boundary. Replace with a backend fixture endpoint for integrated development. */
export async function fetchAssessmentDemoData(now = new Date()) { return createAssessmentDemoData(now) }
