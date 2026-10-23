import {browser,pause} from './cdp.mjs';
const b=await browser();const ev=async s=>{const r=await b.evaluate(s);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};let checks=0;const failures=[];
for(const width of [390,768,1024,1440]){
 await b.call('Emulation.setDeviceMetricsOverride',{width,height:1050,deviceScaleFactor:1,mobile:false});
 for(const tab of ['Draft','Approval Queue','Published','Evaluation','Results']){
 await ev(`[...document.querySelectorAll('.assessment-create-tab')].find(b=>b.textContent.endsWith('${tab}')).click()`);
 for(const view of ['Large cards','Medium cards']){
 await ev("document.querySelector('.assessment-view-trigger').click()");
 await ev(`[...document.querySelectorAll('.assessment-view-options button')].find(b=>b.textContent==='${view}').click()`);
 await pause(30);
 const bad=await ev("document.documentElement.scrollWidth>innerWidth || [...document.querySelectorAll('.assessment-tracker-card')].some(c=>c.scrollWidth>c.clientWidth+2)");
 checks++;if(bad)failures.push({width,tab,view});
 }
 }
}
console.log({checks,failures});b.close();
