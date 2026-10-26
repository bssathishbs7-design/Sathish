import {browser,pause} from './cdp.mjs';import assert from 'node:assert/strict';import fs from 'node:fs';
const b=await browser();const ev=async expression=>{const r=await b.evaluate(expression);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const key='medsy-student-directory-v1';const backup=await ev(`localStorage.getItem('${key}')`);
const click=async text=>{await ev(`(()=>{const nodes=[...document.querySelectorAll('dialog[open] button, .student-management-page button')];const button=nodes.find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!button)throw Error('Button missing: '+${JSON.stringify(text)});button.click()})()`);await pause(120)};
const fill=async(label,value)=>{await ev(`(()=>{const labels=[...document.querySelectorAll('dialog[open] label')];const node=labels.find(e=>e.querySelector('span')?.textContent.replace(' *','')===${JSON.stringify(label)});const input=node?.querySelector('input, select');if(!input)throw Error('Field missing '+${JSON.stringify(label)});const proto=input.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))})()`);await pause(50)};
try{
await ev(`(async()=>{const {sampleDirectory}=await import('/src/services/studentManagement.js');localStorage.setItem('${key}',JSON.stringify(sampleDirectory()))})()`);
await b.call('Page.navigate',{url:'http://127.0.0.1:5199/student-management'});await pause(1000);
assert.equal(await ev("!!document.querySelector('.student-management-page')"),true);
await click('Batch 2026');assert.match(await ev("document.querySelector('.student-management-page').innerText"),/First Year students/);
await click('Add student');await fill('Full name','Browser Test Student');await fill('Student ID','BROWSER001');await fill('Email','browser.test@example.edu');await fill('Phone','9876543210');await click('Save student');await pause(200);
assert.equal(await ev("document.querySelectorAll('dialog[open]').length"),0);assert.match(await ev("document.querySelector('.student-management-page').innerText"),/Browser Test Student/);
await ev("document.querySelector('input[aria-label=\"Select Aarav Nair\"]').click()");await pause(80);await click('Promote to Second Year');await fill('Current year ends on','2027-07-01');await click('Confirm');await pause(150);
assert.equal(await ev("JSON.parse(localStorage.getItem('medsy-student-directory-v1')).students[0].year"),'Second Year');
await click('Second Year (1)');await click('Record');await pause(100);assert.match(await ev('location.pathname'),/\/record\/student-1$/);assert.match(await ev("document.querySelector('.sm-record').innerText"),/Year history/);
await b.call('Page.reload');await pause(800);assert.equal(await ev("!!document.querySelector('.sm-record')"),true);
await click('Back to batches');await click('Batch 2026');await click('All changes');assert.match(await ev("document.querySelector('.sm-history').innerText"),/Unchanged/);
await click('Undo 1 eligible student(s)');await fill('Reason (at least five characters)','Incorrect selection');await click('Confirm');await pause(100);assert.equal(await ev("JSON.parse(localStorage.getItem('medsy-student-directory-v1')).students[0].year"),'First Year');
await click('Year list');
for(const width of [390,768,1024,1440]){
 await b.call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});await pause(100);
 const sizes=await ev("({width:innerWidth,scroll:document.documentElement.scrollWidth,table:!!document.querySelector('.student-management-table')})");console.log('viewport',width,sizes);assert.equal(sizes.table,true);assert.ok(sizes.scroll<=sizes.width+2);
}
fs.writeFileSync('tmp/student-management-desktop.png',Buffer.from((await b.call('Page.captureScreenshot',{format:'png'})).data,'base64'));
await click('Add student');await b.call('Emulation.setDeviceMetricsOverride',{width:390,height:850,deviceScaleFactor:1,mobile:true});await pause(700);const rect=await ev("(()=>{const r=document.querySelector('dialog[open]').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}})()");console.log('mobile dialog',rect);assert.ok(rect.left>=0&&rect.right<=390&&rect.top>=0&&rect.bottom<=850);await click('Cancel');
console.log('PASS: add, promote, record route/reload, undo, responsive table and modal');
}finally{await ev(`(()=>{const value=${JSON.stringify(backup)};if(value===null)localStorage.removeItem('${key}');else localStorage.setItem('${key}',value)})()`);await b.call('Page.navigate',{url:'http://127.0.0.1:5199/student-management'});b.close()}
