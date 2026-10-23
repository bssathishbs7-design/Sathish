import {browser,pause} from './cdp.mjs';
import {writeFileSync} from 'node:fs';
const b=await browser();
await b.call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
await b.call('Page.navigate',{url:'http://localhost:5199/docs/video/motion-foundation/index.html'});
await pause(2000);
console.log((await b.evaluate(`({title:document.title, text:document.body.innerText.slice(0,250),overflow:document.documentElement.scrollWidth>innerWidth})`)).result.value);
writeFileSync('tmp/motion-foundation-desktop.png',Buffer.from((await b.call('Page.captureScreenshot',{format:'png'})).data,'base64'));
for(const width of [390,768,1024,1440]) {
 await b.call('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:false});
 for(const time of [0,2.6,7,12]) {
 await b.evaluate(`window.medsyMotion.seek(${time})`);await pause(80);
 console.log(width,time,(await b.evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth,card:!!document.querySelector('.spatial-card'),badText:[...document.querySelectorAll('h2,.product-rows,.metric-card,.node-network')].some(el=>{const r=el.getBoundingClientRect(),s=document.querySelector('.film-stage').getBoundingClientRect();return r.bottom>s.bottom||r.right>s.right+1})})`)).result.value);
 }
}
await b.call('Emulation.setDeviceMetricsOverride',{width:390,height:1100,deviceScaleFactor:1,mobile:false});
await b.evaluate('window.medsyMotion.seek(2.6)');await pause(100);
writeFileSync('tmp/motion-foundation-mobile.png',Buffer.from((await b.call('Page.captureScreenshot',{format:'png'})).data,'base64'));
b.close();
