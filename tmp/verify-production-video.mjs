import fs from 'node:fs';
import {browser,pause} from './cdp.mjs';
const b=await browser();
await b.call('Page.navigate',{url:'http://127.0.0.1:5206/docs/video/production-104/watch.html'});
await pause(1000);
const result=await b.evaluate(`(async()=>{
  const video=document.querySelector('video');
  if(video.readyState<1)await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(new Error(video.error.message));});
  const metadata={duration:video.duration,width:video.videoWidth,height:video.videoHeight,samples:[]};
  for(const time of [1,11,30,48,65,85,102]){
    video.currentTime=time;
    await new Promise((resolve,reject)=>{video.onseeked=resolve;video.onerror=()=>reject(new Error(video.error.message));});
    const canvas=document.createElement('canvas');canvas.width=480;canvas.height=270;
    canvas.getContext('2d').drawImage(video,0,0,480,270);
    metadata.samples.push({time,image:canvas.toDataURL('image/png').split(',')[1]});
  }
  video.currentTime=0;
  return metadata;
})()`);
if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));
const metadata=result.result.value;
for(const sample of metadata.samples){fs.writeFileSync(`tmp/production-video-${sample.time}.png`,Buffer.from(sample.image,'base64'));delete sample.image;}
fs.writeFileSync('docs/video/production-104/out/video-verification.json',JSON.stringify(metadata,null,2));
console.log(JSON.stringify(metadata));
b.close();
