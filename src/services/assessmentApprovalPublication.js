import {appendAssessmentHistory} from './assessmentHistory.js'
import {rescheduleAssessment, isPracticeSchedule} from './assessmentReschedule.js'
/** Convert a saved 12/24-hour clock to a native time input value. */
const to24 = (value, period = '') => {
 const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
 if (!match) return ''
 let hours = Number(match[1]); const suffix = (match[3] || period).toUpperCase()
 if (suffix) { if(hours < 1 || hours > 12) return ''; hours = hours % 12 + (suffix === 'PM' ? 12 : 0) }
 return String(hours).padStart(2,'0') + ':' + match[2]
}
const isoDate = value => String(value || '').replace(/^(\d{2})-(\d{2})-(\d{4})$/, '$3-$2-$1')
/** Build the published record from the reviewer snapshot and validate its future schedule.
 * @param {Object} reviewed Latest reviewed assessment, including setup and questionRows.
 * @param {string} actor Reviewer name.
 * @param {Date} now Publication timestamp.
 */
export function buildApprovedPublication(reviewed, actor, now = new Date()) {
 const setup = reviewed.setup || {}
 if (!setup.assessmentId || !reviewed.questionRows?.length) throw new Error('Add assessment details and questions before publishing.')
 const practice = isPracticeSchedule(reviewed)
 const date = isoDate((practice ? setup.practiceStartDate : setup.examDate) || reviewed.examDate || reviewed.startDate)
 const time = to24((practice ? setup.practiceStartTime : setup.startTime) || reviewed.startTime, practice ? setup.practiceStartPeriod : setup.startPeriod)
 let scheduled
 try { scheduled = rescheduleAssessment({...reviewed,approvalStatus:'Pending Approval'}, {date,time,endDate:isoDate(setup.practiceEndDate),endTime:to24(setup.practiceEndTime,setup.practiceEndPeriod)},now) }
 catch (error) { throw new Error('Reschedule before publishing. ' + error.message) }
 const totalDuration = practice ? scheduled.totalDuration : reviewed.duration || setup.totalDuration || setup.offlineDuration || setup.proctoredTotalDuration
 if (!/^\d+:[0-5]\d$/.test(totalDuration || '') || !totalDuration.split(':').some(part=>Number(part)>0)) throw new Error('Set a valid exam duration before publishing.')
 return {...scheduled, id:setup.assessmentId, assessmentId:setup.assessmentId,
   status:'Published', approvalStatus:'Approved', publicationMethod:'approval', examMode:setup.examDeliveryMode || reviewed.assessmentMode,
   supervisionType:setup.supervisionType, academicYear:setup.academicYear, examCategory:setup.examCategory,
   assessmentName:reviewed.assessmentName || reviewed.activityName, assignTo:setup.assignGroup || setup.assignYear || setup.year || reviewed.assignTo,
   totalDuration, setup:{...scheduled.setup,totalDuration}, publishedAt:now.toISOString(),
   publishedLog:[{facultyName:actor,remarks:'Assessment approved and published',timestamp:now.toISOString()}],
 }
}

/** Commit publication and approval together, restoring all storage keys if any write fails. */
export function commitApprovedPublication(record, queue, local = localStorage, session = sessionStorage) {
 const pubKey='vx-assessment-published', draftKey='vx-assessment-drafts', queueKey='vx-approval-queue-rows'
 const id=record.setup.assessmentId
 const before=[[local,pubKey],[local,draftKey],[session,queueKey],[local,'vx-assessment-create-initial-tab'],[session,'vx-assessment-highlight'],[local,'vx-assessment-history:'+id]].map(([storage,key])=>[storage,key,storage.getItem(key)])
 const publications=JSON.parse(before[0][2] || '[]'), drafts=JSON.parse(before[1][2] || '[]')
 if(!Array.isArray(publications)||!Array.isArray(drafts)) throw new Error('Unable to read saved assessments. Please try again.')
 try {
   local.setItem(pubKey,JSON.stringify([record,...publications.filter(row=>(row.setup?.assessmentId || row.id)!==id)]))
   local.setItem(draftKey,JSON.stringify(drafts.filter(row=>(row.setup?.assessmentId || row.id)!==id)))
   session.setItem(queueKey,JSON.stringify(queue))
   local.setItem('vx-assessment-create-initial-tab','published')
   session.setItem('vx-assessment-highlight',id)
   appendAssessmentHistory(record,{action:'Assessment approved and published',actor:record.reviewedBy, timestamp:record.publishedAt},local)
 } catch(error) {
   for(const [storage,key] of before) storage.removeItem(key)
   for(const [storage,key,value] of before) if(value!==null)storage.setItem(key,value)
   throw error
 }
}
