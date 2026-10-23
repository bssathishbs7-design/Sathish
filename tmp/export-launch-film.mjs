import {browser,pause} from './cdp.mjs';
import {writeFileSync} from 'node:fs';
const b=await browser();await b.call('Page.navigate',{url:'http://localhost:5199/docs/video/medsy-launch/index.html'});await pause(1000);await b.evaluate('window.filmReady');
console.log('Rendering 108-second 1920x1080 film with original audio.');
const result=await b.call('Runtime.evaluate',{expression:'window.exportFilm()',awaitPromise:true,returnByValue:true,userGesture:true});
if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));
const data=result.result.value;
writeFileSync('docs/video/medsy-launch/medsy-product-introduction.mp4',Buffer.from(data.base64,'base64'));
console.log(JSON.stringify({bytes:data.bytes,path:'docs/video/medsy-launch/medsy-product-introduction.mp4'}));b.close();

