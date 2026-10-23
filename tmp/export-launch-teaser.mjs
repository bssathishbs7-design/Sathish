import {browser,pause} from './cdp.mjs';import {writeFileSync} from 'node:fs';
const b=await browser();await b.call("Page.reload");await pause(600);
const expression=`(async()=>{
const {canvas,render,ready}=await import('/docs/video/medsy-launch/render.js');
await ready;const {score}=await import('/docs/video/medsy-launch/audio.js');
const ac=new AudioContext();window.teaserAudio=ac;await ac.resume();const dest=ac.createMediaStreamDestination();score(ac,dest,30);
const stream=canvas.captureStream(30);dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t));
const rec=new MediaRecorder(stream,{mimeType:'video/mp4;codecs=avc1.42001E,mp4a.40.2',videoBitsPerSecond:10000000,audioBitsPerSecond:192000}),chunks=[];
rec.ondataavailable=e=>chunks.push(e.data);const stopped=new Promise(r=>rec.onstop=r);rec.start(1000);const began=performance.now(),sources=[1,18,53,72,86,100];
await new Promise((resolve,reject)=>{function tick(now){try{const t=Math.max(0,Math.min(29.999,(now-began)/1000)),i=Math.floor(t/5);render(sources[i]+t%5);const c=canvas.getContext('2d'),fade=Math.max(0,1-(t%5)/.3,1-(5-t%5)/.3);c.fillStyle='#081f17';c.globalAlpha=fade;c.fillRect(0,0,1920,1080);c.globalAlpha=1;if(now-began<30000)requestAnimationFrame(tick);else resolve()}catch(error){reject(error)}}requestAnimationFrame(tick)});
rec.stop();await stopped;stream.getTracks().forEach(t=>t.stop());await ac.close();const blob=new Blob(chunks,{type:'video/mp4'});return await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result.split(',')[1]);fr.readAsDataURL(blob)})})()`;
console.log('Rendering 30-second marketing cut.');const pending=b.call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});await pause(1000);await b.call('Runtime.evaluate',{expression:'window.teaserAudio.resume()',userGesture:true});const r=await pending;if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));writeFileSync('docs/video/medsy-launch/medsy-marketing-30s.mp4',Buffer.from(r.result.value,'base64'));console.log('30-second cut saved.');b.close();

