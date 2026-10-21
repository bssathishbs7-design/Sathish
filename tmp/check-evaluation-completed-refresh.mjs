import {browser,pause} from './cdp.mjs';
import assert from 'node:assert/strict';
const b=await browser();const ev=async code=>(await b.evaluate(code)).result.value;
await b.call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await b.call('Page.navigate',{url:'http://127.0.0.1:5198/assessment/evaluation'});await pause(1800);
const backup=await ev('({local:{...localStorage},session:{...sessionStorage}})');
try {
const row={id:'COHORT-QA',assessmentName:'Auto evaluation cohort',examMode:'Online',startDate:'2026-01-01',startTime:'10:00 AM',totalDuration:'01:00',setup:{examDeliveryMode:'Online',supervisionType:'Proctored Exam',mcqDisplayType:'Answer Input',mcqAutoPublish:'Off',descriptiveDisplayType:'Answer Input',descriptiveAutoEvaluation:'Yes',descriptiveAutoPublish:'Off'},questionRows:[{id:'q1',type:'Descriptive Question',marks:2,questionText:'Test question',modelAnswer:'Heart pumps blood',options:[{id:'a',label:'A'},{id:'b',label:'B'}],correctOptionIds:['a']}],students:[{id:'P1',name:'Present one',attendance:'P'},{id:'P2',name:'Present two',attendance:'P'},{id:'P3',name:'Present three',attendance:'P'},{id:'A1',name:'Absent student',attendance:'A'}]};
delete row.students;
await ev(`localStorage.setItem('vx-assessment-published',JSON.stringify([${JSON.stringify(row)}]));sessionStorage.setItem('vx-assessment-evaluation-selected',JSON.stringify(${JSON.stringify(row)}));localStorage.setItem('vx-online-proctored-exam-attempts',JSON.stringify({'COHORT-QA':{P1:{answers:{q1:0},appliedResetVersion:0}}}))`);
await b.call('Page.reload');await pause(2500);
const statuses=await ev("JSON.parse(localStorage.getItem('vx-assessment-student-evaluation-status:COHORT-QA'))");
for(const id of ['MV1253','MV1254','MV1255'])assert.equal(statuses[id].status,'Completed');
assert.equal(statuses.MV1256,undefined);
await b.call('Page.reload');await pause(2000);
const rowStatuses=await ev("Array.from(document.querySelectorAll('tr')).filter(row=>/MV125[345]/.test(row.innerText)).map(row=>row.innerText)");assert.equal(rowStatuses.length,3);for(const row of rowStatuses){assert.ok(row.includes('Completed'));assert.ok(!row.includes('Start Evaluation'));}
const text=await ev("document.body.innerText");assert.ok(text.includes('Rohit Sharma'));assert.ok(text.includes('Absent'));
assert.equal(await ev("JSON.parse(localStorage.getItem('vx-assessment-published'))[0].studentResults.MV1253.marks"),0);console.log('PASS written questions: all present students evaluated, blanks zero, absent excluded');
}finally{await ev(`localStorage.clear();sessionStorage.clear();for(const[k,v]of Object.entries(${JSON.stringify(backup.local)}))localStorage.setItem(k,v);for(const[k,v]of Object.entries(${JSON.stringify(backup.session)}))sessionStorage.setItem(k,v)`);b.close()}
