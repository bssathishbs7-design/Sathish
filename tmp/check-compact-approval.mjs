import {browser,pause} from './cdp.mjs';import fs from 'node:fs';const b=await browser();
await b.evaluate("[...document.querySelectorAll('.assessment-create-tab')].find(b=>b.textContent.endsWith('Approval Queue')).click()");
await pause(150);
await b.evaluate("document.querySelector('.assessment-create-draft-shell')?.scrollIntoView({block:'start'})");
fs.writeFileSync('tmp/compact-approval.png',Buffer.from((await b.call('Page.captureScreenshot',{format:'png'})).data,'base64'));
console.log((await b.evaluate("[...document.querySelectorAll('.assessment-tracker-card')].map(c=>({h:c.clientHeight,headerGap:Math.round(c.querySelector('.assessment-tracker-card-summary').getBoundingClientRect().top-c.querySelector('.assessment-tracker-card-identity').getBoundingClientRect().bottom),footerGap:Math.round(c.querySelector('.assessment-tracker-card-controls').getBoundingClientRect().top-c.querySelector('.assessment-tracker-card-summary').getBoundingClientRect().bottom)}))")).result.value);b.close();
