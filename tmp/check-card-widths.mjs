import {browser,pause} from './cdp.mjs';
import assert from 'node:assert/strict';
const b=await browser();const ev=async code=>(await b.evaluate(code)).result.value;
await b.call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await b.call('Page.navigate',{url:'http://127.0.0.1:5198/assessment/evaluation'});await pause(1800);
const backup=await ev('({local:{...localStorage},session:{...sessionStorage}})');
try {
const row={id:'COHORT-QA',assessmentName:'Auto evaluation cohort',examMode:'Online',startDate:'2026-01-01',startTime:'10:00 AM',totalDuration:'01:00',setup:{examDeliveryMode:'Online',supervisionType:'Proctored Exam',mcqDisplayType:'Answer Input',mcqAutoPublish:'On'},questionRows:[{id:'q1',type:'MCQ',marks:2,questionText:'Test question',options:[{id:'a',label:'A'},{id:'b',label:'B'}],correctOptionIds:['a']}],students:[{id:'P1',name:'Present one',attendance:'P'},{id:'P2',name:'Present two',attendance:'P'},{id:'P3',name:'Present three',attendance:'P'},{id:'A1',name:'Absent student',attendance:'A'}]};
await ev(`localStorage.setItem('vx-assessment-published',JSON.stringify([${JSON.stringify(row)}]));sessionStorage.setItem('vx-assessment-evaluation-selected',JSON.stringify(${JSON.stringify(row)}));localStorage.setItem('vx-online-proctored-exam-attempts',JSON.stringify({'COHORT-QA':{P1:{answers:{q1:0},appliedResetVersion:0}}}))`);
await b.call('Page.reload');await pause(2500);
const statuses=await ev("JSON.parse(localStorage.getItem('vx-assessment-student-evaluation-status:COHORT-QA'))");
for(const id of ['P1','P2','P3'])assert.equal(statuses[id].status,'Completed');
assert.equal(statuses.A1,undefined);
const text=await ev("document.body.innerText");assert.ok(text.includes('Present three'));assert.ok(text.includes('Absent'));
assert.equal(await ev("document.querySelector('.assessment-evaluation-floating-btn.is-publish').disabled"),true);
await ev("localStorage.setItem('vx-assessment-create-initial-tab','results');sessionStorage.setItem('vx-assessment-tracker-reset-2026-10-21','complete')");
await b.call('Page.navigate',{url:'http://127.0.0.1:5198/assessment/create'});await pause(1500);
assert.ok(await ev("document.querySelector('.assessment-create-tab.is-active').textContent.includes('Results')"));
assert.ok(await ev("[...document.querySelectorAll('.assessment-tracker-card')].some(e=>e.textContent.includes('Auto evaluation cohort'))"));
await ev("[...document.querySelectorAll('.assessment-create-tab')].find(e=>e.textContent.includes('Evaluation')).click()");await pause(500);
assert.ok(await ev("document.body.innerText.includes('Review evaluation')"));
await ev("[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Review evaluation')).click()");await pause(800);
assert.ok(await ev("location.pathname.includes('evaluation')"));
assert.equal(await ev("JSON.parse(localStorage.getItem('vx-assessment-published'))[0].resultStatus"),'Published');
await ev("localStorage.setItem('vx-assessment-create-initial-tab','evaluation')");await b.call('Page.navigate',{url:'http://127.0.0.1:5198/assessment/create'});await pause(700);
for(const width of [1440,1024,768,390]){await b.call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(100);const dimensions=await ev("({overflow:document.documentElement.scrollWidth>innerWidth,cards:document.querySelectorAll('.assessment-tracker-card').length})");assert.ok(dimensions.cards>0);assert.equal(dimensions.overflow,false,'overflow at '+width);}
console.log('PASS populated cards at 1440, 1024, 768 and 390 pixels');
}finally{await ev(`localStorage.clear();sessionStorage.clear();for(const[k,v]of Object.entries(${JSON.stringify(backup.local)}))localStorage.setItem(k,v);for(const[k,v]of Object.entries(${JSON.stringify(backup.session)}))sessionStorage.setItem(k,v)`);b.close()}
