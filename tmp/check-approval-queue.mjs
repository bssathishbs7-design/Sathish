import {browser,pause} from './cdp.mjs';import assert from 'node:assert/strict';
const b=await browser();const ev=async s=>(await b.evaluate(s)).result.value;await b.call('Page.navigate',{url:'http://127.0.0.1:5198/assessment/create'});await pause(700);const backup=await ev('({local:{...localStorage},session:{...sessionStorage}})');
try{
const rows=['Pending Approval','Approved','Approval Rejected'].map((approvalStatus,i)=>({activityId:'queue-check-'+i,activityType:'Assessment',assessmentName:'Queue check '+i,approvalStatus,questionRows:[],setup:{assessmentId:'QUEUE'+i,examDeliveryMode:'Online',supervisionType:'Proctored Exam'}}));
await ev(`sessionStorage.setItem('vx-approval-queue-rows',JSON.stringify(${JSON.stringify(rows)}));sessionStorage.setItem('vx-assessment-tracker-reset-2026-10-21','complete');localStorage.setItem('vx-assessment-create-initial-tab','pending')`);await b.call('Page.reload');await pause(1200);
assert.equal(await ev("document.querySelectorAll('.assessment-create-tab').length"),5);
assert.ok(await ev("document.querySelector('.assessment-create-tab.is-active').textContent.includes('Approval Queue')"));
assert.equal(await ev("document.querySelectorAll('.assessment-tracker-card').length"),3);
await ev("document.querySelector('.assessment-create-published-filter-btn').click()");await pause(100);
for(const status of ['pending','approved','rejected','all']){await ev(`(()=>{const s=document.querySelector('.assessment-filter-select select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,'${status}');s.dispatchEvent(new Event('change',{bubbles:true}))})()`);await pause(100);assert.equal(await ev("document.querySelectorAll('.assessment-tracker-card').length"),status==='all'?3:1);}
for(const width of [1440,1024,768,390]){await b.call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(100);assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false);}
console.log('PASS five tabs, legacy redirect, combined cards, each status filter, responsive widths');
}finally{await ev(`localStorage.clear();sessionStorage.clear();for(const[k,v]of Object.entries(${JSON.stringify(backup.local)}))localStorage.setItem(k,v);for(const[k,v]of Object.entries(${JSON.stringify(backup.session)}))sessionStorage.setItem(k,v)`);b.close()}
