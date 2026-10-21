import {browser,pause} from './cdp.mjs';import fs from 'node:fs';import assert from 'node:assert/strict';
const b=await browser();await b.call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await b.call('Page.navigate',{url:'http://127.0.0.1:5198/assessment/create'});await pause(1000);
const backup=(await b.evaluate('({local:{...localStorage},session:{...sessionStorage}})')).result.value;
const record={id:'approval-assessment-qa',activityId:'assessment-qa',activityType:'Assessment',assessmentName:'Anatomy review check',activityName:'Anatomy review check',approvalStatus:'Pending Approval',status:'Pending Approval',setup:{assessmentId:'ASST-QA',assessmentName:'Anatomy review check',blueprintEnabled:true},blueprintId:'ASSTBP-QA',blueprintRevision:1,senderName:'QA Faculty',sentAt:'2026-10-21T10:00:00Z',approvalFaculty:{facultyName:'Dr. Meera Nair',note:'Review submitted questions'},questionCount:1,totalMarks:1,blueprintSnapshot:{blueprintDraft:{subject:'Human Anatomy',topics:['Bones'],competencies:['AN1.1'],totalMark:34},blueprintQuestionTypeDraft:{MCQs:{perQuestionMarks:1,totalMarks:34,hotQuestions:0,lotQuestions:34}},blueprintCognitionWeightage:{lot:100,hot:0},pickerRows:[{id:'r1',competency:'AN1.1',type:'MCQ',count:34,marks:1,level:'LoT'}],distributionRows:[{key:'AN1.1',code:'AN1.1',name:'Anatomical terminology',topic:'Bones',distributionLabel:34,correlationLevel:3}],questionTypeRows:[{label:'MCQs',perQuestionMarks:1,totalMarks:34,totalQuestions:34,hotQuestions:0,lotQuestions:34}]},questionRows:[{id:'q1',type:'MCQ',questionText:'<p>Which bone is in the arm?</p>',marks:1,options:[{id:'a',label:'Humerus'},{id:'b',label:'Femur'}],correctOptionIds:['a']}],previewSections:[]};record.previewSections=[{key:'mcq',title:'Multiple choice questions',marks:1,questions:record.questionRows}];
const evaluate=async code=>{const r=await b.evaluate(code);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const click=async text=>{assert.equal(await evaluate(`(()=>{const el=[...(document.querySelector('.assessment-review-workspace') || document).querySelectorAll('button')].find(el=>el.textContent.trim()===${JSON.stringify(text)});if(!el)return false;el.click();return true})()`),true,text);await pause(300)};
async function seed(r=record){await evaluate(`sessionStorage.setItem('vx-approval-queue-rows',JSON.stringify([${JSON.stringify(r)}]));sessionStorage.setItem('vx-approval-view-record',JSON.stringify(${JSON.stringify(r)}));localStorage.setItem('vx-assessment-drafts',JSON.stringify([{id:'ASST-QA',assessmentName:'Anatomy review check',setup:${JSON.stringify(record.setup)},questionRows:${JSON.stringify(record.questionRows)},questionCount:1,totalMarks:1}]));localStorage.setItem('vx-assessment-create-initial-tab','draft')`)}

const clickAny=async text=>{await evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)})?.click()`);await pause(250)};
try {
record.setup={...record.setup,blueprintEnabled:false,collegeName:'Test College',academicYear:'2026 - 2027',examCategory:'Midterm',examDeliveryMode:'Offline',examDate:'2099-10-21',startTime:'10:00',startPeriod:'AM',offlineDuration:'01:00',approvalFlow:'Direct Publish',lotThreshold:'50',hotThreshold:'50',attainmentLevels:[{minPercentage:'1',maxPercentage:'100',level:'1'}],sourcePublishedId:'ASST-QA',isPublishedEdit:true};
for(const method of ['direct','approval']) {
record.setup.publicationMethod=method;
await seed(record);
await evaluate(`sessionStorage.setItem('vx-assessment-tracker-reset-2026-10-21','complete');sessionStorage.setItem('vx-approval-queue-rows','[]');localStorage.setItem('vx-create-assessment-setup',JSON.stringify(${JSON.stringify(record.setup)}));localStorage.setItem('vx-create-assessment-initial-tab','configuration');localStorage.setItem('vx-assessment-published',JSON.stringify([{id:'ASST-QA',setup:${JSON.stringify(record.setup)},publicationMethod:'${method}'}]))`);
await evaluate(`localStorage.setItem('vx-create-assessment-questions:ASST-QA',JSON.stringify(${JSON.stringify(record.questionRows)}))`);await b.call('Page.navigate',{url:'http://127.0.0.1:5198/createassessment'});await pause(1500);
await clickAny('Configuration');
const state=await evaluate("(()=>{const buttons=[...document.querySelectorAll('button')];return {direct:buttons.find(e=>e.textContent.trim()==='Direct Publish')?.disabled,approval:buttons.find(e=>e.textContent.trim()==='Send to Approval')?.disabled}})()");
console.log(method,state);
assert.equal(state.direct,method==='approval');assert.equal(state.approval,false);
}
await clickAny('Send to Approval');await pause(150);
const select=async(index,value)=>{await evaluate(`(()=>{const e=document.querySelectorAll('dialog select')[${index}];Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('change',{bubbles:true}))})()`);await pause(80)};
const year=await evaluate("[...document.querySelector('dialog select').options].find(e=>e.value)?.value");
await select(0,year);await clickAny('Next');await select(0,'EMP1021');await clickAny('Send');await pause(500);
assert.equal(await evaluate("location.pathname"),'/assessment/create');
assert.equal(await evaluate("JSON.parse(localStorage.getItem('vx-assessment-published')).length"),0);
assert.equal(await evaluate("JSON.parse(sessionStorage.getItem('vx-approval-queue-rows'))[0].setup.assessmentId"),'ASST-QA');
assert.equal(await evaluate("document.querySelector('.assessment-create-tab.is-active').textContent.includes('Pending')"),true);
console.log('PASS publication restrictions and Published to Pending transition');
} finally {await evaluate(`localStorage.clear();sessionStorage.clear();for(const [k,v] of Object.entries(${JSON.stringify(backup.local)}))localStorage.setItem(k,v);for(const [k,v] of Object.entries(${JSON.stringify(backup.session)}))sessionStorage.setItem(k,v)`);b.close()}
