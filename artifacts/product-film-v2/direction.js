/* Reference-led second direction. Screens use ONE scale on both axes.
 * No perspective slices, skew, synthetic browser chrome, or stretched crops. */
const audit=new Map();
function plate(name,x,y,boxW,boxH,u,crop=[270,120,1310,700],options={}){
 const im=assets[name],p=ease(u/.8),scale=Math.min(boxW/crop[2],boxH/crop[3]);
 const w=crop[2]*scale,h=crop[3]*scale,key=[name,...crop,w,h].join('|');
 audit.set(key,{name,sourceRatio:crop[2]/crop[3],displayRatio:w/h,error:Math.abs(crop[2]/crop[3]-w/h)});
 if(!screenCache.has(key)){const c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);c.getContext('2d').drawImage(im,...crop,0,0,c.width,c.height);screenCache.set(key,c)}
 const drift=options.still?0:Math.sin(u*.45)*5;
 ctx.save();ctx.globalAlpha*=p;ctx.translate(x+boxW/2+(1-p)*(options.fromX||0),y+boxH/2+(1-p)*80+drift);
 const z=1+(options.push||.015)*clamp(u/5);ctx.scale(z,z);ctx.rotate((options.angle||0)*(1-p));
 ctx.shadowColor='#002b1d45';ctx.shadowBlur=24;ctx.shadowOffsetY=18;rr(-w/2-2,-h/2-2,w+4,h+4,20,'#e0f7eb');ctx.shadowColor='transparent';
 ctx.beginPath();ctx.roundRect(-w/2,-h/2,w,h,18);ctx.clip();ctx.drawImage(screenCache.get(key),-w/2,-h/2,w,h);ctx.restore();
}
function words(s,y,size,u,dark=true,accent=-1){
 const parts=s.split(' ');ctx.font=`700 ${size}px Inter, "Segoe UI", Arial`;
 const widths=parts.map(s=>ctx.measureText(s).width),gap=size*.27;let x=(W-widths.reduce((a,b)=>a+b,0)-gap*(parts.length-1))/2;
 parts.forEach((word,i)=>{const p=ease((u-i*.095)/.55);ctx.save();ctx.beginPath();ctx.rect(x-10,y-size-10,widths[i]+20,size+30);ctx.clip();ctx.globalAlpha*=p;
 text(word,x,y+size*(1-p),size,i===accent?(dark?C.mint:C.forest):(dark?'#fff':C.ink),700);ctx.restore();x+=widths[i]+gap});
}
function kicker(s,u,dark){ctx.save();ctx.globalAlpha=ease(u/.4);text(s,960,165,25,dark?C.mint:C.forest,600,'center');ctx.restore()}
function atmosphere(t,dark){ctx.fillStyle=dark?'#052d22':'#f7fcf9';ctx.fillRect(0,0,W,H);const g=ctx.createRadialGradient(950+Math.sin(t*.15)*300,500,10,960,540,1100);g.addColorStop(0,dark?'#116644':'#ddf9ea');g.addColorStop(1,dark?'#052d22':'#f7fcf9');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 ctx.save();ctx.globalAlpha=dark?.23:.12;ctx.strokeStyle=dark?C.mint:C.forest;ctx.lineWidth=4;
 for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-200,900-i*110);ctx.bezierCurveTo(400,500+Math.sin(t*.3+i)*100,1000,1100,2100,50+i*170);ctx.stroke()}ctx.restore();
 ctx.drawImage(assets[dark?'logo-dark':'logo'],78,44,155,50);
}
function ribbon(a,b,u){const p=ease(u/.9);ctx.strokeStyle='#5fe8b155';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.bezierCurveTo(960,a[1]-140,960,b[1]+140,b[0],b[1]);ctx.stroke();const x=lerp(a[0],b[0],p),y=lerp(a[1],b[1],p);ctx.shadowColor=C.mint;ctx.shadowBlur=18;ctx.fillStyle=C.mint;ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
function feature(label,headline,name,u,t,dark,crop,detail){
 kicker(label,u,dark);words(headline,270,70,u-.08,dark,headline.split(' ').length-1);
 const q=ease((u-2.8)/.9);
 if(detail&&u>2.8){plate(name,160-80*q,350,1600,650,u-.25,crop,{push:.02});ctx.save();ctx.globalAlpha=.15*q;ctx.fillStyle=dark?C.dark:'#fff';ctx.fillRect(80,330,1760,680);ctx.restore();plate(name,470,460,980,470,u-2.8,detail,{fromX:220,angle:-.04});}
 else plate(name,140,340,1640,660,u-.25,crop,{fromX:100,angle:.035,push:.03});
}
window.drawFrame=t=>{
 t=clamp(t,0,89.999);const sc=scenes.find(s=>t>=s.s&&t<s.e),u=t-sc.s;
 const dark=['hook','hook2','brand','studentSkills','admin','correlation','bank','studentAssessment','practiceDetail','connected','end'].includes(sc.kind);
 atmosphere(t,dark);
 switch(sc.kind){
 case 'hook':kicker('Medsy',u,true);words('Every skill.',440,150,u,true,1);words('Every step forward.',610,108,u-.6,true,2);break;
 case 'hook2':words('One connected',450,125,u,true);words('learning journey.',610,125,u-.25,true,1);break;
 case 'brand':{const p=ease(u/.9);ctx.save();ctx.translate(960,440);ctx.scale(.75+.25*p,.75+.25*p);ctx.drawImage(assets['logo-dark'],-330,-107,660,214);ctx.restore();words('Medical education, made easy.',710,62,u-.5,true,3);break}
 case 'two':kicker('Faculty and students',u,false);words('Connected from the start.',270,76,u-.1,false,0);plate('skills',100,390,820,540,u-.25,[275,270,1290,500],{fromX:-150});plate('studentSkills',1000,390,820,540,u-.45,[275,390,1300,500],{fromX:150});ribbon([880,660],[1040,660],u-1);break;
 case 'skills':feature('Skills','Prepare. Assign. Evaluate.','skills',u,t,false,[280,270,1280,410],[300,400,1250,190]);break;
 case 'studentSkills':feature('Skills → My Skill Activity','A clear next step.','studentSkills',u,t,true,[275,135,1300,690],[290,420,1150,330]);break;
 case 'logbook':kicker('My Logbook',u,false);words('Record. Reflect. Grow.',265,82,u-.05,false,2);plate('logbook',110,360,1120,600,u-.25,[275,130,1300,700],{fromX:-150});plate('entry-details',1210,350,540,640,u-.7,[810,270,600,680],{fromX:190});break;
 case 'admin':kicker('My Logbook → Admin Logbook',u,true);words('Feedback moves learning forward.',265,69,u-.05,true,1);plate('admin',100,360,1240,620,u-.25,[275,140,1300,650],{fromX:-100});plate('review',950,540,850,400,u-1,[800,0,610,285],{fromX:250});ribbon([680,900],[1320,900],u-1.5);break;
 case 'approval':kicker('Approval Queue',u,false);words('Review with clarity.',270,90,u-.05,false,2);plate('approval',560,350,800,600,u-.3,[280,185,362,275],{push:.04});['Submitted','In review','Decision'].forEach((s,i)=>{const p=ease((u-1-i*.5)/.5);ctx.save();ctx.globalAlpha=p;rr(240+i*500,955,440,60,30,i===2?C.forest:'#e2f6eb');text(s,460+i*500,995,28,i===2?'#fff':C.forest,600,'center');ctx.restore()});break;
 case 'correlation':feature('Correlation Rating','Make priorities clear.','correlation',u,t,true,[280,140,1280,690]);break;
 case 'matrix':feature('Correlation Rating','Give every rating context.','matrix',u,t,false,[280,300,1280,600],[285,340,1260,330]);break;
 case 'questions':kicker('Assessment Suite / My Questions',u,false);words('Your questions. Your expertise.',270,77,u-.05,false,3);plate('author',180,350,1560,650,u-.25,[275,125,1300,850],{fromX:120});if(u>2){ctx.save();ctx.globalAlpha=ease((u-2)/.6);rr(260,590,1400,250,26,C.forest);text('Which anatomical plane divides the body',310,665,43,'#fff');text('into right and left portions?',310,725,43,'#fff');rr(310,762,630*ease((u-2.5)/.7),48,20,C.mint);if(u>3)text('A   Sagittal plane',340,797,28,C.ink);ctx.restore()}break;
 case 'bank':feature('Assessment Suite / Question Bank','Find the right questions.','bankList',u,t,true,[275,175,1300,650],[285,250,1270,320]);break;
 case 'assessment':feature('Assessment Suite / Assessment','Build your assessment.','build',u,t,false,[0,80,1580,780],[1230,140,350,600]);break;
 case 'studentAssessment':feature('My Assessment','Ready for your students.','studentAssessment',u,t,true,[275,130,1300,700]);break;
 case 'studentDetail':kicker('My Assessment',u,false);words('Know what comes next.',270,84,u-.05,false,3);plate('studentAssessment',250,360,1420,630,u-.25,[280,455,850,400],{push:.04});break;
 case 'practice':feature('My Practice','Keep your learning moving.','practice',u,t,false,[275,130,1300,690]);break;
 case 'practiceDetail':kicker('My Practice',u,true);words('Practise.',400,135,u,true);words('Review. Improve.',560,105,u-.2,true,1);plate('practice',480,650,960,330,u-.4,[285,465,1000,340]);break;
 case 'connected':words('One connected learning journey.',265,76,u,true,1);['skills','logbook','bankList','studentAssessment','practice'].forEach((n,i)=>{const p=ease((u-i*.12)/.7);const a=(i-2)*.12;ctx.save();ctx.translate(960,650);ctx.rotate(a);plate(n,(i-2)*310-250,-180+Math.abs(i-2)*40,500,350,u-i*.12,[275,135,1300,750],{fromX:(i-2)*120});ctx.restore()});break;
 case 'end':ctx.drawImage(assets['logo-dark'],700,210,520,168);words('Medical education,',525,92,u,true);words('made easy.',640,104,u-.2,true,1);rr(740,740,440,80,40,C.mint);text('Explore Medsy',960,792,32,C.ink,700,'center');text('Music: “District Four” — Kevin MacLeod (incompetech.com)',960,950,19,C.muted,400,'center');text('CC BY 4.0 · creativecommons.org/licenses/by/4.0/ · Edited excerpt',960,986,18,C.muted,400,'center');break;
 }
 // Brief light sweep replaces the repeated solid-colour shutter.
 if(u<.38&&sc.s){const p=clamp(u/.38),x=-500+2900*p,g=ctx.createLinearGradient(x-360,0,x+360,0);g.addColorStop(0,'#5fe8b100');g.addColorStop(.5,'#baffdfaa');g.addColorStop(1,'#5fe8b100');ctx.fillStyle=g;ctx.fillRect(x-360,0,720,H)}
};
window.aspectAudit=()=>[...audit.values()];window.drawFrame(0);
