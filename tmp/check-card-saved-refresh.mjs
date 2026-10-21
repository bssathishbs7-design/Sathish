import {browser,pause} from './cdp.mjs';
import assert from 'node:assert/strict';
const b=await browser();
const ev=async code=>{const r=await b.evaluate(code);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
await b.call('Page.navigate',{url:'http://127.0.0.1:5198/assessment/create'});await pause(1600);
const backup=await ev('({local:{...localStorage},session:{...sessionStorage}})');
try {
 const row={id:'refresh-qa',assessmentName:'Saved refresh',questionCount:8,totalMarks:90,questionRows:[{id:'q',type:'MCQ',marks:3}],setup:{assessmentId:'refresh-qa',sourceDraftId:'refresh-qa',academicYear:'2026 - 2027',examDeliveryMode:'Online',supervisionType:'Practice Exam',practiceStartDate:'2099-10-21',practiceStartTime:'02:00',practiceStartPeriod:'PM',practiceEndDate:'2099-10-22',totalDuration:'24:00'}};
 await ev(`localStorage.setItem('vx-assessment-drafts',JSON.stringify([${JSON.stringify(row)}]));localStorage.setItem('vx-assessment-published','[]');localStorage.setItem('vx-assessment-create-initial-tab','draft');sessionStorage.setItem('vx-approval-queue-rows','[]');sessionStorage.setItem('vx-assessment-tracker-reset-2026-10-21','complete')`);
 await b.call('Page.reload');await pause(1600);
 let text=await ev("document.querySelector('.assessment-tracker-card').textContent");assert.ok(text.includes('21-10-2099'));assert.ok(text.includes('02:00 PM'));assert.ok(text.includes('24:00'));
 row.questionRows=[];row.setup.provideStudentInstructions='Yes';row.setup.studentInstructions='<p>Read carefully</p>';row.setup.hotThreshold='40';row.setup.totalDuration='02:00';
 await ev(`localStorage.setItem('vx-assessment-drafts',JSON.stringify([${JSON.stringify(row)}]));window.dispatchEvent(new StorageEvent('storage',{key:'vx-assessment-drafts'}))`);await pause(250);
 const values=await ev("[...document.querySelectorAll('.assessment-tracker-card .assessment-create-draft-stats strong')].map(e=>e.textContent)");assert.deepEqual(values,['0','0']);
 text=await ev("document.querySelector('.assessment-tracker-card').textContent");assert.ok(text.includes('InstructionsYes'));assert.ok(text.includes('ThresholdChanged'));assert.ok(text.includes('02:00'));assert.ok(text.includes('Not set'));assert.equal(await ev("document.querySelectorAll('.assessment-tracker-card').length"),1);
 console.log('PASS saved snapshot, empty questions, practice dates, duration, changed instructions/threshold, same card and refresh without reload');
} finally {await ev(`localStorage.clear();sessionStorage.clear();for(const [k,v] of Object.entries(${JSON.stringify(backup.local)}))localStorage.setItem(k,v);for(const [k,v] of Object.entries(${JSON.stringify(backup.session)}))sessionStorage.setItem(k,v)`);b.close()}
