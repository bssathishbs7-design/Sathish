import {browser,pause} from './cdp.mjs';import fs from 'node:fs';import assert from 'node:assert/strict';
const b=await browser();await b.call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await b.call('Page.navigate',{url:'http://127.0.0.1:5198/assessment/create'});await pause(1000);
const backup=(await b.evaluate('({local:{...localStorage},session:{...sessionStorage}})')).result.value;
const record={id:'approval-assessment-qa',activityId:'assessment-qa',activityType:'Assessment',assessmentName:'Anatomy review check',activityName:'Anatomy review check',approvalStatus:'Pending Approval',status:'Pending Approval',setup:{assessmentId:'ASST-QA',assessmentName:'Anatomy review check',blueprintEnabled:true},blueprintId:'ASSTBP-QA',blueprintRevision:1,senderName:'QA Faculty',sentAt:'2026-10-21T10:00:00Z',approvalFaculty:{facultyName:'Dr. Meera Nair',note:'Review submitted questions'},questionCount:1,totalMarks:1,blueprintSnapshot:{blueprintDraft:{subject:'Human Anatomy',topics:['Bones'],competencies:['AN1.1'],totalMark:34},blueprintQuestionTypeDraft:{MCQs:{perQuestionMarks:1,totalMarks:34,hotQuestions:0,lotQuestions:34}},blueprintCognitionWeightage:{lot:100,hot:0},pickerRows:[{id:'r1',competency:'AN1.1',type:'MCQ',count:34,marks:1,level:'LoT'}],distributionRows:[{key:'AN1.1',code:'AN1.1',name:'Anatomical terminology',topic:'Bones',distributionLabel:34,correlationLevel:3}],questionTypeRows:[{label:'MCQs',perQuestionMarks:1,totalMarks:34,totalQuestions:34,hotQuestions:0,lotQuestions:34}]},questionRows:[{id:'q1',type:'MCQ',questionText:'<p>Which bone is in the arm?</p>',marks:1,options:[{id:'a',label:'Humerus'},{id:'b',label:'Femur'}],correctOptionIds:['a']}],previewSections:[]};record.previewSections=[{key:'mcq',title:'Multiple choice questions',marks:1,questions:record.questionRows}];
const evaluate=async code=>{const r=await b.evaluate(code);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const click=async text=>{assert.equal(await evaluate(`(()=>{const el=[...(document.querySelector('.assessment-review-workspace') || document).querySelectorAll('button')].find(el=>el.textContent.trim()===${JSON.stringify(text)});if(!el)return false;el.click();return true})()`),true,text);await pause(300)};
async function seed(r=record){await evaluate(`sessionStorage.setItem('vx-approval-queue-rows',JSON.stringify([${JSON.stringify(r)}]));sessionStorage.setItem('vx-approval-view-record',JSON.stringify(${JSON.stringify(r)}));localStorage.setItem('vx-assessment-drafts',JSON.stringify([{id:'ASST-QA',assessmentName:'Anatomy review check',setup:${JSON.stringify(record.setup)},questionRows:${JSON.stringify(record.questionRows)},questionCount:1,totalMarks:1}]));localStorage.setItem('vx-assessment-create-initial-tab','draft')`)}

try {
 record.setup={...record.setup,examDeliveryMode:'Online',mcqDisplayType:'Read-Only',descriptiveDisplayType:'Answer Input'};
 record.questionRows.push({id:'q2',type:'Descriptive Question',marks:10});
 await seed(record);await evaluate("sessionStorage.setItem('vx-assessment-tracker-reset-2026-10-21','complete')");
 await b.call('Page.navigate',{url:'http://127.0.0.1:5198/assessment/create'});await pause(1500);
 await evaluate("[...document.querySelectorAll('.assessment-create-tab')].find(e=>e.textContent.includes('Pending')).click()");await pause(200);
 assert.equal(await evaluate("document.querySelector('.assessment-exam-type strong').textContent"),'Hybrid');

 await b.call('Page.bringToFront');
 await evaluate("document.querySelector('.assessment-exam-type-info').scrollIntoView({block:'center'})");await pause(150);
 const point=await evaluate("(()=>{const r=document.querySelector('.assessment-exam-type-info').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
 const move=async(x,y)=>{await b.call('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await pause(100)};
 const press=async(x,y)=>{await b.call('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await b.call('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});await pause(100)};
 const visible=()=>evaluate("(()=>{const tip=document.querySelector('[role=tooltip]');return !!tip&&getComputedStyle(tip).visibility==='visible'})()");
 await move(10,10);await move(point.x,point.y);assert.equal(await visible(),true,'hover visible');
 await move(10,10);assert.equal(await visible(),false,'leave closes');
 await move(point.x,point.y);await press(point.x,point.y);assert.equal(await visible(),true,'hover then click remains visible');
 await move(10,10);assert.equal(await visible(),true,'click pins after leaving');
 await press(10,10);assert.equal(await visible(),false,'outside click closes');
 await move(point.x,point.y);await press(point.x,point.y);assert.equal(await visible(),true,'reopen');
 await press(point.x,point.y);assert.equal(await visible(),false,'second click closes');
 await move(10,10);await move(point.x,point.y);await press(point.x,point.y);await b.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await pause(100);assert.equal(await visible(),false,'Escape closes');
 console.log('PASS: real pointer hover, leave, hover-to-click, pinned visibility, outside click, toggle and Escape');
} finally {await evaluate(`localStorage.clear();sessionStorage.clear();for(const [k,v] of Object.entries(${JSON.stringify(backup.local)}))localStorage.setItem(k,v);for(const [k,v] of Object.entries(${JSON.stringify(backup.session)}))sessionStorage.setItem(k,v)`);b.close()}
