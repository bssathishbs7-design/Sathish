import {browser,pause} from './cdp.mjs';import fs from 'node:fs';import assert from 'node:assert/strict';
const b=await browser();await b.call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await b.call('Page.navigate',{url:'http://127.0.0.1:5198/assessment/create'});await pause(2000);
const backup=(await b.evaluate('({local:{...localStorage},session:{...sessionStorage}})')).result.value;
const record={id:'approval-assessment-qa',activityId:'assessment-qa',activityType:'Assessment',assessmentName:'Anatomy review check',activityName:'Anatomy review check',approvalStatus:'Pending Approval',status:'Pending Approval',setup:{assessmentId:'ASST-QA',assessmentName:'Anatomy review check',blueprintEnabled:true},blueprintId:'ASSTBP-QA',blueprintRevision:1,senderName:'QA Faculty',sentAt:'2026-10-21T10:00:00Z',approvalFaculty:{facultyName:'Dr. Meera Nair',note:'Review submitted questions'},questionCount:1,totalMarks:1,blueprintSnapshot:{blueprintDraft:{subject:'Human Anatomy',topics:['Bones'],competencies:['AN1.1'],totalMark:34},blueprintQuestionTypeDraft:{MCQs:{perQuestionMarks:1,totalMarks:34,hotQuestions:0,lotQuestions:34}},blueprintCognitionWeightage:{lot:100,hot:0},pickerRows:[{id:'r1',competency:'AN1.1',type:'MCQ',count:34,marks:1,level:'LoT'}],distributionRows:[{key:'AN1.1',code:'AN1.1',name:'Anatomical terminology',topic:'Bones',distributionLabel:34,correlationLevel:3}],questionTypeRows:[{label:'MCQs',perQuestionMarks:1,totalMarks:34,totalQuestions:34,hotQuestions:0,lotQuestions:34}]},questionRows:[{id:'q1',type:'MCQ',questionText:'<p>Which bone is in the arm?</p>',marks:1,options:[{id:'a',label:'Humerus'},{id:'b',label:'Femur'}],correctOptionIds:['a']}],previewSections:[]};record.previewSections=[{key:'mcq',title:'Multiple choice questions',marks:1,questions:record.questionRows}];
const evaluate=async code=>{const r=await b.evaluate(code);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const click=async text=>{assert.equal(await evaluate(`(()=>{const el=[...(document.querySelector('.assessment-review-workspace') || document).querySelectorAll('button')].find(el=>el.textContent.trim()===${JSON.stringify(text)});if(!el)return false;el.click();return true})()`),true,text);await pause(300)};
async function seed(r=record){await evaluate(`sessionStorage.setItem('vx-approval-queue-rows',JSON.stringify([${JSON.stringify(r)}]));sessionStorage.setItem('vx-approval-view-record',JSON.stringify(${JSON.stringify(r)}));localStorage.setItem('vx-assessment-drafts',JSON.stringify([{id:'ASST-QA',assessmentName:'Anatomy review check',setup:${JSON.stringify(record.setup)},questionRows:${JSON.stringify(record.questionRows)},questionCount:1,totalMarks:1}]));localStorage.setItem('vx-assessment-create-initial-tab','draft')`)}

try {
 record.setup={...record.setup,assessmentCode:'ASST1021008',academicYear:'2025 - 2026',examDeliveryMode:'Online',supervisionType:'Proctored Exam'};
 const pub={id:'ASST-PUBLISHED-QA',assessmentCode:'ASST1021999',assessmentName:'Clinical anatomy assessment with a longer title for responsive verification',academicYear:'2025 - 2026',examMode:'Online',supervisionType:'Proctored Exam',examCategory:'Midterm',assignTo:'SGT Group A',setup:{assignYear:'First Year',assignGroup:'SGT Group A'},totalMarks:31,questionCount:4,questionRows:record.questionRows,totalDuration:'01:00',publishedAt:'2026-10-21T10:00:00Z'};
 for(const stage of ['published']) {
   record.approvalStatus=stage==='rejected'?'Approval Rejected':stage==='approved'?'Approved':'Pending Approval';record.activityType='Blueprint';
   await seed(record);
   await evaluate(`sessionStorage.setItem('vx-assessment-tracker-reset-2026-10-21','complete');localStorage.setItem('vx-assessment-published','[]')`);
   if(stage==='draft')await evaluate(`sessionStorage.setItem('vx-approval-queue-rows','[]')`);
   if(['published','evaluation','results'].includes(stage)) {
     const row={...pub,startDate:stage==='published'?'2099-10-21':'2020-10-21',startTime:'10:00 AM',evaluationStatus:stage==='results'?'Published':'In Progress'};
     await evaluate(`localStorage.setItem('vx-assessment-published',JSON.stringify([${JSON.stringify(row)}]))`);
   }
   await b.call('Page.navigate',{url:'http://127.0.0.1:5198/assessment/create'});await pause(1500);
   await evaluate(`[...document.querySelectorAll('.assessment-create-tab')].find(e=>e.textContent.toLowerCase().includes('${stage}')).click()`);await pause(150);
   for(const width of [1440,1024,768,390]){
     await b.call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(120);
     const info=await evaluate(`(()=>{const c=document.querySelector('.assessment-tracker-card');if(!c)return null;const g=c.parentElement;return {text:c.textContent,width:c.getBoundingClientRect().width,grid:g.getBoundingClientRect().width,overflow:c.scrollWidth-c.clientWidth,cols:getComputedStyle(c).gridTemplateColumns}})()`);
     assert.ok(info,stage);assert.ok(info.text.includes('First Year / SGT Group A'));assert.ok(info.text.includes('Questions'),stage);assert.ok(info.text.includes('2025 - 2026'),stage);assert.ok(info.width>=info.grid-2,JSON.stringify({stage,width,info}));assert.ok(info.overflow<3,JSON.stringify({stage,width,info}));
     if(stage==='published'||stage==='draft') {await evaluate("document.querySelector('.assessment-tracker-card').scrollIntoView({block:'center'})");await b.call('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync('tmp/tracker-'+stage+'-'+width+'.png',Buffer.from(r.data,'base64')));}
   }
   console.log('PASS '+stage+' at 1440/1024/768/390');
 }
} finally {await evaluate(`localStorage.clear();sessionStorage.clear();for(const [k,v] of Object.entries(${JSON.stringify(backup.local)}))localStorage.setItem(k,v);for(const [k,v] of Object.entries(${JSON.stringify(backup.session)}))sessionStorage.setItem(k,v)`);b.close()}
