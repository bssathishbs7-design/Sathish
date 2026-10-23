import {browser,pause} from './cdp.mjs';
const b=await browser();await b.call('Page.navigate',{url:'http://localhost:5199/docs/video/medsy-launch/index.html'});await pause(500);
console.log(await b.evaluate(`(async()=>{const v=document.createElement('video');v.id='reference';v.muted=true;v.preload='auto';v.src='/tmp/nivo-reference.mp4';document.body.append(v);await new Promise((r,j)=>{v.onloadeddata=r;v.onerror=()=>j(Error(v.error.message))});return {duration:v.duration,width:v.videoWidth,height:v.videoHeight}})()`));b.close();
