import {browser,pause} from './cdp.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const b=await browser();
const ev=async code=>{const r=await b.evaluate(code);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
await b.call('Page.navigate',{url:'http://127.0.0.1:5198/my-assessment'});await pause(1600);
const backup=await ev('({local:{...localStorage},session:{...sessionStorage}})');
const exam={id:'SAND-QA',assessmentName:'Result timer verification',examMode:'Online',supervisionType:'Practice Exam',startDate:'2099-10-22',startTime:'10:00 AM',totalDuration:'01:00',setup:{examDeliveryMode:'Online',supervisionType:'Practice Exam',mcqDisplayType:'Answer Input',mcqAutoPublish:'On'},questionRows:[{id:'q1',type:'MCQ',marks:2,options:[{id:'a',text:'A'},{id:'b',text:'B'}],correctOptionIds:['a']}],students:[{id:'MC2568'},{id:'other'}]};
async function seed(age=0,auto=true,valid=true){
 const row=structuredClone(exam);row.setup.mcqAutoPublish=auto?'On':'Off';if(!valid)row.questionRows[0].correctOptionIds=[];
 const attempt={isAssessmentSubmitted:true,submittedAt:new Date(Date.now()-age).toISOString(),answers:{q1:0},appliedResetVersion:0};
 await ev(`localStorage.setItem('vx-assessment-published',JSON.stringify([${JSON.stringify(row)}]));localStorage.setItem('vx-online-practice-exam-attempts',JSON.stringify({'SAND-QA':{'MC2568':${JSON.stringify(attempt)}}}));localStorage.removeItem('vx-assessment-student-question-evaluation:SAND-QA:MC2568')`);
 await b.call('Page.navigate',{url:'http://127.0.0.1:5198/my-assessment'});await pause(1800);
}
try {
 await seed();
 assert.equal(await ev("!!document.querySelector('.assessment-result-countdown')"),true);
 for(const width of [1440,1024,768,390]){
 await b.call('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:false});await pause(100);
 assert.ok(await ev("(()=>{const el=document.querySelector('.assessment-result-countdown');return el.scrollWidth<=el.clientWidth+1})()"));
 if(width===1440)await b.call('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync('tmp/result-button-card.png',Buffer.from(r.data,'base64')));
 }
 const before=await ev("document.querySelector('.assessment-result-countdown time').textContent");
 await b.call('Page.reload');await pause(1800);
 const after=await ev("document.querySelector('.assessment-result-countdown time').textContent");assert.ok(after<before);
 await seed(55000);await pause(4500);
 assert.equal(await ev("location.pathname"),'/assessment/assessmentstudentresult');
 
 
 assert.equal(await ev("JSON.parse(localStorage.getItem('vx-assessment-published'))[0].studentResults.other"),undefined);
 await seed(65000,false);assert.equal(await ev("!!document.querySelector('.assessment-result-countdown')"),false);assert.ok(await ev("document.querySelector('.assessment-result-status').textContent.includes('Awaiting publication')"));
 await seed(65000,true,false);assert.ok(await ev("document.querySelector('.assessment-result-countdown').textContent.includes('Evaluating')"));
 console.log('PASS countdown button, responsive layout, refresh persistence, automatic result navigation, manual publishing and incomplete grading');
} finally {
 await ev(`localStorage.clear();sessionStorage.clear();for(const[k,v]of Object.entries(${JSON.stringify(backup.local)}))localStorage.setItem(k,v);for(const[k,v]of Object.entries(${JSON.stringify(backup.session)}))sessionStorage.setItem(k,v)`);
 b.close();
}
