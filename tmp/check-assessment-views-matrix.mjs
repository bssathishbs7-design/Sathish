import {browser,pause} from './cdp.mjs';import fs from 'node:fs';
const b=await browser();const results=[];
const evaluate=async code=>{const r=await b.evaluate(code);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const choose=async value=>{await evaluate('document.querySelector(".assessment-view-trigger").click()');await evaluate(`[...document.querySelectorAll('.assessment-view-options button')].find(b=>b.textContent==='${value}').click()`);await pause(80)};
const measure=()=>evaluate(`(()=>{const g=document.querySelector('[data-card-view]'),cards=[...document.querySelectorAll('.assessment-tracker-card')];return {stage:document.querySelector('[data-stage]')?.dataset.stage,view:g?.dataset.cardView,columns:g&&getComputedStyle(g).gridTemplateColumns,cards:cards.length,overflow:document.documentElement.scrollWidth>innerWidth,cardOverflow:cards.filter(c=>c.scrollWidth>c.clientWidth+2).length,kpis:cards.every(c=>c.querySelectorAll('.assessment-create-draft-stats > span').length===2),table:!!document.querySelector('[role=table]'),rows:document.querySelectorAll('[role=row]').length}})()`);
await b.call('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
for(const tab of ['Draft','Approval Queue','Published','Evaluation','Results']){
 await evaluate(`[...document.querySelectorAll('.assessment-create-tab')].find(b=>b.textContent.endsWith('${tab}')).click()`);
 for(const view of ['Extra large cards','Large cards','Medium cards','Small cards','List','Details']){await choose(view);results.push(await measure());}
}
await choose('Small cards');await evaluate("document.querySelector('.assessment-create-draft-shell').scrollIntoView({block:'start'})");await pause(150);fs.writeFileSync('tmp/assessment-views-small.png',Buffer.from((await b.call('Page.captureScreenshot',{format:'png'})).data,'base64'));
for(const width of [1024,768,390]){
 await b.call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
 for(const view of ['Small cards','Details','List']){await choose(view);results.push({width,...await measure()});}
}
await choose('Small cards');await evaluate("document.querySelector('.assessment-settings-trigger').click()");await pause(80);console.log('tooltip',await evaluate("({text:document.querySelector('[role=tooltip]')?.innerText,visible:document.querySelector('[role=tooltip]')?.getBoundingClientRect().width})"));
await b.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
await b.call('Page.reload');await pause(700);console.log('persisted',await evaluate("({saved:localStorage.getItem('medsy-assessment-view'),view:document.querySelector('[data-card-view]')?.dataset.cardView})"));
fs.writeFileSync('tmp/assessment-views-matrix.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
b.close();
