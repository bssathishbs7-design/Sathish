import fs from 'node:fs';import {chapters} from '../docs/video/medsy-film-104/story.js';
function stamp(t){return `00:${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')},000`}
fs.writeFileSync('docs/video/medsy-film-104/captions.srt',chapters.map((c,i)=>`${i+1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.caption}\n`).join('\n'));
if(chapters.at(-1).end!==104)throw Error('Wrong runtime');for(let i=1;i<chapters.length;i++)if(chapters[i-1].end!==chapters[i].start)throw Error('Timeline gap');console.log('104-second contiguous timeline and caption file validated.');
