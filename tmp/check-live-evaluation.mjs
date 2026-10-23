import {browser,pause} from './cdp.mjs';
import fs from 'node:fs';
const b=await browser(); const ev=async s=>{const r=await b.evaluate(s);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
await b.call('Page.navigate',{url:'http://127.0.0.1:5199/assessment/create'});await pause(1500);
console.log(await ev("[...document.querySelectorAll('.assessment-create-tab')].map(x=>x.textContent)"));
await ev("[...document.querySelectorAll('.assessment-create-tab')].find(x=>x.textContent.endsWith('Evaluation')).click()");await pause(300);
console.log(await ev("[...document.querySelectorAll('.assessment-tracker-card.is-live')].map(c=>({text:c.innerText,disabled:c.querySelector('.is-start-evaluation')?.disabled,overflow:c.scrollWidth>c.clientWidth+1}))"));
fs.writeFileSync('tmp/live-evaluation.png',Buffer.from((await b.call('Page.captureScreenshot',{format:'png'})).data,'base64'));b.close();
