import {browser,pause} from './cdp.mjs';import fs from 'node:fs';
const b=await browser();const ev=async code=>(await b.evaluate(code)).result.value;const results=[];
const key=async name=>{await b.call('Input.dispatchKeyEvent',{type:'keyDown',key:name,code:name});await b.call('Input.dispatchKeyEvent',{type:'keyUp',key:name,code:name});};
const select=async label=>{await ev("document.querySelector('.assessment-view-trigger').click()");await ev(`[...document.querySelectorAll('.assessment-view-options button')].find(b=>b.textContent==='${label}').click()`);await pause(50)};
for(const width of [390,768,1024]){
await b.call('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:false});
for(const tab of ['Draft','Approval Queue','Published','Evaluation','Results']){
 await ev(`[...document.querySelectorAll('.assessment-create-tab')].find(b=>b.textContent.endsWith('${tab}')).click()`);
 for(const view of ['Extra large cards','Large cards','Medium cards','Small cards','List','Details']){
 await select(view);const m=await ev(`(()=>{const cs=[...document.querySelectorAll('.assessment-tracker-card')];return {overflow:document.documentElement.scrollWidth>innerWidth,cardOverflow:cs.filter(c=>c.scrollWidth>c.clientWidth+2).length,kpis:cs.every(c=>c.querySelectorAll('.assessment-create-draft-stats > span').length===2)}})()`);if(m.overflow||m.cardOverflow||!m.kpis)results.push({width,tab,view,...m});
 }
}
}
console.log('Responsive failures',results);
await b.call('Emulation.setDeviceMetricsOverride',{width:1600,height:1050,deviceScaleFactor:1,mobile:false});await select('Medium cards');
await ev("document.querySelector('.assessment-view-trigger').focus()");await key('ArrowDown');console.log('focus-selected',await ev('document.activeElement.textContent'));await key('Home');console.log('home',await ev('document.activeElement.textContent'));await key('End');console.log('end',await ev('document.activeElement.textContent'));await key('Escape');console.log('escape',await ev("({closed:!document.querySelector('[role=menu]'),trigger:document.activeElement.matches('.assessment-view-trigger')})"));
await ev("document.querySelector('.vx-shell').classList.add('theme-dark');document.querySelector('.assessment-settings-trigger').click()");await pause(100);
console.log('dark-tooltip',await ev("({background:getComputedStyle(document.querySelector('[role=tooltip]')).backgroundColor,text:getComputedStyle(document.querySelector('[role=tooltip]')).color})"));
fs.writeFileSync('tmp/assessment-views-dark.png',Buffer.from((await b.call('Page.captureScreenshot',{format:'png'})).data,'base64'));await key('Escape');
await ev("document.querySelector('.vx-shell').classList.remove('theme-dark')");await select('Details');fs.writeFileSync('tmp/assessment-views-details.png',Buffer.from((await b.call('Page.captureScreenshot',{format:'png'})).data,'base64'));
await b.call('Emulation.setDeviceMetricsOverride',{width:390,height:1100,deviceScaleFactor:1,mobile:false});await select('Small cards');await ev("document.querySelector('.assessment-create-draft-shell').scrollIntoView({block:'start'})");fs.writeFileSync('tmp/assessment-views-mobile.png',Buffer.from((await b.call('Page.captureScreenshot',{format:'png'})).data,'base64'));
b.close();
