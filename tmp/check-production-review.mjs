import fs from 'node:fs';
import {browser,pause} from './cdp.mjs';
const b=await browser();
await b.call('Page.enable');
await b.call('Page.navigate',{url:'http://127.0.0.1:5206/docs/video/production-104/index.html'});
await pause(1200);
for(const width of [1440,768,390]){
  await b.call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
  await b.evaluate('document.querySelectorAll("img").forEach(i=>i.loading="eager"); document.fonts.ready');
  await pause(600);
  const result=await b.evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,images:document.images.length,broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),shots:document.querySelectorAll(".shot").length,title:document.title})');
  console.log(JSON.stringify(result.result?.value));
  if(width===1440){const screen=await b.call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('tmp/production-review-desktop.png',Buffer.from(screen.data,'base64'));}
}
await b.call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
b.close();
