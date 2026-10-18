import fs from 'node:fs';
import {browser,pause} from '../logbook-launch/cdp.mjs';
const duration=Number(process.argv[2]||90),b=await browser();
await b.call('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
await b.call('Page.navigate',{url:'http://127.0.0.1:5195/artifacts/product-film-v2/index.html'});
await pause(1800);
const started=await b.evaluate(`window.startFilm(true,${duration})`);
if(started.exceptionDetails)throw Error(JSON.stringify(started));
console.log(started);
for(let i=0;i<30;i++){await pause(5000);const r=await b.evaluate('({state:window.renderState,time:window.renderTime,frames:window.framesDrawn})');console.log(r.result?.value);if(r.result?.value?.state==='complete')break;}
const data=await b.evaluate('window.videoBase64');if(!data.result?.value)throw Error('Missing encoded video');
const name=duration===90?'Medsy-Product-Film-v2-90s.mp4':'Medsy-Motion-Sample-15s.mp4';
fs.writeFileSync('artifacts/product-film-v2/'+name,Buffer.from(data.result.value,'base64'));
console.log('Saved',name);b.close();
