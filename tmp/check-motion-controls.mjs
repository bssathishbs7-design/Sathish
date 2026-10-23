import {browser,pause} from './cdp.mjs';
import {writeFileSync} from 'node:fs';
const b=await browser();
await b.call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
await b.call('Page.navigate',{url:'http://localhost:5199/docs/video/motion-foundation/index.html'});await pause(700);
for(let i=0;i<3;i++) {
await b.evaluate(`document.querySelectorAll('.scene-tabs button')[${i}].click()`);await pause(100);
const rect=(await b.evaluate(`(()=>{const r=document.querySelector('.film-stage').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()`)).result.value;
writeFileSync(`docs/video/motion-foundation/${['assessment','skills','logbook'][i]}-style-frame.png`,Buffer.from((await b.call('Page.captureScreenshot',{format:'png',clip:rect})).data,'base64'));
}
await b.evaluate(`document.querySelector('.review-header button').click();window.medsyMotion.seek(7)`);await pause(100);
writeFileSync('tmp/motion-foundation-dark-focus.png',Buffer.from((await b.call('Page.captureScreenshot',{format:'png'})).data,'base64'));
await b.evaluate(`document.querySelector('[aria-label="Play preview"]').click()`);await pause(200);
console.log('Playing', (await b.evaluate('document.querySelector("output").textContent')).result.value);
await b.evaluate(`document.querySelector('[aria-label="Pause preview"]').click()`);
const paused=(await b.evaluate('document.querySelector("output").textContent')).result.value;await pause(200);
console.log('Pause stable',paused===(await b.evaluate('document.querySelector("output").textContent')).result.value);
await b.call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(100);
console.log('Reduced', (await b.evaluate(`({disabled:document.querySelector('.review-controls button').disabled,text:document.querySelector('.review-note').textContent,transform:document.querySelector('.kinetic-mask > span').style.transform})`)).result.value);
await b.call('Emulation.setEmulatedMedia',{features:[]});
b.close();
