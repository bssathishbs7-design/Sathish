import {browser,pause} from './cdp.mjs';import fs from 'node:fs';const b=await browser();await b.call('Page.navigate',{url:'http://127.0.0.1:5206/docs/video/medsy-opening-v2/index.html'});await pause(600);console.log(await b.evaluate('window.openingReady'));
for(const [i,t]of [1.5,4,6.3,8.7,10.8,13.8].entries()){const r=await b.evaluate(`window.seekOpening(${t});document.querySelector('canvas').toDataURL().split(',')[1]`);fs.writeFileSync(`docs/video/medsy-opening-v2/frame-${i}.png`,Buffer.from(r.result.value,'base64'))}
b.close();
