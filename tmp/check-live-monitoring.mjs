import {browser,pause} from './cdp.mjs';import fs from 'node:fs';import assert from 'node:assert/strict';
const b=await browser();const ev=async s=>{const r=await b.evaluate(s);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
await b.call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await b.call('Page.navigate',{url:'http://127.0.0.1:5199/assessment/create'});await pause(1000);
const backup=await ev('JSON.stringify({local:{...localStorage},session:{...sessionStorage}})');
try{
await ev(`(()=>{const n=new Date(Date.now()-300000);const exam={id:'monitor-qa',assessmentName:'Live monitoring check',examMode:'Online',examType:'MCQ',startDate:n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0'),startTime:n.getHours()+':'+String(n.getMinutes()).padStart(2,'0'),totalDuration:'02:00',questionCount:1,totalMarks:2,setup:{examDeliveryMode:'Online',supervisionType:'Practice Exam',mcqDisplayType:'Answer Input',mcqAutoPublish:'Off'},questionRows:[{id:'q1',type:'MCQ',question:'Sample question',marks:2,options:[{id:'a',label:'Yes'},{id:'b',label:'No'}],correctOptionIds:['a']}],students:[{id:'qa1',name:'Monitor Student',attendance:'P',evaluationStatus:'Completed',mockEvaluationState:{q1:{status:'correct',marks:2}}},{id:'qa2',name:'Absent Student',attendance:'A'}]};localStorage.setItem('vx-assessment-published',JSON.stringify([exam]));window.dispatchEvent(new Event('vx-assessment-published-changed'))})()`);await pause(500);
await ev("[...document.querySelectorAll('.assessment-create-tab')].find(x=>x.textContent.endsWith('Evaluation')).click()");await pause(200);
assert.equal(await ev("document.querySelector('.is-start-evaluation').disabled"),false);
assert.equal(await ev("document.querySelector('.is-start-evaluation').textContent.trim()"),'Continue evaluation');
await ev("document.querySelector('.is-start-evaluation').click()");await pause(800);
const rows=()=>ev("[...document.querySelectorAll('.assessment-evaluation-table tbody tr')].map(r=>r.innerText)");
console.log('Page',await ev('document.body.innerText.slice(-1800)'));console.log('Initial',await rows());assert.match((await rows()).join(' '),/Not started/);
await ev("localStorage.setItem('vx-online-practice-exam-attempts',JSON.stringify({'monitor-qa':{qa1:{hasStarted:true,answers:{q1:0}}}}))");await pause(1300);
console.log('Started',await rows());assert.match((await rows()).join(' '),/In progress/);
await ev("localStorage.setItem('vx-online-practice-exam-attempts',JSON.stringify({'monitor-qa':{qa1:{hasStarted:true,isAssessmentSubmitted:true,isMcqSubmitted:true,submittedAt:new Date(Date.now()-70000).toISOString(),answers:{q1:0}}}}))");await pause(2200);
console.log('Evaluated manual publication',await rows());assert.match((await rows()).join(' '),/Awaiting publication/);
await ev("(()=>{const a=JSON.parse(localStorage.getItem('vx-assessment-published'));a[0].setup.mcqAutoPublish='On';localStorage.setItem('vx-assessment-published',JSON.stringify(a))})()");await pause(2200);
console.log('Auto published',await rows());assert.match((await rows()).join(' '),/Published/);
await b.call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await ev('window.scrollTo(0,0)');await pause(200);
fs.writeFileSync('tmp/live-monitoring-table.png',Buffer.from((await b.call('Page.captureScreenshot',{format:'png'})).data,'base64'));
for(const width of [390,768,1024,1440]){await b.call('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:width<768});await pause(100);console.log('Width',width,await ev('({pageOverflow:document.documentElement.scrollWidth>innerWidth+2,tableScrollable:Boolean(document.querySelector(".assessment-evaluation-table-wrap"))})'));}
}finally{await b.call('Page.navigate',{url:'about:blank'});await pause(100);await b.call('Page.navigate',{url:'http://127.0.0.1:5199/assessment/create'});await pause(500);await ev(`(()=>{const b=${backup};localStorage.clear();sessionStorage.clear();Object.entries(b.local).forEach(([k,v])=>localStorage.setItem(k,v));Object.entries(b.session).forEach(([k,v])=>sessionStorage.setItem(k,v));window.dispatchEvent(new Event('vx-assessment-published-changed'))})()`);b.close()}
