import fs from 'node:fs';
const path='docs/video/medsy-launch/render.js';let s=fs.readFileSync(path,'utf8');
s=s.replace("const phase=Math.min(2,Math.floor(t/6));const titles", "const phase=Math.min(2,Math.floor(t/6)),local=Math.min(t-phase*6,5.99);const titles").replaceAll('t%6>','local>');
s=s.replace("fadeOut=ease((time-(s.end-.4))/.4)","fadeOut=s.kind==='close'?0:ease((time-(s.end-.4))/.4)");
s=s.replace("if(['open','meet','overview'].includes(s.kind))tiles(t,s.kind==='overview');", "if(s.kind==='open')opening(t);if(['meet','overview'].includes(s.kind))tiles(t,s.kind==='overview');");
s += `\nfunction opening(t){
 c.save();const p=ease(t/1.6);c.translate(960,605);c.scale(.9+.1*p,.9+.1*p);
 for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,0,240+i*115,110+i*50,-.13,0,Math.PI*2);c.strokeStyle='#5fe8b1'+['44','22','11'][i];c.lineWidth=2;c.stroke()}
 c.shadowColor='#5fe8b155';c.shadowBlur=70;box(-150,-65,300,130,P.forest,36,'#5fe8b166');c.shadowColor='transparent';logo(true,-110,-36,220);
 [['Assessments',-650,-140],['Skills',400,-70],['Logbook',-85,170]].forEach(([label,x,y],i)=>{enter(t,.6+i*.3,()=>{box(x,y,250,76,'#143e2c',22,'#5fe8b144');text(label,x+30,y+49,28,500,P.white)})});c.restore();
}\n`;
fs.writeFileSync(path,s);
