import fs from 'node:fs';
for(const name of ['render.js','story.js','index.html','delivery.html']){
 const path='docs/video/medsy-launch/'+name;
 let s=fs.readFileSync(path,'utf8').replace(/[^\x00-\x7F]/g,'-');
 fs.writeFileSync(path,s,'utf8');
}
