import {browser,pause} from './cdp.mjs';
import {writeFileSync} from 'node:fs';
const b=await browser();await b.call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await b.call('Page.navigate',{url:'http://localhost:5199/docs/video/medsy-launch/index.html'});await pause(1200);
console.log(await b.evaluate('window.filmReady'));
for(const [name,time] of [['blueprint',22],['skills',60],['logbook',80],['closing',104]]){
 await b.evaluate(`window.seekFilm(${time})`);const data=(await b.evaluate(`document.querySelector('canvas').toDataURL('image/png').split(',')[1]`)).result.value;
 writeFileSync(`docs/video/medsy-launch/${name}-frame.png`,Buffer.from(data,'base64'));
}
b.close();
